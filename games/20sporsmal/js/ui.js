/* =========================================================
   UI — DOM-laget for "20 spørsmål"
   Denne fila vet ingenting om spillreglene. Den kaller inn i
   modeA.js/modeB.js (som igjen bruker engine.js) og tegner
   resultatet. All fagkunnskap kommer fra innholdspakken (content)
   som main.js laster inn og sender til init().
   ========================================================= */
import * as Engine from './engine.js';
import * as ModeA from './modeA.js';
import * as ModeB from './modeB.js';

const $ = (id) => document.getElementById(id);

const ANSWER_LABELS = {
  yes: 'Ja', no: 'Nei', unknown: 'Vet ikke', not_relevant: 'Ikke relevant',
};

const state = {
  content: null,
  debugMode: false,
  sessionA: null,
  sessionB: null,
};

export function init(content) {
  state.content = content;

  const breadcrumb = $('topicBreadcrumb');
  if (breadcrumb) breadcrumb.textContent = `${content.subjectName} → ${content.topicName}`;

  $('debugToggle').addEventListener('change', (e) => {
    state.debugMode = e.target.checked;
    if (state.sessionA) renderModeA();
    if (state.sessionB) renderModeB();
  });

  $('btnStartModeA').addEventListener('click', startModeA);
  $('btnStartModeB').addEventListener('click', startModeB);

  wireModeA();
  wireModeB();

  showScreen('screen-start');
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
  $(id).classList.add('active');
}

function goHome() {
  state.sessionA = null;
  state.sessionB = null;
  showScreen('screen-start');
}

/* =========================================================
   MODUS A
   ========================================================= */

function startModeA() {
  state.sessionA = ModeA.createModeA(state.content.concepts, state.content.questions);
  renderModeA();
}

function wireModeA() {
  document.querySelectorAll('#screen-a-ask [data-answer]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.sessionA = ModeA.answerCurrentQuestion(state.sessionA, btn.dataset.answer);
      renderModeA();
    });
  });

  $('btnAGiveUp').addEventListener('click', goHome);
  $('btnAGuessYes').addEventListener('click', () => {
    state.sessionA = ModeA.confirmGuess(state.sessionA, true);
    renderModeACorrect();
  });
  $('btnAGuessNo').addEventListener('click', () => {
    state.sessionA = ModeA.confirmGuess(state.sessionA, false);
    renderModeARevealAsk();
  });
  $('btnAPlayAgain').addEventListener('click', goHome);
  $('btnARevealPlayAgain').addEventListener('click', goHome);
}

function renderModeA() {
  const session = state.sessionA;
  if (session.phase === 'asking') {
    showScreen('screen-a-ask');
    $('aQuestionNumber').textContent = ModeA.questionsAskedCount(session) + 1;
    $('aQuestionText').textContent = session.currentQuestion.text;
    renderDebugPanelA(session);
  } else if (session.phase === 'guessing') {
    showScreen('screen-a-guess');
    $('aGuessCount').textContent = ModeA.questionsAskedCount(session);
    $('aGuessWord').textContent = session.lastGuess.concept.name;
  }
}

function renderModeACorrect() {
  const session = state.sessionA;
  showScreen('screen-a-correct');
  const concept = session.lastGuess.concept;
  $('aCorrectWord').textContent = concept.name;
  $('aCorrectDefinition').textContent = concept.definition;

  const evidence = ModeA.getEvidenceForWin(session, 5);
  const list = $('aEvidenceList');
  list.innerHTML = '';
  if (evidence.length === 0) {
    list.innerHTML = '<li>Gjettet på første forsøk!</li>';
  }
  for (const e of evidence) {
    const li = document.createElement('li');
    const tag = e.answer === 'yes' ? '✓' : e.answer === 'no' ? '✗' : '•';
    li.innerHTML = `<span class="tag">${tag}</span>${describeAnsweredQuestion(e.question, e.answer)}`;
    list.appendChild(li);
  }
}

