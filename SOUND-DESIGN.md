# Sonidos y guardado

En la aplicación de Windows, el primer guardado pide una carpeta predeterminada y el nombre del proyecto. Guardar vuelve a escribir ese archivo; Guardar como crea otra versión. Carpeta de progresiones cambia la ubicación predeterminada para proyectos nuevos. Abrir proyecto asocia el archivo elegido al guardado. Cancelar conserva el proyecto. La preferencia de carpeta se guarda en los datos de usuario de Electron.

Los selectores de sonido muestran categorías con submenús al pasar el mouse, hacer clic o usar el teclado. El menú de preset y los paneles ARP, FILTRO y REVERB se cierran al salir con el puntero; también se puede cerrar el preset con Escape. La estrella guarda favoritos locales. La preescucha es opcional y se realiza al elegir un sonido.

El mixer muestra las tiras verticales en una fila con desplazamiento horizontal cuando no entran en el editor. A la izquierda permanece una tira de loops de mitad de ancho: permite elegir loops de reguetón o Afro, reserva dos espacios para futuros tipos y ofrece cutoff, cantidad de reverb y un fader de volumen propios. Las tiras de canales reúnen el nombre, el preset, los desplegables ARP, FILTRO y REVERB, las perillas de cutoff y cantidad de reverb, y un fader vertical de −∞ a +6 dB. Los faders actúan en vivo sin reiniciar la reproducción y su valor se guarda en el proyecto; su traslado al volumen MIDI exportado queda para una integración posterior. El cutoff dedica el 55% del recorrido a 40–2000 Hz. Un doble clic en el número de cualquier parámetro o bajo una perilla permite escribir un valor exacto. Cutoff, resonancia y cantidad responden durante la reproducción. Los cambios de decay, tamaño, ataque y tipo actualizan el espacio al terminar el gesto. Los parámetros admiten deshacer.

El filtro del canal permite elegir una pendiente de 12 o 24 dB por octava; la segunda opción encadena dos filtros pasa bajos y se puede cambiar durante la reproducción. La reverb estéreo usa respuestas impulsionales generadas por síntesis: Room, Hall, Plate y Ambient. Decay controla la caída de 60 dB, predelay la demora de la señal reverberada, ataque su crecimiento inicial y tamaño la distribución de reflexiones. Low cut y high cut afectan solamente la reverberación. Las voces mantienen sus envolventes y filtros internos además del filtro del canal.

Se agregan 18 presets: cuatro synths, cuatro plucks, cuatro bells, tres pads y tres strings sintéticos. Las cuerdas no son muestras acústicas. Los efectos corresponden a la escucha de QUINTA; un archivo MIDI conserva notas y no incorpora estos efectos de audio.

## Verificaciones

- `npm test`: regresiones y pruebas de guardado con diálogos simulados y archivos temporales.
- `npm run test:audio`: inicia Electron oculto con un perfil temporal aislado; comprueba el arranque real, renderiza acordes de los 18 presets con OfflineAudioContext y verifica señal finita, energía y ausencia de clipping en esos ejemplos, canales separados, controles e historial.

Las verificaciones numéricas no sustituyen la evaluación auditiva de los presets.
