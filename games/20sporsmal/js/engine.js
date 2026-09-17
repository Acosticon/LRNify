/* =========================================================
   SPILLMOTOR — "20 spørsmål"
   Denne fila vet ingenting om celler, naturfag eller noe annet
   fagstoff. Den jobber bare med generiske begreper (concepts),
   egenskaper (properties, verdi true/false/null) og spørsmål
   (questions, som hver peker på én property).

   Alt fagstoff kommer inn utenfra som data — se content/-mappen.
   Motoren skal kunne brukes uendret for ethvert nytt tema.

   Kjerneidé:
   - Hvert begrep får et løpende poeng (score): +1 for treff,
     -1 for bom, 0 (ingen endring) når egenskapen er null/ikke
     relevant for begrepet, eller når spilleren svarer "vet ikke".
   - "Konfidens" for et begrep er andelen treff av de spørsmålene
     som faktisk var relevante for akkurat det begrepet.
   - Neste spørsmål velges ut fra hvor godt det splitter de
     fortsatt sannsynlige kandidatene (entropi/information gain),
     med en straff for spørsmål der mange kandidater har null.
   ========================================================= */

export const DEFAULT_OPTIONS = {
  minQuestions: 8,
  maxQuestions: 18,
  confidenceThreshold: 0.65,
  marginThreshold: 0.08,
  margin: 3,
};

/* --- grunnleggende verdi-håndtering --- */

export function normalizeProp(value) {
  return value === true || value === false ? value : null;
}

/**
 * Sammenligner en kandidats egenskapsverdi med et gitt svar.
 * Returnerer 'match', 'mismatch' eller 'skip' (ingen påvirkning).
 */
export function compare(propValue, answer) {
  const v = normalizeProp(propValue);
  if (answer === 'unknown') return 'skip';
  if (answer === 'not_relevant') return v === null ? 'match' : 'mismatch';
  if (v === null) return 'skip';
  if (answer === 'yes') return v === true ? 'match' : 'mismatch';
  if (answer === 'no') return v === false ? 'match' : 'mismatch';
  throw new Error(`Ukjent svar: ${answer}`);
}

/* --- spilltilstand --- */

export function createGameState(concepts, questions) {
  const scores = {};
  const relevantCounts = {};
  for (const c of concepts) {
    scores[c.id] = 0;
    relevantCounts[c.id] = 0;
  }
  return {
    concepts,
    questions,
    askedQuestionIds: [],
    answers: [],
    scores,
    relevantCounts,
  };
}

/**
 * Registrerer et svar på et spørsmål og returnerer en NY tilstand
 * (tilstanden muteres aldri i-place).
 * answer: 'yes' | 'no' | 'unknown' | 'not_relevant'
 */
export function answerQuestion(state, questionId, answer) {
  const question = state.questions.find((q) => q.id === questionId);
  if (!question) throw new Error(`Ukjent spørsmål: ${questionId}`);
  if (state.askedQuestionIds.includes(questionId)) {
    throw new Error(`Spørsmålet er allerede stilt: ${questionId}`);
  }

  const scores = { ...state.scores };
  const relevantCounts = { ...state.relevantCounts };

  for (const concept of state.concepts) {
    const result = compare(concept.properties[question.property], answer);
    if (result === 'match') {
      scores[concept.id] += 1;
      relevantCounts[concept.id] += 1;
    } else if (result === 'mismatch') {
      scores[concept.id] -= 1;
      relevantCounts[concept.id] += 1;
    }
  }

  return {
    ...state,
    scores,
    relevantCounts,
    askedQuestionIds: [...state.askedQuestionIds, questionId],
    answers: [...state.answers, { questionId, property: question.property, answer }],
  };
}

/* --- score, konfidens og rangering --- */

/**
 * Konfidens 0..1: andelen av de RELEVANTE spørsmålene (der
 * egenskapen ikke var null for dette begrepet) som stemte.
 * Ingen relevante spørsmål besvart ennå → nøytral 0.5.
 */
export function getConfidence(state, conceptId) {
  const n = state.relevantCounts[conceptId];
  if (!n) return 0.5;
  const score = state.scores[conceptId];
  return clamp((score + n) / (2 * n), 0, 1);
}

export function rankCandidates(state) {
  return state.concepts
    .map((concept) => ({
      concept,
      score: state.scores[concept.id],
      confidence: getConfidence(state, concept.id),
    }))
    .sort((a, b) => b.score - a.score || b.confidence - a.confidence);
}

/**
 * Kandidater som fortsatt er "i live" — innenfor en margin av
 * toppscoren. Margin 2 betyr at et begrep tåler ett bomsvar i
 * forhold til lederen før det regnes som usannsynlig.
 */
export function getAliveCandidates(state, margin = 2) {
  const ranked = rankCandidates(state);
  if (ranked.length === 0) return [];
  const top = ranked[0].score;
  return ranked.filter((r) => r.score >= top - margin);
}

/**
 * Kandidater som er 100 % konsistente med alle svar så langt
 * (ingen bomsvar). Brukes i modus B, der svarene alltid er
 * fasitsvar (aldri feil), så streng filtrering gir mening.
 */
