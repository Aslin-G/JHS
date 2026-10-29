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
    frame: { c0: { x: 960, y: 551 }, range: { x0: 960, x1: 9200, y0: 300, y1: 780, zMin: 0.7 } },
    sun: Art.SUN, rayAlpha: 0.42,
    light: { glow: '#ffe7b0', a: 0.18, r: 1500, vignette: '#c9a77c', vignetteA: 0.3 },
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
      knight: null, mist: 0, ended: false,
    };
    // el farol de la casa luce desde el principio: primer punto de control
    G.checkpoint = { x: L.start.x, y: L.gy(L.start.x) };
    applyState(G, true);
  };

  W.respawn = function (G) {
    const M = G.m01;
    if (M.carry) { M.carry = null; M.pile++; }
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
    return false;
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
  }

  // ------------------------------------------------------------------ actualización
  W.update = function (G, dt) {
    const M = G.m01;
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

  W.hud = function (G) {
    return { found: G.items.found, total: G.items.seeds.length, page: G.items.page, stations: { lit: G.m01.stations.filter((s) => s.lit).length, total: 3 } };
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
      Paint.drawSprite(ctx, fixed ? S.railBackFixed : S.railBackBroken, 0, -14);
      Paint.drawSprite(ctx, S.deck, 0, 0);
      for (let i = 0; i < M.placed; i++) Paint.drawSprite(ctx, S.boards[i].spr, S.boards[i].x, br.y0 - 3);
    },
    bridgeFront(G, ctx) {
      const S = G.spr.bridge, M = G.m01;
      const fixed = M.placed >= L.boards.n;
      Paint.drawSprite(ctx, fixed ? S.railFrontFixed : S.railFrontBroken, 0, 0);
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
