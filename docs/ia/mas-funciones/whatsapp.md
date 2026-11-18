# Funciones de WhatsApp — API de Funnelchat: contexto para tu IA

> Copiado de /docs/mas-funciones/whatsapp/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Atender una conversación: leído, «escribiendo…» y reacciones

- Marcar como leído, «escribiendo…» y las reacciones piden **Contactos y conversaciones → Enviar**: aunque leído y
  «escribiendo…» no mandan nada, el contacto ve su efecto. `{contact}` es el `id` del contacto y `{message}`
  el `id` de un mensaje: el de `message.received` (`data.contact.id` y `data.message.id`) o el de «Ver los mensajes
  con un contacto».
- **Qué funciona con cada número:** marcar como leído, en números oficiales (también el lado oficial de un número en
  coexistencia) y en los conectados por QR que lo permiten; «escribiendo…», solo en números oficiales. Si el número no
  lo permite: `422 provider_unsupported`. Para las reacciones, la especificación no dice qué tipos de número las
  admiten: si una responde `provider_unsupported`, díselo a la persona y no reintentes por ese número.

## Marcar como leído y «escribiendo…»

- Ninguna de las dos manda un mensaje ni cuenta para el ritmo de envío ni para las reglas de «Mandar mensajes».
- **Marcar como leído:** `POST /api/v1/contacts/{contact}/messages/{message}/read`, sin cuerpo. Responde `204` sin
  cuerpo. Es para un mensaje que el contacto te mandó: WhatsApp le muestra el doble check azul, marca también los
  mensajes anteriores de esa conversación y solo acepta mensajes recibidos en los últimos 30 días. En Funnelchat la
  conversación queda leída, como cuando un agente la abre en el panel; los mensajes que llegaron después del que
  marcaste siguen sin leer.
- **Mostrar «escribiendo…»:** `POST /api/v1/contacts/{contact}/typing`, con `{"device_id": "dev_Ac7Ku7iIZDXJTjdCu0UB1mX"}` (el número por el
  que vas a responder; si no lo mandas, el del último mensaje del contacto). Responde `204` sin cuerpo. Se muestra
  sobre el último mensaje que el contacto te mandó en las últimas 24 horas y dura hasta que respondes o 25 segundos, lo
  que pase primero. WhatsApp también marca ese mensaje y los anteriores como leídos (el contacto ve el doble check
  azul); en Funnelchat la conversación no cambia. Pídelo solo cuando vas a responder enseguida.
- **Errores de las dos:** `422` con `error`: `provider_unsupported` (el número no lo permite) y otros que dicen por qué
  no se pudo con ese contacto o ese mensaje (leído: `recipient_unsupported`, `message_not_inbound`,
  `message_not_markable` y `message_expired`; «escribiendo…»: `recipient_unsupported` y `no_recent_inbound`). La
  especificación no los describe uno por uno: decide por el código, no reintentes igual y díselo a la persona. `422`
  `validation_failed` con `errors`: un dato del cuerpo no es válido. `404` si la clave no encuentra el contacto o el mensaje.
  `502 provider_error`: WhatsApp no confirmó y no cambió nada; puedes reintentar.
- **Ritmo:** entre las dos, hasta 20 llamadas por segundo por número y 50 por cuenta. Al de la cuenta suman también
  las rechazadas con `429` o con un `422` con `error`; no suman los `404` ni los `422` con `errors`. Al pasarte,
  `429 rate_limited` con `Retry-After`: espera esos segundos.

## Reacciones

- **Poner o cambiar:** `PUT /api/v1/contacts/{contact}/messages/{message}/reaction` con `{"emoji": "👍"}` (un emoji,
  hasta 32 caracteres). Reemplaza la reacción que tu cuenta tenía en ese mensaje.
- **Quitar:** `DELETE` en la misma ruta, sin cuerpo. Si no había una reacción tuya, responde lo mismo.
- **Las dos responden `202` sin cuerpo: aceptada, todavía no aplicada.** Sale a WhatsApp desde una cola y queda
  aplicada cuando WhatsApp la confirma. La reacción vigente de cada mensaje está en `reactions` de
  `GET /api/v1/contacts/{contactId}/messages`; la de tu cuenta, con `actor` `business`. Ese dato cambia solo cuando
  WhatsApp la confirma.
- **Si falla después del `202`** (WhatsApp la rechaza, no hay saldo de WhatsApp o el pago del número está vencido),
  `reactions` queda como estaba y llega el evento `message.reaction_failed`, una vez por pedido, con `data.reason` y
  `data.requested_at` (cuándo se aceptó el pedido, en UTC con microsegundos: con eso lo relacionas con tu llamada).
  Para recibirlo, crea un webhook con `"events": ["message.reaction_failed"]`.
- `404`: el contacto o el mensaje no existe o es de otra cuenta, el mensaje es de otro contacto, pasó por un número de
  otro workspace de la cuenta, o la clave es de un agente y el contacto no está asignado a ese agente. Es la misma
  respuesta en todos los casos.
- `422` (no se manda nada), con `error`: `no_provider_uid` (el mensaje no tiene un id de WhatsApp, por ejemplo una nota
  o un envío que no salió), `message_not_reactable` (ese tipo de mensaje no admite reacciones), `message_deleted` (el
  mensaje se eliminó), `device_disconnected` (el número por el que pasó el mensaje ya no está o está desconectado),
  `provider_unsupported` (ese número no admite reacciones), `window_expired` (número oficial: pasaron más de 24 horas
  desde el último mensaje que el contacto le escribió a ese número) o `recipient_unsupported` (el contacto es un grupo,
  una lista de difusión o un canal). En un `PUT`, también si `emoji` no es un emoji.
- `429 rate_limited`: superaste el ritmo de envío; espera los segundos de `Retry-After`.

## Mandar un mensaje a un contacto, reenviar y tarjetas de contacto

- **Para responderle a un contacto que ya tienes**, «Mandar un mensaje a un contacto»:
  `POST /api/v1/contacts/{contact}/message`, con su `id` en `{contact}` (el `data.contact.id` de `message.received`, o
  el `id` de «Ver tus contactos»).
- **¿`POST /api/v1/contacts/{contact}/message` o `POST /api/v1/message/send-message`?** La especificación no dice cuál
  usar y ninguna está marcada como obsoleta. Lo que cambia: esta va a un contacto que ya existe (`{contact}` en la
  ruta; si la clave no lo encuentra, `404` y no sale nada) y nunca crea contactos; `send-message` escribe a un `phone`
  (o a un `whatsapp_id`), crea el contacto si hace falta y también acepta `contact_id` (lo explica «Mandar mensajes»).
  Con el `id` de un contacto, usa esta; con un teléfono, que quizás todavía no es contacto, `send-message`.
