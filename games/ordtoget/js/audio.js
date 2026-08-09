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

  /** Kort støyknepp – brukes til damp og koblingslyd. */
  noise(dur = 0.18, vol = 0.07, filterHz = 1400){
    if(!this.enabled || !this.ctx) return;
    const rate = this.ctx.sampleRate;
    const len = Math.max(1, Math.floor(rate * dur));
    const buf = this.ctx.createBuffer(1, len, rate);
    const data = buf.getChannelData(0);
    for(let i = 0; i < len; i++){
      // avtagende hvit støy
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterHz;
    const gain = this.ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
    src.start();
  }

  correct(mult){
    const base = 520 + (mult - 1) * 85;
    this.tone(base, 0, .11, 'triangle', .16);
    this.tone(base * 1.5, .07, .13, 'triangle', .12);
    this.noise(.13, .05, 900);          // vogna kobles på
  }

  /** Togfløyte – to toner i kvint, litt luftig. */
  whistle(){
    this.tone(784, 0, .5, 'sine', .13);
    this.tone(1175, .02, .5, 'sine', .1);
    this.noise(.4, .035, 2200);
  }

  /** Damputslipp. */
  steam(){ this.noise(.36, .06, 1600); }
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
  over(){
    [440, 370, 294, 220].forEach((f, i) => this.tone(f, i * .13, .3, 'triangle', .15));
    this.noise(.5, .05, 700);          // toget bremser inn
  }
  win(){
    [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, i * .1, .34, 'triangle', .15));
    setTimeout(() => this.whistle(), 520);
  }
  /** Ett klikk fra hjulet som snurrer. */
  reelTick(){
    this.tone(1250, 0, .035, 'square', .055);
    this.noise(.03, .035, 2600);
  }

  /** Hjulet stopper på en vogn. */
  reelStop(){
    this.tone(660, 0, .1, 'triangle', .14);
    this.tone(990, .05, .16, 'triangle', .12);
  }

  /** Ny vogntype låst opp. (Ikke forveksle med unlock(), som
      åpner AudioContext etter en brukerhandling.) */
  unlocked(){
    [659, 880, 1175].forEach((f, i) => this.tone(f, i * .09, .3, 'triangle', .14));
    this.noise(.3, .05, 1800);
  }
}
