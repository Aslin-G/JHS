# Validación — Primera prueba obligatoria (§48)

**Escena:** Camino de montaña al amanecer · **Fase del pipeline:** D (validación, §47)
**Cómo se generó:** todo el arte se pinta por código en el navegador (lavados de acuarela por
capas, granulación ligada al relieve del papel, bordes oscurecidos al secar, tinta sepia de grosor
variable, pincel seco). Las capturas de esta carpeta salen del propio juego en Chromium a 1920×1080.

![Lámina original (izquierda) y el mirador en el juego (derecha)](validacion/00_lamina_vs_juego.jpg)

## Resultado en una línea

La escena es jugable de principio a fin y se reconoce el universo de la lámina: los tres
personajes, la paleta, la luz de amanecer entre nubes de tormenta y el papel. **Todavía no alcanza
el 9/10 que exige §83**: comparado con la lámina, el juego tiene menos tinta, menos detalle y
colores más pálidos, y el pelo de la niña tiene menos volumen. Por la regla de detención (§80)
no se han producido aún los siete mundos; la lista de correcciones pendientes está al
final.

## Autoevaluación por asset (§83)

Puntuaciones honestas sobre 10. Umbral de aprobación: 9 en personaje y en estilo.

| Asset | Personaje | Estilo | Color | Textura | Coherencia | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| Niña | 7 | 7 | 8 | 7 | 7 | Corregir pelo y rostro |
| Oveja | 8 | 7,5 | 8,5 | 7,5 | 8 | Cerca: falta relieve en los rizos |
| Buen Pastor | 7 | 7 | 8 | 7 | 7 | Corregir melena y manto |
| Cielo y montañas | — | 7,5 | 8 | 7 | 7,5 | Más pigmento cerca del sol |
| Sendero, rocas, madera | — | 7,5 | 7,5 | 7,5 | 7,5 | Más tinta en las rocas (pendiente) |
| Interfaz (papel y tinta) | — | 8 | 8,5 | 8 | 8 | Aprobable tras la segunda pasada |

### Qué sí está conseguido

- **Niña:** cabeza grande sin ser chibi, cuerpo y piernas finas, ojos negros pequeños, nariz
  pequeña, boca mínima, mejillas rosadas; suéter‑vestido verde grisáceo con punto elástico, medias
  oscuras, botines anaranjados con cordones y mochila de cuero con hebilla. Todos los cuadros usan
  las mismas piezas pintadas y el mismo esqueleto, así que no hay deriva entre cuadros (§14).
- **Oveja:** lana oscura rizada con motas claras, cabeza beige, ojos pequeños, orejas laterales
  con interior rosado, patas delgadas con pezuña oscura y sonrisa amable.
- **Pastor:** cabello largo castaño, barba, rostro amable, túnica clara con costuras punteadas,
  manto beige, cinturón de cuerda y sandalias; movimiento pausado.
- **Paleta:** las 14 manchas del recuadro «Paleta de Color (Estilo)» se muestrearon de la lámina
  y gobiernan todo el juego (página 2 de la hoja de personajes).
- **Luz narrativa (§7):** amanecer dorado que se abre en un cielo de tormenta, rayos pintados con
  estrías de pincel seco (no haces digitales), faroles cálidos.
- **Sin deriva prohibida (§4):** nada de pixel art, 3D, anime, vector ni brillo plástico. El grano
  no es un filtro sobre el fotograma: cada pieza se pinta con lavados y luego se «seca» en espacio
  de pigmento, de modo que el grano y el borde oscuro solo aparecen donde hay pigmento.
- **Sin elementos de Nintendo (§1):** no hay bloques, tuberías, monedas ni enemigos equivalentes;
  los coleccionables son semillas de luz y una página del diario.

### Dónde no llega todavía (y por qué)

1. **Pelo de la niña.** En la lámina es una masa enorme de rizos marrón oscuro con reflejos
   rojizos y muchos trazos de tinta negra. En el juego es más pequeño y de mechones más rectos.
