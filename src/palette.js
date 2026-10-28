/* Paleta — muestreada directamente de la lámina conceptual (docs/referencias/lamina_conceptual.jpg).
   Biblia §6: cálida, natural y narrativa. La riqueza viene de veladuras y temperatura,
   no de subir la saturación. */
(function (JHS) {
  'use strict';

  // Las 14 manchas del recuadro «Paleta de Color (Estilo)» de la lámina, en su orden.
  const reference = [
    ['Crema', '#fbdfb3'], ['Beige rosado', '#e1bc9e'], ['Marrón tierra', '#8e6643'],
    ['Piel', '#ecbd91'], ['Terracota', '#b26231'], ['Gris pardo', '#866b56'],
    ['Ocre', '#f7b03c'], ['Naranja dorado', '#e68c2a'], ['Verde salvia', '#9a9c66'],
    ['Melocotón', '#face8e'], ['Marrón café', '#79523d'], ['Azul grisáceo', '#7a87a8'],
    ['Niebla lavanda', '#c5bfc6'], ['Niebla azul', '#c5c7d3'],
  ];

  const P = {
    // papel de algodón y tintas
    paper: '#f8f1e3', paperWarm: '#f3e6cf', paperDeep: '#e6d3b4',
    ink: '#3d2615', inkSoft: '#5c3c24', inkWarm: '#6e4528', inkGrey: '#5e5450',

    // la niña
    skin: '#f6be89', skinShade: '#dc915e', skinLight: '#fdd8ab', blush: '#ea8574',
    hair: '#5d3117', hairDark: '#391b0a', hairMid: '#8d5731', hairLight: '#bb8653', hairRed: '#9a4a24',
    sweater: '#8e9379', sweaterShade: '#646a53', sweaterLight: '#b6b89e', sweaterDeep: '#4f533f',
    tights: '#55443b', tightsShade: '#3a2d27',
    boot: '#b7692b', bootShade: '#7a401a', bootLight: '#dc9c57', sole: '#4b2a14', lace: '#f0dcbc',
    pack: '#8c5b2f', packShade: '#5d3816', packLight: '#bb8752', buckle: '#a89a86',
    eye: '#1d120c', mouth: '#9c4a3a',

    // el Buen Pastor
    robe: '#f3e5c9', robeShade: '#d2b993', robeLight: '#fdf7ea', stitch: '#8d6b48',
    mantle: '#d7ad74', mantleShade: '#b0844f', mantleLight: '#ecd09c',
    belt: '#5e3a1e', beltLight: '#8a5f3a', sandal: '#6b3f1d',
    shepHair: '#77461f', shepHairDark: '#4a270e', shepHairLight: '#b07b47', beard: '#6a3b1b',

    // la oveja
    wool: '#5b3f2b', woolDark: '#33200f', woolMid: '#7a5a40', woolLight: '#a3825f', woolFleck: '#e3cfae',
    sheepFace: '#f5cf9f', sheepFaceShade: '#d8a46f', earInner: '#e99c88', hoof: '#2a1e18', sheepLeg: '#ead1a8',

    // cielo y luz de amanecer
    skyStorm: '#6b7293', skyStormDark: '#474e70', skyLavender: '#b3abbd', skyMist: '#d4cdd2',
    skyPeach: '#f4cf9e', sunGlow: '#fde6b2', sunCore: '#fff8e4', ray: '#fff1c6',

    // montañas por planos (perspectiva atmosférica)
    mtnFar: '#c7b6b8', mtnFarShade: '#a1939f', mtnFarLight: '#f2d8b8',
    mtnMid: '#a8949b', mtnMidShade: '#776a80', mtnMidLight: '#e8c7a4',
    hill: '#9d9a62', hillShade: '#6d6f47', hillLight: '#cdc27c', forest: '#4e5935', forestDark: '#374026',

    // tierra, sendero, roca, madera
    earth: '#b08763', earthShade: '#7f5e47', earthDeep: '#5f4638',
    path: '#e9c99f', pathShade: '#c99f73',
    rock: '#a68d79', rockWarm: '#c79e70', rockShade: '#706264', rockLight: '#e7d3b2', rockCool: '#8d8a95',
    wood: '#9c6b3e', woodShade: '#684320', woodLight: '#c68f56',
    moss: '#7e8442', mossLight: '#aab05a',
    leafLight: '#d9cf7d', leafSun: '#e9de8c', leafMid: '#88a067', leafShade: '#5a7655', leafDeep: '#3c5440',
    grass: '#a6a354', grassDark: '#6e7338', grassLight: '#d2c66c',
    flowerWhite: '#fcf7ec', flowerCenter: '#eea733', flowerYellow: '#e8bd44', flowerLilac: '#a395b9',
    gold: '#f1b13d', amber: '#e08b2a', seedGlow: '#ffdc8f',
    river: '#93a6b1', riverLight: '#d9e1df', mist: '#f1e8da',
    lanternGlow: '#ffc56b', metal: '#4a4440',
  };

  JHS.Palette = P;
  JHS.Palette.reference = reference;
})(window.JHS = window.JHS || {});
