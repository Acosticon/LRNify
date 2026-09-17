/* =========================================================
   QA — automatiserte tester for Begrepsmatch (match-3-motoren,
   brettgenerering, bonusbrikker, spørsmål og game over).
   Ingen DOM, ingen avhengigheter — bare ren spill-logikk.

   Kjør:
     node games/begrepsmatch/qa/tests.mjs
   ========================================================= */

import assert from 'node:assert/strict';

import { createBoard, setTile, createInitialBoard, hasAnyValidMove, shuffleBoardInPlace } from '../js/game/board.js';
import { findMatches, collectMatchedCells } from '../js/game/matches.js';
import { attemptSwap } from '../js/game/moves.js';
import { applyGravityAndRefill } from '../js/game/gravity.js';
import { Match3Engine } from '../js/game/engine.js';
import { QuestionManager } from '../js/questions/questionManager.js';
import { createRng } from '../js/game/rng.js';
import cellsTopic from '../js/data/science/cells.js';

let tileCounter = 0;
function tile(type, bonusMoves = null) {
  return { id: 't' + (tileCounter++), type, bonusMoves };
}

function buildBoard(rows) {
  const height = rows.length;
  const width = rows[0].length;
  const board = createBoard(width, height);
  rows.forEach((row, r) => {
    row.forEach((cell, c) => {
      const [type, bonus] = Array.isArray(cell) ? cell : [cell, null];
      setTile(board, r, c, tile(type, bonus));
    });
  });
  return board;
}

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

/* ---------------- MATCH-3 ---------------- */

test('3-match horisontalt oppdages', () => {
  const board = buildBoard([
    ['blue', 'blue', 'blue', 'green', 'yellow']
  ]);
  const groups = findMatches(board);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].cells.length, 3);
  assert.equal(groups[0].type, 'blue');
});

test('4-match horisontalt oppdages', () => {
  const board = buildBoard([
    ['green', 'green', 'green', 'green', 'blue']
  ]);
  const groups = findMatches(board);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].cells.length, 4);
});

test('5+-match oppdages', () => {
  const board = buildBoard([
    ['purple', 'purple', 'purple', 'purple', 'purple']
  ]);
  const groups = findMatches(board);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].cells.length, 5);
});

test('vertikal match oppdages', () => {
  const board = buildBoard([
    ['blue', 'green'],
    ['blue', 'yellow'],
    ['blue', 'purple']
  ]);
  const groups = findMatches(board);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].type, 'blue');
  assert.equal(groups[0].cells.length, 3);
});

test('ugyldig bytte reverseres og bruker ikke trekk', () => {
  const board = buildBoard([
    ['blue', 'green', 'purple'],
    ['yellow', 'orange', 'cyan'],
    ['green', 'blue', 'yellow']
  ]);
  const before = JSON.stringify(board.cells.map(t => t && t.id));
  const result = attemptSwap(board, { row: 0, col: 0 }, { row: 0, col: 1 });
  assert.equal(result.valid, false);
  const after = JSON.stringify(board.cells.map(t => t && t.id));
  assert.equal(before, after, 'brettet skal være uendret etter et ugyldig forsøk');
});

test('gyldig bytte skaper en match', () => {
  const board = buildBoard([
    ['blue', 'yellow', 'blue', 'blue']
  ]);
  const result = attemptSwap(board, { row: 0, col: 0 }, { row: 0, col: 1 });
  assert.equal(result.valid, true);
  assert.equal(result.matches.length, 1);
  assert.equal(result.matches[0].cells.length, 3);
});

test('bonusbrikker matcher etter sin underliggende farge', () => {
  const board = buildBoard([
    [['blue', 3], 'blue', ['blue', 5], 'green']
  ]);
  const groups = findMatches(board);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].cells.length, 3);
});

/* ---------------- ENGINE: TREKK ---------------- */

test('gyldig trekk bruker nøyaktig ett trekk', () => {
  const engine = new Match3Engine({ questionSet: cellsTopic, rng: createRng(1), width: 4, height: 1 });
  engine.state.board = buildBoard([['blue', 'yellow', 'blue', 'blue']]);
  const before = engine.getState().movesRemaining;
  const result = engine.attemptMove({ row: 0, col: 0 }, { row: 0, col: 1 });
  assert.equal(result.ok, true);
  assert.equal(engine.getState().movesRemaining, before - 1);
});

test('ugyldig trekk bruker ikke trekk', () => {
  const engine = new Match3Engine({ questionSet: cellsTopic, rng: createRng(1), width: 3, height: 3 });
  engine.state.board = buildBoard([
    ['blue', 'green', 'purple'],
    ['yellow', 'orange', 'cyan'],
    ['green', 'blue', 'yellow']
  ]);
  const before = engine.getState().movesRemaining;
  const result = engine.attemptMove({ row: 0, col: 0 }, { row: 0, col: 1 });
  assert.equal(result.ok, false);
  assert.equal(engine.getState().movesRemaining, before);
});