2. **Trazo.** La lámina tiene una línea sepia nerviosa, repasada, con sombreado a plumilla en
   rocas y ropa. La línea del juego es orgánica pero más limpia y regular, sin plumilla.
3. **Detalle del entorno.** Las rocas de la portada están cargadas de pigmento, motas y tinta; las
   del juego son más planas. El corte de tierra del plano jugable es una convención de juego que
   no aparece en la lámina y resta parecido.
4. **Saturación y contraste.** La lámina tiene naranjas cálidos intensos junto al sol y azules
   tormenta profundos. El juego es más pastel, sobre todo en las montañas lejanas.
5. **Pastor.** En miniatura, la masa de pelo de detrás se lee un poco como una capucha; en la
   lámina la melena cae a ambos lados de la cara, con raya al medio, y el manto cubre los dos hombros.

## Lista de control visual (§45)

| Pregunta | Respuesta |
| --- | --- |
| ¿Parece el mismo personaje? | Sí, se reconocen; diferencias de volumen en el pelo |
| ¿Mantiene la paleta? | Sí, muestreada de la lámina |
| ¿Mantiene el trazo? | En parte: tinta sepia orgánica, más limpia que la lámina |
| ¿Mantiene la técnica? | Sí: acuarela y tinta simuladas desde el origen |
| ¿Parece acuarela? | Sí: lavados por capas, bordes oscurecidos, granulación |
| ¿Mantiene textura? | Sí, papel ligero que no estorba al juego |
| ¿Es legible? | Sí: contornos en personajes, bordes entintados en plataformas, brillo en objetos |
| ¿Encaja con las referencias? | En parte |
| ¿Hay deriva hacia otro estilo? | No hacia los prohibidos; algo hacia una acuarela digital limpia en los fondos |
| ¿Podría formar parte del mismo libro? | Cerca, todavía no |

## Requisitos de la prueba (§48–§50)

| Requisito | Estado | Dónde |
| --- | --- | --- |
| Niña, oveja y pastor | ✔ | todo el nivel |
| Rocas, flores, árboles, senderos | ✔ | todo el nivel |
| Montañas, nubes, rayos de sol | ✔ | capas de fondo |
| Parallax por capas | ✔ | cielo, nubes, montañas lejanas, valle, colinas, juego, primer plano |
| Plataformas naturales | ✔ | rocas, ramas, puente, escalón de piedra, tronco caído |
| La cámara sigue con suavidad y se adelanta | ✔ | la niña queda cerca del 40 % horizontal |
| Alejamiento en el mirador | ✔ | zoom de 1,12 a 0,7 en 6,5 s |
| La niña deja de correr, respira y observa el valle | ✔ | camina hasta el borde, respiración lenta, mirada |
| El pelo se mueve con el viento | ✔ | viento creciente en la cinemática |
| La oveja llega | ✔ | se alegra y se tumba a su lado |
| El pastor aparece al fondo | ✔ | aparece en luz detrás de ellas |
| Rayos de sol atraviesan las nubes | ✔ | los rayos se intensifican y las nubes se apartan |

## Capturas

| | |
| --- | --- |
| ![Título](validacion/01_titulo.jpg) | ![El pastor en el sendero](validacion/02_sendero_pastor.jpg) |
| ![Ramas del olivo](validacion/03_ramas_del_olivo.jpg) | ![Puente de cuerdas y cascada](validacion/04_puente_de_cuerdas.jpg) |
| ![Escalera](validacion/05_escalera.jpg) | ![Empujar la roca](validacion/06_empujar_la_roca.jpg) |
| ![Mirador](validacion/07_mirador.jpg) | ![Final](validacion/08_final.jpg) |
| ![Hoja: animaciones](validacion/09_hoja_animaciones.jpg) | ![Hoja: animaciones nuevas](validacion/09b_hoja_animaciones_nuevas.jpg) |
| ![Hoja: expresiones, escala y paleta](validacion/10_hoja_expresiones_escala_paleta.jpg) | ![Hoja: comparación con la lámina](validacion/11_hoja_comparacion_lamina.jpg) |

Segunda pasada:

