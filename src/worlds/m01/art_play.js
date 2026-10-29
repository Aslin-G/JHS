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
  function boulder(g, x, base, rx, ry, rng, seed) {
    const poly = Props.smoothBlob(x, base - ry * 0.85, rx, ry, 11, rng, 0.14, 0.55);
    Paint.shade(g, U.blobPoly(x + rx * 0.1, base + 1, rx * 1.1, ry * 0.18, 12, rng, 0.1), '#4d3e30', { layers: 3, alpha: 0.3, amp: 2, seed: seed + 1, edge: 0 });
    Paint.wash(g, poly, rng.pick(['#b4a48e', '#a8987f', '#bba98f']), { layers: 4, alpha: 0.6, amp: 1, seed, edge: 0.3, core: 1, vary: '#d6c4a6', varyAmt: 0.4 });
    Paint.within(g, poly, () => {
      Paint.wash(g, U.blobPoly(x + rx * 0.25, base - ry * 1.3, rx * 0.7, ry * 0.4, 10, rng, 0.25), '#e8d8ba', { layers: 3, alpha: 0.4, amp: 2, seed: seed + 2, edge: 0 });
      Paint.shade(g, U.blobPoly(x - rx * 0.4, base - ry * 0.3, rx * 0.8, ry * 0.55, 10, rng, 0.25), '#6e5c4b', { layers: 3, alpha: 0.28, amp: 2, seed: seed + 3, edge: 0 });
      // granito: motas finas, oscuras y claras, a baja opacidad
      Paint.splatter(g, x, base - ry * 0.85, rx, ry * 0.85, rx * ry / 18, '#5e4f43', { alpha: 0.35, rmin: 0.4, rmax: 1, seed: seed + 4 });
      Paint.splatter(g, x, base - ry * 0.85, rx, ry * 0.85, rx * ry / 24, '#f4e8d2', { alpha: 0.5, rmin: 0.4, rmax: 1.1, seed: seed + 5 });
      if (rng.chance(0.5)) Paint.wash(g, U.blobPoly(x + rng.range(-rx * 0.4, rx * 0.3), base - ry * 1.45, rx * 0.35, ry * 0.12, 8, rng, 0.3), C.leaf, { layers: 2, alpha: 0.4, amp: 1, seed: seed + 6, edge: 0.1 });
    });
    Paint.ink(g, poly, { closed: true, w: 1.5, alpha: 0.6, seed: seed + 7, breaks: 0.25, sketch: 0.3 });
  }
  Art.boulder = boulder;

  function flowerCluster(g, x, y, n, rng, seed, kinds = ['daisy', 'yellow', 'yellow', 'pink']) {
    for (let i = 0; i < n; i++) {
      const fx = x + rng.range(-26, 26), fy = y + rng.range(-10, 10), kind = rng.pick(kinds);
      Paint.ink(g, [[fx, fy + 10], [fx + rng.range(-2, 2), fy]], { w: 0.9, alpha: 0.7, color: P.grassDark, seed: seed + i });
      if (kind === 'daisy') {
        for (let k = 0; k < 9; k++) {
          const a = k / 9 * U.TAU;
          g.fillStyle = U.rgba('#fffaf0', 0.95);
          g.beginPath(); g.ellipse(fx + Math.cos(a) * 3.4, fy + Math.sin(a) * 2.4, 2.6, 1.1, a, 0, U.TAU); g.fill();
        }
        g.fillStyle = '#eab33a'; g.beginPath(); g.arc(fx, fy, 1.5, 0, U.TAU); g.fill();
      } else {
        const col = kind === 'pink' ? '#e2a0b2' : kind === 'lilac' ? '#b6a3c8' : '#f2c23c';
        for (let k = 0; k < 6; k++) {
          const a = k / 6 * U.TAU;
          g.fillStyle = U.rgba(col, 0.9);
          g.beginPath(); g.ellipse(fx + Math.cos(a) * 2.2, fy + Math.sin(a) * 1.6, 2, 1.4, a, 0, U.TAU); g.fill();
        }
        g.fillStyle = U.rgba('#9a6a1e', 0.8); g.beginPath(); g.arc(fx, fy, 0.9, 0, U.TAU); g.fill();
      }
    }
  }
  Art.flowerCluster = flowerCluster;

  function bush(g, x, y, r, rng, seed, kind) {
    const cols = kind === 'broom' ? [C.leaf, C.leafDeep, '#8c8d4f'] : kind === 'lavender' ? ['#8a9774', '#6f7c5c', '#a5ae8a'] : [C.leaf, C.leafDeep, C.leafLit];
    Paint.shade(g, U.blobPoly(x, y + 2, r * 1.1, r * 0.2, 10, rng, 0.2), '#4d4630', { layers: 2, alpha: 0.25, amp: 1, seed: seed + 1, edge: 0 });
    Art.leafMass(g, x, y - r * 0.55, r, r * 0.55, rng, Math.round(r * 1.5), cols, seed);
    if (kind === 'broom') for (let i = 0; i < r * 1.2; i++) Paint.softBlob(g, x + rng.range(-r, r), y - r * 0.55 + rng.range(-r * 0.5, r * 0.4), rng.range(1.6, 2.6), '#f4c83f', 0.9);
    if (kind === 'lavender') for (let i = 0; i < r * 0.8; i++) { const fx = x + rng.range(-r, r), fy = y - r * 0.8 + rng.range(-r * 0.3, r * 0.3); Paint.ink(g, [[fx, fy + 6], [fx, fy - 4]], { w: 2.2, alpha: 0.75, color: '#a493c4', seed: seed + 50 + i }); }
  }
  Art.bush = bush;

  function fence(g, x0, x1, gyF, rng, seed) {
    const posts = [];
    for (let x = x0; x <= x1; x += rng.range(56, 70)) posts.push(x);
    const top = (x) => gyF(x) - 52, mid = (x) => gyF(x) - 30;
    for (const [i, rail] of [[0, top], [1, mid]]) {
      const pts = posts.map((x) => [x, rail(x) + rng.range(-1.5, 1.5)]);
      for (let k = 0; k < pts.length - 1; k++) {
        const a = pts[k], b = pts[k + 1];
        const poly = [[a[0], a[1] - 2.6], [b[0], b[1] - 2.6], [b[0], b[1] + 2.6], [a[0], a[1] + 2.6]];
        Paint.wash(g, poly, rng.pick(['#9e8a6c', '#8c7759', '#a89474']), { layers: 2, alpha: 0.85, amp: 0.3, seed: seed + i * 100 + k, edge: 0.3, core: 1 });
        Paint.ink(g, [a, b].map(([x, y]) => [x, y + 2.6]), { w: 0.9, alpha: 0.5, seed: seed + 200 + i * 100 + k, color: C.woodShade });
      }
    }
    for (const x of posts) {
      const y = gyF(x);
      const poly = [[x - 3.6, y + 2], [x - 3, top(x) - 8], [x + 3.4, top(x) - 9], [x + 3.8, y + 2]];
      Paint.wash(g, poly, rng.pick(['#8f7a5c', '#7d6a50']), { layers: 3, alpha: 0.9, amp: 0.3, seed: seed + 400 + x, edge: 0.3, core: 1 });
      Paint.ink(g, poly, { closed: true, w: 1, alpha: 0.6, seed: seed + 500 + x, color: '#4a3826', breaks: 0.2 });
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
  Art.paintPlay = function (layer, L, life) {
    const rng = U.makeRng(4401);
    const BOTTOM = L.bottom;
    L.ground.forEach((seg, idx) => {
      const first = seg[0], last = seg[seg.length - 1];
      const x0 = Math.max(first[0], layer.x0), x1 = Math.min(last[0], layer.x1);
      for (let bx = x0; bx < x1; bx += 1600) {
        const bw = Math.min(1600, x1 - bx);
        const ys = seg.filter(([x]) => x >= bx - 200 && x <= bx + bw + 200).map((p) => p[1]);
        const top = Math.min(...ys, L.gy(bx), L.gy(bx + bw)) - 140;
        JHS.Layers.paintOnce(layer, { x: bx - 60, y: top, w: bw + 120, h: BOTTOM - top + 20 }, (g) => paintGroundBlock(g, L, seg, idx, bx - 60, bx + bw + 60, BOTTOM, rng), POST);
      }
    });
    // el arroyo bajo el puente
    const gap = L.gaps[0];
    JHS.Layers.paintOnce(layer, { x: gap.x0 - 90, y: L.gy(gap.x0) - 90, w: gap.x1 - gap.x0 + 180, h: BOTTOM - L.gy(gap.x0) + 110 }, (g) => paintStream(g, L, gap, rng, life), { edge: 0.3, grain: 0.2, density: 0.06 });
    // objetos con contacto legible
    const props = (box, fn) => JHS.Layers.paintOnce(layer, box, fn, POST);
    const sh = L.ledges[0];
    props({ x: sh.x0 - 40, y: sh.y - 30, w: sh.x1 - sh.x0 + 80, h: L.gy(sh.x1) - sh.y + 50 }, (g) => woodshed(g, sh.x0, sh.x1, L.gy((sh.x0 + sh.x1) / 2), L, rng));
    for (const r of L.rocks) {
      if (r.kind === 'shed') continue;
      props({ x: r.x - 40, y: r.y - 40, w: r.w + 80, h: r.h + 70 }, (g) => {
        const base = r.y + r.h;
        if (r.kind === 'barrel') {
          const poly = U.spline([[r.x, base], [r.x - 3, base - r.h * 0.5], [r.x + 2, base - r.h], [r.x + r.w - 2, base - r.h], [r.x + r.w + 3, base - r.h * 0.5], [r.x + r.w, base]], 3, true);
          Paint.shade(g, U.blobPoly(r.x + r.w / 2 + 4, base + 1, r.w * 0.7, 5, 10, rng, 0.2), '#4d3e30', { layers: 2, alpha: 0.3, amp: 1, seed: 4501, edge: 0 });
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
    // tronco caído sobre dos piedras (repisa de un solo sentido)
    const lg = L.ledges[1];
    props({ x: lg.x0 - 40, y: lg.y - 40, w: lg.x1 - lg.x0 + 80, h: L.gy(lg.x1) - lg.y + 60 }, (g) => {
      const o = JHS.Objects.log(lg.x1 - lg.x0);
      g.drawImage(o.c, lg.x0 - o.ox, lg.y + 14 - o.oy, o.w, o.h);
    });
    for (const b of L.decor.bench) layer.stamp(JHS.Objects.bench(), b.x, L.gy(b.x) + 4);
    for (const sg of L.signs) props({ x: sg.x - 90, y: L.gy(sg.x) - 170, w: 180, h: 190 }, (g) => signpost(g, sg.x, L.gy(sg.x), rng));
  };

  // Un tramo de suelo: camino claro de tierra pisada, verde detrás con arbustos, cerca y acequia
  // (capa 3) y, por delante, la ladera de césped con flores y piedras redondas.
  function paintGroundBlock(g, L, seg, idx, xa, xb, BOTTOM, rng) {
    const S = (x) => L.gy(x);
    const pts = [];
    for (let x = xa; x <= xb; x += 12) {
      const cx = U.clamp(x, seg[0][0], seg[seg.length - 1][0]);
      pts.push([x, S(cx)]);
    }
    const inSeg = (x) => x >= seg[0][0] - 1 && x <= seg[seg.length - 1][0] + 1;
    // ladera de delante
    const bank = pts.map(([x, y]) => [x, y + 14]).concat([[xb, BOTTOM + 10], [xa, BOTTOM + 10]]);
    Paint.wash(g, bank, '#8f8c4f', { layers: 4, alpha: 0.55, amp: 3, seed: 4601 + idx, edge: 0.1, core: 1, vary: '#7b7a43', varyAmt: 0.5 });
    Paint.within(g, bank, () => {
      Paint.wash(g, pts.map(([x, y]) => [x, y + 12]).concat(pts.slice().reverse().map(([x, y]) => [x, y + 70])), '#b5ad62', { layers: 4, alpha: 0.35, amp: 8, seed: 4602 + idx, edge: 0 });
      Paint.shade(g, pts.map(([x, y]) => [x, y + 140]).concat([[xb, BOTTOM + 10], [xa, BOTTOM + 10]]), '#4f5432', { layers: 4, alpha: 0.2, amp: 20, seed: 4603 + idx, edge: 0 });
      // matas de hierba a grandes manchas (baja frecuencia)
      for (let i = 0; i < (xb - xa) / 22; i++) {
        const x = rng.range(xa, xb), y = S(U.clamp(x, seg[0][0], seg[seg.length - 1][0])) + rng.range(30, BOTTOM - 700);
        Paint.wash(g, U.blobPoly(x, y, rng.range(20, 60), rng.range(8, 18), 10, rng, 0.35), rng.pick(['#a5a058', '#88884a', '#c1b66a', '#6f7240', '#9aa060']), { layers: 2, alpha: 0.3, amp: 3, seed: 4610 + idx * 997 + i, edge: 0.1 });
      }
      // piedras redondas medio enterradas en la ladera
      for (let i = 0; i < (xb - xa) / 130; i++) {
        const x = rng.range(xa + 40, xb - 40);
        if (!inSeg(x)) continue;
        const y = S(x) + rng.range(60, 260), r = rng.range(16, 46);
        boulder(g, x, y, r, r * rng.range(0.55, 0.7), rng, 4700 + idx * 991 + i);
      }
      // flores en la ladera (más abajo, más grandes)
      for (let i = 0; i < (xb - xa) / 46; i++) {
        const x = rng.range(xa, xb);
        if (!inSeg(x)) continue;
        flowerCluster(g, x, S(x) + rng.range(40, 230), rng.int(2, 5), rng, 4800 + idx * 983 + i);
      }
    });
    // camino de tierra clara: banda ancha y tranquila, con piedras planas de poco contraste
    const runs = JHS.Scenery.surfaceRuns(seg);
    for (const run of runs) {
      const rpts = U.resample(run, 12).filter(([x]) => x >= xa - 12 && x <= xb + 12);
      if (rpts.length < 2) continue;
      const top = rpts.map(([x, y]) => [x, y - 16 + Math.sin(x * 0.02) * 1.5]);
      const bot = rpts.map(([x, y]) => [x, y + 18 + Math.sin(x * 0.013 + 1) * 2]).reverse();
      const band = top.concat(bot);
      Paint.wash(g, band, C.path, { layers: 4, alpha: 0.6, amp: 1.5, seed: 4901 + idx, edge: 0.1, core: 1, vary: '#ead0a0', varyAmt: 0.5 });
      Paint.within(g, band, () => {
        Paint.shade(g, rpts.map(([x, y]) => [x, y + 8]).concat(bot), C.pathShade, { layers: 3, alpha: 0.18, amp: 3, seed: 4902 + idx, edge: 0 });
        for (let i = 0; i < rpts.length / 4; i++) {
          const [x, y] = rpts[Math.floor(rng.next() * rpts.length)];
          Paint.wash(g, U.blobPoly(x + rng.range(-6, 6), y + rng.range(-8, 12), rng.range(6, 14), rng.range(2.5, 4.5), 8, rng, 0.25), rng.pick(['#e3c895', '#f6e4bb', '#d8bd8a']), { layers: 2, alpha: 0.4, amp: 0.4, seed: 4910 + idx * 991 + i, edge: 0.15 });
        }
      });
      // borde de delante del camino: línea clara de tinta y hierba que cuelga
      Paint.ink(g, rpts.map(([x, y]) => [x, y + 18]), { w: 1.6, alpha: 0.5, color: '#7a5f3c', seed: 4920 + idx, breaks: 0.3, sketch: 0.4 });
      kit().grassFringe(g, rpts.map(([x, y]) => [x, y + 20]), U.makeRng(4921 + idx), 0.45);
      // borde de detrás: la tinta del borde superior del suelo, clara y continua
      Paint.ink(g, top, { w: 2.2, alpha: 0.7, color: '#6a4e30', seed: 4922 + idx, breaks: 0.12, sketch: 0.5, bleed: 0.6 });
    }
    // capa 3 detrás del camino: hierba alta, arbustos, cercas y acequia
    const backY = (x) => S(x) - 16;
    for (let x = xa; x < xb; x += rng.range(110, 190)) {
      if (!inSeg(x) || (x > 1860 && x < 2240)) continue;
      const kind = x < 1600 ? rng.pick(['lavender', 'round', 'broom']) : x > 5000 ? rng.pick(['broom', 'round']) : rng.pick(['round', 'broom', 'lavender']);
      bush(g, x, backY(x) + 2, rng.range(18, 34), rng, 5000 + Math.round(x), kind);
    }
    for (const [fa, fb2] of [[2300, 2620], [3360, 4660], [7800, 8240]]) {
      const a = Math.max(fa, xa), b = Math.min(fb2, xb);
      if (b - a > 40) fence(g, a, b, (x) => backY(x), rng, 5100 + Math.round(a));
    }
    // lecho de la acequia (el agua es una capa de estado)
    const ca = Math.max(L.canal[0], xa), cb = Math.min(L.canal[1], xb);
    if (cb - ca > 20) {
      const cpts = [];
      for (let x = ca; x <= cb; x += 12) cpts.push([x, backY(x) - 6]);
      const bed = cpts.map(([x, y]) => [x, y - 5]).concat(cpts.slice().reverse().map(([x, y]) => [x, y + 6]));
      Paint.wash(g, bed, '#9a7f5e', { layers: 3, alpha: 0.75, amp: 0.4, seed: 5200 + idx, edge: 0.25, core: 1 });
      Paint.within(g, bed, () => {
        for (let x = ca; x < cb; x += 9) { g.strokeStyle = U.rgba('#6e573f', 0.5); g.lineWidth = 0.6; g.beginPath(); g.moveTo(x, backY(x) - 9); g.lineTo(x + rng.range(-3, 3), backY(x) - 3); g.stroke(); }
      });
      // piedras del borde delantero de la acequia
      for (let x = ca; x < cb; x += rng.range(14, 22)) Paint.wash(g, U.blobPoly(x, backY(x) + 1, rng.range(6, 10), rng.range(3, 4.5), 8, rng, 0.2), rng.pick(['#c2b39f', '#ab9c88', '#d1c3ae']), { layers: 2, alpha: 0.9, amp: 0.3, seed: 5210 + Math.round(x), edge: 0.35, core: 1 });
    }
    kit().grassFringe(g, pts.filter(([x]) => inSeg(x)).map(([x, y]) => [x, y - 16]), U.makeRng(5300 + idx), 0.5);
  }

  // El arroyo: estribos de piedra seca a cada lado, el agua que viene del fondo hacia nosotros
  // entre orillas de piedras redondas, un caballete de madera bajo el puente y saltitos de agua.
  function paintStream(g, L, gap, rng, life) {
    const yb = L.gy(gap.x0), x0 = gap.x0, x1 = gap.x1, cx = (x0 + x1) / 2;
    const yw = yb + 182;
    // lecho y agua que se ensancha hacia delante
    const water = [[cx - 40, yb - 40], [cx + 40, yb - 40], [x1 - 6, yw + 40], [x1 - 6, L.bottom], [x0 + 6, L.bottom], [x0 + 6, yw + 40]];
    Paint.wash(g, water, C.water, { layers: 4, alpha: 0.8, amp: 2, seed: 5401, edge: 0.25, core: 1, vary: C.waterDeep, varyAmt: 0.5 });
    Paint.within(g, water, () => {
      const gr = g.createLinearGradient(0, yb - 40, 0, yw + 80);
      gr.addColorStop(0, 'rgba(240,233,218,0.6)');
      gr.addColorStop(1, 'rgba(240,233,218,0)');
      g.fillStyle = gr; g.fillRect(x0, yb - 40, x1 - x0, yw + 80 - yb + 40);
      Paint.shade(g, [[x0, yw + 60], [x1, yw + 60], [x1, L.bottom], [x0, L.bottom]], '#5f7478', { layers: 3, alpha: 0.18, amp: 6, seed: 5402, edge: 0 });
    });
    // orillas: piedras redondas que bajan hacia nosotros
    for (const side of [-1, 1]) {
      for (let t = 0; t <= 1.001; t += 0.07) {
        const y = U.lerp(yb - 30, L.bottom - 20, t);
        const x = U.lerp(cx + side * 46, side < 0 ? x0 + 10 : x1 - 10, Math.min(1, t * 1.4));
        const r = U.lerp(6, 26, t) * rng.range(0.7, 1.2);
        boulder(g, x + side * rng.range(0, 14), y, r, r * 0.6, rng, 5410 + Math.round(t * 100) + side * 7);
      }
    }
    // piedras en el cauce donde el agua salta hacia delante
    const steps = [[cx - 60, yw + 92, 24], [cx + 40, yw + 96, 22], [cx - 10, yw + 150, 30], [cx + 86, yw + 150, 18], [cx - 100, yw + 156, 16]];
    for (const [x, y, r] of steps) boulder(g, x, y, r, r * 0.55, rng, 5500 + Math.round(x));
    if (life) {
      for (const [x, y, w] of [[cx - 22, yw + 76, 26], [cx + 70, yw + 82, 16], [cx + 14, yw + 134, 30]]) {
        life.falls.push({ x, top: y, bottom: y + 46, w0: w * 0.8, w1: w, k: 0.85, layer: 'play', scale: 0.5, fade: 60, mist: 0 });
      }
      life.stream = { x0: x0 + 20, x1: x1 - 20, y0: yb - 30, y1: L.bottom, cx };
    }
    // caballete central bajo el puente
    for (const px of [cx - 8, cx + 8]) Paint.wash(g, [[px - 4, yb + 10], [px + 4, yb + 10], [px + 5, yw + 70], [px - 5, yw + 70]], C.woodShade, { layers: 3, alpha: 0.9, amp: 0.3, seed: 5600 + px, edge: 0.3, core: 1 });
    Paint.ink(g, [[cx - 40, yb + 60], [cx + 40, yb + 30]], { w: 4, alpha: 0.75, color: C.woodShade, seed: 5602 });
    Paint.ink(g, [[cx - 40, yb + 30], [cx + 40, yb + 60]], { w: 4, alpha: 0.75, color: C.woodShade, seed: 5603 });
    // estribos de piedra seca
    for (const [ax, dir] of [[x0, -1], [x1, 1]]) {
      const xf = ax + dir * 6;
      for (let row = 0; row < 9; row++) {
        const y = yb + 4 + row * 22;
        for (let k = 0; k < 3; k++) {
          const sx = xf + dir * (k * 30 + (row % 2) * 14) - (dir > 0 ? 0 : 30);
          const poly = Props.smoothBlob(sx + 15, y + 10, rng.range(13, 17), rng.range(9, 12), 9, rng, 0.15, 0.7);
          Paint.wash(g, poly, rng.pick(['#b5a690', '#a3947f', '#c4b49c']), { layers: 3, alpha: 0.85, amp: 0.3, seed: 5700 + row * 10 + k + dir, edge: 0.3, core: 1 });
          Paint.within(g, poly, () => Paint.shade(g, [[sx - 4, y + 10], [sx + 34, y + 10], [sx + 34, y + 26], [sx - 4, y + 26]], '#6b5a48', { layers: 2, alpha: 0.25, amp: 1, seed: 5800 + row * 10 + k, edge: 0 }));
          Paint.ink(g, poly, { closed: true, w: 1.1, alpha: 0.55, seed: 5900 + row * 10 + k + dir, breaks: 0.25 });
        }
      }
      Art.bush(g, ax + dir * 30, yb + 196, 22, rng, 5950 + ax, 'round');
    }
  }

  // ------------------------------------------------------------------ primer plano (solo esquinas)
  Art.foregroundSprites = function () {
    const out = [];
    for (let i = 0; i < 5; i++) {
      const rng = U.makeRng(6100 + i * 13);
      out.push(Paint.makeSprite({ w: 560, h: 320, ox: 280, oy: 290, res: 0.8, post: { edge: 0.3, grain: 0.2, density: 0.07, texScale: 1.25 } }, (g) => {
        if (i % 2 === 0) boulder(g, rng.range(-80, 80), -4, rng.range(90, 130), rng.range(50, 70), rng, 6120 + i);
        // matas grandes y desenfocadas: pocas manchas, bordes blandos
        for (let k = 0; k < 16; k++) {
          const x = rng.range(-240, 240), y = -rng.range(0, 110);
          Paint.wash(g, U.blobPoly(x, y, rng.range(30, 80), rng.range(14, 34), 10, rng, 0.35), rng.pick(['#6f7440', '#879049', '#5a6136', '#9aa25a']), { layers: 3, alpha: 0.45, amp: 4, seed: 6130 + i * 40 + k, edge: 0.08 });
        }
        // flores cercanas: margaritas blancas, flores amarillas y espigas rosas, grandes y suaves
        for (let k = 0; k < 26; k++) {
          const x = rng.range(-240, 240), y = -rng.range(30, 200);
          const kind = rng.pick(['daisy', 'yellow', 'yellow', 'pink', 'daisy']);
          Paint.ink(g, [[x, y + 70], [x + rng.range(-8, 8), y]], { w: 2.2, alpha: 0.75, color: '#5f6a34', seed: 6200 + i * 40 + k });
          const R = rng.range(9, 15);
          if (kind === 'pink') {
            for (let j = 0; j < 6; j++) Paint.wash(g, U.blobPoly(x + (j % 2 ? 4 : -4), y - j * 7, R * 0.45, R * 0.55, 8, rng, 0.2), j > 3 ? '#efc2cf' : '#dd92a8', { layers: 2, alpha: 0.75, amp: 0.4, seed: 6300 + i * 60 + k * 6 + j, edge: 0.3 });
          } else {
            const col = kind === 'daisy' ? '#fffaf1' : '#f2c23c';
            for (let j = 0; j < (kind === 'daisy' ? 12 : 7); j++) {
              const a = j / (kind === 'daisy' ? 12 : 7) * U.TAU;
              g.fillStyle = U.rgba(col, 0.88);
              g.beginPath(); g.ellipse(x + Math.cos(a) * R * 0.55, y + Math.sin(a) * R * 0.4, R * 0.5, R * 0.2, a, 0, U.TAU); g.fill();
            }
            g.fillStyle = kind === 'daisy' ? '#eab33a' : '#c27b20';
            g.beginPath(); g.arc(x, y, R * 0.2, 0, U.TAU); g.fill();
          }
        }
      }));
    }
    return out;
  };

  // ------------------------------------------------------------------ puente de tablas
  // Tablas cruzadas sobre dos largueros, barandilla de postes y pasamanos atados con cuerda,
  // apoyado en los estribos. Se dibuja en piezas: los huecos se tapan con tablones remendados.
  Art.bridgeSprites = function (L) {
    const B = L.bridge, x0 = B.x0, x1 = B.x1, y = B.y0, W = x1 - x0;
    const mk = (h, oy, fn, res = 1.4) => Paint.makeSprite({ w: W + 60, h, ox: -(x0 - 30), oy, res, post: POST }, fn);
    const inHole = (x) => B.holes.some(([a, b]) => x > a - 4 && x < b + 4);
    const deck = mk(70, -(y - 20), (g) => {
      const rng = U.makeRng(6501);
      // largueros
      for (const dy of [6, 13]) {
        const pts = [[x0 - 10, y + dy], [x1 + 10, y + dy]];
        Paint.ink(g, pts, { w: 5, alpha: 0.9, color: dy < 10 ? '#7a5a37' : '#5e4329', seed: 6502 + dy });
      }
      // tablas (la cara visible de cada tabla)
      for (let x = x0 + 2, i = 0; x < x1 - 4; x += 21, i++) {
        if (inHole(x + 10)) {
          if (rng.chance(0.5)) Paint.wash(g, [[x + 2, y], [x + 8, y + 1], [x + 7, y + 7], [x + 1, y + 6]], '#8a6a44', { layers: 2, alpha: 0.85, amp: 0.2, seed: 6510 + i, edge: 0.3, core: 1 });
          continue;
        }
        const poly = [[x, y - 3], [x + 19, y - 3.5], [x + 19.5, y + 5], [x + 0.5, y + 5.5]];
        Paint.wash(g, poly, rng.pick([C.wood, '#a8814f', '#94703f', '#b38b57']), { layers: 2, alpha: 0.92, amp: 0.25, seed: 6520 + i, edge: 0.3, core: 1 });
        Paint.wash(g, [[x, y - 3], [x + 19, y - 3.5], [x + 19, y - 1.5], [x, y - 1]], C.woodLight, { layers: 1, alpha: 0.5, amp: 0.1, seed: 6600 + i, edge: 0 });
        Paint.ink(g, poly, { closed: true, w: 0.8, alpha: 0.6, seed: 6700 + i, color: '#4a3220', breaks: 0.15 });
      }
    });
    // tablón remendado (se pone a lo largo sobre los largueros, madera nueva y cuerda nueva)
    const board = (len, seed) => Paint.makeSprite({ w: len + 20, h: 24, ox: 10, oy: 8, res: 1.6, post: POST }, (g) => {
      const rng = U.makeRng(seed);
      const poly = [[0, -3], [len, -4], [len + 1, 5], [0, 6]];
      Paint.wash(g, poly, C.woodNew, { layers: 3, alpha: 0.95, amp: 0.3, seed, edge: 0.3, core: 1, vary: '#e6c48f', varyAmt: 0.4 });
      Paint.within(g, poly, () => { for (let i = 0; i < 4; i++) Paint.ink(g, [[rng.range(2, len * 0.4), rng.range(-1, 3)], [rng.range(len * 0.5, len - 2), rng.range(-1, 3)]], { w: 0.6, alpha: 0.35, color: '#9c7646', seed: seed + i }); });
      Paint.ink(g, poly, { closed: true, w: 1, alpha: 0.75, color: '#5b3d22', seed: seed + 9, breaks: 0.1 });
      for (const rx of [6, len - 6]) { g.strokeStyle = U.rgba('#e9dcc0', 0.95); g.lineWidth = 1.4; g.beginPath(); g.moveTo(rx - 3, -4); g.lineTo(rx + 3, 7); g.moveTo(rx + 2, -4); g.lineTo(rx + 7, 7); g.stroke(); }
    });
    const boards = B.holes.map(([a, b], i) => ({ x: a - 3, spr: board(b - a + 6, 6801 + i) }));
    const carry = board(96, 6809);
    // barandilla: postes y dos pasamanos; rota (tramo central caído) o arreglada
    const rail = (fixed, far) => mk(120, -(y - 90), (g) => {
      const rng = U.makeRng(far ? 6901 : 6951);
      const posts = [];
      for (let x = x0 + 4; x <= x1 - 4; x += 64) posts.push(x);
      const top = y - 66, mid = y - 38;
      const col = far ? '#7d6243' : '#8e6c44';
      for (const x of posts) {
        Paint.wash(g, [[x - 4, y + 4], [x - 3.4, top - 6], [x + 3.6, top - 7], [x + 4, y + 4]], col, { layers: 3, alpha: far ? 0.75 : 0.95, amp: 0.3, seed: 6960 + x, edge: 0.3, core: 1 });
        Paint.ink(g, [[x - 4, y + 4], [x - 3.4, top - 6]], { w: 1, alpha: 0.6, seed: 6965 + x, color: '#3c2a1e' });
      }
      for (const ry of [top, mid]) {
        for (let k = 0; k < posts.length - 1; k++) {
          const a = posts[k], b = posts[k + 1];
          const broken = !fixed && a > B.holes[0][0] - 40 && b < B.holes[2][1] + 60 && (k + (ry === top ? 0 : 1)) % 2 === 0;
          if (broken) {
            // pasamanos partido colgando
            Paint.wash(g, [[a, ry - 2], [a + 26, ry + 14], [a + 24, ry + 18], [a, ry + 3]], col, { layers: 2, alpha: 0.85, amp: 0.2, seed: 6970 + k + ry, edge: 0.3, core: 1 });
            continue;
          }
          const poly = [[a, ry - 2.8], [b, ry - 3.2], [b, ry + 2.8], [a, ry + 3.2]];
          Paint.wash(g, poly, fixed && a > B.holes[0][0] - 40 && b < B.holes[2][1] + 60 ? '#c49a62' : col, { layers: 2, alpha: far ? 0.75 : 0.92, amp: 0.2, seed: 6980 + k + ry, edge: 0.3, core: 1 });
          Paint.ink(g, [[a, ry + 3], [b, ry + 2.8]], { w: 0.8, alpha: 0.5, seed: 6990 + k + ry, color: '#3c2a1e' });
        }
      }
      // ataduras de cuerda en las uniones (las nuevas, más claras)
      for (const x of posts) for (const ry of [top, mid]) {
        g.strokeStyle = U.rgba(fixed ? '#eadcbf' : '#b9a684', 0.95); g.lineWidth = 1.3;
        g.beginPath(); g.moveTo(x - 4, ry - 4); g.lineTo(x + 4, ry + 3); g.moveTo(x - 4, ry); g.lineTo(x + 4, ry + 6); g.stroke();
      }
    });
    return { deck, boards, carry, railBackBroken: rail(false, true), railBackFixed: rail(true, true), railFrontBroken: rail(false, false), railFrontFixed: rail(true, false) };
  };
})(window.JHS = window.JHS || {});
