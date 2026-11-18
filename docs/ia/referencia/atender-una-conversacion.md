# Atender una conversación — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/atender-una-conversacion/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Mandar un mensaje a un contacto

`POST /api/v1/contacts/{contact}/message` · permiso **Contactos y conversaciones → Enviar** · área conversations · `operationId` `conversation.sendMessage`

**Para qué sirve:** Úsalo para enviarle a un contacto un mensaje de texto o un archivo desde uno de tus números, con opción de responder a un mensaje previo, sumar opciones o vista previa de link.

Si el límite de contactos activos (MAC) frena el envío, responde `429` con `error` = `mac_lockout_24h` o `mac_limit_reached` y sin `Retry-After`: reintentar no sirve hasta que sumes capacidad o empiece un ciclo nuevo. El envío no sale y no se guarda ningún mensaje ni tu `client_reference`: no queda nada en el historial del contacto. Detalle en «Errores y límites».

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `contact` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `phone` | string | no |  |
| `whatsapp_id` | string | no |  |
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `text` | string | no |  |
| `contact_id` | string | sí | Id opaco: un texto que empieza con `ctc_`. Se usa tal como llega; no se arma ni se interpreta. |
| `file` | string | no | Archivo del mensaje: el nombre de un archivo ya subido a tu cuenta o la URL pública de un archivo (te recomendamos `https://`), que WhatsApp o el proveedor descarga; admite hasta 4096 caracteres. Si empieza con `http`, en mayúsculas o minúsculas, tiene que ser una URL `http://` o `https://`; si no, la respuesta es 422. Consulta la sección «Enviar un archivo por URL». |
| `file_type` | string \| null ∈ {"image", "video", "audio", "document", "sticker", null} | no | Tipo del archivo. Es obligatorio cuando `file` es una URL que no termina en una extensión reconocida; si lo envías, manda sobre la extensión. Valores: `image`, `video`, `audio`, `document`, `sticker`. Consulta la sección «Enviar un archivo por URL». |
| `file_name` | string \| null | no | Nombre con el que el contacto ve un documento, con su extensión (por ejemplo `factura.pdf`), de hasta 255 caracteres. Es obligatorio al enviar un documento por URL que no termina en una extensión de la lista. Consulta la sección «Enviar un archivo por URL». |
| `temporal_uuid` | string | no |  |
| `note` | boolean | no |  |
| `mentions` | array<integer> \| null | no |  |
| `options` | array<object> | no |  |
| `options[].id` | string | no |  |
| `options[].label` | string | no |  |
| `reference_message_uid` | string \| null | no |  |
| `client_reference` | string \| null | no |  |
| `link_preview` | boolean | no |  |
| `link_preview_meta` | object | no |  |
| `link_preview_meta.url` | string (uri) | no |  |
| `link_preview_meta.title` | string \| null | no |  |
| `link_preview_meta.description` | string \| null | no |  |
| `link_preview_meta.image_url` | string (uri) \| null | no |  |
| `link_preview_meta.domain` | string | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `message` | PublicMessageResource \| null |  |
  | `message.id` | string | Id opaco: un texto que empieza con `msg_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `message.contact_id` | string \| null | Id opaco: un texto que empieza con `ctc_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `message.device_id` | string \| null | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `message.direction` | string ∈ {"outbound", "inbound"} |  |
  | `message.type` | string ∈ {"text", "image", "video", "document", "sticker", "contact", "audio", "note", "action", "invalid", "interactive", "location", "voice_call", "video_call", "event", "button", "template", "notification", "option_list", "template_button_reply", "poll", "whatsapp_form", "call_permission_request", "call_permission_reply", "request_contact_info"} |  |
  | `message.status` | string \| null ∈ {"sent", "delivered", "read", "failed", "queued", null} |  |
  | `message.error` | object \| null |  |
  | `message.client_reference` | string \| null |  |
  | `message.created_at` | string \| null |  |
  | `message.updated_at` | string \| null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `415` — Unsupported Media Type
- `422` — Unprocessable Content
- `429` — Too Many Requests. Cabeceras: `Retry-After`
- `500` — Internal Server Error

### Marcar un mensaje como leído

