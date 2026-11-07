# Publicación de QUINTA

## Cambios de integración QUINTA ↔ Ableton

Antes de modificar el envío, el Remote Script o el dispositivo Max for Live, verificar conjuntamente ambos extremos del protocolo: dirección/puerto UDP, bytes OSC (incluido padding y tipos), nombre exacto y ubicación del preset de Live, y orden/resultado de las llamadas Live API. No declarar una causa por intuición: señalar la línea o evidencia que prueba el desajuste. Mantener las instrucciones de instalación alineadas con los archivos reales y confirmar que `create_midi_track` se usa según su retorno (Live API no garantiza que retorne el Track).

## Frase de publicación

Cuando el usuario use **PUBLICAR RELEASE** como instrucción para ejecutar la publicación, tratarlo como autorización explícita para publicar el estado actual del proyecto en GitHub. No pedir confirmación adicional para los pasos habituales de versionado, commit, tag y push.

No activar el flujo si la frase aparece solo en una pregunta, explicación o discusión de la publicación.

## Flujo

1. Revisar `git status`, la rama actual, el remoto y la última versión/tag. No borrar ni revertir cambios.
2. Revisar los cambios que se publicarían. Incluir los cambios locales del proyecto en el release; excluir secretos, credenciales, archivos ignorados y artefactos locales. Si hay contenido sensible o no relacionado que no se pueda separar con claridad, detenerse y explicar el impedimento.
3. Ejecutar las verificaciones existentes apropiadas para el proyecto cuando estén autorizadas por la solicitud y las instrucciones de la sesión. Si una verificación falla, no publicar.
4. Elegir el siguiente número SemVer según el alcance: patch para correcciones, minor para funciones compatibles y major para cambios incompatibles. Mantener sincronizadas `version` en `package.json` y `package-lock.json`.
5. Preparar un resumen breve de la versión, crear un commit y un tag `vX.Y.Z`, y subir el commit y el tag a `origin`.
6. El tag activa `.github/workflows/release.yml`, que compila el instalador de Windows y crea el GitHub Release. Informar el tag, el commit y el resultado/enlace del workflow o release si se puede consultar.

Si no se puede autenticar contra GitHub, el remoto rechaza el push o falla el workflow, no afirmar que la publicación terminó. Informar el último paso completado y el error concreto sin mostrar secretos.
