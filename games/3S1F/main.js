// main.js – App-kontroller

import {
  createInitialState,
  initYear,
  selectRegion,
  applyChoice,
  advanceYear,
  TOTAL_YEARS,
} from './game.js';

import {
  updateMeters,
  updateYearDisplay,
  renderMap,
  renderSidebar,
  renderEventPanel,
  renderChoiceResult,
  updateLog,
  showToast,
  showYearTransition,
} from './ui.js';

import { generateReport, renderReport } from './report.js';

// ─── State ────────────────────────────────────────────
let state = createInitialState();

// ─── Skjerm ───────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${id}`)?.classList.add('active');
}

// ─── Spillstart ───────────────────────────────────────
function startGame() {
  state = initYear(createInitialState());
  showScreen('game');
  renderAll();
}

// ─── Render alt ───────────────────────────────────────
function renderAll() {
  updateMeters(state);
  updateYearDisplay(state);
  renderMap(state, onRegionClick);
  renderSidebar(state);
  renderEventPanel(state, onChoiceMade);
  updateLog(state);
}

// ─── Region klikket ───────────────────────────────────
function onRegionClick(regionId) {
  if (state.choiceMade) return;
  state = selectRegion(state, regionId);
  renderMap(state, onRegionClick);
  renderSidebar(state);
  renderEventPanel(state, onChoiceMade);
}

// ─── Valg tatt ────────────────────────────────────────
function onChoiceMade(choiceIndex) {
  if (state.choiceMade) return;

  state = applyChoice(state, choiceIndex);

  // Oppdater målere
  updateMeters(state);
  updateLog(state);
  renderSidebar(state);

  // Vis konsekvenser i hendelsespanelet
  renderChoiceResult(state);

  // Gå videre etter pause
  setTimeout(goToNextYear, 2800);
}

// ─── Neste år ─────────────────────────────────────────
function goToNextYear() {
  if (state.year >= TOTAL_YEARS) {
    endGame();
    return;
  }
  const nextYear = state.year + 1;
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
      <p class="report-eyebrow">Balanseposten · Etter ${TOTAL_YEARS} år</p>
      <h1 class="report-headline" style="color:var(--muted)">Analyserer de ${TOTAL_YEARS} årene…</h1>
      <div class="report-voices">
        ${['💰 Næringslivet','👥 Innbyggerne','🌳 Naturen'].map(() => `
          <div class="voice-card"><p class="voice-text loading">Henter stemme…</p></div>
        `).join('')}
      </div>
    </div>`;

  await generateReport(state, ({ status, data }) => {
    if (status === 'done') {
      reportScreen.innerHTML = renderReport(state, data);
      setupReportListeners();
    }
  });
}

function setupReportListeners() {
  document.getElementById('btn-restart')?.addEventListener('click', () => showScreen('title'));
  document.getElementById('btn-share-result')?.addEventListener('click', () => {
    const { business, people, nature } = state.meters;
    const text = `Jeg styrte øya i ${TOTAL_YEARS} år.\n💰 Næringsliv: ${business}\n👥 Innbyggere: ${people}\n🌳 Natur: ${nature}\n\n3S1F – Tre stemmer, én framtid`;
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else navigator.clipboard?.writeText(text).then(() => showToast('Kopiert!'));
  });
}

// ─── Sidebar region-klikk (event delegation) ──────────
document.addEventListener('regionClick', e => onRegionClick(e.detail));

// ─── Init ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-start')?.addEventListener('click', startGame);
  showScreen('title');
});
