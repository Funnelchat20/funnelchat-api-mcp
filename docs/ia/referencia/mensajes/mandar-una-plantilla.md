# Mandar una plantilla — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/mensajes/mandar-una-plantilla/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
