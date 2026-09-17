/* =========================================================
   MODUS B — "Eleven gjetter"
   Spillet velger et hemmelig begrep. Eleven velger spørsmål fra en
   dynamisk, informativ liste i stedet for å skrive fritekst.
   Ren tilstandsmaskin, ingen DOM.
   ========================================================= */
import * as Engine from './engine.js';

export function createModeB(concepts, questions, options = {}) {
  const secret = concepts[Math.floor(Math.random() * concepts.length)];
  return {
    secret,
    engineState: Engine.createGameState(concepts, questions),
    options: { ...Engine.DEFAULT_OPTIONS, ...options },
    suggestCount: options.suggestCount ?? 7,
    history: [], // { question, answer, before, after }
  };
}

/** De mest informative spørsmålene eleven kan velge mellom akkurat nå. */
export function suggestedQuestions(session) {
  return Engine.getTopQuestions(session.engineState, session.suggestCount, session.options);
}

/**
 * Eleven stiller et spørsmål. Motoren slår opp fasitsvaret på det
 * hemmelige begrepet og oppdaterer kandidatlisten.
 * Returnerer svaret og hvor mye spørsmålet reduserte kandidatfeltet.
 */
export function askQuestion(session, questionId) {
  const question = session.engineState.questions.find((q) => q.id === questionId);
  if (!question) throw new Error(`Ukjent spørsmål: ${questionId}`);

  const value = Engine.normalizeProp(session.secret.properties[question.property]);
  const answer = value === true ? 'yes' : value === false ? 'no' : 'not_relevant';

  const before = Engine.getConsistentCandidates(session.engineState).length;
  session.engineState = Engine.answerQuestion(session.engineState, questionId, answer);
  const after = Engine.getConsistentCandidates(session.engineState).length;

  const entry = { question, answer, before, after };
  session.history.push(entry);
  return entry;
}

export function remainingCandidates(session) {
  return Engine.getConsistentCandidates(session.engineState);
}

export function questionsAskedCount(session) {
  return session.engineState.askedQuestionIds.length;
}

/** true hvis eleven traff riktig hemmelig begrep. */
export function guess(session, conceptId) {
  return conceptId === session.secret.id;
}
