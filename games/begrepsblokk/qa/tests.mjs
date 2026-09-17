/* =========================================================
   QA — automatiserte tester for Begrepsblokk (rutenett,
   brikkeplassering, linjerydding, spørsmål og game over).
   Ingen DOM, ingen avhengigheter — bare ren spill-logikk.

   Kjør:
     node games/begrepsblokk/qa/tests.mjs
   ========================================================= */

import assert from 'node:assert/strict';

import {
  createGrid, setCell, getCell, canPlacePiece, placePiece,
  findFullLines, clearLines, canPlaceAnywhere, isGameOver,
  findBestLineToReward, clearLine
} from '../js/game/board.js';
import { createPiece, createTray } from '../js/game/pieceBag.js';
import { BLOCK_TYPE_IDS, SCORING } from '../js/config/gameConfig.js';
import { pointsForPlacement, pointsForLineClear, pointsForRewardClear } from '../js/game/scoring.js';
import { createRng } from '../js/game/rng.js';
import { QuestionManager } from '../js/questions/questionManager.js';
import { BlockBlastEngine } from '../js/game/engine.js';
import cellsTopic from '../js/data/science/cells.js';

function buildGrid(rows) {
  const size = rows.length;
  const grid = createGrid(size);
  rows.forEach((row, r) => {
    row.forEach((filled, c) => {
      if (filled) setCell(grid, r, c, { type: 'blue' });
    });
  });
  return grid;
}

/* Konstant rng — brukes i engine-testene. En fast verdi holder,
   siden vi overskriver brett/tralle manuelt rett etter konstruksjon
   (motorens EGEN oppstart bruker også rng-en, men det brettet/den
   trallen kastes vi uansett bort før testen begynner å sjekke noe). */
function constRng(value) {
  return () => value;
}

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

/* ---------------- BOARD ---------------- */

test('canPlacePiece: passer på tomt brett, ikke utenfor kanten', () => {
  const grid = createGrid(4);
  const piece = { cells: [[0, 0], [0, 1], [1, 0]] };
  assert.equal(canPlacePiece(grid, piece, 0, 0), true);
  assert.equal(canPlacePiece(grid, piece, 0, 3), false); // stikker utenfor til høyre
  assert.equal(canPlacePiece(grid, piece, 3, 3), false); // stikker utenfor nedover
});

test('canPlacePiece: false hvis en av cellene allerede er fylt', () => {
  const grid = buildGrid([
    [0, 1, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ]);
  const piece = { cells: [[0, 0], [0, 1]] };
  assert.equal(canPlacePiece(grid, piece, 0, 0), false);
});

test('placePiece setter riktig type på riktige celler', () => {
  const grid = createGrid(4);
  placePiece(grid, { cells: [[0, 0], [1, 1]], type: 'pink' }, 0, 0);
  assert.equal(getCell(grid, 0, 0).type, 'pink');
  assert.equal(getCell(grid, 1, 1).type, 'pink');
  assert.equal(getCell(grid, 0, 1), null);
});

test('findFullLines finner fylt rad og fylt kolonne', () => {
  const grid = buildGrid([
    [1, 1, 1, 1],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 0, 0, 0]
  ]);
  const { rows, cols } = findFullLines(grid);
  assert.deepEqual(rows, [0]);
  assert.deepEqual(cols, [0]);
});

test('clearLines tømmer nøyaktig de gitte radene/kolonnene og teller fjernede celler', () => {
  const grid = buildGrid([
    [1, 1, 1, 1],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 0, 0, 0]
  ]);
  const removed = clearLines(grid, { rows: [0], cols: [0] });
  // grid har 7 fylte celler totalt (rad 0 sine 4 + (1,0)/(2,0)/(3,0)) —
  // hjørnet (0,0) telles bare én gang, siden rad-løkken allerede har
  // tømt den før kolonne-løkken kommer dit.
  assert.equal(removed, 7);
  for (let c = 0; c < 4; c++) assert.equal(getCell(grid, 0, c), null);
  for (let r = 0; r < 4; r++) assert.equal(getCell(grid, r, 0), null);
});

