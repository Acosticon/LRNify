// report.js – Sluttrapport: seks stemmer med hver sin mini-kurve, et
// ettermæle, og en egen «spillteorien bak»-leksjon forankret i spillerens tall.

import {
  NATIONS, STRATEGY_THEORY, TOTAL_ENCOUNTERS, ROUNDS_PER_ENCOUNTER,
  getAchievements, getEpithet, getHighlights, getStats, getRelationTier,
  buildReportPrompt, escapeHtml as esc,
} from './game.js';

// Uten et server-side endepunkt som skjuler en API-nøkkel, bruker rapporten
// den innebygde analysen – den er skrevet for å stå på egne bein.
const REPORT_ENDPOINT = null;

export async function generateReport(state, onProgress) {
  onProgress({ status: 'loading' });

  if (!REPORT_ENDPOINT) {
    const data = generateFallbackReport(state);
    onProgress({ status: 'done', data });
    return data;
  }

  try {
    const response = await fetch(REPORT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: buildReportPrompt(state) }),
    });
    if (!response.ok) throw new Error(`API-feil: ${response.status}`);
    const raw = await response.json();
    const text = (raw.text ?? raw.content?.map(b => b.text || '').join('') ?? '').trim();
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    onProgress({ status: 'done', data: parsed });
    return parsed;
  } catch (err) {
    console.warn('Falt tilbake til innebygd rapport:', err);
    const data = generateFallbackReport(state);
    onProgress({ status: 'done', data });
    return data;
  }
}

// ─── Innebygd analyse ─────────────────────────────────
function generateFallbackReport(state) {
  const stats = getStats(state);

  const headline = (() => {
    if (stats.allianceBrokenCount >= 1) return 'Et brutt løfte definerte kampanjen';
    if (stats.cooperateRate >= 0.65 && stats.warCount === 0) return 'Diplomatiet valgte tillit, og tilliten lønte seg';
    if (stats.cooperateRate < 0.3) return 'Opprustning ga makt, men ingen venner';
    if (stats.everWarCount >= 2) return 'Flere fronter, få seire';
    return 'Seks møter med beregnet balansegang';
  })();

  return { headline, lesson: buildLessonText(state, stats) };
}

function buildLessonText(state, stats) {
  const pct = Math.round(stats.cooperateRate * 100);
  const bestScoreNation = stats.bestScoreNation, worstScoreNation = stats.worstScoreNation;
  const bestDiff = state.relations[bestScoreNation.id].myScore - state.relations[bestScoreNation.id].theirScore;
  const worstDiff = state.relations[worstScoreNation.id].myScore - state.relations[worstScoreNation.id].theirScore;

  const lines = [];
  lines.push(`Poengmatrisen er den samme hver runde: gjensidig samarbeid gir dere 3 poeng hver, gjensidig svik gir dere 1 poeng hver – men sviker du mens motparten samarbeider, får <em>du</em> 5 poeng og <em>de</em> 0. Det er selve fangens dilemma: fristelsen til å svike er reell og lønner seg der og da, uansett hva motparten gjør.`);

  lines.push(`Totalt endte du på <strong>${stats.totalMyScore} poeng</strong>, mot <strong>${stats.totalTheirScore}</strong> samlet for motstanderne. ${stats.totalMyScore > stats.totalTheirScore ? 'Du vant nettoduellen på poeng.' : stats.totalMyScore < stats.totalTheirScore ? 'Motstanderne vant nettoduellen på poeng, samlet sett.' : 'Det endte helt likt.'}`);

  if (stats.cooperateRate < 0.35) {
    lines.push(`Med en samarbeidsrate på bare ${pct} % spilte du i praksis en «alltid svik»-strategi selv. Det er en <em>dominant strategi</em> i ett enkeltstående spill – uansett hva motparten gjør, gir svik deg isolert sett mer der og da – men i et <em>gjentatt</em> spill svarer motparten i neste runde, og gjensidig svik (1 poeng hver) gir mindre enn gjensidig samarbeid (3 poeng hver) ville gjort.`);
  } else if (stats.cooperateRate > 0.7) {
    lines.push(`Med en samarbeidsrate på ${pct} % lente du deg mot en nesten ubetinget «alltid samarbeid»-tilnærming. Det maksimerer poengene <em>hvis</em> motparten også samarbeider – men er sårbart mot enhver motpart som systematisk sviker, slik ${esc(worstScoreNation.name)} endte opp med å gjøre (der differansen ble ${worstDiff > 0 ? '+' : ''}${worstDiff} poeng for deg).`);
  } else {
    lines.push(`Med en samarbeidsrate på ${pct} % minner den blandede stilen din om <em>tit-for-tat</em> – strategien som vant Robert Axelrods berømte dataturnering i 1980, nettopp fordi den var samarbeidsvillig, men aldri lot et svik gå ustraffet.`);
  }

  lines.push(`Du vant tydeligst på poeng mot ${esc(bestScoreNation.name)} (${bestDiff > 0 ? '+' : ''}${bestDiff} i differanse), mens ${esc(worstScoreNation.name)} kom best ut av dere to. Det finnes ingen enkelt <em>Nash-likevekt</em> som passer alle motstandere likt: det beste mottrekket avhenger alltid av hvilken strategi du står overfor.`);

  lines.push(`Underveis gjettet du riktig strategi hos ${stats.correctGuesses} av ${NATIONS.length} nasjoner – å kjenne igjen mønsteret er halve jobben i et gjentatt spill.`);

  return lines.join(' ');
}

