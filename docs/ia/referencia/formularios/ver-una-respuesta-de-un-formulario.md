# Ver una respuesta de un formulario — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/formularios/ver-una-respuesta-de-un-formulario/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver una respuesta de un formulario

`GET /api/v1/forms/families/{familyId}/responses/{runId}` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `whatsappForm.response`

**Para qué sirve:** Úsalo para ver una respuesta completa de un formulario: lo que contestó el contacto y lo que se hizo con esas respuestas.

Devuelve una respuesta completa de un formulario de tu cuenta: las respuestas del contacto y lo que se hizo con ellas. `{familyId}` es el `family_id` del formulario y `{runId}` el `id` de la respuesta que viene en `GET /forms/families/{familyId}/responses`. Responde 404 si no existe o no es de tu cuenta.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `familyId` | path | string | sí |  |
| `runId` | path | string | sí |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | object |  |
  | `data.id` | string | Id opaco: un texto que empieza con `frs_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.flow_token` | string |  |
  | `data.contact` | object |  |
  | `data.status` | object |  |
  | `data.origin` | string |  |
  | `data.node_id` | string \| null |  |
  | `data.automation_run_id` | string \| null | Id opaco: un texto que empieza con `run_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.conversation_id` | integer \| null |  |
  | `data.version` | integer |  |
  | `data.version_id` | string | Id opaco: un texto que empieza con `frv_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.output_id` | string \| null |  |
  | `data.output_label` | string \| null |  |
  | `data.reason` | string \| null |  |
  | `data.reason_label` | string \| null |  |
  | `data.completed_after_expiry` | boolean |  |
  | `data.partial` | string |  |
  | `data.last_screen_id` | string \| null |  |
  | `data.sent_at` | string \| null |  |
  | `data.delivered_at` | string \| null |  |
  | `data.read_at` | string \| null |  |
  | `data.responded_at` | string \| null |  |
  | `data.expires_at` | string \| null |  |
  | `data.answers` | array<object> |  |
  | `data.effects` | array<array<any> \| object> |  |
  | `data.response_json` | array<any> \| null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
