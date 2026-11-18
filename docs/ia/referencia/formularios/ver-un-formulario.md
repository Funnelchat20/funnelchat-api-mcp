# Ver un formulario — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/formularios/ver-un-formulario/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver un formulario

`GET /api/v1/forms/{id}` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `whatsappForm.show`

**Para qué sirve:** Sirve para ver una versión de un formulario con su contenido, lo que falta corregir antes de publicarla, sus versiones y sus números.

Devuelve una versión de un formulario de tu cuenta con su definición y su detalle. `{id}` es el `id` de la versión (el de las filas de `GET /forms`), no el `family_id`. Trae además `lint` (lo que falta corregir antes de publicar), `versions` (las versiones del formulario) y `numbers` (los números donde vive). Responde 404 si la versión no existe o no es de tu cuenta.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |

**Respuestas**

- `200` — OK

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
  | `versions` | array<WhatsappForm> |  |
  | `versions[].id` | string | Id opaco: un texto que empieza con `frv_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `versions[].user_id` | string | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `versions[].workspace_id` | integer \| null |  |
  | `versions[].phone_number_id` | string |  |
  | `versions[].family_id` | string | Id opaco: un texto que empieza con `frm_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `versions[].name` | string |  |
  | `versions[].category` | string |  |
  | `versions[].status` | string |  |
  | `versions[].version` | integer |  |
  | `versions[].parent_flow_id` | string \| null | Id opaco: un texto que empieza con `frv_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `versions[].definition` | array<any> |  |
  | `versions[].flow_json` | array<any> \| null |  |
  | `versions[].flow_json_hash` | string \| null |  |
  | `versions[].fields` | array<any> \| null |  |
  | `versions[].mapping` | array<any> \| null |  |
  | `versions[].tag_rules` | array<any> \| null |  |
  | `versions[].has_endpoint` | boolean |  |
  | `versions[].first_screen` | string \| null |  |
  | `versions[].first_screen_dynamic` | boolean |  |
  | `versions[].meta_flow_id` | string \| null |  |
  | `versions[].validation_errors` | array<any> \| null |  |
  | `versions[].lint_errors_count` | integer |  |
  | `versions[].retained_reason` | string \| null |  |
  | `versions[].published_at` | string (date-time) \| null |  |
  | `versions[].deprecated_at` | string (date-time) \| null |  |
  | `versions[].created_at` | string (date-time) \| null |  |
  | `versions[].updated_at` | string (date-time) \| null |  |
  | `versions[].deleted_at` | string (date-time) \| null |  |
  | `versions[].actor_user_id` | string \| null | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `numbers` | array<any> |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
