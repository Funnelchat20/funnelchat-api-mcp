# Webhooks — API de Funnelchat: contexto para tu IA

> Copiado de /docs/webhooks/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

Esta página es el detalle de los webhooks: cómo funcionan, cuatro de sus llamadas (crear, ver todos, probar y borrar; ver uno, editarlo, sus entregas y los tipos de evento están en «Más sobre tus webhooks», en Más funciones), qué trae cada evento y cómo verificar la firma.

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
| `events` | array<string ∈ {"device.disconnected", "device.connected", "device.deleted", "device.health_changed", "device.quality_changed", "device.messaging_limit_changed", "device.display_name_reviewed", "billing.payment_failed", "billing.upcoming_charge", "subscription.trial_ending", "subscription.reactivated", "subscription.cancellation_confirmed", "subscription.dormant_ending", "mac.usage_80", "mac.usage_100", "mac.expiring", "account.blocked", "message.received", "flow.completed", "broadcast.finished", "contact.stage_changed", "message.status_changed", "conversation.closed", "conversation.assigned", "contact.tag_added", "broadcast.paused", "contact.tag_removed", "contact.created", "template.status_changed", "flow.failed", "whatsapp_form.completed", "contact.updated", "message.reaction_failed", "group.created", "group.invite_link_down", "group.invite_link_renewed", "group_participant.joined", "group_participant.left", "scheduled_message.group_delivery_failed", "scheduled_message.response_received", "poll.voted", "pipeline.finished", "group.blocked", "group.recovered", "campaign.status_changed", "scheduled_message.finished", "group_action.failed", "daily_report.generated", "campaign.no_groups_available", "group.full", "group_action.completed", "group.message_received", "group.reaction_added", "group_join_request.created", "group_join_request.revoked"}> | sí |  |
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

## Cómo funcionan los webhooks

- Un webhook es una dirección pública de tu servidor (con `https`) a la que Funnelchat le manda los eventos que elegiste.
  Se crea con `POST /api/v1/webhooks`: `url` y `events` (de 1 a 50 nombres de evento, sin comodín: nombra cada uno).
  La clave necesita **Avisos (webhooks) → Administrar** (así se llama la casilla en el panel) y, por cada evento, el
  permiso de lectura de su área: **Números de WhatsApp → Ver** para `device.connected` y `device.disconnected`;
  **Contactos y conversaciones → Ver** para los de mensajes, contactos, conversaciones, formularios y automatizaciones
  (`message.received`, `message.status_changed`, `message.reaction_failed`, `contact.created`, `contact.updated`,
  `contact.tag_added`, `contact.tag_removed`, `conversation.assigned`, `conversation.closed`,
  `whatsapp_form.completed`, `flow.completed` y `flow.failed`), y **Grupos y campañas → Ver** para `group_participant.joined` y `group_participant.left`. Si falta
  alguno, `422`.
- La respuesta del alta (`201`) trae el `id` del webhook y su `secret` (empieza con `whsec_`). El secreto aparece solo
  ahí: guárdalo en el servidor que recibe los eventos, por ejemplo en una variable de entorno.
- **El alta no acepta `Idempotency-Key`:** si la llamada no respondió y la repites, puede quedar otro webhook, con otro
  secreto. Antes de repetirla, mira `GET /api/v1/webhooks`. Hay un tope de 50 webhooks por workspace (por cuenta, si no
  usa workspaces), sea cual sea su estado: con 50, el alta responde `422 webhooks_limit_reached`; borra los que ya no
  se usan, con confirmación de la persona.
- **Un webhook con todos los eventos que necesitas.** Al crearlo, nombra todos. Para sumar o quitar eventos más adelante,
  usa «Editar un webhook» (`PUT /api/v1/webhooks/{id}`) con la lista completa: el secreto no cambia.
  `GET /api/v1/webhooks` lista los webhooks del workspace de la clave, también los de otras integraciones: guarda el `id` del tuyo.
- Cada entrega es un `POST` a tu `url` con el cuerpo JSON `{id, type, version, occurred_at, data}` y las cabeceras
  `X-Funnelchat-Signature` (la firma), `X-Funnelchat-Event` (el tipo de evento) y `X-Funnelchat-Delivery` (cambia en
  cada intento).
- Todos los eventos traen `data.workspace_id`: el id del workspace del número (un entero). Un webhook recibe solo los
  eventos de su workspace: las suscripciones son del workspace de la clave.
- Los eventos de contactos activos (`mac.*`), de bloqueo (`account.blocked`), de cobros (`billing.*`) y de la suscripción
  (`subscription.*`) llegan al workspace al que corresponden: el que tiene facturación propia o, si el pool es el de la
  cuenta, el workspace por defecto (cada descripción lo dice).
- Verifica la firma sobre el cuerpo crudo, antes de parsear el JSON (ver «Verificar la firma»). Rechaza la entrega si no
  coincide o si `t` está a más de 300 segundos de la hora actual.
- Responde `2xx` enseguida y procesa después. Ante un error de red, un `5xx` o un `429` se reintenta: hasta 4 intentos
  en total, esperando 60 segundos, 5 minutos y 30 minutos entre ellos. Otra respuesta (`3xx`, o un `4xx` que no sea
  `429`) no se reintenta. Después de 5 entregas fallidas seguidas el webhook se deshabilita (`status: disabled`):
  arregla el servidor, reactívalo con «Editar un webhook» (`PUT /api/v1/webhooks/{id}`, todo igual y
  `status: active`; el secreto no cambia) y pruébalo con `POST /api/v1/webhooks/{id}/test`. Lo que estaba por llegarle
  mientras estuvo deshabilitado no se manda después.
- El `id` del sobre es el mismo en todos los reintentos: úsalo para descartar los repetidos.
- Para probar sin esperar un evento real: `POST /api/v1/webhooks/{id}/test` manda una sola entrega `webhook.test`,
  firmada igual que una real, y responde si tu servidor contestó `2xx`. A `webhook.test` no se suscribe nadie: solo
  llega al probar.

## Los eventos