- **El cuerpo:** `contact_id` y `device_id` (el número por el que sale) son obligatorios: pon en `contact_id` el mismo
  `id` de la ruta (la especificación no dice qué pasa si difieren). Si mandas también `phone` o `whatsapp_id`, tienen
  que ser de ese contacto; si no, `422 recipient_mismatch`. Admite lo mismo que `send-message` (`text`, `file` con
  `file_type` y `file_name`, `mentions`, `client_reference`) y además `options`, `reference_message_uid`,
  `link_preview` y `link_preview_meta`, sin descripción todavía en la especificación. No
  mandes `note: true` para escribirle al contacto: la respuesta trae entonces «el mensaje registrado de una nota», y una
  nota no tiene id de WhatsApp.
- **La respuesta:** `200` con el mensaje en `message`, en `queued`: en cola no es enviado. El resultado llega por
  `message.status_changed` o con `GET /api/v1/contacts/{contact}/messages/{message}`. No reenvíes un `queued`: lo
  duplicarías. Los rechazos son los de «Mandar mensajes» (`422` con `window_closed`, `antiblock_duplicate_content`,
  `antiblock_unanswered_limit`, `recipient_mismatch` o `recipient_unsupported`; `422 validation_failed` con `errors`: un
  dato no es válido; `429 rate_limited` con `Retry-After`). La especificación declara también `422` con
  `device_unavailable` o `not_sent` sin describirlos para esta llamada: no reintentes igual y díselo a la persona.
- Las tres piden **Contactos y conversaciones → Enviar** y siguen las reglas de «Mandar mensajes»:
  ventana de 24 horas en un número oficial (`422 window_closed`: manda una plantilla), ritmo (`429 rate_limited` con
  `Retry-After`), antibloqueo y `recipient_unsupported`. `client_reference` (opcional, de 1 a 64 caracteres visibles,
  sin espacios) vuelve en `message.status_changed` y en `GET /api/v1/contacts/{contact}/messages/{message}`.
- **Reenviar:** `POST /api/v1/contacts/{contact}/messages/{message}/forward`, con `{message}` el mensaje de origen (tiene
  que ser de ese contacto; si no, `404`) y `targets`: de 1 a 5 destinos `{"contact_id": "ctc_AHm3Qe7TzLw0Xb9Nc2YpVdK", "device_id": "dev_Ac7Ku7iIZDXJTjdCu0UB1mX"}`, sin
  repetir. La respuesta es una lista, un elemento por destino en el orden de `targets`, con `contact_id`, `status`,
  `reason` y `message`. Revisa cada uno y dile a la persona cuáles no salieron:
  - `queued`: quedó en cola, con su `message`.
  - `blocked` con `reason` `not_sent`: no se pudo encolar (`message` en `failed`, `not_queued`); reenviar a ese destino
    es un intento nuevo.
  - `blocked` con `target_not_found` (no existe o no es de la cuenta), `contact_blocked` (bloqueaste al contacto en ese
    número), `device_unavailable`, `mac_limit_reached` o `mac_lockout_24h` (el límite de contactos activos): `message`
    en `null`, no salió nada.
  - `mode` (`internal` o `native`): sin descripción todavía en la especificación.
  - Un mensaje con un archivo por URL sin una extensión que WhatsApp acepte para su tipo no se reenvía: `422` con
    `error` `not_forwardable` y `reason` `unsupported_file_extension`.
- **Tarjetas de contacto:** `POST /api/v1/contacts/{contact}/message/contact-card` con `device_id` (obligatorio: el
  número de la cuenta por el que sale) y `contact_card_ids`: de 1 a 5 ids de contactos de la misma cuenta, sin
  repetir, cada uno con teléfono o identificador de WhatsApp, y nunca el contacto al que le mandas las tarjetas (el
  `id` de «Ver tus contactos»). Si no sabes cuál es el contacto que la persona quiere compartir, búscalo antes y
  confírmaselo. Responde `messages`, un mensaje por tarjeta en el
  orden de `contact_card_ids`, en `queued` (o `failed` con `not_queued`: esa tarjeta no salió).
- **Un `5xx` o una llamada sin respuesta** (en las tres): busca tu `client_reference` en los mensajes del contacto, al
  menos un minuto después, antes de reintentar. Si no aparece, no salió nada y puedes reintentar; si aparece, quedó
  registrado: no lo reenvíes. En un reenvío o en tarjetas: si todos los que aparecen vienen `failed` con `not_queued`,
  reintenta la llamada completa; si alguno aparece `queued`, quedó registrado: no lo reenvíes.

## Grupos de tu cuenta: leer

- **Dos listas distintas:** «Ver tus grupos» (`GET /api/v1/devices/{device}/groups`) lee de WhatsApp los grupos de un
  número, también los que todavía no están en el workspace de la clave (ver «Grupos»). «Ver los grupos de tu cuenta»
  (`GET /api/v1/groups`) lista los que ya están en Funnelchat: filtra por `name`, `deviceId` (un número), `noCampaign`
  (los que no son de una campaña), `status` y `type` (la especificación no dice qué es cada valor de estos dos). Orden:
  `orderBy` (`created_at`, `id`, `name`, `updated_at`) y `orderByMethod` (`asc` o `desc`). Por páginas: `perPage` de
  1 a 100 (25 si no lo mandas); pide la URL de `links.next` tal cual, hasta que sea `null`.
- **`{group}` es el `uid` del grupo** (por ejemplo `120363000000000001@g.us`), no su `id`. Lo traen las dos listas.
- **Ver un grupo:** `GET /api/v1/groups/{group}`: lo que Funnelchat tiene guardado (`admins`, `participants_count`,
  `isFull`, `link`, `owner_connected`, `adminOnlyMessage`, `lastSyncAt`, entre otros). `404` si no está en el workspace de la clave.
- **Lo que dice WhatsApp ahora:** `GET /api/v1/groups/{groupUid}/metadata`, con el `uid` en la ruta y también en
  `group_uid`, más `device_id` (los dos obligatorios); `type` es `groups`, `ad-groups` o `channels`. Trae `name`,
  `description`, `image`, `link`, `admins_numbers`, `participants_numbers`, `verified_admin` y `owner`, entre otros.
  `502`: no se pudo consultar a WhatsApp; reintenta más tarde. `404`: el grupo no existe o el número no tiene acceso.
