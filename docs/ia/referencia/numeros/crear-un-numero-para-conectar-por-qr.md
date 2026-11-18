# Crear un número para conectar por QR — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/numeros/crear-un-numero-para-conectar-por-qr/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Crear un número para conectar por QR

`POST /api/v1/devices` · permiso **Números de WhatsApp → Crear, conectar y borrar** · área accounts · `operationId` `deviceProvisioning.store`

**Para qué sirve:** Sirve para sumar a tu cuenta, desde tu sistema y sin entrar al panel, un número que se conecta escaneando un código QR. Ocupa un lugar del plan; después pide su código con *Ver el QR de un número*.

> 🔑 **Da el control de un WhatsApp.** Por eso pide **Números de WhatsApp → Crear, conectar y borrar**: crear un número ocupa un lugar del plan, y quien escanee su QR o use un link de alta conecta un teléfono a esta cuenta. Trata el QR y la URL del link como un secreto.

Crea un número de la cuenta que se conecta escaneando un código QR con la app de WhatsApp
(`connection: "qr"`). Después pide su QR con `GET devices/{device}/qr`, o envíale a tu
cliente un link de alta (`POST connect-links` con `type: "qr"`). El proveedor lo elige
Funnelchat, igual que en el panel.

Ocupa un lugar del plan, como «Agregar número» en el panel. Con `same_number_as` (un número
de la cuenta conectado a la API oficial en coexistencia) suma QR a ese mismo número y no
ocupa un lugar nuevo.

Un número conectado por QR **no es oficial**: WhatsApp puede restringirlo o bloquearlo si
envía mensajes que la gente no espera. Para volumen, usa un número oficial (un link de alta
con `type: "meta"`).

`country` es el país desde donde se abre la sesión de WhatsApp del número (ISO 3166-1
alfa-2, por ejemplo `"mx"`). Conviene que sea el del teléfono que va a escanear el QR:
WhatsApp puede rechazar la vinculación («no se puede vincular ahora») si la sesión se abre
desde otro país. Sin `country` se usa Colombia (`co`): la llamada llega por el borde de la
API y su ubicación no es la de tu cliente, así que no sirve para elegirlo. Si Funnelchat no
tiene salida en ese país, usa la más cercana.

El workspace tiene como máximo un número por QR que nunca se conectó (si la cuenta no usa
workspaces, la cuenta entera): mientras exista, responde `409 pending_number_exists` con su
`device_id` (conéctalo o bórralo).

