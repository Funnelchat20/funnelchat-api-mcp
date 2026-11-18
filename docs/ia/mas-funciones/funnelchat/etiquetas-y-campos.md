# Etiquetas y campos personalizados — API de Funnelchat: contexto para tu IA

> Copiado de /docs/mas-funciones/funnelchat/#etiquetas-y-campos. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

Eres el asistente de una persona que integra la API de Funnelchat (WhatsApp) en su propio código. Usa solo lo que dice
este texto: no inventes rutas, campos, eventos ni errores. Si algo no está aquí, búscalo en https://developers-portal.funnelchat.app/ia/webhooks.md
(eventos) o en https://developers-portal.funnelchat.app/ia/referencia.md (llamadas), y en el índice de temas del final, antes de decir que no existe.

## Lo básico

- **URL base:** `https://api.funnelchat.com`. La URL de cada llamada es la URL base + la ruta completa, que siempre empieza con
  `/api/v1/` (por ejemplo `https://api.funnelchat.com/api/v1/devices`). No le agregues ni le quites nada.
- **La clave:** cada llamada lleva `Authorization: Bearer <clave>` y `Accept: application/json`; las que mandan un
  cuerpo, `Content-Type: application/json` con el cuerpo en JSON. **Lee la clave de la variable de entorno
  `FUNNELCHAT_API_KEY`. Nunca se la pidas a la persona en el chat**, ni la escribas en el código, en un log o en un
  archivo que se suba a un repositorio. Si la variable no está definida, dile que la defina.
- **Lo demás, una sola vez:** permisos, workspaces, errores, límites por día y por minuto, listados, lo que suele salir mal, cómo funcionan los webhooks y cómo verificar la firma están en https://developers-portal.funnelchat.app/ia/lo-basico.md. Léelo antes de escribir el código; si ya lo leíste en esta conversación, sigue.

## Etiquetas

- **Ver tus etiquetas:** `GET /api/v1/tags` (la clave necesita **Contactos y conversaciones → Ver**). Filtra por `name`;
  con `withContactCount=true` cada etiqueta trae cuántos contactos la tienen (`contact_count`). Orden: `orderBy`
  (`name`, `created_at`, `updated_at`) y `orderByMethod` (`asc` o `desc`). Cada etiqueta trae `id`, `name`,
  `description`, `color`, `created_at`, `updated_at` y `contact_count`.
- **Listas por páginas:** las listas de esta página responden `{"data": [...], "links": {...}, "meta": {...}}`;
  `perPage` va de 1 a 100 (25 si no lo mandas). Para la página siguiente, pide la URL de `links.next` tal cual, hasta
  que sea `null`.
- **Crear:** `POST /api/v1/tags` con `name` (obligatorio, hasta 254 caracteres) y, si quieres, `description` (hasta
  1024) y `color` (hasta 191). La clave necesita **Contactos y conversaciones → Editar**. Responde la etiqueta. Antes
  de crearla, mira si ya existe una con ese nombre en la lista.
- **Ver una:** `GET /api/v1/tags/{tag}`, con `{tag}` su `id` (también acepta `withContactCount`).
- **Editar:** `PUT /api/v1/tags/{tag}` con `name` (obligatorio) y, si quieres, `description` y `color`. Si ya existe
  otra etiqueta con ese nombre, responde `400` (por ejemplo, «Ya existe un tag con este nombre.»). La especificación no
  describe el cuerpo de la respuesta: para ver cómo quedó, `GET /api/v1/tags/{tag}`.
- **Los contactos de una etiqueta:** `GET /api/v1/tags/{tag}/contacts`, por páginas. Orden: `orderBy` (`name`,
  `last_message_time`, `follow_up_date`) y `orderByMethod`. La especificación no describe la forma de cada elemento de
  `data`: lee lo que llega antes de depender de un campo. Para filtrar contactos por varias etiquetas a la vez, usa
  `GET /api/v1/contacts` con `tag_ids[]` y `tag_mode` (ver «Contactos y conversaciones»).
- **Las etiquetas de un contacto:** `GET /api/v1/contacts/{contact}/tags`, por páginas. Cada una trae `id`, `name`,
  `description`, `color` y `assigned_at` (cuándo se la pusieron), entre otros.

## Agregar y quitar etiquetas a contactos

