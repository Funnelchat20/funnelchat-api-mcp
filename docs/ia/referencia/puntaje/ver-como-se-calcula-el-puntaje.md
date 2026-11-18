# Ver cómo se calcula el puntaje — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/puntaje/ver-como-se-calcula-el-puntaje/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver cómo se calcula el puntaje

`GET /api/v1/lead-score/settings` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `leadScoreSettings.show`

**Para qué sirve:** Sirve para leer cómo se calcula el lead score de tu cuenta: umbrales de caliente y tibio, señales mínimas, histéresis, decaimiento y reglas.

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `hot_threshold` | integer |  |
  | `warm_threshold` | integer |  |
  | `min_signals` | integer |  |
  | `hysteresis` | integer |  |
  | `decay_steps` | array<object> |  |
  | `decay_steps[].days` | integer |  |
  | `decay_steps[].points` | integer |  |
  | `decay_enabled` | boolean |  |
  | `rules` | array<any> |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
