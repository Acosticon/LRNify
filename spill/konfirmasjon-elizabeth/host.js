import {
  loadFirebase, dbRef, ensureAuth, ROOM_PATH, TOTAL_ROUNDS,
  generateRoomCode, butterflySvg, mountAmbientButterflies, els,
  answerMatches, computeMusicPoints, animateLeaderboard, leaderboardRows
} from './shared.js';
import { SONGS, ROUND_ORDER, songForRound, TIEBREAKER_SONG } from './songs-data.js';
import * as SP from './spotify.js';

let FB, myUid, roomCode = null, unwatch = null;
const state = { room: null };
let lastKey = null;
let scoringDraft = null;     // { uid: { artistCorrect, titleCorrect } } — kun lokalt før publisering
let scoringDraftRound = null;
let spotifyStatus = '';       // statustekst under Spotify-knappene
const LS_HOST_ROOM = 'konfquiz_host_room';
const LS_SONG_OVERRIDES = 'konfquiz_song_overrides';

function screenEl() { return els('screen'); }
function setScreen(html) { screenEl().innerHTML = html; }
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function songOverrides() { try { return JSON.parse(localStorage.getItem(LS_SONG_OVERRIDES) || '{}'); } catch (e) { return {}; } }
function saveSongOverride(id, patch) {
  const all = songOverrides();
  all[id] = Object.assign({}, all[id], patch);
  localStorage.setItem(LS_SONG_OVERRIDES, JSON.stringify(all));
}
function mergedSong(id) { return Object.assign({}, SONGS[id - 1], songOverrides()[id]); }
function mergedSongForRound(round) { return mergedSong(ROUND_ORDER[round - 1]); }
function mergedTiebreakerSong() { return Object.assign({ id: 'tb' }, TIEBREAKER_SONG, songOverrides()['tb']); }

// ── Boot ─────────────────────────────────────────────────────────────────
(async function init() {
  mountAmbientButterflies(els('bgButterflies'), 7);
  setScreen(loadingHTML('Kobler til…'));
  try {
    FB = await loadFirebase();
    myUid = await ensureAuth();
    await SP.handleRedirectCallback();
  } catch (e) {
    setScreen(`<div class="card center stack"><p class="error-msg">Fikk ikke kontakt med serveren. Sjekk internett og last siden på nytt.</p></div>`);
    return;
  }
  const saved = localStorage.getItem(LS_HOST_ROOM);
  if (saved) { roomCode = saved; subscribeRoom(); }
  else render();
})();

function loadingHTML(msg) { return `<div class="card center stack"><p class="eyebrow">Vertskontroll</p><p>${msg}</p></div>`; }

function subscribeRoom() {
  if (unwatch) unwatch();
  unwatch = FB.onValue(dbRef(`${ROOM_PATH}/${roomCode}`), snap => {
    const val = snap.val();
    if (!val) { state.room = null; render(true); return; }
    state.room = val;
    patchLiveBits();
    render();
  });
}

// ── Oppsett / gjenopptak ─────────────────────────────────────────────────
function render(force) {
  const room = state.room;
  const key = !roomCode ? 'setup' : !room ? 'loading' : room.owner !== myUid ? 'not-owner' :
    room.phase === 'music' ? `music|${room.roundStatus}|${room.currentRound}` :
    room.phase === 'timeline' ? `timeline|${room.timelineStatus}|${room.timelineRevealIndex || '0'}` :
    room.phase === 'tiebreaker' ? `tiebreaker|${room.tiebreakerActive}` : room.phase;
  if (!force && key === lastKey) { patchLiveBits(); return; }
  lastKey = key;
  renderNow(key, room);
}

function renderNow(key, room) {
  if (key === 'setup') return renderSetup();
  if (key === 'loading') return setScreen(loadingHTML('Henter quizen…'));
  if (key === 'not-owner') {
    setScreen(`<div class="card center stack"><p class="error-msg">Dette rommet eies av en annen vert-økt på en annen enhet.</p><button class="btn btn-secondary" id="forgetBtn">Glem dette rommet</button></div>`);
    els('forgetBtn').addEventListener('click', forgetRoom);
    return;
  }
  if (key === 'lobby') return renderLobby(room);
  if (key.startsWith('music|')) return renderMusic(room);
  if (key.startsWith('timeline|')) return renderTimeline(room);
  if (key.startsWith('tiebreaker|')) return renderTiebreaker(room);
  if (key === 'finished') return renderFinished(room);
  setScreen(loadingHTML('Vent litt…'));
}