- **Agregar:** `POST /api/v1/contacts/add-tags` con una **lista** (el cuerpo es un arreglo JSON, no un objeto) de hasta
  200 elementos `{"contactId": "ctc_ABViuUDF93I2VL1tInstRDG", "tag": {"id": "tag_AIJEDzSFQ6oDXbab3DubTEG"}}`: cada uno agrega una etiqueta a un contacto. Para varias
  etiquetas a un mismo contacto, un elemento por etiqueta. `tag.name` no hace falta: vale el nombre guardado de la
  etiqueta. La clave necesita **Contactos y conversaciones → Enviar**.
- **Agregar puede arrancar una automatización, como en el panel:** si la lista lleva **un solo elemento** y el contacto
  todavía no tenía esa etiqueta, arranca el flujo activo que empieza con «Tag agregado» de esa etiqueta (si hay más de
  uno, el creado primero), y ese flujo puede mandarle mensajes de WhatsApp al contacto. Con dos o más elementos, o con
  `?bulk=true` en la URL, las etiquetas se agregan igual y no arranca ningún flujo. Si la persona quiere etiquetar sin
  arrancar automatizaciones, aunque sea a un solo contacto, usa `?bulk=true`; si quiere que arranquen, una llamada por
  contacto y etiqueta. Si no sabes cuál quiere, pregúntale antes de agregar una sola etiqueta a un solo contacto.
- **Quitar:** `POST /api/v1/contacts/remove-tags` con la misma lista (`{"contactId": "ctc_ABViuUDF93I2VL1tInstRDG", "tag": {"id": "tag_AIJEDzSFQ6oDXbab3DubTEG"}}`, hasta
  200). La clave necesita **Contactos y conversaciones → Editar**. No arranca ningún flujo.
- **Las dos responden `200` sin cuerpo**, también cuando un elemento no hizo nada: el contacto ya tenía la etiqueta (al
  agregar) o no la tenía (al quitar), o el contacto o la etiqueta no existe, es de otra cuenta o está fuera del
  workspace de la clave (se ignora sin error). Para confirmar cómo quedó, lee `GET /api/v1/contacts/{contact}/tags`.
- Errores de las dos: `422` si el cuerpo no es una lista de elementos con `contactId` (`ctc_…`) y `tag.id` (`tag_…`), o tiene más
  de 200; `429` si hiciste demasiadas llamadas en un minuto (espera los segundos de `Retry-After`); `403` si a la clave
  le falta la casilla.

## Enterarte cuando un contacto recibe o pierde una etiqueta

- Crea un webhook con `POST /api/v1/webhooks` y `"events": ["contact.tag_added", "contact.tag_removed"]`. La clave
  necesita **Avisos (webhooks) → Administrar** y, por estos eventos, **Contactos y conversaciones → Ver**.
- `contact.tag_added` llega uno por cada contacto y etiqueta agregados, también en una llamada con muchos; no llega si
  el contacto ya tenía la etiqueta. `contact.tag_removed`, uno por cada contacto y etiqueta quitados; no llega si no la
  tenía, ni al borrar la etiqueta, al borrar o unir contactos ni al desvincular etiquetas de un tablero.
- Los dos traen `data.contact` (`id`, `name`, `phone`), `data.tag` (`id`, `name`) y `data.source`, de dónde vino:
  `manual`, `flow`, `bulk`, `import`, `sync`, `walink` o `ai` al agregar; `manual`, `flow`, `bulk` o `ai` al quitar. La
  especificación no dice qué `source` trae una llamada de la API: no dependas de eso para distinguir las tuyas.
- En operaciones en bloque grandes, el límite de volumen de la cuenta puede descartar parte de los eventos: para
  confirmar cómo quedó un contacto, lee `GET /api/v1/contacts/{contact}/tags`.

## Campos personalizados

- **Ver tus campos:** `GET /api/v1/custom-fields` (la clave necesita **Contactos y conversaciones → Ver**). Filtra por
  `name`, `description` y `type`; con `withContactCount=true` trae `contact_count`. Orden: `orderBy` (`name`,
  `created_at`, `updated_at`) y `orderByMethod`. Cada campo trae `id`, `name`, `type`, `description` y `created_at`.
- **Los tipos (`type`):** `0` texto (cualquier texto), `1` numérico (un número con punto decimal, sin separador de
  miles, con `-` adelante si es negativo: `"1500"`, `"99.90"`), `2` fecha (`AAAA-MM-DD`, una fecha que exista:
  `"2026-11-30"`), `3` URL (la dirección completa, con `https://` o `http://`) y `4` alfanumérico (pensado para códigos
  como `"AB1234"`; acepta cualquier texto). El tipo se elige al crear el campo y no se cambia. `GET /api/v1/custom-fields`
  filtra por `type`.
