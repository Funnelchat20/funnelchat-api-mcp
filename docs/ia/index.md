# Lo que puedes hacer — API de Funnelchat: contexto para tu IA

> Copiado de /. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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
- **De dónde sale la clave:** la crea el titular de la cuenta en el panel de Funnelchat, en **Desarrolladores › Crear
  clave**, marcando los permisos; se muestra una sola vez. No se puede crear por la API. Tiene la forma `<id>|fc_live_…`:
  el `|` es parte de la clave, así que en un archivo `.env` va entre comillas simples (`FUNNELCHAT_API_KEY='…'`).
- **Permisos:** cada llamada de abajo dice qué casilla del panel tiene que tener la clave, como «Área → Casilla». Si le
  falta, la API responde `403 permission_denied`: la persona tiene que crear una clave con esa casilla marcada.
- **Workspaces:** cada clave ve y opera solo el workspace donde se creó, y sus topes por minuto, su pago, sus
  suscripciones de webhooks y sus links pendientes se cuentan en él. Lo que es de toda la cuenta lo dice su tema (por
  ejemplo, el horario de silencio y el reporte diario de las alertas). Si el workspace de la clave está archivado, la
  API responde `403` (`WORKSPACE_ARCHIVED` en conversations, `WORKSPACE_INACTIVE` en accounts, `workspace_archived` en
  communities) hasta que se reactive desde el panel.
- **Errores:** el cuerpo trae `error` (un código estable) y `message` (para personas); un `422` trae además `errors`,
  con lo que está mal en cada dato. Decide por el código HTTP y por `error`, nunca por `message`.
  - `401 unauthenticated`: falta la clave, no existe o fue revocada.
  - `402 payment_required`: el pago de la cuenta o del workspace está vencido (solo en las llamadas que lo documentan). Reintentar no
    sirve: díselo a la persona, que lo regulariza en el panel de Funnelchat. `402 plan_cap_reached` (acciones de grupo,
    también al crear un grupo) es el tope del plan, no el pago: tampoco se arregla reintentando.
  - `403 permission_denied`: a la clave le falta la casilla que pide la llamada. `403 route_not_available`: la llamada no
    está abierta a claves y ningún permiso la habilita.
  - `404 not_found`: no existe, es de otra cuenta o es de otro workspace de la cuenta; todo responde igual. Un número de
    otra cuenta o de otro workspace de la cuenta responde este `404` antes que cualquier otro error (también con el pago
    vencido o sin el permiso). Algunas llamadas usan un código propio
    (por ejemplo `group_not_found`).
  - `422`: los datos no son válidos o una regla no deja hacer lo pedido; `errors` o el código dicen qué.
  - `429`: un límite. Con `daily_cap_exceeded` (el tope de 10 000 llamadas por día por clave en accounts y otras
    10 000 en communities, que se reinicia a las 00:00 UTC; conversations no tiene tope diario) o `rate_limited` (el
    tope por minuto), espera los segundos de la cabecera `Retry-After` antes de reintentar. Con `mac_lockout_24h` o `mac_limit_reached` (la cuenta, o el workspace del número si tiene plan propio, llegó a su límite de
    contactos activos) no hay `Retry-After`, reintentar no sirve y no se guarda ningún mensaje ni `client_reference`:
    díselo a la persona. Ver «Límites y errores».
  - `500 internal_error` (en los envíos de mensajes, también `500 gate_misconfigured`): falló algo de Funnelchat.
    Reintenta más tarde; en un envío, antes busca el mensaje por su `client_reference`.
- **Antes de borrar o de algo que no se deshace, pide confirmación.** Una llamada marcada «No se puede deshacer» (por
  ejemplo borrar un número, reiniciar su sesión, desconectarlo, vaciar su cola de mensajes o borrar un dominio propio),
  y cualquiera que borra, cancela, vacía o saca algo (contactos, etiquetas, campos, difusiones, tableros, formularios,
  notas…): hazla solo si la persona lo pide de forma explícita para eso, y antes de llamar confírmale qué vas a cambiar,
  con su nombre y su `id`. Nunca la uses para «probar» ni para arreglar otro error.
- **Listados:** con una clave vienen por páginas (`data`, `links`, `meta`): pide la URL de `links.next` tal cual hasta
  que sea `null`; conserva el tamaño de página, el orden y los filtros. Los mensajes de un contacto
  (`GET /api/v1/contacts/{contactId}/messages`) y las conversaciones (`GET /api/v1/conversations`) van por cursor: sin
  número de página ni `total`, y el cursor no se arma a mano. Si un tema dice otra forma de paginar, sigue la del tema.
- **Probar sin cuenta:** `npx @funnelchat-hq/sandbox` levanta en `http://127.0.0.1:4010` una imitación de la API, con
  las mismas rutas y sin efectos reales; acepta cualquier clave bien formada (por ejemplo `1|fc_live_sandbox`).

## Lo que suele salir mal

- **Crear el contacto antes de mandarle.** No hace falta: el envío (`POST /api/v1/message/send-message`, y también la
  plantilla) acepta `phone`, el teléfono con código de país, y si todavía no es contacto lo crea. El primer mensaje es
  una sola llamada.
- **Buscar un grupo sin pasar por el número.** Los grupos de un número están en
  `GET /api/v1/devices/{device}/groups`, y para escribirle a uno no hace falta seguirlo antes (ver «Grupos»).
- **Creer que la respuesta del envío dice si llegó.** El envío responde el mensaje en `queued`, que no es enviado. El
  resultado (`sent`, `delivered`, `read` o `failed`) llega por el webhook de `message.status_changed` o consultando el
  mensaje. No reenvíes un mensaje `queued`: lo duplicarías.
- **No pedir `message.status_changed` por su nombre.** Al crear un webhook, `events` no tiene comodín (`*` no es un
  valor aceptado): nombra cada evento que quieras, también `message.status_changed`.
- **Escribirle por un número oficial a quien no te escribió en las últimas 24 horas** (también a un teléfono nuevo).
  Responde `422 window_closed`: en ese caso solo sale una plantilla aprobada. Por un número conectado por QR no pasa.
- **Conectar un número sin mirar antes los que ya tiene, o de otra manera.** Si la cuenta ya tiene uno conectado
  (`GET /api/v1/devices`), úsalo. Si no, se conecta con un link de alta (`POST /api/v1/connect-links`): su número por
  QR o un número de EE. UU. de Funnelchat. Ver «Conectar un número».
- **No tener lugar en el plan, o no ser el titular.** Conectar un número responde `403 numbers_not_included` (el plan no
  incluye números), `403 number_limit_reached` (no queda lugar) o `403 connect_not_allowed` (quien llama no es el
  titular). Reintentar no sirve: díselo a la persona.
- **Perder el secreto de un webhook.** Aparece solo en la respuesta del alta: guárdalo en ese momento.

## Qué se puede hacer con esta API

Conectar números de WhatsApp con un link de alta (un código QR que se escanea con el celular, o un número de EE. UU. de
Funnelchat), mandar mensajes de texto
(y plantillas, en números oficiales) a cualquier teléfono, saber si los leyeron, recibir los mensajes que llegan, ver
los grupos de un número, mandarles mensajes sin importarlos antes y seguirlos para enterarse de quién entra y quién sale.
Lo que pasa (un mensaje recibido, un cambio de estado, un número que se conecta, alguien que entra a un grupo) llega a tu
servidor por webhooks.

**Si la cuenta ya tiene un número conectado, no hace falta conectar otro:** míralo primero en `GET /api/v1/devices`.

**El primer mensaje es una sola llamada:** con el número ya conectado, `POST /api/v1/message/send-message` con
`device_id`, `phone` y `text`. No hace falta crear el contacto antes: si el teléfono todavía no es contacto, el envío
lo crea. Por un número oficial, el primer mensaje a un teléfono nuevo es una plantilla (ver «Mandar mensajes»).
Cada sección de abajo explica una de esas cosas, con sus llamadas, sus errores y sus webhooks. Si la persona te pide algo
que no está en este texto, búscalo en https://developers-portal.funnelchat.app/ia/webhooks.md (eventos) o en https://developers-portal.funnelchat.app/ia/referencia.md (llamadas), y en
el índice de temas del final, antes de decir que no existe; no lo inventes.

**Escribe el código; no llames a la API desde el chat.** El código lo corre la persona, en su máquina o en su servidor,
con su clave en `FUNNELCHAT_API_KEY`. Si eres un chat en la web, no tienes su clave ni acceso a la API: no lo intentes.

**Si la persona todavía no tiene cuenta**, puede probar todo en su compu con el sandbox (`npx @funnelchat-hq/sandbox`):
imita la API, no manda nada a WhatsApp y no cuesta nada. Corre en `http://127.0.0.1:4010` e imprime al arrancar la clave
de prueba que acepta. Con el CLI:

```bash
export FUNNELCHAT_BASE_URL=http://127.0.0.1:4010 FUNNELCHAT_API_KEY='la-clave-que-imprime-el-sandbox'
npx @funnelchat-hq/cli send 5491100000000 "¡Hola!"
```

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

## Mandar un texto: una sola llamada

1. Elige el número que manda: el `id` de un número conectado de `GET /api/v1/devices` es el `device_id`.
2. `POST /api/v1/message/send-message` con `{"device_id": "dev_Ac7Ku7iIZDXJTjdCu0UB1mX", "phone": "5491122334455", "text": "¡Hola!"}`. `phone`
   es el teléfono con código de país. **No crees el contacto antes**: el teléfono se busca y, si todavía no es un contacto, el
   envío lo crea en el workspace de la clave, con el mismo permiso (**Contactos y conversaciones → Enviar**). Agrega
   `client_reference` (opcional: de 1 a 64 caracteres visibles, sin espacios; por ejemplo `pedido-8841`) para reconocer
   el envío: vuelve en el evento `message.status_changed` y en la consulta del mensaje. No pongas datos personales en ella.
3. La respuesta es `200` con `message`: el mensaje ya registrado, con su `id`, su `contact_id` (el contacto de ese
   teléfono, nuevo o el que ya existía; el mismo que traen los eventos `message.status_changed`) y `status: "queued"`.
   **`queued` no es enviado**: el resultado (`sent`, `delivered`, `read` o `failed`) llega por el webhook de
   `message.status_changed` o consultando `GET /api/v1/contacts/{contact}/messages/{message}`. No reenvíes un mensaje
   `queued`: lo duplicarías.

## A quién: `phone`, `contact_id` o `whatsapp_id`

- **`phone`** es el camino de arriba y sirve con cualquier número.
- **`contact_id`**, si ya lo tienes (por ejemplo, el `message.contact_id` de un envío anterior o el `data.contact.id` de
  un mensaje recibido), puede ir en lugar de `phone`. Si mandas los dos, tienen que ser del mismo contacto; si no,
  `422 recipient_mismatch`.
- **`whatsapp_id`**, solo con un número oficial de WhatsApp (WhatsApp Cloud): el identificador que manda Meta (BSUID,
  por ejemplo `US.13491208655302741918`), en lugar de `phone`. Por un número conectado por QR responde `422`.

## Fuera de las 24 horas: plantillas

Por un número oficial de WhatsApp (WhatsApp Cloud) solo puedes mandar un mensaje que no es plantilla a un contacto que te
escribió en las últimas 24 horas; si no, `send-message` responde `422 window_closed` y no manda nada. **Por eso, por un
número oficial, el primer mensaje a un teléfono nuevo es una plantilla.** Para escribirle o retomar la conversación
manda una plantilla aprobada:

- `GET /api/v1/templates` lista tus plantillas, con su estado de aprobación.
- `POST /api/v1/devices/{device}/templates/{template}/send-template` con `phone` (o `whatsapp_id`), que va siempre, y,
  si la plantilla tiene variables, `template_variables.body` (una lista de textos). Igual que el texto: si el teléfono
  todavía no es contacto, se crea; `contact_id` es opcional y, si lo mandas, tiene que ser el de ese teléfono. La
  respuesta es la misma: el mensaje en `queued`, con su `contact_id`. Si la plantilla no existe responde
  `404 template_not_found` (y `404 not_found` si el contacto no existe); si una variable usa un campo que no existe en
  la cuenta, `422 template_unresolved_placeholder`; si la plantilla es de otra cuenta de WhatsApp Business que la que
  hoy usa el número, `422 template_waba_mismatch`: tráelas de Meta (abajo) y elige una de esa cuenta.
- **Si la plantilla no está en la lista:** las que la persona crea o cambia directamente en Meta llegan solas una vez
  por día. Si la acaba de crear y no aparece en `GET /api/v1/templates`, **tráela de Meta y vuelve a listar**; no
  concluyas que no existe. `POST /api/v1/devices/{device}/templates`, sin cuerpo, con el `id` del número oficial en
  `{device}`, trae las que se crearon o cambiaron en Meta (y quita las de una cuenta de WhatsApp Business que el número
  ya no usa). Pide **Contactos y conversaciones → Editar**, no la casilla de enviar. Responde `202` con `status`:
  `completed` (ya terminó: lista otra vez) o `in_progress` (la primera página, hasta 100 plantillas, ya está; las demás
  siguen en segundo plano: vuelve a listar en unos segundos).
  - Solo con números oficiales: por un número conectado por QR (o sin cuenta de WhatsApp Business o credenciales en
    Meta) responde `422 number_not_connected_to_meta`.
  - `409 template_sync_in_progress`: ya hay una de ese número en curso. No lances otra: espera unos segundos y lista.
  - `422 meta_rejected`: Meta rechazó la lectura (por ejemplo, el token del número venció); su código viene en
    `meta_code` y no se trajo nada. `502 meta_unavailable`: Meta no respondió.
  - `404`: el número no existe o es de otra cuenta o de otro workspace: responde igual.

Un número conectado por QR no tiene esta ventana: a un teléfono nuevo le mandas el texto directamente.

## Errores al mandar

