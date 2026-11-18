# Ver cómo salió una acción de grupo — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/acciones-de-grupo/ver-como-salio-una-accion-de-grupo/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver cómo salió una acción de grupo

`GET /api/v1/groups/actions/{action}` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `apiGroupAction.show`

**Para qué sirve:** Sirve para saber cómo terminó lo que le pediste a un grupo, como mandarle un mensaje: si sigue en cola, se está haciendo, terminó o falló, y su resultado.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `action` | path | string | sí |  |

**Respuestas**

- `200` — El estado de la acción y, si terminó `completed`, su resultado.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | ApiGroupActionResource |  |
  | `data.action_id` | string | Id de la acción: el `action_id` del `202`. |
  | `data.type` | string ∈ {"create_group", "add_participants", "remove_participants", "promote_admins", "demote_admins", "update_name", "update_description", "update_photo", "update_settings", "renew_invite_link", "send_message", "approve_join_requests", "reject_join_requests"} | Tipo de acción. |
  | `data.status` | string ∈ {"queued", "running", "completed", "failed"} | Estado de la acción. |
  | `data.device_id` | string \| null | Número que ejecuta la acción; `null` si es de otro workspace que el de la key. Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.group` | object \| null | Grupo de la acción; `null` si todavía no existe (una creación sin terminar) o es de otro workspace que el de la key. |
  | `data.result` | object \| null | Resultado de una acción `completed`; `null` mientras está `queued` o `running` y cuando termina `failed`. Su forma depende de `type`: `{"participants": [...]}` (una lista, en el orden del pedido) para las acciones con lista de teléfonos; `{"group": {"uid", "name"}, "invite_link"}` para `create_group`; `{"invite_link"}` para `renew_invite_link`; `{"message": {"uid"}}` para `send_message`; `{}` para las demás. Es el mismo `result` del evento `group_action.completed`. |
  | `data.reason` | string \| null | Motivo de una acción `failed`; `null` en los demás estados. Vocabulario cerrado: la sección «Motivos» de «Acciones de grupo». |
  | `data.created_at` | string \| null |  |
  | `data.started_at` | string \| null |  |
  | `data.completed_at` | string \| null |  |
  | `data.failed_at` | string \| null |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)

## Secciones citadas

Las secciones de la descripción general de cada área que citan las llamadas y los eventos de este texto, tal como las escribe el área.

### Acciones de grupo

#### Motivos

El `reason` de una acción `failed`, el de cada persona `failed` en `result.participants` y el de `group_action.failed` usan un único vocabulario cerrado; cualquier otro caso sale como `internal_error`, nunca con el texto del proveedor. Los valores posibles son: `max_pending_days_exceeded`, `max_retries_exceeded`, `owner_not_connected`, `no_creator_available_suspended`, `parent_group_creation_failed`, `permanent_condition_unmet`, `unexpected_job_failure`, `device_not_found`, `device_not_configured`, `disconnected_device`, `not_connected`, `not_respond`, `not_initialize`, `group_forbidden`, `phone_not_exists`, `creation_unconfirmed`, `creation_rejected`, `expired`, `window_closed`, `number_restricted`, `capacity_full`, `invite_capacity_full`, `duplicate_invite`, `template_params_missing`, `template_mismatch`, `participant_not_found`, `cannot_remove_business_number`, `pending_subscription`, `provider_error`, `provider_unsupported`, `not_permitted`, `group_not_found`, `orphan_standalone_action`, `standalone_context_mismatch`, `disabled`, `plan_cap_reached`, `device_not_group_number`, `device_not_connected`, `device_not_group_admin`, `unsupported_group_type`, `join_request_not_found`, `internal_error`.

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
