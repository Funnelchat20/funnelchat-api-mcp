# Ver tus campañas — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/campanas/ver-tus-campanas/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver tus campañas

`GET /api/v1/campaigns` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `campaign.index`

**Para qué sirve:** Úsalo para listar las campañas de grupos de WhatsApp de tu cuenta, con búsqueda por nombre, y obtener sus IDs para consultar grupos, participantes o estadísticas.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `perPage` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`). Orden: `orderBy` acepta `created_at`, `id`, `name`, `updated_at`; dirección `orderByMethod`: `asc` o `desc`. Otro valor responde `422`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `name` | query | string | no |  |
| `orderBy` | query | string ∈ {"created_at", "id", "name", "type", "updated_at"} | no |  |
| `orderByMethod` | query | string | no |  |
| `perPage` | query | integer | no |  |
| `sortBy` | query | string | no |  |

**Respuestas**

- `200` — Paginated set of `CampaignsResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<CampaignsResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `cmp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].uuid` | string |  |
  | `data[].name` | string |  |
  | `data[].custom_domain` | string | Dominio propio de la campaña para su link público, o `null` si usa el dominio por defecto. |
  | `data[].photo` | string \| string ∈ {""} |  |
  | `data[].deviceId` | string \| null | Id del número de la campaña, o `null` si no tiene o si el número no es del workspace de la clave. Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].userId` | string \| null | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].type` | string |  |
  | `data[].is_active` | string | Si la campaña está activa. |
  | `data[].groups` | string | Cantidad de grupos de la campaña. Con una clave, solo los del workspace de la clave. |
  | `data[].total_clicks` | string |  |
  | `data[].total_in` | string |  |
  | `data[].total_in_counter` | integer | Entradas a los grupos de la campaña, según el contador de entradas de cada grupo. |
  | `data[].admins` | string |  |
  | `data[].group_admins` | string |  |
  | `data[].disconnected_groups` | string |  |
  | `data[].connection_error_groups` | string |  |
  | `data[].running_actions_count` | string |  |
  | `data[].pending_actions_count` | string |  |
  | `data[].pending_sync_groups` | string |  |
  | `data[].group_creation_suspended` | boolean | En el listado es siempre `false`: el estado de la creación de grupos viene en el detalle de la campaña. |
  | `data[].suspended_creator_phones` | array<string> |  |
  | `data[].group_creation_has_available_creator` | boolean |  |
  | `data[].api_open_groups` | integer | Cantidad de grupos de la campaña. Solo viene en las campañas de tipo Grupo API, igual que `api_policy`; en los demás tipos las dos claves no aparecen. |
  | `data[].api_policy` | object |  |
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

- `400` — `sortBy` o `sortDir` traen un valor que no se acepta.
- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
