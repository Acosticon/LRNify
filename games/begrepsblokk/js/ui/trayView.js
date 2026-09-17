/* =========================================================
   TRAY VIEW — tegner de tre brikkene spilleren har til
   rådighet. Ren visning: den vet ingenting om spillregler,
   bare hvordan en brikke ser ut og hvor den ligger i DOM-en.
   ========================================================= */

import { BLOCK_TYPES } from '../config/gameConfig.js';

export class TrayView {
  constructor(root) {
    this.root = root;
    this.slotEls = [];
  }

  cellStyle(type) {
    const def = BLOCK_TYPES[type];
    if (!def) return { background: '', backgroundImage: '' };
    return def.image
      ? { background: '', backgroundImage: `url(${def.image})` }
      : { background: def.color, backgroundImage: '' };
  }

  _buildPieceEl(piece) {
    const cols = Math.max(...piece.cells.map(([, dc]) => dc)) + 1;
    const rows = Math.max(...piece.cells.map(([dr]) => dr)) + 1;

    const wrap = document.createElement('div');
    wrap.className = 'piece-shape';
    wrap.style.setProperty('--piece-cols', cols);
    wrap.style.setProperty('--piece-rows', rows);

    const style = this.cellStyle(piece.type);
    for (const [dr, dc] of piece.cells) {
      const cellEl = document.createElement('div');
      cellEl.className = 'piece-cell';
      cellEl.style.gridRow = String(dr + 1);
      cellEl.style.gridColumn = String(dc + 1);
      cellEl.style.background = style.background;
      cellEl.style.backgroundImage = style.backgroundImage;
      wrap.appendChild(cellEl);
    }
    return wrap;
  }

  /** Tegner de tre trallplassene på nytt. `tray` kan ha `null` for tomme plasser. */
  render(tray) {
    this.root.innerHTML = '';
    this.slotEls = [];
    tray.forEach((piece, i) => {
      const slot = document.createElement('div');
      slot.className = 'piece-slot';
      slot.dataset.slotIndex = String(i);
      if (piece) {
        slot.dataset.pieceId = piece.id;
        slot.appendChild(this._buildPieceEl(piece));
      } else {
        slot.classList.add('is-empty');
      }
      this.root.appendChild(slot);
      this.slotEls.push(slot);
    });
  }

  getSlotElement(pieceId) {
    return this.slotEls.find(el => el.dataset.pieceId === pieceId) || null;
  }

  setDragging(pieceId, dragging) {
    const el = this.getSlotElement(pieceId);
    if (el) el.classList.toggle('is-dragging', dragging);
  }
}
