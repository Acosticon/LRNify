/* =========================================================
   OPPKOBLING — binder spillogikk, lyd og effekter til DOM.
   ========================================================= */

import { Dictionary, upper } from './dictionary.js';
import { Sfx } from './audio.js';
import { Fx } from './fx.js';
import { Game, MODES, POWERS, comboProgress } from './game.js';

const $ = (id) => document.getElementById(id);

/* ---------------- DOM ---------------- */
const screens   = { start: $('screen-start'), game: $('screen-game'), end: $('screen-end') };
const modeList  = $('modeList'), startBest = $('startBest');
const startBtn  = $('startBtn'), restartBtn = $('restartBtn'), menuBtn = $('menuBtn');
const soundBtn  = $('soundBtn'), muteBtn = $('muteBtn');
const hintBtn   = $('hintBtn'), hintsLeftEl = $('hintsLeft');
const wordForm  = $('wordForm'), wordInput = $('wordInput'), addBtn = $('addBtn');
const msgEl     = $('msg'), chainEl = $('chain'), endChainEl = $('endChain');
const scoreVal  = $('scoreVal'), levelVal = $('levelVal');
const livesBox  = $('livesBox'), livesVal = $('livesVal');
const heatBox   = $('heatBox'), heatFill = $('heatFill'), timeVal = $('timeVal');
const comboWrap = $('comboWrap'), comboLabel = $('comboLabel'), comboFill = $('comboFill');
const powerupsEl = $('powerups');
const previewEl = $('preview'), previewText = $('previewText'), previewPoints = $('previewPoints');
const powerFill = $('powerFill');
const vignette  = $('vignette');
const mascot    = $('mascot'), eyeL = $('eyeL'), eyeR = $('eyeR'), mouth = $('mouth');

/* ---------------- kjerne ---------------- */
const dict = new Dictionary();
const sfx  = new Sfx();
const fx   = new Fx($('bgCanvas'), $('fxCanvas'), $('shakeWrap'));
const game = new Game(dict, handleEvent);

let selectedMode = 'klassisk';
let shownScore = 0;

const PRAISE = ['Nydelig!','Sterkt!','Smidig!','Perfekt!','Der satt den!','Rått!','Skarpt!','Glødende!'];
const BIG_PRAISE = ['DU BRENNER!','USTOPPELIG!','FANTASTISK!','MESTERSMED!'];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* =========================================================
   REKORDER (localStorage – bare tall, ingen persondata)
   ========================================================= */
const STORE_KEY = 'okv-arkade-best-v1';

function loadBest(){
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch(e){ return {}; }
}
function saveBest(data){
  try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch(e){ /* privat modus */ }
}
function bestFor(modeId){
  const all = loadBest();
  return all[modeId] || { score: 0, words: 0 };
}
function recordBest(modeId, score, words){
  const all = loadBest();
  const prev = all[modeId] || { score: 0, words: 0 };
  const isNew = score > prev.score;
  all[modeId] = { score: Math.max(prev.score, score), words: Math.max(prev.words, words) };
  saveBest(all);
  return isNew;
}

/* =========================================================
   MASKOT
   ========================================================= */
const MOODS = {
  idle:  { r:4,   d:'M 26 42 Q 32 46 38 42' },
  happy: { r:2.6, d:'M 24 40 Q 32 51 40 40' },
  wow:   { r:5.6, d:'M 27 42 Q 32 37 37 42 Q 32 52 27 42' },
  sad:   { r:3.6, d:'M 25 47 Q 32 40 39 47' }
};
let moodTimer = null;
function setMood(name, holdMs){
  const m = MOODS[name] || MOODS.idle;
  eyeL.setAttribute('ry', m.r);
  eyeR.setAttribute('ry', m.r);
  mouth.setAttribute('d', m.d);
  mascot.classList.remove('react');
  void mascot.offsetWidth;
  mascot.classList.add('react');
  clearTimeout(moodTimer);
  if(holdMs) moodTimer = setTimeout(() => setMood('idle'), holdMs);
}

/* =========================================================
   SKJERMER
   ========================================================= */
