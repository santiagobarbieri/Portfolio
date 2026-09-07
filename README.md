# Portfolio

La colección se carga desde `data/items.json`. No requiere compilación.

## Ver el sitio

Para cargar automáticamente el JSON, iniciar un servidor local desde esta carpeta:

```sh
python3 -m http.server 8000
```

Abrir `http://localhost:8000`. Al abrir `index.html` directamente con doble clic, seleccionar `data/items.json` en el selector que aparece: el navegador no permite leerlo automáticamente mediante `fetch` desde `file://`.

## Crear o editar la colección

Abrir `editor.html` (o `http://localhost:8000/editor.html`). El editor permite crear, editar, eliminar e importar elementos y descargar `items.json`. Con servidor carga la colección actual automáticamente; con doble clic, importarla desde el botón correspondiente.

1. Completar un elemento y pulsar **Guardar elemento**.
2. Repetir con las otras piezas.
3. Pulsar **Descargar .json**.
4. Reemplazar `data/items.json` con el archivo descargado.

El editor no sobrescribe archivos del disco. Las imágenes, ZIP y PSD no se incluyen en el JSON: deben estar en las rutas indicadas, relativas a `index.html` (por ejemplo `assets/previews/Fallen Print.png`). También se admiten URLs HTTP/HTTPS.

## Formato

El archivo es una lista JSON. Cada elemento admite:

- `id`: texto único obligatorio.
- `type`: `posters`, `fonts`, `logos`, `prints`, `mockups` o `tee`.
- `title` y `src`: título y ruta de imagen obligatorios.
- `alt`: descripción accesible.
- `color`: color hexadecimal del fondo.
- `createdAt`: fecha confirmada `YYYY-MM-DD` o `null` (muestra «Sin informar»).
- `download`: ruta opcional al archivo descargable.
- `kind`: `product` para productos Shop. Las Tee siempre son productos y muestran «shop in work» sin descarga.

## Archivos

- `index.html`: portfolio.
- `editor.html`, `style/editor.css`, `js/editor.js`: editor de JSON.
- `data/items.json`: colección; única fuente de datos.
- `js/catalog.js`: carga, importación y validación compartida.
- `js/main.js`, `style/main.css`: grilla, menús y filtros.
- `js/viewer.js`: ampliación, detalles y descargas.
- `assets/`: originales, vistas previas e íconos (licencia en `assets/icons/LICENSE`).

La grilla permite 2–5 columnas en computadora y 2–3 en teléfono. Los filtros mantienen las piezas visibles en escala de grises. Los menús y detalles admiten teclado y Escape. El scroll usa el comportamiento nativo del navegador.

## Navegación y presentación

Home, Grilla y Featured se presentan como capas negras superpuestas con tipografía sans serif. Cada capa tiene scroll independiente; la Grilla se abre sobre Home y Featured sobre la Grilla. Solo las flechas de la Grilla permiten salir a otra sección, conservando la posición de scroll al regresar.

El control de tamaño ofrece 4, 6, 8 y 10 columnas en todas las pantallas. El botón activo aparece gris. El filtrado por categoría se retiró; la búsqueda queda para una próxima etapa. Featured tiene su propia colección en `data/featured.json`, independiente de la grilla.

## Proyectos Featured

`data/featured.json` contiene exactamente cinco proyectos independientes de `data/items.json`. Los placeholders Proyecto 01–05 se reemplazan con los datos reales. Campos:

- `id`: identificador único.
- `title`, `description`: título y texto del proyecto.
- `backgroundColor`, `textColor`: colores hexadecimales propios de cada proyecto.
- `src`: imagen opcional; `null` muestra únicamente el texto.
- `alt`: descripción accesible de la imagen.

`js/featured.js` carga y valida esta colección por separado. No depende de que la grilla termine de cargar y sus proyectos no abren el visor de elementos de la grilla. Con doble clic en el HTML, Featured ofrece su propio selector de JSON. El editor actual sigue editando únicamente `data/items.json`.
