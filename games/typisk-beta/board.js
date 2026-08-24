/* ══════════════════════════════════════════════════════════════════
   board.js — spillbrettet.

   To visninger på det samme datasettet:

     LINJE  prikkplott på en tallinje. Sentralmålene tegnes som
            markører: gjennomsnittet under aksen, medianen som en
            loddrett strek som deler antallet i to, typetallet som
            den høyeste stabelen med krone.

     VEKT   aksen blir en planke, prikkene blir lodd, og dreiepunktet
            settes der du vil. Ligger det ikke i gjennomsnittet,
            vipper planken. Det er ikke en illustrasjon av
            gjennomsnittet — det ER gjennomsnittet (massesenteret).

   Prikkene er varige noder med stabil id, så de glir på plass i
   stedet for å hoppe når datasettet endrer seg.
   ══════════════════════════════════════════════════════════════════ */

import { mean, median, modes, counts, fmtNum, sortNum } from './stats.js';
import { FARGE } from './art.js';

const NS = 'http://www.w3.org/2000/svg';
const B = { w: 600, h: 278, venstre: 52, hoyre: 548, akse: 186, radius: 10, etasje: 23 };

const el = (navn, attr = {}) => {
  const n = document.createElementNS(NS, navn);
  for (const k in attr) n.setAttribute(k, attr[k]);
  return n;
};

/* Pene aksesteg: 1, 2, 2.5 eller 5 ganger en tierpotens. */
function pentSteg(rekkevidde, onsket = 5) {
  const rå = rekkevidde / onsket;
  const p = Math.pow(10, Math.floor(Math.log10(rå)));
  for (const m of [1, 2, 2.5, 5, 10]) if (p * m >= rå) return p * m;
  return p * 10;
}

export class Board {
  constructor(vert) {
    this.vert = vert;
    this.svg = el('svg', {
      viewBox: `0 0 ${B.w} ${B.h}`, class: 'brett-svg',
      'aria-hidden': 'true', focusable: 'false'
    });
    this.lagAkse = el('g', { class: 'lag-akse' });
    this.lagPlanke = el('g', { class: 'lag-planke' });
    this.lagPrikker = el('g', { class: 'lag-prikker' });
    this.lagMarkorer = el('g', { class: 'lag-markorer' });
    this.lagVekt = el('g', { class: 'lag-vekt' });
    this.planke = el('rect', {
      class: 'planke-flate', x: B.venstre - 12, y: B.akse - 5,
      width: (B.hoyre - B.venstre) + 24, height: 10, rx: 3
    });
    this.lagPlanke.append(this.planke, this.lagPrikker);
    this.svg.append(this.lagAkse, this.lagPlanke, this.lagMarkorer, this.lagVekt);
    vert.appendChild(this.svg);

    this.noder = new Map();      // id → { g, sirkel }
    this.data = [];
    this.modus = 'linje';
    this.domene = [0, 1];
  }

  /* ── Skala ─────────────────────────────────────────────────────── */
  settDomene(verdier, ekstra = []) {
    const alle = [...verdier, ...ekstra].filter(Number.isFinite);
    let lo = Math.min(...alle), hi = Math.max(...alle);
    if (lo === hi) { lo -= 1; hi += 1; }
    const luft = (hi - lo) * 0.12;
    this.domene = [lo - luft, hi + luft];
  }
  x(v) {
    const [lo, hi] = this.domene;
    return B.venstre + ((v - lo) / (hi - lo)) * (B.hoyre - B.venstre);
  }
  /* Motsatt vei — brukt av prediksjonsoppgaven når eleven drar. */
  verdiFraKlientX(klientX) {
    const r = this.svg.getBoundingClientRect();
    const andel = (klientX - r.left) / r.width;
    const px = andel * B.w;
    const [lo, hi] = this.domene;
    const v = lo + ((px - B.venstre) / (B.hoyre - B.venstre)) * (hi - lo);
    return Math.min(hi, Math.max(lo, v));
  }

  /* ── Aksen ─────────────────────────────────────────────────────── */
  tegnAkse(enhet) {
    this.lagAkse.replaceChildren();
    const [lo, hi] = this.domene;
    const steg = pentSteg(hi - lo);
    const start = Math.ceil(lo / steg) * steg;
    this.lagAkse.appendChild(el('line', {
      x1: B.venstre - 8, y1: B.akse, x2: B.hoyre + 8, y2: B.akse, class: 'akse-linje'
    }));
    for (let v = start; v <= hi + 1e-9; v += steg) {
      const x = this.x(v);
      this.lagAkse.appendChild(el('line', { x1: x, y1: B.akse, x2: x, y2: B.akse + 7, class: 'akse-hakk' }));
      const t = el('text', { x, y: B.akse + 24, class: 'akse-tall', 'text-anchor': 'middle' });
      t.textContent = fmtNum(v);
      this.lagAkse.appendChild(t);
    }
    if (enhet) {
      const e = el('text', { x: B.venstre - 12, y: B.akse + 44, class: 'akse-enhet', 'text-anchor': 'start' });
      e.textContent = enhet;
      this.lagAkse.appendChild(e);
    }
  }

