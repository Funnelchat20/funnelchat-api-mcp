# Renovar el link de invitación de un grupo — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/acciones-de-grupo/renovar-el-link-de-invitacion-de-un-grupo/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Renovar el link de invitación de un grupo

`POST /api/v1/groups/{group}/invite-link/renew` · permiso **Grupos y campañas → Administrar grupos** · área communities · `operationId` `apiGroupAction.renewInviteLink`

**Para qué sirve:** Úsalo para renovar el link de invitación de un grupo. Con un número oficial, el anterior deja de servir y WhatsApp genera uno nuevo; con uno por QR, vuelve a leer el vigente sin cambiarlo.

**Nota:** Asíncrona: responde 202 con `action_id`; consulta el resultado en `GET /groups/actions/{action}`. Con un número QR relee el link vigente y NO lo revoca (los proveedores QR de WhatsApp no exponen revocación acá); con un número oficial revoca el link y WhatsApp genera uno nuevo. El resultado trae `invite_link`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |

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
