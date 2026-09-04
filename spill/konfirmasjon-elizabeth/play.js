import {
  loadFirebase, dbRef, ensureAuth, ROOM_PATH,
  normalizeRoomCode, BUTTERFLY_IDS, butterflySvg,
  mountAmbientButterflies, els, leaderboardRowInnerHTML, leaderboardRows
} from './shared.js';

let FB, myUid, roomCode = null;
let unwatch = null;
const state = { room: null, selectedSongId: null, selectedIcon: BUTTERFLY_IDS[0], joinError: '', codeInput: '' };
let lastKey = null;

function isInputSensitive(key) {
  return key === 'nameicon' || key.startsWith('music|answering|') || key.startsWith('tiebreaker|');
}

function screenEl() { return els('screen'); }

function setScreen(html) { screenEl().innerHTML = html; }

// ── Boot ─────────────────────────────────────────────────────────────────
(async function init() {
  mountAmbientButterflies(els('bgButterflies'), 7);
  screenEl().addEventListener('click', onTimelineClick); // #screen er permanent; knappene inni byttes ut per render
  setScreen(loadingHTML('Kobler til…'));
  try {
    FB = await loadFirebase();
    myUid = await ensureAuth();
  } catch (e) {
    setScreen(errorScreenHTML('Fikk ikke kontakt med serveren. Sjekk internett og prøv igjen.'));
    return;
  }
  const codeFromUrl = new URLSearchParams(location.search).get('code');
  if (codeFromUrl) {
    window.history.replaceState({}, '', location.pathname); // rydd ?code= fra adresselinja (f.eks. etter QR-skann)
    await tryJoin(codeFromUrl);
    return;
  }
  const saved = localStorage.getItem('konfquiz_room');
  if (saved) {
    roomCode = saved;
    subscribeRoom();
  } else {
    render();
  }
})();

function loadingHTML(msg) {
  return `<div class="card center stack"><p class="eyebrow">Konfirmasjonsquiz</p><p>${msg}</p></div>`;
}
function errorScreenHTML(msg) {
  return `<div class="card center stack"><p class="error-msg">${msg}</p>
    <button class="btn btn-primary" onclick="location.reload()">Prøv igjen</button></div>`;
}

// ── Tilkobling til rom ───────────────────────────────────────────────────
function subscribeRoom() {
  if (unwatch) unwatch();
  const ref = dbRef(`${ROOM_PATH}/${roomCode}`);
  unwatch = FB.onValue(ref, snap => {
    const val = snap.val();
    if (!val) {
      localStorage.removeItem('konfquiz_room');
      roomCode = null;
      state.room = null;
      state.joinError = 'Fant ikke quizen lenger. Sjekk koden med verten.';
      render(true);
      return;
    }
    state.room = val;
    render();
  }, () => {
    state.joinError = 'Klarte ikke å lese quizen akkurat nå.';
    render();
  });
}

async function tryJoin(code) {
  const clean = normalizeRoomCode(code);
  if (!/^[A-Z0-9]{4,8}$/.test(clean)) {
    state.joinError = 'Koden må være 4–8 tegn (bokstaver/tall).';
    render(true);
    return;
  }
  state.joinError = '';
  const snap = await FB.get(dbRef(`${ROOM_PATH}/${clean}`));
  if (!snap.exists()) {
    state.joinError = 'Fant ingen quiz med den koden. Sjekk med verten.';
    render(true);
    return;
  }
  roomCode = clean;
  localStorage.setItem('konfquiz_room', clean);
  state.room = snap.val();
  subscribeRoom();
  render(true);
}

// ── Rendering ────────────────────────────────────────────────────────────
function computeKey() {
  if (!roomCode) return 'join';
  const room = state.room;
  if (!room) return 'loading';
  const myTeam = room.teams && room.teams[myUid];
  if (!myTeam) return 'nameicon';
  if (room.phase === 'music') return `music|${room.roundStatus}|${room.currentRound}`;
  if (room.phase === 'timeline') return `timeline|${room.timelineStatus}`;
  if (room.phase === 'tiebreaker') return `tiebreaker|${room.tiebreakerActive}`;
  return room.phase;
}

function render(force) {
  const key = computeKey();
  if (!force && key === lastKey && isInputSensitive(key)) return; // ikke slett det spilleren holder på å skrive
  lastKey = key;
  renderNow(key);
}

