/* =========================================================
   TREKNINGEN (GDD pkt. 4, 8 og 9)
   To uavhengige trekninger: først hvilken art, så hvilken variant.
   Begge er vektede, og begge normaliserer vektene selv. Det betyr
   at tallene i `species.js` og `variants.js` kan endres fritt uten
   at de må summere til noe bestemt.
   ========================================================= */

import { ARTER } from './data/species.js';
import { varianterFor } from './data/variants.js';

/** Vektet trekning fra en liste. `vektAv` henter vekten ut av hvert element. */
export function vektetTrekk(liste, vektAv, rand = Math.random) {
  const sum = liste.reduce((s, e) => s + vektAv(e), 0);
  if (sum <= 0) return liste[0] ?? null;
  let terskel = rand() * sum;
  for (const e of liste) {
    terskel -= vektAv(e);
    if (terskel < 0) return e;
  }
  return liste[liste.length - 1];
}

export function trekkArt(rand = Math.random) {
  return vektetTrekk(ARTER, a => a.vekt, rand);
}

export function trekkVariant(art, rand = Math.random) {
  return vektetTrekk(varianterFor(art), v => v.andel, rand);
}

/** Ett komplett funn: art + variant. */
export function trekkFunn(rand = Math.random) {
  const art = trekkArt(rand);
  const variant = trekkVariant(art, rand);
  return { artId: art.id, variantId: variant.id };
}
