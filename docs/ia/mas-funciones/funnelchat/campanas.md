# Campañas de grupos — API de Funnelchat: contexto para tu IA

> Copiado de /docs/mas-funciones/funnelchat/#campanas. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Campañas de grupos: solo lectura

- Las trece llamadas leen y piden **Grupos y campañas → Ver**. Por la API no se crea, cambia, activa ni pausa una
  campaña, un pipeline ni un plan, ni se suma un grupo a una campaña: si la persona lo pide, díselo.
- **`{campaign}` es el `id` (`cmp_…`) de la campaña** en «Ver tus campañas», no su `uuid`. Los eventos traen
  `campaign.uuid`: para relacionar un evento con una campaña, compáralo con el `uuid` de la lista.
- **Listas por páginas:** casi todas traen `data`, `links` y `meta`, con `perPage` de 1 a 100 (25 si no lo mandas);
  pide la URL de `links.next` tal cual, hasta que sea `null`. Excepciones: los pipelines y los planes usan `page` y
  `per_page` (con guion bajo) y traen solo `meta`: pide `page` 1, 2, … hasta `meta.last_page`; «Ver los grupos que
  puedes sumar a una campaña» usa `page` y `pageSize`; «Ver las acciones de una campaña» viene de a 15 (fijo), con
  `page`.
- **Tus campañas:** `GET /api/v1/campaigns`, con `name`; orden `orderBy` (`created_at`, `id`, `name`, `updated_at`) y
  `orderByMethod`. No mandes `sortBy`: con un valor que no acepta, responde `400 INVALID_SORT`. Cada una trae `id`,
  `uuid`, `name`, `type`, `is_active`, `groups`, `total_clicks`, `total_in` y `deviceId` (`null` si el número no es
  del workspace de la clave), entre otros; `api_open_groups` y `api_policy` solo en las de tipo Grupo API.
- **Una campaña:** `GET /api/v1/campaigns/{campaign}`: su configuración (`redirect_url`, `traffic_distribution_type`,
  `clicks_limit`, `participants_limit`, `auto_create_groups`, `group_creation_suspended`, `members_can_send_messages`,
  `moderation`…) y totales (`total_participants`, `total_in_counter`, `total_out_counter`). Con una clave, los totales
  cuentan solo los grupos del workspace de la clave. `404` si no es de la cuenta.
- **La tasa de lectura** de una campaña o de un grupo es solo del panel de Funnelchat: con una clave no viene, ni en
  las campañas ni en sus grupos. Si la persona la pide, díselo; no la calcules por tu cuenta.
- **Sus condiciones:** `GET /api/v1/campaigns/{campaign}/conditionals`: una lista con `type`, `conditions`,
  `action_type`, `redirect_url`, `redirect_group_id`, `redirect_group_name`, `is_active` y `order`. La especificación no
  describe sus valores: muéstralos como llegan, sin interpretarlos.
- **Sus grupos:** `GET /api/v1/campaigns/{campaign}/groups`, con `name`, `deviceId`, `status`, `origin` (`0` o `1`),
  `adminConnection` (`1`, `2` o `3`) y `adminPhone` (la especificación no dice qué es cada valor). Cada grupo trae lo
  mismo que en «Ver los grupos de tu cuenta», con su `uid` para las acciones de grupo.
- **Los grupos que se le pueden sumar:** `GET /api/v1/campaigns/{campaign}/available-groups`, con `device_id` y `type`
  (`groups`, `ad-groups` o `channels`), los dos obligatorios. Cada uno trae `uid`, `name`, `description`, `status` y
  `campaign_id`.
- **Entradas y salidas de toda la campaña:** `GET /api/v1/campaigns/{campaign}/participant-events`, con los mismos
  filtros y campos que las de un grupo (ver «Grupos y sus acciones»).
