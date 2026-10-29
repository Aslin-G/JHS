/* Mundo 1 — «Valle del Amanecer» (Biblia §21; ficha docs/mundos/M01_Ficha_de_Mundo.md).
   Tema: descubrimiento. Un corredor lateral continuo: se llega por la izquierda bajando de las
   colinas, se pasa por la casa de Ester, se remienda el puente del arroyo, se encienden las tres
   estaciones de ruta (taller, cruce de los campos, colina de las piedras) y la niebla del
   Caballero se retira. Coordenadas de mundo; y crece hacia abajo. */
(function (JHS) {
  'use strict';
  const U = JHS.U;

  // Suelo: un solo arroyo corta el camino. La colina final sube en dos escalones de piedra.
  const ground = [
    [[-700, 720], [-300, 735], [0, 752], [300, 770], [600, 786], [900, 798], [1200, 806], [1500, 812], [1700, 815], [1890, 818]],
    [[2210, 818], [2500, 815], [2900, 810], [3300, 806], [3700, 804], [4100, 800], [4500, 796], [4800, 790], [5000, 784],
      [5400, 760], [5700, 732], [5700, 698], [6000, 684], [6300, 664], [6300, 630], [6600, 616], [7000, 604], [7400, 598],
      [7800, 592], [8200, 589], [8600, 587], [9100, 586]],
  ];
  // Altura del suelo en x (fuera del suelo: la de los extremos; sobre el arroyo: la de sus orillas).
  function gy(x) {
    const first = ground[0][0], last = ground[ground.length - 1][ground[ground.length - 1].length - 1];
    if (x <= first[0]) return first[1];
    if (x >= last[0]) return last[1];
    for (let s = 0; s < ground.length; s++) {
      const seg = ground[s];
      for (let i = 1; i < seg.length; i++) {
        const a = seg[i - 1], b = seg[i];
        if (b[0] - a[0] > 0.5 && x >= a[0] && x <= b[0]) return U.lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0]));
      }
      const next = ground[s + 1];
      if (next && x > seg[seg.length - 1][0] && x < next[0][0]) {
        const a = seg[seg.length - 1], b = next[0];
        return U.lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0]));
      }
    }
    return last[1];
  }
  // caja apoyada en el suelo
  const box = (x, w, h, kind) => ({ x, y: Math.round(gy(x + w / 2)) - h, w, h, kind });

  const L = {
    id: 'm01',
    name: 'Valle del Amanecer',
    start: { x: 170 },
    sheepStart: { x: 380 },
    bounds: { left: 40, right: 8960 },
    killY: 1150,
    bottom: 1400,
    gy,
    ground,
    gaps: [{ x0: 1890, x1: 2210, kind: 'stream' }],

    // puente de tablas sobre el arroyo: la tormenta se llevó el tramo central (tres huecos que se
    // tapan con tres tablones); casi rígido, con un lomo leve
    bridge: { x0: 1890, x1: 2210, y0: 818, y1: 818, sag: 3, arch: -4, holes: [[1925, 2008], [2008, 2092], [2092, 2178]] },
    boards: { pile: 1772, n: 3 },
    canal: [2240, 4620],

    // plataformas del plano jugable (nunca del fondo): barriles, la leñera, cajas del taller,
    // un almiar, muros bajos de piedra y las piedras de la colina
    rocks: [
      box(1000, 46, 44, 'barrel'),
      box(1612, 132, 66, 'shed'),
      box(2890, 70, 52, 'crate'), box(2950, 52, 98, 'crate'),
      box(3860, 120, 70, 'hay'),
      box(5420, 150, 40, 'wall'), box(5560, 70, 76, 'wall'),
      box(6080, 84, 58, 'stone'),
      box(7560, 70, 120, 'menhir'), box(7660, 60, 84, 'menhir'),
    ],
    ledges: [
      { x0: 1600, x1: 1756, y: Math.round(gy(1678)) - 92, kind: 'roof', sheep: false },
      { x0: 6130, x1: 6300, y: 552, kind: 'log', sheep: false },
    ],
    ladders: [],
    pushables: [],

    // estaciones de ruta (farol de vidrio y campana): se reparan, no se encienden solas
    stations: [{ x: 2560 }, { x: 4640 }, { x: 7180 }],
    houseLamp: { x: 1060 },
    lanterns: [],
    chest: { x: 3190, page: true, needs: 2 },
    seeds: [
      { x: 1676, y: 640 }, { x: 2050, y: 700 }, { x: 2976, y: 604 }, { x: 3920, y: 660 },
      { x: 4350, y: 520, inTree: 4350, secret: true }, { x: 5600, y: 640 }, { x: 6214, y: 470, secret: true }, { x: 7690, y: 420 },
    ],
    flowers: [],
    shakeTrees: [{ x: 4350 }],
    birds: [{ x: 700, n: 3 }, { x: 3560, n: 3 }, { x: 5900, n: 2 }, { x: 8420, n: 3 }],
    signs: [{ x: 4720, label: 'leer el poste', speaker: 'Poste del cruce',
      lines: ['← Casa de Ester · el puente del arroyo.', '→ Colina de las Piedras · Bosque de los Susurros.'] }],

    // El Pastor guía sin resolver (§31)
    shepherd: [
      { x: 560, face: -1, radius: 300, lines: ['Bienvenida al Valle del Amanecer. Aquí todo despierta despacio.', 'Ester vive junto al arroyo. Le alegrará verte.'], gesture: 'point' },
      { x: 2420, face: -1, radius: 260, lines: ['El puente vuelve a unir las dos orillas.', 'Los faroles del camino también esperan su luz.'], gesture: 'point' },
      { x: 5160, face: 1, radius: 260, lines: ['Allá arriba se levanta la niebla.', 'No es mala: guarda el valle mientras duerme.'], gesture: 'speak' },
      { x: 6520, face: 1, radius: 240, lines: ['Es la niebla del Caballero. Si te alcanza, solo te hará retroceder.', 'Salta las olas bajas y agáchate bajo las altas. La luz abre camino.'], gesture: 'point' },
    ],
    chat: ['Aquí estoy. No vas sola.', 'Fíjate en el Caballero: antes de soltar la niebla, levanta o baja la lanza.',
      'Ester siempre deja una luz encendida en su puerta.', 'Las semillas de luz se esconden donde la gente casi no mira.'],
    callText: '¡Ven, Nuba!',

    ester: { x: 1250, home: 1250 },
    knight: { x: 7420, zone: [6640, 7760], waves: { every: [2.4, 3.4], speed: 330 } },
    finale: { x: 8280, bench: 8360 },

    page: {
      title: 'Página del diario',
      text: ['El valle despertaba despacio,', 'como si esperara a que alguien', 'encendiera la primera luz.'],
    },
    ending: ['Mira el valle: los faroles, las acequias, los campos.', 'Mañana el camino sigue hacia el bosque.'],

    decor: {
      bench: [{ x: 1120 }, { x: 8360 }],
      trees: [
        { x: 380, h: 430, seed: 71, kind: 'olive' },
        { x: 4350, h: 400, seed: 73, kind: 'olive' },
        { x: 6860, h: 460, seed: 75, kind: 'olive' },
        { x: 8130, h: 560, seed: 77, kind: 'olive' },
      ],
    },
    // ambiente (ficha: flores amarillas y blancas, salvia y oliva; hierba que se mueve en grupos)
    ambient: {
      seed: 3100,
      flowerKinds: ['daisy', 'yellow', 'daisy', 'yellow', 'lilac', 'daisy', 'yellow', 'pink'],
      tallFlowers: ['foxglove', 'mullein', 'foxglove', 'mullein'],
      flowerChance: 0.5,
      flowerDense: (x) => x < 1500 || (x > 2300 && x < 3000) || (x > 3600 && x < 4800) || x > 7600,
      avoid: [[1880, 2220]],
      butterflies: [700, 1300, 2700, 3900, 4500, 7900, 8400],
      farBirds: 6, motes: 52,
    },
    // la cámara no pasa del borde pintado del plano jugable
    camRight: 9300,
  };

  JHS.Levels = JHS.Levels || {};
  JHS.Levels.m01 = L;
})(window.JHS = window.JHS || {});
