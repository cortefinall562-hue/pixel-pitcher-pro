# **Soccer Star Creator**

Actúa como un desarrollador web experto en videojuegos. Crea la pantalla inicial y el editor de personajes en 3D para un juego web de Mánager de Fútbol. 

Usa HTML, Tailwind CSS y Three.js. El estilo visual debe ser idéntico al juego "Mini Soccer Star" o "Crossy Road" (gráficos low-poly, modelos hechos con bloques/cubos limpios, colores planos y brillantes de estilo caricatura).

Divide la pantalla en dos columnas principales (Lado Izquierdo: Interfaz / Lado Derecho: Canvas 3D).

REQUISITOS DEL LADO DERECHO (EL ENTRENADOR 3D):

1. Canvas 3D: Debe ocupar exactamente toda la mitad derecha de la pantalla. El fondo debe ser un cielo celeste claro con un suelo de césped verde hecho con bloques 3D.

2. Modelo del DT: Construye un entrenador usando figuras primitivas de Three.js (Cajas/Cubos para la cabeza, torso, manos y pies; Cilindros para brazos y piernas). Debe verse cuadrado, estilizado y tierno (estilo Mini Soccer Star).

3. Rigging y Animación: Implementa una animación "Idle" (de espera) usando código. Los brazos deben balancearse suavemente y el torso debe subir y bajar levemente simulando que el personaje está respirando.

REQUISITOS DEL LADO IZQUIERDO (INTERFAZ Y FLUJO):

El fondo de este panel debe ser oscuro y moderno, con bordes redondeados y tipografías limpias estilo videojuego de deportes.

1. Estado Inicial (Menú Principal):

- Título del juego en la parte superior con un diseño llamativo.

- Botón 1: "JUGAR" (Color verde brillante con efecto de iluminación al pasar el mouse).

- Botón 2: "CONFIGURACIÓN" (Diseño minimalista gris oscuro).

- Acción de Configuración: Al pulsarlo, el menú se oculta suavemente y aparece un cartel central que dice "Controles Predeterminados: Clic Izquierdo para interactuar en los menús tácticos. Teclas de dirección para navegar por la plantilla". Incluye un botón "Volver" para regresar al menú principal.

2. Estado del Editor (Al pulsar "JUGAR"):

- Al hacer clic en "JUGAR", el menú principal desaparece con una animación fluida y se transforma en el "Editor del Director Técnico".

- Agrega un campo de texto para que el usuario escriba el "Nombre del DT" (Ej: "Mánager Gallardo").

- Controles de Personalización (Deben modificar el modelo 3D del lado derecho en tiempo real):

  * PEINADO: Botones "<-" y "->" para cambiar entre 3 tipos de pelo en el muñeco (Pelado, Pelo Corto de Bloques, o Pelo con Flequillo de Bloques) y un selector de colores (Negro, Rubio, Marrón).

  * CEJAS: Un selector para cambiar la expresión del muñeco (Cejas normales rectangulares, Cejas enojadas inclinadas hacia el centro, o Cejas gruesas).

  * ATUENDO: Botones para cambiar el color de la ropa del muñeco entre 3 estilos (Traje elegante negro, Camisa blanca con corbata, o Ropa deportiva de entrenamiento).

- Botón Final: En la parte inferior, coloca un botón grande que diga "Guardar y Continuar" (Déjalo listo, ya que en el siguiente paso programaremos la transición a la temporada).

Asegúrate de que todo el código sea funcional, no tenga errores de consola y se pueda probar inmediatamente en la vista previa del navegador de Lovable.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://pixel-pitcher-pro.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/568f5caa-0ad8-431e-8566-fb6fdaea0d75).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
