// game.js – Tilstand, poeng og regler.
//
// Designvalg som styrer alt annet i denne fila:
// Innsiktspoeng er den eneste ekte poengsummen. De tre målerne
// (spredning, troverdighet, skade) er fortelling, ikke score. Man kan
// ikke «vinne» Løpeilden ved å manipulere godt – bare ved å avsløre godt.

import { RUNDER, HENDELSER, MERKER, SLUTTUTFORDRING, TEKNIKKER } from './content.js';

export const ANTALL_RUNDER = RUNDER.length;

const LAGER_NOKKEL = 'lopeilden.lagret.v1';

// Poeng per motgift: full pott ved riktig på første forsøk.
const POENG_FORSTE  = 10;
const POENG_ANDRE   = 5;
const POENG_DELVIS  = 3;
const POENG_SLUTT   = 8;   // per riktig i sluttutfordringen

export const MAKS_POENG = ANTALL_RUNDER * POENG_FORSTE + SLUTTUTFORDRING.length * POENG_SLUTT;

const klem = v => Math.max(0, Math.min(100, Math.round(v)));

/* ─── Tilstand ───────────────────────────────────────── */

export function nyTilstand(navn = 'Deg') {
  return {
    versjon: 1,
    navn,
    rundeNr: 1,
    slag: 'trekk',            // trekk → ekko → motgift → laering
    malere: { spredning: 5, troverdighet: 50, skade: 0 },
    innsikt: 0,
    valgtTrekk: null,         // indeks i rundens valgliste
    hendelse: null,
    bruktHendelse: [],        // id-er, så samme kort ikke trekkes to ganger
    motgiftValg: [],          // indekser spilleren har prøvd denne runden
    motgiftLost: false,
    motgiftPoeng: 0,
    apneTeknikker: [],
    logg: [],                 // { runde, valgTekst, teknikk, effekt }
    ofre: {},                 // { personId: skadepoeng }
    flagg: [],                // f.eks. 'skjermbilde', 'rettet'
    rundeResultat: [],        // per runde: { rent: true } når motgiften ble løst uten bom
    fullPott: 0,              // antall motgifter løst på første forsøk
    sluttSvar: [],            // svar i sluttutfordringen
    ferdig: false
  };
}

export const rundeFor = t => RUNDER[t.rundeNr - 1];

/* ─── Slag 1: trekket ────────────────────────────────── */

export function velgTrekk(t, valgIndeks) {
  if (t.slag !== 'trekk') return t;
  const runde = rundeFor(t);
  const valg = runde.valg[valgIndeks];
  if (!valg) return t;

  const malere = leggTil(t.malere, valg.effekt);
  const ofre = { ...t.ofre };
  if (valg.offer) ofre[valg.offer] = (ofre[valg.offer] || 0) + (valg.effekt.skade || 0);

  // Ryktet om låsene rammer alltid vaktmesteren, uansett hvem du sikter på.
  if ((valg.effekt.skade || 0) > 8) ofre.rune = (ofre.rune || 0) + Math.round(valg.effekt.skade / 2);

  const flagg = [...t.flagg];
  if (runde.id === 'motangrepet' && (valg.effekt.skade || 0) < 0 && !flagg.includes('rettet')) {
    flagg.push('rettet');
  }

  const hendelse = trekkHendelse(t);

  return {
    ...t,
    slag: 'ekko',
    valgtTrekk: valgIndeks,
    malere,
    ofre,
    flagg,
    hendelse,
    bruktHendelse: [...t.bruktHendelse, hendelse.id],
    logg: [...t.logg, {
      runde: runde.nr,
      rundeTittel: runde.tittel,
      valgTekst: valg.tekst,
      teknikk: valg.teknikk ? runde.teknikk : null,
      effekt: valg.effekt
    }]
  };
}

function leggTil(malere, effekt = {}) {
  return {
    spredning:    klem(malere.spredning    + (effekt.spredning    || 0)),
    troverdighet: klem(malere.troverdighet + (effekt.troverdighet || 0)),
    skade:        klem(malere.skade        + (effekt.skade        || 0))
  };
}

