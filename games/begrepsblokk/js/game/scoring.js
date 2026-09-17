/* =========================================================
   SCORING — alle poengberegninger samlet ett sted.
   ========================================================= */

import { SCORING } from '../config/gameConfig.js';

export function pointsForPlacement(cellCount) {
  return cellCount * SCORING.perCellPlaced;
}

/** Poeng for å rydde `lineCount` fylte rader/kolonner i samme trekk.
    Flere linjer på én gang gir en stigende multiplikator. */
export function pointsForLineClear(lineCount) {
  if (lineCount <= 0) return 0;
  const multiplier = 1 + (lineCount - 1) * SCORING.multiLineBonusStep;
  return Math.round(lineCount * SCORING.perLineClearBase * multiplier);
}

/** Poeng for cellene som ryddes gratis som belønning for riktig svar —
    verdsatt som en vanlig plassering, ikke som en linjerydding
    spilleren selv skapte. */
export function pointsForRewardClear(cellCount) {
  return cellCount * SCORING.perCellPlaced;
}
