# Ver un grupo — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/grupos/ver-un-grupo/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver un grupo

`GET /api/v1/groups/{group}` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `group.show`

**Para qué sirve:** Sirve para ver el detalle de un grupo: administradores, si el dueño está conectado, clics, link de invitación y de campaña, y si está lleno.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí | The group uid |

**Respuestas**

- `200` — `GroupResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string \| null | `orNull`: a resource of an unsaved group (an event, a test) has no id, and keeps its `null`. Id opaco: un texto que empieza con `grp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `admins_numbers` | string |  |
  | `admins` | array<any> |  |
  | `admins_count` | string |  |
  | `owner` | string |  |
  | `owner_display_phone` | string |  |
  | `owner_connected` | boolean |  |
  | `clicks` | string |  |
  | `communityUid` | string |  |
  | `newsletterUid` | string |  |
  | `description` | string \| string ∈ {""} |  |
  | `deviceId` | string \| null | Id del número del grupo, o `null` si no tiene o si el número no es del workspace de la clave. Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `image` | string |  |
  | `isFull` | string \| boolean |  |
  | `isApi` | boolean |  |
  | `link` | string \| string ∈ {""} |  |
  | `campaign_link` | string \| string ∈ {""} |  |
  | `campaign_custom_domain` | string \| null | Dominio propio de la campaña del grupo para su link público, o `null` si no tiene. |
  | `name` | string |  |
  | `order` | string |  |
  | `participants_numbers` | string |  |
  | `participants_count` | string |  |
  | `status` | string |  |
  | `uid` | string |  |
  | `updatedAt` | string |  |
  | `createdAt` | string |  |
  | `scheduled_message_count` | string \| integer ∈ {0} |  |
  | `type` | string |  |
  | `manual_import` | boolean |  |
  | `participantMode` | boolean | Participant mode (additive): true iff the group is marked. False when the column is absent from the row (e.g. an explicit `select`). |
  | `ownNumbers` | string \| null | The user's own connected numbers in the group (additive). `null` means "not computed on this path / not applicable" (show, broadcast events, channels, groups without a resolved connection). |
  | `adminOnlyMessage` | boolean \| null | Stored write permission (additive): true = only admins can send, false = anyone can, null = never observed (or the column is absent from the row). Informational: sending decisions also need the cached confirmation. |
  | `origin` | integer ∈ {1, 0} |  |
  | `lastSyncAt` | string \| null |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404` — Not found (`CommunitiesModelNotFoundException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