- **Crear:** `POST /api/v1/custom-fields` con `name` (obligatorio, hasta 254 caracteres), `type` (obligatorio, de `0`
  a `4`) y, si quieres, `description` (hasta 1000). La clave necesita **Contactos y conversaciones → Editar**. Elige el
  tipo según el dato: una fecha que vas a filtrar o comparar, `2`; un monto, `1`. Antes de crearlo, mira si ya existe
  uno con ese nombre.
- **Ver uno:** `GET /api/v1/custom-fields/{customField}`, con `{customField}` su `id`.
- **Editar:** `PUT /api/v1/custom-fields/{customField}` con `name` (hasta 254) o `description` (hasta 1000). El `type`
  no se cambia. Responde el campo.
- **Los valores de un contacto:** `GET /api/v1/contacts/{contact}/custom-fields`, por páginas; filtra por `name`. Cada
  uno trae `id` (el del campo), `name`, `type` y `value`. `GET /api/v1/contacts/{contact}` también trae los valores en
  `custom_fields`.

## Poner y quitar un valor

- **Poner:** `POST /api/v1/contacts/attach-custom-field` con una **lista** (el cuerpo es un arreglo JSON, no un objeto)
  de `{"customFieldId": "fld_AGxYus0ZuS8ViUElnapfBA0", "contactId": "ctc_ABViuUDF93I2VL1tInstRDG", "value": "2026-11-30"}`; los tres son obligatorios. Si el contacto ya
  tenía un valor en ese campo, se reemplaza. La clave necesita **Contactos y conversaciones → Editar**. Sirve para
  varios contactos y campos en una sola llamada. Para ponerlos al crear un contacto, `custom_fields` de crear o de
  crear o actualizar (ver «Contactos y conversaciones»).
- **`value` es siempre texto** (`"1500"`, no `1500`) y, con una clave, se valida contra el tipo del campo: uno
  numérico, de fecha o de URL solo acepta su formato (los de arriba). Texto y alfanumérico aceptan cualquier texto. Un
  valor que no puso una clave (el panel, un flujo, una importación) puede tener otro formato: no asumas el formato al
  leerlo.
- **La respuesta es `200` aunque un elemento falle:** trae una lista con un resultado por elemento, en el mismo orden,
  cada uno con `status` y `message`; uno rechazado no frena a los demás. `status` `201` es que quedó; `403`, que el
  campo o el contacto no es de la cuenta o está fuera del workspace de la clave; `422`, que `value` no cumple el
  formato del tipo del campo (`message` dice cuál espera). Revisa cada uno y dile a la persona cuáles no quedaron; no
  los reintentes iguales: corrige el valor.
- **Quitar:** `POST /api/v1/contacts/detach-custom-field` con una lista de `{"customFieldId": "fld_Ar7McDNiFfizqFzTybtrwHL", "contactId": "ctc_ABViuUDF93I2VL1tInstRDG"}`
  (los dos obligatorios). Responde `{"messages": [...]}`, una lista de textos con lo que hizo.
- Errores de las dos: `422` si el cuerpo no es válido (el detalle dice qué elemento); `403` si a la clave le falta la
  casilla.

## Borrar etiquetas y campos personalizados

- **Hazlo solo si la persona lo pide de forma explícita para eso; confírmale qué vas a borrar (nombre e id de cada
  etiqueta o campo) antes de llamar.** La especificación no dice si se puede deshacer ni qué pasa con los contactos que
  la tenían o tenían un valor en ese campo. Para decirle a cuántos afecta, pide `withContactCount=true` en
  `GET /api/v1/tags` o `GET /api/v1/custom-fields` (trae `contact_count`).
- **Etiquetas:** `POST /api/v1/tags/delete` con `{"tagIds": ["tag_AIJEDzSFQ6oDXbab3DubTEG"]}` (al menos una), con los `id` de
  `GET /api/v1/tags`.
- **Campos:** `POST /api/v1/custom-fields/delete` con `{"customFieldIds": ["fld_Ar7McDNiFfizqFzTybtrwHL"]}` (al menos uno), con los `id` de
  `GET /api/v1/custom-fields`.
- Las dos responden `200` sin un cuerpo descrito: para confirmar, vuelve a listar. `422` si el cuerpo no es válido.
- No llegan eventos por los contactos afectados: borrar una etiqueta no manda `contact.tag_removed`, y borrar un campo
  no manda `contact.updated`.

