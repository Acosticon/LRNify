/* =========================================================
   EFFEKTMOTOR — én rAF-løkke som tegner to canvas-lag:
     bg  = rolige glør som stiger i bakgrunnen
     fg  = gnister, ringer, poengtekst
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

    this.particles = [];   // gnister (forgrunn)
    this.embers = [];      // bakgrunnsglør
    this.rings = [];
    this.texts = [];

    this.shake = 0;
    this.ambient = false;
    this.running = false;
    this.lastT = 0;
    this.dpr = 1;

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

  burst(x, y, count, opts = {}){
    if(this.reduced) return;
    const spread = opts.speed || 260;
    const colors = opts.colors || ['#ffd23f', '#ff8a2b', '#e2560f'];
    for(let i = 0; i < count; i++){
      const a = Math.random() * TAU;
      const sp = spread * (0.35 + Math.random() * 0.9);
      this.particles.push({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 60,
        life: 0.5 + Math.random() * 0.45,
        age: 0,
        size: 1.6 + Math.random() * 2.6,
        color: colors[(Math.random() * colors.length) | 0]
      });
    }
  }

  ring(x, y, color = '#ffd23f', maxR = 130){
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
      color: opts.color || '#ffd23f',
      weight: opts.weight || 900
    });
  }

  doShake(amount){
    if(this.reduced) return;
    this.shake = Math.min(24, this.shake + amount);
  }

  /** Rydder alt – brukes ved rundestart/slutt. */
  clear(){
    this.particles.length = 0;
    this.rings.length = 0;
    this.texts.length = 0;
    this.shake = 0;
    if(this.shakeEl) this.shakeEl.style.transform = '';
  }

  /* ---------------- oppdatering ---------------- */

  update(dt){
    const g = 620;   // tyngdekraft for gnister

    for(let i = this.particles.length - 1; i >= 0; i--){
      const p = this.particles[i];
      p.age += dt;
      if(p.age >= p.life){ this.particles.splice(i, 1); continue; }
      p.vy += g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.985;
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

    // bakgrunnsglør
    if(this.ambient){
      if(this.embers.length < 34 && Math.random() < 0.5){
        this.embers.push({
          x: Math.random() * this.w,
          y: this.h + 12,
          vy: -(14 + Math.random() * 26),
          vx: (Math.random() - 0.5) * 14,
          size: 0.8 + Math.random() * 2,
          alpha: 0.12 + Math.random() * 0.3,
          drift: Math.random() * TAU
        });
      }
      for(let i = this.embers.length - 1; i >= 0; i--){
        const e = this.embers[i];
        e.drift += dt * 1.4;
        e.y += e.vy * dt;
        e.x += (e.vx + Math.sin(e.drift) * 9) * dt;
        if(e.y < -14) this.embers.splice(i, 1);
      }
    } else if(this.embers.length){
      this.embers.length = 0;
    }

    // skjermrist
    if(this.shake > 0.2){
      this.shake *= Math.pow(0.0016, dt);   // rask utdemping
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

    bg.clearRect(0, 0, this.w, this.h);
    if(this.embers.length){
      bg.globalCompositeOperation = 'lighter';
      for(const e of this.embers){
        bg.globalAlpha = e.alpha;
        bg.fillStyle = '#ff8a2b';
        bg.beginPath();
        bg.arc(e.x, e.y, e.size, 0, TAU);
        bg.fill();
      }
      bg.globalAlpha = 1;
      bg.globalCompositeOperation = 'source-over';
    }

    fg.clearRect(0, 0, this.w, this.h);

    // ringer
    for(const r of this.rings){
      const t = r.age / r.life;
      fg.globalAlpha = (1 - t) * 0.8;
      fg.strokeStyle = r.color;
      fg.lineWidth = 3 * (1 - t) + 0.6;
      fg.beginPath();
      fg.arc(r.x, r.y, r.r, 0, TAU);
      fg.stroke();
    }

    // gnister
    fg.globalCompositeOperation = 'lighter';
    for(const p of this.particles){
      const t = p.age / p.life;
      fg.globalAlpha = 1 - t;
      fg.fillStyle = p.color;
      fg.beginPath();
      fg.arc(p.x, p.y, p.size * (1 - t * 0.55), 0, TAU);
      fg.fill();
    }
    fg.globalCompositeOperation = 'source-over';

    // tekst
    for(const tx of this.texts){
      const t = tx.age / tx.life;
      const pop = t < 0.22 ? 0.6 + (t / 0.22) * 0.55 : 1.05 - (t - 0.22) * 0.08;
      fg.globalAlpha = t < 0.12 ? t / 0.12 : 1 - Math.max(0, (t - 0.55) / 0.45);
      fg.font = `${tx.weight} ${Math.round(tx.size * pop)}px system-ui, sans-serif`;
      fg.textAlign = 'center';
      fg.textBaseline = 'middle';
      fg.lineWidth = 4;
      fg.strokeStyle = 'rgba(0,0,0,.55)';
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
