# Contactos y conversaciones — API de Funnelchat: contexto para tu IA

> Copiado de /docs/mas-funciones/funnelchat/#contactos-y-conversaciones. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Contactos: buscar, crear y editar

- **Para mandarle un mensaje no crees el contacto antes:** el envío por `phone` lo crea (ver «Mandar mensajes»). Crea o
  edita contactos solo cuando la persona quiere guardar o cambiar sus datos.
- **Listas por páginas:** `GET /api/v1/contacts` (y las demás listas de esta página que traen `links` y `meta`) responde
  `{"data": [...], "links": {...}, "meta": {...}}`. `perPage` va de 1 a 100 (25 si no lo mandas); otro valor responde
  `422`. Para la página siguiente, pide la URL de `links.next` tal cual, hasta que sea `null`: conserva `perPage`, el
  orden y los filtros.
- **Buscar:** `GET /api/v1/contacts` (la clave necesita **Contactos y conversaciones → Ver**) filtra por `name`,
  `email`, `phone`, `whatsapp_id`, `country_codes[]`, `status`, `created_from` y `created_to`, etiquetas (`tag_ids[]`
  con `tag_mode`: `all`, `any` o `exclude`) y campos personalizados (`custom_field_ids[]` con `custom_field_mode` y
  `custom_field_value`). Orden: `orderBy` (`id`, `name`, `email`, `phone`, `status`, `favorite`, `unread_messages`,
  `created_at`, `updated_at`) y `orderByMethod` (`asc` o `desc`). La especificación no dice si el filtro por `phone` es
  exacto: el teléfono va con código de país y sin `+` (por ejemplo `5491122334455`), y te quedas con el contacto cuyo
  `phone` coincide. Si no hay ninguno, o hay más de uno, díselo a la persona; no elijas por ella.
- **Ver uno:** `GET /api/v1/contacts/{contact}`, con `{contact}` su `id`. Trae `id`, `name`, `email`, `phone`,
  `whatsapp_id`, `whatsapp_username`, `country_code`, `status`, `image`, `notes`, `custom_fields` (cada uno con `id`,
  `name`, `type` y `value`), `created_at`, `unread_messages`, `last_message` (`text`, `type`, `date`…), `device_id` y
  `paused_at`, entre otros. Sin envoltorio `data`. `404` si la clave no lo encuentra.
- **Crear o actualizar por teléfono (lo más seguro):** `POST /api/v1/contacts/update-or-create` con `phone`
  (obligatorio) y, si quieres, `name`, `email` y `custom_fields`. La clave necesita **Contactos y conversaciones →
  Editar**. Si el teléfono todavía no es un contacto, lo crea en el workspace de la clave y responde `201`; si ya lo
  es, le actualiza el `name` y el `email` que mandes y responde `200`. La especificación no dice qué pasa con uno de
  los dos si no lo mandas: con un contacto que ya existe, manda siempre el nombre y el email que tienen que quedar
  (léelos antes con `GET /api/v1/contacts?phone=…` si no los sabes) o edítalo con `PUT /api/v1/contacts/{contact}`.
  La respuesta es el contacto, sin envoltorio `data`.
  - `404 not_found`: el teléfono ya es contacto de la cuenta, pero de otro workspace. Responde igual que un contacto
    que no existe: no se cambia nada ni trae datos de ese contacto. Para trabajar con él, la persona usa una clave
    creada en ese workspace.
  - `422`: un dato no es válido (por ejemplo, el teléfono), o uno de `custom_fields` (ver abajo); el cuerpo dice cuál.
    No se crea ni se cambia nada.
  - `429`: demasiadas llamadas por minuto; espera los segundos de `Retry-After`.
- **Crear:** `POST /api/v1/contacts` con `phone` (o `whatsapp_id`) y, si quieres, `name`, `email`, `image`,
  `deviceId` y `custom_fields`. Responde `201` con el contacto creado. Si ya hay un contacto con ese teléfono o
  `whatsapp_id` en el workspace, responde `200` con ese contacto **sin cambiar sus datos ni ponerle `custom_fields`**:
  para crear o actualizar en una llamada, usa crear o actualizar. `404` si ya existe en otro workspace de la cuenta;
  `422` y `429` como arriba.
