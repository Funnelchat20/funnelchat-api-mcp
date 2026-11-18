# Formularios — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/formularios/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver los modelos de formulario

`GET /api/v1/forms/templates` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `whatsappForm.templates`

**Para qué sirve:** Sirve para ver los modelos con los que puedes empezar un formulario de WhatsApp (uno en blanco y otros listos) y elegir la `key` que pides al crearlo.

Devuelve las plantillas con las que puedes empezar un formulario nuevo: `key`, `title`, `description` y `category`. El catálogo es fijo y el mismo para todas las cuentas.

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<WhatsappFormTemplate> |  |
  | `data[].id` | integer |  |
  | `data[].key` | string |  |
  | `data[].title` | string |  |
  | `data[].description` | string |  |
  | `data[].category` | string |  |
  | `data[].definition` | array<any> |  |
  | `data[].sort` | integer |  |
  | `data[].created_at` | string (date-time) \| null |  |
  | `data[].updated_at` | string (date-time) \| null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)

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

### Editar un formulario

`PUT /api/v1/forms/{id}` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `whatsappForm.update`

**Para qué sirve:** Úsalo para guardar el contenido de un borrador de formulario —sus pantallas y preguntas— y ver en la respuesta qué falta corregir antes de publicarlo.

Guarda la definición de un borrador. `{id}` es el `id` de la versión. Envía `definition` con `screens` (cada pantalla con `id` de texto y `items`; cada bloque con `type`, y las preguntas con `name`) y, si quieres, `name` y `expected_updated_at`. Una definición con la forma rota responde 422 con el error en su ruta. Lo incompleto (sin título, sin bloques, etiquetas vacías) se guarda y la respuesta trae en `lint` lo que falta corregir. Responde 409 `PUBLISHED` si la versión ya está publicada (crea otra con `POST /forms/{id}/versions`) y 409 `STALE` si `expected_updated_at` no es el último guardado. Responde 404 si no existe o no es de tu cuenta.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `name` | string | no |  |
| `definition` | object | sí |  |
| `definition.screens` | array<object> | sí |  |
| `definition.screens[].id` | string | sí |  |
| `definition.screens[].title` | string \| null | no |  |
| `definition.screens[].cta` | string \| null | no |  |
| `definition.screens[].next` | string \| null | no |  |
| `definition.screens[].routes` | object \| null | no |  |
| `definition.screens[].items` | array<object> | no |  |
| `expected_updated_at` | string \| null | no |  |

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

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Borrar un formulario

`DELETE /api/v1/forms/{id}` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `whatsappForm.destroy`

**Para qué sirve:** Sirve para borrar un borrador de formulario que ya no vas a publicar. Un formulario publicado no se borra.

Elimina un borrador. `{id}` es el `id` de la versión. Un formulario publicado no se elimina: responde 409 `PUBLISHED`. Responde 404 si la versión no existe o no es de tu cuenta.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |

**Respuestas**

- `204` — No Content
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `409` — Conflict

### Crear una versión de un formulario

`POST /api/v1/forms/{id}/versions` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `whatsappForm.storeVersion`

**Para qué sirve:** Úsalo para cambiar un formulario ya publicado: crea un borrador nuevo a partir de esa versión, que editas y publicas sin cambiar el `form_id` con el que lo mandas.

Crea la versión siguiente de un formulario publicado, como borrador, para poder cambiarlo. `{id}` es el `id` de la versión desde la que partes. Responde 201 con la versión nueva, o 200 con `created: false` si el formulario ya tenía un borrador (ese borrador es la respuesta). Responde 404 si la versión no existe o no es de tu cuenta.

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
  | `created` | boolean |  |
  | `lint` | array<any> |  |
  | `numbers` | array<any> |  |

- `201` — Created

  La misma tabla que en «Crear una versión de un formulario», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)

### Publicar un formulario

`POST /api/v1/forms/{id}/publish` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `whatsappForm.publish`

**Para qué sirve:** Sirve para publicar una versión de un formulario, al momento, y dejarla lista para mandarla; en los otros números del formulario se publica en segundo plano.

Publica una versión en Meta; la publicación es inmediata. `{id}` es el `id` de la versión. Si la definición tiene errores responde 422 `LINT` con la lista; si Meta rechaza la llamada, 502 `META`, o 422 `META` si la rechaza porque tu cuenta de WhatsApp Business no cumple sus requisitos de integridad. Los otros números del formulario se publican en segundo plano: consulta su estado en `GET /forms/{id}/numbers`. Responde 404 si no existe o no es de tu cuenta. Puedes llamarla hasta 30 veces por minuto.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |

