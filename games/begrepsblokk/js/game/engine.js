/* =========================================================
   ENGINE — limet mellom brett, brikker, poeng og spørsmål.
   Ren logikk, ingen DOM-avhengighet, slik at den kan testes og
   gjenbrukes uavhengig av UI.

   I stedet for reklame dukker det opp et fagspørsmål med en
   tilfeldig sjanse (QUESTION_CHANCE) etter hvert trekk. Riktig
   svar rydder brettets fylteste rad/kolonne som en gave. Feil
   svar har ingen konsekvens — spørsmålet er ren bonus-sjanse.

   Fremtidig fag/tema starter spillet slik:
     new BlockBlastEngine({ questionSet: cells })
   uten at motoren vet noe som helst om "celler".
   ========================================================= */

import { BOARD_SIZE, TRAY_SIZE, QUESTION_CHANCE } from '../config/gameConfig.js';
import {
  createGrid, canPlacePiece, placePiece, findFullLines, clearLines,
  isGameOver, findBestLineToReward, clearLine
} from './board.js';
import { createTray } from './pieceBag.js';
import { pointsForPlacement, pointsForLineClear, pointsForRewardClear } from './scoring.js';
import { createInitialState } from './gameState.js';
import { QuestionManager } from '../questions/questionManager.js';
import { defaultRng } from './rng.js';

export class BlockBlastEngine {
  constructor({ questionSet, rng = defaultRng, size = BOARD_SIZE, traySize = TRAY_SIZE }) {
    if (!questionSet) throw new Error('BlockBlastEngine krever et questionSet.');
    this.rng = rng;
    this.traySize = traySize;
    this.questionManager = new QuestionManager(questionSet, rng);
    this.subject = questionSet.subject;
    this.topic = questionSet.topic;
    this.state = createInitialState();
    this.state.grid = createGrid(size);
    this.state.tray = createTray(rng, traySize);
  }

  getState() {
    return this.state;
  }

  /** Kan brettet/trallen brukes akkurat nå (ingen spørsmål venter, spillet er ikke over)? */
  canInteract() {
    return this.state.gameStatus === 'playing';
  }

  canPlace(pieceId, anchorRow, anchorCol) {
    const piece = this.state.tray.find(p => p && p.id === pieceId);
    if (!piece) return false;
    return canPlacePiece(this.state.grid, piece, anchorRow, anchorCol);
  }

  /**
   * Prøver å legge en brikke fra trallen på brettet. Rydder fylte
   * rader/kolonner, fyller opp trallen når den er tom, og trigger evt.
   * et fagspørsmål. Returnerer et referat UI-et kan bruke til å animere.
   */
  attemptPlace(pieceId, anchorRow, anchorCol) {
    if (!this.canInteract()) return { ok: false, reason: 'busy' };

    const trayIndex = this.state.tray.findIndex(p => p && p.id === pieceId);
    if (trayIndex === -1) return { ok: false, reason: 'unknown-piece' };

    const piece = this.state.tray[trayIndex];
    if (!canPlacePiece(this.state.grid, piece, anchorRow, anchorCol)) {
      return { ok: false, reason: 'no-fit' };
    }

    placePiece(this.state.grid, piece, anchorRow, anchorCol);
    this.state.tray[trayIndex] = null;
    this.state.score += pointsForPlacement(piece.cells.length);
    this.state.piecesPlaced += 1;

    const fullLines = findFullLines(this.state.grid);
    const lineCount = fullLines.rows.length + fullLines.cols.length;
    let clearedLines = null;
    if (lineCount > 0) {
      clearLines(this.state.grid, fullLines);
      this.state.linesCleared += lineCount;
      this.state.score += pointsForLineClear(lineCount);
      clearedLines = { ...fullLines, count: lineCount };
    }

    const trayRefilled = this.state.tray.every(p => !p);
    if (trayRefilled) {
      this.state.tray = createTray(this.rng, this.traySize);
    }

    this._maybeTriggerQuestion();
    this._checkGameOver();

    return {
      ok: true,
      placedPiece: { id: piece.id, cells: piece.cells, type: piece.type },
      anchorRow,
      anchorCol,
      clearedLines,
      trayRefilled,
      questionTriggered: this.state.gameStatus === 'question'
    };
  }

  _maybeTriggerQuestion() {
    if (this.state.gameStatus !== 'playing') return;
    if (this.rng() >= QUESTION_CHANCE) return;
    this.state.activeQuestion = this.questionManager.createQuestion();
    this.state.gameStatus = 'question';
  }

  /** Svarer på det aktive spørsmålet. Riktig svar rydder en linje som gave. */
  answerActiveQuestion(chosenIndex) {
    const question = this.state.activeQuestion;
    if (!question) return { ok: false, reason: 'no-active-question' };
    if (question.answered) return { ok: false, reason: 'already-answered' };

    const result = this.questionManager.validateAnswer(question, chosenIndex);
    question.answered = true;

    let rewardedLine = null;
    if (result.correct) {
      this.state.correctAnswers += 1;
      const line = findBestLineToReward(this.state.grid);
      if (line) {
        const removed = clearLine(this.state.grid, line);
        this.state.score += pointsForRewardClear(removed);
        this.state.linesCleared += 1;
        rewardedLine = line;
      }
    } else {
      this.state.wrongAnswers += 1;
    }

    this.state.activeQuestion = null;
    this.state.gameStatus = 'playing';
    this._checkGameOver();

    return {
      ok: true,
      correct: result.correct,
      correctIndex: result.correctIndex,
      word: question.word,
      rewardedLine,
      gameStatus: this.state.gameStatus
    };
  }

  _checkGameOver() {
    if (this.state.gameStatus !== 'playing') return;
    if (isGameOver(this.state.grid, this.state.tray)) {
      this.state.gameStatus = 'game-over';
    }
  }
}
