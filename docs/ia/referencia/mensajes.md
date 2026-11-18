# Mensajes — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/mensajes/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Mandar un mensaje

`POST /api/v1/message/send-message` · permiso **Contactos y conversaciones → Enviar** · área conversations · `operationId` `message.sendMessage`

**Para qué sirve:** Sirve para enviar un mensaje de texto o un archivo a un teléfono, aunque todavía no sea tu contacto (se crea solo), o a un contacto por su `contact_id`, indicando en el cuerpo el número desde el que sale.

Indica a quién envías con `phone`: el teléfono con código de país, por ejemplo `5491122334455`. No hace falta crear el contacto antes: el teléfono se busca y, si todavía no es un contacto, se crea en el workspace de tu clave, igual que con `POST /contacts/update-or-create` y con el mismo permiso, que **Enviar** ya incluye. Si en tu cuenta cada workspace tiene sus propios contactos, se busca solo en el workspace de tu clave; si tus workspaces comparten los contactos, en toda tu cuenta. La respuesta trae su id en `message.contact_id`, el mismo que llevan los eventos `message.status_changed`. Si el teléfono no es válido, la respuesta es la misma que daría `POST /contacts/update-or-create`: 422. Si tus workspaces comparten los contactos y el teléfono ya es un contacto de otro workspace de tu cuenta, también: 404, sin datos de ese contacto. Con un número oficial de WhatsApp (API Cloud) también puedes indicar `whatsapp_id`, el BSUID que envía Meta (por ejemplo `US.13491208655302741918`), en lugar de `phone`; usado así con un número conectado por QR, responde 422. En un número oficial, el primer mensaje a un contacto nuevo tiene que ser una plantilla: un mensaje libre solo sale dentro de las 24 horas desde que el contacto te escribió. Si ya tienes el `contact_id`, puedes seguir enviándolo: si junto con él mandas `phone` o `whatsapp_id`, tienen que ser de ese mismo contacto (si no, 422 `recipient_mismatch`). En `send-template`, `phone` o `whatsapp_id` va siempre, con o sin `contact_id`.

Si el límite de contactos activos (MAC) frena el envío, responde `429` con `error` = `mac_lockout_24h` o `mac_limit_reached` y sin `Retry-After`: reintentar no sirve hasta que sumes capacidad o empiece un ciclo nuevo. El envío no sale y no se guarda ningún mensaje ni tu `client_reference`: no queda nada en el historial del contacto. Detalle en «Errores y límites».

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `text` | string | no |  |
| `contact_id` | string \| null | no | Id opaco: un texto que empieza con `ctc_`. Se usa tal como llega; no se arma ni se interpreta. |
| `phone` | string \| null | no |  |
| `whatsapp_id` | string \| null | no |  |
| `file` | string | no | Archivo del mensaje: el nombre de un archivo ya subido a tu cuenta o la URL pública de un archivo (te recomendamos `https://`), que WhatsApp o el proveedor descarga; admite hasta 4096 caracteres. Si empieza con `http`, en mayúsculas o minúsculas, tiene que ser una URL `http://` o `https://`; si no, la respuesta es 422. Consulta la sección «Enviar un archivo por URL». |
| `file_type` | string \| null ∈ {"image", "video", "audio", "document", "sticker", null} | no | Tipo del archivo. Es obligatorio cuando `file` es una URL que no termina en una extensión reconocida; si lo envías, manda sobre la extensión. Valores: `image`, `video`, `audio`, `document`, `sticker`. Consulta la sección «Enviar un archivo por URL». |
| `file_name` | string \| null | no | Nombre con el que el contacto ve un documento, con su extensión (por ejemplo `factura.pdf`), de hasta 255 caracteres. Es obligatorio al enviar un documento por URL que no termina en una extensión de la lista. Consulta la sección «Enviar un archivo por URL». |
| `temporal_uuid` | string | no |  |
| `local_id` | string \| null | no |  |
| `note` | boolean | no |  |
| `mentions` | array<integer> \| null | no |  |
| `client_reference` | string \| null | no |  |

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
- `404` — Not Found
- `415` — Unsupported Media Type
- `422` — Unprocessable Content
- `429` — Too Many Requests. Cabeceras: `Retry-After`
- `500` — Internal Server Error

### Mandar una plantilla

`POST /api/v1/devices/{device}/templates/{template}/send-template` · permiso **Contactos y conversaciones → Enviar** · área conversations · `operationId` `messageTemplate.send`

**Para qué sirve:** Sirve para enviar una plantilla desde uno de tus números a un teléfono o contacto, completando sus variables, por ejemplo un recordatorio, una confirmación o una novedad. Si una plantilla que creaste directamente en Meta todavía no aparece en tu lista, tráela con «Traer tus plantillas de Meta» (`POST /api/v1/devices/{device}/templates`).

