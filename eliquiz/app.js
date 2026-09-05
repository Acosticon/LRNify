// LRNify Eliquiz — sanntidsmotor på Firebase Realtime Database.
// Samme mønster (lat innlasting av Firebase, anonym pålogging, romkode
// i den delte LRNify-databasen poll-c6bd2) som brukes i
// games/tidsarkivet og games/geografi/kartografen.
//
// Fasit (aksepterte svar, årstall, Spotify-klipp) bor UTELUKKENDE i
// quiz-data-host.js, som kun importeres dynamisk fra host-ruten. Spiller-
// og storskjerm-ruten laster aldri den filen, og mottar aldri fasit før
// host har publisert den (results/{runde}.artist/title osv.).

const app = document.querySelector('#app');

// ── Lagikoner — 8 fargetema, tegnet som SVG (ingen eksterne bildefiler) ──
const ICONS = [
  { id: 'ild', from: '#3a0d10', to: '#e11d33' },
  { id: 'natt', from: '#1e1b4b', to: '#a855f7' },
  { id: 'jord', from: '#4b2f18', to: '#d6a75c' },
  { id: 'gull', from: '#b91c1c', to: '#eab308' },
  { id: 'hav', from: '#0b1f4d', to: '#38bdf8' },
  { id: 'skog', from: '#14532d', to: '#84cc16' },
  { id: 'korall', from: '#7c2d12', to: '#fb7185' },
  { id: 'ametyst', from: '#3b0764', to: '#c4b5fd' },
];
let _iconSeq = 0;
function iconSvg(iconId, size = 44) {
  const theme = ICONS.find(i => i.id === iconId) || ICONS[0];
  const gid = 'bfg' + (_iconSeq++);
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${theme.from}"/><stop offset="1" stop-color="${theme.to}"/></linearGradient></defs><g fill="url(#${gid})" stroke="#181818" stroke-width="2" stroke-linejoin="round"><ellipse cx="20" cy="24" rx="15" ry="19" transform="rotate(-25 20 24)"/><ellipse cx="44" cy="24" rx="15" ry="19" transform="rotate(25 44 24)"/><ellipse cx="24" cy="42" rx="10" ry="13" transform="rotate(-15 24 42)"/><ellipse cx="40" cy="42" rx="10" ry="13" transform="rotate(15 40 42)"/><rect x="30" y="17" width="4" height="32" rx="2" fill="#181818" stroke="none"/><circle cx="32" cy="15" r="3" fill="#181818" stroke="none"/></g></svg>`;
}

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBdbRSnz-02Cq2BITAcKY_mvWI5D91BYBM',
  authDomain: 'poll-c6bd2.firebaseapp.com',
  databaseURL: 'https://poll-c6bd2-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'poll-c6bd2',
  storageBucket: 'poll-c6bd2.firebasestorage.app',
  messagingSenderId: '541647069675',
  appId: '1:541647069675:web:d8ee426e242e7757dbf9ae',
};
const FIREBASE_KILDE = 'https://www.gstatic.com/firebasejs/10.12.2/';
let FB = null, fbDb = null, fbLoadingP = null;
function loadFirebase() {
  if (FB) return Promise.resolve(FB);
  if (!fbLoadingP) {
    fbLoadingP = Promise.all([
      import(FIREBASE_KILDE + 'firebase-app.js'),
      import(FIREBASE_KILDE + 'firebase-database.js'),
      import(FIREBASE_KILDE + 'firebase-auth.js'),
    ]).then(([a, d, g]) => {
      const fapp = a.initializeApp(FIREBASE_CONFIG);
      fbDb = d.getDatabase(fapp);
      const auth = g.getAuth(fapp);
      FB = {
        ref: d.ref, set: d.set, update: d.update, get: d.get, onValue: d.onValue,
        remove: d.remove, serverTimestamp: d.serverTimestamp,
        auth, signInAnonymously: g.signInAnonymously,
      };
      return FB;
    }).catch(e => { fbLoadingP = null; throw e; });
  }
  return fbLoadingP;
}
const R = path => FB.ref(fbDb, path);

let uid = null, authP = null;
function ensureAuth() {
  if (uid) return Promise.resolve(uid);
  if (!authP) {
    authP = loadFirebase().then(() => FB.signInAnonymously(FB.auth)).then(c => uid = c.user.uid)
      .catch(e => { authP = null; throw e; });
  }
  return authP;
}

function romkode() {
  const tegn = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // uten I/O/0/1
  let k = ''; for (let i = 0; i < 4; i++) k += tegn[Math.floor(Math.random() * tegn.length)];
  return k;
}

const LS = { host: 'lrnify_eliquiz_host_kode', screen: 'lrnify_eliquiz_active_kode', team: 'lrnify_eliquiz_team_kode' };

function esc(s = '') { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c])); }
function top(title = 'MUSIKKQUIZ') { return `<div class="topbar"><div class="brand">🦋 ${title}</div><div class="pill">LRNify</div></div>`; }
function navigate(r) { location.hash = '#/' + r; }
function connBadge(ok) { return `<div class="pill ${ok ? 'status-ok' : 'status-bad'}">${ok ? '● Tilkoblet' : '○ Kobler til…'}</div>`; }
function parseHashQuery() {
  const h = location.hash;
  const i = h.indexOf('?');
  return i === -1 ? new URLSearchParams() : new URLSearchParams(h.slice(i + 1));
}

