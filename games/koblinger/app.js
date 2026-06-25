const STORAGE_KEY = 'koblinger:v0.3:progress';
const el = id => document.getElementById(id);

function mulberry32(a){
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function datoFro(){
  const d = new Date();
  return d.getFullYear()*10000 + (d.getMonth()+1)*100 + d.getDate();
}
function stokk(arr, rng){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(rng()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

let aktivtPuslespill = null;
let aktivTittel = '';
let aktivKey = '';
let aktivForrigeSkjerm = 'fag';
let aktivNivaaListe = null;
let aktivNivaaIndex = -1;
let hintBrukt = 0;
let stat = null;
let lydPa = true;
let audioCtx = null;

function loadProgress(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch(e){ return {}; }
}
function saveProgress(key, stars, feil){
  const data = loadProgress();
  const prev = data[key] || { stars:0, bestErrors:null, plays:0 };
  data[key] = {
    stars: Math.max(prev.stars || 0, stars),
    bestErrors: prev.bestErrors === null ? feil : Math.min(prev.bestErrors, feil),
    plays: (prev.plays || 0) + 1
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function progressFor(key){ return loadProgress()[key]; }
function starsForErrors(feil, maks){
  if(feil === 0) return 3;
  if(feil <= Math.max(1, Math.floor(maks/2))) return 2;
  return 1;
}
function starText(n){ return '★'.repeat(n) + '☆'.repeat(3-n); }
function allLevelEntries(){
  return FAG.flatMap(f => f.nivaaer ? f.nivaaer.map((n,i)=>({fag:f,niva:n,key:`${f.id}:${i}`})) : [{fag:f,niva:{navn:f.navn,puslespill:f.puslespill},key:f.id}]);
}
function indexOfLevel(list, item){ return list.indexOf(item); }
function subjectStats(fag){
  const keys = fag.nivaaer ? fag.nivaaer.map((_,i)=>`${fag.id}:${i}`) : [fag.id];
  const data = loadProgress();
  const done = keys.filter(k => data[k]).length;
  const best = keys.reduce((m,k)=>Math.max(m, data[k]?.stars || 0), 0);
  return { total:keys.length, done, best };
}
function renderOverviewStats(){
  const entries = allLevelEntries();
  const data = loadProgress();
  const done = entries.filter(e => data[e.key]).length;
  const best = entries.reduce((m,e)=>Math.max(m, data[e.key]?.stars || 0), 0);
  if(el('stat-levels')) el('stat-levels').textContent = String(entries.length);
  if(el('stat-done')) el('stat-done').textContent = String(done);
  if(el('stat-best')) el('stat-best').textContent = starText(best);
}

function buildBrett(puslespill){
  const ordPer = puslespill.ordPerKategori || 4;
  const rng = puslespill.utvalg === 'dato' ? mulberry32(datoFro()) : Math.random;
  const kort = [];
  puslespill.grupper.forEach((g, gi) => {
    const valgteOrd = puslespill.utvalg === 'fast' ? g.bank.slice(0, ordPer) : stokk(g.bank, rng).slice(0, ordPer);
    valgteOrd.forEach(tekst => kort.push({ tekst, gruppe:gi }));
  });
  return {
    kort: stokk(kort, rng),
    lost: [],
    valgt: new Set(),
    forsokIgjen: puslespill.forsok || 4,
    maksForsok: puslespill.forsok || 4,
    tidligere: [],
    ordPer,
    antallGrupper: puslespill.grupper.length,
    grupper: puslespill.grupper,
  };
}

function visSkjerm(navn){
  if(navn === 'fag') renderOverviewStats();
  ['fag','niva','spill'].forEach(s => el('skjerm-'+s).classList.toggle('is-hidden', s !== navn));
  el('global-back').classList.toggle('is-hidden', navn === 'fag');
  el('header-context').textContent = navn === 'fag' ? 'Velg fag' : navn === 'niva' ? 'Velg nivå' : aktivTittel;
}

function renderFag(){
  const cont = el('fagrutenett');
  cont.innerHTML = '';
  FAG.forEach(fag => {
    const levels = fag.nivaaer ? fag.nivaaer.length : 1;
    const key = fag.nivaaer ? null : fag.id;
    const progress = key ? progressFor(key) : null;
    const card = document.createElement('button');
    card.className = 'subject-card';
    card.style.setProperty('--subject-color', `var(--${fag.tone || 'language'})`);
    card.innerHTML = `
      <div>
        <span class="emoji" aria-hidden="true">${fag.emoji}</span>
        <h3>${fag.navn}</h3>
        <p>${fag.beskrivelse}</p>
      </div>
      <div>
        <div class="card-meta">
          <span class="chip">${levels} ${levels === 1 ? 'brett' : 'nivåer'}</span>
          <span class="chip">${progress ? 'Beste: ' + starText(progress.stars) : 'Ikke spilt'}</span>
        </div>
        <span class="stripe" aria-hidden="true">${GRAD_FARGER.map(f=>`<i style="background:${f}"></i>`).join('')}</span>
      </div>`;
    card.addEventListener('click', () => velgFag(fag));
    cont.appendChild(card);
  });
}

function velgFag(fag){
  if(fag.nivaaer){
    el('niva-eyebrow').textContent = fag.navn;
    el('niva-ledetekst').textContent = 'Velg nivå';
    const cont = el('nivarutenett');
    cont.innerHTML = '';
    fag.nivaaer.forEach((niva, idx) => {
      const key = `${fag.id}:${idx}`;
      const progress = progressFor(key);
      const card = document.createElement('button');
      card.className = 'subject-card';
      card.style.setProperty('--subject-color', `var(--${fag.tone || 'math'})`);
      card.innerHTML = `
        <div>
          <span class="emoji" aria-hidden="true">${fag.emoji}</span>
          <h3>${niva.navn}</h3>
          <p>${niva.beskrivelse || niva.puslespill.grupper.map(g=>g.etikett).join(' · ')}</p>
        </div>
        <div class="card-meta">
          <span class="chip">${niva.puslespill.grupper.length} grupper</span>
          <span class="chip">${progress ? 'Beste: ' + starText(progress.stars) : 'Ikke spilt'}</span>
        </div>`;
      card.addEventListener('click', () => startSpill(niva.puslespill, `${fag.navn}: ${niva.navn}`, key, 'niva', fag.nivaaer, idx));
      cont.appendChild(card);
    });
    aktivForrigeSkjerm = 'fag';
    visSkjerm('niva');
  } else {
    startSpill(fag.puslespill, fag.navn, fag.id, 'fag', null, -1);
  }
}

function startSpill(puslespill, tittel, key, previousScreen, levelList, levelIndex){
  aktivtPuslespill = puslespill;
  aktivTittel = tittel;
  aktivKey = key;
  aktivForrigeSkjerm = previousScreen || 'fag';
  aktivNivaaListe = levelList || null;
  aktivNivaaIndex = Number.isInteger(levelIndex) ? levelIndex : -1;
  hintBrukt = 0;
  stat = buildBrett(puslespill);
  el('spill-tittel').textContent = tittel;
  el('rutenett').style.gridTemplateColumns = `repeat(${stat.ordPer},1fr)`;
  el('overlegg').classList.add('is-hidden');
  setFeedback('Velg fire brikker', 'Send inn når du tror fire kort hører sammen.', null, '•');
  setTip('Start med kort du er sikker på, og se etter én tydelig felles regel.');
  renderSelectionMeter();
  renderForsok();
  renderLost();
  renderRutenett();
  updateSendButton();
  visSkjerm('spill');
}

function tileContent(tekst){
  const m = /^(\d+)\/(\d+)$/.exec(tekst);
  if(m){
    return `<span class="fraction"><span class="top">${m[1]}</span><span class="bar"></span><span class="bottom">${m[2]}</span></span>`;
  }
  return tekst;
}
function plainLabel(tekst){
  const m = /^(\d+)\/(\d+)$/.exec(tekst);
  return m ? `${m[1]} over ${m[2]}` : tekst;
}

function renderRutenett(){
  const cont = el('rutenett');
  cont.innerHTML = '';
  stat.kort.forEach((k, i) => {
    const b = document.createElement('button');
    b.className = 'tile' + (stat.valgt.has(i) ? ' selected' : '');
    b.innerHTML = tileContent(k.tekst);
    b.setAttribute('aria-pressed', stat.valgt.has(i) ? 'true' : 'false');
    b.setAttribute('aria-label', plainLabel(k.tekst));
    b.addEventListener('click', () => velgBrikke(i));
    cont.appendChild(b);
  });
}
function renderLost(){
  const cont = el('lost-liste');
  cont.innerHTML = '';
  stat.lost.slice().sort((a,b)=>a.gruppe-b.gruppe).forEach(l => {
    const g = stat.grupper[l.gruppe];
    const d = document.createElement('div');
    d.className = 'solved-group';
    d.style.background = GRAD_FARGER[l.gruppe % GRAD_FARGER.length];
    d.innerHTML = `<strong>${g.etikett}</strong><span>${l.ord.map(tileContent).join(' · ')}</span>${g.forklaring ? `<small>${g.forklaring}</small>` : ''}`;
    cont.appendChild(d);
  });
}
function renderForsok(){
  const cont = el('prikker');
  cont.innerHTML = '';
  for(let i=0;i<stat.maksForsok;i++){
    const p = document.createElement('span');
    p.className = 'dot' + (i >= stat.forsokIgjen ? ' used' : '');
    cont.appendChild(p);
  }
}
function setFeedback(title, text, type, icon){
  const box = el('feedback');
  box.className = 'feedback' + (type ? ' ' + type : '');
  el('feedback-title').textContent = title;
  el('feedback-text').textContent = text;
  box.querySelector('.feedback-icon').textContent = icon || '•';
}
function setTip(text){
  if(el('tip-box')) el('tip-box').innerHTML = `<strong>Tips:</strong> ${text}`;
}
function renderSelectionMeter(){
  if(!stat || !el('selection-meter')) return;
  const count = stat.valgt.size;
  el('selection-label').textContent = `${count} av ${stat.ordPer} valgt`;
  el('selection-meter').innerHTML = '';
  for(let i=0;i<stat.ordPer;i++){
    const bar = document.createElement('i');
    if(i < count) bar.className = 'on';
    el('selection-meter').appendChild(bar);
  }
}

function velgBrikke(i){
  if(stat.valgt.has(i)) stat.valgt.delete(i);
  else if(stat.valgt.size < stat.ordPer) stat.valgt.add(i);
  const count = stat.valgt.size;
  if(count === 0){
    setFeedback('Velg fire brikker', 'Send inn når du tror fire kort hører sammen.', null, '•');
    setTip('Start med kort du er sikker på, og se etter én tydelig felles regel.');
  } else if(count < stat.ordPer){
    setFeedback(`${count} av ${stat.ordPer} valgt`, 'Velg flere brikker for å sende inn.', null, `${count}`);
  } else {
    setFeedback('Klar til å sende inn', 'Sjekk én gang til før du sender inn.', null, '✓');
  }
  updateSendButton();
  renderSelectionMeter();
  renderRutenett();
}
function updateSendButton(){ el('send-knapp').disabled = !stat || stat.valgt.size !== stat.ordPer; }
function fjernValg(){
  stat.valgt.clear();
  updateSendButton();
  renderSelectionMeter();
  setFeedback('Valget er fjernet', 'Velg fire nye brikker.', null, '•');
  renderRutenett();
}

function giHint(){
  if(!stat || stat.kort.length === 0) return;
  hintBrukt++;
  const remainingGroups = [...new Set(stat.kort.map(k => k.gruppe))];
  let target = remainingGroups[0];
  if(stat.valgt.size){
    const counts = {};
    [...stat.valgt].forEach(i => counts[stat.kort[i].gruppe] = (counts[stat.kort[i].gruppe] || 0) + 1);
    target = Number(Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0]);
  }
  const g = stat.grupper[target];
  if(hintBrukt === 1){
    setFeedback('Hint', g.hint || 'Se etter hva kortene har felles.', 'warn', '?');
  } else {
    setFeedback('Hint', `En mulig gruppe handler om: ${g.etikett}.`, 'warn', '?');
  }
  setTip('Hint hjelper deg å se regelen, men prøv å finne kortene selv før du sender inn.');
}

function sendInn(){
  if(stat.valgt.size !== stat.ordPer) return;
  const valgte = [...stat.valgt];
  const tekster = valgte.map(i=>stat.kort[i].tekst).sort();
  const nokkel = tekster.join('|');
  if(stat.tidligere.includes(nokkel)){
    setFeedback('Allerede prøvd', 'Dette settet har du sendt inn før. Bytt ut minst én brikke.', 'warn', '!');
    shake(valgte);
    return;
  }
  const teller = {};
  valgte.forEach(i => {
    const g = stat.kort[i].gruppe;
    teller[g] = (teller[g] || 0) + 1;
  });
  const maks = Math.max(...Object.values(teller));
  if(maks === stat.ordPer){
    const gruppe = stat.kort[valgte[0]].gruppe;
    const g = stat.grupper[gruppe];
    const ord = valgte.map(i=>stat.kort[i].tekst);
    pop(valgte);
    playSound('riktig');
    setTimeout(() => {
      stat.lost.push({ gruppe, ord });
      stat.kort = stat.kort.filter((_,idx) => !stat.valgt.has(idx));
      stat.valgt.clear();
      updateSendButton();
      renderSelectionMeter();
      renderLost();
      renderRutenett();
      if(stat.lost.length === stat.antallGrupper) vinn();
      else setFeedback(g.etikett, g.forklaring || 'Riktig gruppe.', 'good', '✓');
    }, prefersReduced() ? 0 : 360);
  } else {
    stat.tidligere.push(nokkel);
    stat.forsokIgjen--;
    renderForsok();
    shake(valgte);
    playSound('feil');
    if(maks === stat.ordPer - 1){
      const likely = Number(Object.entries(teller).sort((a,b)=>b[1]-a[1])[0][0]);
      const g = stat.grupper[likely];
      setFeedback('Én unna', `${g.hint || 'Tre av brikkene hører sammen.'} Finn den ene som lurer seg inn.`, 'warn', '1');
    } else {
      setFeedback('Ikke helt', 'Se etter én tydelig felles egenskap før du prøver igjen.', 'bad', '×');
    }
    if(stat.forsokIgjen <= 0) setTimeout(tap, prefersReduced() ? 0 : 480);
  }
}

function tileEl(i){ return el('rutenett').children[i]; }
function shake(idxer){ idxer.forEach(i => { const b = tileEl(i); if(b){ b.classList.add('shake'); b.addEventListener('animationend', () => b.classList.remove('shake'), {once:true}); } }); }
function pop(idxer){ idxer.forEach(i => { const b = tileEl(i); if(b){ b.classList.add('pop'); b.addEventListener('animationend', () => b.classList.remove('pop'), {once:true}); } }); }

function tap(){
  const resterende = {};
  stat.kort.forEach(k => { (resterende[k.gruppe] = resterende[k.gruppe] || []).push(k.tekst); });
  Object.keys(resterende).forEach(g => stat.lost.push({ gruppe:+g, ord:resterende[g] }));
  stat.kort = [];
  stat.valgt.clear();
  renderLost();
  renderRutenett();
  showPanel('💪', 'Bra forsøk', 'Her er løsningen. Prøv igjen for å se om koblingene sitter bedre.', 0, stat.maksForsok);
}
function vinn(){
  playSound('vinn');
  const feil = stat.maksForsok - stat.forsokIgjen;
  const stars = starsForErrors(feil, stat.maksForsok);
  saveProgress(aktivKey, stars, feil);
  renderFag();
  const text = feil === 0 ? 'Feilfritt. Du fant alle gruppene uten bom.' : `Du fant alle gruppene med ${feil} ${feil === 1 ? 'feil' : 'feil'}.`;
  setTimeout(() => showPanel('🎉', 'Fullført', text, stars, feil), prefersReduced() ? 0 : 220);
}
function showPanel(emoji, title, text, stars, feil){
  el('panel-emoji').textContent = emoji;
  el('panel-tittel').textContent = title;
  el('panel-tekst').textContent = text;
  el('panel-stjerner').textContent = starText(stars);
  el('panel-feil').textContent = String(feil);
  const found = stat?.lost?.map(l => stat.grupper[l.gruppe]?.etikett).filter(Boolean).join(', ') || 'Kategorier og felles kjennetegn';
  el('lesson-text').textContent = `Du sorterte etter: ${found}.`;
  const hasNext = aktivNivaaListe && aktivNivaaIndex >= 0 && aktivNivaaIndex < aktivNivaaListe.length - 1;
  el('neste-knapp').classList.toggle('is-hidden', !hasNext);
  el('overlegg').classList.remove('is-hidden');
  el('igjen-knapp').focus();
}

function playSound(type){
  if(!lydPa) return;
  try{
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const toner = { riktig:[523,659,784], feil:[220,196], vinn:[523,659,784,1047] };
    const seq = toner[type] || [440];
    seq.forEach((f,i) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      o.connect(g);
      g.connect(audioCtx.destination);
      const t = audioCtx.currentTime + i * 0.085;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(type === 'feil' ? 0.06 : 0.1, t + 0.018);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
      o.start(t);
      o.stop(t + 0.19);
    });
  } catch(e) {}
}
function prefersReduced(){ return document.body.classList.contains('reduced-motion'); }
function setMotion(reduced){
  document.body.classList.toggle('reduced-motion', reduced);
  const b = el('bevknapp');
  b.setAttribute('aria-pressed', reduced ? 'false' : 'true');
  b.textContent = reduced ? '⏸️' : '🎬';
}
function setSound(on){
  lydPa = on;
  const b = el('lydknapp');
  b.setAttribute('aria-pressed', on ? 'true' : 'false');
  b.textContent = on ? '🔊' : '🔇';
}
function goBack(){
  el('overlegg').classList.add('is-hidden');
  if(!el('skjerm-spill').classList.contains('is-hidden')) visSkjerm(aktivForrigeSkjerm);
  else visSkjerm('fag');
}

function init(){
  renderFag();
  visSkjerm('fag');
  setMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  setSound(true);
  el('lydknapp').addEventListener('click', () => setSound(!lydPa));
  el('bevknapp').addEventListener('click', () => setMotion(!prefersReduced()));
  el('global-back').addEventListener('click', goBack);
  el('send-knapp').addEventListener('click', sendInn);
  el('fjern-knapp').addEventListener('click', fjernValg);
  el('hint-knapp').addEventListener('click', giHint);
  el('stokk-knapp').addEventListener('click', () => {
    stat.kort = stokk(stat.kort, Math.random);
    stat.valgt.clear();
    updateSendButton();
    renderSelectionMeter();
    setFeedback('Stokket om', 'Brikkene er blandet på nytt.', null, '↻');
    renderRutenett();
  });
  el('neste-knapp').addEventListener('click', () => {
    if(!aktivNivaaListe || aktivNivaaIndex < 0) return;
    const nextIndex = aktivNivaaIndex + 1;
    const next = aktivNivaaListe[nextIndex];
    const fagNavn = aktivTittel.split(':')[0];
    const fagId = aktivKey.split(':')[0];
    startSpill(next.puslespill, `${fagNavn}: ${next.navn}`, `${fagId}:${nextIndex}`, 'niva', aktivNivaaListe, nextIndex);
  });
  el('igjen-knapp').addEventListener('click', () => startSpill(aktivtPuslespill, aktivTittel, aktivKey, aktivForrigeSkjerm, aktivNivaaListe, aktivNivaaIndex));
  el('bytt-knapp').addEventListener('click', () => { el('overlegg').classList.add('is-hidden'); visSkjerm('fag'); });
  document.addEventListener('keydown', e => {
    if(e.key === 'Escape'){
      if(!el('overlegg').classList.contains('is-hidden')) el('overlegg').classList.add('is-hidden');
      else goBack();
    }
  });
}
init();
