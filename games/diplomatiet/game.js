// game.js – ren spillmotor for Diplomatiet. Ingen DOM. Hver eksporterte
// transisjon tar imot state og returnerer en ny state (aldri mutasjon).
//
// Kampanjestruktur: spilleren møter én nasjon om gangen, i stigende
// vanskelighetsgrad (se CAMPAIGN_ORDER i nations.js). Hvert møte varer
// ROUNDS_PER_ENCOUNTER runder, og etterfølges av en refleksjon før neste
// motstander.
//
// To atskilte tall styrer spillet:
//  - POENG (myScore/theirScore): den faktiske spillteori-matrisen, klassisk
//    Axelrod-skala (T=5, R=3, P=1, S=0). Symmetrisk – begge sider får poeng
//    etter samme tabell, og fristelsen til å svike er reell: DC gir deg 5
//    poeng der og da, mer enn noe samarbeid kan gi i én runde.
//  - TILLIT (rel.score): en sekundær, narrativ konsekvens av valgene dine.
//    Styrer allianser, krig og hvordan nasjonen omtaler deg i rapporten –
//    men er bevisst IKKE det samme tallet som poengsummen, slik at "vinne
//    på poeng" og "bli likt" kan trekke i ulike retninger.

import { NATIONS, NATION_BY_ID, CAMPAIGN_ORDER, STRATEGIES, STRATEGY_THEORY } from './nations.js';

export const ROUNDS_PER_ENCOUNTER = 5;
export const TOTAL_ENCOUNTERS = CAMPAIGN_ORDER.length;
export const RELATION_WAR_THRESHOLD = -60;
export const ALLIANCE_STREAK_NEEDED = 3;
export const WAR_PEACE_STREAK_NEEDED = 3;

// Klassisk fangens dilemma-matrise (Axelrod-skala). "me"/"them" er poengene
// til henholdsvis spilleren og nasjonen for akkurat dette utfallet.
export const PAYOFFS = {
  CC: { me: 3, them: 3 }, // R – gjensidig samarbeid
  DC: { me: 5, them: 0 }, // T / S – du sviker, de samarbeider
  CD: { me: 0, them: 5 }, // S / T – du samarbeider, de sviker
  DD: { me: 1, them: 1 }, // P – gjensidig svik
};

// Tillitsendring per utfall – sekundær, narrativ konsekvens (ikke poeng).
const TRUST_DELTAS = { CC: 8, DC: -15, CD: -10, DD: -5 };

const clampRel = v => Math.min(100, Math.max(-100, v));

