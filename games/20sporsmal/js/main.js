/* Oppstart: laster gjeldende tema fra manifestet og starter UI-et.
   MVP har bare ett tema (Naturfag → Celler), så vi velger det første
   uten et eget temavalg-skjermbilde ennå — se README.md for hvordan
   flere tema/fag registreres i content-manifest.js. */
import { MANIFEST } from '../content-manifest.js';
import * as UI from './ui.js';

async function boot() {
  const subject = MANIFEST[0];
  const topic = subject.topics[0];
  const content = await topic.load();
  UI.init(content);
}

boot();