- **Los envíos programados que incluyen un grupo:** `GET /api/v1/groups/{group}/scheduled-messages`, por páginas;
  filtra por `name`. Lo demás de los envíos, en «Envíos programados».
- **Canales y grupos de anuncios de un número:** `GET /api/v1/devices/{device}/channels` y
  `GET /api/v1/devices/{device}/ad-groups`, con `page` y `pageSize` (25 por defecto, hasta 100) y `name`. No piden una
  campaña: «Ver los grupos que puedes sumar a una campaña» (`GET /api/v1/campaigns/{campaign}/available-groups`) sí.
  Cada grupo de anuncios trae `communityUid` (su comunidad); cada canal, `subscribers_count` e `invite_link`, entre
  otros. `404` (`Device not found`): no encuentra el número. La especificación no dice cómo se marca uno que ya está en
  tu cuenta: no lo afirmes.

## Participantes de un grupo

- **Los participantes:** `GET /api/v1/groups/participants?groupUid=<uid>` (el `uid` va como parámetro, no en la ruta).
  Filtra por `phone`, `isAdmin` y `eligibleForAdmin` (si se lo puede hacer administrador). Orden: `orderBy`
  (`created_at`, `id`, `updated_at`) con **`orderDirection`** (no `orderByMethod`). Cada uno trae `phone`, `isAdmin`,
  `action` y `created_at`.
- **Quién entró y salió:** `GET /api/v1/groups/{group}/participant-events`: `event_type` (`all`, `join` o `leave`),
  `start_date` y `end_date` (fecha y hora), `timezone`, `search` (hasta 50 caracteres), `page` y `perPage` (hasta 100).
  Cada uno trae `phone`, `whatsapp_id`, `event_type`, `event_at`, `group_name`, `country_code` y `country_name`.
- Para enterarte en el momento, los webhooks `group_participant.joined` y `group_participant.left` (ver «Grupos»).

## Pedir una acción de grupo: es asíncrona

- Son acciones: crear un grupo, sumar o sacar participantes, hacer o quitar administradores, cambiar el nombre, la
  descripción, la foto o quién escribe, renovar el link y aprobar o rechazar solicitudes (y mandar un mensaje, en
  «Grupos»). Piden **Grupos y campañas → Administrar grupos**; ver cómo salieron pide **Grupos y campañas → Ver**, que
  esa casilla no incluye.
- Todas llevan `device_id`: el número que la hace. **Tiene que ser administrador del grupo** según WhatsApp (es el
  `is_admin` de «Seguir un grupo»); si no, `422 device_not_group_admin`, y reintentar no sirve.
- **Antes, mira qué permite el número:** `capabilities.groups` de `GET /api/v1/devices/{device}` trae `create`,
  `add_participants` (`direct` o `invite`), `remove_participants`, `admins`, `photo`, `settings`, `invite_link`,
  `send` y `join_requests` (`list` o `list_and_decide`). Si el número no lo permite, o es oficial y la cuenta no tiene
  habilitados los grupos de la API oficial: `422 provider_unsupported`, con `provider` y, si a la cuenta le falta una
  habilitación, `requires` (lo que hace falta).
- **Responde `202` con `{"action_id": "…", "status": "queued"}` (así, sin `data` alrededor): aceptada, no hecha.** Se hace después, al ritmo de
  las campañas del número (sumar participantes, de a uno; entre creaciones de grupos, una espera); no se puede
  acelerar.
- **Cómo salió:** `GET /api/v1/groups/actions/{action}`, con `{action}` el `action_id`. Responde `data` con
  `action_id`, `type`, `status` (`queued`, `running`, `completed` o `failed`), `device_id`, `group` (`uid` y `name`;
  `null` mientras una creación no terminó), `result`, `reason`, `created_at`, `started_at`, `completed_at` y
  `failed_at`. `device_id` y `group` vienen en `null` si son de otro workspace que el de la clave. `404 action_not_found`
  si no existe o no es de la cuenta. Mejor que consultar en un bucle: el webhook `group_action.completed` (terminó,
  con el mismo `result`) o `group_action.failed` (falló entera; solo `reason`, sin `result`), con `data.action.uuid`
  igual al `action_id` y `data.action.type`.
- **`result` solo tiene valor con `completed`:** mientras está `queued` o `running`, `result` y `reason` son `null`;
  con `failed`, `result` es `null` y `reason` dice por qué. Su forma depende de `type`: `{"participants": [...]}` en
  las acciones con teléfonos, `{"group": {"uid", "name"}, "invite_link"}` al crear un grupo, `{"invite_link"}` al
  renovar el link, `{"message": {"uid"}}` al mandar un mensaje y `{}` en las demás.
- **`reason` es un vocabulario cerrado** (el de la acción `failed`, el de cada persona `failed` y el de
  `group_action.failed`), por ejemplo `device_not_connected`, `device_not_group_admin`, `group_not_found`,
  `phone_not_exists`, `window_closed`, `capacity_full`, `creation_unconfirmed`, `plan_cap_reached`, `provider_error` o
  `provider_unsupported`; lo que no tiene un motivo propio sale `internal_error`, nunca con el texto de WhatsApp.
  Muéstraselo a la persona tal cual.
- **`completed` no quiere decir que cada persona salió bien.** En las acciones con teléfonos, `result.participants`
  es una lista, en el orden del pedido, con una entrada por teléfono: `{"identity": "…", "identity_type": "phone",
  "status": "…", "reason": null}`, con `status` `added`, `invited`, `removed`, `promoted`, `demoted`, `approved`,
  `rejected` o `failed`, y `reason` solo cuando falló. Revisa cada una y dile a la persona cuáles no salieron. `added` es
  que WhatsApp aceptó la operación, no que la persona siga en el grupo.
- **Teléfonos:** `phones` (o `participants` al crear), hasta 20 por pedido una vez normalizados y sin repetidos; si
  hay más, `422 max_phones`.
- **Sin clave de idempotencia:** no repitas un pedido que respondió `202`. Después de un `5xx` o sin respuesta,
  reintentar puede hacer la acción dos veces: mira antes cómo quedó el grupo.
- **Topes:** hasta 50 acciones abiertas (`queued` o `running`) por número (`429 too_many_pending_actions`: espera a
  que terminen); hasta 30 pedidos de acciones por minuto y 30 lecturas en el momento por minuto (link y solicitudes).
