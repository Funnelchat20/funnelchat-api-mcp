# Ver tus webhooks — API de Funnelchat: contexto para tu IA

> Copiado de /docs/webhooks/ver-tus-webhooks/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver tus webhooks

`GET /api/v1/webhooks` · permiso **Avisos (webhooks) → Ver** · área accounts · `operationId` `webhookSubscription.index`

**Para qué sirve:** Úsalo para revisar a qué URLs le está mandando eventos tu cuenta y en qué estado está cada suscripción.

**Listado** · `perPage` de 1 a 100 (por defecto 25) · orden fijo: id ascendente · no acepta parámetros de orden.

Con una clave de API, solo las que la clave puede leer: se omiten las que
tienen eventos de un área cuyo permiso le falta: **Números de WhatsApp → Ver**,
**Contactos y conversaciones → Ver** o **Grupos y campañas → Ver**.

**Respuestas**

- `200` — Las suscripciones del workspace.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `[].id` | string |  |
  | `[].url` | string |  |
  | `[].description` | string \| null |  |
  | `[].events` | array<string> |  |
  | `[].filters` | object \| null | Siempre un objeto: `{}` si no hay filtro. |
  | `[].status` | string |  |
  | `[].disabled_reason` | string \| null |  |
  | `[].last_delivery_at` | string \| null |  |
  | `[].last_success_at` | string \| null |  |
  | `[].secret_rotated_at` | string \| null |  |
  | `[].created_at` | string \| null |  |
  | `[].updated_at` | string \| null |  |
  | `[].migration` | object \| null |  |
  | `[].migration.origin` | string |  |
  | `[].migration.status` | string |  |
  | `[].migration.activated_via` | string \| null |  |
  | `[].migration.activated_at` | string \| null |  |
  | `[].migration.last_result` | string \| null |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_foreign_account`: solo la usa una clave de un workspace de la propia cuenta.
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
