# Crear un webhook — API de Funnelchat: contexto para tu IA

> Copiado de /docs/webhooks/crear-un-webhook/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Crear un webhook

`POST /api/v1/webhooks` · permiso **Avisos (webhooks) → Administrar** · área accounts · `operationId` `webhookSubscription.store`

**Para qué sirve:** Sirve para empezar a recibir eventos en tu sistema: eliges la URL y los eventos de cualquiera de las tres áreas, y guardas el secreto de firma, que se muestra solo esta vez.

Con una clave de API, cada tipo de `events` exige además el permiso
**Números de WhatsApp → Ver**, **Contactos y conversaciones → Ver** o
**Grupos y campañas → Ver**, según su área; si falta, 422.

Hay un tope de 50 suscripciones por workspace (por cuenta, si no usas workspaces), sea
cual sea su estado: con 50, crear otra responde `422` con `error`
`webhooks_limit_reached`.

No acepta `Idempotency-Key`: reintentar una creación que sí llegó crea otra suscripción,
con otro secreto.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `url` | string (uri) | sí |  |
| `description` | string \| null | no |  |
| `events` | array<string>: uno o más de los 55 eventos (la lista entera, con el permiso de cada uno: https://developers-portal.funnelchat.app/ia/lo-basico.md) | sí |  |
| `filters` | object | no |  |
| `filters.campaign_ids` | array<string> \| null | no |  |

**Respuestas**

- `201` — La suscripción creada, con su secreto de firma (`secret`). Es la única vez que aparece.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string |  |
  | `url` | string |  |
  | `description` | string \| null |  |
  | `events` | array<string> |  |
  | `filters` | object \| null | Siempre un objeto: `{}` si no hay filtro. |
  | `status` | string |  |
  | `disabled_reason` | string \| null |  |
  | `last_delivery_at` | string \| null |  |
  | `last_success_at` | string \| null |  |
  | `secret_rotated_at` | string \| null |  |
  | `created_at` | string \| null |  |
  | `updated_at` | string \| null |  |
  | `migration` | object \| null |  |
  | `migration.origin` | string |  |
  | `migration.status` | string |  |
  | `migration.activated_via` | string \| null |  |
  | `migration.activated_at` | string \| null |  |
  | `migration.last_result` | string \| null |  |
  | `secret` | string |  |
  | `secret_notice` | "Guarda este secreto ahora: es la única vez que se muestra. Con él validas la firma del header de cada entrega." |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_foreign_account`: solo la usa una clave de un workspace de la propia cuenta.
- `422` — Validation error (`AccountsValidationException`)
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
