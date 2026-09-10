/* =========================================================
   REGISTERET OVER OPPGAVETYPER (GDD pkt. 14)
   Å legge til en syvende oppgavetype er én ny fil og én linje her.
   Ingenting annet i spillet kjenner navnene på temaene.
   ========================================================= */

import regnerekkefolge from './regnerekkefolge.js';
import negativetall from './negativetall.js';
import brok from './brok.js';
import prosent from './prosent.js';
import likninger from './likninger.js';
import potenser from './potenser.js';

export const TEMAER = [regnerekkefolge, negativetall, brok, prosent, likninger, potenser];

export const NIVAER = [
  { id: 'lett',      navn: 'Lett' },
  { id: 'middels',   navn: 'Middels' },
  { id: 'vanskelig', navn: 'Vanskelig' }
];

const ETTER_ID = new Map(TEMAER.map(t => [t.id, t]));

export function tema(id) {
  return ETTER_ID.get(id) || null;
}
