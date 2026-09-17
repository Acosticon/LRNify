/* =========================================================
   BOARD — rutenettets datastruktur og grunnleggende operasjoner.
   Rutenettet er en flat array av celler, lest som rader
   (row-major), sammen med størrelsen. En celle er enten `null`
   (tom) eller { type } (fylt med en blokktype). Modulen vet
   ingenting om DOM eller UI.
   ========================================================= */

import { BOARD_SIZE } from '../config/gameConfig.js';

export function createGrid(size = BOARD_SIZE) {
  return { size, cells: new Array(size * size).fill(null) };
}

export function cloneGrid(grid) {
  return { size: grid.size, cells: grid.cells.slice() };
}

export function index(grid, row, col) {
  return row * grid.size + col;
}

export function inBounds(grid, row, col) {
  return row >= 0 && row < grid.size && col >= 0 && col < grid.size;
}

export function getCell(grid, row, col) {
  if (!inBounds(grid, row, col)) return undefined;
  return grid.cells[index(grid, row, col)];
}

export function setCell(grid, row, col, value) {
  grid.cells[index(grid, row, col)] = value;
}

/** Kan `piece` legges med sitt øverste venstre hjørne på (anchorRow, anchorCol)? */
export function canPlacePiece(grid, piece, anchorRow, anchorCol) {
  return piece.cells.every(([dr, dc]) => {
    const r = anchorRow + dr;
    const c = anchorCol + dc;
    return inBounds(grid, r, c) && !getCell(grid, r, c);
  });
}

/** Legger brikken på brettet. Forutsetter at canPlacePiece allerede er sjekket. */
export function placePiece(grid, piece, anchorRow, anchorCol) {
  for (const [dr, dc] of piece.cells) {
    setCell(grid, anchorRow + dr, anchorCol + dc, { type: piece.type });
  }
}

/** Finner alle helt fylte rader og kolonner. */
export function findFullLines(grid) {
  const rows = [];
  const cols = [];

  for (let r = 0; r < grid.size; r++) {
    let full = true;
    for (let c = 0; c < grid.size; c++) {
      if (!getCell(grid, r, c)) { full = false; break; }
    }
    if (full) rows.push(r);
  }

  for (let c = 0; c < grid.size; c++) {
    let full = true;
    for (let r = 0; r < grid.size; r++) {
      if (!getCell(grid, r, c)) { full = false; break; }
    }
    if (full) cols.push(c);
  }

  return { rows, cols };
}

/** Tømmer de gitte radene/kolonnene. Returnerer antall celler som ble fjernet. */
export function clearLines(grid, { rows, cols }) {
  let removed = 0;
  for (const r of rows) {
    for (let c = 0; c < grid.size; c++) {
      if (getCell(grid, r, c)) removed++;
      setCell(grid, r, c, null);
    }
  }
  for (const c of cols) {
    for (let r = 0; r < grid.size; r++) {
      if (getCell(grid, r, c)) removed++;
      setCell(grid, r, c, null);
    }
  }
  return removed;
}

/** Finnes det noe sted på brettet hvor denne brikken passer? */
export function canPlaceAnywhere(grid, piece) {
  for (let r = 0; r < grid.size; r++) {
    for (let c = 0; c < grid.size; c++) {
      if (canPlacePiece(grid, piece, r, c)) return true;
    }
  }
  return false;
}

/** Spillet er over når ingen av brikkene i trallen passer noe sted. */
export function isGameOver(grid, tray) {
  return tray.every(piece => !piece || !canPlaceAnywhere(grid, piece));
}

/** Finner raden eller kolonnen med flest fylte celler — brukes som
    "gaven" når spilleren svarer riktig på et fagspørsmål. Returnerer
    null hvis brettet er helt tomt (ingenting å rydde). */
export function findBestLineToReward(grid) {
  let best = null;

  for (let r = 0; r < grid.size; r++) {
    let filled = 0;
    for (let c = 0; c < grid.size; c++) if (getCell(grid, r, c)) filled++;
    if (filled > 0 && (!best || filled > best.filled)) best = { type: 'row', line: r, filled };
  }

  for (let c = 0; c < grid.size; c++) {
    let filled = 0;
    for (let r = 0; r < grid.size; r++) if (getCell(grid, r, c)) filled++;
    if (filled > 0 && (!best || filled > best.filled)) best = { type: 'col', line: c, filled };
  }

  return best;
}

/** Tømmer én enkelt rad eller kolonne (fylt eller ikke). Returnerer
    antall celler som faktisk ble fjernet. */
export function clearLine(grid, lineInfo) {
  let removed = 0;
  if (lineInfo.type === 'row') {
    for (let c = 0; c < grid.size; c++) {
      if (getCell(grid, lineInfo.line, c)) removed++;
      setCell(grid, lineInfo.line, c, null);
    }
  } else {
    for (let r = 0; r < grid.size; r++) {
      if (getCell(grid, r, lineInfo.line)) removed++;
      setCell(grid, r, lineInfo.line, null);
    }
  }
  return removed;
}
