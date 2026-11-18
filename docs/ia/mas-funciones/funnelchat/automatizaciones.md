# Automatizaciones y carpetas de flujos — API de Funnelchat: contexto para tu IA

> Copiado de /docs/mas-funciones/funnelchat/#automatizaciones. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Llamadas

### Ver las ejecuciones de un contacto

`GET /api/v1/contact-flows/{contactId}` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `flow.contactFlowHistory`

**Para qué sirve:** Sirve para ver el historial de ejecuciones de flujos de un contacto, filtrable por estado (en curso, completado, invalidado, cancelado) y fechas. Útil para diagnosticar por qué recibió o no una automatización.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `contactId` | path | string | sí |  |
| `search` | query | string | no |  |
| `status_group` | query | string ∈ {"en_curso", "completado", "invalidado", "cancelado"} | no |  |
| `date_from` | query | string (date-time) | no |  |
| `date_to` | query | string (date-time) | no |  |
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
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver los flujos de un contacto

`GET /api/v1/contacts/{contact}/flows` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `contactAutomation.flows`

**Para qué sirve:** Úsalo para saber en qué flujos de automatización está un contacto y si alguno sigue corriendo.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `contact` | path | string | sí |  |
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<ContactFlowListResource> |  |
  | `data[].id` | string |  |
  | `data[].name` | string |  |
  | `data[].running` | boolean |  |
  | `data[].created_at` | string \| null |  |
  | `data[].last_run_at` | string \| null |  |
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

### Ver tus flujos

`GET /api/v1/flows` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `flow.index`

**Para qué sirve:** Sirve para listar tus flujos de automatización con filtros por carpeta, disparador, estado, número o fecha, por ejemplo para mostrarlos en tu producto o auditarlos.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `name` | query | string | no |  |
| `folder_id` | query | string | no |  |
| `unclassified` | query | string | no |  |
| `trigger_type` | query | string ∈ {"1", "2", "3", "4", "5", "6", "7", "inbound_automation"} | no |  |
| `status` | query | string ∈ {"active", "inactive"} | no |  |
| `date_from` | query | string (date) | no |  |
| `date_to` | query | string (date) | no |  |
| `date_field` | query | string ∈ {"created_at", "updated_at"} | no |  |
| `device_id` | query | string | no |  |
| `device_ids[]` | query | array<string> | no |  |
| `perPage` | query | integer | no |  |
| `orderBy` | query | string ∈ {"name", "created_at", "updated_at"} | no |  |
| `orderByMethod` | query | string ∈ {"asc", "desc"} | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<FlowResource> |  |
  | `data[].id` | string |  |
  | `data[].name` | string \| string ∈ {""} |  |
  | `data[].uuid` | string |  |
  | `data[].first_node_uuid` | string |  |
  | `data[].enable` | string |  |
  | `data[].valid` | string |  |
  | `data[].executions` | string \| integer ∈ {0} |  |
  | `data[].created_at` | string |  |
  | `data[].updated_at` | string \| string ∈ {""} |  |
  | `data[].nodes_count` | string \| integer ∈ {0} |  |
  | `data[].trigger_uuid` | string \| string ∈ {""} |  |
  | `data[].trigger_device_ids` | string \| array<string> |  |
  | `data[].trigger_type` | string \| string ∈ {""} |  |
  | `data[].trigger_values` | string \| array<string> |  |
  | `data[].trigger_is_global` | boolean |  |
  | `data[].trigger_save_activation_phrase` | boolean |  |
  | `data[].trigger_activation_phrase_field_id` | string \| null |  |
  | `data[].payment_platform` | string \| null |  |
  | `data[].payment_external_product_id` | string \| null |  |
  | `data[].payment_event_types` | string \| null |  |
  | `data[].payment_event_entry_nodes` | string \| null |  |
  | `data[].default` | string |  |
  | `data[].once_per_contact` | string |  |
  | `data[].frequency_limit_value` | string |  |
  | `data[].frequency_limit_unit` | string \| null |  |
  | `data[].frequency_limit_minutes` | string |  |
  | `data[].folder` | FolderResource |  |
  | `data[].nodes` | array<NodeResource> |  |
  | `data[].inbound_origins` | string |  |
  | `data[].intention_prompt` | string \| string ∈ {""} |  |
  | `data[].match_location` | string \| null |  |
  | `data[].match_details` | string \| null |  |
  | `data[].risk_acceptance` | object \| null |  |
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