function showScreen(name){
  Object.keys(screens).forEach(k => screens[k].classList.toggle('active', k === name));
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function makeLink(word, isCurrent, animate, golden){
  const el = document.createElement('span');
  el.className = 'link'
    + (isCurrent ? ' current' : '')
    + (animate ? ' pop' : '')
    + (golden ? ' golden' : '');
  el.setAttribute('role', 'listitem');
  el.innerHTML = escapeHtml(word.slice(0, -1))
    + '<span class="hl">' + escapeHtml(word.slice(-1)) + '</span>';
  return el;
}

function renderChain(animateLast){
  chainEl.innerHTML = '';
  game.chain.forEach((word, i) => {
    const isCurrent = i === game.chain.length - 1;
    if(i > 0){
      const c = document.createElement('span');
      c.className = 'connector';
      c.setAttribute('aria-hidden', 'true');
      chainEl.appendChild(c);
    }
    chainEl.appendChild(makeLink(word, isCurrent, animateLast && isCurrent, isCurrent && game.goldenActive));
  });
  chainEl.scrollLeft = chainEl.scrollWidth;
}

function animateScore(){
  if(shownScore === game.score){ scoreVal.textContent = String(game.score); return; }
  const from = shownScore, diff = game.score - from, t0 = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - t0) / 340);
    shownScore = Math.round(from + diff * (1 - Math.pow(1 - p, 3)));
    scoreVal.textContent = String(shownScore);
    if(p < 1) requestAnimationFrame(step);
    else shownScore = game.score;
  };
  requestAnimationFrame(step);
}

function updateTimerUI(timeLeft, frozen){
  if(!game.hasTimer()) return;
  const pct = Math.max(0, Math.min(100, (timeLeft / game.mode.maxTime) * 100));
  heatFill.style.width = pct + '%';
  const low = timeLeft <= 5 && !frozen;
  heatFill.classList.toggle('low', low);
  heatFill.classList.toggle('frozen', !!frozen);
  timeVal.classList.toggle('low', low);
  vignette.classList.toggle('on', low && game.running);
  timeVal.textContent = Math.ceil(timeLeft);
}

function updateComboUI(){
  const { mult, pct, maxed } = comboProgress(game.streak);
  comboWrap.classList.toggle('on', game.streak > 0);
  comboWrap.classList.toggle('maxed', maxed);
  comboLabel.textContent = (maxed ? 'MAKS KOMBO ×' : 'KOMBO ×') + mult;
  comboFill.style.width = (maxed ? 100 : pct) + '%';
}

function updateLivesUI(){
  if(game.mode.lives <= 0){ livesBox.hidden = true; return; }
  livesBox.hidden = false;
  livesVal.textContent = '♥'.repeat(Math.max(0, game.lives)) || '–';
}

function renderPowerups(){
  powerupsEl.innerHTML = '';
  Object.keys(POWERS).forEach(type => {
    const count = game.powers[type];
    if(!count) return;
    const p = POWERS[type];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pu';
    btn.dataset.power = type;
    btn.title = p.hint;
    btn.setAttribute('aria-label', `${p.name}: ${p.hint}. ${count} igjen`);
    btn.innerHTML = `<span class="pi" aria-hidden="true">${p.icon}</span>`
      + `<span>${p.name}</span><span class="pc">×${count}</span>`;
    btn.disabled = !game.canUsePower(type);
    btn.addEventListener('click', () => {
      if(game.usePower(type)) { wordInput.focus(); }
    });
    powerupsEl.appendChild(btn);
  });
}

function updatePrompt(){
  const letter = upper(game.requiredLetter);
  wordInput.placeholder = `Ord som starter med «${letter}» …`;
  wordInput.setAttribute('aria-label', 'Skriv et ord som starter med ' + letter);
}

function setMsg(text, kind){
  msgEl.className = kind || '';
  msgEl.textContent = text || '';
}

function setBusy(busy){
  wordInput.disabled = busy;
  addBtn.disabled = busy;
  hintBtn.disabled = busy || game.hintsLeft <= 0;
  powerupsEl.querySelectorAll('.pu').forEach(b => {
    b.disabled = busy || !game.canUsePower(b.dataset.power);
  });
  if(!busy) wordInput.focus();
}

