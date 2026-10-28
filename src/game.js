/* Bucle principal: carga (se pinta todo al empezar), título, juego, pausa, página del diario,
   cinemática del mirador (§49–§50), final y hoja de personajes. */
(function (JHS) {
  'use strict';
  const U = JHS.U, P = JHS.Palette, Paint = JHS.Paint, Layers = JHS.Layers, Input = JHS.Input, UI = JHS.UI;
  const L = JHS.Level1;

  const G = {
    state: 'loading', prev: 'title', t: 0, stateT: 0, load: { frac: 0, label: 'Preparando el papel…' },
    canvas: null, ctx: null, base: { s: 1, ox: 0, oy: 0, W: 1920, H: 1080 },
    layers: {}, clouds: [], fg: [], spr: {}, menu: 0,
    touchMode: !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches),
    checkpoint: { x: L.start.x, y: 880 }, cine: null, failing: null, playTime: 0, endInfo: null,
    reduced: window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    perf: { u: 0, r: 0, dt: 0.016 },
    quality: 1, slowT: 0,
  };
  JHS.G = G;

  // ------------------------------------------------------------------ lienzo
  function resize() {
    const c = G.canvas;
    const cssW = Math.max(1, c.clientWidth || window.innerWidth), cssH = Math.max(1, c.clientHeight || window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2) * G.quality;
    let W = Math.round(cssW * dpr), H = Math.round(cssH * dpr);
    const maxPx = 4.2e6;
    if (W * H > maxPx) { const k = Math.sqrt(maxPx / (W * H)); W = Math.round(W * k); H = Math.round(H * k); }
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    const s = Math.min(W / 1920, H / 1080);
    G.base = { s, ox: (W - 1920 * s) / 2, oy: (H - 1080 * s) / 2, W, H, cssW, cssH };
    G.portrait = cssH > cssW * 1.1;
  }

  function toLogical(cx, cy) {
    const r = G.canvas.getBoundingClientRect();
    const b = G.base;
    const px = ((cx - r.left) / r.width) * b.W, py = ((cy - r.top) / r.height) * b.H;
    return [(px - b.ox) / b.s, (py - b.oy) / b.s];
  }

  function screenSet(ctx) {
    const b = G.base;
    ctx.setTransform(b.s, 0, 0, b.s, b.ox, b.oy);
  }

  // ------------------------------------------------------------------ carga: se pinta el mundo
  async function boot(hot) {
    G.canvas = document.getElementById('juego');
    G.ctx = G.canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    Input.init(G.canvas, toLogical);
    requestAnimationFrame(frame);
    try {
      if (document.fonts && document.fonts.load) {
        await Promise.race([
          Promise.all([document.fonts.load('40px "IM Fell English"'), document.fonts.load('30px "Alegreya"'), document.fonts.load('italic 30px "Alegreya"')]),
          new Promise((r) => setTimeout(r, 2500)),
        ]);
      }
    } catch (e) { /* sin red: tipografías de respaldo */ }
    const steps = [
      ['Preparando el papel…', () => { JHS.Tex.init(7); }],
      ['Mezclando pigmentos…', () => { UI.init(); JHS.Girl.build(); JHS.Sheep.build(); JHS.Shepherd.build(); }],
      ['Pintando el cielo del amanecer…', paintSkyStep],
      ['Pintando las montañas lejanas…', () => { G.layers.far = new Layers.Layer({ name: 'far', p: 0.1, q: 0.7, chunk: 1024 }); JHS.Scenery.paintFar(G.layers.far); }],
      ['Pintando el valle…', () => { G.layers.mid = new Layers.Layer({ name: 'mid', p: 0.25, q: 0.8, chunk: 1024 }); JHS.Scenery.paintMid(G.layers.mid); }],
      ['Pintando las colinas…', () => { G.layers.hills = new Layers.Layer({ name: 'hills', p: 0.5, q: 0.9, chunk: 1024 }); JHS.Scenery.paintHills(G.layers.hills); }],
      ['Pintando el sendero…', () => {
        G.layers.play = new Layers.Layer({ name: 'play', p: 1, q: 1, chunk: 512, world: true, bounds: { x0: -720, y0: -200, x1: 9000, y1: JHS.Scenery.BOTTOM } });
        JHS.Scenery.paintPlayfield(G.layers.play, L);
      }],
      ['Secando la acuarela…', setupWorldArt],
    ];
    G.loadTimes = [];
    for (let i = 0; i < steps.length; i++) {
      G.load.label = steps[i][0];
      G.load.frac = i / steps.length;
      await U.nextFrame();
      await U.nextFrame();
      const t0 = performance.now();
      steps[i][1]();
      G.loadTimes.push([steps[i][0], Math.round(performance.now() - t0)]);
    }
    G.load.frac = 1;
    newGame();
    if (hot && hot.checkpoint) restore(hot);
    else setState('title');
  }

  function paintSkyStep() {
    const sky = new Layers.Layer({ name: 'sky', p: 0.03, q: 0.5, chunk: 4096 });
    JHS.Scenery.paintSky(sky);
    G.layers.sky = sky;
    const defs = [[620, 200, 300, 110, true, 1], [380, 150, 1040, 50, true, 1], [460, 160, 1880, 120, true, -1],
      [300, 110, 1180, 300, false, 1], [520, 120, 2120, 300, false, -1], [380, 90, 640, 360, false, 1]];
    G.clouds = defs.map(([w, h, x, y, dark, side], i) => ({ spr: JHS.Scenery.cloudSprite(w, h, 30 + i, dark, side), x, y, v: 2.5 + i * 0.7, part: 0, side: x < JHS.Scenery.SUN.x ? -1 : 1 }));
    G.spr.rays = JHS.Scenery.raySprite();
  }

  function setupWorldArt() {
    const O = JHS.Objects;
    G.spr.lanternPost = O.lanternPost();
    G.spr.lampOff = O.lanternLamp(false);
    G.spr.lampOn = O.lanternLamp(true);
    G.spr.chestClosed = O.chest(false);
    G.spr.chestOpen = O.chest(true);
    G.spr.seed = O.seed();
    G.spr.planks = [O.bridgePlank(771), O.bridgePlank(772), O.bridgePlank(773)];
    G.spr.boulder = O.boulder(L.pushables[0].w, L.pushables[0].h);
    G.spr.glow = Paint.makeSprite({ w: 200, h: 200, ox: 100, oy: 100, res: 1 }, (g) => Paint.softBlob(g, 0, 0, 100, '#ffd27a', 1));
    G.spr.fg = JHS.Scenery.foregroundSprites();
    G.world = new JHS.Physics.World(L);
    JHS.Ambient.init(L, G.world);
    // primer plano: elementos que pasan delante, colocados según la altura del sendero
    G.fg = [];
    const xs = [300, 1500, 2600, 3950, 5250, 6500, 7600];
    xs.forEach((wx, i) => {
      const gy = G.world.groundY(wx) || 800;
      const camY = gy - JHS.Camera.FRAME_Y;
      G.fg.push({ spr: G.spr.fg[i % G.spr.fg.length], x: 960 + (wx + 380 - Layers.C0.x) * 1.3, y: 1130 + (camY - Layers.C0.y) * 1.3, flip: i % 2 ? -1 : 1 });
    });
  }

  // ------------------------------------------------------------------ partida
  function newGame() {
    const w = G.world = new JHS.Physics.World(L);
    const y0 = w.groundY(L.start.x);
    G.body = new JHS.Physics.Body(L.start.x, y0);
    G.girl = JHS.Girl.create(L.start.x, y0);
    G.sheep = JHS.Sheep.create(L.sheepStart.x, w.groundY(L.sheepStart.x));
    G.sheep.facing = -1;
    JHS.Sheep.setAnim(G.sheep, 'eat');
    G.sheepCtl = new JHS.Entities.SheepCtl(w, L, G.sheep);
    G.sheepCtl.reset(L.sheepStart.x, w.groundY(L.sheepStart.x));
    // la oveja empieza comiendo un poco por delante: su rastro inicial va de ella a la niña
    G.sheepCtl.trail = [{ x: L.sheepStart.x, y: w.groundY(L.sheepStart.x), ok: true, g: true, climb: false, d: 0, kind: 'ground' }];
    G.sheepWaiting = true;
    G.shep = JHS.Shepherd.create(0, 0);
    G.shepCtl = new JHS.Entities.ShepherdCtl(w, L, G.shep);
    G.items = new JHS.Entities.Items(w, L);
    G.cam = new JHS.Camera(960, y0 - JHS.Camera.FRAME_Y);
    G.cam.x = Math.max(960, L.start.x + 192);
    G.checkpoint = { x: L.start.x, y: y0 };
    G.cine = null; G.failing = null; G.playTime = 0;
    JHS.Ambient.extraWind = 0;
    UI.dlg = null; UI.pageView = null; UI.hint = { t: 0, show: false };
    G.rayBoost = 0;
  }

  function restore(h) {
    G.checkpoint = h.checkpoint;
    if (h.seeds) h.seeds.forEach((t, i) => { if (t && G.items.seeds[i]) { G.items.seeds[i].taken = true; G.items.seeds[i].pop = 1; } });
    G.items.found = G.items.seeds.filter((s) => s.taken).length;
    G.items.page = !!h.page;
    if (h.page) { G.items.chest.open = true; }
    if (h.lanterns) h.lanterns.forEach((v, i) => { if (v && G.items.lanterns[i]) { G.items.lanterns[i].lit = true; G.items.lanterns[i].glow = 1; } });
    if (h.shepherdI != null) { G.shepCtl.i = h.shepherdI; G.shepCtl.place(Math.min(h.shepherdI, L.shepherd.length - 1)); }
    respawn();
    setState(h.state === 'play' ? 'play' : 'title');
  }

  function snapshot() {
    return {
      state: G.state === 'play' || G.state === 'pause' ? 'play' : 'title',
      checkpoint: G.checkpoint,
      seeds: G.items ? G.items.seeds.map((s) => s.taken) : [],
      page: G.items ? G.items.page : false,
      lanterns: G.items ? G.items.lanterns.map((l) => l.lit) : [],
      shepherdI: G.shepCtl ? G.shepCtl.i : 0,
    };
  }

  function respawn() {
    const cp = G.checkpoint;
    const b = G.body;
    b.x = cp.x; b.y = cp.y; b.vx = 0; b.vy = 0; b.grounded = true; b.climbing = null; b.pushing = null; b.facing = 1;
    G.girl.alpha = 1;
    G.sheepCtl.reset(cp.x - 90, G.world.groundY(cp.x - 90) || cp.y);
    G.sheepWaiting = false;
    G.cam.x = cp.x + 192; G.cam.y = cp.y - JHS.Camera.FRAME_Y; G.cam.refY = cp.y; G.cam.z = JHS.Camera.ZOOM; G.cam.mode = 'follow';
    G.failing = null;
  }

  function setState(s) {
    if (s !== G.state) G.prev = G.state;
    G.state = s;
    G.stateT = 0;
    G.menu = 0;
    if (s === 'sheet') JHS.Sheet.open();
  }

  function startPlay() {
    UI.transition(() => {
      setState('play');
      UI.hint = { t: 0, show: true };
    }, { dur: 0.7 });
  }

  // ------------------------------------------------------------------ cinemática del mirador
  function startCinematic() {
    const M = L.mirador;
    G.cine = { t: 0, said: false, blessed: false };
    G.cam.moveTo(8880, G.world.groundY(8300) - 210, 0.7, 6.5);
    G.shepCtl.startFinale(M.shepherd, M.shepherd + 190);
    UI.dlg = null;
  }

  function updateCinematic(dt, inp) {
    const c = G.cine, M = L.mirador, b = G.body, g = G.girl;
    c.t += dt;
    // la niña deja de correr y camina hasta el borde
    inp.locked = false;
    inp.run = false;
    inp.jump = false;
    inp.x = b.x < M.stand - 4 ? 1 : 0;
    if (b.x >= M.stand - 4) {
      inp.locked = true;
      b.facing = 1;
      if (!g.action) { g.action = 'look'; g.actionT = 0; g.actionDur = 0; }
    }
    JHS.Ambient.extraWind = U.clamp(c.t / 4, 0, 1) * 1.8;
    G.rayBoost = U.smoothstep(2.5, 7, c.t);
    for (const cl of G.clouds) cl.part = U.smoothstep(2, 9, c.t) * 160 * cl.side;
    if (c.t > 6.5 && !c.said) {
      c.said = true;
      G.shepCtl.fin.mode = 'speak';
      UI.say('El Buen Pastor', L.ending, () => [G.shep.x, G.shep.y - 300], {
        onEnd: () => { G.shepCtl.fin.mode = 'bless'; c.blessT = c.t; },
      });
    }
    if (c.blessT && c.t > c.blessT + 2.6 && !c.ending) {
      c.ending = true;
      const secs = Math.round(G.playTime);
      G.endInfo = { found: G.items.found, total: G.items.seeds.length, page: G.items.page, time: `Tiempo de camino: ${Math.floor(secs / 60)} min ${secs % 60} s`, sel: 0 };
      UI.transition(() => setState('end'), { dur: 1.1 });
    }
    // la oveja se acerca, se alegra y se echa a descansar
    return { forceAnim: c.t > 9 ? 'sleep' : c.t > 5 ? 'happy' : null };
  }

  // ------------------------------------------------------------------ actualización de juego
  function interactions() {
    const b = G.body, it = G.items;
    if (G.cine || G.failing) return null;
    const c = it.chest;
    if (!c.open && c.opening < 0 && Math.abs(b.x - c.x) < 74 && b.grounded) return { x: c.x, y: c.y - 100, key: 'E', label: 'abrir el cofre', act: 'chest' };
    if (G.shepCtl.canTalk(b) && !UI.dlg) return { x: G.shep.x, y: G.shep.y - 330, key: 'E', label: 'hablar', act: 'talk' };
    const s = G.sheep;
    const facingSheep = (s.x - b.x) * b.facing > 0;
    if (Math.abs(b.x - s.x) < 112 && Math.abs(b.y - s.y) < 30 && b.grounded && Math.abs(b.vx) < 10 && facingSheep && G.sheepCtl.mode === 'trail' && s.alpha > 0.9 && !G.girl.action) return { x: s.x, y: s.y - 120, key: 'E', label: 'acariciar', act: 'pet' };
    for (const l of G.world.ladders) if (!b.climbing && b.grounded && Math.abs(b.x - l.x) < 26 && b.y > l.top + 20) return { x: l.x, y: b.y - 200, key: '↑', label: 'trepar', act: null };
    return null;
  }

  function doAct(p) {
    const g = G.girl;
    if (p.act === 'chest') {
      G.items.chest.opening = 0;
      g.action = 'interact'; g.actionT = 0; g.actionDur = 1.1;
      G.body.facing = G.items.chest.x >= G.body.x ? 1 : -1;
    } else if (p.act === 'talk') {
      UI.say('El Buen Pastor', ['Aquí estoy. Sigue el sendero; no vas sola.'], () => [G.shep.x, G.shep.y - 300]);
    } else if (p.act === 'pet') {
      g.action = 'pet'; g.actionT = 0; g.actionDur = 1.6;
      G.body.facing = G.sheep.x >= G.body.x ? 1 : -1;
      G.sheep.facing = -G.body.facing;
      JHS.Sheep.setAnim(G.sheep, 'happy');
      G.sheep.expr = 'contenta'; G.sheep.exprT = 2.2;
      G.girl.expr = 'alegre'; G.girl.exprT = 2;
    }
  }

  function updatePlay(dt) {
    const b = G.body, g = G.girl, w = G.world;
    if (!G.cine) G.playTime += dt;
    if (UI.pageView) {
      if (Input.hit('act') || Input.hit('jump') || Input.tapped || (JHS.debug.bot && UI.pageView.t > 1)) UI.closePage();
    }
    // ↑ también salta, salvo junto a una escalera (allí sirve para trepar)
    const nearLadder = b.climbing || w.ladders.some((l) => Math.abs(b.x - l.x) < 60 && b.y >= l.top - 10 && b.y <= l.bottom + 10);
    const inp = {
      x: Input.axisX(), up: Input.down('up'), down: Input.down('down'),
      jump: Input.hit('jump') || (Input.hit('up') && !nearLadder),
      jumpHeld: Input.down('jump') || (Input.down('up') && !nearLadder), run: Input.down('run'),
      locked: !!UI.pageView || !!G.failing || (g.action === 'interact' || g.action === 'pet'),
    };
    inp.act = Input.hit('act');
    if (JHS.debug.bot) JHS.debug.bot(G, inp, dt);
    let sheepCtx = { secretNear: G.items.secretNear(G.sheep.x) };
    if (G.cine) sheepCtx = Object.assign(sheepCtx, updateCinematic(dt, inp));
    // acción
    const pr = interactions();
    UI.setPrompt(pr);
    if (!UI.pageView && inp.act) {
      if (UI.dlg && Math.abs(b.x - G.shep.x) < 900) UI.advance();
      else if (pr && pr.act) doAct(pr);
    }
    // física en subpasos
    const n = Math.max(1, Math.ceil(dt / (1 / 120)));
    for (let i = 0; i < n; i++) {
      JHS.Physics.step(w, b, Object.assign({}, inp, { jump: inp.jump && i === 0 }), dt / n);
      if (b.landed && b.landV > 380) JHS.Ambient.burst('dust', b.x, b.y - 2, 5 + Math.min(6, b.landV / 160));
    }
    if (b.grounded && Math.abs(b.vx) > 240 && Math.random() < dt * 9) JHS.Ambient.burst('dust', b.x - b.facing * 10, b.y - 2, 1, { dir: -b.facing });
    for (const p of w.pushables) if (p.moving && Math.random() < dt * 14) JHS.Ambient.burst('dust', p.x + (p.moving > 0 ? 6 : p.w - 6), p.y + p.h - 4, 1);
    // estado visual de la niña
    g.x = b.x; g.y = b.y; g.vx = b.vx; g.vy = b.vy; g.facing = b.facing;
    g.mode = b.mode; g.speed = Math.abs(b.vx); g.grounded = b.grounded;
    if (b.landed) g.landT = 0;
    if (b.climbing) g.climbPh = (g.climbPh + (Math.abs(b.vy) * dt) / 52) % 1;
    g.wind = JHS.Ambient.wind * 0.9;
    JHS.Girl.update(g, dt);
    // puente: el peso de la niña y de la oveja
    const loads = [];
    if (b.grounded && b.surface === 'bridge') loads.push([b.x, 1]);
    if (G.sheep.x > w.bridge.x0 && G.sheep.x < w.bridge.x1 && G.sheepCtl.mode === 'trail') loads.push([G.sheep.x, 0.35]);
    w.updateBridge(dt, loads);
    // oveja: espera comiendo hasta que la niña se acerca
    if (G.sheepWaiting) {
      if (Math.abs(b.x - G.sheep.x) < 170) {
        G.sheepWaiting = false;
        G.sheepCtl.trail = [{ x: G.sheep.x, y: G.sheep.y, ok: true, g: true, climb: false, d: 0, kind: 'ground' }];
        G.sheepCtl.d = 0;
        G.sheep.expr = 'contenta'; G.sheep.exprT = 1.5;
        JHS.Sheep.setAnim(G.sheep, 'happy');
      } else JHS.Sheep.setAnim(G.sheep, 'eat');
    } else {
      G.sheepCtl.record(b);
      G.sheepCtl.update(dt, b, sheepCtx);
    }
    JHS.Sheep.update(G.sheep, dt);
    G.shepCtl.update(dt, b, UI);
    G.shep.wind = JHS.Ambient.wind * 0.5;
    JHS.Shepherd.update(G.shep, dt);
    G.items.update(dt, b, (cp) => { G.checkpoint = cp; });
    // mirador
    if (!G.cine && b.x > L.mirador.trigger && b.grounded) startCinematic();
    // caída: desvanecerse en luz y volver al último farol (§70)
    if (!G.failing && b.y > L.killY) {
      G.failing = { t: 0 };
      UI.transition(() => respawn(), { dur: 0.6, color: '#fff3d8', x: 960, y: 540 });
    }
    if (G.failing) { G.failing.t += dt; g.alpha = Math.max(0, 1 - G.failing.t * 2); }
    // cámara
    if (G.cam.mode === 'cine') G.cam.updateCine(dt);
    else G.cam.follow(b, dt, L);
    JHS.Ambient.update(dt, G.cam, b);
    UI.updateDialogue(dt);
    if (Input.hit('pause')) setState('pause');
  }

  // ------------------------------------------------------------------ dibujo de escena
  function drawClouds(ctx, r) {
    const sky = G.layers.sky;
    const span = sky.x1 - sky.x0 + 900;
    for (const c of G.clouds) {
      let x = c.x + c.part + (G.reduced ? 0 : G.t * c.v);
      x = ((x - sky.x0 + 450) % span + span) % span + sky.x0 - 450;
      if (x + c.spr.w < r.x0 || x - c.spr.w > r.x1) continue;
      ctx.drawImage(c.spr.c, x - c.spr.ox, c.y - c.spr.oy, c.spr.w, c.spr.h);
    }
  }

  function drawRays(ctx) {
    const SUN = JHS.Scenery.SUN;
    const a = (0.36 + 0.06 * Math.sin(G.t * 0.45)) * (1 + G.rayBoost * 1.2);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = Math.min(1, a);
    ctx.translate(SUN.x, SUN.y);
    ctx.rotate(Math.sin(G.t * 0.07) * 0.015);
    ctx.drawImage(G.spr.rays.c, -G.spr.rays.ox, -G.spr.rays.oy, G.spr.rays.w, G.spr.rays.h);
    ctx.globalAlpha = 0.55 + G.rayBoost * 0.3;
    ctx.drawImage(G.spr.glow.c, -260, -260, 520, 520);
    ctx.restore();
  }

  function drawBridge(ctx, front) {
    const w = G.world, br = w.bridge;
    const ropeY = (x) => w.bridgeY(x, true) - 46 - 6 * Math.sin(Math.PI * (x - br.x0) / (br.x1 - br.x0));
    const pts = [];
    for (let x = br.x0; x <= br.x1; x += 12) pts.push([x, ropeY(x)]);
    if (!front) {
      Paint.ink(ctx, pts.map(([x, y]) => [x, y - 4]), { w: 2, alpha: 0.55, color: P.woodShade, seed: 5, wobble: 0.2 });
      Paint.ink(ctx, pts.map(([x]) => [x, w.bridgeY(x, true) + 7]), { w: 2.2, alpha: 0.75, color: P.woodShade, seed: 6, wobble: 0.2 });
      let i = 0;
      for (let x = br.x0 + 13; x < br.x1 - 8; x += 26, i++) {
        const inHole = br.holes.some(([a, b]) => x > a - 6 && x < b + 6);
        const y = w.bridgeY(x, true);
        const sl = Math.atan2(w.bridgeY(x + 6, true) - w.bridgeY(x - 6, true), 12);
        if (inHole) {
          if (i % 2) { // tabla rota colgando
            ctx.save(); ctx.translate(x - 8, y + 2); ctx.rotate(1.2); ctx.globalAlpha = 0.85;
            const s = G.spr.planks[i % 3]; ctx.drawImage(s.c, -s.ox, -s.oy, s.w * 0.6, s.h); ctx.restore();
          }
          continue;
        }
        const s = G.spr.planks[i % 3];
        ctx.save(); ctx.translate(x, y); ctx.rotate(sl); ctx.drawImage(s.c, -s.ox, -s.oy, s.w, s.h); ctx.restore();
      }
    } else {
      Paint.ink(ctx, pts, { w: 2.4, alpha: 0.85, color: '#7a5634', seed: 7, wobble: 0.2 });
      ctx.strokeStyle = '#7a5634'; ctx.lineWidth = 1.3; ctx.globalAlpha = 0.75;
      ctx.beginPath();
      for (let x = br.x0 + 26; x < br.x1; x += 52) { ctx.moveTo(x, ropeY(x)); ctx.lineTo(x, w.bridgeY(x, true) + 2); }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function drawItems(ctx, r) {
    const w = G.world, it = G.items;
    for (const l of it.lanterns) {
      if (l.x < r.x0 - 200 || l.x > r.x1 + 200) continue;
      const gy = w.groundY(l.x);
      Paint.drawSprite(ctx, G.spr.lanternPost, l.x, gy);
      const lx = l.x + 28, ly = gy - 130;
      const sw = Math.sin(G.t * 1.3 + l.x) * 0.04 * (0.5 + JHS.Ambient.wind * 0.5);
      ctx.save(); ctx.translate(lx, ly); ctx.rotate(sw);
      Paint.drawSprite(ctx, l.lit ? G.spr.lampOn : G.spr.lampOff, 0, 0);
      ctx.restore();
      if (l.glow > 0.01) {
        const f = 0.85 + 0.15 * Math.sin(G.t * 9 + l.x) * Math.sin(G.t * 5.3);
        ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.55 * l.glow * f;
        ctx.drawImage(G.spr.glow.c, lx - 90, ly - 72, 180, 180); ctx.restore();
      }
    }
    const c = it.chest;
    if (c.x > r.x0 - 200 && c.x < r.x1 + 200) {
      Paint.drawSprite(ctx, c.open ? G.spr.chestOpen : G.spr.chestClosed, c.x, c.y + 2);
      if (c.open) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.35; ctx.drawImage(G.spr.glow.c, c.x - 70, c.y - 110, 140, 140); ctx.restore(); }
    }
    for (const p of w.pushables) {
      Paint.drawSprite(ctx, G.spr.boulder, p.x + p.w / 2, p.y + p.h * 0.5 + 2);
    }
    for (const sd of it.seeds) {
      if (sd.x < r.x0 - 100 || sd.x > r.x1 + 100) continue;
      if (sd.taken && sd.pop >= 1) continue;
      const bob = Math.sin(sd.t * 2.2) * 4;
      const k = sd.taken ? 1 + sd.pop * 0.8 : 1;
      const a = sd.taken ? 1 - sd.pop : 1;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = (0.45 + 0.15 * Math.sin(sd.t * 3)) * a;
      ctx.drawImage(G.spr.glow.c, sd.x - 44 * k, sd.y + bob - 44 * k, 88 * k, 88 * k);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(sd.x, sd.y + bob);
      ctx.rotate(Math.sin(sd.t * 1.4) * 0.15);
      ctx.scale(k, k);
      ctx.drawImage(G.spr.seed.c, -G.spr.seed.ox, -G.spr.seed.oy, G.spr.seed.w, G.spr.seed.h);
      ctx.restore();
    }
  }

  function drawForeground(ctx, r) {
    for (const f of G.fg) {
      if (f.x + 400 < r.x0 || f.x - 400 > r.x1) continue;
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.scale(f.flip * 1.05, 1.05);
      ctx.globalAlpha = 0.95;
      ctx.drawImage(f.spr.c, -f.spr.ox, -f.spr.oy, f.spr.w, f.spr.h);
      ctx.restore();
    }
  }

  function drawScene(ctx) {
    const base = G.base, cam = G.cam;
    let r = Layers.applyLayer(ctx, base, 0.03, cam);
    G.layers.sky.render(ctx, r);
    drawClouds(ctx, r);
    r = Layers.applyLayer(ctx, base, 0.1, cam);
    G.layers.far.render(ctx, r);
    Layers.applyLayer(ctx, base, 0.03, cam);
    drawRays(ctx);
    r = Layers.applyLayer(ctx, base, 0.25, cam);
    G.layers.mid.render(ctx, r);
    JHS.Ambient.drawBirds(ctx);
    r = Layers.applyLayer(ctx, base, 0.5, cam);
    G.layers.hills.render(ctx, r);
    r = Layers.applyWorld(ctx, base, cam);
    G.layers.play.render(ctx, r);
    JHS.Ambient.drawTrees(ctx, r, true);
    JHS.Ambient.drawTrees(ctx, r, false);
    JHS.Ambient.drawBack(ctx, r);
    drawItems(ctx, r);
    drawBridge(ctx, false);
    JHS.Shepherd.draw(ctx, G.shep);
    JHS.Sheep.draw(ctx, G.sheep);
    JHS.Girl.draw(ctx, G.girl);
    drawBridge(ctx, true);
    JHS.Ambient.drawFront(ctx, r);
    JHS.Ambient.drawButterflies(ctx, r);
    JHS.Ambient.drawParticles(ctx);
    r = Layers.applyLayer(ctx, base, 1.3, cam);
    drawForeground(ctx, r);
    // luz de amanecer y viñeta de página (muy suaves)
    screenSet(ctx);
    const [sx, sy] = Layers.layerToScreen(0.03, cam, JHS.Scenery.SUN.x, JHS.Scenery.SUN.y);
    const gl = ctx.createRadialGradient(sx, sy, 0, sx, sy, 1400);
    gl.addColorStop(0, `rgba(255,226,170,${0.16 + G.rayBoost * 0.12})`);
    gl.addColorStop(1, 'rgba(255,226,170,0)');
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = gl;
    ctx.fillRect(0, 0, 1920, 1080);
    ctx.globalCompositeOperation = 'multiply';
    const vg = ctx.createRadialGradient(960, 540, 600, 960, 540, 1250);
    vg.addColorStop(0, 'rgba(255,255,255,0)');
    vg.addColorStop(1, 'rgba(196,160,120,0.35)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, 1920, 1080);
    ctx.globalCompositeOperation = 'source-over';
  }

  function worldToScreen(x, y) {
    const c = G.cam;
    return [(x - c.x) * c.z + 960, (y - c.y) * c.z + 540];
  }

  // ------------------------------------------------------------------ bucle
  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    // hasta 0,1 s por cuadro: en equipos lentos el juego sigue a tiempo real (la física usa subpasos)
    const dt = Math.min(0.1, last ? (now - last) / 1000 : 1 / 60);
    last = now;
    adaptQuality(dt);
    G.t += dt;
    G.stateT += dt;
    Input.begin();
    if (Input.touch.active) G.touchMode = true;
    try {
      const t0 = performance.now();
      // escala de tiempo solo para pruebas automáticas (simular más tiempo por cuadro)
      for (let k = 1; k < (G.timeScale || 1); k++) { update(dt); Input.end(); Input.begin(); }
      update(dt);
      const t1 = performance.now();
      render(dt);
      const t2 = performance.now();
      G.perf.u = U.lerp(G.perf.u, t1 - t0, 0.05);
      G.perf.r = U.lerp(G.perf.r, t2 - t1, 0.05);
      G.perf.dt = U.lerp(G.perf.dt, dt, 0.05);
    } catch (e) {
      console.error(e);
    }
    Input.end();
  }

  // Si los cuadros van lentos durante un rato, se baja la resolución del lienzo (no en pruebas automáticas).
  function adaptQuality(dt) {
    if (navigator.webdriver || G.state !== 'play' || G.quality <= 0.55) return;
    G.slowT = dt > 1 / 32 ? G.slowT + dt : Math.max(0, G.slowT - dt * 2);
    if (G.slowT > 2.5) { G.quality = Math.max(0.55, G.quality - 0.15); G.slowT = 0; resize(); }
  }

  function menuNav(n) {
    if (Input.hit('up')) G.menu = (G.menu + n - 1) % n;
    if (Input.hit('down')) G.menu = (G.menu + 1) % n;
  }
  function confirm() { return Input.hit('act') || Input.hit('jump'); }
  function tapMenu(y0, gap, n) {
    if (!Input.tapped || !Input.tapPos) return -1;
    const [x, y] = Input.tapPos;
    if (x < 600 || x > 1320) return -1;
    for (let i = 0; i < n; i++) if (Math.abs(y - (y0 + i * gap - 12)) < gap / 2) return i;
    return -1;
  }

  function update(dt) {
    if (G.state === 'loading') return;
    if (G.portrait && G.touchMode) return;
    if (G.state === 'title') {
      // de fondo, la escena viva en su posición inicial
      idleScene(dt);
      menuNav(2);
      const tp = tapMenu(440, 62, 2);
      if (tp >= 0) G.menu = tp;
      if (!UI.trans && Input.hit('sheet')) setState('sheet');
      else if (!UI.trans && (confirm() || tp >= 0)) {
        if (G.menu === 0) startPlay(); else setState('sheet');
      }
    } else if (G.state === 'play') {
      updatePlay(dt);
    } else if (G.state === 'pause') {
      menuNav(4);
      const tp = tapMenu(450, 70, 4);
      if (tp >= 0) G.menu = tp;
      if (Input.hit('pause')) setState('play');
      else if (Input.hit('sheet')) setState('sheet');
      else if (confirm() || tp >= 0) {
        if (G.menu === 0) setState('play');
        else if (G.menu === 1) { setState('play'); G.body.y = L.killY + 10; }
        else if (G.menu === 2) setState('sheet');
        else { UI.transition(() => { newGame(); setState('title'); }); }
      }
    } else if (G.state === 'end') {
      idleScene(dt, true);
      menuNav(2);
      G.endInfo.sel = G.menu;
      const tp = tapMenu(730, 60, 2);
      if (tp >= 0) G.menu = G.endInfo.sel = tp;
      if (G.stateT > 1 && (confirm() || tp >= 0)) {
        if (G.menu === 0) UI.transition(() => { newGame(); setState('play'); UI.hint = { t: 0, show: true }; });
        else setState('sheet');
      }
    } else if (G.state === 'sheet') {
      JHS.Sheet.update(dt);
      if (Input.hit('left')) JHS.Sheet.nav(-1);
      if (Input.hit('right') || (Input.tapped && Input.tapPos && Input.tapPos[0] > 1500)) JHS.Sheet.nav(1);
      if (Input.tapped && Input.tapPos && Input.tapPos[0] < 420 && Input.tapPos[1] > 900) JHS.Sheet.nav(-1);
      if (Input.hit('pause') || Input.hit('sheet') || (Input.tapped && Input.tapPos && Input.tapPos[1] < 110 && Input.tapPos[0] < 820)) {
        setState(G.prev === 'pause' ? 'pause' : G.prev === 'end' ? 'end' : 'title');
      }
    }
  }

  // escena «respirando» en los menús
  function idleScene(dt, keepCam) {
    const g = G.girl;
    g.mode = 'ground'; g.speed = 0; g.vx = 0; g.wind = JHS.Ambient.wind * 0.9;
    JHS.Girl.update(g, dt);
    JHS.Sheep.update(G.sheep, dt);
    JHS.Shepherd.update(G.shep, dt);
    JHS.Ambient.update(dt, G.cam, G.body);
    if (!keepCam && G.state === 'title') { G.cam.x = Math.max(960, G.body.x + 192); G.cam.y = G.body.y - JHS.Camera.FRAME_Y; }
  }

  function render(dt) {
    const ctx = G.ctx, b = G.base;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    if (!G.frameColor || G.t - (G.frameT || 0) > 1) { G.frameColor = getComputedStyle(document.body).getPropertyValue('--frame').trim() || '#1d1712'; G.frameT = G.t; }
    ctx.fillStyle = G.frameColor;
    ctx.fillRect(0, 0, b.W, b.H);
    if (G.portrait && G.touchMode && G.state !== 'loading') {
      // a pantalla completa, sin el marco 16:9
      UI.drawRotate(ctx, b.W, b.H);
      return;
    }
    ctx.save();
    ctx.beginPath();
    ctx.rect(b.ox, b.oy, 1920 * b.s, 1080 * b.s);
    ctx.clip();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (G.state === 'loading') {
      screenSet(ctx);
      UI.drawLoading(ctx, G.load.frac, G.load.label);
    } else if (G.state === 'sheet') {
      screenSet(ctx);
      JHS.Sheet.draw(ctx);
    } else {
      drawScene(ctx);
      screenSet(ctx);
      if (G.state === 'play' || G.state === 'pause') {
        UI.drawHUD(ctx, dt, { found: G.items.found, total: G.items.seeds.length, page: G.items.page });
        UI.drawPrompt(ctx, worldToScreen, G.touchMode);
        UI.drawDialogue(ctx, worldToScreen);
        if (!G.cine) UI.drawHint(ctx, dt, G.touchMode);
        UI.drawPage(ctx, dt);
        if (G.touchMode && G.state === 'play' && !G.cine) UI.drawTouch(ctx, Input);
      }
      if (G.state === 'title') UI.drawTitle(ctx, G.stateT, G.menu, G.touchMode);
      if (G.state === 'pause') UI.drawPause(ctx, G.menu);
      if (G.state === 'end') UI.drawEnd(ctx, G.stateT, G.endInfo);
    }
    screenSet(ctx);
    UI.drawTransition(ctx, dt);
    ctx.restore();
  }

  // ------------------------------------------------------------------ pruebas automáticas
  JHS.debug = {
    G,
    teleport(x) { const w = G.world; const y = w.groundY(x) ?? w.bridgeY(x, true) ?? 700; G.body.x = x; G.body.y = y; G.body.vx = 0; G.body.vy = 0; G.body.grounded = true; G.body.climbing = null; G.body.pushing = null; G.cam.x = x + 192; G.cam.y = y - JHS.Camera.FRAME_Y; G.cam.refY = y; G.sheepWaiting = false; const sx = x - 100; G.sheepCtl.reset(sx, w.groundY(sx) ?? w.bridgeY(sx, true) ?? y); },
    play() { setState('play'); UI.hint = { t: 0, show: true }; },
    state() { return { state: G.state, x: G.body && G.body.x, y: G.body && G.body.y, mode: G.body && G.body.mode, seeds: G.items && G.items.found, sheep: G.sheep && [G.sheep.x, G.sheep.y, G.sheepCtl.mode], shepherd: G.shepCtl && [G.shepCtl.i, G.shepCtl.state] }; },
    setState,
    memory() { const out = {}; let px = 0; for (const k in G.layers) { const m = G.layers[k].memory(); px += m; out[k] = Math.round(m * 4 / 1048576); } out.total = Math.round(px * 4 / 1048576); return out; },
  };

  JHS.start = function (hot) {
    if (window.claude && window.claude.hot && window.claude.hot.snapshot) {
      try { window.claude.hot.snapshot(snapshot); } catch (e) { /* visor sin recarga en caliente */ }
    }
    boot(hot || {});
  };
})(window.JHS = window.JHS || {});
