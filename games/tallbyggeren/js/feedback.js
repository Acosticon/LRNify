/* =========================================================
   FAGLIG OBSERVASJON
   Etter en løsning sier spillet én setning om hva det siste trekket
   faktisk gjorde med målene. Poenget er innsikt, ikke belønning:
   «Du økte det største tallet. Det flyttet variasjonsbredden uten
   å endre medianen.»
   ========================================================= */

import { calculateStats, nearlyEqual, formatNumber } from './stats.js';
import { REQUIREMENT_LABELS, REQUIREMENT_LABELS_DEFINITE } from './challenge.js';

const MEASURES = ['mean', 'median', 'mode', 'range'];

/* Hvilken rolle spilte tallet som ble endret, før endringen? */
function roleOf(before, position) {
  const value = before[position];
  const sorted = [...before].sort((a, b) => a - b);
  const isMax = nearlyEqual(value, sorted[sorted.length - 1]);
  const isMin = nearlyEqual(value, sorted[0]);
  if (isMax && isMin) return 'et av tallene';
  if (isMax) return 'det største tallet';
  if (isMin) return 'det minste tallet';
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1 && nearlyEqual(value, sorted[mid])) return 'det midterste tallet';
  return 'et av tallene i midten';
}

function listNorwegian(items) {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  return items.slice(0, -1).join(', ') + ' og ' + items[items.length - 1];
}

/* Bare mål oppgaven faktisk stiller krav om er verdt å kommentere. */
function relevantMeasures(challenge) {
  const asked = MEASURES.filter((key) => key in challenge.requirements);
  return asked.length ? asked : MEASURES;
}

export function describeMove(before, after, challenge) {
  if (!before || before.length !== after.length) return null;

  const changed = [];
  for (let i = 0; i < after.length; i++) {
    if (!nearlyEqual(before[i], after[i])) changed.push(i);
  }
  if (changed.length !== 1) return null;

  const position = changed[0];
  const direction = after[position] > before[position] ? 'økte' : 'senket';
  const statsBefore = calculateStats(before);
  const statsAfter = calculateStats(after);

  const moved = [];
  const still = [];
  for (const key of relevantMeasures(challenge)) {
    const a = statsBefore[key];
    const b = statsAfter[key];
    const label = REQUIREMENT_LABELS_DEFINITE[key];
    if (a === null && b === null) continue;
    (nearlyEqual(a, b) ? still : moved).push(label);
  }
  if (!moved.length) return null;

  let sentence = `Du ${direction} ${roleOf(before, position)}. `;
  sentence += `Det flyttet ${listNorwegian(moved)}`;
  sentence += still.length ? ` uten å endre ${listNorwegian(still)}.` : '.';
  return sentence;
}

/* Kort oppsummering av datasettet spilleren endte på. */
export function describeResult(values, challenge) {
  const stats = calculateStats(values);
  return relevantMeasures(challenge)
    .map((key) => {
      const label = REQUIREMENT_LABELS[key].toLowerCase();
      return `${label} ${formatNumber(stats[key], { nullText: 'ingen' })}`;
    })
    .join(' · ');
}