`POST /api/v1/contacts/{contact}/messages/{message}/read` · permiso **Contactos y conversaciones → Enviar** · área conversations · `operationId` `message.markMessageRead`

**Para qué sirve:** Úsalo para marcar como leído un mensaje que te mandó un contacto: ve el doble check azul y, en Funnelchat, la conversación queda leída. No manda ningún mensaje.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `contact` | path | string | sí |  |
| `message` | path | string | sí |  |

**Respuestas**

- `204` — No Content
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found
- `422` — Unprocessable Content
- `429` — Too Many Requests. Cabeceras: `Retry-After`
- `502` — Bad Gateway

### Mostrar «escribiendo…»

`POST /api/v1/contacts/{contact}/typing` · permiso **Contactos y conversaciones → Enviar** · área conversations · `operationId` `message.typingIndicator`

**Para qué sirve:** Sirve para mostrarle a un contacto «escribiendo…» mientras preparas la respuesta, por un número oficial. No manda ningún mensaje.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `contact` | path | string | sí |  |

**Cuerpo** (`application/json`)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | no | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |

**Respuestas**

- `204` — No Content
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found
- `422` — Unprocessable Content
- `429` — Too Many Requests. Cabeceras: `Retry-After`
- `502` — Bad Gateway

### Reaccionar a un mensaje

`PUT /api/v1/contacts/{contact}/messages/{message}/reaction` · permiso **Contactos y conversaciones → Enviar** · área conversations · `operationId` `messageReaction.update`

**Para qué sirve:** Úsalo para reaccionar con un emoji a un mensaje de una conversación, por ejemplo para acusar recibo sin escribir una respuesta.

Pone o reemplaza la reacción de tu cuenta a un mensaje del contacto: un emoji en `emoji`. Para quitarla, `DELETE` en la misma ruta.

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

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `emoji` | string | sí |  |

**Respuestas**

- `202` — Accepted
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found
- `422` — Unprocessable Content
- `429` — Too Many Requests. Cabeceras: `Retry-After`

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

### Ver tus formularios

`GET /api/v1/forms` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `whatsappForm.index`

**Para qué sirve:** Úsalo para encontrar el formulario que vas a mandar: su `family_id` es el `form_id` que pides al mandarlo (el `id` es el de una versión).

Lista los formularios de tu cuenta, uno por formulario aunque tenga varias versiones; de cada uno ves la versión que usas hoy (la publicada o, si no hay, la más nueva). El `id` de cada fila es el de esa versión y `family_id` es el del formulario. Filtra con `q` (parte del nombre), `status` (`draft`, `published` o `deprecated`) y `device_id` (un número de tu cuenta; si no es WhatsApp Cloud responde 422 `NUMBER_NOT_ELIGIBLE`). Pagina con `perPage` (1 a 100, 25 por defecto).

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `q` | query | string \| null | no |  |
| `status` | query | string \| null ∈ {"draft", "published", "deprecated", null} | no |  |
| `device_id` | query | string \| null | no |  |
| `page` | query | integer \| null | no |  |
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<WhatsappFormResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `frv_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].family_id` | string | Id opaco: un texto que empieza con `frm_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].name` | string |  |
  | `data[].label` | string |  |
  | `data[].category` | string |  |
  | `data[].status` | string |  |
  | `data[].version` | integer |  |
  | `data[].definition` | array<any> |  |
  | `data[].fields` | array<any> \| null |  |
  | `data[].mapping` | array<any> \| null |  |
  | `data[].tag_rules` | array<any> \| null |  |
  | `data[].has_endpoint` | boolean |  |
  | `data[].first_screen` | string \| null |  |
  | `data[].first_screen_dynamic` | boolean |  |
  | `data[].lint_errors_count` | integer |  |
  | `data[].draft_id` | string | Id opaco: un texto que empieza con `frv_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].draft_version` | integer |  |
  | `data[].sends` | integer |  |
  | `data[].responses` | integer |  |
  | `data[].meta_flow_id` | string \| null |  |
  | `data[].flow_json` | array<any> \| null |  |
  | `data[].validation_errors` | array<any> \| null |  |
  | `data[].published_at` | string \| null |  |
  | `data[].updated_at` | string \| null |  |
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
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Mandar un formulario

