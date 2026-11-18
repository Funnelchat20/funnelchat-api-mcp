# Saber si lo leyeron — API de Funnelchat: contexto para tu IA

> Copiado de /docs/saber-si-lo-leyeron/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Saber si lo leyeron, paso a paso

1. Crea un webhook: `POST /api/v1/webhooks` con
   `{"url": "https://tu-servidor.example/funnelchat", "events": ["message.status_changed"]}` (opcional:
   `description`). `url` es la dirección pública de tu receptor; usa `https`. `events` lleva de 1 a 50 nombres de
   evento y **no tiene comodín**: nombra cada evento que quieras, también `message.status_changed`. La clave necesita
   **Avisos (webhooks) → Administrar** (así aparece en el panel) y, porque es un evento de mensajes, también
   **Contactos y conversaciones → Ver**; si le falta, responde `422`.
2. La respuesta (`201`) trae el webhook con su `id` y su `secret` (empieza con `whsec_`). **El secreto aparece solo en
   esa respuesta**: guárdalo en el servidor que recibe los eventos (por ejemplo en una variable de entorno) y nunca en
   el código. Con él se verifica cada entrega.
3. Pruébalo: `POST /api/v1/webhooks/{id}/test` manda una sola entrega `webhook.test`, firmada igual que una real, y
   responde si tu servidor contestó `2xx`.
4. Cada cambio de estado llega como `message.status_changed`. Relaciónalo con tu envío por `data.message_id` (el `id`
   que devolvió el envío) junto con `data.contact_id`, y por `data.client_reference` si la mandaste. `data.status` es
   `sent`, `delivered`, `read` o `failed`: **`read` es que lo leyeron**.
5. Sin esperar el webhook: `GET /api/v1/contacts/{contact}/messages/{message}`, con el `contact_id` y el `id` que
   devolvió el envío, devuelve el mensaje con su `status`.

- No crees un webhook por cada cosa: `GET /api/v1/webhooks` lista los del workspace de tu clave, también los de otras
  integraciones, así que guarda el `id` del tuyo. Para cambiar la dirección o los eventos, usa «Editar un webhook»
  (`PUT /api/v1/webhooks/{id}`): reemplaza la dirección y la lista de eventos, así que manda todo como tiene que quedar.

## Llamadas

### Crear un webhook

`POST /api/v1/webhooks` · permiso **Avisos (webhooks) → Administrar** · área accounts · `operationId` `webhookSubscription.store`

**Para qué sirve:** Sirve para empezar a recibir eventos en tu sistema: eliges la URL y los eventos de cualquiera de las tres áreas, y guardas el secreto de firma, que se muestra solo esta vez.

Con una clave de API, cada tipo de `events` exige además el permiso
**Números de WhatsApp → Ver**, **Contactos y conversaciones → Ver** o
**Grupos y campañas → Ver**, según su área; si falta, 422.

Hay un tope de 50 suscripciones por workspace (por cuenta, si no usas workspaces), sea
cual sea su estado: con 50, crear otra responde `422` con `error`
`webhooks_limit_reached`.

