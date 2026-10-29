/* Mundo 1 — arte del fondo (capas 5 y 6 de la ficha): cielo crema con nubes lavanda
   transparentes y luz dorada diagonal, montañas lavanda de poco contraste, colinas redondeadas
   con cipreses y olivos, el pueblo del campanario sobre su colina, el acueducto y la cascada.
   Las capas lejanas bajan contraste y frecuencia de detalle (ficha: «Capas»). */
(function (JHS) {
  'use strict';
  const U = JHS.U, Paint = JHS.Paint, P = JHS.Palette;
  const K = () => JHS.Scenery.kit;

  const Art = JHS.M01Art = JHS.M01Art || {};
  // Paleta del valle, medida en el concepto (docs/referencias/M01_concepto_valle_del_amanecer.jpg):
  // percentiles de luminosidad por zona. Verdes oliva tirando a ocre, luces de miel, sombras de
  // tierra parda; lavandas frías solo en montañas y nubes.
  const C = Art.C = {
    skyTop: '#dcd4dc', skyUpper: '#e9ddd6', skyMid: '#f6e7cc', skyLow: '#fae6b2', skyHaze: '#f4ddb6',
    cloud: '#c7b9c8', cloudDeep: '#a99db6', cloudLit: '#f7e4c7', cloudGold: '#f3d293', cloudPink: '#e8c9bd',
    sun: '#fffbe9', sunGold: '#fde4a6',
    mtnFar: '#c9bcc3', mtnFarLit: '#ecd3bb', mtnFarShade: '#a198ae', mtnRim: '#fde9b6',
    mtn: '#b3a8b8', mtnLit: '#e2c9b7', mtnShade: '#8d859d', mtnRim2: '#f8dcae',
    haze: '#eed8bd', hazeWarm: '#f3dcb3',
    hillFar: '#b9a57c', hillFarLit: '#d9c08e', hillFarShade: '#8f7f5b',
    hill: '#a9925d', hillMid: '#917c4c', hillShade: '#6c5b35', hillLit: '#d6b874',
    olive: '#8c7a4d', oliveLit: '#b8a067', oliveDark: '#5e5232',
    cypress: '#4f4b35', cypressDark: '#353222',
    stoneLit: '#e9cfa5', stone: '#c9a77d', stoneShade: '#9b7c5c', roof: '#c4876a', roofShade: '#9a604a',
    sage: '#9a9a66', sageLight: '#c3bd88', meadow: '#a08a49', meadowLit: '#cfae62',
    path: '#e3b46d', pathLit: '#f5cd8a', pathShade: '#bf914d', earth: '#97733d', earthDeep: '#5e4220',
    water: '#bdb6a2', waterDeep: '#8c8576', waterLit: '#f7efdb', foam: '#fbf7ec', waterBlue: '#a9b3b0',
    wood: '#91744a', woodShade: '#5f4325', woodLight: '#c19a62', woodNew: '#dcb57a',
    leaf: '#8b7a3c', leafLit: '#d4ae58', leafDeep: '#4f4220', leafMid: '#a48d45',
    grass: '#836b34', grassLit: '#b39350', grassDeep: '#4e3d17', grassSage: '#8d8a52',
  };
  Art.SUN = { x: 1120, y: 318 };

  // ------------------------------------------------------------------ cielo
  // Crema con lavanda arriba y miel junto al sol. Las nubes lavanda transparentes ocupan las
  // esquinas altas con el vientre dorado; sobre el sol el cielo queda despejado.
  Art.paintSky = function (layer) {
    const x0 = layer.x0, y0 = layer.y0, W = layer.x1 - layer.x0, H = layer.y1 - layer.y0;
    const box = { x: x0, y: y0, w: W, h: H };
    const rng = U.makeRng(1808);
    const SUN = Art.SUN;
    layer.paint(box, (g) => {
      const gr = g.createLinearGradient(0, -60, 0, 900);
      gr.addColorStop(0, C.skyTop);
      gr.addColorStop(0.13, C.skyUpper);
      gr.addColorStop(0.28, C.skyMid);
      gr.addColorStop(0.4, C.skyLow);
      gr.addColorStop(0.58, '#f9e1b0');
      gr.addColorStop(1, C.skyHaze);
      g.fillStyle = gr;
      g.fillRect(x0, y0, W, H);
    });
    // nubes en húmedo: masas a baja resolución ampliada (bordes fundidos)
    const k = 0.14;
    const lo = U.makeCanvas(W * k, H * k);
    const lg = lo.ctx;
    lg.setTransform(k, 0, 0, k, -x0 * k, -y0 * k);
    const sunD = (x, y) => Math.hypot((x - SUN.x) / 1.6, (y - SUN.y) * 1.2);
    const mass = (cx, cy, rx, ry, a, n = 6) => {
      // cerca del sol el vientre de la nube se vuelve oro; lejos, lavanda más honda
      const near = U.clamp(1 - sunD(cx, cy) / 900, 0, 1);
      const belly = U.mix(C.cloudDeep, C.cloudGold, near * 0.85);
      const body = U.mix(C.cloud, C.cloudPink, near * 0.6);
      for (let i = 0; i < n; i++) {
        const x = cx + rng.gauss() * rx * 0.32, y = cy + rng.gauss() * ry * 0.25;
        const ex = rx * rng.range(0.45, 0.75), ey = ry * rng.range(0.4, 0.7);
        const gg = lg.createLinearGradient(0, y - ey, 0, y + ey);
        gg.addColorStop(0, U.rgba(C.cloudLit, a * 0.7));
        gg.addColorStop(0.45, U.rgba(body, a));
        gg.addColorStop(1, U.rgba(belly, a * 0.95));
        lg.fillStyle = gg;
        lg.beginPath(); lg.ellipse(x, y, ex, ey, rng.range(-0.1, 0.1), 0, U.TAU); lg.fill();
      }
    };
    // izquierda: cúmulos lavanda grandes; derecha: nubecillas rosadas; arriba en el centro: velos
    for (let i = 0; i < 22; i++) mass(rng.range(-80, 760), rng.range(-40, 200), rng.range(180, 340), rng.range(48, 92), rng.range(0.34, 0.5));
    for (let i = 0; i < 26; i++) mass(rng.range(1380, 2260), rng.range(-30, 240), rng.range(120, 260), rng.range(30, 64), rng.range(0.3, 0.46));
    for (let i = 0; i < 10; i++) mass(rng.range(760, 1420), rng.range(-70, 60), rng.range(160, 300), rng.range(26, 50), rng.range(0.2, 0.3));
    // jirones dorados a la altura del sol, finos y alargados
    for (let i = 0; i < 9; i++) {
      const x = SUN.x + rng.range(-760, 760), y = rng.range(196, 286);
      if (Math.abs(x - SUN.x) < 160) continue;
      mass(x, y, rng.range(180, 320), rng.range(8, 16), 0.3, 4);
    }
    layer.paint(box, (g) => { g.imageSmoothingQuality = 'high'; g.drawImage(lo, x0, y0, W, H); });

    layer.paint(box, (g) => {
      // algunas nubes con borde seco que granulan
      for (let i = 0; i < 12; i++) {
        const left = i % 2 === 0;
        const cx = left ? rng.range(-40, 720) : rng.range(1420, 2200);
        const cy = rng.range(-20, 200);
        const poly = U.blobPoly(cx, cy, rng.range(90, 200), rng.range(18, 36), 20, rng, 0.32);
        Paint.wash(g, poly, i % 3 ? C.cloud : C.cloudDeep, { layers: 6, alpha: 0.055, amp: 10, seed: 1820 + i, edge: 0.1, blend: 'multiply' });
      }
      // el sol levanta el pigmento: blanco cálido que se abre en miel
      g.globalCompositeOperation = 'screen';
      const rg = g.createRadialGradient(SUN.x, SUN.y, 0, SUN.x, SUN.y, 1100);
      rg.addColorStop(0, 'rgba(255,253,240,1)');
      rg.addColorStop(0.04, 'rgba(255,248,222,0.98)');
      rg.addColorStop(0.14, 'rgba(253,232,176,0.62)');
      rg.addColorStop(0.38, 'rgba(248,212,146,0.26)');
      rg.addColorStop(1, 'rgba(248,212,146,0)');
      g.fillStyle = rg;
      g.fillRect(x0, y0, W, H);
      g.globalCompositeOperation = 'source-over';
      // ribetes dorados en los vientres de las nubes que miran al sol
      for (let i = 0; i < 26; i++) {
        const a = rng.range(-Math.PI * 0.95, -0.05), d = rng.range(240, 700);
        const x = SUN.x + Math.cos(a) * d * 1.6, y = SUN.y + Math.sin(a) * d * 0.42 + 20;
        const len = rng.range(60, 170);
        Paint.ink(g, [[x - len / 2, y], [x, y - rng.range(-5, 5)], [x + len / 2, y + rng.range(-4, 4)]], { w: rng.range(2.5, 5.5), alpha: 0.34, color: C.cloudGold, seed: 1840 + i, taper: 0.5, wobble: 1.4 });
      }
    });
    for (const c of layer.chunks.values()) Paint.watercolorize(c.c, { edge: 0.14, grain: 0.2, density: 0.07, radius: 2, gx: 21, gy: 9, texScale: 1.6 });
  };

  // Nube que deriva: lavanda transparente con el borde que mira al sol en crema dorada.
  Art.cloudSprite = function (w, h, seed, sunSide) {
    const res = 0.5;
    const PW = w * 1.5, PH = h * 2.2;
    return Paint.makeSprite({ w: PW, h: PH, ox: PW / 2, oy: PH / 2, res, post: { edge: 0.2, grain: 0.2, density: 0.07, gx: seed * 7, texScale: 1.6 } }, (g) => {
      const rng = U.makeRng(seed);
      const kk = 0.3;
      const lo = U.makeCanvas(PW * res * kk, PH * res * kk);
      const lg = lo.ctx;
      lg.setTransform(res * kk, 0, 0, res * kk, (PW / 2) * res * kk, (PH / 2) * res * kk);
      const lobes = [];
      for (let i = 0; i < 8; i++) lobes.push([rng.range(-w * 0.3, w * 0.3), rng.range(-h * 0.16, h * 0.12), rng.range(w * 0.14, w * 0.22), rng.range(h * 0.2, h * 0.32)]);
      for (const [x, y, rx, ry] of lobes) {
        const gr = lg.createLinearGradient(0, y - ry, 0, y + ry);
        gr.addColorStop(0, U.rgba('#eee2dc', 0.8));
        gr.addColorStop(0.6, U.rgba(C.cloud, 0.72));
        gr.addColorStop(1, U.rgba(C.cloudDeep, 0.72));
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
        const gr = g.createRadialGradient(x + sunSide * rx * 0.6, y + ry * 0.3, 0, x + sunSide * rx * 0.6, y + ry * 0.3, rx * 0.85);
        gr.addColorStop(0, 'rgba(250,224,166,0.85)');
        gr.addColorStop(1, 'rgba(250,224,166,0)');
        g.fillStyle = gr;
        g.fillRect(x - rx * 2, y - ry * 2, rx * 4, ry * 4);
      }
      g.restore();
    });
  };

  // Rayos de un sol bajo (ficha: «luz dorada diagonal»): abanico completo, más largo hacia abajo,
  // cuñas irregulares con estrías y huecos de pincel seco.
  Art.raySprite = function () {
    const R = 1500;
    return Paint.makeSprite({ w: 3000, h: 2200, ox: 1500, oy: 900, res: 0.35 }, (g) => {
      const rng = U.makeRng(1901);
      const n = 30;
      for (let i = 0; i < n; i++) {
        const a = (i + rng.range(0.1, 0.9)) / n * U.TAU;
        const down = Math.max(0, Math.sin(a));
        const wid = rng.range(0.016, 0.05);
        const len = R * rng.range(0.4, 0.75) * (0.55 + down * 0.6);
        const al = 0.4 + down * 0.45;
        const gr = g.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
        gr.addColorStop(0, 'rgba(255,246,214,0)');
        gr.addColorStop(0.03, U.rgba('#fff3cc', al));
        gr.addColorStop(0.35, U.rgba('#ffecbd', al * 0.45));
        gr.addColorStop(1, 'rgba(255,236,189,0)');
        g.fillStyle = gr;
        const sub = 4;
        for (let s = 0; s < sub; s++) {
          if (rng.chance(0.22)) continue;
          const aa = a + (s / sub - 0.5) * wid, ww = wid / sub * rng.range(0.6, 1.4);
          g.globalAlpha = rng.range(0.5, 1);
          g.beginPath();
          g.moveTo(Math.cos(aa) * 26, Math.sin(aa) * 26);
          g.lineTo(Math.cos(aa - ww) * len, Math.sin(aa - ww) * len);
          g.lineTo(Math.cos(aa + ww) * len * rng.range(0.85, 1), Math.sin(aa + ww) * len * rng.range(0.85, 1));
          g.closePath();
          g.fill();
        }
      }
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'destination-out';
      g.globalAlpha = 0.32;
      g.fillStyle = g.createPattern(JHS.Tex.grainMask, 'repeat');
      g.fillRect(-1500, -900, 3000, 2200);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    });
  };

  // ------------------------------------------------------------------ relieves
  function findPeaks(pts, win) {
    const out = [];
    for (let i = win; i < pts.length - win; i++) {
      const y = pts[i][1];
      let ok = true;
      for (let j = i - win; j <= i + win; j++) if (pts[j][1] < y) { ok = false; break; }
      if (ok && (!out.length || i - out[out.length - 1][2] > win)) out.push([pts[i][0], y, i]);
    }
    return out;
  }

  // Relieve por planos (montañas y lomas): la ladera que mira al sol se aclara en crema miel y la
  // de espaldas se enfría; en las montañas, espolones diagonales bajan de cada cumbre; la cresta
  // cercana al sol lleva un ribete de oro y el pie se funde en bruma cálida. Sin trazos
  // verticales: los planos son lavados de borde blando (la ficha pide pigmento estable, sin
  // «goteos»). Pintado en un sprite propio, secado y estampado en la capa.
  function paintMassif(layer, o) {
    const { ridgePts } = K();
    const x0 = o.x0 == null ? layer.x0 : o.x0, x1 = o.x1 == null ? layer.x1 : o.x1;
    const bottom = o.bottom == null ? layer.y1 : o.bottom;
    const st = o.step || 6;
    const pts = ridgePts(x0, x1, st, o.keys, o.rough || 40, o.seed);
    let top = Infinity;
    for (const p of pts) if (p[1] < top) top = p[1];
    top -= 30;
    const W = x1 - x0, Hh = bottom - top;
    const rng = U.makeRng(o.seed * 7 + 3);
    const sunX = o.sunX == null ? Art.SUN.x : o.sunX;
    const slopeAt = (i, k = 3) => {
      const a = pts[Math.max(0, i - k)], b = pts[Math.min(pts.length - 1, i + k)];
      return (b[1] - a[1]) / (b[0] - a[0]);
    };
    const spr = Paint.makeSprite({ w: W, h: Hh, ox: -x0, oy: -top, res: layer.q, read: true,
      post: { edge: 0.32, grain: o.grain == null ? 0.42 : o.grain, density: 0.12, gx: o.seed * 37, gy: o.seed * 11, radius: 3, texScale: 1 / layer.q } }, (g) => {
      const poly = pts.concat([[x1, bottom], [x0, bottom]]);
      Paint.wash(g, poly, o.body, { layers: 3, alpha: 0.3, amp: 1.5, seed: o.seed, edge: 0.14, core: 1, vary: o.shade, varyAmt: 0.18 });
      Paint.within(g, poly, () => {
        if (o.under) o.under(g, pts, rng);
        // laderas por tramos: cada tramo de cresta que mira al sol (o le da la espalda) baja un plano
        const cls = pts.map((p, i) => {
          const sl = slopeAt(i);
          const toward = p[0] < sunX ? sl : -sl;
          return toward > 0.08 ? 1 : toward < -0.08 ? -1 : 0;
        });
        for (let i = 0; i < pts.length;) {
          const c = cls[i];
          let j = i;
          while (j + 1 < pts.length && cls[j + 1] === c) j++;
          if (c !== 0 && j - i >= 3) {
            const run = pts.slice(i, j + 1);
            const n = run.length;
            const depth = (o.planeDepth || 120) * rng.range(0.6, 1.2);
            const lower = run.map(([x, y], k) => {
              const t = k / (n - 1);
              const taper = Math.sin(Math.PI * U.clamp(t * 1.1 - 0.05, 0, 1));
              return [x, y + 4 + depth * (0.3 + 0.7 * taper) * (0.7 + 0.6 * U.noise1(x * 0.02, o.seed + 31))];
            }).reverse();
            const band = run.map(([x, y]) => [x, y + 1]).concat(lower);
            if (c > 0) Paint.wash(g, band, o.lit, { layers: 3, alpha: 0.2 * (o.litK || 1), amp: 4, seed: o.seed + 100 + i, edge: 0 });
            else Paint.shade(g, band, o.shade, { layers: 3, alpha: 0.14 * (o.shadeK || 1), amp: 4, seed: o.seed + 200 + i, edge: 0 });
          }
          i = j + 1;
        }
        // espolones: aristas diagonales que bajan de cada cumbre, con su cara de sombra y su luz
        if (o.spurs) {
          for (const [px, , pi] of findPeaks(pts, Math.round(60 / st))) {
            for (let s = 0; s < o.spurs; s++) {
              const dir = s % 2 ? 1 : -1;
              const ox = px + dir * rng.range(10, 70) * (1 + (s >> 1));
              const ii = U.clamp(Math.round((ox - x0) / st), 0, pts.length - 1);
              const oy = pts[ii][1] + 2;
              const len = (o.spurLen || 220) * rng.range(0.55, 1.05);
              const spur = [];
              for (let t = 0; t <= 1.001; t += 0.125) spur.push([ox + dir * len * (0.22 * t + 0.4 * t * t) + Math.sin(t * 6 + s) * 3, oy + len * t]);
              const away = ox < sunX ? -1 : 1;
              const wd = rng.range(22, 52);
              const m = spur.length - 1;
              const sh = spur.concat(spur.slice().reverse().map(([x, y], q) => { const t = 1 - q / m; return [x + away * wd * (0.2 + t * 0.9), y + 4]; }));
              Paint.shade(g, sh, o.shade, { layers: 3, alpha: 0.13 * (o.shadeK || 1), amp: 3, seed: o.seed + 300 + s * 7 + pi, edge: 0 });
              const li = spur.concat(spur.slice().reverse().map(([x, y], q) => { const t = 1 - q / m; return [x - away * wd * 0.45 * (0.15 + t), y + 3]; }));
              Paint.wash(g, li, o.lit, { layers: 2, alpha: 0.16 * (o.litK || 1), amp: 2, seed: o.seed + 400 + s * 7 + pi, edge: 0 });
            }
          }
        }
        // granulado del pigmento: motas finas que se asientan en el grano del papel
        if (o.granules) Paint.splatter(g, (x0 + x1) / 2, top + Hh * 0.35, W / 2, Hh * 0.35, o.granules, o.shade, { alpha: 0.12, rmin: 0.5, rmax: 1.3, seed: o.seed + 9 });
        if (o.extra) o.extra(g, pts, rng);
        // bruma cálida al pie
        if (o.mist) {
          const gr = g.createLinearGradient(0, o.mistTop, 0, o.mistTop + o.mistH);
          gr.addColorStop(0, U.rgba(o.mist, 0));
          gr.addColorStop(1, U.rgba(o.mist, o.mistA || 0.94));
          g.fillStyle = gr;
          g.fillRect(x0, o.mistTop, W, o.mistH);
          g.fillStyle = U.rgba(o.mist, o.mistA || 0.94);
          g.fillRect(x0, o.mistTop + o.mistH - 1, W, bottom - o.mistTop - o.mistH + 2);
        }
      });
      // ribete de oro en la cresta, más ancho cuanto más cerca del sol
      if (o.rim) {
        const rr = o.rimR || 700;
        let run = [];
        const flush = () => {
          if (run.length > 3) Paint.ink(g, run, { w: o.rimW || 2.4, alpha: 0.6, color: o.rim, seed: o.seed + Math.round(run[0][0]), taper: 0.5, wobble: 0.3, press: (t, p) => U.clamp(1.3 - Math.abs(p[0] - sunX) / rr, 0.05, 1.3) });
          run = [];
        };
        for (let k = 0; k < pts.length; k += 2) { const [x, y] = pts[k]; if (Math.abs(x - sunX) < rr) run.push([x, y + 0.8]); else flush(); }
        flush();
      }
      if (o.ink) Paint.ink(g, pts, { w: 1.1, alpha: o.ink, breaks: 0.5, seed: o.seed + 5, color: o.inkColor || '#7d6f80', wobble: 0.3 });
      if (o.after) o.after(g, pts, rng);
      // extremos fundidos (para relieves que no ocupan toda la capa)
      g.globalCompositeOperation = 'destination-out';
      for (const [side, len] of [['L', o.fadeL], ['R', o.fadeR]]) {
        if (!len) continue;
        const xa = side === 'L' ? x0 : x1 - len;
        const gr = g.createLinearGradient(xa, 0, xa + len, 0);
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
  Art.paintMassif = paintMassif;

  // ------------------------------------------------------------------ montañas lavanda
  Art.paintFar = function (layer) {
    // cordillera lejana: la cumbre principal a la izquierda del sol; el sol sale por el collado
    paintMassif(layer, {
      seed: 111, step: 6, rough: 30,
      keys: [[-80, 380], [120, 352], [300, 326], [460, 296], [600, 280], [700, 252], [790, 262], [880, 236], [980, 204], [1050, 226], [1110, 282], [1170, 322],
        [1240, 298], [1320, 256], [1400, 282], [1500, 262], [1610, 308], [1720, 290], [1860, 330], [1990, 300], [2130, 344], [2270, 314], [2430, 356], [2590, 328], [2720, 366], [2850, 350]],
      body: C.mtnFar, lit: C.mtnFarLit, shade: C.mtnFarShade, rim: C.mtnRim, rimR: 760,
      spurs: 4, spurLen: 230, planeDepth: 120, granules: 4000,
      mist: C.hazeWarm, mistTop: 360, mistH: 190, mistA: 0.92, ink: 0.12,
    });
    // sierra cercana, más azulada: corta la bruma y hace de fondo al pueblo
    paintMassif(layer, {
      seed: 113, step: 6, rough: 22,
      keys: [[-80, 452], [140, 420], [330, 444], [520, 404], [700, 434], [860, 416], [1000, 448], [1130, 468], [1260, 444], [1400, 420], [1560, 446], [1720, 426],
        [1900, 454], [2080, 430], [2260, 460], [2440, 436], [2640, 462], [2850, 450]],
      body: C.mtn, lit: C.mtnLit, shade: C.mtnShade, rim: C.mtnRim2, rimR: 520, rimW: 1.8,
      spurs: 2, spurLen: 120, planeDepth: 70, granules: 3000, shadeK: 1.2,
      mist: C.haze, mistTop: 452, mistH: 130, mistA: 0.95, ink: 0.1,
    });
  };

  // ------------------------------------------------------------------ piezas del valle lejano
  function cypress(g, x, y, h, rng, col = C.cypress) {
    // llama alta y estrecha con dos tonos (el lado del sol, más claro y dorado)
    const w = h * rng.range(0.16, 0.2);
    const poly = [[x, y - h], [x + w * 0.42, y - h * 0.62], [x + w * 0.5, y - h * 0.25], [x + w * 0.22, y], [x - w * 0.22, y], [x - w * 0.5, y - h * 0.3], [x - w * 0.38, y - h * 0.66]];
    Paint.wash(g, U.spline(poly, 3, true), col, { layers: 3, alpha: 0.6, amp: h * 0.015, seed: Math.round(x * 3 + y), edge: 0.25, core: 0.85 });
    Paint.wash(g, [[x, y - h], [x + w * 0.42, y - h * 0.62], [x + w * 0.46, y - h * 0.25], [x + w * 0.12, y - h * 0.1], [x + w * 0.05, y - h * 0.7]], U.mix(col, C.leafLit, 0.4), { layers: 2, alpha: 0.38, amp: 0.5, seed: Math.round(x * 5 + y), edge: 0 });
  }
  Art.cypress = cypress;

  function oliveBlob(g, x, y, r, rng, cols = [C.olive, C.oliveLit, C.oliveDark]) {
    for (let k = 0; k < 6; k++) {
      g.fillStyle = cols[k % cols.length];
      g.globalAlpha = 0.5;
      g.beginPath();
      g.ellipse(x + rng.gauss() * r * 0.4, y - r * 0.5 + rng.gauss() * r * 0.2, r * rng.range(0.4, 0.62), r * rng.range(0.3, 0.45), rng.range(-0.4, 0.4), 0, U.TAU);
      g.fill();
    }
    g.globalAlpha = 1;
  }
  Art.oliveBlob = oliveBlob;

  // Casita lejana: muro de piedra cálida, tejado de teja, sombra lateral; ventanas tenues.
  function farHouse(g, x, y, w, h, rng, o = {}) {
    const roofH = h * rng.range(0.4, 0.55);
    Paint.wash(g, [[x, y], [x + w, y], [x + w, y - h], [x, y - h]], rng.pick([C.stoneLit, '#e2c296', '#d9b98c']), { layers: 2, alpha: 0.9, amp: 0.3, seed: Math.round(x * 7 + y), edge: 0.25, core: 1 });
    Paint.shade(g, [[x + w * 0.62, y], [x + w, y], [x + w, y - h], [x + w * 0.62, y - h]], C.stoneShade, { layers: 2, alpha: 0.4, amp: 0.3, seed: Math.round(x * 11 + y), edge: 0 });
    Paint.wash(g, [[x - w * 0.08, y - h], [x + w * 0.5, y - h - roofH], [x + w * 1.08, y - h]], rng.chance(0.75) ? C.roof : C.roofShade, { layers: 2, alpha: 0.9, amp: 0.3, seed: Math.round(x * 13 + y), edge: 0.3, core: 1 });
    if (o.windows) for (let i = 0; i < o.windows; i++) {
      const wx = x + w * (0.2 + i * 0.3), wy = y - h * 0.55;
      g.fillStyle = U.rgba('#6f5442', 0.55);
      g.fillRect(wx, wy, Math.max(1.4, w * 0.09), Math.max(1.8, h * 0.18));
      if (o.out) o.out.push({ x: wx + w * 0.045, y: wy + h * 0.09 });
    }
  }

  // ------------------------------------------------------------------ valle, pueblo, acueducto, cascada
  // Posición de la cascada (espacio de la capa media): detrás del puente cuando la cámara llega a él.
  Art.FALL = { x: 1192, top: 548, bottom: 652 };
  Art.paintMid = function (layer, life) {
    const { keyY } = K();
    const x0 = layer.x0, x1 = layer.x1;
    const F = Art.FALL;
    // 1) lomas del fondo del valle: olivares en hileras, cipreses en los caminos, bruma entre lomas
    const backKeys = [[x0, 506], [180, 488], [400, 512], [620, 492], [840, 520], [1020, 530], [1200, 536], [1420, 514], [1660, 498], [1900, 520], [2160, 500], [2440, 516],
      [2720, 492], [3000, 474], [3300, 462], [3600, 448], [x1, 440]];
    const yB = (x) => keyY(backKeys, x);
    paintMassif(layer, {
      seed: 121, step: 8, rough: 12, keys: backKeys,
      body: C.hillFar, lit: C.hillFarLit, shade: C.hillFarShade, rim: '#f6dca0', rimR: 600, rimW: 1.6,
      planeDepth: 40, litK: 1.2, shadeK: 0.8, granules: 2500, grain: 0.35,
      mist: C.haze, mistTop: 690, mistH: 140, mistA: 0.7,
      extra: (g, pts, rng) => {
        // parcelas de tonos distintos (salvia, ocre, oliva)
        for (let i = 0; i < 120; i++) {
          const x = rng.range(x0, x1), d = rng.next();
          const y = yB(x) + 16 + d * 130;
          Paint.wash(g, U.blobPoly(x, y, rng.range(34, 90) * (0.6 + d), rng.range(5, 10) * (0.6 + d), 10, rng, 0.3), rng.pick([C.hillFarLit, C.sage, C.meadow, '#c8b27c', C.sageLight]), { layers: 2, alpha: 0.24, amp: 2, seed: 1200 + i, edge: 0.08 });
        }
        // olivares en hileras que siguen la loma
        for (let k = 0; k < 30; k++) {
          const xa = rng.range(x0, x1 - 200), w = rng.range(120, 300), rows = rng.int(2, 4), d = rng.next();
          for (let r = 0; r < rows; r++) for (let x = xa; x < xa + w; x += rng.range(9, 13)) oliveBlob(g, x + r * 4, yB(x) + 18 + d * 90 + r * 9, 3.2 + d * 2.6, rng);
        }
        // cipreses en fila junto a los caminos y en las crestas
        for (let k = 0; k < 32; k++) {
          const xa = rng.range(x0, x1 - 100), n = rng.int(2, 7), d = rng.next();
          for (let c = 0; c < n; c++) { const x = xa + c * rng.range(9, 14); cypress(g, x, yB(x) + 10 + d * 70, rng.range(20, 40) * (0.8 + d * 0.5), rng, rng.chance(0.5) ? '#5d5740' : C.cypress); }
        }
        // caminos blancos que serpentean entre los campos
        for (let k = 0; k < 5; k++) {
          const xs = rng.range(x0, x1 - 500), pts2 = [];
          for (let t = 0; t <= 1.001; t += 0.1) { const x = xs + t * rng.range(260, 460); pts2.push([x, yB(x) + 26 + Math.sin(t * 5 + k) * 16 + t * 50]); }
          Paint.ink(g, pts2, { w: 2, alpha: 0.45, color: '#f6e2b8', seed: 1260 + k, taper: 0.3, wobble: 1 });
        }
      },
    });

    // 2) la colina del pueblo, con su campanario, sus casas escalonadas y cipreses
    const villageKeys = [[1100, 650], [1170, 566], [1240, 520], [1310, 488], [1390, 458], [1470, 440], [1570, 432], [1670, 438], [1770, 462], [1870, 522], [1990, 612]];
    const yV = (x) => keyY(villageKeys, x);
    paintMassif(layer, {
      x0: 1080, x1: 2010, seed: 123, step: 5, rough: 6, keys: villageKeys, fadeL: 60, fadeR: 80,
      body: '#b49d6e', lit: '#dcc18c', shade: '#87734f', rim: '#fbe2a8', rimR: 500, rimW: 1.6,
      planeDepth: 50, granules: 900, mist: C.haze, mistTop: 800, mistH: 120, mistA: 0.6,
      extra: (g, pts, rng) => {
        // bancales en curvas de nivel y olivos en la ladera
        for (let r = 0; r < 7; r++) {
          const ln = [];
          for (let x = 1180 + r * 14; x < 1940 - r * 10; x += 20) ln.push([x, yV(x) + 26 + r * 22 + Math.sin(x * 0.02 + r) * 2]);
          Paint.ink(g, ln, { w: 1.6, alpha: 0.28, color: '#7a6a45', seed: 1270 + r, breaks: 0.35, wobble: 0.6 });
        }
        for (let i = 0; i < 90; i++) { const x = rng.range(1200, 1950); oliveBlob(g, x, yV(x) + rng.range(22, 150), rng.range(4, 7), rng); }
      },
      after: (g, pts, rng) => {
        const out = [];
        // casas escalonadas en la cima y bajando hacia la derecha
        const houses = [[1404, 466, 30, 24], [1438, 458, 36, 28], [1480, 452, 34, 26], [1520, 446, 44, 32], [1580, 444, 38, 28], [1626, 446, 40, 30], [1672, 452, 34, 24],
          [1712, 464, 36, 26], [1752, 480, 30, 22], [1458, 474, 30, 20], [1548, 470, 34, 22], [1604, 472, 30, 20], [1660, 478, 32, 22], [1700, 492, 28, 18]];
        for (const [x, y, w, h] of houses) farHouse(g, x, y, w, h, rng, { windows: 2, out });
        // iglesia con su campanario: torre de piedra, arco del campanil y tejadillo
        const tx = 1492, ty = 448, tw = 24, th = 104;
        Paint.wash(g, [[tx, ty], [tx + tw, ty], [tx + tw, ty - th], [tx, ty - th]], C.stoneLit, { layers: 3, alpha: 0.95, amp: 0.3, seed: 1291, edge: 0.3, core: 1 });
        Paint.shade(g, [[tx + tw * 0.6, ty], [tx + tw, ty], [tx + tw, ty - th], [tx + tw * 0.6, ty - th]], C.stoneShade, { layers: 2, alpha: 0.45, amp: 0.3, seed: 1292, edge: 0 });
        g.fillStyle = U.rgba('#5f4636', 0.6);
        g.beginPath(); g.moveTo(tx + 7, ty - th + 32); g.lineTo(tx + 7, ty - th + 19); g.quadraticCurveTo(tx + tw / 2, ty - th + 10, tx + tw - 7, ty - th + 19); g.lineTo(tx + tw - 7, ty - th + 32); g.fill();
        Paint.wash(g, [[tx - 4, ty - th], [tx + tw / 2, ty - th - 24], [tx + tw + 4, ty - th]], C.roof, { layers: 2, alpha: 0.95, amp: 0.2, seed: 1293, edge: 0.3, core: 1 });
        Paint.ink(g, [[tx, ty], [tx, ty - th], [tx + tw / 2, ty - th - 24], [tx + tw, ty - th], [tx + tw, ty]], { w: 0.9, alpha: 0.4, seed: 1294, breaks: 0.3 });
        farHouse(g, tx + tw, ty + 2, 58, 34, rng, { windows: 3, out });
        for (const x of [1372, 1388, 1792, 1810, 1830, 1852]) cypress(g, x, yV(x) + 8, rng.range(46, 66), rng);
        // el acueducto al pie del pueblo: arcos de piedra cálida con sombra dentro; bajo él cae el agua
        const ay = 546, ah = 36, ax0 = 1128, ax1 = 1430;
        Paint.wash(g, [[ax0, ay - ah], [ax1, ay - ah - 6], [ax1, ay + 4], [ax0, ay + 8]], C.stone, { layers: 3, alpha: 0.88, amp: 0.6, seed: 1295, edge: 0.3, core: 1 });
        Paint.wash(g, [[ax0, ay - ah], [ax1, ay - ah - 6], [ax1, ay - ah + 3], [ax0, ay - ah + 9]], C.stoneLit, { layers: 2, alpha: 0.75, amp: 0.4, seed: 1296, edge: 0 });
        for (let x = ax0 + 12; x < ax1 - 14; x += 30) {
          const arch = [];
          for (let t = 0; t <= 1.001; t += 0.125) arch.push([x + t * 20, ay + 6 - Math.sin(Math.PI * t) * 22]);
          arch.push([x + 20, ay + 10], [x, ay + 10]);
          Paint.wash(g, arch, '#7a5e46', { layers: 2, alpha: 0.6, amp: 0.2, seed: 1300 + x, edge: 0.2, core: 0.8 });
        }
        Paint.ink(g, [[ax0, ay - ah], [(ax0 + ax1) / 2, ay - ah - 3], [ax1, ay - ah - 6]], { w: 1, alpha: 0.4, seed: 1297, breaks: 0.4 });
        if (life) life.villageWindows = out;
      },
    });

    // 3) el risco de la cascada bajo el acueducto y el bosquecillo de su izquierda
    layer.paint({ x: 840, y: 500, w: 520, h: 360 }, (g) => {
      const rng = U.makeRng(1310);
      // bosquecillo: olivos y cipreses apretados, oscuros abajo y dorados en las copas
      for (let i = 0; i < 160; i++) {
        const x = rng.range(860, 1168), d = rng.next();
        oliveBlob(g, x, 566 + d * 140 + Math.abs(x - 1100) * 0.08, 8 + d * 9, rng, ['#6f6435', '#8c7a3c', '#4f4522', '#a48d45']);
      }
      for (let i = 0; i < 18; i++) cypress(g, rng.range(870, 1150), rng.range(600, 700), rng.range(50, 86), rng, rng.chance(0.5) ? C.cypress : C.cypressDark);
      // el risco: roca gris verdosa con estratos, musgo y grietas oscuras
      const cliff = [[1146, 680], [1150, 600], [1160, 560], [1178, 548], [1210, 548], [1228, 562], [1238, 612], [1244, 680]];
      Paint.wash(g, U.spline(cliff, 3, true), '#a99d8a', { layers: 4, alpha: 0.65, amp: 1.5, seed: 1311, edge: 0.3, core: 0.9, vary: '#8f8676', varyAmt: 0.4 });
      Paint.within(g, U.spline(cliff, 3, true), () => {
        for (let i = 0; i < 18; i++) {
          const y = 556 + i * 7 + rng.range(-2, 2);
          Paint.ink(g, [[1146, y], [1190, y + rng.range(-3, 3)], [1244, y + rng.range(-2, 2)]], { w: 0.9, alpha: 0.28, color: '#5e5548', seed: 1312 + i, breaks: 0.5 });
        }
        Paint.shade(g, [[1146, 548], [1176, 548], [1170, 690], [1146, 690]], '#6d6458', { layers: 3, alpha: 0.3, amp: 3, seed: 1313, edge: 0 });
        for (let i = 0; i < 10; i++) Paint.wash(g, U.blobPoly(rng.range(1150, 1240), rng.range(560, 670), rng.range(6, 12), rng.range(3, 6), 8, rng, 0.3), rng.pick(['#8d8a52', '#a49a5c']), { layers: 2, alpha: 0.4, amp: 0.5, seed: 1330 + i, edge: 0.1 });
      });
      // matas que asoman por arriba y por los lados del risco
      for (const [x, y, r] of [[1150, 556, 14], [1236, 560, 12], [1144, 620, 10], [1246, 630, 12], [1170, 548, 10], [1222, 548, 10]]) oliveBlob(g, x, y + r * 0.4, r, rng, ['#7f7a44', '#a49a5c', '#5e5a33']);
      // poza al pie de la cascada y el arroyo que baja hacia el puente
      Paint.wash(g, U.blobPoly(F.x + 4, F.bottom + 8, 34, 9, 12, rng, 0.15), C.water, { layers: 3, alpha: 0.85, amp: 0.6, seed: 1340, edge: 0.3, core: 1 });
      const s = [];
      for (let t = 0; t <= 1.001; t += 0.05) s.push([F.x + 6 + Math.sin(t * 4) * 16 + t * 46, F.bottom + 12 + t * 170]);
      Paint.ink(g, s, { w: 9, alpha: 0.85, color: C.water, seed: 1341, taper: 0.1, wobble: 0.8, press: (t) => 0.6 + t * 1.6 });
      Paint.ink(g, s.map(([x, y]) => [x - 1, y - 1]), { w: 2, alpha: 0.85, color: C.waterLit, seed: 1342, taper: 0.1, breaks: 0.45, press: (t) => 0.6 + t * 1.2 });
      for (const side of [-1, 1]) Paint.ink(g, s.map(([x, y], i) => [x + side * (5 + i * 0.5), y + 1]), { w: 1.2, alpha: 0.35, color: '#5e5a33', seed: 1343 + side, breaks: 0.4 });
      // bruma al pie de la cascada
      for (let i = 0; i < 6; i++) Paint.wash(g, U.blobPoly(F.x + rng.range(-36, 36), F.bottom + rng.range(-8, 8), rng.range(26, 50), rng.range(7, 12), 12, rng, 0.3), '#f6efe1', { layers: 3, alpha: 0.18, amp: 3, seed: 1350 + i, edge: 0 });
    });
    if (life) life.falls.push({ x: F.x, top: F.top, bottom: F.bottom, w0: 8, w1: 16, k: 0.9, layer: 'mid', scale: 0.32, fade: 120, mist: 0.55, mistColor: '#f6efe2' });

    // 4) a lo lejos, a la derecha: el Bosque de los Susurros (el destino visible del camino)
    layer.paint({ x: 2900, y: 360, w: x1 - 2900, h: 420 }, (g) => {
      const rng = U.makeRng(1360);
      const fy = (x) => 520 - U.smoothstep(3000, 3700, x) * 70 - Math.sin(x * 0.01) * 6;
      for (let i = 0; i < 520; i++) {
        const x = rng.range(3000, x1 - 10), d = rng.next();
        oliveBlob(g, x, fy(x) + d * 130, 10 + d * 13, rng, ['#55603f', '#6a7350', '#3d4530', '#7f8459']);
      }
      for (let i = 0; i < 60; i++) { const x = rng.range(3020, x1 - 20); cypress(g, x, fy(x) + rng.range(30, 70), rng.range(50, 90), rng, rng.chance(0.5) ? '#3d4632' : '#4c5639'); }
      // el camino blanco entra en el bosque
      const pp = [];
      for (let t = 0; t <= 1.001; t += 0.1) pp.push([U.lerp(2860, 3240, t), U.lerp(640, 596, t) + Math.sin(t * 4) * 6]);
      Paint.ink(g, pp, { w: 3.2, alpha: 0.55, color: '#f6e2b8', seed: 1361, taper: 0.4, wobble: 0.8 });
    });
  };

  // ------------------------------------------------------------------ colinas cercanas
  // La vaguada del arroyo (x 1449) queda detrás del puente cuando la cámara llega a él.
  Art.HILL_KEYS = [[-260, 626], [200, 612], [600, 634], [900, 618], [1180, 640], [1330, 664], [1449, 708], [1570, 662], [1800, 632], [2300, 640], [2800, 618],
    [3300, 600], [3800, 572], [4300, 540], [4800, 514], [5300, 496], [5800, 486], [6300, 482]];
  Art.paintHills = function (layer, life) {
    const { keyY } = K();
    const keys = Art.HILL_KEYS;
    const yAt = (x) => keyY(keys, x);
    paintMassif(layer, {
      seed: 131, step: 7, rough: 18, keys,
      body: C.hill, lit: C.hillLit, shade: C.hillShade, rim: '#f2d48e', rimR: 900, rimW: 1.6,
      planeDepth: 60, litK: 1.1, shadeK: 0.9, granules: 4000, grain: 0.4, ink: 0.16, inkColor: '#6a5534',
      mist: '#e3cfa8', mistTop: 1040, mistH: 200, mistA: 0.5,
      extra: (g, pts, rng) => {
        // campos en mosaico (ocres, salvias y olivas) con lindes de seto
        for (let i = 0; i < 100; i++) {
          const x = rng.range(layer.x0, layer.x1), d = rng.next();
          const y = yAt(x) + 18 + d * 150;
          const w = rng.range(70, 160) * (0.7 + d * 0.6), h = rng.range(10, 22) * (0.7 + d * 0.6);
          const poly = [[x, y], [x + w, y - h * 0.2], [x + w * 1.05, y + h], [x + w * 0.05, y + h * 1.15]];
          Paint.wash(g, poly, rng.pick([C.meadowLit, C.meadow, C.sage, C.hillLit, '#b9a15e', C.grassSage]), { layers: 2, alpha: 0.32, amp: 2, seed: 1400 + i, edge: 0.12 });
          if (rng.chance(0.55)) Paint.ink(g, [[x, y + h * 1.1], [x + w * 1.05, y + h * 0.95]], { w: rng.range(2, 4), alpha: 0.32, color: C.leafDeep, seed: 1480 + i, wobble: 1, breaks: 0.2 });
        }
        // olivos redondos y plateados, en hileras
        for (let k = 0; k < 44; k++) {
          const xa = rng.range(layer.x0, layer.x1 - 200), n = rng.int(3, 8), d = rng.next();
          for (let c = 0; c < n; c++) { const x = xa + c * rng.range(18, 26); oliveBlob(g, x, yAt(x) + 22 + d * 120 + (c % 2) * 6, 7 + d * 7, rng); }
        }
        // cipreses en grupos
        for (let i = 0; i < 50; i++) {
          const x = rng.range(layer.x0, layer.x1);
          if (Math.abs(x - 1449) < 90) continue;
          const y = yAt(x) + rng.range(8, 70);
          const n = rng.chance(0.4) ? rng.int(2, 4) : 1;
          for (let k = 0; k < n; k++) cypress(g, x + k * 15, y + rng.range(-4, 4), rng.range(56, 104), rng);
        }
        // el arroyo baja por la vaguada hacia el puente: cinta clara entre orillas oscuras
        const s = [];
        for (let t = 0; t <= 1.001; t += 0.05) s.push([1449 + Math.sin(t * 5) * 14 + t * 18, U.lerp(yAt(1449) - 6, 1120, t * t)]);
        Paint.ink(g, s.map(([x, y]) => [x + 2, y + 2]), { w: 14, alpha: 0.35, color: C.leafDeep, seed: 1489, taper: 0.1, wobble: 1, press: (t) => 0.4 + t * 1.8 });
        Paint.ink(g, s, { w: 10, alpha: 0.75, color: C.water, seed: 1490, taper: 0.1, wobble: 1, press: (t) => 0.4 + t * 1.8 });
        Paint.ink(g, s.map(([x, y]) => [x - 1, y - 1.5]), { w: 2.6, alpha: 0.8, color: C.waterLit, seed: 1491, taper: 0.1, breaks: 0.5, press: (t) => 0.5 + t * 1.4 });
        // una masía con su chimenea en la ladera
        const fx = 2460, fy = yAt(2460) + 44;
        farHouse(g, fx, fy, 66, 42, rng, { windows: 2 });
        farHouse(g, fx + 72, fy + 6, 42, 28, rng, { windows: 1 });
        if (life) life.chimneys.push({ x: fx + 50, y: fy - 66, layer: 'hills', s: 1.6, k: 0.9 });
      },
    });
  };
})(window.JHS = window.JHS || {});
