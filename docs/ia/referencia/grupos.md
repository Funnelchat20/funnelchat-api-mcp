# Grupos — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/grupos/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver tus grupos

`GET /api/v1/devices/{device}/groups` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `group.groups`

**Para qué sirve:** Sirve para ver los grupos de un número tal como están en WhatsApp, también los que todavía no importaste a tu cuenta: de acá sale el `uid` para escribirle a un grupo o seguirlo.

**Nota:** La lista se lee de WhatsApp y, para una API key, se reutiliza durante un minuto por número: un grupo recién creado en WhatsApp puede tardar hasta un minuto en aparecer. Si un grupo ya está en el workspace de la llamada, trae `device_id`. Para importar uno: `POST /groups/{group}/import`.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `pageSize` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`).

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí |  |
| `page` | query | integer | no |  |
| `pageSize` | query | integer | no |  |
| `name` | query | string \| null | no |  |

**Respuestas**

- `200` — Array of `GroupMinResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<GroupMinResource> |  |
  | `data[].uid` | string \| string ∈ {""} |  |
  | `data[].name` | string \| string ∈ {""} |  |
  | `data[].description` | string \| string ∈ {""} |  |
  | `data[].device_id` | string | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].alias` | string \| string ∈ {""} |  |
  | `data[].number` | string \| string ∈ {""} |  |
  | `data[].communityUid` | string \| string ∈ {""} |  |
  | `meta` | object |  |
  | `meta.current_page` |  |  |
  | `meta.last_page` |  |  |
  | `meta.per_page` |  |  |
  | `meta.total` | integer |  |

- `400`
- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404`
- `422` — Validation error (`CommunitiesValidationException`)

### Mandar un mensaje a un grupo

`POST /api/v1/groups/{group}/messages` · permiso **Grupos y campañas → Enviar** · área communities · `operationId` `apiGroupAction.sendMessage`

**Para qué sirve:** Úsalo para mandarle a un grupo un texto, o una imagen, un video, un audio o un documento, desde uno de tus números. El pedido se acepta enseguida, queda en cola y el mensaje sale después, al ritmo del número.

**Nota:** Asíncrona: responde 202 con `action_id`; consulta el resultado en `GET /groups/actions/{action}` (`result.message.uid` es el id del mensaje en WhatsApp). `type`: `text`, `image`, `video`, `audio` o `document`. Con un número QR sale al ritmo de los mensajes programados de velocidad Low, que el integrador no puede cambiar. Con un número oficial se verifican, antes de aceptar, la ventana de servicio de 24 horas y la calidad del número. No tiene tope de volumen del plan. Si el grupo todavía no está en la cuenta y el número es QR, primero se importa como en `POST /groups/{group}/import` (pide además **Grupos y campañas → Administrar grupos**, `403 import_permission_required` sin él) y el envío sigue con las mismas reglas: si el número no es administrador del grupo no se importa nada y responde `422 device_not_group_admin`. Esa importación cuenta en el tope de 5 por minuto del número.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `type` | string ∈ {"text", "image", "video", "audio", "document"} | sí |  |
| `text` | string | no |  |
| `media_url` | string | no |  |
| `caption` | string | no |  |
| `file_name` | string | no |  |

**Respuestas**

- `202` — `ApiGroupActionAcceptedResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `action_id` | string |  |
  | `status` | "queued" |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Seguir un grupo

`POST /api/v1/groups/{group}/import` · permiso **Grupos y campañas → Administrar grupos** · área communities · `operationId` `v2.apiGroupImport`

**Para qué sirve:** Úsalo para seguir un grupo de tu número sin escribirle: lo importa a tu cuenta y desde entonces te enteras de quién entra y quién sale. Si ya estaba en tu cuenta, no lo importa de nuevo.

**Nota:** Importa al workspace de la API key un grupo del número indicado en `device_id`, igual que importarlo desde el panel: queda visible en el panel, se sincronizan sus participantes y desde entonces genera los eventos `group_participant.joined` y `group_participant.left`. Los datos del grupo y si el número es administrador se leen de WhatsApp en la misma llamada. Responde `201` si lo importó y `200` si ya estaba en el workspace, con `is_admin`. Solo números QR: con un número oficial responde `422 provider_unsupported`. Si el grupo no es del número responde `404 group_not_found`. Cada número importa hasta 5 grupos por minuto (`429 import_rate_limited`, con `retry_after` en segundos). Dos pedidos a la vez por el mismo grupo en el mismo workspace lo importan una sola vez. Si el grupo ya está en otro workspace de la cuenta: cuando cada workspace de la cuenta tiene sus propios grupos, se importa la copia de este workspace sin tocar la del otro; si no, el grupo es uno solo para toda la cuenta y responde `404 group_not_found`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí | Identificador del grupo en WhatsApp, como lo lista `GET /v1/devices/{device}/groups`. |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |

**Respuestas**

- `200` — El grupo ya estaba en el workspace: no se importó de nuevo.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | ApiGroupImportResource |  |
  | `data.uid` | string | Identificador del grupo en WhatsApp. |
  | `data.name` | string \| null | Nombre del grupo. |
  | `data.imported` | boolean | `true` si esta llamada lo importó; `false` si ya estaba en el workspace. |
  | `data.is_admin` | boolean | Si el número indicado es administrador del grupo, según WhatsApp. Sin serlo no puede enviarle mensajes ni hacer acciones de grupo. |

- `201` — El grupo se importó en esta llamada.

  La misma tabla que en «Seguir un grupo», más arriba en este texto.

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Ver los grupos de tu cuenta

`GET /api/v1/groups` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `group.index`

**Para qué sirve:** Úsalo para listar los grupos de tu cuenta con filtros por tipo, estado, número o sin campaña asignada, por ejemplo para sincronizarlos con tu sistema.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `perPage` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`). Orden: `orderBy` acepta `created_at`, `id`, `name`, `updated_at`; dirección `orderByMethod`: `asc` o `desc`. Otro valor responde `422`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `name` | query | string | no |  |
| `orderBy` | query | string | no |  |
| `orderByMethod` | query | string | no |  |
| `type` | query | string ∈ {"1", "2", "3", "4"} | no |  |
| `perPage` | query | integer | no |  |
| `status` | query | string ∈ {"0", "1", "2", "3", "4", "5", "6", "7", "8"} | no |  |
| `deviceId` | query | string | no |  |
| `noCampaign` | query | boolean | no |  |

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
  | `meta.cloud_api_groups_enabled` | string \| boolean |  |
  | `meta.device_groups_sync_enabled` | boolean |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Ver un grupo