// ── QR-kode for å bli med (lastes kun ved behov, ingen server) ──────────
let qrLoadP = null;
function loadQr() {
  if (window.QRCode) return Promise.resolve();
  if (!qrLoadP) {
    qrLoadP = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Klarte ikke å laste QR-biblioteket.'));
      document.head.appendChild(s);
    }).catch(e => { qrLoadP = null; throw e; });
  }
  return qrLoadP;
}
function joinUrl(kode) { return `${location.origin}${location.pathname}#/play?code=${kode}`; }
async function renderQrInto(elId, kode) {
  try {
    await loadQr();
    const el = document.getElementById(elId);
    if (!el) return;
    el.innerHTML = '';
    new window.QRCode(el, { text: joinUrl(kode), width: 200, height: 200, colorDark: '#181818', colorLight: '#ffffff', correctLevel: window.QRCode.CorrectLevel.M });
  } catch (e) { /* koden i tekst er nok til å bli med selv om QR-biblioteket ikke lastet */ }
}

// ── Synkronisert nedtellingsklokke for avspillingsklipp og ekstraoppgaven ──
// Host skriver playback{startedAt: server-tidsstempel, durationMs} til
// databasen når klippet startes, og fjerner den ved pause/stopp. Både host-
// og storskjerm-visningen kan da vise nøyaktig samme nedtelling ved å regne
// ut differansen mot serverens starttidspunkt, i stedet for å stole på at
// alle enheters klokker er synkroniserte. finaleDeadline (5-minutters
// nedtelling i ekstraoppgaven) er en enkel klient-tidsstempel — presis nok
// for en morsom bonusrunde.
let livePlayback = null;
let liveFinaleDeadline = null;
let countdownTimerId = null;
function updateLivePlayback(g) { livePlayback = g.playback || null; liveFinaleDeadline = g.finaleDeadline || null; }
function countdownBarHTML() { return `<div class="countdown"><div class="countdown-track"><div id="clipTimer" class="countdown-fill"></div></div><div id="clipTimerLabel" class="countdown-label"></div></div>`; }
function startCountdownTicker() {
  if (countdownTimerId) return;
  countdownTimerId = setInterval(() => {
    const fillEls = document.querySelectorAll('#clipTimer');
    const labelEls = document.querySelectorAll('#clipTimerLabel');
    if (fillEls.length) {
      if (!livePlayback) {
        fillEls.forEach(el => el.style.width = '0%');
        labelEls.forEach(el => el.textContent = '');
      } else {
        const remaining = Math.max(0, livePlayback.startedAt + livePlayback.durationMs - Date.now());
        const pct = Math.max(0, Math.min(100, (remaining / livePlayback.durationMs) * 100));
        fillEls.forEach(el => el.style.width = pct + '%');
        labelEls.forEach(el => el.textContent = Math.ceil(remaining / 1000) + 's');
      }
    }
    const finaleEls = document.querySelectorAll('.finale-timer-label');
    if (finaleEls.length) {
      const remaining = liveFinaleDeadline ? Math.max(0, liveFinaleDeadline - Date.now()) : 5 * 60 * 1000;
      const mm = Math.floor(remaining / 60000);
      const ss = Math.floor((remaining % 60000) / 1000);
      finaleEls.forEach(el => el.textContent = `${mm}:${String(ss).padStart(2, '0')}`);
    }
  }, 200);
}

// ── Offentlig, avledet spillestand (ingen fasit her — kun det host har publisert) ──
function musicScoreFor(g, teamUid) {
  let s = 0;
  for (const r of Object.values(g.results || {})) s += (r.perTeam && r.perTeam[teamUid] && r.perTeam[teamUid].points) || 0;
  return s;
}
function timelineScoreFor(g, teamUid) { return (g.finalResults && g.finalResults[teamUid] && g.finalResults[teamUid].correct) || 0; }
function totalFor(g, teamUid) { return musicScoreFor(g, teamUid) + timelineScoreFor(g, teamUid); }
function leaders(g, final = false) {
  const arr = Object.entries(g.teams || {}).map(([teamUid, t]) => ({ uid: teamUid, ...t }));
  arr.sort((a, b) => {
    const sa = final ? totalFor(g, a.uid) : musicScoreFor(g, a.uid);
    const sb = final ? totalFor(g, b.uid) : musicScoreFor(g, b.uid);
    if (sb !== sa) return sb - sa;
    return (a.name || '').localeCompare(b.name || '');
  });
  return arr;
}
// Sangkort til tidslinje-ekstraoppgaven: hentes fra det host allerede har
// avslørt under musikkrunden (results/{runde}.songId/artist/title) — aldri
// fra en egen "fasit"-fil, og aldri årstall før laget selv plasserer dem.
function revealedSongCards(g) {
  return Object.values(g.results || {})
    .filter(r => r && r.songId && r.title)
    .map(r => ({ id: r.songId, title: r.title, artist: r.artist }))
    .sort((a, b) => a.id - b.id);
}
function animateLeaderMove(oldRects) {
  document.querySelectorAll('.leader[data-uid]').forEach(el => {
    const old = oldRects[el.dataset.uid];
    if (!old) return;
    const now = el.getBoundingClientRect();
    const dy = old.top - now.top;
    if (Math.abs(dy) < 1) return;
    el.style.transition = 'none';
    el.style.transform = `translateY(${dy}px)`;
    el.classList.add('moved');
    requestAnimationFrame(() => {
      el.style.transition = '';
      el.style.transform = '';
      setTimeout(() => el.classList.remove('moved'), 650);
    });
  });
}

