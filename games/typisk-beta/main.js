/* ══════════════════════════════════════════════════════════════════
   main.js — kontrolleren. Binder spilltilstand til brett og paneler.
   ══════════════════════════════════════════════════════════════════ */

import { mean, median, modes, fmtNum, parseNum, sortNum } from './stats.js';
import { CHAPTERS } from './content.js';
import { Board, brettTekst } from './board.js';
import { maskot, stjerne, heltebilde } from './art.js';
import {
  nyTilstand, nesteOppgave, svar as leverSvar, girOpp, tidUte, ferdig, avslutt,
  hentArkiv, nullstillArkiv, laasteKapitler, dagligTattIDag, delingstekst, MERKER
} from './game.js';
import {
  $, e, meld, visSkjerm, tegnSak, tegnPanel, tegnFasit, tegnHud, tegnSlutt,
  merkValg, stjernerad
} from './ui.js';

const REDUSERT = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let brett = null;
let t = null;
let sortert = false, visSum = false;
let gjettVerdi = null, gjettCb = null;
let timer = null;

/* ══════════════════════════════════════════════════════════════════
   BRETTET — hvilken visning passer til hvilket verb
   ══════════════════════════════════════════════════════════════════ */
function harType(d) { return Array.isArray(d) && modes(d).length > 0; }

function tegnBrett(fase) {
  const o = t.oppgave;
  if (!o) return;
  const enhet = o.ctx?.unit || '';
  /* Byggeoppgaver har ikke noe datasett før eleven lager ett. */
  const alle = { mean: true, median: true, mode: harType(o.data) };

  switch (o.verb) {
    case 'compute':
      brett.tegn({ data: o.data, enhet, vis: fase === 'fasit' ? alle : {}, modus: 'linje' });
      break;
    case 'predict':
      brett.tegn({
        data: o.data, enhet, modus: 'linje',
        vis: fase === 'fasit' ? { [o.maal]: true } : {}
      });
      if (Number.isFinite(gjettVerdi)) brett.tegnGjett(gjettVerdi, 'ditt gjett');
      break;
    case 'shock':
      /* Aksen får IKKE strekke seg ut til den nye verdien før den er
         avslørt — da ville brettet røpe svaret. */
      brett.tegn({ data: o.data, enhet, modus: 'vekt', dreiepunkt: mean(o.data) });
      break;
    case 'sabotor':
      brett.tegn({
        data: o.data, enhet, modus: 'vekt', dreiepunkt: o.terskel,
        ekstraDomene: [o.terskel, o.grense]
      });
      break;
    case 'bygg':
      brett.tegn({ data: [], enhet: '', vis: {}, modus: 'linje', ekstraDomene: [o.grense.min, o.grense.max] });
      break;
    default:
      brett.tegn({ data: o.data, enhet, vis: alle, modus: 'linje' });
  }
  $('brettTekst').textContent = o.verb === 'bygg' ? '' : brettTekst(o.data, enhet);
}

/* ── Vektstangen som velter når det nye tallet kommer ───────────── */
function animerSjokk() {
  const o = t.oppgave;
  const enhet = o.ctx.unit || '';
  /* Fra nå av ER datasettet det utvidede — tallrad, sum og sortering
     skal vise det samme som brettet. */
  o.data = o.etter;
  tegnSakRamme();
  brett.tegn({ data: o.etter, enhet, modus: 'vekt', dreiepunkt: mean(o.data), animer: true });
  $('brettTekst').textContent = brettTekst(o.etter, enhet);
  if (REDUSERT) {
    brett.tegn({ data: o.etter, enhet, modus: 'vekt', dreiepunkt: mean(o.etter) });
    return;
  }
  setTimeout(() => {
    brett.tegn({ data: o.etter, enhet, modus: 'vekt', dreiepunkt: mean(o.etter), vis: { median: true } });
  }, 1500);
}

/* ══════════════════════════════════════════════════════════════════
   API-ET PANELENE SNAKKER GJENNOM
   ══════════════════════════════════════════════════════════════════ */