- **Campos personalizados al crear (`custom_fields`, en las dos):** una lista de hasta 100 elementos
  `{"id": "fld_Ar7McDNiFfizqFzTybtrwHL", "value": "Mayorista"}`, con `id` el de un campo de la cuenta (`GET /api/v1/custom-fields`) y `value`
  siempre texto (`"1500"`, no `1500`) en el formato del tipo del campo (ver «Etiquetas y campos personalizados»). Si el
  contacto ya tenía un valor en ese campo, se reemplaza; los campos que no mandas no se tocan. **Todo o nada:** si un
  `id` no existe, es de otra cuenta, está fuera del workspace de la clave o se repite, o un `value` no cumple el
  formato de su tipo, responde `422` (el detalle en `errors["custom_fields.N.id"]` o `errors["custom_fields.N.value"]`,
  con el formato que espera) y no crea ni cambia nada, ni el contacto ni ningún valor.
- **Editar:** `PUT /api/v1/contacts/{contact}` con los datos a cambiar: `name`, `email` (hasta 255 caracteres cada
  uno), `phone` (hasta 20), `notes` (hasta 2500), `image`, entre otros. Ninguno es obligatorio. La especificación no
  describe el cuerpo de la respuesta ni qué pasa con un campo que no mandas: para ver cómo quedó, vuelve a leerlo con
  `GET /api/v1/contacts/{contact}`. `404` si la clave no lo encuentra; `422` si un dato no es válido.

## Los mensajes con un contacto y tus conversaciones

- **Los mensajes con un contacto:** `GET /api/v1/contacts/{contactId}/messages`, con `{contactId}` el `id` del
  contacto (la clave necesita **Contactos y conversaciones → Ver**). Viene por cursor, no por número de página: la
  respuesta trae `data` (los mensajes) y `meta` con `next_cursor` y `prev_cursor`. Para la página siguiente, repite la
  llamada con `cursor` igual a `meta.next_cursor`, hasta que sea `null`. `perPage` va de 1 a 100 (25 si no lo mandas).
  `updated_since` pide solo lo que cambió desde un momento, incluido ese mismo segundo: una fecha ISO 8601 con su zona,
  con desfase (`2026-11-13T15:04:05+00:00`) o en UTC con `Z` (`2026-11-13T15:04:05Z`), con o sin fracción de segundo;
  otro formato responde `422` con el detalle en `errors.updated_since`. La respuesta no trae `total` ni número de
  página, y `links.last` es siempre `null`: no armes el cursor a mano.
- Cada mensaje trae, entre otros, `id`, `uid`, `text`, `type`, `status`, `time`, `file` (si trae un archivo),
  `device_id`, `contact_id` y `client_reference` (la referencia que mandaste al enviarlo). Para un solo mensaje, «Ver un
  mensaje» (`GET /api/v1/contacts/{contact}/messages/{message}`).
- **Para enterarte en el momento** de lo que te escriben, usa el webhook `message.received` (ver «Recibir mensajes»);
  esta llamada es para leer lo que ya pasó. No la consultes en un bucle para esperar respuestas.
- **Tus conversaciones:** `GET /api/v1/conversations` (la clave necesita **Contactos y conversaciones → Ver**), por
  cursor como la anterior (`cursor`, `meta.next_cursor`, `perPage` de 1 a 100, `orderBy` `asc` o `desc`). Filtros
  útiles: `deviceId` (un número), `contactId`, `unreadMessages` (sin leer), `awaitingReply` (esperando respuesta),
  `activeConversation`, `favorites`, `perName` (por nombre) y `updated_since`. La especificación no describe los campos
  de cada conversación de `data`: lee los que llegan antes de depender de uno. Si responde `500 internal_error`,
  reintenta más tarde.

## Enterarte de lo que cambia: contactos y conversaciones

- Para tener al día un CRM sin consultar en un bucle, crea un webhook con `POST /api/v1/webhooks` y los eventos que
  necesites, por nombre: `contact.created` (un contacto nuevo, sea cual sea el camino), `contact.updated` (cambió el
  nombre, el email, el teléfono o el valor de un campo personalizado de un contacto que ya existía),
  `conversation.assigned` (una conversación quedó asignada a una persona del equipo o a un agente de IA) y
  `conversation.closed` (una conversación pasó de abierta a cerrada). La clave necesita **Avisos (webhooks) →
  Administrar** y, por estos eventos, **Contactos y conversaciones → Ver**. Las etiquetas tienen sus propios eventos
  (ver «Etiquetas y campos personalizados»).