- **Pipelines:** `GET /api/v1/campaigns/{campaign}/pipelines`, con `status` (`scheduled`, `running`, `completed`,
  `failed` o `cancelled`) y `action_type`. Cada uno trae `id`, `pipeline_id`, `name` y `summary` (`total_actions`,
  `status_counts` por estado, `progress_percentage`). **`{pipeline}` es su `id` (`pip_…`), no su `pipeline_id`:**
  `GET /api/v1/campaigns/{campaign}/pipelines/{pipeline}` suma `scheduled_at`, `completed_at` y `actions` (la
  especificación no describe cada acción).
- **Planes de operación:** `GET /api/v1/campaigns/{campaign}/operation-plans/config` (los valores por defecto y los
  límites: `default_daily_cap`, `daily_cap_max`, `min_spacing_minutes`, `default_window_start`, `default_window_end`,
  `weekends_enabled`…), la lista `GET /api/v1/campaigns/{campaign}/operation-plans` y uno,
  `GET /api/v1/campaigns/{campaign}/operation-plans/{plan}`, con `{plan}` su `id`. Su `status` es `scheduled` (recién
  confirmado), `in_progress`, `completed`, `partially_failed` o `cancelled`.
- **Las acciones de una campaña:** `GET /api/v1/campaigns/{campaign}/actions`: cada una con `action`, `field`,
  `old_value`, `new_value`, `status` (un número), `tries`, `completed_at` y `subActions`. De `status`, la especificación
  describe solo `11` (se pidió hacer administradora a la persona y falta la confirmación de WhatsApp) y `12` (una
  acción de un plan que no se ejecutó a propósito; es definitivo y reintentar no la ejecuta). En qué grupos se aplicó
  una: `GET /api/v1/campaigns/{campaign}/actions/{action}/groups`, con `{action}` su `id`; filtra por `name`.
- **Eventos** (webhook con `POST /api/v1/webhooks`; la clave necesita **Avisos (webhooks) → Administrar** y
  **Grupos y campañas → Ver**): `campaign.status_changed` (una campaña se activó o se pausó: `from` y `to`),
  `campaign.no_groups_available` (no tiene grupos a los que mandar a quien entra por su link: `reason`) y
  `pipeline.finished` (terminó un pipeline: `outcome`, `actions` con `total`, `succeeded`, `failed`, `skipped` y
  `cancelled`, e `idempotency_key`, que siempre viene y es `null` si el pipeline se armó desde el panel). La especificación no dice si `pipeline.uuid` es el `pipeline_id` de
  la lista: compáralo antes de depender de eso.

## Llamadas

### Ver tus campañas

`GET /api/v1/campaigns` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `campaign.index`

**Para qué sirve:** Úsalo para listar las campañas de grupos de WhatsApp de tu cuenta, con búsqueda por nombre, y obtener sus IDs para consultar grupos, participantes o estadísticas.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `perPage` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`). Orden: `orderBy` acepta `created_at`, `id`, `name`, `updated_at`; dirección `orderByMethod`: `asc` o `desc`. Otro valor responde `422`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `name` | query | string | no |  |
| `orderBy` | query | string ∈ {"created_at", "id", "name", "type", "updated_at"} | no |  |
| `orderByMethod` | query | string | no |  |
| `perPage` | query | integer | no |  |
| `sortBy` | query | string | no |  |

**Respuestas**

- `200` — Paginated set of `CampaignsResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<CampaignsResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `cmp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].uuid` | string |  |
  | `data[].name` | string |  |
  | `data[].custom_domain` | string | Dominio propio de la campaña para su link público, o `null` si usa el dominio por defecto. |
  | `data[].photo` | string \| string ∈ {""} |  |
  | `data[].deviceId` | string \| null | Id del número de la campaña, o `null` si no tiene o si el número no es del workspace de la clave. Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].userId` | string \| null | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].type` | string |  |
  | `data[].is_active` | string | Si la campaña está activa. |
  | `data[].groups` | string | Cantidad de grupos de la campaña. Con una clave, solo los del workspace de la clave. |
  | `data[].total_clicks` | string |  |
  | `data[].total_in` | string |  |
  | `data[].total_in_counter` | integer | Entradas a los grupos de la campaña, según el contador de entradas de cada grupo. |
  | `data[].admins` | string |  |
  | `data[].group_admins` | string |  |
  | `data[].disconnected_groups` | string |  |
  | `data[].connection_error_groups` | string |  |
  | `data[].running_actions_count` | string |  |
  | `data[].pending_actions_count` | string |  |
  | `data[].pending_sync_groups` | string |  |
  | `data[].group_creation_suspended` | boolean | En el listado es siempre `false`: el estado de la creación de grupos viene en el detalle de la campaña. |
  | `data[].suspended_creator_phones` | array<string> |  |
  | `data[].group_creation_has_available_creator` | boolean |  |
  | `data[].api_open_groups` | integer | Cantidad de grupos de la campaña. Solo viene en las campañas de tipo Grupo API, igual que `api_policy`; en los demás tipos las dos claves no aparecen. |
  | `data[].api_policy` | object |  |
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

