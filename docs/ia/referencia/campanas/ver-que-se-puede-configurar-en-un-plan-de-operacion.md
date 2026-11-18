# Ver qué se puede configurar en un plan de operación — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/campanas/ver-que-se-puede-configurar-en-un-plan-de-operacion/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver qué se puede configurar en un plan de operación

`GET /api/v1/campaigns/{campaign}/operation-plans/config` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `operationPlan.config`

**Para qué sirve:** Sirve para conocer los límites con los que se programan los planes de operación de una campaña: tope diario, espaciado mínimo, franja horaria y si se permiten fines de semana.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `campaign` | path | string | sí | The campaign ID |

**Respuestas**

- `200` — Valores por defecto y límites para armar un plan de operación en la campaña.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `nudge_group_threshold` | integer |  |
  | `default_daily_cap` | integer |  |
  | `min_spacing_minutes` | integer |  |
  | `confirmation_spacing_minutes` | integer |  |
  | `default_window_start` | string |  |
  | `default_window_end` | string |  |
  | `daily_cap_max` | integer |  |
  | `weekends_enabled` | boolean | Si un plan puede incluir sábados y domingos. |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404` — Not found (`CommunitiesModelNotFoundException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
