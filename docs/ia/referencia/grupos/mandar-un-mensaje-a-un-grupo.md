# Mandar un mensaje a un grupo — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/grupos/mandar-un-mensaje-a-un-grupo/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Mandar un mensaje a un grupo

`POST /api/v1/groups/{group}/messages` · permiso **Grupos y campañas → Enviar** · área communities · `operationId` `apiGroupAction.sendMessage`

**Para qué sirve:** Úsalo para mandarle a un grupo un texto, o una imagen, un video, un audio o un documento, desde uno de tus números. El pedido se acepta enseguida, queda en cola y el mensaje sale después, al ritmo del número.

**Nota:** Asíncrona: responde 202 con `action_id`; consulta el resultado en `GET /groups/actions/{action}` (`result.message.uid` es el id del mensaje en WhatsApp). `type`: `text`, `image`, `video`, `audio` o `document`. Con un número QR sale al ritmo de los mensajes programados de velocidad Low, que el integrador no puede cambiar. Con un número oficial se verifican, antes de aceptar, la ventana de servicio de 24 horas y la calidad del número. No tiene tope de volumen del plan. Si el grupo todavía no está en la cuenta y el número es QR, primero se importa como en `POST /groups/{group}/import` (pide además **Grupos y campañas → Administrar grupos**, `403 import_permission_required` sin él) y el envío sigue con las mismas reglas: si el número no es administrador del grupo no se importa nada y responde `422 device_not_group_admin`. Esa importación cuenta en el tope de 5 por minuto del número.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `type` | string ∈ {"text", "image", "video", "audio", "document"} | sí |  |
| `text` | string | no |  |
| `media_url` | string | no |  |
| `caption` | string | no |  |
| `file_name` | string | no |  |

**Respuestas**

- `202` — `ApiGroupActionAcceptedResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `action_id` | string |  |
  | `status` | "queued" |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
