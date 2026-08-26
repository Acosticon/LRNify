/* =========================================================
   CHALLENGE-DATAMODELL
   Én oppgave er ren data. Ingen spillkode leser felt direkte fra
   et rått objekt — alt går via normalizeChallenge(), slik at
   resten av motoren alltid ser den samme, fullstendige formen.
   ========================================================= */

export const REQUIREMENT_KEYS = ['mean', 'median', 'mode', 'range'];

export const REQUIREMENT_LABELS = {
  mean:   'Gjennomsnitt',
  median: 'Median',
  mode:   'Typetall',
  range:  'Variasjonsbredde',
};

/* Bestemt form — brukes i setninger: «det flyttet medianen» */
export const REQUIREMENT_LABELS_DEFINITE = {
  mean:   'gjennomsnittet',
  median: 'medianen',
  mode:   'typetallet',
  range:  'variasjonsbredden',
};

/* Spesialverdi for requirements.mode: datasettet skal ikke ha noe
   typetall i det hele tatt (2, 2, 4, 4, 7). Se stats.calculateMode. */
export const NO_MODE = 'ingen';

const DEFAULT_VALUES = { count: 5, min: 0, max: 12, integersOnly: true };

const DEFAULT_CONSTRAINTS = {
  mustInclude: [],
  mustNotInclude: [],
  minValue: null,
  maxValue: null,
  allUnique: false,
  exactDistinctValues: null,
  occurrences: {},
};

export function normalizeChallenge(raw) {
  const values = { ...DEFAULT_VALUES, ...(raw.values || {}) };
  const requirements = {};
  for (const key of REQUIREMENT_KEYS) {
    const target = raw.requirements ? raw.requirements[key] : undefined;
    if (target !== undefined && target !== null) requirements[key] = target;
  }

  const constraints = { ...DEFAULT_CONSTRAINTS, ...(raw.constraints || {}) };
  constraints.mustInclude = [...constraints.mustInclude];
  constraints.mustNotInclude = [...constraints.mustNotInclude];
  constraints.occurrences = { ...constraints.occurrences };

  const lockedValues = (raw.lockedValues || []).map((lock) => ({
    position: lock.position,
    value: lock.value,
  }));

  return {
    id: raw.id,
    level: raw.level,
    values,
    requirements,
    constraints,
    lockedValues,
    requiredSolutions: raw.requiredSolutions ?? 1,
    /* Oppgaver som IKKE kan løses. Spilleren skal selv oppdage det
       og trykke «umulig». Brukes fra nivå 6. */
    impossible: raw.impossible === true,
    teachingGoal: raw.teachingGoal || '',
    /* Setningen spilleren møter når oppgaven er løst. */
    insight: raw.insight || '',
    hints: raw.hints || [],
    /* Startdatasettet er en del av oppgavedesignet: det bestemmer
       hvilken erkjennelse spilleren starter fra. */
    start: raw.start || null,
    /* Fasit brukes av QA og av oppsummeringen etter oppgaven. */
    reference: raw.reference || null,
    note: raw.note || '',
  };
}

/* Startdatasett: bruk designerens hvis det finnes, ellers et nøytralt
   sett midt i tallområdet med de låste tallene på plass. */
export function initialDataset(challenge) {
  const { values, lockedValues } = challenge;
  let dataset;
  if (challenge.start) {
    dataset = [...challenge.start];
  } else {
    const middle = Math.round((values.min + values.max) / 2);
    dataset = new Array(values.count).fill(middle);
  }
  for (const lock of lockedValues) dataset[lock.position] = lock.value;
  return dataset;
}

export function isLocked(challenge, position) {
  return challenge.lockedValues.some((lock) => lock.position === position);
}

/* Steget en tallbrikke flytter seg med. Desimaloppgaver flytter 0,5. */
export function stepSize(challenge) {
  return challenge.values.integersOnly ? 1 : 0.5;
}

export function clampValue(challenge, value) {
  const { min, max } = challenge.values;
  return Math.min(max, Math.max(min, value));
}
