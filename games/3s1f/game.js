// game.js – Spillsløyfe, tidsbudsjett, forsømmelse og state

import {
  drawYearRegions,
  FLAG_MAP_ICONS,
  CONSEQUENCE_MAP_ICONS,
  EVENT_BY_ID,
  REGIONS,
  TOTAL_YEARS,
  MONTHS_PER_YEAR,
  sakerForYear,
} from './events.js';

export { TOTAL_YEARS, MONTHS_PER_YEAR, sakerForYear };

// ─── Balansekonstanter ────────────────────────────────
// Å styre en øy koster noe hvert eneste år, uansett hva du gjør.
// Uten dette trekket vokser særlig innbyggermåleren ukontrollert.
const YEARLY_DRIFT = {
  meters:    { business: -2, people: -2, nature: -1 },
  variables: { trust: -2, health: -1, housing: -1, energy: -1, treasury: 3, biodiversity: -1 },
};

// Hvor sterkt de skjulte variablene trekker målerne mot seg ved årsskiftet.
const COMPUTED_PULL = 0.2;

// Så mange år tåler en sak å bli oversett før den brenner seg fast som et arr.
const MAX_NEGLECT_YEARS = 3;

const clamp = v => Math.max(0, Math.min(100, v));

// ─── State ────────────────────────────────────────────
export function createInitialState(playerName = 'Lederen') {
  return {
    version: 2,
    year: 1,
    phase: 'playing',
    playerName,

    // Tidsbudsjett – årets knappeste ressurs
    monthsTotal: MONTHS_PER_YEAR,
    monthsLeft: MONTHS_PER_YEAR,

    activeRegions: {},       // { regionId: event }
    regionDecisions: {},     // { regionId: choiceIdx | 'deferred' }
    openRegion: null,

    mapIcons: [],
    mapWarnings: [],

    // Forsømmelse: { eventId: { years, region, title, type } }
    neglect: {},
    // Saker som fikk gå for langt: [{ eventId, title, region, year }]
    scars: [],
    // Kriser som forsømmelse har tvunget fram
    forcedEvents: [],

    flags: [],
    usedEventIds: new Set(),
    newsSeen: {},

    meters: { business: 50, people: 50, nature: 50 },
    variables: {
      jobs: 50, treasury: 50, energy: 50, housing: 50,
      health: 50, education: 50, trust: 50,
      biodiversity: 50, oceanEnv: 50, emissions: 50, areaPress: 50,
    },

    // Måleverdier ved hvert årsskifte – grunnlaget for grafen i sluttrapporten
    meterHistory: [{ year: 0, business: 50, people: 50, nature: 50 }],

    log: [],
    choiceHistory: [],
    achievements: [],

    pendingNewsSplash: null,
    yearSummary: null,       // avisoppslaget ved årsslutt
  };
}

// ─── Tidskostnad ──────────────────────────────────────
// Utledes av hvor stort inngrepet er, med mulighet for overstyring per valg.
export function baseTimeCost(choice) {
  if (typeof choice.timeCost === 'number') return choice.timeCost;
  const mag =
    Object.values(choice.effects || {}).reduce((a, b) => a + Math.abs(b), 0) +
    Object.values(choice.meterEffects || {}).reduce((a, b) => a + Math.abs(b), 0);
  if (mag < 20) return 2;
  if (mag < 30) return 3;
  if (mag < 42) return 4;
  if (mag < 60) return 5;
  return 6;
}

export function neglectLevel(state, eventId) {
  return state.neglect[eventId]?.years || 0;
}

// Et forsømt problem blir dyrere, tregere og mindre reparerbart.
export function escalatedChoice(choice, level) {
  if (!level) return { ...choice, timeCost: baseTimeCost(choice) };

  const gain = Math.max(0.55, 1 - 0.2 * level);   // skaden er delvis varig
  const pain = 1 + 0.3 * level;                   // baksidene blir verre
  const money = 1 + 0.6 * level;                  // reparasjon koster mer

  const scale = (obj = {}) =>
    Object.fromEntries(Object.entries(obj).map(([k, v]) => {
      if (k === 'treasury' && v < 0) return [k, Math.round(v * money)];
      return [k, Math.round(v > 0 ? v * gain : v * pain)];
    }));

  return {
    ...choice,
    effects: scale(choice.effects),
    meterEffects: scale(choice.meterEffects),
    timeCost: baseTimeCost(choice) + level,
  };
}

