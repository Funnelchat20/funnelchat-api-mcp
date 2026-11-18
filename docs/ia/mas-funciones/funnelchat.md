# Funciones de Funnelchat — API de Funnelchat: contexto para tu IA

> Copiado de /docs/mas-funciones/funnelchat/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Etiquetas

- **Ver tus etiquetas:** `GET /api/v1/tags` (la clave necesita **Contactos y conversaciones → Ver**). Filtra por `name`;
  con `withContactCount=true` cada etiqueta trae cuántos contactos la tienen (`contact_count`). Orden: `orderBy`
  (`name`, `created_at`, `updated_at`) y `orderByMethod` (`asc` o `desc`). Cada etiqueta trae `id`, `name`,
  `description`, `color`, `created_at`, `updated_at` y `contact_count`.
- **Listas por páginas:** las listas de esta página responden `{"data": [...], "links": {...}, "meta": {...}}`;
  `perPage` va de 1 a 100 (25 si no lo mandas). Para la página siguiente, pide la URL de `links.next` tal cual, hasta
  que sea `null`.
- **Crear:** `POST /api/v1/tags` con `name` (obligatorio, hasta 254 caracteres) y, si quieres, `description` (hasta
  1024) y `color` (hasta 191). La clave necesita **Contactos y conversaciones → Editar**. Responde la etiqueta. Antes
  de crearla, mira si ya existe una con ese nombre en la lista.
- **Ver una:** `GET /api/v1/tags/{tag}`, con `{tag}` su `id` (también acepta `withContactCount`).
- **Editar:** `PUT /api/v1/tags/{tag}` con `name` (obligatorio) y, si quieres, `description` y `color`. Si ya existe
  otra etiqueta con ese nombre, responde `400` (por ejemplo, «Ya existe un tag con este nombre.»). La especificación no
  describe el cuerpo de la respuesta: para ver cómo quedó, `GET /api/v1/tags/{tag}`.
- **Los contactos de una etiqueta:** `GET /api/v1/tags/{tag}/contacts`, por páginas. Orden: `orderBy` (`name`,
  `last_message_time`, `follow_up_date`) y `orderByMethod`. La especificación no describe la forma de cada elemento de
  `data`: lee lo que llega antes de depender de un campo. Para filtrar contactos por varias etiquetas a la vez, usa
  `GET /api/v1/contacts` con `tag_ids[]` y `tag_mode` (ver «Contactos y conversaciones»).
- **Las etiquetas de un contacto:** `GET /api/v1/contacts/{contact}/tags`, por páginas. Cada una trae `id`, `name`,
  `description`, `color` y `assigned_at` (cuándo se la pusieron), entre otros.

## Agregar y quitar etiquetas a contactos

- **Agregar:** `POST /api/v1/contacts/add-tags` con una **lista** (el cuerpo es un arreglo JSON, no un objeto) de hasta
  200 elementos `{"contactId": "ctc_ABViuUDF93I2VL1tInstRDG", "tag": {"id": "tag_AIJEDzSFQ6oDXbab3DubTEG"}}`: cada uno agrega una etiqueta a un contacto. Para varias
  etiquetas a un mismo contacto, un elemento por etiqueta. `tag.name` no hace falta: vale el nombre guardado de la
  etiqueta. La clave necesita **Contactos y conversaciones → Enviar**.
- **Agregar puede arrancar una automatización, como en el panel:** si la lista lleva **un solo elemento** y el contacto
  todavía no tenía esa etiqueta, arranca el flujo activo que empieza con «Tag agregado» de esa etiqueta (si hay más de
  uno, el creado primero), y ese flujo puede mandarle mensajes de WhatsApp al contacto. Con dos o más elementos, o con
  `?bulk=true` en la URL, las etiquetas se agregan igual y no arranca ningún flujo. Si la persona quiere etiquetar sin
  arrancar automatizaciones, aunque sea a un solo contacto, usa `?bulk=true`; si quiere que arranquen, una llamada por
  contacto y etiqueta. Si no sabes cuál quiere, pregúntale antes de agregar una sola etiqueta a un solo contacto.
- **Quitar:** `POST /api/v1/contacts/remove-tags` con la misma lista (`{"contactId": "ctc_ABViuUDF93I2VL1tInstRDG", "tag": {"id": "tag_AIJEDzSFQ6oDXbab3DubTEG"}}`, hasta
  200). La clave necesita **Contactos y conversaciones → Editar**. No arranca ningún flujo.
- **Las dos responden `200` sin cuerpo**, también cuando un elemento no hizo nada: el contacto ya tenía la etiqueta (al
  agregar) o no la tenía (al quitar), o el contacto o la etiqueta no existe, es de otra cuenta o está fuera del
  workspace de la clave (se ignora sin error). Para confirmar cómo quedó, lee `GET /api/v1/contacts/{contact}/tags`.
- Errores de las dos: `422` si el cuerpo no es una lista de elementos con `contactId` (`ctc_…`) y `tag.id` (`tag_…`), o tiene más
  de 200; `429` si hiciste demasiadas llamadas en un minuto (espera los segundos de `Retry-After`); `403` si a la clave
  le falta la casilla.

## Enterarte cuando un contacto recibe o pierde una etiqueta

- Crea un webhook con `POST /api/v1/webhooks` y `"events": ["contact.tag_added", "contact.tag_removed"]`. La clave
  necesita **Avisos (webhooks) → Administrar** y, por estos eventos, **Contactos y conversaciones → Ver**.
- `contact.tag_added` llega uno por cada contacto y etiqueta agregados, también en una llamada con muchos; no llega si
  el contacto ya tenía la etiqueta. `contact.tag_removed`, uno por cada contacto y etiqueta quitados; no llega si no la
  tenía, ni al borrar la etiqueta, al borrar o unir contactos ni al desvincular etiquetas de un tablero.
- Los dos traen `data.contact` (`id`, `name`, `phone`), `data.tag` (`id`, `name`) y `data.source`, de dónde vino:
  `manual`, `flow`, `bulk`, `import`, `sync`, `walink` o `ai` al agregar; `manual`, `flow`, `bulk` o `ai` al quitar. La
  especificación no dice qué `source` trae una llamada de la API: no dependas de eso para distinguir las tuyas.
- En operaciones en bloque grandes, el límite de volumen de la cuenta puede descartar parte de los eventos: para
  confirmar cómo quedó un contacto, lee `GET /api/v1/contacts/{contact}/tags`.

## Campos personalizados

- **Ver tus campos:** `GET /api/v1/custom-fields` (la clave necesita **Contactos y conversaciones → Ver**). Filtra por
  `name`, `description` y `type`; con `withContactCount=true` trae `contact_count`. Orden: `orderBy` (`name`,
  `created_at`, `updated_at`) y `orderByMethod`. Cada campo trae `id`, `name`, `type`, `description` y `created_at`.
- **Los tipos (`type`):** `0` texto (cualquier texto), `1` numérico (un número con punto decimal, sin separador de
  miles, con `-` adelante si es negativo: `"1500"`, `"99.90"`), `2` fecha (`AAAA-MM-DD`, una fecha que exista:
  `"2026-11-30"`), `3` URL (la dirección completa, con `https://` o `http://`) y `4` alfanumérico (pensado para códigos
  como `"AB1234"`; acepta cualquier texto). El tipo se elige al crear el campo y no se cambia. `GET /api/v1/custom-fields`
  filtra por `type`.
- **Crear:** `POST /api/v1/custom-fields` con `name` (obligatorio, hasta 254 caracteres), `type` (obligatorio, de `0`
  a `4`) y, si quieres, `description` (hasta 1000). La clave necesita **Contactos y conversaciones → Editar**. Elige el
  tipo según el dato: una fecha que vas a filtrar o comparar, `2`; un monto, `1`. Antes de crearlo, mira si ya existe
  uno con ese nombre.
- **Ver uno:** `GET /api/v1/custom-fields/{customField}`, con `{customField}` su `id`.
- **Editar:** `PUT /api/v1/custom-fields/{customField}` con `name` (hasta 254) o `description` (hasta 1000). El `type`
  no se cambia. Responde el campo.
- **Los valores de un contacto:** `GET /api/v1/contacts/{contact}/custom-fields`, por páginas; filtra por `name`. Cada
  uno trae `id` (el del campo), `name`, `type` y `value`. `GET /api/v1/contacts/{contact}` también trae los valores en
  `custom_fields`.

## Poner y quitar un valor

- **Poner:** `POST /api/v1/contacts/attach-custom-field` con una **lista** (el cuerpo es un arreglo JSON, no un objeto)
  de `{"customFieldId": "fld_AGxYus0ZuS8ViUElnapfBA0", "contactId": "ctc_ABViuUDF93I2VL1tInstRDG", "value": "2026-11-30"}`; los tres son obligatorios. Si el contacto ya
  tenía un valor en ese campo, se reemplaza. La clave necesita **Contactos y conversaciones → Editar**. Sirve para
  varios contactos y campos en una sola llamada. Para ponerlos al crear un contacto, `custom_fields` de crear o de
  crear o actualizar (ver «Contactos y conversaciones»).
- **`value` es siempre texto** (`"1500"`, no `1500`) y, con una clave, se valida contra el tipo del campo: uno
  numérico, de fecha o de URL solo acepta su formato (los de arriba). Texto y alfanumérico aceptan cualquier texto. Un
  valor que no puso una clave (el panel, un flujo, una importación) puede tener otro formato: no asumas el formato al
  leerlo.
