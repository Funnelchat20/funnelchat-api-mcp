# Ver las acciones de una campaña — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/campanas/ver-las-acciones-de-una-campana/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver las acciones de una campaña

`GET /api/v1/campaigns/{campaign}/actions` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `campaign.actions`

**Para qué sirve:** Úsalo para auditar las acciones ejecutadas sobre los grupos de una campaña a través de la sesión de WhatsApp: qué cambió (valor anterior y nuevo), estado, intentos y fechas.

**Con API key:** página fija de 15 elementos; se recorre con `page`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `campaign` | path | string | sí | The campaign ID |

**Respuestas**

- `200` — Paginated set of `ActionResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<ActionResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `act_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].action` | string |  |
  | `data[].old_value` | string |  |
  | `data[].new_value` | string |  |
  | `data[].field` | string |  |
  | `data[].status` | integer ∈ {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12} | \| \| \|---\| \| `0` <br/> \| \| `1` <br/> \| \| `2` <br/> \| \| `3` <br/> \| \| `4` <br/> \| \| `5` <br/> \| \| `6` <br/> \| \| `7` <br/> \| \| `8` <br/> \| \| `9` <br/> \| \| `10` <br/> \| \| `11` <br/> El pedido de hacer administrador a la persona se aceptó, pero todavía no llegó la confirmación de WhatsApp. \| \| `12` <br/> Una acción de un plan de operación que no se ejecutó a propósito: para proteger al creador del grupo, para no dejarlo sin administrador, porque venció la espera de confirmación o porque un paso anterior del mismo grupo no se completó. Es definitivo: reintentar no la vuelve a ejecutar. \| |
  | `data[].tries` | string |  |
  | `data[].process_at` | string \| string ∈ {""} |  |
  | `data[].created_at` | string \| string ∈ {""} |  |
  | `data[].completed_at` | string \| null |  |
  | `data[].stats` | object |  |
  | `data[].groups` | string |  |
  | `data[].subActions` | array<ActionResource> |  |
  | `links` | object |  |
  | `links.first` | string \| null |  |
  | `links.last` | string \| null |  |
  | `links.prev` | string \| null |  |
  | `links.next` | string \| null |  |
  | `meta` | object |  |
  | `meta.current_page` | integer |  |
  | `meta.from` | integer \| null |  |
  | `meta.last_page` | integer |  |
  | `meta.links` | array<object> | Generated paginator links. |
  | `meta.path` | string \| null | Base path for paginator generated URLs. |
  | `meta.per_page` | integer | Number of items shown per page. |
  | `meta.to` | integer \| null | Number of the last item in the slice. |
  | `meta.total` | integer | Total number of items being paginated. |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404` — Not found (`CommunitiesModelNotFoundException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
