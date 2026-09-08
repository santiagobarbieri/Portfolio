# Portfolio — Santiago Barbieri

Web estática, sin build ni dependencias de ejecución. Albert Sans e Inter se sirven localmente desde `assets/fonts/`, junto a sus licencias OFL.

## Páginas

- `index.html`: Home y los cinco Featured, escritos directamente en HTML. Se superponen con scroll, empezando sobre Home.
- `shop.html`: introducción de Shop y apertura de la grilla mediante el rombo. La X reproduce la transición inversa; las dos líneas abren Index.
- `contact.html`: formulario de contacto.
- `editor.html`: editor y exportador de los JSON de las galerías.

Para ver la web localmente, ejecutar `python3 -m http.server 8000` en esta carpeta y abrir `http://localhost:8000`. No abrir los HTML con `file://`, porque las galerías se cargan mediante fetch.

En Vercel, importar el repositorio como sitio estático, sin comando de build; la raíz del proyecto contiene `index.html`.

## Contenido editable

Los textos de Home, certificados y fichas Featured se editan en `index.html`. Las descripciones tienen comentarios para completar. Para activar `visit`, agregar `href="https://..."` y quitar `aria-disabled="true"`. Las URLs sociales se completan en `socialURLs`, al comienzo de `js/app.js`.

Los cinco proyectos actuales son Apolo Studios, OLA, Astrak, Are we there yet? y Casa Brul. Astrak solo tiene `visit`, siguiendo la referencia. Los otros cuatro tienen una galería independiente. Para cambiar el conjunto de proyectos se editan el HTML, `galleryPaths` en `js/catalog.js` y las opciones del selector de `editor.html`.

La paleta se tomó de los píxeles de las referencias: crema `#f1f0e5`, texto `#232323`, Index `#dc2b2b`, Apolo `#122b79`, OLA `#80c39c`, Astrak `#e64b1c`, Are we there yet? `#0d35be` y Casa Brul `#180405`.

## Assets pendientes

Estas rutas ya están conectadas. Agregar los archivos o cambiar las rutas; los archivos faltantes muestran un placeholder discreto, nunca el icono de imagen rota.

| Uso                        | Ruta                                                                |
| -------------------------- | ------------------------------------------------------------------- |
| Retrato de Home            | `assets/santiago-portrait.jpg`                                      |
| Patrón de Index            | `assets/index-pattern.svg`                                          |
| Patrón de Contact          | `assets/contact-pattern.svg`                                        |
| Banner Apolo               | `assets/apolo-banner.png`                                           |
| Banner OLA                 | `assets/ola-banner.png`                                             |
| Banner Astrak              | `assets/astrak-banner.png`                                          |
| Banner Are we there yet?   | `assets/are-we-there-yet-banner.png`                                |
| Banner Casa Brul           | `assets/casa-brul-banner.png`                                       |
| Imágenes Apolo             | `assets/apolo-01.jpg` … `assets/apolo-06.jpg`                       |
| Imágenes OLA               | `assets/ola-01.jpg` … `assets/ola-06.jpg`                           |
| Imágenes Are we there yet? | `assets/are-we-there-yet-01.jpg` … `assets/are-we-there-yet-06.jpg` |
| Imágenes Casa Brul         | `assets/casa-brul-01.jpg` … `assets/casa-brul-06.jpg`               |

Los patrones se ocultan hasta que se agreguen. Las imágenes de Shop usan los previews existentes; los originales no se modificaron. Las cajas no agregan fondos blancos: los blancos que estén dentro de una imagen siguen siendo parte del archivo. Las imágenes conservan su proporción y se ajustan a la altura disponible.

## Galerías y JSON

`data/shop.json` es exclusivo de Shop. `data/galleries/` contiene un JSON local por galería de proyecto. El editor tiene secciones separadas para ambos. No hay integración con JsonBin ni backend de administración.

Cada archivo contiene `version`, `id`, `title`, `kind` (`shop` o `project`), `backgroundColor`, `textColor` y `items`. Los colores deben ser hex de seis dígitos. Cada elemento necesita `id` único, `title`, `type` y `src`. Puede incluir `alt`, `description`, `year`, `createdAt` y `download`. Los productos también usan `price` (número o null), `currency` (por ejemplo `ARS`) y `soldOut` (booleano).

En el editor: elegir Featured o Shop, seleccionar galería, editar o importar, descargar JSON y reemplazar el archivo indicado. Cambiar de sección conserva el borrador durante esa sesión. El editor no escribe archivos en el servidor. Los campos adicionales del JSON se conservan al exportar.

El catálogo anterior queda como respaldo en `data/archive/`; la web ya no lo usa. Posters se migraron a Prints. Tee y Logos no se muestran en Shop. Las categorías activas son Mockups, Fonts, Prints y Freebies; tocar una categoría pone las demás en gris, tocarla otra vez restablece todas.

## Interacciones

Las galerías reciclan una cantidad acotada de elementos para permitir desplazamiento infinito en ambos ejes. Trackpad: desplazar con dos dedos y pellizcar para cambiar escala. Mouse: rueda y arrastre; Ctrl + rueda cambia escala. Móvil: arrastre y pellizco con dos dedos. La zona central aumenta progresivamente los elementos y los bordes se funden con el fondo mediante una máscara ovalada. No hay controles numéricos de zoom.

Click o Enter sobre un elemento abre el carrusel. Flechas o teclado recorren el catálogo; `back to grid` vuelve a la misma posición. Escape cierra el carrusel o Index. La grilla se cierra con su propio control. `back to general` devuelve a la ficha Featured conservando su lugar en la página.

`add to wishlist` guarda IDs en `localStorage` bajo `portfolio-wishlist`. El botón permite agregar y quitar. No requiere cuenta. `add to cart` es una presentación del futuro flujo: informa que el checkout aún no está disponible, sin registrar compras ni simular pagos. Los agotados muestran `sold out` y precio tachado. Para ofrecer una descarga gratuita, asignar categoría `freebies` y ruta `download`; su botón descarga directamente el archivo, sin carrito ni formulario. Si no hay archivo configurado el botón permanece inactivo.

## Contacto

El formulario envía nombre, email y mensaje a `santibarbieri01@gmail.com` mediante FormSubmit. En el primer envío real, FormSubmit requiere que el dueño confirme el correo de activación. Hasta completar esa confirmación no se debe dar por habilitada la recepción de mensajes. La página muestra estados de envío y error y conserva el mensaje si falla.

No hay claves ni servidor de correo en el repositorio. Documentación del servicio: https://formsubmit.co/ y https://formsubmit.co/ajax-documentation.

## Organización

- `style/main.css`: sitio, galerías, carrusel y adaptación móvil.
- `style/editor.css`: editor.
- `js/app.js`: Index, transiciones de páginas y contacto.
- `js/gallery.js`: grilla, gestos y efecto central.
- `js/viewer.js`: carrusel, wishlist y descarga.
- `js/catalog.js`: rutas y validación de datos.
- `js/editor.js`: importación, edición y exportación.
