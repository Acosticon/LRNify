/* =========================================================
   GRAVITY — tyngdekraft og påfyll.
   Fjerner tiles i et gitt sett med celler, lar resten falle
   nedover per kolonne, og fyller på nye brikker ovenfra.
   Returnerer et nytt brett — muterer ikke input.
   ========================================================= */

import { createBoard, createTile, getTile, setTile } from './board.js';

/**
 * @param {object} board
 * @param {Set<string>} removedCellKeys - "row,col" nøkler som skal tømmes
 * @param {function} rng
 * @returns {{ board: object, newTiles: Array<{row:number,col:number,tile:object}> }}
 */
export function applyGravityAndRefill(board, removedCellKeys, rng) {
  const next = createBoard(board.width, board.height);
  const newTiles = [];

  for (let col = 0; col < board.width; col++) {
    const surviving = [];
    for (let row = 0; row < board.height; row++) {
      const key = row + ',' + col;
      if (removedCellKeys.has(key)) continue;
      const tile = getTile(board, row, col);
      if (tile) surviving.push(tile);
    }

    const missing = board.height - surviving.length;
    for (let i = 0; i < missing; i++) {
      const tile = createTile(rng);
      newTiles.push({ row: i, col, tile });
      setTile(next, i, col, tile);
    }
    for (let i = 0; i < surviving.length; i++) {
      setTile(next, missing + i, col, surviving[i]);
    }
  }

  return { board: next, newTiles };
}
