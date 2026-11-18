# Tableros — API de Funnelchat: contexto para tu IA

> Copiado de /docs/mas-funciones/funnelchat/#tableros. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Llamadas

### Ver tus tableros

`GET /api/v1/kanban-settings` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `kanbanSetting.index`

**Para qué sirve:** Sirve para listar tus tableros kanban y obtener sus IDs, necesarios para mover contactos de etapa o filtrar conversaciones y difusiones por tablero.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<KanbanSettingResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `knb_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].user_id` | string | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].name` | string |  |
  | `data[].mode` | string |  |
  | `data[].stagnant_days` | integer \| null |  |
  | `data[].value_custom_field_id` | string \| null | Id opaco: un texto que empieza con `fld_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].profit_custom_field_id` | string \| null | Id opaco: un texto que empieza con `fld_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].view_mode` | string |  |
  | `data[].icon` | string \| null |  |
  | `data[].description` | string \| null |  |
  | `data[].is_primary` | boolean |  |
  | `data[].color_by_lead_score` | boolean |  |
  | `data[].structure` | array<any> |  |
  | `data[].stages` | array<KanbanStageResource> |  |
  | `data[].created_at` | string (date-time) \| null |  |
  | `data[].updated_at` | string (date-time) \| null |  |
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

### Crear un tablero

`POST /api/v1/kanban-settings` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `kanbanSetting.store`

**Para qué sirve:** Úsalo para crear un tablero kanban, basado en etapas o en etiquetas, por ejemplo para modelar tu embudo de ventas o de atención dentro de Funnelchat.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `name` | string | sí |  |
| `mode` | string ∈ {"tags", "stages"} | no |  |
| `structure` | array<object> \| null | no |  |
| `structure[].tag_id` | string | sí | Id opaco: un texto que empieza con `tag_`. Se usa tal como llega; no se arma ni se interpreta. |
| `structure[].position` | integer | sí |  |
| `stages` | array<object> \| null | no |  |
| `stages[].name` | string | no |  |
| `stagnant_days` | integer \| null | no |  |
| `view_mode` | string \| null ∈ {"compact", "extended", null} | no |  |
| `icon` | string \| null ∈ {"target", "filter", "trending-up", "users", "briefcase", "shopping-cart", "heart", "star", "flag", "rocket", "layers", "zap", null} | no |  |
| `description` | string \| null | no |  |
| `is_primary` | boolean | no |  |
| `color_by_lead_score` | boolean | no |  |

**Respuestas**

- `201` — Created

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string | Id opaco: un texto que empieza con `knb_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `user_id` | string | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `name` | string |  |
  | `mode` | string |  |
  | `stagnant_days` | integer \| null |  |
  | `value_custom_field_id` | string \| null | Id opaco: un texto que empieza con `fld_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `profit_custom_field_id` | string \| null | Id opaco: un texto que empieza con `fld_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `view_mode` | string |  |
  | `icon` | string \| null |  |
  | `description` | string \| null |  |
  | `is_primary` | boolean |  |
  | `color_by_lead_score` | boolean |  |
  | `structure` | array<any> |  |
  | `stages` | array<KanbanStageResource> |  |
  | `stages[].id` | string | Id opaco: un texto que empieza con `stg_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `stages[].kanban_setting_id` | string | Id opaco: un texto que empieza con `knb_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `stages[].name` | string |  |
  | `stages[].position` | integer |  |
  | `stages[].contacts_count` | integer |  |
  | `stages[].created_at` | string (date-time) \| null |  |
  | `stages[].updated_at` | string (date-time) \| null |  |
  | `created_at` | string (date-time) \| null |  |
  | `updated_at` | string (date-time) \| null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver un tablero

`GET /api/v1/kanban-settings/{kanbanSetting}` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `kanbanSetting.show`

**Para qué sirve:** Sirve para ver la configuración de un tablero: modo, etapas, días para considerar estancado a un contacto y los campos de valor y ganancia asociados.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `kanbanSetting` | path | string | sí |  |

**Respuestas**

- `200` — OK

  La misma tabla que en «Crear un tablero», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)

### Editar un tablero

`PUT /api/v1/kanban-settings/{kanbanSetting}` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `kanbanSetting.update`

**Para qué sirve:** Úsalo para ajustar un tablero existente: nombre, estructura, días de estancamiento, vista, ícono o si se colorea por lead score.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `kanbanSetting` | path | string | sí |  |

**Cuerpo** (`application/json`)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `name` | string \| null | no |  |
| `mode` | string | no |  |
| `structure` | array<object> \| null | no |  |
| `structure[].tag_id` | string | sí | Id opaco: un texto que empieza con `tag_`. Se usa tal como llega; no se arma ni se interpreta. |
| `structure[].position` | integer | sí |  |
| `stagnant_days` | integer \| null | no |  |
| `view_mode` | string \| null ∈ {"compact", "extended", null} | no |  |
| `icon` | string \| null ∈ {"target", "filter", "trending-up", "users", "briefcase", "shopping-cart", "heart", "star", "flag", "rocket", "layers", "zap", null} | no |  |
| `description` | string \| null | no |  |
| `is_primary` | boolean | no |  |
| `color_by_lead_score` | boolean | no |  |

