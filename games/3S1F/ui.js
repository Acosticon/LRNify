// ui.js – Render-funksjoner

import { REGIONS } from './events.js';
import { createMapSVG, setupMapListeners, getRegionInfo } from './map.js';
import { TOTAL_YEARS } from './game.js';

// Oppdater de tre pulsmålerne i sidebar
export function updateMeters(state) {
  ['business', 'people', 'nature'].forEach(m => {
    const wrap = document.querySelector(`[data-meter="${m}"]`);
    if (!wrap) return;
    const fill = wrap.querySelector('.meter-fill');
    const val  = wrap.querySelector('.meter-value');
    if (fill) fill.style.height = `${state.meters[m]}%`;
    if (val)  val.textContent = state.meters[m];
  });
}

// Oppdater år-header
export function updateYearDisplay(state) {
  const yearNum  = document.querySelector('.year-number');
  const yearsLeft= document.querySelector('.years-left');
  if (yearNum)   yearNum.textContent = `${state.year}`;
  if (yearsLeft) yearsLeft.textContent = `av ${TOTAL_YEARS}`;
}

// Render kartet
export function renderMap(state, onRegionClick) {
  const container = document.querySelector('.map-container');
  if (!container) return;

  const mapDiv = container.querySelector('#map-svg-wrap') || (() => {
    const d = document.createElement('div');
    d.id = 'map-svg-wrap';
    container.appendChild(d);
    return d;
  })();

  mapDiv.innerHTML = createMapSVG(state.activeRegion, state.currentEvents || []);

  setupMapListeners(mapDiv, (regionId) => {
    onRegionClick(regionId);
  });

  // ARIA
  const svg = mapDiv.querySelector('svg');
  if (svg) svg.setAttribute('aria-label', `Øykart. Aktiv region: ${state.activeRegion ? REGIONS[state.activeRegion]?.name : 'ingen valgt'}`);
}

// Render høyre sidebar
export function renderSidebar(state) {
  const sidebar = document.querySelector('.sidebar-right');
  if (!sidebar) return;

  const regionInfo = getRegionInfo(state.activeRegion);

  sidebar.innerHTML = `
    <div>
      <p class="sidebar-section-title">Regioner</p>
      <div class="region-list">
        ${Object.values(REGIONS).map(r => `
          <div class="region-list-item ${state.activeRegion === r.id ? 'active' : ''}" data-region="${r.id}">
            <span class="region-dot" style="background:${r.color}"></span>
            <span>${r.icon} ${r.name}</span>
          </div>
        `).join('')}
      </div>
    </div>

    ${regionInfo ? `
      <div>
        <p class="sidebar-section-title">Valgt region</p>
        <div class="region-info-card">
          <p class="region-info-name">${regionInfo.icon} ${regionInfo.name}</p>
          <p class="region-info-desc">${regionInfo.theme}</p>
        </div>
      </div>
    ` : ''}

    <div>
      <p class="sidebar-section-title">Siste endringer</p>
      <div class="var-deltas" id="var-deltas">
        ${renderVarDeltas(state)}
      </div>
    </div>
  `;

  // Legg til region-klikk i sidebar også
  sidebar.querySelectorAll('.region-list-item').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.region;
      el.closest('.sidebar-right').dispatchEvent(
        new CustomEvent('regionClick', { detail: id, bubbles: true })
      );
    });
  });
}

function renderVarDeltas(state) {
  const lastChoice = state.choiceHistory[state.choiceHistory.length - 1];
  if (!lastChoice?.meterEffects) {
    return `<p style="font-size:0.72rem;color:var(--muted)">Ingen valg ennå</p>`;
  }

  const { business = 0, people = 0, nature = 0 } = lastChoice.meterEffects;
  const rows = [
    { label: 'Næringsliv', val: business },
    { label: 'Innbyggere', val: people },
    { label: 'Natur',      val: nature },
  ];

  return rows.map(r => `
    <div class="var-delta-row">
      <span class="var-delta-name">${r.label}</span>
      <span class="var-delta-val ${r.val > 0 ? 'pos' : r.val < 0 ? 'neg' : ''}">
        ${r.val > 0 ? '+' : ''}${r.val || '–'}
      </span>
    </div>
  `).join('');
}

// Render hendelseskort
export function renderEvents(state, onChoiceMade) {
  const area = document.querySelector('.event-cards');
  if (!area) return;

  if (!state.currentEvents || state.currentEvents.length === 0) {
    area.innerHTML = '<p style="color:var(--muted);font-size:0.85rem;">Ingen saker dette året.</p>';
    return;
  }

  if (state.choiceMade) {
    area.innerHTML = `
      <div style="text-align:center;padding:2rem;color:var(--muted)">
        <p style="font-family:var(--font-display);font-size:1.1rem;margin-bottom:0.5rem">Valget er tatt.</p>
        <p style="font-size:0.85rem">Neste år begynner snart.</p>
      </div>`;
    return;
  }

  area.innerHTML = state.currentEvents.map((ev, evIdx) => {
    const typeLabel = ev.type === 'A' ? 'Grunnhendelse'
                    : ev.type === 'B' ? 'Konsekvens'
                    : 'Systemhendelse';
    const regionName = REGIONS[ev.region]?.name || ev.region;

    return `
      <div class="event-card ${ev.mandatory ? 'mandatory' : ''}" data-event-idx="${evIdx}" role="region" aria-label="${ev.title}">
        <div class="event-card-header">
          <h2 class="event-title">${ev.title}</h2>
          <span class="event-type-tag">${typeLabel}</span>
        </div>
        <p class="event-region">${REGIONS[ev.region]?.icon || ''} ${regionName}${ev.mandatory ? ' · <strong>Obligatorisk</strong>' : ''}</p>
        <p class="event-description">${ev.description}</p>
        <div class="event-choices">
          ${ev.choices.map((ch, chIdx) => `
            <button
              class="choice-btn"
              data-event-idx="${evIdx}"
              data-choice-idx="${chIdx}"
              aria-label="${ch.text}"
            >
              <span>${ch.text}</span>
              <span class="choice-effects">
                ${renderEffectTags(ch.meterEffects || {})}
              </span>
            </button>
          `).join('')}
        </div>
      </div>`;
  }).join('');

  // Hendelseslyttere
  area.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const evIdx  = parseInt(btn.dataset.eventIdx);
      const chIdx  = parseInt(btn.dataset.choiceIdx);
      onChoiceMade(evIdx, chIdx);
    });
  });
}

function renderEffectTags(effects) {
  const labels = {
    business: '💰', people: '👥', nature: '🌳',
  };
  return Object.entries(effects)
    .filter(([, v]) => v !== 0)
    .map(([k, v]) => {
      const cls = v > 0 ? 'pos' : 'neg';
      const icon = labels[k] || '';
      return `<span class="effect-tag ${cls}">${icon}${v > 0 ? '+' : ''}${v}</span>`;
    })
    .join('');
}

// Logg
export function updateLog(state) {
  const container = document.querySelector('.log-entries');
  if (!container) return;
  const recent = state.log.slice(-5).reverse();
  container.innerHTML = recent.map(e =>
    `<div class="log-entry"><span class="log-year">År ${e.year}</span>${e.text}</div>`
  ).join('');
}

// Toast-notifikasjon
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
  }, 3500);
}

// År-overgang
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
