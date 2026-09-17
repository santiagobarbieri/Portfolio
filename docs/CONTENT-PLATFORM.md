# Catálogo y administración: propuesta de implementación

## Estado real

- La web pública es estática y lee `data/posters.json` y `data/shop.json`.
- `editor.html` y `json-creator.html` generan JSON localmente. No tienen permisos para publicar contenido.
- No hay todavía base de datos, autenticación de administradores, cobros ni entrega privada de productos.
- `vercel.json` incorpora cabeceras de seguridad. Solo se aplicarán al desplegar; el servidor Python local no las aplica.
- No se creó ningún servicio externo ni se migraron datos en esta etapa.

## Arquitectura recomendada (pendiente de elección)

Vercel sirve el portfolio. Supabase ofrece PostgreSQL, autenticación y almacenamiento de imágenes. El administrador carga contenido y la web consulta únicamente lo publicado. No hace falta subir cambios de código para publicar cada poster.

No usar JSONBin como base de una tienda: el catálogo, las identidades de administradores y los archivos privados necesitan permisos independientes. Una URL de imagen es pública; no debe usarse como control de acceso para productos pagos.

## Modelo de datos

| Tabla | Campos principales | Acceso público |
| --- | --- | --- |
| collections | id, slug, title, year, cover, sort_order, published | Solo publicadas |
| posters | id, slug, title, collection_id, image_path, thumbnail_path, tags, tools, date, credits, image_scale, download_enabled, published | Solo publicados |
| products | id, slug, title, type, description, price_minor, currency, preview_path, thumbnail_path, checkout_url, sold_out, published | Solo publicados; sin archivo privado |
| admin_users | user_id | Ninguno; alta manual desde una cuenta de confianza |
| private_product_files | product_id, storage_path | Ninguno |
| audit_events | actor_id, action, entity, entity_id, timestamp | Solo administración |

Usar claves únicas, referencias entre tablas, importes enteros en unidades menores y validación de tipos/categorías en base de datos. Mantener fechas originales y créditos de los posters. Los borradores quedan fuera de las consultas públicas. No mezclar metadatos de pago o rutas privadas con la tabla pública de productos.

Si se elige vender dentro de la web, sumar pedidos, eventos del proveedor y permisos de descarga, con claves únicas para que un evento repetido no duplique una entrega.

## Flujo de carga

1. Iniciar sesión en `admin.html`, con cuenta autorizada y segundo factor.
2. Arrastrar imágenes individuales o varias a la vez.
3. Validar tamaño, extensión, tipo real y dimensiones; aceptar JPEG, PNG y WebP como imágenes de catálogo. Rechazar SVG/HTML y nombres de archivo que controlen rutas.
4. Guardar originales con nombres generados; crear una miniatura optimizada. Limitar tamaño y cantidad por lote.
5. Completar colección, título, créditos, etiquetas o datos de producto; guardar como borrador.
6. Revisar una vista previa y publicar. Actualizar/invalidatear la caché del catálogo sin desplegar la web.
7. Mostrar los errores por archivo y permitir reintentos sin duplicar registros. Si una carga queda incompleta, limpiar archivos huérfanos.

El primer importador debe leer los JSON existentes sin alterar IDs, colecciones, orden, créditos ni `imageScale`. Debe poder ejecutarse nuevamente sin duplicar contenido y conservar una copia de los JSON originales.

## Permisos y protección

- Activar Row Level Security (RLS): visitantes leen solo publicados. Usuarios comunes no escriben. Solo usuarios incluidos en `admin_users` administran contenido.
- Aplicar reglas de almacenamiento separadas: vistas previas públicas, archivos pagos privados. Una política de tabla no protege por sí sola un bucket público.
- Nunca incluir claves secretas, `service_role` o contraseñas en HTML, JavaScript, JSON público o Git. La clave publicable del cliente depende de políticas RLS correctas; no es una clave de administración.
- Autorizar cada operación en servidor/base de datos. Ocultar el enlace a `admin.html` no constituye protección.
- Para un administrador con cookies: sesión HttpOnly/Secure/SameSite, protección CSRF, comprobación de origen y expiración. Evitar tokens de larga duración en localStorage.
- Validar entradas y URLs; renderizar texto con `textContent`. Consultas parametrizadas y límites de longitud/tamaño/paginación.
- Limitar intentos de acceso, escrituras y subidas; configurar límites de gasto y alertas del proveedor. Los límites en JavaScript del navegador son solo ayuda de interfaz, no protección.
- Pagos: checkout del proveedor, firma del webhook y confirmación del servidor. No entregar archivos por confiar en un parámetro de URL o en el estado del navegador.
- Backups y prueba de restauración antes de reemplazar la fuente de datos pública. Activar registros sin contraseñas, tokens ni datos de pago.

## Cabeceras preparadas

`vercel.json` restringe scripts y fuentes al propio sitio, bloquea incrustación en iframes y contenido ejecutable de plugins, evita inferencia de tipos y restringe permisos del navegador. Permite imágenes HTTPS para conservar enlaces externos y FormSubmit para Contact.

`style-src 'unsafe-inline'` se conserva porque el portfolio usa variables CSS y estilos dinámicos. No se permite `unsafe-inline` en scripts. Al conectar Supabase, añadir **el dominio concreto del proyecto** a `connect-src`, sin abrirlo a cualquier destino. Los scripts del administrador deben servirse localmente o añadirse con una política explícita.

`.vercelignore` excluye archivos de desarrollo, documentación y variables de entorno del despliegue. Las páginas del editor tienen `noindex`, que evita indexación pero **no restringe acceso**: actualmente no poseen capacidad de escritura remota.

Esto es una primera capa de protección, no una garantía de invulnerabilidad. Contact todavía usa FormSubmit: su protección contra spam depende también del proveedor; falta decidir si migrar a un endpoint propio con límites y verificación antiabuso.

## Criterios antes de producción

- Un visitante no puede leer borradores, escribir registros ni subir archivos, incluso llamando a la API directamente.
- Un usuario autenticado que no sea administrador tampoco puede hacerlo.
- Un administrador puede cargar, editar, publicar y despublicar; una sesión vencida deja de escribir.
- Archivos inválidos, demasiado grandes y rutas manipuladas se rechazan en servidor/Storage.
- No se exponen archivos pagos ni secretos en respuestas del catálogo.
- Subidas fallidas y eventos repetidos no generan duplicados.
- Poster grid, filtros, colecciones y Shop conservan su apariencia con los datos remotos.
- Revisar cabeceras sobre el despliegue real y probar la restauración de una copia de seguridad.

## Datos que hacen falta para conectar

Elegir plataforma y alcance comercial. Si se usa Supabase: crear el proyecto, definir el usuario administrador y configurar los secretos en Vercel, nunca pegarlos en el chat. La URL del proyecto y la clave publicable pueden configurarse en el cliente; las claves privilegiadas quedan exclusivamente en el servidor.

## Documentación oficial

- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/storage/security/access-control
- https://supabase.com/docs/guides/getting-started/api-keys
- https://vercel.com/docs/project-configuration/vercel-json
