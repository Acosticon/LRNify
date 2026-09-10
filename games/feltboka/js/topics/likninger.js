import { br } from '../rational.js';
import { heltall, velg, ledd } from './util.js';

/* Enkle likninger (GDD pkt. 15 E og 16). Løsningen trekkes FØRST,
   og likningen bygges rundt den. Det garanterer heltallssvar uten
   at generatoren må prøve seg fram. */

export default {
  id: 'likninger',
  navn: 'Likninger',
  eksempel: '3x + 4 = 19',
  svarform: 'x',

  lett(rand) {
    const x = heltall(rand, 1, 20);
    const a = heltall(rand, 2, 15);
    if (velg(rand, [0, 1]) === 0) {
      return { sporsmal: `x + ${a} = ${x + a}`, fasit: br(x) };
    }
    return { sporsmal: `x - ${a} = ${x - a}`, fasit: br(x) };
  },

  middels(rand) {
    const x = heltall(rand, 1, 12);
    const a = heltall(rand, 2, 9);
    const b = heltall(rand, 1, 15);
    if (velg(rand, [0, 1]) === 0) {
      return { sporsmal: `${a}x + ${b} = ${a * x + b}`, fasit: br(x) };
    }
    return { sporsmal: `${a}x - ${b} = ${a * x - b}`, fasit: br(x) };
  },

  vanskelig(rand) {
    const x = heltall(rand, 1, 12);
    const a = heltall(rand, 2, 6);
    let c = heltall(rand, 1, 5);
    if (c === a) c = a === 6 ? 1 : a + 1;
    const b = heltall(rand, 1, 9);
    // a(x - b) = cx + d  →  d er det som får likningen til å stemme
    const d = a * (x - b) - c * x;
    return { sporsmal: `${a}(x - ${b}) = ${c}x ${ledd(d)}`, fasit: br(x) };
  }
};
