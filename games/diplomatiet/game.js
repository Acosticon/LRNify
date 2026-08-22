// game.js – ren spillmotor for Diplomatiet. Ingen DOM. Hver eksporterte
// transisjon tar imot state og returnerer en ny state (aldri mutasjon).
//
// Kampanjestruktur: spilleren møter én nasjon om gangen, i stigende
// vanskelighetsgrad (se CAMPAIGN_ORDER i nations.js). Hvert møte varer
// ROUNDS_PER_ENCOUNTER runder, og etterfølges av en refleksjon før neste
// motstander.
//
// Spillet handler om å lese et mønster: du observerer hvordan motstanderen
// svarer runde for runde, og bruker det til å forutsi og respondere
// strategisk. Poengene følger en klassisk, symmetrisk fangens dilemma-
// matrise (Axelrod-skala: T=5, R=3, P=1, S=0) – begge sider får poeng etter
// samme tabell hver runde, og fristelsen til å svike er reell: den gir deg
// flest poeng der og da, uansett hva motparten gjør.

import { NATIONS, NATION_BY_ID, CAMPAIGN_ORDER, STRATEGIES, STRATEGY_THEORY } from './nations.js';

export const ROUNDS_PER_ENCOUNTER = 5;
export const TOTAL_ENCOUNTERS = CAMPAIGN_ORDER.length;

// Klassisk fangens dilemma-matrise (Axelrod-skala). "me"/"them" er poengene
// til henholdsvis spilleren og nasjonen for akkurat dette utfallet.
export const PAYOFFS = {
  CC: { me: 3, them: 3 }, // R – gjensidig samarbeid
  DC: { me: 5, them: 0 }, // T / S – du sviker, de samarbeider
  CD: { me: 0, them: 5 }, // S / T – du samarbeider, de sviker
  DD: { me: 1, them: 1 }, // P – gjensidig svik
};

