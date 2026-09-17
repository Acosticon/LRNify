/* =========================================================
   QUESTION MANAGER — alt spørsmåls-ansvar samlet ett sted:
   hente spørsmål, velge distraktorer, stokke svaralternativer
   og unngå nær-repetisjon. Motoren (engine.js) vet bare at den
   kan be om et spørsmål og få et svar validert — den bryr seg
   ikke om hvordan.
   ========================================================= */

import { RECENT_QUESTION_HISTORY } from '../config/gameConfig.js';
import { shuffle, pickFrom } from '../game/rng.js';

export class QuestionManager {
  /**
   * @param {{subject:string, topic:string, questions:Array}} questionSet
   * @param {function} rng
   */
  constructor(questionSet, rng) {
    this.subject = questionSet.subject;
    this.topic = questionSet.topic;
    this.questions = questionSet.questions;
    this.rng = rng;
    this.recentWords = [];
    this._nextQuestionId = 1;
  }

  _markRecent(word) {
    this.recentWords.push(word);
    const maxHistory = Math.min(RECENT_QUESTION_HISTORY, this.questions.length - 1);
    while (this.recentWords.length > Math.max(maxHistory, 0)) this.recentWords.shift();
  }

  /** Velger neste spørsmål, og unngår de sist stilte når settet er stort nok til det. */
  _chooseQuestionEntry() {
    const avoid = new Set(this.recentWords);
    let candidates = this.questions.filter(q => !avoid.has(q.word));
    if (candidates.length === 0) candidates = this.questions;
    return pickFrom(this.rng, candidates);
  }

  _buildDistractors(entry) {
    if (Array.isArray(entry.distractors) && entry.distractors.length >= 3) {
      return shuffle(this.rng, entry.distractors).slice(0, 3);
    }
    const pool = this.questions.filter(q => q.word !== entry.word);
    const shuffled = shuffle(this.rng, pool);
    return shuffled.slice(0, 3).map(q => q.word);
  }

  /** Bygger et ferdig spørsmål med fire alternativer. */
  createQuestion() {
    const entry = this._chooseQuestionEntry();
    this._markRecent(entry.word);

    const distractors = this._buildDistractors(entry);
    const options = shuffle(this.rng, [entry.word, ...distractors]);
    const correctIndex = options.indexOf(entry.word);

    return {
      id: 'q-' + (this._nextQuestionId++),
      subject: this.subject,
      topic: this.topic,
      word: entry.word,
      definition: entry.definition,
      options,
      correctIndex,
      answered: false
    };
  }

  /** Validerer et svar. Returnerer om det var riktig + hva som var riktig svar. */
  validateAnswer(question, chosenIndex) {
    return {
      correct: chosenIndex === question.correctIndex,
      correctIndex: question.correctIndex
    };
  }
}
