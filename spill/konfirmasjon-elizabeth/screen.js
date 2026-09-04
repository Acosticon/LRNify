import {
  loadFirebase, dbRef, ensureAuth, ROOM_PATH, TOTAL_ROUNDS,
  butterflySvg, mountAmbientButterflies, els, animateLeaderboard, leaderboardRows
} from './shared.js';
import { SONGS, TIEBREAKER_SONG } from './songs-data.js';

const LS_HOST_ROOM = 'konfquiz_host_room';   // samme nøkkel som host.js — gjenbrukes hvis åpnet i samme nettleser
const LS_SCREEN_ROOM = 'konfquiz_screen_room';

let FB, roomCode = null, unwatch = null;
let lastKey = null;

function screenEl() { return els('screen'); }
function setScreen(html) { screenEl().innerHTML = html; }
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

(async function init() {
  document.body.classList.add('screen-mode');
  mountAmbientButterflies(els('bgButterflies'), 10);
  setScreen(`<div class="card center stack"><p>Kobler til…</p></div>`);
  try {
    FB = await loadFirebase();
    await ensureAuth();
  } catch (e) {
    setScreen(`<div class="card center stack"><p class="error-msg">Fikk ikke kontakt med serveren.</p></div>`);
    return;
  }
  const saved = localStorage.getItem(LS_HOST_ROOM) || localStorage.getItem(LS_SCREEN_ROOM);
  if (saved) { roomCode = saved; subscribeRoom(); } else { renderCodeEntry(); }
})();

function renderCodeEntry() {
  setScreen(`
    <div class="card center stack" style="max-width:480px;margin:10vh auto">
      <p class="eyebrow">Publikumsskjerm</p>
      <h1 class="title-hero">Skriv inn romkoden</h1>
      <input id="codeInput" class="input-code" maxlength="8" placeholder="0000">
      <button id="goBtn" class="btn btn-primary btn-block btn-lg">VIS</button>
    </div>
  `);
  els('goBtn').addEventListener('click', () => {
    const code = els('codeInput').value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!code) return;
    roomCode = code;
    localStorage.setItem(LS_SCREEN_ROOM, code);
    subscribeRoom();
  });
}

function subscribeRoom() {
  if (unwatch) unwatch();
  unwatch = FB.onValue(dbRef(`${ROOM_PATH}/${roomCode}`), snap => {
    const val = snap.val();
    if (!val) { setScreen(`<div class="card center stack"><p class="error-msg">Fant ikke quizen.</p></div>`); return; }
    render(val);
  });
}

function render(room) {
  const key = room.phase === 'music' ? `music|${room.roundStatus}|${room.currentRound}` :
    room.phase === 'timeline' ? `timeline|${room.timelineStatus}|${room.timelineRevealIndex || '0'}` :
    room.phase === 'tiebreaker' ? `tiebreaker|${Object.keys(room.tiebreaker || {}).length}` : room.phase;
  if (key === lastKey) { patchLive(room); return; }
  lastKey = key;
  renderNow(room);
}

function patchLive(room) {
  const teamCountEl = els('teamCount');
  if (teamCountEl) teamCountEl.textContent = String(Object.keys(room.teams || {}).length);
  const progressEl = els('deliveredProgress');
  if (progressEl && room.phase === 'timeline') {
    const total = Object.keys(room.teams || {}).length;
    const delivered = Object.values(room.timeline || {}).filter(t => t && t.submitted).length;
    progressEl.textContent = `${delivered} / ${total} lag har levert`;
  }
  const lobbyGrid = els('lobbyGrid');
  if (lobbyGrid && room.phase === 'lobby') renderLobbyGrid(room);
}

function renderNow(room) {
  if (room.phase === 'lobby') return renderLobby(room);
  if (room.phase === 'music') return renderMusic(room);
  if (room.phase === 'timeline') return renderTimeline(room);
  if (room.phase === 'tiebreaker') return renderTiebreaker(room);
  if (room.phase === 'finished') return renderFinished(room);
  setScreen(`<div class="card center stack"><p>Vent litt…</p></div>`);
}

// ── Lobby ────────────────────────────────────────────────────────────────
function renderLobby(room) {
  setScreen(`
    <div class="stack">
      <div class="center stack">
        <p class="eyebrow">${esc(room.title || 'Konfirmasjonsquiz')}</p>
        <h1 class="title-hero">MUSIKKQUIZ</h1>
        <p class="subtitle">${location.origin}${location.pathname.replace('screen.html', 'play.html')}</p>
        <p class="big-number">${roomCode}</p>
      </div>
      <div class="card stack">
        <p class="eyebrow center"><span id="teamCount">0</span> lag er klare</p>
        <div id="lobbyGrid" class="icon-grid" style="grid-template-columns:repeat(auto-fill,minmax(90px,1fr))"></div>
      </div>
    </div>
  `);
  renderLobbyGrid(room);
}
function renderLobbyGrid(room) {
  const grid = els('lobbyGrid');
  const teams = Object.entries(room.teams || {}).sort((a, b) => a[1].joinedAt - b[1].joinedAt);
  grid.innerHTML = teams.map(([uid, t]) => `
    <div class="stack center" style="gap:4px">
      ${butterflySvg(t.icon, 46)}
      <span style="font-weight:700;font-size:.85rem">${esc(t.name)}</span>
    </div>`).join('') || `<p class="hint center">Venter på lag…</p>`;
  els('teamCount').textContent = String(teams.length);
}

