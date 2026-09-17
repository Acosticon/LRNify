/* =========================================================
   SCORING — poeng for matchgrupper og cascade-multiplikator.
   All balansering skjer i gameConfig.js — denne modulen bare
   slår opp tallene.
   ========================================================= */

import { SCORING } from '../config/gameConfig.js';

export function basePointsForGroupSize(size) {
  if (size >= 5) return SCORING.match5Plus;
  if (size === 4) return SCORING.match4;
  return SCORING.match3;
}

/** Poeng for én cascade-runde (0 = det opprinnelige byttet, 1+ = kjede-reaksjoner). */
export function pointsForCascadeStep(groups, cascadeIndex) {
  const base = groups.reduce((sum, group) => sum + basePointsForGroupSize(group.cells.length), 0);
  const multiplier = 1 + cascadeIndex * SCORING.cascadeMultiplierStep;
  return Math.round(base * multiplier);
}

export const CORRECT_ANSWER_POINTS = SCORING.correctAnswer;
