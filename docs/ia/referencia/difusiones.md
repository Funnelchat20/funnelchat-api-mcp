# Difusiones — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/difusiones/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Contar los contactos para una difusión

`POST /api/v1/broadcasts/contacts-count` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `broadcast.contactsCount`

**Para qué sirve:** Úsalo para dimensionar la audiencia de una difusión con los mismos filtros con que buscas sus contactos, sin traerlos uno por uno. La especificación no describe la forma de la respuesta.

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

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `contactsCount` | integer |  |
  | `unreachableCount` | integer |  |
  | `pausedCount` | integer |  |
  | `optedOutCount` | integer |  |
  | `hardBouncedCount` | integer |  |
  | `blockedCount` | integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver los tramos de costo

`GET /api/v1/broadcasts/cost-tiers` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `broadcast.costTiers`

**Para qué sirve:** Sirve para consultar los tramos de costo vigentes y la fecha de la última actualización de tarifas, como referencia para estimar cuánto puede costar una difusión.

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `tiers` | string \| array<string> |  |
  | `rates_updated_at` | string \| null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)

### Ver las estadísticas de una difusión

`GET /api/v1/broadcasts/{broadcast}/statistics` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `broadcast.statistics`

**Para qué sirve:** Úsalo para medir el resultado de una difusión: entregados, leídos, respondidos, fallidos, pendientes y omitidos (con su motivo), más los clics en cada botón.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `broadcast` | path | string | sí |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `broadcast_id` | string | Id opaco: un texto que empieza con `bcs_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `statistics` | object |  |
  | `statistics.delivered_messages_count` | integer |  |
  | `statistics.readed_messages_count` | integer |  |
  | `statistics.failed_messages_count` | integer |  |
  | `statistics.pending_messages_count` |  |  |
  | `statistics.queued_messages_count` |  |  |
  | `statistics.cancelled_messages_count` | integer \| null |  |
  | `statistics.replied_messages_count` | integer |  |
  | `statistics.skipped_messages_count` | number |  |
  | `statistics.skipped_by_reason` | object |  |
  | `button_interactions` | array<object> |  |
  | `button_interactions[].button_index` | integer |  |
  | `button_interactions[].clicks_count` | integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)

### Ver el costo de una difusión

`GET /api/v1/broadcasts/{broadcast}/cost` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `broadcast.cost`

**Para qué sirve:** Sirve para saber cuánto cuesta una difusión: la estimación previa y el costo calculado de lo enviado, desglosado por mercado, y te dice si el dato todavía es parcial.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `broadcast` | path | string | sí |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `broadcast_id` | string | Id opaco: un texto que empieza con `bcs_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `currency` | "USD" |  |
  | `is_partial` | boolean |  |
  | `estimate` | object \| null |  |
  | `estimate.category` | string \| null |  |
  | `estimate.currency` | string |  |
  | `estimate.contacts` | integer |  |
  | `estimate.unpriced_contacts` | integer |  |
  | `estimate.total` | number |  |
  | `estimate.per_market` | array<object> |  |
  | `estimate.rates_updated_at` | string \| null |  |
  | `estimate.computed_at` | string \| null |  |
  | `computed` | object |  |
  | `computed.total` | number |  |
  | `computed.sent` | 0 |  |
  | `computed.billed` | 0 |  |
  | `computed.free` | 0 |  |
  | `computed.pending_price` | 0 |  |
  | `computed.no_data` | 0 |  |
  | `computed.category` | null \| string \| integer \| object |  |
  | `computed.per_market` | array<object> |  |
  | `rates_updated_at` | string \| null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)

### Ver los contactos de una difusión

`GET /api/v1/broadcasts/{broadcast}/contacts` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `broadcast.broadcastContacts`

**Para qué sirve:** Úsalo para obtener la lista de destinatarios de una difusión, por ejemplo para cruzarla con tu CRM o auditar a quién se le envió.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `broadcast` | path | string | sí |  |
| `perPage` | query | integer | no |  |
| `orderByMethod` | query | string ∈ {"asc", "desc"} | no |  |

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
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver los mensajes de una difusión

`GET /api/v1/broadcasts/{broadcast}/messages` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `broadcast.broadcastMessages`

