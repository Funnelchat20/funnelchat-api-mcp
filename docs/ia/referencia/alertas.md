# Alertas — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/alertas/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver las alertas que hay

`GET /api/v1/alerts/catalog` · permiso **Números de WhatsApp → Ver** · área accounts · `operationId` `alertCatalog.index`

**Para qué sirve:** Úsalo para conocer qué alertas existen (números desconectados, consumo de MACs, cobros, campañas, grupos y más), cuáles son críticas y qué significan, antes de activarlas en un destino.

Las alertas que la cuenta puede activar en un destino, con su `module` y su `action`. Las
que dependen de cómo paga la cuenta (por ejemplo, la reactivación de la suscripción) solo
aparecen si aplican a la cuenta.

**Respuestas**

- `200` — Las alertas del catálogo.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `[].module` | string |  |
  | `[].action` | string |  |
  | `[].category` | string |  |
  | `[].is_critical` | string |  |
  | `[].label` | string |  |
  | `[].tooltip` | string |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe.
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Ver los destinos de tus alertas

`GET /api/v1/alerts/destinations` · permiso **Números de WhatsApp → Ver** · área accounts · `operationId` `alertDestination.index`

**Para qué sirve:** Sirve para ver a dónde llegan las alertas del workspace de tu clave (teléfonos, de los que ves solo los últimos cuatro dígitos, o webhooks), si están verificados y qué alertas tiene activas cada uno.

**Listado** · `perPage` de 1 a 100 (por defecto 25) · orden fijo: id ascendente · no acepta parámetros de orden.

Los teléfonos y webhooks que reciben las alertas, los del workspace de la clave. El
teléfono sale tapado: solo se ven sus últimos cuatro dígitos (`****1234`).

**Respuestas**

