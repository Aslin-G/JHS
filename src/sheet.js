/* Hoja de personajes en el juego (Fase A/B, §47 y §72–§74): los mismos esqueletos y piezas que
   usa el nivel, animados en bucle, con expresiones, tabla de escala, paleta muestreada de la
   lámina y la lámina original al lado para comparar (§81). */
(function (JHS) {
  'use strict';
  const U = JHS.U, P = JHS.Palette, Paint = JHS.Paint, UI = JHS.UI;

  const Sheet = { page: 0, t: 0, cells: null, extra: null, ref: null, pages: 4 };

  function girlCell(label, drive) {
    const g = JHS.Girl.create(0, 0);
    return { mod: JHS.Girl, o: g, label, drive };
  }
  function sheepCell(label, anim, drive) {
    const s = JHS.Sheep.create(0, 0);
    JHS.Sheep.setAnim(s, anim);
    return { mod: JHS.Sheep, o: s, label, drive: drive || ((o) => { JHS.Sheep.setAnim(o, anim); o.speed = anim === 'run' ? 320 : 150; }) };
  }
  function shepCell(label, anim, drive) {
    const s = JHS.Shepherd.create(0, 0);
    return { mod: JHS.Shepherd, o: s, label, drive: drive || ((o, t) => { if (o.anim !== anim || (anim !== 'walk' && anim !== 'idle' && o.animT > 3.2)) { o.anim = ''; JHS.Shepherd.setAnim(o, anim); } o.speed = 105; o.talking = anim === 'speak'; }) };
  }

  function build() {
    const jumpCycle = (g, t) => {
      const k = (t % 1.5) / 1.5;
      if (k < 0.8) { g.mode = 'air'; g.vy = U.lerp(-930, 1000, k / 0.8); }
      else { if (g.mode === 'air') g.landT = 0; g.mode = 'ground'; g.vy = 0; g.speed = 0; }
    };
    Sheet.cells = [
      [
        girlCell('Idle (espera)', (g) => { g.mode = 'ground'; g.speed = 0; }),
        girlCell('Caminar', (g) => { g.mode = 'ground'; g.speed = 150; g.vx = 150; }),
        girlCell('Correr', (g) => { g.mode = 'ground'; g.speed = 300; g.vx = 300; }),
        girlCell('Saltar', jumpCycle),
        girlCell('Trepar', (g, t, dt) => { g.mode = 'climb'; g.vy = -120; g.climbPh = (g.climbPh + dt * 1.1) % 1; }),
        girlCell('Empujar', (g) => { g.mode = 'push'; g.speed = 60; g.vx = 60; }),
        girlCell('Interactuar', (g, t) => { g.mode = 'ground'; g.speed = 0; if (!g.action) { g.action = 'interact'; g.actionT = 0; g.actionDur = 1.6; } }),
        girlCell('Acariciar', (g) => { g.mode = 'ground'; g.speed = 0; if (!g.action) { g.action = 'pet'; g.actionT = 0; g.actionDur = 1.7; } }),
        girlCell('Mirar el paisaje', (g) => { g.mode = 'ground'; g.speed = 0; g.wind = 2.4; if (!g.action) { g.action = 'look'; g.actionT = 0; g.actionDur = 0; } }),
      ],
      [
        sheepCell('Idle', 'idle'), sheepCell('Caminar', 'walk'), sheepCell('Correr', 'run'),
        sheepCell('Saltar', 'jump', (o, t) => { JHS.Sheep.setAnim(o, 'jump'); o.vy = Math.sin(t * 3) * 600; }),
        sheepCell('Comer', 'eat'), sheepCell('Oler', 'sniff'), sheepCell('Dormir', 'sleep'),
        sheepCell('Asustarse', 'scared'),
        sheepCell('Alegrarse', 'happy', (o) => { if (o.anim !== 'happy' || o.animT > 2) { o.anim = ''; JHS.Sheep.setAnim(o, 'happy'); } }),
      ],
      [
        shepCell('Idle', 'idle'), shepCell('Caminar', 'walk'), shepCell('Guiar / señalar', 'point'),
        shepCell('Bendecir', 'bless'), shepCell('Hablar', 'speak'), shepCell('Mirar el horizonte', 'look'),
      ],
    ];
    // segunda pasada: transiciones, esperas e interacciones nuevas
    const loopAction = (a, dur, every, carry = 0) => (g, t) => {
      g.mode = 'ground'; g.speed = 0; g.carry = carry;
      if (!g.action || (every && g.actionT > every)) { g.action = a; g.actionT = 0; g.actionDur = dur; }
    };
    const calm = (g) => { g.mode = 'ground'; g.speed = 0; g.vx = 0; };
    const bench = JHS.Objects.bench();
    Sheet.extra = [
      [
        girlCell('Girar', (g, t) => { calm(g); g.facing = Math.floor(t / 1.3) % 2 ? -1 : 1; }),
        girlCell('Frenar', (g) => { g.mode = 'ground'; g.speed = 4; g.vx = 4; g.brake = true; }),
        girlCell('Equilibrio en el borde', (g) => { calm(g); g.teeter = true; }),
        girlCell('Agacharse', (g) => { calm(g); g.crouch = true; }),
        girlCell('Mirar arriba', (g) => { calm(g); g.lookUp = true; }),
        girlCell('Estirarse (espera)', (g) => { calm(g); g.idleT = 7.6; }),
        girlCell('Sentarse (espera larga)', (g) => { calm(g); g.idleT = 17; }),
      ],
      [
        Object.assign(girlCell('Sentarse en el banco', (g) => { calm(g); g.bench = true; }), { under: bench }),
        girlCell('Llamar a la oveja', loopAction('call', 0, 1.6)),
        girlCell('Recoger', loopAction('pick', 0, 1.3, 2)),
        girlCell('Ofrecer las flores', loopAction('offer', 0, 0, 4)),
        girlCell('Sacudir el árbol', loopAction('shake', 0, 1.4)),
        girlCell('Leer el letrero', loopAction('read', 0, 0)),
        girlCell('Encaramarse', loopAction('mantle', 0, 1.1)),
      ],
      [
        sheepCell('Balar', 'idle', (o, t) => { JHS.Sheep.setAnim(o, 'idle'); if (o.bleatT <= 0 && (t % 2.4) < 0.1) JHS.Sheep.bleat(o, '¡Beee!'); }),
        sheepCell('Mover la cola', 'happy', (o, t) => { if (o.anim !== 'happy' || o.animT > 1.8) { o.anim = ''; JHS.Sheep.setAnim(o, 'happy'); o.wag = 2; } }),
        sheepCell('Seguir con la mirada', 'idle', (o, t) => { JHS.Sheep.setAnim(o, 'idle'); o.lookAt = { x: o.x + 80 + Math.sin(t * 1.3) * 90, y: o.y - 150 + Math.cos(t * 0.9) * 60 }; }),
        shepCell('Saludar', 'wave', (o) => { if (o.anim !== 'wave' || o.animT > 2) { o.anim = ''; JHS.Shepherd.setAnim(o, 'wave'); } }),
        shepCell('Inclinarse', 'kneel', (o) => { JHS.Shepherd.setAnim(o, 'kneel'); }),
        shepCell('Recibir las flores', 'speak', (o) => { JHS.Shepherd.setAnim(o, 'speak'); o.flowers = true; o.talking = true; }),
      ],
    ];
    Sheet.ref = new Image();
    Sheet.ref.src = JHS.REF_IMAGE_SRC || 'docs/referencias/lamina_conceptual.jpg';
  }

  Sheet.open = function () { if (!Sheet.cells) build(); Sheet.t = 0; };

  Sheet.update = function (dt) {
    Sheet.t += dt;
    if (!Sheet.cells) return;
    for (const row of Sheet.cells.concat(Sheet.extra)) for (const c of row) {
      c.drive(c.o, Sheet.t, dt);
      c.mod.update(c.o, dt);
      if (c.o.events) c.o.events.length = 0;
    }
  };

  function header(ctx, title, sub) {
    Paint.paperScrap(ctx, 40, 26, 760, 70, { seed: 201, tint: '#efe0c4' });
    UI.text(ctx, title, 68, 75, 38, { font: UI.F.title });
    UI.text(ctx, sub, 1880, 70, 22, { align: 'right', italic: true, color: P.inkSoft });
    const nav = JHS.G && JHS.G.touchMode
      ? `página ${Sheet.page + 1} de ${Sheet.pages}   ·   toca a la derecha para pasar página   ·   toca el título para volver`
      : `← →  página ${Sheet.page + 1} de ${Sheet.pages}   ·   Esc volver`;
    UI.text(ctx, nav, 1880, 1050, 20, { align: 'right', color: P.inkGrey });
  }

  function rowLabel(ctx, s, y) {
    Paint.paperScrap(ctx, 28, y - 34, 120, 48, { seed: 210 + y, tint: '#efe0c4' });
    UI.text(ctx, s, 88, y, 26, { font: UI.F.title, align: 'center' });
  }

  function drawAnimations(ctx) {
    header(ctx, 'Sprites de animación — modelo en juego', 'Mismo esqueleto y mismas piezas pintadas en todos los cuadros (§14)');
    const rows = [{ y: 400, s: 1.3, lab: 'Niña' }, { y: 660, s: 1.25, lab: 'Oveja' }, { y: 1000, s: 0.88, lab: 'Pastor' }];
    Sheet.cells.forEach((row, r) => {
      const R = rows[r];
      rowLabel(ctx, R.lab, R.y - 150);
      const n = row.length;
      const x0 = 270, x1 = 1770;
      row.forEach((c, i) => {
        const x = n === 1 ? (x0 + x1) / 2 : U.lerp(x0, x1, i / (n - 1));
        ctx.save();
        ctx.translate(x, R.y);
        ctx.scale(R.s, R.s);
        // sombra en el suelo
        ctx.fillStyle = 'rgba(110,84,60,0.18)';
        ctx.beginPath(); ctx.ellipse(0, 1, 34, 5, 0, 0, U.TAU); ctx.fill();
        c.mod.draw(ctx, c.o);
        ctx.restore();
        UI.text(ctx, c.label, x, R.y + 34, 21, { align: 'center', color: P.inkSoft });
      });
      ctx.strokeStyle = U.rgba(P.inkSoft, 0.25); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(180, R.y + 52); ctx.lineTo(1880, R.y + 52); ctx.stroke();
    });
  }

  function drawMoreAnimations(ctx) {
    header(ctx, 'Animaciones nuevas — transiciones e interacciones', 'Segunda pasada: más vida entre los movimientos y más cosas que hacer');
    const rows = [{ y: 380, s: 1.25, lab: 'Niña' }, { y: 690, s: 1.25, lab: '' }, { y: 1000, s: 1, lab: 'Oveja · Pastor' }];
    Sheet.extra.forEach((row, r) => {
      const R = rows[r];
      if (R.lab) rowLabel(ctx, R.lab === 'Oveja · Pastor' ? 'Otros' : R.lab, R.y - 150);
      const n = row.length, x0 = 280, x1 = 1760;
      row.forEach((c, i) => {
        const x = U.lerp(x0, x1, i / (n - 1));
        const s = c.mod === JHS.Shepherd ? 0.82 : R.s;
        ctx.save();
        ctx.translate(x, R.y);
        ctx.scale(s, s);
        ctx.fillStyle = 'rgba(110,84,60,0.18)';
        ctx.beginPath(); ctx.ellipse(0, 1, 34, 5, 0, 0, U.TAU); ctx.fill();
        if (c.under) ctx.drawImage(c.under.c, -c.under.ox, -c.under.oy + 4, c.under.w, c.under.h);
        c.mod.draw(ctx, c.o);
        if (c.mod === JHS.Sheep) JHS.Sheep.drawBubble(ctx, c.o);
        ctx.restore();
        UI.text(ctx, c.label, x, R.y + 34, 20, { align: 'center', color: P.inkSoft });
      });
      ctx.strokeStyle = U.rgba(P.inkSoft, 0.25); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(180, R.y + 52); ctx.lineTo(1880, R.y + 52); ctx.stroke();
    });
  }

  function faceShot(ctx, mod, setup, x, y, k, clip, label) {
    const o = mod.create(0, 0);
    setup(o);
    for (let i = 0; i < 3; i++) mod.update(o, 1 / 60);
    setup(o);
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath(); ctx.ellipse(0, 0, clip[0], clip[1], 0, 0, U.TAU); ctx.clip();
    ctx.fillStyle = Paint.paperPattern(ctx); ctx.fillRect(-clip[0], -clip[1], clip[0] * 2, clip[1] * 2);
    ctx.scale(k, k);
    ctx.translate(-clip[2], -clip[3]);
    mod.draw(ctx, o);
    ctx.restore();
    UI.text(ctx, label, x, y + clip[1] + 28, 20, { align: 'center', color: P.inkSoft });
  }

  function drawExpressions(ctx) {
    header(ctx, 'Expresiones · escala · paleta', 'Expresiones sutiles (§74) · relación de escala (§72) · paleta de la lámina (§6)');
    rowLabel(ctx, 'Niña', 150);
    const ge = [['tranquila', 'Tranquila'], ['alegre', 'Alegre'], ['sorpresa', 'Sorpresa'], ['pensativa', 'Pensativa'], ['triste', 'Triste'], ['determinada', 'Determinada'], ['cansada', 'Cansada']];
    ge.forEach(([e, l], i) => faceShot(ctx, JHS.Girl, (o) => { o.expr = e; o.exprT = 9; o.blink = 0; o.blinkT = 9; o.lookT = 99; }, 240 + i * 112, 250, 1.85, [52, 58, 0, -130], l));
    rowLabel(ctx, 'Pastor', 450);
    const se = [['sereno', 'Sereno'], ['animado', 'Animado'], ['preocupado', 'Preocupado'], ['compasivo', 'Compasivo']];
    se.forEach(([e, l], i) => faceShot(ctx, JHS.Shepherd, (o) => { o.expr = e; o.blink = 0; o.blinkT = 9; }, 240 + i * 150, 550, 1.6, [62, 70, 4, -238], l));
    rowLabel(ctx, 'Oveja', 750);
    const oe = [['contenta', 'Contenta', 'idle'], ['curiosa', 'Curiosa', 'idle'], ['asustada', 'Asustada', 'scared'], ['dormida', 'Dormida', 'sleep']];
    oe.forEach(([e, l, a], i) => faceShot(ctx, JHS.Sheep, (o) => { JHS.Sheep.setAnim(o, a); o.expr = e; o.exprT = e === 'dormida' ? 0 : 9; o.blink = 0; o.blinkT = 9; }, 240 + i * 150, 850, 2, [62, 58, 38, a === 'sleep' ? -42 : -60], l));

    // tabla de escala
    const bx = 1000, by = 900;
    Paint.paperScrap(ctx, 960, 130, 520, 860, { seed: 230, alpha: 0.6 });
    UI.text(ctx, 'Escala', 1220, 175, 30, { font: UI.F.title, align: 'center' });
    ctx.strokeStyle = U.rgba(P.inkSoft, 0.35); ctx.lineWidth = 1;
    for (let h = 0; h <= 300; h += 50) {
      const y = by - h * 1.7;
      ctx.beginPath(); ctx.moveTo(990, y); ctx.lineTo(1460, y); ctx.stroke();
      UI.text(ctx, `${h}`, 985, y + 6, 16, { align: 'right', color: P.inkGrey });
    }
    const figs = [
      [JHS.Girl, 1060, 'Niña 170'], [JHS.Sheep, 1150, 'Oveja 95'], [JHS.Shepherd, 1270, 'Pastor 292'],
    ];
    for (const [mod, x, l] of figs) {
      const o = mod.create(0, 0); mod.update(o, 1 / 60);
      ctx.save(); ctx.translate(x, by); ctx.scale(1.7, 1.7); mod.draw(ctx, o); ctx.restore();
      UI.text(ctx, l, x, by + 30, 17, { align: 'center', color: P.inkSoft });
    }
    // silueta de NPC adulto y puerta (referencias de proporción)
    ctx.save();
    ctx.translate(1385, by); ctx.scale(1.7, 1.7);
    ctx.strokeStyle = U.rgba(P.ink, 0.6); ctx.setLineDash([4, 3]); ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, -245, 19, 23, 0, 0, U.TAU);
    ctx.moveTo(-26, -214); ctx.lineTo(26, -214); ctx.lineTo(34, -10); ctx.lineTo(-34, -10); ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    UI.text(ctx, 'NPC adulto 270', 1385, by + 30, 17, { align: 'center', color: P.inkSoft });
    ctx.save(); ctx.strokeStyle = U.rgba(P.woodShade, 0.8); ctx.lineWidth = 2;
    ctx.strokeRect(1430, by - 240 * 1.7 * 0.5, 40, 240 * 1.7 * 0.5); ctx.restore();
    UI.text(ctx, 'Puerta 240 (½)', 1450, by + 52, 15, { align: 'center', color: P.inkGrey });

    // paleta
    Paint.paperScrap(ctx, 1520, 130, 370, 860, { seed: 240, alpha: 0.6 });
    UI.text(ctx, 'Paleta (lámina)', 1705, 175, 28, { font: UI.F.title, align: 'center' });
    P.reference.forEach(([name, hex], i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 1600 + col * 170, y = 245 + row * 108;
      Paint.wash(ctx, U.blobPoly(x, y, 34, 30, 14, U.makeRng(i + 3), 0.18), hex, { layers: 5, alpha: 0.35, amp: 2, seed: 250 + i, edge: 0.25, core: 0.6 });
      UI.text(ctx, name, x, y + 52, 16, { align: 'center', color: P.inkSoft });
      UI.text(ctx, hex, x, y + 70, 13, { align: 'center', color: P.inkGrey });
    });
  }

  function drawReference(ctx) {
    header(ctx, 'Lámina de referencia y modelo en juego', 'Comparación directa (§81): ¿parecen el mismo libro?');
    const im = Sheet.ref;
    if (im && im.complete && im.naturalWidth) {
      const w = 1180, h = w * (im.naturalHeight / im.naturalWidth);
      Paint.paperScrap(ctx, 40, 120, w + 20, h + 20, { seed: 260 });
      ctx.drawImage(im, 50, 130, w, h);
    } else {
      UI.text(ctx, 'No se pudo cargar la lámina (docs/referencias/lamina_conceptual.jpg).', 620, 520, 26, { align: 'center', italic: true, color: P.inkSoft });
    }
    Paint.paperScrap(ctx, 1250, 120, 640, 900, { seed: 270, alpha: 0.7 });
    UI.text(ctx, 'En el juego', 1570, 170, 30, { font: UI.F.title, align: 'center' });
    const trio = [[JHS.Shepherd, 1390, 1.75], [JHS.Sheep, 1560, 1.75], [JHS.Girl, 1740, 1.75]];
    for (const [mod, x, s] of trio) {
      const o = mod.create(0, 0);
      if (mod === JHS.Shepherd) o.facing = 1;
      for (let i = 0; i < 4; i++) mod.update(o, 1 / 60);
      ctx.save(); ctx.translate(x, 900); ctx.scale(s, s); mod.draw(ctx, o); ctx.restore();
    }
  }

  Sheet.draw = function (ctx) {
    ctx.fillStyle = Paint.paperPattern(ctx);
    ctx.fillRect(0, 0, 1920, 1080);
    if (!Sheet.cells) return;
    if (Sheet.page === 0) drawAnimations(ctx);
    else if (Sheet.page === 1) drawMoreAnimations(ctx);
    else if (Sheet.page === 2) drawExpressions(ctx);
    else drawReference(ctx);
  };

  Sheet.nav = function (d) { Sheet.page = (Sheet.page + d + Sheet.pages) % Sheet.pages; };

  JHS.Sheet = Sheet;
})(window.JHS = window.JHS || {});
