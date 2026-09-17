/* =========================================================
   GAME OVER VIEW — sluttskjerm med resultat og "Spill igjen".
   ========================================================= */

export class GameOverView {
  constructor(panelEl, { onRestart } = {}) {
    this.panelEl = panelEl;
    this.scoreEl = panelEl.querySelector('[data-role="final-score"]');
    this.correctEl = panelEl.querySelector('[data-role="final-correct"]');
    this.wrongEl = panelEl.querySelector('[data-role="final-wrong"]');
    this.matchesEl = panelEl.querySelector('[data-role="final-matches"]');
    this.restartBtn = panelEl.querySelector('[data-role="restart"]');
    this.restartBtn.addEventListener('click', () => onRestart && onRestart());
  }

  show(state) {
    this.scoreEl.textContent = String(state.score);
    this.correctEl.textContent = String(state.correctAnswers);
    this.wrongEl.textContent = String(state.wrongAnswers);
    this.matchesEl.textContent = String(state.matchesCount);
    this.panelEl.classList.remove('is-hidden');
    requestAnimationFrame(() => this.panelEl.classList.add('is-visible'));
  }

  hide() {
    this.panelEl.classList.remove('is-visible');
    setTimeout(() => this.panelEl.classList.add('is-hidden'), 180);
  }
}
