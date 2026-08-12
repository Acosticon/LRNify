// main.js – Kontrolleren. Binder tilstand til skjerm.

import {
  nyTilstand, velgTrekk, bekreftEkko, svarMotgift, nesteRunde,
  svarSlutt, sluttFerdig,
  lagre, hentLagret, slettLagret, karakter, MAKS_POENG, ANTALL_RUNDER
} from './game.js';

import {
  tegnMalere, tegnTrekk, tegnEkko, tegnMotgift, tegnLaering,
  tegnSamling, tegnSluttutfordring, tegnOppgjor
} from './ui.js';

let t = nyTilstand();

/* ─── Skjermbytte ────────────────────────────────────── */

function visSkjerm(id) {
  document.querySelectorAll('.skjerm').forEach(s => s.classList.remove('aktiv'));
  document.getElementById(`skjerm-${id}`)?.classList.add('aktiv');
}

/* ─── Tegn etter tilstand ────────────────────────────── */

function tegn(deltaer = null) {
  tegnMalere(t, deltaer);
  tegnSamling(t);

  switch (t.slag) {
    case 'trekk':   tegnTrekk(t, paTrekk); break;
    case 'ekko':    tegnEkko(t, paEkko); break;
    case 'motgift': tegnMotgift(t, paMotgift); break;
    case 'laering': tegnLaering(t, paNeste); break;
    case 'sluttutfordring':
      tegnSluttutfordring(t, paSluttSvar);
      // Knappen tegnes på nytt hver gang, så lytteren må settes her.
      if (sluttFerdig(t)) {
        const btn = document.getElementById('btn-oppgjor');
        if (btn) { btn.disabled = false; btn.addEventListener('click', visOppgjor); }
      }
      break;
  }
  document.getElementById('handling')?.scrollIntoView({ block: 'nearest' });
}

/* ─── Handlinger ─────────────────────────────────────── */

function paTrekk(i) {
  const for_ = { ...t.malere };
  t = velgTrekk(t, i);
  lagre(t);
  tegn({
    spredning:    t.malere.spredning    - for_.spredning,
    troverdighet: t.malere.troverdighet - for_.troverdighet,
    skade:        t.malere.skade        - for_.skade
  });
}

function paEkko() {
  const for_ = { ...t.malere };
  t = bekreftEkko(t);
  lagre(t);
  tegn({
    spredning:    t.malere.spredning    - for_.spredning,
    troverdighet: t.malere.troverdighet - for_.troverdighet,
    skade:        t.malere.skade        - for_.skade
  });
}

function paMotgift(i) {
  const res = svarMotgift(t, i);
  t = res.tilstand;
  lagre(t);
  tegn();
}

function paNeste() {
  t = nesteRunde(t);
  lagre(t);
  tegn();
}

function paSluttSvar(oppgave, teknikk) {
  t = svarSlutt(t, oppgave, teknikk);
  lagre(t);
  tegn();
}

/* ─── Oppgjøret ──────────────────────────────────────── */

function visOppgjor() {
  slettLagret();
  const skjerm = document.getElementById('skjerm-oppgjor');
  skjerm.innerHTML = tegnOppgjor(t);
  visSkjerm('oppgjor');
  window.scrollTo({ top: 0 });

  document.getElementById('btn-omigjen')?.addEventListener('click', () => {
    t = nyTilstand(t.navn);
    visSkjerm('start');
    window.scrollTo({ top: 0 });
  });

  document.getElementById('btn-del')?.addEventListener('click', () => {
    const kar = karakter(t);
    const tekst = `Løpeilden: ${t.innsikt} av ${MAKS_POENG} innsiktspoeng – «${kar.tittel}».\n`
      + `Skade jeg etterlot: ${t.malere.skade}.\n\n`
      + 'Et spill om hvordan løgn sprer seg, og hvordan man stopper den.';
    if (navigator.share) navigator.share({ text: tekst }).catch(() => {});
    else navigator.clipboard?.writeText(tekst).then(() => varsle('Kopiert!'));
  });
}

function varsle(tekst) {
  const boks = document.createElement('div');
  boks.className = 'varsel';
  boks.textContent = tekst;
  document.body.appendChild(boks);
  setTimeout(() => boks.remove(), 2200);
}

/* ─── Oppstart ───────────────────────────────────────── */

function start(navn) {
  t = nyTilstand(navn || 'Deg');
  slettLagret();
  visSkjerm('spill');
  tegn();
  window.scrollTo({ top: 0 });
}

function fortsett(lagret) {
  t = lagret;
  visSkjerm('spill');
  // En avsluttet motgift skal ikke kunne besvares på nytt etter innlasting.
  if (t.slag === 'motgift' && t.motgiftLost) t.slag = 'laering';
  tegn();
}

function init() {
  const navnefelt = document.getElementById('navn-felt');

  document.getElementById('btn-start')?.addEventListener('click',
    () => start(navnefelt?.value.trim()));

  navnefelt?.addEventListener('keydown', e => {
    if (e.key === 'Enter') start(navnefelt.value.trim());
  });

  const lagret = hentLagret();
  if (lagret) {
    const banner = document.getElementById('fortsett-banner');
    if (banner) {
      banner.hidden = false;
      banner.querySelector('.fortsett-tekst').textContent =
        `Du står midt i runde ${lagret.rundeNr} av ${ANTALL_RUNDER}.`;
      banner.querySelector('#btn-fortsett')?.addEventListener('click', () => fortsett(lagret));
      banner.querySelector('#btn-forkast')?.addEventListener('click', () => {
        slettLagret();
        banner.hidden = true;
      });
    }
  }

  visSkjerm('start');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
