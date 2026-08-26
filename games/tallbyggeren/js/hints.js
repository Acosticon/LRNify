/* =========================================================
   HINTMOTOR
   Hintene er håndskrevet i oppgaven — motoren genererer dem ikke.
   Det eneste den gjør, er å fylle inn tall fra spillerens datasett
   der teksten ber om det, slik at det siste hintet kan si noe om
   situasjonen spilleren faktisk står i.

   Felter som kan brukes i hintteksten:
   {sum} {malsum} {mangler} {retning} {gjennomsnitt} {median}
   {typetall} {bredde} {antall} {minste} {storste} {tallene}
   ========================================================= */

import { calculateStats, formatNumber, formatDataset } from './stats.js';

export function hintFields(challenge, dataset) {
  const stats = calculateStats(dataset);
  const targetSum = 'mean' in challenge.requirements
    ? challenge.requirements.mean * challenge.values.count : null;
  const gap = targetSum === null ? null : targetSum - stats.sum;

  return {
    sum: formatNumber(stats.sum),
    malsum: formatNumber(targetSum),
    mangler: formatNumber(gap === null ? null : Math.abs(gap)),
    retning: gap === null ? '' : gap > 0 ? 'for lite' : gap < 0 ? 'for mye' : 'akkurat nok',
    gjennomsnitt: formatNumber(stats.mean),
    median: formatNumber(stats.median),
    typetall: formatNumber(stats.mode, { nullText: 'ingen' }),
    bredde: formatNumber(stats.range),
    antall: formatNumber(stats.count),
    minste: formatNumber(stats.min),
    storste: formatNumber(stats.max),
    tallene: formatDataset(dataset),
  };
}

export function resolveHint(text, challenge, dataset) {
  const fields = hintFields(challenge, dataset);
  return text.replace(/\{(\w+)\}/g, (match, key) =>
    key in fields ? fields[key] : match
  );
}

/* Hintene kommer ett om gangen, i den rekkefølgen oppgaven har
   skrevet dem. Motoren vet aldri mer enn oppgaven har gitt den. */
export function hintAt(challenge, dataset, index) {
  if (index < 0 || index >= challenge.hints.length) return null;
  return resolveHint(challenge.hints[index], challenge, dataset);
}

export function hintCount(challenge) {
  return challenge.hints.length;
}
