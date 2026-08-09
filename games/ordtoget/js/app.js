/* =========================================================
   FELLES SPILLAPP
   Samme logikk driver både mobil- og PC-versjonen. Forskjellene
   ligger i markup, CSS og et lite «layout»-objekt som håndterer
   det som faktisk skiller enhetene (haptikk, skjermtastatur,
   tastatursnarveier).
   ========================================================= */

import { Dictionary, upper } from './dictionary.js';
import { Sfx } from './audio.js';
import { Fx } from './fx.js';
import { Game, MODES, POWERS, comboProgress } from './game.js';
import { Progress } from './progress.js';
import {
  DEPOT_SLOTS, LOCO, GOLD, CARRIAGE_BY_ID,
  pickCarriage, buildCarriage, buildCoupling
} from './carriages.js';

const PRAISE = ['Nydelig!', 'Sterkt!', 'Perfekt!', 'Der satt den!', 'Rått!', 'Skarpt!', 'På skinner!'];
const BIG_PRAISE = ['FULL FART!', 'USTOPPELIG!', 'FANTASTISK!', 'FYR PÅ KJELEN!'];
const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function createApp(layout = {}){
  const $ = (id) => document.getElementById(id);
  const els = new Proxy({}, { get: (_, id) => $(String(id)) });

  const dict = new Dictionary();
  const sfx = new Sfx();
  const fx = new Fx($('bgCanvas'), $('fxCanvas'), $('shakeWrap'));
  const progress = new Progress();
  const game = new Game(dict, handleEvent);

  let selectedMode = 'klassisk';
  let shownScore = 0;
  let carriageTypes = [];      // vogntype per ord – låst når vogna kobles på
  let steamTimer = null;
  let toastTimer = null;

  const haptic = (pattern) => {
    if(!layout.haptics) return;
    try { navigator.vibrate && navigator.vibrate(pattern); } catch(e){ /* ignorer */ }
  };

  /* ---------------- skjermer ---------------- */
  function showScreen(name){
    ['screen-start', 'screen-game', 'screen-end'].forEach(id => {
      const el = $(id);
      if(el) el.classList.toggle('active', id === 'screen-' + name);
    });
    if(layout.onScreen) layout.onScreen(name);
  }

  /* ---------------- toget ---------------- */
  function renderTrain(container, words, types, opts = {}){
    if(!container) return;
    container.innerHTML = '';
    words.forEach((word, i) => {
      if(i > 0) container.appendChild(buildCoupling());
      const isLast = i === words.length - 1;
      container.appendChild(buildCarriage(word, types[i] || 'freight', {
        current: isLast && opts.markCurrent !== false,
        animate: opts.animateLast && isLast
      }));
    });
    container.scrollLeft = container.scrollWidth;
  }

  function refreshTrain(animateLast){
    renderTrain(els.train, game.chain, carriageTypes, { animateLast });
  }

  /** Damp fra pipa så lenge lokomotivet er synlig. */
  function startSteam(){
    stopSteam();
    steamTimer = setInterval(() => {
      if(!game.running || !els.train) return;
      const chimney = els.train.querySelector('.type-loco .chimney');
      if(!chimney) return;
      // Toget ruller mot venstre etter hvert som det vokser. Damp bare
      // når pipa faktisk er innenfor den synlige delen av sporet.
      const r = chimney.getBoundingClientRect();
      const area = els.train.getBoundingClientRect();
      if(r.left < area.left || r.right > area.right) return;
      fx.steam(r.left + r.width / 2, r.top, 3);
    }, 1500);
  }
  function stopSteam(){
    if(steamTimer){ clearInterval(steamTimer); steamTimer = null; }
  }

  /* ---------------- HUD ---------------- */
  function animateScore(){
    if(!els.scoreVal) return;
    if(shownScore === game.score){ els.scoreVal.textContent = String(game.score); return; }
    const from = shownScore, diff = game.score - from, t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / 340);
      shownScore = Math.round(from + diff * (1 - Math.pow(1 - p, 3)));
      els.scoreVal.textContent = String(shownScore);
      if(p < 1) requestAnimationFrame(step);
      else shownScore = game.score;
    };
    requestAnimationFrame(step);
  }

  function updateTimerUI(timeLeft, frozen){
    if(!game.hasTimer() || !els.heatFill) return;
    const pct = Math.max(0, Math.min(100, (timeLeft / game.mode.maxTime) * 100));
    els.heatFill.style.width = pct + '%';
    const low = timeLeft <= 5 && !frozen;
    els.heatFill.classList.toggle('low', low);
    els.heatFill.classList.toggle('frozen', !!frozen);
    if(els.timeVal){
      els.timeVal.classList.toggle('low', low);
      els.timeVal.textContent = Math.ceil(timeLeft);
    }
    if(els.vignette) els.vignette.classList.toggle('on', low && game.running);
  }

  function updateComboUI(){
    if(!els.comboWrap) return;
    const { mult, pct, maxed } = comboProgress(game.streak);
    els.comboWrap.classList.toggle('on', game.streak > 0);
    els.comboWrap.classList.toggle('maxed', maxed);
    if(els.comboLabel) els.comboLabel.textContent = (maxed ? 'MAKS KOMBO ×' : 'KOMBO ×') + mult;
    if(els.comboFill) els.comboFill.style.width = (maxed ? 100 : pct) + '%';
  }

  function updateLivesUI(){
    if(!els.livesBox) return;
    if(game.mode.lives <= 0){ els.livesBox.hidden = true; return; }
    els.livesBox.hidden = false;
    if(els.livesVal) els.livesVal.textContent = '♥'.repeat(Math.max(0, game.lives)) || '–';
  }

  function renderPowerups(){
    if(!els.powerups) return;
    els.powerups.innerHTML = '';
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
      btn.innerHTML = `<span aria-hidden="true">${p.icon}</span>`
        + `<span class="pn">${p.name}</span><span class="pc">×${count}</span>`;
      btn.disabled = !game.canUsePower(type);
      btn.addEventListener('click', () => {
        if(game.usePower(type)){ haptic(12); focusInput(); }
      });
      els.powerups.appendChild(btn);
    });
  }

  function setSignal(state){
    if(els.signal) els.signal.dataset.state = state;
  }

  function setMsg(text, kind){
    if(!els.msg) return;
    els.msg.className = 'msg ' + (kind || '');
    els.msg.textContent = text || '';
  }

  function updatePrompt(){
    if(!els.wordInput) return;
    const letter = upper(game.requiredLetter);
    els.wordInput.placeholder = layout.shortPlaceholder
      ? `Ord på «${letter}» …`
      : `Ord som starter med «${letter}» …`;
    els.wordInput.setAttribute('aria-label', 'Skriv et ord som starter med ' + letter);
    if(els.nextLetter) els.nextLetter.textContent = letter;
    if(els.nextLetterBox) els.nextLetterBox.classList.toggle('golden', game.goldenActive);
  }

  function setBusy(busy){
    if(els.wordInput) els.wordInput.disabled = busy;
    if(els.addBtn) els.addBtn.disabled = busy;
    if(els.hintBtn) els.hintBtn.disabled = busy || game.hintsLeft <= 0;
    if(els.powerups){
      els.powerups.querySelectorAll('.pu').forEach(b => {
        b.disabled = busy || !game.canUsePower(b.dataset.power);
      });
    }
    if(!busy) focusInput();
  }

  function focusInput(){
    if(els.wordInput && !els.wordInput.disabled) els.wordInput.focus();
  }

  /* ---------------- live forhåndsvisning ---------------- */
  function updatePreview(){
    if(!game.running || !els.previewText) return;
    const res = game.evaluate(els.wordInput ? els.wordInput.value : '');
    if(els.preview) els.preview.className = 'preview';
    if(els.previewPoints) els.previewPoints.textContent = '';

    if(res.state === 'empty'){
      els.previewText.textContent = game.goldenActive
        ? 'Gyllen bokstav – tredobbel uttelling!'
        : 'Lengre ord gir flere poeng';
      if(els.powerFill) els.powerFill.style.width = '0%';
      return;
    }
    if(els.powerFill) els.powerFill.style.width = Math.min(100, (res.word.length / 14) * 100) + '%';

    if(res.state === 'wrongletter' || res.state === 'used' || res.state === 'invalid'){
      if(els.preview) els.preview.classList.add('bad');
      els.previewText.textContent = res.message;
      return;
    }
    if(res.state === 'known' && els.preview) els.preview.classList.add('good');
    els.previewText.textContent = res.state === 'known'
      ? `${res.word.length} bokstaver · klar`
      : `${res.word.length} bokstaver · sjekkes`;
    if(els.previewPoints) els.previewPoints.textContent = '+' + game.previewPoints(res.word);
  }

  /* ---------------- posisjon for effekter ---------------- */
  function trainTipPos(){
    const cur = els.train && els.train.querySelector('.carriage.current');
    const r = cur ? cur.getBoundingClientRect()
                  : (els.train ? els.train.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 });
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  /** Midt i togområdet – der er det alltid ledig plass, uansett
      om layouten er høy (PC) eller klemt av tastaturet (mobil). */
  function bannerPos(){
    const area = els.train ? els.train.getBoundingClientRect() : null;
    if(!area || area.height < 40){
      return { x: window.innerWidth / 2, y: window.innerHeight * 0.3 };
    }
    return { x: area.left + area.width / 2, y: area.top + area.height * 0.34 };
  }

  /* =========================================================
     OPPDRAG OG PAKKER
     Et fullført oppdrag gir ikke vogna med én gang – den legges
     som en uåpnet pakke i vognskjulet. Selve belønningen er å
     pakke den opp.
     ========================================================= */
  function announceMissionDone(carriage){
    sfx.unlocked();
    haptic([18, 60, 18]);
    const old = document.querySelector('.unlock-toast');
    if(old) old.remove();
    clearTimeout(toastTimer);

    const el = document.createElement('div');
    el.className = 'unlock-toast';
    el.setAttribute('role', 'status');
    el.innerHTML = '<span class="crate-mini" aria-hidden="true">🎁</span>'
      + `<span class="ut"><span class="uk">Oppdrag fullført</span>`
      + `<span class="un">En pakke venter i vognskjulet</span></span>`;
    // Over den tomme himmelen rett over toget – der er det ledig
    // plass både på mobil og PC, og aldri knapper i veien.
    const area = els.train ? els.train.getBoundingClientRect() : null;
    el.style.top = (area && area.height > 60 ? area.top + 10 : window.innerHeight * 0.12) + 'px';
    document.body.appendChild(el);

    const bp = bannerPos();
    fx.burst(bp.x, bp.y + 20, 26, { colors: ['#ffe08a', '#ffc24d', '#fff'], speed: 320 });

    toastTimer = setTimeout(() => {
      el.classList.add('leaving');
      setTimeout(() => el.remove(), 420);
    }, 2800);

    updateCrateBadges();
    renderDepot();
  }

  /** Rød prikk på inngangen til vognskjulet når en pakke venter. */
  function updateCrateBadges(){
    const waiting = !!progress.pending();
    document.querySelectorAll('[data-crate-badge]').forEach(el => {
      el.hidden = !waiting;
    });
    if(els.crateHint) els.crateHint.hidden = !waiting;
  }

  /* ---------------- vognskjulet ---------------- */
  function renderDepot(){
    if(!els.depot) return;
    els.depot.innerHTML = '';

    const pending = progress.pending();
    const mission = progress.missionProgress();

    if(pending) els.depot.appendChild(buildCrateCard(pending));

    DEPOT_SLOTS.forEach(c => {
      const unlocked = progress.isUnlocked(c.id);
      const isNext = !!mission && mission.carriage.id === c.id;
      const item = document.createElement('div');
      item.className = 'depot-item'
        + (unlocked ? '' : ' empty')
        + (isNext ? ' next' : '');

      if(unlocked){
        item.innerHTML = `<span class="mini type-${c.id}" aria-hidden="true"></span>`
          + `<span class="dt"><span class="dn">${c.name}</span>`
          + `<span class="dd">${c.desc}</span></span>`;
      } else if(isNext){
        item.innerHTML = '<span class="slot-ghost" aria-hidden="true">?</span>'
          + `<span class="dt"><span class="dn">Neste vogn</span>`
          + `<span class="mission-goal">${c.mission.text}</span>`
          + `<span class="mission-bar"><i style="width:${mission.pct}%"></i></span>`
          + `<span class="mission-count">${mission.value} / ${mission.goal}</span></span>`;
      } else {
        item.innerHTML = '<span class="slot-ghost" aria-hidden="true">?</span>'
          + '<span class="dt"><span class="dn">Tom plass</span>'
          + '<span class="dd">Låses opp senere</span></span>';
      }
      els.depot.appendChild(item);
    });

    // Lokomotiv og gullvogn hører ikke til opplåsingen, men vises til slutt.
    [LOCO, GOLD].forEach(c => {
      const item = document.createElement('div');
      item.className = 'depot-item';
      item.innerHTML = `<span class="mini type-${c.id}" aria-hidden="true"></span>`
        + `<span class="dt"><span class="dn">${c.name}</span>`
        + `<span class="dd">${c.desc}</span></span>`;
      els.depot.appendChild(item);
    });

    if(els.depotCount){
      const have = DEPOT_SLOTS.filter(c => progress.isUnlocked(c.id)).length;
      els.depotCount.textContent = `${have}/${DEPOT_SLOTS.length}`;
    }
  }

  function buildCrateCard(carriage){
    const card = document.createElement('div');
    card.className = 'crate-card';
    card.innerHTML = '<span class="ck">Uåpnet pakke</span>'
      + '<button class="crate" type="button" aria-label="Pakk opp pakka">'
      +   '<span class="glow"></span><span class="lid"></span>'
      +   '<span class="box"></span><span class="band"></span>'
      + '</button>'
      + '<span class="cs">Trykk for å pakke opp</span>';

    const btn = card.querySelector('.crate');
    btn.addEventListener('click', () => openCrate(card, btn, carriage));
    return card;
  }

  function openCrate(card, btn, carriage){
    if(btn.disabled) return;
    btn.disabled = true;
    btn.classList.add('opening');
    sfx.power();
    haptic([10, 40, 10]);

    setTimeout(() => {
      const unlocked = progress.openCrate();
      if(!unlocked){ renderDepot(); return; }

      sfx.unlocked();
      haptic([18, 60, 18, 60, 30]);

      const r = btn.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      fx.burst(cx, cy, 40, { colors: ['#ffe08a', '#ffc24d', '#fff'], speed: 380 });
      fx.ring(cx, cy, '#ffe08a', 170);

      card.innerHTML = '<span class="ck">Ny vogn i skjulet</span>'
        + `<span class="crate-reveal"><span class="mini type-${unlocked.id}" aria-hidden="true"></span>`
        + `<span class="rn">${unlocked.name}</span>`
        + `<span class="rd">${unlocked.desc}</span></span>`;

      updateCrateBadges();
      // Lista under skal nå vise vogna som låst opp og neste oppdrag.
      setTimeout(renderDepot, 2200);
    }, 950);
  }

  /* =========================================================
     HENDELSER FRA SPILLET
     ========================================================= */
  function handleEvent(type, data){
    switch(type){

      case 'start': {
        shownScore = 0;
        carriageTypes = ['loco'];
        if(els.scoreVal) els.scoreVal.textContent = '0';
        if(els.levelVal) els.levelVal.textContent = '1';
        if(els.hintsLeft) els.hintsLeft.textContent = String(game.hintsLeft);
        if(els.heatBox) els.heatBox.hidden = !game.hasTimer();
        updateLivesUI();
        updateComboUI();
        renderPowerups();
        refreshTrain(false);
        updatePrompt();
        if(game.hasTimer()) updateTimerUI(game.timeLeft, false);
        if(els.vignette) els.vignette.classList.remove('on');
        setSignal('go');
        setMsg(game.mode.id === 'maraton'
          ? 'Ingen klokke – men pass på livene!'
          : 'Avgang! Koble på neste vogn.', 'info');
        setBusy(false);
        if(els.wordInput) els.wordInput.value = '';
        updatePreview();
        showScreen('game');
        focusInput();
        startSteam();
        sfx.whistle();
        break;
      }

      case 'tick':
        updateTimerUI(data.timeLeft, data.frozen);
        break;

      case 'lowtime':
        sfx.lowTick();
        break;

      case 'accept': {
        carriageTypes.push(pickCarriage(data.word, {
          index: game.chain.length - 1,
          golden: data.golden,
          unlocked: progress.unlockedSet
        }));

        const pos = trainTipPos();
        refreshTrain(true);
        animateScore();
        updateComboUI();
        updatePrompt();
        renderPowerups();
        if(game.hasTimer()) updateTimerUI(game.timeLeft, performance.now() < game.freezeUntil);

        const big = data.mult >= 3 || data.golden || data.double;
        fx.burst(pos.x, pos.y + 16, data.golden ? 26 : (big ? 18 : 10),
                 data.golden ? { colors: ['#ffe08a', '#fff3c4', '#ffc24d'], speed: 300 } : {});
        if(big) fx.ring(pos.x, pos.y, data.golden ? '#ffe08a' : '#ffc24d');
        fx.popup('+' + data.gained,
                 pos.x + (Math.random() - .5) * 40, pos.y - 26,
                 { color: data.golden ? '#ffe08a' : (data.mult > 1 ? '#c4b0ff' : '#ffc24d'),
                   size: data.golden ? 34 : (big ? 30 : 25) });
        if(data.golden){ fx.doShake(9); sfx.golden(); }
        else if(!big) sfx.correct(data.mult);

        haptic(data.golden ? [14, 40, 14] : 10);
        setSignal('go');

        let praise = rnd(PRAISE);
        let kind = 'ok';
        if(data.golden){ praise = 'GULLVOGN! ×3'; kind = 'gold'; }
        else if(data.double){ praise = 'DOBBELT OPP!'; }
        setMsg(praise, kind);

        const done = progress.noteDuringRound({
          wordLen: data.word.length,
          words: game.chain.length
        });
        if(done) announceMissionDone(done);

        if(els.wordInput) els.wordInput.value = '';
        updatePreview();
        break;
      }

      case 'comboup': {
        const pos = trainTipPos();
        sfx.combo(data.mult);
        fx.doShake(6 + data.mult * 2);
        const bp = bannerPos();
        fx.popup('KOMBO ×' + data.mult, bp.x, bp.y,
                 { color: '#ffe08a', size: 40, life: 1, vy: -30 });
        fx.ring(pos.x, pos.y, '#9b7bff', 180);
        setMsg(rnd(BIG_PRAISE), 'ok');
        haptic([12, 40, 12]);
        break;
      }

      case 'levelup': {
        if(els.levelVal) els.levelVal.textContent = String(data.level);
        sfx.level();
        sfx.whistle();
        fx.doShake(12);
        const bp = bannerPos();
        fx.popup('NIVÅ ' + data.level + '!', bp.x, bp.y,
                 { color: '#7fd4ff', size: 42, life: 1.1, vy: -26 });
        setMsg(game.hasTimer()
          ? `Nivå ${data.level} – toget går fortere!`
          : `Nivå ${data.level}!`, 'ok');
        haptic([16, 50, 16]);
        break;
      }

      case 'golden': {
        updatePrompt();
        updatePreview();
        sfx.golden();
        const pos = trainTipPos();
        fx.ring(pos.x, pos.y, '#ffe08a', 150);
        setMsg(`Gyllen bokstav «${upper(data.letter)}» – neste vogn gir ×3!`, 'gold');
        break;
      }

      case 'power': {
        renderPowerups();
        sfx.power();
        const p = POWERS[data.type];
        const bp = bannerPos();
        fx.popup(p.icon + ' ' + p.name.toUpperCase(), bp.x, bp.y + 34,
                 { color: '#c4b0ff', size: 26, life: .9 });
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
          setMsg('⚡ Neste vogn teller dobbelt!', 'info');
        } else {
          sfx.power();
          setMsg(`🔄 Byttet til bokstaven «${upper(data.requiredLetter)}»`, 'info');
        }
        break;
      }

      case 'reject': {
        updateComboUI();
        updateLivesUI();
        renderPowerups();
        sfx.error();
        setSignal('stop');
        if(data.lostLife){
          sfx.life();
          fx.doShake(14);
          const bp = bannerPos();
          fx.popup('−1 ♥', bp.x, bp.y, { color: '#ff5f6b', size: 32, life: .9 });
          haptic([40, 60, 40]);
        } else {
          haptic(35);
        }
        setMsg(data.message, 'bad');
        if(els.wordInput){
          els.wordInput.classList.remove('shake');
          void els.wordInput.offsetWidth;    // tvinger reflow så risting kan spilles på nytt
          els.wordInput.classList.add('shake');
          els.wordInput.value = '';
        }
        updatePreview();
        break;
      }

      case 'checking':
        setBusy(true);
        setSignal('wait');
        setMsg('Sjekker ordet i ordboka …', 'info');
        break;

      case 'checked':
        setBusy(false);
        break;

      case 'hint': {
        if(els.hintsLeft) els.hintsLeft.textContent = String(data.hintsLeft);
        if(els.hintBtn) els.hintBtn.disabled = data.hintsLeft <= 0;
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
     RESULTAT
     ========================================================= */
  function showEnd(d){
    stopSteam();
    if(els.vignette) els.vignette.classList.remove('on');
    fx.clear();

    const { isNewBest, unlockedNow } = progress.finishRound({
      modeId: d.mode.id,
      score: d.score,
      words: d.words
    });

    isNewBest ? sfx.win() : sfx.over();

    if(els.endScore) els.endScore.textContent = String(d.score);
    if(els.endWords) els.endWords.textContent = String(d.words);
    if(els.endCombo) els.endCombo.textContent = '×' + d.bestCombo;
    if(els.endLongest) els.endLongest.textContent = d.longest || '–';
    if(els.endLevel) els.endLevel.textContent = String(d.level);

    let rank = 'Sporskifter';
    if(d.score >= 1400) rank = 'Toglegende';
    else if(d.score >= 800) rank = 'Lokfører';
    else if(d.score >= 400) rank = 'Konduktør';
    else if(d.score >= 150) rank = 'Billettør';
    if(els.rankTitle) els.rankTitle.textContent = rank;

    renderTrain(els.endTrain, d.chain, carriageTypes, { markCurrent: false });

    const best = progress.bestFor(d.mode.id);
    if(els.bestLine){
      els.bestLine.className = 'best-line' + (isNewBest ? ' new' : '');
      els.bestLine.textContent = isNewBest
        ? `🏆 Ny rekord i ${d.mode.name}: ${best.score} poeng`
        : `Rekord i ${d.mode.name}: ${best.score} poeng`;
    }

    renderDepot();
    updateCrateBadges();
    showScreen('end');

    if(isNewBest){
      fx.popup('NY REKORD!', window.innerWidth / 2, window.innerHeight * 0.24,
               { color: '#ffe08a', size: 40, life: 1.4, vy: -18 });
      fx.burst(window.innerWidth / 2, window.innerHeight * 0.3, 44,
               { colors: ['#ffe08a', '#ffc24d', '#fff'], speed: 380 });
      fx.doShake(10);
      haptic([20, 60, 20, 60, 30]);
    }
    if(unlockedNow) setTimeout(() => announceMissionDone(unlockedNow), 700);
    if(els.restartBtn) els.restartBtn.focus();
  }

  /* =========================================================
     MODUSVALG
     ========================================================= */
  function renderModes(){
    if(!els.modeList) return;
    els.modeList.innerHTML = '';
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
        sfx.unlock();          // åpner AudioContext på første trykk
        sfx.hint();
        haptic(8);
      });
      els.modeList.appendChild(btn);
    });
  }

  function updateStartBest(){
    if(!els.startBest) return;
    const b = progress.bestFor(selectedMode);
    els.startBest.textContent = b.score > 0
      ? `Din rekord i ${MODES[selectedMode].name}: ${b.score} poeng · ${b.words} vogner`
      : 'Ingen rekord ennå – på tide å kjøre!';
  }

  function updateStartAvailability(){
    if(!els.startBtn) return;
    const loading = dict.status === 'loading';
    els.startBtn.disabled = loading;
    els.startBtn.textContent = loading ? 'KOBLER VOGNER …' : 'AVGANG';
  }

  /* ---------------- lyd ---------------- */
  function setSound(on){
    sfx.setEnabled(on);
    if(els.soundBtn){
      els.soundBtn.setAttribute('aria-pressed', String(on));
      els.soundBtn.textContent = on ? '🔊 Lyd på' : '🔇 Lyd av';
    }
    if(els.muteBtn){
      els.muteBtn.setAttribute('aria-pressed', String(on));
      els.muteBtn.textContent = on ? '🔊' : '🔇';
    }
  }

  /* =========================================================
     OPPKOBLING
     ========================================================= */
  if(els.wordForm){
    els.wordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      sfx.unlock();                  // sikrer at AudioContext er åpnet
      game.submit(els.wordInput.value);
    });
  }
  if(els.wordInput) els.wordInput.addEventListener('input', updatePreview);

  if(els.startBtn) els.startBtn.addEventListener('click', () => { sfx.unlock(); game.start(selectedMode); });
  if(els.restartBtn) els.restartBtn.addEventListener('click', () => { sfx.unlock(); game.start(game.mode.id); });
  if(els.menuBtn) els.menuBtn.addEventListener('click', () => {
    selectedMode = game.mode.id;
    renderModes();
    updateStartBest();
    renderDepot();
    showScreen('start');
  });
  if(els.hintBtn) els.hintBtn.addEventListener('click', () => {
    if(!game.useHint()) setMsg('Fant ingen hint denne gangen …', 'info');
  });
  if(els.soundBtn) els.soundBtn.addEventListener('click', () => setSound(!sfx.enabled));
  if(els.muteBtn) els.muteBtn.addEventListener('click', () => setSound(!sfx.enabled));

  document.addEventListener('keydown', (e) => {
    const gameScreen = $('screen-game');
    if(!game.running || !gameScreen || !gameScreen.classList.contains('active')) return;
    if(e.key >= '1' && e.key <= '3' && els.wordInput && els.wordInput.value === ''){
      const types = Object.keys(POWERS).filter(t => game.powers[t] > 0);
      const t = types[Number(e.key) - 1];
      if(t){ e.preventDefault(); game.usePower(t); focusInput(); }
    }
  });

  setSound(true);
  setSignal('go');
  renderModes();
  updateStartBest();
  renderDepot();
  updateCrateBadges();
  updateStartAvailability();
  fx.setAmbient(true);
  fx.start();
  dict.load().then(updateStartAvailability);

  // Snarvei fra resultatskjermen rett inn i vognskjulet.
  if(els.crateHint){
    els.crateHint.addEventListener('click', () => {
      selectedMode = game.mode.id;
      renderModes();
      updateStartBest();
      renderDepot();
      showScreen('start');
      if(layout.openDepot) layout.openDepot();
    });
  }

  if(layout.init){
    layout.init({ game, fx, sfx, progress, els, focusInput, renderDepot, updateCrateBadges });
  }

  return { game, fx, sfx, progress, els, renderDepot, updateCrateBadges, showScreen };
}
