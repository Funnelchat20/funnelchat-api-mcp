# Administrar tus números — API de Funnelchat: contexto para tu IA

> Copiado de /docs/mas-funciones/whatsapp/#administrar-tus-numeros. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Administrar un número: ver uno, su estado, desconectarlo y su salud

- `{device}` es el `id` del número en `GET /api/v1/devices`. Si la persona no dice cuál, lista sus números y pregúntale;
  no elijas por ella.
- **Ver un número:** `GET /api/v1/devices/{device}` (la clave necesita **Números de WhatsApp → Ver**). Trae, entre otros,
  `alias`, `number` (`null` mientras no está conectado), `connected` (`1` conectado, `0` no), `connection` (`qr`,
  `coexistence`, `dedicated`, o `null` si todavía no se sabe; `coexistence` y `dedicated` son oficiales),
  `external_reference` (tu propia referencia), `health` (el resumen de la salud de un número oficial; `null` si no es
  oficial), `slot_state` (el lugar del plan que ocupa: `held`, `pending`, `reserved` o `free`), `abilities` (qué
  puede hacer con ese número quien llama: `connect`, `disconnect`, `delete`, `update`) y `capabilities` (qué se puede
  mandar por la API con ese número, según cómo está conectado). `404` si el número no es de la cuenta.
- **Ver el estado de un número:** `GET /api/v1/devices/{device}/status` (la clave necesita **Números de WhatsApp →
  Ver**). `accountStatus` es el estado de la sesión de WhatsApp del número; la especificación no enumera sus valores ni
  describe el resto de la respuesta: lee lo que llega antes de depender de un valor. Para decidir si está conectado,
  usa `connected` de `GET /api/v1/devices/{device}` (`1` o `0`). `404` si el número no es de la cuenta.
- **Con una clave, el estado nunca trae el QR:** `qrCode` llega siempre vacío (`""`), también con el número
  desconectado. No lo esperes ni consultes esta llamada en un bucle para conseguirlo: para conectar o reconectar un
  número, crea un link de alta con `POST /api/v1/connect-links` (con el `device_id` del número para reconectarlo; ver
  «Volver a conectarlo», abajo) y dale la `url` a la persona o, si es por QR y su sistema va a mostrar el código, pídelo
  con `GET /api/v1/devices/{device}/qr` (ver «Conectar un número por QR desde tu sistema», abajo).

## Desconectar un número

- **No se puede deshacer, y corta el número:** deja de mandar y recibir mensajes hasta que se vuelva a conectar. Hazlo
  solo cuando la persona lo pide de forma explícita para ese número: confírmale cuál es (alias y número) antes de
  llamar. Nunca lo uses para «probar» ni para arreglar un envío que falló.
- `POST /api/v1/devices/{device}/clean`, sin cuerpo. La clave necesita **Números de WhatsApp → Crear, conectar y
  borrar**. Es lo mismo que «Desconectar» en el panel: no borra el número ni libera su lugar en el plan; se conservan el
  alias, el color, la imagen, el historial y la identidad del número, y `number` queda en `null` hasta que se vuelva a
  conectar.
- La respuesta (`200`) trae el número en `data` y, en `numbers_capacity`, el uso de los lugares del plan (puede no venir
  si no se pudo calcular).
- **Por QR**, se cierra la sesión de WhatsApp: para volver a conectarlo hay que escanear un QR nuevo (el de `GET /api/v1/devices/{device}/qr` o el de un link de alta). **Oficial**, deja
  de mandar y recibir hasta que se conecte otra vez con el alta oficial: vuelve el mismo número, en el mismo lugar. Si
  el mismo teléfono también está en la cuenta por QR, ese número vuelve a recibir los chats uno a uno.
- **Volver a conectarlo:** `POST /api/v1/connect-links` con el `device_id` del número (`{"type": "qr", "device_id":
  "dev_Ac7Ku7iIZDXJTjdCu0UB1mX"}` por QR; con `type` `meta` y `allowed_connection_types` si es oficial). Detalle en «Conectar un número».
- **El webhook:** si el número era oficial y estaba conectado, llega `device.disconnected` con
  `reason: disconnected_by_user`. De un número por QR, la especificación no dice qué evento llega al desconectarlo: no
  esperes uno para confirmar; confirma con `GET /api/v1/devices/{device}` (`connected` en `0`).
- Errores: `409` con `device_retired` (el número fue dado de baja) u `operation_in_progress` (hay otra operación en
  curso sobre los números de la cuenta: reintenta en unos segundos); en los dos, no cambió nada. `404`: el número no es
  de la cuenta. `403`: a la clave le falta la casilla.

## La salud de un número oficial

- `GET /api/v1/devices/{device}/health` (la clave necesita **Números de WhatsApp → Ver**): el último estado guardado
  que informó Meta. Trae `health` (si el número puede mandar), `identity`, `entities`, `throughput_level` (el nivel de
  rendimiento de envío que Meta le da al número: `standard`, `high` o `unknown`; `null` si todavía no hay datos),
  `history` y `meta_billing`.
- No le pregunta a Meta en el momento: es lo último que se guardó. Para pedirle el estado de ahora,
  `POST /api/v1/devices/{device}/health/refresh` (ver «La salud de un número oficial: pedirla a Meta y sus eventos»,
  abajo).
- La descripción general de la API nombra estos estados de envío de un número oficial: `available`, `limited`,
  `blocked` y `unknown`. Esta llamada no los enumera: lee el valor que llega.
- Con un número que no es oficial responde `422 device_not_meta`. Mira antes su `connection` en
  `GET /api/v1/devices/{device}`: solo `coexistence` y `dedicated` tienen salud.

## Conectar un número por QR desde tu sistema

- Hay dos maneras de conectar por QR: el link de alta (la página de Funnelchat muestra el QR; ver «Conectar un
  número») o mostrar tú el código. Si lo va a conectar un cliente de la persona, usa el link; usa estas dos llamadas
  solo si su sistema va a mostrar el QR.
- Antes, mira `GET /api/v1/devices`: si ya hay un número que le sirve, úsalo; no crees otro.
- **1.** `POST /api/v1/devices` con `{"connection": "qr"}` y, si quieres, `alias`, `external_reference` y `country`
  (el país del teléfono que va a escanear; sin él, `co`). Responde `201` con el número en `data`: su `id` es el
  `{device}` de todo lo demás. Manda el header `Idempotency-Key` (de 1 a 255 caracteres) para reintentar sin crear
  dos: la misma clave con el mismo cuerpo, dentro de 24 horas, devuelve el mismo número.
