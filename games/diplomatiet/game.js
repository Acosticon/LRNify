// game.js – ren spillmotor for Diplomatiet. Ingen DOM. Hver eksporterte
// transisjon tar imot state og returnerer en ny state (aldri mutasjon).

import { NATIONS, NATION_BY_ID, STRATEGIES, STRATEGY_THEORY } from './nations.js';

export const TOTAL_ROUNDS = 8;
export const RELATION_WAR_THRESHOLD = -60;
export const ALLIANCE_STREAK_NEEDED = 3;
export const WAR_PEACE_STREAK_NEEDED = 3;

const PAYOFFS = {
  CC: { velstand: 3, sikkerhet: 1, relation: 8 },
  DC: { velstand: 5, sikkerhet: 2, relation: -15 }, // du sviker, de samarbeider
  CD: { velstand: -2, sikkerhet: -4, relation: -10 }, // du samarbeider, de sviker
  DD: { velstand: -1, sikkerhet: -1, relation: -5 },
};

const clamp = (v, min = 0, max = 100) => Math.min(max, Math.max(min, v));
const clampRel = v => clamp(v, -100, 100);

// ─── Starttilstand ──────────────────────────────────────
export function createInitialState(playerName) {
  const relations = Object.fromEntries(NATIONS.map(n => [n.id, {
    score: 0,
    history: [],
    allianceActive: false,
    allianceStreak: 0,
    allianceBrokenByPlayer: false,
    warActive: false,
    everWar: false,
    warPeaceStreak: 0,
    playerEverDefected: false,
  }]));

  return {
    playerName: (playerName || 'Lederen').trim().slice(0, 40) || 'Lederen',
    round: 1,
    meters: { velstand: 50, sikkerhet: 50, anseelse: 50 },
    relations,
    pendingStances: {},
    relationHistory: [Object.fromEntries([['round', 0], ...NATIONS.map(n => [n.id, 0])])],
    log: [],
    lastRoundEvents: [],
    achievements: [],
  };
}

// ─── Rundehåndtering ────────────────────────────────────
export function setStance(state, nationId, move) {
  const s = deepClone(state);
  s.pendingStances[nationId] = move;
  return s;
}

export function isRoundReady(state) {
  return NATIONS.every(n => state.pendingStances[n.id] === 'C' || state.pendingStances[n.id] === 'D');
}

export function isGameOver(state) {
  return state.round > TOTAL_ROUNDS;
}

export function resolveRound(state) {
  const s = deepClone(state);
  const events = [];

  for (const nation of NATIONS) {
    const rel = s.relations[nation.id];
    const playerMove = s.pendingStances[nation.id];
    const nationMove = STRATEGIES[nation.strategy](rel.history);
    const key = playerMove + nationMove;
    const payoff = PAYOFFS[key];

    const event = { nationId: nation.id, playerMove, nationMove, outcome: key };

    // Løpende allianse-bonus / krig-drenering, uavhengig av dette trekket.
    if (rel.allianceActive) {
      s.meters.velstand = clamp(s.meters.velstand + 2);
      s.meters.sikkerhet = clamp(s.meters.sikkerhet + 1);
    }
    if (rel.warActive) {
      s.meters.sikkerhet = clamp(s.meters.sikkerhet - 3);
    }

    s.meters.velstand = clamp(s.meters.velstand + payoff.velstand);
    s.meters.sikkerhet = clamp(s.meters.sikkerhet + payoff.sikkerhet);
    rel.score = clampRel(rel.score + payoff.relation);
    rel.history.push({ player: playerMove, nation: nationMove });

    if (playerMove === 'D') rel.playerEverDefected = true;

    // Anseelse: verden legger merke til hvordan du behandler naboer.
    if (key === 'CC') s.meters.anseelse = clamp(s.meters.anseelse + 1);
    else if (key === 'DC') s.meters.anseelse = clamp(s.meters.anseelse - 2);
    else if (key === 'DD') s.meters.anseelse = clamp(s.meters.anseelse - 1);

    // Allianse: 3 påfølgende gjensidige samarbeid danner en allianse.
    // Alliansen brytes umiddelbart – med forsterket straff – hvis du sviker en alliert.
    if (rel.allianceActive && playerMove === 'D') {
      rel.allianceActive = false;
      rel.allianceStreak = 0;
      rel.allianceBrokenByPlayer = true;
      rel.score = clampRel(rel.score - 20);
      s.meters.anseelse = clamp(s.meters.anseelse - 5);
      event.allianceBroken = true;
    } else if (key === 'CC') {
      rel.allianceStreak += 1;
      if (rel.allianceStreak >= ALLIANCE_STREAK_NEEDED && !rel.allianceActive) {
        rel.allianceActive = true;
        s.meters.anseelse = clamp(s.meters.anseelse + 3);
        event.allianceFormed = true;
      }
    } else {
      rel.allianceStreak = 0;
    }

    // Krig: forholdet kollapser under terskelen. Repareres av 3 runder på rad med gjensidig samarbeid.
    if (!rel.warActive && rel.score <= RELATION_WAR_THRESHOLD) {
      rel.warActive = true;
      rel.everWar = true;
      rel.warPeaceStreak = 0;
      event.warStart = true;
    } else if (rel.warActive) {
      rel.warPeaceStreak = key === 'CC' ? rel.warPeaceStreak + 1 : 0;
      if (rel.warPeaceStreak >= WAR_PEACE_STREAK_NEEDED) {
        rel.warActive = false;
        event.peaceRestored = true;
      }
    }

    event.relDelta = rel.score - (state.relations[nation.id].score);
    event.velstandDelta = payoff.velstand;
    event.sikkerhetDelta = payoff.sikkerhet;
    events.push(event);

    s.log.push({
      round: s.round,
      nationId: nation.id,
      playerMove,
      nationMove,
      outcome: key,
      relDelta: event.relDelta,
      velstandDelta: payoff.velstand,
      sikkerhetDelta: payoff.sikkerhet,
    });
  }

  s.meters.anseelse = clamp(s.meters.anseelse);
  s.lastRoundEvents = events;
  s.relationHistory.push(Object.fromEntries([
    ['round', s.round],
    ...NATIONS.map(n => [n.id, s.relations[n.id].score]),
  ]));

  checkAchievements(s);
  s.pendingStances = {};
  s.round += 1;
  return s;
}