El cuerpo de un rechazo trae `error` (el código) y `message`; cuando una regla frena el envío, no se manda ni se
registra nada.

- `422 window_closed`: ver «Fuera de las 24 horas».
- `422 antiblock_duplicate_content`: el mismo contenido ya se mandó 2 veces a ese contacto en las últimas 24 horas.
  `422 antiblock_unanswered_limit`: ya van 5 mensajes seguidos sin que el contacto responda. Los contadores se reinician
  cuando el contacto responde.
- `422 recipient_mismatch`: el `phone` o el `whatsapp_id` no son del contacto de `contact_id`. Manda uno solo.
- `422 recipient_unsupported`: el contacto es un grupo, una lista de difusión o un canal; por esta llamada solo se le
  escribe a personas. A un grupo se le escribe con `POST /api/v1/groups/{group}/messages` (ver «Grupos»).
- `422 validation_failed` con `errors`: un dato no es válido, por ejemplo el teléfono; `errors` dice cuál.
- `429 rate_limited` con `Retry-After`: superaste el ritmo del número (WhatsApp Cloud: 60 mensajes por segundo y 10 por
  minuto al mismo contacto; coexistencia: 15 por segundo; QR: sin límite). Espera esos segundos y reintenta.
- `404 not_found` al mandar por `phone` o `whatsapp_id`: solo cuando los workspaces de tu cuenta comparten los contactos
  y ese teléfono ya es un contacto de **otro workspace**. Responde igual que un contacto que no existe, sin datos de
  ese contacto. No reintentes; desde esta clave no se le puede escribir: hace falta una clave creada en ese otro
  workspace. Si cada workspace tiene sus propios contactos, no ocurre: el contacto se busca y se crea en el workspace
  de tu clave.
- `404 not_found` al mandar por `contact_id`: ese contacto no existe. Manda por `phone`.
- `415 bad_request`: el tipo de archivo no se puede mandar; `supported_file_types` trae los que sí.
- `429 mac_lockout_24h` o `mac_limit_reached`: la cuenta (o, si usa workspaces separados, el workspace del número) llegó a su límite de contactos activos. No sale, no se guarda
  nada (tampoco tu `client_reference`) y reintentar no sirve: díselo a la persona (ver «Límites y errores»).
- Un `5xx` (por ejemplo `500 internal_error`, o `500 gate_misconfigured`) o una llamada sin respuesta: el mensaje
  puede haber quedado registrado. No lo reenvíes enseguida: busca tu `client_reference` en los mensajes del contacto
  antes de reintentar; reintentar puede duplicarlo.

## Saber si lo leyeron, paso a paso

1. Crea un webhook: `POST /api/v1/webhooks` con
   `{"url": "https://tu-servidor.example/funnelchat", "events": ["message.status_changed"]}` (opcional:
   `description`). `url` es la dirección pública de tu receptor; usa `https`. `events` lleva de 1 a 50 nombres de
   evento y **no tiene comodín**: nombra cada evento que quieras, también `message.status_changed`. La clave necesita
   **Avisos (webhooks) → Administrar** (así aparece en el panel) y, porque es un evento de mensajes, también
   **Contactos y conversaciones → Ver**; si le falta, responde `422`.
2. La respuesta (`201`) trae el webhook con su `id` y su `secret` (empieza con `whsec_`). **El secreto aparece solo en
   esa respuesta**: guárdalo en el servidor que recibe los eventos (por ejemplo en una variable de entorno) y nunca en
   el código. Con él se verifica cada entrega.
3. Pruébalo: `POST /api/v1/webhooks/{id}/test` manda una sola entrega `webhook.test`, firmada igual que una real, y
   responde si tu servidor contestó `2xx`.
4. Cada cambio de estado llega como `message.status_changed`. Relaciónalo con tu envío por `data.message_id` (el `id`
   que devolvió el envío) junto con `data.contact_id`, y por `data.client_reference` si la mandaste. `data.status` es
   `sent`, `delivered`, `read` o `failed`: **`read` es que lo leyeron**.
5. Sin esperar el webhook: `GET /api/v1/contacts/{contact}/messages/{message}`, con el `contact_id` y el `id` que
   devolvió el envío, devuelve el mensaje con su `status`.

- No crees un webhook por cada cosa: `GET /api/v1/webhooks` lista los del workspace de tu clave, también los de otras
  integraciones, así que guarda el `id` del tuyo. Para cambiar la dirección o los eventos, usa «Editar un webhook»
  (`PUT /api/v1/webhooks/{id}`): reemplaza la dirección y la lista de eventos, así que manda todo como tiene que quedar.

## Recibir mensajes, paso a paso

1. Crea un webhook con `message.received`: `POST /api/v1/webhooks` con `"events": ["message.received"]` (la clave
   necesita también **Contactos y conversaciones → Ver**). Si ya tienes un webhook y quieres sumar este evento, usa
   «Editar un webhook» (`PUT /api/v1/webhooks/{id}`) con la lista completa de eventos, este incluido. Guarda el
   `secret` de la respuesta del alta: aparece una sola vez.
2. Cada mensaje entrante llega como `message.received`, con `data.message` (`id`, `type`, `text`, `media`),
   `data.contact` (`id`, `name`, `phone`), `data.receiver.phone` (el teléfono de tu número que lo recibió) y
   `data.device_id` (el número de tu cuenta que lo recibió). `data.message.type` dice si es texto u otra cosa.
3. Para contestar: `POST /api/v1/message/send-message` con `contact_id` = `data.contact.id` y `device_id` =
   `data.device_id`. Como el contacto te acaba de escribir, la ventana de 24 horas de un número oficial está abierta.

## Grupos: empieza por los grupos del número

- **Los grupos de un número están en `GET /api/v1/devices/{device}/groups`**: los lee de WhatsApp, también los que
  todavía no están en el workspace de tu clave. `{device}` es el `id` del número en `GET /api/v1/devices`. La clave necesita
  **Grupos y campañas → Ver**.
- Viene por páginas: `page` y `pageSize` (25 por defecto, hasta 100); pide `page` 1, 2, … hasta `meta.last_page`. Cada
  grupo trae `uid` (su identificador en WhatsApp, por ejemplo `120363000000000001@g.us`) y `name`; si ya está en el
  workspace, trae además `device_id`. La lista se reutiliza durante un minuto por número: un grupo recién creado en
  WhatsApp puede tardar hasta un minuto en aparecer.
- **Para encontrar un grupo por su nombre**, compara el `name` de cada grupo de todas las páginas. La especificación
  declara también un parámetro `name`, sin descripción todavía en la especificación. Si ningún grupo coincide, o
  coincide más de uno, muéstrale a la persona los nombres parecidos y pregúntale cuál es; no elijas por ella.
- **El número que manda** es aquel en cuya lista aparece el grupo. Si la persona tiene un solo número conectado, es
  ese. Con varios, busca en la lista de cada número conectado.

## Mandar un mensaje a un grupo, paso a paso

1. Toma el `uid` del grupo y el `id` del número de la lista de arriba.
2. `POST /api/v1/groups/{group}/messages`, con `{group}` el `uid` del grupo, y
   `{"device_id": "dev_Ac7Ku7iIZDXJTjdCu0UB1mX", "type": "text", "text": "¡Hola a todos!"}`. `type` es `text`, `image`, `video`, `audio` o
   `document`; para un archivo, `media_url` (hasta 255 caracteres) y, si quieres, `caption` y `file_name`.
   **No lo sigas antes:** si el grupo todavía no está en el workspace y el número es por QR, este envío lo importa (lo
   empieza a seguir) y sigue con el envío. La clave necesita **Grupos y campañas → Enviar** y, si el grupo todavía no
   estaba en el workspace, además **Grupos y campañas → Administrar grupos**. Esa importación cuenta en el tope de 5 por
   minuto del número.
3. **No sale dentro de la llamada.** La respuesta es `202` con `action_id` y `"status": "queued"`: el pedido quedó
   en cola y el mensaje sale después, al ritmo del número. Para saber cómo salió, consulta
   `GET /api/v1/groups/actions/{action}` con ese `action_id`, o espera el webhook `group_action.completed` (salió) o
   `group_action.failed` (falló). **`queued` no es enviado**, y no reenvíes el pedido: lo mandarías dos veces.
4. La consulta responde `data` con `status` (`queued`, `running`, `completed` o `failed`), `result` y `reason`.
   Con `completed`, `result.message.uid` es el id del mensaje en WhatsApp; mientras está `queued` o `running`,
   `result` y `reason` son `null`; con `failed`, `result` es `null` y `reason` dice por qué (un código, por ejemplo
   `device_not_connected` o `window_closed`; lo que no tiene un motivo propio sale `internal_error`).

## Seguir un grupo: enterarte de quién entra y quién sale

- Para qué: que el grupo quede en el workspace y que desde entonces lleguen los eventos de quién entra y quién sale. Para
  escribirle no hace falta: el envío lo sigue solo.
- `POST /api/v1/groups/{group}/import`, con `{group}` el `uid` del grupo y `{"device_id": "dev_Ac7Ku7iIZDXJTjdCu0UB1mX"}`. La clave necesita
  **Grupos y campañas → Administrar grupos**.
- Responde `201` si lo importó y `200` si ya estaba en el workspace, los dos con `data`: `uid`, `name`, `imported`
  (`true` si lo importó esta llamada) e `is_admin` (si el número es administrador del grupo, según WhatsApp, leído en la
  misma llamada). Con `is_admin: false` el grupo queda en el workspace, pero ese número no puede escribirle.
- Solo con números conectados por QR, hasta 5 grupos por minuto por número. Dos pedidos a la vez por el mismo grupo lo
  importan una sola vez. Si cada workspace de la cuenta tiene sus propios grupos, se importa la copia de este workspace sin tocar la del otro; si no, el grupo es uno solo para toda la cuenta y responde `404 group_not_found`.

## Quién entra y quién sale: el webhook

- Llegan por los eventos `group_participant.joined` y `group_participant.left`, de los grupos que están en el workspace:
  un grupo los genera desde que se sigue (con «Seguir un grupo», con el primer envío o desde el panel).
- Crea un webhook con `POST /api/v1/webhooks` y `"events": ["group_participant.joined", "group_participant.left"]`;
  la clave necesita además **Grupos y campañas → Ver**. Cada evento trae `data.group` (`uid`, `name`),
  `data.participant` (`identity`, `identity_type`, `name`) y `data.campaign` (`null` si el grupo no es de una campaña).
- Llega como mucho uno por persona, grupo y día UTC: si la misma persona vuelve a entrar al mismo grupo ese día, o
  vuelve a salir, no llega otro. No los uses para contar entradas y salidas.

## Errores al seguir un grupo y al mandarle

El cuerpo de un rechazo trae `error` (el código) y `message`.

- `403 import_permission_required`: el grupo no estaba en el workspace y a la clave le falta **Grupos y campañas →
  Administrar grupos** para seguirlo. La persona tiene que crear una clave con esa casilla marcada.
- `422 device_not_group_admin`: el número no es administrador del grupo; no se siguió nada. Reintentar no sirve.
- `422 provider_unsupported`: el número no permite eso; trae `provider` y, si a la cuenta le falta una habilitación,
  `requires` con lo que hace falta. Seguir un grupo con un número oficial responde esto: los grupos se siguen solo con números por
  QR. Mandarle un mensaje con un número oficial también, cuando el chat de grupos de la API oficial no está disponible
  para ese grupo, sea cual sea el tipo de mensaje.
- `404 group_not_found`: el grupo no es de ese número o no existe en el workspace de tu clave. `404 device_not_found`: el número no
  existe en el workspace de tu clave.
- `422 device_not_connected`: el número no está conectado. `422 device_not_group_number`: el número no es el del grupo.
- Con un número oficial de WhatsApp se verifican, antes de aceptar, la ventana de 24 horas (`422 window_closed`) y la
  calidad del número (`422 number_restricted`).
- `429 import_rate_limited`: el número ya siguió 5 grupos en el último minuto; trae `retry_after` en segundos: espera
  ese tiempo y reintenta. `429 too_many_pending_actions`: el número ya tiene 50 pedidos en cola sin terminar; espera a
  que salgan.
- `409 import_in_progress`: otro pedido está siguiendo ese mismo grupo en este momento. Reintenta en unos segundos: si
  ya quedó en la cuenta, responde `200`.
- Un `5xx` (por ejemplo `502 provider_error`) o una llamada sin respuesta: no hay clave de idempotencia, así que
  reintentar un envío puede mandar el mensaje dos veces.

## Workspaces

- Cada clave trabaja en un solo workspace: el de la cuenta donde la persona la creó, en el panel. Lo que la clave ve y
  hace queda dentro de ese workspace. Para trabajar en otro workspace, la persona crea otra clave desde ese workspace,
  en el panel.
- Al mandar por `phone` (o `whatsapp_id`), el teléfono se busca y, si todavía no es contacto, se crea en el workspace de
  la clave. Si en la cuenta cada workspace tiene sus propios contactos, se busca solo en el workspace de la clave: que
  otro workspace tenga un contacto con ese teléfono no cambia la respuesta. Si los workspaces comparten los contactos y
  el teléfono es contacto de otro workspace de la cuenta, el envío responde `404 not_found`, igual que un contacto que
  no existe y sin datos de ese contacto; para escribirle, la persona usa una clave creada en ese workspace.
- Los webhooks son del workspace: cada suscripción recibe solo los eventos de su workspace.
- Una cuenta puede usar workspaces separados (cada uno con sus propios contactos, grupos, plan, pago y topes por
  minuto) o compartir lo suyo; cada texto de la referencia dice cuál de los dos casos describe.
- Todos los eventos de los webhooks traen `data.workspace_id`, el id del workspace del número (un entero; por ejemplo,
  `37`).
