/* La Oveja — compañera (Biblia §10, §11): cuerpo compacto de lana oscura con rizos definidos y
   motas claras, cabeza beige, ojos pequeños, orejas laterales con interior rosado, patas
   delgadas con pezuñas oscuras y expresión amable. Ni realista ni caricaturesca. */
(function (JHS) {
  'use strict';
  const U = JHS.U, Paint = JHS.Paint, P = JHS.Palette, Rig = JHS.Rig;

  const RES = 2.2;
  const POST = { edge: 0.4, grain: 0.3, density: 0.06 };

  const M = {
    body: [-4, -52],          // centro del cuerpo de lana (relativo a los pies)
    neck: [33, -58],          // unión de la cabeza
    legs: [[23, -28], [15, -29], [-25, -28], [-33, -29]], // del. cerca, del. lejos, tras. cerca, tras. lejos
    legLen: 28,
  };
  const S = {};
  const HEAD_K = 1.25;
  let built = false;

  // Silueta de lana: elipse con chichones de rizos.
  function woolOutline(rx, ry, bumps, rng, cx = 0, cy = 0) {
    const pts = [];
    for (let i = 0; i < bumps; i++) {
      const a0 = (i / bumps) * U.TAU, a1 = ((i + 1) / bumps) * U.TAU;
      const r = rng.range(0.9, 1.06);
      for (let k = 0; k < 5; k++) {
        const a = U.lerp(a0, a1, k / 5);
        const bump = Math.sin((k / 5) * Math.PI) * rng.range(0.06, 0.11);
        pts.push([cx + Math.cos(a) * rx * (r + bump), cy + Math.sin(a) * ry * (r + bump)]);
      }
    }
    return pts;
  }

  // Rizo: pequeña espiral abierta.
  function curl(g, x, y, r, col, w, a, rng) {
    const a0 = rng.range(0, U.TAU), turn = rng.range(3.6, 5.2) * (rng.chance(0.5) ? 1 : -1);
    g.strokeStyle = col;
    g.lineWidth = w;
    g.globalAlpha = a;
    g.beginPath();
    for (let k = 0; k <= 10; k++) {
      const t = k / 10;
      const ang = a0 + turn * t, rr = r * (1 - t * 0.55);
      const px = x + Math.cos(ang) * rr, py = y + Math.sin(ang) * rr * 0.85;
      if (k === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.stroke();
  }

  function paintBody(g) {
    const rng = U.makeRng(301);
    const out = woolOutline(48, 31, 15, rng);
    const poly = U.spline(out.filter((_, i) => i % 2 === 0), 2, true);
    Paint.wash(g, poly, U.mix(P.wool, P.woolMid, 0.3), { layers: 7, alpha: 0.24, amp: 1.2, seed: 303, edge: 0.25, core: 1, vary: P.woolMid, varyAmt: 0.5 });
    Paint.within(g, poly, () => {
      Paint.shade(g, U.blobPoly(-4, 24, 52, 18, 14, rng, 0.2), P.woolMid, { layers: 6, alpha: 0.16, amp: 5, seed: 304, edge: 0 });
      Paint.wash(g, U.blobPoly(8, -18, 36, 14, 14, rng, 0.25), P.woolLight, { layers: 5, alpha: 0.18, amp: 4, seed: 305, edge: 0 });
      // rizos definidos: oscuros por todo el cuerpo, claros sobre todo arriba (luz)
      g.lineCap = 'round';
      for (let i = 0; i < 150; i++) {
        const a = rng.range(0, U.TAU), d = Math.sqrt(rng.next());
        const x = Math.cos(a) * 46 * d, y = Math.sin(a) * 29 * d;
        curl(g, x, y, rng.range(2.4, 4.4), rng.chance(0.5) ? P.woolDark : '#2a170b', rng.range(0.8, 1.3), rng.range(0.5, 0.85), rng);
      }
      for (let i = 0; i < 170; i++) {
        const a = rng.range(0, U.TAU), d = Math.sqrt(rng.next());
        const x = Math.cos(a) * 45 * d + 2, y = Math.sin(a) * 28 * d;
        const top = y < 6;
        curl(g, x, y, rng.range(2.2, 4), top && rng.chance(0.7) ? '#b8976f' : P.woolLight, rng.range(0.75, 1.15), rng.range(0.5, top ? 0.9 : 0.6), rng);
      }
      g.globalAlpha = 1;
      Paint.splatter(g, 0, -2, 46, 28, 130, P.woolFleck, { alpha: 0.9, rmin: 0.4, rmax: 1.2, seed: 306 });
    });
    // contorno de rizos: arcos encadenados en lugar de una línea continua
    const R = U.resample(out, 7, true);
    for (let i = 0; i < R.length; i++) {
      const [x, y] = R[i];
      const ang = Math.atan2(y / 31, x / 48);
      const pts = [];
      for (let k = 0; k <= 6; k++) {
        const t = ang - 1.3 + (k / 6) * 2.6;
        pts.push([x + Math.cos(t) * 4.2, y + Math.sin(t) * 3.6]);
      }
      Paint.ink(g, pts, { w: 1.15, alpha: 0.8, seed: 310 + i, taper: 0.35, wobble: 0.2 });
    }
    for (let i = 0; i < 18; i++) {
      const [x, y] = R[Math.floor(rng.next() * R.length)];
      curl(g, x * 1.03, y * 1.03, rng.range(2.4, 3.6), P.ink, 0.9, 0.7, rng);
    }
    g.globalAlpha = 1;
  }

  function paintHead(g) {
    const rng = U.makeRng(321);
    const head = U.spline([[-9, -11], [3, -15.5], [15, -12], [21.5, -4], [22, 4.5], [17.5, 10.5], [8, 12.5], [-2, 10], [-9, 4], [-11, -4]], 3, true);
    Paint.wash(g, head, P.sheepFace, { layers: 6, alpha: 0.24, amp: 0.4, seed: 322, edge: 0.25, core: 1 });
    Paint.within(g, head, () => {
      Paint.shade(g, [[-16, -18], [0, -18], [-2, 0], [2, 16], [-16, 16]], P.sheepFaceShade, { layers: 5, alpha: 0.14, amp: 4, seed: 323, edge: 0 });
      Paint.shade(g, U.blobPoly(8, 12, 14, 4, 10, rng, 0.2), P.sheepFaceShade, { layers: 4, alpha: 0.16, amp: 3, seed: 324, edge: 0 });
      Paint.wash(g, U.blobPoly(12, -8, 7, 4.5, 10, rng, 0.2), '#fde3bf', { layers: 4, alpha: 0.35, amp: 1, seed: 325, edge: 0 });
      Paint.softBlob(g, 4, 3.5, 4.6, P.blush, 0.32);
      Paint.softBlob(g, 19, 1, 2.6, P.blush, 0.2);
    });
    Paint.ink(g, head, { closed: true, w: 1.25, wv: 0.4, breaks: 0.08, seed: 326, alpha: 0.85, bleed: 0.5 });
    // copete de lana sobre la frente
    const tuft = woolOutline(10, 6.5, 6, rng, 0, -13);
    Paint.wash(g, tuft, P.wool, { layers: 5, alpha: 0.3, amp: 0.6, seed: 327, edge: 0.3, core: 1 });
    Paint.within(g, tuft, () => {
      for (let i = 0; i < 16; i++) curl(g, rng.range(-9, 9), -13 + rng.range(-5, 5), rng.range(1.8, 3), rng.chance(0.5) ? P.woolLight : P.woolDark, 0.8, 0.7, rng);
      Paint.splatter(g, 0, -13, 9, 5, 10, P.woolFleck, { alpha: 0.8, rmin: 0.35, rmax: 0.8, seed: 328 });
    });
    const tr = U.resample(tuft, 5, true);
    for (let i = 0; i < tr.length; i++) {
      if (tr[i][1] > -12) continue;
      const [x, y] = tr[i];
      Paint.ink(g, [[x - 2.5, y + 1], [x, y - 2.4], [x + 2.5, y + 1]], { w: 0.9, alpha: 0.75, seed: 330 + i, taper: 0.3 });
    }
    g.globalAlpha = 1;
  }

  // Cola: un mechón de lana rizada que se mueve aparte (se menea cuando está contenta).
  function paintTail(g) {
    const rng = U.makeRng(351);
    const tail = woolOutline(8, 9, 6, rng, -5, 6);
    Paint.wash(g, tail, P.wool, { layers: 5, alpha: 0.3, amp: 0.8, seed: 302, edge: 0.3, core: 1 });
    Paint.within(g, tail, () => {
      for (let i = 0; i < 9; i++) curl(g, -5 + rng.range(-6, 6), 6 + rng.range(-7, 7), rng.range(1.8, 2.8), rng.chance(0.5) ? P.woolLight : P.woolDark, 0.8, 0.7, rng);
      Paint.splatter(g, -5, 6, 7, 8, 8, P.woolFleck, { alpha: 0.8, rmin: 0.35, rmax: 0.8, seed: 352 });
    });
    const R = U.resample(tail, 5, true);
    for (let i = 0; i < R.length; i++) {
      const [x, y] = R[i];
      const a = Math.atan2(y - 6, x + 5);
      Paint.ink(g, [[x + Math.cos(a - 1.2) * 3, y + Math.sin(a - 1.2) * 3], [x + Math.cos(a) * 1.6, y + Math.sin(a) * 1.6], [x + Math.cos(a + 1.2) * 3, y + Math.sin(a + 1.2) * 3]], { w: 0.9, alpha: 0.75, seed: 353 + i, taper: 0.35 });
    }
    g.globalAlpha = 1;
  }

  function paintEar(g, far) {
    const ear = U.spline([[0, -1.5], [-6, -4.2], [-13.5, -3.5], [-17.5, 0.5], [-12, 3.4], [-4, 3]], 3, true);
    const inner = U.spline([[-2.5, -0.6], [-7, -2.2], [-13, -1.4], [-14, 0.8], [-8, 1.8]], 3, true);
    Paint.wash(g, ear, far ? P.sheepFaceShade : P.sheepFace, { layers: 5, alpha: 0.28, amp: 0.3, seed: far ? 341 : 342, edge: 0.3, core: 1 });
    Paint.wash(g, inner, P.earInner, { layers: 4, alpha: 0.4, amp: 0.25, seed: 343, edge: 0.2, core: 0.6 });
    Paint.ink(g, ear, { closed: true, w: 1.05, alpha: 0.85, seed: far ? 344 : 345, breaks: 0.08 });
  }

  function build() {
    if (built) return;
    Paint.withInk(1.25, buildParts);
    built = true;
  }

  function buildParts() {
    const mk = (w, h, ox, oy, fn) => Paint.makeSprite({ w, h, ox, oy, res: RES, post: POST }, fn);
    S.body = mk(124, 82, 64, 41, paintBody);
    S.head = mk(40, 36, 13, 20, paintHead);
    S.earN = mk(22, 12, 19, 6, (g) => paintEar(g, false));
    S.earF = mk(22, 12, 19, 6, (g) => paintEar(g, true));
    S.tail = mk(30, 34, 15, 4, paintTail);
  }

  function create(x, y) {
    return {
      x, y, vx: 0, vy: 0, facing: 1, alpha: 1, scale: 1,
      anim: 'idle', animT: 0, phase: 0, t: Math.random() * 10, speed: 0, grounded: true,
      blinkT: 1.5, blink: 0, earT: 2, ear: 0, expr: 'contenta', exprT: 0,
      headLook: 0, chew: 0, pose: null,
      // cola, balido (bocadillo «¡Beee!») y hacia dónde mira (una mariposa, la niña)
      tail: 0, tailV: 0, wag: 0, bleatT: 0, bleatText: '¡Beee!', lookAt: null, lookK: 0,
    };
  }

  function setAnim(s, a) {
    if (s.anim !== a) { s.anim = a; s.animT = 0; }
  }

  // ------------------------------------------------------------------ poses
  function update(s, dt) {
    s.t += dt;
    s.animT += dt;
    s.blinkT -= dt;
    if (s.blinkT <= 0) { s.blink = 0.14; s.blinkT = 2 + Math.random() * 3.5; }
    s.blink = Math.max(0, s.blink - dt);
    s.earT -= dt;
    if (s.earT <= 0) { s.ear = 0.35; s.earT = 2.5 + Math.random() * 4; }
    s.ear = Math.max(0, s.ear - dt);
    s.exprT = Math.max(0, s.exprT - dt);

    const ps = {
      bodyX: 0, bodyY: 0, bodyRot: 0, sx: 1, sy: 1,
      headX: 0, headY: 0, headRot: 0,
      earRot: Math.sin(s.ear * 18) * 0.25 * (s.ear > 0 ? 1 : 0),
      legs: M.legs.map(() => ({ swing: 0, lift: 0, fold: 0 })),
      eyes: 'open', mouth: 'smile', jitter: 0,
    };
    const a = s.anim;
    const br = Math.sin(s.t * U.TAU * 0.4);
    if (a === 'walk' || a === 'run') {
      const run = a === 'run' ? 1 : 0;
      const stride = run ? 40 : 26;
      s.phase = (s.phase + (Math.max(s.speed, 20) / (stride * 2)) * dt) % 1;
      const ph = s.phase * U.TAU;
      if (run) {
        // galope: pares delantero y trasero, cuerpo que cabecea y rebota
        ps.bodyY = -Math.abs(Math.sin(ph)) * 5;
        ps.bodyRot = Math.sin(ph) * 0.07;
        const f = Math.sin(ph), b = Math.sin(ph + Math.PI * 0.9);
        ps.legs[0].swing = f * 0.6; ps.legs[1].swing = f * 0.55;
        ps.legs[2].swing = b * 0.6; ps.legs[3].swing = b * 0.55;
        for (const l of ps.legs) l.lift = Math.max(0, -l.swing) * 0.5;
        ps.headY = ps.bodyY * 0.6 + Math.sin(ph + 1) * 1.5;
        ps.headRot = -0.05 + Math.sin(ph) * 0.05;
      } else {
        ps.bodyY = -Math.abs(Math.sin(ph)) * 1.4;
        ps.bodyRot = Math.sin(ph * 2) * 0.012;
        ps.sy = 1 + Math.abs(Math.cos(ph)) * 0.018;
        ps.sx = 1 - Math.abs(Math.cos(ph)) * 0.01;
        const sw = [Math.sin(ph), Math.sin(ph + Math.PI), Math.sin(ph + Math.PI), Math.sin(ph)];
        for (let i = 0; i < 4; i++) { ps.legs[i].swing = sw[i] * 0.38; ps.legs[i].lift = Math.max(0, Math.cos(ph + (i === 1 || i === 2 ? Math.PI : 0))) * 0.35; }
        ps.headY = Math.sin(ph * 2) * 1.1;
        ps.headRot = Math.sin(ph * 2) * 0.03;
      }
    } else if (a === 'jump') {
      const up = U.smoothstep(100, -500, s.vy), dn = U.smoothstep(100, 600, s.vy);
      ps.bodyRot = -0.16 * up + 0.12 * dn;
      for (let i = 0; i < 4; i++) ps.legs[i].fold = 0.7 * up + 0.2;
      ps.legs[0].swing = 0.5 * up - 0.2 * dn; ps.legs[1].swing = 0.45 * up - 0.2 * dn;
      ps.legs[2].swing = -0.5 * up + 0.3 * dn; ps.legs[3].swing = -0.45 * up + 0.3 * dn;
      ps.earRot = -0.4 * up + 0.3 * dn;
      ps.headRot = -0.12 * up + 0.08 * dn;
    } else if (a === 'sleep') {
      const sb = Math.sin(s.t * U.TAU * 0.22);
      ps.bodyY = 17;
      ps.sy = 0.96 + sb * 0.02;
      for (const l of ps.legs) l.fold = 1;
      ps.headY = 19; ps.headX = 2; ps.headRot = 0.32;
      ps.eyes = 'sleep'; ps.mouth = 'none';
      ps.earRot = 0.35;
    } else if (a === 'eat') {
      const k = U.smoothstep(0, 0.4, s.animT);
      const lift = Math.max(0, Math.sin(s.animT * 0.9)) > 0.97 ? 1 : 0;
      ps.headRot = 0.95 * k * (1 - lift * 0.6);
      ps.headY = 20 * k * (1 - lift * 0.6);
      ps.headX = 5 * k;
      ps.mouth = Math.sin(s.animT * 9) > 0 ? 'open' : 'smile';
      ps.bodyRot = 0.04 * k;
    } else if (a === 'sniff') {
      const k = U.smoothstep(0, 0.3, s.animT);
      ps.headRot = 0.42 * k + Math.sin(s.animT * 16) * 0.04;
      ps.headY = 9 * k; ps.headX = 4 * k;
      ps.mouth = 'none';
    } else if (a === 'scared') {
      ps.bodyX = -4; ps.jitter = 0.9;
      ps.sx = 0.97; ps.sy = 1.03;
      ps.eyes = 'wide'; ps.mouth = 'o';
      ps.earRot = 0.55; ps.headRot = -0.08; ps.headX = -3;
    } else if (a === 'happy') {
      const hop = Math.abs(Math.sin(s.animT * Math.PI * 2.4)) * (s.animT < 1.2 ? 1 : 0);
      ps.bodyY = -9 * hop; ps.headY = -9 * hop;
      for (let i = 0; i < 4; i++) ps.legs[i].fold = hop * 0.5;
      ps.eyes = 'happy'; ps.earRot = -0.3 * hop;
    } else if (a === 'shake') {
      ps.bodyRot = Math.sin(s.animT * 80) * 0.07 * (1 - U.smoothstep(0.4, 0.7, s.animT));
      ps.headRot = -ps.bodyRot * 1.5;
      ps.eyes = 'happy';
    } else if (a === 'lookup') {
      ps.headRot = -0.42; ps.headY = -3;
      ps.eyes = 'open';
    } else {
      // idle: respiración, pequeño cabeceo, mirar alrededor
      ps.sy = 1 + br * 0.015; ps.sx = 1 - br * 0.006;
      ps.headY = br * 0.8;
      ps.headRot = Math.sin(s.t * 0.5) * 0.05 + s.headLook;
    }
    // mirar hacia algo: la cabeza se levanta o baja hacia ello
    if (s.lookAt && (a === 'idle' || a === 'lookup' || a === 'walk')) {
      const dx = (s.lookAt.x - s.x) * s.facing, dy = s.lookAt.y - (s.y - 60);
      const want = dx > -20 ? U.clamp(Math.atan2(dy, Math.abs(dx) + 50) * 0.6, -0.45, 0.3) : 0;
      s.lookK = U.damp(s.lookK, want, 4, dt);
    } else s.lookK = U.damp(s.lookK, 0, 4, dt);
    ps.headRot += s.lookK;
    // cola: meneo rápido si está contenta, vaivén lento si no
    s.wag = Math.max(0, s.wag - dt);
    const wagAmp = s.wag > 0 || a === 'happy' ? 0.55 : a === 'run' ? 0.25 : 0.08;
    const tailT = Math.sin(s.t * (s.wag > 0 || a === 'happy' ? 19 : 2.2)) * wagAmp + (a === 'run' ? -0.35 : 0);
    s.tailV += ((tailT - s.tail) * 220 - s.tailV * 12) * Math.min(dt, 0.05);
    s.tail += s.tailV * Math.min(dt, 0.05);
    ps.tail = s.tail;
    // balido: boca abierta y la cabeza un poco hacia arriba
    if (s.bleatT > 0) {
      s.bleatT -= dt;
      const k = U.smoothstep(0, 0.12, 1.2 - s.bleatT) * U.smoothstep(0, 0.2, s.bleatT);
      ps.mouth = 'open';
      ps.headRot -= 0.16 * k;
    }
    if (s.blink > 0 && ps.eyes === 'open') ps.eyes = 'blink';
    if (s.exprT > 0) {
      if (s.expr === 'contenta') { ps.eyes = 'happy'; ps.mouth = 'smile'; }
      else if (s.expr === 'curiosa') { ps.headRot -= 0.12; ps.eyes = ps.eyes === 'blink' ? 'blink' : 'open'; ps.mouth = 'small'; }
      else if (s.expr === 'asustada') { ps.eyes = 'wide'; ps.mouth = 'o'; ps.earRot = 0.5; }
    }
    s.pose = ps;
  }

  // ------------------------------------------------------------------ dibujo
  function drawLeg(ctx, x, y, l, far, len) {
    const col = far ? U.mix(P.sheepLeg, P.sheepFaceShade, 0.55) : P.sheepLeg;
    const sw = l.swing, fold = l.fold;
    const kx = x + Math.sin(sw) * len * 0.5, ky = y + Math.cos(sw) * len * 0.5 * (1 - fold * 0.4);
    const fx = kx + Math.sin(sw * 0.5 - fold * 1.6) * len * 0.5 * (1 - fold * 0.35), fy = ky + Math.cos(sw * 0.5 - fold * 1.6) * len * 0.5 * (1 - fold * 0.35) - l.lift * 6;
    Rig.limb(ctx, x, y, kx, ky, fx, fy, 5.6, 4.6, 4.2, col, P.ink, 1.1);
    ctx.fillStyle = P.hoof;
    ctx.beginPath();
    ctx.ellipse(fx + 0.6, fy + 1, 3.2, 2.4, sw * 0.4, 0, U.TAU);
    ctx.fill();
  }

  function drawFace(ctx, ps) {
    const eyes = [[6.2, -3.4, 1.9, 2.4], [15.6, -5.2, 1.6, 2.2]];
    ctx.lineCap = 'round';
    for (const [x, y, rx, ry] of eyes) {
      ctx.fillStyle = P.eye;
      ctx.strokeStyle = P.eye;
      ctx.lineWidth = 1.05;
      ctx.beginPath();
      if (ps.eyes === 'happy') { ctx.arc(x, y + 1, rx * 1.2, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
      else if (ps.eyes === 'blink' || ps.eyes === 'sleep') { ctx.arc(x, y - 1.2, rx * 1.2, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); }
      else {
        const k = ps.eyes === 'wide' ? 1.3 : 1;
        ctx.ellipse(x, y, rx * k, ry * k, 0, 0, U.TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,250,240,0.85)';
        ctx.beginPath(); ctx.arc(x + rx * 0.35, y - ry * 0.4, 0.55, 0, U.TAU); ctx.fill();
      }
    }
    // nariz y boca en «y»
    ctx.strokeStyle = U.mix(P.mouth, P.ink, 0.5);
    ctx.lineWidth = 0.95;
    ctx.beginPath();
    ctx.moveTo(17.4, 1.2); ctx.lineTo(19.6, 0.6);
    ctx.moveTo(18.5, 1); ctx.lineTo(18.2, 4.4);
    if (ps.mouth === 'smile') { ctx.moveTo(14.4, 4.2); ctx.quadraticCurveTo(18.2, 7.4, 21, 3.8); }
    else if (ps.mouth === 'small') { ctx.moveTo(16, 5); ctx.quadraticCurveTo(18.2, 6.4, 20.2, 4.8); }
    ctx.stroke();
    if (ps.mouth === 'o' || ps.mouth === 'open') {
      ctx.fillStyle = U.rgba(P.mouth, 0.85);
      ctx.beginPath(); ctx.ellipse(18.2, 6.2, ps.mouth === 'o' ? 1.8 : 1.4, ps.mouth === 'o' ? 2.2 : 1.2, 0, 0, U.TAU); ctx.fill();
    }
  }

  const BOX = [-85, -125, 85, 24];

  function draw(ctx, s) {
    const ps = s.pose;
    if (!ps || s.alpha <= 0.004) return;
    ctx.save();
    ctx.translate(s.x + (ps.jitter ? Math.sin(s.t * 70) * ps.jitter : 0), s.y);
    ctx.scale(s.facing * s.scale, s.scale);
    Rig.faded(ctx, s.alpha, BOX, (c) => drawBody(c, s, ps));
    ctx.restore();
  }

  function drawBody(ctx, s, ps) {
    const bx = M.body[0] + ps.bodyX, by = M.body[1] + ps.bodyY;
    const c = Math.cos(ps.bodyRot), sn = Math.sin(ps.bodyRot);
    const toBody = (x, y) => {
      const dx = x - M.body[0], dy = y - M.body[1];
      return [bx + dx * c - dy * sn, by + dx * sn + dy * c];
    };
    // patas lejanas, luego cercanas (por detrás de la lana)
    for (const i of [1, 3, 0, 2]) {
      const [lx, ly] = toBody(M.legs[i][0], M.legs[i][1]);
      const len = M.legLen * (1 - ps.legs[i].fold * 0.45);
      if (ps.legs[i].fold >= 1) continue;
      drawLeg(ctx, lx, ly, ps.legs[i], i === 1 || i === 3, len - (ly - (M.body[1] + 24)) * 0);
    }
    // oreja lejana detrás de la cabeza
    const [nx, ny] = toBody(M.neck[0], M.neck[1]);
    const hx = nx + ps.headX, hy = ny + ps.headY, hr = ps.bodyRot + ps.headRot;
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(hr);
    ctx.scale(HEAD_K, HEAD_K);
    ctx.save(); ctx.translate(15, -9); ctx.scale(-1, 1); ctx.rotate(0.25 - ps.earRot); Rig.part(ctx, S.earF, 0, 0); ctx.restore();
    ctx.restore();
    // cola (detrás) y cuerpo de lana
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(ps.bodyRot);
    ctx.scale(ps.sx, ps.sy);
    Rig.part(ctx, S.tail, -44, -6, -0.35 + (ps.tail || 0));
    Rig.part(ctx, S.body, 0, 0);
    ctx.restore();
    // cabeza, oreja cercana y cara
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(hr);
    ctx.scale(HEAD_K, HEAD_K);
    Rig.part(ctx, S.head, 0, 0);
    drawFace(ctx, ps);
    ctx.save(); ctx.translate(-4, -4); ctx.rotate(0.35 + ps.earRot); Rig.part(ctx, S.earN, 0, 0); ctx.restore();
    ctx.restore();
  }

  function bleat(s, text) {
    s.bleatT = 1.2;
    s.bleatText = text || (Math.random() < 0.5 ? '¡Beee!' : '¡Mee!');
    s.wag = 1.5;
  }

  // Bocadillo de papel con el balido, sobre la cabeza (se dibuja en espacio de mundo).
  function drawBubble(ctx, s) {
    if (s.bleatT <= 0 || s.alpha < 0.5) return;
    const k = U.smoothstep(0, 0.15, 1.2 - s.bleatT) * U.smoothstep(0, 0.25, s.bleatT);
    const x = s.x + s.facing * 26, y = s.y - 118 - (1 - k) * 8;
    ctx.save();
    ctx.globalAlpha = k;
    ctx.translate(x, y);
    ctx.rotate(-0.06 * s.facing);
    ctx.font = 'italic 700 19px "Alegreya", Georgia, serif';
    const w = ctx.measureText(s.bleatText).width + 26;
    Paint.paperScrap(ctx, -w / 2, -17, w, 32, { seed: 404, rough: 1.6 });
    ctx.fillStyle = P.ink;
    ctx.textAlign = 'center';
    ctx.fillText(s.bleatText, 0, 6);
    ctx.restore();
  }

  JHS.Sheep = { M, S, build, create, update, draw, setAnim, bleat, drawBubble };
})(window.JHS = window.JHS || {});
