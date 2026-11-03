# QUINTA — Harmonic studio

Abrir `index.html` en un navegador moderno. No requiere instalación. El sonido se activa con Reproducir o al seleccionar un acorde. Los archivos y el audio se procesan localmente. Las fuentes web son opcionales: sin conexión se usan fuentes del sistema.

## Uso

- Elegir tónica y escala; pulsar grados para agregar acordes.
- Seleccionar una tarjeta para editar color, inversión y duración. Arrastrar tarjetas para ordenar.
- Arrastrar notas para cambiar altura y posición; arrastrar su extremo derecho para duración. Doble clic en el fondo agrega una nota; sobre una nota la elimina.
- Insertar dominantes, sensibles, sustitutos o cadenas antes del acorde seleccionado.
- Reproducir con patrones y humanización; exportar MIDI estándar con tempo y patrón seleccionado.
- Guardar y abrir proyectos JSON. Hay autoguardado local, deshacer y rehacer. Guardar versión A y Recuperar A/B permite comparar dos estados.

## Alcance y limitaciones

Esta implementación es una primera versión funcional, no la totalidad del producto propuesto. Incluye cuatro escalas, dieciocho tipos de acorde, préstamos del modo paralelo, seis movimientos de voces y cuatro ideas iniciales. La conducción es heurística y no un solucionador de contrapunto. Las sugerencias son cuatro opciones diatónicas orientativas, no recomendaciones contextuales. La variación agrega extensiones, no analiza una melodía.

Pendientes: importación de melodías MIDI y armonización condicionada, exportación por voces o acordes, arrastre MIDI nativo al DAW, historial ramificado persistente, biblioteca de presets propios, fijación de voces internas, control continuo de complejidad, selección contextual de escalas menores y resoluciones engañosas asistidas. El sonido usa síntesis básica, no muestras de piano. La notación usa equivalentes enarmónicos simplificados. El piano roll visible cubre MIDI 48–89; proyectos importados con notas fuera de ese rango se reproducen pero no se ven correctamente.

## Actualización del editor

### Región de loop y navegación vertical

La barra sobre el piano roll permite arrastrar un tramo o sus extremos, ingresar inicio/final en tiempos (numerados desde 1), ajustar al canal activo y extender un compás. El final es exclusivo. La región se guarda en el proyecto y se puede deshacer. La reproducción recorta las notas al tramo elegido; la exportación MIDI sigue exportando el proyecto completo. Sin región manual, el canal activo determina el final: duración de los acordes o siguiente semicorchea después de la última nota del canal, sin redondear a otro compás. Las colas de los instrumentos pueden continuar como release, pero no agregan tiempo al ciclo.

El piano roll contiene siempre MIDI 0–127 y permite scroll vertical sin crear notas nuevas. Ajustar todo enfoca el contenido, pero no elimina registros del teclado. `node test-transport.cjs` verifica límites personalizados, ausencia de relleno a compás, repetición con reloj de audio y las 128 filas. Pendiente prueba auditiva y visual real.

### Bajos e instrumentos por canal

Cada canal incluye un selector independiente de instrumento (Sonido global conserva el comportamiento anterior). “＋ Canal de bajo” crea una pista vacía con Punch y muestra un registro grave. Presets: Reese, Reese deep, Punch, Rubber, Sub, Finger, Púa y Palm mute. Los tres últimos son aproximaciones sintetizadas de bajo eléctrico, no samples. Reese usa capas desafinadas sobre un fundamental limpio; los bajos cortos tienen envolventes rápidas. El instrumento se guarda con el proyecto y se usa tanto al editar como al reproducir. MIDI exporta notas, no estos timbres: hay que asignar un instrumento en Ableton. `node test-instruments.cjs` comprueba programación de voces y asignación de instrumentos; no certifica calidad auditiva.

Corrección del piano roll: Nueva sesión selecciona el valor exacto `0.25` de la rejilla. Arrastre, redimensionado y dibujo usan una rejilla validada para impedir posiciones `NaN`. Elegir una tarjeta o agregar un grado activa el canal de acordes; dibujar selecciona el acorde situado bajo el cursor. `node test-editing.cjs` reproduce la edición del segundo acorde, doble clic con scroll, reconocimiento de séptimas, rejilla vacía y deshacer. El selector simulado ahora rechaza opciones inexistentes, igual que HTML. Si se detecta timing inválido de la versión anterior, se respalda el estado en una clave local `quinta-timing-recovery-<fecha>` antes de restituir el inicio a cero y una duración válida; no es posible recuperar del JSON el timing original que ya se convirtió en `null`.

### Sesiones, reconocimiento y sonidos