`GET /api/v1/groups/{group}` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `group.show`

**Para qué sirve:** Sirve para ver el detalle de un grupo: administradores, si el dueño está conectado, clics, link de invitación y de campaña, y si está lleno.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí | The group uid |

**Respuestas**

- `200` — `GroupResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string \| null | `orNull`: a resource of an unsaved group (an event, a test) has no id, and keeps its `null`. Id opaco: un texto que empieza con `grp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `admins_numbers` | string |  |
  | `admins` | array<any> |  |
  | `admins_count` | string |  |
  | `owner` | string |  |
  | `owner_display_phone` | string |  |
  | `owner_connected` | boolean |  |
  | `clicks` | string |  |
  | `communityUid` | string |  |
  | `newsletterUid` | string |  |
  | `description` | string \| string ∈ {""} |  |
  | `deviceId` | string \| null | Id del número del grupo, o `null` si no tiene o si el número no es del workspace de la clave. Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `image` | string |  |
  | `isFull` | string \| boolean |  |
  | `isApi` | boolean |  |
  | `link` | string \| string ∈ {""} |  |
  | `campaign_link` | string \| string ∈ {""} |  |
  | `campaign_custom_domain` | string \| null | Dominio propio de la campaña del grupo para su link público, o `null` si no tiene. |
  | `name` | string |  |
  | `order` | string |  |
  | `participants_numbers` | string |  |
  | `participants_count` | string |  |
  | `status` | string |  |
  | `uid` | string |  |
  | `updatedAt` | string |  |
  | `createdAt` | string |  |
  | `scheduled_message_count` | string \| integer ∈ {0} |  |
  | `type` | string |  |
  | `manual_import` | boolean |  |
  | `participantMode` | boolean | Participant mode (additive): true iff the group is marked. False when the column is absent from the row (e.g. an explicit `select`). |
  | `ownNumbers` | string \| null | The user's own connected numbers in the group (additive). `null` means "not computed on this path / not applicable" (show, broadcast events, channels, groups without a resolved connection). |
  | `adminOnlyMessage` | boolean \| null | Stored write permission (additive): true = only admins can send, false = anyone can, null = never observed (or the column is absent from the row). Informational: sending decisions also need the cached confirmation. |
  | `origin` | integer ∈ {1, 0} |  |
  | `lastSyncAt` | string \| null |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404` — Not found (`CommunitiesModelNotFoundException`)

### Ver los datos de un grupo en WhatsApp

`GET /api/v1/groups/{groupUid}/metadata` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `groupMetadata.show`

**Para qué sirve:** Úsalo para leer en vivo desde WhatsApp el nombre, la foto, la descripción, el link y los administradores actuales de un grupo o canal, por ejemplo para verificar que coincidan con lo esperado.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `groupUid` | path | string | sí | Identificador del grupo o del canal en WhatsApp. |
| `device_id` | query | string | sí |  |
| `group_uid` | query | string | sí |  |
| `type` | query | string ∈ {"groups", "ad-groups", "channels"} | no |  |

**Respuestas**

- `200` — `GroupMetadataResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `name` | string \| string ∈ {""} |  |
  | `description` | string \| null |  |
  | `image` | string \| null |  |
  | `link` | string \| null |  |
  | `admins_numbers` | array<string> |  |
  | `participants_numbers` | array<string> |  |
  | `verified_admin` | boolean |  |
  | `membership` | string |  |
  | `subscribers_count` | integer |  |
  | `participants` | array<any> |  |
  | `owner` | string \| null |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404` — El grupo o el canal no existe, o el número no tiene acceso a él.
- `422` — Validation error (`CommunitiesValidationException`)
- `502` — No se pudo consultar a WhatsApp. Reintenta más tarde.

### Ver los envíos programados de un grupo

`GET /api/v1/groups/{group}/scheduled-messages` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `group.scheduledMessages`

**Para qué sirve:** Úsalo para saber qué envíos programados incluyen a un grupo, por ejemplo antes de hacerle cambios.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `perPage` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`). Orden: `orderBy` acepta `send_at`, `name`, `status`, `id`, `created_at`, `updated_at`; dirección `orderByMethod`: `asc` o `desc`. Otro valor responde `422`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí | The group uid |
| `name` | query | string | no |  |
| `orderBy` | query | string ∈ {"send_at", "name", "status", "id", "created_at", "updated_at"} | no |  |
| `orderByMethod` | query | string ∈ {"ASC", "DESC"} | no |  |
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — Paginated set of `ScheduledMessageResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<ScheduledMessageResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `smg_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].uuid` | string | Identificador estable del envío: es el `scheduled_message.uuid` de los eventos `scheduled_message.*`. `null` solo en un envío creado antes del 30-09-2026 que todavía no generó ningún evento: se completa con el primero. |
  | `data[].name` | string |  |
  | `data[].send_at` | string |  |
  | `data[].status` | string |  |
  | `data[].type` | string |  |
  | `data[].audience` | string |  |
  | `data[].total_readed` | string |  |
  | `data[].total_played` | string |  |
  | `data[].campaigns` | array<object> |  |
  | `data[].groups` | array<object> |  |
  | `data[].total_groups` | string |  |
  | `data[].messages` | array<MessageTemplateResource> |  |
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

### Ver los participantes de un grupo

`GET /api/v1/groups/participants` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `group.participants`

**Para qué sirve:** Úsalo para listar los participantes de un grupo, filtrando por teléfono, si son administradores o si se los puede promover a administrador.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `perPage` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`). Orden: `orderBy` acepta `created_at`, `id`, `updated_at`; dirección `orderDirection`: `asc` o `desc`. Otro valor responde `422`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `groupUid` | query | string | sí |  |
| `phone` | query | string | no |  |
| `isAdmin` | query | string ∈ {"true", "false", "1", "0"} | no |  |
| `eligibleForAdmin` | query | string ∈ {"true", "false", "1", "0"} | no |  |
| `orderBy` | query | string | no |  |
| `orderDirection` | query | string ∈ {"asc", "desc"} | no |  |
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — Paginated set of `ParticipantResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<ParticipantResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `prt_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].phone` | string |  |
  | `data[].action` | string |  |
  | `data[].isAdmin` | string |  |
  | `data[].created_at` | string \| string ∈ {""} |  |
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

### Ver quién entró y salió de un grupo

`GET /api/v1/groups/{group}/participant-events` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `group.participantEvents`

**Para qué sirve:** Sirve para ver quién entró y salió de un grupo puntual y cuándo, con país y filtros por fecha o tipo de evento.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `perPage` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`).

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí | The group uid |
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

