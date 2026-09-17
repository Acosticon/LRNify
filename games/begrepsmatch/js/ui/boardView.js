/* =========================================================
   BOARD VIEW — tegner brettet og håndterer input (klikk/drag).
   Dette er det eneste stedet i UI-laget som kjenner til DOM-
   strukturen for selve spillbrettet. Den vet ingenting om
   poeng, trekk eller spørsmål — den bare viser et brett og
   rapporterer forsøk på bytte via `onSwapAttempt`.

   Brikkegrafikk hentes utelukkende fra TILE_TYPES (config) —
   å bytte et bilde der endrer utseendet uten at en linje her
   må røres.
   ========================================================= */

import { TILE_TYPES } from '../config/gameConfig.js';
import { cloneBoard, getTile, setTile, index as cellIndex } from '../game/board.js';

const SWAP_MS = 170;
const POP_MS = 190;
const FALL_MS = 240;

function transformFor(row, col) {
  return `translate(${col * 100}%, ${row * 100}%)`;
}

export class BoardView {
  constructor(root, { onSwapAttempt } = {}) {
    this.root = root;
    this.onSwapAttempt = onSwapAttempt || (() => {});
    this.elements = new Map(); // tileId -> HTMLElement
    this.board = null;
    this.selected = null; // {row, col}
    this.locked = false;

    this.root.classList.add('board-grid');
    this._bindInput();
  }

  setLocked(locked) {
    this.locked = locked;
    this.root.classList.toggle('is-locked', locked);
    if (locked) this._clearSelection();
  }

  /* ---------------- rendering ---------------- */

  _makeTileEl(tile, row, col) {
    const el = document.createElement('div');
    el.className = 'tile';
    el.dataset.tileId = tile.id;
    el.dataset.row = String(row);
    el.dataset.col = String(col);
    el.style.transform = transformFor(row, col);
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');

    const body = document.createElement('div');
    body.className = 'tile-body';
    el.appendChild(body);

    const type = TILE_TYPES[tile.type];
    const img = document.createElement('img');
    img.className = 'tile-img';
    img.src = type ? type.image : '';
    img.alt = '';
    img.draggable = false;
    body.appendChild(img);

    if (tile.bonusMoves) {
      const badge = document.createElement('span');
      badge.className = 'tile-bonus';
      badge.textContent = '+' + tile.bonusMoves;
      body.appendChild(badge);
      el.setAttribute('aria-label', `${type ? type.label : ''} brikke med bonus ${tile.bonusMoves} trekk`);
    } else {
      el.setAttribute('aria-label', `${type ? type.label : ''} brikke`);
    }

    return el;
  }

  /** Full (re)tegning fra bunnen av — brukes ved oppstart og "spill igjen". */
  renderFull(board) {
    this.root.innerHTML = '';
    this.elements.clear();
    this.board = cloneBoard(board);
    this.root.style.setProperty('--board-w', board.width);
    this.root.style.setProperty('--board-h', board.height);

    for (let row = 0; row < board.height; row++) {
      for (let col = 0; col < board.width; col++) {
        const tile = getTile(board, row, col);
        if (!tile) continue;
        const el = this._makeTileEl(tile, row, col);
        el.classList.add('is-spawning');
        this.root.appendChild(el);
        this.elements.set(tile.id, el);
        requestAnimationFrame(() => el.classList.remove('is-spawning'));
      }
    }
  }

  /** Oppdaterer transform for alle brikker til å matche et gitt brett,
      uten å bygge DOM-en på nytt (brukes etter en automatisk shuffle). */
  reconcile(board) {
    this.board = cloneBoard(board);
    for (let row = 0; row < board.height; row++) {
      for (let col = 0; col < board.width; col++) {
        const tile = getTile(board, row, col);
        if (!tile) continue;
        let el = this.elements.get(tile.id);
        if (!el) {
          el = this._makeTileEl(tile, row, col);
          this.root.appendChild(el);
          this.elements.set(tile.id, el);
        }
        el.dataset.row = String(row);
        el.dataset.col = String(col);
        el.style.transform = transformFor(row, col);
      }
    }
  }

  /* ---------------- animasjon ---------------- */

  _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async animateSwap(posA, posB, { revert = false } = {}) {
    const tileA = getTile(this.board, posA.row, posA.col);
    const tileB = getTile(this.board, posB.row, posB.col);
    const elA = tileA && this.elements.get(tileA.id);
    const elB = tileB && this.elements.get(tileB.id);
    if (!elA || !elB) return;

    elA.style.transform = transformFor(posB.row, posB.col);
    elB.style.transform = transformFor(posA.row, posA.col);
    await this._wait(SWAP_MS);

    if (revert) {
      elA.style.transform = transformFor(posA.row, posA.col);
      elB.style.transform = transformFor(posB.row, posB.col);
      await this._wait(SWAP_MS);
      return;
    }

    setTile(this.board, posA.row, posA.col, tileB);
    setTile(this.board, posB.row, posB.col, tileA);
    elA.dataset.row = String(posB.row); elA.dataset.col = String(posB.col);
    elB.dataset.row = String(posA.row); elB.dataset.col = String(posA.col);
  }

