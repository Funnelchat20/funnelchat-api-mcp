# Más sobre tus webhooks — API de Funnelchat: contexto para tu IA

> Copiado de /docs/mas-funciones/funnelchat/#mas-webhooks. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Más sobre tus webhooks: ver uno, editarlo, sus entregas y los tipos de evento

- Crear (`POST /api/v1/webhooks`), ver todos (`GET /api/v1/webhooks`), probar y borrar están en la página de webhooks.
  `{id}` es el `id` de un webhook (texto, no número) que devolvió el alta o la lista. Si la persona no dice cuál,
  lista sus webhooks y pregúntale por la `url`; no elijas por ella.
- **Permisos de la clave:** ver uno (`GET /api/v1/webhooks/{id}`) y sus entregas
  (`GET /api/v1/webhooks/{id}/deliveries`) piden **Avisos (webhooks) → Ver**; editarlo (`PUT /api/v1/webhooks/{id}`),
  **Avisos (webhooks) → Administrar**. En las tres, además, el permiso de lectura del área de cada evento que el
  webhook tiene ahora: **Números de WhatsApp → Ver** para los `device.*` y los de la cuenta (contactos activos, cobros,
  suscripción, `account.blocked`); **Grupos y campañas → Ver** para grupos, encuestas, campañas, pipelines, envíos
  programados y el reporte diario; **Contactos y conversaciones → Ver** para mensajes, contactos, etiquetas,
  conversaciones, tableros, formularios, flujos, plantillas y difusiones (sirven también Editar o Enviar de la misma
  área). Si falta uno: `403 permission_denied` (el `message` nombra el permiso) y no se cambia nada. Al editar, cada
  evento de `events` pide el de su área; si falta, `422`. `GET /api/v1/webhooks/events` pide **Números de WhatsApp →
  Ver**.
- **Ver uno:** el webhook sin envoltorio `data`: `id`, `url`, `description`, `events`, `filters` (`{}` si no tiene),
  `status` (`active`, `paused` o `disabled`), `disabled_reason`, `last_delivery_at`, `last_success_at`,
  `secret_rotated_at`, `created_at`, `updated_at` y `migration` (la especificación no lo describe). Nunca el secreto:
  si la persona lo perdió, se rota desde el panel. `404` si no existe o no es de la cuenta.
- **Editar:** `PUT /api/v1/webhooks/{id}` con `url` (obligatoria, hasta 2048 caracteres), `events` (obligatorio, de 1 a
  50 nombres, sin repetir ni comodín), `description` (hasta 160, o `null`), `filters` y, si quieres, `status`
  (`active` o `paused`; nunca `disabled`). Reemplaza los cuatro primeros, y la especificación no dice qué pasa con
  `description` o `filters` si no los mandas: lee antes el webhook con `GET` y manda lo que leíste, cambiando solo lo
  que la persona pidió. Para sumar un evento, manda la lista completa con el nuevo. La respuesta `200` no está
  descrita: para ver cómo quedó, vuelve a leerlo. Un cuerpo inválido responde `422` antes de mirar el webhook.
- **Antes de quitar eventos, cambiar la `url` o pausarlo:** hazlo solo si la persona lo pide de forma explícita para
  eso; confírmale qué webhook es (`url` e `id`) y qué va a dejar de recibir antes de llamar.
- **Pausarlo (o que se deshabilite) descarta lo pendiente:** las entregas que esperaban, también los reintentos en
  curso, no se envían ni se vuelven a intentar al reactivarlo, y no cuentan como fallas. Quedan en sus entregas sin
  `response_status`, con `error` `subscription_paused` (o `subscription_disabled`). Lo que pasó mientras estaba pausado
  no llega después: si la persona lo necesita, que su sistema lo vuelva a leer por la API.
- **Cambiar `url` con una clave ata el webhook a esa clave:** si después se revoca, pasa a `disabled` con
  `disabled_reason: key_revoked`, deja de recibir eventos y no se puede reactivar (hay que crear uno nuevo). Un webhook
  queda atado a la clave que lo creó o a la última que le cambió la `url`; uno creado desde el panel al que ninguna
  clave le cambió la `url` es de la cuenta y no depende de ninguna clave.
