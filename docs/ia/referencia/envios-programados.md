# Envíos programados — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/envios-programados/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver tus envíos programados

`GET /api/v1/scheduled-messages` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `scheduledMessage.index`

**Para qué sirve:** Úsalo para listar tus envíos programados a grupos con su estado, fecha, recurrencia y campañas, filtrando por carpeta o por los que necesitan reconectar un número.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `perPage` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`). Orden: `orderBy` acepta `created_at`, `id`, `name`, `updated_at`; dirección `orderByMethod`: `asc` o `desc`. Otro valor responde `422`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `name` | query | string | no |  |
| `orderBy` | query | string | no |  |
| `orderByMethod` | query | string | no |  |
| `perPage` | query | integer | no |  |
| `status` | query | string ∈ {"0", "1", "2", "3", "4", "5", "6", "7", "8"} | no |  |
| `only_needs_connection` | query | string ∈ {"true", "false", "1", "0"} | no | Con `true`, solo los envíos pendientes o en curso que tienen grupos sin un número conectado que pueda enviar. Acepta `true`, `false`, `1` o `0`. |
| `folder_id` | query | string \| null | no |  |
| `unclassified` | query | string ∈ {"true", "false", "1", "0"} | no |  |

**Respuestas**

- `200` — Paginated set of `ScheduledMessageIndexResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<ScheduledMessageIndexResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `smg_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].uuid` | string | Identificador estable del envío: es el `scheduled_message.uuid` de los eventos `scheduled_message.*`. `null` solo en un envío creado antes del 30-09-2026 que todavía no generó ningún evento: se completa con el primero. |
  | `data[].name` | string \| string ∈ {""} |  |
  | `data[].send_at` | string \| null |  |
  | `data[].status` | string |  |
  | `data[].is_draft` | string \| boolean |  |
  | `data[].blocked_by_plan_limit` | boolean | `true` si la última ocurrencia del envío no salió porque se alcanzó el límite de envíos del plan. |
  | `data[].type` | string |  |
  | `data[].folder_id` | string \| null | Id opaco: un texto que empieza con `fdr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].campaign_ids` | array<string \| null> \| null |  |
  | `data[].excluded_group_ids` | array<string \| null> \| null |  |
  | `data[].can_be_edited` | string |  |
  | `data[].recurrence` | object |  |
  | `links` | object |  |
  | `links.first` | string \| null |  |
  | `links.last` | string \| null |  |
  | `links.prev` | string \| null |  |
  | `links.next` | string \| null |  |
  | `meta` | object |  |
  | `meta.current_page` | integer |  |
  | `meta.from` | integer \| null |  |
  | `meta.last_page` | integer |  |
  | `meta.links` | array<object> | Generated paginator links. |
  | `meta.path` | string \| null | Base path for paginator generated URLs. |
  | `meta.per_page` | integer | Number of items shown per page. |
  | `meta.to` | integer \| null | Number of the last item in the slice. |
  | `meta.total` | integer | Total number of items being paginated. |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Ver un envío programado

`GET /api/v1/scheduled-messages/{scheduledMessage}` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `scheduledMessage.show`

**Para qué sirve:** Sirve para ver un envío programado completo: fecha, estado, audiencia, lecturas, reproducciones, clics en links y velocidad de envío.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `scheduledMessage` | path | string (uuid) | sí | The scheduled message ID |

**Respuestas**

