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
  if (yearNum)   yearNum.textContent = state.year;
  if (yearsLeft) yearsLeft.textContent = `av ${TOTAL_YEARS}`;
}

// ─── Kart ─────────────────────────────────────────────
export function renderMap(state, onRegionClick) {
  const wrap = document.getElementById('map-svg-wrap');
  if (!wrap) return;

  wrap.innerHTML = createMapSVG(state.activeRegions, state.selectedRegion);
  setupMapListeners(wrap, onRegionClick);
}

// ─── Høyre sidebar ────────────────────────────────────
export function renderSidebar(state) {
  const sidebar = document.querySelector('.sidebar-right');
  if (!sidebar) return;

  const selRegion = state.selectedRegion ? REGIONS[state.selectedRegion] : null;

  sidebar.innerHTML = `
    <div>
      <p class="sidebar-section-title">Aktive regioner</p>
      <div class="region-list">
        ${Object.keys(state.activeRegions).map(id => {
          const r = REGIONS[id];
          const isSelected = state.selectedRegion === id;
          return `<div class="region-list-item ${isSelected ? 'active' : ''}" data-region="${id}">
            <span class="region-dot" style="background:${r.color}"></span>
            <span>${r.icon} ${r.name}</span>
          </div>`;
        }).join('')}
      </div>
    </div>

    ${selRegion ? `
      <div>
        <p class="sidebar-section-title">Bærekraftsmål</p>
        <div class="region-info-card">
          <p class="region-info-name">${selRegion.icon} ${selRegion.name}</p>
          <p class="region-info-desc">${selRegion.sdg}</p>
        </div>
      </div>` : ''}

    ${state.lastChoiceResult ? `
      <div>
        <p class="sidebar-section-title">Konsekvenser</p>
        <div class="var-deltas">
          ${renderMeterDeltas(state.lastChoiceResult.meterDeltas)}
        </div>
      </div>` : `
      <div>
        <p class="sidebar-section-title" style="opacity:0.5">Velg en region</p>
      </div>`}
  `;

  // Sidebar-klikk på aktive regioner
  sidebar.querySelectorAll('.region-list-item').forEach(el => {
    el.addEventListener('click', () => {
      sidebar.dispatchEvent(new CustomEvent('regionClick', { detail: el.dataset.region, bubbles: true }));
    });
  });
}

function renderMeterDeltas(deltas) {
  const labels = { business: '💰 Næringsliv', people: '👥 Innbyggere', nature: '🌳 Natur' };
  return Object.entries(deltas).map(([k, v]) => `
    <div class="var-delta-row">
      <span class="var-delta-name">${labels[k]}</span>
      <span class="var-delta-val ${v > 0 ? 'pos' : v < 0 ? 'neg' : ''}">
        ${v > 0 ? '+' : ''}${v !== 0 ? v : '–'}
      </span>
    </div>`).join('');
}

// ─── Hendelsespanel ───────────────────────────────────
export function renderEventPanel(state, onChoiceMade) {
  const area = document.querySelector('.event-panel');
  if (!area) return;

  // Ingen region valgt ennå
  if (!state.openEvent && !state.choiceMade) {
    const count = Object.keys(state.activeRegions).length;
    area.innerHTML = `
      <div class="event-prompt">
        <p class="event-prompt-text">${count} regioner har saker som trenger din oppmerksomhet.<br>Klikk på et utropstegn for å se saken.</p>
      </div>`;
    return;
  }

  // Valg allerede gjort dette året
  if (state.choiceMade) {
    const last = state.choiceHistory[state.choiceHistory.length - 1];
    area.innerHTML = `
      <div class="event-done">
        <p class="event-done-title">Valget er tatt</p>
        <p class="event-done-choice">«${last?.choiceText || ''}»</p>
        <p class="event-done-sub">Konsekvensene vil vise seg over tid.</p>
      </div>`;
    return;
  }

  // Vis åpen hendelse
  const ev = state.openEvent;
  const region = REGIONS[ev.region];
  const typeLabel = ev.type === 'A' ? 'Grunnhendelse' : ev.type === 'B' ? 'Konsekvens' : 'Systemhendelse';

  area.innerHTML = `
    <div class="event-card" role="region" aria-label="${ev.title}">
      <div class="event-card-header">
        <h2 class="event-title">${ev.title}</h2>
        <span class="event-type-tag">${typeLabel}</span>
      </div>
      <p class="event-region">${region.icon} ${region.name} · ${region.sdg}</p>
      <p class="event-description">${ev.description}</p>
      <div class="event-choices">
        ${ev.choices.map((ch, i) => `
          <button class="choice-btn" data-choice-idx="${i}" aria-label="${ch.text}">
            ${ch.text}
          </button>`).join('')}
      </div>
    </div>`;

  area.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => onChoiceMade(parseInt(btn.dataset.choiceIdx)));
  });
}

// ─── Konsekvens-visning etter valg ────────────────────
export function renderChoiceResult(state) {
  const area = document.querySelector('.event-panel');
  if (!area || !state.lastChoiceResult) return;

  const { choiceText, meterDeltas } = state.lastChoiceResult;
  const last = state.choiceHistory[state.choiceHistory.length - 1];

  const deltaHtml = Object.entries(meterDeltas)
    .filter(([, v]) => v !== 0)
    .map(([k, v]) => {
      const icons = { business: '💰', people: '👥', nature: '🌳' };
      const cls = v > 0 ? 'pos' : 'neg';
      return `<span class="result-delta ${cls}">${icons[k]} ${v > 0 ? '+' : ''}${v}</span>`;
    }).join('');

  area.innerHTML = `
    <div class="choice-result">
      <p class="result-event-title">${last?.eventTitle || ''}</p>
      <p class="result-choice-text">«${choiceText}»</p>
      ${deltaHtml ? `<div class="result-deltas">${deltaHtml}</div>` : ''}
      <p class="result-sub">Konsekvensene kan vise seg i fremtiden.</p>
    </div>`;
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
export function showYearTransition(year, callback) {
  const overlay = document.getElementById('year-transition');
  const label   = overlay?.querySelector('.transition-year');
  if (!overlay || !label) { callback(); return; }
  label.textContent = `År ${year}`;
  overlay.classList.add('show');
  setTimeout(() => {
    overlay.classList.remove('show');
    setTimeout(callback, 400);
  }, 900);
}