- **2.** `GET /api/v1/devices/{device}/qr`. Aunque es un `GET`, pide **Números de WhatsApp → Crear, conectar y
  borrar**. Trae `connected`, `qr_code` (una imagen PNG en data URI, o `null` mientras arranca la sesión) y
  `expires_in`; la especificación también los muestra dentro de `data`: búscalos en los dos lugares. Pídelo otra vez
  cada `expires_in` segundos y muestra solo el último; con `qr_code` en `null`, deja de mostrar el anterior. Terminó
  cuando `connected` es `true` (también llega `device.connected`). Quien escanea el QR conecta un teléfono a la
  cuenta: no lo guardes, no lo reenvíes y no lo pongas en un log.
- `409 pending_number_exists` trae el `device_id` de un número por QR que nunca se conectó: pide el QR de ese en lugar
  de crear otro, o pregúntale a la persona si lo borra.
- Para reconectar un número por QR desconectado (`connected` en `0`), pide su QR con su `id`: es el mismo número, en
  el mismo lugar del plan. Con un número oficial, el QR responde `422 provider_unsupported`.
- `same_number_as` (el `id` de un número oficial en coexistencia) suma QR a ese mismo número sin ocupar otro lugar.
- Los `403` (sin números en el plan, sin lugar, no es el titular), el `402 payment_required` (el pago de la cuenta
  o del workspace está vencido) y los `409` del QR no se arreglan reintentando: díselo a la persona. `502 provider_error`: el proveedor no respondió; reintenta.

## Los links de alta: seguirlos y anularlos

- `GET /api/v1/connect-links` (por páginas, `links.next`; filtros `status` y `external_reference`, igualdad exacta)
  y `GET /api/v1/connect-links/{link}`, con el `id` que dio el `POST`. Ninguno trae la URL: si la persona la perdió,
  no se puede recuperar; ofrécele anular ese link y crear otro.
- `error_code` dice por qué no se completó. Un link `meta` sigue `pending`, sin `error_code`, después de un intento
  fallido de Facebook o de Meta, y pasa a `failed` al quinto.
- **Anular:** `DELETE /api/v1/connect-links/{link}`. Hazlo solo si la persona lo pide de forma explícita para eso;
  confírmale qué link vas a anular (su `external_reference` e `id`) antes de llamar. Solo un link `pending` (si no,
  `409 link_not_pending`). Después, el link ya no sirve; si la página ya había creado un número que no se conectó,
  ese número se borra.

## Editar, reiniciar la sesión o borrar un número

- **No confundas las tres que cortan un número.** Desconectar (`POST /api/v1/devices/{device}/clean`): deja de mandar
  y recibir, y el mismo número se vuelve a conectar en el mismo lugar. Reiniciar la sesión
  (`PUT /api/v1/devices/{device}/reset`, «Borrar datos» en el panel): borra los datos del número conectado en ese lugar
  para conectar ahí uno **distinto**; el lugar sigue ocupado y se conserva el alias. Borrar
  (`DELETE /api/v1/devices/{device}`): quita el número y libera su lugar. Si la persona dice «reinicia mi número»
  porque algo no anda, no uses reset: mira antes su estado, su salud y su actividad, y pregúntale qué quiere.
- Reiniciar y borrar **no se pueden deshacer** y piden **Números de WhatsApp → Crear, conectar y borrar**. Hazlo solo si
  la persona lo pide de forma explícita para eso; confírmale qué número vas a reiniciar o borrar (alias, número e `id`)
  antes de llamar.
- Después de reiniciar, el número nuevo se conecta con `GET /api/v1/devices/{device}/qr` (por QR) o con el alta
  oficial. Si era oficial y estaba conectado, llega `device.disconnected` con `reason` `disconnected_by_user`.
- Al borrar: `200` con el cuerpo vacío y llega `device.deleted`. Si el mismo teléfono también estaba en la cuenta por QR
  (`same_number_as`), ese sigue y vuelve a recibir los chats uno a uno. `409 operation_in_progress` (en las tres): no
  cambió nada; reintenta en unos segundos.
- **Editar:** `PUT /api/v1/devices/{device}` (**Números de WhatsApp → Editar**) con lo que cambia: `alias`, `color`,
  `image` o `external_reference` (`null` la borra). Lo que no mandas no cambia. Los demás campos del cuerpo (`number`,
  `waba_id`, `phone_number_id`, `code`…): sin descripción todavía en la especificación. `400 unsupported_provider`: ese número no
  admite la edición.

## Nombre de usuario de un número

- **Nombre de usuario** (solo números oficiales conectados): `GET /api/v1/devices/{device}/username`
  (lo consulta en Meta; si Meta no devuelve ninguno, el último que se reservó; `null` si no tiene),
  `GET /api/v1/devices/{device}/username/suggestions` (`suggestions`) y `POST /api/v1/devices/{device}/username` con
  `{"username": "..."}` (de 3 a 35 caracteres: minúsculas, números, puntos y guiones bajos; **Números de WhatsApp →
  Editar**). Confírmale a la persona el nombre exacto antes de reservar.
  - `422 device_not_meta`: el número no es oficial. `422 device_not_ready`: todavía no está conectado a Meta. En los
    dos, reintentar no sirve.
  - `meta_error`: Meta rechazó el pedido (por ejemplo, el nombre ya está tomado). La respuesta lleva el mismo código
    HTTP que dio Meta y su motivo en `message`: díselo a la persona.
  - `502 provider_error`: Meta no respondió; reintenta.
- Si no le llegan mensajes a un servidor de la persona, no hay nada que configurar en el número: para recibir mensajes y
  estados, `POST /api/v1/webhooks` (y, si ya tiene uno, revísalo con `GET /api/v1/webhooks`).

## La salud de un número oficial: pedirla a Meta y sus eventos

- `POST /api/v1/devices/{device}/health/refresh` (**Números de WhatsApp → Editar**): lo mismo que
  `GET /api/v1/devices/{device}/health`, más `refresh_outcome`. `refreshed`: se consultó a Meta (si Meta respondió con
  un error, se ve en la salud que llega). `not_refreshed_yet`: no se consultó, porque se actualizó hace menos de 60
  segundos o hay otra actualización en curso; los datos son los últimos guardados. Espera y vuelve a pedirla una vez;
  no en un bucle. `422 device_not_meta` si no es oficial.
