# La Senda de la Luz — estado del proyecto, límites y pendientes

Revisión del 29 de octubre de 2026 sobre el commit `7b638c0` (rama `claude/new-session-8z2b13`).
Cruza lo que hay en el repositorio con la edición de desarrollo
([01 Dirección artística](produccion/01_Direccion_Artistica.md),
[02 Decisiones y continuidad](produccion/02_Decisiones_y_Continuidad.md)) y las tres láminas
originales. El documento 02 dice que, cuando se escribió, «no se encontró un proyecto de motor ni
código jugable»: la edición es preproducción y no conoce este repositorio. Aquí se juntan las dos
cosas.

## 1. El proyecto en pocas líneas

Juego 2D de desplazamiento lateral pintado en acuarela. Lía (la niña), Nuba (la oveja) y el Buen
Pastor recorren siete regiones. La luz de Lía no es solo un arma: revela, activa, libera y
dispersa. Los lugares se restauran (cerrado → en reparación → habitable) y la oscuridad son
sombras simbólicas. No hay violencia gráfica ni culpa moral: fallar un salto, estar triste o
cansada no es una falta.

**Fijado por la edición:** técnica 2D pintada, el trío central, diez aliados, once criaturas
comunes e intermedias, siete encuentros mayores, siete regiones, el tono y los valores.
**Propuesto, sin cerrar:** timing, parámetros de control, costes, duración de la campaña, escala
exacta y herramientas. **Pendiente de probar:** funcionamiento real, lectura, estabilidad de las
animaciones, rendimiento, duración y comprensión emocional.

## 2. Fuentes y su autoridad

| Orden (02) | Fuente | En el repositorio | Qué decide |
| --- | --- | --- | --- |
| 1 | Indicaciones del usuario | conversación | todo lo que pida expresamente |
| 2 | Tres láminas originales | [personajes](referencias/lamina_conceptual.jpg) · [poderes, enemigos y jefes](referencias/referencia_2_poderes_enemigos_jefes.jpg) · [aliados, misiones y progresión](referencias/referencia_3_aliados_misiones_progresion.jpg) | modelos, materiales y estilo |
| 3 | Edición de desarrollo | [`docs/produccion/`](produccion/) | nombres, estructura, reglas y fases |
| 4 | Nuevas láminas de desarrollo | **no están** | propuestas subordinadas a las referencias |
| 5 | Anexos de expansión (`Reserva_Expansion`) | **no están** | ideas aún no integradas |

Otras fuentes ya en el repositorio: la [Biblia visual](BIBLIA_VISUAL.md), probablemente uno de los
dos «documentos de origen» que cita 02 (el otro no está), y la
[ficha del Mundo 1](mundos/M01_Ficha_de_Mundo.md), coherente con la edición.

## 3. Qué existe hoy

**Motor.** Canvas 2D con scripts clásicos (abre con doble clic o como un único HTML de 1,3 MB):
- kit de acuarela procedural (lavados, tinta, pincel seco y secado por pieza);
- parallax en seis planos;
- física de plataformas: escalera, empujar, puente que cede, repisas;
- cámara con cinemáticas;
- teclado, mando y táctil;
- interfaz de cuaderno: HUD, diálogos, menús, transiciones de pigmento y hoja de personajes;
- sonido sintetizado;
- carga de mundos por guion;
- bots de recorrido.

**Contenido.**
- El prólogo «Camino de montaña al amanecer» (Biblia §48).
- El Mundo 1 «Valle del Amanecer»:
  - el puente que se remienda y las tres estaciones de ruta;
  - tres estados del lugar con la misma colisión;
  - Ester y el Caballero de la Niebla;
  - la mirada final.

**Personajes.**
- Lía, con siete expresiones y la vista de espalda.
- Nuba, con dos fases de lana: oscura y clara.
- El Buen Pastor y Ester.
- El Caballero de la Niebla.