- `contact.updated` junta en un evento los cambios de una misma operación: `data.changed` dice qué cambió (`name`,
  `email`, `phone`, `custom_fields`), `data.contact` trae cómo quedó y `data.custom_fields` solo los campos que
  cambiaron, con su valor nuevo (`null` si se quitó). No llega al crear un contacto (eso es `contact.created`).
- `conversation.assigned` trae en `data.assignee` el tipo (`human` o `ai`) y el nombre, nunca un id.
- En importaciones y operaciones en bloque grandes, el límite de volumen de la cuenta puede descartar parte de los
  eventos: si la persona necesita todo, que su sistema vuelva a leer con `GET /api/v1/contacts` de vez en cuando.
- El mismo evento puede llegar más de una vez: descarta los repetidos por el `id` del sobre.

## Los contactos de un número, la ventana de 24 horas y borrar contactos

- **Los contactos de un número:** `GET /api/v1/devices/{device}/contacts`, con `{device}` el `id` del número
  (`GET /api/v1/devices`). Por páginas (`links.next`, `perPage` de 1 a 100); cada elemento tiene la forma de
  `GET /api/v1/contacts/{contact}`. No acepta los filtros de `GET /api/v1/contacts`: para buscar, usa esa. La
  especificación no dice qué contactos cuenta como «de un número».
- **La ventana de 24 horas:** `GET /api/v1/contacts/{contact}/meta-window?device_id=dev_Ac7Ku7iIZDXJTjdCu0UB1mX` (`device_id` es obligatorio:
  el número por el que vas a escribir). Responde `is_open`, `expires_at` y `meta_device_id`, que la especificación no
  describe uno por uno: por el nombre, `is_open` en `true` es ventana abierta y `expires_at` cuándo vence (puede ser
  `null`). Úsala antes de mandar un mensaje libre por un número oficial: con la ventana cerrada, manda una plantilla
  (ver «Mandar mensajes»); no pruebes a mandar el mensaje para ver si sale.
- **Borrar contactos:** `POST /api/v1/contacts/delete` con `{"contactIds": ["ctc_ABViuUDF93I2VL1tInstRDG", "ctc_AHm3Qe7TzLw0Xb9Nc2YpVdK"]}`. Hazlo solo si la persona lo
  pide de forma explícita para eso; confírmale qué vas a borrar (nombre e id de cada contacto) antes de llamar. La
  especificación no dice si se puede deshacer ni qué pasa con sus mensajes. `all` y los filtros que acepta el cuerpo
  (`tag_ids`, `custom_field_ids`, `country_codes`, `created_from`…): sin descripción todavía en la especificación;
  para borrar unos contactos en concreto alcanza con `contactIds`. Arma la lista de
  `id` con `GET /api/v1/contacts` y muéstrasela a la persona. Responde `200` sin cuerpo: para confirmar, búscalos otra
  vez. No llega `contact.tag_removed` por las etiquetas de un contacto borrado.

## Contar y marcar tus conversaciones

- **Contar:** `GET /api/v1/conversations/count/all`, `/count/open`, `/count/closed` y `/count/unread` responden
  `{"count": n}` (en las cerradas, `count` puede ser `null`). Filtros: `favorites`, `ownAndUnassigned` y `advisorIds`
  (texto); la especificación no dice el formato de `advisorIds` ni qué incluye `ownAndUnassigned`. `count/unread` acepta
  además `withMine`, y entonces la respuesta puede traer también `mine`. Pídelos cuando la persona necesite el número;
  no los consultes en un bucle.