`POST /api/v1/contacts/{contact}/message/form` · permiso **Contactos y conversaciones → Enviar** · área conversations · `operationId` `whatsappFormSend.store`

**Para qué sirve:** Sirve para pedirle datos a un contacto dentro de WhatsApp, por ejemplo para una inscripción o una encuesta, con un formulario que ya publicaste.

Envía a un contacto un formulario de WhatsApp publicado. `form_id` es el identificador estable del formulario (el mismo en todas sus versiones) y `device_id` el número de WhatsApp Cloud de tu cuenta por el que sale. `text` (hasta 1024 caracteres) acompaña al formulario y por defecto es su nombre; `button_text` (hasta 30 caracteres, sin emojis) es el botón y por defecto es «Abrir» u «Open» según el idioma del usuario de la clave (en inglés «Open»; en español y portugués «Abrir»). Sólo funciona dentro de las 24 horas siguientes al último mensaje del contacto a ese número. Responde `200` con el mensaje en cola (`status` `queued`, `type` `whatsapp_form`); aceptado no es entregado: el estado final llega por `message.status_changed` o por `GET /contacts/{contact}/messages/{message}`, y la respuesta del contacto por `whatsapp_form.completed`. Responde `404` si el contacto no existe o no es de tu cuenta, o `404` con `form_not_found` si el formulario no existe en tu cuenta. Responde `422` con `device_unavailable` si el número no es de tu cuenta o no está conectado, `number_not_eligible` si no es un número de WhatsApp Cloud que pueda enviar formularios, `form_not_published` si el formulario no tiene versión publicada, `form_not_on_number` si no está publicado en ese número, `recipient_unreachable` si el contacto no tiene teléfono ni identificador de WhatsApp, `contact_blocked` si bloqueaste al contacto en ese número y `window_closed` si pasaron más de 24 horas. También responde `422` por las guardas de envío y `429` con `rate_limited` si superas el ritmo del número o del contacto.

Si tu cuenta (o, si tu cuenta usa workspaces separados, el workspace del número) está bloqueada por el límite de contactos activos, responde `429` con `mac_lockout_24h` (además del `429` `rate_limited` del ritmo) y no guarda ningún mensaje ni `client_reference`. Si Funnelchat no pudo poner el mensaje en cola, la respuesta no es un error: es `200` con el mensaje en estado `failed` y `error.reason` `not_queued`; no salió, así que reintentar no lo duplica.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `contact` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `form_id` | string | sí | Id opaco: un texto que empieza con `frv_`. Se usa tal como llega; no se arma ni se interpreta. |
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `text` | string | no |  |
| `button_text` | string | no |  |
| `client_reference` | string \| null | no |  |

**Respuestas**

- `200` — OK

  La misma tabla que en «Mandar un mensaje a un contacto», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found
- `422` — Unprocessable Content
- `429` — Too Many Requests. Cabeceras: `Retry-After`
- `500` — Internal Server Error

### Reenviar un mensaje

`POST /api/v1/contacts/{contact}/messages/{message}/forward` · permiso **Contactos y conversaciones → Enviar** · área conversations · `operationId` `forwardMessage.store`

**Para qué sirve:** Úsalo para reenviar un mensaje de una conversación a otros contactos, eligiendo desde qué número sale cada envío; la respuesta indica el resultado por destino.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `contact` | path | string | sí |  |
| `message` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `targets` | array<object> | sí |  |
| `targets[].contact_id` | string | sí | Id opaco: un texto que empieza con `ctc_`. Se usa tal como llega; no se arma ni se interpreta. |
| `targets[].device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `client_reference` | string \| null | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `[].contact_id` | string | Id opaco: un texto que empieza con `ctc_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `[].mode` | string ∈ {"internal", "native"} |  |
  | `[].status` | string ∈ {"queued", "blocked"} |  |
  | `[].reason` | string \| null |  |
  | `[].message` | PublicMessageResource \| null |  |
  | `[].message.id` | string | Id opaco: un texto que empieza con `msg_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `[].message.contact_id` | string \| null | Id opaco: un texto que empieza con `ctc_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `[].message.device_id` | string \| null | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `[].message.direction` | string ∈ {"outbound", "inbound"} |  |
  | `[].message.type` | string ∈ {"text", "image", "video", "document", "sticker", "contact", "audio", "note", "action", "invalid", "interactive", "location", "voice_call", "video_call", "event", "button", "template", "notification", "option_list", "template_button_reply", "poll", "whatsapp_form", "call_permission_request", "call_permission_reply", "request_contact_info"} |  |
  | `[].message.status` | string \| null ∈ {"sent", "delivered", "read", "failed", "queued", null} |  |
  | `[].message.error` | object \| null |  |
  | `[].message.client_reference` | string \| null |  |
  | `[].message.created_at` | string \| null |  |
  | `[].message.updated_at` | string \| null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content
