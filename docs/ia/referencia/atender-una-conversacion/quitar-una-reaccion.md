# Quitar una reacción — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/atender-una-conversacion/quitar-una-reaccion/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Quitar una reacción

`DELETE /api/v1/contacts/{contact}/messages/{message}/reaction` · permiso **Contactos y conversaciones → Enviar** · área conversations · `operationId` `messageReaction.destroy`

**Para qué sirve:** Sirve para quitar la reacción que pusiste en un mensaje.

Quita la reacción de tu cuenta a un mensaje del contacto. Si el mensaje no tenía una reacción tuya, la respuesta es la misma.

- **Se procesa después:** `202` sin cuerpo quiere decir que la reacción se aceptó, no que ya se aplicó. Se envía a WhatsApp desde una cola y queda aplicada solo cuando WhatsApp la confirma.
- **Cómo saber el resultado:** la reacción vigente de cada mensaje está en `reactions` de `GET /contacts/{contact_id}/messages`; la de tu cuenta viene con `actor` `business`. Ese dato cambia solo cuando WhatsApp confirma la reacción.
- **Si falla después del `202`** (por ejemplo, WhatsApp la rechaza, no hay saldo de WhatsApp o el pago del número está vencido), `reactions` queda como estaba y se emite el evento de webhook `message.reaction_failed`, una vez por pedido, con el motivo en `reason` y el momento en que se aceptó el pedido en `requested_at`. Para recibirlo, suscríbete a `message.reaction_failed` (sección «Webhooks»).

| HTTP | Cuándo |
|---|---|
| 404 | El contacto o el mensaje no existe o es de otra cuenta, el mensaje es de otro contacto, el mensaje pasó por un número de otro workspace de tu cuenta, o la clave es de un agente y el contacto no está asignado a ese agente. Es la misma respuesta en todos los casos. |
| 422 | No se puede reaccionar a ese mensaje y no se envía nada. `error` dice por qué: `no_provider_uid` (el mensaje no tiene un id de WhatsApp, por ejemplo una nota o un envío que no salió), `message_not_reactable` (ese tipo de mensaje no admite reacciones), `message_deleted` (el mensaje se eliminó), `device_disconnected` (el número por el que pasó el mensaje ya no está o está desconectado), `provider_unsupported` (ese número no admite reacciones) o `window_expired` (en un número de la API oficial de WhatsApp, pasaron más de 24 horas desde el último mensaje que el contacto le escribió a ese número). `recipient_unsupported` si el contacto es un grupo, una lista de difusión o un canal. En un `PUT`, también si `emoji` no es un emoji. |
| 429 | `rate_limited`: se superó el ritmo de la sección «Envío de mensajes con clave» (ver `Retry-After`). |

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `contact` | path | string | sí |  |
| `message` | path | string | sí |  |

**Respuestas**

- `202` — Accepted
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found
- `422` — Unprocessable Content
- `429` — Too Many Requests. Cabeceras: `Retry-After`

## Secciones citadas

Las secciones de la descripción general de cada área que citan las llamadas y los eventos de este texto, tal como las escribe el área.

### Webhooks

Lo cuenta la página «Webhooks» del portal de desarrolladores: /docs/webhooks/ (el texto para tu IA: /ia/webhooks.md).

### Envío de mensajes con clave

