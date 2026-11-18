# Ver los participantes de un grupo — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/grupos/ver-los-participantes-de-un-grupo/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver los participantes de un grupo

`GET /api/v1/groups/participants` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `group.participants`

**Para qué sirve:** Úsalo para listar los participantes de un grupo, filtrando por teléfono, si son administradores o si se los puede promover a administrador.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `perPage` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`). Orden: `orderBy` acepta `created_at`, `id`, `updated_at`; dirección `orderDirection`: `asc` o `desc`. Otro valor responde `422`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `groupUid` | query | string | sí |  |
| `phone` | query | string | no |  |
| `isAdmin` | query | string ∈ {"true", "false", "1", "0"} | no |  |
| `eligibleForAdmin` | query | string ∈ {"true", "false", "1", "0"} | no |  |
| `orderBy` | query | string | no |  |
| `orderDirection` | query | string ∈ {"asc", "desc"} | no |  |
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — Paginated set of `ParticipantResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<ParticipantResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `prt_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].phone` | string |  |
  | `data[].action` | string |  |
  | `data[].isAdmin` | string |  |
  | `data[].created_at` | string \| string ∈ {""} |  |
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
