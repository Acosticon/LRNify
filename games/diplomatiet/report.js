// report.js – Sluttrapport: forholdskurve for alle nasjoner, seks stemmer,
// et ettermæle, og en egen «spillteorien bak»-leksjon forankret i spillerens tall.

import {
  NATIONS, STRATEGY_THEORY, TOTAL_ROUNDS,
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
    if (stats.allianceBrokenCount >= 1) return 'Et brutt løfte definerte disse åtte rundene';
    if (stats.cooperateRate >= 0.65 && stats.warCount === 0) return 'Diplomatiet valgte tillit, og tilliten lønte seg';
    if (stats.cooperateRate < 0.3) return 'Opprustning ga makt, men ingen venner';
    if (stats.everWarCount >= 2) return 'Flere fronter, få seire';
    return 'Åtte runder med beregnet balansegang';
  })();

  return { headline, lesson: buildLessonText(state, stats) };
}

function buildLessonText(state, stats) {
  const pct = Math.round(stats.cooperateRate * 100);
  const best = stats.bestNation, worst = stats.worstNation;
  const worstTheory = STRATEGY_THEORY[worst.strategy].name.toLowerCase();
  const bestScore = state.relations[best.id].score;
  const worstScore = state.relations[worst.id].score;

  const lines = [];
  lines.push(`Du valgte samarbeid i ${pct} % av alle diplomatiske trekk. I et <em>gjentatt</em> fangens dilemma – der du møter samme motpart runde etter runde – er dette langt fra tilfeldig: i motsetning til et enkeltstående spill lønner svik seg sjelden over tid, fordi motparten husker og svarer i neste runde.`);

  if (stats.cooperateRate < 0.35) {
    lines.push(`Med en så lav samarbeidsrate spilte du i praksis en «alltid svik»-strategi selv. Det er en <em>dominant strategi</em> i ett enkeltstående spill – uansett hva motparten gjør, gir svik deg isolert sett mer der og da – men i et gjentatt spill bygger den fiender i stedet for handelspartnere.`);
  } else if (stats.cooperateRate > 0.7) {
    lines.push(`Med en så høy samarbeidsrate lente du deg mot en nesten ubetinget «alltid samarbeid»-tilnærming – sjenerøst, men sårbart mot enhver motpart som systematisk utnytter tilliten din, slik ${esc(worst.name)} kan ha gjort.`);
  } else {
    lines.push(`Den blandede stilen din minner om <em>tit-for-tat</em> – strategien som vant Robert Axelrods berømte dataturnering i 1980, nettopp fordi den var samarbeidsvillig, men aldri lot et svik gå ustraffet.`);
  }

  lines.push(`Forholdet ditt til ${esc(best.name)} endte sterkest (${bestScore > 0 ? '+' : ''}${bestScore}), mens ${esc(worst.name)} – som spilte «${esc(worstTheory)}» – endte svakest (${worstScore}). Det finnes ingen enkelt <em>Nash-likevekt</em> som passer alle motstandere likt: det beste mottrekket avhenger alltid av hvilken strategi du står overfor.`);

  return lines.join(' ');
}

