# Configurar el horario de silencio — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/alertas/configurar-el-horario-de-silencio/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Configurar el horario de silencio

`PUT /api/v1/alerts/quiet-hours` · permiso **Números de WhatsApp → Editar** · área accounts · `operationId` `alertQuietHour.update`

**Para qué sirve:** Úsalo para definir una franja horaria sin alertas, por ejemplo de noche, o para desactivarla.

Reemplaza el horario de la cuenta (hay uno solo). `start_time` y `end_time` van en
`HH:MM`; `end_time` puede ser anterior a `start_time` para un horario que cruza la
medianoche.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `enabled` | boolean | sí |  |
| `start_time` | string \| null | no |  |
| `end_time` | string \| null | no |  |

**Respuestas**

- `200` — El horario guardado.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `enabled` | boolean |  |
  | `start_time` | string \| null |  |
  | `end_time` | string \| null |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_account_level`: es de la cuenta entera y solo la usa una clave del workspace por defecto; `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `422` — Validation error (`AccountsValidationException`)
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