- **Marcar todas como leídas o no leídas:** `POST /api/v1/conversations/mark-all-read` y
  `POST /api/v1/conversations/mark-all-unread`, con los mismos filtros en el cuerpo. Cambian muchas conversaciones a la
  vez: confírmale a la persona cuáles (todas o el filtro) antes de llamar. Responden `updated_count` (leídas) o
  `marked_count`, `limit_reached` (`true` si llegó al tope, que la especificación no dice) y `contact_ids` (no
  descrito). La especificación no dice si el contacto ve algo: para marcar un mensaje como leído en WhatsApp, usa
  `POST /api/v1/contacts/{contact}/messages/{message}/read` (ver «Atender una conversación»).
- **Favorita, asignada o sin leer:** `PUT /api/v1/contacts/{contact}` acepta `favorite`, `active_conversation`,
  `adviser_id` y `manually_unread`, que la especificación no describe uno por uno. Manda solo el que la persona quiere
  cambiar y después léelo con `GET /api/v1/contacts/{contact}`.

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

### Ver los mensajes con un contacto

`GET /api/v1/contacts/{contactId}/messages` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `conversation.getLatestMessages`

**Para qué sirve:** Sirve para traer el historial de mensajes de un contacto y mantenerlo sincronizado en tu sistema, con paginación por cursor y `updated_since` para pedir solo lo nuevo.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `contactId` | path | string | sí |  |
| `cursor` | query | string | no |  |
| `updated_since` | query | string | no |  |
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<MessageResource> |  |
  | `data[].chat_id` | string |  |
  | `data[].contact_id` | string \| string ∈ {""} |  |
  | `data[].content` | array<any> \| object \| string |  |
  | `data[].device_id` | string \| string ∈ {""} |  |
  | `data[].error_code` | string |  |
  | `data[].file` | string |  |
  | `data[].forwarded` | integer |  |
  | `data[].group_id` | integer \| string ∈ {""} |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `msg_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].origin` | integer ∈ {0, 1, 2, 3} \| string ∈ {""} |  |
  | `data[].origin_id` | string \| null | Id opaco de lo que envió el mensaje, según `origin`: un flujo (`flw_`), una difusión (`bcs_`) o un agente de IA (`ast_`). Vacío o `null` si lo envió una persona. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].own` | integer |  |
  | `data[].reference_message` | string \| null |  |
  | `data[].reference_message_uid` | string \| null |  |
  | `data[].is_quotable` | boolean |  |
  | `data[].status` | integer ∈ {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10} \| null |  |
  | `data[].temporal_uuid` | string \| string ∈ {""} |  |
  | `data[].text` | string |  |
  | `data[].time` | string \| null |  |
  | `data[].type` | integer ∈ {0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24} \| null |  |
  | `data[].uid` | string |  |
  | `data[].info` | array<any> \| string ∈ {""} |  |
  | `data[].user_id` | string | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].deleted_at` | string \| null |  |
  | `data[].deleted_scope` | string \| null |  |
  | `data[].deleted_by` | integer \| null |  |
  | `data[].edited_at` | string \| null |  |
  | `data[].poll_results` | string |  |
  | `data[].event_rsvps` | string |  |
  | `data[].form_answers` | string |  |
  | `data[].reactions` | array<any> |  |
  | `data[].file_original_name` | string \| null |  |
  | `data[].client_reference` | string \| null |  |
  | `data[].scheduled` | boolean |  |
  | `data[].ai_assistant` | object |  |
  | `links` | object |  |
  | `links.first` | string \| null |  |
  | `links.last` | string \| null |  |
  | `links.prev` | string \| null |  |
  | `links.next` | string \| null |  |
  | `meta` | object |  |
  | `meta.path` | string |  |
  | `meta.per_page` | integer |  |
  | `meta.next_cursor` | string \| null |  |
  | `meta.prev_cursor` | string \| null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver tus conversaciones

`GET /api/v1/conversations` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `conversation.index`

