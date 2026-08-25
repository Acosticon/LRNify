/* ══════════════════════════════════════════════════════════════════
   stats.js — ren matematikk. Ingen DOM, ingen tilstand.
   Alt spillet påstår om et datasett, regnes her og bare her.
   ══════════════════════════════════════════════════════════════════ */

export function sortNum(a) { return [...a].sort((x, y) => x - y); }

export function sum(a) { return a.reduce((s, v) => s + v, 0); }

export function mean(a) { return a.length ? sum(a) / a.length : NaN; }

export function median(a) {
  if (!a.length) return NaN;
  const s = sortNum(a), n = s.length, m = n >> 1;
  return n % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/* Frekvenstabell, sortert stigende på verdi. */
export function counts(a) {
  const m = new Map();
  a.forEach(v => m.set(v, (m.get(v) || 0) + 1));
  return new Map([...m.entries()].sort((x, y) => x[0] - y[0]));
}

export function maxCount(a) {
  if (!a.length) return 0;
  return Math.max(...counts(a).values());
}

/* Tom liste = ingen typetall (alle verdier forekommer like ofte). */
export function modes(a) {
  const c = counts(a);
  if (!c.size) return [];
  const max = Math.max(...c.values());
  if (max === 1) return [];
  const list = [...c.entries()].filter(([, n]) => n === max).map(([v]) => v);
  return list.length === c.size ? [] : list;
}

export function span(a) { return a.length ? Math.max(...a) - Math.min(...a) : 0; }

export function describe(a) {
  return {
    n: a.length, sum: sum(a), mean: mean(a), median: median(a),
    modes: modes(a), min: Math.min(...a), max: Math.max(...a), span: span(a)
  };
}

/* ── Tallformat ─────────────────────────────────────────────────── */

export function round1(n) { return Math.round(n * 10) / 10; }

/* Norsk desimaltegn, aldri mer enn én desimal, tusenskille med tynt mellomrom. */
export function fmtNum(n) {
  if (!Number.isFinite(n)) return '–';
  const r = round1(n);
  const neg = r < 0, abs = Math.abs(r);
  const whole = Math.floor(abs);
  const dec = Math.round((abs - whole) * 10);
  let out = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  if (dec) out += ',' + dec;
  return (neg ? '−' : '') + out;
}

export function fmtList(a, sep = ', ') { return a.map(fmtNum).join(sep); }

export function fmtModes(m) {
  if (!m.length) return 'Ingen typetall';
  return m.map(fmtNum).join(' og ');
}

/* Verdien av et sentralmål som tekst, uansett hvilket. */
export function measureText(key, data) {
  if (key === 'mode') return fmtModes(modes(data));
  return fmtNum(key === 'mean' ? mean(data) : median(data));
}

export function measureValue(key, data) {
  if (key === 'mode') return modes(data);
  return key === 'mean' ? mean(data) : median(data);
}

/* ── Elevinput ──────────────────────────────────────────────────── */

/* Godtar komma, punktum, mellomrom som tusenskille. */
export function parseNum(str) {
  if (str == null) return NaN;
  const cleaned = String(str).trim()
    .replace(/[\s  ]/g, '')
    .replace(',', '.');
  if (cleaned === '' || !/^-?\d*\.?\d*$/.test(cleaned)) return NaN;
  return parseFloat(cleaned);
}

/* Toleranse skalerer med størrelsen på tallet: 0,05 for små tall,
   men et gjennomsnitt på 47 000 skal ikke underkjennes for 0,4. */
export function near(user, correct) {
  if (!Number.isFinite(user) || !Number.isFinite(correct)) return false;
  const tol = Math.max(0.051, Math.abs(correct) * 1e-6);
  return Math.abs(user - correct) <= tol;
}

/* ── Renhetskrav på genererte datasett ──────────────────────────── */

/* «Pene tall»: for små enheter godtar vi én desimal, for store
   (kroner, visninger) krever vi at gjennomsnittet blir et helt tall.
   Uten dette drukner spillet i hoderegning. */
export function meanIsClean(data, step) {
  const s = sum(data), n = data.length;
  if (!n) return false;
  return step >= 10 ? s % n === 0 : (s * 10) % n === 0;
}