test('canPlaceAnywhere / isGameOver', () => {
  const full = buildGrid([
    [1, 1],
    [1, 1]
  ]);
  const dot = { cells: [[0, 0]] };
  assert.equal(canPlaceAnywhere(full, dot), false);
  assert.equal(isGameOver(full, [dot, null, null]), true);

  const almostFull = buildGrid([
    [1, 1],
    [1, 0]
  ]);
  assert.equal(canPlaceAnywhere(almostFull, dot), true);
  assert.equal(isGameOver(almostFull, [dot]), false);
});

test('findBestLineToReward velger linjen med flest fylte celler, null på tomt brett', () => {
  const empty = createGrid(4);
  assert.equal(findBestLineToReward(empty), null);

  const grid = buildGrid([
    [1, 1, 1, 0],
    [1, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ]);
  const best = findBestLineToReward(grid);
  assert.equal(best.type, 'row');
  assert.equal(best.line, 0);
  assert.equal(best.filled, 3);
});

test('clearLine tømmer bare den ene raden/kolonnen', () => {
  const grid = buildGrid([
    [1, 1],
    [1, 0]
  ]);
  const removed = clearLine(grid, { type: 'row', line: 0 });
  assert.equal(removed, 2);
  assert.equal(getCell(grid, 0, 0), null);
  assert.equal(getCell(grid, 0, 1), null);
  assert.ok(getCell(grid, 1, 0)); // uberørt
});

/* ---------------- PIECE BAG ---------------- */

test('createPiece gir en gyldig form og en kjent blokktype', () => {
  const rng = createRng(42);
  const piece = createPiece(rng);
  assert.ok(Array.isArray(piece.cells) && piece.cells.length > 0);
  assert.ok(BLOCK_TYPE_IDS.includes(piece.type));
  const minRow = Math.min(...piece.cells.map(([r]) => r));
  const minCol = Math.min(...piece.cells.map(([, c]) => c));
  assert.equal(minRow, 0);
  assert.equal(minCol, 0);
});

test('createTray gir riktig antall brikker, hver med unik id', () => {
  const rng = createRng(7);
  const tray = createTray(rng, 3);
  assert.equal(tray.length, 3);
  const ids = new Set(tray.map(p => p.id));
  assert.equal(ids.size, 3);
});

/* ---------------- SCORING ---------------- */

test('pointsForPlacement skalerer med antall celler', () => {
  assert.equal(pointsForPlacement(4), 4 * SCORING.perCellPlaced);
});

test('pointsForLineClear: 0 for ingen linjer, stigende multiplikator for flere', () => {
  assert.equal(pointsForLineClear(0), 0);
  const one = pointsForLineClear(1);
  const two = pointsForLineClear(2);
  assert.equal(one, SCORING.perLineClearBase);
  assert.ok(two > one * 2, 'flere samtidige linjer skal gi mer enn bare lineær sum');
});

test('pointsForRewardClear skalerer som en vanlig plassering', () => {
  assert.equal(pointsForRewardClear(5), 5 * SCORING.perCellPlaced);
});

/* ---------------- QUESTION MANAGER ---------------- */

test('createQuestion gir fire alternativer der riktig ord ligger på correctIndex', () => {
  const rng = createRng(3);
  const qm = new QuestionManager(cellsTopic, rng);
  const q = qm.createQuestion();
  assert.equal(q.options.length, 4);
  assert.equal(q.options[q.correctIndex], q.word);
  assert.ok(cellsTopic.questions.some(entry => entry.word === q.word && entry.definition === q.definition));
});

test('validateAnswer kjenner riktig/galt svar', () => {
  const rng = createRng(9);
  const qm = new QuestionManager(cellsTopic, rng);
  const q = qm.createQuestion();
  assert.equal(qm.validateAnswer(q, q.correctIndex).correct, true);
  const wrongIndex = (q.correctIndex + 1) % 4;
  assert.equal(qm.validateAnswer(q, wrongIndex).correct, false);
});

test('QuestionManager unngår å gjenta samme ord rett etter hverandre i et stort nok sett', () => {
  const rng = createRng(11);
  const qm = new QuestionManager(cellsTopic, rng); // cellsTopic har 27 spørsmål, godt over historikken
  let previous = null;
  for (let i = 0; i < 10; i++) {
    const q = qm.createQuestion();
    if (previous) assert.notEqual(q.word, previous);
    previous = q.word;
  }
});

/* ---------------- ENGINE ---------------- */

test('attemptPlace: ugyldig plassering gir ok:false uten å endre state', () => {
  const engine = new BlockBlastEngine({ questionSet: cellsTopic, rng: constRng(0.9) });
  const piece = engine.getState().tray[0];
  const scoreBefore = engine.getState().score;
  const result = engine.attemptPlace(piece.id, 99, 99);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'no-fit');
  assert.equal(engine.getState().score, scoreBefore);
});