- **La respuesta es `200` aunque un elemento falle:** trae una lista con un resultado por elemento, en el mismo orden,
  cada uno con `status` y `message`; uno rechazado no frena a los demás. `status` `201` es que quedó; `403`, que el
  campo o el contacto no es de la cuenta o está fuera del workspace de la clave; `422`, que `value` no cumple el
  formato del tipo del campo (`message` dice cuál espera). Revisa cada uno y dile a la persona cuáles no quedaron; no
  los reintentes iguales: corrige el valor.
- **Quitar:** `POST /api/v1/contacts/detach-custom-field` con una lista de `{"customFieldId": "fld_Ar7McDNiFfizqFzTybtrwHL", "contactId": "ctc_ABViuUDF93I2VL1tInstRDG"}`
  (los dos obligatorios). Responde `{"messages": [...]}`, una lista de textos con lo que hizo.
- Errores de las dos: `422` si el cuerpo no es válido (el detalle dice qué elemento); `403` si a la clave le falta la
  casilla.

## Borrar etiquetas y campos personalizados

- **Hazlo solo si la persona lo pide de forma explícita para eso; confírmale qué vas a borrar (nombre e id de cada
  etiqueta o campo) antes de llamar.** La especificación no dice si se puede deshacer ni qué pasa con los contactos que
  la tenían o tenían un valor en ese campo. Para decirle a cuántos afecta, pide `withContactCount=true` en
  `GET /api/v1/tags` o `GET /api/v1/custom-fields` (trae `contact_count`).
- **Etiquetas:** `POST /api/v1/tags/delete` con `{"tagIds": ["tag_AIJEDzSFQ6oDXbab3DubTEG"]}` (al menos una), con los `id` de
  `GET /api/v1/tags`.
- **Campos:** `POST /api/v1/custom-fields/delete` con `{"customFieldIds": ["fld_Ar7McDNiFfizqFzTybtrwHL"]}` (al menos uno), con los `id` de
  `GET /api/v1/custom-fields`.
- Las dos responden `200` sin un cuerpo descrito: para confirmar, vuelve a listar. `422` si el cuerpo no es válido.
- No llegan eventos por los contactos afectados: borrar una etiqueta no manda `contact.tag_removed`, y borrar un campo
  no manda `contact.updated`.

## Notas de un contacto

- `{contact}` es el `id` del contacto; `{note}`, el `id` de la nota (de `GET /api/v1/contacts/{contact}/notes` o de la
  respuesta al agregarla). La lista viene por páginas (`links.next`) y filtra con `search`.
- Cada nota trae `id`, `contact_id`, `author_id` (puede ser `null`), `author_name`, `body`, `created_at` y
  `updated_at`. La especificación no dice qué autor queda en una nota creada con una clave.
- No hay llamada para editar una nota. No la reemplaces borrando y agregando otra sin que la persona lo pida.
- **Borrar** (`DELETE /api/v1/contacts/{contact}/notes/{note}`, responde `204`): hazlo solo si la persona lo pide de
  forma explícita para eso; confírmale qué vas a borrar (el texto de la nota y su id) antes de llamar. La
  especificación no dice si se puede recuperar.
- No confundas estas notas con el campo `notes` del contacto (`PUT /api/v1/contacts/{contact}`): la especificación no
  los relaciona. Si la persona dice «agrega una nota», usa esta lista; si quiere cambiar «las notas de la ficha»,
  pregúntale cuál de los dos.

## Tableros y etapas

- `{kanbanSetting}` es el `id` del tablero (`GET /api/v1/kanban-settings`); `stage_id` y `{stage}`, el `id` de una etapa
  **de ese tablero**. Las etapas vienen siempre en `stages` de `GET /api/v1/kanban-settings/{kanbanSetting}`; en la
  lista de tableros `stages` puede no venir. Si la persona nombra un tablero o una etapa, compara por `name`; si no
  coincide uno solo, pregúntale.
- Usa tableros con `mode` `stages` para mover y sacar contactos y para el evento: la especificación no describe qué
  hace mover en uno con `mode` `tags`.
- **La etapa actual de un contacto:** `GET /api/v1/contacts/{contact}/kanban-stages`, un elemento por tablero con
  `kanban_setting_id`, `kanban_name` y `current_stage_id`. Son los mismos ids opacos de los tableros (`knb_…`) y de
  las etapas (`stg_…`): compáralos tal cual. `stages` (texto) no está descrito. No muevas a un contacto que ya está
  en la etapa pedida.
- **Cuáles de unos contactos están en un tablero:** `GET /api/v1/kanban-settings/{kanbanSetting}/members` con
  `contact_ids[]`; responde `member_contact_ids`, los de esa lista que están en el tablero. Habla de contactos, no de
  personas del equipo.
- **Los contactos de una etapa:** `GET /api/v1/kanban-settings/{kanbanSetting}/stages/{stage}/contacts`, por páginas
  (`links.next`). La especificación no describe los campos de cada elemento de `data`: lee los que llegan.
- **Crear un tablero:** `POST /api/v1/kanban-settings` con `name` y `mode`. Por etapas, `stages`
  (`[{"name": "Nuevo"}, …]`); por etiquetas, `structure` (`[{"tag_id": "tag_AIJEDzSFQ6oDXbab3DubTEG", "position": 0}, …]`, con `tag_id` de
  `GET /api/v1/tags`). Hasta 15. Antes, mira si ya hay uno con ese nombre. Editar (`PUT`) no recibe `stages`: las
  etapas se crean, renombran, ordenan y borran con sus llamadas.
- **Etapas:** crear con `name` y `after_stage_id` (la especificación no dice dónde queda sin él: mándalo). Ordenar con
  `stage_ids`, sin repetir; la especificación no dice si tienen que ir todas: manda todas, en el orden nuevo.
- **Mover:** `move-contact` con `contact_id` y `stage_id`; `bulk-move` con `contact_ids` (1 a 200) y `stage_id`.
  Responden `200`. Mover uno no describe cuerpo; en bloque trae `excluded_inactive`, un conteo que la especificación no
  explica: si no es `0`, revisa con la etapa de cada contacto quién no se movió. Para confirmar, vuelve a leer.
- **Sacar, borrar una etapa y borrar un tablero:** hazlo solo si la persona lo pide de forma explícita para eso;
  confírmale qué vas a borrar (nombre e id) antes de llamar. Sacar: `remove-contact` (`contact_id`) o `bulk-remove`
  (`contact_ids`, 1 a 200). Borrar una etapa: con `?reassign_to_stage_id=` la etapa a la que pasan sus contactos
  (pregúntale a la persona cuál; sin él, la especificación no dice qué pasa). Borrar un tablero: la especificación no
  dice qué pasa con sus contactos ni si se puede recuperar.

## Enterarte cuando un contacto cambia de etapa

- Crea un webhook con `POST /api/v1/webhooks` y `"events": ["contact.stage_changed"]`. La clave necesita 
  **Avisos (webhooks) → Administrar** y, por este evento, **Contactos y conversaciones → Ver**.
- Trae `data.contact` (`id`, `name`, `phone`), `data.board` (`id`, `name`), `data.kind` y `data.from_stage` /
  `data.to_stage` (`id`, `name`, `position`): `entry` (entró al tablero; `from_stage` en `null`), `move`, `exit` (salió;
  `to_stage` en `null`) o `stage_deleted` (se reubicó porque su etapa se borró; el nombre de la borrada llega en
  `null`).
- Solo en tableros por etapas; no llega si el contacto queda en la etapa en la que estaba. No dice quién lo movió, y la
  especificación no excluye los movimientos de tu propia clave: no los trates como cambios nuevos. Descarta los
  repetidos por el `id` del sobre.

## Tickets

- `{id}` es el `id` del ticket (el que devuelve crear, o el de la lista). `contactId` es el `id` del contacto. `userId`
  es una persona del equipo: la especificación no dice de dónde sale; el candidato es el `id` de «Ver tu equipo»
  (`GET /api/v1/agents`), pero no está confirmado. Si la persona no te dice a quién, pregúntale; no elijas por ella.
- Un ticket trae `id`, `user_id`, `contact_id`, `title`, `description`, `deadline`, `created_at`, `updated_at` y
  `actor_user_id`. **No trae un campo de estado:** con `deadline` en `null` está abierto; con un número, cerrado, y ese
  número son los minutos que estuvo abierto (al reabrirlo vuelve a `null`).
- **`status` es solo un filtro de `GET /api/v1/tickets`:** `1`, los tickets abiertos; `2`, los cerrados; `0` —el que
  se usa si no lo mandas—, los contactos que todavía no tienen un ticket. Para listar tickets, manda siempre `status=1`
  o `status=2`. La especificación no describe la forma de los elementos de la lista: lee los que llegan.
- **Editar** (`PUT /api/v1/tickets/{id}`) pide `title` y `description`, los dos: si la persona cambia solo uno, lee el
  ticket antes y manda el otro como estaba.
- **Asignar** (`POST /api/v1/tickets/assign`, con `ticketId` y `userId`), **cerrar** y **reabrir** responden `200` con
  un texto: decide por el código, no por el texto. Cierra o reabre solo cuando la persona lo pide para ese ticket.
- Crear responde `404` («Contacto no encontrado.») si el contacto no es de la cuenta. Ver un ticket no declara `404`:
  decide por el código que llegue.
- No hay llamada para borrar un ticket.

## Respuestas rápidas

