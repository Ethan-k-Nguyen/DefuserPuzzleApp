<script setup lang="ts">
import { useGameStore } from '../stores/game';
import { computed } from 'vue';
import PuzzleModule from '../components/PuzzleModule.vue';

const gameStore = useGameStore();
const state = computed(() => gameStore.state);

const teamAScore = computed(() => state.value?.teams.A.score || 0);
const teamBScore = computed(() => state.value?.teams.B.score || 0);
const teamALives = computed(() => state.value?.teams.A.lives || 0);
const teamBLives = computed(() => state.value?.teams.B.lives || 0);

const formattedTime = computed(() => {
  if (!state.value) return '00:00';
  const m = Math.floor(state.value.timer / 60);
  const s = state.value.timer % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
});

const formattedElapsed = computed(() => {
  if (!state.value) return '00:00';
  const m = Math.floor(state.value.elapsedTime / 60);
  const s = state.value.elapsedTime % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
});

const modes = [
  { id: 'Timer', name: 'TIMER', desc: '90 SECONDS TO SOLVE 4 MODULES' },
  { id: 'Survival', name: 'SURVIVAL', desc: '3 MINUTES - SOLVE AS MANY AS POSSIBLE' },
  { id: 'Multiplayer', name: 'PLAY', desc: 'SYSTEM ACCESS INITIALIZED' },
  { id: 'Zoom', name: 'ZOOM', desc: 'STOPWATCH - SOLVE 4 MODULES AS FAST AS POSSIBLE' }
];

const survivalCurrentPuzzle = computed(() => {
  if (state.value?.mode !== 'Survival') return null;
  return state.value.puzzles.find(p => !p.claimedBy);
});

const survivalCount = computed(() => {
  if (state.value?.mode !== 'Survival') return 0;
  return state.value.puzzles.filter(p => p.claimedBy).length;
});
</script>

