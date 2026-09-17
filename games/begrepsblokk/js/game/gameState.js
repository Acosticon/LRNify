/* =========================================================
   GAME STATE — ett sted for all spilltilstand.
   Ingen DOM, ingen globale variabler spredt rundt — UI-et leser
   alltid fra dette objektet (via engine.getState()).
   ========================================================= */

export function createInitialState() {
  return {
    score: 0,
    piecesPlaced: 0,
    linesCleared: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    grid: null,
    tray: [],
    activeQuestion: null,
    /** 'playing' | 'question' | 'game-over' */
    gameStatus: 'playing'
  };
}
