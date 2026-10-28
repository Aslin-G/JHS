/* Texturas base: el papel de algodón y los campos de ruido que gobiernan la granulación.
   El mismo relieve del papel decide dónde se asienta el pigmento (valles = más pigmento),
   así la textura nace del soporte y no es un filtro puesto encima (Biblia §4, §5.3). */
(function (JHS) {
  'use strict';
  const U = JHS.U;

  const PS = 512; // lado del campo de papel
  const BS = 256; // lado del campo de manchas

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
      const coarse = U.makeField(PS, 16, 3, seed, 0.5);
      const fine = U.makeField(PS, 96, 2, seed + 9, 0.55);
      const H = new Float32Array(PS * PS);
      for (let i = 0; i < H.length; i++) H[i] = coarse[i] * 0.3 + fine[i] * 0.7;
      // Normalizar
      let mn = Infinity, mx = -Infinity;
      for (let i = 0; i < H.length; i++) { if (H[i] < mn) mn = H[i]; if (H[i] > mx) mx = H[i]; }
      for (let i = 0; i < H.length; i++) H[i] = (H[i] - mn) / (mx - mn);
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
    blotchAt(x, y) { return this.blotch[((y | 0) & (BS - 1)) * BS + ((x | 0) & (BS - 1))]; },

    pattern(ctx) {
      return ctx.createPattern(this.paper, 'repeat');
    },
  };

  Tex.PS = PS;
  Tex.BS = BS;
  JHS.Tex = Tex;
})(window.JHS = window.JHS || {});
