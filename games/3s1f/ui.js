// ui.js – Render-funksjoner

import { REGIONS } from './events.js';
import { createMapSVG, setupMapListeners } from './map.js';
import {
  TOTAL_YEARS,
  choicesFor,
  neglectLevel,
  outstandingRegions,
  isYearExhausted,
  escapeHtml as esc,
} from './game.js';

const METER_ICONS = { business: '💰', people: '👥', nature: '🌳' };
const METER_NAMES = { business: 'Næringslivet', people: 'Innbyggerne', nature: 'Naturen' };

// ─── Målere ───────────────────────────────────────────
export function updateMeters(state, deltas = null) {
  ['business', 'people', 'nature'].forEach(m => {
    const wrap = document.querySelector(`[data-meter="${m}"]`);
    if (!wrap) return;
    const fill = wrap.querySelector('.meter-fill');
    const val  = wrap.querySelector('.meter-value');
    const value = state.meters[m];

    // Fyllgraden settes som variabel, så CSS kan bruke den som høyde
    // (loddrett sidefelt) eller bredde (vannrett topplinje på mobil).
    wrap.style.setProperty('--fill', `${value}%`);
    if (fill) fill.style.height = '';
    if (val)  val.textContent = value;
    wrap.setAttribute('aria-valuenow', value);

    // Kritisk / sterk tilstand gir måleren egen karakter
    wrap.classList.toggle('is-critical', value < 35);
    wrap.classList.toggle('is-strong', value >= 70);

    const d = deltas?.[m];
    if (d) flashMeterDelta(wrap, d);
  });
}

function flashMeterDelta(wrap, delta) {
  const chip = document.createElement('span');
  chip.className = `meter-delta ${delta > 0 ? 'pos' : 'neg'}`;
  chip.textContent = `${delta > 0 ? '+' : ''}${delta}`;
  wrap.appendChild(chip);
  wrap.classList.add('is-shaking');
  setTimeout(() => wrap.classList.remove('is-shaking'), 500);
  setTimeout(() => chip.remove(), 1600);
}

// ─── Header: år og tid ────────────────────────────────
export function updateYearDisplay(state) {
  setText('.year-number', state.year);
  setText('.years-left', `av ${TOTAL_YEARS}`);
  setText('.player-name-display', state.playerName);
  renderTimeMeter(state);
}

function setText(sel, text) {
  const el = document.querySelector(sel);
  if (el) el.textContent = text;
}

// Månedsmåleren – årets knappeste ressurs, alltid synlig
export function renderTimeMeter(state) {
  const wrap = document.querySelector('.time-meter');
  if (!wrap) return;

  const { monthsLeft, monthsTotal } = state;
  const segments = Array.from({ length: monthsTotal }, (_, i) =>
    `<span class="time-seg ${i < monthsLeft ? 'left' : 'spent'}"></span>`
  ).join('');

  const low = monthsLeft <= 3;
  wrap.classList.toggle('is-low', low);
  wrap.innerHTML = `
    <span class="time-label">Tid igjen i år ${state.year}</span>
    <span class="time-segments" role="img"
          aria-label="${monthsLeft} av ${monthsTotal} måneder igjen">${segments}</span>
    <span class="time-count"><strong>${monthsLeft}</strong> av ${monthsTotal} mnd</span>`;
}

// ─── Kart ─────────────────────────────────────────────
export function renderMap(state, onRegionClick) {
  const wrap = document.getElementById('map-svg-wrap');
  if (!wrap) return;
  wrap.innerHTML = createMapSVG(state);
  setupMapListeners(wrap, onRegionClick);
}