No acepta `Idempotency-Key`: reintentar una creación que sí llegó crea otra suscripción,
con otro secreto.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `url` | string (uri) | sí |  |
| `description` | string \| null | no |  |
| `events` | array<string>: uno o más de los 55 eventos (la lista entera, con el permiso de cada uno: https://developers-portal.funnelchat.app/ia/lo-basico.md); los de este tema: `message.status_changed` | sí |  |
| `filters` | object | no |  |
| `filters.campaign_ids` | array<string> \| null | no |  |

**Respuestas**

- `201` — La suscripción creada, con su secreto de firma (`secret`). Es la única vez que aparece.

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
  | `secret` | string |  |
  | `secret_notice` | "Guarda este secreto ahora: es la única vez que se muestra. Con él validas la firma del header de cada entrega." |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_foreign_account`: solo la usa una clave de un workspace de la propia cuenta.
- `422` — Validation error (`AccountsValidationException`)
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Ver tus webhooks

`GET /api/v1/webhooks` · permiso **Avisos (webhooks) → Ver** · área accounts · `operationId` `webhookSubscription.index`

**Para qué sirve:** Úsalo para revisar a qué URLs le está mandando eventos tu cuenta y en qué estado está cada suscripción.

**Listado** · `perPage` de 1 a 100 (por defecto 25) · orden fijo: id ascendente · no acepta parámetros de orden.

Con una clave de API, solo las que la clave puede leer: se omiten las que
tienen eventos de un área cuyo permiso le falta: **Números de WhatsApp → Ver**,
**Contactos y conversaciones → Ver** o **Grupos y campañas → Ver**.

**Respuestas**

- `200` — Las suscripciones del workspace.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `[].id` | string |  |
  | `[].url` | string |  |
  | `[].description` | string \| null |  |
  | `[].events` | array<string> |  |
  | `[].filters` | object \| null | Siempre un objeto: `{}` si no hay filtro. |
  | `[].status` | string |  |
  | `[].disabled_reason` | string \| null |  |
  | `[].last_delivery_at` | string \| null |  |
  | `[].last_success_at` | string \| null |  |
  | `[].secret_rotated_at` | string \| null |  |
  | `[].created_at` | string \| null |  |
  | `[].updated_at` | string \| null |  |
  | `[].migration` | object \| null |  |
  | `[].migration.origin` | string |  |
  | `[].migration.status` | string |  |
  | `[].migration.activated_via` | string \| null |  |
  | `[].migration.activated_at` | string \| null |  |
  | `[].migration.last_result` | string \| null |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_foreign_account`: solo la usa una clave de un workspace de la propia cuenta.
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Borrar un webhook

`DELETE /api/v1/webhooks/{id}` · permiso **Avisos (webhooks) → Administrar** · área accounts · `operationId` `webhookSubscription.destroy`

**Para qué sirve:** Úsalo para dejar de recibir los eventos de una suscripción; también se borra su historial de entregas.

Con una clave de API, la clave necesita además el permiso de lectura del
área de cada tipo de evento de la suscripción; si falta alguno, 403
`permission_denied` y no se borra.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |

**Respuestas**

- `204` — No content
- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — La clave de API no tiene el permiso de lectura de un área de los eventos de la suscripción.
- `404`
- `409`
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Probar un webhook

`POST /api/v1/webhooks/{id}/test` · permiso **Avisos (webhooks) → Administrar** · área accounts · `operationId` `webhookSubscriptionTest.test`

**Para qué sirve:** Sirve para probar tu receptor y tu verificación de firma con una entrega firmada, sin esperar a que pase algo en tu cuenta.

Envía una entrega de prueba firmada a la URL de la suscripción y devuelve el resultado

Solo a suscripciones `active` o `paused`; una `disabled` responde 422 sin enviar nada.

Con una clave de API, la clave necesita además el permiso de lectura del área
de cada tipo de evento de la suscripción; si falta alguno, 403
`permission_denied`, antes que el 422 de una `disabled`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |

**Respuestas**

- `200`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `succeeded` | boolean |  |
  | `response_status` | integer \| null |  |
  | `error` | string \| null ∈ {"non_2xx", "internal_error", "timeout", "connection_failed", "tls_error", "destination_not_allowed", "secret_unreadable", null} |  |
  | `duration_ms` | integer \| null |  |
  | `delivery_id` | string | Id opaco: un texto que empieza con `dlv_`. Se usa tal como llega; no se arma ni se interpreta. |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — La clave de API no tiene el permiso de lectura de un área de los eventos de la suscripción.
- `404`
- `422` — La suscripción está deshabilitada: no se envía nada.
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Ver un mensaje

`GET /api/v1/contacts/{contact}/messages/{message}` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `message.showMessage`

**Para qué sirve:** Úsalo para saber qué pasó con un mensaje que enviaste: con el id que te devolvió el envío ves su estado (en cola, enviado, entregado, leído o fallido) y, si falló, el motivo.

Devuelve un mensaje de tu cuenta por el id que te dio el envío o un webhook. Aceptado no es entregado: el estado final llega por `message.status_changed` o por este GET. `status` es `queued`, `sent`, `delivered`, `read` o `failed` en los mensajes que enviaste. `sent`, `delivered`, `read` y `failed` tienen el mismo significado que en `message.status_changed`; `queued` es un mensaje en cola que todavía no se envió (en cola no es enviado) y no se reintenta. `status` es `null` en los mensajes recibidos, las notas y las acciones. `status` también es `null` en un mensaje enviado cuyo resultado no se conoce (el proveedor no confirmó ni rechazó el envío o el envío se interrumpió): puede haber llegado y no cambia de estado; también cuando lleva más de una hora en cola sin resultado: un mensaje cuyo envío no empezó dentro de la hora ya no sale; pasada la hora sin resultado, `status` es `null`, o `failed` con `error.reason` `not_sent` y su evento si su envío llega tarde. Reintentar es un envío nuevo, que sólo puede duplicar si el envío había empezado y se cortó. `error` trae `code`, `title` y `reason` solo cuando `status` es `failed`. `error.reason` es `null` cuando el rechazo lo informó el proveedor; si Funnelchat decidió que un mensaje enviado con clave no salía, trae `device_unavailable`, `insufficient_balance`, `window_closed`, `recipient_unreachable`, `template_not_found`, `template_unresolved_placeholder`, `not_queued` o `not_sent`, `code` es `null` y `title` es un texto llano en el idioma de la cuenta. `client_reference` es la referencia que mandaste al enviar, o `null`. Responde 404 si el mensaje no existe o no es de ese contacto.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `contact` | path | string | sí |  |
| `message` | path | string | sí |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string | Id opaco: un texto que empieza con `msg_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `contact_id` | string \| null | Id opaco: un texto que empieza con `ctc_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `device_id` | string \| null | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `direction` | string ∈ {"outbound", "inbound"} |  |
  | `type` | string ∈ {"text", "image", "video", "document", "sticker", "contact", "audio", "note", "action", "invalid", "interactive", "location", "voice_call", "video_call", "event", "button", "template", "notification", "option_list", "template_button_reply", "poll", "whatsapp_form", "call_permission_request", "call_permission_reply", "request_contact_info"} |  |
  | `status` | string \| null ∈ {"sent", "delivered", "read", "failed", "queued", null} |  |
  | `error` | object \| null |  |
  | `error.code` | integer \| null |  |
  | `error.title` | string \| null |  |
  | `error.reason` | string \| null |  |
  | `client_reference` | string \| null |  |
  | `created_at` | string \| null |  |
  | `updated_at` | string \| null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)

