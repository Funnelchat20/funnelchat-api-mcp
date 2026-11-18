# Contactos — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/contactos/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver tus contactos

`GET /api/v1/contacts` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `contact.index`

**Para qué sirve:** Úsalo para buscar y segmentar contactos desde tu sistema: filtra por nombre, teléfono, email, etiquetas, campos personalizados, país, fecha de alta o lead score. Es la base para sincronizar o exportar tu CRM.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `name` | query | string | no |  |
| `email` | query | string | no |  |
| `phone` | query | string | no |  |
| `whatsapp_id` | query | string | no |  |
| `country_codes[]` | query | array<string> | no |  |
| `status` | query | string | no |  |
| `image` | query | string | no |  |
| `created_at` | query | string (date-time) | no |  |
| `created_from` | query | string (date-time) | no |  |
| `created_to` | query | string (date-time) | no |  |
| `tag_ids[]` | query | array<string> | no |  |
| `tag_mode` | query | string ∈ {"all", "any", "exclude"} | no |  |
| `custom_field_ids[]` | query | array<string> | no |  |
| `custom_field_mode` | query | string ∈ {"all", "any", "exclude"} | no |  |
| `custom_field_value` | query | string | no |  |
| `custom_field_date_from` | query | string (date) | no |  |
| `custom_field_date_to` | query | string (date) | no |  |
| `custom_field_numeric_operator` | query | string ∈ {"lt", "eq", "gt"} | no |  |
| `custom_field_numeric_value` | query | number | no |  |
| `only_with_phone` | query | string | no |  |
| `only_with_mac` | query | string | no |  |
| `only_paused` | query | string | no |  |
| `scopeToAdvisor` | query | string | no |  |
| `lead_score_categories[]` | query | array<string ∈ {"insufficient_data", "hot", "warm", "cold"}> ∈ {"insufficient_data", "hot", "warm", "cold"} | no |  |
| `lead_score_min` | query | integer | no |  |
| `lead_score_max` | query | integer | no |  |
| `lead_score_disqualified` | query | string \| null ∈ {"include", "exclude", "only", null} | no |  |
| `tag_filters` | query | array<object> | no |  |
| `custom_field_filters` | query | array<object> | no |  |
| `perPage` | query | integer | no |  |
| `orderBy` | query | string ∈ {"id", "name", "email", "phone", "status", "favorite", "unread_messages", "created_at", "updated_at"} | no |  |
| `orderByMethod` | query | string ∈ {"asc", "desc"} | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<ContactResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `ctc_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].name` | string |  |
  | `data[].email` | string |  |
  | `data[].phone` | string |  |
  | `data[].whatsapp_id` | string |  |
  | `data[].whatsapp_username` | string \| null |  |
  | `data[].has_phone` | boolean |  |
  | `data[].country_code` | string |  |
  | `data[].status` | integer |  |
  | `data[].image` | string |  |
  | `data[].notes` | string \| null |  |
  | `data[].custom_fields` | array<ContactCustomFieldResource> |  |
  | `data[].created_at` | string (date-time) \| null |  |
  | `data[].active_conversation` | integer |  |
  | `data[].favorite` | integer |  |
  | `data[].unread_messages` | integer |  |
  | `data[].manually_unread` | boolean |  |
  | `data[].last_message` | object |  |
  | `data[].device_id` | string \| null | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].adviser_id` | string \| null | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].paused_at` | string \| null |  |
  | `data[].paused_by` |  |  |
  | `data[].mac_date` | string \| null |  |
  | `data[].is_mac_inactive` | boolean |  |
  | `data[].ai_assistant_name` | string \| null |  |
  | `data[].opted_out` | boolean |  |
  | `data[].stage_since` | string |  |
  | `data[].is_stagnant` | boolean |  |
  | `data[].follow_up_date` | string \| null |  |
  | `data[].lead_score` | object |  |
  | `data[].name_mismatch` | array<any> \| null |  |
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
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver un contacto

`GET /api/v1/contacts/{contact}` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `contact.show`

**Para qué sirve:** Úsalo para traer la ficha completa de un contacto: datos, campos personalizados, estado de la conversación, mensajes sin leer y último mensaje.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `contact` | path | string | sí |  |

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
- `404` — Not Found (`ConversationsModelNotFoundException`)

### Crear un contacto

`POST /api/v1/contacts` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `contact.store`

**Para qué sirve:** Sirve para dar de alta un contacto nuevo (teléfono o WhatsApp ID, nombre, email y, si quieres, sus campos personalizados). Si ya existe, te lo devuelve sin cambiarlo: para actualizarlo en la misma llamada, usa la operación de crear o actualizar.

Crea un contacto con su teléfono (`phone`) o su `whatsapp_id`. Responde **201** cuando lo crea. Si ya hay un contacto con ese teléfono o `whatsapp_id`, responde **200** con ese contacto, sin actualizar sus datos ni aplicarle `custom_fields`: para crear o actualizar en una sola llamada, usa `POST /contacts/update-or-create`. Si en tu cuenta cada workspace tiene sus propios contactos, el contacto se busca y se crea en el workspace de tu clave: que otro workspace tenga un contacto con el mismo teléfono no cambia la respuesta. Si tus workspaces comparten los contactos, se busca en toda tu cuenta.

