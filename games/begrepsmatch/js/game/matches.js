/* =========================================================
   MATCHES — finner rette linjer på 3 eller flere like brikker.
   Kjenner ikke til poeng, trekk eller spørsmål — returnerer
   bare hvilke grupper av celler som matcher, som match-3-
   motoren (engine.js) og UI-et kan bygge videre på.
   ========================================================= */

import { getTile, index as cellIndex } from './board.js';

/** Finner alle horisontale og vertikale løp på 3+ like typer.
    Returnerer en liste av grupper: { type, cells:[{row,col}] }. */
export function findMatches(board) {
  const groups = [];

  for (let row = 0; row < board.height; row++) {
    let runStart = 0;
    for (let col = 1; col <= board.width; col++) {
      const prev = getTile(board, row, col - 1);
      const cur = col < board.width ? getTile(board, row, col) : null;
      const sameRun = cur && prev && cur.type === prev.type;
      if (!sameRun) {
        const runLength = col - runStart;
        if (runLength >= 3 && prev) {
          groups.push({
            type: prev.type,
            cells: Array.from({ length: runLength }, (_, i) => ({ row, col: runStart + i }))
          });
        }
        runStart = col;
      }
    }
  }

  for (let col = 0; col < board.width; col++) {
    let runStart = 0;
    for (let row = 1; row <= board.height; row++) {
      const prev = getTile(board, row - 1, col);
      const cur = row < board.height ? getTile(board, row, col) : null;
      const sameRun = cur && prev && cur.type === prev.type;
      if (!sameRun) {
        const runLength = row - runStart;
        if (runLength >= 3 && prev) {
          groups.push({
            type: prev.type,
            cells: Array.from({ length: runLength }, (_, i) => ({ row: runStart + i, col }))
          });
        }
        runStart = row;
      }
    }
  }

  return groups;
}

/** Unik nøkkel for en celle, brukt i Set/Map. */
export function cellKey(row, col) {
  return row + ',' + col;
}

/** Slår sammen alle celler fra en liste med matchgrupper til ett Set. */
export function collectMatchedCells(groups) {
  const set = new Set();
  for (const group of groups) {
    for (const { row, col } of group.cells) set.add(cellKey(row, col));
  }
  return set;
}

/** Henter ut tiles (inkl. bonusbrikker) som befinner seg i et sett med celler. */
export function collectRemovedTiles(board, cellSet) {
  const removed = [];
  for (const key of cellSet) {
    const [row, col] = key.split(',').map(Number);
    const tile = getTile(board, row, col);
    if (tile) removed.push({ row, col, tile, index: cellIndex(board, row, col) });
  }
  return removed;
}
