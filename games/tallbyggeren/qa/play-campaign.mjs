/* =========================================================
   GJENNOMSPILLING AV HELE KAMPANJEN
   Spiller alle 60 oppgavene gjennom den samme tilstandsmodellen
   som spillflaten bruker, med løsninger hentet fra solveren.
   Fanger opp feil som QA-sjekken ikke ser: at en løsning ikke lar
   seg legge inn, at låste plasser sperrer, at oppgaver som krever
   flere løsninger ikke kan fullføres, eller at «umulig» ikke
   godtas der den skal.

     node games/tallbyggeren/qa/play-campaign.mjs
   ========================================================= */

import { CAMPAIGN } from '../js/challenges.js';
import * as Game from '../js/game.js';
import { solveChallenge, arrangeForChallenge } from '../js/solver.js';
import { formatDataset } from '../js/stats.js';

const session = Game.createSession(CAMPAIGN);
let failures = 0;

for (let i = 0; i < CAMPAIGN.length; i++) {
  const challenge = Game.currentChallenge(session);
  const id = challenge.id;

  if (challenge.impossible) {
    const claim = Game.claimImpossible(session);
    if (!claim.correct || !Game.isTaskComplete(session)) {
      console.log(`  FEIL   ${id}: umulig-svaret ble ikke godtatt`);
      failures++;
    }
  } else {
    const needed = challenge.requiredSolutions;
    const found = solveChallenge(challenge, { maxSolutions: needed }).solutions;
    if (found.length < needed) {
      console.log(`  FEIL   ${id}: solveren fant bare ${found.length} av ${needed} løsninger`);
      failures++;
    }

    for (const solution of found) {
      const arranged = arrangeForChallenge(solution, challenge);
      for (let position = 0; position < arranged.length; position++) {
        Game.setValue(session, position, arranged[position]);
      }
      if (!Game.validation(session).solved) {
        console.log(`  FEIL   ${id}: klarte ikke å legge inn løsningen ${formatDataset(arranged)} — endte på ${formatDataset(session.dataset)}`);
        failures++;
        break;
      }
    }

    if (!Game.isTaskComplete(session)) {
      console.log(`  FEIL   ${id}: oppgaven ble ikke fullført (${session.solutions.length} av ${needed} løsninger registrert)`);
      failures++;
    }
    /* Hintene skal kunne hentes ut uten å knekke på et tomt felt. */
    while (Game.hintsLeft(session) > 0) {
      const hint = Game.nextHint(session);
      if (!hint || hint.includes('{')) {
        console.log(`  FEIL   ${id}: hint ble ikke fylt ut: ${hint}`);
        failures++;
      }
    }
  }

  Game.commitResult(session);
  if (Game.hasNext(session)) Game.goNext(session);
}

const summary = Game.summary(session);
console.log(`\nSpilte ${summary.total} oppgaver · ${summary.solved} fullført · ${failures} feil`);
if (summary.solved !== summary.total) failures++;
process.exit(failures ? 1 : 0);