function forgetRoom() { localStorage.removeItem(LS_HOST_ROOM); roomCode = null; state.room = null; if (unwatch) unwatch(); render(true); }

function renderSetup() {
  setScreen(`
    <div class="stack" style="padding-top:6vh">
      <div class="center stack">
        <p class="eyebrow">Vertskontroll</p>
        <h1 class="title-hero">Elizabeths konfirmasjonsquiz</h1>
        <p class="subtitle">Opprett quizen her. Del koden med lagene, og bruk /screen.html på prosjektoren.</p>
      </div>
      <div class="card stack">
        <button id="createBtn" class="btn btn-primary btn-block btn-lg">OPPRETT NY QUIZ</button>
        <hr class="sep">
        <label class="field-label" for="resumeCode">Gjenoppta et rom du eier</label>
        <div class="row">
          <input id="resumeCode" class="grow input-code" style="font-size:1.1rem;letter-spacing:.2em" maxlength="8" placeholder="KODE">
          <button id="resumeBtn" class="btn btn-secondary">Hent</button>
        </div>
        <div id="setupError" class="error-msg" style="display:none"></div>
      </div>
    </div>
  `);
  els('createBtn').addEventListener('click', createRoom);
  els('resumeBtn').addEventListener('click', () => resumeRoom(els('resumeCode').value));
}

async function createRoom() {
  els('createBtn').disabled = true;
  let code, attempts = 0;
  do {
    code = generateRoomCode();
    const snap = await FB.get(dbRef(`${ROOM_PATH}/${code}`));
    if (!snap.exists()) break;
    attempts++;
  } while (attempts < 8);
  const room = {
    owner: myUid, createdAt: Date.now(), title: 'Elizabeths konfirmasjonsquiz',
    phase: 'lobby', currentRound: '1', roundStatus: 'ready', timelineStatus: 'intro',
    timelineRevealIndex: '0', tiebreakerActive: false
  };
  try {
    await FB.set(dbRef(`${ROOM_PATH}/${code}`), room);
    roomCode = code;
    localStorage.setItem(LS_HOST_ROOM, code);
    subscribeRoom(); // kan rendre om skjermen synkront (lobby) — ikke anta at oppsett-DOM-en fortsatt finnes under
  } catch (e) {
    console.error('Klarte ikke å opprette quizen:', e);
    const errEl = els('setupError');
    if (errEl) { errEl.textContent = 'Klarte ikke å opprette quizen: ' + (e.code || e.message || e); errEl.style.display = 'block'; }
  }
  const btn = els('createBtn');
  if (btn) btn.disabled = false;
}

