# QUINTA 0.2.0

- Arrastre MIDI nativo en la aplicación Windows: crea un archivo temporal real y lo entrega al sistema operativo. La versión web conserva su limitación. Pendiente comprobar la recepción en FL Studio y Ableton reales.
- Espacio controla reproducción cuando el foco no está en un campo de edición; evita reactivar botones de octava.
- Recorte izquierdo: mueve el inicio manteniendo el extremo derecho. Grillas 1/32, 1/64 y 1/128.
- Volumen por canal en reproducción. Los sonidos, audio WAV y niveles no se imprimen dentro del archivo MIDI.
- Ocho loops adjuntos incluidos. Adaptación del mecanismo documentado de JUCE a Web Audio: playbackRate = BPM proyecto / BPM original (91 por defecto del motor enviado). No se aplica normalización half/double-time. El audio se reproduce por resampling, con cambio de tono. El control de BPM original permite corregir un archivo con otro tempo. No se compiló el motor C++ dentro de Electron.
- Menú para crear arpegio, motivo melódico repetido, pedal o bajo de los acordes reconocidos. El bajo ocupa la duración de cada acorde y usa Punch. La melodía actual es un motivo determinista sencillo, no un generador aleatorio avanzado ni garantía de hit. El pedal de tónica puede crear tensiones deliberadas.
- Canales vacíos de hi-hat, clap, snare y kick sintetizados. Se dibujan como notas. Pendiente evaluación auditiva de calidad.
- Canales en un panel compacto con desplazamiento propio. Guía de reguetón con ejemplos originales, no transcripciones de hits. Contexto: https://www.berklee.edu/berklee-now/news/what-is-dembow-tracing-the-roots-of-a-global-phenomenon

## Velocity (sólo propuesta; no implementado)

Alt + botón izquierdo + arrastre vertical puede capturarse con Pointer Events. Al comenzar se registra velocity original; cada desplazamiento modifica de 1 a 127 sin alterar pitch/start/length. Mostrar número y color, permitir escucha moderada y agrupar el gesto en una sola acción de Deshacer. Cancelación con Escape. Reservar el gesto antes del arrastre normal y comprobar posibles conflictos con la tecla Alt del sistema. El volumen por canal no sustituye velocity por nota.

## Actualización

El instalador 0.2.0 mantiene appId y nombre de producto de 0.1.0. Está preparado para actualizar sobre la instalación anterior sin desinstalar. Cerrar QUINTA antes de instalar y guardar proyectos importantes como JSON. No se verificó la actualización en otro equipo. No hay certificado de firma.

## Verificación

Suite de regresiones anterior y test-workflow.cjs. Se comprobaron generación de bajo, volumen cero, subdivisiones y recorte izquierdo. Las pruebas usan simulación del DOM/audio, no acreditan integración real con DAWs, sonido ni ergonomía. Los cambios de código requieren el instalador nuevo; el 0.1.0 no contiene estas funciones.
