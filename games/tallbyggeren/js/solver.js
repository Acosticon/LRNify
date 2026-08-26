/* =========================================================
   SOLVER
   Teller og finner løsninger på en oppgave. Brukes som
   QA-verktøy for kampanjen, som fasit-kilde og som kontroll av
   genererte sandkasseoppgaver.

   Søket teller opp datasett i stigende rekkefølge (ikke-synkende
   følger). Da dukker hvert datasett opp nøyaktig én gang —
   2, 4, 6, 8 og 8, 6, 4, 2 er samme løsning.
   ========================================================= */

import { validateDataset } from './validator.js';
import { stepSize } from './challenge.js';
import { nearlyEqual } from './stats.js';

const EPS = 1e-9;

export function solveChallenge(challenge, options = {}) {
  const { maxSolutions = 1000, maxNodes = 4_000_000 } = options;

  const step = stepSize(challenge);
  const { count } = challenge.values;
  const cons = challenge.constraints;

  /* Grensene kan trygt strammes inn: et datasett som bryter
     minValue/maxValue er uansett ikke en løsning. */
  const lo = Math.max(challenge.values.min, cons.minValue ?? -Infinity);
  const hi = Math.min(challenge.values.max, cons.maxValue ?? Infinity);

  const solutions = [];
  let nodes = 0;
  let truncated = false;
  let budgetSpent = false;

  if (lo > hi || count <= 0) {
    return { solvable: false, solutionCount: 0, solutions: [], truncated: false, exhausted: true, nodes: 0 };
  }

  const targetSum = 'mean' in challenge.requirements
    ? challenge.requirements.mean * count : null;
  const targetRange = challenge.requirements.range ?? null;

  /* Verdier som må være med, med minste antall forekomster:
     låste tall teller med sin multiplisitet, mustInclude med minst én. */
  const requiredCounts = new Map();
  for (const lock of challenge.lockedValues) {
    requiredCounts.set(lock.value, (requiredCounts.get(lock.value) || 0) + 1);
  }
  for (const v of cons.mustInclude) {
    if (!requiredCounts.has(v)) requiredCounts.set(v, 1);
  }
  for (const v of requiredCounts.keys()) {
    if (v < lo - EPS || v > hi + EPS) {
      return { solvable: false, solutionCount: 0, solutions: [], truncated: false, exhausted: true, nodes: 0 };
    }
  }

  const forbidden = new Set(cons.mustNotInclude);
  const occurrenceLimits = new Map(
    Object.entries(cons.occurrences).map(([v, n]) => [Number(v), n])
  );

  const current = new Array(count);
  const placed = new Map();

  const stepsAvailable = Math.floor((hi - lo) / step + EPS);
  const valueAt = (i) => lo + i * step;

  search(0, 0, 0, 0);

  return {
    solvable: solutions.length > 0,
    solutionCount: solutions.length,
    solutions,
    truncated,
    exhausted: !truncated && !budgetSpent,
    nodes,
  };

  function search(depth, fromIndex, sum, distinct) {
    if (truncated || budgetSpent) return;
    if (++nodes > maxNodes) { budgetSpent = true; return; }

    const remaining = count - depth;

    if (remaining === 0) {
      /* Låste tall og mustInclude kontrolleres mot multimengden, ikke
         mot posisjoner: et sortert datasett som inneholder de låste
         tallene kan alltid stokkes slik at de havner på plassene sine. */
      for (const [value, needed] of requiredCounts) {
        if ((placed.get(value) || 0) < needed) return;
      }
      const result = validateDataset(current, challenge);
      if (result.requirementsPassed && result.constraintsPassed) {
        solutions.push([...current]);
        if (solutions.length >= maxSolutions) truncated = true;
      }
      return;
    }

    const first = depth > 0 ? current[0] : null;
    /* Sortert datasett: variasjonsbredden er låst av det første
       tallet, så ingen verdi kan passere første tall + bredden. */
    const capValue = targetRange !== null && first !== null
      ? Math.min(hi, first + targetRange) : hi;

    /* Krav som ennå ikke er dekket må få plass i det som er igjen —
       og verdier under neste kandidat kommer aldri igjen. */
    let stillNeeded = 0;
    for (const [value, needed] of requiredCounts) {
      const missing = needed - (placed.get(value) || 0);
      if (missing > 0) {
        if (value < valueAt(fromIndex) - EPS) return;
        stillNeeded += missing;
      }
    }
    if (stillNeeded > remaining) return;

    for (let i = fromIndex; i <= stepsAvailable; i++) {
      const v = valueAt(i);
      if (v > capValue + EPS) break;
      if (forbidden.has(v)) continue;

      const already = placed.get(v) || 0;
      if (cons.allUnique && already >= 1) continue;
      if (occurrenceLimits.has(v) && already >= occurrenceLimits.get(v)) continue;

      const nextDistinct = already === 0 ? distinct + 1 : distinct;
      if (cons.exactDistinctValues !== null && nextDistinct > cons.exactDistinctValues) break;

      if (targetSum !== null) {
        /* Alle senere tall er minst v: mindre enn dette blir summen aldri. */
        if (sum + v * remaining > targetSum + EPS) break;
        /* Og større enn dette blir den aldri: hopp til et større tall. */
        if (sum + v + capValue * (remaining - 1) < targetSum - EPS) continue;
      }

      /* Siste plass, og største tall mangler fortsatt for å nå bredden. */
      if (targetRange !== null && remaining === 1 && first !== null) {
        const needMax = first + targetRange;
        if (current[depth - 1] < needMax - EPS && !nearlyEqual(v, needMax)) continue;
      }

      current[depth] = v;
      placed.set(v, already + 1);
      search(depth + 1, i, sum + v, nextDistinct);
      placed.set(v, already);
      if (truncated || budgetSpent) return;
    }
  }
}

/* Et sortert løsningsdatasett lagt ut slik oppgaven skal spilles:
   låste tall på sine plasser, resten sortert i de ledige. */
export function arrangeForChallenge(solution, challenge) {
  if (!challenge.lockedValues.length) return [...solution];
  const rest = [...solution].sort((a, b) => a - b);
  const arranged = new Array(challenge.values.count).fill(null);
  for (const lock of challenge.lockedValues) {
    const at = rest.findIndex((v) => nearlyEqual(v, lock.value));
    if (at >= 0) rest.splice(at, 1);
    arranged[lock.position] = lock.value;
  }
  for (let i = 0; i < arranged.length; i++) {
    if (arranged[i] === null) arranged[i] = rest.shift();
  }
  return arranged;
}

/* Praktisk innpakning: «finnes det i det hele tatt en løsning?» */
export function hasSolution(challenge) {
  return solveChallenge(challenge, { maxSolutions: 1 }).solvable;
}