| Evento | Cuándo llega | Permiso para recibirlo |
|---|---|---|
| `message.received` | Alguien le escribe a uno de tus números. | **Contactos y conversaciones → Ver** |
| `message.status_changed` | Un mensaje que mandaste cambia de estado: enviado, entregado, leído o falló. | **Contactos y conversaciones → Ver** |
| `message.reaction_failed` | Una reacción que pediste no se pudo aplicar. | **Contactos y conversaciones → Ver** |
| `template.status_changed` | Cambia el estado de aprobación de una de tus plantillas en Meta: por ejemplo, la aprueba o la rechaza. | **Contactos y conversaciones → Ver** |
| `broadcast.finished` | Una de tus difusiones termina: enviada, fallida o con fallos parciales. | **Contactos y conversaciones → Ver** |
| `broadcast.paused` | Una de tus difusiones se pausa sola, por ejemplo porque bajó la calidad del número. | **Contactos y conversaciones → Ver** |
| `device.connected` | Uno de tus números queda conectado. | **Números de WhatsApp → Ver** |
| `device.disconnected` | Uno de tus números pierde la conexión. | **Números de WhatsApp → Ver** |
| `device.deleted` | Se borra uno de tus números y libera su lugar en tu plan. | **Números de WhatsApp → Ver** |
| `device.health_changed` | Cambia el estado de envío de uno de tus números oficiales, según Meta. | **Números de WhatsApp → Ver** |
| `device.quality_changed` | Meta cambia la calidad de uno de tus números oficiales. | **Números de WhatsApp → Ver** |
| `device.messaging_limit_changed` | Meta cambia el límite de mensajes por día de uno de tus números oficiales. | **Números de WhatsApp → Ver** |
| `device.display_name_reviewed` | Meta aprueba o rechaza el nombre visible de uno de tus números oficiales. | **Números de WhatsApp → Ver** |
| `group_participant.joined` | Alguien entra a un grupo que sigues. | **Grupos y campañas → Ver** |
| `group_participant.left` | Alguien sale de un grupo que sigues. | **Grupos y campañas → Ver** |
| `group.message_received` | Alguien escribe en un grupo que sigues. | **Grupos y campañas → Ver** |
| `group.reaction_added` | Alguien reacciona a un mensaje en un grupo que sigues. | **Grupos y campañas → Ver** |
| `poll.voted` | Alguien vota en una encuesta de un grupo, o cambia su voto. | **Grupos y campañas → Ver** |
| `group_join_request.created` | Alguien pide entrar a un grupo oficial que pide aprobación. | **Grupos y campañas → Ver** |
| `group_join_request.revoked` | Alguien retira su pedido para entrar a un grupo antes de que lo aprueben o lo rechacen. | **Grupos y campañas → Ver** |
| `group.created` | Se crea un grupo en una de tus campañas, o se importa a una. | **Grupos y campañas → Ver** |
| `group.full` | Un grupo se llena. | **Grupos y campañas → Ver** |
| `group.blocked` | Un grupo deja de poder operar: sin administrador conectado, con el link de invitación inválido o suspendido por WhatsApp. | **Grupos y campañas → Ver** |
| `group.recovered` | Un grupo que estaba bloqueado vuelve a operar. | **Grupos y campañas → Ver** |
| `group.invite_link_down` | El link de invitación de un grupo se cae y no se pudo renovar. | **Grupos y campañas → Ver** |
| `group.invite_link_renewed` | Se renueva el link de invitación de un grupo, solo o porque lo pediste. | **Grupos y campañas → Ver** |
| `group_action.completed` | Termina una acción sobre un grupo, como sumar participantes o cambiarle el nombre. | **Grupos y campañas → Ver** |
| `group_action.failed` | Falla entera una acción sobre un grupo. | **Grupos y campañas → Ver** |
| `campaign.status_changed` | Una de tus campañas de grupos se activa o se pausa. | **Grupos y campañas → Ver** |
| `campaign.no_groups_available` | Una de tus campañas no tiene grupos a los que llevar a quien entra por su link. | **Grupos y campañas → Ver** |
| `pipeline.finished` | Termina un pipeline de operaciones sobre grupos. | **Grupos y campañas → Ver** |
| `scheduled_message.finished` | Termina un envío programado a grupos, con su resultado. | **Grupos y campañas → Ver** |
| `scheduled_message.group_delivery_failed` | Un envío programado falla en un grupo. | **Grupos y campañas → Ver** |
| `scheduled_message.response_received` | Alguien responde a un envío programado: vota en una encuesta o responde a un evento de WhatsApp. | **Grupos y campañas → Ver** |
| `daily_report.generated` | Se genera el reporte diario de tu cuenta: clics, entradas y salidas. | **Grupos y campañas → Ver** |
| `contact.created` | Se crea un contacto nuevo. | **Contactos y conversaciones → Ver** |
| `contact.updated` | Cambian el nombre, el email, el teléfono o un campo personalizado de un contacto. | **Contactos y conversaciones → Ver** |
| `contact.tag_added` | Un contacto recibe una etiqueta. | **Contactos y conversaciones → Ver** |
| `contact.tag_removed` | Un contacto pierde una etiqueta. | **Contactos y conversaciones → Ver** |
| `conversation.assigned` | Una conversación queda asignada a una persona de tu equipo o a un agente de IA. | **Contactos y conversaciones → Ver** |
| `conversation.closed` | Una conversación se cierra. | **Contactos y conversaciones → Ver** |
| `contact.stage_changed` | Un contacto entra a un tablero, cambia de etapa o sale. | **Contactos y conversaciones → Ver** |
| `whatsapp_form.completed` | Un contacto completa un formulario de WhatsApp. | **Contactos y conversaciones → Ver** |
| `flow.completed` | Una automatización termina bien para un contacto. | **Contactos y conversaciones → Ver** |
| `flow.failed` | Una automatización termina por un error para un contacto. | **Contactos y conversaciones → Ver** |
| `mac.usage_80` | Llegas al 80 % de tus contactos activos del mes. | **Números de WhatsApp → Ver** |
| `mac.usage_100` | Agotas tus contactos activos del mes: empiezan 24 horas de gracia. | **Números de WhatsApp → Ver** |
| `account.blocked` | Tu cuenta queda bloqueada: pasaron las 24 horas de gracia después de agotar tus contactos activos. | **Números de WhatsApp → Ver** |
| `mac.expiring` | Tienes contactos activos que vencen en los próximos 7 días. | **Números de WhatsApp → Ver** |
| `billing.upcoming_charge` | Faltan unos días para el próximo cobro de tu suscripción. | **Números de WhatsApp → Ver** |
| `billing.payment_failed` | No se pudo cobrar tu suscripción. | **Números de WhatsApp → Ver** |
| `subscription.trial_ending` | Tu prueba termina en 1 a 3 días. | **Números de WhatsApp → Ver** |
| `subscription.cancellation_confirmed` | Se confirma la cancelación de tu suscripción. | **Números de WhatsApp → Ver** |
| `subscription.reactivated` | Se revierte la cancelación que tenías programada: tu suscripción sigue. | **Números de WhatsApp → Ver** |
| `subscription.dormant_ending` | Faltan unos 7 días para que termine el reposo de tu cuenta. | **Números de WhatsApp → Ver** |

Además del permiso para crear el webhook, la clave necesita, por cada evento de `events`, la casilla de su columna; si le falta, crear o editar el webhook responde `422`.

### `message.received`

Un contacto le escribió a un número de WhatsApp de la cuenta.

`device_id` es el número de tu cuenta que recibió el mensaje: el mismo `device_id` que mandas para responder por ese número. Es `null` si el mensaje no tiene número asociado.

Ejemplo:

```json
{
  "id": "evt_000000000000000000000001",
  "type": "message.received",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "message": {
      "id": "msg_ADyPfpgQyD89BoEabkSQkV1",
      "type": "text",
      "text": "Hola, quiero más información",
      "media": null
    },
    "contact": {
      "id": "ctc_ABViuUDF93I2VL1tInstRDG",
      "name": "Contacto de ejemplo",
      "phone": "+5491100000000"
    },
    "receiver": {
      "phone": "+5491100000001"
    },
    "device_id": "dev_AFHtaOVjNBTEWzCuDrmxMPP",
    "workspace_id": 37
  }
}
```

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

### `device.connected`

Uno de los números de WhatsApp de la cuenta quedó conectado: al escanear el código QR o al terminar el alta de un número de WhatsApp Cloud. Trae `device.connection` (`qr`, `coexistence` o `dedicated`), `device.external_reference` y `connect_link_id` (el link de alta que lo conectó, o null).

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "device.connected",
  "version": 1,
  "occurred_at": "2026-10-05T03:00:00Z",
  "data": {
    "device": {
      "id": "dev_AFHtaOVjNBTEWzCuDrmxMPP",
      "name": "Ventas",
      "number": "5491100000000",
      "connection": "qr",
      "external_reference": "cliente-42"
    },
    "connected_at": "2026-10-05T03:00:00Z",
    "connect_link_id": "lnk_AEF0eLF7bcRyfgK70NSWVdy",
    "workspace_id": 37
  }
}
```

### `device.disconnected`

Uno de los números de WhatsApp de la cuenta se desconectó y dejó de poder enviar o recibir. `reason` dice por qué: `qr_logged_out` (se cerró la sesión de un número por QR), `meta_account_not_registered` (un número oficial dejó de estar registrado en Meta y no se pudo volver a registrar solo), `shadow_ban_protection` (Funnelchat lo desconectó para protegerlo de un posible bloqueo), `disconnected_by_user` (alguien de la cuenta desconectó o borró los datos de un número oficial) o `unknown` (no se sabe por qué). Trae `device.connection`, `device.external_reference` y `connect_link_id` (el link de alta que conectó el número por última vez, o null).

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "device.disconnected",
  "version": 1,
  "occurred_at": "2026-10-05T03:00:00Z",
  "data": {
    "device": {
      "id": "dev_AFHtaOVjNBTEWzCuDrmxMPP",
      "name": "Ventas",
      "number": "5491100000000",
      "connection": "qr",
      "external_reference": "cliente-42"
    },
    "disconnected_at": "2026-10-05T03:00:00Z",
    "reason": "qr_logged_out",
    "connect_link_id": "lnk_AEF0eLF7bcRyfgK70NSWVdy",
    "workspace_id": 37
  }
}
```

