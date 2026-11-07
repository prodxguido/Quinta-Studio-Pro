# QUINTA Remote Script v2

La instalación y prueba están en [README.md](README.md). Usar AMXD, JS y Remote Script de la misma versión; no mezclar con el receptor anterior.

Seleccionar `QUINTA` en Preferencias → Link, Tempo & MIDI → Control Surface, sin puertos MIDI. El script escucha únicamente `127.0.0.1:9010` y consulta el Rack en:

`User Library/Presets/MIDI Effects/MIDI Effect Rack/Quinta MIDI Reciever.adg`

No buscar en Audio Effect Rack ni corregir la grafía de `Reciever`. No se usa browser.roots ni se intenta pasar una ruta de disco a load_item. El ACK del JS, no el nombre del Rack ni el retorno de load_item, habilita el envío. Los diagnósticos `QUINTA v2:` se escriben en Log.txt de Live.

La presencia de este código en el proyecto no confirma funcionamiento en Live. Falta la prueba manual indicada en README.
