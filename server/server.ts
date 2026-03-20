import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';
import { generatePuzzles, type DeviceSettings, type Puzzle } from './puzzles.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  }
});

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIp();

type GameMode = 'Timer' | 'Survival' | 'Multiplayer' | 'Zoom' | null;

interface TeamState {
  score: number;
  lives: number;
  lockoutUntil: number;
  currentPuzzleId: number | null;
}

interface GameState {
  phase: 'mode-selection' | 'lobby' | 'playing' | 'finished';
  mode: GameMode;
  puzzles: Puzzle[];
  teams: {
    A: TeamState;
    B: TeamState;
  };
  winner: 'A' | 'B' | null;
  deviceSettings: DeviceSettings;
  timer: number;
  elapsedTime: number; // For Zoom mode
  targetScore: number;
  localIp: string;
}

let gameState: GameState = resetGame();

setInterval(() => {
  if (gameState.phase === 'playing') {
    if (gameState.mode === 'Zoom') {
      gameState.elapsedTime++;
    } else if (gameState.timer > 0) {
      gameState.timer--;
      if (gameState.timer === 0) {
        gameState.phase = 'finished';
        // Determine winner
        if (gameState.mode === 'Multiplayer') {
          if (gameState.teams.A.score > gameState.teams.B.score) gameState.winner = 'A';
          else if (gameState.teams.B.score > gameState.teams.A.score) gameState.winner = 'B';
        } else if (gameState.mode === 'Timer') {
           // If they didn't finish 4, they failed (winner remains null)
        }
      }
    }
    io.emit('gameState', gameState);
  }
}, 1000);

function resetGame(mode: GameMode = null): GameState {
  const deviceSettings = generateDeviceSettings();
  let initialTimer = 600;
  let phase: GameState['phase'] = 'mode-selection';
  let puzzleCount = 9;
  let targetScore = 5;

  if (mode === 'Timer') {
    initialTimer = 90; // 1:30
    phase = 'lobby';
    puzzleCount = 4;
    targetScore = 4;
  } else if (mode === 'Survival') {
    initialTimer = 180; // 3 minutes
    phase = 'lobby';
    puzzleCount = 1; // Start with just one
    targetScore = 999; // Essentially infinite
  } else if (mode === 'Multiplayer') {
    initialTimer = 600; // 10 minutes
    phase = 'lobby';
    puzzleCount = 9;
    targetScore = 5;
  } else if (mode === 'Zoom') {
    initialTimer = 0; // Stopwatch
    phase = 'lobby';
    puzzleCount = 4;
    targetScore = 4;
  }

  return {
    phase,
    mode,
    puzzles: generatePuzzles(deviceSettings, puzzleCount),
    teams: {
      A: { score: 0, lives: 3, lockoutUntil: 0, currentPuzzleId: null },
      B: { score: 0, lives: 3, lockoutUntil: 0, currentPuzzleId: null }
    },
    winner: null,
    deviceSettings: deviceSettings,
    timer: initialTimer,
    elapsedTime: 0,
    targetScore,
    localIp: localIp
  };
}

function generateDeviceSettings(): DeviceSettings {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  let serial = '';
  for (let i = 0; i < 3; i++) serial += letters.charAt(Math.floor(Math.random() * letters.length));
  for (let i = 0; i < 3; i++) serial += digits.charAt(Math.floor(Math.random() * digits.length));
  
  const portOptions = ['VGAPort', 'ParallelPort', 'S-VideoPort', 'DisplayPort'];
  const ports = [portOptions[Math.floor(Math.random() * portOptions.length)]];
  
  return { serialNumber: serial, ports };
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send current state on connection
  socket.emit('gameState', gameState);

  socket.on('selectMode', (mode: GameMode) => {
    gameState = resetGame(mode);
    io.emit('gameState', gameState);
  });

  socket.on('startGame', () => {
    gameState.phase = 'playing';
    io.emit('gameState', gameState);
  });

  socket.on('resetGame', () => {
    gameState = resetGame();
    io.emit('gameState', gameState);
  });

  socket.on('resetLives', ({ team }: { team: 'A' | 'B' }) => {
    const teamState = gameState.teams[team];
    teamState.lives = 3;
    io.emit('gameState', gameState);
  });

  socket.on('selectPuzzle', ({ team, puzzleId }: { team: 'A' | 'B', puzzleId: number }) => {
    if (gameState.phase !== 'playing') return;
    const teamState = gameState.teams[team];
    if (Date.now() < teamState.lockoutUntil) return;
    
    teamState.currentPuzzleId = puzzleId;
    io.emit('gameState', gameState);
  });

  socket.on('submitAnswer', ({ team, answer }: { team: 'A' | 'B', answer: string }) => {
    if (gameState.phase !== 'playing') return;
    const teamState = gameState.teams[team];
    if (Date.now() < teamState.lockoutUntil) return;

    const normalizedAnswer = answer.toLowerCase().trim();
    if (!normalizedAnswer) return;

    // Search for any unclaimed puzzle that matches this answer
    const matchingPuzzle = gameState.puzzles.find(p => 
      !p.claimedBy && p.solution.toLowerCase().trim() === normalizedAnswer
    );

    if (matchingPuzzle) {
      matchingPuzzle.claimedBy = team;
      teamState.score++;
      
      socket.emit('answerResult', { correct: true, puzzleId: matchingPuzzle.id });

      // Survival Mode: Generate the next puzzle immediately
      if (gameState.mode === 'Survival') {
        const nextPuzzle = generatePuzzles(gameState.deviceSettings, 1)[0];
        nextPuzzle.id = gameState.puzzles.length; // Keep unique IDs
        gameState.puzzles.push(nextPuzzle);
      }
      
      if (gameState.mode !== 'Survival' && teamState.score >= gameState.targetScore) {
        gameState.phase = 'finished';
        gameState.winner = team;
      }
    } else {
      // WRONG ANSWER Logic
      teamState.lives--;
      socket.emit('answerResult', { correct: false });
      
      // We no longer use server-side lockout timers as per user request for manual task
    }

    io.emit('gameState', gameState);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
