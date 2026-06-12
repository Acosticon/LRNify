// game.js – Spillsløyfe og state

import { drawYearRegions } from './events.js';

export const TOTAL_YEARS = 15;

export function createInitialState() {
  return {
    year: 1,
    phase: 'playing',

    // Kart-state
    activeRegions: {},    // { regionId: eventObject } – de 3 aktive regionene dette året
    selectedRegion: null, // hvilken region spilleren har klikket på
    openEvent: null,      // hendelsen som vises akkurat nå

    flags: [],
    usedEventIds: new Set(),

    meters: {
      business: 50,
      people:   50,
      nature:   50,
    },

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

    log: [],
    choiceHistory: [],
    achievements: [],

    // Etter valg: vis konsekvenser til bruker
    lastChoiceResult: null, // { meterDeltas, choiceText }
    choiceMade: false,
  };
}

// ─── Trekk aktive regioner for nytt år ────────────────
export function initYear(state) {
  const s = deepClone(state);
  s.activeRegions  = drawYearRegions(s.variables, s.flags, s.usedEventIds);
  s.selectedRegion = null;
  s.openEvent      = null;
  s.choiceMade     = false;
  s.lastChoiceResult = null;
  return s;
}

// ─── Velg region (åpner hendelse) ─────────────────────
export function selectRegion(state, regionId) {
  const s = deepClone(state);
  // Ignorer klikk hvis valg allerede er gjort, eller regionen er ikke aktiv
  if (s.choiceMade) return s;
  if (!s.activeRegions[regionId]) return s;
  s.selectedRegion = regionId;
  s.openEvent = s.activeRegions[regionId];
  return s;
}

// ─── Ta valg ──────────────────────────────────────────
export function applyChoice(state, choiceIndex) {
  const event = state.openEvent;
  if (!event) return state;
  const choice = event.choices[choiceIndex];
  if (!choice) return state;

  const s = deepClone(state);
  const clamp = v => Math.max(0, Math.min(100, v));
  const prevMeters = { ...s.meters };

  // Bruk variabler
  Object.entries(choice.effects || {}).forEach(([k, d]) => {
    if (k in s.variables) s.variables[k] = clamp(s.variables[k] + d);
  });

  // Bruk meter-effekter direkte
  Object.entries(choice.meterEffects || {}).forEach(([k, d]) => {
    if (k in s.meters) s.meters[k] = clamp(s.meters[k] + d);
  });

  // Reberegn målere fra variabler og bland inn
  const computed = computeMeters(s.variables);
  s.meters.business = clamp(Math.round((s.meters.business + computed.business) / 2));
  s.meters.people   = clamp(Math.round((s.meters.people   + computed.people)   / 2));
  s.meters.nature   = clamp(Math.round((s.meters.nature   + computed.nature)   / 2));

  // Flagg
  (choice.flags || []).forEach(f => { if (!s.flags.includes(f)) s.flags.push(f); });

  // Marker event som brukt
  s.usedEventIds.add(event.id);

  // Logg
  s.log.push({ year: s.year, text: `${event.title} → ${choice.shortLabel || choice.text}` });
  s.choiceHistory.push({
    year: s.year,
    eventId: event.id,
    eventTitle: event.title,
    choiceText: choice.text,
    meterEffects: choice.meterEffects || {},
  });

  // Deltas for visning
  s.lastChoiceResult = {
    choiceText: choice.text,
    meterDeltas: {
      business: s.meters.business - prevMeters.business,
      people:   s.meters.people   - prevMeters.people,
      nature:   s.meters.nature   - prevMeters.nature,
    },
  };

  s.choiceMade = true;
  checkAchievements(s);

  return s;
}

// ─── Gå til neste år ──────────────────────────────────
export function advanceYear(state) {
  const s = deepClone(state);
  s.year += 1;
  return initYear(s);
}

