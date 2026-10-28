/* Interfaz dibujada a mano (§34–§37): papel recortado, tinta y acuarela. HUD mínimo, notas de
   diálogo, la página del diario, menús de cuaderno y transiciones de pigmento que se expande. */
(function (JHS) {
  'use strict';
  const U = JHS.U, P = JHS.Palette, Paint = JHS.Paint;

  const F = {
    title: '"IM Fell English", "Iowan Old Style", Georgia, serif',
    text: '"Alegreya", "Iowan Old Style", Georgia, serif',
  };

  const UI = {
    F,
    hud: { a: 1, bump: 0, idle: 0 },
    dlg: null,
    pageView: null,
    prompt: null,
    hint: { t: 0, show: false },
    trans: null,
    seedIcon: null, pageIcon: null,
  };

  UI.init = function () {
    UI.seedIcon = JHS.Objects.seed();
    UI.pageIcon = JHS.Objects.page();
  };

  function text(ctx, s, x, y, size, o = {}) {
    ctx.font = `${o.italic ? 'italic ' : ''}${o.weight || 400} ${size}px ${o.font || F.text}`;
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.base || 'alphabetic';
    ctx.fillStyle = o.color || P.ink;
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    if (o.spacing) {
      // espaciado para versalitas
      let cx = x;
      if (ctx.textAlign === 'center') { cx = x - (ctx.measureText(s).width + o.spacing * (s.length - 1)) / 2; ctx.textAlign = 'left'; }
      for (const ch of s) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + o.spacing; }
    } else ctx.fillText(s, x, y);
    ctx.globalAlpha = 1;
  }
  UI.text = text;

  function wrap(ctx, s, maxW, size, font = F.text, italic = false) {
    ctx.font = `${italic ? 'italic ' : ''}400 ${size}px ${font}`;
    const words = s.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; }
      else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  }
  UI.wrap = wrap;

  // ------------------------------------------------------------------ HUD
  UI.bumpHUD = function () { UI.hud.bump = 1; UI.hud.idle = 0; };

  UI.drawHUD = function (ctx, dt, st) {
    const h = UI.hud;
    h.idle += dt;
    h.bump = Math.max(0, h.bump - dt * 1.6);
    const target = h.idle < 4 ? 1 : 0.55;
    h.a = U.damp(h.a, target, 3, dt);
    const x = 54, y = 46;
    ctx.save();
    ctx.globalAlpha = h.a;
    Paint.paperScrap(ctx, x, y, st.page ? 218 : 160, 66, { seed: 31, alpha: 0.95 });
    const s = 1 + h.bump * 0.25;
    ctx.save();
    ctx.translate(x + 40, y + 34);
    ctx.scale(s * 1.25, s * 1.25);
    ctx.drawImage(UI.seedIcon.c, -UI.seedIcon.ox, -UI.seedIcon.oy, UI.seedIcon.w, UI.seedIcon.h);
    ctx.restore();
    ctx.globalAlpha = h.a;
    text(ctx, `${st.found} / ${st.total}`, x + 66, y + 44, 30, { font: F.title, color: P.ink });
    if (st.page) {
      ctx.save(); ctx.translate(x + 182, y + 33); ctx.rotate(-0.08);
      ctx.drawImage(UI.pageIcon.c, -UI.pageIcon.ox, -UI.pageIcon.oy, UI.pageIcon.w, UI.pageIcon.h);
      ctx.restore();
    }
    ctx.restore();
  };

  // Indicaciones iniciales de control, en una tira de papel que se desvanece.
  UI.drawHint = function (ctx, dt, touchMode) {
    const hn = UI.hint;
    if (!hn.show) return;
    hn.t += dt;
    const a = U.clamp(hn.t / 0.6, 0, 1) * (1 - U.clamp((hn.t - 9) / 1.2, 0, 1));
    if (a <= 0) { if (hn.t > 10.2) hn.show = false; return; }
    const msg = touchMode
      ? '◀ ▶ caminar · doble toque: correr · ⤒ saltar · ✋ interactuar'
      : '← → caminar   ·   Mayús correr   ·   Espacio saltar   ·   ↑ trepar   ·   E interactuar';
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = `400 25px ${F.text}`;
    const w = ctx.measureText(msg).width + 70;
    Paint.paperScrap(ctx, 960 - w / 2, 960, w, 58, { seed: 44, alpha: 0.95 });
    text(ctx, msg, 960, 998, 25, { align: 'center', color: P.inkSoft, alpha: a });
    ctx.restore();
  };

  UI.setPrompt = function (p) { UI.prompt = p; };

  UI.drawPrompt = function (ctx, toScreen, touchMode) {
    const p = UI.prompt;
    if (!p) return;
    const [sx, sy] = toScreen(p.x, p.y);
    const key = touchMode ? (p.key === '↑' ? '↑' : '✋') : p.key;
    ctx.save();
    ctx.font = `italic 400 22px ${F.text}`;
    const w = ctx.measureText(p.label).width;
    Paint.paperScrap(ctx, sx - (w + 64) / 2, sy - 30, w + 64, 44, { seed: 52, alpha: 0.94 });
    ctx.strokeStyle = P.ink; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.arc(sx - w / 2 - 8, sy - 8, 13, 0, U.TAU); ctx.stroke();
    text(ctx, key, sx - w / 2 - 8, sy - 1, 18, { align: 'center', weight: 700, color: P.ink });
    text(ctx, p.label, sx - w / 2 + 14, sy, 22, { italic: true, color: P.inkSoft });
    ctx.restore();
  };

  // ------------------------------------------------------------------ diálogo
  UI.say = function (speaker, lines, anchor, o = {}) {
    UI.dlg = { speaker, lines, i: 0, t: 0, anchor, onEnd: o.onEnd, a: 0, hold: o.hold };
  };
  UI.speaking = function () { return !!UI.dlg && UI.dlg.t > 0.2 && UI.dlg.t < UI.readTime(UI.dlg.lines[UI.dlg.i]) - 0.6; };
  UI.readTime = function (s) { return 1.8 + s.length * 0.055; };
  UI.cancel = function () { if (UI.dlg && UI.dlg.onEnd) UI.dlg.onEnd(); UI.dlg = null; };
  UI.advance = function () {
    const d = UI.dlg;
    if (!d) return false;
    if (d.t < 0.35) return true;
    d.i++; d.t = 0;
    if (d.i >= d.lines.length) { const cb = d.onEnd; UI.dlg = null; if (cb) cb(); }
    return true;
  };

  UI.updateDialogue = function (dt) {
    const d = UI.dlg;
    if (!d) return;
    d.t += dt;
    d.a = U.damp(d.a, 1, 6, dt);
    if (!d.hold && d.t > UI.readTime(d.lines[d.i])) UI.advance();
  };

  UI.drawDialogue = function (ctx, toScreen) {
    const d = UI.dlg;
    if (!d) return;
    const line = d.lines[d.i];
    const [ax, ay] = toScreen(...d.anchor());
    const lines = wrap(ctx, line, 520, 30);
    const w = Math.max(...lines.map((l) => { ctx.font = `400 30px ${F.text}`; return ctx.measureText(l).width; }), 240) + 64;
    const h = 64 + lines.length * 38;
    const x = U.clamp(ax - w * 0.3, 30, 1890 - w), y = U.clamp(ay - h - 20, 24, 700);
    const k = Math.min(1, d.t / 0.25);
    ctx.save();
    ctx.globalAlpha = d.a * k;
    ctx.translate(x + w / 2, y + h);
    ctx.scale(0.94 + 0.06 * k, 0.94 + 0.06 * k);
    ctx.translate(-(x + w / 2), -(y + h));
    Paint.paperScrap(ctx, x, y, w, h, { seed: 61 + d.i, alpha: 0.97 });
    // punta hacia quien habla
    ctx.fillStyle = Paint.paperPattern(ctx);
    const tx = U.clamp(ax, x + 40, x + w - 40);
    ctx.beginPath(); ctx.moveTo(tx - 14, y + h - 2); ctx.lineTo(tx + 6, y + h + 22); ctx.lineTo(tx + 12, y + h - 2); ctx.fill();
    text(ctx, d.speaker.toUpperCase(), x + 32, y + 36, 17, { font: F.title, color: P.inkWarm, spacing: 2.4 });
    lines.forEach((l, i) => text(ctx, l, x + 32, y + 74 + i * 38, 30, { color: P.ink }));
    if (d.lines.length > 1) text(ctx, `${d.i + 1}/${d.lines.length}`, x + w - 30, y + 36, 16, { align: 'right', color: P.inkGrey, font: F.title });
    ctx.restore();
  };

  // ------------------------------------------------------------------ página del diario
  UI.showPage = function (pg) { UI.pageView = { pg, t: 0, closing: -1 }; };
  UI.closePage = function () { if (UI.pageView && UI.pageView.t > 0.6 && UI.pageView.closing < 0) UI.pageView.closing = 0; };

  UI.drawPage = function (ctx, dt) {
    const v = UI.pageView;
    if (!v) return false;
    v.t += dt;
    if (v.closing >= 0) { v.closing += dt; if (v.closing > 0.45) { UI.pageView = null; return false; } }
    const a = U.clamp(v.t / 0.5, 0, 1) * (v.closing >= 0 ? 1 - v.closing / 0.45 : 1);
    ctx.save();
    ctx.globalAlpha = a * 0.45;
    ctx.fillStyle = '#2b1d12';
    ctx.fillRect(0, 0, 1920, 1080);
    ctx.globalAlpha = a;
    ctx.translate(960, 540);
    ctx.rotate(-0.025);
    ctx.scale(0.9 + 0.1 * a, 0.9 + 0.1 * a);
    Paint.paperScrap(ctx, -380, -260, 760, 520, { seed: 71, rough: 5 });
    text(ctx, v.pg.title, 0, -170, 46, { font: F.title, align: 'center', color: P.ink });
    ctx.strokeStyle = P.inkWarm; ctx.globalAlpha = a * 0.6; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-120, -140); ctx.quadraticCurveTo(0, -132, 120, -140); ctx.stroke();
    v.pg.text.forEach((l, i) => text(ctx, l, 0, -60 + i * 56, 36, { italic: true, align: 'center', color: P.inkSoft, alpha: a }));
    text(ctx, 'Pulsa E o toca para continuar', 0, 200, 22, { align: 'center', color: P.inkGrey, alpha: a * (0.6 + 0.4 * Math.sin(v.t * 3)) });
    ctx.restore();
    return true;
  };

  // ------------------------------------------------------------------ transiciones (§37)
  // Una mancha de acuarela que crece desde un punto hasta cubrir la pantalla y luego se retira.
  UI.transition = function (cb, o = {}) {
    UI.trans = { t: 0, dur: o.dur || 0.8, cb, done: false, color: o.color || '#f6eee0', x: o.x || 960, y: o.y || 540 };
  };

  UI.drawTransition = function (ctx, dt) {
    const tr = UI.trans;
    if (!tr) return;
    tr.t += dt;
    const D = tr.dur;
    let k;
    if (tr.t < D) k = U.easeInOut(tr.t / D);
    else {
      if (!tr.done) { tr.done = true; if (tr.cb) tr.cb(); }
      k = 1 - U.easeInOut(U.clamp((tr.t - D - 0.15) / D, 0, 1));
      if (tr.t > D * 2 + 0.15) { UI.trans = null; return; }
    }
    const R = 2300 * k;
    ctx.save();
    for (let layer = 0; layer < 3; layer++) {
      const pts = [];
      const r = R * (1 - layer * 0.06);
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * U.TAU;
        const n = U.noise1(i * 0.45 + layer * 3, 900 + layer) * 0.22 + U.noise1(a * 3 + tr.t, 7) * 0.05;
        pts.push([tr.x + Math.cos(a) * r * (0.9 + n), tr.y + Math.sin(a) * r * (0.9 + n)]);
      }
      ctx.globalAlpha = layer === 0 ? 1 : 0.35;
      ctx.fillStyle = layer === 0 ? Paint.paperPattern(ctx) : U.rgba(P.paperDeep, 0.6);
      Paint.fillPoly(ctx, pts);
      if (layer === 0) {
        ctx.strokeStyle = U.rgba(P.inkWarm, 0.35);
        ctx.lineWidth = 3;
        Paint.pathPoly(ctx, pts, true);
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  // ------------------------------------------------------------------ pantallas de libro
  UI.drawLoading = function (ctx, frac, label) {
    ctx.fillStyle = JHS.Tex.ready ? Paint.paperPattern(ctx) : P.paper;
    ctx.fillRect(0, 0, 1920, 1080);
    text(ctx, 'Camino de montaña al amanecer', 960, 450, 64, { font: F.title, align: 'center', color: P.ink });
    text(ctx, label, 960, 520, 28, { italic: true, align: 'center', color: P.inkSoft });
    // barra: una pincelada que avanza
    const x0 = 660, x1 = 1260, y = 590;
    ctx.strokeStyle = U.rgba(P.inkSoft, 0.25); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
    if (JHS.Tex.ready) {
      const xe = U.lerp(x0, x1, frac);
      Paint.bristles(ctx, [[x0, y], [U.lerp(x0, xe, 0.5), y - 2], [xe, y + 1]], { n: 7, w: 12, color: [P.amber, P.gold, P.terracota || P.amber], alpha: 0.6, seed: 5, gaps: 0.1, taper: 0.3 });
    }
  };

  function menuItems(ctx, items, sel, x, y, size, gap) {
    items.forEach((it, i) => {
      const on = i === sel;
      if (on) {
        ctx.font = `400 ${size}px ${F.title}`;
        const w = ctx.measureText(it).width;
        Paint.bristles(ctx, [[x - w / 2 - 14, y + i * gap - size * 0.3], [x + w / 2 + 14, y + i * gap - size * 0.32]],
          { n: 6, w: size * 0.7, color: ['#f1c27d', '#ecd29c'], alpha: 0.55, seed: 9 + i, gaps: 0.05, taper: 0.2 });
      }
      text(ctx, it, x, y + i * gap, size, { font: F.title, align: 'center', color: on ? P.ink : P.inkSoft, alpha: on ? 1 : 0.78 });
    });
  }
  UI.menuItems = menuItems;

  UI.drawTitle = function (ctx, t, sel, touchMode) {
    const a = U.clamp(t / 0.8, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    Paint.paperScrap(ctx, 560, 130, 800, 430, { seed: 81, rough: 4, alpha: 0.96 });
    text(ctx, 'Camino de montaña', 960, 238, 70, { font: F.title, align: 'center' });
    text(ctx, 'al amanecer', 960, 312, 56, { font: F.title, align: 'center', italic: true, color: P.inkWarm });
    text(ctx, 'PRIMERA PRUEBA JUGABLE', 960, 362, 18, { font: F.title, align: 'center', color: P.inkGrey, spacing: 3 });
    menuItems(ctx, ['Comenzar el camino', 'Hoja de personajes'], sel, 960, 440, 38, 62);
    ctx.restore();
    const msg = touchMode ? 'Toca una opción' : '↑ ↓ elegir · Enter o Espacio para empezar';
    text(ctx, msg, 960, 1040, 22, { align: 'center', color: P.paper, alpha: a * 0.9 });
  };

  UI.drawPause = function (ctx, sel) {
    ctx.save();
    ctx.globalAlpha = 0.35; ctx.fillStyle = '#2b1d12'; ctx.fillRect(0, 0, 1920, 1080);
    ctx.globalAlpha = 1;
    Paint.paperScrap(ctx, 660, 250, 600, 520, { seed: 91, rough: 4 });
    text(ctx, 'Pausa', 960, 350, 60, { font: F.title, align: 'center' });
    menuItems(ctx, ['Continuar', 'Volver al último farol', 'Hoja de personajes', 'Salir al título'], sel, 960, 450, 34, 70);
    ctx.restore();
  };

  UI.drawEnd = function (ctx, t, st) {
    const a = U.clamp(t / 1.2, 0, 1);
    ctx.save();
    ctx.globalAlpha = a;
    Paint.paperScrap(ctx, 470, 150, 980, 700, { seed: 101, rough: 5, alpha: 0.97 });
    text(ctx, 'Has llegado al mirador', 960, 280, 64, { font: F.title, align: 'center' });
    text(ctx, 'Fin de la primera prueba', 960, 340, 30, { italic: true, align: 'center', color: P.inkWarm });
    ctx.strokeStyle = P.inkWarm; ctx.globalAlpha = a * 0.6; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(780, 375); ctx.quadraticCurveTo(960, 385, 1140, 375); ctx.stroke();
    ctx.globalAlpha = a;
    ctx.save(); ctx.translate(820, 465); ctx.scale(1.8, 1.8); ctx.drawImage(UI.seedIcon.c, -UI.seedIcon.ox, -UI.seedIcon.oy, UI.seedIcon.w, UI.seedIcon.h); ctx.restore();
    text(ctx, `Semillas de luz: ${st.found} de ${st.total}`, 860, 478, 34, { color: P.ink });
    ctx.save(); ctx.translate(820, 545); ctx.scale(1.4, 1.4); ctx.drawImage(UI.pageIcon.c, -UI.pageIcon.ox, -UI.pageIcon.oy, UI.pageIcon.w, UI.pageIcon.h); ctx.restore();
    text(ctx, st.page ? 'Página del diario: encontrada' : 'Página del diario: sigue en algún cofre', 860, 558, 34, { color: P.ink });
    text(ctx, st.time, 860, 628, 26, { italic: true, color: P.inkSoft });
    menuItems(ctx, ['Volver a empezar', 'Hoja de personajes'], st.sel, 960, 730, 34, 60);
    ctx.restore();
  };

  // Controles táctiles: círculos de tinta sobre papel.
  UI.drawTouch = function (ctx, Input) {
    const B = Input.BTN;
    const glyph = { left: '◀', right: '▶', jump: '⤒', act: '✋', up: '↑', pause: 'Ⅱ' };
    for (const k in B) {
      const b = B[k];
      const on = Input.touch.btn[k];
      ctx.save();
      ctx.globalAlpha = on ? 0.75 : 0.42;
      ctx.fillStyle = Paint.paperPattern(ctx);
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, U.TAU); ctx.fill();
      ctx.strokeStyle = P.ink; ctx.lineWidth = 2.4; ctx.globalAlpha = on ? 0.9 : 0.55;
      ctx.stroke();
      text(ctx, glyph[k], b.x, b.y + b.r * 0.22, b.r * 0.62, { align: 'center', color: P.ink, alpha: on ? 0.95 : 0.6 });
      ctx.restore();
    }
  };

  // Aviso para teléfonos en vertical, dibujado sobre todo el lienzo (W×H en píxeles).
  UI.drawRotate = function (ctx, W, H) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = Paint.paperPattern(ctx);
    ctx.fillRect(0, 0, W, H);
    const k = W / 1080;
    ctx.setTransform(k, 0, 0, k, 0, H / 2 - 120 * k);
    // un teléfono dibujado a tinta que gira
    const a = -Math.PI / 2 * U.smoothstep(0.2, 0.8, (performance.now() / 1600) % 1);
    ctx.save();
    ctx.translate(540, 0);
    ctx.rotate(a);
    ctx.strokeStyle = P.ink; ctx.lineWidth = 6; ctx.lineJoin = 'round';
    ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.rect(-70, -120, 140, 240); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 96, 9, 0, U.TAU); ctx.stroke();
    ctx.restore();
    text(ctx, 'Gira el teléfono', 540, 250, 88, { font: F.title, align: 'center' });
    text(ctx, 'El camino se recorre en horizontal', 540, 330, 44, { italic: true, align: 'center', color: P.inkSoft });
  };

  JHS.UI = UI;
})(window.JHS = window.JHS || {});