- `{quickReply}` es el `id` de `GET /api/v1/quick-replies` (filtra con `search`, por páginas con `links.next`).
- **No hay llamada para mandar una respuesta rápida:** si la persona quiere usar una con un contacto, manda su texto
  (`message`) como un mensaje normal (ver «Mandar mensajes»).
- **`type` y `visibility` son obligatorios** al crear y al editar. `type` es el tipo de mensaje: `0` texto, `1`
  imagen, `2` video, `3` documento, `6` audio (la API acepta hasta `24`, pero el panel usa solo esos cinco, según el
  archivo que lleva). `visibility`: `1` la ven el titular y todos los agentes; `2` solo los agentes de `agent_ids` (si
  la crea la clave de un agente sin `agent_ids`, queda ese agente); `3` solo la cuenta principal. Ojo con la lista:
  un agente ve las `1` y las `2` donde está; el titular ve las `1` y las `3`, **no las `2`**. Si la persona no
  encuentra una, puede ser eso.
- No se describe qué va en `file` ni de dónde salen los `agent_ids` (el candidato es «Ver tu equipo»,
  `GET /api/v1/agents`, sin confirmar): si hacen falta, pregúntale a la persona.
- **Editar** (`PUT /api/v1/quick-replies/{quickReply}`) pide `name`, `type` y `visibility`: lee la respuesta rápida
  antes y manda los que no cambian como estaban.
- **Borrar** (`DELETE`, responde `204`): hazlo solo si la persona lo pide de forma explícita para eso; confírmale qué
  vas a borrar (nombre e id) antes de llamar. La especificación no dice si se puede recuperar.

## Automatizaciones de un contacto: lo que se corrió y en qué flujos está

Estas cuatro llamadas leen: no arrancan, no cambian ni frenan ninguna automatización. La clave necesita
**Contactos y conversaciones → Ver**. Cancelar una ejecución y pausar a un contacto sí cambian algo: ver «Cancelar una
ejecución y pausar las automatizaciones de un contacto», abajo.

- **Listas por páginas:** responden `{"data": [...], "links": {...}, "meta": {...}}`; `perPage` va de 1 a 100 (25 si
  no lo mandas). Para la página siguiente, pide la URL de `links.next` tal cual, hasta que sea `null`.
- **El historial de un contacto:** `GET /api/v1/contact-flows/{contactId}`, con `{contactId}` el `id` del contacto.
  Cada elemento es una ejecución de un flujo sobre ese contacto. Filtros: `status_group` (`en_curso`, `completado`,
  `invalidado` o `cancelado`), `date_from` y `date_to` (fecha y hora) y `search` (texto, hasta 255 caracteres). La
  especificación no describe los campos de cada ejecución: lee los que llegan antes de depender de uno. `404` si la
  clave no encuentra el contacto.
- **En qué flujos está:** `GET /api/v1/contacts/{contact}/flows`, un elemento por flujo con `id`, `name`, `running`
  (`true` si alguna ejecución sigue corriendo), `created_at` y `last_run_at`. Para saber si un contacto está ahora
  dentro de una automatización, mira `running`.
- **Tus flujos:** `GET /api/v1/flows`. Filtros: `name`, `status` (`active` o `inactive`), `folder_id`, `trigger_type`,
  `device_ids[]`, y `date_from` y `date_to` con `date_field` (`created_at` o `updated_at`). Orden: `orderBy` (`name`,
  `created_at`, `updated_at`) y `orderByMethod` (`asc` o `desc`). Cada flujo trae su `id` y su `name`, entre otros.
- **Los contactos de un flujo:** `GET /api/v1/flows/{flow}/flow-contacts`, con `{flow}` el `id` del flujo: las
  ejecuciones de ese flujo, con los mismos filtros que el historial de un contacto (`status_group`, `date_from`,
  `date_to`, `search`). Con `status_group=en_curso`, las que siguen corriendo. Tampoco describe los campos de cada
  elemento.
- Para encontrar un flujo por su nombre, compara el `name` de la lista; si no coincide ninguno o coincide más de uno,
  pregúntale a la persona.

## Enterarte cuando un flujo termina o falla

- Crea un webhook con `POST /api/v1/webhooks` y `"events": ["flow.completed", "flow.failed"]`. La clave necesita
  **Avisos (webhooks) → Administrar** y, por estos eventos, **Contactos y conversaciones → Ver**.
- `flow.completed`: una ejecución terminó bien. Llega una sola vez por ejecución; no llega si se cortó, se canceló,
  quedó bloqueada o falló.
- `flow.failed`: una ejecución terminó por un error. Llega una sola vez por ejecución, con `data.reason`:
  `node_missing` (el paso a ejecutar ya no existe), `unknown_node_type` (un paso de un tipo no reconocido),
  `missing_subflow` (el flujo que debía correr dentro de otro ya no existe), `malformed_node` (un paso con la
  configuración dañada), `loop_detected` (la ejecución dio vueltas sin esperar nada) o `execution_error` (un error
  inesperado). No llega si se canceló, quedó bloqueada o se cortó porque se editó el flujo o se unieron contactos.
- Los dos traen `data.flow` (`id`, `name`), `data.contact` (`id`, `name`, `phone`; `null` si la ejecución no tiene un
  contacto) y `data.workspace_id`. Un flujo muy usado puede mandar muchos eventos seguidos: responde rápido con un
  `2xx` y procesa después.
- **No hay evento cuando un contacto entra a un flujo, ni cuando se cancela o se corta una ejecución.** Si la persona
  necesita saberlo, consulta el historial del contacto (`status_group`) cuando lo necesite; no lo hagas en un bucle.

## Un flujo por dentro: su configuración, sus pasos y quién está en él

- `{flow}` es el `id` de un flujo de `GET /api/v1/flows`. Todas piden **Contactos y conversaciones → Ver** y solo leen.
- **Ver un flujo:** `GET /api/v1/flows/{flow}` trae el flujo con su carpeta (`folder`). Entre sus campos están
  `enable`, `valid`, `executions`, `trigger_type`, `trigger_values`, `trigger_device_ids`, `first_node_uuid` y
  `nodes_count`; la especificación no los describe uno por uno ni enumera sus valores: léelos tal como llegan y no le
  expliques a la persona un valor que no está descrito. `404` si la clave no encuentra el flujo.
- **Los pasos:** `GET /api/v1/flows/{flow}/nodes`, por páginas (`perPage` de 1 a 100, `links.next`). Cada paso trae
  `uuid`, `flow_id`, `type` (un número), `action`, `value` (su configuración: texto, una lista o `null`) y
  `next_uuid`. Por los nombres, el primero es el de `first_node_uuid` del flujo y cada uno apunta al siguiente con
  `next_uuid`; la especificación no describe los tipos, las acciones ni la forma de `value`: no lo interpretes ni
  completes lo que no venga.
- **Contar los contactos en curso:** `GET /api/v1/flows/{flow}/active-contacts` → `{"active_contacts_count": n}`.
  Acepta `payment_event_type` (`approved`, `pending`, `rejected`, `cancelled`, `refunded`, `chargeback`,
  `abandoned_cart`), sin descripción todavía en la especificación. **Verlos:**
  `GET /api/v1/flows/{flow}/flow-contacts?status_group=en_curso`.
- **Contar y ver los pausados:** `GET /api/v1/flows/{flow}/paused-contacts` → `{"paused_contacts_count": n}`, y
  `GET /api/v1/flows/{flow}/paused-contacts-list`, por páginas, con `search`. La especificación no dice qué cuenta como
  contacto pausado en un flujo ni describe los campos de cada elemento.

## Cancelar una ejecución y pausar las automatizaciones de un contacto

- Las dos cambian algo y piden **Contactos y conversaciones → Editar**. Hazlo solo si la persona lo pide de forma
  explícita para eso; confírmale qué vas a cancelar o pausar (el flujo y el contacto, con su nombre e id) antes de
  llamar. Ninguna manda un evento.
- **Cancelar:** `PUT /api/v1/contact-flows/{contactFlowId}/cancel`, sin cuerpo, con `{contactFlowId}` el id de una
  ejecución en curso: el `id` de cada elemento de `GET /api/v1/contact-flows/{contactId}?status_group=en_curso` o el
  `contact_flow_id` de cada elemento de `GET /api/v1/flows/{flow}/flow-contacts?status_group=en_curso`. Responde `200`
  con `contact_flow` (`id` y `status`, un número que la especificación no describe). Solo actúa sobre una ejecución en
  curso: si ya terminó o no existe, `422` con `flow_cancel_not_allowed` («No se puede cancelar esta automatización.
  Puede que ya haya finalizado o no exista.»): no cambió nada; no reintentes. Para confirmar, mira el historial del
  contacto con `status_group=cancelado`.
- **Pausar:** `POST /api/v1/contacts/{contact}/pause`, sin cuerpo, con `{contact}` el `id` del contacto. Responde el
  contacto (la forma de `GET /api/v1/contacts/{contact}`), con `paused_at`. **Una pausa no vence ni se levanta sola**,
  y la API no tiene una llamada para reanudarla: antes de pausar, díselo a la persona. Llámala una sola vez. Para encontrar contactos pausados: `only_paused` en `GET /api/v1/contacts`
  o `paused` en `GET /api/v1/conversations`.

## Carpetas de flujos

