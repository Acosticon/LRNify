/* =========================================================
   STATISTIKKMOTOR
   Ren regnelogikk. Ingen DOM, ingen spillregler.
   All statistikk i spillet går gjennom denne fila.
   ========================================================= */

/* Tallene kan være desimaltall, så alle sammenlikninger går
   gjennom denne i stedet for === */
const EPS = 1e-9;

export function nearlyEqual(a, b) {
  if (a === null || b === null || a === undefined || b === undefined) return false;
  return Math.abs(a - b) < EPS;
}

export function calculateSum(values) {
  return values.reduce((sum, v) => sum + v, 0);
}

export function calculateMean(values) {
  if (!values.length) return null;
  return calculateSum(values) / values.length;
}

export function calculateMedian(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/* Typetall-regelen i dette spillet:
   Et typetall finnes BARE dersom én verdi forekommer oftere enn
   alle andre. 2, 2, 4, 4, 7 gir altså mode = null — ikke to typetall.
   Det gjør spillreglene entydige, og gjør det mulig å stille kravet
   «datasettet skal ikke ha noe typetall». */
export function calculateMode(values) {
  if (!values.length) return null;
  const counts = countValues(values);
  let best = null, bestCount = 0, tied = false;
  for (const [value, count] of counts) {
    if (count > bestCount) { best = value; bestCount = count; tied = false; }
    else if (count === bestCount) { tied = true; }
  }
  return tied ? null : best;
}

export function calculateRange(values) {
  if (!values.length) return null;
  return Math.max(...values) - Math.min(...values);
}

/* Map fra verdi -> antall forekomster, i stigende verdirekkefølge */
export function countValues(values) {
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
  return new Map([...counts.entries()].sort((a, b) => a[0] - b[0]));
}

export function calculateStats(values) {
  return {
    mean: calculateMean(values),
    median: calculateMedian(values),
    mode: calculateMode(values),
    range: calculateRange(values),
    sum: calculateSum(values),
    count: values.length,
    min: values.length ? Math.min(...values) : null,
    max: values.length ? Math.max(...values) : null,
    counts: countValues(values),
  };
}

/* --- visning ------------------------------------------------ */

/* Norsk tallformat: komma som desimalskilletegn, maks to desimaler,
   ingen etterfølgende nuller. null vises som «–». */
export function formatNumber(value, { nullText = '–' } = {}) {
  if (value === null || value === undefined || Number.isNaN(value)) return nullText;
  const rounded = Math.round(value * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded);
  return String(rounded).replace('.', ',');
}

/* «4, 6, 7» — brukes i hint, fasit og observasjoner */
export function formatDataset(values, { sorted = true } = {}) {
  const list = sorted ? [...values].sort((a, b) => a - b) : values;
  return list.map((v) => formatNumber(v)).join(', ');
}

/* To datasett er samme løsning når de er like sortert:
   2, 4, 6, 8 og 8, 6, 4, 2 teller som én løsning. */
export function datasetKey(values) {
  return [...values].sort((a, b) => a - b).join(',');
}
