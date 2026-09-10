import { br } from '../rational.js';
import { heltall, velg, hev } from './util.js';

/* Potenser (GDD pkt. 15 F). Svaret er alltid tallverdien, ikke
   potensform — «2³ · 2²» besvares med 32, ikke med 2⁵. Grunntallene
   holdes små nok til at svaret kan regnes i hodet eller på papir. */

export default {
  id: 'potenser',
  navn: 'Potenser',
  eksempel: '2³ · 2²',
  svarform: 'tall',

  lett(rand) {
    // Kvadrater går høyere enn kubikktall, og tierpotensene tas med
    // fordi de er den ene potensregelen alle skal kjenne igjen.
    const form = heltall(rand, 0, 2);
    if (form === 0) {
      const a = heltall(rand, 2, 13);
      return { sporsmal: `${a}${hev(2)}`, fasit: br(a ** 2) };
    }
    if (form === 1) {
      const a = heltall(rand, 2, 7);
      return { sporsmal: `${a}${hev(3)}`, fasit: br(a ** 3) };
    }
    const b = heltall(rand, 2, 5);
    return { sporsmal: `10${hev(b)}`, fasit: br(10 ** b) };
  },

  middels(rand) {
    const a = velg(rand, [2, 3, 4, 5]);
    if (velg(rand, [0, 1]) === 0) {
      const b = heltall(rand, 1, 3);
      const c = heltall(rand, 1, a === 2 ? 4 : 2);
      return { sporsmal: `${a}${hev(b)} · ${a}${hev(c)}`, fasit: br(a ** (b + c)) };
    }
    const c = heltall(rand, 1, 2);
    const b = c + heltall(rand, 1, a === 2 ? 4 : 2);
    return { sporsmal: `${a}${hev(b)} : ${a}${hev(c)}`, fasit: br(a ** (b - c)) };
  },

  vanskelig(rand) {
    const form = heltall(rand, 0, 2);
    if (form === 0) {
      const a = velg(rand, [2, 3]);
      const b = heltall(rand, 2, 3);
      const c = 2;
      return { sporsmal: `(${a}${hev(b)})${hev(c)}`, fasit: br(a ** (b * c)) };
    }
    if (form === 1) {
      const a = velg(rand, [2, 3, 5]);
      const b = heltall(rand, 2, 3), c = heltall(rand, 1, 2), d = heltall(rand, 1, 2);
      return {
        sporsmal: `${a}${hev(b)} · ${a}${hev(c)} : ${a}${hev(d)}`,
        fasit: br(a ** (b + c - d))
      };
    }
    const a = velg(rand, [2, 3, 4, 5, 6, 7, 8, 9]);
    const b = heltall(rand, 2, 3);
    return { sporsmal: `${a}${hev(0)} + ${a}${hev(b)}`, fasit: br(1 + a ** b) };
  }
};
