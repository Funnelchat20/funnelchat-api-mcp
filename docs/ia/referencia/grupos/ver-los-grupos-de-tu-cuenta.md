# Ver los grupos de tu cuenta — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/grupos/ver-los-grupos-de-tu-cuenta/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver los grupos de tu cuenta

`GET /api/v1/groups` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `group.index`

**Para qué sirve:** Úsalo para listar los grupos de tu cuenta con filtros por tipo, estado, número o sin campaña asignada, por ejemplo para sincronizarlos con tu sistema.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `perPage` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`). Orden: `orderBy` acepta `created_at`, `id`, `name`, `updated_at`; dirección `orderByMethod`: `asc` o `desc`. Otro valor responde `422`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `name` | query | string | no |  |
| `orderBy` | query | string | no |  |
| `orderByMethod` | query | string | no |  |
| `type` | query | string ∈ {"1", "2", "3", "4"} | no |  |
| `perPage` | query | integer | no |  |
| `status` | query | string ∈ {"0", "1", "2", "3", "4", "5", "6", "7", "8"} | no |  |
| `deviceId` | query | string | no |  |
| `noCampaign` | query | boolean | no |  |

**Respuestas**

- `200` — Paginated set of `GroupResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<GroupResource> |  |
  | `data[].id` | string \| null | `orNull`: a resource of an unsaved group (an event, a test) has no id, and keeps its `null`. Id opaco: un texto que empieza con `grp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].admins_numbers` | string |  |
  | `data[].admins` | array<any> |  |
  | `data[].admins_count` | string |  |
  | `data[].owner` | string |  |
  | `data[].owner_display_phone` | string |  |
  | `data[].owner_connected` | boolean |  |
  | `data[].clicks` | string |  |
  | `data[].communityUid` | string |  |
  | `data[].newsletterUid` | string |  |
  | `data[].description` | string \| string ∈ {""} |  |
  | `data[].deviceId` | string \| null | Id del número del grupo, o `null` si no tiene o si el número no es del workspace de la clave. Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].image` | string |  |
  | `data[].isFull` | string \| boolean |  |
  | `data[].isApi` | boolean |  |
  | `data[].link` | string \| string ∈ {""} |  |
  | `data[].campaign_link` | string \| string ∈ {""} |  |
  | `data[].campaign_custom_domain` | string \| null | Dominio propio de la campaña del grupo para su link público, o `null` si no tiene. |
  | `data[].name` | string |  |
  | `data[].order` | string |  |
  | `data[].participants_numbers` | string |  |
  | `data[].participants_count` | string |  |
  | `data[].status` | string |  |
  | `data[].uid` | string |  |
  | `data[].updatedAt` | string |  |
  | `data[].createdAt` | string |  |
  | `data[].scheduled_message_count` | string \| integer ∈ {0} |  |
  | `data[].type` | string |  |
  | `data[].manual_import` | boolean |  |
  | `data[].participantMode` | boolean | Participant mode (additive): true iff the group is marked. False when the column is absent from the row (e.g. an explicit `select`). |
  | `data[].ownNumbers` | string \| null | The user's own connected numbers in the group (additive). `null` means "not computed on this path / not applicable" (show, broadcast events, channels, groups without a resolved connection). |
  | `data[].adminOnlyMessage` | boolean \| null | Stored write permission (additive): true = only admins can send, false = anyone can, null = never observed (or the column is absent from the row). Informational: sending decisions also need the cached confirmation. |
  | `data[].origin` | integer ∈ {1, 0} |  |
  | `data[].lastSyncAt` | string \| null |  |
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
  | `meta.cloud_api_groups_enabled` | string \| boolean |  |
  | `meta.device_groups_sync_enabled` | boolean |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