## Llamadas

### Ver tus etiquetas

`GET /api/v1/tags` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `tag.index`

**Para qué sirve:** Sirve para listar las etiquetas de la cuenta, opcionalmente con cuántos contactos tiene cada una, y obtener sus IDs para filtrar o segmentar.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `name` | query | string | no |  |
| `withContactCount` | query | boolean | no |  |
| `perPage` | query | integer | no |  |
| `orderBy` | query | string ∈ {"name", "created_at", "updated_at"} | no |  |
| `orderByMethod` | query | string ∈ {"asc", "desc"} | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<TagResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `tag_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].name` | string |  |
  | `data[].description` | string |  |
  | `data[].color` | string \| null |  |
  | `data[].is_system` | boolean |  |
  | `data[].created_at` | string \| null |  |
  | `data[].updated_at` | string \| null |  |
  | `data[].contact_count` | string \| integer |  |
  | `links` | object |  |
  | `links.first` | string \| null |  |
  | `links.last` | string \| null |  |
  | `links.prev` | string \| null |  |
  | `links.next` | string \| null |  |
  | `meta` | object |  |
  | `meta.current_page` | integer |  |
  | `meta.from` | integer \| null |  |
  | `meta.last_page` | integer |  |
  | `meta.links` | array<object> |  |
  | `meta.path` | string |  |
  | `meta.per_page` | integer |  |
  | `meta.to` | integer \| null |  |
  | `meta.total` | integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Crear una etiqueta

`POST /api/v1/tags` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `tag.store`