// ─── Statistikk (brukt av epitet/prestasjoner/rapport) ─
export function getStats(state) {
  const rels = NATIONS.map(n => state.relations[n.id]);
  const totalMoves = state.log.length;
  const cooperateCount = state.log.filter(l => l.playerMove === 'C').length;
  const defectCount = totalMoves - cooperateCount;
  const cooperateRate = totalMoves ? cooperateCount / totalMoves : 0;
  const allianceCount = rels.filter(r => r.allianceActive).length;
  const allianceBrokenCount = rels.filter(r => r.allianceBrokenByPlayer).length;
  const warCount = rels.filter(r => r.warActive).length;
  const everWarCount = rels.filter(r => r.everWar).length;
  const avgRelation = rels.reduce((a, r) => a + r.score, 0) / rels.length;
  const sorted = [...NATIONS].sort((a, b) => state.relations[b.id].score - state.relations[a.id].score);
  return {
    totalMoves, cooperateCount, defectCount, cooperateRate,
    allianceCount, allianceBrokenCount, warCount, everWarCount, avgRelation,
    bestNation: sorted[0], worstNation: sorted[sorted.length - 1],
  };
}

export function getRelationTier(score) {
  if (score >= 25) return 'Positive';
  if (score <= -25) return 'Negative';
  return 'Nøytral';
}

// ─── Prestasjoner ───────────────────────────────────────
const ACHIEVEMENT_DEFS = [
  { id: 'alliansebygger', label: '🤝 Alliansebygger', check: s => NATIONS.filter(n => s.relations[n.id].allianceActive).length >= 2 },
  { id: 'freden_i_var_tid', label: '🕊️ Freden i vår tid', check: s => NATIONS.every(n => s.relations[n.id].score >= 50) },
  { id: 'brent_alle_broer', label: '🔥 Brent alle broer', check: s => NATIONS.every(n => s.relations[n.id].score <= -50) },
  { id: 'fredsslutning', label: '🏳️ Fredsslutning', check: s => NATIONS.some(n => s.relations[n.id].everWar && !s.relations[n.id].warActive) },
  { id: 'fjellets_tillit', label: '⛰️ Fjellets tillit', check: s => !s.relations.kaldur.playerEverDefected && s.relations.kaldur.score >= 50 },
  { id: 'balansekunstner', label: '⚖️ Balansekunstner', check: s => { const r = getStats(s); return r.totalMoves >= 24 && r.cooperateRate >= 0.4 && r.cooperateRate <= 0.6; } },
];

function checkAchievements(state) {
  for (const def of ACHIEVEMENT_DEFS) {
    if (!state.achievements.includes(def.id) && def.check(state)) {
      state.achievements.push(def.id);
    }
  }
}

export function getAchievements(state) {
  return ACHIEVEMENT_DEFS.filter(d => state.achievements.includes(d.id));
}