- **Eventos:** crea un webhook con `POST /api/v1/webhooks`; la clave necesita **Avisos (webhooks) → Administrar** y,
  por estos eventos, **Números de WhatsApp → Ver**.
  - `device.health_changed`: `data.previous_state` y `data.state` (`available`, `limited`, `blocked` o `unknown`).
    Sale solo cuando el estado cambia; el motivo está en `GET /api/v1/devices/{device}/health`.
  - `device.quality_changed`: `data.previous` y `data.current` (`GREEN`, `YELLOW` o `RED`). Si baja, sugiérele a la
    persona frenar los envíos de ese número.
  - `device.messaging_limit_changed`: `data.previous` y `data.current` (`TIER_250`, `TIER_1K`, `TIER_2K`, `TIER_10K`,
    `TIER_100K` o `TIER_UNLIMITED`). Meta fija el límite por empresa: llega uno por cada número de la cuenta que cambió.
  - `device.display_name_reviewed`: `data.decision` (`approved` o `rejected`), `data.previous_status`, `data.status`,
    `data.verified_name` y `data.rejection_reason` (el motivo de Meta en un rechazo, o `null`).
  - `device.deleted`: un número se borró, desde el panel, por la API o porque un link de alta venció sin conectarlo;
    trae `data.deleted_at`.
- Todos traen `data.device` (`id`, `name`, `number`, `connection`, `external_reference`), `data.connect_link_id` (el
  link que conectó el número por última vez, o `null`) y `data.workspace_id`. Los cuatro de salud no llegan a webhooks
  filtrados por campaña (`filters.campaign_ids`). Calidad, límite y nombre visible salen una vez por cambio real: no se
  repiten si Meta informa lo mismo, no salen cuando el valor pasa de o a «sin datos» (`NA`, `UNKNOWN`,
  `TIER_NOT_SET`) y pueden llegar con unos minutos de demora.

## El historial de conexión de un número

- **Historial de conexión:** `GET /api/v1/devices/{device}/connection-history`, por páginas (`links.next`), de lo más
  reciente a lo más viejo. Cada fila trae `phone`, `event` (`0` o `1`) y `created_at`. La especificación no dice cuál
  de los dos valores es conexión y cuál desconexión: no lo afirmes. No mandes `orderBy` ni `orderByMethod` aunque
  figuren: el orden es fijo y un parámetro de orden responde `422`.
- Para «¿anda bien mi número?», empieza por `GET /api/v1/devices/{device}/status` y, si es oficial, por
  `GET /api/v1/devices/{device}/health`.
- Para saber si a un número oficial se le puede mandar texto libre a un contacto, «Ver la ventana de 24 horas de un
  contacto» (en «Contactos y conversaciones»).

## La cola de mensajes de un número

- **La cola:** `GET /api/v1/devices/{device}/message-queue` (pagina con `page` y `perPage`) y
  `GET /api/v1/devices/{device}/message-queue/count` (`502`: el proveedor no respondió; reintenta). La especificación no
  describe los campos de la cola ni qué números la tienen: lee lo que llega.
- **Sacar mensajes** (`DELETE /api/v1/devices/{device}/message-queue?messageUids[]=...`, **Números de WhatsApp →
  Editar**) y **vaciar la cola** (`DELETE /api/v1/devices/{device}/message-queue/all`, **Números de WhatsApp → Crear,
  conectar y borrar**): hazlo solo si la persona lo pide de forma explícita para eso; confírmale qué vas a sacar (el
  número, con alias e `id`, y cuáles mensajes o cuántos) antes de llamar. Vaciar **no se puede deshacer**: descarta
  todos los mensajes encolados sin dejar registro de lo descartado. La especificación no dice de qué campo de la cola
  sale cada `messageUid`: búscalo en lo que llega y, si no lo encuentras, no adivines.

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

### Ver el estado de un número

`GET /api/v1/devices/{device}/status` · permiso **Números de WhatsApp → Ver** · área accounts · `operationId` `device.status`

**Para qué sirve:** Úsalo para chequear el estado de la sesión de WhatsApp de un número, por ejemplo antes de lanzar envíos o para monitorear tus números. Con una clave nunca trae el código QR: para conectar o reconectar un número, usa un link de alta.

`accountStatus` es el estado de la sesión de WhatsApp del número. Con una clave de API esta
llamada nunca trae el QR. En un número por QR, `qrCode` llega siempre vacío (`""`), también
con el número desconectado; para conectarlo, pide el código con `GET devices/{device}/qr`,
que pide **Números de WhatsApp → Crear, conectar y borrar**. Un número oficial no tiene QR:
su respuesta no trae `qrCode`, solo `accountStatus` (`authenticated` o `pending_login`).

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí | The device ID |

**Respuestas**

