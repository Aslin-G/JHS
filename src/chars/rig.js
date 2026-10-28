/* Utilidades de esqueleto compartidas por los personajes: IK de dos huesos, piezas pintadas
   transformadas, ciclos de marcha y mechones con física de muelle (Biblia §61, §62, §63). */
(function (JHS) {
  'use strict';
  const U = JHS.U;

  // IK analítica de dos huesos: rodilla (o codo) que se dobla siempre hacia `dir` en x.
  function kneeForward(hx, hy, fx, fy, l1, l2, dir = 1) {
    let dx = fx - hx, dy = fy - hy;
    let d = Math.hypot(dx, dy);
    const maxD = (l1 + l2) * 0.999;
    if (d > maxD) { dx *= maxD / d; dy *= maxD / d; d = maxD; }
    if (d < 1e-3) d = 1e-3;
    const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    const mx = hx + (dx * a) / d, my = hy + (dy * a) / d;
    // normal a la izquierda del vector cadera→pie; para un vector hacia abajo apunta a +x
    let nx = -dy / d, ny = dx / d;
    if (nx * dir < 0) { nx = -nx; ny = -ny; }
    return { kx: mx + nx * h, ky: my + ny * h, fx: hx + dx, fy: hy + dy };
  }

  function part(ctx, s, x, y, rot = 0, sx = 1, sy = 1) {
    if (!s) return;
    ctx.save();
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    if (sx !== 1 || sy !== 1) ctx.scale(sx, sy);
    ctx.drawImage(s.c, -s.ox, -s.oy, s.w, s.h);
    ctx.restore();
  }

  // Extremidad delgada de dos segmentos (piernas con medias): forma afilada + tinta fina.
  function limb(ctx, ax, ay, kx, ky, ex, ey, w0, w1, w2, fill, inkCol, inkW = 0.9, rim) {
    const seg = (x0, y0, x1, y1, wa, wb) => {
      const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1;
      const nx = -dy / l, ny = dx / l;
      return [[x0 + nx * wa / 2, y0 + ny * wa / 2], [x1 + nx * wb / 2, y1 + ny * wb / 2], [x1 - nx * wb / 2, y1 - ny * wb / 2], [x0 - nx * wa / 2, y0 - ny * wa / 2]];
    };
    const A = seg(ax, ay, kx, ky, w0, w1), B = seg(kx, ky, ex, ey, w1, w2);
    ctx.fillStyle = fill;
    for (const q of [A, B]) {
      ctx.beginPath();
      ctx.moveTo(q[0][0], q[0][1]);
      for (let i = 1; i < 4; i++) ctx.lineTo(q[i][0], q[i][1]);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(kx, ky, w1 / 2, 0, U.TAU);
    ctx.fill();
    if (rim) { // reflejo cálido del sol en el borde delantero
      ctx.strokeStyle = rim;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(A[0][0], A[0][1]); ctx.lineTo(A[1][0], A[1][1]); ctx.lineTo(B[1][0], B[1][1]);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    if (inkCol) {
      ctx.strokeStyle = inkCol;
      ctx.lineWidth = inkW;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(A[0][0], A[0][1]); ctx.lineTo(A[1][0], A[1][1]); ctx.lineTo(B[1][0], B[1][1]);
      ctx.moveTo(A[3][0], A[3][1]); ctx.lineTo(A[2][0], A[2][1]); ctx.lineTo(B[2][0], B[2][1]);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  // Ciclo de marcha bípedo sin deslizamiento: posición de un pie relativo a la cadera.
  // ph ∈ [0,1): 0 = apoyo de talón delante. beta = fracción de apoyo.
  function footCycle(ph, L, beta, lift) {
    ph = ((ph % 1) + 1) % 1;
    if (ph < beta) {
      const s = ph / beta;
      return { x: L / 2 - L * s, y: 0, rot: s > 0.75 ? (s - 0.75) * 1.4 : 0, stance: true };
    }
    const s = (ph - beta) / (1 - beta);
    return {
      x: -L / 2 + L * U.easeInOut(s),
      y: -lift * Math.sin(Math.PI * s),
      rot: s < 0.3 ? 0.35 - s : -0.18 * Math.sin(Math.PI * s),
      stance: false,
    };
  }

  // ------------------------------------------------------------ mechones con física
  // Cada mechón: raíz en el espacio de la cabeza, dirección de reposo, largo, rizo y grosor.
  // La punta sigue un muelle amortiguado hacia un objetivo que depende de velocidad y viento.
  function makeStrands(specs) {
    return specs.map((s) => Object.assign({ ox: 0, oy: 0, vx: 0, vy: 0 }, s));
  }

  function stepStrands(strands, dt, input) {
    // input: {vx, vy, wind, t, facing}
    const ix = -input.vx * 0.022 * input.facing + input.wind * input.facing;
    const iy = -input.vy * 0.016;
    for (const s of strands) {
      const flex = s.flex == null ? 1 : s.flex;
      const flutter = Math.sin(input.t * (4 + s.len * 0.08) + s.phase) * (0.5 + Math.abs(input.wind) * 0.12) * flex;
      const tx = U.clamp(ix * flex * s.len * 0.06, -s.len * 0.75, s.len * 0.75) + flutter;
      const ty = U.clamp(iy * flex * s.len * 0.05, -s.len * 0.6, s.len * 0.5) + flutter * 0.4;
      const k = 160 * (s.stiff || 1), d = 11;
      const steps = dt > 0.02 ? 2 : 1;
      const h = Math.min(dt, 0.05) / steps;
      for (let i = 0; i < steps; i++) {
        s.vx += ((tx - s.ox) * k - s.vx * d) * h;
        s.vy += ((ty - s.oy) * k - s.vy * d) * h;
        s.ox += s.vx * h;
        s.oy += s.vy * h;
      }
    }
  }

  function drawStrands(ctx, strands, colors) {
    ctx.lineCap = 'round';
    for (const s of strands) {
      const a = s.ang;
      const ex = s.x + Math.cos(a) * s.len + s.ox, ey = s.y + Math.sin(a) * s.len + s.oy;
      const cx = s.x + Math.cos(a + s.curl) * s.len * 0.55 + s.ox * 0.35;
      const cy = s.y + Math.sin(a + s.curl) * s.len * 0.55 + s.oy * 0.35;
      ctx.strokeStyle = colors[s.col % colors.length];
      ctx.lineWidth = s.w;
      ctx.globalAlpha = s.alpha || 0.9;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.quadraticCurveTo(cx, cy, ex, ey);
      if (s.hook) {
        // rizo final
        const ha = Math.atan2(ey - cy, ex - cx) + s.hook;
        ctx.quadraticCurveTo(ex + Math.cos(ha) * 3, ey + Math.sin(ha) * 3, ex + Math.cos(ha + s.hook) * 4, ey + Math.sin(ha + s.hook) * 4);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  JHS.Rig = { kneeForward, part, limb, footCycle, makeStrands, stepStrands, drawStrands };
})(window.JHS = window.JHS || {});