- **Ver:** `GET /api/v1/folders`, por páginas (`perPage` de 1 a 100, `links.next` hasta `null`), con el filtro `name`.
  Cada carpeta trae `id`, `name` y `parent_id` y, si vienen, `children` (sus subcarpetas, con la misma forma) y
  `flows_count`. `GET /api/v1/folders/{folder}` trae una, siempre con `children`. Las respuestas declaran `id` y
  `parent_id` como texto; en la ruta, en `folder_id` y en los cuerpos van como número.
- **Crear:** `POST /api/v1/folders` con `name` (obligatorio, hasta 255 caracteres) y, para una subcarpeta, `parent_id`
  (el `id` de la carpeta de arriba). Responde `200` con la carpeta. Antes de crearla, mira en la lista si ya existe una
  con ese nombre.
- **Editar:** `PUT /api/v1/folders/{folder}` con `name` o `parent_id` (para moverla dentro de otra; la especificación
  no dice qué hace `null`). La respuesta no está descrita: para ver cómo quedó, `GET /api/v1/folders/{folder}`.
- **Borrar:** `DELETE /api/v1/folders/{folder}`. Hazlo solo si la persona lo pide de forma explícita para eso;
  confírmale qué vas a borrar (nombre e id) antes de llamar, y dile cuántos flujos tiene (`flows_count`) y si tiene
  subcarpetas: la especificación no dice qué pasa con ellos ni si se puede deshacer.
- **Los flujos de una carpeta:** `GET /api/v1/flows?folder_id=…`; `GET /api/v1/flows/{flow}` trae la carpeta del flujo
  (`folder`). Ninguna de estas llamadas mueve un flujo de carpeta: si la persona lo pide, díselo.
- `404` si la carpeta no existe o la clave no la encuentra; `422` si un dato no es válido.

## Difusiones: verlas, su audiencia y sus resultados

- **Por la API no se crea, no se lanza, no se pausa ni se reanuda una difusión:** no hay llamada para eso. Si la persona
  lo pide, díselo; no lo reemplaces mandando el mismo mensaje contacto por contacto.
- `{broadcast}` es el `id` de `GET /api/v1/broadcasts` (o el `data.broadcast.id` de los eventos). Para encontrar una por
  nombre, filtra con `name` y compara: si no queda una sola, pregúntale a la persona.
- **El estado de una difusión** (`status`, y el filtro `status[]` de la lista): `0` pendiente (también una programada,
  con `send_at` en el futuro), `1` saliendo, `6` terminada con fallos parciales (así queda una cancelada) y `9`
  pausada. Los demás números no están descritos: no los traduzcas. `paused_at`, `pause_reason`, `stop_reason` y
  `progress` de la lista tampoco: léelos tal cual.
- **Los mensajes de una difusión:** `GET /api/v1/broadcasts/{broadcast}/messages`. **Para filtrar por resultado, usa
  `tab`:** `all`, `delivered`, `read`, `replied`, `failed` o `skipped`; `tab` manda sobre `status[]`. `status[]` es un
  filtro anterior (con los valores del estado de un mensaje: `0` enviado, `1` recibido, `2` leído, `3` error, `4` en
  cola, `5` borrado, `6` número desconectado, `7` reproducido, `8` desconocido, `9` fallido, `10` entregado) que además
  devuelve omitidos: no filtres con él. La especificación lo marca obligatorio: mándalo con los once valores
  (`status[]=0` … `status[]=10`) y filtra con `tab`.
- **La audiencia:** `POST /api/v1/broadcasts/contacts` (los contactos, por páginas) y
  `POST /api/v1/broadcasts/contacts-count` (el conteo) toman los mismos filtros en el cuerpo y piden **Contactos y
  conversaciones → Editar**: con una clave de solo Ver responden `403`. `kanban_setting_id` y `kanban_stage_ids` salen
  de «Tableros»; las categorías de puntaje son `hot`, `warm`, `cold` e `insufficient_data`. `tags`, `some_tags` y
  `exclude_tags` son listas de texto: la especificación no dice si van ids o nombres de etiqueta, ni en qué se
  diferencian `tags` y `some_tags`; tampoco el formato de `countries`. Si no tienes el valor exacto, pregúntale a la
  persona.
- **Página siguiente de un listado por `POST`:** haz `POST` a la URL de `links.next` con el mismo cuerpo (la URL lleva
  solo `perPage` y `page`), hasta que sea `null`. Usa `perPage` en la URL y no mandes `per_page` en el cuerpo con otro
  valor (`422`).
- El conteo responde `contactsCount`, `unreachableCount`, `pausedCount`, `optedOutCount`, `hardBouncedCount` y, a
  veces, `blockedCount`. La especificación no describe qué cuenta cada uno ni si se superponen: muéstraselos a la persona
  con su nombre, sin sumarlos ni restarlos.
- **Resultados:** las estadísticas traen los conteos en `statistics` (`skipped_by_reason`: omitidos por motivo) y los
  clics por botón en `button_interactions` (`button_index`, `clicks_count`). El costo trae `estimate` (lo estimado) y
  `computed` (lo calculado de lo que salió), cada uno con `per_market`, y `is_partial`: si es `true`, no lo presentes
  como final. La especificación declara `computed.sent`, `billed`, `free`, `pending_price` y `no_data` como siempre
  `0`: lee el valor que llega. Los montos van en la moneda de `currency`. `tiers`, en los tramos de costo, no está
  descrito.
- Los contactos de una difusión (`GET /api/v1/broadcasts/{broadcast}/contacts`) no tienen sus campos descritos. Para el
  resultado con cada contacto, usa sus mensajes: `message_status`, `message_info` (`error_code`, `error`,
  `error_category`, `error_source`: `meta` o `internal`), `skip_reason`, `recipient_state` y `sent_at`.

## Cancelar, borrar y carpetas

- Cancelar, borrar una difusión y borrar una carpeta: hazlo solo si la persona lo pide de forma explícita para eso;
  confírmale qué vas a borrar (nombre e id) antes de llamar. La especificación no dice si se puede recuperar.
- **Cancelar:** `POST /api/v1/broadcasts/{broadcast}/cancel`, sin cuerpo. Solo con una difusión saliendo (`status`
  `1`) o pausada (`9`): la cierra para siempre como terminada con fallos parciales (`6`) y llega `broadcast.finished`
  con `reason` `cancelled`. En cualquier otro estado, `409` con `error_code` `smart_send_already_transitioned`, y no
  cambia nada: no reintentes. **Una programada no se cancela:** se borra.
- **Borrar:** `DELETE /api/v1/broadcasts/{broadcast}` responde `204`. Sirve para una programada mientras su `send_at`
  sea futuro. `422` con `error_code` `broadcast_delete_not_allowed`: ya se envió o está saliendo, y no se borra. Una
  pausada se cierra cancelándola.
- **Carpetas:** `folder_id` (en la lista de difusiones y al mover) es el `id` de `GET /api/v1/broadcasts/folders`.
  Mover lleva hasta 100 `broadcast_ids` y responde `moved` (un número): compáralo con cuántas mandaste. `folder_id`
  acepta `null`, pero la especificación no dice qué hace con eso. Al borrar una carpeta, no dice qué pasa con sus
  difusiones.

## Enterarte cuando una difusión termina o se pausa

- Crea un webhook con `POST /api/v1/webhooks` y `"events": ["broadcast.finished", "broadcast.paused"]`. La clave
  necesita **Avisos (webhooks) → Administrar** y, por estos eventos, **Contactos y conversaciones → Ver**.
- `broadcast.finished`, una sola vez por difusión: `data.status` (`success`, `failed` o `partially_failed`),
  `data.reason` (`completed`, `cancelled`, `template_rejected`, `approval_expired`, `mac_lockout`,
  `mac_check_unavailable`, `no_recipients` o `error`) y `data.totals` (`processed`, `failed`, `skipped_unreachable`;
  en `0` si terminó antes de mandar).
- `broadcast.paused`: `data.reason` es `quality_degraded`, `quality_unreadable`, `template_unavailable` (con
  `data.template`: el nombre de la plantilla y su estado en Meta), `payment_issue` o `rejection_rate` (con
  `data.rejection`: `codes`, `rates`, `attempts`, `window_hours`). `quality` y `quality_baseline` son `GREEN`, `YELLOW`,
  `RED` o `null` (siempre `null` sin envío inteligente). Las pausas por calidad, plantilla y rechazos son solo de
  difusiones con envío inteligente; `payment_issue`, de cualquiera. Con `rejection_rate` el número queda frenado (7 días
  por defecto): no crea, ejecuta ni reanuda difusiones ni manda plantillas a quien no le escribió en las últimas 24
  horas, y solo soporte lo levanta antes.
- Una difusión pausada no se reanuda por la API: si la persona quiere cerrarla, cancélala con su confirmación.
- El mismo evento puede llegar más de una vez: descarta los repetidos por el `id` del sobre.

## Campañas de grupos: solo lectura

- Las trece llamadas leen y piden **Grupos y campañas → Ver**. Por la API no se crea, cambia, activa ni pausa una
  campaña, un pipeline ni un plan, ni se suma un grupo a una campaña: si la persona lo pide, díselo.
- **`{campaign}` es el `id` (`cmp_…`) de la campaña** en «Ver tus campañas», no su `uuid`. Los eventos traen
  `campaign.uuid`: para relacionar un evento con una campaña, compáralo con el `uuid` de la lista.