export function choicesFor(state, regionId) {
  const ev = state.activeRegions[regionId];
  if (!ev) return [];
  const level = neglectLevel(state, ev.id);
  return ev.choices.map(c => escalatedChoice(c, level));
}

export function canAfford(state, cost) {
  return state.monthsLeft >= cost;
}

// ─── Nytt år ──────────────────────────────────────────
export function initYear(state) {
  const s = deepClone(state);
  s.activeRegions = drawYearRegions({
    variables: s.variables,
    flags: s.flags,
    usedEventIds: s.usedEventIds,
    year: s.year,
    neglect: s.neglect,
    forcedEvents: s.forcedEvents,
  });
  s.regionDecisions = {};
  s.openRegion = null;
  s.pendingNewsSplash = null;
  s.yearSummary = null;
  s.monthsTotal = MONTHS_PER_YEAR;
  s.monthsLeft = MONTHS_PER_YEAR;

  // Tvungne kriser som nå er trukket, skal ikke tvinges igjen
  const drawnIds = Object.values(s.activeRegions).map(e => e.id);
  s.forcedEvents = s.forcedEvents.filter(id => !drawnIds.includes(id));

  // Konsekvensvarsler på kartet
  s.mapWarnings = s.mapWarnings.filter(w => !drawnIds.includes(w.eventId));
  for (const ev of Object.values(s.activeRegions)) {
    if (ev.type !== 'A' && CONSEQUENCE_MAP_ICONS[ev.id]) {
      s.mapWarnings.push({ ...CONSEQUENCE_MAP_ICONS[ev.id], eventId: ev.id, year: s.year });
    }
  }

  return s;
}

// ─── Velg region ──────────────────────────────────────
export function selectRegion(state, regionId) {
  const s = deepClone(state);
  if (!s.activeRegions[regionId]) return s;
  s.openRegion = regionId;

  const ev = s.activeRegions[regionId];
  if (ev.type !== 'A' && !s.newsSeen[ev.id]) {
    s.pendingNewsSplash = {
      eventId: ev.id,
      headline: ev.newsHeadline || ev.title,
      ingress: (ev.newsIngress || ev.description || '').replace(/{navn}/g, s.playerName),
      causedByText: buildCausedByText(ev, s.flags, s.playerName),
      regionId,
    };
    s.newsSeen[ev.id] = true;
  }

  return s;
}

function buildCausedByText(event, flags, playerName) {
  if (!event.causedBy) return null;
  for (const flag of flags) {
    if (event.causedBy[flag]) return event.causedBy[flag].replace(/{navn}/g, playerName);
  }
  return null;
}

export function dismissNewsSplash(state) {
  const s = deepClone(state);
  s.pendingNewsSplash = null;
  return s;
}

// ─── Ta et valg ───────────────────────────────────────
export function applyChoice(state, regionId, choiceIndex) {
  const event = state.activeRegions[regionId];
  if (!event) return state;

  const level = neglectLevel(state, event.id);
  const raw = event.choices[choiceIndex];
  if (!raw) return state;
  const choice = escalatedChoice(raw, level);
  if (!canAfford(state, choice.timeCost)) return state;

  const s = deepClone(state);
  const prevMeters = { ...s.meters };

  s.monthsLeft -= choice.timeCost;
  applyEffects(s, choice.effects, choice.meterEffects);

  (choice.flags || []).forEach(f => {
    if (!s.flags.includes(f)) s.flags.push(f);
    const ico = FLAG_MAP_ICONS[f];
    if (ico && !s.mapIcons.find(i => i.label === ico.label)) {
      s.mapIcons.push({ ...ico, year: s.year });
    }
  });

  s.usedEventIds.add(event.id);
  delete s.neglect[event.id];
  s.regionDecisions[regionId] = choiceIndex;

  const resolvedLabel = level > 0 ? `${event.title} (endelig løst)` : event.title;
  s.log.push({ year: s.year, text: `${resolvedLabel} → ${choice.shortLabel || choice.text}` });
  s.choiceHistory.push({
    year: s.year,
    eventId: event.id,
    eventTitle: event.title,
    region: event.region,
    choiceText: choice.text,
    shortLabel: choice.shortLabel || choice.text,
    timeCost: choice.timeCost,
    neglectLevel: level,
    meterDeltas: deltasFrom(prevMeters, s.meters),
  });

  checkAchievements(s);
  return s;
}

