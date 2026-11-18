# Automatizaciones — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/automatizaciones/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