**Respuestas**

- `200` — OK

  La misma tabla que en «Crear un formulario», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)

### Sincronizar un formulario

`POST /api/v1/forms/{id}/sync` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `whatsappForm.sync`

**Para qué sirve:** Úsalo para validar un formulario en Meta sin publicarlo y ver lo que Meta observa antes de publicarlo.

Valida una versión en Meta sin publicarla. `{id}` es el `id` de la versión. Responde la versión con `lint` y lo que Meta observó. Si Meta rechaza la llamada responde 502 `META`, o 422 `META` si la rechaza porque tu cuenta de WhatsApp Business no cumple sus requisitos de integridad. Responde 404 si no existe o no es de tu cuenta. Puedes llamarla hasta 30 veces por minuto.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |

**Respuestas**

- `200` — OK

  La misma tabla que en «Crear un formulario», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)

### Ver los números de un formulario

`GET /api/v1/forms/{id}/numbers` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `whatsappForm.numbersIndex`

**Para qué sirve:** Sirve para ver en qué números oficiales está un formulario y cómo va su publicación en cada uno.

Lista los números de WhatsApp Cloud donde vive una versión de formulario de tu cuenta y el estado de cada uno (`draft`, `publishing`, `published` o `failed`). El primero es el número con el que se creó. `{id}` es el `id` de la versión. Responde 404 si la versión no existe o no es de tu cuenta.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `numbers` | array<any> |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)

### Sumar números a un formulario

`POST /api/v1/forms/{id}/numbers` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `whatsappForm.addNumber`

**Para qué sirve:** Úsalo para sumar un número oficial a un formulario y poder mandarlo también desde ahí; si ya está publicado, se publica en ese número enseguida.

Suma un número de WhatsApp Cloud a una versión de formulario. `{id}` es el `id` de la versión y `device_id` el número de tu cuenta. Si la versión ya está publicada, se publica en ese número de inmediato. Responde `numbers` con el estado de cada número; si el número no es de tu cuenta o no es WhatsApp Cloud responde 422 `NUMBER_NOT_ELIGIBLE`. Puedes llamarla hasta 30 veces por minuto.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `numbers` | array<any> |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Reintentar los números de un formulario

`POST /api/v1/forms/{id}/numbers/retry` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `whatsappForm.retryNumbers`

**Para qué sirve:** Sirve para volver a publicar un formulario en los números en los que falló o todavía no se publicó.

Reintenta publicar los números que fallaron o que aún no se publicaron en una versión ya publicada. `{id}` es el `id` de la versión. Responde `numbers` con el estado de cada número. Responde 404 si no existe o no es de tu cuenta.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `numbers` | array<any> |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)

### Sacar un número de un formulario

`DELETE /api/v1/forms/{id}/numbers/{deviceId}` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `whatsappForm.removeNumber`

**Para qué sirve:** Úsalo para que un formulario deje de mandarse por uno de tus números. El número con el que lo creaste no se saca.

Quita un número de una versión de formulario: deja de enviarse por él. `{id}` es el `id` de la versión y `{deviceId}` el número de tu cuenta. El número con el que se creó el formulario no se quita: responde 422 `PRIMARY_NUMBER`. Responde 404 si la versión o el número no existen o no son de tu cuenta.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |
| `deviceId` | path | string | sí |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `numbers` | array<any> |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found
- `422` — Unprocessable Content

### Ver las versiones de un formulario

`GET /api/v1/forms/families/{familyId}/versions` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `whatsappForm.versions`

**Para qué sirve:** Sirve para ver el historial de versiones de un formulario, cuál es la vigente y cuántas respuestas recibió cada una.

Lista las versiones de un formulario de tu cuenta, de la más nueva a la más vieja, con su estado, si es la vigente y cuántas respuestas recibió cada una. `{familyId}` es el `family_id` del formulario. Pagina con `perPage` (1 a 100, 25 por defecto). Responde 404 si el formulario no existe o no es de tu cuenta.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `familyId` | path | string | sí |  |
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<object> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `frv_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].version` | integer |  |
  | `data[].name` | string |  |
  | `data[].status` | string |  |
  | `data[].is_current` | boolean |  |
  | `data[].published_at` | string \| null |  |
  | `data[].deprecated_at` | string \| null |  |
  | `data[].meta_flow_id` | string \| null |  |
  | `data[].retained_reason` | string \| null |  |
  | `data[].responses` | integer |  |
  | `data[].templates` | integer |  |
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