// ─── «Dette kan vente» ────────────────────────────────
// Koster ingen tid. Prisen kommer ved årsslutt – og året etter.
export function deferRegion(state, regionId) {
  const s = deepClone(state);
  if (!s.activeRegions[regionId]) return s;
  s.regionDecisions[regionId] = 'deferred';
  s.openRegion = null;
  return s;
}

export function undeferRegion(state, regionId) {
  const s = deepClone(state);
  if (s.regionDecisions[regionId] === 'deferred') delete s.regionDecisions[regionId];
  s.openRegion = regionId;
  return s;
}

export function closeRegion(state) {
  const s = deepClone(state);
  s.openRegion = null;
  return s;
}

// ─── Årsslutt ─────────────────────────────────────────
// Her gjøres opp status: forsømte saker eskalerer, drift trekkes,
// og avisoppslaget bygges.
export function endYear(state) {
  const s = deepClone(state);
  const before = { ...s.meters };

  const neglected = [];
  const escalated = [];
  const newScars = [];

  for (const [regionId, ev] of Object.entries(s.activeRegions)) {
    const decision = s.regionDecisions[regionId];
    if (decision !== undefined && decision !== 'deferred') continue;

    const years = (s.neglect[ev.id]?.years || 0) + 1;
    const factor = 1 + 0.6 * (years - 1);

    applyEffects(
      s,
      scaleEffects(ev.ignoreEffect?.effects, factor),
      scaleEffects(ev.ignoreEffect?.meterEffects, factor)
    );

    if (years >= MAX_NEGLECT_YEARS) {
      // Saken er ikke lenger til å redde – den setter et varig arr.
      s.usedEventIds.add(ev.id);
      delete s.neglect[ev.id];
      s.scars.push({ eventId: ev.id, title: ev.title, region: ev.region, year: s.year });
      newScars.push(ev);
      if (!s.flags.includes(`scar:${ev.id}`)) s.flags.push(`scar:${ev.id}`);
      s.log.push({ year: s.year, text: `${ev.title} – for sent å redde` });
    } else {
      s.neglect[ev.id] = { years, region: ev.region, title: ev.title, type: ev.type };
      neglected.push({ event: ev, years });
      if (!s.flags.includes(`neglect:${ev.id}`)) s.flags.push(`neglect:${ev.id}`);
      if (years >= 2) escalated.push(ev);
    }

    // Vedvarende forsømmelse tvinger fram den koblede krisen.
    if (years >= 2 && ev.escalatesTo && !s.usedEventIds.has(ev.escalatesTo)
        && !s.forcedEvents.includes(ev.escalatesTo)) {
      s.forcedEvents.push(ev.escalatesTo);
    }
  }

  // Årlig drift – prisen for å bare eksistere
  applyEffects(s, YEARLY_DRIFT.variables, YEARLY_DRIFT.meters);

  // Skjulte variabler trekker målerne mot seg
  const computed = computeMeters(s.variables);
  for (const k of ['business', 'people', 'nature']) {
    s.meters[k] = clamp(Math.round(s.meters[k] + (computed[k] - s.meters[k]) * COMPUTED_PULL));
  }

  s.meterHistory.push({ year: s.year, ...s.meters });
  checkAchievements(s);

  s.yearSummary = buildYearSummary(s, before, { neglected, escalated, newScars });
  return s;
}

export function dismissYearSummary(state) {
  const s = deepClone(state);
  s.yearSummary = null;
  return s;
}

