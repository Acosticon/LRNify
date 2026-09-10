/* =========================================================
   QA — kjør etter hver endring i generatorene eller artsdataene:

       node games/feltboka/qa/check.mjs

   Tre ting kontrolleres:

   1. OPPGAVENE. Hver generator kjøres mange ganger med fast frø.
      Fasiten sjekkes ikke bare mot seg selv: spørsmålsteksten
      leses av en UAVHENGIG parser her i QA-en, og de to må bli
      enige. Skriver generatoren «4 + 3 · 5» men regner ut noe
      annet enn 19, faller testen. (Parseren finnes bare her —
      spillet evaluerer aldri uttrykk, det regner dem ut direkte.)

   2. TREKNINGEN. Mange trekninger, og fordelingen må ligge nær
      vektene i species.js og variants.js.

   3. DATAENE. 30 arter, unike id-er, gyldige vekter og varianter,
      og en opptelling av hvor mange plassholder-fakta som gjenstår.
   ========================================================= */

import { TEMAER, NIVAER } from '../js/topics/index.js';
import { lagOppgave, sjekkSvar } from '../js/engine.js';
import { br, erLik, tilTall, tekst, pluss, minus, gange, tolkSvar } from '../js/rational.js';
import { ARTER } from '../js/data/species.js';
import { VARIANTER, varianterFor } from '../js/data/variants.js';
import { trekkFunn } from '../js/draw.js';

const PER_KOMBINASJON = 600;
const TREKNINGER = 120000;

let feil = 0;
const klag = (melding) => { feil++; console.error(`  FEIL: ${melding}`); };

/* ---------- Uavhengig uttrykksparser (kun QA) ---------- */

const HEVET = { '⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-' };

function parseUttrykk(tekstInn, x = null) {
  const s = tekstInn
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/g, c => `^${HEVET[c]}`)
    .replace(/\^-/g, '^ -')
    .replace(/\s+/g, '');
  let i = 0;

  const kikk = () => s[i];
  const del = (a, b) => { if (b.t === 0) throw new Error('deling på 0'); return gange(a, br(b.n, b.t)); };

  function primær() {
    if (kikk() === '(') { i++; const v = sum(); if (s[i] !== ')') throw new Error('mangler )'); i++; return potens(v); }
    if (kikk() === '-') { i++; return gange(br(-1), primær()); }
    if (kikk() === 'x') { i++; if (x === null) throw new Error('x uten verdi'); return potens(x); }
    const start = i;
    while (/[0-9]/.test(s[i] || '')) i++;
    if (i === start) throw new Error(`uventet tegn «${s[i]}» i «${tekstInn}»`);
    return potens(br(Number(s.slice(start, i))));
  }

  function potens(grunn) {
    if (kikk() !== '^') return grunn;
    i++;
    let neg = false;
    if (kikk() === '-') { neg = true; i++; }
    const start = i;
    while (/[0-9]/.test(s[i] || '')) i++;
    const e = Number(s.slice(start, i)) * (neg ? -1 : 1);
    const positiv = br(grunn.t ** Math.abs(e), grunn.n ** Math.abs(e));
    return e < 0 ? br(positiv.n, positiv.t) : positiv;
  }

  function produkt() {
    let v = primær();
    for (;;) {
      const c = kikk();
      if (c === '·' || c === '*' || c === '×') { i++; v = gange(v, primær()); }
      else if (c === ':' || c === '/') { i++; v = del(v, primær()); }
      else if (c === '(' || c === 'x') { v = gange(v, primær()); }   // implisitt: 3(x - 2), 8x
      else return v;
    }
  }

  function sum() {
    let v = produkt();
    for (;;) {
      const c = kikk();
      if (c === '+') { i++; v = pluss(v, produkt()); }
      else if (c === '-') { i++; v = minus(v, produkt()); }
      else return v;
    }
  }

  const svar = sum();
  if (i !== s.length) throw new Error(`kom ikke gjennom «${tekstInn}» (stoppet ved ${i})`);
  return svar;
}