export function getConsistentCandidates(state) {
  return state.concepts.filter((concept) =>
    state.answers.every((a) => compare(concept.properties[a.property], a.answer) !== 'mismatch')
  );
}

export function getBestGuess(state) {
  return rankCandidates(state)[0] || null;
}

/* --- spørsmålsvalg (entropi / information gain) --- */

function entropyOfSplit(yes, no) {
  const total = yes + no;
  if (total === 0) return 0;
  const p = yes / total;
  if (p === 0 || p === 1) return 0;
  return -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
}

/**
 * Hvor godt splitter dette spørsmålet kandidatpoolen?
 * Straffer spørsmål der mange kandidater har null (ikke relevant),
 * siden de i praksis ikke gir informasjon om det store flertallet.
 */
export function scoreQuestion(question, candidatePool) {
  let yes = 0;
  let no = 0;
  let nullCount = 0;
  for (const entry of candidatePool) {
    const value = normalizeProp(entry.concept.properties[question.property]);
    if (value === true) yes++;
    else if (value === false) no++;
    else nullCount++;
  }
  const total = candidatePool.length;
  const definiteFraction = total ? (yes + no) / total : 0;
  const gain = entropyOfSplit(yes, no) * definiteFraction;
  return { gain, yes, no, null: nullCount };
}

function unaskedQuestions(state) {
  const asked = new Set(state.askedQuestionIds);
  return state.questions.filter((q) => !asked.has(q.id));
}

/**
 * Velger det ubesvarte spørsmålet med høyest information gain,
 * regnet ut fra kandidater som fortsatt er sannsynlige.
 * Returnerer null hvis det ikke finnes flere spørsmål.
 */
export function selectNextQuestion(state, options = {}) {
  const margin = options.margin ?? DEFAULT_OPTIONS.margin;
  const unasked = unaskedQuestions(state);
  if (unasked.length === 0) return null;

  const alive = getAliveCandidates(state, margin);
  const pool = alive.length >= 2 ? alive : rankCandidates(state);

  let best = null;
  for (const question of unasked) {
    const result = scoreQuestion(question, pool);
    if (!best || result.gain > best.gain + 1e-9) {
      best = { question, ...result };
    }
  }
  return best;
}

/**
 * De N mest informative ubesvarte spørsmålene, gitt hvilke
 * kandidater som fortsatt er konsistente. Brukes i modus B, der
 * eleven velger spørsmål fra en liste i stedet for fritekst.
 */
export function getTopQuestions(state, n, options = {}) {
  const unasked = unaskedQuestions(state);
  const consistent = getConsistentCandidates(state).map((concept) => ({ concept }));
  const pool = consistent.length >= 2 ? consistent : state.concepts.map((concept) => ({ concept }));
  return unasked
    .map((question) => ({ question, ...scoreQuestion(question, pool) }))
    .sort((a, b) => b.gain - a.gain)
    .slice(0, n);
}

/* --- når skal spillet gjette? --- */

export function shouldGuess(state, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const asked = state.askedQuestionIds.length;

  if (asked >= opts.maxQuestions) return true;
  if (unaskedQuestions(state).length === 0) return true;
  if (asked < opts.minQuestions) return false;

  const ranked = rankCandidates(state);
  if (ranked.length <= 1) return true;

  const [top, second] = ranked;
  return (
    top.confidence >= opts.confidenceThreshold &&
    top.confidence - second.confidence >= opts.marginThreshold
  );
}

/* --- pedagogisk etterspill --- */

/**
 * De besvarte spørsmålene som bidro mest til å skille vinneren
 * fra resten av kandidatene — brukt til "Slik fant jeg det ut".
 */
export function getKeyEvidence(state, winnerId, limit = 5) {
  const others = state.concepts.filter((c) => c.id !== winnerId);
  const evidence = state.answers
    .filter((a) => a.answer !== 'unknown')
    .map((a) => {
      let impact = 0;
      for (const concept of others) {
        if (compare(concept.properties[a.property], a.answer) === 'mismatch') impact++;
      }
      const question = state.questions.find((q) => q.id === a.questionId);
      return { question, answer: a.answer, impact, ratio: others.length ? impact / others.length : 0 };
    });
  return evidence.sort((a, b) => b.impact - a.impact).slice(0, limit);
}

/**
 * Sammenligner spillerens svar med fasiten for det RIKTIGE begrepet
 * etter en feilgjetning. Returnerer spørsmålene der spilleren (bevisst
 * eller ubevisst) svarte noe som ikke stemmer med fasiten.
 */
export function compareAnswersToConcept(state, actualConceptId) {
  const actual = state.concepts.find((c) => c.id === actualConceptId);
  const diffs = [];
  for (const a of state.answers) {
    if (a.answer === 'unknown') continue;
    const actualValue = normalizeProp(actual.properties[a.property]);
    if (actualValue === null) continue;
    if (compare(actualValue, a.answer) === 'mismatch') {
      const question = state.questions.find((q) => q.id === a.questionId);
      diffs.push({ question, studentAnswer: a.answer, actualValue });
    }
  }
  return diffs;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