export function advanceYear(state) {
  const s = deepClone(state);
  s.year += 1;
  return initYear(s);
}

// ─── Avisoppslaget ────────────────────────────────────
function buildYearSummary(s, before, { neglected, escalated, newScars }) {
  const deltas = deltasFrom(before, s.meters);
  const decisions = s.choiceHistory.filter(c => c.year === s.year);

  // Hovedoppslaget velges av det som beveget seg mest i året.
  const worst = ['business', 'people', 'nature']
    .map(k => ({ k, v: deltas[k] }))
    .sort((a, b) => a.v - b.v)[0];
  const best = ['business', 'people', 'nature']
    .map(k => ({ k, v: deltas[k] }))
    .sort((a, b) => b.v - a.v)[0];

  let headline, kicker;
  if (newScars.length) {
    headline = `${newScars[0].title} – ingen vei tilbake`;
    kicker = `Saken lå ubehandlet i ${MAX_NEGLECT_YEARS} år. Nå er den ikke lenger mulig å reparere.`;
  } else if (escalated.length) {
    headline = `${escalated[0].title} forverrer seg`;
    kicker = `For andre år på rad ble saken liggende. Kritikken mot ${s.playerName} skjerpes.`;
  } else if (worst.v <= -6) {
    headline = HEADLINES[worst.k].bad;
    kicker = `Målet falt ${Math.abs(worst.v)} poeng i løpet av året.`;
  } else if (best.v >= 6) {
    headline = HEADLINES[best.k].good;
    kicker = `Framgangen er tydelig: ${best.v > 0 ? '+' : ''}${best.v} poeng på ett år.`;
  } else if (decisions.length === 0) {
    headline = 'Et år uten spor';
    kicker = `${s.playerName} lot året gå uten å ta en eneste avgjørelse.`;
  } else {
    headline = 'Nok et år med små skritt';
    kicker = 'Ingen dramatiske utslag – men heller ingen løsninger.';
  }

  return {
    year: s.year,
    headline,
    kicker,
    deltas,
    monthsUsed: s.monthsTotal - s.monthsLeft,
    monthsTotal: s.monthsTotal,
    decisions: decisions.map(d => ({
      title: d.eventTitle,
      label: d.shortLabel,
      region: d.region,
      months: d.timeCost,
    })),
    neglected: neglected.map(n => ({
      title: n.event.title,
      region: n.event.region,
      years: n.years,
    })),
    scars: newScars.map(e => ({ title: e.title, region: e.region })),
    isFinalYear: s.year >= TOTAL_YEARS,
  };
}

const HEADLINES = {
  business: { good: 'Optimisme i næringslivet', bad: 'Bedrifter varsler nedgang' },
  people:   { good: 'Innbyggerne puster lettet ut', bad: 'Misnøyen brer seg blant folk' },
  nature:   { good: 'Naturen henter seg inn',      bad: 'Naturen taper terreng' },
};

// ─── Kan året avsluttes / er det noe å gjøre ──────────
export function outstandingRegions(state) {
  return Object.keys(state.activeRegions).filter(r => {
    const d = state.regionDecisions[r];
    return d === undefined || d === 'deferred';
  });
}

export function cheapestAffordableAction(state) {
  let min = Infinity;
  for (const r of outstandingRegions(state)) {
    for (const c of choicesFor(state, r)) min = Math.min(min, c.timeCost);
  }
  return min;
}

// Året er ute når tiden ikke rekker til et eneste tiltak til.
export function isYearExhausted(state) {
  return state.monthsLeft <= 0 || cheapestAffordableAction(state) > state.monthsLeft;
}

// ─── Effekter ─────────────────────────────────────────
function scaleEffects(obj, factor) {
  if (!obj) return {};
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, Math.round(v * factor)]));
}

// Avtakende utbytte mot ytterpunktene: jo lenger en måler alt er dratt i én
// retning, jo tyngre er det å dra den videre. Det stopper min-maksing uten å
// vaske ut det enkelte valgets utslag slik den gamle /2-utjevningen gjorde.
function applyMeterDelta(current, delta) {
  const headroom = delta > 0 ? (100 - current) / 50 : current / 50;
  const resistance = Math.max(0.15, Math.min(1, headroom));
  return clamp(Math.round(current + delta * resistance));
}

