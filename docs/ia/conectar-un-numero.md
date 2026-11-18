# Conectar un número — API de Funnelchat: contexto para tu IA

> Copiado de /docs/conectar-un-numero/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Antes de conectar: los números que ya tiene

`GET /api/v1/devices` lista los números de la cuenta (la clave necesita **Números de WhatsApp → Ver**). Cada uno trae
`id` (el `device_id` de las demás llamadas), `alias`, `number`, `connected` (`1` si está conectado, `0` si no) y
`connection`: `qr` (por QR), `coexistence` o `dedicated` (los dos, oficiales de WhatsApp).

- **Si ya hay un número conectado que le sirve, úsalo: no conectes otro.** Dile cuál encontraste y pregúntale si lo
  usan; si hay varios, pregúntale cuál. Usar uno que ya está no ocupa otro lugar del plan.
- Si el que quiere usar está desconectado (`connected` en `0`), ofrécele reconectarlo: ver «Reconectar un número».
- Si no tiene ninguno, pregúntale cómo lo quiere conectar: su número por QR, o un número de EE. UU. de Funnelchat.

## Conectar un número, paso a paso

Las dos maneras usan el link de alta.

1. `POST /api/v1/connect-links` con uno de estos cuerpos. La clave necesita **Números de WhatsApp → Crear, conectar y
   borrar**.
   - **Su número, por QR:** `{"type": "qr"}`. Opcional, solo por QR: `country` (el país del teléfono que va a
     escanear, dos letras ISO, por ejemplo `"mx"`: si la sesión se abre desde otro país, WhatsApp puede rechazar la
     vinculación).
   - **Un número de EE. UU. de Funnelchat:**
     `{"type": "meta", "allowed_connection_types": ["dedicated"], "provision_us_number": true}`. Antes, cuéntale a la
     persona lo de «Antes de pedir un número de EE. UU.».
   - Opcionales en los dos: `external_reference` (tu propia referencia, por ejemplo `"mi-numero"` o el id de tu
     cliente: pasa al número que se conecte), `return_url` (https: adonde vuelve la persona al terminar, con el
     resultado en la query string: `connect_link_id`, `status` —`completed` o `failed`—, `device_id` o `error_code`) y
     `expires_in_minutes` (de 30 minutos a 7 días; 24 horas si no lo mandas).
2. La respuesta (`201`) trae en `data` el `id` del link y su `url`, **la única vez que aparece**: quien la tenga puede
   conectar un número a esta cuenta mientras el link esté pendiente. Dásela solo a quien va a conectar: a la persona,
   si es su número, o a su cliente. No la guardes en un log ni en un repositorio.
3. Quien conecta abre la URL; abrirla no gasta el link.
   - **Por QR:** la abre en una pantalla que no sea la del celular que va a conectar (por ejemplo, la computadora) y
     toca el botón para conectar. Desde ese momento tiene **10 minutos** para escanear el QR con WhatsApp en el
     celular, en **Dispositivos vinculados**; si no, el link queda `failed` con `qr_timeout` y hay que pedir otro. La
     página renueva el QR sola.
   - **Número de EE. UU.:** elige el número de EE. UU. de Funnelchat, inicia sesión con Facebook y sigue los pasos de
     Meta con su cuenta de WhatsApp Business. El número se crea al terminar.
4. Para saber cuándo quedó conectado, una de estas:
   - el webhook `device.connected`: trae `data.device` (con su `id`, que es el `device_id` de las demás llamadas, y tu
     `external_reference`) y `data.connect_link_id` (el `id` del link);
   - `GET /api/v1/devices?external_reference=mi-numero`: el número aparece cuando el link lo crea; `connected` es `1`
     cuando quedó conectado y `0` si no. Su `id` es el `device_id`. Si consultas así, espera unos segundos entre
     consulta y consulta;
   - la `return_url`, si la mandaste.

- Cada workspace puede tener hasta 20 links pendientes (`429 too_many_open_links`).
- Para saber después si un número sigue conectado: `GET /api/v1/devices` (campo `connected`) o el webhook
  `device.disconnected`.

## Antes de pedir un número de EE. UU.

Dile a la persona, antes de crear el link:

- Va a iniciar sesión con Facebook y seguir los pasos de Meta con su cuenta de WhatsApp Business.
- Meta le cobra los mensajes con el medio de pago de su cuenta de WhatsApp Business: tiene que cargarlo en Meta.
- Ocupa un lugar del plan y cuenta en el tope de números de EE. UU.: hasta 3 por cuenta (menos si el plan tiene menos
  lugares; 1 en las cuentas de prueba). Si ya llegó a ese tope, el link termina `failed` con `quota_exceeded` al
  usarlo.