function renderHome() {
  app.innerHTML = `<main class="shell">${top()}<section class="card hero"><div class="butterfly">🦋</div><h1>Musikkquiz</h1><p>16 sanger. 2 poeng per sang. 16 poeng i ekstraoppgaven.</p><div class="actions"><button class="btn primary" id="play">Bli med på mobil</button><button class="btn purple" id="host">Host</button><button class="btn" id="screen">Storskjerm</button></div></section></main>`;
  document.querySelector('#play').onclick = () => navigate('play');
  document.querySelector('#host').onclick = () => navigate('host');
  document.querySelector('#screen').onclick = () => navigate('screen');
}

// ══════════════════════════════════ PLAYER ══════════════════════════════════

let playState = { kode: null, unsub: null, joining: false, selectedSong: null };

async function renderPlay() {
  app.innerHTML = `<main class="shell">${top()}<section class="card hero"><p>Kobler til…</p></section></main>`;
  try { await ensureAuth(); } catch (e) { app.innerHTML = `<main class="shell">${top()}<section class="card"><p class="notice">Klarte ikke å koble til. Sjekk nettet og prøv igjen.</p></section></main>`; return; }
  const savedKode = localStorage.getItem(LS.team);
  if (savedKode) {
    const snap = await FB.get(R('eliquiz/' + savedKode));
    if (snap.exists() && snap.val().teams && snap.val().teams[uid]) {
      subscribePlay(savedKode);
      return;
    }
    localStorage.removeItem(LS.team);
  }
  const urlKode = parseHashQuery().get('code');
  renderJoinForm('', urlKode ? urlKode.toUpperCase() : '');
}

function renderJoinForm(error = '', presetKode = '') {
  app.innerHTML = `<main class="shell">${top()}<section class="card"><h1>Bli med</h1>${presetKode ? `<div class="pill">Spillkode ${esc(presetKode)}</div>` : `<label class="label">Spillkode</label><input id="code" class="input" inputmode="text" maxlength="8" placeholder="4821" autocapitalize="characters">`}<label class="label">Lagnavn</label><input id="name" class="input" maxlength="28" placeholder="Team Sommerfugl"><label class="label">Velg sommerfugl</label><div class="icon-grid">${ICONS.map((ic, i) => `<button class="icon-choice ${i === 0 ? 'active' : ''}" data-icon="${ic.id}">${iconSvg(ic.id, 40)}</button>`).join('')}</div><div class="actions"><button class="btn primary" id="join">Bli med</button></div><div id="msg">${error ? `<p class="notice">${esc(error)}</p>` : ''}</div></section></main>`;
  let iconId = ICONS[0].id;
  document.querySelectorAll('.icon-choice').forEach(b => b.onclick = () => {
    iconId = b.dataset.icon;
    document.querySelectorAll('.icon-choice').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
  });
  document.querySelector('#join').onclick = async () => {
    if (playState.joining) return;
    const kodeInput = presetKode || (document.querySelector('#code') ? document.querySelector('#code').value.trim() : '');
    const kode = kodeInput.toUpperCase();
    const name = document.querySelector('#name').value.trim();
    if (!kode || !name) return;
    playState.joining = true;
    try {
      const snap = await FB.get(R('eliquiz/' + kode));
      if (!snap.exists()) { playState.joining = false; renderJoinForm('Fant ingen quiz med den koden.', presetKode); return; }
      const existing = snap.val().teams && snap.val().teams[uid];
      if (!existing) {
        await FB.set(R(`eliquiz/${kode}/teams/${uid}`), { name, icon: iconId, joinedAt: Date.now() });
      }
      localStorage.setItem(LS.team, kode);
      subscribePlay(kode);
    } catch (e) {
      playState.joining = false;
      renderJoinForm('Noe gikk galt. Prøv igjen.', presetKode);
    }
  };
}

function subscribePlay(kode) {
  playState.kode = kode;
  if (playState.unsub) playState.unsub();
  playState.unsub = FB.onValue(R('eliquiz/' + kode), snap => {
    const g = snap.val();
    if (!g) { localStorage.removeItem(LS.team); renderJoinForm('Quizen finnes ikke lenger.'); return; }
    drawPlay(g);
  });
}

