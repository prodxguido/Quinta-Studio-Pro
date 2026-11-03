# QUINTA para Windows

El instalador se genera en `release/QUINTA-Setup-0.1.0-x64.exe`.

## Compartir e instalar

Enviar el archivo Setup completo. El destinatario lo ejecuta, elige la carpeta y termina el asistente. Se crean accesos en Inicio y en el escritorio. Incluye el runtime: no necesita Node, Python ni instalar dependencias. Destino: Windows 10/11 de 64 bits.

Esta distribución no está firmada con un certificado comercial; Windows puede mostrar un aviso de editor desconocido. No es una publicación de Microsoft Store.

## Proyectos

Cada instalación guarda sus propios datos locales. Los proyectos del navegador no se transfieren automáticamente: guardarlos como JSON desde la versión web y abrirlos desde la aplicación. Para compartir música, usar Guardar proyecto o Exportar MIDI. El MIDI no incluye los sonidos sintetizados.

El programa puede funcionar sin conexión. Las fuentes tipográficas de Google son opcionales y tienen alternativas del sistema; las lecturas externas de la biblioteca sí necesitan Internet.

## Desarrollo

`npm ci` instala las versiones exactas del lockfile. `npm test` ejecuta las pruebas de lógica. `npm run dist` genera el instalador. La validación de audio, instalación y compatibilidad con DAWs requiere prueba real en el equipo destinatario.
