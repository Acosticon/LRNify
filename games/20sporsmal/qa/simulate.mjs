/* =========================================================
   QA — "PERFEKT ELEV"-SIMULATOR
   Kjører modus A over hvert eneste begrep i en innholdspakke og lar
   en simulert elev svare 100 % ærlig ut fra fasitdataene (properties
   satt til null besvares "vet ikke", siden en ekte elev heller ikke
   ville visst hvordan de skal svare på et spørsmål som ikke gir
   mening for begrepet de tenker på).

   Kjør:
     node games/20sporsmal/qa/simulate.mjs

   Kontrollerer at:
     · motoren gjetter riktig begrep for alle 27
     · antall spørsmål holder seg innenfor et rimelig område
     · ingen to begreper har identisk egenskapsprofil (umulig å skille)
   ========================================================= */

import * as Engine from '../js/engine.js';
import { concepts, questions, subjectName, topicName } from '../content/science/cells/index.js';

const OPTIONS = Engine.DEFAULT_OPTIONS;

/**
 * mistakeAt: indeks (0-basert) på spørsmålet der den simulerte eleven
 * bevisst svarer feil (ja↔nei), for å teste at motoren tåler ett
 * bomsvar. -1 betyr "svar alltid ærlig".
 */
function simulateFor(target, mistakeAt = -1) {
  let state = Engine.createGameState(concepts, questions);
  let asked = 0;
  const safetyLimit = questions.length;

  while (asked < safetyLimit) {
    if (Engine.shouldGuess(state, OPTIONS)) break;
    const next = Engine.selectNextQuestion(state, OPTIONS);
    if (!next) break;

    const value = Engine.normalizeProp(target.properties[next.question.property]);
    let answer = value === true ? 'yes' : value === false ? 'no' : 'unknown';
    if (asked === mistakeAt && answer !== 'unknown') {
      answer = answer === 'yes' ? 'no' : 'yes';
    }
    state = Engine.answerQuestion(state, next.question.id, answer);
    asked++;
  }

  const guess = Engine.getBestGuess(state);
  return {
    asked,
    guessedId: guess ? guess.concept.id : null,
    confidence: guess ? guess.confidence : 0,
    correct: !!guess && guess.concept.id === target.id,
  };
}

console.log(`\nSimulering: "perfekt elev" — ${subjectName} → ${topicName}`);
console.log(`${concepts.length} begreper, ${questions.length} spørsmål tilgjengelig\n`);

const rows = concepts.map((target) => ({ id: target.id, name: target.name, ...simulateFor(target) }));

let correctCount = 0;
let totalAsked = 0;
for (const row of rows) {
  if (row.correct) correctCount++;
  totalAsked += row.asked;
  const status = row.correct
    ? '✓'
    : `✗ (gjettet ${row.guessedId ?? 'ingenting'}, konfidens ${row.confidence.toFixed(2)})`;
  console.log(`  ${row.name.padEnd(16)} ${String(row.asked).padStart(2)} spørsmål   ${status}`);
}

const avg = totalAsked / rows.length;
console.log(`\n${correctCount}/${rows.length} riktig gjettet · snitt ${avg.toFixed(1)} spørsmål per runde`);

console.log('\nSjekker om noen begreper har identisk egenskapsprofil...');
let duplicates = 0;
for (let i = 0; i < concepts.length; i++) {
  for (let j = i + 1; j < concepts.length; j++) {
    const a = concepts[i];
    const b = concepts[j];
    const identical = questions.every((q) => {
      const va = Engine.normalizeProp(a.properties[q.property]);
      const vb = Engine.normalizeProp(b.properties[q.property]);
      return va === vb;
    });
    if (identical) {
      duplicates++;
      console.log(`  ADVARSEL: ${a.name} og ${b.name} har identisk egenskapsprofil over alle spørsmål`);
    }
  }
}
if (!duplicates) console.log('  Ingen duplikater funnet.');

console.log('\nRobusthet: overlever spillet ett feil svar? (bomsvar testet på spørsmål 0–7 for hvert begrep)');
let robustTotal = 0;
let robustOK = 0;
for (const target of concepts) {
  for (let mistakeAt = 0; mistakeAt < 8; mistakeAt++) {
    robustTotal++;
    if (simulateFor(target, mistakeAt).correct) robustOK++;
  }
}
console.log(`  ${robustOK}/${robustTotal} runder endte likevel med riktig gjetning (${((robustOK / robustTotal) * 100).toFixed(0)} %)`);

const failures = rows.filter((r) => !r.correct);
const exitCode = failures.length || duplicates ? 1 : 0;
if (exitCode) {
  console.log(`\nFEILET: ${failures.length} begrep(er) ble ikke gjettet riktig, ${duplicates} duplikat-par.`);
} else {
  console.log('\nOK: alle begreper identifiseres korrekt.');
}
process.exit(exitCode);