- **De toda la cuenta, no del workspace:** el horario de silencio y el reporte diario de las alertas
  (`/api/v1/alerts/quiet-hours` y `/api/v1/alerts/daily-report`) son uno solo por cuenta: cambiarlos cambia los de
  toda la cuenta. Confírmalo con la persona antes.

## Límites

Todo límite responde `429` con su código en `error`. Nunca repitas una llamada que respondió `429` sin esperar lo que
indica `Retry-After`; si no trae `Retry-After`, no la repitas.

- **Por día:** cada clave hace hasta 10 000 llamadas por día en accounts y otras 10 000 en communities, y
  cada área cuenta aparte. conversations no tiene tope diario. El área de cada llamada es su `x-fc-domain` en la
  especificación publicada (`/specs/funnelchat.json`). El tope se reinicia a las 00:00 UTC. Al pasarlo,
  `429 daily_cap_exceeded` con `Retry-After`: los segundos que faltan para las 00:00 UTC. Hasta entonces, no repitas
  llamadas de esa área; las de las otras áreas siguen funcionando. Si el código hace muchas llamadas por día a
  accounts o a communities (una sincronización, un proceso que recorre listados), cuéntalas y repártelas.
- **Por minuto:** cada área limita las llamadas por minuto, por grupo de llamadas, y cada grupo cuenta aparte. Según la
  llamada, el cupo es por usuario (lo comparten todas las claves del usuario de Funnelchat dueño de la clave y su uso
  del panel, así que el panel u otra integración de la misma persona pueden gastarlo), por workspace (lo comparten las
  claves y el panel de ese workspace; cada workspace de la cuenta tiene el suyo), por clave o por número. Si la cuenta
  usa workspaces separados, el cupo por usuario también se cuenta en cada workspace. Al pasarlo, `429 rate_limited` con `Retry-After`: espera esos segundos y reintenta. No dispares muchas
  llamadas en paralelo: repártelas en el tiempo.
  - accounts: la mayoría, 200 por workspace. Crear un número, reiniciar su sesión, anular un link de alta y crear o
    probar un webhook, 10 por clave entre todas; crear un link de alta, otros 10 por clave; ver, editar y borrar
    webhooks y ver sus entregas, 60 por clave; `POST /api/v1/devices/{device}/health/refresh`, 6 por número;
    `GET /api/v1/me` y las alertas, sin límite por minuto propio. El `429` de cada llamada de accounts en la
    especificación publicada dice el suyo.
  - communities: todo por usuario, hasta 600 entre todas las llamadas. Además, 30 entre crear un grupo, sus acciones
    y mandarle un mensaje; 30 para importar un grupo; 30 para leer en el momento el link de invitación o las
    solicitudes; 60 para `GET /api/v1/groups/actions/{action}`.
  - conversations: escrituras, 30 por usuario (las más delicadas, como borrar contactos o campos o cancelar una
    difusión, 10); varias lecturas, 120 por usuario; listar contactos, conversaciones y mensajes, sin límite por
    minuto; formularios de WhatsApp, 120 lecturas y 60 cambios por clave, y 30 por workspace en lo que pasa por Meta;
    marcar todas las conversaciones, 5 por workspace.
  - Los envíos de mensajes no tienen límite por minuto: los limita el ritmo por número, con el mismo
    `429 rate_limited` y `Retry-After` (ver «Mandar mensajes»).
    Con una clave, estas no cuentan en el tope de escrituras por minuto (solo el ritmo del número):
    `POST /api/v1/message/send-message`, `POST /api/v1/contacts/{contact}/message`,
    `POST /api/v1/devices/{device}/templates/{template}/send-template`, `POST /api/v1/contacts/{contact}/message/contact-card`,
    `POST /api/v1/contacts/{contact}/messages/{message}/forward`, `POST /api/v1/contacts/{contact}/message/form` y poner o
    quitar una reacción (`PUT` y `DELETE /api/v1/contacts/{contact}/messages/{message}/reaction`). Una nota interna
    (`note: true`) no es un envío y sí cuenta.
- **Contactos activos:** un envío puede responder `429` con `mac_lockout_24h` o `mac_limit_reached` cuando la cuenta
  (o, si usa workspaces separados, el workspace del número, que tiene su propio plan) llegó a su límite de contactos
  activos. No trae `Retry-After` y reintentar no sirve hasta que cambie el límite (al
  sumar capacidad o al empezar un ciclo nuevo con cupo): díselo a la persona. Antes de un envío grande, mira
  `GET /api/v1/mac/status`.
- **Contactos activos, sin rastro:** un envío frenado por `mac_lockout_24h` o `mac_limit_reached` no guarda ningún
  mensaje ni el `client_reference`: no lo busques en el historial del contacto.
- **Workspace archivado:** `403` en toda llamada de conversations (`error` `WORKSPACE_ARCHIVED`); en accounts, en las
  rutas que cortan por pago, `403` con `error` `WORKSPACE_INACTIVE` e `inactive_reason` `archived`, no `402`; en
  communities, `403 workspace_archived` en las operaciones que necesitan el plan activo. Reintentar no sirve hasta que
  la persona lo reactive desde el panel.
- **Pago vencido:** `402 payment_required` (el pago de la cuenta o del workspace) solo en las llamadas que lo documentan en la especificación publicada; las
  demás siguen respondiendo aunque el pago esté vencido. En las acciones de grupo, `402 plan_cap_reached` es el plan, no
  el pago; al crear un grupo (`POST /api/v1/groups`) es el tope de grupos oficiales del plan y trae `cap` y `used`.
  Reintentar no sirve en ninguno de los dos: díselo a la persona.
- **Otra cuenta:** con un número de otra cuenta o de otro workspace de la cuenta, la API responde `404 not_found` antes
  que cualquier otro error (aunque el pago esté vencido o a la clave le falte un permiso). Un `404` no dice que el número no exista: puede ser de otra cuenta o de otro
  workspace.
- **`500`:** `internal_error`; en los envíos de mensajes, también puede llegar `gate_misconfigured`. Reintenta más tarde, y en un envío busca antes el mensaje por su `client_reference`.

## Identificadores

- Todo id de la API (los que devuelve y los que acepta) es un id opaco: un texto con un prefijo de tres letras, un
  guion bajo y 23 caracteres letras y números, por ejemplo `ctc_ABsza6Ialu1BCUyPFZ8WJvV`. El prefijo dice el tipo:
  `dev_` número de WhatsApp, `ctc_` contacto, `msg_` mensaje, `tag_` etiqueta, `stg_` etapa, `knb_` tablero,
  `flw_` flujo, `cmp_` campaña, `tpl_` plantilla, `lnk_` link de alta, `dlv_` entrega de webhook, `usr_` usuario
  del equipo (la tabla entera está en la página «Identificadores»).
- Úsalos tal como llegan: como texto, en la ruta, en la query y en el cuerpo. No los interpretes, no los armes, no los
  conviertas a números.
- Siguen como estaban: el `uid` de un grupo, el `uuid` de una campaña, el `uid` de un mensaje, el `uid` o `uuid` de una
  acción de grupo, los ids de las cuentas de WhatsApp Business y `workspace_id`.
- No hay período de transición: un entero en una ruta o en un cuerpo responde `404 not_found` (en un cuerpo, lo mismo
  que un id que no existe en esa ruta). Un id mal formado o de otro tipo responde igual. Si la persona tiene ids
  enteros guardados, pídelos de nuevo a la API (listando); no se pueden convertir.
- Si la persona necesita un id y no está a mano, el panel de Funnelchat lo muestra como «ID para la API», con un botón
  de copiar, en sus números de WhatsApp, en Desarrolladores y en las suscripciones de webhooks.

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

### Mandar un mensaje

`POST /api/v1/message/send-message` · permiso **Contactos y conversaciones → Enviar** · área conversations · `operationId` `message.sendMessage`

**Para qué sirve:** Sirve para enviar un mensaje de texto o un archivo a un teléfono, aunque todavía no sea tu contacto (se crea solo), o a un contacto por su `contact_id`, indicando en el cuerpo el número desde el que sale.

Indica a quién envías con `phone`: el teléfono con código de país, por ejemplo `5491122334455`. No hace falta crear el contacto antes: el teléfono se busca y, si todavía no es un contacto, se crea en el workspace de tu clave, igual que con `POST /contacts/update-or-create` y con el mismo permiso, que **Enviar** ya incluye. Si en tu cuenta cada workspace tiene sus propios contactos, se busca solo en el workspace de tu clave; si tus workspaces comparten los contactos, en toda tu cuenta. La respuesta trae su id en `message.contact_id`, el mismo que llevan los eventos `message.status_changed`. Si el teléfono no es válido, la respuesta es la misma que daría `POST /contacts/update-or-create`: 422. Si tus workspaces comparten los contactos y el teléfono ya es un contacto de otro workspace de tu cuenta, también: 404, sin datos de ese contacto. Con un número oficial de WhatsApp (API Cloud) también puedes indicar `whatsapp_id`, el BSUID que envía Meta (por ejemplo `US.13491208655302741918`), en lugar de `phone`; usado así con un número conectado por QR, responde 422. En un número oficial, el primer mensaje a un contacto nuevo tiene que ser una plantilla: un mensaje libre solo sale dentro de las 24 horas desde que el contacto te escribió. Si ya tienes el `contact_id`, puedes seguir enviándolo: si junto con él mandas `phone` o `whatsapp_id`, tienen que ser de ese mismo contacto (si no, 422 `recipient_mismatch`). En `send-template`, `phone` o `whatsapp_id` va siempre, con o sin `contact_id`.

Si el límite de contactos activos (MAC) frena el envío, responde `429` con `error` = `mac_lockout_24h` o `mac_limit_reached` y sin `Retry-After`: reintentar no sirve hasta que sumes capacidad o empiece un ciclo nuevo. El envío no sale y no se guarda ningún mensaje ni tu `client_reference`: no queda nada en el historial del contacto. Detalle en «Errores y límites».

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `text` | string | no |  |
| `contact_id` | string \| null | no | Id opaco: un texto que empieza con `ctc_`. Se usa tal como llega; no se arma ni se interpreta. |
| `phone` | string \| null | no |  |
| `whatsapp_id` | string \| null | no |  |
| `file` | string | no | Archivo del mensaje: el nombre de un archivo ya subido a tu cuenta o la URL pública de un archivo (te recomendamos `https://`), que WhatsApp o el proveedor descarga; admite hasta 4096 caracteres. Si empieza con `http`, en mayúsculas o minúsculas, tiene que ser una URL `http://` o `https://`; si no, la respuesta es 422. Consulta la sección «Enviar un archivo por URL». |
| `file_type` | string \| null ∈ {"image", "video", "audio", "document", "sticker", null} | no | Tipo del archivo. Es obligatorio cuando `file` es una URL que no termina en una extensión reconocida; si lo envías, manda sobre la extensión. Valores: `image`, `video`, `audio`, `document`, `sticker`. Consulta la sección «Enviar un archivo por URL». |
| `file_name` | string \| null | no | Nombre con el que el contacto ve un documento, con su extensión (por ejemplo `factura.pdf`), de hasta 255 caracteres. Es obligatorio al enviar un documento por URL que no termina en una extensión de la lista. Consulta la sección «Enviar un archivo por URL». |
| `temporal_uuid` | string | no |  |
| `local_id` | string \| null | no |  |
| `note` | boolean | no |  |
| `mentions` | array<integer> \| null | no |  |
| `client_reference` | string \| null | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `message` | PublicMessageResource \| null |  |
  | `message.id` | string | Id opaco: un texto que empieza con `msg_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `message.contact_id` | string \| null | Id opaco: un texto que empieza con `ctc_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `message.device_id` | string \| null | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `message.direction` | string ∈ {"outbound", "inbound"} |  |
  | `message.type` | string ∈ {"text", "image", "video", "document", "sticker", "contact", "audio", "note", "action", "invalid", "interactive", "location", "voice_call", "video_call", "event", "button", "template", "notification", "option_list", "template_button_reply", "poll", "whatsapp_form", "call_permission_request", "call_permission_reply", "request_contact_info"} |  |
  | `message.status` | string \| null ∈ {"sent", "delivered", "read", "failed", "queued", null} |  |
  | `message.error` | object \| null |  |
  | `message.client_reference` | string \| null |  |
  | `message.created_at` | string \| null |  |
  | `message.updated_at` | string \| null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found
- `415` — Unsupported Media Type
- `422` — Unprocessable Content
- `429` — Too Many Requests. Cabeceras: `Retry-After`
- `500` — Internal Server Error

### Mandar una plantilla

`POST /api/v1/devices/{device}/templates/{template}/send-template` · permiso **Contactos y conversaciones → Enviar** · área conversations · `operationId` `messageTemplate.send`

**Para qué sirve:** Sirve para enviar una plantilla desde uno de tus números a un teléfono o contacto, completando sus variables, por ejemplo un recordatorio, una confirmación o una novedad. Si una plantilla que creaste directamente en Meta todavía no aparece en tu lista, tráela con «Traer tus plantillas de Meta» (`POST /api/v1/devices/{device}/templates`).

Indica a quién envías con `phone`: el teléfono con código de país, por ejemplo `5491122334455`. No hace falta crear el contacto antes: el teléfono se busca y, si todavía no es un contacto, se crea en el workspace de tu clave, igual que con `POST /contacts/update-or-create` y con el mismo permiso, que **Enviar** ya incluye. Si en tu cuenta cada workspace tiene sus propios contactos, se busca solo en el workspace de tu clave; si tus workspaces comparten los contactos, en toda tu cuenta. La respuesta trae su id en `message.contact_id`, el mismo que llevan los eventos `message.status_changed`. Si el teléfono no es válido, la respuesta es la misma que daría `POST /contacts/update-or-create`: 422. Si tus workspaces comparten los contactos y el teléfono ya es un contacto de otro workspace de tu cuenta, también: 404, sin datos de ese contacto. Con un número oficial de WhatsApp (API Cloud) también puedes indicar `whatsapp_id`, el BSUID que envía Meta (por ejemplo `US.13491208655302741918`), en lugar de `phone`; usado así con un número conectado por QR, responde 422. En un número oficial, el primer mensaje a un contacto nuevo tiene que ser una plantilla: un mensaje libre solo sale dentro de las 24 horas desde que el contacto te escribió. Si ya tienes el `contact_id`, puedes seguir enviándolo: si junto con él mandas `phone` o `whatsapp_id`, tienen que ser de ese mismo contacto (si no, 422 `recipient_mismatch`). En `send-template`, `phone` o `whatsapp_id` va siempre, con o sin `contact_id`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí |  |
| `template` | path | string | sí |  |

