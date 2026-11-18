# Borrar contactos — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/contactos/borrar-contactos/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Borrar contactos

`POST /api/v1/contacts/delete` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `contact.destroy`

**Para qué sirve:** Úsalo para borrar contactos en bloque: por IDs, por filtros (etiquetas, campos personalizados, país, fecha de alta) o todos. Ideal para limpiezas masivas de la base.

**Cuerpo** (`application/json`)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `all` | boolean | no |  |
| `contactIds` | array<string> | no |  |
| `created_from` | string (date-time) \| null | no |  |
| `created_to` | string (date-time) \| null | no |  |
| `tag_mode` | string \| null ∈ {"all", "any", "exclude", null} | no |  |
| `tag_ids` | array<string> \| null | no |  |
| `tag_filters` | array<object> \| null | no |  |
| `tag_filters[].tag_ids` | array<string> | sí |  |
| `tag_filters[].mode` | string ∈ {"all", "any", "exclude"} | sí |  |
| `custom_field_mode` | string \| null ∈ {"all", "any", "exclude", null} | no |  |
| `custom_field_ids` | array<string> \| null | no |  |
| `custom_field_value` | string \| null | no |  |
| `custom_field_date_from` | string (date) \| null | no |  |
| `custom_field_date_to` | string (date) \| null | no |  |
| `custom_field_numeric_operator` | string \| null ∈ {"lt", "eq", "gt", null} | no |  |
| `custom_field_numeric_value` | number \| null | no |  |
| `custom_field_filters` | array<object> \| null | no |  |
| `custom_field_filters[].custom_field_ids` | array<string> | sí |  |
| `custom_field_filters[].type` | integer ∈ {"0", "1", "2", "3", "4"} | sí |  |
| `custom_field_filters[].mode` | string \| null ∈ {"all", "any", "exclude", null} | no |  |
| `custom_field_filters[].value` | string \| null | no |  |
| `custom_field_filters[].date_from` | string (date) \| null | no |  |
| `custom_field_filters[].date_to` | string (date) \| null | no |  |
| `custom_field_filters[].numeric_operator` | string \| null ∈ {"lt", "eq", "gt", null} | no |  |
| `custom_field_filters[].numeric_value` | number \| null | no |  |
| `custom_field_filters[].date_operator` | string \| null ∈ {"lt", "gt", "eq", "period", null} | no |  |
| `country_codes` | array<string> | no |  |

**Respuestas**

- `200` — OK
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