- **Deshabilitado por fallas:** según la descripción general, tras 5 entregas fallidas seguidas (agotadas o con una
  respuesta que no se reintenta) se deshabilita solo. Para reactivarlo, `PUT` con todo igual y `status: active`, y
  después pruébalo con `POST /api/v1/webhooks/{id}/test`. La especificación no enumera los `disabled_reason` salvo
  `key_revoked`.
- **Filtros:** `filters.campaign_ids` (hasta 100 textos de 6 a 64 caracteres) es un filtro por campañas de grupos. La
  especificación solo dice que `device.health_changed`, `device.quality_changed`, `device.messaging_limit_changed` y
  `device.display_name_reviewed` no llegan a un webhook filtrado por campaña (no son de ninguna) y que
  `group_join_request.created` de un grupo de una campaña sí llega a los filtrados por esa campaña. No dice qué
  identificador de campaña va (los eventos de grupos traen `campaign.uuid`) ni qué pasa con los demás eventos: úsalo
  solo si la persona lo pide, y pruébalo antes de depender de él.

## Las entregas y los tipos de evento

- **Entregas:** `GET /api/v1/webhooks/{id}/deliveries`, una fila por intento, la más nueva primero (orden fijo:
  mandar `orderBy` u otro parámetro de orden responde `422`). Por páginas: `perPage` (o `per_page`) de 1 a 100, 25 si
  no lo mandas; pide `links.next` tal cual hasta que sea `null`. Cada fila: `event_id` (el `id` del sobre que recibió
  el servidor; los reintentos de un evento lo comparten), `event_type`, `attempt`, `url`, `response_status`,
  `succeeded`, `error`, `duration_ms` y `attempted_at`. La especificación no enumera los valores de `error`: muéstralo
  tal cual. Solo aparecen las entregas de eventos de las áreas que la clave puede leer (si el webhook tuvo antes
  eventos de otra área, esas filas no aparecen); las de `webhook.test`, siempre.
- **Por qué no le llega algo:** mira `status`, `disabled_reason` y `events` del webhook, y sus últimas entregas
  (`succeeded`, `response_status`, `error`). Se reintenta hasta 4 intentos en total, con esperas de 60 segundos, 5
  minutos y 30 minutos, solo ante un error de red, un `5xx` o un `429`; un `3xx` u otro `4xx` no se reintenta. No
  consultes las entregas en un bucle para esperar un evento.
- **Tipos de evento:** `GET /api/v1/webhooks/events` lista los de las tres áreas, cada uno con `status` (`active`, o
  `planned`: se puede suscribir pero todavía no se emite) y `example` (el cuerpo completo que llega); `meta` trae
  `total`, `active`, `envelope_version` (`v1`), `signature_header` y `signature_format`. La especificación no describe
  los demás campos de cada entrada: lee los que llegan. **Ofrece solo los `active`**: uno `planned` no llega aunque el
  webhook lo tenga. `webhook.test` no se elige: llega al probar. La tabla de la página de webhooks ya tiene los que se
  publican: no hace falta pedir el catálogo antes de cada alta.

## Llamadas

### Ver un webhook

`GET /api/v1/webhooks/{id}` · permiso **Avisos (webhooks) → Ver** · área accounts · `operationId` `webhookSubscription.show`

**Para qué sirve:** Úsalo para ver la configuración de una suscripción: URL, eventos, filtros y estado.

Con una clave de API, la clave necesita además el permiso de lectura del
área de cada tipo de evento de la suscripción; si falta alguno, 403
`permission_denied`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |

**Respuestas**

- `200` — La suscripción.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string |  |
  | `url` | string |  |
  | `description` | string \| null |  |
  | `events` | array<string> |  |
  | `filters` | object \| null | Siempre un objeto: `{}` si no hay filtro. |
  | `status` | string |  |
  | `disabled_reason` | string \| null |  |
  | `last_delivery_at` | string \| null |  |
  | `last_success_at` | string \| null |  |
  | `secret_rotated_at` | string \| null |  |
  | `created_at` | string \| null |  |
  | `updated_at` | string \| null |  |
  | `migration` | object \| null |  |
  | `migration.origin` | string |  |
  | `migration.status` | string |  |
  | `migration.activated_via` | string \| null |  |
  | `migration.activated_at` | string \| null |  |
  | `migration.last_result` | string \| null |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — La clave de API no tiene el permiso de lectura de un área de los eventos de la suscripción.
