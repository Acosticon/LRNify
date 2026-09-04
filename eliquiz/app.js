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
const COLORS = ['#facc15', '#ef7aa2', '#63c7b2', '#a78bfa', '#fb923c', '#60a5fa', '#34d399', '#f472b6'];

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
function top(title = 'ELIQUIZ') { return `<div class="topbar"><div class="brand">🦋 ${title}</div><div class="pill">LRNify</div></div>`; }
function navigate(r) { location.hash = '#/' + r; }
function connBadge(ok) { return `<div class="pill ${ok ? 'status-ok' : 'status-bad'}">${ok ? '● Tilkoblet' : '○ Kobler til…'}</div>`; }

// ── Synkronisert nedtellingsklokke for avspillingsklipp ──────────────────
// Host skriver playback{startedAt: server-tidsstempel, durationMs} til
// databasen når klippet startes, og fjerner den ved pause. Både host- og
// storskjerm-visningen kan da vise nøyaktig samme nedtelling ved å regne
// ut differansen mot serverens starttidspunkt, i stedet for å stole på at
// alle enheters klokker er synkroniserte.
let livePlayback = null;
let countdownTimerId = null;
function updateLivePlayback(g) { livePlayback = g.playback || null; }
function countdownBarHTML() { return `<div class="countdown"><div class="countdown-track"><div id="clipTimer" class="countdown-fill"></div></div><div id="clipTimerLabel" class="countdown-label"></div></div>`; }
function startCountdownTicker() {
  if (countdownTimerId) return;
  countdownTimerId = setInterval(() => {
    const fillEls = document.querySelectorAll('#clipTimer');
    if (!fillEls.length) return;
    const labelEls = document.querySelectorAll('#clipTimerLabel');
    if (!livePlayback) {
      fillEls.forEach(el => el.style.width = '0%');
      labelEls.forEach(el => el.textContent = '');
      return;
    }
    const remaining = Math.max(0, livePlayback.startedAt + livePlayback.durationMs - Date.now());
    const pct = Math.max(0, Math.min(100, (remaining / livePlayback.durationMs) * 100));
    fillEls.forEach(el => el.style.width = pct + '%');
    labelEls.forEach(el => el.textContent = Math.ceil(remaining / 1000) + 's');
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
    if (final && g.tiebreakerWinner) {
      if (a.uid === g.tiebreakerWinner) return -1;
      if (b.uid === g.tiebreakerWinner) return 1;
    }
    return (a.name || '').localeCompare(b.name || '');
  });
  return arr;
}
function getTieTeams(g) {
  const order = leaders(g, true);
  if (!order.length) return [];
  const best = totalFor(g, order[0].uid);
  return order.filter(t => totalFor(g, t.uid) === best);
}
// Sangkort til tidslinjefinalen: hentes fra det host allerede har avslørt
// under Del 1 (results/{runde}.songId/artist/title) — aldri fra en egen
// "fasit"-fil, og aldri årstall før host avslører finalen.
function revealedSongCards(g) {
  return Object.values(g.results || {})
    .filter(r => r && r.songId && r.title)
    .map(r => ({ id: r.songId, title: r.title, artist: r.artist }))
    .sort((a, b) => a.id - b.id);
}

function renderHome() {
  app.innerHTML = `<main class="shell">${top()}<section class="card hero"><div class="butterfly">🦋</div><h1>Musikkquiz</h1><p>16 låter. 32 poeng i musikkrunden. 16 poeng i tidslinjefinalen.</p><div class="actions"><button class="btn primary" id="play">Spill på mobil</button><button class="btn purple" id="host">Host</button><button class="btn" id="screen">Storskjerm</button></div></section></main>`;
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
  renderJoinForm();
}

