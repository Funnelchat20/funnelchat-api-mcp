# Ver las métricas de un formulario — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/formularios/ver-las-metricas-de-un-formulario/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver las métricas de un formulario

`GET /api/v1/forms/families/{familyId}/metrics` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `whatsappForm.metrics`

**Para qué sirve:** Sirve para medir un formulario: cuántos se enviaron, cuántos se abrieron y cuántos se completaron, con sus porcentajes.

Devuelve los números de un formulario de tu cuenta: cuántos se enviaron, cuántos se abrieron y cuántos se completaron, y sus porcentajes. `{familyId}` es el `family_id` del formulario. Acepta los mismos filtros de fecha, versión y origen que la lista de respuestas; un filtro inválido responde 422. Responde 404 si el formulario no existe o no es de tu cuenta.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `familyId` | path | string | sí |  |
| `from` | query | string (date-time) \| null | no |  |
| `to` | query | string (date-time) \| null | no |  |
| `version_id` | query | string \| null | no |  |
| `origin` | query | string \| null | no |  |
| `status` | query | string \| null | no |  |
| `kind` | query | string \| null | no |  |
| `effect_status` | query | string \| null | no |  |
| `search` | query | string \| null | no |  |
| `per_page` | query | integer \| null | no |  |
| `page` | query | integer \| null | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | object |  |
  | `data.not_sent` | integer |  |
  | `data.not_sent_reasons` | array<object> |  |
  | `data.sent` | integer |  |
  | `data.delivered` | integer |  |
  | `data.read` | integer |  |
  | `data.completed` | integer |  |
  | `data.pending` | integer |  |
  | `data.unfinished` | integer |  |
  | `data.partial` | integer |  |
  | `data.completion_rate` | number \| null |  |
  | `data.delivery_rate` | number \| null |  |
  | `data.read_rate` | number \| null |  |
  | `data.median_seconds_to_complete` | integer \| null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