- `200`
- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `404` — Not found (`AccountsModelNotFoundException`)
- `409` — El número por QR no tiene sesión de WhatsApp (`device_not_connected`): conéctalo antes de consultar su estado.
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`
- `502` — El proveedor de WhatsApp no respondió (`provider_error`). Vuelve a intentarlo.

### Desconectar un número

`POST /api/v1/devices/{device}/clean` · permiso **Números de WhatsApp → Crear, conectar y borrar** · área accounts · `operationId` `device.clean`

> **No se puede deshacer.** Pide confirmación explícita antes de llamarla (`references/shared/limites-de-ejecucion.md`).

**Para qué sirve:** Úsalo para desconectar un número sin borrarlo, como «Desconectar» en el panel: conserva su lugar en el plan y su historial, y para volver a usarlo hay que conectarlo otra vez. No se puede deshacer. Requiere **Números de WhatsApp → Crear, conectar y borrar**.

> ⚠️ **No se puede deshacer:** cierra la conexión del número, que deja de mandar y recibir hasta que lo vuelvas a conectar: uno por QR, escaneando un código QR nuevo; uno oficial, con el alta oficial. Conserva su lugar en el plan y su historial.

Lo mismo que «Desconectar» en el panel: cierra la conexión del número sin borrar su
información ni liberar su lugar en el plan. Se conservan el alias, el color, la imagen,
el historial y la identidad del número; `number` queda en `null` hasta que se vuelva a
conectar.

- Por QR: se cierra la sesión de WhatsApp. Para volver a conectarlo hay que escanear un
  QR nuevo (`GET devices/{device}/qr`).
- Oficial: deja de enviar y recibir hasta que se conecte otra vez con el alta oficial;
  vuelve el mismo número, en el mismo lugar. Si estaba conectado llega el webhook
  `device.disconnected` con `reason: disconnected_by_user`. Si el mismo teléfono también
  está en la cuenta por QR, ese número vuelve a recibir los chats uno a uno.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí | The device ID |

**Respuestas**

- `200` — El número desconectado en `data`, y en `numbers_capacity` el uso de los lugares del plan (no aparece si no se pudo calcular).

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<any> |  |
  | `numbers_capacity` | string \| null |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `402` — El pago de la cuenta o del workspace está vencido (`payment_required`). Regularízalo en el panel de Funnelchat para seguir usando esta ruta.
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `404` — Not found (`AccountsModelNotFoundException`)
- `409` — El número fue dado de baja (`device_retired`) o hay otra operación en curso sobre los números de la cuenta (`operation_in_progress`). No cambió nada.
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Ver la salud de un número oficial

`GET /api/v1/devices/{device}/health` · permiso **Números de WhatsApp → Ver** · área accounts · `operationId` `deviceHealth.show`

**Para qué sirve:** Úsalo para ver la salud de un número de WhatsApp Cloud (estado, identidad, nivel de throughput e historial de cambios) a partir del último dato guardado, sin consultar a Meta.

El último estado guardado que informó Meta: si el número puede enviar (`health`), su
identidad, el nivel de rendimiento y el historial. No consulta a Meta en el momento: para
eso, `POST devices/{device}/health/refresh`. Solo para números oficiales.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí | The device ID |

**Respuestas**

- `200` — El estado de salud del número.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `health` | string |  |
  | `identity` | string |  |
  | `meta_status` | string \| null | El estado del número en Meta en minúsculas (`connected`, `flagged`, `restricted`, `banned`, ...), igual que `health.meta_status`; `null` si todavía no se sabe. |
  | `entities` | string |  |
  | `throughput_level` | string | El nivel de rendimiento de envío que Meta le asigna al número: `standard`, `high` o `unknown`; `null` si todavía no hay datos. |
  | `history` | array<object> |  |
  | `history[].field` | string |  |
  | `history[].previous_value` | string |  |
  | `history[].new_value` | string |  |
  | `history[].detail` | string \| null |  |
  | `history[].source` | string |  |
  | `history[].occurred_at` | string |  |
  | `meta_billing` | object \| null |  |
  | `meta_billing.waba_id` | string \| null |  |
  | `meta_billing.business_id` | string \| null |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `404` — Not found (`AccountsModelNotFoundException`)
- `422` — El número no es oficial (`device_not_meta`).
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Ver tus links de alta

`GET /api/v1/connect-links` · permiso **Números de WhatsApp → Ver** · área accounts · `operationId` `connectLink.index`

**Para qué sirve:** Úsalo para seguir los links de alta de la cuenta, del más nuevo al más viejo, filtrando por estado o por tu `external_reference`.

**Listado** · `perPage` de 1 a 100 (por defecto 25) · orden fijo: id descendente · no acepta parámetros de orden.

Los links del workspace, del más nuevo al más viejo, sin la URL (el token no se guarda).
Filtra por `status` (`pending`, `completed`, `failed`, `expired`, `revoked`) y por
`external_reference` (igualdad exacta).

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `status` | query | string \| null ∈ {"pending", "completed", "failed", "expired", "revoked", null} | no |  |
| `external_reference` | query | string \| null | no |  |

**Respuestas**

- `200` — Los links de alta, paginados.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<ConnectLinkResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `lnk_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].type` | string |  |
  | `data[].status` | string |  |
  | `data[].url` | string |  |
  | `data[].expires_at` | string |  |
  | `data[].allowed_connection_types` | array<string> \| null |  |
  | `data[].provision_us_number` | boolean |  |
  | `data[].country` | string \| null |  |
  | `data[].device_id` | string \| null | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].external_reference` | string \| null |  |
  | `data[].return_url` | string \| null |  |
  | `data[].error_code` | string \| null |  |
  | `data[].created_at` | string \| null |  |
  | `data[].completed_at` | string \| null |  |
  | `links` | object |  |
  | `links.first` | string \| null |  |
  | `links.last` | string \| null |  |
  | `links.prev` | string \| null |  |
  | `links.next` | string \| null |  |
  | `meta` | object |  |
  | `meta.current_page` | integer |  |
  | `meta.from` | integer \| null |  |
  | `meta.last_page` | integer |  |
  | `meta.links` | array<object> | Generated paginator links. |
  | `meta.path` | string \| null | Base path for paginator generated URLs. |
  | `meta.per_page` | integer | Number of items shown per page. |
  | `meta.to` | integer \| null | Number of the last item in the slice. |
  | `meta.total` | integer | Total number of items being paginated. |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `422` — Validation error (`AccountsValidationException`)
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Ver un link de alta

`GET /api/v1/connect-links/{link}` · permiso **Números de WhatsApp → Ver** · área accounts · `operationId` `connectLink.show`

**Para qué sirve:** Sirve para consultar en qué quedó un link de alta: si sigue pendiente, se completó o falló, qué número conectó y, si no se completó, por qué (`error_code`).

El estado actual del link, sin la URL. `error_code` explica por qué no se completó:
`link_expired`, `already_used`, `revoked`, `quota_exceeded`, `trial_number_blocked`,
`facebook_auth_failed`, `meta_error`, `number_not_owned`, `qr_timeout` o `provider_error`.
Un link `meta` sigue `pending` (sin `error_code`) después de un intento fallido de Facebook
o de Meta, y pasa a `failed` al quinto.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `link` | path | string | sí |  |

**Respuestas**