function renderNow(key) {
  if (key === 'join') return renderJoin();
  if (key === 'loading') return setScreen(loadingHTML('Henter quizen…'));
  const room = state.room;
  const myTeam = room.teams && room.teams[myUid];
  if (key === 'nameicon') return renderNameIcon(room);

  if (key === 'lobby') return renderLobbyWait(room, myTeam);
  if (key.startsWith('music|')) return renderMusic(room, myTeam);
  if (key.startsWith('timeline|')) return renderTimeline(room, myTeam);
  if (key.startsWith('tiebreaker|')) return renderTiebreaker(room, myTeam);
  if (key === 'finished') return renderFinished(room, myTeam);
  setScreen(loadingHTML('Vent litt…'));
}

// ── Lobby (venter på start) ──────────────────────────────────────────────
function renderLobbyWait(room, myTeam) {
  const teamCount = Object.keys(room.teams || {}).length;
  setScreen(`
    <div class="stack" style="padding-top:8vh">
      ${headerHTML(myTeam)}
      <div class="card center stack">
        <p class="eyebrow">${escapeHtml(room.title || 'Konfirmasjonsquiz')}</p>
        <h1 class="title-hero">Dere er med!</h1>
        <p class="subtitle">Vent på at verten starter quizen.</p>
        <p class="hint">${teamCount} ${teamCount === 1 ? 'lag er klart' : 'lag er klare'}</p>
      </div>
    </div>
  `);
}

// ── Join-skjerm ──────────────────────────────────────────────────────────
function renderJoin() {
  setScreen(`
    <div class="stack" style="padding-top:8vh">
      <div class="center stack">
        <p class="eyebrow">Konfirmasjonsquiz</p>
        <h1 class="title-hero">Bli med i quizen</h1>
        <p class="subtitle">Skriv inn koden du fikk av verten.</p>
      </div>
      <div class="card stack">
        <div>
          <label class="field-label" for="codeInput">Spillkode</label>
          <input id="codeInput" class="input-code" type="text" inputmode="text" autocapitalize="characters"
                 maxlength="8" placeholder="0000" value="${state.codeInput || ''}">
        </div>
        ${state.joinError ? `<p class="error-msg">${state.joinError}</p>` : ''}
        <button id="joinBtn" class="btn btn-primary btn-block btn-lg">BLI MED</button>
      </div>
    </div>
  `);
  const input = els('codeInput');
  input.focus();
  input.addEventListener('input', () => { state.codeInput = input.value; });
  const go = () => tryJoin(input.value);
  els('joinBtn').addEventListener('click', go);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
}

// ── Navn + sommerfuglikon ────────────────────────────────────────────────
function renderNameIcon(room) {
  setScreen(`
    <div class="stack" style="padding-top:4vh">
      <div class="center stack">
        <p class="eyebrow">${room.title || 'Konfirmasjonsquiz'}</p>
        <h1 class="title-hero">Sett opp laget deres</h1>
      </div>
      <div class="card stack">
        <div>
          <label class="field-label" for="teamName">Lagnavn</label>
          <input id="teamName" type="text" maxlength="24" placeholder="F.eks. Team Disco">
        </div>
        <div>
          <label class="field-label">Velg en sommerfugl</label>
          <div class="icon-grid" id="iconGrid">
            ${BUTTERFLY_IDS.map(id => `
              <div class="icon-opt${id === state.selectedIcon ? ' selected' : ''}" data-icon="${id}">
                ${butterflySvg(id, 34)}
              </div>`).join('')}
          </div>
        </div>
        <div id="nameIconError" class="error-msg" style="display:none"></div>
        <button id="confirmTeamBtn" class="btn btn-primary btn-block btn-lg">Bli med!</button>
      </div>
    </div>
  `);
  els('iconGrid').addEventListener('click', e => {
    const opt = e.target.closest('.icon-opt');
    if (!opt) return;
    state.selectedIcon = opt.dataset.icon;
    els('iconGrid').querySelectorAll('.icon-opt').forEach(o => o.classList.toggle('selected', o === opt));
  });
  els('confirmTeamBtn').addEventListener('click', async () => {
    const errEl = els('nameIconError');
    try {
      const name = els('teamName').value.trim();
      if (!name) { errEl.textContent = 'Skriv inn et lagnavn.'; errEl.style.display = 'block'; return; }
      if (name.length > 24) { errEl.textContent = 'Lagnavnet er for langt.'; errEl.style.display = 'block'; return; }
      errEl.style.display = 'none';
      els('confirmTeamBtn').disabled = true;
      await FB.set(dbRef(`${ROOM_PATH}/${roomCode}/teams/${myUid}`), {
        name, icon: state.selectedIcon, joinedAt: FB.serverTimestamp()
      });
    } catch (e) {
      console.error('Klarte ikke å melde laget på:', e);
      errEl.textContent = 'Klarte ikke å melde laget på: ' + (e.code || e.message || e);
      errEl.style.display = 'block';
      const btn = els('confirmTeamBtn');
      if (btn) btn.disabled = false;
    }
  });
}

