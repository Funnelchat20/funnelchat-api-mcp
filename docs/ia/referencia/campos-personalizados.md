# Campos personalizados — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/campos-personalizados/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver tus campos

`GET /api/v1/custom-fields` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `customField.index`

**Para qué sirve:** Úsalo para conocer los campos personalizados de la cuenta y sus IDs antes de leer o escribir esos datos en tus contactos.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `name` | query | string | no |  |
| `description` | query | string | no |  |
| `type` | query | integer ∈ {0, 1, 2, 3, 4} | no |  |
| `withContactCount` | query | boolean | no |  |
| `perPage` | query | integer | no |  |
| `orderBy` | query | string ∈ {"name", "created_at", "updated_at"} | no |  |
| `orderByMethod` | query | string ∈ {"asc", "desc"} | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<CustomFieldResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `fld_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].name` | string |  |
  | `data[].type` | integer ∈ {0, 1, 2, 3, 4} | Tipo del campo. Se elige al crearlo y no se puede cambiar después. Indica cómo escribir su valor: (columnas: `type`, Tipo, Cómo escribir `value`, Ejemplo) 0, Texto, Cualquier texto., `"Cliente mayorista"`; 1, Numérico, Un número, con punto decimal y sin separador de miles; puede llevar `-` adelante., `"1500"`, `"99.90"`; 2, Fecha, `AAAA-MM-DD`, una fecha que exista., `"2026-11-30"`; 3, URL, La dirección completa, con `https://` o `http://`., `"https://ejemplo.com/pedido/123"`; 4, Alfanumérico, Pensado para códigos con letras y números; acepta cualquier texto., `"AB1234"`. |
  | `data[].description` | string \| null |  |
  | `data[].contact_count` | integer |  |
  | `data[].created_at` | string (date-time) \| null |  |
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

### Crear un campo

`POST /api/v1/custom-fields` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `customField.store`

**Para qué sirve:** Sirve para crear un campo personalizado nuevo (por ejemplo «plan» o «fecha de compra») y guardar en Funnelchat datos propios de tu negocio.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `name` | string | sí |  |
| `description` | string \| null | no |  |
| `type` | integer ∈ {0, 1, 2, 3, 4} | sí | Tipo del campo. Se elige al crearlo y no se puede cambiar después. Indica cómo escribir su valor: (columnas: `type`, Tipo, Cómo escribir `value`, Ejemplo) 0, Texto, Cualquier texto., `"Cliente mayorista"`; 1, Numérico, Un número, con punto decimal y sin separador de miles; puede llevar `-` adelante., `"1500"`, `"99.90"`; 2, Fecha, `AAAA-MM-DD`, una fecha que exista., `"2026-11-30"`; 3, URL, La dirección completa, con `https://` o `http://`., `"https://ejemplo.com/pedido/123"`; 4, Alfanumérico, Pensado para códigos con letras y números; acepta cualquier texto., `"AB1234"`. |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string | Id opaco: un texto que empieza con `fld_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `name` | string |  |
  | `type` | integer ∈ {0, 1, 2, 3, 4} | Tipo del campo. Se elige al crearlo y no se puede cambiar después. Indica cómo escribir su valor: (columnas: `type`, Tipo, Cómo escribir `value`, Ejemplo) 0, Texto, Cualquier texto., `"Cliente mayorista"`; 1, Numérico, Un número, con punto decimal y sin separador de miles; puede llevar `-` adelante., `"1500"`, `"99.90"`; 2, Fecha, `AAAA-MM-DD`, una fecha que exista., `"2026-11-30"`; 3, URL, La dirección completa, con `https://` o `http://`., `"https://ejemplo.com/pedido/123"`; 4, Alfanumérico, Pensado para códigos con letras y números; acepta cualquier texto., `"AB1234"`. |
  | `description` | string \| null |  |
  | `contact_count` | integer |  |
  | `created_at` | string (date-time) \| null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver un campo

`GET /api/v1/custom-fields/{customField}` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `customField.show`

**Para qué sirve:** Sirve para ver la definición de un campo personalizado: nombre, tipo, descripción y cuántos contactos lo tienen.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `customField` | path | string | sí |  |

**Respuestas**

- `200` — OK

  La misma tabla que en «Crear un campo», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)

### Editar un campo

`PUT /api/v1/custom-fields/{customField}` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `customField.update`

**Para qué sirve:** Úsalo para renombrar un campo personalizado o actualizar su descripción; el tipo no se cambia por acá.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `customField` | path | string | sí |  |

**Cuerpo** (`application/json`)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `name` | string | no |  |
| `description` | string \| null | no |  |

**Respuestas**

- `200` — OK

  La misma tabla que en «Crear un campo», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver los campos de un contacto

`GET /api/v1/contacts/{contact}/custom-fields` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `contact.customFields`

**Para qué sirve:** Sirve para leer los valores de los campos personalizados de un contacto, con búsqueda por nombre de campo.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `contact` | path | string | sí |  |
| `name` | query | string | no |  |
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<ContactCustomFieldResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `fld_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].name` | string |  |
  | `data[].description` | string |  |
  | `data[].type` | integer ∈ {0, 1, 2, 3, 4} | Tipo del campo. Se elige al crearlo y no se puede cambiar después. Indica cómo escribir su valor: (columnas: `type`, Tipo, Cómo escribir `value`, Ejemplo) 0, Texto, Cualquier texto., `"Cliente mayorista"`; 1, Numérico, Un número, con punto decimal y sin separador de miles; puede llevar `-` adelante., `"1500"`, `"99.90"`; 2, Fecha, `AAAA-MM-DD`, una fecha que exista., `"2026-11-30"`; 3, URL, La dirección completa, con `https://` o `http://`., `"https://ejemplo.com/pedido/123"`; 4, Alfanumérico, Pensado para códigos con letras y números; acepta cualquier texto., `"AB1234"`. |
  | `data[].value` | string | Valor del campo para el contacto. Siempre es un texto (`"1500"`, no `1500`). Al ponerlo con tu clave se valida contra el tipo del campo (numérico, fecha o URL) y, si no cumple su formato, la API responde 422: el formato de cada tipo está en la descripción de `type` de `GET /custom-fields`. |
  | `data[].created_at` | string |  |
  | `data[].updated_at` | string |  |
  | `data[].contact_count` | string |  |
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
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

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

### Quitar un valor de un contacto

`POST /api/v1/contacts/detach-custom-field` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `contact.detachCustomField`

**Para qué sirve:** Sirve para borrar el valor de un campo personalizado en uno o varios contactos, por ejemplo cuando un dato quedó desactualizado en tu sistema.

**Cuerpo** (`application/json`)

Esquema: array<object>.

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `messages` | array<string> |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Borrar campos personalizados

`POST /api/v1/custom-fields/delete` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `customField.destroy`

**Para qué sirve:** Úsalo para eliminar en bloque los campos personalizados que ya no usas.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `customFieldIds` | array<string> | sí |  |

**Respuestas**

- `200` — OK
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