- `200`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | ConnectLinkResource |  |
  | `data.id` | string | Id opaco: un texto que empieza con `lnk_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.type` | string |  |
  | `data.status` | string |  |
  | `data.url` | string |  |
  | `data.expires_at` | string |  |
  | `data.allowed_connection_types` | array<string> \| null |  |
  | `data.provision_us_number` | boolean |  |
  | `data.country` | string \| null |  |
  | `data.device_id` | string \| null | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.external_reference` | string \| null |  |
  | `data.return_url` | string \| null |  |
  | `data.error_code` | string \| null |  |
  | `data.created_at` | string \| null |  |
  | `data.completed_at` | string \| null |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `404` — El link no existe o no es de la cuenta.
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Anular un link de alta

`DELETE /api/v1/connect-links/{link}` · permiso **Números de WhatsApp → Crear, conectar y borrar** · área accounts · `operationId` `connectLink.destroy`

**Para qué sirve:** Úsalo para anular un link de alta pendiente que ya no quieres que se use, por ejemplo si se lo mandaste a quien no correspondía.

> 🔑 **Da el control de un WhatsApp.** Por eso pide **Números de WhatsApp → Crear, conectar y borrar**: crear un número ocupa un lugar del plan, y quien escanee su QR o use un link de alta conecta un teléfono a esta cuenta. Trata el QR y la URL del link como un secreto.

Solo un link `pending`: después de revocarlo, la página responde que el link ya no sirve.
Si la página ya había creado un número que todavía no se conectó, ese número se borra.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `link` | path | string | sí |  |

**Respuestas**

- `204` — Revocado.
- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `404` — El link no existe o no es de la cuenta.
- `409` — El link ya no está pendiente (`link_not_pending`).
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

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

### Ver el QR de un número

`GET /api/v1/devices/{device}/qr` · permiso **Números de WhatsApp → Crear, conectar y borrar** · área accounts · `operationId` `deviceProvisioning.qr`

**Para qué sirve:** Úsalo para mostrar en tu sistema el código QR de un número por QR y saber cuándo quedó conectado: devuelve la imagen, si ya está conectado y en cuántos segundos volver a pedirlo.

> 🔑 **Da el control de un WhatsApp.** Por eso pide **Números de WhatsApp → Crear, conectar y borrar**: crear un número ocupa un lugar del plan, y quien escanee su QR o use un link de alta conecta un teléfono a esta cuenta. Trata el QR y la URL del link como un secreto.

El código QR para conectar un número por QR: se escanea con la app de WhatsApp
(Dispositivos vinculados). Si el número todavía no tiene sesión con el proveedor, la crea.
Cada llamada trae el código de ese momento: WhatsApp lo cambia cada pocos segundos hasta
que se escanea, y uno viejo no vincula («no se puede vincular el dispositivo ahora»).
Pídelo de nuevo cada `expires_in` segundos (hoy **5**, la misma cadencia del panel) y
reemplaza la imagen con la última; no guardes ni reenvíes un QR. Con el número conectado,
`connected` es `true` y `qr_code` es `null`; también llega el webhook `device.connected`.

`qr_code` es una imagen PNG en data URI (`data:image/png;base64,...`), o `null` mientras la
sesión arranca: en ese caso deja de mostrar el QR anterior y vuelve a pedirlo después de
`expires_in` segundos.

Solo para números por QR: un número oficial responde `422 provider_unsupported`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí | The device ID |

**Respuestas**

- `200`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | object |  |
  | `data.connected` | boolean |  |
  | `data.qr_code` | string \| null |  |
  | `data.expires_in` | integer |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `402` — El pago de la cuenta o del workspace está vencido (`payment_required`). Regularízalo en el panel de Funnelchat para seguir usando esta ruta.
- `403` — No queda lugar en el plan (`number_limit_reached`) o quien llama no es el titular (`connect_not_allowed`).
- `404` — Not found (`AccountsModelNotFoundException`)
- `409` — El número escaneado ya tuvo una prueba gratis (`trial_number_blocked`), es oficial sin coexistencia (`qr_requires_coexistence`), está suspendido por el plan (`number_suspended_by_plan`), desactivado (`device_inactive`) o se generaron demasiados QR hoy (`provisioning_quota_exceeded`).
- `422` — El número es oficial: no tiene QR (`provider_unsupported`).
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`
- `502` — El proveedor de WhatsApp no respondió (`provider_error`). Vuelve a intentarlo.

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

  La misma tabla que en «Ver un número», más arriba en este texto.

- `400` — El número no admite esta edición (`unsupported_provider`).
- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `402` — El pago de la cuenta o del workspace está vencido (`payment_required`). Regularízalo en el panel de Funnelchat para seguir usando esta ruta.
- `403` — Con una clave, el cuerpo trae `code` (el alta oficial de Meta) y la clave no tiene **Números de WhatsApp → Crear, conectar y borrar** (`permission_denied`).
- `404` — Not found (`AccountsModelNotFoundException`)
- `409` — El número fue dado de baja (`device_retired`), está suspendido por el plan (`number_suspended_by_plan`) o hay otra operación en curso sobre los números de la cuenta (`operation_in_progress`).
- `422` — Validation error (`AccountsValidationException`)
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Borrar un número

`DELETE /api/v1/devices/{device}` · permiso **Números de WhatsApp → Crear, conectar y borrar** · área accounts · `operationId` `device.destroy`

> **No se puede deshacer.** Pide confirmación explícita antes de llamarla (`references/shared/limites-de-ejecucion.md`).

**Para qué sirve:** Úsalo para dar de baja un número de la cuenta de forma definitiva. No se puede deshacer. Requiere **Números de WhatsApp → Crear, conectar y borrar**.

> ⚠️ **No se puede deshacer:** el número se borra de la cuenta y libera su lugar en el plan. Para volver a usar ese teléfono hay que crear un número nuevo y conectarlo otra vez.

Borra el número de la cuenta y deja libre su lugar en el plan. No se puede deshacer: para
volver a usar ese teléfono hay que crear un número nuevo y conectarlo otra vez. Si la cuenta
tenía números suspendidos por el plan, el lugar libre puede reactivar uno.

También borra un número conectado. Si es por QR, se cierra su sesión de WhatsApp. Si es
oficial, el número sigue registrado en Meta y Funnelchat deja de recibir sus mensajes. Borra
solo ese número: si borras el oficial y el mismo teléfono también está en la cuenta por QR
(`same_number_as`), el número por QR sigue y vuelve a recibir los chats uno a uno.

Si el proveedor de WhatsApp no responde al cerrar la sesión, el número se borra igual y
Funnelchat reintenta el cierre.

Al borrarlo llega el webhook `device.deleted`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí | The device ID |

**Respuestas**

