/* ══════════════════════════════════════════════════════════════════
   generator.js — datasett på bestilling.

   En sak = en KONTEKST (hva tallene handler om) × en FORM (hvordan de
   fordeler seg). Formen bærer poenget eleven skal ta; konteksten gir
   den et ansikt. 26 kontekster × 6 former gir hundrevis av saker.

   Alt går gjennom polish(): et datasett slipper ikke ut før
   gjennomsnittet er et pent tall OG formen faktisk er den vi bestilte.
   ══════════════════════════════════════════════════════════════════ */

import { mean, median, modes, span, counts, meanIsClean, sortNum } from './stats.js';

/* ── Seedet tilfeldighet, så «Dagens sak» blir lik for alle ─────── */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const randomRng = () => Math.random;

const ri = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
export const shuffled = (rng, arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

/* ══════════════════════════════════════════════════════════════════
   FORMENE — hver bærer ett poeng, og har en validator som holder
   generatoren ærlig.
   ══════════════════════════════════════════════════════════════════ */
export const SHAPES = {
  stram: {
    id: 'stram', label: 'Tett samlet',
    point: 'Alle tre sentralmålene er enige. Da spiller det liten rolle hvilket du velger.',
    best: ['mean', 'median', 'mode']
  },
  spredt: {
    id: 'spredt', label: 'Bredt spredt',
    point: 'Sentralmålene er enige om midten, men tallene ligger langt fra hverandre. Enighet er ikke det samme som presisjon.',
    best: ['mean', 'median']
  },
  uteligger: {
    id: 'uteligger', label: 'Med uteligger',
    point: 'Én verdi stikker seg voldsomt ut. Gjennomsnittet dras etter den; medianen står støtt.',
    best: ['median']
  },
  todelt: {
    id: 'todelt', label: 'Todelt',
    point: 'Tallene samler seg i to grupper. Både gjennomsnitt og median lander i tomrommet mellom dem — ingen er typiske.',
    best: []
  },
  kategorisk: {
    id: 'kategorisk', label: 'Kategorisk',
    point: 'Verdiene er hele, tellbare størrelser. Et gjennomsnitt på 37,4 finnes ikke i virkeligheten.',
    best: ['mode']
  },
  uniform: {
    id: 'uniform', label: 'Alle forskjellige',
    point: 'Ingen verdi går igjen. Da finnes det ikke noe typetall i det hele tatt.',
    best: ['median', 'mean']
  }
};

/* ── Byggerne. Alle jobber i hele «trinn» og ganges opp til slutt. ── */

function buildStram(rng, n) {
  const out = [];
  for (let i = 0; i < n; i++) out.push(ri(rng, -1, 1));
  if (new Set(out).size === n) out[ri(rng, 0, n - 1)] = out[0];
  return out;
}

function buildSpredt(rng, n) {
  const half = Math.floor(n / 2), out = [];
  for (let i = 1; i <= half; i++) { const d = i * ri(rng, 2, 3); out.push(-d); out.push(d); }
  while (out.length < n) out.push(ri(rng, -1, 1));
  return out.slice(0, n);
}

function buildUteligger(rng, n) {
  const out = [];
  for (let i = 0; i < n - 1; i++) out.push(ri(rng, -1, 1));
  out.push(ri(rng, 9, 18));
  return out;
}

function buildTodelt(rng, n) {
  const lo = Math.ceil(n / 2), gap = ri(rng, 7, 10), out = [];
  for (let i = 0; i < lo; i++) out.push(-gap + ri(rng, -1, 1));
  for (let i = lo; i < n; i++) out.push(gap + ri(rng, -1, 1));
  return out;
}

function buildKategorisk(rng, n) {
  const out = [];
  const topp = ri(rng, -1, 1);
  const antallTopp = Math.max(3, Math.floor(n / 2));
  for (let i = 0; i < antallTopp; i++) out.push(topp);
  const andre = [topp - 2, topp - 1, topp + 1, topp + 2].filter(v => v !== topp);
  for (let i = out.length; i < n; i++) out.push(pick(rng, andre));
  return out;
}

function buildUniform(rng, n) {
  const start = ri(rng, -3, -1), stegliste = [];
  let v = start;
  for (let i = 0; i < n; i++) { stegliste.push(v); v += ri(rng, 1, 2); }
  return stegliste;
}

const BUILDERS = {
  stram: buildStram, spredt: buildSpredt, uteligger: buildUteligger,
  todelt: buildTodelt, kategorisk: buildKategorisk, uniform: buildUniform
};

/* ── Validatorene. Ingen sak slipper ut som ikke faktisk viser
      det formen lover. ─────────────────────────────────────────── */

function validate(shape, d, step) {
  const s = sortNum(d), n = d.length, m = mean(d), med = median(d), mo = modes(d);
  const sp = span(d);
  if (d.some(v => v < 0)) return false;

  switch (shape) {
    case 'stram':
      return sp <= 3 * step && Math.abs(m - med) <= 0.6 * step && mo.length === 1;
    case 'spredt':
      return sp >= 8 * step && Math.abs(m - med) <= 0.7 * step;
    case 'uteligger': {
      const kropp = s.slice(0, n - 1);
      return s[n - 1] >= Math.max(...kropp) + 6 * step
        && span(kropp) <= 3 * step
        && m - med >= 1.2 * step
        && m > Math.max(...kropp);
    }
    case 'todelt': {
      // Ingen datapunkt får ligge nær midten — det er hele poenget.
      const tomtRundt = v => d.every(x => Math.abs(x - v) >= 2.5 * step);
      const lav = s.filter(v => v < m), hoy = s.filter(v => v > m);
      return lav.length >= 2 && hoy.length >= 2 && tomtRundt(m) && tomtRundt(med) && sp >= 10 * step;
    }
    case 'kategorisk':
      return mo.length === 1 && counts(d).get(mo[0]) >= 3 && sp <= 5 * step
        && Math.abs(m - Math.round(m)) > 0.05;   // gjennomsnittet må bli et «umulig» tall
    case 'uniform':
      return mo.length === 0 && new Set(d).size === n && sp >= 4 * step;
    default:
      return true;
  }
}

/* ── Polish: gjør gjennomsnittet pent uten å ødelegge formen ────── */

function polish(d, shape, step) {
  if (meanIsClean(d, step) && validate(shape, d, step)) return d;
  const deltas = step >= 10 ? [step, -step, 2 * step, -2 * step, 3 * step, -3 * step]
                            : [1, -1, 2, -2, 3, -3];
  for (const delta of deltas) {
    for (let i = 0; i < d.length; i++) {
      const c = [...d];
      c[i] += delta;
      if (meanIsClean(c, step) && validate(shape, c, step)) return c;
    }
  }
  return null;
}

/* ══════════════════════════════════════════════════════════════════
   generateData — bestill en form i en kontekst, få et datasett.
   ══════════════════════════════════════════════════════════════════ */
export function generateData(shape, ctx, rng, nWanted) {
  const step = ctx.step || 1;
  for (let forsok = 0; forsok < 200; forsok++) {
    const n = nWanted || ri(rng, ctx.nMin || 5, ctx.nMax || 8);
    const rå = BUILDERS[shape](rng, n);
    const senter = ctx.base + ri(rng, -(ctx.jitter || 0), ctx.jitter || 0) * step;
    let d = rå.map(v => senter + v * step);
    if (d.some(v => v < (ctx.min ?? 0))) continue;
    if (ctx.max != null && d.some(v => v > ctx.max)) continue;
    const p = polish(d, shape, step);
    if (!p) continue;
    if (p.some(v => v < (ctx.min ?? 0))) continue;
    if (ctx.max != null && p.some(v => v > ctx.max * 6)) continue;
    return shuffled(rng, p);
  }
  return null;
}
