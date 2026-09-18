# Catálogos con JSONBin y Vercel

## Decisión actual

Supabase y el administrador propio quedan descartados por ahora. Posters y Shop leen JSONBin mediante `/api/content`, una función de Vercel de **solo lectura**. Shop es únicamente catálogo: no tiene checkout ni entrega de productos.

El patrón del sitio se toma de `assets/Pattern.png`, integrado en Index y Contact.

## Configurar una vez

1. Crear en JSONBin un **bin privado para Posters** y pegar el contenido completo de `data/posters.json`.
2. Crear otro **bin privado para Shop** y pegar `data/shop.json`. Puede seguir vacío hasta cargar productos.
3. En JSONBin, crear una **Access Key limitada a Bins Read**, sin permisos de crear, actualizar o borrar. No utilizar la Master Key para este sitio.
4. En Vercel → proyecto → Settings → Environment Variables, cargar:

   | Variable | Valor |
   | --- | --- |
   | `JSONBIN_ACCESS_KEY` | Access Key de solo lectura |
   | `JSONBIN_POSTERS_BIN_ID` | ID del bin de Posters, no la URL |
   | `JSONBIN_SHOP_BIN_ID` | ID del bin de Shop, no la URL |

5. Aplicarlas a los entornos deseados y hacer un nuevo despliegue. La configuración de variables necesita despliegue; las futuras ediciones del JSON no.
6. Comprobar `/api/content?kind=posters` y `/api/content?kind=shop`: deben devolver el catálogo, nunca la clave.

No pegar claves en el chat, los HTML, los archivos JSON ni JavaScript del navegador. `.env.example` es solo una plantilla sin valores reales.

## Actualizar contenido

Editar el bin correspondiente desde JSONBin y guardar. La web consulta `/latest`; la caché de Vercel dura hasta 60 segundos. Un refresco durante ese minuto puede seguir mostrando la versión anterior.

**JSONBin almacena datos, no sube las fotos.** Las fotos se alojan aparte (por ejemplo ImgBB) y se pegan como URL directa `https://i.ibb.co/...`. También siguen siendo válidas las rutas `assets/...` de archivos ya publicados. El cambio automatiza la actualización del catálogo, no la subida de imágenes a un proveedor.

No poner secretos, pedidos, datos de clientes ni archivos privados en estos bins: todo el catálogo es público a través de la web aunque el bin sea privado.

### Poster

Agregar a `items` en el bin de Posters, sin borrar `collections` ni `tags`:

```json
{
  "id": "nuevo-poster",
  "title": "Nuevo poster",
  "src": "https://i.ibb.co/REEMPLAZAR/poster.jpg",
  "thumbnail": "https://i.ibb.co/REEMPLAZAR/poster-thumb.jpg",
  "collection": "horses",
  "tags": ["typographic"],
  "tools": ["Photoshop"],
  "date": "2026-09-18",
  "imageScale": 1
}
```

Las URLs anteriores son ejemplos; reemplazarlas por enlaces reales. `collection` debe coincidir con un ID existente en `collections`, o quedar vacío. Los IDs son únicos y usan letras minúsculas, números y guiones. `imageScale` (1 a 2) ajusta únicamente el recorte de la miniatura. Se mantienen créditos y descargas públicas de posters si ya existen.

### Producto

Agregar a `items` en el bin de Shop:

```json
{
  "id": "poster-print-01",
  "title": "Poster Print 01",
  "type": "prints",
  "src": "https://i.ibb.co/REEMPLAZAR/print.jpg",
  "thumbnail": "https://i.ibb.co/REEMPLAZAR/print-thumb.jpg",
  "description": "Impresión de la colección.",
  "price": 15000,
  "currency": "ARS",
  "year": "2026",
  "soldOut": false
}
```

Categorías admitidas: `mockups`, `fonts`, `prints`, `freebies`. `price` puede ser `null` para no mostrar precio. No agregar links de pago o archivos privados: esta etapa es solo de catálogo y el servidor descarta esos campos de productos.

Los editores locales existentes siguen sirviendo para preparar JSON; no están conectados a JSONBin ni publican automáticamente.

## Errores y límites

- Sin ID configurado para un catálogo, se conserva su JSON local. Cada catálogo se puede conectar por separado.
- Si un bin ya configurado falla o contiene datos inválidos, se muestra un error con reintento; no se sustituye silenciosamente por contenido viejo.
- Se validan tipos, IDs, duplicados, colecciones, categorías, URLs y precios antes de entregar el catálogo.
- El proxy admite hasta 1 MB de respuesta y 2.000 elementos por catálogo, sujeto también al límite de tu plan de JSONBin. Conviene usar miniaturas pequeñas para reducir tráfico de imágenes.
- El caché reduce consultas; no reemplaza un límite de tráfico. Configurar alertas de consumo y revisar las reglas de firewall/rate limiting disponibles en la cuenta de Vercel antes de producción.

## Seguridad aplicada y alcance

El endpoint solo acepta GET, dos catálogos conocidos y IDs de bin configurados en servidor. No admite destinos arbitrarios, redirecciones externas, uploads, login ni escrituras. Los errores no devuelven respuestas internas del proveedor. La Access Key sale únicamente en la petición del servidor a JSONBin.

`vercel.json` agrega CSP, protección contra iframes, `nosniff`, política de referrer y restricciones de permisos. Se mantiene `style-src 'unsafe-inline'` porque el diseño usa estilos dinámicos; los scripts inline no están permitidos. FormSubmit conserva su acceso para Contact. Las cabeceras se aplican al desplegar y con `npm run dev`, no con el servidor Python antiguo.

Contact sigue dependiendo de FormSubmit y de sus medidas contra spam. Esto no es una garantía contra cualquier ataque: quedan pendientes la verificación del despliegue real, configuración de la cuenta y alertas de consumo. No se ha creado ni conectado ningún bin desde este entorno.

## Desarrollo y comprobación

- `npm test`: validación de catálogos y pruebas del endpoint con respuestas simuladas, sin claves ni tráfico real.
- `npm run dev`: sirve el sitio y su API en `http://localhost:8004`. Sin variables usa los datos locales. Para conectar localmente, copiar `.env.example` a `.env` y completar valores en tu equipo; `.env` no se publica ni se agrega a Git.
- La web no requiere dependencias de npm para funcionar.

## Referencias oficiales

- https://jsonbin.io/api-reference/bins/read
- https://jsonbin.io/api-reference/access-keys/list
- https://vercel.com/docs/project-configuration/vercel-json
