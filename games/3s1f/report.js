// report.js – Sluttrapport: kurve over ti år, tre fagpersoner og et ettermæle

import {
  buildReportPrompt,
  getAchievements,
  getEpithet,
  getHighlights,
  TOTAL_YEARS,
  escapeHtml as esc,
} from './game.js';

// Rapportteksten kan hentes fra en språkmodell, men det krever et endepunkt
// som holder API-nøkkelen på serversiden. Uten det bruker spillet den
// innebygde analysen – den er skrevet for å stå på egne bein.
// Sett til f.eks. '/api/rapport' når en proxy er på plass.
const REPORT_ENDPOINT = null;

const METER_COLORS = { business: '#E8C547', people: '#E87D5B', nature: '#5BBFAD' };
const EXPERTS = {
  business: { icon: '💰', role: 'Økonom',   name: 'Næringslivet' },
  people:   { icon: '👥', role: 'Sosiolog', name: 'Innbyggerne' },
  nature:   { icon: '🌳', role: 'Biolog',   name: 'Naturen' },
};

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
  const { meters, variables, scars } = state;
  const name = state.playerName;

  const headline = (() => {
    if (scars.length >= 3) return 'Ti år der sakene løste seg selv – dårlig';
    if (meters.nature < 35 && meters.business > 60) return 'Naturen betalte for veksten';
    if (meters.business < 35 && meters.nature > 60) return 'Øya valgte bort veksten';
    if (meters.people < 35) return 'Folk flest kom til kort';
    if (['business', 'people', 'nature'].every(k => meters[k] >= 58)) return 'Tre stemmer, og ingen overdøvet';
    if (['business', 'people', 'nature'].every(k => meters[k] < 40)) return 'Ti år uten retning';
    return 'Ti år med vanskelige avveininger';
  })();

  const trend = k => {
    const h = state.meterHistory;
    if (h.length < 2) return 0;
    return h[h.length - 1][k] - h[0][k];
  };

  const business = (() => {
    const t = trend('business');
    if (meters.business > 65)
      return `Nøkkeltallene er gode: ${variables.jobs} i sysselsetting og en statskasse på ${variables.treasury}. ${name} bygget noe som tåler et dårlig år. Om regnskapet hadde omfattet mer enn kroner, hadde bildet vært mindre pent.`;
    if (meters.business < 40)
      return `Dette holdt ikke. Investeringene uteble, og de som kunne flytte, flyttet. ${name} skal ha for at prioriteringene var tydelige – men en øy uten arbeidsplasser finansierer ikke resten av ambisjonene sine.`;
    return `Vi holdt skansen. ${t >= 0 ? 'Kurven peker svakt oppover' : 'Kurven har falt gjennom perioden'}, og grunnlaget er intakt. Neste leder arver et handlingsrom, ikke en krise.`;
  })();

  const people = (() => {
    if (meters.people > 65)
      return `Folk merket forskjell. Tilliten ligger på ${variables.trust}, helsetilbudet på ${variables.health}, og det er ikke tilfeldig – det er valg ${name} tok. Ulikheten forsvant ikke, men den vokste ikke heller.`;
    if (meters.people < 40)
      return `Innbyggerne ble den tapende parten. Med tillit på ${variables.trust} snakker vi ikke lenger om misnøye, men om et brudd. Folk husker hvem som satt med ansvaret – og de husker lenge.`;
    return `Det er greit å bo her. Ikke mer enn det. ${name} unngikk de store feilene, men også de store løftene, og for de som sto svakest var ti år lang tid å vente.`;
  })();

  const nature = (() => {
    if (meters.nature > 65)
      return `Faglig sett er dette det mest oppløftende jeg har sett på lenge. Naturmangfoldet ligger på ${variables.biodiversity} og havmiljøet på ${variables.oceanEnv}. ${name} sa nei når det kostet noe – det er sjeldnere enn folk tror.`;
    if (meters.nature < 40)
      return `Det er stille i Skoglandet nå. Med naturmangfold på ${variables.biodiversity} og utslipp på ${variables.emissions} snakker vi om tap som ikke lar seg reversere i vår levetid. Noe av dette kunne vært unngått uten at det kostet en eneste arbeidsplass.`;
    return `Naturen overlevde, men den er slitt. Enkelte habitater kommer tilbake av seg selv om de får være i fred. Andre gjør det ikke. Grensen mellom dem gikk gjennom flere av valgene ${name} tok.`;
  })();

  return { headline, business, people, nature };
}

