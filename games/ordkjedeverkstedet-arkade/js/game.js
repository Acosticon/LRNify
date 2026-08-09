/* =========================================================
   SPILLOGIKK — regler, poeng, kombo, nivåer, kraftbonuser.
   Kjenner ingenting til DOM; sender ut hendelser som
   main.js oversetter til lyd, effekter og UI.
   ========================================================= */

import { norm, lastLetter } from './dictionary.js';

export const MODES = {
  klassisk: {
    id: 'klassisk', name: 'Klassisk', icon: '🔨',
    desc: '20 sekunder på klokka. Hvert ord gir tid tilbake.',
    startTime: 20, maxTime: 20,
    drainBase: 1, drainPerLevel: 0.12, drainMax: 2.2,
    lives: 0,
    timeBonus: (len) => 4 + Math.min(3, Math.floor((len - 3) / 2))
  },
  blitz: {
    id: 'blitz', name: 'Blitz', icon: '⚡',
    desc: '12 sekunder og stigende tempo. Kun for de kjappe.',
    startTime: 12, maxTime: 12,
    drainBase: 1.35, drainPerLevel: 0.2, drainMax: 3.2,
    lives: 0,
    timeBonus: (len) => 3 + Math.min(2, Math.floor((len - 4) / 2))
  },
  maraton: {
    id: 'maraton', name: 'Maraton', icon: '🏔️',
    desc: 'Ingen klokke – men du har tre liv. Hvor langt når du?',
    startTime: 0, maxTime: 0,
    drainBase: 0, drainPerLevel: 0, drainMax: 0,
    lives: 3,
    timeBonus: () => 0
  }
};

const COMBO_TIERS = [3, 6, 10, 15];
const HARD_LETTERS = 'æøåyiuo';
const WORDS_PER_LEVEL = 5;
const HINTS_PER_ROUND = 3;
const HINT_COST_SEC = 3;
const GOLDEN_CHANCE = 0.16;
const FREEZE_SEC = 5;
const MAX_PER_POWER = 3;
const TICK_MS = 100;

export const POWERS = {
  freeze: { id: 'freeze', icon: '❄️', name: 'Frys',   hint: 'Fyller klokka og fryser den i 5 sekunder' },
  double: { id: 'double', icon: '⚡', name: 'Dobbel', hint: 'Neste ord gir dobbelt så mye' },
  swap:   { id: 'swap',   icon: '🔄', name: 'Bytt',   hint: 'Bytter til en lettere bokstav' }
};

const EASY_LETTERS = 'sbkfmtrgvpdhl';

export function comboMultiplier(streak){
  let m = 1;
  for(let i = 0; i < COMBO_TIERS.length; i++) if(streak >= COMBO_TIERS[i]) m = i + 2;
  return m;
}

export function comboProgress(streak){
  const mult = comboMultiplier(streak);
  if(mult >= COMBO_TIERS.length + 1) return { mult, pct: 100, maxed: true };
  const prev = mult === 1 ? 0 : COMBO_TIERS[mult - 2];
  const next = COMBO_TIERS[mult - 1];
  return { mult, pct: Math.min(100, ((streak - prev) / (next - prev)) * 100), maxed: false };
}

/** Grunnpoeng for et ord, før multiplikatorer. */
export function basePoints(word){
  let pts = 10 + Math.max(0, word.length - 3) * 4;
  if(HARD_LETTERS.indexOf(lastLetter(word)) !== -1) pts += 15;
  return pts;
}

export class Game {
  constructor(dict, emit){
    this.dict = dict;
    this.emit = emit;
    this.mode = MODES.klassisk;
    this.running = false;
    this.timer = null;
    this.checkToken = 0;
    this.busy = false;
  }

  /* ---------------- rundeflyt ---------------- */

