/* =========================================================
   FRAMGANG OG OPPLÅSING
   Lagres lokalt (localStorage). Kun tall og vogn-id-er, ingen
   persondata. Feiler lagringen (privat nettlesermodus), kjører
   spillet videre uten å lagre.

   Opplåsingen er sekvensiell: kun ett oppdrag er aktivt om
   gangen, og alle tellere måles fra forrige opplåsing (`since`).
   Da kan man aldri låse opp to vogner på én gang.

   Når et oppdrag fullføres blir vogna ikke gitt med én gang –
   den legges som en uåpnet pakke (`pendingCrate`) som spilleren
   må inn i vognskjulet for å pakke opp.
   ========================================================= */

import { MISSIONS, START_CARRIAGE } from './carriages.js';

const KEY = 'ordtoget-progress-v1';

const emptySince = () => ({
  rounds: 0,          // runder spilt siden forrige opplåsing
  score: 0,           // poeng samlet siden forrige opplåsing
  bestWords: 0,       // lengste tog siden forrige opplåsing
  longestWordLen: 0,  // lengste ord siden forrige opplåsing
  bestRoundScore: 0   // beste enkeltrunde siden forrige opplåsing
});

const emptyData = () => ({
  v: 2,
  totalScore: 0,
  rounds: 0,
  bestPerMode: {},
  unlocked: [START_CARRIAGE.id],
  pendingCrate: null,
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
      return {
        ...base,
        ...p,
        bestPerMode: { ...(p.bestPerMode || {}) },
        // Startvogna skal alltid være med, også for spillere som
        // lagret framgang før opplåsingen ble lagt om.
        unlocked: Array.from(new Set([START_CARRIAGE.id, ...(p.unlocked || [])])),
        pendingCrate: p.pendingCrate || null,
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

  /** Oppdraget som er aktivt nå, eller null når alt er låst opp. */
  currentMission(){
    if(this.data.pendingCrate) return null;      // pakka må åpnes først
    return MISSIONS.find(m => !this.data.unlocked.includes(m.id)) || null;
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
    }[m.mission.type] || 0;
    return {
      carriage: m,
      value: Math.min(value, m.mission.n),
      goal: m.mission.n,
      pct: Math.min(100, (value / m.mission.n) * 100),
      done: value >= m.mission.n
    };
  }

  /**
   * Sjekker om det aktive oppdraget er fullført. Vogna gis ikke
   * med én gang – den blir liggende som en uåpnet pakke.
   * @returns {object|null} vogna som venter, hvis oppdraget nettopp ble løst
   */
  _checkMission(){
    const p = this.missionProgress();
    if(!p || !p.done) return null;
    this.data.pendingCrate = p.carriage.id;
    this.save();
    return p.carriage;
  }

  /** Uåpnet pakke, hvis det finnes en. */
  pending(){
    if(!this.data.pendingCrate) return null;
    return MISSIONS.find(m => m.id === this.data.pendingCrate) || null;
  }

  /**
   * Pakker opp pakka: vogna låses opp og tellerne nullstilles,
   * slik at neste oppdrag måles fra dette punktet.
   * @returns {object|null} vogna som ble låst opp
   */
  openCrate(){
    const c = this.pending();
    if(!c) return null;
    if(!this.data.unlocked.includes(c.id)) this.data.unlocked.push(c.id);
    this.data.pendingCrate = null;
    this.data.since = emptySince();
    this.save();
    return c;
  }

  /** Kalles underveis i runden. */
  noteDuringRound({ wordLen, words }){
    const s = this.data.since;
    let changed = false;
    if(wordLen && wordLen > s.longestWordLen){ s.longestWordLen = wordLen; changed = true; }
    if(words && words > s.bestWords){ s.bestWords = words; changed = true; }
    if(!changed) return null;
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
    return { isNewBest, unlockedNow: this._checkMission() };
  }

  reset(){
    this.data = emptyData();
    this.save();
  }
}
