/* Kit de pintura: acuarela por capas, tinta sepia de grosor variable, pincel seco, salpicado
   y el «secado» de cada pieza (bordes oscurecidos + granulación + relieve de papel).
   Biblia §5: la imagen debe parecer hecha con acuarela, tinta sepia, grafito y pincel seco. */
(function (JHS) {
  'use strict';
  const U = JHS.U;
  const P = JHS.Palette;

  // ------------------------------------------------------------ geometría de trazo
  // Desplazamiento recursivo de puntos medios: bordes vivos e irregulares como los del agua.
  function deform(poly, depth, amp, rng) {
    let p = poly;
    let a = amp;
    for (let d = 0; d < depth; d++) {
      const n = p.length;
      const out = new Array(n * 2);
      for (let i = 0; i < n; i++) {
        const A = p[i], B = p[(i + 1) % n];
        const mx = (A[0] + B[0]) * 0.5, my = (A[1] + B[1]) * 0.5;
        const dx = B[0] - A[0], dy = B[1] - A[1];
        const len = Math.hypot(dx, dy) || 1;
        const off = rng.gauss() * a * Math.min(1, len / (a * 6 + 1e-6));
        out[i * 2] = A;
        out[i * 2 + 1] = [mx - (dy / len) * off + rng.gauss() * a * 0.15, my + (dx / len) * off + rng.gauss() * a * 0.15];
      }
      p = out;
      a *= 0.55;
    }
    return p;
  }

  function pathPoly(ctx, p, closed = true) {
    ctx.beginPath();
    ctx.moveTo(p[0][0], p[0][1]);
    for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
    if (closed) ctx.closePath();
  }

  function fillPoly(ctx, p) {
    pathPoly(ctx, p, true);
    ctx.fill();
  }

  // Lavado de acuarela: muchas capas translúcidas de un mismo polígono deformado.
  function wash(ctx, poly, color, o = {}) {
    const rng = U.makeRng(o.seed == null ? 1 : o.seed);
    const amp = o.amp == null ? 3 : o.amp;
    const layers = o.layers == null ? 10 : o.layers;
    const base = deform(poly, o.baseDepth == null ? 2 : o.baseDepth, o.baseAmp == null ? amp * 1.4 : o.baseAmp, rng);
    ctx.save();
    ctx.globalCompositeOperation = o.blend || 'source-over';
    ctx.fillStyle = color;
    ctx.globalAlpha = o.alpha == null ? 0.12 : o.alpha;
    // `vary`: lavado variegado — capas alternas con un segundo pigmento mezclado en húmedo.
    for (let i = 0; i < layers; i++) {
      if (o.vary) ctx.fillStyle = U.mix(color, o.vary, (i % 3) / 2 * (o.varyAmt == null ? 0.6 : o.varyAmt));
      fillPoly(ctx, deform(base, o.depth == null ? 3 : o.depth, amp, rng));
    }
    ctx.fillStyle = color;
    if (o.core) {
      // núcleo de pigmento más denso (zona central del lavado)
      ctx.globalAlpha = o.core;
      fillPoly(ctx, base);
    }
    const edge = o.edge == null ? 0.22 : o.edge;
    if (edge > 0) {
      ctx.globalAlpha = edge;
      ctx.strokeStyle = o.edgeColor || U.darken(color, 0.35);
      ctx.lineWidth = o.edgeW || 1.2;
      ctx.lineJoin = 'round';
      pathPoly(ctx, base, true);
      ctx.stroke();
    }
    ctx.restore();
    return base;
  }

  // Veladura: el mismo lavado pero multiplicando sobre lo que hay debajo (sombras transparentes).
  function shade(ctx, poly, color, o = {}) {
    return wash(ctx, poly, color, Object.assign({ blend: 'multiply' }, o));
  }

  function glaze(ctx, poly, color, alpha = 0.3, blend = 'multiply') {
    ctx.save();
    ctx.globalCompositeOperation = blend;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    fillPoly(ctx, poly);
    ctx.restore();
  }

  // ------------------------------------------------------------ tinta
  function normals(P0) {
    const n = P0.length;
    const N = new Array(n);
    for (let i = 0; i < n; i++) {
      const a = P0[Math.max(0, i - 1)], b = P0[Math.min(n - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      N[i] = [-dy / l, dx / l];
    }
    return N;
  }

  // Línea de tinta orgánica: grosor variable, temblor leve, se pierde a ratos (§5.2).
  // `press(t)` modula la presión a lo largo del trazo; `sketch` añade un segundo trazo fino
  // desplazado, como cuando el ilustrador repasa la línea.
  function ink(ctx, pts, o = {}) {
    if (!pts || pts.length < 2) return;
    const closed = !!o.closed;
    const step = o.step || 2;
    const seed = o.seed == null ? 3 : o.seed;
    const R = U.resample(pts, step, closed);
    if (closed) R.push(R[0].slice());
    if (R.length < 2) return;
    const N = normals(R);
    const w = (o.w == null ? 1.6 : o.w) * JHS.Paint.inkScale;
    const wv = o.wv == null ? 0.55 : o.wv;
    const wob = o.wobble == null ? 0.45 : o.wobble;
    const taper = o.taper == null ? (closed ? 0 : 0.22) : o.taper;
    const breaks = o.breaks || 0;
    const total = (R.length - 1) * step;
    const X = [], W = [], keep = [];
    for (let i = 0, s = 0; i < R.length; i++, s += step) {
      const t = total > 0 ? s / total : 0;
      const off = (U.fbm1(s * 0.03, 2, seed) - 0.5) * 2 * wob;
      X.push([R[i][0] + N[i][0] * off, R[i][1] + N[i][1] * off]);
      let ww = w * (1 + wv * (U.fbm1(s * 0.016, 2, seed + 5) * 2 - 1) * 1.3);
      if (taper > 0) {
        const tp = U.clamp(Math.min(t, 1 - t) / taper, 0, 1);
        ww *= 0.2 + 0.8 * Math.sqrt(tp);
      }
      if (o.press) ww *= o.press(t, R[i]);
      W.push(Math.max(0.25, ww));
      keep.push(breaks <= 0 || U.noise1(s * 0.012, seed + 11) > 0.16 + breaks * 0.26);
    }
    ctx.save();
    ctx.fillStyle = o.color || P.ink;
    const baseA = o.alpha == null ? 0.85 : o.alpha;
    const rng = U.makeRng(seed + 99);
    const ribbon = (a, b, scale, dx) => {
      ctx.beginPath();
      for (let k = a; k <= b; k++) {
        const h = W[k] * 0.5 * scale, ox = N[k][0] * dx, oy = N[k][1] * dx;
        if (k === a) ctx.moveTo(X[k][0] + N[k][0] * h + ox, X[k][1] + N[k][1] * h + oy);
        else ctx.lineTo(X[k][0] + N[k][0] * h + ox, X[k][1] + N[k][1] * h + oy);
      }
      for (let k = b; k >= a; k--) {
        const h = W[k] * 0.5 * scale, ox = N[k][0] * dx, oy = N[k][1] * dx;
        ctx.lineTo(X[k][0] - N[k][0] * h + ox, X[k][1] - N[k][1] * h + oy);
      }
      ctx.closePath();
      ctx.fill();
    };
    // La tinta se abre un poco en el papel húmedo: halo tenue bajo la línea.
    if (o.bleed) {
      ctx.globalAlpha = baseA * 0.14 * o.bleed;
      for (let c = 0; c < R.length - 1; c += 24) ribbon(c, Math.min(R.length - 1, c + 25), 2.4, 0);
    }
    // Tramos de ~18 puntos con carga de tinta ligeramente distinta.
    let i = 0;
    while (i < R.length) {
      while (i < R.length && !keep[i]) i++;
      const a = i;
      while (i < R.length && keep[i]) i++;
      const b = i - 1;
      for (let c = a; c < b; c += 18) {
        const e = Math.min(b, c + 19);
        if (e - c < 1) continue;
        ctx.globalAlpha = baseA * (0.78 + 0.22 * rng.next());
        ribbon(c, e, 1, 0);
      }
    }
    if (o.sketch) {
      ctx.globalAlpha = baseA * 0.32 * o.sketch;
      const sd = seed + 41;
      let j = 0;
      while (j < R.length) {
        while (j < R.length && U.noise1(j * 0.05, sd) < 0.52) j++;
        const a = j;
        while (j < R.length && U.noise1(j * 0.05, sd) >= 0.52) j++;
        if (j - 1 - a > 2) ribbon(a, j - 1, 0.5, (U.noise1(a * 0.3, sd + 1) - 0.5) * 2.6 + 0.9);
      }
    }
    ctx.restore();
  }

  // Pincel seco: cerdas de longitud y presión distintas, con huecos ocasionales
  // (hierba, vetas de madera, mechones de pelo pintados).
  function bristles(ctx, pts, o = {}) {
    const R = U.resample(pts, o.step || 2, false);
    if (R.length < 2) return;
    const N = normals(R);
    const n = o.n || 6;
    const w = o.w || 6;
    const rng = U.makeRng(o.seed == null ? 5 : o.seed);
    const gaps = o.gaps == null ? 0.25 : o.gaps;
    const taper = o.taper == null ? 0.7 : o.taper;
    const colors = Array.isArray(o.color) ? o.color : [o.color || P.ink];
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const last = R.length - 1;
    for (let j = 0; j < n; j++) {
      const lat = U.clamp(rng.gauss() * 0.32, -0.5, 0.5) * w;
      const i0 = Math.floor(rng.range(0, o.startVar == null ? 0.12 : o.startVar) * last);
      const i1 = Math.ceil((1 - rng.range(0, o.endVar == null ? 0.3 : o.endVar)) * last);
      ctx.lineWidth = Math.max(0.3, (o.lw || w / n * 1.4) * rng.range(0.55, 1.35));
      ctx.globalAlpha = (o.alpha == null ? 0.55 : o.alpha) * rng.range(0.55, 1);
      ctx.strokeStyle = colors[j % colors.length];
      const sd = rng.int(0, 9999);
      ctx.beginPath();
      let pen = false;
      for (let i = i0; i <= i1; i++) {
        const t = i / last;
        const kk = lat * (1 - taper * t);
        const on = gaps <= 0 || U.noise1(i * 0.09, sd) > 0.12 + gaps * 0.3;
        const x = R[i][0] + N[i][0] * kk, y = R[i][1] + N[i][1] * kk;
        if (on && pen) ctx.lineTo(x, y);
        else if (on) { ctx.moveTo(x, y); pen = true; }
        else pen = false;
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // Salpicado de pigmento o de reserva (puntitos de luz en roca y lana).
  function splatter(ctx, cx, cy, rx, ry, n, color, o = {}) {
    const rng = U.makeRng(o.seed == null ? 8 : o.seed);
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalCompositeOperation = o.blend || 'source-over';
    const rmin = o.rmin == null ? 0.4 : o.rmin, rmax = o.rmax == null ? 1.6 : o.rmax;
    for (let i = 0; i < n; i++) {
      const a = rng.next() * U.TAU, d = Math.sqrt(rng.next());
      const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
      if (o.clip && !o.clip(x, y)) continue;
      const r = rng.range(rmin, rmax);
      ctx.globalAlpha = (o.alpha == null ? 0.6 : o.alpha) * rng.range(0.5, 1);
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * rng.range(0.6, 1), rng.next() * 3, 0, U.TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  function softBlob(ctx, x, y, r, color, alpha = 1, hard = 0) {
    const g = ctx.createRadialGradient(x, y, r * hard, x, y, r);
    g.addColorStop(0, U.rgba(color, alpha));
    g.addColorStop(1, U.rgba(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, U.TAU);
    ctx.fill();
  }

  // ------------------------------------------------------------ secado (post-proceso por pieza)
  // Modelo en espacio de pigmento: la granulación y el borde oscuro escalan con la carga de
  // pigmento, como en el papel real; donde no hay pigmento no aparece nada.
  function watercolorize(canvas, o = {}) {
    const T = JHS.Tex;
    const ctx = canvas.ctx || canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    if (!w || !h) return;
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    const n = w * h;
    const A = new Float32Array(n);
    for (let i = 0; i < n; i++) A[i] = d[i * 4 + 3] / 255;
    const edge = o.edge == null ? 0.5 : o.edge;
    const B = edge > 0 ? U.boxBlur(A, w, h, o.radius == null ? 2.5 : o.radius, 2) : A;
    const grain = o.grain == null ? 0.45 : o.grain;
    const dens = o.density == null ? 0.25 : o.density;
    const paper = o.paper == null ? 1 : o.paper;
    const ts = o.texScale == null ? 1 : o.texScale;
    const gx = o.gx || 0, gy = o.gy || 0;
    const aGain = o.alphaGain == null ? 0.6 : o.alphaGain;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const a = A[i];
        if (a < 0.004) continue;
        let e = a - B[i];
        if (e < 0) e = 0;
        const tx = x * ts + gx, ty = y * ts + gy;
        const g = T.grainAt(tx, ty);
        const bl = T.blotchAt(tx * 0.22, ty * 0.22);
        const sh = T.shadeAt(tx, ty);
        const k = (1 + edge * e * 2.4) * (1 + grain * (g - 0.5) * 0.9) * (1 + dens * (bl - 0.5) * 0.8);
        const lum = 1 + paper * 0.05 * sh;
        const j = i * 4;
        for (let c = 0; c < 3; c++) {
          let p = 1 - d[j + c] / 255;
          p *= k;
          if (p > 1) p = 1;
          d[j + c] = (1 - p) * 255 * lum;
        }
        // el grano solo «abre» el pigmento en zonas ya transparentes; el interior opaco se mantiene
        const na = a * (1 + aGain * e) * (a < 0.98 ? 1 + grain * 0.25 * (g - 0.5) : 1);
        d[j + 3] = (na > 1 ? 1 : na) * 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  // ------------------------------------------------------------ sprites
  // Un sprite es una pieza pintada una sola vez: {c, w, h, ox, oy} en unidades lógicas.
  function makeSprite(o, draw) {
    const res = o.res || 1;
    const c = U.makeCanvas(o.w * res, o.h * res, !!o.post || !!o.read);
    const ctx = c.ctx;
    ctx.setTransform(res, 0, 0, res, o.ox * res, o.oy * res);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    draw(ctx);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (o.post) watercolorize(c, Object.assign({ radius: 2.2 * res }, o.post));
    return { c, w: o.w, h: o.h, ox: o.ox, oy: o.oy, res };
  }

  function drawSprite(ctx, s, x, y) {
    ctx.drawImage(s.c, x - s.ox, y - s.oy, s.w, s.h);
  }

  // ------------------------------------------------------------ papel recortado (HUD, menús)
  function tornPoly(x, y, w, h, seed, rough = 3) {
    const rng = U.makeRng(seed);
    const pts = [];
    const edgeN = (len) => Math.max(4, Math.round(len / 9));
    const side = (ax, ay, bx, by) => {
      const n = edgeN(Math.hypot(bx - ax, by - ay));
      for (let i = 0; i < n; i++) {
        const t = i / n;
        const nx = -(by - ay), ny = bx - ax;
        const l = Math.hypot(nx, ny) || 1;
        const j = (U.noise1(i * 0.7 + seed, seed) - 0.5) * 2 * rough + rng.gauss() * rough * 0.25;
        pts.push([ax + (bx - ax) * t + (nx / l) * j, ay + (by - ay) * t + (ny / l) * j]);
      }
    };
    side(x, y, x + w, y);
    side(x + w, y, x + w, y + h);
    side(x + w, y + h, x, y + h);
    side(x, y + h, x, y);
    return pts;
  }

  const patternCache = new WeakMap();
  function paperPattern(ctx) {
    let p = patternCache.get(ctx);
    if (!p) { p = JHS.Tex.pattern(ctx); patternCache.set(ctx, p); }
    return p;
  }

  // Trozo de papel con sombra suave y borde rasgado (como las etiquetas de la lámina).
  function paperScrap(ctx, x, y, w, h, o = {}) {
    const poly = tornPoly(x, y, w, h, o.seed || 1, o.rough == null ? 2.6 : o.rough);
    ctx.save();
    ctx.globalAlpha = (o.alpha == null ? 1 : o.alpha) * 0.22;
    ctx.fillStyle = P.inkSoft;
    ctx.translate(2, 4);
    fillPoly(ctx, poly);
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    ctx.fillStyle = paperPattern(ctx);
    fillPoly(ctx, poly);
    if (o.tint) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = o.tint;
      ctx.globalAlpha *= 0.35;
      fillPoly(ctx, poly);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = (o.alpha == null ? 1 : o.alpha) * 0.35;
    ctx.strokeStyle = U.darken(P.paperDeep, 0.25);
    ctx.lineWidth = 1;
    pathPoly(ctx, poly, true);
    ctx.stroke();
    ctx.restore();
    return poly;
  }

  // Puntos de una curva cuadrática / cúbica (para mechones, cuerdas, ramas).
  function quadPts(x0, y0, cx, cy, x1, y1, n = 10) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      out.push([u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]);
    }
    return out;
  }

  function cubicPts(p0, p1, p2, p3, n = 14) {
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      out.push([
        u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
        u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
      ]);
    }
    return out;
  }

  // Recorta al polígono y ejecuta fn (para sombrear o texturizar dentro de una forma).
  function within(ctx, poly, fn) {
    ctx.save();
    pathPoly(ctx, poly, true);
    ctx.clip();
    fn();
    ctx.restore();
  }

  // Escala global del grosor de tinta (cada familia de piezas fija la suya al pintarse).
  function withInk(k, fn) {
    const prev = JHS.Paint.inkScale;
    JHS.Paint.inkScale = k;
    try { return fn(); } finally { JHS.Paint.inkScale = prev; }
  }

  JHS.Paint = {
    inkScale: 1, withInk,
    deform, pathPoly, fillPoly, wash, shade, glaze, ink, bristles, splatter, softBlob,
    watercolorize, makeSprite, drawSprite, tornPoly, paperScrap, paperPattern, quadPts, cubicPts, within,
  };
})(window.JHS = window.JHS || {});
