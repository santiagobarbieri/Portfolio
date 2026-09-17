# Portfolio — Santiago Barbieri

Web estática, sin build ni dependencias de ejecución. Albert Sans e Inter se sirven localmente desde `assets/fonts/`, junto a sus licencias OFL.

## Páginas

- `index.html`: Home tipográfico, sección About de tres columnas (información, certificados con scroll y retrato) y los cinco Featured, escritos directamente en HTML. Se superponen con scroll, empezando sobre Home, con una pausa de lectura entre fichas. Un footer de pantalla completa cierra el recorrido con contacto, acceso a Shop y vuelta al inicio.
- `shop.html`: introducción de Shop y apertura de la grilla mediante el rombo. Dentro de la grilla, la X ocupa la posición del abridor del menú y reproduce la transición inversa. El menú se abre desde las dos líneas de la introducción.
- `contact.html`: formulario de contacto.
- `editor.html`: editor y exportador de los JSON de las galerías.
- `json-creator.html`: generador de galerías nuevas a partir de URLs de imágenes, incluidas URLs directas de ImgBB.

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

Cada archivo contiene `version`, `id`, `title`, `kind` (`shop` o `project`), `backgroundColor`, `textColor` y `items`. Los colores deben ser hex de seis dígitos. Cada elemento necesita `id` único, `title`, `type` y `src`. Puede incluir `thumbnail` (imagen más pequeña para la grilla), `alt`, `description`, `year`, `createdAt` y `download`. Los productos también usan `price` (número o null), `currency` (por ejemplo `ARS`) y `soldOut` (booleano).

En el editor: elegir Featured o Shop, seleccionar galería, editar o importar, descargar JSON y reemplazar el archivo indicado. Cambiar de sección conserva el borrador durante esa sesión. El editor no escribe archivos en el servidor. Los campos adicionales del JSON se conservan al exportar.

El catálogo anterior queda como respaldo en `data/archive/`; la web ya no lo usa. Posters se migraron a Prints. Tee y Logos no se muestran en Shop. Las categorías activas son Mockups, Fonts, Prints y Freebies; tocar una categoría pone las demás en gris, tocarla otra vez restablece todas.

## Interacciones

Las galerías reciclan una cantidad acotada de elementos para permitir desplazamiento infinito en ambos ejes. Trackpad: desplazar con dos dedos y pellizcar para cambiar escala. Mouse: rueda y arrastre; Ctrl + rueda cambia escala. Móvil: arrastre y pellizco con dos dedos. La zona central aumenta progresivamente los elementos y los bordes se funden con el fondo mediante una máscara ovalada. No hay controles numéricos de zoom.

Click o Enter sobre un elemento abre el carrusel. Flechas o teclado recorren el catálogo; `back to grid` vuelve a la misma posición. Escape cierra el carrusel o Index. La grilla se cierra con su propio control o Escape. `back to general` devuelve a la ficha Featured conservando su lugar en la página.

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


## Crear JSON con imágenes de ImgBB

