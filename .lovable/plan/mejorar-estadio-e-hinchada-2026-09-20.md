# Mejorar estadio e hinchada

## Objetivo
Dar más vida al estadio del partido manteniendo el estilo low-poly y buen rendimiento.

## Cambios
- Reemplazar los espectadores-cubo por hinchas proporcionados con cabeza, torso, brazos, ojos y boca mediante mallas instanciadas.
- Distribuir colores de local y visitante por sectores para que la tribuna se sienta organizada.
- Añadir banderas low-poly con palos y telas animadas en los cuatro lados del estadio.
- Mejorar las gradas con asientos, barreras, accesos y focos para dar más volumen al recinto.
- En cada gol, aumentar temporalmente saltos, brazos, balanceo de banderas y confeti; la reacción será más intensa para la parcialidad del equipo que marcó.
- Mantener la animación por tiempo real y reutilizar geometrías para evitar ralentizaciones.

## Verificación
- Comprobar el partido en navegador y capturar una imagen antes y durante una reacción de gol.
- Confirmar que no haya errores visibles ni de consola.

## Detalles técnicos
La mejora se hará dentro de la escena Three.js existente, usando `InstancedMesh` para cuerpos, cabezas, caras y brazos de la multitud, y grupos simples para las banderas animadas.