function drawPlay(g) {
  updateLivePlayback(g);
  const t = g.teams && g.teams[uid];
  if (!t) { renderJoinForm(); return; }
  if (g.phase === 'lobby') {
    app.innerHTML = `<main class="shell">${top()}<section class="card hero">${iconSvg(t.icon, 64)}<h1>${esc(t.name)}</h1><p>Du er med! Venter på at quizen starter.</p><div class="pill">Spillkode ${esc(playState.kode)}</div></section></main>`;
    return;
  }
  if (g.phase === 'music') {
    const round = g.currentRound || 0;
    const result = g.results && g.results[round];
    if (g.roundStatus === 'revealed') {
      const perTeam = (result && result.perTeam && result.perTeam[uid]) || { artistCorrect: false, titleCorrect: false, points: 0 };
      app.innerHTML = `<main class="shell">${top()}<section class="card reveal"><div class="small">SANG ${round + 1} / 16</div><div class="artist">${esc((result && result.artist) || '')}</div><div class="title">${esc((result && result.title) || '')}</div><div class="spacer"></div><div class="result-line"><b>Hvilken artist/film?</b><b>${perTeam.artistCorrect ? '✅ Riktig' : '❌ Feil'}</b></div><div class="result-line"><b>Hva heter sangen?</b><b>${perTeam.titleCorrect ? '✅ Riktig' : '❌ Feil'}</b></div><h2>+${perTeam.points} poeng</h2></section></main>`;
      return;
    }
    // Svaret er redigerbart frem til fasit vises.
    const ans = (g.answers && g.answers[uid] && g.answers[uid][round]) || { artist: '', title: '' };
    app.innerHTML = `<main class="shell">${top()}<section class="card"><div class="small">SANG ${round + 1} / 16</div><h1 class="round-title">Lytt og svar!</h1><label class="label">Hvilken artist/film?</label><input id="artist" class="input" value="${esc(ans.artist)}" autocomplete="off"><label class="label">Hva heter sangen?</label><input id="title" class="input" value="${esc(ans.title)}" autocomplete="off"><div class="actions"><button class="btn primary" id="submit">${ans.artist || ans.title ? 'Oppdater svar' : 'Send svar'}</button></div><p class="small">Du kan endre svaret helt til fasiten vises.</p></section></main>`;
    document.querySelector('#submit').onclick = () => {
      FB.update(R(`eliquiz/${playState.kode}/answers/${uid}/${round}`), { artist: document.querySelector('#artist').value, title: document.querySelector('#title').value, updatedAt: Date.now() });
    };
    return;
  }
  if (g.phase === 'timeline') { drawTimelinePlayer(g, t); return; }
  if (g.phase === 'finished') {
    const order = leaders(g, true);
    const place = order.findIndex(x => x.uid === uid) + 1;
    app.innerHTML = `<main class="shell">${top()}<section class="card hero">${iconSvg(t.icon, 72)}<h1>Dere kom på ${place}. plass!</h1><p>${esc(t.name)}</p><h2>Bra jobba! ${totalFor(g, uid)} poeng</h2></section></main>`;
    return;
  }
}

function drawTimelinePlayer(g, t) {
  const YEARS = Array.from({ length: 16 }, (_, i) => 2011 + i);
  const placed = (g.finalAnswers && g.finalAnswers[uid]) || {};
  const cards = revealedSongCards(g);
  const selected = playState.selectedSong;
  const unplaced = cards.filter(s => !placed[s.id]);
  const submitted = !!(g.finalSubmitted && g.finalSubmitted[uid]);
  app.innerHTML = `<main class="shell">${top('EKSTRAOPPGAVE')}<div class="card sticky"><div class="finale-timer-label countdown-label">5:00</div><div class="progress">${Object.keys(placed).length} / 16 plassert</div><div class="small">Trykk på en sang, deretter på ønsket årstall.</div>${(Object.keys(placed).length === 16 && !submitted) ? '<div class="actions"><button class="btn primary" id="finalSubmit">Lever</button></div>' : ''}${submitted ? '<p class="notice">Levert! Du kan fortsatt endre helt til tiden er ute.</p>' : ''}</div><div class="spacer"></div><section class="card"><h2>Uplasserte sanger</h2><div class="bank">${unplaced.map(s => `<button class="song-card ${selected === s.id ? 'selected' : ''}" data-song="${s.id}"><div class="song-title">${esc(s.title)}</div><div class="small">${esc(s.artist)}</div></button>`).join('') || '<div class="small">Alle sanger er plassert.</div>'}</div></section><div class="spacer"></div><section class="timeline">${YEARS.map(y => { const sid = Object.entries(placed).find(([, yy]) => Number(yy) === y)?.[0]; const s = cards.find(x => x.id === Number(sid)); return `<button class="year-slot" data-year="${y}"><div class="year">${y}</div>${s ? `<div class="song-card"><div class="song-title">${esc(s.title)}</div><div class="small">${esc(s.artist)}</div></div>` : '<div class="small">Trykk for å plassere valgt sang</div>'}</button>`; }).join('')}</section></main>`;
  document.querySelectorAll('[data-song]').forEach(b => b.onclick = () => { playState.selectedSong = Number(b.dataset.song); drawTimelinePlayer(g, t); });
  document.querySelectorAll('[data-year]').forEach(b => b.onclick = async () => {
    if (!selected) return;
    const year = Number(b.dataset.year);
    const updates = {};
    for (const [sid, yy] of Object.entries(placed)) if (Number(yy) === year) updates[sid] = null;
    updates[selected] = year;
    await FB.update(R(`eliquiz/${playState.kode}/finalAnswers/${uid}`), updates);
    playState.selectedSong = null;
  });
  const fs = document.querySelector('#finalSubmit');
  if (fs) fs.onclick = () => FB.set(R(`eliquiz/${playState.kode}/finalSubmitted/${uid}`), true);
}

// ══════════════════════════════════ HOST ══════════════════════════════════

let hostState = { kode: null, unsub: null, quiz: null, spotify: null, spotifyBusy: false, spotifyMsg: '', spotifyEditingClientId: false, lastGame: null, actionError: '' };
function redrawHost() { if (hostState.lastGame) drawHost(hostState.lastGame); }

async function renderHost() {
  app.innerHTML = `<main class="shell">${top('HOST')}<section class="card hero"><p>Kobler til…</p></section></main>`;
  try {
    await ensureAuth();
    hostState.quiz = await import('./quiz-data-host.js');
  } catch (e) {
    app.innerHTML = `<main class="shell">${top('HOST')}<section class="card"><p class="notice">Klarte ikke å laste quizmotoren. Sjekk nettet og last siden på nytt.</p></section></main>`;
    return;
  }
  // Spotify er valgfritt og skal aldri kunne blokkere quizmotoren.
  try {
    hostState.spotify = await import('./spotify.js');
    await hostState.spotify.handleRedirectCallback();
  } catch (e) { console.warn('Spotify-modul kunne ikke lastes', e); }
  const savedKode = localStorage.getItem(LS.host);
  if (savedKode) {
    const snap = await FB.get(R('eliquiz/' + savedKode));
    if (snap.exists() && snap.val().owner === uid) { subscribeHost(savedKode); return; }
    localStorage.removeItem(LS.host);
  }
  renderHostLanding();
}

