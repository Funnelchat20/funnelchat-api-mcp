# Ver los destinos de tus alertas — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/alertas/ver-los-destinos-de-tus-alertas/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver los destinos de tus alertas

`GET /api/v1/alerts/destinations` · permiso **Números de WhatsApp → Ver** · área accounts · `operationId` `alertDestination.index`

**Para qué sirve:** Sirve para ver a dónde llegan las alertas del workspace de tu clave (teléfonos, de los que ves solo los últimos cuatro dígitos, o webhooks), si están verificados y qué alertas tiene activas cada uno.

**Listado** · `perPage` de 1 a 100 (por defecto 25) · orden fijo: id ascendente · no acepta parámetros de orden.

Los teléfonos y webhooks que reciben las alertas, los del workspace de la clave. El
teléfono sale tapado: solo se ven sus últimos cuatro dígitos (`****1234`).

**Respuestas**

- `200` — Los destinos del workspace.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `[].id` | string | Id opaco: un texto que empieza con `ald_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `[].type` | string |  |
  | `[].destination` | string |  |
  | `[].name` | string \| null |  |
  | `[].verified` | boolean |  |
  | `[].has_secret` | string |  |
  | `[].created_at` | string \| null |  |
  | `[].settings` | array<AlertSettingResource> |  |
  | `[].settings[].module` | string |  |
  | `[].settings[].action` | string |  |
  | `[].settings[].enabled` | boolean |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
