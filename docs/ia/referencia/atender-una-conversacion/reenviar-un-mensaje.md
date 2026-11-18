# Reenviar un mensaje — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/atender-una-conversacion/reenviar-un-mensaje/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