// ─── Nyhetsoppslag før en krise ───────────────────────
export function renderNewsSplash(state, onDismiss) {
  const overlay = document.getElementById('news-overlay');
  if (!overlay) return;

  if (!state.pendingNewsSplash) {
    overlay.classList.remove('show');
    overlay.innerHTML = '';
    return;
  }

  const { headline, ingress, causedByText } = state.pendingNewsSplash;
  overlay.innerHTML = `
    <div class="news-paper" role="document">
      <div class="news-paper-header">
        <span class="news-paper-name">Øyposten</span>
        <span class="news-paper-date">År ${state.year}</span>
      </div>
      <div class="news-paper-divider"></div>
      ${causedByText ? `<p class="news-caused-by">${esc(causedByText)}</p>` : ''}
      <h2 class="news-headline">${esc(headline)}</h2>
      <p class="news-ingress">${esc(ingress)}</p>
      <div class="news-paper-divider"></div>
      <button class="btn-primary news-dismiss-btn" id="btn-dismiss-news">
        Se valgmulighetene →
      </button>
    </div>`;

  overlay.classList.add('show');
  const btn = document.getElementById('btn-dismiss-news');
  btn?.addEventListener('click', onDismiss);
  btn?.focus();
}

// ─── Årsoppsummering som avisforside ──────────────────
export function renderYearSummary(state, onContinue) {
  const overlay = document.getElementById('year-summary-overlay');
  if (!overlay) return;

  const sum = state.yearSummary;
  if (!sum) {
    overlay.classList.remove('show');
    overlay.innerHTML = '';
    return;
  }

  const deltaRow = ['business', 'people', 'nature'].map(k => {
    const v = sum.deltas[k];
    const cls = v > 0 ? 'pos' : v < 0 ? 'neg' : 'flat';
    return `<div class="summary-delta ${cls}">
      <span class="summary-delta-icon">${METER_ICONS[k]}</span>
      <span class="summary-delta-name">${METER_NAMES[k]}</span>
      <span class="summary-delta-val">${v > 0 ? '+' : ''}${v}</span>
    </div>`;
  }).join('');

  const done = sum.decisions.length
    ? `<ul class="summary-list">${sum.decisions.map(d =>
        `<li><span class="summary-region">${REGIONS[d.region]?.icon || ''}</span>
             <span class="summary-what">${esc(d.title)} – <em>${esc(d.label)}</em></span>
             <span class="summary-months">${d.months} mnd</span></li>`).join('')}</ul>`
    : `<p class="summary-empty">Ingenting ble vedtatt i år.</p>`;

  const left = sum.neglected.length
    ? `<ul class="summary-list summary-list-bad">${sum.neglected.map(n =>
        `<li><span class="summary-region">${REGIONS[n.region]?.icon || ''}</span>
             <span class="summary-what">${esc(n.title)}</span>
             <span class="summary-years">${n.years}. år uten svar</span></li>`).join('')}</ul>`
    : '';

  const scars = sum.scars.length
    ? `<div class="summary-scars">
         <p class="summary-scars-title">For sent</p>
         <ul class="summary-list summary-list-scar">${sum.scars.map(x =>
           `<li><span class="summary-region">${REGIONS[x.region]?.icon || ''}</span>
                <span class="summary-what">${esc(x.title)}</span></li>`).join('')}</ul>
       </div>`
    : '';

  overlay.innerHTML = `
    <div class="news-paper news-paper-summary" role="document">
      <div class="news-paper-header">
        <span class="news-paper-name">Øyposten</span>
        <span class="news-paper-date">Årsoppgjør · År ${sum.year}</span>
      </div>
      <div class="news-paper-divider"></div>

      <h2 class="news-headline">${esc(sum.headline)}</h2>
      <p class="news-ingress">${esc(sum.kicker)}</p>

      <div class="summary-deltas">${deltaRow}</div>

      <div class="summary-cols">
        <div class="summary-col">
          <p class="summary-col-title">Vedtatt i år
            <span class="summary-budget">${sum.monthsUsed} av ${sum.monthsTotal} mnd brukt</span>
          </p>
          ${done}
        </div>
        ${left ? `<div class="summary-col">
          <p class="summary-col-title summary-col-title-bad">Lagt til side</p>
          ${left}
        </div>` : ''}
      </div>

      ${scars}

      <div class="news-paper-divider"></div>
      <button class="btn-primary news-dismiss-btn" id="btn-continue-year">
        ${sum.isFinalYear ? 'Se ettermælet →' : `Videre til år ${sum.year + 1} →`}
      </button>
    </div>`;

  overlay.classList.add('show');
  const btn = document.getElementById('btn-continue-year');
  btn?.addEventListener('click', onContinue);
  btn?.focus();
}

