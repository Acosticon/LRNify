// ============================================================
// Myldrespill – Game Engine
// ============================================================

const Game = (() => {
  // ── State ──────────────────────────────────────────────────
  let config = null;
  let items = [];
  let queue = [];
  let current = null;
  let score = 0;
  let total = 0;
  let difficulty = 'easy';
  let answered = false;

  // ── DOM refs ───────────────────────────────────────────────
  const screens = {
    start:    document.getElementById('screen-start'),
    game:     document.getElementById('screen-game'),
    result:   document.getElementById('screen-result'),
  };

  const els = {
    themeName:      document.getElementById('theme-name'),
    sceneWrap:      document.getElementById('scene-wrap'),
    question:       document.getElementById('question-text'),
    choices:        document.getElementById('choices'),
    feedback:       document.getElementById('feedback'),
    progress:       document.getElementById('progress'),
    progressBar:    document.getElementById('progress-bar'),
    scoreFinal:     document.getElementById('score-final'),
    scoreMessage:   document.getElementById('score-message'),
    btnEasy:        document.getElementById('btn-easy'),
    btnHard:        document.getElementById('btn-hard'),
    btnRestart:     document.getElementById('btn-restart'),
    btnPlayAgain:   document.getElementById('btn-play-again'),
    hotspotLayer:   document.getElementById('hotspot-layer'),
  };

  // ── Load theme ─────────────────────────────────────────────
  async function loadTheme(themeDir) {
    const res = await fetch(`${themeDir}/config.json`);
    config = await res.json();
    items = config.items;
    document.title = config.theme + ' – Myldrespill';
    els.themeName.textContent = config.theme;

    // Load SVG into scene
    const svgRes = await fetch(`${themeDir}/${config.scene}`);
    const svgText = await svgRes.text();
    els.sceneWrap.innerHTML = svgText;

    // Ensure SVG scales responsively
    const svg = els.sceneWrap.querySelector('svg');
    if (svg) {
      svg.setAttribute('width', '100%');
      svg.removeAttribute('height');
    }

    buildHotspots();
  }

  // ── Hotspots (visual-only markers for now, clickable later) ─
  function buildHotspots() {
    // We'll overlay hotspot pins after the SVG using a positioned layer
    // The SVG viewBox is 720×460; we scale relative to that
    const svg = els.sceneWrap.querySelector('svg');
    if (!svg) return;

    // Clear any existing
    const existing = els.sceneWrap.querySelectorAll('.hotspot-pin');
    existing.forEach(e => e.remove());

    items.forEach(item => {
      const pin = document.createElement('div');
      pin.className = 'hotspot-pin';
      pin.dataset.id = item.id;
      pin.setAttribute('aria-hidden', 'true');

      // Position as percentage of 720×460
      const px = (item.hotspot.x / 720) * 100;
      const py = (item.hotspot.y / 460) * 100;
      pin.style.left = `${px}%`;
      pin.style.top = `${py}%`;
      pin.textContent = '📍';

      els.sceneWrap.style.position = 'relative';
      els.sceneWrap.appendChild(pin);
    });
  }

  // ── Highlight active hotspot ───────────────────────────────
  function highlightHotspot(id) {
    els.sceneWrap.querySelectorAll('.hotspot-pin').forEach(pin => {
      pin.classList.toggle('active', pin.dataset.id === id);
    });
  }

  // ── Build question queue ───────────────────────────────────
  function buildQueue() {
    queue = shuffle([...items]);
    score = 0;
    total = queue.length;
    answered = false;
  }

  // ── Start game ─────────────────────────────────────────────
  function startGame(diff) {
    difficulty = diff;
    buildQueue();
    showScreen('game');
    nextQuestion();
  }

  // ── Next question ──────────────────────────────────────────
  function nextQuestion() {
    answered = false;
    els.feedback.textContent = '';
    els.feedback.className = 'feedback';

    if (queue.length === 0) {
      endGame();
      return;
    }

    current = queue.pop();
    const done = total - queue.length;

    // Progress
    els.progress.textContent = `${done} / ${total}`;
    els.progressBar.style.width = `${((done - 1) / total) * 100}%`;

    // Question text
    const q = current.questions[difficulty];
    els.question.textContent = difficulty === 'easy' ? q : q;

    // Highlight hotspot
    highlightHotspot(current.id);

    // Build choices
    const options = buildOptions(current);
    els.choices.innerHTML = '';
    options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = opt;
      btn.dataset.value = opt;
      btn.setAttribute('aria-label', opt);
      btn.addEventListener('click', () => handleChoice(btn, opt));

      // Keyboard: 1–4
      const label = document.createElement('span');
      label.className = 'key-hint';
      label.textContent = i + 1;
      btn.prepend(label);

      els.choices.appendChild(btn);
    });

    // Focus first button
    const firstBtn = els.choices.querySelector('.choice-btn');
    if (firstBtn) firstBtn.focus();
  }

  // ── Build options (1 correct + distractors) ───────────────
  function buildOptions(item) {
    const pool = [...item.distractors];
    // Shuffle and pick 3 distractors
    const chosen = shuffle(pool).slice(0, 3);
    chosen.push(item.correct);
    return shuffle(chosen);
  }

  // ── Handle answer ──────────────────────────────────────────
  function handleChoice(btn, value) {
    if (answered) return;
    answered = true;

    const correct = value === current.correct;

    // Disable all buttons
    const allBtns = els.choices.querySelectorAll('.choice-btn');
    allBtns.forEach(b => {
      b.disabled = true;
      if (b.dataset.value === current.correct) {
        b.classList.add('correct');
      } else if (b === btn && !correct) {
        b.classList.add('wrong');
      }
    });

    if (correct) {
      score++;
      els.feedback.textContent = getPositiveFeedback();
      els.feedback.className = 'feedback correct';
    } else {
      els.feedback.textContent = `✗ Riktig svar: ${current.correct}`;
      els.feedback.className = 'feedback wrong';
    }

    // Update progress bar to current
    els.progressBar.style.width = `${((total - queue.length) / total) * 100}%`;

    // Auto-advance after delay
    setTimeout(nextQuestion, 1600);
  }

  // ── Positive feedback pool ─────────────────────────────────
  function getPositiveFeedback() {
    const msgs = ['✓ Riktig!', '✓ Bra!', '✓ Flott!', '✓ Perfecto!', '✓ Muy bien!'];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }

  // ── End game ───────────────────────────────────────────────
  function endGame() {
    showScreen('result');
    const pct = Math.round((score / total) * 100);
    els.scoreFinal.textContent = `${score} / ${total}`;

    let msg = '';
    if (pct === 100)      msg = '🏆 Perfecto! Du kan alt!';
    else if (pct >= 75)   msg = '🌟 Muy bien! Nesten perfekt!';
    else if (pct >= 50)   msg = '👍 Bra innsats! Øv litt mer.';
    else                   msg = '📚 Fortsett å øve – det lønner seg!';

    els.scoreMessage.textContent = msg;
  }

  // ── Screen switching ───────────────────────────────────────
  function showScreen(name) {
    Object.entries(screens).forEach(([k, el]) => {
      el.hidden = (k !== name);
    });
  }

  // ── Keyboard shortcuts (1–4) ───────────────────────────────
  function initKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (screens.game.hidden) return;
      const n = parseInt(e.key);
      if (n >= 1 && n <= 4) {
        const btns = els.choices.querySelectorAll('.choice-btn:not([disabled])');
        if (btns[n - 1]) btns[n - 1].click();
      }
    });
  }

  // ── Difficulty buttons ─────────────────────────────────────
  function initDifficultyButtons() {
    els.btnEasy.addEventListener('click', () => startGame('easy'));
    els.btnHard.addEventListener('click', () => startGame('hard'));
  }

  // ── Restart buttons ────────────────────────────────────────
  function initRestartButtons() {
    els.btnRestart.addEventListener('click', () => showScreen('start'));
    els.btnPlayAgain.addEventListener('click', () => showScreen('start'));
  }

  // ── Utilities ──────────────────────────────────────────────
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ── Init ───────────────────────────────────────────────────
  async function init(themeDir) {
    await loadTheme(themeDir);
    initKeyboard();
    initDifficultyButtons();
    initRestartButtons();
    showScreen('start');
  }

  return { init };
})();

// Boot – theme is passed from index.html
document.addEventListener('DOMContentLoaded', () => {
  const theme = window.MYLDRESPILL_THEME || 'themes/es-ciudad';
  Game.init(theme);
});
