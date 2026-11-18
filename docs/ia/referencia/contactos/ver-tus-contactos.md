# Ver tus contactos — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/contactos/ver-tus-contactos/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver tus contactos

`GET /api/v1/contacts` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `contact.index`

**Para qué sirve:** Úsalo para buscar y segmentar contactos desde tu sistema: filtra por nombre, teléfono, email, etiquetas, campos personalizados, país, fecha de alta o lead score. Es la base para sincronizar o exportar tu CRM.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `name` | query | string | no |  |
| `email` | query | string | no |  |
| `phone` | query | string | no |  |
| `whatsapp_id` | query | string | no |  |
| `country_codes[]` | query | array<string> | no |  |
| `status` | query | string | no |  |
| `image` | query | string | no |  |
| `created_at` | query | string (date-time) | no |  |
| `created_from` | query | string (date-time) | no |  |
| `created_to` | query | string (date-time) | no |  |
| `tag_ids[]` | query | array<string> | no |  |
| `tag_mode` | query | string ∈ {"all", "any", "exclude"} | no |  |
| `custom_field_ids[]` | query | array<string> | no |  |
| `custom_field_mode` | query | string ∈ {"all", "any", "exclude"} | no |  |
| `custom_field_value` | query | string | no |  |
| `custom_field_date_from` | query | string (date) | no |  |
| `custom_field_date_to` | query | string (date) | no |  |
| `custom_field_numeric_operator` | query | string ∈ {"lt", "eq", "gt"} | no |  |
| `custom_field_numeric_value` | query | number | no |  |
| `only_with_phone` | query | string | no |  |
| `only_with_mac` | query | string | no |  |
| `only_paused` | query | string | no |  |
| `scopeToAdvisor` | query | string | no |  |
| `lead_score_categories[]` | query | array<string ∈ {"insufficient_data", "hot", "warm", "cold"}> ∈ {"insufficient_data", "hot", "warm", "cold"} | no |  |
| `lead_score_min` | query | integer | no |  |
| `lead_score_max` | query | integer | no |  |
| `lead_score_disqualified` | query | string \| null ∈ {"include", "exclude", "only", null} | no |  |
| `tag_filters` | query | array<object> | no |  |
| `custom_field_filters` | query | array<object> | no |  |
| `perPage` | query | integer | no |  |
| `orderBy` | query | string ∈ {"id", "name", "email", "phone", "status", "favorite", "unread_messages", "created_at", "updated_at"} | no |  |
| `orderByMethod` | query | string ∈ {"asc", "desc"} | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<ContactResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `ctc_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].name` | string |  |
  | `data[].email` | string |  |
  | `data[].phone` | string |  |
  | `data[].whatsapp_id` | string |  |
  | `data[].whatsapp_username` | string \| null |  |
  | `data[].has_phone` | boolean |  |
  | `data[].country_code` | string |  |
  | `data[].status` | integer |  |
  | `data[].image` | string |  |
  | `data[].notes` | string \| null |  |
  | `data[].custom_fields` | array<ContactCustomFieldResource> |  |
  | `data[].created_at` | string (date-time) \| null |  |
  | `data[].active_conversation` | integer |  |
  | `data[].favorite` | integer |  |
  | `data[].unread_messages` | integer |  |
  | `data[].manually_unread` | boolean |  |
  | `data[].last_message` | object |  |
  | `data[].device_id` | string \| null | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].adviser_id` | string \| null | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].paused_at` | string \| null |  |
  | `data[].paused_by` |  |  |
  | `data[].mac_date` | string \| null |  |
  | `data[].is_mac_inactive` | boolean |  |
  | `data[].ai_assistant_name` | string \| null |  |
  | `data[].opted_out` | boolean |  |
  | `data[].stage_since` | string |  |
  | `data[].is_stagnant` | boolean |  |
  | `data[].follow_up_date` | string \| null |  |
  | `data[].lead_score` | object |  |
  | `data[].name_mismatch` | array<any> \| null |  |
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
