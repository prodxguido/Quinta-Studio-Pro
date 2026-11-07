# Auditoría QUINTA ↔ Live — 2026-11-06

## Evidencia observada antes de editar

- `desktop/main.cjs`, handler `send-to-live`: `setTimeout(resolve,800)` después del bootstrap; al terminar devolvía `{ok:true}` sin escuchar respuestas. Esto demuestra una carrera de disponibilidad y un aviso de éxito sin confirmación, pero no identifica por sí solo por qué el navegador no encontraba el preset.
- `control_surface.py`, `_load_receiver`: comprobaba `any(device.name == DEVICE_NAME for device in track.devices)` inmediatamente después de `browser.load_item`. `_ensure_receiver` usaba la misma comprobación superficial. No recorrían `device.chains`; el preset real contiene `MidiEffectGroupDevice` y un `MxDeviceMidiEffect` en su cadena. La comprobación no contemplaba esa estructura.
- El mismo `_load_receiver` creaba una pista antes de cargar y su bloque except no llamaba a delete_track. Un fallo podía dejar esa pista.
- Bootstrap anterior: `/quinta_bootstrap`, tags `,s`, argumento `QUINTA Receiver`; OSC strings terminadas en NUL y alineadas a 4 bytes. El parser anterior aceptaba `data.startswith(b"/quinta_bootstrap")`. **No hay evidencia de incompatibilidad de ese prefijo**. La versión nueva cambia explícitamente el protocolo para añadir ID/ACK; no presenta ese cambio como causa histórica.
- `QUINTA Receiver.maxpat`: `udpreceive 9009 @defer 1` conectado a `js quinta_receiver.js`; `live.thisdevice` existía sin conexión. No había udpsend para respuestas. AMXD tenía encabezado `ampf`, tipo MIDI `mmmm`, chunk `ptch` con el JSON y NUL final.
- `quinta_receiver.js`: el source ya no contenía `dictionary.free()`. No se inspeccionó ni recargó una instancia en memoria; no se atribuye el error antiguo al source nuevo.
- El archivo real `C:/Users/Produ/Documents/Ableton/User Library/Presets/MIDI Effects/MIDI Effect Rack/Quinta MIDI Reciever.adg` es gzip XML; contiene `MidiEffectGroupDevice`, `RelativePathType=6`, `RelativePath=QUINTA Receiver/QUINTA Receiver.amxd` y la ruta absoluta informada por el usuario. Se copió sin modificar al proyecto.
- Los scripts distribuidos con Live en `C:/ProgramData/Ableton/Live 12 Suite/Resources/MIDI Remote Scripts` contienen referencias verificadas leyendo las constantes de sus .pyc, sin ejecutarlos: `Push/browser_model.pyc` → `action` usa `browser, load_item, content`; `Push/browser_query.pyc` → `query` usa `user_library`; `Push2/browser_component.pyc` → `_load_item` usa `hotswap_target, load_item` y `children` usa `user_library`. Esto confirma que esa vía existe en la instalación; **no prueba la estructura de sus BrowserItems en este Set ni el resultado de cargar nuestro Rack**.

## Decisión y límites

| Vía | Límite relevante | Decisión |
| --- | --- | --- |
| Max/Live Object Model | Necesita un dispositivo ya cargado; insert_device excluye M4L y plugins | Conservar para importar clips/notas, no para su propia carga |
| Remote Script + BrowserItem | API Python interna usada por scripts incluidos; no contrato público estable para buscar presets de usuario | Elegida para cargar el Rack, con ruta acotada, diagnóstico y ACK real |
| Plantilla de Set | Preinstala el receptor, pero exige partir de esa plantilla; no resuelve cualquier Set existente | No elegida |
| Automatización de interfaz | Depende del estado de ventanas; además el usuario la excluyó | No utilizada |

No se promete que browser.load_item ya funcione en este equipo. Si la ruta del navegador difiere, el error devolverá el nivel y nombres disponibles; esa evidencia guiará el siguiente ajuste, sin volver a una búsqueda recursiva ilimitada.

## Protocolo v2

Todo tráfico se dirige a loopback. OSC big-endian para int32; strings UTF-8 con NUL y padding a múltiplos de cuatro.

