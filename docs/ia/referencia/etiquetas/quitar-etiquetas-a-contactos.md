# Quitar etiquetas a contactos — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/etiquetas/quitar-etiquetas-a-contactos/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Quitar etiquetas a contactos

`POST /api/v1/contacts/remove-tags` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `contact.removeTags`

**Para qué sirve:** Sirve para quitarles etiquetas a uno o varios contactos, hasta 200 por llamada, por ejemplo cuando un dato cambió en tu sistema. No arranca ninguna automatización.

Quita etiquetas de contactos. El cuerpo es un arreglo JSON de hasta 200 ítems; cada ítem quita una etiqueta (`tag.id`) de un contacto (`contactId`). `tag.name` es opcional y no se usa.

- **Webhooks:** cada etiqueta que el contacto tenía emite `contact.tag_removed`. Si el contacto no la tenía, ese ítem no hace nada.
- **Flujos:** quitar una etiqueta no arranca ningún flujo.
- **Tu cuenta y tu workspace:** un ítem cuyo contacto o etiqueta no existe, es de otra cuenta o está fuera del workspace de tu clave se ignora sin error. Para confirmar el resultado, `GET /contacts/{contact}/tags`.
- **Etiqueta del sistema «No contactar»:** marca a un contacto que pidió no recibir mensajes. Solo se pone o se quita desde el chat, con la acción «No contactar» del contacto, que deja una nota de constancia; por esta llamada no se pone ni se quita (ver el 422). La reconoces por `is_system: true` en `GET /tags` y en `GET /contacts/{contact}/tags`, y `GET /contacts/{contact}` trae `opted_out: true` cuando el contacto la tiene.
- **Respuesta:** 200 sin cuerpo.

| HTTP | Cuándo |
|---|---|
| 422 | El cuerpo no es un arreglo de ítems con `contactId` y `tag.id`, o tiene más de 200 ítems. |
| 422 | Algún ítem nombra la etiqueta del sistema «No contactar»: el error viene en `errors.tag` y no se aplica ningún ítem de la llamada. |
| 429 | Demasiadas solicitudes por minuto (ver `Retry-After`). |

**Cuerpo** (`application/json`, obligatorio)

Esquema: array<object>.

**Respuestas**

- `200` — OK
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