### `group_participant.joined`

Una persona entró a un grupo del workspace; `campaign` es null si el grupo no es de una campaña, y sale como mucho uno por persona, grupo y día UTC en cada workspace (si la misma persona vuelve a entrar ese día, no sale otro).

Ejemplo:

```json
{
  "id": "evt_00000000000000000000000000000002",
  "type": "group_participant.joined",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "group": {
      "uid": "120363000000000001@g.us",
      "name": "Grupo de ejemplo"
    },
    "campaign": {
      "uuid": "xK9mQz"
    },
    "participant": {
      "identity": "5491100000000",
      "identity_type": "phone",
      "name": "Ana Pérez"
    },
    "workspace_id": 37
  }
}
```

### `group_participant.left`

Una persona salió de un grupo del workspace; `campaign` es null si el grupo no es de una campaña, y sale como mucho uno por persona, grupo y día UTC en cada workspace (si la misma persona vuelve a salir ese día, no sale otro).

Ejemplo:

```json
{
  "id": "evt_00000000000000000000000000000003",
  "type": "group_participant.left",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "group": {
      "uid": "120363000000000001@g.us",
      "name": "Grupo de ejemplo"
    },
    "campaign": {
      "uuid": "xK9mQz"
    },
    "participant": {
      "identity": "5491100000000",
      "identity_type": "phone",
      "name": "Ana Pérez"
    },
    "workspace_id": 37
  }
}
```

### `flow.completed`

Un contacto terminó un flujo de automatización.

Se envía una sola vez por cada ejecución de un flujo, cuando termina con éxito. No se envía si la ejecución se cortó, se canceló, quedó bloqueada o falló. `contact` es `null` si la ejecución no tiene un contacto asociado. Un flujo muy usado puede generar muchos eventos seguidos.

Ejemplo:

```json
{
  "id": "evt_000000000000000000000003",
  "type": "flow.completed",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "flow": {
      "id": "flw_AHRNv5zDGiU72BDvJYbeGRy",
      "name": "Flujo de ejemplo"
    },
    "contact": {
      "id": "ctc_ABViuUDF93I2VL1tInstRDG",
      "name": "Contacto de ejemplo",
      "phone": "+5491100000000"
    },
    "workspace_id": 37
  }
}
```

### `flow.failed`

La ejecución de un flujo para un contacto terminó por un error.

Se envía una sola vez por cada ejecución de un flujo que termina por un error, no porque llegó al final. `reason` indica el motivo y toma uno de estos valores: `node_missing` (el paso a ejecutar ya no existe), `unknown_node_type` (el paso es de un tipo no reconocido), `missing_subflow` (el flujo que debía ejecutarse dentro de otro ya no existe), `malformed_node` (el paso tiene una configuración dañada), `loop_detected` (la ejecución dio vueltas sin esperar nada) y `execution_error` (un error inesperado detuvo la ejecución). No se envía si la ejecución se canceló, quedó bloqueada o se cortó porque se editó el flujo o se unieron contactos. `contact` es `null` si la ejecución no tiene un contacto asociado.

Ejemplo:

```json
{
  "id": "evt_000000000000000000000013",
  "type": "flow.failed",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "flow": {
      "id": "flw_AHRNv5zDGiU72BDvJYbeGRy",
      "name": "Flujo de ejemplo"
    },
    "contact": {
      "id": "ctc_ABViuUDF93I2VL1tInstRDG",
      "name": "Contacto de ejemplo",
      "phone": "+5491100000000"
    },
    "reason": "execution_error",
    "workspace_id": 37
  }
}
```

### `contact.created`

Se creó un contacto nuevo en la cuenta.

Se envía un evento por cada contacto nuevo, sea cual sea el canal: un mensaje entrante, la creación manual, una importación o la API. No se envía cuando el contacto ya existía y sólo se actualiza, ni para los contactos que la plataforma crea para sus propias notificaciones. En importaciones grandes el límite de volumen de la cuenta puede descartar parte de los eventos.

Ejemplo:

```json
{
  "id": "evt_000000000000000000000010",
  "type": "contact.created",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "contact": {
      "id": "ctc_ABViuUDF93I2VL1tInstRDG",
      "name": "Contacto de ejemplo",
      "phone": "+5491100000000",
      "email": "contacto@example.com"
    },
    "workspace_id": 37
  }
}
```

### `contact.updated`

Cambió el nombre, el email, el teléfono o el valor de un campo personalizado de un contacto.

Se envía cuando cambia el nombre, el email o el teléfono de un contacto que ya existía, o cuando se pone, cambia o quita el valor de uno de sus campos personalizados, venga del panel, de la API, de un flujo o de una importación. Varios cambios del mismo contacto en una misma operación llegan en un solo evento. `changed` dice qué cambió (`name`, `email`, `phone`, `custom_fields`); `contact` trae el estado después del cambio y `custom_fields`, sólo los campos que cambiaron, con su valor nuevo (`null` si se quitó). No se envía al crear un contacto (eso es `contact.created`), por etiquetas, por el estado de la conversación ni si el valor nuevo es igual al anterior; tampoco al borrar un campo personalizado de la cuenta. En importaciones grandes el límite de volumen de la cuenta puede descartar parte de los eventos.

Ejemplo:

```json
{
  "id": "evt_000000000000000000000017",
  "type": "contact.updated",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "contact": {
      "id": "ctc_ABViuUDF93I2VL1tInstRDG",
      "name": "Ana Pérez",
      "phone": "+5491100000000",
      "email": "ana@example.com"
    },
    "changed": [
      "email",
      "custom_fields"
    ],
    "custom_fields": [
      {
        "id": "fld_AGxYus0ZuS8ViUElnapfBA0",
        "name": "Plan",
        "value": "Pro"
      },
      {
        "id": "fld_AGqBOqs9iRgOq0FfRAR8DxC",
        "name": "Ciudad",
        "value": null
      }
    ],
    "workspace_id": 37
  }
}
```

### `contact.tag_added`

Un contacto recibió una etiqueta.

Se envía un evento por cada contacto y etiqueta agregados, también en operaciones en bloque; no se envía si el contacto ya tenía la etiqueta. `source` indica el origen: manual, flow, bulk, import, sync, walink o ai. En operaciones en bloque grandes el límite de volumen de la cuenta puede descartar parte de los eventos.

Ejemplo:

```json
{
  "id": "evt_000000000000000000000006",
  "type": "contact.tag_added",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "contact": {
      "id": "ctc_ABViuUDF93I2VL1tInstRDG",
      "name": "Contacto de ejemplo",
      "phone": "+5491100000000"
    },
    "tag": {
      "id": "tag_AHCtI0e7I43AVkLJRpd7QBU",
      "name": "Etiqueta de ejemplo"
    },
    "source": "manual",
    "workspace_id": 37
  }
}
```

### `contact.tag_removed`

Un contacto perdió una etiqueta.

Se envía un evento por cada contacto y etiqueta quitados, también en operaciones en bloque; no se envía si el contacto no tenía la etiqueta. No se envía al borrar la etiqueta, al borrar o fusionar contactos ni al desvincular etiquetas de un tablero. `source` indica el origen: manual, flow, bulk o ai. En operaciones en bloque grandes el límite de volumen de la cuenta puede descartar parte de los eventos.

Ejemplo:

```json
{
  "id": "evt_000000000000000000000009",
  "type": "contact.tag_removed",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "contact": {
      "id": "ctc_ABViuUDF93I2VL1tInstRDG",
      "name": "Contacto de ejemplo",
      "phone": "+5491100000000"
    },
    "tag": {
      "id": "tag_AHCtI0e7I43AVkLJRpd7QBU",
      "name": "Etiqueta de ejemplo"
    },
    "source": "manual",
    "workspace_id": 37
  }
}
```

