# Conversaciones — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/conversaciones/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver los mensajes con un contacto

`GET /api/v1/contacts/{contactId}/messages` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `conversation.getLatestMessages`

**Para qué sirve:** Sirve para traer el historial de mensajes de un contacto y mantenerlo sincronizado en tu sistema, con paginación por cursor y `updated_since` para pedir solo lo nuevo.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `contactId` | path | string | sí |  |
| `cursor` | query | string | no |  |
| `updated_since` | query | string | no |  |
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<MessageResource> |  |
  | `data[].chat_id` | string |  |
  | `data[].contact_id` | string \| string ∈ {""} |  |
  | `data[].content` | array<any> \| object \| string |  |
  | `data[].device_id` | string \| string ∈ {""} |  |
  | `data[].error_code` | string |  |
  | `data[].file` | string |  |
  | `data[].forwarded` | integer |  |
  | `data[].group_id` | integer \| string ∈ {""} |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `msg_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].origin` | integer ∈ {0, 1, 2, 3} \| string ∈ {""} |  |
  | `data[].origin_id` | string \| null | Id opaco de lo que envió el mensaje, según `origin`: un flujo (`flw_`), una difusión (`bcs_`) o un agente de IA (`ast_`). Vacío o `null` si lo envió una persona. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].own` | integer |  |
  | `data[].reference_message` | string \| null |  |
  | `data[].reference_message_uid` | string \| null |  |
  | `data[].is_quotable` | boolean |  |
  | `data[].status` | integer ∈ {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10} \| null |  |
  | `data[].temporal_uuid` | string \| string ∈ {""} |  |
  | `data[].text` | string |  |
  | `data[].time` | string \| null |  |
  | `data[].type` | integer ∈ {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24} \| null |  |
  | `data[].uid` | string |  |
  | `data[].info` | array<any> \| string ∈ {""} |  |
  | `data[].user_id` | string | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].deleted_at` | string \| null |  |
  | `data[].deleted_scope` | string \| null |  |
  | `data[].deleted_by` | integer \| null |  |
  | `data[].edited_at` | string \| null |  |
  | `data[].poll_results` | string |  |
  | `data[].event_rsvps` | string |  |
  | `data[].form_answers` | string |  |
  | `data[].reactions` | array<any> |  |
  | `data[].file_original_name` | string \| null |  |
  | `data[].client_reference` | string \| null |  |
  | `data[].scheduled` | boolean |  |
  | `data[].ai_assistant` | object |  |
  | `links` | object |  |
  | `links.first` | string \| null |  |
  | `links.last` | string \| null |  |
  | `links.prev` | string \| null |  |
  | `links.next` | string \| null |  |
  | `meta` | object |  |
  | `meta.path` | string |  |
  | `meta.per_page` | integer |  |
  | `meta.next_cursor` | string \| null |  |
  | `meta.prev_cursor` | string \| null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver tus conversaciones

`GET /api/v1/conversations` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `conversation.index`

