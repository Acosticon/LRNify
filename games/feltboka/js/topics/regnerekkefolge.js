import { br } from '../rational.js';
import { heltall, velg } from './util.js';

/* Regnerekkefølge (GDD pkt. 15 A). Ingen uttrykk evalueres — hver
   form regner ut sitt eget svar. Da finnes det ingen parser som kan
   være uenig med fasiten, og ingen eval i en elevrettet nettside. */

export default {
  id: 'regnerekkefolge',
  navn: 'Regnerekkefølge',
  eksempel: '4 + 3 · 5',
  svarform: 'tall',

  lett(rand) {
    const a = heltall(rand, 2, 12), b = heltall(rand, 2, 9), c = heltall(rand, 2, 9);
    if (velg(rand, [0, 1]) === 0) {
      return { sporsmal: `${a} + ${b} · ${c}`, fasit: br(a + b * c) };
    }
    const d = heltall(rand, 1, b * c - 1);
    return { sporsmal: `${b} · ${c} - ${d}`, fasit: br(b * c - d) };
  },

  middels(rand) {
    const form = heltall(rand, 0, 2);
    if (form === 0) {
      const a = heltall(rand, 2, 9), b = heltall(rand, 2, 9), c = heltall(rand, 2, 6);
      const d = heltall(rand, 1, 15);
      return { sporsmal: `(${a} + ${b}) · ${c} - ${d}`, fasit: br((a + b) * c - d) };
    }
    if (form === 1) {
      const a = heltall(rand, 3, 9), b = heltall(rand, 2, 8), c = heltall(rand, 2, 8);
      const d = heltall(rand, 1, a + b * c - 1);
      return { sporsmal: `${a} + ${b} · ${c} - ${d}`, fasit: br(a + b * c - d) };
    }
    const a = heltall(rand, 2, 9), b = heltall(rand, 2, 9);
    const c = heltall(rand, 2, 9), d = heltall(rand, 2, 9);
    return { sporsmal: `${a} · ${b} + ${c} · ${d}`, fasit: br(a * b + c * d) };
  },

  vanskelig(rand) {
    const form = heltall(rand, 0, 2);
    if (form === 0) {
      const a = heltall(rand, 3, 9), b = heltall(rand, 2, 9), c = heltall(rand, 2, 9);
      const d = heltall(rand, 2, 6);
      // e velges slik at svaret alltid blir positivt, i stedet for å
      // trekke om igjen til det tilfeldigvis går bra.
      const e = heltall(rand, 2, Math.max(2, Math.min(6, Math.floor((a * (b + c) - 1) / d))));
      return { sporsmal: `${a} · (${b} + ${c}) - ${d} · ${e}`, fasit: br(a * (b + c) - d * e) };
    }
    if (form === 1) {
      const b = heltall(rand, 5, 12), c = heltall(rand, 1, b - 1);
      const a = heltall(rand, 2, 9), d = heltall(rand, 2, 9);
      return { sporsmal: `${a} · (${b} - ${c}) + ${d}`, fasit: br(a * (b - c) + d) };
    }
    const n = heltall(rand, 2, 6);
    const a = n * heltall(rand, 2, 8);            // går alltid opp
    const b = heltall(rand, 2, 9), c = heltall(rand, 2, 9);
    return { sporsmal: `${a} : ${n} + ${b} · ${c}`, fasit: br(a / n + b * c) };
  }
};
