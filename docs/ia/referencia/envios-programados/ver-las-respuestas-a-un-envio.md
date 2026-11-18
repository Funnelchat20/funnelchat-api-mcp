# Ver las respuestas a un envío — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/envios-programados/ver-las-respuestas-a-un-envio/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver las respuestas a un envío

`GET /api/v1/scheduled-messages/{scheduledMessage}/responses` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `scheduledMessage.responses`

**Para qué sirve:** Sirve para recolectar las respuestas a encuestas o eventos de un envío: quién respondió, en qué grupo, qué eligió y cuándo.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `perPage` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`).

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `scheduledMessage` | path | string (uuid) | sí | The scheduled message ID |
| `page` | query | integer | no | Número de página, desde 1. |
| `perPage` | query | integer | no |  |
| `type` | query | string ∈ {"poll", "event"} | no |  |

**Respuestas**

- `200` — Array of `MessageResponseResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<MessageResponseResource> |  |
  | `data[].message_template_id` | string | Id opaco: un texto que empieza con `mtp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].block_type` | string |  |
  | `data[].group_name` | string |  |
  | `data[].responder_name` | string |  |
  | `data[].identity` | string |  |
  | `data[].identity_type` | string |  |
  | `data[].response` | string |  |
  | `data[].response_label` | string |  |
  | `data[].responded_at` | string \| null |  |
  | `meta` | object |  |
  | `meta.total` | string |  |
  | `meta.per_page` | integer |  |
  | `meta.current_page` | integer |  |
  | `meta.last_page` | integer |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404` — Not found (`CommunitiesModelNotFoundException`)
- `422` — Validation error (`CommunitiesValidationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
