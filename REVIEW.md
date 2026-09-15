# Revisión general — 15 de septiembre de 2026

## Correcciones y mejoras

- **Carga inicial:** los tres fondos de Home pasan de 33.617.011 a 2.262.630 bytes (93,3 % menos), mediante copias JPEG. Los originales siguen intactos. Los banners de proyectos se cargan de forma diferida.
- **Imágenes fallidas:** el carrusel excluye fondos que no cargaron; las galerías recuperan la imagen original si falla una miniatura. Se corrigió una excepción de JavaScript al recibir eventos tardíos de imágenes retiradas del visor.
- **Galerías:** Escape cierra también la grilla y devuelve el foco; en Shop ejecuta la transición de regreso.
- **Editor:** los controles de edición se bloquean durante la carga y ante un error; al cambiar rápidamente de galería se descartan respuestas antiguas. Descargar un borrador ya no elimina el aviso de otros borradores sin exportar. La importación detecta si cambió la galería durante la lectura.
- **URLs:** se rechazan esquemas no admitidos, rutas ambiguas con barras invertidas y páginas de visualización de ImgBB usadas como imagen. Se admiten enlaces directos y rutas locales. Los campos extra se conservan.
- **Miniaturas:** `thumbnail` es opcional en todos los JSON. La grilla lo usa para evitar cargar originales grandes; el visor usa `src`.
- **Generador:** `json-creator.html` crea archivos para las cuatro galerías y Shop a partir de URLs, con vista previa, validación y descarga. El editor existente permite ajustar cada elemento.
- **Descargas remotas:** abren en otra pestaña cuando el navegador no puede aplicar el atributo `download` por tratarse de otro dominio.

## Verificaciones

Chrome local, escritorio de 1440 px y móvil de 390 px:

- Menú y cierre con Escape; controles del Home; orden y columnas de About.
- Apertura de las cuatro galerías, visor, flechas de teclado, cierre y regreso.
- Apertura y cierre de Shop, filtros y wishlist.
- Contacto: estados de éxito y error, conservación del mensaje si falla y limpieza si se completa. Respuestas **simuladas**; no se enviaron correos.
- Generación, validación, descarga e importación de JSON; miniatura conservada; edición al alternar proyectos y Shop; aviso de borradores pendientes.
- Sin excepciones de JavaScript en este recorrido. Las respuestas 404 corresponden a los assets pendientes listados abajo.

También se verificaron: autoplay y pausa, exclusión de un fondo fallido, URLs de ImgBB con respuestas simuladas, fallback de miniaturas, carga de originales en el visor y recuperación del editor tras un error de red. Las cinco páginas no mostraron desbordamiento horizontal a 320, 390, 768 y 1440 px.

Pruebas de datos reproducibles (5 aprobadas): `node --test tests/catalog.test.mjs`.

## Contenido y servicios pendientes

| Pendiente | Estado |
| --- | --- |
| Retrato y cinco banners | Referenciados pero ausentes; muestran placeholder. |
| Galerías de proyectos | 24 imágenes ausentes, seis por proyecto. Se necesitan archivos o URLs reales. |
| Patrones de Index y Contact | Dos SVG ausentes; se ocultan al fallar. |
| Shop | Las 12 imágenes y los archivos de descarga referenciados existen. |
| Descripciones Featured | Los cinco textos siguen vacíos. |
| Redes y archivos externos | Las ocho URLs de `socialURLs` están vacías; enlaces inactivos. |
| Botones visit | Astrak y Are we there yet? no tienen URL. |
| Contacto | Falta verificar recepción real y activación de FormSubmit con el dueño. |
| Compras | Checkout no implementado; el botón comunica que no está disponible. |
| Migración a ImgBB | Soporte listo; no se subieron archivos ni inventaron URLs. Los JSON actuales mantienen rutas locales. |

El próximo diseño de Home queda pendiente de la referencia visual. El generador crea archivos nuevos; para conservar IDs, descripciones y precios hay que editar el JSON existente desde `editor.html`.