**Para qué sirve:** Úsalo para crear una etiqueta (nombre, descripción, color) y segmentar contactos según los criterios de tu negocio.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `name` | string | sí |  |
| `description` | string \| null | no |  |
| `color` | string \| null | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string | Id opaco: un texto que empieza con `tag_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `name` | string |  |
  | `description` | string |  |
  | `color` | string \| null |  |
  | `is_system` | boolean |  |
  | `created_at` | string \| null |  |
  | `updated_at` | string \| null |  |
  | `contact_count` | string \| integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver una etiqueta

`GET /api/v1/tags/{tag}` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `tag.show`

**Para qué sirve:** Sirve para ver una etiqueta y, si lo pides, cuántos contactos la tienen.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `tag` | path | string | sí |  |
| `withContactCount` | query | boolean | no |  |

**Respuestas**

- `200` — OK

  La misma tabla que en «Crear una etiqueta», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Editar una etiqueta

`PUT /api/v1/tags/{tag}` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `tag.update`

**Para qué sirve:** Úsalo para renombrar una etiqueta o cambiar su descripción o su color.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `tag` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

La misma tabla que en «Crear una etiqueta», más arriba en este texto.

**Respuestas**

- `200` — OK
- `400` — Bad Request
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver los contactos de una etiqueta

`GET /api/v1/tags/{tag}/contacts` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `tag.contacts`

**Para qué sirve:** Sirve para obtener todos los contactos que tienen una etiqueta, por ejemplo para exportar un segmento o sincronizarlo con otra herramienta.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `tag` | path | string | sí |  |
| `perPage` | query | integer | no |  |
| `orderBy` | query | string ∈ {"name", "last_message_time", "follow_up_date"} | no |  |
| `orderByMethod` | query | string ∈ {"asc", "desc"} | no |  |
| `sortBy` | query | string ∈ {"asc", "desc"} | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<string> |  |
  | `links` | object |  |
  | `links.first` | string \| null |  |
  | `links.last` | string \| null |  |
  | `links.prev` | string \| null |  |
  | `links.next` | string \| null |  |
  | `meta` | object |  |
  | `meta.current_page` | integer |  |
  | `meta.from` | integer \| null |  |
  | `meta.last_page` | integer |  |
  | `meta.links` | array<object> |  |
  | `meta.path` | string |  |
  | `meta.per_page` | integer |  |
  | `meta.to` | integer \| null |  |
  | `meta.total` | integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver las etiquetas de un contacto

`GET /api/v1/contacts/{contact}/tags` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `contact.tags`

**Para qué sirve:** Úsalo para saber qué etiquetas tiene un contacto, por ejemplo para reflejar su segmento en tu CRM o decidir qué acción tomar.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `contact` | path | string | sí |  |
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<ContactTagResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `tag_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].name` | string |  |
  | `data[].description` | string \| string ∈ {""} |  |
  | `data[].color` | string |  |
  | `data[].is_system` | boolean |  |
  | `data[].created_at` | string \| null |  |
  | `data[].updated_at` | string \| null |  |
  | `data[].contact_count` | string |  |
  | `data[].assigned_at` | string \| null |  |
  | `data[].last_updated` | string \| null |  |
  | `links` | object |  |
  | `links.first` | string \| null |  |
  | `links.last` | string \| null |  |
  | `links.prev` | string \| null |  |
  | `links.next` | string \| null |  |
  | `meta` | object |  |
  | `meta.current_page` | integer |  |
  | `meta.from` | integer \| null |  |
  | `meta.last_page` | integer |  |
  | `meta.links` | array<object> |  |
  | `meta.path` | string |  |
  | `meta.per_page` | integer |  |
  | `meta.to` | integer \| null |  |
  | `meta.total` | integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)

### Agregar etiquetas a contactos

`POST /api/v1/contacts/add-tags` · permiso **Contactos y conversaciones → Enviar** · área conversations · `operationId` `contact.addTags`

**Para qué sirve:** Úsalo para etiquetar a uno o varios contactos desde tu sistema, hasta 200 por llamada. Una sola etiqueta a un solo contacto arranca, como en el panel, la automatización «Tag agregado» de esa etiqueta; varias en la misma llamada, ninguna.

Agrega etiquetas a contactos. El cuerpo es un arreglo JSON de hasta 200 ítems; cada ítem agrega una etiqueta (`tag.id`) a un contacto (`contactId`). Para poner varias etiquetas a un mismo contacto, un ítem por etiqueta. `tag.name` es opcional y no se usa: vale el nombre guardado de la etiqueta.

- **Dispara flujos, igual que en el panel:** si la llamada lleva **un solo ítem**, sin `bulk=true` en la query, y el contacto todavía no tenía la etiqueta, se arranca el flujo activo con el disparador «Tag agregado» de esa etiqueta (si hay más de uno, el creado primero), con las mismas reglas que el flujo tenga configuradas. Ese flujo puede enviar mensajes de WhatsApp al contacto: por eso esta llamada pide el permiso «Enviar», aunque por sí misma no envía nada.
- **Sin flujos:** con dos o más ítems, o con `?bulk=true`, las etiquetas se agregan igual y no se arranca ningún flujo.
- **Webhooks:** cada etiqueta que el contacto no tenía emite `contact.tag_added`, con uno o con varios ítems. Si el contacto ya tenía la etiqueta, ese ítem no hace nada.
- **Tu cuenta y tu workspace:** un ítem cuyo contacto o etiqueta no existe, es de otra cuenta o está fuera del workspace de tu clave se ignora sin error. Para confirmar el resultado, `GET /contacts/{contact}/tags`.
- **Etiqueta del sistema «No contactar»:** marca a un contacto que pidió no recibir mensajes. Solo se pone o se quita desde el chat, con la acción «No contactar» del contacto, que deja una nota de constancia; por esta llamada no se pone ni se quita (ver el 422). La reconoces por `is_system: true` en `GET /tags` y en `GET /contacts/{contact}/tags`, y `GET /contacts/{contact}` trae `opted_out: true` cuando el contacto la tiene.
- **Respuesta:** 200 sin cuerpo.

| HTTP | Cuándo |
|---|---|
| 422 | El cuerpo no es un arreglo de ítems con `contactId` y `tag.id`, o tiene más de 200 ítems. |
| 422 | Algún ítem nombra la etiqueta del sistema «No contactar»: el error viene en `errors.tag` y no se aplica ningún ítem de la llamada. |
| 429 | Demasiadas solicitudes por minuto (ver `Retry-After`). |

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `bulk` | query | boolean | no |  |

**Cuerpo** (`application/json`, obligatorio)

Esquema: array<object>.

**Respuestas**

- `200` — OK
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content

### Quitar etiquetas a contactos

`POST /api/v1/contacts/remove-tags` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `contact.removeTags`

**Para qué sirve:** Sirve para quitarles etiquetas a uno o varios contactos, hasta 200 por llamada, por ejemplo cuando un dato cambió en tu sistema. No arranca ninguna automatización.

Quita etiquetas de contactos. El cuerpo es un arreglo JSON de hasta 200 ítems; cada ítem quita una etiqueta (`tag.id`) de un contacto (`contactId`). `tag.name` es opcional y no se usa.

- **Webhooks:** cada etiqueta que el contacto tenía emite `contact.tag_removed`. Si el contacto no la tenía, ese ítem no hace nada.
- **Flujos:** quitar una etiqueta no arranca ningún flujo.
- **Tu cuenta y tu workspace:** un ítem cuyo contacto o etiqueta no existe, es de otra cuenta o está fuera del workspace de tu clave se ignora sin error. Para confirmar el resultado, `GET /contacts/{contact}/tags`.
- **Etiqueta del sistema «No contactar»:** marca a un contacto que pidió no recibir mensajes. Solo se pone o se quita desde el chat, con la acción «No contactar» del contacto, que deja una nota de constancia; por esta llamada no se pone ni se quita (ver el 422). La reconoces por `is_system: true` en `GET /tags` y en `GET /contacts/{contact}/tags`, y `GET /contacts/{contact}` trae `opted_out: true` cuando el contacto la tiene.
- **Respuesta:** 200 sin cuerpo.

| HTTP | Cuándo |
|---|---|
| 422 | El cuerpo no es un arreglo de ítems con `contactId` y `tag.id`, o tiene más de 200 ítems. |
| 422 | Algún ítem nombra la etiqueta del sistema «No contactar»: el error viene en `errors.tag` y no se aplica ningún ítem de la llamada. |
| 429 | Demasiadas solicitudes por minuto (ver `Retry-After`). |

**Cuerpo** (`application/json`, obligatorio)

Esquema: array<object>.

**Respuestas**

- `200` — OK
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content

### Borrar etiquetas

`POST /api/v1/tags/delete` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `tag.destroy`

**Para qué sirve:** Úsalo para eliminar varias etiquetas de una vez.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `tagIds` | array<string> | sí |  |

**Respuestas**

- `200` — OK
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver tus campos

`GET /api/v1/custom-fields` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `customField.index`

**Para qué sirve:** Úsalo para conocer los campos personalizados de la cuenta y sus IDs antes de leer o escribir esos datos en tus contactos.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `name` | query | string | no |  |
| `description` | query | string | no |  |
| `type` | query | integer ∈ {0, 1, 2, 3, 4} | no |  |
| `withContactCount` | query | boolean | no |  |
| `perPage` | query | integer | no |  |
| `orderBy` | query | string ∈ {"name", "created_at", "updated_at"} | no |  |
| `orderByMethod` | query | string ∈ {"asc", "desc"} | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<CustomFieldResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `fld_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].name` | string |  |
  | `data[].type` | integer ∈ {0, 1, 2, 3, 4} | Tipo del campo. Se elige al crearlo y no se puede cambiar después. Indica cómo escribir su valor: (columnas: `type`, Tipo, Cómo escribir `value`, Ejemplo) 0, Texto, Cualquier texto., `"Cliente mayorista"`; 1, Numérico, Un número, con punto decimal y sin separador de miles; puede llevar `-` adelante., `"1500"`, `"99.90"`; 2, Fecha, `AAAA-MM-DD`, una fecha que exista., `"2026-11-30"`; 3, URL, La dirección completa, con `https://` o `http://`., `"https://ejemplo.com/pedido/123"`; 4, Alfanumérico, Pensado para códigos con letras y números; acepta cualquier texto., `"AB1234"`. |
  | `data[].description` | string \| null |  |
  | `data[].contact_count` | integer |  |
  | `data[].created_at` | string (date-time) \| null |  |
  | `links` | object |  |
  | `links.first` | string \| null |  |
  | `links.last` | string \| null |  |
  | `links.prev` | string \| null |  |
  | `links.next` | string \| null |  |
  | `meta` | object |  |
  | `meta.current_page` | integer |  |
  | `meta.from` | integer \| null |  |
  | `meta.last_page` | integer |  |
  | `meta.links` | array<object> |  |
  | `meta.path` | string |  |
  | `meta.per_page` | integer |  |
  | `meta.to` | integer \| null |  |
  | `meta.total` | integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Crear un campo

