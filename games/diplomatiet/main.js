// main.js – app-kontroller: skjermbytte, wiring, lagring/gjenoppta.

import {
  createInitialState, setStance, isRoundReady, isGameOver, resolveRound,
  saveGame, loadGame, clearSave, TOTAL_ROUNDS, escapeHtml as esc,
} from './game.js';
import { NATIONS, NATION_BY_ID } from './nations.js';
import { createMapSVG, setupMapListeners } from './map.js';
import { generateReport, renderReport } from './report.js';

let state = null;
let selectedNationId = null;

const $ = sel => document.querySelector(sel);
const scoreColor = v => (v >= 25 ? '#3E8E7E' : v <= -25 ? '#C9524B' : '#C9A227');

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  $(id).classList.add('active');
}

// ─── Init ───────────────────────────────────────────────
function init() {
  const saved = loadGame();
  if (saved && saved.round <= TOTAL_ROUNDS && saved.round > 1) {
    $('#resume-banner').hidden = false;
    $('#resume-round').textContent = saved.round;
    $('#btn-resume').addEventListener('click', () => {
      state = saved;
      selectedNationId = null;
      startGameScreen();
    });
  }

  $('#btn-start-game').addEventListener('click', startNewGame);
  $('#player-name-input').addEventListener('keydown', e => { if (e.key === 'Enter') startNewGame(); });
  $('#btn-send-round').addEventListener('click', sendRound);
  $('#btn-telegram-continue').addEventListener('click', continueAfterTelegram);

  document.body.addEventListener('click', e => {
    if (e.target.id === 'btn-restart') {
      clearSave();
      state = null;
      selectedNationId = null;
      $('#resume-banner').hidden = true;
      showScreen('#screen-title');
    }
    if (e.target.id === 'btn-share-result') shareResult();
  });
}

function startNewGame() {
  const name = $('#player-name-input').value.trim();
  state = createInitialState(name);
  selectedNationId = null;
  saveGame(state);
  startGameScreen();
}

function startGameScreen() {
  showScreen('#screen-game');
  renderGameScreen();
}

// ─── Spillskjerm ────────────────────────────────────────
function renderGameScreen() {
  $('#hud-round').textContent = `Runde ${state.round} / ${TOTAL_ROUNDS}`;
  renderMeters();
  $('#map-wrap').innerHTML = createMapSVG(state, { selectedNationId });
  setupMapListeners($('#map-wrap'), onNationClick);
  renderPanel();
  renderSendButton();
}

function renderMeters() {
  const meters = [
    ['velstand', 'Velstand', '💰'],
    ['sikkerhet', 'Sikkerhet', '🛡️'],
    ['anseelse', 'Anseelse', '🌍'],
  ];
  $('#meters').innerHTML = meters.map(([key, label, icon]) => `
    <div class="meter">
      <span class="meter-label">${icon} ${label}</span>
      <div class="meter-track"><div class="meter-fill" style="width:${state.meters[key]}%"></div></div>
      <span class="meter-val">${state.meters[key]}</span>
    </div>`).join('');
}

function onNationClick(id) {
  selectedNationId = id;
  $('#map-wrap').innerHTML = createMapSVG(state, { selectedNationId });
  setupMapListeners($('#map-wrap'), onNationClick);
  renderPanel();
}

