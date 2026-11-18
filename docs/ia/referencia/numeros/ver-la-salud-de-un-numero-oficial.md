# Ver la salud de un número oficial — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/numeros/ver-la-salud-de-un-numero-oficial/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver la salud de un número oficial

`GET /api/v1/devices/{device}/health` · permiso **Números de WhatsApp → Ver** · área accounts · `operationId` `deviceHealth.show`

**Para qué sirve:** Úsalo para ver la salud de un número de WhatsApp Cloud (estado, identidad, nivel de throughput e historial de cambios) a partir del último dato guardado, sin consultar a Meta.

El último estado guardado que informó Meta: si el número puede enviar (`health`), su
identidad, el nivel de rendimiento y el historial. No consulta a Meta en el momento: para
eso, `POST devices/{device}/health/refresh`. Solo para números oficiales.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí | The device ID |

**Respuestas**

- `200` — El estado de salud del número.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `health` | string |  |
  | `identity` | string |  |
  | `meta_status` | string \| null | El estado del número en Meta en minúsculas (`connected`, `flagged`, `restricted`, `banned`, ...), igual que `health.meta_status`; `null` si todavía no se sabe. |
  | `entities` | string |  |
  | `throughput_level` | string | El nivel de rendimiento de envío que Meta le asigna al número: `standard`, `high` o `unknown`; `null` si todavía no hay datos. |
  | `history` | array<object> |  |
  | `history[].field` | string |  |
  | `history[].previous_value` | string |  |
  | `history[].new_value` | string |  |
  | `history[].detail` | string \| null |  |
  | `history[].source` | string |  |
  | `history[].occurred_at` | string |  |
  | `meta_billing` | object \| null |  |
  | `meta_billing.waba_id` | string \| null |  |
  | `meta_billing.business_id` | string \| null |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `404` — Not found (`AccountsModelNotFoundException`)
- `422` — El número no es oficial (`device_not_meta`).
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
