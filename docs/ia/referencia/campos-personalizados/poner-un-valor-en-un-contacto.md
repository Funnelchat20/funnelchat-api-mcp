# Poner un valor en un contacto — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/campos-personalizados/poner-un-valor-en-un-contacto/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Poner un valor en un contacto

`POST /api/v1/contacts/attach-custom-field` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `contact.attachCustomField`

**Para qué sirve:** Úsalo para guardar datos propios de tu negocio en los contactos (plan, ciudad, fecha de compra): asigna valores de campos personalizados a uno o varios contactos en una sola llamada.

Pone valores de campos personalizados en contactos. El cuerpo es una lista de ítems `{customFieldId, contactId, value}`; si el contacto ya tenía un valor en ese campo, se reemplaza.

```json
[{"customFieldId": 15, "contactId": 4321, "value": "2026-11-30"}]
```

Cada ítem se resuelve por separado y uno rechazado no detiene a los demás. La respuesta es **200** con un resultado `{message, status}` por ítem, en el mismo orden:

| `status` | Cuándo |
|---|---|
| 201 | El valor quedó guardado. |
| 404 | El campo o el contacto no existe, no es de tu cuenta o está fuera del workspace de tu clave. No se guarda. |
| 422 | `value` no cumple el formato del tipo del campo (numérico, fecha `AAAA-MM-DD` o URL); `message` dice qué formato espera. No se guarda. |

Cómo escribir `value` según el tipo: ver `type` en `GET /custom-fields`. Si el cuerpo no es una lista de ítems con `customFieldId`, `contactId` y `value` de texto, la llamada entera responde **422** y no guarda nada.

**Cuerpo** (`application/json`)

Esquema: array<object>.

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `[].message` | string |  |
  | `[].status` | integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
