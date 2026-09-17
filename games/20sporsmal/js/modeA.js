/* =========================================================
   MODUS A — "Spillet gjetter"
   Ren tilstandsmaskin, ingen DOM. UI-et (ui.js) leser feltene på
   sessionen og kaller funksjonene under som svar på klikk.
   ========================================================= */
import * as Engine from './engine.js';

export function createModeA(concepts, questions, options = {}) {
  const session = {
    engineState: Engine.createGameState(concepts, questions),
    options: { ...Engine.DEFAULT_OPTIONS, ...options },
    phase: 'asking', // 'asking' | 'guessing' | 'correct' | 'wrong-reveal'
    currentQuestion: null,
    lastGuess: null,
  };
  return advance(session);
}

function advance(session) {
  if (Engine.shouldGuess(session.engineState, session.options)) {
    session.phase = 'guessing';
    session.currentQuestion = null;
    session.lastGuess = Engine.getBestGuess(session.engineState);
    return session;
  }
  const next = Engine.selectNextQuestion(session.engineState, session.options);
  if (!next) {
    session.phase = 'guessing';
    session.currentQuestion = null;
    session.lastGuess = Engine.getBestGuess(session.engineState);
    return session;
  }
  session.phase = 'asking';
  session.currentQuestion = next.question;
  session.debugNextQuestionGain = next.gain;
  return session;
}

/** answerValue: 'yes' | 'no' | 'unknown' */
export function answerCurrentQuestion(session, answerValue) {
  if (session.phase !== 'asking' || !session.currentQuestion) {
    throw new Error('Ingen aktivt spørsmål å svare på.');
  }
  session.engineState = Engine.answerQuestion(session.engineState, session.currentQuestion.id, answerValue);
  return advance(session);
}

/** Eleven bekrefter om gjetningen var riktig eller ikke. */
export function confirmGuess(session, wasCorrect) {
  session.phase = wasCorrect ? 'correct' : 'wrong-reveal';
  return session;
}

/** "Slik fant jeg det ut" — de mest utslagsgivende svarene. */
export function getEvidenceForWin(session, limit = 5) {
  return Engine.getKeyEvidence(session.engineState, session.lastGuess.concept.id, limit);
}

/** Sammenligner elevens svar med fasiten når spillet gjettet feil. */
export function compareToActualConcept(session, actualConceptId) {
  return Engine.compareAnswersToConcept(session.engineState, actualConceptId);
}

export function questionsAskedCount(session) {
  return session.engineState.askedQuestionIds.length;
}

/** Rangert kandidatliste for debug-visning. */
export function debugRanking(session) {
  return Engine.rankCandidates(session.engineState);
}

/**
 * Id-ene til begrepene spillet har krysset ut som usannsynlige så langt
 * (utenfor "i live"-margin). Brukes til å synlig stryke dem i
 * begrepslisten eleven ser — ikke bare i debug-panelet.
 */
export function eliminatedConceptIds(session) {
  const aliveIds = new Set(
    Engine.getAliveCandidates(session.engineState, session.options.margin).map((r) => r.concept.id)
  );
  return session.engineState.concepts.filter((c) => !aliveIds.has(c.id)).map((c) => c.id);
}
