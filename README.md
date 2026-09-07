# Portfolio

Sitio estático, sin compilación. Ejecutar `python3 -m http.server 8000` y abrir `http://localhost:8000`.

## Recorrido

- Home: introducción básica.
- Featured: cinco tarjetas que se apilan con scroll nativo; cada una tiene su fondo y color de texto.
- Al final, una solapa blanca cubre la última tarjeta. Su rombo negro gira y crece con el scroll hasta cubrir la pantalla y abrir la grilla. El rombo también es un botón accesible por teclado.
- La grilla se cierra exclusivamente con su X y vuelve al final de Featured. No se abandona al llegar a un borde ni al pulsar Escape.

## Grilla infinita

Los botones 4, 6, 8 y 10 cambian el tamaño. Se puede desplazar con trackpad en ambos ejes, rueda vertical, Shift + rueda horizontal, arrastre con mouse/tacto y teclas de flecha al enfocar la colección. Las piezas se repiten y reciclan en un conjunto limitado de nodos, sin agregar elementos al DOM indefinidamente. Los márgenes proyectan una sombra sobre la grilla.

Un clic abre el detalle; arrastrar no lo abre. El detalle conserva las flechas anterior/siguiente, descarga para los archivos disponibles y «shop in work» para productos. Escape cierra el detalle y deja la grilla abierta.

## Datos

- `data/items.json`: piezas de la grilla.
- `data/featured.json`: exactamente cinco proyectos independientes. Campos: `id`, `title`, `description`, `backgroundColor`, `textColor`, `src` opcional y `alt`.
- Los archivos gráficos y descargables siguen en `assets/`; el JSON guarda rutas relativas a `index.html` o URLs HTTP/HTTPS.

Con doble clic en `index.html`, el navegador impide cargar JSON automáticamente; cada colección ofrece su selector de archivo. Con servidor local o despliegue web, ambos JSON se cargan automáticamente.

## Editor

`editor.html` permite crear, editar, eliminar e importar piezas de la grilla y descargar `items.json`. Guardar cada elemento antes de exportar y reemplazar `data/items.json` con el archivo descargado. El editor no modifica el disco directamente ni incluye los assets dentro del JSON. Featured se edita por separado en `data/featured.json`.

Campos de las piezas: `id` único, `type` (posters/fonts/logos/prints/mockups/tee), `title`, `src`, `alt`, `color`, `createdAt` (YYYY-MM-DD o null), `download` opcional, `kind: product` para Shop. Sin fecha confirmada se muestra «Sin informar».

## Archivos principales

- `js/main.js`: grilla infinita, gestos y tamaños.
- `js/panels.js`: transición por scroll y apertura/cierre de la grilla.
- `js/featured.js`: carga y renderizado de proyectos.
- `js/viewer.js`: ampliación y detalles.
- `js/catalog.js`: carga y validación compartida con el editor.
- `style/main.css`: presentación, tarjetas sticky, transición y grilla.

Las animaciones respetan movimiento reducido. Los íconos descargados conservan su licencia en `assets/icons/LICENSE`.