### `conversation.assigned`

Una conversación quedó asignada a una persona del equipo o a un agente de IA.

Se envía cuando una conversación queda asignada a una persona del equipo (`assignee.type` = `human`) o a un agente de IA (`assignee.type` = `ai`), por cualquier camino. `assignee` trae el tipo y el nombre, nunca un identificador. No se envía al desasignar, ni cuando se vuelve a enviar el mismo asignado.

Ejemplo:

```json
{
  "id": "evt_000000000000000000000005",
  "type": "conversation.assigned",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "contact": {
      "id": "ctc_ABViuUDF93I2VL1tInstRDG",
      "name": "Contacto de ejemplo",
      "phone": "+5491100000000"
    },
    "assignee": {
      "type": "human",
      "name": "Agente de ejemplo"
    },
    "workspace_id": 37
  }
}
```

### `conversation.closed`

Una conversación pasó a cerrada.

Se envía cuando una conversación pasa de abierta a cerrada. No se envía si la conversación ya estaba cerrada ni cuando se reabre.

Ejemplo:

```json
{
  "id": "evt_000000000000000000000004",
  "type": "conversation.closed",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "contact": {
      "id": "ctc_ABViuUDF93I2VL1tInstRDG",
      "name": "Contacto de ejemplo",
      "phone": "+5491100000000"
    },
    "workspace_id": 37
  }
}
```

### `message.reaction_failed`

Una reacción a un mensaje que se aceptó no se pudo aplicar.

Se emite cuando una reacción a un mensaje (ponerla, reemplazarla o quitarla) que se aceptó con `202` termina sin aplicarse, la haya pedido una clave o una persona del equipo desde el chat. Sale una sola vez por pedido: los reintentos internos del mismo pedido no generan otro evento. No se emite cuando la reacción se aplicó, cuando una reacción más nueva al mismo mensaje ya la reemplazó, ni cuando el mensaje ya no existe. `message_id` es el mensaje al que se reaccionaba (el mismo id de la ruta), `contact_id` el del contacto y `device_id` el número de tu cuenta por el que iba a salir (`null` si el mensaje ya no tiene número). `emoji` es el emoji pedido y `null` si el pedido era quitar la reacción. `reason` es uno de `no_provider_uid`, `message_not_reactable`, `message_deleted`, `device_disconnected`, `provider_unsupported`, `window_expired`, `provider_rejected`, `insufficient_balance`, `payment_expired`. `requested_at` es el momento en que se aceptó el pedido, en UTC y con microsegundos: sirve para relacionar el evento con la llamada que respondió `202`. `occurred_at` es el momento en que Funnelchat decidió el fallo, en UTC. Mientras tanto, `reactions` de `GET /contacts/{contact_id}/messages` queda como estaba.

Ejemplo:

```json
{
  "id": "evt_000000000000000000000016",
  "type": "message.reaction_failed",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "message_id": "msg_ADyPfpgQyD89BoEabkSQkV1",
    "contact_id": "ctc_ABViuUDF93I2VL1tInstRDG",
    "device_id": "dev_AFHtaOVjNBTEWzCuDrmxMPP",
    "emoji": "👍",
    "reason": "provider_rejected",
    "requested_at": "2026-10-01T11:59:58.123456Z",
    "occurred_at": "2026-10-01T12:00:00Z",
    "workspace_id": 37
  }
}
```

### `whatsapp_form.completed`

Un contacto completó un formulario de WhatsApp.

Se envía cuando un contacto completa un formulario, aunque la respuesta llegue tarde. Puede llegar más de una vez con el mismo `id`: deduplica por `id`. Si el contacto vuelve a enviar el mismo formulario, no se genera otro evento: queda la primera respuesta. Cada respuesta de texto llega con a lo sumo 600 caracteres. `form.id` es el formulario (el mismo `family_id` de la lectura de formularios) y `form.version_id` la versión que recibió el contacto. `answers` es una lista con una entrada por pregunta, en el orden del formulario: `key` es el nombre de la pregunta, `label` su etiqueta y `value` la respuesta (texto, número, `true` o `false`, una lista en las preguntas de varias opciones, o `null` si no la contestó). En las preguntas con opciones (desplegable, una opción o varias opciones), `value` es el `id` de la opción elegida, no su texto, y en las de varias opciones es la lista de los `id` de las opciones elegidas. Es el `id` de la opción en la definición de la versión (`GET /forms/{id}` con el `form.version_id` del evento): el editor del panel lo arma a partir del texto, como `op_comercio`, y lo conserva aunque después se cambie el texto. La lectura de respuestas (`GET /forms/families/{familyId}/responses`) muestra, en cambio, el texto de la opción. `message_id` es el id del mensaje del formulario y es `null` si el envío no tuvo un mensaje público; `device_id` es el número de WhatsApp por el que salió, o `null` si ya no es de la cuenta. `contact_id` es `null` si el contacto se eliminó antes de que saliera el evento (las respuestas llegan igual); si se fusionó con otro, es el id del contacto que quedó. Mientras se fusionan dos contactos, el id puede ser el del contacto que se está fusionando.

Ejemplo:

```json
{
  "id": "evt_000000000000000000000015",
  "type": "whatsapp_form.completed",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "form": {
      "id": "frm_AEAavCl0oCLKurVTAWV1dKD",
      "name": "Captar un lead",
      "version_id": "frv_AF3C68ZrbX0c1icxklnbrNj"
    },
    "message_id": "msg_ADyPfpgQyD89BoEabkSQkV1",
    "contact_id": "ctc_ABViuUDF93I2VL1tInstRDG",
    "device_id": "dev_AG6iwMxyc4WxmgUpetEODBp",
    "answers": [
      {
        "key": "nombre",
        "label": "Nombre",
        "value": "Contacto de ejemplo"
      },
      {
        "key": "intereses",
        "label": "Intereses",
        "value": [
          "op_a",
          "op_b"
        ]
      },
      {
        "key": "comentarios",
        "label": "Comentarios",
        "value": null
      }
    ],
    "occurred_at": "2026-10-01T12:00:00Z",
    "workspace_id": 37
  }
}
```

### `broadcast.finished`

Una campaña llegó a su estado final (enviada, fallida o con fallos parciales), con sus conteos.

`status` es `success`, `failed` o `partially_failed`. `reason` dice por qué terminó: `completed` (se enviaron todas las páginas), `cancelled` (se cerró una campaña pausada), `template_rejected` (Meta rechazó la plantilla, o su categoría cambió, mientras la campaña esperaba; también cuando Meta la pausó durante el envío y se detuvo la campaña), `approval_expired` (la plantilla no se aprobó a tiempo), `manual_start_expired` (la plantilla se aprobó tarde, la campaña quedó lista para comenzarla a mano y nadie la comenzó), `mac_lockout` (la cuenta alcanzó su límite de contactos activos), `mac_check_unavailable` (la campaña la inició una API key y el límite de contactos activos no se pudo verificar, así que no se envió nada), `no_recipients` (la audiencia quedó vacía) o `error` (el envío no pudo despacharse). `totals` son los conteos del envío: `processed` (destinatarios procesados), `failed` y `skipped_unreachable` (destinatarios que el canal no puede alcanzar); valen 0 si la campaña terminó antes de enviar. Se emite una sola vez por campaña.

Ejemplo:

```json
{
  "id": "evt_000000000000000000000011",
  "type": "broadcast.finished",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "broadcast": {
      "id": "bcs_AFtl3CxBdRN2u8fHLFfw7HG",
      "name": "Campaña de ejemplo"
    },
    "status": "partially_failed",
    "reason": "completed",
    "totals": {
      "processed": 1200,
      "failed": 30,
      "skipped_unreachable": 12
    },
    "workspace_id": 37
  }
}
```

### `broadcast.paused`