test('cascade bruker ikke ekstra trekk, og brettet er ferdig avviklet etterpå', () => {
  const engine = new Match3Engine({ questionSet: cellsTopic, rng: createRng(7), width: 8, height: 8 });
  const before = engine.getState().movesRemaining;
  const move = findAnyValidMove(engine.getState().board);
  assert.ok(move, 'testbrettet burde ha minst ett gyldig trekk');
  const result = engine.attemptMove(move.posA, move.posB);
  assert.equal(result.ok, true);
  assert.equal(engine.getState().movesRemaining, before - 1);
  assert.equal(findMatches(engine.getState().board).length, 0, 'ingen matcher skal gjenstå etter at cascaden er ferdig');
});

test('en flertrinns cascade bruker fortsatt bare ett trekk', () => {
  const found = findCascadingSwap();
  assert.ok(found, 'fant ingen flertrinns-cascade å teste med');
  const engine = new Match3Engine({ questionSet: cellsTopic, rng: createRng(found.seed), width: 8, height: 8 });
  const before = engine.getState().movesRemaining;
  const result = engine.attemptMove(found.posA, found.posB);
  assert.equal(result.ok, true);
  assert.ok(result.steps.length >= 2, 'forventet en cascade på minst 2 steg');
  assert.equal(engine.getState().movesRemaining, before - 1);
});

/* ---------------- BRETT ---------------- */

test('startbrettet har ingen ferdige matcher', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const board = createInitialBoard(createRng(seed));
    assert.equal(findMatches(board).length, 0, `frø ${seed} ga et startbrett med en ferdig match`);
  }
});

test('startbrettet har minst ett gyldig trekk', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const board = createInitialBoard(createRng(seed));
    assert.equal(hasAnyValidMove(board), true, `frø ${seed} ga et startbrett uten gyldige trekk`);
  }
});

test('brettet kan fylles på nytt etter en match (tyngdekraft + påfyll)', () => {
  const board = buildBoard([
    ['blue', 'green', 'purple'],
    ['blue', 'green', 'purple'],
    ['blue', 'yellow', 'orange']
  ]);
  const removed = new Set(['0,0', '1,0', '2,0']); // hele venstre kolonne
  const { board: next, newTiles } = applyGravityAndRefill(board, removed, createRng(3));
  assert.equal(newTiles.length, 3);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      assert.ok(next.cells[row * 3 + col], `celle (${row},${col}) skal være fylt`);
    }
  }
});

test('brettet shuffles automatisk når ingen gyldige trekk finnes, uten å koste trekk', () => {
  // Håndverifisert (via uttømmende søk) 4×4-brett uten noe gyldig trekk
  // og uten noen ferdig match — en reell "deadlock"-tilstand.
  const board = buildBoard([
    ['blue', 'blue', 'green', 'green'],
    ['blue', 'purple', 'purple', 'green'],
    ['green', 'green', 'blue', 'blue'],
    ['green', 'green', 'blue', 'blue']
  ]);
  assert.equal(findMatches(board).length, 0, 'testbrettet skal ikke ha noen ferdig match i utgangspunktet');
  assert.equal(hasAnyValidMove(board), false, 'testbrettet skal ikke ha noe gyldig trekk');

  const countTypes = (b) => b.cells.reduce((acc, t) => { acc[t.type] = (acc[t.type] || 0) + 1; return acc; }, {});
  const before = countTypes(board);

  shuffleBoardInPlace(board, createRng(11));
  assert.equal(hasAnyValidMove(board), true, 'brettet skal ha et gyldig trekk etter shuffle');
  assert.deepEqual(countTypes(board), before, 'shuffle skal beholde samme sett brikker, bare i ny rekkefølge');
});

/* ---------------- SPØRSMÅL ---------------- */

test('spørsmål har fire alternativer, nøyaktig ett riktig, ingen duplikater', () => {
  const qm = new QuestionManager(cellsTopic, createRng(5));
  for (let i = 0; i < 25; i++) {
    const q = qm.createQuestion(3);
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options).size, 4, 'alternativene skal være unike');
    assert.equal(q.options[q.correctIndex], q.word);
  }
});

test('riktig svar gir bonus-trekk, feil svar gir 0', () => {
  const qm = new QuestionManager(cellsTopic, createRng(5));
  const q = qm.createQuestion(8);
  const correct = qm.validateAnswer(q, q.correctIndex);
  assert.equal(correct.correct, true);
  assert.equal(correct.bonusMoves, 8);

  const wrongIndex = (q.correctIndex + 1) % 4;
  const wrong = qm.validateAnswer(q, wrongIndex);
  assert.equal(wrong.correct, false);
  assert.equal(wrong.bonusMoves, 0);
});

