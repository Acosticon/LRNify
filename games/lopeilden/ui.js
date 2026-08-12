// ui.js – All rendering. Ingen spillregler her.

import {
  TEKNIKKER, MERKER, SLUTTUTFORDRING,
  REFLEKSJON, PERSONER, STED
} from './content.js';

import {
  ANTALL_RUNDER, MAKS_POENG, rundeFor,
  merkerOppnadd, karakter, ettermaele, escapeHtml as esc
} from './game.js';

const el = id => document.getElementById(id);

/* ─── Målere ─────────────────────────────────────────── */

const MALERE = [
  { id: 'spredning',    ikon: '📡', navn: 'Spredning' },
  { id: 'troverdighet', ikon: '🤝', navn: 'Troverdighet' },
  { id: 'skade',        ikon: '💔', navn: 'Skade' }
];

export function tegnMalere(t, deltaer = null) {
  MALERE.forEach(m => {
    const wrap = document.querySelector(`[data-maler="${m.id}"]`);
    if (!wrap) return;
    const verdi = t.malere[m.id];
    wrap.style.setProperty('--fyll', `${verdi}%`);
    wrap.querySelector('.maler-tall').textContent = verdi;
    wrap.setAttribute('aria-valuenow', verdi);

    const d = deltaer?.[m.id];
    if (d) blinkDelta(wrap, d, m.id);
  });

  el('innsikt-tall').textContent = t.innsikt;
  el('runde-tall').textContent = `${Math.min(t.rundeNr, ANTALL_RUNDER)}/${ANTALL_RUNDER}`;
}

function blinkDelta(wrap, delta, malerId) {
  const chip = document.createElement('span');
  // For skade er «opp» alltid dårlig, uansett hvordan tallet ser ut.
  const daarlig = malerId === 'skade' ? delta > 0 : delta < 0;
  chip.className = `maler-delta ${daarlig ? 'neg' : 'pos'}`;
  chip.textContent = `${delta > 0 ? '+' : ''}${delta}`;
  wrap.appendChild(chip);
  setTimeout(() => chip.remove(), 1700);
}

/* ─── Slag 1: trekket ────────────────────────────────── */

export function tegnTrekk(t, onVelg) {
  const r = rundeFor(t);
  const scene = r.scene.split('\n\n').map(p => `<p>${esc(p)}</p>`).join('');

  el('scene').innerHTML = `
    <div class="runde-hode">
      <span class="runde-merke">Runde ${r.nr}</span>
      <span class="runde-tid">${esc(r.tid)}</span>
    </div>
    <h2 class="runde-tittel">${esc(r.tittel)}</h2>
    <div class="scene-tekst">${scene}</div>
    ${r.dilemma ? '<p class="dilemma-varsel">⚖️ Dilemma: her finnes det ikke noe valg uten kostnad.</p>' : ''}
  `;

  el('handling').innerHTML = `
    <h3 class="handling-sporsmal">${esc(r.sporsmal)}</h3>
    <div class="valgliste">
      ${r.valg.map((v, i) => `
        <button class="valgkort" data-i="${i}">
          <span class="valgkort-tekst">${esc(v.tekst)}</span>
          <span class="valgkort-under">${esc(v.under)}</span>
        </button>`).join('')}
    </div>`;

  el('handling').querySelectorAll('.valgkort').forEach(btn =>
    btn.addEventListener('click', () => onVelg(Number(btn.dataset.i))));

  visSlagmerke('trekk');
}

/* ─── Slag 2: ekkoet ─────────────────────────────────── */