Una campaña se pausó sola, por ejemplo porque bajó la calidad del número.

`reason` es `quality_degraded` (la calidad del número bajó respecto de la del inicio, o llegó a RED), `quality_unreadable` (no se pudo leer la calidad en tres controles seguidos), `template_unavailable` (Meta dejó la plantilla en `PAUSED`, `DISABLED` o `REJECTED` antes de una tanda), `payment_issue` (el 2 % o más de los envíos de la misma campaña, con un mínimo de 20 envíos, fueron rechazados por Meta con el código 131042, un problema de pago o de facturación de la cuenta de WhatsApp Business; el 2 % y el mínimo de 20 envíos son los valores por defecto y se pueden configurar; aplica a cualquier campaña, tenga o no envío inteligente; no frena el número; al reanudar la campaña el conteo, incluidos los envíos que cuentan, vuelve a empezar de cero) o `rejection_rate` (entre los envíos recientes de la propia campaña, por defecto las últimas 24 horas, Meta rechazó una proporción igual o mayor al umbral configurable, por defecto 15 %, con los códigos que indican una restricción de la cuenta o del número; la lista es configurable y por defecto es 131048, 131031 y 368; los códigos 131049 y 131026 no pausan la campaña). Con `rejection_rate` llega además `rejection`: `codes` (los que llegaron a su umbral: hoy `failed`), `rates` (el porcentaje de cada uno; las tasas de `131049` y `131026` se informan como dato aunque no pausen), `attempts` (los envíos medidos) y `window_hours`. `quality` y `quality_baseline` son la calidad de Meta leída en el control y la del inicio del envío (`GREEN`, `YELLOW`, `RED`), o `null` si no se pudo leer, y siempre `null` en una difusión sin envío inteligente. `template` es `{name, status}` con el nombre de la plantilla y su estado en Meta cuando `reason` es `template_unavailable`, y `null` en las demás pausas (por calidad, pago o rechazos). Con `rejection_rate` el número además queda frenado 7 días (configurable): mientras dure no se pueden crear, ejecutar ni reanudar campañas desde ese número, ni mandar plantillas a contactos que no le escribieron en las últimas 24 horas, y solo soporte lo levanta antes. Las pausas por calidad, por plantilla y por rechazos son solo de las campañas con envío inteligente; la pausa por `payment_issue` puede ocurrir en cualquier campaña. Reanudar la campaña y que se pause otra vez emite otro evento.

Ejemplo:

```json
{
  "id": "evt_000000000000000000000007",
  "type": "broadcast.paused",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "broadcast": {
      "id": "bcs_AFtl3CxBdRN2u8fHLFfw7HG",
      "name": "Campaña de ejemplo"
    },
    "reason": "quality_degraded",
    "quality": "YELLOW",
    "quality_baseline": "GREEN",
    "template": null,
    "workspace_id": 37
  }
}
```

### `contact.stage_changed`

Un contacto cambió de etapa en un tablero.

Se envía un evento por cada contacto que cambia de etapa en un tablero por etapas. `kind` es entry (entra al tablero, `from_stage` es null), move (pasa de una etapa a otra), exit (sale del tablero, `to_stage` es null) o stage_deleted (se reubica porque su etapa se borró; el nombre de la etapa borrada es null). No se envía si el contacto se coloca en la etapa en la que ya estaba.

Ejemplo:

```json
{
  "id": "evt_000000000000000000000008",
  "type": "contact.stage_changed",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "contact": {
      "id": "ctc_ABViuUDF93I2VL1tInstRDG",
      "name": "Contacto de ejemplo",
      "phone": "+5491100000000"
    },
    "board": {
      "id": "knb_AAh33Y12B0FvNpBstLof4aN",
      "name": "Embudo de ejemplo"
    },
    "kind": "move",
    "from_stage": {
      "id": "stg_AFQNmQUExx0MW4DNcQd3h0a",
      "name": "Nuevo",
      "position": 0
    },
    "to_stage": {
      "id": "stg_ABqN4Z04rHLYk42OiiXd6BT",
      "name": "En seguimiento",
      "position": 1
    },
    "workspace_id": 37
  }
}
```

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

### `daily_report.generated`

Se generó el reporte diario de la cuenta (clics, ingresos y salidas).

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "daily_report.generated",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "period": {
      "date": "2026-10-01",
      "timezone": "America/Argentina/Buenos_Aires"
    },
    "clicks": 120,
    "joins": 80,
    "leaves": 10,
    "conversion_rate": 0.67,
    "workspace_id": 37
  }
}
```

### `group.blocked`

Un grupo de una campaña quedó inoperable: sin administrador conectado, con el link de invitación inválido o suspendido por WhatsApp; un grupo que no es de una campaña no lo genera.

Ejemplo:

```json
{
  "id": "evt_00000000000000000000000000000005",
  "type": "group.blocked",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "group": {
      "uid": "120363000000000001@g.us",
      "name": "Grupo de ejemplo"
    },
    "campaign": {
      "uuid": "xK9mQz"
    },
    "reason": "admin_access_lost",
    "workspace_id": 37
  }
}
```

### `group.created`

Se creó o se importó un grupo dentro de una campaña del workspace; `source` vale `imported` si el grupo ya existía en WhatsApp y entró por una importación o una sincronización, y `created` en cualquier otro caso.

Ejemplo:

```json
{
  "id": "evt_00000000000000000000000000000001",
  "type": "group.created",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "group": {
      "uid": "120363000000000001@g.us",
      "name": "Grupo de ejemplo",
      "type": "group"
    },
    "campaign": {
      "uuid": "xK9mQz",
      "name": "Campaña de ejemplo"
    },
    "source": "created",
    "workspace_id": 37
  }
}
```

### `group.full`

Un grupo pasó de no estar lleno a estarlo.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "group.full",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "group": {
      "uid": "120363000000000000@g.us",
      "name": "Grupo de ejemplo",
      "type": "tipo_de_ejemplo"
    },
    "campaign": {
      "uuid": "xK9mQz",
      "name": "Campaña de ejemplo"
    },
    "trigger": "participants_limit",
    "participants": 1024,
    "workspace_id": 37
  }
}
```

### `group.invite_link_down`

El enlace de invitación de un grupo quedó confirmado caído (WhatsApp respondió que no existe y la renovación no consiguió otro); no se publica por errores transitorios ni por grupos prohibidos o suspendidos, y se publica una sola vez por episodio de bloqueo.

Ejemplo:

```json
{
  "id": "evt_0000000000000000000000000000000d",
  "type": "group.invite_link_down",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "group": {
      "uid": "120363000000000001@g.us",
      "name": "Grupo de ejemplo",
      "type": "group"
    },
    "campaign": {
      "uuid": "xK9mQz",
      "name": "Campaña de ejemplo"
    },
    "reason": "http_404",
    "renewal_attempted": true,
    "workspace_id": 37
  }
}
```

### `group.invite_link_renewed`

El enlace de invitación de un grupo cambió por una renovación, automática al detectarse inválido o pedida por el usuario; no se publican los cambios que detecta la sincronización ni el enlace inicial al crear el grupo.

Ejemplo:

```json
{
  "id": "evt_0000000000000000000000000000000c",
  "type": "group.invite_link_renewed",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "group": {
      "uid": "120363000000000001@g.us",
      "name": "Grupo de ejemplo",
      "type": "group"
    },
    "campaign": {
      "uuid": "xK9mQz",
      "name": "Campaña de ejemplo"
    },
    "invite_link": "https://chat.whatsapp.com/EjemploNuevo0000000000001",
    "previous_invite_link": "https://chat.whatsapp.com/EjemploAnterior000000000001",
    "trigger": "automatic",
    "recovered": false,
    "workspace_id": 37
  }
}
```

### `group.message_received`