async function resumeRoom(code) {
  const clean = (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const snap = await FB.get(dbRef(`${ROOM_PATH}/${clean}`));
  const errEl = els('setupError');
  if (!snap.exists()) { errEl.textContent = 'Fant ikke det rommet.'; errEl.style.display = 'block'; return; }
  if (snap.val().owner !== myUid) { errEl.textContent = 'Du eier ikke dette rommet fra denne enheten.'; errEl.style.display = 'block'; return; }
  roomCode = clean;
  localStorage.setItem(LS_HOST_ROOM, clean);
  state.room = snap.val();
  subscribeRoom();
  render(true);
}

// ── Live-tall som oppdateres uten full ombygging ────────────────────────
function patchLiveBits() {
  const room = state.room;
  if (!room) return;
  const teamCount = Object.keys(room.teams || {}).length;
  const teamCountEl = els('teamCount');
  if (teamCountEl) teamCountEl.textContent = String(teamCount);

  const answerCountEl = els('answerCount');
  if (answerCountEl && room.phase === 'music') {
    const answered = Object.keys((room.answers && room.answers[room.currentRound]) || {}).length;
    answerCountEl.textContent = `${answered} av ${teamCount} lag har svart`;
  }
  const deliveredEl = els('deliveredCount');
  if (deliveredEl && room.phase === 'timeline') {
    const delivered = Object.values(room.timeline || {}).filter(t => t && t.submitted).length;
    deliveredEl.textContent = `${delivered} av ${teamCount} lag har levert`;
  }
  const tbCountEl = els('tbCount');
  if (tbCountEl && room.phase === 'tiebreaker') {
    const tied = Object.keys(room.tiebreakerTeams || {});
    const answered = tied.filter(uid => room.tiebreaker && room.tiebreaker[uid]).length;
    tbCountEl.textContent = `${answered} av ${tied.length} har svart`;
  }
  refreshTeamsList();
}
function refreshTeamsList() {
  const list = els('teamsList');
  if (!list) return;
  const room = state.room;
  const teams = Object.entries(room.teams || {}).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
  list.innerHTML = teams.length
    ? teams.map(([uid, t]) => `<div class="row" style="padding:4px 0">${butterflySvg(t.icon, 26)}<span>${esc(t.name)}</span></div>`).join('')
    : `<p class="hint">Ingen lag har blitt med ennå.</p>`;
}

// ── Header/kontrollbar som gjenbrukes i mange skjermer ──────────────────
function topBarHTML(room) {
  return `<div class="row-between">
    <div class="row"><span class="status-pill live"><span class="dot"></span>KODE ${roomCode}</span></div>
    <a href="screen.html" target="_blank" class="btn btn-ghost btn-sm">Åpne /screen ↗</a>
  </div>`;
}

// ── Lobby ────────────────────────────────────────────────────────────────
function joinUrl() {
  return `${location.origin}${location.pathname.replace('host.html', 'play.html')}?code=${roomCode}`;
}

function renderLobby(room) {
  const url = joinUrl();
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(url)}`;
  setScreen(`
    <div class="stack">
      ${topBarHTML(room)}
      <div class="card center stack">
        <p class="eyebrow">Spillkode — del med lagene</p>
        <p class="big-number">${roomCode}</p>
        <p class="hint">Gå til <b>${location.origin}${location.pathname.replace('host.html', 'play.html')}</b></p>
        <div style="background:#fff;border-radius:16px;padding:12px;display:inline-block;line-height:0">
          <img src="${qrSrc}" width="220" height="220" alt="QR-kode til å bli med i quizen" onerror="this.style.display='none'">
        </div>
        <p class="hint">Skann for å bli med direkte</p>
      </div>
      <div class="card stack">
        <div class="row-between"><p class="eyebrow" style="margin:0">Lag klare</p><span class="status-pill"><span id="teamCount">0</span> lag</span></div>
        <div id="teamsList"></div>
      </div>
      <button id="startBtn" class="btn btn-primary btn-block btn-lg">START QUIZ</button>
      <button id="resetBtn" class="btn btn-ghost btn-sm">Slett dette rommet</button>
    </div>
  `);
  refreshTeamsList();
  els('startBtn').addEventListener('click', async () => {
    await FB.update(dbRef(`${ROOM_PATH}/${roomCode}`), { phase: 'music', roundStatus: 'ready', currentRound: '1' });
  });
  els('resetBtn').addEventListener('click', async () => {
    if (!confirm('Slette hele rommet? Dette kan ikke angres.')) return;
    await FB.remove(dbRef(`${ROOM_PATH}/${roomCode}`));
    forgetRoom();
  });
}

// ── Musikkrunder ─────────────────────────────────────────────────────────
function renderMusic(room) {
  const round = Number(room.currentRound);
  const song = mergedSongForRound(round);
  if (room.roundStatus !== 'scoring') { scoringDraft = null; scoringDraftRound = null; }

  setScreen(`
    <div class="stack">
      ${topBarHTML(room)}
      <div class="card stack">
        <div class="row-between">
          <p class="round-badge">SANG ${round} / ${TOTAL_ROUNDS}</p>
          <span class="status-pill" id="answerCount">–</span>
        </div>
        <hr class="sep">
        <p class="eyebrow">Fasit (kun du ser dette)</p>
        <p class="reveal-artist">${esc(song.artist)}</p>
        <p class="reveal-title" style="font-size:1.4rem">${esc(song.title)}</p>
        ${spotifyPanelHTML(song)}
      </div>
      <div class="card stack" id="roundBody"></div>
    </div>
  `);
  wireSpotifyPanel(song);
  renderRoundBody(room, round, song);
}

function renderRoundBody(room, round, song) {
  const body = els('roundBody');
  if (room.roundStatus === 'ready') {
    body.innerHTML = `<p class="hint center">Klar til å åpne for svar.</p><button id="openBtn" class="btn btn-primary btn-block btn-lg">ÅPNE FOR SVAR</button>`;
    els('openBtn').addEventListener('click', () => FB.update(dbRef(`${ROOM_PATH}/${roomCode}`), { roundStatus: 'answering' }));
  } else if (room.roundStatus === 'answering') {
    body.innerHTML = `<p class="hint center">Lagene svarer nå.</p><button id="closeBtn" class="btn btn-primary btn-block btn-lg">STENG SVAR</button>`;
    els('closeBtn').addEventListener('click', () => { FB.update(dbRef(`${ROOM_PATH}/${roomCode}`), { roundStatus: 'scoring' }); });
  } else if (room.roundStatus === 'scoring') {
    renderScoring(room, round, song, body);
  } else if (room.roundStatus === 'reveal') {
    body.innerHTML = `<button id="lbBtn" class="btn btn-primary btn-block btn-lg">VIS LEDERTAVLE</button>`;
    els('lbBtn').addEventListener('click', () => FB.update(dbRef(`${ROOM_PATH}/${roomCode}`), { roundStatus: 'leaderboard' }));
  } else if (room.roundStatus === 'leaderboard') {
    const rows = leaderboardRows(room);
    const isLast = round >= TOTAL_ROUNDS;
    body.innerHTML = `
      <div class="leaderboard" id="lbHost"></div>
      <div class="btn-row">
        <button id="editBtn" class="btn btn-ghost btn-sm">Rediger rettingen for denne sangen</button>
      </div>
      <button id="nextBtn" class="btn btn-primary btn-block btn-lg">${isLast ? 'GÅ TIL FINALEN' : 'NESTE SANG'}</button>
    `;
    animateLeaderboard(els('lbHost'), rows, null);
    els('editBtn').addEventListener('click', () => FB.update(dbRef(`${ROOM_PATH}/${roomCode}`), { roundStatus: 'scoring' }));
    els('nextBtn').addEventListener('click', () => (isLast ? goToFinale() : nextRound(round)));
  }
}

function renderScoring(room, round, song, body) {
  const teams = room.teams || {};
  const answers = (room.answers && room.answers[round]) || {};
  if (scoringDraft === null || scoringDraftRound !== round) {
    scoringDraft = {};
    Object.keys(teams).forEach(uid => {
      const a = answers[uid];
      if (a && typeof a.artistCorrect === 'boolean' && typeof a.titleCorrect === 'boolean') {
        // allerede rettet/publisert tidligere — start fra det verten sist bestemte, ikke fra automatikken på nytt
        scoringDraft[uid] = { artistCorrect: a.artistCorrect, titleCorrect: a.titleCorrect };
      } else if (a) {
        const auto = computeMusicPoints(a, song);
        scoringDraft[uid] = { artistCorrect: auto.artistCorrect, titleCorrect: auto.titleCorrect };
      } else {
        scoringDraft[uid] = { artistCorrect: false, titleCorrect: false };
      }
    });
    scoringDraftRound = round;
  }
  const rows = Object.keys(teams).map(uid => {
    const a = answers[uid];
    const d = scoringDraft[uid];
    const pts = (d.artistCorrect ? 1 : 0) + (d.titleCorrect ? 1 : 0);
    return `<div class="card-tight" style="background:rgba(255,255,255,.04);border-radius:14px;margin-bottom:8px">
      <div class="row-between"><b>${esc(teams[uid].name)}</b><span class="lb-score" style="font-size:1rem">${pts}p</span></div>
      ${a ? `<p class="hint">Svarte: «${esc(a.artist || '—')}» / «${esc(a.title || '—')}»</p>` : `<p class="hint">Ikke svart</p>`}
      <div class="btn-row">
        <button class="btn btn-sm ${d.artistCorrect ? 'btn-primary' : 'btn-secondary'}" data-uid="${uid}" data-field="artistCorrect">Artist ${d.artistCorrect ? '✅' : '❌'}</button>
        <button class="btn btn-sm ${d.titleCorrect ? 'btn-primary' : 'btn-secondary'}" data-uid="${uid}" data-field="titleCorrect">Tittel ${d.titleCorrect ? '✅' : '❌'}</button>
      </div>
    </div>`;
  }).join('');
  body.innerHTML = `<p class="eyebrow center">Rett svarene — trykk for å overstyre</p>${rows}
    <button id="publishBtn" class="btn btn-primary btn-block btn-lg">PUBLISER FASIT OG POENG</button>`;
  body.querySelectorAll('button[data-field]').forEach(btn => {
    btn.addEventListener('click', () => {
      const uid = btn.dataset.uid, field = btn.dataset.field;
      scoringDraft[uid][field] = !scoringDraft[uid][field];
      renderScoring(room, round, song, body);
    });
  });
  els('publishBtn').addEventListener('click', () => publishRoundScores(room, round));
}

async function publishRoundScores(room, round) {
  const updates = {};
  const teams = room.teams || {};
  const justPoints = {};
  Object.keys(teams).forEach(uid => {
    const d = scoringDraft[uid] || { artistCorrect: false, titleCorrect: false };
    const points = (d.artistCorrect ? 1 : 0) + (d.titleCorrect ? 1 : 0);
    justPoints[uid] = points;
    updates[`answers/${round}/${uid}/artistCorrect`] = d.artistCorrect;
    updates[`answers/${round}/${uid}/titleCorrect`] = d.titleCorrect;
    updates[`answers/${round}/${uid}/points`] = points;
    updates[`answers/${round}/${uid}/scoredAt`] = FB.serverTimestamp();
  });
  Object.keys(teams).forEach(uid => {
    let music = 0;
    for (let r = 1; r <= TOTAL_ROUNDS; r++) {
      if (r === round) music += justPoints[uid];
      else music += (room.answers && room.answers[r] && room.answers[r][uid] && room.answers[r][uid].points) || 0;
    }
    const timeline = (room.scores && room.scores[uid] && room.scores[uid].timeline) || 0;
    updates[`scores/${uid}/music`] = music;
    updates[`scores/${uid}/timeline`] = timeline;
    updates[`scores/${uid}/total`] = music + timeline;
  });
  updates.roundStatus = 'reveal';
  await FB.update(dbRef(`${ROOM_PATH}/${roomCode}`), updates);
}

async function nextRound(round) {
  await FB.update(dbRef(`${ROOM_PATH}/${roomCode}`), { currentRound: String(round + 1), roundStatus: 'ready' });
}

async function goToFinale() {
  const updates = { phase: 'timeline', timelineStatus: 'intro', timelineRevealIndex: '0' };
  SONGS.forEach(s => { updates[`timelineCards/${s.id}`] = { title: s.title, artist: s.artist }; });
  await FB.update(dbRef(`${ROOM_PATH}/${roomCode}`), updates);
}

// ── Spotify-panel (delt mellom rundene) ─────────────────────────────────
function spotifyPanelHTML(song) {
  const configured = SP.isConfigured();
  const connected = SP.isConnected();
  return `<div class="card-tight" style="background:rgba(0,0,0,.18);border-radius:14px;margin-top:10px">
    <p class="eyebrow">Spotify</p>
    ${!configured ? `
      <p class="hint">Sett opp en gratis Spotify-app på <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener">developer.spotify.com/dashboard</a>
      med Redirect URI satt til <code>${location.href.split('?')[0]}</code>, og lim inn Client ID under.</p>
      <div class="row"><input id="spClientId" type="text" placeholder="Spotify Client ID" class="grow"><button id="spSaveId" class="btn btn-secondary btn-sm">Lagre</button></div>
    ` : !connected ? `
      <button id="spConnect" class="btn btn-secondary">KOBLE TIL SPOTIFY</button>
      <button id="spForget" class="btn btn-ghost btn-sm">Bytt Client ID</button>
    ` : `
      <div class="row" style="margin-bottom:8px">
        <input id="spTrackId" type="text" placeholder="Spotify track-ID" value="${esc(song.spotifyTrackId || '')}" class="grow">
      </div>
      <div class="row" style="margin-bottom:8px">
        <input id="spStart" type="number" min="0" placeholder="Start (sek)" value="${(song.startMs || 0) / 1000}" style="width:90px">
        <input id="spDur" type="number" min="1" placeholder="Lengde (sek)" value="${(song.durationMs || 25000) / 1000}" style="width:90px">
        <button id="spSaveSong" class="btn btn-secondary btn-sm">Lagre</button>
      </div>
      <div class="btn-row">
        <button id="spPlay" class="btn btn-primary">▶ SPILL KLIPP</button>
        <button id="spPause" class="btn btn-secondary">⏸ PAUSE</button>
        <button id="spReplay" class="btn btn-secondary">↻ SPILL IGJEN</button>
      </div>
    `}
    <p class="hint" id="spStatus">${spotifyStatus}</p>
    <button id="spManual" class="btn btn-secondary btn-block" style="margin-top:8px">ÅPNE / SPILL MANUELT</button>
  </div>`;
}

function wireSpotifyPanel(song) {
  const manualBtn = els('spManual');
  if (manualBtn) manualBtn.addEventListener('click', () => {
    const id = els('spTrackId') ? els('spTrackId').value.trim() : song.spotifyTrackId;
    if (!id) { setSpStatus('Ingen Spotify-lenke lagt inn for denne sangen ennå.'); return; }
    SP.openManually(id);
  });
  const saveIdBtn = els('spSaveId');
  if (saveIdBtn) saveIdBtn.addEventListener('click', () => {
    SP.setClientId(els('spClientId').value);
    render(true);
  });
  const connectBtn = els('spConnect');
  if (connectBtn) connectBtn.addEventListener('click', () => SP.beginLogin().catch(e => setSpStatus(e.message)));
  const forgetBtn = els('spForget');
  if (forgetBtn) forgetBtn.addEventListener('click', () => { localStorage.removeItem('konfquiz_spotify_client_id'); render(true); });
  const saveSongBtn = els('spSaveSong');
  if (saveSongBtn) saveSongBtn.addEventListener('click', () => {
    saveSongOverride(song.id, {
      spotifyTrackId: els('spTrackId').value.trim(),
      startMs: Math.max(0, Number(els('spStart').value || 0)) * 1000,
      durationMs: Math.max(1, Number(els('spDur').value || 25)) * 1000
    });
    render(true);
  });
  const playBtn = els('spPlay');
  if (playBtn) playBtn.addEventListener('click', async () => {
    setSpStatus('Starter avspilling…');
    try {
      const id = els('spTrackId').value.trim();
      const startMs = Math.max(0, Number(els('spStart').value || 0)) * 1000;
      const durationMs = Math.max(1, Number(els('spDur').value || 25)) * 1000;
      await SP.playClip({ trackId: id, startMs, durationMs });
      setSpStatus('Spiller klipp…');
    } catch (e) { setSpStatus('Spotify-feil: ' + e.message + ' — bruk «Åpne/spill manuelt» i stedet.'); }
  });
  const pauseBtn = els('spPause');
  if (pauseBtn) pauseBtn.addEventListener('click', async () => {
    try { await SP.pause(); setSpStatus('Pauset.'); } catch (e) { setSpStatus('Spotify-feil: ' + e.message); }
  });
  const replayBtn = els('spReplay');
  if (replayBtn) replayBtn.addEventListener('click', () => playBtn && playBtn.click());
}
function setSpStatus(msg) { spotifyStatus = msg; const el = els('spStatus'); if (el) el.textContent = msg; }

// ── Tidslinjefinale ──────────────────────────────────────────────────────
function renderTimeline(room) {
  const status = room.timelineStatus;
  if (status === 'intro') {
    setScreen(`<div class="stack">${topBarHTML(room)}
      <div class="card center stack">
        <p class="eyebrow">FINALEN</p>
        <p>16 sangkort er publisert til lagene sine tidslinjer.</p>
        <button id="openFinaleBtn" class="btn btn-primary btn-block btn-lg">ÅPNE FINALEN</button>
      </div></div>`);
    els('openFinaleBtn').addEventListener('click', () => FB.update(dbRef(`${ROOM_PATH}/${roomCode}`), { timelineStatus: 'open' }));
  } else if (status === 'open') {
    setScreen(`<div class="stack">${topBarHTML(room)}
      <div class="card center stack">
        <p class="eyebrow">FINALEN PÅGÅR</p>
        <span class="status-pill live"><span class="dot"></span><span id="deliveredCount">–</span></span>
        <button id="closeFinaleBtn" class="btn btn-primary btn-block btn-lg">STENG FINALEN</button>
      </div></div>`);
    els('closeFinaleBtn').addEventListener('click', () => FB.update(dbRef(`${ROOM_PATH}/${roomCode}`), { timelineStatus: 'closed' }));
  } else if (status === 'closed') {
    setScreen(`<div class="stack">${topBarHTML(room)}
      <div class="card center stack">
        <p class="eyebrow">FINALEN ER STENGT</p>
        <button id="revealBtn" class="btn btn-primary btn-block btn-lg">AVSLØR FASIT</button>
      </div></div>`);
    els('revealBtn').addEventListener('click', () => FB.update(dbRef(`${ROOM_PATH}/${roomCode}`), { timelineStatus: 'revealing', timelineRevealIndex: '0' }));
  } else if (status === 'revealing') {
    renderTimelineRevealing(room);
  } else if (status === 'results') {
    const rows = leaderboardRows(room);
    setScreen(`<div class="stack">${topBarHTML(room)}
      <div class="card stack"><p class="eyebrow center">SLUTTRESULTAT</p><div class="leaderboard" id="lbHost"></div></div>
      <div id="tieBox"></div>
    </div>`);
    animateLeaderboard(els('lbHost'), rows, null);
    renderTieBox(rows);
  }
}

function renderTimelineRevealing(room) {
  const index = Number(room.timelineRevealIndex || 0);      // antall år avslørt så langt (0–16)
  const allRevealed = index >= TOTAL_ROUNDS;
  const year = index >= 1 ? 2010 + index : null;             // sist avslørte år
  const song = index >= 1 ? mergedSong(index) : null;        // song.id === index for index 1..16
  setScreen(`<div class="stack">${topBarHTML(room)}
    <div class="card center stack">
      <p class="eyebrow">FINALE-FASIT</p>
      ${index === 0 ? `<p class="hint">Trykk for å avsløre 2011.</p>` : `
        <p class="round-badge">${year}</p>
        <p class="reveal-artist">${esc(song.artist)}</p>
        <p class="reveal-title" style="font-size:1.6rem">${esc(song.title)}</p>
      `}
      ${!allRevealed
        ? `<button id="nextYearBtn" class="btn btn-primary btn-block btn-lg">AVSLØR ${index === 0 ? 2011 : year + 1}</button>`
        : `<button id="showResultsBtn" class="btn btn-primary btn-block btn-lg">VIS SLUTTRESULTAT</button>`}
    </div></div>`);
  const nextBtn = els('nextYearBtn');
  if (nextBtn) nextBtn.addEventListener('click', () => FB.update(dbRef(`${ROOM_PATH}/${roomCode}`), { timelineRevealIndex: String(index + 1) }));
  const resultsBtn = els('showResultsBtn');
  if (resultsBtn) resultsBtn.addEventListener('click', () => finalizeTimelineScores(room));
}

async function finalizeTimelineScores(room) {
  const updates = {};
  const teams = room.teams || {};
  Object.keys(teams).forEach(uid => {
    const placements = (room.timeline && room.timeline[uid] && room.timeline[uid].placements) || {};
    let timeline = 0;
    SONGS.forEach(s => { if (placements[s.id] === String(s.year)) timeline += 1; });
    const music = (room.scores && room.scores[uid] && room.scores[uid].music) || 0;
    updates[`scores/${uid}/music`] = music;
    updates[`scores/${uid}/timeline`] = timeline;
    updates[`scores/${uid}/total`] = music + timeline;
  });
  updates.timelineStatus = 'results';
  await FB.update(dbRef(`${ROOM_PATH}/${roomCode}`), updates);
}

function renderTieBox(rows) {
  const box = els('tieBox');
  if (!box || !rows.length) return;
  const top = rows[0].total;
  const tied = rows.filter(r => r.total === top);
  if (tied.length > 1) {
    box.innerHTML = `<div class="card center stack">
      <p class="eyebrow">DELT FØRSTEPLASS</p>
      <p>${tied.map(t => esc(t.name)).join(', ')} deler førsteplassen med ${top} poeng.</p>
      <button id="startTbBtn" class="btn btn-primary btn-block btn-lg">START TIEBREAKER</button>
    </div>`;
    els('startTbBtn').addEventListener('click', async () => {
      const tbTeams = {};
      tied.forEach(t => { tbTeams[t.uid] = true; });
      await FB.update(dbRef(`${ROOM_PATH}/${roomCode}`), { phase: 'tiebreaker', tiebreakerActive: true, tiebreakerTeams: tbTeams });
    });
  } else {
    box.innerHTML = `<button id="finishBtn" class="btn btn-primary btn-block btn-lg">AVSLUTT QUIZEN</button>`;
    els('finishBtn').addEventListener('click', () => FB.update(dbRef(`${ROOM_PATH}/${roomCode}`), { phase: 'finished' }));
  }
}

// ── Tiebreaker ───────────────────────────────────────────────────────────
function renderTiebreaker(room) {
  const tied = Object.keys(room.tiebreakerTeams || {});
  setScreen(`<div class="stack">${topBarHTML(room)}
    <div class="card stack">
      <p class="eyebrow">TIEBREAKER</p>
      <p class="reveal-artist">${TIEBREAKER_SONG.artist}</p>
      <p class="reveal-title" style="font-size:1.4rem">${TIEBREAKER_SONG.title} (${TIEBREAKER_SONG.year})</p>
      ${spotifyPanelHTML(mergedTiebreakerSong())}
      <span class="status-pill live"><span class="dot"></span><span id="tbCount">–</span></span>
    </div>
    <div class="card stack" id="tbAnswers"></div>
    <button id="resolveBtn" class="btn btn-primary btn-block btn-lg">AVSLØR VINNER</button>
  </div>`);
  wireSpotifyPanel(mergedTiebreakerSong());
  const list = els('tbAnswers');
  list.innerHTML = tied.map(uid => {
    const a = (room.tiebreaker && room.tiebreaker[uid]) || null;
    const name = room.teams && room.teams[uid] ? room.teams[uid].name : uid;
    return `<div class="answer-result"><span>${esc(name)}</span><span class="hint">${a ? `«${esc(a.artist)}» / «${esc(a.title)}» / ${esc(a.year)}` : 'Venter…'}</span></div>`;
  }).join('');
  els('resolveBtn').addEventListener('click', () => resolveTiebreaker(room, tied));
}

async function resolveTiebreaker(room, tied) {
  const candidates = tied
    .map(uid => ({ uid, a: room.tiebreaker && room.tiebreaker[uid] }))
    .filter(x => x.a)
    .filter(x => answerMatches(x.a.artist, TIEBREAKER_SONG.acceptedArtists) &&
                 answerMatches(x.a.title, TIEBREAKER_SONG.acceptedTitles) &&
                 String(x.a.year).trim() === String(TIEBREAKER_SONG.year))
    .sort((a, b) => a.a.ts - b.a.ts);
  if (candidates.length) {
    await FB.update(dbRef(`${ROOM_PATH}/${roomCode}`), { tiebreakerWinner: candidates[0].uid, phase: 'finished' });
    return;
  }
  const choice = tied.map(uid => `${room.teams[uid].name} (${uid})`).join('\n');
  const pick = prompt('Ingen svarte helt riktig. Skriv inn uid til laget som skal vinne manuelt, eller avbryt for å prøve runden på nytt:\n' + choice);
  if (pick) {
    const uid = tied.find(u => pick.includes(u));
    if (uid) { await FB.update(dbRef(`${ROOM_PATH}/${roomCode}`), { tiebreakerWinner: uid, phase: 'finished' }); return; }
  }
  const updates = {};
  tied.forEach(uid => { updates[`tiebreaker/${uid}`] = null; });
  await FB.update(dbRef(`${ROOM_PATH}/${roomCode}`), updates);
}

// ── Ferdig ───────────────────────────────────────────────────────────────
function renderFinished(room) {
  const rows = leaderboardRows(room);
  const winnerUid = room.tiebreakerWinner || (rows[0] && rows[0].uid);
  const winner = rows.find(r => r.uid === winnerUid) || rows[0];
  setScreen(`<div class="stack">${topBarHTML(room)}
    <div class="card center stack">
      <p class="eyebrow">QUIZEN ER FERDIG</p>
      <h1 class="title-hero">🎉 ${winner ? esc(winner.name) : ''} vant!</h1>
    </div>
    <div class="card stack"><div class="leaderboard" id="lbHost"></div></div>
  </div>`);
  animateLeaderboard(els('lbHost'), rows, null);
}
