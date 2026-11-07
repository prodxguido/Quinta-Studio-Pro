# Sonidos y guardado

En la aplicación de Windows, el primer guardado pide una carpeta predeterminada y el nombre del proyecto. Guardar vuelve a escribir ese archivo; Guardar como crea otra versión. Carpeta de progresiones cambia la ubicación predeterminada para proyectos nuevos. Abrir proyecto asocia el archivo elegido al guardado. Cancelar conserva el proyecto. La preferencia de carpeta se guarda en los datos de usuario de Electron.

Los selectores de sonido muestran categorías con submenús al pasar el mouse, hacer clic o usar el teclado. Escape cierra el menú. La estrella guarda favoritos locales. La preescucha es opcional y se realiza al elegir un sonido.

Cada canal tiene una perilla de cantidad de reverb (arrastre vertical, flechas, Inicio y Fin) y un panel Filtro y reverb. Cutoff, resonancia y cantidad responden durante la reproducción. Los cambios de decay, tamaño, ataque y tipo actualizan el espacio al terminar el gesto. Los parámetros quedan en el proyecto y admiten deshacer.

La reverb estéreo usa respuestas impulsionales generadas por síntesis: Room, Hall, Plate y Ambient. Decay controla la caída de 60 dB, predelay la demora de la señal reverberada, ataque su crecimiento inicial y tamaño la distribución de reflexiones. Low cut y high cut afectan solamente la reverberación. Las voces mantienen sus envolventes y filtros internos además del filtro del canal.

Se agregan 18 presets: cuatro synths, cuatro plucks, cuatro bells, tres pads y tres strings sintéticos. Las cuerdas no son muestras acústicas. Los efectos corresponden a la escucha de QUINTA; un archivo MIDI conserva notas y no incorpora estos efectos de audio.

## Verificaciones

- `npm test`: regresiones y pruebas de guardado con diálogos simulados y archivos temporales.
- `npm run test:audio`: inicia Electron oculto con un perfil temporal aislado; comprueba el arranque real, renderiza acordes de los 18 presets con OfflineAudioContext y verifica señal finita, energía y ausencia de clipping en esos ejemplos, canales separados, controles e historial.

Las verificaciones numéricas no sustituyen la evaluación auditiva de los presets.
