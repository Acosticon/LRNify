/* =========================================================
   SPILLFLATEN
   Binder motoren, trekningen og framgangen til skjermen. All
   spilllogikk ligger i modulene under — denne fila tegner bare
   tilstanden og sender videre det eleven gjør.

   Kjerneloopen (GDD pkt. 4): velg tema → løs oppgaver →
   progresjon → funn → tilbake til oppgavene.
   ========================================================= */

import { CONFIG } from './config.js';
import { TEMAER, NIVAER, tema as finnTema } from './topics/index.js';
import { lagOppgave, sjekkSvar, svarHjelp } from './engine.js';
import { ARTER, KATEGORIER, art as finnArt } from './data/species.js';
import { varianterFor, variantNavn } from './data/variants.js';
import { illustrasjon } from './art.js';
import { Framgang } from './progress.js';

const $ = (id) => document.getElementById(id);
const framgang = new Framgang();

let valgtTema = null;
let valgtNiva = 'lett';
let aktivOppgave = null;
let autolukkTimer = null;
let feilTimer = null;

/* ---------- Skjermbytte ---------- */

function visSkjerm(navn) {
  clearTimeout(autolukkTimer);
  document.querySelectorAll('[data-skjerm]').forEach(s => {
    s.hidden = s.dataset.skjerm !== navn;
  });
  const faneFor = { velg: 'spill', oppgave: 'spill', funn: 'spill', samling: 'samling', art: 'samling', statistikk: 'statistikk' };
  document.querySelectorAll('.fane').forEach(f => {
    f.classList.toggle('er-valgt', f.dataset.fane === faneFor[navn]);
  });
}

/* ---------- Steg 1: velg tema og nivå ---------- */

function tegnValg() {
  const sist = framgang.sisteValg();
  valgtTema = sist.tema && finnTema(sist.tema) ? sist.tema : null;
  valgtNiva = NIVAER.some(n => n.id === sist.niva) ? sist.niva : 'lett';

  $('temaliste').replaceChildren(...TEMAER.map(t => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'valgkort';
    b.dataset.tema = t.id;
    b.innerHTML = `<span class="valgkort-navn"></span><span class="valgkort-eksempel"></span>`;
    b.querySelector('.valgkort-navn').textContent = t.navn;
    b.querySelector('.valgkort-eksempel').textContent = t.eksempel;
    b.addEventListener('click', () => { valgtTema = t.id; oppdaterValgstatus(); });
    return b;
  }));

  $('nivaliste').replaceChildren(...NIVAER.map(n => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'valgkort valgkort--niva';
    b.dataset.niva = n.id;
    b.textContent = n.navn;
    b.addEventListener('click', () => { valgtNiva = n.id; oppdaterValgstatus(); });
    return b;
  }));

  oppdaterValgstatus();
}

function oppdaterValgstatus() {
  document.querySelectorAll('[data-tema]').forEach(b => {
    b.classList.toggle('er-valgt', b.dataset.tema === valgtTema);
    b.setAttribute('aria-pressed', String(b.dataset.tema === valgtTema));
  });
  document.querySelectorAll('[data-niva]').forEach(b => {
    b.classList.toggle('er-valgt', b.dataset.niva === valgtNiva);
    b.setAttribute('aria-pressed', String(b.dataset.niva === valgtNiva));
  });
  $('start').disabled = !valgtTema;
}

/* ---------- Steg 2 og 3: oppgavene ---------- */

function startTrening() {
  if (!valgtTema) return;
  framgang.huskValg(valgtTema, valgtNiva);
  const t = finnTema(valgtTema);
  const niva = NIVAER.find(n => n.id === valgtNiva);
  $('oppgavetema').textContent = `${t.navn} · ${niva.navn}`;
  nyOppgave();
  visSkjerm('oppgave');
}

function nyOppgave() {
  aktivOppgave = lagOppgave(valgtTema, valgtNiva);
  $('sporsmal').textContent = aktivOppgave.sporsmal;
  $('svarhjelp').textContent = svarHjelp(aktivOppgave.svarform);
  const felt = $('svar');
  felt.value = '';
  felt.inputMode = aktivOppgave.tastatur === 'tekst' ? 'text' : 'decimal';
  felt.focus();
  tegnFramgang();
}

function tegnFramgang() {
  const { antall, mal } = framgang.framgangMotFunn();
  $('framgangtekst').textContent = `${antall} / ${mal} mot neste funn`;
  $('framgangfyll').style.width = `${(antall / mal) * 100}%`;

  const streak = framgang.totaler().streak;
  $('streak').textContent = streak >= 2 ? `${streak} på rad` : '';
}

