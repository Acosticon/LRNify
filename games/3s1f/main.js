// main.js – App-kontroller

import {
  createInitialState,
  initYear,
  selectRegion,
  dismissNewsSplash,
  applyChoice,
  deferRegion,
  endYear,
  dismissYearSummary,
  advanceYear,
  isYearExhausted,
  outstandingRegions,
  saveGame,
  loadGame,
  clearSave,
  getEpithet,
  TOTAL_YEARS,
} from './game.js';

import {
  updateMeters,
  updateYearDisplay,
  renderMap,
  renderNewsSplash,
  renderYearSummary,
  renderEventPanel,
  updateEndYearBtn,
  renderSidebar,
  updateLog,
  showToast,
  showYearTransition,
} from './ui.js';

import { generateReport, renderReport } from './report.js';

let state = createInitialState();

const handlers = { onChoice, onDefer, onNextCase };

// ─── Skjerm ───────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${id}`)?.classList.add('active');
}

// ─── Start ────────────────────────────────────────────
function startGame() {
  const name = document.getElementById('player-name-input')?.value.trim() || 'Lederen';
  state = initYear(createInitialState(name));
  clearSave();
  openFirstPendingRegion();
  showScreen('game');
  renderAll();
  saveGame(state);
}

function resumeGame(saved) {
  state = saved;
  showScreen('game');
  renderAll();
}

// ─── Render ───────────────────────────────────────────
function renderAll(deltas = null) {
  updateMeters(state, deltas);
  updateYearDisplay(state);
  renderMap(state, onRegionClick);
  renderSidebar(state);
  renderEventPanel(state, handlers);
  updateEndYearBtn(state);
  updateLog(state);
  renderNewsSplash(state, onDismissNews);
  renderYearSummary(state, onContinueFromSummary);
}

// ─── Interaksjon ──────────────────────────────────────
function onRegionClick(regionId) {
  state = selectRegion(state, regionId);
  renderMap(state, onRegionClick);
  renderSidebar(state);
  renderEventPanel(state, handlers);
  renderNewsSplash(state, onDismissNews);
}

function onDismissNews() {
  state = dismissNewsSplash(state);
  renderNewsSplash(state, onDismissNews);
  renderEventPanel(state, handlers);
}

function onChoice(regionId, choiceIndex) {
  const before = { ...state.meters };
  const next = applyChoice(state, regionId, choiceIndex);
  if (next === state) {
    showToast('Du har ikke nok tid igjen i år til dette tiltaket.');
    return;
  }
  state = next;

  const deltas = {
    business: state.meters.business - before.business,
    people:   state.meters.people   - before.people,
    nature:   state.meters.nature   - before.nature,
  };

  renderAll(deltas);
  saveGame(state);

  if (isYearExhausted(state) && outstandingRegions(state).length > 0) {
    showToast('Tiden er ute for i år. Resten blir liggende.');
  }
}

function onDefer(regionId) {
  state = deferRegion(state, regionId);
  openFirstPendingRegion();
  renderAll();
  saveGame(state);
}

function onNextCase() {
  openFirstPendingRegion();
  renderAll();
}

// ─── Årsslutt ─────────────────────────────────────────
function onEndYear() {
  state = endYear(state);
  renderAll();
  saveGame(state);
}

function onContinueFromSummary() {
  const wasFinal = state.yearSummary?.isFinalYear;
  state = dismissYearSummary(state);
  renderYearSummary(state, onContinueFromSummary);   // lukker avisen

  if (wasFinal) {
    endGame();
    return;
  }

  showYearTransition(state.year + 1, state.playerName, () => {
    state = advanceYear(state);
    openFirstPendingRegion();
    renderAll();
    saveGame(state);
  });
}

// Åpner årets første ubehandlede sak, så hendelsespanelet aldri står tomt.
function openFirstPendingRegion() {
  const [first] = outstandingRegions(state);
  if (first) state = selectRegion(state, first);
}

// ─── Sluttrapport ─────────────────────────────────────
async function endGame() {
  clearSave();
  showScreen('report');
  const screen = document.getElementById('screen-report');
  const epithet = getEpithet(state);

  screen.innerHTML = `
    <div class="report-inner">
      <p class="report-eyebrow">Øyposten · Etter ${TOTAL_YEARS} år</p>
      <div class="epithet">
        <p class="epithet-frame">${epithet.frame}</p>
        <h1 class="epithet-title">${epithet.title}</h1>
      </div>
      <p class="report-loading">Setter sammen ettermælet …</p>
    </div>`;

  await generateReport(state, ({ status, data }) => {
    if (status !== 'done') return;
    screen.innerHTML = renderReport(state, data);
    setupReportListeners();
    screen.scrollTo?.({ top: 0 });
  });
}

function setupReportListeners() {
  document.getElementById('btn-restart')?.addEventListener('click', () => {
    clearSave();
    showScreen('title');
  });

  document.getElementById('btn-share-result')?.addEventListener('click', () => {
    const { business, people, nature } = state.meters;
    const epithet = getEpithet(state);
    const text = `${epithet.frame} ${epithet.title}.\n\n`
      + `💰 Næringsliv: ${business}\n👥 Innbyggere: ${people}\n🌳 Natur: ${nature}\n\n`
      + `3S1F – Tre stemmer, én framtid`;
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else navigator.clipboard?.writeText(text).then(() => showToast('Kopiert!'));
  });
}

// ─── Init ─────────────────────────────────────────────
document.addEventListener('regionClick', e => onRegionClick(e.detail));

function init() {
  document.getElementById('btn-start')?.addEventListener('click', startGame);
  document.getElementById('player-name-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') startGame();
  });
  document.getElementById('btn-end-year')?.addEventListener('click', onEndYear);

  // Tilbud om å fortsette et påbegynt spill
  const saved = loadGame();
  if (saved && saved.year <= TOTAL_YEARS) {
    const banner = document.getElementById('resume-banner');
    if (banner) {
      banner.hidden = false;
      banner.querySelector('.resume-text').textContent =
        `${saved.playerName} står midt i år ${saved.year} av ${TOTAL_YEARS}.`;
      banner.querySelector('#btn-resume')?.addEventListener('click', () => resumeGame(saved));
      banner.querySelector('#btn-discard')?.addEventListener('click', () => {
        clearSave();
        banner.hidden = true;
      });
    }
  }

  showScreen('title');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