**Para qué sirve:** Sirve para ver el detalle por destinatario de una difusión: estado de cada mensaje, motivo de omisión y fecha de envío. Para ver los entregados, leídos, respondidos, fallidos u omitidos, filtra con `tab`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `broadcast` | path | string | sí |  |
| `status[]` | query | array<string ∈ {"0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"}> ∈ {"0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"} | sí |  |
| `tab` | query | string \| null ∈ {"all", "delivered", "read", "replied", "failed", "skipped", null} | no |  |
| `perPage` | query | integer | no |  |
| `orderByMethod` | query | string ∈ {"asc", "desc"} | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<BroadcastMessageResource> |  |
  | `data[].contact_id` | string | Id opaco: un texto que empieza con `ctc_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].contact_name` | string \| string ∈ {""} |  |
  | `data[].contact_phone` | string \| string ∈ {""} |  |
  | `data[].contact_image` | string \| string ∈ {""} |  |
  | `data[].message_status` | string \| null |  |
  | `data[].message_info` | object |  |
  | `data[].skip_reason` | string \| null |  |
  | `data[].skipped_at` | string \| null |  |
  | `data[].recipient_state` | string |  |
  | `data[].sent_at` | string \| null |  |
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
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Cancelar una difusión

`POST /api/v1/broadcasts/{broadcast}/cancel` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `broadcast.cancel`

**Para qué sirve:** Úsalo para cerrar una difusión que está saliendo o que quedó pausada: termina ahí, con fallos parciales, y llega `broadcast.finished` con `reason` `cancelled`. En otro estado —también si está programada— responde `409`: una programada se borra.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `broadcast` | path | string | sí |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `message` | "Broadcast cancelled." |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `409` — Conflict

### Borrar una difusión

`DELETE /api/v1/broadcasts/{broadcast}` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `broadcast.destroy`

**Para qué sirve:** Sirve para borrar una difusión programada, mientras no llegue su hora de envío. Una que ya se envió o está saliendo no se puede borrar (`422`); una pausada se cierra cancelándola.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `broadcast` | path | string | sí |  |

**Respuestas**

- `204` — No Content
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `403` — Forbidden
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content

### Mover difusiones a una carpeta

`POST /api/v1/broadcasts/move-to-folder` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `broadcast.moveToFolder`

**Para qué sirve:** Úsalo para ordenar difusiones en bloque: mueve varias a una carpeta con una sola llamada, por ejemplo al agruparlas por campaña o por cliente.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `broadcast_ids` | array<string> | sí |  |
| `folder_id` | string \| null | no | Id opaco: un texto que empieza con `fdr_`. Se usa tal como llega; no se arma ni se interpreta. |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `moved` | integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver las carpetas de difusiones

`GET /api/v1/broadcasts/folders` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `broadcastFolder.index`

**Para qué sirve:** Úsalo para obtener las carpetas de difusiones con cuántas difusiones tiene cada una, por ejemplo para replicar esa organización en tu sistema.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<BroadcastFolderResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `fdr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].name` | string |  |
  | `data[].broadcasts_count` | string \| integer ∈ {0} |  |
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

### Crear una carpeta de difusiones

`POST /api/v1/broadcasts/folders` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `broadcastFolder.store`

**Para qué sirve:** Sirve para crear una carpeta y agrupar difusiones por campaña, cliente o el criterio que uses.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `name` | string | sí |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string | Id opaco: un texto que empieza con `fdr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `name` | string |  |
  | `broadcasts_count` | string \| integer ∈ {0} |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Editar una carpeta de difusiones

`PUT /api/v1/broadcasts/folders/{broadcastFolder}` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `broadcastFolder.update`

**Para qué sirve:** Úsalo para renombrar una carpeta de difusiones.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `broadcastFolder` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `name` | string | sí |  |

**Respuestas**

- `200` — OK

  La misma tabla que en «Crear una carpeta de difusiones», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `403` — Forbidden
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Borrar una carpeta de difusiones

`DELETE /api/v1/broadcasts/folders/{broadcastFolder}` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `broadcastFolder.destroy`

**Para qué sirve:** Sirve para eliminar una carpeta de difusiones que ya no usas.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `broadcastFolder` | path | string | sí |  |

**Respuestas**

- `204` — No Content
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `403` — Forbidden
- `404` — Not Found (`ConversationsModelNotFoundException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