Una persona escribió un mensaje en un grupo.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "group.message_received",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "group": {
      "uid": "120363000000000000@g.us",
      "name": "Grupo de ejemplo"
    },
    "participant": {
      "identity": "5491100000000",
      "identity_type": "phone",
      "name": "Ana Ejemplo"
    },
    "message": {
      "uid": "msg-ejemplo-01",
      "type": "text",
      "text": "Hola a todos",
      "caption": null,
      "media_url": null,
      "mime_type": null,
      "file_name": null,
      "quoted_uid": null
    },
    "workspace_id": 37
  }
}
```

### `group.reaction_added`

Una persona reaccionó a un mensaje de un grupo.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "group.reaction_added",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "group": {
      "uid": "120363000000000000@g.us",
      "name": "Grupo de ejemplo"
    },
    "participant": {
      "identity": "5491100000000",
      "identity_type": "phone",
      "name": "Ana Ejemplo"
    },
    "message": {
      "uid": "msg-ejemplo-01"
    },
    "reaction": "👍",
    "workspace_id": 37
  }
}
```

### `group.recovered`

Un grupo de una campaña que estaba bloqueado volvió a operar; un grupo que no es de una campaña no lo genera.

Ejemplo:

```json
{
  "id": "evt_00000000000000000000000000000006",
  "type": "group.recovered",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "group": {
      "uid": "120363000000000001@g.us",
      "name": "Grupo de ejemplo"
    },
    "campaign": {
      "uuid": "xK9mQz"
    },
    "reason": "access_restored",
    "workspace_id": 37
  }
}
```

### `group_action.completed`

Terminó una acción sobre un grupo. `action.uuid` es el mismo `action_id` que devolvió la API al pedirla, y `action.type` dice qué acción fue. `result` depende del tipo de acción: en las que reciben una lista de teléfonos (agregar o quitar participantes, nombrar o quitar administradores) trae `participants`, con el resultado por persona: `identity`, `identity_type`, `status` (`added`, `removed`, `promoted` o `demoted` según la acción, o `failed`) y `reason`, que es `null` salvo cuando `status` es `failed`; al crear un grupo o renovar su link de invitación trae `invite_link`; al enviar un mensaje trae `message.uid`; en las demás (cambiar el nombre, la descripción, la foto o los ajustes) viene como objeto vacío (`{}`). `group` y `campaign` pueden venir `null`.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "group_action.completed",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "action": {
      "uuid": "00000000-0000-4000-8000-000000000001",
      "type": "add_participants"
    },
    "group": {
      "uid": "120363000000000000@g.us",
      "name": "Grupo de ejemplo"
    },
    "campaign": {
      "uuid": "xK9mQz",
      "name": "Campaña de ejemplo"
    },
    "result": {
      "participants": [
        {
          "identity": "5491100000000",
          "identity_type": "phone",
          "status": "added",
          "reason": null
        }
      ]
    },
    "workspace_id": 37
  }
}
```

### `group_action.failed`

Una acción sobre un grupo falló entera (si terminó con resultados por persona, llega `group_action.completed`). Si la pidió la API, `action.uuid` es el mismo `action_id` que devolvió al pedirla y `pipeline` viene `null`. Si la ejecutó una campaña o un pipeline, `action.uuid` viene `null`, y `pipeline` trae ese pipeline (`uuid` y `name`) o viene `null` fuera de un pipeline. `reason` es el motivo de la falla. `group` y `campaign` pueden venir `null`.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "group_action.failed",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "campaign": {
      "uuid": "xK9mQz",
      "name": "Campaña de ejemplo"
    },
    "pipeline": null,
    "group": {
      "uid": "120363000000000000@g.us",
      "name": "Grupo de ejemplo"
    },
    "action": {
      "uuid": "00000000-0000-4000-8000-000000000001",
      "type": "add_participants"
    },
    "reason": "motivo_de_ejemplo",
    "workspace_id": 37
  }
}
```

### `group_join_request.created`

Una persona pidió unirse a un grupo oficial que pide aprobación para entrar, y su solicitud quedó pendiente. Si el grupo es de una campaña, también llega a las suscripciones filtradas por esa campaña. Se aprueba o rechaza por API con el teléfono de la persona, cuando el número anuncia `groups.join_requests` en `"list_and_decide"`; el resultado por persona llega en `group_action.completed`.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "group_join_request.created",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "group": {
      "uid": "120363000000000000@g.us",
      "name": "Grupo de ejemplo"
    },
    "participant": {
      "identity": "5491100000000",
      "identity_type": "phone",
      "name": "Ana Ejemplo"
    },
    "workspace_id": 37
  }
}
```

### `group_join_request.revoked`

Una persona retiró su solicitud pendiente para unirse a un grupo antes de que se aprobara o rechazara. Trae los mismos campos que `group_join_request.created`.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "group_join_request.revoked",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "group": {
      "uid": "120363000000000000@g.us",
      "name": "Grupo de ejemplo"
    },
    "participant": {
      "identity": "5491100000000",
      "identity_type": "phone",
      "name": "Ana Ejemplo"
    },
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

### `poll.voted`

Un participante votó en una encuesta enviada a un grupo, o cambió su voto.

Ejemplo:

```json
{
  "id": "evt_0000000000000000000000000000000b",
  "type": "poll.voted",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "poll": {
      "uid": "3EB0000000000000000001"
    },
    "group": {
      "uid": "120363000000000001@g.us"
    },
    "scheduled_message": {
      "uuid": "00000000-0000-4000-8000-000000000004"
    },
    "participant": {
      "identity": "5491100000000",
      "identity_type": "phone",
      "name": null
    },
    "options": [
      "Opción A"
    ],
    "workspace_id": 37
  }
}
```

### `scheduled_message.finished`

Un envío programado terminó, con su resultado agregado.

Ejemplo:

```json
{
  "id": "evt_00000000000000000000000000000004",
  "type": "scheduled_message.finished",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "scheduled_message": {
      "uuid": "00000000-0000-4000-8000-000000000004",
      "name": "Envío de ejemplo"
    },
    "outcome": "partially_failed",
    "groups": {
      "total": 10,
      "failed": 1,
      "partially_failed": 2
    },
    "occurrence": 1,
    "workspace_id": 37
  }
}
```

### `scheduled_message.group_delivery_failed`

Un envío programado falló en un grupo concreto, con el motivo desagregado.

Ejemplo:

```json
{
  "id": "evt_00000000000000000000000000000007",
  "type": "scheduled_message.group_delivery_failed",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "scheduled_message": {
      "uuid": "00000000-0000-4000-8000-000000000007"
    },
    "group": {
      "uid": "120363000000000001@g.us",
      "name": "Grupo de ejemplo"
    },
    "reason": "device_disconnected",
    "partial": false,
    "occurrence": 1,
    "workspace_id": 37
  }
}
```

### `scheduled_message.response_received`

Alguien respondió a un envío programado votando una encuesta o respondiendo a un evento.

Ejemplo:

```json
{
  "id": "evt_00000000000000000000000000000008",
  "type": "scheduled_message.response_received",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "scheduled_message": {
      "uuid": "00000000-0000-4000-8000-000000000008"
    },
    "group": {
      "uid": "120363000000000001@g.us"
    },
    "participant": {
      "identity": "5491100000000",
      "identity_type": "phone",
      "name": "Ana Pérez"
    },
    "response": {
      "type": "poll",
      "options": [
        "Opción A"
      ],
      "rsvp": null
    },
    "workspace_id": 37
  }
}
```

### `account.blocked`

La cuenta, o un workspace con facturación propia, quedó bloqueada por consumo: terminó la gracia de 24 horas tras agotar los contactos activos mensuales sin que se regularizara. El bloqueo de la cuenta llega al workspace por defecto; el de un workspace con facturación propia, a ese workspace.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "account.blocked",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "reason": "mac_grace_expired",
    "grace_started_at": "2026-10-01T12:00:00Z",
    "grace_expired_at": "2026-10-02T12:00:00Z",
    "workspace_id": 37
  }
}
```

### `billing.payment_failed`

Un cobro de la suscripción no pudo procesarse (solo suscripciones de Stripe). Se emite una vez por factura (el primer intento fallido); no se repite en los reintentos de cobro. No incluye las recargas de IA. Llega al workspace que paga esa factura: el workspace con facturación propia, o el workspace por defecto si la factura es de la cuenta.

