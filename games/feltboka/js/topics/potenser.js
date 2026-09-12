import { br } from '../rational.js';
import { heltall, velg, hev } from './util.js';

/* Potenser (GDD pkt. 15 F). Hensikten med temaet er forenkling og
   potensregler, ikke bare regning — svaret er likevel alltid
   tallverdien (ikke potensform), fordi tallene i hvert nivå er valgt
   slik at det er tydelig lettere å slå sammen eksponentene først enn
   å regne ut hvert ledd for seg. Det tester regelen indirekte, uten
   at motoren trenger en egen svarform for potensuttrykk.

   Nivåene:
   Lett — enkle potenser i fire varianter: kvadrat/kubikk for små
   grunntall (1–5), kvadrat for større grunntall (6–10) uten å dra inn
   store kubikktall, nullregelen (grunntall opphøyd i 0 er alltid 1),
   og tierpotenser («legg til nuller»).
   Middels — produkt eller kvotient av potenser med samme grunntall.
   Kombinert eksponent er begrenset per grunntall, så svaret aldri
   sprenger seg selv (grunntall 2 tåler mer enn grunntall 5).
   Vanskelig — en brøk av produkter med samme grunntall i teller og
   nevner, «(a^b · a^c) : (a^d · a^e)». Et enkeltledd vises aldri med
   eksponent 1 (ingen skriver «2¹»), og resultatets eksponent er alltid
   minst 1 og innenfor samme grense som Middels. */

/** Maks kombinert eksponent et grunntall tåler før svaret blir for stort
    til rask mengdetrening. */
const maksKombinert = (a) => (a === 2 ? 6 : a === 3 ? 4 : 3);

export default {
  id: 'potenser',
  navn: 'Potenser',
  eksempel: '2³ · 2²',
  svarform: 'tall',

  lett(rand) {
    const form = heltall(rand, 0, 3);
    if (form === 0) {
      const a = heltall(rand, 1, 5);
      const b = velg(rand, [2, 3]);
      return { sporsmal: `${a}${hev(b)}`, fasit: br(a ** b) };
    }
    if (form === 1) {
      const a = heltall(rand, 6, 10);
      return { sporsmal: `${a}${hev(2)}`, fasit: br(a ** 2) };
    }
    if (form === 2) {
      const a = heltall(rand, 2, 10);
      return { sporsmal: `${a}${hev(0)}`, fasit: br(1) };
    }
    const b = heltall(rand, 2, 5);
    return { sporsmal: `10${hev(b)}`, fasit: br(10 ** b) };
  },

  middels(rand) {
    const a = velg(rand, [2, 3, 4, 5]);
    const maks = maksKombinert(a);
    if (velg(rand, [0, 1]) === 0) {
      const total = heltall(rand, 2, maks);
      const b = heltall(rand, 1, total - 1);
      const c = total - b;
      return { sporsmal: `${a}${hev(b)} · ${a}${hev(c)}`, fasit: br(a ** total) };
    }
    const c = heltall(rand, 1, maks - 1);
    const b = c + heltall(rand, 1, maks - c);
    return { sporsmal: `${a}${hev(b)} : ${a}${hev(c)}`, fasit: br(a ** (b - c)) };
  },

  vanskelig(rand) {
    const a = velg(rand, [2, 3, 4, 5]);
    const maks = maksKombinert(a);
    // Vektet trekning finner et gyldig sett i praksis alltid innenfor
    // noen få forsøk (b1,b2 ∈ [2,5], b3,b4 ∈ [2,4] gir god spredning i
    // resultatet); et lite antall forsøk holder derfor, med et trygt
    // fall tilbake på Middels sin form fremfor å risikere en uendelig
    // løkke hvis to grunntall en dag skulle gjøre det umulig.
    for (let forsok = 0; forsok < 50; forsok++) {
      const b1 = heltall(rand, 2, 5), b2 = heltall(rand, 2, 5);
      const b3 = heltall(rand, 2, 4), b4 = heltall(rand, 2, 4);
      const resultat = (b1 + b2) - (b3 + b4);
      if (resultat >= 1 && resultat <= maks) {
        return {
          sporsmal: `(${a}${hev(b1)} · ${a}${hev(b2)}) : (${a}${hev(b3)} · ${a}${hev(b4)})`,
          fasit: br(a ** resultat)
        };
      }
    }
    return this.middels(rand);
  }
};
