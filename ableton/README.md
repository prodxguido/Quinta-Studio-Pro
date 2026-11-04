# QUINTA Receiver para Ableton Live 12 Suite

El dispositivo `QUINTA Receiver.amxd` recibe el proyecto de QUINTA por UDP local (puerto 9009) y crea una pista MIDI por canal con un clip en Arrangement desde el compás 1. Las pistas existentes permanecen intactas. La importación cambia el tempo del Set al tempo de QUINTA.

## Instalación

1. Abrí Ableton Live y elegí una pista MIDI.
2. Arrastrá `QUINTA Receiver.amxd` a esa pista. Conservá `quinta_receiver.js` en la misma carpeta que el `.amxd`.
3. Abrí QUINTA con `Abrir QUINTA Desarrollo.bat` y usá **Enviar a Ableton**.
4. Cambiá a Arrangement para ver las pistas y los clips nuevos. Si no aparecen, abrí la consola de Max para ver el error.

En la versión instalada de QUINTA, los archivos del dispositivo están en `resources/ableton` junto al ejecutable. El botón de QUINTA necesita que el dispositivo esté cargado en el Set.

El envío de UDP solo confirma que QUINTA entregó los datos al puerto local; el dispositivo informa la importación en la consola de Max. Cada envío crea pistas nuevas. Los canales silenciados y las notas silenciadas se envían con las notas desactivadas para conservarlas editables.
