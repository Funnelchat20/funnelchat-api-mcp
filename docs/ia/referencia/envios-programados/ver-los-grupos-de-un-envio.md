# Ver los grupos de un envío — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/envios-programados/ver-los-grupos-de-un-envio/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver los grupos de un envío

`GET /api/v1/scheduled-messages/{scheduledMessage}/groups` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `scheduledMessage.groups`

**Para qué sirve:** Úsalo para saber a qué grupos va dirigido un envío programado, filtrando por nombre o estado.

**Con API key:** página fija de 3 elementos; se recorre con `page`. Orden: `orderBy` acepta `created_at`, `id`, `name`; dirección `orderByMethod`: `asc` o `desc`. Otro valor responde `422`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `scheduledMessage` | path | string (uuid) | sí | The scheduled message ID |
| `name` | query | string | no |  |
| `orderBy` | query | string | no |  |
| `orderByMethod` | query | string | no |  |
| `perPage` | query | integer | no |  |
| `status` | query | integer | no |  |

**Respuestas**

- `200`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `current_page` | integer |  |
  | `data` | string |  |
  | `first_page_url` | string |  |
  | `from` | integer \| null |  |
  | `last_page` | integer |  |
  | `last_page_url` | string |  |
  | `links` | object |  |
  | `next_page_url` | string |  |
  | `path` | string \| null |  |
  | `per_page` | integer |  |
  | `prev_page_url` | string \| null |  |
  | `to` | integer \| null |  |
  | `total` | integer |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404` — Not found (`CommunitiesModelNotFoundException`)
- `422` — Validation error (`CommunitiesValidationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
