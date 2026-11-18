# Etiquetas — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/etiquetas/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