/* ---------- Frø, så en feil kan gjenskapes ---------- */

function frø(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- 1. Oppgavene ---------- */

console.log('OPPGAVER');
for (const t of TEMAER) {
  for (const niva of NIVAER) {
    const rand = frø(0xFE17 + t.id.length * 31 + niva.id.length);
    const sett = new Set();
    let storsteNevner = 1, storsteVerdi = 0;

    for (let n = 0; n < PER_KOMBINASJON; n++) {
      let o;
      try { o = lagOppgave(t.id, niva.id, rand); }
      catch (e) { klag(`${t.id}/${niva.id} kastet: ${e.message}`); break; }

      if (!o.sporsmal || typeof o.sporsmal !== 'string') { klag(`${t.id}/${niva.id}: tomt spørsmål`); break; }
      if (!Number.isFinite(o.fasit.t) || !Number.isFinite(o.fasit.n) || o.fasit.n <= 0) {
        klag(`${t.id}/${niva.id}: ugyldig fasit i «${o.sporsmal}»`); break;
      }

      // Fasiten må kunne skrives og leses tilbake som samme tall.
      if (!erLik(o.fasit, tolkSvar(o.fasitTekst) ?? br(0))) {
        klag(`${t.id}/${niva.id}: «${o.fasitTekst}» leses ikke tilbake som fasit`); break;
      }
      // Og motoren må godta sin egen fasit som riktig svar.
      if (!sjekkSvar(o, o.fasitTekst).riktig) {
        klag(`${t.id}/${niva.id}: motoren godtar ikke egen fasit «${o.fasitTekst}»`); break;
      }

      // Uavhengig kontroll av selve regnestykket.
      if (t.id === 'likninger') {
        const [venstre, høyre] = o.sporsmal.split('=');
        try {
          if (!erLik(parseUttrykk(venstre, o.fasit), parseUttrykk(høyre, o.fasit))) {
            klag(`${t.id}/${niva.id}: x=${tekst(o.fasit)} løser ikke «${o.sporsmal}»`); break;
          }
        } catch (e) { klag(`${t.id}/${niva.id}: «${o.sporsmal}» – ${e.message}`); break; }
      } else if (t.id !== 'prosent') {
        try {
          if (!erLik(parseUttrykk(o.sporsmal), o.fasit)) {
            klag(`${t.id}/${niva.id}: «${o.sporsmal}» ≠ ${tekst(o.fasit)}`); break;
          }
        } catch (e) { klag(`${t.id}/${niva.id}: «${o.sporsmal}» – ${e.message}`); break; }
      } else {
        // Ordoppgaver kan ikke parses. Kontrollen her er at svaret er
        // et positivt heltall i samme størrelsesorden som tallene i teksten.
        const tall = (o.sporsmal.match(/\d+/g) || []).map(Number);
        const verdi = tilTall(o.fasit);
        if (o.fasit.n !== 1 || verdi <= 0 || verdi > Math.max(...tall) * 2) {
          klag(`${t.id}/${niva.id}: urimelig svar ${tekst(o.fasit)} på «${o.sporsmal}»`); break;
        }
      }

      if (t.svarform !== 'brok' && o.fasit.n !== 1) {
        klag(`${t.id}/${niva.id}: «${o.sporsmal}» gir brøksvar ${tekst(o.fasit)}`); break;
      }

      storsteNevner = Math.max(storsteNevner, o.fasit.n);
      storsteVerdi = Math.max(storsteVerdi, Math.abs(tilTall(o.fasit)));
      sett.add(o.sporsmal);
    }

    const variasjon = Math.round((sett.size / PER_KOMBINASJON) * 100);
    if (sett.size < 20) klag(`${t.id}/${niva.id}: bare ${sett.size} ulike oppgaver`);
    if (storsteVerdi > 100000) klag(`${t.id}/${niva.id}: svar helt opp i ${storsteVerdi}`);
    console.log(`  ${t.id.padEnd(16)} ${niva.id.padEnd(10)} ${String(sett.size).padStart(4)} ulike (${variasjon} %)`
      + `  største svar ${storsteVerdi}${storsteNevner > 1 ? `  største nevner ${storsteNevner}` : ''}`);
  }
}

/* ---------- 2. Trekningen ---------- */

console.log('\nTREKNING');
const rand = frø(0x5EED);
const artTeller = new Map(ARTER.map(a => [a.id, 0]));
const variantTeller = new Map(VARIANTER.map(v => [v.id, 0]));
for (let n = 0; n < TREKNINGER; n++) {
  const { artId, variantId } = trekkFunn(rand);
  artTeller.set(artId, artTeller.get(artId) + 1);
  variantTeller.set(variantId, variantTeller.get(variantId) + 1);
}

const vektSum = ARTER.reduce((s, a) => s + a.vekt, 0);
let verstAvvik = 0;
for (const a of ARTER) {
  const ventet = a.vekt / vektSum;
  const faktisk = artTeller.get(a.id) / TREKNINGER;
  verstAvvik = Math.max(verstAvvik, Math.abs(faktisk - ventet) / ventet);
}
if (verstAvvik > 0.15) klag(`artsfordelingen bommer med ${Math.round(verstAvvik * 100)} % på det verste`);
console.log(`  arter: største relative avvik fra vektene ${Math.round(verstAvvik * 100)} %`);

for (const v of VARIANTER) {
  const andel = (variantTeller.get(v.id) / TREKNINGER) * 100;
  const tillatt = ARTER.filter(a => varianterFor(a).some(x => x.id === v.id)).length;
  console.log(`  ${v.navn.padEnd(14)} ${andel.toFixed(2)} %  (oppgitt ${v.andel} %, tillatt hos ${tillatt}/${ARTER.length} arter)`);
  if (andel === 0) klag(`varianten ${v.id} ble aldri trukket`);
}

/* ---------- 3. Dataene ---------- */

console.log('\nDATA');
const ider = new Set();
let plassholderFakta = 0, presisert = 0;
for (const a of ARTER) {
  if (ider.has(a.id)) klag(`duplikat art-id: ${a.id}`);
  ider.add(a.id);
  if (!(a.vekt > 0)) klag(`${a.id}: vekt må være over 0`);
  if (!a.navn || !a.vitenskapelig) klag(`${a.id}: mangler navn eller vitenskapelig navn`);
  if (!a.fakta?.length) klag(`${a.id}: mangler fakta`);
  for (const f of a.fakta || []) if (/^\[FAKTA/.test(f)) plassholderFakta++;
  if (a.presisert) presisert++;
  for (const v of a.utenVarianter || []) {
    if (!VARIANTER.some(x => x.id === v)) klag(`${a.id}: utenVarianter peker på ukjent variant «${v}»`);
  }
  if (varianterFor(a).length < 2) klag(`${a.id}: for få varianter igjen`);
}
const ANTALL_ARTER_MVP = 6;
if (ARTER.length !== ANTALL_ARTER_MVP) klag(`MVP-rammen er ${ANTALL_ARTER_MVP} arter, her er det ${ARTER.length}`);

const muligeKombinasjoner = ARTER.reduce((s, a) => s + varianterFor(a).length, 0);
console.log(`  ${ARTER.length} arter · ${muligeKombinasjoner} mulige samleobjekter`);
console.log(`  ${plassholderFakta} plassholder-fakta gjenstår å skrive`);
console.log(`  ${presisert} arter er presisert fra gruppenavn og trenger faglig kontroll`);

console.log(feil === 0 ? '\nAlt OK.' : `\n${feil} feil.`);
process.exit(feil === 0 ? 0 : 1);