**Campos personalizados (`custom_fields`, opcional).** Una lista de hasta 100 ítems `{id, value}`: `id` es el de un campo de tu cuenta (`GET /custom-fields`) y `value`, su valor para este contacto. Se guardan igual que con `POST /contacts/attach-custom-field`:

- Si el contacto ya tenía un valor en ese campo, se reemplaza. Los campos que no mandes no se tocan; para quitar un valor, `POST /contacts/detach-custom-field`.
- `value` es siempre texto (`"1500"`, no `1500`) y se valida contra el tipo del campo: un campo numérico, de fecha o de URL solo acepta su formato (por ejemplo, una fecha es `AAAA-MM-DD`). Cómo escribirlo según el tipo: ver `type` en `GET /custom-fields`.
- **Todo o nada:** si un `id` no existe, es de otra cuenta, está fuera del workspace de tu clave o se repite en la lista, o si un `value` no cumple el formato de su tipo, la llamada responde **422** y no crea ni cambia nada, ni el contacto ni ningún valor.
- Para ver los valores guardados: `GET /contacts/{contact}/custom-fields`.

```json
{"phone": "5491122334455", "name": "Ana Pérez", "custom_fields": [{"id": 12, "value": "Mayorista"}, {"id": 15, "value": "2026-11-30"}]}
```

| HTTP | Cuándo |
|---|---|
| 422 | Un dato del contacto no es válido, o `custom_fields` no es una lista de hasta 100 ítems con `id` y `value` de texto, o un `id` se repite o no es un campo de tu cuenta y de tu workspace (el error viene en `errors["custom_fields.N.id"]`), o un `value` no cumple el formato del tipo de su campo (en `errors["custom_fields.N.value"]`, con el formato que espera). No se crea ni se cambia nada. |
| 404 | Tus workspaces comparten los contactos y ya hay un contacto con ese teléfono (o `whatsapp_id`) en otro workspace de tu cuenta, fuera del de tu clave. No se cambia nada. Si cada workspace tiene sus propios contactos, esta respuesta no ocurre: el contacto se crea en el workspace de tu clave. |
| 429 | Demasiadas solicitudes por minuto (ver `Retry-After`). |

**Cuerpo** (`application/json`)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `phone` | string | no |  |
| `whatsapp_id` | string | no |  |
| `name` | string \| null | no |  |
| `email` | string (email) \| null | no |  |
| `image` | string \| null | no |  |
| `deviceId` | string \| null | no | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `custom_fields` | array<object> | no | Opcional. Valores de campos personalizados para el contacto, hasta 100 ítems `{id, value}`: `id` es el de un campo de tu cuenta (`GET /custom-fields`) y `value`, su valor (siempre texto, en el formato del tipo del campo). Si un `id` no es de tu cuenta o de tu workspace, o un `value` no cumple el formato de su tipo, la llamada responde 422 y no crea ni cambia nada. |
| `custom_fields[].id` | string | sí | El `id` de un campo personalizado de tu cuenta (`GET /custom-fields`). Id opaco: un texto que empieza con `fld_`. Se usa tal como llega; no se arma ni se interpreta. |
| `custom_fields[].value` | string | sí | Valor del campo para el contacto. Siempre es un texto (`"1500"`, no `1500`). Al ponerlo con tu clave se valida contra el tipo del campo (numérico, fecha o URL) y, si no cumple su formato, la API responde 422: el formato de cada tipo está en la descripción de `type` de `GET /custom-fields`. |

**Respuestas**

- `200` — OK

  La misma tabla que en «Ver un contacto», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

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

  La misma tabla que en «Ver un contacto», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Editar un contacto

`PUT /api/v1/contacts/{contact}` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `contact.update`

**Para qué sirve:** Sirve para mantener al día la ficha de un contacto desde tu sistema: nombre, email, teléfono, notas, asesor asignado, favorito o si puede ejecutar flujos.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `contact` | path | string | sí |  |

**Cuerpo** (`application/json`)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `name` | string \| null | no |  |
| `email` | string (email) \| null | no |  |
| `phone` | string \| null | no |  |
| `notes` | string \| null | no |  |
| `status` | integer | no |  |
| `adviser_id` | string \| null | no | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
| `active_conversation` | boolean | no |  |
| `favorite` | boolean | no |  |
| `fixed` | boolean | no |  |
| `image` | string \| null | no |  |
| `can_execute_flows` | boolean | no |  |
| `manually_unread` | boolean | no |  |

**Respuestas**

- `200` — OK
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver los contactos de un número

`GET /api/v1/devices/{device}/contacts` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `contact.contactsByDevice`

**Para qué sirve:** Sirve para listar los contactos asociados a uno de tus números conectados, útil si manejas varios números y quieres separar la base por cada uno.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí |  |
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — OK

  La misma tabla que en «Ver tus contactos», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)

### Ver la ventana de 24 horas de un contacto

`GET /api/v1/contacts/{contact}/meta-window` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `contact.metaWindow`

**Para qué sirve:** Úsalo antes de escribirle a un contacto para saber si su ventana de 24 horas de Meta está abierta en un número, y así decidir si puedes mandar un mensaje libre o necesitas una plantilla.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `contact` | path | string | sí |  |
| `device_id` | query | string | sí |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `is_open` | boolean |  |
  | `meta_device_id` | null |  |
  | `expires_at` | null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

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
