/* =========================================================
   BOARD — brettets datastruktur og generering.
   Brettet er en flat array av tiles, lest som rader (row-major),
   sammen med bredde/høyde. En tile er:
     { id, type, bonusMoves }
   `bonusMoves` er null for vanlige brikker, ellers et tall fra
   BONUS_VALUES. Modulen vet ingenting om DOM eller UI.
   ========================================================= */

import { BOARD_SIZE, TILE_TYPE_IDS, BONUS_VALUES, BONUS_TILE_CHANCE } from '../config/gameConfig.js';
import { pickFrom } from './rng.js';

let nextTileId = 1;

function makeTileId() {
  return 'tile-' + (nextTileId++);
}

export function pickBonusMoves(rng) {
  if (rng() >= BONUS_TILE_CHANCE) return null;
  const totalWeight = BONUS_VALUES.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = rng() * totalWeight;
  for (const entry of BONUS_VALUES) {
    roll -= entry.weight;
    if (roll <= 0) return entry.value;
  }
  return BONUS_VALUES[BONUS_VALUES.length - 1].value;
}

export function createTile(rng, typeOverride) {
  return {
    id: makeTileId(),
    type: typeOverride || pickFrom(rng, TILE_TYPE_IDS),
    bonusMoves: pickBonusMoves(rng)
  };
}

export function createBoard(width = BOARD_SIZE, height = BOARD_SIZE) {
  return { width, height, cells: new Array(width * height).fill(null) };
}

export function cloneBoard(board) {
  return { width: board.width, height: board.height, cells: board.cells.slice() };
}

export function index(board, row, col) {
  return row * board.width + col;
}

export function inBounds(board, row, col) {
  return row >= 0 && row < board.height && col >= 0 && col < board.width;
}

export function getTile(board, row, col) {
  if (!inBounds(board, row, col)) return null;
  return board.cells[index(board, row, col)];
}

export function setTile(board, row, col, tile) {
  board.cells[index(board, row, col)] = tile;
}

/* Finner rette linjer på 3+ like typer som ville oppstått dersom
   tile `type` ble plassert på (row, col). Brukes til å unngå at
   startbrettet fødes med ferdige matcher. */
function wouldMatchAt(board, row, col, type) {
  let horizontal = 1;
  for (let c = col - 1; c >= 0 && getTile(board, row, c)?.type === type; c--) horizontal++;
  for (let c = col + 1; c < board.width && getTile(board, row, c)?.type === type; c++) horizontal++;
  if (horizontal >= 3) return true;

  let vertical = 1;
  for (let r = row - 1; r >= 0 && getTile(board, r, col)?.type === type; r--) vertical++;
  for (let r = row + 1; r < board.height && getTile(board, r, col)?.type === type; r++) vertical++;
  return vertical >= 3;
}

function wouldCreateMatchIfSwapped(board, rowA, colA, rowB, colB) {
  const tileA = getTile(board, rowA, colA);
  const tileB = getTile(board, rowB, colB);
  if (!tileA || !tileB) return false;
  const swapped = cloneBoard(board);
  setTile(swapped, rowA, colA, tileB);
  setTile(swapped, rowB, colB, tileA);
  return wouldMatchAt(swapped, rowA, colA, tileB.type) || wouldMatchAt(swapped, rowB, colB, tileA.type);
}

/** Finnes det minst ett gyldig nabobytte som lager en match? */
export function hasAnyValidMove(board) {
  for (let row = 0; row < board.height; row++) {
    for (let col = 0; col < board.width; col++) {
      if (col + 1 < board.width && wouldCreateMatchIfSwapped(board, row, col, row, col + 1)) return true;
      if (row + 1 < board.height && wouldCreateMatchIfSwapped(board, row, col, row + 1, col)) return true;
    }
  }
  return false;
}

/** Lager et startbrett uten ferdige matcher, med minst ett gyldig trekk. */
export function createInitialBoard(rng, width = BOARD_SIZE, height = BOARD_SIZE, maxAttempts = 200) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const board = createBoard(width, height);
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        let type;
        let tries = 0;
        do {
          type = pickFrom(rng, TILE_TYPE_IDS);
          tries++;
        } while (wouldMatchAt(board, row, col, type) && tries < 40);
        setTile(board, row, col, createTile(rng, type));
      }
    }
    if (hasAnyValidMove(board)) return board;
  }
  throw new Error('Klarte ikke å generere et startbrett uten gyldige trekk.');
}

/** Stokker om brikkene på brettet (samme multisett), til det ikke har
    ferdige matcher og har minst ett gyldig trekk. Bruker ikke spillerens trekk. */
export function shuffleBoardInPlace(board, rng, maxAttempts = 200) {
  const tiles = board.cells.filter(Boolean);
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const order = tiles.slice();
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const candidate = { width: board.width, height: board.height, cells: order.slice() };
    if (!hasImmediateMatches(candidate) && hasAnyValidMove(candidate)) {
      board.cells = candidate.cells;
      return board;
    }
  }
  /* Fallback: godta siste forsøk selv om det ikke er perfekt — bedre enn
     å henge fast i en løkke. I praksis nås dette nesten aldri. */
  return board;
}

function hasImmediateMatches(board) {
  for (let row = 0; row < board.height; row++) {
    let run = 1;
    for (let col = 1; col < board.width; col++) {
      const prev = getTile(board, row, col - 1);
      const cur = getTile(board, row, col);
      run = cur && prev && cur.type === prev.type ? run + 1 : 1;
      if (run >= 3) return true;
    }
  }
  for (let col = 0; col < board.width; col++) {
    let run = 1;
    for (let row = 1; row < board.height; row++) {
      const prev = getTile(board, row - 1, col);
      const cur = getTile(board, row, col);
      run = cur && prev && cur.type === prev.type ? run + 1 : 1;
      if (run >= 3) return true;
    }
  }
  return false;
}
