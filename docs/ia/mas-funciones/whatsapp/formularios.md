# Formularios de WhatsApp — API de Funnelchat: contexto para tu IA

> Copiado de /docs/mas-funciones/whatsapp/#formularios. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Formularios de WhatsApp: armar y publicar

- **Dos ids, no los confundas.** `family_id` es el formulario y no cambia: va en `/api/v1/forms/families/{familyId}/…`,
  en `form_id` al mandarlo y llega en `data.form.id` de `whatsapp_form.completed`. `id` es una versión y cambia con
  cada versión: va en `/api/v1/forms/{id}/…` (ver, guardar, borrar, validar, publicar, versiones y números) y llega en
  `data.form.version_id`. `GET /api/v1/forms` («Ver tus formularios», abajo) trae los dos.
- **Solo números oficiales:** `device_id`, `device_ids` y los números que sumes tienen que ser números oficiales de la
  cuenta (`connection` `coexistence` o `dedicated` en `GET /api/v1/devices/{device}`); si no, `422 NUMBER_NOT_ELIGIBLE`.
- **El recorrido:**
  1. `POST /api/v1/forms` con `template_key` (`blank` para empezar de cero; las demás `key` están en
     `GET /api/v1/forms/templates`), `device_id` y, si quieres, `device_ids` (hasta 50). Responde `201` con la versión
     en borrador en `data` (`id`, `family_id`), `lint` y `numbers`. El contenido no va acá.
  2. `PUT /api/v1/forms/{id}` con `definition` (`screens`) y, si quieres, `name` (hasta 120 caracteres) y
     `expected_updated_at` (el `updated_at` que leíste: si alguien guardó después, `409 STALE`; vuelve a leer antes de
     pisar). Guarda tal como llega y responde `data` y `lint`, una lista de `{code, severity, screenId, itemId,
     message}`: lo que tiene `severity` `error` impide publicar; lo demás no. `422` si la definición tiene la forma
     rota.
  3. Opcional: `POST /api/v1/forms/{id}/sync` valida en Meta sin publicar; lo que Meta observa llega en `lint` con
     `code` `meta`. Con errores, `422 LINT`.
  4. `POST /api/v1/forms/{id}/publish`: inmediato. `422 LINT` con la lista si hay errores (corrige y vuelve a
     guardar); `502 META` si Meta la rechaza o no responde; `422 META` si la cuenta de WhatsApp Business no cumple los
     requisitos de integridad de Meta (díselo a la persona; no reintentes). En los otros números se publica después:
     mira `GET /api/v1/forms/{id}/numbers` (`draft`, `publishing`, `published` o `failed`).
  5. Para mandarlo: «Mandar un formulario de WhatsApp», abajo.
- **`blank` no viene vacío:** trae una pantalla `SCREEN_BLNK` sin elementos cuyo `next` es `complete`. Si la conservas y
  agregas otra, la segunda queda inalcanzable (`lint`: `screen_unreachable`, impide publicar). Reemplaza `screens`
  entera con tus pantallas.
- **La forma de una definición:** cada pantalla con `id`, `title`, `cta`, `next` e `items`; cada elemento con `type` y,
  si es una pregunta, `name`. Los `type`: de presentación, `heading`, `subheading`, `body`, `caption`, `image` y
  `link`; preguntas (llevan `name`), `text`, `number`, `email`, `phone`, `textarea`, `date`, `dropdown`, `radio`,
  `checkbox` y `optin`. La especificación no los enumera; la API solo exige que `type` sea un texto, y uno que no es
  de la lista no se rechaza al guardar: lo marca `lint`. Para ver una definición válida, lee la `definition` de un
  modelo en `GET /api/v1/forms/templates` o la de un formulario de la cuenta con
  `GET /api/v1/forms/families/{familyId}/definition`, y copia su forma. No inventes tipos.
- **Reglas que el servidor no arregla** (quien arma la definición genera los ids):
  - Pantallas: `id` con `SCREEN_` más letras, sin dígitos (`SCREEN_DATOS`), únicos. `next`: `auto` (la siguiente),
    `complete` (termina) o el `id` de una pantalla posterior: solo hacia adelante.
  - Preguntas: `name` en minúsculas y guiones bajos (`a-z` y `_`), único en todo el formulario, sin dígitos, tildes,
    `ñ` ni espacios; nunca `flow_token`, `version` ni `extension_message_response`. No cambies un `name` ya creado: las
    respuestas, las ramas y las etiquetas lo usan.
  - Opciones: `id` en minúsculas y guiones bajos, único en su pregunta (`op_comercio`).
  - El linter no revisa que los ids sean únicos ni que existan los campos personalizados (`map` con `target` `custom`
    y `key`, el nombre del campo) y las etiquetas (`tagMap`, con el nombre) que usas: compruébalo con
    `GET /api/v1/custom-fields` y `GET /api/v1/tags`. Si no existen, la respuesta se guarda en el formulario pero no en
    el contacto. Un campo numérico admite solo preguntas `number`, y uno de fecha solo `date`.
  - No se publican los que necesitan un servidor propio (`endpoint` en `true`).