/* ---------- live tilbakemelding mens man skriver ---------- */
function updatePreview(){
  if(!game.running){ return; }
  const raw = wordInput.value;
  const res = game.evaluate(raw);
  previewEl.className = 'preview';
  previewPoints.textContent = '';

  if(res.state === 'empty'){
    previewText.textContent = game.goldenActive
      ? `GYLLEN BOKSTAV «${upper(game.requiredLetter)}» – tredobbel uttelling!`
      : `Starter med «${upper(game.requiredLetter)}»`;
    powerFill.style.width = '0%';
    return;
  }

  powerFill.style.width = Math.min(100, (res.word.length / 14) * 100) + '%';

  if(res.state === 'wrongletter' || res.state === 'used' || res.state === 'invalid'){
    previewEl.classList.add('bad');
    previewText.textContent = res.message;
    return;
  }

  const pts = game.previewPoints(res.word);
  if(res.state === 'known'){
    previewEl.classList.add('good');
    previewText.textContent = `${res.word.length} bokstaver · klart til smiing`;
  } else {
    previewText.textContent = `${res.word.length} bokstaver · sjekkes mot ordboka`;
  }
  previewPoints.textContent = `+${pts}`;
}

/* ---------- posisjon for effekter ---------- */
function chainTipPos(){
  const cur = chainEl.querySelector('.link.current');
  const rect = cur ? cur.getBoundingClientRect() : chainEl.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/* =========================================================
   HENDELSER FRA SPILLET
   ========================================================= */
function handleEvent(type, data){
  switch(type){

    case 'start': {
      shownScore = 0;
      scoreVal.textContent = '0';
      levelVal.textContent = '1';
      hintsLeftEl.textContent = String(game.hintsLeft);
      heatBox.hidden = !game.hasTimer();
      updateLivesUI();
      updateComboUI();
      renderPowerups();
      renderChain(false);
      updatePrompt();
      if(game.hasTimer()) updateTimerUI(game.timeLeft, false);
      vignette.classList.remove('on');
      setMsg(game.mode.id === 'maraton' ? 'Ingen klokke – men pass på livene!' : 'Smi i vei!', 'info');
      setMood('idle');
      setBusy(false);
      wordInput.value = '';
      updatePreview();
      showScreen('game');
      wordInput.focus();
      break;
    }

    case 'tick':
      updateTimerUI(data.timeLeft, data.frozen);
      break;

    case 'lowtime':
      sfx.lowTick();
      break;

    case 'accept': {
      const pos = chainTipPos();
      renderChain(true);
      animateScore();
      updateComboUI();
      updatePrompt();
      renderPowerups();
      if(game.hasTimer()) updateTimerUI(game.timeLeft, performance.now() < game.freezeUntil);

      const big = data.mult >= 3 || data.golden || data.double;
      fx.burst(pos.x, pos.y, data.golden ? 30 : (big ? 20 : 11),
               data.golden ? { colors:['#ffd700','#fff3a0','#ffb300'], speed: 320 } : {});
      if(big) fx.ring(pos.x, pos.y, data.golden ? '#ffd700' : '#ff8a2b');
      fx.popup('+' + data.gained,
               pos.x + (Math.random() - .5) * 40,
               pos.y - 18,
               { color: data.golden ? '#ffd700' : (data.mult > 1 ? '#c9a3ff' : '#ffd23f'),
                 size: data.golden ? 34 : (big ? 30 : 25) });
      if(data.golden){ fx.doShake(9); sfx.golden(); }
      else if(!big) sfx.correct(data.mult);

      let praise = pick(PRAISE);
      let kind = 'ok';
      if(data.golden){ praise = 'GYLLENT TREFF! ×3'; kind = 'gold'; }
      else if(data.double){ praise = 'DOBBELT OPP!'; }
      setMsg(praise, kind);
      setMood(big ? 'wow' : 'happy', 800);

      wordInput.value = '';
      updatePreview();
      break;
    }

    case 'comboup': {
      const pos = chainTipPos();
      sfx.combo(data.mult);
      fx.doShake(6 + data.mult * 2);
      fx.popup('KOMBO ×' + data.mult, window.innerWidth / 2, window.innerHeight * 0.3,
               { color:'#ffd23f', size: 40, life: 1, vy: -30 });
      fx.ring(pos.x, pos.y, '#a06bff', 180);
      setMsg(pick(BIG_PRAISE), 'ok');
      setMood('wow', 900);
      break;
    }

    case 'levelup': {
      levelVal.textContent = String(data.level);
      sfx.level();
      fx.doShake(12);
      fx.popup('NIVÅ ' + data.level + '!', window.innerWidth / 2, window.innerHeight * 0.3,
               { color:'#3ddbd9', size: 44, life: 1.1, vy: -26 });
      setMsg(game.hasTimer()
        ? `Nivå ${data.level} – tiden brenner raskere!`
        : `Nivå ${data.level}!`, 'ok');
      setMood('wow', 900);
      break;
    }

    case 'golden': {
      renderChain(false);
      updatePreview();
      sfx.golden();
      const pos = chainTipPos();
      fx.ring(pos.x, pos.y, '#ffd700', 150);
      fx.burst(pos.x, pos.y, 14, { colors:['#ffd700','#fff3a0'], speed: 200 });
      setMsg(`GYLLEN BOKSTAV «${upper(data.letter)}» – neste ord gir ×3!`, 'gold');
      break;
    }

    case 'power': {
      renderPowerups();
      sfx.power();
      const p = POWERS[data.type];
      fx.popup(p.icon + ' ' + p.name.toUpperCase(), window.innerWidth / 2, window.innerHeight * 0.38,
               { color:'#a06bff', size: 28, life: .9 });
      break;
    }

    case 'usepower': {
      renderPowerups();
      updatePrompt();
      updatePreview();
      if(data.type === 'freeze'){
        sfx.freeze();
        setMsg('❄️ Klokka er frosset i 5 sekunder!', 'info');
        updateTimerUI(game.timeLeft, true);
      } else if(data.type === 'double'){
        sfx.power();
        setMsg('⚡ Neste ord teller dobbelt!', 'info');
      } else {
        sfx.power();
        renderChain(false);
        setMsg(`🔄 Byttet til bokstaven «${upper(data.requiredLetter)}»`, 'info');
      }
      break;
    }

    case 'reject': {
      updateComboUI();
      updateLivesUI();
      renderPowerups();
      sfx.error();
      if(data.lostLife){
        sfx.life();
        fx.doShake(14);
        fx.popup('−1 ♥', window.innerWidth / 2, window.innerHeight * 0.34,
                 { color:'#ff6b6b', size: 32, life: .9 });
      }
      setMsg(data.message, 'bad');
      setMood('sad', 800);
      wordInput.classList.remove('shake');
      void wordInput.offsetWidth;          // tvinger reflow så risting kan spilles på nytt
      wordInput.classList.add('shake');
      wordInput.value = '';
      updatePreview();
      break;
    }

    case 'checking':
      setBusy(true);
      setMsg('Sjekker ordet i ordboka …', 'info');
      break;

    case 'checked':
      setBusy(false);
      break;

    case 'hint': {
      hintsLeftEl.textContent = String(data.hintsLeft);
      hintBtn.disabled = data.hintsLeft <= 0;
      sfx.hint();
      if(game.hasTimer()) updateTimerUI(game.timeLeft, false);
      setMsg(`Prøv for eksempel: ${data.word.slice(0, 2)}…  (${data.word.length} bokstaver)`, 'info');
      break;
    }

    case 'end':
      showEnd(data);
      break;
  }
}

/* =========================================================
   SLUTTSKJERM
   ========================================================= */
function showEnd(d){
  vignette.classList.remove('on');
  fx.clear();

  const isNewBest = recordBest(d.mode.id, d.score, d.words);
  isNewBest ? sfx.win() : sfx.over();

  $('endScore').textContent = String(d.score);
  $('endWords').textContent = String(d.words);
  $('endCombo').textContent = '×' + d.bestCombo;
  $('endLongest').textContent = d.longest || '–';
  $('endLevel').textContent = String(d.level);

  let rank = 'Ordlærling';
  if(d.score >= 1400) rank = 'Ordkjede-legende';
  else if(d.score >= 800) rank = 'Ordmester';
  else if(d.score >= 400) rank = 'Ordsmed';
  else if(d.score >= 150) rank = 'Ordsvenn';
  $('rankTitle').textContent = rank;

  endChainEl.innerHTML = '';
  d.chain.forEach(w => endChainEl.appendChild(makeLink(w, false, false, false)));

  const best = bestFor(d.mode.id);
  const line = $('bestLine');
  line.className = 'best-line' + (isNewBest ? ' new' : '');
  line.textContent = isNewBest
    ? `🏆 Ny rekord i ${d.mode.name}: ${best.score} poeng`
    : `Rekord i ${d.mode.name}: ${best.score} poeng`;

  showScreen('end');

  if(isNewBest){
    fx.popup('NY REKORD!', window.innerWidth / 2, window.innerHeight * 0.24,
             { color:'#ffd700', size: 40, life: 1.4, vy: -18 });
    fx.burst(window.innerWidth / 2, window.innerHeight * 0.3, 46,
             { colors:['#ffd700','#fff3a0','#ff8a2b'], speed: 400 });
    fx.doShake(10);
  }
  restartBtn.focus();
}

/* =========================================================
   MODUSVALG
   ========================================================= */
function renderModes(){
  modeList.innerHTML = '';
  Object.values(MODES).forEach(m => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mode-card';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', String(m.id === selectedMode));
    btn.innerHTML = `<span class="mi" aria-hidden="true">${m.icon}</span>`
      + `<span class="mt"><span class="mname">${m.name}</span>`
      + `<span class="mdesc">${m.desc}</span></span>`;
    btn.addEventListener('click', () => {
      selectedMode = m.id;
      renderModes();
      updateStartBest();
      sfx.unlock();
      sfx.hint();
    });
    modeList.appendChild(btn);
  });
}

