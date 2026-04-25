# Modelo Conceptual FE — Leyenda y Referencia de Funciones

Un sandbox interactivo que muestra lo que un observador realmente ve en un plano con un límite de visión. Sin unidades físicas, sin radio terrestre asumido. Todo se construye en torno a un único observador ficticio que une la esfera celeste con la cuadrícula terrestre relacionando el ángulo geocéntrico de una estrella con el momento en que pasa por el cenit.

En vivo en [alanspaceaudits.github.io/conceptual_flat_earth_model](https://alanspaceaudits.github.io/conceptual_flat_earth_model/).

---

## Dos capas, un observador

- **Bóveda óptica** — la cúpula sobre la cabeza sobre la que se proyectan el Sol, la Luna, los planetas y el campo de estrellas. En vista de primera persona (Óptica), la cúpula es un hemisferio estricto, por lo que la elevación renderizada coincide 1:1 con la elevación reportada.
- **Posiciones reales** — la lectura de la bóveda celeste que coloca cada cuerpo en su punto geográfico terrestre. Activado para ver la contabilidad; desactivado para ver solo lo que llega al ojo del observador.

## Disciplina de unidades

Todas las distancias son adimensionales. `FE_RADIUS = 1`. Sin radio terrestre, sin UA, sin kilómetros, sin trigonometría de círculos máximos. El marco esférico aquí es puramente conceptual.

---

# Barra inferior — leyenda de iconos

La barra oscura recorre todo el ancho de la vista. De izquierda a derecha:

## Transporte (grupo izquierdo)

| Icono | Significado |
| --- | --- |
| 🌐 / 👁 | Cambio de bóveda. 🌐 = actualmente en **órbita Celeste**; 👁 = actualmente en **Óptica primera persona**. Clic para cambiar. |
| ⏪ | Rebobinar. Primer clic invierte la dirección; clics siguientes duplican la magnitud negativa. |
| ▶ / ⏸ | Reproducir / Pausar. Pulsar ▶ resetea la reproducción automática al preset Día. Mientras se reproduce una demo, esto pausa / reanuda la demo sin terminarla. |
| ⏩ | Avance rápido. Espejo de ⏪. |
| ½× | Reduce a la mitad la magnitud actual. Dirección preservada. |
| 2× | Duplica la magnitud actual. Dirección preservada. |
| Terminar Demo | Aparece solo durante una demo activa. Clic para detener y resetear. |

## Grupo de brújula (centro-derecha)

Sub-cuadrículas de dos filas: una cuadrícula de modo 3 × 2, una fila de ciclo 2 × 2 y una cuadrícula cardinal 2 × 2.

### Cuadrícula de modo

| Icono | Significado |
| --- | --- |
| 🌙 | Activar **Noche permanente** (`NightFactor` fijado para que las estrellas permanezcan visibles). |
| ◉ | Activar **Posiciones reales** — puntos en la bóveda celeste que muestran la dirección geográfica terrestre de cada cuerpo. |
| 🎯 | **Modo Rastreador específico** — reduce la escena solo al `FollowTarget` activo. Apagado = `TrackerTargets` completo. |
| ▦ | Conmutador de cuadrículas combinado — alterna **cuadrícula FE + cuadrícula óptica + anillo azimutal celeste + anillo de longitud** juntos. |
| 📍 | Salta directamente al grupo **Observador** en la pestaña Vista (lat / lon / dirección / elevación). |
| 🎥 | Modo **Cámara libre**. Las flechas rotan / inclinan la cámara orbital en lugar de mover el observador. |

### Fila de ciclo

| Icono | Significado |
| --- | --- |
| 🗺 | Abrir ajustes de **Proyección de mapa** (mapa HQ + proyección matemática generada). |
| ✨ | Ciclar **Campo de estrellas**: aleatorio / carta oscura / carta clara / Cel Nav / AE Aries 1-3. |
| 🧭 | Activar la lectura completa de la brújula (anillo azimutal + anillo de longitud + cuadrícula óptica). |
| EN / CZ / ES / … | **Botón de idioma.** Clic para abrir Info → Selección de idioma. La cara del botón muestra el código actual de 2 letras. |

### Cuadrícula cardinal

| Icono | Significado |
| --- | --- |
| N | Fija `ObserverHeading` al Norte (0°). |
| E | Fija al Este (90°). |
| W | Fija al Oeste (270°). |
| S | Fija al Sur (180°). |

El cardinal cuya dirección coincide actualmente (dentro de 0,5°) recibe un borde de acento.

## Cuadros de búsqueda (a la izquierda de la pestaña Vista)

- **Búsqueda de cuerpos** — escribe 3+ caracteres del nombre de un cuerpo celeste (Sol, Luna, cualquier planeta, cualquier estrella / agujero negro / cuásar / galaxia / satélite, más Plutón). Sugerencias coloreadas por categoría. Enter / clic activa el protocolo de seguimiento.
- **Búsqueda de visibilidad** — escribe 2+ caracteres de cualquier ajuste de las pestañas Mostrar o Rastreador. Los resultados muestran la ruta `Pestaña › Grupo`; clic para abrir y expandir.

## Pestañas (extremo derecho)

**Vista / Tiempo / Mostrar / Rastreador / Demos / Info**. Cada una abre una ventana emergente anclada sobre su botón. Clic de nuevo o pulsar <kbd>Esc</kbd> para cerrar. Solo una emergente abierta a la vez; los grupos hermanos dentro de una emergente son mutuamente excluyentes.

---

# Pestaña Vista

## Observador

- **Figura** — figura del observador en el disco: Hombre, Mujer, Tortuga, Oso (sprite), Llama, Ganso, Gato negro, Gran Pirineo, Búho, Rana, Canguro, **Not Nikki Minaj** (predeterminada), Ninguna.
- **ObserverLat / ObserverLong** — posición del observador en la cuadrícula FE, paso 0,0001°.
- **Elevación** — altura del observador sobre el disco.
- **Dirección** — dirección de la brújula 0–360° en sentido horario desde el norte.
- Botones de ajuste: ±1°, ±1′, ±1″.
- Las flechas mueven lat/lon; <kbd>Espacio</kbd> alterna reproducción/pausa.

## Cámara (órbita Celeste)

- **CameraDir** — azimut orbital, −180° … +180°.
- **CameraHeight** — elevación orbital, −30° … +89,9°.
- **CameraDist** — distancia orbital, 2–100.
- **Zoom** — zoom orbital, 0,1–10×.

La primera persona Óptica usa su propio `OpticalZoom`; los valores no se filtran entre los dos.

## Bóveda Celeste

- **VaultSize / VaultHeight** — radio horizontal y proporción de cúpula aplanada para la bóveda celeste.

## Bóveda Óptica

- **Tamaño / Altura** — radio horizontal y extensión vertical de la cúpula óptica vista desde la vista celeste. La vista de primera persona Óptica es invariante a la `Altura`.

## Bóvedas de cuerpos

Alturas por cuerpo para dónde se asienta cada punto proyectado: Campo de estrellas, Luna, Sol, Mercurio, Venus, Marte, Júpiter, Saturno, Urano, Neptuno.

## Rayos

- **RayParam** — curvatura para las líneas de rayos bezier.

---

# Pestaña Tiempo

## Calendario

- **Zona horaria** — desfase de UTC en minutos.
- **Fecha / hora** — entrada directa de fecha y hora; también disponible deslizador.

## Fecha / Hora

- **DayOfYear / Time / DateTime** — tres deslizadores para el instante absoluto.

## Reproducción automática

- **▶ Pausa / Reanudar**, **estado**, presets de velocidad **Día / Semana / Mes / Año**.
- **Velocidad** — deslizador fino en d/s (días por segundo real), escala logarítmica.

---

# Pestaña Mostrar

Grupos de visibilidad, colapso mutuamente excluyente:

- **Bóveda Celeste** — bóveda, cuadrícula, trayectorias Sol / Luna.
- **Bóveda Óptica** — bóveda, cuadrícula, anillo azimutal, vector de orientación, polos celestes, círculos de declinación.
- **Suelo / Disco** — cuadrícula FE, círculos trópico / polar, GP Sol / Luna, anillo de longitud, sombra.
- **Rayos** — rayos de bóveda, rayos ópticos, rayos de proyección, muchos rayos.
- **Cosmología** — Axis Mundi: ninguno / Yggdrasil / Mt. Meru / vórtice / vórtice 2 / Discworld.
- **Proyección de mapa** — dos selectores lado a lado:
  - **Mapa HQ** — mapas raster: Vacío, Equirect Día / Noche, AE Equatorial dos polos, AE Polar Día / Noche, Gleason, Relieve sombreado mundial, Globo ortográfico.
  - **Generadas** — proyecciones matemáticas: AE por defecto, Hellerick, AE proporcional, AE Equatorial, Equirect, Mercator, Mollweide, Robinson, Winkel Tripel, Hammer, Aitoff, Sinusoidal, Equal Earth, Eckert IV, Ortográfica, Vacío.
- **Misc** — Planetas, Fondo oscuro, Logo.

---

# Pestaña Rastreador

El Rastreador es la única fuente de verdad para la visibilidad de los cuerpos. La casilla **Mostrar** de cada submenú gobierna toda la categoría; **TrackerTargets** decide qué IDs individuales se renderizan. **Activar todo** llena con todo en esa categoría; **Desactivar todo** lo limpia.

## Efemérides

- **Fuente** — elige cuál de los cinco pipelines de efemérides Sol/Luna/planeta dirige las posiciones realmente renderizadas. Los cinco se ejecutan internamente cada cuadro para que el panel de comparación siga válido; este desplegable solo elige cuál se *renderiza*.
  - **HelioC** — Kepler simplificado de Schlyter compuesto con la órbita geocéntrica del Sol. Ligero; nivel de grado para planetas interiores, rápido.
  - **GeoC** — Kepler con foco en la Tierra (una sola elipse por planeta, sin etapa de Sol). Conceptualmente limpio, deliberadamente menos preciso.
  - **Ptolomeo** — Deferente + epiciclo del *Almagesto*, portado vía Almagest Ephemeris Calculator. Cae ~5–10° de las posiciones modernas, exactamente como en las fuentes originales.
  - **DE405** — Tablas de efemérides diarias AstroPixels de Fred Espenak, 2019–2030. Referencia moderna; el predeterminado.
  - **VSOP87** — Teoría analítica de Bretagnon & Francou 1988. Luna delegada a Meeus. Alta precisión para planetas; la luna de Meeus tiene un desfase conocido de ~2,5° vs DE405.
- **Comparación de efemérides** — cuando está activado, cada tarjeta del rastreador en el HUD Live Ephemeris muestra hasta cinco filas de RA / Dec, una por pipeline. Útil para ver cuánto deriva Ptolomeo vs DE405, o cuán cerca está VSOP87, en tiempo real.
- **Precesión** — precesión clásica J2000-a-fecha aplicada a RA / Dec de estrellas fijas. Apagado = las estrellas permanecen en valores del catálogo J2000; Activado = avanzan a la fecha mostrada.
- **Nutación** — oscilación de período corto del polo celeste (~18,6 años). Pequeña (~10″) pero visible en lecturas precisas del rastreador.
- **Aberración** — aberración anual: las estrellas aparentemente se desplazan hasta ~20″ en la dirección del movimiento de la Tierra durante el año. Apagado = posiciones medias del catálogo.
- **Trepidación** — modelo histórico pre-newtoniano de oblicuidad oscilante. Proporcionado junto a la precesión para que los usuarios puedan comparar cómo ese marco más antiguo predijo el mismo fenómeno. Apagado por defecto.

## Campo de estrellas

Selecciona el render activo del campo y el modo (aleatorio, tres variantes de carta, Cel Nav, tres variantes AE Aries), Dinámico / Estático fade, Noche permanente.

## Opciones del Rastreador

- **Modo Rastreador específico** — cuando está activado, el único cuerpo pintado es `FollowTarget`; cualquier otro ID rastreado se oculta. Úsalo para fijar la atención en un solo objeto durante una demo o medición. Apagado por defecto.
- **Anular GP** — pinta el punto terrestre (sub-estelar / sub-solar) de un cuerpo en el disco aunque el conmutador maestro `Mostrar puntos terrestres` esté apagado. Permite estudiar solo los GPs sin cambiar la visibilidad global.
- **Posiciones reales** — puntos de la bóveda celeste que muestran la dirección geográfica real de la fuente de cada cuerpo (donde está, no donde aparece). Reflejado por el botón ◉ de la barra inferior.
- **Trayectoria GP (24 h)** — cuando está activado, cada cuerpo rastreado crece una polilínea de sub-punto de 24 horas en el disco. Sol / Luna / planetas muestrean la efemérides activa; las estrellas usan RA/Dec fijo + GMST; los satélites usan su función de sub-punto de dos cuerpos. Útil para trazos en forma de analema y para ver el movimiento diurno.

## Submenús

Cada submenú tiene las mismas cuatro filas de cromo encima de su cuadrícula de botones:

- **Mostrar** — gobierna toda la categoría. Apagado = nada en esta categoría se renderiza.
- **Anular GP** — anula el conmutador maestro `Mostrar puntos terrestres` para entradas en esta categoría.
- **Activar todo** — une cada ID en esta categoría a `TrackerTargets`. Las selecciones existentes de otras categorías permanecen.
- **Desactivar todo** — quita cada ID en esta categoría de `TrackerTargets`. Otras categorías intactas.

La cuadrícula de botones debajo lista cada entrada (alfabetizada). Clic en una entrada para alternar su pertenencia a `TrackerTargets`; las entradas activas reciben un borde de acento.

### Contenido por categoría

- **Cuerpos Celestes** — Sol, Luna, Mercurio, Venus, Marte, Júpiter, Saturno, Urano, Neptuno.
- **Cel Nav** — 58 estrellas de navegación del Almanaque Náutico (puntos amarillos cálidos).
- **Constelaciones** — estrellas catalogadas con nombre (puntos blancos) menos las superposiciones con Cel Nav. Lleva un conmutador adicional **Contornos** que dibuja figuras conectando las estrellas primarias de cada constelación.
- **Agujeros Negros** — 11 entradas (Sgr A*, M87*, M31*, Cygnus X-1, V404 Cygni, NGC 4258, A0620-00, NGC 1275, NGC 5128, M81*, 3C 273 BH).
- **Cuásares** — 19 originales (3C 273, OJ 287, BL Lacertae, etc.); BSC añade 700 más.
- **Galaxias** — 20 originales (M31, M82, M104, NGC 5128, LMC, SMC, etc.) más la entrada **Vía Láctea (Centro Galáctico)**; BSC añade 700 más.
- **Satélites** — 12 entradas orbitales base: ISS, Hubble, Tiangong, ocho representantes Starlink, James Webb (L2). Elementos Kepler de dos cuerpos; deriva ~1°/día desde la época 2024-04-15 — conceptual, no de precisión.
- **Catálogo de Estrellas Brillantes (BSC)** — un catálogo unión de ~2 967 entradas reunidas de cualquier otra categoría más extras. Tiene **su propia** lista `BscTargets` (independiente de `TrackerTargets`) y **su propia** puerta de renderizado `ShowBsc`. **Activar todo** en BSC solo escribe a `BscTargets`, así que los resaltados aparecen inmediatamente pero no se renderizan puntos hasta que se marque `Mostrar`. El renderizador BSC pinta todas las entradas seleccionadas con colores por fuente. Un botón extra **Desactivar satélites** quita cada ID `star:sat_*` de `BscTargets`.

Desglose del contenido del BSC:

| Fuente | Cantidad |
| --- | --- |
| Estrellas Cel-nav | 58 |
| Estrellas catalogadas (primarias de constelaciones) | 47 |
| Agujeros negros | 11 |
| Galaxias (originales + 200 OpenNGC + 500 OpenNGC) | 720 |
| Cuásares (originales + 200 VizieR + 500 VizieR) | 719 |
| Estrellas con nombre (393 IAU/HYG mag ≤ 8 + 500 sin nombre más brillantes) | 892 |
| Satélites (12 + ~500 CelesTrak) | 509 |
| Cuerpos del sistema solar + Plutón | 10 |
| **Total (deduplicado)** | **2 967** |

Cada cuerpo catalogado se renderiza en su propio color: Cel Nav amarillo cálido, catalogado blanco, agujeros negros púrpura, cuásares cian, galaxias rosa, satélites verde lima, BSC color por categoría de origen.

---

# Pestaña Demos

Navegador de animaciones programadas. Controles arriba: **Detener**, **Pausar / Reanudar**, **Anterior / Siguiente**. Mientras reproduce una demo, ▶ / ⏸ de la barra pausa la demo en su lugar; ½× / 2× escalan su tempo; **Terminar Demo** aparece en la pila de velocidad. Secciones:

- **Sol 24 h (4)** — demos de sol polar (Alert NU, Antártida Occidental, sol de medianoche N/S).
- **General (6)** — equinoccio en el ecuador, solsticios de verano / invierno a 45°N, ciclo lunar de un mes, viaje del observador, 78°N 24 horas de luz diurna.
- **Analema Solar / Analema Lunar / Analema Solar + Lunar** — 5 variantes de latitud (90°N, 45°N, 0°, 45°S, 90°S). Observador fijo; tiempo fijo a 12:00 UTC; un paso diario por cada 30/365 s. Mantén al final para que puedas estudiar la curva.
- **Eclipses Solares (44 entradas, 2021–2040)** — uno por cada eclipse solar real (Espenak). La demo refina el tiempo de sicigia usando el Sol + Luna del pipeline activo y planta al observador en el punto subsolar de ese pipeline.
- **Eclipses Lunares (67 entradas, 2021–2040)** — misma estructura, incluyendo 22 penumbrales.
- **Predicciones de Eclipse FE** — marcador de posición para un futuro predictor armónico Saros.

---

# Pestaña Info

Grupos de enlaces externos a comunidades y creadores en torno a este trabajo (Space Audits, Shane St. Pierre, Man of Stone, Globebusters, Aether Cosmology CZ-SK, Discord, Clubhouse, Twitter Community).

---

# Paneles HUD

- **HUD principal (arriba a la izquierda, colapsable)** — encabezado `Fases Lunares en Vivo`. El cuerpo contiene DateTime, az/el de Sol + Luna, % fase lunar, cuenta atrás del próximo eclipse solar + lunar, lienzo de fase lunar (ilustración + barra de iluminación + nombre de fase).
- **HUD del rastreador Live Ephemeris** — alternado por el botón debajo del HUD. Una tarjeta por cuerpo rastreado con az/el y filas RA/Dec por pipeline.
- **Tira de info inferior** — Lat · Lon · El · Az · Mouse El · Mouse Az · efem · tiempo · velocidad actual (`+0.042 d/s`) arriba; `Tracking: <nombre>` abajo.
- **Banner de advertencia Meeus** — franja roja cuando BodySource activo depende de la luna de Meeus (HelioC / GeoC / VSOP87).
- **Cadence chip (solo Óptico)** — chip arriba a la derecha con cadencia activa (15° / 5° / 1°), FOV, dirección.
- **Pie de descripción dinámico** — estado de una línea bajo el lienzo (latitud + estado del Sol + etapa del crepúsculo). Las demos sobrescriben con texto narrativo.

---

# Seguimiento interactivo (cualquier vista)

- **Hover** — el cursor muestra un tooltip (`Nombre / Az / Alt`) sobre cualquier cuerpo visible. Óptico golpea vía az/el; Celeste vía píxeles de pantalla proyectados (radio 40 px).
- **Clic para fijar** — activa `FollowTarget`. En Óptico: ajusta dirección + pitch al cuerpo. En Celeste: habilita cámara libre con preset de vista a vista de pájaro.
- **Cámara libre (Celeste + seguimiento)** — la órbita se ancla alrededor del punto terrestre del cuerpo, no del origen del disco. El GP se pinta independientemente del conmutador maestro Mostrar puntos terrestres.
- **Romper el bloqueo** — cualquier arrastre real (≥ 4 px) limpia `FollowTarget` y `FreeCamActive`.

---

# Teclado

- **Flechas** — mueven la lat / lon del observador (o rotan la cámara en modo de cámara libre).
- **<kbd>Espacio</kbd>** — alterna reproducción / pausa.
- **<kbd>Esc</kbd>** — cierra la emergente abierta → pausa la demo activa → limpia el seguimiento, en orden de prioridad.

---

# Idiomas

18 soportados a través del ciclador de idioma de la barra inferior:

EN · CZ · ES · FR · DE · IT · PT · PL · NL · SK · RU · AR · HE · ZH · JA · KO · TH · HI

Etiquetas de pestañas, títulos de grupos, etiquetas de filas, etiquetas de botones, ranuras de la barra de info, cromo de reproducción automática, tooltips de transporte, texto del encabezado, lecturas de estado y encabezados de los paneles Live — todos se retraducen en vivo. Árabe y hebreo invierten la dirección del documento a RTL.

---

# Persistencia de orientación

Cada campo de estado vive en el hash de la URL para que un setup del sim se pueda compartir como enlace. La URL está versionada — cuando un valor predeterminado cambia entre versiones, el incremento de versión le dice al cargador que descarte las claves obsoletas y use el nuevo predeterminado.

---

# Créditos

- **Fred Espenak** (NASA GSFC retirado, AstroPixels) — efemérides diarias DE405, catálogos de eclipses.
- **R.H. van Gent** (Utrecht) — Almagest Ephemeris Calculator, fuente para el port de Ptolomeo.
- **Bretagnon & Francou** — teoría planetaria VSOP87.
- **Sonia Keys / commenthol** — port JS con licencia MIT de coeficientes de VSOP87.
- **Jean Meeus** — *Astronomical Algorithms* (1998).
- **Shane St. Pierre** — encuadre conceptual y el empuje para realmente construir una demostración interactiva funcional.
- **Walter Bislin** — inspiración de visualización.
- **HYG v41** (David Nash / astronexus) — datos de estrellas brillantes.
- **OpenNGC** (Mattia Verga) — catálogo de galaxias.
- **VizieR / CDS** (Véron-Cetty & Véron 2010) — catálogo de cuásares.
- **CelesTrak** (Dr. T.S. Kelso) — feeds TLE para satélites.