**Respuestas**

- `200` — OK

  La misma tabla que en «Crear un tablero», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Borrar un tablero

`DELETE /api/v1/kanban-settings/{kanbanSetting}` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `kanbanSetting.destroy`

**Para qué sirve:** Sirve para eliminar un tablero kanban que ya no usas.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `kanbanSetting` | path | string | sí |  |

**Respuestas**

- `204` — No Content
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)

### Ver si unos contactos están en un tablero

`GET /api/v1/kanban-settings/{kanbanSetting}/members` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `kanbanSetting.members`

**Para qué sirve:** Úsalo para chequear en una sola llamada cuáles de un conjunto de contactos están en un tablero, por ejemplo antes de moverlos o agregarlos.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `kanbanSetting` | path | string | sí |  |
| `contact_ids[]` | query | array<string> | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `member_contact_ids` | array<string> |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Crear una etapa

`POST /api/v1/kanban-settings/{kanbanSetting}/stages` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `kanbanStage.store`

**Para qué sirve:** Úsalo para agregar una etapa nueva a un tablero, ubicándola después de una etapa existente.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `kanbanSetting` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `name` | string | sí |  |
| `after_stage_id` | string \| null | no | Id opaco: un texto que empieza con `stg_`. Se usa tal como llega; no se arma ni se interpreta. |

**Respuestas**

- `201` — Created

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string | Id opaco: un texto que empieza con `stg_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `kanban_setting_id` | string | Id opaco: un texto que empieza con `knb_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `name` | string |  |
  | `position` | integer |  |
  | `contacts_count` | integer |  |
  | `created_at` | string (date-time) \| null |  |
  | `updated_at` | string (date-time) \| null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Editar una etapa

`PUT /api/v1/kanban-settings/{kanbanSetting}/stages/{stage}` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `kanbanStage.update`

**Para qué sirve:** Úsalo para renombrar una etapa de un tablero.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `kanbanSetting` | path | string | sí |  |
| `stage` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `name` | string | sí |  |

**Respuestas**

- `200` — OK

  La misma tabla que en «Crear una etapa», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Borrar una etapa

`DELETE /api/v1/kanban-settings/{kanbanSetting}/stages/{stage}` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `kanbanStage.destroy`

**Para qué sirve:** Sirve para eliminar una etapa de un tablero; con `reassign_to_stage_id` puedes pasar sus contactos a otra etapa.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `kanbanSetting` | path | string | sí |  |
| `stage` | path | string | sí |  |
| `reassign_to_stage_id` | query | string \| null | no |  |

**Respuestas**

- `204` — No Content
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ordenar las etapas

`POST /api/v1/kanban-settings/{kanbanSetting}/stages/reorder` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `kanbanStage.reorder`

**Para qué sirve:** Sirve para cambiar el orden de las etapas de un tablero enviando la lista de IDs en el orden que quieres.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `kanbanSetting` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `stage_ids` | array<string> | sí |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `[].id` | string | Id opaco: un texto que empieza con `stg_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `[].kanban_setting_id` | string | Id opaco: un texto que empieza con `knb_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `[].name` | string |  |
  | `[].position` | integer |  |
  | `[].contacts_count` | integer |  |
  | `[].created_at` | string (date-time) \| null |  |
  | `[].updated_at` | string (date-time) \| null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver los contactos de una etapa

`GET /api/v1/kanban-settings/{kanbanSetting}/stages/{stage}/contacts` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `kanbanStage.contacts`

**Para qué sirve:** Úsalo para traer los contactos de una etapa con filtros (asesor, valor, estancados, etiquetas, lead score, fechas), por ejemplo para armar seguimientos o reportes del embudo.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `kanbanSetting` | path | string | sí |  |
| `stage` | path | string | sí |  |
| `name` | query | string | no |  |
| `search` | query | string | no |  |
| `messages` | query | string ∈ {"all", "read", "unread"} | no |  |
| `dateFrom` | query | string (date-time) | no |  |
| `dateTo` | query | string (date-time) | no |  |
| `dateBasis` | query | string ∈ {"board_entry", "created", "last_activity"} | no |  |
| `adviserId` | query | string | no |  |
| `valueMin` | query | number | no |  |
| `valueMax` | query | number | no |  |
| `stagnant` | query | boolean | no |  |
| `tagIds[]` | query | array<string> | no |  |
| `leadScoreCategories[]` | query | array<string ∈ {"insufficient_data", "hot", "warm", "cold"}> ∈ {"insufficient_data", "hot", "warm", "cold"} | no |  |
| `leadScoreMin` | query | integer | no |  |
| `leadScoreMax` | query | integer | no |  |
| `leadScoreDisqualified` | query | string \| null ∈ {"include", "exclude", "only", null} | no |  |
| `followUp` | query | string ∈ {"due", "overdue", "upcoming", "none"} | no |  |
| `followUpFrom` | query | string (date) | no |  |
| `followUpTo` | query | string (date) | no |  |
| `page` | query | integer | no |  |
| `perPage` | query | integer | no |  |
| `orderBy` | query | string ∈ {"name", "last_message_time", "stage_since", "follow_up_date"} | no |  |
| `orderByMethod` | query | string ∈ {"asc", "desc"} | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<string> |  |
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

