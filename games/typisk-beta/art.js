/* ══════════════════════════════════════════════════════════════════
   art.js — all grafikk i Typisk!, som SVG-strenger.

   Ingen annen fil tegner. Vil man senere bytte til rastermotiver fra
   et bildeverktøy, byttes én funksjon om gangen — CSS-klassene
   (.art-maskot, .art-ikon, .art-helt) styrer allerede størrelse.

   Stil: flate flater, blekkstrek 3–4 px (#12202e), ingen gradienter.
   Hvert sentralmål har sin låste farge og holder den overalt:
       gjennomsnitt = gull, median = teal, typetall = lilla.
   ══════════════════════════════════════════════════════════════════ */

const INK = '#2b2118';
export const FARGE = {
  mean:   { fyll: '#f4b942', mork: '#c98a1c', lys: '#fde9bd' },
  median: { fyll: '#2fa8a0', mork: '#1c7570', lys: '#c9ece9' },
  mode:   { fyll: '#8b6ad6', mork: '#5f45a3', lys: '#ded4f7' }
};

const svg = (vb, inner, kl = '') =>
  `<svg viewBox="${vb}" class="${kl}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${inner}</svg>`;

/* Ansikt gjenbrukes av alle tre, så de leses som samme familie. */
function ansikt(cx, cy, mood, s = 1) {
  const oye = (x, y) => `<circle cx="${x}" cy="${y}" r="${2.6 * s}" fill="${INK}"/>`;
  const oyne = oye(cx - 6 * s, cy) + oye(cx + 6 * s, cy);
  let munn;
  if (mood === 'glad') munn = `<path d="M${cx - 6 * s} ${cy + 6 * s} q${6 * s} ${6 * s} ${12 * s} 0" fill="none" stroke="${INK}" stroke-width="${2.4 * s}" stroke-linecap="round"/>`;
  else if (mood === 'sjokk') munn = `<ellipse cx="${cx}" cy="${cy + 8 * s}" rx="${4 * s}" ry="${5 * s}" fill="${INK}"/>`;
  else if (mood === 'skuldertrekk') munn = `<path d="M${cx - 5 * s} ${cy + 8 * s} h${10 * s}" fill="none" stroke="${INK}" stroke-width="${2.4 * s}" stroke-linecap="round"/>`;
  else munn = `<path d="M${cx - 5 * s} ${cy + 7 * s} q${5 * s} ${3 * s} ${10 * s} 0" fill="none" stroke="${INK}" stroke-width="${2.4 * s}" stroke-linecap="round"/>`;
  return oyne + munn;
}

/* ── GJENNOMSNITTET — akrobaten på vektstanga ──────────────────────
   Den eneste av de tre som kan miste balansen. Det er hele poenget. */
function maskotMean(mood) {
  const tipp = mood === 'sjokk' ? 13 : 0;
  const c = FARGE.mean;
  return svg('0 0 100 100', `
    <g transform="rotate(${tipp} 50 72)">
      <rect x="12" y="66" width="76" height="9" rx="2" fill="${c.fyll}" stroke="${INK}" stroke-width="3.5"/>
      <g transform="translate(${mood === 'sjokk' ? 18 : 0} ${mood === 'sjokk' ? -2 : 0})">
        <path d="M50 66 V50" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
        <path d="M50 56 L36 ${mood === 'sjokk' ? 44 : 48} M50 56 L64 ${mood === 'sjokk' ? 44 : 48}"
              stroke="${INK}" stroke-width="4" stroke-linecap="round" fill="none"/>
        <circle cx="50" cy="36" r="14" fill="${c.lys}" stroke="${INK}" stroke-width="3.5"/>
        ${ansikt(50, 34, mood)}
      </g>
    </g>
    <path d="M50 76 L38 96 H62 Z" fill="${c.mork}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
  `, 'art-maskot');
}

/* ── MEDIANEN — fyrtårnet som alltid står midt i ────────────────── */
function maskotMedian(mood) {
  const c = FARGE.median;
  const armer = mood === 'skuldertrekk'
    ? `<path d="M36 58 L24 48 M64 58 L76 48" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`
    : `<path d="M36 58 L30 66 M64 58 L70 66" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
  return svg('0 0 100 100', `
    <path d="M24 96 H76" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <path d="M50 96 V20" stroke="${c.mork}" stroke-width="5" stroke-linecap="round" stroke-dasharray="7 6"/>
    <path d="M36 92 L40 56 H60 L64 92 Z" fill="${c.fyll}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    ${armer}
    <circle cx="50" cy="38" r="15" fill="${c.lys}" stroke="${INK}" stroke-width="3.5"/>
    ${ansikt(50, 36, mood)}
    <path d="M34 22 H66 L60 30 H40 Z" fill="${c.mork}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
  `, 'art-maskot');
}

/* ── TYPETALLET — stabelen med krone. Høyest vinner. ────────────── */
function maskotMode(mood) {
  const c = FARGE.mode;
  return svg('0 0 100 100', `
    <path d="M18 96 H82" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <rect x="26" y="76" width="48" height="18" rx="2" fill="${c.lys}" stroke="${INK}" stroke-width="3.5"/>
    <rect x="30" y="58" width="40" height="18" rx="2" fill="${c.fyll}" stroke="${INK}" stroke-width="3.5"/>
    <rect x="34" y="40" width="32" height="18" rx="2" fill="${c.fyll}" stroke="${INK}" stroke-width="3.5"/>
    ${ansikt(50, 48, mood, 0.85)}
    <path d="M34 36 L38 24 L44 32 L50 20 L56 32 L62 24 L66 36 Z"
          fill="${c.mork}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  `, 'art-maskot');
}