- `200` — Borrado. El cuerpo viene vacío.
- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `402` — El pago de la cuenta o del workspace está vencido (`payment_required`). Regularízalo en el panel de Funnelchat para seguir usando esta ruta.
- `403` — El pago de la cuenta o del workspace está vencido, o quien llama no puede borrar ese número.
- `404` — Not found (`AccountsModelNotFoundException`)
- `409` — Hay otra operación en curso sobre los números de la cuenta (`operation_in_progress`), por ejemplo el alta oficial de ese mismo número. No se borró nada: vuelve a intentarlo.
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Reiniciar la sesión de un número

`PUT /api/v1/devices/{device}/reset` · permiso **Números de WhatsApp → Crear, conectar y borrar** · área accounts · `operationId` `device.reset`

> **No se puede deshacer.** Pide confirmación explícita antes de llamarla (`references/shared/limites-de-ejecucion.md`).

**Para qué sirve:** Sirve para borrar los datos del número conectado en un lugar de tu plan, por QR u oficial, y conectar ahí un número distinto: es «Borrar datos» en el panel. El lugar sigue ocupado y se conserva el alias. No se puede deshacer. Requiere **Números de WhatsApp → Crear, conectar y borrar**.

> ⚠️ **No se puede deshacer:** borra la información del número conectado en ese lugar (por QR u oficial), igual que «Borrar datos» en el panel, para conectar ahí un número distinto. El lugar en el plan sigue ocupado y se conserva el alias; para conectar el número nuevo hay que pedir un QR o hacer el alta oficial.

Lo mismo que «Borrar datos» en el panel: borra la información del número conectado en
este lugar, por QR u oficial, para conectar ahí un número **distinto**. El lugar en el plan
sigue ocupado y se conserva el alias (y el color; en un número oficial, también la imagen).
Para conectar el número nuevo, pide un QR (`GET devices/{device}/qr`) o usa el alta
oficial.

Si era un número oficial conectado, llega el webhook `device.disconnected` con
`reason: disconnected_by_user`, y si el mismo teléfono también está en la cuenta por QR, ese
número vuelve a recibir los chats uno a uno.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí | The device ID |

**Respuestas**

- `200` — El número, ya sin sus datos, en `data`, y en `numbers_capacity` el uso de los lugares del plan (no aparece si no se pudo calcular).

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<any> |  |
  | `numbers_capacity` | string \| null |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `402` — El pago de la cuenta o del workspace está vencido (`payment_required`). Regularízalo en el panel de Funnelchat para seguir usando esta ruta.
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `404` — Not found (`AccountsModelNotFoundException`)
- `409` — El número fue dado de baja (`device_retired`) o hay otra operación en curso sobre los números de la cuenta (`operation_in_progress`). No se borró nada.
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Actualizar la salud de un número oficial

`POST /api/v1/devices/{device}/health/refresh` · permiso **Números de WhatsApp → Editar** · área accounts · `operationId` `deviceHealth.refresh`

**Para qué sirve:** Sirve para pedirle a Meta la salud actualizada de un número; la respuesta indica si se refrescó de verdad o si devolvió el dato previo por la espera de 60 segundos u otra actualización en curso.

Le pide a Meta el estado actual del número y devuelve lo mismo que
`GET devices/{device}/health`, más `refresh_outcome`:

- `refreshed`: se consultó a Meta y respondió bien.
- `failed`: se intentó consultar a Meta, pero falló (Meta rechazó la consulta o no
  respondió). `stale` es `true`; si Meta rechazó la consulta, `health.state` es `unknown`.
- `not_refreshed_yet`: no se consultó, porque el número se actualizó hace menos de 60
  segundos o ya hay otra actualización en curso. Los datos son los últimos guardados:
  vuelve a intentarlo en un momento.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí | The device ID |

**Respuestas**

- `200` — El estado de salud del número, con `refresh_outcome`.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `health` | string |  |
  | `identity` | string |  |
  | `meta_status` | string \| null | El estado del número en Meta en minúsculas (`connected`, `flagged`, `restricted`, `banned`, ...), igual que `health.meta_status`; `null` si todavía no se sabe. |
  | `entities` | string |  |
  | `throughput_level` | string | El nivel de rendimiento de envío que Meta le asigna al número: `standard`, `high` o `unknown`; `null` si todavía no hay datos. |
  | `history` | array<object> |  |
  | `history[].field` | string |  |
  | `history[].previous_value` | string |  |
  | `history[].new_value` | string |  |
  | `history[].detail` | string \| null |  |
  | `history[].source` | string |  |
  | `history[].occurred_at` | string |  |
  | `meta_billing` | object \| null |  |
  | `meta_billing.waba_id` | string \| null |  |
  | `meta_billing.business_id` | string \| null |  |
  | `refresh_outcome` | string ∈ {"not_refreshed_yet", "failed", "refreshed"} |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `404` — Not found (`AccountsModelNotFoundException`)
- `422` — El número no es oficial (`device_not_meta`).
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Ver el nombre de usuario de un número

`GET /api/v1/devices/{device}/username` · permiso **Números de WhatsApp → Ver** · área accounts · `operationId` `deviceUsername.show`

**Para qué sirve:** Úsalo para consultar el nombre de usuario de WhatsApp de un número oficial: el que informa Meta o, si Meta no devuelve ninguno, el último que se reservó.

Lo consulta en Meta; si Meta no devuelve ninguno, responde el último que se reservó. Solo
para números oficiales. Si Meta rechaza la consulta, la respuesta lleva el mismo código HTTP
que dio Meta, `error` `meta_error` y el motivo de Meta en `message`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí | The device ID |

**Respuestas**

