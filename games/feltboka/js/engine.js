/* =========================================================
   OPPGAVEMOTOREN (GDD pkt. 14 og 23)
   Én oppgave om gangen, generert i det den skal vises. Ingen
   genererte oppgaver lagres noe sted.

   Motoren kjenner ingen temaer ved navn — den slår dem opp i
   registeret. Feil svar er ikke en tilstand her: motoren svarer
   bare på «er dette riktig», og hvem som helst kan spørre så mange
   ganger de vil (GDD pkt. 17).
   ========================================================= */

import { tema, NIVAER } from './topics/index.js';
import { sammenlign, tekst } from './rational.js';

const NIVA_IDER = new Set(NIVAER.map(n => n.id));

/**
 * Lager én oppgave.
 * @param {string} temaId   f.eks. 'likninger'
 * @param {string} nivaId   'lett' | 'middels' | 'vanskelig'
 * @param {function} [rand] injiserbar tilfeldighet (QA bruker fast frø)
 */
export function lagOppgave(temaId, nivaId, rand = Math.random) {
  const t = tema(temaId);
  if (!t) throw new Error(`Ukjent tema: ${temaId}`);
  if (!NIVA_IDER.has(nivaId)) throw new Error(`Ukjent nivå: ${nivaId}`);

  const { sporsmal, fasit } = t[nivaId](rand);
  return {
    tema: t.id,
    niva: nivaId,
    sporsmal,
    fasit,
    svarform: t.svarform,
    // Hvilket tastatur mobilen skal åpne. Temaer som trenger «/» eller
    // «-» ber om fullt tastatur; resten får talltastaturet, som er det
    // mengdetreningen faktisk lever av.
    tastatur: t.tastatur || 'tall',
    fasitTekst: tekst(fasit)
  };
}

/**
 * Retter et svar.
 * @returns {{riktig:boolean, tomt:boolean, tolket:object|null}}
 */
export function sjekkSvar(oppgave, svarTekst) {
  return sammenlign(oppgave.fasit, String(svarTekst ?? ''));
}

/** Hjelpetekst under svarfeltet. Ren tekst, ingen formatering. */
export function svarHjelp(svarform) {
  switch (svarform) {
    case 'brok': return 'Skriv svaret som brøk, for eksempel 3/4';
    case 'x':    return 'Skriv verdien av x, for eksempel 5';
    default:     return 'Skriv svaret som tall';
  }
}
