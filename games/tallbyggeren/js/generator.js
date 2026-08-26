/* =========================================================
   SANDKASSEGENERATOR
   Lager nye oppgaver med samme vanskelighetsprofil som et gitt
   kampanjenivå.

   Framgangsmåten er å gå baklengs: først trekkes et tilfeldig
   datasett, så leses kravene ut av det datasettet. Da vet vi at
   oppgaven har minst én løsning før solveren i det hele tatt
   kjører. Solveren brukes etterpå til å sjekke at løsningsrommet
   ligger innenfor nivåets profil — er oppgaven for stram eller
   for løs, forkastes den og vi trekker på nytt.

   Kampanjens hint er håndskrevet. Her finnes ingen forfatter, så
   sandkassen bruker faste hintmaler per mål. De sier mindre om
   nettopp denne oppgaven, og det er en av grunnene til at
   kampanjen fortsatt er hovedveien gjennom spillet.
   ========================================================= */

import { normalizeChallenge } from './challenge.js';
import { calculateStats } from './stats.js';
import { solveChallenge } from './solver.js';
import { validateDataset } from './validator.js';

/* Hvor stort løsningsrommet skal være for at oppgaven kjennes
   som nivået den er ment å tilhøre. Tallene er lest av
   kampanjeoppgavene i qa/check-campaign.mjs. */
const PROFILES = {
  1: { counts: [3, 4, 5],    max: [10, 12],     requirements: 1, constraints: 0, solutions: [20, 20000] },
  2: { counts: [4, 5],       max: [12],         requirements: 1, constraints: 1, solutions: [10, 8000] },
  3: { counts: [4, 5, 6],    max: [12],         requirements: 2, constraints: 0, solutions: [5, 4000] },
  4: { counts: [5, 6],       max: [12, 14],     requirements: 2, constraints: 1, solutions: [3, 1500] },
  5: { counts: [5, 6],       max: [12, 14],     requirements: 3, constraints: 0, solutions: [2, 600] },
  6: { counts: [5, 6],       max: [12, 16, 20], requirements: 3, constraints: 1, solutions: [1, 120] },
};

const MEASURES = ['mean', 'median', 'mode', 'range'];

const HINT_TEMPLATES = {
  mean: [
    'Tenk på summen. Hvor stor må den bli?',
    'Summen din er {sum}, og målet er {malsum}.',
  ],
  median: [
    'Sorter tallene. Hvilket tall — eller hvilke to — havner i midten?',
    'Sortert er tallene {tallene}, og medianen er {median}.',
  ],
  mode: [
    'Typetallet er verdien som går igjen oftest, og den må være alene om det.',
    'Typetallet ditt er nå {typetall}.',
  ],
  range: [
    'Bare det største og det minste tallet bestemmer variasjonsbredden.',
    'Fra {minste} til {storste} gir bredde {bredde}.',
  ],
};

function randomInt(random, min, max) {
  return min + Math.floor(random() * (max - min + 1));
}
function pick(random, list) {
  return list[Math.floor(random() * list.length)];
}

/* Enkel, deterministisk generator slik at et frø gir samme
   oppgaverekke igjen — nyttig når en lærer vil dele et sett. */
export function createRandom(seed = Date.now()) {
  let state = seed >>> 0 || 1;
  return function random() {
    state ^= state << 13; state >>>= 0;
    state ^= state >> 17;
    state ^= state << 5;  state >>>= 0;
    return state / 4294967296;
  };
}

function drawSeedDataset(random, count, min, max) {
  const values = [];
  for (let i = 0; i < count; i++) values.push(randomInt(random, min, max));
  /* Et par gjentakelser gjør at typetall kan brukes som krav. */
  if (random() < 0.6) values[randomInt(random, 0, count - 1)] = values[0];

  /* Dytt summen til nærmeste multiplum av antallet, slik at
     gjennomsnittet blir et helt tall og kan brukes som krav. */
  if (random() < 0.7) {
    const sum = values.reduce((a, b) => a + b, 0);
    const wanted = Math.round(sum / count) * count;
    const adjusted = values[count - 1] + (wanted - sum);
    if (adjusted >= min && adjusted <= max) values[count - 1] = adjusted;
  }
  return values;
}

function buildRequirements(random, stats, howMany) {
  const available = MEASURES.filter((key) => {
    if (key === 'mode') return stats.mode !== null;
    if (key === 'range') return stats.range > 0;
    if (key === 'mean') return Number.isInteger(stats.mean);
    /* Halve medianer (8,5) er riktige, men lite skolevante som mål. */
    return Number.isInteger(stats.median);
  });
  const chosen = [];
  const pool = [...available];
  while (chosen.length < howMany && pool.length) {
    chosen.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  }
  if (chosen.length < howMany) return null;

  const requirements = {};
  for (const key of chosen) requirements[key] = stats[key];
  return requirements;
}

