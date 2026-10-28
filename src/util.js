/* Camino de montaña al amanecer — utilidades: matemáticas, azar con semilla, ruido y color.
   Todos los módulos se registran en el espacio de nombres global JHS para poder abrir
   index.html directamente (file://) sin servidor ni compilación. */
(function (JHS) {
  'use strict';

  const TAU = Math.PI * 2;

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const invLerp = (a, b, v) => (b === a ? 0 : (v - a) / (b - a));
  const smooth = (t) => t * t * (3 - 2 * t);
  const smoothstep = (a, b, v) => smooth(clamp(invLerp(a, b, v), 0, 1));
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const easeOut = (t) => 1 - (1 - t) * (1 - t);
  const easeIn = (t) => t * t;
  const approach = (v, target, step) => (v < target ? Math.min(v + step, target) : Math.max(v - step, target));
  // Suavizado exponencial independiente del framerate.
  const damp = (v, target, rate, dt) => target + (v - target) * Math.exp(-rate * dt);

  // ---------------------------------------------------------------- azar
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeRng(seed) {
    const r = mulberry32(seed);
    let spare = null;
    return {
      next: r,
      range: (a, b) => a + (b - a) * r(),
      int: (a, b) => a + Math.floor(r() * (b - a + 1)),
      chance: (p) => r() < p,
      pick: (arr) => arr[Math.floor(r() * arr.length)],
      gauss() {
        if (spare !== null) { const s = spare; spare = null; return s; }
        let u = 0, v = 0;
        while (u === 0) u = r();
        v = r();
        const m = Math.sqrt(-2 * Math.log(u));
        spare = m * Math.sin(TAU * v);
        return m * Math.cos(TAU * v);
      },
    };
  }

  // ---------------------------------------------------------------- ruido
  function hash2(i, j, seed) {
    let h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(seed, 982451653)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }

  function noise2(x, y, seed = 0) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed);
    const c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  function noise1(x, seed = 0) {
    const xi = Math.floor(x), xf = x - xi;
    const u = xf * xf * (3 - 2 * xf);
    const a = hash2(xi, 0, seed), b = hash2(xi + 1, 0, seed);
    return a + (b - a) * u;
  }

  function fbm1(x, oct = 4, seed = 0) {
    let s = 0, amp = 0.5, f = 1, n = 0;
    for (let o = 0; o < oct; o++) { s += amp * noise1(x * f, seed + o * 31); n += amp; amp *= 0.5; f *= 2; }
    return s / n;
  }

  function fbm2(x, y, oct = 4, seed = 0) {
    let s = 0, amp = 0.5, f = 1, n = 0;
    for (let o = 0; o < oct; o++) { s += amp * noise2(x * f, y * f, seed + o * 17); n += amp; amp *= 0.5; f *= 2; }
    return s / n;
  }

  // Ruido de valor periódico (para texturas que se repiten sin costuras).
  function tileNoise(x, y, period, seed) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const x0 = ((xi % period) + period) % period, y0 = ((yi % period) + period) % period;
    const x1 = (x0 + 1) % period, y1 = (y0 + 1) % period;
    const a = hash2(x0, y0, seed), b = hash2(x1, y0, seed);
    const c = hash2(x0, y1, seed), d = hash2(x1, y1, seed);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  // Campo escalar periódico normalizado a [0,1].
  function makeField(size, basePeriod, octaves, seed, persistence = 0.5) {
    const f = new Float32Array(size * size);
    let amp = 1, period = basePeriod;
    for (let o = 0; o < octaves; o++) {
      const k = period / size;
      for (let y = 0; y < size; y++) {
        const row = y * size;
        for (let x = 0; x < size; x++) f[row + x] += amp * tileNoise(x * k, y * k, period, seed + o * 101);
      }
      amp *= persistence;
      period *= 2;
    }
    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i < f.length; i++) { if (f[i] < mn) mn = f[i]; if (f[i] > mx) mx = f[i]; }
    const k = 1 / (mx - mn || 1);
    for (let i = 0; i < f.length; i++) f[i] = (f[i] - mn) * k;
    return f;
  }

  // Desenfoque de caja separable sobre un Float32Array (w×h), repetido `passes` veces.
  function boxBlur(src, w, h, r, passes = 2) {
    r = Math.max(1, Math.round(r));
    let a = new Float32Array(src), b = new Float32Array(src.length);
    const inv = 1 / (2 * r + 1);
    for (let p = 0; p < passes; p++) {
      for (let y = 0; y < h; y++) {
        const row = y * w;
        let acc = 0;
        for (let i = -r; i <= r; i++) acc += a[row + clamp(i, 0, w - 1)];
        for (let x = 0; x < w; x++) {
          b[row + x] = acc * inv;
          acc += a[row + Math.min(x + r + 1, w - 1)] - a[row + Math.max(x - r, 0)];
        }
      }
      for (let x = 0; x < w; x++) {
        let acc = 0;
        for (let i = -r; i <= r; i++) acc += b[clamp(i, 0, h - 1) * w + x];
        for (let y = 0; y < h; y++) {
          a[y * w + x] = acc * inv;
          acc += b[Math.min(y + r + 1, h - 1) * w + x] - b[Math.max(y - r, 0) * w + x];
        }
      }
    }
    return a;
  }

  // ---------------------------------------------------------------- color
  const rgbCache = new Map();
  function hexToRgb(hex) {
    let c = rgbCache.get(hex);
    if (c) return c;
    let h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16);
    c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    rgbCache.set(hex, c);
    return c;
  }
  const toHex = (r, g, b) =>
    '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  function mix(a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    return toHex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t));
  }
  function rgba(hex, a) {
    const c = hexToRgb(hex);
    return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  }
  // Oscurece hacia un tono frío (como añadir una veladura de sombra) o aclara hacia el papel.
  const darken = (hex, t, toward = '#2a1c22') => mix(hex, toward, t);
  const lighten = (hex, t, toward = '#fbf5e8') => mix(hex, toward, t);

  // ---------------------------------------------------------------- geometría
  function polyLength(pts) {
    let L = 0;
    for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return L;
  }

  // Remuestrea una polilínea a pasos aproximadamente constantes.
  function resample(pts, step, closed = false) {
    const src = closed ? pts.concat([pts[0]]) : pts;
    const out = [src[0].slice()];
    let carry = 0;
    for (let i = 1; i < src.length; i++) {
      const ax = src[i - 1][0], ay = src[i - 1][1], bx = src[i][0], by = src[i][1];
      const seg = Math.hypot(bx - ax, by - ay);
      if (seg === 0) continue;
      let d = step - carry;
      while (d <= seg) {
        const t = d / seg;
        out.push([ax + (bx - ax) * t, ay + (by - ay) * t]);
        d += step;
      }
      carry = seg - (d - step);
    }
    const last = src[src.length - 1];
    const o = out[out.length - 1];
    if (!closed && (o[0] !== last[0] || o[1] !== last[1])) out.push(last.slice());
    if (closed && out.length > 1) {
      const f = out[0], l = out[out.length - 1];
      if (Math.hypot(f[0] - l[0], f[1] - l[1]) < step * 0.5) out.pop();
    }
    return out;
  }

  // Curva de Catmull-Rom a través de puntos (para siluetas orgánicas).
  function spline(pts, segs = 8, closed = false) {
    const out = [];
    const n = pts.length;
    const get = (i) => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
    const last = closed ? n : n - 1;
    for (let i = 0; i < last; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      for (let s = 0; s < segs; s++) {
        const t = s / segs, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
        ]);
      }
    }
    if (!closed) out.push(pts[n - 1].slice());
    return out;
  }

  // Elipse irregular (piedras, nubes, copas) como polígono.
  function blobPoly(cx, cy, rx, ry, n, rng, irregular = 0.12, rot = 0) {
    const pts = [];
    const ph = rng.next() * 100;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const k = 1 + irregular * (noise1(Math.cos(a) * 1.3 + ph, 7) * 2 - 1) + irregular * 0.5 * (rng.next() - 0.5);
      const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
      pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
    }
    return pts;
  }

  function bbox(pts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of pts) {
      if (p[0] < x0) x0 = p[0];
      if (p[1] < y0) y0 = p[1];
      if (p[0] > x1) x1 = p[0];
      if (p[1] > y1) y1 = p[1];
    }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  function makeCanvas(w, h, readback = false) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    c.ctx = c.getContext('2d', readback ? { willReadFrequently: true } : undefined);
    return c;
  }

  const nextFrame = () => new Promise((res) => requestAnimationFrame(() => res()));

  JHS.U = {
    TAU, clamp, lerp, invLerp, smooth, smoothstep, easeInOut, easeOut, easeIn, approach, damp,
    mulberry32, makeRng, hash2, noise1, noise2, fbm1, fbm2, tileNoise, makeField, boxBlur,
    hexToRgb, toHex, mix, rgba, darken, lighten,
    polyLength, resample, spline, blobPoly, bbox, makeCanvas, nextFrame,
  };
})(window.JHS = window.JHS || {});