**Cuerpo** (`application/json`)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `contact_id` | string \| null | no | Id opaco: un texto que empieza con `ctc_`. Se usa tal como llega; no se arma ni se interpreta. |
| `phone` | string \| null | no |  |
| `whatsapp_id` | string \| null | no |  |
| `template_variables` | object | no |  |
| `template_variables.body` | array<string \| null> | no |  |
| `client_reference` | string \| null | no |  |

**Respuestas**

- `200` — OK

  La misma tabla que en «Mandar un mensaje», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found
- `422` — Unprocessable Content
- `429` — Too Many Requests. Cabeceras: `Retry-After`
- `500` — Internal Server Error

### Ver tus plantillas

`GET /api/v1/templates` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `messageTemplate.templates`

**Para qué sirve:** Úsalo para listar tus plantillas de WhatsApp con su estado de aprobación, categoría, idioma y número, y elegir cuál usar en un envío. Si una que creaste directamente en Meta no aparece, tráela con «Traer tus plantillas de Meta» (`POST /api/v1/devices/{device}/templates`) y vuelve a listar.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `name` | query | string \| null | no |  |
| `uid` | query | string \| null | no |  |
| `language_code` | query | string \| null | no |  |
| `status` | query | string \| null ∈ {"PENDING", "APPROVED", "REJECTED", "PENDING_DELETION", "PAUSED", "DISABLED", "ARCHIVED", null} | no |  |
| `category` | query | string \| null | no |  |
| `deviceId` | query | string \| null | no |  |
| `type` | query | string \| null ∈ {"text", "image", "document", "video", "location", "default", null} | no |  |
| `created_by_webhook` | query | boolean | no |  |
| `quality[]` | query | array<string \| null ∈ {"GREEN", "YELLOW", "RED", "UNKNOWN", "NOT_APPLICABLE", null}> \| null ∈ {"GREEN", "YELLOW", "RED", "UNKNOWN", "NOT_APPLICABLE", null} | no |  |
| `include` | query | string \| null ∈ {"quality_counts", null} | no |  |
| `scope` | query | string \| null ∈ {"waba", null} | no |  |
| `perPage` | query | integer | no |  |
| `orderBy` | query | string ∈ {"name", "created_at", "updated_at"} | no |  |
| `orderByMethod` | query | string ∈ {"asc", "desc"} | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<object> |  |
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

### Traer tus plantillas de Meta

`POST /api/v1/devices/{device}/templates` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `messageTemplate.sync`

**Para qué sirve:** Úsalo si creaste o cambiaste una plantilla directamente en Meta y todavía no aparece en tu lista (llegan solas una vez por día): la trae en el momento. Solo con números oficiales de WhatsApp. Si responde `in_progress`, vuelve a listar en unos segundos.

Sincroniza con Meta las plantillas de un número de la API oficial de WhatsApp: trae las que se crearon o cambiaron directamente en Meta y quita las de una cuenta de WhatsApp Business que el número ya no usa. `{device}` es el `id` del número.

- **Asíncrona:** la primera página (hasta 100 plantillas) se lee en el momento y las siguientes en segundo plano. Responde 202 con `status`: `completed` si ya terminó, `in_progress` si sigue. Las plantillas sincronizadas se listan con `GET /templates`.
- **Una a la vez:** mientras hay una sincronización de ese número en curso, otra llamada responde 409 y no lanza una nueva.
- **Errores de Meta:** si Meta rechaza la lectura (por ejemplo, porque el token del número venció o la cuenta de WhatsApp Business no existe), responde 422 `meta_rejected` con el código de error de Meta en `meta_code` y no sincroniza nada.

| HTTP | `error` | Cuándo |
|---|---|---|
| 404 | — | El número no existe en tu cuenta o está fuera del workspace de tu clave. |
| 409 | `template_sync_in_progress` | Ya hay una sincronización de ese número en curso. |
| 422 | `number_not_connected_to_meta` | El número está conectado por QR o no tiene una cuenta de WhatsApp Business o credenciales en Meta. |
| 422 | `meta_rejected` | Meta rechazó la lectura de las plantillas (`meta_code` trae su código de error). |
| 429 | — | Demasiadas solicitudes por minuto (ver `Retry-After`). |
| 502 | `meta_unavailable` | Meta no respondió. |

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí |  |

**Respuestas**

- `202` — Accepted

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `status` | string ∈ {"in_progress", "completed"} |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found
- `409` — Conflict
- `422` — Unprocessable Content
- `502` — Bad Gateway

### Ver un mensaje

`GET /api/v1/contacts/{contact}/messages/{message}` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `message.showMessage`

**Para qué sirve:** Úsalo para saber qué pasó con un mensaje que enviaste: con el id que te devolvió el envío ves su estado (en cola, enviado, entregado, leído o fallido) y, si falló, el motivo.

Devuelve un mensaje de tu cuenta por el id que te dio el envío o un webhook. Aceptado no es entregado: el estado final llega por `message.status_changed` o por este GET. `status` es `queued`, `sent`, `delivered`, `read` o `failed` en los mensajes que enviaste. `sent`, `delivered`, `read` y `failed` tienen el mismo significado que en `message.status_changed`; `queued` es un mensaje en cola que todavía no se envió (en cola no es enviado) y no se reintenta. `status` es `null` en los mensajes recibidos, las notas y las acciones. `status` también es `null` en un mensaje enviado cuyo resultado no se conoce (el proveedor no confirmó ni rechazó el envío o el envío se interrumpió): puede haber llegado y no cambia de estado; también cuando lleva más de una hora en cola sin resultado: un mensaje cuyo envío no empezó dentro de la hora ya no sale; pasada la hora sin resultado, `status` es `null`, o `failed` con `error.reason` `not_sent` y su evento si su envío llega tarde. Reintentar es un envío nuevo, que sólo puede duplicar si el envío había empezado y se cortó. `error` trae `code`, `title` y `reason` solo cuando `status` es `failed`. `error.reason` es `null` cuando el rechazo lo informó el proveedor; si Funnelchat decidió que un mensaje enviado con clave no salía, trae `device_unavailable`, `insufficient_balance`, `window_closed`, `recipient_unreachable`, `template_not_found`, `template_unresolved_placeholder`, `not_queued` o `not_sent`, `code` es `null` y `title` es un texto llano en el idioma de la cuenta. `client_reference` es la referencia que mandaste al enviar, o `null`. Responde 404 si el mensaje no existe o no es de ese contacto.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `contact` | path | string | sí |  |
| `message` | path | string | sí |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string | Id opaco: un texto que empieza con `msg_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `contact_id` | string \| null | Id opaco: un texto que empieza con `ctc_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `device_id` | string \| null | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `direction` | string ∈ {"outbound", "inbound"} |  |
  | `type` | string ∈ {"text", "image", "video", "document", "sticker", "contact", "audio", "note", "action", "invalid", "interactive", "location", "voice_call", "video_call", "event", "button", "template", "notification", "option_list", "template_button_reply", "poll", "whatsapp_form", "call_permission_request", "call_permission_reply", "request_contact_info"} |  |
  | `status` | string \| null ∈ {"sent", "delivered", "read", "failed", "queued", null} |  |
  | `error` | object \| null |  |
  | `error.code` | integer \| null |  |
  | `error.title` | string \| null |  |
  | `error.reason` | string \| null |  |
  | `client_reference` | string \| null |  |
  | `created_at` | string \| null |  |
  | `updated_at` | string \| null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)

### Crear un webhook

`POST /api/v1/webhooks` · permiso **Avisos (webhooks) → Administrar** · área accounts · `operationId` `webhookSubscription.store`

**Para qué sirve:** Sirve para empezar a recibir eventos en tu sistema: eliges la URL y los eventos de cualquiera de las tres áreas, y guardas el secreto de firma, que se muestra solo esta vez.

Con una clave de API, cada tipo de `events` exige además el permiso
**Números de WhatsApp → Ver**, **Contactos y conversaciones → Ver** o
**Grupos y campañas → Ver**, según su área; si falta, 422.

Hay un tope de 50 suscripciones por workspace (por cuenta, si no usas workspaces), sea
cual sea su estado: con 50, crear otra responde `422` con `error`
`webhooks_limit_reached`.

No acepta `Idempotency-Key`: reintentar una creación que sí llegó crea otra suscripción,
con otro secreto.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `url` | string (uri) | sí |  |
| `description` | string \| null | no |  |
| `events` | array<string ∈ {"device.disconnected", "device.connected", "device.deleted", "device.health_changed", "device.quality_changed", "device.messaging_limit_changed", "device.display_name_reviewed", "billing.payment_failed", "billing.upcoming_charge", "subscription.trial_ending", "subscription.reactivated", "subscription.cancellation_confirmed", "subscription.dormant_ending", "mac.usage_80", "mac.usage_100", "mac.expiring", "account.blocked", "message.received", "flow.completed", "broadcast.finished", "contact.stage_changed", "message.status_changed", "conversation.closed", "conversation.assigned", "contact.tag_added", "broadcast.paused", "contact.tag_removed", "contact.created", "template.status_changed", "flow.failed", "whatsapp_form.completed", "contact.updated", "message.reaction_failed", "group.created", "group.invite_link_down", "group.invite_link_renewed", "group_participant.joined", "group_participant.left", "scheduled_message.group_delivery_failed", "scheduled_message.response_received", "poll.voted", "pipeline.finished", "group.blocked", "group.recovered", "campaign.status_changed", "scheduled_message.finished", "group_action.failed", "daily_report.generated", "campaign.no_groups_available", "group.full", "group_action.completed", "group.message_received", "group.reaction_added", "group_join_request.created", "group_join_request.revoked"}> | sí |  |
| `filters` | object | no |  |
| `filters.campaign_ids` | array<string> \| null | no |  |

**Respuestas**

- `201` — La suscripción creada, con su secreto de firma (`secret`). Es la única vez que aparece.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string |  |
  | `url` | string |  |
  | `description` | string \| null |  |
  | `events` | array<string> |  |
  | `filters` | object \| null | Siempre un objeto: `{}` si no hay filtro. |
  | `status` | string |  |
  | `disabled_reason` | string \| null |  |
  | `last_delivery_at` | string \| null |  |
  | `last_success_at` | string \| null |  |
  | `secret_rotated_at` | string \| null |  |
  | `created_at` | string \| null |  |
  | `updated_at` | string \| null |  |
  | `migration` | object \| null |  |
  | `migration.origin` | string |  |
  | `migration.status` | string |  |
  | `migration.activated_via` | string \| null |  |
  | `migration.activated_at` | string \| null |  |
  | `migration.last_result` | string \| null |  |
  | `secret` | string |  |
  | `secret_notice` | "Guarda este secreto ahora: es la única vez que se muestra. Con él validas la firma del header de cada entrega." |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_foreign_account`: solo la usa una clave de un workspace de la propia cuenta.
- `422` — Validation error (`AccountsValidationException`)
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Ver tus webhooks

`GET /api/v1/webhooks` · permiso **Avisos (webhooks) → Ver** · área accounts · `operationId` `webhookSubscription.index`

**Para qué sirve:** Úsalo para revisar a qué URLs le está mandando eventos tu cuenta y en qué estado está cada suscripción.

**Listado** · `perPage` de 1 a 100 (por defecto 25) · orden fijo: id ascendente · no acepta parámetros de orden.

Con una clave de API, solo las que la clave puede leer: se omiten las que
tienen eventos de un área cuyo permiso le falta: **Números de WhatsApp → Ver**,
**Contactos y conversaciones → Ver** o **Grupos y campañas → Ver**.

**Respuestas**

- `200` — Las suscripciones del workspace.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `[].id` | string |  |
  | `[].url` | string |  |
  | `[].description` | string \| null |  |
  | `[].events` | array<string> |  |
  | `[].filters` | object \| null | Siempre un objeto: `{}` si no hay filtro. |
  | `[].status` | string |  |
  | `[].disabled_reason` | string \| null |  |
  | `[].last_delivery_at` | string \| null |  |
  | `[].last_success_at` | string \| null |  |
  | `[].secret_rotated_at` | string \| null |  |
  | `[].created_at` | string \| null |  |
  | `[].updated_at` | string \| null |  |
  | `[].migration` | object \| null |  |
  | `[].migration.origin` | string |  |
  | `[].migration.status` | string |  |
  | `[].migration.activated_via` | string \| null |  |
  | `[].migration.activated_at` | string \| null |  |
  | `[].migration.last_result` | string \| null |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_foreign_account`: solo la usa una clave de un workspace de la propia cuenta.
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Borrar un webhook

`DELETE /api/v1/webhooks/{id}` · permiso **Avisos (webhooks) → Administrar** · área accounts · `operationId` `webhookSubscription.destroy`

**Para qué sirve:** Úsalo para dejar de recibir los eventos de una suscripción; también se borra su historial de entregas.

Con una clave de API, la clave necesita además el permiso de lectura del
área de cada tipo de evento de la suscripción; si falta alguno, 403
`permission_denied` y no se borra.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |

**Respuestas**

- `204` — No content
- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — La clave de API no tiene el permiso de lectura de un área de los eventos de la suscripción.
- `404`
- `409`
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Probar un webhook

