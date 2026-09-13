/* =========================================================
   FRAMGANG OG SAMLING
   Lagres lokalt i localStorage. Ingen innlogging, ingen data ut av
   nettleseren — samme modell som Ordtoget bruker, og i tråd med at
   LRNify ellers ikke krever pålogging.

   FEIDE-FORBEREDELSEN: `bruker` og eksportformatet under er formet
   etter GDD pkt. 22 (user_id, species_id, variant, count,
   first_found). Så lenge eleven er lokal er `bruker.id` null. Kommer
   FEIDE senere, settes id-en der og `eksporter()` gir rader som kan
   sendes rett inn i en synk — resten av spillet trenger ikke endres.

   Feiler lagringen (privat nettlesermodus), kjører spillet videre
   uten å lagre. Ingenting i spillet krever at lagring virker.
   ========================================================= */

import { CONFIG } from './config.js';
import { ARTER } from './data/species.js';
import { varianterFor } from './data/variants.js';
import { trekkFunn } from './draw.js';
import { lagAnonymId } from './stats.js';

const tomt = () => ({
  v: 1,
  bruker: { kilde: 'lokal', id: null },
  // Tilfeldig id for det anonyme statistikk-dashbordet (bruk-feltboka/,
  // se stats.js) — IKKE det samme som bruker.id over, som er reservert
  // til en ekte FEIDE-identitet senere. Genereres første gang den trengs.
  statistikkId: null,
  samling: {},                                    // artId → variantId → { antall, forste }
  progresjon: { riktigeSidenFunn: 0, ventendeFunn: 0 },
  // «Oppgaver løst» og «riktige svar» er samme tall så lenge en oppgave
  // først er løst når den er riktig (GDD pkt. 17) — derfor lagres det én
  // gang, og statistikksiden regner ut resten.
  statistikk: { riktige: 0, feilForsok: 0, funn: 0, streak: 0, besteStreak: 0 },
  valg: { tema: null, niva: 'lett' }
});

export class Framgang {
  constructor(nokkel = CONFIG.lagringsnokkel) {
    this.nokkel = nokkel;
    this.data = this._les();
  }

  _les() {
    const base = tomt();
    try {
      const raw = localStorage.getItem(this.nokkel);
      if (!raw) return base;
      const p = JSON.parse(raw);
      return {
        ...base,
        ...p,
        bruker: { ...base.bruker, ...(p.bruker || {}) },
        samling: p.samling || {},
        progresjon: { ...base.progresjon, ...(p.progresjon || {}) },
        statistikk: { ...base.statistikk, ...(p.statistikk || {}) },
        valg: { ...base.valg, ...(p.valg || {}) }
      };
    } catch (e) {
      return base;
    }
  }

  lagre() {
    try { localStorage.setItem(this.nokkel, JSON.stringify(this.data)); }
    catch (e) { /* privat modus – spillet går videre uten lagring */ }
  }

  /* --- Oppgaveflyten --- */

  /** Ett riktig svar. Returnerer true hvis det utløste et funn. */
  registrerRiktig() {
    const s = this.data.statistikk, p = this.data.progresjon;
    s.riktige++;
    s.streak++;
    if (s.streak > s.besteStreak) s.besteStreak = s.streak;

    p.riktigeSidenFunn++;
    let utloste = false;
    if (p.riktigeSidenFunn >= CONFIG.riktigePerFunn) {
      p.riktigeSidenFunn -= CONFIG.riktigePerFunn;
      p.ventendeFunn++;
      utloste = true;
    }
    this.lagre();
    return utloste;
  }

  /** Ett feil forsøk. Koster ingenting utover streaken (GDD pkt. 17). */
  registrerFeil() {
    this.data.statistikk.feilForsok++;
    this.data.statistikk.streak = 0;
    this.lagre();
  }

  framgangMotFunn() {
    return { antall: this.data.progresjon.riktigeSidenFunn, mal: CONFIG.riktigePerFunn };
  }

  harVentendeFunn() { return this.data.progresjon.ventendeFunn > 0; }

  /* --- Funn og samling --- */

  /**
   * Åpner ett ventende funn: trekker art og variant og fører det inn.
   * @returns {{artId:string, variantId:string, nytt:boolean, antall:number}|null}
   */
  apneFunn(rand = Math.random) {
    if (!this.harVentendeFunn()) return null;
    const { artId, variantId } = trekkFunn(rand);

    const forArt = this.data.samling[artId] || (this.data.samling[artId] = {});
    const fra_for = forArt[variantId];
    const nytt = !fra_for;
    if (nytt) forArt[variantId] = { antall: 1, forste: new Date().toISOString() };
    else fra_for.antall++;

    this.data.progresjon.ventendeFunn--;
    this.data.statistikk.funn++;
    this.lagre();

    return { artId, variantId, nytt, antall: forArt[variantId].antall };
  }

  samlingFor(artId) { return this.data.samling[artId] || {}; }

  harVariant(artId, variantId) { return Boolean(this.data.samling[artId]?.[variantId]); }

  /** «Ulv – 3/6» (GDD pkt. 12). Nevneren er artens EGNE varianter. */
  variantStatus(art) {
    const mulige = varianterFor(art);
    const funnet = mulige.filter(v => this.harVariant(art.id, v.id)).length;
    return { funnet, mulige: mulige.length };
  }

  /* --- Statistikk (GDD pkt. 24) --- */

  totaler() {
    const s = this.data.statistikk;
    let arterFunnet = 0, varianterFunnet = 0, muligeVarianter = 0;
    for (const art of ARTER) {
      const status = this.variantStatus(art);
      if (status.funnet > 0) arterFunnet++;
      varianterFunnet += status.funnet;
      muligeVarianter += status.mulige;
    }
    return {
      oppgaverLost: s.riktige,
      svarSendt: s.riktige + s.feilForsok,
      feilForsok: s.feilForsok,
      funn: s.funn,
      streak: s.streak,
      besteStreak: s.besteStreak,
      arterFunnet,
      arterTotalt: ARTER.length,
      varianterFunnet,
      muligeVarianter
    };
  }

  /* --- Valg eleven har gjort sist --- */

  huskValg(tema, niva) {
    this.data.valg = { tema, niva };
    this.lagre();
  }

  sisteValg() { return { ...this.data.valg }; }

  /* --- Anonym id til statistikk-dashbordet --- */

  /** Genereres én gang og lagres, slik at samme elev/enhet gir samme id igjen. */
  anonymId() {
    if (!this.data.statistikkId) {
      this.data.statistikkId = lagAnonymId();
      this.lagre();
    }
    return this.data.statistikkId;
  }

  /* --- FEIDE-forberedelsen --- */

  /** Samlingen som flate rader, formet etter GDD pkt. 22. */
  eksporter() {
    const rader = [];
    for (const [species_id, varianter] of Object.entries(this.data.samling)) {
      for (const [variant, post] of Object.entries(varianter)) {
        rader.push({
          user_id: this.data.bruker.id,
          species_id,
          variant,
          count: post.antall,
          first_found: post.forste
        });
      }
    }
    return rader;
  }

  nullstill() {
    this.data = tomt();
    this.lagre();
  }
}