- `429` — Too Many Requests. Cabeceras: `Retry-After`
- `500` — Internal Server Error

### Mandar una tarjeta de contacto

`POST /api/v1/contacts/{contact}/message/contact-card` · permiso **Contactos y conversaciones → Enviar** · área conversations · `operationId` `contactCard.store`

**Para qué sirve:** Sirve para compartirle a un contacto una o más tarjetas de contacto desde uno de tus números, por ejemplo para pasarle el contacto de un vendedor o de soporte.

Si el límite de contactos activos (MAC) frena el envío, responde `429` con `error` = `mac_lockout_24h` o `mac_limit_reached` y sin `Retry-After`: reintentar no sirve hasta que sumes capacidad o empiece un ciclo nuevo. El envío no sale y no se guarda ningún mensaje ni tu `client_reference`: no queda nada en el historial del contacto. Detalle en «Errores y límites».

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `contact` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `contact_card_ids` | array<string> | sí |  |
| `client_reference` | string \| null | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `messages` | array<PublicMessageResource> |  |
  | `messages[].id` | string | Id opaco: un texto que empieza con `msg_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `messages[].contact_id` | string \| null | Id opaco: un texto que empieza con `ctc_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `messages[].device_id` | string \| null | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `messages[].direction` | string ∈ {"outbound", "inbound"} |  |
  | `messages[].type` | string ∈ {"text", "image", "video", "document", "sticker", "contact", "audio", "note", "action", "invalid", "interactive", "location", "voice_call", "video_call", "event", "button", "template", "notification", "option_list", "template_button_reply", "poll", "whatsapp_form", "call_permission_request", "call_permission_reply", "request_contact_info"} |  |
  | `messages[].status` | string \| null ∈ {"sent", "delivered", "read", "failed", "queued", null} |  |
  | `messages[].error` | object \| null |  |
  | `messages[].client_reference` | string \| null |  |
  | `messages[].created_at` | string \| null |  |
  | `messages[].updated_at` | string \| null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found
- `422` — Unprocessable Content
- `429` — Too Many Requests. Cabeceras: `Retry-After`
- `500` — Internal Server Error

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

### Errores y límites