`POST /api/v1/webhooks/{id}/test` · permiso **Avisos (webhooks) → Administrar** · área accounts · `operationId` `webhookSubscriptionTest.test`

**Para qué sirve:** Sirve para probar tu receptor y tu verificación de firma con una entrega firmada, sin esperar a que pase algo en tu cuenta.

Envía una entrega de prueba firmada a la URL de la suscripción y devuelve el resultado

Solo a suscripciones `active` o `paused`; una `disabled` responde 422 sin enviar nada.

Con una clave de API, la clave necesita además el permiso de lectura del área
de cada tipo de evento de la suscripción; si falta alguno, 403
`permission_denied`, antes que el 422 de una `disabled`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `id` | path | string | sí |  |

**Respuestas**

- `200`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `succeeded` | boolean |  |
  | `response_status` | integer \| null |  |
  | `error` | string \| null ∈ {"non_2xx", "internal_error", "timeout", "connection_failed", "tls_error", "destination_not_allowed", "secret_unreadable", null} |  |
  | `duration_ms` | integer \| null |  |
  | `delivery_id` | string | Id opaco: un texto que empieza con `dlv_`. Se usa tal como llega; no se arma ni se interpreta. |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — La clave de API no tiene el permiso de lectura de un área de los eventos de la suscripción.
- `404`
- `422` — La suscripción está deshabilitada: no se envía nada.
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Ver tus grupos

`GET /api/v1/devices/{device}/groups` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `group.groups`

**Para qué sirve:** Sirve para ver los grupos de un número tal como están en WhatsApp, también los que todavía no importaste a tu cuenta: de acá sale el `uid` para escribirle a un grupo o seguirlo.

**Nota:** La lista se lee de WhatsApp y, para una API key, se reutiliza durante un minuto por número: un grupo recién creado en WhatsApp puede tardar hasta un minuto en aparecer. Si un grupo ya está en el workspace de la llamada, trae `device_id`. Para importar uno: `POST /groups/{group}/import`.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `pageSize` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`).

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí |  |
| `page` | query | integer | no |  |
| `pageSize` | query | integer | no |  |
| `name` | query | string \| null | no |  |

**Respuestas**

- `200` — Array of `GroupMinResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<GroupMinResource> |  |
  | `data[].uid` | string \| string ∈ {""} |  |
  | `data[].name` | string \| string ∈ {""} |  |
  | `data[].description` | string \| string ∈ {""} |  |
  | `data[].device_id` | string | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].alias` | string \| string ∈ {""} |  |
  | `data[].number` | string \| string ∈ {""} |  |
  | `data[].communityUid` | string \| string ∈ {""} |  |
  | `meta` | object |  |
  | `meta.current_page` |  |  |
  | `meta.last_page` |  |  |
  | `meta.per_page` |  |  |
  | `meta.total` | integer |  |

- `400`
- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404`
- `422` — Validation error (`CommunitiesValidationException`)

### Mandar un mensaje a un grupo

`POST /api/v1/groups/{group}/messages` · permiso **Grupos y campañas → Enviar** · área communities · `operationId` `apiGroupAction.sendMessage`

**Para qué sirve:** Úsalo para mandarle a un grupo un texto, o una imagen, un video, un audio o un documento, desde uno de tus números. El pedido se acepta enseguida, queda en cola y el mensaje sale después, al ritmo del número.

**Nota:** Asíncrona: responde 202 con `action_id`; consulta el resultado en `GET /groups/actions/{action}` (`result.message.uid` es el id del mensaje en WhatsApp). `type`: `text`, `image`, `video`, `audio` o `document`. Con un número QR sale al ritmo de los mensajes programados de velocidad Low, que el integrador no puede cambiar. Con un número oficial se verifican, antes de aceptar, la ventana de servicio de 24 horas y la calidad del número. No tiene tope de volumen del plan. Si el grupo todavía no está en la cuenta y el número es QR, primero se importa como en `POST /groups/{group}/import` (pide además **Grupos y campañas → Administrar grupos**, `403 import_permission_required` sin él) y el envío sigue con las mismas reglas: si el número no es administrador del grupo no se importa nada y responde `422 device_not_group_admin`. Esa importación cuenta en el tope de 5 por minuto del número.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `type` | string ∈ {"text", "image", "video", "audio", "document"} | sí |  |
| `text` | string | no |  |
| `media_url` | string | no |  |
| `caption` | string | no |  |
| `file_name` | string | no |  |

**Respuestas**

- `202` — `ApiGroupActionAcceptedResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `action_id` | string |  |
  | `status` | "queued" |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Seguir un grupo

`POST /api/v1/groups/{group}/import` · permiso **Grupos y campañas → Administrar grupos** · área communities · `operationId` `v2.apiGroupImport`

**Para qué sirve:** Úsalo para seguir un grupo de tu número sin escribirle: lo importa a tu cuenta y desde entonces te enteras de quién entra y quién sale. Si ya estaba en tu cuenta, no lo importa de nuevo.

**Nota:** Importa al workspace de la API key un grupo del número indicado en `device_id`, igual que importarlo desde el panel: queda visible en el panel, se sincronizan sus participantes y desde entonces genera los eventos `group_participant.joined` y `group_participant.left`. Los datos del grupo y si el número es administrador se leen de WhatsApp en la misma llamada. Responde `201` si lo importó y `200` si ya estaba en el workspace, con `is_admin`. Solo números QR: con un número oficial responde `422 provider_unsupported`. Si el grupo no es del número responde `404 group_not_found`. Cada número importa hasta 5 grupos por minuto (`429 import_rate_limited`, con `retry_after` en segundos). Dos pedidos a la vez por el mismo grupo en el mismo workspace lo importan una sola vez. Si el grupo ya está en otro workspace de la cuenta: cuando cada workspace de la cuenta tiene sus propios grupos, se importa la copia de este workspace sin tocar la del otro; si no, el grupo es uno solo para toda la cuenta y responde `404 group_not_found`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí | Identificador del grupo en WhatsApp, como lo lista `GET /v1/devices/{device}/groups`. |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |

**Respuestas**

- `200` — El grupo ya estaba en el workspace: no se importó de nuevo.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | ApiGroupImportResource |  |
  | `data.uid` | string | Identificador del grupo en WhatsApp. |
  | `data.name` | string \| null | Nombre del grupo. |
  | `data.imported` | boolean | `true` si esta llamada lo importó; `false` si ya estaba en el workspace. |
  | `data.is_admin` | boolean | Si el número indicado es administrador del grupo, según WhatsApp. Sin serlo no puede enviarle mensajes ni hacer acciones de grupo. |

- `201` — El grupo se importó en esta llamada.

  La misma tabla que en «Seguir un grupo», más arriba en este texto.

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

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

## Cómo funcionan los webhooks

- Un webhook es una dirección pública de tu servidor (con `https`) a la que Funnelchat le manda los eventos que elegiste.
  Se crea con `POST /api/v1/webhooks`: `url` y `events` (de 1 a 50 nombres de evento, sin comodín: nombra cada uno).
  La clave necesita **Avisos (webhooks) → Administrar** (así se llama la casilla en el panel) y, por cada evento, el
  permiso de lectura de su área: **Números de WhatsApp → Ver** para `device.connected` y `device.disconnected`;
  **Contactos y conversaciones → Ver** para los de mensajes, contactos, conversaciones, formularios y automatizaciones
  (`message.received`, `message.status_changed`, `message.reaction_failed`, `contact.created`, `contact.updated`,
  `contact.tag_added`, `contact.tag_removed`, `conversation.assigned`, `conversation.closed`,
  `whatsapp_form.completed`, `flow.completed` y `flow.failed`), y **Grupos y campañas → Ver** para `group_participant.joined` y `group_participant.left`. Si falta
  alguno, `422`.
- La respuesta del alta (`201`) trae el `id` del webhook y su `secret` (empieza con `whsec_`). El secreto aparece solo
  ahí: guárdalo en el servidor que recibe los eventos, por ejemplo en una variable de entorno.
- **El alta no acepta `Idempotency-Key`:** si la llamada no respondió y la repites, puede quedar otro webhook, con otro
  secreto. Antes de repetirla, mira `GET /api/v1/webhooks`. Hay un tope de 50 webhooks por workspace (por cuenta, si no
  usa workspaces), sea cual sea su estado: con 50, el alta responde `422 webhooks_limit_reached`; borra los que ya no
  se usan, con confirmación de la persona.
- **Un webhook con todos los eventos que necesitas.** Al crearlo, nombra todos. Para sumar o quitar eventos más adelante,
  usa «Editar un webhook» (`PUT /api/v1/webhooks/{id}`) con la lista completa: el secreto no cambia.
  `GET /api/v1/webhooks` lista los webhooks del workspace de la clave, también los de otras integraciones: guarda el `id` del tuyo.
- Cada entrega es un `POST` a tu `url` con el cuerpo JSON `{id, type, version, occurred_at, data}` y las cabeceras
  `X-Funnelchat-Signature` (la firma), `X-Funnelchat-Event` (el tipo de evento) y `X-Funnelchat-Delivery` (cambia en
  cada intento).
- Todos los eventos traen `data.workspace_id`: el id del workspace del número (un entero). Un webhook recibe solo los
  eventos de su workspace: las suscripciones son del workspace de la clave.
- Los eventos de contactos activos (`mac.*`), de bloqueo (`account.blocked`), de cobros (`billing.*`) y de la suscripción
  (`subscription.*`) llegan al workspace al que corresponden: el que tiene facturación propia o, si el pool es el de la
  cuenta, el workspace por defecto (cada descripción lo dice).
- Verifica la firma sobre el cuerpo crudo, antes de parsear el JSON (ver «Verificar la firma»). Rechaza la entrega si no
  coincide o si `t` está a más de 300 segundos de la hora actual.
- Responde `2xx` enseguida y procesa después. Ante un error de red, un `5xx` o un `429` se reintenta: hasta 4 intentos
  en total, esperando 60 segundos, 5 minutos y 30 minutos entre ellos. Otra respuesta (`3xx`, o un `4xx` que no sea
  `429`) no se reintenta. Después de 5 entregas fallidas seguidas el webhook se deshabilita (`status: disabled`):
  arregla el servidor, reactívalo con «Editar un webhook» (`PUT /api/v1/webhooks/{id}`, todo igual y
  `status: active`; el secreto no cambia) y pruébalo con `POST /api/v1/webhooks/{id}/test`. Lo que estaba por llegarle
  mientras estuvo deshabilitado no se manda después.
- El `id` del sobre es el mismo en todos los reintentos: úsalo para descartar los repetidos.
- Para probar sin esperar un evento real: `POST /api/v1/webhooks/{id}/test` manda una sola entrega `webhook.test`,
  firmada igual que una real, y responde si tu servidor contestó `2xx`. A `webhook.test` no se suscribe nadie: solo
  llega al probar.

## Los eventos

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

### `message.status_changed`

Cambió el estado de entrega de un mensaje enviado.

Se emite cuando cambia el estado de entrega de un mensaje que enviaste a un contacto, ya sea desde el chat, una automatización o un asistente de IA (incluye los enviados con clave). No se emite para mensajes de difusiones ni para mensajes recibidos. `message_id` es el id que devuelve la API, `contact_id` el del contacto y `device_id` el número de tu cuenta por el que salió el mensaje, el mismo `device_id` que usas para enviar (`null` si no tiene). `status` es `sent`, `delivered`, `read` o `failed`. `previous_status` es el estado que el mensaje tenía justo antes de este cambio y es `null` en tres casos: es el primer evento del mensaje, es el mismo estado que `status` (por ejemplo, el proveedor confirma el `sent` que ya registró el envío) o no se pudo leer. `error` solo viene cuando `status` es `failed`: `code` es el código numérico del proveedor y `title` su título, y cualquiera de los dos puede ser `null` si el proveedor no los informa. `error.reason` es `null` cuando el fallo lo informó el proveedor; cuando Funnelchat decidió que un mensaje enviado con clave no salía (por ejemplo, por saldo insuficiente o ventana de 24 horas cerrada) trae el motivo (`device_unavailable`, `insufficient_balance`, `window_closed`, `recipient_unreachable`, `template_not_found`, `template_unresolved_placeholder`, `not_queued` o `not_sent`), `code` es `null` y `title` es un texto llano en el idioma de la cuenta. `occurred_at` es el momento en que Funnelchat registró el estado, en UTC. `client_reference` es la referencia que mandaste al enviar el mensaje (por ejemplo `pedido-1001`) y `null` si el envío no la llevaba: sirve para relacionar cada evento con tu envío también cuando la llamada de envío no respondió. Cada estado se informa una sola vez por mensaje: si llegan varios eventos juntos se informa el más avanzado y un evento atrasado que no cambia el estado no genera evento. Un mensaje que no llegó a salir (por ejemplo, por ventana de 24 horas cerrada) no recibe eventos de estado, salvo uno enviado con clave: ese recibe un único evento `failed` con `previous_status` en `null`, su `error.reason` y su `client_reference`. Un mensaje enviado con clave cuyo resultado no se conoce (el proveedor no respondió o el envío se interrumpió) no recibe evento. Un mensaje cuyo envío no empezó dentro de la hora ya no sale: pasada la hora sin resultado, su estado es `null`, o `failed` con `error.reason` `not_sent` y su evento si su envío llega tarde. Reintentar es un envío nuevo, que sólo puede duplicar si el envío había empezado y se cortó. Un mensaje `queued` no es enviado: su resultado llega por este evento o por la consulta del mensaje. En cuentas con mucho tráfico, los eventos que excedan el límite de entrega por minuto de la cuenta se descartan.

Ejemplo:

```json
{
  "id": "evt_000000000000000000000014",
  "type": "message.status_changed",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "message_id": "msg_ADyPfpgQyD89BoEabkSQkV1",
    "contact_id": "ctc_ABViuUDF93I2VL1tInstRDG",
    "device_id": "dev_AFHtaOVjNBTEWzCuDrmxMPP",
    "status": "failed",
    "previous_status": "sent",
    "error": {
      "code": 131047,
      "title": "Re-engagement message",
      "reason": null
    },
    "occurred_at": "2026-10-01T12:00:00Z",
    "client_reference": "pedido-1001",
    "workspace_id": 37
  }
}
```

### `webhook.test`

Evento de prueba enviado desde la ruta de prueba de una suscripción.

Ejemplo:

```json
{
  "id": "evt_000000000000000000000002",
  "type": "webhook.test",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "subscription": "00000000-0000-4000-8000-000000000001",
    "sent_at": "2026-10-01T12:00:00Z"
  }
}
```

### `message.received`

Un contacto le escribió a un número de WhatsApp de la cuenta.

`device_id` es el número de tu cuenta que recibió el mensaje: el mismo `device_id` que mandas para responder por ese número. Es `null` si el mensaje no tiene número asociado.

Ejemplo:

```json
{
  "id": "evt_000000000000000000000001",
  "type": "message.received",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "message": {
      "id": "msg_ADyPfpgQyD89BoEabkSQkV1",
      "type": "text",
      "text": "Hola, quiero más información",
      "media": null
    },
    "contact": {
      "id": "ctc_ABViuUDF93I2VL1tInstRDG",
      "name": "Contacto de ejemplo",
      "phone": "+5491100000000"
    },
    "receiver": {
      "phone": "+5491100000001"
    },
    "device_id": "dev_AFHtaOVjNBTEWzCuDrmxMPP",
    "workspace_id": 37
  }
}
```

### `group_participant.joined`

Una persona entró a un grupo del workspace; `campaign` es null si el grupo no es de una campaña, y sale como mucho uno por persona, grupo y día UTC en cada workspace (si la misma persona vuelve a entrar ese día, no sale otro).

Ejemplo:

```json
{
  "id": "evt_00000000000000000000000000000002",
  "type": "group_participant.joined",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "group": {
      "uid": "120363000000000001@g.us",
      "name": "Grupo de ejemplo"
    },
    "campaign": {
      "uuid": "xK9mQz"
    },
    "participant": {
      "identity": "5491100000000",
      "identity_type": "phone",
      "name": "Ana Pérez"
    },
    "workspace_id": 37
  }
}
```

### `group_participant.left`

Una persona salió de un grupo del workspace; `campaign` es null si el grupo no es de una campaña, y sale como mucho uno por persona, grupo y día UTC en cada workspace (si la misma persona vuelve a salir ese día, no sale otro).

Ejemplo:

```json
{
  "id": "evt_00000000000000000000000000000003",
  "type": "group_participant.left",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "group": {
      "uid": "120363000000000001@g.us",
      "name": "Grupo de ejemplo"
    },
    "campaign": {
      "uuid": "xK9mQz"
    },
    "participant": {
      "identity": "5491100000000",
      "identity_type": "phone",
      "name": "Ana Pérez"
    },
    "workspace_id": 37
  }
}
```

### `group_action.completed`

Terminó una acción sobre un grupo. `action.uuid` es el mismo `action_id` que devolvió la API al pedirla, y `action.type` dice qué acción fue. `result` depende del tipo de acción: en las que reciben una lista de teléfonos (agregar o quitar participantes, nombrar o quitar administradores) trae `participants`, con el resultado por persona: `identity`, `identity_type`, `status` (`added`, `removed`, `promoted` o `demoted` según la acción, o `failed`) y `reason`, que es `null` salvo cuando `status` es `failed`; al crear un grupo o renovar su link de invitación trae `invite_link`; al enviar un mensaje trae `message.uid`; en las demás (cambiar el nombre, la descripción, la foto o los ajustes) viene como objeto vacío (`{}`). `group` y `campaign` pueden venir `null`.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "group_action.completed",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "action": {
      "uuid": "00000000-0000-4000-8000-000000000001",
      "type": "add_participants"
    },
    "group": {
      "uid": "120363000000000000@g.us",
      "name": "Grupo de ejemplo"
    },
    "campaign": {
      "uuid": "xK9mQz",
      "name": "Campaña de ejemplo"
    },
    "result": {
      "participants": [
        {
          "identity": "5491100000000",
          "identity_type": "phone",
          "status": "added",
          "reason": null
        }
      ]
    },
    "workspace_id": 37
  }
}
```