- `200` — El nombre de usuario (`username`), o `null` si el número no tiene.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `username` |  |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `402` — El pago de la cuenta o del workspace está vencido (`payment_required`). Regularízalo en el panel de Funnelchat para seguir usando esta ruta.
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `404` — Not found (`AccountsModelNotFoundException`)
- `422` — El número no es oficial (`device_not_meta`) o todavía no está conectado a Meta (`device_not_ready`).
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`
- `502` — Meta no respondió (`provider_error`). Vuelve a intentarlo.

### Reservar un nombre de usuario

`POST /api/v1/devices/{device}/username` · permiso **Números de WhatsApp → Editar** · área accounts · `operationId` `deviceUsername.store`

**Para qué sirve:** Sirve para reservar en Meta un nombre de usuario de WhatsApp para uno de tus números.

`username` va de 3 a 35 caracteres: letras minúsculas, números, puntos y guiones bajos. Se
reserva en Meta; si Meta lo rechaza (por ejemplo, porque ya está tomado), la respuesta
lleva el mismo código HTTP que dio Meta, `error` `meta_error` y su motivo en `message`. Solo
para números oficiales.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí | The device ID |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `username` | string | sí |  |

**Respuestas**

- `200` — El nombre de usuario reservado.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `username` | string |  |
  | `message` | "Nombre de usuario reservado exitosamente." |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `402` — El pago de la cuenta o del workspace está vencido (`payment_required`). Regularízalo en el panel de Funnelchat para seguir usando esta ruta.
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `404` — Not found (`AccountsModelNotFoundException`)
- `422` — El nombre no es válido (`validation_failed`, con `errors`), el número no es oficial (`device_not_meta`) o todavía no está conectado a Meta (`device_not_ready`).
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`
- `502` — Meta no respondió (`provider_error`). Vuelve a intentarlo.

### Ver nombres de usuario sugeridos

`GET /api/v1/devices/{device}/username/suggestions` · permiso **Números de WhatsApp → Ver** · área accounts · `operationId` `deviceUsername.suggestions`

**Para qué sirve:** Úsalo para pedirle a Meta sugerencias de nombre de usuario antes de reservar uno.

Las sugerencias que da Meta para ese número. Solo para números oficiales. Si Meta rechaza la
consulta, la respuesta lleva el mismo código HTTP que dio Meta, `error` `meta_error` y el
motivo de Meta en `message`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí | The device ID |

**Respuestas**

- `200` — Las sugerencias (`suggestions`).

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `suggestions` |  |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `402` — El pago de la cuenta o del workspace está vencido (`payment_required`). Regularízalo en el panel de Funnelchat para seguir usando esta ruta.
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `404` — Not found (`AccountsModelNotFoundException`)
- `422` — El número no es oficial (`device_not_meta`) o todavía no está conectado a Meta (`device_not_ready`).
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`
- `502` — Meta no respondió (`provider_error`). Vuelve a intentarlo.

### Ver el historial de conexión de un número

`GET /api/v1/devices/{device}/connection-history` · permiso **Números de WhatsApp → Ver** · área accounts · `operationId` `deviceConnectionEvent.index`

**Para qué sirve:** Úsalo para ver cuándo se conectó y desconectó un número, del evento más reciente al más antiguo, por ejemplo para investigar cortes.

**Listado** · `perPage` de 1 a 100 (por defecto 25) · orden fijo: created_at descendente · no acepta parámetros de orden.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí | The device ID |
| `orderBy` | query | string | no |  |
| `orderByMethod` | query | string | no |  |
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — Las conexiones y desconexiones del número, paginadas.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<DeviceConnectionEventResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `cev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].phone` | string \| null |  |
  | `data[].event` | integer ∈ {0, 1} |  |
  | `data[].created_at` | string |  |
  | `links` | object |  |
  | `links.first` | string \| null |  |
  | `links.last` | string \| null |  |
  | `links.prev` | string \| null |  |
  | `links.next` | string \| null |  |
  | `meta` | object |  |
  | `meta.current_page` | integer |  |
  | `meta.from` | integer \| null |  |
  | `meta.last_page` | integer |  |
  | `meta.links` | array<object> | Generated paginator links. |
  | `meta.path` | string \| null | Base path for paginator generated URLs. |
  | `meta.per_page` | integer | Number of items shown per page. |
  | `meta.to` | integer \| null | Number of the last item in the slice. |
  | `meta.total` | integer | Total number of items being paginated. |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `404` — Not found (`AccountsModelNotFoundException`)
- `422` — Validation error (`AccountsValidationException`)
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Ver la cola de mensajes de un número

`GET /api/v1/devices/{device}/message-queue` · permiso **Números de WhatsApp → Ver** · área accounts · `operationId` `device.messageQueue`

**Para qué sirve:** Úsalo para ver los mensajes que esperan en la cola de un número, por ejemplo para entender por qué algo todavía no salió.

**Listado** · `perPage` de 1 a 100 (por defecto 25); también `pageSize` · orden fijo: el que devuelve el proveedor · no acepta parámetros de orden.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí | The device ID |
| `page` | query | integer | no |  |
| `pageSize` | query | integer | no |  |

**Respuestas**

- `200`
- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `402` — El pago de la cuenta o del workspace está vencido (`payment_required`). Regularízalo en el panel de Funnelchat para seguir usando esta ruta.
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `404` — Not found (`AccountsModelNotFoundException`)
- `422` — Validation error (`AccountsValidationException`)
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Contar los mensajes en la cola

`GET /api/v1/devices/{device}/message-queue/count` · permiso **Números de WhatsApp → Ver** · área accounts · `operationId` `device.getQueueCount`

**Para qué sirve:** Úsalo para monitorear cuántos mensajes tiene encolados un número, por ejemplo para detectar atascos.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí | The device ID |

**Respuestas**

- `200`
- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `402` — El pago de la cuenta o del workspace está vencido (`payment_required`). Regularízalo en el panel de Funnelchat para seguir usando esta ruta.
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `404` — Not found (`AccountsModelNotFoundException`)
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`
- `502`

### Sacar mensajes de la cola

`DELETE /api/v1/devices/{device}/message-queue` · permiso **Números de WhatsApp → Editar** · área accounts · `operationId` `device.deleteMessageQueue`

**Para qué sirve:** Sirve para sacar de la cola mensajes puntuales, por su UID, antes de que se envíen, por ejemplo uno que se encoló por error.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí | The device ID |
| `messageUids[]` | query | array<string> | sí |  |

**Respuestas**

- `200`
- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `402` — El pago de la cuenta o del workspace está vencido (`payment_required`). Regularízalo en el panel de Funnelchat para seguir usando esta ruta.
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `404` — Not found (`AccountsModelNotFoundException`)
- `422` — Validation error (`AccountsValidationException`)
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Vaciar la cola de mensajes

`DELETE /api/v1/devices/{device}/message-queue/all` · permiso **Números de WhatsApp → Crear, conectar y borrar** · área accounts · `operationId` `device.clearQueue`

> **No se puede deshacer.** Pide confirmación explícita antes de llamarla (`references/shared/limites-de-ejecucion.md`).