- Es un número oficial (`connection` `dedicated`): no sigue grupos —eso es solo con números por QR— y a un teléfono que
  no le escribió en las últimas 24 horas solo le manda una plantilla aprobada (ver «Mandar mensajes»).

Si la página falla en el inicio de sesión de Facebook (`facebook_auth_failed`) o Meta da un error (`meta_error`), el
link **sigue `pending`** y la persona puede intentarlo de nuevo con el mismo link; al quinto intento fallido pasa a
`failed` con ese código. `quota_exceeded`, `trial_number_blocked` y `number_not_owned` lo cierran al primer intento.

## Reconectar un número

`POST /api/v1/connect-links` con `device_id` (el `id` de un número de la cuenta) reconecta ese número en lugar de sumar
uno: no ocupa un lugar nuevo y anula los links de reconexión anteriores de ese número. El `type` tiene que coincidir con
el del número: `qr` si su `connection` es `qr`, `meta` si es oficial (y con `meta`, `allowed_connection_types` es
obligatorio). Por ejemplo, `{"type": "qr", "device_id": "dev_Ac7Ku7iIZDXJTjdCu0UB1mX"}`. `country` y `provision_us_number` no valen con
`device_id`. La URL se trata igual que la de un alta.

## Los webhooks de los números

`device.connected` (un número quedó conectado) y `device.disconnected` (un número perdió la conexión) traen
`data.device` (`id`, `name`, `number`, `connection` —`qr`, `coexistence` o `dedicated`— y `external_reference`),
`data.connect_link_id` (el link de alta que lo conectó, o `null`) y `data.workspace_id` (el id del workspace, un
entero). `device.disconnected` trae además `reason`:
`qr_logged_out` (se cerró la sesión de un número por QR), `meta_account_not_registered` (un número oficial dejó de estar
registrado en Meta), `shadow_ban_protection` (Funnelchat lo desconectó para protegerlo de un posible bloqueo),
`disconnected_by_user` (alguien de la cuenta lo desconectó) o `unknown` (no se sabe por qué).

## Errores al conectar

- `403 numbers_not_included`: el plan no incluye números. `403 number_limit_reached`: no queda lugar en el plan.
  `403 connect_not_allowed`: quien llama no es el titular de la cuenta. `402 payment_required`: el pago de la cuenta
  o del workspace está vencido. Reintentar no los arregla: díselo a la persona.
- Cada workspace tiene como máximo un número por QR sin conectar (la cuenta entera, si no usa workspaces). Ese límite
  lo responde `POST /api/v1/devices` (crear un número para mostrar tú el QR: ver «Conectar un número por QR desde tu
  sistema»), con `409 pending_number_exists` y su `device_id`; `POST /api/v1/connect-links` no responde `409`.
- El lugar del plan (el del workspace, si paga su propio plan; si no, el de la cuenta) se controla también al usar el link: si ya no queda, el link termina `failed` con `quota_exceeded`.
  Con un número de EE. UU., lo mismo si la cuenta ya llegó a su tope de números de EE. UU.
- `422 invalid_request`: un dato no es válido; el cuerpo dice cuál. También si `provision_us_number` va sin `dedicated`
  en `allowed_connection_types` o con `device_id`.
- `422 invalid_reference_device`: el `device_id` no es un número de la cuenta. `422 connection_type_mismatch`: el
  `type` no coincide con el del número.
- `503 meta_connect_disabled`: el alta oficial por link (también el número de EE. UU.) no está habilitada en este
  momento. Díselo a la persona; su número por QR sí se puede conectar.
- Para conectar su propio número oficial de WhatsApp (de Meta), indícale a la persona el panel de Funnelchat.
- Un número conectado por QR no es oficial: WhatsApp puede restringirlo o bloquearlo si manda mensajes que la gente no
  espera.

## Llamadas

### Conectar un número

`POST /api/v1/connect-links` · permiso **Números de WhatsApp → Crear, conectar y borrar** · área accounts · `operationId` `connectLink.store`

**Para qué sirve:** Sirve para conectar un número de WhatsApp a tu cuenta —el tuyo o el de tu cliente— desde una página de Funnelchat, sin entrar al panel: le das la `url` de un solo uso a quien lo va a conectar y te enteras del resultado por webhook o en tu URL de vuelta.

