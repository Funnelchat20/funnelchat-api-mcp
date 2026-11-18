# Seguir un grupo — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/grupos/seguir-un-grupo/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Seguir un grupo

`POST /api/v1/groups/{group}/import` · permiso **Grupos y campañas → Administrar grupos** · área communities · `operationId` `v2.apiGroupImport`

**Para qué sirve:** Úsalo para seguir un grupo de tu número sin escribirle: lo importa a tu cuenta y desde entonces te enteras de quién entra y quién sale. Si ya estaba en tu cuenta, no lo importa de nuevo.

**Nota:** Importa al workspace de la API key un grupo del número indicado en `device_id`, igual que importarlo desde el panel: queda visible en el panel, se sincronizan sus participantes y desde entonces genera los eventos `group_participant.joined` y `group_participant.left`. Los datos del grupo y si el número es administrador se leen de WhatsApp en la misma llamada. Responde `201` si lo importó y `200` si ya estaba en el workspace, con `is_admin`. Solo números QR: con un número oficial responde `422 provider_unsupported`. Si el grupo no es del número responde `404 group_not_found`. Cada número importa hasta 5 grupos por minuto (`429 import_rate_limited`, con `retry_after` en segundos). Dos pedidos a la vez por el mismo grupo en el mismo workspace lo importan una sola vez. Si el grupo ya está en otro workspace de la cuenta: cuando cada workspace de la cuenta tiene sus propios grupos, se importa la copia de este workspace sin tocar la del otro; si no, el grupo es uno solo para toda la cuenta y responde `404 group_not_found`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí | Identificador del grupo en WhatsApp, como lo lista `GET /v1/devices/{device}/groups`. |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |

**Respuestas**

- `200` — El grupo ya estaba en el workspace: no se importó de nuevo.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | ApiGroupImportResource |  |
  | `data.uid` | string | Identificador del grupo en WhatsApp. |
  | `data.name` | string \| null | Nombre del grupo. |
  | `data.imported` | boolean | `true` si esta llamada lo importó; `false` si ya estaba en el workspace. |
  | `data.is_admin` | boolean | Si el número indicado es administrador del grupo, según WhatsApp. Sin serlo no puede enviarle mensajes ni hacer acciones de grupo. |

- `201` — El grupo se importó en esta llamada.

  La misma tabla que en «Seguir un grupo», más arriba en este texto.

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
