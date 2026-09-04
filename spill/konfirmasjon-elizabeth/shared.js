// Delt modul for Elizabeths konfirmasjonsquiz (host.html / screen.html / play.html).
// Samme mønster som resten av LRNify: anonym pålogging + en romkode i den
// delte Firebase-databasen (poll-c6bd2). Se firebase/README.md.

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBdbRSnz-02Cq2BITAcKY_mvWI5D91BYBM",
  authDomain: "poll-c6bd2.firebaseapp.com",
  databaseURL: "https://poll-c6bd2-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "poll-c6bd2",
  storageBucket: "poll-c6bd2.firebasestorage.app",
  messagingSenderId: "541647069675",
  appId: "1:541647069675:web:d8ee426e242e7757dbf9ae"
};
const FIREBASE_SRC = 'https://www.gstatic.com/firebasejs/10.12.2/';

export const TOTAL_ROUNDS = 16;
export const ROOM_PATH = 'konfquiz';

let FB = null, dbInstance = null, loadingPromise = null;

export function loadFirebase() {
  if (FB) return Promise.resolve(FB);
  if (!loadingPromise) {
    loadingPromise = Promise.all([
      import(FIREBASE_SRC + 'firebase-app.js'),
      import(FIREBASE_SRC + 'firebase-database.js'),
      import(FIREBASE_SRC + 'firebase-auth.js')
    ]).then(([appMod, dbMod, authMod]) => {
      const app = appMod.initializeApp(FIREBASE_CONFIG);
      dbInstance = dbMod.getDatabase(app);
      const auth = authMod.getAuth(app);
      FB = {
        ref: dbMod.ref, set: dbMod.set, update: dbMod.update, get: dbMod.get,
        onValue: dbMod.onValue, remove: dbMod.remove, serverTimestamp: dbMod.serverTimestamp,
        onDisconnect: dbMod.onDisconnect,
        auth, signInAnonymously: authMod.signInAnonymously, onAuthStateChanged: authMod.onAuthStateChanged
      };
      return FB;
    }).catch(err => { loadingPromise = null; throw err; });
  }
  return loadingPromise;
}

export function dbRef(path) {
  return FB.ref(dbInstance, path);
}