- `200` — `App.Modules.ScheduledMessages.Resources.ScheduledMessageResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string | Id opaco: un texto que empieza con `smg_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `uuid` | string | Identificador estable del envío: es el `scheduled_message.uuid` de los eventos `scheduled_message.*`. `null` solo en un envío creado antes del 30-09-2026 que todavía no generó ningún evento: se completa con el primero. |
  | `name` | string \| string ∈ {""} |  |
  | `send_at` | string \| null |  |
  | `status` | string |  |
  | `is_draft` | string \| boolean |  |
  | `blocked_by_plan_limit` | boolean | `true` si la última ocurrencia del envío no salió porque se alcanzó el límite de envíos del plan. Solo se calcula en el detalle del envío; en las demás respuestas es siempre `false`. |
  | `type` | string |  |
  | `folder` | object \| null |  |
  | `folder.id` | string | Id opaco: un texto que empieza con `fdr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `folder.name` | string |  |
  | `audience` | string |  |
  | `total_readed` |  |  |
  | `total_played` |  |  |
  | `link_clicks` | integer |  |
  | `whalink_custom_domain` | string | Dominio propio con el que se acortan los links del mensaje para contar sus clics, o `null` si no tiene. |
  | `shipping_speed` | string |  |
  | `campaign_ids` | array<string \| null> \| null |  |
  | `group_ids` | array<string \| null> \| null |  |
  | `excluded_group_ids` | array<string \| null> \| null |  |
  | `static_audience` | string |  |
  | `campaigns` | array<object> |  |
  | `groups` | array<object> |  |
  | `total_groups` | string |  |
  | `messages` | array<App.Modules.ScheduledMessages.Resources.MessageTemplateResource> |  |
  | `messages[].id` | string | Id opaco: un texto que empieza con `mtp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `messages[].type` | string |  |
  | `messages[].value` | string |  |
  | `messages[].mentioned` | boolean |  |
  | `messages[].metrics` | string |  |
  | `messages[].reactions` | string |  |
  | `messages[].votes` | string |  |
  | `messages[].event_responses` | string | Respuestas a la invitación de un evento, por respuesta, contando una sola vez a cada persona. Las respuestas que nadie eligió no aparecen. |
  | `messages[].shipping_order` | string |  |
  | `messages[].variations` | array<MessageTemplateVariationResource> |  |
  | `total_left_after_send` | string |  |
  | `can_be_edited` | string |  |
  | `recurrence` | object |  |
  | `recurrence.enabled` | boolean |  |
  | `recurrence.frequency` | string |  |
  | `recurrence.interval` | string |  |
  | `recurrence.week_days` | string |  |
  | `recurrence.end_type` | string |  |
  | `recurrence.end_date` | string |  |
  | `recurrence.occurrences` | string |  |
  | `recurrence.current_occurrence` | string |  |
  | `recurrence.only_new_groups` | string |  |
  | `recurrence.only_full_groups` | string |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404` — Not found (`CommunitiesModelNotFoundException`)

### Ver los grupos de un envío

`GET /api/v1/scheduled-messages/{scheduledMessage}/groups` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `scheduledMessage.groups`

**Para qué sirve:** Úsalo para saber a qué grupos va dirigido un envío programado, filtrando por nombre o estado.

**Con API key:** página fija de 3 elementos; se recorre con `page`. Orden: `orderBy` acepta `created_at`, `id`, `name`; dirección `orderByMethod`: `asc` o `desc`. Otro valor responde `422`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `scheduledMessage` | path | string (uuid) | sí | The scheduled message ID |
| `name` | query | string | no |  |
| `orderBy` | query | string | no |  |
| `orderByMethod` | query | string | no |  |
| `perPage` | query | integer | no |  |
| `status` | query | integer | no |  |

**Respuestas**

- `200`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `current_page` | integer |  |
  | `data` | string |  |
  | `first_page_url` | string |  |
  | `from` | integer \| null |  |
  | `last_page` | integer |  |
  | `last_page_url` | string |  |
  | `links` | object |  |
  | `next_page_url` | string |  |
  | `path` | string \| null |  |
  | `per_page` | integer |  |
  | `prev_page_url` | string \| null |  |
  | `to` | integer \| null |  |
  | `total` | integer |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404` — Not found (`CommunitiesModelNotFoundException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Ver cómo salió un envío en cada grupo

`GET /api/v1/scheduled-messages/{scheduledMessage}/group-messages` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `scheduledMessage.groupMessages`

**Para qué sirve:** Sirve para ver el resultado del envío en cada grupo: estado, error, lecturas, reproducciones, reacciones y clics, opcionalmente para una ocurrencia puntual de un envío recurrente.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `perPage` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`). Orden: `orderBy` acepta `group_message_template.id`, `group_message_template.status`, `groups.name`, `group_message_template.created_at`; dirección `orderByMethod`: `asc` o `desc`. Otro valor responde `422`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `scheduledMessage` | path | string (uuid) | sí | The scheduled message ID |
| `name` | query | string | no |  |
| `orderBy` | query | string ∈ {"group_message_template.id", "group_message_template.status", "groups.name", "group_message_template.created_at"} | no |  |
| `orderByMethod` | query | string ∈ {"asc", "desc"} | no |  |
| `perPage` | query | integer | no |  |
| `status` | query | integer | no |  |
| `edit_status` | query | integer ∈ {1, 2, 3, 4} | no | Filtra por el resultado de la última edición del texto ya enviado. Es distinto de `status`, que es el estado de la entrega. \| \| \|---\| \| `1` <br/> El mensaje se había entregado y la edición se aplicó dentro del plazo. \| \| `2` <br/> El mensaje se había entregado, pero ya habían pasado 15 minutos desde el envío a ese grupo. \| \| `3` <br/> El mensaje salió con un número oficial, a un canal o con un número que no permite editar. \| \| `4` <br/> WhatsApp devolvió un error, o el mensaje nunca llegó al grupo. \| |
| `run` | query | string (date) | no | Fecha (`AAAA-MM-DD`, en la zona horaria de la cuenta) de una ocurrencia del envío: devuelve el resultado de cada grupo en esa ocurrencia. Sin este parámetro, devuelve el último resultado de cada grupo. |

**Respuestas**

