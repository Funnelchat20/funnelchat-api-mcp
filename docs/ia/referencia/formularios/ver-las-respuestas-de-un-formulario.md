# Ver las respuestas de un formulario — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/formularios/ver-las-respuestas-de-un-formulario/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver las respuestas de un formulario

`GET /api/v1/forms/families/{familyId}/responses` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `whatsappForm.responses`

**Para qué sirve:** Sirve para leer las respuestas de un formulario, de todas sus versiones, con filtros por fecha, versión o contacto; por ejemplo para exportarlas o revisarlas.

Lista las respuestas de un formulario de tu cuenta, de la más reciente a la más antigua, sumando todas sus versiones. Junto a `data` viene `columns`, las preguntas que usan esas respuestas. `{familyId}` es el `family_id` del formulario. Filtra con `from` y `to` (fechas), `version_id` (el `id` de una versión de ese formulario), `origin`, `status` y `search` (nombre o teléfono del contacto). Un filtro con un valor inválido responde 422. Pagina con `perPage` (1 a 100, 25 por defecto). Responde 404 si el formulario no existe o no es de tu cuenta.

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
| `page` | query | integer \| null | no |  |
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<object> |  |
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