// ─── Hendelsespanel ───────────────────────────────────
const TYPE_LABEL = { A: 'Grunnhendelse', B: 'Konsekvens', C: 'Systemkrise', D: 'Veivalg' };

export function renderEventPanel(state, handlers) {
  const area = document.querySelector('.event-panel');
  if (!area) return;

  if (!state.openRegion) {
    area.innerHTML = renderPrompt(state);
    return;
  }

  const ev       = state.activeRegions[state.openRegion];
  const decision = state.regionDecisions[state.openRegion];
  const region   = REGIONS[ev.region];
  const level    = neglectLevel(state, ev.id);

  if (decision !== undefined && decision !== 'deferred') {
    area.innerHTML = renderResult(state, ev, region);
    document.getElementById('btn-next-case')
      ?.addEventListener('click', () => handlers.onNextCase());
    return;
  }

  const choices = choicesFor(state, state.openRegion);
  const isDeferred = decision === 'deferred';

  const escalationNote = level > 0 ? `
    <p class="event-escalation">
      <strong>${level}. år uten svar.</strong>
      Skaden har rukket å sette seg – tiltakene tar lengre tid, koster mer,
      og gir mindre igjen enn de ville gjort første året.
    </p>` : '';

  area.innerHTML = `
    <div class="event-card type-${ev.type} ${level > 0 ? 'is-escalated' : ''}"
         role="region" aria-label="${esc(ev.title)}">
      <div class="event-card-header">
        <div>
          <p class="event-region">
            <span class="event-region-dot" style="background:${region.color}"></span>
            ${region.icon} ${esc(region.name)} · <em>${esc(region.description)}</em>
          </p>
          <h2 class="event-title">${esc(ev.title)}</h2>
        </div>
        <span class="event-type-tag tag-${ev.type}">${TYPE_LABEL[ev.type] || 'Sak'}</span>
      </div>

      ${escalationNote}

      <p class="event-description">${esc((ev.description || ev.newsIngress || '').replace(/{navn}/g, state.playerName))}</p>

      <div class="event-choices">
        ${choices.map((ch, i) => {
          const affordable = ch.timeCost <= state.monthsLeft;
          return `
          <button class="choice-btn ${affordable ? '' : 'is-unaffordable'}"
                  data-choice-idx="${i}" ${affordable ? '' : 'disabled'}>
            <span class="choice-marker">${'ABCDE'[i]}</span>
            <span class="choice-text">${esc(ch.text)}</span>
            <span class="choice-cost ${affordable ? '' : 'too-much'}">
              ${ch.timeCost} mnd${affordable ? '' : ' · ikke nok tid'}
            </span>
          </button>`;
        }).join('')}

        <button class="choice-btn choice-defer ${isDeferred ? 'is-active' : ''}" id="btn-defer">
          <span class="choice-marker">…</span>
          <span class="choice-text">Dette kan vente – vi har viktigere ting å prioritere</span>
          <span class="choice-cost">0 mnd</span>
        </button>
      </div>

      ${isDeferred ? `<p class="event-deferred-note">
        Lagt til side. Blir den liggende ut året, forverrer den seg.
      </p>` : ''}
    </div>`;

  area.querySelectorAll('.choice-btn[data-choice-idx]').forEach(btn => {
    btn.addEventListener('click', () =>
      handlers.onChoice(state.openRegion, parseInt(btn.dataset.choiceIdx, 10)));
  });
  document.getElementById('btn-defer')
    ?.addEventListener('click', () => handlers.onDefer(state.openRegion));
}