export function tegnEkko(t, onVidere) {
  const r = rundeFor(t);
  const valg = r.valg[t.valgtTrekk];
  const h = t.hendelse;

  el('handling').innerHTML = `
    <div class="ekko">
      <p class="ekko-etikett">Du valgte</p>
      <p class="ekko-valg">${esc(valg.tekst)}</p>
      <p class="ekko-respons">${esc(valg.respons)}</p>

      <div class="hendelseskort">
        <span class="hendelse-ikon" aria-hidden="true">${h.ikon}</span>
        <div>
          <p class="hendelse-etikett">Hendelse</p>
          <p class="hendelse-tekst">${esc(h.tekst)}</p>
        </div>
      </div>

      <button class="btn-primar" id="btn-videre">Bytt stol →</button>
    </div>`;

  el('btn-videre').addEventListener('click', onVidere);
  visSlagmerke('ekko');
}

/* ─── Slag 3: motgiften ──────────────────────────────── */

export function tegnMotgift(t, onSvar) {
  const m = rundeFor(t).motgift;
  const brukt = t.motgiftValg;

  el('handling').innerHTML = `
    <div class="motgift">
      <p class="motgift-etikett">🛡️ Motgift</p>
      <p class="motgift-intro">${esc(m.intro)}</p>
      ${m.sitat ? `<blockquote class="motgift-sitat">${esc(m.sitat)}</blockquote>` : ''}
      <h3 class="motgift-sporsmal">${esc(m.sporsmal)}</h3>
      ${m.flervalg ? `<p class="motgift-hint">Du skal finne ${m.flervalg}.</p>` : ''}
      <div class="motgift-liste">
        ${m.alternativer.map((a, i) => {
          const prov = brukt.includes(i);
          const status = prov ? (a.riktig ? 'riktig' : (a.delvis ? 'delvis' : 'feil')) : '';
          return `
            <button class="svarkort ${status}" data-i="${i}" ${prov ? 'disabled' : ''}>
              <span class="svarkort-tekst">${esc(a.tekst)}</span>
              ${a.under ? `<span class="svarkort-under">${esc(a.under)}</span>` : ''}
              ${prov ? `<span class="svarkort-svar">${esc(a.svar)}</span>` : ''}
            </button>`;
        }).join('')}
      </div>
    </div>`;

  el('handling').querySelectorAll('.svarkort:not([disabled])').forEach(btn =>
    btn.addEventListener('click', () => onSvar(Number(btn.dataset.i))));

  visSlagmerke('motgift');
}

/* ─── Slag 4: læringen ───────────────────────────────── */

export function tegnLaering(t, onNeste) {
  const r = rundeFor(t);
  const m = r.motgift;
  const tek = TEKNIKKER[r.teknikk];
  const sisteRunde = r.nr >= ANTALL_RUNDER;

  el('handling').innerHTML = `
    <div class="laering">
      <p class="laering-poeng">+${t.motgiftPoeng} innsiktspoeng</p>
      <p class="laering-fasit">${esc(m.fasit)}</p>

      <div class="teknikkort ny">
        <p class="teknikkort-etikett">Teknikkort låst opp</p>
        <h3 class="teknikkort-navn"><span aria-hidden="true">${tek.ikon}</span> ${esc(tek.navn)}</h3>
        <p class="teknikkort-kort">${esc(tek.kort)}</p>
        <p class="teknikkort-bolk"><strong>Hvorfor det virker:</strong> ${esc(tek.hvorfor)}</p>
        <p class="teknikkort-bolk"><strong>Slik oppdager du det:</strong></p>
        <ul class="teknikkort-liste">
          ${tek.oppdag.map(o => `<li>${esc(o)}</li>`).join('')}
        </ul>
      </div>

      <button class="btn-primar" id="btn-neste">
        ${sisteRunde ? 'Til oppgjøret →' : `Runde ${r.nr + 1} →`}
      </button>
    </div>`;

  el('btn-neste').addEventListener('click', onNeste);
  visSlagmerke('laering');
}

/* ─── Framdriftsprikker ──────────────────────────────── */

function visSlagmerke(slag) {
  const rekkefolge = ['trekk', 'ekko', 'motgift', 'laering'];
  document.querySelectorAll('.slag-prikk').forEach(p => {
    const i = rekkefolge.indexOf(p.dataset.slag);
    p.classList.toggle('aktiv', i === rekkefolge.indexOf(slag));
    p.classList.toggle('passert', i < rekkefolge.indexOf(slag));
  });
}

