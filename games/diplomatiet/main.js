// main.js – app-kontroller for kampanjeflyten:
// tittel → (kapittelintro → møte → refleksjon) × 6 → sluttrapport.

import {
  createInitialState, getCurrentNation, isCampaignComplete, isEncounterComplete,
  resolveEncounterRound, advanceToNextNation, getStrategyGuessOptions, recordGuess, isGuessCorrect,
  getHighlights, getScoreDiffHistory, saveGame, loadGame, clearSave,
  ROUNDS_PER_ENCOUNTER, TOTAL_ENCOUNTERS, STRATEGY_THEORY,
  escapeHtml as esc,
} from './game.js';
import { createProgressStrip } from './map.js';
import { generateReport, renderReport, renderSparkline } from './report.js';

let state = null;
let awaitingChoice = true; // encounter-skjerm: true = vis valgknapper, false = vis utfall + "neste"
let currentGuess = null; // reflection-skjerm: valgt strategi-id før bekreftet

const $ = sel => document.querySelector(sel);

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  $(id).classList.add('active');
}

// ─── Init ───────────────────────────────────────────────
function init() {
  const saved = loadGame();
  if (saved && !isCampaignComplete(saved)) {
    $('#resume-banner').hidden = false;
    $('#btn-resume').addEventListener('click', () => {
      state = saved;
      routeFromState();
    });
  }

  $('#btn-start-game').addEventListener('click', startNewGame);
  $('#player-name-input').addEventListener('keydown', e => { if (e.key === 'Enter') startNewGame(); });
  $('#btn-start-encounter').addEventListener('click', () => {
    showScreen('#screen-encounter');
    awaitingChoice = true;
    renderEncounterScreen();
  });
  $('#reflection-continue').addEventListener('click', goToNextNation);

  document.body.addEventListener('click', e => {
    if (e.target.id === 'btn-restart') {
      clearSave();
      state = null;
      $('#resume-banner').hidden = true;
      showScreen('#screen-title');
    }
    if (e.target.id === 'btn-share-result') shareResult();
  });
}

function startNewGame() {
  const name = $('#player-name-input').value.trim();
  state = createInitialState(name);
  saveGame(state);
  showIntroScreen();
}

// Ruter til riktig skjerm basert på lagret/gjeldende tilstand (brukes ved gjenoppta).
function routeFromState() {
  if (isCampaignComplete(state)) { goToReport(); return; }
  if (isEncounterComplete(state)) { showReflectionScreen(); return; }
  showScreen('#screen-encounter');
  awaitingChoice = true;
  renderEncounterScreen();
}

// ─── Kapittelintro ──────────────────────────────────────
function showIntroScreen() {
  const nation = getCurrentNation(state);
  showScreen('#screen-intro');
  $('#intro-progress').innerHTML = createProgressStrip(state);
  $('#intro-chapter-label').textContent = `Møte ${state.campaignIndex + 1} av ${TOTAL_ENCOUNTERS}`;
  $('#intro-emblem').textContent = nation.emblem;
  $('#intro-name').textContent = nation.name;
  $('#intro-leader').textContent = nation.leader;
  $('#intro-tagline').textContent = nation.tagline;
}

// ─── Møteskjerm ─────────────────────────────────────────
function renderEncounterScreen() {
  const nation = getCurrentNation(state);
  const rel = state.relations[nation.id];

  $('#encounter-progress').innerHTML = createProgressStrip(state);
  $('#hud-round').textContent = `Runde ${state.roundInEncounter} / ${ROUNDS_PER_ENCOUNTER}`;
  renderScoreboard(nation, rel);

  $('#encounter-nation-header').innerHTML = `
    <span class="panel-emblem">${nation.emblem}</span>
    <div>
      <p class="panel-name">${esc(nation.name)}</p>
      <p class="panel-leader">${esc(nation.leader)}</p>
    </div>`;
  $('#encounter-tagline').textContent = nation.tagline;
  $('#encounter-history').innerHTML = renderHistoryStrip(rel, nation);

  renderActionArea();
}