1. Abrir `json-creator.html` desde el servidor local y elegir el proyecto o Shop.
2. Subir las imágenes a ImgBB y copiar el **enlace directo**, como `https://i.ibb.co/…/foto.jpg`. El enlace `https://ibb.co/…` abre una página y se rechaza como imagen. La [documentación de ImgBB](https://api.imgbb.com/) distingue `url` de `url_viewer`.
3. Pegar una imagen por línea. Se acepta solo la URL, o `Título | URL de imagen | URL de miniatura opcional`.
4. Revisar la previsualización y descargar el JSON. Reemplazar el archivo indicado en pantalla. Para agregar descripciones, precios o diferentes categorías, importar el resultado en `editor.html`.

El generador crea una galería nueva: **reemplaza la lista anterior** si se publica sobre el mismo archivo. Para conservar IDs (y las wishlist), precios y demás información, editar/importar el JSON existente con `editor.html` y cambiar sus campos `src` y `thumbnail`.

No se necesita API key para usar enlaces públicos. El generador no sube archivos ni publica cambios. Los archivos actuales conservan sus rutas locales hasta contar con las URLs reales; no hay enlaces ficticios a ImgBB. Tanto la grilla como el visor y el editor aceptan URLs directas. La grilla usa `thumbnail` cuando existe y vuelve a `src` si la miniatura falla; el visor abre `src`.

Alojar una imagen en ImgBB no garantiza que cargue más rápido: también importan su peso y dimensiones. El Home ya no carga un carrusel. `data/landing.json` y las copias en `assets/hero/` quedan conservados como material previo.

## Verificación

Ejecutar `node --test tests/catalog.test.mjs` para validar URLs, datos y compatibilidad de todos los catálogos activos. Ver `REVIEW.md` para los resultados y pendientes de la revisión general.


## Landing tipográfico

El Home usa Druk Text Super Trial (peso 900), fondo negro y el texto de la referencia. Inter está disponible localmente para la interfaz. Las letras mantienen sus proporciones naturales, sin escalado horizontal; el tamaño de fuente se ajusta de forma uniforme al espacio disponible. Los cortes se conservan en escritorio; en móvil el texto se adapta al ancho disponible. Las cajas usan `mix-blend-mode: difference` por encima de las letras, con bases `#9B0000`, `#7B6C2C` y `#005AD0`. Sin gradientes ni tramas adicionales.



### Shop pendiente de JSONBin

El catálogo activo `data/shop.json` quedó con `items: []`: no carga productos, imágenes ni descargas. Shop conserva su acceso, navegación y estado vacío. La conexión con JSONBin se implementará cuando se defina el bin; el antiguo catálogo del Home `data/landing.json` ya no se solicita desde la portada. En esta revisión la carpeta `assets/` ya estaba ausente: los trabajos y fuentes locales deben reponerse o cambiarse por URLs válidas.


### Entrada con ocho solapas

About, Posters, los cinco Featured y el footer se anticipan al pie del Home como ocho solapas inclinadas. `js/panel-fan.js` obtiene sus colores y etiquetas de las secciones existentes, y las endereza durante el primer tramo del desplazamiento. El efecto revierte al regresar arriba. Las secciones mantienen su contenido y el scroll nativo con superposición anterior; la vista previa no duplica controles para lectores de pantalla. Con movimiento reducido se omite la rotación.

El carrusel del Home fue retirado. El admin y la conexión con JSONBin quedan pendientes.


## Posters

`posters.html` es una página independiente enlazada desde la nueva solapa entre About y Apolo, y desde el menú principal. La entrada del Home ahora anticipa ocho solapas; las cinco fichas Featured conservan su numeración.

- Grilla responsive: seis columnas en escritorio, cuatro en tablet y dos en móvil.
- Search: búsqueda por título, etiquetas, colección, técnicas y fecha. Las etiquetas seleccionadas se combinan; `Show all` limpia los filtros.
- Collections: cuatro colecciones de la referencia, con portada y año. Seleccionar una muestra su grilla filtrada.
- Detalle: obra, técnicas, autor, fecha, crédito cuando está disponible, descarga y flechas. Flechas de teclado recorren la selección activa; Escape o `back to grid` regresan a la grilla conservando filtros y posición.
- El estado se guarda en el fragmento de URL, por ejemplo `posters.html#view=detail&id=days-at-cuba`, y funciona con los botones atrás/adelante del navegador.

### Editar el archivo `data/posters.json`

Este catálogo es independiente de Shop. Contiene `collections`, `tags` e `items`. Cada poster usa `id`, `title`, `src`, `thumbnail`, `download`, `collection`, `tags` y `tools`. Campos opcionales: `date` (ISO), `dateLabel`, `credit` (`src`, `title`, `description`) e `imageScale` (encuadre visual entre 1 y 2 para exports con margen; la descarga conserva el archivo). Las imágenes admiten rutas locales o URLs directas. `download` vacío desactiva la descarga; los créditos se ocultan cuando no están configurados.

Se incorporaron 17 obras locales en `assets/posters/`, con imágenes de hasta 1800 px y miniaturas de hasta 500 px. Los originales fuera del proyecto no se modificaron. La ficha de **This Is The End** reproduce los metadatos de la referencia pero queda pendiente de su archivo individual: completar `src`, `thumbnail`, `download`, la portada de `polaroid` y, opcionalmente, `credit.src`. Las técnicas y fechas que no se suministraron quedan vacías.

La interacción y validación están en `js/posters.js`; el diseño, en `style/posters.css`. No requiere JSONBin ni admin para funcionar.

### Transición y Contact
About es la hoja del fondo: su contenido real sube desde detrás de las otras solapas, que se enderezan y salen hacia abajo con progresión escalonada. El movimiento se revierte con el scroll y respeta movimiento reducido. Contact ocupa la altura de la ventana; únicamente el interior de la carpeta desplaza su contenido cuando hace falta.