**Para qué sirve:** Úsalo para construir tu propia bandeja de entrada o sincronizar conversaciones: filtra por número, asesor, etiquetas, etapa del kanban, no leídas o lead score, y trae solo lo nuevo con `updated_since`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `perName` | query | string | no |  |
| `contactId` | query | string | no |  |
| `cursor` | query | string | no |  |
| `updated_since` | query | string | no |  |
| `favorites` | query | boolean | no |  |
| `ownContacts` | query | boolean | no |  |
| `ownAndUnassigned` | query | boolean | no |  |
| `deviceId` | query | string | no |  |
| `advisorId` | query | string | no |  |
| `advisorIds` | query | string | no |  |
| `activeConversation` | query | boolean | no |  |
| `tags` | query | string | no |  |
| `kanbanSettingId` | query | string | no |  |
| `kanbanStageIds` | query | string | no |  |
| `unreadMessages` | query | boolean | no |  |
| `awaitingReply` | query | boolean | no |  |
| `onlyWithMac` | query | boolean | no |  |
| `paused` | query | string ∈ {"true", "false", "1", "0"} | no |  |
| `leadScoreCategories` | query | string \| null | no |  |
| `leadScoreMin` | query | integer | no |  |
| `leadScoreMax` | query | integer | no |  |
| `leadScoreDisqualified` | query | string \| null ∈ {"include", "exclude", "only", null} | no |  |
| `metaWindowOpen` | query | boolean | no |  |
| `metaWindowDeviceIds` | query | string \| null | no |  |
| `lastMessageDateFrom` | query | string (date) \| null | no |  |
| `lastMessageDateTo` | query | string (date) \| null | no |  |
| `timezone` | query | string \| null | no |  |
| `customFieldFilters` | query | string \| null | no |  |
| `perPage` | query | integer | no |  |
| `orderBy` | query | string ∈ {"asc", "desc"} | no |  |

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
  | `meta.path` | string |  |
  | `meta.per_page` | integer |  |
  | `meta.next_cursor` | string \| null |  |
  | `meta.prev_cursor` | string \| null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)
- `500` — Internal Server Error

### Contar tus conversaciones

`GET /api/v1/conversations/count/all` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `conversation.countAll`

**Para qué sirve:** Úsalo para obtener el total de conversaciones, como base para calcular la proporción de abiertas, cerradas o sin leer.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `advisorIds` | query | string | no |  |
| `favorites` | query | boolean | no |  |
| `ownAndUnassigned` | query | boolean | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `count` | integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Contar las conversaciones abiertas

`GET /api/v1/conversations/count/open` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `conversation.countOpen`

**Para qué sirve:** Úsalo para medir la carga de trabajo actual: cuántas conversaciones abiertas hay, en total o por asesor.

**Parámetros**

La misma tabla que en «Contar tus conversaciones», más arriba en este texto.

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `count` | integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Contar las conversaciones cerradas

`GET /api/v1/conversations/count/closed` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `conversation.countClosed`

**Para qué sirve:** Sirve para contar las conversaciones cerradas, por ejemplo para métricas de atención por asesor.

**Parámetros**

La misma tabla que en «Contar tus conversaciones», más arriba en este texto.

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `count` | null \| integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Contar las conversaciones sin leer

`GET /api/v1/conversations/count/unread` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `conversation.countUnread`

**Para qué sirve:** Sirve para mostrar un contador de conversaciones sin leer, por ejemplo en un badge o tablero, filtrable por asesores o favoritas.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `advisorIds` | query | string | no |  |
| `favorites` | query | boolean | no |  |
| `ownAndUnassigned` | query | boolean | no |  |
| `withMine` | query | boolean | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `count` | integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Marcar todas como leídas

`POST /api/v1/conversations/mark-all-read` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `conversation.markAllAsRead`

**Para qué sirve:** Sirve para poner en cero los no leídos de una vez, por ejemplo cuando ya atendiste por otro canal; se puede acotar por asesores o favoritas.

**Cuerpo** (`application/json`)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `advisorIds` | string | no |  |
| `favorites` | boolean | no |  |
| `ownAndUnassigned` | boolean | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `message` | "Todas las conversaciones han sido marcadas como leídas" |  |
  | `updated_count` | integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Marcar todas como no leídas

`POST /api/v1/conversations/mark-all-unread` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `conversation.markAllAsUnread`

**Para qué sirve:** Úsalo para volver a marcar como no leídas las conversaciones de un conjunto (por asesores o favoritas) y que el equipo las retome. Tiene un tope y la respuesta avisa si se alcanzó.

**Cuerpo** (`application/json`)

La misma tabla que en «Marcar todas como leídas», más arriba en este texto.

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `message` | "Todas las conversaciones elegibles fueron marcadas como no leídas" |  |
  | `marked_count` | integer |  |
  | `limit_reached` | boolean |  |
  | `contact_ids` | object |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

