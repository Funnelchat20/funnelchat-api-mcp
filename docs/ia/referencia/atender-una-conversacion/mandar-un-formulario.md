# Mandar un formulario — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/atender-una-conversacion/mandar-un-formulario/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
