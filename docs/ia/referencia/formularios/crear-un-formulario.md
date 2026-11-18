# Crear un formulario — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/formularios/crear-un-formulario/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Crear un formulario

`POST /api/v1/forms` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `whatsappForm.store`

**Para qué sirve:** Úsalo para empezar un formulario de WhatsApp en uno de tus números oficiales, a partir de un modelo: queda como borrador y después le guardas su contenido.

Crea un formulario nuevo como borrador de tu cuenta. Envía `template_key` (una de las `key` de `GET /forms/templates`; `blank` empieza vacío), `device_id` (un número de WhatsApp Cloud de tu cuenta) y, si quieres, `device_ids` con otros números donde también vivirá. Responde 201 con la versión (`id`), su `family_id`, `lint` y `numbers`. Si un número no es de tu cuenta o no es WhatsApp Cloud responde 422 `NUMBER_NOT_ELIGIBLE`.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `device_ids` | array<string> | no |  |
| `template_key` | string | sí |  |

**Respuestas**

- `201` — Created

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | WhatsappFormResource |  |
  | `data.id` | string | Id opaco: un texto que empieza con `frv_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.family_id` | string | Id opaco: un texto que empieza con `frm_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.name` | string |  |
  | `data.label` | string |  |
  | `data.category` | string |  |
  | `data.status` | string |  |
  | `data.version` | integer |  |
  | `data.definition` | array<any> |  |
  | `data.fields` | array<any> \| null |  |
  | `data.mapping` | array<any> \| null |  |
  | `data.tag_rules` | array<any> \| null |  |
  | `data.has_endpoint` | boolean |  |
  | `data.first_screen` | string \| null |  |
  | `data.first_screen_dynamic` | boolean |  |
  | `data.lint_errors_count` | integer |  |
  | `data.draft_id` | string | Id opaco: un texto que empieza con `frv_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.draft_version` | integer |  |
  | `data.sends` | integer |  |
  | `data.responses` | integer |  |
  | `data.meta_flow_id` | string \| null |  |
  | `data.flow_json` | array<any> \| null |  |
  | `data.validation_errors` | array<any> \| null |  |
  | `data.published_at` | string \| null |  |
  | `data.updated_at` | string \| null |  |
  | `lint` | array<any> |  |
  | `numbers` | array<any> |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