### Ver un flujo

`GET /api/v1/flows/{flow}` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `flow.show`

**Para qué sirve:** Úsalo para ver la configuración de un flujo: si está activo y es válido, cuántas veces se ejecutó y qué lo dispara (tipo, valores y números).

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `flow` | path | string | sí |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string |  |
  | `name` | string \| string ∈ {""} |  |
  | `uuid` | string |  |
  | `first_node_uuid` | string |  |
  | `enable` | string |  |
  | `valid` | string |  |
  | `executions` | string \| integer ∈ {0} |  |
  | `created_at` | string |  |
  | `updated_at` | string \| string ∈ {""} |  |
  | `nodes_count` | string \| integer ∈ {0} |  |
  | `trigger_uuid` | string \| string ∈ {""} |  |
  | `trigger_device_ids` | string \| array<string> |  |
  | `trigger_type` | string \| string ∈ {""} |  |
  | `trigger_values` | string \| array<string> |  |
  | `trigger_is_global` | boolean |  |
  | `trigger_save_activation_phrase` | boolean |  |
  | `trigger_activation_phrase_field_id` | string \| null |  |
  | `payment_platform` | string \| null |  |
  | `payment_external_product_id` | string \| null |  |
  | `payment_event_types` | string \| null |  |
  | `payment_event_entry_nodes` | string \| null |  |
  | `default` | string |  |
  | `once_per_contact` | string |  |
  | `frequency_limit_value` | string |  |
  | `frequency_limit_unit` | string \| null |  |
  | `frequency_limit_minutes` | string |  |
  | `folder` | FolderResource |  |
  | `folder.id` | string |  |
  | `folder.name` | string \| string ∈ {""} |  |
  | `folder.parent_id` | string | Id opaco: un texto que empieza con `fdr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `folder.children` | array<FolderResource> |  |
  | `folder.flows_count` | integer |  |
  | `nodes` | array<NodeResource> |  |
  | `nodes[].uuid` | string |  |
  | `nodes[].flow_id` | string | Id opaco: un texto que empieza con `flw_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `nodes[].type` | integer |  |
  | `nodes[].action` | string |  |
  | `nodes[].value` | array<any> \| null \| string |  |
  | `nodes[].next_uuid` | string |  |
  | `inbound_origins` | string |  |
  | `intention_prompt` | string \| string ∈ {""} |  |
  | `match_location` | string \| null |  |
  | `match_details` | string \| null |  |
  | `risk_acceptance` | object \| null |  |
  | `risk_acceptance.accepted_by_name` | string \| null |  |
  | `risk_acceptance.accepted_at` | string |  |
  | `risk_acceptance.codes` | string \| array<string> |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)

### Ver los pasos de un flujo

`GET /api/v1/flows/{flow}/nodes` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `flow.nodes`

**Para qué sirve:** Sirve para leer los pasos de un flujo y cómo se encadenan, por ejemplo para documentar o visualizar la automatización fuera de Funnelchat.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `flow` | path | string | sí |  |
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<NodeResource> |  |
  | `data[].uuid` | string |  |
  | `data[].flow_id` | string | Id opaco: un texto que empieza con `flw_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].type` | integer |  |
  | `data[].action` | string |  |
  | `data[].value` | array<any> \| null \| string |  |
  | `data[].next_uuid` | string |  |
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

### Ver los contactos de un flujo

`GET /api/v1/flows/{flow}/flow-contacts` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `flow.flowContactsList`