function renderJoinForm(error = '') {
  app.innerHTML = `<main class="shell">${top()}<section class="card"><h1>Bli med</h1><label class="label">Spillkode</label><input id="code" class="input" inputmode="text" maxlength="8" placeholder="4821" autocapitalize="characters"><label class="label">Lagnavn</label><input id="name" class="input" maxlength="28" placeholder="Team Sommerfugl"><label class="label">Velg sommerfugl</label><div class="icon-picker">${COLORS.map((c, i) => `<button class="icon-choice ${i === 0 ? 'active' : ''}" data-color="${c}" style="background:${i === 0 ? c : 'white'}">🦋</button>`).join('')}</div><div class="actions"><button class="btn primary" id="join">Bli med</button></div><div id="msg">${error ? `<p class="notice">${esc(error)}</p>` : ''}</div></section></main>`;
  let color = COLORS[0];
  document.querySelectorAll('.icon-choice').forEach(b => b.onclick = () => {
    color = b.dataset.color;
    document.querySelectorAll('.icon-choice').forEach(x => { x.classList.remove('active'); x.style.background = 'white'; });
    b.classList.add('active'); b.style.background = color;
  });
  document.querySelector('#join').onclick = async () => {
    if (playState.joining) return;
    const kode = document.querySelector('#code').value.trim().toUpperCase();
    const name = document.querySelector('#name').value.trim();
    if (!kode || !name) return;
    playState.joining = true;
    try {
      const snap = await FB.get(R('eliquiz/' + kode));
      if (!snap.exists()) { playState.joining = false; renderJoinForm('Fant ingen quiz med den koden.'); return; }
      const existing = snap.val().teams && snap.val().teams[uid];
      if (!existing) {
        await FB.set(R(`eliquiz/${kode}/teams/${uid}`), { name, icon: '🦋', color, joinedAt: Date.now() });
      }
      localStorage.setItem(LS.team, kode);
      subscribePlay(kode);
    } catch (e) {
      playState.joining = false;
      renderJoinForm('Noe gikk galt. Prøv igjen.');
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
  const t = g.teams && g.teams[uid];
  if (!t) { renderJoinForm(); return; }
  if (g.phase === 'lobby') {
    app.innerHTML = `<main class="shell">${top()}<section class="card hero"><div class="butterfly" style="filter:drop-shadow(0 0 12px ${t.color})">${t.icon}</div><h1>${esc(t.name)}</h1><p>Du er med! Venter på at quizen starter.</p><div class="pill">Spillkode ${esc(playState.kode)}</div></section></main>`;
    return;
  }
  if (g.phase === 'music') {
    const round = g.currentRound || 0;
    const result = g.results && g.results[round];
    if (g.roundStatus === 'reveal' || g.roundStatus === 'leaderboard') {
      const perTeam = (result && result.perTeam && result.perTeam[uid]) || { artistCorrect: false, titleCorrect: false, points: 0 };
      app.innerHTML = `<main class="shell">${top()}<section class="card reveal"><div class="small">SANG ${round + 1} / 16</div><div class="artist">${esc((result && result.artist) || '')}</div><div class="title">${esc((result && result.title) || '')}</div><div class="spacer"></div><div class="result-line"><b>Artist</b><b>${perTeam.artistCorrect ? '✅ +1' : '❌ 0'}</b></div><div class="result-line"><b>Sangtittel</b><b>${perTeam.titleCorrect ? '✅ +1' : '❌ 0'}</b></div><h2>+${perTeam.points} poeng</h2></section></main>`;
      return;
    }
    // Uhøytidelig quiz: svaret er alltid redigerbart frem til fasit vises —
    // host sier bare ifra muntlig når det er tid for å gå videre.
    const ans = (g.answers && g.answers[uid] && g.answers[uid][round]) || { artist: '', title: '' };
    app.innerHTML = `<main class="shell">${top()}<section class="card"><div class="small">SANG ${round + 1} / 16</div><h1 class="round-title">Hva hører du?</h1><label class="label">Artist</label><input id="artist" class="input" value="${esc(ans.artist)}" autocomplete="off"><label class="label">Sangtittel</label><input id="title" class="input" value="${esc(ans.title)}" autocomplete="off"><div class="actions"><button class="btn primary" id="submit">${ans.artist || ans.title ? 'Oppdater svar' : 'Send svar'}</button></div><p class="small">Du kan endre svaret helt til fasiten vises.</p></section></main>`;
    document.querySelector('#submit').onclick = () => {
      FB.update(R(`eliquiz/${playState.kode}/answers/${uid}/${round}`), { artist: document.querySelector('#artist').value, title: document.querySelector('#title').value, updatedAt: Date.now() });
    };
    return;
  }
  if (g.phase === 'timeline') { drawTimelinePlayer(g, t); return; }
  if (g.phase === 'tiebreaker') { drawTiebreakerPlayer(g, t); return; }
  if (g.phase === 'finished') {
    const order = leaders(g, true);
    const place = order.findIndex(x => x.uid === uid) + 1;
    app.innerHTML = `<main class="shell">${top()}<section class="card hero"><div class="butterfly">${t.icon}</div><h1>${place}. plass</h1><p>${esc(t.name)}</p><h2>${totalFor(g, uid)} / 48 poeng</h2></section></main>`;
    return;
  }
}

function drawTimelinePlayer(g, t) {
  if (g.timelineStatus === 'revealing') {
    const idx = g.finaleRevealIndex || 0;
    app.innerHTML = `<main class="shell">${top('FINALEN')}<section class="card hero"><div class="butterfly">🦋</div><h1>Se storskjermen!</h1><p>Verten avslører tidslinjen — ${idx} / 16 år vist.</p></section></main>`;
    return;
  }
  const YEARS = Array.from({ length: 16 }, (_, i) => 2011 + i);
  const placed = (g.finalAnswers && g.finalAnswers[uid]) || {};
  const cards = revealedSongCards(g);
  const selected = playState.selectedSong;
  const unplaced = cards.filter(s => !placed[s.id]);
  const submitted = !!(g.finalSubmitted && g.finalSubmitted[uid]);
  app.innerHTML = `<main class="shell">${top('FINALEN')}<div class="card sticky"><div class="progress">${Object.keys(placed).length} / 16 plassert</div><div class="small">Trykk på en sang, deretter på ønsket årstall.</div>${(Object.keys(placed).length === 16 && !submitted) ? '<div class="actions"><button class="btn primary" id="finalSubmit">Lever finalen</button></div>' : ''}${submitted ? '<p class="notice">Finalen er levert. Du kan fortsatt endre til host stenger finalen.</p>' : ''}</div><div class="spacer"></div><section class="card"><h2>Uplasserte sanger</h2><div class="bank">${unplaced.map(s => `<button class="song-card ${selected === s.id ? 'selected' : ''}" data-song="${s.id}"><div class="song-title">${esc(s.title)}</div><div class="small">${esc(s.artist)}</div></button>`).join('') || '<div class="small">Alle sanger er plassert.</div>'}</div></section><div class="spacer"></div><section class="timeline">${YEARS.map(y => { const sid = Object.entries(placed).find(([, yy]) => Number(yy) === y)?.[0]; const s = cards.find(x => x.id === Number(sid)); return `<button class="year-slot" data-year="${y}"><div class="year">${y}</div>${s ? `<div class="song-card"><div class="song-title">${esc(s.title)}</div><div class="small">${esc(s.artist)}</div></div>` : '<div class="small">Trykk for å plassere valgt sang</div>'}</button>`; }).join('')}</section></main>`;
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

function drawTiebreakerPlayer(g, t) {
  const eligible = g.tiebreakerEligible && g.tiebreakerEligible[uid];
  if (!eligible) {
    const tied = getTieTeams(g).map(x => esc(x.name)).join(' vs. ');
    app.innerHTML = `<main class="shell">${top('TIEBREAKER')}<section class="card hero"><h1>Finaleduell</h1><p>${tied || 'Lagene på delt førsteplass'} kjemper om seieren.</p></section></main>`;
    return;
  }
  const old = g.tiebreakerAnswers && g.tiebreakerAnswers[uid];
  app.innerHTML = `<main class="shell">${top('TIEBREAKER')}<section class="card"><h1>The winner takes it all…</h1><label class="label">Artist</label><input id="ta" class="input" ${old ? 'disabled' : ''}><label class="label">Sangtittel</label><input id="tt" class="input" ${old ? 'disabled' : ''}><label class="label">Årstall</label><input id="ty" class="input" inputmode="numeric" ${old ? 'disabled' : ''}><div class="actions"><button id="ts" class="btn primary" ${old ? 'disabled' : ''}>Send svar</button></div>${old ? '<p class="notice">Svaret er sendt. Raskeste helt riktige svar vinner.</p>' : ''}</section></main>`;
  if (!old) document.querySelector('#ts').onclick = () => {
    FB.set(R(`eliquiz/${playState.kode}/tiebreakerAnswers/${uid}`), {
      artist: document.querySelector('#ta').value, title: document.querySelector('#tt').value,
      year: Number(document.querySelector('#ty').value) || 0, answeredAt: FB.serverTimestamp(),
    });
  };
}

// ══════════════════════════════════ HOST ══════════════════════════════════

let hostState = { kode: null, unsub: null, quiz: null, draft: null, spotify: null, spotifyBusy: false, spotifyMsg: '', spotifyEditingClientId: false, lastGame: null, actionError: '' };
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
  app.innerHTML = `<main class="shell">${top('HOST')}<section class="card hero"><h1>Ny quiz</h1><p>Opprett en ny musikkquiz og få en spillkode lagene kan bli med på.</p><div class="actions"><button class="btn primary" id="create">Opprett quiz</button></div>${error ? `<p class="notice">${esc(error)}</p>` : ''}</section></main>`;
  document.querySelector('#create').onclick = async () => {
    document.querySelector('#create').disabled = true;
    const kode = romkode();
    try {
      await FB.set(R('eliquiz/' + kode), {
        owner: uid, createdAt: Date.now(), phase: 'lobby', currentRound: 0, roundStatus: 'ready',
        finalOpen: false, tiebreakerActive: false, tiebreakerResolved: false, finaleRevealIndex: 0,
      });
      localStorage.setItem(LS.host, kode);
      localStorage.setItem(LS.screen, kode);
      subscribeHost(kode);
    } catch (e) {
      renderHostLanding(e && e.message ? `Kunne ikke opprette quiz: ${e.message}` : 'Kunne ikke opprette quiz. Sjekk internett-tilkoblingen.');
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
    if (g.roundStatus !== 'scoring') hostState.draft = null;
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
  if (g.phase === 'lobby') mid = `<p class="small">Spillkode</p><div class="round-title">${esc(hostState.kode)}</div><p class="small">Lagene går til /play og skriver inn koden.</p>`;
  else if (g.phase === 'music') mid = hostMusicPanel(g, song, answered, teams);
  else if (g.phase === 'timeline') mid = hostTimelinePanel(g, teams);
  else if (g.phase === 'tiebreaker') mid = hostTiebreakerPanel(g, teams);
  else if (g.phase === 'finished') mid = `<p>Quizen er ferdig.</p>`;

  app.innerHTML = `<main class="shell">${top('HOST')}${connBadge(true)}${hostState.actionError ? `<p class="notice">${esc(hostState.actionError)}</p>` : ''}${spotifyPanelHTML()}<div class="spacer"></div><div class="host-grid"><section class="card"><div class="small">Fase: ${g.phase}${g.phase === 'music' ? ` · runde ${g.roundStatus}` : ''}</div><h1>${g.phase === 'music' ? `Sang ${(g.currentRound || 0) + 1} / 16` : g.phase === 'timeline' ? 'Tidslinjefinale' : g.phase === 'tiebreaker' ? 'Tiebreaker' : g.phase === 'finished' ? 'Ferdig' : 'Lobby'}</h1>${mid}<div class="actions">${hostActionButtons(g)}</div></section><section class="card"><h2>Lag (${teams.length})</h2><div class="team-grid">${teams.map(t => `<div class="team"><span style="font-size:1.5rem;filter:drop-shadow(0 0 8px ${t.color})">${t.icon}</span><div><b>${esc(t.name)}</b><div class="small">${musicScoreFor(g, t.uid)} musikk + ${timelineScoreFor(g, t.uid)} finale</div></div></div>`).join('') || '<p class="small">Ingen lag ennå.</p>'}</div></section></div></main>`;
  bindHost(g, song, teams);
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
  return `<div class="card"><h2>Spotify</h2><span class="pill status-ok">✓ Tilkoblet</span><div class="actions"><button class="btn small" data-sp="disconnect">Koble fra</button></div>${msg}</div>`;
}

function hostMusicPanel(g, song, answered, teams) {
  const clipLink = song.spotifyTrackId ? `<a class="btn" target="_blank" rel="noopener" href="https://open.spotify.com/track/${song.spotifyTrackId}">↗ Åpne / spill manuelt</a>` : '';
  const spReady = hostState.spotify && hostState.spotify.isConnected() && song.spotifyTrackId;
  const spBtns = spReady ? `<button class="btn primary" data-sp="play" ${hostState.spotifyBusy ? 'disabled' : ''}>▶ Spill klipp</button><button class="btn" data-sp="pause" ${hostState.spotifyBusy ? 'disabled' : ''}>⏸ Pause</button>` : '';
  if (g.roundStatus === 'scoring') {
    if (!hostState.draft) hostState.draft = buildDraft(g, song, teams);
    return `<p><b>${esc(song.artist)}</b> – ${esc(song.title)} <span class="small">(${song.year})</span></p><h2>Overstyr retting før publisering</h2>${teams.map(t => {
      const d = hostState.draft[t.uid] || { artistCorrect: false, titleCorrect: false };
      const ans = (g.answers && g.answers[t.uid] && g.answers[t.uid][g.currentRound]) || { artist: '', title: '' };
      return `<div class="override-row"><div><div class="name">${esc(t.name)}</div><div class="small">${esc(ans.artist) || '—'} / ${esc(ans.title) || '—'}</div></div><button class="toggle ${d.artistCorrect ? 'on' : 'off'}" data-ov="${t.uid}:artist">Artist ${d.artistCorrect ? '✓' : '✗'}</button><button class="toggle ${d.titleCorrect ? 'on' : 'off'}" data-ov="${t.uid}:title">Tittel ${d.titleCorrect ? '✓' : '✗'}</button></div>`;
    }).join('')}`;
  }
  return `<p><b>${esc(song.artist)}</b> – ${esc(song.title)} <span class="small">(${song.year})</span></p><p class="small">Klipp: ${(song.startMs / 1000).toFixed(0)}s → ${((song.startMs + song.durationMs) / 1000).toFixed(0)}s</p><div class="actions">${spBtns}${clipLink}</div>${hostState.spotifyMsg ? `<p class="notice">${esc(hostState.spotifyMsg)}</p>` : ''}${g.playback ? countdownBarHTML() : ''}<div class="answer-status">${answered} / ${teams.length} lag har svart</div>`;
}
function buildDraft(g, song, teams) {
  const { scoreAnswer } = hostState.quiz;
  const draft = {};
  for (const t of teams) {
    const ans = (g.answers && g.answers[t.uid] && g.answers[t.uid][g.currentRound]) || {};
    draft[t.uid] = scoreAnswer(song, ans);
  }
  return draft;
}
function hostTimelinePanel(g, teams) {
  if (g.timelineStatus === 'revealing') {
    const idx = g.finaleRevealIndex || 0;
    const last = idx > 0 ? (g.finaleReveal && g.finaleReveal[idx]) : null;
    return `<p>Avslører tidslinjen på storskjermen: ${idx} / 16 år vist.</p>${last ? `<p class="small">Sist avslørt: ${last.year} — ${esc(last.artist)} – ${esc(last.title)}</p>` : ''}`;
  }
  const done = teams.filter(t => g.finalSubmitted && g.finalSubmitted[t.uid]).length;
  return `<p>Del 2: lagene plasserer de 16 sangene på riktig årstall.</p><p class="answer-status">${done} / ${teams.length} lag har levert finalen</p>`;
}
function hostTiebreakerPanel(g, teams) {
  const tied = getTieTeams(g);
  const answers = g.tiebreakerAnswers || {};
  return `<p>${tied.map(t => esc(t.name)).join(' vs. ')} kjemper om førsteplassen.</p><p class="small">ABBA – The Winner Takes It All – 1980</p>${tied.map(t => `<div class="override-row"><div class="name">${esc(t.name)}</div><div class="small">${answers[t.uid] ? 'Svart' : 'Venter…'}</div></div>`).join('')}`;
}

function hostActionButtons(g) {
  if (g.phase === 'lobby') return `<button class="btn primary" data-act="start">Start quiz</button>`;
  if (g.phase === 'music') {
    if (g.roundStatus === 'ready') return `<button class="btn primary" data-act="open">Åpne svar</button>`;
    if (g.roundStatus === 'answering') return `<button class="btn primary" data-act="close">Steng svar</button>`;
    if (g.roundStatus === 'scoring') return `<button class="btn primary" data-act="publish">Publiser poeng og vis fasit</button>`;
    if (g.roundStatus === 'reveal') return `<button class="btn primary" data-act="leader">Vis leaderboard</button>`;
    if (g.roundStatus === 'leaderboard') return (g.currentRound || 0) < 15 ? `<button class="btn primary" data-act="next">Neste sang</button>` : `<button class="btn primary" data-act="timeline">Start finalen</button>`;
  }
  if (g.phase === 'timeline') {
    if (g.timelineStatus === 'revealing') {
      const idx = g.finaleRevealIndex || 0;
      return idx < 16 ? `<button class="btn primary" data-act="revealNextYear">Neste år (${idx}/16)</button>` : `<button class="btn primary" data-act="finishReveal">Vis sluttresultat</button>`;
    }
    return `<button class="btn primary" data-act="closeFinal">Steng finalen</button>`;
  }
  if (g.phase === 'tiebreaker') {
    const anyAnswered = g.tiebreakerAnswers && Object.keys(g.tiebreakerAnswers).length > 0;
    return `<button class="btn primary" data-act="resolveTie">Avgjør automatisk</button>${anyAnswered ? '' : `<button class="btn" data-act="restartTie">Start på nytt</button>`}`;
  }
  if (g.phase === 'finished') return `<button class="btn danger" data-act="reset">Ny quiz</button>`;
  return '';
}

function bindHost(g, song, teams) {
  document.querySelectorAll('[data-ov]').forEach(b => b.onclick = () => {
    const [teamUid, field] = b.dataset.ov.split(':');
    const key = field === 'artist' ? 'artistCorrect' : 'titleCorrect';
    hostState.draft[teamUid][key] = !hostState.draft[teamUid][key];
    drawHost(g);
  });
  document.querySelectorAll('[data-act]').forEach(b => b.onclick = () => handleHostAction(b.dataset.act, g, song, teams));
  document.querySelectorAll('[data-sp]').forEach(b => b.onclick = () => handleSpotifyAction(b.dataset.sp, song));
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
  hostState.actionError = '';
  try {
    if (act === 'start') { await FB.update(groot, { phase: 'music', currentRound: 0, roundStatus: 'ready' }); return; }
    if (act === 'open') { await FB.update(groot, { roundStatus: 'answering' }); return; }
    if (act === 'close') { await FB.update(groot, { roundStatus: 'scoring', playback: null }); return; }
    if (act === 'publish') {
      const draft = hostState.draft || buildDraft(g, song, teams);
      const perTeam = {};
      for (const t of teams) {
        const d = draft[t.uid] || { artistCorrect: false, titleCorrect: false };
        perTeam[t.uid] = { artistCorrect: !!d.artistCorrect, titleCorrect: !!d.titleCorrect, points: (d.artistCorrect ? 1 : 0) + (d.titleCorrect ? 1 : 0) };
      }
      await FB.update(gref(`results/${g.currentRound}`), { songId: song.id, artist: song.artist, title: song.title, perTeam });
      await FB.update(groot, { roundStatus: 'reveal' });
      hostState.draft = null;
      return;
    }
    if (act === 'leader') { await FB.update(groot, { roundStatus: 'leaderboard' }); return; }
    if (act === 'next') { await FB.update(groot, { currentRound: (g.currentRound || 0) + 1, roundStatus: 'ready', playback: null }); return; }
    if (act === 'timeline') { await FB.update(groot, { phase: 'timeline', timelineStatus: 'open', finalOpen: true }); return; }
    if (act === 'closeFinal') { await closeFinal(g, teams); return; }
    if (act === 'revealNextYear') { await revealNextYear(g); return; }
    if (act === 'finishReveal') { await finishReveal(g, teams); return; }
    if (act === 'resolveTie') { await resolveTiebreaker(g, teams); return; }
    if (act === 'restartTie') {
      await FB.set(gref('tiebreakerAnswers'), null);
      await FB.update(groot, { tiebreakerStartedAt: FB.serverTimestamp() });
      return;
    }
  } catch (e) {
    hostState.actionError = e && e.message ? e.message : 'Noe gikk galt mot databasen.';
    redrawHost();
  }
}

async function closeFinal(g, teams) {
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
  // Ikke gå rett til sluttresultatet ennå — host avslører tidslinjen
  // 2011->2026 år for år på storskjermen først (revealNextYear/finishReveal).
  await FB.update(R(`eliquiz/${hostState.kode}`), { timelineStatus: 'revealing', finalOpen: false, finaleRevealIndex: 0 });
}

async function revealNextYear(g) {
  const { songById_ } = hostState.quiz;
  const index = g.finaleRevealIndex || 0;
  if (index >= 16) return;
  const songId = index + 1; // song-id 1..16 tilsvarer år 2011..2026
  const s = songById_(songId);
  await FB.update(R(`eliquiz/${hostState.kode}/finaleReveal/${songId}`), { year: s.year, artist: s.artist, title: s.title });
  await FB.update(R(`eliquiz/${hostState.kode}`), { finaleRevealIndex: index + 1 });
}

async function finishReveal(g, teams) {
  const finalResults = g.finalResults || {};
  const tie = getTieTeamsFresh(finalResults, teams, g);
  if (tie.length > 1) {
    const eligible = {}; for (const t of tie) eligible[t.uid] = true;
    await FB.update(R(`eliquiz/${hostState.kode}`), { phase: 'tiebreaker', tiebreakerActive: true, tiebreakerStartedAt: FB.serverTimestamp() });
    await FB.set(R(`eliquiz/${hostState.kode}/tiebreakerEligible`), eligible);
    return;
  }
  await FB.update(R(`eliquiz/${hostState.kode}`), { phase: 'finished' });
}
function getTieTeamsFresh(finalResults, teams, g) {
  const withTotals = teams.map(t => ({ uid: t.uid, name: t.name, total: musicScoreFor(g, t.uid) + ((finalResults[t.uid] && finalResults[t.uid].correct) || 0) }));
  withTotals.sort((a, b) => b.total - a.total);
  if (!withTotals.length) return [];
  const best = withTotals[0].total;
  return withTotals.filter(t => t.total === best);
}

async function resolveTiebreaker(g, teams) {
  const { scoreTiebreaker } = hostState.quiz;
  const answers = g.tiebreakerAnswers || {};
  const eligible = Object.keys(g.tiebreakerEligible || {});
  let winner = null, bestTs = Infinity;
  for (const teamUid of eligible) {
    const a = answers[teamUid];
    if (!a) continue;
    if (scoreTiebreaker(a) && typeof a.answeredAt === 'number' && a.answeredAt < bestTs) { bestTs = a.answeredAt; winner = teamUid; }
  }
  await FB.update(R(`eliquiz/${hostState.kode}`), { tiebreakerWinner: winner, tiebreakerResolved: true, phase: 'finished' });
}

// ══════════════════════════════════ SCREEN ══════════════════════════════════

let screenState = { kode: null, unsub: null, rects: {} };

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
    app.innerHTML = `<main class="shell">${top()}<section class="card hero"><div class="butterfly">🦋</div><h1>Musikkquiz</h1><p>Gå til <b>/play</b> og bruk kode</p><div class="round-title">${esc(screenState.kode)}</div><div class="team-grid">${teams.map(t => `<div class="team"><span style="font-size:1.7rem;filter:drop-shadow(0 0 8px ${t.color})">${t.icon}</span><b>${esc(t.name)}</b></div>`).join('')}</div></section></main>`;
    return;
  }
  if (g.phase === 'music') {
    if (g.roundStatus === 'reveal') {
      const r = g.results && g.results[g.currentRound];
      app.innerHTML = `<main class="shell">${top()}<section class="card reveal"><div class="small">SANG ${(g.currentRound || 0) + 1} / 16</div><div class="artist">${esc((r && r.artist) || '')}</div><div class="title">${esc((r && r.title) || '')}</div></section></main>`;
      return;
    }
    if (g.roundStatus === 'leaderboard') { renderLeaderboardScreen(g, false, `Etter sang ${(g.currentRound || 0) + 1}`); return; }
    app.innerHTML = `<main class="shell">${top()}<section class="card hero"><div class="small">SANG ${(g.currentRound || 0) + 1} / 16</div><h1>Hva hører du?</h1><p>Svar på mobilen</p>${g.playback ? countdownBarHTML() : ''}</section></main>`;
    return;
  }
  if (g.phase === 'timeline') {
    if (g.timelineStatus === 'revealing') { renderTimelineRevealScreen(g); return; }
    app.innerHTML = `<main class="shell">${top('FINALEN')}<section class="card hero"><div class="butterfly">🦋</div><h1>2011 → 2026</h1><p>Plasser alle 16 sangene på riktig årstall.</p><h2>16 poeng står på spill!</h2></section></main>`;
    return;
  }
  if (g.phase === 'tiebreaker') {
    const tied = getTieTeams(g);
    app.innerHTML = `<main class="shell">${top('TIEBREAKER')}<section class="card hero"><h1>The winner takes it all…</h1><p>${tied.map(t => esc(t.name)).join(' vs. ')}</p><p>Artist + sangtittel + årstall. Raskeste helt riktige svar vinner.</p></section></main>`;
    return;
  }
  if (g.phase === 'finished') { renderLeaderboardScreen(g, true, 'Sluttresultat'); return; }
}

function renderTimelineRevealScreen(g) {
  const idx = g.finaleRevealIndex || 0;
  const reveal = g.finaleReveal || {};
  const last = idx > 0 ? reveal[idx] : null;
  const chips = [];
  for (let i = 1; i <= idx; i++) { const r = reveal[i]; if (r) chips.push(`<span class="year-chip">🦋 ${r.year}</span>`); }
  const mid = last
    ? `<div class="small">ÅR</div><div class="artist">${last.year}</div><div class="title">${esc(last.artist)} – ${esc(last.title)}</div>`
    : `<h1>Tidslinjen avsløres…</h1><p>Vent på verten</p>`;
  app.innerHTML = `<main class="shell">${top('FINALEN')}<section class="card reveal">${mid}</section><div class="year-chip-row">${chips.join('')}</div></main>`;
}

function renderLeaderboardScreen(g, final, title) {
  const arr = leaders(g, final);
  // FLIP-animasjon: mål gamle posisjoner før vi tegner nye, og la sommerfuglene "fly" til ny plass.
  const oldRects = {};
  document.querySelectorAll('.leader[data-uid]').forEach(el => { oldRects[el.dataset.uid] = el.getBoundingClientRect(); });
  app.innerHTML = `<main class="shell">${top()}<section class="card"><h1>${title}</h1><div class="leaderboard">${arr.map((t, i) => `<div class="leader" data-uid="${t.uid}"><div class="rank">${i + 1}</div><div style="font-size:1.8rem;filter:drop-shadow(0 0 8px ${t.color})">${t.icon}</div><div><b>${esc(t.name)}</b>${final ? `<div class="small">${musicScoreFor(g, t.uid)} + ${timelineScoreFor(g, t.uid)}</div>` : ''}</div><div class="score">${final ? totalFor(g, t.uid) : musicScoreFor(g, t.uid)}</div></div>`).join('')}</div></section></main>`;
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
