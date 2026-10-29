/* Capas de parallax (§17) pintadas en lienzos troceados.
   Cada capa tiene un factor p: 0 = pegada a la pantalla, 1 = mundo, >1 = primerísimo plano.
   Las capas de fondo se pintan en «espacio S»: el punto S coincide con la pantalla cuando la
   cámara está en su posición inicial C0, así cada fondo se compone como una ilustración. */
(function (JHS) {
  'use strict';
  const U = JHS.U;

  const C0 = { x: 960, y: 675 };
  const CAM_RANGE = { x0: 960, x1: 9300, y0: -140, y1: 720, zMin: 0.68 };

  // Cada mundo fija su punto de composición C0 (la cámara al empezar) y el recorrido de la cámara.
  function setFrame(c0, range) {
    Object.assign(C0, c0);
    Object.assign(CAM_RANGE, range);
  }

  function layerZoom(p, z) { return 1 + (z - 1) * p; }

  // Rectángulo visible en espacio S para la cámara dada.
  function viewRectS(p, cam) {
    const zL = layerZoom(p, cam.z);
    const cx = 960 + (cam.x - C0.x) * p, cy = 540 + (cam.y - C0.y) * p;
    return { x0: cx - 960 / zL, y0: cy - 540 / zL, x1: cx + 960 / zL, y1: cy + 540 / zL, zL };
  }

  // Extensión que una capa necesita cubrir durante todo el nivel.
  function boundsFor(p, margin = 40) {
    const zL = layerZoom(p, CAM_RANGE.zMin);
    return {
      x0: 960 + (CAM_RANGE.x0 - C0.x) * p - 960 / zL - margin,
      x1: 960 + (CAM_RANGE.x1 - C0.x) * p + 960 / zL + margin,
      y0: 540 + (CAM_RANGE.y0 - C0.y) * p - 540 / zL - margin,
      y1: 540 + (CAM_RANGE.y1 - C0.y) * p + 540 / zL + margin,
    };
  }

  class Layer {
    constructor(o) {
      this.name = o.name;
      this.p = o.p;
      this.q = o.q || 1;              // píxeles por unidad
      this.chunk = o.chunk || 1024;   // tamaño del trozo en unidades
      const b = o.bounds || boundsFor(o.p);
      this.x0 = b.x0; this.y0 = b.y0; this.x1 = b.x1; this.y1 = b.y1;
      this.world = !!o.world;
      this.chunks = new Map();
    }
    key(i, j) { return i + ',' + j; }
    get(i, j, create) {
      const k = this.key(i, j);
      let c = this.chunks.get(k);
      if (!c && create) {
        const x = this.x0 + i * this.chunk, y = this.y0 + j * this.chunk;
        const w = Math.min(this.chunk, this.x1 - x), h = Math.min(this.chunk, this.y1 - y);
        if (w <= 0 || h <= 0) return null;
        const cv = U.makeCanvas(w * this.q, h * this.q);
        c = { i, j, x, y, w, h, c: cv, ctx: cv.ctx };
        this.chunks.set(k, c);
      }
      return c;
    }
    // Llama fn(ctx) en cada trozo que toca la caja, con la transformación de capa ya puesta.
    // fn debe ser determinista: se ejecuta una vez por trozo. `has(x0, y0, x1, y1)` permite
    // saltarse los trozos donde no hay nada que pintar (así no se crean lienzos vacíos).
    paint(box, fn, has) {
      const i0 = Math.max(0, Math.floor((box.x - this.x0) / this.chunk));
      const i1 = Math.floor((box.x + box.w - this.x0) / this.chunk);
      const j0 = Math.max(0, Math.floor((box.y - this.y0) / this.chunk));
      const j1 = Math.floor((box.y + box.h - this.y0) / this.chunk);
      for (let i = i0; i <= i1; i++) {
        for (let j = j0; j <= j1; j++) {
          const cx = this.x0 + i * this.chunk, cy = this.y0 + j * this.chunk;
          if (has && !has(cx, cy, cx + this.chunk, cy + this.chunk)) continue;
          const c = this.get(i, j, true);
          if (!c) continue;
          const ctx = c.ctx;
          ctx.save();
          ctx.setTransform(this.q, 0, 0, this.q, -c.x * this.q, -c.y * this.q);
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          fn(ctx);
          ctx.restore();
        }
      }
    }
    stamp(spr, x, y, o = {}) {
      const sx = o.sx || 1, sy = o.sy || 1;
      const box = { x: x - spr.ox * Math.abs(sx), y: y - spr.oy * sy, w: spr.w * Math.abs(sx), h: spr.h * sy };
      const has = o.sparse && sx === 1 && sy === 1 ? occupancy(spr, box) : null;
      this.paint(box, (ctx) => {
        if (o.alpha != null) ctx.globalAlpha = o.alpha;
        if (o.blend) ctx.globalCompositeOperation = o.blend;
        ctx.translate(x, y);
        ctx.scale(sx, sy);
        ctx.drawImage(spr.c, -spr.ox, -spr.oy, spr.w, spr.h);
      }, has);
    }
    // Dibuja los trozos visibles. El llamador ya fijó la transformación del espacio de capa.
    render(ctx, rect) {
      for (const c of this.chunks.values()) {
        if (c.x > rect.x1 || c.x + c.w < rect.x0 || c.y > rect.y1 || c.y + c.h < rect.y0) continue;
        ctx.drawImage(c.c, c.x, c.y, c.w + 0.6, c.h + 0.6);
      }
    }
    memory() {
      let px = 0;
      for (const c of this.chunks.values()) px += c.c.width * c.c.height;
      return px;
    }
  }

  // Rejilla de ocupación de un sprite (bloques de 16 px con algo de pigmento), para no crear
  // trozos de capa donde el sprite es transparente.
  function occupancy(spr, box) {
    const W = spr.c.width, H = spr.c.height, B = 16;
    const d = spr.c.ctx.getImageData(0, 0, W, H).data;
    const gw = Math.ceil(W / B), gh = Math.ceil(H / B);
    const grid = new Uint8Array(gw * gh);
    for (let y = 0; y < H; y++) {
      const row = (y / B | 0) * gw, base = y * W * 4 + 3;
      for (let x = 0; x < W; x++) if (d[base + x * 4]) grid[row + (x / B | 0)] = 1;
    }
    const ppu = W / spr.w;
    return (x0, y0, x1, y1) => {
      const i0 = Math.max(0, Math.floor(((x0 - box.x) * ppu) / B)), i1 = Math.min(gw - 1, Math.floor(((x1 - box.x) * ppu) / B));
      const j0 = Math.max(0, Math.floor(((y0 - box.y) * ppu) / B)), j1 = Math.min(gh - 1, Math.floor(((y1 - box.y) * ppu) / B));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (grid[j * gw + i]) return true;
      return false;
    };
  }

  // Pinta una composición grande una sola vez en un lienzo temporal y la reparte en trozos.
  // `post` (opcional) aplica el secado de acuarela a toda la composición.
  function paintOnce(layer, box, fn, post) {
    // grano del papel alineado con la capa: dos piezas vecinas comparten la misma textura y no
    // dejan costura donde se tocan
    if (post) {
      const ts = (post.texScale || 1) * layer.q;
      post = Object.assign({}, post, { gx: (post.gx || 0) + box.x * ts, gy: (post.gy || 0) + box.y * ts });
    }
    const spr = JHS.Paint.makeSprite({ w: box.w, h: box.h, ox: -box.x, oy: -box.y, res: layer.q, read: true, post }, fn);
    layer.stamp(spr, 0, 0, { sparse: true });
  }

  // Transformación de pantalla para una capa (multiplicada por la escala del lienzo).
  function applyLayer(ctx, base, p, cam) {
    const r = viewRectS(p, cam);
    const zL = r.zL;
    const ox = 960 - ((r.x0 + r.x1) / 2) * zL, oy = 540 - ((r.y0 + r.y1) / 2) * zL;
    ctx.setTransform(base.s * zL, 0, 0, base.s * zL, base.ox + ox * base.s, base.oy + oy * base.s);
    return r;
  }

  function applyWorld(ctx, base, cam) {
    const z = cam.z;
    ctx.setTransform(base.s * z, 0, 0, base.s * z, base.ox + (960 - cam.x * z) * base.s, base.oy + (540 - cam.y * z) * base.s);
    return { x0: cam.x - 960 / z, y0: cam.y - 540 / z, x1: cam.x + 960 / z, y1: cam.y + 540 / z, zL: z };
  }

  // Punto de una capa (espacio S) a pantalla lógica.
  function layerToScreen(p, cam, sx, sy) {
    const r = viewRectS(p, cam);
    return [(sx - (r.x0 + r.x1) / 2) * r.zL + 960, (sy - (r.y0 + r.y1) / 2) * r.zL + 540];
  }

  JHS.Layers = { C0, CAM_RANGE, setFrame, Layer, boundsFor, viewRectS, applyLayer, applyWorld, layerToScreen, layerZoom, paintOnce };
})(window.JHS = window.JHS || {});
