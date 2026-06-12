// game.js – Spillsløyfe og state

import { drawYearRegions, FLAG_MAP_ICONS, CONSEQUENCE_MAP_ICONS } from './events.js';

export const TOTAL_YEARS = 15;

export function createInitialState(playerName = 'Lederen') {
  return {
    year: 1,
    phase: 'playing',
    playerName,

    // Kart-state
    activeRegions: {},       // { regionId: eventObject }
    regionDecisions: {},     // { regionId: 'choiceIdx' | 'ignored' | null }
    openRegion: null,        // hvilken region som er åpen i panelet

    // Akkumulerte kart-ikoner: [{ emoji, region, label, year }]
    mapIcons: [],
    // Konsekvens-advarsler på kartet: [{ emoji, region, label, eventId }]
    mapWarnings: [],

    flags: [],
    usedEventIds: new Set(),

    meters: { business: 50, people: 50, nature: 50 },
    variables: {
      jobs: 50, treasury: 50, energy: 50, housing: 50,
      health: 50, education: 50, trust: 50,
      biodiversity: 50, oceanEnv: 50, emissions: 50, areaPress: 50,
    },

    log: [],
    choiceHistory: [],
    achievements: [],

    // For nyhetsoverlay (type B)
    pendingNewsSplash: null,  // { eventId, headline, ingress, causedByText } – vises før valg
  };
}

// ─── Trekk aktive regioner for nytt år ────────────────
export function initYear(state) {
  const s = deepClone(state);
  s.activeRegions = drawYearRegions(s.variables, s.flags, s.usedEventIds);
  s.regionDecisions = {};
  s.openRegion = null;
  s.pendingNewsSplash = null;

  // Sjekk om noen aktive type-B hendelser trenger news-splash
  // (splash vises når man klikker regionen, ikke her)

  // Legg til konsekvens-advarsler på kart for aktive type-B events
  s.mapWarnings = s.mapWarnings.filter(w => !Object.values(s.activeRegions).find(e => e.id === w.eventId));
  for (const [, ev] of Object.entries(s.activeRegions)) {
    if (ev.type === 'B' && CONSEQUENCE_MAP_ICONS[ev.id]) {
      const ico = CONSEQUENCE_MAP_ICONS[ev.id];
      if (!s.mapWarnings.find(w => w.eventId === ev.id)) {
        s.mapWarnings.push({ ...ico, eventId: ev.id, year: s.year });
      }
    }
  }

  return s;
}

// ─── Velg region (åpner panel) ────────────────────────
export function selectRegion(state, regionId) {
  const s = deepClone(state);
  if (!s.activeRegions[regionId]) return s;
  s.openRegion = regionId;

  // Bygg news-splash for type B hvis ikke sett
  const ev = s.activeRegions[regionId];
  if (ev.type === 'B' && !s[`newsSeen_${ev.id}`]) {
    const causedByText = buildCausedByText(ev, s.flags, s.playerName);
    s.pendingNewsSplash = {
      eventId: ev.id,
      headline: ev.newsHeadline || ev.title,
      ingress: (ev.newsIngress || ev.description || '').replace(/{navn}/g, s.playerName),
      causedByText,
      regionId,
    };
    s[`newsSeen_${ev.id}`] = true;
  }

  return s;
}

function buildCausedByText(event, flags, playerName) {
  if (!event.causedBy) return null;
  for (const flag of flags) {
    if (event.causedBy[flag]) {
      return event.causedBy[flag].replace(/{navn}/g, playerName);
    }
  }
  return null;
}

// ─── Lukk news-splash (vis valg) ──────────────────────
export function dismissNewsSplash(state) {
  const s = deepClone(state);
  s.pendingNewsSplash = null;
  return s;
}

// ─── Ta valg i en region ──────────────────────────────
export function applyChoice(state, regionId, choiceIndex) {
  const event = state.activeRegions[regionId];
  if (!event) return state;
  const choice = event.choices[choiceIndex];
  if (!choice) return state;

  const s = deepClone(state);
  const clamp = v => Math.max(0, Math.min(100, v));
  const prevMeters = { ...s.meters };

  applyEffects(s, choice.effects, choice.meterEffects);

  // Flagg
  (choice.flags || []).forEach(f => {
    if (!s.flags.includes(f)) s.flags.push(f);
    // Legg til kart-ikon
    const ico = FLAG_MAP_ICONS[f];
    if (ico && !s.mapIcons.find(i => i.label === ico.label)) {
      s.mapIcons.push({ ...ico, year: s.year });
    }
  });

  s.usedEventIds.add(event.id);
  s.regionDecisions[regionId] = choiceIndex;

  s.log.push({ year: s.year, text: `${event.title} → ${choice.shortLabel || choice.text}` });
  s.choiceHistory.push({
    year: s.year, eventId: event.id, eventTitle: event.title,
    choiceText: choice.text, meterEffects: choice.meterEffects || {},
    meterDeltas: {
      business: s.meters.business - prevMeters.business,
      people:   s.meters.people   - prevMeters.people,
      nature:   s.meters.nature   - prevMeters.nature,
    },
  });

  checkAchievements(s);
  return s;
}