- **Otros errores** (cuerpo `{"error": "…", "message": "…"}`): `404 group_not_found` (el grupo no está en el workspace de la clave:
  con un número por QR, síguelo con «Seguir un grupo» y vuelve a pedir), `404 device_not_found`,
  `422 device_not_connected`, `422 device_not_group_number` (el número no es el del grupo),
  `422 unsupported_group_type` (ese tipo de grupo no admite la acción), `402 plan_cap_reached` (el plan no incluye la
  acción o llegó a su tope: el plan del workspace si tiene uno propio, o el de la cuenta si no), `502 provider_error` (falló WhatsApp) y `403 route_not_available` (las
  acciones de grupo por la API no están habilitadas).

## Crear un grupo

- `POST /api/v1/groups` con `device_id`, `name` (1 a 100 caracteres) y `participants` (de 1 a 20 teléfonos distintos,
  sin contar el del propio número, que nunca va en la lista) y, si quieres, `description` (hasta 2048). Crea un grupo
  real en WhatsApp y suma a esas personas: antes, confírmale a la persona el nombre, el número y los participantes.
- `join_approval_required: true`, solo con un número oficial, crea el grupo pidiendo aprobación para entrar; después no
  se puede cambiar. Con un número por QR, `422 provider_unsupported`.
- `402 plan_cap_reached`: se llegó al tope de grupos oficiales del plan (el del workspace si tiene uno propio, o el de la cuenta si no). Trae `feature`, `parameter`, `cap`
  (el tope) y `used` (lo usado); no se registra ninguna acción. Reintentar no sirve: díselo a la persona.
- **El `uid` del grupo nuevo no viene en la respuesta** (`202` con `action_id` y `status`): llega cuando la acción
  termina. En `GET /api/v1/groups/actions/{action}` viene en `group` (`uid` y `name`) y en `result` (`group` con
  `uid` y `name`, e `invite_link`); en el webhook `group_action.completed`, en `data.group` (`uid` y `name`), con
  `data.action` (`uuid`, el `action_id`, y `type`) y `data.result.invite_link`. Vale igual para un número por QR y
  para uno oficial (en uno oficial, cuando WhatsApp confirma la creación).
- Con un número oficial, si WhatsApp no lo confirma, termina `failed` con `creation_unconfirmed` aunque el grupo pueda
  existir: busca en `GET /api/v1/groups` antes de crearlo otra vez.
- `group.created` llega solo por los grupos que se crean o se importan dentro de una campaña: no lo esperes para un
  grupo sin campaña.

## Nombre, descripción, foto y quién escribe

- **Nombre:** `PUT /api/v1/groups/{group}/name` con `name` (1 a 100); va a WhatsApp tal cual, sin la numeración de la
  campaña.
- **Descripción:** `PUT /api/v1/groups/{group}/description` con `description` (hasta 2048). Vacía, con un número por
  QR la borra; con un número oficial responde `422 validation_failed` (con `errors.description`): WhatsApp no permite
  borrar la descripción de un grupo oficial. **Borrarla: hazlo solo si la persona lo pide de forma explícita para eso;
  confírmale qué grupo (nombre y `uid`) antes de llamar.**
- **Foto:** `PUT /api/v1/groups/{group}/photo` con `photo_url`: una dirección `https` de una imagen jpg, jpeg o png.
  Solo números por QR.
- **Quién escribe:** `PUT /api/v1/groups/{group}/settings` con `members_can_send_messages` (`true`, escriben todos;
  `false`, solo los administradores, que pasan a ser también los únicos que editan los datos del grupo). Solo números
  por QR.
- En estas cuatro, `result` llega vacío (`{}`): para ver cómo quedó, «Ver los datos de un grupo en WhatsApp».

## Sumar, sacar y administradores

- **Sumar:** `POST /api/v1/groups/{group}/participants` con `device_id` y `phones`. Por QR, entran directo. Oficial,
  por invitación: cada persona recibe la plantilla de invitación que eligió la cuenta y queda `invited`; sin plantilla
  elegida, `422 invite_template_not_configured`. En un grupo de un número oficial hay un tope de 8 participantes: caben
  solo los lugares libres menos las invitaciones activas (`422 capacity_full` o `422 invite_capacity_full`);
  `422 duplicate_invite` si alguien ya tiene una invitación activa.
- **Sacar:** `POST /api/v1/groups/{group}/participants/remove` con `phones`, en una sola operación de WhatsApp. **Hazlo
  solo si la persona lo pide de forma explícita para eso; confírmale qué vas a sacar (nombre y `uid` del grupo, y los
  teléfonos) antes de llamar.** No admite el teléfono del propio número (`422 cannot_target_executing_device`).
- **Hacer administradores:** `POST /api/v1/groups/{group}/admins` con `phones`; un teléfono que no está en el grupo se
  suma primero. Solo números por QR.
- **Quitar administradores:** `POST /api/v1/groups/{group}/admins/remove` con `phones`. **Mismo cuidado: solo si la
  persona lo pide de forma explícita para eso; confírmale el grupo (nombre y `uid`) y los teléfonos antes de llamar.**
  No admite el propio número; `422 not_a_participant` si el teléfono no es un miembro conocido del grupo. Solo números
  por QR.
- `422 cannot_target_account_device`: no se puede apuntar a otro número de la cuenta.

## Link de invitación

- **Ver:** `GET /api/v1/groups/{group}/invite-link/live?device_id=dev_Ac7Ku7iIZDXJTjdCu0UB1mX`: lo lee en el momento de WhatsApp y responde
  `data.invite_link`. Una lectura que salió bien se reutiliza unos segundos.
- **Renovar:** `POST /api/v1/groups/{group}/invite-link/renew` con `{"device_id": "dev_Ac7Ku7iIZDXJTjdCu0UB1mX"}`; el link queda en
  `result.invite_link`. Por QR **no lo cambia**: vuelve a leer el vigente. Oficial: revoca el anterior, que deja de
  servir, y WhatsApp genera uno nuevo; **hazlo solo si la persona lo pide de forma explícita para eso; confírmale el
  grupo (nombre y `uid`) antes de llamar.**
- `group.invite_link_renewed`: el link cambió por una renovación (automática, al detectarse inválido, o pedida), con
  `invite_link`, `previous_invite_link` y `trigger`; no llega por los cambios que detecta la sincronización ni por el
  link inicial al crear el grupo. `group.invite_link_down`: el link quedó confirmado caído y la renovación no consiguió
  otro; una sola vez por episodio, con `reason` y `renewal_attempted`.

