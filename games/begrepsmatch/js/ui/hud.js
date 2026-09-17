/* =========================================================
   HUD — poeng og trekk øverst. Rent visningslag, ingen logikk.
   ========================================================= */

export class Hud {
  constructor({ scoreEl, movesEl }) {
    this.scoreEl = scoreEl;
    this.movesEl = movesEl;
    this._lastScore = null;
    this._lastMoves = null;
  }

  update(state) {
    if (state.score !== this._lastScore) {
      this.scoreEl.textContent = String(state.score);
      this._pulse(this.scoreEl);
      this._lastScore = state.score;
    }
    if (state.movesRemaining !== this._lastMoves) {
      this.movesEl.textContent = String(state.movesRemaining);
      this._pulse(this.movesEl);
      this.movesEl.classList.toggle('is-low', state.movesRemaining <= 5 && state.movesRemaining > 0);
      this._lastMoves = state.movesRemaining;
    }
  }

  _pulse(el) {
    el.classList.remove('is-pulsing');
    // eslint-disable-next-line no-unused-expressions
    el.offsetWidth;
    el.classList.add('is-pulsing');
  }

  floatBonus(anchorEl, amount) {
    if (!amount) return;
    const chip = document.createElement('span');
    chip.className = 'moves-float';
    chip.textContent = '+' + amount + ' trekk';
    anchorEl.appendChild(chip);
    setTimeout(() => chip.remove(), 900);
  }
}
