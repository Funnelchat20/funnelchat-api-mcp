# Ver tus envíos programados — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/envios-programados/ver-tus-envios-programados/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver tus envíos programados

`GET /api/v1/scheduled-messages` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `scheduledMessage.index`

**Para qué sirve:** Úsalo para listar tus envíos programados a grupos con su estado, fecha, recurrencia y campañas, filtrando por carpeta o por los que necesitan reconectar un número.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `perPage` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`). Orden: `orderBy` acepta `created_at`, `id`, `name`, `updated_at`; dirección `orderByMethod`: `asc` o `desc`. Otro valor responde `422`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `name` | query | string | no |  |
| `orderBy` | query | string | no |  |
| `orderByMethod` | query | string | no |  |
| `perPage` | query | integer | no |  |
| `status` | query | string ∈ {"0", "1", "2", "3", "4", "5", "6", "7", "8"} | no |  |
| `only_needs_connection` | query | string ∈ {"true", "false", "1", "0"} | no | Con `true`, solo los envíos pendientes o en curso que tienen grupos sin un número conectado que pueda enviar. Acepta `true`, `false`, `1` o `0`. |
| `folder_id` | query | string \| null | no |  |
| `unclassified` | query | string ∈ {"true", "false", "1", "0"} | no |  |

**Respuestas**

- `200` — Paginated set of `ScheduledMessageIndexResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<ScheduledMessageIndexResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `smg_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].uuid` | string | Identificador estable del envío: es el `scheduled_message.uuid` de los eventos `scheduled_message.*`. `null` solo en un envío creado antes del 30-09-2026 que todavía no generó ningún evento: se completa con el primero. |
  | `data[].name` | string \| string ∈ {""} |  |
  | `data[].send_at` | string \| null |  |
  | `data[].status` | string |  |
  | `data[].is_draft` | string \| boolean |  |
  | `data[].blocked_by_plan_limit` | boolean | `true` si la última ocurrencia del envío no salió porque se alcanzó el límite de envíos del plan. |
  | `data[].type` | string |  |
  | `data[].folder_id` | string \| null | Id opaco: un texto que empieza con `fdr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].campaign_ids` | array<string \| null> \| null |  |
  | `data[].excluded_group_ids` | array<string \| null> \| null |  |
  | `data[].can_be_edited` | string |  |
  | `data[].recurrence` | object |  |
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
- `422` — Validation error (`CommunitiesValidationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