| Medida | Prólogo | Mundo 1 |
| --- | --- | --- |
| Carga (pintado de capas) | 6,2 s | 9,5 s |
| Memoria de capas | 87 MB | 139 MB |
| Prueba automática | pasa | pasa |

En total hay unas 12 800 líneas de código. El arte del juego no usa imágenes prefabricadas; solo
la hoja de personajes muestra la lámina original para comparar.

## 4. Lo que ya cumple la edición

| Regla de la edición | Dónde se cumple |
| --- | --- |
| Siempre «el Buen Pastor» (02) | diálogos, hoja y documentos |
| Lía conserva pelo, suéter salvia, piernas oscuras, botines ocre y mochila; nada de armadura (01 §3) | rig de la niña |
| El Pastor nunca tiene aspecto guerrero (01 §3) | túnica, manto, cinturón y sandalias |
| Tres faroles de ruta y uno en la casa (02) | Mundo 1: tres estaciones y el farol de Ester encendido desde el inicio |
| Tres estados por zona, sin cambiar solo la saturación, conservando vestigios (01 §6) | Mundo 1: taller, acequia, ropa tendida y huerta; tablones nuevos visibles |
| Viento con dirección compartida, con masas y retrasos (01 §6) | calendario de ráfagas en `src/world/ambient.js` |
| Caminar sin fase aérea, correr con suspensión, frenar amortiguando, salto inmediato, mochila con retraso (01 §4) | apoyo del 58 % al caminar y del 36 % al correr; frenada; mochila con inercia |
| Grano estable, que no cambia cada fotograma (01 §5) | cada pieza se pinta una vez al cargar |
| Texto con tipografía real, nunca dentro de la ilustración (01 §7) | el poste del cruce no tiene letras; se lee en un diálogo |
| Menús como hojas de cuaderno (01 §7) | `src/ui.js` |
| Sonido de contacto en el evento del pie (01 §7) | pasos según la superficie |
| Fallo sin violencia (Biblia §70) | desvanecerse en luz y volver al farol |
| Escala: Nuba 0,45–0,55 y Pastor 1,45–1,60 (01 §3) | medido: Nuba 0,46 y Pastor 1,53 |
| Niebla con tope y opción de reducción; primer plano reducible | pausa: «Niebla: reducida» y «Primer plano: reducido» |

## 5. Desviaciones del canon en lo que ya está hecho