`POST /api/v1/custom-fields` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `customField.store`

**Para qué sirve:** Sirve para crear un campo personalizado nuevo (por ejemplo «plan» o «fecha de compra») y guardar en Funnelchat datos propios de tu negocio.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `name` | string | sí |  |
| `description` | string \| null | no |  |
| `type` | integer ∈ {0, 1, 2, 3, 4} | sí | Tipo del campo. Se elige al crearlo y no se puede cambiar después. Indica cómo escribir su valor: (columnas: `type`, Tipo, Cómo escribir `value`, Ejemplo) 0, Texto, Cualquier texto., `"Cliente mayorista"`; 1, Numérico, Un número, con punto decimal y sin separador de miles; puede llevar `-` adelante., `"1500"`, `"99.90"`; 2, Fecha, `AAAA-MM-DD`, una fecha que exista., `"2026-11-30"`; 3, URL, La dirección completa, con `https://` o `http://`., `"https://ejemplo.com/pedido/123"`; 4, Alfanumérico, Pensado para códigos con letras y números; acepta cualquier texto., `"AB1234"`. |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string | Id opaco: un texto que empieza con `fld_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `name` | string |  |
  | `type` | integer ∈ {0, 1, 2, 3, 4} | Tipo del campo. Se elige al crearlo y no se puede cambiar después. Indica cómo escribir su valor: (columnas: `type`, Tipo, Cómo escribir `value`, Ejemplo) 0, Texto, Cualquier texto., `"Cliente mayorista"`; 1, Numérico, Un número, con punto decimal y sin separador de miles; puede llevar `-` adelante., `"1500"`, `"99.90"`; 2, Fecha, `AAAA-MM-DD`, una fecha que exista., `"2026-11-30"`; 3, URL, La dirección completa, con `https://` o `http://`., `"https://ejemplo.com/pedido/123"`; 4, Alfanumérico, Pensado para códigos con letras y números; acepta cualquier texto., `"AB1234"`. |
  | `description` | string \| null |  |
  | `contact_count` | integer |  |
  | `created_at` | string (date-time) \| null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver un campo

