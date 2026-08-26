/* =========================================================
   SPILLFLATE
   Alt som rører DOM-en ligger her. Denne fila regner ingen
   statistikk og tolker ingen krav — den leser bare tilstanden
   validatoren returnerer, og tegner den.
   ========================================================= */

import { challengesForLevel, LEVELS, LEVEL_TITLES, LEVEL_BLURBS } from './challenges.js';
import { REQUIREMENT_LABELS, NO_MODE, isLocked } from './challenge.js';
import { formatNumber } from './stats.js';
import { describeResult } from './feedback.js';
import { generateChallenges } from './generator.js';
import * as Game from './game.js';

const $ = (id) => document.getElementById(id);
const MEASURES = ['mean', 'median', 'mode', 'range'];

const state = {
  session: null,
  mode: 'kampanje',
  level: 1,
  sorted: false,
  flash: null,
};

/* ══════════════ skjermer ══════════════ */

function showScreen(id) {
  for (const screen of document.querySelectorAll('.screen')) {
    screen.classList.toggle('active', screen.id === id);
  }
  window.scrollTo(0, 0);
}

/* ══════════════ menyen ══════════════ */

function buildMenu() {
  const list = $('levelList');
  list.innerHTML = '';
  for (const level of LEVELS) {
    const button = document.createElement('button');
    button.className = 'level-btn';
    button.innerHTML = `
      <span class="level-num">${level}</span>
      <span>
        <span class="level-name">Nivå ${level} · ${LEVEL_TITLES[level]}</span>
        <span class="level-blurb">${LEVEL_BLURBS[level]}</span>
      </span>`;
    button.addEventListener('click', () => startCampaign(level));
    list.appendChild(button);
  }

  const levelSelect = $('sandboxLevel');
  levelSelect.innerHTML = LEVELS
    .map((level) => `<option value="${level}">${level} — ${LEVEL_TITLES[level]}</option>`).join('');
  const countSelect = $('sandboxCount');
  countSelect.innerHTML = [5, 10, 15, 20]
    .map((n) => `<option value="${n}"${n === 10 ? ' selected' : ''}>${n}</option>`).join('');
}

function startCampaign(level) {
  state.mode = 'kampanje';
  state.level = level;
  state.session = Game.createSession(challengesForLevel(level), { mode: 'kampanje' });
  startTask();
}

function startSandbox() {
  const level = Number($('sandboxLevel').value);
  const count = Number($('sandboxCount').value);
  const generated = generateChallenges(level, count);
  if (!generated.length) {
    window.alert('Klarte ikke å lage oppgaver på dette nivået. Prøv igjen.');
    return;
  }
  state.mode = 'sandkasse';
  state.level = level;
  state.session = Game.createSession(generated, { mode: 'sandkasse' });
  startTask();
}

function startTask() {
  state.sorted = false;
  $('sortToggle').checked = false;
  state.flash = null;
  showScreen('screen-game');
  render();
}

/* ══════════════ tegning ══════════════ */

function render() {
  const session = state.session;
  const challenge = Game.currentChallenge(session);
  const result = Game.validation(session);

  renderHud(session, challenge);
  renderGoal(challenge, result);
  renderTiles(session, challenge);
  renderStats(challenge, result);
  renderHints(session);
  renderStatus(session, challenge, result);
}

function renderHud(session, challenge) {
  $('hudTask').textContent = `Oppgave ${session.index + 1}/${session.challenges.length}`;
  $('hudLevel').textContent = state.mode === 'sandkasse'
    ? `Sandkasse · nivå ${challenge.level}`
    : `Nivå ${challenge.level} · ${LEVEL_TITLES[challenge.level]}`;

  const dots = $('hudDots');
  dots.innerHTML = '';
  for (let i = 0; i < session.challenges.length; i++) {
    const dot = document.createElement('span');
    const done = session.results[i];
    dot.className = 'dot' + (done && done.solved ? ' done' : i === session.index ? ' now' : '');
    dots.appendChild(dot);
  }
}

/* Målområdet: kravene slik oppgaven stiller dem, med hake når de
   er oppfylt og dagens verdi når de ikke er det. */
