# Ver tus conversaciones — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/conversaciones/ver-tus-conversaciones/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