  start(modeId){
    this.stopTimer();
    this.mode = MODES[modeId] || MODES.klassisk;
    this.checkToken++;

    this.chain = [];
    this.used = new Set();
    this.score = 0;
    this.streak = 0;
    this.bestCombo = 1;
    this.level = 1;
    this.wordsAdded = 0;
    this.lives = this.mode.lives;
    this.hintsLeft = HINTS_PER_ROUND;
    this.timeLeft = this.mode.startTime;
    this.freezeUntil = 0;
    this.goldenActive = false;
    this.doubleActive = false;
    this.powers = { freeze: 0, double: 0, swap: 0 };
    this.busy = false;
    this.lastLowBeep = 0;

    const startWord = this.dict.randomStartWord();
    this.chain.push(startWord);
    this.used.add(startWord);
    this.requiredLetter = lastLetter(startWord);

    this.running = true;
    this.emit('start', { mode: this.mode });
    if(this.hasTimer()) this.startTimer();
  }

  hasTimer(){ return this.mode.startTime > 0; }

  startTimer(){
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  stopTimer(){
    if(this.timer){ clearInterval(this.timer); this.timer = null; }
  }

  drainRate(){
    if(performance.now() < this.freezeUntil) return 0;
    return Math.min(
      this.mode.drainMax,
      this.mode.drainBase + (this.level - 1) * this.mode.drainPerLevel
    );
  }

  tick(){
    if(!this.running) return;
    this.timeLeft -= (TICK_MS / 1000) * this.drainRate();
    if(this.timeLeft <= 0){
      this.timeLeft = 0;
      this.emit('tick', { timeLeft: 0, frozen: false });
      this.end();
      return;
    }
    const frozen = performance.now() < this.freezeUntil;
    if(this.timeLeft <= 5 && !frozen){
      const sec = Math.ceil(this.timeLeft);
      if(sec !== this.lastLowBeep){ this.lastLowBeep = sec; this.emit('lowtime', { sec }); }
    }
    this.emit('tick', { timeLeft: this.timeLeft, frozen });
  }

  end(){
    if(!this.running) return;
    this.running = false;
    this.checkToken++;
    this.stopTimer();

    let longest = '';
    for(const w of this.chain) if(w.length > longest.length) longest = w;

    this.emit('end', {
      score: this.score,
      words: this.chain.length,
      bestCombo: this.bestCombo,
      longest,
      level: this.level,
      chain: this.chain.slice(),
      mode: this.mode
    });
  }

  /* ---------------- innsending ---------------- */

  /** Vurderer et ord uten å endre spilltilstand. Brukes både til
      live-forhåndsvisning mens man skriver og til selve innsendingen. */
  evaluate(raw){
    const word = norm(raw);
    if(word === '') return { state: 'empty', word };
    if(!/^[a-zæøå]+$/.test(word)) return { state: 'invalid', word, message: 'Bare bokstaver' };
    if(word.charAt(0) !== this.requiredLetter){
      return { state: 'wrongletter', word, message: `Må starte med «${this.requiredLetter.toLocaleUpperCase('nb-NO')}»` };
    }
    if(this.used.has(word)) return { state: 'used', word, message: 'Allerede brukt' };
    if(this.dict.hasLocal(word)) return { state: 'known', word };
    return { state: 'unknown', word };
  }

  /** Poeng ordet ville gitt akkurat nå (til forhåndsvisning). */
  previewPoints(word){
    const mult = comboMultiplier(this.streak + 1);
    return basePoints(word) * mult * (this.goldenActive ? 3 : 1) * (this.doubleActive ? 2 : 1);
  }

  submit(raw){
    if(!this.running || this.busy) return;
    const res = this.evaluate(raw);
    if(res.state === 'empty') return;

    if(res.state === 'invalid' || res.state === 'wrongletter' || res.state === 'used'){
      this.reject(res.message);
      return;
    }
    if(res.state === 'known'){
      this.accept(res.word);
      return;
    }

    // ukjent lokalt → spør nettordboka
    const token = ++this.checkToken;
    this.busy = true;
    this.emit('checking', { word: res.word });
    this.dict.checkOnline(res.word)
      .then(found => {
        if(token !== this.checkToken || !this.running) return;
        this.busy = false;
        this.emit('checked', {});
        if(found) this.accept(res.word);
        else this.reject('Ordet finnes ikke i ordlisten');
      })
      .catch(() => {
        if(token !== this.checkToken || !this.running) return;
        this.busy = false;
        this.emit('checked', {});
        this.reject('Fikk ikke sjekket ordet – prøv igjen');
      });
  }

  accept(word){
    const prevMult = comboMultiplier(this.streak);
    this.streak++;
    this.wordsAdded++;

    const mult = comboMultiplier(this.streak);
    this.bestCombo = Math.max(this.bestCombo, mult);

    const wasGolden = this.goldenActive;
    const wasDouble = this.doubleActive;
    const gained = basePoints(word) * mult * (wasGolden ? 3 : 1) * (wasDouble ? 2 : 1);
    this.score += gained;

    this.goldenActive = false;
    this.doubleActive = false;

    this.chain.push(word);
    this.used.add(word);
    this.requiredLetter = lastLetter(word);

    if(this.hasTimer()){
      this.timeLeft = Math.min(this.mode.maxTime, this.timeLeft + this.mode.timeBonus(word.length));
    }

    this.emit('accept', {
      word, gained, mult, golden: wasGolden, double: wasDouble,
      score: this.score, timeLeft: this.timeLeft
    });

    // nivå
    const newLevel = Math.floor(this.wordsAdded / WORDS_PER_LEVEL) + 1;
    if(newLevel > this.level){
      this.level = newLevel;
      this.grantPower();
      this.emit('levelup', { level: this.level });
    } else if(mult > prevMult){
      this.grantPower();
      this.emit('comboup', { mult });
    }

    // gyllen bokstav til neste ord
    if(Math.random() < GOLDEN_CHANCE){
      this.goldenActive = true;
      this.emit('golden', { letter: this.requiredLetter });
    }
  }

  reject(message){
    this.streak = 0;
    let lostLife = false;
    if(this.mode.lives > 0){
      this.lives--;
      lostLife = true;
    }
    this.emit('reject', { message, lostLife, lives: this.lives });
    if(this.mode.lives > 0 && this.lives <= 0) this.end();
  }

  /* ---------------- kraftbonuser ---------------- */

  grantPower(){
    const options = Object.keys(POWERS).filter(k => this.powers[k] < MAX_PER_POWER);
    if(options.length === 0) return;
    const pick = options[Math.floor(Math.random() * options.length)];
    this.powers[pick]++;
    this.emit('power', { type: pick });
  }

  usePower(type){
    if(!this.running || this.busy) return false;
    if(!this.powers[type] || this.powers[type] <= 0) return false;

    if(type === 'freeze'){
      if(!this.hasTimer()) return false;      // ingen klokke å fryse i maraton
      this.timeLeft = this.mode.maxTime;
      this.freezeUntil = performance.now() + FREEZE_SEC * 1000;
    } else if(type === 'double'){
      if(this.doubleActive) return false;
      this.doubleActive = true;
    } else if(type === 'swap'){
      const candidates = EASY_LETTERS.split('')
        .filter(l => l !== this.requiredLetter && this.dict.countFor(l) > 20);
      if(candidates.length === 0) return false;
      this.requiredLetter = candidates[Math.floor(Math.random() * candidates.length)];
    }

    this.powers[type]--;
    this.emit('usepower', { type, requiredLetter: this.requiredLetter });
    return true;
  }

  /** Er kraftbonusen brukbar akkurat nå? */
  canUsePower(type){
    if(!this.powers[type]) return false;
    if(type === 'freeze') return this.hasTimer();
    if(type === 'double') return !this.doubleActive;
    return true;
  }

  useHint(){
    if(!this.running || this.busy || this.hintsLeft <= 0) return null;
    const pick = this.dict.hintFor(this.requiredLetter, this.used);
    if(!pick) return null;
    this.hintsLeft--;
    if(this.hasTimer()){
      this.timeLeft = Math.max(0.4, this.timeLeft - HINT_COST_SEC);
    }
    this.emit('hint', { word: pick, hintsLeft: this.hintsLeft });
    return pick;
  }
}
