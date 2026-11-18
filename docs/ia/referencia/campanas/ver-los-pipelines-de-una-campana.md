# Ver los pipelines de una campaña — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/campanas/ver-los-pipelines-de-una-campana/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver los pipelines de una campaña

`GET /api/v1/campaigns/{campaign}/pipelines` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `campaign.indexPipelines`

**Para qué sirve:** Sirve para seguir los pipelines de operaciones sobre los grupos de una campaña, con cuántas acciones hay en cada estado y su avance, filtrando por estado o tipo de acción.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `per_page` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`). Orden: `orderBy` acepta `id`, `name`, `group_index`, `created_at`, `updated_at`; dirección `orderByMethod`: `asc` o `desc`. Otro valor responde `422`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `campaign` | path | string | sí | The campaign ID |
| `page` | query | integer | no |  |
| `per_page` | query | integer | no |  |
| `status` | query | string ∈ {"scheduled", "running", "completed", "failed", "cancelled"} | no |  |
| `action_type` | query | string ∈ {"add", "new", "name", "description", "photo", "participants", "remove-participants", "administrators", "remove-administrators", "join_group", "members_can_send_messages", "remove_group"} | no |  |
| `orderBy` | query | string ∈ {"id", "name", "group_index", "created_at", "updated_at"} | no |  |
| `orderByMethod` | query | string ∈ {"asc", "desc"} | no |  |

**Respuestas**

- `200`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `campaign` | object |  |
  | `campaign.id` | string | Id opaco: un texto que empieza con `cmp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `campaign.name` | string |  |
  | `data` | array<object> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `pip_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].pipeline_id` | string |  |
  | `data[].name` | string \| null |  |
  | `data[].group_index` | integer \| null |  |
  | `data[].created_at` | string \| null |  |
  | `data[].summary` | object |  |
  | `meta` | object |  |
  | `meta.current_page` | integer |  |
  | `meta.last_page` | integer |  |
  | `meta.per_page` | integer |  |
  | `meta.total` | integer |  |
  | `meta.from` | integer \| null |  |
  | `meta.to` | integer \| null |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404` — Not found (`CommunitiesModelNotFoundException`)
- `422` — Validation error (`CommunitiesValidationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
