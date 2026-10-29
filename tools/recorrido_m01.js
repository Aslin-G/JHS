#!/usr/bin/env node
/* Prueba de recorrido del Mundo 1 («Valle del Amanecer»): un bot juega el nivel completo dentro
   del bucle del juego (paso fijo, velocidad x6) y comprueba que:
     - la carga termina y no hay errores en la página;
     - habla con Ester; lleva los tres tablones de la leñera y remienda el puente;
     - repara las tres estaciones de ruta (manteniendo E) y abre el cofre del taller;
     - en la Colina de las Piedras salta las olas bajas y se agacha bajo las altas; al encender el
       farol de la colina el Caballero se arrodilla y la niebla se retira;
     - llega a la mirada final sobre el valle y a la pantalla final sin caerse.
   Uso:  node tools/recorrido_m01.js [--capturas carpeta] */
'use strict';
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const shotsArg = process.argv.indexOf('--capturas');
const shotsDir = shotsArg > 0 ? path.resolve(process.argv[shotsArg + 1]) : null;

function bot() {
  const G = JHS.G, L = G.L;
  G.fixedDt = 1 / 60;
  G.timeScale = 6;
  G.botLog = [];
  G.fails = 0;
  G.hits = 0;
  G.traceWaves = true; G.trace = [];
  let jumpHold = 0, lastX = 0, stuckT = 0, actCool = 0;
  const log = (m) => G.botLog.push(`[${G.playTime.toFixed(1)} s · x=${G.body.x.toFixed(0)}] ${m}`);
  const seen = new Set();
  const once = (k, m) => { if (!seen.has(k)) { seen.add(k); log(m); } };
  const jumpAt = [960, 1580, 2840, 3820, 5380, 5520, 5660, 6040, 6260, 7520, 7620];
  const jumped = new Set();
  JHS.debug.bot = (G, inp, dt) => {
    const b = G.body, M = G.m01, UI = JHS.UI;
    inp.x = 1; inp.run = true; inp.jump = false; inp.up = false; inp.down = false;
    jumpHold = Math.max(0, jumpHold - dt);
    actCool = Math.max(0, actCool - dt);
    const press = () => { if (actCool <= 0) { inp.act = true; actCool = 0.25; } };
    // diálogo abierto: se pasan las frases (E) sin dejar de caminar si no hace falta pararse
    if (UI.dlg && UI.dlg.t > 0.6 && UI.dlg.speaker !== 'El Buen Pastor') press();
    for (const jx of jumpAt) if (!jumped.has(jx) && b.x >= jx && b.x < jx + 50 && b.grounded && !M.carry) { jumped.add(jx); inp.jump = true; jumpHold = 0.4; }
    // Ester: hablar con ella una vez
    if (!seen.has('ester') && G.ester && Math.abs(b.x - G.ester.x) < 80 && b.grounded) {
      inp.x = 0;
      if (!UI.dlg) { press(); if (inp.act) once('ester', 'habla con Ester'); }
    }
    if (UI.dlg && UI.dlg.speaker === 'Ester') inp.x = 0;
    // tablones: de la leñera al hueco siguiente del puente
    const br = G.world.bridge;
    if (br.holes.length && b.x > 1500 && b.x < 2240) {
      inp.run = false;
      if (!M.carry) {
        if (M.pile > 0) {
          const d = L.boards.pile - b.x;
          inp.x = Math.abs(d) < 30 ? 0 : Math.sign(d);
          if (Math.abs(d) < 50 && b.grounded && !G.girl.action) { press(); once('board' + M.pile, 'coge un tablón'); }
        }
      } else {
        const h = br.holes[0];
        const tx = h[0] - 30, d = tx - b.x;
        inp.x = Math.abs(d) < 18 ? 0 : Math.sign(d);
        if (b.x > h[0] - 70 && b.x < h[0] + 6 && b.grounded && !G.girl.action) { press(); once('place' + br.holes.length, 'pone un tablón en el puente'); }
      }
    }
    // estaciones: mantener E junto al farol (si no viene una ola)
    const wavesNear = M.waves.some((w) => Math.abs(w.x - b.x) < 260 && Math.sign(b.x - w.x) === w.dir);
    for (const [i, s] of M.stations.entries()) {
      if (s.lit || Math.abs(b.x - s.x) > 70) continue;
      if (Math.abs(b.x - s.x) > 24) { inp.x = Math.sign(s.x - b.x); inp.run = false; }
      else if (!wavesNear) { inp.x = 0; inp.act = false; JHS.Input && 0; G._hold = true; once('station' + i, `repara la estación ${i + 1}`); }
    }
    // olas de niebla: saltar las bajas, agacharse bajo las altas
    for (const w of M.waves) {
      const d = (b.x - w.x) * w.dir;
      if (d < 0 || d > 210) continue;
      if (w.kind === 'low' && d < 95 && b.grounded) { inp.jump = true; jumpHold = 0.45; once('lowjump' + Math.round(w.t * 0 + w.x / 10000), 'salta una ola baja'); }
      if (w.kind === 'high' && d < 210) { inp.x = 0; inp.down = true; inp.jump = false; once('duck', 'se agacha bajo una ola alta'); }
    }
    // el cofre del taller
    const c = G.items.chest;
    if (c && !c.open && c.opening < 0 && M.prog >= L.chest.needs && Math.abs(b.x - c.x) < 40 && b.grounded) { press(); once('chest', 'abre el cofre'); }
    if (c && c.opening >= 0 && c.opening < 1.3) inp.x = 0;
    // sacudir el olivo de la semilla escondida
    const tr = L.shakeTrees[0].x;
    if (!seen.has('shake') && Math.abs(b.x - tr) < 40 && b.grounded && !G.girl.action && !UI.dlg) { inp.x = 0; press(); once('shake', 'sacude el olivo'); }
    // atascada sin salto previsto: saltar
    const busy = !!UI.pageView || !!G.girl.action || !!G.autoWalk || !!UI.dlg || G._hold;
    if (Math.abs(b.x - lastX) < 0.5 && !G.cine && !busy && inp.x !== 0 && !M.carry) {
      stuckT += dt;
      if (stuckT > 0.6) { inp.jump = true; jumpHold = 0.4; stuckT = 0; }
    } else stuckT = 0;
    lastX = b.x;
    inp.jumpHeld = inp.jump || jumpHold > 0;
    if (G._hold) { inp.actHeld = true; G._hold = false; }
    if (G.traceWaves) for (const w of M.waves) if (w.kind === 'high' && Math.abs(w.x - b.x) < 260) G.trace.push([+G.playTime.toFixed(2), Math.round(w.x - b.x), inp.x, inp.down, G.girl.crouch, +G.girl.crouchK.toFixed(2), b.grounded, G.girl.action, inp.locked]);
    if (M.invuln > 1.15 && !G._hitLogged) { G._hitLogged = true; G.hits++; log(`una ola la empuja (agachada ${G.girl.crouchK.toFixed(2)}, acción ${G.girl.action}, en el suelo ${b.grounded})`); }
    if (M.invuln <= 0) G._hitLogged = false;
    if (M.appeased) once('appeased', 'el Caballero se arrodilla: la niebla se retira');
    if (G.cine) once('cine', 'mirada final sobre el valle');
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
  await page.goto('file://' + path.join(ROOT, 'index.html') + '?mundo=m01');
  await page.waitForFunction(() => window.JHS && JHS.G && JHS.G.state === 'title', null, { timeout: 120000 });
  const load = await page.evaluate(() => ({ mem: JHS.debug.memory() }));
  console.log(`Carga: ${((Date.now() - t0) / 1000).toFixed(1)} s · memoria de capas: ${load.mem.total} MB`);
  if (shotsDir) await page.screenshot({ path: path.join(shotsDir, 'm01_titulo.png') });

  await page.evaluate(bot);
  let st;
  const tEnd = Date.now() + 300000;
  while (Date.now() < tEnd) {
    await page.waitForTimeout(1500);
    st = await page.evaluate(() => {
      const G = JHS.G, M = G.m01;
      return { state: G.state, x: Math.round(G.body.x), seeds: G.items.found, total: G.items.seeds.length, page: G.items.page, fails: G.fails, hits: G.hits,
        placed: M.placed, lit: M.stations.filter((s) => s.lit).length, appeased: M.appeased, prog: M.prog, ester: G.esterCtl.talks, time: G.playTime,
        sheepX: Math.round(G.sheep.x) };
    });
    if (st.state === 'end') break;
  }
  console.log((await page.evaluate(() => JHS.G.botLog)).join('\n'));
  if (process.env.TRAZA) console.log(JSON.stringify(await page.evaluate(() => JHS.G.trace.slice(0, 60))));
  if (shotsDir) await page.screenshot({ path: path.join(shotsDir, 'm01_final.png') });
  await browser.close();

  const checks = [
    ['llega a la pantalla final', st && st.state === 'end'],
    ['sin caídas', st && st.fails === 0],
    ['habla con Ester', st && st.ester > 0],
    ['remienda el puente con los tres tablones', st && st.placed === 3],
    ['repara las tres estaciones de ruta', st && st.lit === 3],
    ['el valle llega al estado restaurado', st && st.prog === 4],
    ['el Caballero se arrodilla y la niebla se retira', st && st.appeased],
    ['página del diario encontrada', st && st.page],
    ['semillas recogidas (al menos 5)', st && st.seeds >= 5],
    ['sin errores en la página', errors.length === 0],
  ];
  console.log(`\nSemillas: ${st && st.seeds}/${st && st.total} · olas que la alcanzan: ${st && st.hits} · tiempo de juego: ${st && st.time.toFixed(1)} s`);
  for (const [name, ok] of checks) console.log(`${ok ? '✔' : '✘'} ${name}`);
  if (errors.length) console.log('Errores:\n' + errors.slice(0, 10).join('\n'));
  process.exit(checks.every(([, ok]) => ok) ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