function renderPrompt(state) {
  const open = outstandingRegions(state);
  const exhausted = isYearExhausted(state);

  if (open.length === 0) {
    return `<div class="event-prompt">
      <p class="event-prompt-text">Alle saker i år ${state.year} er behandlet.<br>
      <span class="ok">Avslutt året når du er klar.</span></p>
    </div>`;
  }
  if (exhausted) {
    return `<div class="event-prompt">
      <p class="event-prompt-text">Tiden er ute for i år.<br>
      <span class="warn">${open.length} ${open.length === 1 ? 'sak blir' : 'saker blir'} liggende til neste år.</span></p>
    </div>`;
  }
  return `<div class="event-prompt">
    <p class="event-prompt-text">${open.length} ${open.length === 1 ? 'sak venter' : 'saker venter'} på deg.<br>
    Klikk et utropstegn på kartet for å åpne saken.</p>
  </div>`;
}

function renderResult(state, ev, region) {
  const last = [...state.choiceHistory].reverse().find(c => c.eventId === ev.id);
  const remaining = outstandingRegions(state).length;
  const deltaHtml = last?.meterDeltas
    ? Object.entries(last.meterDeltas).filter(([, v]) => v !== 0).map(([k, v]) =>
        `<span class="result-delta ${v > 0 ? 'pos' : 'neg'}">${METER_ICONS[k]} ${v > 0 ? '+' : ''}${v}</span>`
      ).join('')
    : '';

  return `
    <div class="choice-result">
      <p class="result-event-title">${region.icon} ${esc(region.name)} · ${esc(ev.title)}</p>
      <p class="result-choice-text">«${esc(last?.choiceText || '')}»</p>
      ${deltaHtml ? `<div class="result-deltas">${deltaHtml}</div>` : ''}
      <p class="result-sub">
        Brukte ${last?.timeCost ?? '?'} måneder.
        ${last?.neglectLevel ? 'Saken hadde allerede rukket å forverre seg.' : 'Konsekvensene kan vise seg senere.'}
      </p>
      ${remaining ? `<button class="btn-secondary btn-small result-next" id="btn-next-case">
        Neste sak (${remaining} igjen) →
      </button>` : ''}
    </div>`;
}

// ─── Avslutt året ─────────────────────────────────────
export function updateEndYearBtn(state) {
  const btn = document.getElementById('btn-end-year');
  if (!btn) return;
  const open = outstandingRegions(state).length;
  const exhausted = isYearExhausted(state);

  btn.textContent = state.year >= TOTAL_YEARS ? 'Avslutt siste år →' : 'Avslutt året →';
  btn.classList.toggle('is-urgent', exhausted && open > 0);

  const hint = document.querySelector('.end-year-hint');
  if (hint) {
    hint.textContent = open === 0
      ? 'Alt er behandlet.'
      : exhausted
        ? `Tiden er ute – ${open} ${open === 1 ? 'sak' : 'saker'} blir liggende.`
        : `${open} ${open === 1 ? 'sak' : 'saker'} ubehandlet.`;
    hint.classList.toggle('warn', open > 0);
  }
}