function renderModeARevealAsk() {
  showScreen('screen-a-reveal-ask');
  const wrongGuessId = state.sessionA.lastGuess ? state.sessionA.lastGuess.concept.id : null;
  const grid = $('aConceptPicker');
  grid.innerHTML = '';
  for (const concept of state.content.concepts) {
    if (concept.id === wrongGuessId) continue;
    const btn = document.createElement('button');
    btn.className = 'concept-btn';
    btn.textContent = concept.name;
    btn.addEventListener('click', () => renderModeARevealResult(concept.id));
    grid.appendChild(btn);
  }
}

function renderModeARevealResult(actualConceptId) {
  const session = state.sessionA;
  const actual = state.content.concepts.find((c) => c.id === actualConceptId);
  showScreen('screen-a-reveal-result');
  $('aRevealWord').textContent = actual.name;
  $('aRevealDefinition').textContent = actual.definition;

  const diffs = ModeA.compareToActualConcept(session, actualConceptId);
  const list = $('aRevealMismatchList');
  const card = $('aRevealMismatchCard');
  list.innerHTML = '';
  if (diffs.length === 0) {
    card.hidden = true;
  } else {
    card.hidden = false;
    for (const d of diffs) {
      const li = document.createElement('li');
      li.className = 'mismatch';
      const truth = d.actualValue ? 'ja' : 'nei';
      li.textContent = `Du svarte «${ANSWER_LABELS[d.studentAnswer].toLowerCase()}» på «${d.question.text}» — for ${actual.name} er svaret egentlig «${truth}».`;
      list.appendChild(li);
    }
  }
}

function describeAnsweredQuestion(question, answer) {
  return `${question.text} (${ANSWER_LABELS[answer]})`;
}

function renderDebugPanelA(session) {
  const panel = $('debugPanelA');
  panel.hidden = !state.debugMode;
  if (!state.debugMode) return;

  const ranking = ModeA.debugRanking(session).slice(0, 10);
  const rows = ranking
    .map((r) => `<div class="debug-row"><span>${r.concept.name}</span><span>${r.confidence.toFixed(2)} (score ${r.score})</span></div>`)
    .join('');

  const next = session.currentQuestion
    ? `<div class="debug-next">Neste spørsmål: "${session.currentQuestion.text}" · information gain ≈ ${(session.debugNextQuestionGain ?? 0).toFixed(3)}</div>`
    : '';

  panel.innerHTML = `<h4>Debug — kandidatrangering</h4>${rows}${next}`;
}

/* =========================================================
   MODUS B
   ========================================================= */

function startModeB() {
  state.sessionB = ModeB.createModeB(state.content.concepts, state.content.questions);
  $('bCandidateList').hidden = true;
  $('btnBToggleCandidates').textContent = 'Vis mulige begreper';
  $('bFeedbackLine').hidden = true;
  $('bAnswerLog').innerHTML = '';
  renderModeB();
}

function wireModeB() {
  $('btnBGiveUp').addEventListener('click', goHome);
  $('btnBToggleCandidates').addEventListener('click', () => {
    const list = $('bCandidateList');
    list.hidden = !list.hidden;
    $('btnBToggleCandidates').textContent = list.hidden ? 'Vis mulige begreper' : 'Skjul mulige begreper';
    if (!list.hidden) renderCandidateChips(ModeB.remainingCandidates(state.sessionB));
  });
  $('btnBGuessNow').addEventListener('click', renderModeBGuessPicker);
  $('btnBCancelGuess').addEventListener('click', () => {
    showScreen('screen-b-ask');
  });
  $('btnBPlayAgain').addEventListener('click', goHome);
}