- `400` — `sortBy` o `sortDir` traen un valor que no se acepta.
- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Ver una campaña

`GET /api/v1/campaigns/{campaign}` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `campaign.show`

**Para qué sirve:** Sirve para ver la configuración completa de una campaña: sus grupos, administradores, link de redirección, distribución del tráfico, píxel y grupos desconectados o con error.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `campaign` | path | string | sí | The campaign ID |

**Respuestas**

- `200` — `CampaignResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string | Id opaco: un texto que empieza con `cmp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `uuid` | string |  |
  | `name` | string |  |
  | `slug` | string |  |
  | `photo` | string \| string ∈ {""} |  |
  | `description` | string \| string ∈ {""} |  |
  | `pixel` | string |  |
  | `admins` | string |  |
  | `group_admins` | string |  |
  | `disconnected_groups` | string |  |
  | `connection_error_groups` | string |  |
  | `deviceId` | string \| null | Id del número de la campaña, o `null` si no tiene o si el número no es del workspace de la clave. Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `userId` | string \| null | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `type` | string |  |
  | `groups` | string |  |
  | `is_active` | string |  |
  | `redirect_url` | string |  |
  | `traffic_distribution_type` | string \| null |  |
  | `fill_groups_enabled` | string |  |
  | `group_numbering_position` | string \| null |  |
  | `anti_bot_verification_enabled` | string |  |
  | `custom_domain` | string |  |
  | `captcha_enabled` | string |  |
  | `virtual_queue_enabled` | boolean |  |
  | `virtual_queue_rate_per_minute` | integer |  |
  | `group_name_variations` | string |  |
  | `moderation` | object |  |
  | `moderation.type` | string |  |
  | `moderation.insults_and_profanity` | string |  |
  | `moderation.negative_comments` | string |  |
  | `moderation.repetitive_spam` | string |  |
  | `moderation.external_links` | string |  |
  | `moderation.promotions_and_sales` | string |  |
  | `moderation.off_topic` | string |  |
  | `members_can_send_messages` | string |  |
  | `clicks_limit` | string |  |
  | `participants_limit` | string |  |
  | `backup_groups_count` | string \| integer ∈ {0} |  |
  | `admins_per_group` | string |  |
  | `input_tag` | string |  |
  | `output_tag` | string |  |
  | `send_always_same_group` | string |  |
  | `total_participants` | string | Participantes de los grupos de la campaña. Con una clave, solo los de los grupos del workspace de la clave. |
  | `total_clicks` | string |  |
  | `total_in` | string |  |
  | `total_out` | string |  |
  | `total_in_counter` | integer | Entradas a los grupos de la campaña, según el contador de entradas de cada grupo. |
  | `total_out_counter` | integer | Salidas de los grupos de la campaña, según el contador de salidas de cada grupo. |
  | `auto_create_groups` | boolean |  |
  | `group_creation_suspended` | string \| boolean |  |
  | `suspended_creator_phones` | string \| array<string> |  |
  | `group_creation_has_available_creator` | string \| boolean |  |
  | `api_policy` | object | Qué es la campaña de grupos API: quién crea los grupos, quiénes se suman y con qué plantilla de invitación. Solo viene en las campañas de tipo Grupo API; en los demás tipos la clave no aparece. |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404` — Not found (`CommunitiesModelNotFoundException`)

### Ver las condiciones de una campaña

`GET /api/v1/campaigns/{campaign}/conditionals` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `campaignConditional.index`

**Para qué sirve:** Úsalo para conocer las reglas condicionales de una campaña: qué condiciones evalúa y a qué URL o grupo redirige cuando se cumplen.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `campaign` | path | string | sí | The campaign ID |

**Respuestas**

- `200` — Array of `CampaignConditionalResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `[].id` | string | Id opaco: un texto que empieza con `cnd_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `[].type` | string |  |
  | `[].conditions` | string |  |
  | `[].action_type` | string |  |
  | `[].redirect_url` | string |  |
  | `[].redirect_group_id` | string \| null | Id opaco: un texto que empieza con `grp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `[].redirect_group_name` | string \| null |  |
  | `[].is_group_exclusive` | string |  |
  | `[].is_active` | string |  |
  | `[].order` | string |  |
  | `[].created_at` | string |  |
  | `[].updated_at` | string |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404` — Not found (`CommunitiesModelNotFoundException`)

### Ver los grupos de una campaña

`GET /api/v1/campaigns/{campaign}/groups` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `campaign.groups`

**Para qué sirve:** Úsalo para listar los grupos de una campaña con su estado, origen y conexión del administrador, por ejemplo para detectar grupos llenos o desconectados.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `perPage` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`). Orden: `orderBy` acepta `id`, `name`, `created_at`, `updated_at`; dirección `orderByMethod`: `asc` o `desc`. Otro valor responde `422`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `campaign` | path | string | sí | The campaign ID |
| `name` | query | string | no |  |
| `orderBy` | query | string | no |  |
| `orderByMethod` | query | string | no |  |
| `perPage` | query | integer | no |  |
| `deviceId` | query | string | no |  |
| `status` | query | integer | no |  |
| `origin` | query | integer ∈ {"0", "1"} | no |  |
| `adminConnection` | query | integer ∈ {"1", "2", "3"} | no |  |
| `adminPhone` | query | string | no |  |

