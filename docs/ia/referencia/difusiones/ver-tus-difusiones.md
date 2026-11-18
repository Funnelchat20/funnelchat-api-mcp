# Ver tus difusiones — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/difusiones/ver-tus-difusiones/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver tus difusiones

`GET /api/v1/broadcasts` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `broadcast.index`

**Para qué sirve:** Úsalo para armar un panel o reporte de tus difusiones: filtra por número, estado, carpeta, tipo de envío o fecha programada y ubica rápido la que te interesa.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `name` | query | string \| null | no |  |
| `device_id` | query | string \| null | no |  |
| `status[]` | query | array<string ∈ {"0", "1", "2", "3", "4", "5", "6", "7", "8", "9"}> ∈ {"0", "1", "2", "3", "4", "5", "6", "7", "8", "9"} | no |  |
| `folder_id` | query | string \| null | no |  |
| `unclassified` | query | string \| null | no |  |
| `send_type` | query | string \| null ∈ {"immediate", "scheduled", null} | no |  |
| `device_type` | query | string \| null ∈ {"business", "api", null} | no |  |
| `send_at_from` | query | string (date-time) \| null | no |  |
| `send_at_to` | query | string (date-time) \| null | no |  |
| `publish_as_status` | query | string \| null ∈ {"only", "exclude", null} | no |  |
| `awaiting_manual_start` | query | string \| null ∈ {"only", "exclude", null} | no |  |
| `perPage` | query | integer | no |  |
| `orderBy` | query | string ∈ {"name", "created_at", "updated_at"} | no |  |
| `orderByMethod` | query | string ∈ {"asc", "desc"} | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<BroadcastsResource> |  |
  | `data[].id` | string |  |
  | `data[].name` | string |  |
  | `data[].device_id` | string | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].template_id` | string \| string ∈ {""} |  |
  | `data[].folder_id` | string | Id opaco: un texto que empieza con `fdr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].value` | string |  |
  | `data[].date_from` | string \| string ∈ {""} |  |
  | `data[].date_to` | string \| string ∈ {""} |  |
  | `data[].send_at` | string \| string ∈ {""} |  |
  | `data[].contacts_count` | string |  |
  | `data[].created_at` | string |  |
  | `data[].updated_at` | string \| string ∈ {""} |  |
  | `data[].status` | string |  |
  | `data[].shipping_speed` | string |  |
  | `data[].delivered_messages_count` | string \| null |  |
  | `data[].readed_messages_count` | string \| null |  |
  | `data[].replied_messages_count` | string \| null |  |
  | `data[].failure_reason` | object \| null |  |
  | `data[].awaiting_manual_start` | string |  |
  | `data[].send_mode` | string |  |
  | `data[].protect_template_category` | boolean |  |
  | `data[].progress` | object \| null |  |
  | `data[].paused_at` | string \| null |  |
  | `data[].pause_reason` | string \| null |  |
  | `data[].resume_from_contact` | integer \| null |  |
  | `data[].stop_reason` | string \| null |  |
  | `data[].publish_as_status` | string |  |
  | `data[].custom_field_filters` | string \| array<string> |  |
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
- `422` — Unprocessable Content (`ConversationsValidationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
