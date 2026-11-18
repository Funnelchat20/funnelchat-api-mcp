# Crear o actualizar un contacto — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/contactos/crear-o-actualizar-un-contacto/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Crear o actualizar un contacto

`POST /api/v1/contacts/update-or-create` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `contact.updateOrCreate`

**Para qué sirve:** Úsalo para sincronizar contactos desde tu sistema sin duplicarlos: si el teléfono ya es un contacto, le actualiza el nombre y el email que mandes; si no, lo crea. En los dos casos le pone los campos personalizados que mandes.

Crea el contacto con ese teléfono (`phone`) o, si ya existe, le actualiza `name` y `email` (los que mandes). Responde **201** cuando lo crea y **200** cuando lo actualiza. `custom_fields` se aplica en los dos casos. Si en tu cuenta cada workspace tiene sus propios contactos, el contacto se busca y se crea en el workspace de tu clave: que otro workspace tenga un contacto con el mismo teléfono no cambia la respuesta. Si tus workspaces comparten los contactos, se busca en toda tu cuenta.

**Campos personalizados (`custom_fields`, opcional).** Una lista de hasta 100 ítems `{id, value}`: `id` es el de un campo de tu cuenta (`GET /custom-fields`) y `value`, su valor para este contacto. Se guardan igual que con `POST /contacts/attach-custom-field`:

- Si el contacto ya tenía un valor en ese campo, se reemplaza. Los campos que no mandes no se tocan; para quitar un valor, `POST /contacts/detach-custom-field`.
- `value` es siempre texto (`"1500"`, no `1500`) y se valida contra el tipo del campo: un campo numérico, de fecha o de URL solo acepta su formato (por ejemplo, una fecha es `AAAA-MM-DD`). Cómo escribirlo según el tipo: ver `type` en `GET /custom-fields`.
- **Todo o nada:** si un `id` no existe, es de otra cuenta, está fuera del workspace de tu clave o se repite en la lista, o si un `value` no cumple el formato de su tipo, la llamada responde **422** y no crea ni cambia nada, ni el contacto ni ningún valor.
- Para ver los valores guardados: `GET /contacts/{contact}/custom-fields`.

```json
{"phone": "5491122334455", "email": "ana@ejemplo.com", "custom_fields": [{"id": 12, "value": "Mayorista"}, {"id": 18, "value": "1500"}]}
```

