/* Vida del paisaje: detalles animados que no son del juego pero hacen que el mundo respire.
   Cascadas, humo de chimeneas y ventanas que titilan, sombras de nubes que cruzan las colinas,
   polillas alrededor de los faroles encendidos y destellos de rocío sobre la hierba al sol.
   Cada mundo dice qué tiene y en qué capa está (`Life.init(world, cfg)`). */
(function (JHS) {
  'use strict';
  const U = JHS.U, P = JHS.Palette, Paint = JHS.Paint;

  const Life = { t: 0, spr: {}, glints: [], falls: [], smoke: [], windows: [], cfg: {} };

  // ------------------------------------------------------------------ preparación
  // cfg: { falls: [{x, top, bottom, w0, w1, k, layer, mist}], chimneys: [{x, y, layer, s, k}],
  //        windows: [{x, y, ph, layer, k}], cloudShadows: {keys, layer, alpha, dy}, glints }
  Life.init = function (world, cfg = {}) {
    Life.world = world;
    Life.cfg = cfg;
    Life.t = 0;
    Life.glints = [];
    Life.falls = (cfg.falls || []).map((f) => Object.assign({ layer: 'play', k: 1, mist: 0.9 }, f));
    Life.smoke = (cfg.chimneys || []).map((c, i) => Object.assign({ layer: 'mid', s: 1, k: 1, next: i * 0.37, puffs: [], rng: U.makeRng(4100 + i) }, c));
    Life.windows = (cfg.windows || []).map((w) => Object.assign({ layer: 'mid', k: 1 }, w));
    if (Life.spr.water) return;
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
    if (Life.cfg.glints !== false && Life.glints.length < 10 && Math.random() < dt * 4) {
      const hw = 960 / cam.z;
      const x = cam.x + (Math.random() * 2 - 1) * hw;
      const gy = Life.world.groundY(x);
      if (gy != null) Life.glints.push({ x, y: gy + U.lerp(-12, 3, Math.random()), t: 0, life: 0.5 + Math.random() * 0.5, s: 0.7 + Math.random() * 0.6 });
    }
    // humo doméstico: bocanadas de baja opacidad a intervalos irregulares (sin bucle visible)
    const wind = (JHS.Ambient && JHS.Ambient.wind) || 0.5;
    for (const c of Life.smoke) {
      c.next -= dt;
      if (c.next <= 0) {
        const r = c.rng;
        c.puffs.push({ x: c.x + r.range(-0.6, 0.6) * c.s, y: c.y, age: 0, life: r.range(5.5, 9.5), s0: r.range(0.8, 1.3), ph: r.range(0, 6.28), vy: r.range(-7.5, -5) });
        c.next = r.chance(0.12) ? r.range(2.5, 4.5) : r.range(0.45, 1.6);
      }
      for (let i = c.puffs.length - 1; i >= 0; i--) {
        const p = c.puffs[i];
        p.age += dt;
        if (p.age > p.life) { c.puffs.splice(i, 1); continue; }
        p.x += (1.2 + wind * 2.4 + Math.sin(p.age * 0.9 + p.ph) * 0.8) * c.s * dt;
        p.y += p.vy * c.s * dt;
      }
    }
  };

  // ------------------------------------------------------------------ dibujo
  // Humo de las chimeneas de una capa (en su espacio de capa).
  Life.drawSmoke = function (ctx, layer, r) {
    if (!Life.smoke.length) return;
    ctx.save();
    for (const c of Life.smoke) {
      if (c.layer !== layer || c.x < r.x0 - 200 || c.x > r.x1 + 200) continue;
      for (const p of c.puffs) {
        const a = p.age / p.life;
        const s = (2.4 + p.age * 1.9) * p.s0 * c.s;
        ctx.globalAlpha = 0.34 * c.k * U.smoothstep(0, 0.06, a) * (1 - a) * (1 - a * 0.4);
        ctx.drawImage(Life.spr.smoke.c, p.x - s, p.y - s, s * 2, s * 2);
      }
    }
    ctx.restore();
  };

  // Ventanas encendidas que titilan (más tenues cuanto más lejos: `k`).
  Life.drawWindows = function (ctx, layer, r) {
    if (!Life.windows.length) return;
    const t = Life.t;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const w of Life.windows) {
      if (w.layer !== layer || w.x < r.x0 - 20 || w.x > r.x1 + 20) continue;
      const f = 0.6 + 0.25 * Math.sin(t * (1.3 + w.ph * 2) + w.ph * 20) + 0.15 * Math.sin(t * 7.1 + w.ph * 40);
      const s = 6 * (w.s || 1);
      ctx.globalAlpha = 0.55 * f * w.k;
      ctx.drawImage(Life.spr.glow.c, w.x - s, w.y - s, s * 2, s * 2);
    }
    ctx.restore();
  };

  function keyY(keys, x) {
    if (x <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (x <= keys[i][0]) return U.lerp(keys[i - 1][1], keys[i][1], (x - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]));
    return keys[keys.length - 1][1];
  }

  // Sombras de nubes que se deslizan despacio sobre las colinas.
  Life.drawCloudShadows = function (ctx, layer, r) {
    const cs = Life.cfg.cloudShadows;
    if (!cs || cs.layer !== layer || (JHS.G && JHS.G.reduced)) return;
    const t = Life.t, span = 2600;
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    for (let i = 0; i < 3; i++) {
      const base = r.x0 - 700 + ((i * 940 + t * (11 + i * 3)) % span);
      const y = keyY(cs.keys, base) + (cs.dy || 110) + i * 26;
      const rx = 380 + i * 90, ry = 58 + i * 8;
      ctx.globalAlpha = cs.alpha || 0.16;
      ctx.drawImage(Life.spr.shadow.c, base - rx, y - ry, rx * 2, ry * 2);
    }
    ctx.restore();
  };

  // Cascadas de una capa. El chorro es una columna de manchas blandas (sin borde duro) con hebras
  // de agua que caen a dos velocidades; la bruma de abajo se lo come al bajar.
  Life.drawFalls = function (ctx, layer, r) {
    const t = Life.t, W = Life.spr.water, puff = Life.spr.puff;
    for (const f of Life.falls) {
      if (f.layer !== layer || f.x + 80 < r.x0 || f.x - 80 > r.x1) continue;
      const y0 = f.top, y1 = Math.min(f.bottom, r.y1 + 20);
      if (y1 <= y0) continue;
      const H = f.bottom - y0;
      const sc = f.scale || 1;
      const width = (y) => U.lerp(f.w0, f.w1, Math.pow(U.clamp((y - y0) / H, 0, 1), 0.6));
      const sway = (y) => Math.sin(y * 0.02 / sc + t * 0.8) * 1.5 * sc + (y - y0) * 0.025;
      // depth: 1 arriba → 0 en la bruma
      const fade = f.fade || 420 * sc;
      const depth = (y) => 1 - U.smoothstep(y0 + 60 * sc, y0 + fade, y);
      ctx.save();
      for (const [wk, a] of [[2.4, 0.07], [1.35, 0.16], [0.75, 0.22]]) {
        for (let y = y0 + 6 * sc; y < y1; y += 9 * sc) {
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
      for (const [sp, a, dx, k] of [[150, 0.6, 0, 1], [230, 0.4, 21, 0.8]]) {
        const hh = W.h * k * sc, ww = W.w * 0.75 * sc;
        const off = (t * sp * sc) % hh;
        ctx.globalAlpha = a * f.k;
        for (let y = y0 - hh + off; y < y1; y += hh) {
          for (let x = f.x - f.w1 / 2 - 10 + dx * 0.3 * sc; x < f.x + f.w1 / 2 + 10; x += ww) {
            ctx.drawImage(W.c, x + sway(y) - dx * 0.2 * sc, y, ww, hh);
          }
        }
      }
      if (f.mist) {
        const mg = ctx.createLinearGradient(0, y0 + 80 * sc, 0, y0 + fade + 40 * sc);
        mg.addColorStop(0, U.rgba(f.mistColor || '#f0e7d8', 0));
        mg.addColorStop(1, U.rgba(f.mistColor || '#f0e7d8', f.mist));
        ctx.globalAlpha = 1;
        ctx.fillStyle = mg;
        ctx.fillRect(f.x - f.w1, y0 + 80 * sc, f.w1 * 2, H);
      }
      ctx.restore();
      // espuma donde el agua salta la cresta
      ctx.save();
      for (let k = 0; k < 5; k++) {
        const ph = (t * 0.55 + k / 5) % 1;
        const x = f.x + Math.sin(k * 2.1 + t * 0.7) * f.w0 * 0.45, y = y0 + (2 + ph * 22) * sc;
        const s = (5 + ph * 12) * (0.6 + f.k * 0.4) * sc;
        ctx.globalAlpha = 0.5 * (1 - ph) * f.k;
        ctx.drawImage(puff.c, x - s, y - s, s * 2, s * 2);
      }
      ctx.globalAlpha = 0.5 * f.k;
      ctx.strokeStyle = '#fbfaf5';
      ctx.lineWidth = 1.4 * sc;
      ctx.beginPath();
      ctx.ellipse(f.x, y0 + 2 * sc, f.w0 * 0.55, 3 * sc, 0, Math.PI, U.TAU);
      ctx.stroke();
      ctx.restore();
    }
  };

  // Mundo, por delante: polillas alrededor de los faroles encendidos y destellos de rocío.
  // lamps: [{x, y, glow}] (centro del farol).
  Life.drawFront = function (ctx, r, lamps) {
    const t = Life.t;
    for (const l of lamps || []) {
      if (l.glow < 0.05 || l.x < r.x0 - 100 || l.x > r.x1 + 100) continue;
      for (let k = 0; k < 2; k++) {
        const ph = t * (2.3 + k * 0.7) + k * 2 + l.x;
        const x = l.x + Math.cos(ph) * (20 + k * 6) + Math.sin(ph * 2.7) * 4;
        const y = l.y + Math.sin(ph * 1.3) * 13 - 4 + Math.cos(ph * 3.1) * 3;
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
