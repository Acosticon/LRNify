/* =========================================================
   FRAMGANG OG OPPLÅSING
   Lagres lokalt (localStorage). Kun tall og vogn-id-er, ingen
   persondata. Feiler lagringen (privat nettlesermodus), kjører
   spillet videre uten å lagre.

   Oppdragene er sekvensielle: ett aktivt om gangen, og alle
   tellere måles fra forrige opplåsing (`since`). Da kan man
   aldri løse to oppdrag på én gang.

   Oppdraget bestemmer NÅR du får en pakke. Hva som ligger i
   den avgjøres først når pakka åpnes, av en vektet trekning
   blant vognene du ikke har fra før.
   ========================================================= */

import { MISSIONS, START_CARRIAGE, CARRIAGES, drawCarriage } from './carriages.js';

/* Nøkkelen er bumpet for hver gang vognutvalget eller
   opplåsingsmodellen er lagt om. v3: vognene fikk nye id-er da
   utvalget ble tegnet på nytt, så gamle lagringer pekte på
   vogner som ikke finnes lenger. Eldre data blir liggende ubrukt. */
const KEY = 'ordtoget-progress-v3';

const emptySince = () => ({
  rounds: 0,          // runder spilt siden forrige opplåsing
  score: 0,           // poeng samlet siden forrige opplåsing
  bestWords: 0,       // lengste tog siden forrige opplåsing
  longestWordLen: 0,  // lengste ord siden forrige opplåsing
  bestRoundScore: 0   // beste enkeltrunde siden forrige opplåsing
});

const emptyData = () => ({
  v: 3,
  totalScore: 0,
  rounds: 0,
  bestPerMode: {},
  unlocked: [START_CARRIAGE.id],
  missionIndex: 0,
  pendingCrate: false,
  since: emptySince()
});

export class Progress {
  constructor(){
    this.data = this._read();
  }

  _read(){
    const base = emptyData();
    try {
      const raw = localStorage.getItem(KEY);
      if(!raw) return base;
      const p = JSON.parse(raw);
      const unlocked = Array.from(new Set([START_CARRIAGE.id, ...(p.unlocked || [])]));
      return {
        ...base,
        ...p,
        bestPerMode: { ...(p.bestPerMode || {}) },
        unlocked,
        // Oppdragsnummeret skal alltid følge antall vunne vogner.
        missionIndex: Math.min(MISSIONS.length, unlocked.length - 1),
        pendingCrate: !!p.pendingCrate,
        since: { ...emptySince(), ...(p.since || {}) }
      };
    } catch(e){
      return base;
    }
  }

  save(){
    try { localStorage.setItem(KEY, JSON.stringify(this.data)); }
    catch(e){ /* privat modus – kjør videre uten lagring */ }
  }

  get unlockedSet(){ return new Set(this.data.unlocked); }

  isUnlocked(id){
    return id === 'loco' || id === 'gold' || this.data.unlocked.includes(id);
  }

  bestFor(modeId){
    return this.data.bestPerMode[modeId] || { score: 0, words: 0 };
  }

  /** Vogner som ennå ikke er vunnet. */
  lockedCount(){
    return CARRIAGES.filter(c => !this.data.unlocked.includes(c.id)).length;
  }

  /** Oppdraget som er aktivt nå, eller null. */
  currentMission(){
    if(this.data.pendingCrate) return null;      // pakka må åpnes først
    if(this.lockedCount() === 0) return null;    // alt er vunnet
    return MISSIONS[this.data.missionIndex] || null;
  }

  /** Hvor langt spilleren er kommet i det aktive oppdraget. */
  missionProgress(){
    const m = this.currentMission();
    if(!m) return null;
    const s = this.data.since;
    const value = {
      rounds: s.rounds,
      totalScore: s.score,
      words: s.bestWords,
      longWord: s.longestWordLen,
      roundScore: s.bestRoundScore
    }[m.type] || 0;
    return {
      mission: m,
      value: Math.min(value, m.n),
      goal: m.n,
      pct: Math.min(100, (value / m.n) * 100),
      done: value >= m.n
    };
  }

  /**
   * Sjekker om det aktive oppdraget er fullført. Vogna trekkes
   * ikke her – pakka legges bare klar til åpning.
   * @returns {boolean} true hvis oppdraget nettopp ble løst
   */
  _checkMission(){
    const p = this.missionProgress();
    if(!p || !p.done) return false;
    this.data.pendingCrate = true;
    this.save();
    return true;
  }

  hasPendingCrate(){ return !!this.data.pendingCrate; }

  /**
   * Åpner pakka: trekker en vogn, låser den opp, går videre til
   * neste oppdrag og nullstiller tellerne.
   * @param {function} [rand] injiserbar tilfeldighet (for testing)
   * @returns {object|null} vogna som ble vunnet
   */
  openCrate(rand){
    if(!this.data.pendingCrate) return null;
    const won = drawCarriage(this.unlockedSet, rand);
    this.data.pendingCrate = false;
    if(!won){ this.save(); return null; }

    this.data.unlocked.push(won.id);
    this.data.missionIndex = Math.min(MISSIONS.length, this.data.missionIndex + 1);
    this.data.since = emptySince();
    this.save();
    return won;
  }

  /** Kalles underveis i runden. */
  noteDuringRound({ wordLen, words }){
    const s = this.data.since;
    let changed = false;
    if(wordLen && wordLen > s.longestWordLen){ s.longestWordLen = wordLen; changed = true; }
    if(words && words > s.bestWords){ s.bestWords = words; changed = true; }
    if(!changed) return false;
    this.save();
    return this._checkMission();
  }

  /** Kalles når runden er ferdig. */
  finishRound({ modeId, score, words }){
    const d = this.data, s = d.since;
    d.rounds++;
    d.totalScore += score;
    s.rounds++;
    s.score += score;
    if(score > s.bestRoundScore) s.bestRoundScore = score;
    if(words > s.bestWords) s.bestWords = words;

    const prev = d.bestPerMode[modeId] || { score: 0, words: 0 };
    const isNewBest = score > prev.score;
    d.bestPerMode[modeId] = {
      score: Math.max(prev.score, score),
      words: Math.max(prev.words, words)
    };

    this.save();
    return { isNewBest, missionDone: this._checkMission() };
  }

  reset(){
    this.data = emptyData();
    this.save();
  }
}