// Hendelseskort trekkes uten tilbakelegging, så ingen runde gjentar seg.
function trekkHendelse(t) {
  const brukt = new Set(t.bruktHendelse);
  const mulige = HENDELSER.filter(h => !brukt.has(h.id) && !(h.flagg && t.flagg.includes(h.flagg)));
  const pool = mulige.length ? mulige : HENDELSER;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ─── Slag 2: ekkoet ─────────────────────────────────── */

export function bekreftEkko(t) {
  if (t.slag !== 'ekko') return t;
  const h = t.hendelse;
  const flagg = h?.flagg && !t.flagg.includes(h.flagg) ? [...t.flagg, h.flagg] : t.flagg;

  return {
    ...t,
    slag: 'motgift',
    malere: leggTil(t.malere, h?.effekt),
    flagg,
    motgiftValg: [],
    motgiftLost: false,
    motgiftPoeng: 0
  };
}

/* ─── Slag 3: motgiften ──────────────────────────────── */

// Returnerer { tilstand, riktig, delvis, ferdig }
export function svarMotgift(t, indeks) {
  if (t.slag !== 'motgift' || t.motgiftLost) return { tilstand: t };
  const m = rundeFor(t).motgift;
  const alt = m.alternativer[indeks];
  if (!alt || t.motgiftValg.includes(indeks)) return { tilstand: t };

  const valg = [...t.motgiftValg, indeks];
  const forsok = valg.length;

  // Flervalg: samle N riktige før runden er løst.
  if (m.flervalg) {
    const riktigeValgt = valg.filter(i => m.alternativer[i].riktig).length;
    const bom = valg.filter(i => !m.alternativer[i].riktig).length;
    const lost = riktigeValgt >= m.flervalg;
    const poeng = lost ? (bom === 0 ? POENG_FORSTE : Math.max(POENG_ANDRE - bom, 1)) : 0;

    return {
      tilstand: {
        ...t,
        motgiftValg: valg,
        motgiftLost: lost,
        motgiftPoeng: poeng,
        innsikt: lost ? t.innsikt + poeng : t.innsikt,
        fullPott: lost && bom === 0 ? t.fullPott + 1 : t.fullPott,
        rundeResultat: lost ? settResultat(t, bom === 0) : t.rundeResultat,
        slag: lost ? 'laering' : 'motgift',
        apneTeknikker: lost ? leggTilTeknikk(t) : t.apneTeknikker
      },
      riktig: alt.riktig,
      ferdig: lost
    };
  }

  // Enkeltvalg
  if (!alt.riktig) {
    // Et «nesten»-svar koster mindre enn et bomskudd, men runden løses ikke.
    return { tilstand: { ...t, motgiftValg: valg }, riktig: false, delvis: !!alt.delvis };
  }

  const bom = valg.length - 1;
  const delvisBom = valg.slice(0, -1).filter(i => m.alternativer[i].delvis).length;
  const poeng = bom === 0 ? POENG_FORSTE
              : (bom === delvisBom ? POENG_ANDRE : Math.max(POENG_DELVIS - (bom - 1), 1));

  return {
    tilstand: {
      ...t,
      motgiftValg: valg,
      motgiftLost: true,
      motgiftPoeng: poeng,
      innsikt: t.innsikt + poeng,
      fullPott: bom === 0 ? t.fullPott + 1 : t.fullPott,
      rundeResultat: settResultat(t, bom === 0),
      slag: 'laering',
      apneTeknikker: leggTilTeknikk(t)
    },
    riktig: true,
    ferdig: true
  };
}

function leggTilTeknikk(t) {
  const id = rundeFor(t).teknikk;
  return t.apneTeknikker.includes(id) ? t.apneTeknikker : [...t.apneTeknikker, id];
}

function settResultat(t, rent) {
  const res = [...t.rundeResultat];
  res[t.rundeNr - 1] = { rent };
  return res;
}

/* ─── Runde til runde ────────────────────────────────── */

export const erSisteRunde = t => t.rundeNr >= ANTALL_RUNDER;

export function nesteRunde(t) {
  if (erSisteRunde(t)) return { ...t, slag: 'sluttutfordring' };
  return {
    ...t,
    rundeNr: t.rundeNr + 1,
    slag: 'trekk',
    valgtTrekk: null,
    hendelse: null,
    motgiftValg: [],
    motgiftLost: false,
    motgiftPoeng: 0
  };
}

/* ─── Sluttutfordring ────────────────────────────────── */

export function svarSlutt(t, oppgaveIndeks, teknikkId) {
  const riktig = SLUTTUTFORDRING[oppgaveIndeks].riktig === teknikkId;
  const sluttSvar = [...t.sluttSvar];
  sluttSvar[oppgaveIndeks] = { valgt: teknikkId, riktig };
  return {
    ...t,
    sluttSvar,
    innsikt: riktig ? t.innsikt + POENG_SLUTT : t.innsikt
  };
}

export const sluttFerdig = t =>
  SLUTTUTFORDRING.every((_, i) => t.sluttSvar[i]);

/* ─── Sluttoppgjør ───────────────────────────────────── */

export function merkerOppnadd(t) {
  const perRunde = ['adresse', 'kaldthode', 'bilde', 'flokk', 'sak', 'bru'];
  const vunnet = new Set();

  // Ett merke per runde der motgiften ble løst uten bom.
  (t.rundeResultat || []).forEach((r, i) => { if (r?.rent && perRunde[i]) vunnet.add(perRunde[i]); });

  if (t.apneTeknikker.length >= Object.keys(TEKNIKKER).length) vunnet.add('samler');
  if (t.malere.skade < 40) vunnet.add('rein');
  if (t.flagg.includes('rettet')) vunnet.add('angrer');
  if (t.fullPott >= ANTALL_RUNDER) vunnet.add('skarp');

  return MERKER.filter(m => vunnet.has(m.id));
}

export function karakter(t) {
  const p = t.innsikt / MAKS_POENG;
  if (p >= 0.9) return { tittel: 'Brannvakt',      tekst: 'Du kjenner igjen teknikkene raskere enn de rekker å virke. Det er ikke flaks – det er trening.' };
  if (p >= 0.7) return { tittel: 'Skarpt blikk',   tekst: 'Du tar de fleste triksene. De du bommet på, er verdt å se på én gang til.' };
  if (p >= 0.5) return { tittel: 'På sporet',      tekst: 'Du ser at noe er galt, men ikke alltid hva. Navnet på teknikken er halve jobben.' };
  if (p >= 0.3) return { tittel: 'Lett å lure',    tekst: 'Flere av triksene gikk rett gjennom. Det er helt vanlig, og det er nettopp derfor de brukes.' };
  return { tittel: 'Perfekt publikum', tekst: 'Nesten alt traff. Ingen skam i det – men gå gjennom teknikkortene før du scroller videre.' };
}

// Sluttdommen over hvordan spilleren spilte, ikke bare hvor godt.
export function ettermaele(t) {
  const { skade, spredning, troverdighet } = t.malere;
  if (skade >= 70)  return 'Du fikk stor rekkevidde. Andre betalte for den, og de fleste av dem fikk aldri vite hvorfor.';
  if (skade >= 45)  return 'Ryktet gikk sin runde og la seg. Noen av dem det traff, merker det fortsatt.';
  if (spredning >= 60) return 'Du nådde langt uten å knuse noe. Det er sjeldnere enn det høres ut som.';
  if (troverdighet >= 65) return 'Du valgte det sanne framfor det store. Færre så det. De som gjorde det, kan stole på deg neste gang.';
  return 'Ryktet ble aldri stort. Det er også et resultat.';
}

/* ─── Lagring ────────────────────────────────────────── */

export function lagre(t) {
  try {
    localStorage.setItem(LAGER_NOKKEL, JSON.stringify(t));
  } catch { /* privat nettlesing – spillet går fint uten lagring */ }
}

export function hentLagret() {
  try {
    const rad = localStorage.getItem(LAGER_NOKKEL);
    if (!rad) return null;
    const t = JSON.parse(rad);
    return t?.versjon === 1 && !t.ferdig ? t : null;
  } catch { return null; }
}

export function slettLagret() {
  try { localStorage.removeItem(LAGER_NOKKEL); } catch { /* ignorer */ }
}

/* ─── Hjelp ──────────────────────────────────────────── */

export function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