// ── Musikkquiz ───────────────────────────────────────────────────────────
function renderMusic(room, myTeam) {
  const status = room.roundStatus;
  const round = room.currentRound;
  if (status === 'answering') return renderAnswering(room, myTeam, round);
  if (status === 'reveal') return renderMusicReveal(room, myTeam, round);
  if (status === 'leaderboard') return renderLeaderboard(room, myTeam, 'Stillingen etter sang ' + round);
  return setScreen(waitingHTML(`SANG ${round} / 16`, 'Gjør dere klare — verten starter runden straks.'));
}

function renderAnswering(room, myTeam, round) {
  const existing = (room.answers && room.answers[round] && room.answers[round][myUid]) || {};
  setScreen(`
    <div class="stack">
      ${headerHTML(myTeam)}
      <div class="card stack center">
        <p class="round-badge">SANG ${round} / 16</p>
        <p class="hint">Lytt til klippet og gjett artist og sangtittel.</p>
      </div>
      <div class="card stack">
        <div>
          <label class="field-label" for="ansArtist">Artist</label>
          <input id="ansArtist" type="text" placeholder="Hvem synger?" value="${escapeAttr(existing.artist || '')}">
        </div>
        <div>
          <label class="field-label" for="ansTitle">Sangtittel</label>
          <input id="ansTitle" type="text" placeholder="Hva heter sangen?" value="${escapeAttr(existing.title || '')}">
        </div>
        <button id="sendBtn" class="btn btn-primary btn-block btn-lg">${existing.ts ? 'OPPDATER SVAR' : 'SEND SVAR'}</button>
        <div id="sendConfirm">${existing.ts ? `<div class="confirm-badge">✓ Svaret ditt er levert</div>` : ''}</div>
      </div>
    </div>
  `);
  els('sendBtn').addEventListener('click', async () => {
    const artist = els('ansArtist').value.trim();
    const title = els('ansTitle').value.trim();
    els('sendBtn').disabled = true;
    try {
      await FB.update(dbRef(`${ROOM_PATH}/${roomCode}/answers/${round}/${myUid}`), {
        artist, title, ts: FB.serverTimestamp()
      });
      els('sendConfirm').innerHTML = `<div class="confirm-badge">✓ Svaret ditt er levert</div>`;
      els('sendBtn').textContent = 'OPPDATER SVAR';
    } catch (e) {
      els('sendConfirm').innerHTML = `<p class="error-msg">Klarte ikke å sende svaret. Prøv igjen.</p>`;
    }
    els('sendBtn').disabled = false;
  });
}

function renderMusicReveal(room, myTeam, round) {
  const ans = (room.answers && room.answers[round] && room.answers[round][myUid]) || null;
  const scored = ans && typeof ans.points === 'number';
  setScreen(`
    <div class="stack">
      ${headerHTML(myTeam)}
      <div class="card stack center">
        <p class="round-badge">SANG ${round} FASIT</p>
        ${!scored ? `<p class="hint">Retter svarene…</p>` : `
          <div class="stack" style="text-align:left">
            <div class="answer-result"><span>Artist</span>${tagHTML(ans.artistCorrect)}</div>
            <div class="answer-result"><span>Tittel</span>${tagHTML(ans.titleCorrect)}</div>
          </div>
          <hr class="sep">
          <p class="big-number" style="font-size:2.4rem">+${ans.points} POENG</p>
        `}
      </div>
    </div>
  `);
}
function tagHTML(correct) {
  return correct ? `<span class="tag tag-good">✅ +1</span>` : `<span class="tag tag-bad">❌ +0</span>`;
}

function renderLeaderboard(room, myTeam, heading) {
  const rows = leaderboardRows(room);
  setScreen(`
    <div class="stack">
      ${headerHTML(myTeam)}
      <div class="card stack">
        <p class="eyebrow center">${heading}</p>
        <div class="leaderboard">
          ${rows.map((r, i) => leaderboardRowHTML(r, i, r.uid === myUid)).join('') || `<p class="hint center">Venter på poeng…</p>`}
        </div>
      </div>
    </div>
  `);
}
function leaderboardRowHTML(r, i, isMe) {
  return `<div class="lb-row${isMe ? ' me' : ''}">${leaderboardRowInnerHTML(i + 1, r, isMe)}</div>`;
}