### Ver los canales de un número

`GET /api/v1/devices/{device}/channels` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `group.channels`

**Para qué sirve:** Sirve para ver los canales de WhatsApp de un número sin pasar por una campaña, con sus identificadores.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `pageSize` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`).

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí |  |
| `name` | query | string \| null | no |  |
| `page` | query | integer | no |  |
| `pageSize` | query | integer | no |  |

**Respuestas**

- `200` — Array of `ChannelMinResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<ChannelMinResource> |  |
  | `data[].id` | string \| null |  |
  | `data[].uid` | string \| null |  |
  | `data[].name` | string \| string ∈ {""} |  |
  | `data[].description` | string \| string ∈ {""} |  |
  | `data[].state` | string \| null |  |
  | `data[].subscribers_count` | integer |  |
  | `data[].invite_link` | string \| null |  |
  | `data[].verification` | string \| null |  |
  | `data[].picture` | string \| null |  |
  | `data[].preview` | string \| null |  |
  | `data[].creation_time` | integer \| null |  |
  | `data[].mute` | string \| null |  |
  | `data[].role` | string \| null |  |
  | `data[].group_id` | string \| null | Id opaco: un texto que empieza con `grp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `meta` | object |  |
  | `meta.current_page` |  |  |
  | `meta.last_page` |  |  |
  | `meta.per_page` |  |  |
  | `meta.total` | integer |  |

- `400`
- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404`
- `422` — Validation error (`CommunitiesValidationException`)

### Ver los grupos de anuncios de un número

`GET /api/v1/devices/{device}/ad-groups` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `group.adGroups`

**Para qué sirve:** Úsalo para ver los grupos de anuncios de un número sin pasar por una campaña; cada uno trae la comunidad a la que pertenece (`communityUid`).

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `pageSize` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`).

**Parámetros**

La misma tabla que en «Ver tus grupos», más arriba en este texto.

**Respuestas**

- `200` — Array of `GroupMinResource`

  La misma tabla que en «Ver tus grupos», más arriba en este texto.

- `400`
- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404`
- `422` — Validation error (`CommunitiesValidationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
