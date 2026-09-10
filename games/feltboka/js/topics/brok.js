import { br, pluss, minus, gange } from '../rational.js';
import { heltall, velg } from './util.js';

/* Brøk (GDD pkt. 15 C). Svaret er en eksakt brøk, og elevens svar
   godtas på riktig verdi — 6/8, 3/4 og 0,75 er samme tall. Skal
   spillet kreve forkortet brøk, se DESIGN.md. */

export default {
  id: 'brok',
  navn: 'Brøk',
  eksempel: '3/4 + 1/8',
  svarform: 'brok',
  tastatur: 'tekst',        // svaret trenger «/»

  lett(rand) {
    // Samme nevner. Svaret holder seg under 1 så det leses som en brøk.
    const n = heltall(rand, 3, 10);
    const a = heltall(rand, 1, n - 2);
    const b = heltall(rand, 1, n - 1 - a);
    if (velg(rand, [0, 1]) === 0) {
      return { sporsmal: `${a}/${n} + ${b}/${n}`, fasit: br(a + b, n) };
    }
    return { sporsmal: `${a + b}/${n} - ${b}/${n}`, fasit: br(a, n) };
  },

  middels(rand) {
    // Den ene nevneren er et multiplum av den andre.
    const n1 = heltall(rand, 2, 6);
    const k = heltall(rand, 2, 4);
    const n2 = n1 * k;
    const a = heltall(rand, 1, n1 - 1);
    const b = heltall(rand, 1, n2 - 1);
    const x = br(a, n1), y = br(b, n2);
    if (velg(rand, [0, 1]) === 0) {
      return { sporsmal: `${a}/${n1} + ${b}/${n2}`, fasit: pluss(x, y) };
    }
    const stor = a * k >= b ? { s: `${a}/${n1} - ${b}/${n2}`, f: minus(x, y) }
                            : { s: `${b}/${n2} - ${a}/${n1}`, f: minus(y, x) };
    return { sporsmal: stor.s, fasit: stor.f };
  },

  vanskelig(rand) {
    const n1 = heltall(rand, 2, 9);
    let n2 = heltall(rand, 2, 9);
    if (n2 === n1) n2 = n1 === 9 ? 2 : n1 + 1;
    const a = heltall(rand, 1, n1 - 1);
    const b = heltall(rand, 1, n2 - 1);
    const x = br(a, n1), y = br(b, n2);
    const form = heltall(rand, 0, 2);
    if (form === 0) return { sporsmal: `${a}/${n1} + ${b}/${n2}`, fasit: pluss(x, y) };
    if (form === 1) return { sporsmal: `${a}/${n1} · ${b}/${n2}`, fasit: gange(x, y) };
    // Trekk alltid den minste fra den største, så svaret er positivt.
    const [stor, liten] = a * n2 >= b * n1 ? [[a, n1, x], [b, n2, y]] : [[b, n2, y], [a, n1, x]];
    return {
      sporsmal: `${stor[0]}/${stor[1]} - ${liten[0]}/${liten[1]}`,
      fasit: minus(stor[2], liten[2])
    };
  }
};
