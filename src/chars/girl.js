/* La Niña — protagonista. Identidad innegociable (Biblia §8): cabeza grande sin ser chibi,
   cuerpo delgado, piernas largas y finas, ojos negros pequeños, nariz pequeña, boca mínima,
   mejillas rosadas, pelo marrón oscuro abundante y desordenado, suéter-vestido verde grisáceo
   tejido, medias oscuras, botines anaranjados con cordones y mochila de cuero.
   Cada pieza se pinta una vez (acuarela + tinta) y un esqueleto la anima: así todos los
   cuadros conservan exactamente las mismas proporciones (§14). */
(function (JHS) {
  'use strict';
  const U = JHS.U, Paint = JHS.Paint, P = JHS.Palette, Rig = JHS.Rig;

  const RES = 2.2;
  const POST = { edge: 0.38, grain: 0.22, density: 0.06 };

  // Medidas en unidades lógicas (mirando a la derecha, origen en los pies, y negativa hacia arriba).
  const M = {
    H: 170,
    hipY: -66.5, thigh: 30, shin: 29.5, ankleY: -8,
    hipJ: [[2.6, 1], [-2.6, 1]],      // articulaciones de cadera (espacio del torso) cerca / lejos
    neck: [1, -40],                    // cuello en el espacio del torso
    sh: [[7.5, -36], [-6, -36.5]],     // hombros cerca / lejos
    upper: 18.5, fore: 16,
    face: [2, -28],                    // centro de la cara relativo al cuello
  };
  const LEG = M.thigh + M.shin;

  const S = {}; // sprites pintados
  let built = false;

  // ------------------------------------------------------------------ pintura de piezas
  function knit(g, x0a, x0b, x1a, x1b, y0, y1, n, col, alpha, seed, w = 0.7) {
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const xa = U.lerp(x0a, x0b, u), xb = U.lerp(x1a, x1b, u);
      Paint.ink(g, [[xa, y0], [U.lerp(xa, xb, 0.5) + Math.sin(i * 1.7) * 0.4, (y0 + y1) / 2], [xb, y1]],
        { w, alpha, color: col, wobble: 0.25, seed: seed + i, taper: 0.15, wv: 0.4 });
    }
  }

  function paintTorso(g) {
    const rng = U.makeRng(11);
    const pts = [[-8, -46], [-3, -48.5], [4, -48.5], [9, -46], [10.5, -41], [14, -38.5], [16.5, -34], [17, -27],
      [16.6, -18], [17.6, -8], [19.6, 0], [21.6, 6], [23.6, 12.6], [17, 14.6], [8, 13.7], [0, 14.9], [-8, 13.7],
      [-16, 14.6], [-22.4, 12.6], [-20.4, 6], [-18.4, 0], [-16.4, -8], [-15.6, -18], [-15.6, -27], [-14.6, -34],
      [-12.6, -38.5], [-9.6, -41]];
    const poly = U.spline(pts, 3, true);
    Paint.wash(g, poly, P.sweater, { layers: 7, alpha: 0.2, amp: 0.6, seed: 11, edge: 0.25, core: 1, vary: P.sweaterLight, varyAmt: 0.5 });
    Paint.within(g, poly, () => {
      Paint.shade(g, [[-28, -52], [-7, -52], [-10, -24], [-7, 20], [-30, 20]], P.sweaterShade,
        { layers: 6, alpha: 0.14, amp: 5, seed: 12, edge: 0.04 });
      Paint.shade(g, U.blobPoly(12.5, -21, 5.5, 12, 10, rng, 0.2), P.sweaterShade, { layers: 5, alpha: 0.14, amp: 2.9, seed: 13, edge: 0 });
      Paint.shade(g, U.blobPoly(0, 13, 26, 4, 12, rng, 0.2), P.sweaterShade, { layers: 4, alpha: 0.14, amp: 2.6, seed: 14, edge: 0 });
      Paint.wash(g, U.blobPoly(10, -35, 7, 4.5, 10, rng, 0.3), P.sweaterLight, { layers: 4, alpha: 0.32, amp: 1, seed: 15, edge: 0, blend: 'source-over' });
      // punto elástico vertical
      knit(g, -13, 15, -20.5, 22.5, -40, 8, 11, P.sweaterDeep, 0.3, 20);
      // banda elástica del borde
      for (let x = -22; x <= 23.5; x += 1.55) {
        const yb = 13.4 + Math.sin(x * 0.4) * 0.6;
        Paint.ink(g, [[x - (x / 23) * 0.6, 8.6], [x, yb]], { w: 0.55, alpha: 0.38, color: P.sweaterDeep, wobble: 0.1, seed: 60 + x * 3, taper: 0.1 });
      }
      Paint.ink(g, [[-21, 8.2], [0, 9], [22.8, 8.2]], { w: 0.7, alpha: 0.5, color: P.sweaterDeep, seed: 90 });
      // cuello alto enrollado
      for (let k = 0; k < 3; k++) {
        const y = -46.5 + k * 2.2;
        Paint.ink(g, [[-8.5 + k * 0.4, y + 1.5], [0, y - 0.3], [9.4 - k * 0.3, y + 1.5]], { w: 0.65, alpha: 0.42, color: P.sweaterDeep, seed: 95 + k });
      }
    });
    Paint.ink(g, poly, { closed: true, w: 1.45, wv: 0.5, breaks: 0.12, sketch: 0.5, seed: 13, alpha: 0.9, bleed: 0.6 });
  }

  function paintTorsoBack(g) {
    const pts = [[-9, -45], [0, -47.5], [9, -45], [11, -41], [15, -38], [16.5, -30], [16.5, -18], [18, -6], [21, 4], [23, 12.5],
      [12, 14.6], [0, 14], [-12, 14.6], [-23, 12.5], [-21, 4], [-18, -6], [-16.5, -18], [-16.5, -30], [-15, -38], [-11, -41]];
    const poly = U.spline(pts, 3, true);
    Paint.wash(g, poly, P.sweater, { layers: 7, alpha: 0.2, amp: 0.6, seed: 31, edge: 0.25, core: 1, vary: P.sweaterShade, varyAmt: 0.4 });
    Paint.within(g, poly, () => {
      Paint.shade(g, [[-26, -50], [-8, -50], [-8, 20], [-28, 20]], P.sweaterShade, { layers: 5, alpha: 0.13, amp: 4.8, seed: 32, edge: 0 });
      knit(g, -14, 14, -21.5, 21.5, -40, 8, 12, P.sweaterDeep, 0.3, 40);
      for (let x = -22; x <= 22; x += 1.6) Paint.ink(g, [[x, 8.6], [x, 13.6]], { w: 0.55, alpha: 0.36, color: P.sweaterDeep, wobble: 0.1, seed: 70 + x, taper: 0.1 });
    });
    Paint.ink(g, poly, { closed: true, w: 1.45, wv: 0.5, breaks: 0.12, sketch: 0.5, seed: 33, alpha: 0.9, bleed: 0.6 });
  }

  function paintHead(g) {
    const rng = U.makeRng(21);
    const face = U.spline([[2, -50.5], [11, -49], [18, -44], [21.2, -36], [21.7, -29], [21.1, -22], [18.6, -15], [13.6, -9.6],
      [7, -6.6], [1, -6.1], [-6, -7.6], [-12, -11.6], [-16, -18], [-17.6, -27], [-16.8, -36], [-12.5, -44], [-6, -49.3]], 3, true);
    // cuello
    const neck = U.spline([[-4.2, -11], [6, -11], [6.6, 3], [-4.6, 3]], 2, true);
    Paint.wash(g, neck, U.mix(P.skin, P.skinShade, 0.45), { layers: 5, alpha: 0.3, amp: 0.4, seed: 22, edge: 0.3, core: 1 });
    Paint.ink(g, [[-4.2, -10], [-4.6, 3]], { w: 1, alpha: 0.7, seed: 23 });
    Paint.ink(g, [[6, -10], [6.6, 3]], { w: 1, alpha: 0.7, seed: 24 });
    // oreja (lado de atrás)
    const ear = U.spline([[-14.5, -31.5], [-19, -31], [-20.4, -26], [-18.6, -21], [-14.5, -20.6]], 3, true);
    Paint.wash(g, face, P.skin, { layers: 7, alpha: 0.22, amp: 0.45, seed: 25, edge: 0.18, core: 1, vary: P.skinLight, varyAmt: 0.5 });
    Paint.wash(g, ear, P.skin, { layers: 5, alpha: 0.3, amp: 0.3, seed: 26, edge: 0.3, core: 1 });
    Paint.within(g, ear, () => Paint.shade(g, U.blobPoly(-17, -26, 2.2, 3.6, 8, rng, 0.2), P.skinShade, { layers: 4, alpha: 0.3, amp: 2.6, seed: 27, edge: 0 }));
    Paint.ink(g, ear, { closed: true, w: 1.1, alpha: 0.8, seed: 28, breaks: 0.1 });
    Paint.ink(g, [[-16, -29], [-18, -26.5], [-16.6, -23.5]], { w: 0.7, alpha: 0.6, seed: 29 });
    Paint.within(g, face, () => {
      Paint.shade(g, [[-22, -56], [-5, -56], [-9, -30], [-4, 0], [-24, 0]], P.skinShade, { layers: 6, alpha: 0.1, amp: 4.8, seed: 30, edge: 0 });
      Paint.shade(g, U.blobPoly(4, -6.5, 16, 5.5, 12, rng, 0.2), P.skinShade, { layers: 4, alpha: 0.16, amp: 2.6, seed: 31, edge: 0 });
      Paint.wash(g, U.blobPoly(14, -38, 7, 6, 10, rng, 0.25), P.skinLight, { layers: 4, alpha: 0.32, amp: 1, seed: 32, edge: 0, blend: 'source-over' });
      // mejillas rosadas: la cercana grande a la izquierda, la lejana en el borde
      Paint.softBlob(g, -1.6, -19.6, 6.4, P.blush, 0.34);
      Paint.softBlob(g, 18.6, -20.4, 3.9, P.blush, 0.26);
      Paint.splatter(g, -1.4, -19.6, 3.6, 2.5, 6, U.darken(P.blush, 0.25), { alpha: 0.35, rmin: 0.3, rmax: 0.55, seed: 33 });
    });
    // nariz: botón pequeño entre los ojos, más cerca del ojo lejano (vista 3/4 de la lámina)
    Paint.wash(g, U.blobPoly(12.8, -23.6, 2.6, 2.3, 9, rng, 0.1), U.mix(P.skin, P.blush, 0.35), { layers: 4, alpha: 0.35, amp: 0.2, seed: 34, edge: 0.2 });
    Paint.ink(g, [[10.5, -22.4], [12.4, -21.1], [14.8, -21.9]], { w: 0.85, alpha: 0.72, seed: 35, taper: 0.4 });
    Paint.softBlob(g, 13.4, -24.8, 1, '#fff6e6', 0.8);
    Paint.ink(g, face, { closed: true, w: 1.35, wv: 0.45, breaks: 0.08, sketch: 0.35, seed: 36, alpha: 0.88, bleed: 0.5 });
  }

  // Pelo (§8.3): cada mechón nace en el cuero cabelludo, sale hacia fuera, la gravedad lo
  // dobla y un rizo irregular lo ondula. Así el volumen cae hacia los hombros como en la lámina.
  const SKULL = [-1, -31];
  function growStrand(rng, x, y, ang, len, grav, frizz) {
    const pts = [[x, y]];
    let dx = Math.cos(ang), dy = Math.sin(ang);
    const steps = Math.max(3, Math.round(len / 3));
    const st = len / steps;
    const ph = rng.range(0, 6.28), fq = rng.range(0.7, 1.5);
    for (let k = 1; k <= steps; k++) {
      dy += grav * 0.22;
      const l = Math.hypot(dx, dy);
      dx /= l; dy /= l;
      const w = Math.sin(ph + k * fq) * frizz;
      x += (dx - dy * w) * st;
      y += (dy + dx * w) * st;
      pts.push([x, y]);
    }
    return pts;
  }

  function strokeStrand(g, pts, col, w, a) {
    g.strokeStyle = col;
    g.lineWidth = w;
    g.globalAlpha = a;
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      g.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
    }
    const L = pts[pts.length - 1];
    g.lineTo(L[0], L[1]);
    g.stroke();
  }

  // n mechones con raíces entre los ángulos th0..th1 del cráneo.
  function hairStrands(g, rng, n, sc, th0, th1, len0, len1, grav, frizz, cols, w0, w1, a0, a1, rootK = 0.86, turn = 0, spread = 0.3) {
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (let i = 0; i < n; i++) {
      const th = rng.range(th0, th1);
      const k = rootK * rng.range(0.75, 1.04);
      const x = sc[0] + Math.cos(th) * 21 * k, y = sc[1] + Math.sin(th) * 23 * k;
      const pts = growStrand(rng, x, y, th + turn + rng.range(-spread, spread), rng.range(len0, len1), grav, frizz * rng.range(0.5, 1.3));
      strokeStrand(g, pts, rng.pick(cols), rng.range(w0, w1), rng.range(a0, a1));
    }
    g.globalAlpha = 1;
  }

  // Pelos sueltos desde la silueta de la masa hacia fuera.
  function flyaways(g, rng, n, poly, center, cols, keep) {
    g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const p = poly[Math.floor(rng.next() * poly.length)];
      const ang = Math.atan2(p[1] - center[1], p[0] - center[0]);
      if (keep && !keep(ang)) continue;
      const pts = growStrand(rng, p[0] - Math.cos(ang) * 3, p[1] - Math.sin(ang) * 3, ang + rng.range(-0.5, 0.5), rng.range(6, 15), 0.35, rng.range(0.3, 0.8));
      strokeStrand(g, pts, rng.pick(cols), rng.range(0.45, 0.85), rng.range(0.55, 0.9));
    }
    g.globalAlpha = 1;
  }

  function paintHairBack(g) {
    const rng = U.makeRng(41);
    const sc = SKULL;
    const mass = U.spline([[-2, -60], [10, -59], [19, -53], [24, -42], [26, -29], [25.5, -16], [21, -9], [15, -13], [10, -19],
      [0, -15], [-7, -7], [-14, 4], [-26, 9], [-37, 2], [-43, -13], [-42.5, -31], [-35, -48], [-21, -57]], 3, true);
    Paint.wash(g, mass, P.hair, { layers: 7, alpha: 0.24, amp: 2, seed: 42, edge: 0.2, core: 1, vary: P.hairDark, varyAmt: 0.5 });
    Paint.within(g, mass, () => {
      Paint.shade(g, U.blobPoly(-26, -12, 16, 18, 12, rng, 0.25), P.hairDark, { layers: 5, alpha: 0.2, amp: 4.8, seed: 43, edge: 0 });
      Paint.wash(g, U.blobPoly(8, -52, 16, 8, 12, rng, 0.3), P.hairMid, { layers: 5, alpha: 0.2, amp: 2, seed: 44, edge: 0 });
    });
    const dark = [P.hairDark, P.hair, P.hairDark], mid = [P.hair, P.hairMid, P.hairMid, P.hairRed], lite = [P.hairLight, P.hairMid, P.hairLight, P.hairRed];
    hairStrands(g, rng, 150, sc, -Math.PI * 1.06, -Math.PI * 0.6, 30, 52, 1, 0.42, dark, 0.8, 1.7, 0.6, 0.9);
    hairStrands(g, rng, 46, sc, -0.5, 0.15, 14, 26, 1.3, 0.4, dark, 0.7, 1.4, 0.6, 0.9, 0.9);
    // la parte de arriba se peina hacia atrás y cae: volumen redondo, no púas
    hairStrands(g, rng, 95, sc, -Math.PI * 0.8, -Math.PI * 0.3, 16, 30, 1.05, 0.38, mid, 0.7, 1.4, 0.55, 0.88, 0.86, -0.75);
    hairStrands(g, rng, 55, sc, -Math.PI * 0.66, -Math.PI * 0.25, 12, 22, 1, 0.4, lite, 0.5, 1.05, 0.5, 0.85, 0.86, -0.6);
    flyaways(g, rng, 60, mass, [sc[0] - 4, sc[1]], [P.hairDark, P.hair, P.hairMid], (a) => (a < -Math.PI * 0.55 && a > -Math.PI * 1.02) || a > 1.9);
    Paint.splatter(g, 4, -50, 16, 8, 16, '#f3d9b2', { alpha: 0.5, rmin: 0.3, rmax: 0.55, seed: 45 });
    // tinta sobre algunos mechones (como el entintado de la lámina)
    for (let i = 0; i < 44; i++) {
      const th = rng.range(-Math.PI * 1.08, -Math.PI * 0.25);
      const x = sc[0] + Math.cos(th) * 18, y = sc[1] + Math.sin(th) * 20;
      Paint.ink(g, growStrand(rng, x, y, th + rng.range(-0.3, 0.3), rng.range(14, 36), 0.9, 0.45), { w: 0.7, alpha: 0.7, seed: 46 + i, taper: 0.5, wobble: 0.2 });
    }
  }

  function paintBangs(g) {
    const rng = U.makeRng(51);
    // base del flequillo: solo la zona de la raíz, el resto lo dibujan los mechones
    const cap = U.spline([[-8, -50], [2, -56.5], [13, -54], [19, -47.5], [15, -46], [9, -47], [3, -45.5], [-3, -47], [-8, -46.5]], 3, true);
    Paint.wash(g, cap, P.hair, { layers: 6, alpha: 0.22, amp: 0.7, seed: 52, edge: 0.15, core: 1, vary: P.hairMid, varyAmt: 0.5 });
    // flequillo: raíces en la coronilla, caen hacia delante sobre la frente
    hairStrands(g, rng, 60, [2, -38], -Math.PI * 0.72, -Math.PI * 0.32, 12, 20, 1.15, 0.32, [P.hairDark, P.hair, P.hairMid, P.hairMid], 0.6, 1.3, 0.6, 0.95, 0.78, 1.25, 0.35);
    hairStrands(g, rng, 16, [2, -38], -Math.PI * 0.6, -Math.PI * 0.3, 10, 16, 1, 0.35, [P.hairLight, P.hairMid], 0.5, 0.9, 0.6, 0.9, 0.8, 1.2, 0.3);
    // mechones que caen por delante del borde de la cara
    for (let i = 0; i < 6; i++) {
      const pts = growStrand(rng, rng.range(15, 20), rng.range(-50, -45), rng.range(0.6, 1.2), rng.range(14, 22), 1.4, 0.25);
      strokeStrand(g, pts, rng.pick([P.hairDark, P.hair, P.hairMid]), rng.range(0.6, 1.1), 0.85);
    }
    g.globalAlpha = 1;
    for (let i = 0; i < 8; i++) {
      const x0 = rng.range(-5, 15);
      Paint.ink(g, growStrand(rng, x0, -55, 0.9, rng.range(12, 17), 1.1, 0.2), { w: 0.75, alpha: 0.6, seed: 53 + i, taper: 0.5 });
    }
  }

  function paintHairBackView(g) {
    const rng = U.makeRng(61);
    const sc = [0, -33];
    const mass = U.spline([[0, -60], [18, -56], [31, -44], [35, -26], [33, -8], [26, 4], [12, 8], [0, 9], [-12, 8], [-26, 4], [-33, -8], [-35, -26], [-31, -44], [-18, -56]], 3, true);
    Paint.wash(g, mass, P.hair, { layers: 7, alpha: 0.24, amp: 2, seed: 62, edge: 0.2, core: 1, vary: P.hairDark, varyAmt: 0.5 });
    Paint.within(g, mass, () => Paint.wash(g, U.blobPoly(6, -50, 18, 9, 12, rng, 0.3), P.hairMid, { layers: 5, alpha: 0.2, amp: 2, seed: 63, edge: 0 }));
    hairStrands(g, rng, 170, sc, -Math.PI * 1.08, 0.08, 30, 50, 1, 0.32, [P.hairDark, P.hair, P.hairDark], 0.8, 1.7, 0.6, 0.9, 0.7);
    hairStrands(g, rng, 120, sc, -Math.PI * 0.85, -Math.PI * 0.15, 20, 38, 0.8, 0.38, [P.hair, P.hairMid, P.hairMid], 0.7, 1.4, 0.55, 0.88, 0.7);
    hairStrands(g, rng, 60, sc, -Math.PI * 0.7, -Math.PI * 0.25, 14, 26, 0.7, 0.4, [P.hairLight, P.hairMid], 0.5, 1.0, 0.5, 0.85, 0.7);
    flyaways(g, rng, 80, mass, sc, [P.hairDark, P.hair, P.hairMid], (a) => a < 0.6 || a > 2.5);
    Paint.splatter(g, 6, -48, 18, 10, 16, '#f3d9b2', { alpha: 0.5, rmin: 0.3, rmax: 0.55, seed: 64 });
  }

  function paintUpperArm(g, far) {
    const col = far ? U.mix(P.sweater, P.sweaterShade, 0.6) : P.sweater;
    const poly = U.spline([[-5, -3], [0, -5.2], [5, -3], [5.6, 8], [5.9, 19], [0, 20.8], [-5.9, 19], [-5.6, 8]], 3, true);
    Paint.wash(g, poly, col, { layers: 6, alpha: 0.24, amp: 0.4, seed: far ? 71 : 72, edge: 0.25, core: 1 });
    Paint.within(g, poly, () => {
      Paint.shade(g, [[-8, -6], [-1, -6], [-1, 24], [-8, 24]], P.sweaterShade, { layers: 4, alpha: 0.16, amp: 2.6, seed: 73, edge: 0 });
      knit(g, -3.5, 3.5, -4, 4, -2, 19, 4, P.sweaterDeep, 0.3, far ? 74 : 80, 0.6);
    });
    Paint.ink(g, poly, { closed: true, w: 1.25, wv: 0.45, breaks: 0.1, seed: far ? 75 : 76, alpha: 0.88 });
  }

  function paintForeArm(g, far) {
    const col = far ? U.mix(P.sweater, P.sweaterShade, 0.6) : P.sweater;
    const sleeve = U.spline([[-5.9, -1.5], [5.9, -1.5], [6.6, 8], [7.1, 14.6], [0, 15.8], [-7.1, 14.6], [-6.6, 8]], 3, true);
    const hand = U.spline([[-3.6, 13.5], [3.8, 13.5], [4.6, 18.5], [3, 22.6], [-0.6, 23.4], [-3.8, 21], [-4.4, 17]], 3, true);
    const thumb = U.spline([[2.6, 15], [5.6, 16.4], [5.8, 19.4], [3.4, 19]], 2, true);
    const skin = far ? U.mix(P.skin, P.skinShade, 0.5) : P.skin;
    Paint.wash(g, hand, skin, { layers: 5, alpha: 0.3, amp: 0.25, seed: far ? 81 : 82, edge: 0.25, core: 1 });
    Paint.wash(g, thumb, skin, { layers: 4, alpha: 0.3, amp: 0.2, seed: 83, edge: 0.25, core: 1 });
    Paint.within(g, hand, () => Paint.shade(g, [[-6, 12], [0, 12], [0, 26], [-6, 26]], P.skinShade, { layers: 3, alpha: 0.18, amp: 2.6, seed: 84, edge: 0 }));
    Paint.ink(g, hand, { closed: true, w: 1.05, alpha: 0.85, seed: 85, breaks: 0.1 });
    Paint.ink(g, thumb, { closed: true, w: 0.9, alpha: 0.75, seed: 86, breaks: 0.2 });
    Paint.wash(g, sleeve, col, { layers: 6, alpha: 0.24, amp: 0.4, seed: far ? 87 : 88, edge: 0.25, core: 1 });
    Paint.within(g, sleeve, () => {
      Paint.shade(g, [[-9, -4], [-1, -4], [-1, 18], [-9, 18]], P.sweaterShade, { layers: 4, alpha: 0.16, amp: 2.6, seed: 89, edge: 0 });
      knit(g, -4, 4, -5, 5, -1, 10, 4, P.sweaterDeep, 0.3, far ? 90 : 96, 0.6);
      for (let x = -6.5; x <= 7; x += 1.4) Paint.ink(g, [[x, 10.8], [x * 1.04, 15.2]], { w: 0.5, alpha: 0.4, color: P.sweaterDeep, wobble: 0.05, seed: 100 + x * 5, taper: 0.1 });
      Paint.ink(g, [[-6.8, 10.4], [0, 11], [6.8, 10.4]], { w: 0.6, alpha: 0.5, color: P.sweaterDeep, seed: 120 });
    });
    Paint.ink(g, sleeve, { closed: true, w: 1.25, wv: 0.45, breaks: 0.1, seed: far ? 121 : 122, alpha: 0.88 });
  }

  function paintBoot(g, far) {
    const rng = U.makeRng(far ? 131 : 132);
    const tint = (c) => (far ? U.mix(c, P.bootShade, 0.45) : c);
    const boot = U.spline([[-5.4, -4.5], [5.2, -4.5], [5.7, -0.5], [7.6, 3], [11.6, 5.4], [14.2, 8], [14.2, 10.4], [12.6, 12],
      [0, 12.6], [-6.4, 12], [-7, 8.6], [-6.4, 2.6], [-5.8, -1]], 3, true);
    Paint.wash(g, boot, tint(P.boot), { layers: 6, alpha: 0.26, amp: 0.35, seed: far ? 133 : 134, edge: 0.28, core: 1, vary: P.bootLight, varyAmt: 0.35 });
    Paint.within(g, boot, () => {
      Paint.shade(g, [[-9, -6], [-1, -6], [-2, 14], [-9, 14]], P.bootShade, { layers: 4, alpha: 0.2, amp: 2.6, seed: 135, edge: 0 });
      Paint.wash(g, [[-9, 9.6], [16, 9.6], [16, 14], [-9, 14]], P.sole, { layers: 4, alpha: 0.5, amp: 0.3, seed: 136, edge: 0, core: 1 });
      Paint.wash(g, U.blobPoly(10.5, 6.6, 3, 1.8, 8, rng, 0.2), P.bootLight, { layers: 3, alpha: 0.45, amp: 0.3, seed: 137, edge: 0, blend: 'source-over' });
      Paint.splatter(g, 3, 3, 8, 6, 10, P.bootShade, { alpha: 0.35, rmin: 0.3, rmax: 0.6, seed: 138 });
    });
    // cordones cruzados
    if (!far) {
      g.strokeStyle = P.lace;
      g.lineWidth = 0.75;
      g.globalAlpha = 0.95;
      for (let k = 0; k < 3; k++) {
        const y = -2.4 + k * 2.6, x = 4.6 + k * 1.1;
        g.beginPath(); g.moveTo(x - 1.6, y - 0.9); g.lineTo(x + 1.6, y + 0.9); g.moveTo(x - 1.6, y + 0.9); g.lineTo(x + 1.6, y - 0.9); g.stroke();
      }
      g.globalAlpha = 1;
    }
    Paint.ink(g, [[-6.6, 9.8], [5, 10.2], [13.8, 9.8]], { w: 0.8, alpha: 0.6, seed: 139 });
    Paint.ink(g, boot, { closed: true, w: 1.3, wv: 0.4, breaks: 0.08, seed: far ? 140 : 141, alpha: 0.9 });
  }

  function paintBootBack(g) {
    const boot = U.spline([[-5.6, -4.5], [5.6, -4.5], [6.4, 4], [6.2, 10], [4.6, 12.4], [-4.6, 12.4], [-6.2, 10], [-6.4, 4]], 3, true);
    Paint.wash(g, boot, P.boot, { layers: 6, alpha: 0.26, amp: 0.35, seed: 151, edge: 0.28, core: 1 });
    Paint.within(g, boot, () => {
      Paint.wash(g, [[-9, 9], [9, 9], [9, 14], [-9, 14]], P.sole, { layers: 4, alpha: 0.5, amp: 0.3, seed: 152, edge: 0, core: 1 });
      Paint.shade(g, [[-8, -6], [-1, -6], [-1, 14], [-8, 14]], P.bootShade, { layers: 3, alpha: 0.18, amp: 2.6, seed: 153, edge: 0 });
    });
    Paint.ink(g, boot, { closed: true, w: 1.3, seed: 154, alpha: 0.9 });
  }

  function paintPack(g) {
    const rng = U.makeRng(161);
    const body = U.spline([[-30.5, -36], [-14, -38], [-10.6, -30], [-10.4, -14], [-12, -6.5], [-29, -5.5], [-32, -12], [-32.4, -28]], 3, true);
    const flap = U.spline([[-31.4, -36.5], [-13.6, -38.5], [-11.2, -30], [-13, -23.5], [-21, -22], [-30, -23.6], [-32.4, -29]], 3, true);
    Paint.wash(g, body, P.pack, { layers: 7, alpha: 0.24, amp: 0.5, seed: 162, edge: 0.28, core: 1, vary: P.packLight, varyAmt: 0.4 });
    Paint.within(g, body, () => {
      Paint.shade(g, [[-36, -40], [-24, -40], [-24, 0], [-36, 0]], P.packShade, { layers: 5, alpha: 0.2, amp: 2.6, seed: 163, edge: 0 });
      Paint.splatter(g, -21, -18, 11, 14, 26, P.packShade, { alpha: 0.35, rmin: 0.3, rmax: 0.8, seed: 164 });
      Paint.splatter(g, -18, -26, 9, 9, 10, P.packLight, { alpha: 0.5, rmin: 0.3, rmax: 0.7, seed: 165 });
    });
    Paint.wash(g, flap, U.mix(P.pack, P.packShade, 0.35), { layers: 6, alpha: 0.24, amp: 0.4, seed: 166, edge: 0.3, core: 1 });
    Paint.within(g, flap, () => Paint.wash(g, U.blobPoly(-16, -34, 5, 3, 8, rng, 0.2), P.packLight, { layers: 3, alpha: 0.35, amp: 0.4, seed: 167, edge: 0, blend: 'source-over' }));
    // costura punteada y hebilla
    g.fillStyle = P.lace;
    for (let t = 0.08; t < 0.92; t += 0.07) {
      const x = U.lerp(-30, -14, t), y = U.lerp(-34.6, -36.4, t) + Math.sin(t * 3.14) * 0.6;
      g.globalAlpha = 0.7;
      g.fillRect(x, y, 0.9, 0.6);
    }
    g.globalAlpha = 1;
    Paint.wash(g, [[-23, -26], [-18.6, -26], [-18.6, -14], [-23, -14]], P.packShade, { layers: 4, alpha: 0.4, amp: 0.2, seed: 168, edge: 0.3 });
    g.strokeStyle = P.buckle; g.lineWidth = 1; g.strokeRect(-23.4, -21.4, 5.2, 3.6);
    Paint.ink(g, flap, { closed: true, w: 1.25, alpha: 0.88, seed: 169, breaks: 0.1 });
    Paint.ink(g, body, { closed: true, w: 1.35, alpha: 0.9, seed: 170, breaks: 0.1, sketch: 0.4 });
  }

  function paintPackBack(g) {
    const body = U.spline([[-14, -40], [14, -40], [15.6, -30], [15.6, -10], [13, -4.5], [-13, -4.5], [-15.6, -10], [-15.6, -30]], 3, true);
    const flap = U.spline([[-14.6, -40.6], [14.6, -40.6], [15.8, -32], [12, -25], [0, -23.6], [-12, -25], [-15.8, -32]], 3, true);
    Paint.wash(g, body, P.pack, { layers: 7, alpha: 0.24, amp: 0.5, seed: 181, edge: 0.28, core: 1, vary: P.packLight, varyAmt: 0.4 });
    Paint.within(g, body, () => {
      Paint.shade(g, [[-20, -44], [-6, -44], [-6, 0], [-20, 0]], P.packShade, { layers: 5, alpha: 0.18, amp: 2.6, seed: 182, edge: 0 });
      Paint.splatter(g, 0, -20, 14, 16, 30, P.packShade, { alpha: 0.35, rmin: 0.3, rmax: 0.8, seed: 183 });
    });
    for (const sx of [-1, 1]) {
      const pk = U.spline([[sx * 3, -21], [sx * 13, -21], [sx * 13.4, -8.5], [sx * 3, -8.5]], 2, true);
      Paint.wash(g, pk, U.mix(P.pack, P.packShade, 0.3), { layers: 4, alpha: 0.28, amp: 0.3, seed: 184 + sx, edge: 0.3 });
      Paint.ink(g, pk, { closed: true, w: 1, alpha: 0.75, seed: 186 + sx, breaks: 0.15 });
    }
    Paint.wash(g, flap, U.mix(P.pack, P.packShade, 0.35), { layers: 6, alpha: 0.24, amp: 0.4, seed: 188, edge: 0.3, core: 1 });
    Paint.wash(g, [[-2.6, -30], [2.6, -30], [2.6, -18], [-2.6, -18]], P.packShade, { layers: 4, alpha: 0.4, amp: 0.2, seed: 189, edge: 0.3 });
    g.strokeStyle = P.buckle; g.lineWidth = 1; g.strokeRect(-2.8, -22, 5.6, 3.6);
    Paint.ink(g, flap, { closed: true, w: 1.25, alpha: 0.88, seed: 190, breaks: 0.1 });
    Paint.ink(g, body, { closed: true, w: 1.35, alpha: 0.9, seed: 191, breaks: 0.1, sketch: 0.4 });
  }

  function build() {
    if (built) return;
    Paint.withInk(1.3, buildParts);
    built = true;
  }

  function buildParts() {
    S.bouquet = JHS.Props.bouquet(931);
    const mk = (w, h, ox, oy, fn) => Paint.makeSprite({ w, h, ox, oy, res: RES, post: POST }, fn);
    S.torso = mk(64, 72, 34, 54, paintTorso);
    S.torsoBack = mk(64, 72, 32, 54, paintTorsoBack);
    S.head = mk(52, 58, 24, 54, paintHead);
    S.hair = mk(112, 100, 64, 88, paintHairBack);
    S.bangs = mk(44, 30, 14, 60, paintBangs);
    S.hairBackView = mk(110, 96, 55, 86, paintHairBackView);
    S.upperN = mk(18, 30, 9, 8, (g) => paintUpperArm(g, false));
    S.upperF = mk(18, 30, 9, 8, (g) => paintUpperArm(g, true));
    S.foreN = mk(20, 30, 10, 4, (g) => paintForeArm(g, false));
    S.foreF = mk(20, 30, 10, 4, (g) => paintForeArm(g, true));
    S.bootN = mk(26, 22, 9, 7, (g) => paintBoot(g, false));
    S.bootF = mk(26, 22, 9, 7, (g) => paintBoot(g, true));
    S.bootBack = mk(18, 22, 9, 7, paintBootBack);
    S.pack = mk(30, 42, 36, 42, paintPack);
    S.packBack = mk(36, 42, 18, 43, paintPackBack);
  }

  // ------------------------------------------------------------------ mechones dinámicos
  function makeHair() {
    const rng = U.makeRng(77);
    const specs = [];
    const add = (n, a0, a1, r, dir0, dir1, len0, len1, flex, colRange, hookP) => {
      for (let i = 0; i < n; i++) {
        const a = U.lerp(a0, a1, (i + rng.range(0.1, 0.9)) / n);
        specs.push({
          x: SKULL[0] - 3 + Math.cos(a) * r * rng.range(0.9, 1.05), y: SKULL[1] - 1 + Math.sin(a) * r * 0.92 * rng.range(0.9, 1.05),
          ang: rng.range(dir0, dir1), len: rng.range(len0, len1),
          curl: rng.range(-0.7, 0.7), w: rng.range(0.55, 1.1), col: rng.int(colRange[0], colRange[1]),
          hook: rng.chance(hookP) ? rng.range(0.8, 1.6) * (rng.chance(0.5) ? 1 : -1) : 0,
          phase: rng.range(0, 6.28), flex, stiff: rng.range(0.7, 1.3), alpha: rng.range(0.7, 0.95),
        });
      }
    };
    add(10, -Math.PI * 0.98, -Math.PI * 0.5, 28, -Math.PI * 1.1, -Math.PI * 0.75, 5, 9, 0.9, [1, 2], 1);    // rizos sueltos atrás-arriba
    add(7, -Math.PI * 0.5, -Math.PI * 0.2, 26, -Math.PI * 0.25, 0.15, 4, 8, 0.8, [1, 3], 1);              // coronilla delante
    add(12, Math.PI * 0.85, Math.PI * 1.1, 33, Math.PI * 0.55, Math.PI * 0.85, 12, 22, 1.3, [0, 2], 0.45);   // caída de atrás
    return Rig.makeStrands(specs);
  }
  const HAIR_COLS = [P.hairDark, P.hair, P.hairMid, P.hairLight];

  // ------------------------------------------------------------------ estado
  function create(x, y) {
    return {
      x, y, vx: 0, vy: 0, facing: 1, scale: 1, alpha: 1,
      mode: 'ground', grounded: true, speed: 0, running: false,
      phase: 0, t: 0, landT: 9, airT: 0, modeT: 0,
      blinkT: 2, blink: 0, lookT: 4, look: 0, lookTarget: 0,
      expr: 'tranquila', exprT: 0, idleT: 0, tired: 0,
      action: null, actionT: 0,
      climbPh: 0, pushPh: 0,
      hair: makeHair(), hairSway: 0, hairSwayV: 0, wind: 0,
      // giro (se encoge en x a mitad de la vuelta), frenada, equilibrio en el borde, agacharse,
      // mirar arriba, secuencia de espera (estirarse, sentarse) y saludo
      drawFacing: 1, turnT: 0, turnTo: 1,
      brake: false, brakeK: 0, teeter: false, teeterK: 0, crouch: false, crouchK: 0, lookUp: false, lookUpK: 0,
      stretchK: 0, sitK: 0, bench: false, benchK: 0, carry: 0,
      // movimiento secundario: mochila con muelle y vuelo del bajo del suéter
      packY: 0, packVY: 0, packX: 0, packVX: 0, packRef: null, hemSkew: 0, hemV: 0,
      lookAt: null, headLook: 0, offX: 0, offY: 0, events: [],
      pose: null,
    };
  }

  const TURN = 0.16;

  // ------------------------------------------------------------------ poses
  const WALK = { beta: 0.58, L: 50, lift: 7.5, lean: 0.05, arm: 0.34, elbow: 0.28 };
  const RUN = { beta: 0.36, L: 62, lift: 19, lean: 0.17, arm: 0.95, elbow: 1.35 };

  function standHip() { return M.hipY; }

  // Ajusta la altura de cadera para que los pies apoyados lleguen al suelo sin estirar de más.
  function reachHip(hipX, hipY, feet) {
    let y = hipY;
    for (const f of feet) {
      if (!f.stance) continue;
      const dx = f.x - hipX;
      y = Math.max(y, f.y - Math.sqrt(Math.max(1, (LEG * 0.985) ** 2 - dx * dx)));
    }
    return y;
  }

  function basePose() {
    return {
      view: 'side', hipX: 0, hipY: M.hipY, torso: 0, breath: 1, head: 0,
      feet: [{ x: 6, y: M.ankleY, rot: 0, stance: true }, { x: -5, y: M.ankleY, rot: 0, stance: true }],
      arms: [{ fwd: 0.08, el: 0.18 }, { fwd: -0.06, el: 0.14 }],
      sweat: 0,
    };
  }

  function gaitPose(g, ps, speed, dt, extra = {}) {
    const b = U.smoothstep(150, 290, speed);
    const pr = {};
    for (const k in WALK) pr[k] = U.lerp(WALK[k], RUN[k], b);
    if (extra.push) { pr.beta = 0.72; pr.L = 30; pr.lift = 4; pr.lean = 0; pr.arm = 0; pr.elbow = 0; }
    const rate = (pr.beta * Math.max(speed, 6)) / pr.L;
    const p0 = g.phase;
    g.phase = (g.phase + rate * dt) % 1;
    const fe = [Rig.footCycle(g.phase, pr.L, pr.beta, pr.lift), Rig.footCycle(g.phase + 0.5, pr.L, pr.beta, pr.lift)];
    const shiftX = extra.push ? -9 : 2 + b * 4;
    // apoyo del talón: evento de paso (polvo, huellas, sonido)
    for (let i = 0; i < 2; i++) {
      const a = (p0 + i * 0.5) % 1, c = (g.phase + i * 0.5) % 1;
      if (a > 0.75 && c < 0.25) g.events.push({ type: 'step', foot: i, x: g.x + g.facing * (pr.L / 2 + shiftX), run: b, push: !!extra.push });
    }
    for (let i = 0; i < 2; i++) {
      ps.feet[i] = { x: fe[i].x + shiftX, y: M.ankleY + fe[i].y, rot: fe[i].rot, stance: fe[i].stance };
    }
    // carrera: fase de vuelo, la cadera sube cuando ningún pie apoya
    const flight = !fe[0].stance && !fe[1].stance;
    const bobRun = flight ? -3.5 * b : 0;
    ps.hipY = reachHip(0, M.hipY - 1.2 + bobRun, ps.feet) + (extra.push ? 3 : 0) + b * 3;
    ps.torso = pr.lean + (extra.push ? 0.36 : 0) + Math.sin(g.phase * U.TAU * 2) * 0.012;
    ps.head = -ps.torso * 0.45;
    for (let i = 0; i < 2; i++) {
      const fwdness = U.clamp(fe[i].x / (pr.L / 2), -1.2, 1.2);
      ps.arms[i] = { fwd: -pr.arm * fwdness * 0.85 + b * 0.25, el: pr.elbow * (0.75 + 0.25 * Math.max(0, -fwdness)) + 0.1 };
    }
    if (extra.push) ps.arms = [{ fwd: 1.42, el: 0.22 }, { fwd: 1.32, el: 0.28 }];
  }

  function airPose(g, ps) {
    const vy = g.vy;
    const up = U.smoothstep(150, -500, vy);    // 1 subiendo
    const down = U.smoothstep(150, 700, vy);   // 1 cayendo rápido
    const mid = 1 - up - down;
    const bx = 0;
    // pierna cercana recogida al subir, ambas se estiran al caer preparando el aterrizaje
    ps.feet[0] = { x: bx + U.lerp(U.lerp(9, 14, up), 7, down), y: M.hipY + U.lerp(U.lerp(46, 36, up), 54, down) + 0, rot: U.lerp(-0.2, -0.3, down), stance: false };
    ps.feet[1] = { x: bx + U.lerp(U.lerp(-7, -14, up), -6, down), y: M.hipY + U.lerp(U.lerp(50, 55, up), 52, down), rot: U.lerp(0.3, 0.1, down), stance: false };
    ps.hipY = M.hipY;
    ps.torso = 0.06 + up * 0.06 - down * 0.04;
    ps.head = -ps.torso * 0.5 - down * 0.06;
    ps.arms[0] = { fwd: U.lerp(U.lerp(0.8, 1.3, up), 1.4, down), el: U.lerp(0.6, 0.3, down) };
    ps.arms[1] = { fwd: U.lerp(U.lerp(-0.5, -0.9, up), 0.6, down), el: 0.5 };
    void mid;
  }

  function landPose(g, ps) {
    const k = 1 - U.clamp(g.landT / 0.16, 0, 1);
    const s = Math.sin(k * Math.PI * 0.5);
    ps.hipY += 10 * s;
    ps.torso += 0.16 * s;
    ps.arms[0].fwd += 0.5 * s;
    ps.arms[1].fwd += 0.3 * s;
  }

  function idlePose(g, ps, dt) {
    const tired = g.tired;
    const rate = U.lerp(0.32, 0.85, tired);
    const br = Math.sin(g.t * U.TAU * rate);
    ps.breath = 1 + br * U.lerp(0.012, 0.022, tired);
    ps.hipY = M.hipY + Math.max(0, -br) * 0.5;
    ps.torso = 0.015 + tired * 0.12 + br * 0.006;
    ps.head = tired * 0.12 - ps.torso * 0.4 + g.look * 0.08;
    const sway = Math.sin(g.t * 0.9) * 0.025;
    ps.arms[0] = { fwd: 0.08 + sway + br * 0.03, el: 0.2 };
    ps.arms[1] = { fwd: -0.05 + sway + br * 0.03, el: 0.16 };
    ps.sweat = tired > 0.5 ? 1 : 0;
  }

  function climbPose(g, ps) {
    ps.view = 'back';
    const ph = g.climbPh;
    const s = Math.sin(ph * U.TAU), c = Math.cos(ph * U.TAU);
    ps.hipY = M.hipY + 2;
    ps.torso = 0;
    ps.head = 0;
    // en vista de espaldas «fwd» es el ángulo del brazo hacia arriba
    ps.arms = [{ up: 2.75 + s * 0.22, el: 0.35 + Math.max(0, s) * 0.7 }, { up: 2.75 - s * 0.22, el: 0.35 + Math.max(0, -s) * 0.7 }];
    ps.feet = [
      { x: 7.5, y: M.ankleY - 13 - s * 13, rot: 0, stance: false },
      { x: -7.5, y: M.ankleY - 13 + s * 13, rot: 0, stance: false },
    ];
    void c;
  }

  // Mezcla lineal de los campos numéricos de una pose hacia otra.
  function blendPose(ps, q, k) {
    if (k <= 0.001) return;
    const L = U.lerp;
    for (const f of ['hipX', 'hipY', 'torso', 'head', 'breath']) if (q[f] != null) ps[f] = L(ps[f], q[f], k);
    if (q.feet) for (let i = 0; i < 2; i++) {
      const a = ps.feet[i], b = q.feet[i];
      ps.feet[i] = { x: L(a.x, b.x, k), y: L(a.y, b.y, k), rot: L(a.rot, b.rot, k), stance: k > 0.5 ? b.stance : a.stance };
    }
    if (q.arms) for (let i = 0; i < 2; i++) {
      if (!q.arms[i]) continue;
      ps.arms[i] = { fwd: L(ps.arms[i].fwd, q.arms[i].fwd, k), el: L(ps.arms[i].el, q.arms[i].el, k) };
    }
  }

  // Frenada al cambiar de sentido o soltar la carrera: se echa hacia atrás y apoya el talón.
  function brakePose(g, ps) {
    blendPose(ps, {
      hipY: M.hipY + 6, torso: -0.17, head: 0.08,
      feet: [{ x: 17, y: M.ankleY, rot: -0.35, stance: true }, { x: -5, y: M.ankleY, rot: 0, stance: true }],
      arms: [{ fwd: 1.05, el: 0.35 }, { fwd: 0.55, el: 0.45 }],
    }, g.brakeK);
  }

  // Al borde de un precipicio: brazos en molinete y el cuerpo que oscila (§9: miedo sutil).
  function teeterPose(g, ps) {
    const t = g.t, w = Math.sin(t * 9);
    blendPose(ps, {
      hipY: M.hipY + 2, torso: 0.1 + w * 0.09, head: 0.2,
      feet: [{ x: 7, y: M.ankleY - 2, rot: 0.2, stance: true }, { x: -6, y: M.ankleY, rot: 0, stance: true }],
      // molinete: un brazo gira por delante y el otro por detrás, a destiempo
      // (el cercano no sube por encima del hombro: taparía la cara)
      arms: [{ fwd: 1.2 + Math.sin(t * 11) * 0.72, el: 0.2 }, { fwd: -0.45 + Math.sin(t * 11 + 2.6) * 0.75, el: 0.25 }],
    }, g.teeterK);
  }

  function crouchPose(g, ps) {
    blendPose(ps, {
      hipY: M.hipY + 30, torso: 0.34, head: -0.22,
      feet: [{ x: 13, y: M.ankleY, rot: 0, stance: true }, { x: -9, y: M.ankleY, rot: 0.15, stance: true }],
      arms: [{ fwd: 0.95, el: 0.55 }, { fwd: 0.75, el: 0.6 }],
    }, g.crouchK);
  }

  function lookUpPose(g, ps) {
    blendPose(ps, { torso: -0.07, head: -0.34, arms: [{ fwd: -0.15, el: 0.4 }, { fwd: -0.25, el: 0.35 }] }, g.lookUpK);
  }

  // Espera larga: se estira (puntillas, brazos arriba, bostezo) y más tarde se sienta a mirar.
  function stretchPose(g, ps) {
    blendPose(ps, {
      hipY: M.hipY - 3.5, torso: -0.09, head: -0.16,
      feet: [{ x: 5, y: M.ankleY - 3, rot: 0.45, stance: true }, { x: -4, y: M.ankleY - 3, rot: 0.45, stance: true }],
      // los brazos son cortos para su cabeza: se estira echándolos arriba y atrás, detrás de la cara
      arms: [{ fwd: 3.95, el: 0.22 }, { fwd: 3.7, el: 0.18 }],
    }, g.stretchK);
  }

  function sitPose(g, ps) {
    const br = Math.sin(g.t * U.TAU * 0.28);
    blendPose(ps, {
      hipX: -3, hipY: -15 + br * 0.4, torso: 0.1 + br * 0.01, head: -0.06 + g.headLook,
      feet: [{ x: 21, y: M.ankleY + 1, rot: 0.1, stance: true }, { x: 16, y: M.ankleY + 1, rot: 0.1, stance: true }],
      arms: [{ fwd: 1.05, el: 1.05 }, { fwd: 0.95, el: 1.15 }],
    }, g.sitK);
  }

  // Sentada en un banco: muslos horizontales, pies en el suelo, manos en el regazo.
  function benchPose(g, ps) {
    const br = Math.sin(g.t * U.TAU * 0.26);
    const swing = Math.sin(g.t * 1.6) * 3;
    blendPose(ps, {
      hipX: -2, hipY: -52 + br * 0.4, torso: 0.04 + br * 0.008, head: -0.05 + g.headLook,
      feet: [{ x: 23 + swing, y: M.ankleY - 2, rot: -0.1, stance: true }, { x: 19 - swing, y: M.ankleY - 2, rot: -0.1, stance: true }],
      arms: [{ fwd: 0.55, el: 0.95 }, { fwd: 0.5, el: 1.0 }],
    }, g.benchK);
  }

  function actionPose(g, ps) {
    const a = g.action;
    const t = g.actionT;
    if (a === 'offer') {
      // ofrece el ramillete con el brazo extendido
      const k = U.smoothstep(0, 0.4, t);
      blendPose(ps, { torso: 0.1, head: -0.06, arms: [{ fwd: 1.45, el: 0.2 }, { fwd: 0.3, el: 0.4 }] }, k);
      return;
    }
    if (a === 'wave') {
      const k = U.smoothstep(0, 0.2, t) * (1 - U.smoothstep(1.1, 1.4, t));
      blendPose(ps, { torso: -0.03, arms: [{ fwd: 2.55, el: 0.55 + Math.sin(t * 13) * 0.45 }] }, k);
      return;
    }
    if (a === 'call') {
      // manos en la boca para llamar a la oveja
      const k = U.smoothstep(0, 0.15, t) * (1 - U.smoothstep(0.85, 1.1, t));
      blendPose(ps, { torso: -0.06, head: -0.12, arms: [{ fwd: 2.2, el: 1.9 }, { fwd: 2.0, el: 2.0 }] }, k);
      return;
    }
    if (a === 'mantle') {
      // subiendo por el borde de la escalera: agachada que se incorpora
      const k = 1 - U.smoothstep(0, 0.42, t);
      blendPose(ps, { hipY: M.hipY + 24, torso: 0.55, head: -0.15, arms: [{ fwd: 1.4, el: 0.3 }, { fwd: 1.2, el: 0.4 }] }, k);
      return;
    }
    if (a === 'shake') {
      // sacude el árbol con las dos manos
      const k = U.smoothstep(0, 0.15, t) * (1 - U.smoothstep(0.9, 1.15, t));
      blendPose(ps, { hipY: M.hipY + 4, torso: 0.08 + Math.sin(t * 30) * 0.05, arms: [{ fwd: 1.75 + Math.sin(t * 30) * 0.12, el: 0.25 }, { fwd: 1.6 + Math.sin(t * 30) * 0.12, el: 0.3 }] }, k);
      return;
    }
    if (a === 'read') {
      const k = U.smoothstep(0, 0.3, t);
      blendPose(ps, { head: -0.1, arms: [{ fwd: 0.35, el: 0.6 }, { fwd: 0.2, el: 0.5 }] }, k);
      return;
    }
    if (a === 'interact' || a === 'pick') {
      const k = U.smoothstep(0, 0.25, t) * (1 - U.smoothstep(0.8, 1.05, t));
      ps.hipY = M.hipY + 20 * k;
      ps.feet[0] = { x: 10, y: M.ankleY, rot: 0, stance: true };
      ps.feet[1] = { x: -8, y: M.ankleY, rot: 0, stance: true };
      ps.torso = 0.55 * k;
      ps.head = 0.15 * k;
      ps.arms[0] = { fwd: 0.2 + 1.0 * k, el: 0.15 };
      ps.arms[1] = { fwd: 0.1 + 0.6 * k, el: 0.3 };
    } else if (a === 'pet') {
      const k = U.smoothstep(0, 0.25, t) * (1 - U.smoothstep(1.3, 1.6, t));
      ps.hipY = M.hipY + 9 * k;
      ps.torso = 0.32 * k;
      ps.head = 0.1 * k;
      ps.arms[0] = { fwd: 0.2 + 0.85 * k, el: 0.25 + Math.sin(t * 14) * 0.22 * k };
    } else if (a === 'celebrate') {
      const hop = Math.abs(Math.sin(Math.min(t, 0.9) * Math.PI * 2.2)) * (1 - U.smoothstep(0.7, 0.9, t));
      ps.hipY = M.hipY - 10 * hop;
      for (const f of ps.feet) f.y = M.ankleY - 10 * hop;
      ps.arms = [{ fwd: 2.7, el: 0.35 }, { fwd: 2.5, el: 0.4 }];
      ps.head = -0.1;
    } else if (a === 'look') {
      const k = U.smoothstep(0, 1.2, t);
      ps.head = -0.14 * k;
      ps.breath = 1 + Math.sin(g.t * U.TAU * 0.22) * 0.02;
      ps.arms[0] = { fwd: 0.04, el: 0.22 };
      ps.arms[1] = { fwd: -0.08, el: 0.2 };
    }
  }

  // ------------------------------------------------------------------ actualización visual
  function update(g, dt) {
    g.t += dt;
    g.modeT += dt;
    g.landT += dt;
    // parpadeo y miradas: microacciones del idle (§9.1)
    g.blinkT -= dt;
    if (g.blinkT <= 0) { g.blink = 0.13; g.blinkT = 2.2 + Math.random() * 3.2; }
    g.blink = Math.max(0, g.blink - dt);
    g.lookT -= dt;
    if (g.lookT <= 0) { g.lookTarget = Math.random() < 0.5 ? 0 : (Math.random() < 0.5 ? -1 : 1); g.lookT = 2.5 + Math.random() * 4; }
    // mirada hacia lo que le interesa (la oveja, el pastor, una semilla, una mariposa)
    let headT = 0;
    if (g.lookAt) {
      const dx = (g.lookAt.x - g.x) * g.facing, dy = g.lookAt.y - (g.y - 150);
      if (dx > -40) {
        g.lookTarget = U.clamp(dx / 160, -1, 1);
        headT = U.clamp(Math.atan2(dy, Math.abs(dx) + 70) * 0.45, -0.24, 0.2);
      }
    }
    g.headLook = U.damp(g.headLook, g.mode === 'ground' ? headT : 0, 5, dt);
    g.look = U.damp(g.look, g.mode === 'ground' && g.speed < 5 ? g.lookTarget : 0, 4, dt);
    // giro: a mitad de la vuelta cambia el lado dibujado
    if (g.facing !== g.turnTo) { g.turnTo = g.facing; if (g.turnT <= 0) g.turnT = g.mode === 'air' ? TURN * 0.6 : TURN; }
    if (g.turnT > 0) {
      g.turnT -= dt;
      if (g.turnT <= TURN * 0.3 || g.turnT <= 0) g.drawFacing = g.turnTo;
      if (g.turnT <= 0) { g.turnT = 0; g.drawFacing = g.turnTo; }
    } else g.drawFacing = g.facing;
    const calm = g.mode === 'ground' && g.speed < 8 && !g.action && !g.crouch && !g.lookUp && !g.teeter;
    g.brakeK = U.damp(g.brakeK, g.brake && g.mode === 'ground' ? 1 : 0, g.brake ? 16 : 9, dt);
    g.teeterK = U.damp(g.teeterK, g.teeter && g.mode === 'ground' ? 1 : 0, 8, dt);
    g.crouchK = U.damp(g.crouchK, g.crouch && g.mode === 'ground' ? 1 : 0, 13, dt);
    g.lookUpK = U.damp(g.lookUpK, g.lookUp && g.mode === 'ground' ? 1 : 0, 8, dt);
    g.stretchK = U.damp(g.stretchK, calm && g.idleT > 7 && g.idleT < 8.9 ? 1 : 0, 6, dt);
    g.sitK = U.damp(g.sitK, calm && !g.bench && g.idleT > 16 ? 1 : 0, calm ? 2.6 : 12, dt);
    g.benchK = U.damp(g.benchK, g.bench ? 1 : 0, g.bench ? 5 : 10, dt);
    g.lookUpK = Math.max(g.lookUpK, calm && !g.bench && g.idleT > 11 && g.idleT < 13.5 ? U.smoothstep(11, 11.8, g.idleT) * (1 - U.smoothstep(12.8, 13.5, g.idleT)) : 0);
    if (g.action) {
      g.actionT += dt;
      if (g.actionDur && g.actionT > g.actionDur) { g.action = null; g.actionT = 0; }
    }
    g.exprT = Math.max(0, g.exprT - dt);

    const ps = basePose();
    if (g.mode === 'climb') climbPose(g, ps);
    else if (g.mode === 'air') airPose(g, ps);
    else if (g.mode === 'push') gaitPose(g, ps, Math.max(18, g.speed), dt, { push: true });
    else if (g.speed > 8) { gaitPose(g, ps, g.speed, dt); g.idleT = 0; }
    else { idlePose(g, ps, dt); g.idleT = calm ? g.idleT + dt : 0; }
    if (g.mode === 'ground' || g.mode === 'push') {
      if (g.landT < 0.16) landPose(g, ps);
      ps.head += g.headLook;
      stretchPose(g, ps);
      sitPose(g, ps);
      benchPose(g, ps);
      lookUpPose(g, ps);
      crouchPose(g, ps);
      teeterPose(g, ps);
      brakePose(g, ps);
    }
    if (g.action) actionPose(g, ps);

    // cansancio: sube al correr mucho y baja al descansar
    g.tired = U.clamp(g.tired + (g.speed > 250 ? dt * 0.08 : -dt * 0.12), 0, 1);

    // expresión por contexto si no hay una impuesta
    if (g.exprT <= 0) {
      g.expr = g.mode === 'push' ? 'determinada'
        : g.teeterK > 0.5 ? 'preocupada'
        : g.stretchK > 0.5 ? 'cansada'
        : g.tired > 0.6 && g.speed < 8 ? 'cansada'
        : g.mode === 'air' && g.vy > 500 ? 'sorpresa'
        : g.mode === 'climb' ? 'determinada'
        : g.action === 'pet' || g.action === 'celebrate' || g.action === 'wave' ? 'alegre'
        : g.sitK > 0.6 ? 'pensativa'
        : 'tranquila';
    }
    // al estirarse cierra los ojos y bosteza
    if (g.stretchK > 0.6) g.blink = Math.max(g.blink, 0.02);

    // mochila: muelle que sigue al torso con retraso (rebota al correr y al aterrizar)
    const refX = g.x + ps.hipX * g.facing, refY = g.y + ps.hipY;
    if (!g.packRef) g.packRef = [refX, refY];
    const h = Math.min(dt, 0.05);
    const ax = refX - g.packRef[0], ay = refY - g.packRef[1];
    g.packRef = [refX, refY];
    g.packVX += (-ax / Math.max(h, 1e-3) * 0.9 - g.packX * 260 - g.packVX * 16) * h;
    g.packVY += (-ay / Math.max(h, 1e-3) * 0.9 - g.packY * 260 - g.packVY * 16) * h;
    g.packX = U.clamp(g.packX + g.packVX * h, -3.5, 3.5);
    g.packY = U.clamp(g.packY + g.packVY * h, -4.5, 4.5);
    // bajo del suéter: se abre con la velocidad y el viento
    const hemT = U.clamp(-g.vx * 0.0007 * g.facing + g.wind * 0.012 + Math.sin(g.t * 2.3) * 0.015 + (g.mode === 'air' ? -g.vy * 0.00012 : 0), -0.24, 0.24);
    g.hemV += ((hemT - g.hemSkew) * 120 - g.hemV * 10) * h;
    g.hemSkew += g.hemV * h;

    // pelo: inercia respecto al movimiento y viento
    const vx = g.mode === 'climb' ? 0 : g.vx, vy = g.mode === 'climb' ? g.vy * 0.3 : g.vy;
    Rig.stepStrands(g.hair, dt, { vx, vy, wind: g.wind, t: g.t, facing: g.facing });
    const swayT = U.clamp((-vx * 0.0006 * g.facing) + g.wind * 0.012 + Math.sin(g.t * 1.3) * 0.01, -0.14, 0.14);
    g.hairSwayV += ((swayT - g.hairSway) * 90 - g.hairSwayV * 9) * Math.min(dt, 0.05);
    g.hairSway += g.hairSwayV * Math.min(dt, 0.05);
    g.pose = ps;
  }

  // ------------------------------------------------------------------ dibujo
  function drawArm(ctx, sx, sy, fwd, el, up, fore) {
    const r1 = -fwd;
    Rig.part(ctx, up, sx, sy, r1);
    const ex = sx + Math.sin(fwd) * M.upper, ey = sy + Math.cos(fwd) * M.upper;
    Rig.part(ctx, fore, ex, ey, -(fwd + el));
    return [ex + Math.sin(fwd + el) * (M.fore + 3), ey + Math.cos(fwd + el) * (M.fore + 3), fwd + el];
  }

  function torsoXf(ps) {
    const hx = ps.hipX, hy = ps.hipY;
    const c = Math.cos(ps.torso), s = Math.sin(ps.torso);
    return (x, y) => {
      y *= ps.breath;
      return [hx + x * c - y * s, hy + x * s + y * c];
    };
  }

  function drawFace(ctx, g, ps) {
    const e = g.expr;
    const blink = g.blink > 0;
    const lx = g.look * 1.2;
    // ojo cercano a la izquierda, ojo lejano (más estrecho) junto al contorno derecho
    const eyes = [[3.4 + lx, -29.2, 2.3, 3.0], [15.8 + lx, -29.5, 1.95, 2.85]];
    const happy = e === 'alegre' || e === 'feliz';
    const half = e === 'triste' || e === 'cansada' || e === 'pensativa';
    ctx.lineCap = 'round';
    for (const [x, y, rx, ry] of eyes) {
      if (blink || (happy && e === 'alegre')) {
        ctx.strokeStyle = P.eye; ctx.lineWidth = 1.2;
        ctx.beginPath();
        if (happy) ctx.arc(x, y + 1.2, rx * 1.1, Math.PI * 1.1, Math.PI * 1.9);
        else ctx.arc(x, y - 1.5, rx * 1.15, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
        continue;
      }
      const big = e === 'sorpresa' ? 1.18 : 1;
      ctx.fillStyle = P.eye;
      ctx.beginPath(); ctx.ellipse(x, y, rx * big, ry * big, 0, 0, U.TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,250,240,0.85)';
      ctx.beginPath(); ctx.arc(x + rx * 0.35, y - ry * 0.4, 0.65, 0, U.TAU); ctx.fill();
      if (half) { // párpado caído
        ctx.fillStyle = P.skin;
        ctx.beginPath(); ctx.rect(x - rx - 0.6, y - ry - 0.8, rx * 2 + 1.2, ry * 0.95); ctx.fill();
        ctx.strokeStyle = P.inkSoft; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(x - rx - 0.4, y - ry * 0.1); ctx.quadraticCurveTo(x, y - ry * 0.35, x + rx + 0.4, y - ry * 0.1); ctx.stroke();
      }
    }
    // cejas finas
    const brow = { tranquila: [0, 0], alegre: [0.1, -0.6], feliz: [0.1, -0.6], sorpresa: [0, -1.8], pensativa: [0.25, 0],
      triste: [0.35, 0], preocupada: [0.38, -0.4], determinada: [-0.4, 0.6], cansada: [0.25, 0.4] }[e] || [0, 0];
    ctx.strokeStyle = U.mix(P.hairDark, P.skinShade, 0.25);
    ctx.lineWidth = 0.95;
    ctx.globalAlpha = 0.85;
    // [x, semiancho, extremo interior a la derecha?]; tilt>0 sube el extremo interior (pena/preocupación)
    for (const [x, w, innerRight] of [[3.4 + lx, 3.1, true], [15.8 + lx, 2.3, false]]) {
      const y = -35.9 + brow[1];
      const yIn = y - brow[0] * 2.2, yOut = y + brow[0] * 0.8;
      ctx.beginPath();
      ctx.moveTo(x - w, innerRight ? yOut : yIn);
      ctx.quadraticCurveTo(x, y - 0.9, x + w, innerRight ? yIn : yOut);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // boca mínima, bajo la nariz
    const mx = 9.6 + lx * 0.6, my = -16.4;
    ctx.strokeStyle = U.mix(P.mouth, P.ink, 0.35);
    ctx.lineWidth = 1;
    ctx.beginPath();
    switch (e) {
      case 'alegre': case 'feliz':
        ctx.moveTo(mx - 3.6, my - 0.8); ctx.quadraticCurveTo(mx, my + 3.2, mx + 3.4, my - 0.9); ctx.stroke();
        ctx.fillStyle = U.rgba(P.mouth, 0.55);
        ctx.beginPath(); ctx.moveTo(mx - 2.6, my); ctx.quadraticCurveTo(mx, my + 2.4, mx + 2.5, my - 0.1); ctx.closePath(); ctx.fill();
        break;
      case 'sorpresa': case 'cansada':
        ctx.fillStyle = U.rgba(P.mouth, 0.85);
        ctx.ellipse(mx, my + 0.3, e === 'sorpresa' ? 1.7 : 1.4, e === 'sorpresa' ? 2.2 : 1.3, 0, 0, U.TAU); ctx.fill();
        break;
      case 'triste':
        ctx.moveTo(mx - 2.6, my + 0.8); ctx.quadraticCurveTo(mx, my - 1, mx + 2.6, my + 0.8); ctx.stroke();
        break;
      case 'determinada':
        ctx.moveTo(mx - 2.8, my + 0.2); ctx.lineTo(mx + 2.6, my - 0.2); ctx.stroke();
        break;
      case 'preocupada': case 'pensativa':
        ctx.moveTo(mx - 2.6, my + 0.2); ctx.quadraticCurveTo(mx - 1, my - 0.8, mx + 0.4, my + 0.2); ctx.quadraticCurveTo(mx + 1.6, my + 1, mx + 2.6, my); ctx.stroke();
        break;
      default:
        ctx.moveTo(mx - 2.6, my - 0.4); ctx.quadraticCurveTo(mx, my + 1.6, mx + 2.5, my - 0.5); ctx.stroke();
    }
    // rubor extra según emoción
    const blushA = { alegre: 0.3, feliz: 0.3, determinada: 0.18, cansada: 0.32, sorpresa: 0.15 }[e] || 0;
    if (blushA) { Paint.softBlob(ctx, -1.6, -19.6, 6, P.blush, blushA); Paint.softBlob(ctx, 18.6, -20.4, 3.6, P.blush, blushA * 0.7); }
    if (ps.sweat || e === 'cansada' || e === 'determinada' && g.mode === 'push') {
      // gota de sudor como en la portada
      ctx.fillStyle = 'rgba(214,230,236,0.9)';
      ctx.strokeStyle = P.inkSoft; ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(-9, -34); ctx.quadraticCurveTo(-11.4, -29.6, -9.4, -28.6); ctx.quadraticCurveTo(-7, -29.6, -9, -34);
      ctx.fill(); ctx.stroke();
    }
  }

  function drawSide(ctx, g, ps) {
    const T = torsoXf(ps);
    const shN = T(M.sh[0][0], M.sh[0][1]), shF = T(M.sh[1][0], M.sh[1][1]);
    const nk = T(M.neck[0], M.neck[1]);
    const headRot = ps.torso + ps.head;
    // brazo lejano (los ángulos de brazo son del mundo: cuelgan por gravedad)
    drawArm(ctx, shF[0], shF[1], ps.arms[1].fwd, ps.arms[1].el, S.upperF, S.foreF);
    // piernas
    for (const i of [1, 0]) {
      const hj = T(M.hipJ[i][0], M.hipJ[i][1]);
      const f = ps.feet[i];
      const kn = Rig.kneeForward(hj[0], hj[1], f.x, f.y, M.thigh, M.shin, 1);
      Rig.limb(ctx, hj[0], hj[1], kn.kx, kn.ky, kn.fx, kn.fy, 6.6, 5.4, 4.5,
        i ? P.tightsShade : P.tights, P.ink, 1.25, i ? null : '#9c7f68');
      Rig.part(ctx, i ? S.bootF : S.bootN, kn.fx, kn.fy, f.rot);
    }
    // mochila, torso y tirante
    ctx.save();
    ctx.translate(ps.hipX, ps.hipY);
    ctx.rotate(ps.torso);
    ctx.scale(1, ps.breath);
    ctx.save();
    ctx.translate(-26, -22);
    ctx.rotate(g.packY * 0.025 - g.packX * 0.02);
    ctx.translate(26 + g.packX * 0.6, 22 + g.packY);
    Rig.part(ctx, S.pack, 0, 0);
    ctx.restore();
    // el suéter en dos pasadas: el cuerpo rígido y el bajo (desde la cintura) con vuelo
    const WAIST = -7;
    ctx.save();
    ctx.beginPath(); ctx.rect(-40, -60, 80, 60 + WAIST + 0.6); ctx.clip();
    Rig.part(ctx, S.torso, 0, 0);
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.rect(-40, WAIST - 0.6, 80, 40); ctx.clip();
    ctx.transform(1, 0, g.hemSkew, 1, -g.hemSkew * WAIST, 0);
    Rig.part(ctx, S.torso, 0, 0);
    ctx.restore();
    ctx.strokeStyle = P.packShade;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(9.5, -40); ctx.quadraticCurveTo(10.6, -32, 6.4, -24); ctx.stroke();
    ctx.strokeStyle = P.ink; ctx.lineWidth = 0.7; ctx.globalAlpha = 0.8;
    ctx.beginPath(); ctx.moveTo(8, -40); ctx.quadraticCurveTo(9, -32, 4.9, -24.4); ctx.moveTo(11, -39.6); ctx.quadraticCurveTo(12.2, -31.6, 7.9, -23.6); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.restore();
    // cabeza: pelo de atrás, cara, rasgos, flequillo, mechones sueltos
    ctx.save();
    ctx.translate(nk[0], nk[1]);
    ctx.rotate(headRot);
    ctx.save();
    ctx.translate(-4, -33);
    ctx.rotate(g.hairSway);
    ctx.translate(4, 33);
    Rig.part(ctx, S.hair, 0, 0);
    Rig.drawStrands(ctx, g.hair.slice(18), HAIR_COLS);
    ctx.restore();
    Rig.part(ctx, S.head, 0, 0);
    drawFace(ctx, g, ps);
    Rig.part(ctx, S.bangs, 0, 0);
    ctx.save();
    ctx.translate(-4, -33);
    ctx.rotate(g.hairSway * 0.6);
    ctx.translate(4, 33);
    Rig.drawStrands(ctx, g.hair.slice(0, 18), HAIR_COLS);
    ctx.restore();
    ctx.restore();
    // brazo cercano (con el ramillete de campanillas si lleva alguna)
    if (g.carry > 0 && S.bouquet) {
      const a = ps.arms[0];
      const ex = shN[0] + Math.sin(a.fwd) * M.upper, ey = shN[1] + Math.cos(a.fwd) * M.upper;
      const hx = ex + Math.sin(a.fwd + a.el) * (M.fore + 3), hy = ey + Math.cos(a.fwd + a.el) * (M.fore + 3);
      const k = Math.min(1, 0.45 + g.carry * 0.14);
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(-(a.fwd + a.el) * 0.35 + 0.15);
      ctx.scale(k, k);
      ctx.drawImage(S.bouquet.c, -S.bouquet.ox, -S.bouquet.oy, S.bouquet.w, S.bouquet.h);
      ctx.restore();
    }
    drawArm(ctx, shN[0], shN[1], ps.arms[0].fwd, ps.arms[0].el, S.upperN, S.foreN);
  }

  function drawBack(ctx, g, ps) {
    const hx = ps.hipX, hy = ps.hipY;
    // piernas y botas
    for (const i of [0, 1]) {
      const hj = [hx + (i ? -4.5 : 4.5), hy + 2];
      const f = ps.feet[i];
      const kn = Rig.kneeForward(hj[0], hj[1], f.x, f.y, M.thigh, M.shin, i ? -1 : 1);
      Rig.limb(ctx, hj[0], hj[1], kn.kx, kn.ky, kn.fx, kn.fy, 6.6, 5.4, 4.5, P.tights, P.ink, 1.25);
      Rig.part(ctx, S.bootBack, kn.fx, kn.fy, 0);
    }
    ctx.save();
    ctx.translate(hx, hy);
    Rig.part(ctx, S.torsoBack, 0, 0);
    ctx.restore();
    // brazos hacia los peldaños
    for (const i of [0, 1]) {
      const s = i ? -1 : 1;
      const sx = hx + s * 12, sy = hy - 36;
      const a = ps.arms[i];
      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(s, 1);
      drawArm(ctx, 0, 0, a.up, -a.el, S.upperN, S.foreN);
      ctx.restore();
    }
    ctx.save();
    ctx.translate(hx, hy);
    Rig.part(ctx, S.packBack, 0, 0);
    ctx.restore();
    ctx.save();
    ctx.translate(hx + 0.5, hy - 40);
    ctx.rotate(g.hairSway * 0.5);
    Rig.part(ctx, S.hairBackView, 0, 0);
    ctx.restore();
  }

  const BOX = [-85, -225, 85, 32]; // caja local que contiene a la niña con pelo y brazos

  function draw(ctx, g) {
    if (!g.pose || g.alpha <= 0.004) return;
    ctx.save();
    ctx.translate(g.x + g.offX, g.y + g.offY);
    // media vuelta: se estrecha en x y cambia de lado a mitad (pseudo‑giro en profundidad)
    const k = g.turnT > 0 && g.pose.view !== 'back' ? 1 - g.turnT / TURN : 1;
    const sx = 1 - 0.62 * Math.sin(Math.PI * U.clamp(k, 0, 1));
    ctx.scale(g.drawFacing * g.scale * sx, g.scale);
    Rig.faded(ctx, g.alpha, BOX, (c) => (g.pose.view === 'back' ? drawBack(c, g, g.pose) : drawSide(c, g, g.pose)));
    ctx.restore();
  }

  JHS.Girl = { M, S, build, create, update, draw, drawFace };
})(window.JHS = window.JHS || {});
