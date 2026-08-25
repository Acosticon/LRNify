/* ══════════════════════════════════════════════════════════════════
   game.js — tilstand, moduser, poeng, lagring.

   Tre moduser på den samme oppgavemotoren:

     KAMPANJE  fem kapitler à fem oppgaver, ca. 25 minutter, med
               stjerner og lagring så økta tåler å bli avbrutt.
     ARKADE    genererte oppgaver på tid, tre liv, streak-multiplikator.
               Her er spilletiden ubegrenset.
     DAGLIG    fem oppgaver seedet på datoen — lik for alle, én gang
               per dag, med et delbart resultat.
   ══════════════════════════════════════════════════════════════════ */

import { CHAPTERS, ARCADE_VERBS } from './content.js';
import { lagOppgave, sjekk } from './tasks.js';
import { makeRng, randomRng } from './generator.js';

const LAGER = 'typisk.beta.v1';
export const MAKS_PER_OPPGAVE = 10;
export const ARKADE_LIV = 3;
const ARKADE_TID = 30;

/* ══════════════════════════════════════════════════════════════════
   MERKER — knyttet til begreper, ikke til flaks.
   ══════════════════════════════════════════════════════════════════ */
export const MERKER = [
  { id: 'uteliggerjeger', emoji: '🎯', navn: 'Uteliggerjeger', krav: 'Fem riktige på saker med uteligger' },
  { id: 'medianvakten', emoji: '🛡️', navn: 'Medianvakten', krav: 'Valgte medianen riktig åtte ganger' },
  { id: 'byggmester', emoji: '🔧', navn: 'Byggmester', krav: 'Løste tre byggeoppgaver på første forsøk' },
  { id: 'faktasjekker', emoji: '🔍', navn: 'Faktasjekker', krav: 'Full pott på en overskriftsoppgave' },
  { id: 'balansekunstner', emoji: '⚖️', navn: 'Balansekunstner', krav: 'Tre blink på rad i gjettemodus' },
  { id: 'sesongen', emoji: '🏆', navn: 'Hele sesongen', krav: 'Fullførte alle fem kapitlene' }
];

/* ══════════════════════════════════════════════════════════════════
   LAGRING
   ══════════════════════════════════════════════════════════════════ */
const tomtArkiv = () => ({
  stjerner: {},        // kapittel-id → 0–3
  merker: [],
  tellere: { uteligger: 0, median: 0, bygg: 0, blink: 0 },
  bestArkade: 0,
  dagligDato: null,
  dagligResultat: null
});

export function hentArkiv() {
  try {
    const rå = localStorage.getItem(LAGER);
    if (!rå) return tomtArkiv();
    return { ...tomtArkiv(), ...JSON.parse(rå) };
  } catch { return tomtArkiv(); }
}
export function lagreArkiv(a) {
  try { localStorage.setItem(LAGER, JSON.stringify(a)); } catch { /* privat modus — spillet går fint uten */ }
}
export function nullstillArkiv() {
  try { localStorage.removeItem(LAGER); } catch { }
}

/* ══════════════════════════════════════════════════════════════════
   ARKADE-BASSENGET — verb som tåler tidspress, sortert etter dybde.
   ══════════════════════════════════════════════════════════════════ */
const ARKADE_SPECS = [
  { verb: 'choose', shape: 'stram', niva: 1 },
  { verb: 'choose', shape: 'kategorisk', niva: 1 },
  { verb: 'compute', shape: 'stram', measures: ['median'], niva: 1 },
  { verb: 'predict', shape: 'stram', measure: 'median', niva: 1 },
  { verb: 'choose', shape: 'uteligger', niva: 2 },
  { verb: 'interpret', shape: 'uteligger', niva: 2 },
  { verb: 'predict', shape: 'uteligger', measure: 'mean', niva: 2 },
  { verb: 'compute', shape: 'uteligger', measures: ['median'], niva: 2 },
  { verb: 'finnfeil', shape: 'spredt', niva: 2 },
  { verb: 'choose', shape: 'todelt', niva: 3 },
  { verb: 'interpret', shape: 'todelt', niva: 3 },
  { verb: 'finnfeil', shape: 'uteligger', niva: 3 },
  { verb: 'overskrifter', shape: 'uteligger', niva: 3 },
  { verb: 'choose', shape: 'uniform', niva: 3 },
  { verb: 'compute', shape: 'uteligger', measures: ['mean', 'median'], niva: 4 },
  { verb: 'overskrifter', shape: 'todelt', niva: 4 }
];