function renderPanel() {
  const panel = $('#panel');
  if (!selectedNationId) {
    panel.innerHTML = `<div class="panel-placeholder"><p>Velg en nasjon på kartet for å bestemme din holdning denne runden.</p></div>`;
    return;
  }
  const n = NATION_BY_ID[selectedNationId];
  const rel = state.relations[n.id];
  const current = state.pendingStances[n.id];
  const lastRound = rel.history[rel.history.length - 1];

  panel.innerHTML = `
    <div class="panel-nation" style="--voice-accent:${n.color}">
      <div class="panel-nation-header">
        <span class="panel-emblem">${n.emblem}</span>
        <div>
          <p class="panel-name">${esc(n.name)}</p>
          <p class="panel-leader">${esc(n.leader)}</p>
        </div>
      </div>
      <p class="panel-tagline">${esc(n.tagline)}</p>
      <div class="panel-status">
        <span>Forhold: <strong style="color:${scoreColor(rel.score)}">${rel.score}</strong></span>
        ${rel.allianceActive ? '<span class="voice-tag gold">Allianse</span>' : ''}
        ${rel.warActive ? '<span class="voice-tag red">Krig</span>' : ''}
      </div>
      <p class="panel-lastround">${lastRound
        ? `Forrige runde: du ${lastRound.player === 'C' ? 'samarbeidet' : 'sviktet'}, de ${lastRound.nation === 'C' ? 'samarbeidet' : 'sviktet'}.`
        : 'Dere har ingen felles historie ennå.'}</p>
      <div class="panel-choice">
        <button class="choice-btn coop ${current === 'C' ? 'active' : ''}" data-move="C">🤝 Samarbeid</button>
        <button class="choice-btn def ${current === 'D' ? 'active' : ''}" data-move="D">⚔️ Svik</button>
      </div>
    </div>`;

  panel.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state = setStance(state, n.id, btn.dataset.move);
      saveGame(state);
      renderGameScreen();
    });
  });
}

function renderSendButton() {
  const ready = isRoundReady(state);
  const count = NATIONS.filter(n => state.pendingStances[n.id]).length;
  const btn = $('#btn-send-round');
  btn.disabled = !ready;
  btn.textContent = ready ? 'Send diplomatiske signaler' : `Velg holdning (${count}/${NATIONS.length})`;
}

// ─── Runde-oppgjør ──────────────────────────────────────
function sendRound() {
  if (!isRoundReady(state)) return;
  const roundPlayed = state.round;
  state = resolveRound(state);
  saveGame(state);
  renderTelegram(roundPlayed, state.lastRoundEvents);
  selectedNationId = null;
}

function renderTelegram(roundPlayed, events) {
  const rows = events.map(ev => {
    const n = NATION_BY_ID[ev.nationId];
    const quoteArr = ev.nationMove === 'C' ? n.quotes.cooperate : n.quotes.defect;
    const quote = quoteArr[Math.floor(Math.random() * quoteArr.length)];
    const special = [];
    if (ev.allianceFormed) special.push(`<p class="telegram-special gold">🕊️ Allianse dannet! ${esc(n.quotes.allianceFormed)}</p>`);
    if (ev.allianceBroken) special.push(`<p class="telegram-special red">💔 Alliansen er brutt. ${esc(n.quotes.allianceBroken)}</p>`);
    if (ev.warStart) special.push(`<p class="telegram-special red">⚔️ Konflikt utbrutt. ${esc(n.quotes.warStart)}</p>`);
    if (ev.peaceRestored) special.push(`<p class="telegram-special gold">🕊️ Fred gjenopprettet. ${esc(n.quotes.peaceRestored)}</p>`);

    return `
      <div class="telegram-row" style="--voice-accent:${n.color}">
        <span class="telegram-emblem">${n.emblem}</span>
        <div class="telegram-body">
          <p class="telegram-title">${esc(n.name)} — du ${ev.playerMove === 'C' ? 'samarbeidet' : 'sviktet'}, de ${ev.nationMove === 'C' ? 'samarbeidet' : 'sviktet'}</p>
          <p class="telegram-quote">«${esc(quote)}»</p>
          ${special.join('')}
        </div>
        <span class="telegram-delta" style="color:${ev.relDelta >= 0 ? '#3E8E7E' : '#C9524B'}">${ev.relDelta > 0 ? '+' : ''}${ev.relDelta}</span>
      </div>`;
  }).join('');

  $('#telegram-round').textContent = `Runde ${roundPlayed}`;
  $('#telegram-rows').innerHTML = rows;
  $('#telegram-overlay').classList.add('active');
}

function continueAfterTelegram() {
  $('#telegram-overlay').classList.remove('active');
  if (isGameOver(state)) goToReport();
  else renderGameScreen();
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
