# QUINTA → Live: prueba de integración v2

Estado: implementación y harness offline preparados; **carga real pendiente de confirmación en Live**. No se publicó una release ni se cambió la instalación de Live durante el desarrollo.

## Instalador de Windows

El instalador NSIS y las actualizaciones hechas desde QUINTA copian el AMXD, el JS externo, el Rack y el Remote Script a `Documentos/Ableton/User Library` del usuario que instala. Windows resuelve `Documentos` según el perfil, incluso si está redirigido. Antes de reemplazar archivos, guarda los anteriores en `Documentos/Ableton/QUINTA-backup-*`; el resultado queda en `Documentos/Ableton/QUINTA-install.log`. El Rack empaquetado conserva su referencia relativa y durante la instalación se ajusta su referencia absoluta a la ubicación real del AMXD. Al terminar, reiniciá Live y elegí `QUINTA` en Control Surface.

Si Live usa una User Library personalizada, estos archivos no aparecerán allí: habrá que apuntar Live a la ruta predeterminada o copiar los archivos desde ella. La carga del Rack y el protocolo completo aún requieren una prueba real en otra instalación de Live. El instalador no configura las preferencias de Live automáticamente.

## Prueba corta

1. Cerrá Live. Desde PowerShell en la carpeta del proyecto ejecutá:
   `powershell -NoProfile -ExecutionPolicy Bypass -File .\ableton\Instalar-Prueba.ps1`
   Copia y verifica AMXD, JS, Rack y Remote Script; imprime una carpeta temporal de respaldo. No modifica tus Sets. Si tu User Library cambió, usá `-UserLibrary "ruta"`.
2. Abrí Live con `QUINTA` seleccionado como Control Surface y un Set nuevo **sin receptor precargado**. Abrí QUINTA de desarrollo (`npm start` o `Abrir QUINTA Desarrollo.bat`).
3. Creá una progresión corta y pulsá **Enviar a Ableton**. Esperado: una pista receptora con Rack y una pista/clip de Arrangement por canal con notas, más el aviso `N pistas importadas en Arrangement.` Repetí una vez: se reutiliza el receptor y se agrega una nueva importación, sin receptores extra.

Respondé con el aviso exacto y si aparecieron Rack, clips y notas. Si falla la carga, incluí las últimas líneas `QUINTA v2:` de `%APPDATA%\Ableton\Live <versión>\Preferences\Log.txt`. Los mensajes del Remote Script van a ese archivo; los del dispositivo, a Max Console. Una espera agotada después de enviar significa resultado desconocido: revisar Arrangement antes de volver a pulsar.

El reinicio de esta prueba es para cargar los archivos v2 recién copiados, no una explicación del fallo anterior. Para revertir la prueba, con Live cerrado copiá los archivos del respaldo a las mismas rutas relativas de User Library.

## Archivos y rutas

- `User Library/QUINTA Receiver/QUINTA Receiver.amxd`
- `User Library/QUINTA Receiver/quinta_receiver.js` (obligatorio, externo al AMXD)
- `User Library/Presets/MIDI Effects/MIDI Effect Rack/Quinta MIDI Reciever.adg`
- `User Library/Remote Scripts/QUINTA/{__init__.py,control_surface.py}`

El Rack incluido es una copia del preset real del usuario, con su nombre exacto. Contiene una referencia relativa a User Library y una referencia absoluta al equipo original. El instalador reescribe esa referencia absoluta; su carga real en otra máquina sigue pendiente de validación.

## Comportamiento

El Remote Script localiza el preset siguiendo la ruta exacta desde `browser.user_library`. Si falta una carpeta, informa el nivel y las entradas visibles antes de crear una pista. Selecciona una pista MIDI nueva y carga el BrowserItem; espera una respuesta del JS inicializado por `live.thisdevice`. El receptor ya presente se reutiliza mediante ese mismo handshake.

Las llamadas Live del script se hacen en `schedule_message`. Max recibe en baja prioridad con `udpreceive 9009 @defer 1`. No se usa el retorno de `create_midi_track`: se consulta la colección de pistas. Max valida todo el proyecto antes de crear pistas, omite canales vacíos, crea clips desde el beat 0 y verifica los IDs de notas devueltos. El tempo se aplica al terminar. Ante error intenta borrar solamente las pistas de esa importación y restaurar el tempo; informa si la limpieza falla.

Cada pulsación exitosa es una nueva importación. Los reintentos UDP de la misma pulsación conservan ID y resultado para evitar duplicados durante 120 segundos. No es una garantía de exactamente una vez frente a reinicios de Live/Max o pérdida total de respuestas; esos casos quedan como resultado desconocido. Usar un único QUINTA Receiver por Set.

## Verificaciones

`npm test` ejecuta las pruebas existentes. `npm run test:ableton` necesita Node y Python 3 y prueba bytes OSC entre JS/Python, búsqueda/carga simulada, retorno nulo de create_midi_track, reversión, deduplicación, validación, correspondencia AMXD/maxpat y UDP real en puertos efímeros con pérdida de ACK. No conecta con Live ni usa 9009/9010. Requiere loopback habilitado; un sandbox que bloquee la recepción UDP hará fallar esa parte.

`python ableton/build_device.py` reconstruye el chunk de patch del AMXD a partir del maxpat, preservando su encabezado MIDI original. No empaqueta el JS externo.

El harness no ejecuta el navegador de Live, Max, sus objetos UDP ni las llamadas Live API reales. La copia automática del instalador usa la User Library predeterminada; faltan la prueba de carga real en Live, la detección de User Library personalizada y la prueba de actualización/restauración en otra máquina.

Ver [AUDITORIA.md](AUDITORIA.md) para evidencia, fuentes y protocolo.
