/* =========================================================
   DRAG CONTROLLER — drar en brikke fra tralla og over på
   brettet, med pointer events (fungerer for mus og touch).
   Vet ingenting om spillregler — spør bare `canPlace` og
   rapporterer et fullført slipp via `onDrop`.
   ========================================================= */

const LIFT_PX = 46; // hvor mye brikken heves over fingeren mens man drar

export class DragController {
  constructor({ trayEl, boardView, trayView, canPlace, getPiece, onDrop, isLocked }) {
    this.trayEl = trayEl;
    this.boardView = boardView;
    this.trayView = trayView;
    this.canPlace = canPlace;
    this.getPiece = getPiece;
    this.onDrop = onDrop;
    this.isLocked = isLocked || (() => false);

    this.drag = null; // { pieceId, piece, offsetDr, offsetDc, ghostEl, pointerId }

    this.trayEl.addEventListener('pointerdown', (event) => this._onPointerDown(event));
  }

  _findOffsetCell(pointerDownTarget, piece) {
    const cellEl = pointerDownTarget.closest('.piece-cell');
    if (!cellEl) return { dr: 0, dc: 0 };
    const dr = Number(cellEl.style.gridRow) - 1;
    const dc = Number(cellEl.style.gridColumn) - 1;
    const known = piece.cells.some(([r, c]) => r === dr && c === dc);
    return known ? { dr, dc } : { dr: 0, dc: 0 };
  }

  _buildGhost(piece, cellSize) {
    const style = this.trayView.cellStyle(piece.type);
    const ghost = document.createElement('div');
    ghost.className = 'drag-ghost';
    ghost.style.width = `${cellSize}px`;
    ghost.style.height = `${cellSize}px`;
    for (const [dr, dc] of piece.cells) {
      const cellEl = document.createElement('div');
      cellEl.className = 'drag-ghost-cell';
      cellEl.style.left = `${dc * cellSize}px`;
      cellEl.style.top = `${dr * cellSize}px`;
      cellEl.style.width = `${cellSize}px`;
      cellEl.style.height = `${cellSize}px`;
      cellEl.style.background = style.background;
      cellEl.style.backgroundImage = style.backgroundImage;
      ghost.appendChild(cellEl);
    }
    document.body.appendChild(ghost);
    return ghost;
  }

  _onPointerDown(event) {
    if (this.isLocked()) return;
    const slot = event.target.closest('.piece-slot');
    if (!slot || !slot.dataset.pieceId || slot.classList.contains('is-empty')) return;

    const pieceId = slot.dataset.pieceId;
    const piece = this.getPiece(pieceId);
    if (!piece) return;

    event.preventDefault();
    const offset = this._findOffsetCell(event.target, piece);
    const cellSize = this.boardView.getCellSize() || 48;
    const ghostEl = this._buildGhost(piece, cellSize);

    this.drag = { pieceId, piece, offsetDr: offset.dr, offsetDc: offset.dc, ghostEl, pointerId: event.pointerId };
    this.trayView.setDragging(pieceId, true);
    slot.setPointerCapture(event.pointerId);

    slot.addEventListener('pointermove', this._onPointerMove);
    slot.addEventListener('pointerup', this._onPointerUp);
    slot.addEventListener('pointercancel', this._onPointerCancel);

    this._positionGhost(event.clientX, event.clientY);
  }

  _anchorFromClientPoint(clientX, clientY) {
    const pointerCell = this.boardView.cellAtPoint(clientX, clientY) || { row: -999, col: -999 };
    return { row: pointerCell.row - this.drag.offsetDr, col: pointerCell.col - this.drag.offsetDc };
  }

  _positionGhost(clientX, clientY) {
    const { piece, ghostEl } = this.drag;
    const anchor = this._anchorFromClientPoint(clientX, clientY);
    const cellSize = this.boardView.getCellSize();
    const rect = this.boardView.getRect();

    ghostEl.style.transform =
      `translate(${rect.left + anchor.col * cellSize}px, ${rect.top + anchor.row * cellSize - LIFT_PX}px)`;

    const footprint = piece.cells.map(([dr, dc]) => ({ row: anchor.row + dr, col: anchor.col + dc }));
    const valid = this.canPlace(this.drag.pieceId, anchor.row, anchor.col);
    this.boardView.highlightFootprint(footprint, valid);
    this.drag.lastAnchor = anchor;
    this.drag.lastValid = valid;
  }

  _onPointerMove = (event) => {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    this._positionGhost(event.clientX, event.clientY);
  };

  _cleanup(slot) {
    if (!this.drag) return;
    slot.removeEventListener('pointermove', this._onPointerMove);
    slot.removeEventListener('pointerup', this._onPointerUp);
    slot.removeEventListener('pointercancel', this._onPointerCancel);
    this.drag.ghostEl.remove();
    this.boardView.clearHighlight();
    this.trayView.setDragging(this.drag.pieceId, false);
    this.drag = null;
  }

  _onPointerUp = (event) => {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    const { pieceId, lastAnchor, lastValid } = this.drag;
    const slot = event.currentTarget;
    this._cleanup(slot);
    if (lastValid && lastAnchor) this.onDrop(pieceId, lastAnchor.row, lastAnchor.col);
  };

  _onPointerCancel = (event) => {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    this._cleanup(event.currentTarget);
  };
}
