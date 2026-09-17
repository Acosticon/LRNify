/* =========================================================
   MOVES — bytte av to naboceller.
   Vet ingenting om trekk-teller eller poeng — sier bare om et
   bytte er gyldig (skaper en match) og utfører selve byttet.
   ========================================================= */

import { getTile, setTile, cloneBoard } from './board.js';
import { findMatches } from './matches.js';

export function isAdjacent(a, b) {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

function swapInPlace(board, a, b) {
  const tileA = getTile(board, a.row, a.col);
  const tileB = getTile(board, b.row, b.col);
  setTile(board, a.row, a.col, tileB);
  setTile(board, b.row, b.col, tileA);
}

/** Prøver å bytte to naboceller. Returnerer:
    { valid:false } — ugyldig bytte, brettet er uendret
    { valid:true, board, matches } — gyldig bytte, matches funnet på det nye brettet */
export function attemptSwap(board, posA, posB) {
  if (!isAdjacent(posA, posB)) return { valid: false, reason: 'not-adjacent' };
  const tileA = getTile(board, posA.row, posA.col);
  const tileB = getTile(board, posB.row, posB.col);
  if (!tileA || !tileB) return { valid: false, reason: 'empty-cell' };

  const next = cloneBoard(board);
  swapInPlace(next, posA, posB);
  const matches = findMatches(next);

  if (matches.length === 0) {
    return { valid: false, reason: 'no-match' };
  }
  return { valid: true, board: next, matches };
}