export function tegnSamling(t) {
  const boks = el('samling');
  if (!boks) return;
  boks.innerHTML = Object.entries(TEKNIKKER).map(([id, tek]) => {
    const apen = t.apneTeknikker.includes(id);
    return `<span class="samling-brikke ${apen ? 'apen' : ''}"
                  title="${apen ? esc(tek.navn) : 'Ikke låst opp ennå'}">
              ${apen ? tek.ikon : '·'}
            </span>`;
  }).join('');
}

/* ─── Sluttutfordring ────────────────────────────────── */

export function tegnSluttutfordring(t, onSvar) {
  const valgbare = Object.entries(TEKNIKKER);

  el('scene').innerHTML = `
    <div class="runde-hode"><span class="runde-merke">Til slutt</span></div>
    <h2 class="runde-tittel">Nå snur vi spillet</h2>
    <div class="scene-tekst">
      <p>Tre poster. Ingen valg å ta, ingen konto å bygge.</p>
      <p>Bare ett spørsmål: hvilken teknikk er i bruk?</p>
    </div>`;

  el('handling').innerHTML = `
    <div class="slutttest">
      ${SLUTTUTFORDRING.map((o, i) => {
        const svar = t.sluttSvar[i];
        return `
        <div class="slutttest-post ${svar ? (svar.riktig ? 'riktig' : 'feil') : ''}">
          <p class="slutttest-tekst">${esc(o.post)}</p>
          <div class="slutttest-knapper">
            ${valgbare.map(([id, tek]) => `
              <button class="teknikk-knapp ${svar?.valgt === id ? 'valgt' : ''}"
                      data-oppg="${i}" data-tek="${id}" ${svar ? 'disabled' : ''}>
                ${tek.ikon} ${esc(tek.navn)}
              </button>`).join('')}
          </div>
          ${svar ? `<p class="slutttest-svar">
                      ${svar.riktig ? '✔ Riktig.' : `✘ Riktig svar: ${esc(TEKNIKKER[o.riktig].navn)}.`}
                      ${esc(o.svar)}
                    </p>` : ''}
        </div>`;
      }).join('')}
    </div>
    <button class="btn-primar" id="btn-oppgjor" ${t.sluttSvar.filter(Boolean).length < SLUTTUTFORDRING.length ? 'disabled' : ''}>
      Se oppgjøret →
    </button>`;

  el('handling').querySelectorAll('.teknikk-knapp:not([disabled])').forEach(btn =>
    btn.addEventListener('click', () =>
      onSvar(Number(btn.dataset.oppg), btn.dataset.tek)));
}

/* ─── Oppgjøret ──────────────────────────────────────── */

