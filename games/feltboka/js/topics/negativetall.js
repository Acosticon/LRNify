import { br } from '../rational.js';
import { heltall, velg, paren } from './util.js';

/* Negative tall (GDD pkt. 15 B).

   Nivåene: Lett er ett fortegnsskifte i én operasjon, tall 2–10 —
   tallområdet var tidligere 2–15, altså videre enn Middels sitt eget
   2–12. Det var trolig hovedgrunnen til at Lett kunne føles tyngre
   enn Middels; rettet her. Middels innfører dobbelt fortegn (trekke
   fra et negativt tall, eller gange med fortegn). Vanskelig
   kombinerer et produkt av to negative tall med addisjon/subtraksjon. */

export default {
  id: 'negativetall',
  navn: 'Negative tall',
  eksempel: '-7 + 12',
  svarform: 'tall',
  tastatur: 'tekst',        // svaret kan være negativt

  lett(rand) {
    const form = heltall(rand, 0, 2);
    const a = heltall(rand, 2, 10), b = heltall(rand, 2, 10);
    if (form === 0) return { sporsmal: `-${a} + ${b}`, fasit: br(b - a) };
    if (form === 1) return { sporsmal: `${a} - ${a + b}`, fasit: br(-b) };
    return { sporsmal: `-${a} - ${b}`, fasit: br(-a - b) };
  },

  middels(rand) {
    const form = heltall(rand, 0, 2);
    const a = heltall(rand, 2, 12), b = heltall(rand, 2, 12), c = heltall(rand, 2, 12);
    if (form === 0) return { sporsmal: `${a} - (-${b})`, fasit: br(a + b) };
    if (form === 1) {
      const tegn = velg(rand, [1, -1]);
      return { sporsmal: `-${a} · ${paren(tegn * b)}`, fasit: br(-a * tegn * b) };
    }
    return { sporsmal: `-${a} + ${b} - ${c}`, fasit: br(-a + b - c) };
  },

  vanskelig(rand) {
    const form = heltall(rand, 0, 2);
    const a = heltall(rand, 2, 9), b = heltall(rand, 2, 9), c = heltall(rand, 2, 12);
    if (form === 0) return { sporsmal: `(-${a}) · (-${b}) - ${c}`, fasit: br(a * b - c) };
    if (form === 1) return { sporsmal: `-${c} - (-${a}) · ${b}`, fasit: br(-c + a * b) };
    const d = heltall(rand, 2, 9);
    return { sporsmal: `${a} · (-${b}) + ${c} · (-${d})`, fasit: br(-a * b - c * d) };
  }
};