function arkadeSpec(runde, rng) {
  const niva = runde < 4 ? 1 : runde < 9 ? 2 : runde < 15 ? 3 : 4;
  const pool = ARKADE_SPECS.filter(s => s.niva <= niva && s.niva >= Math.max(1, niva - 1));
  return pool[Math.floor(rng() * pool.length)];
}

/* ══════════════════════════════════════════════════════════════════
   TILSTAND
   ══════════════════════════════════════════════════════════════════ */
export function nyTilstand(modus, opts = {}) {
  const arkiv = hentArkiv();
  const base = {
    modus, arkiv, poeng: 0, runde: 0, resultater: [],
    oppgave: null, forsok: 0, låst: false, siste: null
  };

  if (modus === 'kampanje') {
    const kapittel = CHAPTERS[opts.kapittel ?? 0];
    return { ...base, rng: randomRng(), kapittel, kapittelIdx: opts.kapittel ?? 0, antall: kapittel.oppgaver.length };
  }
  if (modus === 'daglig') {
    const d = new Date();
    const dato = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const seed = [...dato].reduce((s, c) => (s * 31 + c.charCodeAt(0)) >>> 0, 7);
    return { ...base, rng: makeRng(seed), dato, antall: 5, dagligSpecs: dagligSpecs(makeRng(seed + 1)) };
  }
  return { ...base, rng: randomRng(), liv: ARKADE_LIV, streak: 0, beste: arkiv.bestArkade, tid: ARKADE_TID, antall: Infinity };
}

function dagligSpecs(rng) {
  const utvalg = ['choose', 'predict', 'interpret', 'overskrifter', 'finnfeil'];
  const former = ['uteligger', 'todelt', 'kategorisk', 'spredt', 'uteligger'];
  return utvalg.map((verb, i) => {
    const spec = { verb, shape: former[i] };
    if (verb === 'predict') spec.measure = 'mean';
    if (verb === 'finnfeil') spec.shape = 'spredt';
    if (verb === 'overskrifter') spec.shape = 'uteligger';
    if (verb === 'choose') spec.shape = former[Math.floor(rng() * former.length)];
    return spec;
  });
}

/* ══════════════════════════════════════════════════════════════════
   OPPGAVEFLYT
   ══════════════════════════════════════════════════════════════════ */
export function nesteOppgave(t) {
  t.forsok = 0; t.låst = false; t.siste = null;
  let spec;
  if (t.modus === 'kampanje') {
    if (t.runde >= t.kapittel.oppgaver.length) return null;
    spec = t.kapittel.oppgaver[t.runde];
  } else if (t.modus === 'daglig') {
    if (t.runde >= t.dagligSpecs.length) return null;
    spec = t.dagligSpecs[t.runde];
  } else {
    spec = arkadeSpec(t.runde, t.rng);
    t.tid = Math.max(14, ARKADE_TID - Math.floor(t.runde / 3) * 2);
  }
  t.oppgave = lagOppgave(spec, t.rng);
  /* Skulle generatoren gi opp på en sjelden kombinasjon, faller vi
     tilbake på en trygg oppgave i stedet for å stoppe spillet. */
  if (!t.oppgave) t.oppgave = lagOppgave({ verb: 'choose', shape: 'uteligger' }, t.rng);
  return t.oppgave;
}

/* Poeng faller med antall forsøk, men bunner aldri på null når det
   til slutt blir riktig — det er fortsatt mestring. */
function poengFor(forsok, andel = 1) {
  const grunn = forsok <= 1 ? 10 : forsok === 2 ? 7 : 5;
  return Math.round(grunn * andel);
}

export function svar(t, svarverdi) {
  if (t.låst) return t.siste;
  t.forsok++;
  const r = sjekk(t.oppgave, svarverdi);
  const andel = r.andel != null ? r.andel : (r.riktig ? 1 : 0);

  /* Vurderingsverbene låses etter ett forsøk. Tilbakemeldingen deres
     ER forklaringen, så «prøv igjen» ville bare bety å lese svaret og
     klikke det. Regne-, bygge- og sabotøroppgaver tåler flere forsøk:
     der er tilbakemeldingen et hint, ikke fasit. */
  const engangs = ['choose', 'interpret', 'finnfeil', 'predict', 'shock', 'overskrifter']
    .includes(t.oppgave.verb);

  if (r.riktig || engangs) {
    t.låst = true;
    const p = poengFor(t.forsok, andel);
    t.poeng += p;
    r.poeng = p;
    registrerTellere(t, r, andel);
    t.resultater.push({ verb: t.oppgave.verb, shape: t.oppgave.shape, riktig: r.riktig, andel, forsok: t.forsok, poeng: p });
    if (t.modus === 'arkade') {
      if (r.riktig) { t.streak++; t.poeng += Math.min(10, t.streak) * 2; }
      else { t.streak = 0; t.liv--; }
    }
  } else if (t.modus === 'arkade') {
    t.låst = true;
    t.streak = 0; t.liv--;
    r.poeng = 0;
    t.resultater.push({ verb: t.oppgave.verb, shape: t.oppgave.shape, riktig: false, andel: 0, forsok: t.forsok, poeng: 0 });
  }
  t.siste = r;
  return r;
}