| # | Asunto | Canon (fuente) | Hoy | Qué hacer |
| --- | --- | --- | --- | --- |
| 1 | Nombres | Lía, Nuba; el juego se llama «La Senda de la Luz» (01) | el título es «Camino de montaña al amanecer»; en el prólogo habla «La niña»; la hoja dice «La niña» y «La oveja» | renombrar en la interfaz, la hoja, el `aria-label` y los documentos («Camino de montaña al amanecer» puede seguir siendo el nombre del prólogo) |
| 2 | Ester | pañuelo violeta; bastón con contacto real que soporta peso; adulta entre 1,20 y 1,55 (01 §3, §4; lámina 3) | moño gris, chal miel, sin bastón; mide 1,12 | rehacer el modelo con pañuelo violeta y bastón (al caminar y al estar de pie) y subirla a ~1,25 |
| 3 | Caballero de la Niebla | familia de sombras fijada por las láminas: armadura oscura, espada y niebla violeta; «alta resistencia, ataque de embestida»; como guardián pesado, la masa llega después de la decisión y se ve la recuperación; ojos ámbar para leer la dirección (01 §1, §2, §4; láminas 2 y 3) | figura lavanda translúcida, sin ojos, con lanza y un sol bordado (inventado); ataca con olas de niebla que empujan | rediseñar el modelo según la lámina; ataque principal de embestida con anticipación y recuperación; decidir si las olas quedan como patrón secundario y cómo se resuelve el encuentro con el pulso de luz |
| 4 | Lana de Nuba | cinco estados visuales y sigue ayudando en todos (02) | dos fases (oscura y clara) | definir los cinco estados (el documento no está) y pintar los tres intermedios |
| 5 | Orejas de Nuba | «expresan atención; no vibran sin motivo» (01 §4) | aleteo aleatorio cada 2,5–6,5 s | ligarlas a estímulos: la llamada, un sonido, una mariposa, el Pastor |
| 6 | Llevar cosas | cargar desplaza cadera y torso, acorta el paso y cambia los brazos; los objetos tienen una mano que los sostiene (01 §3, §4) | en el Mundo 1 el tablón flota sobre el hombro y la marcha no cambia | pose de carga con las manos en el tablón, paso corto y torso adelantado |
| 7 | Música del mirador | en un mirador se atenúan las capas musicales y se escucha el lugar (01 §7) | en el mirador del prólogo la música sube | bajar la música, dejar el viento y los pájaros, y dar espacio al silencio |
| 8 | Validación | no aceptar una puntuación de fidelidad inventada (01 §8) | `VALIDACION_PRUEBA_1.md` habla del «9/10» de la Biblia §83 | sustituirlo por la tabla comparativa de 01 §8 (identidad, apoyos, volumen, material, lectura, emoción, continuidad) con capturas y clips |
| 9 | Textura del papel | mucho menos intensa que la de ropa o roca; nada de ruido fuerte sobre toda la pantalla (01 §5; Biblia §5.3) | en los cielos el grano del papel se nota más que en la ropa | medir y bajar el grano del cielo y de las capas lejanas |
| 10 | Primer plano | se retira cuando oculta a Lía, a Nuba o un aviso (01 §6) | se desvanece según la posición en pantalla, no por oclusión | apartarlo cuando se solape de verdad con un personaje o un aviso |
| 11 | Expresiones | siete expresiones por modelo (01 §3) | Lía 7; el Pastor 4; Nuba 4 | añadir tres al Pastor y tres a Nuba |

## 6. Lo que falta (todavía no existe)

### Lía: poderes y progresión
- **Pulso de luz** que revela, activa, libera y dispersa (02). Centro cálido pequeño, borde
  irregular, con inicio, recorrido, contacto y disolución; nada de un rayo continuo de aspecto
  tecnológico (01 §7).
- **Oración / escudo de luz** (~3 s): nace cerca de las manos, llega al suelo y deja ver los
  obstáculos por la periferia.
- Lámina 3: **Inspiración de luz** (onda que empuja y purifica), **Impulso de fe** (desplazamiento
  rápido) y **Sanar/restaurar**.
- **Progresión por hitos de aprendizaje y reparación** (02). Los cinco niveles de la lámina 3
  (Inicio, Disciplina, Santidad, Unción, Plenitud) hay que traducirlos a hitos sin medidor moral.
- Opción **«reducir destellos»** que conserve los avisos por contorno y sonido (01 §7).

### Nuba
- Cinco estados visuales con ayuda en todos ellos. La lámina 3 le da empujar, activar y guiar.
- Hoy sigue a Lía, salta donde ella saltó, tiene su grieta, olfatea secretos y acude a la llamada.

### Criaturas y encuentros
- **Once criaturas comunes e intermedias.** Según las láminas y el registro de equivalencias de 02
  serían: Sombra Rastrera, Bruma Errante, Sombra Saltarina, Murciésombra, Espina Oscura, Guardián
  Sombrío, Lanzador de Tinieblas, Sombra Acorazada, Tejedor de Bruma, Eco Negro y Recolector. Los
  tres últimos no tienen modelo aprobado. La lista cerrada está en un documento que no tenemos.
- **Siete encuentros mayores**, uno por mundo: Caballero de la Niebla (Mundo 1, según su ficha),
  Bestia del Vacío, Señor de las Sombras, Árbol Corrompido, Alado de Sombra, Titán de Sombras y el
  Velo. Falta saber en qué mundo va cada uno.