### Ver las etapas de un contacto

`GET /api/v1/contacts/{contact}/kanban-stages` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `kanbanStage.contactStages`

**Para qué sirve:** Sirve para ver la etapa de un contacto en cada tablero, útil para reflejar su avance en el embudo dentro de tu CRM.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `contact` | path | string | sí |  |
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<ContactKanbanStageBoardResource> |  |
  | `data[].kanban_setting_id` | string | Id opaco: un texto que empieza con `knb_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].kanban_name` | string |  |
  | `data[].current_stage_id` | string | Id opaco: un texto que empieza con `stg_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].value_custom_field_id` | string | Id opaco: un texto que empieza con `fld_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].profit_custom_field_id` | string | Id opaco: un texto que empieza con `fld_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].stages` | string |  |
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

### Mover un contacto de etapa

`POST /api/v1/kanban-settings/{kanbanSetting}/move-contact` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `kanbanStage.moveContact`

**Para qué sirve:** Úsalo para mover un contacto a otra etapa del tablero cuando algo pasa en tu sistema, por ejemplo al recibir un pago o agendar una demo.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `kanbanSetting` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `contact_id` | string | sí | Id opaco: un texto que empieza con `ctc_`. Se usa tal como llega; no se arma ni se interpreta. |
| `stage_id` | string | sí | Id opaco: un texto que empieza con `stg_`. Se usa tal como llega; no se arma ni se interpreta. |

**Respuestas**

- `200` — OK
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Mover varios contactos de etapa

`POST /api/v1/kanban-settings/{kanbanSetting}/bulk-move` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `kanbanStage.bulkMove`

**Para qué sirve:** Sirve para mover muchos contactos a una misma etapa de una sola vez, por ejemplo al cerrar una campaña o importar resultados.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `kanbanSetting` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `contact_ids` | array<string> | sí |  |
| `stage_id` | string | sí | Id opaco: un texto que empieza con `stg_`. Se usa tal como llega; no se arma ni se interpreta. |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `excluded_inactive` | integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Sacar un contacto de un tablero

`POST /api/v1/kanban-settings/{kanbanSetting}/remove-contact` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `kanbanStage.removeContact`

**Para qué sirve:** Úsalo para sacar a un contacto de un tablero cuando deja de estar en ese proceso, por ejemplo si se perdió o se descartó.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `kanbanSetting` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `contact_id` | string | sí | Id opaco: un texto que empieza con `ctc_`. Se usa tal como llega; no se arma ni se interpreta. |

**Respuestas**

- `200` — OK
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Sacar varios contactos de un tablero

`POST /api/v1/kanban-settings/{kanbanSetting}/bulk-remove` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `kanbanStage.bulkRemove`

**Para qué sirve:** Sirve para sacar varios contactos de un tablero en una sola llamada.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `kanbanSetting` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `contact_ids` | array<string> | sí |  |

**Respuestas**

- `200` — OK
- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

## Los eventos

Llegan por webhook. Cómo crear uno, cómo llega cada entrega, los reintentos, el permiso que pide cada evento y cómo verificar la firma (con funciones probadas en Node.js, Python y PHP): https://developers-portal.funnelchat.app/ia/lo-basico.md.

### `contact.stage_changed`

Un contacto cambió de etapa en un tablero.

Se envía un evento por cada contacto que cambia de etapa en un tablero por etapas. `kind` es entry (entra al tablero, `from_stage` es null), move (pasa de una etapa a otra), exit (sale del tablero, `to_stage` es null) o stage_deleted (se reubica porque su etapa se borró; el nombre de la etapa borrada es null). No se envía si el contacto se coloca en la etapa en la que ya estaba.

Ejemplo:

```json
{
  "id": "evt_000000000000000000000008",
  "type": "contact.stage_changed",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "contact": {
      "id": "ctc_ABViuUDF93I2VL1tInstRDG",
      "name": "Contacto de ejemplo",
      "phone": "+5491100000000"
    },
    "board": {
      "id": "knb_AAh33Y12B0FvNpBstLof4aN",
      "name": "Embudo de ejemplo"
    },
    "kind": "move",
    "from_stage": {
      "id": "stg_AFQNmQUExx0MW4DNcQd3h0a",
      "name": "Nuevo",
      "position": 0
    },
    "to_stage": {
      "id": "stg_ABqN4Z04rHLYk42OiiXd6BT",
      "name": "En seguimiento",
      "position": 1
    },
    "workspace_id": 37
  }
}
```

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