**Para qué sirve:** Úsalo para ver todos los contactos que pasaron por un flujo, filtrando por estado (en curso, completado, invalidado, cancelado) y fechas. Ideal para medir su resultado.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `flow` | path | string | sí |  |
| `search` | query | string | no |  |
| `status_group` | query | string ∈ {"en_curso", "completado", "invalidado", "cancelado"} | no |  |
| `date_from` | query | string (date-time) | no |  |
| `date_to` | query | string (date-time) | no |  |
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — OK

  La misma tabla que en «Ver las ejecuciones de un contacto», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Contar los contactos en curso de un flujo

`GET /api/v1/flows/{flow}/active-contacts` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `flow.activeContacts`

**Para qué sirve:** Úsalo para saber cuántos contactos están ahora dentro de un flujo, por ejemplo antes de editarlo o desactivarlo.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `flow` | path | string | sí |  |
| `payment_event_type` | query | string ∈ {"approved", "pending", "rejected", "cancelled", "refunded", "chargeback", "abandoned_cart"} | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `active_contacts_count` | integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Contar los contactos pausados de un flujo

`GET /api/v1/flows/{flow}/paused-contacts` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `flow.pausedContacts`

**Para qué sirve:** Úsalo para saber cuántos contactos de un flujo están pausados, por ejemplo para un tablero de tus automatizaciones.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `flow` | path | string | sí |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `paused_contacts_count` | integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)

### Ver los contactos pausados de un flujo

`GET /api/v1/flows/{flow}/paused-contacts-list` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `flow.pausedContactsList`

**Para qué sirve:** Sirve para ver quiénes están pausados en un flujo, con búsqueda, por ejemplo para revisar esos casos uno por uno.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `flow` | path | string | sí |  |
| `search` | query | string | no |  |
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — OK

  La misma tabla que en «Ver las ejecuciones de un contacto», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)

### Cancelar una ejecución

`PUT /api/v1/contact-flows/{contactFlowId}/cancel` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `flow.cancelContactFlow`