const api = {
  lever(verdi) {
    if (!t || t.låst) return;
    const r = leverSvar(t, verdi);
    behandleSvar(r, verdi);
  },
  giOpp() {
    if (!t || t.låst) return;
    const r = girOpp(t);
    behandleSvar(r, null);
  },
  gjett: () => gjettVerdi,
  aktiverGjett(cb) {
    gjettCb = cb;
    settOppGjetting();
  },
  /* Levende forhåndsvisning mens eleven skriver — brettet svarer med
     én gang, uten at noe må «sjekkes». */
  forhandsvis(verdi) {
    const o = t.oppgave;
    if (o.verb === 'bygg') {
      const tall = verdi.map(parseNum).filter(Number.isFinite);
      if (tall.length >= 2) {
        /* Skalér til tallene eleven faktisk har skrevet. Tvinger vi
           hele 0–40-aksen, klumper prikkene seg i venstre hjørne. */
        brett.tegn({
          data: tall, enhet: '', modus: 'linje',
          vis: { mean: true, median: true, mode: harType(tall) }
        });
        $('brettTekst').textContent = brettTekst(tall, '');
      }
      oppdaterKrav(tall);
    } else if (o.verb === 'sabotor') {
      const x = parseNum(verdi);
      const d = Number.isFinite(x) && x >= 0 ? [...o.data, x] : o.data;
      brett.tegn({ data: d, enhet: o.ctx.unit || '', modus: 'vekt', dreiepunkt: o.terskel, ekstraDomene: [o.terskel, o.grense], animer: d.length > o.data.length });
    }
  }
};

/* Kravlista i byggeoppgaven hakes av live. */
function oppdaterKrav(tall) {
  const o = t.oppgave;
  if (o.verb !== 'bygg' || tall.length !== o.n) return;
  document.querySelectorAll('.kravpunkt').forEach(li => {
    const k = o.krav[+li.dataset.i];
    let ok = false;
    if (k.type === 'mean') ok = Math.abs(mean(tall) - k.verdi) < 0.051;
    else if (k.type === 'median') ok = Math.abs(median(tall) - k.verdi) < 0.051;
    else if (k.type === 'mode') { const m = modes(tall); ok = m.length === 1 && m[0] === k.verdi; }
    else if (k.type === 'medianIkke') ok = Math.abs(median(tall) - k.verdi) >= 0.051;
    else if (k.type === 'ingenLik') ok = !tall.some(v => v === k.verdi);
    li.classList.toggle('oppfylt', ok);
    li.querySelector('.kravmerke').textContent = ok ? '✓' : '○';
  });
}

/* ══════════════════════════════════════════════════════════════════
   ETTER ET SVAR
   ══════════════════════════════════════════════════════════════════ */
function behandleSvar(r, verdi) {
  const o = t.oppgave;
  stoppTimer();

  if (o.verb === 'compute' && r.status) {
    o.maal.forEach(k => {
      const kort = $('regnekort-' + k);
      if (!kort) return;
      kort.classList.toggle('rett', !!r.status[k]);
      kort.classList.toggle('galt', !r.status[k]);
      kort.querySelector('.regnestatus').textContent = r.status[k] ? '✓' : '✗';
    });
  }

  if (t.låst) {
    const boks = $('panel').querySelector('.valgliste');
    if (boks) merkValg(boks, o.fasit ?? [], verdi);
    if (o.verb === 'bygg' && r.kravStatus) {
      document.querySelectorAll('.kravpunkt').forEach((li, i) => {
        li.classList.toggle('oppfylt', !!r.kravStatus[i]);
        li.querySelector('.kravmerke').textContent = r.kravStatus[i] ? '✓' : '✗';
      });
    }
    if (o.verb === 'overskrifter') {
      document.querySelectorAll('.paastandskort').forEach(k => {
        k.querySelectorAll('.domknapp').forEach(b => { b.disabled = true; });
      });
    }
    document.querySelectorAll('#panel input, #panel .knapp-primar').forEach(n => { n.disabled = true; });

    if (o.verb === 'shock') animerSjokk();
    else if (o.verb === 'sabotor' && r.nyData) {
      brett.tegn({ data: r.nyData, enhet: o.ctx.unit || '', modus: 'vekt', dreiepunkt: o.terskel, ekstraDomene: [o.terskel, o.grense], animer: true });
      $('brettTekst').textContent = brettTekst(r.nyData, o.ctx.unit || '');
    }
    else tegnBrett('fasit');

    $('nesteknapp').hidden = false;
    $('nesteknapp').textContent = sisteOppgave() ? 'Se resultatet' : 'Neste';
    setTimeout(() => $('nesteknapp').focus(), 120);
  }

  tegnFasit($('fasit'), o, r);
  tegnHud(t);
  meld(r.tilbakemelding || '');
}

function sisteOppgave() {
  if (t.modus === 'arkade') return t.liv <= 0;
  return t.runde + 1 >= t.antall;
}

/* ══════════════════════════════════════════════════════════════════
   GJETTEMARKØREN
   ══════════════════════════════════════════════════════════════════ */