<template>
  <div class="host-container" v-if="state">
    
    <!-- Phase 0: Mode Selection -->
    <div v-if="state.phase === 'mode-selection'" class="mode-selection">
      <div class="logo-box">
        <h1 class="glitch">BIG HACKER PUZZLE GAMER TIME!!!</h1>
        <p class="subtitle">SELECT MISSION PARAMETERS</p>
      </div>
      <div class="mode-grid">
        <div v-for="mode in modes" :key="mode.id" class="mode-card" @click="gameStore.selectMode(mode.id)">
          <h2>{{ mode.name }}</h2>
          <p>{{ mode.desc }}</p>
        </div>
      </div>
    </div>

    <!-- Phase 1: Lobby (Pre-game) -->
    <div v-else-if="state.phase === 'lobby'" class="lobby">
      <div class="logo-box">
        <h1 class="glitch">{{ state.mode === 'Multiplayer' ? 'MISSION' : state.mode?.toUpperCase() }} INITIALIZED</h1>
        <p class="subtitle" v-if="state.mode === 'Multiplayer'">UPLINK: {{ state.localIp }}:3000</p>
        <p class="subtitle" v-else-if="state">{{ modes.find(m => m.id === (state?.mode || ''))?.desc }}</p>
      </div>
      
      <div class="actions">
        <button @click="gameStore.startGame" class="start-btn">ENGAGE</button>
        <button @click="gameStore.resetGame" class="back-btn">RETURN</button>
      </div>
    </div>

    <!-- Phase 2: Playing -->
    <div v-else-if="state.phase === 'playing' || state.phase === 'finished'" class="game">
      <div class="header">
        <div class="team-info team-a">
          <div class="score">{{ state.mode === 'Survival' ? 'CLEARED: ' + survivalCount : 'SCORE: ' + teamAScore }}</div>
          <div class="lives" v-if="state.mode !== 'Survival'">
            <span v-for="i in 3" :key="i" class="life-dot" :class="{ filled: i <= teamALives }"></span>
          </div>
        </div>
        
        <div class="header-center">
          <div class="timer" :class="{ critical: state.mode !== 'Zoom' && state.timer < 30 }">
            {{ state.mode === 'Zoom' ? formattedElapsed : formattedTime }}
          </div>
          <div class="mode-tag">{{ state.mode }}</div>
        </div>

        <div class="team-info team-b" v-if="state.mode === 'Multiplayer'">
          <div class="score">TEAM B: {{ teamBScore }}</div>
          <div class="lives">
            <span v-for="i in 3" :key="i" class="life-dot" :class="{ filled: i <= teamBLives }"></span>
          </div>
        </div>
        <div class="team-info empty" v-else>
           <button @click="gameStore.resetGame" class="reset-btn">ABORT MISSION</button>
        </div>
      </div>

      <!-- Survival Mode: Single Center Puzzle -->
      <div v-if="state.mode === 'Survival'" class="survival-display">
        <div v-if="survivalCurrentPuzzle" class="puzzle-tile survival-tile">
          <div class="puzzle-content">
            <PuzzleModule :puzzle="survivalCurrentPuzzle" />
            <div class="puzzle-id">SURVIVAL MODULE #{{ survivalCount + 1 }}</div>
          </div>
        </div>
      </div>

      <!-- Default Grid (Timer, Zoom, Multi) -->
      <div v-else class="grid" :class="{ 'grid-2x2': state.puzzles.length <= 4 }">
        <div v-for="puzzle in state.puzzles" :key="puzzle.id" 
          class="puzzle-tile" 
          :class="{ 'claimed-a': puzzle.claimedBy === 'A', 'claimed-b': puzzle.claimedBy === 'B' }">
          <div v-if="!puzzle.claimedBy" class="puzzle-content">
            <PuzzleModule :puzzle="puzzle" />
            <div class="puzzle-id">MODULE #00{{ puzzle.id + 1 }}</div>
          </div>
          <div v-else class="claimed-mark">
            <div class="team-label">{{ puzzle.claimedBy === 'A' ? 'DEACTIVATED' : 'BY BRAVO' }}</div>
            <div class="status-label">DONE</div>
          </div>
        </div>
      </div>

      <div class="footer" v-if="state.mode === 'Multiplayer'">
        <div class="system-status">
          NODE: <span class="pulse">READY</span> | {{ state.localIp }}:3000
        </div>
      </div>

      <div v-if="state.phase === 'finished'" class="winner-overlay">
        <div class="winner-box">
          <h1 v-if="state.mode === 'Multiplayer' && state.winner">TEAM {{ state.winner }} WINS</h1>
          <h1 v-else-if="state.mode === 'Survival'">TIME UP! FINAL COUNT: {{ survivalCount }}</h1>
          <h1 v-else-if="state.mode === 'Zoom'">MISSION COMPLETE! TIME: {{ formattedElapsed }}</h1>
          <h1 v-else-if="state.mode === 'Timer' && teamAScore >= 4">SUCCESS!</h1>
          <h1 v-else>MISSION FAILED</h1>
          
          <button @click="gameStore.resetGame">REBOOT SYSTEM</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.host-container {
  font-family: 'Courier New', Courier, monospace;
  background: #050505;
  color: #0f0;
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

/* Mode Selection */
.mode-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30px;
  width: 900px;
}
.mode-card {
  border: 2px solid #222;
  padding: 40px;
  cursor: pointer;
  transition: all 0.2s;
  background: #0a0a0a;
  text-align: center;
}
.mode-card:hover {
  border-color: #0f0;
  background: #111;
  box-shadow: 0 0 25px rgba(0,255,0,0.2);
  transform: translateY(-5px);
}
.mode-card h2 { margin: 0 0 15px 0; color: #0f0; font-size: 2rem; letter-spacing: 2px; }
.mode-card p { opacity: 0.6; font-size: 1rem; }

/* Lobby Styling */
.logo-box { margin-bottom: 60px; text-align: center; }
.glitch { font-size: 4rem; font-weight: 900; letter-spacing: 12px; color: #0f0; text-shadow: 0 0 15px #0f0; }
.subtitle { opacity: 0.6; letter-spacing: 6px; margin-top: 15px; text-transform: uppercase; }

.actions { display: flex; gap: 30px; }
.start-btn {
  background: #0f0; color: #000; border: none; padding: 25px 60px;
  font-size: 24px; font-weight: bold; cursor: pointer; transition: all 0.2s;
  box-shadow: 0 0 20px rgba(0,255,0,0.3);
}
.start-btn:hover { background: #fff; box-shadow: 0 0 30px #fff; }
.back-btn { background: transparent; border: 1px solid #444; color: #444; padding: 25px 40px; cursor: pointer; text-transform: uppercase; font-family: inherit; }
.back-btn:hover { border-color: #fff; color: #fff; }

/* Game Styling */
.game { width: 100%; height: 100%; padding: 40px; display: flex; flex-direction: column; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }

.team-info { width: 350px; padding: 20px; border: 2px solid #333; background: rgba(255,255,255,0.02); }
.team-a { border-color: #f33; color: #f33; }
.team-b { border-color: #3af; color: #3af; }
.team-info.empty { border: none; display: flex; align-items: center; justify-content: flex-end; background: none; }
.score { font-size: 2.2rem; font-weight: 900; margin-bottom: 15px; }

.lives { display: flex; gap: 12px; }
.life-dot { width: 16px; height: 16px; border: 2px solid currentColor; border-radius: 50%; }
.life-dot.filled { background: currentColor; box-shadow: 0 0 12px currentColor; }

.header-center { text-align: center; }
.timer { font-size: 6rem; font-weight: 900; color: #fff; line-height: 1; text-shadow: 0 0 20px rgba(255,255,255,0.2); }
.timer.critical { color: #f33; animation: blink 1s infinite; text-shadow: 0 0 20px #f33; }
.mode-tag { font-size: 14px; opacity: 0.4; letter-spacing: 8px; margin-top: 10px; text-transform: uppercase; }

.grid { flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; }
.grid-2x2 { grid-template-columns: repeat(2, 1fr); max-width: 1400px; margin: 0 auto; width: 100%; }

.survival-display { flex: 1; display: flex; align-items: center; justify-content: center; }
.survival-tile { width: 600px !important; height: 450px !important; }

.puzzle-tile { 
  background: #0a0a0a; 
  border: 3px solid #222; 
  position: relative; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  padding: 30px;
  transition: all 0.3s;
}
.grid-2x2 .puzzle-tile { height: auto; min-height: 350px; }

.puzzle-id { position: absolute; top: 15px; left: 15px; font-size: 12px; opacity: 0.4; letter-spacing: 2px; }

.claimed-a { background: rgba(255,0,0,0.15); border-color: #f33; box-shadow: inset 0 0 30px rgba(255,0,0,0.1); }
.claimed-b { background: rgba(0,170,255,0.15); border-color: #3af; box-shadow: inset 0 0 30px rgba(0,170,255,0.1); }

.claimed-mark { text-align: center; }
.team-label { font-size: 1.5rem; opacity: 0.8; letter-spacing: 4px; }
.status-label { font-size: 4rem; font-weight: 900; margin-top: 10px; }

.footer { margin-top: 30px; font-size: 16px; opacity: 0.5; text-align: center; letter-spacing: 2px; }

@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.pulse { animation: pulse 2s infinite; color: #fff; }

.winner-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.98);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.winner-box { border: 6px solid #0f0; padding: 80px; text-align: center; background: #000; box-shadow: 0 0 50px rgba(0,255,0,0.2); }
.winner-box h1 { font-size: 5rem; margin-bottom: 30px; letter-spacing: 5px; }
.winner-box p { font-size: 1.5rem; margin-bottom: 40px; opacity: 0.8; }
.winner-box button { background: #0f0; border: none; padding: 20px 50px; font-size: 1.5rem; font-weight: bold; cursor: pointer; transition: all 0.2s; }
.winner-box button:hover { background: #fff; }

.reset-btn { background: #222; color: #888; border: 1px solid #333; padding: 15px 25px; cursor: pointer; font-family: inherit; font-size: 1rem; transition: all 0.2s; }
.reset-btn:hover { background: #f33; color: #000; border-color: #f33; }
</style>