> 🔑 **Da el control de un WhatsApp.** Por eso pide **Números de WhatsApp → Crear, conectar y borrar**: crear un número ocupa un lugar del plan, y quien escanee su QR o use un link de alta conecta un teléfono a esta cuenta. Trata el QR y la URL del link como un secreto.

Un link de un solo uso para que tu cliente conecte un número de WhatsApp a tu cuenta, desde
una página de Funnelchat y sin entrar al panel. Envíale la `url` de la respuesta: es la
**única vez** que aparece (Funnelchat guarda solo un hash) y quien la tenga puede conectar
un número a tu cuenta mientras el link esté pendiente. Trátala como un secreto.

Abrir la página no usa el link (la vista previa de un mensajero no lo gasta): el link se
usa cuando tu cliente toca el botón para conectar.

- `type: "qr"`: al tocar el botón se crea el número (si no es una reconexión) y la página
  muestra el QR, que renueva sola cada 5 segundos. Tu cliente tiene **10 minutos** desde
  que toca el botón para escanearlo; si no lo escanea a tiempo, el link queda `failed` con
  `qr_timeout` y el número que creó el link se borra (libera el lugar). Si el alta tomó un
  lugar libre que tu cuenta ya tenía, ese lugar no se borra: queda como estaba. `country`
  (opcional, ISO 3166-1 alfa-2, por ejemplo `"mx"`) es el país desde donde se abre la
  sesión de WhatsApp del número: conviene que sea el del teléfono de tu cliente, porque
  WhatsApp puede rechazar la vinculación («no se puede vincular ahora») si la sesión se abre
  desde otro país. Sin `country` se usa el país que detecta el navegador de tu cliente en
  la página y, si no detecta ninguno, Colombia (`co`). No vale con `device_id` (una
  reconexión no crea el número) ni con `type: "meta"`.
- `type: "meta"`: número oficial con el Embedded Signup de Meta, el mismo del panel. El
  número se crea **al terminar** el Embedded Signup. `allowed_connection_types` es
  obligatorio: `coexistence` (el número sigue en la app WhatsApp Business), `dedicated` (un
  número solo para la API) o los dos, y entonces elige tu cliente. `provision_us_number:
  true` ofrece además un número de EE. UU. del pool de Funnelchat: es siempre un número
  dedicado, así que exige `dedicated` en `allowed_connection_types` y no vale con
  `device_id`; si no, responde `422 invalid_request`. Si falla el inicio de sesión de
  Facebook (`facebook_auth_failed`) o Meta da un error (`meta_error`), el link **sigue
  `pending`** y tu cliente puede intentarlo de nuevo con el mismo link; al quinto intento
  fallido el link pasa a `failed` con ese código. Mientras el alta oficial por link no esté
  habilitada responde `503 meta_connect_disabled`. El cliente le paga a Meta los mensajes
  con el medio de pago de su cuenta de WhatsApp Business: tiene que cargarlo en Meta.

El cupo del plan y el pago de la cuenta se controlan al crear el link y otra vez al usarlo:
el link no reserva lugar. Con el pago vencido, crear el link responde `403`, y usarlo deja
el link `failed` con `quota_exceeded`. Con `device_id` el link **reconecta** ese número (no ocupa un lugar nuevo;
el `type` tiene que coincidir con el del número) y revoca los links de reconexión anteriores
de ese número. Cada workspace puede tener como máximo 20 links pendientes.

Para enterarte del resultado: el webhook `device.connected` (trae `connect_link_id` y
`external_reference`), la `return_url` o `GET connect-links/{link}`. Al terminar, la página
lleva a tu cliente a la `return_url` con el resultado **en la query string**, nada más:
`connect_link_id`, `status` (`completed` o `failed`), `device_id` (solo si completó) y
`error_code` (solo si falló); por ejemplo
`https://tu-sistema.com/vuelta?connect_link_id=<id del link>&status=completed&device_id=<id del número>`. Si tu
`return_url` ya trae parámetros, se suman a los tuyos. El link muere si revocas la clave de
API que lo creó.

