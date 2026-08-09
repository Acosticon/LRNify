/* =========================================================
   LYD — alt syntetisert med WebAudio. Ingen lydfiler,
   ingen eksterne ressurser.
   ========================================================= */

export class Sfx {
  constructor(){
    this.enabled = true;
    this.ctx = null;
  }

  /** AudioContext må opprettes/gjenopptas etter en brukerhandling. */
  unlock(){
    if(!this.enabled) return;
    if(!this.ctx){
      const AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return;
      try { this.ctx = new AC(); } catch(e){ this.ctx = null; return; }
    }
    if(this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  setEnabled(on){
    this.enabled = on;
    if(on) this.unlock();
  }

  tone(freq, delay, dur, type = 'triangle', vol = 0.16){
    if(!this.enabled || !this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  /** Frekvenssveip – brukt til «woosh»-aktige effekter. */
  sweep(from, to, dur, type = 'sawtooth', vol = 0.1){
    if(!this.enabled || !this.ctx) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  correct(mult){
    const base = 520 + (mult - 1) * 85;
    this.tone(base, 0, .11, 'triangle', .16);
    this.tone(base * 1.5, .07, .13, 'triangle', .12);
  }
  combo(mult){
    for(let i = 0; i < 3; i++){
      this.tone(440 * Math.pow(1.26, i + mult), i * .06, .14, 'square', .1);
    }
  }
  golden(){
    [784, 988, 1319, 1568].forEach((f, i) => this.tone(f, i * .07, .26, 'sine', .13));
  }
  error(){
    this.tone(150, 0, .16, 'sawtooth', .12);
    this.tone(110, .06, .18, 'sawtooth', .1);
  }
  level(){
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, i * .085, .2, 'triangle', .14));
  }
  power(){
    this.sweep(300, 1200, .22, 'square', .09);
    this.tone(1320, .2, .14, 'sine', .1);
  }
  freeze(){ this.sweep(1400, 260, .5, 'sine', .11); }
  hint(){ this.tone(880, 0, .09, 'sine', .1); this.tone(1170, .06, .1, 'sine', .08); }
  lowTick(){ this.tone(230, 0, .06, 'square', .07); }
  life(){ this.tone(320, 0, .18, 'sawtooth', .13); this.tone(200, .1, .24, 'sawtooth', .12); }
  over(){ [440, 370, 294, 220].forEach((f, i) => this.tone(f, i * .13, .3, 'triangle', .15)); }
  win(){ [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, i * .1, .34, 'triangle', .15)); }
}