## Solicitudes para unirse (solo números oficiales)

- **Ver:** `GET /api/v1/groups/{group}/join-requests?device_id=dev_Ac7Ku7iIZDXJTjdCu0UB1mX` (con un número por QR,
  `422 provider_unsupported`). Responde `data`, una entrada por solicitud pendiente con `participant` (`identity`,
  `identity_type`, `name`) y `requested_at` (puede ser `null`): hasta 100, en el orden de WhatsApp, solo su primera
  página. Las que no traen teléfono no aparecen.
- **Aprobar o rechazar:** `POST /api/v1/groups/{group}/join-requests/approve` o `.../reject`, con `device_id` y
  `phones` (el teléfono de cada persona). Solo cuando `capabilities.groups.join_requests` del número es
  `list_and_decide`; si no, `422 provider_unsupported`. Aprobar verifica que entren en los lugares libres
  (`422 capacity_full`); rechazar no lo verifica.
- **Rechazar:** hazlo solo si la persona lo pide de forma explícita para eso; confírmale el grupo y los teléfonos
  antes de llamar.
- `result.participants` trae una entrada por teléfono, en el orden del pedido: `approved`, `rejected` o `failed`, con
  `reason` `join_request_not_found` (no tiene una solicitud pendiente, o está más allá de la primera página),
  `capacity_full`, `provider_error` o `provider_unsupported`.
- Aprobar no suma a la persona a la lista de participantes en el momento: el alta llega cuando WhatsApp la informa,
  con `group_participant.joined`.
- `group_join_request.created` (alguien pidió unirse) y `group_join_request.revoked` (retiró el pedido) traen `group`
  y `participant`. `identity_type` es `whatsapp_user` cuando la persona no se identifica por teléfono: como se aprueba
  y rechaza por teléfono, esa solicitud no se puede decidir por la API.

## Lo que pasa en tus grupos: eventos

- Crea un webhook con `POST /api/v1/webhooks` y los eventos que necesites. La clave necesita **Avisos (webhooks) →
  Administrar** y, por estos eventos, **Grupos y campañas → Ver**. Llegan solo si hay una suscripción a ese tipo; el
  mismo evento puede llegar más de una vez: descarta los repetidos por el `id` del sobre.
- `group.message_received` (alguien escribió: `participant` y `message` con `uid`, `type`, `text`, `caption`,
  `media_url`, `mime_type`, `file_name` y `quoted_uid`; las que no aplican vienen en `null`, como las de multimedia y
  `quoted_uid` en un texto) y `group.reaction_added` (`message.uid`, el mensaje al que reaccionaron, y `reaction`)
  reflejan lo que informó WhatsApp: la autoría no se verifica por separado. El mensaje se identifica con `uid`, no con
  `id`: el `id` es el del sobre. En `group.message_received`, `media_url` puede venir `null` en un grupo de un número
  por QR, o ser una URL temporal.
- `poll.voted`: alguien votó, o cambió su voto, en una encuesta mandada a un grupo (`poll.uid`, `options`,
  `participant`, `scheduled_message.uuid`). Un voto en una encuesta de un envío programado también es una respuesta de
  `scheduled_message.response_received` (ver «Envíos programados»); la especificación no dice si llegan los dos por el
  mismo voto: si te suscribes a ambos, no lo cuentes dos veces.
- `group.full`: el grupo pasó de no estar lleno a estarlo (`trigger`, `participants`). `group.blocked`: un grupo de
  una campaña quedó inoperable, con `reason` `admin_access_lost` (sin un administrador conectado),
  `invite_link_invalid` (el link dejó de funcionar y renovarlo no consiguió otro) o `suspended` (WhatsApp lo
  suspendió); `group.recovered`: volvió a operar, con `reason` `access_restored` o `invite_link_renewed`. Un grupo que
  no es de una campaña no genera ninguno de los dos.
- `group.created`: se creó o se importó un grupo dentro de una campaña de la cuenta (`source`).

## Las acciones que se corrieron sobre un grupo

- `GET /api/v1/groups/{group}/actions`, por páginas (`page`, `perPage` hasta 100; orden `status`, `created_at`,
  `updated_at` o `completed_at`): cada una con `action_name`, `action_label`, `status`, `info`, `executed_at` y
  `executed_by`. La especificación las llama «acciones de sesión» y no dice si incluye las que pediste por la API: para
  una tuya, usa su `action_id`.

## Plantillas de Meta: crear, ver, editar, métricas y borrar

- `{template}` es el `id` de una plantilla de `GET /api/v1/templates` («Mandar mensajes», que también explica cómo traer
  de Meta las que se crearon allí y cómo mandar una).
- **Crear:** `POST /api/v1/templates` con `name`, `language_code` (un código de la lista, por ejemplo `es` o `es_AR`),
  `category` (`UTILITY`, `MARKETING` o `AUTHENTICATION`), `type` (`text`, `image`, `document`, `video`, `location` o
  `default`) y `body`, obligatorios, y si quieres `header`, `footer`, `params` (una lista de textos), `file` y `buttons`
  (hasta 3, cada uno con `type` `QUICK_REPLY`, `URL` o `PHONE_NUMBER`, `text` y, según el tipo, `url` o
  `phone_number`). **Lleva además `device_id`, obligatorio aunque la especificación todavía no lo declare en el
  cuerpo:** un número oficial de la cuenta que la clave puede usar. La plantilla se crea en la cuenta de WhatsApp
  Business de ese número (`waba_id`), y el nombre con el idioma no se puede repetir dentro de esa WABA. Si la persona
  tiene varios números oficiales, pregúntale en cuál. Responde enseguida `200` con la plantilla en `PENDING` (con su
  `device_id` y `waba_id`) y la manda a Meta en segundo plano: no está aprobada. Si el número no tiene WABA, termina
  `REJECTED` («El dispositivo no tiene WABA ID configurado»). `params` y `file`: sin descripción todavía en la
  especificación.
- **Aprobación:** el estado lo decide Meta (`PENDING`, `APPROVED`, `REJECTED`, `PAUSED`…). Para enterarte, un webhook
  con `"events": ["template.status_changed"]` (pide **Contactos y conversaciones → Ver**, además del permiso de los
  webhooks), o vuelve a ver la plantilla más tarde; no la consultes en un bucle. El evento trae `data.template` (`id`,
  `uid`, `name`, `category`), `previous_status` (`null` si no tenía), `status` y `reason` (la observación de rechazo,
  hasta 500 caracteres, solo cuando es un rechazo informado al crearla). No llega si Meta repite el estado que ya tenía.
