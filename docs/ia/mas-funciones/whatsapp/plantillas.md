# Plantillas de Meta — API de Funnelchat: contexto para tu IA

> Copiado de /docs/mas-funciones/whatsapp/#plantillas. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Plantillas de Meta: crear, ver, editar, métricas y borrar

- `{template}` es el `id` de una plantilla de `GET /api/v1/templates` («Mandar mensajes», que también explica cómo traer
  de Meta las que se crearon allí y cómo mandar una).
- **Crear:** `POST /api/v1/templates` con `name`, `language_code` (un código de la lista, por ejemplo `es` o `es_AR`),
  `category` (`UTILITY`, `MARKETING` o `AUTHENTICATION`), `type` (`text`, `image`, `document`, `video`, `location` o
  `default`) y `body`, obligatorios, y si quieres `header`, `footer`, `params` (una lista de textos), `file` y `buttons`
  (hasta 3, cada uno con `type` `QUICK_REPLY`, `URL` o `PHONE_NUMBER`, `text` y, según el tipo, `url` o
  `phone_number`). **Lleva además `device_id`, obligatorio aunque la especificación todavía no lo declare en el
  cuerpo:** un número oficial de la cuenta que la clave puede usar. La plantilla se crea en la cuenta de WhatsApp
  Business de ese número (`waba_id`), y el nombre con el idioma no se puede repetir dentro de esa WABA. Si la persona
  tiene varios números oficiales, pregúntale en cuál. Responde enseguida `200` con la plantilla en `PENDING` (con su
  `device_id` y `waba_id`) y la manda a Meta en segundo plano: no está aprobada. Si el número no tiene WABA, termina
  `REJECTED` («El dispositivo no tiene WABA ID configurado»). `params` y `file`: sin descripción todavía en la
  especificación.
- **Aprobación:** el estado lo decide Meta (`PENDING`, `APPROVED`, `REJECTED`, `PAUSED`…). Para enterarte, un webhook
  con `"events": ["template.status_changed"]` (pide **Contactos y conversaciones → Ver**, además del permiso de los
  webhooks), o vuelve a ver la plantilla más tarde; no la consultes en un bucle. El evento trae `data.template` (`id`,
  `uid`, `name`, `category`), `previous_status` (`null` si no tenía), `status` y `reason` (la observación de rechazo,
  hasta 500 caracteres, solo cuando es un rechazo informado al crearla). No llega si Meta repite el estado que ya tenía.
- **Editar:** `PUT /api/v1/templates/{template}` con `device_id`, `category`, `type` y `body` (obligatorios) y lo demás
  como al crear; el nombre y el idioma no van. La especificación no describe qué `device_id` va; la plantilla trae el
  suyo. Responde `204` sin cuerpo: para ver cómo quedó, `GET /api/v1/templates/{template}`. `400 bad_request`: no se
  puede editar ahora; el motivo viene en `message` (muéstraselo a la persona). La especificación no dice cuándo pasa:
  no reintentes enseguida.
- **Métricas:** `GET /api/v1/templates/{template}/metrics`, con `from` y `to` (`AAAA-MM-DD`, UTC, los dos o ninguno;
  hasta 90 días contando hoy; `to` no puede ser futura). Responde `data` con `totals`, `days` (los días sin datos, en
  cero y `cost` en `null`) y `fetched_at` (cuándo se leyó de Meta); no describe los campos de `totals` ni de cada día.
  Con `template_analytics_not_enabled`, dile a la persona que las active en el Administrador de WhatsApp (Meta no deja
  desactivarlas después); con `template_metrics_not_available_for_qr`, el número es por QR: no hay métricas. Un error
  no queda guardado: reintentar vuelve a consultar a Meta y cuenta en el límite de 60 por hora de la cuenta.
- **Borrar de un número:** `DELETE /api/v1/devices/{device}/templates/{template}`, con `{device}` el `id` del número.
  Responde `204`. Hazlo solo si la persona lo pide de forma explícita para eso; confírmale qué vas a borrar (nombre e
  id de la plantilla, y el número) antes de llamar. La especificación no dice si la borra también en Meta ni si se
  puede deshacer.

## Llamadas

### Crear una plantilla

`POST /api/v1/templates` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `messageTemplate.store`