El Cuaderno del productor y Género plugg comienzan cerrados; sus flechas permiten abrirlos. **Nueva sesión** ofrece Cancelar, Empezar sin guardar y Guardar y empezar. Con el selector de archivos compatible, sólo se reinicia después de completar la escritura; cancelar o fallar conserva el proyecto. En navegadores sin ese selector se solicita una descarga y se mantiene la sesión hasta que el usuario elige continuar. Nueva sesión restablece la tonalidad inicial, tempo, notas, canales, sonido, historial y A/B.

Se pueden dibujar notas directamente en el canal de acordes vacío: se crean compases vacíos automáticamente y sus tarjetas reconocen conjuntos exactos del catálogo. Para los canales adicionales aparecen tarjetas de reconocimiento con un selector de color que edita ese grupo de notas. Se agrupan ataques separados por hasta 60 ms, no se transcriben melodías/arpegios ni se infieren fundamentales ausentes. Se muestran alternativas cuando existen. Los cambios de color regeneran las notas del grupo; Deshacer permite recuperar el voicing y timing originales.

Sonidos añadidos: Velvet, Glass, Brass, Hollow y Shimmer; síntesis Web Audio con osciladores, filtro y envolventes. No son instrumentos VST ni muestras externas. Se conserva el sonido elegido en el proyecto.

**MIDI:** clic descarga el archivo; arrastrar ofrece un archivo en el portapapeles de arrastre web. La aceptación por aplicaciones externas depende del navegador/destino y no se verificó con Ableton. El arrastre nativo de un archivo del sistema sigue pendiente para la futura edición de escritorio. De momento, para Ableton, descargar y arrastrar el `.mid` desde el explorador. No se compiló ni empaquetó la aplicación, por indicación del usuario.

`node test-session.cjs` comprueba reconocimiento exacto, inversiones, conjuntos incompletos, agrupación, edición de extensiones, cancelación y fallos de guardado, reinicio y programación del synth mediante un grafo simulado. No reemplaza la comprobación auditiva ni visual en navegador real.

### Gestión de canales

Cada canal adicional tiene **Eliminar**, **Silenciar/Activar** y **Renombrar**. El campo de nombre se muestra sólo al renombrar para evitar nombres duplicados visualmente. El canal fijo de acordes tiene **Vaciar acordes**, que conserva las melodías. **Vaciar todo**, arriba y debajo de los canales, elimina acordes y todos los canales adicionales, detiene el audio y conserva tonalidad y tempo. Las eliminaciones se pueden recuperar con Deshacer durante la sesión. El autoguardado conserva el proyecto vacío al recargar; ya no se insertan acordes de ejemplo en proyectos guardados vacíos.

Pruebas de regresión añadidas a `node test-studio.cjs`: botón de eliminación individual, índices del canal activo, limpieza de selección, vaciado parcial/total, parada de reproducción, deshacer/rehacer, recarga vacía y creación posterior. Son pruebas de lógica con DOM simulado; no se realizó una nueva verificación visual en navegador.

- Escucha de notas con interruptor y guía de escala celeste (no bloquea cromatismos).
- Selección rectangular en el fondo, Shift + clic para agregar/quitar notas, movimiento y duración conjuntos. Flechas: semitono; Shift + flechas: octava. También hay botones de octava. Suprimir elimina la selección.
- Tarjetas de progresión plegables, zoom vertical/horizontal, Ajustar todo y vista ampliada (Escape para salir).
- Canales melódicos independientes con nombre, mute, notas fantasma de otros canales, autoguardado y deshacer. Doble clic dibuja en el canal activo.
- Exportación MIDI tipo 1: pistas independientes para acordes y canales. Los canales silenciados se exportan vacíos. El audio sigue usando el sonido global del instrumento.
- Biblioteca de 18 técnicas con filtros, búsqueda, fuentes y acciones prácticas: arpegios, guías melódicas, repetición, desplazamiento rítmico, duplicación de canal y comparaciones A/B.

El piano roll ahora ajusta su rango a las notas y permite transposición dentro de MIDI 0–127. Esto reemplaza la limitación visual de la versión inicial indicada arriba. Cambiar la estructura o duración de los acordes no desplaza automáticamente los canales melódicos: sus posiciones son absolutas en tiempos. La exportación por pistas ya está disponible; la importación MIDI sigue pendiente.

Verificación: `node --check app.js`, `node --check studio.js`, `node test-studio.cjs`. Las pruebas de lógica comprueban inicialización, transposición conjunta y límites MIDI, generación de arpegios, mute, repetición, deshacer y cabecera MIDI. Usan un DOM simulado; no sustituyen pruebas de interacción real. La prueba visual quedó bloqueada por la política del navegador de automatización para URLs `file://`. Falta validación visual y auditiva en navegador real.
