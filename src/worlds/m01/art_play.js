/* Mundo 1 — capas 2 y 3 de la ficha (suelo jugable de piedra y césped, el puente y las patas de
   los objetos con contacto legible; arbustos, cerca y acequia por detrás de los personajes) y la
   capa 1 (flores y hierbas cercanas, solo en las esquinas). El borde superior del suelo y el
   puente mantienen una línea clara; la textura del camino es de baja frecuencia (detrás de pies
   y pezuñas no hay ruido). */
(function (JHS) {
  'use strict';
  const U = JHS.U, Paint = JHS.Paint, P = JHS.Palette, Props = JHS.Props;
  const Art = JHS.M01Art;
  const C = Art.C;
  const POST = { edge: 0.3, grain: 0.22, density: 0.08 };
  const kit = () => JHS.Scenery.kit;

  // ------------------------------------------------------------------ farol de vidrio y campana
  // La silueta común de todos los faroles interactivos (y del de la casa): gancho, sombrerete de
  // hierro, cuerpo de vidrio con dos montantes, base y una campanita colgando debajo.
  Art.drawLanternShape = function (g, x, y, s, lit, o = {}) {
    g.save();
    g.translate(x, y);
    g.scale(s, s);
    const ink = '#3a2a1f';
    Paint.ink(g, [[0, -4], [0, 4]], { w: 1.6, alpha: 0.85, color: ink, seed: 4001 });
    g.strokeStyle = ink; g.lineWidth = 1.4; g.globalAlpha = 0.85;
    g.beginPath(); g.arc(0, -6, 3, 0, U.TAU); g.stroke(); g.globalAlpha = 1;
    // sombrerete
    Paint.wash(g, [[-13, 14], [0, 4], [13, 14], [11, 17], [-11, 17]], '#4b3f36', { layers: 2, alpha: 0.95, amp: 0.2, seed: 4002, edge: 0.3, core: 1 });
    // vidrio
    const glass = [[-10, 17], [10, 17], [8, 44], [-8, 44]];
    if (lit) {
      Paint.wash(g, glass, '#ffd884', { layers: 3, alpha: 0.95, amp: 0.2, seed: 4003, edge: 0.25, core: 1 });
      Paint.softBlob(g, 0, 31, 6, '#fff7dc', 0.95);
      g.fillStyle = '#f39a3a'; g.beginPath(); g.ellipse(0, 33, 1.8, 4, 0, 0, U.TAU); g.fill();
    } else {
      Paint.wash(g, glass, o.dirty ? '#8f948a' : '#aeb7b1', { layers: 3, alpha: 0.8, amp: 0.2, seed: 4004, edge: 0.3, core: 1 });
      Paint.wash(g, [[-9, 18], [-3, 18], [-5, 43], [-8, 43]], '#e8ece6', { layers: 2, alpha: 0.4, amp: 0.1, seed: 4005, edge: 0 });
      if (o.cracked) Paint.ink(g, [[3, 19], [-1, 27], [4, 32], [1, 40]], { w: 0.8, alpha: 0.7, color: ink, seed: 4006 });
    }
    for (const mx of [-4, 4]) Paint.ink(g, [[mx, 17], [mx * 0.85, 44]], { w: 0.9, alpha: 0.7, color: ink, seed: 4007 + mx });
    Paint.ink(g, glass, { closed: true, w: 1.3, alpha: 0.85, color: ink, seed: 4010 });
    Paint.wash(g, [[-10, 44], [10, 44], [8, 49], [-8, 49]], '#4b3f36', { layers: 2, alpha: 0.95, amp: 0.2, seed: 4011, edge: 0.3, core: 1 });
    // campana
    if (!o.noBell) {
      Paint.ink(g, [[0, 49], [0, 54]], { w: 1, alpha: 0.85, color: ink, seed: 4012 });
      const bell = U.spline([[-3, 54], [-4, 58], [-7, 63], [7, 63], [4, 58], [3, 54]], 3, true);
      Paint.wash(g, bell, '#c49446', { layers: 2, alpha: 0.95, amp: 0.15, seed: 4013, edge: 0.35, core: 1 });
      Paint.wash(g, [[1, 55], [3, 55], [5, 62], [2, 62]], '#f2d28e', { layers: 1, alpha: 0.6, amp: 0.1, seed: 4014, edge: 0 });
      Paint.ink(g, bell, { closed: true, w: 0.9, alpha: 0.8, color: ink, seed: 4015 });
      g.fillStyle = ink; g.beginPath(); g.arc(0, 64.5, 1.3, 0, U.TAU); g.fill();
    }
    g.restore();
  };

  // Estación de ruta: poste de madera con brazo; el farol cuelga aparte (se balancea y se dibuja
  // en su estado). Contacto legible: el poste se clava en el suelo con piedras al pie.
  Art.stationPost = function () {
    return Paint.makeSprite({ w: 120, h: 210, ox: 40, oy: 196, res: 1.6, post: POST }, (g) => {
      const rng = U.makeRng(4101);
      Paint.shade(g, U.blobPoly(4, 2, 26, 5, 10, rng, 0.2), '#5a4430', { layers: 3, alpha: 0.3, amp: 1, seed: 4102, edge: 0 });
      const post = [[-6, 4], [-5, -170], [6, -172], [7, 4]];
      Paint.wash(g, post, C.wood, { layers: 4, alpha: 0.75, amp: 0.4, seed: 4103, edge: 0.3, core: 1, vary: C.woodShade, varyAmt: 0.5 });
      Paint.within(g, post, () => {
        Paint.shade(g, [[-6, 4], [-1, 4], [-1, -172], [-6, -172]], C.woodShade, { layers: 2, alpha: 0.35, amp: 0.3, seed: 4104, edge: 0 });
        for (let i = 0; i < 6; i++) Paint.ink(g, [[rng.range(-4, 4), -rng.range(10, 160)], [rng.range(-4, 4), -rng.range(10, 160)]], { w: 0.6, alpha: 0.35, seed: 4105 + i, color: C.woodShade });
      });
      Paint.ink(g, post, { closed: true, w: 1.3, alpha: 0.7, seed: 4112, breaks: 0.2 });
      // brazo con escuadra
      Paint.wash(g, [[0, -168], [52, -166], [52, -158], [0, -158]], C.woodShade, { layers: 3, alpha: 0.85, amp: 0.3, seed: 4113, edge: 0.3, core: 1 });
      Paint.ink(g, [[4, -132], [30, -160]], { w: 3, alpha: 0.75, color: C.woodShade, seed: 4114 });
      Paint.ink(g, [[0, -168], [52, -166]], { w: 1, alpha: 0.6, seed: 4115 });
      // piedras al pie
      for (const [px, r] of [[-14, 7], [12, 6], [0, 5]]) Paint.wash(g, U.blobPoly(px, 0, r, r * 0.6, 8, rng, 0.25), rng.pick(['#bdb0a0', '#a89a8a']), { layers: 2, alpha: 0.85, amp: 0.3, seed: 4120 + px, edge: 0.35, core: 1 });
      kit().grassFringe(g, [[-24, 2], [24, 2]], U.makeRng(4130), 0.9);
    });
  };
  Art.lanternSprite = function (lit, cracked) {
    return Paint.makeSprite({ w: 40, h: 80, ox: 20, oy: 10, res: 2.2 }, (g) => Art.drawLanternShape(g, 0, 0, 1, lit, { cracked, dirty: !lit }));
  };

  // ------------------------------------------------------------------ piezas del plano jugable
  // Elementos anclados a una rejilla del mundo: cada celda tiene su propia semilla, así un tramo
  // y su vecino pintan exactamente lo mismo donde se solapan (no hay costuras entre tramos).
  function cells(xa, xb, size, salt, fn) {
    const i0 = Math.floor(xa / size) - 1, i1 = Math.ceil(xb / size) + 1;
    for (let i = i0; i <= i1; i++) fn(U.makeRng((Math.imul(i, 7919) ^ Math.imul(salt, 104729)) >>> 0), i * size, i);
  }
  Art.cells = cells;

  // Trazo continuo anclado al mundo, partido en tramos fijos (mismo dibujo en piezas vecinas).
  function worldInk(g, fy, xa, xb, lim0, lim1, o, salt) {
    const T = 240;
    for (let t0 = Math.floor((xa - 30) / T) * T; t0 < xb + 30; t0 += T) {
      const a = Math.max(t0 - 3, lim0), b = Math.min(t0 + T + 3, lim1);
      if (b - a < 6) continue;
      const pts = [];
      for (let x = a; x < b; x += 6) pts.push([x, fy(x)]);
      pts.push([b, fy(b)]);
      Paint.ink(g, pts, Object.assign({ taper: 0, seed: salt + Math.round(t0 / T) * 31 }, o));
    }
  }

  // Briznas a lo largo de un borde (celdas de 4,5 u: deterministas en el mundo).
  function fringe(g, fy, xa, xb, lim0, lim1, density, salt, cols, hk = 1) {
    g.lineCap = 'round';
    cells(Math.max(xa, lim0), Math.min(xb, lim1), 4.5, salt, (r, cx) => {
      const x = cx + r.range(0, 4.5);
      if (x < lim0 || x > lim1 || !r.chance(density)) return;
      const y = fy(x);
      const h = r.range(4, 14) * (r.chance(0.12) ? 1.8 : 1) * hk;
      const lean = r.range(-0.5, 0.6);
      g.strokeStyle = r.pick(cols);
      g.globalAlpha = r.range(0.6, 0.95);
      g.lineWidth = r.range(1, 2.2);
      g.beginPath(); g.moveTo(x, y + 2); g.quadraticCurveTo(x + lean * h * 0.3, y - h * 0.6, x + lean * h, y - h); g.stroke();
    });
    g.globalAlpha = 1;
  }
  const GRASS = ['#6d5a26', '#8a7436', '#a68a45', '#5a4a1e', '#9a9454', '#b39350'];
  const GRASS_LIT = ['#b39350', '#c9a45a', '#a68a45', '#d8b665', '#8a7436', '#e0bd6a'];

  // Roca redonda del valle (concepto): pardo grisácea cálida, luz de miel arriba, base oscura,
  // granito fino, musgo oliva y contorno de tinta parda.
  function boulder(g, x, base, rx, ry, rng, seed, o = {}) {
    const poly = Props.smoothBlob(x, base - ry * 0.85, rx, ry, 11, rng, 0.14, 0.55);
    Paint.shade(g, U.blobPoly(x + rx * 0.12, base + 1, rx * 1.12, ry * 0.2, 12, rng, 0.1), '#3e2a12', { layers: 3, alpha: 0.32, amp: 2, seed: seed + 1, edge: 0 });
    Paint.wash(g, poly, rng.pick(['#9a7d58', '#8d704a', '#a08463', '#94785a']), { layers: 4, alpha: 0.62, amp: 1, seed, edge: 0.3, core: 1, vary: '#b39466', varyAmt: 0.45 });
    Paint.within(g, poly, () => {
      Paint.wash(g, U.blobPoly(x + rx * 0.22, base - ry * 1.32, rx * 0.72, ry * 0.42, 10, rng, 0.25), '#e9c88e', { layers: 3, alpha: 0.5, amp: 2, seed: seed + 2, edge: 0 });
      Paint.shade(g, U.blobPoly(x - rx * 0.38, base - ry * 0.28, rx * 0.85, ry * 0.58, 10, rng, 0.25), '#5c4126', { layers: 3, alpha: 0.32, amp: 2, seed: seed + 3, edge: 0 });
      Paint.splatter(g, x, base - ry * 0.85, rx, ry * 0.85, rx * ry / 16, '#4a3420', { alpha: 0.32, rmin: 0.4, rmax: 1.1, seed: seed + 4 });
      Paint.splatter(g, x, base - ry * 0.85, rx, ry * 0.85, rx * ry / 22, '#f6dfae', { alpha: 0.45, rmin: 0.4, rmax: 1.1, seed: seed + 5 });
      if (o.moss !== false && rng.chance(0.65)) Paint.wash(g, U.blobPoly(x + rng.range(-rx * 0.4, rx * 0.3), base - ry * 1.5, rx * rng.range(0.3, 0.5), ry * 0.16, 9, rng, 0.35), rng.pick(['#8b7a3c', '#9a8a48', '#7a6c34']), { layers: 2, alpha: 0.5, amp: 1, seed: seed + 6, edge: 0.1 });
      if (o.wet) Paint.shade(g, [[x - rx * 1.2, base - ry * 0.35], [x + rx * 1.2, base - ry * 0.35], [x + rx * 1.2, base + 2], [x - rx * 1.2, base + 2]], '#4b4a42', { layers: 2, alpha: 0.35, amp: 2, seed: seed + 8, edge: 0 });
    });
    Paint.ink(g, poly, { closed: true, w: 1.5, alpha: 0.62, color: '#4a3220', seed: seed + 7, breaks: 0.25, sketch: 0.3 });
  }
  Art.boulder = boulder;

  // Flor silvestre de la ladera; `s` crece con la cercanía (lo de abajo está más cerca).
  function wildFlower(g, fx, fy, kind, s, rng, seed) {
    Paint.ink(g, [[fx, fy + 10 * s], [fx + rng.range(-2, 2) * s, fy]], { w: 0.9 * s, alpha: 0.7, color: '#5a5222', seed });
    if (kind === 'daisy') {
      const n = 10;
      for (let k = 0; k < n; k++) {
        const a = k / n * U.TAU + rng.range(-0.1, 0.1);
        g.fillStyle = U.rgba('#fffaf0', 0.95);
        g.beginPath(); g.ellipse(fx + Math.cos(a) * 3.4 * s, fy + Math.sin(a) * 2.2 * s, 2.7 * s, 1.1 * s, a, 0, U.TAU); g.fill();
      }
      g.fillStyle = '#e7a92c'; g.beginPath(); g.arc(fx, fy, 1.6 * s, 0, U.TAU); g.fill();
    } else {
      const col = kind === 'pink' ? '#e39fb1' : kind === 'lilac' ? '#b4a0cb' : rng.pick(['#f3c232', '#f6cf45', '#eeb424']);
      const n = kind === 'yellow' ? 7 : 6;
      for (let k = 0; k < n; k++) {
        const a = k / n * U.TAU;
        g.fillStyle = U.rgba(col, 0.92);
        g.beginPath(); g.ellipse(fx + Math.cos(a) * 2.3 * s, fy + Math.sin(a) * 1.6 * s, 2.1 * s, 1.4 * s, a, 0, U.TAU); g.fill();
      }
      g.fillStyle = U.rgba(kind === 'yellow' ? '#9a5a14' : '#8a5a2a', 0.85); g.beginPath(); g.arc(fx, fy, 1 * s, 0, U.TAU); g.fill();
    }
  }
  Art.wildFlower = wildFlower;

  // Mata de hierba: unas pinceladas curvas desde la base.
  function tuft(g, x, y, h, rng, cols = GRASS) {
    const n = rng.int(5, 9);
    g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const lean = rng.range(-0.55, 0.55), hh = h * rng.range(0.55, 1.1);
      g.strokeStyle = rng.pick(cols);
      g.globalAlpha = rng.range(0.5, 0.85);
      g.lineWidth = rng.range(1, 2.2) * U.clamp(h / 16, 1, 1.7);
      const bx = x + rng.range(-h * 0.3, h * 0.3);
      g.beginPath(); g.moveTo(bx, y); g.quadraticCurveTo(bx + lean * hh * 0.25, y - hh * 0.6, bx + lean * hh, y - hh); g.stroke();
    }
    g.globalAlpha = 1;
  }
  Art.tuft = tuft;

  function bush(g, x, y, r, rng, seed, kind) {
    const cols = kind === 'broom' ? [C.leaf, C.leafDeep, '#8c7d3e', C.leafMid] : kind === 'lavender' ? ['#7d7c58', '#625f44', '#9a9670'] : [C.leaf, C.leafDeep, C.leafLit, C.leafMid];
    Paint.shade(g, U.blobPoly(x, y + 2, r * 1.1, r * 0.2, 10, rng, 0.2), '#3e2f14', { layers: 2, alpha: 0.28, amp: 1, seed: seed + 1, edge: 0 });
    Art.leafMass(g, x, y - r * 0.55, r, r * 0.55, rng, Math.round(r * 1.6), cols, seed);
    if (kind === 'broom') for (let i = 0; i < r * 1.2; i++) Paint.softBlob(g, x + rng.range(-r, r), y - r * 0.55 + rng.range(-r * 0.5, r * 0.4), rng.range(1.6, 2.6), '#f4c83f', 0.9);
    if (kind === 'lavender') for (let i = 0; i < r * 0.8; i++) { const fx = x + rng.range(-r, r), fy = y - r * 0.8 + rng.range(-r * 0.3, r * 0.3); Paint.ink(g, [[fx, fy + 6], [fx, fy - 4]], { w: 2.2, alpha: 0.75, color: '#a493c4', seed: seed + 50 + i }); }
  }
  Art.bush = bush;

  // Cerca de troncos: postes en posiciones fijas del mundo (cada 62 u) y dos travesaños.
  function fence(g, fa, fb, xa, xb, gyF, seed) {
    const posts = [];
    for (let x = fa; x <= fb; x += 62) {
      const r = U.makeRng(seed + Math.round(x));
      posts.push([x + r.range(-4, 4), r]);
    }
    const top = (x) => gyF(x) - 52, mid = (x) => gyF(x) - 30;
    for (let k = 0; k < posts.length - 1; k++) {
      const [a, ra] = posts[k], [b] = posts[k + 1];
      if (b < xa - 80 || a > xb + 80) continue;
      for (const [i, rail] of [[0, top], [1, mid]]) {
        const ya = rail(a) + ra.range(-1.5, 1.5), yb = rail(b) + ra.range(-1.5, 1.5);
        const poly = [[a, ya - 2.6], [b, yb - 2.6], [b, yb + 2.6], [a, ya + 2.6]];
        Paint.wash(g, poly, ra.pick(['#9a7a4c', '#8a6c42', '#a8875a']), { layers: 2, alpha: 0.88, amp: 0.3, seed: seed + i * 100 + k, edge: 0.3, core: 1 });
        Paint.ink(g, [[a, ya + 2.6], [b, yb + 2.6]], { w: 0.9, alpha: 0.5, seed: seed + 200 + i * 100 + k, color: C.woodShade });
      }
    }
    for (const [x, r] of posts) {
      if (x < xa - 20 || x > xb + 20) continue;
      const y = gyF(x);
      const poly = [[x - 3.6, y + 2], [x - 3, top(x) - 8], [x + 3.4, top(x) - 9], [x + 3.8, y + 2]];
      Paint.wash(g, poly, r.pick(['#8a6a40', '#7a5c36']), { layers: 3, alpha: 0.92, amp: 0.3, seed: seed + 400 + Math.round(x), edge: 0.3, core: 1 });
      Paint.ink(g, poly, { closed: true, w: 1, alpha: 0.62, seed: seed + 500 + Math.round(x), color: '#4a3220', breaks: 0.2 });
    }
  }

  function crate(g, x, base, w, h, rng, seed) {
    const poly = [[x, base], [x, base - h], [x + w, base - h], [x + w, base]];
    Paint.shade(g, [[x - 4, base - 2], [x + w + 8, base - 2], [x + w + 10, base + 4], [x - 6, base + 4]], '#4d3e30', { layers: 2, alpha: 0.3, amp: 1, seed: seed + 1, edge: 0 });
    Paint.wash(g, poly, '#a37b4c', { layers: 3, alpha: 0.8, amp: 0.3, seed, edge: 0.3, core: 1, vary: '#8a6338', varyAmt: 0.5 });
    Paint.within(g, poly, () => {
      for (let y = base - h + 10; y < base; y += 12) Paint.ink(g, [[x, y], [x + w, y]], { w: 0.8, alpha: 0.4, seed: seed + y, color: '#5b3d22' });
      Paint.ink(g, [[x + 4, base - 4], [x + w - 4, base - h + 4]], { w: 2.4, alpha: 0.55, seed: seed + 3, color: '#6b4b2c' });
      Paint.wash(g, [[x + w * 0.6, base - h], [x + w, base - h], [x + w, base], [x + w * 0.7, base]], '#e0b578', { layers: 2, alpha: 0.25, amp: 0.3, seed: seed + 4, edge: 0 });
    });
    Paint.ink(g, poly, { closed: true, w: 1.4, alpha: 0.7, seed: seed + 5, breaks: 0.15 });
  }

  function hayBale(g, x, base, w, h, rng, seed) {
    const poly = U.spline([[x, base], [x + 4, base - h * 0.75], [x + w * 0.3, base - h], [x + w * 0.7, base - h], [x + w - 4, base - h * 0.75], [x + w, base]], 3, true);
    Paint.shade(g, U.blobPoly(x + w / 2, base + 2, w * 0.62, 6, 10, rng, 0.2), '#4d3e30', { layers: 2, alpha: 0.3, amp: 1, seed: seed + 1, edge: 0 });
    Paint.wash(g, poly, '#d9b35e', { layers: 4, alpha: 0.7, amp: 0.6, seed, edge: 0.3, core: 1, vary: '#c2964a', varyAmt: 0.5 });
    Paint.within(g, poly, () => {
      Paint.shade(g, [[x, base - h * 0.4], [x + w, base - h * 0.45], [x + w, base], [x, base]], '#9c7536', { layers: 3, alpha: 0.3, amp: 2, seed: seed + 2, edge: 0 });
      g.lineCap = 'round';
      for (let i = 0; i < w * 1.6; i++) {
        const sx = x + rng.range(4, w - 4), sy = base - rng.range(4, h - 4);
        g.strokeStyle = rng.pick(['#f4d58a', '#b88d43', '#e8c46e']); g.globalAlpha = 0.6; g.lineWidth = 0.9;
        g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + rng.range(-6, 6), sy + rng.range(-3, 3)); g.stroke();
      }
      g.globalAlpha = 1;
      Paint.ink(g, [[x + 6, base - h * 0.5], [x + w - 6, base - h * 0.52]], { w: 1.4, alpha: 0.5, color: '#8a6a3a', seed: seed + 3 });
    });
    Paint.ink(g, poly, { closed: true, w: 1.3, alpha: 0.6, seed: seed + 4, breaks: 0.25 });
  }

  function dryWall(g, x, base, w, h, rng, seed) {
    kit().stoneWall(g, x, base - h, base, x + w, seed);
  }

  function menhir(g, x, base, w, h, rng, seed) {
    const poly = U.spline([[x, base], [x + 2, base - h * 0.6], [x + w * 0.25, base - h], [x + w * 0.7, base - h * 0.96], [x + w - 2, base - h * 0.55], [x + w, base]], 3, true);
    Paint.shade(g, U.blobPoly(x + w / 2 + 6, base + 2, w * 0.8, 6, 10, rng, 0.2), '#4d3e30', { layers: 2, alpha: 0.3, amp: 1, seed: seed + 1, edge: 0 });
    Paint.wash(g, poly, '#a59d93', { layers: 4, alpha: 0.7, amp: 0.6, seed, edge: 0.3, core: 1, vary: '#c4b9aa', varyAmt: 0.4 });
    Paint.within(g, poly, () => {
      Paint.wash(g, [[x + w * 0.5, base - h], [x + w, base - h], [x + w, base], [x + w * 0.6, base]], '#e2d5c0', { layers: 2, alpha: 0.35, amp: 1, seed: seed + 2, edge: 0 });
      Paint.splatter(g, x + w / 2, base - h / 2, w / 2, h / 2, w * h / 26, '#5f5850', { alpha: 0.3, rmin: 0.4, rmax: 1, seed: seed + 3 });
      for (let i = 0; i < 4; i++) Paint.wash(g, U.blobPoly(x + rng.range(4, w - 4), base - rng.range(10, h - 10), rng.range(4, 9), rng.range(3, 6), 8, rng, 0.3), rng.pick(['#c8c48a', '#9aa070', '#d9c88a']), { layers: 2, alpha: 0.5, amp: 0.3, seed: seed + 10 + i, edge: 0.2 });
    });
    Paint.ink(g, poly, { closed: true, w: 1.5, alpha: 0.6, seed: seed + 4, breaks: 0.25, sketch: 0.3 });
  }

  function woodshed(g, x0, x1, base, L, rng) {
    const roofY = L.ledges[0].y;
    // postes y tejadillo de tablas (una plataforma: su borde es una línea clara)
    for (const px of [x0 + 6, x1 - 12]) {
      Paint.wash(g, [[px, base + 2], [px, roofY + 4], [px + 8, roofY + 4], [px + 8, base + 2]], C.woodShade, { layers: 3, alpha: 0.85, amp: 0.3, seed: 4201 + px, edge: 0.3, core: 1 });
    }
    const roof = [[x0 - 8, roofY + 10], [x0 - 4, roofY - 2], [x1 + 6, roofY - 6], [x1 + 10, roofY + 6]];
    Paint.wash(g, roof, '#8e6c44', { layers: 3, alpha: 0.9, amp: 0.3, seed: 4203, edge: 0.3, core: 1, vary: '#a8814f', varyAmt: 0.4 });
    for (let x = x0; x < x1; x += 18) Paint.ink(g, [[x, roofY - 2], [x + 1, roofY + 8]], { w: 0.8, alpha: 0.45, seed: 4204 + x, color: '#4a3220' });
    Paint.ink(g, [[x0 - 4, roofY - 2], [x1 + 6, roofY - 6]], { w: 2, alpha: 0.85, seed: 4205, color: '#3c2a1e' });
    // leña apilada (la caja sólida del montón)
    const pile = L.rocks.find((r) => r.kind === 'shed');
    for (let row = 0; row < 5; row++) {
      for (let k = 0; k < 9; k++) {
        const cx = pile.x + 8 + k * 14 + (row % 2) * 7, cy = base - 7 - row * 12.5;
        if (cx > pile.x + pile.w - 6) continue;
        Paint.wash(g, U.blobPoly(cx, cy, 7, 6.2, 9, rng, 0.12), rng.pick(['#c89a62', '#b58650', '#d9ad73']), { layers: 2, alpha: 0.9, amp: 0.2, seed: 4210 + row * 20 + k, edge: 0.35, core: 1 });
        g.strokeStyle = U.rgba('#6b4b2c', 0.6); g.lineWidth = 0.6;
        g.beginPath(); g.arc(cx, cy, 3.2, 0, U.TAU); g.stroke();
      }
    }
  }

  function signpost(g, x, base, rng) {
    Paint.wash(g, [[x - 5, base + 2], [x - 4, base - 150], [x + 5, base - 152], [x + 6, base + 2]], C.wood, { layers: 3, alpha: 0.85, amp: 0.3, seed: 4301, edge: 0.3, core: 1, vary: C.woodShade, varyAmt: 0.4 });
    // dos tablas en flecha, sin texto (el texto se lee aparte, en la interfaz)
    for (const [dir, y] of [[-1, base - 138], [1, base - 108]]) {
      const bx = x + (dir < 0 ? -66 : 4), w = 62;
      const pts = dir < 0 ? [[bx + w, y], [bx + 12, y], [bx, y + 10], [bx + 12, y + 20], [bx + w, y + 20]] : [[bx, y], [bx + w - 12, y], [bx + w, y + 10], [bx + w - 12, y + 20], [bx, y + 20]];
      Paint.wash(g, pts, rng.pick(['#b38b58', '#a67d4b']), { layers: 3, alpha: 0.9, amp: 0.3, seed: 4302 + y, edge: 0.3, core: 1 });
      Paint.ink(g, pts, { closed: true, w: 1.2, alpha: 0.7, seed: 4303 + y, breaks: 0.2 });
      Paint.ink(g, [[bx + 8, y + 10], [bx + w - 8, y + 10]], { w: 0.7, alpha: 0.3, seed: 4304 + y, color: '#5b3d22' });
    }
    kit().grassFringe(g, [[x - 20, base + 1], [x + 20, base + 1]], U.makeRng(4305), 1);
  }

  // ------------------------------------------------------------------ suelo
  // Tramos de 1400 u que se solapan 120 u: cada tramo funde su borde izquierdo sobre el anterior
  // (que debajo está entero) y todo lo que pinta está anclado al mundo, así no hay costuras.
  Art.paintPlay = function (layer, L, life) {
    const BOTTOM = L.bottom;
    const BW = 1400, OV = 120;
    L.ground.forEach((seg, idx) => {
      const first = seg[0], last = seg[seg.length - 1];
      const x0 = Math.max(first[0], layer.x0), x1 = Math.min(last[0], layer.x1);
      for (let bx = x0; bx < x1; bx += BW) {
        const lead = bx > x0;
        const left = lead ? bx - OV : bx - 40, right = Math.min(bx + BW + 20, x1 + 40);
        let top = Infinity;
        for (let x = left; x <= right; x += 20) top = Math.min(top, L.gy(U.clamp(x, first[0], last[0])));
        top -= 150;
        const box = { x: left, y: top, w: right - left, h: BOTTOM - top + 20 };
        JHS.Layers.paintOnce(layer, box, (g) => {
          paintGroundBlock(g, L, seg, left, right, BOTTOM);
          if (lead) {
            g.save();
            g.globalCompositeOperation = 'destination-out';
            const gr = g.createLinearGradient(left, 0, bx - 20, 0);
            gr.addColorStop(0, 'rgba(0,0,0,1)');
            gr.addColorStop(1, 'rgba(0,0,0,0)');
            g.fillStyle = gr;
            g.fillRect(left - 2, top - 2, bx - 20 - left + 2, box.h + 4);
            g.restore();
          }
        }, POST);
      }
    });
    // el arroyo bajo el puente
    const gap = L.gaps[0];
    const yb = L.gy(gap.x0);
    JHS.Layers.paintOnce(layer, { x: gap.x0 - 140, y: yb - 120, w: gap.x1 - gap.x0 + 280, h: BOTTOM - yb + 140 }, (g) => paintStream(g, L, gap, life), { edge: 0.3, grain: 0.2, density: 0.06 });
    // objetos con contacto legible
    const rng = U.makeRng(4401);
    const props = (box, fn) => JHS.Layers.paintOnce(layer, box, fn, POST);
    const sh = L.ledges[0];
    props({ x: sh.x0 - 40, y: sh.y - 30, w: sh.x1 - sh.x0 + 80, h: L.gy(sh.x1) - sh.y + 50 }, (g) => woodshed(g, sh.x0, sh.x1, L.gy((sh.x0 + sh.x1) / 2), L, rng));
    for (const r of L.rocks) {
      if (r.kind === 'shed') continue;
      props({ x: r.x - 40, y: r.y - 40, w: r.w + 80, h: r.h + 70 }, (g) => {
        const base = r.y + r.h;
        if (r.kind === 'barrel') {
          const poly = U.spline([[r.x, base], [r.x - 3, base - r.h * 0.5], [r.x + 2, base - r.h], [r.x + r.w - 2, base - r.h], [r.x + r.w + 3, base - r.h * 0.5], [r.x + r.w, base]], 3, true);
          Paint.shade(g, U.blobPoly(r.x + r.w / 2 + 4, base + 1, r.w * 0.7, 5, 10, rng, 0.2), '#3e2a12', { layers: 2, alpha: 0.32, amp: 1, seed: 4501, edge: 0 });
          Paint.wash(g, poly, '#9b6b38', { layers: 4, alpha: 0.8, amp: 0.3, seed: 4502, edge: 0.3, core: 1, vary: '#7d5328', varyAmt: 0.5 });
          Paint.within(g, poly, () => Paint.wash(g, [[r.x + r.w * 0.6, base - r.h], [r.x + r.w, base - r.h], [r.x + r.w, base], [r.x + r.w * 0.7, base]], '#d5a465', { layers: 2, alpha: 0.3, amp: 0.3, seed: 4503, edge: 0 }));
          for (const hy of [base - 8, base - r.h + 8]) Paint.ink(g, [[r.x - 2, hy], [r.x + r.w + 2, hy]], { w: 1.8, alpha: 0.7, color: '#3c2a1e', seed: 4504 + hy });
          Paint.ink(g, poly, { closed: true, w: 1.3, alpha: 0.7, seed: 4506, breaks: 0.15 });
        } else if (r.kind === 'crate') crate(g, r.x, base, r.w, r.h, rng, 4510 + r.x);
        else if (r.kind === 'hay') hayBale(g, r.x, base, r.w, r.h, rng, 4520);
        else if (r.kind === 'wall') dryWall(g, r.x, base, r.w, r.h, rng, 4530 + r.x);
        else if (r.kind === 'menhir') menhir(g, r.x, base, r.w, r.h, rng, 4540 + r.x);
        else boulder(g, r.x + r.w / 2, base, r.w / 2 + 6, r.h / 1.7, rng, 4550 + r.x);
      });
    }
    // tronco atravesado sobre dos pilas de piedra seca (repisa de un solo sentido): las pilas
    // bajan hasta el suelo, así el apoyo se lee
    const lg = L.ledges[1];
    props({ x: lg.x0 - 60, y: lg.y - 40, w: lg.x1 - lg.x0 + 120, h: Math.max(L.gy(lg.x0), L.gy(lg.x1 - 1)) - lg.y + 70 }, (g) => {
      for (const px of [lg.x0 + 26, lg.x1 - 30]) {
        const base = L.gy(px) + 4, r2 = U.makeRng(8800 + px);
        for (let y = base, k = 0; y > lg.y + 24; k++) {
          const h = Math.min(r2.range(16, 22), y - lg.y - 20), w = r2.range(34, 46) - k * 1.5;
          const sx = px + r2.range(-4, 4) - w / 2;
          const poly = Props.smoothBlob(sx + w / 2, y - h / 2, w / 2, h / 2, 9, r2, 0.12, 0.6);
          Paint.wash(g, poly, r2.pick(['#b59a76', '#a48868', '#c2a882', '#9a7f60']), { layers: 3, alpha: 0.9, amp: 0.4, seed: 8810 + px + k, edge: 0.3, core: 1 });
          Paint.within(g, poly, () => {
            Paint.wash(g, [[sx, y - h - 2], [sx + w, y - h - 2], [sx + w, y - h * 0.65], [sx, y - h * 0.7]], '#e4c896', { layers: 2, alpha: 0.4, amp: 1, seed: 8820 + px + k, edge: 0 });
            Paint.shade(g, [[sx, y - h * 0.4], [sx + w, y - h * 0.45], [sx + w, y + 2], [sx, y + 2]], '#5c4126', { layers: 2, alpha: 0.3, amp: 1, seed: 8830 + px + k, edge: 0 });
          });
          Paint.ink(g, poly, { closed: true, w: 1.2, alpha: 0.6, color: '#4a3220', seed: 8840 + px + k, breaks: 0.25 });
          y -= h + 0.5;
        }
        tuft(g, px - 18, base, 14, r2);
        tuft(g, px + 16, base + 1, 12, r2);
      }
      const o = JHS.Objects.log(lg.x1 - lg.x0);
      g.drawImage(o.c, lg.x0 - o.ox, lg.y + 14 - o.oy, o.w, o.h);
    });
    for (const b of L.decor.bench) layer.stamp(JHS.Objects.bench(), b.x, L.gy(b.x) + 4);
    for (const sg of L.signs) props({ x: sg.x - 90, y: L.gy(sg.x) - 170, w: 180, h: 190 }, (g) => signpost(g, sg.x, L.gy(sg.x), rng));
  };

  // y del camino dentro de un tramo continuo (sin escalones)
  function runY(run, x) {
    if (x <= run[0][0]) return run[0][1];
    for (let i = 1; i < run.length; i++) {
      const a = run[i - 1], b = run[i];
      if (x <= b[0]) return U.lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0]));
    }
    return run[run.length - 1][1];
  }

  // Un tramo de suelo (capas 2 y 3 de la ficha). Detrás del camino: arbustos, cercas y acequia.
  // El camino: banda de tierra miel de textura ancha y tranquila (detrás de pies y pezuñas no hay
  // ruido) con su borde superior entintado. Delante: la ladera que baja hacia nosotros (lo de abajo
  // está más cerca: matas, flores y piedras más grandes), oliva y ocre como en el concepto.
  function paintGroundBlock(g, L, seg, xa, xb, BOTTOM) {
    const segX0 = seg[0][0], segX1 = seg[seg.length - 1][0];
    const S = (x) => L.gy(U.clamp(x, segX0, segX1));
    const inSeg = (x) => x >= segX0 && x <= segX1;
    const ca = Math.max(xa, segX0), cb = Math.min(xb, segX1);
    if (cb - ca < 4) return;
    const runs = JHS.Scenery.surfaceRuns(seg);

    // ---- capa 3, detrás del camino: hierba, arbustos, cercas y el lecho de la acequia
    const backY = (x) => S(x) - 16;
    cells(ca, cb, 150, 31, (r, cx) => {
      const x = cx + r.range(0, 150);
      if (!inSeg(x) || (x > 1840 && x < 2260) || r.chance(0.2)) return;
      const kind = x < 1600 ? r.pick(['lavender', 'round', 'broom']) : x > 5000 ? r.pick(['broom', 'round']) : r.pick(['round', 'broom', 'lavender']);
      bush(g, x, backY(x) + 2, r.range(18, 34), r, r.int(1, 1e6), kind);
    });
    for (const [fa, fb] of [[2300, 2620], [3360, 4660], [7800, 8240]]) {
      if (fb < ca - 80 || fa > cb + 80 || !inSeg(fa)) continue;
      fence(g, fa, fb, ca, cb, backY, 5100 + fa);
    }
    const cA = Math.max(L.canal[0], ca), cB = Math.min(L.canal[1], cb);
    if (cB - cA > 20 && inSeg(cA)) {
      const xs = [];
      for (let x = cA; x < cB; x += 10) xs.push(x);
      xs.push(cB);
      const bed = xs.map((x) => [x, backY(x) - 12]).concat(xs.slice().reverse().map((x) => [x, backY(x) + 1]));
      Paint.within(g, bed, () => {
        for (let i = 0; i < xs.length - 1; i++) {
          const y = backY(xs[i]);
          const gr = g.createLinearGradient(0, y - 12, 0, y + 1);
          gr.addColorStop(0, '#6e5638'); gr.addColorStop(1, '#977a54');
          g.fillStyle = gr; g.fillRect(xs[i] - 0.3, y - 14, xs[i + 1] - xs[i] + 0.6, 16);
        }
      });
      cells(cA, cB, 15, 41, (r, cx) => {
        const x = cx + r.range(0, 15);
        if (x < L.canal[0] || x > L.canal[1]) return;
        Paint.wash(g, U.blobPoly(x, backY(x) + 1, r.range(6, 10), r.range(3, 4.5), 8, r, 0.2), r.pick(['#b59f82', '#a08a6e', '#c4ae90']), { layers: 2, alpha: 0.9, amp: 0.3, seed: r.int(1, 1e6), edge: 0.35, core: 1 });
      });
    }
    for (const run of runs) {
      const r0 = run[0][0], r1 = run[run.length - 1][0];
      fringe(g, (x) => runY(run, x) - 15, ca, cb, r0, r1, 0.5, 5300, GRASS);
    }

    // ---- la ladera de delante
    const edgeY = (x) => S(x) + 15 + (U.noise1(x * 0.018, 77) - 0.5) * 4;
    const pts = [];
    for (let x = ca; x < cb; x += 8) pts.push([x, edgeY(x)]);
    pts.push([cb, edgeY(cb)]);
    const bank = pts.concat([[cb, BOTTOM + 10], [ca, BOTTOM + 10]]);
    Paint.within(g, bank, () => {
      // degradado que sigue el suelo, en franjas de 24 u ancladas al mundo
      for (let x = Math.floor(ca / 24) * 24; x < cb; x += 24) {
        const y0 = S(x + 12);
        const gr = g.createLinearGradient(0, y0, 0, y0 + 640);
        gr.addColorStop(0, '#a48a4a');
        gr.addColorStop(0.06, '#93793f');
        gr.addColorStop(0.2, '#7c6632');
        gr.addColorStop(0.42, '#665428');
        gr.addColorStop(0.7, '#524320');
        gr.addColorStop(1, '#45381a');
        g.fillStyle = gr;
        g.fillRect(x - 0.5, y0 - 10, 25, BOTTOM - y0 + 40);
      }
      // manchas anchas de hierba, tierra y salvia (baja frecuencia)
      cells(ca, cb, 70, 11, (r, cx) => {
        const x = cx + r.range(0, 70);
        if (!inSeg(x)) return;
        const d = 24 + Math.pow(r.next(), 1.2) * 560, s = 0.7 + d / 300;
        Paint.wash(g, U.blobPoly(x, S(x) + d, r.range(40, 110) * s, r.range(10, 26) * s, 10, r, 0.35), r.pick(['#a98d4c', '#8e7a3c', '#9a9156', '#7a6530', '#b49a55', '#6f6a3a']), { layers: 2, alpha: r.range(0.16, 0.28), amp: 3, seed: r.int(1, 1e6), edge: 0.06 });
      });
      // la sombra corta bajo el borde del camino
      const lip = pts.map(([x, y]) => [x, y - 3]).concat(pts.slice().reverse().map(([x, y]) => [x, y + 24 + (U.noise1(x * 0.03, 5) - 0.5) * 12]));
      Paint.shade(g, lip, '#4e3d17', { layers: 2, alpha: 0.18, amp: 0, seed: 4605, edge: 0 });
      // piedras redondas medio enterradas, en grupos (por detrás de la hierba y las flores)
      cells(ca, cb, 280, 14, (r, cx) => {
        if (r.chance(0.3)) return;
        const xc = cx + r.range(20, 260);
        if (!inSeg(xc - 60) || !inSeg(xc + 60)) return;
        const d0 = 70 + Math.pow(r.next(), 1.2) * 360;
        const n = r.int(1, 3);
        for (let k = 0; k < n; k++) {
          const x = xc + (k ? (k % 2 ? 1 : -1) * r.range(36, 64) : 0), d = d0 + r.range(-10, 22) * k;
          const s = 0.75 + d / 260, rad = r.range(18, 40) * s;
          boulder(g, x, S(x) + d, rad, rad * r.range(0.55, 0.68), r, r.int(1, 1e6));
        }
      });
      // luz de miel sobre la hierba alta (manchas anchas, sin bordes)
      cells(ca, cb, 220, 15, (r, cx) => {
        const x = cx + r.range(0, 220);
        if (!inSeg(x)) return;
        const d = 30 + r.next() * 260;
        Paint.wash(g, U.blobPoly(x, S(x) + d, r.range(90, 170), r.range(16, 34), 12, r, 0.35), '#d2ac5c', { layers: 3, alpha: 0.14, amp: 6, seed: r.int(1, 1e6), edge: 0 });
      });
      // hierba en corros: la densidad sube y baja con un ruido del mundo (claros y matas);
      // más grande cuanto más abajo (más cerca); las puntas al sol, color miel
      cells(ca, cb, 9, 12, (r, cx) => {
        const x = cx + r.range(0, 9);
        if (!inSeg(x)) return;
        for (let k = 0; k < 3; k++) {
          const d = 22 + Math.pow(r.next(), 1.35) * 560, jx = r.range(-4, 4), sd = r.int(1, 1e6);
          const dens = U.noise2(x * 0.011, d * 0.018, 3);
          if (dens < 0.4) continue;
          const s = 0.75 + d / 230;
          tuft(g, x + jx, S(x) + d, 11 * s * (0.7 + dens * 0.6), U.makeRng(sd), dens > 0.64 ? GRASS_LIT : GRASS);
        }
      });
      // flores silvestres en corros: amarillas y blancas, alguna rosa o lila
      cells(ca, cb, 95, 13, (r, cx) => {
        const x0 = cx + r.range(0, 95);
        const d0 = 30 + Math.pow(r.next(), 1.25) * 460;
        const n = r.int(8, 22);
        for (let k = 0; k < n; k++) {
          const x = x0 + r.gauss() * 30, d = Math.max(24, d0 + r.gauss() * 16);
          const kind = r.chance(0.45) ? 'yellow' : r.chance(0.75) ? 'daisy' : r.chance(0.6) ? 'pink' : 'lilac';
          const sd = r.int(1, 1e6);
          if (!inSeg(x)) continue;
          wildFlower(g, x, S(x) + d, kind, 0.85 + d / 200, U.makeRng(sd), sd);
        }
      });
      // y flores sueltas entre los corros
      cells(ca, cb, 26, 16, (r, cx) => {
        const x = cx + r.range(0, 26), d = 26 + Math.pow(r.next(), 1.2) * 520, sd = r.int(1, 1e6);
        if (!inSeg(x) || !r.chance(0.55)) return;
        wildFlower(g, x, S(x) + d, r.chance(0.5) ? 'yellow' : 'daisy', 0.85 + d / 200, U.makeRng(sd), sd);
      });
    });

    // ---- el camino de tierra miel
    for (const run of runs) {
      const r0 = run[0][0], r1 = run[run.length - 1][0];
      const a = Math.max(xa - 10, r0), b = Math.min(xb + 10, r1);
      if (b - a < 4) continue;
      const SY = (x) => runY(run, x);
      const topY = (x) => SY(x) - 16 + (U.noise1(x * 0.02, 31) - 0.5) * 3;
      const botY = (x) => SY(x) + 15 + (U.noise1(x * 0.018, 77) - 0.5) * 4;
      const xs = [];
      for (let x = a; x < b; x += 8) xs.push(x);
      xs.push(b);
      const band = xs.map((x) => [x, topY(x)]).concat(xs.slice().reverse().map((x) => [x, botY(x)]));
      Paint.within(g, band, () => {
        for (let i = 0; i < xs.length - 1; i++) {
          const y = SY(xs[i] + 4);
          const gr = g.createLinearGradient(0, y - 17, 0, y + 17);
          gr.addColorStop(0, '#c99a58'); gr.addColorStop(0.3, '#eabd7a'); gr.addColorStop(0.55, '#f1c886'); gr.addColorStop(0.8, '#ddb06c'); gr.addColorStop(1, '#bb8c4c');
          g.fillStyle = gr; g.fillRect(xs[i] - 0.3, y - 22, xs[i + 1] - xs[i] + 0.6, 44);
        }
        // manchas anchas: miel clara y tostada
        cells(a, b, 60, 21, (r, cx) => {
          const x = cx + r.range(0, 60);
          if (x < r0 || x > r1) return;
          Paint.wash(g, U.blobPoly(x, SY(x) + r.range(-8, 10), r.range(18, 44), r.range(3, 6), 10, r, 0.3), r.pick(['#f6d496', '#d9a865', '#e2b574', '#c89a5a']), { layers: 2, alpha: r.range(0.2, 0.34), amp: 1, seed: r.int(1, 1e6), edge: 0.06 });
        });
        // piedras planas, casi del color del camino
        cells(a, b, 110, 22, (r, cx) => {
          if (r.chance(0.45)) return;
          const x = cx + r.range(0, 110);
          if (x < r0 + 8 || x > r1 - 8) return;
          const y = SY(x) + r.range(-6, 10);
          const poly = U.blobPoly(x, y, r.range(7, 14), r.range(2.4, 4), 9, r, 0.25);
          Paint.wash(g, poly, r.pick(['#e8cf9f', '#d9bd8c', '#f2dcae']), { layers: 2, alpha: 0.5, amp: 0.3, seed: r.int(1, 1e6), edge: 0.25 });
          Paint.ink(g, poly.slice(5, 10), { w: 0.7, alpha: 0.25, color: '#7a5a30', seed: r.int(1, 1e6) });
        });
      });
      // borde de delante: tinta suave y hierba que asoma
      worldInk(g, botY, a, b, r0, r1, { w: 1.5, alpha: 0.45, color: '#6a4c26', breaks: 0.35, sketch: 0.4 }, 4920);
      fringe(g, (x) => botY(x) + 4, a, b, r0, r1, 0.4, 4921, GRASS);
      // borde de detrás: la línea clara y continua del suelo (ficha: «Lectura y encuentro»)
      worldInk(g, topY, a, b, r0, r1, { w: 2.2, alpha: 0.75, color: '#5e4220', breaks: 0.1, sketch: 0.5, bleed: 0.6 }, 4922);
    }
    // ---- muro de piedra seca en los escalones del camino
    for (let i = 1; i < seg.length; i++) {
      const p = seg[i - 1], q = seg[i];
      if (Math.abs(q[0] - p[0]) < 2 && Math.abs(q[1] - p[1]) > 8 && p[0] > xa - 220 && p[0] < xb + 60) stepWall(g, p[0], Math.min(p[1], q[1]), Math.max(p[1], q[1]), 150, 9000 + Math.round(p[0]));
    }
  }

  // Muro bajo de piedra seca en un escalón: sostiene el nivel de arriba hasta el de abajo y se
  // deshace en la ladera hacia la derecha. Piedras cálidas, luz de miel arriba, sombra parda abajo.
  function stepWall(g, xf, yTop, yLow, width, seed) {
    const rng = U.makeRng(seed);
    const y1 = yLow + 18;
    for (let y = yTop + 12, row = 0; y < y1 - 6; row++) {
      const rh = Math.min(rng.range(14, 22), y1 - y);
      let x = xf - rng.range(2, 8) + (row % 2) * 10;
      while (x < xf + width) {
        const w = rng.range(26, 46);
        if (rng.next() < (x - xf) / width * 0.9) { x += w; continue; }
        const sd = seed + row * 97 + Math.round(x);
        const poly = Props.smoothBlob(x + w / 2, y + rh / 2, w / 2, rh / 2, 9, rng, 0.12, 0.6);
        Paint.wash(g, poly, rng.pick(['#b59a76', '#a48868', '#c2a882', '#9a7f60']), { layers: 3, alpha: 0.88, amp: 0.4, seed: sd, edge: 0.3, core: 1 });
        Paint.within(g, poly, () => {
          Paint.wash(g, [[x, y - 2], [x + w, y - 2], [x + w, y + rh * 0.35], [x, y + rh * 0.3]], '#e4c896', { layers: 2, alpha: 0.4, amp: 1, seed: sd + 1, edge: 0 });
          Paint.shade(g, [[x, y + rh * 0.6], [x + w, y + rh * 0.55], [x + w, y + rh + 2], [x, y + rh + 2]], '#5c4126', { layers: 2, alpha: 0.3, amp: 1, seed: sd + 2, edge: 0 });
        });
        Paint.ink(g, poly, { closed: true, w: 1.2, alpha: 0.6, color: '#4a3220', seed: sd + 3, breaks: 0.25 });
        x += w + rng.range(1, 3);
      }
      y += rh + rng.range(1, 2);
    }
    tuft(g, xf - 6, y1, 14, rng);
    tuft(g, xf + width * 0.5, y1 + 4, 12, rng);
  }

  // El arroyo (concepto): baja del fondo hacia nosotros por tres saltos entre rocas redondas, con
  // espuma blanca y reflejos cortos. El puente se apoya en dos estribos bajos de piedra seca
  // asentados en las rocas de la orilla y, en el centro, en dos caballetes de madera.
  function paintStream(g, L, gap, life) {
    const rng = U.makeRng(5401);
    const yb = L.gy(gap.x0), x0 = gap.x0, x1 = gap.x1, cx = (x0 + x1) / 2;
    const B = L.bottom;
    const half = (y) => U.lerp(62, 205, U.smoothstep(yb - 30, B - 120, y));
    const wob = (y, s) => Math.sin(y * 0.021 + s) * 9 + Math.sin(y * 0.053 + s * 2) * 4;
    const lx = (y) => cx - half(y) + wob(y, 1), rx = (y) => cx + half(y) + wob(y, 4);
    const LEDGES = [[yb + 62, 30], [yb + 176, 40], [yb + 318, 52]];
    // orillas interiores: la misma ladera que a los lados (mismo degradado anclado a la orilla)
    // (se extienden 70 u sobre las laderas vecinas y se funden en ellas: sin costura en la orilla)
    const F = 70;
    const inner = [[x0 - F, yb + 16], [x0, yb + 14], [x0, yb - 34], [x1, yb - 34], [x1, yb + 14], [x1 + F, yb + 16], [x1 + F, B + 10], [x0 - F, B + 10]];
    Paint.within(g, inner, () => {
      const gr = g.createLinearGradient(0, yb, 0, yb + 640);
      gr.addColorStop(0, '#a48a4a'); gr.addColorStop(0.06, '#93793f'); gr.addColorStop(0.2, '#7c6632'); gr.addColorStop(0.42, '#665428'); gr.addColorStop(0.7, '#524320'); gr.addColorStop(1, '#45381a');
      g.fillStyle = gr;
      g.fillRect(x0 - F, yb - 34, x1 - x0 + 2 * F, B - yb + 50);

      for (let i = 0; i < 160; i++) {
        const y = yb + 18 + Math.pow(rng.next(), 1.3) * 520, x = rng.range(x0 - F, x1 + F);
        tuft(g, x, y, 12 * (0.8 + (y - yb) / 220), rng, rng.chance(0.4) ? GRASS_LIT : GRASS);
      }
      for (let i = 0; i < 46; i++) {
        const y = yb + 30 + rng.next() * 480, x = rng.range(x0 - F, x1 + F);
        wildFlower(g, x, y, rng.chance(0.5) ? 'yellow' : 'daisy', 0.85 + (y - yb) / 200, rng, 5390 + i);
      }
      // los bordes laterales se funden sobre la ladera vecina
      g.save();
      g.globalCompositeOperation = 'destination-out';
      for (const [xa, xb, a0, a1] of [[x0 - F, x0 - 6, 1, 0], [x1 + 6, x1 + F, 0, 1]]) {
        const fg = g.createLinearGradient(xa, 0, xb, 0);
        fg.addColorStop(0, `rgba(0,0,0,${a0})`); fg.addColorStop(1, `rgba(0,0,0,${a1})`);
        g.fillStyle = fg; g.fillRect(xa, yb + 10, xb - xa, B - yb + 20);
      }
      g.restore();
    });
    // agua: reflejo crema del cielo arriba, verde gris hondo en las pozas de abajo
    const Lp = [], Rp = [];
    for (let y = yb - 34; y <= B + 10; y += 8) { Lp.push([lx(y), y]); Rp.push([rx(y), y]); }
    const water = Lp.concat(Rp.slice().reverse());
    Paint.within(g, water, () => {
      const gr = g.createLinearGradient(0, yb - 34, 0, B);
      gr.addColorStop(0, '#c9bfa4'); gr.addColorStop(0.12, '#c3bea8'); gr.addColorStop(0.35, '#adaf9f'); gr.addColorStop(0.7, '#949e97'); gr.addColorStop(1, '#7f8c88');
      g.fillStyle = gr;
      g.fillRect(cx - 330, yb - 40, 660, B - yb + 60);
      // la sombra del puente sobre el agua y el reflejo de las orillas oscuras
      Paint.shade(g, [[cx - 330, yb - 40], [cx + 330, yb - 40], [cx + 330, yb + 26], [cx - 330, yb + 38]], '#4e4630', { layers: 3, alpha: 0.3, amp: 4, seed: 5404, edge: 0 });
      for (const side of [-1, 1]) Paint.shade(g, [[cx + side * 30, yb - 40], [cx + side * 330, yb - 40], [cx + side * 330, B], [cx + side * 120, B]], '#5a5236', { layers: 2, alpha: 0.12, amp: 6, seed: 5405 + side, edge: 0 });
      for (const [yy, hh] of LEDGES) Paint.shade(g, U.blobPoly(cx, yy + hh + 46, half(yy) * 0.9, 30, 12, rng, 0.2), '#5f6f6c', { layers: 3, alpha: 0.22, amp: 4, seed: 5402 + yy, edge: 0 });
      // reflejos cortos (ficha: «agua mansa con reflejos cortos»)
      for (let i = 0; i < 70; i++) {
        const y = rng.range(yb - 20, B - 30), w = rng.range(6, 22) * (0.6 + (y - yb) / 400);
        const x = cx + rng.range(-1, 1) * half(y) * 0.8;
        Paint.ink(g, [[x - w, y], [x + w, y + rng.range(-1, 1)]], { w: rng.range(1, 2.2), alpha: 0.55, color: '#f7efdb', seed: 5410 + i, taper: 0.5 });
      }
    });
    Paint.ink(g, Lp, { w: 1.2, alpha: 0.45, color: '#4a3a24', seed: 5420, breaks: 0.4 });
    Paint.ink(g, Rp, { w: 1.2, alpha: 0.45, color: '#4a3a24', seed: 5421, breaks: 0.4 });
    // tres saltos: una hilera de rocas atraviesa el cauce y el agua cae por los huecos
    for (const [yy, hh] of LEDGES) {
      const a = lx(yy), b = rx(yy), w = b - a;
      const n = 3 + 2 * Math.round(w / 170);
      for (let k = 0; k < n; k++) {
        const x = a + (k + 0.5) / n * w;
        if (k % 2 === 1) {
          if (life) life.falls.push({ x, top: yy + 2, bottom: yy + hh + 10, w0: w / n * 0.7, w1: w / n * 0.95, k: 0.85, layer: 'play', scale: 0.55, fade: 70, mist: 0 });
          for (let i = 0; i < 6; i++) Paint.softBlob(g, x + rng.range(-w / n * 0.5, w / n * 0.5), yy + hh + rng.range(2, 16), rng.range(6, 14), '#fbf7ec', 0.55);
          continue;
        }
        const r = (w / n) * 0.62;
        boulder(g, x, yy + hh * 0.55, r, r * 0.5, rng, 5500 + Math.round(x + yy), { wet: true, moss: rng.chance(0.4) });
      }
      for (let i = 0; i < 10; i++) Paint.softBlob(g, a + rng.range(0.1, 0.9) * w, yy + hh + rng.range(6, 22), rng.range(6, 14), '#f4f0e4', 0.4);
    }
    // rocas de las orillas, mojadas por abajo, cada vez mayores al acercarse
    for (const side of [-1, 1]) {
      for (let y = yb + 8; y < B + 20;) {
        const s = 0.7 + (y - yb) / 300;
        const big = rng.chance(0.25);
        const r = rng.range(14, 30) * s * (big ? 1.5 : 1);
        const ex = side < 0 ? lx(y) : rx(y);
        if (rng.chance(0.82)) {
          // unas dentro del agua, otras ya en la hierba; de vez en cuando una pareja
          const bx = ex + side * rng.range(-r * 0.6, r * 0.9);
          boulder(g, bx, y, r, r * rng.range(0.5, 0.7), rng, 5600 + Math.round(y) * 3 + side, { wet: true });
          if (rng.chance(0.35)) boulder(g, bx + side * r * rng.range(0.8, 1.3), y + rng.range(4, 14), r * 0.55, r * 0.34, rng, 5601 + Math.round(y) * 3 + side, { wet: false });
        } else Paint.splatter(g, ex, y - 4, 16 * s, 5 * s, 10, '#8d704a', { alpha: 0.7, rmin: 1.2 * s, rmax: 3 * s, seed: 5602 + Math.round(y) });
        for (let k = 0; k < 2; k++) if (rng.chance(0.6)) tuft(g, ex + side * (r + rng.range(2, 30)), y + rng.range(-2, 6), 13 * s, rng, rng.chance(0.4) ? GRASS_LIT : GRASS);
        if (rng.chance(0.4)) wildFlower(g, ex + side * (r + rng.range(6, 34)), y - rng.range(4, 14), rng.chance(0.5) ? 'yellow' : 'daisy', s, rng, 5603 + Math.round(y));
        y += r * rng.range(0.55, 1.05);
      }
    }
    if (life) life.stream = { x0: cx - 205, x1: cx + 205, y0: yb - 20, y1: B, cx };
    // caballetes de madera bajo las juntas del tramo central, sobre rocas del cauce
    const supports = L.bridge.holes.slice(1).map(([h]) => h);
    for (const sx of supports) {
      boulder(g, sx, yb + 132, 26, 14, rng, 5700 + sx, { wet: true });
      for (const px of [sx - 8, sx + 8]) {
        const poly = [[px - 4, yb + 12], [px + 4, yb + 12], [px + 5, yb + 126], [px - 5, yb + 126]];
        Paint.wash(g, poly, C.woodShade, { layers: 3, alpha: 0.92, amp: 0.3, seed: 5710 + px, edge: 0.3, core: 1 });
        Paint.wash(g, [[px - 4, yb + 12], [px - 1, yb + 12], [px - 1, yb + 126], [px - 5, yb + 126]], '#a88a5c', { layers: 1, alpha: 0.4, amp: 0.2, seed: 5712 + px, edge: 0 });
        Paint.ink(g, poly, { closed: true, w: 0.9, alpha: 0.6, seed: 5714 + px, color: '#3c2a1e', breaks: 0.2 });
      }
      Paint.ink(g, [[sx - 10, yb + 40], [sx + 10, yb + 86]], { w: 2.6, alpha: 0.8, color: C.woodShade, seed: 5716 + sx });
    }
    Paint.ink(g, [[supports[0] + 8, yb + 60], [supports[1] - 8, yb + 30]], { w: 3, alpha: 0.75, color: C.woodShade, seed: 5718 });
    // estribos: piedra seca baja sobre rocas grandes de la orilla
    for (const [ax, dir] of [[x0, -1], [x1, 1]]) {
      boulder(g, ax + dir * 4, yb + 92, 58, 30, rng, 5800 + ax, { wet: true });
      const r2 = U.makeRng(5810 + ax);
      for (let row = 0; row < 3; row++) {
        const y = yb + 8 + row * 20;
        for (let k = 0; k < 3; k++) {
          const w = r2.range(24, 32);
          const sx = ax + dir * (k * 26 + (row % 2) * 12) - (dir > 0 ? 6 : w - 6);
          const sd = 5820 + row * 10 + k + ax;
          const poly = Props.smoothBlob(sx + w / 2, y + 9, w / 2, r2.range(8.5, 10.5), 9, r2, 0.15, 0.7);
          Paint.wash(g, poly, r2.pick(['#b59a76', '#a48868', '#c2a882']), { layers: 3, alpha: 0.9, amp: 0.3, seed: sd, edge: 0.3, core: 1 });
          Paint.within(g, poly, () => {
            Paint.wash(g, [[sx, y - 1], [sx + w, y - 1], [sx + w, y + 6], [sx, y + 6]], '#e4c896', { layers: 2, alpha: 0.4, amp: 0.5, seed: sd + 1, edge: 0 });
            Paint.shade(g, [[sx - 2, y + 11], [sx + w + 2, y + 11], [sx + w + 2, y + 21], [sx - 2, y + 21]], '#5c4126', { layers: 2, alpha: 0.28, amp: 1, seed: sd + 2, edge: 0 });
          });
          Paint.ink(g, poly, { closed: true, w: 1.1, alpha: 0.58, seed: sd + 3, color: '#4a3220', breaks: 0.25 });
        }
      }
      tuft(g, ax + dir * 64, yb + 66, 16, r2);
      bush(g, ax + dir * 80, yb + 30, 20, r2, 5850 + ax, 'round');
    }
  }

  // ------------------------------------------------------------------ primer plano (solo esquinas)
  Art.foregroundSprites = function () {
    const out = [];
    for (let i = 0; i < 5; i++) {
      const rng = U.makeRng(6100 + i * 13);
      out.push(Paint.makeSprite({ w: 600, h: 340, ox: 300, oy: 310, res: 0.8, post: { edge: 0.3, grain: 0.2, density: 0.07, texScale: 1.25 } }, (g) => {
        if (i % 2 === 0) boulder(g, rng.range(-90, 90), -6, rng.range(90, 130), rng.range(50, 70), rng, 6120 + i);
        // hojas grandes y desenfocadas: pocas manchas de borde blando, oliva y ocre
        for (let k = 0; k < 18; k++) {
          const x = rng.range(-260, 260), y = -rng.range(0, 120);
          Paint.wash(g, U.blobPoly(x, y, rng.range(30, 84), rng.range(14, 34), 10, rng, 0.35), rng.pick(['#6b5e2c', '#8a7a3c', '#4f4220', '#a48d45', '#7d6f34']), { layers: 3, alpha: 0.5, amp: 4, seed: 6130 + i * 40 + k, edge: 0.08 });
        }
        // briznas largas que se curvan
        g.lineCap = 'round';
        for (let k = 0; k < 44; k++) {
          const x = rng.range(-270, 270), h = rng.range(60, 150), lean = rng.range(-0.5, 0.5);
          g.strokeStyle = rng.pick(['#6d5a26', '#8a7436', '#a68a45', '#5a4a1e']);
          g.globalAlpha = rng.range(0.45, 0.8); g.lineWidth = rng.range(2, 4);
          g.beginPath(); g.moveTo(x, 0); g.quadraticCurveTo(x + lean * h * 0.3, -h * 0.6, x + lean * h, -h); g.stroke();
        }
        g.globalAlpha = 1;
        // flores cercanas: margaritas blancas, flores amarillas y espigas rosas, grandes y suaves
        for (let k = 0; k < 28; k++) {
          const x = rng.range(-250, 250), y = -rng.range(30, 210);
          const kind = rng.pick(['daisy', 'yellow', 'yellow', 'pink', 'daisy', 'yellow']);
          Paint.ink(g, [[x, y + 80], [x + rng.range(-8, 8), y]], { w: 2.2, alpha: 0.75, color: '#5a5222', seed: 6200 + i * 40 + k });
          const R = rng.range(10, 17);
          if (kind === 'pink') {
            for (let j = 0; j < 6; j++) Paint.wash(g, U.blobPoly(x + (j % 2 ? 4 : -4), y - j * 7, R * 0.45, R * 0.55, 8, rng, 0.2), j > 3 ? '#efc2cf' : '#dd92a8', { layers: 2, alpha: 0.75, amp: 0.4, seed: 6300 + i * 60 + k * 6 + j, edge: 0.3 });
          } else {
            const col = kind === 'daisy' ? '#fffaf1' : '#f2c23c';
            const np = kind === 'daisy' ? 12 : 8;
            for (let j = 0; j < np; j++) {
              const a = j / np * U.TAU;
              g.fillStyle = U.rgba(col, 0.9);
              g.beginPath(); g.ellipse(x + Math.cos(a) * R * 0.55, y + Math.sin(a) * R * 0.4, R * 0.5, R * 0.2, a, 0, U.TAU); g.fill();
            }
            g.fillStyle = kind === 'daisy' ? '#e7a92c' : '#b8731c';
            g.beginPath(); g.arc(x, y, R * 0.2, 0, U.TAU); g.fill();
          }
        }
      }));
    }
    return out;
  };

  // ------------------------------------------------------------------ puente de tablas
  // Tablas atravesadas sobre dos largueros, apoyado en los estribos y en dos caballetes. La
  // tormenta se llevó el tramo central (tablas y largueros); cada tablón nuevo va de apoyo a
  // apoyo. Todo se pinta plano a la altura y0: el guion lo dibuja en franjas que siguen la
  // superficie del puente (su lomo y el hundimiento al pisarlo), así los pies apoyan en las tablas.
  Art.bridgeSprites = function (L) {
    const B = L.bridge, x0 = B.x0, x1 = B.x1, y = B.y0, W = x1 - x0;
    const H0 = B.holes[0][0], H1 = B.holes[B.holes.length - 1][1];
    const supports = B.holes.slice(1).map(([h]) => h);
    const mk = (h, oy, fn, res = 1.4) => Paint.makeSprite({ w: W + 60, h, ox: -(x0 - 30), oy, res, post: POST }, fn);
    const deck = mk(80, -(y - 24), (g) => {
      const rng = U.makeRng(6501);
      // largueros: enteros en los extremos, partidos y astillados donde empieza el hueco
      for (const [dy, col] of [[9, '#6a4a2a'], [16, '#55391f']]) {
        for (const [xa, xb, end] of [[x0 - 12, H0 + 8, H0 + 8], [H1 - 8, x1 + 12, H1 - 8]]) {
          const poly = [[xa, y + dy - 3], [xb, y + dy - 3], [xb + (end === xb ? 3 : 0), y + dy], [xb, y + dy + 3], [xa, y + dy + 3], [xa - (end === xa ? 3 : 0), y + dy]];
          Paint.wash(g, poly, col, { layers: 2, alpha: 0.94, amp: 0.3, seed: 6502 + dy + xa, edge: 0.3, core: 1 });
        }
      }
      // tablas: la cara de cada tabla atravesada, con su canto de luz
      for (let x = x0 + 2, i = 0; x < x1 - 4; x += 21, i++) {
        if (x + 10 > H0 - 2 && x + 10 < H1 + 2) continue;
        const poly = [[x, y - 3], [x + 19, y - 3.5], [x + 19.5, y + 6], [x + 0.5, y + 6.5]];
        Paint.wash(g, poly, rng.pick(['#a8875a', '#9a7a4c', '#b39266', '#8f7046']), { layers: 2, alpha: 0.95, amp: 0.25, seed: 6520 + i, edge: 0.3, core: 1 });
        Paint.wash(g, [[x, y - 3], [x + 19, y - 3.5], [x + 19, y - 1.2], [x, y - 0.8]], '#e9c88e', { layers: 1, alpha: 0.6, amp: 0.1, seed: 6600 + i, edge: 0 });
        Paint.ink(g, poly, { closed: true, w: 0.8, alpha: 0.62, seed: 6700 + i, color: '#4a3220', breaks: 0.15 });
      }
      // una tabla rota cuelga de un clavo a cada lado del hueco
      for (const [hx, dir] of [[H0 - 2, 1], [H1 + 2, -1]]) {
        const poly = [[hx, y + 2], [hx + dir * 6, y + 1], [hx + dir * 12, y + 26], [hx + dir * 5, y + 28]];
        Paint.wash(g, poly, '#8a6a44', { layers: 2, alpha: 0.9, amp: 0.2, seed: 6780 + hx, edge: 0.3, core: 1 });
        Paint.ink(g, poly, { closed: true, w: 0.8, alpha: 0.6, seed: 6781 + hx, color: '#4a3220' });
      }
      // los caballetes conservan su travesaño de apoyo
      for (const sx of supports) {
        Paint.wash(g, [[sx - 12, y + 7], [sx + 12, y + 7], [sx + 12, y + 14], [sx - 12, y + 14]], '#5f4325', { layers: 2, alpha: 0.95, amp: 0.2, seed: 6790 + sx, edge: 0.3, core: 1 });
        Paint.ink(g, [[sx - 12, y + 7], [sx + 12, y + 7]], { w: 0.8, alpha: 0.5, seed: 6791 + sx, color: '#e2bf86' });
      }
    });
    // tablón remendado: madera nueva, de apoyo a apoyo, atado con cuerda nueva
    const board = (len, seed) => Paint.makeSprite({ w: len + 20, h: 26, ox: 10, oy: 8, res: 1.6, post: POST }, (g) => {
      const rng = U.makeRng(seed);
      const poly = [[0, -3], [len, -4], [len + 1, 6], [0, 7]];
      Paint.wash(g, poly, C.woodNew, { layers: 3, alpha: 0.96, amp: 0.3, seed, edge: 0.3, core: 1, vary: '#e9c995', varyAmt: 0.4 });
      Paint.within(g, poly, () => { for (let i = 0; i < 4; i++) Paint.ink(g, [[rng.range(2, len * 0.4), rng.range(-1, 4)], [rng.range(len * 0.5, len - 2), rng.range(-1, 4)]], { w: 0.6, alpha: 0.35, color: '#9c7646', seed: seed + i }); });
      Paint.ink(g, poly, { closed: true, w: 1, alpha: 0.75, color: '#5b3d22', seed: seed + 9, breaks: 0.1 });
      for (const rx of [6, len - 6]) { g.strokeStyle = U.rgba('#efe3c6', 0.95); g.lineWidth = 1.4; g.beginPath(); g.moveTo(rx - 3, -4); g.lineTo(rx + 3, 8); g.moveTo(rx + 2, -4); g.lineTo(rx + 7, 8); g.stroke(); }
    });
    const boards = B.holes.map(([a, b], i) => ({ x: a - 3, w: b - a + 6, spr: board(b - a + 6, 6801 + i) }));
    const carry = board(96, 6809);
    // barandilla: postes y dos pasamanos; rota (el tramo central caído) o arreglada (madera nueva)
    const posts = [];
    const np = Math.round(W / 62);
    for (let k = 0; k <= np; k++) posts.push(x0 + 4 + k * (W - 8) / np);
    const inMid = (x) => x > H0 - 8 && x < H1 + 8;
    const rail = (fixed, far) => mk(130, -(y - 96), (g) => {
      const rng = U.makeRng(far ? 6901 : 6951);
      const top = y - 66, mid = y - 38;
      const col = far ? '#7a5c3a' : '#8e6c44';
      const newWood = '#c9a066';
      for (const x of posts) {
        if (!fixed && inMid(x)) {
          // poste partido: muñón astillado
          if (rng.chance(0.7)) {
            const h = rng.range(14, 30);
            const poly = [[x - 4, y + 4], [x - 3.6, y - h], [x - 1, y - h - 5], [x + 1.5, y - h + 2], [x + 3.6, y - h - 3], [x + 4, y + 4]];
            Paint.wash(g, poly, col, { layers: 3, alpha: far ? 0.8 : 0.95, amp: 0.3, seed: 6955 + x, edge: 0.3, core: 1 });
            Paint.ink(g, poly, { closed: true, w: 0.9, alpha: 0.55, seed: 6956 + x, color: '#3c2a1e' });
          }
          continue;
        }
        const c = fixed && inMid(x) ? newWood : col;
        Paint.wash(g, [[x - 4, y + 4], [x - 3.4, top - 6], [x + 3.6, top - 7], [x + 4, y + 4]], c, { layers: 3, alpha: far ? 0.8 : 0.96, amp: 0.3, seed: 6960 + x, edge: 0.3, core: 1 });
        Paint.wash(g, [[x + 1, top - 6], [x + 3.6, top - 7], [x + 4, y + 4], [x + 1.5, y + 4]], '#e2bf86', { layers: 1, alpha: 0.35, amp: 0.2, seed: 6962 + x, edge: 0 });
        Paint.ink(g, [[x - 4, y + 4], [x - 3.4, top - 6]], { w: 1, alpha: 0.6, seed: 6965 + x, color: '#3c2a1e' });
      }
      for (const ry of [top, mid]) {
        for (let k = 0; k < posts.length - 1; k++) {
          const a = posts[k], b = posts[k + 1];
          const touches = inMid(a) || inMid(b);
          if (!fixed && touches) {
            // pasamanos partido que cuelga del poste que queda en pie
            if (!inMid(a) && rng.chance(0.85)) {
              const poly = [[a, ry - 2], [a + 30, ry + 16], [a + 27, ry + 20], [a, ry + 3]];
              Paint.wash(g, poly, col, { layers: 2, alpha: 0.88, amp: 0.2, seed: 6970 + k + ry, edge: 0.3, core: 1 });
            } else if (!inMid(b) && rng.chance(0.85)) {
              const poly = [[b, ry - 2], [b - 30, ry + 18], [b - 27, ry + 22], [b, ry + 3]];
              Paint.wash(g, poly, col, { layers: 2, alpha: 0.88, amp: 0.2, seed: 6971 + k + ry, edge: 0.3, core: 1 });
            }
            continue;
          }
          const poly = [[a, ry - 2.8], [b, ry - 3.2], [b, ry + 2.8], [a, ry + 3.2]];
          Paint.wash(g, poly, fixed && touches ? newWood : col, { layers: 2, alpha: far ? 0.8 : 0.94, amp: 0.2, seed: 6980 + k + ry, edge: 0.3, core: 1 });
          Paint.wash(g, [[a, ry - 2.8], [b, ry - 3.2], [b, ry - 1], [a, ry - 0.6]], '#efcf98', { layers: 1, alpha: 0.4, amp: 0.1, seed: 6985 + k + ry, edge: 0 });
          Paint.ink(g, [[a, ry + 3], [b, ry + 2.8]], { w: 0.8, alpha: 0.5, seed: 6990 + k + ry, color: '#3c2a1e' });
        }
      }
      // ataduras de cuerda en las uniones (las nuevas, más claras)
      for (const x of posts) {
        if (!fixed && inMid(x)) continue;
        for (const ry of [top, mid]) {
          g.strokeStyle = U.rgba(fixed && inMid(x) ? '#efe3c6' : '#b9a684', 0.95); g.lineWidth = 1.3;
          g.beginPath(); g.moveTo(x - 4, ry - 4); g.lineTo(x + 4, ry + 3); g.moveTo(x - 4, ry); g.lineTo(x + 4, ry + 6); g.stroke();
        }
      }
    });
    return { deck, boards, carry, railBackBroken: rail(false, true), railBackFixed: rail(true, true), railFrontBroken: rail(false, false), railFrontFixed: rail(true, false) };
  };
})(window.JHS = window.JHS || {});