  /* ── Prikkene ──────────────────────────────────────────────────── */
  tegnPrikker(punkter) {
    const etasje = new Map();
    const brukte = new Set();

    punkter.forEach(p => {
      const n = (etasje.get(p.verdi) || 0);
      etasje.set(p.verdi, n + 1);
      brukte.add(p.id);

      let node = this.noder.get(p.id);
      if (!node) {
        const g = el('g', { class: 'brikke' + (p.ny ? ' brikke-ny' : '') });
        const sirkel = el('circle', { r: B.radius, cx: 0, cy: 0 });
        g.appendChild(sirkel);
        this.lagPrikker.appendChild(g);
        node = { g, sirkel };
        this.noder.set(p.id, node);
        /* Nye prikker faller ned utenfra i stedet for å blinke fram. */
        g.style.transform = `translate(${this.x(p.verdi)}px, -40px)`;
        g.getBoundingClientRect();
      }
      node.g.classList.toggle('brikke-ny', !!p.ny);
      node.g.classList.toggle('brikke-type', !!p.type);
      node.g.style.transitionDelay = (p.forsinkelse || 0) + 'ms';
      node.g.style.transform = `translate(${this.x(p.verdi)}px, ${B.akse - B.radius - 4 - n * B.etasje}px)`;
    });

    for (const [id, node] of this.noder) {
      if (!brukte.has(id)) { node.g.remove(); this.noder.delete(id); }
    }
  }

  /* ── Markørene for de tre sentralmålene ────────────────────────── */
  tegnMarkorer(vis) {
    this.lagMarkorer.replaceChildren();
    const d = this.data;
    if (!d.length) return;

    if (vis.mode) {
      const mo = modes(d);
      const c = counts(d);
      mo.forEach(v => {
        const n = c.get(v), x = this.x(v);
        const topp = B.akse - B.radius - 4 - (n - 1) * B.etasje;
        this.lagMarkorer.appendChild(el('rect', {
          x: x - B.radius - 7, y: topp - B.radius - 7,
          width: (B.radius + 7) * 2, height: (n - 1) * B.etasje + (B.radius + 7) * 2,
          rx: B.radius + 7, class: 'markor-type'
        }));
        const krone = el('path', {
          d: `M${x - 11} ${topp - B.radius - 13} l3 -11 l4 6 l4 -9 l4 9 l4 -6 l3 11 Z`,
          class: 'markor-krone'
        });
        this.lagMarkorer.appendChild(krone);
      });
    }

    if (vis.median) {
      const m = median(d), x = this.x(m);
      const s = sortNum(d);
      const venstre = s.filter(v => v < m).length, hoyre = s.filter(v => v > m).length;
      this.lagMarkorer.appendChild(el('line', { x1: x, y1: 22, x2: x, y2: B.akse, class: 'markor-median-strek' }));
      this.lagMarkorer.appendChild(this.merkelapp(x, 16, 'Median ' + fmtNum(m), 'median'));
      this.lagMarkorer.appendChild(this.telling(x - 46, 46, venstre + ' ←'));
      this.lagMarkorer.appendChild(this.telling(x + 46, 46, '→ ' + hoyre));
    }

    if (vis.mean) {
      const m = mean(d), x = this.x(m);
      this.lagMarkorer.appendChild(el('path', {
        d: `M${x} ${B.akse + 2} l-13 22 h26 Z`, class: 'markor-snitt-pil'
      }));
      this.lagMarkorer.appendChild(this.merkelapp(x, B.akse + 44, 'Snitt ' + fmtNum(m), 'mean', true));
    }
  }

  merkelapp(x, y, tekst, farge, under = false) {
    const g = el('g', { class: 'merkelapp merkelapp-' + farge });
    const bredde = Math.max(62, tekst.length * 8.2 + 18);
    g.appendChild(el('rect', { x: x - bredde / 2, y: y - 13, width: bredde, height: 26, rx: 5 }));
    const t = el('text', { x, y: y + 5, 'text-anchor': 'middle' });
    t.textContent = tekst;
    g.appendChild(t);
    if (under) g.setAttribute('transform', `translate(0 ${0})`);
    return g;
  }
  telling(x, y, tekst) {
    const t = el('text', { x, y, class: 'markor-telling', 'text-anchor': 'middle' });
    t.textContent = tekst;
    return t;
  }