- **Límites:** hasta 5 pantallas, y por pantalla 50 elementos, 3 imágenes y 2 enlaces. Imágenes (`type` `image`) en
  `src` en base64 **sin** el prefijo `data:` (con el prefijo se guarda, pero Meta muestra un recuadro roto), JPG o PNG,
  hasta 300 KB cada una y 4 MB entre todas: el servidor no lo revisa. Cada guardado manda la definición entera y tiene
  que pesar menos de unos 6 MB.
- **Estados de un formulario** (`status` en `GET /api/v1/forms`): `draft` (borrador: se edita) y `published`
  (congelado; se manda). Una versión reemplazada sigue `published`, con `retained_reason`. El filtro acepta también
  `deprecated`.
- **Cambiar uno publicado:** `PUT` y `DELETE` responden `409 PUBLISHED`. `POST /api/v1/forms/{id}/versions` crea la
  versión siguiente como borrador (`201`) o, si ya había un borrador, responde `200` con `created: false` y ese
  borrador: edita ese. Después, publícalo; el `form_id` no cambia.
- **Borrar:** `DELETE /api/v1/forms/{id}` borra solo un borrador (`204`). Hazlo solo si la persona lo pide de forma
  explícita para eso; confírmale qué vas a borrar (nombre, versión e id) antes de llamar. Uno publicado responde
  `409 PUBLISHED` («se depreca»); la especificación no describe cómo deprecarlo por la API.

## Formularios de WhatsApp: números, respuestas y métricas

- **Números:** `GET /api/v1/forms/{id}/numbers` → `numbers`, cada uno con `device_id`, `primary` (el número con el que
  se creó: es el primero y no se saca), `status` y `error`. `POST /api/v1/forms/{id}/numbers` con `device_id` suma un
  número (si la versión ya está publicada, se publica ahí enseguida). `POST /api/v1/forms/{id}/numbers/retry`
  reintenta los que fallaron o no se publicaron. `DELETE /api/v1/forms/{id}/numbers/{deviceId}` saca uno y deja de
  mandarse por él: hazlo solo si la persona lo pide de forma explícita para eso; confírmale el formulario y el número
  (nombre e id) antes de llamar. Con el principal, `422 PRIMARY_NUMBER`.
- Si al mandarlo responde `form_not_on_number`, súmale ese número con `POST /api/v1/forms/{id}/numbers` (el `id` de la
  versión publicada) y espera a que esté `published`.
- **Respuestas:** `GET /api/v1/forms/families/{familyId}/responses`, de la más reciente a la más antigua, todas las
  versiones juntas, por páginas (`perPage` de 1 a 100). Junto a `data` viene `columns` (las preguntas). Filtros: `from`
  y `to` (fecha y hora), `version_id` (el `id` de una versión de ese formulario) y `search` (nombre o teléfono del
  contacto) y `status`: `completed` (completada), `pending` (esperando la respuesta), `not_sent` (no se mandó) o
  `unfinished` (venció o se canceló). También `origin`, `kind` y `effect_status`, cuyos valores la especificación no
  enumera: no los adivines. No describe los campos de cada fila: el `id` de cada una es el `{runId}` del detalle.
- **Una respuesta:** `GET /api/v1/forms/families/{familyId}/responses/{runId}` trae `contact` (`id`, `name`, `phone`),
  `status` (`key` `completed`, `pending`, `unfinished` o `not_sent`, con su `label`), `answers` (`name`, `label`,
  `value`, `unknown`), `effects` (lo que se hizo con las respuestas; con una clave, sin `last_error`) y sus fechas.
- **Métricas:** `GET /api/v1/forms/families/{familyId}/metrics`, con los mismos filtros de fecha, versión y origen.
  Trae `sent`, `delivered`, `read`, `completed`, `pending`, `unfinished`, `partial`, `not_sent` (con
  `not_sent_reasons`), `completion_rate`, `delivery_rate`, `read_rate` y `median_seconds_to_complete`. La
  especificación no dice si los porcentajes van de 0 a 1 o de 0 a 100: mira el valor antes de mostrarlo.
- **Con la clave de un agente:** trabaja sobre los formularios del titular; las respuestas se limitan a los contactos
  que ese agente puede ver, pero las métricas cuentan todas.