- **Editar:** `PUT /api/v1/templates/{template}` con `device_id`, `category`, `type` y `body` (obligatorios) y lo demás
  como al crear; el nombre y el idioma no van. La especificación no describe qué `device_id` va; la plantilla trae el
  suyo. Responde `204` sin cuerpo: para ver cómo quedó, `GET /api/v1/templates/{template}`. `400 bad_request`: no se
  puede editar ahora; el motivo viene en `message` (muéstraselo a la persona). La especificación no dice cuándo pasa:
  no reintentes enseguida.
- **Métricas:** `GET /api/v1/templates/{template}/metrics`, con `from` y `to` (`AAAA-MM-DD`, UTC, los dos o ninguno;
  hasta 90 días contando hoy; `to` no puede ser futura). Responde `data` con `totals`, `days` (los días sin datos, en
  cero y `cost` en `null`) y `fetched_at` (cuándo se leyó de Meta); no describe los campos de `totals` ni de cada día.
  Con `template_analytics_not_enabled`, dile a la persona que las active en el Administrador de WhatsApp (Meta no deja
  desactivarlas después); con `template_metrics_not_available_for_qr`, el número es por QR: no hay métricas. Un error
  no queda guardado: reintentar vuelve a consultar a Meta y cuenta en el límite de 60 por hora de la cuenta.
- **Borrar de un número:** `DELETE /api/v1/devices/{device}/templates/{template}`, con `{device}` el `id` del número.
  Responde `204`. Hazlo solo si la persona lo pide de forma explícita para eso; confírmale qué vas a borrar (nombre e
  id de la plantilla, y el número) antes de llamar. La especificación no dice si la borra también en Meta ni si se
  puede deshacer.

## Formularios de WhatsApp: armar y publicar

- **Dos ids, no los confundas.** `family_id` es el formulario y no cambia: va en `/api/v1/forms/families/{familyId}/…`,
  en `form_id` al mandarlo y llega en `data.form.id` de `whatsapp_form.completed`. `id` es una versión y cambia con
  cada versión: va en `/api/v1/forms/{id}/…` (ver, guardar, borrar, validar, publicar, versiones y números) y llega en
  `data.form.version_id`. `GET /api/v1/forms` («Ver tus formularios», abajo) trae los dos.
- **Solo números oficiales:** `device_id`, `device_ids` y los números que sumes tienen que ser números oficiales de la
  cuenta (`connection` `coexistence` o `dedicated` en `GET /api/v1/devices/{device}`); si no, `422 NUMBER_NOT_ELIGIBLE`.
- **El recorrido:**
  1. `POST /api/v1/forms` con `template_key` (`blank` para empezar de cero; las demás `key` están en
     `GET /api/v1/forms/templates`), `device_id` y, si quieres, `device_ids` (hasta 50). Responde `201` con la versión
     en borrador en `data` (`id`, `family_id`), `lint` y `numbers`. El contenido no va acá.
  2. `PUT /api/v1/forms/{id}` con `definition` (`screens`) y, si quieres, `name` (hasta 120 caracteres) y
     `expected_updated_at` (el `updated_at` que leíste: si alguien guardó después, `409 STALE`; vuelve a leer antes de
     pisar). Guarda tal como llega y responde `data` y `lint`, una lista de `{code, severity, screenId, itemId,
     message}`: lo que tiene `severity` `error` impide publicar; lo demás no. `422` si la definición tiene la forma
     rota.
  3. Opcional: `POST /api/v1/forms/{id}/sync` valida en Meta sin publicar; lo que Meta observa llega en `lint` con
     `code` `meta`. Con errores, `422 LINT`.
  4. `POST /api/v1/forms/{id}/publish`: inmediato. `422 LINT` con la lista si hay errores (corrige y vuelve a
     guardar); `502 META` si Meta la rechaza o no responde; `422 META` si la cuenta de WhatsApp Business no cumple los
     requisitos de integridad de Meta (díselo a la persona; no reintentes). En los otros números se publica después:
     mira `GET /api/v1/forms/{id}/numbers` (`draft`, `publishing`, `published` o `failed`).
  5. Para mandarlo: «Mandar un formulario de WhatsApp», abajo.
- **`blank` no viene vacío:** trae una pantalla `SCREEN_BLNK` sin elementos cuyo `next` es `complete`. Si la conservas y
  agregas otra, la segunda queda inalcanzable (`lint`: `screen_unreachable`, impide publicar). Reemplaza `screens`
  entera con tus pantallas.
- **La forma de una definición:** cada pantalla con `id`, `title`, `cta`, `next` e `items`; cada elemento con `type` y,
  si es una pregunta, `name`. Los `type`: de presentación, `heading`, `subheading`, `body`, `caption`, `image` y
  `link`; preguntas (llevan `name`), `text`, `number`, `email`, `phone`, `textarea`, `date`, `dropdown`, `radio`,
  `checkbox` y `optin`. La especificación no los enumera; la API solo exige que `type` sea un texto, y uno que no es
  de la lista no se rechaza al guardar: lo marca `lint`. Para ver una definición válida, lee la `definition` de un
  modelo en `GET /api/v1/forms/templates` o la de un formulario de la cuenta con
  `GET /api/v1/forms/families/{familyId}/definition`, y copia su forma. No inventes tipos.
- **Reglas que el servidor no arregla** (quien arma la definición genera los ids):
  - Pantallas: `id` con `SCREEN_` más letras, sin dígitos (`SCREEN_DATOS`), únicos. `next`: `auto` (la siguiente),
    `complete` (termina) o el `id` de una pantalla posterior: solo hacia adelante.
  - Preguntas: `name` en minúsculas y guiones bajos (`a-z` y `_`), único en todo el formulario, sin dígitos, tildes,
    `ñ` ni espacios; nunca `flow_token`, `version` ni `extension_message_response`. No cambies un `name` ya creado: las
    respuestas, las ramas y las etiquetas lo usan.
  - Opciones: `id` en minúsculas y guiones bajos, único en su pregunta (`op_comercio`).
  - El linter no revisa que los ids sean únicos ni que existan los campos personalizados (`map` con `target` `custom`
    y `key`, el nombre del campo) y las etiquetas (`tagMap`, con el nombre) que usas: compruébalo con
    `GET /api/v1/custom-fields` y `GET /api/v1/tags`. Si no existen, la respuesta se guarda en el formulario pero no en
    el contacto. Un campo numérico admite solo preguntas `number`, y uno de fecha solo `date`.
  - No se publican los que necesitan un servidor propio (`endpoint` en `true`).
