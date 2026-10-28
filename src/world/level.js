/* Nivel de prueba §48 — «Camino de montaña al amanecer».
   Coordenadas del mundo en unidades lógicas (1920×1080 con zoom 1); y crece hacia abajo.
   El sendero sube de y≈880 a y≈188: seis tramos que alternan exploración, salto, descanso,
   puzle, narrativa y paisaje (§66), y terminan en un mirador sin peligro (§67, §50). */
(function (JHS) {
  'use strict';

  const L = {
    name: 'Camino de montaña al amanecer',
    start: { x: 220 },
    bounds: { left: 40, right: 8420 },
    killY: 1320,

    // Tramos de suelo (polilíneas de superficie). Entre tramos hay barrancos.
    ground: [
      [[-700, 880], [100, 880], [420, 874], [760, 864], [1100, 850], [1500, 840], [1680, 834], [1900, 828], [2040, 826]],
      [[2130, 822], [2350, 815], [2600, 808], [2850, 802], [3100, 798], [3170, 796]],
      [[3770, 792], [4050, 786], [4400, 780], [4580, 778], [4620, 778], [4620, 476], [4800, 472], [5050, 468], [5400, 464],
        [5600, 460], [5750, 458], [6150, 458], [6150, 248], [6400, 244], [6700, 240], [6900, 236]],
      [[7120, 232], [7400, 220], [7700, 204], [8000, 192], [8460, 188]],
    ],
    gaps: [
      { x0: 2040, x1: 2130, kind: 'crevice' },
      { x0: 3170, x1: 3770, kind: 'gorge' },
      { x0: 6900, x1: 7120, kind: 'ravine' },
      { x0: 8460, x1: 9600, kind: 'cliff' },
    ],

    // Plataformas naturales sólidas (rocas). x, y = esquina superior izquierda del colisionador.
    rocks: [
      { x: 1690, y: 768, w: 120, h: 66, seed: 3 },
      { x: 1860, y: 706, w: 130, h: 122, seed: 7 },
      { x: 2560, y: 732, w: 100, h: 76, seed: 11 },
      { x: 5100, y: 404, w: 100, h: 62, seed: 17 },
    ],
    // Plataformas de un solo sentido (ramas, tronco caído).
    ledges: [
      { x0: 2655, x1: 2770, y: 646, kind: 'branch', sheep: false },
      { x0: 2805, x1: 2925, y: 536, kind: 'branch', sheep: false },
      { x0: 6880, x1: 7060, y: 232, kind: 'log', sheep: true },
    ],
    bridge: { x0: 3170, x1: 3770, y0: 796, y1: 792, sag: 34, holes: [[3360, 3412], [3540, 3592]] },
    ladders: [{ x: 4596, top: 476, bottom: 778 }],
    tunnel: { from: { x: 4654, y: 778 }, to: { x: 4700, y: 472, holeX: 4650, holeY: 518 } },
    pushables: [{ x: 5800, w: 124, h: 98, stopX: 6136 }],

    lanterns: [{ x: 2300 }, { x: 4830 }, { x: 7450 }],
    chest: { x: 6380, page: true },
    seeds: [
      { x: 1925, y: 616 }, { x: 2712, y: 600 }, { x: 2880, y: 482, secret: true }, { x: 3466, y: 676 },
      { x: 5150, y: 330 }, { x: 5470, y: 392, secret: true }, { x: 6990, y: 118 },
      // escondida en la copa del árbol del escalón: cae al sacudirlo
      { x: 4992, y: 120, inTree: 4980, secret: true },
    ],
    // campanillas del camino: se recogen y se ofrecen al Pastor en el mirador
    flowers: [{ x: 905 }, { x: 2468 }, { x: 4268 }, { x: 5578 }, { x: 7392 }],
    // árboles que se pueden sacudir (caen hojas y, en uno, una semilla)
    shakeTrees: [{ x: 1320 }, { x: 4980 }],
    // pajarillos posados que echan a volar al acercarse
    birds: [{ x: 1180, n: 3 }, { x: 4080, n: 2 }, { x: 6560, n: 3 }, { x: 7660, n: 2 }],
    sign: { x: 640, lines: ['Mirador ↑ · Pueblo de las Luces, abajo en el valle.', 'Cuidado con el puente: le faltan tablas.'] },

    // El Pastor guía sin resolver (§31): aparece en paradas y habla con calma.
    shepherd: [
      { x: 980, face: -1, radius: 300, lines: ['Buenos días, pequeña. El sol ya asoma detrás de los montes.', 'El sendero sube hasta el mirador. Ve tú delante; yo conozco el camino.'], gesture: 'point' },
      { x: 3040, face: -1, radius: 280, lines: ['Este puente cruje, pero aguanta.', 'Pisa con calma… y salta donde falten tablas.'], gesture: 'point' },
      { x: 4470, face: 1, radius: 260, lines: ['La pared es alta. Sube por la escalera.', 'No te preocupes por ella: conoce su propio camino.'], gesture: 'point' },
      { x: 5640, face: 1, radius: 260, lines: ['A veces, lo que pesa también sirve para subir.'], gesture: 'speak' },
    ],
    sheepStart: { x: 470 },

    mirador: { trigger: 8150, stand: 8300, sheep: 8205, shepherd: 7960, bench: 8040 },

    page: {
      title: 'Página del diario',
      text: ['Hoy el camino subía y la mochila pesaba.', 'Pero cada vez que miré atrás,', 'alguien caminaba conmigo.'],
    },
    ending: ['Mira cuánto has subido.', 'Cada paso valió la pena. Mañana el camino seguirá.'],
    gift: {
      girl: ['Son para ti. Las encontré por el camino.'],
      shepherd: ['Gracias, pequeña.', 'Las flores más bonitas crecen en las subidas.'],
    },
    // respuestas cuando se vuelve a hablar con el Pastor
    chat: ['Aquí estoy. Sigue el sendero; no vas sola.', 'Si te cansas, siéntate un rato. El camino espera.',
      'Tu oveja te sigue a todas partes. Llámala si se queda atrás.', 'Mira bien a tu alrededor: hay semillas escondidas.'],

    // Decorado del plano jugable
    decor: {
      fence: [{ x0: 70, x1: 360 }],
      sign: [{ x: 640, text: 'Mirador' }],
      bench: [{ x: 1440 }, { x: 8040 }],
      trees: [
        { x: 1320, h: 560, seed: 4, behind: true },
        { x: 2790, h: 640, seed: 9, branches: true },
        { x: 4980, h: 470, seed: 21 },
        { x: 7860, h: 700, seed: 33 },
      ],
      bigRocks: [
        { x: -40, y: 880, rx: 150, ry: 120, seed: 41 },
        { x: 1150, y: 850, rx: 46, ry: 28, seed: 43 },
        { x: 3650, y: 792, rx: 30, ry: 18, seed: 44 },
        { x: 4300, y: 780, rx: 52, ry: 32, seed: 45 },
        { x: 5480, y: 462, rx: 38, ry: 22, seed: 46 },
        { x: 7300, y: 225, rx: 44, ry: 26, seed: 47 },
        { x: 8350, y: 190, rx: 60, ry: 34, seed: 48 },
      ],
    },
  };

  JHS.Level1 = L;
})(window.JHS = window.JHS || {});