- **Topes:** por clave, 120 lecturas y 60 escrituras por minuto en formularios; `sync`, `publish` y las llamadas de
  números comparten además 30 por minuto entre todas las claves de la cuenta. Al pasarte, `429` con `Retry-After`:
  espera esos segundos. No leas las respuestas en un bucle: para enterarte en el momento, `whatsapp_form.completed`.

## Mandar un formulario de WhatsApp

- `POST /api/v1/contacts/{contact}/message/form` con `form_id` y `device_id` (obligatorios) y, si quieres, `text`
  (hasta 1024 caracteres; si no, el nombre del formulario), `button_text` (hasta 30, sin emojis; si no, «Abrir» u
  «Open» según el idioma del usuario de la clave) y `client_reference` (de 1 a 64 caracteres visibles, sin espacios).
- `form_id` es el formulario, no una versión: el mismo en todas sus versiones, y sale la versión publicada vigente.
  `device_id` es el número oficial por el que sale; el formulario tiene que estar publicado en ese número. Solo dentro
  de las 24 horas siguientes al último mensaje del contacto a ese número.
- **Conseguir el `form_id`:** `GET /api/v1/forms` lista los formularios de la cuenta, uno por formulario aunque tenga
  varias versiones, y de cada uno la versión que se usa hoy (la publicada o, si no hay, la más nueva). **En `form_id`
  va el `family_id` de la fila, no su `id`:** el `id` es el de esa versión. Filtra con `q` (parte del nombre),
  `status` (`draft`, `published` o `deprecated`; para mandar, `published`) y `device_id` (un número de la cuenta; si
  no es oficial, `422` `NUMBER_NOT_ELIGIBLE`), y pagina con `page` y `perPage` (de 1 a 100, 25 por defecto). La clave
  de un agente ve los formularios del titular de la cuenta. Si no hay ninguno publicado, díselo a la persona; no
  inventes un `form_id`. Cada clave puede hacer hasta 120 lecturas de formularios por minuto; al pasarte, `429` con
  `Retry-After`: espera esos segundos.
- La clave de un agente solo manda a los contactos asignados a ese agente (con otro, el `404` de un contacto que no
  existe); la del titular, a cualquier contacto de la cuenta.
- Responde `200` con `message` en cola (`status` `queued`, `type` `whatsapp_form`): aceptado no es entregado. El
  estado llega por `message.status_changed` o con «Ver un mensaje». Si no se pudo poner en cola, también es `200`,
  con `status` `failed` y `error.reason` `not_queued`: no salió, y reintentar no lo duplica.
- `404 not_found` si el contacto no existe o no es de la cuenta; `404 form_not_found` si el formulario no existe en la
  cuenta.
- `422` con `error`: `device_unavailable` (el número no es de la cuenta o no está conectado), `number_not_eligible`
  (no es un número oficial que pueda mandar formularios), `form_not_published` (el formulario no tiene versión
  publicada), `form_not_on_number` (no está publicado en ese número), `recipient_unreachable` (el contacto no tiene
  teléfono ni identificador de WhatsApp), `contact_blocked` (la persona bloqueó al contacto en ese número),
  `window_closed` (pasaron más de 24 horas) y `not_sent` (no se registró ni salió nada; puedes reintentar). También los
  de las reglas de envío de «Mandar mensajes» (`antiblock_duplicate_content`, `antiblock_unanswered_limit`,
  `recipient_unsupported`).
- `429 rate_limited` con `Retry-After`: el ritmo del número o del contacto. `429 mac_lockout_24h`: la cuenta está
  bloqueada por el límite de contactos activos; no se guarda nada (tampoco el `client_reference`), así que reintenta
  cuando termine el bloqueo.
- Un `500`, o una llamada sin respuesta: busca tu `client_reference` en los mensajes del contacto antes de reintentar.

## Recibir lo que contestó el contacto

- Llega por el evento `whatsapp_form.completed`: crea un webhook con `"events": ["whatsapp_form.completed"]` (pide
  **Contactos y conversaciones → Ver**, además del permiso de los webhooks).
- `data.form.id` es el formulario (el `family_id`, el mismo `form_id` con el que lo mandaste) y `data.form.version_id`
  la versión que recibió el contacto. `data.answers` trae una entrada `{key, label, value}` por pregunta, en el orden
  del formulario: `key` es el nombre de la pregunta, `label` su etiqueta y `value` lo que contestó (texto, número,
  `true` o `false`, una lista en las de opción múltiple, o `null` si no la contestó). En las preguntas de lista y de
  opción múltiple, `value` es el id de la opción, no su texto. Cada respuesta de texto llega con hasta 600 caracteres.
- `data.message_id` es el id del mensaje del formulario (`null` si el envío no tuvo un mensaje público),
  `data.device_id` el número por el que salió (`null` si ya no es de la cuenta) y `data.contact_id` el contacto
  (`null` si se borró antes del evento, y las respuestas llegan igual; si se unió con otro, el del contacto que quedó;
  mientras se unen, puede ser el del que se está uniendo).