// ─── Ignorer en region ────────────────────────────────
export function ignoreRegion(state, regionId) {
  const event = state.activeRegions[regionId];
  if (!event) return state;

  const s = deepClone(state);
  const prevMeters = { ...s.meters };

  if (event.ignoreEffect) {
    applyEffects(s, event.ignoreEffect.effects, event.ignoreEffect.meterEffects);
  }

  s.usedEventIds.add(event.id);
  s.regionDecisions[regionId] = 'ignored';

  const text = `${event.title} → Ignorert`;
  s.log.push({ year: s.year, text });
  s.choiceHistory.push({
    year: s.year, eventId: event.id, eventTitle: event.title,
    choiceText: '(Ignorert)',
    meterEffects: event.ignoreEffect?.meterEffects || {},
    meterDeltas: {
      business: s.meters.business - prevMeters.business,
      people:   s.meters.people   - prevMeters.people,
      nature:   s.meters.nature   - prevMeters.nature,
    },
  });

  return s;
}

// ─── Gå til neste år ──────────────────────────────────
export function advanceYear(state) {
  const s = deepClone(state);
  s.year += 1;
  return initYear(s);
}

// ─── Sjekk om alle aktive regioner er behandlet ───────
export function allRegionsHandled(state) {
  return Object.keys(state.activeRegions).every(
    r => state.regionDecisions[r] !== undefined
  );
}

// ─── Hjelpefunksjoner ─────────────────────────────────
function applyEffects(s, effects, meterEffects) {
  const clamp = v => Math.max(0, Math.min(100, v));
  Object.entries(effects || {}).forEach(([k, d]) => {
    if (k in s.variables) s.variables[k] = clamp(s.variables[k] + d);
  });
  Object.entries(meterEffects || {}).forEach(([k, d]) => {
    if (k in s.meters) s.meters[k] = clamp(s.meters[k] + d);
  });
  const computed = computeMeters(s.variables);
  s.meters.business = clamp(Math.round((s.meters.business + computed.business) / 2));
  s.meters.people   = clamp(Math.round((s.meters.people   + computed.people)   / 2));
  s.meters.nature   = clamp(Math.round((s.meters.nature   + computed.nature)   / 2));
}

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
  { id: 'storm_tamer',      label: '🌬️ Stormtemmer',    check: s => s.flags.filter(f => ['windFarm','hydroExpansion','energySaving'].includes(f)).length >= 2 },
  { id: 'owl_guardian',     label: '🦉 Hubroens vokter', check: s => s.flags.includes('owlProtection') },
  { id: 'ocean_friend',     label: '🌊 Havets venn',     check: s => s.variables.oceanEnv >= 70 },
  { id: 'industry_builder', label: '🏭 Industribygger',  check: s => s.variables.jobs >= 75 },
  { id: 'balancer',         label: '⚖️ Balansekunstner', check: s => ['business','people','nature'].every(k => s.meters[k] >= 45 && s.meters[k] <= 60) },
  { id: 'nature_first',     label: '🌿 Naturens vogter', check: s => s.meters.nature >= 75 },
  { id: 'peoples_choice',   label: '🤝 Folkets leder',   check: s => s.variables.trust >= 75 },
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
  const { meters, variables, choiceHistory, flags, achievements, playerName } = state;
  const choiceSummary = choiceHistory.map(c => `År ${c.year}: ${c.eventTitle} → ${c.choiceText}`).join('\n');
  const achievedLabels = ACHIEVEMENT_DEFS.filter(d => achievements.includes(d.id)).map(d => d.label).join(', ') || 'Ingen';

  return `Du skal skrive sluttrapporten for et bærekraftsspill.

Lederen heter "${playerName}" og har styrt øya i 15 år.

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

ACHIEVEMENTS: ${achievedLabels}
FLAGG: ${flags.join(', ') || 'ingen'}

Skriv tre korte kommentarer (maks 3 setninger) fra tre perspektiver.
Bruk lederens navn direkte – gjerne med en mild ironisk undertone (f.eks. "Vår kjære [navn]...", "Det [navn] kalte en god beslutning...").

1. NÆRINGSLIVET (💰): arbeidsplasser, økonomi, vekst
2. INNBYGGERNE (👥): helse, rettferdighet, livskvalitet
3. NATUREN (🌳): naturens stemme, dyr, planter, fremtiden

Vær spesifikk på faktiske valg. Anerkjenn noe bra OG noe bekymringsfullt. Uformelt norsk. Ingen moralisme.

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
