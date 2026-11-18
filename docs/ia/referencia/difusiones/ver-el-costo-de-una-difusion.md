# Ver el costo de una difusión — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/difusiones/ver-el-costo-de-una-difusion/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver el costo de una difusión

`GET /api/v1/broadcasts/{broadcast}/cost` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `broadcast.cost`

**Para qué sirve:** Sirve para saber cuánto cuesta una difusión: la estimación previa y el costo calculado de lo enviado, desglosado por mercado, y te dice si el dato todavía es parcial.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `broadcast` | path | string | sí |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `broadcast_id` | string | Id opaco: un texto que empieza con `bcs_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `currency` | "USD" |  |
  | `is_partial` | boolean |  |
  | `estimate` | object \| null |  |
  | `estimate.category` | string \| null |  |
  | `estimate.currency` | string |  |
  | `estimate.contacts` | integer |  |
  | `estimate.unpriced_contacts` | integer |  |
  | `estimate.total` | number |  |
  | `estimate.per_market` | array<object> |  |
  | `estimate.rates_updated_at` | string \| null |  |
  | `estimate.computed_at` | string \| null |  |
  | `computed` | object |  |
  | `computed.total` | number |  |
  | `computed.sent` | 0 |  |
  | `computed.billed` | 0 |  |
  | `computed.free` | 0 |  |
  | `computed.pending_price` | 0 |  |
  | `computed.no_data` | 0 |  |
  | `computed.category` | null \| string \| integer \| object |  |
  | `computed.per_market` | array<object> |  |
  | `rates_updated_at` | string \| null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
