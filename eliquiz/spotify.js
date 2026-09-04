// Valgfri Spotify-modul for /host.
//
// Bruker Authorization Code + PKCE (ingen client secret i frontend — bare en
// Client ID som verten selv oppretter gratis på
// https://developer.spotify.com/dashboard). Redirect-URI må settes til
// nøyaktig denne siden sin URL (uten hash) i Spotify-appens innstillinger.
//
// Alt her er «best effort»: quizmotoren (app.js) spør aldri om Spotify
// lyktes før den går videre — SPILL-knappen er bare én av flere knapper,
// og ÅPNE/SPILL MANUELT virker alltid, uavhengig av pålogging.

const AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const SDK_SRC = 'https://sdk.scdn.co/spotify-player.js';
const SCOPES = 'streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state';

const LS_CLIENT_ID = 'eliquiz_spotify_client_id';
// Standard Client ID for Eliquiz sitt eget Spotify-utviklerapp — Client ID-er
// er ikke hemmelige i Authorization Code + PKCE (ingen client secret i
// frontend), så det er trygt å legge den inn direkte. Verten kan fortsatt
// bytte til sin egen via "Bytt Client ID" i Spotify-panelet.
const DEFAULT_CLIENT_ID = 'f5ec6d539ce04893899a6abbf43b6664';
const LS_TOKENS = 'eliquiz_spotify_tokens';
const LS_VERIFIER = 'eliquiz_spotify_verifier';

function redirectUri() {
  return window.location.origin + window.location.pathname;
}

function b64url(bytes) {
  let str = btoa(String.fromCharCode(...bytes));
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function randomVerifier() {
  const bytes = new Uint8Array(64);
  crypto.getRandomValues(bytes);
  return b64url(bytes).slice(0, 128);
}
async function challengeFromVerifier(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return b64url(new Uint8Array(digest));
}

function getTokens() {
  try { return JSON.parse(localStorage.getItem(LS_TOKENS) || 'null'); } catch (e) { return null; }
}
function saveTokens(tokens) {
  localStorage.setItem(LS_TOKENS, JSON.stringify(tokens));
}
function clearTokens() { localStorage.removeItem(LS_TOKENS); }

export function getClientId() { return localStorage.getItem(LS_CLIENT_ID) || DEFAULT_CLIENT_ID; }
export function setClientId(id) { localStorage.setItem(LS_CLIENT_ID, id.trim()); }
export function isConfigured() { return !!getClientId(); }
export function isConnected() { return !!getTokens(); }

export async function beginLogin() {
  const clientId = getClientId();
  if (!clientId) throw new Error('Mangler Spotify Client ID.');
  const verifier = randomVerifier();
  localStorage.setItem(LS_VERIFIER, verifier);
  const challenge = await challengeFromVerifier(verifier);
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri(),
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: SCOPES,
  });
  window.location.href = `${AUTH_ENDPOINT}?${params.toString()}`;
}

// Kalles ved sideinnlasting. Returnerer true hvis vi nettopp fullførte en
// innlogging (og har renset URL-en for ?code=...).
export async function handleRedirectCallback() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  if (!code) return false;
  const verifier = localStorage.getItem(LS_VERIFIER);
  url.searchParams.delete('code');
  url.searchParams.delete('state');
  window.history.replaceState({}, '', url.pathname + url.search + '#/host');
  if (!verifier) return false;
  try {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
      client_id: getClientId(),
      code_verifier: verifier,
    });
    const res = await fetch(TOKEN_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    if (!res.ok) throw new Error('token exchange failed');
    const json = await res.json();
    saveTokens({ access_token: json.access_token, refresh_token: json.refresh_token, expires_at: Date.now() + json.expires_in * 1000 });
    return true;
  } catch (e) {
    console.warn('Spotify-innlogging feilet', e);
    return false;
  }
}

async function refreshAccessToken() {
  const tokens = getTokens();
  if (!tokens || !tokens.refresh_token) throw new Error('Ikke pålogget Spotify.');
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: tokens.refresh_token,
    client_id: getClientId(),
  });
  const res = await fetch(TOKEN_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  if (!res.ok) throw new Error('kunne ikke fornye Spotify-tilgangen');
  const json = await res.json();
  const updated = { access_token: json.access_token, refresh_token: json.refresh_token || tokens.refresh_token, expires_at: Date.now() + json.expires_in * 1000 };
  saveTokens(updated);
  return updated.access_token;
}

async function getAccessToken() {
  const tokens = getTokens();
  if (!tokens) throw new Error('Ikke pålogget Spotify.');
  if (Date.now() > tokens.expires_at - 15000) return refreshAccessToken();
  return tokens.access_token;
}

export function disconnect() {
  clearTokens();
  deviceId = null;
  player = null;
}