test('attemptPlace: gyldig plassering fyller brettet, gir poeng og tømmer trallplassen', () => {
  const engine = new BlockBlastEngine({ questionSet: cellsTopic, rng: constRng(0.9) });
  engine.state.grid = createGrid(8);
  engine.state.tray = [
    { id: 'p1', cells: [[0, 0], [0, 1], [0, 2]], type: 'blue' },
    { id: 'p2', cells: [[0, 0]], type: 'green' },
    { id: 'p3', cells: [[0, 0]], type: 'pink' }
  ];

  const result = engine.attemptPlace('p1', 0, 0);
  assert.equal(result.ok, true);
  assert.equal(engine.getState().tray[0], null);
  assert.equal(engine.getState().score, pointsForPlacement(3));
  assert.equal(getCell(engine.getState().grid, 0, 0).type, 'blue');
});

test('attemptPlace: full rad ryddes og gir linjepoeng', () => {
  const engine = new BlockBlastEngine({ questionSet: cellsTopic, rng: constRng(0.9) });
  engine.state.grid = buildGrid([
    [1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0]
  ]);
  engine.state.tray = [
    { id: 'p1', cells: [[0, 0]], type: 'green' },
    { id: 'p2', cells: [[0, 0]], type: 'blue' },
    { id: 'p3', cells: [[0, 0]], type: 'pink' }
  ];

  const result = engine.attemptPlace('p1', 0, 7);
  assert.equal(result.ok, true);
  assert.ok(result.clearedLines);
  assert.deepEqual(result.clearedLines.rows, [0]);
  assert.equal(engine.getState().linesCleared, 1);
  assert.equal(engine.getState().score, pointsForPlacement(1) + pointsForLineClear(1));
  for (let c = 0; c < 8; c++) assert.equal(getCell(engine.getState().grid, 0, c), null);
});

test('attemptPlace: tom tralle fylles opp igjen automatisk', () => {
  const engine = new BlockBlastEngine({ questionSet: cellsTopic, rng: constRng(0.4) });
  engine.state.grid = createGrid(8);
  engine.state.tray = [{ id: 'p1', cells: [[0, 0]], type: 'green' }, null, null];

  const result = engine.attemptPlace('p1', 0, 0);
  assert.equal(result.trayRefilled, true);
  assert.equal(engine.getState().tray.length, 3);
  assert.ok(engine.getState().tray.every(p => p));
});

test('attemptPlace: spillet er over når ingen brikker i trallen passer noe sted', () => {
  const engine = new BlockBlastEngine({ questionSet: cellsTopic, rng: constRng(0.9) });
  // Rutemønster (sjakkbrett): ingen to tomme ruter er noensinne nabo til
  // hverandre, så en domino passer aldri — og ingen rad/kolonne blir full
  // av å fylle bare én av de tomme rutene (unngår en utilsiktet linjerydding).
  const rows = Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => ((r + c) % 2 === 0 ? 1 : 0)));
  engine.state.grid = buildGrid(rows);
  engine.state.tray = [
    { id: 'p1', cells: [[0, 0]], type: 'green' },
    { id: 'p2', cells: [[0, 0], [0, 1]], type: 'blue' }, // domino — passer ikke i et sjakkbrettmønster
    null
  ];

  const result = engine.attemptPlace('p1', 0, 1); // (0,1) er en tom rute i mønsteret
  assert.equal(result.ok, true);
  assert.equal(engine.getState().gameStatus, 'game-over');
});

