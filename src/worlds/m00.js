/* Prólogo — «Camino de montaña al amanecer» (Biblia §48). Lo que solo existe en este nivel: su
   arte (src/art/scenery.js), el puente de cuerdas, las nubes de tormenta que se abren y la
   cinemática del mirador con el regalo de campanillas. */
(function (JHS) {
  'use strict';
  const U = JHS.U, P = JHS.Palette, Paint = JHS.Paint, Layers = JHS.Layers, UI = JHS.UI;
  const Worlds = JHS.Worlds = JHS.Worlds || { order: [] };
  const L = JHS.Level1;

  const W = {
    id: 'm00', kicker: 'Prólogo', title: 'Camino de montaña', subtitle: 'al amanecer', short: 'Camino de montaña',
    tag: 'PRIMERA PRUEBA JUGABLE', level: L, wool: 'oscura', next: 'm01',
    frame: { c0: { x: 960, y: 675 }, range: { x0: 960, x1: 9300, y0: -140, y1: 720, zMin: 0.68 } },
    sun: JHS.Scenery.SUN,
  };

  W.paintSteps = function (G) {
    const S = JHS.Scenery;
    return [
      ['Pintando el cielo del amanecer…', () => {
        const sky = new Layers.Layer({ name: 'sky', p: 0.03, q: 0.5, chunk: 4096 });
        S.paintSky(sky);
        G.layers.sky = sky;
        const defs = [[620, 200, 300, 110, true, 1], [380, 150, 1040, 50, true, 1], [460, 160, 1880, 120, true, -1],
          [300, 110, 1180, 300, false, 1], [520, 120, 2120, 300, false, -1], [380, 90, 640, 360, false, 1]];
        G.clouds = defs.map(([w, h, x, y, dark, side], i) => ({ spr: S.cloudSprite(w, h, 30 + i, dark, side), x, y, v: 2.5 + i * 0.7, part: 0, side: x < S.SUN.x ? -1 : 1 }));
        G.spr.rays = S.raySprite();
      }],
      ['Pintando las montañas lejanas…', () => { G.layers.far = new Layers.Layer({ name: 'far', p: 0.1, q: 0.7, chunk: 1024 }); S.paintFar(G.layers.far); }],
      ['Pintando el valle…', () => { G.layers.mid = new Layers.Layer({ name: 'mid', p: 0.25, q: 0.8, chunk: 1024 }); S.paintMid(G.layers.mid); }],
      ['Pintando las colinas…', () => { G.layers.hills = new Layers.Layer({ name: 'hills', p: 0.5, q: 0.9, chunk: 1024 }); S.paintHills(G.layers.hills); }],
      ['Pintando el sendero…', () => {
        G.layers.play = new Layers.Layer({ name: 'play', p: 1, q: 1, chunk: 512, world: true, bounds: { x0: -720, y0: -200, x1: 9000, y1: S.BOTTOM } });
        S.paintPlayfield(G.layers.play, L);
      }],
    ];
  };

  W.setupArt = function (G) {
    const O = JHS.Objects;
    G.spr.planks = [O.bridgePlank(771), O.bridgePlank(772), O.bridgePlank(773)];
    G.spr.fg = JHS.Scenery.foregroundSprites();
    // primer plano: elementos que pasan delante, colocados según la altura del sendero
    G.fg = [];
    const xs = [300, 1500, 2600, 3950, 5250, 6500, 7600];
    xs.forEach((wx, i) => {
      const gy = G.world.groundY(wx) || 800;
      const camY = gy - JHS.Camera.FRAME_Y;
      G.fg.push({ spr: G.spr.fg[i % G.spr.fg.length], x: 960 + (wx + 380 - Layers.C0.x) * 1.3, y: 1130 + (camY - Layers.C0.y) * 1.3, flip: i % 2 ? -1 : 1 });
    });
  };

  // Vida del paisaje del prólogo: la cascada del desfiladero, el humo y las luces del pueblo del
  // valle y las sombras de las nubes sobre las colinas.
  W.life = function () {
    const S = JHS.Scenery, v = S.village || { chimneys: [], windows: [] };
    const falls = S.gorgeRidge ? [[3290, 18, 44, 1], [3655, 8, 18, 0.5]].map(([x, w0, w1, k]) => ({ x, top: S.gorgeRidge(x) + 4, w0, w1, k, bottom: S.BOTTOM, layer: 'play' })) : [];
    return {
      falls,
      chimneys: v.chimneys.map(([x, y]) => ({ x, y, layer: 'mid' })),
      windows: v.windows.map(([x, y, ph]) => ({ x, y, ph, layer: 'mid' })),
      cloudShadows: { layer: 'hills', keys: [[-250, 690], [400, 650], [900, 700], [1500, 640], [2100, 690], [2700, 660], [3300, 720], [3800, 780], [4500, 860], [6300, 900]] },
    };
  };

  W.update = function (G) {
    const b = G.body;
    if (!G.cine && b.x > L.mirador.trigger && b.grounded) startCinematic(G);
  };

  // ------------------------------------------------------------------ cinemática del mirador
  function startCinematic(G) {
    const M = L.mirador;
    G.cine = { t: 0, said: false, blessed: false, gift: G.items.picked > 0 && !!L.gift };
    G.cam.moveTo(8880, G.world.groundY(8300) - 210, 0.7, 6.5);
    G.shepCtl.startFinale(M.shepherd, M.shepherd + 190);
    G.seated = null;
    G.girl.bench = false;
    UI.dlg = null;
  }

  function endingLines(G) {
    const c = G.cine;
    G.shepCtl.fin.mode = 'speak';
    UI.say('El Buen Pastor', L.ending, () => [G.shep.x, G.shep.y - 300], {
      onEnd: () => { G.shepCtl.fin.mode = 'bless'; c.blessT = c.t; if (JHS.Sound) JHS.Sound.play('bless'); },
    });
  }

  W.updateCinematic = function (G, dt, inp) {
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
              onEnd: () => { c.phase = 'view'; b.facing = 1; g.action = 'look'; g.actionT = 0; endingLines(G); },
            });
          },
        });
      } else endingLines(G);
    }
    if (c.blessT && c.t > c.blessT + 2.6 && !c.ending) {
      c.ending = true;
      const secs = Math.round(G.playTime);
      const it = G.items;
      G.endInfo = {
        title: 'Has llegado al mirador', subtitle: 'Fin del prólogo',
        lines: [
          { icon: 'seed', text: `Semillas de luz: ${it.found} de ${it.total()}` },
          { icon: 'page', text: it.page ? 'Página del diario: encontrada' : 'Página del diario: sigue en algún cofre' },
          { icon: 'flower', text: it.picked > 0 ? `Campanillas: ${it.picked} de ${it.flowers.length}, regaladas al Pastor` : `Campanillas: 0 de ${it.flowers.length}` },
        ],
        time: `Tiempo de camino: ${Math.floor(secs / 60)} min ${secs % 60} s`,
        items: ['Bajar al Valle del Amanecer', 'Volver a empezar', 'Hoja de personajes'],
        actions: [{ world: 'm01' }, 'again', 'sheet'], sel: 0,
      };
      UI.transition(() => JHS.Core.setState('end'), { dur: 1.1 });
    }
    // la oveja se acerca, se alegra y se echa a descansar
    return { forceAnim: c.t > 9 ? 'sleep' : c.t > 5 ? 'happy' : null };
  };

  // ------------------------------------------------------------------ puente de cuerdas
  function drawBridge(G, ctx, front) {
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
  W.draw = {
    bridgeBack: (G, ctx) => drawBridge(G, ctx, false),
    bridgeFront: (G, ctx) => drawBridge(G, ctx, true),
  };

  Worlds.m00 = W;
  Worlds.order.push('m00');
})(window.JHS = window.JHS || {});
