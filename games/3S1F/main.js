// main.js – App-kontroller

import {
  createInitialState,
  applyChoice,
  advanceYear,
  startYear,
} from './game.js';

import {
  updateMeters,
  updateYearDisplay,
  renderMap,
  renderSidebar,
  renderEvents,
  updateLog,
  showToast,
  showYearTransition,
} from './ui.js';

import { generateReport, renderReport } from './report.js';

// ─── State ────────────────────────────────────────────

let state = createInitialState();

// ─── Skjerm-navigasjon ────────────────────────────────

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const s = document.getElementById(`screen-${id}`);
  if (s) s.classList.add('active');
}

// ─── Spillstart ───────────────────────────────────────

function startGame() {
  state = createInitialState();
  state = startYear(state);
  showScreen('game');
  renderAll();
}

// ─── Render alt ───────────────────────────────────────

function renderAll() {
  updateMeters(state);
  updateYearDisplay(state);
  renderMap(state, onRegionClick);
  renderSidebar(state);
  renderEvents(state, onChoiceMade);
  updateLog(state);
}

// ─── Region valgt ─────────────────────────────────────

function onRegionClick(regionId) {
  // Toggle
  state.activeRegion = state.activeRegion === regionId ? null : regionId;

  // Re-trekk hendelser med ny region som vekting (bare hvis ikke valgt ennå)
  if (!state.choiceMade) {
    state = startYear(state);
  }

  renderAll();
}

// ─── Valg tatt ────────────────────────────────────────

function onChoiceMade(eventIdx, choiceIdx) {
  const event = state.currentEvents[eventIdx];
  if (!event || state.choiceMade) return;

  const prevMeters = { ...state.meters };
  state = applyChoice(state, event, choiceIdx);

  renderAll();

  // Vis meter-endringer som toast
  const deltas = [];
  if (state.meters.business !== prevMeters.business) {
    const d = state.meters.business - prevMeters.business;
    deltas.push(`💰 ${d > 0 ? '+' : ''}${d}`);
  }
  if (state.meters.people !== prevMeters.people) {
    const d = state.meters.people - prevMeters.people;
    deltas.push(`👥 ${d > 0 ? '+' : ''}${d}`);
  }
  if (state.meters.nature !== prevMeters.nature) {
    const d = state.meters.nature - prevMeters.nature;
    deltas.push(`🌳 ${d > 0 ? '+' : ''}${d}`);
  }
  if (deltas.length > 0) showToast(deltas.join('  '), '');

  // Automatisk neste år etter kort pause
  setTimeout(goToNextYear, 2200);
}

// ─── Neste år ─────────────────────────────────────────

function goToNextYear() {
  const nextYear = state.year + 1;

  if (state.year >= 15) {
    // Siste år – gå til rapport
    endGame();
    return;
  }

  showYearTransition(nextYear, () => {
    state = advanceYear(state);
    renderAll();
  });
}

// ─── Sluttrapport ─────────────────────────────────────

async function endGame() {
  showScreen('report');

  const reportScreen = document.getElementById('screen-report');
  reportScreen.innerHTML = `
    <div class="report-inner">
      <p class="report-eyebrow">Balanseposten · Etter 15 år</p>
      <h1 class="report-headline" style="color:var(--muted)">Analyserer de 15 årene…</h1>
      <div class="report-voices">
        ${['💰 Næringslivet','👥 Innbyggerne','🌳 Naturen'].map(v => `
          <div class="voice-card">
            <p class="voice-text loading">Henter stemme…</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  await generateReport(state, ({ status, data }) => {
    if (status === 'done') {
      reportScreen.innerHTML = renderReport(state, data);
      setupReportListeners();
    }
  });
}

function setupReportListeners() {
  document.getElementById('btn-restart')?.addEventListener('click', () => {
    showScreen('title');
  });

  document.getElementById('btn-share-result')?.addEventListener('click', () => {
    const { business, people, nature } = state.meters;
    const text = `Jeg styrte øya i 15 år.\n💰 Næringsliv: ${business}\n👥 Innbyggere: ${people}\n🌳 Natur: ${nature}\n\nSpill 3S1F – Tre stemmer, én framtid`;
    if (navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text).then(() => {
        showToast('Kopiert til utklippstavle!');
      });
    }
  });
}

// ─── Event-delegering for sidebar region-klikk ────────

document.addEventListener('regionClick', (e) => {
  onRegionClick(e.detail);
});

// ─── Init ─────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  // Tittelskjerm-knapp
  document.getElementById('btn-start')?.addEventListener('click', startGame);

  // Start direkte ved DOMContentLoaded
  showScreen('title');
});
