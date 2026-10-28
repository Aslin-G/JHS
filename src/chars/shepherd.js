/* El Buen Pastor — guía y mentor (Biblia §12, §13): cabello largo castaño, barba, rostro amable,
   ojos pequeños, túnica clara con costuras punteadas, manto beige, cinturón de cuerda y sandalias.
   Su silueta comunica protección, paciencia y serenidad: se mueve despacio. */
(function (JHS) {
  'use strict';
  const U = JHS.U, Paint = JHS.Paint, P = JHS.Palette, Rig = JHS.Rig;

  const RES = 1.9;
  const POST = { edge: 0.38, grain: 0.22, density: 0.06 };

  const M = {
    H: 292,
    neck: [2, -214],
    sh: [[16, -205], [-13, -206]],
    upper: 40, fore: 36,
    face: [5, -27],
  };
  const S = {};
  const HEAD_K = 1.14;
  let built = false;

  function stitches(g, x0, y0, x1, y1, step, col, a) {
    const L = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.floor(L / step);
    g.fillStyle = col;
    g.globalAlpha = a;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const x = U.lerp(x0, x1, t) + Math.sin(i * 1.7) * 0.3, y = U.lerp(y0, y1, t);
      g.beginPath();
      g.ellipse(x, y, 0.55, 1.3, Math.atan2(x1 - x0, y1 - y0) * -1, 0, U.TAU);
      g.fill();
    }
    g.globalAlpha = 1;
  }

  function paintRobe(g) {
    const rng = U.makeRng(401);
    const pts = [[-8.5, -3], [0, 5], [9, -3], [18, 1], [24, 10], [25.5, 40], [27.5, 90], [31, 150], [36, 194], [38.5, 204],
      [20, 207.5], [0, 205.5], [-20, 207.5], [-37, 204], [-34.5, 194], [-30.5, 150], [-26.5, 90], [-24.5, 40], [-23, 10], [-17.5, 1]];
    const poly = U.spline(pts, 3, true);
    Paint.wash(g, poly, P.robe, { layers: 7, alpha: 0.24, amp: 0.8, seed: 402, edge: 0.22, core: 1, vary: P.robeLight, varyAmt: 0.5 });
    Paint.within(g, poly, () => {
      // pliegues: veladuras verticales suaves
      for (let i = 0; i < 7; i++) {
        const x = U.lerp(-26, 30, (i + 0.5) / 7) + rng.range(-3, 3);
        Paint.shade(g, [[x - 2, 20], [x + 2, 20], [x + 4.5, 206], [x - 3.5, 206]], P.robeShade, { layers: 4, alpha: 0.1, amp: 3, seed: 403 + i, edge: 0 });
      }
      Paint.shade(g, [[-44, -6], [-12, -6], [-16, 100], [-14, 212], [-46, 212]], P.robeShade, { layers: 6, alpha: 0.13, amp: 6, seed: 410, edge: 0 });
      Paint.wash(g, U.blobPoly(14, 20, 9, 16, 10, rng, 0.25), P.robeLight, { layers: 4, alpha: 0.35, amp: 3, seed: 411, edge: 0 });
      // costuras punteadas verticales (rasgo de la lámina)
      for (let i = 0; i < 9; i++) {
        const u = (i + 0.5) / 9;
        stitches(g, U.lerp(-19, 21, u), 12, U.lerp(-33, 35, u), 202, 4.2, P.stitch, 0.55);
      }
      stitches(g, -36, 199, 38, 199, 4, P.stitch, 0.5);
      // escote en V con piel y cordón
      Paint.wash(g, [[-6, -3.5], [0, 7], [7, -3.5]], P.skin, { layers: 3, alpha: 0.5, amp: 0.3, seed: 412, edge: 0.2, core: 1 });
      Paint.ink(g, [[-5.5, -2], [0.5, 6], [6.5, -2]], { w: 0.8, alpha: 0.7, seed: 413, color: P.inkSoft });
      // cinturón de cuerda con nudo y cabos
      const by = 64;
      Paint.wash(g, [[-27, by - 3], [28, by - 4], [28.5, by + 3], [-27.5, by + 3.5]], P.belt, { layers: 4, alpha: 0.5, amp: 0.4, seed: 414, edge: 0.3, core: 1 });
      for (let x = -26; x < 28; x += 3.2) Paint.ink(g, [[x, by - 3], [x + 2.4, by + 3]], { w: 0.6, alpha: 0.6, color: P.beltLight, seed: 415 + x });
      Paint.wash(g, U.blobPoly(12, by + 1, 4, 3.4, 8, rng, 0.2), P.belt, { layers: 3, alpha: 0.6, amp: 0.3, seed: 416, edge: 0.3, core: 1 });
      for (const dx of [-1.5, 2.5]) {
        Paint.ink(g, [[12 + dx, by + 3], [13 + dx * 1.4, by + 22], [12 + dx * 2, by + 44]], { w: 2.2, alpha: 0.85, color: P.belt, seed: 417 + dx, taper: 0.2 });
        Paint.ink(g, [[12 + dx, by + 3], [13 + dx * 1.4, by + 22], [12 + dx * 2, by + 44]], { w: 0.6, alpha: 0.6, seed: 418 + dx, taper: 0.2 });
      }
    });
    Paint.ink(g, poly, { closed: true, w: 1.5, wv: 0.5, breaks: 0.14, sketch: 0.5, seed: 420, alpha: 0.85, bleed: 0.5 });
  }

  function paintMantle(g, back) {
    const rng = U.makeRng(back ? 431 : 432);
    const pts = back
      ? [[-8, -2], [-22, 2], [-28, 30], [-33, 90], [-38, 168], [-26, 174], [-20, 110], [-14, 50], [-8, 10]]
      : [[2, -3], [14, -4], [23, 2], [27, 14], [27, 50], [25, 96], [24, 136], [19, 142], [12, 137], [8, 96], [4, 50], [1, 14]];
    const poly = U.spline(pts, 3, true);
    Paint.wash(g, poly, P.mantle, { layers: 6, alpha: 0.26, amp: 0.6, seed: back ? 433 : 434, edge: 0.25, core: 1, vary: P.mantleLight, varyAmt: 0.5 });
    Paint.within(g, poly, () => {
      Paint.shade(g, back ? [[-44, -4], [-26, -4], [-28, 190], [-46, 190]] : [[0, -6], [12, -6], [12, 160], [0, 160]], P.mantleShade,
        { layers: 5, alpha: 0.16, amp: 4, seed: 435, edge: 0 });
      // franjas verticales tejidas
      const xs = back ? [[-18, -30], [-13, -23]] : [[9, 14], [20, 20]];
      for (const [xa, xb] of xs) {
        Paint.ink(g, [[xa, 6], [U.lerp(xa, xb, 0.5), 80], [xb, 150]], { w: 1.4, alpha: 0.45, color: P.mantleShade, seed: 436 + xa, taper: 0.1 });
        stitches(g, xa + 1.6, 8, xb + 1.6, 148, 4.5, P.stitch, 0.45);
      }
      Paint.splatter(g, back ? -26 : 16, 80, 8, 70, 30, P.mantleShade, { alpha: 0.3, rmin: 0.3, rmax: 0.7, seed: 437 });
    });
    Paint.ink(g, poly, { closed: true, w: 1.35, wv: 0.45, breaks: 0.14, seed: back ? 438 : 439, alpha: 0.82 });
    void rng;
  }

  function paintSleeve(g, lower, far) {
    const col = far ? U.mix(P.robe, P.robeShade, 0.55) : P.robe;
    const poly = lower
      ? U.spline([[-10.5, -2], [10.5, -2], [12.5, 18], [14, 35], [0, 38], [-14, 35], [-12.5, 18]], 3, true)
      : U.spline([[-8.5, -6], [0, -9.5], [8.5, -6], [10, 18], [10.8, 41], [0, 43], [-10.8, 41], [-10, 18]], 3, true);
    if (lower) {
      const hand = U.spline([[-4.6, 33], [4.8, 33], [6, 40], [4.4, 47], [-0.6, 48.5], [-4.8, 45], [-5.6, 39]], 3, true);
      const thumb = U.spline([[3.6, 35], [7.6, 37], [7.8, 41], [4.6, 40.6]], 2, true);
      const skin = far ? U.mix(P.skin, P.skinShade, 0.45) : P.skin;
      Paint.wash(g, hand, skin, { layers: 5, alpha: 0.3, amp: 0.3, seed: 451, edge: 0.25, core: 1 });
      Paint.wash(g, thumb, skin, { layers: 4, alpha: 0.3, amp: 0.2, seed: 452, edge: 0.25, core: 1 });
      Paint.within(g, hand, () => Paint.shade(g, [[-8, 30], [0, 30], [0, 52], [-8, 52]], P.skinShade, { layers: 3, alpha: 0.18, amp: 2.6, seed: 453, edge: 0 }));
      Paint.ink(g, hand, { closed: true, w: 1.1, alpha: 0.85, seed: 454, breaks: 0.1 });
      Paint.ink(g, thumb, { closed: true, w: 0.9, alpha: 0.75, seed: 455, breaks: 0.2 });
    }
    Paint.wash(g, poly, col, { layers: 6, alpha: 0.26, amp: 0.5, seed: lower ? 456 : 457, edge: 0.22, core: 1 });
    Paint.within(g, poly, () => {
      Paint.shade(g, [[-18, -12], [-2, -12], [-2, 48], [-18, 48]], P.robeShade, { layers: 4, alpha: 0.14, amp: 4, seed: 458, edge: 0 });
      for (let i = 0; i < 4; i++) {
        const u = (i + 0.5) / 4;
        stitches(g, U.lerp(-7, 7, u), lower ? 0 : -4, U.lerp(lower ? -11 : -9, lower ? 11 : 9, u), lower ? 33 : 40, 4, P.stitch, 0.45);
      }
    });
    Paint.ink(g, poly, { closed: true, w: 1.3, wv: 0.45, breaks: 0.12, seed: lower ? 459 : 460, alpha: 0.85 });
  }

  // Pelo largo y ondulado: masa detrás de la cabeza que cae hasta la espalda.
  function wavyStrand(rng, x, y, ang, len, grav, wave) {
    const pts = [[x, y]];
    let dx = Math.cos(ang), dy = Math.sin(ang);
    const steps = Math.max(4, Math.round(len / 3.5));
    const st = len / steps;
    const ph = rng.range(0, 6.28);
    for (let k = 1; k <= steps; k++) {
      dy += grav * 0.25;
      const l = Math.hypot(dx, dy); dx /= l; dy /= l;
      const w = Math.sin(ph + k * 0.55) * wave;
      x += (dx - dy * w) * st; y += (dy + dx * w) * st;
      pts.push([x, y]);
    }
    return pts;
  }

  function strandPath(g, pts) {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) g.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
    g.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
  }

  function hairField(g, rng, n, sc, th0, th1, len0, len1, grav, wave, cols, w0, w1, a0, a1, turn = 0) {
    g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const th = rng.range(th0, th1);
      const k = rng.range(0.7, 1);
      const pts = wavyStrand(rng, sc[0] + Math.cos(th) * 21 * k, sc[1] + Math.sin(th) * 24 * k, th + turn + rng.range(-0.25, 0.25), rng.range(len0, len1), grav, wave * rng.range(0.6, 1.3));
      g.strokeStyle = rng.pick(cols);
      g.lineWidth = rng.range(w0, w1);
      g.globalAlpha = rng.range(a0, a1);
      strandPath(g, pts);
      g.stroke();
    }
    g.globalAlpha = 1;
  }

  function paintHairBack(g) {
    const rng = U.makeRng(471);
    const sc = [2, -29];
    const mass = U.spline([[3, -56], [15, -53], [23, -43], [26, -28], [25, -12], [21, -2], [14, -7], [4, -12], [-6, -2], [-9, 12], [-13, 26],
      [-20, 30], [-25, 22], [-25, 4], [-24, -18], [-21, -38], [-12, -52]], 3, true);
    Paint.wash(g, mass, P.shepHair, { layers: 7, alpha: 0.24, amp: 1.6, seed: 472, edge: 0.2, core: 1, vary: P.shepHairDark, varyAmt: 0.45 });
    Paint.within(g, mass, () => {
      Paint.shade(g, U.blobPoly(-26, 18, 16, 26, 12, rng, 0.25), P.shepHairDark, { layers: 5, alpha: 0.2, amp: 5, seed: 473, edge: 0 });
      Paint.wash(g, U.blobPoly(8, -50, 15, 7, 12, rng, 0.3), P.shepHairLight, { layers: 5, alpha: 0.22, amp: 2, seed: 474, edge: 0 });
    });
    const dark = [P.shepHairDark, P.shepHair, P.shepHairDark], mid = [P.shepHair, P.shepHairLight, P.shepHair];
    hairField(g, rng, 110, sc, -Math.PI * 1.02, -Math.PI * 0.62, 30, 52, 1.35, 0.36, dark, 0.9, 1.8, 0.6, 0.9);
    hairField(g, rng, 80, sc, -Math.PI * 0.75, -Math.PI * 0.35, 26, 44, 1.2, 0.38, mid, 0.8, 1.6, 0.55, 0.88, -0.95);
    hairField(g, rng, 40, sc, -0.6, 0.1, 20, 32, 1.2, 0.35, dark, 0.8, 1.5, 0.6, 0.9);
    hairField(g, rng, 40, sc, -Math.PI * 0.65, -Math.PI * 0.3, 16, 28, 1, 0.4, [P.shepHairLight, '#c89363'], 0.6, 1.1, 0.5, 0.85, -0.6);
    for (let i = 0; i < 22; i++) {
      const th = rng.range(-Math.PI * 1.05, -Math.PI * 0.4);
      Paint.ink(g, wavyStrand(rng, sc[0] + Math.cos(th) * 18, sc[1] + Math.sin(th) * 21, th, rng.range(22, 48), 0.95, 0.4), { w: 0.8, alpha: 0.55, seed: 475 + i, taper: 0.5, wobble: 0.2 });
    }
    Paint.splatter(g, 4, -48, 14, 8, 12, '#f3d9b2', { alpha: 0.45, rmin: 0.3, rmax: 0.55, seed: 476 });
  }

  function paintHead(g) {
    const rng = U.makeRng(481);
    const face = U.spline([[5, -51.5], [15, -49], [22, -42], [25, -32], [25.2, -22], [23.5, -12], [18, -4], [8, -1], [-2, -2.5], [-10, -9],
      [-14.6, -20], [-15.4, -32], [-12, -43], [-4, -50]], 3, true);
    const neck = U.spline([[-6, -8], [9, -8], [9.5, 4], [-6.5, 4]], 2, true);
    Paint.wash(g, neck, U.mix(P.skin, P.skinShade, 0.45), { layers: 5, alpha: 0.3, amp: 0.4, seed: 482, edge: 0.3, core: 1 });
    Paint.wash(g, face, P.skin, { layers: 7, alpha: 0.22, amp: 0.45, seed: 483, edge: 0.18, core: 1, vary: P.skinLight, varyAmt: 0.45 });
    const ear = U.spline([[-12, -30], [-17.5, -29.5], [-18.8, -24], [-16.6, -18.6], [-12.4, -18.6]], 3, true);
    Paint.wash(g, ear, P.skin, { layers: 5, alpha: 0.3, amp: 0.3, seed: 484, edge: 0.3, core: 1 });
    Paint.ink(g, ear, { closed: true, w: 1.1, alpha: 0.8, seed: 485, breaks: 0.1 });
    Paint.within(g, face, () => {
      Paint.shade(g, [[-22, -56], [-3, -56], [-6, -30], [-2, 2], [-24, 2]], P.skinShade, { layers: 6, alpha: 0.1, amp: 4.8, seed: 486, edge: 0 });
      Paint.wash(g, U.blobPoly(16, -40, 8, 6, 10, rng, 0.25), P.skinLight, { layers: 4, alpha: 0.32, amp: 1, seed: 487, edge: 0 });
      Paint.softBlob(g, 1.5, -22.5, 6.6, P.blush, 0.32);
      Paint.softBlob(g, 21.5, -24, 3.6, P.blush, 0.22);
    });
    // nariz
    Paint.ink(g, [[14.5, -30], [16.6, -24.5], [14.4, -22.6], [17.6, -22.8]], { w: 0.9, alpha: 0.72, seed: 488, taper: 0.3 });
    Paint.ink(g, face, { closed: true, w: 1.35, wv: 0.45, breaks: 0.08, sketch: 0.35, seed: 489, alpha: 0.86, bleed: 0.5 });
    // barba y bigote: masa castaña con mechones
    const beard = U.spline([[-12.6, -24], [-10, -12], [-4, -2], [4, 2.5], [13, 1.5], [21, -4.5], [25, -12], [25.6, -18], [22, -17], [18, -13],
      [13, -16.4], [8, -15.6], [4, -12], [-2, -12.5], [-6, -18], [-9.8, -23]], 3, true);
    Paint.wash(g, beard, P.beard, { layers: 7, alpha: 0.24, amp: 0.8, seed: 490, edge: 0.22, core: 1, vary: P.shepHairDark, varyAmt: 0.4 });
    Paint.within(g, beard, () => {
      g.lineCap = 'round';
      for (let i = 0; i < 90; i++) {
        const x = rng.range(-12, 25), y = rng.range(-22, 3);
        g.strokeStyle = rng.pick([P.shepHairDark, P.shepHair, P.shepHairLight, P.beard]);
        g.lineWidth = rng.range(0.6, 1.2);
        g.globalAlpha = rng.range(0.5, 0.85);
        g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + rng.range(-1.5, 1.5), y + 3, x + rng.range(-2.5, 2.5), y + rng.range(4, 7)); g.stroke();
      }
      g.globalAlpha = 1;
      Paint.splatter(g, 8, -8, 14, 9, 14, '#f0d7b0', { alpha: 0.4, rmin: 0.3, rmax: 0.6, seed: 491 });
    });
    const must = U.spline([[7, -17.4], [12.5, -19.6], [18, -18.6], [22.4, -16], [17, -14.6], [12.6, -15.6], [8.6, -14.4]], 2, true);
    Paint.wash(g, must, P.beard, { layers: 4, alpha: 0.4, amp: 0.3, seed: 492, edge: 0.3, core: 1 });
    Paint.ink(g, beard, { closed: true, w: 1.1, alpha: 0.6, seed: 493, breaks: 0.3, sketch: 0.3 });
  }

  function paintHairFront(g) {
    const rng = U.makeRng(501);
    // raya al medio y mechones que enmarcan la cara por el lado cercano
    const cap = U.spline([[-8, -46], [5, -55], [17, -52], [24, -44], [20, -42.5], [13, -47], [5, -47.5], [-2, -44], [-8, -38], [-11, -30]], 3, true);
    Paint.wash(g, cap, P.shepHair, { layers: 6, alpha: 0.26, amp: 0.6, seed: 502, edge: 0.2, core: 1, vary: P.shepHairLight, varyAmt: 0.4 });
    g.lineCap = 'round';
    for (let i = 0; i < 40; i++) {
      const x = rng.range(-4, 14), y = rng.range(-56, -50);
      const pts = wavyStrand(rng, x, y, x < 5 ? Math.PI * 0.85 : 0.2, rng.range(14, 22), 1.2, 0.2);
      g.strokeStyle = rng.pick([P.shepHair, P.shepHairLight, P.shepHairDark]);
      g.lineWidth = rng.range(0.7, 1.4);
      g.globalAlpha = rng.range(0.6, 0.9);
      strandPath(g, pts); g.stroke();
    }
    // mechones largos que caen delante de la oreja hasta el hombro
    for (let i = 0; i < 18; i++) {
      const pts = wavyStrand(rng, rng.range(-12, -6), rng.range(-46, -36), Math.PI * 0.62 + rng.range(-0.2, 0.2), rng.range(36, 58), 1.2, 0.28);
      g.strokeStyle = rng.pick([P.shepHair, P.shepHairDark, P.shepHairLight]);
      g.lineWidth = rng.range(0.8, 1.6);
      g.globalAlpha = rng.range(0.6, 0.9);
      strandPath(g, pts); g.stroke();
    }
    g.globalAlpha = 1;
  }

  function paintSandal(g, far) {
    const foot = U.spline([[-5, -5], [5, -5], [6.5, 1], [13, 4], [15.5, 7], [14, 9.5], [-5.5, 9.5], [-6.5, 4]], 3, true);
    const skin = far ? U.mix(P.skin, P.skinShade, 0.45) : P.skin;
    Paint.wash(g, foot, skin, { layers: 5, alpha: 0.3, amp: 0.3, seed: far ? 511 : 512, edge: 0.25, core: 1 });
    Paint.wash(g, [[-6.5, 8.6], [16, 8.6], [15.6, 11.4], [-6.5, 11.4]], P.sandal, { layers: 4, alpha: 0.55, amp: 0.3, seed: 513, edge: 0.3, core: 1 });
    for (const [a, b] of [[[-4, 1], [6, 2.5]], [[3, 5.5], [10, 4]]]) Paint.ink(g, [a, b], { w: 1.8, alpha: 0.9, color: P.sandal, seed: 514 + a[0] });
    Paint.ink(g, foot, { closed: true, w: 1.1, alpha: 0.85, seed: far ? 515 : 516, breaks: 0.1 });
  }

  function build() {
    if (built) return;
    Paint.withInk(1.3, buildParts);
    built = true;
  }

  function buildParts() {
    const mk = (w, h, ox, oy, fn) => Paint.makeSprite({ w, h, ox, oy, res: RES, post: POST }, fn);
    S.robe = mk(84, 220, 42, 8, paintRobe);
    S.mantleF = mk(40, 160, 6, 10, (g) => paintMantle(g, false));
    S.mantleB = mk(48, 190, 46, 8, (g) => paintMantle(g, true));
    S.upperN = mk(26, 56, 13, 12, (g) => paintSleeve(g, false, false));
    S.upperF = mk(26, 56, 13, 12, (g) => paintSleeve(g, false, true));
    S.foreN = mk(32, 54, 16, 4, (g) => paintSleeve(g, true, false));
    S.foreF = mk(32, 54, 16, 4, (g) => paintSleeve(g, true, true));
    S.hairBack = mk(112, 150, 64, 72, paintHairBack);
    S.head = mk(48, 64, 18, 58, paintHead);
    S.hairFront = mk(64, 96, 34, 66, paintHairFront);
    S.sandalN = mk(26, 20, 8, 7, (g) => paintSandal(g, false));
    S.sandalF = mk(26, 20, 8, 7, (g) => paintSandal(g, true));
  }

  function makeHair() {
    const rng = U.makeRng(533);
    const specs = [];
    for (let i = 0; i < 14; i++) {
      const a = U.lerp(Math.PI * 0.62, Math.PI * 1.05, i / 13);
      specs.push({
        x: 2 + Math.cos(a) * 22, y: -26 + Math.sin(a) * 26, ang: Math.PI * 0.55 + rng.range(-0.15, 0.2), len: rng.range(22, 40),
        curl: rng.range(-0.5, 0.5), w: rng.range(0.8, 1.4), col: rng.int(0, 2), hook: 0,
        phase: rng.range(0, 6.28), flex: 1.1, stiff: rng.range(0.5, 0.9), alpha: rng.range(0.7, 0.9),
      });
    }
    for (let i = 0; i < 5; i++) {
      specs.push({
        x: rng.range(-6, 12), y: -53 + rng.range(-1.5, 1.5), ang: -Math.PI * 0.85 + rng.range(-0.25, 0.25), len: rng.range(4, 7),
        curl: rng.range(-0.8, 0.8), w: 0.6, col: rng.int(1, 2), hook: rng.range(0.8, 1.4), phase: rng.range(0, 6), flex: 0.7, stiff: 1, alpha: 0.65,
      });
    }
    return Rig.makeStrands(specs);
  }
  const HAIR_COLS = [P.shepHairDark, P.shepHair, P.shepHairLight];

  function create(x, y) {
    return {
      x, y, vx: 0, facing: 1, alpha: 1, scale: 1,
      anim: 'idle', animT: 0, t: Math.random() * 5, phase: 0, speed: 0,
      blinkT: 2, blink: 0, expr: 'sereno', talking: false, talkT: 0,
      hair: makeHair(), sway: 0, pose: null, glow: 0,
    };
  }

  function setAnim(s, a) { if (s.anim !== a) { s.anim = a; s.animT = 0; } }

  function update(s, dt) {
    s.t += dt;
    s.animT += dt;
    s.blinkT -= dt;
    if (s.blinkT <= 0) { s.blink = 0.15; s.blinkT = 2.5 + Math.random() * 3.5; }
    s.blink = Math.max(0, s.blink - dt);
    if (s.talking) s.talkT += dt;
    const br = Math.sin(s.t * U.TAU * 0.25);
    const ps = {
      bodyY: 0, breath: 1 + br * 0.008, head: Math.sin(s.t * 0.4) * 0.03, robeSkew: 0,
      feet: [{ x: 7, y: -7, rot: 0 }, { x: -7, y: -7, rot: 0 }],
      arms: [{ fwd: 0.1, el: 0.35 }, { fwd: -0.05, el: 0.3 }],
      mouth: s.talking ? (Math.sin(s.talkT * 11) > 0.1 ? 'open' : 'smile') : 'smile',
    };
    const a = s.anim;
    if (a === 'walk') {
      const L = 40, beta = 0.62;
      s.phase = (s.phase + (beta * Math.max(s.speed, 20) / L) * dt) % 1;
      for (let i = 0; i < 2; i++) {
        const f = Rig.footCycle(s.phase + i * 0.5, L, beta, 6);
        ps.feet[i] = { x: f.x + 2, y: -7 + f.y, rot: f.rot * 0.6 };
      }
      const ph = s.phase * U.TAU;
      ps.bodyY = -Math.abs(Math.cos(ph)) * 2;
      ps.robeSkew = Math.sin(ph) * 0.028;
      ps.arms[0] = { fwd: -Math.sin(ph) * 0.2 + 0.05, el: 0.3 };
      ps.arms[1] = { fwd: Math.sin(ph) * 0.2, el: 0.3 };
      ps.head = Math.sin(ph * 2) * 0.012;
    } else if (a === 'point') {
      const k = U.smoothstep(0, 0.5, s.animT);
      ps.arms[0] = { fwd: U.lerp(0.1, 1.3, k), el: U.lerp(0.35, 0.08, k) };
      ps.head = -0.04 * k;
    } else if (a === 'bless') {
      const k = U.smoothstep(0, 0.6, s.animT);
      ps.arms[0] = { fwd: U.lerp(0.1, 1.65, k), el: U.lerp(0.35, 0.55, k) };
      ps.head = -0.06 * k;
      s.glow = k;
    } else if (a === 'speak') {
      const k = U.smoothstep(0, 0.4, s.animT);
      ps.arms[0] = { fwd: U.lerp(0.1, 0.55, k) + Math.sin(s.animT * 2.2) * 0.08, el: U.lerp(0.35, 1.25, k) + Math.sin(s.animT * 3) * 0.12 };
      ps.head = Math.sin(s.animT * 2.6) * 0.04;
    } else if (a === 'look') {
      ps.head = -0.09;
      ps.arms[0] = { fwd: 0.35, el: 0.9 };
      ps.arms[1] = { fwd: 0.3, el: 0.95 };
    } else if (a === 'kneel') {
      // inclinarse hacia la niña: espalda curva y mano extendida
      const k = U.smoothstep(0, 0.6, s.animT);
      ps.bodyY = 14 * k;
      ps.head = 0.18 * k;
      ps.arms[0] = { fwd: U.lerp(0.1, 0.9, k), el: 0.2 };
    } else if (a === 'wave') {
      // saludo con la mano en alto
      const k = U.smoothstep(0, 0.25, s.animT) * (1 - U.smoothstep(1.3, 1.6, s.animT));
      // la mano queda por delante y por encima de la cara, hacia quien saluda
      ps.arms[0] = { fwd: U.lerp(0.1, 2.15, k), el: U.lerp(0.35, 0.3 + Math.sin(s.animT * 9) * 0.38, k) };
      ps.head = -0.05 * k;
    }
    // al hablar con la niña de cerca se inclina hacia ella
    s.bendK = U.damp(s.bendK || 0, s.bend ? 1 : 0, 3, dt);
    if (s.bendK > 0.01) { ps.bodyY += 11 * s.bendK; ps.head += 0.14 * s.bendK; }
    // el viento mueve la túnica y el manto (más abajo, más movimiento)
    const windT = (s.wind || 0) * 0.011 + Math.sin(s.t * 1.7) * 0.006 + Math.sin(s.t * 4.3) * 0.003 * (s.wind || 0);
    s.robeV = (s.robeV || 0) + ((windT - (s.robeW || 0)) * 40 - (s.robeV || 0) * 6) * Math.min(dt, 0.05);
    s.robeW = (s.robeW || 0) + s.robeV * Math.min(dt, 0.05);
    ps.robeSkew += -s.robeW * s.facing;
    if (a !== 'bless') s.glow = Math.max(0, s.glow - dt * 1.5);
    Rig.stepStrands(s.hair, dt, { vx: s.vx || 0, vy: 0, wind: s.wind || 0, t: s.t, facing: s.facing });
    s.sway = U.damp(s.sway, U.clamp(-(s.vx || 0) * 0.0004 * s.facing + (s.wind || 0) * 0.008, -0.08, 0.08), 3, dt);
    s.pose = ps;
  }

  function drawArm(ctx, sx, sy, fwd, el, up, fore) {
    Rig.part(ctx, up, sx, sy, -fwd);
    const ex = sx + Math.sin(fwd) * M.upper, ey = sy + Math.cos(fwd) * M.upper;
    Rig.part(ctx, fore, ex, ey, -(fwd + el));
    return [ex + Math.sin(fwd + el) * (M.fore + 8), ey + Math.cos(fwd + el) * (M.fore + 8)];
  }

  function drawFace(ctx, s, ps) {
    const eyes = [[5.4, -31.5, 2.2, 2.9], [17.6, -32, 1.9, 2.75]];
    const e = s.expr;
    ctx.lineCap = 'round';
    for (const [x, y, rx, ry] of eyes) {
      ctx.fillStyle = P.eye; ctx.strokeStyle = P.eye; ctx.lineWidth = 1.2;
      if (s.blink > 0 || e === 'compasivo') {
        ctx.beginPath(); ctx.arc(x, y - 1.4, rx * 1.2, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
      } else if (e === 'animado') {
        ctx.beginPath(); ctx.arc(x, y + 1, rx * 1.2, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      } else {
        ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, U.TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,250,240,0.85)';
        ctx.beginPath(); ctx.arc(x + rx * 0.35, y - ry * 0.4, 0.6, 0, U.TAU); ctx.fill();
      }
    }
    // cejas
    const tilt = e === 'preocupado' ? 0.4 : e === 'compasivo' ? 0.25 : 0;
    ctx.strokeStyle = P.shepHairDark; ctx.lineWidth = 1.1; ctx.globalAlpha = 0.85;
    for (const [x, w, inR] of [[5.4, 3.4, true], [17.6, 2.6, false]]) {
      const y = -38.5, yi = y - tilt * 2.4, yo = y + tilt * 0.8;
      ctx.beginPath(); ctx.moveTo(x - w, inR ? yo : yi); ctx.quadraticCurveTo(x, y - 1, x + w, inR ? yi : yo); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // boca dentro de la barba
    ctx.strokeStyle = U.mix(P.mouth, P.ink, 0.45);
    ctx.lineWidth = 1.05;
    ctx.beginPath();
    const mx = 14.2, my = -12.6;
    if (ps.mouth === 'open' || e === 'animado') {
      ctx.fillStyle = U.rgba(P.mouth, 0.85);
      ctx.moveTo(mx - 3.4, my - 0.6); ctx.quadraticCurveTo(mx, my + 3.4, mx + 3.4, my - 0.6); ctx.closePath(); ctx.fill();
    } else if (e === 'preocupado') {
      ctx.moveTo(mx - 3, my + 0.4); ctx.quadraticCurveTo(mx, my - 0.6, mx + 3, my + 0.4); ctx.stroke();
    } else {
      ctx.moveTo(mx - 3.4, my - 0.8); ctx.quadraticCurveTo(mx, my + 2.2, mx + 3.2, my - 0.8); ctx.stroke();
    }
  }

  const BOX = [-90, -345, 100, 26];

  // Posición de la mano cercana (para el brillo de la bendición), sin dibujar.
  function handPos(ps) {
    const a = ps.arms[0], sx = M.sh[0][0], sy = M.sh[0][1] + ps.bodyY;
    const ex = sx + Math.sin(a.fwd) * M.upper, ey = sy + Math.cos(a.fwd) * M.upper;
    return [ex + Math.sin(a.fwd + a.el) * (M.fore + 8), ey + Math.cos(a.fwd + a.el) * (M.fore + 8)];
  }

  function draw(ctx, s) {
    const ps = s.pose;
    if (!ps || s.alpha <= 0.004) return;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.scale(s.facing * s.scale, s.scale);
    Rig.faded(ctx, s.alpha, BOX, (c) => drawBody(c, s, ps));
    const hand = handPos(ps);
    if (s.glow > 0.01) {
      ctx.globalCompositeOperation = 'screen';
      Paint.softBlob(ctx, hand[0], hand[1], 38, P.sunGlow, 0.55 * s.glow * s.alpha);
      Paint.softBlob(ctx, hand[0], hand[1], 12, '#fffbe8', 0.8 * s.glow * s.alpha);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
    s.handWorld = [s.x + hand[0] * s.facing * s.scale, s.y + hand[1] * s.scale];
  }

  function drawBody(ctx, s, ps) {
    const nx = M.neck[0], ny = M.neck[1] + ps.bodyY;
    const shN = [M.sh[0][0], M.sh[0][1] + ps.bodyY], shF = [M.sh[1][0], M.sh[1][1] + ps.bodyY];
    // pies bajo el borde de la túnica
    Rig.part(ctx, S.sandalF, ps.feet[1].x, ps.feet[1].y, ps.feet[1].rot);
    Rig.part(ctx, S.sandalN, ps.feet[0].x, ps.feet[0].y, ps.feet[0].rot);
    // brazo lejano, manto de atrás, pelo de atrás (que cae sobre la espalda)
    drawArm(ctx, shF[0], shF[1], ps.arms[1].fwd, ps.arms[1].el, S.upperF, S.foreF);
    // la túnica cuelga del cuello: al inclinarse se acorta para que el bajo siga en el suelo
    const robeXf = () => { ctx.translate(nx, ny); ctx.transform(1, 0, ps.robeSkew, 1, 0, 0); ctx.scale(1, ps.breath * (212 - ps.bodyY) / 212); };
    ctx.save(); robeXf(); Rig.part(ctx, S.mantleB, 0, 0); ctx.restore();
    ctx.save(); ctx.translate(nx, ny); ctx.rotate(ps.head * 0.5 + s.sway); ctx.scale(HEAD_K, HEAD_K); Rig.part(ctx, S.hairBack, 0, 0);
    Rig.drawStrands(ctx, s.hair.slice(0, 14), HAIR_COLS); ctx.restore();
    ctx.save(); robeXf(); Rig.part(ctx, S.robe, 0, 0); Rig.part(ctx, S.mantleF, 0, 0); ctx.restore();
    // cabeza
    ctx.save();
    ctx.translate(nx, ny);
    ctx.rotate(ps.head);
    ctx.scale(HEAD_K, HEAD_K);
    Rig.part(ctx, S.head, 0, 0);
    drawFace(ctx, s, ps);
    Rig.part(ctx, S.hairFront, 0, 0);
    Rig.drawStrands(ctx, s.hair.slice(14), HAIR_COLS);
    ctx.restore();
    // brazo cercano (con las campanillas que le regala la niña)
    const bq = s.flowers && JHS.Girl.S.bouquet;
    if (bq) {
      const a = ps.arms[0];
      const ex = shN[0] + Math.sin(a.fwd) * M.upper, ey = shN[1] + Math.cos(a.fwd) * M.upper;
      const hx = ex + Math.sin(a.fwd + a.el) * (M.fore + 2), hy = ey + Math.cos(a.fwd + a.el) * (M.fore + 2);
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(-(a.fwd + a.el) * 0.3 + 0.1);
      ctx.scale(1.05, 1.05);
      ctx.drawImage(bq.c, -bq.ox, -bq.oy, bq.w, bq.h);
      ctx.restore();
    }
    drawArm(ctx, shN[0], shN[1], ps.arms[0].fwd, ps.arms[0].el, S.upperN, S.foreN);
  }

  JHS.Shepherd = { M, S, build, create, update, draw, setAnim };
})(window.JHS = window.JHS || {});
