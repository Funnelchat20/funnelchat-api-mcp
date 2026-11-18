# Ver un flujo — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/automatizaciones/ver-un-flujo/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