- **Límites:** hasta 5 pantallas, y por pantalla 50 elementos, 3 imágenes y 2 enlaces. Imágenes (`type` `image`) en
  `src` en base64 **sin** el prefijo `data:` (con el prefijo se guarda, pero Meta muestra un recuadro roto), JPG o PNG,
  hasta 300 KB cada una y 4 MB entre todas: el servidor no lo revisa. Cada guardado manda la definición entera y tiene
  que pesar menos de unos 6 MB.
- **Estados de un formulario** (`status` en `GET /api/v1/forms`): `draft` (borrador: se edita) y `published`
  (congelado; se manda). Una versión reemplazada sigue `published`, con `retained_reason`. El filtro acepta también
  `deprecated`.
- **Cambiar uno publicado:** `PUT` y `DELETE` responden `409 PUBLISHED`. `POST /api/v1/forms/{id}/versions` crea la
  versión siguiente como borrador (`201`) o, si ya había un borrador, responde `200` con `created: false` y ese
  borrador: edita ese. Después, publícalo; el `form_id` no cambia.
- **Borrar:** `DELETE /api/v1/forms/{id}` borra solo un borrador (`204`). Hazlo solo si la persona lo pide de forma
  explícita para eso; confírmale qué vas a borrar (nombre, versión e id) antes de llamar. Uno publicado responde
  `409 PUBLISHED` («se depreca»); la especificación no describe cómo deprecarlo por la API.

## Formularios de WhatsApp: números, respuestas y métricas

- **Números:** `GET /api/v1/forms/{id}/numbers` → `numbers`, cada uno con `device_id`, `primary` (el número con el que
  se creó: es el primero y no se saca), `status` y `error`. `POST /api/v1/forms/{id}/numbers` con `device_id` suma un
  número (si la versión ya está publicada, se publica ahí enseguida). `POST /api/v1/forms/{id}/numbers/retry`
  reintenta los que fallaron o no se publicaron. `DELETE /api/v1/forms/{id}/numbers/{deviceId}` saca uno y deja de
  mandarse por él: hazlo solo si la persona lo pide de forma explícita para eso; confírmale el formulario y el número
  (nombre e id) antes de llamar. Con el principal, `422 PRIMARY_NUMBER`.
- Si al mandarlo responde `form_not_on_number`, súmale ese número con `POST /api/v1/forms/{id}/numbers` (el `id` de la
  versión publicada) y espera a que esté `published`.
- **Respuestas:** `GET /api/v1/forms/families/{familyId}/responses`, de la más reciente a la más antigua, todas las
  versiones juntas, por páginas (`perPage` de 1 a 100). Junto a `data` viene `columns` (las preguntas). Filtros: `from`
  y `to` (fecha y hora), `version_id` (el `id` de una versión de ese formulario) y `search` (nombre o teléfono del
  contacto) y `status`: `completed` (completada), `pending` (esperando la respuesta), `not_sent` (no se mandó) o
  `unfinished` (venció o se canceló). También `origin`, `kind` y `effect_status`, cuyos valores la especificación no
  enumera: no los adivines. No describe los campos de cada fila: el `id` de cada una es el `{runId}` del detalle.
- **Una respuesta:** `GET /api/v1/forms/families/{familyId}/responses/{runId}` trae `contact` (`id`, `name`, `phone`),
  `status` (`key` `completed`, `pending`, `unfinished` o `not_sent`, con su `label`), `answers` (`name`, `label`,
  `value`, `unknown`), `effects` (lo que se hizo con las respuestas; con una clave, sin `last_error`) y sus fechas.
- **Métricas:** `GET /api/v1/forms/families/{familyId}/metrics`, con los mismos filtros de fecha, versión y origen.
  Trae `sent`, `delivered`, `read`, `completed`, `pending`, `unfinished`, `partial`, `not_sent` (con
  `not_sent_reasons`), `completion_rate`, `delivery_rate`, `read_rate` y `median_seconds_to_complete`. La
  especificación no dice si los porcentajes van de 0 a 1 o de 0 a 100: mira el valor antes de mostrarlo.
- **Con la clave de un agente:** trabaja sobre los formularios del titular; las respuestas se limitan a los contactos
  que ese agente puede ver, pero las métricas cuentan todas.
- **Topes:** por clave, 120 lecturas y 60 escrituras por minuto en formularios; `sync`, `publish` y las llamadas de
  números comparten además 30 por minuto entre todas las claves de la cuenta. Al pasarte, `429` con `Retry-After`:
  espera esos segundos. No leas las respuestas en un bucle: para enterarte en el momento, `whatsapp_form.completed`.

## Mandar un formulario de WhatsApp

- `POST /api/v1/contacts/{contact}/message/form` con `form_id` y `device_id` (obligatorios) y, si quieres, `text`
  (hasta 1024 caracteres; si no, el nombre del formulario), `button_text` (hasta 30, sin emojis; si no, «Abrir» u
  «Open» según el idioma del usuario de la clave) y `client_reference` (de 1 a 64 caracteres visibles, sin espacios).
- `form_id` es el formulario, no una versión: el mismo en todas sus versiones, y sale la versión publicada vigente.
  `device_id` es el número oficial por el que sale; el formulario tiene que estar publicado en ese número. Solo dentro
  de las 24 horas siguientes al último mensaje del contacto a ese número.
- **Conseguir el `form_id`:** `GET /api/v1/forms` lista los formularios de la cuenta, uno por formulario aunque tenga
  varias versiones, y de cada uno la versión que se usa hoy (la publicada o, si no hay, la más nueva). **En `form_id`
  va el `family_id` de la fila, no su `id`:** el `id` es el de esa versión. Filtra con `q` (parte del nombre),
  `status` (`draft`, `published` o `deprecated`; para mandar, `published`) y `device_id` (un número de la cuenta; si
  no es oficial, `422` `NUMBER_NOT_ELIGIBLE`), y pagina con `page` y `perPage` (de 1 a 100, 25 por defecto). La clave
  de un agente ve los formularios del titular de la cuenta. Si no hay ninguno publicado, díselo a la persona; no
  inventes un `form_id`. Cada clave puede hacer hasta 120 lecturas de formularios por minuto; al pasarte, `429` con
  `Retry-After`: espera esos segundos.
- La clave de un agente solo manda a los contactos asignados a ese agente (con otro, el `404` de un contacto que no
  existe); la del titular, a cualquier contacto de la cuenta.
