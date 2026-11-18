# Tickets — API de Funnelchat: contexto para tu IA

> Copiado de /docs/mas-funciones/funnelchat/#tickets. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Tickets

- `{id}` es el `id` del ticket (el que devuelve crear, o el de la lista). `contactId` es el `id` del contacto. `userId`
  es una persona del equipo: la especificación no dice de dónde sale; el candidato es el `id` de «Ver tu equipo»
  (`GET /api/v1/agents`), pero no está confirmado. Si la persona no te dice a quién, pregúntale; no elijas por ella.
- Un ticket trae `id`, `user_id`, `contact_id`, `title`, `description`, `deadline`, `created_at`, `updated_at` y
  `actor_user_id`. **No trae un campo de estado:** con `deadline` en `null` está abierto; con un número, cerrado, y ese
  número son los minutos que estuvo abierto (al reabrirlo vuelve a `null`).
- **`status` es solo un filtro de `GET /api/v1/tickets`:** `1`, los tickets abiertos; `2`, los cerrados; `0` —el que
  se usa si no lo mandas—, los contactos que todavía no tienen un ticket. Para listar tickets, manda siempre `status=1`
  o `status=2`. La especificación no describe la forma de los elementos de la lista: lee los que llegan.
- **Editar** (`PUT /api/v1/tickets/{id}`) pide `title` y `description`, los dos: si la persona cambia solo uno, lee el
  ticket antes y manda el otro como estaba.
- **Asignar** (`POST /api/v1/tickets/assign`, con `ticketId` y `userId`), **cerrar** y **reabrir** responden `200` con
  un texto: decide por el código, no por el texto. Cierra o reabre solo cuando la persona lo pide para ese ticket.
- Crear responde `404` («Contacto no encontrado.») si el contacto no es de la cuenta. Ver un ticket no declara `404`:
  decide por el código que llegue.
- No hay llamada para borrar un ticket.

## Llamadas

### Ver tus tickets

`GET /api/v1/tickets` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `ticket.index`

**Para qué sirve:** Sirve para listar los tickets de la cuenta filtrando por estado (`1` abiertos, `2` cerrados) o por usuario asignado, por ejemplo para armar una vista de casos pendientes.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `status` | query | integer ∈ {"0", "1", "2"} | no |  |
| `userId` | query | string | no |  |
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<object> |  |
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

### Crear un ticket

`POST /api/v1/tickets` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `ticket.store`

**Para qué sirve:** Úsalo para abrir un ticket sobre un contacto (título y descripción) y asignárselo a un usuario del equipo, por ejemplo cuando tu sistema detecta un reclamo.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `userId` | string | sí | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
| `contactId` | string | sí | Id opaco: un texto que empieza con `ctc_`. Se usa tal como llega; no se arma ni se interpreta. |
| `title` | string | sí |  |
| `description` | string | sí |  |

**Respuestas**

- `201` — Created

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string | Id opaco: un texto que empieza con `tkt_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `user_id` | string | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `contact_id` | string \| null | Id opaco: un texto que empieza con `ctc_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `title` | string |  |
  | `description` | string \| null |  |
  | `deadline` | integer \| null |  |
  | `created_at` | string (date-time) \| null |  |
  | `updated_at` | string (date-time) \| null |  |
  | `actor_user_id` | string \| null | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver un ticket

`GET /api/v1/tickets/{id}` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `ticket.show`

**Para qué sirve:** Sirve para ver un ticket con su contacto, su responsable, la descripción y la fecha límite.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |

**Respuestas**

- `200` — OK

  La misma tabla que en «Crear un ticket», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)

### Editar un ticket

`PUT /api/v1/tickets/{id}` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `ticket.update`

**Para qué sirve:** Úsalo para corregir o ampliar el título y la descripción de un ticket.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `title` | string | sí |  |
| `description` | string | sí |  |

**Respuestas**

- `200` — OK

  La misma tabla que en «Crear un ticket», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Asignar tickets

`POST /api/v1/tickets/assign` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `ticket.assignTicketToUser`

**Para qué sirve:** Sirve para reasignar un ticket a otro usuario del equipo.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `ticketId` | string | sí | Id opaco: un texto que empieza con `tkt_`. Se usa tal como llega; no se arma ni se interpreta. |
| `userId` | string | sí | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |

**Respuestas**

- `200` — OK
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Cerrar un ticket

`POST /api/v1/tickets/{id}/close` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `ticket.closeTicket`

**Para qué sirve:** Úsalo para cerrar un ticket cuando el caso quedó resuelto.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |

**Respuestas**

- `200` — OK
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)

### Reabrir un ticket

`POST /api/v1/tickets/{id}/reopen` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `ticket.reOpenTicket`

**Para qué sirve:** Sirve para reabrir un ticket cerrado si el caso vuelve a necesitar atención.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |

**Respuestas**

- `200` — OK
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