Lo que vale para todas las operaciones que llamas con una clave de API, además de las respuestas que documenta cada una.
- **Pago vencido (`402`):** si está vencido el pago de tu cuenta (o, si tu cuenta usa workspaces separados, el del workspace de tu clave: cada workspace tiene su propio pago), las operaciones que documentan un `402` responden `402` con `{ "error": "payment_required", "message": "<explicación>" }` y no se ejecutan. Regulariza el pago en el panel de Funnelchat y vuelve a llamar. Los envíos de mensajes también responden `402` cuando está vencido el pago del workspace dueño del número por el que envías, aunque tu cuenta esté al día: en `POST /contacts/{contact}/message`, `POST /message/send-message` y `POST /contacts/{contact}/message/contact-card` ese envío queda en el historial del contacto como un mensaje con estado de error; `POST /contacts/{contact}/message/form` no guarda nada. Las operaciones que no documentan un `402` no dependen del pago.
- **Workspace de la clave (`403`):** cada clave opera en un workspace de tu cuenta. Si el workspace de la clave ya no es de tu cuenta, o la clave no tiene workspace y tu cuenta tiene varios sin uno por defecto, toda llamada responde `403` con `error` = `forbidden` y no hace nada: crea una clave nueva en el panel de Funnelchat. Si tu cuenta usa workspaces separados y el workspace de la clave está archivado, toda llamada responde `403` con `error` = `WORKSPACE_ARCHIVED` mientras siga archivado.
- **Límites por minuto (`429`):** algunas operaciones aceptan un máximo de llamadas por minuto. Al superarlo responden `429` con `error` = `rate_limited` y el encabezado `Retry-After`, con los segundos que debes esperar antes de volver a llamar. Cada límite se cuenta de una de estas formas: **por usuario**, lo comparten todas las claves de ese usuario y su sesión en el panel de Funnelchat, así que lo que ese usuario hace en el panel descuenta de lo que puede hacer tu integración, y al revés; **por workspace**, lo comparten todas las claves y todos los usuarios del workspace; **por clave**, cada clave cuenta aparte y el panel no lo usa. Si tu cuenta usa workspaces separados, los límites por usuario y por workspace se cuentan en cada workspace por separado: lo que se usa en uno no descuenta de otro, y un usuario tiene su propio límite en cada workspace en el que trabaja. Si no, un límite por workspace es de toda tu cuenta: lo comparten todos tus workspaces.
  - **Escrituras: 30 por minuto, por usuario.** `POST /broadcasts/folders`, `DELETE /broadcasts/folders/{broadcastFolder}`, `PUT /broadcasts/folders/{broadcastFolder}`, `POST /broadcasts/move-to-folder`, `DELETE /broadcasts/{broadcast}`, `POST /contacts`, `POST /contacts/add-tags`, `POST /contacts/attach-custom-field`, `POST /contacts/detach-custom-field`, `POST /contacts/remove-tags`, `POST /contacts/update-or-create`, `PUT /contacts/{contact}`, `POST /contacts/{contact}/notes`, `DELETE /contacts/{contact}/notes/{note}`, `POST /contacts/{contact}/pause`, `POST /custom-fields`, `PUT /custom-fields/{customField}`, `DELETE /devices/{device}/templates/{template}`, `POST /folders`, `PUT /folders/{folder}`, `POST /kanban-settings/{kanbanSetting}/move-contact`, `POST /kanban-settings/{kanbanSetting}/remove-contact`, `POST /kanban-settings/{kanbanSetting}/stages`, `POST /kanban-settings/{kanbanSetting}/stages/reorder`, `DELETE /kanban-settings/{kanbanSetting}/stages/{stage}`, `PUT /kanban-settings/{kanbanSetting}/stages/{stage}`, `POST /quick-replies`, `DELETE /quick-replies/{quickReply}`, `PUT /quick-replies/{quickReply}`, `POST /tags`, `POST /tags/delete`, `POST /templates`, `PUT /templates/{template}`, `POST /tickets`, `POST /tickets/assign`, `PUT /tickets/{id}`, `POST /tickets/{id}/close`, `POST /tickets/{id}/reopen`.
  - **Escrituras sensibles: 10 por minuto, por usuario.** `POST /broadcasts/{broadcast}/cancel`, `POST /contacts/delete`, `POST /contacts/{contact}/lead-score/adjustments`, `POST /custom-fields/delete`, `POST /devices/{device}/templates`, `DELETE /folders/{folder}`, `POST /kanban-settings/{kanbanSetting}/bulk-move`, `POST /kanban-settings/{kanbanSetting}/bulk-remove`, `PUT /lead-score/settings`.
  - **Lecturas: 120 por minuto, por usuario.** `POST /broadcasts/contacts`, `POST /broadcasts/contacts-count`, `GET /broadcasts/cost-tiers`, `GET /contacts/{contact}/lead-score`, `GET /contacts/{contact}/messages/{message}`, `GET /custom-fields`, `GET /flows`, `GET /lead-score/distribution`, `GET /lead-score/settings`, `GET /payments/products/{platform}`, `GET /sales`, `GET /sales/by-platform`, `GET /sales/funnel`, `GET /sales/metrics`, `GET /tags`, `GET /templates/{template}/metrics`.
  - **Costo de una difusión: 20 por minuto, por usuario.** `GET /broadcasts/{broadcast}/cost`.
  - **Marcar todas las conversaciones: 5 por minuto, por workspace.** `POST /conversations/mark-all-read`, `POST /conversations/mark-all-unread`.
  - **Webhooks, lecturas: 60 por minuto, por workspace.** `GET /webhooks`, `GET /webhooks/events`, `GET /webhooks/{webhook}`, `GET /webhooks/{webhook}/deliveries`.
  - **Webhooks, pruebas: 6 por minuto, por workspace.** `POST /webhooks/{webhook}/test`. Además hay un límite común a todas las cuentas: una prueba puede responder `429` aunque no hayas usado tu cupo.
  - **Formularios de WhatsApp, lecturas: 120 por minuto, por clave.** `GET /forms`, `GET /forms/families/{familyId}/definition`, `GET /forms/families/{familyId}/metrics`, `GET /forms/families/{familyId}/responses`, `GET /forms/families/{familyId}/responses/{runId}`, `GET /forms/families/{familyId}/versions`, `GET /forms/templates`, `GET /forms/{id}`, `GET /forms/{id}/numbers`.
  - **Formularios de WhatsApp, cambios: 60 por minuto, por clave.** `POST /forms`, `DELETE /forms/{id}`, `PUT /forms/{id}`, `POST /forms/{id}/numbers`, `POST /forms/{id}/numbers/retry`, `DELETE /forms/{id}/numbers/{deviceId}`, `POST /forms/{id}/publish`, `POST /forms/{id}/sync`, `POST /forms/{id}/versions`.
  - **Formularios de WhatsApp, operaciones con Meta: 30 por minuto, por workspace.** `POST /forms/{id}/numbers`, `POST /forms/{id}/numbers/retry`, `DELETE /forms/{id}/numbers/{deviceId}`, `POST /forms/{id}/publish`, `POST /forms/{id}/sync`.
  - **Envíos con clave: sin límite por minuto.** `POST /contacts/{contact}/message`, `POST /contacts/{contact}/message/contact-card`, `POST /contacts/{contact}/message/form`, `POST /contacts/{contact}/messages/{message}/forward`, `DELETE /contacts/{contact}/messages/{message}/reaction`, `PUT /contacts/{contact}/messages/{message}/reaction`, `POST /devices/{device}/templates/{template_id}/send-template`, `POST /message/send-message`. Los limita el ritmo por número, explicado en «Envío de mensajes con clave». Una nota interna (`note` en `true`) en `POST /contacts/{contact}/message` o `POST /message/send-message` no es un envío: cuenta en las escrituras sensibles (10 por minuto, por usuario).
  - **Sin límite por minuto:** `GET /agents`, `GET /agents/{user}`, `GET /broadcasts`, `GET /broadcasts/folders`, `GET /broadcasts/{broadcast}`, `GET /broadcasts/{broadcast}/contacts`, `GET /broadcasts/{broadcast}/messages`, `GET /broadcasts/{broadcast}/statistics`, `PUT /contact-flows/{contactFlowId}/cancel`, `GET /contact-flows/{contactId}`, `GET /contacts`, `GET /contacts/{contact_id}/messages`, `GET /contacts/{contact}`, `GET /contacts/{contact}/custom-fields`, `GET /contacts/{contact}/flows`, `GET /contacts/{contact}/kanban-stages`, `POST /contacts/{contact}/messages/{message}/read`, `GET /contacts/{contact}/meta-window`, `GET /contacts/{contact}/notes`, `GET /contacts/{contact}/tags`, `POST /contacts/{contact}/typing`, `GET /conversations`, `GET /conversations/count/all`, `GET /conversations/count/closed`, `GET /conversations/count/open`, `GET /conversations/count/unread`, `GET /custom-fields/{customField}`, `GET /devices/{device}/contacts`, `GET /flows/{flow}`, `GET /flows/{flow}/active-contacts`, `GET /flows/{flow}/flow-contacts`, `GET /flows/{flow}/nodes`, `GET /flows/{flow}/paused-contacts`, `GET /flows/{flow}/paused-contacts-list`, `GET /folders`, `GET /folders/{folder}`, `GET /kanban-settings`, `POST /kanban-settings`, `DELETE /kanban-settings/{kanbanSetting}`, `GET /kanban-settings/{kanbanSetting}`, `PUT /kanban-settings/{kanbanSetting}`, `GET /kanban-settings/{kanbanSetting}/members`, `GET /kanban-settings/{kanbanSetting}/stages/{stage}/contacts`, `GET /mac/contacts`, `GET /mac/contacts/history`, `GET /mac/status`, `GET /quick-replies`, `GET /quick-replies/{quickReply}`, `GET /tags/{tag}`, `PUT /tags/{tag}`, `GET /tags/{tag}/contacts`, `GET /templates`, `GET /templates/{template}`, `GET /tickets`, `GET /tickets/{id}`. Si alguna tiene otro `429` propio, lo documenta la operación.