Acepta el header `Idempotency-Key` (de 1 a 255 caracteres) para reintentar sin crear otro
link: la misma clave con el mismo cuerpo, desde el mismo workspace y dentro de las 24 horas,
devuelve el mismo link. Otro workspace de la cuenta puede usar la misma clave sin cruzarse
con este.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `type` | string ∈ {"meta", "qr"} | sí | `meta`: official number (Embedded Signup of Meta). `qr`: number by QR code. |
| `allowed_connection_types` | array<string ∈ {"coexistence", "dedicated"}> | no | `type: meta` only, and required there: which official connections the customer may choose (`coexistence` keeps the WhatsApp Business app; `dedicated` does not). |
| `provision_us_number` | boolean | no | `type: meta` only: offer a US number of the Funnelchat pool. |
| `device_id` | string \| null | no | Reconnect THIS number of the account instead of adding one (uses no new place). Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `same_number_as` | string \| null | no | `type: qr` only: add QR to this coexistence number of the account. Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `country` | string \| null | no | `type: qr` only, and not with `device_id` (a reconnection creates nothing): country the WhatsApp session is opened from (ISO 3166-1 alpha-2, two letters, any case). |
| `external_reference` | string \| null | no | Your own reference; it is copied to the number the link creates. |
| `return_url` | string (uri) \| null | no | Where to send the customer at the end (https only). It receives only the result. |
| `expires_in_minutes` | integer \| null | no | How long the link lives, in minutes. |

**Respuestas**

- `201` — El link creado. `url` aparece solo en esta respuesta.

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
- `402` — El pago de la cuenta o del workspace está vencido (`payment_required`). Regularízalo en el panel de Funnelchat para seguir usando esta ruta.
- `403` — El plan no incluye números (`numbers_not_included`), no queda lugar (`number_limit_reached`) o quien llama no es el titular (`connect_not_allowed`).
- `422` — Datos inválidos (`invalid_request`; también `provision_us_number` sin `dedicated` o con `device_id`), `device_id` no es un número de la cuenta (`invalid_reference_device`), el `type` no coincide con el del número (`connection_type_mismatch`), `same_number_as` no admite QR (`qr_requires_coexistence`, `method_already_present`), la clave de idempotencia ya se usó con otro cuerpo (`idempotency_key_mismatch`) o el header `Idempotency-Key` está vacío o tiene más de 255 caracteres (`invalid_idempotency_key`).
- `429` — El workspace ya tiene el máximo de links pendientes (`too_many_open_links`), o se superó el límite de creaciones por minuto. Cabeceras: `Retry-After`
- `503` — El alta de números oficiales por link no está habilitada en este momento (`meta_connect_disabled`).

### Ver tus números

`GET /api/v1/devices` · permiso **Números de WhatsApp → Ver** · área accounts · `operationId` `device.index`

**Para qué sirve:** Sirve para listar tus números de WhatsApp con su proveedor, si están conectados y activos y su estado de salud, y obtener los IDs que usan las demás operaciones.

**Listado** · `perPage` de 1 a 100 (por defecto 25) · orden fijo: id ascendente · no acepta parámetros de orden.

`external_reference` filtra por tu propia referencia (igualdad exacta).

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `external_reference` | query | string \| null | no |  |

**Respuestas**

