/* =========================================================
   SPILLTILSTAND
   Holder styr på økten: hvilken oppgave vi er på, datasettet
   spilleren bygger, hvilke løsninger som er godtatt og hvor mange
   hint som er brukt. Ingen DOM her — UI-et leser bare av.
   ========================================================= */

import {
  normalizeChallenge, initialDataset, clampValue, isLocked, stepSize,
} from './challenge.js';
import { validateDataset } from './validator.js';
import { datasetKey } from './stats.js';
import { describeMove } from './feedback.js';
import { hintAt, hintCount } from './hints.js';

export function createSession(rawChallenges, options = {}) {
  const challenges = rawChallenges.map(normalizeChallenge);
  const session = {
    mode: options.mode || 'kampanje',
    challenges,
    index: 0,
    dataset: [],
    /* Datasettet før forrige endring — grunnlaget for observasjonen. */
    previous: null,
    lastMove: null,
    solutions: [],
    hintIndex: -1,
    moves: 0,
    impossibleClaimed: false,
    repeatedSolution: false,
    results: [],
  };

  loadCurrent(session);
  return session;
}

export function currentChallenge(session) {
  return session.challenges[session.index];
}

export function loadCurrent(session) {
  const challenge = currentChallenge(session);
  session.dataset = initialDataset(challenge);
  session.previous = null;
  session.lastMove = null;
  session.solutions = [];
  session.hintIndex = -1;
  session.moves = 0;
  session.impossibleClaimed = false;
  session.repeatedSolution = false;
  return session;
}

export function validation(session) {
  return validateDataset(session.dataset, currentChallenge(session));
}

/* --- endre datasettet ---------------------------------------- */

export function setValue(session, position, rawValue) {
  const challenge = currentChallenge(session);
  if (isLocked(challenge, position)) return validation(session);
  if (!Number.isFinite(rawValue)) return validation(session);

  const step = stepSize(challenge);
  const snapped = Math.round(rawValue / step) * step;
  const value = clampValue(challenge, snapped);
  if (value === session.dataset[position]) return validation(session);

  session.previous = [...session.dataset];
  session.dataset = session.dataset.map((v, i) => (i === position ? value : v));
  session.moves++;
  session.lastMove = describeMove(session.previous, session.dataset, challenge);

  return registerIfSolved(session);
}

export function nudge(session, position, steps) {
  const challenge = currentChallenge(session);
  return setValue(session, position, session.dataset[position] + steps * stepSize(challenge));
}

export function resetDataset(session) {
  const challenge = currentChallenge(session);
  session.dataset = initialDataset(challenge);
  session.previous = null;
  session.lastMove = null;
  return validation(session);
}

/* --- løsninger ------------------------------------------------ */

/* Løsninger sammenliknes sortert: 2, 4, 6, 8 og 8, 6, 4, 2 er
   samme løsning, og teller bare én gang når oppgaven ber om flere. */
function registerIfSolved(session) {
  const result = validation(session);
  if (!result.solved) {
    session.repeatedSolution = false;
    return result;
  }

  const key = datasetKey(session.dataset);
  const known = session.solutions.some((s) => datasetKey(s) === key);
  if (known) {
    session.repeatedSolution = true;
  } else {
    session.solutions.push([...session.dataset]);
    session.repeatedSolution = false;
  }
  return result;
}

/* Sant når datasettet er gyldig, men er en løsning spilleren
   allerede har levert. Da må hen finne en annen. */
export function isRepeatedSolution(session) {
  return session.repeatedSolution === true;
}

export function solutionsNeeded(session) {
  return currentChallenge(session).requiredSolutions;
}

export function isTaskComplete(session) {
  const challenge = currentChallenge(session);
  if (challenge.impossible) return session.impossibleClaimed;
  return session.solutions.length >= challenge.requiredSolutions;
}

/* Nivå 6 har oppgaver som ikke kan løses. Spilleren må selv se det. */
export function claimImpossible(session) {
  const challenge = currentChallenge(session);
  if (challenge.impossible) {
    session.impossibleClaimed = true;
    return { correct: true };
  }
  return { correct: false };
}

/* --- hint ------------------------------------------------------ */

export function nextHint(session) {
  const challenge = currentChallenge(session);
  if (session.hintIndex + 1 >= hintCount(challenge)) return null;
  session.hintIndex++;
  return hintAt(challenge, session.dataset, session.hintIndex);
}

export function visibleHints(session) {
  const challenge = currentChallenge(session);
  const out = [];
  for (let i = 0; i <= session.hintIndex; i++) {
    out.push(hintAt(challenge, session.dataset, i));
  }
  return out;
}

export function hintsLeft(session) {
  return hintCount(currentChallenge(session)) - (session.hintIndex + 1);
}

/* --- navigasjon ------------------------------------------------ */

export function commitResult(session) {
  const challenge = currentChallenge(session);
  session.results.push({
    id: challenge.id,
    level: challenge.level,
    solved: isTaskComplete(session),
    moves: session.moves,
    hintsUsed: session.hintIndex + 1,
    solutions: session.solutions.map((s) => [...s]),
  });
}

export function hasNext(session) {
  return session.index + 1 < session.challenges.length;
}

export function goNext(session) {
  if (!hasNext(session)) return false;
  session.index++;
  loadCurrent(session);
  return true;
}

export function summary(session) {
  const solved = session.results.filter((r) => r.solved).length;
  const noHints = session.results.filter((r) => r.solved && r.hintsUsed === 0).length;
  return {
    total: session.challenges.length,
    solved,
    noHints,
    hintsUsed: session.results.reduce((sum, r) => sum + r.hintsUsed, 0),
  };
}
