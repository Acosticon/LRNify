/* =========================================================
   EFFEKTMOTOR — én rAF-løkke som tegner to canvas-lag:
     bg  = stjerner som blinker svakt i bakgrunnen
     fg  = damp, gnister fra hjulene, ringer og poengtekst
   Pluss skjermrist på et wrapper-element.
   Respekterer prefers-reduced-motion.
   ========================================================= */

const TAU = Math.PI * 2;

export class Fx {
  constructor(bgCanvas, fgCanvas, shakeEl){
    this.bg = bgCanvas;
    this.fg = fgCanvas;
    this.shakeEl = shakeEl;
    this.bgCtx = bgCanvas.getContext('2d');
    this.fgCtx = fgCanvas.getContext('2d');

    this.reduced = window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

    this.sparks = [];
    this.puffs = [];
    this.rings = [];
    this.texts = [];
    this.stars = [];

    this.shake = 0;
    this.ambient = false;
    this.running = false;
    this.lastT = 0;

    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
    this.resize();
  }

  resize(){
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    for(const c of [this.bg, this.fg]){
      c.width = Math.floor(this.w * this.dpr);
      c.height = Math.floor(this.h * this.dpr);
    }
    this.bgCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.fgCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this._seedStars();
  }

  _seedStars(){
    this.stars.length = 0;
    if(this.reduced) return;
    const n = Math.round((this.w * this.h) / 26000);
    for(let i = 0; i < n; i++){
      this.stars.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h * 0.62,
        r: 0.5 + Math.random() * 1.2,
        base: 0.16 + Math.random() * 0.4,
        phase: Math.random() * TAU,
        speed: 0.4 + Math.random() * 0.9
      });
    }
  }

  start(){
    if(this.running) return;
    this.running = true;
    this.lastT = performance.now();
    const loop = (t) => {
      if(!this.running) return;
      const dt = Math.min(50, t - this.lastT) / 1000;
      this.lastT = t;
      this.update(dt);
      this.draw();
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }

  stop(){
    this.running = false;
    if(this._raf) cancelAnimationFrame(this._raf);
  }

  setAmbient(on){ this.ambient = on && !this.reduced; }

  /* ---------------- spawnere ---------------- */

  /** Gnister fra hjulene når en vogn kobles på. */
  sparks_(x, y, count, opts = {}){
    if(this.reduced) return;
    const colors = opts.colors || ['#ffe08a', '#ffc24d', '#d98b0e'];
    const speed = opts.speed || 240;
    for(let i = 0; i < count; i++){
      const a = Math.random() * TAU;
      const sp = speed * (0.3 + Math.random() * 0.9);
      this.sparks.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 50,
        life: 0.45 + Math.random() * 0.4,
        age: 0,
        size: 1.4 + Math.random() * 2.4,
        color: colors[(Math.random() * colors.length) | 0]
      });
    }
  }
  burst(x, y, count, opts){ this.sparks_(x, y, count, opts); }

  /** Dampskyer fra lokomotivet. Små og myke – ellers leser de
      som grå flekker i stedet for røyk. */
  steam(x, y, count = 5){
    if(this.reduced) return;
    for(let i = 0; i < count; i++){
      this.puffs.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 5,
        vx: 6 + Math.random() * 20,
        vy: -(22 + Math.random() * 26),
        r: 3 + Math.random() * 4,
        grow: 9 + Math.random() * 11,
        life: 0.9 + Math.random() * 0.6,
        age: 0,
        delay: i * 0.09
      });
    }
  }

  ring(x, y, color = '#ffc24d', maxR = 130){
    if(this.reduced) return;
    this.rings.push({ x, y, r: 8, maxR, life: .55, age: 0, color });
  }

  popup(text, x, y, opts = {}){
    this.texts.push({
      text, x, y,
      vy: opts.vy || -62,
      life: opts.life || 0.95,
      age: 0,
      size: opts.size || 26,
      color: opts.color || '#ffc24d',
      weight: opts.weight || 900
    });
  }

  doShake(amount){
    if(this.reduced) return;
    this.shake = Math.min(24, this.shake + amount);
  }

  clear(){
    this.sparks.length = 0;
    this.puffs.length = 0;
    this.rings.length = 0;
    this.texts.length = 0;
    this.shake = 0;
    if(this.shakeEl) this.shakeEl.style.transform = '';
  }

  /* ---------------- oppdatering ---------------- */

  update(dt){
    const g = 600;

    for(let i = this.sparks.length - 1; i >= 0; i--){
      const p = this.sparks[i];
      p.age += dt;
      if(p.age >= p.life){ this.sparks.splice(i, 1); continue; }
      p.vy += g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.985;
    }

    for(let i = this.puffs.length - 1; i >= 0; i--){
      const p = this.puffs[i];
      if(p.delay > 0){ p.delay -= dt; continue; }   // puffene kommer etter hverandre
      p.age += dt;
      if(p.age >= p.life){ this.puffs.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy *= 0.985;
      p.r += p.grow * dt;
    }

    for(let i = this.rings.length - 1; i >= 0; i--){
      const r = this.rings[i];
      r.age += dt;
      if(r.age >= r.life){ this.rings.splice(i, 1); continue; }
      const t = r.age / r.life;
      r.r = 8 + (r.maxR - 8) * (1 - Math.pow(1 - t, 3));
    }

    for(let i = this.texts.length - 1; i >= 0; i--){
      const tx = this.texts[i];
      tx.age += dt;
      if(tx.age >= tx.life){ this.texts.splice(i, 1); continue; }
      tx.y += tx.vy * dt;
      tx.vy *= 0.96;
    }

    if(this.shake > 0.2){
      this.shake *= Math.pow(0.0016, dt);
      const dx = (Math.random() - 0.5) * this.shake;
      const dy = (Math.random() - 0.5) * this.shake;
      if(this.shakeEl) this.shakeEl.style.transform = `translate(${dx}px, ${dy}px)`;
    } else if(this.shake !== 0){
      this.shake = 0;
      if(this.shakeEl) this.shakeEl.style.transform = '';
    }
  }

  /* ---------------- tegning ---------------- */

  draw(){
    const bg = this.bgCtx, fg = this.fgCtx;
    const now = performance.now() / 1000;

    bg.clearRect(0, 0, this.w, this.h);
    if(this.ambient && this.stars.length){
      for(const s of this.stars){
        const a = s.base + Math.sin(now * s.speed + s.phase) * 0.14;
        bg.globalAlpha = Math.max(0, a);
        bg.fillStyle = '#dce6ff';
        bg.beginPath();
        bg.arc(s.x, s.y, s.r, 0, TAU);
        bg.fill();
      }
      bg.globalAlpha = 1;
    }

    fg.clearRect(0, 0, this.w, this.h);

    // damp – bak alt annet i forgrunnen, tegnet med myk kant
    for(const p of this.puffs){
      if(p.delay > 0) continue;
      const t = p.age / p.life;
      // toner inn raskt, ut sakte
      const alpha = (t < 0.18 ? t / 0.18 : 1 - (t - 0.18) / 0.82) * 0.3;
      if(alpha <= 0) continue;
      const grad = fg.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      grad.addColorStop(0, `rgba(220,230,255,${alpha})`);
      grad.addColorStop(1, 'rgba(220,230,255,0)');
      fg.fillStyle = grad;
      fg.beginPath();
      fg.arc(p.x, p.y, p.r, 0, TAU);
      fg.fill();
    }
    fg.globalAlpha = 1;

    for(const r of this.rings){
      const t = r.age / r.life;
      fg.globalAlpha = (1 - t) * 0.8;
      fg.strokeStyle = r.color;
      fg.lineWidth = 3 * (1 - t) + 0.6;
      fg.beginPath();
      fg.arc(r.x, r.y, r.r, 0, TAU);
      fg.stroke();
    }

    fg.globalCompositeOperation = 'lighter';
    for(const p of this.sparks){
      const t = p.age / p.life;
      fg.globalAlpha = 1 - t;
      fg.fillStyle = p.color;
      fg.beginPath();
      fg.arc(p.x, p.y, p.size * (1 - t * 0.55), 0, TAU);
      fg.fill();
    }
    fg.globalCompositeOperation = 'source-over';

    for(const tx of this.texts){
      const t = tx.age / tx.life;
      const pop = t < 0.22 ? 0.6 + (t / 0.22) * 0.55 : 1.05 - (t - 0.22) * 0.08;
      fg.globalAlpha = t < 0.12 ? t / 0.12 : 1 - Math.max(0, (t - 0.55) / 0.45);
      fg.font = `${tx.weight} ${Math.round(tx.size * pop)}px system-ui, sans-serif`;
      fg.textAlign = 'center';
      fg.textBaseline = 'middle';
      fg.lineWidth = 4;
      fg.strokeStyle = 'rgba(0,0,0,.6)';
      fg.strokeText(tx.text, tx.x, tx.y);
      fg.fillStyle = tx.color;
      fg.fillText(tx.text, tx.x, tx.y);
    }

    fg.globalAlpha = 1;
  }

  destroy(){
    this.stop();
    window.removeEventListener('resize', this._onResize);
  }
}
