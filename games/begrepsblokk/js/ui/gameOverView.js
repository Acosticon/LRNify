/* =========================================================
   GAME OVER VIEW — sluttskjerm med resultat og "Spill igjen".
   ========================================================= */

export class GameOverView {
  constructor(panelEl, { onRestart } = {}) {
    this.panelEl = panelEl;
    this.scoreEl = panelEl.querySelector('[data-role="final-score"]');
    this.correctEl = panelEl.querySelector('[data-role="final-correct"]');
    this.wrongEl = panelEl.querySelector('[data-role="final-wrong"]');
    this.linesEl = panelEl.querySelector('[data-role="final-lines"]');
    this.restartBtn = panelEl.querySelector('[data-role="restart"]');
    this.restartBtn.addEventListener('click', () => onRestart && onRestart());
  }

  show(state) {
    this.scoreEl.textContent = String(state.score);
    this.correctEl.textContent = String(state.correctAnswers);
    this.wrongEl.textContent = String(state.wrongAnswers);
    this.linesEl.textContent = String(state.linesCleared);
    this.panelEl.classList.remove('is-hidden');
    requestAnimationFrame(() => this.panelEl.classList.add('is-visible'));
  }

  hide() {
    this.panelEl.classList.remove('is-visible');
    setTimeout(() => this.panelEl.classList.add('is-hidden'), 180);
  }
}