## Los eventos

Llegan por webhook. Cómo crear uno, cómo llega cada entrega, los reintentos, el permiso que pide cada evento y cómo verificar la firma (con funciones probadas en Node.js, Python y PHP): https://developers-portal.funnelchat.app/ia/lo-basico.md.

### `message.status_changed`

Cambió el estado de entrega de un mensaje enviado.

Se emite cuando cambia el estado de entrega de un mensaje que enviaste a un contacto, ya sea desde el chat, una automatización o un asistente de IA (incluye los enviados con clave). No se emite para mensajes de difusiones ni para mensajes recibidos. `message_id` es el id que devuelve la API, `contact_id` el del contacto y `device_id` el número de tu cuenta por el que salió el mensaje, el mismo `device_id` que usas para enviar (`null` si no tiene). `status` es `sent`, `delivered`, `read` o `failed`. `previous_status` es el estado que el mensaje tenía justo antes de este cambio y es `null` en tres casos: es el primer evento del mensaje, es el mismo estado que `status` (por ejemplo, el proveedor confirma el `sent` que ya registró el envío) o no se pudo leer. `error` solo viene cuando `status` es `failed`: `code` es el código numérico del proveedor y `title` su título, y cualquiera de los dos puede ser `null` si el proveedor no los informa. `error.reason` es `null` cuando el fallo lo informó el proveedor; cuando Funnelchat decidió que un mensaje enviado con clave no salía (por ejemplo, por saldo insuficiente o ventana de 24 horas cerrada) trae el motivo (`device_unavailable`, `insufficient_balance`, `window_closed`, `recipient_unreachable`, `template_not_found`, `template_unresolved_placeholder`, `not_queued` o `not_sent`), `code` es `null` y `title` es un texto llano en el idioma de la cuenta. `occurred_at` es el momento en que Funnelchat registró el estado, en UTC. `client_reference` es la referencia que mandaste al enviar el mensaje (por ejemplo `pedido-1001`) y `null` si el envío no la llevaba: sirve para relacionar cada evento con tu envío también cuando la llamada de envío no respondió. Cada estado se informa una sola vez por mensaje: si llegan varios eventos juntos se informa el más avanzado y un evento atrasado que no cambia el estado no genera evento. Un mensaje que no llegó a salir (por ejemplo, por ventana de 24 horas cerrada) no recibe eventos de estado, salvo uno enviado con clave: ese recibe un único evento `failed` con `previous_status` en `null`, su `error.reason` y su `client_reference`. Un mensaje enviado con clave cuyo resultado no se conoce (el proveedor no respondió o el envío se interrumpió) no recibe evento. Un mensaje cuyo envío no empezó dentro de la hora ya no sale: pasada la hora sin resultado, su estado es `null`, o `failed` con `error.reason` `not_sent` y su evento si su envío llega tarde. Reintentar es un envío nuevo, que sólo puede duplicar si el envío había empezado y se cortó. Un mensaje `queued` no es enviado: su resultado llega por este evento o por la consulta del mensaje. En cuentas con mucho tráfico, los eventos que excedan el límite de entrega por minuto de la cuenta se descartan.

Ejemplo:

```json
{
  "id": "evt_000000000000000000000014",
  "type": "message.status_changed",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "message_id": "msg_ADyPfpgQyD89BoEabkSQkV1",
    "contact_id": "ctc_ABViuUDF93I2VL1tInstRDG",
    "device_id": "dev_AFHtaOVjNBTEWzCuDrmxMPP",
    "status": "failed",
    "previous_status": "sent",
    "error": {
      "code": 131047,
      "title": "Re-engagement message",
      "reason": null
    },
    "occurred_at": "2026-10-01T12:00:00Z",
    "client_reference": "pedido-1001",
    "workspace_id": 37
  }
}
```

### `webhook.test`

Evento de prueba enviado desde la ruta de prueba de una suscripción.

Ejemplo:

```json
{
  "id": "evt_000000000000000000000002",
  "type": "webhook.test",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "subscription": "00000000-0000-4000-8000-000000000001",
    "sent_at": "2026-10-01T12:00:00Z"
  }
}
```

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
