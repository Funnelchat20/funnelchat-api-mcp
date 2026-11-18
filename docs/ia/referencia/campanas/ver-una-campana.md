# Ver una campaña — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/campanas/ver-una-campana/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver una campaña

`GET /api/v1/campaigns/{campaign}` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `campaign.show`

**Para qué sirve:** Sirve para ver la configuración completa de una campaña: sus grupos, administradores, link de redirección, distribución del tráfico, píxel y grupos desconectados o con error.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `campaign` | path | string | sí | The campaign ID |

**Respuestas**

- `200` — `CampaignResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string | Id opaco: un texto que empieza con `cmp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `uuid` | string |  |
  | `name` | string |  |
  | `slug` | string |  |
  | `photo` | string \| string ∈ {""} |  |
  | `description` | string \| string ∈ {""} |  |
  | `pixel` | string |  |
  | `admins` | string |  |
  | `group_admins` | string |  |
  | `disconnected_groups` | string |  |
  | `connection_error_groups` | string |  |
  | `deviceId` | string \| null | Id del número de la campaña, o `null` si no tiene o si el número no es del workspace de la clave. Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `userId` | string \| null | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `type` | string |  |
  | `groups` | string |  |
  | `is_active` | string |  |
  | `redirect_url` | string |  |
  | `traffic_distribution_type` | string \| null |  |
  | `fill_groups_enabled` | string |  |
  | `group_numbering_position` | string \| null |  |
  | `anti_bot_verification_enabled` | string |  |
  | `custom_domain` | string |  |
  | `captcha_enabled` | string |  |
  | `virtual_queue_enabled` | boolean |  |
  | `virtual_queue_rate_per_minute` | integer |  |
  | `group_name_variations` | string |  |
  | `moderation` | object |  |
  | `moderation.type` | string |  |
  | `moderation.insults_and_profanity` | string |  |
  | `moderation.negative_comments` | string |  |
  | `moderation.repetitive_spam` | string |  |
  | `moderation.external_links` | string |  |
  | `moderation.promotions_and_sales` | string |  |
  | `moderation.off_topic` | string |  |
  | `members_can_send_messages` | string |  |
  | `clicks_limit` | string |  |
  | `participants_limit` | string |  |
  | `backup_groups_count` | string \| integer ∈ {0} |  |
  | `admins_per_group` | string |  |
  | `input_tag` | string |  |
  | `output_tag` | string |  |
  | `send_always_same_group` | string |  |
  | `total_participants` | string | Participantes de los grupos de la campaña. Con una clave, solo los de los grupos del workspace de la clave. |
  | `total_clicks` | string |  |
  | `total_in` | string |  |
  | `total_out` | string |  |
  | `total_in_counter` | integer | Entradas a los grupos de la campaña, según el contador de entradas de cada grupo. |
  | `total_out_counter` | integer | Salidas de los grupos de la campaña, según el contador de salidas de cada grupo. |
  | `auto_create_groups` | boolean |  |
  | `group_creation_suspended` | string \| boolean |  |
  | `suspended_creator_phones` | string \| array<string> |  |
  | `group_creation_has_available_creator` | string \| boolean |  |
  | `api_policy` | object | Qué es la campaña de grupos API: quién crea los grupos, quiénes se suman y con qué plantilla de invitación. Solo viene en las campañas de tipo Grupo API; en los demás tipos la clave no aparece. |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404` — Not found (`CommunitiesModelNotFoundException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