  /** Spiller av ett cascade-steg: brikker popper ut, resten faller/fylles på. */
  async animateCascadeStep(step) {
    const removedEls = [];
    for (const removed of step.removedTiles) {
      const el = this.elements.get(removed.tile.id);
      if (el) removedEls.push(el);
    }
    removedEls.forEach(el => el.classList.add('is-popping'));
    if (removedEls.length) await this._wait(POP_MS);
    for (const el of removedEls) {
      el.remove();
    }
    for (const removed of step.removedTiles) {
      this.elements.delete(removed.tile.id);
    }

    // Overlevende brikker: flytt dem til sin nye posisjon i step.board.
    const nextBoard = step.board;
    const newTileIds = new Set(step.newTiles.map(t => t.tile.id));

    for (let row = 0; row < nextBoard.height; row++) {
      for (let col = 0; col < nextBoard.width; col++) {
        const tile = getTile(nextBoard, row, col);
        if (!tile || newTileIds.has(tile.id)) continue;
        const el = this.elements.get(tile.id);
        if (!el) continue;
        el.dataset.row = String(row);
        el.dataset.col = String(col);
        el.style.transform = transformFor(row, col);
      }
    }

    // Nye brikker: spawn over brettet og la dem falle inn.
    for (const { row, col, tile } of step.newTiles) {
      const el = this._makeTileEl(tile, row, col);
      el.style.transition = 'none';
      el.style.transform = transformFor(row - nextBoard.height, col);
      this.root.appendChild(el);
      this.elements.set(tile.id, el);
      // eslint-disable-next-line no-unused-expressions
      el.offsetHeight; // force reflow før vi setter sluttposisjon
      el.style.transition = '';
      el.style.transform = transformFor(row, col);
    }

    this.board = cloneBoard(nextBoard);
    await this._wait(FALL_MS);
  }

  pulseCorrectTile() {
    this.root.classList.add('board-pulse');
    setTimeout(() => this.root.classList.remove('board-pulse'), 420);
  }

  flashShuffle() {
    this.root.classList.add('board-shuffling');
    setTimeout(() => this.root.classList.remove('board-shuffling'), 360);
  }

  /* ---------------- input ---------------- */

  _clearSelection() {
    if (this.selected) {
      const tile = getTile(this.board, this.selected.row, this.selected.col);
      const el = tile && this.elements.get(tile.id);
      if (el) el.classList.remove('is-selected');
    }
    this.selected = null;
  }

  _selectionAdjacentOrSame(pos) {
    if (!this.selected) return null;
    if (this.selected.row === pos.row && this.selected.col === pos.col) return 'same';
    const dr = Math.abs(this.selected.row - pos.row);
    const dc = Math.abs(this.selected.col - pos.col);
    return (dr + dc === 1) ? 'adjacent' : 'other';
  }

  _selectTile(pos) {
    this._clearSelection();
    this.selected = pos;
    const tile = getTile(this.board, pos.row, pos.col);
    const el = tile && this.elements.get(tile.id);
    if (el) el.classList.add('is-selected');
  }

  _positionFromEvent(event) {
    const el = event.target.closest('.tile');
    if (!el || !this.root.contains(el)) return null;
    return { row: Number(el.dataset.row), col: Number(el.dataset.col) };
  }

  _bindInput() {
    this.root.addEventListener('click', (event) => {
      if (this.locked) return;
      const pos = this._positionFromEvent(event);
      if (!pos) return;
      this._handleTap(pos);
    });

    this.root.addEventListener('keydown', (event) => {
      if (this.locked) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const pos = this._positionFromEvent(event);
      if (!pos) return;
      event.preventDefault();
      this._handleTap(pos);
    });

    let dragStart = null;
    const DRAG_THRESHOLD = 18;

    this.root.addEventListener('pointerdown', (event) => {
      if (this.locked) return;
      const pos = this._positionFromEvent(event);
      if (!pos) return;
      dragStart = { pos, x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    });

    this.root.addEventListener('pointermove', (event) => {
      if (!dragStart || dragStart.pointerId !== event.pointerId || this.locked) return;
      const dx = event.clientX - dragStart.x;
      const dy = event.clientY - dragStart.y;
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

      const target = Math.abs(dx) > Math.abs(dy)
        ? { row: dragStart.pos.row, col: dragStart.pos.col + (dx > 0 ? 1 : -1) }
        : { row: dragStart.pos.row + (dy > 0 ? 1 : -1), col: dragStart.pos.col };

      const start = dragStart.pos;
      dragStart = null;
      this._clearSelection();
      this._trySwap(start, target);
    });

    this.root.addEventListener('pointerup', () => { dragStart = null; });
    this.root.addEventListener('pointercancel', () => { dragStart = null; });
  }

  _handleTap(pos) {
    const tile = getTile(this.board, pos.row, pos.col);
    if (!tile) return;

    const relation = this._selectionAdjacentOrSame(pos);
    if (relation === 'same') {
      this._clearSelection();
      return;
    }
    if (relation === 'adjacent') {
      const start = this.selected;
      this._clearSelection();
      this._trySwap(start, pos);
      return;
    }
    this._selectTile(pos);
  }

  _trySwap(posA, posB) {
    if (!getTile(this.board, posA.row, posA.col) || !getTile(this.board, posB.row, posB.col)) return;
    this.onSwapAttempt(posA, posB);
  }
}
