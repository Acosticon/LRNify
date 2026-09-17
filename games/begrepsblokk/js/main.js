/* =========================================================
   MAIN — kobler sammen motor og UI.
   Dette er det eneste stedet som starter spillet. For å bytte
   fagområde senere holder det å endre importen av questionSet:

     import topic from './data/science/ecology.js';
     startGame({ questionSet: topic });

   Motoren (engine.js) vet ingenting om "celler".
   ========================================================= */

import { BlockBlastEngine } from './game/engine.js';
import { defaultRng } from './game/rng.js';
import { BOARD_SIZE } from './config/gameConfig.js';
import cellsTopic from './data/science/cells.js';
import { BoardView } from './ui/boardView.js';
import { TrayView } from './ui/trayView.js';
import { DragController } from './ui/dragController.js';
import { Hud } from './ui/hud.js';
import { QuestionView } from './ui/questionView.js';
import { GameOverView } from './ui/gameOverView.js';

function linesToCells({ rows, cols }, size) {
  const cells = [];
  for (const r of rows) for (let c = 0; c < size; c++) cells.push({ row: r, col: c });
  for (const c of cols) for (let r = 0; r < size; r++) cells.push({ row: r, col: c });
  return cells;
}

function singleLineToCells(lineInfo, size) {
  const cells = [];
  if (lineInfo.type === 'row') {
    for (let c = 0; c < size; c++) cells.push({ row: lineInfo.line, col: c });
  } else {
    for (let r = 0; r < size; r++) cells.push({ row: r, col: lineInfo.line });
  }
  return cells;
}

function startGame({ questionSet }) {
  const boardRoot = document.getElementById('board');
  const trayRoot = document.getElementById('tray');
  const hud = new Hud({ scoreEl: document.getElementById('score-value') });
  const questionView = new QuestionView(document.getElementById('question-panel'));
  const gameOverView = new GameOverView(document.getElementById('gameover-panel'), {
    onRestart: () => newRound()
  });
  const topicTitleEl = document.getElementById('topic-title');
  const topicSubjectEl = document.getElementById('topic-subject');

  const boardView = new BoardView(boardRoot);
  const trayView = new TrayView(trayRoot);
  boardView.renderGrid(BOARD_SIZE);

  let engine = null;
  let locked = false;

  new DragController({
    trayEl: trayRoot,
    boardView,
    trayView,
    canPlace: (pieceId, row, col) => !locked && Boolean(engine) && engine.canPlace(pieceId, row, col),
    getPiece: (pieceId) => engine && engine.getState().tray.find(p => p && p.id === pieceId),
    onDrop: handleDrop,
    isLocked: () => locked
  });

  function newRound() {
    gameOverView.hide();
    engine = new BlockBlastEngine({ questionSet, rng: defaultRng });
    topicTitleEl.textContent = questionSet.topic;
    topicSubjectEl.textContent = questionSet.subject;
    locked = false;

    boardView.setLocked(false);
    boardView.renderState(engine.getState().grid);
    trayView.render(engine.getState().tray);
    hud.update(engine.getState());
  }

  async function handleDrop(pieceId, row, col) {
    if (locked || !engine) return;
    const result = engine.attemptPlace(pieceId, row, col);
    if (!result.ok) return;

    locked = true;
    boardView.setLocked(true);
    boardView.renderState(engine.getState().grid);
    trayView.render(engine.getState().tray);
    hud.update(engine.getState());

    if (result.clearedLines) {
      boardView.flashCleared(linesToCells(result.clearedLines, engine.getState().grid.size));
      boardView.pulseBoard();
    }

    if (result.questionTriggered) {
      await runQuestion();
    }

    finishTurn();
  }

  async function runQuestion() {
    const question = engine.getState().activeQuestion;
    questionView.show();
    const { index: chosenIndex, buttons } = await questionView.askChoice(question);
    const answer = engine.answerActiveQuestion(chosenIndex);

    await questionView.showFeedback({
      buttons,
      chosenIndex,
      correct: answer.correct,
      correctIndex: answer.correctIndex,
      word: answer.word,
      rewarded: Boolean(answer.rewardedLine)
    });
    questionView.hide();

    boardView.renderState(engine.getState().grid);
    hud.update(engine.getState());
    if (answer.rewardedLine) {
      boardView.flashCleared(singleLineToCells(answer.rewardedLine, engine.getState().grid.size));
      boardView.pulseBoard();
    }
  }

  function finishTurn() {
    const state = engine.getState();
    if (state.gameStatus === 'game-over') {
      boardView.setLocked(true);
      gameOverView.show(state);
    } else {
      locked = false;
      boardView.setLocked(false);
    }
  }

  newRound();
}

startGame({ questionSet: cellsTopic });
