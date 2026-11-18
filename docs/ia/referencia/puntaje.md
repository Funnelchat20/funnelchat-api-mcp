# Puntaje — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/puntaje/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver cómo se calcula el puntaje

`GET /api/v1/lead-score/settings` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `leadScoreSettings.show`

**Para qué sirve:** Sirve para leer cómo se calcula el lead score de tu cuenta: umbrales de caliente y tibio, señales mínimas, histéresis, decaimiento y reglas.

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `hot_threshold` | integer |  |
  | `warm_threshold` | integer |  |
  | `min_signals` | integer |  |
  | `hysteresis` | integer |  |
  | `decay_steps` | array<object> |  |
  | `decay_steps[].days` | integer |  |
  | `decay_steps[].points` | integer |  |
  | `decay_enabled` | boolean |  |
  | `rules` | array<any> |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)

### Configurar el puntaje

`PUT /api/v1/lead-score/settings` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `leadScoreSettings.update`

**Para qué sirve:** Úsalo para ajustar el cálculo del lead score a tu negocio: umbrales de categoría, señales mínimas, histéresis, decaimiento con el paso de los días y reglas. Reemplaza toda la configuración de una vez: manda todos sus datos. Solo la clave del titular de la cuenta.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `hot_threshold` | integer | sí |  |
| `warm_threshold` | integer | sí |  |
| `min_signals` | integer | sí |  |
| `hysteresis` | integer | sí |  |
| `decay_enabled` | boolean | sí |  |
| `rules` | array<object> | sí |  |
| `rules[].id` | string | sí |  |
| `rules[].signal` | string ∈ {"tag_added", "tag_removed", "stage_advanced", "broadcast_reply", "message_reply", "intent_keyword", "group_join", "group_leave", "group_reaction", "group_poll_vote", "link_click", "automation_completed"} | sí |  |
| `rules[].mode` | string ∈ {"event", "state"} | sí |  |
| `rules[].points` | integer | sí |  |
| `rules[].daily_cap` | integer \| null | no |  |
| `rules[].unique_scope` | string ∈ {"none", "contact", "contact_scope"} | sí |  |
| `rules[].enabled` | boolean | sí |  |
| `rules[].disqualifies` | boolean | sí |  |
| `rules[].on_release` | string ∈ {"restore", "keep"} | sí |  |
| `rules[].config` | object | no |  |
| `rules[].config.keywords` | array<string> | no |  |
| `rules[].config.broadcast_ids` | array<string> \| null | no |  |
| `rules[].config.group_ids` | array<string> \| null | no |  |
| `rules[].config.flow_ids` | array<string> \| null | no |  |
| `rules[].config.whalink_ids` | array<string> \| null | no |  |
| `rules[].config.tag_ids` | array<string> \| null | no |  |
| `rules[].config.stage_ids` | array<string> \| null | no |  |
| `decay_steps` | array<object> | sí |  |
| `decay_steps[].days` | integer | sí |  |
| `decay_steps[].points` | integer | sí |  |

**Respuestas**

- `200` — OK

  La misma tabla que en «Ver cómo se calcula el puntaje», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver cómo se reparte el puntaje

`GET /api/v1/lead-score/distribution` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `leadScoreDistribution.show`

**Para qué sirve:** Sirve para ver cómo se reparte tu base entre leads calientes, tibios, fríos y sin datos suficientes, junto con los umbrales vigentes. Ideal para un tablero de calidad de leads.

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `total` | string |  |
  | `counts` | object |  |
  | `counts.hot` | string |  |
  | `counts.warm` | string |  |
  | `counts.cold` | string |  |
  | `counts.insufficient_data` | string |  |
  | `thresholds` | object |  |
  | `thresholds.hot_threshold` | string |  |
  | `thresholds.warm_threshold` | string |  |
  | `thresholds.min_signals` | string |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)

### Ver el puntaje de un contacto

`GET /api/v1/contacts/{contact}/lead-score` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `contactLeadScore.show`

**Para qué sirve:** Úsalo para saber qué tan caliente está un lead: puntaje, categoría, confianza, si está descalificado y el historial de señales que lo explican, paginado por cursor.

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `score` | string |  |
  | `signals_count` | string |  |
  | `category` | string |  |
  | `confidence` | string |  |
  | `disqualified` | string |  |
  | `disqualified_at` | string |  |
  | `disqualification_reasons` | string |  |
  | `updated_at` | string \| null |  |
  | `events` | array<LeadScoreEventResource> |  |
  | `events[].id` | string |  |
  | `events[].signal` | string |  |
  | `events[].source` | string |  |
  | `events[].raw_points` | string |  |
  | `events[].applied_points` | string |  |
  | `events[].cap_reason` | string \| null |  |
  | `events[].occurred_at` | string \| null |  |
  | `events[].actor_user_id` | string | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `events[].reason` | string |  |
  | `next_cursor` | string |  |
  | `has_more` | boolean |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ajustar el puntaje de un contacto

`POST /api/v1/contacts/{contact}/lead-score/adjustments` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `leadScoreSettings.adjust`

**Para qué sirve:** Sirve para sumar o restar puntos al lead score de un contacto a mano, con un motivo, por ejemplo cuando tu equipo comercial confirma interés por otro canal.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `contact` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `delta` | integer | sí |  |
| `reason` | string | sí |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `score` | integer |  |
  | `signals_count` | integer |  |
  | `category` | string |  |
  | `confidence` | string |  |
  | `disqualified` | boolean |  |
  | `disqualified_at` | string \| null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