- **Listas por páginas:** casi todas traen `data`, `links` y `meta`, con `perPage` de 1 a 100 (25 si no lo mandas);
  pide la URL de `links.next` tal cual, hasta que sea `null`. Excepciones: los pipelines y los planes usan `page` y
  `per_page` (con guion bajo) y traen solo `meta`: pide `page` 1, 2, … hasta `meta.last_page`; «Ver los grupos que
  puedes sumar a una campaña» usa `page` y `pageSize`; «Ver las acciones de una campaña» viene de a 15 (fijo), con
  `page`.
- **Tus campañas:** `GET /api/v1/campaigns`, con `name`; orden `orderBy` (`created_at`, `id`, `name`, `updated_at`) y
  `orderByMethod`. No mandes `sortBy`: con un valor que no acepta, responde `400 INVALID_SORT`. Cada una trae `id`,
  `uuid`, `name`, `type`, `is_active`, `groups`, `total_clicks`, `total_in` y `deviceId` (`null` si el número no es
  del workspace de la clave), entre otros; `api_open_groups` y `api_policy` solo en las de tipo Grupo API.
- **Una campaña:** `GET /api/v1/campaigns/{campaign}`: su configuración (`redirect_url`, `traffic_distribution_type`,
  `clicks_limit`, `participants_limit`, `auto_create_groups`, `group_creation_suspended`, `members_can_send_messages`,
  `moderation`…) y totales (`total_participants`, `total_in_counter`, `total_out_counter`). Con una clave, los totales
  cuentan solo los grupos del workspace de la clave. `404` si no es de la cuenta.
- **La tasa de lectura** de una campaña o de un grupo es solo del panel de Funnelchat: con una clave no viene, ni en
  las campañas ni en sus grupos. Si la persona la pide, díselo; no la calcules por tu cuenta.
- **Sus condiciones:** `GET /api/v1/campaigns/{campaign}/conditionals`: una lista con `type`, `conditions`,
  `action_type`, `redirect_url`, `redirect_group_id`, `redirect_group_name`, `is_active` y `order`. La especificación no
  describe sus valores: muéstralos como llegan, sin interpretarlos.
- **Sus grupos:** `GET /api/v1/campaigns/{campaign}/groups`, con `name`, `deviceId`, `status`, `origin` (`0` o `1`),
  `adminConnection` (`1`, `2` o `3`) y `adminPhone` (la especificación no dice qué es cada valor). Cada grupo trae lo
  mismo que en «Ver los grupos de tu cuenta», con su `uid` para las acciones de grupo.
- **Los grupos que se le pueden sumar:** `GET /api/v1/campaigns/{campaign}/available-groups`, con `device_id` y `type`
  (`groups`, `ad-groups` o `channels`), los dos obligatorios. Cada uno trae `uid`, `name`, `description`, `status` y
  `campaign_id`.
- **Entradas y salidas de toda la campaña:** `GET /api/v1/campaigns/{campaign}/participant-events`, con los mismos
  filtros y campos que las de un grupo (ver «Grupos y sus acciones»).
- **Pipelines:** `GET /api/v1/campaigns/{campaign}/pipelines`, con `status` (`scheduled`, `running`, `completed`,
  `failed` o `cancelled`) y `action_type`. Cada uno trae `id`, `pipeline_id`, `name` y `summary` (`total_actions`,
  `status_counts` por estado, `progress_percentage`). **`{pipeline}` es su `id` (`pip_…`), no su `pipeline_id`:**
  `GET /api/v1/campaigns/{campaign}/pipelines/{pipeline}` suma `scheduled_at`, `completed_at` y `actions` (la
  especificación no describe cada acción).
- **Planes de operación:** `GET /api/v1/campaigns/{campaign}/operation-plans/config` (los valores por defecto y los
  límites: `default_daily_cap`, `daily_cap_max`, `min_spacing_minutes`, `default_window_start`, `default_window_end`,
  `weekends_enabled`…), la lista `GET /api/v1/campaigns/{campaign}/operation-plans` y uno,
  `GET /api/v1/campaigns/{campaign}/operation-plans/{plan}`, con `{plan}` su `id`. Su `status` es `scheduled` (recién
  confirmado), `in_progress`, `completed`, `partially_failed` o `cancelled`.
- **Las acciones de una campaña:** `GET /api/v1/campaigns/{campaign}/actions`: cada una con `action`, `field`,
  `old_value`, `new_value`, `status` (un número), `tries`, `completed_at` y `subActions`. De `status`, la especificación
  describe solo `11` (se pidió hacer administradora a la persona y falta la confirmación de WhatsApp) y `12` (una
  acción de un plan que no se ejecutó a propósito; es definitivo y reintentar no la ejecuta). En qué grupos se aplicó
  una: `GET /api/v1/campaigns/{campaign}/actions/{action}/groups`, con `{action}` su `id`; filtra por `name`.
- **Eventos** (webhook con `POST /api/v1/webhooks`; la clave necesita **Avisos (webhooks) → Administrar** y
  **Grupos y campañas → Ver**): `campaign.status_changed` (una campaña se activó o se pausó: `from` y `to`),
  `campaign.no_groups_available` (no tiene grupos a los que mandar a quien entra por su link: `reason`) y
  `pipeline.finished` (terminó un pipeline: `outcome`, `actions` con `total`, `succeeded`, `failed`, `skipped` y
  `cancelled`, e `idempotency_key`, que siempre viene y es `null` si el pipeline se armó desde el panel). La especificación no dice si `pipeline.uuid` es el `pipeline_id` de
  la lista: compáralo antes de depender de eso.

## Envíos programados: solo lectura

- Las nueve llamadas leen y piden **Grupos y campañas → Ver**. **No hay llamada para crear, editar ni cancelar un
  envío programado:** si la persona lo pide, díselo. Para mandarle un mensaje a un grupo ahora, «Mandar un mensaje a un
  grupo» (ver «Grupos»).
- **Dos identificadores.** `{scheduledMessage}`, en la ruta, es el `id` del envío en «Ver tus envíos programados»: un
  número, aunque la especificación declare la ruta como uuid. **Los eventos `scheduled_message.*` traen
  `scheduled_message.uuid`**, que es el `uuid` que trae cada envío en sus respuestas (`null` solo en un envío creado
  antes del 30-09-2026 que todavía no generó ningún evento). Para ir de un evento a su envío, recorre
  `GET /api/v1/scheduled-messages` (la lista no filtra por `uuid`) hasta el que tiene ese `uuid` y usa su `id`; no
  pongas el `uuid` en la ruta.
- **Tus envíos:** `GET /api/v1/scheduled-messages`, por páginas (`perPage` de 1 a 100; sigue `links.next`). Filtra por
  `name`, `status` (de `0` a `8`; la especificación no dice qué es cada uno), `folder_id`, `unclassified` (los que no
  están en una carpeta) y `only_needs_connection` (`true`: los pendientes o en curso con grupos sin un número conectado
  que pueda mandar). Orden: `orderBy` (`created_at`, `id`, `name`, `updated_at`) y `orderByMethod`. Cada uno trae
  `id`, `uuid`, `send_at`, `status`, `is_draft`, `type`, `folder_id`, `campaign_ids` y `recurrence` (`enabled` y, si
  se repite, `frequency`, `interval`, `end_type`…). En la lista, `blocked_by_plan_limit` es siempre `false`: se
  calcula solo en el detalle.
- **Un envío:** `GET /api/v1/scheduled-messages/{scheduledMessage}`: `messages` (cada uno con `type`, `value`,
  `metrics`, `reactions`, `votes` y `event_responses`), `audience`, `total_readed`, `total_played`, `link_clicks`,
  `shipping_speed`, `folder` y `blocked_by_plan_limit` (`true` si la última vez no salió porque se alcanzó el límite
  de envíos del plan).
- **Sus grupos:** `GET /api/v1/scheduled-messages/{scheduledMessage}/groups`, de a 3 por página (fijo), con `page`;
  filtra por `name` y `status`. Su paginación es otra: `current_page`, `last_page` y `next_page_url` en la raíz. La
  especificación no describe cada grupo de `data`: lee lo que llega.
- **Cómo salió en cada grupo:** `GET /api/v1/scheduled-messages/{scheduledMessage}/group-messages`, siempre por
  páginas (`perPage` de 1 a 100, `links.next`). Filtra por `name`, `status` (un número que la especificación no
  describe) y `edit_status`; orden `orderBy` (`group_message_template.id`, `group_message_template.status`,
  `groups.name`, `group_message_template.created_at`) y `orderByMethod`. Sin `run`, el último resultado de cada grupo;
  con `run` (una fecha `AAAA-MM-DD`, en la zona horaria de la cuenta, de las que da `runs`), el de esa vez. Cada grupo
  trae `group_id`, `group_name`, `campaign_name`, `audience`, `schedule_message_status`, `error_info` (texto),
  `attempts`, `last_attempt_at`, `sent_by`, `clicks`, `reactions_count`, `totaL_readed` (así, con la L mayúscula),
  `total_played` y `edit_status` (`1` editado, `2` fuera de plazo, `3` no se puede editar, `4` falló, o `null` si no
  se editó), con `edit_reason`. La especificación no enumera los valores de `schedule_message_status` ni describe
  `error_info`: muéstralos como llegan.
- **Cada vez que salió uno que se repite:** `GET /api/v1/scheduled-messages/{scheduledMessage}/runs`: cada una con
  `run`, `total_groups`, `count_ok` y `count_error`. La especificación la describe como una lista y dice que con una
  clave viene paginada (`page`, `perPage`): lee la forma que llega.
