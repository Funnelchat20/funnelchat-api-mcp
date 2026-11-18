# Ver un número — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/numeros/ver-un-numero/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver un número

`GET /api/v1/devices/{device}` · permiso **Números de WhatsApp → Ver** · área accounts · `operationId` `device.show`

**Para qué sirve:** Úsalo para ver los datos de un número: alias, proveedor, WABA, nombre de usuario, si está conectado y su estado de salud.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí | The device ID |

**Respuestas**

- `200` — El número.

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

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `402` — El pago de la cuenta o del workspace está vencido (`payment_required`). Regularízalo en el panel de Funnelchat para seguir usando esta ruta.
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `404` — Not found (`AccountsModelNotFoundException`)
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
