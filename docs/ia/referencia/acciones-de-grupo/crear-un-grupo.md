# Crear un grupo — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/acciones-de-grupo/crear-un-grupo/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Crear un grupo

`POST /api/v1/groups` · permiso **Grupos y campañas → Administrar grupos** · área communities · `operationId` `apiGroupAction.create`

**Para qué sirve:** Sirve para crear un grupo de WhatsApp desde uno de tus números, con su nombre, su descripción y hasta 20 participantes. Se hace después, al ritmo del número: con el `action_id` ves cómo salió y su link de invitación.

**Nota:** Asíncrona: responde 202 con `action_id`; consulta el resultado en `GET /groups/actions/{action}`. Hasta 20 participantes iniciales, sin contar al propio número. Con un número QR la descripción se pone justo después de crear el grupo, y las creaciones respetan la espera entre creaciones del número. El resultado trae el grupo y su link de invitación. Con un número oficial, `join_approval_required: true` crea el grupo pidiendo aprobación para entrar (no se puede cambiar después); con un número QR responde `422 provider_unsupported`.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `name` | string | sí |  |
| `description` | string \| null | no |  |
| `join_approval_required` | boolean | no |  |
| `participants` | array<string> | sí |  |

**Respuestas**

- `202` — `ApiGroupActionAcceptedResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `action_id` | string |  |
  | `status` | "queued" |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `402` — Se alcanzó el tope de grupos oficiales del plan: el del workspace si tiene plan propio, o el de la cuenta si no. No se registra ninguna acción.
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