function settOppGjetting() {
  const [lo, hi] = brett.domene;
  const steg = Math.max((hi - lo) / 200, (t.oppgave.ctx.step || 1) / 4);
  const glider = $('glider');
  glider.hidden = false;
  glider.min = lo; glider.max = hi; glider.step = steg;
  glider.value = (lo + hi) / 2;
  glider.setAttribute('aria-label', 'Gjett hvor sentralmålet lander');

  const sett = v => {
    gjettVerdi = v;
    brett.tegnGjett(v, 'ditt gjett');
    glider.value = v;
    gjettCb?.(v);
  };
  sett((lo + hi) / 2);

  glider.oninput = () => sett(parseFloat(glider.value));

  const flytt = ev => {
    if (t.låst) return;
    const x = ev.touches ? ev.touches[0].clientX : ev.clientX;
    sett(brett.verdiFraKlientX(x));
  };
  const vert = $('brett');
  vert.onpointerdown = ev => { if (t.låst) return; vert.setPointerCapture(ev.pointerId); flytt(ev); };
  vert.onpointermove = ev => { if (ev.buttons) flytt(ev); };
}

function ryddGjetting() {
  gjettVerdi = null; gjettCb = null;
  const glider = $('glider');
  glider.hidden = true; glider.oninput = null;
  const vert = $('brett');
  vert.onpointerdown = null; vert.onpointermove = null;
}

/* ══════════════════════════════════════════════════════════════════
   TIMEREN (arkade)
   ══════════════════════════════════════════════════════════════════ */
function startTimer() {
  stoppTimer();
  if (t.modus !== 'arkade') return;
  const total = t.tid;
  let igjen = total;
  $('tidsfyll').style.transition = 'none';
  $('tidsfyll').style.width = '100%';
  timer = setInterval(() => {
    igjen -= 0.1;
    const andel = Math.max(0, igjen / total);
    $('tidsfyll').style.transition = 'width .1s linear';
    $('tidsfyll').style.width = (andel * 100) + '%';
    $('tidsfyll').classList.toggle('knapp-tid', andel < 0.25);
    if (igjen <= 0) {
      stoppTimer();
      behandleSvar(tidUte(t), null);
    }
  }, 100);
}
function stoppTimer() { if (timer) { clearInterval(timer); timer = null; } }

/* ══════════════════════════════════════════════════════════════════
   RUNDEFLYT
   ══════════════════════════════════════════════════════════════════ */
function visOppgave() {
  ryddGjetting();
  sortert = false; visSum = false;
  const o = nesteOppgave(t);
  if (!o) { visSlutt(); return; }

  $('fasit').hidden = true;
  $('nesteknapp').hidden = true;

  tegnHud(t);
  tegnSakRamme();
  tegnBrett('oppgave');
  tegnPanel($('panel'), o, api);
  meld(`Oppgave ${t.runde + 1}. ${o.ctx ? o.ctx.intro(o.data.length) : o.ledetekst}`);
  startTimer();
}

function tegnSakRamme() {
  const o = t.oppgave;
  const vert = $('sak');
  if (!o.ctx) { vert.hidden = true; return; }
  vert.hidden = false;
  tegnSak(vert, o, {
    sortert, visSum,
    onSorter: () => { sortert = !sortert; tegnSakRamme(); },
    onSum: () => { visSum = !visSum; tegnSakRamme(); }
  });
}

function neste() {
  t.runde++;
  if (ferdig(t)) visSlutt();
  else visOppgave();
}

function visSlutt() {
  stoppTimer();
  const arkiv = avslutt(t);
  tegnSlutt(t, arkiv);
  $('btnDel').hidden = t.modus !== 'daglig';
  $('btnDel').textContent = 'Del resultatet';
  $('btnNeste-kapittel').hidden = t.modus !== 'kampanje' || (t.kapittelIdx ?? 0) + 1 >= CHAPTERS.length;
  /* Dagens sak er én gang per dag — «spill igjen» hører ikke hjemme der. */
  $('btnIgjen').hidden = t.modus === 'daglig';
  visSkjerm('skjerm-slutt');
  meld('Runden er ferdig. ' + t.poeng + ' poeng.');
}

/* ══════════════════════════════════════════════════════════════════
   START- OG KAPITTELSKJERM
   ══════════════════════════════════════════════════════════════════ */