function updateStartBest(){
  const b = bestFor(selectedMode);
  startBest.innerHTML = b.score > 0
    ? `Din rekord i ${MODES[selectedMode].name}: <b>${b.score}</b> poeng · ${b.words} ord`
    : 'Ingen rekord ennå – på tide å smi!';
}

function updateStartAvailability(){
  const loading = dict.status === 'loading';
  startBtn.disabled = loading;
  startBtn.textContent = loading ? 'LASTER …' : 'START';
}

/* =========================================================
   LYD AV/PÅ
   ========================================================= */
function setSound(on){
  sfx.setEnabled(on);
  soundBtn.setAttribute('aria-pressed', String(on));
  soundBtn.textContent = on ? '🔊 Lyd på' : '🔇 Lyd av';
  muteBtn.setAttribute('aria-pressed', String(on));
  muteBtn.textContent = on ? '🔊' : '🔇';
}

/* =========================================================
   OPPSTART
   ========================================================= */
wordForm.addEventListener('submit', (e) => {
  e.preventDefault();
  sfx.unlock();
  game.submit(wordInput.value);
});
wordInput.addEventListener('input', updatePreview);

startBtn.addEventListener('click', () => { sfx.unlock(); game.start(selectedMode); });
restartBtn.addEventListener('click', () => { sfx.unlock(); game.start(game.mode.id); });
menuBtn.addEventListener('click', () => {
  selectedMode = game.mode.id;
  renderModes();
  updateStartBest();
  showScreen('start');
});
hintBtn.addEventListener('click', () => {
  sfx.unlock();
  if(!game.useHint()) setMsg('Fant ingen hint denne gangen …', 'info');
});
soundBtn.addEventListener('click', () => setSound(!sfx.enabled));
muteBtn.addEventListener('click', () => setSound(!sfx.enabled));

// Tallhurtigtaster for kraftbonuser (1–3)
document.addEventListener('keydown', (e) => {
  if(!game.running || !screens.game.classList.contains('active')) return;
  if(e.key >= '1' && e.key <= '3' && wordInput.value === ''){
    const types = Object.keys(POWERS).filter(t => game.powers[t] > 0);
    const t = types[Number(e.key) - 1];
    if(t){ e.preventDefault(); game.usePower(t); wordInput.focus(); }
  }
});

setSound(true);
setMood('idle');
renderModes();
updateStartBest();
updateStartAvailability();
fx.setAmbient(true);
fx.start();

dict.load().then(() => updateStartAvailability());
