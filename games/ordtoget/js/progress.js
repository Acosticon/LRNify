/* =========================================================
   FRAMGANG — lagres lokalt i nettleseren (localStorage).
   Kun tall og vogn-id-er, ingen persondata. Feiler lagringen
   (privat nettlesermodus), kjører spillet videre uten å lagre.
   ========================================================= */

import { CARRIAGES } from './carriages.js';

/* Vogntypene som er åpne fra start, så toget har farge med én gang. */
const DEFAULT_UNLOCKED = CARRIAGES.filter(c => !c.unlock).map(c => c.id);

const KEY = 'ordtoget-progress-v1';

const EMPTY = {
  v: 1,
  totalScore: 0,
  rounds: 0,
  goldenHits: 0,
  longestWordLen: 0,
  longestWord: '',
  bestCombo: 1,
  bestWords: 0,
  bestScore: 0,
  bestPerMode: {},
  unlocked: DEFAULT_UNLOCKED.slice()
};

export class Progress {
  constructor(){
    this.data = this._read();
  }

  _read(){
    try {
      const raw = localStorage.getItem(KEY);
      if(!raw) return { ...EMPTY, bestPerMode: {}, unlocked: DEFAULT_UNLOCKED.slice() };
      const parsed = JSON.parse(raw);
      // Slå sammen med EMPTY så nye felter ikke mangler etter oppdatering,
      // og sørg for at typer som senere er gjort gratis også er med for
      // spillere som lagret framgang før endringen.
      const saved = Array.isArray(parsed.unlocked) ? parsed.unlocked : [];
      const unlocked = Array.from(new Set([...DEFAULT_UNLOCKED, ...saved]));
      return {
        ...EMPTY,
        ...parsed,
        bestPerMode: { ...(parsed.bestPerMode || {}) },
        unlocked
      };
    } catch(e){
      return { ...EMPTY, bestPerMode: {}, unlocked: DEFAULT_UNLOCKED.slice() };
    }
  }

  save(){
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); }
    catch(e){ /* privat modus – kjør videre uten lagring */ }
  }

  get unlockedSet(){ return new Set(this.data.unlocked); }

  /** Lokomotivet og gullvogna hører ikke til opplåsingen. */
  isUnlocked(id){
    return id === 'loco' || id === 'gold' || this.data.unlocked.includes(id);
  }

  bestFor(modeId){
    return this.data.bestPerMode[modeId] || { score: 0, words: 0 };
  }

  /**
   * Sjekker alle låser mot gjeldende statistikk.
   * @returns {Array} vogner som ble låst opp akkurat nå
   */
  checkUnlocks(){
    const newly = [];
    for(const c of CARRIAGES){
      if(!c.unlock || this.data.unlocked.includes(c.id)) continue;
      const value = this.data[c.unlock.stat] || 0;
      if(value >= c.unlock.n){
        this.data.unlocked.push(c.id);
        newly.push(c);
      }
    }
    if(newly.length) this.save();
    return newly;
  }

  /** Kalles underveis i runden, så opplåsing skjer med én gang. */
  noteDuringRound({ combo, wordLen, golden, words }){
    let changed = false;
    if(combo && combo > this.data.bestCombo){ this.data.bestCombo = combo; changed = true; }
    if(wordLen && wordLen > this.data.longestWordLen){ this.data.longestWordLen = wordLen; changed = true; }
    if(golden){ this.data.goldenHits++; changed = true; }
    if(words && words > this.data.bestWords){ this.data.bestWords = words; changed = true; }
    if(changed) this.save();
    return this.checkUnlocks();
  }

  /** Kalles når runden er ferdig. */
  finishRound({ modeId, score, words, bestCombo, longest }){
    const d = this.data;
    d.rounds++;
    d.totalScore += score;
    if(score > d.bestScore) d.bestScore = score;
    if(words > d.bestWords) d.bestWords = words;
    if(bestCombo > d.bestCombo) d.bestCombo = bestCombo;
    if(longest && longest.length > d.longestWordLen){
      d.longestWordLen = longest.length;
      d.longestWord = longest;
    }

    const prev = d.bestPerMode[modeId] || { score: 0, words: 0 };
    const isNewBest = score > prev.score;
    d.bestPerMode[modeId] = {
      score: Math.max(prev.score, score),
      words: Math.max(prev.words, words)
    };

    this.save();
    return { isNewBest, newlyUnlocked: this.checkUnlocks() };
  }

  reset(){
    this.data = { ...EMPTY, bestPerMode: {}, unlocked: DEFAULT_UNLOCKED.slice() };
    this.save();
  }
}