- Llega aunque la respuesta llegue tarde. Puede llegar más de una vez con el mismo `id`: descarta los repetidos por
  `id`. Si el contacto vuelve a mandar el mismo formulario no llega otro evento: vale la primera respuesta.

## Llamadas

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
- `422` — Unprocessable Content
- `429` — Too Many Requests. Cabeceras: `Retry-After`
- `500` — Internal Server Error

### Ver los modelos de formulario

`GET /api/v1/forms/templates` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `whatsappForm.templates`

**Para qué sirve:** Sirve para ver los modelos con los que puedes empezar un formulario de WhatsApp (uno en blanco y otros listos) y elegir la `key` que pides al crearlo.

Devuelve las plantillas con las que puedes empezar un formulario nuevo: `key`, `title`, `description` y `category`. El catálogo es fijo y el mismo para todas las cuentas.

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<WhatsappFormTemplate> |  |
  | `data[].id` | integer |  |
  | `data[].key` | string |  |
  | `data[].title` | string |  |
  | `data[].description` | string |  |
  | `data[].category` | string |  |
  | `data[].definition` | array<any> |  |
  | `data[].sort` | integer |  |
  | `data[].created_at` | string (date-time) \| null |  |
  | `data[].updated_at` | string (date-time) \| null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)

### Crear un formulario

`POST /api/v1/forms` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `whatsappForm.store`

**Para qué sirve:** Úsalo para empezar un formulario de WhatsApp en uno de tus números oficiales, a partir de un modelo: queda como borrador y después le guardas su contenido.

Crea un formulario nuevo como borrador de tu cuenta. Envía `template_key` (una de las `key` de `GET /forms/templates`; `blank` empieza vacío), `device_id` (un número de WhatsApp Cloud de tu cuenta) y, si quieres, `device_ids` con otros números donde también vivirá. Responde 201 con la versión (`id`), su `family_id`, `lint` y `numbers`. Si un número no es de tu cuenta o no es WhatsApp Cloud responde 422 `NUMBER_NOT_ELIGIBLE`.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `device_ids` | array<string> | no |  |
| `template_key` | string | sí |  |

**Respuestas**

- `201` — Created

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | WhatsappFormResource |  |
  | `data.id` | string | Id opaco: un texto que empieza con `frv_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.family_id` | string | Id opaco: un texto que empieza con `frm_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.name` | string |  |
  | `data.label` | string |  |
  | `data.category` | string |  |
  | `data.status` | string |  |
  | `data.version` | integer |  |
  | `data.definition` | array<any> |  |
  | `data.fields` | array<any> \| null |  |
  | `data.mapping` | array<any> \| null |  |
  | `data.tag_rules` | array<any> \| null |  |
  | `data.has_endpoint` | boolean |  |
  | `data.first_screen` | string \| null |  |
  | `data.first_screen_dynamic` | boolean |  |
  | `data.lint_errors_count` | integer |  |
  | `data.draft_id` | string | Id opaco: un texto que empieza con `frv_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.draft_version` | integer |  |
  | `data.sends` | integer |  |
  | `data.responses` | integer |  |
  | `data.meta_flow_id` | string \| null |  |
  | `data.flow_json` | array<any> \| null |  |
  | `data.validation_errors` | array<any> \| null |  |
  | `data.published_at` | string \| null |  |
  | `data.updated_at` | string \| null |  |
  | `lint` | array<any> |  |
  | `numbers` | array<any> |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver un formulario

`GET /api/v1/forms/{id}` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `whatsappForm.show`

**Para qué sirve:** Sirve para ver una versión de un formulario con su contenido, lo que falta corregir antes de publicarla, sus versiones y sus números.