- `404` — La suscripción no existe o no es de la cuenta.
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Editar un webhook

`PUT /api/v1/webhooks/{id}` · permiso **Avisos (webhooks) → Administrar** · área accounts · `operationId` `webhookSubscription.update`

**Para qué sirve:** Sirve para cambiar la URL, los eventos, la descripción o los filtros de una suscripción, o para pausarla y reactivarla.

Reemplaza `url`, `events`, `description` y `filters`; `status` opcional

Con una clave de API, cada tipo de `events` exige además el permiso
**Números de WhatsApp → Ver**, **Contactos y conversaciones → Ver** o
**Grupos y campañas → Ver**, según su área; si falta, 422.

Con una clave de API, la clave necesita además el permiso de lectura del
área de cada tipo de evento que la suscripción tiene ahora; si falta alguno,
403 `permission_denied` y no se cambia nada. Un cuerpo inválido responde 422
antes de mirar la suscripción.

Si una clave de API cambia `url`, la suscripción queda atada a esa clave:
cuando se revoque, pasa a `disabled` / `key_revoked`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `url` | string (uri) | sí |  |
| `description` | string \| null | no |  |
| `events` | array<string>: uno o más de los 55 eventos (la lista entera, con el permiso de cada uno: https://developers-portal.funnelchat.app/ia/lo-basico.md) | sí |  |
| `filters` | object | no |  |
| `filters.campaign_ids` | array<string> \| null | no |  |
| `status` | string ∈ {"active", "paused"} | no |  |

**Respuestas**

- `200`
- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — La clave de API no tiene el permiso de lectura de un área de los eventos de la suscripción.
- `422` — Validation error (`AccountsValidationException`)
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Ver las entregas de un webhook

`GET /api/v1/webhooks/{id}/deliveries` · permiso **Avisos (webhooks) → Ver** · área accounts · `operationId` `webhookSubscriptionDelivery.index`

**Para qué sirve:** Úsalo para depurar tu receptor: ves cada intento de entrega de una suscripción, con su resultado.

**Listado** · `perPage` de 1 a 100 (por defecto 25); también `per_page` · orden fijo: attempted_at descendente, después id descendente · no acepta parámetros de orden.

Con una clave de API, la clave necesita además el permiso de lectura del
área de cada tipo de evento de la suscripción; si falta alguno, 403
`permission_denied`.

Con una clave de API, solo las entregas de tipos cuya área la clave puede
leer; las de prueba, `webhook.test`, se muestran siempre.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |

**Respuestas**

- `200` — Los intentos de entrega, paginados.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<WebhookSubscriptionDeliveryResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `dlv_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].event_id` | string | El id del sobre: agrupa los intentos de un mismo evento y es el mismo valor que el receptor vio en el cuerpo. |
  | `data[].event_type` | string |  |
  | `data[].attempt` | integer |  |
  | `data[].url` | string |  |
  | `data[].response_status` | integer \| null |  |
  | `data[].succeeded` | boolean |  |
  | `data[].error` | string \| null |  |
  | `data[].duration_ms` | integer \| null |  |
  | `data[].attempted_at` | string |  |
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

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — La clave de API no tiene el permiso de lectura de un área de los eventos de la suscripción.
- `404` — La suscripción no existe o no es de la cuenta.
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Ver los tipos de evento

`GET /api/v1/webhooks/events` · permiso **Números de WhatsApp → Ver** · área accounts · `operationId` `webhookEventCatalog.index`

**Para qué sirve:** Úsalo para conocer todos los tipos de evento a los que te puedes suscribir —de tus números y tu cuenta, de tus contactos y conversaciones y de tus grupos—, cuáles ya llegan y cuáles todavía no, con un ejemplo del cuerpo de cada uno.

**Respuestas**

- `200`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<any> |  |
  | `meta` | object |  |
  | `meta.total` | integer |  |
  | `meta.active` | integer |  |
  | `meta.envelope_version` | "v1" | La versión del formato estándar, no la de la API HTTP. |
  | `meta.signature_header` | "X-Funnelchat-Signature" |  |
  | `meta.signature_format` | "t=<unix>,v1=<hex hmac-sha256 de \"<t>.<cuerpo crudo>\" con el secreto del endpoint>" |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_foreign_account`: solo la usa una clave de un workspace de la propia cuenta.
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