// Viser hele møtehistorikken mot inneværende nasjon, runde for runde – slik
// at mønsteret i motstanderens svar er synlig, ikke bare forrige runde.
function renderHistoryStrip(rel, nation) {
  if (!rel.history.length) return '<p class="history-empty">Ingen runder spilt ennå – velg for å starte mønsteret.</p>';
  const icon = m => (m === 'C' ? '🤝' : '⚔️');
  const row = (label, pick) => `
    <div class="history-row">
      <span class="history-label">${esc(label)}</span>
      <span class="history-icons">${rel.history.map(h => `<span class="history-icon ${pick(h) === 'C' ? 'coop' : 'def'}">${icon(pick(h))}</span>`).join('')}</span>
    </div>`;
  return `
    <div class="history-strip">
      ${row('Du', h => h.player)}
      ${row(nation.name, h => h.nation)}
    </div>`;
}

function renderActionArea() {
  const area = $('#encounter-action-area');
  if (awaitingChoice) {
    area.innerHTML = `
      <div class="panel-choice">
        <button class="choice-btn coop" data-move="C">🤝 Samarbeid</button>
        <button class="choice-btn def" data-move="D">⚔️ Svik</button>
      </div>`;
    area.querySelectorAll('.choice-btn').forEach(btn => {
      btn.addEventListener('click', () => handleChoice(btn.dataset.move));
    });
  } else {
    const ev = state.lastRoundEvent;
    const nation = getCurrentNation(state);
    const quoteArr = ev.nationMove === 'C' ? nation.quotes.cooperate : nation.quotes.defect;
    const quote = quoteArr[Math.floor(Math.random() * quoteArr.length)];

    const encounterDone = isEncounterComplete(state);
    area.innerHTML = `
      <div class="round-reveal">
        <p class="round-reveal-title">Du ${ev.playerMove === 'C' ? 'samarbeidet' : 'sviktet'}, de ${ev.nationMove === 'C' ? 'samarbeidet' : 'sviktet'}</p>
        <div class="round-points">
          <span class="round-points-you">Du: <strong>+${ev.myPoints}</strong> poeng</span>
          <span class="round-points-them">${esc(nation.name)}: <strong>+${ev.theirPoints}</strong> poeng</span>
        </div>
        <p class="telegram-quote">«${esc(quote)}»</p>
      </div>
      <button class="btn-primary btn-send" id="btn-next-round">${encounterDone ? 'Se oppsummering →' : 'Neste runde →'}</button>`;

    $('#btn-next-round').addEventListener('click', () => {
      if (encounterDone) showReflectionScreen();
      else { awaitingChoice = true; renderEncounterScreen(); }
    });
  }
}

function handleChoice(move) {
  state = resolveEncounterRound(state, move);
  saveGame(state);
  awaitingChoice = false;
  renderEncounterScreen();
}

function renderScoreboard(nation, rel) {
  $('#scoreboard').innerHTML = `
    <span class="score-you">Du <strong>${rel.myScore}</strong></span>
    <span class="score-vs">–</span>
    <span class="score-them">${esc(nation.name)} <strong>${rel.theirScore}</strong></span>`;
}

