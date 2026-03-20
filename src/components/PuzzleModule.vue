<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';

interface PuzzleData {
  word?: string;
  shift?: number;
  wires?: string[];
  items?: { color: string; text: string }[];
  grid?: boolean[][];
  flags?: string[];
  columns?: string[][];
  display?: string;
  buttons?: string[];
  symbols?: string[];
}

const props = defineProps<{
  puzzle: {
    type: string;
    data: PuzzleData;
    id: number;
    title: string;
  }
}>();

const isMorseLit = ref(false);
let currentMorseAbortController: AbortController | null = null;

const MORSE_MAP: Record<string, string> = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..'
};

const UNIT = 250; // ms

async function playMorse(signal: AbortSignal) {
  if (props.puzzle.type !== 'Morse Buzz') return;
  const word = props.puzzle.data.word;
  if (!word) return;

  while (!signal.aborted) {
    for (const char of word) {
      if (signal.aborted) return;
      const code = MORSE_MAP[char.toUpperCase()];
      if (!code) continue;

      for (let i = 0; i < code.length; i++) {
        if (signal.aborted) return;
        isMorseLit.value = true;
        await new Promise(r => setTimeout(r, code[i] === '.' ? UNIT : UNIT * 3));
        isMorseLit.value = false;
        if (i < code.length - 1) {
          await new Promise(r => setTimeout(r, UNIT)); // gap between elements
        }
      }
      await new Promise(r => setTimeout(r, UNIT * 3)); // gap between letters
    }
    await new Promise(r => setTimeout(r, UNIT * 7)); // gap between words
  }
}

function startMorse() {
  if (currentMorseAbortController) {
    currentMorseAbortController.abort();
  }
  isMorseLit.value = false;
  if (props.puzzle.type === 'Morse Buzz') {
    currentMorseAbortController = new AbortController();
    playMorse(currentMorseAbortController.signal);
  }
}

watch(() => props.puzzle.id, () => {
  startMorse();
}, { immediate: true });

onMounted(() => {
  // watch with immediate handles initial start
});

onUnmounted(() => {
  if (currentMorseAbortController) {
    currentMorseAbortController.abort();
  }
  isMorseLit.value = false;
});
</script>

<template>
  <div class="puzzle-render">
    <!-- 2. Cipher Shift -->
    <div v-if="puzzle.type === 'Cipher Shift'" class="cipher-shift">
      <div class="cipher-display">
        <div class="word">{{ puzzle.data.word }}</div>
        <div class="shift">Frequency Numeral: {{ puzzle.data.shift }}</div>
      </div>
    </div>

    <!-- 3. Wires -->
    <div v-else-if="puzzle.type === 'Wires'" class="wires-render">
      <div class="wires-box">
        <div v-for="(color, i) in puzzle.data.wires" :key="i" class="wire-wrapper">
          <div class="wire-line" :style="{ backgroundColor: color }"></div>
          <div class="wire-index">{{ i + 1 }}</div>
        </div>
      </div>
    </div>

    <!-- 7. Color Clash -->
    <div v-else-if="puzzle.type === 'Color Clash'" class="color-clash">
      <div v-for="(item, i) in puzzle.data.items" :key="i" 
        class="clash-item" :style="{ color: item.color }">
        {{ item.text }}
      </div>
    </div>

    <!-- 8. LightGrid -->
    <div v-else-if="puzzle.type === 'LightGrid'" class="lightgrid">
      <div v-for="(row, r) in puzzle.data.grid" :key="r" class="light-row">
        <div v-for="(cell, c) in row" :key="c" 
          class="light" :class="{ lit: cell }">
        </div>
      </div>
    </div>

    <!-- Signal Flags -->
    <div v-else-if="puzzle.type === 'Signal Flags'" class="signal-flags">
      <div v-for="(color, i) in puzzle.data.flags" :key="i" class="flag-pole">
        <div class="pole"></div>
        <div class="flag" :style="{ backgroundColor: color.toLowerCase() }"></div>
      </div>
    </div>

    <!-- Morse Buzz -->
    <div v-else-if="puzzle.type === 'Morse Buzz'" class="morse-buzz">
      <div class="sconce">
        <div class="light-bulb" :class="{ lit: isMorseLit }"></div>
        <div class="sconce-base"></div>
      </div>
    </div>

    <!-- Worderizer -->
    <div v-else-if="puzzle.type === 'Worderizer'" class="worderizer">
      <div class="column-grid">
        <div v-for="(col, i) in puzzle.data.columns" :key="i" class="letter-col">
          <div v-for="(char, j) in col" :key="j" class="letter-item">
            {{ char }}
          </div>
        </div>
      </div>
    </div>

    <!-- Who's First -->
    <div v-else-if="puzzle.type === 'Who\'s First'" class="who-first">
      <div class="display-box">{{ puzzle.data.display || '&nbsp;' }}</div>
      <div class="button-grid">
        <div v-for="(btn, i) in puzzle.data.buttons" :key="i" class="whofirst-btn">
          {{ btn }}
        </div>
      </div>
    </div>

    <!-- 4. Symbol Ordering -->
    <div v-else-if="puzzle.type === 'Symbol Ordering'" class="symbol-ordering">
      <div class="symbol-grid">
        <div v-for="(sym, i) in puzzle.data.symbols" :key="i" class="symbol-item">
          {{ sym }}
        </div>
      </div>
    </div>

    <div v-else>
      <pre>{{ JSON.stringify(puzzle.data, null, 2) }}</pre>
    </div>
  </div>