Indica a quién envías con `phone`: el teléfono con código de país, por ejemplo `5491122334455`. No hace falta crear el contacto antes: el teléfono se busca y, si todavía no es un contacto, se crea en el workspace de tu clave, igual que con `POST /contacts/update-or-create` y con el mismo permiso, que **Enviar** ya incluye. Si en tu cuenta cada workspace tiene sus propios contactos, se busca solo en el workspace de tu clave; si tus workspaces comparten los contactos, en toda tu cuenta. La respuesta trae su id en `message.contact_id`, el mismo que llevan los eventos `message.status_changed`. Si el teléfono no es válido, la respuesta es la misma que daría `POST /contacts/update-or-create`: 422. Si tus workspaces comparten los contactos y el teléfono ya es un contacto de otro workspace de tu cuenta, también: 404, sin datos de ese contacto. Con un número oficial de WhatsApp (API Cloud) también puedes indicar `whatsapp_id`, el BSUID que envía Meta (por ejemplo `US.13491208655302741918`), en lugar de `phone`; usado así con un número conectado por QR, responde 422. En un número oficial, el primer mensaje a un contacto nuevo tiene que ser una plantilla: un mensaje libre solo sale dentro de las 24 horas desde que el contacto te escribió. Si ya tienes el `contact_id`, puedes seguir enviándolo: si junto con él mandas `phone` o `whatsapp_id`, tienen que ser de ese mismo contacto (si no, 422 `recipient_mismatch`). En `send-template`, `phone` o `whatsapp_id` va siempre, con o sin `contact_id`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí |  |
| `template` | path | string | sí |  |

**Cuerpo** (`application/json`)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `contact_id` | string \| null | no | Id opaco: un texto que empieza con `ctc_`. Se usa tal como llega; no se arma ni se interpreta. |
| `phone` | string \| null | no |  |
| `whatsapp_id` | string \| null | no |  |
| `template_variables` | object | no |  |
| `template_variables.body` | array<string \| null> | no |  |
| `client_reference` | string \| null | no |  |

**Respuestas**

- `200` — OK

  La misma tabla que en «Mandar un mensaje», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found
- `422` — Unprocessable Content
- `429` — Too Many Requests. Cabeceras: `Retry-After`
- `500` — Internal Server Error

### Ver tus plantillas

`GET /api/v1/templates` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `messageTemplate.templates`

**Para qué sirve:** Úsalo para listar tus plantillas de WhatsApp con su estado de aprobación, categoría, idioma y número, y elegir cuál usar en un envío. Si una que creaste directamente en Meta no aparece, tráela con «Traer tus plantillas de Meta» (`POST /api/v1/devices/{device}/templates`) y vuelve a listar.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `name` | query | string \| null | no |  |
| `uid` | query | string \| null | no |  |
| `language_code` | query | string \| null | no |  |
| `status` | query | string \| null ∈ {"PENDING", "APPROVED", "REJECTED", "PENDING_DELETION", "PAUSED", "DISABLED", "ARCHIVED", null} | no |  |
| `category` | query | string \| null | no |  |
| `deviceId` | query | string \| null | no |  |
| `type` | query | string \| null ∈ {"text", "image", "document", "video", "location", "default", null} | no |  |
| `created_by_webhook` | query | boolean | no |  |
| `quality[]` | query | array<string \| null ∈ {"GREEN", "YELLOW", "RED", "UNKNOWN", "NOT_APPLICABLE", null}> \| null ∈ {"GREEN", "YELLOW", "RED", "UNKNOWN", "NOT_APPLICABLE", null} | no |  |
| `include` | query | string \| null ∈ {"quality_counts", null} | no |  |
| `scope` | query | string \| null ∈ {"waba", null} | no |  |
| `perPage` | query | integer | no |  |
| `orderBy` | query | string ∈ {"name", "created_at", "updated_at"} | no |  |
| `orderByMethod` | query | string ∈ {"asc", "desc"} | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<object> |  |
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

### Traer tus plantillas de Meta

`POST /api/v1/devices/{device}/templates` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `messageTemplate.sync`

**Para qué sirve:** Úsalo si creaste o cambiaste una plantilla directamente en Meta y todavía no aparece en tu lista (llegan solas una vez por día): la trae en el momento. Solo con números oficiales de WhatsApp. Si responde `in_progress`, vuelve a listar en unos segundos.

Sincroniza con Meta las plantillas de un número de la API oficial de WhatsApp: trae las que se crearon o cambiaron directamente en Meta y quita las de una cuenta de WhatsApp Business que el número ya no usa. `{device}` es el `id` del número.

- **Asíncrona:** la primera página (hasta 100 plantillas) se lee en el momento y las siguientes en segundo plano. Responde 202 con `status`: `completed` si ya terminó, `in_progress` si sigue. Las plantillas sincronizadas se listan con `GET /templates`.
- **Una a la vez:** mientras hay una sincronización de ese número en curso, otra llamada responde 409 y no lanza una nueva.
- **Errores de Meta:** si Meta rechaza la lectura (por ejemplo, porque el token del número venció o la cuenta de WhatsApp Business no existe), responde 422 `meta_rejected` con el código de error de Meta en `meta_code` y no sincroniza nada.

| HTTP | `error` | Cuándo |
|---|---|---|
| 404 | — | El número no existe en tu cuenta o está fuera del workspace de tu clave. |
| 409 | `template_sync_in_progress` | Ya hay una sincronización de ese número en curso. |
| 422 | `number_not_connected_to_meta` | El número está conectado por QR o no tiene una cuenta de WhatsApp Business o credenciales en Meta. |
| 422 | `meta_rejected` | Meta rechazó la lectura de las plantillas (`meta_code` trae su código de error). |
| 429 | — | Demasiadas solicitudes por minuto (ver `Retry-After`). |
| 502 | `meta_unavailable` | Meta no respondió. |

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí |  |

**Respuestas**

- `202` — Accepted

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `status` | string ∈ {"in_progress", "completed"} |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found
- `409` — Conflict
- `422` — Unprocessable Content
- `502` — Bad Gateway

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

## Secciones citadas

Las secciones de la descripción general de cada área que citan las llamadas y los eventos de este texto, tal como las escribe el área.

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
