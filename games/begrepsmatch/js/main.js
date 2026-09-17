/* =========================================================
   MAIN — kobler sammen motor og UI.
   Dette er det eneste stedet som starter spillet. For å bytte
   fagområde senere holder det å endre importen av questionSet:

     import topic from './data/science/ecology.js';
     new Match3Engine({ questionSet: topic });

   Match-3-motoren (engine.js) vet ingenting om "celler".
   ========================================================= */

import { Match3Engine } from './game/engine.js';
import { defaultRng } from './game/rng.js';
import cellsTopic from './data/science/cells.js';
import { BoardView } from './ui/boardView.js';
import { Hud } from './ui/hud.js';
import { QuestionView } from './ui/questionView.js';
import { GameOverView } from './ui/gameOverView.js';

function startGame({ questionSet }) {
  const boardRoot = document.getElementById('board');
  const hud = new Hud({
    scoreEl: document.getElementById('score-value'),
    movesEl: document.getElementById('moves-value')
  });
  const questionView = new QuestionView(document.getElementById('question-panel'));
  const gameOverView = new GameOverView(document.getElementById('gameover-panel'), {
    onRestart: () => newRound()
  });
  const topicTitleEl = document.getElementById('topic-title');
  const topicSubjectEl = document.getElementById('topic-subject');
  const movesPill = document.getElementById('moves-pill');

  document.getElementById('play-again-hud')?.addEventListener('click', () => newRound());

  let engine = null;
  let boardView = null;

  function newRound() {
    gameOverView.hide();
    engine = new Match3Engine({ questionSet, rng: defaultRng });
    topicTitleEl.textContent = questionSet.topic;
    topicSubjectEl.textContent = questionSet.subject;

    if (!boardView) {
      boardView = new BoardView(boardRoot, { onSwapAttempt: handleSwapAttempt });
    }
    boardView.renderFull(engine.getState().board);
    boardView.setLocked(false);
    hud.update(engine.getState());
  }

  async function handleSwapAttempt(posA, posB) {
    if (!engine || !engine.canInteract()) return;
    boardView.setLocked(true);

    const result = engine.attemptMove(posA, posB);

    if (!result.ok) {
      if (result.reason === 'no-match') {
        await boardView.animateSwap(posA, posB, { revert: true });
      }
      boardView.setLocked(false);
      return;
    }

    hud.update(engine.getState());

    await boardView.animateSwap(posA, posB);
    for (const step of result.steps) {
      await boardView.animateCascadeStep(step);
    }

    if (result.shuffled) {
      boardView.reconcile(engine.getState().board);
      boardView.flashShuffle();
    }

    await runQuestionQueue();
    await finishTurn();
  }

  async function runQuestionQueue() {
    let lastAnswer = null;
    while (engine.getState().activeQuestion) {
      const question = engine.getState().activeQuestion;
      questionView.show();
      const { index: chosenIndex, buttons } = await questionView.askChoice(question);
      const answer = engine.answerActiveQuestion(chosenIndex);
      lastAnswer = answer;
      await questionView.showFeedback({
        buttons,
        chosenIndex,
        correct: answer.correct,
        correctIndex: answer.correctIndex,
        bonusMoves: answer.bonusMoves,
        word: answer.word
      });
      hud.update(engine.getState());
      if (answer.correct) {
        boardView.pulseCorrectTile();
        hud.floatBonus(movesPill, answer.bonusMoves);
      }
    }
    questionView.hide();

    if (lastAnswer && lastAnswer.shuffled) {
      boardView.reconcile(engine.getState().board);
      boardView.flashShuffle();
    }
  }

  async function finishTurn() {
    const state = engine.getState();
    hud.update(state);
    if (state.gameStatus === 'game-over') {
      boardView.setLocked(true);
      gameOverView.show(state);
    } else {
      boardView.setLocked(false);
    }
  }

  newRound();
}

startGame({ questionSet: cellsTopic });
