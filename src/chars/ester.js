/* Ester — la vecina de la casa junto al arroyo (Mundo 1). Anciana menuda y algo encorvada: moño
   gris, chal de punto color miel, vestido salvia y delantal crema con bolsillo. Mismo lenguaje
   que el resto del reparto (lavados por piezas, tinta parda, rubor en las mejillas, ojos
   pequeños) y una silueta propia: redonda, baja y cálida. Se mueve despacio y con pausas. */
(function (JHS) {
  'use strict';
  const U = JHS.U, Paint = JHS.Paint, P = JHS.Palette, Rig = JHS.Rig;

  const RES = 1.9;
  const POST = { edge: 0.38, grain: 0.22, density: 0.06 };
  const COL = {
    dress: '#7f8c63', dressShade: '#5f6b48', dressLight: '#a3ae84',
    apron: '#efe4cf', apronShade: '#cdbfa2',
    shawl: '#c99a55', shawlShade: '#a8783a', shawlLight: '#e2bb79',
    hair: '#cfc8bd', hairShade: '#a29a8e', hairLight: '#ece6dc',
    shoe: '#5a3c24', can: '#8a9a98', canShade: '#647371', canLight: '#c4d0cc',
  };
  // Medidas del modelo (pies en el origen, y hacia arriba negativa)
  const M = { H: 236, neck: [3, -170], sh: [[13, -163], [-10, -164]], upper: 32, fore: 28 };
  const S = {};
  let built = false;

  function paintDress(g) {
    const rng = U.makeRng(701);
    const pts = [[-7, -4], [0, 3], [8, -4], [15, 0], [19, 10], [20, 40], [22, 70], [27, 110], [32, 150], [34, 162], [16, 165], [0, 164], [-16, 165], [-33, 162],
      [-31, 150], [-26, 110], [-22, 70], [-20, 40], [-19, 10], [-14, 0]];
    const poly = U.spline(pts, 3, true);
    Paint.wash(g, poly, COL.dress, { layers: 7, alpha: 0.24, amp: 0.8, seed: 702, edge: 0.22, core: 1, vary: COL.dressLight, varyAmt: 0.45 });
    Paint.within(g, poly, () => {
      for (let i = 0; i < 6; i++) {
        const x = U.lerp(-24, 28, (i + 0.5) / 6) + rng.range(-3, 3);
        Paint.shade(g, [[x - 2, 70], [x + 2, 70], [x + 4.5, 166], [x - 3.5, 166]], COL.dressShade, { layers: 4, alpha: 0.12, amp: 3, seed: 703 + i, edge: 0 });
      }
      Paint.shade(g, [[-40, -6], [-10, -6], [-14, 90], [-12, 170], [-42, 170]], COL.dressShade, { layers: 6, alpha: 0.14, amp: 6, seed: 710, edge: 0 });
      Paint.wash(g, U.blobPoly(12, 24, 8, 14, 10, rng, 0.25), COL.dressLight, { layers: 4, alpha: 0.3, amp: 3, seed: 711, edge: 0 });
      // cuello redondo de puntilla
      Paint.wash(g, [[-7, -4], [0, 4], [8, -4], [8, 1], [0, 8], [-7, 1]], '#f6efe0', { layers: 3, alpha: 0.7, amp: 0.2, seed: 712, edge: 0.3, core: 1 });
      // bajo con una cenefa
      Paint.ink(g, [[-31, 154], [0, 157], [33, 154]], { w: 1.4, alpha: 0.5, color: COL.dressShade, seed: 713, taper: 0.1 });
    });
    Paint.ink(g, poly, { closed: true, w: 1.5, wv: 0.5, breaks: 0.14, sketch: 0.5, seed: 720, alpha: 0.85, bleed: 0.5 });
  }

  function paintApron(g) {
    const rng = U.makeRng(731);
    const pts = [[-15, 0], [16, 0], [19, 30], [22, 74], [12, 78], [0, 77], [-12, 78], [-20, 74], [-18, 30]];
    const poly = U.spline(pts, 3, true);
    Paint.wash(g, poly, COL.apron, { layers: 6, alpha: 0.28, amp: 0.6, seed: 732, edge: 0.22, core: 1 });
    Paint.within(g, poly, () => {
      Paint.shade(g, [[-26, -4], [-6, -4], [-8, 82], [-26, 82]], COL.apronShade, { layers: 4, alpha: 0.18, amp: 4, seed: 733, edge: 0 });
      for (let i = 0; i < 3; i++) Paint.shade(g, [[-6 + i * 8, 10], [-4 + i * 8, 10], [-3 + i * 9, 78], [-6 + i * 9, 78]], COL.apronShade, { layers: 2, alpha: 0.12, amp: 2, seed: 734 + i, edge: 0 });
      // bolsillo con un pañuelo asomando
      const pk = [[2, 34], [16, 34], [15, 50], [3, 50]];
      Paint.wash(g, pk, '#e6d9bf', { layers: 3, alpha: 0.6, amp: 0.3, seed: 737, edge: 0.3, core: 1 });
      Paint.ink(g, pk, { closed: true, w: 0.9, alpha: 0.6, seed: 738, breaks: 0.2 });
      Paint.wash(g, [[6, 34], [10, 27], [13, 34]], '#d98a7a', { layers: 2, alpha: 0.8, amp: 0.2, seed: 739, edge: 0.3, core: 1 });
    });
    Paint.ink(g, poly, { closed: true, w: 1.25, wv: 0.45, breaks: 0.16, seed: 740, alpha: 0.8 });
    // cintas atadas a la cintura
    Paint.wash(g, [[-17, -2], [17, -2], [17, 4], [-17, 4]], COL.apron, { layers: 3, alpha: 0.6, amp: 0.2, seed: 741, edge: 0.3, core: 1 });
    void rng;
  }

  function paintShawl(g, back) {
    const rng = U.makeRng(back ? 751 : 752);
    const pts = back
      ? [[-8, -2], [-21, 2], [-25, 26], [-22, 58], [-14, 66], [-9, 40], [-6, 12]]
      : [[2, -4], [13, -4], [20, 4], [23, 22], [20, 52], [12, 64], [6, 58], [4, 30], [1, 10]];
    const poly = U.spline(pts, 3, true);
    Paint.wash(g, poly, COL.shawl, { layers: 6, alpha: 0.28, amp: 0.6, seed: back ? 753 : 754, edge: 0.25, core: 1, vary: COL.shawlLight, varyAmt: 0.45 });
    Paint.within(g, poly, () => {
      Paint.shade(g, back ? [[-30, -4], [-14, -4], [-16, 70], [-30, 70]] : [[0, -6], [9, -6], [9, 70], [0, 70]], COL.shawlShade, { layers: 4, alpha: 0.2, amp: 3, seed: 755, edge: 0 });
      // punto: uves pequeñas en hileras
      g.strokeStyle = U.rgba(COL.shawlShade, 0.6); g.lineWidth = 0.6;
      for (let y = 2; y < 64; y += 4.5) {
        for (let x = back ? -24 : 2; x < (back ? -6 : 22); x += 4) {
          g.beginPath(); g.moveTo(x, y); g.lineTo(x + 1.6, y + 2.2); g.lineTo(x + 3.2, y); g.stroke();
        }
      }
    });
    Paint.ink(g, poly, { closed: true, w: 1.3, wv: 0.45, breaks: 0.14, seed: back ? 756 : 757, alpha: 0.82 });
    // flecos
    if (!back) for (let i = 0; i < 6; i++) Paint.ink(g, [[8 + i * 2.2, 60 - i * 0.6], [8 + i * 2.4, 68 - i * 0.4]], { w: 0.8, alpha: 0.7, color: COL.shawlShade, seed: 758 + i });
    void rng;
  }

  function paintSleeve(g, lower, far) {
    const col = far ? U.mix(COL.dress, COL.dressShade, 0.5) : COL.dress;
    const poly = lower
      ? U.spline([[-8, -2], [8, -2], [9, 14], [9.5, 26], [0, 28], [-9.5, 26], [-9, 14]], 3, true)
      : U.spline([[-8, -6], [0, -8.5], [8, -6], [9, 14], [9, 33], [0, 35], [-9, 33], [-9, 14]], 3, true);
    if (lower) {
      const hand = U.spline([[-4.2, 25], [4.4, 25], [5.6, 31], [4.2, 37], [-0.4, 38.4], [-4.4, 35.4], [-5.2, 30]], 3, true);
      const skin = far ? U.mix(P.skin, P.skinShade, 0.45) : '#f2bf92';
      Paint.wash(g, hand, skin, { layers: 5, alpha: 0.3, amp: 0.3, seed: 761, edge: 0.25, core: 1 });
      Paint.within(g, hand, () => Paint.shade(g, [[-8, 22], [0, 22], [0, 42], [-8, 42]], P.skinShade, { layers: 3, alpha: 0.18, amp: 2, seed: 762, edge: 0 }));
      Paint.ink(g, hand, { closed: true, w: 1, alpha: 0.82, seed: 763, breaks: 0.1 });
      // puño de puntilla
      Paint.wash(g, [[-9, 22], [9, 22], [9.5, 27], [-9.5, 27]], '#f6efe0', { layers: 2, alpha: 0.75, amp: 0.2, seed: 764, edge: 0.3, core: 1 });
    }
    Paint.wash(g, poly, col, { layers: 6, alpha: 0.26, amp: 0.5, seed: lower ? 765 : 766, edge: 0.22, core: 1 });
    Paint.within(g, poly, () => Paint.shade(g, [[-16, -12], [-2, -12], [-2, 40], [-16, 40]], COL.dressShade, { layers: 4, alpha: 0.14, amp: 4, seed: 767, edge: 0 }));
    Paint.ink(g, poly, { closed: true, w: 1.2, wv: 0.45, breaks: 0.12, seed: lower ? 768 : 769, alpha: 0.85 });
  }

  // Cabeza: cara redonda con arruguitas alegres, nariz pequeña, orejas; el moño va aparte.
  function paintHead(g) {
    const rng = U.makeRng(781);
    const face = U.spline([[4, -42], [13, -40], [19, -33], [21, -24], [20.5, -15], [17, -7], [10, -2.5], [2, -2], [-5, -5], [-10, -12],
      [-12.5, -22], [-11.5, -32], [-6, -39]], 3, true);
    const neck = U.spline([[-5, -7], [8, -7], [8.5, 3], [-5.5, 3]], 2, true);
    Paint.wash(g, neck, U.mix('#f2bf92', P.skinShade, 0.45), { layers: 5, alpha: 0.3, amp: 0.4, seed: 782, edge: 0.3, core: 1 });
    Paint.wash(g, face, '#f2bf92', { layers: 7, alpha: 0.22, amp: 0.45, seed: 783, edge: 0.18, core: 1, vary: P.skinLight, varyAmt: 0.4 });
    const ear = U.spline([[-9.5, -25], [-14, -24.6], [-15.2, -20], [-13.4, -15.6], [-10, -15.6]], 3, true);
    Paint.wash(g, ear, '#f2bf92', { layers: 5, alpha: 0.3, amp: 0.3, seed: 784, edge: 0.3, core: 1 });
    Paint.ink(g, ear, { closed: true, w: 1, alpha: 0.8, seed: 785, breaks: 0.1 });
    Paint.within(g, face, () => {
      Paint.shade(g, [[-18, -46], [-3, -46], [-5, -24], [-2, 2], [-20, 2]], P.skinShade, { layers: 6, alpha: 0.1, amp: 4, seed: 786, edge: 0 });
      Paint.wash(g, U.blobPoly(12, -32, 6, 5, 10, rng, 0.25), P.skinLight, { layers: 4, alpha: 0.3, amp: 1, seed: 787, edge: 0 });
      Paint.softBlob(g, 1, -16, 5.6, P.blush, 0.36);
      Paint.softBlob(g, 18, -17, 3.2, P.blush, 0.26);
    });
    Paint.ink(g, [[12.5, -24], [14.6, -19.5], [12.6, -17.8], [15.2, -18]], { w: 0.9, alpha: 0.72, seed: 788, taper: 0.3 });
    // arruguitas: patas de gallo y surco de la sonrisa (finas, cálidas)
    for (const [x, y, a] of [[-1.2, -25.5, 0.5], [-1.4, -23.6, -0.1], [20, -26, -0.4]]) Paint.ink(g, [[x, y], [x - Math.cos(a) * 3, y + Math.sin(a) * 2]], { w: 0.55, alpha: 0.45, seed: 789 + x, color: P.inkSoft, taper: 0.4 });
    Paint.ink(g, [[8, -13], [6.6, -10], [7.8, -7.4]], { w: 0.6, alpha: 0.4, seed: 791, color: P.inkSoft, taper: 0.4 });
    Paint.ink(g, face, { closed: true, w: 1.3, wv: 0.45, breaks: 0.08, sketch: 0.35, seed: 792, alpha: 0.86, bleed: 0.5 });
  }

  // Pelo gris peinado hacia atrás y recogido en un moño, con una horquilla.
  function paintHair(g) {
    const rng = U.makeRng(801);
    const cap = U.spline([[-12, -24], [-12, -34], [-6, -42], [4, -45.5], [14, -43], [20, -35], [21, -28], [17, -33], [11, -38], [3, -39], [-4, -35], [-8, -28]], 3, true);
    Paint.wash(g, cap, COL.hair, { layers: 6, alpha: 0.28, amp: 0.6, seed: 802, edge: 0.22, core: 1, vary: COL.hairLight, varyAmt: 0.45 });
    Paint.within(g, cap, () => {
      Paint.shade(g, U.blobPoly(-8, -30, 8, 10, 10, rng, 0.2), COL.hairShade, { layers: 4, alpha: 0.22, amp: 2, seed: 803, edge: 0 });
      g.lineCap = 'round';
      for (let i = 0; i < 26; i++) {
        const a = rng.range(-Math.PI * 0.95, -Math.PI * 0.1);
        g.strokeStyle = rng.pick([COL.hairShade, COL.hairLight, COL.hair]); g.globalAlpha = rng.range(0.5, 0.85); g.lineWidth = rng.range(0.6, 1.1);
        g.beginPath(); g.moveTo(4 + Math.cos(a) * 16, -26 + Math.sin(a) * 18); g.quadraticCurveTo(0, -40, -10, -34 + rng.range(-3, 3)); g.stroke();
      }
      g.globalAlpha = 1;
    });
    Paint.ink(g, cap, { closed: true, w: 1.15, alpha: 0.72, seed: 804, breaks: 0.2, sketch: 0.3 });
    // moño
    const bun = U.blobPoly(-14, -38, 9.5, 8.5, 12, rng, 0.12);
    Paint.wash(g, bun, COL.hair, { layers: 5, alpha: 0.32, amp: 0.4, seed: 805, edge: 0.25, core: 1, vary: COL.hairShade, varyAmt: 0.4 });
    Paint.within(g, bun, () => {
      g.strokeStyle = U.rgba(COL.hairShade, 0.7); g.lineWidth = 0.7;
      for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(-14, -38, 7 - k * 1.5, 6 - k * 1.3, 0.4 * k, 0.3, 4.6); g.stroke(); }
    });
    Paint.ink(g, bun, { closed: true, w: 1.1, alpha: 0.75, seed: 806, breaks: 0.15 });
    Paint.ink(g, [[-20, -44], [-8, -34]], { w: 1.3, alpha: 0.8, color: '#7a5a34', seed: 807 });
    // dos mechones sueltos
    for (const [x, y] of [[-8, -28], [18, -30]]) Paint.ink(g, [[x, y], [x - 1.4, y + 4], [x + 0.6, y + 8]], { w: 0.6, alpha: 0.6, seed: 808 + x, color: COL.hairShade, taper: 0.4 });
  }

  function paintShoe(g, far) {
    const poly = U.spline([[-5, -5], [5, -5], [7, 0], [12, 3], [13, 7], [-6, 7], [-6.5, 2]], 3, true);
    Paint.wash(g, poly, far ? U.mix(COL.shoe, '#2e1f14', 0.4) : COL.shoe, { layers: 5, alpha: 0.45, amp: 0.3, seed: far ? 811 : 812, edge: 0.3, core: 1 });
    Paint.wash(g, [[2, -4], [7, -1], [11, 3], [5, 1]], '#9a7050', { layers: 2, alpha: 0.4, amp: 0.2, seed: 813, edge: 0 });
    Paint.ink(g, poly, { closed: true, w: 1, alpha: 0.85, seed: far ? 814 : 815, breaks: 0.1 });
  }

  // Regadera de cinc (asa arriba, pitorro largo con alcachofa).
  function paintCan(g) {
    const body = U.spline([[-12, 0], [-13, -20], [-10, -24], [10, -24], [13, -20], [12, 0]], 2, true);
    Paint.wash(g, [[10, -18], [30, -36], [33, -33], [12, -12]], COL.canShade, { layers: 3, alpha: 0.85, amp: 0.2, seed: 821, edge: 0.3, core: 1 });
    Paint.wash(g, U.blobPoly(32, -35, 4.2, 3, 8, U.makeRng(822), 0.1), COL.canShade, { layers: 2, alpha: 0.9, amp: 0.2, seed: 823, edge: 0.3, core: 1 });
    Paint.wash(g, body, COL.can, { layers: 5, alpha: 0.4, amp: 0.4, seed: 824, edge: 0.3, core: 1, vary: COL.canLight, varyAmt: 0.4 });
    Paint.within(g, body, () => {
      Paint.wash(g, [[2, -24], [12, -24], [12, 0], [4, 0]], COL.canLight, { layers: 2, alpha: 0.4, amp: 0.3, seed: 825, edge: 0 });
      Paint.ink(g, [[-12, -8], [12, -8]], { w: 0.8, alpha: 0.5, seed: 826, color: COL.canShade });
    });
    Paint.ink(g, body, { closed: true, w: 1.1, alpha: 0.8, seed: 827, breaks: 0.15 });
    g.strokeStyle = U.rgba(COL.canShade, 0.95); g.lineWidth = 2.4;
    g.beginPath(); g.ellipse(-2, -26, 10, 9, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
  }

  function build() {
    if (built) return;
    Paint.withInk(1.3, () => {
      const mk = (w, h, ox, oy, fn) => Paint.makeSprite({ w, h, ox, oy, res: RES, post: POST }, fn);
      S.dress = mk(80, 176, 40, 8, paintDress);
      S.apron = mk(50, 92, 24, 6, paintApron);
      S.shawlF = mk(30, 78, 2, 8, (g) => paintShawl(g, false));
      S.shawlB = mk(34, 76, 30, 6, (g) => paintShawl(g, true));
      S.upperN = mk(22, 46, 11, 10, (g) => paintSleeve(g, false, false));
      S.upperF = mk(22, 46, 11, 10, (g) => paintSleeve(g, false, true));
      S.foreN = mk(24, 44, 12, 4, (g) => paintSleeve(g, true, false));
      S.foreF = mk(24, 44, 12, 4, (g) => paintSleeve(g, true, true));
      S.head = mk(40, 52, 14, 46, paintHead);
      S.hair = mk(50, 34, 26, 50, paintHair);
      S.shoeN = mk(22, 16, 7, 6, (g) => paintShoe(g, false));
      S.shoeF = mk(22, 16, 7, 6, (g) => paintShoe(g, true));
      S.can = mk(52, 44, 16, 32, paintCan);
    });
    built = true;
  }

  function create(x, y) {
    return {
      x, y, vx: 0, facing: -1, alpha: 1, anim: 'idle', animT: 0, t: Math.random() * 5, phase: 0, speed: 0,
      blinkT: 2, blink: 0, talking: false, talkT: 0, pose: null, sway: 0, can: false, pour: 0, drops: [],
    };
  }

  function setAnim(s, a) { if (s.anim !== a) { s.anim = a; s.animT = 0; } }

  function update(s, dt) {
    s.t += dt;
    s.animT += dt;
    s.blinkT -= dt;
    if (s.blinkT <= 0) { s.blink = 0.15; s.blinkT = 2 + Math.random() * 4; }
    s.blink = Math.max(0, s.blink - dt);
    if (s.talking) s.talkT += dt;
    const br = Math.sin(s.t * U.TAU * 0.28);
    const ps = {
      bodyY: 0, breath: 1 + br * 0.01, head: Math.sin(s.t * 0.5) * 0.03 + 0.04, lean: 0.06,
      feet: [{ x: 6, y: -6, rot: 0 }, { x: -6, y: -6, rot: 0 }],
      // manos juntas sobre el delantal
      arms: [{ fwd: 0.42, el: 1.15 }, { fwd: 0.3, el: 1.25 }],
      mouth: s.talking ? (Math.sin(s.talkT * 10) > 0.1 ? 'open' : 'smile') : 'smile',
    };
    const a = s.anim, k = (d) => U.smoothstep(0, d, s.animT);
    if (a === 'walk') {
      const L = 30, beta = 0.64;
      s.phase = (s.phase + (beta * Math.max(s.speed, 16) / L) * dt) % 1;
      for (let i = 0; i < 2; i++) {
        const f = Rig.footCycle(s.phase + i * 0.5, L, beta, 4);
        ps.feet[i] = { x: f.x + 2, y: -6 + f.y, rot: f.rot * 0.5 };
      }
      const ph = s.phase * U.TAU;
      ps.bodyY = -Math.abs(Math.cos(ph)) * 1.6;
      ps.arms[0] = { fwd: -Math.sin(ph) * 0.16 + 0.12, el: 0.45 };
      ps.arms[1] = { fwd: Math.sin(ph) * 0.16 + 0.05, el: 0.4 };
      ps.lean = 0.09;
    } else if (a === 'water') {
      // riega: la regadera en la mano cercana, que se inclina a ratos
      const kk = k(0.6);
      const tilt = 0.5 + 0.5 * Math.sin(s.animT * 1.3);
      ps.arms[0] = { fwd: U.lerp(0.42, 0.95, kk), el: U.lerp(1.15, 0.55, kk) + tilt * 0.2 * kk };
      ps.head = 0.16 * kk;
      ps.lean = 0.12;
      s.pour = kk * tilt;
    } else if (a === 'wave') {
      const kk = k(0.3) * (1 - U.smoothstep(1.4, 1.8, s.animT));
      ps.arms[0] = { fwd: U.lerp(0.42, 2.25, kk), el: U.lerp(1.15, 0.4 + Math.sin(s.animT * 8) * 0.35, kk) };
      ps.head = -0.04 * kk;
    } else if (a === 'look') {
      // se hace visera con la mano y mira hacia la colina
      const kk = k(0.5) * (1 - U.smoothstep(2.6, 3, s.animT));
      ps.arms[0] = { fwd: U.lerp(0.42, 2.45, kk), el: U.lerp(1.15, 1.9, kk) };
      ps.head = -0.12 * kk;
      ps.lean = U.lerp(0.06, 0, kk);
    } else if (a === 'back') {
      // se lleva las manos a los riñones y se estira despacio
      const kk = k(0.7) * (1 - U.smoothstep(2.2, 2.7, s.animT));
      ps.arms[0] = { fwd: U.lerp(0.42, -0.5, kk), el: U.lerp(1.15, 1.4, kk) };
      ps.arms[1] = { fwd: U.lerp(0.3, -0.55, kk), el: U.lerp(1.25, 1.4, kk) };
      ps.lean = U.lerp(0.06, -0.1, kk);
      ps.head = U.lerp(0.04, -0.1, kk);
    } else if (a === 'talk') {
      const kk = k(0.4);
      ps.arms[0] = { fwd: U.lerp(0.42, 0.7, kk) + Math.sin(s.animT * 2.4) * 0.1, el: U.lerp(1.15, 1.35, kk) + Math.sin(s.animT * 3.1) * 0.15 };
      ps.head = Math.sin(s.animT * 2.6) * 0.05;
    }
    if (a !== 'water') s.pour = Math.max(0, s.pour - dt * 3);
    // gotas de la regadera
    if (s.pour > 0.35 && Math.random() < dt * 30) s.drops.push({ x: 0, y: 0, vx: s.facing * (40 + Math.random() * 30), vy: 20 + Math.random() * 30, t: 0, init: true });
    for (let i = s.drops.length - 1; i >= 0; i--) {
      const d = s.drops[i];
      d.t += dt; d.vy += 600 * dt; d.x += d.vx * dt; d.y += d.vy * dt;
      if (d.y > s.y || d.t > 1) s.drops.splice(i, 1);
    }
    s.sway = U.damp(s.sway, U.clamp((s.wind || 0) * 0.008, -0.05, 0.05), 3, dt);
    s.pose = ps;
  }

  function drawArm(ctx, sx, sy, fwd, el, up, fore) {
    Rig.part(ctx, up, sx, sy, -fwd);
    const ex = sx + Math.sin(fwd) * M.upper, ey = sy + Math.cos(fwd) * M.upper;
    Rig.part(ctx, fore, ex, ey, -(fwd + el));
    return [ex + Math.sin(fwd + el) * (M.fore + 6), ey + Math.cos(fwd + el) * (M.fore + 6), fwd + el];
  }

  function drawFace(ctx, s, ps) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = P.eye; ctx.fillStyle = P.eye; ctx.lineWidth = 1.1;
    for (const [x, y, r] of [[3.4, -23.5, 1.7], [14.6, -24, 1.5]]) {
      if (s.blink > 0 || s.anim === 'back') { ctx.beginPath(); ctx.arc(x, y - 1, r * 1.3, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); }
      else { ctx.beginPath(); ctx.ellipse(x, y, r, r * 1.25, 0, 0, U.TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,250,240,0.85)'; ctx.beginPath(); ctx.arc(x + r * 0.35, y - r * 0.4, 0.5, 0, U.TAU); ctx.fill(); ctx.fillStyle = P.eye; }
    }
    // cejas finas grises
    ctx.strokeStyle = COL.hairShade; ctx.lineWidth = 1; ctx.globalAlpha = 0.85;
    for (const [x, w] of [[3.4, 2.8], [14.6, 2.2]]) { ctx.beginPath(); ctx.moveTo(x - w, -29); ctx.quadraticCurveTo(x, -30.6, x + w, -29.4); ctx.stroke(); }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = U.mix(P.mouth, P.ink, 0.4); ctx.lineWidth = 1;
    const mx = 11.5, my = -10.6;
    ctx.beginPath();
    if (ps.mouth === 'open') {
      ctx.fillStyle = U.rgba(P.mouth, 0.85);
      ctx.moveTo(mx - 3, my - 0.6); ctx.quadraticCurveTo(mx, my + 3.2, mx + 3, my - 0.6); ctx.closePath(); ctx.fill();
    } else { ctx.moveTo(mx - 3.4, my - 1); ctx.quadraticCurveTo(mx, my + 2.2, mx + 3, my - 1); ctx.stroke(); }
  }

  const BOX = [-70, -250, 80, 20];

  function draw(ctx, s) {
    const ps = s.pose;
    if (!ps || s.alpha <= 0.004) return;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.scale(s.facing, 1);
    Rig.faded(ctx, s.alpha, BOX, (c) => drawBody(c, s, ps));
    ctx.restore();
    // gotas (en el mundo)
    if (s.drops.length) {
      ctx.save();
      ctx.fillStyle = U.rgba('#d8e6ea', 0.85);
      for (const d of s.drops) {
        if (d.init && s.spout) { d.x = s.spout[0]; d.y = s.spout[1]; d.init = false; }
        ctx.beginPath(); ctx.ellipse(d.x, d.y, 1.3, 2.4, 0, 0, U.TAU); ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawBody(ctx, s, ps) {
    const lean = ps.lean;
    const nx = M.neck[0] + lean * 30, ny = M.neck[1] + ps.bodyY + lean * 4;
    const shN = [M.sh[0][0] + lean * 30, M.sh[0][1] + ps.bodyY + lean * 4], shF = [M.sh[1][0] + lean * 30, M.sh[1][1] + ps.bodyY + lean * 4];
    Rig.part(ctx, S.shoeF, ps.feet[1].x, ps.feet[1].y, ps.feet[1].rot);
    Rig.part(ctx, S.shoeN, ps.feet[0].x, ps.feet[0].y, ps.feet[0].rot);
    drawArm(ctx, shF[0], shF[1], ps.arms[1].fwd, ps.arms[1].el, S.upperF, S.foreF);
    // el vestido cuelga del cuello; la espalda encorvada inclina el cuerpo hacia delante
    const xf = () => { ctx.translate(nx, ny); ctx.transform(1, 0, -lean * 0.9 + s.sway, 1, 0, 0); ctx.scale(1, ps.breath * (166 - ps.bodyY - lean * 4) / 166); };
    ctx.save(); xf(); Rig.part(ctx, S.shawlB, 0, 0); ctx.restore();
    ctx.save(); xf(); Rig.part(ctx, S.dress, 0, 0); Rig.part(ctx, S.apron, 2, 62); Rig.part(ctx, S.shawlF, 0, 0); ctx.restore();
    // cabeza
    ctx.save();
    ctx.translate(nx, ny);
    ctx.rotate(ps.head + lean * 0.5);
    Rig.part(ctx, S.head, 0, 0);
    drawFace(ctx, s, ps);
    Rig.part(ctx, S.hair, 0, 0);
    ctx.restore();
    // brazo cercano (con la regadera cuando riega)
    const [hx, hy, ang] = drawArm(ctx, shN[0], shN[1], ps.arms[0].fwd, ps.arms[0].el, S.upperN, S.foreN);
    if (s.can) {
      ctx.save();
      ctx.translate(hx, hy + 4);
      const tilt = 0.2 + s.pour * 0.55;
      ctx.rotate(tilt);
      Rig.part(ctx, S.can, 0, 0);
      ctx.restore();
      // punta de la alcachofa en el mundo, para las gotas
      const tx = hx + Math.cos(tilt) * 32 + Math.sin(tilt) * 35, ty = hy + 4 + Math.sin(tilt) * 32 - Math.cos(tilt) * 35;
      s.spout = [s.x + tx * s.facing, s.y + ty];
    }
    void ang;
  }

  JHS.Ester = { M, S, build, create, update, draw, setAnim, COL };
})(window.JHS = window.JHS || {});