**Respuestas**

- `200` — Paginated set of `GroupResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<GroupResource> |  |
  | `data[].id` | string \| null | `orNull`: a resource of an unsaved group (an event, a test) has no id, and keeps its `null`. Id opaco: un texto que empieza con `grp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].admins_numbers` | string |  |
  | `data[].admins` | array<any> |  |
  | `data[].admins_count` | string |  |
  | `data[].owner` | string |  |
  | `data[].owner_display_phone` | string |  |
  | `data[].owner_connected` | boolean |  |
  | `data[].clicks` | string |  |
  | `data[].communityUid` | string |  |
  | `data[].newsletterUid` | string |  |
  | `data[].description` | string \| string ∈ {""} |  |
  | `data[].deviceId` | string \| null | Id del número del grupo, o `null` si no tiene o si el número no es del workspace de la clave. Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].image` | string |  |
  | `data[].isFull` | string \| boolean |  |
  | `data[].isApi` | boolean |  |
  | `data[].link` | string \| string ∈ {""} |  |
  | `data[].campaign_link` | string \| string ∈ {""} |  |
  | `data[].campaign_custom_domain` | string \| null | Dominio propio de la campaña del grupo para su link público, o `null` si no tiene. |
  | `data[].name` | string |  |
  | `data[].order` | string |  |
  | `data[].participants_numbers` | string |  |
  | `data[].participants_count` | string |  |
  | `data[].status` | string |  |
  | `data[].uid` | string |  |
  | `data[].updatedAt` | string |  |
  | `data[].createdAt` | string |  |
  | `data[].scheduled_message_count` | string \| integer ∈ {0} |  |
  | `data[].type` | string |  |
  | `data[].manual_import` | boolean |  |
  | `data[].participantMode` | boolean | Participant mode (additive): true iff the group is marked. False when the column is absent from the row (e.g. an explicit `select`). |
  | `data[].ownNumbers` | string \| null | The user's own connected numbers in the group (additive). `null` means "not computed on this path / not applicable" (show, broadcast events, channels, groups without a resolved connection). |
  | `data[].adminOnlyMessage` | boolean \| null | Stored write permission (additive): true = only admins can send, false = anyone can, null = never observed (or the column is absent from the row). Informational: sending decisions also need the cached confirmation. |
  | `data[].origin` | integer ∈ {1, 0} |  |
  | `data[].lastSyncAt` | string \| null |  |
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
- `404` — Not found (`CommunitiesModelNotFoundException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Ver los grupos que puedes sumar a una campaña

`GET /api/v1/campaigns/{campaign}/available-groups` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `campaign.availableGroups`

**Para qué sirve:** Sirve para ver qué grupos, grupos de anuncios o canales de tu cuenta se pueden sumar a una campaña, filtrando por número o por nombre.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `pageSize` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`).

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `campaign` | path | string | sí | The campaign ID |
| `device_id` | query | string | sí |  |
| `type` | query | string ∈ {"groups", "ad-groups", "channels"} | sí |  |
| `page` | query | integer | no |  |
| `pageSize` | query | integer | no |  |
| `name` | query | string \| null | no |  |