function applyEffects(s, effects, meterEffects) {
  Object.entries(effects || {}).forEach(([k, d]) => {
    if (k in s.variables) s.variables[k] = clamp(s.variables[k] + d);
  });
  Object.entries(meterEffects || {}).forEach(([k, d]) => {
    if (k in s.meters) s.meters[k] = applyMeterDelta(s.meters[k], d);
  });
}

function deltasFrom(before, after) {
  return {
    business: after.business - before.business,
    people:   after.people   - before.people,
    nature:   after.nature   - before.nature,
  };
}

export function computeMeters(variables) {
  const c = v => Math.max(0, Math.min(100, Math.round(v)));
  return {
    business: c(variables.jobs * 0.35 + variables.treasury * 0.35 + variables.energy * 0.30),
    people:   c(variables.health * 0.30 + variables.housing * 0.25 + variables.trust * 0.25 + variables.education * 0.20),
    nature:   c(variables.biodiversity * 0.35 + variables.oceanEnv * 0.30 + (100 - variables.emissions) * 0.20 + (100 - variables.areaPress) * 0.15),
  };
}

// ─── Achievements ─────────────────────────────────────
const ACHIEVEMENT_DEFS = [
  { id: 'storm_tamer',      label: '🌬️ Stormtemmer',     check: s => s.flags.filter(f => ['windFarm','hydroExpansion','energySaving'].includes(f)).length >= 2 },
  { id: 'owl_guardian',     label: '🦉 Hubroens vokter',  check: s => s.flags.includes('owlProtection') },
  { id: 'ocean_friend',     label: '🌊 Havets venn',      check: s => s.variables.oceanEnv >= 70 },
  { id: 'industry_builder', label: '🏭 Industribygger',   check: s => s.variables.jobs >= 75 },
  { id: 'balancer',         label: '⚖️ Balansekunstner',  check: s => ['business','people','nature'].every(k => s.meters[k] >= 45 && s.meters[k] <= 60) },
  { id: 'nature_first',     label: '🌿 Naturens vokter',  check: s => s.meters.nature >= 75 },
  { id: 'peoples_choice',   label: '🤝 Folkets leder',    check: s => s.variables.trust >= 75 },
  { id: 'firefighter',      label: '🚒 Brannslukker',     check: s => s.choiceHistory.filter(c => c.neglectLevel > 0).length >= 3 },
  { id: 'clean_desk',       label: '🗂️ Ryddig skrivebord', check: s => s.year >= 5 && Object.keys(s.neglect).length === 0 && s.scars.length === 0 },
  { id: 'time_master',      label: '⏳ Tidsoptimist',     check: s => s.choiceHistory.filter(c => c.year === s.year).reduce((a, c) => a + c.timeCost, 0) >= MONTHS_PER_YEAR },
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

// ─── Ettermæle ────────────────────────────────────────
// Tittelen folket husker deg med. Mest spesifikke treff vinner.
const EPITHETS = [
  {
    id: 'owl_killer', weight: 100,
    // Bare den som faktisk lot hubroen gå tapt – ikke den som reddet den.
    check: s => !s.flags.includes('owlProtection') && (
      s.scars.some(x => x.eventId === 'owl_disappears') ||
      (s.meters.nature < 30 && s.flags.includes('industrialLogging'))
    ),
    title: 'Ugledreperen {navn}',
    frame: 'Folket vil fortelle spøkelseshistorier om',
    blurb: 'Skoglandet står stille om natta. De eldste sier de husker en lyd som ikke finnes lenger.',
  },
  {
    id: 'the_absent', weight: 95,
    check: s => s.scars.length >= 3,
    title: '{navn} den Fraværende',
    frame: 'Historiebøkene vil knapt nevne',
    blurb: `${''}Tre saker fikk ligge til de ikke lenger var mulige å løse. Det er ikke valgene folk husker – det er alt som aldri ble bestemt.`,
  },
  {
    id: 'the_drowned', weight: 90,
    check: s => s.scars.some(x => x.eventId === 'climate_flood') || s.variables.emissions >= 80,
    title: '{navn} den Våte',
    frame: 'Barna vil synge nidviser om',
    blurb: 'Vannet kom, slik alle hadde advart om. Flomskilt i Sentrum viser fortsatt hvor høyt det sto.',
  },
  {
    id: 'the_economic', weight: 70,
    check: s => s.meters.business >= 62 && s.meters.business - s.meters.nature >= 18,
    title: '{navn} den Økonomiske',
    frame: 'Folket vil huske deg som',
    blurb: 'Regnskapet gikk i pluss hvert eneste år. Regnskapet omfattet bare ikke alt.',
  },
  {
    id: 'the_green', weight: 70,
    check: s => s.meters.nature >= 62 && s.meters.nature - s.meters.business >= 18,
    title: '{navn} den Grønne',
    frame: 'Skogen vil hviske navnet',
    blurb: 'Naturen kom først, alltid. Ungdommen som flyttet vekk for å finne jobb, har en annen versjon av historien.',
  },
  {
    id: 'the_beloved', weight: 70,
    check: s => s.meters.people >= 60 && s.variables.trust >= 58,
    title: '{navn} den Folkekjære',
    frame: 'Det vil bli reist en statue av',
    blurb: 'Køene ble kortere, boligene flere, og folk snakket pent om rådhuset. Sjelden, det.',
  },
  {
    id: 'the_balanced', weight: 80,
    check: s => ['business','people','nature'].every(k => s.meters[k] >= 55),
    title: '{navn} den Kloke',
    frame: 'Ettertiden vil studere',
    blurb: 'Tre stemmer, én framtid – og for én gangs skyld ble ingen av dem overdøvet.',
  },
  {
    id: 'the_firefighter', weight: 50,
    check: s => s.choiceHistory.filter(c => c.neglectLevel > 0).length >= 6,
    title: 'Brannslukkeren {navn}',
    frame: 'De ansatte vil huske',
    blurb: 'Alltid på plass når det brant. Sjelden på plass før det tok fyr.',
  },
  {
    id: 'the_divided', weight: 65,
    check: s => {
      const v = ['business', 'people', 'nature'].map(k => s.meters[k]);
      return Math.max(...v) - Math.min(...v) >= 30;
    },
    title: '{navn} den Enøyde',
    frame: 'Halve øya vil skåle for',
    blurb: 'Én stemme ble hørt hvert eneste år. De to andre lærte seg å la være å be om ordet.',
  },
  {
    id: 'the_capable', weight: 55,
    check: s => s.meters.business >= 52 && s.meters.people >= 50 && s.scars.length === 0,
    title: '{navn} den Handlekraftige',
    frame: 'Kommunestyret vil savne',
    blurb: 'Sakene ble avgjort mens de fortsatt var saker, ikke kriser. Naturen fikk regningen for tempoet.',
  },
  {
    id: 'the_hollow', weight: 85,
    check: s => ['business','people','nature'].every(k => s.meters[k] < 40),
    title: '{navn} den Tomhendte',
    frame: 'Ingen vil forsvare',
    blurb: 'Ti år, og alle tre stemmene endte svakere enn de begynte. Det krever nesten talent.',
  },
  {
    id: 'the_careful', weight: 30,
    check: () => true,
    title: '{navn} den Forsiktige',
    frame: 'Folket vil huske deg som',
    blurb: 'Ingen store feil. Ingen store seire heller. Øya er omtrent som du fant den.',
  },
];

export function getEpithet(state) {
  const hit = EPITHETS
    .filter(e => { try { return e.check(state); } catch { return false; } })
    .sort((a, b) => b.weight - a.weight)[0] || EPITHETS[EPITHETS.length - 1];
  return {
    id: hit.id,
    frame: hit.frame,
    title: hit.title.replace(/{navn}/g, state.playerName),
    blurb: hit.blurb,
  };
}

// ─── Høydepunkter til sluttrapporten ──────────────────
// Største seier og største tap per kategori, hentet fra faktiske valg.
export function getHighlights(state, meter) {
  const scored = state.choiceHistory
    .map(c => ({ ...c, d: c.meterDeltas?.[meter] ?? 0 }))
    .filter(c => c.d !== 0);
  if (!scored.length) return { win: null, loss: null };
  const sorted = [...scored].sort((a, b) => b.d - a.d);
  const win = sorted[0].d > 0 ? sorted[0] : null;
  const loss = sorted[sorted.length - 1].d < 0 ? sorted[sorted.length - 1] : null;
  return {
    win:  win  ? { year: win.year,  title: win.eventTitle,  label: win.shortLabel,  delta: win.d }  : null,
    loss: loss ? { year: loss.year, title: loss.eventTitle, label: loss.shortLabel, delta: loss.d } : null,
  };
}

// ─── Rapport-prompt ───────────────────────────────────
export function buildReportPrompt(state) {
  const { meters, variables, choiceHistory, flags, playerName, scars } = state;
  const choiceSummary = choiceHistory
    .map(c => `År ${c.year}: ${c.eventTitle} → ${c.choiceText}`).join('\n');
  const scarSummary = scars.length
    ? scars.map(x => `År ${x.year}: ${x.title} (aldri behandlet)`).join('\n')
    : 'Ingen';
  const epithet = getEpithet(state);

  return `Du skal skrive sluttrapporten for et bærekraftsspill for norsk ungdomsskole.

Lederen heter "${playerName}" og har styrt øya i ${TOTAL_YEARS} år.
Ettermælet er allerede avgjort: "${epithet.title}".

SYNLIGE MÅLERE (0–100):
- Næringslivet: ${meters.business}
- Innbyggerne: ${meters.people}
- Naturen: ${meters.nature}

SKJULTE VARIABLER:
- Arbeidsplasser: ${variables.jobs}, Statskasse: ${variables.treasury}, Energi: ${variables.energy}
- Boliger: ${variables.housing}, Helse: ${variables.health}, Utdanning: ${variables.education}
- Tillit: ${variables.trust}, Naturmangfold: ${variables.biodiversity}
- Havmiljø: ${variables.oceanEnv}, Utslipp: ${variables.emissions}, Arealpress: ${variables.areaPress}

VALG SOM BLE TATT:
${choiceSummary || 'Ingen valg registrert'}

SAKER SOM ALDRI BLE BEHANDLET:
${scarSummary}

FLAGG: ${flags.filter(f => !f.includes(':')).join(', ') || 'ingen'}

Skriv tre korte uttalelser (maks 3 setninger hver) fra tre fagpersoner som
oppsummerer de ${TOTAL_YEARS} årene. De skal være faglige, men menneskelige, og
referere til konkrete valg over. Bruk lederens navn. Mild ironi er lov.

1. ØKONOM (💰): arbeidsplasser, statsfinanser, næringsstruktur
2. SOSIOLOG (👥): tillit, ulikhet, livskvalitet, hvem som tapte
3. BIOLOG (🌳): arter, habitat, hav, hva som er reversibelt

Anerkjenn noe som gikk bra OG noe som gikk galt. Uformelt norsk. Ingen moralisme.

Svar KUN med JSON, ingen markdown:
{"headline":"maks 8 ord","business":"...","people":"...","nature":"..."}`;
}

// ─── Lagring ──────────────────────────────────────────
const SAVE_KEY = '3s1f.save.v2';

export function saveGame(state) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      ...state,
      usedEventIds: [...state.usedEventIds],
    }));
  } catch { /* privat modus eller full disk – spillet går videre uansett */ }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.version !== 2) return null;
    data.usedEventIds = new Set(data.usedEventIds || []);
    // Hendelsesobjekter lagres ikke – de hentes friskt fra databasen.
    const regions = {};
    for (const [regionId, ev] of Object.entries(data.activeRegions || {})) {
      const fresh = EVENT_BY_ID[ev?.id];
      if (fresh) regions[regionId] = fresh;
    }
    data.activeRegions = regions;
    return data;
  } catch {
    return null;
  }
}

export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* ignorer */ }
}

// ─── Hjelpere ─────────────────────────────────────────
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export { REGIONS };

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