  /* ── Vektstang-visningen ───────────────────────────────────────── */
  tegnVekt(dreiepunkt) {
    this.lagVekt.replaceChildren();
    const d = this.data;
    const f = Number.isFinite(dreiepunkt) ? dreiepunkt : mean(d);
    const fx = this.x(f);

    /* Dreiemoment om dreiepunktet. Null moment = balanse = gjennomsnitt. */
    const moment = d.reduce((s, v) => s + (v - f), 0);
    const [lo, hi] = this.domene;
    const skala = d.length * (hi - lo) / 2 || 1;
    const vinkel = Math.max(-12, Math.min(12, (moment / skala) * 34));

    this.lagPlanke.style.transformOrigin = `${fx}px ${B.akse}px`;
    this.lagPlanke.style.transform = `rotate(${vinkel}deg)`;

    this.lagVekt.appendChild(el('path', {
      d: `M${fx} ${B.akse + 4} l-16 30 h32 Z`, class: 'vekt-kile'
    }));
    this.lagVekt.appendChild(this.merkelapp(fx, B.akse + 52, fmtNum(f), 'mean'));

    const status = el('text', { x: B.w / 2, y: 24, class: 'vekt-status', 'text-anchor': 'middle' });
    status.textContent = Math.abs(vinkel) < 0.4 ? '⚖️ i balanse' : (vinkel > 0 ? 'tipper mot høyre ↘' : 'tipper mot venstre ↙');
    this.lagVekt.appendChild(status);
    return vinkel;
  }

  /* ── Gjettemarkør for prediksjonsoppgaven ──────────────────────── */
  tegnGjett(verdi, etikett) {
    let g = this.lagVekt.querySelector('.gjett');
    if (!Number.isFinite(verdi)) { g?.remove(); return; }
    if (!g) {
      g = el('g', { class: 'gjett' });
      g.appendChild(el('line', { y1: 42, y2: B.akse + 2 }));
      g.appendChild(el('path', { d: 'M0 42 l-11 -17 h22 Z' }));
      const t = el('text', { y: 16, 'text-anchor': 'middle' });
      g.appendChild(t);
      this.lagVekt.appendChild(g);
    }
    g.querySelector('text').textContent = etikett ?? fmtNum(verdi);
    g.style.transform = `translate(${this.x(verdi)}px, 0)`;
  }

  /* ══════════════════════════════════════════════════════════════
     Hovedinngangen. Alt annet i spillet kaller bare denne.
     ══════════════════════════════════════════════════════════════ */
  tegn({ data, enhet, vis = {}, modus = 'linje', dreiepunkt, ekstraDomene = [], animer = false }) {
    this.data = data;
    this.modus = modus;
    this.settDomene(data, ekstraDomene);
    this.tegnAkse(enhet);

    const teller = new Map();
    const punkter = data.map((v, i) => {
      teller.set(v, (teller.get(v) || 0) + 1);
      return { id: 'p' + i, verdi: v, ny: !!animer && i === data.length - 1, forsinkelse: animer ? i * 55 : 0 };
    });
    if (vis.mode) {
      const mo = modes(data);
      punkter.forEach(p => { p.type = mo.includes(p.verdi); });
    }
    this.tegnPrikker(punkter);

    this.svg.classList.toggle('modus-vekt', modus === 'vekt');
    this.planke.style.opacity = modus === 'vekt' ? '1' : '0';
    if (modus === 'vekt') {
      this.lagMarkorer.replaceChildren();
      if (vis.median) this.tegnMedianIVekt();
      return this.tegnVekt(dreiepunkt);
    }
    this.lagPlanke.style.transform = 'rotate(0deg)';
    this.lagVekt.replaceChildren();
    this.tegnMarkorer(vis);
    return 0;
  }

  tegnMedianIVekt() {
    const m = median(this.data), x = this.x(m);
    this.lagMarkorer.appendChild(el('line', { x1: x, y1: 34, x2: x, y2: B.akse, class: 'markor-median-strek' }));
    this.lagMarkorer.appendChild(this.merkelapp(x, 28, 'Median ' + fmtNum(m), 'median'));
  }
}

/* Tekstalternativet. Brettet er pynt for den som ser det — dette er
   selve dataene for den som ikke gjør det. */
export function brettTekst(data, enhet) {
  const s = sortNum(data);
  const mo = modes(data);
  return `Datasettet sortert: ${s.map(fmtNum).join(', ')}${enhet ? ' ' + enhet : ''}. ` +
    `Gjennomsnitt ${fmtNum(mean(data))}, median ${fmtNum(median(data))}, ` +
    (mo.length ? `typetall ${mo.map(fmtNum).join(' og ')}.` : 'ingen typetall.');
}

export { FARGE };