Cuando envías con una clave de API, antes de enviar se aplican reglas de protección de tu número y de tus contactos. Si una regla frena el envío, la respuesta es un JSON `{ "error": "<código>", "message": "<explicación>" }` y no se envía nada ni se registra ningún mensaje. Cada operación de envío documenta los códigos que puede responder.
- **A quién envías con `POST /message/send-message` y `POST /devices/{device}/templates/{template_id}/send-template`:** Indica a quién envías con `phone`: el teléfono con código de país, por ejemplo `5491122334455`. No hace falta crear el contacto antes: el teléfono se busca y, si todavía no es un contacto, se crea en el workspace de tu clave, igual que con `POST /contacts/update-or-create` y con el mismo permiso, que **Enviar** ya incluye. Si en tu cuenta cada workspace tiene sus propios contactos, se busca solo en el workspace de tu clave; si tus workspaces comparten los contactos, en toda tu cuenta. La respuesta trae su id en `message.contact_id`, el mismo que llevan los eventos `message.status_changed`. Si el teléfono no es válido, la respuesta es la misma que daría `POST /contacts/update-or-create`: 422. Si tus workspaces comparten los contactos y el teléfono ya es un contacto de otro workspace de tu cuenta, también: 404, sin datos de ese contacto. Con un número oficial de WhatsApp (API Cloud) también puedes indicar `whatsapp_id`, el BSUID que envía Meta (por ejemplo `US.13491208655302741918`), en lugar de `phone`; usado así con un número conectado por QR, responde 422. En un número oficial, el primer mensaje a un contacto nuevo tiene que ser una plantilla: un mensaje libre solo sale dentro de las 24 horas desde que el contacto te escribió. Si ya tienes el `contact_id`, puedes seguir enviándolo: si junto con él mandas `phone` o `whatsapp_id`, tienen que ser de ese mismo contacto (si no, 422 `recipient_mismatch`). En `send-template`, `phone` o `whatsapp_id` va siempre, con o sin `contact_id`.
- **Ritmo:** el límite depende sólo del tipo de número por el que envías; en los envíos no hay un límite por minuto por clave ni por cuenta. Al superarlo, la respuesta es 429 con `error` = `rate_limited` y el encabezado `Retry-After`, que trae los segundos que debes esperar antes de reintentar. Las reacciones sólo tienen esta regla.
  - **Número de WhatsApp Cloud (API oficial):** hasta 60 mensajes por segundo y hasta 10 mensajes por minuto al mismo contacto.
  - **Número en coexistencia** (el mismo teléfono conectado a WhatsApp Cloud y a la aplicación WhatsApp Business del celular): hasta 15 mensajes por segundo en total entre las dos conexiones, envíes por la que envíes. El límite de 10 mensajes por minuto al mismo contacto aplica sólo a lo que envías por WhatsApp Cloud.
  - **Número conectado por código QR** (sin coexistencia): esta regla no limita sus envíos.