- **Lecturas:** `GET /api/v1/scheduled-messages/{scheduledMessage}/readed-played-rates` (con `run` si quieres una
  vez): `audience`, `total_readed` y `total_played`.
- **Respuestas:** `GET /api/v1/scheduled-messages/{scheduledMessage}/responses`, con `type` (`poll` o `event`) y
  `page` desde 1 hasta `meta.last_page`: cada una con `group_name`, `responder_name`, `identity`, `identity_type`,
  `response`, `response_label` y `responded_at`. Las etiquetas que pone a quien responde:
  `GET /api/v1/scheduled-messages/{scheduledMessage}/response-tags` (por encuesta o evento: `options`,
  `responses_total` y `untagged_total`).
- **Carpetas:** `GET /api/v1/scheduled-messages/folders`: `id`, `name` y `scheduled_messages_count` de cada una, y
  `meta.all_count` y `meta.unclassified_count`. Usa su `id` en `folder_id`.
- **Eventos** (webhook con `POST /api/v1/webhooks`; la clave necesita **Avisos (webhooks) → Administrar** y
  **Grupos y campañas → Ver**): `scheduled_message.finished` (terminó: `outcome`, `groups` con `total`, `failed` y
  `partially_failed`, y `occurrence`), `scheduled_message.group_delivery_failed` (falló en un grupo: `group`,
  `reason`, `partial` y `occurrence`) y `scheduled_message.response_received` (alguien votó una encuesta o respondió un
  evento: `participant` y `response` con `type`, `options` y `rsvp`). La especificación no enumera los valores de
  `outcome` ni de `reason`: muéstralos como llegan.

## Estadísticas de grupos y campañas

- Las seis llamadas leen y piden **Grupos y campañas → Ver**.
- **Por período** (`GET /api/v1/stats/participants`, `GET /api/v1/stats/active-participants`,
  `GET /api/v1/stats/groups` y `GET /api/v1/stats/clicks`): con una clave, `start_date` y `end_date` son
  obligatorios, en `AAAA-MM-DD`, con hasta 366 días entre las dos, ambas incluidas; si falta una, una no es válida,
  `end_date` es anterior o el rango es mayor, `422`. Si la persona no dice el período, pregúntale; no inventes uno.
  `unit` es `day`, `month` u `hour` (obligatorio en grupos por estado).
- **Filtrar por grupos o campañas:** `target` (`groups` o `campaigns`) con `ids[]`. La especificación no
  dice qué `id` va ahí (ni de qué tipo es): si lo usas, comprueba con uno solo que el resultado cambia como esperas.
- **Lo que responden:** entradas y salidas puede traer `in` y `out` (cada uno con `data` y `total_participants`) o un
  solo `data` con `total_participants` (con `type` `in` u `out` pides uno de los dos); activos, `active` e `inactive`
  (cada uno con `data`, una lista de `date` y `count`, y `total_participants`) o uno solo (filtra con `status`);
  grupos por estado, `data` y `total_groups`; clics, `data` y `total_clicks`. Los totales pueden llegar como texto o
  como `0`. La especificación no describe cada elemento de `data` en entradas y salidas, grupos y clics: lee lo que
  llega antes de armar un gráfico o un resumen.
- **El registro de clics:** `GET /api/v1/stats/records`, por páginas con `page` y `per_page` (de 1 a 100); su
  paginación va en la raíz (`total`, `current_page`, `last_page`), sin `meta`. Filtra por `start_date`, `end_date`,
  `target`, `ids[]`, `devices[]`, `countries[]` y `search`. Cada registro trae `country`, `device`, `browser`,
  `platform`, `language`, `referrer`, `group` (`id`, `name`), `created_at` y, cuando los hay, `phone`, `email` y
  `name`: son datos personales; muéstralos solo si la persona los pide.
- **Por país:** `GET /api/v1/stats/country-metrics` (no exige fechas; acepta `start_date`, `end_date`, `target`,
  `ids[]` y `countries[]`): `data.summary` (`total_contacts`, `total_countries`, `total_clicks`, `total_entries`,
  `total_exits`) y `data.countries`, uno por país con `country_code`, `country_name`, `contacts`, `percentage`,
  `clicks`, `entries`, `entry_rate` y `exits`. Sin datos, los totales llegan en `0` y `countries` vacía.
  `countries[]` acepta hasta 10 caracteres por país; la especificación no dice si es el código o el nombre.
- **El reporte diario:** el evento `daily_report.generated` (webhook con `POST /api/v1/webhooks`; la clave necesita
  **Avisos (webhooks) → Administrar** y **Grupos y campañas → Ver**) trae `period` (`date` y `timezone`), `clicks`,
  `joins`, `leaves` y `conversion_rate`. La especificación no dice qué lo dispara: no lo prometas para una hora fija.

## Puntaje (lead score)

- La persona dice «puntaje»; la API, lead score (`lead_score`, `lead-score`). Categorías: `hot`, `warm`, `cold`,
  `insufficient_data`.
- **El de un contacto:** `GET /api/v1/contacts/{contact}/lead-score`. Trae `score`, `signals_count`, `category`,
  `confidence`, `disqualified`, `disqualified_at`, `disqualification_reasons`, `updated_at` y `events` (cada señal con
  `signal`, `source`, `raw_points`, `applied_points`, `cap_reason`, `occurred_at`). Muchos están declarados como texto:
  conviértelos antes de comparar. Trae `next_cursor` y `has_more`, pero la llamada no declara un parámetro para
  usarlos: no inventes uno; si hay más (`has_more` en `true`) y la persona las necesita, díselo.
- **Cómo se reparte:** `GET /api/v1/lead-score/distribution`: `total`, `counts` (por categoría) y `thresholds`, como
  texto. **Cómo se calcula:** `GET /api/v1/lead-score/settings`: `hot_threshold`, `warm_threshold`, `min_signals`,
  `hysteresis`, `decay_enabled`, `decay_steps` (`days`, `points`) y `rules`. Las dos declaran `404` sin explicarlo.
- **Configurar** (`PUT /api/v1/lead-score/settings`, solo la clave del titular de la cuenta): **reemplaza todo de una
  vez y cada campo es obligatorio**, aunque la especificación no declare el cuerpo. Lee antes la configuración con
  `GET /api/v1/lead-score/settings`, cambia solo lo que la persona pidió y manda todo:
  - `hot_threshold` y `warm_threshold`: enteros de 0 a 100, `warm_threshold` menor que `hot_threshold`.
  - `min_signals`: de 1 a 20. `hysteresis`: de 0 a 25. `decay_enabled`: `true` o `false`.
  - `decay_steps`: hasta 5, cada uno `{"days": …, "points": …}`, con `days` de 1 a 365 y cada paso con más días que el
    anterior, y `points` de -100 a -1.
  - `rules`: cada regla lleva exactamente `id`, `signal`, `mode`, `points`, `daily_cap`, `unique_scope`, `enabled`,
    `disqualifies`, `on_release` y `config`. `signal`: `tag_added`, `tag_removed`, `stage_advanced`,
    `broadcast_reply`, `message_reply`, `intent_keyword`, `group_join`, `group_leave`, `group_reaction`,
    `group_poll_vote`, `link_click` o `automation_completed`. `mode`: `event` o `state` (`state`, solo con
    `tag_added` y `stage_advanced`). `points`: de -100 a 100. `daily_cap`: 1 o más, o `null`. `unique_scope`: `none`,
    `contact` o `contact_scope`. `on_release`: `restore` o `keep`. `config` puede llevar `keywords`, `broadcast_ids`,
    `group_ids`, `flow_ids`, `whalink_ids`, `tag_ids` o `stage_ids`, cada uno solo con la señal que le corresponde.
  - Confírmale a la persona lo que va a cambiar antes de llamar: cambia el puntaje de todos sus contactos.
- **Ajustar** (`POST /api/v1/contacts/{contact}/lead-score/adjustments`): `delta` de -100 a 100 y `reason` (de 3 a 255
  caracteres), los dos obligatorios. Responde el puntaje como quedó. Hazlo solo cuando la persona lo pide para ese
  contacto, con el número y el motivo que ella da.
- **Filtrar por puntaje en otras llamadas** (de 0 a 100; cada una lo escribe distinto): `GET /api/v1/contacts`
  (`lead_score_categories[]`, `lead_score_min`, `lead_score_max`, `lead_score_disqualified`: `include`, `exclude` u
  `only`), `GET /api/v1/conversations` (`leadScoreCategories`, texto sin formato descrito, `leadScoreMin`,
  `leadScoreMax`, `leadScoreDisqualified`), los contactos de una etapa (`leadScoreCategories[]`, `leadScoreMin`,
  `leadScoreMax`, `leadScoreDisqualified`) y la audiencia de una difusión (`lead_score_categories`, `lead_score_min`,
  `lead_score_max`, en el cuerpo).

## Ventas

- Las cinco llamadas solo leen. No hay llamada para conectar una plataforma de pagos ni para registrar una venta, y no
  hay eventos de ventas: no prometas enterarte en el momento; consulta cuando la persona lo pide, no en un bucle.
- **`window`** son días: `7`, `30` o `90` (30 si no lo mandas; otro valor, `422`), contados en la zona horaria de la
  cuenta (UTC si no tiene una) e incluyendo hoy. `event_type[]`: `approved`, `pending`, `rejected`, `cancelled`, `refunded`, `chargeback`,
  `abandoned_cart`.
