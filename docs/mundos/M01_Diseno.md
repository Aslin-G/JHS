# M01 — Valle del Amanecer · diseño jugable y decisiones de adaptación

Este documento traduce la [ficha de mundo](M01_Ficha_de_Mundo.md) y el
[arte conceptual](../referencias/M01_concepto_valle_del_amanecer.jpg) a un nivel jugable de
desplazamiento lateral. La ficha manda; donde el concepto (una ilustración en perspectiva) y el
juego (un corredor lateral) no encajan, aquí se explica qué se decidió y por qué.

![Concepto frente al juego](../validacion/m01_00_concepto_vs_juego.jpg)

## Momento y estado de Nuba

- **Momento representado (ficha):** M01_04, «puente reparado y faroles en transición». El nivel
  empieza un poco antes, en el estado inicial (el puente roto por la tormenta, los faroles
  apagados), para que esa transición se juegue: la remienda la niña y la lleva hasta el estado
  restaurado.
- **Lana de Nuba:** fase **clara** (crema y blanca) desde el principio del Mundo 1; en el prólogo
  sigue siendo la oscura. Lo decide `W.wool = 'clara'` en `src/worlds/m01/script.js`, y la oveja
  se vuelve a pintar al cargar el mundo.

## Recorrido (de izquierda a derecha)

| Tramo | x (mundo) | Qué pasa |
| --- | --- | --- |
| M01_01 · La casa de Ester | 0–1800 | El gran árbol enmarca el cielo. Ester saluda, riega, mira la colina y cuenta lo del puente. Su farol luce desde el inicio. |
| M01_02 · La leñera y el arroyo | 1600–2210 | Tres tablones en la leñera; hay que llevarlos de uno en uno (no se puede correr ni saltar con carga) y ponerlos en los tres huecos. Con el último, el valle entra en transición. |
| M01_03 · El taller | 2400–3300 | **Estación 1**: reparar el farol manteniendo E. El taller se abre: luz dentro, herramientas, toldo y farol propio. El cofre del taller da la página del diario. |
| M01_04 · Los campos y el cruce | 3300–4800 | La acequia lleva agua a la huerta. Un olivo guarda una semilla (sacudirlo). Poste del cruce sin texto en la escena (se lee en un diálogo). **Estación 2**. |
| M01_05 · La subida | 4800–6600 | Muretes y piedras como plataformas reales; un tronco sobre dos pilas de piedra seca. El Pastor avisa de la niebla. |
| M01_06 · La Colina de las Piedras | 6600–7800 | El Caballero de la Niebla. **Estación 3** bajo sus olas; al encenderse, el Caballero se arrodilla y se disuelve. |
| Final · La mirada sobre el valle | 8100–8400 | La cámara se abre y recorre lo que cambió (el farol de la colina, la huerta, el taller y el puente) y vuelve con la niña, Nuba y el Pastor. |

## Capas (ficha: «Capas, de delante hacia el fondo»)

| Ficha | Juego | Archivo |
| --- | --- | --- |
| 1 · Flores y hierbas cercanas, solo en esquinas y de bordes blandos | Primer plano (p = 1,3); se desvanece hacia el centro de la pantalla y tiene opción «Primer plano: reducido» | `art_play.js` · `foregroundSprites` |
| 2 · Suelo jugable de piedra y césped, el puente y patas con contacto legible | Plano jugable: camino miel de textura ancha, borde superior entintado y continuo, ladera con flores y piedras; el puente se dibuja en franjas que siguen su superficie física | `art_play.js` |
| 3 · Arbustos, cerca y acequia con detalle medio detrás de los personajes | Misma capa jugable, por detrás del camino | `art_play.js` · `paintGroundBlock` |
| 4 · Casa de Ester, taller y campos | Plano propio (p = 0,9) pintado completo, con relleno detrás de cada oclusión | `art_back.js` |
| 5 · Colinas redondeadas y montaña lavanda con menos contraste | Colinas (p = 0,5), valle con pueblo, acueducto y cascada (p = 0,25), montañas (p = 0,1) | `art.js` |
| 6 · Cielo crema con nubes transparentes y luz dorada diagonal | Cielo (p = 0,03), nubes que derivan, abanico de rayos y la veladura de luz de miel | `art.js` · `game.js` |

**Parallax sin trampas:** ninguna capa es una ilustración plana escalada; todas están pintadas a
su propio tamaño y cubren todo el recorrido de la cámara.

**Fondo sin plataformas falsas:** en el plano 4 no hay bordes horizontales que puedan leerse como
repisas (los muretes de la subida son restos cortos, inclinados y de poco contraste). Solo es
plataforma lo que está en el plano jugable y se apoya en el suelo.

## Estados y continuidad (ficha: «Restauración y continuidad»)

`prog` va de 0 a 4 y cada elemento del lugar cambia a su ritmo (`STATE_AT` en el guion):

