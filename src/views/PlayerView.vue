<script setup lang="ts">
import { useGameStore } from '../stores/game';
import { computed, ref, onMounted, nextTick } from 'vue';

const props = defineProps<{
  team: 'A' | 'B'
}>();

const gameStore = useGameStore();
const state = computed(() => gameStore.state);
const currentTeamState = computed(() => state.value?.teams[props.team]);

import { socket } from '../socket';

interface Puzzle {
  id: number;
  title: string;
  type: string;
  data: Record<string, unknown>;
  solution: string;
  claimedBy: 'A' | 'B' | null;
}

const terminalInput = ref('');
const inputElement = ref<HTMLInputElement | null>(null);
const terminalLog = ref<{ type: 'input' | 'output' | 'error' | 'success', text: string }[]>([]);
const terminalContainer = ref<HTMLElement | null>(null);

function focusInput() {
  if (inputElement.value) {
    inputElement.value.focus();
  }
}

const showSettingsModal = ref(false);
const showWinModal = ref(false);
const isManualLockout = ref(false);
const deactivationClicks = ref([false, false, false, false]);

const isLockout = computed(() => {
  return isManualLockout.value;
});

function clearLockout(index: number) {
  if (deactivationClicks.value[index]) return; 
  deactivationClicks.value[index] = true;
  
  if (deactivationClicks.value.every(v => v === true)) {
    isManualLockout.value = false;
    deactivationClicks.value = [false, false, false, false];
    
    terminalLog.value.push({ type: 'output', text: 'SYSTEM RECOVERY SUCCESSFUL. TERMINAL ONLINE.' });
    scrollToBottom();
    nextTick(() => focusInput());
  }
}

const scrollToBottom = async () => {
// ... existing scrollToBottom ...
  await nextTick();
  if (terminalContainer.value) {
    terminalContainer.value.scrollTop = terminalContainer.value.scrollHeight;
  }
};

function handleCommand() {
  const cmd = terminalInput.value.trim();
  if (!cmd) return;

  // Add input to log
  terminalLog.value.push({ type: 'input', text: `> ${cmd}` });

  if (cmd.toLowerCase() === '/settings') {
    showSettingsModal.value = true;
    terminalLog.value.push({ type: 'output', text: 'ACCESSING DEVICE SETTINGS...' });
  } else if (cmd.toLowerCase() === '/thaonguyen') {
    terminalLog.value.push({ type: 'output', text: '--- DEBUG: MASTER OVERRIDE ---' });
    if (state.value && state.value.puzzles) {
      state.value.puzzles.forEach((p: Puzzle) => {
        terminalLog.value.push({ type: 'output', text: `MOD #${p.id + 1} (${p.title}): ${p.solution}` });
      });
    }
    terminalLog.value.push({ type: 'output', text: '--- END DEBUG ---' });
  } else {
    // Submit as answer
    gameStore.submitAnswer(props.team, cmd);
  }

  terminalInput.value = '';
  scrollToBottom();
}

// Global results listener
socket.on('answerResult', (res: { correct: boolean }) => {
  if (res.correct) {
    terminalLog.value.push({ type: 'success', text: 'ACCESS GRANTED. MODULE DEACTIVATED.' });
  } else {
    terminalLog.value.push({ type: 'error', text: 'ERROR: INVALID CREDENTIALS. SECURITY LOCK TRIGGERED.' });
    isManualLockout.value = true;
  }
  scrollToBottom();
});

const welcomeInitialized = ref(false);
import { watch } from 'vue';

watch(() => state.value?.mode, (newMode) => {
  if (newMode && !welcomeInitialized.value) {
    const welcomeText = newMode === 'Multiplayer' 
      ? `TERMINAL INITIALIZED. WELCOME TEAM ${props.team}.`
      : 'TERMINAL INITIALIZED.';
    terminalLog.value.push({ type: 'output', text: welcomeText });
    terminalLog.value.push({ type: 'output', text: 'TYPE COMMAND OR ANSWER. TYPE /settings FOR HARDWARE INFO.' });
    welcomeInitialized.value = true;
  }
}, { immediate: true });

</script>

