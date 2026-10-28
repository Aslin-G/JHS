/* Vida del entorno (§19, §20, §38): hierba y flores que se mecen, árboles que respiran,
   mariposas, pájaros lejanos, polen en los rayos y partículas pintadas (polvo, luz, pétalos,
   lana). Todo sutil: evitar la sobreanimación. */
(function (JHS) {
  'use strict';
  const U = JHS.U, P = JHS.Palette, Paint = JHS.Paint, Props = JHS.Props;

  const A = {
    parts: [],
    spr: {},
    decorBack: [], decorFront: [], trees: [], butterflies: [], birds: [], branches: [],
    wind: 0, gust: 0, t: 0,
  };

  function blot(col, r, soft) {
    return Paint.makeSprite({ w: r * 2 + 4, h: r * 2 + 4, ox: r + 2, oy: r + 2, res: 1.5 }, (g) => {
      if (soft) { Paint.softBlob(g, 0, 0, r, col, 1); return; }
      Paint.wash(g, U.blobPoly(0, 0, r * 0.8, r * 0.65, 10, U.makeRng(r * 7), 0.3), col, { layers: 4, alpha: 0.3, amp: r * 0.12, seed: r, edge: 0.4 });
    });
  }

  A.init = function (L, world) {
    const S = A.spr;
    S.dust = [blot(P.pathShade, 9), blot(P.earth, 7), blot(P.rockLight, 8)];
    S.gold = blot('#ffe3a0', 9, true);
    S.light = blot('#fff3cf', 12, true);
    S.wool = Paint.makeSprite({ w: 10, h: 10, ox: 5, oy: 5, res: 2 }, (g) => {
      g.strokeStyle = P.woolLight; g.lineWidth = 1;
      g.beginPath(); g.arc(0, 0, 2.6, 0.5, 5.4); g.stroke();
    });
    S.petal = Paint.makeSprite({ w: 12, h: 8, ox: 6, oy: 4, res: 2 }, (g) => {
      g.fillStyle = P.flowerWhite; g.beginPath(); g.ellipse(0, 0, 4.4, 1.9, 0, 0, U.TAU); g.fill();
      g.strokeStyle = P.inkGrey; g.globalAlpha = 0.5; g.lineWidth = 0.4; g.stroke();
    });
    S.leaf = Paint.makeSprite({ w: 14, h: 9, ox: 7, oy: 4.5, res: 2 }, (g) => {
      g.fillStyle = P.leafLight; g.beginPath(); g.ellipse(0, 0, 5, 2.4, 0, 0, U.TAU); g.fill();
      g.strokeStyle = P.leafShade; g.lineWidth = 0.5; g.beginPath(); g.moveTo(-4.5, 0); g.lineTo(4.5, 0); g.stroke();
    });

    // hierba y flores repartidas por la superficie del sendero
    const tufts = [], flowers = [];
    for (let i = 0; i < 14; i++) tufts.push(Props.grassTuft(2000 + i));
    const kinds = ['daisy', 'daisy', 'daisy', 'yellow', 'lilac', 'daisy', 'yellow', 'daisy'];
    for (let i = 0; i < 16; i++) flowers.push(Props.flower(kinds[i % kinds.length], 2100 + i));
    const rng = U.makeRng(2200);
    for (const seg of L.ground) {
      for (const run of JHS.Scenery.surfaceRuns(seg)) {
        const x0 = run[0][0], x1 = run[run.length - 1][0];
        for (let x = Math.max(x0, -300) + rng.range(0, 30); x < x1 - 10; x += rng.range(20, 46)) {
          const y = JHS.Scenery.surfaceAt(run, x);
          if (y == null) continue;
          const nearFlowers = x < 1400 || x > 7600 || (x > 5300 && x < 5700) || rng.chance(0.25);
          const isFlower = nearFlowers && rng.chance(0.42);
          const front = rng.chance(0.3);
          const item = { x, y: y + (front ? 5 : 0), spr: isFlower ? rng.pick(flowers) : rng.pick(tufts), ph: rng.range(0, 6.28), k: rng.range(0.6, 1.2), s: front ? rng.range(0.7, 0.9) : rng.range(0.85, 1.15), front };
          (front ? A.decorFront : A.decorBack).push(item);
        }
      }
    }
    A.decorBack.sort((a, b) => a.x - b.x);
    A.decorFront.sort((a, b) => a.x - b.x);

    // árboles: sprites grandes que se mecen apenas desde la base
    for (const t of L.decor.trees) {
      const spr = Props.tree(t.seed, { h: t.h });
      A.trees.push({ x: t.x, y: world.groundY(t.x), spr, ph: t.seed, behind: t.behind });
    }
    // ramas‑plataforma del árbol
    for (const l of L.ledges) {
      if (l.kind !== 'branch') continue;
      const leftSide = l.x1 < 2790;
      const trunkX = 2790;
      const pts = leftSide
        ? [[trunkX - 10, l.y + 26], [l.x1 - 30, l.y + 8], [U.lerp(l.x0, l.x1, 0.45), l.y + 3], [l.x0 - 18, l.y + 2]]
        : [[trunkX + 8, l.y + 30], [l.x0 + 30, l.y + 9], [U.lerp(l.x0, l.x1, 0.55), l.y + 3], [l.x1 + 18, l.y + 1]];
      A.branches.push({ spr: Props.branch(pts, 18, 9, 2300 + l.y), x: 0, y: 0 });
    }

    // mariposas cerca de las flores y pájaros lejanos
    for (let i = 0; i < 7; i++) {
      const bx = [600, 1250, 2400, 5500, 7700, 8000, 8250][i];
      A.butterflies.push({ hx: bx, hy: world.groundY(bx) - 60, x: bx, y: world.groundY(bx) - 60, ph: i * 1.7, col: i % 2 ? P.flowerYellow : '#e9a35c' });
    }
    for (let i = 0; i < 5; i++) A.birds.push({ x: rng.range(0, 4000), y: rng.range(180, 420), v: rng.range(30, 55), ph: rng.range(0, 6), s: rng.range(0.6, 1) });
  };

  A.burst = function (kind, x, y, n, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * U.TAU, sp = Math.random();
      const p = { kind, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 1, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 4, s: 1 };
      if (kind === 'dust') { p.vx = (Math.random() - 0.5) * 70 + (o.dir || 0) * 40; p.vy = -Math.random() * 30 - 5; p.max = 0.55 + Math.random() * 0.3; p.s = 0.6 + Math.random() * 0.8; p.spr = A.spr.dust[i % 3]; }
      else if (kind === 'gold') { p.vx *= 90; p.vy = p.vy * 90 - 40; p.max = 0.9 + Math.random() * 0.6; p.s = 0.4 + Math.random() * 0.6; p.spr = A.spr.gold; }
      else if (kind === 'light') { p.vx = (Math.random() - 0.5) * 16; p.vy = -20 - Math.random() * 30; p.max = 1.4 + Math.random(); p.s = 0.4 + Math.random() * 0.7; p.spr = A.spr.light; }
      else if (kind === 'wool') { p.vx *= 80; p.vy = p.vy * 60 - 30; p.max = 0.7; p.s = 1; p.spr = A.spr.wool; }
      else if (kind === 'petal') { p.vx = 40 + Math.random() * 60; p.vy = -10 + Math.random() * 20; p.max = 4 + Math.random() * 2; p.s = 0.8 + Math.random() * 0.5; p.spr = A.spr.petal; }
      else if (kind === 'leaf') { p.vx = 10 + Math.random() * 25; p.vy = 20 + Math.random() * 20; p.max = 5 + Math.random() * 2; p.s = 0.9 + Math.random() * 0.4; p.spr = A.spr.leaf; }
      A.parts.push(p);
    }
  };

  A.update = function (dt, cam, girl) {
    A.t += dt;
    // ráfagas de viento suaves (el pelo, la hierba y los pétalos las comparten)
    A.gust = U.damp(A.gust, Math.max(0, Math.sin(A.t * 0.23) * Math.sin(A.t * 0.61 + 1)), 0.8, dt);
    A.wind = 0.6 + A.gust * 1.8 + (A.extraWind || 0);
    for (let i = A.parts.length - 1; i >= 0; i--) {
      const p = A.parts[i];
      p.life += dt;
      if (p.life >= p.max) { A.parts.splice(i, 1); continue; }
      if (p.kind === 'petal' || p.kind === 'leaf') { p.vx += (A.wind * 20 - p.vx * 0.3) * dt; p.vy += (Math.sin(p.life * 3 + p.rot) * 30) * dt; }
      else if (p.kind === 'gold' || p.kind === 'light') { p.vy -= 6 * dt; p.vx *= 1 - dt * 1.2; }
      else if (p.kind === 'dust') { p.vy += 20 * dt; p.vx *= 1 - dt * 3; }
      else p.vy += 200 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }
    // hojas que caen de los árboles y pétalos con el viento
    if (Math.random() < dt * 0.6) {
      const t = A.trees[Math.floor(Math.random() * A.trees.length)];
      if (t && Math.abs(t.x - cam.x) < 1300) A.burst('leaf', t.x + (Math.random() - 0.5) * t.spr.w * 0.6, t.y - t.spr.h * 0.6, 1);
    }
    if (A.extraWind && Math.random() < dt * 6) A.burst('petal', cam.x - 1100 + Math.random() * 400, cam.y + (Math.random() - 0.2) * 500, 1);
    for (const b of A.butterflies) {
      b.ph += dt;
      b.x = b.hx + Math.sin(b.ph * 0.7) * 60 + Math.sin(b.ph * 1.9) * 14;
      b.y = b.hy + Math.sin(b.ph * 1.3) * 22 - Math.abs(Math.sin(b.ph * 0.5)) * 30;
    }
    for (const b of A.birds) { b.x += b.v * dt; b.ph += dt * 7; if (b.x > 4300) b.x = -200; }
    void girl;
  };

  // Mecer un sprite anclado en su base (cizalla), sin deformarlo.
  function sway(ctx, spr, x, y, amt, s = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.transform(1, 0, amt, 1, 0, 0);
    ctx.scale(s, s);
    ctx.drawImage(spr.c, -spr.ox, -spr.oy, spr.w, spr.h);
    ctx.restore();
  }

  function drawDecor(ctx, list, view) {
    const t = A.t;
    for (const d of list) {
      if (d.x < view.x0 - 60 || d.x > view.x1 + 60) continue;
      const amt = (Math.sin(t * 1.7 + d.ph) * 0.06 + Math.sin(t * 3.1 + d.ph * 2) * 0.025) * d.k * (0.6 + A.wind * 0.35);
      sway(ctx, d.spr, d.x, d.y, amt, d.s);
    }
  }

  A.drawTrees = function (ctx, view, behindOnly) {
    for (const tr of A.trees) {
      if (!!tr.behind !== behindOnly) continue;
      if (tr.x + tr.spr.w < view.x0 || tr.x - tr.spr.w > view.x1) continue;
      const amt = Math.sin(A.t * 0.8 + tr.ph) * 0.004 * (0.6 + A.wind * 0.5);
      sway(ctx, tr.spr, tr.x, tr.y + 6, amt);
    }
    if (!behindOnly) for (const b of A.branches) ctx.drawImage(b.spr.c, -b.spr.ox, -b.spr.oy, b.spr.w, b.spr.h);
  };

  A.drawBack = function (ctx, view) { drawDecor(ctx, A.decorBack, view); };
  A.drawFront = function (ctx, view) { drawDecor(ctx, A.decorFront, view); };

  A.drawButterflies = function (ctx, view) {
    for (const b of A.butterflies) {
      if (b.x < view.x0 || b.x > view.x1) continue;
      const f = Math.abs(Math.sin(b.ph * 14));
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.fillStyle = b.col;
      ctx.strokeStyle = P.inkSoft;
      ctx.lineWidth = 0.6;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(s * 3.2 * (0.3 + f * 0.7), -1.5, 3.4 * (0.3 + f * 0.7), 2.6, s * 0.4, 0, U.TAU);
        ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = P.ink;
      ctx.fillRect(-0.5, -3, 1, 5);
      ctx.restore();
    }
  };

  // En el espacio de la capa media: «v» de tinta que aletean.
  A.drawBirds = function (ctx) {
    ctx.strokeStyle = P.inkSoft;
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.6;
    for (const b of A.birds) {
      const f = Math.sin(b.ph) * 3 * b.s;
      ctx.beginPath();
      ctx.moveTo(b.x - 7 * b.s, b.y - f);
      ctx.quadraticCurveTo(b.x - 3 * b.s, b.y - 2, b.x, b.y);
      ctx.quadraticCurveTo(b.x + 3 * b.s, b.y - 2, b.x + 7 * b.s, b.y - f);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  A.drawParticles = function (ctx) {
    for (const p of A.parts) {
      const k = p.life / p.max;
      const a = p.kind === 'petal' || p.kind === 'leaf' ? Math.min(1, (1 - k) * 3) : (1 - k) * (k < 0.15 ? k / 0.15 : 1);
      ctx.globalAlpha = a * (p.kind === 'dust' ? 0.55 : 0.9);
      if (p.kind === 'gold' || p.kind === 'light') ctx.globalCompositeOperation = 'screen';
      const s = p.s * (p.kind === 'dust' ? 0.8 + k * 0.8 : 1);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.drawImage(p.spr.c, -p.spr.ox * s, -p.spr.oy * s, p.spr.w * s, p.spr.h * s);
      ctx.restore();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
  };

  JHS.Ambient = A;
})(window.JHS = window.JHS || {});