// ─── Meter-beregning ──────────────────────────────────
export function computeMeters(variables) {
  const clamp = v => Math.max(0, Math.min(100, Math.round(v)));
  return {
    business: clamp(variables.jobs * 0.35 + variables.treasury * 0.35 + variables.energy * 0.30),
    people:   clamp(variables.health * 0.30 + variables.housing * 0.25 + variables.trust * 0.25 + variables.education * 0.20),
    nature:   clamp(variables.biodiversity * 0.35 + variables.oceanEnv * 0.30 + (100 - variables.emissions) * 0.20 + (100 - variables.areaPress) * 0.15),
  };
}

// ─── Achievements ─────────────────────────────────────
const ACHIEVEMENT_DEFS = [
  { id: 'storm_tamer',      label: '🌬️ Stormtemmer',       check: s => s.flags.filter(f => ['windFarm','hydroExpansion','energySaving'].includes(f)).length >= 2 },
  { id: 'owl_guardian',     label: '🦉 Hubroens vokter',    check: s => s.flags.includes('owlProtection') },
  { id: 'ocean_friend',     label: '🌊 Havets venn',        check: s => s.variables.oceanEnv >= 70 },
  { id: 'industry_builder', label: '🏭 Industribygger',     check: s => s.variables.jobs >= 75 },
  { id: 'balancer',         label: '⚖️ Balansekunstner',    check: s => ['business','people','nature'].every(k => s.meters[k] >= 45 && s.meters[k] <= 60) },
  { id: 'nature_first',     label: '🌿 Naturens vogter',    check: s => s.meters.nature >= 75 },
  { id: 'peoples_choice',   label: '🤝 Folkets leder',      check: s => s.variables.trust >= 75 },
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

// ─── Rapport-prompt ───────────────────────────────────
export function buildReportPrompt(state) {
  const { meters, variables, choiceHistory, flags, achievements } = state;
  const choiceSummary = choiceHistory.map(c => `År ${c.year}: ${c.eventTitle} → ${c.choiceText}`).join('\n');
  const achievedLabels = ACHIEVEMENT_DEFS.filter(d => achievements.includes(d.id)).map(d => d.label).join(', ') || 'Ingen';

  return `Du skal skrive sluttrapporten for et simulasjonsspill om bærekraft.

Spilleren har ledet en øy i 15 år. Her er resultatet:

SYNLIGE MÅLERE (0–100):
- Næringslivet: ${meters.business}
- Innbyggerne: ${meters.people}
- Naturen: ${meters.nature}

SKJULTE VARIABLER:
- Arbeidsplasser: ${variables.jobs}, Statskasse: ${variables.treasury}, Energi: ${variables.energy}
- Boliger: ${variables.housing}, Helse: ${variables.health}, Utdanning: ${variables.education}
- Tillit: ${variables.trust}, Naturmangfold: ${variables.biodiversity}
- Havmiljø: ${variables.oceanEnv}, Utslipp: ${variables.emissions}, Arealpress: ${variables.areaPress}

VIKTIGE VALG:
${choiceSummary || 'Ingen valg registrert'}

OPPNÅDDE ACHIEVEMENTS: ${achievedLabels}
AKTIVE FLAGG: ${flags.join(', ') || 'ingen'}

Skriv tre korte kommentarer (maks 3 setninger hver) fra tre perspektiver:
1. NÆRINGSLIVET (💰) – taler for vekst, arbeidsplasser og økonomi
2. INNBYGGERNE (👥) – taler for helse, rettferdighet og livskvalitet
3. NATUREN (🌳) – taler som naturens stemme, om dyr, planter og fremtiden

Hver kommentar skal være spesifikk på spillerens faktiske valg, anerkjenne noe bra OG noe bekymringsfullt, bruke uformelt norsk, og unngå moralisme.

Svar KUN med JSON, ingen markdown:
{"headline":"maks 8 ord","business":"...","people":"...","nature":"..."}`;
}

// ─── Dyp klon ─────────────────────────────────────────
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