test('_maybeTriggerQuestion: lav rng-verdi trigger spørsmål, høy verdi gjør det ikke', () => {
  const notTriggered = new BlockBlastEngine({ questionSet: cellsTopic, rng: constRng(0.9) });
  notTriggered.state.grid = createGrid(8);
  notTriggered.state.tray = [{ id: 'p1', cells: [[0, 0]], type: 'green' }, { id: 'p2', cells: [[0, 0]], type: 'blue' }, { id: 'p3', cells: [[0, 0]], type: 'pink' }];
  const r1 = notTriggered.attemptPlace('p1', 0, 0);
  assert.equal(r1.questionTriggered, false);
  assert.equal(notTriggered.getState().gameStatus, 'playing');

  const triggered = new BlockBlastEngine({ questionSet: cellsTopic, rng: constRng(0.01) });
  triggered.state.grid = createGrid(8);
  triggered.state.tray = [{ id: 'p1', cells: [[0, 0]], type: 'green' }, { id: 'p2', cells: [[0, 0]], type: 'blue' }, { id: 'p3', cells: [[0, 0]], type: 'pink' }];
  const r2 = triggered.attemptPlace('p1', 0, 0);
  assert.equal(r2.questionTriggered, true);
  assert.equal(triggered.getState().gameStatus, 'question');
  assert.ok(triggered.getState().activeQuestion);
});

test('answerActiveQuestion: riktig svar rydder fylteste linje og gir poeng, ingen straff ved galt svar', () => {
  const engine = new BlockBlastEngine({ questionSet: cellsTopic, rng: constRng(0.01) });
  engine.state.grid = buildGrid([
    [1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0]
  ]);
  engine.state.tray = [{ id: 'p1', cells: [[0, 0]], type: 'green' }, { id: 'p2', cells: [[0, 0]], type: 'blue' }, { id: 'p3', cells: [[0, 0]], type: 'pink' }];

  const placeResult = engine.attemptPlace('p1', 3, 3);
  assert.equal(placeResult.questionTriggered, true);
  const question = engine.getState().activeQuestion;

  const correctAnswer = engine.answerActiveQuestion(question.correctIndex);
  assert.equal(correctAnswer.correct, true);
  assert.ok(correctAnswer.rewardedLine, 'riktig svar skal rydde en linje siden brettet ikke er tomt');
  assert.equal(engine.getState().correctAnswers, 1);
  assert.equal(engine.getState().gameStatus, 'playing');
  assert.equal(getCell(engine.getState().grid, 0, 0), null); // rad 0 ble ryddet som gave

  // Trigger et nytt spørsmål og svar galt — skal ikke straffes.
  const engine2 = new BlockBlastEngine({ questionSet: cellsTopic, rng: constRng(0.01) });
  engine2.state.grid = createGrid(8);
  engine2.state.tray = [{ id: 'p1', cells: [[0, 0]], type: 'green' }, { id: 'p2', cells: [[0, 0]], type: 'blue' }, { id: 'p3', cells: [[0, 0]], type: 'pink' }];
  engine2.attemptPlace('p1', 0, 0);
  const q2 = engine2.getState().activeQuestion;
  const wrongIndex = (q2.correctIndex + 1) % 4;
  const wrongAnswer = engine2.answerActiveQuestion(wrongIndex);
  assert.equal(wrongAnswer.correct, false);
  assert.equal(wrongAnswer.rewardedLine, null);
  assert.equal(engine2.getState().wrongAnswers, 1);
  assert.equal(engine2.getState().gameStatus, 'playing');
});

/* ---------------- kjør ---------------- */

let passed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    passed++;
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✕ ${name}`);
    console.error(err);
  }
}

console.log(`\n${passed}/${tests.length} tester besto.`);
if (passed !== tests.length) process.exit(1);
