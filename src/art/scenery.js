/* Escenario pintado del nivel: cielo de amanecer con tormenta que se abre, rayos de sol,
   montañas lejanas y medias con perspectiva atmosférica, el valle que se descubre desde el
   mirador, colinas cercanas y el suelo del sendero con piedras, raíces y hierba.
   Iluminación (§7): seguridad cálida + esperanza: un rayo dorado entrando en un cielo oscuro. */
(function (JHS) {
  'use strict';
  const U = JHS.U, Paint = JHS.Paint, P = JHS.Palette, Props = JHS.Props, Obj = JHS.Objects;

  const SUN = { x: 1440, y: 250 };   // en el espacio S de la capa del cielo
  const BOTTOM = 1460;               // fondo del lienzo del plano jugable

  // ------------------------------------------------------------------ utilidades de relieve
  function keyY(keys, x) {
    if (x <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      if (x <= keys[i][0]) {
        const a = keys[i - 1], b = keys[i];
        return U.lerp(a[1], b[1], U.smooth((x - a[0]) / (b[0] - a[0])));
      }
    }
    return keys[keys.length - 1][1];
  }

  // Cresta: interpolación suave de picos + ruido «cresta» que afila las cumbres.
  function ridgePts(x0, x1, step, keys, rough, seed) {
    const pts = [];
    for (let x = x0; x <= x1 + 0.1; x += step) {
      const n = U.fbm1(x * 0.0035, 4, seed);
      const r = 1 - Math.abs(2 * U.fbm1(x * 0.009, 3, seed + 3) - 1);
      pts.push([x, keyY(keys, x) - (n - 0.5) * rough - r * r * rough * 0.45 + (U.noise1(x * 0.05, seed + 9) - 0.5) * rough * 0.06]);
    }
    return pts;
  }

  function minY(pts) { let m = Infinity; for (const p of pts) if (p[1] < m) m = p[1]; return m; }

  // Cordillera pintada en un sprite propio, «secada» y estampada en la capa. Llega hasta el
  // fondo de la capa (bajo la bruma) para que nunca se vea un hueco, y puede fundirse en
  // los extremos (fadeL/fadeR) para no dejar bordes rectos.
  function paintRange(layer, o) {
    const x0 = o.x0 == null ? layer.x0 : o.x0, x1 = o.x1 == null ? layer.x1 : o.x1;
    const bottom = o.bottom == null ? layer.y1 : o.bottom;
    const pts = ridgePts(x0, x1, o.step || 6, o.keys, o.rough || 60, o.seed);
    const top = minY(pts) - 40;
    const W = x1 - x0, Hh = bottom - top;
    const rng = U.makeRng(o.seed * 13 + 5);
    const spr = Paint.makeSprite({ w: W, h: Hh, ox: -x0, oy: -top, res: layer.q, read: true,
      post: { edge: o.edge == null ? 0.5 : o.edge, grain: (o.grain == null ? 0.7 : o.grain) * 0.55, density: 0.1, gx: o.seed * 37, gy: o.seed * 11, radius: 3, texScale: 1 / layer.q } }, (g) => {
      const poly = pts.concat([[x1, bottom], [x0, bottom]]);
      Paint.wash(g, poly, o.light, { layers: 4, alpha: 0.25, amp: 2, seed: o.seed, edge: 0.15, core: 1, vary: o.mid, varyAmt: 0.3, baseDepth: 1, depth: 2 });
      Paint.within(g, poly, () => {
        // tono medio que crece hacia abajo
        Paint.shade(g, pts.map(([x, y]) => [x, y + (o.midDepth || 70) + U.noise1(x * 0.01, o.seed) * 40]).concat([[x1, bottom], [x0, bottom]]), o.mid,
          { layers: 5, alpha: 0.1, amp: 14, seed: o.seed + 1, edge: 0 });
        // caras en sombra: planos suaves donde la cresta sube hacia la derecha (de espaldas al sol)
        const st = o.step || 6;
        g.lineCap = 'round';
        for (let i = 2; i < pts.length - 2; i++) {
          const [x, y] = pts[i];
          const slope = (pts[i + 2][1] - pts[i - 2][1]) / (pts[i + 2][0] - pts[i - 2][0]);
          const sh = U.clamp(-slope * 1.4 + 0.06, 0, 1);
          if (sh < 0.06) continue;
          const depth = (o.shadeDepth || 130) * U.lerp(0.35, 1, rng.next()) * (0.4 + sh * 0.6);
          g.strokeStyle = o.shade;
          g.globalAlpha = (0.05 + 0.13 * sh) * (o.shadeK || 1);
          g.lineWidth = st * rng.range(1.3, 2.2);
          g.beginPath();
          g.moveTo(x, y + 1);
          g.quadraticCurveTo(x - depth * 0.08, y + depth * 0.5, x - depth * 0.2 + rng.range(-4, 4), y + depth);
          g.stroke();
        }
        // luz del amanecer en las laderas que miran al sol
        for (let i = 2; i < pts.length - 2; i++) {
          const [x, y] = pts[i];
          const slope = (pts[i + 2][1] - pts[i - 2][1]) / (pts[i + 2][0] - pts[i - 2][0]);
          const sl = U.clamp(slope * 1.8, 0, 1);
          if (sl < 0.08 || !o.rim) continue;
          g.strokeStyle = o.rim;
          g.globalAlpha = 0.4 * sl * (o.rimK || 1);
          g.lineWidth = st * 1.4;
          g.beginPath(); g.moveTo(x, y + 1.5); g.lineTo(x + rng.range(-3, 3), y + 6 + sl * rng.range(10, 34)); g.stroke();
        }
        for (let k = 0; k < (o.gullies || 0); k++) {
          const i = 2 + Math.floor(rng.next() * (pts.length - 4));
          const [x, y] = pts[i];
          const len = rng.range(30, 110);
          Paint.ink(g, [[x, y + 2], [x - len * 0.1, y + len * 0.5], [x - len * 0.18 + rng.range(-6, 6), y + len]], { w: rng.range(0.8, 1.5), alpha: 0.16, color: o.shade, seed: o.seed + 40 + k, taper: 0.6 });
        }
        g.globalAlpha = 1;
        if (o.extra) o.extra(g, pts, rng);
        // bruma: desde mistTop se funde hasta el color de bruma, opaco hasta el fondo
        if (o.mist) {
          const mTop = o.mistTop == null ? bottom - 200 : o.mistTop;
          const mH = o.mistH || 160;
          const gr = g.createLinearGradient(0, mTop, 0, mTop + mH);
          gr.addColorStop(0, U.rgba(o.mist, 0));
          gr.addColorStop(1, U.rgba(o.mist, o.mistA || 0.92));
          g.fillStyle = gr;
          g.fillRect(x0, mTop, W, mH);
          g.fillStyle = U.rgba(o.mist, o.mistA || 0.92);
          g.fillRect(x0, mTop + mH - 1, W, bottom - mTop - mH + 2);
        }
      });
      if (o.ink) Paint.ink(g, pts, { w: o.inkW || 1.3, alpha: o.ink, breaks: 0.45, seed: o.seed + 5, color: P.inkWarm, wobble: 0.3 });
      if (o.after) o.after(g, pts, rng);
      // extremos fundidos
      g.globalCompositeOperation = 'destination-out';
      for (const [side, len] of [['L', o.fadeL], ['R', o.fadeR]]) {
        if (!len) continue;
        const xa = side === 'L' ? x0 : x1 - len, xb = side === 'L' ? x0 + len : x1;
        const gr = g.createLinearGradient(xa, 0, xb, 0);
        gr.addColorStop(0, side === 'L' ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0)');
        gr.addColorStop(1, side === 'L' ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,1)');
        g.fillStyle = gr;
        g.fillRect(xa, top, len, Hh);
      }
      g.globalCompositeOperation = 'source-over';
    });
    layer.stamp(spr, 0, 0, { sparse: true });
    return pts;
  }

  // Abeto lejano: pincelada vertical en capas.
  function conifer(g, x, y, h, col, rng) {
    const w = h * rng.range(0.28, 0.36);
    g.fillStyle = col;
    for (let k = 0; k < 4; k++) {
      const yy = y - h * (k / 4) * 0.85, ww = w * (1 - k * 0.2);
      g.globalAlpha = 0.75;
      g.beginPath();
      g.moveTo(x - ww / 2, yy);
      g.quadraticCurveTo(x, yy + h * 0.06, x + ww / 2, yy);
      g.lineTo(x + rng.range(-1, 1), yy - h * 0.38);
      g.closePath();
      g.fill();
    }
    g.globalAlpha = 1;
  }

  function roundTree(g, x, y, r, cols, rng) {
    for (let k = 0; k < 7; k++) {
      g.fillStyle = cols[k % cols.length];
      g.globalAlpha = 0.6;
      g.beginPath();
      g.ellipse(x + rng.gauss() * r * 0.35, y - r * 0.6 + rng.gauss() * r * 0.25, r * rng.range(0.45, 0.65), r * rng.range(0.35, 0.5), rng.range(-0.5, 0.5), 0, U.TAU);
      g.fill();
    }
    g.globalAlpha = 1;
  }

  // ------------------------------------------------------------------ cielo
  // Lavado graduado + masas de tormenta en húmedo (baja resolución ampliada = bordes fundidos)
  // + algunos bordes en seco + el sol levantando el pigmento. Granulación fina en los azules.
  function paintSky(layer) {
    const x0 = layer.x0, y0 = layer.y0, W = layer.x1 - layer.x0, H = layer.y1 - layer.y0;
    const box = { x: x0, y: y0, w: W, h: H };
    const rng = U.makeRng(808);
    layer.paint(box, (g) => {
      const gr = g.createLinearGradient(0, -80, 0, 760);
      gr.addColorStop(0, '#5f688c');
      gr.addColorStop(0.2, '#7d83a2');
      gr.addColorStop(0.4, '#aba4b8');
      gr.addColorStop(0.56, '#dcc3b0');
      gr.addColorStop(0.72, '#f1d7ae');
      gr.addColorStop(1, '#f6e1b9');
      g.fillStyle = gr;
      g.fillRect(x0, y0, W, H);
    });
    // masas en húmedo
    const k = 0.14;
    const lo = U.makeCanvas(W * k, H * k);
    const lg = lo.ctx;
    lg.setTransform(k, 0, 0, k, -x0 * k, -y0 * k);
    const mass = (cx, cy, rx, ry, top, bot, a) => {
      for (let i = 0; i < 6; i++) {
        const x = cx + rng.gauss() * rx * 0.3, y = cy + rng.gauss() * ry * 0.25;
        const ex = rx * rng.range(0.45, 0.75), ey = ry * rng.range(0.4, 0.7);
        const gg = lg.createLinearGradient(0, y - ey, 0, y + ey);
        gg.addColorStop(0, U.rgba(top, a * 0.7));
        gg.addColorStop(1, U.rgba(bot, a));
        lg.fillStyle = gg;
        lg.beginPath(); lg.ellipse(x, y, ex, ey, rng.range(-0.12, 0.12), 0, U.TAU); lg.fill();
      }
    };
    // banda de tormenta: a la izquierda y arriba, abierta alrededor del sol
    const away = (x, y) => Math.hypot((x - SUN.x) / 1.4, y - SUN.y) > 330;
    for (let i = 0; i < 26; i++) {
      const x = rng.range(-150, 2350), y = rng.range(-110, 230);
      if (!away(x, y)) continue;
      const dark = x < 1000 || x > 1850;
      mass(x, y, rng.range(220, 420), rng.range(60, 120), dark ? '#8f92ab' : '#b3abbd', dark ? P.skyStormDark : P.skyStorm, dark ? 0.55 : 0.35);
    }
    // jirones intermedios y estratos sobre el horizonte
    for (let i = 0; i < 14; i++) {
      const x = rng.range(-100, 2300), y = rng.range(260, 400);
      if (!away(x, y)) continue;
      mass(x, y, rng.range(200, 360), rng.range(18, 34), '#d9c6c4', P.skyLavender, 0.35);
    }
    for (let i = 0; i < 10; i++) mass(rng.range(-100, 2300), rng.range(430, 540), rng.range(260, 420), rng.range(10, 20), '#f2d3b6', '#dcb9a6', 0.3);
    layer.paint(box, (g) => { g.imageSmoothingQuality = 'high'; g.drawImage(lo, x0, y0, W, H); });

    layer.paint(box, (g) => {
      // bordes en seco: pocas nubes con borde nítido y oscurecido (granulan)
      for (let i = 0; i < 9; i++) {
        const cx = rng.next() < 0.65 ? rng.range(-60, 1000) : rng.range(1780, 2250);
        const cy = rng.range(-40, 200);
        const poly = U.blobPoly(cx, cy, rng.range(110, 230), rng.range(22, 46), 20, rng, 0.32);
        Paint.wash(g, poly, i % 2 ? P.skyStorm : P.skyStormDark, { layers: 6, alpha: 0.07, amp: 10, seed: 820 + i, edge: 0.12, blend: 'multiply' });
      }
      // el sol levanta el pigmento: blanco cálido que se abre en dorado
      g.globalCompositeOperation = 'screen';
      const rg = g.createRadialGradient(SUN.x, SUN.y, 0, SUN.x, SUN.y, 1050);
      rg.addColorStop(0, 'rgba(255,250,232,1)');
      rg.addColorStop(0.06, 'rgba(255,242,206,0.95)');
      rg.addColorStop(0.2, 'rgba(252,220,160,0.62)');
      rg.addColorStop(0.42, 'rgba(244,184,112,0.26)');
      rg.addColorStop(1, 'rgba(240,180,110,0)');
      g.fillStyle = rg;
      g.fillRect(x0, y0, W, H);
      g.globalCompositeOperation = 'source-over';
      // ribetes dorados en las nubes cercanas al sol
      for (let i = 0; i < 16; i++) {
        const a = rng.range(-Math.PI, Math.PI), d = rng.range(260, 520);
        const x = SUN.x + Math.cos(a) * d * 1.3, y = SUN.y + Math.sin(a) * d * 0.55;
        const len = rng.range(80, 200);
        Paint.ink(g, [[x - len / 2, y], [x, y - rng.range(-8, 8)], [x + len / 2, y + rng.range(-6, 6)]], { w: rng.range(3, 7), alpha: 0.35, color: '#fde4b0', seed: 840 + i, taper: 0.5, wobble: 1.5 });
      }
    });
    for (const c of layer.chunks.values()) Paint.watercolorize(c.c, { edge: 0.15, grain: 0.2, density: 0.08, radius: 2, gx: 13, gy: 7, texScale: 1.6 });
  }

  // Nube que deriva (sprite aparte): masa en húmedo alargada, más oscura abajo, con ribete
  // dorado del lado que mira al sol.
  function cloudSprite(w, h, seed, dark, sunSide) {
    const res = 0.5;
    const PW = w * 1.5, PH = h * 2.2;
    return Paint.makeSprite({ w: PW, h: PH, ox: PW / 2, oy: PH / 2, res,
      post: { edge: 0.25, grain: 0.22, density: 0.08, gx: seed * 7, texScale: 1.6 } }, (g) => {
      const rng = U.makeRng(seed);
      const k = 0.3;
      const lo = U.makeCanvas(PW * res * k, PH * res * k);
      const lg = lo.ctx;
      lg.setTransform(res * k, 0, 0, res * k, (PW / 2) * res * k, (PH / 2) * res * k);
      const lobes = [];
      for (let i = 0; i < 8; i++) lobes.push([rng.range(-w * 0.3, w * 0.3), rng.range(-h * 0.18, h * 0.12), rng.range(w * 0.14, w * 0.22), rng.range(h * 0.22, h * 0.34)]);
      for (const [x, y, rx, ry] of lobes) {
        const gr = lg.createLinearGradient(0, y - ry, 0, y + ry);
        gr.addColorStop(0, U.rgba(dark ? '#a3a2b9' : '#cdc3cc', 0.85));
        gr.addColorStop(0.6, U.rgba(dark ? P.skyStorm : '#a8a3b8', 0.9));
        gr.addColorStop(1, U.rgba(dark ? P.skyStormDark : P.skyStorm, 0.9));
        lg.fillStyle = gr;
        lg.beginPath(); lg.ellipse(x, y, rx, ry, 0, 0, U.TAU); lg.fill();
      }
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.imageSmoothingQuality = 'high';
      g.drawImage(lo, 0, 0, PW * res, PH * res);
      g.restore();
      g.save();
      g.globalCompositeOperation = 'source-atop';
      for (const [x, y, rx, ry] of lobes) {
        const gr = g.createRadialGradient(x + sunSide * rx * 0.6, y - ry * 0.3, 0, x + sunSide * rx * 0.6, y - ry * 0.3, rx * 0.8);
        gr.addColorStop(0, 'rgba(253,228,182,0.7)');
        gr.addColorStop(1, 'rgba(253,228,182,0)');
        g.fillStyle = gr;
        g.fillRect(x - rx * 2, y - ry * 2, rx * 4, ry * 4);
      }
      g.restore();
    });
  }

  // Rayos pintados (§57): cuñas irregulares con estrías de pincel seco, nunca un haz perfecto.
  function raySprite() {
    const R = 1650;
    return Paint.makeSprite({ w: 2100, h: 2100, ox: 1650, oy: 450, res: 0.4 }, (g) => {
      const rng = U.makeRng(901);
      const n = 19;
      for (let i = 0; i < n; i++) {
        const a = U.lerp(1.25, 3.45, (i + rng.range(0.1, 0.9)) / n);
        const wid = rng.range(0.018, 0.06);
        const len = R * rng.range(0.55, 1);
        const gr = g.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
        gr.addColorStop(0, 'rgba(255,244,214,0)');
        gr.addColorStop(0.04, 'rgba(255,244,214,0.7)');
        gr.addColorStop(0.35, 'rgba(255,238,196,0.32)');
        gr.addColorStop(1, 'rgba(255,238,196,0)');
        g.fillStyle = gr;
        // estrías: varias sub-cuñas finas con huecos
        const sub = 4;
        for (let s = 0; s < sub; s++) {
          if (rng.chance(0.2)) continue;
          const aa = a + (s / sub - 0.5) * wid, ww = wid / sub * rng.range(0.6, 1.4);
          g.globalAlpha = rng.range(0.5, 1);
          g.beginPath();
          g.moveTo(Math.cos(aa) * 30, Math.sin(aa) * 30);
          g.lineTo(Math.cos(aa - ww) * len, Math.sin(aa - ww) * len);
          g.lineTo(Math.cos(aa + ww) * len * rng.range(0.85, 1), Math.sin(aa + ww) * len * rng.range(0.85, 1));
          g.closePath();
          g.fill();
        }
      }
      g.globalAlpha = 1;
      // rompe los rayos con la textura del papel para que parezcan levantados con pincel
      g.globalCompositeOperation = 'destination-out';
      g.globalAlpha = 0.35;
      g.fillStyle = g.createPattern(JHS.Tex.grainMask, 'repeat');
      g.fillRect(-1650, -450, 2100, 2100);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    });
  }

  // ------------------------------------------------------------------ montañas
  function paintFar(layer) {
    // la cordillera más lejana: lavanda pálido, laderas al sol en melocotón
    paintRange(layer, {
      seed: 11, step: 7, rough: 46,
      keys: [[-80, 470], [250, 425], [520, 458], [830, 388], [1120, 440], [1400, 372], [1650, 432], [1950, 402], [2250, 455], [2520, 418], [2700, 470], [2900, 452]],
      light: '#dcc7c2', mid: '#b9adbb', shade: '#7f7f9f', rim: '#ffd59c', mist: '#efdecb', mistTop: 560, mistH: 170,
      edge: 0.35, grain: 0.6, midDepth: 90, shadeK: 0.9, shadeDepth: 150, rimK: 1.2,
    });
    // mar lejano (presagio de la Costa) asomando sobre la bruma
    layer.paint({ x: 2380, y: 580, w: 540, h: 50 }, (g) => {
      const gr = g.createLinearGradient(0, 590, 0, 616);
      gr.addColorStop(0, 'rgba(176,190,204,0.95)');
      gr.addColorStop(1, 'rgba(214,214,210,0.3)');
      g.fillStyle = gr;
      g.fillRect(2380, 590, 540, 26);
      Paint.ink(g, [[2390, 592], [2640, 590], [2900, 593]], { w: 1.8, alpha: 0.55, color: '#fdebc6', seed: 951, wobble: 0.3 });
    });
    paintRange(layer, {
      seed: 13, step: 6, rough: 52,
      keys: [[-80, 540], [120, 515], [380, 548], [620, 470], [880, 520], [1080, 500], [1320, 455], [1560, 512], [1800, 470], [2060, 505], [2300, 488], [2450, 600], [2600, 640], [2760, 630], [2900, 560]],
      light: '#d2b9b3', mid: '#a597a8', shade: '#6f6f90', rim: '#ffcf92', mist: '#eddbc9', mistTop: 620, mistH: 170,
      edge: 0.4, grain: 0.7, midDepth: 70, shadeDepth: 140, rimK: 1.2,
    });
  }

  function paintMid(layer) {
    const x0 = layer.x0, x1 = layer.x1;
    // 1) el valle: suelo ondulado con bosque, río y un pueblo con luces (presagios de otros mundos).
    //    Su borde lejano queda alto en la capa para verse bajo el horizonte desde el mirador.
    const VK = [[x0, 760], [1500, 720], [1950, 575], [2600, 548], [3300, 556], [4150, 545]];
    const vY = (x) => keyY(VK, x);
    paintRange(layer, {
      seed: 23, step: 6, rough: 18,
      keys: VK,
      light: '#c9bd92', mid: '#a7a27a', shade: '#787c5c', rim: '#f4d8a2', mist: '#ece0cc', mistTop: 1010, mistH: 140, mistA: 0.6,
      edge: 0.4, grain: 0.6, midDepth: 30, shadeK: 0.6,
      extra: (g, pts, rng) => {
        // bruma lejana sobre el borde del valle
        const mg = g.createLinearGradient(0, 540, 0, 610);
        mg.addColorStop(0, 'rgba(238,224,204,0.85)');
        mg.addColorStop(1, 'rgba(238,224,204,0)');
        g.fillStyle = mg;
        g.fillRect(x0, 530, x1 - x0, 80);
        // parcelas y sotos, más grandes cuanto más cerca (perspectiva)
        for (let i = 0; i < 90; i++) {
          const x = rng.range(1650, x1), d = rng.next();
          const y = vY(x) + 30 + d * d * 420;
          const sc = 0.5 + d * 1.4;
          Paint.wash(g, U.blobPoly(x, y, rng.range(40, 90) * sc, rng.range(5, 10) * sc, 10, rng, 0.3), rng.pick([P.hill, P.hillLight, P.leafMid, '#c2b27c', '#b5ad7a']), { layers: 3, alpha: 0.24, amp: 3, seed: 1000 + i, edge: 0.12 });
        }
        // Bosque de los Susurros, a lo lejos
        for (let i = 0; i < 320; i++) {
          const x = rng.range(2150, 2850), d = rng.next();
          const y = vY(x) + 40 + d * 120 + Math.abs(x - 2500) * 0.06;
          roundTree(g, x, y, (8 + d * 9) * rng.range(0.8, 1.2), [P.forest, P.leafShade, P.forestDark], rng);
        }
        // río que serpentea y se ensancha hacia el espectador
        const river = [];
        for (let t = 0; t <= 1.0001; t += 0.015) river.push([U.lerp(1800, x1, t) + Math.sin(t * 7) * 60, vY(U.lerp(1800, x1, t)) + 34 + t * t * 300 + Math.sin(t * 11) * 18]);
        Paint.ink(g, river, { w: 12, alpha: 0.6, color: P.river, seed: 1100, taper: 0.05, wobble: 1.5, press: (t) => 0.4 + t * 1.8 });
        Paint.ink(g, river.map(([x, y]) => [x, y - 1.5]), { w: 3.5, alpha: 0.7, color: '#f8e6bb', seed: 1101, taper: 0.1, breaks: 0.5, wobble: 1, press: (t) => 0.5 + t * 1.5 });
        // Pueblo de las Luces
        for (let i = 0; i < 18; i++) {
          const x = 3260 + rng.range(-140, 170), y = vY(3260) + 150 + rng.range(-14, 34);
          const w = rng.range(12, 20), h = rng.range(9, 14);
          Paint.wash(g, [[x, y], [x + w, y], [x + w, y - h], [x + w / 2, y - h - 8], [x, y - h]], rng.pick(['#c9b9a2', '#b7a58e', '#d7c7ae']), { layers: 2, alpha: 0.85, amp: 0.4, seed: 1200 + i, edge: 0.3, core: 1 });
          Paint.wash(g, [[x - 1, y - h], [x + w / 2, y - h - 9], [x + w + 1, y - h]], '#9a5f3e', { layers: 2, alpha: 0.85, amp: 0.3, seed: 1220 + i, edge: 0.3, core: 1 });
          g.fillStyle = '#ffcf73';
          g.fillRect(x + w * 0.3, y - h * 0.6, 2.6, 2.8);
        }
        Paint.softBlob(g, 3280, vY(3280) + 140, 120, '#ffd690', 0.22);
      },
    });
    // 2) montañas medias a la izquierda que se funden hacia el valle
    paintRange(layer, {
      x1: 2450, seed: 21, step: 5, rough: 70, fadeR: 480,
      keys: [[-150, 600], [150, 560], [420, 610], [700, 520], [980, 585], [1250, 540], [1520, 600], [1800, 575], [2050, 610], [2300, 650], [2450, 680]],
      light: '#c8b0a3', mid: '#9c8b98', shade: '#646a86', rim: '#f7c88f', mist: '#ead7c4', mistTop: 740, mistH: 200,
      ink: 0.3, gullies: 22, edge: 0.5, grain: 0.75, midDepth: 60, shadeDepth: 150,
      after: (g, pts, rng) => {
        for (let i = 0; i < 220; i++) {
          const x = rng.range(x0, 2300), base = keyY([[-150, 760], [2400, 860]], x);
          conifer(g, x, base + rng.range(-40, 50), rng.range(14, 30), rng.chance(0.5) ? P.forest : P.forestDark, rng);
        }
      },
    });
    // 3) montaña de la derecha que cierra la vista del valle
    paintRange(layer, {
      x0: 3380, seed: 25, step: 5, rough: 60, fadeL: 360,
      keys: [[3380, 640], [3560, 560], [3760, 480], [3950, 420], [4150, 460]],
      light: '#c5ada2', mid: '#998996', shade: '#646a86', rim: '#f7c88f', mist: '#ead7c4', mistTop: 700, mistH: 220,
      ink: 0.25, gullies: 10, edge: 0.5, grain: 0.75, midDepth: 50,
    });
  }

  function paintHills(layer) {
    const trees = (g, pts, rng, n, scale) => {
      for (let i = 0; i < n; i++) {
        const p = pts[Math.floor(rng.next() * pts.length)];
        const y = p[1] + rng.range(4, 60);
        if (rng.chance(0.55)) conifer(g, p[0] + rng.range(-10, 10), y, rng.range(26, 54) * scale, rng.chance(0.5) ? P.forest : P.leafShade, rng);
        else roundTree(g, p[0], y, rng.range(14, 26) * scale, [P.leafMid, P.hill, P.leafShade, P.hillLight], rng);
      }
    };
    paintRange(layer, {
      seed: 31, step: 6, rough: 50,
      keys: [[-250, 610], [300, 560], [800, 600], [1300, 540], [1800, 590], [2400, 560], [3000, 620], [3500, 600], [3900, 700], [4400, 790], [5200, 840], [6300, 860]],
      light: '#bab686', mid: '#989974', shade: '#69705a', rim: '#f2d89e', mist: '#e6dcc6', mistTop: 820, mistH: 260, mistA: 0.6,
      ink: 0.3, edge: 0.45, grain: 0.6, midDepth: 50, shadeK: 0.8,
      after: (g, pts, rng) => trees(g, pts, rng, 90, 0.8),
    });
    paintRange(layer, {
      seed: 33, step: 6, rough: 40,
      keys: [[-250, 690], [400, 650], [900, 700], [1500, 640], [2100, 690], [2700, 660], [3300, 720], [3800, 780], [4500, 860], [6300, 900]],
      light: '#c3b679', mid: '#a09a62', shade: '#6d6f47', rim: '#f4da9a', mist: '#e9ddc4', mistTop: 900, mistH: 260, mistA: 0.5,
      ink: 0.45, inkW: 1.5, edge: 0.5, grain: 0.6, midDepth: 40,
      after: (g, pts, rng) => {
        trees(g, pts, rng, 70, 1.1);
        for (let i = 0; i < 30; i++) {
          const p = pts[Math.floor(rng.next() * pts.length)];
          Paint.wash(g, U.blobPoly(p[0], p[1] + rng.range(20, 120), rng.range(10, 26), rng.range(6, 12), 10, rng, 0.3), rng.pick([P.rock, P.rockLight, P.rockWarm]), { layers: 3, alpha: 0.45, amp: 1.5, seed: 1300 + i, edge: 0.3, core: 1 });
        }
      },
    });
  }

  // ------------------------------------------------------------------ plano jugable
  // Polígono de un tramo de suelo con paredes de barranco irregulares.
  function segPoly(seg, rng) {
    const pts = seg.map((p) => p.slice());
    const first = pts[0], last = pts[pts.length - 1];
    const right = [], left = [];
    for (let y = last[1] + 26; y < BOTTOM - 20; y += 34) right.push([last[0] + rng.range(-14, 5) - Math.sin(y * 0.01) * 6, y]);
    for (let y = BOTTOM - 20; y > first[1] + 26; y -= 34) left.push([first[0] + rng.range(-5, 14) + Math.sin(y * 0.012) * 6, y]);
    return pts.concat(right, [[last[0] - 10, BOTTOM], [first[0] + 10, BOTTOM]], left);
  }

  // Tramos de superficie sin las paredes verticales (para sendero, hierba y tinta).
  function surfaceRuns(seg) {
    const runs = [];
    let cur = [seg[0]];
    for (let i = 1; i < seg.length; i++) {
      const a = seg[i - 1], b = seg[i];
      if (Math.abs(b[0] - a[0]) < 2) { if (cur.length > 1) runs.push(cur); cur = [b]; }
      else cur.push(b);
    }
    if (cur.length > 1) runs.push(cur);
    return runs;
  }

  // Muro de piedra seca (como el de «Elementos de Mundo»): bloques planos e irregulares, juntas
  // oscuras, musgo arriba. Se deshace hacia el lado `fade` para fundirse con la tierra.
  function stoneWall(g, x0, y0, x1, y1, seed, fade = 'right') {
    const rng = U.makeRng(seed);
    for (let y = y0; y < y1; ) {
      const rh = rng.range(26, 44);
      for (let x = x0 - rng.range(0, 40); x < x1; ) {
        const w = rng.range(46, 108);
        const edge = fade === 'right' ? (x - (x1 - 150)) / 150 : ((x0 + 150) - x) / 150;
        if (edge > 0 && rng.next() < edge) { x += w + rng.range(2, 5); continue; }
        const j = () => rng.range(-3, 3);
        const poly = U.spline([[x + 3 + j(), y + 2 + j()], [x + w * 0.5, y + j() * 0.6], [x + w - 3 + j(), y + 2 + j()], [x + w + j() * 0.5, y + rh * 0.5],
          [x + w - 4 + j(), y + rh - 2 + j()], [x + w * 0.5, y + rh + j() * 0.5], [x + 4 + j(), y + rh - 2 + j()], [x + j() * 0.5, y + rh * 0.5]], 3, true);
        const col = rng.pick([P.rockCool, P.rock, U.mix(P.rock, P.rockWarm, 0.5), U.mix(P.rockCool, P.rockLight, 0.45), '#a49a92']);
        Paint.wash(g, poly, col, { layers: 3, alpha: 0.4, amp: 1, seed: seed + x + y, edge: 0.3, core: 1, vary: P.rockLight, varyAmt: 0.3 });
        Paint.within(g, poly, () => {
          Paint.shade(g, [[x - 4, y + rh * 0.55], [x + w + 4, y + rh * 0.5], [x + w + 4, y + rh + 4], [x - 4, y + rh + 4]], P.rockShade, { layers: 3, alpha: 0.2, amp: 4, seed: seed + x * 3, edge: 0 });
          Paint.wash(g, [[x + w * 0.4, y - 2], [x + w + 2, y - 2], [x + w + 2, y + rh * 0.3], [x + w * 0.5, y + rh * 0.25]], P.rockLight, { layers: 2, alpha: 0.3, amp: 3, seed: seed + x * 5, edge: 0 });
          Paint.splatter(g, x + w / 2, y + rh / 2, w / 2, rh / 2, w * rh / 70, '#f3e6cf', { alpha: 0.7, rmin: 0.4, rmax: 1, seed: seed + x });
          Paint.splatter(g, x + w / 2, y + rh / 2, w / 2, rh / 2, w * rh / 80, P.inkSoft, { alpha: 0.4, rmin: 0.3, rmax: 0.9, seed: seed + x + 1 });
          if (rng.chance(0.4)) { const cx = x + rng.range(10, w - 10); Paint.ink(g, [[cx, y + 3], [cx + rng.range(-5, 5), y + rh * 0.5], [cx + rng.range(-6, 6), y + rh - 4]], { w: 0.9, alpha: 0.45, seed: seed + x + 2, taper: 0.5 }); }
        });
        Paint.ink(g, poly, { closed: true, w: 1.3, alpha: 0.62, seed: seed + x + y * 3, breaks: 0.3, sketch: 0.3 });
        if (rng.chance(0.3)) Paint.wash(g, U.blobPoly(x + rng.range(8, w - 8), y + 2, rng.range(8, 18), 3.5, 8, rng, 0.3), rng.chance(0.5) ? P.moss : P.mossLight, { layers: 3, alpha: 0.45, amp: 1, seed: seed + x + 5, edge: 0.2 });
        x += w + rng.range(2, 5);
      }
      y += rh + rng.range(2, 4);
    }
  }

  // Cara de acantilado: una sola masa de roca con salientes, repisas con hierba, grietas y
  // sombra creciente hacia abajo. dir = +1 si el vacío queda a la derecha.
  function cliffFace(layer, x, y0, y1, seed, dir) {
    const rng = U.makeRng(seed);
    const outline = [];
    for (let y = y0; y <= y1; y += 18) {
      const t = (y - y0) / (y1 - y0);
      const bulge = (U.fbm1(y * 0.008, 3, seed) - 0.5) * 70 + Math.sin(t * 5 + seed) * 14 - t * 30;
      outline.push([x + dir * (bulge + 10), y]);
    }
    const inner = x - dir * 140;
    const poly = outline.concat([[inner, y1], [inner, y0]]);
    const bb = U.bbox(poly);
    const spr = Paint.makeSprite({ w: bb.w + 40, h: bb.h + 40, ox: -bb.x + 20, oy: -bb.y + 20, res: layer.q, read: true,
      post: { edge: 0.45, grain: 0.6, density: 0.15, gx: seed, gy: seed * 3 } }, (g) => {
      Paint.wash(g, poly, U.mix(P.rock, P.earth, 0.35), { layers: 4, alpha: 0.3, amp: 3, seed, edge: 0.2, core: 1, vary: P.rockCool, varyAmt: 0.35 });
      Paint.within(g, poly, () => {
        // planos de luz y sombra en bandas que siguen los salientes
        for (let k = 0; k < 9; k++) {
          const yy = U.lerp(y0, y1, k / 9) + rng.range(-10, 10);
          const hh = rng.range(40, 90);
          const pts = outline.filter(([, y]) => y >= yy && y <= yy + hh);
          if (pts.length < 2) continue;
          const lit = pts.map(([px, py]) => [px - dir * rng.range(8, 30), py]);
          Paint.wash(g, pts.concat(lit.reverse()), P.rockLight, { layers: 3, alpha: 0.28, amp: 4, seed: seed + k, edge: 0 });
          Paint.shade(g, [[inner, yy + hh * 0.55], [x + dir * 120, yy + hh * 0.5], [x + dir * 120, yy + hh], [inner, yy + hh]], P.rockShade, { layers: 3, alpha: 0.16, amp: 8, seed: seed + 20 + k, edge: 0 });
          // repisa: grieta horizontal con hierba
          const lip = pts[pts.length - 1];
          Paint.ink(g, [[inner + dir * 40, lip[1] + rng.range(-4, 4)], [lip[0] - dir * 20, lip[1]], [lip[0], lip[1] + 3]], { w: 1.6, alpha: 0.6, seed: seed + 40 + k, breaks: 0.3, taper: 0.4 });
          if (rng.chance(0.6)) grassFringe(g, [[lip[0] - dir * 60, lip[1] - 1], [lip[0], lip[1]]], U.makeRng(seed + 60 + k), 0.8);
        }
        Paint.shade(g, [[inner - 40, y0 + (y1 - y0) * 0.45], [x + dir * 140, y0 + (y1 - y0) * 0.45], [x + dir * 140, y1], [inner - 40, y1]], P.earthDeep, { layers: 5, alpha: 0.16, amp: 30, seed: seed + 80, edge: 0 });
        for (let k = 0; k < 7; k++) {
          const yy = rng.range(y0 + 20, y1 - 60);
          const xx = x - dir * rng.range(10, 90);
          Paint.ink(g, [[xx, yy], [xx + rng.range(-8, 8), yy + rng.range(20, 50)], [xx + rng.range(-12, 12), yy + rng.range(50, 90)]], { w: 1.2, alpha: 0.45, seed: seed + 90 + k, taper: 0.6 });
        }
        Paint.splatter(g, x - dir * 50, (y0 + y1) / 2, 90, (y1 - y0) / 2, (y1 - y0) / 3, '#f3e6cf', { alpha: 0.6, rmin: 0.4, rmax: 1.3, seed: seed + 3 });
        Paint.splatter(g, x - dir * 50, (y0 + y1) / 2, 90, (y1 - y0) / 2, (y1 - y0) / 3, P.inkSoft, { alpha: 0.35, rmin: 0.3, rmax: 1, seed: seed + 4 });
      });
      Paint.ink(g, outline, { w: 2.8, wv: 0.6, alpha: 0.85, seed: seed + 7, breaks: 0.15, sketch: 0.6, bleed: 0.7 });
      // el lado interior se funde con la tierra del corte
      g.globalCompositeOperation = 'destination-out';
      const xa = inner, xb = x - dir * 40;
      const gr = g.createLinearGradient(xa, 0, xb, 0);
      gr.addColorStop(0, 'rgba(0,0,0,1)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.fillRect(Math.min(xa, xb) - (dir > 0 ? 2 : 0), y0 - 30, Math.abs(xb - xa) + 2, y1 - y0 + 60);
      g.globalCompositeOperation = 'source-over';
    });
    layer.stamp(spr, 0, 0, { sparse: true });
  }

  function grassFringe(g, run, rng, density = 0.6) {
    const R = U.resample(run, 4.5);
    g.lineCap = 'round';
    for (let i = 0; i < R.length; i++) {
      if (!rng.chance(density)) continue;
      const [x, y] = R[i];
      const h = rng.range(4, 14) * (rng.chance(0.12) ? 1.8 : 1);
      const lean = rng.range(-0.5, 0.6);
      g.strokeStyle = rng.pick([P.grass, P.grassLight, P.grassDark, P.mossLight, P.hillLight]);
      g.globalAlpha = rng.range(0.6, 0.95);
      g.lineWidth = rng.range(1, 2.2);
      g.beginPath(); g.moveTo(x, y + 2); g.quadraticCurveTo(x + lean * h * 0.3, y - h * 0.6, x + lean * h, y - h); g.stroke();
    }
    g.globalAlpha = 1;
  }

  function paintGroundSegment(layer, seg, idx, L) {
    const rng = U.makeRng(1400 + idx * 31);
    const poly = segPoly(seg, rng);
    const bb = U.bbox(poly);
    const box = { x: bb.x - 30, y: bb.y - 30, w: bb.w + 60, h: bb.h + 60 };
    const runs = surfaceRuns(seg);
    const shift = (d) => seg.map(([x, y]) => [x, y + d]).concat([[seg[seg.length - 1][0], BOTTOM], [seg[0][0], BOTTOM]]);
    // Piedras incrustadas, pocas y variadas: grandes cerca del borde, pequeñas y oscuras abajo.
    const pool = stonePool();
    const stones = [];
    for (let i = 0; i < bb.w / 70; i++) {
      const x = rng.range(bb.x + 20, bb.x + bb.w - 20);
      const sy = surfaceAt(seg, x);
      if (sy == null) continue;
      const d = Math.pow(rng.next(), 1.4) * 520 + 30;
      const big = d < 140 && rng.chance(0.3);
      const spr = big ? pool.big[Math.floor(rng.next() * pool.big.length)] : pool.small[Math.floor(rng.next() * pool.small.length)];
      stones.push({ x, y: sy + d + (big ? 10 : 0), spr, a: d > 340 ? 0.5 : d > 180 ? 0.75 : 0.95, flip: rng.chance(0.5) ? -1 : 1 });
    }
    // raíces bajo los árboles
    const roots = [];
    for (const t of L.decor.trees) {
      const sy = surfaceAt(seg, t.x);
      if (sy == null) continue;
      for (let k = 0; k < 5; k++) {
        const pts = [[t.x + rng.range(-20, 20), sy + 6]];
        let x = pts[0][0], y = pts[0][1], dx = rng.range(-1, 1);
        for (let j = 0; j < 6; j++) { x += dx * 24 + rng.range(-8, 8); y += rng.range(12, 26); dx += rng.range(-0.3, 0.3); pts.push([x, y]); }
        roots.push(pts);
      }
    }
    JHS.Layers.paintOnce(layer, box, (g) => {
      Paint.wash(g, poly, P.earth, { layers: 4, alpha: 0.3, amp: 3, seed: 1600 + idx, edge: 0.16, core: 1, vary: P.earthShade, varyAmt: 0.25 });
      Paint.within(g, poly, () => {
        // luz cálida justo bajo el borde y oscurecimiento progresivo en profundidad
        Paint.wash(g, seg.map(([x, y]) => [x, y - 4]).concat(seg.slice().reverse().map(([x, y]) => [x, y + 70])), '#c49a6e', { layers: 4, alpha: 0.18, amp: 10, seed: 1605 + idx, edge: 0 });
        for (const [d, col, a] of [[60, P.earthShade, 0.24], [190, P.earthShade, 0.3], [380, P.earthDeep, 0.34], [580, P.earthDeep, 0.42]]) {
          Paint.shade(g, shift(d), col, { layers: 5, alpha: a / 2.4, amp: 20, seed: 1610 + idx + d, edge: 0 });
        }
        // vetas de tierra a pincel seco, que siguen la forma del terreno
        for (let k = 0; k < Math.max(6, bb.w / 220); k++) {
          const xs = rng.range(bb.x, bb.x + bb.w - 200), len = rng.range(160, 520), d = rng.range(40, 480);
          const pts = [];
          for (let x = xs; x < xs + len; x += 24) { const sy = surfaceAt(seg, x); if (sy != null) pts.push([x, sy + d + Math.sin(x * 0.008 + k) * 10]); }
          if (pts.length > 2) Paint.bristles(g, pts, { n: 4, w: 7, color: [P.earthShade, P.earthDeep, '#9c7556'], alpha: 0.28, seed: 1615 + idx * 50 + k, gaps: 0.35, taper: 0.2 });
        }
        for (const st of stones) {
          g.save();
          g.globalAlpha = st.a;
          g.translate(st.x, st.y);
          g.scale(st.flip, 1);
          g.drawImage(st.spr.c, -st.spr.ox, -st.spr.oy, st.spr.w, st.spr.h);
          g.restore();
        }
        for (const r of roots) Paint.ink(g, r, { w: 2.6, alpha: 0.6, color: P.woodShade, seed: 1625 + r[0][0], taper: 0.8, wobble: 1.2 });
        // estratos de roca, finos y rotos
        for (let k = 0; k < 4; k++) {
          const d = 90 + k * 120 + rng.range(-20, 20);
          Paint.ink(g, seg.map(([x, y]) => [x, y + d + Math.sin(x * 0.01 + k) * 8]), { w: 1.1, alpha: 0.18, breaks: 0.65, seed: 1620 + idx * 9 + k, color: P.inkSoft, wobble: 1.5 });
        }
        // sendero: banda clara pisada sobre la superficie
        for (const run of runs) {
          const top = run.map(([x, y]) => [x, y - 3]);
          const bot = run.map(([x, y]) => [x, y + 22 + U.noise1(x * 0.02, 7) * 7]).reverse();
          Paint.wash(g, top.concat(bot), P.path, { layers: 4, alpha: 0.4, amp: 2, seed: 1630 + idx, edge: 0.12 });
          const xa = run[0][0], xb = run[run.length - 1][0];
          Paint.splatter(g, (xa + xb) / 2, (run[0][1] + run[run.length - 1][1]) / 2 + 9, Math.abs(xb - xa) / 2, 10, Math.abs(xb - xa) / 3, P.pathShade,
            { alpha: 0.6, rmin: 0.6, rmax: 2.2, seed: 1640 + idx, clip: (x, y) => { const sy = surfaceAt(run, x); return sy != null && y > sy + 1 && y < sy + 21; } });
        }
      });
      // tinta del borde del sendero y de las paredes
      for (const run of runs) Paint.ink(g, run, { w: 2.8, wv: 0.6, alpha: 0.88, breaks: 0.18, sketch: 0.7, seed: 1650 + idx, bleed: 0.9 });
      const first = seg[0], last = seg[seg.length - 1];
      Paint.ink(g, [last, [last[0] - 6, last[1] + 120], [last[0] - 2, last[1] + 300], [last[0] - 12, BOTTOM]], { w: 2, alpha: 0.7, breaks: 0.3, seed: 1660 + idx, wobble: 2 });
      Paint.ink(g, [first, [first[0] + 6, first[1] + 120], [first[0] + 2, first[1] + 300], [first[0] + 12, BOTTOM]], { w: 2, alpha: 0.7, breaks: 0.3, seed: 1670 + idx, wobble: 2 });
      // hierba: sobre el borde y colgando por delante del corte
      for (const run of runs) {
        grassFringe(g, run, U.makeRng(1680 + idx), 0.6);
        const R = U.resample(run, 7);
        const hr = U.makeRng(1690 + idx);
        g.lineCap = 'round';
        for (const [x, y] of R) {
          if (!hr.chance(0.5)) continue;
          const h = hr.range(6, 16);
          g.strokeStyle = hr.pick([P.grassDark, P.moss, P.grass, P.leafShade]);
          g.globalAlpha = hr.range(0.55, 0.85);
          g.lineWidth = hr.range(1.2, 2.4);
          g.beginPath(); g.moveTo(x, y + 18); g.quadraticCurveTo(x + hr.range(-4, 4), y + 18 + h * 0.5, x + hr.range(-6, 6), y + 18 + h); g.stroke();
        }
        g.globalAlpha = 1;
      }
    });
  }

  // Piedras incrustadas: un repertorio pequeño reutilizado en todo el nivel.
  let _stones = null;
  function stonePool() {
    if (_stones) return _stones;
    _stones = { small: [], big: [] };
    const rng = U.makeRng(1490);
    for (let i = 0; i < 14; i++) {
      _stones.small.push(Props.rock(rng.range(10, 26), rng.range(7, 16), 1500 + i, { moss: false, flat: 0.25, irr: 0.22, res: 1, warm: rng.range(0, 0.4), cool: rng.chance(0.4), inkW: 1.6 }));
    }
    for (let i = 0; i < 6; i++) {
      _stones.big.push(Props.rock(rng.range(36, 64), rng.range(22, 36), 1530 + i, { moss: rng.chance(0.5), flat: 0.35, irr: 0.16, res: 1, warm: rng.range(0.2, 0.6), cool: true, inkW: 2 }));
    }
    return _stones;
  }

  function surfaceAt(seg, x) {
    for (let i = 1; i < seg.length; i++) {
      const a = seg[i - 1], b = seg[i];
      if (x >= a[0] && x <= b[0] && b[0] - a[0] > 1) return U.lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0]));
    }
    return null;
  }

  function paintGap(layer, gap, L) {
    if (gap.kind === 'cliff') return;
    const rng = U.makeRng(1700 + gap.x0);
    const yTop = Math.min(...L.ground.flat().filter(([x]) => Math.abs(x - gap.x0) < 2 || Math.abs(x - gap.x1) < 2).map((p) => p[1]));
    const box = { x: gap.x0 - 30, y: yTop - 10, w: gap.x1 - gap.x0 + 60, h: BOTTOM - yTop + 10 };
    const w = gap.x1 - gap.x0;
    JHS.Layers.paintOnce(layer, box, (g) => {
      const gr = g.createLinearGradient(0, yTop, 0, BOTTOM);
      gr.addColorStop(0, '#6d5242');
      gr.addColorStop(0.3, '#4c392f');
      gr.addColorStop(1, '#2c211c');
      g.fillStyle = gr;
      g.fillRect(gap.x0 - 20, yTop + 8, w + 40, BOTTOM - yTop);
      if (gap.kind === 'crevice') return;
      // paredes interiores en perspectiva: se estrechan hacia el fondo y se pierden en la bruma
      for (const side of [0, 1]) {
        const ex = side ? gap.x1 : gap.x0, sg = side ? -1 : 1;
        const face = [[ex, yTop + 10]];
        for (let y = yTop + 10; y <= BOTTOM; y += 30) face.push([ex + sg * (w * 0.32) * U.smooth(U.clamp((y - yTop) / 700, 0, 1)) + sg * U.noise1(y * 0.02, side + 3) * 18, y]);
        face.push([ex, BOTTOM]);
        Paint.wash(g, face, U.mix(P.rockShade, P.earthDeep, 0.4), { layers: 4, alpha: 0.35, amp: 5, seed: 1710 + side + gap.x0, edge: 0.2, core: 0.8 });
        for (let k = 0; k < 10; k++) {
          const y = yTop + 30 + k * 60, x = ex + sg * (w * 0.32) * U.smooth(U.clamp((y - yTop) / 700, 0, 1));
          Paint.ink(g, [[ex + sg * 6, y - 10], [x - sg * 4, y], [x, y + 8]], { w: 1, alpha: 0.35 * (1 - k / 10), seed: 1720 + k + side * 20 + gap.x0, taper: 0.5 });
        }
      }
      // bruma: el fondo se pierde en luz (un degradado y jirones pintados, sin franjas)
      const mg = g.createLinearGradient(0, yTop + 60, 0, BOTTOM);
      mg.addColorStop(0, 'rgba(236,226,210,0)');
      mg.addColorStop(0.55, 'rgba(236,226,210,0.34)');
      mg.addColorStop(1, 'rgba(236,226,210,0.6)');
      g.fillStyle = mg;
      g.fillRect(gap.x0 - 20, yTop + 60, w + 40, BOTTOM - yTop);
      for (let k = 0; k < Math.max(3, w / 90); k++) {
        const cx = rng.range(gap.x0 + 20, gap.x1 - 20), cy = rng.range(yTop + 180, BOTTOM - 80);
        Paint.wash(g, U.blobPoly(cx, cy, rng.range(60, 160), rng.range(14, 30), 14, rng, 0.35), '#efe4d4', { layers: 5, alpha: 0.07, amp: 8, seed: 1735 + k + gap.x0, edge: 0 });
      }
      if (gap.kind === 'gorge') {
        // arroyo lejano en el fondo, apenas un destello
        const ry = 1250;
        Paint.ink(g, [[gap.x0 + 60, ry], [gap.x0 + w * 0.5, ry + 6], [gap.x1 - 60, ry - 2]], { w: 10, alpha: 0.45, color: P.river, seed: 1730, taper: 0.3, wobble: 2 });
        for (let i = 0; i < 18; i++) {
          const x = rng.range(gap.x0 + 80, gap.x1 - 80);
          Paint.ink(g, [[x, ry + rng.range(-3, 5)], [x + rng.range(10, 34), ry + rng.range(-3, 5)]], { w: 1.4, alpha: 0.6, color: P.riverLight, seed: 1740 + i, taper: 0.5 });
        }
      }
    });
  }

  function paintPlayfield(layer, L, progress) {
    for (const gap of L.gaps) paintGap(layer, gap, L);
    L.ground.forEach((seg, i) => paintGroundSegment(layer, seg, i, L));
    // paredes de piedra en los escalones altos y en el acantilado del mirador
    const walls = [
      { x0: 4620, y0: 470, x1: 4920, y1: 830, seed: 1800, fade: 'right' },
      { x0: 6150, y0: 244, x1: 6440, y1: 520, seed: 1810, fade: 'right' },
    ];
    for (const w of walls) {
      const seg = L.ground.find((s) => s[0][0] <= w.x0 && s[s.length - 1][0] >= w.x0);
      const poly = segPoly(seg, U.makeRng(1400 + L.ground.indexOf(seg) * 31));
      JHS.Layers.paintOnce(layer, { x: w.x0 - 10, y: w.y0 - 10, w: w.x1 - w.x0 + 20, h: w.y1 - w.y0 + 20 }, (g) => {
        Paint.within(g, poly, () => stoneWall(g, w.x0, w.y0 + 4, w.x1, w.y1, w.seed, w.fade));
      });
    }
    cliffFace(layer, 8462, 192, BOTTOM, 1840, 1);
    for (const gp of L.gaps) {
      if (gp.kind === 'crevice' || gp.kind === 'cliff') continue;
      const yl = Math.min(...L.ground.flat().filter(([x]) => Math.abs(x - gp.x0) < 2).map((p) => p[1]));
      const yr = Math.min(...L.ground.flat().filter(([x]) => Math.abs(x - gp.x1) < 2).map((p) => p[1]));
      cliffFace(layer, gp.x0 - 4, yl + 4, BOTTOM, 1850 + gp.x0, 1);
      cliffFace(layer, gp.x1 + 4, yr + 4, BOTTOM, 1860 + gp.x1, -1);
    }
    // grietas por donde pasa la oveja
    const t = L.tunnel;
    for (const [p, r] of [[t.from, 1], [t.to, 0.8]]) {
      layer.paint({ x: p.x - 40, y: p.y - 60, w: 80, h: 70 }, (g) => {
        const hole = U.blobPoly(p.x, p.y - 24 * r, 20 * r, 24 * r, 12, U.makeRng(p.x), 0.15).map(([x, y]) => [x, Math.min(y, p.y)]);
        Paint.wash(g, hole, '#2a1d16', { layers: 4, alpha: 0.6, amp: 1, seed: 1830 + p.x, edge: 0.3, core: 1 });
        Paint.ink(g, hole, { closed: true, w: 1.8, alpha: 0.8, seed: 1831 + p.x, breaks: 0.2 });
      });
    }
    // rocas‑plataforma
    for (const r of L.rocks) {
      const spr = Props.rock(r.w / 2 + 10, r.h * 0.6, r.seed, { warm: 0.6, flat: 0.62 });
      layer.stamp(spr, r.x + r.w / 2, r.y + r.h * 0.58);
    }
    for (const r of L.decor.bigRocks) layer.stamp(Props.rock(r.rx, r.ry, r.seed, { warm: 0.5, cool: r.rx > 100 }), r.x, r.y - r.ry * 0.45);
    // madera: escalera, cerca, letrero, banco, postes del puente, tronco caído
    for (const ld of L.ladders) layer.stamp(Obj.ladder(ld.top, ld.bottom), ld.x, ld.top);
    for (const f of L.decor.fence) layer.stamp(Obj.fence(f.x1 - f.x0), f.x0, surfaceAt(L.ground[0], f.x0) + 6);
    for (const s of L.decor.sign) layer.stamp(Obj.sign(s.text), s.x, surfaceAt(L.ground[0], s.x) + 6);
    for (const b of L.decor.bench) layer.stamp(Obj.bench(), b.x, 192);
    const post = Obj.bridgePost();
    layer.stamp(post, L.bridge.x0 - 4, L.bridge.y0 + 18);
    layer.stamp(post, L.bridge.x1 + 4, L.bridge.y1 + 18);
    const lg = L.ledges.find((l) => l.kind === 'log');
    if (lg) layer.stamp(Obj.log(lg.x1 - lg.x0), lg.x0, lg.y + 14);
    if (progress) progress();
  }

  // ------------------------------------------------------------------ primer plano (§17 capa 1)
  function foregroundSprites() {
    const out = [];
    const rng = U.makeRng(1900);
    for (let i = 0; i < 4; i++) {
      out.push(Paint.makeSprite({ w: 520, h: 260, ox: 260, oy: 220, res: 0.6, post: { edge: 0.45, grain: 0.45, density: 0.12, texScale: 1.4 } }, (g) => {
        const poly = Props.smoothBlob(0, -60, 210, 120, 10, rng, 0.2, 0.5);
        Props.paintRockShape(g, poly, 210, 120, 1910 + i, { warm: 0.2, cool: true, inkW: 4 });
        Paint.shade(g, poly, '#4a3a36', { layers: 3, alpha: 0.3, amp: 4, seed: 1920 + i, edge: 0 });
        for (let k = 0; k < 60; k++) {
          const x = rng.range(-240, 240);
          Paint.bristles(g, [[x, 30], [x + rng.range(-20, 20), -rng.range(30, 110)]], { n: 3, w: 6, color: [P.grassDark, P.moss, P.leafShade], alpha: 0.8, seed: 1930 + k, gaps: 0 });
        }
        for (let k = 0; k < 7; k++) {
          const x = rng.range(-200, 200), y = -rng.range(60, 150);
          g.fillStyle = P.flowerWhite;
          for (let p = 0; p < 10; p++) { const a = p / 10 * U.TAU; g.beginPath(); g.ellipse(x + Math.cos(a) * 9, y + Math.sin(a) * 6, 8, 3, a, 0, U.TAU); g.fill(); }
          g.fillStyle = P.flowerCenter; g.beginPath(); g.arc(x, y, 4, 0, U.TAU); g.fill();
        }
      }));
    }
    return out;
  }

  JHS.Scenery = { SUN, BOTTOM, paintSky, cloudSprite, raySprite, paintFar, paintMid, paintHills, paintPlayfield, foregroundSprites, surfaceAt, surfaceRuns };
})(window.JHS = window.JHS || {});
