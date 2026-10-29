/* Mundo 1 — capa 4 de la ficha («Casa de Ester, taller y campos»), en su propio plano de parallax
   (p = 0,9) y pintada completa: bajo cada edificio hay suelo y detrás de cada oclusión hay
   relleno, así el plano puede deslizarse sin dejar huecos. Las ventanas quedan con menos
   contraste que los objetos interactivos (que están todos en el plano jugable), y nada de este
   plano tiene bordes horizontales que parezcan plataformas. */
(function (JHS) {
  'use strict';
  const U = JHS.U, Paint = JHS.Paint, Props = JHS.Props;
  const Art = JHS.M01Art;
  const C = Art.C;

  // De posición de mundo a espacio de esta capa: el objeto queda detrás del punto x del camino
  // cuando la niña pasa por delante (cámara 170 unidades por delante de ella).
  const BP = 0.9, C0X = 960, C0Y = 551, LOOK = 170;
  const BX = Art.BX = (x) => 960 + (x + LOOK - C0X) * BP - LOOK;
  const BY = Art.BY = (y) => 540 + (y - C0Y);
  Art.BACK_P = BP;

  const POST = { edge: 0.32, grain: 0.3, density: 0.08 };
  const cells = (...a) => Art.cells(...a);
  // Colores de copa medidos en el gran árbol del concepto (oliva tostado, luz de miel, sombra parda)
  const LEAF = { mid: '#8f7a3c', dark: '#4a3d1c', lit: '#d4ae58', hi: '#efd18a', deep: '#33290f' };
  const LEAF_OLIVE = { mid: '#8c7d4c', dark: '#4f4627', lit: '#c4ad6c', hi: '#e2cf96', deep: '#3a321b' };

  // ------------------------------------------------------------------ copas en masas
  // Cada masa: lavado medio de borde festoneado, sombra parda en el vientre, luz de miel arriba
  // (hacia el sol), hojitas apretadas que rompen el contorno y una tinta rota bajo la masa.
  function canopyClump(g, x, y, rx, ry, rng, seed, cols = LEAF) {
    const poly = U.blobPoly(x, y, rx, ry, 24, rng, 0.2);
    Paint.wash(g, poly, cols.mid, { layers: 3, alpha: 0.6, amp: Math.max(1, rx * 0.03), seed, edge: 0.12, core: 0.75, vary: cols.lit, varyAmt: 0.25 });
    Paint.within(g, poly, () => {
      Paint.shade(g, U.blobPoly(x - rx * 0.2, y + ry * 0.6, rx * 0.85, ry * 0.5, 14, rng, 0.3), cols.dark, { layers: 3, alpha: 0.2, amp: 3, seed: seed + 1, edge: 0 });
      Paint.wash(g, U.blobPoly(x + rx * 0.22, y - ry * 0.3, rx * 0.76, ry * 0.55, 14, rng, 0.3), cols.lit, { layers: 3, alpha: 0.56, amp: 3, seed: seed + 2, edge: 0 });
      Paint.wash(g, U.blobPoly(x + rx * 0.34, y - ry * 0.5, rx * 0.36, ry * 0.24, 10, rng, 0.3), cols.hi, { layers: 2, alpha: 0.42, amp: 2, seed: seed + 3, edge: 0 });
      // racimos de hojas dentro de la masa (textura de copa, no confeti: en grupitos)
      const nIn = Math.round(rx * ry / 140);
      for (let i = 0; i < nIn; i++) {
        const a = rng.range(0, U.TAU), d = Math.sqrt(rng.next()) * 0.85;
        const px = x + Math.cos(a) * rx * d, py = y + Math.sin(a) * ry * d;
        const up = (y - py) / ry + (px - x) / rx * 0.4;
        const c = up > 0.35 ? cols.hi : up > -0.05 ? cols.lit : up > -0.5 ? cols.mid : cols.dark;
        for (let k = 0; k < 3; k++) {
          g.fillStyle = c; g.globalAlpha = rng.range(0.35, 0.65);
          const r = rng.range(2.5, 5.5);
          g.beginPath(); g.ellipse(px + rng.range(-5, 5), py + rng.range(-3, 3), r, r * 0.6, rng.range(0, 3), 0, U.TAU); g.fill();
        }
      }
    });
    // hojitas en el borde: rompen el contorno de la masa
    const n = Math.round((rx + ry) * 2.4);
    for (let i = 0; i < n; i++) {
      const a = rng.range(0, U.TAU), k = rng.range(0.86, 1.06);
      const px = x + Math.cos(a) * rx * k, py = y + Math.sin(a) * ry * k;
      const s = Math.sin(a), c = s < -0.2 ? (rng.chance(0.5) ? cols.lit : cols.hi) : s > 0.7 && rng.chance(0.5) ? cols.dark : cols.mid;
      const r = rng.range(2.6, 6);
      g.fillStyle = c; g.globalAlpha = rng.range(0.45, 0.8);
      g.beginPath(); g.ellipse(px, py, r, r * 0.6, rng.range(0, 3), 0, U.TAU); g.fill();
    }
    g.globalAlpha = 1;
    const belly = [];
    for (let t = 0.2; t <= 0.8; t += 0.06) { const a = t * Math.PI; belly.push([x + Math.cos(a) * rx * 0.97, y + Math.sin(a) * ry * 0.97]); }
    Paint.ink(g, belly, { w: 1.1, alpha: 0.26, color: '#3a2a12', seed: seed + 5, breaks: 0.55, wobble: 1 });
  }
  Art.canopyClump = canopyClump;

  // Rama de madera: trazo grueso que se afina, con su lado del sol más claro.
  function limb(g, pts, w0, w1, seed, col = '#7a5a32') {
    const R = U.spline(pts, 6, false);
    const L = R.length;
    const left = [], right = [];
    for (let i = 0; i < L; i++) {
      const a = R[Math.max(0, i - 1)], b = R[Math.min(L - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
      const nx = -dy / d, ny = dx / d, w = U.lerp(w0, w1, i / (L - 1)) / 2;
      left.push([R[i][0] + nx * w, R[i][1] + ny * w]);
      right.push([R[i][0] - nx * w, R[i][1] - ny * w]);
    }
    const poly = left.concat(right.reverse());
    Paint.wash(g, poly, col, { layers: 3, alpha: 0.85, amp: 0.6, seed, edge: 0.3, core: 1, vary: '#5f4325', varyAmt: 0.5 });
    Paint.within(g, poly, () => {
      Paint.wash(g, left.concat(R.slice().reverse()), '#c49a62', { layers: 2, alpha: 0.35, amp: 1, seed: seed + 1, edge: 0 });
      Paint.shade(g, right.slice().reverse().concat(R), '#3e2a14', { layers: 2, alpha: 0.3, amp: 1, seed: seed + 2, edge: 0 });
    });
    Paint.ink(g, right.slice().reverse(), { w: 1.4, alpha: 0.55, color: '#33220f', seed: seed + 3, breaks: 0.3 });
    return poly;
  }

  // ------------------------------------------------------------------ plano 4
  Art.paintBack = function (layer, L, life) {
    const x0 = layer.x0, x1 = layer.x1;
    const gyB = (x) => BY(L.gy(x));
    // ---- tira continua de prado (con relleno hasta abajo). Todo su contenido está anclado al
    // espacio de la capa: las cajas vecinas pintan lo mismo donde se solapan.
    const step = 24, top = [];
    for (let wx = -900; wx <= 10900; wx += step) top.push([BX(wx), gyB(wx) - 52 + Math.sin(wx * 0.004) * 6]);
    const topAt = (sx) => { const wx = (sx - 79) / BP; return gyB(wx) - 52 + Math.sin(wx * 0.004) * 6; };
    const stripPoly = top.concat([[top[top.length - 1][0], gyB(10900) + 260], [top[0][0], gyB(-900) + 260]]);
    for (let bx = x0; bx < x1; bx += 1800) {
      const bw = Math.min(1800, x1 - bx) + 60;
      JHS.Layers.paintOnce(layer, { x: bx - 30, y: 0, w: bw, h: layer.y1 }, (g) => {
        Paint.wash(g, stripPoly, C.meadow, { layers: 3, alpha: 0.5, amp: 3, seed: 2402, edge: 0.15, core: 1, vary: C.sage, varyAmt: 0.4 });
        Paint.within(g, stripPoly, () => {
          // luz dorada en el borde de arriba y hierba más honda hacia abajo
          Paint.wash(g, top.map(([x, y]) => [x, y - 2]).concat(top.slice().reverse().map(([x, y]) => [x, y + 18])), C.meadowLit, { layers: 3, alpha: 0.35, amp: 4, seed: 2403, edge: 0 });
          Paint.shade(g, top.map(([x, y]) => [x, y + 40]).concat(top.slice().reverse().map(([x, y]) => [x, y + 220])), C.leafDeep, { layers: 3, alpha: 0.18, amp: 12, seed: 2404, edge: 0 });
          cells(bx - 40, bx + bw + 40, 26, 2410, (r, cx) => {
            const x = cx + r.range(0, 26);
            const y = topAt(x) + 12 + r.range(0, 70);
            Paint.wash(g, U.blobPoly(x, y, r.range(14, 40), r.range(4, 9), 10, r, 0.35), r.pick([C.leaf, C.sage, C.leafLit, C.meadowLit, C.leafMid]), { layers: 2, alpha: 0.28, amp: 2, seed: r.int(1, 1e6), edge: 0.1 });
          });
          // matitas de flores amarillas y blancas a lo lejos
          cells(bx - 40, bx + bw + 40, 40, 2420, (r, cx) => {
            if (!r.chance(0.5)) return;
            const x = cx + r.range(0, 40), y = topAt(x) + r.range(14, 60);
            for (let k = 0; k < r.int(2, 6); k++) Paint.softBlob(g, x + r.range(-10, 10), y + r.range(-3, 3), r.range(1.4, 2.4), r.chance(0.6) ? '#f2c94a' : '#fbf4e2', 0.9);
          });
        });
        // briznas del borde de arriba
        g.lineCap = 'round';
        cells(bx - 40, bx + bw + 40, 5, 2430, (r, cx) => {
          if (!r.chance(0.45)) return;
          const x = cx + r.range(0, 5), y = topAt(x) + 3, h = r.range(4, 11), lean = r.range(-0.5, 0.6);
          g.strokeStyle = r.pick([C.leaf, C.leafMid, C.grassLit, C.leafDeep]); g.globalAlpha = r.range(0.55, 0.9); g.lineWidth = r.range(0.9, 1.8);
          g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + lean * h * 0.3, y - h * 0.6, x + lean * h, y - h); g.stroke();
        });
        g.globalAlpha = 1;
      }, POST);
    }

    // ---- el arroyo atraviesa el prado detrás del puente y se aleja hacia la cascada
    const sx0 = BX(1890), sx1 = BX(2210), scx = (sx0 + sx1) / 2;
    JHS.Layers.paintOnce(layer, { x: sx0 - 140, y: gyB(2050) - 220, w: sx1 - sx0 + 280, h: 560 }, (g) => {
      const rng = U.makeRng(2450);
      const yb = gyB(2050);
      const half = (y) => U.lerp(10, (sx1 - sx0) / 2 - 40, U.smoothstep(yb - 74, yb + 220, y));
      const bend = (y) => Math.sin((y - yb) * 0.03) * 10 * (1 - U.smoothstep(yb - 40, yb + 160, y));
      const Lp = [], Rp = [];
      for (let y = yb - 74; y <= yb + 260; y += 8) { Lp.push([scx - half(y) + bend(y), y]); Rp.push([scx + half(y) + bend(y), y]); }
      const water = Lp.concat(Rp.slice().reverse());
      Paint.within(g, water, () => {
        const gr = g.createLinearGradient(0, yb - 74, 0, yb + 260);
        gr.addColorStop(0, '#d9d3c0'); gr.addColorStop(0.3, '#b9bcae'); gr.addColorStop(1, '#9aa39c');
        g.fillStyle = gr; g.fillRect(sx0 - 140, yb - 80, sx1 - sx0 + 280, 350);
        for (let i = 0; i < 30; i++) {
          const y = rng.range(yb - 60, yb + 240), w = rng.range(4, 18) * (0.4 + (y - yb + 74) / 300);
          const x = scx + bend(y) + rng.range(-0.8, 0.8) * half(y);
          Paint.ink(g, [[x - w, y], [x + w, y + rng.range(-0.6, 0.6)]], { w: 1.2, alpha: 0.6, color: C.waterLit, seed: 2451 + i, taper: 0.5 });
        }
      });
      // orillas: hierba oscura, piedras redondas y juncos
      for (const [B, side] of [[Lp, -1], [Rp, 1]]) {
        Paint.ink(g, B, { w: 2.2, alpha: 0.45, seed: 2460 + side, breaks: 0.3, color: '#5a4a24' });
        for (let i = 0; i < B.length; i += 2) {
          const [x, y] = B[i];
          const s = 0.5 + (y - yb + 74) / 260;
          if (rng.chance(0.65)) Paint.wash(g, U.blobPoly(x + side * rng.range(0, 8), y, rng.range(5, 12) * s, rng.range(3, 6) * s, 9, rng, 0.25), rng.pick([C.stone, C.stoneShade, '#a08463']), { layers: 2, alpha: 0.8, amp: 0.5, seed: 2470 + i * 2 + side, edge: 0.3, core: 1 });
          if (rng.chance(0.4)) Art.tuft(g, x + side * rng.range(6, 16), y + 2, 9 * s, rng);
        }
      }
      // arriba se funde con el prado (el arroyo viene de lejos)
      g.save();
      g.globalCompositeOperation = 'destination-out';
      const fd = g.createLinearGradient(0, yb - 80, 0, yb - 30);
      fd.addColorStop(0, 'rgba(0,0,0,1)'); fd.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = fd; g.fillRect(sx0 - 140, yb - 90, sx1 - sx0 + 280, 60);
      g.restore();
    }, POST);

    // ---- el gran árbol que enmarca la esquina de arriba al empezar (concepto)
    const tx = BX(112), tb = gyB(112) - 46;
    JHS.Layers.paintOnce(layer, { x: tx - 300, y: -60, w: 1040, h: tb + 120 }, (g) => paintBigTree(g, tx, tb), POST);

    // ---- la casa de Ester
    const hx = BX(850), hb = gyB(1100) - 44;
    JHS.Layers.paintOnce(layer, { x: hx - 90, y: hb - 420, w: 720, h: 480 }, (g) => paintHouse(g, hx, hb, life), POST);

    // ---- taller: estructura común a todos los estados
    const wx = BX(2640), wb = gyB(2900) - 46;
    JHS.Layers.paintOnce(layer, { x: wx - 60, y: wb - 330, w: 660, h: 370 }, (g) => paintWorkshop(g, wx, wb), POST);
    Art.workshopAt = { x: wx, y: wb };

    // ---- huerta: tierra labrada en caballones (los cultivos son capas de estado)
    const fx0 = BX(3420), fx1 = BX(4600), fb = gyB(4000) - 50;
    JHS.Layers.paintOnce(layer, { x: fx0 - 60, y: fb - 130, w: fx1 - fx0 + 120, h: 170 }, (g) => paintFields(g, fx0, fx1, fb), POST);
    Art.fieldsAt = { x0: fx0, x1: fx1, y: fb };

    // ---- cipreses y olivos sueltos por el fondo
    const spots = [[1500, 'olive'], [2450, 'cypress'], [2510, 'cypress'], [3300, 'cypress'], [3360, 'olive'],
      [4700, 'cypress'], [4760, 'cypress'], [4820, 'cypress'], [5300, 'olive'], [5900, 'olive'], [6500, 'cypress'], [6560, 'cypress'], [7900, 'olive'], [8700, 'cypress'], [8760, 'cypress']];
    for (const [wx2, kind] of spots) {
      const tr = U.makeRng(2470 + wx2);
      const x = BX(wx2), y = gyB(wx2) - 56;
      const h = kind === 'cypress' ? tr.range(150, 210) : tr.range(80, 100);
      JHS.Layers.paintOnce(layer, { x: x - 100, y: y - h - 50, w: 200, h: h + 70 }, (g) => {
        if (kind === 'cypress') Art.cypress(g, x, y, h, tr, tr.chance(0.5) ? C.cypress : '#555137');
        else paintOlive(g, x, y, h, tr);
      }, POST);
    }

    // ---- la subida a la Colina de las Piedras: olivar en ladera con restos de muretes (sin
    // bordes rectos que parezcan repisas) y la torre vieja en ruinas
    JHS.Layers.paintOnce(layer, { x: BX(4980), y: gyB(6600) - 300, w: BX(6700) - BX(4980), h: gyB(5000) - gyB(6600) + 320 }, (g) => paintGrove(g, L), POST);
    const rx = BX(7300), rb = gyB(7300) - 54;
    JHS.Layers.paintOnce(layer, { x: rx - 220, y: rb - 340, w: 560, h: 380 }, (g) => paintRuin(g, rx, rb), POST);
    Art.ruinAt = { x: rx, y: rb };
  };

  // ------------------------------------------------------------------ piezas
  function leafMass(g, x, y, rx, ry, rng, n, cols, seed) {
    for (let i = 0; i < n; i++) {
      const a = rng.range(0, U.TAU), d = Math.sqrt(rng.next());
      const px = x + Math.cos(a) * rx * d, py = y + Math.sin(a) * ry * d;
      const r = rng.range(5, 11);
      Paint.wash(g, U.blobPoly(px, py, r, r * rng.range(0.5, 0.8), 7, rng, 0.35, rng.range(0, 3)), rng.pick(cols), { layers: 2, alpha: rng.range(0.4, 0.65), amp: 0.6, seed: seed + i, edge: 0.25 });
    }
  }
  Art.leafMass = leafMass;

  // El gran árbol (concepto, arriba a la izquierda): tronco nudoso que se abre en dos brazos y una
  // copa de masas ocres con la luz de miel del lado del sol, que enmarca el cielo.
  function paintBigTree(g, x, base) {
    const rng = U.makeRng(2501);
    // copa de detrás (más oscura, más lejos)
    const back = [[x - 170, base - 586, 124, 96], [x + 40, base - 656, 144, 108], [x + 270, base - 636, 134, 100], [x + 460, base - 576, 110, 84], [x - 300, base - 526, 96, 74]];
    const dim = { mid: '#7a6833', dark: '#3e3317', lit: '#b7964c', hi: '#d4b674', deep: '#2b220c' };
    for (const [cx, cy, rx, ry] of back) canopyClump(g, cx, cy, rx, ry, rng, 2600 + cx, dim);
    // tronco y ramas
    const trunk = [[x - 46, base + 6], [x - 40, base - 90], [x - 50, base - 190], [x - 30, base - 300], [x + 4, base - 380]];
    limb(g, trunk.map(([a, b]) => [a + 18, b]), 92, 56, 2510, '#7f5d33');
    limb(g, [[x + 4, base - 360], [x + 70, base - 440], [x + 180, base - 520], [x + 330, base - 590]], 46, 14, 2520);
    limb(g, [[x - 10, base - 360], [x - 70, base - 450], [x - 150, base - 530], [x - 230, base - 580]], 40, 12, 2530);
    limb(g, [[x + 10, base - 380], [x + 30, base - 480], [x + 60, base - 600]], 30, 10, 2540);
    limb(g, [[x + 150, base - 505], [x + 220, base - 520], [x + 300, base - 500], [x + 420, base - 470]], 18, 6, 2550);
    // raíces que se agarran al prado
    for (const [dx, len] of [[-70, -60], [-30, -26], [30, 34], [64, 58]]) limb(g, [[x + dx * 0.3 - 14, base - 12], [x + dx * 0.7 - 14, base - 2], [x + dx + len * 0.3 - 14, base + 6]], 16, 4, 2560 + dx);
    // nudos y corteza
    Paint.ink(g, [[x - 26, base - 160], [x - 18, base - 176], [x - 8, base - 168]], { w: 1.6, alpha: 0.5, color: '#33220f', seed: 2570 });
    for (let i = 0; i < 16; i++) {
      const yy = base - rng.range(20, 330), xx = x - 30 + rng.range(-12, 30);
      Paint.ink(g, [[xx, yy], [xx + rng.range(-3, 3), yy - rng.range(20, 46)]], { w: 0.8, alpha: 0.35, color: '#3a2812', seed: 2571 + i, taper: 0.6 });
    }
    // copa de delante: masas en los extremos de las ramas
    const front = [[x - 250, base - 524, 100, 78], [x - 100, base - 480, 92, 72], [x + 70, base - 524, 110, 86], [x + 236, base - 552, 106, 82], [x + 390, base - 510, 98, 76],
      [x + 530, base - 480, 80, 62], [x - 40, base - 610, 102, 80], [x + 160, base - 664, 106, 80], [x + 350, base - 634, 92, 72], [x - 200, base - 634, 92, 72],
      [x - 330, base - 564, 76, 60], [x + 470, base - 604, 68, 54], [x + 20, base - 704, 82, 62], [x + 270, base - 704, 74, 58]];
    for (const [cx, cy, rx, ry] of front) canopyClump(g, cx, cy, rx, ry, rng, 2700 + cx + cy);
    // hojitas sueltas al sol y algunas que caen
    for (let i = 0; i < 40; i++) Paint.softBlob(g, x + rng.range(-300, 560), base - 600 + rng.range(-110, 130), rng.range(2, 4), '#f4dc98', 0.5);
    Art.tuft(g, x - 40, base + 4, 16, rng);
    Art.tuft(g, x + 40, base + 4, 14, rng);
  }

  function paintOlive(g, x, y, h, rng) {
    const trunk = [[x - 4, y + 2], [x - 2, y - h * 0.3], [x - 10, y - h * 0.52], [x - 16, y - h * 0.64]];
    limb(g, trunk, h * 0.09, h * 0.04, Math.round(x), '#7d6448');
    limb(g, [[x - 2, y - h * 0.3], [x + 8, y - h * 0.5], [x + 18, y - h * 0.66]], h * 0.06, h * 0.03, Math.round(x) + 7, '#7d6448');
    canopyClump(g, x - h * 0.12, y - h * 0.72, h * 0.34, h * 0.2, rng, Math.round(x * 3), LEAF_OLIVE);
    canopyClump(g, x + h * 0.2, y - h * 0.78, h * 0.3, h * 0.18, rng, Math.round(x * 3) + 11, LEAF_OLIVE);
    canopyClump(g, x + h * 0.02, y - h * 0.94, h * 0.3, h * 0.16, rng, Math.round(x * 3) + 23, LEAF_OLIVE);
  }
  Art.paintOlive = paintOlive;

  // Piedras de un muro de mampostería: hiladas irregulares, cada piedra con su luz de miel arriba,
  // su junta oscura y un contorno roto (concepto: casa y taller de piedra cálida).
  function masonry(g, x0, y0, x1, y1, rng, seed, o = {}) {
    const cols = o.cols || ['#d7ad6a', '#c99a55', '#e0bb7c', '#b98a4c', '#cfa35f'];
    for (let y = y0, row = 0; y < y1 - 4; row++) {
      const rh = Math.min(rng.range(o.hmin || 12, o.hmax || 20), y1 - y);
      let x = x0 - rng.range(0, 12);
      while (x < x1) {
        const w = rng.range(o.wmin || 18, o.wmax || 34);
        const sd = seed + row * 131 + Math.round(x);
        if (!o.skip || !o.skip(x + w / 2, y + rh / 2)) {
          const poly = U.blobPoly(x + w / 2, y + rh / 2, w / 2 - 1, rh / 2 - 0.8, 9, rng, 0.14);
          Paint.wash(g, poly, rng.pick(cols), { layers: 2, alpha: o.alpha || 0.45, amp: 0.4, seed: sd, edge: 0.28 });
          Paint.wash(g, [[x + 2, y + 1], [x + w - 2, y + 1], [x + w - 3, y + rh * 0.34], [x + 3, y + rh * 0.38]], o.lit || '#f3d396', { layers: 1, alpha: 0.3, amp: 0.3, seed: sd + 1, edge: 0 });
          if (rng.chance(0.7)) Paint.ink(g, poly.slice(3, 9), { w: 0.8, alpha: 0.42, color: o.joint || '#5a3714', seed: sd + 2, breaks: 0.3 });
        }
        x += w + rng.range(0.5, 2.5);
      }
      y += rh + rng.range(0.5, 2);
    }
  }

  // Casa de Ester (concepto): muro de piedra cálida con zócalo de piedras grandes, puerta de
  // madera, farol de vidrio y campana (encendido desde el principio), ventana con contraventanas y
  // jardinera, tejado grueso de tablillas con alero, chimenea de piedra, porche con parra,
  // jazmín blanco por el muro, macetas, barril y escalones.
  function paintHouse(g, x, base, life) {
    const rng = U.makeRng(2601);
    const W = 420, Hw = 200;
    const wall = [[x, base], [x, base - Hw], [x + W, base - Hw], [x + W, base]];
    Paint.shade(g, [[x - 30, base - 6], [x + W + 140, base - 6], [x + W + 150, base + 16], [x - 40, base + 16]], '#4a3418', { layers: 3, alpha: 0.28, amp: 4, seed: 2602, edge: 0 });
    Paint.wash(g, wall, '#c99a55', { layers: 4, alpha: 0.6, amp: 1.5, seed: 2603, edge: 0.3, core: 1, vary: '#b47e2f', varyAmt: 0.5 });
    const dx = x + 46, dw = 66, dh = 132;
    const wx = x + 250, wy = base - 140, ww = 58, wh = 64;
    Paint.within(g, wall, () => {
      masonry(g, x, base - Hw + 6, x + W, base - 30, rng, 2610, { skip: (sx, sy) => (sx > dx - 8 && sx < dx + dw + 8 && sy > base - dh - 12) || (sx > wx - 10 && sx < wx + ww + 10 && sy > wy - 10 && sy < wy + wh + 10) });
      // zócalo de piedras grandes, más oscuras
      masonry(g, x, base - 32, x + W, base, rng, 2650, { cols: ['#a9824c', '#9a7442', '#b48d55'], hmin: 14, hmax: 18, wmin: 30, wmax: 52, alpha: 0.6, skip: (sx) => sx > dx - 4 && sx < dx + dw + 4 });
      // el sol entra por la derecha; sombra bajo el alero y en el lado izquierdo
      Paint.wash(g, [[x + W * 0.5, base - Hw], [x + W, base - Hw], [x + W, base], [x + W * 0.58, base]], '#f6d79a', { layers: 3, alpha: 0.28, amp: 6, seed: 2604, edge: 0 });
      Paint.shade(g, [[x, base - Hw], [x + W, base - Hw], [x + W, base - Hw + 40], [x, base - Hw + 48]], '#6b4519', { layers: 3, alpha: 0.36, amp: 3, seed: 2605, edge: 0 });
      Paint.shade(g, [[x, base - Hw], [x + 60, base - Hw], [x + 44, base], [x, base]], '#7c5022', { layers: 3, alpha: 0.24, amp: 6, seed: 2606, edge: 0 });
    });
    Paint.ink(g, [[x, base], [x, base - Hw]], { w: 1.6, alpha: 0.55, seed: 2607, breaks: 0.2, color: '#4a2f14' });
    Paint.ink(g, [[x + W, base - Hw], [x + W, base]], { w: 1.4, alpha: 0.45, seed: 2608, breaks: 0.3, color: '#4a2f14' });
    // puerta de madera con dintel de piedra, herrajes y un ventanuco de luz tenue
    const door = [[dx, base], [dx, base - dh + 26], [dx + dw * 0.5, base - dh - 4], [dx + dw, base - dh + 26], [dx + dw, base]];
    const doorS = U.spline(door, 3, false).concat([[dx + dw, base], [dx, base]]);
    Paint.wash(g, U.blobPoly(dx + dw / 2, base - dh / 2 - 4, dw / 2 + 12, dh / 2 + 16, 14, rng, 0.08), '#b8a189', { layers: 2, alpha: 0.55, amp: 0.6, seed: 2620, edge: 0.3 });
    Paint.wash(g, doorS, '#a7692b', { layers: 4, alpha: 0.7, amp: 0.4, seed: 2621, edge: 0.3, core: 1, vary: '#8a5420', varyAmt: 0.5 });
    Paint.within(g, doorS, () => {
      for (let i = 1; i < 5; i++) Paint.ink(g, [[dx + i * dw / 5, base - dh], [dx + i * dw / 5, base]], { w: 0.9, alpha: 0.5, seed: 2622 + i, color: '#4a2408' });
      Paint.shade(g, [[dx, base - dh], [dx + dw * 0.3, base - dh], [dx + dw * 0.3, base], [dx, base]], '#5a2c08', { layers: 2, alpha: 0.28, amp: 1, seed: 2627, edge: 0 });
      Paint.wash(g, [[dx + dw * 0.65, base - dh], [dx + dw, base - dh], [dx + dw, base], [dx + dw * 0.7, base]], '#e0a865', { layers: 2, alpha: 0.25, amp: 1, seed: 2628, edge: 0 });
      for (const hy of [base - 100, base - 34]) Paint.ink(g, [[dx + 4, hy], [dx + 30, hy]], { w: 2, alpha: 0.65, color: '#2f2216', seed: 2629 + hy });
    });
    Paint.ink(g, doorS, { closed: true, w: 1.6, alpha: 0.75, seed: 2630, breaks: 0.15, color: '#3a2410' });
    g.fillStyle = U.rgba('#f4c46a', 0.7); g.fillRect(dx + 22, base - 102, 20, 24);
    Paint.ink(g, [[dx + 22, base - 102], [dx + 42, base - 102], [dx + 42, base - 78], [dx + 22, base - 78], [dx + 22, base - 102]], { w: 1, alpha: 0.6, seed: 2631, color: '#3a2410' });
    // farol junto a la puerta: brazo de hierro y la misma silueta de vidrio y campana
    const lx = dx + dw + 34, ly = base - 128;
    Paint.ink(g, [[lx - 30, ly - 34], [lx + 6, ly - 34], [lx + 6, ly - 26]], { w: 2.8, alpha: 0.85, color: '#3c2a1e', seed: 2632 });
    Paint.ink(g, [[lx - 30, ly - 20], [lx - 6, ly - 34]], { w: 1.6, alpha: 0.75, color: '#3c2a1e', seed: 2633 });
    Art.drawLanternShape(g, lx + 6, ly - 26, 1.25, true);
    if (life) life.houseLamp = { x: lx + 6, y: ly + 12 };
    // ventana con contraventanas abiertas y jardinera de flores amarillas
    Paint.wash(g, [[wx - 6, wy - 6], [wx + ww + 6, wy - 6], [wx + ww + 6, wy + wh + 6], [wx - 6, wy + wh + 6]], '#c7b08f', { layers: 2, alpha: 0.7, amp: 0.3, seed: 2640, edge: 0.3 });
    Paint.wash(g, [[wx, wy], [wx + ww, wy], [wx + ww, wy + wh], [wx, wy + wh]], '#6e4e36', { layers: 3, alpha: 0.75, amp: 0.3, seed: 2641, edge: 0.3, core: 1 });
    Paint.ink(g, [[wx + ww / 2, wy], [wx + ww / 2, wy + wh]], { w: 1.4, alpha: 0.6, color: '#3c2a1e', seed: 2642 });
    Paint.ink(g, [[wx, wy + wh / 2], [wx + ww, wy + wh / 2]], { w: 1.4, alpha: 0.6, color: '#3c2a1e', seed: 2643 });
    for (const sx of [wx - 26, wx + ww + 2]) {
      Paint.wash(g, [[sx, wy - 4], [sx + 24, wy - 4], [sx + 24, wy + wh + 4], [sx, wy + wh + 4]], '#7d8a5c', { layers: 3, alpha: 0.7, amp: 0.3, seed: 2644 + sx, edge: 0.3, core: 1 });
      for (let k = 1; k < 3; k++) Paint.ink(g, [[sx + k * 8, wy - 2], [sx + k * 8, wy + wh + 2]], { w: 0.8, alpha: 0.45, seed: 2646 + sx + k, color: '#3f4a2c' });
    }
    if (life) life.windows.push({ x: wx + ww / 2, y: wy + wh / 2, ph: 0.3, layer: 'back', k: 0, s: 3.4, id: 'houseWindow' });
    Paint.wash(g, [[wx - 10, wy + wh + 6], [wx + ww + 10, wy + wh + 6], [wx + ww + 6, wy + wh + 22], [wx - 6, wy + wh + 22]], '#9a6a3a', { layers: 2, alpha: 0.85, amp: 0.3, seed: 2650, edge: 0.3, core: 1 });
    leafMass(g, wx + ww / 2, wy + wh + 2, ww / 2 + 8, 8, rng, 26, [C.leaf, C.leafDeep, '#f0c040', '#f7d35a'], 2651);
    // tejado grueso de tablillas con alero
    const rL = x - 36, rR = x + W + 38, rY = base - Hw - 4, peak = base - Hw - 124;
    const roof = [[rL, rY + 6], [rL + 30, rY - 30], [x + W * 0.42, peak], [x + W * 0.58, peak - 2], [rR - 26, rY - 26], [rR, rY + 4], [rR - 4, rY + 16], [rL + 4, rY + 18]];
    const roofS = U.spline(roof, 2, true);
    Paint.wash(g, roofS, '#a9824e', { layers: 4, alpha: 0.7, amp: 1.2, seed: 2660, edge: 0.3, core: 1, vary: '#bd9055', varyAmt: 0.5 });
    Paint.within(g, roofS, () => {
      // hileras de tablillas, cada una con su sombra bajo el canto
      for (let r = 0; r < 10; r++) {
        const y = rY + 10 - r * 13;
        const half = U.lerp((rR - rL) / 2, 44, r / 10);
        const cxr = (rL + rR) / 2;
        Paint.shade(g, [[cxr - half, y - 2], [cxr + half, y - 4], [cxr + half, y + 2], [cxr - half, y + 4]], '#5f4220', { layers: 1, alpha: 0.35, amp: 0.5, seed: 2700 + r, edge: 0 });
        for (let sx = cxr - half + rng.range(0, 8); sx < cxr + half; sx += rng.range(10, 16)) Paint.ink(g, [[sx, y], [sx + rng.range(-1, 1), y - 11]], { w: 0.8, alpha: 0.42, color: '#4f3516', seed: 2662 + r * 40 + Math.round(sx) });
      }
      Paint.wash(g, [[x + W * 0.5, peak - 10], [rR + 10, rY - 30], [rR + 10, rY + 20], [x + W * 0.55, rY + 20]], '#f3d08c', { layers: 3, alpha: 0.3, amp: 4, seed: 2661, edge: 0 });
      for (let i = 0; i < 10; i++) Paint.wash(g, U.blobPoly(rL + rng.range(30, rR - rL - 30), rY - rng.range(0, 70), rng.range(8, 18), 4, 8, rng, 0.3), rng.pick([C.leaf, '#8a7d40', C.leafMid]), { layers: 2, alpha: 0.42, amp: 1, seed: 2710 + i, edge: 0.1 });
    });
    Paint.ink(g, [[rL, rY + 6], [rL + 30, rY - 30], [x + W * 0.42, peak], [x + W * 0.58, peak - 2], [rR - 26, rY - 26], [rR, rY + 4]], { w: 1.8, alpha: 0.72, seed: 2711, breaks: 0.2, sketch: 0.3, color: '#3e2810' });
    Paint.wash(g, [[rL, rY + 4], [rR, rY + 2], [rR - 2, rY + 15], [rL + 2, rY + 17]], '#6b4826', { layers: 2, alpha: 0.8, amp: 0.3, seed: 2712, edge: 0.3, core: 1 });
    for (let bxx = rL + 30; bxx < rR - 20; bxx += 46) Paint.wash(g, [[bxx, rY + 15], [bxx + 7, rY + 15], [bxx + 7, rY + 22], [bxx, rY + 22]], '#5a3c1e', { layers: 1, alpha: 0.85, amp: 0.2, seed: 2713 + bxx, edge: 0.3, core: 1 });
    // chimenea de piedra
    const cx = x + W * 0.68, cb = peak + 36;
    Paint.wash(g, [[cx, cb], [cx, cb - 92], [cx + 40, cb - 92], [cx + 40, cb + 10]], '#c9a77d', { layers: 3, alpha: 0.85, amp: 0.6, seed: 2720, edge: 0.3, core: 1, vary: '#a8875f', varyAmt: 0.4 });
    Paint.within(g, [[cx, cb + 10], [cx, cb - 92], [cx + 40, cb - 92], [cx + 40, cb + 10]], () => masonry(g, cx, cb - 90, cx + 40, cb + 10, rng, 2721, { cols: ['#c9a77d', '#b8956a', '#d6b88c'], hmin: 9, hmax: 13, wmin: 12, wmax: 20 }));
    Paint.wash(g, [[cx - 6, cb - 92], [cx + 46, cb - 92], [cx + 46, cb - 100], [cx - 6, cb - 100]], '#8f7558', { layers: 2, alpha: 0.9, amp: 0.3, seed: 2730, edge: 0.3, core: 1 });
    if (life) life.chimneys.push({ x: cx + 20, y: cb - 104, layer: 'back', s: 3.2, k: 1, id: 'houseChimney' });
    // porche a la derecha: pilares, viga y parra
    const px0 = x + W - 10, px1 = x + W + 120;
    for (const ppx of [px0 + 20, px1]) {
      Paint.wash(g, [[ppx, base], [ppx, base - 160], [ppx + 12, base - 160], [ppx + 12, base]], C.wood, { layers: 3, alpha: 0.85, amp: 0.4, seed: 2740 + ppx, edge: 0.3, core: 1, vary: C.woodShade, varyAmt: 0.4 });
      Paint.ink(g, [[ppx, base], [ppx, base - 160]], { w: 1, alpha: 0.5, seed: 2742 + ppx, color: '#3a2410' });
    }
    Paint.wash(g, [[px0 - 10, base - 160], [px1 + 30, base - 164], [px1 + 30, base - 150], [px0 - 10, base - 146]], C.woodShade, { layers: 2, alpha: 0.85, amp: 0.4, seed: 2744, edge: 0.3, core: 1 });
    canopyClump(g, (px0 + px1) / 2 + 10, base - 168, 90, 20, rng, 2745);
    for (let i = 0; i < 6; i++) Paint.ink(g, [[px0 + 20 + i * 22, base - 156], [px0 + 24 + i * 22 + rng.range(-6, 6), base - 120 - rng.range(0, 20)]], { w: 1.1, alpha: 0.6, color: '#5a4a20', seed: 2746 + i, taper: 0.6 });
    // barril bajo el porche
    const bxb = px0 + 52;
    Paint.wash(g, U.spline([[bxb, base], [bxb - 4, base - 30], [bxb + 2, base - 62], [bxb + 44, base - 62], [bxb + 50, base - 30], [bxb + 46, base]], 3, true), '#9b6b38', { layers: 3, alpha: 0.8, amp: 0.4, seed: 2750, edge: 0.3, core: 1 });
    for (const hy of [base - 12, base - 50]) Paint.ink(g, [[bxb - 2, hy], [bxb + 48, hy]], { w: 1.6, alpha: 0.65, color: '#3c2a1e', seed: 2751 + hy });
    // jazmín: masas de hoja por el muro con flores blancas; flores amarillas abajo
    const vine = [];
    for (let i = 0; i < 8; i++) vine.push([x + rng.range(-10, W * 0.4), base - rng.range(50, Hw + 40)]);
    for (const [vx, vy] of vine) canopyClump(g, vx, vy, rng.range(26, 44), rng.range(14, 24), rng, 2760 + Math.round(vx), { mid: '#7d7a3e', dark: '#3f3d1d', lit: '#a9a35a', hi: '#c9c07a', deep: '#2c2a12' });
    for (let i = 0; i < 80; i++) {
      const [vx, vy] = rng.pick(vine);
      const fx = vx + rng.range(-42, 42), fy = vy + rng.range(-22, 22);
      for (let k = 0; k < 5; k++) {
        const a = k / 5 * U.TAU;
        g.fillStyle = U.rgba('#fffaf0', 0.92);
        g.beginPath(); g.ellipse(fx + Math.cos(a) * 2.6, fy + Math.sin(a) * 2.6, 2.4, 1.3, a, 0, U.TAU); g.fill();
      }
      g.fillStyle = '#e9b23a'; g.beginPath(); g.arc(fx, fy, 1, 0, U.TAU); g.fill();
    }
    for (let i = 0; i < 26; i++) Paint.softBlob(g, x + rng.range(-20, 120), base - rng.range(4, 50), rng.range(3, 5), '#f2c23c', 0.8);
    // macetas de barro con flores junto a la puerta
    for (const [mx, mw] of [[dx - 34, 26], [dx + dw + 8, 22]]) {
      Paint.wash(g, [[mx, base - 30], [mx + mw, base - 30], [mx + mw - 4, base], [mx + 4, base]], '#b9693c', { layers: 3, alpha: 0.88, amp: 0.3, seed: 2780 + mx, edge: 0.3, core: 1 });
      leafMass(g, mx + mw / 2, base - 40, mw * 0.7, 14, rng, 18, [C.leaf, '#f2c23c', '#f7d35a'], 2781 + mx);
    }
    // escalones de piedra que bajan hacia el camino
    for (let s = 0; s < 3; s++) {
      const sy = base + 8 + s * 14, sw = 120 + s * 26;
      Paint.wash(g, [[dx - 30 - s * 13, sy - 12], [dx - 30 - s * 13 + sw, sy - 12], [dx - 26 - s * 13 + sw, sy + 2], [dx - 34 - s * 13, sy + 2]], rng.pick(['#c9b296', '#bba486', '#d4bf9f']), { layers: 2, alpha: 0.88, amp: 0.4, seed: 2790 + s, edge: 0.3, core: 1 });
      Paint.ink(g, [[dx - 30 - s * 13, sy - 12], [dx - 30 - s * 13 + sw, sy - 12]], { w: 1, alpha: 0.45, seed: 2795 + s, breaks: 0.3, color: '#4a3218' });
    }
  }

  // Taller (concepto): estructura abierta de madera sobre un muro de piedra enlucida, tejadillo de
  // tablillas, banco de trabajo, barriles, escalera y tablones. Lo que cambia con el uso (luz,
  // herramientas, toldo, farol) va en las capas de estado.
  function paintWorkshop(g, x, base) {
    const rng = U.makeRng(2801);
    const W = 520, Hw = 200;
    Paint.shade(g, [[x - 20, base - 4], [x + W + 30, base - 4], [x + W + 40, base + 14], [x - 30, base + 14]], '#4a3418', { layers: 3, alpha: 0.26, amp: 4, seed: 2802, edge: 0 });
    const wall = [[x + 40, base], [x + 40, base - Hw], [x + W - 20, base - Hw], [x + W - 20, base]];
    Paint.wash(g, wall, '#bf8738', { layers: 4, alpha: 0.6, amp: 1.2, seed: 2803, edge: 0.3, core: 1, vary: '#a86f2c', varyAmt: 0.5 });
    Paint.within(g, wall, () => {
      masonry(g, x + 40, base - Hw + 4, x + W - 20, base, rng, 2804, { cols: ['#c99a55', '#b98a4c', '#d3a865', '#ad7d40'], alpha: 0.35 });
      Paint.shade(g, [[x + 40, base - Hw], [x + W, base - Hw], [x + W, base - Hw + 60], [x + 40, base - Hw + 66]], '#5f3d18', { layers: 3, alpha: 0.38, amp: 3, seed: 2805, edge: 0 });
    });
    // pilares y vigas de madera
    for (const px of [x + 30, x + 250, x + W - 30]) {
      Paint.wash(g, [[px, base], [px, base - Hw - 30], [px + 16, base - Hw - 30], [px + 16, base]], '#895425', { layers: 3, alpha: 0.85, amp: 0.4, seed: 2820 + px, edge: 0.3, core: 1, vary: C.woodShade, varyAmt: 0.5 });
      Paint.wash(g, [[px + 10, base - Hw - 30], [px + 16, base - Hw - 30], [px + 16, base], [px + 10, base]], '#c99a5e', { layers: 1, alpha: 0.4, amp: 0.2, seed: 2821 + px, edge: 0 });
      Paint.ink(g, [[px, base], [px, base - Hw - 30]], { w: 1.2, alpha: 0.6, seed: 2822 + px, color: '#3a2410' });
      // jabalcón
      Paint.ink(g, [[px + 8, base - Hw + 20], [px + (px > x + 200 ? -34 : 40), base - Hw - 22]], { w: 4, alpha: 0.8, color: '#6a4220', seed: 2824 + px });
    }
    Paint.wash(g, [[x, base - Hw - 30], [x + W + 20, base - Hw - 34], [x + W + 20, base - Hw - 16], [x, base - Hw - 12]], '#6a4220', { layers: 3, alpha: 0.9, amp: 0.4, seed: 2830, edge: 0.3, core: 1 });
    // tejadillo de tablillas con alero
    const roof = [[x - 40, base - Hw - 22], [x + 60, base - Hw - 78], [x + W - 20, base - Hw - 88], [x + W + 60, base - Hw - 30], [x + W + 50, base - Hw - 16], [x - 36, base - Hw - 10]];
    Paint.wash(g, roof, '#937447', { layers: 4, alpha: 0.75, amp: 1, seed: 2831, edge: 0.3, core: 1, vary: '#a9824e', varyAmt: 0.5 });
    Paint.within(g, roof, () => {
      for (let r = 0; r < 6; r++) {
        const y = base - Hw - 20 - r * 12;
        Paint.shade(g, [[x - 40, y - 1], [x + W + 60, y - 3], [x + W + 60, y + 2], [x - 40, y + 4]], '#5f4220', { layers: 1, alpha: 0.3, amp: 0.5, seed: 2832 + r, edge: 0 });
        for (let sx = x - 30 + r * 18; sx < x + W + 50 - r * 14; sx += rng.range(10, 16)) Paint.ink(g, [[sx, y], [sx, y - 10]], { w: 0.7, alpha: 0.38, color: '#4f3516', seed: 2840 + r * 60 + Math.round(sx) });
      }
      Paint.wash(g, [[x + W * 0.5, base - Hw - 90], [x + W + 60, base - Hw - 40], [x + W + 60, base - Hw], [x + W * 0.5, base - Hw]], '#f2cd8a', { layers: 2, alpha: 0.3, amp: 4, seed: 2850, edge: 0 });
    });
    Paint.ink(g, roof.slice(0, 4), { w: 1.7, alpha: 0.7, seed: 2851, breaks: 0.2, sketch: 0.3, color: '#3e2810' });
    // banco de trabajo, barriles, escalera y tablones apoyados
    const wb = x + 300;
    Paint.wash(g, [[wb, base - 64], [wb + 150, base - 64], [wb + 150, base - 52], [wb, base - 52]], '#8e6538', { layers: 3, alpha: 0.88, amp: 0.3, seed: 2860, edge: 0.3, core: 1 });
    for (const lx of [wb + 8, wb + 134]) Paint.wash(g, [[lx, base - 52], [lx + 9, base - 52], [lx + 9, base], [lx, base]], '#6f4d2a', { layers: 2, alpha: 0.88, amp: 0.2, seed: 2861 + lx, edge: 0.3, core: 1 });
    for (const [bx, bw, bh] of [[x + 470, 40, 54], [x + 506, 34, 46]]) {
      Paint.wash(g, U.spline([[bx, base], [bx - 3, base - bh * 0.5], [bx + 2, base - bh], [bx + bw - 2, base - bh], [bx + bw + 3, base - bh * 0.5], [bx + bw, base]], 3, true), '#9b6b38', { layers: 3, alpha: 0.85, amp: 0.3, seed: 2862 + bx, edge: 0.3, core: 1, vary: '#7d5328', varyAmt: 0.4 });
      for (const hy of [base - 8, base - bh + 8]) Paint.ink(g, [[bx - 2, hy], [bx + bw + 2, hy]], { w: 1.5, alpha: 0.65, color: '#3c2a1e', seed: 2863 + bx + hy });
    }
    for (let k = 0; k < 4; k++) {
      const px = x + 196 + k * 9;
      Paint.wash(g, [[px, base], [px + 12, base - 150 + k * 6], [px + 22, base - 148 + k * 6], [px + 12, base]], rng.pick([C.woodLight, C.wood, '#c29458']), { layers: 2, alpha: 0.85, amp: 0.3, seed: 2870 + k, edge: 0.3, core: 1 });
    }
    // estantes con tarros y cestos, y una rueda de carro apoyada
    for (const [sy, sx0, sx1] of [[base - 120, x + 270, x + 470], [base - 156, x + 300, x + 460]]) {
      Paint.wash(g, [[sx0, sy], [sx1, sy], [sx1, sy + 6], [sx0, sy + 6]], '#6a4220', { layers: 2, alpha: 0.9, amp: 0.2, seed: 2871 + sy, edge: 0.3, core: 1 });
      for (let jx = sx0 + 10; jx < sx1 - 10; jx += rng.range(18, 30)) {
        const jh = rng.range(10, 20), jw = rng.range(8, 14);
        Paint.wash(g, U.spline([[jx, sy], [jx - 1, sy - jh * 0.7], [jx + jw * 0.2, sy - jh], [jx + jw * 0.8, sy - jh], [jx + jw + 1, sy - jh * 0.7], [jx + jw, sy]], 3, true), rng.pick(['#b9693c', '#c9a77d', '#8a9a7a', '#d8c4a0', '#9b6b38']), { layers: 2, alpha: 0.88, amp: 0.2, seed: 2872 + Math.round(jx + sy), edge: 0.35, core: 1 });
      }
    }
    const wheel = [x + 140, base - 40];
    g.strokeStyle = U.rgba('#5f4325', 0.9); g.lineWidth = 4;
    g.beginPath(); g.ellipse(wheel[0], wheel[1], 30, 36, 0.1, 0, U.TAU); g.stroke();
    g.lineWidth = 2;
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI; g.beginPath(); g.moveTo(wheel[0] + Math.cos(a) * 30, wheel[1] + Math.sin(a) * 36); g.lineTo(wheel[0] - Math.cos(a) * 30, wheel[1] - Math.sin(a) * 36); g.stroke(); }
    // escalera de mano apoyada en el pilar
    for (const lx of [x + 60, x + 84]) Paint.ink(g, [[lx, base], [lx + 26, base - 170]], { w: 3.2, alpha: 0.85, color: '#7a5530', seed: 2880 + lx });
    for (let k = 1; k < 8; k++) Paint.ink(g, [[x + 60 + k * 3.7, base - k * 21], [x + 84 + k * 3.7, base - k * 21]], { w: 2.2, alpha: 0.8, color: '#7a5530', seed: 2890 + k });
  }

  // Huerta: caballones de tierra parda que se alejan (cada vez más finos), con borde de piedras
  // delante y un seto detrás. Llana y baja: no se lee como muro ni como repisa.
  function paintFields(g, x0, x1, base) {
    const rng = U.makeRng(2901);
    const poly = [[x0, base + 4], [x0 + 24, base - 72], [x1 - 24, base - 76], [x1, base + 4]];
    Paint.wash(g, poly, '#8a6a43', { layers: 4, alpha: 0.6, amp: 2, seed: 2902, edge: 0.2, core: 1, vary: '#6e5235', varyAmt: 0.5 });
    Paint.within(g, poly, () => {
      for (let r = 0; r < 8; r++) {
        const t = r / 8, y = base - 4 - (1 - Math.pow(1 - t, 1.4)) * 70;
        const th = U.lerp(7, 2.4, t);
        const pts = [];
        for (let x = x0; x <= x1; x += 30) pts.push([x, y + Math.sin(x * 0.012 + r) * 1.4]);
        Paint.ink(g, pts, { w: th, alpha: 0.5, color: '#5a4126', seed: 2910 + r, wobble: 0.6, breaks: 0.1 });
        Paint.ink(g, pts.map(([x, yy]) => [x, yy - th * 0.7]), { w: th * 0.5, alpha: 0.45, color: '#d1a96c', seed: 2930 + r, wobble: 0.6, breaks: 0.25 });
      }
      Paint.wash(g, [[x0, base - 80], [x1, base - 80], [x1, base - 56], [x0, base - 52]], C.haze, { layers: 3, alpha: 0.22, amp: 6, seed: 2950, edge: 0 });
    });
    for (let x = x0 + 4; x < x1; x += rng.range(12, 20)) Paint.wash(g, U.blobPoly(x, base + 3, rng.range(6, 10), rng.range(3, 4.5), 8, rng, 0.2), rng.pick(['#b59f82', '#a08a6e', '#c4ae90']), { layers: 2, alpha: 0.9, amp: 0.3, seed: 2955 + Math.round(x), edge: 0.35, core: 1 });
    for (let x = x0 + 20; x < x1 - 20; x += 34) canopyClump(g, x, base - 84 + rng.range(-4, 4), 24, 12, rng, 2960 + Math.round(x), LEAF_OLIVE);
  }

  // Olivar en la ladera de la subida: olivos, algún ciprés, matas y restos de muretes de piedra
  // seca medio comidos por la hierba (cortos, inclinados y de poco contraste).
  function paintGrove(g, L) {
    const rng = U.makeRng(3001);
    const yAt = (wx) => BY(L.gy(wx)) - 56;
    for (let k = 0; k < 6; k++) {
      const wx = 5080 + k * 260 + rng.range(-30, 30), len = rng.range(90, 150);
      const a = [BX(wx), yAt(wx) - rng.range(40, 120)], b = [BX(wx + len), yAt(wx + len) - rng.range(40, 120)];
      const n = Math.round(len / 22);
      for (let i = 0; i < n; i++) {
        const t = i / n, x = U.lerp(a[0], b[0], t), y = U.lerp(a[1], b[1], t) + Math.sin(t * 9 + k) * 2;
        Paint.wash(g, U.blobPoly(x, y, rng.range(9, 13), rng.range(5, 7), 8, rng, 0.2), rng.pick(['#b8a283', '#a8916f', '#c6b090']), { layers: 2, alpha: 0.55, amp: 0.3, seed: 3010 + k * 40 + i, edge: 0.25 });
      }
      for (let i = 0; i < 6; i++) Art.tuft(g, U.lerp(a[0], b[0], rng.next()), U.lerp(a[1], b[1], rng.next()) + 6, 10, rng);
    }
    for (let k = 0; k < 9; k++) {
      const wx = 5040 + k * 180 + rng.range(-40, 40);
      paintOlive(g, BX(wx), yAt(wx) - rng.range(20, 110), rng.range(56, 80), rng);
    }
  }

  // Torre vieja de vigía en ruinas sobre la Colina de las Piedras: hiladas de piedra cálida con
  // la luz a la derecha (es redonda), la boca de una ventana, hiedra, hierba en la corona rota y
  // piedras caídas al pie. Aquí guarda el valle el Caballero de la Niebla.
  function paintRuin(g, x, base) {
    const rng = U.makeRng(3101);
    const tw = 120;
    const tower = [[x, base], [x + 4, base - 236], [x + 22, base - 252], [x + 36, base - 230], [x + 58, base - 262], [x + 80, base - 246], [x + 96, base - 254], [x + 110, base - 212], [x + tw, base]];
    Paint.shade(g, U.blobPoly(x + tw / 2 + 20, base + 2, tw * 0.9, 10, 12, rng, 0.15), '#4a3418', { layers: 2, alpha: 0.3, amp: 2, seed: 3100, edge: 0 });
    Paint.wash(g, tower, '#b59a76', { layers: 4, alpha: 0.75, amp: 1, seed: 3102, edge: 0.3, core: 1, vary: '#9a7f60', varyAmt: 0.4 });
    Paint.within(g, tower, () => {
      masonry(g, x, base - 260, x + tw, base, rng, 3103, { cols: ['#c2a882', '#b59a76', '#a48868', '#cbb38c'], hmin: 11, hmax: 16, wmin: 16, wmax: 28, alpha: 0.5, lit: '#efd2a0', joint: '#4a3420' });
      // volumen: luz cálida a la derecha, sombra fría a la izquierda
      const gr = g.createLinearGradient(x, 0, x + tw, 0);
      gr.addColorStop(0, 'rgba(70,52,40,0.38)'); gr.addColorStop(0.45, 'rgba(70,52,40,0)'); gr.addColorStop(0.8, 'rgba(250,220,160,0.18)'); gr.addColorStop(1, 'rgba(250,220,160,0.05)');
      g.fillStyle = gr; g.fillRect(x - 4, base - 270, tw + 8, 280);
      // ventana en arco y su sombra
      g.fillStyle = U.rgba('#3e2c22', 0.72);
      g.beginPath(); g.moveTo(x + 46, base - 140); g.lineTo(x + 46, base - 172); g.quadraticCurveTo(x + 60, base - 190, x + 74, base - 172); g.lineTo(x + 74, base - 140); g.fill();
      // hiedra
      for (let i = 0; i < 4; i++) canopyClump(g, x + rng.range(0, 40), base - rng.range(60, 200), rng.range(10, 18), rng.range(14, 26), rng, 3120 + i, { mid: '#6f7240', dark: '#3a3d1f', lit: '#9aa05c', hi: '#b8bc78', deep: '#2a2c14' });
    });
    Paint.ink(g, tower, { closed: true, w: 1.5, alpha: 0.6, seed: 3104, breaks: 0.3, sketch: 0.3, color: '#3e2c1c' });
    // hierba y una mata en la corona rota
    for (let i = 0; i < 10; i++) Art.tuft(g, x + rng.range(8, tw - 8), base - 236 - rng.range(-6, 14), 12, rng);
    canopyClump(g, x + 64, base - 262, 18, 10, rng, 3130, LEAF_OLIVE);
    // muro caído y piedras sueltas al pie
    for (let i = 0; i < 10; i++) Paint.wash(g, U.blobPoly(x - 140 + rng.range(0, 360), base - rng.range(0, 10), rng.range(10, 22), rng.range(6, 12), 9, rng, 0.25), rng.pick(['#c2a882', '#a48868', '#b59a76']), { layers: 2, alpha: 0.85, amp: 0.4, seed: 3140 + i, edge: 0.3, core: 1 });
    for (let i = 0; i < 12; i++) Art.tuft(g, x - 140 + rng.range(0, 360), base + 2, 11, rng);
  }

  // Olivo grande del plano jugable (los del camino): tronco retorcido que se abre en brazos y copa
  // de masas de olivo; raíces y hierba al pie para que el contacto con el suelo se lea.
  Art.oliveTree = function (t) {
    const H = t.h || 460, Wd = H * 1.4;
    const cols = { mid: '#8c7a45', dark: '#4a3f20', lit: '#c8ad66', hi: '#e6cf92', deep: '#33290f' };
    return Paint.makeSprite({ w: Wd, h: H * 1.14 + 40, ox: Wd / 2, oy: H * 1.14 + 10, res: 1, post: { edge: 0.35, grain: 0.35, density: 0.12, gx: t.seed * 13 } }, (g) => {
      const rng = U.makeRng(t.seed * 7 + 1);
      const back = [[-H * 0.3, -H * 0.74, 0.2, 0.15], [H * 0.26, -H * 0.78, 0.2, 0.15], [0, -H * 0.9, 0.22, 0.15]];
      for (const [cx, cy, rx, ry] of back) canopyClump(g, cx, cy, H * rx, H * ry, rng, t.seed + Math.round(cx), { mid: '#78693a', dark: '#3e351a', lit: '#a8914f', hi: '#c9b272', deep: '#2b240e' });
      const wood = '#7a5a3a';
      limb(g, [[-12, 8], [-4, -H * 0.16], [-20, -H * 0.32], [-8, -H * 0.48]], H * 0.13, H * 0.075, t.seed + 1, wood);
      limb(g, [[-8, -H * 0.44], [-H * 0.12, -H * 0.56], [-H * 0.3, -H * 0.66]], H * 0.065, H * 0.025, t.seed + 2, wood);
      limb(g, [[-6, -H * 0.44], [H * 0.1, -H * 0.58], [H * 0.3, -H * 0.68]], H * 0.065, H * 0.025, t.seed + 3, wood);
      limb(g, [[-8, -H * 0.47], [-2, -H * 0.62], [H * 0.04, -H * 0.8]], H * 0.05, H * 0.02, t.seed + 4, wood);
      for (const [dx, len] of [[-H * 0.1, -H * 0.12], [H * 0.08, H * 0.12]]) limb(g, [[dx * 0.2 - 8, -4], [dx * 0.7 - 8, 2], [dx + len * 0.3 - 8, 8]], H * 0.04, H * 0.01, t.seed + 5 + Math.round(dx), wood);
      Paint.ink(g, [[-14, -H * 0.2], [-8, -H * 0.24], [-2, -H * 0.21]], { w: 1.4, alpha: 0.5, color: '#33220f', seed: t.seed + 9 });
      const front = [[-H * 0.36, -H * 0.66, 0.19, 0.15], [H * 0.34, -H * 0.68, 0.19, 0.15], [-H * 0.12, -H * 0.76, 0.21, 0.16], [H * 0.12, -H * 0.8, 0.21, 0.16],
        [0, -H * 0.94, 0.19, 0.13], [-H * 0.24, -H * 0.9, 0.15, 0.12], [H * 0.26, -H * 0.92, 0.15, 0.12], [-H * 0.48, -H * 0.72, 0.12, 0.1], [H * 0.48, -H * 0.74, 0.12, 0.1]];
      for (const [cx, cy, rx, ry] of front) canopyClump(g, cx, cy, H * rx, H * ry, rng, t.seed + 100 + Math.round(cx + cy), cols);
      for (let i = 0; i < 6; i++) Art.tuft(g, rng.range(-H * 0.12, H * 0.12), 6, 14, rng);
    });
  };

  // ------------------------------------------------------------------ capas de estado del fondo
  // Taller en reposo (estado inicial): interior en penumbra, toldo recogido, el farol apagado y una
  // lona sobre el banco. En uso (transición en adelante): luz cálida dentro, herramientas colgadas,
  // toldo tendido, serrín, una tabla en el banco y el farol del taller encendido.
  Art.workshopSprites = function () {
    const at = Art.workshopAt, x = at.x, base = at.y;
    const box = { w: 820, h: 360, ox: -(x - 230), oy: -(base - 320) };
    const closed = Paint.makeSprite({ w: box.w, h: box.h, ox: box.ox, oy: box.oy, res: 0.9, post: POST }, (g) => {
      const rng = U.makeRng(2881);
      Paint.shade(g, [[x + 46, base - 196], [x + 494, base - 196], [x + 494, base - 2], [x + 46, base - 2]], '#3e2812', { layers: 3, alpha: 0.14, amp: 3, seed: 2882, edge: 0 });
      // lona sobre el banco
      Paint.wash(g, [[x + 296, base - 66], [x + 454, base - 66], [x + 462, base - 30], [x + 290, base - 34]], '#d9ccb2', { layers: 3, alpha: 0.85, amp: 0.8, seed: 2883, edge: 0.3, core: 1 });
      for (let i = 0; i < 4; i++) Paint.ink(g, [[x + 310 + i * 36, base - 64], [x + 306 + i * 38, base - 36]], { w: 0.8, alpha: 0.35, seed: 2884 + i, color: '#8a7a60' });
      // dos herramientas que quedaron colgadas
      Paint.ink(g, [[x + 180, base - 176], [x + 180, base - 132]], { w: 3, alpha: 0.7, color: '#7a5a34', seed: 2890 });
      Paint.wash(g, [[x + 170, base - 136], [x + 190, base - 136], [x + 190, base - 126], [x + 170, base - 126]], '#5c5650', { layers: 2, alpha: 0.75, amp: 0.2, seed: 2891, edge: 0.3, core: 1 });
      // toldo enrollado bajo el alero
      Paint.wash(g, [[x - 20, base - 232], [x + 200, base - 236], [x + 200, base - 222], [x - 20, base - 218]], '#e2d5bd', { layers: 3, alpha: 0.88, amp: 0.4, seed: 2892, edge: 0.3, core: 1 });
      for (let k = 0; k < 5; k++) Paint.ink(g, [[x + k * 44, base - 234], [x + k * 44 + 4, base - 220]], { w: 0.8, alpha: 0.4, seed: 2893 + k, color: '#8a7a60' });
      // el farol del taller, apagado
      Paint.ink(g, [[x + 252, base - 236], [x + 252, base - 222]], { w: 1.4, alpha: 0.7, seed: 2898, color: '#3c2a1e' });
      Art.drawLanternShape(g, x + 252, base - 214, 0.85, false, { dirty: true });
      void rng;
    });
    const open = Paint.makeSprite({ w: box.w, h: box.h, ox: box.ox, oy: box.oy, res: 0.9, post: POST }, (g) => {
      const rng = U.makeRng(2981);
      // luz cálida dentro del taller
      g.save();
      g.globalCompositeOperation = 'screen';
      const gl = g.createRadialGradient(x + 300, base - 90, 10, x + 300, base - 90, 240);
      gl.addColorStop(0, 'rgba(255,214,140,0.55)'); gl.addColorStop(1, 'rgba(255,214,140,0)');
      g.fillStyle = gl; g.fillRect(x + 40, base - 200, 460, 200);
      g.restore();
      // herramientas colgadas: sierras, martillos, tenazas, formones
      const tools = [[x + 120, 'saw'], [x + 170, 'hammer'], [x + 196, 'pliers'], [x + 360, 'saw'], [x + 410, 'hammer'], [x + 440, 'chisel'], [x + 462, 'chisel']];
      Paint.ink(g, [[x + 100, base - 182], [x + 480, base - 184]], { w: 2.2, alpha: 0.75, color: '#6a4220', seed: 2989 });
      for (const [tx, kind] of tools) {
        const ty = base - 176;
        Paint.ink(g, [[tx, ty - 6], [tx, ty]], { w: 0.8, alpha: 0.6, seed: 2990 + tx });
        if (kind === 'saw') {
          Paint.wash(g, [[tx - 4, ty], [tx + 4, ty], [tx + 10, ty + 62], [tx - 12, ty + 62]], '#b2aca2', { layers: 2, alpha: 0.88, amp: 0.2, seed: 2991 + tx, edge: 0.3, core: 1 });
          for (let k = 0; k < 8; k++) Paint.ink(g, [[tx - 12 + k * 2.8, ty + 62], [tx - 11 + k * 2.8, ty + 58]], { w: 0.6, alpha: 0.6, seed: 2992 + tx + k, color: '#5c5650' });
          Paint.wash(g, [[tx - 6, ty - 4], [tx + 6, ty - 4], [tx + 6, ty + 10], [tx - 6, ty + 10]], '#8a5a30', { layers: 2, alpha: 0.9, amp: 0.2, seed: 2993 + tx, edge: 0.3, core: 1 });
        } else if (kind === 'hammer') {
          Paint.ink(g, [[tx, ty], [tx, ty + 44]], { w: 3, alpha: 0.85, color: '#8a5a30', seed: 2994 + tx });
          Paint.wash(g, [[tx - 10, ty + 40], [tx + 10, ty + 40], [tx + 10, ty + 50], [tx - 10, ty + 50]], '#5c5650', { layers: 2, alpha: 0.9, amp: 0.2, seed: 2995 + tx, edge: 0.3, core: 1 });
        } else if (kind === 'pliers') {
          Paint.ink(g, [[tx - 3, ty], [tx + 2, ty + 36]], { w: 2, alpha: 0.85, color: '#4d4844', seed: 2996 + tx });
          Paint.ink(g, [[tx + 3, ty], [tx - 2, ty + 36]], { w: 2, alpha: 0.85, color: '#4d4844', seed: 2997 + tx });
        } else {
          Paint.ink(g, [[tx, ty], [tx, ty + 30]], { w: 2.2, alpha: 0.85, color: '#8a5a30', seed: 2998 + tx });
          Paint.ink(g, [[tx, ty + 30], [tx, ty + 44]], { w: 1.6, alpha: 0.85, color: '#77716a', seed: 2999 + tx });
        }
      }
      // tabla sobre el banco, cepillo, serrín y virutas
      Paint.wash(g, [[x + 310, base - 70], [x + 440, base - 72], [x + 440, base - 64], [x + 310, base - 62]], C.woodNew, { layers: 2, alpha: 0.92, amp: 0.2, seed: 3001, edge: 0.3, core: 1 });
      Paint.wash(g, [[x + 380, base - 78], [x + 404, base - 78], [x + 406, base - 70], [x + 378, base - 70]], '#7a5530', { layers: 2, alpha: 0.9, amp: 0.2, seed: 3002, edge: 0.3, core: 1 });
      Paint.splatter(g, x + 380, base - 4, 80, 4, 40, '#e8cc95', { alpha: 0.9, rmin: 0.6, rmax: 1.6, seed: 3003 });
      for (let i = 0; i < 8; i++) Paint.ink(g, [[x + 330 + i * 12, base - 2], [x + 336 + i * 12, base - 6], [x + 340 + i * 12, base - 2]], { w: 0.9, alpha: 0.7, color: '#e2c08a', seed: 3004 + i });
      // banquetas y un cubo
      for (const sx of [x + 270, x + 470]) {
        Paint.wash(g, [[sx, base - 40], [sx + 34, base - 40], [sx + 34, base - 34], [sx, base - 34]], '#8e6538', { layers: 2, alpha: 0.9, amp: 0.2, seed: 3005 + sx, edge: 0.3, core: 1 });
        for (const lx of [sx + 3, sx + 27]) Paint.ink(g, [[lx, base - 34], [lx, base]], { w: 2.4, alpha: 0.85, color: '#6f4d2a', seed: 3006 + lx });
      }
      // toldo de lona tendido hacia la izquierda, con su palo
      const aw = [[x + 30, base - 226], [x - 170, base - 186], [x - 176, base - 176], [x + 30, base - 206]];
      Paint.wash(g, aw, '#f1e6d1', { layers: 3, alpha: 0.88, amp: 0.8, seed: 3007, edge: 0.3, core: 1 });
      Paint.shade(g, [[x + 30, base - 210], [x - 176, base - 178], [x - 170, base - 172], [x + 30, base - 200]], '#bfae94', { layers: 2, alpha: 0.4, amp: 0.4, seed: 3008, edge: 0 });
      Paint.ink(g, [[x + 30, base - 226], [x - 170, base - 186]], { w: 1.1, alpha: 0.5, seed: 3009 });
      Paint.ink(g, [[x - 172, base - 182], [x - 176, base]], { w: 2.4, alpha: 0.8, color: '#6f4d2a', seed: 3010 });
      // el farol del taller, encendido (misma silueta de vidrio y campana)
      Paint.ink(g, [[x + 252, base - 236], [x + 252, base - 222]], { w: 1.4, alpha: 0.7, seed: 3011, color: '#3c2a1e' });
      Art.drawLanternShape(g, x + 252, base - 214, 0.85, true);
      // un delantal colgado y una regadera
      Paint.wash(g, [[x + 64, base - 150], [x + 92, base - 150], [x + 98, base - 96], [x + 60, base - 96]], '#d8c4a0', { layers: 2, alpha: 0.88, amp: 0.4, seed: 3012, edge: 0.3, core: 1 });
      Paint.wash(g, U.blobPoly(x + 540, base - 16, 16, 14, 10, rng, 0.1), '#7d8a86', { layers: 2, alpha: 0.88, amp: 0.2, seed: 3013, edge: 0.3, core: 1 });
    });
    return { closed, open, lamp: { x: x + 252, y: base - 190 } };
  };

  // Cultivos en tres estados: brotes (inicial), plantas a medio crecer (transición) y huerta llena
  // (restaurado; aun así, «campos todavía en crecimiento»). Siguen los caballones de la huerta.
  Art.fieldSprites = function () {
    const f = Art.fieldsAt, x0 = f.x0, x1 = f.x1, base = f.y;
    const mk = (stage) => Paint.makeSprite({ w: x1 - x0 + 80, h: 180, ox: -(x0 - 40), oy: -(base - 150), res: 0.85, post: POST }, (g) => {
      const rng = U.makeRng(3200 + stage);
      for (let r = 7; r >= 0; r--) {
        const t = r / 8, y = base - 4 - (1 - Math.pow(1 - t, 1.4)) * 70, sc = 1 - t * 0.6;
        for (let x = x0 + 20 + rng.range(0, 20); x < x1 - 20; x += rng.range(24, 36) * sc) {
          if (stage === 0) {
            if (!rng.chance(0.4)) continue;
            for (const s of [-1, 1]) Paint.ink(g, [[x, y], [x + s * 3 * sc, y - 5 * sc]], { w: 1.4 * sc, alpha: 0.85, color: '#8fa055', seed: Math.round(x + r * 997 + s) });
          } else {
            const big = stage === 2 ? rng.range(0.9, 1.3) : rng.range(0.45, 0.8);
            const kind = r % 3;
            if (kind === 0) {
              // col: hojas redondas verde azulado
              const rr = 10 * sc * big;
              Paint.wash(g, U.blobPoly(x, y - rr * 0.6, rr, rr * 0.7, 10, rng, 0.25), rng.pick(['#8fa48c', '#7b947c', '#a3b49a']), { layers: 3, alpha: 0.8, amp: 0.4, seed: Math.round(x + r * 31), edge: 0.35, core: 1 });
              Paint.wash(g, U.blobPoly(x + rr * 0.2, y - rr * 0.9, rr * 0.5, rr * 0.35, 8, rng, 0.2), '#c6d2b4', { layers: 2, alpha: 0.55, amp: 0.2, seed: Math.round(x + r * 37), edge: 0 });
            } else if (kind === 1 && stage === 2 && rng.chance(0.5)) {
              // calabaza naranja entre hojas
              const rr = 8 * sc;
              leafMass(g, x, y - 6 * sc, 16 * sc, 6 * sc, rng, 5, [C.leaf, C.leafDeep], Math.round(x * 3 + r));
              Paint.wash(g, U.blobPoly(x + 4, y - rr * 0.7, rr, rr * 0.75, 10, rng, 0.15), rng.pick(['#e0873c', '#d8752e', '#eb9a4a']), { layers: 3, alpha: 0.88, amp: 0.3, seed: Math.round(x + r * 41), edge: 0.4, core: 1 });
            } else {
              // hilera de lechugas o judías
              leafMass(g, x, y - 8 * sc * big, 12 * sc * big, 7 * sc * big, rng, stage === 2 ? 8 : 5, ['#a9b46a', '#8f9a52', '#c2c47e'], Math.round(x * 7 + r));
            }
          }
        }
      }
      if (stage === 2) {
        // girasoles al fondo de la huerta: variedad de color
        for (let i = 0; i < 9; i++) {
          const x = U.lerp(x0 + 40, x1 - 40, i / 8) + rng.range(-20, 20), y = base - 84;
          Paint.ink(g, [[x, y + 30], [x + rng.range(-3, 3), y - 20]], { w: 2, alpha: 0.85, color: '#6f7a3c', seed: 3290 + i });
          for (let k = 0; k < 10; k++) {
            const a = k / 10 * U.TAU;
            g.fillStyle = U.rgba('#f2c23c', 0.92);
            g.beginPath(); g.ellipse(x + Math.cos(a) * 6, y - 22 + Math.sin(a) * 6, 4, 2, a, 0, U.TAU); g.fill();
          }
          g.fillStyle = '#7a4f24'; g.beginPath(); g.arc(x, y - 22, 3.6, 0, U.TAU); g.fill();
        }
      }
    });
    return [mk(0), mk(1), mk(2)];
  };

  // Ropa tendida junto a la casa (uso humano a partir de la transición).
  Art.laundrySprite = function () {
    const x = BX(1440), y = BY(812) - 170;
    return Paint.makeSprite({ w: 240, h: 150, ox: -(x - 20), oy: -(y - 20), res: 1, post: POST }, (g) => {
      const rng = U.makeRng(3301);
      Paint.ink(g, [[x, y + 110], [x + 4, y]], { w: 2.4, alpha: 0.8, color: '#6f4d2a', seed: 3302 });
      Paint.ink(g, [[x + 200, y + 110], [x + 196, y - 4]], { w: 2.4, alpha: 0.8, color: '#6f4d2a', seed: 3303 });
      const line = [];
      for (let t = 0; t <= 1.001; t += 0.1) line.push([x + 4 + t * 192, y + 2 + Math.sin(Math.PI * t) * 10]);
      Paint.ink(g, line, { w: 0.9, alpha: 0.7, seed: 3304 });
      const cloths = [[0.15, 30, 44, '#f5efe3'], [0.4, 40, 34, '#c8d0c4'], [0.66, 28, 48, '#f0e2c8'], [0.86, 22, 30, '#e8b9a4']];
      for (const [t, w, h, col] of cloths) {
        const cx = x + 4 + t * 192, cy = y + 2 + Math.sin(Math.PI * t) * 10;
        Paint.wash(g, [[cx - w / 2, cy], [cx + w / 2, cy], [cx + w / 2 + rng.range(-2, 2), cy + h], [cx - w / 2 + rng.range(-2, 2), cy + h + rng.range(-3, 3)]], col, { layers: 3, alpha: 0.88, amp: 0.6, seed: 3305 + t * 100, edge: 0.35, core: 1 });
        Paint.ink(g, [[cx - w / 2 + 4, cy - 2], [cx - w / 2 + 4, cy + 4]], { w: 1.2, alpha: 0.7, seed: 3310 + t * 100 });
      }
    });
  };
})(window.JHS = window.JHS || {});