Con el header `Idempotency-Key` puedes reintentar sin duplicar: la misma clave con el mismo
cuerpo, desde el mismo workspace y dentro de las 24 horas, devuelve el mismo número
(`Idempotent-Replayed: true`). Otro workspace de la cuenta puede usar la misma clave sin
cruzarse con este. La
misma clave con otro cuerpo responde `422 idempotency_key_mismatch`; mientras la primera
sigue en curso, `409 operation_in_progress`. Una clave vacía o de más de 255 caracteres
responde `422 invalid_idempotency_key` y no crea nada.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `connection` | string ∈ {"qr"} | sí | How the number connects. Only `qr` today: an official (Meta) number is created by a connect link (`POST connect-links` with `type: meta`). |
| `alias` | string \| null | no | Name shown in the panel. |
| `external_reference` | string \| null | no | Your own reference for this number (for example, your customer's id). Not unique. |
| `same_number_as` | string \| null | no | Id of a number of the account that is connected to the official API in coexistence: the new QR connection is the SAME number (it does not use a new place of the plan). Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `country` | string \| null | no | Country the WhatsApp session is opened from (ISO 3166-1 alpha-2, two letters, any case): send the country of the phone that will scan the QR. Without it, the default. |

**Respuestas**

- `201`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | DeviceResource |  |
  | `data.id` | string | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.alias` | string |  |
  | `data.image` | string |  |
  | `data.color` | string |  |
  | `data.number` | string |  |
  | `data.normalized_number` | string | `number` en formato internacional normalizado, para reconocer el mismo teléfono conectado por QR y como oficial. `null` mientras el número no está conectado. |
  | `data.first_conecction_at` | string |  |
  | `data.user_id` | string | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.provider` | integer ∈ {1, 2, 3, 4} |  |
  | `data.waba_id` | string |  |
  | `data.phone_number_id` | string \| null | El identificador del número en Meta (`phone_number_id`) de un número oficial; `null` en los números por QR. |
  | `data.whatsapp_username` | string \| null |  |
  | `data.is_business` | integer |  |
  | `data.connected` | integer |  |
  | `data.active` | integer \| null |  |
  | `data.health` | string | El resumen del estado de salud de un número oficial, el mismo `health` de `GET devices/{device}/health`. `null` si el número no es oficial. |
  | `data.number_key` | string \| null | La identidad del teléfono de este número: se mantiene aunque se desconecte, y es el último teléfono para mostrar cuando `number` está vacío. |
  | `data.number_key_confirmed` | string | `true` cuando ese teléfono ya se conectó en este número; `false` si `number_key` es solo el teléfono que se espera conectar. |
  | `data.is_coexistence` | boolean |  |
  | `data.slot_state` | string | El estado del lugar del plan que ocupa: `held` (tiene o tuvo un teléfono), `pending` (todavía sin teléfono, pero ya ocupa un lugar), `reserved` (vacío y reservado por un alta en curso) o `free` (vacío, no ocupa lugar). |
  | `data.pool_suspended` | boolean | Si el número está suspendido por el plan (por ejemplo, porque el plan tiene menos lugares que números); `pool_suspension_reason` dice por qué, `pool_keep` si la cuenta eligió conservarlo y `qr_allowed` si se puede conectar por QR. |
  | `data.pool_suspension_reason` | string \| null |  |
  | `data.pool_keep` | boolean |  |
  | `data.qr_allowed` | boolean |  |
  | `data.can_change_to_meta` | boolean | `true` si este número por QR puede pasar a ser oficial en el mismo lugar, con el alta oficial del mismo teléfono. |
  | `data.connected_by_user_id` | string \| null | Quién de la cuenta hizo la conexión actual (`connected_by_name` es su nombre), o `null` si no se sabe; `abilities` dice qué puede hacer con este número quien llama. Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.connected_by_name` | string \| null |  |
  | `data.abilities` | object |  |
  | `data.capabilities` | object | Qué se puede hacer con este número por la API, según cómo está conectado. |
  | `data.connection` | string \| null ∈ {"qr", "coexistence", "dedicated", null} | Cómo está conectado el número: `qr`, `coexistence`, `dedicated`, o `null` si todavía no se sabe. `external_reference` es tu propia referencia. |
  | `data.external_reference` | string \| null |  |
  | `data.overloaded` | boolean | El número está sobrecargado (muchos grupos / conversaciones); `false` si nunca se evaluó. |
  | `data.overloaded_computed_at` | string (date-time) \| null |  |
  | `data.overloaded_groups_count` | integer \| null | En la última evaluación, cuántos grupos tenía el número; `null` si nunca se evaluó. |
  | `data.overloaded_one_to_one_count` | integer \| null |  |
  | `data.overloaded_has_pending_broadcast` | boolean |  |
  | `data.overloaded_has_active_flow` | boolean |  |
  | `data.overloaded_has_active_ai_agent` | boolean |  |
  | `data.overloaded_alert_level` | string | El evento de número sobrecargado: `loud` (sin descartar), `latent` (descartado en este episodio) o `none` (no está sobrecargado o nunca se evaluó). |
  | `data.overloaded_dismissed_at` | string (date-time) \| null |  |
  | `data.sync_all_groups` | boolean | `true` si el dueño activó "Sincronizar todos mis grupos y mensajes" para este número. |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `402` — El pago de la cuenta o del workspace está vencido (`payment_required`). Regularízalo en el panel de Funnelchat para seguir usando esta ruta.
- `403` — El plan no incluye números (`numbers_not_included`), no queda lugar (`number_limit_reached`, con `limit` y `used`) o quien llama no es el titular (`connect_not_allowed`).
- `409` — Hay otra operación en curso (`operation_in_progress`) o el workspace ya tiene un número por QR sin conectar (`pending_number_exists`, con `device_id`).
- `422` — Datos inválidos (`invalid_request`), `same_number_as` no es un número de la cuenta (`invalid_reference_device`), ese número es oficial sin coexistencia (`qr_requires_coexistence`), ya tiene QR (`method_already_present`, con `device_id`), está suspendido por el plan (`number_suspended_by_plan`), la clave de idempotencia ya se usó con otro cuerpo (`idempotency_key_mismatch`) o el header `Idempotency-Key` está vacío o tiene más de 255 caracteres (`invalid_idempotency_key`).
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
