#!/usr/bin/env node
/* Prueba de recorrido: abre index.html en Chromium sin ventana, juega el nivel completo con un
   «bot» (inyecta controles dentro del bucle del juego, a velocidad x6) y comprueba que:
     - la carga termina y no hay errores en la página;
     - se puede llegar al mirador y a la pantalla final sin caerse;
     - el cofre da la página del diario y la oveja llega con la niña;
     - las tres páginas de la hoja de personajes se dibujan.
     - recoge campanillas, sacude el árbol (cae una semilla escondida), llama a la oveja y, al
       final, la niña regala el ramillete al Pastor.
   Uso:  npm test   (o  node tools/recorrido.js [--capturas carpeta]) */
'use strict';
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const shotsArg = process.argv.indexOf('--capturas');
const shotsDir = shotsArg > 0 ? path.resolve(process.argv[shotsArg + 1]) : null;

function bot() {
  const G = JHS.G;
  // paso fijo: la simulación no depende de lo rápido que pinte el navegador sin ventana
  G.fixedDt = 1 / 60;
  G.timeScale = 6;
  G.botLog = [];
  G.fails = 0;
  let jumpHold = 0, lastX = 0, stuckT = 0;
  const log = (m) => G.botLog.push(`[${G.playTime.toFixed(1)} s · x=${G.body.x.toFixed(0)}] ${m}`);
  const jumpAt = [1625, 1985, 2720, 3335, 3515, 5062, 7040];
  const done = new Set();
  const seen = new Set();
  const once = (k, m) => { if (!seen.has(k)) { seen.add(k); log(m); } };
  JHS.debug.bot = (G, inp, dt) => {
    const b = G.body;
    inp.x = 1; inp.run = true; inp.jump = false; inp.up = false; inp.down = false;
    if (jumpHold > 0) jumpHold -= dt;
    if ((b.x > 3150 && b.x < 3800) || (b.x > 4500 && b.x < 4640) || (b.x > 6820 && b.x < 7130)) inp.run = false;
    for (const jx of jumpAt) {
      if (!done.has(jx) && b.x >= jx && b.x < jx + 40 && b.grounded) { done.add(jx); inp.jump = true; jumpHold = 0.35; }
    }
    // escalera
    if (b.x > 4580 && b.x < 4612 && b.y > 600 && !b.climbing && b.grounded) { inp.x = 0; inp.up = true; }
    if (b.climbing) { inp.x = 0; inp.up = true; once('climb', 'trepa la escalera'); }
    // roca: empujarla hasta el escalón, subir a ella y saltar al escalón
    const p = G.world.pushables[0];
    if (b.x > 5700 && b.x < 6160 && b.y > 400) {
      inp.run = false;
      if (p.x + p.w >= p.stopX - 0.5) {
        once('boulder', 'la roca llega al escalón');
        if (b.grounded && b.y > 440) { inp.x = b.x < p.x - 40 ? 1 : -1; if (b.x > p.x - 60 && b.x < p.x - 30 && b.vx > 0) { inp.jump = true; jumpHold = 0.35; } }
        if (b.grounded && Math.abs(b.y - p.y) < 3 && b.x > p.x + p.w - 40) { inp.jump = true; jumpHold = 0.4; }
      }
    }
    // campanillas: recogerlas al pasar (sin diálogo abierto)
    const f = G.items.flowerNear(b.x);
    if (f && b.grounded && !G.girl.action && !JHS.UI.dlg && !G.autoWalk) { inp.act = true; once('flower' + f.x, 'recoge una campanilla'); }
    // sacudir el árbol del escalón: cae una semilla escondida
    const tr = 4980;
    if (!seen.has('shake') && Math.abs(b.x - tr) < 45 && b.grounded && Math.abs(b.y - G.world.groundY(tr)) < 20 && !G.girl.action) {
      // si el Pastor aún habla, se espera junto al árbol pasando sus frases
      inp.x = 0;
      if (JHS.UI.dlg) { if (JHS.UI.dlg.t > 0.5) inp.act = true; }
      else { inp.act = true; once('shake', 'sacude el árbol'); }
    }
    // llamar a la oveja una vez tras el primer farol
    if (b.x > 2400 && !seen.has('call') && b.grounded && !G.girl.action) { inp.call = true; once('call', 'llama a la oveja'); }
    // cofre
    const c = G.items.chest;
    if (!c.open && c.opening < 0 && Math.abs(b.x - c.x) < 40 && b.grounded) { inp.act = true; once('chest', 'abre el cofre'); }
    if (c.opening >= 0 && c.opening < 1.3) inp.x = 0;
    // obstáculo sin salto programado: saltar
    const busy = !!JHS.UI.pageView || !!G.girl.action || !!G.autoWalk;
    if (Math.abs(b.x - lastX) < 0.5 && !b.climbing && !G.cine && !busy) {
      stuckT += dt;
      if (stuckT > 0.6) { inp.jump = true; jumpHold = 0.4; stuckT = 0; }
    } else stuckT = 0;
    lastX = b.x;
    inp.jumpHeld = inp.jump || jumpHold > 0;
    if (G.cine) once('cine', 'llega al mirador');
    if (G.failing && !G._failLogged) { G._failLogged = true; G.fails++; log('caída'); }
    if (!G.failing) G._failLogged = false;
  };
  JHS.debug.play();
}

