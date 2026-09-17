/* =========================================================
   RNG — liten, deterministisk tilfeldighetskilde.
   Spill-logikken tar alltid inn en rng-funksjon (istedenfor å
   kalle Math.random direkte), slik at brett og brikker kan
   testes deterministisk med et fast frø.
   ========================================================= */

/** Mulberry32 — rask, liten, god nok for et spill (ikke kryptografi). */
export function createRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard rng basert på Math.random, brukt i selve spillet. */
export function defaultRng() {
  return Math.random();
}

export function pickIndex(rng, length) {
  return Math.floor(rng() * length);
}

export function pickFrom(rng, array) {
  return array[pickIndex(rng, array.length)];
}

/** Vektet trekning. `items` er objekter med et `weight`-felt. */
export function pickWeighted(rng, items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

/** Fisher–Yates shuffle. Returnerer en ny array, muterer ikke input. */
export function shuffle(rng, array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