**Para qué sirve:** Sirve para vaciar toda la cola de un número cuando hay que frenar envíos acumulados. Descarta los mensajes sin dejar registro. No se puede deshacer. Requiere **Números de WhatsApp → Crear, conectar y borrar**.

> ⚠️ **No se puede deshacer:** descarta todos los mensajes en la cola del número, sin dejar registro de lo descartado.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí | The device ID |

**Respuestas**

- `200`
- `204` — No content
- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `402` — El pago de la cuenta o del workspace está vencido (`payment_required`). Regularízalo en el panel de Funnelchat para seguir usando esta ruta.
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `404` — Not found (`AccountsModelNotFoundException`)
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

## Los eventos

Llegan por webhook. Cómo crear uno, cómo llega cada entrega, los reintentos, el permiso que pide cada evento y cómo verificar la firma (con funciones probadas en Node.js, Python y PHP): https://developers-portal.funnelchat.app/ia/lo-basico.md.

### `device.deleted`

Uno de los números de WhatsApp de la cuenta se borró y liberó su lugar en el plan (desde el panel, la API o porque un link de alta venció sin conectarlo). Un número oficial deja de recibir mensajes en Funnelchat, pero sigue registrado en Meta; a uno por QR se le cierra la sesión. Trae `connect_link_id` (el link de alta que conectó el número por última vez, o null).

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "device.deleted",
  "version": 1,
  "occurred_at": "2026-10-05T03:00:00Z",
  "data": {
    "device": {
      "id": "dev_AFHtaOVjNBTEWzCuDrmxMPP",
      "name": "Ventas",
      "number": "5491100000000",
      "connection": "qr",
      "external_reference": "cliente-42"
    },
    "deleted_at": "2026-10-05T03:00:00Z",
    "connect_link_id": "lnk_AEF0eLF7bcRyfgK70NSWVdy",
    "workspace_id": 37
  }
}
```

### `device.health_changed`

Cambió el estado de envío de uno de los números oficiales de la cuenta, según Meta: `available`, `limited`, `blocked` o `unknown` (`previous_state` y `state`). Sale solo cuando el estado cambia, no con cada evento de Meta. El motivo se consulta en `GET api/v1/devices/{device}/health`. Trae `connect_link_id` (el link de alta que conectó el número por última vez, o null).

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "device.health_changed",
  "version": 1,
  "occurred_at": "2026-10-05T03:00:00Z",
  "data": {
    "device": {
      "id": "dev_AF5nfjTpKD2vAeKXd1JlVOh",
      "name": "Soporte",
      "number": "5491100000000",
      "connection": "dedicated",
      "external_reference": "cliente-42"
    },
    "previous_state": "available",
    "state": "limited",
    "changed_at": "2026-10-05T03:00:00Z",
    "connect_link_id": null,
    "workspace_id": 37
  }
}
```

### `device.quality_changed`

Cambió la calidad que Meta le da a uno de los números oficiales de la cuenta (`previous` y `current`, tal cual los manda Meta: `GREEN`, `YELLOW` o `RED`). Si la calidad baja, conviene frenar los envíos de ese número antes de que Meta lo limite. Sale una vez por cambio, no con cada evento de Meta, y no sale cuando Meta no tiene datos de calidad (`NA` o `UNKNOWN`). Trae `connect_link_id` (el link de alta que conectó el número por última vez, o null).

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "device.quality_changed",
  "version": 1,
  "occurred_at": "2026-10-05T03:00:00Z",
  "data": {
    "device": {
      "id": "dev_AF5nfjTpKD2vAeKXd1JlVOh",
      "name": "Soporte",
      "number": "5491100000000",
      "connection": "dedicated",
      "external_reference": "cliente-42"
    },
    "previous": "GREEN",
    "current": "YELLOW",
    "changed_at": "2026-10-05T03:00:00Z",
    "connect_link_id": null,
    "workspace_id": 37
  }
}
```

### `device.messaging_limit_changed`

Cambió el límite de mensajes que Meta le da a uno de los números oficiales de la cuenta: cuántas personas distintas se pueden contactar por día con mensajes que inicia la empresa (`previous` y `current`, tal cual los manda Meta: `TIER_250`, `TIER_1K`, `TIER_2K`, `TIER_10K`, `TIER_100K` o `TIER_UNLIMITED`). Meta fija el límite para todos los números de una misma empresa: llega un evento por cada número de la cuenta que cambió. Sale una vez por cambio y no sale cuando el número todavía no tiene límite asignado (`TIER_NOT_SET`). Trae `connect_link_id` (el link de alta que conectó el número por última vez, o null).

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "device.messaging_limit_changed",
  "version": 1,
  "occurred_at": "2026-10-05T03:00:00Z",
  "data": {
    "device": {
      "id": "dev_AF5nfjTpKD2vAeKXd1JlVOh",
      "name": "Soporte",
      "number": "5491100000000",
      "connection": "dedicated",
      "external_reference": "cliente-42"
    },
    "previous": "TIER_1K",
    "current": "TIER_10K",
    "changed_at": "2026-10-05T03:00:00Z",
    "connect_link_id": null,
    "workspace_id": 37
  }
}
```

### `device.display_name_reviewed`

Meta aprobó (`decision`: `approved`) o rechazó (`rejected`) el nombre visible de uno de los números oficiales de la cuenta. Trae el estado anterior y el nuevo, tal cual los manda Meta (`previous_status`; `status`: `APPROVED` o `DECLINED`), el nombre visible actual (`verified_name`) y, en un rechazo, el motivo que da Meta en su evento (`rejection_reason`), o null si Meta no lo informa. Sale una vez por revisión. Trae `connect_link_id` (el link de alta que conectó el número por última vez, o null).

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "device.display_name_reviewed",
  "version": 1,
  "occurred_at": "2026-10-05T03:00:00Z",
  "data": {
    "device": {
      "id": "dev_AF5nfjTpKD2vAeKXd1JlVOh",
      "name": "Soporte",
      "number": "5491100000000",
      "connection": "dedicated",
      "external_reference": "cliente-42"
    },
    "decision": "approved",
    "previous_status": "PENDING_REVIEW",
    "status": "APPROVED",
    "verified_name": "Soporte Lucky Shrub",
    "rejection_reason": null,
    "reviewed_at": "2026-10-05T03:00:00Z",
    "connect_link_id": null,
    "workspace_id": 37
  }
}
```

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