- **Tope diario:** por defecto no hay un tope diario de llamadas. Una clave puede hacer las llamadas que necesite en el día, dentro de los límites por minuto y del ritmo de envío por número.
- **Contactos activos (`429`):** el plan de tu cuenta incluye un límite de contactos activos (MAC) por ciclo; si tu cuenta usa workspaces separados, cada workspace tiene su propio plan, su propio límite y su propio bloqueo, y cuenta el del workspace del número por el que envías. `POST /contacts/{contact}/message`, `POST /message/send-message` y `POST /contacts/{contact}/message/contact-card` responden `429` cuando ese límite frena el envío, con `error` = `mac_lockout_24h` (tu cuenta, o ese workspace, está en bloqueo: alcanzó el límite, pasaron las 24 horas de gracia sin sumar capacidad y el contacto todavía no es un contacto activo del ciclo) o `mac_limit_reached` (no queda capacidad para sumar a este contacto como activo). Esta respuesta no trae `Retry-After` y reintentar no sirve: el envío vuelve a funcionar cuando sumas capacidad (por ejemplo, con una compra o un cambio de plan) o cuando empieza un ciclo nuevo. A los contactos que ya son activos en el ciclo puedes seguir escribiéndoles. El envío frenado no sale y no se guarda ningún mensaje ni tu `client_reference`: no queda nada en el historial del contacto. `POST /contacts/{contact}/message/form` responde el mismo `429` con `mac_lockout_24h` y tampoco guarda ningún mensaje. `POST /devices/{device}/templates/{template_id}/send-template` y las reacciones no responden este `429`; en un reenvío la respuesta es por destino: el destino frenado viene con `status` `blocked`, `reason` `mac_lockout_24h` o `mac_limit_reached` y `message` `null`, sin mensaje guardado.