**Respuestas**

- `200` — Array of `AvailableGroupResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<AvailableGroupResource> |  |
  | `data[].uid` | string \| string ∈ {""} |  |
  | `data[].name` | string \| string ∈ {""} |  |
  | `data[].description` | string \| string ∈ {""} |  |
  | `data[].status` | string \| string ∈ {"available"} |  |
  | `data[].campaign_id` | string \| null | Id opaco: un texto que empieza con `cmp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `meta` | string |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404` — Not found (`CommunitiesModelNotFoundException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Ver quién entró y salió de una campaña

`GET /api/v1/campaigns/{campaign}/participant-events` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `campaign.participantEvents`

**Para qué sirve:** Sirve para obtener el registro de entradas y salidas de toda una campaña, con fecha, grupo y país, filtrando por tipo de evento, fechas o grupos.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `perPage` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`).

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `campaign` | path | string | sí | The campaign ID |
| `search` | query | string \| null | no |  |
| `event_type` | query | string \| null ∈ {"all", "join", "leave", null} | no |  |
| `page` | query | integer \| null | no |  |
| `perPage` | query | integer \| null | no |  |
| `start_date` | query | string (date-time) \| null | no |  |
| `end_date` | query | string (date-time) \| null | no |  |
| `timezone` | query | string \| null | no |  |
| `date_mode` | query | string \| null ∈ {"both", "joins_only", "leaves_only", null} | no |  |
| `selection_type` | query | string \| null ∈ {"all", "none", null} | no |  |
| `groups_uids[]` | query | array<string> | no |  |
| `participant_filter` | query | string \| null ∈ {"all", "active", null} | no |  |

**Respuestas**

- `200` — Paginated set of `ParticipantEventResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<ParticipantEventResource> |  |
  | `data[].phone` | string |  |
  | `data[].whatsapp_id` | string |  |
  | `data[].event_type` | string ∈ {"join", "leave"} |  |
  | `data[].event_at` | string \| null |  |
  | `data[].group_id` | string | Id opaco: un texto que empieza con `grp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].group_name` | string |  |
  | `data[].country_code` | string |  |
  | `data[].country_name` | string |  |
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
- `404` — Not found (`CommunitiesModelNotFoundException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Ver los pipelines de una campaña

`GET /api/v1/campaigns/{campaign}/pipelines` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `campaign.indexPipelines`

**Para qué sirve:** Sirve para seguir los pipelines de operaciones sobre los grupos de una campaña, con cuántas acciones hay en cada estado y su avance, filtrando por estado o tipo de acción.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `per_page` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`). Orden: `orderBy` acepta `id`, `name`, `group_index`, `created_at`, `updated_at`; dirección `orderByMethod`: `asc` o `desc`. Otro valor responde `422`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `campaign` | path | string | sí | The campaign ID |
| `page` | query | integer | no |  |
| `per_page` | query | integer | no |  |
| `status` | query | string ∈ {"scheduled", "running", "completed", "failed", "cancelled"} | no |  |
| `action_type` | query | string ∈ {"add", "new", "name", "description", "photo", "participants", "remove-participants", "administrators", "remove-administrators", "join_group", "members_can_send_messages", "remove_group"} | no |  |
| `orderBy` | query | string ∈ {"id", "name", "group_index", "created_at", "updated_at"} | no |  |
| `orderByMethod` | query | string ∈ {"asc", "desc"} | no |  |

