// lab.js – Laboratoriet: se to strategier møtes i en duell, steg for steg.
// Rent tilskuer-modus – ingen spillertilstand, ingen lagring. Gjenbruker
// samme poengmatrise og strategifunksjoner som kampanjen (game.js).

import { NATIONS, NATION_BY_ID, STRATEGY_THEORY, simulateDuel, escapeHtml as esc } from './game.js';

const $ = sel => document.querySelector(sel);

let fighterAId = NATIONS[0].id;
let fighterBId = NATIONS[1].id;
let rounds = 10;
let guess = null; // 'A' | 'B' | 'tie'
let simResult = null;
let revealIndex = 0;

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  $(id).classList.add('active');
}

// ─── Init ───────────────────────────────────────────────
function init() {
  populateSelect('#fighter-a-select', fighterAId);
  populateSelect('#fighter-b-select', fighterBId);
  $('#fighter-a-select').addEventListener('change', e => { fighterAId = e.target.value; onFightersChanged(); });
  $('#fighter-b-select').addEventListener('change', e => { fighterBId = e.target.value; onFightersChanged(); });

  $('#rounds-options').querySelectorAll('.lab-rounds-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      rounds = Number(btn.dataset.rounds);
      $('#rounds-options').querySelectorAll('.lab-rounds-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
    if (Number(btn.dataset.rounds) === rounds) btn.classList.add('active');
  });

  renderGuessOptions();

  $('#btn-start-duel').addEventListener('click', startDuel);
  $('#btn-play-all').addEventListener('click', () => { revealIndex = simResult.log.length; renderDuelScreen(); });
  $('#btn-new-duel').addEventListener('click', () => {
    guess = null;
    $('#btn-start-duel').disabled = true;
    renderGuessOptions();
    showScreen('#screen-setup');
  });
}

function populateSelect(sel, selectedId) {
  $(sel).innerHTML = NATIONS.map(n => `<option value="${n.id}" ${n.id === selectedId ? 'selected' : ''}>${n.emblem} ${esc(n.name)}</option>`).join('');
}

function onFightersChanged() {
  guess = null;
  $('#btn-start-duel').disabled = true;
  renderGuessOptions();
}

function renderGuessOptions() {
  const a = NATION_BY_ID[fighterAId], b = NATION_BY_ID[fighterBId];
  $('#guess-options').innerHTML = `
    <button class="quiz-option lab-guess-btn" data-guess="A">${esc(a.name)} vinner</button>
    <button class="quiz-option lab-guess-btn" data-guess="B">${esc(b.name)} vinner</button>
    <button class="quiz-option lab-guess-btn" data-guess="tie">Uavgjort</button>`;
  $('#guess-options').querySelectorAll('.lab-guess-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      guess = btn.dataset.guess;
      $('#guess-options').querySelectorAll('.lab-guess-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      $('#btn-start-duel').disabled = false;
    });
  });
}

// ─── Duellen ────────────────────────────────────────────
function startDuel() {
  const a = NATION_BY_ID[fighterAId], b = NATION_BY_ID[fighterBId];
  simResult = simulateDuel(a.strategy, b.strategy, rounds);
  revealIndex = 0;
  showScreen('#screen-duel');
  renderDuelScreen();
}

function renderDuelScreen() {
  const a = NATION_BY_ID[fighterAId], b = NATION_BY_ID[fighterBId];
  const shown = simResult.log.slice(0, revealIndex);
  const scoreA = shown.reduce((s, r) => s + r.pointsA, 0);
  const scoreB = shown.reduce((s, r) => s + r.pointsB, 0);

  $('#duel-round').textContent = `Runde ${revealIndex} / ${rounds}`;
  $('#duel-scoreboard').innerHTML = `
    <span class="score-you">${esc(a.name)} <strong>${scoreA}</strong></span>
    <span class="score-vs">–</span>
    <span class="score-them">${esc(b.name)} <strong>${scoreB}</strong></span>`;

  $('#duel-header').innerHTML = `
    <div class="lab-fighter-chip"><span>${a.emblem}</span>${esc(a.name)}</div>
    <span class="lab-vs">mot</span>
    <div class="lab-fighter-chip"><span>${b.emblem}</span>${esc(b.name)}</div>`;

  $('#duel-history').innerHTML = renderDuelHistory(shown, a, b);

  const done = revealIndex >= simResult.log.length;
  const nextBtn = $('#btn-next-round');
  nextBtn.textContent = done ? 'Se resultat →' : 'Neste runde →';
  nextBtn.onclick = done ? showResultScreen : revealNextRound;
  $('#btn-play-all').hidden = done;
}

function renderDuelHistory(shown, a, b) {
  if (!shown.length) return '<p class="history-empty">Ingen runder spilt ennå.</p>';
  const icon = m => (m === 'C' ? '🤝' : '⚔️');
  const row = (label, pick) => `
    <div class="history-row">
      <span class="history-label">${esc(label)}</span>
      <span class="history-icons">${shown.map(r => `<span class="history-icon ${pick(r) === 'C' ? 'coop' : 'def'}">${icon(pick(r))}</span>`).join('')}</span>
    </div>`;
  return `<div class="history-strip">${row(a.name, r => r.moveA)}${row(b.name, r => r.moveB)}</div>`;
}

function revealNextRound() {
  if (revealIndex < simResult.log.length) revealIndex += 1;
  renderDuelScreen();
}

// ─── Resultat ───────────────────────────────────────────
function showResultScreen() {
  showScreen('#screen-duel-result');
  const a = NATION_BY_ID[fighterAId], b = NATION_BY_ID[fighterBId];
  const { scoreA, scoreB } = simResult;
  const actual = scoreA > scoreB ? 'A' : scoreA < scoreB ? 'B' : 'tie';
  const winnerLabel = actual === 'A' ? `${a.name} vant på poeng` : actual === 'B' ? `${b.name} vant på poeng` : 'Uavgjort';
  const correct = guess === actual;

  $('#duel-result-summary').innerHTML = `
    <div class="score-result score-result-total">
      <span class="score-you">${esc(a.name)} <strong>${scoreA}</strong></span>
      <span class="score-vs">–</span>
      <span class="score-them">${esc(b.name)} <strong>${scoreB}</strong></span>
      <span class="score-result-label">${esc(winnerLabel)}</span>
    </div>
    <p class="voice-strategy">${esc(a.name)}: <strong>${esc(STRATEGY_THEORY[a.strategy].name)}</strong> – ${esc(STRATEGY_THEORY[a.strategy].desc)}</p>
    <p class="voice-strategy">${esc(b.name)}: <strong>${esc(STRATEGY_THEORY[b.strategy].name)}</strong> – ${esc(STRATEGY_THEORY[b.strategy].desc)}</p>`;

  $('#duel-guess-feedback').innerHTML = `
    <p class="quiz-feedback ${correct ? 'correct' : 'wrong'}">${correct ? '✓ Du gjettet riktig!' : '✗ Ikke helt denne gangen.'}</p>`;
}

init();
