/* Mundo 1 — capa 4 de la ficha («Casa de Ester, taller y campos»), en su propio plano de parallax
   (p = 0,9) y pintada completa: bajo cada edificio hay suelo y detrás de cada oclusión hay
   relleno, así el plano puede deslizarse sin dejar huecos. Las ventanas quedan con menos
   contraste que los objetos interactivos (que están todos en el plano jugable). */
(function (JHS) {
  'use strict';
  const U = JHS.U, Paint = JHS.Paint, P = JHS.Palette;
  const Art = JHS.M01Art;
  const C = Art.C;

  // De posición de mundo a espacio de esta capa: el objeto queda detrás del punto x del camino
  // cuando la niña pasa por delante (cámara 170 unidades por delante de ella).
  const BP = 0.9, C0X = 960, C0Y = 551, LOOK = 170;
  const BX = Art.BX = (x) => 960 + (x + LOOK - C0X) * BP - LOOK;
  const BY = Art.BY = (y) => 540 + (y - C0Y);
  Art.BACK_P = BP;

  const POST = { edge: 0.32, grain: 0.3, density: 0.08 };

  // Tira de suelo del fondo: prado y campos que van detrás del camino. Sigue la altura del
  // camino (un poco más arriba en pantalla, por estar detrás) y baja hasta muy por debajo del
  // borde del camino, para que nunca se vea un hueco entre planos.
  Art.paintBack = function (layer, L, life) {
    const x0 = layer.x0, x1 = layer.x1;
    const rng = U.makeRng(2401);
    const gyB = (x) => BY(L.gy(x));
    // ---- tira continua de prado (con relleno hasta abajo)
    const step = 24, top = [];
    for (let wx = -900; wx <= 10900; wx += step) top.push([BX(wx), gyB(wx) - 52 + Math.sin(wx * 0.004) * 6]);
    const stripPoly = top.concat([[top[top.length - 1][0], gyB(10900) + 260], [top[0][0], gyB(-900) + 260]]);
    for (let bx = x0; bx < x1; bx += 1800) {
      const bw = Math.min(1800, x1 - bx) + 60;
      JHS.Layers.paintOnce(layer, { x: bx - 30, y: 0, w: bw, h: layer.y1 }, (g) => {
        Paint.wash(g, stripPoly, C.meadow, { layers: 3, alpha: 0.5, amp: 3, seed: 2402, edge: 0.15, core: 1, vary: C.sage, varyAmt: 0.4 });
        Paint.within(g, stripPoly, () => {
          // franjas de hierba más oscura hacia abajo y luz dorada en el borde de arriba
          Paint.wash(g, top.map(([x, y]) => [x, y - 2]).concat(top.slice().reverse().map(([x, y]) => [x, y + 18])), C.meadowLit, { layers: 3, alpha: 0.35, amp: 4, seed: 2403, edge: 0 });
          Paint.shade(g, top.map(([x, y]) => [x, y + 40]).concat(top.slice().reverse().map(([x, y]) => [x, y + 220])), C.leafDeep, { layers: 3, alpha: 0.18, amp: 12, seed: 2404, edge: 0 });
          for (let i = 0; i < bw / 26; i++) {
            const x = bx + rng.range(0, bw), wx = (x - 79) / BP;
            const y = gyB(wx) - 40 + rng.range(0, 70);
            Paint.wash(g, U.blobPoly(x, y, rng.range(14, 40), rng.range(4, 9), 10, rng, 0.35), rng.pick([C.leaf, C.sage, C.leafLit, C.meadowLit]), { layers: 2, alpha: 0.28, amp: 2, seed: 2410 + i, edge: 0.1 });
          }
        });
        const fr = top.filter(([x]) => x > bx - 40 && x < bx + bw + 40);
        if (fr.length > 1) JHS.Scenery.kit.grassFringe(g, fr, U.makeRng(2405 + bx), 0.4);
      }, POST);
    }

    // ---- el arroyo atraviesa la tira de prado detrás del puente y se aleja hacia la cascada
    const sx0 = BX(1890), sx1 = BX(2210);
    JHS.Layers.paintOnce(layer, { x: sx0 - 120, y: gyB(2050) - 220, w: sx1 - sx0 + 240, h: 520 }, (g) => {
      const yb = gyB(2050);
      const bank = (side) => {
        const pts = [];
        for (let t = 0; t <= 1.001; t += 0.1) {
          const y = U.lerp(yb - 70, yb + 200, t);
          const half = U.lerp(26, (sx1 - sx0) / 2 - 30, t);
          pts.push([(sx0 + sx1) / 2 + side * half + Math.sin(t * 6 + side) * 6, y]);
        }
        return pts;
      };
      const L1 = bank(-1), R1 = bank(1);
      const water = L1.concat(R1.slice().reverse());
      Paint.wash(g, water, C.water, { layers: 4, alpha: 0.7, amp: 2, seed: 2420, edge: 0.25, core: 1, vary: C.waterDeep, varyAmt: 0.4 });
      Paint.within(g, water, () => {
        for (let i = 0; i < 26; i++) {
          const y = rng.range(yb - 60, yb + 190), w = rng.range(8, 30) * (0.5 + (y - yb + 60) / 250);
          const x = (sx0 + sx1) / 2 + rng.range(-1, 1) * (y - yb + 90) * 0.4;
          Paint.ink(g, [[x - w, y], [x + w, y + rng.range(-1, 1)]], { w: 1.4, alpha: 0.6, color: C.waterLit, seed: 2421 + i, taper: 0.5 });
        }
      });
      // orillas con piedras redondas y juncos
      for (const side of [-1, 1]) {
        const B = side < 0 ? L1 : R1;
        for (let i = 0; i < B.length; i++) {
          const [x, y] = B[i];
          if (rng.chance(0.7)) Paint.wash(g, U.blobPoly(x + side * rng.range(0, 10), y, rng.range(6, 14), rng.range(4, 8), 9, rng, 0.25), rng.pick([C.stone, C.stoneShade, '#b8a691']), { layers: 2, alpha: 0.7, amp: 0.5, seed: 2430 + i * 2 + side, edge: 0.3, core: 1 });
        }
        Paint.ink(g, B, { w: 1.2, alpha: 0.4, seed: 2440 + side, breaks: 0.3, color: C.earthDeep });
      }
    }, POST);

    // ---- el gran árbol junto a la casa: tronco nudoso y copa que enmarca el cielo
    const tx = BX(700);
    JHS.Layers.paintOnce(layer, { x: tx - 520, y: -40, w: 1000, h: gyB(700) + 120 }, (g) => paintBigTree(g, tx, gyB(700) - 46, rng), POST);

    // ---- la casa de Ester
    const hx = BX(850), hb = gyB(1100) - 44;
    JHS.Layers.paintOnce(layer, { x: hx - 80, y: hb - 400, w: 700, h: 460 }, (g) => paintHouse(g, hx, hb, life), POST);

    // ---- taller: estructura común a los tres estados (muro, pilares, tejadillo, suelo)
    const wx = BX(2640), wb = gyB(2900) - 46;
    JHS.Layers.paintOnce(layer, { x: wx - 40, y: wb - 300, w: 620, h: 340 }, (g) => paintWorkshop(g, wx, wb), POST);
    Art.workshopAt = { x: wx, y: wb };

    // ---- campos: tierra labrada en hileras que se alejan (los cultivos son capas de estado)
    const fx0 = BX(3420), fx1 = BX(4600), fb = gyB(4000) - 50;
    JHS.Layers.paintOnce(layer, { x: fx0 - 60, y: fb - 160, w: fx1 - fx0 + 120, h: 220 }, (g) => paintFields(g, fx0, fx1, fb), POST);
    Art.fieldsAt = { x0: fx0, x1: fx1, y: fb };

    // ---- cipreses y olivos sueltos por el fondo
    const tr = U.makeRng(2470);
    const spots = [[-200, 'olive'], [120, 'cypress'], [180, 'cypress'], [1500, 'olive'], [2450, 'cypress'], [2510, 'cypress'], [3300, 'cypress'], [3360, 'olive'],
      [4700, 'cypress'], [4760, 'cypress'], [4820, 'cypress'], [5300, 'olive'], [5900, 'olive'], [6500, 'cypress'], [6560, 'cypress'], [7900, 'olive'], [8700, 'cypress'], [8760, 'cypress']];
    for (const [wx2, kind] of spots) {
      const x = BX(wx2), y = gyB(wx2) - 56;
      const h = kind === 'cypress' ? tr.range(150, 210) : tr.range(70, 90);
      JHS.Layers.paintOnce(layer, { x: x - 80, y: y - h - 40, w: 160, h: h + 60 }, (g) => {
        if (kind === 'cypress') Art.cypress(g, x, y, h, tr, tr.chance(0.5) ? C.cypress : '#555137');
        else paintOlive(g, x, y, h, tr);
      }, POST);
    }

    // ---- terrazas de piedra seca en la subida y la torre en ruinas de la Colina de las Piedras
    JHS.Layers.paintOnce(layer, { x: BX(5000), y: gyB(6000) - 260, w: BX(6600) - BX(5000), h: 330 }, (g) => paintTerraces(g, L, rng), POST);
    const rx = BX(7300), rb = gyB(7300) - 54;
    JHS.Layers.paintOnce(layer, { x: rx - 200, y: rb - 330, w: 520, h: 370 }, (g) => paintRuin(g, rx, rb, rng), POST);
    Art.ruinAt = { x: rx, y: rb };
  };

  // ------------------------------------------------------------------ piezas
  function leafMass(g, x, y, rx, ry, rng, n, cols, seed) {
    for (let i = 0; i < n; i++) {
      const a = rng.range(0, U.TAU), d = Math.sqrt(rng.next());
      const px = x + Math.cos(a) * rx * d, py = y + Math.sin(a) * ry * d;
      const r = rng.range(5, 11);
      Paint.wash(g, U.blobPoly(px, py, r, r * rng.range(0.5, 0.8), 7, rng, 0.35, rng.range(0, 3)), rng.pick(cols), { layers: 2, alpha: rng.range(0.35, 0.6), amp: 0.6, seed: seed + i, edge: 0.25 });
    }
  }
  Art.leafMass = leafMass;

  function paintBigTree(g, x, base, rng) {
    // tronco: dos ramas gruesas que se abren hacia la izquierda y hacia arriba
    const trunk = U.spline([[x - 40, base], [x - 34, base - 120], [x - 60, base - 230], [x - 120, base - 330], [x - 200, base - 420], [x - 150, base - 440],
      [x - 70, base - 360], [x - 10, base - 290], [x + 30, base - 380], [x + 60, base - 440], [x + 90, base - 420], [x + 44, base - 300], [x + 30, base - 150], [x + 40, base]], 3, true);
    Paint.wash(g, trunk, '#8b6a45', { layers: 4, alpha: 0.55, amp: 2, seed: 2501, edge: 0.3, core: 1, vary: '#6f5236', varyAmt: 0.5 });
    Paint.within(g, trunk, () => {
      Paint.shade(g, [[x - 120, base - 460], [x - 20, base - 460], [x - 10, base + 10], [x - 140, base + 10]], '#5a4029', { layers: 3, alpha: 0.28, amp: 6, seed: 2502, edge: 0 });
      Paint.wash(g, [[x + 6, base - 420], [x + 70, base - 430], [x + 50, base], [x + 10, base]], '#d9b07a', { layers: 2, alpha: 0.3, amp: 4, seed: 2503, edge: 0 });
      g.strokeStyle = U.rgba('#4a3423', 0.4); g.lineWidth = 1;
      for (let i = 0; i < 30; i++) {
        const yy = base - rng.range(10, 420), xx = x + rng.range(-120, 60);
        g.beginPath(); g.moveTo(xx, yy); g.quadraticCurveTo(xx + rng.range(-6, 6), yy - 18, xx + rng.range(-4, 4), yy - rng.range(30, 60)); g.stroke();
      }
    });
    Paint.ink(g, trunk, { closed: true, w: 1.8, alpha: 0.6, seed: 2504, breaks: 0.3, sketch: 0.4 });
    // copa: masas de hoja oliva con luz amarilla del lado del sol
    const cols = [C.leaf, C.leafLit, C.leafDeep, '#a7a862', '#d8c878'];
    for (const [cx, cy, rx, ry] of [[x - 220, base - 470, 220, 90], [x - 40, base - 500, 240, 100], [x + 160, base - 470, 170, 80], [x - 360, base - 420, 150, 70], [x + 40, base - 380, 140, 50]]) {
      leafMass(g, cx, cy, rx, ry, rng, Math.round(rx * ry / 90), cols, 2510 + cx);
    }
    // destellos de luz y algunas hojas amarillas encima
    for (let i = 0; i < 70; i++) Paint.softBlob(g, x + rng.range(-420, 300), base - 470 + rng.range(-90, 90), rng.range(3, 7), '#f7e7a6', 0.35);
  }

  function paintOlive(g, x, y, h, rng) {
    const trunk = [[x - 6, y], [x - 4, y - h * 0.45], [x - 16, y - h * 0.62], [x - 8, y - h * 0.66], [x + 2, y - h * 0.52], [x + 14, y - h * 0.68], [x + 20, y - h * 0.64], [x + 6, y - h * 0.42], [x + 8, y]];
    Paint.wash(g, trunk, '#7d6448', { layers: 3, alpha: 0.6, amp: 0.8, seed: Math.round(x), edge: 0.3, core: 1 });
    leafMass(g, x, y - h * 0.82, h * 0.55, h * 0.3, rng, Math.round(h * 0.9), ['#a3a06c', '#c4bf8a', '#7e7f55', '#b6b27a'], Math.round(x * 3));
  }
  Art.paintOlive = paintOlive;

  // Casa de Ester (concepto: piedra cálida, puerta de arco, farol, ventana, enredadera de jazmín,
  // tejado de tablillas, chimenea de piedra, porche de madera, macetas y escalones).
  function paintHouse(g, x, base, life) {
    const rng = U.makeRng(2601);
    const W = 420, Hw = 196;
    const wall = [[x, base], [x, base - Hw], [x + W, base - Hw], [x + W, base]];
    // sombra de contacto
    Paint.shade(g, [[x - 30, base - 6], [x + W + 40, base - 6], [x + W + 50, base + 14], [x - 40, base + 14]], '#5a4430', { layers: 3, alpha: 0.25, amp: 4, seed: 2602, edge: 0 });
    // muro de piedra enlucida, más claro del lado del sol (derecha)
    Paint.wash(g, wall, '#d7a865', { layers: 4, alpha: 0.6, amp: 1.5, seed: 2603, edge: 0.3, core: 1, vary: '#c68d3d', varyAmt: 0.5 });
    Paint.within(g, wall, () => {
      Paint.wash(g, [[x + W * 0.45, base - Hw], [x + W, base - Hw], [x + W, base], [x + W * 0.55, base]], '#f4cf86', { layers: 3, alpha: 0.35, amp: 6, seed: 2604, edge: 0 });
      Paint.shade(g, [[x, base - Hw], [x + W, base - Hw], [x + W, base - Hw + 36], [x, base - Hw + 44]], '#7c5022', { layers: 3, alpha: 0.3, amp: 3, seed: 2605, edge: 0 });
      Paint.shade(g, [[x, base - Hw], [x + 70, base - Hw], [x + 50, base], [x, base]], '#8a5c26', { layers: 3, alpha: 0.22, amp: 6, seed: 2606, edge: 0 });
      // piedras: contornos redondeados de tinta, sin cuadrícula
      for (let i = 0; i < 70; i++) {
        const sx = x + rng.range(4, W - 4), sy = base - rng.range(6, Hw - 6), w = rng.range(14, 30), h = rng.range(9, 16);
        const poly = U.blobPoly(sx, sy, w / 2, h / 2, 8, rng, 0.22);
        Paint.wash(g, poly, rng.pick(['#e2b878', '#c99555', '#d8ad6c', '#b98549']), { layers: 2, alpha: 0.28, amp: 0.4, seed: 2610 + i, edge: 0.3 });
        if (rng.chance(0.6)) Paint.ink(g, poly.slice(0, 6), { w: 0.8, alpha: 0.3, seed: 2690 + i, color: '#6b4419', breaks: 0.3 });
      }
    });
    Paint.ink(g, [[x, base], [x, base - Hw]], { w: 1.6, alpha: 0.55, seed: 2607, breaks: 0.2 });
    Paint.ink(g, [[x + W, base - Hw], [x + W, base]], { w: 1.4, alpha: 0.45, seed: 2608, breaks: 0.3 });
    // puerta de arco con ventanuco y herrajes
    const dx = x + 46, dw = 66, dh = 132;
    const door = [[dx, base], [dx, base - dh + 26], [dx + dw * 0.5, base - dh - 4], [dx + dw, base - dh + 26], [dx + dw, base]];
    const doorS = U.spline(door, 3, false).concat([[dx + dw, base], [dx, base]]);
    Paint.wash(g, U.blobPoly(dx + dw / 2, base - dh / 2 - 4, dw / 2 + 12, dh / 2 + 16, 14, rng, 0.08), '#b4a089', { layers: 2, alpha: 0.5, amp: 0.6, seed: 2620, edge: 0.3 });
    Paint.wash(g, doorS, '#b8752f', { layers: 4, alpha: 0.65, amp: 0.4, seed: 2621, edge: 0.3, core: 1, vary: '#9a5d22', varyAmt: 0.5 });
    Paint.within(g, doorS, () => {
      for (let i = 1; i < 5; i++) Paint.ink(g, [[dx + i * dw / 5, base - dh], [dx + i * dw / 5, base]], { w: 0.9, alpha: 0.45, seed: 2622 + i, color: '#5b3210' });
      Paint.shade(g, [[dx, base - dh], [dx + dw * 0.3, base - dh], [dx + dw * 0.3, base], [dx, base]], '#65340c', { layers: 2, alpha: 0.25, amp: 1, seed: 2627, edge: 0 });
      for (const hy of [base - 100, base - 34]) Paint.ink(g, [[dx + 4, hy], [dx + 30, hy]], { w: 2, alpha: 0.6, color: '#3c2a1e', seed: 2628 + hy });
    });
    Paint.ink(g, doorS, { closed: true, w: 1.6, alpha: 0.75, seed: 2629, breaks: 0.15 });
    // ventanuco de la puerta (luz cálida tenue)
    g.fillStyle = U.rgba('#f4c46a', 0.75); g.fillRect(dx + 22, base - 102, 20, 24);
    Paint.ink(g, [[dx + 22, base - 102], [dx + 42, base - 102], [dx + 42, base - 78], [dx + 22, base - 78], [dx + 22, base - 102]], { w: 1, alpha: 0.6, seed: 2630 });
    // farol junto a la puerta: brazo de hierro y farol de vidrio con campanita (misma silueta
    // que las estaciones de ruta); encendido desde el principio
    const lx = dx + dw + 30, ly = base - 120;
    Paint.ink(g, [[lx - 26, ly - 30], [lx + 4, ly - 30], [lx + 4, ly - 22]], { w: 2.4, alpha: 0.8, color: '#3c2a1e', seed: 2631 });
    Art.drawLanternShape(g, lx + 4, ly - 22, 0.9, true);
    if (life) life.houseLamp = { x: lx + 4, y: ly + 2 };
    // ventana con contraventanas y jardinera
    const wx = x + 250, wy = base - 140, ww = 58, wh = 64;
    Paint.wash(g, [[wx - 6, wy - 6], [wx + ww + 6, wy - 6], [wx + ww + 6, wy + wh + 6], [wx - 6, wy + wh + 6]], '#b8a58d', { layers: 2, alpha: 0.6, amp: 0.3, seed: 2640, edge: 0.3 });
    Paint.wash(g, [[wx, wy], [wx + ww, wy], [wx + ww, wy + wh], [wx, wy + wh]], '#7a5a40', { layers: 3, alpha: 0.7, amp: 0.3, seed: 2641, edge: 0.3, core: 1 });
    Paint.ink(g, [[wx + ww / 2, wy], [wx + ww / 2, wy + wh]], { w: 1.4, alpha: 0.6, color: '#3c2a1e', seed: 2642 });
    Paint.ink(g, [[wx, wy + wh / 2], [wx + ww, wy + wh / 2]], { w: 1.4, alpha: 0.6, color: '#3c2a1e', seed: 2643 });
    for (const sx of [wx - 26, wx + ww + 2]) {
      Paint.wash(g, [[sx, wy - 4], [sx + 24, wy - 4], [sx + 24, wy + wh + 4], [sx, wy + wh + 4]], '#a7783e', { layers: 3, alpha: 0.65, amp: 0.3, seed: 2644 + sx, edge: 0.3, core: 1 });
      for (let k = 1; k < 3; k++) Paint.ink(g, [[sx + k * 8, wy - 2], [sx + k * 8, wy + wh + 2]], { w: 0.8, alpha: 0.45, seed: 2646 + sx + k, color: '#5b3a1c' });
    }
    if (life) life.windows.push({ x: wx + ww / 2, y: wy + wh / 2, ph: 0.3, layer: 'back', k: 0, s: 3.4, id: 'houseWindow' });
    // jardinera con flores amarillas bajo la ventana
    Paint.wash(g, [[wx - 10, wy + wh + 6], [wx + ww + 10, wy + wh + 6], [wx + ww + 6, wy + wh + 22], [wx - 6, wy + wh + 22]], '#9a6a3a', { layers: 2, alpha: 0.8, amp: 0.3, seed: 2650, edge: 0.3, core: 1 });
    leafMass(g, wx + ww / 2, wy + wh + 2, ww / 2 + 8, 8, rng, 26, [C.leaf, C.leafDeep, '#f0c040', '#f7d35a'], 2651);
    // tejado de tablillas con alero; ligera curva y musgo
    const rL = x - 34, rR = x + W + 36, rY = base - Hw - 4, peak = base - Hw - 118;
    const roof = [[rL, rY + 6], [rL + 30, rY - 30], [x + W * 0.42, peak], [x + W * 0.58, peak - 2], [rR - 26, rY - 26], [rR, rY + 4], [rR - 4, rY + 14], [rL + 4, rY + 16]];
    Paint.wash(g, U.spline(roof, 2, true), '#9a7a45', { layers: 4, alpha: 0.65, amp: 1.2, seed: 2660, edge: 0.3, core: 1, vary: '#b38f52', varyAmt: 0.5 });
    Paint.within(g, U.spline(roof, 2, true), () => {
      Paint.wash(g, [[x + W * 0.5, peak - 10], [rR + 10, rY - 30], [rR + 10, rY + 20], [x + W * 0.55, rY + 20]], '#f1cc8a', { layers: 3, alpha: 0.3, amp: 4, seed: 2661, edge: 0 });
      // hileras de tablillas
      for (let r = 0; r < 9; r++) {
        const y = rY + 8 - r * 14;
        const half = U.lerp((rR - rL) / 2, 40, r / 9);
        const cx = (rL + rR) / 2;
        for (let sx = cx - half; sx < cx + half; sx += rng.range(12, 18)) {
          Paint.ink(g, [[sx, y], [sx + rng.range(-1, 1), y - 10]], { w: 0.8, alpha: 0.4, color: '#5a3f1e', seed: 2662 + r * 40 + Math.round(sx) });
        }
        Paint.ink(g, [[cx - half, y + 1], [cx + half, y - 1]], { w: 1, alpha: 0.35, color: '#5a3f1e', seed: 2700 + r, breaks: 0.3 });
      }
      for (let i = 0; i < 9; i++) Paint.wash(g, U.blobPoly(rL + rng.range(30, rR - rL - 30), rY - rng.range(0, 60), rng.range(8, 18), 4, 8, rng, 0.3), rng.pick([C.leaf, '#8f9152']), { layers: 2, alpha: 0.4, amp: 1, seed: 2710 + i, edge: 0.1 });
    });
    Paint.ink(g, [[rL, rY + 6], [rL + 30, rY - 30], [x + W * 0.42, peak], [x + W * 0.58, peak - 2], [rR - 26, rY - 26], [rR, rY + 4]], { w: 1.8, alpha: 0.7, seed: 2711, breaks: 0.2, sketch: 0.3 });
    // alero de madera
    Paint.wash(g, [[rL, rY + 4], [rR, rY + 2], [rR - 2, rY + 14], [rL + 2, rY + 16]], '#6f4d2a', { layers: 2, alpha: 0.7, amp: 0.3, seed: 2712, edge: 0.3, core: 1 });
    // chimenea de piedra
    const cx = x + W * 0.68, cb = peak + 36;
    Paint.wash(g, [[cx, cb], [cx, cb - 92], [cx + 40, cb - 92], [cx + 40, cb + 10]], '#cfb08c', { layers: 3, alpha: 0.8, amp: 0.6, seed: 2720, edge: 0.3, core: 1, vary: '#a8875f', varyAmt: 0.4 });
    for (let i = 0; i < 8; i++) Paint.ink(g, [[cx + 2, cb - 10 - i * 11], [cx + 38, cb - 12 - i * 11]], { w: 0.8, alpha: 0.35, seed: 2721 + i, breaks: 0.4 });
    Paint.wash(g, [[cx - 6, cb - 92], [cx + 46, cb - 92], [cx + 46, cb - 100], [cx - 6, cb - 100]], '#9c8166', { layers: 2, alpha: 0.85, amp: 0.3, seed: 2730, edge: 0.3, core: 1 });
    if (life) life.chimneys.push({ x: cx + 20, y: cb - 104, layer: 'back', s: 3.2, k: 1, id: 'houseChimney' });
    // porche a la derecha: pilares y viga con la parra
    const px0 = x + W - 10, px1 = x + W + 120;
    for (const ppx of [px0 + 20, px1]) {
      Paint.wash(g, [[ppx, base], [ppx, base - 160], [ppx + 12, base - 160], [ppx + 12, base]], C.wood, { layers: 3, alpha: 0.75, amp: 0.4, seed: 2740 + ppx, edge: 0.3, core: 1, vary: C.woodShade, varyAmt: 0.4 });
      Paint.ink(g, [[ppx, base], [ppx, base - 160]], { w: 1, alpha: 0.5, seed: 2742 + ppx });
    }
    Paint.wash(g, [[px0 - 10, base - 160], [px1 + 30, base - 164], [px1 + 30, base - 150], [px0 - 10, base - 146]], C.woodShade, { layers: 2, alpha: 0.8, amp: 0.4, seed: 2744, edge: 0.3, core: 1 });
    leafMass(g, (px0 + px1) / 2 + 10, base - 168, 90, 18, rng, 70, [C.leaf, C.leafDeep, C.leafLit], 2745);
    // barril bajo el porche
    const bx = px0 + 52;
    Paint.wash(g, U.spline([[bx, base], [bx - 4, base - 30], [bx + 2, base - 62], [bx + 44, base - 62], [bx + 50, base - 30], [bx + 46, base]], 3, true), '#9b6b38', { layers: 3, alpha: 0.75, amp: 0.4, seed: 2750, edge: 0.3, core: 1 });
    for (const hy of [base - 12, base - 50]) Paint.ink(g, [[bx - 2, hy], [bx + 48, hy]], { w: 1.6, alpha: 0.6, color: '#3c2a1e', seed: 2751 + hy });
    // enredadera de jazmín: hojas y flores blancas por el muro, flores amarillas abajo
    const vine = [];
    for (let i = 0; i < 9; i++) vine.push([x + rng.range(-10, W * 0.42), base - rng.range(40, Hw + 50)]);
    for (const [vx, vy] of vine) leafMass(g, vx, vy, rng.range(30, 60), rng.range(18, 34), rng, 30, [C.leaf, C.leafDeep, '#a2a85e'], 2760 + vx);
    for (let i = 0; i < 70; i++) {
      const [vx, vy] = rng.pick(vine);
      const fx = vx + rng.range(-50, 50), fy = vy + rng.range(-28, 28);
      for (let k = 0; k < 5; k++) {
        const a = k / 5 * U.TAU;
        g.fillStyle = U.rgba('#fffaf0', 0.9);
        g.beginPath(); g.ellipse(fx + Math.cos(a) * 2.6, fy + Math.sin(a) * 2.6, 2.4, 1.3, a, 0, U.TAU); g.fill();
      }
      g.fillStyle = '#e9b23a'; g.beginPath(); g.arc(fx, fy, 1, 0, U.TAU); g.fill();
    }
    for (let i = 0; i < 26; i++) Paint.softBlob(g, x + rng.range(-20, 120), base - rng.range(4, 50), rng.range(3, 5), '#f2c23c', 0.8);
    // macetas de barro con flores junto a la puerta
    for (const [mx, mw] of [[dx - 34, 26], [dx + dw + 8, 22]]) {
      Paint.wash(g, [[mx, base - 30], [mx + mw, base - 30], [mx + mw - 4, base], [mx + 4, base]], '#b9693c', { layers: 3, alpha: 0.85, amp: 0.3, seed: 2780 + mx, edge: 0.3, core: 1 });
      leafMass(g, mx + mw / 2, base - 40, mw * 0.7, 14, rng, 18, [C.leaf, '#f2c23c', '#f7d35a'], 2781 + mx);
    }
    // escalones de piedra que bajan hacia el camino
    for (let s = 0; s < 3; s++) {
      const sy = base + 8 + s * 14, sw = 120 + s * 26;
      Paint.wash(g, [[dx - 30 - s * 13, sy - 12], [dx - 30 - s * 13 + sw, sy - 12], [dx - 26 - s * 13 + sw, sy + 2], [dx - 34 - s * 13, sy + 2]], rng.pick(['#cbbfb1', '#bdb0a2', '#d6c9ba']), { layers: 2, alpha: 0.85, amp: 0.4, seed: 2790 + s, edge: 0.3, core: 1 });
      Paint.ink(g, [[dx - 30 - s * 13, sy - 12], [dx - 30 - s * 13 + sw, sy - 12]], { w: 1, alpha: 0.4, seed: 2795 + s, breaks: 0.3 });
    }
  }

  // Taller (concepto): muro de piedra enlucida, pilares y vigas de madera, tejadillo de
  // tablillas sobre la zona de trabajo. Lo que cambia con el uso (herramientas, toldo, luz) va aparte.
  function paintWorkshop(g, x, base) {
    const rng = U.makeRng(2801);
    const W = 520, Hw = 200;
    Paint.shade(g, [[x - 20, base - 4], [x + W + 30, base - 4], [x + W + 40, base + 14], [x - 30, base + 14]], '#5a4430', { layers: 3, alpha: 0.22, amp: 4, seed: 2802, edge: 0 });
    const wall = [[x + 40, base], [x + 40, base - Hw], [x + W - 20, base - Hw], [x + W - 20, base]];
    Paint.wash(g, wall, '#d9a75f', { layers: 4, alpha: 0.6, amp: 1.2, seed: 2803, edge: 0.3, core: 1, vary: '#b57838', varyAmt: 0.5 });
    Paint.within(g, wall, () => {
      Paint.wash(g, U.blobPoly(x + W * 0.45, base - 110, 160, 90, 14, rng, 0.2), '#f6c66c', { layers: 3, alpha: 0.35, amp: 6, seed: 2804, edge: 0 });
      Paint.shade(g, [[x + 40, base - Hw], [x + W, base - Hw], [x + W, base - Hw + 50], [x + 40, base - Hw + 56]], '#7c4f22', { layers: 3, alpha: 0.32, amp: 3, seed: 2805, edge: 0 });
      for (let i = 0; i < 50; i++) {
        const sx = x + rng.range(46, W - 26), sy = base - rng.range(8, Hw - 8);
        Paint.ink(g, U.blobPoly(sx, sy, rng.range(8, 14), rng.range(5, 8), 7, rng, 0.2).slice(0, 5), { w: 0.7, alpha: 0.25, seed: 2810 + i, color: '#6b4419', breaks: 0.4 });
      }
    });
    // pilares y vigas
    for (const px of [x + 30, x + 250, x + W - 30]) {
      Paint.wash(g, [[px, base], [px, base - Hw - 30], [px + 16, base - Hw - 30], [px + 16, base]], C.wood, { layers: 3, alpha: 0.8, amp: 0.4, seed: 2820 + px, edge: 0.3, core: 1, vary: C.woodShade, varyAmt: 0.5 });
      Paint.ink(g, [[px, base], [px, base - Hw - 30]], { w: 1.2, alpha: 0.55, seed: 2822 + px });
      Paint.ink(g, [[px + 16, base], [px + 16, base - Hw - 30]], { w: 0.9, alpha: 0.4, seed: 2823 + px });
    }
    Paint.wash(g, [[x, base - Hw - 30], [x + W + 20, base - Hw - 34], [x + W + 20, base - Hw - 16], [x, base - Hw - 12]], C.woodShade, { layers: 3, alpha: 0.85, amp: 0.4, seed: 2830, edge: 0.3, core: 1 });
    // tejadillo de tablillas
    const roof = [[x - 30, base - Hw - 24], [x + 60, base - Hw - 74], [x + W - 20, base - Hw - 84], [x + W + 50, base - Hw - 30], [x + W + 40, base - Hw - 18], [x - 26, base - Hw - 12]];
    Paint.wash(g, roof, '#9b7c48', { layers: 4, alpha: 0.7, amp: 1, seed: 2831, edge: 0.3, core: 1, vary: '#b8955a', varyAmt: 0.5 });
    Paint.within(g, roof, () => {
      for (let r = 0; r < 5; r++) {
        const y = base - Hw - 22 - r * 12;
        for (let sx = x - 20 + r * 18; sx < x + W + 40 - r * 14; sx += rng.range(12, 18)) Paint.ink(g, [[sx, y], [sx, y - 9]], { w: 0.7, alpha: 0.35, color: '#5a3f1e', seed: 2840 + r * 60 + Math.round(sx) });
      }
      Paint.wash(g, [[x + W * 0.5, base - Hw - 90], [x + W + 60, base - Hw - 40], [x + W + 60, base - Hw], [x + W * 0.5, base - Hw]], '#f2cd8a', { layers: 2, alpha: 0.28, amp: 4, seed: 2850, edge: 0 });
    });
    Paint.ink(g, roof.slice(0, 4), { w: 1.6, alpha: 0.65, seed: 2851, breaks: 0.2, sketch: 0.3 });
    // banco de trabajo (siempre ahí) y tablones apoyados
    const wb = x + 300;
    Paint.wash(g, [[wb, base - 64], [wb + 150, base - 64], [wb + 150, base - 52], [wb, base - 52]], '#8e6538', { layers: 3, alpha: 0.85, amp: 0.3, seed: 2860, edge: 0.3, core: 1 });
    for (const lx of [wb + 8, wb + 134]) Paint.wash(g, [[lx, base - 52], [lx + 9, base - 52], [lx + 9, base], [lx, base]], '#6f4d2a', { layers: 2, alpha: 0.85, amp: 0.2, seed: 2861 + lx, edge: 0.3, core: 1 });
    for (let k = 0; k < 4; k++) {
      const px = x + 200 + k * 9;
      Paint.wash(g, [[px, base], [px + 12, base - 150 + k * 6], [px + 22, base - 148 + k * 6], [px + 12, base]], rng.pick([C.woodLight, C.wood, '#c29458']), { layers: 2, alpha: 0.8, amp: 0.3, seed: 2870 + k, edge: 0.3, core: 1 });
    }
  }

  // Campos: hileras de tierra labrada en perspectiva lateral (bandas onduladas que se alejan).
  function paintFields(g, x0, x1, base) {
    const rng = U.makeRng(2901);
    const poly = [[x0, base], [x0 + 30, base - 120], [x1 - 30, base - 130], [x1, base]];
    Paint.wash(g, poly, '#a8865a', { layers: 4, alpha: 0.6, amp: 2, seed: 2902, edge: 0.25, core: 1, vary: '#8a6a43', varyAmt: 0.5 });
    Paint.within(g, poly, () => {
      for (let r = 0; r < 9; r++) {
        const y = base - 8 - r * 13;
        const pts = [];
        for (let x = x0; x <= x1; x += 40) pts.push([x, y + Math.sin(x * 0.01 + r) * 2]);
        Paint.ink(g, pts, { w: 3.2 - r * 0.25, alpha: 0.4, color: '#6e5235', seed: 2910 + r, wobble: 0.6, breaks: 0.15 });
        Paint.ink(g, pts.map(([x, yy]) => [x, yy - 3]), { w: 1.2, alpha: 0.35, color: '#e6c690', seed: 2930 + r, wobble: 0.6, breaks: 0.3 });
      }
      Paint.wash(g, [[x0, base - 130], [x1, base - 130], [x1, base - 90], [x0, base - 80]], C.haze, { layers: 3, alpha: 0.25, amp: 6, seed: 2950, edge: 0 });
    });
    // seto al fondo de los campos
    const hedge = [];
    for (let x = x0 + 20; x < x1 - 20; x += 30) hedge.push([x, base - 128 + rng.range(-4, 4)]);
    for (const [hx, hy] of hedge) Art.leafMass(g, hx, hy, 24, 10, rng, 8, [C.leafDeep, C.leaf, '#6d7244'], 2960 + hx);
  }

  function paintTerraces(g, L, rng) {
    for (let k = 0; k < 4; k++) {
      const wx0 = 5000 + k * 380, wx1 = wx0 + 360;
      const y0 = BY(L.gy(wx0)) - 70 - k * 18, y1 = BY(L.gy(wx1)) - 70 - k * 18;
      const pts = [[BX(wx0), y0], [BX(wx1), y1]];
      const wall = [[pts[0][0], pts[0][1]], [pts[1][0], pts[1][1]], [pts[1][0], pts[1][1] + 34], [pts[0][0], pts[0][1] + 34]];
      Paint.wash(g, wall, '#c9b49c', { layers: 3, alpha: 0.7, amp: 1, seed: 3001 + k, edge: 0.3, core: 1, vary: '#a8957f', varyAmt: 0.4 });
      Paint.within(g, wall, () => {
        for (let i = 0; i < 26; i++) {
          const x = U.lerp(pts[0][0], pts[1][0], rng.next()), y = U.lerp(y0, y1, 0.5) + rng.range(4, 30);
          Paint.ink(g, U.blobPoly(x, y, rng.range(6, 12), rng.range(4, 7), 7, rng, 0.25).slice(0, 5), { w: 0.8, alpha: 0.35, seed: 3010 + k * 30 + i, color: '#6f5d4c' });
        }
      });
      for (let i = 0; i < 5; i++) Art.paintOlive(g, U.lerp(pts[0][0], pts[1][0], rng.next()), U.lerp(y0, y1, 0.5) - 4, rng.range(48, 66), rng);
    }
  }

  // Torre vieja en ruinas sobre la Colina de las Piedras: aquí guarda el valle el Caballero.
  function paintRuin(g, x, base, rng) {
    const tower = [[x, base], [x + 4, base - 250], [x + 30, base - 262], [x + 46, base - 236], [x + 70, base - 268], [x + 96, base - 250], [x + 110, base - 214], [x + 116, base]];
    Paint.wash(g, tower, '#bcab98', { layers: 4, alpha: 0.75, amp: 1, seed: 3101, edge: 0.3, core: 1, vary: '#9f8f80', varyAmt: 0.4 });
    Paint.within(g, tower, () => {
      Paint.shade(g, [[x + 70, base - 280], [x + 120, base - 280], [x + 120, base], [x + 64, base]], '#7c6c62', { layers: 3, alpha: 0.3, amp: 3, seed: 3102, edge: 0 });
      for (let i = 0; i < 40; i++) {
        const sx = x + rng.range(4, 112), sy = base - rng.range(6, 250);
        Paint.ink(g, U.blobPoly(sx, sy, rng.range(7, 12), rng.range(4, 7), 7, rng, 0.2).slice(0, 5), { w: 0.8, alpha: 0.3, seed: 3110 + i, color: '#5f5048' });
      }
      g.fillStyle = U.rgba('#5f5048', 0.5);
      g.beginPath(); g.moveTo(x + 40, base - 150); g.lineTo(x + 40, base - 180); g.quadraticCurveTo(x + 56, base - 196, x + 72, base - 180); g.lineTo(x + 72, base - 150); g.fill();
    });
    Paint.ink(g, tower, { closed: true, w: 1.5, alpha: 0.55, seed: 3103, breaks: 0.3, sketch: 0.3 });
    Art.leafMass(g, x + 20, base - 240, 30, 16, rng, 16, [C.leaf, C.leafDeep], 3104);
    // piedras sueltas al pie y un muro caído
    for (let i = 0; i < 8; i++) Paint.wash(g, U.blobPoly(x - 120 + rng.range(0, 320), base - rng.range(0, 10), rng.range(10, 22), rng.range(6, 12), 9, rng, 0.25), rng.pick(['#c2b19f', '#a89888']), { layers: 2, alpha: 0.75, amp: 0.4, seed: 3120 + i, edge: 0.3, core: 1 });
  }

  // ------------------------------------------------------------------ capas de estado del fondo
  // Taller cerrado (estado inicial): contraventanas y toldo recogido. Abierto (transición en
  // adelante): herramientas colgadas, toldo tendido, serrín y el farol del taller encendido.
  Art.workshopSprites = function () {
    const at = Art.workshopAt, x = at.x, base = at.y;
    const box = { w: 800, h: 340, ox: -(x - 220), oy: -(base - 300) };
    const closed = Paint.makeSprite({ w: box.w, h: box.h, ox: box.ox, oy: box.oy, res: 0.9, post: POST }, (g) => {
      const rng = U.makeRng(2881);
      // tablas cerrando el frente
      for (let i = 0; i < 18; i++) {
        const px = x + 52 + i * 24;
        Paint.wash(g, [[px, base - 4], [px + 22, base - 4], [px + 22, base - 186], [px, base - 186]], rng.pick(['#8e6a42', '#9c7748', '#7f5d38']), { layers: 2, alpha: 0.85, amp: 0.3, seed: 2882 + i, edge: 0.3, core: 1 });
        Paint.ink(g, [[px, base - 4], [px, base - 186]], { w: 0.9, alpha: 0.45, seed: 2900 + i, color: '#4a3220' });
      }
      Paint.ink(g, [[x + 52, base - 70], [x + 484, base - 70]], { w: 2.4, alpha: 0.7, color: '#4a3220', seed: 2920 });
      Paint.ink(g, [[x + 52, base - 150], [x + 484, base - 150]], { w: 2.4, alpha: 0.7, color: '#4a3220', seed: 2921 });
      // toldo enrollado bajo el alero
      Paint.wash(g, [[x - 20, base - 232], [x + 200, base - 236], [x + 200, base - 222], [x - 20, base - 218]], '#e9dcc4', { layers: 3, alpha: 0.85, amp: 0.4, seed: 2922, edge: 0.3, core: 1 });
    });
    const open = Paint.makeSprite({ w: box.w, h: box.h, ox: box.ox, oy: box.oy, res: 0.9, post: POST }, (g) => {
      const rng = U.makeRng(2981);
      // herramientas colgadas: sierra, martillos, tenazas, formones
      const tools = [[x + 120, 'saw'], [x + 170, 'hammer'], [x + 196, 'pliers'], [x + 360, 'saw'], [x + 410, 'hammer'], [x + 440, 'chisel'], [x + 462, 'chisel']];
      for (const [tx, kind] of tools) {
        const ty = base - 176;
        Paint.ink(g, [[tx, ty - 6], [tx, ty]], { w: 0.8, alpha: 0.6, seed: 2990 + tx });
        if (kind === 'saw') {
          Paint.wash(g, [[tx - 4, ty], [tx + 4, ty], [tx + 10, ty + 62], [tx - 12, ty + 62]], '#a9a39a', { layers: 2, alpha: 0.85, amp: 0.2, seed: 2991 + tx, edge: 0.3, core: 1 });
          Paint.wash(g, [[tx - 6, ty - 4], [tx + 6, ty - 4], [tx + 6, ty + 10], [tx - 6, ty + 10]], '#8a5a30', { layers: 2, alpha: 0.9, amp: 0.2, seed: 2992 + tx, edge: 0.3, core: 1 });
        } else if (kind === 'hammer') {
          Paint.ink(g, [[tx, ty], [tx, ty + 44]], { w: 3, alpha: 0.85, color: '#8a5a30', seed: 2993 + tx });
          Paint.wash(g, [[tx - 10, ty + 40], [tx + 10, ty + 40], [tx + 10, ty + 50], [tx - 10, ty + 50]], '#5c5650', { layers: 2, alpha: 0.9, amp: 0.2, seed: 2994 + tx, edge: 0.3, core: 1 });
        } else if (kind === 'pliers') {
          Paint.ink(g, [[tx - 3, ty], [tx + 2, ty + 36]], { w: 2, alpha: 0.85, color: '#4d4844', seed: 2995 + tx });
          Paint.ink(g, [[tx + 3, ty], [tx - 2, ty + 36]], { w: 2, alpha: 0.85, color: '#4d4844', seed: 2996 + tx });
        } else {
          Paint.ink(g, [[tx, ty], [tx, ty + 30]], { w: 2.2, alpha: 0.85, color: '#8a5a30', seed: 2997 + tx });
          Paint.ink(g, [[tx, ty + 30], [tx, ty + 44]], { w: 1.6, alpha: 0.85, color: '#77716a', seed: 2998 + tx });
        }
      }
      // tabla sobre el banco, cepillo y serrín
      Paint.wash(g, [[x + 310, base - 70], [x + 440, base - 72], [x + 440, base - 64], [x + 310, base - 62]], C.woodNew, { layers: 2, alpha: 0.9, amp: 0.2, seed: 3001, edge: 0.3, core: 1 });
      Paint.splatter(g, x + 380, base - 4, 80, 4, 40, '#e8cc95', { alpha: 0.9, rmin: 0.6, rmax: 1.6, seed: 3002 });
      // banquetas y un cubo
      for (const sx of [x + 270, x + 470]) {
        Paint.wash(g, [[sx, base - 40], [sx + 34, base - 40], [sx + 34, base - 34], [sx, base - 34]], '#8e6538', { layers: 2, alpha: 0.9, amp: 0.2, seed: 3003 + sx, edge: 0.3, core: 1 });
        for (const lx of [sx + 3, sx + 27]) Paint.ink(g, [[lx, base - 34], [lx, base]], { w: 2.4, alpha: 0.85, color: '#6f4d2a', seed: 3004 + lx });
      }
      // toldo de lona tendido hacia la izquierda
      const aw = [[x + 30, base - 226], [x - 170, base - 186], [x - 176, base - 176], [x + 30, base - 206]];
      Paint.wash(g, aw, '#f1e6d1', { layers: 3, alpha: 0.85, amp: 0.8, seed: 3005, edge: 0.3, core: 1 });
      Paint.shade(g, [[x + 30, base - 210], [x - 176, base - 178], [x - 170, base - 172], [x + 30, base - 200]], '#bfae94', { layers: 2, alpha: 0.4, amp: 0.4, seed: 3006, edge: 0 });
      Paint.ink(g, [[x + 30, base - 226], [x - 170, base - 186]], { w: 1.1, alpha: 0.5, seed: 3007 });
      Paint.ink(g, [[x - 172, base - 182], [x - 176, base]], { w: 2.4, alpha: 0.8, color: '#6f4d2a', seed: 3008 });
      // farol del taller (misma silueta de vidrio y campana)
      Art.drawLanternShape(g, x + 252, base - 214, 0.85, true);
      // un poco de vida: un delantal colgado y una regadera
      Paint.wash(g, [[x + 64, base - 150], [x + 92, base - 150], [x + 98, base - 96], [x + 60, base - 96]], '#d8c4a0', { layers: 2, alpha: 0.85, amp: 0.4, seed: 3009, edge: 0.3, core: 1 });
      Paint.wash(g, U.blobPoly(x + 500, base - 16, 16, 14, 10, rng, 0.1), '#7d8a86', { layers: 2, alpha: 0.85, amp: 0.2, seed: 3010, edge: 0.3, core: 1 });
    });
    return { closed, open, lamp: { x: x + 252, y: base - 190 } };
  };

  // Cultivos en tres estados: brotes (inicial), plantas a medio crecer (transición) y huerta llena
  // (restaurado; aun así, «campos todavía en crecimiento»).
  Art.fieldSprites = function () {
    const f = Art.fieldsAt, x0 = f.x0, x1 = f.x1, base = f.y;
    const mk = (stage) => Paint.makeSprite({ w: x1 - x0 + 80, h: 220, ox: -(x0 - 40), oy: -(base - 180), res: 0.85, post: POST }, (g) => {
      const rng = U.makeRng(3200 + stage);
      for (let r = 0; r < 9; r++) {
        const y = base - 12 - r * 13, sc = 1 - r * 0.07;
        for (let x = x0 + 20 + rng.range(0, 20); x < x1 - 20; x += rng.range(26, 40) * sc) {
          if (stage === 0) {
            if (!rng.chance(0.35)) continue;
            for (const s of [-1, 1]) Paint.ink(g, [[x, y], [x + s * 3 * sc, y - 5 * sc]], { w: 1.4 * sc, alpha: 0.8, color: '#8fa055', seed: Math.round(x + r * 997 + s) });
          } else {
            const big = stage === 2 ? rng.range(0.9, 1.3) : rng.range(0.45, 0.8);
            const kind = r % 3;
            if (kind === 0) {
              // col: hojas redondas verde azulado
              const rr = 10 * sc * big;
              Paint.wash(g, U.blobPoly(x, y - rr * 0.6, rr, rr * 0.7, 10, rng, 0.25), rng.pick(['#8fa48c', '#7b947c', '#a3b49a']), { layers: 3, alpha: 0.75, amp: 0.4, seed: Math.round(x + r * 31), edge: 0.35, core: 1 });
              Paint.wash(g, U.blobPoly(x + rr * 0.2, y - rr * 0.9, rr * 0.5, rr * 0.35, 8, rng, 0.2), '#c6d2b4', { layers: 2, alpha: 0.5, amp: 0.2, seed: Math.round(x + r * 37), edge: 0 });
            } else if (kind === 1 && stage === 2 && rng.chance(0.5)) {
              // calabaza naranja entre hojas
              const rr = 8 * sc;
              Art.leafMass(g, x, y - 6 * sc, 16 * sc, 6 * sc, rng, 5, [C.leaf, C.leafDeep], Math.round(x * 3 + r));
              Paint.wash(g, U.blobPoly(x + 4, y - rr * 0.7, rr, rr * 0.75, 10, rng, 0.15), rng.pick(['#e0873c', '#d8752e', '#eb9a4a']), { layers: 3, alpha: 0.85, amp: 0.3, seed: Math.round(x + r * 41), edge: 0.4, core: 1 });
            } else {
              // hilera de lechugas o judías
              Art.leafMass(g, x, y - 8 * sc * big, 12 * sc * big, 7 * sc * big, rng, stage === 2 ? 8 : 5, [C.leafLit, C.leaf, '#b6c27c'], Math.round(x * 7 + r));
            }
          }
        }
      }
      if (stage === 2) {
        // girasoles al borde de la huerta: variedad de color
        for (let i = 0; i < 9; i++) {
          const x = U.lerp(x0 + 40, x1 - 40, i / 8) + rng.range(-20, 20), y = base - 120;
          Paint.ink(g, [[x, y + 30], [x + rng.range(-3, 3), y - 20]], { w: 2, alpha: 0.85, color: '#6f7a3c', seed: 3290 + i });
          for (let k = 0; k < 10; k++) {
            const a = k / 10 * U.TAU;
            g.fillStyle = U.rgba('#f2c23c', 0.9);
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
        Paint.wash(g, [[cx - w / 2, cy], [cx + w / 2, cy], [cx + w / 2 + rng.range(-2, 2), cy + h], [cx - w / 2 + rng.range(-2, 2), cy + h + rng.range(-3, 3)]], col, { layers: 3, alpha: 0.85, amp: 0.6, seed: 3305 + t * 100, edge: 0.35, core: 1 });
        Paint.ink(g, [[cx - w / 2 + 4, cy - 2], [cx - w / 2 + 4, cy + 4]], { w: 1.2, alpha: 0.7, seed: 3310 + t * 100 });
      }
    });
  };
})(window.JHS = window.JHS || {});