| Emisor → receptor | Puerto destino | Mensaje/tipos | Argumentos |
| --- | --- | --- | --- |
| QUINTA → Remote Script | 9010 | `/quinta_bootstrap ,ss` | ID UUID prefijado q, versión `2` |
| Remote Script → Max | 9009 | `/quinta_probe ,s` | mismo ID |
| Max → Remote Script | 9010 | `/quinta_status ,sss` | ID, `ready`, `quinta-live-v2` |
| QUINTA → Max | 9009 | `/quinta ,siis` | ID, índice base cero, cantidad, fragmento |
| Max → Remote Script | 9010 | `/quinta_status ,sss` | ID, `done` o `error`, detalle |
| Remote Script → QUINTA | puerto efímero del emisor | JSON UTF-8 | `{id,stage,detail}` |

El payload conserva `quinta-live-v1`, JSON codificado con encodeURIComponent y bloques de 512 caracteres. Se rechazan paquetes mal formados, IDs ajenos y tipos incorrectos. Max acepta proyectos solo después del probe y de `live.thisdevice`. El script espera hasta 17 segundos; QUINTA espera hasta 20 segundos por ready y luego reenvía la misma transacción hasta tres veces con espera de ACK de 10 segundos por intento. El estado del script expira a los 120 segundos; el receptor conserva deduplicación durante esa ventana. No se afirma exactamente una vez tras reinicio o pérdida total de ACK.

El éxito informa solo después de crear clips y recibir IDs de las notas. Una respuesta de error intenta limpiar las pistas propias; una ausencia de respuesta final conserva el trabajo de resultado desconocido.

## Fuentes primarias consultadas

- [Song LOM](https://docs.cycling74.com/apiref/lom/song/): create_midi_track(-1) agrega al final; no documenta retorno Track. Consultamos tracks después de llamar. delete_track recibe índice.
- [Track LOM](https://docs.cycling74.com/apiref/lom/track/): create_midi_clip(start_time,length) crea en Arrangement; insert_device (desde 12.3) admite dispositivos nativos, excluye M4L y plugins.
- [Clip LOM](https://docs.cycling74.com/apiref/lom/clip/): add_new_notes recibe diccionario notes y devuelve lista de IDs. Campos pitch/start_time/duration/velocity/mute según documentación.
- [live.thisdevice](https://docs.cycling74.com/reference/live.thisdevice): bang al completar inicialización del dispositivo.
- [udpreceive](https://docs.cycling74.com/reference/udpreceive/): decodificación OSC; defer=1 entrega en cola de baja prioridad.
- [udpsend](https://docs.cycling74.com/reference/udpsend/): envío de mensajes UDP/OSC.
- Scripts de Push de la instalación local, indicados arriba: evidencia primaria de uso de browser.user_library/load_item/hotswap_target. No se ejecutó Live para esta auditoría.

## Validación pendiente

El harness sustituye LiveAPI y Browser por dobles. No valida los tipos que devuelve Max real al añadir notas, referencias externas resueltas por el Rack, activación del JS, mensajes OSC emitidos por udpsend ni el contenido del navegador en ejecución. Esas comprobaciones se resuelven con la prueba manual y su ACK de extremo a extremo. El instalador de release se implementará después de esa confirmación.

## Resultado de la primera prueba en Live y corrección

El Log.txt de Live 12.4.3 registra `QUINTA v2: escuchando 127.0.0.1:9010` a las 04:13:48 y errores `WinError 10054` desde 04:14:18 (horas tal como aparecen en el registro). Los SHA-256 del Remote Script, JS y AMXD instalados coinciden con los del proyecto: no era una copia vieja de esos archivos.

En `_advance` se envía un probe al puerto 9009 antes de crear el receptor. `_poll` capturaba solo BlockingIOError alrededor de recvfrom; un error de Windows 10054 pasaba al manejador general y terminaba la transacción antes de continuar la carga. [Microsoft documenta que WSAECONNRESET en recvfrom UDP indica que un envío previo recibió ICMP Port Unreachable](https://learn.microsoft.com/en-us/windows/win32/api/winsock/nf-winsock-recvfrom). Es esperable al consultar el receptor aún no cargado.

Se corrige exclusivamente ese error en recvfrom: continúa el sondeo sin declarar éxito y conserva el límite de 64 eventos por ciclo y el timeout. Otros errores de socket siguen reportándose. Se añaden regresiones de puerto cerrado seguido de carga/ACK, otro error fatal y errores repetidos que no evaden el timeout. Esta corrección no demuestra todavía la carga del preset en Live; requiere repetir la prueba con el Remote Script actualizado.
