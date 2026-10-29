/* Vida del entorno (§19, §20, §38): hierba y flores que se mecen y se apartan al pasar, árboles
   que respiran (y se pueden sacudir), mariposas que huyen y vuelven (o se posan si la niña se
   sienta), pajarillos que picotean y echan a volar, pájaros lejanos, polen en los rayos de sol,
   vaho del aliento y partículas pintadas. Todo sutil: evitar la sobreanimación. */
(function (JHS) {
  'use strict';
  const U = JHS.U, P = JHS.Palette, Paint = JHS.Paint, Props = JHS.Props;

  const A = {
    parts: [],
    spr: {},
    decorBack: [], decorFront: [], trees: [], butterflies: [], birds: [], groundBirds: [], branches: [], motes: [],
    wind: 0, gust: 0, t: 0, actors: [], landOn: null, frightened: 0,
  };

  function blot(col, r, soft) {
    return Paint.makeSprite({ w: r * 2 + 4, h: r * 2 + 4, ox: r + 2, oy: r + 2, res: 1.5 }, (g) => {
      if (soft) { Paint.softBlob(g, 0, 0, r, col, 1); return; }
      Paint.wash(g, U.blobPoly(0, 0, r * 0.8, r * 0.65, 10, U.makeRng(r * 7), 0.3), col, { layers: 4, alpha: 0.3, amp: r * 0.12, seed: r, edge: 0.4 });
    });
  }

  A.init = function (L, world) {
    const S = A.spr;
    const cfg = L.ambient || {};
    A.world = world;
    A.parts = []; A.decorBack = []; A.decorFront = []; A.trees = []; A.butterflies = []; A.birds = []; A.groundBirds = [];
    A.branches = []; A.motes = []; A.t = 0; A.landOn = null; A.extraWind = 0; A.scareAt = null;
    A.gusts = makeGusts(cfg.seed || 77);
    S.dust = [blot(P.pathShade, 9), blot(P.earth, 7), blot(P.rockLight, 8)];
    S.gold = blot('#ffe3a0', 9, true);
    S.light = blot('#fff3cf', 12, true);
    S.breath = blot('#fbf6ee', 10, true);
    S.wool = Paint.makeSprite({ w: 10, h: 10, ox: 5, oy: 5, res: 2 }, (g) => {
      g.strokeStyle = P.woolLight; g.lineWidth = 1;
      g.beginPath(); g.arc(0, 0, 2.6, 0.5, 5.4); g.stroke();
    });
    S.petal = Paint.makeSprite({ w: 12, h: 8, ox: 6, oy: 4, res: 2 }, (g) => {
      g.fillStyle = P.flowerWhite; g.beginPath(); g.ellipse(0, 0, 4.4, 1.9, 0, 0, U.TAU); g.fill();
      g.strokeStyle = P.inkGrey; g.globalAlpha = 0.5; g.lineWidth = 0.4; g.stroke();
    });
    S.bellPetal = Paint.makeSprite({ w: 12, h: 8, ox: 6, oy: 4, res: 2 }, (g) => {
      g.fillStyle = P.bell; g.beginPath(); g.ellipse(0, 0, 4, 2, 0, 0, U.TAU); g.fill();
    });
    S.leaf = Paint.makeSprite({ w: 14, h: 9, ox: 7, oy: 4.5, res: 2 }, (g) => {
      g.fillStyle = P.leafLight; g.beginPath(); g.ellipse(0, 0, 5, 2.4, 0, 0, U.TAU); g.fill();
      g.strokeStyle = P.leafShade; g.lineWidth = 0.5; g.beginPath(); g.moveTo(-4.5, 0); g.lineTo(4.5, 0); g.stroke();
    });
    S.grassBit = Paint.makeSprite({ w: 10, h: 10, ox: 5, oy: 5, res: 2 }, (g) => {
      g.strokeStyle = P.grass; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-3, 3); g.quadraticCurveTo(0, -1, 3, -3); g.stroke();
    });

    // hierba y flores repartidas por la superficie del sendero, en grupos (cada mata comparte
    // la fase de su grupo, con un pequeño desfase propio)
    const tufts = [], flowers = [];
    for (let i = 0; i < 14; i++) tufts.push(Props.grassTuft(2000 + i));
    const kinds = cfg.flowerKinds || ['daisy', 'daisy', 'daisy', 'yellow', 'lilac', 'daisy', 'yellow', 'daisy'];
    for (let i = 0; i < 16; i++) flowers.push(Props.flower(kinds[i % kinds.length], 2100 + i));
    const tall = cfg.tallFlowers ? cfg.tallFlowers.map((k, i) => Props.tallFlower(k, 2150 + i)) : [];
    const dense = cfg.flowerDense || ((x) => x < 1400 || x > 7600 || (x > 5300 && x < 5700));
    const avoid = cfg.avoid || [];
    const rng = U.makeRng(cfg.seed || 2200);
    const groupPh = (x) => U.hash2(Math.floor(x / 130), 3, 17) * 6.28;
    for (const seg of L.ground) {
      for (const run of JHS.Scenery.surfaceRuns(seg)) {
        const x0 = run[0][0], x1 = run[run.length - 1][0];
        for (let x = Math.max(x0, -300) + rng.range(0, 30); x < x1 - 10; x += rng.range(cfg.spacing ? cfg.spacing[0] : 20, cfg.spacing ? cfg.spacing[1] : 46)) {
          const y = JHS.Scenery.surfaceAt(run, x);
          if (y == null || avoid.some(([a, b]) => x > a && x < b)) continue;
          const nearFlowers = dense(x) || rng.chance(0.25);
          const isFlower = nearFlowers && rng.chance(cfg.flowerChance || 0.42);
          const front = rng.chance(0.3);
          const isTall = isFlower && tall.length && !front && rng.chance(0.35);
          const item = { x, y: y + (front ? 5 : 0), spr: isTall ? null : isFlower ? rng.pick(flowers) : rng.pick(tufts), tall: isTall ? rng.pick(tall) : null,
            ph: groupPh(x) + rng.range(-0.5, 0.5), k: rng.range(0.6, 1.2), s: front ? rng.range(0.7, 0.9) : rng.range(0.85, 1.15), front, bend: 0, bendV: 0,
            flower: isFlower, flex: isTall ? 0.8 : isFlower ? 0.85 : 1, delay: isFlower ? 0.08 : 0 };
          (front ? A.decorFront : A.decorBack).push(item);
        }
      }
    }
    A.decorBack.sort((a, b) => a.x - b.x);
    A.decorFront.sort((a, b) => a.x - b.x);
    A.decorAll = A.decorBack.concat(A.decorFront).sort((a, b) => a.x - b.x);

    // árboles: sprites grandes que se mecen apenas desde la base
    for (const t of (L.decor && L.decor.trees) || []) {
      const spr = (L.treeSprite && L.treeSprite(t)) || Props.tree(t.seed, { h: t.h, kind: t.kind });
      A.trees.push({ x: t.x, y: world.groundY(t.x), spr, ph: t.seed, behind: t.behind, shakeT: 0 });
    }
    // ramas‑plataforma del árbol
    for (const l of L.ledges || []) {
      if (l.kind !== 'branch') continue;
      const trunkX = l.trunkX || 2790;
      const leftSide = l.x1 < trunkX;
      const pts = leftSide
        ? [[trunkX - 10, l.y + 26], [l.x1 - 30, l.y + 8], [U.lerp(l.x0, l.x1, 0.45), l.y + 3], [l.x0 - 18, l.y + 2]]
        : [[trunkX + 8, l.y + 30], [l.x0 + 30, l.y + 9], [U.lerp(l.x0, l.x1, 0.55), l.y + 3], [l.x1 + 18, l.y + 1]];
      A.branches.push({ spr: Props.branch(pts, 18, 9, 2300 + l.y), x: 0, y: 0 });
    }

    // mariposas cerca de las flores
    const bxs = cfg.butterflies || [600, 1250, 2400, 5500, 7700, 8000, 8250];
    bxs.forEach((bx, i) => {
      const gy = world.groundY(bx);
      if (gy == null) return;
      const hy = gy - 60;
      A.butterflies.push({ hx: bx, hy, x: bx, y: hy, ph: i * 1.7, col: i % 2 ? P.flowerYellow : '#e9a35c', mode: 'wander', t: 0, vx: 0, vy: 0, ang: 0 });
    });
    // pajarillos posados en el sendero o en las rocas
    for (const grp of L.birds || []) {
      for (let i = 0; i < grp.n; i++) {
        const x = grp.x + (i - grp.n / 2) * rng.range(22, 34);
        const gy = world.groundY(x);
        if (gy == null) continue;
        A.groundBirds.push({ hx: x, x, y: gy, gy, vx: 0, vy: 0, state: 'peck', t: rng.range(0, 3), peck: 0, hop: 0, facing: rng.chance(0.5) ? 1 : -1,
          col: rng.pick(['#8a6a4c', '#7b6a55', '#9a7b5a']), s: rng.range(0.85, 1.1), alpha: 1, goneT: 0 });
      }
    }
    // pájaros lejanos (en el espacio de la capa media)
    for (let i = 0; i < (cfg.farBirds == null ? 5 : cfg.farBirds); i++) A.birds.push({ x: rng.range(0, 4000), y: rng.range(180, 420), v: rng.range(30, 55), ph: rng.range(0, 6), s: rng.range(0.6, 1) });
    // motas de polen que flotan en la luz
    for (let i = 0; i < (cfg.motes == null ? 46 : cfg.motes); i++) A.motes.push({ x: rng.range(-1100, 1100), y: rng.range(-600, 500), ph: rng.range(0, 6.28), s: rng.range(0.3, 0.8), v: rng.range(6, 16) });
  };

  // ------------------------------------------------------------------ viento
  // Ráfagas con calendario propio: duraciones e intervalos distintos y, a veces, una calma larga.
  // El viento sopla siempre hacia la derecha y viaja por el paisaje: cada cosa lo recibe un poco
  // más tarde según su posición y su masa (la hierba antes que los arbustos, éstos antes que los
  // árboles), así nada se mueve en bloque ni en un bucle evidente.
  const GUST_V = 260; // velocidad a la que viaja la ráfaga (unidades/s)
  function makeGusts(seed) {
    const rng = U.makeRng(seed * 31 + 7);
    const list = [];
    let t = -6;
    while (t < 3600) {
      const calm = rng.chance(0.22);
      t += calm ? rng.range(9, 15) : rng.range(2.5, 8);
      const dur = rng.range(1.4, 3.6), peak = rng.range(0.45, 1.15);
      list.push({ t0: t, dur, peak });
      t += dur * 0.6;
    }
    return list;
  }
  // Intensidad de ráfaga (0…~1.2) en el instante t, con forma suave de subida y caída.
  function gustAt(t) {
    const L = A.gusts;
    if (!L || !L.length) return 0;
    let lo = 0, hi = L.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (L[m].t0 <= t) lo = m; else hi = m - 1; }
    let g = 0;
    for (let i = Math.max(0, lo - 1); i <= Math.min(L.length - 1, lo + 1); i++) {
      const q = (t - L[i].t0) / L[i].dur;
      if (q > 0 && q < 1) g += L[i].peak * Math.pow(Math.sin(Math.PI * q), 2) * (q < 0.3 ? 1 : 1 - 0.25 * (q - 0.3));
    }
    return g;
  }
  // Ráfaga tal como llega a la posición x, con el retraso propio del material.
  A.gustAt = function (x, delay = 0) { return gustAt(A.t - delay - (x - (A.camX || 0)) / GUST_V); };

  A.burst = function (kind, x, y, n, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * U.TAU, sp = Math.random();
      const p = { kind, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 1, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 4, s: 1 };
      if (kind === 'dust') { p.vx = (Math.random() - 0.5) * 70 + (o.dir || 0) * 40; p.vy = -Math.random() * 30 - 5; p.max = 0.55 + Math.random() * 0.3; p.s = (0.6 + Math.random() * 0.8) * (o.s || 1); p.spr = A.spr.dust[i % 3]; }
      else if (kind === 'gold') { p.vx *= 90; p.vy = p.vy * 90 - 40; p.max = 0.9 + Math.random() * 0.6; p.s = 0.4 + Math.random() * 0.6; p.spr = A.spr.gold; }
      else if (kind === 'light') { p.vx = (Math.random() - 0.5) * 16; p.vy = -20 - Math.random() * 30; p.max = 1.4 + Math.random(); p.s = 0.4 + Math.random() * 0.7; p.spr = A.spr.light; }
      else if (kind === 'wool') { p.vx *= 80; p.vy = p.vy * 60 - 30; p.max = 0.7; p.s = 1; p.spr = A.spr.wool; }
      else if (kind === 'petal') { p.vx = 40 + Math.random() * 60; p.vy = -10 + Math.random() * 20; p.max = 4 + Math.random() * 2; p.s = 0.8 + Math.random() * 0.5; p.spr = A.spr.petal; }
      else if (kind === 'bell') { p.vx *= 50; p.vy = p.vy * 40 - 30; p.max = 1.4; p.s = 0.9; p.spr = A.spr.bellPetal; }
      else if (kind === 'leaf') { p.vx = 10 + Math.random() * 25 + (o.dir || 0) * 30; p.vy = 20 + Math.random() * 20; p.max = 5 + Math.random() * 2; p.s = 0.9 + Math.random() * 0.4; p.spr = A.spr.leaf; }
      else if (kind === 'grass') { p.vx = (Math.random() - 0.5) * 60; p.vy = -40 - Math.random() * 40; p.max = 0.6; p.s = 0.9; p.spr = A.spr.grassBit; }
      else if (kind === 'breath') { p.vx = (o.dir || 1) * (10 + Math.random() * 8); p.vy = -6 - Math.random() * 4; p.max = 1.6; p.s = 0.35; p.spr = A.spr.breath; p.vr = 0; }
      A.parts.push(p);
    }
  };

  // Sacudir un árbol: se agita la copa y caen hojas.
  A.shakeTree = function (x) {
    const tr = A.trees.find((t) => Math.abs(t.x - x) < 5);
    if (!tr) return;
    tr.shakeT = 1.3;
    for (let i = 0; i < 26; i++) A.burst('leaf', tr.x + (Math.random() - 0.5) * tr.spr.w * 0.7, tr.y - tr.spr.h * (0.5 + Math.random() * 0.35), 1);
    A.scare(tr.x, 520);
  };

  // Un ruido o un movimiento brusco espanta a los pájaros y mariposas cercanos.
  A.scare = function (x, r) { A.scareAt = { x, r, t: 0.1 }; };

  // ------------------------------------------------------------------ actualización
  A.update = function (dt, cam, actors) {
    A.t += dt;
    A.actors = actors || [];
    // ráfagas de viento suaves (el pelo, la hierba y los pétalos las comparten)
    A.camX = cam.x;
    A.gust = gustAt(A.t);
    A.wind = 0.35 + A.gust * 1.7 + (A.extraWind || 0);
    for (let i = A.parts.length - 1; i >= 0; i--) {
      const p = A.parts[i];
      p.life += dt;
      if (p.life >= p.max) { A.parts.splice(i, 1); continue; }
      if (p.kind === 'petal' || p.kind === 'leaf') { p.vx += (A.wind * 20 - p.vx * 0.3) * dt; p.vy += (Math.sin(p.life * 3 + p.rot) * 30) * dt; }
      else if (p.kind === 'gold' || p.kind === 'light') { p.vy -= 6 * dt; p.vx *= 1 - dt * 1.2; }
      else if (p.kind === 'dust') { p.vy += 20 * dt; p.vx *= 1 - dt * 3; }
      else if (p.kind === 'breath') { p.vx *= 1 - dt * 0.8; p.s += dt * 0.5; }
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
    for (const tr of A.trees) {
      if (tr.shakeT > 0) {
        tr.shakeT = Math.max(0, tr.shakeT - dt);
        if (Math.random() < dt * 20) A.burst('leaf', tr.x + (Math.random() - 0.5) * tr.spr.w * 0.7, tr.y - tr.spr.h * (0.45 + Math.random() * 0.4), 1);
      }
    }
    if (A.extraWind && Math.random() < dt * 6) A.burst('petal', cam.x - 1100 + Math.random() * 400, cam.y + (Math.random() - 0.2) * 500, 1);
    updateDecor(dt, cam);
    updateButterflies(dt);
    updateGroundBirds(dt);
    for (const b of A.birds) { b.x += b.v * dt; b.ph += dt * 7; if (b.x > 4300) b.x = -200; }
    // polen: deriva lenta con el viento alrededor de la cámara
    for (const m of A.motes) {
      m.ph += dt;
      m.x += (A.wind * 8 + Math.sin(m.ph * 0.7) * 6) * dt;
      m.y += (Math.sin(m.ph * 0.9) * 5 - m.v * 0.25) * dt;
      if (m.x > 1150) m.x -= 2300;
      if (m.y < -650) m.y += 1150;
    }
    if (A.scareAt) { A.scareAt.t -= dt; if (A.scareAt.t <= 0) A.scareAt = null; }
  };

  // Hierba y flores: se apartan del pie que pasa y vuelven con un muelle.
  function updateDecor(dt, cam) {
    const list = A.decorAll;
    const x0 = cam.x - 1200, x1 = cam.x + 1200;
    let lo = 0, hi = list.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (list[m].x < x0) lo = m + 1; else hi = m; }
    const h = Math.min(dt, 0.05);
    for (let i = lo; i < list.length && list[i].x < x1; i++) {
      const d = list[i];
      let target = 0;
      for (const a of A.actors) {
        const dx = d.x - a.x;
        if (Math.abs(dx) < 44 && Math.abs(a.y - d.y) < 34) {
          target += Math.sign(dx || 1) * (1 - Math.abs(dx) / 44) * 0.6 * (a.big ? 1.2 : 1);
          if (Math.abs(a.vx) > 120 && Math.random() < dt * 3 && d.flower) A.burst('petal', d.x, d.y - 18, 1);
        }
      }
      d.bendV += ((U.clamp(target, -0.75, 0.75) - d.bend) * 140 - d.bendV * 9) * h;
      d.bend += d.bendV * h;
    }
  }

  // Inclinación de una planta suelta (las campanillas) cuando alguien pasa por encima.
  A.bendAt = function (x, y) {
    let t = 0;
    for (const a of A.actors || []) {
      const dx = x - a.x;
      if (Math.abs(dx) < 40 && (y == null || Math.abs(a.y - y) < 34)) t += Math.sign(dx || 1) * (1 - Math.abs(dx) / 40) * 0.5;
    }
    return U.clamp(t, -0.6, 0.6);
  };

  function near(x, y, r) {
    for (const a of A.actors) if (Math.hypot(a.x - x, (a.y - 70) - y) < r) return a;
    return null;
  }

  function updateButterflies(dt) {
    for (const b of A.butterflies) {
      b.ph += dt;
      b.t += dt;
      const scared = A.scareAt && Math.abs(A.scareAt.x - b.x) < A.scareAt.r;
      const threat = near(b.x, b.y, 95);
      if (b.mode === 'wander') {
        b.x = b.hx + Math.sin(b.ph * 0.7) * 60 + Math.sin(b.ph * 1.9) * 14;
        b.y = b.hy + Math.sin(b.ph * 1.3) * 22 - Math.abs(Math.sin(b.ph * 0.5)) * 30;
        if ((threat && Math.abs(threat.vx) > 30) || scared) {
          const dir = Math.sign(b.x - (threat ? threat.x : A.scareAt.x)) || 1;
          b.mode = 'flee'; b.t = 0; b.vx = dir * (130 + Math.random() * 60); b.vy = -110 - Math.random() * 50;
        } else if (A.landOn && Math.hypot(A.landOn.x - b.x, A.landOn.y - b.y) < 520 && !A.butterflies.some((o) => o.mode === 'land' || o.mode === 'rest')) {
          b.mode = 'land'; b.t = 0;
        }
      } else if (b.mode === 'flee') {
        b.vy += 40 * dt;
        b.x += b.vx * dt + Math.sin(b.ph * 9) * 30 * dt;
        b.y += b.vy * dt + Math.cos(b.ph * 7) * 20 * dt;
        if (b.t > 1.8) { b.mode = 'return'; b.t = 0; }
      } else if (b.mode === 'return') {
        const tx = b.hx + Math.sin(b.ph * 0.7) * 60, ty = b.hy;
        b.x = U.damp(b.x, tx, 0.9, dt) + Math.sin(b.ph * 8) * 18 * dt;
        b.y = U.damp(b.y, ty, 0.9, dt) + Math.cos(b.ph * 6) * 14 * dt;
        if (Math.hypot(tx - b.x, ty - b.y) < 8 || b.t > 6) { b.mode = 'wander'; }
      } else if (b.mode === 'land' || b.mode === 'rest') {
        if (!A.landOn || threat && Math.abs(threat.vx) > 30 || scared) {
          b.mode = 'flee'; b.t = 0; b.vx = (Math.random() < 0.5 ? -1 : 1) * 150; b.vy = -120;
        } else if (b.mode === 'land') {
          // se acerca en espiral y se posa
          const tx = A.landOn.x, ty = A.landOn.y;
          const k = U.clamp(b.t / 3.5, 0, 1);
          b.x = U.damp(b.x, tx + Math.sin(b.ph * 2) * 40 * (1 - k), 1.2 + k * 3, dt);
          b.y = U.damp(b.y, ty + Math.cos(b.ph * 2.6) * 30 * (1 - k) - 10 * (1 - k), 1.2 + k * 3, dt);
          if (k >= 1 && Math.hypot(tx - b.x, ty - b.y) < 4) b.mode = 'rest';
        } else {
          b.x = A.landOn.x; b.y = A.landOn.y;
        }
      }
    }
  }

  function updateGroundBirds(dt) {
    for (const b of A.groundBirds) {
      b.t += dt;
      if (b.state === 'peck') {
        b.peck = Math.max(0, b.peck - dt);
        b.hop = Math.max(0, b.hop - dt);
        if (b.peck <= 0 && Math.random() < dt * 0.9) b.peck = 0.3;
        if (b.hop <= 0 && Math.random() < dt * 0.35) { b.hop = 0.25; b.facing = Math.random() < 0.5 ? 1 : -1; }
        if (b.hop > 0) {
          const nx = b.x + b.facing * 60 * dt;
          if (Math.abs(nx - b.hx) < 50) b.x = nx;
          const gy = A.world.groundY(b.x);
          if (gy != null) b.gy = gy;
          b.y = b.gy - Math.sin((1 - b.hop / 0.25) * Math.PI) * 6;
        } else b.y = b.gy;
        const a = near(b.x, b.y, 220);
        const scared = A.scareAt && Math.abs(A.scareAt.x - b.x) < A.scareAt.r;
        if ((a && (Math.hypot(a.x - b.x, a.y - b.y) < 150 || Math.abs(a.vx) > 200)) || scared) {
          const dir = Math.sign(b.x - (a ? a.x : A.scareAt.x)) || 1;
          b.state = 'fly'; b.t = 0; b.facing = dir;
          b.vx = dir * (170 + Math.random() * 120); b.vy = -260 - Math.random() * 120;
          if (JHS.Sound && Math.random() < 0.5) JHS.Sound.play('birds');
        }
      } else if (b.state === 'fly') {
        b.vy += 60 * dt;
        b.vy = Math.max(b.vy, -380);
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.alpha = 1 - U.smoothstep(2.2, 3.4, b.t);
        if (b.t > 3.4) { b.state = 'gone'; b.goneT = 0; }
      } else if (b.state === 'gone') {
        b.goneT += dt;
        // vuelven cuando no hay nadie cerca
        if (b.goneT > 18 && !near(b.hx, b.gy, 900)) { b.state = 'peck'; b.x = b.hx; b.y = b.gy; b.alpha = 1; b.t = 0; }
      }
    }
  }

  // ------------------------------------------------------------------ dibujo
  // Mecer un sprite girándolo sobre su base: rígido, sin deformar el papel ni la línea.
  function sway(ctx, spr, x, y, amt, s = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(amt);
    ctx.scale(s, s);
    ctx.drawImage(spr.c, -spr.ox, -spr.oy, spr.w, spr.h);
    ctx.restore();
  }

  // Inclinación de una planta: respiración mínima de su grupo + la ráfaga que le llega.
  function plantAngle(d, delay) {
    const t = A.t - delay;
    const breathe = Math.sin(t * 1.3 + d.ph) * 0.012 + Math.sin(t * 2.9 + d.ph * 1.7) * 0.006;
    const g = A.gustAt(d.x, d.delay + delay);
    const flutter = g * Math.sin(t * 7 + d.ph * 3) * 0.02;
    return ((breathe + flutter) * (1 + (A.extraWind || 0) * 0.5) + g * 0.16 + (A.extraWind || 0) * 0.05) * d.flex * d.k + d.bend;
  }

  function drawDecor(ctx, list, view) {
    for (const d of list) {
      if (d.x < view.x0 - 60 || d.x > view.x1 + 60) continue;
      if (d.tall) { drawTall(ctx, d); continue; }
      const amt = plantAngle(d, 0);
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(amt);
      ctx.scale(d.s, d.s);
      ctx.drawImage(d.spr.c, -d.spr.ox, -d.spr.oy, d.spr.w, d.spr.h);
      ctx.restore();
    }
  }

  // Flor alta en dos piezas: el tallo se inclina y la flor le sigue con un poco de retraso.
  function drawTall(ctx, d) {
    const T = d.tall, a1 = plantAngle(d, 0), a2 = plantAngle(d, 0.16);
    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.scale(d.s, d.s);
    ctx.rotate(a1);
    ctx.drawImage(T.stem.c, -T.stem.ox, -T.stem.oy, T.stem.w, T.stem.h);
    ctx.translate(T.tip[0], T.tip[1]);
    ctx.rotate((a2 - a1) * 1.6);
    ctx.drawImage(T.head.c, -T.head.ox, -T.head.oy, T.head.w, T.head.h);
    ctx.restore();
  }

  A.drawTrees = function (ctx, view, behindOnly) {
    for (const tr of A.trees) {
      if (!!tr.behind !== behindOnly) continue;
      if (tr.x + tr.spr.w < view.x0 || tr.x - tr.spr.w > view.x1) continue;
      const shake = tr.shakeT > 0 ? Math.sin(A.t * 31) * 0.018 * Math.min(1, tr.shakeT) : 0;
      // los árboles reciben la ráfaga tarde y apenas la acusan
      const amt = Math.sin(A.t * 0.8 + tr.ph) * 0.0025 + A.gustAt(tr.x, 0.5) * 0.006 + shake;
      sway(ctx, tr.spr, tr.x, tr.y + 6, amt);
    }
    if (!behindOnly) for (const b of A.branches) ctx.drawImage(b.spr.c, -b.spr.ox, -b.spr.oy, b.spr.w, b.spr.h);
  };

  A.drawBack = function (ctx, view) { drawDecor(ctx, A.decorBack, view); };
  A.drawFront = function (ctx, view) { drawDecor(ctx, A.decorFront, view); };

  A.drawButterflies = function (ctx, view) {
    for (const b of A.butterflies) {
      if (b.x < view.x0 || b.x > view.x1) continue;
      const resting = b.mode === 'rest';
      const f = resting ? 0.25 + 0.2 * Math.abs(Math.sin(b.ph * 1.6)) : Math.abs(Math.sin(b.ph * 14));
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.fillStyle = b.col;
      ctx.strokeStyle = P.inkSoft;
      ctx.lineWidth = 0.6;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(s * 3.2 * (0.3 + f * 0.7), -1.5, 3.4 * (0.3 + f * 0.7), 2.6, s * 0.4, 0, U.TAU);
        ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(s * 2.2 * (0.3 + f * 0.7), 1.6, 2.2 * (0.3 + f * 0.7), 1.7, -s * 0.3, 0, U.TAU);
        ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = P.ink;
      ctx.fillRect(-0.5, -3, 1, 5);
      ctx.restore();
    }
  };

  // Pajarillo pintado: cuerpo redondo, capucha oscura, pecho claro, cola y pico; en vuelo, alas en «v».
  A.drawGroundBirds = function (ctx, view) {
    for (const b of A.groundBirds) {
      if (b.state === 'gone' || b.alpha <= 0.01 || b.x < view.x0 - 40 || b.x > view.x1 + 40) continue;
      ctx.save();
      ctx.globalAlpha = b.alpha;
      ctx.translate(b.x, b.y);
      ctx.scale(b.facing * b.s, b.s);
      const fly = b.state === 'fly';
      const peck = b.peck > 0 ? Math.sin((1 - b.peck / 0.3) * Math.PI) : 0;
      ctx.lineCap = 'round';
      if (!fly) {
        ctx.strokeStyle = P.inkSoft; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(-1.5, -3); ctx.lineTo(-2, 0); ctx.moveTo(1.5, -3); ctx.lineTo(2, 0); ctx.stroke();
      }
      ctx.rotate(fly ? -0.2 : peck * 0.5);
      // cola
      ctx.fillStyle = U.darken(b.col, 0.3);
      ctx.beginPath(); ctx.moveTo(-6, -7); ctx.lineTo(-13, -9 - (fly ? 0 : 2)); ctx.lineTo(-12, -6); ctx.closePath(); ctx.fill();
      // cuerpo
      ctx.fillStyle = b.col;
      ctx.beginPath(); ctx.ellipse(0, -7, 7, 4.6, 0, 0, U.TAU); ctx.fill();
      ctx.fillStyle = '#ead8bb';
      ctx.beginPath(); ctx.ellipse(1.6, -5.2, 4.2, 2.4, 0.2, 0, U.TAU); ctx.fill();
      ctx.fillStyle = '#4a3a30';
      ctx.beginPath(); ctx.arc(5.4, -10.2 + peck * 4, 3.1, 0, U.TAU); ctx.fill();
      ctx.fillStyle = '#d9a24b';
      ctx.beginPath(); ctx.moveTo(8.2, -10.6 + peck * 4); ctx.lineTo(10.8, -9.8 + peck * 4.6); ctx.lineTo(8.1, -9.2 + peck * 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff6e6';
      ctx.beginPath(); ctx.arc(6.2, -10.8 + peck * 4, 0.6, 0, U.TAU); ctx.fill();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 0.7; ctx.globalAlpha = b.alpha * 0.8;
      ctx.beginPath(); ctx.ellipse(0, -7, 7, 4.6, 0, Math.PI * 0.15, Math.PI * 1.05); ctx.stroke();
      // alas
      ctx.globalAlpha = b.alpha;
      ctx.fillStyle = U.darken(b.col, 0.18);
      if (fly) {
        const f = Math.sin(b.t * 30);
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(-1, -8);
          ctx.quadraticCurveTo(-5, -8 - 12 * f * s, -10, -6 - 14 * f * s);
          ctx.lineTo(2, -8);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        ctx.beginPath(); ctx.ellipse(-1.5, -7.4, 4.4, 2.3, 0.1, 0, U.TAU); ctx.fill();
      }
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

  // Polen en la luz: puntitos cálidos que brillan al cruzar los rayos (en espacio de pantalla
  // centrado en la cámara, para que siempre haya alguno cerca).
  A.drawMotes = function (ctx, cam, boost) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const m of A.motes) {
      const x = cam.x + m.x, y = cam.y + m.y;
      const tw = 0.5 + 0.5 * Math.sin(m.ph * 2.3);
      ctx.globalAlpha = (0.25 + 0.4 * tw) * (0.6 + boost);
      ctx.drawImage(A.spr.gold.c, x - 5 * m.s, y - 5 * m.s, 10 * m.s, 10 * m.s);
    }
    ctx.restore();
  };

  A.drawParticles = function (ctx) {
    for (const p of A.parts) {
      const k = p.life / p.max;
      const a = p.kind === 'petal' || p.kind === 'leaf' ? Math.min(1, (1 - k) * 3) : (1 - k) * (k < 0.15 ? k / 0.15 : 1);
      ctx.globalAlpha = a * (p.kind === 'dust' ? 0.55 : p.kind === 'breath' ? 0.45 : 0.9);
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
