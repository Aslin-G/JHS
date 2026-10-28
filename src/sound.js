/* Sonido sintetizado en el navegador (WebAudio), sin archivos: viento, pájaros, pasos según la
   superficie, el puente que cruje, balidos, campanillas de luz y una música mínima de arpa en
   escala pentatónica. Arranca con el primer gesto del jugador; M (o el menú de pausa) lo silencia. */
(function (JHS) {
  'use strict';
  const U = JHS.U;

  const S = { ctx: null, on: true, ready: false, vol: 0.85, disabled: false };
  let master, comp, sfx, music, amb, echoIn, noiseBuf;
  let wind = null, scrape = null, scrapeT = 0;
  let musicT = 2, phrase = 0, noteI = 4, ambT = 3, padOn = false, pad = null;

  try { S.on = localStorage.getItem('jhs-sonido') !== 'no'; } catch (e) { /* sin almacenamiento */ }
  // en las pruebas automáticas no hay audio salvo que se pida (?audio=1)
  S.disabled = !!navigator.webdriver && !/[?&]audio=1/.test(location.search);

  function create() {
    if (S.ctx || S.disabled) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { S.disabled = true; return; }
    const ac = S.ctx = new AC();
    master = ac.createGain();
    master.gain.value = S.on ? S.vol : 0;
    master.connect(ac.destination);
    comp = ac.createDynamicsCompressor();
    comp.threshold.value = -20; comp.knee.value = 12; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.25;
    comp.connect(master);
    sfx = bus(0.9); music = bus(0.34); amb = bus(0.55);
    S.buses = { sfx, music, amb };
    // eco suave (da aire a las campanillas y a la música, como el papel mojado al pigmento)
    echoIn = ac.createGain(); echoIn.gain.value = 1;
    const dl = ac.createDelay(1); dl.delayTime.value = 0.34;
    const fb = ac.createGain(); fb.gain.value = 0.32;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    const wet = ac.createGain(); wet.gain.value = 0.3;
    echoIn.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(wet); wet.connect(comp);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    // ruido rosado aproximado (más cálido que el blanco)
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0526;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2;
    }
    startWind();
    S.ready = true;
  }

  function bus(v) { const g = S.ctx.createGain(); g.gain.value = v; g.connect(comp); return g; }

  function unlock() {
    if (S.disabled) return;
    if (!S.ctx) create();
    if (S.ctx && S.ctx.state === 'suspended') S.ctx.resume().catch(() => {});
  }

  function now() { return S.ctx.currentTime; }

  function panner(p) {
    if (!S.ctx.createStereoPanner) return null;
    const n = S.ctx.createStereoPanner();
    n.pan.value = U.clamp(p || 0, -0.9, 0.9);
    return n;
  }

  // Cadena: fuente → [filtro] → ganancia con envolvente → [paneo] → bus (+ eco)
  function chain(src, o, t0, dur) {
    const ac = S.ctx;
    let node = src;
    if (o.filter) {
      const f = ac.createBiquadFilter();
      f.type = o.filter; f.frequency.setValueAtTime(o.freq || 1000, t0); f.Q.value = o.q || 0.8;
      if (o.freqEnd) f.frequency.exponentialRampToValueAtTime(o.freqEnd, t0 + dur);
      node.connect(f); node = f;
    }
    const g = ac.createGain();
    const a = o.attack || 0.005, peak = Math.max(0.0002, o.gain || 0.1);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + a);
    if (o.hold) g.gain.setValueAtTime(peak, t0 + a + o.hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    node.connect(g); node = g;
    const pn = panner(o.pan);
    if (pn) { node.connect(pn); node = pn; }
    node.connect(o.dest || sfx);
    if (o.echo) node.connect(echoIn);
    return g;
  }

  function tone(freq, t0, dur, o = {}) {
    const osc = S.ctx.createOscillator();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (o.glide) osc.frequency.exponentialRampToValueAtTime(o.glide, t0 + (o.glideT || dur));
    if (o.detune) osc.detune.value = o.detune;
    if (o.vib) {
      const l = S.ctx.createOscillator(), lg = S.ctx.createGain();
      l.frequency.value = o.vib[0]; lg.gain.value = o.vib[1];
      l.connect(lg); lg.connect(osc.frequency); l.start(t0); l.stop(t0 + dur + 0.05);
    }
    chain(osc, o, t0, dur);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
    return osc;
  }

  function noise(t0, dur, o = {}) {
    const src = S.ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    src.playbackRate.value = o.rate || 1;
    chain(src, Object.assign({ filter: 'bandpass' }, o), t0, dur);
    src.start(t0, Math.random() * 1.5); src.stop(t0 + dur + 0.05);
  }

  // Cuerda pulsada (arpa / kalimba): fundamental + octava suave y caída larga.
  function pluck(freq, t0, o = {}) {
    const dur = o.dur || 2.2, g = o.gain || 0.06;
    tone(freq, t0, dur, { gain: g, attack: 0.004, dest: o.dest || music, echo: true, pan: o.pan });
    tone(freq * 2, t0, dur * 0.45, { type: 'triangle', gain: g * 0.22, attack: 0.003, dest: o.dest || music, pan: o.pan });
    tone(freq * 3.01, t0, dur * 0.18, { gain: g * 0.08, attack: 0.002, dest: o.dest || music });
  }

  // ------------------------------------------------------------------ fondos continuos
  function startWind() {
    const ac = S.ctx;
    const src = ac.createBufferSource();
    src.buffer = noiseBuf; src.loop = true; src.playbackRate.value = 0.5;
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 420; f.Q.value = 0.6;
    const f2 = ac.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = 1400;
    const g = ac.createGain(); g.gain.value = 0;
    src.connect(f); f.connect(f2); f2.connect(g); g.connect(amb);
    src.start();
    wind = { src, f, g };
  }

  function startScrape() {
    const ac = S.ctx;
    const src = ac.createBufferSource();
    src.buffer = noiseBuf; src.loop = true; src.playbackRate.value = 0.35;
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 380; f.Q.value = 2;
    const g = ac.createGain(); g.gain.value = 0;
    src.connect(f); f.connect(g); g.connect(sfx);
    src.start();
    scrape = { src, f, g };
  }

  function startPad() {
    const ac = S.ctx;
    const g = ac.createGain(); g.gain.value = 0;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
    lp.connect(g); g.connect(music);
    const oscs = [146.83, 220, 293.66].map((f, i) => {
      const o = ac.createOscillator(); o.type = i === 1 ? 'triangle' : 'sine'; o.frequency.value = f; o.detune.value = (i - 1) * 4;
      const og = ac.createGain(); og.gain.value = i === 1 ? 0.25 : 0.4;
      o.connect(og); og.connect(lp); o.start();
      return o;
    });
    pad = { g, oscs };
  }

  // Escala pentatónica de re mayor (cálida, sin tensión).
  const SCALE = [146.83, 164.81, 185, 220, 246.94, 293.66, 329.63, 369.99, 440, 493.88, 587.33, 659.25, 739.99];

  function updateMusic(dt, G) {
    const active = G.state === 'play' || G.state === 'title' || G.state === 'end' || G.state === 'pause';
    if (!padOn && active) { if (!pad) startPad(); padOn = true; }
    const cine = G.cine ? U.clamp(G.cine.t / 6, 0, 1) : 0;
    const padTarget = !active ? 0 : (G.state === 'pause' ? 0.018 : 0.034 + cine * 0.03);
    if (pad) pad.g.gain.setTargetAtTime(padTarget, now(), 1.2);
    if (!active || G.state === 'pause') return;
    musicT -= dt;
    if (musicT > 0) return;
    // frases cortas que suben y bajan por la escala, con silencios entre ellas
    phrase++;
    const step = [-2, -1, -1, 1, 1, 2, 0][Math.floor(Math.random() * 7)];
    noteI = U.clamp(noteI + step, 3, SCALE.length - 1 - (cine > 0.5 ? 0 : 2));
    const t0 = now() + 0.03;
    pluck(SCALE[noteI], t0, { gain: 0.036 + cine * 0.02, pan: (Math.random() - 0.5) * 0.5 });
    if (Math.random() < 0.3) pluck(SCALE[Math.max(0, noteI - 3)], t0 + 0.01, { gain: 0.025, dur: 2.8 });
    if (phrase % 7 === 0) { musicT = 4 + Math.random() * 4; noteI = 4 + Math.floor(Math.random() * 3); }
    else musicT = (Math.random() < 0.3 ? 1.2 : 0.62) * (1 - cine * 0.25);
  }

  function chirps(t0, n, pan, g = 0.03) {
    let t = t0;
    const base = 2600 + Math.random() * 1400;
    for (let i = 0; i < n; i++) {
      const f = base * (0.9 + Math.random() * 0.25);
      tone(f, t, 0.07 + Math.random() * 0.05, { gain: g, glide: f * (1.25 + Math.random() * 0.3), attack: 0.004, dest: amb, pan });
      t += 0.09 + Math.random() * 0.12;
    }
  }

  // ------------------------------------------------------------------ efectos
  function pan(x) {
    const G = JHS.G;
    return G && G.cam && x != null ? U.clamp((x - G.cam.x) / 1100, -0.8, 0.8) : 0;
  }

  const FX = {
    bleat(o) {
      // «¡beee!»: diente de sierra con vibrato y pulsos rápidos, filtrado por dos formantes
      const ac = S.ctx, t0 = now(), dur = 0.62;
      const osc = ac.createOscillator(); osc.type = 'sawtooth';
      const f0 = 340 + Math.random() * 60;
      osc.frequency.setValueAtTime(f0 * 1.08, t0); osc.frequency.exponentialRampToValueAtTime(f0 * 0.92, t0 + dur);
      const vib = ac.createOscillator(), vg = ac.createGain(); vib.frequency.value = 6.5; vg.gain.value = 14;
      vib.connect(vg); vg.connect(osc.frequency);
      const trem = ac.createOscillator(), tg = ac.createGain(), am = ac.createGain();
      trem.frequency.value = 27; tg.gain.value = 0.45; am.gain.value = 0.6;
      trem.connect(tg); tg.connect(am.gain);
      const env = ac.createGain();
      env.gain.setValueAtTime(0.0001, t0); env.gain.exponentialRampToValueAtTime(0.13, t0 + 0.05);
      env.gain.setValueAtTime(0.13, t0 + dur * 0.55); env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      const pn = panner(pan(o && o.x));
      for (const [f, q, gg] of [[760, 7, 1], [1250, 9, 0.6], [2500, 6, 0.25]]) {
        const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
        const fg = ac.createGain(); fg.gain.value = gg * 2.2;
        osc.connect(bp); bp.connect(fg); fg.connect(am);
      }
      am.connect(env);
      if (pn) { env.connect(pn); pn.connect(sfx); } else env.connect(sfx);
      for (const n of [osc, vib, trem]) { n.start(t0); n.stop(t0 + dur + 0.05); }
    },
    call() {
      // la niña llama: dos notas silbadas (sol–mi), como un «¡ven!»
      const t0 = now();
      tone(784, t0, 0.22, { gain: 0.07, attack: 0.03, vib: [5, 6], echo: true });
      tone(659.25, t0 + 0.24, 0.42, { gain: 0.07, attack: 0.03, vib: [5, 8], glide: 640, echo: true });
    },
    seed(o) {
      const t0 = now(), p = pan(o && o.x);
      tone(1318.5, t0, 0.9, { gain: 0.06, echo: true, pan: p });
      tone(1975.5, t0 + 0.07, 0.8, { gain: 0.045, echo: true, pan: p });
      tone(2637, t0 + 0.14, 0.6, { gain: 0.025, echo: true, pan: p });
    },
    pick() {
      const t0 = now();
      pluck(1174.66, t0, { gain: 0.05, dur: 0.7, dest: sfx });
      pluck(1760, t0 + 0.06, { gain: 0.035, dur: 0.6, dest: sfx });
      noise(t0, 0.12, { freq: 3800, q: 1, gain: 0.02 });
    },
    lantern(o) {
      const t0 = now(), p = pan(o && o.x);
      noise(t0, 0.5, { filter: 'lowpass', freq: 300, freqEnd: 1600, gain: 0.05, attack: 0.08, pan: p });
      [440, 554.37, 659.25, 880].forEach((f, i) => pluck(f, t0 + 0.12 + i * 0.09, { gain: 0.04, dur: 1.6, dest: sfx, pan: p }));
    },
    chest() {
      const t0 = now();
      tone(120, t0, 0.5, { type: 'sawtooth', filter: 'bandpass', freq: 700, q: 5, gain: 0.05, glide: 72, vib: [13, 9] });
      [1174.66, 1479.98, 1760, 2349.3].forEach((f, i) => tone(f, t0 + 0.42 + i * 0.08, 0.9, { gain: 0.035, echo: true }));
    },
    page() {
      const t0 = now();
      for (let i = 0; i < 4; i++) noise(t0 + i * 0.07 + Math.random() * 0.02, 0.09, { freq: 3500 + Math.random() * 1500, q: 0.7, gain: 0.1 });
    },
    leaves(o) {
      const t0 = now(), p = pan(o && o.x);
      for (let i = 0; i < 9; i++) noise(t0 + Math.random() * 0.9, 0.14 + Math.random() * 0.1, { filter: 'highpass', freq: 2200 + Math.random() * 1800, q: 0.5, gain: 0.1, attack: 0.02, pan: p });
      noise(t0, 0.25, { filter: 'lowpass', freq: 260, gain: 0.08 });
    },
    gift() {
      const t0 = now();
      [587.33, 739.99, 880, 1174.66, 1479.98].forEach((f, i) => pluck(f, t0 + i * 0.13, { gain: 0.05, dur: 2, dest: sfx }));
    },
    bless() {
      const t0 = now();
      for (const f of [293.66, 369.99, 440, 587.33]) tone(f, t0, 5, { gain: 0.06, attack: 1.4, hold: 1.8, dest: music, echo: true, detune: Math.random() * 6 - 3 });
    },
    fall() {
      const t0 = now();
      tone(880, t0, 0.7, { gain: 0.05, glide: 220, echo: true });
      noise(t0, 0.6, { filter: 'lowpass', freq: 1200, freqEnd: 200, gain: 0.04, attack: 0.1 });
    },
    jump() { noise(now(), 0.14, { freq: 700, freqEnd: 1600, q: 1.2, gain: 0.012, attack: 0.02 }); },
    skid() { noise(now(), 0.22, { filter: 'lowpass', freq: 1500, freqEnd: 400, gain: 0.05, attack: 0.01 }); },
    wood() {
      const t0 = now();
      tone(210, t0, 0.12, { type: 'triangle', gain: 0.06 });
      noise(t0, 0.06, { freq: 1100, q: 2, gain: 0.04 });
    },
    creak(o) {
      const t0 = now();
      tone(85 + Math.random() * 30, t0, 0.45, { type: 'sawtooth', filter: 'bandpass', freq: 520 + Math.random() * 200, q: 6, gain: 0.09, attack: 0.08, vib: [9 + Math.random() * 5, 10], pan: pan(o && o.x) });
    },
    birds(o) {
      const t0 = now(), p = pan(o && o.x);
      for (let i = 0; i < 5; i++) noise(t0 + i * 0.05, 0.05, { freq: 900, q: 1.5, gain: 0.03, pan: p });
      chirps(t0 + 0.1, 3, p, 0.035);
    },
  };

  // ------------------------------------------------------------------ API
  S.play = function (name, o) {
    if (!S.ready || !S.on || S.ctx.state !== 'running') return;
    const fn = FX[name];
    if (fn) { try { fn(o); } catch (e) { /* un efecto que falla no detiene el juego */ } }
  };

  S.step = function (surface, run) {
    if (!S.ready || !S.on || S.ctx.state !== 'running') return;
    const t0 = now(), k = 0.6 + run * 0.5;
    if (surface === 'bridge') {
      tone(150 + Math.random() * 40, t0, 0.09, { type: 'triangle', gain: 0.05 * k });
      noise(t0, 0.05, { freq: 900, q: 2, gain: 0.03 * k });
      if (Math.random() < 0.18) FX.creak();
    } else if (surface === 'branch' || surface === 'log') {
      tone(240 + Math.random() * 60, t0, 0.07, { type: 'triangle', gain: 0.04 * k });
      noise(t0, 0.05, { freq: 1500, q: 1.5, gain: 0.025 * k });
    } else if (surface === 'rock' || surface === 'push') {
      noise(t0, 0.05, { freq: 1900, q: 1.2, gain: 0.03 * k });
      noise(t0, 0.06, { filter: 'lowpass', freq: 500, gain: 0.04 * k });
    } else {
      // tierra y gravilla del sendero
      noise(t0, 0.07, { filter: 'lowpass', freq: 650 + Math.random() * 200, gain: 0.08 * k });
      noise(t0 + 0.01, 0.04, { freq: 2600 + Math.random() * 900, q: 1.1, gain: 0.028 * k });
    }
  };

  S.land = function (surface, v) {
    if (!S.ready || !S.on || S.ctx.state !== 'running') return;
    const k = U.clamp(v / 900, 0.3, 1.2), t0 = now();
    noise(t0, 0.16, { filter: 'lowpass', freq: 420, gain: 0.13 * k });
    if (surface === 'bridge') { tone(120, t0, 0.18, { type: 'triangle', gain: 0.07 * k }); FX.creak(); }
    else noise(t0, 0.06, { freq: 2400, q: 1, gain: 0.03 * k });
  };

  S.scrape = function (dt) { scrapeT = 0.12; void dt; };

  S.toggle = function () {
    S.on = !S.on;
    try { localStorage.setItem('jhs-sonido', S.on ? 'si' : 'no'); } catch (e) { /* sin almacenamiento */ }
    if (S.on) unlock();
    if (master) master.gain.setTargetAtTime(S.on ? S.vol : 0, now(), 0.08);
    return S.on;
  };

  S.update = function (dt, G) {
    if (!S.ready || S.ctx.state !== 'running') return;
    const t = now();
    const play = G.state === 'play' || G.state === 'title' || G.state === 'end';
    // viento: sigue a las ráfagas del ambiente
    const w = JHS.Ambient.wind || 0.6;
    wind.g.gain.setTargetAtTime(play ? 0.022 + w * 0.022 : 0.01, t, 0.6);
    wind.f.frequency.setTargetAtTime(300 + w * 220, t, 0.8);
    // roca arrastrada
    scrapeT -= dt;
    if (scrapeT > 0 && !scrape) startScrape();
    if (scrape) scrape.g.gain.setTargetAtTime(scrapeT > 0 ? 0.11 : 0, t, 0.06);
    // pájaros lejanos de vez en cuando
    ambT -= dt;
    if (ambT <= 0 && play) { chirps(t + 0.05, 2 + Math.floor(Math.random() * 4), (Math.random() - 0.5) * 1.4, 0.014 + Math.random() * 0.012); ambT = 3 + Math.random() * 6; }
    updateMusic(dt, G);
  };

  S.init = function () {
    if (S.disabled) return;
    for (const ev of ['keydown', 'pointerdown', 'touchstart']) window.addEventListener(ev, unlock, { passive: true });
  };

  JHS.Sound = S;
})(window.JHS = window.JHS || {});
