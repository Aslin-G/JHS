/* Texturas base: el papel de algodón y los campos de ruido que gobiernan la granulación.
   El mismo relieve del papel decide dónde se asienta el pigmento (valles = más pigmento),
   así la textura nace del soporte y no es un filtro puesto encima (Biblia §4, §5.3). */
(function (JHS) {
  'use strict';
  const U = JHS.U;

  const PS = 512; // lado del campo de papel
  const BS = 256; // lado del campo de manchas

  // Desenfoque de caja sobre un toro (los bordes se dan la mano: la textura se repite sin costura).
  function wrapBlur(src, size, r, passes) {
    const m = size - 1, inv = 1 / (2 * r + 1);
    let a = new Float32Array(src), b = new Float32Array(src.length);
    for (let p = 0; p < passes; p++) {
      for (let y = 0; y < size; y++) {
        const row = y * size;
        let s = 0;
        for (let k = -r; k <= r; k++) s += a[row + (k & m)];
        for (let x = 0; x < size; x++) {
          b[row + x] = s * inv;
          s += a[row + ((x + r + 1) & m)] - a[row + ((x - r) & m)];
        }
      }
      for (let x = 0; x < size; x++) {
        let s = 0;
        for (let k = -r; k <= r; k++) s += b[(k & m) * size + x];
        for (let y = 0; y < size; y++) {
          a[y * size + x] = s * inv;
          s += b[((y + r + 1) & m) * size + x] - b[((y - r) & m) * size + x];
        }
      }
    }
    return a;
  }

  // Lleva un campo a una media y desviación dadas.
  function standardize(f, mean, sd) {
    let m = 0;
    for (let i = 0; i < f.length; i++) m += f[i];
    m /= f.length;
    let v = 0;
    for (let i = 0; i < f.length; i++) v += (f[i] - m) * (f[i] - m);
    const k = sd / (Math.sqrt(v / f.length) || 1);
    const out = new Float32Array(f.length);
    for (let i = 0; i < f.length; i++) out[i] = (f[i] - m) * k + mean;
    return out;
  }

  // Diente del papel: ruido blanco difuminado a dos escalas. Es isótropo, como las fibras
  // prensadas; el ruido de valor en rejilla dejaba celdas cuadradas visibles en los pigmentos densos.
  function tooth(size, seed) {
    const rng = U.makeRng(seed);
    const w = new Float32Array(size * size);
    for (let i = 0; i < w.length; i++) w[i] = rng.next();
    const micro = standardize(wrapBlur(w, size, 1, 2), 0, 1), medium = standardize(wrapBlur(w, size, 2, 3), 0, 1);
    const f = new Float32Array(w.length);
    for (let i = 0; i < f.length; i++) f[i] = micro[i] * 0.35 + medium[i] * 0.65;
    return f;
  }

  const Tex = {
    ready: false,
    H: null,      // relieve del papel [0,1]
    shade: null,  // iluminación del relieve [-1,1]
    grain: null,  // dónde se deposita el pigmento [0,1]
    blotch: null, // irregularidad de carga de pigmento [0,1]
    paper: null,  // lienzo de papel listo para patrones
    paperPattern: null,

    init(seed = 7) {
      // Relieve: diente fino del papel prensado en frío (rasgos de 3–8 px) sobre una ondulación suave.
      const coarse = standardize(wrapBlur(U.makeField(PS, 16, 3, seed, 0.5), PS, 3, 2), 0, 1);
      const fine = tooth(PS, seed + 9);
      const mix = new Float32Array(PS * PS);
      for (let i = 0; i < mix.length; i++) mix[i] = coarse[i] * 0.3 + fine[i] * 0.7;
      // misma media y contraste que el papel anterior, recortado a [0,1]
      const H = standardize(mix, 0.476, 0.14);
      for (let i = 0; i < H.length; i++) H[i] = H[i] < 0 ? 0 : H[i] > 1 ? 1 : H[i];
      this.H = H;

      // Sombreado del relieve con luz rasante desde arriba a la derecha.
      const S = new Float32Array(PS * PS);
      for (let y = 0; y < PS; y++) {
        for (let x = 0; x < PS; x++) {
          const i = y * PS + x;
          const dx = H[y * PS + ((x + 1) & (PS - 1))] - H[y * PS + ((x - 1) & (PS - 1))];
          const dy = H[((y + 1) & (PS - 1)) * PS + x] - H[((y - 1) & (PS - 1)) * PS + x];
          S[i] = U.clamp((-dx * 0.7 + dy * 0.7) * 6, -1, 1);
        }
      }
      this.shade = S;

      const G = new Float32Array(PS * PS);
      for (let i = 0; i < G.length; i++) G[i] = U.smoothstep(0.15, 0.85, 1 - H[i]);
      this.grain = G;

      this.blotch = U.makeField(BS, 4, 3, seed + 40, 0.45);

      // Lienzo de papel (color crema con relieve y fibras sutiles).
      const c = U.makeCanvas(PS, PS, true);
      const img = c.ctx.createImageData(PS, PS);
      const base = U.hexToRgb(JHS.Palette.paper);
      const warm = U.hexToRgb(JHS.Palette.paperWarm);
      const tone = U.makeField(PS, 4, 3, seed + 3, 0.5);
      for (let i = 0; i < PS * PS; i++) {
        const t = tone[i] * 0.55;
        const l = 1 + S[i] * 0.022 - (1 - H[i]) * 0.018;
        img.data[i * 4] = U.lerp(base[0], warm[0], t) * l;
        img.data[i * 4 + 1] = U.lerp(base[1], warm[1], t) * l;
        img.data[i * 4 + 2] = U.lerp(base[2], warm[2], t) * l;
        img.data[i * 4 + 3] = 255;
      }
      c.ctx.putImageData(img, 0, 0);
      this.paper = c;

      // Máscara de granulación (negro con alfa) para veladuras en tiempo real.
      const g = U.makeCanvas(PS, PS);
      const gi = g.ctx.createImageData(PS, PS);
      for (let i = 0; i < PS * PS; i++) {
        gi.data[i * 4 + 3] = Math.round(Math.pow(G[i], 2.2) * 255);
      }
      g.ctx.putImageData(gi, 0, 0);
      this.grainMask = g;
      this.ready = true;
    },

    grainAt(x, y) { return this.grain[((y | 0) & (PS - 1)) * PS + ((x | 0) & (PS - 1))]; },
    shadeAt(x, y) { return this.shade[((y | 0) & (PS - 1)) * PS + ((x | 0) & (PS - 1))]; },
    // interpolado: se muestrea a escala reducida y sin interpolar dejaba escalones de 4–5 px
    blotchAt(x, y) {
      const B = this.blotch, m = BS - 1;
      const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
      const r0 = (y0 & m) * BS, r1 = ((y0 + 1) & m) * BS, c0 = x0 & m, c1 = (x0 + 1) & m;
      const a = B[r0 + c0] + (B[r0 + c1] - B[r0 + c0]) * fx;
      const b = B[r1 + c0] + (B[r1 + c1] - B[r1 + c0]) * fx;
      return a + (b - a) * fy;
    },

    pattern(ctx) {
      return ctx.createPattern(this.paper, 'repeat');
    },
  };

  Tex.PS = PS;
  Tex.BS = BS;
  JHS.Tex = Tex;
})(window.JHS = window.JHS || {});
