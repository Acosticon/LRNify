/* =========================================================
   QA FOR KAMPANJEN
   Kjører solveren over alle kampanjeoppgavene og kontrollerer at
   oppgavedesignet holder. Dette er verktøyet oppgavene balanseres
   med — kjør det etter hver endring i challenges.js:

     node games/tallbyggeren/qa/check-campaign.mjs

   Kontrollerer for hver oppgave at
     · den er løsbar (eller umulig, dersom den er merket umulig)
     · det finnes minst like mange løsninger som oppgaven krever
     · startdatasettet er lovlig, men ikke allerede løst
     · fasitløsningen faktisk løser oppgaven
     · læringsmål og hint finnes
   ========================================================= */

import { CAMPAIGN } from '../js/challenges.js';
import { normalizeChallenge, NO_MODE } from '../js/challenge.js';
import { solveChallenge } from '../js/solver.js';
import { validateDataset } from '../js/validator.js';
import { formatDataset } from '../js/stats.js';

/* Forventet løsningsrom per nivå. Ikke en fasit, men et varsel:
   faller en oppgave utenfor, er den trolig plassert på feil nivå. */
const PROFILE = {
  1: { min: 8,  max: 20000 },
  2: { min: 5,  max: 8000 },
  3: { min: 3,  max: 4000 },
  4: { min: 2,  max: 1500 },
  5: { min: 1,  max: 600 },
  6: { min: 1,  max: 300 },
};

const MAX_SOLUTIONS = 200000;

let errors = 0;
let warnings = 0;
const rows = [];

function fail(id, message) {
  errors++;
  console.log(`  FEIL   ${id}: ${message}`);
}
function warn(id, message) {
  warnings++;
  console.log(`  ADVAR  ${id}: ${message}`);
}

const seenIds = new Set();

for (const raw of CAMPAIGN) {
  const challenge = normalizeChallenge(raw);
  const id = challenge.id;

  if (seenIds.has(id)) fail(id, 'duplikat id');
  seenIds.add(id);
  if (!challenge.teachingGoal) fail(id, 'mangler teachingGoal');
  if (challenge.hints.length < 2) fail(id, `har bare ${challenge.hints.length} hint`);
  if (!challenge.note) warn(id, 'mangler designnotat');

  /* --- løsningsrommet --- */
  const solved = solveChallenge(challenge, { maxSolutions: MAX_SOLUTIONS });
  if (!solved.exhausted) warn(id, 'søket ble avbrutt før hele rommet var gjennomsøkt');

  if (challenge.impossible && solved.solvable) {
    fail(id, `merket umulig, men solveren fant ${solved.solutionCount} løsning(er), f.eks. ${formatDataset(solved.solutions[0])}`);
  }
  if (!challenge.impossible && !solved.solvable) {
    fail(id, 'har ingen løsning');
  }
  if (!challenge.impossible && solved.solutionCount < challenge.requiredSolutions) {
    fail(id, `krever ${challenge.requiredSolutions} løsninger, men det finnes bare ${solved.solutionCount}`);
  }

  const profile = PROFILE[challenge.level];
  if (profile && !challenge.impossible) {
    if (solved.solutionCount < profile.min) {
      warn(id, `bare ${solved.solutionCount} løsninger — strammere enn nivå ${challenge.level} legger opp til`);
    } else if (solved.solutionCount > profile.max) {
      warn(id, `${solved.solutionCount} løsninger — løsere enn nivå ${challenge.level} legger opp til`);
    }
  }

  /* --- startdatasettet --- */
  const start = challenge.start;
  if (!start) {
    fail(id, 'mangler start-datasett');
  } else {
    if (start.length !== challenge.values.count) {
      fail(id, `start har ${start.length} tall, oppgaven ${challenge.values.count}`);
    }
    for (const v of start) {
      if (v < challenge.values.min || v > challenge.values.max) {
        fail(id, `start inneholder ${v}, utenfor ${challenge.values.min}–${challenge.values.max}`);
      }
    }
    for (const lock of challenge.lockedValues) {
      if (start[lock.position] !== lock.value) {
        fail(id, `start bryter låst tall på plass ${lock.position} (skal være ${lock.value})`);
      }
    }
    if (validateDataset(start, challenge).solved) {
      fail(id, 'startdatasettet løser allerede oppgaven');
    }
  }

  /* --- fasit --- */
  if (!challenge.impossible) {
    if (!challenge.reference) {
      fail(id, 'mangler fasitløsning');
    } else {
      const reference = challenge.reference;
      if (reference.length !== challenge.values.count) {
        fail(id, `fasit har ${reference.length} tall, oppgaven ${challenge.values.count}`);
      }
      const check = validateDataset(reference, challenge);
      if (!check.solved) {
        const brutt = [
          ...Object.entries(check.requirements).filter(([, r]) => !r.passed).map(([k, r]) => `${k}=${r.actual} (skal være ${r.target})`),
          ...Object.entries(check.constraints).filter(([, c]) => !c.passed).map(([k]) => k),
          ...(check.locked.passed ? [] : ['låste tall']),
        ];
        fail(id, `fasit ${formatDataset(reference)} løser ikke oppgaven: ${brutt.join(', ')}`);
      }
      for (const lock of challenge.lockedValues) {
        if (reference[lock.position] !== lock.value) {
          fail(id, `fasit bryter låst tall på plass ${lock.position}`);
        }
      }
    }
  } else if (challenge.reference) {
    fail(id, 'umulig oppgave kan ikke ha fasit');
  }

  /* --- hint som viser til tall må kunne fylles ut --- */
  for (const hint of challenge.hints) {
    for (const match of hint.matchAll(/\{(\w+)\}/g)) {
      const known = ['sum','malsum','mangler','retning','gjennomsnitt','median','typetall','bredde','antall','minste','storste','tallene'];
      if (!known.includes(match[1])) fail(id, `hint bruker ukjent felt {${match[1]}}`);
    }
  }

  rows.push({
    id,
    level: challenge.level,
    n: challenge.values.count,
    krav: describeRequirements(challenge),
    losninger: challenge.impossible ? 'umulig' : String(solved.solutionCount),
    kreves: challenge.requiredSolutions,
  });
}