`GET /api/v1/custom-fields/{customField}` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `customField.show`

**Para qué sirve:** Sirve para ver la definición de un campo personalizado: nombre, tipo, descripción y cuántos contactos lo tienen.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `customField` | path | string | sí |  |

**Respuestas**

- `200` — OK

  La misma tabla que en «Crear un campo», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)

### Editar un campo

`PUT /api/v1/custom-fields/{customField}` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `customField.update`

**Para qué sirve:** Úsalo para renombrar un campo personalizado o actualizar su descripción; el tipo no se cambia por acá.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `customField` | path | string | sí |  |

**Cuerpo** (`application/json`)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `name` | string | no |  |
| `description` | string \| null | no |  |

**Respuestas**

- `200` — OK

  La misma tabla que en «Crear un campo», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver los campos de un contacto

`GET /api/v1/contacts/{contact}/custom-fields` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `contact.customFields`

**Para qué sirve:** Sirve para leer los valores de los campos personalizados de un contacto, con búsqueda por nombre de campo.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `contact` | path | string | sí |  |
| `name` | query | string | no |  |
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<ContactCustomFieldResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `fld_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].name` | string |  |
  | `data[].description` | string |  |
  | `data[].type` | integer ∈ {0, 1, 2, 3, 4} | Tipo del campo. Se elige al crearlo y no se puede cambiar después. Indica cómo escribir su valor: (columnas: `type`, Tipo, Cómo escribir `value`, Ejemplo) 0, Texto, Cualquier texto., `"Cliente mayorista"`; 1, Numérico, Un número, con punto decimal y sin separador de miles; puede llevar `-` adelante., `"1500"`, `"99.90"`; 2, Fecha, `AAAA-MM-DD`, una fecha que exista., `"2026-11-30"`; 3, URL, La dirección completa, con `https://` o `http://`., `"https://ejemplo.com/pedido/123"`; 4, Alfanumérico, Pensado para códigos con letras y números; acepta cualquier texto., `"AB1234"`. |
  | `data[].value` | string | Valor del campo para el contacto. Siempre es un texto (`"1500"`, no `1500`). Al ponerlo con tu clave se valida contra el tipo del campo (numérico, fecha o URL) y, si no cumple su formato, la API responde 422: el formato de cada tipo está en la descripción de `type` de `GET /custom-fields`. |
  | `data[].created_at` | string |  |
  | `data[].updated_at` | string |  |
  | `data[].contact_count` | string |  |
  | `links` | object |  |
  | `links.first` | string \| null |  |
  | `links.last` | string \| null |  |
  | `links.prev` | string \| null |  |
  | `links.next` | string \| null |  |
  | `meta` | object |  |
  | `meta.current_page` | integer |  |
  | `meta.from` | integer \| null |  |
  | `meta.last_page` | integer |  |
  | `meta.links` | array<object> |  |
  | `meta.path` | string |  |
  | `meta.per_page` | integer |  |
  | `meta.to` | integer \| null |  |
  | `meta.total` | integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Poner un valor en un contacto

