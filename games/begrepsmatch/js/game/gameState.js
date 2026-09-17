/* =========================================================
   GAME STATE — ett sted for all spilltilstand.
   Ingen DOM, ingen globale variabler spredt rundt — UI-et leser
   alltid fra dette objektet (via engine.getState()).
   ========================================================= */

import { STARTING_MOVES } from '../config/gameConfig.js';

export function createInitialState() {
  return {
    score: 0,
    movesRemaining: STARTING_MOVES,
    correctAnswers: 0,
    wrongAnswers: 0,
    matchesCount: 0,
    board: null,
    questionQueue: [],
    activeQuestion: null,
    /** 'playing' | 'question' | 'game-over' */
    gameStatus: 'playing'
  };
}