let authReadyPromise = null;
export function ensureAuth() {
  if (!authReadyPromise) {
    authReadyPromise = loadFirebase().then(fb => new Promise((resolve, reject) => {
      const unsub = fb.onAuthStateChanged(fb.auth, user => {
        if (user) { unsub(); resolve(user.uid); }
      }, reject);
      fb.signInAnonymously(fb.auth).catch(err => { unsub(); authReadyPromise = null; reject(err); });
    }));
  }
  return authReadyPromise;
}

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // uten I/O/0/1
export function generateRoomCode(length = 4) {
  let code = '';
  for (let i = 0; i < length; i++) code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  return code;
}
export function normalizeRoomCode(code) {
  return (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// ── Svarmatching ─────────────────────────────────────────────────────────
// Normaliserer bort store/små bokstaver, ekstra mellomrom, tegnsetting og
// & / and / og, slik at "Marcus & Martinus" === "marcus og martinus".
export function normalizeAnswer(str) {
  return (str || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\bog\b/g, 'and')
    .replace(/['".,!?()\[\]{}:;_\/\\\-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function answerMatches(guess, acceptedList) {
  const norm = normalizeAnswer(guess);
  if (!norm) return false;
  return acceptedList.some(a => normalizeAnswer(a) === norm);
}

// ── Sommerfugl-ikoner ────────────────────────────────────────────────────
// Én elegant silhuett, tolv fargevarianter — brukes som lagavatar og i
// leaderboardet.
export const BUTTERFLY_COLORS = {
  b1: ['#C77DFF', '#7B2CBF'],
  b2: ['#FF6FB5', '#C9184A'],
  b3: ['#4CC9F0', '#3A86FF'],
  b4: ['#FFD166', '#F4A300'],
  b5: ['#06D6A0', '#118A6E'],
  b6: ['#EF476F', '#B5174E'],
  b7: ['#9D4EDD', '#5A189A'],
  b8: ['#118AB2', '#073B4C'],
  b9: ['#FF9F1C', '#D9720A'],
  b10: ['#2EC4B6', '#1B7A70'],
  b11: ['#F72585', '#7209B7'],
  b12: ['#FFC6FF', '#B983FF']
};
export const BUTTERFLY_IDS = Object.keys(BUTTERFLY_COLORS);

export function butterflySvg(iconId, size = 40) {
  const [light, dark] = BUTTERFLY_COLORS[iconId] || BUTTERFLY_COLORS.b1;
  const gid = 'g-' + iconId + '-' + Math.random().toString(36).slice(2, 8);
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${light}"/><stop offset="1" stop-color="${dark}"/>
    </linearGradient></defs>
    <path d="M50 38c-4-14-16-28-30-27-11 1-16 12-11 22 4 9 15 14 25 13-9 3-17 10-18 21-1 11 8 18 18 15 10-3 15-15 16-27v3c1 12 6 24 16 27 10 3 19-4 18-15-1-11-9-18-18-21 10 1 21-4 25-13 5-10 0-21-11-22-14-1-26 13-30 27z" fill="url(#${gid})"/>
    <path d="M50 30c0 0-2 40 0 55" stroke="#3d2b56" stroke-width="2.5" stroke-linecap="round" fill="none" opacity=".55"/>
    <circle cx="50" cy="27" r="3.4" fill="#3d2b56" opacity=".8"/>
  </svg>`;
}

// ── Poeng-hjelpere ───────────────────────────────────────────────────────
export function computeMusicPoints(answer, songKey) {
  const artistCorrect = answerMatches(answer.artist, songKey.acceptedArtists);
  const titleCorrect = answerMatches(answer.title, songKey.acceptedTitles);
  return { artistCorrect, titleCorrect, points: (artistCorrect ? 1 : 0) + (titleCorrect ? 1 : 0) };
}

export function els(id) { return document.getElementById(id); }
export function fmtScore(n) { return (n ?? 0).toString(); }

export function leaderboardRows(room) {
  const teams = room.teams || {};
  const scores = room.scores || {};
  return Object.keys(teams).map(uid => ({
    uid, name: teams[uid].name, icon: teams[uid].icon,
    total: (scores[uid] && scores[uid].total) || 0
  })).sort((a, b) => b.total - a.total);
}

export function leaderboardRowInnerHTML(rank, row, isMe) {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  return `<span class="lb-rank">${rank}</span>
    <span class="lb-icon">${butterflySvg(row.icon, isMe ? 32 : 32)}</span>
    <span class="lb-name">${esc(row.name)}</span>
    <span class="lb-score">${row.total}</span>`;
}

// Sommerfuglene «flyr» til ny plass: FLIP-animasjon (fang gammel posisjon,
// tegn på nytt, anim­er differansen bort). Gjenbruker DOM-noden per lag-id
// slik at CSS-transformen faktisk beveger noe.
export function animateLeaderboard(container, rows, myUid) {
  const oldRects = new Map();
  const existingByUid = new Map();
  container.querySelectorAll('.lb-row[data-uid]').forEach(el => {
    oldRects.set(el.dataset.uid, el.getBoundingClientRect());
    existingByUid.set(el.dataset.uid, el);
  });
  const frag = document.createDocumentFragment();
  rows.forEach((r, i) => {
    const isMe = r.uid === myUid;
    let el = existingByUid.get(r.uid);
    if (!el) {
      el = document.createElement('div');
      el.dataset.uid = r.uid;
    }
    el.className = 'lb-row' + (isMe ? ' me' : '');
    el.innerHTML = leaderboardRowInnerHTML(i + 1, r, isMe);
    frag.appendChild(el);
  });
  container.innerHTML = '';
  container.appendChild(frag);

  container.querySelectorAll('.lb-row[data-uid]').forEach(el => {
    const oldRect = oldRects.get(el.dataset.uid);
    if (!oldRect) { el.style.animation = 'popIn .45s ease both'; return; }
    const newRect = el.getBoundingClientRect();
    const dy = oldRect.top - newRect.top;
    if (Math.abs(dy) < 1) return;
    el.style.transition = 'none';
    el.style.transform = `translateY(${dy}px)`;
    el.classList.add('moving');
    requestAnimationFrame(() => {
      el.style.transition = 'transform .8s cubic-bezier(.22,1,.36,1)';
      el.style.transform = '';
      setTimeout(() => el.classList.remove('moving'), 850);
    });
  });
}

// Noen svevende sommerfugler i bakgrunnen — rent dekorativt.
export function mountAmbientButterflies(container, count = 6) {
  if (!container || container.dataset.mounted) return;
  container.dataset.mounted = '1';
  for (let i = 0; i < count; i++) {
    const id = BUTTERFLY_IDS[Math.floor(Math.random() * BUTTERFLY_IDS.length)];
    const size = 26 + Math.random() * 40;
    const wrap = document.createElement('div');
    wrap.innerHTML = butterflySvg(id, size);
    const svg = wrap.firstElementChild;
    svg.style.left = Math.random() * 96 + '%';
    svg.style.top = Math.random() * 92 + '%';
    svg.style.animationDelay = (Math.random() * 5) + 's';
    svg.style.animationDuration = (5 + Math.random() * 4) + 's';
    svg.style.opacity = String(0.35 + Math.random() * 0.4);
    container.appendChild(svg);
  }
}
