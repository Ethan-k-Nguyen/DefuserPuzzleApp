import { defineStore } from 'pinia';
import { ref } from 'vue';
import { socket } from '../socket';

interface TeamState {
  score: number;
  lives: number;
  lockoutUntil: number;
  currentPuzzleId: number | null;
}

interface Puzzle {
  id: number;
  title: string;
  type: string;
  data: Record<string, unknown>;
  solution: string;
  claimedBy: 'A' | 'B' | null;
}

interface GameState {
  phase: 'mode-selection' | 'lobby' | 'playing' | 'finished';
  mode: 'Timer' | 'Survival' | 'Multiplayer' | 'Zoom' | null;
  puzzles: Puzzle[];
  teams: {
    A: TeamState;
    B: TeamState;
  };
  winner: 'A' | 'B' | null;
  deviceSettings: {
    serialNumber: string;
    ports: string[];
  };
  timer: number;
  elapsedTime: number;
  localIp: string;
}

export const useGameStore = defineStore('game', () => {
  const state = ref<GameState | null>(null);

  socket.on('gameState', (newState: GameState) => {
    state.value = newState;
  });

  function selectMode(mode: string) {
    socket.emit('selectMode', mode);
  }

  function startGame() {
    socket.emit('startGame');
  }

  function resetGame() {
    socket.emit('resetGame');
  }

  function selectPuzzle(team: 'A' | 'B', puzzleId: number) {
    socket.emit('selectPuzzle', { team, puzzleId });
  }

  function submitAnswer(team: 'A' | 'B', answer: string) {
    socket.emit('submitAnswer', { team, answer });
  }

  return { state, selectMode, startGame, resetGame, selectPuzzle, submitAnswer };
});