### `group_action.failed`

Una acción sobre un grupo falló entera (si terminó con resultados por persona, llega `group_action.completed`). Si la pidió la API, `action.uuid` es el mismo `action_id` que devolvió al pedirla y `pipeline` viene `null`. Si la ejecutó una campaña o un pipeline, `action.uuid` viene `null`, y `pipeline` trae ese pipeline (`uuid` y `name`) o viene `null` fuera de un pipeline. `reason` es el motivo de la falla. `group` y `campaign` pueden venir `null`.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "group_action.failed",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "campaign": {
      "uuid": "xK9mQz",
      "name": "Campaña de ejemplo"
    },
    "pipeline": null,
    "group": {
      "uid": "120363000000000000@g.us",
      "name": "Grupo de ejemplo"
    },
    "action": {
      "uuid": "00000000-0000-4000-8000-000000000001",
      "type": "add_participants"
    },
    "reason": "motivo_de_ejemplo",
    "workspace_id": 37
  }
}
```

## Verificar la firma

La cabecera `X-Funnelchat-Signature` trae `t=<unix>,v1=<hex>`. `v1` es el HMAC-SHA256, en hexadecimal, de `"<t>.<cuerpo crudo>"` con el secreto completo de la suscripción (con su prefijo `whsec_`). Calcúlalo sobre el cuerpo tal como llegó, antes de parsear el JSON, compáralo en tiempo constante y rechaza si `t` está a más de 300 segundos de la hora actual. Estas funciones están probadas contra la fórmula:

**Node.js:**

```js
// Verifica la cabecera X-Funnelchat-Signature de una entrega de webhook (Node.js 16+).
// cuerpoCrudo: el cuerpo tal como llegó (Buffer o string), sin parsear ni volver a serializar.
// secreto: el secreto completo de la suscripción, tal como se mostró al crearla o rotarla.
const crypto = require('node:crypto');

