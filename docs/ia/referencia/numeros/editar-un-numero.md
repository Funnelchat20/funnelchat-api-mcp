# Editar un número — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/numeros/editar-un-numero/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Editar un número

`PUT /api/v1/devices/{device}` · permiso **Números de WhatsApp → Editar** · área accounts · `operationId` `device.update`

**Para qué sirve:** Sirve para cambiar los datos de un número: su alias, su color, su imagen o tu `external_reference`. Lo que no mandas no cambia.

Cambia los datos del número, por ejemplo `alias`, `color`, `image`, tu
`external_reference`. Los campos que no envíes no cambian.

Conectar un número oficial con esta ruta (mandar el `code` del alta de Meta, con `waba_id` y
`phone_number_id`) da el control de un WhatsApp: con una clave pide además **Números de
WhatsApp → Crear, conectar y borrar**, y sin ese permiso responde `403 permission_denied` sin
tocar nada. `waba_id` y `phone_number_id` sin `code` no conectan nada y no lo piden.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí | The device ID |

**Cuerpo** (`application/json`)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `alias` | string \| null | no |  |
| `color` | string \| null | no |  |
| `image` | string (uri) \| null | no |  |
| `number` | string \| null | no |  |
| `first_conecction_at` | string (date-time) \| null | no |  |
| `is_business` | boolean | no |  |
| `phone_number_id` | string | no |  |
| `waba_id` | string | no |  |
| `code` | string | no |  |
| `whatsApp_business_app` | boolean | no |  |
| `capi_consent` | boolean | no | Solo en un número oficial, al conectarlo: el consentimiento para activar la Conversions API de Meta. Sin efecto si la Conversions API no está habilitada para la cuenta. |
| `external_reference` | string \| null | no | Tu propia referencia para este número (por ejemplo, el id de tu cliente). Con `null` se borra. Se guarda solo si la edición sale bien. |

**Respuestas**

- `200` — El número editado.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `alias` | string |  |
  | `image` | string |  |
  | `color` | string |  |
  | `number` | string |  |
  | `normalized_number` | string | `number` en formato internacional normalizado, para reconocer el mismo teléfono conectado por QR y como oficial. `null` mientras el número no está conectado. |
  | `first_conecction_at` | string |  |
  | `user_id` | string | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `provider` | integer ∈ {1, 2, 3, 4} |  |
  | `waba_id` | string |  |
  | `phone_number_id` | string \| null | El identificador del número en Meta (`phone_number_id`) de un número oficial; `null` en los números por QR. |
  | `whatsapp_username` | string \| null |  |
  | `is_business` | integer |  |
  | `connected` | integer |  |
  | `active` | integer \| null |  |
  | `health` | string | El resumen del estado de salud de un número oficial, el mismo `health` de `GET devices/{device}/health`. `null` si el número no es oficial. |
  | `number_key` | string \| null | La identidad del teléfono de este número: se mantiene aunque se desconecte, y es el último teléfono para mostrar cuando `number` está vacío. |
  | `number_key_confirmed` | string | `true` cuando ese teléfono ya se conectó en este número; `false` si `number_key` es solo el teléfono que se espera conectar. |
  | `is_coexistence` | boolean |  |
  | `slot_state` | string | El estado del lugar del plan que ocupa: `held` (tiene o tuvo un teléfono), `pending` (todavía sin teléfono, pero ya ocupa un lugar), `reserved` (vacío y reservado por un alta en curso) o `free` (vacío, no ocupa lugar). |
  | `pool_suspended` | boolean | Si el número está suspendido por el plan (por ejemplo, porque el plan tiene menos lugares que números); `pool_suspension_reason` dice por qué, `pool_keep` si la cuenta eligió conservarlo y `qr_allowed` si se puede conectar por QR. |
  | `pool_suspension_reason` | string \| null |  |
  | `pool_keep` | boolean |  |
  | `qr_allowed` | boolean |  |
  | `can_change_to_meta` | boolean | `true` si este número por QR puede pasar a ser oficial en el mismo lugar, con el alta oficial del mismo teléfono. |
  | `connected_by_user_id` | string \| null | Quién de la cuenta hizo la conexión actual (`connected_by_name` es su nombre), o `null` si no se sabe; `abilities` dice qué puede hacer con este número quien llama. Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `connected_by_name` | string \| null |  |
  | `abilities` | object |  |
  | `abilities.connect` | boolean |  |
  | `abilities.disconnect` | boolean |  |
  | `abilities.delete` | boolean |  |
  | `abilities.update` | boolean |  |
  | `capabilities` | object | Qué se puede hacer con este número por la API, según cómo está conectado. |
  | `capabilities.messages` | object |  |
  | `capabilities.groups` | object |  |
  | `capabilities.statuses` | array<string> |  |
  | `connection` | string \| null ∈ {"qr", "coexistence", "dedicated", null} | Cómo está conectado el número: `qr`, `coexistence`, `dedicated`, o `null` si todavía no se sabe. `external_reference` es tu propia referencia. |
  | `external_reference` | string \| null |  |
  | `overloaded` | boolean | El número está sobrecargado (muchos grupos / conversaciones); `false` si nunca se evaluó. |
  | `overloaded_computed_at` | string (date-time) \| null |  |
  | `overloaded_groups_count` | integer \| null | En la última evaluación, cuántos grupos tenía el número; `null` si nunca se evaluó. |
  | `overloaded_one_to_one_count` | integer \| null |  |
  | `overloaded_has_pending_broadcast` | boolean |  |
  | `overloaded_has_active_flow` | boolean |  |
  | `overloaded_has_active_ai_agent` | boolean |  |
  | `overloaded_alert_level` | string | El evento de número sobrecargado: `loud` (sin descartar), `latent` (descartado en este episodio) o `none` (no está sobrecargado o nunca se evaluó). |
  | `overloaded_dismissed_at` | string (date-time) \| null |  |
  | `sync_all_groups` | boolean | `true` si el dueño activó "Sincronizar todos mis grupos y mensajes" para este número. |

- `400` — El número no admite esta edición (`unsupported_provider`).
- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `402` — El pago de la cuenta o del workspace está vencido (`payment_required`). Regularízalo en el panel de Funnelchat para seguir usando esta ruta.
- `403` — Con una clave, el cuerpo trae `code` (el alta oficial de Meta) y la clave no tiene **Números de WhatsApp → Crear, conectar y borrar** (`permission_denied`).
- `404` — Not found (`AccountsModelNotFoundException`)
- `409` — El número fue dado de baja (`device_retired`), está suspendido por el plan (`number_suspended_by_plan`) o hay otra operación en curso sobre los números de la cuenta (`operation_in_progress`).
- `422` — Validation error (`AccountsValidationException`)
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