</template>

<style scoped>
.puzzle-render {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-family: monospace;
  transform: scale(1.2); /* Global scale boost */
}

/* 2. Cipher Shift */
.cipher-display {
  text-align: center;
}
.cipher-display .word {
  font-size: 40px;
  letter-spacing: 8px;
  color: #0f0;
}
.cipher-display .shift {
  font-size: 1.2rem;
  margin-top: 10px;
}

/* 3. Wires */
.wires-box {
  display: flex;
  justify-content: space-around;
  align-items: stretch;
  border: 4px solid #555;
  background: #333;
  padding: 20px;
  width: 250px;
  height: 180px;
}
.wire-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.wire-line {
  width: 14px;
  flex: 1;
  border-radius: 7px;
  border: 1px solid rgba(0,0,0,0.3);
  box-shadow: inset 0 0 8px rgba(0,0,0,0.5);
}
.wire-index {
  font-size: 14px;
  color: #aaa;
}

/* 7. Color Clash */
.color-clash {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 1.5rem;
  font-weight: bold;
}

/* 8. LightGrid */
.lightgrid {
  transform: scale(1.5);
}
.light-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.light {
  width: 20px;
  height: 20px;
  background: #333;
  border-radius: 50%;
  border: 1px solid #555;
}
.light.lit {
  background: #fff;
  box-shadow: 0 0 10px #fff, 0 0 20px #fff;
}

/* Signal Flags */
.signal-flags {
  display: flex;
  gap: 30px;
  align-items: flex-end;
  height: 120px;
}
.flag-pole {
  position: relative;
  width: 40px;
  height: 100%;
}
.pole {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: #888;
}
.flag {
  position: absolute;
  top: 10px;
  left: 4px;
  width: 40px;
  height: 30px;
  border: 1px solid rgba(255,255,255,0.2);
}

/* Morse Buzz */
.morse-buzz {
  display: flex;
  justify-content: center;
  align-items: center;
}
.sconce {
  position: relative;
  width: 60px;
  height: 100px;
  background: #444;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  border: 2px solid #666;
}
.light-bulb {
  width: 30px;
  height: 40px;
  background: #222;
  border-radius: 15px 15px 5px 5px;
  border: 2px solid #333;
  transition: background 0.1s, box-shadow 0.1s;
}
.light-bulb.lit {
  background: #ffeb3b;
  box-shadow: 0 0 20px #ffeb3b, 0 0 40px #ffeb3b;
}
.sconce-base {
  width: 40px;
  height: 20px;
  background: #333;
  margin-top: 10px;
  border-radius: 5px;
}

/* Worderizer */
.worderizer {
  display: flex;
  justify-content: center;
}
.column-grid {
  display: flex;
  gap: 15px;
  background: #1a1a1a;
  padding: 15px;
  border: 2px solid #333;
  border-radius: 4px;
}
.letter-col {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.letter-item {
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #333;
  border: 1px solid #444;
  font-weight: bold;
  font-size: 1.1rem;
}

/* Who's First */
.who-first {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}
.display-box {
  width: 200px;
  height: 50px;
  background: #000;
  border: 4px solid #555;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
}
.button-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.whofirst-btn {
  width: 100px;
  height: 40px;
  background: #333;
  border: 2px solid #555;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: bold;
  color: #ccc;
}

/* 4. Symbol Ordering */
.symbol-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  font-size: 60px;
}
</style>