### Enviar un archivo por URL
No subes el archivo a Funnelchat: en `file` mandas la dirección (URL) del archivo y WhatsApp o el proveedor lo descarga desde ahí. Funnelchat no abre la URL al recibir tu llamada, así que un archivo inaccesible, vencido o fuera de los límites se conoce al enviarlo: el mensaje termina `failed` con el error del proveedor.
- **La URL:** `file` admite hasta 4096 caracteres; más de eso se rechaza con un 422 en `file`. Si `file` empieza con `http`, en mayúsculas o minúsculas, tiene que ser una URL que empiece con `http://` o `https://`; si no (por ejemplo `httpfoto.jpg`), la respuesta es 422 con el error en `file`. Te recomendamos `https://`; `http://` también se acepta, pero viaja sin cifrar. Debe poder descargarse sin credenciales; puede ser una URL firmada. Tiene que seguir válida hasta que el mensaje sale: un envío con clave puede esperar en cola hasta 54 minutos, así que usa URLs que duren al menos una hora. No pongas secretos en la ruta ni en el dominio de la URL: en los registros de actividad (logs) del envío que escribe Funnelchat, de la URL quedan sólo el esquema, el dominio y la ruta (sin el usuario y la contraseña, la parte de consulta después de `?` ni el fragmento después de `#`) y del resultado sólo identificadores, el tipo del mensaje y, del error del proveedor, sus códigos y, sólo si tu número es de WhatsApp Cloud, su categoría, su título corto y su identificador de traza, nunca el texto de la respuesta del proveedor; la ruta y el dominio sí quedan. La URL completa viaja a WhatsApp o al proveedor de tu número, que la descarga y puede guardarla en sus propios registros. Además, la URL completa, con su consulta, se guarda en el historial del contacto, la ven los usuarios de tu cuenta y se copia al reenviar el mensaje: usa URLs firmadas de corta duración (al menos el tiempo de la cola, cerca de una hora) y limitadas a un solo archivo.
- **El tipo:** decide la extensión de la ruta de la URL si es una de la lista; si no, el final de la URL completa si es una de la lista. Si la ruta no termina en una extensión de la lista y sólo lo hace el final de la URL completa (por ejemplo `https://cdn.example.com/video.mov?poster=frame.jpg`), el mensaje queda registrado con ese tipo, pero WhatsApp o el proveedor pueden enviarlo según la extensión de la ruta; si necesitas un tipo fijo, envía `file_type`:
  - `.jpg`, `.jpeg`, `.png`: `image`
  - `.webp`: `sticker`
  - `.ogg`, `.oga`, `.mp3`, `.m4a`, `.aac`, `.opus`, `.wav`: `audio`
  - `.gif`, `.mp4`: `video`
  - `.doc`, `.docx`, `.pdf`: `document`