- **Ver tus ventas** (`GET /api/v1/sales`) es la única lista: por páginas, con `perPage` y `links.next`. Cada venta trae
  `id`, `occurred_at`, `platform`, `product_name`, `kind` y `attribution` (sin describir), `event_type`,
  `amount_minor`, `currency` y `buyer` (`contact_id`, `name`, `phone`, o `null`). Con `buyer.contact_id` lees el
  contacto en `GET /api/v1/contacts/{contact}`.
- **Métricas, embudo y por plataforma** aceptan `page` y `per_page`, sin descripción todavía en la especificación,
  aunque no son listas. Métricas: `window`, `currencies`, `distinct_buyers` y `repeat_purchase_rate`, declarados como
  texto sin forma: muéstralos tal cual llegan. Embudo: `conversations`, `qualified` (puede ser `null`) y `purchases`
  (`buyers` y `amounts`, sin forma descrita). Por plataforma: `platforms`, cada una con `platform`, `connected` y
  `totals` (`currency`, `total_minor`).
- **Montos:** `amount_minor`, `total_minor` y `average_ticket_minor` son enteros en la unidad menor de la moneda:
  centavos en las monedas con dos decimales (divide por 100 para mostrarlos); en `CLP`, `COP`, `JPY` y `PYG`, que no
  tienen decimales, son unidades enteras. Cada monto trae su `currency` (código ISO 4217) y los totales vienen
  agrupados por moneda, sin convertir: no sumes montos de monedas distintas. Un reembolso es una fila aparte, con monto
  negativo.
- **Productos** (`GET /api/v1/payments/products/{platform}`): la especificación no enumera los valores de `{platform}`;
  el candidato es el `platform` de «Ver las ventas por plataforma», sin confirmar. Si responde `404`, díselo a la
  persona. Cada producto trae `external_product_id` y `name`.

## Dominios propios: registrar, verificar y borrar

- **En este orden:**
  1. `POST /api/v1/custom-domains` con `{"hostname": "go.mimarca.com"}`. El `201` trae `id`, `status`
     (`PENDING_DNS`), `ssl` (`validation_method` y `validation_string`), `dns_records` (cada uno con `type` —`ALIAS`,
     `CNAME` o `TXT`—, `host`, `value` y `purpose`) y `detected_provider` (el proveedor de DNS que se detectó, o
     `null`).
  2. Dale a la persona los registros tal cual, para que los cree en su DNS: tú no puedes crearlos.
  3. Cuando te diga que los creó, `POST /api/v1/custom-domains/{customDomain}/verify` con el `id`. Responde el dominio
     con `status`: `PENDING_DNS`, `PENDING_SSL`, `ACTIVE` o `FAILED`. Si no está `ACTIVE`, puede tardar unos minutos:
     vuelve a verificar más tarde, no en un bucle.
- Si el registro todavía no puede apuntar, `POST /api/v1/custom-domains/{customDomain}/switch-validation` con
  `{"method": "TXT"}`: `dns_records` trae también el registro TXT o, si todavía no aparece, lo trae la próxima
  verificación. Para volver, `{"method": "HTTP"}`.
- `422` al registrar: el dominio no es válido o ya está registrado. `502` en registrar, verificar o cambiar la
  validación: no cambió nada; reintenta más tarde.
- `GET /api/v1/custom-domains` los lista por páginas (`links.next`), en el orden en que se registraron.
- La especificación no dice qué links usan el dominio: no lo afirmes.
- **Borrar:** `DELETE /api/v1/custom-domains/{customDomain}`. **No se puede deshacer**: el dominio deja de funcionar
  en el momento y, para volver a usarlo, hay que registrarlo otra vez. Hazlo solo si la persona lo pide de forma
  explícita para eso; confírmale qué dominio vas a borrar (`hostname` e `id`) antes de llamar.

## Tu cuenta, tus contactos activos y tu equipo

- `GET /api/v1/me` (**Números de WhatsApp → Ver**): la cuenta dueña de la clave, según su descripción: su nombre, su
  plan y sus límites; los conteos de números y de agentes son los del workspace de la clave, y `numbers_capacity` es el
  cupo que se aplica cuando esa clave crea un número. Si el workspace paga su propio plan, el plan, sus límites y el
  saldo de contactos activos son los de ese workspace; si no, los de la cuenta. Con una clave no trae el email, el
  teléfono ni las fechas de inicio de sesión del dueño, ni datos de cobro, ni datos de otros workspaces. **La especificación no describe
  los campos de esa respuesta:** lee los que llegan antes de depender de uno, y no le prometas a la persona un dato que
  no venga.
- `GET /api/v1/mac/status` (**Contactos y conversaciones → Ver**) responde una de dos formas, que la especificación
  declara sin decir cuándo llega cada una: `current_count`, `limit`, `remaining`, `usage_percentage`, `state`,
  `grace` y `period_start` (los dos en `null`), `enforcement_enabled` y `unlimited`; o `mac_count`, `mac_limit`,
  `cycle_capacity`, `accumulated_available`, `total_available`, `usage_percentage`, `enforcement_enabled`,
  `alert_level`, `expiring_buckets` (`amount`, `expires_in_days`), `buckets` (`source`, `macs_remaining`,
  `expires_at`), `state`, `grace` (`grace_period_id`, `started_at`, `expires_at`, `seconds_remaining`, `end_reason`, o
  `null`), `unlimited` y, a veces, `workspace_id` e `inactive_contacts_count`. Mira qué campos llegan antes de leer
  uno. La especificación no enumera los valores de `state` ni de `alert_level`: no deduzcas un tope que no venga.
- `GET /api/v1/mac/contacts` y `GET /api/v1/mac/contacts/history`: por páginas (`perPage` de 1 a 100,
  `links.next`). La especificación no describe los campos de cada elemento ni qué guarda el historial: lee lo que
  llega antes de depender de un campo.
- **Al llegar al límite** (según los eventos): `mac.usage_100` abre una gracia de 24 horas (`data.grace_expires_at`);
  si no se regulariza, llega `account.blocked` (`data.reason` `mac_grace_expired`). En el bloqueo, los envíos con
  clave responden `429` con `mac_lockout_24h` (ver «Mandar mensajes»). Antes de un envío grande, mira
  `GET /api/v1/mac/status`.
- **Tu equipo:** `GET /api/v1/agents` (filtro `name`; orden `orderBy` `name` o `created_at` y `orderByMethod` `asc` o
  `desc`; por páginas) y `GET /api/v1/agents/{user}`, que trae `id` y `name` (`404` si no está). La especificación no
  describe los campos de cada elemento de la lista: usa el `id` que traiga cada uno como `{user}` y, si no viene, no
  lo adivines.
- **Facturación:** la API no tiene llamadas para pagar ni cambiar el plan (una ruta que no está publicada responde
  `403 route_not_available`). Si la persona pregunta por un cobro, díselo; la API solo informa con los eventos.

## Enterarte de tus contactos activos y tu suscripción

- Crea un webhook con `POST /api/v1/webhooks` y los eventos que la persona quiera. La clave necesita 
  **Avisos (webhooks) → Administrar** y, por estos eventos, **Números de WhatsApp → Ver**.
- **Contactos activos:** `mac.usage_80` (llegó al 80 % del ciclo: `used`, `limit`, `percentage`, `cycle_started_at`),
  `mac.usage_100` (los agotó: lo mismo más `grace_expires_at`), `mac.expiring` (hay contactos activos que vencen en
  los próximos 7 días: `contacts_expiring`, `expires_at`) y `account.blocked` (`reason`, `grace_started_at`,
  `grace_expired_at`).
- **Suscripción:** `billing.upcoming_charge` (unos días antes del cobro: `charge_date`, `amount_cents`, `currency`),
  `billing.payment_failed` (un cobro no se pudo procesar: una vez por factura, en el primer intento fallido; no se
  repite en los reintentos), `subscription.trial_ending` (entre 1 y 3 días antes del fin de la prueba:
  `trial_ends_at`), `subscription.dormant_ending` (unos 7 días antes de que termine la pausa de la cuenta, cuando se
  intenta el cobro: `charge_date`, `amount_cents`, `currency`), `subscription.cancellation_confirmed` (se conserva el
  acceso hasta `access_until`) y `subscription.reactivated` (se revirtió una cancelación programada; se renueva en
  `renews_at`).
- Según la descripción de cada uno, `billing.upcoming_charge`, `billing.payment_failed`,
  `subscription.cancellation_confirmed` y `subscription.reactivated` llegan solo con suscripciones de Stripe: con otra
  forma de pago pueden no llegar nunca. No le prometas a la persona que le van a llegar.
- Todos traen `data.workspace_id`. El mismo evento puede llegar más de una vez: descarta los repetidos por el `id` del
  sobre.

## Alertas: qué alerta va a cada destino, silencio y reporte diario

- **Alertas y webhooks son cosas distintas.** Si la persona quiere eventos en su servidor con el sobre y la firma de
  Funnelchat, usa `POST /api/v1/webhooks`. Las alertas van a un teléfono o a un destino webhook de alertas, con otro
  formato que la especificación no describe: no le prometas un formato.
- **Las alertas que hay:** `GET /api/v1/alerts/catalog`: cada una trae `module`, `action`, `category`,
  `is_critical`, `label` y `tooltip`. Las que dependen de cómo paga la cuenta aparecen solo si aplican.