// ─── Kurve over ti år ─────────────────────────────────
function renderChart(history) {
  const W = 640, H = 240, PAD = { t: 16, r: 16, b: 30, l: 34 };
  const iw = W - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const maxYear = Math.max(TOTAL_YEARS, ...history.map(h => h.year));

  const x = year => PAD.l + (year / maxYear) * iw;
  const y = val  => PAD.t + (1 - val / 100) * ih;

  const gridY = [0, 25, 50, 75, 100].map(v => `
    <line x1="${PAD.l}" y1="${y(v)}" x2="${W - PAD.r}" y2="${y(v)}"
          stroke="#243B4A" stroke-width="1" ${v === 50 ? 'stroke-dasharray="3 3"' : ''}/>
    <text x="${PAD.l - 8}" y="${y(v)}" text-anchor="end" dominant-baseline="middle"
          fill="#7A9BAE" font-size="11">${v}</text>`).join('');

  const gridX = history.filter(h => h.year > 0).map(h => `
    <text x="${x(h.year)}" y="${H - 8}" text-anchor="middle"
          fill="#7A9BAE" font-size="11">${h.year}</text>`).join('');

  const lines = ['business', 'people', 'nature'].map(k => {
    const pts = history.map(h => `${x(h.year)},${y(h[k])}`).join(' ');
    const last = history[history.length - 1];
    return `
      <polyline points="${pts}" fill="none" stroke="${METER_COLORS[k]}"
                stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${history.map(h => `<circle cx="${x(h.year)}" cy="${y(h[k])}" r="2.5"
                                  fill="${METER_COLORS[k]}"/>`).join('')}
      <circle cx="${x(last.year)}" cy="${y(last[k])}" r="5" fill="${METER_COLORS[k]}"
              stroke="#0D1B2A" stroke-width="2"/>`;
  }).join('');

  return `
    <div class="chart-wrap">
      <svg viewBox="0 0 ${W} ${H}" class="report-chart" role="img"
           aria-label="Utviklingen av de tre målerne gjennom ${maxYear} år">
        ${gridY}${gridX}${lines}
        <text x="${PAD.l}" y="${H - 8}" text-anchor="middle" fill="#7A9BAE" font-size="11">0</text>
      </svg>
      <div class="chart-legend">
        ${['business', 'people', 'nature'].map(k => `
          <span class="chart-legend-item">
            <span class="chart-swatch" style="background:${METER_COLORS[k]}"></span>
            ${EXPERTS[k].icon} ${EXPERTS[k].name}
          </span>`).join('')}
      </div>
    </div>`;
}

// ─── Rapportskjerm ────────────────────────────────────
export function renderReport(state, reportData) {
  const { meters } = state;
  const achievements = getAchievements(state);
  const epithet = getEpithet(state);

  const meterColor = v => (v >= 65 ? '#5BBFAD' : v <= 40 ? '#E87D5B' : '#E8C547');

  const voiceCards = ['business', 'people', 'nature'].map(k => {
    const ex = EXPERTS[k];
    const hl = getHighlights(state, k);
    const start = state.meterHistory[0]?.[k] ?? 50;
    const change = meters[k] - start;

    const hlRow = (item, kind) => item ? `
      <div class="highlight ${kind}">
        <span class="highlight-tag">${kind === 'win' ? 'Største seier' : 'Største tap'}</span>
        <span class="highlight-text">År ${item.year}: ${esc(item.title)} – <em>${esc(item.label)}</em></span>
        <span class="highlight-delta">${item.delta > 0 ? '+' : ''}${item.delta}</span>
      </div>` : '';

    return `
      <article class="voice-card">
        <div class="voice-card-header">
          <span class="voice-icon">${ex.icon}</span>
          <span class="voice-name">${ex.role}<span class="voice-sub">om ${ex.name.toLowerCase()}</span></span>
          <span class="voice-score" style="color:${meterColor(meters[k])}">
            ${meters[k]}
            <span class="voice-change ${change >= 0 ? 'pos' : 'neg'}">${change > 0 ? '+' : ''}${change}</span>
          </span>
        </div>
        <p class="voice-text">${esc(reportData[k])}</p>
        ${hlRow(hl.win, 'win')}
        ${hlRow(hl.loss, 'loss')}
      </article>`;
  }).join('');

  const scarBlock = state.scars.length ? `
    <div class="report-section">
      <p class="report-section-title">Saker som aldri ble behandlet</p>
      <div class="scar-list">
        ${state.scars.map(x => `<span class="scar-badge">${esc(x.title)} <em>år ${x.year}</em></span>`).join('')}
      </div>
    </div>` : '';

  return `
    <div class="report-inner">
      <p class="report-eyebrow">Øyposten · Etter ${TOTAL_YEARS} år</p>

      <div class="epithet">
        <p class="epithet-frame">${esc(epithet.frame)}</p>
        <h1 class="epithet-title">${esc(epithet.title)}</h1>
        <p class="epithet-blurb">${esc(epithet.blurb)}</p>
      </div>

      <h2 class="report-headline">${esc(reportData.headline)}</h2>

      <div class="report-section">
        <p class="report-section-title">Slik utviklet øya seg</p>
        ${renderChart(state.meterHistory)}
      </div>

      <div class="report-voices">${voiceCards}</div>

      ${scarBlock}

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