// ─── Mini-kurve for én nasjons forholdsutvikling ──────
export function renderSparkline(scoreHistory, color) {
  if (!scoreHistory.length) return '<p class="voice-sparkline-empty">Ingen møter ennå.</p>';
  const W = 160, H = 46, PAD = 5;
  const n = scoreHistory.length;
  const x = i => (n > 1 ? PAD + (i / (n - 1)) * (W - 2 * PAD) : W / 2);
  const y = v => PAD + (1 - (v + 100) / 200) * (H - 2 * PAD);
  const pts = scoreHistory.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const last = scoreHistory[scoreHistory.length - 1];

  return `
    <svg viewBox="0 0 ${W} ${H}" class="voice-sparkline" role="img" aria-label="Utvikling i forhold over ${n} runder">
      <line x1="${PAD}" y1="${y(0).toFixed(1)}" x2="${W - PAD}" y2="${y(0).toFixed(1)}" stroke="#28323D" stroke-width="1" stroke-dasharray="2 2"/>
      <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${x(n - 1).toFixed(1)}" cy="${y(last).toFixed(1)}" r="3.5" fill="${color}" stroke="#0B0E13" stroke-width="1.5"/>
    </svg>`;
}

// ─── Rapportskjerm ────────────────────────────────────
export function renderReport(state, reportData) {
  const achievements = getAchievements(state);
  const epithet = getEpithet(state);
  const stats = getStats(state);

  const scoreColor = v => (v >= 25 ? '#3E8E7E' : v <= -25 ? '#C9524B' : '#C9A227');

  const voiceCards = NATIONS.map(n => {
    const rel = state.relations[n.id];
    const hl = getHighlights(state, n.id);
    const tier = getRelationTier(rel.score);
    const quote = tier === 'Positive' ? n.quotes.finalPositive : tier === 'Negative' ? n.quotes.finalNegative : n.quotes.finalNeutral;
    const theory = STRATEGY_THEORY[n.strategy];
    const guess = state.reflectionGuesses[n.id];
    const guessCorrect = guess === n.strategy;

    const hlRow = (item, kind) => item ? `
      <div class="highlight ${kind}">
        <span class="highlight-tag">${kind === 'win' ? 'Beste runde (tillit)' : 'Verste runde (tillit)'}</span>
        <span class="highlight-text">Runde ${item.round}: ${item.outcome}</span>
        <span class="highlight-delta">${item.trustDelta > 0 ? '+' : ''}${item.trustDelta}</span>
      </div>` : '';

    const diff = rel.myScore - rel.theirScore;
    const resultLabel = diff > 0 ? 'Du vant på poeng' : diff < 0 ? 'De vant på poeng' : 'Uavgjort';

    return `
      <article class="voice-card" style="--voice-accent:${n.color}">
        <div class="voice-card-header">
          <span class="voice-icon">${n.emblem}</span>
          <span class="voice-name">${esc(n.leader)}<span class="voice-sub">${esc(n.name)}</span></span>
          <span class="voice-score" style="color:${scoreColor(rel.score)}">
            Tillit ${rel.score}
            ${rel.allianceActive ? '<span class="voice-tag gold">Allianse</span>' : ''}
            ${rel.warActive ? '<span class="voice-tag red">Krig</span>' : ''}
          </span>
        </div>
        <div class="score-result">
          <span class="score-you">Du <strong>${rel.myScore}</strong></span>
          <span class="score-vs">–</span>
          <span class="score-them">De <strong>${rel.theirScore}</strong></span>
          <span class="score-result-label">${resultLabel}</span>
        </div>
        ${renderSparkline(rel.trustHistory, n.color)}
        <p class="voice-strategy">Strategi: <strong>${esc(theory.name)}</strong> – ${esc(theory.desc)}
          ${guess ? `<span class="guess-tag ${guessCorrect ? 'correct' : 'wrong'}">${guessCorrect ? '✓ Du gjettet riktig' : '✗ Du gjettet feil'}</span>` : ''}
        </p>
        <p class="voice-text">${esc(quote)}</p>
        ${hlRow(hl.win, 'win')}
        ${hlRow(hl.loss, 'loss')}
      </article>`;
  }).join('');

  return `
    <div class="report-inner">
      <p class="report-eyebrow">Diplomatisk sluttrapport · Etter ${TOTAL_ENCOUNTERS} møter · ${ROUNDS_PER_ENCOUNTER} runder hver</p>

      <div class="epithet">
        <p class="epithet-frame">${esc(epithet.frame)}</p>
        <h1 class="epithet-title">${esc(epithet.title)}</h1>
        <p class="epithet-blurb">${esc(epithet.blurb)}</p>
      </div>

      <h2 class="report-headline">${esc(reportData.headline)}</h2>

      <div class="score-result score-result-total">
        <span class="score-you">Du <strong>${stats.totalMyScore}</strong></span>
        <span class="score-vs">–</span>
        <span class="score-them">Motstanderne <strong>${stats.totalTheirScore}</strong></span>
        <span class="score-result-label">Total poengsum, alle møter</span>
      </div>

      <div class="report-section report-lesson">
        <p class="report-section-title">🎓 Spillteorien bak Diplomatiet</p>
        <p class="lesson-text">${reportData.lesson}</p>
      </div>

      <div class="report-voices">${voiceCards}</div>

      ${achievements.length ? `
        <div class="report-section">
          <p class="report-section-title">Merker du fikk underveis</p>
          <div class="achievement-list">
            ${achievements.map(a => `<span class="achievement-badge">${a.label}</span>`).join('')}
          </div>
        </div>` : ''}

      <div class="report-actions">
        <button class="btn-primary" id="btn-restart">Spill igjen</button>
        <button class="btn-secondary" id="btn-share-result">Del resultatet</button>
      </div>
    </div>`;
}