// ─── Starttilstand ──────────────────────────────────────
export function createInitialState(playerName) {
  const relations = Object.fromEntries(NATIONS.map(n => [n.id, {
    myScore: 0,
    theirScore: 0,
    history: [], // [{player:'C'|'D', nation:'C'|'D'}, ...] – hele møtet mot denne nasjonen
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

  rel.myScore += payoff.me;
  rel.theirScore += payoff.them;
  rel.history.push({ player: playerMove, nation: nationMove });

  s.lastRoundEvent = { nationId: nation.id, playerMove, nationMove, outcome: key, myPoints: payoff.me, theirPoints: payoff.them };

  s.log.push({
    round: s.roundInEncounter,
    nationId: nation.id,
    playerMove,
    nationMove,
    outcome: key,
    myPoints: payoff.me,
    theirPoints: payoff.them,
  });

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

// ─── Duell: to strategier mot hverandre (Laboratoriet) ──
// Ren simulering, ingen spillertilstand involvert – brukes til å se to
// AI-styrte strategier møtes over N runder med samme poengmatrise.
export function simulateDuel(strategyIdA, strategyIdB, rounds) {
  const log = [];
  let scoreA = 0, scoreB = 0;
  for (let i = 0; i < rounds; i++) {
    // Strategifunksjonene forventer { nation: mitt forrige trekk, player: motstanderens }.
    const historyForA = log.map(r => ({ player: r.moveB, nation: r.moveA }));
    const historyForB = log.map(r => ({ player: r.moveA, nation: r.moveB }));
    const moveA = STRATEGIES[strategyIdA](historyForA);
    const moveB = STRATEGIES[strategyIdB](historyForB);
    const payoff = PAYOFFS[moveA + moveB];
    scoreA += payoff.me;
    scoreB += payoff.them;
    log.push({ round: i + 1, moveA, moveB, pointsA: payoff.me, pointsB: payoff.them });
  }
  return { log, scoreA, scoreB };
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

// Poeng-differansen (deg minus dem) etter hver spilte runde, kumulativt –
// brukes til å tegne en poengtrend-kurve for møtet.
export function getScoreDiffHistory(rel) {
  let running = 0;
  return rel.history.map(h => {
    const payoff = PAYOFFS[h.player + h.nation];
    running += payoff.me - payoff.them;
    return running;
  });
}

// Hvor positivt nasjonen ser tilbake på møtet – utledet av hvor stor andel
// av rundene som endte i gjensidig samarbeid (ikke av hvem som "vant").
export function getOutlookTier(history) {
  if (!history.length) return 'Nøytral';
  const ccRate = history.filter(h => h.player === 'C' && h.nation === 'C').length / history.length;
  if (ccRate >= 0.6) return 'Positive';
  if (ccRate <= 0.2) return 'Negative';
  return 'Nøytral';
}

// ─── Statistikk (brukt av epitet/prestasjoner/rapport) ─
export function getStats(state) {
  const rels = NATIONS.map(n => state.relations[n.id]);
  const totalMoves = state.log.length;
  const cooperateCount = state.log.filter(l => l.playerMove === 'C').length;
  const defectCount = totalMoves - cooperateCount;
  const cooperateRate = totalMoves ? cooperateCount / totalMoves : 0;
  const totalMyScore = rels.reduce((a, r) => a + r.myScore, 0);
  const totalTheirScore = rels.reduce((a, r) => a + r.theirScore, 0);
  const wonCount = NATIONS.filter(n => state.relations[n.id].myScore > state.relations[n.id].theirScore).length;
  const lostCount = NATIONS.filter(n => state.relations[n.id].myScore < state.relations[n.id].theirScore).length;
  const tiedCount = NATIONS.length - wonCount - lostCount;
  const sortedByScoreDiff = [...NATIONS].sort((a, b) =>
    (state.relations[b.id].myScore - state.relations[b.id].theirScore) -
    (state.relations[a.id].myScore - state.relations[a.id].theirScore));
  const correctGuesses = NATIONS.filter(n => {
    const guess = state.reflectionGuesses[n.id];
    return guess && isGuessCorrect(n.id, guess);
  }).length;
  return {
    totalMoves, cooperateCount, defectCount, cooperateRate,
    totalMyScore, totalTheirScore, wonCount, lostCount, tiedCount, correctGuesses,
    bestNation: sortedByScoreDiff[0], worstNation: sortedByScoreDiff[sortedByScoreDiff.length - 1],
  };
}

// ─── Prestasjoner ───────────────────────────────────────
const ACHIEVEMENT_DEFS = [
  { id: 'balansekunstner', label: '⚖️ Balansekunstner', check: s => { const r = getStats(s); return r.totalMoves >= 20 && r.cooperateRate >= 0.4 && r.cooperateRate <= 0.6; } },
  { id: 'strategianalytiker', label: '🎓 Strategianalytiker', check: s => getStats(s).correctGuesses >= 5 },
  { id: 'strategisk_overtak', label: '📈 Strategisk overtak', check: s => { const r = getStats(s); return r.totalMoves >= 20 && r.totalMyScore > r.totalTheirScore; } },
  { id: 'kaldur_utmanovrert', label: '⛰️ Utmanøvrerte Kaldur', check: s => s.relations.kaldur.myScore > s.relations.kaldur.theirScore },
  { id: 'ren_seier', label: '🏆 Ren seier', check: s => getStats(s).wonCount === NATIONS.length },
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
    id: 'strategen', weight: 90,
    check: s => { const r = getStats(s); return r.cooperateRate > 0.3 && r.cooperateRate < 0.7 && r.totalMyScore >= r.totalTheirScore && r.wonCount >= 4; },
    frame: 'Ettertiden vil huske en leder som leste motstanderne før de leste deg.',
    title: 'Strategen {navn}',
    blurb: 'Du tilpasset deg motstanderen i stedet for å kjøre én fast linje, og det ga resultater: {poeng}. Det er selve poenget med et gjentatt spill: den beste strategien avhenger av hvem du står overfor, ikke av et fast prinsipp.',
  },
  {
    id: 'erobreren', weight: 85,
    check: s => { const r = getStats(s); return r.cooperateRate < 0.3 && r.totalMyScore > r.totalTheirScore; },
    frame: 'Ettertiden vil huske en leder som forsto at fristelsen er reell.',
    title: 'Erobreren {navn}',
    blurb: 'Du sviktet oftere enn du samarbeidet, og det ga faktisk resultater: {poeng}. I ett enkeltstående spill er svik den rasjonelle, dominante strategien. Spørsmålet dette spillet ikke svarer på, er hva som skjer når du møter de samme naboene igjen neste år.',
  },
  {
    id: 'godtroende', weight: 80,
    check: s => { const r = getStats(s); return r.cooperateRate >= 0.55 && r.totalMyScore < r.totalTheirScore; },
    frame: 'Ettertiden vil huske en leder som ga mer enn den fikk tilbake.',
    title: 'Den Godtroende {navn}',
    blurb: 'Du valgte samarbeid gang på gang, også når det kostet deg dyrt: {poeng}. I spillteorien kalles dette «sucker\'s payoff» – og det er nøyaktig det du fikk. Samarbeid lønner seg bare når motparten svarer i samme mynt.',
  },
  {
    id: 'forutsigbar', weight: 60,
    check: s => { const r = getStats(s); return r.cooperateRate >= 0.9 || r.cooperateRate <= 0.1; },
    frame: 'Ettertiden vil huske en leder som aldri overrasket noen.',
    title: 'Den Forutsigbare {navn}',
    blurb: 'Du spilte praktisk talt samme trekk mot alle seks, uansett hvordan de svarte: {poeng}. Det gjør deg lett å forutsi – og en motstander som kan forutsi deg, kan alltid tilpasse seg bedre enn du tilpasser deg dem.',
  },
  {
    id: 'glemt', weight: 0,
    check: () => true,
    frame: 'Ettertiden har ingen sterk mening om denne perioden.',
    title: 'Den Uavklarte {navn}',
    blurb: 'Verken en tydelig strategi eller et tydelig resultat: {poeng}. Seks møter som verken feilet stort eller lyktes stort – historien fortsetter uten et tydelig kapittelskille her.',
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
// Runden med størst poengfortrinn / -tap mot denne nasjonen.
export function getHighlights(state, nationId) {
  const rows = state.log.filter(l => l.nationId === nationId).map(l => ({ ...l, diff: l.myPoints - l.theirPoints }));
  if (!rows.length) return { win: null, loss: null };
  const sorted = [...rows].sort((a, b) => b.diff - a.diff);
  const win = sorted[0].diff > 0 ? sorted[0] : null;
  const loss = sorted[sorted.length - 1].diff < 0 ? sorted[sorted.length - 1] : null;
  return { win, loss };
}

// ─── Spillteori-prompt (LLM-seam, følger samme mønster som 3s1f) ─
export function buildReportPrompt(state) {
  const r = getStats(state);
  const scores = NATIONS.map(n => `${n.name}: du ${state.relations[n.id].myScore} – de ${state.relations[n.id].theirScore}`).join(', ');
  return `Du er spillteoretiker og skal kommentere en elevs partie i "Diplomatiet", et undervisningsspill om fangens dilemma.
Spilleren "${state.playerName}" møtte ${TOTAL_ENCOUNTERS} nasjoner etter tur, ${ROUNDS_PER_ENCOUNTER} runder hver, med ulike klassiske strategier (alltid samarbeid, alltid svik, tit-for-tat, hevngjerrig, tilfeldig, pavlov).
Poengmatrisen er klassisk Axelrod-skala: gjensidig samarbeid gir begge 3 poeng, gjensidig svik gir begge 1 poeng, og den som sviker mens motparten samarbeider får 5 poeng mot motpartens 0.
Samarbeidsrate: ${(r.cooperateRate * 100).toFixed(0)}%. Total poengsum: du ${r.totalMyScore}, motstanderne til sammen ${r.totalTheirScore}. Du vant på poeng mot ${r.wonCount} av ${NATIONS.length} nasjoner.
Poeng per nasjon: ${scores}.
Svar KUN med JSON, ingen markdown:
{"headline":"maks 8 ord","lesson":"3-4 setninger som forklarer et spillteorikonsept forankret i disse konkrete tallene"}`;
}

// ─── Lagring ────────────────────────────────────────────
const SAVE_KEY = 'diplomatiet.save.v4';

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