function renderGoal(challenge, result) {
  $('goalTitle').textContent = `Bygg et datasett med ${challenge.values.count} tall`;

  const items = [];
  for (const [key, requirement] of Object.entries(result.requirements)) {
    const text = key === 'mode' && requirement.target === NO_MODE
      ? 'Ingen typetall'
      : `${REQUIREMENT_LABELS[key]} = ${formatNumber(requirement.target)}`;
    items.push({
      text,
      passed: requirement.passed,
      now: `nå ${formatNumber(requirement.actual, { nullText: 'ingen' })}`,
    });
  }
  for (const item of constraintItems(challenge, result)) items.push(item);
  if (challenge.lockedValues.length) {
    items.push({ text: 'Låste tall kan ikke endres', passed: true, now: '' });
  }

  const list = $('goalList');
  list.innerHTML = '';
  for (const item of items) {
    const row = document.createElement('div');
    row.className = 'goal-item' + (item.passed ? ' met' : '');
    row.innerHTML = `
      <span class="goal-mark">${item.passed ? '✓' : '○'}</span>
      <span>${item.text}</span>
      <span class="goal-gap">${item.passed ? '' : item.now}</span>`;
    list.appendChild(row);
  }
}

function constraintItems(challenge, result) {
  const constraints = challenge.constraints;
  const checks = result.constraints;
  const items = [];
  const list = (values) => values.map((v) => formatNumber(v)).join(' og ');

  if (constraints.mustInclude.length) {
    items.push({
      text: `Må inneholde ${list(constraints.mustInclude)}`,
      passed: checks.mustInclude.passed,
      now: `mangler ${list(checks.mustInclude.missing)}`,
    });
  }
  if (constraints.mustNotInclude.length) {
    items.push({
      text: `Kan ikke inneholde ${list(constraints.mustNotInclude)}`,
      passed: checks.mustNotInclude.passed,
      now: 'ta den ut',
    });
  }
  if (constraints.minValue !== null) {
    items.push({
      text: `Alle tall minst ${formatNumber(constraints.minValue)}`,
      passed: checks.minValue.passed,
      now: `minste er ${formatNumber(checks.minValue.actual)}`,
    });
  }
  if (constraints.maxValue !== null) {
    items.push({
      text: `Alle tall høyst ${formatNumber(constraints.maxValue)}`,
      passed: checks.maxValue.passed,
      now: `største er ${formatNumber(checks.maxValue.actual)}`,
    });
  }
  if (constraints.allUnique) {
    items.push({
      text: 'Alle tallene må være ulike',
      passed: checks.allUnique.passed,
      now: `${list(checks.allUnique.duplicates)} går igjen`,
    });
  }
  if (constraints.exactDistinctValues !== null) {
    items.push({
      text: `Nøyaktig ${constraints.exactDistinctValues} ulike verdier`,
      passed: checks.exactDistinctValues.passed,
      now: `nå ${checks.exactDistinctValues.actual}`,
    });
  }
  for (const check of checks.occurrences ? checks.occurrences.checks : []) {
    items.push({
      text: `${formatNumber(check.value)} skal være med nøyaktig ${check.wanted} ganger`,
      passed: check.passed,
      now: `nå ${check.actual}`,
    });
  }
  return items;
}

/* Tallbrikkene. Sortert visning endrer bare rekkefølgen på skjermen —
   hver brikke beholder plassen sin i datasettet. */
function renderTiles(session, challenge) {
  const container = $('tiles');
  const active = document.activeElement;
  const focusIndex = active && active.classList.contains('tile-value')
    ? Number(active.dataset.index) : null;

  const order = session.dataset.map((value, index) => ({ value, index }));
  if (state.sorted) order.sort((a, b) => a.value - b.value || a.index - b.index);

  container.innerHTML = '';
  for (const { value, index } of order) {
    const locked = isLocked(challenge, index);
    const tile = document.createElement('div');
    tile.className = 'tile' + (locked ? ' locked' : '');

    if (locked) {
      tile.innerHTML = `<span class="tile-lock">🔒</span>
        <input class="tile-value" data-index="${index}" value="${formatNumber(value)}"
               disabled aria-label="Låst tall ${formatNumber(value)}">
        <span class="tile-lock"></span>`;
    } else {
      tile.innerHTML = `
        <button class="tile-btn" data-index="${index}" data-step="-1" aria-label="Tallet på plass ${index + 1} ned">−</button>
        <input class="tile-value" type="number" inputmode="numeric" data-index="${index}"
               value="${value}" aria-label="Tall på plass ${index + 1}"
               min="${challenge.values.min}" max="${challenge.values.max}">
        <button class="tile-btn" data-index="${index}" data-step="1" aria-label="Tallet på plass ${index + 1} opp">+</button>`;
    }
    container.appendChild(tile);
  }

  if (focusIndex !== null) {
    const input = container.querySelector(`.tile-value[data-index="${focusIndex}"]`);
    if (input && !input.disabled) input.focus({ preventScroll: true });
  }
}