`POST /api/v1/contacts/attach-custom-field` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `contact.attachCustomField`

**Para qué sirve:** Úsalo para guardar datos propios de tu negocio en los contactos (plan, ciudad, fecha de compra): asigna valores de campos personalizados a uno o varios contactos en una sola llamada.

Pone valores de campos personalizados en contactos. El cuerpo es una lista de ítems `{customFieldId, contactId, value}`; si el contacto ya tenía un valor en ese campo, se reemplaza.

```json
[{"customFieldId": 15, "contactId": 4321, "value": "2026-11-30"}]
```

Cada ítem se resuelve por separado y uno rechazado no detiene a los demás. La respuesta es **200** con un resultado `{message, status}` por ítem, en el mismo orden:

| `status` | Cuándo |
|---|---|
| 201 | El valor quedó guardado. |
| 404 | El campo o el contacto no existe, no es de tu cuenta o está fuera del workspace de tu clave. No se guarda. |
| 422 | `value` no cumple el formato del tipo del campo (numérico, fecha `AAAA-MM-DD` o URL); `message` dice qué formato espera. No se guarda. |

Cómo escribir `value` según el tipo: ver `type` en `GET /custom-fields`. Si el cuerpo no es una lista de ítems con `customFieldId`, `contactId` y `value` de texto, la llamada entera responde **422** y no guarda nada.

**Cuerpo** (`application/json`)

Esquema: array<object>.

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `[].message` | string |  |
  | `[].status` | integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Quitar un valor de un contacto

`POST /api/v1/contacts/detach-custom-field` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `contact.detachCustomField`

**Para qué sirve:** Sirve para borrar el valor de un campo personalizado en uno o varios contactos, por ejemplo cuando un dato quedó desactualizado en tu sistema.

**Cuerpo** (`application/json`)

Esquema: array<object>.

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `messages` | array<string> |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Borrar campos personalizados

`POST /api/v1/custom-fields/delete` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `customField.destroy`

**Para qué sirve:** Úsalo para eliminar en bloque los campos personalizados que ya no usas.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `customFieldIds` | array<string> | sí |  |

**Respuestas**

- `200` — OK
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

## Los eventos

Llegan por webhook. Cómo crear uno, cómo llega cada entrega, los reintentos, el permiso que pide cada evento y cómo verificar la firma (con funciones probadas en Node.js, Python y PHP): https://developers-portal.funnelchat.app/ia/lo-basico.md.

### `contact.tag_added`

Un contacto recibió una etiqueta.

Se envía un evento por cada contacto y etiqueta agregados, también en operaciones en bloque; no se envía si el contacto ya tenía la etiqueta. `source` indica el origen: manual, flow, bulk, import, sync, walink o ai. En operaciones en bloque grandes el límite de volumen de la cuenta puede descartar parte de los eventos.

Ejemplo:

```json
{
  "id": "evt_000000000000000000000006",
  "type": "contact.tag_added",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "contact": {
      "id": "ctc_ABViuUDF93I2VL1tInstRDG",
      "name": "Contacto de ejemplo",
      "phone": "+5491100000000"
    },
    "tag": {
      "id": "tag_AHCtI0e7I43AVkLJRpd7QBU",
      "name": "Etiqueta de ejemplo"
    },
    "source": "manual",
    "workspace_id": 37
  }
}
```

### `contact.tag_removed`

Un contacto perdió una etiqueta.

Se envía un evento por cada contacto y etiqueta quitados, también en operaciones en bloque; no se envía si el contacto no tenía la etiqueta. No se envía al borrar la etiqueta, al borrar o fusionar contactos ni al desvincular etiquetas de un tablero. `source` indica el origen: manual, flow, bulk o ai. En operaciones en bloque grandes el límite de volumen de la cuenta puede descartar parte de los eventos.

Ejemplo:

```json
{
  "id": "evt_000000000000000000000009",
  "type": "contact.tag_removed",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "contact": {
      "id": "ctc_ABViuUDF93I2VL1tInstRDG",
      "name": "Contacto de ejemplo",
      "phone": "+5491100000000"
    },
    "tag": {
      "id": "tag_AHCtI0e7I43AVkLJRpd7QBU",
      "name": "Etiqueta de ejemplo"
    },
    "source": "manual",
    "workspace_id": 37
  }
}
```

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
