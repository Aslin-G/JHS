/* Elementos de mundo pintados una sola vez como sprites: rocas, árboles, hierba, flores,
   madera (escalera, cerca, letrero, banco, tablones, tronco), farol, cofre y semillas de luz.
   Referencia: recuadro «Elementos de Mundo (Estilo gráfico)» de la lámina y reglas §52–§59. */
(function (JHS) {
  'use strict';
  const U = JHS.U, Paint = JHS.Paint, P = JHS.Palette;

  const RES = 1.25; // resolución de pintado de los sprites de utilería

  function smoothBlob(cx, cy, rx, ry, n, rng, irr, flatBottom) {
    let pts = U.blobPoly(cx, cy, rx, ry, n, rng, irr, rng.range(-0.15, 0.15));
    if (flatBottom != null) {
      const fl = cy + ry * flatBottom;
      pts = pts.map(([x, y]) => [x, y > fl ? fl + (y - fl) * 0.25 : y]);
    }
    return U.spline(pts, 4, true);
  }

  // ---------------------------------------------------------------- roca (§53)
  // Volumen: base cálida clara, medio tono pardo abajo, sombra violácea, motas oscuras y claras,
  // grietas de tinta y contorno sepia más pesado en la base.
  function paintRockShape(g, poly, rx, ry, seed, o = {}) {
    const rng = U.makeRng(seed * 7 + 3);
    const warm = o.warm == null ? 0.5 : o.warm;
    const base = U.mix(P.rockLight, P.rockWarm, warm * 0.6);
    Paint.wash(g, poly, base, { layers: 7, alpha: 0.16, amp: Math.max(1.2, rx * 0.025), seed, edge: 0.18, core: 1, vary: P.rock, varyAmt: 0.5 });
    Paint.within(g, poly, () => {
      // manchas de medio tono irregulares, cargadas hacia abajo a la izquierda
      for (let k = 0; k < 3; k++) {
        const px = rng.range(-rx * 0.6, rx * 0.25), py = rng.range(ry * 0.0, ry * 0.6);
        Paint.shade(g, smoothBlob(px, py, rx * rng.range(0.45, 0.75), ry * rng.range(0.35, 0.6), 8, rng, 0.35), o.mid || P.rock,
          { layers: 6, alpha: 0.12, amp: rx * 0.06, seed: seed + 1 + k, edge: 0.14, vary: k === 1 ? P.rockCool : P.earthShade, varyAmt: 0.4 });
      }
      Paint.shade(g, smoothBlob(-rx * 0.5, ry * 0.85, rx * 0.8, ry * 0.45, 9, rng, 0.35), o.shade || P.rockShade,
        { layers: 6, alpha: 0.12, amp: rx * 0.05, seed: seed + 5, edge: 0.1 });
      if (o.cool) Paint.shade(g, smoothBlob(-rx * 0.2, ry * 0.5, rx * 0.6, ry * 0.35, 8, rng, 0.3), P.rockCool,
        { layers: 4, alpha: 0.12, amp: rx * 0.05, seed: seed + 4, edge: 0 });
      // reflejo cálido del sol (arriba a la derecha)
      Paint.wash(g, smoothBlob(rx * 0.35, -ry * 0.5, rx * 0.5, ry * 0.28, 8, rng, 0.3), P.rockLight,
        { layers: 4, alpha: 0.35, amp: rx * 0.04, seed: seed + 3, edge: 0, blend: 'source-over' });
      const area = rx * ry;
      Paint.splatter(g, 0, ry * 0.1, rx * 1.05, ry, area / 26, P.inkSoft, { alpha: 0.5, rmin: 0.35, rmax: 1.2, seed });
      Paint.splatter(g, rx * 0.1, -ry * 0.1, rx, ry, area / 38, '#f7ead2', { alpha: 0.85, rmin: 0.45, rmax: 1.5, seed: seed + 5 });
      // facetas / grietas
      const nc = 2 + Math.floor(rx / 40);
      for (let k = 0; k < nc; k++) {
        const x0 = rng.range(-rx * 0.6, rx * 0.5), y0 = rng.range(-ry * 0.6, ry * 0.1);
        const pts = [[x0, y0]];
        for (let s = 0; s < 3; s++) {
          const l = pts[pts.length - 1];
          pts.push([l[0] + rng.range(-rx * 0.12, rx * 0.12), l[1] + rng.range(ry * 0.12, ry * 0.3)]);
        }
        Paint.ink(g, pts, { w: 1.05, alpha: 0.45, seed: seed + 20 + k, taper: 0.5, wobble: 0.3 });
      }
      if (o.moss !== false) {
        for (let k = 0; k < 4 + rx / 18; k++) {
          const mx = rng.range(-rx * 0.65, rx * 0.65);
          const my = -ry * 0.92 + (Math.abs(mx) / rx) * ry * 0.55 + rng.range(-2, 7);
          Paint.wash(g, U.blobPoly(mx, my, rng.range(5, 11), rng.range(2.5, 5), 9, rng, 0.35),
            rng.chance(0.5) ? P.moss : P.mossLight, { layers: 4, alpha: 0.24, amp: 1.2, seed: seed + 30 + k, edge: 0.15 });
        }
      }
    });
    Paint.ink(g, poly, {
      closed: true, w: o.inkW || 3, wv: 0.6, breaks: 0.2, sketch: 0.7, bleed: 1, seed: seed + 9, alpha: 0.9,
      press: (t, p) => 0.7 + U.clamp(p[1] / ry, -0.5, 1) * 0.6,
    });
  }

  function rock(rx, ry, seed, o = {}) {
    const rng = U.makeRng(seed);
    const poly = smoothBlob(0, 0, rx, ry, o.n || 10, rng, o.irr == null ? 0.16 : o.irr, o.flat == null ? 0.6 : o.flat);
    const pad = 10;
    return Paint.makeSprite({ w: rx * 2 + pad * 2 + rx * 0.4, h: ry * 2 + pad * 2 + 10, ox: rx * 1.2 + pad, oy: ry + pad, res: o.res || RES,
      post: { edge: 0.45, grain: 0.55, density: 0.25, gx: seed * 31, gy: seed * 17 } }, (g) => {
      // sombra proyectada suave
      Paint.shade(g, U.blobPoly(rx * 0.1, ry * 0.62, rx * 1.12, ry * 0.16, 14, rng, 0.12), '#7b6150',
        { layers: 5, alpha: 0.1, amp: 3, edge: 0, seed });
      paintRockShape(g, poly, rx, ry, seed, o);
    });
  }

  // ---------------------------------------------------------------- hierba y flores (§19)
  // Brizna como forma afilada rellena (no como línea uniforme).
  function blade(g, x0, y0, len, lean, bw, col, alpha) {
    const tipX = x0 + lean * len, tipY = y0 - len;
    const cx = x0 + lean * len * 0.25, cy = y0 - len * 0.55;
    const L = Paint.quadPts(x0 - bw / 2, y0, cx - bw * 0.3, cy, tipX, tipY, 6);
    const R = Paint.quadPts(tipX, tipY, cx + bw * 0.3, cy, x0 + bw / 2, y0, 6);
    g.globalAlpha = alpha;
    g.fillStyle = col;
    Paint.fillPoly(g, L.concat(R));
    return L;
  }

  function grassTuft(seed, o = {}) {
    const rng = U.makeRng(seed);
    const w = o.w || rng.range(34, 64), h = o.h || rng.range(20, 40);
    return Paint.makeSprite({ w: w + 30, h: h + 12, ox: w / 2 + 15, oy: h + 6, res: RES,
      post: { edge: 0.35, grain: 0.35, density: 0.2, gx: seed * 7 } }, (g) => {
      // base húmeda que asienta la mata en el suelo
      Paint.wash(g, U.blobPoly(0, -2, w * 0.5, 5, 10, rng, 0.25), P.grassDark, { layers: 4, alpha: 0.18, amp: 1.5, seed, edge: 0.15 });
      const blades = Math.round(w / 1.7);
      const back = [P.moss, P.grassDark, P.hillShade];
      const front = [P.grass, P.grassLight, P.mossLight, P.hillLight];
      for (let pass = 0; pass < 2; pass++) {
        const cols = pass ? front : back;
        for (let i = 0; i < blades / (pass ? 1.6 : 2.4); i++) {
          const x0 = rng.range(-w / 2, w / 2);
          const lean = (x0 / w) * 0.9 + rng.range(-0.35, 0.35);
          const hh = h * rng.range(0.4, 1) * (1 - Math.abs(x0) / w * 0.7) * (pass ? 0.85 : 1);
          blade(g, x0, 0, hh, lean, rng.range(1.6, 3.2), cols[i % cols.length], rng.range(0.6, 0.92));
        }
      }
      g.globalAlpha = 1;
      for (let i = 0; i < 3; i++) {
        const x0 = rng.range(-w / 3, w / 3), lean = rng.range(-0.5, 0.5), hh = h * rng.range(0.5, 0.9);
        Paint.ink(g, Paint.quadPts(x0, 0, x0 + lean * hh * 0.25, -hh * 0.55, x0 + lean * hh, -hh, 6),
          { w: 0.9, alpha: 0.55, seed: seed + i, taper: 0.7, wobble: 0.2 });
      }
    });
  }

  function flower(kind, seed) {
    const rng = U.makeRng(seed);
    const h = rng.range(14, 26);
    return Paint.makeSprite({ w: 44, h: h + 26, ox: 22, oy: h + 14, res: RES * 1.4 }, (g) => {
      // tallo y hojas
      const top = [rng.range(-3, 3), -h];
      Paint.ink(g, Paint.quadPts(0, 0, rng.range(-4, 4), -h * 0.5, top[0], top[1], 6), { w: 1.3, color: P.grassDark, alpha: 0.9, seed, taper: 0.1, wobble: 0.2 });
      for (let i = 0; i < 2; i++) {
        const s = i ? 1 : -1, y = -rng.range(2, h * 0.4);
        const leaf = [[0, y], [s * 6, y - 5], [s * 11, y - 4], [s * 5, y + 1]];
        Paint.wash(g, U.spline(leaf, 3, true), P.grass, { layers: 3, alpha: 0.5, amp: 0.4, seed: seed + i, edge: 0.35 });
      }
      const [cx, cy] = top;
      if (kind === 'daisy') {
        const n = rng.int(10, 13), r = rng.range(7, 9.5);
        const tilt = rng.range(0.55, 0.8);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * U.TAU + rng.range(-0.1, 0.1);
          const ex = cx + Math.cos(a) * r, ey = cy + Math.sin(a) * r * tilt;
          const ang = Math.atan2(ey - cy, ex - cx);
          const len = Math.hypot(ex - cx, ey - cy);
          g.save();
          g.translate(cx + Math.cos(ang) * len * 0.55, cy + Math.sin(ang) * len * 0.55);
          g.rotate(ang);
          g.fillStyle = Math.sin(a) > 0.3 ? U.mix(P.flowerWhite, P.skyMist, 0.55) : P.flowerWhite;
          g.beginPath();
          g.ellipse(0, 0, len * 0.5, 1.9, 0, 0, U.TAU);
          g.fill();
          g.globalAlpha = 0.6;
          g.strokeStyle = P.inkGrey;
          g.lineWidth = 0.5;
          g.stroke();
          g.restore();
        }
        g.fillStyle = P.flowerCenter;
        g.beginPath(); g.ellipse(cx, cy, 3, 2.4, 0, 0, U.TAU); g.fill();
        g.globalAlpha = 0.7; g.strokeStyle = P.inkSoft; g.lineWidth = 0.5; g.stroke(); g.globalAlpha = 1;
        Paint.splatter(g, cx + 0.5, cy + 0.6, 2, 1.5, 6, P.amber, { alpha: 0.85, rmin: 0.3, rmax: 0.7, seed });
      } else {
        const col = kind === 'lilac' ? P.flowerLilac : kind === 'pink' ? '#e6a1b2' : P.flowerYellow;
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * U.TAU;
          g.fillStyle = col;
          g.globalAlpha = 0.85;
          g.beginPath(); g.ellipse(cx + Math.cos(a) * 2.4, cy + Math.sin(a) * 1.8, 2.3, 1.7, a, 0, U.TAU); g.fill();
        }
        g.globalAlpha = 1;
        g.fillStyle = U.darken(col, 0.35);
        g.beginPath(); g.arc(cx, cy, 1, 0, U.TAU); g.fill();
      }
    });
  }

  // Rama o tronco: cinta de madera con lado en sombra, vetas de pincel seco y tinta.
  function woodLimb(g, rng, pts, w0, w1, sd) {
    const R = U.resample(U.spline(pts, 6), 3);
    const N = [];
    for (let i = 0; i < R.length; i++) {
      const a = R[Math.max(0, i - 1)], b = R[Math.min(R.length - 1, i + 1)];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      N.push([-(b[1] - a[1]) / l, (b[0] - a[0]) / l]);
    }
    const left = [], right = [];
    for (let i = 0; i < R.length; i++) {
      const t = i / (R.length - 1);
      const w = U.lerp(w0, w1, Math.pow(t, 0.8)) * (1 + (U.noise1(i * 0.2, sd) - 0.5) * 0.25);
      left.push([R[i][0] + N[i][0] * w / 2, R[i][1] + N[i][1] * w / 2]);
      right.push([R[i][0] - N[i][0] * w / 2, R[i][1] - N[i][1] * w / 2]);
    }
    // el lado en sombra es el contrario al sol (que entra por la derecha)
    const avgNx = N.reduce((s, n) => s + n[0], 0);
    const shadeSide = avgNx > 0 ? right.slice() : left.slice();
    const poly = left.concat(right.slice().reverse());
    Paint.wash(g, poly, U.mix(P.wood, P.woodLight, 0.35), { layers: 5, alpha: 0.3, amp: 0.8, seed: sd, edge: 0.3, core: 1 });
    Paint.within(g, poly, () => {
      Paint.shade(g, shadeSide.concat(R.slice().reverse()), P.woodShade,
        { layers: 4, alpha: 0.24, amp: 1, seed: sd + 1, edge: 0 });
      for (let k = 0; k < Math.max(2, w0 / 5); k++) {
        const off = rng.range(-0.4, 0.4);
        Paint.bristles(g, R.map((p, i) => [p[0] + N[i][0] * w0 * off * (1 - i / R.length * 0.6), p[1] + N[i][1] * w0 * off]),
          { n: 2, w: 2, color: P.woodShade, alpha: 0.45, seed: sd + 10 + k, gaps: 0.4 });
      }
    });
    Paint.ink(g, left, { w: 1.4, alpha: 0.75, seed: sd + 3, breaks: 0.2, taper: 0.1 });
    Paint.ink(g, right, { w: 1.8, alpha: 0.85, seed: sd + 4, breaks: 0.15, taper: 0.1 });
  }

  // ---------------------------------------------------------------- árbol (§52)
  // Olivo de tronco retorcido con copa hecha de cientos de toques de verde amarillento.
  // Olivo del valle (concepto del Mundo 1): copa más ancha y baja, verde plateado.
  // Colores medidos en el olivo del concepto: oliva tostado con luces de miel y sombras pardas.
  const OLIVE = { leafLight: '#dcc589', leafMid: '#a8945a', leafShade: '#7d6c3c', leafDeep: '#4f4424', grassLight: '#e6d39c' };
  function tree(seed, o = {}) {
    if (o.kind === 'olive') {
      const keep = {};
      for (const k in OLIVE) { keep[k] = P[k]; P[k] = OLIVE[k]; }
      try {
        const H = o.h || 460;
        return treeImpl(seed, Object.assign({ cw: H * 1.15, ch: H * 0.5, trunkW: H * 0.09, limbs: 4, lobes: 8, dabs: Math.round(H * 1.7) }, o, { kind: null }));
      } finally { Object.assign(P, keep); }
    }
    return treeImpl(seed, o);
  }

  function treeImpl(seed, o = {}) {
    const rng = U.makeRng(seed);
    const H = o.h || 520, CW = o.cw || H * 0.95, CH = o.ch || H * 0.62;
    const trunkW = o.trunkW || H * 0.07;
    const W = CW + 80, Ht = H + 40;
    const lean = o.lean == null ? rng.range(-0.08, 0.08) : o.lean;
    const crownY = -H + CH * 0.5;
    const crownX = lean * H * 0.6;
    return Paint.makeSprite({ w: W, h: Ht, ox: W / 2, oy: H + 10, res: o.res || 1,
      post: { edge: 0.4, grain: 0.5, density: 0.25, gx: seed * 13 } }, (g) => {
      // ramas principales (detrás de la copa)
      const limbs = [];
      const baseTop = [crownX * 0.5, -H * 0.42];
      const nl = o.limbs || 3;
      for (let i = 0; i < nl; i++) {
        const a = -Math.PI / 2 + (i / (nl - 1) - 0.5) * 1.9 + rng.range(-0.2, 0.2);
        const len = H * rng.range(0.16, 0.26);
        limbs.push([baseTop, [baseTop[0] + Math.cos(a) * len * 0.5 + rng.range(-20, 20), baseTop[1] + Math.sin(a) * len * 0.5],
          [baseTop[0] + Math.cos(a) * len, baseTop[1] + Math.sin(a) * len]]);
      }
      const wood = (pts, w0, w1, sd) => woodLimb(g, rng, pts, w0, w1, sd);
      // copa: masas oscuras, medias y luces (de abajo a arriba y hacia el sol, a la derecha)
      const lobes = [];
      const nLobes = o.lobes || 7;
      for (let i = 0; i < nLobes; i++) {
        const a = (i / nLobes) * U.TAU + rng.range(-0.3, 0.3);
        lobes.push([crownX + Math.cos(a) * CW * 0.3 * rng.range(0.6, 1), crownY + Math.sin(a) * CH * 0.28 * rng.range(0.6, 1),
          CW * rng.range(0.18, 0.26), CH * rng.range(0.2, 0.3)]);
      }
      lobes.push([crownX, crownY, CW * 0.3, CH * 0.32]);
      const inCrown = (x, y, k = 1) => lobes.some(([lx, ly, rx, ry]) => ((x - lx) / rx) ** 2 + ((y - ly) / ry) ** 2 < k);
      // sombra relativa dentro de la copa: 0 = arriba a la derecha (sol), 1 = abajo a la izquierda
      const shadeAt = (x, y) => {
        let best = 1;
        for (const [lx, ly, rx, ry] of lobes) {
          const dx = (x - lx) / rx, dy = (y - ly) / ry;
          if (dx * dx + dy * dy < 1) best = Math.min(best, U.clamp(0.5 + dy * 0.45 - dx * 0.3, 0, 1));
        }
        return U.clamp(best * 0.7 + ((y - crownY) / CH + 0.5) * 0.3, 0, 1);
      };
      const k = H / 520;
      // racimo de hojitas: varias elipses pequeñas superpuestas, no una burbuja
      const dab = (x, y, r, col, a, sd, blend) => {
        const m = 4 + ((sd * 7) % 4);
        g.save();
        g.globalCompositeOperation = blend || 'source-over';
        g.fillStyle = col;
        g.strokeStyle = U.darken(col, 0.3);
        g.lineWidth = 0.7;
        for (let i = 0; i < m; i++) {
          const lx = x + rng.gauss() * r * 0.42, ly = y + rng.gauss() * r * 0.3;
          const rx = r * rng.range(0.3, 0.46);
          g.globalAlpha = a * rng.range(0.7, 1.1);
          g.beginPath();
          g.ellipse(lx, ly, rx, rx * rng.range(0.5, 0.75), rng.range(-0.9, 0.9), 0, U.TAU);
          g.fill();
          if (!blend && rng.chance(0.35)) { g.globalAlpha = a * 0.6; g.stroke(); }
        }
        g.restore();
      };
      // Se pinta de claro a oscuro, como en acuarela real: la luz es el papel y el primer lavado.
      // 1) primer lavado claro sobre toda la copa
      for (const [lx, ly, rx, ry] of lobes) {
        Paint.wash(g, smoothBlob(lx, ly, rx, ry, 10, rng, 0.25), P.leafLight,
          { layers: 4, alpha: 0.2, amp: 5, seed: seed + lx, edge: 0.12, vary: P.grassLight, varyAmt: 0.7 });
      }
      // 2) racimos de medio tono, 3) sombras frías y 4) acentos profundos donde la luz no llega
      const N1 = o.dabs || 320;
      const cluster = (minS, col, r0, r1, a, n, sd) => {
        for (let i = 0; i < n; i++) {
          const x = crownX + rng.range(-CW * 0.55, CW * 0.55), y = crownY + rng.range(-CH * 0.55, CH * 0.55);
          if (!inCrown(x, y, 0.82)) continue;
          if (shadeAt(x, y) + rng.range(-0.1, 0.1) < minS) continue;
          dab(x, y, rng.range(r0, r1) * k, col, a, sd + i);
        }
      };
      cluster(0.3, P.leafMid, 10, 18, 0.55, N1, seed * 3);
      cluster(0.52, P.leafShade, 9, 16, 0.55, N1 * 0.9, seed * 5);
      cluster(0.74, P.leafDeep, 6, 11, 0.6, N1 * 0.6, seed * 7);
      // ramas que asoman entre las hojas, luego más hojas por delante para esconderlas en parte
      for (let i = 0; i < limbs.length; i++) wood(limbs[i], trunkW * 0.5, trunkW * 0.16, seed + 50 + i);
      cluster(0.26, P.leafMid, 8, 14, 0.6, N1 * 0.45, seed * 11);
      cluster(0.56, P.leafShade, 7, 12, 0.55, N1 * 0.3, seed * 17);
      // hojas opacas (toque de gouache) que tapan las puntas de las ramas
      for (const l of limbs) {
        for (let i = 0; i < 9; i++) {
          const t = rng.range(0.55, 1.05);
          const x = U.lerp(l[0][0], l[2][0], t) + rng.gauss() * 10, y = U.lerp(l[0][1], l[2][1], t) + rng.gauss() * 8;
          const s = shadeAt(x, y);
          dab(x, y, rng.range(9, 15) * k, s > 0.55 ? U.mix(P.leafShade, P.leafMid, 0.4) : U.mix(P.leafMid, P.leafLight, 0.45), 0.7, seed * 19 + i, 'source-over');
        }
      }
      // 5) luces densas tipo gouache en el borde soleado
      for (let i = 0; i < N1 * 0.35; i++) {
        const x = crownX + rng.range(-CW * 0.3, CW * 0.55), y = crownY + rng.range(-CH * 0.55, CH * 0.2);
        if (!inCrown(x, y, 0.85) || shadeAt(x, y) > 0.38) continue;
        dab(x, y, rng.range(5, 10) * k, P.leafSun, 0.7, seed * 13 + i, 'source-over');
      }
      // contorno de racimos: pequeños arcos de tinta en la silueta inferior e izquierda
      for (let i = 0; i < 46; i++) {
        const a = rng.range(Math.PI * 0.25, Math.PI * 1.25);
        const L = lobes[i % lobes.length];
        const x = L[0] + Math.cos(a) * L[2] * 0.92, y = L[1] + Math.sin(a) * L[3] * 0.92;
        if (inCrown(x, y, 0.55)) continue;
        const r = rng.range(5, 10) * k, a0 = a - 0.9;
        const arc = [];
        for (let s = 0; s <= 6; s++) arc.push([x + Math.cos(a0 + s * 0.3) * r, y + Math.sin(a0 + s * 0.3) * r]);
        Paint.ink(g, arc, { w: 1, alpha: 0.5, seed: seed + 200 + i, taper: 0.5, color: P.inkWarm });
      }
      // tronco retorcido con raíces (por delante de la copa baja)
      const trunk = [[-trunkW * 0.1, 0], [trunkW * 0.25 + lean * 40, -H * 0.15], [-trunkW * 0.2 + lean * 80, -H * 0.3], baseTop];
      wood(trunk, trunkW * 1.35, trunkW * 0.75, seed + 40);
      for (let i = 0; i < 3; i++) {
        const s = i - 1;
        wood([[s * trunkW * 0.2, -12], [s * trunkW * 0.7, -4], [s * trunkW * 1.3 + rng.range(-6, 6), 2]], trunkW * 0.4, trunkW * 0.12, seed + 60 + i);
      }
      // hierba y piedritas al pie
      for (let i = 0; i < 18; i++) {
        const x = rng.range(-trunkW * 2.5, trunkW * 2.5);
        Paint.bristles(g, Paint.quadPts(x, 4, x + rng.range(-4, 4), -6, x + rng.range(-8, 8), -rng.range(10, 22), 5),
          { n: 3, w: 3, color: [P.grassDark, P.grass, P.grassLight], alpha: 0.7, seed: seed + 90 + i, gaps: 0 });
      }
    });
  }


  // Rama larga que sirve de plataforma natural (§18): madera + racimos de hojas en la punta.
  function branch(pts, w0, w1, seed) {
    const bb = U.bbox(pts);
    const pad = w0 + 46;
    return Paint.makeSprite({ w: bb.w + pad * 2, h: bb.h + pad * 2, ox: -bb.x + pad, oy: -bb.y + pad, res: 1,
      post: { edge: 0.4, grain: 0.45, density: 0.2, gx: seed * 5 } }, (g) => {
      const rng = U.makeRng(seed);
      woodLimb(g, rng, pts, w0, w1, seed);
      const end = pts[pts.length - 1];
      for (let i = 0; i < 26; i++) {
        const t = rng.range(0.55, 1.1);
        const k = Math.min(pts.length - 1, Math.floor(t * (pts.length - 1)));
        const p = pts[k];
        const x = (t > 1 ? end[0] : p[0]) + rng.gauss() * 16, y = (t > 1 ? end[1] : p[1]) - rng.range(4, 22);
        g.fillStyle = rng.pick([P.leafMid, P.leafLight, P.leafShade, P.leafSun]);
        g.globalAlpha = 0.7;
        for (let m = 0; m < 4; m++) {
          g.beginPath();
          g.ellipse(x + rng.gauss() * 4, y + rng.gauss() * 3, rng.range(3, 5.5), rng.range(2, 3.2), rng.range(-0.8, 0.8), 0, U.TAU);
          g.fill();
        }
      }
      g.globalAlpha = 1;
    });
  }

  // Campanilla del camino: tallo curvo con tres campanas lila azulado colgando (se recoge).
  function bellCup(g, x, y, r, ang, seed) {
    g.save();
    g.translate(x, y);
    g.rotate(ang);
    const cup = [[-r * 0.55, 0], [-r * 0.75, r * 0.9], [-r * 0.95, r * 1.45], [-r * 0.45, r * 1.25], [0, r * 1.5], [r * 0.45, r * 1.25], [r * 0.95, r * 1.45], [r * 0.75, r * 0.9], [r * 0.55, 0]];
    const poly = U.spline(cup, 3, true);
    Paint.wash(g, poly, P.bell, { layers: 3, alpha: 0.45, amp: 0.25, seed, edge: 0.3, core: 1, vary: P.bellLight, varyAmt: 0.4 });
    Paint.within(g, poly, () => Paint.shade(g, [[-r * 2, 0], [-r * 0.1, 0], [-r * 0.2, r * 2], [-r * 2, r * 2]], P.bellShade, { layers: 2, alpha: 0.3, amp: 1, seed: seed + 1, edge: 0 }));
    Paint.ink(g, poly, { closed: true, w: 0.8, alpha: 0.8, seed: seed + 2, breaks: 0.15 });
    g.restore();
  }

  function bellflower(seed) {
    const rng = U.makeRng(seed);
    const h = rng.range(30, 38);
    return Paint.makeSprite({ w: 50, h: h + 20, ox: 22, oy: h + 8, res: RES * 1.5 }, (g) => {
      const stem = Paint.quadPts(0, 0, -2, -h * 0.6, 9, -h, 8);
      Paint.ink(g, stem, { w: 1.3, color: P.grassDark, alpha: 0.9, seed, taper: 0.1, wobble: 0.2 });
      for (let i = 0; i < 2; i++) {
        const s = i ? 1 : -1, y = -rng.range(3, 10);
        Paint.wash(g, U.spline([[0, y], [s * 6, y - 6], [s * 12, y - 5], [s * 5, y + 1]], 3, true), P.grass, { layers: 3, alpha: 0.5, amp: 0.4, seed: seed + i, edge: 0.35 });
      }
      // tres campanas colgando de pedúnculos finos
      const at = [[0.55, -0.2], [0.78, 0.25], [1, 0.6]];
      at.forEach(([t, a], i) => {
        const k = Math.min(stem.length - 1, Math.round(t * (stem.length - 1)));
        const [x, y] = stem[k];
        const px = x + 4 + i * 1.5, py = y + 3;
        Paint.ink(g, [[x, y], [px, py]], { w: 0.7, color: P.grassDark, alpha: 0.85, seed: seed + 10 + i });
        bellCup(g, px, py, 3.3 - i * 0.2, a * 0.6, seed + 20 + i * 3);
      });
    });
  }

  // Ramillete de campanillas (en la mano de la niña y en el marcador).
  function bouquet(seed) {
    return Paint.makeSprite({ w: 36, h: 40, ox: 12, oy: 26, res: 2.4 }, (g) => {
      const rng = U.makeRng(seed);
      for (let i = 0; i < 5; i++) {
        const a = -1.1 + i * 0.32 + rng.range(-0.08, 0.08);
        const len = rng.range(16, 22);
        const ex = Math.cos(a) * len, ey = Math.sin(a) * len;
        Paint.ink(g, [[0, 0], [ex * 0.5, ey * 0.5 - 1], [ex, ey]], { w: 0.9, color: P.grassDark, alpha: 0.9, seed: seed + i, taper: 0.1 });
        bellCup(g, ex, ey, 3, a + Math.PI / 2 - 0.4, seed + 30 + i);
      }
      // lazo de hierba
      Paint.ink(g, [[-2, 2], [2, 4], [5, 1]], { w: 1.2, color: P.grass, alpha: 0.9, seed: seed + 50 });
    });
  }

  // Flor alta en dos piezas (para que la espiga ceda después del tallo): dedalera rosa o
  // gordolobo amarillo. Devuelve { stem, head, tip } con tip = punta del tallo.
  function tallFlower(kind, seed) {
    const rng = U.makeRng(seed);
    const h = rng.range(34, 48);
    const stem = Paint.makeSprite({ w: 36, h: h + 16, ox: 18, oy: h + 6, res: RES * 1.3 }, (g) => {
      Paint.ink(g, Paint.quadPts(0, 0, rng.range(-3, 3), -h * 0.5, 0, -h, 6), { w: 1.6, color: P.grassDark, alpha: 0.9, seed, taper: 0.15, wobble: 0.2 });
      for (let i = 0; i < 3; i++) {
        const sd = i % 2 ? 1 : -1, y = -rng.range(2, h * 0.5);
        Paint.wash(g, U.spline([[0, y], [sd * 7, y - 6], [sd * 13, y - 4], [sd * 6, y + 1]], 3, true), i ? P.grass : P.grassDark, { layers: 3, alpha: 0.55, amp: 0.4, seed: seed + i, edge: 0.35 });
      }
    });
    const pink = kind === 'foxglove';
    const head = Paint.makeSprite({ w: 30, h: 40, ox: 15, oy: 36, res: RES * 1.3 }, (g) => {
      Paint.ink(g, [[0, 0], [0, -30]], { w: 1.2, color: P.grassDark, alpha: 0.85, seed: seed + 5, taper: 0.2 });
      const n = pink ? 7 : 9;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1), y = -4 - t * 26, side = i % 2 ? 1 : -1, r = (pink ? 3.6 : 2.6) * (1 - t * 0.45);
        const col = pink ? (t > 0.7 ? '#e9b7c4' : '#d9879f') : (t > 0.75 ? '#c9b25a' : P.flowerYellow);
        Paint.wash(g, U.blobPoly(side * r * 0.7, y, r, r * (pink ? 1.3 : 0.9), 8, rng, 0.2), col, { layers: 2, alpha: 0.85, amp: 0.2, seed: seed + 10 + i, edge: 0.4, core: 1 });
        if (pink) { g.fillStyle = U.rgba('#9b4d64', 0.6); g.beginPath(); g.arc(side * r * 0.6, y + r * 0.5, 0.7, 0, U.TAU); g.fill(); }
      }
    });
    return { stem, head, tip: [0, -h] };
  }

  JHS.Props = { RES, smoothBlob, paintRockShape, rock, grassTuft, flower, tallFlower, tree, woodLimb, branch, bellflower, bouquet };
})(window.JHS = window.JHS || {});