function renderStats(challenge, result) {
  const body = $('statsBody');
  body.innerHTML = '';
  for (const key of MEASURES) {
    const requirement = result.requirements[key];
    const row = document.createElement('tr');
    if (requirement) row.className = 'asked' + (requirement.passed ? ' met' : '');
    const now = formatNumber(result.stats[key], { nullText: '–' });
    const target = requirement
      ? (requirement.target === NO_MODE ? 'ingen' : formatNumber(requirement.target))
      : '–';
    row.innerHTML = `
      <td>${REQUIREMENT_LABELS[key]}</td>
      <td>${now}${requirement && requirement.passed ? ' ✓' : ''}</td>
      <td class="target">${target}</td>`;
    body.appendChild(row);
  }
}

function renderHints(session) {
  const list = $('hintList');
  list.innerHTML = '';
  const hints = Game.visibleHints(session);
  hints.forEach((text, i) => {
    const box = document.createElement('div');
    box.className = 'hint';
    box.innerHTML = `<b>Hint ${i + 1}</b>${text}`;
    list.appendChild(box);
  });
  $('btnHint').disabled = Game.hintsLeft(session) === 0;
  $('btnHint').textContent = Game.hintsLeft(session) === 0 ? 'Ingen flere hint' : 'Hint';
}

function renderStatus(session, challenge, result) {
  const row = $('statusRow');
  row.innerHTML = '';
  $('btnImpossible').hidden = challenge.level < 6;

  if (Game.isTaskComplete(session)) {
    row.appendChild(successPanel(session, challenge));
    return;
  }
  if (result.solved) {
    row.appendChild(progressPanel(session, challenge));
    return;
  }
  if (Game.isRepeatedSolution(session)) {
    row.appendChild(flashBox('Den løsningen har du allerede levert. Finn et datasett som er forskjellig fra den.', 'bad'));
    return;
  }
  if (state.flash) {
    row.appendChild(flashBox(state.flash.text, state.flash.kind));
  }
}

function flashBox(text, kind) {
  const box = document.createElement('div');
  box.className = `flash ${kind}`;
  box.textContent = text;
  return box;
}

/* Underveis i en oppgave som krever flere løsninger. */
function progressPanel(session, challenge) {
  const panel = document.createElement('div');
  panel.className = 'flash good';
  const found = session.solutions.length;
  panel.innerHTML = `<div>Løsning ${found} funnet ✓ — finn ${challenge.requiredSolutions - found} til.</div>
    <div class="solution-chips">${session.solutions
      .map((s) => `<span class="chip done">${[...s].sort((a, b) => a - b).join(', ')}</span>`)
      .join('')}</div>`;
  return panel;
}

function successPanel(session, challenge) {
  const panel = document.createElement('div');
  panel.className = 'success';
  const last = session.challenges.length === session.index + 1;

  const title = challenge.impossible ? 'Riktig — den kan ikke løses.' : 'Der satt den!';
  const observation = challenge.impossible ? '' : (session.lastMove || '');
  const resultLine = challenge.impossible ? '' : describeResult(session.dataset, challenge);

  panel.innerHTML = `
    <div class="success-title">${title}</div>
    ${observation ? `<p class="observation">${observation}</p>` : ''}
    ${challenge.insight ? `<p class="insight">${challenge.insight}</p>` : ''}
    ${resultLine ? `<div class="result-line">${resultLine}</div>` : ''}
    ${session.solutions.length > 1
      ? `<div class="solution-chips">${session.solutions
          .map((s) => `<span class="chip done">${[...s].sort((a, b) => a - b).join(', ')}</span>`).join('')}</div>`
      : ''}`;

  const button = document.createElement('button');
  button.className = 'btn-primary';
  button.style.marginTop = '14px';
  button.textContent = last ? 'Se oppsummering' : 'Neste oppgave →';
  button.addEventListener('click', goNext);
  panel.appendChild(button);
  return panel;
}