### Ver la definición de un formulario

`GET /api/v1/forms/families/{familyId}/definition` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `whatsappForm.definition`

**Para qué sirve:** Úsalo para leer el contenido vigente de un formulario con su `family_id` (el de la versión publicada o, si no hay, el de la más nueva), sin buscar antes la versión.

Devuelve la definición de un formulario: la de la versión publicada o, si todavía no hay ninguna, la de la versión más nueva. `{familyId}` es el `family_id` del formulario, no el `id` de una versión. Responde 404 si el formulario no existe o no es de tu cuenta.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `familyId` | path | string | sí |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | object |  |
  | `data.family_id` | string | Id opaco: un texto que empieza con `frm_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.form_id` | string | Id opaco: un texto que empieza con `frv_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.name` | string |  |
  | `data.status` | string |  |
  | `data.version` | integer |  |
  | `data.definition` | array<any> \| object |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)

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

### Ver una respuesta de un formulario

`GET /api/v1/forms/families/{familyId}/responses/{runId}` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `whatsappForm.response`

**Para qué sirve:** Úsalo para ver una respuesta completa de un formulario: lo que contestó el contacto y lo que se hizo con esas respuestas.

Devuelve una respuesta completa de un formulario de tu cuenta: las respuestas del contacto y lo que se hizo con ellas. `{familyId}` es el `family_id` del formulario y `{runId}` el `id` de la respuesta que viene en `GET /forms/families/{familyId}/responses`. Responde 404 si no existe o no es de tu cuenta.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `familyId` | path | string | sí |  |
| `runId` | path | string | sí |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | object |  |
  | `data.id` | string | Id opaco: un texto que empieza con `frs_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.flow_token` | string |  |
  | `data.contact` | object |  |
  | `data.status` | object |  |
  | `data.origin` | string |  |
  | `data.node_id` | string \| null |  |
  | `data.automation_run_id` | string \| null | Id opaco: un texto que empieza con `run_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.conversation_id` | integer \| null |  |
  | `data.version` | integer |  |
  | `data.version_id` | string | Id opaco: un texto que empieza con `frv_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.output_id` | string \| null |  |
  | `data.output_label` | string \| null |  |
  | `data.reason` | string \| null |  |
  | `data.reason_label` | string \| null |  |
  | `data.completed_after_expiry` | boolean |  |
  | `data.partial` | string |  |
  | `data.last_screen_id` | string \| null |  |
  | `data.sent_at` | string \| null |  |
  | `data.delivered_at` | string \| null |  |
  | `data.read_at` | string \| null |  |
  | `data.responded_at` | string \| null |  |
  | `data.expires_at` | string \| null |  |
  | `data.answers` | array<object> |  |
  | `data.effects` | array<array<any> \| object> |  |
  | `data.response_json` | array<any> \| null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)

### Ver las métricas de un formulario

`GET /api/v1/forms/families/{familyId}/metrics` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `whatsappForm.metrics`

**Para qué sirve:** Sirve para medir un formulario: cuántos se enviaron, cuántos se abrieron y cuántos se completaron, con sus porcentajes.

Devuelve los números de un formulario de tu cuenta: cuántos se enviaron, cuántos se abrieron y cuántos se completaron, y sus porcentajes. `{familyId}` es el `family_id` del formulario. Acepta los mismos filtros de fecha, versión y origen que la lista de respuestas; un filtro inválido responde 422. Responde 404 si el formulario no existe o no es de tu cuenta.

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
| `per_page` | query | integer \| null | no |  |
| `page` | query | integer \| null | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | object |  |
  | `data.not_sent` | integer |  |
  | `data.not_sent_reasons` | array<object> |  |
  | `data.sent` | integer |  |
  | `data.delivered` | integer |  |
  | `data.read` | integer |  |
  | `data.completed` | integer |  |
  | `data.pending` | integer |  |
  | `data.unfinished` | integer |  |
  | `data.partial` | integer |  |
  | `data.completion_rate` | number \| null |  |
  | `data.delivery_rate` | number \| null |  |
  | `data.read_rate` | number \| null |  |
  | `data.median_seconds_to_complete` | integer \| null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