## Los eventos

Llegan por webhook. Cómo crear uno, cómo llega cada entrega, los reintentos, el permiso que pide cada evento y cómo verificar la firma (con funciones probadas en Node.js, Python y PHP): https://developers-portal.funnelchat.app/ia/lo-basico.md.

### `contact.created`

Se creó un contacto nuevo en la cuenta.

Se envía un evento por cada contacto nuevo, sea cual sea el canal: un mensaje entrante, la creación manual, una importación o la API. No se envía cuando el contacto ya existía y sólo se actualiza, ni para los contactos que la plataforma crea para sus propias notificaciones. En importaciones grandes el límite de volumen de la cuenta puede descartar parte de los eventos.

Ejemplo:

```json
{
  "id": "evt_000000000000000000000010",
  "type": "contact.created",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "contact": {
      "id": "ctc_ABViuUDF93I2VL1tInstRDG",
      "name": "Contacto de ejemplo",
      "phone": "+5491100000000",
      "email": "contacto@example.com"
    },
    "workspace_id": 37
  }
}
```

### `contact.updated`

Cambió el nombre, el email, el teléfono o el valor de un campo personalizado de un contacto.

Se envía cuando cambia el nombre, el email o el teléfono de un contacto que ya existía, o cuando se pone, cambia o quita el valor de uno de sus campos personalizados, venga del panel, de la API, de un flujo o de una importación. Varios cambios del mismo contacto en una misma operación llegan en un solo evento. `changed` dice qué cambió (`name`, `email`, `phone`, `custom_fields`); `contact` trae el estado después del cambio y `custom_fields`, sólo los campos que cambiaron, con su valor nuevo (`null` si se quitó). No se envía al crear un contacto (eso es `contact.created`), por etiquetas, por el estado de la conversación ni si el valor nuevo es igual al anterior; tampoco al borrar un campo personalizado de la cuenta. En importaciones grandes el límite de volumen de la cuenta puede descartar parte de los eventos.

Ejemplo:

```json
{
  "id": "evt_000000000000000000000017",
  "type": "contact.updated",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "contact": {
      "id": "ctc_ABViuUDF93I2VL1tInstRDG",
      "name": "Ana Pérez",
      "phone": "+5491100000000",
      "email": "ana@example.com"
    },
    "changed": [
      "email",
      "custom_fields"
    ],
    "custom_fields": [
      {
        "id": "fld_AGxYus0ZuS8ViUElnapfBA0",
        "name": "Plan",
        "value": "Pro"
      },
      {
        "id": "fld_AGqBOqs9iRgOq0FfRAR8DxC",
        "name": "Ciudad",
        "value": null
      }
    ],
    "workspace_id": 37
  }
}
```

### `conversation.assigned`

Una conversación quedó asignada a una persona del equipo o a un agente de IA.

Se envía cuando una conversación queda asignada a una persona del equipo (`assignee.type` = `human`) o a un agente de IA (`assignee.type` = `ai`), por cualquier camino. `assignee` trae el tipo y el nombre, nunca un identificador. No se envía al desasignar, ni cuando se vuelve a enviar el mismo asignado.

Ejemplo:

```json
{
  "id": "evt_000000000000000000000005",
  "type": "conversation.assigned",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "contact": {
      "id": "ctc_ABViuUDF93I2VL1tInstRDG",
      "name": "Contacto de ejemplo",
      "phone": "+5491100000000"
    },
    "assignee": {
      "type": "human",
      "name": "Agente de ejemplo"
    },
    "workspace_id": 37
  }
}
```

### `conversation.closed`

Una conversación pasó a cerrada.

Se envía cuando una conversación pasa de abierta a cerrada. No se envía si la conversación ya estaba cerrada ni cuando se reabre.

Ejemplo:

```json
{
  "id": "evt_000000000000000000000004",
  "type": "conversation.closed",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "contact": {
      "id": "ctc_ABViuUDF93I2VL1tInstRDG",
      "name": "Contacto de ejemplo",
      "phone": "+5491100000000"
    },
    "workspace_id": 37
  }
}
```

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