function describeRequirements(challenge) {
  const short = { mean: 'gj.snitt', median: 'median', mode: 'typetall', range: 'bredde' };
  const parts = Object.entries(challenge.requirements)
    .map(([k, v]) => `${short[k]} ${v === NO_MODE ? 'ingen' : v}`);
  const c = challenge.constraints;
  if (c.mustInclude.length) parts.push(`+${c.mustInclude.join('/')}`);
  if (c.mustNotInclude.length) parts.push(`−${c.mustNotInclude.join('/')}`);
  if (c.minValue !== null) parts.push(`≥${c.minValue}`);
  if (c.maxValue !== null) parts.push(`≤${c.maxValue}`);
  if (c.allUnique) parts.push('alle ulike');
  if (c.exactDistinctValues !== null) parts.push(`${c.exactDistinctValues} ulike`);
  for (const [v, n] of Object.entries(c.occurrences)) parts.push(`${v}×${n}`);
  if (challenge.lockedValues.length) parts.push(challenge.lockedValues.map((l) => `🔒${l.value}`).join(''));
  return parts.join(', ');
}

/* --- tabell --- */
console.log('');
const head = ['id', 'n', 'krav', 'løsninger', 'kreves'];
const widths = [8, 3, 46, 10, 6];
let lastLevel = null;
for (const row of rows) {
  if (row.level !== lastLevel) {
    lastLevel = row.level;
    console.log(`\nNIVÅ ${row.level}`);
    console.log('  ' + head.map((h, i) => h.padEnd(widths[i])).join(''));
  }
  console.log('  ' + [row.id, row.n, row.krav, row.losninger, row.kreves]
    .map((c, i) => String(c).padEnd(widths[i])).join(''));
}

console.log(`\n${CAMPAIGN.length} oppgaver · ${errors} feil · ${warnings} advarsler`);
process.exit(errors ? 1 : 0);
