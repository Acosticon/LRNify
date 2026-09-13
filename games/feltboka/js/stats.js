/* =========================================================
   STATISTIKK — hendelser til /bruk-feltboka/ (admin-dashbordet)

   Egen teller, atskilt fra den generelle /bruk/-telleren
   (bruk/lrnify-bruk.js) som resten av sidene bruker. Grunnen er at
   dashbordet skal kunne vise tall PER BRUKER (oppgaver løst, median
   tid per oppgave, figurer funnet) i tillegg til totalen — noe den
   generelle telleren med vilje ikke støtter noe sted ellers på
   lrnify.no (se bruk/README.md).

   Løsningen er en tilfeldig, lokalt generert id (ikke navn, ikke
   e-post, ikke IP) som lagres i samlingen (progress.js) og sendes med
   hver hendelse. Samme prinsipp som den anonyme påloggingen
   rom-verktøyene allerede bruker (se personvern/index.html) — bare
   uten selve Firebase-innloggingen, siden dette kun er tellere uten
   leserettigheter for eleven.

   Hver hendelse er én PUT mot Firebase sin serverside-inkrementering,
   nøyaktig som bruk/lrnify-bruk.js — se den fila for hvorfor
   ".sv":{"increment":1} er valgt. Feiler i stillhet: spillet skal
   aldri knekke fordi statistikk ikke kom fram.
   ========================================================= */

const DB = 'https://poll-c6bd2-default-rtdb.europe-west1.firebasedatabase.app';

/* Bare den ekte sida telles — lokal utvikling og forhåndsvisninger skal
   ikke blande seg inn i tallene (samme liste som lrnify-bruk.js). */
const TELLENDE_VERTER = ['lrnify.no', 'www.lrnify.no'];

function dato() {
  try {
    return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Oslo' }).format(new Date());
  } catch (e) {
    return new Date().toISOString().slice(0, 10);
  }
}

function skalTelle() {
  return typeof fetch === 'function' && typeof location !== 'undefined'
    && TELLENDE_VERTER.indexOf(location.hostname) !== -1;
}

/**
 * Lager en ny, tilfeldig bruker-id for statistikken — 32 heksadesimale
 * tegn, uten bindestreker. Ikke et FEIDE-id, ikke knyttet til noe navn:
 * bare et kjennemerke som lar dashbordet skille to elever fra hverandre.
 */
export function lagAnonymId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '');
  }
  // Eldre nettlesere uten crypto.randomUUID: godt nok til formålet.
  return (Date.now().toString(16) + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2)).slice(0, 32);
}

/**
 * Øker én teller med 1, under gitt bruker-id og dagens dato.
 * @param {string} brukerId  Fra Framgang#anonymId().
 * @param {string} hendelse  F.eks. 'riktig', 'riktig-tema-brok', 'tid-under10s'.
 */
export function tell(brukerId, hendelse) {
  if (!brukerId || !hendelse || !skalTelle()) return Promise.resolve(false);

  const url = `${DB}/bruk-feltboka/${dato()}/${brukerId}/${hendelse}.json?print=silent`;
  return fetch(url, {
    method: 'PUT',
    body: '{".sv":{"increment":1}}',
    keepalive: true,
    cache: 'no-store'
  }).then(r => r.ok, () => false);
}