function svar(e) {
  e.preventDefault();
  const felt = $('svar');
  const resultat = sjekkSvar(aktivOppgave, felt.value);
  if (resultat.tomt) return;

  clearTimeout(feilTimer);
  if (resultat.riktig) {
    const utlosteFunn = framgang.registrerRiktig();
    tegnFramgang();
    $('tilbakemelding').textContent = 'Riktig';
    $('tilbakemelding').className = 'tilbakemelding er-riktig';
    feilTimer = setTimeout(() => { $('tilbakemelding').textContent = ''; }, 700);
    if (utlosteFunn) visFunn();
    else nyOppgave();
    return;
  }

  // Feil svar koster ingenting utover streaken (GDD pkt. 17).
  framgang.registrerFeil();
  tegnFramgang();
  $('tilbakemelding').textContent = 'Ikke helt – prøv igjen';
  $('tilbakemelding').className = 'tilbakemelding er-feil';
  felt.select();
  feilTimer = setTimeout(() => { $('tilbakemelding').textContent = ''; }, CONFIG.feilmeldingMs);
}

/* ---------- Steg 4 og 5: funnet ---------- */

function visFunn() {
  const funn = framgang.apneFunn();
  if (!funn) { nyOppgave(); return; }

  const art = finnArt(funn.artId);
  const status = framgang.variantStatus(art);
  const kort = $('funnkort');

  kort.innerHTML = `
    <div class="funn-bilde"></div>
    <p class="funn-variant"></p>
    <h2 class="funn-navn"></h2>
    <p class="funn-vitenskapelig"></p>
    <p class="funn-status"></p>
    <p class="funn-samling"></p>`;

  kort.querySelector('.funn-bilde').innerHTML = illustrasjon(art, funn.variantId);
  kort.querySelector('.funn-bilde').className = `funn-bilde variant--${funn.variantId}`;
  kort.querySelector('.funn-variant').textContent = variantNavn(funn.variantId, art).toUpperCase();
  kort.querySelector('.funn-navn').textContent = art.navn;
  kort.querySelector('.funn-vitenskapelig').textContent = art.vitenskapelig;
  kort.querySelector('.funn-status').textContent = funn.nytt ? 'Nytt funn' : `Duplikat ×${funn.antall}`;
  kort.querySelector('.funn-samling').textContent = `${art.navn} ${status.funnet}/${status.mulige}`;

  $('funnstikk').textContent = 'Funn!';
  const knapp = $('funnlukk');
  knapp.disabled = true;
  visSkjerm('funn');
  setTimeout(() => { knapp.disabled = false; knapp.focus(); }, CONFIG.funn.minVisningMs);
  if (CONFIG.funn.autolukkMs > 0) {
    autolukkTimer = setTimeout(lukkFunn, CONFIG.funn.autolukkMs);
  }
}

function lukkFunn() {
  clearTimeout(autolukkTimer);
  nyOppgave();
  visSkjerm('oppgave');
}

/* ---------- Samlingen ---------- */

/** Den «beste» varianten eleven har av en art — brukes som forsidebilde. */
function visningsvariant(art) {
  const eide = varianterFor(art).filter(v => framgang.harVariant(art.id, v.id));
  if (!eide.length) return null;
  return eide.reduce((sjeldnest, v) => (v.andel < sjeldnest.andel ? v : sjeldnest), eide[0]).id;
}

function tegnSamling() {
  const t = framgang.totaler();
  $('samlingsammendrag').textContent =
    `${t.arterFunnet} av ${t.arterTotalt} arter · ${t.varianterFunnet} av ${t.muligeVarianter} varianter`;

  $('samlingrutenett').replaceChildren(...ARTER.map(art => {
    const status = framgang.variantStatus(art);
    const variantId = visningsvariant(art);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'rute' + (variantId ? '' : ' rute--last');
    if (variantId) b.classList.add(`variant--${variantId}`);
    b.innerHTML = `<span class="rute-bilde"></span><span class="rute-navn"></span><span class="rute-tall"></span>`;
    b.querySelector('.rute-bilde').innerHTML = illustrasjon(art, variantId || 'vanlig', { silhuett: !variantId });
    b.querySelector('.rute-navn').textContent = variantId ? art.navn : '???';
    b.querySelector('.rute-tall').textContent = `${status.funnet}/${status.mulige}`;
    b.addEventListener('click', () => tegnArtsside(art.id));
    return b;
  }));
}

