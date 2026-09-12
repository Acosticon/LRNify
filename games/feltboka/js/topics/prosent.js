import { br } from '../rational.js';
import { heltall, velg } from './util.js';

/* Prosent (GDD pkt. 15 D). Alle svar er hele tall.

   Grunntallet trekkes FØRST, og prosentsatsen velges deretter blant
   dem som går opp mot akkurat det tallet. Motsatt rekkefølge — velg
   12 %, så et grunntall — gir «12 % av 240 = 28,8», som verken er et
   heltall eller noe en åttendeklassing skal møte på lett nivå. */

/* Lett skal bare inneholde prosenter som løses med del-på-metoden
   (10 %, 25 %, 50 %) — ingen ekte multiplikasjon trengs. 20 % og 75 %
   lå i Lett før, men krever et reelt regnestykke, ikke bare et
   gjenkjennelig triks; de er nå Middels sitt nivå sammen med de andre
   «vanlige» prosentene. */
const SATSER = {
  lett: [10, 25, 50],
  middels: [5, 15, 20, 30, 40],
  vanskelig: [5, 15, 20, 25, 40, 60]
};

/** Grunntall som er delelig på 20, i et område som er greit i hodet. */
const grunntall = (rand, minK, maxK) => heltall(rand, minK, maxK) * 20;

/** Satsene som gir helt antall når de brukes på `n`. */
const gårOpp = (n, satser) => satser.filter(p => (n * p) % 100 === 0);

function satsFor(rand, n, satser) {
  const lovlige = gårOpp(n, satser);
  // Et grunntall delelig på 100 tar alle satsene; er lista tom, er
  // det 20-tallet som er for grovt — da rundes n opp til nærmeste 100.
  if (lovlige.length) return { n, p: velg(rand, lovlige) };
  const n100 = Math.ceil(n / 100) * 100;
  return { n: n100, p: velg(rand, gårOpp(n100, satser)) };
}

export default {
  id: 'prosent',
  navn: 'Prosent',
  eksempel: 'Hva er 15 % av 240?',
  svarform: 'tall',

  lett(rand) {
    const { n, p } = satsFor(rand, grunntall(rand, 1, 10), SATSER.lett);
    return { sporsmal: `Hva er ${p} % av ${n}?`, fasit: br((n * p) / 100) };
  },

  middels(rand) {
    const { n, p } = satsFor(rand, grunntall(rand, 2, 25), SATSER.middels);
    return { sporsmal: `Hva er ${p} % av ${n}?`, fasit: br((n * p) / 100) };
  },

  vanskelig(rand) {
    const form = heltall(rand, 0, 2);
    const { n, p } = satsFor(rand, grunntall(rand, 4, 40), SATSER.vanskelig);

    if (form === 0) {
      return { sporsmal: `Hvor mange prosent er ${(n * p) / 100} av ${n}?`, fasit: br(p) };
    }
    if (form === 1) {
      return {
        sporsmal: `En vare koster ${n} kr. Prisen settes ned ${p} %. Hva er den nye prisen i kroner?`,
        fasit: br(n - (n * p) / 100)
      };
    }
    return {
      sporsmal: `Et beløp på ${n} kr øker med ${p} %. Hvor mange kroner blir det da?`,
      fasit: br(n + (n * p) / 100)
    };
  }
};