- **Cuándo envías `file_type`:** si la URL no termina en una extensión reconocida (por ejemplo una URL firmada sin extensión), la respuesta es 422 con el error en `file_type`: agrega `file_type` con uno de estos valores: `image`, `video`, `audio`, `document`, `sticker`. Cuando lo envías, manda sobre la extensión: sirve también para un archivo cuya extensión no es de los tipos de la lista, como `.xlsx`, que se envía con `file_type` = `document` y `file_name` (por ejemplo `reporte.xlsx`), porque un documento cuya URL no termina en una extensión de la lista necesita su nombre. Si la URL termina en una extensión que no es la del archivo (como `/descarga.php?id=7`) y no envías `file_type`, la respuesta es 415 con la extensión recibida (`php`); con `file_type` se envía y, si es un documento, también hace falta `file_name`.
- **Extensión no soportada:** si la ruta de la URL termina en un formato real que no enviamos solos (por ejemplo `.xlsx` o `.zip`), la URL completa no termina en una extensión de la lista y no mandas `file_type`, la respuesta es 415 con la extensión recibida.
- **El nombre del archivo:** `file_name` (opcional, hasta 255 caracteres, sin `/`, `\`, `?`, `#` ni caracteres de control) es el nombre con el que el contacto ve un documento; llévalo siempre con su extensión, por ejemplo `factura.pdf`. Es obligatorio cuando envías un documento por URL y la URL no termina en una extensión de la lista: sin él la respuesta es 422 con el error en `file_name`.
- **Formatos y tamaños:** los formatos aceptados por WhatsApp y el tamaño máximo de cada tipo son:
  - `image`: image/jpeg, image/png, image/webp; hasta 5 MB.
  - `video`: video/mp4, video/3gpp, image/gif; hasta 16 MB.
  - `audio`: audio/aac, audio/mp4, audio/mpeg, audio/amr, audio/ogg, audio/opus; hasta 16 MB.
  - `document`: text/plain, application/pdf, application/vnd.ms-powerpoint, application/msword, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.openxmlformats-officedocument.presentationml.presentation, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; hasta 100 MB.
  - `sticker`: image/webp; hasta 100 KB si es estático y 500 KB si es animado.
- **Historial y reenvío:** el historial del contacto guarda la URL tal cual la enviaste, y el nombre `file_name` no se guarda. Al reenviar un mensaje cuyo archivo es una URL, se reenvía la misma URL; con una extensión de la lista, como esa extensión indica; si no, un mensaje que enviaste se reenvía con su tipo sólo cuando su extensión es un formato que WhatsApp acepta para ese tipo (los de «Formatos y tamaños», por ejemplo `.3gp` para `video` o `.amr` para `audio`). Una URL sin extensión, un formato no aceptado, un documento cuya URL no termina en una extensión de la lista (por ejemplo `/descarga.php?id=7`) o un mensaje recibido sin una extensión de la lista no se puede reenviar: la respuesta es 422 con `error` = `not_forwardable` y `reason` = `unsupported_file_extension`.

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
