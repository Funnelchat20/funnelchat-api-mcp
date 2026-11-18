# Respuestas rápidas — API de Funnelchat: contexto para tu IA

> Copiado de /docs/mas-funciones/funnelchat/#respuestas-rapidas. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Respuestas rápidas

- `{quickReply}` es el `id` de `GET /api/v1/quick-replies` (filtra con `search`, por páginas con `links.next`).
- **No hay llamada para mandar una respuesta rápida:** si la persona quiere usar una con un contacto, manda su texto
  (`message`) como un mensaje normal (ver «Mandar mensajes»).
- **`type` y `visibility` son obligatorios** al crear y al editar. `type` es el tipo de mensaje: `0` texto, `1`
  imagen, `2` video, `3` documento, `6` audio (la API acepta hasta `24`, pero el panel usa solo esos cinco, según el
  archivo que lleva). `visibility`: `1` la ven el titular y todos los agentes; `2` solo los agentes de `agent_ids` (si
  la crea la clave de un agente sin `agent_ids`, queda ese agente); `3` solo la cuenta principal. Ojo con la lista:
  un agente ve las `1` y las `2` donde está; el titular ve las `1` y las `3`, **no las `2`**. Si la persona no
  encuentra una, puede ser eso.
- No se describe qué va en `file` ni de dónde salen los `agent_ids` (el candidato es «Ver tu equipo»,
  `GET /api/v1/agents`, sin confirmar): si hacen falta, pregúntale a la persona.
- **Editar** (`PUT /api/v1/quick-replies/{quickReply}`) pide `name`, `type` y `visibility`: lee la respuesta rápida
  antes y manda los que no cambian como estaban.
- **Borrar** (`DELETE`, responde `204`): hazlo solo si la persona lo pide de forma explícita para eso; confírmale qué
  vas a borrar (nombre e id) antes de llamar. La especificación no dice si se puede recuperar.

## Llamadas

### Ver tus respuestas rápidas

`GET /api/v1/quick-replies` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `quickReply.index`

**Para qué sirve:** Úsalo para listar las respuestas rápidas de la cuenta, por ejemplo para ofrecerlas en tu propia interfaz de atención.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `search` | query | string | no |  |
| `perPage` | query | integer | no |  |
| `orderBy` | query | string ∈ {"created_at", "updated_at"} | no |  |
| `orderByMethod` | query | string ∈ {"asc", "desc"} | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<QuickReplyResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `qrp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].name` | string |  |
  | `data[].message` | string |  |
  | `data[].file` | string |  |
  | `data[].type` | integer ∈ {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24} |  |
  | `data[].visibility` | integer ∈ {1, 2, 3} |  |
  | `data[].agents` | object |  |
  | `data[].user_id` | string | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].created_at` | string |  |
  | `data[].updated_at` | string |  |
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

### Crear una respuesta rápida

`POST /api/v1/quick-replies` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `quickReply.store`

**Para qué sirve:** Sirve para crear una respuesta rápida con texto o archivo y definir quién la ve (visibilidad y agentes), así el equipo responde más rápido lo frecuente.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `name` | string | sí |  |
| `message` | string \| null | no |  |
| `file` | string \| null | no |  |
| `type` | integer ∈ {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24} | sí |  |
| `visibility` | integer ∈ {1, 2, 3} | sí |  |
| `agent_ids` | array<integer> \| null | no |  |

**Respuestas**

- `201` — Created

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string | Id opaco: un texto que empieza con `qrp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `name` | string |  |
  | `message` | string |  |
  | `file` | string |  |
  | `type` | integer ∈ {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24} |  |
  | `visibility` | integer ∈ {1, 2, 3} |  |
  | `agents` | object |  |
  | `user_id` | string | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `created_at` | string |  |
  | `updated_at` | string |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver una respuesta rápida

`GET /api/v1/quick-replies/{quickReply}` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `quickReply.show`

**Para qué sirve:** Úsalo para ver una respuesta rápida con su contenido, su tipo y los agentes que la tienen disponible.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `quickReply` | path | string | sí |  |

**Respuestas**

- `200` — OK

  La misma tabla que en «Crear una respuesta rápida», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)

### Editar una respuesta rápida

`PUT /api/v1/quick-replies/{quickReply}` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `quickReply.update`

**Para qué sirve:** Sirve para actualizar el contenido o la visibilidad de una respuesta rápida.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `quickReply` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

La misma tabla que en «Crear una respuesta rápida», más arriba en este texto.

**Respuestas**

- `200` — OK

  La misma tabla que en «Crear una respuesta rápida», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Borrar una respuesta rápida

`DELETE /api/v1/quick-replies/{quickReply}` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `quickReply.destroy`

**Para qué sirve:** Úsalo para eliminar una respuesta rápida que ya no se usa.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `quickReply` | path | string | sí |  |

**Respuestas**

- `204` — No Content
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