// ─── Starttilstand ──────────────────────────────────────
export function createInitialState(playerName) {
  const relations = Object.fromEntries(NATIONS.map(n => [n.id, {
    score: 0, // tillit
    myScore: 0, // poeng, spiller
    theirScore: 0, // poeng, nasjon
    history: [],
    trustHistory: [],
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
    campaignIndex: 0,
    roundInEncounter: 1,
    relations,
    log: [],
    lastRoundEvent: null,
    reflectionGuesses: {},
    achievements: [],
  };
}

// ─── Kampanjeposisjon ───────────────────────────────────
export function getCurrentNation(state) {
  return CAMPAIGN_ORDER[state.campaignIndex] ?? null;
}

export function isCampaignComplete(state) {
  return state.campaignIndex >= CAMPAIGN_ORDER.length;
}

export function isEncounterComplete(state) {
  return state.roundInEncounter > ROUNDS_PER_ENCOUNTER;
}

// ─── Ett rundeoppgjør mot inneværende nasjon ────────────
export function resolveEncounterRound(state, playerMove) {
  const s = deepClone(state);
  const nation = getCurrentNation(s);
  const rel = s.relations[nation.id];

  const nationMove = STRATEGIES[nation.strategy](rel.history);
  const key = playerMove + nationMove;
  const payoff = PAYOFFS[key];
  const trustDelta = TRUST_DELTAS[key];
  const event = { nationId: nation.id, playerMove, nationMove, outcome: key, myPoints: payoff.me, theirPoints: payoff.them };

  rel.myScore += payoff.me;
  rel.theirScore += payoff.them;
  rel.score = clampRel(rel.score + trustDelta);
  rel.history.push({ player: playerMove, nation: nationMove });

  if (playerMove === 'D') rel.playerEverDefected = true;

  // Allianse: 3 påfølgende gjensidige samarbeid danner en allianse.
  // Alliansen brytes umiddelbart – med forsterket straff – hvis du sviker en alliert.
  if (rel.allianceActive && playerMove === 'D') {
    rel.allianceActive = false;
    rel.allianceStreak = 0;
    rel.allianceBrokenByPlayer = true;
    rel.score = clampRel(rel.score - 20);
    event.allianceBroken = true;
  } else if (key === 'CC') {
    rel.allianceStreak += 1;
    if (rel.allianceStreak >= ALLIANCE_STREAK_NEEDED && !rel.allianceActive) {
      rel.allianceActive = true;
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

  event.trustDelta = rel.score - state.relations[nation.id].score;
  rel.trustHistory.push(rel.score);

  s.log.push({
    round: s.roundInEncounter,
    nationId: nation.id,
    playerMove,
    nationMove,
    outcome: key,
    myPoints: payoff.me,
    theirPoints: payoff.them,
    trustDelta: event.trustDelta,
  });

  s.lastRoundEvent = event;
  checkAchievements(s);
  s.roundInEncounter += 1;
  return s;
}

export function advanceToNextNation(state) {
  const s = deepClone(state);
  s.campaignIndex += 1;
  s.roundInEncounter = 1;
  return s;
}

// ─── Refleksjon: gjett strategien ───────────────────────
const STRATEGY_KEYS = Object.keys(STRATEGY_THEORY);

export function getStrategyGuessOptions() {
  const shuffled = [...STRATEGY_KEYS].sort(() => Math.random() - 0.5);
  return shuffled.map(id => ({ id, name: STRATEGY_THEORY[id].name }));
}

export function recordGuess(state, nationId, guessedStrategyId) {
  const s = deepClone(state);
  s.reflectionGuesses[nationId] = guessedStrategyId;
  return s;
}

export function isGuessCorrect(nationId, guessedStrategyId) {
  return NATION_BY_ID[nationId].strategy === guessedStrategyId;
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
  const totalMyScore = rels.reduce((a, r) => a + r.myScore, 0);
  const totalTheirScore = rels.reduce((a, r) => a + r.theirScore, 0);
  const sortedByTrust = [...NATIONS].sort((a, b) => state.relations[b.id].score - state.relations[a.id].score);
  const sortedByScoreDiff = [...NATIONS].sort((a, b) =>
    (state.relations[b.id].myScore - state.relations[b.id].theirScore) -
    (state.relations[a.id].myScore - state.relations[a.id].theirScore));
  const correctGuesses = NATIONS.filter(n => {
    const guess = state.reflectionGuesses[n.id];
    return guess && isGuessCorrect(n.id, guess);
  }).length;
  return {
    totalMoves, cooperateCount, defectCount, cooperateRate,
    allianceCount, allianceBrokenCount, warCount, everWarCount, avgRelation, correctGuesses,
    totalMyScore, totalTheirScore,
    bestNation: sortedByTrust[0], worstNation: sortedByTrust[sortedByTrust.length - 1],
    bestScoreNation: sortedByScoreDiff[0], worstScoreNation: sortedByScoreDiff[sortedByScoreDiff.length - 1],
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
  { id: 'balansekunstner', label: '⚖️ Balansekunstner', check: s => { const r = getStats(s); return r.totalMoves >= 20 && r.cooperateRate >= 0.4 && r.cooperateRate <= 0.6; } },
  { id: 'strategianalytiker', label: '🎓 Strategianalytiker', check: s => getStats(s).correctGuesses >= 5 },
  { id: 'strategisk_overtak', label: '📈 Strategisk overtak', check: s => { const r = getStats(s); return r.totalMoves >= 20 && r.totalMyScore > r.totalTheirScore; } },
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
    check: s => { const r = getStats(s); return r.cooperateRate < 0.3 && r.totalMyScore > r.totalTheirScore; },
    frame: 'Ettertiden vil huske en leder som forsto at fristelsen er reell.',
    title: 'Erobreren {navn}',
    blurb: `Du sviktet oftere enn du samarbeidet, og det ga faktisk resultater: ${'{poeng}'}. Kortsiktig lønte det seg strålende – men isolasjonen og mistilliten som fulgte, er prisen ingen poengsum viser deg på forhånd.`,
  },
  {
    id: 'godtroende', weight: 85,
    check: s => { const r = getStats(s); return r.cooperateRate >= 0.55 && r.totalMyScore < r.totalTheirScore; },
    frame: 'Ettertiden vil huske en leder som ga mer tillit enn den fikk tilbake.',
    title: 'Den Godtroende {navn}',
    blurb: 'Du valgte samarbeid gang på gang, også når det kostet deg dyrt. Noen naboer utnyttet det systematisk og endte med flere poeng enn deg. I spillteorien kalles dette «sucker\'s payoff» – og det er nøyaktig det du fikk.',
  },
  {
    id: 'fredsmegler', weight: 80,
    check: s => { const r = getStats(s); return r.cooperateRate >= 0.65 && r.warCount === 0 && r.allianceCount >= 2; },
    frame: 'Ettertiden vil huske en leder som valgte naboskap foran erobring.',
    title: 'Fredsmegleren {navn}',
    blurb: 'Ingen kriger brøt ut på din vakt. Flere allianser holdt til siste møte. Gjensidig samarbeid er ikke naivt i et gjentatt spill – det er ofte den mest lønnsomme strategien over tid, og du beviste det.',
  },
  {
    id: 'kalkulerte', weight: 70,
    check: s => { const r = getStats(s); return r.totalMyScore >= r.totalTheirScore && r.avgRelation >= 0 && r.cooperateRate > 0.3 && r.cooperateRate < 0.7; },
    frame: 'Ettertiden vil huske en leder som spilte spillet, ikke følelsene.',
    title: 'Den Kalkulerte {navn}',
    blurb: 'Du blandet samarbeid og svik akkurat der det lønte seg, og endte med flere poeng enn motstanderne dine i sum. Ingen elsket deg. De færreste hatet deg heller. Det var visst poenget.',
  },
  {
    id: 'glemt', weight: 0,
    check: () => true,
    frame: 'Ettertiden har ingen sterk mening om denne perioden.',
    title: 'Den Uavklarte {navn}',
    blurb: 'Verken krig eller fred, verken allianser eller ruiner. Seks møter med diplomati som verken feilet stort eller lyktes stort – historien fortsetter uten et tydelig kapittelskille her.',
  },
];

export function getEpithet(state) {
  const hit = EPITHETS
    .filter(e => { try { return e.check(state); } catch { return false; } })
    .sort((a, b) => b.weight - a.weight)[0] || EPITHETS[EPITHETS.length - 1];
  const stats = getStats(state);
  const blurb = hit.blurb.replace('{poeng}', `${stats.totalMyScore} poeng mot deres ${stats.totalTheirScore}`);
  return {
    id: hit.id,
    frame: hit.frame,
    title: hit.title.replace(/{navn}/g, state.playerName),
    blurb,
  };
}

// ─── Høydepunkter per nasjon (for rapportkort) ──────────
export function getHighlights(state, nationId) {
  const scored = state.log.filter(l => l.nationId === nationId && l.trustDelta !== 0);
  if (!scored.length) return { win: null, loss: null };
  const sorted = [...scored].sort((a, b) => b.trustDelta - a.trustDelta);
  const win = sorted[0].trustDelta > 0 ? sorted[0] : null;
  const loss = sorted[sorted.length - 1].trustDelta < 0 ? sorted[sorted.length - 1] : null;
  return { win, loss };
}

// ─── Spillteori-prompt (LLM-seam, følger samme mønster som 3s1f) ─
export function buildReportPrompt(state) {
  const r = getStats(state);
  const scores = NATIONS.map(n => `${n.name}: du ${state.relations[n.id].myScore} – de ${state.relations[n.id].theirScore}`).join(', ');
  return `Du er spillteoretiker og skal kommentere en elevs partie i "Diplomatiet", et undervisningsspill om fangens dilemma.
Spilleren "${state.playerName}" møtte ${TOTAL_ENCOUNTERS} nasjoner etter tur, ${ROUNDS_PER_ENCOUNTER} runder hver, med ulike klassiske strategier (alltid samarbeid, alltid svik, tit-for-tat, hevngjerrig, tilfeldig, pavlov).
Poengmatrisen er klassisk Axelrod-skala: gjensidig samarbeid gir begge 3 poeng, gjensidig svik gir begge 1 poeng, og den som sviker mens motparten samarbeider får 5 poeng mot motpartens 0.
Samarbeidsrate: ${(r.cooperateRate * 100).toFixed(0)}%. Total poengsum: du ${r.totalMyScore}, motstanderne til sammen ${r.totalTheirScore}.
Poeng per nasjon: ${scores}.
Svar KUN med JSON, ingen markdown:
{"headline":"maks 8 ord","lesson":"3-4 setninger som forklarer et spillteorikonsept forankret i disse konkrete tallene"}`;
}

// ─── Lagring ────────────────────────────────────────────
const SAVE_KEY = 'diplomatiet.save.v3';

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

export { NATIONS, NATION_BY_ID, CAMPAIGN_ORDER, STRATEGY_THEORY, deepClone };