**Respuestas**

- `200`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `campaign` | object |  |
  | `campaign.id` | string | Id opaco: un texto que empieza con `cmp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `campaign.name` | string |  |
  | `data` | array<object> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `pip_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].pipeline_id` | string |  |
  | `data[].name` | string \| null |  |
  | `data[].group_index` | integer \| null |  |
  | `data[].created_at` | string \| null |  |
  | `data[].summary` | object |  |
  | `meta` | object |  |
  | `meta.current_page` | integer |  |
  | `meta.last_page` | integer |  |
  | `meta.per_page` | integer |  |
  | `meta.total` | integer |  |
  | `meta.from` | integer \| null |  |
  | `meta.to` | integer \| null |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404` — Not found (`CommunitiesModelNotFoundException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Ver un pipeline

`GET /api/v1/campaigns/{campaign}/pipelines/{pipeline}` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `campaign.showPipeline`

**Para qué sirve:** Úsalo para ver el avance de una operación masiva: cuántas acciones están programadas, en curso, completadas o fallidas, y el porcentaje de progreso.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `campaign` | path | string | sí | The campaign ID |
| `pipeline` | path | string | sí | The pipeline ID |

**Respuestas**

- `200`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `pipeline_id` | string |  |
  | `id` | string | Id opaco: un texto que empieza con `pip_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `campaign` | object |  |
  | `campaign.id` | string | Id opaco: un texto que empieza con `cmp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `campaign.name` | string |  |
  | `summary` | object |  |
  | `summary.name` | string \| null |  |
  | `summary.total_actions` | integer |  |
  | `summary.total_action_groups` | string |  |
  | `summary.status_counts` | object |  |
  | `summary.progress_percentage` | number |  |
  | `summary.created_at` | string \| null |  |
  | `summary.scheduled_at` | string \| null |  |
  | `summary.completed_at` | string \| null |  |
  | `actions` | array<string> |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404` — Not found (`CommunitiesModelNotFoundException`)

### Ver qué se puede configurar en un plan de operación

`GET /api/v1/campaigns/{campaign}/operation-plans/config` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `operationPlan.config`

**Para qué sirve:** Sirve para conocer los límites con los que se programan los planes de operación de una campaña: tope diario, espaciado mínimo, franja horaria y si se permiten fines de semana.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `campaign` | path | string | sí | The campaign ID |

**Respuestas**

- `200` — Valores por defecto y límites para armar un plan de operación en la campaña.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `nudge_group_threshold` | integer |  |
  | `default_daily_cap` | integer |  |
  | `min_spacing_minutes` | integer |  |
  | `confirmation_spacing_minutes` | integer |  |
  | `default_window_start` | string |  |
  | `default_window_end` | string |  |
  | `daily_cap_max` | integer |  |
  | `weekends_enabled` | boolean | Si un plan puede incluir sábados y domingos. |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404` — Not found (`CommunitiesModelNotFoundException`)

### Ver los planes de operación de una campaña

`GET /api/v1/campaigns/{campaign}/operation-plans` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `operationPlan.index`

**Para qué sirve:** Úsalo para listar los planes de operación programados de una campaña, con su estado, rango de fechas, tope diario y cantidad de operaciones.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `per_page` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`).

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `campaign` | path | string | sí | The campaign ID |
| `page` | query | integer | no |  |
| `per_page` | query | integer | no |  |