- `200` — Resultado del envío en cada grupo, paginado.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<object> |  |
  | `data[].template_id` | string | Id opaco: un texto que empieza con `snd_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].group_id` | string | Id opaco: un texto que empieza con `grp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].group_name` | string |  |
  | `data[].campaign_name` | string |  |
  | `data[].audience` | string \| integer ∈ {0} |  |
  | `data[].schedule_message_status` | string |  |
  | `data[].error_info` | string |  |
  | `data[].totaL_readed` |  |  |
  | `data[].total_played` |  |  |
  | `data[].reactions_count` |  |  |
  | `data[].clicks` | string \| integer ∈ {0} |  |
  | `data[].sent_by` | array<string> |  |
  | `data[].attempts` | integer |  |
  | `data[].last_attempt_at` | string |  |
  | `data[].edit_status` | string \| null | Resultado de la última edición del texto enviado a este grupo (`1` editado, `2` fuera de plazo, `3` no se puede editar, `4` falló), o `null` si no se editó. El motivo viene en `edit_reason`. |
  | `data[].edit_reason` | string \| null |  |
  | `links` | object |  |
  | `links.first` | string |  |
  | `links.last` | string |  |
  | `links.prev` | string \| null |  |
  | `links.next` | string |  |
  | `meta` | object |  |
  | `meta.current_page` | integer |  |
  | `meta.from` | integer \| null |  |
  | `meta.last_page` | string |  |
  | `meta.per_page` | integer |  |
  | `meta.to` | integer \| null |  |
  | `meta.total` | string |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404` — Not found (`CommunitiesModelNotFoundException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Ver cuántos leyeron o escucharon un envío

`GET /api/v1/scheduled-messages/{scheduledMessage}/readed-played-rates` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `scheduledMessage.readedAndPlayedRates`

**Para qué sirve:** Úsalo para medir el alcance de un envío: audiencia total, cuántos lo leyeron y cuántos reprodujeron el contenido, en total o por ocurrencia.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `scheduledMessage` | path | string (uuid) | sí | The scheduled message ID |
| `run` | query | string (date) | no |  |

**Respuestas**

- `200`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `audience` | string \| integer \| null |  |
  | `total_readed` | string \| integer \| null |  |
  | `total_played` | string |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404` — Not found (`CommunitiesModelNotFoundException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Ver cada vez que salió un envío recurrente

`GET /api/v1/scheduled-messages/{scheduledMessage}/runs` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `scheduledMessage.runs`

**Para qué sirve:** Sirve para ver cada ocurrencia ya ejecutada de un envío recurrente, con cuántos grupos salieron bien y cuántos con error.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `perPage` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`).

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `scheduledMessage` | path | string (uuid) | sí | The scheduled message ID |
| `perPage` | query | integer | no |  |
| `page` | query | integer | no |  |

**Respuestas**

- `200` — Array of `ScheduledMessageRunsResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `[].run` | string |  |
  | `[].total_groups` | integer |  |
  | `[].count_ok` | integer |  |
  | `[].count_error` | integer |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404` — Not found (`CommunitiesModelNotFoundException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Ver las respuestas a un envío

`GET /api/v1/scheduled-messages/{scheduledMessage}/responses` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `scheduledMessage.responses`

**Para qué sirve:** Sirve para recolectar las respuestas a encuestas o eventos de un envío: quién respondió, en qué grupo, qué eligió y cuándo.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `perPage` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`).

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `scheduledMessage` | path | string (uuid) | sí | The scheduled message ID |
| `page` | query | integer | no | Número de página, desde 1. |
| `perPage` | query | integer | no |  |
| `type` | query | string ∈ {"poll", "event"} | no |  |

**Respuestas**

- `200` — Array of `MessageResponseResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<MessageResponseResource> |  |
  | `data[].message_template_id` | string | Id opaco: un texto que empieza con `mtp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].block_type` | string |  |
  | `data[].group_name` | string |  |
  | `data[].responder_name` | string |  |
  | `data[].identity` | string |  |
  | `data[].identity_type` | string |  |
  | `data[].response` | string |  |
  | `data[].response_label` | string |  |
  | `data[].responded_at` | string \| null |  |
  | `meta` | object |  |
  | `meta.total` | string |  |
  | `meta.per_page` | integer |  |
  | `meta.current_page` | integer |  |
  | `meta.last_page` | integer |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404` — Not found (`CommunitiesModelNotFoundException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Ver las etiquetas que pone un envío a quien responde

`GET /api/v1/scheduled-messages/{scheduledMessage}/response-tags` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `scheduledMessage.responseTags`

**Para qué sirve:** Úsalo para ver, por cada encuesta o evento del envío, qué etiquetas se aplican a quien responde según la opción elegida y cuántas respuestas quedaron sin etiquetar.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `scheduledMessage` | path | string (uuid) | sí | The scheduled message ID |

**Respuestas**

- `200`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<object> |  |
  | `data[].message_template_id` | string | Id opaco: un texto que empieza con `mtp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].block_type` | string |  |
  | `data[].options` | array<object> |  |
  | `data[].responses_total` | string |  |
  | `data[].untagged_total` | string |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404` — Not found (`CommunitiesModelNotFoundException`)

### Ver las carpetas de envíos

`GET /api/v1/scheduled-messages/folders` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `scheduledMessageFolder.index`

**Para qué sirve:** Úsalo para obtener las carpetas en las que se organizan los envíos programados y filtrar el listado por carpeta.

**Respuestas**

- `200` — Array of `ScheduledMessageFolderResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<ScheduledMessageFolderResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `fdr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].name` | string |  |
  | `data[].scheduled_messages_count` | integer |  |
  | `meta` | object |  |
  | `meta.all_count` | integer |  |
  | `meta.unclassified_count` | integer |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
