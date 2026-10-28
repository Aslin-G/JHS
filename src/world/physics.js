/* Física estilizada (§63–§65): control inmediato, salto claro y nada flotante (más gravedad al
   caer, salto variable, tiempo de gracia y búfer de salto), escalera, empujar y un puente de
   cuerdas que se hunde bajo el peso. Sin ragdoll ni deformaciones excesivas. */
(function (JHS) {
  'use strict';
  const U = JHS.U;

  const K = {
    walk: 150, run: 300, accel: 1700, accelRun: 1300, decel: 2300, airAccel: 1300,
    gUp: 2350, gDown: 3700, jumpV: 930, jumpCut: 0.45, maxFall: 1300,
    coyote: 0.1, buffer: 0.13, hw: 13, height: 138, stepUp: 16, snapDown: 26,
    climb: 125, push: 66,
  };

  function World(L) {
    this.L = L;
    this.segs = L.ground;
    // paredes: escalones verticales y bordes de barranco
    this.walls = [];
    for (const seg of this.segs) {
      for (let i = 1; i < seg.length; i++) {
        const a = seg[i - 1], b = seg[i];
        if (Math.abs(b[0] - a[0]) < 2) this.walls.push({ x: a[0], yTop: Math.min(a[1], b[1]), yBot: Math.max(a[1], b[1]), solidRight: b[1] < a[1] });
      }
      const f = seg[0], l = seg[seg.length - 1];
      this.walls.push({ x: f[0], yTop: f[1], yBot: 99999, solidRight: true });
      this.walls.push({ x: l[0], yTop: l[1], yBot: 99999, solidRight: false });
    }
    this.solids = L.rocks.map((r) => ({ x: r.x, y: r.y, w: r.w, h: r.h, kind: 'rock' }));
    this.ledges = L.ledges.map((l) => Object.assign({}, l));
    this.ladders = L.ladders;
    this.pushables = L.pushables.map((p) => ({ x: p.x, w: p.w, h: p.h, stopX: p.stopX, minX: p.x - 260, y: 0, vx: 0, moving: 0, kind: 'push' }));
    for (const p of this.pushables) p.y = this.groundY(p.x + p.w / 2) - p.h;
    const B = L.bridge;
    this.bridge = { x0: B.x0, x1: B.x1, y0: B.y0, y1: B.y1, sag: B.sag, holes: B.holes, load: 0, loadT: 0.5, disp: 0, dispV: 0, sheepT: -1 };
  }

  World.prototype.groundY = function (x) {
    for (const seg of this.segs) {
      if (x < seg[0][0] || x > seg[seg.length - 1][0]) continue;
      for (let i = 1; i < seg.length; i++) {
        const a = seg[i - 1], b = seg[i];
        if (b[0] - a[0] < 1) continue;
        if (x >= a[0] && x < b[0]) return U.lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0]));
      }
      const l = seg[seg.length - 1];
      if (Math.abs(x - l[0]) < 0.001) return l[1];
    }
    return null;
  };

  // Superficie del puente en x (con el hundimiento actual). null en los huecos de tablas.
  World.prototype.bridgeY = function (x, ignoreHoles) {
    const b = this.bridge;
    if (x < b.x0 || x > b.x1) return null;
    if (!ignoreHoles) for (const [h0, h1] of b.holes) if (x > h0 && x < h1) return null;
    const t = (x - b.x0) / (b.x1 - b.x0);
    const base = U.lerp(b.y0, b.y1, t) + 12 * Math.sin(Math.PI * t);
    // carga puntual: forma de cuerda tensa con el vértice bajo el peso
    const tl = b.loadT;
    const shape = t < tl ? t / tl : (1 - t) / (1 - tl);
    return base + b.disp * U.smooth(U.clamp(shape, 0, 1)) * Math.sin(Math.PI * tl);
  };

  World.prototype.updateBridge = function (dt, loads) {
    const b = this.bridge;
    let total = 0, wt = 0;
    for (const [x, w] of loads) {
      if (x > b.x0 && x < b.x1) { total += w; wt += w * (x - b.x0) / (b.x1 - b.x0); }
    }
    if (total > 0) b.loadT = U.damp(b.loadT, U.clamp(wt / total, 0.04, 0.96), 12, dt);
    const target = b.sag * Math.min(1.3, total);
    b.dispV += ((target - b.disp) * 60 - b.dispV * 7) * dt;
    b.disp += b.dispV * dt;
  };

  World.prototype.ladderAt = function (x, y) {
    for (const l of this.ladders) if (Math.abs(x - l.x) < 22 && y > l.top - 4 && y <= l.bottom + 2) return l;
    return null;
  };

  function boxHit(ax0, ay0, ax1, ay1, bx0, by0, bx1, by1) {
    return ax0 < bx1 && ax1 > bx0 && ay0 < by1 && ay1 > by0;
  }

  // ------------------------------------------------------------------ controlador de la niña
  function Body(x, y) {
    this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.grounded = true; this.surface = 'ground'; this.facing = 1;
    this.coyote = 0; this.buffer = 0; this.jumpHeld = false;
    this.climbing = null; this.pushing = null; this.mode = 'ground';
    this.lastSafe = { x, y };
    this.airT = 0; this.landed = false; this.landV = 0;
  }

  // inp: {x: -1..1, up, down, jump(pressed), jumpHeld, run, locked}
  function step(w, b, inp, dt) {
    b.landed = false;
    const prevY = b.y;
    const wasGrounded = b.grounded;
    b.buffer = inp.jump ? K.buffer : Math.max(0, b.buffer - dt);
    b.coyote = b.grounded ? K.coyote : Math.max(0, b.coyote - dt);

    // ---- escalera
    if (b.climbing) {
      const l = b.climbing;
      b.x = U.damp(b.x, l.x, 18, dt);
      b.vx = 0;
      const dir = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
      b.vy = dir * K.climb;
      b.y += b.vy * dt;
      b.mode = 'climb';
      if (b.y <= l.top) {
        // arriba: bajarse sobre la cornisa
        b.y = l.top;
        b.climbing = null;
        b.x = l.x + 34;
        b.grounded = true; b.vy = 0; b.surface = 'ground'; b.facing = 1;
        b.mode = 'ground';
        return;
      }
      if (b.y >= l.bottom && dir > 0) { b.y = l.bottom; b.climbing = null; b.grounded = true; b.mode = 'ground'; return; }
      if (b.buffer > 0) {
        b.climbing = null; b.buffer = 0;
        b.vy = -K.jumpV * 0.75; b.vx = (inp.x || b.facing) * K.walk; b.grounded = false; b.mode = 'air';
      }
      return;
    }
    if (!inp.locked && !b.pushing) {
      if (inp.up) {
        const l = w.ladderAt(b.x, b.y);
        if (l && b.y > l.top + 6) { b.climbing = l; b.vx = 0; b.vy = 0; b.grounded = false; b.mode = 'climb'; return; }
      } else if (inp.down && b.grounded) {
        // bajar desde arriba: la escalera asoma junto al borde
        for (const l of w.ladders) {
          if (Math.abs(b.x - l.x) < 46 && Math.abs(b.y - l.top) < 8) {
            b.climbing = l; b.y = l.top + 8; b.vx = 0; b.vy = 0; b.grounded = false; b.mode = 'climb'; return;
          }
        }
      }
    }

    // ---- horizontal
    const want = inp.locked ? 0 : inp.x;
    const top = inp.run ? K.run : K.walk;
    let target = want * top;
    if (b.pushing) target = want * K.push;
    const acc = b.grounded ? (want === 0 ? K.decel : (inp.run ? K.accelRun : K.accel)) : K.airAccel;
    b.vx = U.approach(b.vx, target, acc * dt);
    if (want !== 0) b.facing = want > 0 ? 1 : -1;
    let nx = b.x + b.vx * dt;

    // paredes de terreno
    const headY = b.y - K.height;
    for (const wl of w.walls) {
      if (b.y <= wl.yTop + K.stepUp || headY >= wl.yBot) continue;
      if (wl.solidRight && b.vx > 0 && b.x + K.hw <= wl.x + 0.5 && nx + K.hw > wl.x) { nx = wl.x - K.hw; b.vx = 0; }
      if (!wl.solidRight && b.vx < 0 && b.x - K.hw >= wl.x - 0.5 && nx - K.hw < wl.x) { nx = wl.x + K.hw; b.vx = 0; }
    }
    // sólidos (rocas y bloque empujable)
    b.pushing = null;
    const solids = w.solids.concat(w.pushables);
    for (const s of solids) {
      if (!boxHit(nx - K.hw, b.y - K.height, nx + K.hw, b.y - 0.5, s.x, s.y + 6, s.x + s.w, s.y + s.h)) continue;
      if (b.y <= s.y + K.stepUp) continue; // se sube al escalón por arriba
      if (b.x <= s.x + s.w / 2) {
        if (s.kind === 'push' && b.grounded && want > 0) push(w, s, b, dt, 1);
        nx = s.x - K.hw;
      } else {
        if (s.kind === 'push' && b.grounded && want < 0) push(w, s, b, dt, -1);
        nx = s.x + s.w + K.hw;
      }
      if (!b.pushing) b.vx = 0;
    }
    nx = U.clamp(nx, w.L.bounds.left + K.hw, w.L.bounds.right - K.hw);
    b.x = nx;

    // ---- salto
    if (!inp.locked && b.buffer > 0 && (b.grounded || b.coyote > 0)) {
      b.vy = -K.jumpV;
      b.grounded = false; b.coyote = 0; b.buffer = 0;
      b.jumpHeld = true;
      b.pushing = null;
    }
    if (b.jumpHeld && !inp.jumpHeld && b.vy < 0) { b.vy *= K.jumpCut; b.jumpHeld = false; }
    if (b.vy >= 0) b.jumpHeld = false;

    // ---- vertical
    if (!b.grounded) {
      b.vy += (b.vy < 0 ? K.gUp : K.gDown) * dt;
      if (b.vy > K.maxFall) b.vy = K.maxFall;
    }
    let ny = b.y + (b.grounded ? 0 : b.vy * dt);
    let landY = null, landKind = null;
    // techo de sólidos
    if (b.vy < 0) {
      for (const s of solids) {
        if (b.x + K.hw * 0.7 > s.x && b.x - K.hw * 0.7 < s.x + s.w && ny - K.height < s.y + s.h && prevY - K.height >= s.y + s.h - 2) {
          ny = s.y + s.h + K.height; b.vy = 0;
        }
      }
    }
    const consider = (y, kind) => {
      if (y == null) return;
      if (b.grounded) {
        // pegarse a la pendiente o a la plataforma sobre la que se camina
        if (y >= b.y - K.stepUp && y <= b.y + K.snapDown && (landY == null || y < landY)) { landY = y; landKind = kind; }
      } else if (b.vy >= 0 && prevY <= y + 3 && ny >= y) {
        if (landY == null || y < landY) { landY = y; landKind = kind; }
      }
    };
    consider(w.groundY(b.x), 'ground');
    for (const s of solids) if (b.x > s.x - 4 && b.x < s.x + s.w + 4) consider(s.y, s.kind === 'push' ? 'push' : 'rock');
    for (const l of w.ledges) if (b.x >= l.x0 && b.x <= l.x1) consider(l.y, l.kind);
    consider(w.bridgeY(b.x), 'bridge');

    if (landY != null) {
      if (!wasGrounded) { b.landed = true; b.landV = b.vy; }
      b.y = landY;
      b.vy = 0;
      b.grounded = true;
      b.surface = landKind;
      b.airT = 0;
      if (landKind === 'ground' || landKind === 'rock' || landKind === 'push') b.lastSafe = { x: b.x, y: b.y };
    } else {
      b.y = ny;
      b.grounded = false;
      b.airT += dt;
    }
    b.mode = b.climbing ? 'climb' : b.pushing ? 'push' : b.grounded ? 'ground' : 'air';
  }

  function push(w, s, b, dt, dir) {
    const v = K.push * dir;
    let nx = s.x + v * dt;
    nx = U.clamp(nx, s.minX, s.stopX - s.w);
    s.moving = Math.abs(nx - s.x) > 0.01 ? dir : 0;
    s.x = nx;
    const gy = w.groundY(s.x + s.w / 2);
    if (gy != null) s.y = gy - s.h;
    b.pushing = s;
    b.vx = s.moving ? v : 0;
  }

  JHS.Physics = { K, World, Body, step };
})(window.JHS = window.JHS || {});
