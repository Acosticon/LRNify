// ui.js – Render-funksjoner

import { REGIONS } from './events.js';
import { createMapSVG, setupMapListeners } from './map.js';
import { TOTAL_YEARS } from './game.js';

// ─── Målere ───────────────────────────────────────────
export function updateMeters(state) {
  ['business', 'people', 'nature'].forEach(m => {
    const wrap = document.querySelector(`[data-meter="${m}"]`);
    if (!wrap) return;
    const fill = wrap.querySelector('.meter-fill');
    const val  = wrap.querySelector('.meter-value');
    if (fill) fill.style.height = `${state.meters[m]}%`;
    if (val)  val.textContent = state.meters[m];
    wrap.setAttribute('aria-valuenow', state.meters[m]);
  });
}

// ─── År-header ────────────────────────────────────────
export function updateYearDisplay(state) {
  const yearNum   = document.querySelector('.year-number');
  const yearsLeft = document.querySelector('.years-left');
  const nameEl    = document.querySelector('.player-name-display');
  if (yearNum)   yearNum.textContent = state.year;
  if (yearsLeft) yearsLeft.textContent = `av ${TOTAL_YEARS}`;
  if (nameEl)    nameEl.textContent = state.playerName;
}

// ─── Kart ─────────────────────────────────────────────
export function renderMap(state, onRegionClick) {
  const wrap = document.getElementById('map-svg-wrap');
  if (!wrap) return;
  wrap.innerHTML = createMapSVG(
    state.activeRegions,
    state.regionDecisions,
    state.openRegion,
    state.mapIcons,
    state.mapWarnings
  );
  setupMapListeners(wrap, onRegionClick);
}

// ─── News Splash (avisforside for type B) ─────────────
export function renderNewsSplash(state, onDismiss) {
  const overlay = document.getElementById('news-overlay');
  if (!overlay) return;

  if (!state.pendingNewsSplash) {
    overlay.classList.remove('show');
    return;
  }

  const { headline, ingress, causedByText } = state.pendingNewsSplash;

  overlay.innerHTML = `
    <div class="news-paper">
      <div class="news-paper-header">
        <span class="news-paper-name">Øyposten</span>
        <span class="news-paper-date">År ${state.year}</span>
      </div>
      <div class="news-paper-divider"></div>
      ${causedByText ? `<p class="news-caused-by">${causedByText}</p>` : ''}
      <h2 class="news-headline">${headline}</h2>
      <p class="news-ingress">${ingress}</p>
      <div class="news-paper-divider"></div>
      <button class="btn-primary news-dismiss-btn" id="btn-dismiss-news">
        Se valgmulighetene →
      </button>
    </div>`;

  overlay.classList.add('show');
  document.getElementById('btn-dismiss-news')?.addEventListener('click', onDismiss);
}

// ─── Hendelsespanel ───────────────────────────────────
export function renderEventPanel(state, onChoiceMade, onIgnore) {
  const area = document.querySelector('.event-panel');
  if (!area) return;

  // Ingen region valgt
  if (!state.openRegion) {
    const total   = Object.keys(state.activeRegions).length;
    const handled = Object.keys(state.regionDecisions).length;
    const left    = total - handled;

    if (left === 0) {
      area.innerHTML = `
        <div class="event-prompt">
          <p class="event-prompt-text">Alle saker er behandlet for år ${state.year}.<br>
          <span style="color:var(--teal)">Klikk «Neste år» for å gå videre.</span></p>
        </div>`;
      return;
    }

    area.innerHTML = `
      <div class="event-prompt">
        <p class="event-prompt-text">${left} av ${total} saker gjenstår.<br>
        Klikk et utropstegn på kartet for å se saken.</p>
      </div>`;
    return;
  }

  const ev       = state.activeRegions[state.openRegion];
  const decision = state.regionDecisions[state.openRegion];
  const region   = REGIONS[ev.region];

  // Allerede håndtert – vis resultat
  if (decision !== undefined) {
    const isIgnored = decision === 'ignored';
    const last = state.choiceHistory.findLast?.(c => c.eventId === ev.id)
              || [...state.choiceHistory].reverse().find(c => c.eventId === ev.id);

    const deltaHtml = last?.meterDeltas
      ? Object.entries(last.meterDeltas).filter(([,v]) => v !== 0).map(([k, v]) => {
          const icons = { business:'💰', people:'👥', nature:'🌳' };
          return `<span class="result-delta ${v > 0 ? 'pos' : 'neg'}">${icons[k]} ${v > 0 ? '+' : ''}${v}</span>`;
        }).join('') : '';

    area.innerHTML = `
      <div class="choice-result">
        <p class="result-event-title">${region.icon} ${region.name} · ${ev.title}</p>
        <p class="result-choice-text">${isIgnored ? '(Ignorert – ingen handling)' : `«${last?.choiceText || ''}»`}</p>
        ${deltaHtml ? `<div class="result-deltas">${deltaHtml}</div>` : ''}
        ${isIgnored ? '<p class="result-sub" style="color:var(--coral)">Konsekvensene av å ignorere dette kan vise seg senere.</p>'
                    : '<p class="result-sub">Konsekvensene kan vise seg i fremtiden.</p>'}
      </div>`;
    return;
  }

  // Vis hendelse med valg
  const typeLabel = ev.type === 'A' ? 'Grunnhendelse' : ev.type === 'B' ? 'Konsekvens' : 'Systemhendelse';

  area.innerHTML = `
    <div class="event-card ${ev.type === 'B' ? 'consequence-card' : ''}" role="region" aria-label="${ev.title}">
      <div class="event-card-header">
        <h2 class="event-title">${ev.title}</h2>
        <span class="event-type-tag ${ev.type === 'B' ? 'tag-consequence' : ''}">${typeLabel}</span>
      </div>
      <p class="event-region">${region.icon} ${region.name} · <em>${region.description}</em></p>
      <p class="event-description">${(ev.description || '').replace(/{navn}/g, state.playerName)}</p>
      <div class="event-choices">
        ${ev.choices.map((ch, i) => `
          <button class="choice-btn" data-choice-idx="${i}" aria-label="${ch.text}">
            ${ch.text}
          </button>`).join('')}
        <button class="choice-btn choice-ignore" id="btn-ignore-${ev.id}">
          <span>La saken ligge</span>
          <span class="ignore-warning">⚠ Kan få konsekvenser</span>
        </button>
      </div>
    </div>`;

  area.querySelectorAll('.choice-btn[data-choice-idx]').forEach(btn => {
    btn.addEventListener('click', () => onChoiceMade(state.openRegion, parseInt(btn.dataset.choiceIdx)));
  });

  document.getElementById(`btn-ignore-${ev.id}`)?.addEventListener('click', () => onIgnore(state.openRegion));
}