// ── Web Playback SDK ────────────────────────────────────────────────────
const TARGET_VOLUME = 0.85;
let sdkLoadPromise = null;
let player = null;
let deviceId = null;
let playerReadyResolve = null;
let playerReadyPromise = null;
let fadeGeneration = 0;

// Glir volumet jevnt fra "from" til "to" over "ms". Avbrytes stille av neste
// kall (playClip/pause) via fadeGeneration, så to overlappende faseinn ikke
// kjemper mot hverandre.
async function fadeVolume(from, to, ms) {
  if (!player || ms <= 0) { if (player) { try { await player.setVolume(to); } catch (e) {} } return; }
  const myGen = ++fadeGeneration;
  const steps = 16;
  try { await player.setVolume(from); } catch (e) { return; }
  for (let i = 1; i <= steps; i++) {
    await new Promise(r => setTimeout(r, ms / steps));
    if (fadeGeneration !== myGen) return; // en nyere fade/pause har overtatt
    const v = from + (to - from) * (i / steps);
    try { await player.setVolume(v); } catch (e) { return; }
  }
}

function loadSdkScript() {
  if (sdkLoadPromise) return sdkLoadPromise;
  sdkLoadPromise = new Promise((resolve, reject) => {
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
    const s = document.createElement('script');
    s.src = SDK_SRC;
    s.onerror = () => reject(new Error('Klarte ikke å laste Spotify-avspillingen.'));
    document.head.appendChild(s);
  });
  return sdkLoadPromise;
}

export async function ensurePlayer() {
  if (deviceId) return deviceId;
  if (!isConnected()) throw new Error('Ikke pålogget Spotify.');
  await loadSdkScript();
  if (!playerReadyPromise) {
    playerReadyPromise = new Promise((resolve, reject) => {
      playerReadyResolve = resolve;
      player = new window.Spotify.Player({
        name: 'Eliquiz (vert)',
        getOAuthToken: cb => getAccessToken().then(cb).catch(() => cb('')),
        volume: 0.85,
      });
      const failAndReset = (err) => { playerReadyPromise = null; reject(err); };
      player.addListener('ready', ({ device_id }) => { deviceId = device_id; playerReadyResolve(device_id); });
      player.addListener('not_ready', () => { deviceId = null; });
      player.addListener('initialization_error', ({ message }) => failAndReset(new Error(message)));
      player.addListener('authentication_error', ({ message }) => failAndReset(new Error(message)));
      player.addListener('account_error', ({ message }) => failAndReset(new Error('Spotify Premium kreves for avspilling i nettleseren: ' + message)));
      player.connect();
      setTimeout(() => failAndReset(new Error('Spotify-spilleren svarte ikke i tide.')), 15000);
    });
  }
  return playerReadyPromise;
}

async function apiCall(path, opts = {}) {
  const token = await getAccessToken();
  const res = await fetch('https://api.spotify.com/v1' + path, {
    ...opts,
    headers: { ...(opts.headers || {}), Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
  });
  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => '');
    throw new Error(`Spotify API-feil (${res.status}): ${text.slice(0, 200)}`);
  }
  return res;
}

let stopTimer = null;

// Spiller et klipp: bytter til vertens Web Playback-enhet, seeker til
// startMs, spiller, og stopper automatisk etter durationMs. fadeInMs (0 for
// å skru av) glir volumet opp fra stillhet i stedet for å starte brått.
export async function playClip({ trackId, startMs = 0, durationMs = 25000, fadeInMs = 1000 }) {
  if (!trackId) throw new Error('Denne sangen mangler en Spotify-lenke ennå.');
  clearTimeout(stopTimer);
  fadeGeneration++; // avbryt en ev. pågående fade fra forrige klipp
  const id = await ensurePlayer();
  if (fadeInMs > 0 && player) { try { await player.setVolume(0); } catch (e) {} }
  await apiCall('/me/player/play?device_id=' + id, {
    method: 'PUT',
    body: JSON.stringify({ uris: [`spotify:track:${trackId}`], position_ms: startMs }),
  });
  if (fadeInMs > 0) fadeVolume(0, TARGET_VOLUME, fadeInMs).catch(() => {});
  stopTimer = setTimeout(() => { pause().catch(() => {}); }, durationMs);
}

export async function pause() {
  clearTimeout(stopTimer);
  fadeGeneration++; // avbryt en ev. pågående fade
  if (!deviceId) return;
  await apiCall('/me/player/pause?device_id=' + deviceId, { method: 'PUT' });
  if (player) { try { await player.setVolume(TARGET_VOLUME); } catch (e) {} } // klar for neste avspilling
}

export function openManually(trackId) {
  if (!trackId) return;
  window.open(`https://open.spotify.com/track/${trackId}`, '_blank', 'noopener');
}