function tegnStart() {
  const arkiv = hentArkiv();
  $('helt').innerHTML = heltebilde();
  $('maskotrad').innerHTML = ['mean', 'median', 'mode'].map(k => `
    <figure class="maskotkort maskotkort-${k}">
      ${maskot(k, 'rolig')}
      <figcaption>${k === 'mean' ? 'Gjennomsnittet<span>balanserer alle tallene</span>'
        : k === 'median' ? 'Medianen<span>står alltid midt i rekka</span>'
        : 'Typetallet<span>den høyeste stabelen</span>'}</figcaption>
    </figure>`).join('');

  const totStjerner = CHAPTERS.reduce((s, k) => s + (arkiv.stjerner[k.id] || 0), 0);
  $('startstatus').textContent = totStjerner
    ? `${totStjerner} av ${CHAPTERS.length * 3} stjerner · ${arkiv.merker.length} merker`
    : 'Ingen framgang lagret ennå.';

  const dag = dagligTattIDag(arkiv);
  $('dagligTittel').textContent = dag ? 'Dagens sak ✓' : 'Dagens sak';
  $('dagligUnder').textContent = dag
    ? `Løst i dag med ${dag.poeng} poeng. Spill igjen for å øve.`
    : 'Fem oppgaver, lik for alle i dag.';

  const mr = $('startmerker');
  mr.replaceChildren();
  MERKER.forEach(m => {
    const s = e('span', 'merke' + (arkiv.merker.includes(m.id) ? ' merke-tatt' : ''));
    s.textContent = m.emoji;
    s.title = `${m.navn} — ${m.krav}`;
    s.setAttribute('aria-label', `${m.navn}: ${m.krav}. ${arkiv.merker.includes(m.id) ? 'Oppnådd' : 'Ikke oppnådd'}`);
    mr.append(s);
  });
}

function tegnKapitler() {
  const arkiv = hentArkiv();
  const låst = laasteKapitler(arkiv);
  const vert = $('kapittelliste');
  vert.replaceChildren();
  CHAPTERS.forEach((k, i) => {
    const kort = e('button', 'kapittelkort' + (låst[i] ? ' laast' : ''));
    kort.disabled = låst[i];
    const hode = e('div', 'kapittelhode');
    hode.append(e('span', 'kapittelemoji', k.emoji));
    const tekst = e('div', 'kapitteltekst');
    tekst.append(e('strong', null, `${k.id}. ${k.tittel}`));
    tekst.append(e('span', null, låst[i] ? 'Låses opp av kapittelet før' : k.ingress));
    hode.append(tekst);
    kort.append(hode);
    kort.append(stjernerad(arkiv.stjerner[k.id] || 0));
    kort.addEventListener('click', () => startKampanje(i));
    vert.append(kort);
  });
}

/* ══════════════════════════════════════════════════════════════════
   OPPSTART
   ══════════════════════════════════════════════════════════════════ */
function startKampanje(idx) { t = nyTilstand('kampanje', { kapittel: idx }); startRunde(); }
function startArkade() { t = nyTilstand('arkade'); startRunde(); }
function startDaglig() { t = nyTilstand('daglig'); startRunde(); }

function startRunde() {
  visSkjerm('skjerm-spill');
  if (!brett) brett = new Board($('brett'));
  t.runde = 0;
  visOppgave();
}

function init() {
  brett = new Board($('brett'));
  tegnStart();

  $('btnKampanje').addEventListener('click', () => { tegnKapitler(); visSkjerm('skjerm-kapitler'); });
  $('btnArkade').addEventListener('click', startArkade);
  $('btnDaglig').addEventListener('click', startDaglig);
  $('btnTilbakeStart').addEventListener('click', () => { tegnStart(); visSkjerm('skjerm-start'); });
  $('nesteknapp').addEventListener('click', neste);

  $('btnAvbryt').addEventListener('click', () => {
    stoppTimer();
    tegnStart(); visSkjerm('skjerm-start');
  });

  $('btnIgjen').addEventListener('click', () => {
    if (t.modus === 'kampanje') startKampanje(t.kapittelIdx);
    else if (t.modus === 'arkade') startArkade();
    else { tegnStart(); visSkjerm('skjerm-start'); }
  });
  $('btnMeny').addEventListener('click', () => { tegnStart(); visSkjerm('skjerm-start'); });

  $('btnNeste-kapittel').addEventListener('click', () => {
    const neste = (t.kapittelIdx ?? 0) + 1;
    if (neste < CHAPTERS.length) startKampanje(neste);
    else { tegnKapitler(); visSkjerm('skjerm-kapitler'); }
  });

  $('btnDel').addEventListener('click', async () => {
    const tekst = delingstekst(t);
    try {
      if (navigator.share) await navigator.share({ text: tekst });
      else { await navigator.clipboard.writeText(tekst); $('btnDel').textContent = 'Kopiert!'; }
    } catch { /* brukeren avbrøt */ }
  });

  $('btnNullstill').addEventListener('click', () => {
    if (confirm('Slette all lagret framgang på denne enheten?')) { nullstillArkiv(); tegnStart(); }
  });
}

document.addEventListener('DOMContentLoaded', init);