(async () => {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const t0 = Date.now();
  await page.goto('file://' + path.join(ROOT, 'index.html'));
  await page.waitForFunction(() => window.JHS && JHS.G && JHS.G.state !== 'loading', null, { timeout: 90000 });
  const load = await page.evaluate(() => ({ steps: JHS.G.loadTimes, mem: JHS.debug.memory() }));
  console.log(`Carga: ${((Date.now() - t0) / 1000).toFixed(1)} s · memoria de capas: ${load.mem.total} MB`);
  if (shotsDir) await page.screenshot({ path: path.join(shotsDir, 'titulo.png') });

  await page.evaluate(bot);
  let st;
  const tEnd = Date.now() + 240000;
  while (Date.now() < tEnd) {
    await page.waitForTimeout(1500);
    st = await page.evaluate(() => ({ state: JHS.G.state, x: Math.round(JHS.G.body.x), seeds: JHS.G.items.found, total: JHS.G.items.seeds.length, page: JHS.G.items.page, fails: JHS.G.fails, sheepX: Math.round(JHS.G.sheep.x), time: JHS.G.playTime,
      flowers: JHS.G.items.picked, flowersTotal: JHS.G.items.flowers.length, gift: !!JHS.G.shep.flowers,
      missed: JHS.G.items.seeds.filter((s) => !s.taken).map((s) => `${s.x},${Math.round(s.y)}${s.secret ? ' (secreta)' : ''}`) }));
    if (st.state === 'end') break;
  }
  console.log((await page.evaluate(() => JHS.G.botLog)).join('\n'));
  if (shotsDir) await page.screenshot({ path: path.join(shotsDir, 'final.png') });

  // hoja de personajes
  await page.evaluate(() => { JHS.debug.bot = null; JHS.debug.setState('sheet'); });
  for (let i = 0; i < 3; i++) {
    await page.waitForTimeout(800);
    if (shotsDir) await page.screenshot({ path: path.join(shotsDir, `hoja_${i + 1}.png`) });
    await page.evaluate(() => JHS.Sheet.nav(1));
  }
  await browser.close();

  const checks = [
    ['llega a la pantalla final', st && st.state === 'end'],
    ['sin caídas', st && st.fails === 0],
    ['página del diario encontrada', st && st.page],
    ['la oveja llega al mirador', st && st.sheepX > 8000],
    ['semillas recogidas (al menos 6, una sacudiendo el árbol)', st && st.seeds >= 6],
    ['campanillas recogidas (al menos 3)', st && st.flowers >= 3],
    ['las campanillas se regalan al Pastor en el mirador', st && st.gift],
    ['sin errores en la página', errors.length === 0],
  ];
  console.log(`\nSemillas: ${st && st.seeds}/${st && st.total} · campanillas: ${st && st.flowers}/${st && st.flowersTotal} · tiempo de juego: ${st && st.time.toFixed(1)} s`);
  if (st && st.missed.length) console.log(`Semillas sin recoger: ${st.missed.join(' · ')}`);
  for (const [name, ok] of checks) console.log(`${ok ? '✔' : '✘'} ${name}`);
  if (errors.length) console.log('Errores:\n' + errors.slice(0, 10).join('\n'));
  process.exit(checks.every(([, ok]) => ok) ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