function verificarFirma(cuerpoCrudo, cabecera, secreto, toleranciaSegundos = 300) {
  if (typeof cabecera !== 'string' || typeof secreto !== 'string' || secreto === '') return false;

  let t = null;
  const firmas = [];
  for (const parte of cabecera.split(',')) {
    const i = parte.indexOf('=');
    if (i === -1) continue;
    const clave = parte.slice(0, i).trim();
    const valor = parte.slice(i + 1).trim();
    if (clave === 't') t = valor;
    if (clave === 'v1') firmas.push(valor);
  }
  if (t === null || !/^\d+$/.test(t) || firmas.length === 0) return false;

  // Rechaza entregas viejas o del futuro (protección contra repeticiones).
  if (Math.abs(Math.floor(Date.now() / 1000) - Number(t)) > toleranciaSegundos) return false;

  const esperada = crypto
    .createHmac('sha256', secreto)
    .update(`${t}.`)
    .update(cuerpoCrudo)
    .digest('hex');
  const a = Buffer.from(esperada, 'utf8');

  return firmas.some((v1) => {
    const b = Buffer.from(v1, 'utf8');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
}

module.exports = { verificarFirma };

// Uso con Express: lee el cuerpo crudo, verifica, y recién después parsea.
// app.post('/hooks/funnelchat', express.raw({ type: 'application/json' }), (req, res) => {
//   if (!verificarFirma(req.body, req.get('X-Funnelchat-Signature'), process.env.FUNNELCHAT_WEBHOOK_SECRET)) {
//     return res.sendStatus(400);
//   }
//   const evento = JSON.parse(req.body.toString('utf8')); // toma type e id de acá, no de las cabeceras
//   res.sendStatus(200); // responde rápido; procesa después
// });
```

**Python:**

```python
# Verifica la cabecera X-Funnelchat-Signature de una entrega de webhook (Python 3.8+).
# cuerpo_crudo: los bytes del cuerpo tal como llegaron, sin parsear ni volver a serializar.
# secreto: el secreto completo de la suscripción, tal como se mostró al crearla o rotarla.
import hashlib
import hmac
import time

def verificar_firma(cuerpo_crudo: bytes, cabecera: str, secreto: str, tolerancia_segundos: int = 300) -> bool:
    if not isinstance(cabecera, str) or not isinstance(secreto, str) or not secreto:
        return False

    t = None
    firmas = []
    for parte in cabecera.split(","):
        clave, separador, valor = parte.partition("=")
        if not separador:
            continue
        clave, valor = clave.strip(), valor.strip()
        if clave == "t":
            t = valor
        elif clave == "v1":
            firmas.append(valor)
    if t is None or not t.isdigit() or not firmas:
        return False

    # Rechaza entregas viejas o del futuro (protección contra repeticiones).
    if abs(int(time.time()) - int(t)) > tolerancia_segundos:
        return False

    esperada = hmac.new(secreto.encode("utf-8"), t.encode("ascii") + b"." + cuerpo_crudo, hashlib.sha256).hexdigest()
    return any(hmac.compare_digest(esperada, v1) for v1 in firmas)

# Uso con Flask: lee el cuerpo crudo, verifica, y recién después parsea.
# @app.post("/hooks/funnelchat")
# def recibir():
#     cuerpo = request.get_data()  # bytes crudos
#     if not verificar_firma(cuerpo, request.headers.get("X-Funnelchat-Signature", ""), os.environ["FUNNELCHAT_WEBHOOK_SECRET"]):
#         return "", 400
#     evento = json.loads(cuerpo)  # toma type e id de acá, no de las cabeceras
#     return "", 200  # responde rápido; procesa después
```

**PHP:**

```php
<?php
// Verifica la cabecera X-Funnelchat-Signature de una entrega de webhook (PHP 8.0+).
// $cuerpoCrudo: el cuerpo tal como llegó (file_get_contents('php://input')), sin volver a codificar.
// $secreto: el secreto completo de la suscripción, tal como se mostró al crearla o rotarla.

function verificarFirma(string $cuerpoCrudo, string $cabecera, string $secreto, int $toleranciaSegundos = 300): bool
{
    if ($secreto === '') {
        return false;
    }

    $t = null;
    $firmas = [];
    foreach (explode(',', $cabecera) as $parte) {
        $i = strpos($parte, '=');
        if ($i === false) {
            continue;
        }
        $clave = trim(substr($parte, 0, $i));
        $valor = trim(substr($parte, $i + 1));
        if ($clave === 't') {
            $t = $valor;
        } elseif ($clave === 'v1') {
            $firmas[] = $valor;
        }
    }
    if ($t === null || ! ctype_digit($t) || $firmas === []) {
        return false;
    }

    // Rechaza entregas viejas o del futuro (protección contra repeticiones).
    if (abs(time() - (int) $t) > $toleranciaSegundos) {
        return false;
    }

    $esperada = hash_hmac('sha256', $t.'.'.$cuerpoCrudo, $secreto);
    foreach ($firmas as $v1) {
        if (hash_equals($esperada, $v1)) {
            return true;
        }
    }

    return false;
}

// Uso:
// $cuerpo = file_get_contents('php://input');
// if (! verificarFirma($cuerpo, $_SERVER['HTTP_X_FUNNELCHAT_SIGNATURE'] ?? '', (string) getenv('FUNNELCHAT_WEBHOOK_SECRET'))) {
//     http_response_code(400);
//     exit;
// }
// $evento = json_decode($cuerpo, true); // toma type e id de acá, no de las cabeceras
// http_response_code(200); // responde rápido; procesa después
```

## Secciones citadas

Las secciones de la descripción general de cada área que citan las llamadas y los eventos de este texto, tal como las escribe el área.

### Errores y límites

Lo que vale para todas las operaciones que llamas con una clave de API, además de las respuestas que documenta cada una.
- **Pago vencido (`402`):** si está vencido el pago de tu cuenta (o, si tu cuenta usa workspaces separados, el del workspace de tu clave: cada workspace tiene su propio pago), las operaciones que documentan un `402` responden `402` con `{ "error": "payment_required", "message": "<explicación>" }` y no se ejecutan. Regulariza el pago en el panel de Funnelchat y vuelve a llamar. Los envíos de mensajes también responden `402` cuando está vencido el pago del workspace dueño del número por el que envías, aunque tu cuenta esté al día: en `POST /contacts/{contact}/message`, `POST /message/send-message` y `POST /contacts/{contact}/message/contact-card` ese envío queda en el historial del contacto como un mensaje con estado de error; `POST /contacts/{contact}/message/form` no guarda nada. Las operaciones que no documentan un `402` no dependen del pago.
- **Workspace de la clave (`403`):** cada clave opera en un workspace de tu cuenta. Si el workspace de la clave ya no es de tu cuenta, o la clave no tiene workspace y tu cuenta tiene varios sin uno por defecto, toda llamada responde `403` con `error` = `forbidden` y no hace nada: crea una clave nueva en el panel de Funnelchat. Si tu cuenta usa workspaces separados y el workspace de la clave está archivado, toda llamada responde `403` con `error` = `WORKSPACE_ARCHIVED` mientras siga archivado.
- **Límites por minuto (`429`):** algunas operaciones aceptan un máximo de llamadas por minuto. Al superarlo responden `429` con `error` = `rate_limited` y el encabezado `Retry-After`, con los segundos que debes esperar antes de volver a llamar. Cada límite se cuenta de una de estas formas: **por usuario**, lo comparten todas las claves de ese usuario y su sesión en el panel de Funnelchat, así que lo que ese usuario hace en el panel descuenta de lo que puede hacer tu integración, y al revés; **por workspace**, lo comparten todas las claves y todos los usuarios del workspace; **por clave**, cada clave cuenta aparte y el panel no lo usa. Si tu cuenta usa workspaces separados, los límites por usuario y por workspace se cuentan en cada workspace por separado: lo que se usa en uno no descuenta de otro, y un usuario tiene su propio límite en cada workspace en el que trabaja. Si no, un límite por workspace es de toda tu cuenta: lo comparten todos tus workspaces.
  - **Escrituras: 30 por minuto, por usuario.** `POST /broadcasts/folders`, `DELETE /broadcasts/folders/{broadcastFolder}`, `PUT /broadcasts/folders/{broadcastFolder}`, `POST /broadcasts/move-to-folder`, `DELETE /broadcasts/{broadcast}`, `POST /contacts`, `POST /contacts/add-tags`, `POST /contacts/attach-custom-field`, `POST /contacts/detach-custom-field`, `POST /contacts/remove-tags`, `POST /contacts/update-or-create`, `PUT /contacts/{contact}`, `POST /contacts/{contact}/notes`, `DELETE /contacts/{contact}/notes/{note}`, `POST /contacts/{contact}/pause`, `POST /custom-fields`, `PUT /custom-fields/{customField}`, `DELETE /devices/{device}/templates/{template}`, `POST /folders`, `PUT /folders/{folder}`, `POST /kanban-settings/{kanbanSetting}/move-contact`, `POST /kanban-settings/{kanbanSetting}/remove-contact`, `POST /kanban-settings/{kanbanSetting}/stages`, `POST /kanban-settings/{kanbanSetting}/stages/reorder`, `DELETE /kanban-settings/{kanbanSetting}/stages/{stage}`, `PUT /kanban-settings/{kanbanSetting}/stages/{stage}`, `POST /quick-replies`, `DELETE /quick-replies/{quickReply}`, `PUT /quick-replies/{quickReply}`, `POST /tags`, `POST /tags/delete`, `POST /templates`, `PUT /templates/{template}`, `POST /tickets`, `POST /tickets/assign`, `PUT /tickets/{id}`, `POST /tickets/{id}/close`, `POST /tickets/{id}/reopen`.
  - **Escrituras sensibles: 10 por minuto, por usuario.** `POST /broadcasts/{broadcast}/cancel`, `POST /contacts/delete`, `POST /contacts/{contact}/lead-score/adjustments`, `POST /custom-fields/delete`, `POST /devices/{device}/templates`, `DELETE /folders/{folder}`, `POST /kanban-settings/{kanbanSetting}/bulk-move`, `POST /kanban-settings/{kanbanSetting}/bulk-remove`, `PUT /lead-score/settings`.
  - **Lecturas: 120 por minuto, por usuario.** `POST /broadcasts/contacts`, `POST /broadcasts/contacts-count`, `GET /broadcasts/cost-tiers`, `GET /contacts/{contact}/lead-score`, `GET /contacts/{contact}/messages/{message}`, `GET /custom-fields`, `GET /flows`, `GET /lead-score/distribution`, `GET /lead-score/settings`, `GET /payments/products/{platform}`, `GET /sales`, `GET /sales/by-platform`, `GET /sales/funnel`, `GET /sales/metrics`, `GET /tags`, `GET /templates/{template}/metrics`.
  - **Costo de una difusión: 20 por minuto, por usuario.** `GET /broadcasts/{broadcast}/cost`.
  - **Marcar todas las conversaciones: 5 por minuto, por workspace.** `POST /conversations/mark-all-read`, `POST /conversations/mark-all-unread`.
  - **Webhooks, lecturas: 60 por minuto, por workspace.** `GET /webhooks`, `GET /webhooks/events`, `GET /webhooks/{webhook}`, `GET /webhooks/{webhook}/deliveries`.
  - **Webhooks, pruebas: 6 por minuto, por workspace.** `POST /webhooks/{webhook}/test`. Además hay un límite común a todas las cuentas: una prueba puede responder `429` aunque no hayas usado tu cupo.
  - **Formularios de WhatsApp, lecturas: 120 por minuto, por clave.** `GET /forms`, `GET /forms/families/{familyId}/definition`, `GET /forms/families/{familyId}/metrics`, `GET /forms/families/{familyId}/responses`, `GET /forms/families/{familyId}/responses/{runId}`, `GET /forms/families/{familyId}/versions`, `GET /forms/templates`, `GET /forms/{id}`, `GET /forms/{id}/numbers`.
  - **Formularios de WhatsApp, cambios: 60 por minuto, por clave.** `POST /forms`, `DELETE /forms/{id}`, `PUT /forms/{id}`, `POST /forms/{id}/numbers`, `POST /forms/{id}/numbers/retry`, `DELETE /forms/{id}/numbers/{deviceId}`, `POST /forms/{id}/publish`, `POST /forms/{id}/sync`, `POST /forms/{id}/versions`.
  - **Formularios de WhatsApp, operaciones con Meta: 30 por minuto, por workspace.** `POST /forms/{id}/numbers`, `POST /forms/{id}/numbers/retry`, `DELETE /forms/{id}/numbers/{deviceId}`, `POST /forms/{id}/publish`, `POST /forms/{id}/sync`.
  - **Envíos con clave: sin límite por minuto.** `POST /contacts/{contact}/message`, `POST /contacts/{contact}/message/contact-card`, `POST /contacts/{contact}/message/form`, `POST /contacts/{contact}/messages/{message}/forward`, `DELETE /contacts/{contact}/messages/{message}/reaction`, `PUT /contacts/{contact}/messages/{message}/reaction`, `POST /devices/{device}/templates/{template_id}/send-template`, `POST /message/send-message`. Los limita el ritmo por número, explicado en «Envío de mensajes con clave». Una nota interna (`note` en `true`) en `POST /contacts/{contact}/message` o `POST /message/send-message` no es un envío: cuenta en las escrituras sensibles (10 por minuto, por usuario).
  - **Sin límite por minuto:** `GET /agents`, `GET /agents/{user}`, `GET /broadcasts`, `GET /broadcasts/folders`, `GET /broadcasts/{broadcast}`, `GET /broadcasts/{broadcast}/contacts`, `GET /broadcasts/{broadcast}/messages`, `GET /broadcasts/{broadcast}/statistics`, `PUT /contact-flows/{contactFlowId}/cancel`, `GET /contact-flows/{contactId}`, `GET /contacts`, `GET /contacts/{contact_id}/messages`, `GET /contacts/{contact}`, `GET /contacts/{contact}/custom-fields`, `GET /contacts/{contact}/flows`, `GET /contacts/{contact}/kanban-stages`, `POST /contacts/{contact}/messages/{message}/read`, `GET /contacts/{contact}/meta-window`, `GET /contacts/{contact}/notes`, `GET /contacts/{contact}/tags`, `POST /contacts/{contact}/typing`, `GET /conversations`, `GET /conversations/count/all`, `GET /conversations/count/closed`, `GET /conversations/count/open`, `GET /conversations/count/unread`, `GET /custom-fields/{customField}`, `GET /devices/{device}/contacts`, `GET /flows/{flow}`, `GET /flows/{flow}/active-contacts`, `GET /flows/{flow}/flow-contacts`, `GET /flows/{flow}/nodes`, `GET /flows/{flow}/paused-contacts`, `GET /flows/{flow}/paused-contacts-list`, `GET /folders`, `GET /folders/{folder}`, `GET /kanban-settings`, `POST /kanban-settings`, `DELETE /kanban-settings/{kanbanSetting}`, `GET /kanban-settings/{kanbanSetting}`, `PUT /kanban-settings/{kanbanSetting}`, `GET /kanban-settings/{kanbanSetting}/members`, `GET /kanban-settings/{kanbanSetting}/stages/{stage}/contacts`, `GET /mac/contacts`, `GET /mac/contacts/history`, `GET /mac/status`, `GET /quick-replies`, `GET /quick-replies/{quickReply}`, `GET /tags/{tag}`, `PUT /tags/{tag}`, `GET /tags/{tag}/contacts`, `GET /templates`, `GET /templates/{template}`, `GET /tickets`, `GET /tickets/{id}`. Si alguna tiene otro `429` propio, lo documenta la operación.
- **Tope diario:** por defecto no hay un tope diario de llamadas. Una clave puede hacer las llamadas que necesite en el día, dentro de los límites por minuto y del ritmo de envío por número.
- **Contactos activos (`429`):** el plan de tu cuenta incluye un límite de contactos activos (MAC) por ciclo; si tu cuenta usa workspaces separados, cada workspace tiene su propio plan, su propio límite y su propio bloqueo, y cuenta el del workspace del número por el que envías. `POST /contacts/{contact}/message`, `POST /message/send-message` y `POST /contacts/{contact}/message/contact-card` responden `429` cuando ese límite frena el envío, con `error` = `mac_lockout_24h` (tu cuenta, o ese workspace, está en bloqueo: alcanzó el límite, pasaron las 24 horas de gracia sin sumar capacidad y el contacto todavía no es un contacto activo del ciclo) o `mac_limit_reached` (no queda capacidad para sumar a este contacto como activo). Esta respuesta no trae `Retry-After` y reintentar no sirve: el envío vuelve a funcionar cuando sumas capacidad (por ejemplo, con una compra o un cambio de plan) o cuando empieza un ciclo nuevo. A los contactos que ya son activos en el ciclo puedes seguir escribiéndoles. El envío frenado no sale y no se guarda ningún mensaje ni tu `client_reference`: no queda nada en el historial del contacto. `POST /contacts/{contact}/message/form` responde el mismo `429` con `mac_lockout_24h` y tampoco guarda ningún mensaje. `POST /devices/{device}/templates/{template_id}/send-template` y las reacciones no responden este `429`; en un reenvío la respuesta es por destino: el destino frenado viene con `status` `blocked`, `reason` `mac_lockout_24h` o `mac_limit_reached` y `message` `null`, sin mensaje guardado.

### Enviar un archivo por URL
No subes el archivo a Funnelchat: en `file` mandas la dirección (URL) del archivo y WhatsApp o el proveedor lo descarga desde ahí. Funnelchat no abre la URL al recibir tu llamada, así que un archivo inaccesible, vencido o fuera de los límites se conoce al enviarlo: el mensaje termina `failed` con el error del proveedor.
- **La URL:** `file` admite hasta 4096 caracteres; más de eso se rechaza con un 422 en `file`. Si `file` empieza con `http`, en mayúsculas o minúsculas, tiene que ser una URL que empiece con `http://` o `https://`; si no (por ejemplo `httpfoto.jpg`), la respuesta es 422 con el error en `file`. Te recomendamos `https://`; `http://` también se acepta, pero viaja sin cifrar. Debe poder descargarse sin credenciales; puede ser una URL firmada. Tiene que seguir válida hasta que el mensaje sale: un envío con clave puede esperar en cola hasta 54 minutos, así que usa URLs que duren al menos una hora. No pongas secretos en la ruta ni en el dominio de la URL: en los registros de actividad (logs) del envío que escribe Funnelchat, de la URL quedan sólo el esquema, el dominio y la ruta (sin el usuario y la contraseña, la parte de consulta después de `?` ni el fragmento después de `#`) y del resultado sólo identificadores, el tipo del mensaje y, del error del proveedor, sus códigos y, sólo si tu número es de WhatsApp Cloud, su categoría, su título corto y su identificador de traza, nunca el texto de la respuesta del proveedor; la ruta y el dominio sí quedan. La URL completa viaja a WhatsApp o al proveedor de tu número, que la descarga y puede guardarla en sus propios registros. Además, la URL completa, con su consulta, se guarda en el historial del contacto, la ven los usuarios de tu cuenta y se copia al reenviar el mensaje: usa URLs firmadas de corta duración (al menos el tiempo de la cola, cerca de una hora) y limitadas a un solo archivo.
- **El tipo:** decide la extensión de la ruta de la URL si es una de la lista; si no, el final de la URL completa si es una de la lista. Si la ruta no termina en una extensión de la lista y sólo lo hace el final de la URL completa (por ejemplo `https://cdn.example.com/video.mov?poster=frame.jpg`), el mensaje queda registrado con ese tipo, pero WhatsApp o el proveedor pueden enviarlo según la extensión de la ruta; si necesitas un tipo fijo, envía `file_type`:
  - `.jpg`, `.jpeg`, `.png`: `image`
  - `.webp`: `sticker`
  - `.ogg`, `.oga`, `.mp3`, `.m4a`, `.aac`, `.opus`, `.wav`: `audio`
  - `.gif`, `.mp4`: `video`
  - `.doc`, `.docx`, `.pdf`: `document`
- **Cuándo envías `file_type`:** si la URL no termina en una extensión reconocida (por ejemplo una URL firmada sin extensión), la respuesta es 422 con el error en `file_type`: agrega `file_type` con uno de estos valores: `image`, `video`, `audio`, `document`, `sticker`. Cuando lo envías, manda sobre la extensión: sirve también para un archivo cuya extensión no es de los tipos de la lista, como `.xlsx`, que se envía con `file_type` = `document` y `file_name` (por ejemplo `reporte.xlsx`), porque un documento cuya URL no termina en una extensión de la lista necesita su nombre. Si la URL termina en una extensión que no es la del archivo (como `/descarga.php?id=7`) y no envías `file_type`, la respuesta es 415 con la extensión recibida (`php`); con `file_type` se envía y, si es un documento, también hace falta `file_name`.
- **Extensión no soportada:** si la ruta de la URL termina en un formato real que no enviamos solos (por ejemplo `.xlsx` o `.zip`), la URL completa no termina en una extensión de la lista y no mandas `file_type`, la respuesta es 415 con la extensión recibida.
- **El nombre del archivo:** `file_name` (opcional, hasta 255 caracteres, sin `/`, `\`, `?`, `#` ni caracteres de control) es el nombre con el que el contacto ve un documento; llévalo siempre con su extensión, por ejemplo `factura.pdf`. Es obligatorio cuando envías un documento por URL y la URL no termina en una extensión de la lista: sin él la respuesta es 422 con el error en `file_name`.
- **Formatos y tamaños:** los formatos aceptados por WhatsApp y el tamaño máximo de cada tipo son:
  - `image`: image/jpeg, image/png, image/webp; hasta 5 MB.
  - `video`: video/mp4, video/3gpp, image/gif; hasta 16 MB.
  - `audio`: audio/aac, audio/mp4, audio/mpeg, audio/amr, audio/ogg, audio/opus; hasta 16 MB.
  - `document`: text/plain, application/pdf, application/vnd.ms-powerpoint, application/msword, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.openxmlformats-officedocument.presentationml.presentation, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; hasta 100 MB.
  - `sticker`: image/webp; hasta 100 KB si es estático y 500 KB si es animado.
- **Historial y reenvío:** el historial del contacto guarda la URL tal cual la enviaste, y el nombre `file_name` no se guarda. Al reenviar un mensaje cuyo archivo es una URL, se reenvía la misma URL; con una extensión de la lista, como esa extensión indica; si no, un mensaje que enviaste se reenvía con su tipo sólo cuando su extensión es un formato que WhatsApp acepta para ese tipo (los de «Formatos y tamaños», por ejemplo `.3gp` para `video` o `.amr` para `audio`). Una URL sin extensión, un formato no aceptado, un documento cuya URL no termina en una extensión de la lista (por ejemplo `/descarga.php?id=7`) o un mensaje recibido sin una extensión de la lista no se puede reenviar: la respuesta es 422 con `error` = `not_forwardable` y `reason` = `unsupported_file_extension`.

### Acciones de grupo

#### Motivos

El `reason` de una acción `failed`, el de cada persona `failed` en `result.participants` y el de `group_action.failed` usan un único vocabulario cerrado; cualquier otro caso sale como `internal_error`, nunca con el texto del proveedor. Los valores posibles son: `max_pending_days_exceeded`, `max_retries_exceeded`, `owner_not_connected`, `no_creator_available_suspended`, `parent_group_creation_failed`, `permanent_condition_unmet`, `unexpected_job_failure`, `device_not_found`, `device_not_configured`, `disconnected_device`, `not_connected`, `not_respond`, `not_initialize`, `group_forbidden`, `phone_not_exists`, `creation_unconfirmed`, `creation_rejected`, `expired`, `window_closed`, `number_restricted`, `capacity_full`, `invite_capacity_full`, `duplicate_invite`, `template_params_missing`, `template_mismatch`, `participant_not_found`, `cannot_remove_business_number`, `pending_subscription`, `provider_error`, `provider_unsupported`, `not_permitted`, `group_not_found`, `orphan_standalone_action`, `standalone_context_mismatch`, `disabled`, `plan_cap_reached`, `device_not_group_number`, `device_not_connected`, `device_not_group_admin`, `unsupported_group_type`, `join_request_not_found`, `internal_error`.

## Herramientas

- **Instrucciones para el agente:** las de esta API, en dos formas con el mismo contenido. La skill `funnelchat`, en
  `https://developers-portal.funnelchat.app/skill/funnelchat.zip` (la carpeta `funnelchat/` en la raíz): se descomprime en `~/.claude/skills/` para
  todos los proyectos o en `.claude/skills/` de uno. Y un solo Markdown, `https://developers-portal.funnelchat.app/ia/instrucciones.md`, para guardar en
  el proyecto como `FUNNELCHAT.md` y nombrar desde `AGENTS.md` (o `CLAUDE.md`); sirve para cualquier agente. Los pasos
  para que un agente configure Funnelchat en la compu de la persona, hasta su primer mensaje: `https://developers-portal.funnelchat.app/ia/`.
- **SDK de Node.js:** `npm install @funnelchat-hq/sdk` (Node 18 o más nuevo). Si no le pasas la clave, el cliente la lee
  de `FUNNELCHAT_API_KEY`.
- **SDK de PHP:** `composer require funnelchat/funnelchat-php`.
- **SDK de Python:** `pip install funnelchat` (Python 3.9 o más nuevo). `Funnelchat()` lee la clave de
  `FUNNELCHAT_API_KEY`; el primer mensaje es
  `client.messages.send_direct(device_id=<id del número>, phone="<teléfono con código de país>", text="<texto>")`.
- **CLI:** `npx @funnelchat-hq/cli <comando>` (Node 18 o más nuevo), o `npm install -g @funnelchat-hq/cli` y el comando
  `funnelchat`. Lee la clave de `FUNNELCHAT_API_KEY` (o de `login`, que la guarda sin mostrarla). El primer uso:
  `numbers list` (primero: si la cuenta ya tiene un número conectado, no hace falta conectar otro), `connect` (con
  `--no-wait`, imprime el link con el QR y termina; con `--us-number`, el link pide un número de EE. UU. de
  Funnelchat; con `--device <id>`, reconecta un número de la cuenta) y `send <teléfono> "<texto>"` (sigue el mensaje
  hasta `read` y muestra cada estado). Con `--json`, cada comando devuelve un solo JSON en la salida estándar; un error
  es un JSON en la salida de errores con `code`, `exit_code`, `hint` y `request_id`. **Toda la API desde la terminal:**
  `api list <palabras> --json` lista las funciones (nombre, método, ruta, para qué sirve, permiso y si pide
  confirmación), `api <función> --help` dice qué recibe una, con un ejemplo, y `--json api <función> --<parámetro>
  <valor> --field <campo>=<valor>` la llama (o el cuerpo entero con `--body @archivo.json`). Una escritura se manda una
  sola vez y nunca se reintenta sola. Lo que no se puede deshacer, sin una terminal, solo sale con `--yes`: agrégalo
  solo después de que la persona lo confirme.
- **Nodo de n8n:** el paquete de nodos de comunidad `@funnelchat-hq/n8n-nodes-funnelchat` (en n8n: Settings › Community
  Nodes › Install).
- **Sandbox:** `npx @funnelchat-hq/sandbox` (Node 20.11 o más nuevo) levanta en `http://127.0.0.1:4010` una imitación de
  la API: las mismas rutas bajo `/api/v1`, sin cuenta real y sin mandar nada a WhatsApp. Acepta cualquier clave bien
  formada, por ejemplo `1|fc_live_sandbox`. Para probar, usa `http://127.0.0.1:4010` como URL base. Simula lo que hace
  otro: `POST /_sandbox/inbound/message` (un contacto te escribe), `POST /_sandbox/devices/{id}/disconnect` (con
  `{"reason": …}`), `POST /_sandbox/templates/{id}/status` (Meta aprueba o rechaza) y `POST /_sandbox/events/{type}`
  (cualquier evento, con su ejemplo). **No valida todo lo que valida la API**: que el sandbox acepte un cuerpo no prueba
  que la API lo acepte. `GET /_sandbox/operations` dice qué llamadas solo devuelven la forma (`shape-only`).
- **Lo que lee el agente:** `https://developers-portal.funnelchat.app/llms.txt` (empieza por las recetas por tarea), `https://developers-portal.funnelchat.app/ia/lo-basico.md` (lo
  que vale para toda la API, una sola vez), `https://developers-portal.funnelchat.app/ia/llamadas.md` (cada llamada, con el enlace a su texto) y la
  especificación `https://developers-portal.funnelchat.app/specs/funnelchat.json`.

## Índice de temas: lo que viene después del primer uso

Lo que la API hace además del primer uso, en dos partes. Cada tema tiene su propio texto, con sus llamadas (permiso, campos, respuestas y errores) y sus eventos con su ejemplo: lee solo el del tema que la persona necesita, no todos.

### Funciones de WhatsApp

La página, con lo que dice cada tema y sin el detalle de cada llamada: [Funciones de WhatsApp](/ia/mas-funciones/whatsapp.md).

- [Administrar tus números](/ia/mas-funciones/whatsapp/administrar-tus-numeros.md): Mira, edita, desconecta o borra tus números, conéctalos por QR desde tu sistema, revisa su salud, su historial de conexión y su cola de mensajes, y entérate cuando algo cambia.
- [Atender una conversación](/ia/mas-funciones/whatsapp/atender-una-conversacion.md): Respóndele a un contacto por su id, marca como leído lo que te escribió, muestra «escribiendo…», reacciona a sus mensajes, reenvía un mensaje y compártele una tarjeta de contacto.
- [Grupos y sus acciones](/ia/mas-funciones/whatsapp/grupos-y-acciones.md): Ve los grupos de tu workspace y sus participantes, crea grupos, suma y saca personas, cambia sus datos y su link, responde a las solicitudes para unirse y entérate de lo que pasa adentro.
- [Plantillas de Meta](/ia/mas-funciones/whatsapp/plantillas.md): Crea, revisa y edita tus plantillas de WhatsApp, mira sus métricas, bórrala de un número y entérate cuando Meta cambia su estado.
- [Formularios de WhatsApp](/ia/mas-funciones/whatsapp/formularios.md): Arma tus formularios de WhatsApp, publícalos en tus números oficiales, mándaselos a tus contactos, cámbialos con versiones nuevas y lee sus respuestas y sus métricas.
- [Conversions API](/ia/mas-funciones/whatsapp/conversions-api.md): Prepara y prueba la conexión de tus números oficiales con la Conversions API de Meta: el dataset de cada cuenta de WhatsApp Business y su estado.
- [Costos de WhatsApp y cuentas de Meta](/ia/mas-funciones/whatsapp/costos-y-cuentas-de-meta.md): Mira cuánto te cuesta WhatsApp en un mes y las cuentas de WhatsApp Business de tus números oficiales, con su límite de mensajes por día.

### Funciones de Funnelchat

La página, con lo que dice cada tema y sin el detalle de cada llamada: [Funciones de Funnelchat](/ia/mas-funciones/funnelchat.md).

- [Contactos y conversaciones](/ia/mas-funciones/funnelchat/contactos-y-conversaciones.md): Busca tus contactos y los de cada número, créalos o actualízalos por su teléfono, edítalos o bórralos, mira su ventana de 24 horas, lee y cuenta tus conversaciones, márcalas todas como leídas o no leídas y entérate cuando algo cambia.
- [Etiquetas y campos personalizados](/ia/mas-funciones/funnelchat/etiquetas-y-campos.md): Ve, arma y borra tus etiquetas y tus campos personalizados, agrégales o quítales etiquetas a tus contactos, guárdales tus propios datos y entérate cuando un contacto recibe o pierde una etiqueta.
- [Notas de un contacto](/ia/mas-funciones/funnelchat/notas.md): Lee las notas que tu equipo dejó sobre un contacto, agrega una nueva o borra la que ya no sirve.
- [Tableros](/ia/mas-funciones/funnelchat/tableros.md): Arma tus tableros y sus etapas, mira qué contactos hay en cada etapa, muévelos o sácalos, y entérate cada vez que un contacto cambia de etapa.
- [Tickets](/ia/mas-funciones/funnelchat/tickets.md): Abre tickets sobre tus contactos, dáselos a alguien de tu equipo, edítalos, ciérralos y vuelve a abrirlos.
- [Respuestas rápidas](/ia/mas-funciones/funnelchat/respuestas-rapidas.md): Mira las respuestas rápidas de tu equipo, crea nuevas, edítalas o bórralas.
- [Automatizaciones y carpetas de flujos](/ia/mas-funciones/funnelchat/automatizaciones.md): Mira tus flujos y sus pasos, qué automatizaciones se corrieron sobre un contacto y quiénes están en curso o pausados en cada flujo, cancela una ejecución, pausa las automatizaciones de un contacto, ordena tus flujos en carpetas y entérate cuando una termina o falla.
- [Difusiones](/ia/mas-funciones/funnelchat/difusiones.md): Mira tus difusiones, a quién llegan, sus estadísticas, su costo y el resultado con cada contacto, cancela una que quedó pausada, borra una que todavía no salió y ordénalas en carpetas.
- [Campañas de grupos](/ia/mas-funciones/funnelchat/campanas.md): Mira tus campañas de grupos, sus grupos, quién entra y quién sale, y cómo van sus pipelines y planes de operación.
- [Envíos programados](/ia/mas-funciones/funnelchat/envios-programados.md): Mira tus envíos programados a grupos, sus grupos, cómo salió cada uno en cada grupo, cada vez que salió uno que se repite, cuántos lo leyeron y qué respondieron, y entérate cuando termina o falla.
- [Estadísticas de tus grupos](/ia/mas-funciones/funnelchat/estadisticas.md): Mira cuántas personas entran y salen de tus grupos y campañas, cuántas están activas, tus grupos por estado, los clics en tus links y de qué países son.
- [Puntaje de tus contactos](/ia/mas-funciones/funnelchat/puntaje.md): Mira el puntaje de tus contactos y cómo se reparte, ajusta el de uno y configura cómo se calcula.
- [Ventas](/ia/mas-funciones/funnelchat/ventas.md): Mira las ventas que registran tus plataformas de pagos, sus métricas, el embudo de conversaciones a compras, las ventas por plataforma y los productos de cada una.
- [Dominios propios](/ia/mas-funciones/funnelchat/dominios-propios.md): Usa un dominio tuyo, como `go.mimarca.com`, para el servicio de redirección de Funnelchat: lo registras, creas en tu DNS los registros que te indica, lo verificas y lo borras cuando ya no lo usas.
- [Tu cuenta y tu equipo](/ia/mas-funciones/funnelchat/cuenta-y-equipo.md): Mira tu cuenta y su plan, tu consumo de contactos activos y las personas de tu equipo, y entérate de tus cobros, tu suscripción y tu límite de contactos activos.
- [Alertas](/ia/mas-funciones/funnelchat/alertas.md): Mira las alertas de tu operación y los teléfonos y webhooks que las reciben, elige qué alerta le llega a cada uno, y configura el horario de silencio y el reporte diario.
- [Más sobre tus webhooks](/ia/mas-funciones/funnelchat/mas-webhooks.md): Mira uno de tus webhooks y sus entregas, edítalo o páusalo y consulta los tipos de evento que hay.