// ── Tidslinjefinale ──────────────────────────────────────────────────────
function renderTimeline(room, myTeam) {
  const status = room.timelineStatus;
  if (status === 'open') return renderTimelineOpen(room, myTeam);
  if (status === 'results') return renderLeaderboard(room, myTeam, 'Sluttresultat');
  if (status === 'revealing') return setScreen(waitingHTML('FINALEN', 'Verten går gjennom fasiten på storskjermen…'));
  if (status === 'closed') return setScreen(waitingHTML('FINALEN LEVERT', 'Vent på at verten avslører fasiten.'));
  return setScreen(`
    <div class="stack">
      ${headerHTML(myTeam)}
      <div class="card stack center">
        <p class="eyebrow">FINALEN</p>
        <p>Du har hørt 16 sanger fra 2011–2026.</p>
        <p>Plasser dem på riktig årstall.</p>
        <p style="color:var(--gold)"><b>16 poeng står på spill.</b></p>
        <p class="hint">Vent på at verten åpner finalen…</p>
      </div>
    </div>
  `);
}

function renderTimelineOpen(room, myTeam) {
  const cards = room.timelineCards || {};
  const placements = (room.timeline && room.timeline[myUid] && room.timeline[myUid].placements) || {};
  const placedCount = Object.keys(placements).length;
  const songIds = Object.keys(cards);
  const bank = songIds.filter(id => !placements[id]);

  const years = [];
  for (let y = 2011; y <= 2026; y++) years.push(y);

  setScreen(`
    <div class="stack">
      ${headerHTML(myTeam)}
      <div class="card-tight card stack">
        <p class="timeline-progress">${placedCount} / 16 plassert</p>
        ${bank.length ? `<div class="card-bank" id="bank">
          ${bank.map(id => songCardHTML(id, cards[id])).join('')}
        </div>` : `<p class="hint center">Alle kortene er plassert.</p>`}
      </div>
      <div class="card stack">
        <div class="timeline-list" id="yearList">
          ${years.map(y => {
            const placedId = Object.keys(placements).find(id => placements[id] === String(y)) || null;
            return timelineYearRowHTML(y, placedId, cards[placedId]);
          }).join('')}
        </div>
      </div>
      <button id="deliverBtn" class="btn btn-primary btn-block btn-lg" ${placedCount === 16 ? '' : 'disabled'}>LEVER FINALEN</button>
    </div>
  `);

  els('deliverBtn').addEventListener('click', async () => {
    els('deliverBtn').disabled = true;
    els('deliverBtn').textContent = 'LEVERER…';
    try {
      await FB.update(dbRef(`${ROOM_PATH}/${roomCode}/timeline/${myUid}`), { submitted: true, submittedAt: FB.serverTimestamp() });
      setScreen(waitingHTML('FINALEN LEVERT', 'Godt jobbet! Vent på at flere lag blir ferdige.'));
    } catch (e) {
      els('deliverBtn').disabled = false;
      els('deliverBtn').textContent = 'LEVER FINALEN';
    }
  });
}

function songCardHTML(id, card) {
  const sel = state.selectedSongId === id ? ' selected' : '';
  return `<div class="song-card${sel}" data-song="${id}">
    <span class="sc-title">${escapeHtml(card.title)}</span>
    <span class="sc-artist">${escapeHtml(card.artist)}</span>
  </div>`;
}
function timelineYearRowHTML(year, songId, card) {
  const filled = songId && card;
  return `<div class="timeline-year-row${filled ? ' filled' : ''}" data-year="${year}">
    <span class="timeline-year">${year}</span>
    ${filled
      ? `<div class="song-card${state.selectedSongId === songId ? ' selected' : ''}" data-song="${songId}" style="flex:1">
           <span class="sc-title">${escapeHtml(card.title)}</span><span class="sc-artist">${escapeHtml(card.artist)}</span>
         </div>`
      : `<span class="hint">${state.selectedSongId ? 'Trykk her for å plassere' : 'Ledig'}</span>`}
  </div>`;
}

