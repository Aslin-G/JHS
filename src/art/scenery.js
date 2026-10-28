/* Escenario pintado del nivel: cielo de amanecer con tormenta que se abre, rayos de sol,
   montañas lejanas y medias con perspectiva atmosférica, el valle que se descubre desde el
   mirador, colinas cercanas y el suelo del sendero con piedras, raíces y hierba.
   Iluminación (§7): seguridad cálida + esperanza: un rayo dorado entrando en un cielo oscuro. */
(function (JHS) {
  'use strict';
  const U = JHS.U, Paint = JHS.Paint, P = JHS.Palette, Props = JHS.Props, Obj = JHS.Objects;

  const Scenery = JHS.Scenery = JHS.Scenery || {};
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
        const mg = g.createLinearGradient(0, 500, 0, 610);
        mg.addColorStop(0, 'rgba(238,224,204,0)');
        mg.addColorStop(0.4, 'rgba(238,224,204,0.8)');
        mg.addColorStop(1, 'rgba(238,224,204,0)');
        g.fillStyle = mg;
        g.fillRect(x0, 500, x1 - x0, 110);
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
        // Pueblo de las Luces (las chimeneas humean y las ventanas titilan: ver Scenery.village)
        const vil = Scenery.village = { chimneys: [], windows: [] };
        for (let i = 0; i < 18; i++) {
          const x = 3260 + rng.range(-140, 170), y = vY(3260) + 150 + rng.range(-14, 34);
          const w = rng.range(12, 20), h = rng.range(9, 14);
          const smoke = rng.chance(0.4);
          if (smoke) {
            const cx = x + w * 0.72;
            Paint.wash(g, [[cx - 1.6, y - h - 1], [cx + 1.6, y - h - 1], [cx + 1.6, y - h - 9], [cx - 1.6, y - h - 9]], '#7d5a44', { layers: 2, alpha: 0.9, amp: 0.2, seed: 1240 + i, edge: 0.3, core: 1 });
            vil.chimneys.push([cx, y - h - 9.5, rng.next()]);
          }
          Paint.wash(g, [[x, y], [x + w, y], [x + w, y - h], [x + w / 2, y - h - 8], [x, y - h]], rng.pick(['#c9b9a2', '#b7a58e', '#d7c7ae']), { layers: 2, alpha: 0.85, amp: 0.4, seed: 1200 + i, edge: 0.3, core: 1 });
          Paint.wash(g, [[x - 1, y - h], [x + w / 2, y - h - 9], [x + w + 1, y - h]], '#9a5f3e', { layers: 2, alpha: 0.85, amp: 0.3, seed: 1220 + i, edge: 0.3, core: 1 });
          g.fillStyle = '#ffcf73';
          g.fillRect(x + w * 0.3, y - h * 0.6, 2.6, 2.8);
          vil.windows.push([x + w * 0.3 + 1.3, y - h * 0.6 + 1.4, rng.next()]);
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
  // Perfil de la pared de un barranco o acantilado: labio que vuela un poco sobre el vacío,
  // repisas que sobresalen, entrantes irregulares y una ligera inclinación hacia dentro al bajar.
  // dir = +1 si el vacío queda a la derecha del borde.
  // Los bordes de una grieta estrecha se mueven menos (si no, la grieta se cerraría o se abriría
  // de forma rara).
  const NARROW = new Set([2040, 2130]);
  function edgeProfile(xEdge, yTop, dir, seed) {
    const k = NARROW.has(Math.round(xEdge)) ? 0.5 : 1;
    const pts = [];
    for (let y = yTop; y <= BOTTOM + 1; y += 12) {
      const d = y - yTop;
      const lip = 12 * Math.exp(-d / 24);
      const ledge = Math.max(0, Math.sin(d * 0.019 + seed * 0.37) - 0.5) * 36;
      const n = (U.fbm1(y * 0.011, 3, seed) - 0.5) * 40;
      pts.push([xEdge + dir * (lip + (ledge + n - Math.min(1, d / 700) * 30) * k), y]);
    }
    return pts;
  }

  // Sombra que sigue un contorno vertical: filas de 3 unidades sin solape (las filas solapadas
  // dejaban rayas). `alpha(y)` da la opacidad en cada altura; dir = hacia dónde se extiende.
  function contourShade(g, prof, dir, reach, color, alpha, yMin = -Infinity) {
    const step = 3;
    for (let i = 0; i < prof.length - 1; i++) {
      const [xa, ya] = prof[i], [xb, yb] = prof[i + 1];
      for (let y = Math.ceil(ya); y < yb; y += step) {
        if (y < yMin) continue;
        const h = Math.min(step, yb - y);
        const x = U.lerp(xa, xb, (y - ya) / (yb - ya));
        const a = alpha(y);
        if (a <= 0.003) continue;
        const gr = g.createLinearGradient(x, 0, x + dir * reach, 0);
        gr.addColorStop(0, U.rgba(color, a));
        gr.addColorStop(1, U.rgba(color, 0));
        g.fillStyle = gr;
        g.fillRect(Math.min(x, x + dir * reach) - 2, y, reach + 4, h);
      }
    }
  }

  // Polígono de un tramo de suelo: superficie, pared derecha, fondo y pared izquierda.
  function segPoly(seg) {
    const first = seg[0], last = seg[seg.length - 1];
    const right = edgeProfile(last[0], last[1], 1, Math.round(last[0]) % 997);
    const left = edgeProfile(first[0], first[1], -1, Math.round(first[0]) % 991);
    const poly = seg.map((p) => p.slice())
      .concat(right.slice(1), [[right[right.length - 1][0], BOTTOM + 4], [left[left.length - 1][0], BOTTOM + 4]], left.slice(1).reverse());
    return { poly, right, left };
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

  // Muro de contención de piedra seca (como el de «Elementos de Mundo»): sostiene el nivel
  // superior desde su borde hasta el suelo del nivel inferior. Las piedras de la cara asoman
  // con sus extremos redondeados (sin cortes rectos) y hacia dentro se deshacen en la tierra.
  function stoneWall(g, xFace, yTop, yLow, x1, seed) {
    const rng = U.makeRng(seed);
    const rows = [];
    for (let y = yTop + 3; y < yLow + 4; ) {
      const rh = Math.min(rng.range(26, 42), yLow + 10 - y);
      if (rh < 12) break;
      rows.push([y, rh]);
      y += rh + rng.range(2, 4);
    }
    rows.forEach(([y, rh], ri) => {
      // la fila más baja queda medio enterrada; las de arriba sobresalen más
      let x = xFace - rng.range(3, 13);
      let first = true;
      while (x < x1) {
        const w = rng.range(48, 104);
        const fade = (x + w - (x1 - 170)) / 170;
        if (fade > 0 && rng.next() < fade) { x += w + rng.range(2, 5); first = false; continue; }
        const j = () => rng.range(-3, 3);
        const lx = first ? x - rng.range(0, 4) : x;
        const poly = U.spline([[lx + 4 + j(), y + 2 + j()], [x + w * 0.5, y + j() * 0.6], [x + w - 3 + j(), y + 2 + j()], [x + w + j() * 0.5, y + rh * 0.5],
          [x + w - 4 + j(), y + rh - 2 + j()], [x + w * 0.5, y + rh + j() * 0.5], [lx + 5 + j(), y + rh - 2 + j()], [lx - (first ? 3 : 0) + j() * 0.5, y + rh * 0.5]], 3, true);
        const col = rng.pick([P.rockCool, P.rock, U.mix(P.rock, P.rockWarm, 0.5), U.mix(P.rockCool, P.rockLight, 0.45), '#a49a92']);
        // sombra de la piedra sobre la de abajo
        Paint.shade(g, poly.map(([px, py]) => [px + 2, py + 4]), '#4e3a2e', { layers: 2, alpha: 0.16, amp: 1.5, seed: seed + x * 7 + y, edge: 0 });
        Paint.wash(g, poly, col, { layers: 3, alpha: 0.4, amp: 1, seed: seed + x + y, edge: 0.3, core: 1, vary: P.rockLight, varyAmt: 0.3 });
        Paint.within(g, poly, () => {
          Paint.shade(g, [[x - 6, y + rh * 0.55], [x + w + 6, y + rh * 0.5], [x + w + 6, y + rh + 4], [x - 6, y + rh + 4]], P.rockShade, { layers: 3, alpha: 0.2, amp: 4, seed: seed + x * 3, edge: 0 });
          Paint.wash(g, [[x + w * 0.4, y - 2], [x + w + 2, y - 2], [x + w + 2, y + rh * 0.3], [x + w * 0.5, y + rh * 0.25]], P.rockLight, { layers: 2, alpha: 0.3, amp: 3, seed: seed + x * 5, edge: 0 });
          Paint.splatter(g, x + w / 2, y + rh / 2, w / 2, rh / 2, w * rh / 70, '#f3e6cf', { alpha: 0.7, rmin: 0.4, rmax: 1, seed: seed + x });
          Paint.splatter(g, x + w / 2, y + rh / 2, w / 2, rh / 2, w * rh / 80, P.inkSoft, { alpha: 0.4, rmin: 0.3, rmax: 0.9, seed: seed + x + 1 });
          // sombreado a plumilla en la mitad inferior
          g.strokeStyle = P.inkSoft; g.lineWidth = 0.7; g.globalAlpha = 0.28;
          g.beginPath();
          for (let hx = x + 6; hx < x + w - 4; hx += 5) { g.moveTo(hx, y + rh * 0.62); g.lineTo(hx - 4, y + rh - 2); }
          g.stroke(); g.globalAlpha = 1;
          if (rng.chance(0.4)) { const cx = x + rng.range(10, w - 10); Paint.ink(g, [[cx, y + 3], [cx + rng.range(-5, 5), y + rh * 0.5], [cx + rng.range(-6, 6), y + rh - 4]], { w: 0.9, alpha: 0.45, seed: seed + x + 2, taper: 0.5 }); }
        });
        Paint.ink(g, poly, { closed: true, w: 1.4, alpha: 0.66, seed: seed + x + y * 3, breaks: 0.25, sketch: 0.35 });
        if (ri < 2 && rng.chance(0.45)) Paint.wash(g, U.blobPoly(x + rng.range(8, w - 8), y + 2, rng.range(8, 18), 3.5, 8, rng, 0.3), rng.chance(0.5) ? P.moss : P.mossLight, { layers: 3, alpha: 0.45, amp: 1, seed: seed + x + 5, edge: 0.2 });
        // hierbas que brotan entre las juntas de la cara
        if (first && rng.chance(0.4)) grassFringe(g, [[lx - 6, y + rh + 1], [lx + 14, y + rh + 1]], U.makeRng(seed + y), 0.9);
        x += w + rng.range(2, 5);
        first = false;
      }
    });
    // el pie del muro queda enterrado entre hierba y piedrecitas
    grassFringe(g, [[xFace - 46, yLow + 1], [xFace + 26, yLow + 2]], U.makeRng(seed + 77), 1);
    Paint.splatter(g, xFace - 6, yLow + 6, 30, 4, 14, P.rockShade, { alpha: 0.6, rmin: 0.8, rmax: 2.2, seed: seed + 78 });
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

  // «Envolvente baja» de un tramo: la superficie más baja en ±240 unidades, suavizada. Las capas
  // de tierra la siguen, así pasan por debajo de los escalones sin cortes verticales.
  function lowEnvelope(seg) {
    const x0 = seg[0][0], x1 = seg[seg.length - 1][0], st = 16;
    const n = Math.max(2, Math.ceil((x1 - x0) / st) + 1);
    const raw = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = x0 + i * st;
      let m = -Infinity;
      for (let k = -240; k <= 240; k += 16) { const y = surfaceAt(seg, U.clamp(x + k, x0, x1)); if (y != null && y > m) m = y; }
      raw[i] = m;
    }
    const sm = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      let s = 0, c = 0;
      for (let k = -8; k <= 8; k++) { const j = U.clamp(i + k, 0, n - 1); s += raw[j]; c++; }
      sm[i] = s / c;
    }
    return (x) => {
      const f = U.clamp((x - x0) / st, 0, n - 1), i = Math.floor(f), t = f - i;
      return i >= n - 1 ? sm[n - 1] : U.lerp(sm[i], sm[i + 1], t);
    };
  }

  // Helecho pequeño: tallo curvo con foliolos alternos.
  function fern(g, x, y, len, ang, rng, col) {
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8, a = ang + t * 0.9 * Math.sign(Math.cos(ang) || 1);
      pts.push([x + Math.cos(a) * len * t, y + Math.sin(a) * len * t]);
    }
    Paint.ink(g, pts, { w: 1, alpha: 0.8, color: P.grassDark, seed: x + y, taper: 0.5, wobble: 0.2 });
    g.fillStyle = col;
    for (let i = 1; i < pts.length; i++) {
      const [px, py] = pts[i], s = (1 - i / pts.length) * len * 0.22 + 2;
      for (const side of [-1, 1]) {
        g.globalAlpha = 0.78;
        g.beginPath();
        g.ellipse(px + side * s * 0.5, py - s * 0.35, s * 0.6, s * 0.24, side * 0.7 + ang * 0.3, 0, U.TAU);
        g.fill();
      }
    }
    g.globalAlpha = 1;
  }

  // Detalle de la pared de un borde, dentro de la tierra: sombra que sigue el contorno (más
  // densa junto al vacío), rocas incrustadas a ras de pared, estratos y salpicado.
  function paintEdgeInside(g, prof, dir, seed, big) {
    const rng = U.makeRng(seed);
    const depth = big ? 150 : 100;
    contourShade(g, prof, -dir, depth, P.earthDeep, (y) => 0.36 * U.clamp((y - prof[0][1]) / 60, 0.35, 1));
    // unas pocas rocas incrustadas a ras de la pared (recortadas por ella), a distancias irregulares
    const pool = edgeRocks();
    for (let i = rng.int(6, 12); i < prof.length - 4; i += rng.int(14, 30)) {
      const [x, y] = prof[i];
      if (y > prof[0][1] + (big ? 760 : 520)) break;
      const spr = pool[rng.int(0, pool.length - 1)];
      const k = big ? rng.range(1, 1.5) : rng.range(0.7, 1.1);
      g.save();
      g.globalAlpha = y > prof[0][1] + 300 ? 0.7 : 0.95;
      g.translate(x - dir * spr.w * k * 0.28, y);
      g.scale(-dir * k, k);
      g.drawImage(spr.c, -spr.ox, -spr.oy, spr.w, spr.h);
      g.restore();
    }
    for (let k = 0; k < (big ? 9 : 5); k++) {
      const i = rng.int(1, prof.length - 2);
      const [x, y] = prof[i];
      const len = rng.range(30, 90);
      Paint.ink(g, [[x - dir * 4, y], [x - dir * len * 0.5, y + rng.range(-4, 6)], [x - dir * len, y + rng.range(-6, 8)]], { w: 1.1, alpha: 0.32, seed: seed + 10 + k, taper: 0.6, breaks: 0.3, color: P.inkSoft });
    }
    Paint.splatter(g, prof[0][0] - dir * 40, (prof[0][1] + BOTTOM) / 2, 50, (BOTTOM - prof[0][1]) / 2, (BOTTOM - prof[0][1]) / 6, P.inkSoft, { alpha: 0.3, rmin: 0.3, rmax: 1.1, seed: seed + 3 });
  }

  function paintEdgeOutside(g, prof, dir, seed, big, rockPool) {
    const rng = U.makeRng(seed + 500);
    // una o dos rocas grandes que asoman junto al labio
    for (let k = 0; k < (big ? 2 : 1); k++) {
      const i = rng.int(2, 6 + k * 8);
      const [x, y] = prof[i];
      const spr = rockPool[rng.int(0, rockPool.length - 1)];
      const s = big ? rng.range(1.3, 1.7) : rng.range(0.9, 1.2);
      g.save();
      g.translate(x - dir * spr.w * s * 0.36, y);
      g.scale(-dir * s, s);
      g.drawImage(spr.c, -spr.ox, -spr.oy, spr.w, spr.h);
      g.restore();
    }
    // raíces que cuelgan del labio superior
    const top = prof[0];
    for (let k = 0; k < (big ? 4 : 6); k++) {
      const sx = top[0] - dir * rng.range(2, 26), sy = top[1] + rng.range(6, 14);
      const len = rng.range(30, big ? 90 : 130);
      const pts = [[sx, sy]];
      let x = sx, y = sy, a = Math.PI / 2 + dir * rng.range(0.05, 0.35);
      for (let s = 0; s < 8; s++) { a += rng.range(-0.25, 0.25); x += Math.cos(a) * len / 8; y += Math.sin(a) * len / 8; pts.push([x, y]); }
      Paint.ink(g, pts, { w: rng.range(1.6, 2.6), alpha: 0.75, color: P.woodShade, seed: seed + 40 + k, taper: 0.85, wobble: 0.6 });
      for (let h = 0; h < 3; h++) {
        const p = pts[rng.int(2, pts.length - 1)];
        Paint.ink(g, [p, [p[0] + dir * rng.range(3, 9), p[1] + rng.range(4, 12)]], { w: 0.7, alpha: 0.6, color: P.woodShade, seed: seed + 60 + k * 3 + h, taper: 0.8 });
      }
    }
    // musgo y helechos en las repisas (donde el perfil sobresale)
    for (let i = 2; i < prof.length - 2; i++) {
      const [x, y] = prof[i];
      if (y > prof[0][1] + (big ? 600 : 360)) break;
      const out = dir * (x - prof[i - 2][0]) > 4 && dir * (prof[i + 2][0] - x) < -2;
      if (!out || !rng.chance(0.6)) continue;
      Paint.wash(g, U.blobPoly(x - dir * 6, y - 2, rng.range(8, 16), rng.range(3, 6), 9, rng, 0.35), rng.chance(0.5) ? P.moss : P.mossLight, { layers: 3, alpha: 0.5, amp: 1, seed: seed + 80 + i, edge: 0.2 });
      fern(g, x - dir * 4, y - 2, rng.range(14, 26), dir > 0 ? rng.range(-0.9, -0.2) : Math.PI + rng.range(0.2, 0.9), rng, rng.pick([P.leafMid, P.grass, P.leafShade]));
    }
    // hierba que cuelga sobre el vacío desde el labio
    g.lineCap = 'round';
    for (let k = 0; k < 16; k++) {
      const x = top[0] - dir * rng.range(-4, 22), y = top[1] + rng.range(-2, 4);
      const len = rng.range(8, 22);
      g.strokeStyle = rng.pick([P.grass, P.grassDark, P.moss, P.grassLight]);
      g.globalAlpha = rng.range(0.6, 0.9);
      g.lineWidth = rng.range(1.1, 2);
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + dir * len * 0.6, y + len * 0.2, x + dir * len * 0.8, y + len); g.stroke();
    }
    g.globalAlpha = 1;
    Paint.ink(g, prof, { w: 2.4, wv: 0.6, alpha: 0.8, seed: seed + 7, breaks: 0.22, sketch: 0.6, bleed: 0.6 });
  }

  let _edgeRocks = null;
  function edgeRocks() {
    if (_edgeRocks) return _edgeRocks;
    const rng = U.makeRng(1580);
    _edgeRocks = [];
    for (let i = 0; i < 6; i++) _edgeRocks.push(Props.rock(rng.range(22, 40), rng.range(14, 24), 1590 + i, { moss: rng.chance(0.5), flat: 0.5, irr: 0.22, res: 1, warm: rng.range(0, 0.4), cool: true, inkW: 2 }));
    return _edgeRocks;
  }

  function paintGroundSegment(layer, seg, idx, L) {
    const rng = U.makeRng(1400 + idx * 31);
    const { poly, right, left } = segPoly(seg);
    const bb = U.bbox(poly);
    const box = { x: bb.x - 40, y: bb.y - 30, w: bb.w + 80, h: bb.h + 60 };
    const runs = surfaceRuns(seg);
    const first = seg[0], last = seg[seg.length - 1];
    const env = lowEnvelope(seg);
    const band = (d) => {
      const pts = [];
      for (let x = first[0] - 30; x <= last[0] + 30; x += 16) pts.push([x, env(x) + d + U.noise1(x * 0.004, d) * 30]);
      return pts.concat([[last[0] + 60, BOTTOM + 10], [first[0] - 60, BOTTOM + 10]]);
    };
    const isEdge = (pt) => pt[0] > -600; // el borde izquierdo del primer tramo queda fuera del mapa
    const mirador = idx === L.ground.length - 1;
    // Piedras incrustadas, pocas y variadas: grandes cerca del borde, pequeñas y oscuras abajo.
    const pool = stonePool();
    const stones = [];
    for (let i = 0; i < bb.w / 70; i++) {
      const x = rng.range(bb.x + 30, bb.x + bb.w - 30);
      const sy = env(x);
      const d = Math.pow(rng.next(), 1.4) * 520 + 34;
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
        for (const [d, col, a] of [[70, P.earthShade, 0.24], [200, P.earthShade, 0.3], [390, P.earthDeep, 0.34], [590, P.earthDeep, 0.42]]) {
          Paint.shade(g, band(d), col, { layers: 5, alpha: a / 2.4, amp: 20, seed: 1610 + idx + d, edge: 0 });
        }
        // vetas de tierra a pincel seco, que siguen la forma del terreno
        for (let k = 0; k < Math.max(6, bb.w / 200); k++) {
          const xs = rng.range(bb.x, bb.x + bb.w - 200), len = rng.range(160, 520), d = rng.range(50, 480);
          const pts = [];
          for (let x = xs; x < xs + len; x += 24) pts.push([x, env(x) + d + Math.sin(x * 0.008 + k) * 10]);
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
          const d = 100 + k * 120 + rng.range(-20, 20);
          const pts = [];
          for (let x = first[0]; x <= last[0]; x += 20) pts.push([x, env(x) + d + Math.sin(x * 0.01 + k) * 8]);
          Paint.ink(g, pts, { w: 1.1, alpha: 0.18, breaks: 0.65, seed: 1620 + idx * 9 + k, color: P.inkSoft, wobble: 1.5 });
        }
        if (isEdge(right[0])) paintEdgeInside(g, right, 1, 1700 + idx * 13, mirador);
        if (isEdge(left[0])) paintEdgeInside(g, left, -1, 1720 + idx * 13, false);
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
      if (isEdge(right[0])) paintEdgeOutside(g, right, 1, 1740 + idx * 13, mirador, edgeRocks());
      if (isEdge(left[0])) paintEdgeOutside(g, left, -1, 1760 + idx * 13, false, edgeRocks());
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
    }, { edge: 0.3, grain: 0.34, density: 0.1, gx: idx * 211, gy: 17 });
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

  // Interior de un barranco. La grieta estrecha es oscura. En el desfiladero y el barranco se ve,
  // entre los labios, una franja del paisaje lejano y debajo la pared del fondo: roca iluminada
  // arriba que se oscurece y se pierde en la bruma; en el desfiladero corre un arroyo al fondo.
  // Grieta estrecha: se ve su pared del fondo, de roca en estratos que se oscurece con la
  // profundidad; la luz del cielo entra solo por arriba, los labios proyectan sombra, cuelgan
  // raíces y matas, y un par de piedras han quedado encajadas a media altura.
  function paintCrevice(g, gap, xa, xb, yTop, rng) {
    const x0 = gap.x0, x1 = gap.x1, H = BOTTOM - yTop;
    const gr = g.createLinearGradient(0, yTop, 0, yTop + 520);
    gr.addColorStop(0, '#6b5341');
    gr.addColorStop(0.22, '#4a3829');
    gr.addColorStop(0.6, '#2f2219');
    gr.addColorStop(1, '#231811');
    g.fillStyle = gr;
    g.fillRect(xa, yTop + 2, xb - xa, H + 10);
    const all = [[xa, yTop], [xb, yTop], [xb, BOTTOM + 10], [xa, BOTTOM + 10]];
    Paint.within(g, all, () => {
      // estratos de la pared del fondo: bandas inclinadas de distinto tono, cada vez más tenues
      for (let y = yTop + rng.range(10, 30); y < yTop + 620; y += rng.range(22, 46)) {
        const d = (y - yTop) / 620, sl = rng.range(-0.08, 0.08), th = rng.range(6, 16);
        const band = [[xa, y], [xb, y + sl * (xb - xa)], [xb, y + sl * (xb - xa) + th], [xa, y + th + rng.range(-3, 3)]];
        Paint.wash(g, band, rng.chance(0.5) ? '#8a6c52' : '#5e4a3c', { layers: 3, alpha: 0.2 * (1 - d), amp: 3, seed: 1750 + Math.round(y), edge: 0.25 });
        if (rng.chance(0.7)) {
          const sx = rng.range(x0 + 6, x1 - 30);
          Paint.ink(g, [[sx, y + 1], [sx + rng.range(14, 40), y + 1 + sl * 30]], { w: 0.9, alpha: 0.35 * (1 - d), seed: 1760 + Math.round(y), taper: 0.6, color: '#1e140e' });
        }
      }
      // grietas verticales que se pierden en la oscuridad
      for (let k = 0; k < 4; k++) {
        const cx = rng.range(x0 + 12, x1 - 12), y0 = yTop + rng.range(20, 120), len = rng.range(80, 220);
        const pts = [];
        for (let t = 0; t <= 1.001; t += 0.2) pts.push([cx + (U.fbm1(t * 3 + k, 2, 1771) - 0.5) * 14, y0 + t * len]);
        Paint.ink(g, pts, { w: 1.1, alpha: 0.4, seed: 1772 + k, taper: 0.7, color: '#1b120c' });
      }
      // luz del cielo que entra por la boca de la grieta
      const lg = g.createLinearGradient(0, yTop, 0, yTop + 150);
      lg.addColorStop(0, 'rgba(255,226,180,0.34)');
      lg.addColorStop(1, 'rgba(255,226,180,0)');
      g.fillStyle = lg;
      g.fillRect(x0 - 10, yTop, x1 - x0 + 20, 150);
      // sombra de los labios: el sol viene de la derecha, así que la sombra cae junto al borde derecho
      const sh = g.createLinearGradient(x1 + 4, 0, x1 - 46, 0);
      sh.addColorStop(0, 'rgba(24,15,10,0.55)');
      sh.addColorStop(1, 'rgba(24,15,10,0)');
      g.fillStyle = sh;
      g.fillRect(x1 - 50, yTop, 56, H);
      const sl = g.createLinearGradient(x0 - 4, 0, x0 + 22, 0);
      sl.addColorStop(0, 'rgba(24,15,10,0.35)');
      sl.addColorStop(1, 'rgba(24,15,10,0)');
      g.fillStyle = sl;
      g.fillRect(x0 - 6, yTop, 30, H);
      // piedras encajadas entre las paredes
      for (const [cy, rx] of [[yTop + 170, 17], [yTop + 300, 12]]) {
        const cx = rng.range(x0 + 24, x1 - 24);
        const poly = U.blobPoly(cx, cy, rx, rx * 0.7, 10, rng, 0.25);
        Paint.wash(g, poly, '#8a7666', { layers: 4, alpha: 0.6, amp: 1, seed: 1780 + cy, edge: 0.3, core: 1 });
        Paint.within(g, poly, () => Paint.shade(g, [[cx - rx * 2, cy], [cx + rx * 2, cy], [cx + rx * 2, cy + rx * 2], [cx - rx * 2, cy + rx * 2]], '#3b2c23', { layers: 2, alpha: 0.4, amp: 1, seed: 1781 + cy, edge: 0 }));
        Paint.wash(g, U.blobPoly(cx + rx * 0.2, cy - rx * 0.45, rx * 0.55, rx * 0.2, 8, rng, 0.2), '#c8ae90', { layers: 2, alpha: 0.35, amp: 0.5, seed: 1782 + cy, edge: 0.2 });
        Paint.ink(g, poly, { closed: true, w: 1.2, alpha: 0.7, seed: 1783 + cy, breaks: 0.25, color: '#24170f' });
        g.fillStyle = 'rgba(20,12,8,0.45)';
        g.beginPath(); g.ellipse(cx, cy + rx * 0.8, rx * 1.2, 3, 0, 0, U.TAU); g.fill();
      }
      // raíces que asoman de los labios y cuelgan
      for (let k = 0; k < 7; k++) {
        const left = k % 2 === 0;
        const rx0 = left ? x0 + rng.range(-2, 6) : x1 - rng.range(-2, 6);
        const ry0 = yTop + rng.range(14, 70), len = rng.range(30, 90);
        const dir = left ? 1 : -1;
        const pts = [];
        for (let t = 0; t <= 1.001; t += 0.25) pts.push([rx0 + dir * (Math.sin(t * 2.2) * 10 + t * 6), ry0 + t * len]);
        Paint.ink(g, pts, { w: rng.range(1, 2), alpha: 0.75, seed: 1790 + k, taper: 0.85, color: '#3a2618', wobble: 0.4 });
      }
      // polvo de roca suspendido en la luz
      Paint.splatter(g, (x0 + x1) / 2, yTop + 90, (x1 - x0) / 2, 70, 14, '#f1dcbc', { alpha: 0.35, rmin: 0.4, rmax: 1, seed: 1795 });
    });
  }

  function paintGap(layer, gap, L) {
    if (gap.kind === 'cliff') return;
    const rng = U.makeRng(1700 + gap.x0);
    const yL = Math.min(...L.ground.flat().filter(([x]) => Math.abs(x - gap.x0) < 2).map((p) => p[1]));
    const yR = Math.min(...L.ground.flat().filter(([x]) => Math.abs(x - gap.x1) < 2).map((p) => p[1]));
    const yTop = Math.min(yL, yR);
    const w = gap.x1 - gap.x0;
    const xa = gap.x0 - 70, xb = gap.x1 + 70;
    const box = { x: xa - 10, y: yTop - 10, w: xb - xa + 20, h: BOTTOM - yTop + 20 };
    JHS.Layers.paintOnce(layer, box, (g) => {
      if (gap.kind === 'crevice') { paintCrevice(g, gap, xa, xb, yTop, rng); return; }
      // pared del fondo
      const ridge = [];
      const top0 = yTop + (gap.kind === 'gorge' ? 64 : 48);
      const ridgeY = (x) => top0 + (U.fbm1(x * 0.012, 3, gap.x0) - 0.5) * 44;
      for (let x = xa; x <= xb + 0.1; x += 10) ridge.push([x, ridgeY(x)]);
      if (gap.kind === 'gorge') Scenery.gorgeRidge = ridgeY;
      const wall = ridge.concat([[xb, BOTTOM + 10], [xa, BOTTOM + 10]]);
      const gr = g.createLinearGradient(0, top0 - 20, 0, BOTTOM);
      gr.addColorStop(0, '#b49a84');
      gr.addColorStop(0.18, '#8b7466');
      gr.addColorStop(0.5, '#6e5e58');
      gr.addColorStop(1, '#a99e95');
      g.fillStyle = gr;
      Paint.fillPoly(g, wall);
      Paint.within(g, wall, () => {
        // masas de roca en hileras (estratos), cada vez más tenues hacia la bruma: cara superior
        // iluminada (el sol viene de arriba a la derecha), sombra abajo a la izquierda, grietas cortas
        let yRow = top0 + rng.range(6, 16);
        for (let row = 0; row < 7 && yRow < top0 + 520; row++) {
          const fade = 1 - U.smoothstep(top0, top0 + 480, yRow);
          const rh = rng.range(46, 84);
          for (let x = xa - rng.range(0, 60); x < xb; ) {
            const bw = rng.range(55, 150), sk = rng.range(-10, 10);
            const pk = rng.range(0.25, 0.7);
            const poly = [[x, yRow + rng.range(-4, 6)], [x + bw * pk, yRow - rng.range(3, 12)], [x + bw, yRow + rng.range(-4, 6)],
              [x + bw + sk, yRow + rh * rng.range(0.85, 1.05)], [x + sk * 0.5, yRow + rh * rng.range(0.9, 1.1)]];
            const sd = 1800 + row * 97 + Math.round(x);
            Paint.wash(g, poly, rng.pick(['#9d8572', '#8c7868', '#a48b74']), { layers: 3, alpha: 0.2 * fade + 0.04, amp: 3, seed: sd, edge: 0.15 });
            const top = [[poly[0][0], poly[0][1]], [poly[1][0], poly[1][1]], [poly[2][0], poly[2][1]], [poly[2][0] - 4, poly[2][1] + rh * 0.3], [poly[0][0] + 4, poly[0][1] + rh * 0.34]];
            Paint.wash(g, top, '#e6cca9', { layers: 3, alpha: 0.2 * fade, amp: 2, seed: sd + 1, edge: 0.1 });
            const low = [[poly[4][0], poly[4][1]], [poly[0][0], poly[0][1] + rh * 0.45], [x + bw * 0.45, yRow + rh * 0.7], [poly[3][0] - bw * 0.3, poly[3][1]]];
            Paint.shade(g, low, '#4b3a33', { layers: 3, alpha: 0.16 * fade + 0.03, amp: 3, seed: sd + 2, edge: 0 });
            if (fade > 0.15) {
              Paint.ink(g, [poly[0], poly[1], poly[2]], { w: 1.1, alpha: 0.42 * fade, seed: sd + 3, breaks: 0.45, sketch: 0.3, color: P.inkSoft });
              if (rng.chance(0.6)) {
                const cx = x + bw * rng.range(0.25, 0.75);
                Paint.ink(g, [[cx, yRow + 4], [cx + rng.range(-6, 6), yRow + rh * 0.4], [cx + rng.range(-10, 10), yRow + rh * 0.75]], { w: 0.9, alpha: 0.4 * fade, seed: sd + 4, taper: 0.7, color: '#3b2c25' });
              }
            }
            // repisa con hierba sobre algunas masas de las primeras hileras
            if (row < 3 && rng.chance(0.28)) grassFringe(g, [[poly[0][0] + 6, poly[0][1] - 1], [poly[1][0], poly[1][1] - 1], [poly[2][0] - 6, poly[2][1] - 1]], U.makeRng(sd + 5), 0.55);
            x += bw * rng.range(0.85, 1.05);
          }
          yRow += rh * rng.range(0.85, 1);
        }
        // la parte baja de la pared se pierde: veladura cálida que sube desde la bruma
        Paint.wash(g, [[xa, top0 + 200], [xb, top0 + 200], [xb, BOTTOM], [xa, BOTTOM]], '#cdbcaa', { layers: 4, alpha: 0.1, amp: 20, seed: 1720 + gap.x0, edge: 0 });
        // matas y arbustos colgando del borde superior de la pared lejana
        for (const [x, y] of U.resample(ridge, 26)) {
          if (!rng.chance(0.55)) continue;
          Paint.wash(g, U.blobPoly(x, y + 4, rng.range(8, 18), rng.range(4, 8), 9, rng, 0.35), rng.pick([P.leafShade, P.moss, P.leafMid]), { layers: 3, alpha: 0.5, amp: 1.5, seed: 1714 + Math.round(x), edge: 0.2 });
        }
        Paint.splatter(g, (xa + xb) / 2, (top0 + BOTTOM) / 2, (xb - xa) / 2, (BOTTOM - top0) / 2, w / 3, '#efe2cf', { alpha: 0.5, rmin: 0.4, rmax: 1.2, seed: 1715 + gap.x0 });
        // bruma que sube del fondo
        const mg = g.createLinearGradient(0, top0 + 180, 0, BOTTOM);
        mg.addColorStop(0, 'rgba(240,231,216,0)');
        mg.addColorStop(1, 'rgba(240,231,216,0.78)');
        g.fillStyle = mg;
        g.fillRect(xa, top0 + 180, xb - xa, BOTTOM - top0);
        for (let k = 0; k < Math.max(4, w / 70); k++) {
          const cx = rng.range(xa + 30, xb - 30), cy = rng.range(top0 + 230, BOTTOM - 40);
          Paint.wash(g, U.blobPoly(cx, cy, rng.range(50, 130), rng.range(10, 22), 14, rng, 0.35), '#f6efe3', { layers: 5, alpha: 0.1, amp: 8, seed: 1735 + k + gap.x0, edge: 0 });
        }
        if (gap.kind === 'gorge') {
          const ry = 1270;
          Paint.wash(g, [[xa, ry - 10], [xb, ry - 6], [xb, ry + 26], [xa, ry + 24]], '#8ea0a6', { layers: 4, alpha: 0.45, amp: 4, seed: 1730, edge: 0.2, core: 0.6 });
          for (let i = 0; i < 22; i++) {
            const x = rng.range(xa, xb);
            Paint.ink(g, [[x, ry + rng.range(-4, 16)], [x + rng.range(10, 34), ry + rng.range(-4, 16)]], { w: 1.4, alpha: 0.6, color: P.riverLight, seed: 1740 + i, taper: 0.5 });
          }
        }
      });
      Paint.ink(g, ridge, { w: 1.8, alpha: 0.6, seed: 1716 + gap.x0, breaks: 0.3, sketch: 0.4, color: P.inkWarm });
      // sombra bajo cada labio, más densa arriba y junto a la pared cercana
      for (const [ex, ey, dir] of [[gap.x0, yL, 1], [gap.x1, yR, -1]]) {
        const prof = edgeProfile(ex, ey, dir, Math.round(ex) % (dir > 0 ? 997 : 991));
        Paint.within(g, wall, () => contourShade(g, prof, dir, Math.min(w * 0.4, 130), '#2b211c', (y) => 0.5 * Math.exp(-(y - top0) / 300), top0 - 30));
      }
    }, gap.kind === 'crevice' ? { edge: 0.3, grain: 0.2, density: 0.06, gx: gap.x0, gy: 31 } : { edge: 0.35, grain: 0.45, density: 0.12, gx: gap.x0, gy: 31 });
  }

  function paintPlayfield(layer, L, progress) {
    for (const gap of L.gaps) paintGap(layer, gap, L);
    L.ground.forEach((seg, i) => paintGroundSegment(layer, seg, i, L));
    // muros de contención en los dos escalones: del borde superior al suelo del nivel inferior
    for (const seg of L.ground) {
      for (let i = 1; i < seg.length; i++) {
        const a = seg[i - 1], b = seg[i];
        if (Math.abs(b[0] - a[0]) > 1 || b[1] >= a[1]) continue;
        const xFace = a[0], yTop = b[1], yLow = a[1];
        JHS.Layers.paintOnce(layer, { x: xFace - 70, y: yTop - 10, w: 520, h: yLow - yTop + 50 }, (g) => stoneWall(g, xFace, yTop, yLow, xFace + 300, 1800 + Math.round(xFace)));
      }
    }
    // bocas del paso de la oveja: un hueco en la base del muro y otro junto a su borde superior
    const t = L.tunnel;
    for (const [hx, hy, r] of [[t.from.x, t.from.y, 1], [t.to.holeX, t.to.holeY, 0.85]]) {
      layer.paint({ x: hx - 40, y: hy - 60, w: 80, h: 70 }, (g) => {
        const hole = U.blobPoly(hx, hy - 22 * r, 21 * r, 23 * r, 12, U.makeRng(hx), 0.15).map(([x, y]) => [x, Math.min(y, hy)]);
        Paint.wash(g, hole, '#2a1d16', { layers: 4, alpha: 0.6, amp: 1, seed: 1830 + hx, edge: 0.3, core: 1 });
        Paint.within(g, hole, () => Paint.wash(g, U.blobPoly(hx + 6 * r, hy - 6, 14 * r, 8, 9, U.makeRng(hx + 1), 0.2), '#120c09', { layers: 3, alpha: 0.5, amp: 1, seed: 1832 + hx, edge: 0 }));
        Paint.ink(g, hole.filter(([, y]) => y < hy - 1), { w: 1.8, alpha: 0.8, seed: 1831 + hx, breaks: 0.2 });
        grassFringe(g, [[hx - 22 * r, hy], [hx + 22 * r, hy]], U.makeRng(hx + 2), 0.9);
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
    for (const b of L.decor.bench) {
      const seg = L.ground.find((sg) => surfaceAt(sg, b.x) != null);
      if (seg) layer.stamp(Obj.bench(), b.x, surfaceAt(seg, b.x) + 4);
    }
    const post = Obj.bridgePost();
    layer.stamp(post, L.bridge.x0 - 4, L.bridge.y0 + 18);
    layer.stamp(post, L.bridge.x1 + 4, L.bridge.y1 + 18);
    const lg = L.ledges.find((l) => l.kind === 'log');
    if (lg) layer.stamp(Obj.log(lg.x1 - lg.x0), lg.x0, lg.y + 14);
    if (progress) progress();
  }

  // ------------------------------------------------------------------ primer plano (§17 capa 1)
  // Matas de hierba alta, helechos y margaritas a contraluz: más oscuras y menos detalladas
  // que el plano de juego, como la vegetación del borde de una ilustración.
  function foregroundSprites() {
    const out = [];
    for (let i = 0; i < 4; i++) {
      const rng = U.makeRng(1900 + i * 17);
      out.push(Paint.makeSprite({ w: 560, h: 300, ox: 280, oy: 270, res: 0.85, post: { edge: 0.35, grain: 0.25, density: 0.08, texScale: 1.2 } }, (g) => {
        // una piedra baja medio enterrada, a veces
        if (i % 2 === 0) {
          const poly = Props.smoothBlob(rng.range(-60, 60), -26, rng.range(120, 170), rng.range(46, 64), 10, rng, 0.22, 0.45);
          Props.paintRockShape(g, poly, 150, 56, 1910 + i, { warm: 0.15, cool: true, inkW: 3.4 });
          Paint.shade(g, poly, '#3f322f', { layers: 3, alpha: 0.32, amp: 4, seed: 1920 + i, edge: 0 });
        }
        // hierba alta: briznas afiladas en tonos sombríos, con luz cálida en las puntas
        for (let k = 0; k < 150; k++) {
          const x = rng.range(-260, 260), h = rng.range(50, 170) * (1 - Math.abs(x) / 420);
          const lean = rng.range(-0.35, 0.45);
          const col = rng.pick(['#4a5a3a', '#3e4b31', '#5d6b45', '#56603c', '#6b7448']);
          const tipX = x + lean * h, tipY = -h;
          g.fillStyle = col;
          g.globalAlpha = rng.range(0.75, 0.95);
          const bw = rng.range(2.5, 5);
          g.beginPath();
          g.moveTo(x - bw / 2, 20);
          g.quadraticCurveTo(x + lean * h * 0.2 - bw * 0.3, -h * 0.55, tipX, tipY);
          g.quadraticCurveTo(x + lean * h * 0.2 + bw * 0.3, -h * 0.55, x + bw / 2, 20);
          g.fill();
          if (rng.chance(0.35)) {
            g.strokeStyle = '#d9c27a'; g.globalAlpha = 0.5; g.lineWidth = 1;
            g.beginPath(); g.moveTo(x + lean * h * 0.75, -h * 0.75); g.lineTo(tipX, tipY); g.stroke();
          }
        }
        g.globalAlpha = 1;
        for (let k = 0; k < 5; k++) fern(g, rng.range(-200, 200), rng.range(-10, 10), rng.range(60, 110), -Math.PI / 2 + rng.range(-0.9, 0.9), rng, rng.pick(['#4f6044', '#5b6b48', '#465637']));
        // margaritas a contraluz
        for (let k = 0; k < 6; k++) {
          const x = rng.range(-210, 210), y = -rng.range(60, 150);
          Paint.ink(g, [[x + rng.range(-8, 8), 20], [x + rng.range(-4, 4), y / 2], [x, y]], { w: 1.6, color: '#3e4b31', alpha: 0.9, seed: 1950 + k + i * 9, taper: 0.1 });
          for (let p = 0; p < 11; p++) {
            const a = (p / 11) * U.TAU;
            g.fillStyle = Math.sin(a) > 0.3 ? '#d9d2c4' : '#f6f0e2';
            g.globalAlpha = 0.95;
            g.beginPath(); g.ellipse(x + Math.cos(a) * 9, y + Math.sin(a) * 5.5, 8, 2.8, a, 0, U.TAU); g.fill();
          }
          g.fillStyle = P.flowerCenter; g.beginPath(); g.arc(x, y, 4, 0, U.TAU); g.fill();
        }
        g.globalAlpha = 1;
      }));
    }
    return out;
  }

  Object.assign(Scenery, { _paintGapOnly: (l, g, L) => paintGap(l, g, L), _paintSegOnly: (l, s, i, L) => paintGroundSegment(l, s, i, L), SUN, BOTTOM, paintSky, cloudSprite, raySprite, paintFar, paintMid, paintHills, paintPlayfield, foregroundSprites, surfaceAt, surfaceRuns });
})(window.JHS = window.JHS || {});
