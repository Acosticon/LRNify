/* =========================================================
   BOARD VIEW — tegner rutenettet og eksponerer det UI trenger
   for å håndtere drag: cellestørrelse, hvilken celle en
   skjermkoordinat tilsvarer, og hvordan man markerer et
   fotavtrykk som gyldig/ugyldig før slipp.

   Blokkfargen hentes utelukkende fra BLOCK_TYPES (config) — å
   bytte `color` eller sette `image` der endrer utseendet uten
   at en linje her må røres.
   ========================================================= */

import { BLOCK_TYPES } from '../config/gameConfig.js';

export class BoardView {
  constructor(root) {
    this.root = root;
    this.size = 0;
    this.cellEls = [];
    this.highlighted = [];
    this.locked = false;
  }

  setLocked(locked) {
    this.locked = locked;
    this.root.classList.toggle('is-locked', locked);
  }

  renderGrid(size) {
    this.size = size;
    this.root.innerHTML = '';
    this.root.style.setProperty('--board-size', size);
    this.cellEls = new Array(size * size);
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const el = document.createElement('div');
        el.className = 'board-cell';
        el.dataset.row = String(row);
        el.dataset.col = String(col);
        this.root.appendChild(el);
        this.cellEls[row * size + col] = el;
      }
    }
  }

  _cellStyle(type) {
    const def = BLOCK_TYPES[type];
    if (!def) return { background: '', backgroundImage: '' };
    return def.image
      ? { background: '', backgroundImage: `url(${def.image})` }
      : { background: def.color, backgroundImage: '' };
  }

  /** Full oppdatering av alle celler til å matche `grid`. */
  renderState(grid) {
    for (let row = 0; row < grid.size; row++) {
      for (let col = 0; col < grid.size; col++) {
        const cell = grid.cells[row * grid.size + col];
        const el = this.cellEls[row * grid.size + col];
        el.classList.toggle('is-filled', Boolean(cell));
        const style = cell ? this._cellStyle(cell.type) : { background: '', backgroundImage: '' };
        el.style.background = style.background;
        el.style.backgroundImage = style.backgroundImage;
      }
    }
  }

  /** Brettets pikselmål på skjermen akkurat nå. */
  getRect() {
    return this.root.getBoundingClientRect();
  }

  getCellSize() {
    const rect = this.getRect();
    return this.size ? rect.width / this.size : 0;
  }

  /** Rad/kolonne under en skjermkoordinat, uansett om den er innenfor brettet. */
  cellAtPoint(clientX, clientY) {
    const rect = this.getRect();
    const cellSize = this.getCellSize();
    if (!cellSize) return null;
    const col = Math.floor((clientX - rect.left) / cellSize);
    const row = Math.floor((clientY - rect.top) / cellSize);
    return { row, col };
  }

  /** Markerer et sett med celler (kan ligge utenfor brettet — de ignoreres). */
  highlightFootprint(cells, valid) {
    this.clearHighlight();
    for (const { row, col } of cells) {
      if (row < 0 || col < 0 || row >= this.size || col >= this.size) continue;
      const el = this.cellEls[row * this.size + col];
      el.classList.add(valid ? 'is-hover-valid' : 'is-hover-invalid');
      this.highlighted.push(el);
    }
  }

  clearHighlight() {
    for (const el of this.highlighted) el.classList.remove('is-hover-valid', 'is-hover-invalid');
    this.highlighted = [];
  }

  /** Kort blinke-animasjon på cellene som nettopp ble ryddet. */
  flashCleared(cells) {
    for (const { row, col } of cells) {
      const el = this.cellEls[row * this.size + col];
      el.classList.add('is-clearing');
      setTimeout(() => el.classList.remove('is-clearing'), 260);
    }
  }

  pulseBoard() {
    this.root.classList.add('board-pulse');
    setTimeout(() => this.root.classList.remove('board-pulse'), 420);
  }
}
