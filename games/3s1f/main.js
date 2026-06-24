// main.js – App-kontroller

import {
  createInitialState,
  initYear,
  selectRegion,
  dismissNewsSplash,
  applyChoice,
  ignoreRegion,
  advanceYear,
  allRegionsHandled,
  TOTAL_YEARS,
} from './game.js';

import {
  updateMeters,
  updateYearDisplay,
  renderMap,
  renderNewsSplash,
  renderEventPanel,
  updateNextYearBtn,
  renderSidebar,
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
  const nameInput = document.getElementById('player-name-input');
  const name = nameInput?.value.trim() || 'Lederen';
  state = initYear(createInitialState(name));
  showScreen('game');
  renderAll();
}

// ─── Render alt ───────────────────────────────────────
function renderAll() {
  updateMeters(state);
  updateYearDisplay(state);
  renderMap(state, onRegionClick);
  renderSidebar(state);
  renderEventPanel(state, onChoiceMade, onIgnore);
  updateNextYearBtn(state);
  updateLog(state);
  renderNewsSplash(state, onDismissNews);
}

// ─── Region klikket ───────────────────────────────────
function onRegionClick(regionId) {
  state = selectRegion(state, regionId);
  renderMap(state, onRegionClick);
  renderSidebar(state);
  renderEventPanel(state, onChoiceMade, onIgnore);
  renderNewsSplash(state, onDismissNews);
}

// ─── Lukk nyhetsoverlay ───────────────────────────────
function onDismissNews() {
  state = dismissNewsSplash(state);
  renderNewsSplash(state, onDismissNews);
}

// ─── Valg tatt ────────────────────────────────────────
function onChoiceMade(regionId, choiceIndex) {
  state = applyChoice(state, regionId, choiceIndex);
  afterDecision();
}

// ─── Sak ignorert ─────────────────────────────────────
function onIgnore(regionId) {
  state = ignoreRegion(state, regionId);
  afterDecision();
}

function afterDecision() {
  updateMeters(state);
  updateLog(state);
  renderMap(state, onRegionClick);
  renderSidebar(state);
  renderEventPanel(state, onChoiceMade, onIgnore);
  updateNextYearBtn(state);

  // Toast med meter-deltas
  const last = state.choiceHistory[state.choiceHistory.length - 1];
  if (last?.meterDeltas) {
    const deltas = Object.entries(last.meterDeltas)
      .filter(([,v]) => v !== 0)
      .map(([k, v]) => {
        const icons = { business:'💰', people:'👥', nature:'🌳' };
        return `${icons[k]} ${v > 0 ? '+' : ''}${v}`;
      });
    if (deltas.length) showToast(deltas.join('  '));
  }
}

// ─── Neste år ─────────────────────────────────────────
function goToNextYear() {
  if (state.year >= TOTAL_YEARS) {
    endGame();
    return;
  }
  showYearTransition(state.year + 1, state.playerName, () => {
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
      <h1 class="report-headline" style="color:var(--muted)">Analyserer ${state.playerName}s tid ved makten…</h1>
      <div class="report-voices">
        ${['💰 Næringslivet','👥 Innbyggerne','🌳 Naturen'].map(() =>
          `<div class="voice-card"><p class="voice-text loading">Henter stemme…</p></div>`
        ).join('')}
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
    const text = `${state.playerName} styrte øya i ${TOTAL_YEARS} år.\n💰 Næringsliv: ${business}\n👥 Innbyggere: ${people}\n🌳 Natur: ${nature}\n\n3S1F – Tre stemmer, én framtid`;
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else navigator.clipboard?.writeText(text).then(() => showToast('Kopiert!'));
  });
}

// ─── Sidebar region-klikk ────────────────────────────
document.addEventListener('regionClick', e => onRegionClick(e.detail));

// ─── Init ─────────────────────────────────────────────
// ES-moduler er alltid defer – DOMContentLoaded kan allerede ha kjørt.
function init() {
  document.getElementById('btn-start')?.addEventListener('click', startGame);
  document.getElementById('player-name-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') startGame();
  });
  document.getElementById('btn-next-year')?.addEventListener('click', goToNextYear);
  showScreen('title');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