**Para qué sirve:** Úsalo para construir tu propia bandeja de entrada o sincronizar conversaciones: filtra por número, asesor, etiquetas, etapa del kanban, no leídas o lead score, y trae solo lo nuevo con `updated_since`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `perName` | query | string | no |  |
| `contactId` | query | string | no |  |
| `cursor` | query | string | no |  |
| `updated_since` | query | string | no |  |
| `favorites` | query | boolean | no |  |
| `ownContacts` | query | boolean | no |  |
| `ownAndUnassigned` | query | boolean | no |  |
| `deviceId` | query | string | no |  |
| `advisorId` | query | string | no |  |
| `advisorIds` | query | string | no |  |
| `activeConversation` | query | boolean | no |  |
| `tags` | query | string | no |  |
| `kanbanSettingId` | query | string | no |  |
| `kanbanStageIds` | query | string | no |  |
| `unreadMessages` | query | boolean | no |  |
| `awaitingReply` | query | boolean | no |  |
| `onlyWithMac` | query | boolean | no |  |
| `paused` | query | string ∈ {"true", "false", "1", "0"} | no |  |
| `leadScoreCategories` | query | string \| null | no |  |
| `leadScoreMin` | query | integer | no |  |
| `leadScoreMax` | query | integer | no |  |
| `leadScoreDisqualified` | query | string \| null ∈ {"include", "exclude", "only", null} | no |  |
| `metaWindowOpen` | query | boolean | no |  |
| `metaWindowDeviceIds` | query | string \| null | no |  |
| `lastMessageDateFrom` | query | string (date) \| null | no |  |
| `lastMessageDateTo` | query | string (date) \| null | no |  |
| `timezone` | query | string \| null | no |  |
| `customFieldFilters` | query | string \| null | no |  |
| `perPage` | query | integer | no |  |
| `orderBy` | query | string ∈ {"asc", "desc"} | no |  |

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
  | `meta.path` | string |  |
  | `meta.per_page` | integer |  |
  | `meta.next_cursor` | string \| null |  |
  | `meta.prev_cursor` | string \| null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)
- `500` — Internal Server Error

### Contar tus conversaciones

`GET /api/v1/conversations/count/all` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `conversation.countAll`

**Para qué sirve:** Úsalo para obtener el total de conversaciones, como base para calcular la proporción de abiertas, cerradas o sin leer.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `advisorIds` | query | string | no |  |
| `favorites` | query | boolean | no |  |
| `ownAndUnassigned` | query | boolean | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `count` | integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Contar las conversaciones abiertas

`GET /api/v1/conversations/count/open` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `conversation.countOpen`

**Para qué sirve:** Úsalo para medir la carga de trabajo actual: cuántas conversaciones abiertas hay, en total o por asesor.

**Parámetros**

La misma tabla que en «Contar tus conversaciones», más arriba en este texto.

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `count` | integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Contar las conversaciones cerradas

`GET /api/v1/conversations/count/closed` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `conversation.countClosed`

**Para qué sirve:** Sirve para contar las conversaciones cerradas, por ejemplo para métricas de atención por asesor.

**Parámetros**

La misma tabla que en «Contar tus conversaciones», más arriba en este texto.

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `count` | null \| integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Contar las conversaciones sin leer

`GET /api/v1/conversations/count/unread` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `conversation.countUnread`

**Para qué sirve:** Sirve para mostrar un contador de conversaciones sin leer, por ejemplo en un badge o tablero, filtrable por asesores o favoritas.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `advisorIds` | query | string | no |  |
| `favorites` | query | boolean | no |  |
| `ownAndUnassigned` | query | boolean | no |  |
| `withMine` | query | boolean | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `count` | integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Marcar todas como leídas

`POST /api/v1/conversations/mark-all-read` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `conversation.markAllAsRead`

**Para qué sirve:** Sirve para poner en cero los no leídos de una vez, por ejemplo cuando ya atendiste por otro canal; se puede acotar por asesores o favoritas.

**Cuerpo** (`application/json`)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `advisorIds` | string | no |  |
| `favorites` | boolean | no |  |
| `ownAndUnassigned` | boolean | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `message` | "Todas las conversaciones han sido marcadas como leídas" |  |
  | `updated_count` | integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Marcar todas como no leídas

`POST /api/v1/conversations/mark-all-unread` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `conversation.markAllAsUnread`

**Para qué sirve:** Úsalo para volver a marcar como no leídas las conversaciones de un conjunto (por asesores o favoritas) y que el equipo las retome. Tiene un tope y la respuesta avisa si se alcanzó.

**Cuerpo** (`application/json`)

La misma tabla que en «Marcar todas como leídas», más arriba en este texto.

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `message` | "Todas las conversaciones elegibles fueron marcadas como no leídas" |  |
  | `marked_count` | integer |  |
  | `limit_reached` | boolean |  |
  | `contact_ids` | object |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