| HTTP | Cuándo |
|---|---|
| 422 | Un dato del contacto no es válido, o `custom_fields` no es una lista de hasta 100 ítems con `id` y `value` de texto, o un `id` se repite o no es un campo de tu cuenta y de tu workspace (el error viene en `errors["custom_fields.N.id"]`), o un `value` no cumple el formato del tipo de su campo (en `errors["custom_fields.N.value"]`, con el formato que espera). No se crea ni se cambia nada. |
| 404 | Tus workspaces comparten los contactos y ya hay un contacto con ese teléfono (o `whatsapp_id`) en otro workspace de tu cuenta, fuera del de tu clave. No se cambia nada. Si cada workspace tiene sus propios contactos, esta respuesta no ocurre: el contacto se crea en el workspace de tu clave. |
| 429 | Demasiadas solicitudes por minuto (ver `Retry-After`). |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `phone` | string | sí |  |
| `name` | string \| null | no |  |
| `email` | string (email) \| null | no |  |
| `custom_fields` | array<object> | no | Opcional. Valores de campos personalizados para el contacto, hasta 100 ítems `{id, value}`: `id` es el de un campo de tu cuenta (`GET /custom-fields`) y `value`, su valor (siempre texto, en el formato del tipo del campo). Si un `id` no es de tu cuenta o de tu workspace, o un `value` no cumple el formato de su tipo, la llamada responde 422 y no crea ni cambia nada. |
| `custom_fields[].id` | string | sí | El `id` de un campo personalizado de tu cuenta (`GET /custom-fields`). Id opaco: un texto que empieza con `fld_`. Se usa tal como llega; no se arma ni se interpreta. |
| `custom_fields[].value` | string | sí | Valor del campo para el contacto. Siempre es un texto (`"1500"`, no `1500`). Al ponerlo con tu clave se valida contra el tipo del campo (numérico, fecha o URL) y, si no cumple su formato, la API responde 422: el formato de cada tipo está en la descripción de `type` de `GET /custom-fields`. |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string | Id opaco: un texto que empieza con `ctc_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `name` | string |  |
  | `email` | string |  |
  | `phone` | string |  |
  | `whatsapp_id` | string |  |
  | `whatsapp_username` | string \| null |  |
  | `has_phone` | boolean |  |
  | `country_code` | string |  |
  | `status` | integer |  |
  | `image` | string |  |
  | `notes` | string \| null |  |
  | `custom_fields` | array<ContactCustomFieldResource> |  |
  | `custom_fields[].id` | string | Id opaco: un texto que empieza con `fld_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `custom_fields[].name` | string |  |
  | `custom_fields[].description` | string |  |
  | `custom_fields[].type` | integer ∈ {0, 1, 2, 3, 4} | Tipo del campo. Se elige al crearlo y no se puede cambiar después. Indica cómo escribir su valor: (columnas: `type`, Tipo, Cómo escribir `value`, Ejemplo) 0, Texto, Cualquier texto., `"Cliente mayorista"`; 1, Numérico, Un número, con punto decimal y sin separador de miles; puede llevar `-` adelante., `"1500"`, `"99.90"`; 2, Fecha, `AAAA-MM-DD`, una fecha que exista., `"2026-11-30"`; 3, URL, La dirección completa, con `https://` o `http://`., `"https://ejemplo.com/pedido/123"`; 4, Alfanumérico, Pensado para códigos con letras y números; acepta cualquier texto., `"AB1234"`. |
  | `custom_fields[].value` | string | Valor del campo para el contacto. Siempre es un texto (`"1500"`, no `1500`). Al ponerlo con tu clave se valida contra el tipo del campo (numérico, fecha o URL) y, si no cumple su formato, la API responde 422: el formato de cada tipo está en la descripción de `type` de `GET /custom-fields`. |
  | `custom_fields[].created_at` | string |  |
  | `custom_fields[].updated_at` | string |  |
  | `custom_fields[].contact_count` | string |  |
  | `created_at` | string (date-time) \| null |  |
  | `active_conversation` | integer |  |
  | `favorite` | integer |  |
  | `unread_messages` | integer |  |
  | `manually_unread` | boolean |  |
  | `last_message` | object |  |
  | `last_message.text` | string |  |
  | `last_message.file` | string |  |
  | `last_message.date` | string |  |
  | `last_message.type` | string |  |
  | `last_message.own` | string |  |
  | `last_message.deleted_at` | string |  |
  | `last_message.deleted_scope` | string |  |
  | `device_id` | string \| null | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `adviser_id` | string \| null | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `paused_at` | string \| null |  |
  | `paused_by` |  |  |
  | `mac_date` | string \| null |  |
  | `is_mac_inactive` | boolean |  |
  | `ai_assistant_name` | string \| null |  |
  | `opted_out` | boolean |  |
  | `stage_since` | string |  |
  | `is_stagnant` | boolean |  |
  | `follow_up_date` | string \| null |  |
  | `lead_score` | object |  |
  | `lead_score.score` | integer |  |
  | `lead_score.signals_count` | integer |  |
  | `lead_score.category` | string |  |
  | `lead_score.confidence` | string |  |
  | `lead_score.disqualified` | boolean |  |
  | `lead_score.disqualified_at` | string \| null |  |
  | `lead_score.updated_at` | string \| null |  |
  | `name_mismatch` | array<any> \| null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found
- `422` — Unprocessable Content (`ConversationsValidationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
