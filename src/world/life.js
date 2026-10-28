/* Vida del paisaje: detalles animados que no son del juego pero hacen que el mundo respire.
   Una cascada que cae por la pared del desfiladero, humo en las chimeneas del pueblo y
   ventanas que titilan, sombras de nubes que cruzan las colinas, polillas alrededor de los
   faroles encendidos y destellos de rocío sobre la hierba al sol. */
(function (JHS) {
  'use strict';
  const U = JHS.U, P = JHS.Palette, Paint = JHS.Paint;

  const Life = { t: 0, spr: {}, glints: [], falls: [] };

  // ------------------------------------------------------------------ preparación
  Life.init = function (L, world) {
    Life.L = L; Life.world = world;
    Life.t = 0;
    Life.glints = [];
    const S = JHS.Scenery;
    // cascadas que caen desde la cresta de la pared del fondo del desfiladero
    Life.falls = [];
    if (S.gorgeRidge) {
      for (const [x, w0, w1, k] of [[3290, 18, 44, 1], [3655, 8, 18, 0.5]]) {
        Life.falls.push({ x, top: S.gorgeRidge(x) + 4, w0, w1, k, bottom: S.BOTTOM });
      }
    }
    // textura de agua que cae: hebras verticales claras, repetible en vertical
    Life.spr.water = Paint.makeSprite({ w: 64, h: 256, ox: 0, oy: 0, res: 1, post: { edge: 0.25, grain: 0.3, density: 0.05 } }, (g) => {
      const rng = U.makeRng(2101);
      for (let i = 0; i < 26; i++) {
        const x = rng.range(2, 62), y = rng.range(0, 256), len = rng.range(40, 140), w = rng.range(1, 3.2);
        const col = rng.pick(['#ffffff', '#eef4f2', '#dfe9e8', '#cfdcdc']);
        for (const dy of [0, -256, 256]) {
          Paint.ink(g, [[x, y + dy], [x + rng.range(-1.5, 1.5), y + dy + len * 0.5], [x + rng.range(-2, 2), y + dy + len]], { w, alpha: rng.range(0.35, 0.8), color: col, seed: 2110 + i, taper: 0.7, wobble: 0.3 });
        }
      }
    });
    Life.spr.puff = Paint.makeSprite({ w: 64, h: 64, ox: 32, oy: 32, res: 1 }, (g) => Paint.softBlob(g, 0, 0, 30, '#f7f1e6', 1));
    Life.spr.smoke = Paint.makeSprite({ w: 32, h: 32, ox: 16, oy: 16, res: 1 }, (g) => Paint.softBlob(g, 0, 0, 15, '#9f99ac', 1));
    Life.spr.shadow = Paint.makeSprite({ w: 128, h: 128, ox: 64, oy: 64, res: 0.5 }, (g) => Paint.softBlob(g, 0, 0, 62, '#58566c', 1));
    Life.spr.glow = Paint.makeSprite({ w: 32, h: 32, ox: 16, oy: 16, res: 1 }, (g) => Paint.softBlob(g, 0, 0, 15, '#ffe2a0', 1));
  };

  Life.update = function (dt, cam) {
    Life.t += dt;
    // destellos de rocío: aparecen en la hierba iluminada cerca de la cámara
    for (let i = Life.glints.length - 1; i >= 0; i--) {
      const g = Life.glints[i];
      g.t += dt;
      if (g.t > g.life) Life.glints.splice(i, 1);
    }
    if (Life.glints.length < 10 && Math.random() < dt * 4) {
      const hw = 960 / cam.z;
      const x = cam.x + (Math.random() * 2 - 1) * hw;
      const gy = Life.world.groundY(x);
      if (gy != null) Life.glints.push({ x, y: gy + U.lerp(-12, 3, Math.random()), t: 0, life: 0.5 + Math.random() * 0.5, s: 0.7 + Math.random() * 0.6 });
    }
  };

  // ------------------------------------------------------------------ dibujo
  // Capa media (espacio S): humo de chimeneas y ventanas encendidas del Pueblo de las Luces.
  Life.drawVillage = function (ctx, r) {
    const v = JHS.Scenery.village;
    if (!v || r.x1 < 2950 || r.x0 > 3600) return;
    const t = Life.t, wind = JHS.Ambient.wind || 0.6;
    ctx.save();
    for (const [cx, cy, ph] of v.chimneys) {
      const N = 7, period = 7;
      for (let k = 0; k < N; k++) {
        const age = (t + ph * period + k * (period / N)) % period, a = age / period;
        const x = cx + age * (1.6 + wind * 1.4) + Math.sin(age * 1.4 + ph * 9) * 1.6 * a;
        const y = cy - age * 6.5;
        const s = 2.4 + age * 1.9;
        ctx.globalAlpha = 0.5 * U.smoothstep(0, 0.08, a) * (1 - a) * (1 - a * 0.4);
        ctx.drawImage(Life.spr.smoke.c, x - s, y - s, s * 2, s * 2);
      }
    }
    ctx.globalCompositeOperation = 'screen';
    for (const [x, y, ph] of v.windows) {
      const f = 0.6 + 0.25 * Math.sin(t * (1.3 + ph * 2) + ph * 20) + 0.15 * Math.sin(t * 7.1 + ph * 40);
      ctx.globalAlpha = 0.55 * f;
      ctx.drawImage(Life.spr.glow.c, x - 6, y - 6, 12, 12);
    }
    ctx.restore();
  };

  // Capa de colinas (espacio S): sombras de nubes que se deslizan despacio.
  const HILL_KEYS = [[-250, 690], [400, 650], [900, 700], [1500, 640], [2100, 690], [2700, 660], [3300, 720], [3800, 780], [4500, 860], [6300, 900]];
  function keyY(keys, x) {
    if (x <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (x <= keys[i][0]) return U.lerp(keys[i - 1][1], keys[i][1], (x - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]));
    return keys[keys.length - 1][1];
  }
  Life.drawCloudShadows = function (ctx, r) {
    if (JHS.G && JHS.G.reduced) return;
    const t = Life.t, span = 2600;
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    for (let i = 0; i < 3; i++) {
      const base = r.x0 - 700 + ((i * 940 + t * (11 + i * 3)) % span);
      const y = keyY(HILL_KEYS, base) + 110 + i * 26;
      const rx = 380 + i * 90, ry = 58 + i * 8;
      ctx.globalAlpha = 0.16;
      ctx.drawImage(Life.spr.shadow.c, base - rx, y - ry, rx * 2, ry * 2);
    }
    ctx.restore();
  };

  // Mundo, tras el plano jugable: la cascada (por delante de la pared del fondo, por detrás
  // del puente y los personajes). El chorro es una columna de manchas blandas (sin borde duro)
  // con hebras de agua que caen a dos velocidades; la bruma del fondo se lo come al bajar.
  Life.drawFalls = function (ctx, r) {
    const t = Life.t, W = Life.spr.water, puff = Life.spr.puff;
    for (const f of Life.falls) {
      if (f.x + 80 < r.x0 || f.x - 80 > r.x1) continue;
      const y0 = f.top, y1 = Math.min(f.bottom, r.y1 + 20);
      if (y1 <= y0) continue;
      const H = f.bottom - y0;
      const width = (y) => U.lerp(f.w0, f.w1, Math.pow(U.clamp((y - y0) / H, 0, 1), 0.6));
      const sway = (y) => Math.sin(y * 0.02 + t * 0.8) * 1.5 + (y - y0) * 0.025;
      // depth: 1 arriba → 0 en la bruma
      const depth = (y) => 1 - U.smoothstep(y0 + 60, y0 + 420, y);
      ctx.save();
      for (const [wk, a, col] of [[2.4, 0.07, '#f6f1e8'], [1.35, 0.16, '#dfe8e6'], [0.75, 0.22, '#f4f7f4']]) {
        for (let y = y0 + 6; y < y1; y += 9) {
          const w = width(y) * wk, d = depth(y);
          if (d <= 0.02) continue;
          ctx.globalAlpha = a * f.k * (0.35 + 0.65 * d);
          ctx.drawImage(puff.c, f.x + sway(y) - w / 2, y - w / 2, w, w);
        }
      }
      ctx.restore();
      // hebras que caen, recortadas al cuerpo del chorro
      ctx.save();
      ctx.beginPath();
      for (let y = y0; y <= y1 + 12; y += 12) ctx.lineTo(f.x + sway(y) - width(y) * 0.42, y);
      for (let y = Math.ceil((y1 + 12 - y0) / 12) * 12 + y0; y >= y0; y -= 12) ctx.lineTo(f.x + sway(y) + width(y) * 0.42, y);
      ctx.closePath();
      ctx.clip();
      for (const [sp, a, dx, sc] of [[150, 0.6, 0, 1], [230, 0.4, 21, 0.8]]) {
        const off = (t * sp) % (W.h * sc);
        ctx.globalAlpha = a * f.k;
        for (let y = y0 - W.h * sc + off; y < y1; y += W.h * sc) {
          for (let x = f.x - f.w1 / 2 - 10 + dx * 0.3; x < f.x + f.w1 / 2 + 10; x += W.w * 0.75) {
            ctx.drawImage(W.c, x + sway(y) - dx * 0.2, y, W.w * 0.75, W.h * sc);
          }
        }
      }
      const mg = ctx.createLinearGradient(0, y0 + 80, 0, y0 + 460);
      mg.addColorStop(0, 'rgba(240,231,216,0)');
      mg.addColorStop(1, 'rgba(240,231,216,0.9)');
      ctx.globalAlpha = 1;
      ctx.fillStyle = mg;
      ctx.fillRect(f.x - f.w1, y0 + 80, f.w1 * 2, H);
      ctx.restore();
      // espuma donde el agua salta la cresta
      ctx.save();
      for (let k = 0; k < 5; k++) {
        const ph = (t * 0.55 + k / 5) % 1;
        const x = f.x + Math.sin(k * 2.1 + t * 0.7) * f.w0 * 0.45, y = y0 + 2 + ph * 22;
        const s = (5 + ph * 12) * (0.6 + f.k * 0.4);
        ctx.globalAlpha = 0.5 * (1 - ph) * f.k;
        ctx.drawImage(puff.c, x - s, y - s, s * 2, s * 2);
      }
      ctx.globalAlpha = 0.5 * f.k;
      ctx.strokeStyle = '#fbfaf5';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(f.x, y0 + 2, f.w0 * 0.55, 3, 0, Math.PI, U.TAU);
      ctx.stroke();
      ctx.restore();
    }
  };

  // Mundo, por delante: polillas en los faroles encendidos y destellos de rocío.
  Life.drawFront = function (ctx, r, items) {
    const t = Life.t;
    if (items) {
      for (const l of items.lanterns) {
        if (!l.lit || l.x < r.x0 - 100 || l.x > r.x1 + 100) continue;
        const gy = Life.world.groundY(l.x);
        const lx = l.x + 28, ly = gy - 126;
        for (let k = 0; k < 2; k++) {
          const ph = t * (2.3 + k * 0.7) + k * 2 + l.x;
          const x = lx + Math.cos(ph) * (20 + k * 6) + Math.sin(ph * 2.7) * 4;
          const y = ly + Math.sin(ph * 1.3) * 13 - 4 + Math.cos(ph * 3.1) * 3;
          const fl = Math.abs(Math.sin(t * 38 + k * 5));
          ctx.save();
          ctx.translate(x, y);
          ctx.globalAlpha = 0.9 * l.glow;
          ctx.fillStyle = '#efe3c8';
          ctx.strokeStyle = P.inkSoft;
          ctx.lineWidth = 0.4;
          for (const s of [-1, 1]) {
            ctx.beginPath();
            ctx.ellipse(s * 1.6 * (0.4 + fl * 0.6), -0.6, 1.9 * (0.4 + fl * 0.6), 1.3, s * 0.5, 0, U.TAU);
            ctx.fill(); ctx.stroke();
          }
          ctx.restore();
        }
      }
    }
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const g of Life.glints) {
      if (g.x < r.x0 || g.x > r.x1) continue;
      const k = Math.sin(Math.PI * (g.t / g.life));
      const s = 5 * g.s * k;
      ctx.globalAlpha = 0.75 * k;
      ctx.drawImage(Life.spr.glow.c, g.x - s, g.y - s, s * 2, s * 2);
      ctx.strokeStyle = '#fffaf0';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(g.x - s * 1.4, g.y); ctx.lineTo(g.x + s * 1.4, g.y);
      ctx.moveTo(g.x, g.y - s * 1.4); ctx.lineTo(g.x, g.y + s * 1.4);
      ctx.stroke();
    }
    ctx.restore();
  };

  JHS.Life = Life;
})(window.JHS = window.JHS || {});