- Reglas de forma (01 §4 y 02):
  - las sombras pequeñas deforman su contorno pero conservan núcleo, ojos y dirección;
  - en los guardianes pesados la masa llega después de la decisión;
  - los jefes de humo tienen núcleo estable y bordes cambiantes;
  - el Señor lleva cuerpo central y corona; el Velo es enorme, asimétrico y envolvente.
- Hoy no hay ningún sistema de enemigos; solo existe el Caballero, con su guion propio.

### Aliados y misiones
- **Diez aliados**, cada uno con atributos fijos y objetos con masa (01 §3):

  | Aliado | Rasgos fijos |
  | --- | --- |
  | Ester | pañuelo violeta |
  | Matías | gorra y mandil |
  | Mara | pañuelo coral y cesta |
  | Simón | sombrero y cayado |
  | Tobías | rizos |
  | Lea | equipo de viaje |
  | Elías | capucha azul gris, barba blanca y bastón |
  | Gabriel | bolsa y paloma |
  | Sara | cántaro |
  | Jacob | sombrero y cosecha |

  Hoy solo existe Ester, y con desviaciones.
- **Favores y misiones** de la lámina 3, con su registro en el cuaderno:
  - provisiones;
  - hierbas;
  - ovejas perdidas;
  - madera;
  - el pozo;
  - un objeto perdido;
  - purificar un área;
  - llevar un mensaje.

### Mundos
- Las siete regiones de la Biblia (§21–§27):
  1. Valle del Amanecer (hecho).
  2. Bosque de los Susurros.
  3. Montañas del Esfuerzo.
  4. Valle de la Tormenta.
  5. Costa del Mar Embravecido.
  6. Pueblo de las Luces.
  7. Jardín del Nuevo Amanecer.
- Faltan las fichas de M02 a M07.
- Hay que decidir si el prólogo sigue siendo un prólogo.

### Interfaz y sistema
- **Mapa pintado** que solo añade rutas verificadas, con un trazo abierto para las incompletas
  (Biblia §36; 01 §7).
- **Guardado del progreso.** Hoy solo se recuerdan las opciones, el mundo elegido y el sonido.
- **Vitalidad.** La escena de ejemplo de la lámina 2 muestra corazones; la Biblia §70 y el Mundo 1
  no usan daño. Está sin decidir.
- Indicador de energía distinguible por forma, posición y color, si llega a existir (01 §7).

### Sonido
- Instrumentos de la comunidad que se suman a la música sin subir el volumen sin fin.
- Respiraciones y roces de tela de los habitantes.
- Lluvia que deja huella en la ropa, el suelo y el sonido (01 §6; Biblia §55).

### Herramientas de producción y de revisión
- **Modelo maestro por personaje** (01 §3):
  - frente, perfil jugable, tres cuartos y espalda;
  - siete expresiones y paleta de materiales;
  - **seis puntos de registro** (coronilla, barbilla, hombros, cadera, rodillas y suelas) en una
    capa de control.

  La hoja de personajes actual tiene perfiles, la espalda de Lía, expresiones, la tabla de escala y
  la paleta; no tiene tres cuartos ni puntos de registro.
- **Prueba de 12 dibujos por segundo** en los ciclos (con la cámara a la frecuencia del juego),
  comparada con controles reales (01 §5).
- **Revisión comparable** (01 §8): referencia, propuesta y captura a la misma escala; clips en
  reposo, en movimiento lento y normal, sobre fondo claro y oscuro. Los clips se pueden grabar con
  el mismo Playwright de los bots.

## 7. Límites

**De técnica.**
- Todo se pinta con código al cargar. A favor: la identidad es estable entre fotogramas y el
  archivo es ligero. En contra: la densidad de las láminas no se alcanza (hebras de pelo, flores,
  rocas mojadas, luz). La comparación del Mundo 1 lo muestra
  ([concepto frente a juego](validacion/m01_00_concepto_vs_juego.jpg)).
