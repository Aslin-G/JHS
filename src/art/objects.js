/* Objetos de madera, luz y recompensas: escalera, cerca, letrero, banco, tablones del puente,
   tronco caído, poste del puente, roca empujable, farol (punto de control §69), cofre y
   semillas de luz (coleccionable §28). Madera con vetas, desgaste, clavos y manchas (§58). */
(function (JHS) {
  'use strict';
  const U = JHS.U, Paint = JHS.Paint, P = JHS.Palette, Props = JHS.Props;

  const RES = 1.25;
  const POST = { edge: 0.4, grain: 0.4, density: 0.15 };

  // Pieza de madera rectangular con vetas y clavos, en coordenadas locales.
  function plank(g, x, y, w, h, seed, o = {}) {
    const rng = U.makeRng(seed);
    const j = o.jitter == null ? 0.8 : o.jitter;
    const poly = [[x + rng.range(-j, j), y + rng.range(-j, j)], [x + w + rng.range(-j, j), y + rng.range(-j, j)],
      [x + w + rng.range(-j, j), y + h + rng.range(-j, j)], [x + rng.range(-j, j), y + h + rng.range(-j, j)]];
    const col = o.color || U.mix(P.wood, P.woodLight, rng.range(0, 0.5));
    Paint.wash(g, poly, col, { layers: 4, alpha: 0.3, amp: 0.4, seed, edge: 0.3, core: 1, vary: P.woodShade, varyAmt: 0.25 });
    Paint.within(g, poly, () => {
      const vertical = h > w;
      const len = vertical ? h : w, th = vertical ? w : h;
      for (let k = 0; k < Math.max(2, th / 3.2); k++) {
        const off = rng.range(0.15, 0.85) * th;
        const pts = [];
        for (let s = 0; s <= 8; s++) {
          const t = s / 8;
          const wob = Math.sin(t * 6 + k) * 0.6;
          pts.push(vertical ? [x + off + wob, y + t * len] : [x + t * len, y + off + wob]);
        }
        Paint.ink(g, pts, { w: 0.6, alpha: 0.35, color: P.woodShade, seed: seed + k, taper: 0.3, breaks: 0.4 });
      }
      Paint.shade(g, vertical ? [[x - 2, y - 2], [x + w * 0.38, y - 2], [x + w * 0.38, y + h + 2], [x - 2, y + h + 2]]
        : [[x - 2, y + h * 0.62], [x + w + 2, y + h * 0.62], [x + w + 2, y + h + 2], [x - 2, y + h + 2]], P.woodShade,
        { layers: 3, alpha: 0.2, amp: 1.5, seed: seed + 9, edge: 0 });
      Paint.splatter(g, x + w / 2, y + h / 2, w / 2, h / 2, (w * h) / 40, P.woodShade, { alpha: 0.35, rmin: 0.3, rmax: 0.8, seed: seed + 3 });
    });
    if (o.nails) {
      g.fillStyle = P.metal;
      for (const [nx, ny] of o.nails) { g.globalAlpha = 0.85; g.beginPath(); g.arc(nx, ny, 1.1, 0, U.TAU); g.fill(); }
      g.globalAlpha = 1;
    }
    Paint.ink(g, poly, { closed: true, w: o.inkW || 1.3, alpha: 0.85, seed: seed + 5, breaks: 0.12, sketch: 0.4 });
  }

  function ladder(top, bottom) {
    const h = bottom - top;
    return Paint.makeSprite({ w: 50, h: h + 16, ox: 25, oy: 6, res: RES, post: POST }, (g) => {
      plank(g, -17, -2, 6, h + 6, 601, { color: P.wood });
      plank(g, 11, -4, 6, h + 8, 602, { color: P.wood });
      for (let y = 14, k = 0; y < h; y += 26, k++) plank(g, -16, y, 32, 5.5, 610 + k, { nails: [[-14, y + 2.7], [14, y + 2.7]], inkW: 1.1 });
    });
  }

  function fence(len) {
    return Paint.makeSprite({ w: len + 30, h: 90, ox: 15, oy: 80, res: RES, post: POST }, (g) => {
      const posts = Math.max(2, Math.round(len / 95) + 1);
      for (let k = 0; k < 2; k++) plank(g, -6, -58 + k * 26, len + 12, 7, 620 + k, { nails: [] });
      for (let i = 0; i < posts; i++) {
        const x = (i / (posts - 1)) * len - 4;
        plank(g, x, -72 + (i % 2) * 3, 9, 74, 630 + i, { color: U.mix(P.wood, P.woodShade, 0.2), nails: [[x + 4.5, -55], [x + 4.5, -29]] });
      }
    });
  }

  function sign(text) {
    return Paint.makeSprite({ w: 150, h: 150, ox: 40, oy: 140, res: RES, post: POST }, (g) => {
      plank(g, -5, -128, 10, 130, 640, { color: U.mix(P.wood, P.woodShade, 0.25) });
      const board = [[-22, -122], [72, -124], [96, -106], [72, -88], [-22, -90]];
      Paint.wash(g, board, U.mix(P.wood, P.woodLight, 0.4), { layers: 4, alpha: 0.3, amp: 0.5, seed: 641, edge: 0.3, core: 1 });
      Paint.within(g, board, () => {
        for (let k = 0; k < 6; k++) Paint.ink(g, [[-22, -118 + k * 5], [80, -119 + k * 5.2]], { w: 0.6, alpha: 0.3, color: P.woodShade, seed: 642 + k, breaks: 0.4 });
        Paint.shade(g, [[-30, -100], [100, -100], [100, -84], [-30, -84]], P.woodShade, { layers: 3, alpha: 0.2, amp: 2, seed: 648, edge: 0 });
      });
      Paint.ink(g, board, { closed: true, w: 1.4, alpha: 0.88, seed: 649, breaks: 0.1, sketch: 0.4 });
      g.fillStyle = P.metal;
      g.beginPath(); g.arc(-12, -106, 1.3, 0, U.TAU); g.arc(62, -106, 1.3, 0, U.TAU); g.fill();
      // letras talladas
      g.font = 'italic 600 15px "Alegreya", Georgia, serif';
      g.fillStyle = U.mix(P.woodShade, P.ink, 0.4);
      g.globalAlpha = 0.85;
      g.fillText(text, -6, -101);
      g.globalAlpha = 1;
    });
  }

  function bench() {
    return Paint.makeSprite({ w: 170, h: 80, ox: 85, oy: 70, res: RES, post: POST }, (g) => {
      plank(g, -66, -40, 9, 42, 650, {});
      plank(g, 56, -40, 9, 42, 651, {});
      plank(g, -78, -46, 156, 9, 652, { nails: [[-62, -41.5], [60, -41.5]] });
      plank(g, -74, -62, 148, 7, 653, {});
      plank(g, -70, -62, 7, 18, 654, {});
      plank(g, 62, -62, 7, 18, 655, {});
    });
  }

  function bridgePlank(seed) {
    return Paint.makeSprite({ w: 30, h: 16, ox: 15, oy: 3, res: RES * 1.2, post: POST }, (g) => {
      plank(g, -12.5, -1, 25, 9, seed, { nails: [[-9.5, 3.5], [9.5, 3.5]], inkW: 1.1 });
    });
  }

  function bridgePost() {
    return Paint.makeSprite({ w: 40, h: 120, ox: 20, oy: 100, res: RES, post: POST }, (g) => {
      plank(g, -7, -92, 14, 112, 660, { color: U.mix(P.wood, P.woodShade, 0.3) });
      // nudos de cuerda
      for (const y of [-80, -10]) {
        Paint.wash(g, U.blobPoly(0, y, 9, 5, 9, U.makeRng(y), 0.2), U.mix(P.mantle, P.wood, 0.4), { layers: 3, alpha: 0.5, amp: 0.4, seed: 661 + y, edge: 0.3, core: 1 });
        for (let k = -2; k <= 2; k++) Paint.ink(g, [[-8, y + k * 2], [8, y + k * 2 + 1.5]], { w: 0.6, alpha: 0.5, seed: 665 + k + y, color: P.woodShade });
      }
    });
  }

  function log(len) {
    return Paint.makeSprite({ w: len + 40, h: 60, ox: 20, oy: 22, res: RES, post: POST }, (g) => {
      const body = U.spline([[-4, -14], [len * 0.3, -16], [len * 0.7, -15], [len + 2, -13], [len + 6, 0], [len + 2, 13], [len * 0.6, 15], [0, 14], [-6, 0]], 3, true);
      Paint.wash(g, body, P.wood, { layers: 5, alpha: 0.3, amp: 0.6, seed: 670, edge: 0.3, core: 1, vary: P.woodLight, varyAmt: 0.4 });
      Paint.within(g, body, () => {
        Paint.shade(g, [[-10, 2], [len + 10, 2], [len + 10, 20], [-10, 20]], P.woodShade, { layers: 4, alpha: 0.24, amp: 3, seed: 671, edge: 0 });
        for (let k = 0; k < 7; k++) {
          const y = -12 + k * 4;
          Paint.bristles(g, [[0, y], [len * 0.5, y + Math.sin(k) * 1.5], [len, y]], { n: 2, w: 2, color: P.woodShade, alpha: 0.45, seed: 672 + k, gaps: 0.45 });
        }
        Paint.wash(g, U.blobPoly(len * 0.3, -12, 30, 5, 10, U.makeRng(5), 0.3), P.moss, { layers: 3, alpha: 0.4, amp: 1, seed: 680, edge: 0.2 });
      });
      // corte del tronco con anillos
      const end = U.blobPoly(len + 2, 0, 6, 13.5, 12, U.makeRng(3), 0.08);
      Paint.wash(g, end, P.woodLight, { layers: 3, alpha: 0.45, amp: 0.3, seed: 681, edge: 0.3, core: 1 });
      for (let r = 3; r < 13; r += 3.4) {
        g.strokeStyle = P.woodShade; g.globalAlpha = 0.5; g.lineWidth = 0.7;
        g.beginPath(); g.ellipse(len + 2, 0, r * 0.45, r, 0, 0, U.TAU); g.stroke();
      }
      g.globalAlpha = 1;
      Paint.ink(g, body, { closed: true, w: 1.5, alpha: 0.88, seed: 682, breaks: 0.12, sketch: 0.5 });
      for (let i = 0; i < 2; i++) Paint.ink(g, [[len * (0.25 + i * 0.4), -15], [len * (0.25 + i * 0.4) - 6, -26], [len * (0.25 + i * 0.4) - 12, -30]], { w: 1.4, alpha: 0.8, seed: 683 + i, taper: 0.6 });
    });
  }

  // Roca que se puede empujar (§29 «mover»): un bloque irregular de aristas suaves apoyado en su
  // cara más ancha, con facetas iluminadas por el sol (arriba a la derecha). El punto de anclaje
  // es el centro de la base, y la cara superior es casi plana para poder subirse.
  function boulder(w, h) {
    const rng = U.makeRng(690);
    const hw = w / 2 + 4, H = h;
    const j = (v) => v + rng.range(-3.5, 3.5);
    // vértices en espacio centrado (y de -H/2 a +H/2)
    const c = (x, y) => [j(x), j(y - H / 2)];
    const verts = [c(-hw + 4, H - 2), c(-hw - 3, H * 0.6), c(-hw * 0.78, H * 0.16), c(-hw * 0.3, 1), c(hw * 0.28, -1), c(hw * 0.8, H * 0.12),
      c(hw + 3, H * 0.55), c(hw - 3, H - 3), c(hw * 0.3, H + 2), c(-hw * 0.4, H + 2)];
    const poly = U.spline(verts, 2, true);
    const rx = hw, ry = H / 2;
    return Paint.makeSprite({ w: hw * 2 + 44, h: H + 44, ox: hw + 22, oy: H + 18, res: RES, post: { edge: 0.45, grain: 0.5, density: 0.18 } }, (g) => {
      // sombra de contacto en el suelo
      Paint.shade(g, U.blobPoly(4, 1, hw * 1.08, 7, 14, rng, 0.12), '#5d4838', { layers: 5, alpha: 0.12, amp: 3, seed: 692, edge: 0 });
      g.save();
      g.translate(0, -H / 2);
      Props.paintRockShape(g, poly, rx, ry, 691, { cool: true, moss: true, warm: 0.35, inkW: 2.6 });
      // facetas: cara superior iluminada, cara izquierda en sombra, arista central entintada
      const ridge = [[-hw * 0.18, -H * 0.18], [hw * 0.22, -H * 0.12], [hw * 0.36, H * 0.32]];
      Paint.within(g, poly, () => {
        Paint.wash(g, [verts[2], verts[3], verts[4], verts[5], ridge[1], ridge[0]], '#efe0c2', { layers: 3, alpha: 0.32, amp: 2, seed: 693, edge: 0.1 });
        Paint.shade(g, [verts[0], verts[1], verts[2], ridge[0], [-hw * 0.1, H * 0.5]], P.rockShade, { layers: 3, alpha: 0.2, amp: 3, seed: 694, edge: 0 });
        g.strokeStyle = P.inkSoft; g.lineWidth = 0.8; g.globalAlpha = 0.3;
        g.beginPath();
        for (let k = 0; k < 9; k++) { const y = -H * 0.1 + k * H * 0.07; g.moveTo(-hw * 0.95, y); g.lineTo(-hw * 0.55, y + H * 0.1); }
        g.stroke();
        g.globalAlpha = 1;
      });
      Paint.ink(g, ridge, { w: 1.4, alpha: 0.55, seed: 695, taper: 0.5 });
      Paint.ink(g, [ridge[0], verts[2]], { w: 1.1, alpha: 0.45, seed: 696, taper: 0.5 });
      g.restore();
    });
  }

  // Farol de punto de control: poste, brazo y farol; apagado/encendido se pinta aparte.
  function lanternPost() {
    return Paint.makeSprite({ w: 70, h: 170, ox: 20, oy: 160, res: RES, post: POST }, (g) => {
      plank(g, -5, -150, 10, 152, 700, { color: U.mix(P.wood, P.woodShade, 0.25) });
      plank(g, -4, -146, 38, 7, 701, { nails: [[0, -142.5]] });
      Paint.ink(g, [[0, -120], [14, -140]], { w: 2.2, alpha: 0.85, color: P.woodShade, seed: 702 });
      // gancho
      g.strokeStyle = P.metal; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(28, -139); g.lineTo(28, -130); g.stroke();
      Paint.wash(g, U.blobPoly(0, 2, 16, 5, 10, U.makeRng(7), 0.3), P.grassDark, { layers: 3, alpha: 0.3, amp: 1, seed: 703, edge: 0 });
    });
  }

  function lanternLamp(lit) {
    return Paint.makeSprite({ w: 30, h: 44, ox: 15, oy: 4, res: RES * 1.4, post: { edge: 0.35, grain: 0.3, density: 0.1 } }, (g) => {
      const glass = [[-8, 6], [8, 6], [9, 26], [-9, 26]];
      Paint.wash(g, glass, lit ? '#ffd37a' : '#b9a98a', { layers: 4, alpha: 0.4, amp: 0.3, seed: lit ? 710 : 711, edge: 0.3, core: 1 });
      if (lit) {
        Paint.softBlob(g, 0, 17, 9, '#fff4cf', 0.9);
        Paint.softBlob(g, 0, 19, 4, '#ffffff', 0.9);
      } else {
        Paint.shade(g, [[-10, 6], [0, 6], [0, 27], [-10, 27]], P.inkGrey, { layers: 2, alpha: 0.2, amp: 0.5, seed: 712, edge: 0 });
      }
      // marco metálico
      g.strokeStyle = P.metal; g.lineWidth = 1.6; g.lineJoin = 'round';
      g.beginPath();
      g.moveTo(-9.5, 5); g.lineTo(9.5, 5); g.lineTo(10.5, 27); g.lineTo(-10.5, 27); g.closePath();
      g.moveTo(0, 5); g.lineTo(0, 27);
      g.stroke();
      const top = [[-11, 5], [0, -1], [11, 5]];
      Paint.wash(g, top, P.metal, { layers: 2, alpha: 0.7, amp: 0.2, seed: 713, edge: 0.2, core: 1 });
      Paint.wash(g, [[-12, 27], [12, 27], [10, 31], [-10, 31]], P.metal, { layers: 2, alpha: 0.7, amp: 0.2, seed: 714, edge: 0.2, core: 1 });
      g.beginPath(); g.arc(0, -1, 2.6, Math.PI, 0); g.stroke();
    });
  }

  function chest(open) {
    return Paint.makeSprite({ w: 90, h: 90, ox: 45, oy: 62, res: RES, post: POST }, (g) => {
      // cuerpo
      plank(g, -34, -30, 68, 30, 720, { color: P.wood, nails: [[-30, -6], [30, -6]] });
      for (const x of [-26, 20]) Paint.wash(g, [[x, -31], [x + 6, -31], [x + 6, 1], [x, 1]], P.metal, { layers: 3, alpha: 0.55, amp: 0.2, seed: 721 + x, edge: 0.2, core: 1 });
      if (open) {
        // interior con luz cálida y tapa levantada
        Paint.wash(g, [[-32, -32], [32, -32], [30, -26], [-30, -26]], '#2c1a0d', { layers: 2, alpha: 0.9, amp: 0.3, seed: 723, core: 1 });
        Paint.softBlob(g, 0, -34, 34, '#ffe3a1', 0.85);
        const lid = [[-35, -34], [35, -34], [33, -58], [-33, -58]];
        Paint.wash(g, lid, U.mix(P.wood, P.woodShade, 0.35), { layers: 4, alpha: 0.35, amp: 0.4, seed: 724, edge: 0.3, core: 1 });
        Paint.ink(g, lid, { closed: true, w: 1.3, alpha: 0.85, seed: 725, breaks: 0.1 });
      } else {
        const lid = U.spline([[-35, -30], [-34, -42], [-22, -51], [0, -54], [22, -51], [34, -42], [35, -30]], 4, false).concat([[35, -30]]);
        Paint.wash(g, lid, U.mix(P.wood, P.woodLight, 0.3), { layers: 4, alpha: 0.35, amp: 0.4, seed: 726, edge: 0.3, core: 1 });
        Paint.within(g, lid, () => {
          for (let k = 0; k < 4; k++) Paint.ink(g, [[-34, -34 - k * 5], [0, -38 - k * 5.4], [34, -34 - k * 5]], { w: 0.6, alpha: 0.35, color: P.woodShade, seed: 727 + k });
          for (const x of [-26, 20]) Paint.wash(g, [[x, -56], [x + 6, -56], [x + 6, -29], [x, -29]], P.metal, { layers: 3, alpha: 0.55, amp: 0.2, seed: 731 + x, edge: 0.2, core: 1 });
        });
        Paint.ink(g, lid, { closed: true, w: 1.4, alpha: 0.88, seed: 735, breaks: 0.1, sketch: 0.4 });
        // cerradura
        Paint.wash(g, [[-5, -34], [5, -34], [5, -24], [-5, -24]], '#b58d4a', { layers: 3, alpha: 0.7, amp: 0.2, seed: 736, edge: 0.3, core: 1 });
        g.fillStyle = P.ink; g.beginPath(); g.arc(0, -29.5, 1.2, 0, U.TAU); g.fill();
      }
      Paint.wash(g, U.blobPoly(0, 1, 42, 4, 12, U.makeRng(4), 0.2), '#7b6150', { layers: 3, alpha: 0.2, amp: 2, seed: 737, edge: 0, blend: 'multiply' });
    });
  }

  // Semilla de luz: almendra dorada con un brote, pintada con veladuras cálidas.
  function seed() {
    return Paint.makeSprite({ w: 34, h: 40, ox: 17, oy: 22, res: 2, post: { edge: 0.4, grain: 0.25, density: 0.05 } }, (g) => {
      const body = U.spline([[0, -12], [6.5, -6], [7.5, 3], [3.5, 10], [-3.5, 10], [-7.5, 3], [-6.5, -6]], 4, true);
      Paint.wash(g, body, P.gold, { layers: 5, alpha: 0.35, amp: 0.3, seed: 740, edge: 0.3, core: 1, vary: P.amber, varyAmt: 0.5 });
      Paint.within(g, body, () => {
        Paint.shade(g, [[-10, -14], [-1, -14], [-2, 12], [-10, 12]], P.amber, { layers: 3, alpha: 0.35, amp: 1, seed: 741, edge: 0 });
        Paint.softBlob(g, 2.6, -2, 4.5, '#fff2c2', 0.85);
      });
      Paint.ink(g, body, { closed: true, w: 1.1, alpha: 0.8, seed: 742 });
      Paint.ink(g, [[0, -9], [0.6, -2], [0, 6]], { w: 0.6, alpha: 0.5, seed: 743, color: P.inkWarm });
      // brote
      Paint.ink(g, [[0, -12], [1, -16], [3.5, -18]], { w: 1, alpha: 0.85, color: P.grassDark, seed: 744 });
      Paint.wash(g, [[3, -18], [8, -21], [7, -16.5]], P.grass, { layers: 2, alpha: 0.7, amp: 0.2, seed: 745, edge: 0.3, core: 1 });
    });
  }

  function page() {
    return Paint.makeSprite({ w: 40, h: 46, ox: 20, oy: 23, res: 2, post: { edge: 0.3, grain: 0.2, density: 0.05 } }, (g) => {
      const poly = Paint.tornPoly(-14, -17, 28, 34, 9, 1.2);
      g.fillStyle = Paint.paperPattern(g);
      Paint.fillPoly(g, poly);
      Paint.ink(g, poly, { closed: true, w: 0.9, alpha: 0.6, seed: 750 });
      for (let k = 0; k < 6; k++) Paint.ink(g, [[-9, -10 + k * 4.5], [9 - (k === 5 ? 8 : 0), -10 + k * 4.5]], { w: 0.6, alpha: 0.45, seed: 751 + k, breaks: 0.3 });
    });
  }

  JHS.Objects = { plank, ladder, fence, sign, bench, bridgePlank, bridgePost, log, boulder, lanternPost, lanternLamp, chest, seed, page };
})(window.JHS = window.JHS || {});