function onTimelineClick(e) {
  const cardEl = e.target.closest('.song-card');
  const yearEl = e.target.closest('.timeline-year-row');
  if (cardEl) {
    const id = cardEl.dataset.song;
    state.selectedSongId = state.selectedSongId === id ? null : id;
    renderNow(computeKey());
    return;
  }
  if (yearEl && state.selectedSongId) {
    const year = yearEl.dataset.year;
    placeCard(state.selectedSongId, year);
  }
}

async function placeCard(songId, year) {
  const room = state.room;
  const placements = (room.timeline && room.timeline[myUid] && room.timeline[myUid].placements) || {};
  const updates = {};
  const occupantId = Object.keys(placements).find(id => placements[id] === String(year) && id !== songId);
  if (occupantId) updates[`placements/${occupantId}`] = null;
  updates[`placements/${songId}`] = String(year);
  state.selectedSongId = null;
  try {
    await FB.update(dbRef(`${ROOM_PATH}/${roomCode}/timeline/${myUid}`), updates);
  } catch (e) { /* onValue vil rette opp visningen igjen */ }
}

// ── Tiebreaker ───────────────────────────────────────────────────────────
function renderTiebreaker(room, myTeam) {
  const eligible = room.tiebreakerTeams && room.tiebreakerTeams[myUid];
  if (!eligible) {
    return setScreen(waitingHTML('TIEBREAKER', 'De ledende lagene kjemper om førsteplassen. Følg med på storskjermen!'));
  }
  const mine = (room.tiebreaker && room.tiebreaker[myUid]) || {};
  setScreen(`
    <div class="stack">
      ${headerHTML(myTeam)}
      <div class="card stack center">
        <p class="eyebrow">TIEBREAKER</p>
        <p>Dere deler førsteplassen! Denne sangen avgjør det:</p>
      </div>
      <div class="card stack">
        <div><label class="field-label" for="tbArtist">Artist</label><input id="tbArtist" type="text" value="${escapeAttr(mine.artist || '')}"></div>
        <div><label class="field-label" for="tbTitle">Sangtittel</label><input id="tbTitle" type="text" value="${escapeAttr(mine.title || '')}"></div>
        <div><label class="field-label" for="tbYear">Årstall</label><input id="tbYear" type="text" inputmode="numeric" maxlength="4" value="${escapeAttr(mine.year || '')}"></div>
        <button id="tbSend" class="btn btn-primary btn-block btn-lg">SEND</button>
        <div id="tbConfirm">${mine.ts ? `<div class="confirm-badge">✓ Svaret ditt er levert</div>` : ''}</div>
      </div>
    </div>
  `);
  els('tbSend').addEventListener('click', async () => {
    const artist = els('tbArtist').value.trim();
    const title = els('tbTitle').value.trim();
    const year = els('tbYear').value.trim();
    els('tbSend').disabled = true;
    try {
      await FB.set(dbRef(`${ROOM_PATH}/${roomCode}/tiebreaker/${myUid}`), { artist, title, year, ts: FB.serverTimestamp() });
      els('tbConfirm').innerHTML = `<div class="confirm-badge">✓ Svaret ditt er levert</div>`;
    } catch (e) {
      els('tbConfirm').innerHTML = `<p class="error-msg">Klarte ikke å sende. Prøv igjen.</p>`;
    }
    els('tbSend').disabled = false;
  });
}

// ── Ferdig ───────────────────────────────────────────────────────────────
function renderFinished(room, myTeam) {
  const rows = leaderboardRows(room);
  const winner = rows[0];
  setScreen(`
    <div class="stack">
      ${headerHTML(myTeam)}
      <div class="card center stack">
        <p class="eyebrow">QUIZEN ER FERDIG</p>
        <h1 class="title-hero">🎉 Gratulerer!</h1>
        ${winner ? `<p class="subtitle">${escapeHtml(winner.name)} vant med ${winner.total} poeng</p>` : ''}
      </div>
      <div class="card stack">
        <div class="leaderboard">${rows.map((r, i) => leaderboardRowHTML(r, i, r.uid === myUid)).join('')}</div>
      </div>
    </div>
  `);
}

// ── Småting ──────────────────────────────────────────────────────────────
function headerHTML(myTeam) {
  return `<div class="row" style="opacity:.9">
    ${butterflySvg(myTeam.icon, 26)}<span style="font-weight:700">${escapeHtml(myTeam.name)}</span>
  </div>`;
}
function waitingHTML(eyebrow, msg) {
  return `<div class="card center stack" style="margin-top:8vh">
    <p class="eyebrow">${eyebrow}</p>
    <p class="hint">${msg}</p>
  </div>`;
}
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }
