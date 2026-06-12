// game.js – Spillsløyfe og state

import { getEventsForYear } from './events.js';

export const TOTAL_YEARS = 15;

// Startstate
export function createInitialState() {
  return {
    year: 1,
    phase: 'playing', // 'playing' | 'report'
    activeRegion: null,
    flags: [],
    usedEventIds: new Set(),

    // Synlige målere (0–100)
    meters: {
      business: 50,
      people:   50,
      nature:   50,
    },

    // Skjulte variabler (0–100)
    variables: {
      jobs:         50,
      treasury:     50,
      energy:       50,
      housing:      50,
      health:       50,
      education:    50,
      trust:        50,
      biodiversity: 50,
      oceanEnv:     50,
      emissions:    50,
      areaPress:    50,
    },

    // Historikk
    log: [],                // { year, text }
    choiceHistory: [],      // { year, eventId, choiceText }
    pendingConsequences: [], // { triggerYear, eventId }

    // Aktive hendelser dette året
    currentEvents: [],
    choiceMade: false,

    // Achievements
    achievements: [],
  };
}

// Beregn synlige målere fra skjulte variabler
export function computeMeters(variables) {
  const clamp = v => Math.max(0, Math.min(100, Math.round(v)));

  const business = clamp(
    variables.jobs      * 0.35 +
    variables.treasury  * 0.35 +
    variables.energy    * 0.30
  );

  const people = clamp(
    variables.health    * 0.30 +
    variables.housing   * 0.25 +
    variables.trust     * 0.25 +
    variables.education * 0.20
  );

  const nature = clamp(
    variables.biodiversity * 0.35 +
    variables.oceanEnv     * 0.30 +
    (100 - variables.emissions) * 0.20 +
    (100 - variables.areaPress) * 0.15
  );

  return { business, people, nature };
}

// Bruk valg på state
export function applyChoice(state, event, choiceIndex) {
  const choice = event.choices[choiceIndex];
  if (!choice) return state;

  const newState = deepClone(state);
  const clamp = v => Math.max(0, Math.min(100, v));

  // Bruk skjulte variabel-effekter
  Object.entries(choice.effects || {}).forEach(([key, delta]) => {
    if (key in newState.variables) {
      newState.variables[key] = clamp(newState.variables[key] + delta);
    }
  });

  // Bruk meter-effekter (direkte boost/drop til målere)
  Object.entries(choice.meterEffects || {}).forEach(([key, delta]) => {
    if (key in newState.meters) {
      newState.meters[key] = clamp(newState.meters[key] + delta);
    }
  });

  // Reberegn målere fra variabler og bland inn
  const computed = computeMeters(newState.variables);
  newState.meters.business = clamp(Math.round((newState.meters.business + computed.business) / 2));
  newState.meters.people   = clamp(Math.round((newState.meters.people   + computed.people)   / 2));
  newState.meters.nature   = clamp(Math.round((newState.meters.nature   + computed.nature)   / 2));

  // Flagg
  (choice.flags || []).forEach(f => {
    if (!newState.flags.includes(f)) newState.flags.push(f);
  });

  // Logg valget
  newState.log.push({ year: newState.year, text: `Valgte: ${choice.shortLabel || choice.text}` });
  newState.choiceHistory.push({
    year: newState.year,
    eventId: event.id,
    eventTitle: event.title,
    choiceText: choice.text,
    meterEffects: choice.meterEffects,
  });

  newState.choiceMade = true;

  return newState;
}

// Gå til neste år
export function advanceYear(state) {
  const newState = deepClone(state);

  if (newState.year >= TOTAL_YEARS) {
    newState.phase = 'report';
    return newState;
  }

  newState.year += 1;
  newState.choiceMade = false;
  newState.usedEventIds = new Set(newState.usedEventIds);

  // Markerte noen events som brukt
  newState.currentEvents.forEach(ev => newState.usedEventIds.add(ev.id));

  // Sjekk achievements
  checkAchievements(newState);

  // Trekk nye hendelser
  newState.currentEvents = getEventsForYear(
    newState.year,
    newState.variables,
    newState.flags,
    newState.activeRegion
  );

  return newState;
}

// Start nytt år / initialiser hendelser
export function startYear(state) {
  const newState = deepClone(state);
  newState.currentEvents = getEventsForYear(
    newState.year,
    newState.variables,
    newState.flags,
    newState.activeRegion
  );
  return newState;
}

// Achievements
const ACHIEVEMENT_DEFS = [
  {
    id: 'storm_tamer',
    label: '🌬️ Stormtemmer',
    check: s => s.flags.filter(f => ['windFarm','hydroExpansion','energySaving'].includes(f)).length >= 2,
  },
  {
    id: 'owl_guardian',
    label: '🦉 Hubroens vokter',
    check: s => s.flags.includes('owlProtection'),
  },
  {
    id: 'ocean_friend',
    label: '🌊 Havets venn',
    check: s => s.variables.oceanEnv >= 70,
  },
  {
    id: 'industry_builder',
    label: '🏭 Industribygger',
    check: s => s.variables.jobs >= 75,
  },
  {
    id: 'balancer',
    label: '⚖️ Balansekunstner',
    check: s => {
      const { business, people, nature } = s.meters;
      return business >= 45 && business <= 60 &&
             people   >= 45 && people   <= 60 &&
             nature   >= 45 && nature   <= 60;
    },
  },
  {
    id: 'nature_first',
    label: '🌿 Naturens vogter',
    check: s => s.meters.nature >= 75,
  },
  {
    id: 'peoples_choice',
    label: '🤝 Folkets leder',
    check: s => s.variables.trust >= 75,
  },
];

function checkAchievements(state) {
  ACHIEVEMENT_DEFS.forEach(def => {
    if (!state.achievements.includes(def.id) && def.check(state)) {
      state.achievements.push(def.id);
      state.log.push({ year: state.year, text: `Oppnådd: ${def.label}` });
    }
  });
}

export function getAchievements(state) {
  return ACHIEVEMENT_DEFS.filter(d => state.achievements.includes(d.id));
}

// Bygg prompt for sluttrapporten
export function buildReportPrompt(state) {
  const { meters, variables, choiceHistory, flags, achievements } = state;

  const choiceSummary = choiceHistory
    .map(c => `År ${c.year}: ${c.eventTitle} → ${c.choiceText}`)
    .join('\n');

  const achievedLabels = ACHIEVEMENT_DEFS
    .filter(d => achievements.includes(d.id))
    .map(d => d.label)
    .join(', ') || 'Ingen';

  return `Du skal skrive sluttrapporten for et simulasjonsspill om bærekraft.

Spilleren har ledet en øy i 15 år. Her er resultatet:

SYNLIGE MÅLERE (0–100):
- Næringslivet: ${meters.business}
- Innbyggerne: ${meters.people}
- Naturen: ${meters.nature}

SKJULTE VARIABLER:
- Arbeidsplasser: ${variables.jobs}
- Statskasse: ${variables.treasury}
- Energi: ${variables.energy}
- Boliger: ${variables.housing}
- Helse: ${variables.health}
- Utdanning: ${variables.education}
- Tillit: ${variables.trust}
- Naturmangfold: ${variables.biodiversity}
- Havmiljø: ${variables.oceanEnv}
- Utslipp: ${variables.emissions}
- Arealpress: ${variables.areaPress}

VIKTIGE VALG:
${choiceSummary || 'Ingen valg registrert'}

OPPNÅDDE ACHIEVEMENTS: ${achievedLabels}

AKTIVE FLAGG: ${flags.join(', ') || 'ingen'}

Skriv tre korte kommentarer (maks 3 setninger hver) fra tre perspektiver:
1. NÆRINGSLIVET (💰) – taler for vekst, arbeidsplasser og økonomi
2. INNBYGGERNE (👥) – taler for helse, rettferdighet og livskvalitet
3. NATUREN (🌳) – taler som naturens stemme, om dyr, planter og fremtiden

Hver kommentar skal:
- Være spesifikk på spillerens faktiske valg
- Anerkjenne noe som gikk bra OG noe som bekymrer dem
- Bruke uformelt, direkte norsk (ikke formelt embetsspråk)
- Unngå moralisme

Svar KUN med JSON i dette formatet, ingen forklaring, ingen markdown:
{
  "headline": "en kort overskrift (maks 8 ord) som oppsummerer de 15 årene",
  "business": "Næringslivets kommentar her",
  "people": "Innbyggernes kommentar her",
  "nature": "Naturens kommentar her"
}`;
}

// Dyp klon (håndterer Set)
function deepClone(obj) {
  if (obj instanceof Set) return new Set(obj);
  if (Array.isArray(obj)) return obj.map(deepClone);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const k in obj) out[k] = deepClone(obj[k]);
    return out;
  }
  return obj;
}