// ── Musikkrunder ─────────────────────────────────────────────────────────
function renderMusic(room) {
  const round = Number(room.currentRound);
  const status = room.roundStatus;
  if (status === 'reveal') return renderReveal(round);
  if (status === 'leaderboard') return renderLeaderboardScreen(room, `Stillingen etter sang ${round}`);
  const msg = status === 'answering' ? 'Lagene svarer nå — artist og sangtittel!' :
    status === 'scoring' ? 'Verten retter svarene…' : 'Gjør dere klare…';
  setScreen(`
    <div class="center stack" style="padding-top:14vh">
      <p class="eyebrow">SANG</p>
      <p class="big-number">${round} / ${TOTAL_ROUNDS}</p>
      <p class="subtitle">${msg}</p>
    </div>
  `);
}
function renderReveal(round) {
  const song = SONGS[round - 1];
  setScreen(`
    <div class="center stack" style="padding-top:10vh">
      <p class="eyebrow">SANG ${round} — FASIT</p>
      <p class="reveal-artist">${esc(song.artist)}</p>
      <p class="reveal-title">${esc(song.title)}</p>
    </div>
  `);
}
function renderLeaderboardScreen(room, heading) {
  const rows = leaderboardRows(room);
  setScreen(`
    <div class="stack">
      <p class="eyebrow center">${heading}</p>
      <div class="leaderboard" id="lbScreen"></div>
    </div>
  `);
  animateLeaderboard(els('lbScreen'), rows, null);
}

// ── Tidslinjefinale ──────────────────────────────────────────────────────
function renderTimeline(room) {
  const status = room.timelineStatus;
  if (status === 'intro') {
    setScreen(`
      <div class="center stack" style="padding-top:12vh">
        <p class="eyebrow">FINALEN</p>
        <h1 class="title-hero">Du har hørt 16 sanger fra 2011–2026</h1>
        <p class="subtitle">Lagene plasserer dem på riktig årstall.</p>
        <p style="color:var(--gold);font-weight:700;font-size:1.3rem">16 poeng står på spill.</p>
      </div>
    `);
  } else if (status === 'open') {
    setScreen(`
      <div class="center stack" style="padding-top:14vh">
        <p class="eyebrow">TIDSLINJEFINALEN PÅGÅR</p>
        <p class="big-number" style="font-size:3rem">🦋</p>
        <p class="subtitle" id="deliveredProgress">0 / 0 lag har levert</p>
      </div>
    `);
    patchLive(room);
  } else if (status === 'closed') {
    setScreen(`<div class="center stack" style="padding-top:16vh"><p class="eyebrow">FINALEN ER LEVERT</p><p class="subtitle">Snart avslører vi fasiten…</p></div>`);
  } else if (status === 'revealing') {
    const index = Number(room.timelineRevealIndex || 0);
    if (index === 0) {
      setScreen(`<div class="center stack" style="padding-top:16vh"><p class="eyebrow">FINALE-FASIT</p><p class="subtitle">Nå avslører vi tidslinjen — fra 2011 til 2026…</p></div>`);
    } else {
      const song = SONGS[index - 1];
      setScreen(`
        <div class="center stack" style="padding-top:10vh">
          <p class="eyebrow">FINALE-FASIT</p>
          <p class="big-number" style="font-size:5rem">${song.year}</p>
          <p class="reveal-artist">${esc(song.artist)}</p>
          <p class="reveal-title">${esc(song.title)}</p>
        </div>
      `);
    }
  } else if (status === 'results') {
    renderLeaderboardScreen(room, 'SLUTTRESULTAT');
  }
}

// ── Tiebreaker ───────────────────────────────────────────────────────────
function renderTiebreaker(room) {
  const tied = Object.keys(room.tiebreakerTeams || {});
  const names = tied.map(uid => (room.teams && room.teams[uid] && room.teams[uid].name) || '?');
  setScreen(`
    <div class="center stack" style="padding-top:10vh">
      <p class="eyebrow">TIEBREAKER</p>
      <h1 class="title-hero">${names.map(esc).join(' vs. ')}</h1>
      <p class="subtitle">${TIEBREAKER_SONG.artist} — ${TIEBREAKER_SONG.title}</p>
      <p class="hint">Raskeste lag med helt riktig svar vinner.</p>
    </div>
  `);
}

// ── Ferdig ───────────────────────────────────────────────────────────────
function renderFinished(room) {
  const rows = leaderboardRows(room);
  const winnerUid = room.tiebreakerWinner || (rows[0] && rows[0].uid);
  const winner = rows.find(r => r.uid === winnerUid) || rows[0];
  setScreen(`
    <div class="stack">
      <div class="center stack">
        <p class="eyebrow">QUIZEN ER FERDIG</p>
        <h1 class="title-hero">🎉 ${winner ? esc(winner.name) : ''} vant! 🎉</h1>
      </div>
      <div class="leaderboard" id="lbScreen"></div>
    </div>
  `);
  animateLeaderboard(els('lbScreen'), rows, null);
}
