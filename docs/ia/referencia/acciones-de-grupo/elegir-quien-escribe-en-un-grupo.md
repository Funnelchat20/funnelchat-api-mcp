# Elegir quién escribe en un grupo — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/acciones-de-grupo/elegir-quien-escribe-en-un-grupo/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Elegir quién escribe en un grupo

`PUT /api/v1/groups/{group}/settings` · permiso **Grupos y campañas → Administrar grupos** · área communities · `operationId` `apiGroupAction.updateSettings`

**Para qué sirve:** Sirve para elegir si en un grupo escriben todos o solo los administradores; si escriben solo ellos, también son los únicos que editan los datos del grupo. Solo con números conectados por QR.

**Nota:** Asíncrona: responde 202 con `action_id`; consulta el resultado en `GET /groups/actions/{action}`. `members_can_send_messages`; bloquear la escritura también deja a solo los administradores editando la información del grupo. Solo con números QR. Se ejecuta al ritmo de las campañas del número.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `members_can_send_messages` | boolean | sí |  |

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