<template>
  <div class="terminal-wrapper" :class="['team-' + team.toLowerCase()]" v-if="state" @click="focusInput">
    
    <!-- Header: Lives as Circles -->
    <div class="terminal-header">
      <div class="lives-container">
        <div v-for="i in 3" :key="i" class="life-circle" 
          :class="{ filled: i <= (currentTeamState?.lives || 0) }">
        </div>
      </div>
      <div class="glitch-text">{{ state.mode === 'Multiplayer' ? 'CRYPT-OS v1.0.4_' + team : team }}</div>
    </div>

    <!-- Main Terminal Area -->
    <div class="terminal-body" ref="terminalContainer" @click.self="focusInput">
      <div v-for="(log, i) in terminalLog" :key="i" :class="['log-entry', log.type]">
        {{ log.text }}
      </div>
      
      <!-- Input Line (Only if not locked out) -->
      <div v-if="!isLockout && state.phase === 'playing'" class="input-line">
        <span class="prompt">></span>
        <input 
          ref="inputElement"
          v-model="terminalInput" 
          @keyup.enter="handleCommand" 
          autofocus 
          spellcheck="false"
          autocomplete="off"
        />
      </div>
    </div>

    <!-- Lockout Modal: 4 Corners -->
    <div v-if="isLockout" class="modal-overlay">
      <div class="lockout-task-container">
        <div class="corner tl" @click="clearLockout(0)" :class="{ active: deactivationClicks[0] }">X</div>
        <div class="corner tr" @click="clearLockout(1)" :class="{ active: deactivationClicks[1] }">X</div>
        <div class="corner bl" @click="clearLockout(2)" :class="{ active: deactivationClicks[2] }">X</div>
        <div class="corner br" @click="clearLockout(3)" :class="{ active: deactivationClicks[3] }">X</div>
        
        <div class="modal-box alert">
          <h2>SECURITY BREACH</h2>
          <p>MANUAL OVERRIDE REQUIRED</p>
          <div class="status-dots">
            <span v-for="(v, i) in deactivationClicks" :key="i" :class="{ filled: v }"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Settings Modal -->
    <div v-if="showSettingsModal" class="modal-overlay" @click="showSettingsModal = false">
      <div class="modal-box settings" @click.stop>
        <h2>DEVICE HARDWARE</h2>
        <div class="settings-content">
          <p class="serial">SERIAL: {{ state.deviceSettings.serialNumber }}</p>
          <div class="ports-list">
            <div v-for="port in state.deviceSettings.ports" :key="port" class="port-entry">
              <img :src="`/${port}.png`" :alt="port" class="port-icon" />
            </div>
          </div>
        </div>
        <button @click="showSettingsModal = false">CLOSE</button>
      </div>
    </div>

    <!-- Win Modal -->
    <div v-if="showWinModal || state.phase === 'finished'" class="modal-overlay">
      <div class="modal-box win">
        <h1 v-if="state.winner === team">MISSION SUCCESS</h1>
        <h1 v-else>MISSION FAILED</h1>
        <p>TEAM {{ state.winner }} HAS SECURED THE BOMB</p>
        <button @click="gameStore.resetGame">REBOOT SYSTEM</button>
      </div>
    </div>

  </div>
  <div v-else class="loading">ESTABLISHING UPLINK...</div>
</template>

<style scoped>
.terminal-wrapper {
  background: #000;
  height: 100vh;
  padding: 20px;
  display: flex;
  flex-direction: column;
  font-family: 'Courier New', Courier, monospace;
  overflow: hidden;
  position: relative;
}

/* Team Themes */
.team-a { --primary: #ff3333; --glow: rgba(255, 51, 51, 0.5); }
.team-b { --primary: #33aaff; --glow: rgba(51, 170, 255, 0.5); }

.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--primary);
  padding-bottom: 10px;
  margin-bottom: 10px;
  color: var(--primary);
  text-shadow: 0 0 5px var(--glow);
}

.lives-container { display: flex; gap: 10px; }
.life-circle {
  width: 12px;
  height: 12px;
  border: 1px solid var(--primary);
  border-radius: 50%;
}
.life-circle.filled {
  background: var(--primary);
  box-shadow: 0 0 8px var(--primary);
}

.terminal-body {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 50px;
}

.log-entry { margin-bottom: 5px; line-height: 1.2; }
.input { color: #fff; }
.output { color: var(--primary); opacity: 0.8; }
.error { color: #ff3333; font-weight: bold; background: rgba(255,0,0,0.1); }
.success { color: #33ff33; font-weight: bold; }

.input-line {
  display: flex;
  align-items: center;
  gap: 10px;
}
.prompt { color: var(--primary); font-weight: bold; }

input {
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-family: inherit;
  font-size: 1.1em;
  width: 100%;
}

/* Modals */
.modal-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-box {
  background: #000;
  border: 2px solid var(--primary);
  padding: 30px;
  text-align: center;
  color: var(--primary);
  box-shadow: 0 0 20px var(--glow);
  min-width: 300px;
}

.modal-box.alert { border-color: #ff3333; color: #ff3333; }

/* Lockout Corners */
.lockout-task-container {
  position: relative;
  width: 400px;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.corner {
  position: absolute;
  width: 50px;
  height: 50px;
  border: 1px solid #444;
  color: #444;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}
.corner:hover { border-color: #888; color: #888; }
.corner.active { border-color: #ff3333; color: #ff3333; text-shadow: 0 0 10px #ff3333; }

.tl { top: -20px; left: -20px; }
.tr { top: -20px; right: -20px; }
.bl { bottom: -20px; left: -20px; }
.br { bottom: -20px; right: -20px; }

.status-dots {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 15px;
}
.status-dots span {
  width: 8px;
  height: 8px;
  border: 1px solid #ff3333;
  border-radius: 50%;
}
.status-dots span.filled {
  background: #ff3333;
  box-shadow: 0 0 5px #ff3333;
}

.modal-box.settings { border-color: var(--primary); }

.settings-content {
  margin: 20px 0;
  text-align: left;
}

.serial {
  font-size: 1.5em;
  margin-bottom: 20px;
  border-bottom: 1px solid #333;
  padding-bottom: 10px;
}

.ports-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.port-entry {
  display: flex;
  align-items: center;
  gap: 15px;
}

.port-icon {
  width: 80px;
  height: 80px;
  background: black;
  padding: 5px;
  border-radius: 4px;
  border: 1px solid #333;
  object-fit: contain;
}

button {
  margin-top: 20px;
  background: transparent;
  border: 1px solid var(--primary);
  color: var(--primary);
  padding: 10px 20px;
  cursor: pointer;
  font-family: inherit;
}
button:hover {
  background: var(--primary);
  color: #000;
}

.loading {
  background: #000;
  color: #0f0;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: monospace;
}

/* Hide scrollbar but keep functionality */
.terminal-body::-webkit-scrollbar { width: 0; }
</style>