export function maskot(key, mood = 'rolig') {
  if (key === 'mean') return maskotMean(mood);
  if (key === 'median') return maskotMedian(mood);
  if (key === 'mode') return maskotMode(mood);
  return '';
}

/* ── Småikoner. Samme silhuett som maskoten, lesbar på 20 px. ───── */
export function maleIkon(key) {
  const c = FARGE[key];
  if (key === 'mean') return svg('0 0 24 24', `
    <rect x="2" y="9" width="20" height="3.5" rx="1" fill="${c.fyll}" stroke="${INK}" stroke-width="2"/>
    <path d="M12 13 L7 22 H17 Z" fill="${c.mork}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="12" cy="5" r="3.4" fill="${c.lys}" stroke="${INK}" stroke-width="2"/>`, 'art-ikon');
  if (key === 'median') return svg('0 0 24 24', `
    <path d="M3 21 H21" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
    <path d="M12 21 V3" stroke="${c.mork}" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="3.5 3"/>
    <rect x="8" y="9" width="8" height="12" rx="1" fill="${c.fyll}" stroke="${INK}" stroke-width="2"/>`, 'art-ikon');
  return svg('0 0 24 24', `
    <path d="M3 21 H21" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
    <rect x="5" y="15" width="14" height="6" rx="1" fill="${c.lys}" stroke="${INK}" stroke-width="2"/>
    <rect x="7" y="9" width="10" height="6" rx="1" fill="${c.fyll}" stroke="${INK}" stroke-width="2"/>
    <rect x="9" y="3" width="6" height="6" rx="1" fill="${c.fyll}" stroke="${INK}" stroke-width="2"/>`, 'art-ikon');
}

/* ── Stjerne til kapittelbelønning ─────────────────────────────── */
export function stjerne(fylt) {
  return svg('0 0 24 24', `<path d="M12 2.5 14.9 9.1 22 9.9 16.7 14.7 18.2 21.7 12 18.1 5.8 21.7 7.3 14.7 2 9.9 9.1 9.1 Z"
    fill="${fylt ? '#f4b942' : '#ffffff'}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`, 'art-stjerne');
}

/* ── Klientmedaljong: emoji i ramme, farget etter hva klienten
      faktisk trenger å vite. ───────────────────────────────────── */
export function klientMedaljong(emoji, behov) {
  const c = FARGE[behov] || { lys: '#eef2f7' };
  return `<span class="klient-medaljong" style="--medaljong:${c.lys}" aria-hidden="true">${emoji}</span>`;
}

/* ── Heltebildet på startskjermen ──────────────────────────────────
   Samme brett som spilles på: prikker på en tallinje, uteliggeren
   langt til høyre og vektstanga som allerede har begynt å vippe. */
export function heltebilde() {
  const kropp = [22, 30, 30, 38, 46];
  const prikk = (x, y, f) =>
    `<circle cx="${x}" cy="${y}" r="9" fill="${f}" stroke="${INK}" stroke-width="3"/>`;
  let prikker = '', hoyde = {};
  kropp.forEach(x => {
    hoyde[x] = (hoyde[x] || 0) + 1;
    prikker += prikk(x * 4 + 40, 118 - (hoyde[x] - 1) * 21, '#ffffff');
  });
  prikker += prikk(84 * 4 + 40, 118, FARGE.mean.fyll);
  return svg('0 0 420 190', `
    <g transform="rotate(-7 216 132)">
      <rect x="30" y="126" width="372" height="11" rx="3" fill="${FARGE.mean.fyll}" stroke="${INK}" stroke-width="3.5"/>
      ${prikker}
    </g>
    <path d="M216 140 L198 176 H234 Z" fill="${FARGE.mean.mork}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M168 30 V150" stroke="${FARGE.median.mork}" stroke-width="4" stroke-dasharray="8 7" stroke-linecap="round"/>
    <g transform="translate(168 22)">
      <rect x="-30" y="-16" width="60" height="26" rx="4" fill="${FARGE.median.fyll}" stroke="${INK}" stroke-width="3"/>
      <text x="0" y="3" text-anchor="middle" font-family="Nunito,sans-serif" font-weight="900"
            font-size="15" fill="#ffffff">median</text>
    </g>
  `, 'art-helt');
}