- **Ventana de 24 horas:** por un número de WhatsApp Cloud sólo puedes enviar mensajes que no son plantilla a un contacto que te escribió en las últimas 24 horas. Fuera de esa ventana la respuesta es 422 con `error` = `window_closed`; para retomar la conversación envía una plantilla aprobada, que no tiene esta restricción.
- **Antibloqueo:** en las últimas 24 horas, un mismo contenido se puede enviar como máximo 2 veces al mismo contacto (el siguiente responde 422 con `error` = `antiblock_duplicate_content`), y como máximo 5 mensajes seguidos sin que el contacto responda (el siguiente responde 422 con `error` = `antiblock_unanswered_limit`). Cuando el contacto responde, los contadores se reinician. Aplica a mensajes y a plantillas, no a reacciones.
- **Destinatario:** `recipient_mismatch` (422) indica que el teléfono o el identificador de WhatsApp que mandaste en el cuerpo no corresponde al contacto de la ruta (sólo las operaciones que reciben ese dato en el cuerpo). `recipient_unsupported` (422) indica que el contacto es un grupo, una lista de difusión o un canal: por la API sólo se escribe a personas individuales.
- **Resultado de tus envíos:** cuando envías con una clave, la llamada no espera al proveedor: la respuesta trae el mensaje ya registrado y en cola, el mismo objeto que devuelve `GET /contacts/{contact}/messages/{message}`, y el envío sale enseguida después.
  - **En cola no es enviado:** `status` `queued` solo dice que registramos el mensaje y que está por salir. El resultado llega por el evento `message.status_changed` o consultando `GET /contacts/{contact}/messages/{message}`. Un mensaje `queued` no se reintenta: reenviarlo lo duplicaría.
  - **Aceptado no es entregado:** `status` `sent` solo dice que el proveedor aceptó el mensaje. El estado final (entregado, leído o fallido) llega por el evento `message.status_changed` o consultando `GET /contacts/{contact}/messages/{message}`.
  - **`failed`:** el proveedor rechazó el mensaje dando un motivo, o Funnelchat lo frenó antes de enviarlo. No salió: reintentar es un intento nuevo y no lo duplica. Cuando lo decidió Funnelchat, `error.reason` trae el motivo, `error.code` es `null` y `error.title` es un texto llano en tu idioma; si lo rechazó el proveedor, `error.reason` es `null`. Qué hacer según `error.reason`: `device_unavailable`, reconecta el número en Funnelchat y envía de nuevo; `insufficient_balance`, recarga tu billetera de WhatsApp; `window_closed`, envía una plantilla aprobada; `recipient_unreachable`, revisa el teléfono del contacto; `template_not_found` o `template_unresolved_placeholder`, corrige la plantilla o sus variables; `not_queued` o `not_sent`, vuelve a intentarlo. Un mensaje enviado con clave que termina `failed` también llega por `message.status_changed`, con `previous_status` en `null` y su `client_reference`; un `status` `null` no recibe evento.
  - **`status` `null`:** el proveedor no confirmó ni rechazó el envío (no respondió, respondió con una falla sin motivo o el envío se interrumpió). Puede haber llegado al contacto, no recibirá eventos de estado y reintentarlo puede duplicarlo.
  - **Más de una hora en `queued`:** un mensaje cuyo envío no empezó dentro de la hora ya no sale. Pasada la hora sin resultado, su `status` es `null`, o `failed` con `error.reason` `not_sent` y su evento `message.status_changed` si su envío llega tarde. Reintentar es un envío nuevo, que sólo puede duplicar si el envío había empezado y se cortó.
  - **Error 5xx o llamada sin respuesta:** busca tu `client_reference` en el historial del contacto antes de reintentar, y hazlo al menos un minuto después de la llamada. Si aparece, el mensaje quedó registrado: no lo reenvíes, su resultado llega por `message.status_changed` o consultando `GET /contacts/{contact}/messages/{message}`; la excepción son las tarjetas y los destinos de un reenvío tras un 5xx: si todos los que aparecen vienen `failed` con `not_queued`, se reintenta la llamada completa; si alguno aparece `queued`, quedó registrado: no lo reenvíes. Si no aparece, no salió nada y puedes reintentar. Repetir una referencia no evita duplicados: dos llamadas con la misma `client_reference` registran dos mensajes.
  - **Error 404 en un envío:** el contacto no existe. En un reenvío, también cuando el mensaje de origen no existe o no es de ese contacto. Al enviar por `phone` o `whatsapp_id`, cuando tus workspaces comparten los contactos y ese contacto es de otro workspace de tu cuenta.
  - **`POST /contacts/{contact}/message`:** la respuesta trae el mensaje en `message`: `queued` si es un mensaje, o el mensaje registrado de una nota.
  - **`POST /contacts/{contact}/message/contact-card`:** la respuesta trae `messages`: un mensaje por tarjeta, en el orden de `contact_card_ids`, cada uno con su `id` y en cola (`queued`). Todas salen después, desde la cola: el resultado de cada una llega por `message.status_changed` o consultando `GET /contacts/{contact}/messages/{message}`, con tu `client_reference`. Si una tarjeta no pudo encolarse, su entrada viene `failed` con `error.reason` `not_queued`: no salió y volver a enviar esa tarjeta es un intento nuevo. Si alguna no pudo registrarse, la llamada responde un error 5xx y ninguna tarjeta salió: las que ya aparezcan en el historial del contacto vienen `failed` con `error.reason` `not_queued` y su propio evento `message.status_changed` `failed`. Si todas las que aparecen vienen `failed` con `not_queued`, reintenta la llamada completa; si alguna aparece `queued`, quedó registrada: no la reenvíes.
  - **Reenvío:** la respuesta trae un elemento por destino, en el orden de `targets`, y cada destino que quedó en cola trae su `message` con su `id` y en cola (`queued`). Todos salen después, desde la cola: el resultado de cada uno llega por `message.status_changed` o consultando `GET /contacts/{contact}/messages/{message}`, con tu `client_reference`. Un destino que no pudo encolarse viene `blocked` con `reason` `not_sent` y su `message` `failed` con `error.reason` `not_queued`: no salió y volver a reenviarlo a ese destino es un intento nuevo. Un destino `blocked` por MAC (`mac_limit_reached` o `mac_lockout_24h`) o con `reason` `target_not_found` (no existe o no es de tu cuenta), `contact_blocked` (bloqueaste al contacto en ese número) o `device_unavailable` trae `message` `null`: no salió nada. Si algún destino no pudo registrarse, la llamada responde un error 5xx y ninguno salió: los que ya aparezcan en el historial del contacto vienen `failed` con `error.reason` `not_queued` y su propio evento `message.status_changed` `failed`. Si todos los que aparecen vienen `failed` con `not_queued`, reintenta la llamada completa; si alguno aparece `queued`, quedó registrado: no lo reenvíes.
  - **`POST /contacts/{contact}/message/form`:** la respuesta trae solo `message`: el mensaje del formulario en cola (`queued`). Si no pudo ponerse en cola, la respuesta sigue siendo 200 con el mensaje en estado `failed` y `error.reason` `not_queued`: no salió, así que reintentar no lo duplica. Su resultado llega por `message.status_changed` o consultando `GET /contacts/{contact}/messages/{message}`, y la respuesta del contacto por `whatsapp_form.completed`. Si tu cuenta está en bloqueo por el límite de contactos activos responde 429 `mac_lockout_24h` y no guarda ningún mensaje ni `client_reference`. Sus errores propios están en la guía «Formularios de WhatsApp».
  - **`POST /message/send-message` y `POST /devices/{device}/templates/{template_id}/send-template`:** la respuesta trae solo `message`: el mensaje en cola (`queued`), o el mensaje registrado de una nota en `send-message`. Si una variable de la plantilla se completa con un campo personalizado que no existe en tu cuenta, `send-template` responde 422 con `error` `template_unresolved_placeholder`, `placeholders` (hasta 20) y `count` (el total), y no registra ni envía nada; si la plantilla no existe en tu cuenta, responde 404 `template_not_found`.