test('samme begrep gjentas ikke rett etter hverandre', () => {
  const qm = new QuestionManager(cellsTopic, createRng(9));
  let lastWord = null;
  for (let i = 0; i < 40; i++) {
    const q = qm.createQuestion(3);
    assert.notEqual(q.word, lastWord, 'samme begrep dukket opp to ganger på rad');
    lastWord = q.word;
  }
});

test('QuestionManager bruker manuelle distraktorer når de finnes', () => {
  const customSet = {
    subject: 'Test',
    topic: 'Test',
    questions: [
      { word: 'A', definition: 'def a', distractors: ['X', 'Y', 'Z'] },
      { word: 'B', definition: 'def b' },
      { word: 'C', definition: 'def c' },
      { word: 'D', definition: 'def d' }
    ]
  };
  const qm = new QuestionManager(customSet, createRng(2));
  let sawCustom = false;
  for (let i = 0; i < 10; i++) {
    const q = qm.createQuestion(3);
    if (q.word === 'A') {
      sawCustom = true;
      const distractorsUsed = q.options.filter(o => o !== 'A');
      for (const d of distractorsUsed) assert.ok(['X', 'Y', 'Z'].includes(d));
    }
  }
  assert.ok(sawCustom, 'testen bør treffe spørsmål A minst én gang over 10 forsøk');
});

test('bare ett svarforsøk tillates per spørsmål', () => {
  const engine = new Match3Engine({ questionSet: cellsTopic, rng: createRng(2), width: 4, height: 1 });
  engine.state.board = buildBoard([['blue', ['blue', 3], 'yellow', 'blue']]);
  engine.attemptMove({ row: 0, col: 2 }, { row: 0, col: 3 });
  assert.ok(engine.getState().activeQuestion, 'et spørsmål skulle vært aktivert');

  const first = engine.answerActiveQuestion(0);
  assert.equal(first.ok, true);
  // Spørsmålet er nå forlatt (activeQuestion er enten neste i køen eller null) —
  // det opprinnelige spørsmålet kan ikke besvares på nytt.
  assert.equal(engine.state.activeQuestion === null || engine.state.activeQuestion.word !== first.word, true);
});

/* ---------------- SPØRSMÅLSKØ ---------------- */

test('to bonusbrikker i samme trekk gir to spørsmål, og begge bonusene legges til', () => {
  const engine = new Match3Engine({ questionSet: cellsTopic, rng: createRng(4), width: 5, height: 3 });
  engine.state.board = buildBoard([
    [['blue', 3], 'blue', ['blue', 5], 'yellow', 'purple'],
    ['green', 'yellow', 'purple', 'orange', 'cyan'],
    ['cyan', 'orange', 'orange', 'yellow', 'orange']
  ]);
  engine.state.movesRemaining = 20;

  const movesBefore = engine.getState().movesRemaining;
  const result = engine.attemptMove({ row: 2, col: 3 }, { row: 2, col: 4 });
  assert.equal(result.ok, true);
  assert.equal(result.bonusTilesFound.length, 2, 'begge bonusbrikkene skal registreres i samme trekk');
  const foundValues = result.bonusTilesFound.map(t => t.bonusMoves).sort();
  assert.deepEqual(foundValues, [3, 5]);

  assert.ok(engine.getState().activeQuestion, 'første spørsmål skal være aktivt');
  assert.equal(engine.getState().questionQueue.length, 1, 'andre spørsmålet skal vente i køen');

  let totalBonus = 0;
  const first = engine.answerActiveQuestion(engine.getState().activeQuestion.correctIndex);
  totalBonus += first.bonusMoves;
  assert.ok(engine.getState().activeQuestion, 'andre spørsmålet skal aktiveres automatisk');
  assert.equal(engine.getState().questionQueue.length, 0);

  const second = engine.answerActiveQuestion(engine.getState().activeQuestion.correctIndex);
  totalBonus += second.bonusMoves;

  assert.equal(totalBonus, 8, '3 + 5 skal gi totalt 8 bonus-trekk');
  assert.equal(engine.getState().movesRemaining, movesBefore - 1 + 8);
  assert.equal(engine.getState().activeQuestion, null);
});

/* ---------------- GAME OVER ---------------- */

test('spillet avsluttes når trekkene er brukt opp og ingen spørsmål venter', () => {
  const engine = new Match3Engine({ questionSet: cellsTopic, rng: createRng(1), width: 4, height: 1 });
  engine.state.board = buildBoard([['blue', 'yellow', 'blue', 'blue']]);
  engine.state.movesRemaining = 1;
  const result = engine.attemptMove({ row: 0, col: 0 }, { row: 0, col: 1 });
  assert.equal(result.ok, true);
  assert.equal(engine.getState().movesRemaining, 0);
  assert.equal(engine.getState().gameStatus, 'game-over');
});