function renderHostLanding(error = '') {
  app.innerHTML = `<main class="shell">${top('HOST')}<section class="card hero"><h1>Nytt spill</h1><p>Opprett en ny musikkquiz og få en spillkode/QR-kode lagene kan bli med på.</p><div class="actions"><button class="btn primary" id="create">Opprett spill</button></div>${error ? `<p class="notice">${esc(error)}</p>` : ''}</section></main>`;
  document.querySelector('#create').onclick = async () => {
    document.querySelector('#create').disabled = true;
    const kode = romkode();
    try {
      await FB.set(R('eliquiz/' + kode), {
        owner: uid, createdAt: Date.now(), phase: 'lobby', currentRound: 0, roundStatus: 'ready', podiumStep: 0,
      });
      localStorage.setItem(LS.host, kode);
      localStorage.setItem(LS.screen, kode);
      subscribeHost(kode);
    } catch (e) {
      renderHostLanding(e && e.message ? `Kunne ikke opprette spill: ${e.message}` : 'Kunne ikke opprette spill. Sjekk internett-tilkoblingen.');
    }
  };
}

function subscribeHost(kode) {
  hostState.kode = kode;
  localStorage.setItem(LS.screen, kode);
  if (hostState.unsub) hostState.unsub();
  hostState.unsub = FB.onValue(R('eliquiz/' + kode), snap => {
    const g = snap.val();
    if (!g) return;
    drawHost(g);
  });
}

function drawHost(g) {
  hostState.lastGame = g;
  updateLivePlayback(g);
  const { songForRound } = hostState.quiz;
  const song = g.phase === 'music' ? songForRound(g.currentRound || 0) : null;
  const teams = Object.entries(g.teams || {}).map(([teamUid, t]) => ({ uid: teamUid, ...t }));
  const answered = song ? teams.filter(t => g.answers && g.answers[t.uid] && g.answers[t.uid][g.currentRound] && (g.answers[t.uid][g.currentRound].artist || g.answers[t.uid][g.currentRound].title)).length : 0;

  let mid = '';
  if (g.phase === 'lobby') {
    mid = `<p class="small">Spillkode</p><div class="round-title">${esc(hostState.kode)}</div><div class="qr-wrap"><div id="qrboxHost" class="qr-box"></div><p class="small">Vis storskjermen så lagene kan skanne QR-koden — eller la dem gå til /play og skrive inn koden selv.</p></div>`;
  } else if (g.phase === 'music') mid = hostMusicPanel(g, song, answered, teams);
  else if (g.phase === 'timeline') mid = hostTimelinePanel(g, teams);
  else if (g.phase === 'finished') mid = `<p>Quizen er ferdig. Bruk knappen for å avsløre pallen på storskjermen, steg for steg.</p>`;

  app.innerHTML = `<main class="shell">${top('HOST')}${connBadge(true)}<button class="btn danger small" id="abortGame">✕ Avbryt quiz</button>${hostState.actionError ? `<p class="notice">${esc(hostState.actionError)}</p>` : ''}${g.phase === 'lobby' ? spotifyPanelHTML() : ''}<div class="spacer"></div><div class="host-grid"><section class="card"><div class="small">Fase: ${g.phase}${g.phase === 'music' ? ` · runde ${g.roundStatus}` : ''}</div><h1>${g.phase === 'music' ? `Sang ${(g.currentRound || 0) + 1} / 16` : g.phase === 'timeline' ? 'Ekstraoppgave' : g.phase === 'finished' ? 'Sluttresultat' : 'Lobby'}</h1>${mid}<div class="actions">${hostActionButtons(g)}</div></section><section class="card"><h2>Lag (${teams.length})</h2><div class="team-grid">${teams.map(t => `<div class="team"><span class="leader-icon">${iconSvg(t.icon, 32)}</span><div><b>${esc(t.name)}</b><div class="small">${musicScoreFor(g, t.uid)} musikk + ${timelineScoreFor(g, t.uid)} ekstra</div></div></div>`).join('') || '<p class="small">Ingen lag ennå.</p>'}</div></section></div></main>`;
  bindHost(g, song, teams);
  if (g.phase === 'lobby') renderQrInto('qrboxHost', hostState.kode);
}

function spotifyPanelHTML() {
  const sp = hostState.spotify;
  const msg = hostState.spotifyMsg ? `<p class="notice">${esc(hostState.spotifyMsg)}</p>` : '';
  if (!sp) return `<div class="card"><h2>Spotify</h2><p class="small">Spotify-modulen kunne ikke lastes. Bruk "Åpne / spill manuelt" under hver sang i stedet.</p></div>`;
  if (!sp.isConfigured() || hostState.spotifyEditingClientId) {
    return `<div class="card"><h2>Spotify${sp.isConfigured() ? '' : ' (valgfritt)'}</h2><p class="small">Lim inn en gratis Client ID fra <span class="kbd">developer.spotify.com/dashboard</span> for å styre avspillingen herfra. Quizen fungerer helt fint uten — bruk "Åpne / spill manuelt" om du hopper over dette.</p><div class="grid two"><input id="spClientId" class="input" placeholder="Spotify Client ID" value="${esc(sp.getClientId())}"><button class="btn primary" data-sp="save">Lagre</button></div>${msg}</div>`;
  }
  if (!sp.isConnected()) {
    return `<div class="card"><h2>Spotify</h2><span class="pill status-bad">Ikke tilkoblet</span><div class="actions"><button class="btn primary" data-sp="connect">Koble til Spotify</button><button class="btn small" data-sp="editId">Bytt Client ID</button></div>${msg}</div>`;
  }
  return `<div class="card"><h2>Spotify</h2><span class="pill status-ok">✓ Tilkoblet — sanger starter automatisk</span><div class="actions"><button class="btn small" data-sp="disconnect">Koble fra</button></div>${msg}</div>`;
}