function buildConstraints(random, seed, stats, requirements) {
  const options = [];
  const spread = [...new Set(seed)].sort((a, b) => a - b);

  /* Et tall som må være med — helst ett som ikke er gitt av kravene. */
  const candidate = pick(random, spread);
  if (candidate !== requirements.median && candidate !== requirements.mode) {
    options.push({ constraints: { mustInclude: [candidate] } });
  }
  /* Et tall som ikke får brukes: velg et som ikke er i datasettet. */
  if (!('mode' in requirements)) {
    const banned = requirements.mean ?? requirements.median;
    if (Number.isInteger(banned) && !seed.includes(banned)) {
      options.push({ constraints: { mustNotInclude: [banned] } });
    }
  }
  /* Et låst tall på en tilfeldig plass. */
  const position = randomInt(random, 0, seed.length - 1);
  options.push({ lockedValues: [{ position, value: seed[position] }] });
  /* Nedre grense, når datasettet har rom for den. */
  if (stats.min > 0) options.push({ constraints: { minValue: stats.min } });
  /* Alle ulike, når datasettet faktisk er det og typetall ikke kreves. */
  if (!('mode' in requirements) && new Set(seed).size === seed.length) {
    options.push({ constraints: { allUnique: true } });
  }

  return options.length ? pick(random, options) : null;
}

/* Startdatasettet skal være lovlig, men ikke løse oppgaven. */
function buildStart(challenge) {
  const { count, min, max } = challenge.values;
  const middle = Math.round((min + max) / 2);
  const candidates = [middle, middle + 2, middle - 2, middle + 1, middle - 1, min, max];

  for (const value of candidates) {
    if (value < min || value > max) continue;
    const start = new Array(count).fill(value);
    for (const lock of challenge.lockedValues) start[lock.position] = lock.value;
    if (!validateDataset(start, challenge).solved) return start;
  }
  return null;
}

function describeRequirements(requirements) {
  const words = { mean: 'gjennomsnitt', median: 'median', mode: 'typetall', range: 'variasjonsbredde' };
  return Object.keys(requirements).map((key) => words[key]).join(', ');
}

function buildHints(requirements) {
  const keys = Object.keys(requirements);
  const hints = [];
  for (const key of keys) hints.push(HINT_TEMPLATES[key][0]);
  for (const key of keys) hints.push(HINT_TEMPLATES[key][1]);
  return hints;
}

/* Lager én oppgave, eller null om trekningen ikke holdt mål. */
function attempt(random, level, index) {
  const profile = PROFILES[level];
  const count = pick(random, profile.counts);
  const max = pick(random, profile.max);
  const seed = drawSeedDataset(random, count, 0, max);
  const stats = calculateStats(seed);

  const requirements = buildRequirements(random, stats, profile.requirements);
  if (!requirements) return null;

  const raw = {
    id: `sandkasse-${level}-${index}`,
    level,
    values: { count, min: 0, max, integersOnly: true },
    requirements,
    teachingGoal: `Bygg et datasett med gitt ${describeRequirements(requirements)}.`,
    hints: buildHints(requirements),
  };

  if (profile.constraints > 0) {
    const extra = buildConstraints(random, seed, stats, requirements);
    if (!extra) return null;
    Object.assign(raw, extra);
  }

  const challenge = normalizeChallenge(raw);

  const start = buildStart(challenge);
  if (!start) return null;
  challenge.start = start;
  raw.start = start;

  const solved = solveChallenge(challenge, { maxSolutions: profile.solutions[1] + 1 });
  const [minSolutions, maxSolutions] = profile.solutions;
  if (solved.solutionCount < minSolutions || solved.solutionCount > maxSolutions) return null;

  challenge.reference = solved.solutions[Math.floor(random() * solved.solutions.length)];
  challenge.insight = `Datasettet ditt: ${challenge.reference.join(', ')} er én av ${solved.solutionCount} mulige løsninger.`;
  return challenge;
}

export function generateChallenges(level, count, options = {}) {
  const random = options.random || createRandom(options.seed);
  const maxAttempts = options.maxAttempts || 400;
  const challenges = [];
  const seen = new Set();

  let attempts = 0;
  while (challenges.length < count && attempts < maxAttempts) {
    attempts++;
    const challenge = attempt(random, level, challenges.length + 1);
    if (!challenge) continue;
    /* Unngå to like oppgaver rett etter hverandre. */
    const key = JSON.stringify([challenge.values, challenge.requirements, challenge.constraints, challenge.lockedValues]);
    if (seen.has(key)) continue;
    seen.add(key);
    challenges.push(challenge);
  }
  return challenges;
}