- Los personajes son recortes articulados, justo el riesgo de «figura de cartón» que nombra 01 §5.
  - Se puede mitigar con piezas de sustitución (manos, pies, cara, pliegues), poses clave pintadas
    y la prueba de 12 dibujos por segundo.
  - Nada de eso equivale a dibujo a mano.
  - Si habrá ilustradores, el motor puede cargar sprites dibujados siguiendo las convenciones de
    exportación de 01 §5: pivote común, márgenes, alfa limpio, nombres estables y registro de
    eventos.
- Rendimiento: cada mundo tarda 6–10 s en pintarse y ocupa 87–139 MB. En móvil no se ha probado.
- Plataforma: navegador, Canvas 2D y un solo hilo. El artifact es un HTML de 1,3 MB (límite 16 MB).

**De alcance.**
- Lo fijado pide siete mundos, diez aliados, once criaturas, siete encuentros, cinco estados de
  Nuba, poderes con progresión, misiones, mapa y guardado.
- Hoy hay un mundo más el prólogo, un aliado, un encuentro, dos estados de Nuba y ningún poder.
- Al ritmo actual, un mundo completo ocupa una sesión de trabajo larga.

**De información.** Faltan documentos que la edición da por existentes:
- la estructura de la historia;
- la ficha de cada región;
- qué aliados y qué encuentro van en cada mundo;
- las mecánicas con sus parámetros;
- los cinco estados de Nuba;
- las fases de producción;
- las nuevas láminas y la carpeta `Reserva_Expansion`;
- el segundo documento de origen.

**De validación.** Los bots comprueban que el nivel se puede terminar. No comprueban la lectura,
la estabilidad de la animación ni la emoción. Falta probar con personas (02: «pendiente de probar»).

## 8. Decisiones abiertas

1. **Vitalidad:** ¿corazones y daño, como en la escena de ejemplo, o empujes y vuelta al farol, como
   hoy y como pide la Biblia §70?
2. **Caballero de la Niebla:** ¿se rehace con el modelo de la lámina (armadura oscura, espada,
   embestida)? ¿Cómo se resuelve el encuentro: con el pulso, con el farol o con los dos?
3. **Nuba:** ¿cuáles son los cinco estados de lana y qué los hace cambiar, si no es la moral?
4. **Ester:** ¿se rehace ya en el Mundo 1 con pañuelo violeta y bastón?
5. **Técnica:** ¿seguimos pintando todo por código o habrá arte dibujado a mano para los
   personajes?
6. **Prólogo:** ¿se mantiene como prólogo antes del Mundo 1?
7. **Prioridad:** ¿alinear lo existente y hacer una prueba lateral de mecánicas antes de empezar el
   Mundo 2?

## 9. Orden de trabajo propuesto

1. **Fase 0 · Alinear lo existente con el canon.** Las once desviaciones de la sección 5. Son
   cambios acotados sobre código que ya funciona.
2. **Fase 1 · Prueba lateral comparable de mecánicas** (01 §2: «ajustar en una prueba lateral
   comparable antes de producir una campaña»). Un tramo nuevo con:
   - pulso de luz (revelar, activar, liberar, dispersar) y escudo;
   - dos sombras básicas (Sombra Rastrera y Bruma Errante);
   - la ayuda de Nuba;
   - la decisión sobre la vitalidad.

   Se revisa con la tabla de 01 §8 y con clips.
3. **Fase 2 · Herramientas.** La hoja de modelos con vistas y puntos de registro, la prueba de 12
   dibujos por segundo y la grabación automática de clips de revisión.
4. **Fase 3 · Producción por mundos**, empezando por el Bosque de los Susurros cuando exista su
   ficha. En cada mundo: ficha, diseño, arte por capas, aliados, encuentro, tres estados y pruebas.