function hostMusicPanel(g, song, answered, teams) {
  const clipLink = song.spotifyTrackId ? `<a class="btn" target="_blank" rel="noopener" href="https://open.spotify.com/track/${song.spotifyTrackId}">↗ Åpne / spill manuelt</a>` : '';
  const spReady = hostState.spotify && hostState.spotify.isConnected() && song.spotifyTrackId;
  const spBtns = spReady ? `<button class="btn" data-sp="play" ${hostState.spotifyBusy ? 'disabled' : ''}>▶ Spill på nytt</button><button class="btn" data-sp="pause" ${hostState.spotifyBusy ? 'disabled' : ''}>⏸ Pause</button>` : '';
  if (g.roundStatus === 'revealed') {
    const answerLine = `<p><b>${esc(song.artist)}</b> – ${esc(song.title)} <span class="small">(${song.year})</span></p>`;
    const r = g.results && g.results[g.currentRound];
    return `${answerLine}<h2>Fasit vist</h2><p class="small">${r ? teams.map(t => { const p = (r.perTeam && r.perTeam[t.uid]) || { points: 0 }; return `${esc(t.name)}: ${p.points}p`; }).join(' · ') : ''}</p>`;
  }
  const hiddenNotice = `<p class="small">🔒 Fasit er skjult til du trykker «Sjekk svar».</p>`;
  if (g.roundStatus === 'answering') {
    return `${hiddenNotice}<div class="actions">${spBtns}${clipLink}</div>${g.playback ? countdownBarHTML() : ''}<div class="answer-status">${answered} / ${teams.length} lag har svart</div>`;
  }
  // ready
  return `${hiddenNotice}${song.spotifyTrackId ? `<p class="small">Klipp: ${(song.startMs / 1000).toFixed(0)}s → ${((song.startMs + song.durationMs) / 1000).toFixed(0)}s</p>` : '<p class="small">Denne sangen mangler ennå en Spotify-lenke (plassholder).</p>'}${!spReady && song.spotifyTrackId ? '<p class="small">Koble til Spotify over for automatisk avspilling når du trykker «Start sang».</p>' : ''}`;
}
function hostTimelinePanel(g, teams) {
  const done = teams.filter(t => g.finalSubmitted && g.finalSubmitted[t.uid]).length;
  return `<p class="finale-timer-label countdown-label">5:00</p><p>Ekstraoppgave: lagene plasserer de 16 sangene på riktig årstall.</p><p class="small">Storskjermen viser nedtellingen og spørsmålet «Hvilket år kom sangene ut?».</p><p class="answer-status">${done} / ${teams.length} lag har levert</p>`;
}

function hostActionButtons(g) {
  if (g.phase === 'lobby') return `<button class="btn primary" data-act="start">Start spill</button>`;
  if (g.phase === 'music') {
    if (g.roundStatus === 'ready') return `<button class="btn primary" data-act="startRound">Start sang</button>`;
    if (g.roundStatus === 'answering') return `<button class="btn primary" data-act="check">Sjekk svar</button>`;
    if (g.roundStatus === 'revealed') return (g.currentRound || 0) < 15 ? `<button class="btn primary" data-act="next">Neste spørsmål</button>` : `<button class="btn primary" data-act="startTimeline">Start ekstraoppgave</button>`;
  }
  if (g.phase === 'timeline') return `<button class="btn primary" data-act="endGame">Avslutt spill</button>`;
  if (g.phase === 'finished') {
    const step = g.podiumStep || 0;
    const labels = ['Avslør 3. plass', 'Avslør 2. plass', 'Avslør 1. plass', 'Vis full liste'];
    if (step < 4) return `<button class="btn primary" data-act="podiumNext">${labels[step]}</button>`;
    return `<button class="btn danger" data-act="reset">Nytt spill</button>`;
  }
  return '';
}

function bindHost(g, song, teams) {
  document.querySelectorAll('[data-act]').forEach(b => b.onclick = () => handleHostAction(b.dataset.act, g, song, teams));
  document.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => handleSpotifyAction(b.dataset.sp, song));
  const abortBtn = document.querySelector('#abortGame');
  if (abortBtn) abortBtn.onclick = () => handleHostAction('abort', g, null, teams);
}