test('game over venter til spørsmålskøen er ferdig, selv om trekk er 0', () => {
  const engine = new Match3Engine({ questionSet: cellsTopic, rng: createRng(2), width: 4, height: 1 });
  engine.state.board = buildBoard([['blue', ['blue', 3], 'yellow', 'blue']]);
  engine.state.movesRemaining = 1;
  const move = engine.attemptMove({ row: 0, col: 2 }, { row: 0, col: 3 });
  assert.equal(move.ok, true);
  assert.equal(engine.getState().movesRemaining, 0);
  assert.equal(engine.getState().gameStatus, 'question', 'skal vente med game-over til spørsmålet er besvart');

  const q = engine.getState().activeQuestion;
  const answer = engine.answerActiveQuestion(q.correctIndex);
  if (answer.bonusMoves > 0) {
    assert.equal(engine.getState().gameStatus, 'playing', 'riktig svar skal gi flere trekk og fortsette runden');
    assert.ok(engine.getState().movesRemaining > 0);
  }
});

test('feil svar på siste spørsmål avslutter spillet (ingen bonus-trekk gitt)', () => {
  const engine = new Match3Engine({ questionSet: cellsTopic, rng: createRng(2), width: 4, height: 1 });
  engine.state.board = buildBoard([['blue', ['blue', 3], 'yellow', 'blue']]);
  engine.state.movesRemaining = 1;
  engine.attemptMove({ row: 0, col: 2 }, { row: 0, col: 3 });
  const q = engine.getState().activeQuestion;
  const wrongIndex = (q.correctIndex + 1) % 4;
  const answer = engine.answerActiveQuestion(wrongIndex);
  assert.equal(answer.correct, false);
  assert.equal(answer.bonusMoves, 0);
  assert.equal(engine.getState().movesRemaining, 0);
  assert.equal(engine.getState().gameStatus, 'game-over');
});

/* ---------------- hjelpefunksjoner for søk ---------------- */

function findAnyValidMove(board) {
  for (let row = 0; row < board.height; row++) {
    for (let col = 0; col < board.width; col++) {
      if (col + 1 < board.width) {
        const posA = { row, col }, posB = { row, col: col + 1 };
        if (attemptSwap(board, posA, posB).valid) return { posA, posB };
      }
      if (row + 1 < board.height) {
        const posA = { row, col }, posB = { row: row + 1, col };
        if (attemptSwap(board, posA, posB).valid) return { posA, posB };
      }
    }
  }
  return null;
}

/** Brute-force-søk over noen frø/brett etter et bytte som gir en cascade på 2+ steg. */
function findCascadingSwap() {
  for (let seed = 1; seed <= 60; seed++) {
    const board = createInitialBoard(createRng(seed));
    for (let row = 0; row < board.height; row++) {
      for (let col = 0; col < board.width; col++) {
        const candidates = [];
        if (col + 1 < board.width) candidates.push([{ row, col }, { row, col: col + 1 }]);
        if (row + 1 < board.height) candidates.push([{ row, col }, { row: row + 1, col }]);
        for (const [posA, posB] of candidates) {
          const steps = simulateCascadeLength(board, posA, posB, seed);
          if (steps >= 2) return { seed, posA, posB };
        }
      }
    }
  }
  return null;
}

function simulateCascadeLength(originalBoard, posA, posB, seed) {
  // Bruker samme rng-frø som engine ville brukt til påfyll, slik at antall
  // steg stemmer med det et ekte engine.attemptMove ville produsert.
  const rng = createRng(seed + 1000);
  const board = cloneForSim(originalBoard);
  const attempt = attemptSwap(board, posA, posB);
  if (!attempt.valid) return 0;
  let current = attempt.board;
  let matches = attempt.matches;
  let steps = 0;
  while (matches.length > 0) {
    const cellSet = collectMatchedCells(matches);
    const { board: next } = applyGravityAndRefill(current, cellSet, rng);
    current = next;
    matches = findMatches(current);
    steps++;
  }
  return steps;
}

function cloneForSim(board) {
  return { width: board.width, height: board.height, cells: board.cells.slice() };
}

/* ---------------- kjør alt ---------------- */

let failed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`ok  - ${name}`);
  } catch (err) {
    failed++;
    console.error(`FEIL - ${name}`);
    console.error('    ' + (err && err.message ? err.message : err));
  }
}

console.log(`\n${tests.length - failed}/${tests.length} tester bestått`);
if (failed > 0) process.exit(1);