Devuelve una versión de un formulario de tu cuenta con su definición y su detalle. `{id}` es el `id` de la versión (el de las filas de `GET /forms`), no el `family_id`. Trae además `lint` (lo que falta corregir antes de publicar), `versions` (las versiones del formulario) y `numbers` (los números donde vive). Responde 404 si la versión no existe o no es de tu cuenta.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | WhatsappFormResource |  |
  | `data.id` | string | Id opaco: un texto que empieza con `frv_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.family_id` | string | Id opaco: un texto que empieza con `frm_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.name` | string |  |
  | `data.label` | string |  |
  | `data.category` | string |  |
  | `data.status` | string |  |
  | `data.version` | integer |  |
  | `data.definition` | array<any> |  |
  | `data.fields` | array<any> \| null |  |
  | `data.mapping` | array<any> \| null |  |
  | `data.tag_rules` | array<any> \| null |  |
  | `data.has_endpoint` | boolean |  |
  | `data.first_screen` | string \| null |  |
  | `data.first_screen_dynamic` | boolean |  |
  | `data.lint_errors_count` | integer |  |
  | `data.draft_id` | string | Id opaco: un texto que empieza con `frv_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.draft_version` | integer |  |
  | `data.sends` | integer |  |
  | `data.responses` | integer |  |
  | `data.meta_flow_id` | string \| null |  |
  | `data.flow_json` | array<any> \| null |  |
  | `data.validation_errors` | array<any> \| null |  |
  | `data.published_at` | string \| null |  |
  | `data.updated_at` | string \| null |  |
  | `lint` | array<any> |  |
  | `versions` | array<WhatsappForm> |  |
  | `versions[].id` | string | Id opaco: un texto que empieza con `frv_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `versions[].user_id` | string | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `versions[].workspace_id` | integer \| null |  |
  | `versions[].phone_number_id` | string |  |
  | `versions[].family_id` | string | Id opaco: un texto que empieza con `frm_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `versions[].name` | string |  |
  | `versions[].category` | string |  |
  | `versions[].status` | string |  |
  | `versions[].version` | integer |  |
  | `versions[].parent_flow_id` | string \| null | Id opaco: un texto que empieza con `frv_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `versions[].definition` | array<any> |  |
  | `versions[].flow_json` | array<any> \| null |  |
  | `versions[].flow_json_hash` | string \| null |  |
  | `versions[].fields` | array<any> \| null |  |
  | `versions[].mapping` | array<any> \| null |  |
  | `versions[].tag_rules` | array<any> \| null |  |
  | `versions[].has_endpoint` | boolean |  |
  | `versions[].first_screen` | string \| null |  |
  | `versions[].first_screen_dynamic` | boolean |  |
  | `versions[].meta_flow_id` | string \| null |  |
  | `versions[].validation_errors` | array<any> \| null |  |
  | `versions[].lint_errors_count` | integer |  |
  | `versions[].retained_reason` | string \| null |  |
  | `versions[].published_at` | string (date-time) \| null |  |
  | `versions[].deprecated_at` | string (date-time) \| null |  |
  | `versions[].created_at` | string (date-time) \| null |  |
  | `versions[].updated_at` | string (date-time) \| null |  |
  | `versions[].deleted_at` | string (date-time) \| null |  |
  | `versions[].actor_user_id` | string \| null | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `numbers` | array<any> |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)

### Editar un formulario

`PUT /api/v1/forms/{id}` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `whatsappForm.update`

**Para qué sirve:** Úsalo para guardar el contenido de un borrador de formulario —sus pantallas y preguntas— y ver en la respuesta qué falta corregir antes de publicarlo.

Guarda la definición de un borrador. `{id}` es el `id` de la versión. Envía `definition` con `screens` (cada pantalla con `id` de texto y `items`; cada bloque con `type`, y las preguntas con `name`) y, si quieres, `name` y `expected_updated_at`. Una definición con la forma rota responde 422 con el error en su ruta. Lo incompleto (sin título, sin bloques, etiquetas vacías) se guarda y la respuesta trae en `lint` lo que falta corregir. Responde 409 `PUBLISHED` si la versión ya está publicada (crea otra con `POST /forms/{id}/versions`) y 409 `STALE` si `expected_updated_at` no es el último guardado. Responde 404 si no existe o no es de tu cuenta.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `name` | string | no |  |
| `definition` | object | sí |  |
| `definition.screens` | array<object> | sí |  |
| `definition.screens[].id` | string | sí |  |
| `definition.screens[].title` | string \| null | no |  |
| `definition.screens[].cta` | string \| null | no |  |
| `definition.screens[].next` | string \| null | no |  |
| `definition.screens[].routes` | object \| null | no |  |
| `definition.screens[].items` | array<object> | no |  |
| `expected_updated_at` | string \| null | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | WhatsappFormResource |  |
  | `data.id` | string | Id opaco: un texto que empieza con `frv_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.family_id` | string | Id opaco: un texto que empieza con `frm_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.name` | string |  |
  | `data.label` | string |  |
  | `data.category` | string |  |
  | `data.status` | string |  |
  | `data.version` | integer |  |
  | `data.definition` | array<any> |  |
  | `data.fields` | array<any> \| null |  |
  | `data.mapping` | array<any> \| null |  |
  | `data.tag_rules` | array<any> \| null |  |
  | `data.has_endpoint` | boolean |  |
  | `data.first_screen` | string \| null |  |
  | `data.first_screen_dynamic` | boolean |  |
  | `data.lint_errors_count` | integer |  |
  | `data.draft_id` | string | Id opaco: un texto que empieza con `frv_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.draft_version` | integer |  |
  | `data.sends` | integer |  |
  | `data.responses` | integer |  |
  | `data.meta_flow_id` | string \| null |  |
  | `data.flow_json` | array<any> \| null |  |
  | `data.validation_errors` | array<any> \| null |  |
  | `data.published_at` | string \| null |  |
  | `data.updated_at` | string \| null |  |
  | `lint` | array<any> |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Borrar un formulario

`DELETE /api/v1/forms/{id}` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `whatsappForm.destroy`

**Para qué sirve:** Sirve para borrar un borrador de formulario que ya no vas a publicar. Un formulario publicado no se borra.

Elimina un borrador. `{id}` es el `id` de la versión. Un formulario publicado no se elimina: responde 409 `PUBLISHED`. Responde 404 si la versión no existe o no es de tu cuenta.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |

**Respuestas**

- `204` — No Content
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `409` — Conflict

### Crear una versión de un formulario

`POST /api/v1/forms/{id}/versions` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `whatsappForm.storeVersion`

**Para qué sirve:** Úsalo para cambiar un formulario ya publicado: crea un borrador nuevo a partir de esa versión, que editas y publicas sin cambiar el `form_id` con el que lo mandas.

Crea la versión siguiente de un formulario publicado, como borrador, para poder cambiarlo. `{id}` es el `id` de la versión desde la que partes. Responde 201 con la versión nueva, o 200 con `created: false` si el formulario ya tenía un borrador (ese borrador es la respuesta). Responde 404 si la versión no existe o no es de tu cuenta.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | WhatsappFormResource |  |
  | `data.id` | string | Id opaco: un texto que empieza con `frv_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.family_id` | string | Id opaco: un texto que empieza con `frm_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.name` | string |  |
  | `data.label` | string |  |
  | `data.category` | string |  |
  | `data.status` | string |  |
  | `data.version` | integer |  |
  | `data.definition` | array<any> |  |
  | `data.fields` | array<any> \| null |  |
  | `data.mapping` | array<any> \| null |  |
  | `data.tag_rules` | array<any> \| null |  |
  | `data.has_endpoint` | boolean |  |
  | `data.first_screen` | string \| null |  |
  | `data.first_screen_dynamic` | boolean |  |
  | `data.lint_errors_count` | integer |  |
  | `data.draft_id` | string | Id opaco: un texto que empieza con `frv_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.draft_version` | integer |  |
  | `data.sends` | integer |  |
  | `data.responses` | integer |  |
  | `data.meta_flow_id` | string \| null |  |
  | `data.flow_json` | array<any> \| null |  |
  | `data.validation_errors` | array<any> \| null |  |
  | `data.published_at` | string \| null |  |
  | `data.updated_at` | string \| null |  |
  | `created` | boolean |  |
  | `lint` | array<any> |  |
  | `numbers` | array<any> |  |

- `201` — Created

  La misma tabla que en «Crear una versión de un formulario», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)

### Publicar un formulario

`POST /api/v1/forms/{id}/publish` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `whatsappForm.publish`

**Para qué sirve:** Sirve para publicar una versión de un formulario, al momento, y dejarla lista para mandarla; en los otros números del formulario se publica en segundo plano.

Publica una versión en Meta; la publicación es inmediata. `{id}` es el `id` de la versión. Si la definición tiene errores responde 422 `LINT` con la lista; si Meta rechaza la llamada, 502 `META`, o 422 `META` si la rechaza porque tu cuenta de WhatsApp Business no cumple sus requisitos de integridad. Los otros números del formulario se publican en segundo plano: consulta su estado en `GET /forms/{id}/numbers`. Responde 404 si no existe o no es de tu cuenta. Puedes llamarla hasta 30 veces por minuto.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |

**Respuestas**

- `200` — OK

  La misma tabla que en «Crear un formulario», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)

### Sincronizar un formulario

`POST /api/v1/forms/{id}/sync` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `whatsappForm.sync`

**Para qué sirve:** Úsalo para validar un formulario en Meta sin publicarlo y ver lo que Meta observa antes de publicarlo.

Valida una versión en Meta sin publicarla. `{id}` es el `id` de la versión. Responde la versión con `lint` y lo que Meta observó. Si Meta rechaza la llamada responde 502 `META`, o 422 `META` si la rechaza porque tu cuenta de WhatsApp Business no cumple sus requisitos de integridad. Responde 404 si no existe o no es de tu cuenta. Puedes llamarla hasta 30 veces por minuto.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |

**Respuestas**

- `200` — OK

  La misma tabla que en «Crear un formulario», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)

### Ver los números de un formulario

`GET /api/v1/forms/{id}/numbers` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `whatsappForm.numbersIndex`

**Para qué sirve:** Sirve para ver en qué números oficiales está un formulario y cómo va su publicación en cada uno.

Lista los números de WhatsApp Cloud donde vive una versión de formulario de tu cuenta y el estado de cada uno (`draft`, `publishing`, `published` o `failed`). El primero es el número con el que se creó. `{id}` es el `id` de la versión. Responde 404 si la versión no existe o no es de tu cuenta.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `numbers` | array<any> |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)

### Sumar números a un formulario

`POST /api/v1/forms/{id}/numbers` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `whatsappForm.addNumber`

**Para qué sirve:** Úsalo para sumar un número oficial a un formulario y poder mandarlo también desde ahí; si ya está publicado, se publica en ese número enseguida.

Suma un número de WhatsApp Cloud a una versión de formulario. `{id}` es el `id` de la versión y `device_id` el número de tu cuenta. Si la versión ya está publicada, se publica en ese número de inmediato. Responde `numbers` con el estado de cada número; si el número no es de tu cuenta o no es WhatsApp Cloud responde 422 `NUMBER_NOT_ELIGIBLE`. Puedes llamarla hasta 30 veces por minuto.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `numbers` | array<any> |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Reintentar los números de un formulario

`POST /api/v1/forms/{id}/numbers/retry` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `whatsappForm.retryNumbers`

**Para qué sirve:** Sirve para volver a publicar un formulario en los números en los que falló o todavía no se publicó.

Reintenta publicar los números que fallaron o que aún no se publicaron en una versión ya publicada. `{id}` es el `id` de la versión. Responde `numbers` con el estado de cada número. Responde 404 si no existe o no es de tu cuenta.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `numbers` | array<any> |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)

### Sacar un número de un formulario

`DELETE /api/v1/forms/{id}/numbers/{deviceId}` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `whatsappForm.removeNumber`

**Para qué sirve:** Úsalo para que un formulario deje de mandarse por uno de tus números. El número con el que lo creaste no se saca.

Quita un número de una versión de formulario: deja de enviarse por él. `{id}` es el `id` de la versión y `{deviceId}` el número de tu cuenta. El número con el que se creó el formulario no se quita: responde 422 `PRIMARY_NUMBER`. Responde 404 si la versión o el número no existen o no son de tu cuenta.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |
| `deviceId` | path | string | sí |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `numbers` | array<any> |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found
- `422` — Unprocessable Content

### Ver las versiones de un formulario

`GET /api/v1/forms/families/{familyId}/versions` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `whatsappForm.versions`

**Para qué sirve:** Sirve para ver el historial de versiones de un formulario, cuál es la vigente y cuántas respuestas recibió cada una.

Lista las versiones de un formulario de tu cuenta, de la más nueva a la más vieja, con su estado, si es la vigente y cuántas respuestas recibió cada una. `{familyId}` es el `family_id` del formulario. Pagina con `perPage` (1 a 100, 25 por defecto). Responde 404 si el formulario no existe o no es de tu cuenta.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `familyId` | path | string | sí |  |
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<object> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `frv_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].version` | integer |  |
  | `data[].name` | string |  |
  | `data[].status` | string |  |
  | `data[].is_current` | boolean |  |
  | `data[].published_at` | string \| null |  |
  | `data[].deprecated_at` | string \| null |  |
  | `data[].meta_flow_id` | string \| null |  |
  | `data[].retained_reason` | string \| null |  |
  | `data[].responses` | integer |  |
  | `data[].templates` | integer |  |
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

### Ver la definición de un formulario

`GET /api/v1/forms/families/{familyId}/definition` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `whatsappForm.definition`

**Para qué sirve:** Úsalo para leer el contenido vigente de un formulario con su `family_id` (el de la versión publicada o, si no hay, el de la más nueva), sin buscar antes la versión.

Devuelve la definición de un formulario: la de la versión publicada o, si todavía no hay ninguna, la de la versión más nueva. `{familyId}` es el `family_id` del formulario, no el `id` de una versión. Responde 404 si el formulario no existe o no es de tu cuenta.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `familyId` | path | string | sí |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | object |  |
  | `data.family_id` | string | Id opaco: un texto que empieza con `frm_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.form_id` | string | Id opaco: un texto que empieza con `frv_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.name` | string |  |
  | `data.status` | string |  |
  | `data.version` | integer |  |
  | `data.definition` | array<any> \| object |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)

### Ver las respuestas de un formulario

`GET /api/v1/forms/families/{familyId}/responses` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `whatsappForm.responses`

**Para qué sirve:** Sirve para leer las respuestas de un formulario, de todas sus versiones, con filtros por fecha, versión o contacto; por ejemplo para exportarlas o revisarlas.

Lista las respuestas de un formulario de tu cuenta, de la más reciente a la más antigua, sumando todas sus versiones. Junto a `data` viene `columns`, las preguntas que usan esas respuestas. `{familyId}` es el `family_id` del formulario. Filtra con `from` y `to` (fechas), `version_id` (el `id` de una versión de ese formulario), `origin`, `status` y `search` (nombre o teléfono del contacto). Un filtro con un valor inválido responde 422. Pagina con `perPage` (1 a 100, 25 por defecto). Responde 404 si el formulario no existe o no es de tu cuenta.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `familyId` | path | string | sí |  |
| `from` | query | string (date-time) \| null | no |  |
| `to` | query | string (date-time) \| null | no |  |
| `version_id` | query | string \| null | no |  |
| `origin` | query | string \| null | no |  |
| `status` | query | string \| null | no |  |
| `kind` | query | string \| null | no |  |
| `effect_status` | query | string \| null | no |  |
| `search` | query | string \| null | no |  |
| `page` | query | integer \| null | no |  |
| `perPage` | query | integer | no |  |

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

### Ver una respuesta de un formulario

`GET /api/v1/forms/families/{familyId}/responses/{runId}` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `whatsappForm.response`

**Para qué sirve:** Úsalo para ver una respuesta completa de un formulario: lo que contestó el contacto y lo que se hizo con esas respuestas.

Devuelve una respuesta completa de un formulario de tu cuenta: las respuestas del contacto y lo que se hizo con ellas. `{familyId}` es el `family_id` del formulario y `{runId}` el `id` de la respuesta que viene en `GET /forms/families/{familyId}/responses`. Responde 404 si no existe o no es de tu cuenta.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `familyId` | path | string | sí |  |
| `runId` | path | string | sí |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | object |  |
  | `data.id` | string | Id opaco: un texto que empieza con `frs_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.flow_token` | string |  |
  | `data.contact` | object |  |
  | `data.status` | object |  |
  | `data.origin` | string |  |
  | `data.node_id` | string \| null |  |
  | `data.automation_run_id` | string \| null | Id opaco: un texto que empieza con `run_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.conversation_id` | integer \| null |  |
  | `data.version` | integer |  |
  | `data.version_id` | string | Id opaco: un texto que empieza con `frv_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.output_id` | string \| null |  |
  | `data.output_label` | string \| null |  |
  | `data.reason` | string \| null |  |
  | `data.reason_label` | string \| null |  |
  | `data.completed_after_expiry` | boolean |  |
  | `data.partial` | string |  |
  | `data.last_screen_id` | string \| null |  |
  | `data.sent_at` | string \| null |  |
  | `data.delivered_at` | string \| null |  |
  | `data.read_at` | string \| null |  |
  | `data.responded_at` | string \| null |  |
  | `data.expires_at` | string \| null |  |
  | `data.answers` | array<object> |  |
  | `data.effects` | array<array<any> \| object> |  |
  | `data.response_json` | array<any> \| null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)

### Ver las métricas de un formulario

`GET /api/v1/forms/families/{familyId}/metrics` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `whatsappForm.metrics`

**Para qué sirve:** Sirve para medir un formulario: cuántos se enviaron, cuántos se abrieron y cuántos se completaron, con sus porcentajes.

Devuelve los números de un formulario de tu cuenta: cuántos se enviaron, cuántos se abrieron y cuántos se completaron, y sus porcentajes. `{familyId}` es el `family_id` del formulario. Acepta los mismos filtros de fecha, versión y origen que la lista de respuestas; un filtro inválido responde 422. Responde 404 si el formulario no existe o no es de tu cuenta.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `familyId` | path | string | sí |  |
| `from` | query | string (date-time) \| null | no |  |
| `to` | query | string (date-time) \| null | no |  |
| `version_id` | query | string \| null | no |  |
| `origin` | query | string \| null | no |  |
| `status` | query | string \| null | no |  |
| `kind` | query | string \| null | no |  |
| `effect_status` | query | string \| null | no |  |
| `search` | query | string \| null | no |  |
| `per_page` | query | integer \| null | no |  |
| `page` | query | integer \| null | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | object |  |
  | `data.not_sent` | integer |  |
  | `data.not_sent_reasons` | array<object> |  |
  | `data.sent` | integer |  |
  | `data.delivered` | integer |  |
  | `data.read` | integer |  |
  | `data.completed` | integer |  |
  | `data.pending` | integer |  |
  | `data.unfinished` | integer |  |
  | `data.partial` | integer |  |
  | `data.completion_rate` | number \| null |  |
  | `data.delivery_rate` | number \| null |  |
  | `data.read_rate` | number \| null |  |
  | `data.median_seconds_to_complete` | integer \| null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

## Los eventos

Llegan por webhook. Cómo crear uno, cómo llega cada entrega, los reintentos, el permiso que pide cada evento y cómo verificar la firma (con funciones probadas en Node.js, Python y PHP): https://developers-portal.funnelchat.app/ia/lo-basico.md.

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

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