- Responde `200` con `message` en cola (`status` `queued`, `type` `whatsapp_form`): aceptado no es entregado. El
  estado llega por `message.status_changed` o con «Ver un mensaje». Si no se pudo poner en cola, también es `200`,
  con `status` `failed` y `error.reason` `not_queued`: no salió, y reintentar no lo duplica.
- `404 not_found` si el contacto no existe o no es de la cuenta; `404 form_not_found` si el formulario no existe en la
  cuenta.
- `422` con `error`: `device_unavailable` (el número no es de la cuenta o no está conectado), `number_not_eligible`
  (no es un número oficial que pueda mandar formularios), `form_not_published` (el formulario no tiene versión
  publicada), `form_not_on_number` (no está publicado en ese número), `recipient_unreachable` (el contacto no tiene
  teléfono ni identificador de WhatsApp), `contact_blocked` (la persona bloqueó al contacto en ese número),
  `window_closed` (pasaron más de 24 horas) y `not_sent` (no se registró ni salió nada; puedes reintentar). También los
  de las reglas de envío de «Mandar mensajes» (`antiblock_duplicate_content`, `antiblock_unanswered_limit`,
  `recipient_unsupported`).
- `429 rate_limited` con `Retry-After`: el ritmo del número o del contacto. `429 mac_lockout_24h`: la cuenta está
  bloqueada por el límite de contactos activos; no se guarda nada (tampoco el `client_reference`), así que reintenta
  cuando termine el bloqueo.
- Un `500`, o una llamada sin respuesta: busca tu `client_reference` en los mensajes del contacto antes de reintentar.

## Recibir lo que contestó el contacto

- Llega por el evento `whatsapp_form.completed`: crea un webhook con `"events": ["whatsapp_form.completed"]` (pide
  **Contactos y conversaciones → Ver**, además del permiso de los webhooks).
- `data.form.id` es el formulario (el `family_id`, el mismo `form_id` con el que lo mandaste) y `data.form.version_id`
  la versión que recibió el contacto. `data.answers` trae una entrada `{key, label, value}` por pregunta, en el orden
  del formulario: `key` es el nombre de la pregunta, `label` su etiqueta y `value` lo que contestó (texto, número,
  `true` o `false`, una lista en las de opción múltiple, o `null` si no la contestó). En las preguntas de lista y de
  opción múltiple, `value` es el id de la opción, no su texto. Cada respuesta de texto llega con hasta 600 caracteres.
- `data.message_id` es el id del mensaje del formulario (`null` si el envío no tuvo un mensaje público),
  `data.device_id` el número por el que salió (`null` si ya no es de la cuenta) y `data.contact_id` el contacto
  (`null` si se borró antes del evento, y las respuestas llegan igual; si se unió con otro, el del contacto que quedó;
  mientras se unen, puede ser el del que se está uniendo).
- Llega aunque la respuesta llegue tarde. Puede llegar más de una vez con el mismo `id`: descarta los repetidos por
  `id`. Si el contacto vuelve a mandar el mismo formulario no llega otro evento: vale la primera respuesta.

## Conversions API: el dataset y la prueba de un número oficial

- Solo números oficiales (`connection` `coexistence` o `dedicated` en `GET /api/v1/devices/{device}`) y solo la clave
  del titular de la cuenta (si no, `403`). `403 capi_feature_disabled`: la Conversions API no está habilitada para la
  cuenta; díselo a la persona y no reintentes.
- **En este orden:** `POST /api/v1/devices/{device}/capi/dataset` crea o recupera el dataset de la WABA del número
  (`waba_id`, `dataset_id`, `scope_ok`, `consented_at`, `last_verified_at`); repetirlo no crea otro. Después,
  `GET /api/v1/devices/{device}/capi/test`: comprueba el permiso `whatsapp_business_manage_events` y el dataset,
  guarda el resultado y devuelve el estado con el enlace al Administrador de eventos de Meta. La especificación no
  describe los campos de la prueba: lee los que llegan.
- `422 device_not_ready`: el número no está listo (la especificación no dice qué le falta). `422
  capi_connection_cap_reached`: la cuenta llegó al tope de conexiones de su plan. `502` (`meta_http_error`,
  `unparseable_response`): Meta no respondió bien; reintenta más tarde.
- `GET /api/v1/devices/capi/datasets`: uno por cada WABA de los números del workspace que ya tiene dataset, con el último estado
  guardado, sin consultar a Meta; por páginas. Para el estado de ahora de un número, la prueba.
- La API no tiene una llamada para mandar eventos de conversión: no le digas a la persona que puede mandar una compra
  por acá.

## Costos de WhatsApp y cuentas de WhatsApp Business (WABA)

- `GET /api/v1/me/whatsapp-costs?month=AAAA-MM`: el resumen de costos de ese mes, de los números del workspace de la
  clave (no de toda la cuenta). Sin `month`, o con uno que no es un mes válido, responde el del mes en curso **sin
  error**: revisa que mandaste `AAAA-MM` antes de decir de qué mes es.
  La especificación no describe los campos del resumen: lee los que llegan y no calcules un total que no venga.
- `GET /api/v1/me/whatsapp-business-accounts`: por páginas (`links.next`), por `id` de menor a mayor. Cada WABA trae
  `id` (el de Meta, como texto), `messaging_limit` y `devices` (`device_id` y `number`, ordenados por `device_id`).
  Una cuenta que solo tiene números por QR recibe una lista vacía: no es un error.
- `messaging_limit`: `tier`, `per_day` (`null` para `TIER_UNLIMITED` o un tier que todavía no se conoce) y
  `checked_at` (cuándo Meta lo confirmó; `null` si la última consulta no pudo reconfirmarlo). Es `null` entero si
  todavía no hay ninguna lectura. El límite es de la **cartera comercial** de Meta dueña de la WABA, no de cada
  número: dos WABA de la misma cartera tienen el mismo límite. Para enterarte cuando cambia,
  `device.messaging_limit_changed` (ver «Administrar tus números»).
- `GET /api/v1/me/whatsapp-business-accounts/{wabaId}`: lo mismo para una, con `{wabaId}` el id numérico de Meta.
  El mismo `404` si no existe, es de otra cuenta, la cuenta no tiene números de WhatsApp Cloud en ella o el id no es
  numérico.
- No traen el nombre de la WABA, su estado de revisión en Meta, la moneda ni la zona horaria (la especificación dice
  que se van a sumar como campos nuevos): no los inventes.

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