**Para qué sirve:** Sirve para crear una plantilla de WhatsApp (encabezado, cuerpo con variables, pie y botones) desde tu sistema, sin pasar por el panel: queda en la cuenta de WhatsApp Business del número oficial que eliges (`device_id`) y Meta la revisa.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `name` | string | sí |  |
| `language_code` | string ∈ {"af", "sq", "ar", "ar_EG", "ar_AE", "ar_LB", "ar_MA", "ar_QA", "az", "be_BY", "bn", "bn_IN", "bg", "ca", "zh_CN", "zh_HK", "zh_TW", "hr", "cs", "da", "prs_AF", "nl", "nl_BE", "en", "en_GB", "en_US", "en_AE", "en_AU", "en_CA", "en_GH", "en_IE", "en_IN", "en_JM", "en_MY", "en_NZ", "en_QA", "en_SG", "en_UG", "en_ZA", "et", "fil", "fi", "fr", "fr_BE", "fr_CA", "fr_CH", "fr_CI", "fr_MA", "ka", "de", "de_AT", "de_CH", "el", "gu", "ha", "he", "hi", "hu", "id", "ga", "it", "ja", "kn", "kk", "rw_RW", "ko", "ky_KG", "lo", "lv", "lt", "mk", "ms", "ml", "mr", "nb", "ps_AF", "fa", "pl", "pt_BR", "pt_PT", "pa", "ro", "ru", "sr", "si_LK", "sk", "sl", "es", "es_AR", "es_CL", "es_CO", "es_CR", "es_DO", "es_EC", "es_HN", "es_MX", "es_PA", "es_PE", "es_ES", "es_UY", "sw", "sv", "ta", "te", "th", "tr", "uk", "ur", "uz", "vi", "zu"} | sí |  |
| `category` | string ∈ {"UTILITY", "MARKETING", "AUTHENTICATION"} | sí |  |
| `type` | string ∈ {"text", "image", "document", "video", "location", "default"} | sí |  |
| `header` | string \| null | no |  |
| `file` | string | no |  |
| `body` | string | sí |  |
| `params` | array<string> \| null | no |  |
| `footer` | string \| null | no |  |
| `buttons` | array<object> \| null | no |  |
| `buttons[].text` | string | no |  |
| `buttons[].type` | string ∈ {"QUICK_REPLY", "URL", "PHONE_NUMBER"} | no |  |
| `buttons[].url` | string (uri) | no |  |
| `buttons[].phone_number` | string | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string | Id opaco: un texto que empieza con `tpl_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `name` | string |  |
  | `text` | string |  |
  | `header` | string |  |
  | `footer` | string |  |
  | `observation` | string |  |
  | `uid` | string |  |
  | `category` | string |  |
  | `type` | string ∈ {"text", "image", "document", "video", "location", "default"} \| string ∈ {""} |  |
  | `status` | string ∈ {"PENDING", "APPROVED", "REJECTED", "PENDING_DELETION", "PAUSED", "DISABLED", "ARCHIVED"} \| string ∈ {""} |  |
  | `language_code` | string |  |
  | `upload_session_id` | string |  |
  | `header_handle` | string |  |
  | `file` | string |  |
  | `params` | array<any> \| string ∈ {""} |  |
  | `buttons` | array<any> \| string ∈ {""} |  |
  | `user_id` | string | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `device_id` | string | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `created_at` | string (date-time) \| null |  |
  | `recategorized_at` | string (date-time) \| null |  |
  | `quick_reply_buttons` | array<any> |  |
  | `waba_id` | string \| null |  |
  | `belongs_to_current_device` | boolean |  |
  | `quality_score` | string |  |
  | `quality_updated_at` | string |  |
  | `quality` | string |  |
  | `available` | boolean |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver una plantilla

`GET /api/v1/templates/{template}` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `messageTemplate.template`

**Para qué sirve:** Sirve para ver una plantilla completa, con su estado, variables y botones, por ejemplo para saber qué valores completar al enviarla.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `template` | path | string | sí |  |

**Respuestas**

- `200` — OK

  La misma tabla que en «Crear una plantilla», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)

### Editar una plantilla

`PUT /api/v1/templates/{template}` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `messageTemplate.update`

**Para qué sirve:** Úsalo para editar el contenido de una plantilla existente: categoría, encabezado, cuerpo, variables, pie o botones.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `template` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `category` | string ∈ {"UTILITY", "MARKETING", "AUTHENTICATION"} | sí |  |
| `type` | string ∈ {"text", "image", "document", "video", "location", "default"} | sí |  |
| `header` | string \| null | no |  |
| `file` | string | no |  |
| `body` | string | sí |  |
| `params` | array<string> \| null | no |  |
| `footer` | string \| null | no |  |
| `buttons` | array<object> \| null | no |  |
| `buttons[].text` | string | no |  |
| `buttons[].type` | string ∈ {"QUICK_REPLY", "URL", "PHONE_NUMBER"} | no |  |
| `buttons[].url` | string (uri) | no |  |
| `buttons[].phone_number` | string | no |  |

**Respuestas**

- `204` — No Content
- `400` — Bad Request
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver las métricas de una plantilla

`GET /api/v1/templates/{template}/metrics` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `message.templateMetrics`

**Para qué sirve:** Úsalo para medir una plantilla de un número oficial con lo que informa Meta: enviados, entregados, leídos y clics por botón, día por día y en total, hasta 90 días.

Devuelve lo que Meta informa de una plantilla de un número de la API oficial de WhatsApp, día por día (UTC) y en total: mensajes enviados, entregados y leídos, clics por botón y, cuando Meta lo informa, el costo.

- **Rango:** `from` y `to` (AAAA-MM-DD, UTC, ambos inclusive), los dos o ninguno. Sin ellos: los últimos 7 días, hoy incluido. El rango llega hasta 90 días contando hoy; `to` no puede ser una fecha futura. Un rango inválido responde 422 con el detalle por campo.
- **Días sin datos:** aparecen con los conteos en cero y `cost` en `null`.
- **Lecturas y clics:** Meta los registra sólo durante los 7 días posteriores al envío; después puede informarlos en cero.
- **Clics:** sólo en plantillas de categoría MARKETING o UTILITY.
- **Costo:** `null` cuando Meta no lo informa (por ejemplo, si la cuenta de WhatsApp Business usa la línea de crédito de un socio).
- **Activación:** las métricas de plantillas tienen que estar activadas en el Administrador de WhatsApp de la cuenta. Funnelchat no las activa por ti: Meta no permite desactivarlas después.
- **Frescura:** las respuestas exitosas de Meta se guardan 15 minutos; los errores no se guardan, así que reintentar después de un error vuelve a consultar a Meta (y cuenta en el límite). `fetched_at` dice cuándo se leyó.
- **Límite:** hasta 60 consultas a Meta por hora por cuenta, en una ventana de una hora que arranca con la primera consulta y se reinicia al cumplirse (`Retry-After` indica cuántos segundos faltan); las respuestas guardadas no cuentan y una lectura puede usar hasta 3 consultas si Meta la entrega en varias páginas.

| HTTP | `error` | Cuándo |
|---|---|---|
| 404 | — | La plantilla no existe en tu cuenta. |
| 422 | `template_metrics_not_available_for_qr` | El número de la plantilla está conectado por QR. |
| 422 | `template_not_in_meta` | La plantilla todavía no tiene identificador en Meta. |
| 422 | `number_not_connected_to_meta` | El número no tiene cuenta de WhatsApp Business o credenciales válidas. |
| 422 | `template_waba_mismatch` | La plantilla es de otra cuenta de WhatsApp Business que la actual del número. |
| 422 | `template_analytics_not_enabled` | Las métricas de plantillas no están activadas en la cuenta. |
| 422 | `template_analytics_not_available_yet` | Meta todavía no tiene métricas para la cuenta. |
| 429 | `template_metrics_rate_limited` | Se agotaron las consultas a Meta de la hora (ver `Retry-After`). |
| 429 | — | Demasiadas solicitudes por minuto (ver `Retry-After`). |
| 503 | `meta_rate_limited` | Meta está limitando las consultas (ver `Retry-After`). |
| 502 | `meta_unavailable` | Meta no respondió correctamente. |

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `template` | path | string | sí |  |
| `from` | query | string (date) \| null | no |  |
| `to` | query | string (date) \| null | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | TemplateMetricsResource |  |
  | `data.template_id` | string | Id opaco: un texto que empieza con `tpl_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.from` | string |  |
  | `data.to` | string |  |
  | `data.timezone` | "UTC" |  |
  | `data.granularity` | "day" |  |
  | `data.fetched_at` | string |  |
  | `data.totals` | object |  |
  | `data.days` | array<object> |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Borrar una plantilla de un número

`DELETE /api/v1/devices/{device}/templates/{template}` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `messageTemplate.delete`

**Para qué sirve:** Úsalo para eliminar una plantilla de uno de tus números cuando ya no la vas a usar.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí |  |
| `template` | path | string | sí |  |

**Respuestas**

- `204` — No Content
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content
- `502` — Bad Gateway

## Los eventos

Llegan por webhook. Cómo crear uno, cómo llega cada entrega, los reintentos, el permiso que pide cada evento y cómo verificar la firma (con funciones probadas en Node.js, Python y PHP): https://developers-portal.funnelchat.app/ia/lo-basico.md.

### `template.status_changed`

Una plantilla cambió de estado de aprobación en Meta.

`template` identifica la plantilla igual que `GET /templates` (`id`, `uid`, `name`, `category`). `previous_status` y `status` son los estados tal como los devuelve la API (por ejemplo `PENDING`, `APPROVED`, `REJECTED`, `PAUSED`); `previous_status` es `null` si la plantilla no tenía estado. `reason` trae la observación de rechazo (traducida como en la API y limitada a 500 caracteres) cuando el cambio es un rechazo informado al crear la plantilla, y es `null` en el resto. No se emite si Meta reenvía el estado que la plantilla ya tenía. Si una misma plantilla de Meta figura en varias cuentas, cada cuenta recibe su propio evento.

Ejemplo:

```json
{
  "id": "evt_000000000000000000000012",
  "type": "template.status_changed",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "template": {
      "id": "tpl_AFtfM4vyhniQeLOqzkkVDA4",
      "uid": "1234567890",
      "name": "plantilla_ejemplo",
      "category": "MARKETING"
    },
    "previous_status": "PENDING",
    "status": "APPROVED",
    "reason": null,
    "workspace_id": 37
  }
}
```

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
