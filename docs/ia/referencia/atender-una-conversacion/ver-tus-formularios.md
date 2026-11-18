# Ver tus formularios — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/atender-una-conversacion/ver-tus-formularios/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver tus formularios

`GET /api/v1/forms` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `whatsappForm.index`

**Para qué sirve:** Úsalo para encontrar el formulario que vas a mandar: su `family_id` es el `form_id` que pides al mandarlo (el `id` es el de una versión).

Lista los formularios de tu cuenta, uno por formulario aunque tenga varias versiones; de cada uno ves la versión que usas hoy (la publicada o, si no hay, la más nueva). El `id` de cada fila es el de esa versión y `family_id` es el del formulario. Filtra con `q` (parte del nombre), `status` (`draft`, `published` o `deprecated`) y `device_id` (un número de tu cuenta; si no es WhatsApp Cloud responde 422 `NUMBER_NOT_ELIGIBLE`). Pagina con `perPage` (1 a 100, 25 por defecto).

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `q` | query | string \| null | no |  |
| `status` | query | string \| null ∈ {"draft", "published", "deprecated", null} | no |  |
| `device_id` | query | string \| null | no |  |
| `page` | query | integer \| null | no |  |
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<WhatsappFormResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `frv_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].family_id` | string | Id opaco: un texto que empieza con `frm_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].name` | string |  |
  | `data[].label` | string |  |
  | `data[].category` | string |  |
  | `data[].status` | string |  |
  | `data[].version` | integer |  |
  | `data[].definition` | array<any> |  |
  | `data[].fields` | array<any> \| null |  |
  | `data[].mapping` | array<any> \| null |  |
  | `data[].tag_rules` | array<any> \| null |  |
  | `data[].has_endpoint` | boolean |  |
  | `data[].first_screen` | string \| null |  |
  | `data[].first_screen_dynamic` | boolean |  |
  | `data[].lint_errors_count` | integer |  |
  | `data[].draft_id` | string | Id opaco: un texto que empieza con `frv_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].draft_version` | integer |  |
  | `data[].sends` | integer |  |
  | `data[].responses` | integer |  |
  | `data[].meta_flow_id` | string \| null |  |
  | `data[].flow_json` | array<any> \| null |  |
  | `data[].validation_errors` | array<any> \| null |  |
  | `data[].published_at` | string \| null |  |
  | `data[].updated_at` | string \| null |  |
  | `links` | object |  |
  | `links.first` | string \| null |  |
  | `links.last` | string \| null |  |
  | `links.prev` | string \| null |  |
  | `links.next` | string \| null |  |
  | `meta` | object |  |
  | `meta.current_page` | integer |  |
  | `meta.from` | integer \| null |  |
  | `meta.last_page` | integer |  |
  | `meta.links` | array<object> |  |
  | `meta.path` | string |  |
  | `meta.per_page` | integer |  |
  | `meta.to` | integer \| null |  |
  | `meta.total` | integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