- **Los destinos:** `GET /api/v1/alerts/destinations`, por páginas (`links.next`): los del workspace de la clave, cada
  uno con `id`, `type` (`phone` o `webhook`), `destination`, `name`, `verified`, `has_secret` y sus `settings`
  (`module`, `action`, `enabled`). **El teléfono sale tapado** (`****1234`, solo los últimos cuatro dígitos): no le
  pidas a la persona que lo confirme ni lo uses como un número completo.
- **Por la API no se crean, editan, verifican, prueban ni borran destinos:** si la persona lo pide, díselo; solo se
  leen y se les prenden o apagan alertas.
- **Prender o apagar una alerta en un destino:** `PUT /api/v1/alerts/destinations/{id}/settings` con `module` y
  `action` copiados de una fila del catálogo y `enabled` (`true` o `false`); `{id}` es el `id` del destino. Responde la
  alerta del destino con su estado. `422`: un dato no es válido, la alerta no está en el catálogo o el destino es un
  teléfono sin verificar («El destino debe estar verificado para configurar alertas.»). `404` («Destino no
  encontrado.»): el destino no existe o no es del workspace de la clave.
- **Horario de silencio:** uno por cuenta. `PUT /api/v1/alerts/quiet-hours` lo reemplaza: `enabled` y `start_time` y
  `end_time` en `HH:MM` (el fin puede ser anterior al inicio, para cruzar la medianoche). Sin configurar,
  `GET /api/v1/alerts/quiet-hours` devuelve `enabled: false` sin horario. La especificación no dice qué pasa con una
  alerta dentro de ese horario: no lo afirmes.
- **Reporte diario:** uno por cuenta. `PUT /api/v1/alerts/daily-report` lo reemplaza: `enabled`, `send_time`,
  `all_campaigns` y, con `all_campaigns: false`, `campaign_ids`. Sin configurar, `GET /api/v1/alerts/daily-report`
  devuelve apagado, a las `08:00` y con todas las campañas. Los ids salen de `GET /api/v1/alerts/campaigns` (las
  campañas del workspace por defecto —con una clave, solo la usa una del workspace por defecto—, cada una con `id`, `uuid`, `name`, `is_active`, `groups_count` y `type`;
  `search` por nombre, por páginas; `503 groups_unavailable`: reintenta más tarde). Los ids que no existen o no son del
  workspace por defecto se descartan sin error: confirma con la respuesta cuáles quedaron. La especificación no describe qué trae
  el reporte ni a qué destino llega.
- Silencio y reporte son de toda la cuenta: antes de cambiarlos, confírmale a la persona lo que va a cambiar.

## Más sobre tus webhooks: ver uno, editarlo, sus entregas y los tipos de evento

- Crear (`POST /api/v1/webhooks`), ver todos (`GET /api/v1/webhooks`), probar y borrar están en la página de webhooks.
  `{id}` es el `id` de un webhook (texto, no número) que devolvió el alta o la lista. Si la persona no dice cuál,
  lista sus webhooks y pregúntale por la `url`; no elijas por ella.
- **Permisos de la clave:** ver uno (`GET /api/v1/webhooks/{id}`) y sus entregas
  (`GET /api/v1/webhooks/{id}/deliveries`) piden **Avisos (webhooks) → Ver**; editarlo (`PUT /api/v1/webhooks/{id}`),
  **Avisos (webhooks) → Administrar**. En las tres, además, el permiso de lectura del área de cada evento que el
  webhook tiene ahora: **Números de WhatsApp → Ver** para los `device.*` y los de la cuenta (contactos activos, cobros,
  suscripción, `account.blocked`); **Grupos y campañas → Ver** para grupos, encuestas, campañas, pipelines, envíos
  programados y el reporte diario; **Contactos y conversaciones → Ver** para mensajes, contactos, etiquetas,
  conversaciones, tableros, formularios, flujos, plantillas y difusiones (sirven también Editar o Enviar de la misma
  área). Si falta uno: `403 permission_denied` (el `message` nombra el permiso) y no se cambia nada. Al editar, cada
  evento de `events` pide el de su área; si falta, `422`. `GET /api/v1/webhooks/events` pide **Números de WhatsApp →
  Ver**.
- **Ver uno:** el webhook sin envoltorio `data`: `id`, `url`, `description`, `events`, `filters` (`{}` si no tiene),
  `status` (`active`, `paused` o `disabled`), `disabled_reason`, `last_delivery_at`, `last_success_at`,
  `secret_rotated_at`, `created_at`, `updated_at` y `migration` (la especificación no lo describe). Nunca el secreto:
  si la persona lo perdió, se rota desde el panel. `404` si no existe o no es de la cuenta.
- **Editar:** `PUT /api/v1/webhooks/{id}` con `url` (obligatoria, hasta 2048 caracteres), `events` (obligatorio, de 1 a
  50 nombres, sin repetir ni comodín), `description` (hasta 160, o `null`), `filters` y, si quieres, `status`
  (`active` o `paused`; nunca `disabled`). Reemplaza los cuatro primeros, y la especificación no dice qué pasa con
  `description` o `filters` si no los mandas: lee antes el webhook con `GET` y manda lo que leíste, cambiando solo lo
  que la persona pidió. Para sumar un evento, manda la lista completa con el nuevo. La respuesta `200` no está
  descrita: para ver cómo quedó, vuelve a leerlo. Un cuerpo inválido responde `422` antes de mirar el webhook.
- **Antes de quitar eventos, cambiar la `url` o pausarlo:** hazlo solo si la persona lo pide de forma explícita para
  eso; confírmale qué webhook es (`url` e `id`) y qué va a dejar de recibir antes de llamar.
- **Pausarlo (o que se deshabilite) descarta lo pendiente:** las entregas que esperaban, también los reintentos en
  curso, no se envían ni se vuelven a intentar al reactivarlo, y no cuentan como fallas. Quedan en sus entregas sin
  `response_status`, con `error` `subscription_paused` (o `subscription_disabled`). Lo que pasó mientras estaba pausado
  no llega después: si la persona lo necesita, que su sistema lo vuelva a leer por la API.
- **Cambiar `url` con una clave ata el webhook a esa clave:** si después se revoca, pasa a `disabled` con
  `disabled_reason: key_revoked`, deja de recibir eventos y no se puede reactivar (hay que crear uno nuevo). Un webhook
  queda atado a la clave que lo creó o a la última que le cambió la `url`; uno creado desde el panel al que ninguna
  clave le cambió la `url` es de la cuenta y no depende de ninguna clave.
- **Deshabilitado por fallas:** según la descripción general, tras 5 entregas fallidas seguidas (agotadas o con una
  respuesta que no se reintenta) se deshabilita solo. Para reactivarlo, `PUT` con todo igual y `status: active`, y
  después pruébalo con `POST /api/v1/webhooks/{id}/test`. La especificación no enumera los `disabled_reason` salvo
  `key_revoked`.
- **Filtros:** `filters.campaign_ids` (hasta 100 textos de 6 a 64 caracteres) es un filtro por campañas de grupos. La
  especificación solo dice que `device.health_changed`, `device.quality_changed`, `device.messaging_limit_changed` y
  `device.display_name_reviewed` no llegan a un webhook filtrado por campaña (no son de ninguna) y que
  `group_join_request.created` de un grupo de una campaña sí llega a los filtrados por esa campaña. No dice qué
  identificador de campaña va (los eventos de grupos traen `campaign.uuid`) ni qué pasa con los demás eventos: úsalo
  solo si la persona lo pide, y pruébalo antes de depender de él.

## Las entregas y los tipos de evento

- **Entregas:** `GET /api/v1/webhooks/{id}/deliveries`, una fila por intento, la más nueva primero (orden fijo:
  mandar `orderBy` u otro parámetro de orden responde `422`). Por páginas: `perPage` (o `per_page`) de 1 a 100, 25 si
  no lo mandas; pide `links.next` tal cual hasta que sea `null`. Cada fila: `event_id` (el `id` del sobre que recibió
  el servidor; los reintentos de un evento lo comparten), `event_type`, `attempt`, `url`, `response_status`,
  `succeeded`, `error`, `duration_ms` y `attempted_at`. La especificación no enumera los valores de `error`: muéstralo
  tal cual. Solo aparecen las entregas de eventos de las áreas que la clave puede leer (si el webhook tuvo antes
  eventos de otra área, esas filas no aparecen); las de `webhook.test`, siempre.
- **Por qué no le llega algo:** mira `status`, `disabled_reason` y `events` del webhook, y sus últimas entregas
  (`succeeded`, `response_status`, `error`). Se reintenta hasta 4 intentos en total, con esperas de 60 segundos, 5
  minutos y 30 minutos, solo ante un error de red, un `5xx` o un `429`; un `3xx` u otro `4xx` no se reintenta. No
  consultes las entregas en un bucle para esperar un evento.
- **Tipos de evento:** `GET /api/v1/webhooks/events` lista los de las tres áreas, cada uno con `status` (`active`, o
  `planned`: se puede suscribir pero todavía no se emite) y `example` (el cuerpo completo que llega); `meta` trae
  `total`, `active`, `envelope_version` (`v1`), `signature_header` y `signature_format`. La especificación no describe
  los demás campos de cada entrada: lee los que llegan. **Ofrece solo los `active`**: uno `planned` no llega aunque el
  webhook lo tenga. `webhook.test` no se elige: llega al probar. La tabla de la página de webhooks ya tiene los que se
  publican: no hace falta pedir el catálogo antes de cada alta.

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