- **Correlacionar tus envíos:** manda `client_reference` en el cuerpo (texto opcional de 1 a 64 caracteres visibles, sin espacios) para identificar cada envío con tu propia referencia. La misma referencia vuelve en el historial de mensajes del contacto y en el evento `message.status_changed`, de modo que puedes relacionar cada evento de estado con tu envío también cuando la llamada de envío no respondió. La referencia no es única (dos envíos pueden usar el mismo valor) y no está autenticada: la ven todas las claves y todas las suscripciones de la cuenta. Por eso relaciónala siempre junto con `message_id` y `contact_id`, y trátala como texto no confiable cuando la muestres. No pongas datos personales en la referencia. Una llamada que frena una regla de protección de esta sección (ritmo, ventana de 24 horas, antibloqueo o destinatario) no registra ningún mensaje ni referencia. Un rechazo por MAC (`mac_limit_reached` o `mac_lockout_24h`, `429`) tampoco registra ningún mensaje ni referencia, en ningún envío. Un mensaje enviado con clave que Funnelchat frena antes de que salga (por ejemplo, por saldo insuficiente) aparece en el historial con estado de error y su referencia, y recibe un evento `failed` con esa referencia; uno enviado desde el panel no recibe eventos de estado. Las reacciones no aceptan `client_reference`.

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
