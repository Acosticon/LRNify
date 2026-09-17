/* =========================================================
   ENGINE — limet mellom brett, matching, tyngdekraft, poeng
   og spørsmål. Dette er hele "game loop"-en beskrevet i
   oppdraget, som ren logikk uten noen DOM-avhengighet slik at
   den kan testes og gjenbrukes uavhengig av UI.

   Fremtidig fag/tema starter spillet slik:
     new Match3Engine({ questionSet: cells })
   uten at motoren vet noe som helst om "celler".
   ========================================================= */

import { BOARD_SIZE } from '../config/gameConfig.js';
import { createInitialBoard, hasAnyValidMove, shuffleBoardInPlace } from './board.js';
import { findMatches, collectMatchedCells, collectRemovedTiles } from './matches.js';
import { attemptSwap } from './moves.js';
import { applyGravityAndRefill } from './gravity.js';
import { pointsForCascadeStep } from './scoring.js';
import { createInitialState } from './gameState.js';
import { QuestionManager } from '../questions/questionManager.js';
import { defaultRng } from './rng.js';

export class Match3Engine {
  constructor({ questionSet, rng = defaultRng, width = BOARD_SIZE, height = BOARD_SIZE }) {
    if (!questionSet) throw new Error('Match3Engine krever et questionSet.');
    this.rng = rng;
    this.questionManager = new QuestionManager(questionSet, rng);
    this.subject = questionSet.subject;
    this.topic = questionSet.topic;
    this.state = createInitialState();
    this.state.board = createInitialBoard(rng, width, height);
    this._lastShuffled = false;
  }

  getState() {
    return this.state;
  }

  /** Er brettet klikkbart akkurat nå (ingen spørsmål venter, spillet er ikke over)? */
  canInteract() {
    return this.state.gameStatus === 'playing';
  }

  /**
   * Prøver å bytte to naboceller. Løser matchen og alle påfølgende cascades
   * synkront, legger bonusbrikker i spørsmålskøen, og returnerer et referat
   * UI-et kan bruke til å animere sekvensen steg for steg.
   */
  attemptMove(posA, posB) {
    if (!this.canInteract()) return { ok: false, reason: 'busy' };
    if (this.state.movesRemaining <= 0) return { ok: false, reason: 'no-moves' };

    const result = attemptSwap(this.state.board, posA, posB);
    if (!result.valid) {
      return { ok: false, reason: result.reason };
    }

    this.state.movesRemaining -= 1;

    let board = result.board;
    let matches = result.matches;
    const steps = [];
    const bonusTilesFound = [];
    let cascadeIndex = 0;

    while (matches.length > 0) {
      const cellSet = collectMatchedCells(matches);
      const removedTiles = collectRemovedTiles(board, cellSet);
      const points = pointsForCascadeStep(matches, cascadeIndex);
      this.state.score += points;
      this.state.matchesCount += matches.length;

      for (const removed of removedTiles) {
        if (removed.tile.bonusMoves) bonusTilesFound.push(removed);
      }

      const { board: nextBoard, newTiles } = applyGravityAndRefill(board, cellSet, this.rng);
      steps.push({ cascadeIndex, matches, removedTiles, points, board: nextBoard, newTiles });

      board = nextBoard;
      matches = findMatches(board);
      cascadeIndex += 1;
    }

    this.state.board = board;

    for (const removed of bonusTilesFound) {
      const question = this.questionManager.createQuestion(removed.tile.bonusMoves);
      this.state.questionQueue.push(question);
    }

    this._lastShuffled = false;
    this._activateNextQuestionIfNeeded();
    if (this.state.gameStatus === 'playing') this._ensurePlayableBoard();
    this._checkGameOver();

    return {
      ok: true,
      movesRemaining: this.state.movesRemaining,
      steps,
      bonusTilesFound: bonusTilesFound.map(t => ({ bonusMoves: t.tile.bonusMoves })),
      shuffled: this._lastShuffled === true
    };
  }

  _activateNextQuestionIfNeeded() {
    if (!this.state.activeQuestion && this.state.questionQueue.length > 0) {
      this.state.activeQuestion = this.state.questionQueue.shift();
      this.state.gameStatus = 'question';
    }
  }

  /** Svarer på det aktive spørsmålet. Går videre til neste i køen, eller tilbake til brettet. */
  answerActiveQuestion(chosenIndex) {
    const question = this.state.activeQuestion;
    if (!question) return { ok: false, reason: 'no-active-question' };
    if (question.answered) return { ok: false, reason: 'already-answered' };

    const result = this.questionManager.validateAnswer(question, chosenIndex);
    question.answered = true;

    if (result.correct) {
      this.state.movesRemaining += result.bonusMoves;
      this.state.correctAnswers += 1;
    } else {
      this.state.wrongAnswers += 1;
    }

    this.state.activeQuestion = null;
    this.state.gameStatus = 'playing';
    this._lastShuffled = false;
    this._activateNextQuestionIfNeeded();

    if (this.state.gameStatus === 'playing') {
      this._ensurePlayableBoard();
      this._checkGameOver();
    }

    return {
      ok: true,
      correct: result.correct,
      correctIndex: result.correctIndex,
      bonusMoves: result.bonusMoves,
      word: question.word,
      movesRemaining: this.state.movesRemaining,
      gameStatus: this.state.gameStatus,
      shuffled: this._lastShuffled === true
    };
  }

  _ensurePlayableBoard() {
    this._lastShuffled = false;
    if (this.state.movesRemaining <= 0) return;
    if (!hasAnyValidMove(this.state.board)) {
      shuffleBoardInPlace(this.state.board, this.rng);
      this._lastShuffled = true;
    }
  }

  _checkGameOver() {
    const noPendingQuestions = this.state.questionQueue.length === 0 && !this.state.activeQuestion;
    if (this.state.movesRemaining <= 0 && noPendingQuestions) {
      this.state.gameStatus = 'game-over';
    }
  }
}
