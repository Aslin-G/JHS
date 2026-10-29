/* Mundo 1 — «Valle del Amanecer»: guion. Estados del lugar (inicial → transición → restaurado,
   con la misma geometría de colisión), el puente que se remienda con tres tablones, las tres
   estaciones de ruta (farol de vidrio y campana) que se reparan, Ester en su casa, la niebla del
   Caballero en la Colina de las Piedras y la mirada final sobre el valle. */
(function (JHS) {
  'use strict';
  const U = JHS.U, P = JHS.Palette, Paint = JHS.Paint, Layers = JHS.Layers, UI = JHS.UI;
  const Worlds = JHS.Worlds = JHS.Worlds || { order: [] };
  const L = JHS.Levels.m01;
  const Art = JHS.M01Art;

  const W = {
    id: 'm01', kicker: 'Mundo 1', title: 'Valle', subtitle: 'del Amanecer', short: 'Valle del Amanecer',
    tag: 'DESCUBRIMIENTO', level: L, wool: 'clara', mixLabel: 'Mezclando ocres miel y verdes salvia…',
    // y0 baja hasta 220: la mirada final sobre el valle abre la cámara por encima de la colina
    frame: { c0: { x: 960, y: 551 }, range: { x0: 960, x1: 9200, y0: 220, y1: 780, zMin: 0.7 } },
    sun: Art.SUN, rayAlpha: 0.62,
    // luz de miel (ficha: «luz miel»): veladura cálida en luz suave sobre toda la escena
    light: { glow: '#ffe7b0', a: 0.2, r: 1500, vignette: '#c9a77c', vignetteA: 0.28, grade: { op: 'soft-light', color: '#f0b04a', a: 0.35 } },
  };

  // Progreso del valle: 0 inicial · 1 puente remendado (empieza la transición) · 2 y 3 primeras
  // estaciones · 4 la tercera: restaurado. Cada cosa del lugar cambia a su ritmo.
  const STATE_AT = { bridge: 1, canalNear: 1, smoke: 1, workshop: 2, fields1: 2, laundry: 2, canalFar: 3, fields2: 4, village: 3 };

  W.paintSteps = function (G) {
    const life = G.m01life = { falls: [], chimneys: [], windows: [] };
    return [
      ['Pintando el cielo crema del amanecer…', () => {
        const sky = new Layers.Layer({ name: 'sky', p: 0.03, q: 0.5, chunk: 4096 });
        Art.paintSky(sky);
        G.layers.sky = sky;
        const defs = [[560, 150, 200, 120, 1], [380, 110, 760, 70, 1], [440, 130, 1720, 110, -1], [300, 90, 1320, 230, -1], [480, 100, 2080, 260, -1], [360, 80, 480, 300, 1]];
        G.clouds = defs.map(([w, h, x, y, side], i) => ({ spr: Art.cloudSprite(w, h, 60 + i, side), x, y, v: 2 + i * 0.6, part: 0, side, a: 0.9 }));
        G.spr.rays = Art.raySprite();
      }],
      ['Pintando las montañas lavanda…', () => { G.layers.far = new Layers.Layer({ name: 'far', p: 0.1, q: 0.7, chunk: 1024 }); Art.paintFar(G.layers.far); }],
      ['Pintando el pueblo del campanario…', () => { G.layers.mid = new Layers.Layer({ name: 'mid', p: 0.25, q: 0.75, chunk: 1024 }); Art.paintMid(G.layers.mid, life); }],
      ['Pintando las colinas de cipreses…', () => { G.layers.hills = new Layers.Layer({ name: 'hills', p: 0.5, q: 0.85, chunk: 1024 }); Art.paintHills(G.layers.hills, life); }],
      ['Pintando la casa de Ester y el taller…', () => { G.layers.back = new Layers.Layer({ name: 'back', p: Art.BACK_P, q: 0.85, chunk: 1024 }); Art.paintBack(G.layers.back, L, life); }],
      ['Pintando el camino y el arroyo…', () => {
        G.layers.play = new Layers.Layer({ name: 'play', p: 1, q: 1, chunk: 512, world: true, bounds: { x0: -720, y0: 0, x1: 9300, y1: L.bottom } });
        Art.paintPlay(G.layers.play, L, life);
      }],
    ];
  };

  W.setupArt = function (G) {
    const S = G.spr;
    S.bridge = Art.bridgeSprites(L);
    S.stationPost = Art.stationPost();
    S.lampLit = Art.lanternSprite(true, false);
    S.lampBroken = Art.lanternSprite(false, true);
    S.workshop = Art.workshopSprites();
    S.fields = Art.fieldSprites();
    S.laundry = Art.laundrySprite();
    S.fg = Art.foregroundSprites();
    JHS.Ester.build();
    JHS.Knight.build();
    // bruma lavanda del Caballero (distinta de las chispas de luz: nunca brilla)
    S.mistPuff = Paint.makeSprite({ w: 64, h: 64, ox: 32, oy: 32, res: 1 }, (g) => Paint.softBlob(g, 0, 0, 30, '#ddd6e4', 1));
    S.mistDeep = Paint.makeSprite({ w: 64, h: 64, ox: 32, oy: 32, res: 1 }, (g) => Paint.softBlob(g, 0, 0, 30, '#9d95b4', 1));
    // primer plano: matas de flores y piedras que asoman por las esquinas inferiores
    G.fg = [];
    for (let i = 0; i < 16; i++) {
      const wx = -200 + i * 620 + (i % 3) * 90;
      const gy = L.gy(U.clamp(wx, 0, 8900));
      const camY = gy - JHS.Camera.FRAME_Y;
      G.fg.push({ spr: S.fg[i % S.fg.length], x: 960 + (wx + 380 - Layers.C0.x) * 1.3, y: 1150 + (camY - Layers.C0.y) * 1.3, flip: i % 2 ? -1 : 1, corners: true, sway: true, s: 1.1 });
    }
  };

  W.life = function (G) {
    const life = G.m01life;
    return {
      falls: life.falls,
      chimneys: life.chimneys,
      windows: (life.villageWindows || []).map((w, i) => ({ x: w.x, y: w.y, ph: (i * 0.37) % 1, layer: 'mid', k: 0.35, id: 'village' })).concat(life.windows),
      cloudShadows: { layer: 'hills', keys: Art.HILL_KEYS, alpha: 0.12, dy: 120 },
    };
  };

  // ------------------------------------------------------------------ partida
  W.newGame = function (G) {
    G.m01 = {
      prog: 0, shown: 0, bloom: [],
      carry: null, pile: L.boards.n, placed: 0,
      stations: L.stations.map((s) => ({ x: s.x, lit: false, hold: 0, glow: 0, ring: 0, swing: 0, swingV: 0 })),
      knight: Object.assign(JHS.Knight.create(L.knight.x, L.gy(L.knight.x)), { deep: G.spr.mistDeep }), waves: [], wind: null, cool: 1.5, lastKind: 'high', mist: 0,
      appeased: false, knock: 0, invuln: 0, wallT: 0, ended: false, bellRung: false,
    };
    G.ester = JHS.Ester.create(L.ester.x, L.gy(L.ester.x));
    G.esterCtl = { mode: 'idle', t: 2.5, to: L.ester.x, met: false, talks: 0 };
    // el farol de la casa luce desde el principio: primer punto de control
    G.checkpoint = { x: L.start.x, y: L.gy(L.start.x) };
    applyState(G, true);
  };

  W.respawn = function (G) {
    const M = G.m01;
    if (M.carry) { M.carry = null; M.pile++; }
    M.waves.length = 0; M.wind = null; M.cool = 1.5; M.knock = 0;
  };

  // Ajusta todo lo que depende del progreso (sin animación si `instant`).
  function applyState(G, instant) {
    const M = G.m01, p = M.prog;
    const Lf = JHS.Life;
    for (const w of Lf.windows) {
      if (w.id === 'houseWindow') w.k = p >= 1 ? 0.8 : 0.35;
      else if (w.id === 'village') w.k = p >= 3 ? 0.75 : p >= 1 ? 0.45 : 0.25;
    }
    for (const c of Lf.smoke) if (c.id === 'houseChimney') c.k = p >= 1 ? 1 : 0.55;
    if (instant) M.shown = p;
  }

  function advance(G, x, y) {
    const M = G.m01;
    M.prog++;
    M.bloom.push({ x, y, t: 0 });
    applyState(G, false);
    if (JHS.Sound) JHS.Sound.play(M.prog >= 4 ? 'bless' : 'lantern', { x });
  }

  // ------------------------------------------------------------------ interacción
  W.interactions = function (G, b, head) {
    const M = G.m01;
    // tablones: coger del montón de la leñera y ponerlos en los huecos del puente
    if (!M.carry && M.pile > 0 && Math.abs(b.x - L.boards.pile) < 60) return { x: L.boards.pile, y: head, key: 'E', label: 'coger un tablón', act: 'takeBoard' };
    if (M.carry) {
      const hole = G.world.bridge.holes[0];
      if (hole && b.x > hole[0] - 70 && b.x < hole[0] + 6) return { x: hole[0] + 20, y: head, key: 'E', label: 'poner el tablón', act: 'placeBoard' };
      return null;
    }
    for (const [i, s] of M.stations.entries()) {
      if (!s.lit && Math.abs(b.x - s.x) < 64) return { x: s.x + 30, y: head - 30, key: 'E', label: s.hold > 0 ? 'reparando…' : 'reparar el farol (mantén E)', act: 'station', i, hold: true };
    }
    const E = G.ester;
    if (E && !UI.dlg && Math.abs(b.x - E.x) < 96 && b.grounded) return { x: E.x, y: E.y - 262, key: 'E', label: 'hablar con Ester', act: 'ester' };
    const c = G.items.chest;
    if (c && !c.open && M.prog < L.chest.needs + 0 && Math.abs(b.x - c.x) < 74) return { x: c.x, y: head, key: '·', label: 'el cofre del taller está cerrado', act: null };
    return null;
  };

  W.act = function (G, p) {
    const M = G.m01, g = G.girl, b = G.body;
    if (p.act === 'takeBoard') {
      b.facing = L.boards.pile >= b.x ? 1 : -1;
      g.action = 'pick'; g.actionT = 0; g.actionDur = 0.7;
      G.pending = { t: 0.35, fn: () => { M.pile--; M.carry = { t: 0 }; if (JHS.Sound) JHS.Sound.play('wood'); } };
      return true;
    }
    if (p.act === 'placeBoard') {
      const br = G.world.bridge, hole = br.holes[0];
      b.facing = 1;
      g.action = 'interact'; g.actionT = 0; g.actionDur = 0.9;
      G.pending = { t: 0.45, fn: () => {
        br.holes.shift();
        M.carry = null;
        M.placed++;
        JHS.Ambient.burst('dust', (hole[0] + hole[1]) / 2, br.y0 + 2, 6);
        G.cam.shake = 0.12;
        if (JHS.Sound) JHS.Sound.play('wood');
        if (!br.holes.length) {
          advance(G, (br.x0 + br.x1) / 2, br.y0);
          G.checkpoint = { x: br.x1 + 40, y: L.gy(br.x1 + 40) };
          UI.toast('El puente vuelve a unir las orillas');
        }
      } };
      return true;
    }
    if (p.act === 'station') return true;
    if (p.act === 'ester') {
      const E = G.ester;
      b.facing = E.x >= b.x ? 1 : -1;
      E.facing = b.x >= E.x ? 1 : -1;
      UI.say('Ester', esterLines(G), () => [E.x, E.y - 250], { onEnd: () => { G.esterCtl.mode = 'idle'; G.esterCtl.t = 2; } });
      UI.dlg.free = true;
      return true;
    }
    return false;
  };

  // ------------------------------------------------------------------ Ester
  // Lo que cuenta cambia con el valle; nunca une la tormenta ni la pérdida a una culpa.
  function esterLines(G) {
    const p = G.m01.prog, n = G.esterCtl.talks++;
    if (p === 0) return n === 0
      ? ['¡Buenos días, Lía! Y buenos días a ti también, Nuba.', 'La tormenta de anoche se llevó las tablas del puente.', 'En mi leñera, junto al camino, quedan tablones buenos. Llévalos de uno en uno.']
      : ['Los tablones están en la leñera, aquí al lado. Con tres basta.'];
    if (p === 1) return ['¡El puente vuelve a cruzarse! Ya se oye el agua por la acequia.', 'Los faroles del camino se apagaron con la tormenta. Repararlos da luz a quien pasa.'];
    if (p < 4) return n % 2
      ? ['Dicen que en la Colina de las Piedras vela el Caballero de la Niebla.', 'No es malo: cuida el valle mientras duerme.']
      : ['El taller vuelve a oler a madera nueva.', 'Y la huerta, ¿la has visto? Todo brota despacio.'];
    return ['Gracias, Lía. El valle se ve como cuando yo era niña.', 'Ve con cuidado hacia el bosque. Y vuelve a contármelo.'];
  }

  // Ester va y viene delante de su casa: riega, se hace visera para mirar la colina, se estira
  // la espalda o cambia de sitio, con pausas de duración distinta; saluda a la niña al verla.
  function updateEster(G, dt, playing) {
    const E = G.ester, C = G.esterCtl, b = G.body, Es = JHS.Ester;
    if (!E) return;
    const talking = !!UI.dlg && UI.dlg.speaker === 'Ester';
    E.talking = talking && UI.speaking();
    const dx = b.x - E.x;
    if (talking) {
      E.facing = dx >= 0 ? 1 : -1; E.can = false; Es.setAnim(E, 'talk'); C.mode = 'talk';
      if (Math.abs(dx) > 430) UI.cancel();
    } else if (playing && !C.met && Math.abs(dx) < 460) {
      C.met = true; C.mode = 'wave'; C.t = 1.9; E.can = false;
      E.facing = dx >= 0 ? 1 : -1; Es.setAnim(E, 'wave');
    } else {
      if (C.mode === 'talk') { C.mode = 'idle'; C.t = U.lerp(1.5, 3, Math.random()); Es.setAnim(E, 'idle'); }
      C.t -= dt;
      if (C.mode === 'walk') {
        const d = C.to - E.x;
        E.facing = d >= 0 ? 1 : -1;
        E.speed = 24;
        E.x += Math.sign(d) * Math.min(Math.abs(d), 24 * dt);
        Es.setAnim(E, 'walk');
        if (Math.abs(d) < 1) { C.mode = 'idle'; C.t = U.lerp(1.5, 5.5, Math.random()); Es.setAnim(E, 'idle'); }
      } else if (C.t <= 0) {
        if (C.mode !== 'idle') { C.mode = 'idle'; E.can = false; C.t = U.lerp(1.5, 6, Math.random()); Es.setAnim(E, 'idle'); }
        else {
          const r = Math.random();
          if (r < 0.3) { C.mode = 'water'; C.t = U.lerp(4, 6.5, Math.random()); E.can = true; E.facing = Math.random() < 0.5 ? -1 : 1; Es.setAnim(E, 'water'); }
          else if (r < 0.48) { C.mode = 'look'; C.t = 3; E.facing = 1; Es.setAnim(E, 'look'); }
          else if (r < 0.62) { C.mode = 'back'; C.t = 2.7; Es.setAnim(E, 'back'); }
          else { C.mode = 'walk'; C.to = U.lerp(L.ester.range[0], L.ester.range[1], Math.random()); }
        }
      }
      if (playing && Math.abs(dx) < 320 && C.mode === 'idle') E.facing = dx >= 0 ? 1 : -1;
    }
    E.y = L.gy(E.x);
    E.wind = JHS.Ambient.wind;
    Es.update(E, dt);
  }

  // ------------------------------------------------------------------ el Caballero de la Niebla
  // Olas bajas (se saltan) y altas (se pasa agachada), anunciadas 0,9 s antes por la lanza, la
  // niebla que se junta en la punta y el cuerno. Si alcanzan a la niña, solo la empujan atrás.
  const KN = L.knight, WALL_X = L.knight.x + 50;
  function mistCap(G) { return G.opts.mist === 'reducida' ? 0.18 : 0.42; }

  function updateKnight(G, dt, playing) {
    const M = G.m01, K = M.knight, b = G.body, g = G.girl, Kn = JHS.Knight;
    Kn.update(K, dt);
    M.mist = U.damp(M.mist, M.appeased ? 0 : U.smoothstep(KN.zone[0] - 520, KN.zone[0] + 220, b.x), 1.1, dt);
    M.invuln = Math.max(0, M.invuln - dt);
    M.knock = Math.max(0, M.knock - dt);
    M.wallT = Math.max(0, M.wallT - dt);
    if (M.toastT > 0 && (M.toastT -= dt) <= 0) UI.toast('La niebla se retira: el camino sigue hacia el bosque');
    const engaged = !M.appeased && playing && b.x > KN.zone[0] && b.x < WALL_X + 40;
    if (!M.appeased) K.facing = b.x < K.x ? -1 : 1;
    if (engaged) {
      if (M.wind) {
        M.wind.t += dt;
        if (M.wind.t >= 0.9) {
          M.waves.push({ x: K.x + K.facing * 46, kind: M.wind.kind, dir: K.facing, t: 0, hit: false });
          if (JHS.Sound) JHS.Sound.play('whoosh', { x: K.x });
          Kn.setState(K, 'stand');
          M.wind = null;
          M.cool = U.lerp(KN.waves.every[0], KN.waves.every[1], Math.random()) - 0.9;
        }
      } else if ((M.cool -= dt) <= 0) {
        const kind = M.lastKind === 'low' ? (Math.random() < 0.7 ? 'high' : 'low') : (Math.random() < 0.7 ? 'low' : 'high');
        M.lastKind = kind;
        M.wind = { t: 0, kind };
        Kn.setState(K, kind === 'low' ? 'windLow' : 'windHigh');
        if (JHS.Sound) JHS.Sound.play('horn', { x: K.x, high: kind === 'high' });
      }
    } else if (!M.appeased) {
      if (M.wind) Kn.setState(K, 'stand');
      M.wind = null;
      M.cool = Math.max(M.cool, 1.2);
    }
    for (let i = M.waves.length - 1; i >= 0; i--) {
      const w = M.waves[i];
      w.t += dt;
      w.x += w.dir * KN.waves.speed * dt;
      const gy = L.gy(w.x);
      if (!w.hit && M.invuln <= 0 && G.state === 'play' && !G.cine && Math.abs(b.x - w.x) < 34) {
        const hit = w.kind === 'low' ? b.y > gy - 62 : !(g.crouchK > 0.4 && b.grounded) && b.y > gy - 236;
        if (hit) { w.hit = true; pushBack(G, w); }
      }
      if (w.x < KN.zone[0] - 160 || w.t > 6) M.waves.splice(i, 1);
    }
    // muro de niebla junto al Caballero: no deja pasar mientras el farol de la colina no luzca
    if (!M.appeased && b.x > WALL_X) {
      b.x = WALL_X;
      if (b.vx > 0) b.vx = 0;
      if (playing && M.wallT <= 0) { UI.toast('La niebla es muy espesa… quizá la luz del farol la abra'); M.wallT = 7; }
    }
  }

  function pushBack(G, w) {
    const M = G.m01, b = G.body, g = G.girl;
    M.invuln = 1.2; M.knock = 0.4;
    b.vx = w.dir * 260; b.vy = -300; b.grounded = false; b.mode = 'air';
    g.expr = 'sorpresa'; g.exprT = 1;
    if (g.action === 'interact') g.action = null;
    for (const s of M.stations) if (!s.lit) s.hold = 0;
    if (JHS.Sound) JHS.Sound.play('whoosh', { x: b.x, soft: true });
  }

  function appease(G) {
    const M = G.m01;
    if (M.appeased) return;
    M.appeased = true;
    M.waves.length = 0; M.wind = null;
    JHS.Knight.setState(M.knight, 'kneel');
    M.bloom.push({ x: M.knight.x, y: M.knight.y - 140, t: 0 });
    M.toastT = 1.8;
  }

  // ------------------------------------------------------------------ mirada final sobre el valle
  // La cámara se abre y recorre lo que ha cambiado (el farol de la colina, la huerta, el taller,
  // el puente y la acequia) y vuelve con la niña, la oveja y el Pastor.
  const TOUR = [[2.5, 6900, 0.78, 3.4], [6.2, 4400, 0.74, 4.6], [11, 2380, 0.74, 4.4], [15.6, 8150, 0.92, 4.8]];
  function startFinale(G) {
    G.cine = { t: 0, leg: 0, said: false };
    G.cam.moveTo(8150, L.gy(8150) - 250, 0.88, 2.5);
    G.shepCtl.startFinale(L.finale.bench - 60, L.finale.bench + 60);
    G.seated = null; G.girl.bench = false;
    UI.dlg = null;
  }

  W.updateCinematic = function (G, dt, inp) {
    const c = G.cine, b = G.body, g = G.girl, M = G.m01;
    c.t += dt;
    inp.locked = false; inp.run = false; inp.jump = false;
    const stand = L.finale.x - 40;
    inp.x = b.x < stand - 4 ? 1 : 0;
    if (b.x >= stand - 4) {
      inp.locked = true;
      b.facing = -1;
      if (!g.action) { g.action = 'look'; g.actionT = 0; g.actionDur = 0; }
    }
    G.rayBoost = U.smoothstep(2, 6, c.t) * (1 - U.smoothstep(18, 21, c.t) * 0.5);
    // el Pastor, al llegar, se vuelve hacia la niña y hacia el valle
    if (G.shep.x >= G.shepCtl.fin.toX - 0.5) G.shep.facing = -1;
    while (c.leg < TOUR.length && c.t >= TOUR[c.leg][0]) {
      const [, x, z, dur] = TOUR[c.leg];
      G.cam.moveTo(x, L.gy(x) - 300 * (0.92 / z), z, dur);
      c.leg++;
    }
    if (c.t > 6.8 && !c.said) {
      c.said = true;
      const all = M.stations.every((s) => s.lit);
      const lines = all ? L.ending : ['Mira el valle: aún quedan faroles a oscuras.', 'Mañana el camino sigue hacia el bosque; volveremos a encenderlos.'];
      G.shepCtl.fin.mode = 'speak';
      UI.say('El Buen Pastor', [lines[0]], () => [G.cam.x, G.cam.y - 300 / G.cam.z], { hold: true });
      c.second = lines[1];
    }
    if (c.said && c.t > 13 && UI.dlg && UI.dlg.hold) UI.dlg = null;
    if (c.t > 19.5 && c.second) {
      const second = c.second;
      c.second = null;
      UI.say('El Buen Pastor', [second], () => [G.shep.x, G.shep.y - 300], {
        onEnd: () => { G.shepCtl.fin.mode = 'bless'; c.blessT = c.t; if (JHS.Sound) JHS.Sound.play('bless'); },
      });
    }
    if (c.blessT && c.t > c.blessT + 2.6 && !c.ending) {
      c.ending = true;
      const secs = Math.round(G.playTime), it = G.items, lit = M.stations.filter((s) => s.lit).length;
      G.endInfo = {
        title: 'El valle despierta', subtitle: 'Fin del Mundo 1',
        lines: [
          { icon: 'seed', text: `Semillas de luz: ${it.found} de ${it.total()}` },
          { icon: 'page', text: it.page ? 'Página del diario: encontrada' : 'Página del diario: sigue en el cofre del taller' },
          { icon: 'lantern', text: `Faroles del camino: ${lit} de ${M.stations.length}` },
        ],
        time: `Tiempo de camino: ${Math.floor(secs / 60)} min ${secs % 60} s`,
        items: ['Volver a empezar el valle', 'Volver al prólogo', 'Hoja de personajes'],
        actions: ['again', { world: 'm00' }, 'sheet'], sel: 0,
      };
      UI.transition(() => JHS.Core.setState('end'), { dur: 1.1 });
    }
    return { forceAnim: c.t > 9 ? 'sleep' : c.t > 4 ? 'happy' : null };
  };

  W.input = function (G, inp, dt) {
    const M = G.m01, b = G.body, g = G.girl;
    if (M.carry) { inp.run = false; inp.jump = false; inp.jumpHeld = false; }
    // reparar una estación: mantener E junto a ella (soltar o moverse lo interrumpe)
    let holding = null;
    for (const s of M.stations) if (!s.lit && Math.abs(b.x - s.x) < 64 && b.grounded && inp.actHeld && !UI.dlg && !G.cine) holding = s;
    for (const s of M.stations) {
      if (s === holding) {
        s.hold += dt;
        inp.locked = true;
        b.facing = s.x + 30 >= b.x ? 1 : -1;
        if (g.action !== 'interact') { g.action = 'interact'; g.actionT = 0.3; g.actionDur = 0; }
        g.actionT = Math.min(g.actionT, 0.5);
        if (s.hold >= 1.5) lightStation(G, s);
      } else if (s.hold > 0 && !s.lit) {
        s.hold = Math.max(0, s.hold - dt * 2);
        if (g.action === 'interact' && !holding) g.action = null;
      }
    }
  };

  function lightStation(G, s) {
    const g = G.girl;
    s.lit = true; s.hold = 0; s.ring = 1.6; s.swingV = 2.2;
    g.action = null;
    g.expr = 'alegre'; g.exprT = 1.6;
    JHS.Ambient.burst('gold', s.x + 52, L.gy(s.x) - 120, 18);
    G.checkpoint = { x: s.x + 40, y: L.gy(s.x + 40) };
    advance(G, s.x + 52, L.gy(s.x) - 120);
    if (JHS.Sound) JHS.Sound.play('bell', { x: s.x });
    if (s === G.m01.stations[G.m01.stations.length - 1]) appease(G);
  }

  // ------------------------------------------------------------------ actualización
  W.update = function (G, dt) {
    const M = G.m01;
    const playing = G.state === 'play' && !G.cine;
    updateEster(G, dt, playing);
    updateKnight(G, dt, playing);
    if (playing && M.appeased && G.body.x > L.finale.x && G.body.grounded) startFinale(G);
    if (M.prog >= STATE_AT.village && !M.bellRung) { M.bellRung = true; if (JHS.Sound) JHS.Sound.play('villageBell'); }
    if (JHS.Sound) JHS.Sound.water = { x: (L.gaps[0].x0 + L.gaps[0].x1) / 2, k: 1 };
    if (M.carry) M.carry.t += dt;
    M.shown = U.approach(M.shown, M.prog, dt * 0.45);
    for (let i = M.bloom.length - 1; i >= 0; i--) { M.bloom[i].t += dt; if (M.bloom[i].t > 3) M.bloom.splice(i, 1); }
    for (const s of M.stations) {
      s.glow = U.damp(s.glow, s.lit ? 1 : 0, 2, dt);
      s.ring = Math.max(0, s.ring - dt);
      // el farol se balancea con las ráfagas y con la campana
      const gust = JHS.Ambient.gustAt(s.x, 0.15);
      s.swingV += ((gust * 0.08 - s.swing) * 30 - s.swingV * 3) * dt;
      s.swing += s.swingV * dt;
    }
  };
  W.idle = function (G, dt) { W.update(G, dt); };
  // empujón de la niebla: unos instantes sin control (sin daño)
  const baseInput = W.input;
  W.input = function (G, inp, dt) {
    baseInput(G, inp, dt);
    if (G.m01.knock > 0) { inp.locked = true; inp.jump = false; }
  };

  W.hud = function (G) {
    return { found: G.items.found, total: G.items.seeds.length, page: G.items.page, stations: { lit: G.m01.stations.filter((s) => s.lit).length, total: G.m01.stations.length } };
  };

  W.lamps = function (G) {
    const out = [];
    const hl = G.m01life.houseLamp;
    if (hl) {
      // el farol de la casa vive en el plano del fondo: se lleva a coordenadas de mundo aproximadas
      out.push({ x: (hl.x - 79) / Art.BACK_P, y: hl.y + 11, glow: 0.8 });
    }
    for (const s of G.m01.stations) if (s.lit) out.push({ x: s.x + 52, y: L.gy(s.x) - 132, glow: s.glow });
    return out;
  };

  // ------------------------------------------------------------------ dibujo
  function k01(M, at) { return U.clamp(M.shown - (at - 1), 0, 1); }

  W.draw = {
    back(G, ctx) {
      const M = G.m01, S = G.spr;
      // taller: cerrado → abierto (las piezas nuevas aparecen como pigmento que se asienta)
      const kw = k01(M, STATE_AT.workshop);
      if (kw < 1) Paint.drawSprite(ctx, S.workshop.closed, 0, 0, { alpha: 1 - kw });
      if (kw > 0) Paint.drawSprite(ctx, S.workshop.open, 0, 0, { alpha: kw });
      // huerta en tres estados
      const k1 = k01(M, STATE_AT.fields1), k2 = k01(M, STATE_AT.fields2);
      if (k1 < 1) Paint.drawSprite(ctx, S.fields[0], 0, 0, { alpha: 1 - k1 });
      if (k1 > 0 && k2 < 1) Paint.drawSprite(ctx, S.fields[1], 0, 0, { alpha: k1 * (1 - k2) });
      if (k2 > 0) Paint.drawSprite(ctx, S.fields[2], 0, 0, { alpha: k2 });
      const kl = k01(M, STATE_AT.laundry);
      if (kl > 0) Paint.drawSprite(ctx, S.laundry, 0, 0, { alpha: kl });
      // luz del farol de la casa y del taller
      const hl = G.m01life.houseLamp;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const f = 0.85 + 0.15 * Math.sin(G.t * 8) * Math.sin(G.t * 5.1);
      ctx.globalAlpha = 0.5 * f;
      if (hl) ctx.drawImage(G.spr.glow.c, hl.x - 70, hl.y - 60, 140, 140);
      if (kw > 0) { const wl = S.workshop.lamp; ctx.globalAlpha = 0.5 * f * kw; ctx.drawImage(G.spr.glow.c, wl.x - 80, wl.y - 70, 160, 160); }
      ctx.restore();
    },
    playBack(G, ctx, r) {
      drawCanal(G, ctx, r);
      drawStreamGlints(G, ctx, r);
      drawMist(G, ctx, r, false);
    },
    npcs(G, ctx, r) {
      const E = G.ester;
      if (E && E.x > r.x0 - 200 && E.x < r.x1 + 200) JHS.Ester.draw(ctx, E);
      const K = G.m01.knight;
      if (K && K.x > r.x0 - 300 && K.x < r.x1 + 300) JHS.Knight.draw(ctx, K, G.spr.mistPuff);
    },
    worldFront(G, ctx, r) {
      drawWaves(G, ctx, r);
      drawMist(G, ctx, r, true);
    },
    items(G, ctx, r) {
      const M = G.m01, S = G.spr;
      // tablones que quedan en la leñera
      for (let i = 0; i < M.pile; i++) {
        const x = L.boards.pile + i * 9 - 6, y = L.gy(L.boards.pile);
        ctx.save(); ctx.translate(x, y); ctx.rotate(-1.32 + i * 0.05);
        ctx.drawImage(S.bridge.carry.c, -S.bridge.carry.ox, -S.bridge.carry.oy, S.bridge.carry.w, S.bridge.carry.h);
        ctx.restore();
      }
      // estaciones de ruta
      for (const s of M.stations) {
        if (s.x < r.x0 - 200 || s.x > r.x1 + 200) continue;
        const gy = L.gy(s.x);
        Paint.drawSprite(ctx, S.stationPost, s.x, gy);
        const hx = s.x + 52, hy = gy - 162;
        ctx.save();
        ctx.translate(hx, hy);
        ctx.rotate(s.swing + (s.ring > 0 ? Math.sin(s.ring * 18) * 0.12 * s.ring : 0));
        const spr = s.lit ? S.lampLit : S.lampBroken;
        ctx.drawImage(spr.c, -spr.ox, -spr.oy, spr.w, spr.h);
        ctx.restore();
        if (s.glow > 0.01) {
          const f = 0.85 + 0.15 * Math.sin(G.t * 9 + s.x) * Math.sin(G.t * 5.3);
          ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.6 * s.glow * f;
          ctx.drawImage(G.spr.glow.c, hx - 95, hy - 60, 190, 190);
          ctx.restore();
        }
        // anillo que muestra el progreso de la reparación (tinta que se cierra)
        if (s.hold > 0 && !s.lit) {
          ctx.save();
          ctx.strokeStyle = U.rgba('#fff2cc', 0.9); ctx.lineWidth = 3;
          ctx.beginPath(); ctx.arc(hx, hy + 30, 26, -Math.PI / 2, -Math.PI / 2 + U.TAU * U.clamp(s.hold / 1.5, 0, 1)); ctx.stroke();
          ctx.restore();
        }
      }
      // floración de pigmento al cambiar de estado (anillo cálido que se abre despacio)
      for (const bl of M.bloom) {
        const k = bl.t / 3, R = 80 + k * 900;
        ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.35 * (1 - k);
        ctx.drawImage(G.spr.glow.c, bl.x - R, bl.y - R * 0.6, R * 2, R * 1.2);
        ctx.restore();
      }
    },
    bridgeBack(G, ctx) {
      const S = G.spr.bridge, br = G.world.bridge, M = G.m01;
      const fixed = M.placed >= L.boards.n;
      drawBridged(G, ctx, fixed ? S.railBackFixed : S.railBackBroken, -14);
      drawBridged(G, ctx, S.deck, 0);
      // tablones puestos: de apoyo a apoyo, inclinados como la superficie bajo ellos
      for (let i = 0; i < M.placed; i++) {
        const bd = S.boards[i], ya = G.world.bridgeY(bd.x, true), yb = G.world.bridgeY(bd.x + bd.w, true);
        ctx.save();
        ctx.translate(bd.x, ya - 3);
        ctx.rotate(Math.atan2(yb - ya, bd.w));
        ctx.drawImage(bd.spr.c, -bd.spr.ox, -bd.spr.oy, bd.spr.w, bd.spr.h);
        ctx.restore();
      }
    },
    bridgeFront(G, ctx) {
      const S = G.spr.bridge, M = G.m01;
      const fixed = M.placed >= L.boards.n;
      drawBridged(G, ctx, fixed ? S.railFrontFixed : S.railFrontBroken, 0);
      // el tablón que lleva la niña, al hombro
      if (M.carry) {
        const b = G.body, g = G.girl, f = b.facing;
        const bob = Math.sin(g.phase * U.TAU * 2) * 1.5;
        ctx.save();
        ctx.translate(b.x + f * 4, b.y - 112 + bob);
        ctx.rotate(f * -0.12);
        ctx.scale(f, 1);
        const c = S.carry;
        ctx.drawImage(c.c, -c.w / 2 + 6, -c.oy, c.w, c.h);
        ctx.restore();
      }
    },
  };

  // Niebla del Caballero: bancos bajos de bruma lavanda en su zona, con tope de opacidad (y la
  // opción «Niebla: reducida»); el velo de delante es aún más tenue y nunca tapa las olas.
  function drawMist(G, ctx, r, front) {
    const M = G.m01, a = M.mist * mistCap(G) * (front ? 0.35 : 1);
    if (a < 0.01) return;
    const puff = G.spr.mistPuff, t = G.t;
    const x0 = Math.max(r.x0 - 100, KN.zone[0] - 600), x1 = Math.min(r.x1 + 100, WALL_X + 500);
    ctx.save();
    for (let x = Math.floor(x0 / 90) * 90; x < x1; x += 90) {
      const k = U.smoothstep(KN.zone[0] - 600, KN.zone[0] + 100, x);
      if (k <= 0) continue;
      for (let j = 0; j < (front ? 1 : 3); j++) {
        const ph = Math.sin(x * 0.013 + j * 2.1) * 0.5 + 0.5;
        const drift = Math.sin(t * 0.21 + x * 0.004 + j) * 26;
        const R = (front ? 150 : 110 + j * 50) * (0.8 + ph * 0.5);
        const y = L.gy(x) - (front ? 60 : 10 + j * 70) + Math.sin(t * 0.3 + x * 0.01) * 6;
        ctx.globalAlpha = a * k * (front ? 0.7 : 0.55 - j * 0.12);
        ctx.drawImage(puff.c, x + drift - R, y - R * 0.55, R * 2, R * 1.1);
      }
    }
    // el muro de niebla espesa junto al Caballero
    if (!front && !M.appeased) {
      for (let j = 0; j < 6; j++) {
        const y = L.gy(WALL_X) - 40 - j * 50, R = 120 + Math.sin(t * 0.5 + j) * 10;
        ctx.globalAlpha = Math.min(0.85, a * 1.8) * (1 - j * 0.1);
        ctx.drawImage(puff.c, WALL_X + 40 - R + Math.sin(t * 0.4 + j * 1.3) * 12, y - R * 0.6, R * 2, R * 1.2);
      }
    }
    ctx.restore();
  }

  // Ola de niebla: un banco que rueda con el frente claro y la cola deshilachada. La baja va a ras
  // de suelo (hay que saltarla); la alta flota a la altura de la cabeza (hay que agacharse).
  function drawWaves(G, ctx, r) {
    const M = G.m01, KS = JHS.Knight.S;
    if (!M.waves.length) return;
    ctx.save();
    for (const w of M.waves) {
      if (w.x < r.x0 - 240 || w.x > r.x1 + 240) continue;
      const gy = L.gy(w.x), low = w.kind === 'low';
      const fade = U.smoothstep(KN.zone[0] - 160, KN.zone[0] + 120, w.x) * U.smoothstep(0, 0.2, w.t);
      const spr = low ? KS.waveLow : KS.waveHigh;
      // estela: bruma que queda detrás del banco
      for (let i = 0; i < 4; i++) {
        const R = 46 - i * 6, x = w.x - w.dir * (190 + i * 46);
        ctx.globalAlpha = (0.3 - i * 0.06) * fade;
        ctx.drawImage(G.spr.mistPuff.c, x - R, (low ? gy - 34 : gy - 160) - R * 0.6, R * 2, R * 1.2);
      }
      ctx.globalAlpha = 0.92 * fade;
      ctx.save();
      ctx.translate(w.x, (low ? gy + 2 : gy - 162) + Math.sin(G.t * 5 + w.x * 0.01) * 2.5);
      ctx.scale(-w.dir, 1);
      ctx.drawImage(spr.c, -spr.ox, -spr.oy, spr.w, spr.h);
      ctx.restore();
    }
    ctx.restore();
  }

  // Pieza del puente pintada plana (a la altura y0): se dibuja en franjas que siguen la superficie
  // física (el lomo y el hundimiento al pisar), así tablas, barandillas y pies no se separan.
  function drawBridged(G, ctx, spr, dy) {
    const br = G.world.bridge, n = 20;
    const x0 = br.x0 - 30, w = spr.w / n;
    for (let i = 0; i < n; i++) {
      const xa = x0 + i * w;
      const off = G.world.bridgeY(U.clamp(xa + w / 2, br.x0, br.x1), true) - br.y0;
      ctx.drawImage(spr.c, i * w * spr.res, 0, w * spr.res + 1, spr.c.height, xa, -spr.oy + dy + off, w + 0.6, spr.h);
    }
  }

  // Acequia: agua que llega desde el arroyo cuando el puente se remienda y alcanza los campos
  // con la segunda estación. Reflejos cortos que corren con la corriente.
  function drawCanal(G, ctx, r) {
    const M = G.m01, [ca, cb] = L.canal;
    const reach = U.lerp(ca, U.lerp(3300, cb, k01(M, STATE_AT.canalFar)), k01(M, STATE_AT.canalNear));
    if (reach <= ca + 4) return;
    const x0 = Math.max(ca, r.x0 - 20), x1 = Math.min(reach, r.x1 + 20);
    if (x1 <= x0) return;
    ctx.save();
    ctx.beginPath();
    for (let x = x0; x <= x1; x += 10) ctx.lineTo(x, L.gy(x) - 26);
    for (let x = x1; x >= x0; x -= 10) ctx.lineTo(x, L.gy(x) - 19);
    ctx.closePath();
    ctx.fillStyle = U.rgba('#a9bcbc', 0.85);
    ctx.fill();
    ctx.clip();
    ctx.strokeStyle = U.rgba('#f6f1e4', 0.85); ctx.lineWidth = 1.2;
    const t = G.t;
    for (let x = x0 - 40 + ((t * 46) % 40); x < x1; x += 40) {
      const y = L.gy(x) - 23 + Math.sin(x * 0.07) * 1.2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 9 + Math.sin(x + t) * 2, y); ctx.stroke();
    }
    ctx.restore();
  }

  // Arroyo: reflejos cortos y espuma que corren hacia nosotros (de arriba abajo en pantalla).
  function drawStreamGlints(G, ctx, r) {
    const st = G.m01life.stream;
    if (!st || st.x1 < r.x0 || st.x0 > r.x1) return;
    const t = G.t;
    ctx.save();
    ctx.strokeStyle = U.rgba('#fbf7ec', 0.8);
    for (let i = 0; i < 26; i++) {
      const ph = ((t * 0.18 + i * 0.137) % 1);
      const y = U.lerp(st.y0 + 30, st.y1 - 40, ph * ph);
      const half = U.lerp(30, (st.x1 - st.x0) / 2 - 20, ph);
      const x = st.cx + Math.sin(i * 12.7) * half;
      const w = U.lerp(4, 16, ph);
      ctx.globalAlpha = 0.7 * Math.sin(Math.PI * ph);
      ctx.lineWidth = U.lerp(0.8, 1.8, ph);
      ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x + w, y + 0.5); ctx.stroke();
    }
    ctx.restore();
  }

  Worlds.m01 = W;
  Worlds.order.push('m01');
})(window.JHS = window.JHS || {});
