# Ver un envío programado — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/envios-programados/ver-un-envio-programado/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver un envío programado

`GET /api/v1/scheduled-messages/{scheduledMessage}` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `scheduledMessage.show`

**Para qué sirve:** Sirve para ver un envío programado completo: fecha, estado, audiencia, lecturas, reproducciones, clics en links y velocidad de envío.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `scheduledMessage` | path | string (uuid) | sí | The scheduled message ID |

**Respuestas**

- `200` — `App.Modules.ScheduledMessages.Resources.ScheduledMessageResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string | Id opaco: un texto que empieza con `smg_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `uuid` | string | Identificador estable del envío: es el `scheduled_message.uuid` de los eventos `scheduled_message.*`. `null` solo en un envío creado antes del 30-09-2026 que todavía no generó ningún evento: se completa con el primero. |
  | `name` | string \| string ∈ {""} |  |
  | `send_at` | string \| null |  |
  | `status` | string |  |
  | `is_draft` | string \| boolean |  |
  | `blocked_by_plan_limit` | boolean | `true` si la última ocurrencia del envío no salió porque se alcanzó el límite de envíos del plan. Solo se calcula en el detalle del envío; en las demás respuestas es siempre `false`. |
  | `type` | string |  |
  | `folder` | object \| null |  |
  | `folder.id` | string | Id opaco: un texto que empieza con `fdr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `folder.name` | string |  |
  | `audience` | string |  |
  | `total_readed` |  |  |
  | `total_played` |  |  |
  | `link_clicks` | integer |  |
  | `whalink_custom_domain` | string | Dominio propio con el que se acortan los links del mensaje para contar sus clics, o `null` si no tiene. |
  | `shipping_speed` | string |  |
  | `campaign_ids` | array<string \| null> \| null |  |
  | `group_ids` | array<string \| null> \| null |  |
  | `excluded_group_ids` | array<string \| null> \| null |  |
  | `static_audience` | string |  |
  | `campaigns` | array<object> |  |
  | `groups` | array<object> |  |
  | `total_groups` | string |  |
  | `messages` | array<App.Modules.ScheduledMessages.Resources.MessageTemplateResource> |  |
  | `messages[].id` | string | Id opaco: un texto que empieza con `mtp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `messages[].type` | string |  |
  | `messages[].value` | string |  |
  | `messages[].mentioned` | boolean |  |
  | `messages[].metrics` | string |  |
  | `messages[].reactions` | string |  |
  | `messages[].votes` | string |  |
  | `messages[].event_responses` | string | Respuestas a la invitación de un evento, por respuesta, contando una sola vez a cada persona. Las respuestas que nadie eligió no aparecen. |
  | `messages[].shipping_order` | string |  |
  | `messages[].variations` | array<MessageTemplateVariationResource> |  |
  | `total_left_after_send` | string |  |
  | `can_be_edited` | string |  |
  | `recurrence` | object |  |
  | `recurrence.enabled` | boolean |  |
  | `recurrence.frequency` | string |  |
  | `recurrence.interval` | string |  |
  | `recurrence.week_days` | string |  |
  | `recurrence.end_type` | string |  |
  | `recurrence.end_date` | string |  |
  | `recurrence.occurrences` | string |  |
  | `recurrence.current_occurrence` | string |  |
  | `recurrence.only_new_groups` | string |  |
  | `recurrence.only_full_groups` | string |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404` — Not found (`CommunitiesModelNotFoundException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