- `200` — Los números del workspace.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `[].id` | string | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `[].alias` | string |  |
  | `[].image` | string |  |
  | `[].color` | string |  |
  | `[].number` | string |  |
  | `[].normalized_number` | string | `number` en formato internacional normalizado, para reconocer el mismo teléfono conectado por QR y como oficial. `null` mientras el número no está conectado. |
  | `[].first_conecction_at` | string |  |
  | `[].user_id` | string | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `[].provider` | integer ∈ {1, 2, 3, 4} |  |
  | `[].waba_id` | string |  |
  | `[].phone_number_id` | string \| null | El identificador del número en Meta (`phone_number_id`) de un número oficial; `null` en los números por QR. |
  | `[].whatsapp_username` | string \| null |  |
  | `[].is_business` | integer |  |
  | `[].connected` | integer |  |
  | `[].active` | integer \| null |  |
  | `[].health` | string | El resumen del estado de salud de un número oficial, el mismo `health` de `GET devices/{device}/health`. `null` si el número no es oficial. |
  | `[].number_key` | string \| null | La identidad del teléfono de este número: se mantiene aunque se desconecte, y es el último teléfono para mostrar cuando `number` está vacío. |
  | `[].number_key_confirmed` | string | `true` cuando ese teléfono ya se conectó en este número; `false` si `number_key` es solo el teléfono que se espera conectar. |
  | `[].is_coexistence` | boolean |  |
  | `[].slot_state` | string | El estado del lugar del plan que ocupa: `held` (tiene o tuvo un teléfono), `pending` (todavía sin teléfono, pero ya ocupa un lugar), `reserved` (vacío y reservado por un alta en curso) o `free` (vacío, no ocupa lugar). |
  | `[].pool_suspended` | boolean | Si el número está suspendido por el plan (por ejemplo, porque el plan tiene menos lugares que números); `pool_suspension_reason` dice por qué, `pool_keep` si la cuenta eligió conservarlo y `qr_allowed` si se puede conectar por QR. |
  | `[].pool_suspension_reason` | string \| null |  |
  | `[].pool_keep` | boolean |  |
  | `[].qr_allowed` | boolean |  |
  | `[].can_change_to_meta` | boolean | `true` si este número por QR puede pasar a ser oficial en el mismo lugar, con el alta oficial del mismo teléfono. |
  | `[].connected_by_user_id` | string \| null | Quién de la cuenta hizo la conexión actual (`connected_by_name` es su nombre), o `null` si no se sabe; `abilities` dice qué puede hacer con este número quien llama. Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `[].connected_by_name` | string \| null |  |
  | `[].abilities` | object |  |
  | `[].abilities.connect` | boolean |  |
  | `[].abilities.disconnect` | boolean |  |
  | `[].abilities.delete` | boolean |  |
  | `[].abilities.update` | boolean |  |
  | `[].capabilities` | object | Qué se puede hacer con este número por la API, según cómo está conectado. |
  | `[].capabilities.messages` | object |  |
  | `[].capabilities.groups` | object |  |
  | `[].capabilities.statuses` | array<string> |  |
  | `[].connection` | string \| null ∈ {"qr", "coexistence", "dedicated", null} | Cómo está conectado el número: `qr`, `coexistence`, `dedicated`, o `null` si todavía no se sabe. `external_reference` es tu propia referencia. |
  | `[].external_reference` | string \| null |  |
  | `[].overloaded` | boolean | El número está sobrecargado (muchos grupos / conversaciones); `false` si nunca se evaluó. |
  | `[].overloaded_computed_at` | string (date-time) \| null |  |
  | `[].overloaded_groups_count` | integer \| null | En la última evaluación, cuántos grupos tenía el número; `null` si nunca se evaluó. |
  | `[].overloaded_one_to_one_count` | integer \| null |  |
  | `[].overloaded_has_pending_broadcast` | boolean |  |
  | `[].overloaded_has_active_flow` | boolean |  |
  | `[].overloaded_has_active_ai_agent` | boolean |  |
  | `[].overloaded_alert_level` | string | El evento de número sobrecargado: `loud` (sin descartar), `latent` (descartado en este episodio) o `none` (no está sobrecargado o nunca se evaluó). |
  | `[].overloaded_dismissed_at` | string (date-time) \| null |  |
  | `[].sync_all_groups` | boolean | `true` si el dueño activó "Sincronizar todos mis grupos y mensajes" para este número. |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `422` — Validation error (`AccountsValidationException`)
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

## Los eventos

Llegan por webhook. Cómo crear uno, cómo llega cada entrega, los reintentos, el permiso que pide cada evento y cómo verificar la firma (con funciones probadas en Node.js, Python y PHP): https://developers-portal.funnelchat.app/ia/lo-basico.md.

### `device.connected`

Uno de los números de WhatsApp de la cuenta quedó conectado: al escanear el código QR o al terminar el alta de un número de WhatsApp Cloud. Trae `device.connection` (`qr`, `coexistence` o `dedicated`), `device.external_reference` y `connect_link_id` (el link de alta que lo conectó, o null).

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "device.connected",
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
    "connected_at": "2026-10-05T03:00:00Z",
    "connect_link_id": "lnk_AEF0eLF7bcRyfgK70NSWVdy",
    "workspace_id": 37
  }
}
```

### `device.disconnected`

Uno de los números de WhatsApp de la cuenta se desconectó y dejó de poder enviar o recibir. `reason` dice por qué: `qr_logged_out` (se cerró la sesión de un número por QR), `meta_account_not_registered` (un número oficial dejó de estar registrado en Meta y no se pudo volver a registrar solo), `shadow_ban_protection` (Funnelchat lo desconectó para protegerlo de un posible bloqueo), `disconnected_by_user` (alguien de la cuenta desconectó o borró los datos de un número oficial) o `unknown` (no se sabe por qué). Trae `device.connection`, `device.external_reference` y `connect_link_id` (el link de alta que conectó el número por última vez, o null).

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "device.disconnected",
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
    "disconnected_at": "2026-10-05T03:00:00Z",
    "reason": "qr_logged_out",
    "connect_link_id": "lnk_AEF0eLF7bcRyfgK70NSWVdy",
    "workspace_id": 37
  }
}
```

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