// ─── Refleksjonsskjerm ──────────────────────────────────
function showReflectionScreen() {
  showScreen('#screen-reflection');
  currentGuess = null;
  const nation = getCurrentNation(state);
  const rel = state.relations[nation.id];
  const hl = getHighlights(state, nation.id);

  $('#reflection-progress').innerHTML = createProgressStrip(state);

  const hlRow = (item, kind) => item ? `
    <div class="highlight ${kind}">
      <span class="highlight-tag">${kind === 'win' ? 'Beste runde' : 'Verste runde'}</span>
      <span class="highlight-text">Runde ${item.round}: ${item.outcome}</span>
      <span class="highlight-delta">${item.diff > 0 ? '+' : ''}${item.diff}</span>
    </div>` : '';

  const diff = rel.myScore - rel.theirScore;
  const resultLabel = diff > 0 ? 'Du vant på poeng' : diff < 0 ? `${nation.name} vant på poeng` : 'Uavgjort på poeng';

  $('#reflection-summary').innerHTML = `
    <div class="voice-card-header">
      <span class="voice-icon">${nation.emblem}</span>
      <span class="voice-name">${esc(nation.leader)}<span class="voice-sub">${esc(nation.name)}</span></span>
    </div>
    <div class="score-result">
      <span class="score-you">Du <strong>${rel.myScore}</strong></span>
      <span class="score-vs">–</span>
      <span class="score-them">${esc(nation.name)} <strong>${rel.theirScore}</strong></span>
      <span class="score-result-label">${resultLabel}</span>
    </div>
    ${renderSparkline(getScoreDiffHistory(rel), nation.color)}
    ${hlRow(hl.win, 'win')}
    ${hlRow(hl.loss, 'loss')}`;

  renderQuiz(nation);
}

function renderQuiz(nation) {
  const options = getStrategyGuessOptions();
  $('#reflection-question').textContent = `Hvilken strategi tror du ${nation.name} spilte?`;
  $('#reflection-options').innerHTML = options.map(o => `
    <button class="quiz-option" data-id="${o.id}">${esc(o.name)}</button>`).join('');
  $('#reflection-feedback').innerHTML = '';
  $('#reflection-continue').disabled = true;
  $('#reflection-continue').textContent = state.campaignIndex + 1 >= TOTAL_ENCOUNTERS ? 'Se sluttrapport →' : 'Neste motstander →';

  $('#reflection-options').querySelectorAll('.quiz-option').forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentGuess) return; // allerede svart
      currentGuess = btn.dataset.id;
      state = recordGuess(state, nation.id, currentGuess);
      saveGame(state);

      const correct = isGuessCorrect(nation.id, currentGuess);
      $('#reflection-options').querySelectorAll('.quiz-option').forEach(b => {
        b.disabled = true;
        if (b.dataset.id === nation.strategy) b.classList.add('correct');
        else if (b.dataset.id === currentGuess) b.classList.add('wrong');
      });
      $('#reflection-feedback').innerHTML = `
        <p class="quiz-feedback ${correct ? 'correct' : 'wrong'}">
          ${correct ? '✓ Riktig!' : '✗ Ikke helt.'} ${esc(nation.name)} spilte <strong>${esc(STRATEGY_THEORY[nation.strategy].name)}</strong> – ${esc(STRATEGY_THEORY[nation.strategy].desc)}
        </p>`;
      $('#reflection-continue').disabled = false;
    });
  });
}

function goToNextNation() {
  state = advanceToNextNation(state);
  saveGame(state);
  if (isCampaignComplete(state)) goToReport();
  else showIntroScreen();
}

// ─── Rapport ────────────────────────────────────────────
async function goToReport() {
  showScreen('#screen-report');
  $('#report-root').innerHTML = '<p class="report-loading">Genererer sluttrapport …</p>';
  const reportData = await generateReport(state, () => {});
  $('#report-root').innerHTML = renderReport(state, reportData);
  clearSave();
}

function shareResult() {
  const epithetTitle = document.querySelector('.epithet-title')?.textContent || 'Diplomatiet';
  const text = `Jeg spilte Diplomatiet på LRNify og endte som ${epithetTitle}!`;
  if (navigator.share) {
    navigator.share({ title: 'Diplomatiet', text, url: location.href }).catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(`${text} ${location.href}`).then(() => showToast('Kopiert til utklippstavlen!'));
  }
}

function showToast(message) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 400);
  }, 3000);
}

init();