export function tegnOppgjor(t) {
  const kar = karakter(t);
  const merker = merkerOppnadd(t);
  const rammet = Object.entries(t.ofre)
    .filter(([id]) => PERSONER[id])
    .sort((a, b) => b[1] - a[1]);

  const skadetekst = (id, poeng) => {
    const p = PERSONER[id];
    return poeng >= 18 ? p.hoy : poeng >= 8 ? p.mid : p.lav;
  };

  return `
    <div class="oppgjor">
      <p class="oppgjor-etikett">${esc(STED.avis)} · fredag</p>
      <h1 class="oppgjor-tittel">Ryktet om garderobene</h1>
      <p class="oppgjor-ingress">${esc(ettermaele(t))}</p>

      <section class="oppgjor-boks poengboks">
        <div class="poeng-stor">
          <span class="poeng-tall">${t.innsikt}</span>
          <span class="poeng-av">av ${MAKS_POENG} innsiktspoeng</span>
        </div>
        <h2 class="poeng-tittel">${esc(kar.tittel)}</h2>
        <p class="poeng-tekst">${esc(kar.tekst)}</p>
        <p class="poeng-note">Innsiktspoeng får du bare for å avsløre. Ingenting du gjorde som avsender
        ga poeng – det var med vilje.</p>
      </section>

      <section class="oppgjor-boks">
        <h2 class="oppgjor-h2">Sporet du la igjen</h2>
        <div class="sluttmalere">
          ${MALERE.map(m => `
            <div class="sluttmaler ${m.id === 'skade' ? 'skade' : ''}">
              <span class="sluttmaler-ikon">${m.ikon}</span>
              <span class="sluttmaler-tall">${t.malere[m.id]}</span>
              <span class="sluttmaler-navn">${m.navn}</span>
            </div>`).join('')}
        </div>
        ${rammet.length ? `
          <ul class="offerliste">
            ${rammet.map(([id, poeng]) => `
              <li>
                <strong>${esc(PERSONER[id].navn)}</strong>
                <span class="offer-rolle">${esc(PERSONER[id].rolle)}</span>
                <p>${esc(skadetekst(id, poeng))}</p>
              </li>`).join('')}
          </ul>`
        : '<p class="ingen-ofre">Ingen navngitte personer ble rammet av det du gjorde. Det er sjeldnere enn du tror.</p>'}
        ${t.flagg.includes('skjermbilde')
          ? '<p class="fotnote">Skjermbildene finnes fortsatt. De ble tatt før du rakk å ombestemme deg.</p>' : ''}
      </section>

      <section class="oppgjor-boks">
        <h2 class="oppgjor-h2">Merker (${merker.length}/${MERKER.length})</h2>
        <div class="merkeliste">
          ${MERKER.map(m => {
            const har = merker.some(x => x.id === m.id);
            return `<div class="merke ${har ? 'har' : ''}">
                      <span class="merke-ikon">${har ? m.ikon : '🔒'}</span>
                      <span class="merke-navn">${esc(m.navn)}</span>
                      <span class="merke-krav">${esc(m.krav)}</span>
                    </div>`;
          }).join('')}
        </div>
      </section>

      <section class="oppgjor-boks">
        <h2 class="oppgjor-h2">Teknikkene du møtte</h2>
        <div class="fasitkort">
          ${Object.entries(TEKNIKKER).map(([id, tek]) => `
            <details class="fasitkort-en">
              <summary><span aria-hidden="true">${tek.ikon}</span> ${esc(tek.navn)}</summary>
              <p>${esc(tek.kort)}</p>
              <p class="fasit-hvorfor">${esc(tek.hvorfor)}</p>
              <ul>${tek.oppdag.map(o => `<li>${esc(o)}</li>`).join('')}</ul>
            </details>`).join('')}
        </div>
      </section>

      <section class="oppgjor-boks refleksjon">
        <h2 class="oppgjor-h2">Tenk over dette før du scroller videre</h2>
        <h3 class="refleksjon-h3">For deg selv</h3>
        <ol>${REFLEKSJON.alene.map(q => `<li>${esc(q)}</li>`).join('')}</ol>
        <h3 class="refleksjon-h3">I klassen</h3>
        <ol>${REFLEKSJON.gruppe.map(q => `<li>${esc(q)}</li>`).join('')}</ol>
      </section>

      <section class="oppgjor-boks viktig">
        <h2 class="oppgjor-h2">Én ting til</h2>
        <p>Alt i dette spillet er oppdiktet. ${esc(STED.kommune)} finnes ikke, og ingen av personene
        er ekte. Teknikkene er derimot helt ekte, og de brukes hver dag – også mot deg.</p>
        <p>Poenget med å ha prøvd dem fra innsiden er ikke at du skal bruke dem.
        Det er at de aldri mer skal virke like godt på deg.</p>
      </section>

      <div class="oppgjor-knapper">
        <button class="btn-primar" id="btn-omigjen">Spill igjen</button>
        <button class="btn-sekundar" id="btn-del">Del resultatet</button>
        <a class="btn-sekundar" href="laerer.html">Lærerveiledning</a>
      </div>
    </div>`;
}