// ─── Høyre sidebar ────────────────────────────────────
export function renderSidebar(state) {
  const sidebar = document.querySelector('.sidebar-right');
  if (!sidebar) return;

  const activeIds = Object.keys(state.activeRegions);

  const saker = activeIds.map(id => {
    const r  = REGIONS[id];
    const ev = state.activeRegions[id];
    const d  = state.regionDecisions[id];
    const level = neglectLevel(state, ev.id);
    const isOpen = state.openRegion === id;

    let status, statusClass;
    if (d !== undefined && d !== 'deferred') { status = '✓'; statusClass = 'done'; }
    else if (d === 'deferred')               { status = '…'; statusClass = 'deferred'; }
    else                                      { status = '!'; statusClass = 'pending'; }

    const cheapest = Math.min(...choicesFor(state, id).map(c => c.timeCost));

    return `<button class="region-list-item ${isOpen ? 'active' : ''}" data-region="${id}">
      <span class="region-dot" style="background:${r.color}"></span>
      <span class="region-list-name">${r.icon} ${esc(r.name)}</span>
      ${level > 0 ? `<span class="region-neglect" title="${level}. år uten svar">${level}×</span>` : ''}
      <span class="region-cost">${cheapest} mnd</span>
      <span class="region-status ${statusClass}">${status}</span>
    </button>`;
  }).join('');

  const neglectIds = Object.keys(state.neglect);
  const neglectBlock = neglectIds.length ? `
    <div class="sidebar-block">
      <p class="sidebar-section-title warn">Uløste saker</p>
      <div class="neglect-list">
        ${neglectIds.map(id => {
          const n = state.neglect[id];
          return `<div class="neglect-item">
            <span>${REGIONS[n.region]?.icon || ''} ${esc(n.title)}</span>
            <span class="neglect-years">${n.years}. år</span>
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  const scarBlock = state.scars.length ? `
    <div class="sidebar-block">
      <p class="sidebar-section-title bad">Tapte saker</p>
      <div class="neglect-list">
        ${state.scars.map(x => `<div class="neglect-item scar">
          <span>${REGIONS[x.region]?.icon || ''} ${esc(x.title)}</span>
          <span class="neglect-years">år ${x.year}</span>
        </div>`).join('')}
      </div>
    </div>` : '';

  sidebar.innerHTML = `
    <div class="sidebar-block">
      <p class="sidebar-section-title">Årets saker</p>
      <div class="region-list">${saker || '<p class="sidebar-empty">Ingen saker i år.</p>'}</div>
    </div>
    ${neglectBlock}
    ${scarBlock}
    <div class="sidebar-block">
      <p class="sidebar-section-title">Øyas utvikling</p>
      <div class="map-legend">${buildIconLegend(state.mapIcons, state.mapWarnings)}</div>
    </div>`;

  sidebar.querySelectorAll('.region-list-item').forEach(el => {
    el.addEventListener('click', () => {
      sidebar.dispatchEvent(new CustomEvent('regionClick', { detail: el.dataset.region, bubbles: true }));
    });
  });
}

function buildIconLegend(mapIcons, mapWarnings) {
  const all = [...(mapIcons || []), ...(mapWarnings || [])];
  if (!all.length) return '<p class="sidebar-empty">Ingen spor ennå.</p>';
  return all.slice(-7).map(i => `
    <div class="legend-item">
      <span class="legend-emoji">${i.emoji}</span>
      <span class="legend-label">${esc(i.label)}</span>
      <span class="legend-year">år ${i.year}</span>
    </div>`).join('');
}

// ─── Logg ─────────────────────────────────────────────
export function updateLog(state) {
  const el = document.querySelector('.log-entries');
  if (!el) return;
  if (!state.log.length) {
    el.innerHTML = '<p class="sidebar-empty">Historikken fylles etter hvert som du bestemmer.</p>';
    return;
  }
  el.innerHTML = state.log.slice(-8).reverse()
    .map(e => `<div class="log-entry"><span class="log-year">År ${e.year}</span>${esc(e.text)}</div>`)
    .join('');
}

// ─── Toast ────────────────────────────────────────────
export function showToast(message, type = '') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('is-leaving');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ─── År-overgang ──────────────────────────────────────
export function showYearTransition(year, playerName, callback) {
  const overlay = document.getElementById('year-transition');
  const label   = overlay?.querySelector('.transition-year');
  const sub     = overlay?.querySelector('.transition-sub');
  if (!overlay || !label) { callback(); return; }
  label.textContent = `År ${year}`;
  if (sub) sub.textContent = `${playerName} går inn i år ${year} av ${TOTAL_YEARS}`;
  overlay.classList.add('show');
  setTimeout(() => {
    overlay.classList.remove('show');
    setTimeout(callback, 400);
  }, 1100);
}