`data` trae `amount_cents` (el monto del cobro, en centavos), `currency` (el código de su moneda) y `workspace_id`. Esta documentación no muestra su ejemplo porque lleva un monto de la suscripción.

### `billing.upcoming_charge`

Se acerca el próximo cobro de la suscripción (solo suscripciones de Stripe); el evento llega unos días antes de la fecha de cobro. Llega al workspace que paga esa suscripción: el workspace con facturación propia, o el workspace por defecto si es la de la cuenta.

`data` trae `charge_date` (la fecha del cobro), `amount_cents` (el monto, en centavos), `currency` (el código de su moneda) y `workspace_id`. Esta documentación no muestra su ejemplo porque lleva un monto de la suscripción.

### `device.deleted`

Uno de los números de WhatsApp de la cuenta se borró y liberó su lugar en el plan (desde el panel, la API o porque un link de alta venció sin conectarlo). Un número oficial deja de recibir mensajes en Funnelchat, pero sigue registrado en Meta; a uno por QR se le cierra la sesión. Trae `connect_link_id` (el link de alta que conectó el número por última vez, o null).

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "device.deleted",
  "version": 1,
  "occurred_at": "2026-10-05T03:00:00Z",
  "data": {
    "device": {
      "id": "dev_AFHtaOVjNBTEWzCuDrmxMPP",
      "name": "Ventas",
      "number": "5491100000000",
      "connection": "qr",
      "external_reference": "cliente-42"
    },
    "deleted_at": "2026-10-05T03:00:00Z",
    "connect_link_id": "lnk_AEF0eLF7bcRyfgK70NSWVdy",
    "workspace_id": 37
  }
}
```

### `device.display_name_reviewed`

Meta aprobó (`decision`: `approved`) o rechazó (`rejected`) el nombre visible de uno de los números oficiales de la cuenta. Trae el estado anterior y el nuevo, tal cual los manda Meta (`previous_status`; `status`: `APPROVED` o `DECLINED`), el nombre visible actual (`verified_name`) y, en un rechazo, el motivo que da Meta en su evento (`rejection_reason`), o null si Meta no lo informa. Sale una vez por revisión. Trae `connect_link_id` (el link de alta que conectó el número por última vez, o null).

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "device.display_name_reviewed",
  "version": 1,
  "occurred_at": "2026-10-05T03:00:00Z",
  "data": {
    "device": {
      "id": "dev_AF5nfjTpKD2vAeKXd1JlVOh",
      "name": "Soporte",
      "number": "5491100000000",
      "connection": "dedicated",
      "external_reference": "cliente-42"
    },
    "decision": "approved",
    "previous_status": "PENDING_REVIEW",
    "status": "APPROVED",
    "verified_name": "Soporte Lucky Shrub",
    "rejection_reason": null,
    "reviewed_at": "2026-10-05T03:00:00Z",
    "connect_link_id": null,
    "workspace_id": 37
  }
}
```

### `device.health_changed`

Cambió el estado de envío de uno de los números oficiales de la cuenta, según Meta: `available`, `limited`, `blocked` o `unknown` (`previous_state` y `state`). Sale solo cuando el estado cambia, no con cada evento de Meta. El motivo se consulta en `GET api/v1/devices/{device}/health`. Trae `connect_link_id` (el link de alta que conectó el número por última vez, o null).

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "device.health_changed",
  "version": 1,
  "occurred_at": "2026-10-05T03:00:00Z",
  "data": {
    "device": {
      "id": "dev_AF5nfjTpKD2vAeKXd1JlVOh",
      "name": "Soporte",
      "number": "5491100000000",
      "connection": "dedicated",
      "external_reference": "cliente-42"
    },
    "previous_state": "available",
    "state": "limited",
    "changed_at": "2026-10-05T03:00:00Z",
    "connect_link_id": null,
    "workspace_id": 37
  }
}
```

### `device.messaging_limit_changed`

Cambió el límite de mensajes que Meta le da a uno de los números oficiales de la cuenta: cuántas personas distintas se pueden contactar por día con mensajes que inicia la empresa (`previous` y `current`, tal cual los manda Meta: `TIER_250`, `TIER_1K`, `TIER_2K`, `TIER_10K`, `TIER_100K` o `TIER_UNLIMITED`). Meta fija el límite para todos los números de una misma empresa: llega un evento por cada número de la cuenta que cambió. Sale una vez por cambio y no sale cuando el número todavía no tiene límite asignado (`TIER_NOT_SET`). Trae `connect_link_id` (el link de alta que conectó el número por última vez, o null).

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "device.messaging_limit_changed",
  "version": 1,
  "occurred_at": "2026-10-05T03:00:00Z",
  "data": {
    "device": {
      "id": "dev_AF5nfjTpKD2vAeKXd1JlVOh",
      "name": "Soporte",
      "number": "5491100000000",
      "connection": "dedicated",
      "external_reference": "cliente-42"
    },
    "previous": "TIER_1K",
    "current": "TIER_10K",
    "changed_at": "2026-10-05T03:00:00Z",
    "connect_link_id": null,
    "workspace_id": 37
  }
}
```

### `device.quality_changed`

Cambió la calidad que Meta le da a uno de los números oficiales de la cuenta (`previous` y `current`, tal cual los manda Meta: `GREEN`, `YELLOW` o `RED`). Si la calidad baja, conviene frenar los envíos de ese número antes de que Meta lo limite. Sale una vez por cambio, no con cada evento de Meta, y no sale cuando Meta no tiene datos de calidad (`NA` o `UNKNOWN`). Trae `connect_link_id` (el link de alta que conectó el número por última vez, o null).

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "device.quality_changed",
  "version": 1,
  "occurred_at": "2026-10-05T03:00:00Z",
  "data": {
    "device": {
      "id": "dev_AF5nfjTpKD2vAeKXd1JlVOh",
      "name": "Soporte",
      "number": "5491100000000",
      "connection": "dedicated",
      "external_reference": "cliente-42"
    },
    "previous": "GREEN",
    "current": "YELLOW",
    "changed_at": "2026-10-05T03:00:00Z",
    "connect_link_id": null,
    "workspace_id": 37
  }
}
```

### `mac.expiring`

Hay contactos activos mensuales que vencen en los próximos 7 días. Llega un evento por pool: el de la cuenta al workspace por defecto, y el de cada workspace con facturación propia a ese workspace, con sus contactos.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "mac.expiring",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "contacts_expiring": 1200,
    "expires_at": "2026-10-08T03:00:00Z",
    "workspace_id": 37
  }
}
```

### `mac.usage_100`

La cuenta agotó sus contactos activos mensuales del ciclo; se abre una gracia de 24 horas cuyo vencimiento viaja en `grace_expires_at`. `workspace_id` es el workspace al que se rutea el evento, como en todos los eventos: el workspace con facturación propia cuyo pool se agotó, o el workspace por defecto cuando el pool es el de la cuenta.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "mac.usage_100",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "used": 10000,
    "limit": 10000,
    "percentage": 100,
    "cycle_started_at": "2026-10-01T00:00:00Z",
    "grace_expires_at": "2026-10-02T12:00:00Z",
    "workspace_id": 37
  }
}
```

### `mac.usage_80`

La cuenta alcanzó el 80% de sus contactos activos mensuales del ciclo. `workspace_id` es el workspace al que se rutea el evento, como en todos los eventos: el workspace con facturación propia cuyo pool alcanzó el umbral, o el workspace por defecto cuando el pool es el de la cuenta.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "mac.usage_80",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "used": 8000,
    "limit": 10000,
    "percentage": 80,
    "cycle_started_at": "2026-10-01T00:00:00Z",
    "workspace_id": 37
  }
}
```

### `subscription.cancellation_confirmed`

