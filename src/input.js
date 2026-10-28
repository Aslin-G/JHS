/* Entrada: teclado, mando y pantalla táctil. La respuesta debe ser inmediata (§65). */
(function (JHS) {
  'use strict';

  const keys = new Set();
  const pressed = new Set();
  const map = {
    left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
    jump: ['Space', 'KeyZ', 'KeyK'], run: ['ShiftLeft', 'ShiftRight', 'KeyX', 'KeyJ'], act: ['KeyE', 'KeyF', 'Enter', 'NumpadEnter'],
    call: ['KeyC', 'KeyQ'], pause: ['Escape', 'KeyP'], sheet: ['KeyH'], mute: ['KeyM'],
  };
  const touch = { active: false, ids: new Map(), btn: {}, prevBtn: {}, lastDirTap: { dir: 0, t: 0 }, runLatch: false };
  const gp = { btn: {}, prev: {} };

  function onKey(e, down) {
    const k = e.code;
    if (down) { if (!keys.has(k)) pressed.add(k); keys.add(k); }
    else keys.delete(k);
    for (const a in map) if (map[a].includes(k)) { e.preventDefault(); break; }
  }

  // Botones táctiles en coordenadas lógicas (1920×1080).
  const BTN = {
    left: { x: 150, y: 950, r: 78 }, right: { x: 335, y: 950, r: 78 },
    jump: { x: 1770, y: 930, r: 86 }, act: { x: 1585, y: 990, r: 62 }, up: { x: 242, y: 800, r: 56 },
    down: { x: 242, y: 1030, r: 40 }, call: { x: 1600, y: 840, r: 46 },
    pause: { x: 1840, y: 80, r: 44 },
  };

  let toLogical = null;
  function touchUpdate(list) {
    const now = {};
    for (const t of list) {
      const [x, y] = toLogical(t.clientX, t.clientY);
      for (const b in BTN) {
        const B = BTN[b];
        if (Math.hypot(x - B.x, y - B.y) < B.r * 1.25) now[b] = true;
      }
    }
    // doble toque sostenido en una dirección = correr
    for (const d of ['left', 'right']) {
      if (now[d] && !touch.btn[d]) {
        const t = performance.now();
        if (touch.lastDirTap.dir === d && t - touch.lastDirTap.t < 330) touch.runLatch = true;
        touch.lastDirTap = { dir: d, t };
      }
    }
    if (!now.left && !now.right) touch.runLatch = false;
    touch.btn = now;
  }

  function init(canvas, toLogicalFn) {
    toLogical = toLogicalFn;
    window.addEventListener('keydown', (e) => onKey(e, true));
    window.addEventListener('keyup', (e) => onKey(e, false));
    window.addEventListener('blur', () => keys.clear());
    const tl = (e) => { e.preventDefault(); touch.active = true; touchUpdate(e.touches); };
    canvas.addEventListener('touchstart', (e) => { tl(e); Input.tapped = true; Input.tapPos = toLogical(e.changedTouches[0].clientX, e.changedTouches[0].clientY); }, { passive: false });
    canvas.addEventListener('touchmove', tl, { passive: false });
    canvas.addEventListener('touchend', tl, { passive: false });
    canvas.addEventListener('touchcancel', tl, { passive: false });
    canvas.addEventListener('mousedown', (e) => { Input.tapped = true; Input.tapPos = toLogical(e.clientX, e.clientY); Input.mouse = true; });
  }

  function pollGamepad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const p = pads && Array.from(pads).find((x) => x && x.connected);
    gp.prev = gp.btn;
    gp.btn = {};
    if (!p) return;
    const b = (i) => p.buttons[i] && p.buttons[i].pressed;
    const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
    gp.btn.left = ax < -0.35 || b(14);
    gp.btn.right = ax > 0.35 || b(15);
    gp.btn.up = ay < -0.5 || b(12);
    gp.btn.down = ay > 0.5 || b(13);
    gp.btn.jump = b(0);
    gp.btn.run = b(2) || b(7) || b(5);
    gp.btn.act = b(1);
    gp.btn.call = b(3);
    gp.btn.pause = b(9);
    gp.x = Math.abs(ax) > 0.35 ? Math.sign(ax) : 0;
  }

  const Input = {
    BTN, touch, tapped: false, tapPos: null, mouse: false,
    init,
    down(a) {
      if (map[a] && map[a].some((k) => keys.has(k))) return true;
      if (gp.btn[a]) return true;
      if (touch.btn[a]) return true;
      if (a === 'run' && touch.runLatch) return true;
      return false;
    },
    hit(a) {
      if (map[a] && map[a].some((k) => pressed.has(k))) return true;
      if (gp.btn[a] && !gp.prev[a]) return true;
      if (touch.btn[a] && !touch.prevBtn[a]) return true;
      return false;
    },
    axisX() { return (this.down('right') ? 1 : 0) - (this.down('left') ? 1 : 0); },
    anyKey() { return pressed.size > 0 || this.tapped || Object.keys(gp.btn).some((k) => gp.btn[k] && !gp.prev[k]); },
    begin() { pollGamepad(); },
    end() { pressed.clear(); touch.prevBtn = Object.assign({}, touch.btn); this.tapped = false; },
  };

  JHS.Input = Input;
})(window.JHS = window.JHS || {});