| prog | Se consigue con | Cambia |
| --- | --- | --- |
| 0 · inicial | — | Puente roto, faroles apagados, taller en reposo, brotes en la huerta, humo tenue. |
| 1 · transición | el último tablón | Agua en la acequia cercana, más humo en la chimenea, la ventana de Ester encendida, ventanas del pueblo. |
| 2 | estación 1 | El taller abre (luz, herramientas, toldo, farol), ropa tendida junto a la casa, la huerta medio crecida. |
| 3 | estación 2 | La acequia llega a los campos; el pueblo enciende más ventanas y suena su campana. |
| 4 · restaurado | estación 3 | Huerta llena (coles, calabazas, girasoles) y aun así «en crecimiento»; la niebla se retira. |

- **Tres estaciones de ruta**, no más. Comparten la silueta de **vidrio y campana** con el farol
  de la casa (y con el icono del HUD); las ventanas del fondo tienen menos contraste.
- **Geometría de colisión idéntica** en los tres estados: el suelo, los sólidos y las repisas no
  dependen de `prog`. El puente usa la misma superficie antes y después de remendarlo; los
  huecos son lo único que se tapa.
- La transición añade uso, conexiones y cuidado (taller abierto, ropa tendida, acequia,
  herramientas, luz), no solo color. Los tablones nuevos se notan (madera clara, cuerda nueva).
- Nada une la tormenta ni la pérdida a una culpa: Ester habla del puente «que se llevó la
  tormenta» y del Caballero «que cuida el valle mientras duerme».

## El encuentro (ficha: «Lectura y encuentro»)

- **El Caballero de la Niebla** es simbólico y no violento (Biblia §32–§33): una armadura de
  niebla lavanda, sin rostro, con un sol dorado bordado. Sus olas **solo empujan** hacia atrás
  (sin daño, 1,2 s de gracia) e interrumpen una reparación.
- **Anuncio por forma, dirección, sonido y anticipación** (0,9 s): mira hacia la niña, baja la
  lanza (ola **baja**: saltar) o la sube (ola **alta**: agacharse), suena el cuerno (dos notas;
  la segunda sube si la ola va alta) y la niebla se junta en la punta de la lanza.
- Las olas son bancos de bruma lavanda que ruedan, con el frente claro: no se confunden con las
  chispas doradas decorativas ni con los puntos de interacción.
- **Niebla con tope de opacidad** (0,42; 0,18 con «Niebla: reducida» en la pausa). No hay
  contornos fluorescentes: la lectura se gana con forma y valor.
- La niebla se reserva a la colina: no cubre la lectura del resto del valle. Junto al Caballero
  hay un muro de niebla espesa que no deja pasar hasta que luce el farol de la colina.

## Movimiento ambiental (ficha: «Movimiento ambiental»)

- Un calendario de ráfagas con calmas largas mueve hierba, flores, ropa, faroles y árboles en la
  **misma dirección**, con retraso según la masa de cada cosa (las flores altas ceden después
  del tallo; los árboles, tarde y poco).
- Agua mansa con reflejos cortos; tres saltos de agua entre rocas; la cascada lejana.
- Humo doméstico en manchas de baja opacidad, sin ciclo evidente.
- Las barandillas y el puente solo reaccionan a pasos y ráfagas.
- Ester alterna al menos cuatro acciones (regar, mirar la colina haciéndose visera, estirarse la
  espalda, cambiar de sitio) con pausas de duración variable.
- Sin deformación gelatinosa: todo se mueve con giros y desplazamientos rígidos.

## Sonido

Campanita al reparar un farol, campana del pueblo (tres toques lejanos) al llegar al estado 3,
rumor del arroyo que crece al acercarse al cauce, cuerno y soplo de las olas, y la madera de los
tablones.

## Revisión antes de producción (ficha)

| Punto | Estado |
| --- | --- |
| Siluetas de Lía, Nuba y el Pastor coherentes con las referencias | Mismos esqueletos y piezas que el prólogo; Nuba en fase clara. |
| Contacto con el suelo y escala coherentes entre personajes, puertas y muebles | Puerta de Ester a escala de la niña; banco, tronco sobre pilas de piedra, estaciones clavadas con piedras al pie. |
| Camino lateral continuo con destino visible, sin perspectiva isométrica accidental | El Bosque de los Susurros se ve al fondo a la derecha; el arroyo baja hacia nosotros solo como plano de fondo. |
| Papel visible en luces, pigmento y línea; nada de material 3D brillante | Secado de acuarela por pieza, grano de papel alineado entre piezas, reservas de papel en las luces. |
| Sin texto ni interfaz dentro del panorama | El poste del cruce no tiene letras; se lee en un diálogo. |
| Estado coherente con la escena y la fase de lana de Nuba | Ver «Estados y continuidad». |

## Prueba automática

```bash
node tools/recorrido_m01.js
```

Un bot habla con Ester, remienda el puente, repara las tres estaciones, abre el cofre, sacude el
olivo, salta y se agacha ante las olas del Caballero y llega a la pantalla final sin caerse.