Quedó confirmada la cancelación de la suscripción (solo suscripciones de Stripe): se conserva el acceso hasta la fecha indicada. Llega al workspace de esa suscripción: el workspace con facturación propia, o el workspace por defecto si es la de la cuenta.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "subscription.cancellation_confirmed",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "access_until": "2026-11-05T00:00:00Z",
    "workspace_id": 37
  }
}
```

### `subscription.dormant_ending`

El período de cuenta en reposo está por terminar (el evento llega unos 7 días antes); en esa fecha se intenta el cobro indicado. Llega al workspace por defecto, salvo que el período sea de un workspace con facturación propia.

`data` trae `charge_date` (la fecha en que se intenta el cobro), `amount_cents` (el monto, en centavos), `currency` (el código de su moneda) y `workspace_id`. Esta documentación no muestra su ejemplo porque lleva un monto de la suscripción.

### `subscription.reactivated`

Se revirtió la cancelación programada de la suscripción (solo suscripciones de Stripe): sigue vigente y se renueva en la fecha indicada. Llega al workspace de esa suscripción: el workspace con facturación propia, o el workspace por defecto si es la de la cuenta.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "subscription.reactivated",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "renews_at": "2026-11-05T00:00:00Z",
    "workspace_id": 37
  }
}
```

### `subscription.trial_ending`

El período de prueba está por terminar; el evento llega entre 1 y 3 días antes del final, según cómo se contrató (en las suscripciones de Stripe, el evento de Stripe). Llega al workspace de esa suscripción: el workspace con facturación propia, o el workspace por defecto si es la de la cuenta.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "subscription.trial_ending",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "trial_ends_at": "2026-10-04T00:00:00Z",
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

## Verificar la firma

La cabecera `X-Funnelchat-Signature` trae `t=<unix>,v1=<hex>`. `v1` es el HMAC-SHA256, en hexadecimal, de `"<t>.<cuerpo crudo>"` con el secreto completo de la suscripción (con su prefijo `whsec_`). Calcúlalo sobre el cuerpo tal como llegó, antes de parsear el JSON, compáralo en tiempo constante y rechaza si `t` está a más de 300 segundos de la hora actual. Estas funciones están probadas contra la fórmula:

**Node.js:**

```js
// Verifica la cabecera X-Funnelchat-Signature de una entrega de webhook (Node.js 16+).
// cuerpoCrudo: el cuerpo tal como llegó (Buffer o string), sin parsear ni volver a serializar.
// secreto: el secreto completo de la suscripción, tal como se mostró al crearla o rotarla.
const crypto = require('node:crypto');

function verificarFirma(cuerpoCrudo, cabecera, secreto, toleranciaSegundos = 300) {
  if (typeof cabecera !== 'string' || typeof secreto !== 'string' || secreto === '') return false;

  let t = null;
  const firmas = [];
  for (const parte of cabecera.split(',')) {
    const i = parte.indexOf('=');
    if (i === -1) continue;
    const clave = parte.slice(0, i).trim();
    const valor = parte.slice(i + 1).trim();
    if (clave === 't') t = valor;
    if (clave === 'v1') firmas.push(valor);
  }
  if (t === null || !/^\d+$/.test(t) || firmas.length === 0) return false;

  // Rechaza entregas viejas o del futuro (protección contra repeticiones).
  if (Math.abs(Math.floor(Date.now() / 1000) - Number(t)) > toleranciaSegundos) return false;

  const esperada = crypto
    .createHmac('sha256', secreto)
    .update(`${t}.`)
    .update(cuerpoCrudo)
    .digest('hex');
  const a = Buffer.from(esperada, 'utf8');

  return firmas.some((v1) => {
    const b = Buffer.from(v1, 'utf8');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

module.exports = { verificarFirma };

// Uso con Express: lee el cuerpo crudo, verifica, y recién después parsea.
// app.post('/hooks/funnelchat', express.raw({ type: 'application/json' }), (req, res) => {
//   if (!verificarFirma(req.body, req.get('X-Funnelchat-Signature'), process.env.FUNNELCHAT_WEBHOOK_SECRET)) {
//     return res.sendStatus(400);
//   }
//   const evento = JSON.parse(req.body.toString('utf8')); // toma type e id de acá, no de las cabeceras
//   res.sendStatus(200); // responde rápido; procesa después
// });
```

**Python:**

```python
# Verifica la cabecera X-Funnelchat-Signature de una entrega de webhook (Python 3.8+).
# cuerpo_crudo: los bytes del cuerpo tal como llegaron, sin parsear ni volver a serializar.
# secreto: el secreto completo de la suscripción, tal como se mostró al crearla o rotarla.
import hashlib
import hmac
import time

def verificar_firma(cuerpo_crudo: bytes, cabecera: str, secreto: str, tolerancia_segundos: int = 300) -> bool:
    if not isinstance(cabecera, str) or not isinstance(secreto, str) or not secreto:
        return False

    t = None
    firmas = []
    for parte in cabecera.split(","):
        clave, separador, valor = parte.partition("=")
        if not separador:
            continue
        clave, valor = clave.strip(), valor.strip()
        if clave == "t":
            t = valor
        elif clave == "v1":
            firmas.append(valor)
    if t is None or not t.isdigit() or not firmas:
        return False

    # Rechaza entregas viejas o del futuro (protección contra repeticiones).
    if abs(int(time.time()) - int(t)) > tolerancia_segundos:
        return False

    esperada = hmac.new(secreto.encode("utf-8"), t.encode("ascii") + b"." + cuerpo_crudo, hashlib.sha256).hexdigest()
    return any(hmac.compare_digest(esperada, v1) for v1 in firmas)

# Uso con Flask: lee el cuerpo crudo, verifica, y recién después parsea.
# @app.post("/hooks/funnelchat")
# def recibir():
#     cuerpo = request.get_data()  # bytes crudos
#     if not verificar_firma(cuerpo, request.headers.get("X-Funnelchat-Signature", ""), os.environ["FUNNELCHAT_WEBHOOK_SECRET"]):
#         return "", 400
#     evento = json.loads(cuerpo)  # toma type e id de acá, no de las cabeceras
#     return "", 200  # responde rápido; procesa después
```

**PHP:**

```php
<?php
// Verifica la cabecera X-Funnelchat-Signature de una entrega de webhook (PHP 8.0+).
// $cuerpoCrudo: el cuerpo tal como llegó (file_get_contents('php://input')), sin volver a codificar.
// $secreto: el secreto completo de la suscripción, tal como se mostró al crearla o rotarla.

function verificarFirma(string $cuerpoCrudo, string $cabecera, string $secreto, int $toleranciaSegundos = 300): bool
{
    if ($secreto === '') {
        return false;
    }

    $t = null;
    $firmas = [];
    foreach (explode(',', $cabecera) as $parte) {
        $i = strpos($parte, '=');
        if ($i === false) {
            continue;
        }
        $clave = trim(substr($parte, 0, $i));
        $valor = trim(substr($parte, $i + 1));
        if ($clave === 't') {
            $t = $valor;
        } elseif ($clave === 'v1') {
            $firmas[] = $valor;
        }
    }
    if ($t === null || ! ctype_digit($t) || $firmas === []) {
        return false;
    }

    // Rechaza entregas viejas o del futuro (protección contra repeticiones).
    if (abs(time() - (int) $t) > $toleranciaSegundos) {
        return false;
    }

    $esperada = hash_hmac('sha256', $t.'.'.$cuerpoCrudo, $secreto);
    foreach ($firmas as $v1) {
        if (hash_equals($esperada, $v1)) {
            return true;
        }
    }

    return false;
}

// Uso:
// $cuerpo = file_get_contents('php://input');
// if (! verificarFirma($cuerpo, $_SERVER['HTTP_X_FUNNELCHAT_SIGNATURE'] ?? '', (string) getenv('FUNNELCHAT_WEBHOOK_SECRET'))) {
//     http_response_code(400);
//     exit;
// }
// $evento = json_decode($cuerpo, true); // toma type e id de acá, no de las cabeceras
// http_response_code(200); // responde rápido; procesa después
```

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
