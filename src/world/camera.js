/* Cámara lateral (§16, §49): sigue con suavidad, se adelanta al movimiento, deja a la niña
   cerca del 40 % horizontal mirando hacia delante y hace un alejamiento cinematográfico
   en el mirador. Nunca salta: todo se interpola. */
(function (JHS) {
  'use strict';
  const U = JHS.U;

  const FRAME_Y = 236; // los pies quedan ~74 % hacia abajo: más cielo y menos corte de tierra
  const ZOOM = 1.12;   // encuadre de juego: la niña ocupa ~18 % del alto de pantalla

  function Camera(x, y) {
    this.x = x; this.y = y; this.z = ZOOM;
    this.look = 192; this.refY = y + FRAME_Y; this.mode = 'follow';
    this.cine = null;
    this.shake = 0;
  }

  Camera.prototype.follow = function (b, dt, L) {
    const z = this.z;
    const viewW = 1920 / z;
    // la niña queda al ~40 % de la pantalla: el centro va un 10 % por delante de ella
    const want = b.facing * 0.1 * viewW + U.clamp(b.vx * 0.22, -110, 110);
    this.look = U.damp(this.look, want, 1.5, dt);
    const tx = b.x + this.look;
    // ajuste vertical por plataformas: solo se mueve al apoyar o al salir de un margen
    if (b.grounded || b.climbing) this.refY = U.damp(this.refY, b.y, 5, dt);
    else if (b.y > this.refY + 70) this.refY = U.damp(this.refY, b.y - 70, 6, dt);
    else if (b.y < this.refY - 240) this.refY = U.damp(this.refY, b.y + 240, 6, dt);
    // al agacharse un rato, la cámara se asoma hacia abajo
    const ty = this.refY - FRAME_Y / z + (this.peek || 0);
    this.x = U.damp(this.x, tx, 4, dt);
    this.y = U.damp(this.y, ty, b.grounded ? 3.2 : 2.2, dt);
    this.clamp(L);
  };

  Camera.prototype.clamp = function (L) {
    const hw = 960 / this.z, hh = 540 / this.z;
    this.x = Math.max(this.x, L.bounds.left - 120 + hw);
    if (L.camRight != null) this.x = Math.min(this.x, L.camRight - hw);
    this.y = Math.min(this.y, (L.bottom || 1460) - 40 - hh);
    if (L.camTop != null) this.y = Math.max(this.y, L.camTop + hh);
  };

  // Movimiento de cámara guionizado: hacia (x, y, z) con una duración y curva suave.
  Camera.prototype.moveTo = function (x, y, z, dur) {
    this.cine = { fx: this.x, fy: this.y, fz: this.z, tx: x, ty: y, tz: z, t: 0, dur };
    this.mode = 'cine';
  };

  Camera.prototype.updateCine = function (dt) {
    const c = this.cine;
    if (!c) return;
    c.t = Math.min(c.dur, c.t + dt);
    const k = U.easeInOut(c.t / c.dur);
    this.x = U.lerp(c.fx, c.tx, k);
    this.y = U.lerp(c.fy, c.ty, k);
    this.z = U.lerp(c.fz, c.tz, k);
  };

  Camera.FRAME_Y = FRAME_Y;
  Camera.ZOOM = ZOOM;
  JHS.Camera = Camera;
})(window.JHS = window.JHS || {});
