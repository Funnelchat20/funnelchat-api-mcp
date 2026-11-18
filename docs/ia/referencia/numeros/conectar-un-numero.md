# Conectar un número — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/numeros/conectar-un-numero/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
