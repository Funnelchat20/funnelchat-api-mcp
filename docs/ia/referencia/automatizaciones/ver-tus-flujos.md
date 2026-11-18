# Ver tus flujos — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/automatizaciones/ver-tus-flujos/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
