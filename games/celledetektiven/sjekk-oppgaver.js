// Kjør: node games/celledetektiven/sjekk-oppgaver.js
// Feiler hvis en vanlig oppgave ikke har nøyaktig én løsning.
const Motor = require('./motor.js');
const { OPPGAVER } = require('./oppgaver.js');

let feil = 0;
for (const o of OPPGAVER) {
  const antall = Motor.finnLosninger(o).length;
  const trinnvis = Motor.losTrinnvis(o);
  // Vanlige oppgaver skal ha én løsning og kunne løses uten gjetting.
  const ok = o.kravUnikLosning ? antall === 1 && trinnvis.lost : antall >= 1;
  if (!ok) feil++;
  console.log(`${ok ? 'OK  ' : 'FEIL'} ${o.id}: ${antall} løsning(er)${o.kravUnikLosning ? ' (krever nøyaktig 1)' : ''}, ` +
    (!o.kravUnikLosning ? 'flere løsninger er lov' : trinnvis.lost ? `løses uten gjetting på ${trinnvis.runder} runder` : 'kan ikke løses uten gjetting'));
}
process.exit(feil ? 1 : 0);