/* Gi opp: vis fasit, ingen poeng, men flyten stopper aldri. */
export function girOpp(t) {
  if (t.låst) return t.siste;
  t.låst = true;
  const r = { riktig: false, avslort: true, poeng: 0, tilbakemelding: 'Fasit vist. Ingen poeng denne gangen — se forklaringen og gå videre.' };
  t.resultater.push({ verb: t.oppgave.verb, shape: t.oppgave.shape, riktig: false, andel: 0, forsok: t.forsok + 1, poeng: 0 });
  if (t.modus === 'arkade') { t.streak = 0; t.liv--; }
  t.siste = r;
  return r;
}

export function tidUte(t) {
  if (t.låst) return t.siste;
  t.låst = true;
  t.streak = 0; t.liv--;
  const r = { riktig: false, tidUte: true, poeng: 0, tilbakemelding: 'Tiden gikk ut.' };
  t.resultater.push({ verb: t.oppgave.verb, shape: t.oppgave.shape, riktig: false, andel: 0, forsok: t.forsok, poeng: 0 });
  t.siste = r;
  return r;
}

function registrerTellere(t, r, andel) {
  const a = t.arkiv, o = t.oppgave;
  if (r.riktig && o.shape === 'uteligger') a.tellere.uteligger++;
  if (r.riktig && o.verb === 'choose' && o.fasit?.includes('median')) a.tellere.median++;
  if (r.riktig && o.verb === 'bygg' && t.forsok === 1) a.tellere.bygg++;
  if (o.verb === 'predict') a.tellere.blink = r.riktig ? a.tellere.blink + 1 : 0;

  const nye = [];
  const gi = id => { if (!a.merker.includes(id)) { a.merker.push(id); nye.push(id); } };
  if (a.tellere.uteligger >= 5) gi('uteliggerjeger');
  if (a.tellere.median >= 8) gi('medianvakten');
  if (a.tellere.bygg >= 3) gi('byggmester');
  if (a.tellere.blink >= 3) gi('balansekunstner');
  if (o.verb === 'overskrifter' && andel === 1) gi('faktasjekker');
  if (nye.length) { r.nyeMerker = nye; lagreArkiv(a); }
}

export function ferdig(t) {
  if (t.modus === 'arkade') return t.liv <= 0;
  return t.runde >= t.antall;
}

export function stjernerFor(poeng, antall) {
  const maks = antall * MAKS_PER_OPPGAVE;
  const andel = maks ? poeng / maks : 0;
  return andel >= 0.9 ? 3 : andel >= 0.7 ? 2 : andel >= 0.45 ? 1 : 0;
}

export function avslutt(t) {
  const a = t.arkiv;
  if (t.modus === 'kampanje') {
    const s = stjernerFor(t.poeng, t.antall);
    const id = t.kapittel.id;
    a.stjerner[id] = Math.max(a.stjerner[id] || 0, s);
    if (CHAPTERS.every(k => (a.stjerner[k.id] || 0) > 0) && !a.merker.includes('sesongen')) {
      a.merker.push('sesongen');
    }
  } else if (t.modus === 'arkade') {
    a.bestArkade = Math.max(a.bestArkade, t.poeng);
  } else if (t.modus === 'daglig') {
    a.dagligDato = t.dato;
    a.dagligResultat = { poeng: t.poeng, resultater: t.resultater.map(r => r.andel) };
  }
  lagreArkiv(a);
  return a;
}

export function laasteKapitler(arkiv) {
  /* Kapittel n åpnes av minst én stjerne i n−1. Første er alltid åpent. */
  return CHAPTERS.map((k, i) => i === 0 ? false : !(arkiv.stjerner[CHAPTERS[i - 1].id] > 0));
}

export function dagligTattIDag(arkiv) {
  const d = new Date();
  const dato = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return arkiv.dagligDato === dato ? arkiv.dagligResultat : null;
}

export function delingstekst(t) {
  const ruter = t.resultater.map(r => r.andel === 1 ? '🟩' : r.andel > 0 ? '🟨' : '⬛').join('');
  return `Typisk! — dagens sak ${t.dato}\n${ruter}  ${t.poeng} poeng\nlrnify.no/games/typisk-beta/`;
}
