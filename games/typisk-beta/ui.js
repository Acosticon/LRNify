/* ══════════════════════════════════════════════════════════════════
   ui.js — tegner oppgavene.

   Hvert verb har sin egen panelfunksjon, men de deler saksrammen:
   klient, situasjonstekst, tallrad og brett. Panelene melder tilbake
   gjennom callbackene de får inn — de kjenner ikke spilltilstanden.
   ══════════════════════════════════════════════════════════════════ */

import {
  mean, median, modes, sum, sortNum, fmtNum, fmtModes, measureText, parseNum
} from './stats.js';
import { MEASURE } from './content.js';
import { maskot, maleIkon, stjerne, klientMedaljong, FARGE } from './art.js';
import { brettTekst } from './board.js';
import { DOMMER } from './tasks.js';
import { SHAPES } from './generator.js';
import { stjernerFor } from './game.js';

export const $ = id => document.getElementById(id);

export function e(tag, kl, tekst) {
  const n = document.createElement(tag);
  if (kl) n.className = kl;
  if (tekst != null) n.textContent = tekst;
  return n;
}

export function meld(tekst) {
  const el = $('srMelding');
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => { el.textContent = tekst; });
}

export function visSkjerm(id) {
  document.querySelectorAll('.skjerm').forEach(s => s.classList.remove('aktiv'));
  $(id)?.classList.add('aktiv');
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

/* ══════════════════════════════════════════════════════════════════
   SAKSRAMMEN — klient, tekst, tallrad
   ══════════════════════════════════════════════════════════════════ */
const BEHOV_AV_VERB = o =>
  o.verb === 'choose' ? (o.fasit?.[0] === 'ingen' ? 'median' : o.fasit?.[0]) : 'median';

export function tegnSak(vert, o, { sortert, visSum, onSorter, onSum }) {
  vert.replaceChildren();
  if (!o.ctx) return;

  const topp = e('div', 'sak-topp');
  topp.innerHTML = klientMedaljong(o.klient?.emoji || o.ctx.emoji, BEHOV_AV_VERB(o));
  const navn = e('div', 'sak-navn');
  navn.append(e('strong', null, o.klient?.navn || o.ctx.tittel));
  navn.append(e('span', null, o.klient?.rolle || ''));
  topp.append(navn);
  vert.append(topp);

  vert.append(e('p', 'sak-tekst', o.ctx.intro(o.data.length)));

  const rad = e('div', 'tallrad');
  const verdier = sortert ? sortNum(o.data) : o.data;
  verdier.forEach(v => {
    const chip = e('span', 'tallchip', fmtNum(v));
    if (sortert && o.verb !== 'compute') {
      const m = median(o.data);
      if (v === m) chip.classList.add('tallchip-median');
    }
    rad.append(chip);
  });
  rad.setAttribute('aria-hidden', 'true');
  vert.append(rad);
  if (o.ctx.unit) vert.append(e('p', 'enhetsnote', `Verdiene er i ${o.ctx.unit}.`));

  const verktoy = e('div', 'verktoyrad');
  const bSort = e('button', 'knapp-liten', sortert ? '🔀 Fjern sortering' : '🔀 Sorter tall');
  bSort.setAttribute('aria-pressed', String(!!sortert));
  bSort.addEventListener('click', onSorter);
  const bSum = e('button', 'knapp-liten', visSum ? 'Σ Skjul sum' : 'Σ Vis sum');
  bSum.addEventListener('click', onSum);
  verktoy.append(bSort, bSum);
  vert.append(verktoy);
  vert.append(e('p', 'gratisnote', 'Sortering og sum koster aldri poeng.'));

  if (visSum) {
    vert.append(e('p', 'sumlinje', `${verdier.map(fmtNum).join(' + ')} = ${fmtNum(sum(o.data))}`));
  }
}

/* Verdikort for de tre sentralmålene — brukes der oppgaven handler om
   å velge, ikke om å regne. */
export function verdikort(data, hvilke = ['mean', 'median', 'mode']) {
  const rad = e('div', 'verdirad');
  hvilke.forEach(k => {
    const kort = e('div', `verdikort verdikort-${k}`);
    const hode = e('div', 'verdikort-hode');
    hode.innerHTML = maleIkon(k);
    hode.append(e('span', null, MEASURE[k].navn));
    kort.append(hode);
    kort.append(e('strong', null, measureText(k, data)));
    rad.append(kort);
  });
  return rad;
}

/* ══════════════════════════════════════════════════════════════════
   VALGKNAPPER
   ══════════════════════════════════════════════════════════════════ */
function valgliste(valg, onVelg) {
  const boks = e('div', 'valgliste');
  valg.forEach(v => {
    const b = e('button', 'valgknapp');
    b.dataset.key = v.key;
    b.append(e('span', 'valgmerke'));
    b.append(e('span', 'valgtekst', v.label));
    b.addEventListener('click', () => onVelg(v.key, boks));
    boks.append(b);
  });
  return boks;
}

export function merkValg(boks, fasit, valgt) {
  const f = Array.isArray(fasit) ? fasit : [fasit];
  [...boks.children].forEach(b => {
    b.disabled = true;
    const k = b.dataset.key;
    if (k === valgt) b.classList.add(f.includes(k) ? 'rett' : 'galt');
    else if (f.includes(k)) b.classList.add('rett-uvalgt');
  });
}

/* ══════════════════════════════════════════════════════════════════
   PANELENE — ett per verb
   ══════════════════════════════════════════════════════════════════ */
export function tegnPanel(vert, o, api) {
  vert.replaceChildren();
  vert.dataset.verb = o.verb;
  const tegner = PANEL[o.verb];
  if (tegner) tegner(vert, o, api);
}

const PANEL = {};

/* ── compute ───────────────────────────────────────────────────── */
PANEL.compute = (vert, o, api) => {
  vert.append(e('h2', null, 'Regn ut'));
  vert.append(e('p', 'panel-ledetekst', o.ledetekst));
  const rad = e('div', 'regnerad');
  const felt = {};
  o.maal.forEach(k => {
    const kort = e('div', `regnekort regnekort-${k}`);
    kort.id = 'regnekort-' + k;
    const hode = e('div', 'verdikort-hode');
    hode.innerHTML = maleIkon(k);
    hode.append(e('span', null, MEASURE[k].navn));
    kort.append(hode);
    const inp = e('input');
    inp.type = 'text'; inp.inputMode = 'decimal'; inp.autocomplete = 'off';
    inp.setAttribute('aria-label', MEASURE[k].navn + ', skriv inn svaret ditt');
    inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') api.lever(hentSvar()); });
    felt[k] = inp;
    kort.append(inp);
    kort.append(e('div', 'regnestatus'));
    rad.append(kort);
  });
  vert.append(rad);
  const hentSvar = () => Object.fromEntries(o.maal.map(k => [k, felt[k].value]));
  vert.append(handlingsrad(api, () => hentSvar()));
  setTimeout(() => felt[o.maal[0]]?.focus(), 60);
};

/* ── choose ────────────────────────────────────────────────────── */
PANEL.choose = (vert, o, api) => {
  vert.append(e('h2', null, 'Hvilket sentralmål svarer på dette?'));
  vert.append(e('p', 'panel-sporsmal', '«' + o.sporsmal + '»'));
  vert.append(verdikort(o.data));
  vert.append(valgliste(o.valg, k => api.lever(k)));
};

/* ── interpret ─────────────────────────────────────────────────── */
PANEL.interpret = (vert, o, api) => {
  vert.append(e('h2', null, 'Vurder påstanden'));
  vert.append(e('p', 'panel-paastand', o.påstand));
  vert.append(verdikort(o.data, ['mean', 'median']));
  vert.append(valgliste(o.valg, k => api.lever(k)));
};

/* ── finnfeil ──────────────────────────────────────────────────── */
PANEL.finnfeil = (vert, o, api) => {
  vert.append(e('h2', null, o.tittel));
  vert.append(e('p', 'panel-paastand', o.påstand));
  vert.append(e('p', 'panel-ledetekst', o.ledetekst));
  vert.append(valgliste(o.valg, k => api.lever(k)));
};

/* ── predict ───────────────────────────────────────────────────── */
PANEL.predict = (vert, o, api) => {
  vert.append(e('h2', null, 'Gjett først'));
  vert.append(e('p', 'panel-ledetekst', o.ledetekst));
  const visning = e('p', 'gjett-visning', '—');
  vert.append(visning);
  const knapp = e('button', 'knapp-primar', 'Lås gjettet');
  knapp.disabled = true;
  knapp.addEventListener('click', () => api.lever(api.gjett()));
  vert.append(knapp);
  api.aktiverGjett(v => {
    visning.textContent = fmtNum(v) + (o.ctx.unit ? ' ' + o.ctx.unit : '');
    knapp.disabled = false;
  });
  vert.append(e('p', 'gratisnote', 'Dra markøren på tallinja, eller bruk piltastene når den er valgt.'));
};

/* ── shock ─────────────────────────────────────────────────────── */
PANEL.shock = (vert, o, api) => {
  vert.append(e('h2', null, '😲 Én til kommer inn'));
  vert.append(e('p', 'panel-ledetekst',
    `En verdi til meldes inn: ${fmtNum(o.nyVerdi)}${o.ctx.unit ? ' ' + o.ctx.unit : ''}. Hva tror du skjer?`));
  vert.append(verdikort(o.data, ['mean', 'median']));
  vert.append(valgliste(o.valg, k => api.lever(k)));
};

/* ── bygg ──────────────────────────────────────────────────────── */
PANEL.bygg = (vert, o, api) => {
  vert.append(e('h2', null, o.tittel));
  vert.append(e('p', 'panel-ledetekst', o.ledetekst));

  const krav = e('ul', 'kravliste');
  o.krav.forEach((k, i) => {
    const li = e('li', 'kravpunkt');
    li.dataset.i = i;
    li.append(e('span', 'kravmerke', '○'));
    li.append(e('span', null, k.tekst));
    krav.append(li);
  });
  vert.append(krav);

  const rad = e('div', 'byggrad');
  const felt = [];
  for (let i = 0; i < o.n; i++) {
    const inp = e('input');
    inp.type = 'text'; inp.inputMode = 'numeric'; inp.autocomplete = 'off';
    inp.setAttribute('aria-label', `Tall ${i + 1} av ${o.n}`);
    inp.addEventListener('input', () => api.forhandsvis(felt.map(f => f.value)));
    inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') api.lever(felt.map(f => f.value)); });
    felt.push(inp);
    rad.append(inp);
  }
  vert.append(rad);
  vert.append(e('p', 'gratisnote', 'Det finnes mange riktige svar. Brettet over oppdaterer seg mens du skriver.'));
  vert.append(handlingsrad(api, () => felt.map(f => f.value)));
  setTimeout(() => felt[0]?.focus(), 60);
};

/* ── sabotor ───────────────────────────────────────────────────── */
PANEL.sabotor = (vert, o, api) => {
  vert.append(e('h2', null, o.tittel));
  vert.append(e('p', 'panel-ledetekst', o.ledetekst));
  vert.append(verdikort(o.data, ['mean', 'median']));
  const rad = e('div', 'sabotorrad');
  const inp = e('input');
  inp.type = 'text'; inp.inputMode = 'decimal'; inp.autocomplete = 'off';
  inp.setAttribute('aria-label', 'Den nye verdien');
  inp.addEventListener('input', () => api.forhandsvis(inp.value));
  inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') api.lever(inp.value); });
  rad.append(inp);
  if (o.ctx.unit) rad.append(e('span', 'sabotorenhet', o.ctx.unit));
  vert.append(rad);
  vert.append(handlingsrad(api, () => inp.value));
  setTimeout(() => inp.focus(), 60);
};

/* ── overskrifter ──────────────────────────────────────────────── */
PANEL.overskrifter = (vert, o, api) => {
  vert.append(e('h2', null, o.tittel));
  vert.append(e('p', 'panel-ledetekst', o.ledetekst));
  vert.append(verdikort(o.data, ['mean', 'median']));

  const forklaring = e('div', 'domforklaring');
  DOMMER.forEach(d => {
    const k = e('div', 'domforklaring-punkt');
    k.append(e('strong', null, d.label));
    k.append(e('span', null, d.beskr));
    forklaring.append(k);
  });
  vert.append(forklaring);

  const svar = new Array(o.påstander.length).fill(null);
  const liste = e('div', 'paastandsliste');
  o.påstander.forEach((p, i) => {
    const kort = e('div', 'paastandskort');
    kort.dataset.i = i;
    kort.append(e('p', 'paastandstekst', p.tekst));
    const knapper = e('div', 'domrad');
    DOMMER.forEach(d => {
      const b = e('button', 'domknapp', d.label);
      b.dataset.dom = d.key;
      b.addEventListener('click', () => {
        svar[i] = d.key;
        [...knapper.children].forEach(x => x.classList.toggle('valgt', x === b));
        lever.disabled = svar.some(s => s === null);
      });
      knapper.append(b);
    });
    kort.append(knapper);
    liste.append(kort);
  });
  vert.append(liste);

  const lever = e('button', 'knapp-primar', 'Lever dommen');
  lever.disabled = true;
  lever.addEventListener('click', () => api.lever(svar));
  vert.append(lever);
};

/* ── Felles handlingsrad: sjekk + gi opp ───────────────────────── */
function handlingsrad(api, hentSvar) {
  const rad = e('div', 'handlingsrad');
  const sjekk = e('button', 'knapp-primar', 'Sjekk svar');
  sjekk.addEventListener('click', () => api.lever(hentSvar()));
  rad.append(sjekk);
  const opp = e('button', 'knapp-tekst', 'Vis fasit');
  opp.addEventListener('click', () => api.giOpp());
  rad.append(opp);
  return rad;
}

/* ══════════════════════════════════════════════════════════════════
   TILBAKEMELDING
   ══════════════════════════════════════════════════════════════════ */
export function tegnFasit(vert, o, r) {
  vert.replaceChildren();
  vert.hidden = false;
  const tone = r.riktig ? 'rett' : r.andel > 0 ? 'delvis' : 'galt';
  vert.className = 'fasit fasit-' + tone;

  const hode = e('div', 'fasit-hode');
  const key = o.verb === 'choose' && o.fasit?.[0] !== 'ingen' ? o.fasit[0]
    : o.shape === 'uteligger' ? 'mean' : 'median';
  const mood = r.riktig ? 'glad' : (o.shape === 'uteligger' ? 'sjokk' : 'skuldertrekk');
  const fig = e('div', 'fasit-maskot');
  fig.innerHTML = maskot(key, mood);
  hode.append(fig);
  const tittel = e('div', 'fasit-tittel');
  tittel.append(e('strong', null, r.avslort ? 'Fasit' : r.riktig ? 'Riktig' : r.andel > 0 ? 'Delvis' : 'Ikke helt'));
  if (r.poeng != null) tittel.append(e('span', 'fasit-poeng', `+${r.poeng} poeng`));
  hode.append(tittel);
  vert.append(hode);

  vert.append(e('p', 'fasit-tekst', r.tilbakemelding || ''));

  if (o.verb === 'overskrifter' && r.status) {
    const l = e('div', 'fasit-paastander');
    o.påstander.forEach((p, i) => {
      const k = e('div', 'fasit-paastand ' + (r.status[i] ? 'rett' : 'galt'));
      k.append(e('span', 'fasit-dom', DOMMER.find(d => d.key === p.dom).label));
      k.append(e('p', null, p.tekst));
      k.append(e('p', 'fasit-hvorfor', p.hvorfor));
      l.append(k);
    });
    vert.append(l);
  }

  if (o.shapeInfo && r.riktig !== undefined && o.verb !== 'bygg') {
    const p = e('p', 'fasit-poeng-laering');
    p.append(e('strong', null, o.shapeInfo.label + ': '));
    p.append(document.createTextNode(o.shapeInfo.point));
    vert.append(p);
  }

  if (r.nyeMerker?.length) {
    const m = e('div', 'merkevarsel');
    m.append(e('strong', null, r.nyeMerker.length > 1 ? 'Nye merker!' : 'Nytt merke!'));
    vert.append(m);
  }
}

/* ══════════════════════════════════════════════════════════════════
   HUD OG SLUTTSKJERM
   ══════════════════════════════════════════════════════════════════ */
export function tegnHud(t) {
  const hud = $('hud');
  hud.replaceChildren();
  if (t.modus === 'arkade') {
    hud.append(lapp('❤️'.repeat(Math.max(0, t.liv)) || '—', 'Liv'));
    hud.append(lapp(String(t.poeng), 'Poeng'));
    hud.append(lapp(t.streak > 1 ? '×' + Math.min(10, t.streak) : '–', 'Rekke'));
    $('tidsfelt').hidden = false;
  } else {
    hud.append(lapp(`${Math.min(t.runde + 1, t.antall)} / ${t.antall}`, t.modus === 'daglig' ? 'Dagens sak' : t.kapittel.tittel));
    hud.append(lapp(String(t.poeng), 'Poeng'));
    $('tidsfelt').hidden = true;
  }
  const andel = t.modus === 'arkade' ? 0 : Math.min(1, t.runde / t.antall);
  $('framdrift').style.width = (andel * 100) + '%';
}
function lapp(verdi, etikett) {
  const l = e('div', 'hudlapp');
  l.append(e('strong', null, verdi));
  l.append(e('span', null, etikett));
  return l;
}

export function stjernerad(n) {
  const r = e('div', 'stjernerad');
  r.innerHTML = [0, 1, 2].map(i => stjerne(i < n)).join('');
  return r;
}

export function tegnSlutt(t, arkiv) {
  const vert = $('sluttinnhold');
  vert.replaceChildren();

  const maks = t.resultater.length * 10;
  const riktige = t.resultater.filter(r => r.riktig).length;

  if (t.modus === 'kampanje') {
    /* Stjernene som vises er DENNE runden. Arkivet husker den beste,
       men å vise rekorden her ville vært å ta æren for noe annet. */
    const s = stjernerFor(t.poeng, t.resultater.length);
    const beste = arkiv.stjerner[t.kapittel.id] || 0;
    $('slutt-tittel').textContent = t.kapittel.tittel + ' fullført';
    vert.append(stjernerad(s));
    if (beste > s) vert.append(e('p', 'rekordnote', `Beste resultat på dette kapittelet: ${beste} av 3 stjerner.`));
  } else if (t.modus === 'arkade') {
    $('slutt-tittel').textContent = 'Arkaden er over';
  } else {
    $('slutt-tittel').textContent = 'Dagens sak er løst';
  }

  const tall = e('div', 'sluttall');
  tall.append(sluttboks(String(t.poeng), 'poeng'));
  tall.append(sluttboks(`${riktige} / ${t.resultater.length}`, 'riktige'));
  if (t.modus === 'arkade') tall.append(sluttboks(String(Math.max(arkiv.bestArkade, t.poeng)), 'rekord'));
  else tall.append(sluttboks(Math.round((t.poeng / (maks || 1)) * 100) + ' %', 'av maks'));
  vert.append(tall);

  if (t.modus === 'kampanje') {
    const l = e('div', 'laeringsboks');
    l.append(e('strong', null, 'Det du satt igjen med'));
    l.append(e('p', null, t.kapittel.laering));
    vert.append(l);
  }

  /* Hva gikk galt — sortert etter form, så eleven ser mønsteret. */
  const bom = t.resultater.filter(r => !r.riktig);
  if (bom.length) {
    const b = e('div', 'bomboks');
    b.append(e('strong', null, 'Verdt en ny titt'));
    const ul = e('ul');
    const perForm = {};
    bom.forEach(r => { perForm[r.shape || 'annet'] = (perForm[r.shape || 'annet'] || 0) + 1; });
    Object.entries(perForm).forEach(([f, n]) => {
      const navn = SHAPES[f]?.label || 'blandet';
      const poeng = SHAPES[f]?.point;
      const li = e('li', null, `${n} bom på datasett av typen «${navn.toLowerCase()}»`);
      if (poeng) li.append(e('span', 'bomhint', ' ' + poeng));
      ul.append(li);
    });
    b.append(ul);
    vert.append(b);
  }

  if (t.modus === 'daglig') {
    const d = e('div', 'delingsboks');
    d.append(e('p', 'delingsruter', t.resultater.map(r => r.andel === 1 ? '🟩' : r.andel > 0 ? '🟨' : '⬛').join('')));
    vert.append(d);
  }

  const merker = e('div', 'merkerad');
  arkiv.merker.forEach(id => {
    const m = e('span', 'merke');
    m.textContent = ({
      uteliggerjeger: '🎯', medianvakten: '🛡️', byggmester: '🔧',
      faktasjekker: '🔍', balansekunstner: '⚖️', sesongen: '🏆'
    })[id] || '★';
    merker.append(m);
  });
  if (arkiv.merker.length) vert.append(merker);
}
function sluttboks(verdi, etikett) {
  const b = e('div', 'sluttboks');
  b.append(e('strong', null, verdi));
  b.append(e('span', null, etikett));
  return b;
}

export { brettTekst, FARGE, maskot, stjerne };