async function handleSpotifyAction(action, song) {
  const sp = hostState.spotify;
  if (!sp) return;
  hostState.spotifyMsg = '';
  try {
    if (action === 'save') {
      const val = document.querySelector('#spClientId').value.trim();
      if (!val) return;
      sp.setClientId(val);
      sp.disconnect();
      hostState.spotifyEditingClientId = false;
      redrawHost();
      return;
    }
    if (action === 'editId') { hostState.spotifyEditingClientId = true; redrawHost(); return; }
    if (action === 'connect') { await sp.beginLogin(); return; } // full sideomdirigering, ingen redraw nødvendig
    if (action === 'disconnect') { sp.disconnect(); redrawHost(); return; }
    if (action === 'play') {
      hostState.spotifyBusy = true; redrawHost();
      await FB.update(R(`eliquiz/${hostState.kode}`), { playback: { startedAt: FB.serverTimestamp(), durationMs: song.durationMs } });
      await sp.playClip({ trackId: song.spotifyTrackId, startMs: song.startMs, durationMs: song.durationMs, fadeInMs: 1000 });
      hostState.spotifyBusy = false; redrawHost();
      return;
    }
    if (action === 'pause') {
      hostState.spotifyBusy = true; redrawHost();
      await FB.update(R(`eliquiz/${hostState.kode}`), { playback: null });
      await sp.pause();
      hostState.spotifyBusy = false; redrawHost();
      return;
    }
  } catch (e) {
    hostState.spotifyBusy = false;
    hostState.spotifyMsg = e.message || 'Spotify-feil.';
    redrawHost();
  }
}

async function handleHostAction(act, g, song, teams) {
  const kode = hostState.kode;
  const groot = R(`eliquiz/${kode}`);
  const gref = p => R(`eliquiz/${kode}/${p}`);
  if (act === 'reset') {
    localStorage.removeItem(LS.host);
    renderHostLanding();
    return;
  }
  if (act === 'abort') {
    if (!confirm('Avbryte quizen og starte en ny? Alt som er spilt så langt blir borte, og lagene mister tilgangen.')) return;
    try { await FB.remove(groot); } catch (e) { /* rommet slettes uansett lokalt, selv om fjernsletting feiler */ }
    localStorage.removeItem(LS.host);
    renderHostLanding();
    return;
  }
  hostState.actionError = '';
  try {
    if (act === 'start') { await FB.update(groot, { phase: 'music', currentRound: 0, roundStatus: 'ready' }); return; }
    if (act === 'startRound') {
      await FB.update(groot, { roundStatus: 'answering' });
      if (hostState.spotify && hostState.spotify.isConnected() && song.spotifyTrackId) {
        try {
          await FB.update(groot, { playback: { startedAt: FB.serverTimestamp(), durationMs: song.durationMs } });
          await hostState.spotify.playClip({ trackId: song.spotifyTrackId, startMs: song.startMs, durationMs: song.durationMs, fadeInMs: 1000 });
        } catch (e) { hostState.spotifyMsg = e.message || 'Spotify-feil.'; redrawHost(); }
      }
      return;
    }
    if (act === 'check') {
      const { scoreAnswer } = hostState.quiz;
      const perTeam = {};
      for (const t of teams) {
        const ans = (g.answers && g.answers[t.uid] && g.answers[t.uid][g.currentRound]) || {};
        const d = scoreAnswer(song, ans);
        perTeam[t.uid] = { artistCorrect: !!d.artistCorrect, titleCorrect: !!d.titleCorrect, points: (d.artistCorrect ? 1 : 0) + (d.titleCorrect ? 1 : 0) };
      }
      await FB.update(gref(`results/${g.currentRound}`), { songId: song.id, artist: song.artist, title: song.title, perTeam });
      await FB.update(groot, { roundStatus: 'revealed', playback: null });
      return;
    }
    if (act === 'next') { await FB.update(groot, { currentRound: (g.currentRound || 0) + 1, roundStatus: 'ready', playback: null }); return; }
    if (act === 'startTimeline') { await FB.update(groot, { phase: 'timeline', finaleDeadline: Date.now() + 5 * 60 * 1000 }); return; }
    if (act === 'endGame') { await endGame(g, teams); return; }
    if (act === 'podiumNext') { await FB.update(groot, { podiumStep: Math.min(4, (g.podiumStep || 0) + 1) }); return; }
  } catch (e) {
    hostState.actionError = e && e.message ? e.message : 'Noe gikk galt mot databasen.';
    redrawHost();
  }
}

async function endGame(g, teams) {
  const { songById_ } = hostState.quiz;
  const finalResults = {};
  for (const t of teams) {
    const placed = (g.finalAnswers && g.finalAnswers[t.uid]) || {};
    let correct = 0;
    for (const [songIdStr, year] of Object.entries(placed)) {
      const s = songById_(Number(songIdStr));
      if (s && Number(year) === s.year) correct++;
    }
    finalResults[t.uid] = { correct };
  }
  await FB.set(R(`eliquiz/${hostState.kode}/finalResults`), finalResults);
  await FB.update(R(`eliquiz/${hostState.kode}`), { phase: 'finished', podiumStep: 0 });
}

// ══════════════════════════════════ SCREEN ══════════════════════════════════

let screenState = { kode: null, unsub: null };