**Para qué sirve:** Úsalo para frenar un flujo que está corriendo para un contacto, por ejemplo cuando tu sistema detecta que ya compró o pidió no recibir más mensajes. El id de la ejecución sale del historial del contacto o de los contactos del flujo.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `contactFlowId` | path | string | sí |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `contact_flow` | object |  |
  | `contact_flow.id` | string | Id opaco: un texto que empieza con `run_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `contact_flow.status` | integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content

### Pausar las automatizaciones de un contacto

`POST /api/v1/contacts/{contact}/pause` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `contactAutomation.pause`

**Para qué sirve:** Úsalo para pausar a un contacto en las automatizaciones de la cuenta; las conversaciones y las difusiones permiten filtrar a los contactos pausados. La pausa no vence ni se levanta sola.

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
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver tus carpetas

`GET /api/v1/folders` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `folder.index`

**Para qué sirve:** Sirve para listar las carpetas donde se organizan los flujos, con su jerarquía y cantidad de flujos, por ejemplo para filtrar flujos por carpeta.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `name` | query | string \| null | no |  |
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<FolderResource> |  |
  | `data[].id` | string |  |
  | `data[].name` | string \| string ∈ {""} |  |
  | `data[].parent_id` | string | Id opaco: un texto que empieza con `fdr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].children` | array<FolderResource> |  |
  | `data[].flows_count` | integer |  |
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

### Crear una carpeta

`POST /api/v1/folders` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `folder.store`

**Para qué sirve:** Úsalo para crear una carpeta (o una subcarpeta, con `parent_id`) y organizar tus flujos.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `name` | string | sí |  |
| `parent_id` | string \| null | no | Id opaco: un texto que empieza con `fdr_`. Se usa tal como llega; no se arma ni se interpreta. |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string |  |
  | `name` | string \| string ∈ {""} |  |
  | `parent_id` | string | Id opaco: un texto que empieza con `fdr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `children` | array<FolderResource> |  |
  | `children[].id` | string |  |
  | `children[].name` | string \| string ∈ {""} |  |
  | `children[].parent_id` | string | Id opaco: un texto que empieza con `fdr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `children[].children` | array<FolderResource> |  |
  | `children[].flows_count` | integer |  |
  | `flows_count` | integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver una carpeta

`GET /api/v1/folders/{folder}` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `folder.show`

**Para qué sirve:** Sirve para ver una carpeta de flujos con sus subcarpetas y cuántos flujos contiene.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `folder` | path | string | sí |  |

**Respuestas**

- `200` — OK

  La misma tabla que en «Crear una carpeta», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)

### Editar una carpeta

`PUT /api/v1/folders/{folder}` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `folder.update`

**Para qué sirve:** Úsalo para renombrar una carpeta de flujos o moverla dentro de otra cambiando `parent_id`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `folder` | path | string | sí |  |

**Cuerpo** (`application/json`)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `name` | string | no |  |
| `parent_id` | string \| null | no | Id opaco: un texto que empieza con `fdr_`. Se usa tal como llega; no se arma ni se interpreta. |

**Respuestas**

- `200` — OK
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Borrar una carpeta

`DELETE /api/v1/folders/{folder}` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `folder.destroy`

**Para qué sirve:** Sirve para eliminar una carpeta de flujos que ya no necesitas.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `folder` | path | string | sí |  |

**Respuestas**

- `200` — OK
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)

## Los eventos

Llegan por webhook. Cómo crear uno, cómo llega cada entrega, los reintentos, el permiso que pide cada evento y cómo verificar la firma (con funciones probadas en Node.js, Python y PHP): https://developers-portal.funnelchat.app/ia/lo-basico.md.

### `flow.completed`

Un contacto terminó un flujo de automatización.

Se envía una sola vez por cada ejecución de un flujo, cuando termina con éxito. No se envía si la ejecución se cortó, se canceló, quedó bloqueada o falló. `contact` es `null` si la ejecución no tiene un contacto asociado. Un flujo muy usado puede generar muchos eventos seguidos.

Ejemplo:

```json
{
  "id": "evt_000000000000000000000003",
  "type": "flow.completed",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "flow": {
      "id": "flw_AHRNv5zDGiU72BDvJYbeGRy",
      "name": "Flujo de ejemplo"
    },
    "contact": {
      "id": "ctc_ABViuUDF93I2VL1tInstRDG",
      "name": "Contacto de ejemplo",
      "phone": "+5491100000000"
    },
    "workspace_id": 37
  }
}
```

### `flow.failed`

La ejecución de un flujo para un contacto terminó por un error.

Se envía una sola vez por cada ejecución de un flujo que termina por un error, no porque llegó al final. `reason` indica el motivo y toma uno de estos valores: `node_missing` (el paso a ejecutar ya no existe), `unknown_node_type` (el paso es de un tipo no reconocido), `missing_subflow` (el flujo que debía ejecutarse dentro de otro ya no existe), `malformed_node` (el paso tiene una configuración dañada), `loop_detected` (la ejecución dio vueltas sin esperar nada) y `execution_error` (un error inesperado detuvo la ejecución). No se envía si la ejecución se canceló, quedó bloqueada o se cortó porque se editó el flujo o se unieron contactos. `contact` es `null` si la ejecución no tiene un contacto asociado.

Ejemplo:

```json
{
  "id": "evt_000000000000000000000013",
  "type": "flow.failed",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "flow": {
      "id": "flw_AHRNv5zDGiU72BDvJYbeGRy",
      "name": "Flujo de ejemplo"
    },
    "contact": {
      "id": "ctc_ABViuUDF93I2VL1tInstRDG",
      "name": "Contacto de ejemplo",
      "phone": "+5491100000000"
    },
    "reason": "execution_error",
    "workspace_id": 37
  }
}
```

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
