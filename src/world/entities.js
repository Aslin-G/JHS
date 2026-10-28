/* Entidades del nivel: la oveja que acompaña (§30), el Pastor que guía sin resolver (§31),
   semillas de luz, faroles de control, el cofre con la página y el puente/roca dinámicos. */
(function (JHS) {
  'use strict';
  const U = JHS.U, P = JHS.Palette, Paint = JHS.Paint;

  // ------------------------------------------------------------------ la oveja
  // Sigue el rastro de la niña a cierta distancia; donde ella no puede ir (ramas, escalera)
  // espera, salta un atajo o usa su propio paso por la grieta.
  function SheepCtl(world, L, sheep) {
    this.w = world; this.L = L; this.s = sheep;
    this.trail = [];
    this.d = 0;              // distancia recorrida por la oveja sobre el rastro
    this.mode = 'trail';
    this.idleT = 0;
    this.lastOkY = null;
    this.hop = null;
    this.tun = null;
    this.hint = null;
  }
  const FOLLOW = 134;

  SheepCtl.prototype.reset = function (x, y) {
    this.trail = [{ x, y, ok: true, g: true, climb: false, d: 0, kind: 'ground' }];
    this.d = 0; this.mode = 'trail'; this.hop = null; this.tun = null;
    this.s.x = x; this.s.y = y; this.s.alpha = 1; this.s.scale = 1;
    this.lastOkY = y;
  };

  SheepCtl.prototype.record = function (b) {
    const T = this.trail;
    const last = T[T.length - 1];
    const dist = Math.hypot(b.x - last.x, b.y - last.y);
    if (dist < 5) return;
    const climb = !!b.climbing;
    let ok, g = b.grounded;
    if (climb) ok = false;
    else if (b.grounded) ok = b.surface !== 'branch';
    else ok = this.lastOkY != null && b.y > this.lastOkY - 175;
    if (b.grounded && ok) this.lastOkY = b.y;
    if (!ok) {
      // los puntos en el aire que llevan a un lugar prohibido tampoco valen
      for (let i = T.length - 1; i > 0 && !T[i].g && T[i].ok; i--) T[i].ok = false;
    }
    // Si la niña vuelve sobre sus pasos, se recorta el bucle del rastro: así la oveja no sigue
    // hasta el punto más lejano ni la atraviesa, sino que se aparta y la sigue de cerca.
    let cut = -1;
    for (let i = T.length - 2; i >= 0 && T[i].d >= this.d + 4; i--) {
      if (Math.abs(T[i].x - b.x) < 9 && Math.abs(T[i].y - b.y) < 14 && T[i].ok === ok) cut = i;
    }
    if (cut >= 0) {
      T.length = cut + 1;
      const c = T[cut];
      T.push({ x: b.x, y: b.y, ok, g, climb, d: c.d + Math.hypot(b.x - c.x, b.y - c.y), kind: b.grounded ? b.surface : 'air' });
      return;
    }
    T.push({ x: b.x, y: b.y, ok, g, climb, d: last.d + dist, kind: b.grounded ? b.surface : 'air' });
    // podar lo muy antiguo
    if (T.length > 2400) {
      const cut = T.findIndex((p) => p.d > this.d - 200);
      if (cut > 50) T.splice(0, cut - 10);
    }
  };

  SheepCtl.prototype.indexAt = function (d) {
    const T = this.trail;
    let lo = 0, hi = T.length - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (T[m].d < d) lo = m + 1; else hi = m; }
    return lo;
  };

  SheepCtl.prototype.pointAt = function (d) {
    const T = this.trail;
    const i = this.indexAt(d);
    if (i === 0) return { x: T[0].x, y: T[0].y, i: 0 };
    const a = T[i - 1], b = T[i];
    const t = b.d > a.d ? U.clamp((d - a.d) / (b.d - a.d), 0, 1) : 1;
    return { x: U.lerp(a.x, b.x, t), y: U.lerp(a.y, b.y, t), i, kind: b.kind };
  };

  // La niña la llama: se despierta, bala y acude deprisa.
  SheepCtl.prototype.call = function () {
    this.hurry = 4;
    this.idleT = 0;
    this.bleatIn = 0.45;
    if (this.s.anim === 'sleep' || this.s.anim === 'eat') JHS.Sheep.setAnim(this.s, 'idle');
  };

  SheepCtl.prototype.update = function (dt, girl, ctx) {
    const s = this.s, T = this.trail, Sheep = JHS.Sheep;
    const head = T[T.length - 1].d;
    const target = Math.max(0, head - FOLLOW);
    this.hurry = Math.max(0, (this.hurry || 0) - dt);
    if (this.bleatIn > 0) { this.bleatIn -= dt; if (this.bleatIn <= 0) { Sheep.bleat(s); if (JHS.Sound) JHS.Sound.play('bleat'); } }
    let moving = 0;
    const px = s.x, py = s.y;

    if (this.mode === 'hop') {
      const h = this.hop;
      h.t = Math.min(h.dur, h.t + dt);
      const k = h.t / h.dur;
      s.x = U.lerp(h.x0, h.x1, k);
      s.y = U.lerp(h.y0, h.y1, k) - h.h * 4 * k * (1 - k);
      s.facing = h.x1 >= h.x0 ? 1 : -1;
      if (h.t >= h.dur) { this.mode = 'trail'; this.d = h.d1; }
      s.vy = (s.y - py) / Math.max(dt, 1e-3);
      Sheep.setAnim(s, h.h > 18 ? 'jump' : 'walk');
      s.speed = 160;
    } else if (this.mode === 'tunnel') {
      this.updateTunnel(dt);
    } else {
      // seguir el rastro
      if (this.d < target - 1) {
        const gap = target - this.d;
        const v = U.clamp(gap * 2.1, 70, gap > 420 ? 520 : 350) * (this.hurry > 0 ? 1.5 : 1);
        let nd = Math.min(target, this.d + v * dt);
        const i0 = this.indexAt(this.d), i1 = this.indexAt(nd);
        let blocked = -1;
        for (let i = i0; i <= i1 && i < T.length; i++) if (!T[i].ok) { blocked = i; break; }
        if (blocked >= 0) {
          // buscar el siguiente punto apoyado y permitido después del tramo prohibido
          let j = blocked, climb = false;
          while (j < T.length && !(T[j].ok && T[j].g)) { if (T[j].climb) climb = true; j++; }
          let k0 = blocked - 1;
          while (k0 > 0 && !T[k0].g) k0--;
          const stand = T[Math.max(0, k0)];
          if (j >= T.length) {
            // ella sigue allá arriba: esperar mirándola
            this.d = Math.min(nd, stand.d);
            const p = this.pointAt(this.d);
            s.x = p.x; s.y = p.y;
            Sheep.setAnim(s, Math.abs(girl.y - s.y) > 60 ? 'lookup' : 'idle');
            s.facing = girl.x >= s.x ? 1 : -1;
            this.idleT = 0;
            this.finish(dt, px, py);
            return;
          }
          const dest = T[j];
          if (climb && Math.abs(dest.y - stand.y) > 200 && this.L.tunnel) this.startTunnel(dest);
          else this.startHop(s.x, s.y, dest);
          this.finish(dt, px, py);
          return;
        }
        this.d = nd;
        moving = v;
      } else if (this.d > target + 1) {
        // la niña ha vuelto hacia ella: retroceder por el rastro para dejarle sitio
        const v = U.clamp((this.d - target) * 2.4, 60, 300);
        this.d = Math.max(target, this.d - v * dt);
        moving = v;
      }
      const p = this.pointAt(this.d);
      s.x = p.x;
      s.y = p.y;
      // sobre el puente, la superficie actual (que se hunde) manda
      const by = this.w.bridgeY(s.x, true);
      if (by != null && p.kind === 'bridge') s.y = by;
      if (moving > 0) {
        this.idleT = 0;
        if (Math.abs(s.x - px) > 0.05) s.facing = s.x > px ? 1 : -1;
        const gy = this.groundUnder(s.x, s.y);
        const air = gy != null && gy - s.y > 9;
        s.speed = moving;
        s.vy = (s.y - py) / Math.max(dt, 1e-3);
        Sheep.setAnim(s, air ? 'jump' : moving > 230 ? 'run' : 'walk');
      } else {
        this.idleT += dt;
        s.speed = 0;
        this.idleBehaviour(dt, girl, ctx);
      }
    }
    this.finish(dt, px, py);
  };

  SheepCtl.prototype.finish = function () {};

  SheepCtl.prototype.groundUnder = function (x, y) {
    let best = this.w.groundY(x);
    for (const sld of this.w.solids.concat(this.w.pushables)) if (x > sld.x && x < sld.x + sld.w && sld.y >= y - 4 && (best == null || sld.y < best)) best = sld.y;
    for (const l of this.w.ledges) if (x >= l.x0 && x <= l.x1 && l.y >= y - 4 && (best == null || l.y < best)) best = l.y;
    const b = this.w.bridgeY(x);
    if (b != null && b >= y - 4 && (best == null || b < best)) best = b;
    return best;
  };

  SheepCtl.prototype.startHop = function (x0, y0, dest) {
    const dist = Math.hypot(dest.x - x0, dest.y - y0);
    const up = Math.max(0, y0 - dest.y);
    this.hop = { x0, y0, x1: dest.x, y1: dest.y, h: dist > 40 || up > 10 ? 26 + up * 0.7 : 0, t: 0, dur: U.clamp(dist / 230, 0.3, 1.1), d1: dest.d };
    this.mode = 'hop';
  };

  SheepCtl.prototype.startTunnel = function (dest) {
    const t = this.L.tunnel;
    this.tun = { phase: 'go', dest, t: 0 };
    this.mode = 'tunnel';
    void t;
  };

  SheepCtl.prototype.updateTunnel = function (dt) {
    const s = this.s, Sheep = JHS.Sheep, tun = this.tun, T = this.L.tunnel;
    tun.t += dt;
    if (tun.phase === 'go') {
      const dx = T.from.x - s.x;
      s.facing = dx >= 0 ? 1 : -1;
      s.x += U.clamp(dx, -170 * dt, 170 * dt);
      s.y = this.w.groundY(s.x) || s.y;
      s.speed = 160;
      Sheep.setAnim(s, 'walk');
      if (Math.abs(dx) < 2) { tun.phase = 'in'; tun.t = 0; }
    } else if (tun.phase === 'in') {
      // se mete en la grieta
      const k = U.clamp(tun.t / 0.6, 0, 1);
      s.alpha = 1 - k; s.scale = 1 - k * 0.35;
      s.speed = 60;
      Sheep.setAnim(s, 'walk');
      if (k >= 1) { tun.phase = 'hidden'; tun.t = 0; }
    } else if (tun.phase === 'hidden') {
      s.alpha = 0;
      if (tun.t > 1.1) { tun.phase = 'out'; tun.t = 0; s.x = T.to.holeX; s.y = T.to.holeY; s.facing = 1; }
    } else if (tun.phase === 'out') {
      // asoma por el hueco del muro y salta arriba
      const k = U.clamp(tun.t / 0.5, 0, 1);
      s.alpha = k; s.scale = 0.7 + k * 0.3;
      Sheep.setAnim(s, 'walk');
      s.speed = 60;
      if (tun.t > 0.55) {
        s.alpha = 1; s.scale = 1;
        tun.phase = 'climb'; tun.t = 0;
        this.hop = { x0: s.x, y0: s.y, x1: T.to.x, y1: T.to.y, h: 34, t: 0, dur: 0.45, d1: 0 };
        JHS.Ambient.burst('dust', T.to.holeX + 10, T.to.holeY - 6, 4);
      }
    } else if (tun.phase === 'climb') {
      const h = this.hop;
      h.t = Math.min(h.dur, h.t + dt);
      const k = h.t / h.dur;
      s.x = U.lerp(h.x0, h.x1, k);
      s.y = U.lerp(h.y0, h.y1, k) - h.h * 4 * k * (1 - k);
      s.vy = -300 + 600 * k;
      Sheep.setAnim(s, 'jump');
      if (h.t >= h.dur) { tun.phase = 'shake'; tun.t = 0; JHS.Ambient.burst('wool', s.x, s.y - 30, 10); }
    } else if (tun.phase === 'shake') {
      Sheep.setAnim(s, 'shake');
      s.speed = 0;
      if (tun.t > 0.8) this.startHop(s.x, s.y, tun.dest);
    }
  };

  SheepCtl.prototype.idleBehaviour = function (dt, girl, ctx) {
    const s = this.s, Sheep = JHS.Sheep;
    if (ctx && ctx.forceAnim) { Sheep.setAnim(s, ctx.forceAnim); return; }
    if (s.anim === 'happy' && s.animT < 1.4) return;
    if (s.anim === 'shake' && s.animT < 0.8) return;
    // «localizar objetos»: si hay una semilla secreta cerca, la señala olfateando
    const hint = ctx && ctx.secretNear;
    if (hint) {
      s.facing = hint.x >= s.x ? 1 : -1;
      Sheep.setAnim(s, 'sniff');
      if (s.exprT <= 0) { s.expr = 'curiosa'; s.exprT = 1.5; }
      return;
    }
    s.facing = girl.x >= s.x ? 1 : -1;
    const onGround = this.w.groundY(s.x) != null && Math.abs(this.w.groundY(s.x) - s.y) < 3;
    if (this.idleT > 14 && onGround) Sheep.setAnim(s, 'sleep');
    else if (this.idleT > 5 && onGround) Sheep.setAnim(s, (Math.floor(this.idleT / 5) % 2) ? 'eat' : 'idle');
    else Sheep.setAnim(s, 'idle');
  };

  // ------------------------------------------------------------------ el Pastor
  function ShepherdCtl(world, L, shep) {
    this.w = world; this.L = L; this.s = shep;
    this.i = 0; this.state = 'appear'; this.t = 0;
    this.talked = new Set();
    this.place(0);
    shep.alpha = 1;
    this.state = 'wait';
  }

  ShepherdCtl.prototype.place = function (i) {
    const st = this.L.shepherd[i];
    this.s.x = st.x;
    this.s.y = this.w.groundY(st.x);
    this.s.facing = st.face;
  };

  ShepherdCtl.prototype.update = function (dt, girl, ui) {
    const s = this.s, Sh = JHS.Shepherd, st = this.L.shepherd[this.i];
    this.t += dt;
    s.vx = 0;
    if (this.state === 'finale') return this.updateFinale(dt, girl, ui);
    if (!st) { s.alpha = 0; return; }
    const dx = girl.x - s.x;
    s.bend = false;
    if (this.state === 'wait') {
      if (Math.abs(dx) < 700) s.facing = dx >= 0 ? 1 : -1;
      // saluda con la mano cuando la ve llegar
      if (!this.waved) this.waved = new Set();
      if (!this.waved.has(this.i) && Math.abs(dx) < st.radius + 320) { this.waved.add(this.i); this.waveT = 1.6; }
      if (this.waveT > 0) { this.waveT -= dt; Sh.setAnim(s, 'wave'); } else Sh.setAnim(s, 'idle');
      if (Math.abs(dx) < st.radius && !this.talked.has(this.i)) {
        this.talked.add(this.i);
        this.state = 'talk';
        ui.say('El Buen Pastor', st.lines, () => [s.x, s.y - 300], { onEnd: () => { this.state = 'gesture'; this.t = 0; } });
      }
    } else if (this.state === 'talk') {
      s.facing = dx >= 0 ? 1 : -1;
      Sh.setAnim(s, 'speak');
      s.talking = ui.speaking();
      s.bend = Math.abs(dx) < 200;
      if (Math.abs(dx) > 900) { ui.cancel(); this.state = 'gesture'; }
    } else if (this.state === 'gesture') {
      s.talking = false;
      s.facing = 1;
      Sh.setAnim(s, st.gesture || 'point');
      if (this.t > 1.8) { this.state = 'near'; this.t = 0; }
    } else if (this.state === 'near') {
      if (Math.abs(dx) < 700) s.facing = dx >= 0 ? 1 : -1;
      Sh.setAnim(s, this.chatting ? 'speak' : 'idle');
      s.talking = this.chatting && ui.speaking();
      s.bend = this.chatting && Math.abs(dx) < 200;
      const next = this.L.shepherd[this.i + 1];
      if (girl.x > s.x + 640 || (next && girl.x > next.x - 1300)) { this.state = 'leave'; this.t = 0; this.leaveX = s.x; }
    } else if (this.state === 'leave') {
      // se adelanta por el sendero y se desvanece en luz
      s.facing = 1;
      Sh.setAnim(s, 'walk');
      s.speed = 105; s.vx = 105;
      s.x += 105 * dt;
      const gy = this.w.groundY(s.x);
      if (gy != null) s.y = gy;
      s.alpha = 1 - U.clamp((s.x - this.leaveX - 50) / 90, 0, 1);
      if (Math.random() < dt * 22) JHS.Ambient.burst('light', s.x + U.lerp(-30, 30, Math.random()), s.y - Math.random() * 280, 1);
      if (s.alpha <= 0) {
        this.i++;
        if (this.i >= this.L.shepherd.length) { this.state = 'gone'; return; }
        this.place(this.i);
        this.state = 'appear'; this.t = 0;
      }
    } else if (this.state === 'appear') {
      const st2 = this.L.shepherd[this.i];
      if (girl.x < st2.x - 2600) { s.alpha = 0; return; }
      s.alpha = Math.min(1, s.alpha + dt * 0.8);
      Sh.setAnim(s, 'idle');
      if (s.alpha < 1 && Math.random() < dt * 16) JHS.Ambient.burst('light', s.x + U.lerp(-34, 34, Math.random()), s.y - Math.random() * 280, 1);
      if (s.alpha >= 1) this.state = 'wait';
    } else if (this.state === 'gone') {
      s.alpha = 0;
    }
  };

  ShepherdCtl.prototype.canTalk = function (girl) {
    return (this.state === 'near' || this.state === 'wait') && this.s.alpha > 0.9 && Math.abs(girl.x - this.s.x) < 110 && this.talked.has(this.i);
  };

  ShepherdCtl.prototype.startFinale = function (x, toX) {
    this.state = 'finale';
    this.fin = { t: 0, toX, said: false };
    this.s.x = x;
    this.s.y = this.w.groundY(x);
    this.s.alpha = 0;
    this.s.facing = 1;
  };

  ShepherdCtl.prototype.updateFinale = function (dt, girl, ui) {
    const s = this.s, Sh = JHS.Shepherd, f = this.fin;
    f.t += dt;
    s.talking = f.mode === 'speak' && !!ui && ui.speaking();
    s.alpha = Math.min(1, s.alpha + dt * 0.7);
    if (s.alpha < 1 && Math.random() < dt * 16) JHS.Ambient.burst('light', s.x + U.lerp(-34, 34, Math.random()), s.y - Math.random() * 280, 1);
    if (s.x < f.toX) {
      s.x = Math.min(f.toX, s.x + 85 * dt);
      s.y = this.w.groundY(s.x);
      s.speed = 85; s.vx = 85;
      Sh.setAnim(s, 'walk');
    } else if (f.mode === 'bless') {
      Sh.setAnim(s, 'bless');
    } else if (f.mode === 'speak') {
      Sh.setAnim(s, 'speak');
    } else if (f.mode === 'kneel') {
      Sh.setAnim(s, 'kneel');
    } else {
      Sh.setAnim(s, 'look');
    }
  };

  // ------------------------------------------------------------------ objetos interactivos
  function Items(world, L) {
    this.w = world; this.L = L;
    // las semillas «en el árbol» no se ven hasta que el árbol se sacude y caen al suelo
    this.seeds = L.seeds.map((s, i) => ({ x: s.x, y: s.y, secret: !!s.secret, taken: false, t: i * 1.3, pop: 0,
      inTree: s.inTree || null, hidden: !!s.inTree, vy: 0, falling: false }));
    this.lanterns = L.lanterns.map((l) => ({ x: l.x, lit: false, glow: 0, t: Math.random() * 5 }));
    this.chest = { x: L.chest.x, y: world.groundY(L.chest.x), open: false, t: 0, opening: -1 };
    this.flowers = (L.flowers || []).map((f, i) => ({ x: f.x, y: world.groundY(f.x), picked: false, t: i * 2.1, pickT: -1 }));
    this.found = 0;
    this.picked = 0;
    this.page = false;
  }

  Items.prototype.update = function (dt, girl, onCheckpoint) {
    for (const sd of this.seeds) {
      sd.t += dt;
      if (sd.hidden) continue;
      if (sd.taken) { sd.pop = Math.min(1, sd.pop + dt * 3); continue; }
      if (sd.falling) {
        // cae girando entre las hojas y rebota una vez en el suelo
        sd.vy += 1400 * dt;
        sd.y += sd.vy * dt;
        const gy = this.w.groundY(sd.x) - 26;
        if (sd.y >= gy) { sd.y = gy; if (sd.vy > 220) { sd.vy = -sd.vy * 0.35; JHS.Ambient.burst('dust', sd.x, gy + 24, 3); } else { sd.vy = 0; sd.falling = false; } }
      }
      const cx = girl.x, cy = girl.y - 72;
      if (Math.abs(sd.x - cx) < 34 && Math.abs(sd.y - cy) < 78) {
        sd.taken = true;
        this.found++;
        JHS.Ambient.burst('gold', sd.x, sd.y, 16);
        JHS.UI.flyToHud('seed', sd.x, sd.y);
        if (JHS.Sound) JHS.Sound.play('seed');
        if (this.onSeed) this.onSeed(sd);
      }
    }
    for (const f of this.flowers) {
      f.t += dt;
      if (f.pickT >= 0) f.pickT += dt;
    }
    for (const l of this.lanterns) {
      l.t += dt;
      if (!l.lit && girl.x > l.x - 24) {
        l.lit = true;
        l.flare = 1;
        JHS.Ambient.burst('gold', l.x + 28, this.w.groundY(l.x) - 112, 18);
        if (JHS.Sound) JHS.Sound.play('lantern');
        onCheckpoint({ x: l.x + 46, y: this.w.groundY(l.x + 46) });
      }
      l.flare = Math.max(0, (l.flare || 0) - dt * 1.4);
      l.glow = U.damp(l.glow, l.lit ? 1 : 0, 2.5, dt);
    }
    const c = this.chest;
    if (c.opening >= 0) {
      c.opening += dt;
      if (c.opening > 0.45 && !c.open) { c.open = true; JHS.Ambient.burst('gold', c.x, c.y - 40, 20); if (JHS.Sound) JHS.Sound.play('chest'); }
      if (c.opening > 1.25) { c.opening = -1; this.page = true; JHS.UI.showPage(this.L.page); JHS.UI.bumpHUD(); if (JHS.Sound) JHS.Sound.play('page'); }
    }
  };

  Items.prototype.secretNear = function (x) {
    for (const sd of this.seeds) if (sd.secret && !sd.taken && !sd.hidden && Math.abs(sd.x - x) < 300) return sd;
    return null;
  };

  // Al sacudir un árbol cae la semilla que esconde (si la tiene).
  Items.prototype.shakeTree = function (treeX) {
    for (const sd of this.seeds) {
      if (sd.inTree === treeX && sd.hidden) { sd.hidden = false; sd.falling = true; sd.vy = -120; return true; }
    }
    return false;
  };

  Items.prototype.flowerNear = function (x) {
    for (const f of this.flowers) if (!f.picked && Math.abs(f.x - x) < 44) return f;
    return null;
  };

  Items.prototype.total = function () { return this.seeds.length; };

  JHS.Entities = { SheepCtl, ShepherdCtl, Items };
})(window.JHS = window.JHS || {});
