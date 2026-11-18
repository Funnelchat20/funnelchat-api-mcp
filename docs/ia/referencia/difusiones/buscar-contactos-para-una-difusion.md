# Buscar contactos para una difusión — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/difusiones/buscar-contactos-para-una-difusion/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Buscar contactos para una difusión

`POST /api/v1/broadcasts/contacts` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `broadcast.contacts`

**Para qué sirve:** Sirve para previsualizar la audiencia de una difusión antes de crearla: le pasas los filtros (etiquetas, países, etapa del kanban, lead score) y te devuelve, paginados, los contactos que entrarían.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `perPage` | query | integer | no |  |

**Cuerpo** (`application/json`)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `tags` | array<string> | no |  |
| `some_tags` | array<string> | no |  |
| `exclude_tags` | array<string> | no |  |
| `countries` | array<string> | no |  |
| `date_from` | string (date-time) \| null | no |  |
| `date_to` | string (date-time) \| null | no |  |
| `only_with_phone` | boolean | no |  |
| `only_paused` | boolean | no |  |
| `device_id` | string \| null | no | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `only_hard_bounced` | boolean | no |  |
| `kanban_setting_id` | string \| null | no | Id opaco: un texto que empieza con `knb_`. Se usa tal como llega; no se arma ni se interpreta. |
| `kanban_stage_ids` | array<string> \| null | no |  |
| `only_stagnant` | boolean \| null | no |  |
| `exclude_never_replied` | boolean | no |  |
| `lead_score_categories` | array<string ∈ {"insufficient_data", "hot", "warm", "cold"}> \| null | no |  |
| `lead_score_min` | integer \| null | no |  |
| `lead_score_max` | integer \| null | no |  |
| `custom_field_filters` | array<object> \| null | no |  |
| `custom_field_filters[].custom_field_ids` | array<string> | sí |  |
| `custom_field_filters[].type` | integer ∈ {"0", "1", "2", "3", "4"} | sí |  |
| `custom_field_filters[].mode` | string \| null ∈ {"any", "all", "exclude", null} | no |  |
| `custom_field_filters[].value` | string \| null | no |  |
| `custom_field_filters[].numeric_operator` | string \| null ∈ {"lt", "eq", "gt", null} | no |  |
| `custom_field_filters[].numeric_value` | number \| null | no |  |
| `custom_field_filters[].date_operator` | string \| null ∈ {"lt", "gt", "eq", "period", null} | no |  |
| `custom_field_filters[].date_from` | string (date) \| null | no |  |
| `custom_field_filters[].date_to` | string (date) \| null | no |  |
| `per_page` | integer \| null | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<BroadcastContactResource> |  |
  | `data[].id` | string |  |
  | `data[].name` | string |  |
  | `data[].phone` | string |  |
  | `data[].whatsapp_id` | string |  |
  | `data[].email` | string |  |
  | `data[].image` | string |  |
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
