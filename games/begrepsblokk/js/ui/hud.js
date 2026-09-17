/* =========================================================
   HUD — poeng øverst. Rent visningslag, ingen logikk.
   ========================================================= */

export class Hud {
  constructor({ scoreEl }) {
    this.scoreEl = scoreEl;
    this._lastScore = null;
  }

  update(state) {
    if (state.score !== this._lastScore) {
      this.scoreEl.textContent = String(state.score);
      this._pulse(this.scoreEl);
      this._lastScore = state.score;
    }
  }

  _pulse(el) {
    el.classList.remove('is-pulsing');
    // eslint-disable-next-line no-unused-expressions
    el.offsetWidth;
    el.classList.add('is-pulsing');
  }
}