// ─── Ettermæle ──────────────────────────────────────────
const EPITHETS = [
  {
    id: 'traktatbryter', weight: 100,
    check: s => getStats(s).allianceBrokenCount >= 1,
    frame: 'Ettertiden vil huske hva som skjedde med ordet ditt.',
    title: 'Traktatbryteren {navn}',
    blurb: 'Du bygget tillit tålmodig nok til at en allianse tok form – og valgte så å knuse den selv. Andre statsledere lærte leksjonen: din underskrift er en åpningsreplikk, ikke en garanti.',
  },
  {
    id: 'erobreren', weight: 90,
    check: s => { const r = getStats(s); return r.cooperateRate < 0.3 && s.meters.sikkerhet >= 60; },
    frame: 'Ettertiden vil huske en leder som forsto at styrke slår tillit.',
    title: 'Erobreren {navn}',
    blurb: 'Du sviktet oftere enn du samarbeidet, og bygget en sikkerhet ingen nabo kunne matche. Kortsiktig lønte det seg strålende – men isolasjonen som fulgte, er prisen ingen payoff-matrise viser deg på forhånd.',
  },
  {
    id: 'godtroende', weight: 85,
    check: s => { const r = getStats(s); return r.cooperateRate >= 0.55 && s.meters.velstand < 45 && r.avgRelation < 10; },
    frame: 'Ettertiden vil huske en leder som ga mer tillit enn den fikk tilbake.',
    title: 'Den Godtroende {navn}',
    blurb: 'Du valgte samarbeid gang på gang, også når det kostet deg dyrt. Noen naboer utnyttet det systematisk. I spillteorien kalles dette «sucker\'s payoff» – og det er nøyaktig det du fikk.',
  },
  {
    id: 'fredsmegler', weight: 80,
    check: s => { const r = getStats(s); return r.cooperateRate >= 0.65 && r.warCount === 0 && r.allianceCount >= 2; },
    frame: 'Ettertiden vil huske en leder som valgte naboskap foran erobring.',
    title: 'Fredsmegleren {navn}',
    blurb: 'Ingen kriger brøt ut på din vakt. Flere allianser holdt til siste runde. Gjensidig samarbeid er ikke naivt i et gjentatt spill – det er ofte den mest lønnsomme strategien over tid, og du beviste det.',
  },
  {
    id: 'kalkulerte', weight: 70,
    check: s => s.meters.velstand >= 65 && s.meters.sikkerhet >= 55 && getStats(s).avgRelation >= 0,
    frame: 'Ettertiden vil huske en leder som spilte spillet, ikke følelsene.',
    title: 'Den Kalkulerte {navn}',
    blurb: 'Du blandet samarbeid og svik akkurat der det lønte seg, og endte med både velstand og sikkerhet i pluss. Ingen elsket deg. De færreste hatet deg heller. Det var visst poenget.',
  },
  {
    id: 'glemt', weight: 0,
    check: () => true,
    frame: 'Ettertiden har ingen sterk mening om denne perioden.',
    title: 'Den Uavklarte {navn}',
    blurb: 'Verken krig eller fred, verken allianser eller ruiner. Åtte runder med diplomati som verken feilet stort eller lyktes stort – historien fortsetter uten et tydelig kapittelskille her.',
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

// ─── Høydepunkter per nasjon (for rapportkort) ──────────
export function getHighlights(state, nationId) {
  const scored = state.log.filter(l => l.nationId === nationId && l.relDelta !== 0);
  if (!scored.length) return { win: null, loss: null };
  const sorted = [...scored].sort((a, b) => b.relDelta - a.relDelta);
  const win = sorted[0].relDelta > 0 ? sorted[0] : null;
  const loss = sorted[sorted.length - 1].relDelta < 0 ? sorted[sorted.length - 1] : null;
  return { win, loss };
}

// ─── Spillteori-prompt (LLM-seam, følger samme mønster som 3s1f) ─
export function buildReportPrompt(state) {
  const r = getStats(state);
  const rel = NATIONS.map(n => `${n.name}: ${state.relations[n.id].score}`).join(', ');
  return `Du er spillteoretiker og skal kommentere en elevs partie i "Diplomatiet", et undervisningsspill om fangens dilemma.
Spilleren "${state.playerName}" spilte ${TOTAL_ROUNDS} runder mot 6 nasjoner med ulike klassiske strategier (alltid samarbeid, alltid svik, tit-for-tat, hevngjerrig, tilfeldig, pavlov).
Samarbeidsrate: ${(r.cooperateRate * 100).toFixed(0)}%. Sluttmålere: velstand ${state.meters.velstand}, sikkerhet ${state.meters.sikkerhet}, anseelse ${state.meters.anseelse}.
Forholdsscore per nasjon: ${rel}.
Svar KUN med JSON, ingen markdown:
{"headline":"maks 8 ord","lesson":"3-4 setninger som forklarer et spillteorikonsept forankret i disse konkrete tallene"}`;
}

// ─── Lagring ────────────────────────────────────────────
const SAVE_KEY = 'diplomatiet.save.v1';

export function saveGame(state) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch { /* privat modus / full disk */ }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* ignorer */ }
}

// ─── Verktøy ────────────────────────────────────────────
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function deepClone(obj) {
  if (Array.isArray(obj)) return obj.map(deepClone);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const k in obj) out[k] = deepClone(obj[k]);
    return out;
  }
  return obj;
}

export { NATIONS, NATION_BY_ID, STRATEGY_THEORY, deepClone };
