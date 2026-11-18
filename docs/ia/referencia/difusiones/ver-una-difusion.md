# Ver una difusión — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/difusiones/ver-una-difusion/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver una difusión

`GET /api/v1/broadcasts/{broadcast}` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `broadcast.show`

**Para qué sirve:** Úsalo para ver la configuración completa de una difusión: número, plantilla, carpeta y los filtros de audiencia que usó (etiquetas, países, kanban, lead score).

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `broadcast` | path | string | sí |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string | Id opaco: un texto que empieza con `bcs_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `name` | string |  |
  | `device_id` | string \| null | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `template_id` | string \| string ∈ {""} |  |
  | `template` | string \| null |  |
  | `folder` | object \| null |  |
  | `folder.id` | string | Id opaco: un texto que empieza con `fdr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `folder.name` | string |  |
  | `value` | array<any> \| null |  |
  | `template_button_flows` | array<any> \| null |  |
  | `included_tags` | array<TagResource> |  |
  | `included_tags[].id` | string | Id opaco: un texto que empieza con `tag_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `included_tags[].name` | string |  |
  | `included_tags[].description` | string |  |
  | `included_tags[].color` | string \| null |  |
  | `included_tags[].is_system` | boolean |  |
  | `included_tags[].created_at` | string \| null |  |
  | `included_tags[].updated_at` | string \| null |  |
  | `included_tags[].contact_count` | string \| integer |  |
  | `excluded_tags` | array<TagResource> |  |
  | `excluded_tags[].id` | string | Id opaco: un texto que empieza con `tag_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `excluded_tags[].name` | string |  |
  | `excluded_tags[].description` | string |  |
  | `excluded_tags[].color` | string \| null |  |
  | `excluded_tags[].is_system` | boolean |  |
  | `excluded_tags[].created_at` | string \| null |  |
  | `excluded_tags[].updated_at` | string \| null |  |
  | `excluded_tags[].contact_count` | string \| integer |  |
  | `some_tags` | array<TagResource> |  |
  | `some_tags[].id` | string | Id opaco: un texto que empieza con `tag_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `some_tags[].name` | string |  |
  | `some_tags[].description` | string |  |
  | `some_tags[].color` | string \| null |  |
  | `some_tags[].is_system` | boolean |  |
  | `some_tags[].created_at` | string \| null |  |
  | `some_tags[].updated_at` | string \| null |  |
  | `some_tags[].contact_count` | string \| integer |  |
  | `countries` | array<any> \| null |  |
  | `kanban_setting_id` | string \| null | Id opaco: un texto que empieza con `knb_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `kanban_stage_ids` | array<any> \| null |  |
  | `only_stagnant` | boolean |  |
  | `lead_score_categories` | array<any> \| null |  |
  | `lead_score_min` | integer \| null |  |
  | `lead_score_max` | integer \| null |  |
  | `custom_field_filters` | array<any> \| null |  |
  | `custom_field_filter_fields` | string \| array<string> |  |
  | `exclude_never_replied` | boolean |  |
  | `date_from` | string |  |
  | `date_to` | string |  |
  | `send_at` | string |  |
  | `contacts_count` | string \| integer \| null |  |
  | `delivered_messages_count` | null |  |
  | `readed_messages_count` | null |  |
  | `created_at` | string |  |
  | `updated_at` | string |  |
  | `status` | integer ∈ {0, 1, 2, 3, 4, 5, 6, 7, 8, 9} |  |
  | `shipping_speed` | integer ∈ {0, 1, 2} |  |
  | `risk_acceptance` | object \| null |  |
  | `risk_acceptance.accepted_by_name` | string \| null |  |
  | `risk_acceptance.accepted_at` | string |  |
  | `risk_acceptance.audience_count` | integer \| null |  |
  | `risk_acceptance.provider` | string \| null |  |
  | `risk_acceptance.risk_codes` | string \| array<string> |  |
  | `missing_data_audit` | object \| null |  |
  | `missing_data_audit.audience_count` | integer |  |
  | `missing_data_audit.affected_count` | integer |  |
  | `missing_data_audit.items` | string \| array<string> |  |
  | `missing_data_audit.unknown_custom_fields` | string \| array<string> |  |
  | `smart_send` | boolean |  |
  | `smart_send_state` | null \| object \| string |  |
  | `smart_send_state.batch_size` | string |  |
  | `smart_send_state.pages_per_batch` | string |  |
  | `smart_send_state.current_batch` | string |  |
  | `smart_send_state.total_batches` | string |  |
  | `smart_send_state.risk_signals` | string |  |
  | `smart_send_state.risk_pause` | string |  |
  | `smart_send_state.rejection_codes` | string |  |
  | `smart_send_state.risk_pause_count` | string |  |
  | `smart_send_state.quality` | string |  |
  | `smart_send_state.quality_baseline` | string |  |
  | `smart_send_state.checked_at` | string |  |
  | `smart_send_state.resume_page` | string |  |
  | `smart_send_state.page_size` | string |  |
  | `smart_send_state.total_pages` | string |  |
  | `smart_send_state.paused_at` | string |  |
  | `smart_send_state.pause_reason` | string |  |
  | `smart_send_state.quality_read_failures` | string |  |
  | `smart_send_state.cancelled_at` | string |  |
  | `smart_send_state.stop_reason` | string |  |
  | `smart_send_state.number_brake_until` | string |  |
  | `smart_send_state.number_brake_lifted_at` | string |  |
  | `smart_send_state.template_name` | string |  |
  | `smart_send_state.template_status` | string |  |
  | `smart_send_state.quality_risk_accepted` | object |  |
  | `number_brake_until` | string \| null |  |
  | `failure_reason` | object \| null |  |
  | `failure_reason.reason` | string \| null |  |
  | `awaiting_manual_start` | boolean |  |
  | `send_mode` | string ∈ {"now", "schedule", "after_approval"} |  |
  | `protect_template_category` | boolean |  |
  | `adviser_id` | string \| null | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `adviser_name` | string \| null |  |
  | `publish_as_status` | boolean |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `403` — Forbidden
- `404` — Not Found (`ConversationsModelNotFoundException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