// ─── Forholdskurve for alle nasjoner ──────────────────
function renderChart(history) {
  const W = 680, H = 260, PAD = { t: 16, r: 16, b: 30, l: 40 };
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const maxRound = Math.max(TOTAL_ROUNDS, ...history.map(h => h.round));

  const x = round => PAD.l + (round / maxRound) * iw;
  const y = val => PAD.t + (1 - (val + 100) / 200) * ih;

  const gridY = [-100, -50, 0, 50, 100].map(v => `
    <line x1="${PAD.l}" y1="${y(v)}" x2="${W - PAD.r}" y2="${y(v)}"
          stroke="#28323D" stroke-width="1" ${v === 0 ? 'stroke-dasharray="3 3"' : ''}/>
    <text x="${PAD.l - 8}" y="${y(v)}" text-anchor="end" dominant-baseline="middle"
          fill="#7C8896" font-size="10">${v}</text>`).join('');

  const gridX = history.filter(h => h.round > 0).map(h => `
    <text x="${x(h.round)}" y="${H - 8}" text-anchor="middle"
          fill="#7C8896" font-size="10">${h.round}</text>`).join('');

  const lines = NATIONS.map(n => {
    const pts = history.map(h => `${x(h.round)},${y(h[n.id])}`).join(' ');
    const last = history[history.length - 1];
    return `
      <polyline points="${pts}" fill="none" stroke="${n.color}"
                stroke-width="2.25" stroke-linejoin="round" stroke-linecap="round" opacity="0.9"/>
      <circle cx="${x(last.round)}" cy="${y(last[n.id])}" r="4.5" fill="${n.color}"
              stroke="#0B0E13" stroke-width="2"/>`;
  }).join('');

  return `
    <div class="chart-wrap">
      <svg viewBox="0 0 ${W} ${H}" class="report-chart" role="img"
           aria-label="Forholdsscore for alle nasjoner gjennom ${maxRound} runder">
        ${gridY}${gridX}${lines}
      </svg>
      <div class="chart-legend">
        ${NATIONS.map(n => `
          <span class="chart-legend-item">
            <span class="chart-swatch" style="background:${n.color}"></span>
            ${n.emblem} ${esc(n.name)}
          </span>`).join('')}
      </div>
    </div>`;
}

// ─── Rapportskjerm ────────────────────────────────────
export function renderReport(state, reportData) {
  const achievements = getAchievements(state);
  const epithet = getEpithet(state);

  const scoreColor = v => (v >= 25 ? '#3E8E7E' : v <= -25 ? '#C9524B' : '#C9A227');

  const voiceCards = NATIONS.map(n => {
    const rel = state.relations[n.id];
    const hl = getHighlights(state, n.id);
    const tier = getRelationTier(rel.score);
    const quote = tier === 'Positive' ? n.quotes.finalPositive : tier === 'Negative' ? n.quotes.finalNegative : n.quotes.finalNeutral;
    const theory = STRATEGY_THEORY[n.strategy];

    const hlRow = (item, kind) => item ? `
      <div class="highlight ${kind}">
        <span class="highlight-tag">${kind === 'win' ? 'Beste runde' : 'Verste runde'}</span>
        <span class="highlight-text">Runde ${item.round}: ${item.outcome}</span>
        <span class="highlight-delta">${item.relDelta > 0 ? '+' : ''}${item.relDelta}</span>
      </div>` : '';

    return `
      <article class="voice-card" style="--voice-accent:${n.color}">
        <div class="voice-card-header">
          <span class="voice-icon">${n.emblem}</span>
          <span class="voice-name">${esc(n.leader)}<span class="voice-sub">${esc(n.name)}</span></span>
          <span class="voice-score" style="color:${scoreColor(rel.score)}">
            ${rel.score}
            ${rel.allianceActive ? '<span class="voice-tag gold">Allianse</span>' : ''}
            ${rel.warActive ? '<span class="voice-tag red">Krig</span>' : ''}
          </span>
        </div>
        <p class="voice-strategy">Strategi: <strong>${esc(theory.name)}</strong> – ${esc(theory.desc)}</p>
        <p class="voice-text">${esc(quote)}</p>
        ${hlRow(hl.win, 'win')}
        ${hlRow(hl.loss, 'loss')}
      </article>`;
  }).join('');

  return `
    <div class="report-inner">
      <p class="report-eyebrow">Diplomatisk sluttrapport · Etter ${TOTAL_ROUNDS} runder</p>

      <div class="epithet">
        <p class="epithet-frame">${esc(epithet.frame)}</p>
        <h1 class="epithet-title">${esc(epithet.title)}</h1>
        <p class="epithet-blurb">${esc(epithet.blurb)}</p>
      </div>

      <h2 class="report-headline">${esc(reportData.headline)}</h2>

      <div class="report-section">
        <p class="report-section-title">Slik utviklet forholdene seg</p>
        ${renderChart(state.relationHistory)}
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