function renderModeB() {
  showScreen('screen-b-ask');
  const session = state.sessionB;

  $('bQuestionsAsked').textContent = ModeB.questionsAskedCount(session);
  const remaining = ModeB.remainingCandidates(session);
  $('bRemainingCount').textContent = remaining.length;

  const candidateList = $('bCandidateList');
  if (!candidateList.hidden) renderCandidateChips(remaining);

  const choices = $('bQuestionChoices');
  choices.innerHTML = '';
  const suggestions = ModeB.suggestedQuestions(session);
  if (suggestions.length === 0) {
    choices.innerHTML = '<p>Ingen flere spørsmål igjen — prøv å gjette!</p>';
  }
  for (const s of suggestions) {
    const btn = document.createElement('button');
    btn.className = 'question-choice';
    btn.textContent = s.question.text;
    btn.addEventListener('click', () => handleModeBQuestion(s.question.id));
    choices.appendChild(btn);
  }

  renderAnswerLog(session);
  renderDebugPanelB(session, suggestions[0]);
}

function renderCandidateChips(remaining) {
  const el = $('bCandidateList');
  el.innerHTML = remaining.map((c) => `<span class="candidate-chip">${c.name}</span>`).join('');
}

function handleModeBQuestion(questionId) {
  const entry = ModeB.askQuestion(state.sessionB, questionId);
  renderModeB();

  const feedback = $('bFeedbackLine');
  if (entry.before !== entry.after) {
    feedback.hidden = false;
    feedback.textContent = `Godt spørsmål! Det reduserte antall muligheter fra ${entry.before} til ${entry.after}.`;
  } else {
    feedback.hidden = false;
    feedback.textContent = `Svar: ${ANSWER_LABELS[entry.answer]}. Antall muligheter er fortsatt ${entry.after}.`;
  }
}

function renderAnswerLog(session) {
  const log = $('bAnswerLog');
  log.innerHTML = '';
  for (const entry of session.history) {
    const row = document.createElement('div');
    row.className = 'answer-log-row';
    row.innerHTML = `<span>${entry.question.text}</span><span class="answer-tag ${entry.answer}">${ANSWER_LABELS[entry.answer]}</span>`;
    log.appendChild(row);
  }
}

function renderModeBGuessPicker() {
  showScreen('screen-b-guess-picker');
  const grid = $('bConceptPicker');
  grid.innerHTML = '';
  for (const concept of state.content.concepts) {
    const btn = document.createElement('button');
    btn.className = 'concept-btn';
    btn.textContent = concept.name;
    btn.addEventListener('click', () => finishModeB(concept.id));
    grid.appendChild(btn);
  }
}

function finishModeB(conceptId) {
  const session = state.sessionB;
  const correct = ModeB.guess(session, conceptId);
  showScreen('screen-b-result');
  $('bResultEmoji').textContent = correct ? '🎉' : '😅';
  $('bResultTitle').textContent = correct ? 'Riktig!' : 'Ikke helt — det hemmelige begrepet var:';
  $('bResultWord').textContent = session.secret.name;
  $('bResultDefinition').textContent = session.secret.definition;
  $('bResultMeta').textContent = `Du brukte ${ModeB.questionsAskedCount(session)} spørsmål.`;
}

function renderDebugPanelB(session, topSuggestion) {
  const panel = $('debugPanelB');
  panel.hidden = !state.debugMode;
  if (!state.debugMode) return;

  const remaining = ModeB.remainingCandidates(session);
  const rows = remaining
    .slice(0, 12)
    .map((c) => `<div class="debug-row"><span>${c.name}</span><span>${c.id === session.secret.id ? '★ hemmelig' : 'konsistent'}</span></div>`)
    .join('');

  const next = topSuggestion
    ? `<div class="debug-next">Best neste spørsmål: "${topSuggestion.question.text}" · information gain ≈ ${topSuggestion.gain.toFixed(3)}</div>`
    : '';

  panel.innerHTML = `<h4>Debug — konsistente kandidater</h4>${rows}${next}`;
}
