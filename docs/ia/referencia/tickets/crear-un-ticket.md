# Crear un ticket — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/tickets/crear-un-ticket/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Crear un ticket

`POST /api/v1/tickets` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `ticket.store`

**Para qué sirve:** Úsalo para abrir un ticket sobre un contacto (título y descripción) y asignárselo a un usuario del equipo, por ejemplo cuando tu sistema detecta un reclamo.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `userId` | string | sí | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
| `contactId` | string | sí | Id opaco: un texto que empieza con `ctc_`. Se usa tal como llega; no se arma ni se interpreta. |
| `title` | string | sí |  |
| `description` | string | sí |  |

**Respuestas**

- `201` — Created

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string | Id opaco: un texto que empieza con `tkt_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `user_id` | string | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `contact_id` | string \| null | Id opaco: un texto que empieza con `ctc_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `title` | string |  |
  | `description` | string \| null |  |
  | `deadline` | integer \| null |  |
  | `created_at` | string (date-time) \| null |  |
  | `updated_at` | string (date-time) \| null |  |
  | `actor_user_id` | string \| null | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found
- `422` — Unprocessable Content (`ConversationsValidationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
