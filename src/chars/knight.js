/* El Caballero de la Niebla (Mundo 1, ficha: «Lectura y encuentro»). Guardián simbólico de la
   Colina de las Piedras, hecho de niebla lavanda y pigmento transparente: yelmo con penacho,
   hombreras, capa que se deshace en bruma, una lanza de madera clara y un cuerno. No tiene rostro
   ni hace daño: sus olas de niebla solo empujan hacia atrás. Avisa siempre antes de soltarlas:
   forma (la lanza baja o sube), dirección (mira hacia quien llega), sonido (el cuerno) y
   preparación (la niebla se junta en la punta). Al encenderse el farol de la colina se arrodilla
   y se disuelve. Se mueve sin deformarse: solo giros y desplazamientos rígidos. */
(function (JHS) {
  'use strict';
  const U = JHS.U, Paint = JHS.Paint, Rig = JHS.Rig;

  const RES = 1.4;
  const POST = { edge: 0.25, grain: 0.3, density: 0.1 };
  const COL = {
    mist: '#b9b1c7', mistDeep: '#8f88a6', mistLit: '#efe6e0', armor: '#a9a3bb', armorLit: '#dcd5df', armorDeep: '#77708f',
    ink: '#5d5670', lance: '#d8c7a6', lanceShade: '#a99475', gold: '#f3dca6',
  };
  const S = {};
  let built = false;
  const H = 330;

  // Cuerpo: capa larga que cae hasta el suelo y se deshace en bruma, sobreveste con un sol
  // dorado bordado (guarda el valle; la luz es su señal), cota de malla en motas, hombreras
  // redondas y un yelmo redondo sin rostro con un penacho de niebla que ondea hacia atrás.
  function paintBody(g) {
    const rng = U.makeRng(901);
    // capa por detrás, ancha abajo, con jirones que se van con el viento
    const cape = U.spline([[-4, -266], [-30, -246], [-48, -170], [-62, -84], [-80, -8], [-46, 6], [-12, -4], [18, 4], [42, -4], [48, -60], [36, -180], [20, -258]], 3, true);
    Paint.wash(g, cape, COL.mist, { layers: 6, alpha: 0.22, amp: 2, seed: 902, edge: 0.08, core: 0.5, vary: COL.mistDeep, varyAmt: 0.45 });
    Paint.within(g, cape, () => {
      Paint.shade(g, [[-90, -210], [-22, -210], [-30, 12], [-90, 12]], COL.mistDeep, { layers: 4, alpha: 0.2, amp: 6, seed: 903, edge: 0 });
      for (let i = 0; i < 6; i++) {
        const x = U.lerp(-64, 40, (i + 0.5) / 6) + rng.range(-4, 4);
        Paint.shade(g, [[x - 2, -190], [x + 2, -190], [x + 6 - i, 8], [x - 5 - i, 8]], COL.mistDeep, { layers: 3, alpha: 0.12, amp: 3, seed: 904 + i, edge: 0 });
      }
      Paint.wash(g, [[10, -250], [40, -200], [44, -40], [24, -30]], COL.mistLit, { layers: 3, alpha: 0.18, amp: 4, seed: 905, edge: 0 });
    });
    for (let i = 0; i < 10; i++) Paint.wash(g, U.blobPoly(rng.range(-84, 48), rng.range(-26, 8), rng.range(14, 32), rng.range(5, 10), 10, rng, 0.35), COL.mistLit, { layers: 3, alpha: 0.14, amp: 3, seed: 910 + i, edge: 0 });
    // piernas que se disuelven en la niebla del suelo
    for (const [x, w] of [[-14, 14], [12, 14]]) Paint.wash(g, [[x - w / 2, -88], [x + w / 2, -88], [x + w / 2 + 2, -18], [x - w / 2 - 2, -18]], COL.armorDeep, { layers: 3, alpha: 0.26, amp: 1, seed: 930 + x, edge: 0.1 });
    // cota de malla (motas) y sobreveste
    const coat = U.spline([[-22, -214], [24, -214], [30, -150], [34, -92], [22, -78], [0, -82], [-24, -78], [-34, -92], [-30, -150]], 3, true);
    Paint.wash(g, coat, COL.armor, { layers: 5, alpha: 0.26, amp: 0.8, seed: 920, edge: 0.16, core: 0.7, vary: COL.armorLit, varyAmt: 0.4 });
    Paint.within(g, coat, () => {
      Paint.splatter(g, 0, -150, 32, 66, 420, COL.armorDeep, { alpha: 0.22, rmin: 0.5, rmax: 1, seed: 921 });
      const tab = U.spline([[-15, -212], [17, -212], [20, -120], [12, -84], [0, -78], [-12, -84], [-18, -120]], 3, true);
      Paint.wash(g, tab, '#cfc6d8', { layers: 4, alpha: 0.4, amp: 0.4, seed: 922, edge: 0.2, core: 0.9 });
      Paint.within(g, tab, () => Paint.wash(g, [[4, -214], [22, -214], [22, -80], [8, -80]], COL.armorLit, { layers: 2, alpha: 0.3, amp: 1, seed: 923, edge: 0 }));
      Paint.ink(g, tab, { closed: true, w: 0.9, alpha: 0.45, color: COL.ink, seed: 924, breaks: 0.3 });
      // el sol bordado: disco dorado y rayos cortos
      g.save(); g.translate(2, -168);
      g.strokeStyle = U.rgba(COL.gold, 0.85); g.lineWidth = 1.4; g.lineCap = 'round';
      for (let i = 0; i < 12; i++) { const an = i / 12 * U.TAU; g.beginPath(); g.moveTo(Math.cos(an) * 7, Math.sin(an) * 7); g.lineTo(Math.cos(an) * 11.5, Math.sin(an) * 11.5); g.stroke(); }
      g.fillStyle = U.rgba(COL.gold, 0.9); g.beginPath(); g.arc(0, 0, 5.5, 0, U.TAU); g.fill();
      g.restore();
    });
    Paint.ink(g, coat, { closed: true, w: 1.2, alpha: 0.5, color: COL.ink, seed: 925, breaks: 0.3, sketch: 0.3 });
    // cinto con el cuerno
    Paint.wash(g, [[-30, -104], [32, -106], [32, -98], [-30, -96]], '#8f87a3', { layers: 2, alpha: 0.7, amp: 0.2, seed: 926, edge: 0.3, core: 1 });
    const horn = U.spline([[-20, -98], [-31, -86], [-35, -72], [-29, -68], [-24, -80], [-15, -92]], 3, true);
    Paint.wash(g, horn, COL.lance, { layers: 3, alpha: 0.75, amp: 0.3, seed: 970, edge: 0.3, core: 1 });
    Paint.ink(g, horn, { closed: true, w: 1, alpha: 0.6, color: '#6e5a3e', seed: 971 });
    // hombreras redondas, en dos láminas
    for (const [x, d] of [[-24, -1], [24, 1]]) {
      for (let k = 0; k < 2; k++) {
        const yy = -220 + k * 9;
        const pl = U.spline([[x - 17 * d, yy], [x + 2 * d, yy - 11], [x + 19 * d, yy + 1], [x + 16 * d, yy + 13], [x - 13 * d, yy + 14]], 3, true);
        Paint.wash(g, pl, d > 0 ? COL.armorLit : COL.armor, { layers: 4, alpha: 0.34, amp: 0.4, seed: 940 + x + k, edge: 0.25, core: 0.85 });
        Paint.ink(g, pl, { closed: true, w: 1, alpha: 0.5, color: COL.ink, seed: 941 + x + k, breaks: 0.2 });
      }
    }
    // yelmo redondo con cimera y una rendija de luz suave (sin rostro)
    const helm = U.spline([[-14, -230], [-17, -252], [-11, -270], [2, -278], [15, -272], [20, -254], [16, -232], [2, -226]], 3, true);
    Paint.wash(g, helm, COL.armor, { layers: 5, alpha: 0.36, amp: 0.4, seed: 950, edge: 0.25, core: 0.9, vary: COL.armorLit, varyAmt: 0.5 });
    Paint.within(g, helm, () => {
      Paint.wash(g, [[4, -280], [22, -272], [22, -230], [9, -230]], COL.armorLit, { layers: 3, alpha: 0.32, amp: 1, seed: 951, edge: 0 });
      Paint.ink(g, [[2, -279], [3, -226]], { w: 1.4, alpha: 0.4, color: COL.ink, seed: 954 });
    });
    Paint.ink(g, [[-8, -252], [17, -253]], { w: 2.4, alpha: 0.6, color: COL.gold, seed: 952 });
    Paint.ink(g, helm, { closed: true, w: 1.2, alpha: 0.6, color: COL.ink, seed: 953, breaks: 0.15 });
    // penacho de niebla que ondea hacia atrás
    for (let i = 0; i < 8; i++) Paint.wash(g, U.blobPoly(-4 - i * 10, -282 + i * 7 + Math.sin(i) * 3, 11 - i * 0.8, 5.4 - i * 0.3, 9, rng, 0.3), i % 2 ? COL.mistLit : '#d8d0e2', { layers: 3, alpha: 0.3, amp: 1, seed: 960 + i, edge: 0 });
  }

  // Lanza: asta de madera clara, punta en hoja y un banderín de niebla (gira desde la mano).
  function paintLance(g) {
    const L = 250;
    Paint.wash(g, [[-2.4, 40], [2.4, 40], [2, -L], [-2, -L]], COL.lance, { layers: 3, alpha: 0.75, amp: 0.3, seed: 980, edge: 0.3, core: 1 });
    Paint.wash(g, [[0.6, 40], [2.4, 40], [2, -L], [0.4, -L]], COL.lanceShade, { layers: 2, alpha: 0.4, amp: 0.2, seed: 981, edge: 0 });
    const tip = U.spline([[0, -L - 34], [6, -L - 12], [3, -L + 2], [-3, -L + 2], [-6, -L - 12]], 3, true);
    Paint.wash(g, tip, COL.armorLit, { layers: 3, alpha: 0.6, amp: 0.2, seed: 982, edge: 0.3, core: 1 });
    Paint.ink(g, tip, { closed: true, w: 1, alpha: 0.6, color: COL.ink, seed: 983 });
    Paint.wash(g, [[2, -L + 10], [40, -L + 22], [30, -L + 34], [44, -L + 46], [2, -L + 40]], COL.mistLit, { layers: 3, alpha: 0.35, amp: 1, seed: 984, edge: 0.15 });
  }

  // Ola de niebla pintada: un banco de bruma hecho de volutas redondas (como una nube que
  // rueda) con el frente a la izquierda y la cola que se deshace a la derecha. La baja se
  // apoya en el suelo; la alta flota a la altura de la cabeza.
  function paintWave(g, high) {
    const rng = U.makeRng(high ? 991 : 992);
    const R0 = high ? 44 : 36;
    const bill = [];
    for (let i = 0; i < 6; i++) {
      const r = R0 * (1 - i * 0.12) * rng.range(0.92, 1.06);
      bill.push([R0 + i * R0 * 0.8, high ? rng.range(-7, 7) : -r * 0.82, r]);
    }
    // cuerpo: volutas en húmedo, cada vez más transparentes hacia la cola
    for (const [i, [x, y, r]] of bill.entries()) {
      const k = 1 - i / bill.length;
      Paint.wash(g, U.blobPoly(x, y, r * 1.08, r * (high ? 0.7 : 0.86), 18, rng, 0.1), '#a39bba', { layers: 6, alpha: 0.08 + 0.1 * k, amp: 3, seed: 993 + i, edge: 0.05, vary: '#cfc7dc', varyAmt: 0.5 });
      Paint.wash(g, U.blobPoly(x + r * 0.15, y - r * 0.3, r * 0.6, r * 0.34, 12, rng, 0.2), '#f1ecf4', { layers: 3, alpha: 0.16 + 0.12 * k, amp: 2, seed: 1003 + i, edge: 0 });
      Paint.shade(g, U.blobPoly(x - r * 0.1, y + r * 0.42, r * 0.8, r * 0.26, 12, rng, 0.2), '#7c7495', { layers: 3, alpha: 0.12 + 0.08 * k, amp: 2, seed: 1013 + i, edge: 0 });
    }
    // remolinos: espirales de pincel claro que giran dentro del banco
    for (let k = 0; k < 4; k++) {
      const [bx, by, br] = bill[k];
      const sp = [];
      for (let an = 0; an < 4.8; an += 0.3) sp.push([bx + Math.cos(an + 2.6) * br * 0.45 * (1 - an / 7), by + Math.sin(an + 2.6) * br * 0.45 * (1 - an / 7)]);
      Paint.ink(g, sp, { w: 1.5, alpha: 0.5 - k * 0.08, color: '#f6f2f8', seed: 1023 + k, taper: 0.5 });
    }
    // el frente que rueda: la curva clara de la primera voluta, con una tinta suave
    const [fx, fy, fr] = bill[0];
    const fc = [];
    for (let an = Math.PI * 0.55; an <= Math.PI * 1.45; an += 0.12) fc.push([fx + Math.cos(an) * fr * 1.02, fy + Math.sin(an) * fr * (high ? 0.72 : 0.88)]);
    Paint.ink(g, fc, { w: 3.2, alpha: 0.8, color: '#f7f3f9', seed: 1027, taper: 0.35 });
    Paint.ink(g, fc.map(([x, y]) => [x - 3, y]), { w: 1.1, alpha: 0.45, color: '#6d6585', seed: 1028, taper: 0.45, breaks: 0.25 });
    // jirones que se sueltan por arriba de la cola
    for (let i = 0; i < 5; i++) {
      const [bx, by, br] = bill[1 + (i % 5)];
      Paint.wash(g, U.blobPoly(bx + rng.range(-8, 14), by - br * (high ? 0.7 : 0.9) - rng.range(2, 10), rng.range(9, 16), rng.range(3, 5), 9, rng, 0.35), '#ddd6e4', { layers: 2, alpha: 0.3, amp: 2, seed: 1030 + i, edge: 0 });
    }
  }

  function build() {
    if (built) return;
    Paint.withInk(1.2, () => {
      S.body = Paint.makeSprite({ w: 160, h: 320, ox: 90, oy: 300, res: RES, post: POST }, paintBody);
      S.lance = Paint.makeSprite({ w: 70, h: 340, ox: 20, oy: 296, res: RES, post: POST }, paintLance);
      S.waveLow = Paint.makeSprite({ w: 250, h: 100, ox: 16, oy: 84, res: 1.2, post: { edge: 0.2, grain: 0.22, density: 0.08 } }, (g) => paintWave(g, false));
      S.waveHigh = Paint.makeSprite({ w: 290, h: 130, ox: 16, oy: 65, res: 1.2, post: { edge: 0.2, grain: 0.22, density: 0.08 } }, (g) => paintWave(g, true));
    });
    built = true;
  }

  function create(x, y) {
    return { x, y, facing: -1, alpha: 1, t: 0, state: 'stand', stateT: 0, lance: 0, lanceV: 0, gather: 0, kneel: 0, puffs: [] };
  }

  // estado: 'stand' · 'windLow' (lanza abajo) · 'windHigh' (lanza arriba) · 'kneel' (se rinde a la luz)
  function setState(k, st) { if (k.state !== st) { k.state = st; k.stateT = 0; } }

  function update(k, dt) {
    k.t += dt;
    k.stateT += dt;
    // ángulo de la lanza (0 = de pie; + hacia delante y abajo; − hacia delante y arriba)
    const target = k.state === 'windLow' ? 1.85 : k.state === 'windHigh' ? 0.78 : k.state === 'kneel' ? 1.72 : 0.12 + Math.sin(k.t * 0.7) * 0.02;
    k.lanceV += ((target - k.lance) * 28 - k.lanceV * 7.5) * dt;
    k.lance += k.lanceV * dt;
    k.gather = U.damp(k.gather, k.state === 'windLow' || k.state === 'windHigh' ? 1 : 0, 3.2, dt);
    k.kneel = U.damp(k.kneel, k.state === 'kneel' ? 1 : 0, 1.6, dt);
    if (k.state === 'kneel' && k.stateT > 1.6) k.alpha = Math.max(0, k.alpha - dt * 0.45);
    // bruma que le sale de los pies y de la capa (deriva despacio, nunca brilla)
    if (k.alpha > 0.05 && Math.random() < dt * 7) k.puffs.push({ x: k.x + U.lerp(-70, 50, Math.random()), y: k.y - Math.random() * 40, r: 16 + Math.random() * 22, t: 0, life: 2.4 + Math.random() * 1.6, vx: -8 - Math.random() * 10, vy: -6 - Math.random() * 8 });
    for (let i = k.puffs.length - 1; i >= 0; i--) {
      const p = k.puffs[i];
      p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += dt * 6;
      if (p.t > p.life) k.puffs.splice(i, 1);
    }
  }

  // Punta de la lanza en el mundo (donde se junta la niebla antes de soltar la ola).
  function tipAt(k) {
    const hx = k.x + k.facing * 26, hy = k.y - 150 + k.kneel * 60;
    return [hx + k.facing * Math.sin(k.lance) * 280, hy - Math.cos(k.lance) * 280];
  }

  function draw(ctx, k, puff) {
    if (k.alpha <= 0.01) return;
    ctx.save();
    // bruma de los pies (detrás del cuerpo)
    if (puff) for (const p of k.puffs) {
      const a = Math.sin(Math.PI * p.t / p.life) * 0.22 * k.alpha;
      ctx.globalAlpha = a;
      ctx.drawImage(puff.c, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    ctx.globalAlpha = 1;
    ctx.translate(k.x, k.y);
    ctx.scale(k.facing, 1);
    const bob = Math.sin(k.t * 1.1) * 2;
    Rig.faded(ctx, k.alpha * 0.92, [-110, -330, 120, 20], (c) => {
      c.save();
      c.translate(0, bob + k.kneel * 60);
      c.rotate(k.kneel * 0.12);
      Rig.part(c, S.body, 0, 0);
      // la lanza en la mano de delante
      Rig.part(c, S.lance, 26, -150, k.lance);
      c.restore();
    });
    ctx.restore();
    // la niebla que se junta en la punta antes de soltar la ola (anuncio, sin destellos)
    if (k.gather > 0.02 && puff) {
      const [tx, ty] = tipAt(k);
      ctx.save();
      const R = 22 + k.gather * 40 + Math.sin(k.t * 6) * 3;
      ctx.globalAlpha = 0.55 * k.gather * k.alpha;
      ctx.drawImage((k.deep || puff).c, tx - R, ty - R, R * 2, R * 2);
      ctx.globalAlpha = 0.7 * k.gather * k.alpha;
      ctx.drawImage(puff.c, tx - R * 0.6, ty - R * 0.6, R * 1.2, R * 1.2);
      ctx.restore();
    }
  }

  JHS.Knight = { S, build, create, update, draw, setState, tipAt, COL, H };
})(window.JHS = window.JHS || {});