| | |
| --- | --- |
| ![Recoger una campanilla](validacion/12_recoger_campanilla.jpg) | ![Sentada en el banco, con una mariposa en el pelo](validacion/13_banco.jpg) |
| ![Equilibrio al borde de la grieta](validacion/14_grieta_equilibrio.jpg) | ![El regalo de las campanillas](validacion/15_regalo.jpg) |
| ![Sacudir el árbol](validacion/16_sacudir_arbol.jpg) | ![El Pastor aparece en luz, entero](validacion/17_pastor_en_luz.jpg) |
| ![La roca vista desde la esquina del escalón](validacion/18_roca_desde_la_esquina.jpg) | ![El valle y el pueblo desde el mirador](validacion/20_valle_y_pueblo.jpg) |

## Pruebas técnicas

- **Recorrido automático** (`npm test`, o `node tools/recorrido.js`): un bot juega el nivel
  completo dentro del bucle del juego, con paso de tiempo fijo. Resultado de la última ejecución:
  llega a la pantalla final en 56 s de juego, sin caídas, con la página del diario, 8 de 8
  semillas (incluida la que cae al sacudir el árbol), 4 de 5 campanillas regaladas al Pastor, la
  oveja en el mirador y sin errores en la página.
- **Sonido:** los efectos se renderizaron sin conexión para medir niveles: ningún pico pasa de
  −14 dBFS; el fondo (viento, pájaros y música) queda por debajo de los efectos importantes.
- **Carga:** 6,4 s en Chromium sin ventana (render por software); 87 MB de lienzos de capas.
- **Móvil:** probado en un teléfono emulado de 844×390 en horizontal (controles táctiles) y en
  vertical (pide girar el teléfono).
- **No probado:** rendimiento con GPU real ni navegadores Safari o Firefox. En Chromium sin GPU la
  escena rinde entre 24 y 29 cuadros por segundo con seis actualizaciones por cuadro.

## Segunda pasada (revisión del 28 de octubre de 2026)

Fallos señalados en la revisión y su corrección:

| Fallo | Causa | Corrección |
| --- | --- | --- |
| Al desvanecerse el Pastor quedaban mechones de pelo flotando | los mechones y la cara se pintaban con opacidad absoluta | cada personaje se compone entero fuera de pantalla y se funde de una vez (`Rig.faded`); lo mismo para la niña y la oveja |
| La roca que se empuja se veía rara desde la esquina | era una bola con el punto de apoyo en el centro | piedra facetada apoyada en su base, con sombra de contacto, cara superior iluminada y un leve balanceo al arrastrarla |

Encontrados durante esta revisión y corregidos: rayas horizontales en el desfiladero (filas de
sombra solapadas), trazos «digitales» en su pared del fondo, una grieta que era un bloque oscuro
plano, un **mosaico cuadrado en la tierra** (el relieve del papel salía de ruido en rejilla; ahora
es ruido isótropo, como el diente del papel prensado), el banco del sendero flotando y la oveja
que se metía debajo de la niña al retroceder.

Añadido en animación, interactividad y detalle: ver la sección «Segunda pasada» del
[README](../README.md) y la nueva página de la hoja de personajes (captura `09b`).

## Pendiente para la siguiente pasada (fidelidad a la lámina, antes de la Fase E)

1. Rehacer el pelo de la niña con rizos en espiral superpuestos, más volumen hacia los lados y
   reflejos rojizos; añadir trazos de tinta negra en los rizos exteriores.
2. Añadir a la tinta una segunda línea repasada y sombreado a plumilla en las sombras de rocas,
   ropa y madera.
3. Poblar el borde del sendero con rocas grandes entintadas y matas de margaritas, como la
   portada, y reducir la altura visible del corte de tierra.
4. Pastor: melena con raya al medio que cae a ambos lados, manto sobre los dos hombros.
5. Más pigmento naranja alrededor del sol y azul tormenta más profundo en el tercio superior.
6. Si el equipo cuenta con ilustrador: el esqueleto acepta piezas pintadas a mano (cada pieza es un
   sprite con su punto de anclaje), así que se pueden sustituir sin tocar la animación.