**Respuestas**

- `200`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `campaign` | object |  |
  | `campaign.id` | string | Id opaco: un texto que empieza con `cmp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `campaign.name` | string |  |
  | `data` | array<OperationPlanSummaryResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `opl_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].uuid` | string |  |
  | `data[].campaign_id` | string \| null | Id opaco: un texto que empieza con `cmp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].pipeline_uuid` | string |  |
  | `data[].status` | string |  |
  | `data[].name` | string |  |
  | `data[].entry_point` | string |  |
  | `data[].timezone` | string |  |
  | `data[].range_start_date` | string \| null |  |
  | `data[].range_end_date` | string \| null |  |
  | `data[].daily_cap` | string |  |
  | `data[].confirmed_at` | string \| null |  |
  | `data[].operation_counts` | object |  |
  | `meta` | object |  |
  | `meta.current_page` | integer |  |
  | `meta.last_page` | integer |  |
  | `meta.per_page` | integer |  |
  | `meta.total` | integer |  |
  | `meta.from` | integer \| null |  |
  | `meta.to` | integer \| null |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404` — Not found (`CommunitiesModelNotFoundException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Ver un plan de operación

`GET /api/v1/campaigns/{campaign}/operation-plans/{plan}` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `operationPlan.show`

**Para qué sirve:** Sirve para ver el detalle de un plan de operación: estado, zona horaria, ventana horaria, rango de fechas, tope diario y espaciado entre operaciones.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `campaign` | path | string | sí | The campaign ID |
| `plan` | path | string | sí | The plan ID |

**Respuestas**

- `200` — `OperationPlanResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string | Id opaco: un texto que empieza con `opl_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `uuid` | string |  |
  | `campaign_id` | string \| null | Id opaco: un texto que empieza con `cmp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `pipeline_uuid` | string \| null |  |
  | `status` | string | Estado del plan según sus acciones en este momento: `scheduled`, `in_progress`, `completed`, `partially_failed` o `cancelled`. Recién confirmado es `scheduled`. |
  | `name` | string |  |
  | `timezone` | string |  |
  | `window_start` | string |  |
  | `window_end` | string |  |
  | `range_start_date` | string |  |
  | `range_end_date` | string |  |
  | `daily_cap` | integer |  |
  | `min_spacing_minutes` | integer |  |
  | `confirmation_spacing_minutes` | integer |  |
  | `entry_point` | string |  |
  | `seed` | integer \| null |  |
  | `idempotency_key` | string \| null |  |
  | `confirmed_at` | string \| null |  |
  | `operations` | array<string> |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404` — Not found (`CommunitiesModelNotFoundException`)

### Ver las acciones de una campaña

`GET /api/v1/campaigns/{campaign}/actions` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `campaign.actions`

**Para qué sirve:** Úsalo para auditar las acciones ejecutadas sobre los grupos de una campaña a través de la sesión de WhatsApp: qué cambió (valor anterior y nuevo), estado, intentos y fechas.

**Con API key:** página fija de 15 elementos; se recorre con `page`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `campaign` | path | string | sí | The campaign ID |

**Respuestas**

- `200` — Paginated set of `ActionResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<ActionResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `act_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].action` | string |  |
  | `data[].old_value` | string |  |
  | `data[].new_value` | string |  |
  | `data[].field` | string |  |
  | `data[].status` | integer ∈ {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12} | \| \| \|---\| \| `0` <br/> \| \| `1` <br/> \| \| `2` <br/> \| \| `3` <br/> \| \| `4` <br/> \| \| `5` <br/> \| \| `6` <br/> \| \| `7` <br/> \| \| `8` <br/> \| \| `9` <br/> \| \| `10` <br/> \| \| `11` <br/> El pedido de hacer administrador a la persona se aceptó, pero todavía no llegó la confirmación de WhatsApp. \| \| `12` <br/> Una acción de un plan de operación que no se ejecutó a propósito: para proteger al creador del grupo, para no dejarlo sin administrador, porque venció la espera de confirmación o porque un paso anterior del mismo grupo no se completó. Es definitivo: reintentar no la vuelve a ejecutar. \| |
  | `data[].tries` | string |  |
  | `data[].process_at` | string \| string ∈ {""} |  |
  | `data[].created_at` | string \| string ∈ {""} |  |
  | `data[].completed_at` | string \| null |  |
  | `data[].stats` | object |  |
  | `data[].groups` | string |  |
  | `data[].subActions` | array<ActionResource> |  |
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
- `404` — Not found (`CommunitiesModelNotFoundException`)

### Ver los grupos de una acción

`GET /api/v1/campaigns/{campaign}/actions/{action}/groups` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `groupManagement.actionGroup`

**Para qué sirve:** Sirve para ver en qué grupos se aplicó una acción y con qué resultado en cada uno, útil para identificar los que fallaron.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `perPage` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`). Orden: `orderBy` acepta `name`, `status`, `created_at`, `updated_at`; dirección `orderByMethod`: `asc` o `desc`. Otro valor responde `422`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `campaign` | path | string | sí | The campaign ID |
| `action` | path | string | sí | The action ID |
| `name` | query | string | no |  |
| `orderBy` | query | string ∈ {"name", "status", "created_at", "updated_at"} | no |  |
| `orderByMethod` | query | string ∈ {"asc", "desc"} | no |  |
| `page` | query | integer | no |  |
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — Paginated set of `ActionGroupResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<object> |  |
  | `data[].id` | string \| null | Id opaco: un texto que empieza con `acg_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].name` | string |  |
  | `data[].status` | string |  |
  | `data[].info` |  |  |
  | `data[].action_name` | string |  |
  | `data[].action_label` | string \| null |  |
  | `data[].executed_at` | string \| null |  |
  | `data[].executed_by` | string \| null |  |
  | `data[].groups` | string \| array<string> |  |
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
- `404` — Not found (`CommunitiesModelNotFoundException`)
- `422` — Validation error (`CommunitiesValidationException`)

## Los eventos

Llegan por webhook. Cómo crear uno, cómo llega cada entrega, los reintentos, el permiso que pide cada evento y cómo verificar la firma (con funciones probadas en Node.js, Python y PHP): https://developers-portal.funnelchat.app/ia/lo-basico.md.

### `campaign.status_changed`

Una campaña se activó o se pausó.

Ejemplo:

```json
{
  "id": "evt_00000000000000000000000000000009",
  "type": "campaign.status_changed",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "campaign": {
      "uuid": "xK9mQz",
      "name": "Campaña de ejemplo"
    },
    "from": "active",
    "to": "paused",
    "workspace_id": 37
  }
}
```

### `campaign.no_groups_available`

Una campaña no tiene grupos a los que dirigir a las personas que entran por su link.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "campaign.no_groups_available",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "campaign": {
      "uuid": "xK9mQz",
      "name": "Campaña de ejemplo"
    },
    "reason": "none_selectable",
    "workspace_id": 37
  }
}
```

### `pipeline.finished`

Terminó un pipeline de operaciones sobre los grupos de una campaña, con su resultado agregado y la clave de idempotencia del pedido que lo originó, cuando la hay; si después cambia el resultado de alguna de sus acciones (por ejemplo, por un reintento), sale otro, con otro `id` y los conteos nuevos.

Ejemplo:

```json
{
  "id": "evt_0000000000000000000000000000000a",
  "type": "pipeline.finished",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "campaign": {
      "uuid": "xK9mQz"
    },
    "pipeline": {
      "uuid": "00000000-0000-4000-8000-00000000000b",
      "name": "Pipeline de ejemplo"
    },
    "outcome": "completed",
    "actions": {
      "total": 5,
      "succeeded": 4,
      "failed": 0,
      "skipped": 1,
      "cancelled": 0
    },
    "idempotency_key": "00000000-0000-4000-8000-00000000000d",
    "workspace_id": 37
  }
}
```

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