/* ══════════════ handlinger ══════════════ */

function afterChange(result) {
  state.flash = null;
  render();
  announce(result);
}

function announce(result) {
  const parts = Object.entries(result.requirements).map(([key, requirement]) => {
    const label = REQUIREMENT_LABELS[key].toLowerCase();
    return requirement.passed
      ? `${label} ${formatNumber(requirement.actual)} oppfylt`
      : `${label} ${formatNumber(requirement.actual, { nullText: 'ingen' })}, trenger ${formatNumber(requirement.target)}`;
  });
  $('srAnnounce').textContent = parts.join('. ');
}

function goNext() {
  const session = state.session;
  Game.commitResult(session);
  if (Game.hasNext(session)) {
    Game.goNext(session);
    state.flash = null;
    render();
  } else {
    showEnd();
  }
}

function showEnd() {
  const summary = Game.summary(state.session);
  $('endTitle').textContent = state.mode === 'sandkasse'
    ? 'Sandkasse fullført' : `Nivå ${state.level} fullført`;
  $('endBlurb').textContent = state.mode === 'sandkasse'
    ? `${summary.total} genererte oppgaver.` : LEVEL_BLURBS[state.level];
  $('endSolved').textContent = `${summary.solved} av ${summary.total}`;
  $('endNoHints').textContent = String(summary.noHints);
  $('endHints').textContent = String(summary.hintsUsed);
  $('btnNextLevel').hidden = !(state.mode === 'kampanje' && state.level < 6);
  showScreen('screen-end');
}

/* ══════════════ hendelser ══════════════ */

$('tiles').addEventListener('click', (event) => {
  const button = event.target.closest('.tile-btn');
  if (!button) return;
  const result = Game.nudge(state.session, Number(button.dataset.index), Number(button.dataset.step));
  afterChange(result);
});

$('tiles').addEventListener('input', (event) => {
  const input = event.target.closest('.tile-value');
  if (!input) return;
  const value = Number(input.value);
  const challenge = Game.currentChallenge(state.session);
  /* Vent med å gripe inn til det som står der er et lovlig tall —
     ellers klipper vi i tallet mens spilleren skriver det. */
  if (input.value === '' || Number.isNaN(value)) return;
  if (value < challenge.values.min || value > challenge.values.max) return;
  afterChange(Game.setValue(state.session, Number(input.dataset.index), value));
});

$('tiles').addEventListener('keydown', (event) => {
  const input = event.target.closest('.tile-value');
  if (!input) return;
  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
  event.preventDefault();
  const step = event.key === 'ArrowUp' ? 1 : -1;
  afterChange(Game.nudge(state.session, Number(input.dataset.index), step));
});

/* Ugyldig eller tom rute settes tilbake til den verdien
   datasettet faktisk har når spilleren forlater den. */
$('tiles').addEventListener('focusout', (event) => {
  const input = event.target.closest('.tile-value');
  if (!input) return;
  const index = Number(input.dataset.index);
  input.value = state.session.dataset[index];
});

$('sortToggle').addEventListener('change', (event) => {
  state.sorted = event.target.checked;
  render();
});

$('btnReset').addEventListener('click', () => {
  afterChange(Game.resetDataset(state.session));
});

$('btnHint').addEventListener('click', () => {
  Game.nextHint(state.session);
  render();
});

$('btnImpossible').addEventListener('click', () => {
  const claim = Game.claimImpossible(state.session);
  state.flash = claim.correct
    ? null
    : { text: 'Det finnes faktisk en løsning på denne oppgaven. Prøv videre.', kind: 'bad' };
  render();
});

$('btnSandbox').addEventListener('click', startSandbox);
$('btnMenu').addEventListener('click', () => showScreen('screen-start'));
$('btnNextLevel').addEventListener('click', () => startCampaign(state.level + 1));

buildMenu();
