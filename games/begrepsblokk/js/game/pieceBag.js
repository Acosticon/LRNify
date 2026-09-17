/* =========================================================
   PIECE BAG — trekker nye brikker til trallen.
   En brikke er { id, shapeId, cells, type }. `cells` er alltid
   normalisert (minste rad/kolonne er 0), slik at UI-et kan tegne
   den direkte som en liten boks.
   ========================================================= */

import { SHAPES } from './shapes.js';
import { BLOCK_TYPE_IDS } from '../config/gameConfig.js';
import { pickFrom, pickWeighted } from './rng.js';

let nextPieceId = 1;

export function createPiece(rng) {
  const shape = pickWeighted(rng, SHAPES);
  return {
    id: 'piece-' + (nextPieceId++),
    shapeId: shape.id,
    cells: shape.cells,
    type: pickFrom(rng, BLOCK_TYPE_IDS)
  };
}

export function createTray(rng, size) {
  return Array.from({ length: size }, () => createPiece(rng));
}