- `200` — Los destinos del workspace.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `[].id` | string | Id opaco: un texto que empieza con `ald_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `[].type` | string |  |
  | `[].destination` | string |  |
  | `[].name` | string \| null |  |
  | `[].verified` | boolean |  |
  | `[].has_secret` | string |  |
  | `[].created_at` | string \| null |  |
  | `[].settings` | array<AlertSettingResource> |  |
  | `[].settings[].module` | string |  |
  | `[].settings[].action` | string |  |
  | `[].settings[].enabled` | boolean |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Prender o apagar una alerta en un destino

`PUT /api/v1/alerts/destinations/{id}/settings` · permiso **Números de WhatsApp → Editar** · área accounts · `operationId` `alertSetting.upsert`

**Para qué sirve:** Sirve para elegir qué alertas recibe cada destino verificado, prendiéndolas o apagándolas una por una, por ejemplo la desconexión de un número o un pago fallido.

`module` y `action` son los de una alerta del catálogo (`GET alerts/catalog`); `enabled`
la activa o la apaga. Un destino `phone` tiene que estar verificado.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `module` | string ∈ {"device", "mac", "billing", "subscription", "account", "campaign", "group", "broadcast", "ai_quota"} | sí |  |
| `action` | string ∈ {"disconnected", "usage_80", "expiring", "usage_100", "upcoming_charge", "payment_failed", "plan_blocked", "reactivated", "trial_ending", "cancellation_confirmed", "dormant_ending", "blocked", "no_groups_available", "daily_report", "action_failed", "message_failed", "full", "invalid_link", "started", "paused", "resumed", "cancelled", "finished", "summary", "low_balance", "topup_succeeded", "topup_failed"} | sí |  |
| `enabled` | boolean | sí |  |

**Respuestas**

- `200` — La alerta del destino, con su estado.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `module` | string |  |
  | `action` | string |  |
  | `enabled` | boolean |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `404` — El destino no existe o no es del workspace.
- `422` — Datos inválidos, la alerta no está en el catálogo o el destino `phone` no está verificado.
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Ver el horario de silencio

`GET /api/v1/alerts/quiet-hours` · permiso **Números de WhatsApp → Ver** · área accounts · `operationId` `alertQuietHour.show`

**Para qué sirve:** Sirve para ver si hay un horario de silencio configurado para las alertas y entre qué horas rige.

Si la cuenta todavía no lo configuró, devuelve `enabled: false` sin horario.

**Respuestas**

- `200` — El horario de silencio.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `enabled` | boolean |  |
  | `start_time` | string \| null |  |
  | `end_time` | string \| null |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_account_level`: es de la cuenta entera y solo la usa una clave del workspace por defecto; `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Configurar el horario de silencio

`PUT /api/v1/alerts/quiet-hours` · permiso **Números de WhatsApp → Editar** · área accounts · `operationId` `alertQuietHour.update`

**Para qué sirve:** Úsalo para definir una franja horaria sin alertas, por ejemplo de noche, o para desactivarla.

Reemplaza el horario de la cuenta (hay uno solo). `start_time` y `end_time` van en
`HH:MM`; `end_time` puede ser anterior a `start_time` para un horario que cruza la
medianoche.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `enabled` | boolean | sí |  |
| `start_time` | string \| null | no |  |
| `end_time` | string \| null | no |  |

**Respuestas**

- `200` — El horario guardado.

  La misma tabla que en «Ver el horario de silencio», más arriba en este texto.

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_account_level`: es de la cuenta entera y solo la usa una clave del workspace por defecto; `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `422` — Validation error (`AccountsValidationException`)
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Ver el reporte diario

`GET /api/v1/alerts/daily-report` · permiso **Números de WhatsApp → Ver** · área accounts · `operationId` `alertDailyReport.show`

**Para qué sirve:** Sirve para ver cómo está configurado el reporte diario: si está activo, a qué hora se envía y qué campañas incluye.

Si la cuenta todavía no lo configuró, devuelve los valores por defecto: apagado, a las
`08:00` y con todas las campañas.

**Respuestas**

- `200` — La configuración del reporte diario.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `enabled` | boolean |  |
  | `send_time` | string \| null |  |
  | `all_campaigns` | boolean |  |
  | `campaign_ids` | array<string> |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_account_level`: es de la cuenta entera y solo la usa una clave del workspace por defecto; `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Configurar el reporte diario

`PUT /api/v1/alerts/daily-report` · permiso **Números de WhatsApp → Editar** · área accounts · `operationId` `alertDailyReport.update`

**Para qué sirve:** Úsalo para activar o ajustar el reporte diario: el horario de envío y si cubre todas las campañas o solo algunas.

Reemplaza la configuración de la cuenta (hay una sola). Con `all_campaigns: false`, de
`campaign_ids` se guardan solo las campañas que existen y son del workspace por defecto
(las que lista `GET alerts/campaigns`): los ids que no lo son se descartan sin error.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `enabled` | boolean | sí |  |
| `send_time` | string \| null | no |  |
| `all_campaigns` | boolean | sí |  |
| `campaign_ids` | array<integer> \| null | no |  |

**Respuestas**

- `200` — La configuración guardada.

  La misma tabla que en «Ver el reporte diario», más arriba en este texto.

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_account_level`: es de la cuenta entera y solo la usa una clave del workspace por defecto; `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `422` — Validation error (`AccountsValidationException`)
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Ver las campañas para tus alertas

`GET /api/v1/alerts/campaigns` · permiso **Números de WhatsApp → Ver** · área accounts · `operationId` `alertCampaign.index`

**Para qué sirve:** Sirve para listar, con búsqueda por nombre, las campañas de grupos que puedes elegir al configurar alertas como el reporte diario.

**Listado** · `perPage` de 1 a 100 (por defecto 25); también `per_page` · orden fijo: id ascendente · no acepta parámetros de orden.

Las campañas del workspace por defecto, para elegir cuáles entran en el reporte diario. El
reporte es de toda la cuenta: con una clave, esta ruta solo la puede usar una clave del
workspace por defecto. `search` filtra por nombre.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `page` | query | integer \| null | no |  |
| `per_page` | query | integer \| null | no |  |
| `search` | query | string \| null | no |  |

**Respuestas**

- `200` — Las campañas, paginadas.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<AlertCampaignResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `cmp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].uuid` | string |  |
  | `data[].name` | string |  |
  | `data[].is_active` | boolean |  |
  | `data[].groups_count` | integer |  |
  | `data[].type` | integer \| null |  |
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
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_account_level`: es de la cuenta entera y solo la usa una clave del workspace por defecto; `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `422` — Validation error (`AccountsValidationException`)
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`
- `503` — Las campañas no se pueden leer en este momento (`groups_unavailable`). Vuelve a intentarlo.

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