/* ---------- Artssiden ---------- */

function tegnArtsside(artId, valgtVariant = null) {
  const art = finnArt(artId);
  if (!art) return;
  const status = framgang.variantStatus(art);
  const vist = valgtVariant || visningsvariant(art) || 'vanlig';
  const eier = framgang.harVariant(art.id, vist);

  const ut = $('artinnhold');
  ut.innerHTML = `
    <div class="art-bilde variant--${vist}"></div>
    <h2 class="art-navn"></h2>
    <p class="art-vitenskapelig"></p>
    <p class="art-status"></p>
    <ul class="art-fakta"></ul>
    <h3>Varianter</h3>
    <div class="variantrad"></div>`;

  ut.querySelector('.art-bilde').innerHTML = illustrasjon(art, vist, { silhuett: !eier });
  ut.querySelector('.art-navn').textContent = eier ? art.navn : '???';
  ut.querySelector('.art-vitenskapelig').textContent = eier ? art.vitenskapelig : '';
  ut.querySelector('.art-status').textContent = `${status.funnet}/${status.mulige} varianter funnet`;

  ut.querySelector('.art-fakta').replaceChildren(...(eier ? art.fakta : ['Finn arten for å låse opp fakta.']).map(f => {
    const li = document.createElement('li');
    li.textContent = f;
    return li;
  }));

  ut.querySelector('.variantrad').replaceChildren(...varianterFor(art).map(v => {
    const eid = framgang.harVariant(art.id, v.id);
    const post = framgang.samlingFor(art.id)[v.id];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `variantbrikke variant--${v.id}` + (eid ? '' : ' variantbrikke--last')
                + (v.id === vist ? ' er-valgt' : '');
    b.disabled = !eid;
    b.innerHTML = `<span class="variantbrikke-navn"></span><span class="variantbrikke-tall"></span>`;
    b.querySelector('.variantbrikke-navn').textContent = variantNavn(v.id, art);
    b.querySelector('.variantbrikke-tall').textContent = eid ? `×${post.antall}` : '?';
    b.addEventListener('click', () => tegnArtsside(art.id, v.id));
    return b;
  }));

  visSkjerm('art');
}

/* ---------- Statistikk ---------- */

function tegnStatistikk() {
  const t = framgang.totaler();
  const rader = [
    ['Oppgaver løst', t.oppgaverLost],
    ['Svar sendt inn', t.svarSendt],
    ['Feilforsøk', t.feilForsok],
    ['Funn totalt', t.funn],
    ['Arter funnet', `${t.arterFunnet} av ${t.arterTotalt}`],
    ['Varianter funnet', `${t.varianterFunnet} av ${t.muligeVarianter}`],
    ['Lengste rekke riktige', t.besteStreak]
  ];
  const liste = $('statistikkliste');
  liste.replaceChildren();
  for (const [navn, verdi] of rader) {
    const dt = document.createElement('dt');
    dt.textContent = navn;
    const dd = document.createElement('dd');
    dd.textContent = String(verdi);
    liste.append(dt, dd);
  }
}

/* ---------- Oppstart ---------- */

$('merke').textContent = CONFIG.tittel;
$('tittel').textContent = CONFIG.tittel;
$('ingress').textContent = CONFIG.undertittel;
document.title = CONFIG.tittel;

$('start').addEventListener('click', startTrening);
$('svarform').addEventListener('submit', svar);
$('avslutt').addEventListener('click', () => { aktivOppgave = null; visSkjerm('velg'); });
$('funnlukk').addEventListener('click', lukkFunn);
$('arttilbake').addEventListener('click', () => { tegnSamling(); visSkjerm('samling'); });

$('nullstill').addEventListener('click', () => {
  if (!confirm('Dette sletter hele samlingen og all statistikk i denne nettleseren. Er du sikker?')) return;
  framgang.nullstill();
  aktivOppgave = null;
  tegnValg();
  tegnStatistikk();
  visSkjerm('velg');
});

document.querySelectorAll('.fane').forEach(f => {
  f.addEventListener('click', () => {
    const fane = f.dataset.fane;
    if (fane === 'spill') { visSkjerm(aktivOppgave ? 'oppgave' : 'velg'); if (aktivOppgave) $('svar').focus(); }
    else if (fane === 'samling') { tegnSamling(); visSkjerm('samling'); }
    else { tegnStatistikk(); visSkjerm('statistikk'); }
  });
});

tegnValg();
visSkjerm('velg');