function renderScreen() {
  const kode = localStorage.getItem(LS.screen);
  if (!kode) { renderScreenConnect(); return; }
  subscribeScreen(kode);
}
function renderScreenConnect(error = '') {
  app.innerHTML = `<main class="shell">${top()}<section class="card hero"><h1>Storskjerm</h1><p>Skriv inn spillkoden fra host.</p><div class="grid"><input id="code" class="input" placeholder="4821" maxlength="8"><button class="btn primary" id="go">Koble til</button></div>${error ? `<p class="notice">${esc(error)}</p>` : ''}</section></main>`;
  document.querySelector('#go').onclick = () => {
    const kode = document.querySelector('#code').value.trim().toUpperCase();
    if (!kode) return;
    localStorage.setItem(LS.screen, kode);
    subscribeScreen(kode);
  };
}
async function subscribeScreen(kode) {
  screenState.kode = kode;
  try { await loadFirebase(); } catch (e) { renderScreenConnect('Klarte ikke å koble til.'); return; }
  if (screenState.unsub) screenState.unsub();
  screenState.unsub = FB.onValue(R('eliquiz/' + kode), snap => {
    const g = snap.val();
    if (!g) { localStorage.removeItem(LS.screen); renderScreenConnect('Fant ingen quiz med den koden.'); return; }
    drawScreen(g);
  });
}
function drawScreen(g) {
  updateLivePlayback(g);
  if (g.phase === 'lobby') {
    const teams = Object.values(g.teams || {});
    app.innerHTML = `<main class="shell">${top()}<section class="card hero"><h1>Musikkquiz</h1><div class="qr-wrap"><div id="qrboxScreen" class="qr-box"></div></div><p>Skann koden — eller gå til <b>/play</b> og bruk kode</p><div class="round-title">${esc(screenState.kode)}</div><div class="team-grid">${teams.map(t => `<div class="team"><span class="leader-icon">${iconSvg(t.icon, 32)}</span><b>${esc(t.name)}</b></div>`).join('')}</div></section></main>`;
    renderQrInto('qrboxScreen', screenState.kode);
    return;
  }
  if (g.phase === 'music') {
    if (g.roundStatus === 'revealed') { renderRevealAndBoardScreen(g); return; }
    app.innerHTML = `<main class="shell">${top()}<section class="card hero"><div class="small">SANG ${(g.currentRound || 0) + 1} / 16</div><h1>Hvilken artist/film?<span class="sub">Hva heter sangen?</span></h1><p>Svar på mobilen</p>${g.playback ? countdownBarHTML() : ''}</section></main>`;
    return;
  }
  if (g.phase === 'timeline') {
    app.innerHTML = `<main class="shell">${top('EKSTRAOPPGAVE')}<section class="card hero"><div id="ftl" class="finale-timer-label countdown-big">5:00</div><h1>Hvilket år kom sangene ut?</h1><p>Plasser alle 16 sangene på riktig årstall — 2011 til 2026.</p><h2>16 poeng står på spill!</h2></section></main>`;
    return;
  }
  if (g.phase === 'finished') { renderPodiumScreen(g); return; }
}

function renderRevealAndBoardScreen(g) {
  const r = g.results && g.results[g.currentRound];
  const arr = leaders(g, false);
  const oldRects = {};
  document.querySelectorAll('.leader[data-uid]').forEach(el => { oldRects[el.dataset.uid] = el.getBoundingClientRect(); });
  app.innerHTML = `<main class="shell">${top()}<section class="card reveal"><div class="small">SANG ${(g.currentRound || 0) + 1} / 16 — FASIT</div><div class="artist">${esc((r && r.artist) || '')}</div><div class="title">${esc((r && r.title) || '')}</div></section><div class="spacer"></div><section class="card"><h2>Toppliste</h2><div class="leaderboard">${arr.map((t, i) => `<div class="leader" data-uid="${t.uid}"><div class="rank">${i + 1}</div><div class="leader-icon">${iconSvg(t.icon, 40)}</div><div><b>${esc(t.name)}</b></div><div class="score">${musicScoreFor(g, t.uid)}</div></div>`).join('')}</div></section></main>`;
  animateLeaderMove(oldRects);
}

function renderPodiumScreen(g) {
  const step = g.podiumStep || 0;
  const order = leaders(g, true);
  const [first, second, third] = order;
  const slot = (team, place, neededStep) => {
    const shown = step >= neededStep;
    const isNew = step === neededStep;
    if (!shown || !team) return `<div class="podium-slot place-${place}"><div class="podium-rank">${place}.</div><div class="podium-mystery">?</div></div>`;
    return `<div class="podium-slot place-${place} ${isNew ? 'newly' : ''}"><div class="podium-rank">${place}.</div><div class="leader-icon big">${iconSvg(team.icon, 64)}</div><div class="podium-name">${esc(team.name)}</div><div class="podium-score">${totalFor(g, team.uid)} p</div></div>`;
  };
  const stageHtml = `<section class="podium-stage">${slot(third, 3, 1)}${slot(first, 1, 3)}${slot(second, 2, 2)}</section>`;
  let tableHtml = '';
  if (step >= 4) {
    tableHtml = `<section class="card podium-table-in"><h2>Full liste</h2><div class="leaderboard">${order.map((t, i) => `<div class="leader"><div class="rank">${i + 1}</div><div class="leader-icon">${iconSvg(t.icon, 40)}</div><div><b>${esc(t.name)}</b></div><div class="score">${totalFor(g, t.uid)}</div></div>`).join('')}</div></section>`;
  }
  const heading = step === 0 ? 'Trommevirvel…' : 'Sluttresultat';
  app.innerHTML = `<main class="shell">${top()}<section class="card hero"><h1>${heading}</h1></section>${stageHtml}${tableHtml}</main>`;
}

// ══════════════════════════════════ ROUTER ══════════════════════════════════

function render() {
  const r = location.hash.replace('#/', '') || 'home';
  if (r.startsWith('play')) renderPlay();
  else if (r === 'host') renderHost();
  else if (r === 'screen') renderScreen();
  else renderHome();
}
window.addEventListener('hashchange', render);
// Spotifys OAuth-redirect lander tilbake på siden uten hash (redirect_uri
// har ingen #/host), men det er alltid host som logger inn — send dit.
// Dette trigger et hashchange som selv kaller render(), så vi hopper over
// det direkte kallet i denne ene grenen for å unngå å tegne siden to ganger.
if (!location.hash && new URLSearchParams(location.search).has('code')) location.hash = '#/host';
else render();
startCountdownTicker();