// ─── «Neste år»-knapp ─────────────────────────────────
export function updateNextYearBtn(state) {
  const btn = document.getElementById('btn-next-year');
  if (!btn) return;
  const total   = Object.keys(state.activeRegions).length;
  const handled = Object.keys(state.regionDecisions).length;
  btn.disabled = handled < total;
  btn.textContent = state.year >= TOTAL_YEARS ? 'Se rapporten →' : 'Neste år →';
}

// ─── Høyre sidebar ────────────────────────────────────
export function renderSidebar(state) {
  const sidebar = document.querySelector('.sidebar-right');
  if (!sidebar) return;

  const activeIds = Object.keys(state.activeRegions);

  sidebar.innerHTML = `
    <div>
      <p class="sidebar-section-title">Årets saker</p>
      <div class="region-list">
        ${activeIds.map(id => {
          const r = REGIONS[id];
          const d = state.regionDecisions[id];
          const isOpen = state.openRegion === id;
          const status = d === undefined ? '❗' : d === 'ignored' ? '–' : '✓';
          return `<div class="region-list-item ${isOpen ? 'active' : ''}" data-region="${id}">
            <span class="region-dot" style="background:${r.color}"></span>
            <span>${r.icon} ${r.name}</span>
            <span class="region-status">${status}</span>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div>
      <p class="sidebar-section-title">Øyas utvikling</p>
      <div class="map-legend">
        ${buildIconLegend(state.mapIcons, state.mapWarnings)}
      </div>
    </div>
  `;

  sidebar.querySelectorAll('.region-list-item').forEach(el => {
    el.addEventListener('click', () => {
      sidebar.dispatchEvent(new CustomEvent('regionClick', { detail: el.dataset.region, bubbles: true }));
    });
  });
}

function buildIconLegend(mapIcons, mapWarnings) {
  const all = [...(mapIcons || []), ...(mapWarnings || [])];
  if (all.length === 0) return '<p style="font-size:0.72rem;color:var(--muted)">Ingen valg ennå</p>';
  return all.slice(-6).map(i => `
    <div class="legend-item">
      <span>${i.emoji}</span>
      <span class="legend-label">${i.label}</span>
      <span class="legend-year" style="color:var(--muted)">år ${i.year}</span>
    </div>`).join('');
}

// ─── Logg ─────────────────────────────────────────────
export function updateLog(state) {
  const el = document.querySelector('.log-entries');
  if (!el) return;
  el.innerHTML = state.log.slice(-5).reverse()
    .map(e => `<div class="log-entry"><span class="log-year">År ${e.year}</span>${e.text}</div>`)
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
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'opacity 0.4s, transform 0.4s';
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
  if (sub) sub.textContent = playerName ? `${playerName} tar over` : '';
  overlay.classList.add('show');
  setTimeout(() => {
    overlay.classList.remove('show');
    setTimeout(callback, 400);
  }, 1000);
}
