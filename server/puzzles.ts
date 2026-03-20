import { CIPHER_WORDS } from './cipherWords';

export interface DeviceSettings {
  serialNumber: string;
  ports: string[];
}

export interface PuzzleData {
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
  value?: string;
}

export interface Puzzle {
  id: number;
  title: string;
  type: string;
  data: PuzzleData;
  solution: string;
  claimedBy: 'A' | 'B' | null;
}

const SYMBOL_GRID = [
  ['$', '!', '-', '='],
  [';', '>', '{', '\\'],
  ['~', '^', '+', '/'],
  ['*', '?', '}', '%'],
  ['@', '#', '<', '&']
];
const ALL_SYMBOLS = SYMBOL_GRID.flat();
const COLORS = ["Red", "Blue", "Yellow", "Green", "White", "Black"];

export function generatePuzzles(deviceSettings: DeviceSettings, count: number = 9): Puzzle[] {
  const types = [
    'Cipher Shift', 'Wires', 'Symbol Ordering', 'Color Clash', 'LightGrid', 'Signal Flags', 'Morse Buzz', 'Worderizer', 'Who\'s First'
  ];

  // True random: each slot picks a random type independently
  return Array.from({ length: count }).map((_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    let data: PuzzleData = {};
    let solution: string = "";

    const ALL_COLORS = ["Red", "Orange", "Yellow", "Green", "Blue", "Purple", "White"];

    switch (type) {
      case 'Who\'s First':
        const STEP1_MAP: Record<string, number> = {
          "SAYS": 6, "NOTHING": 2, "": 5, "BLANK": 4, "IT": 1, "DISPLAY": 3,
          "T": 1, "TEE": 5, "TEA": 4, "TI": 1, "WAIT": 2, "BASTE": 2,
          "METTLE": 3, "MEDAL": 5, "METAL": 5, "MEDDLE": 5, "NECKLESS": 6, "GAZE": 5
        };
        const STEP2_LISTS: Record<string, string[]> = {
          "READY": ["YES", "OKAY", "WHAT", "MIDDLE", "LEFT", "PRESS", "RIGHT", "BLANK", "READY", "NO", "FIRST", "UHHH"],
          "FIRST": ["LEFT", "OKAY", "YES", "MIDDLE", "NO", "RIGHT", "NOTHING", "UHHH", "WAIT", "READY", "BLANK", "WHAT"],
          "NO": ["BLANK", "UHHH", "WAIT", "FIRST", "WHAT", "READY", "RIGHT", "YES", "NOTHING", "LEFT", "PRESS", "OKAY"],
          "BLANK": ["WAIT", "RIGHT", "OKAY", "MIDDLE", "BLANK", "PRESS", "READY", "NOTHING", "NO", "WHAT", "LEFT", "UHHH"],
          "NOTHING": ["UHHH", "RIGHT", "OKAY", "MIDDLE", "YES", "BLANK", "NO", "PRESS", "LEFT", "WHAT", "WAIT", "FIRST"],
          "YES": ["OKAY", "RIGHT", "UHHH", "MIDDLE", "FIRST", "WHAT", "PRESS", "READY", "NOTHING", "YES", "LEFT", "BLANK"],
          "WHAT": ["UHHH", "WHAT", "LEFT", "NOTHING", "READY", "BLANK", "MIDDLE", "NO", "OKAY", "FIRST", "WAIT", "YES"],
          "UHHH": ["READY", "NOTHING", "LEFT", "WHAT", "OKAY", "YES", "RIGHT", "NO", "PRESS", "BLANK", "UHHH", "MIDDLE"],
          "LEFT": ["RIGHT", "LEFT", "FIRST", "NO", "MIDDLE", "YES", "BLANK", "WHAT", "UHHH", "WAIT", "PRESS", "READY"],
          "RIGHT": ["YES", "NOTHING", "READY", "PRESS", "NO", "WAIT", "WHAT", "RIGHT", "MIDDLE", "LEFT", "UHHH", "BLANK"],
          "MIDDLE": ["BLANK", "READY", "OKAY", "WHAT", "NOTHING", "PRESS", "NO", "WAIT", "LEFT", "MIDDLE", "RIGHT"],
          "OKAY": ["MIDDLE", "NO", "FIRST", "YES", "UHHH", "NOTHING", "WAIT", "OKAY", "LEFT", "READY", "BLANK", "PRESS"],
          "WAIT": ["UHHH", "NO", "BLANK", "OKAY", "YES", "LEFT", "FIRST", "PRESS", "WHAT", "WAIT", "NOTHING", "READY"],
          "PRESS": ["RIGHT", "MIDDLE", "YES", "READY", "PRESS", "OKAY", "NOTHING", "UHHH", "BLANK", "LEFT", "FIRST"],
          "YOU": ["SURE", "YOU ARE", "YOUR", "YOU'RE", "NEXT", "UH HUH", "UR", "HOLD", "WHAT?", "YOU", "UH UH", "LIKE"],
          "YOU ARE": ["YOUR", "NEXT", "LIKE", "UH HUH", "WHAT?", "DONE", "UH UH", "HOLD", "YOU", "U", "YOU'RE", "SURE"],
          "YOUR": ["UH UH", "YOU ARE", "UH HUH", "YOUR", "NEXT", "UR", "SURE", "U", "YOU'RE", "YOU", "WHAT?", "HOLD"],
          "YOU'RE": ["YOU", "YOU'RE", "UR", "NEXT", "UH UH", "YOU ARE", "U", "YOUR", "WHAT?", "UH HUH", "SURE", "DONE"],
          "SURE": ["YOU ARE", "DONE", "LIKE", "YOU'RE", "YOU", "HOLD", "UH HUH", "UR", "SURE", "U", "WHAT?", "NEXT", "YOUR"]
        };

        const displayOptions = Object.keys(STEP1_MAP);
        const displayWord = displayOptions[Math.floor(Math.random() * displayOptions.length)];
        const targetBtnIdx = STEP1_MAP[displayWord] - 1;
        
        const labelOptions = Object.keys(STEP2_LISTS);
        const targetLabel = labelOptions[Math.floor(Math.random() * labelOptions.length)];
        
        // Build 6 buttons. One must be targetLabel.
        // The final solution is the FIRST word in targetLabel's list that appears on any button.
        const btns = Array(6).fill("");
        btns[targetBtnIdx] = targetLabel;

        const list = STEP2_LISTS[targetLabel];
        // Pick a solution from the list
        const solutionWord = list[Math.floor(Math.random() * Math.min(list.length, 5))];
        solution = solutionWord;

        // Place solution word on a random OTHER button (or it could be the same if it's the first in list)
        let solPlaced = false;
        if (targetLabel === solutionWord) solPlaced = true;
        
        if (!solPlaced) {
          let solIdx;
          do { solIdx = Math.floor(Math.random() * 6); } while (solIdx === targetBtnIdx);
          btns[solIdx] = solutionWord;
        }

        // Fill rest with words that DON'T come before solution in the list
        const forbidden = list.slice(0, list.indexOf(solutionWord));
        const allPossiblePool = [...new Set([...labelOptions, ...Object.values(STEP2_LISTS).flat()])];

        for (let j = 0; j < 6; j++) {
          if (btns[j] !== "") continue;
          let randomWord;
          do {
            randomWord = allPossiblePool[Math.floor(Math.random() * allPossiblePool.length)];
          } while (btns.includes(randomWord) || forbidden.includes(randomWord));
          btns[j] = randomWord;
        }

        data = { display: displayWord, buttons: btns };
        break;
      case 'Worderizer':
        const TARGET_WORDS = ["FLAME", "GHOST", "NIGHT", "POWER", "SMART", "TRICK", "VOICE", "WATER", "ZEBRA", "JOKER"];
        const targetWord = TARGET_WORDS[Math.floor(Math.random() * TARGET_WORDS.length)];
        const winColIdx = Math.floor(Math.random() * 5);
        
        const columns: string[][] = [];
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

        for (let col = 0; col < 5; col++) {
          if (col === winColIdx) {
            // Winning column: word letters + 2 randoms
            const colLetters = targetWord.split('');
            const decoys: string[] = [];
            while (decoys.length < 2) {
              const char = alphabet[Math.floor(Math.random() * 26)];
              if (!colLetters.includes(char)) {
                decoys.push(char);
                colLetters.push(char);
              }
            }
            solution = decoys.sort().join('');
            columns.push(colLetters.sort(() => Math.random() - 0.5));
          } else {
            // Losing column: just random letters (ensure it doesn't accidentally contain a target word)
            let colLetters: string[] = [];
            let attempts = 0;
            while (colLetters.length < 7 && attempts < 100) {
              const char = alphabet[Math.floor(Math.random() * 26)];
              if (!colLetters.includes(char)) colLetters.push(char);
              
              // If full, check if it contains any target word
              if (colLetters.length === 7) {
                const containsAny = TARGET_WORDS.some(w => w.split('').every(l => colLetters.includes(l)));
                if (containsAny) {
                  colLetters = []; // reset and try again
                  attempts++;
                }
              }
            }
            columns.push(colLetters.sort(() => Math.random() - 0.5));
          }
        }
        data = { columns };
        break;
      case 'Morse Buzz':
        const MORSE_DATA = [
          { word: "BRAIN", value: "0.56657753" },
          { word: "BRICK", value: "0.25006326" },
          { word: "BROKE", value: "0.95237744" },
          { word: "BLAST", value: "0.15411853" },
          { word: "BLAZE", value: "0.75152684" },
          { word: "NIGHT", value: "0.98160402" },
          { word: "NERVE", value: "0.1445735" },
          { word: "DITCH", value: "0.17224717" },
          { word: "DRIFT", value: "0.26294374" },
          { word: "DREAM", value: "0.8645888" }
        ];
        const selected = MORSE_DATA[Math.floor(Math.random() * MORSE_DATA.length)];
        data = { word: selected.word };
        solution = selected.value;
        break;
      case 'Signal Flags':
        const FLAG_COLORS = ["Red", "Orange", "Yellow", "Blue", "Green", "Purple", "White"];
        const numFlags = Math.random() > 0.5 ? 3 : 4;
        const selectedFlags = Array.from({ length: numFlags }, () => FLAG_COLORS[Math.floor(Math.random() * FLAG_COLORS.length)]);
        data = { flags: selectedFlags };

        const isHot = (c: string) => ["Red", "Orange", "Yellow"].includes(c);
        const isCool = (c: string) => ["Blue", "Green", "Purple"].includes(c);

        const flagResults: string[] = [];
        const mode = deviceSettings.ports.includes('ParallelPort') ? 'Parallel' : 
                     deviceSettings.ports.includes('S-VideoPort') ? 'S-Video' : 'Otherwise';

        selectedFlags.forEach(color => {
          if (isHot(color)) {
            if (mode === 'Parallel') flagResults.push("WW");
            else if (mode === 'S-Video') flagResults.push("UR");
            else flagResults.push("HUGH");
          } else if (isCool(color)) {
            if (mode === 'Parallel') flagResults.push("UU");
            else if (mode === 'S-Video') flagResults.push("YOUR");
            else flagResults.push("HUE");
          } else if (color === 'White') {
            if (mode === 'Parallel') flagResults.push("EWE");
            else if (mode === 'S-Video') flagResults.push("YOURE");
            else flagResults.push("HIU");
          }
        });

        solution = flagResults.join('');
        break;
      case 'LightGrid':
        const grid = Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => Math.random() > 0.5));
        data = { grid };

        // Step 1: Count total LIT
        let totalLit = 0;
        grid.forEach(row => row.forEach(cell => { if (cell) totalLit++; }));

        let focusType: 'row' | 'col';
        let focusIndex = 0;

        if (totalLit % 2 === 0) {
          // EVEN: ROW with most lit
          focusType = 'row';
          let maxLit = -1;
          for (let r = 0; r < 4; r++) {
            const rowLit = grid[r].filter(c => c).length;
            if (rowLit > maxLit) {
              maxLit = rowLit;
              focusIndex = r;
            }
          }
        } else {
          // ODD: COLUMN with least lit
          focusType = 'col';
          let minLit = 5;
          for (let c = 0; c < 4; c++) {
            let colLit = 0;
            for (let r = 0; r < 4; r++) { if (grid[r][c]) colLit++; }
            if (colLit < minLit) {
              minLit = colLit;
              focusIndex = c;
            }
          }
        }

        // Step 3: Selecting the Light
        const hasVGAorParallel = deviceSettings.ports.includes('VGAPort') || deviceSettings.ports.includes('ParallelPort');
        let selectedRow = 0;
        let selectedCol = 0;

        if (focusType === 'row') {
          selectedRow = focusIndex;
          if (hasVGAorParallel) {
            // First UNLIT
            let found = false;
            for (let c = 0; c < 4; c++) {
              if (!grid[focusIndex][c]) {
                selectedCol = c;
                found = true;
                break;
              }
            }
            if (!found) selectedCol = 0; // Fallback if all lit
          } else {
            // Last
            selectedCol = 3;
          }
        } else {
          selectedCol = focusIndex;
          if (hasVGAorParallel) {
            // First UNLIT
            let found = false;
            for (let r = 0; r < 4; r++) {
              if (!grid[r][focusIndex]) {
                selectedRow = r;
                found = true;
                break;
              }
            }
            if (!found) selectedRow = 0;
          } else {
            // Last
            selectedRow = 3;
          }
        }

        const colLetter = String.fromCharCode(65 + selectedCol); // A, B, C, D
        const rowNum = selectedRow + 1; // 1, 2, 3, 4
        solution = `${colLetter}${rowNum}`;
        break;
      case 'Color Clash':
        // Generate 5 words with random text and ink colors
        const items = Array.from({ length: 5 }, () => ({
          text: ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)].toUpperCase(),
          color: ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)]
        }));
        data = { items };

        const text = (idx: number) => items[idx].text.toLowerCase();
        const ink = (idx: number) => items[idx].color.toLowerCase();

        // 1. If the Text of the Fifth Word matches the Ink Color of any other word
        let rule1Matched = false;
        for (let j = 0; j < 4; j++) {
          if (text(4) === ink(j)) rule1Matched = true;
        }

        if (rule1Matched) {
          solution = ink(3);
        } else {
          // 2. Otherwise, if there are two or more words where the Ink Color of one matches the Text of a different word
          let matchCount = 0;
          for (let j = 0; j < 5; j++) {
            let matchesAnyOther = false;
            for (let k = 0; k < 5; k++) {
              if (j !== k && ink(j) === text(k)) {
                matchesAnyOther = true;
                break;
              }
            }
            if (matchesAnyOther) matchCount++;
          }

          if (matchCount >= 2) {
            solution = text(4);
          } else {
            // 3. Otherwise, if the Ink Color of the Third Word matches the Text of any word
            let rule3Matched = false;
            for (let j = 0; j < 5; j++) {
              if (ink(2) === text(j)) rule3Matched = true;
            }

            if (rule3Matched) {
              solution = ink(1);
            } else {
              // 4. Otherwise, if the Text of any word ends in a vowel
              let foundVowelWord = -1;
              for (let j = 0; j < 5; j++) {
                if (/[AEIOU]$/i.test(text(j))) {
                  foundVowelWord = j;
                  break;
                }
              }

              if (foundVowelWord !== -1) {
                solution = ink(foundVowelWord);
              } else {
                // 5. Otherwise
                solution = ink(3);
              }
            }
          }
        }
        solution = solution.toLowerCase();
        break;
      case 'Cipher Shift':
        const word = CIPHER_WORDS[Math.floor(Math.random() * CIPHER_WORDS.length)];
        const baseShift = Math.floor(Math.random() * 10) + 1;
        data = { word, shift: baseShift };
        
        // Base shift is the frequency numeral
        let actualShift = baseShift;

        // VGA: Double the shift (do this before other additions)
        if (deviceSettings.ports.includes('VGAPort')) {
          actualShift *= 2;
        }

        // DisplayPort: Add +2 to the shift.
        if (deviceSettings.ports.includes('DisplayPort')) {
          actualShift += 2;
        }

        // S-Video: Subtract -1 from the shift.
        if (deviceSettings.ports.includes('S-VideoPort')) {
          actualShift -= 1;
        }

        // Always add the second digit to the shift
        const secondDigit = parseInt(deviceSettings.serialNumber[4]) || 0; // Serial: 3 letters, 3 digits -> index 4 is second digit
        actualShift += secondDigit;

        // Apply shift
        const shiftedWord = word.split('').map(char => {
          let code = char.charCodeAt(0) - 65;
          code = (code + actualShift) % 26;
          while (code < 0) code += 26;
          return String.fromCharCode(code + 65);
        }).join('');

        // More Vowels than Consonants: Reverse order of letters
        const vowels = (word.match(/[AEIOU]/g) || []).length;
        const consonants = word.length - vowels;
        if (vowels > consonants) {
          solution = shiftedWord.split('').reverse().join('');
        } else {
          solution = shiftedWord;
        }
        break;

      case 'Wires':
        const wireCount = Math.floor(Math.random() * 4) + 3; // 3-6 wires
        const wireColors = Array.from({ length: wireCount }, () => COLORS[Math.floor(Math.random() * COLORS.length)]);
        data = { wires: wireColors };
        
        const count = (color: string) => wireColors.filter(c => c === color).length;

        if (wireCount === 3) {
          if (count('Red') === 0) solution = "second";
          else if (wireColors[2] === 'White') solution = "third";
          else if (count('Blue') > 1) solution = "second";
          else solution = "first";
        } else if (wireCount === 4) {
          if (count('Red') > 1) solution = "third";
          else if (wireColors[3] === 'Yellow') solution = "first";
          else if (count('Blue') === 1) solution = "second";
          else if (count('Yellow') > 1) solution = "fourth";
          else solution = "third";
        } else if (wireCount === 5) {
          if (wireColors[4] === 'Black') solution = "fourth";
          else if (count('Red') > 1) solution = "first";
          else if (count('Black') === 0) solution = "second";
          else if (count('Yellow') > 1) solution = "fifth";
          else solution = "first";
        } else if (wireCount === 6) {
          if (count('Yellow') === 0) solution = "third";
          else if (count('Yellow') === 1) solution = "fourth";
          else if (count('White') > 1) solution = "sixth";
          else if (count('Red') === 0) solution = "first";
          else solution = "fifth";
        }
        break;

      case 'Symbol Ordering':
        const selectedSymbols = [...ALL_SYMBOLS].sort(() => Math.random() - 0.5).slice(0, 4);
        data = { symbols: selectedSymbols };
        
        const lastChar = deviceSettings.serialNumber.slice(-1);
        const isOdd = parseInt(lastChar) % 2 !== 0;
        const hasVowel = /[AEIOU]/i.test(deviceSettings.serialNumber);

        const getPos = (sym: string) => {
          for (let r = 0; r < SYMBOL_GRID.length; r++) {
            const c = SYMBOL_GRID[r].indexOf(sym);
            if (c !== -1) return { r, c };
          }
          return { r: 0, c: 0 };
        };

        solution = [...selectedSymbols].sort((a, b) => {
          const posA = getPos(a);
          const posB = getPos(b);

          if (posA.r !== posB.r) {
            return isOdd ? posA.r - posB.r : posB.r - posA.r;
          }
          return hasVowel ? posA.c - posB.c : posB.c - posA.c;
        }).join('');
        break;
    }

    return {
      id: i,
      title: type,
      type: type,
      data: data,
      solution: solution,
      claimedBy: null
    };
  });
}
