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
    JHS.Sound.init();
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
    G.spr.bells = [JHS.Props.bellflower(941), JHS.Props.bellflower(947), JHS.Props.bellflower(953)];
    G.world = new JHS.Physics.World(L);
    JHS.Ambient.init(L, G.world);
    JHS.Life.init(L, G.world);
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
    JHS.Life.world = w;
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
    G.cine = null; G.failing = null; G.playTime = 0; G.autoWalk = null;
    G.prints = []; G.seated = null; G.mantle = null; G.pending = null; G.girlBubble = null; G.shook = {}; G.apart = false; G.crouchT = 0;
    JHS.Ambient.extraWind = 0;
    UI.dlg = null; UI.pageView = null; UI.hint = { t: 0, show: false };
    UI.fly = []; UI.hud.showFlowers = false;
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
    G.girl.offX = 0; G.girl.offY = 0; G.mantle = null; G.seated = null; G.girl.bench = false;
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
    G.cine = { t: 0, said: false, blessed: false, gift: G.items.picked > 0 && !!L.gift };
    G.cam.moveTo(8880, G.world.groundY(8300) - 210, 0.7, 6.5);
    G.shepCtl.startFinale(M.shepherd, M.shepherd + 190);
    G.seated = null;
    G.girl.bench = false;
    UI.dlg = null;
  }

  function endingLines() {
    const c = G.cine;
    G.shepCtl.fin.mode = 'speak';
    UI.say('El Buen Pastor', L.ending, () => [G.shep.x, G.shep.y - 300], {
      onEnd: () => { G.shepCtl.fin.mode = 'bless'; c.blessT = c.t; if (JHS.Sound) JHS.Sound.play('bless'); },
    });
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
      if (c.phase !== 'gift') b.facing = 1;
      if (!g.action) { g.action = 'look'; g.actionT = 0; g.actionDur = 0; }
    }
    JHS.Ambient.extraWind = U.clamp(c.t / 4, 0, 1) * 1.8;
    G.rayBoost = U.smoothstep(2.5, 7, c.t);
    for (const cl of G.clouds) cl.part = U.smoothstep(2, 9, c.t) * 160 * cl.side;
    if (c.t > 6.5 && !c.said) {
      c.said = true;
      if (c.gift) {
        // se vuelve hacia el Pastor y le ofrece las campanillas
        c.phase = 'gift';
        b.facing = -1;
        g.action = 'offer'; g.actionT = 0; g.actionDur = 0;
        G.shepCtl.fin.toX = Math.max(G.shepCtl.fin.toX, b.x - 128);
        G.shepCtl.fin.mode = 'kneel';
        UI.say('La niña', L.gift.girl, () => [b.x, b.y - 250], {
          onEnd: () => {
            g.carry = 0;
            G.shep.flowers = true;
            const h = G.shep.handWorld || [G.shep.x + 60, G.shep.y - 150];
            JHS.Ambient.burst('bell', h[0], h[1], 10);
            JHS.Ambient.burst('gold', h[0], h[1], 10);
            if (JHS.Sound) JHS.Sound.play('gift');
            G.shepCtl.fin.mode = 'speak';
            UI.say('El Buen Pastor', L.gift.shepherd, () => [G.shep.x, G.shep.y - 300], {
              onEnd: () => { c.phase = 'view'; b.facing = 1; g.action = 'look'; g.actionT = 0; endingLines(); },
            });
          },
        });
      } else endingLines();
    }
    if (c.blessT && c.t > c.blessT + 2.6 && !c.ending) {
      c.ending = true;
      const secs = Math.round(G.playTime);
      G.endInfo = { found: G.items.found, total: G.items.total(), page: G.items.page, flowers: G.items.picked, flowersTotal: G.items.flowers.length,
        time: `Tiempo de camino: ${Math.floor(secs / 60)} min ${secs % 60} s`, sel: 0 };
      UI.transition(() => setState('end'), { dur: 1.1 });
    }
    // la oveja se acerca, se alegra y se echa a descansar
    return { forceAnim: c.t > 9 ? 'sleep' : c.t > 5 ? 'happy' : null };
  }

  // ------------------------------------------------------------------ actualización de juego
  // ¿Hay algo donde apoyar el pie en x (a la altura y o un poco más abajo)?
  function supportedAt(x, y) {
    const w = G.world;
    const gy = w.groundY(x);
    if (gy != null && gy <= y + 34) return true;
    for (const s of w.solids.concat(w.pushables)) if (x > s.x - 2 && x < s.x + s.w + 2 && s.y <= y + 34 && s.y >= y - 220) return true;
    for (const l of w.ledges) if (x >= l.x0 && x <= l.x1 && Math.abs(l.y - y) < 34) return true;
    const by = w.bridgeY(x);
    return by != null && by <= y + 34;
  }

  // Lo que la niña mira cuando está tranquila.
  function interestFor(b) {
    if (UI.dlg && G.shep.alpha > 0.5 && Math.abs(G.shep.x - b.x) < 600) return { x: G.shep.x, y: G.shep.y - 250 };
    let best = null, bd = 260;
    for (const sd of G.items.seeds) {
      if (sd.taken || sd.hidden) continue;
      const d = Math.hypot(sd.x - b.x, sd.y - (b.y - 90));
      if (d < bd) { bd = d; best = { x: sd.x, y: sd.y }; }
    }
    if (best) return best;
    for (const f of G.items.flowers) if (!f.picked && Math.abs(f.x - b.x) < 160) return { x: f.x, y: f.y - 20 };
    const s = G.sheep;
    if (Math.abs(s.x - b.x) < 230 && s.alpha > 0.9) return { x: s.x, y: s.y - 50 };
    for (const bf of JHS.Ambient.butterflies) if (Math.hypot(bf.x - b.x, bf.y - (b.y - 120)) < 220) return { x: bf.x, y: bf.y };
    for (const l of G.items.lanterns) if ((l.flare || 0) > 0.2) return { x: l.x + 28, y: G.world.groundY(l.x) - 130 };
    return null;
  }

  function interactions() {
    const b = G.body, it = G.items, g = G.girl;
    if (G.cine || G.failing || G.autoWalk || G.mantle) return null;
    if (G.seated) return { x: b.x, y: b.y - 232, key: '←→', label: 'levantarse', act: null };
    if (!b.grounded || g.action || UI.dlg) return null;
    const head = b.y - 212;
    const c = it.chest;
    if (!c.open && c.opening < 0 && Math.abs(b.x - c.x) < 74) return { x: c.x, y: Math.min(c.y - 100, head), key: 'E', label: 'abrir el cofre', act: 'chest' };
    const f = it.flowerNear(b.x);
    if (f && Math.abs(f.y - b.y) < 30) return { x: f.x, y: head, key: 'E', label: 'recoger la campanilla', act: 'flower', f };
    if (G.shepCtl.canTalk(b)) return { x: G.shep.x, y: G.shep.y - 330, key: 'E', label: 'hablar', act: 'talk' };
    for (const bn of L.decor.bench) if (Math.abs(b.x - bn.x) < 70 && Math.abs(G.world.groundY(bn.x) - b.y) < 20) return { x: bn.x, y: head, key: 'E', label: 'sentarse', act: 'bench', bn };
    const sg = L.sign;
    if (sg && Math.abs(b.x - sg.x) < 60) return { x: sg.x, y: head, key: 'E', label: 'leer el letrero', act: 'sign' };
    for (const tr of L.shakeTrees || []) {
      const gy = G.world.groundY(tr.x);
      if (Math.abs(b.x - tr.x) < 58 && gy != null && Math.abs(gy - b.y) < 24 && !(G.shook && G.shook[tr.x] > 0)) return { x: tr.x, y: head, key: 'E', label: 'sacudir el árbol', act: 'shake', tr };
    }
    const s = G.sheep;
    const facingSheep = (s.x - b.x) * b.facing > 0;
    if (Math.abs(b.x - s.x) < 112 && Math.abs(b.y - s.y) < 30 && Math.abs(b.vx) < 10 && facingSheep && G.sheepCtl.mode === 'trail' && s.alpha > 0.9) return { x: (s.x + b.x) / 2, y: head, key: 'E', label: 'acariciar', act: 'pet' };
    for (const l of G.world.ladders) if (!b.climbing && Math.abs(b.x - l.x) < 26 && b.y > l.top + 20) return { x: l.x, y: head, key: '↑', label: 'trepar', act: null };
    return null;
  }

  function doAct(p) {
    const g = G.girl, b = G.body, it = G.items;
    if (p.act === 'chest') {
      // se coloca a un lado del cofre, de cara a él, y se agacha a abrirlo
      const c = it.chest, side = b.x < c.x ? -1 : 1;
      walkTo(c.x + side * 52, -side, () => {
        c.opening = 0;
        g.action = 'interact'; g.actionT = 0; g.actionDur = 1.1;
      });
    } else if (p.act === 'flower') {
      const f = p.f;
      b.facing = f.x >= b.x ? 1 : -1;
      g.action = 'pick'; g.actionT = 0; g.actionDur = 0.95;
      G.pending = { t: 0.42, fn: () => {
        f.picked = true; f.pickT = 0;
        it.picked++;
        g.carry = it.picked;
        UI.hud.showFlowers = true;
        JHS.Ambient.burst('bell', f.x, f.y - 22, 6);
        UI.flyToHud('flower', f.x, f.y - 24);
        g.expr = 'alegre'; g.exprT = 1.4;
        if (JHS.Sound) JHS.Sound.play('pick');
      } };
    } else if (p.act === 'talk') {
      const lines = L.chat || ['Aquí estoy.'];
      G.chatI = ((G.chatI || 0) + 1) % lines.length;
      G.shepCtl.chatting = true;
      UI.say('El Buen Pastor', [lines[G.chatI]], () => [G.shep.x, G.shep.y - 300], { onEnd: () => { G.shepCtl.chatting = false; } });
    } else if (p.act === 'pet') {
      g.action = 'pet'; g.actionT = 0; g.actionDur = 1.6;
      b.facing = G.sheep.x >= b.x ? 1 : -1;
      G.sheep.facing = -b.facing;
      JHS.Sheep.setAnim(G.sheep, 'happy');
      G.sheep.expr = 'contenta'; G.sheep.exprT = 2.2;
      G.sheep.wag = 2;
      g.expr = 'alegre'; g.exprT = 2;
      if (Math.random() < 0.6) G.pending = { t: 0.7, fn: () => { JHS.Sheep.bleat(G.sheep); if (JHS.Sound) JHS.Sound.play('bleat'); } };
    } else if (p.act === 'bench') {
      walkTo(p.bn.x - 8, 1, () => { G.seated = p.bn; G.seatT = 0; g.bench = true; b.facing = 1; if (JHS.Sound) JHS.Sound.play('wood'); });
    } else if (p.act === 'sign') {
      b.facing = L.sign.x >= b.x ? 1 : -1;
      g.action = 'read'; g.actionT = 0; g.actionDur = 0;
      UI.say('Letrero', L.sign.lines, () => [L.sign.x + 30, G.world.groundY(L.sign.x) - 150], { onEnd: () => { if (g.action === 'read') g.action = null; } });
    } else if (p.act === 'shake') {
      b.facing = p.tr.x >= b.x ? 1 : -1;
      g.action = 'shake'; g.actionT = 0; g.actionDur = 1.15;
      G.shook = G.shook || {};
      G.shook[p.tr.x] = 6;
      G.pending = { t: 0.2, fn: () => {
        JHS.Ambient.shakeTree(p.tr.x);
        if (it.shakeTree(p.tr.x)) { g.expr = 'sorpresa'; g.exprT = 1.2; }
        if (JHS.Sound) JHS.Sound.play('leaves');
        G.cam.shake = 0.25;
      } };
    }
  }

  // Caminar sola hasta un punto (para colocarse antes de una interacción).
  function walkTo(x, face, then) { G.autoWalk = { x, face, then, t: 0 }; }

  function updateAutoWalk(dt, inp) {
    const aw = G.autoWalk, b = G.body;
    if (!aw) return;
    const dx = aw.x - b.x;
    if (Math.abs(dx) > 4 && aw.t < 2.5 && b.grounded) {
      aw.t += dt;
      inp.x = Math.sign(dx); inp.run = false; inp.jump = false; inp.up = false; inp.locked = false;
    } else {
      G.autoWalk = null;
      inp.x = 0;
      b.vx = 0;
      b.facing = aw.face;
      aw.then();
    }
  }

  // La niña llama a la oveja: manos en la boca, bocadillo y la oveja acude.
  function callSheep() {
    const g = G.girl;
    g.action = 'call'; g.actionT = 0; g.actionDur = 1.05;
    G.girlBubble = { text: '¡Ven, ovejita!', t: 1.5 };
    if (G.sheepWaiting) endSheepWait();
    G.sheepCtl.call();
    JHS.Ambient.scare(G.body.x, 300);
    if (JHS.Sound) JHS.Sound.play('call');
  }

  function endSheepWait() {
    G.sheepWaiting = false;
    G.sheepCtl.trail = [{ x: G.sheep.x, y: G.sheep.y, ok: true, g: true, climb: false, d: 0, kind: 'ground' }];
    G.sheepCtl.d = 0;
    G.sheep.expr = 'contenta'; G.sheep.exprT = 1.5;
    JHS.Sheep.setAnim(G.sheep, 'happy');
  }

  // Eventos de la animación (pasos): polvo, huellas, el puente que cede y el sonido.
  function handleGirlEvents() {
    const g = G.girl, b = G.body, w = G.world;
    for (const ev of g.events) {
      if (ev.type !== 'step' || !b.grounded) continue;
      const surf = b.surface;
      if (surf === 'ground') {
        const gy = w.groundY(ev.x);
        if (gy != null) {
          G.prints.push({ x: ev.x, y: gy + 3, t: 0, f: b.facing, r: (Math.random() - 0.5) * 0.3 });
          if (G.prints.length > 70) G.prints.shift();
          if (ev.run > 0.5 || ev.push) JHS.Ambient.burst('dust', ev.x, gy - 1, ev.push ? 2 : 1, { dir: -b.facing, s: 0.7 });
        }
      } else if (surf === 'bridge') {
        w.bridge.dispV += 26 + ev.run * 30;
        G.bridgeKick = { x: ev.x, t: 0 };
      } else if (surf === 'branch' || surf === 'log') {
        if (Math.random() < 0.4) JHS.Ambient.burst('leaf', ev.x, b.y + 4, 1);
      }
      if (JHS.Sound) JHS.Sound.step(surf, ev.run);
    }
    g.events.length = 0;
  }

  function updatePlay(dt) {
    const b = G.body, g = G.girl, w = G.world;
    if (!G.cine) G.playTime += dt;
    if (UI.pageView) {
      if (Input.hit('act') || Input.hit('jump') || Input.tapped || (JHS.debug.bot && UI.pageView.t > 1)) UI.closePage();
    }
    // ↑ también salta, salvo junto a una escalera (allí sirve para trepar)
    const nearLadder = b.climbing || w.ladders.some((l) => Math.abs(b.x - l.x) < 60 && b.y >= l.top - 10 && b.y <= l.bottom + 10);
    const atLadderTop = w.ladders.some((l) => Math.abs(b.x - l.x) < 46 && Math.abs(b.y - l.top) < 8);
    const inp = {
      x: Input.axisX(), up: Input.down('up'), down: Input.down('down'),
      jump: Input.hit('jump') || (Input.hit('up') && !nearLadder),
      jumpHeld: Input.down('jump') || (Input.down('up') && !nearLadder), run: Input.down('run'),
      locked: !!UI.pageView || !!G.failing || !!G.mantle || ['interact', 'pet', 'pick', 'shake', 'call'].includes(g.action),
    };
    inp.act = Input.hit('act');
    inp.call = Input.hit('call');
    if (JHS.debug.bot) JHS.debug.bot(G, inp, dt);
    if (G.autoWalk) { updateAutoWalk(dt, inp); inp.act = false; }
    // sentada en un banco: cualquier movimiento la levanta
    if (G.seated) {
      G.seatT += dt;
      if (inp.x !== 0 || inp.jump || inp.up) { G.seated = null; g.bench = false; inp.jump = false; inp.x = 0; }
      else { inp.locked = true; g.tired = 0; }
    }
    // agacharse (y mirar hacia abajo si se mantiene)
    g.crouch = inp.down && b.grounded && !b.climbing && inp.x === 0 && !atLadderTop && !G.seated && !g.action;
    G.crouchT = g.crouch ? (G.crouchT || 0) + dt : 0;
    let sheepCtx = { secretNear: G.items.secretNear(G.sheep.x) };
    if (G.cine) sheepCtx = Object.assign(sheepCtx, updateCinematic(dt, inp));
    else if (G.seated && G.seatT > 3) sheepCtx.forceAnim = 'sleep';
    // acción
    const pr = interactions();
    UI.setPrompt(pr);
    if (!UI.pageView && inp.act) {
      if (UI.dlg && Math.abs(b.x - G.shep.x) < 900) UI.advance();
      else if (UI.dlg && UI.dlg.speaker === 'Letrero') UI.advance();
      else if (pr && pr.act) doAct(pr);
    }
    if (inp.call && !G.cine && b.grounded && !g.action && !G.autoWalk && !UI.pageView) callSheep();
    if (g.action === 'read' && (inp.x !== 0 || !b.grounded || !UI.dlg || UI.dlg.speaker !== 'Letrero')) g.action = null;
    if (UI.dlg && UI.dlg.speaker === 'Letrero' && Math.abs(b.x - L.sign.x) > 260) UI.cancel();
    if (G.pending) { G.pending.t -= dt; if (G.pending.t <= 0) { const fn = G.pending.fn; G.pending = null; fn(); } }
    // frenada: soltar o invertir la dirección a toda carrera
    const braking = b.grounded && !b.climbing && Math.abs(b.vx) > 190 && (inp.x === 0 || Math.sign(inp.x) !== Math.sign(b.vx)) && !inp.locked;
    if (braking && !g.brake) { JHS.Ambient.burst('dust', b.x + Math.sign(b.vx) * 14, b.y - 2, 4, { dir: Math.sign(b.vx) }); if (JHS.Sound) JHS.Sound.play('skid'); }
    g.brake = braking;
    // física en subpasos
    const wasClimb = b.climbing;
    const n = Math.max(1, Math.ceil(dt / (1 / 120)));
    for (let i = 0; i < n; i++) {
      JHS.Physics.step(w, b, Object.assign({}, inp, { jump: inp.jump && i === 0 }), dt / n);
      if (b.landed && b.landV > 380) {
        JHS.Ambient.burst('dust', b.x, b.y - 2, 5 + Math.min(6, b.landV / 160));
        if (b.surface === 'bridge') w.bridge.dispV += b.landV * 0.12;
        if (JHS.Sound) JHS.Sound.land(b.surface, b.landV);
      }
      if (b.jumpedNow) { b.jumpedNow = false; if (JHS.Sound) JHS.Sound.play('jump'); }
    }
    // al llegar arriba de la escalera, se encarama al borde (transición visual)
    if (wasClimb && !b.climbing && b.grounded && Math.abs(b.y - wasClimb.top) < 2) {
      G.mantle = { t: 0, dx: wasClimb.x - b.x, dy: 26 };
      g.action = 'mantle'; g.actionT = 0; g.actionDur = 0.42;
    }
    if (G.mantle) {
      G.mantle.t += dt;
      const e = U.easeOut(U.clamp(G.mantle.t / 0.4, 0, 1));
      g.offX = G.mantle.dx * (1 - e);
      g.offY = G.mantle.dy * (1 - e);
      if (G.mantle.t >= 0.42) { G.mantle = null; g.offX = 0; g.offY = 0; }
    }
    for (const p of w.pushables) {
      if (p.moving && Math.random() < dt * 14) JHS.Ambient.burst('dust', p.x + (p.moving > 0 ? 6 : p.w - 6), p.y + p.h - 4, 1);
      p.dist = (p.dist || 0) + Math.abs(p.x - (p.lastX == null ? p.x : p.lastX));
      p.lastX = p.x;
      p.tilt = U.damp(p.tilt || 0, p.moving ? Math.sin(p.dist * 0.11) * 0.03 : 0, 9, dt);
      if (p.moving && JHS.Sound) JHS.Sound.scrape(dt);
      if (p.moving) G.cam.shake = Math.max(G.cam.shake, 0.04);
    }
    // estado visual de la niña
    g.x = b.x; g.y = b.y; g.vx = b.vx; g.vy = b.vy; g.facing = b.facing;
    g.mode = b.mode; g.speed = Math.abs(b.vx); g.grounded = b.grounded;
    if (b.landed) g.landT = 0;
    if (b.climbing) g.climbPh = (g.climbPh + (Math.abs(b.vy) * dt) / 52) % 1;
    g.wind = JHS.Ambient.wind * 0.9;
    g.teeter = b.grounded && !b.climbing && Math.abs(b.vx) < 5 && !G.seated && !g.action && supportedAt(b.x, b.y) && !supportedAt(b.x + b.facing * 15, b.y);
    g.lookAt = interestFor(b);
    JHS.Girl.update(g, dt);
    handleGirlEvents();
    // vaho del aliento en el aire frío de la mañana
    G.breathT = (G.breathT == null ? 2 : G.breathT) - dt;
    if (G.breathT <= 0) {
      G.breathT = g.tired > 0.3 ? 1.1 + Math.random() * 0.6 : 3 + Math.random() * 2.5;
      if (b.grounded && !b.climbing && g.speed < 160 && g.alpha > 0.9) {
        const hx = b.x + b.facing * (g.bench ? 22 : 24), hy = b.y - (g.bench ? 116 : g.sitK > 0.5 ? 100 : 148);
        JHS.Ambient.burst('breath', hx, hy, 1, { dir: b.facing });
      }
    }
    // puente: el peso de la niña y de la oveja
    const loads = [];
    if (b.grounded && b.surface === 'bridge') loads.push([b.x, 1]);
    if (G.sheep.x > w.bridge.x0 && G.sheep.x < w.bridge.x1 && G.sheepCtl.mode === 'trail') loads.push([G.sheep.x, 0.35]);
    w.updateBridge(dt, loads);
    if (G.bridgeKick) { G.bridgeKick.t += dt; if (G.bridgeKick.t > 0.6) G.bridgeKick = null; }
    // oveja: espera comiendo hasta que la niña se acerca
    if (G.sheepWaiting) {
      if (Math.abs(b.x - G.sheep.x) < 170) endSheepWait();
      else JHS.Sheep.setAnim(G.sheep, 'eat');
    } else {
      G.sheepCtl.record(b);
      G.sheepCtl.update(dt, b, sheepCtx);
    }
    // la oveja mira a las mariposas cercanas o a la niña
    let look = null;
    for (const bf of JHS.Ambient.butterflies) if (Math.hypot(bf.x - G.sheep.x, bf.y - (G.sheep.y - 60)) < 200) { look = bf; break; }
    G.sheep.lookAt = look || (Math.abs(b.x - G.sheep.x) < 260 ? { x: b.x, y: b.y - 120 } : null);
    // se alegra y bala cuando la niña vuelve tras separarse
    const sd = Math.hypot(b.x - G.sheep.x, b.y - G.sheep.y);
    if (sd > 520) G.apart = true;
    else if (G.apart && sd < 180) { G.apart = false; JHS.Sheep.bleat(G.sheep); if (JHS.Sound) JHS.Sound.play('bleat'); }
    JHS.Sheep.update(G.sheep, dt);
    G.shepCtl.update(dt, b, UI);
    G.shep.wind = JHS.Ambient.wind * 0.5;
    JHS.Shepherd.update(G.shep, dt);
    G.items.update(dt, b, (cp) => { G.checkpoint = cp; });
    if (G.shook) for (const k in G.shook) G.shook[k] = Math.max(0, G.shook[k] - dt);
    for (const p of G.prints) p.t += dt;
    while (G.prints.length && G.prints[0].t > 10) G.prints.shift();
    if (G.girlBubble) { G.girlBubble.t -= dt; if (G.girlBubble.t <= 0) G.girlBubble = null; }
    // una mariposa se posa en el pelo si se sienta un rato
    JHS.Ambient.landOn = (G.seated && G.seatT > 4) || g.sitK > 0.9 ? { x: b.x + b.facing * 6, y: b.y - (G.seated ? 192 : 150) } : null;
    // mirador
    if (!G.cine && b.x > L.mirador.trigger && b.grounded) startCinematic();
    // caída: desvanecerse en luz y volver al último farol (§70)
    if (!G.failing && b.y > L.killY) {
      G.failing = { t: 0 };
      g.expr = 'sorpresa'; g.exprT = 1;
      if (JHS.Sound) JHS.Sound.play('fall');
      UI.transition(() => respawn(), { dur: 0.6, color: '#fff3d8', x: 960, y: 540 });
    }
    if (G.failing) { G.failing.t += dt; g.alpha = Math.max(0, 1 - G.failing.t * 2); }
    G.cam.shake = Math.max(0, (G.cam.shake || 0) - dt * 1.5);
    // cámara: asomarse al agacharse, alejarse un poco al sentarse a contemplar (§67)
    G.cam.peek = U.damp(G.cam.peek || 0, G.crouchT > 0.45 ? 150 : 0, 3, dt);
    if (G.cam.mode === 'cine') G.cam.updateCine(dt);
    else {
      G.cam.z = U.damp(G.cam.z, G.seated ? 0.96 : JHS.Camera.ZOOM, 1.4, dt);
      G.cam.follow(b, dt, L);
    }
    JHS.Ambient.update(dt, G.cam, [{ x: b.x, y: b.y, vx: b.vx }, { x: G.sheep.x, y: G.sheep.y, vx: G.sheep.speed * G.sheep.facing, big: true }]);
    JHS.Life.update(dt, G.cam);
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

  // Huellas de las botas en el sendero: se secan y desaparecen.
  function drawPrints(ctx, r) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = P.earthShade;
    for (const p of G.prints) {
      if (p.x < r.x0 - 20 || p.x > r.x1 + 20) continue;
      ctx.globalAlpha = 0.2 * (1 - U.smoothstep(6, 10, p.t)) * U.smoothstep(0, 0.15, p.t);
      ctx.beginPath(); ctx.ellipse(p.x + p.f * 2, p.y, 6.5, 1.7, p.r * 0.15, 0, U.TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(p.x - p.f * 5, p.y + 0.4, 2.6, 1.2, 0, 0, U.TAU); ctx.fill();
    }
    ctx.restore();
  }

  // Campanillas del camino: se mecen con el viento, destellan de vez en cuando y, al recogerlas,
  // se encogen dentro de la mano.
  function drawFlowers(ctx, r) {
    for (const [i, f] of G.items.flowers.entries()) {
      if (f.x < r.x0 - 60 || f.x > r.x1 + 60) continue;
      if (f.picked && f.pickT > 0.35) continue;
      const spr = G.spr.bells[i % G.spr.bells.length];
      const k = f.picked ? 1 - U.smoothstep(0, 0.35, f.pickT) : 1;
      const bend = JHS.Ambient.bendAt(f.x, f.y);
      const sw = Math.sin(f.t * 1.9 + i) * 0.07 * (0.6 + JHS.Ambient.wind * 0.4) + bend;
      ctx.save();
      ctx.translate(f.x, f.y + 3);
      ctx.rotate(sw);
      ctx.scale(1.5 * k, 1.5 * k);
      ctx.drawImage(spr.c, -spr.ox, -spr.oy, spr.w, spr.h);
      ctx.restore();
      if (!f.picked) {
        // un destello que va y viene: se distinguen de las flores del decorado
        const ph = (f.t % 2.6) / 2.6;
        const gl = ph < 0.5 ? Math.sin(ph * Math.PI * 2) : 0;
        if (gl > 0.02) {
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = 0.55 * gl;
          ctx.drawImage(G.spr.glow.c, f.x - 30 + sw * 36, f.y - 74, 60, 60);
          ctx.restore();
        }
      }
    }
  }

  function drawItems(ctx, r) {
    const w = G.world, it = G.items;
    drawPrints(ctx, r);
    drawFlowers(ctx, r);
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
        ctx.drawImage(G.spr.glow.c, lx - 90, ly - 72, 180, 180);
        // al encenderse, un anillo de luz que se abre
        if (l.flare > 0.01) {
          const k = 1 - l.flare, R = 60 + k * 260;
          ctx.globalAlpha = 0.5 * l.flare;
          ctx.drawImage(G.spr.glow.c, lx - R, ly + 18 - R, R * 2, R * 2);
        }
        ctx.restore();
      }
    }
    const c = it.chest;
    if (c.x > r.x0 - 200 && c.x < r.x1 + 200) {
      Paint.drawSprite(ctx, c.open ? G.spr.chestOpen : G.spr.chestClosed, c.x, c.y + 2);
      if (c.open) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.35; ctx.drawImage(G.spr.glow.c, c.x - 70, c.y - 110, 140, 140); ctx.restore(); }
    }
    for (const p of w.pushables) {
      // la roca se balancea un poco sobre su base mientras se arrastra
      ctx.save();
      ctx.translate(p.x + p.w / 2 + (p.tilt || 0) * 40, p.y + p.h + 2);
      ctx.rotate(p.tilt || 0);
      ctx.drawImage(G.spr.boulder.c, -G.spr.boulder.ox, -G.spr.boulder.oy, G.spr.boulder.w, G.spr.boulder.h);
      ctx.restore();
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
    const sh = G.reduced ? 0 : Math.min(1, cam.shake || 0);
    const jx = sh ? Math.sin(G.t * 71) * sh * 14 : 0, jy = sh ? Math.cos(G.t * 57) * sh * 9 : 0;
    cam.x += jx; cam.y += jy;
    try { drawSceneLayers(ctx, base, cam); } finally { cam.x -= jx; cam.y -= jy; }
  }

  function drawSceneLayers(ctx, base, cam) {
    let r = Layers.applyLayer(ctx, base, 0.03, cam);
    G.layers.sky.render(ctx, r);
    drawClouds(ctx, r);
    r = Layers.applyLayer(ctx, base, 0.1, cam);
    G.layers.far.render(ctx, r);
    Layers.applyLayer(ctx, base, 0.03, cam);
    drawRays(ctx);
    r = Layers.applyLayer(ctx, base, 0.25, cam);
    G.layers.mid.render(ctx, r);
    JHS.Life.drawVillage(ctx, r);
    JHS.Ambient.drawBirds(ctx);
    r = Layers.applyLayer(ctx, base, 0.5, cam);
    G.layers.hills.render(ctx, r);
    JHS.Life.drawCloudShadows(ctx, r);
    r = Layers.applyWorld(ctx, base, cam);
    G.layers.play.render(ctx, r);
    JHS.Life.drawFalls(ctx, r);
    JHS.Ambient.drawTrees(ctx, r, true);
    JHS.Ambient.drawTrees(ctx, r, false);
    JHS.Ambient.drawBack(ctx, r);
    drawItems(ctx, r);
    JHS.Ambient.drawGroundBirds(ctx, r);
    drawBridge(ctx, false);
    JHS.Shepherd.draw(ctx, G.shep);
    JHS.Sheep.draw(ctx, G.sheep);
    JHS.Girl.draw(ctx, G.girl);
    drawBridge(ctx, true);
    JHS.Ambient.drawFront(ctx, r);
    JHS.Ambient.drawButterflies(ctx, r);
    JHS.Ambient.drawParticles(ctx);
    JHS.Life.drawFront(ctx, r, G.items);
    JHS.Ambient.drawMotes(ctx, cam, G.rayBoost || 0);
    JHS.Sheep.drawBubble(ctx, G.sheep);
    if (G.girlBubble && G.girl.alpha > 0.5) {
      const gb = G.girlBubble, k = U.smoothstep(0, 0.15, 1.5 - gb.t) * U.smoothstep(0, 0.25, gb.t);
      UI.bubble(ctx, G.body.x + G.body.facing * 30, G.body.y - 236, gb.text, k, 405, 0.04 * G.body.facing);
    }
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
    const dt = G.fixedDt || Math.min(0.1, last ? (now - last) / 1000 : 1 / 60);
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
  function tapMenu(y0, gap, n, cx = 960) {
    if (!Input.tapped || !Input.tapPos) return -1;
    const [x, y] = Input.tapPos;
    if (x < cx - 360 || x > cx + 360) return -1;
    for (let i = 0; i < n; i++) if (Math.abs(y - (y0 + i * gap - 12)) < gap / 2) return i;
    return -1;
  }

  function update(dt) {
    if (G.state === 'loading') return;
    JHS.Sound.update(dt, G);
    if (Input.hit('mute')) UI.toast(JHS.Sound.toggle() ? '♪ Sonido activado' : '♪ Sonido en silencio');
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
      menuNav(5);
      const tp = tapMenu(420, 70, 5);
      if (tp >= 0) G.menu = tp;
      if (Input.hit('pause')) setState('play');
      else if (Input.hit('sheet')) setState('sheet');
      else if (confirm() || tp >= 0) {
        if (G.menu === 0) setState('play');
        else if (G.menu === 1) { setState('play'); G.body.y = L.killY + 10; }
        else if (G.menu === 2) JHS.Sound.toggle();
        else if (G.menu === 3) setState('sheet');
        else { UI.transition(() => { newGame(); setState('title'); }); }
      }
    } else if (G.state === 'end') {
      idleScene(dt, true);
      menuNav(2);
      G.endInfo.sel = G.menu;
      const tp = tapMenu(780, 60, 2, UI.END_X);
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
    JHS.Ambient.update(dt, G.cam, [{ x: G.body.x, y: G.body.y, vx: 0 }]);
    JHS.Life.update(dt, G.cam);
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
        UI.drawHUD(ctx, dt, { found: G.items.found, total: G.items.seeds.length, page: G.items.page, flowers: G.items.picked, flowersTotal: G.items.flowers.length });
        UI.drawFly(ctx, dt, worldToScreen);
        UI.drawPrompt(ctx, worldToScreen, G.touchMode);
        UI.drawDialogue(ctx, worldToScreen);
        if (!G.cine) UI.drawHint(ctx, dt, G.touchMode);
        UI.drawPage(ctx, dt);
        if (G.touchMode && G.state === 'play' && !G.cine) UI.drawTouch(ctx, Input);
      }
      if (G.state === 'title') UI.drawTitle(ctx, G.stateT, G.menu, G.touchMode);
      if (G.state === 'pause') UI.drawPause(ctx, G.menu, JHS.Sound.on);
      if (G.state === 'end') UI.drawEnd(ctx, G.stateT, G.endInfo);
    }
    screenSet(ctx);
    UI.drawToast(ctx, dt);
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
