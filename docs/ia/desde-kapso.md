# Migrar desde Kapso

> https://developers-portal.funnelchat.app/docs/desde-kapso/

## Paso 1: Conecta tu número

Para un número oficial que hoy está en Kapso:

1. En Kapso, apaga los mensajes entrantes del número (`inbound_processing_enabled: false`) y sus workflows.
2. Si Kapso le paga a Meta por ese número (`funded` en `GET /platform/v1/whatsapp/accounts/{waba_id}/funding`), revoca ese crédito con `POST /platform/v1/whatsapp/portfolios/{portfolio_id}/funding/revoke` y espera `succeeded`. Afecta a toda la cartera: habla antes con el soporte de Kapso.
3. En el Administrador de WhatsApp de Meta, apaga la verificación en dos pasos del número, o anota el PIN.
4. Quita el número del WABA. No puede haber mandado mensajes pagos en los últimos 30 días.
5. Espera unos 10 minutos.
6. Conéctalo en el panel de Funnelchat, con el Facebook de quien administra la cartera comercial. Por la API no se puede: un link `type: "meta"` responde hoy `503 meta_connect_disabled`.
7. Trae o recrea sus plantillas ([Paso 5](https://developers-portal.funnelchat.app/docs/desde-kapso/#paso-5)).

El número no manda desde el paso 4 hasta que lo conectas. No lo dejes en los dos proveedores: la otra app recibe el error `131070` de Meta. Si usa el agente de Meta (Meta Business Agent), apágalo antes.

> [!WARNING] ¿Está en coexistencia?
> Con `is_coexistence: true`, no quites el número ni el WABA. Revoca el crédito de Kapso, si lo hay. En la app WhatsApp Business, desconecta a Kapso. Espera unos 10 minutos y haz el alta de coexistencia en el panel. Esa alta crea un WABA nuevo: recrea tus plantillas.

- **Número de EE. UU. de Kapso:** es de Kapso. Usa otro número y díselo a tus contactos.
- **Número de tu Twilio o Telnyx:** Kapso cambió sus webhooks de voz y SMS (en Telnyx, a su conexión TeXML). Apúntalo otra vez a lo tuyo para recibir el código de Meta, deja el pool de Kapso en `mark_unavailable` y sigue los pasos de arriba.
- **Pagar con tarjeta** después del crédito de Kapso: Meta pide un WABA nuevo.
- **Sandbox de Kapso:** no se migra.

**Por QR**, un número se conecta desde tu sistema. No es oficial: sirve para grupos, y WhatsApp puede restringirlo si manda lo que la gente no espera.

```bash
curl -X POST https://api.funnelchat.com/api/v1/connect-links \
  -H "Authorization: Bearer $FUNNELCHAT_API_KEY" -H "Content-Type: application/json" \
  -d '{"type": "qr", "country": "mx"}'
```

Abre `data.url` y escanea el QR en WhatsApp, en **Dispositivos vinculados**, antes de 10 minutos. `country` es el país desde donde se abre la sesión.

> [!NOTE] ¿Quieres probar antes?
> El [sandbox](https://developers-portal.funnelchat.app/docs/herramientas/#sandbox) imita la API en tu máquina, sin mandar nada a WhatsApp: corre `npx @funnelchat-hq/sandbox` y usa `http://127.0.0.1:4010` como URL base. De punta a punta, prueba con un número tuyo por QR mientras Kapso sigue con el tráfico real.

## Paso 2: Tu clave y tus ids

Crea una clave en el panel, en **Desarrolladores → Crear clave**. Se ve una sola vez. Es de un [workspace](https://developers-portal.funnelchat.app/docs/workspaces/) y tiene permisos por área.

| En Kapso | En Funnelchat |
|---|---|
| `KAPSO_API_KEY` y `X-API-Key` | `FUNNELCHAT_API_KEY` y `Authorization: Bearer $FUNNELCHAT_API_KEY`. En un `.env`, va entre comillas simples: lleva una barra vertical. |
| `https://api.kapso.ai/…` y `META_GRAPH_VERSION` | `https://api.funnelchat.com`, con la ruta `/api/v1/…`. No hay proxy de la Graph API. |
| `PHONE_NUMBER_ID` | `FUNNELCHAT_DEVICE_ID`: el `id` del número (`dev_…`), solo en el servidor. |
| `WABA_ID` | Sobra: es el `waba_id` del número. |
| `KAPSO_WEBHOOK_SECRET` | `FUNNELCHAT_WEBHOOK_SECRET`: te lo da Funnelchat ([Paso 4](https://developers-portal.funnelchat.app/docs/desde-kapso/#paso-4)). |
| `WHATSAPP_ACCESS_TOKEN`, `META_APP_SECRET`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Bórralas. |

Busca tus números:

```bash
curl "https://api.funnelchat.com/api/v1/devices" -H "Authorization: Bearer $FUNNELCHAT_API_KEY"
```

```json
{
  "data": [
    {
      "id": "dev_Ac7Ku7iIZDXJTjdCu0UB1mX",
      "alias": "Soporte",
      "number": "5491122334455",
      "phone_number_id": "110987654321",
      "waba_id": "98765432109",
      "connection": "dedicated",
      "connected": 1,
      "external_reference": "cliente-81"
    }
  ],
  "links": { "next": null }
}
```

Guarda la relación `phone_number_id` → `id`. `connection` es `qr`, `coexistence` o `dedicated`; un número por QR no tiene `phone_number_id`. Pide las páginas con `perPage` y `links.next` hasta `null`, y acepta también una lista sola.

| En Kapso | En Funnelchat |
|---|---|
| `phone_number_id` | `device_id`: el `id` del número (`dev_…`) |
| `business_account_id` | `waba_id` del número |
| Customer | Tu id, en `external_reference` |
| Conversación | El contacto (`ctc_…`) |
| `wamid` | `msg_…`. El `wamid` no viaja. |
| Plantilla por `name` y `language` | Su `id` (`tpl_…`) |
| `flow_id` | `frm_…` (el formulario) y `frv_…` (una versión) |
| BSUID | `whatsapp_id` del contacto |

Si solo tienes el teléfono, `POST /api/v1/contacts` con `{"phone": "5491122334455"}` te da el contacto: lo crea (`201`) o devuelve el que ya existe (`200`).

Un error trae `{"error": "<código>", "message": "<texto>"}`: decide por `error`. Lo que Meta rechazaba al mandar, Funnelchat lo frena antes (`422 window_closed` en lugar de `131047`) o llega en `data.error.code` de `message.status_changed`. Ver [Límites y errores](https://developers-portal.funnelchat.app/docs/limites-y-errores/).

## Paso 3: Cambia el envío

Cambia `POST /{phone_number_id}/messages` por una llamada por tipo de mensaje. El número que manda va en `device_id`.

### Texto

Dentro de las 24 horas, o con un número por QR. **Kapso:**

```bash
curl -X POST "https://api.kapso.ai/meta/whatsapp/v24.0/110987654321/messages" \
  -H "X-API-Key: $KAPSO_API_KEY" -H "Content-Type: application/json" \
  -d '{"messaging_product": "whatsapp", "to": "5491122334455", "type": "text",
       "text": {"body": "Tu pedido salió."}, "biz_opaque_callback_data": "pedido-8841"}'
```

**Funnelchat:**

```bash
curl -X POST https://api.funnelchat.com/api/v1/message/send-message \
  -H "Authorization: Bearer $FUNNELCHAT_API_KEY" -H "Content-Type: application/json" \
  -d '{"device_id": "dev_Ac7Ku7iIZDXJTjdCu0UB1mX", "phone": "5491122334455",
       "text": "Tu pedido salió.", "client_reference": "pedido-8841"}'
```

`phone` va sin `+`; si todavía no es tu contacto, se crea. `client_reference` (hasta 64 caracteres, sin espacios) vuelve en `message.status_changed`.

### Plantilla

Fuera de las 24 horas, con un número oficial. **Kapso:**

```bash
curl -X POST "https://api.kapso.ai/meta/whatsapp/v24.0/110987654321/messages" \
  -H "X-API-Key: $KAPSO_API_KEY" -H "Content-Type: application/json" \
  -d '{"messaging_product": "whatsapp", "to": "5491122334455", "type": "template",
       "template": {"name": "pedido_listo", "language": {"code": "es"}, "components": [{"type": "body",
         "parameters": [{"type": "text", "text": "Lucía"}, {"type": "text", "text": "8841"}]}]}}'
```

**Funnelchat:**

```bash
curl -X POST https://api.funnelchat.com/api/v1/devices/dev_Ac7Ku7iIZDXJTjdCu0UB1mX/templates/tpl_AlgBF7nTNqV0atiwNuKFmT8/send-template \
  -H "Authorization: Bearer $FUNNELCHAT_API_KEY" -H "Content-Type: application/json" \
  -d '{"phone": "5491122334455", "template_variables": {"body": ["Lucía", "8841"]}, "client_reference": "pedido-8841"}'
```

La plantilla va por su `tpl_…` ([Paso 5](https://developers-portal.funnelchat.app/docs/desde-kapso/#paso-5)). `template_variables.body` lleva los textos del cuerpo, en orden. No hay campo para el encabezado ni los botones.

### Imagen o archivo

**Kapso:**

```bash
curl -X POST "https://api.kapso.ai/meta/whatsapp/v24.0/110987654321/messages" \
  -H "X-API-Key: $KAPSO_API_KEY" -H "Content-Type: application/json" \
  -d '{"messaging_product": "whatsapp", "to": "5491122334455", "type": "document",
       "document": {"link": "https://cdn.example.com/f/2026-10.pdf", "filename": "factura.pdf", "caption": "Tu factura"}}'
```

**Funnelchat:**

```bash
curl -X POST https://api.funnelchat.com/api/v1/message/send-message \
  -H "Authorization: Bearer $FUNNELCHAT_API_KEY" -H "Content-Type: application/json" \
  -d '{"device_id": "dev_Ac7Ku7iIZDXJTjdCu0UB1mX", "phone": "5491122334455",
       "file": "https://cdn.example.com/f/2026-10.pdf", "file_name": "factura.pdf", "text": "Tu factura"}'
```

No hay media ids ni subida: manda una URL que dure al menos una hora. El tipo sale de la extensión; con otra, como `.xlsx`, manda `file_type`. El audio y el sticker van sin `text`. El audio sale como archivo, no como nota de voz.

### Botones y listas

**Kapso:**

```bash
curl -X POST "https://api.kapso.ai/meta/whatsapp/v24.0/110987654321/messages" \
  -H "X-API-Key: $KAPSO_API_KEY" -H "Content-Type: application/json" \
  -d '{"messaging_product": "whatsapp", "to": "5491122334455", "type": "interactive",
       "interactive": {"type": "button", "body": {"text": "¿Confirmamos?"}, "action": {"buttons": [
         {"type": "reply", "reply": {"id": "si", "title": "Sí"}}, {"type": "reply", "reply": {"id": "no", "title": "No"}}]}}}'
```

**Funnelchat:**

```bash
curl -X POST https://api.funnelchat.com/api/v1/contacts/ctc_ABViuUDF93I2VL1tInstRDG/message \
  -H "Authorization: Bearer $FUNNELCHAT_API_KEY" -H "Content-Type: application/json" \
  -d '{"contact_id": "ctc_ABViuUDF93I2VL1tInstRDG", "phone": "5491122334455",
       "device_id": "dev_Ac7Ku7iIZDXJTjdCu0UB1mX", "text": "¿Confirmamos?",
       "options": [{"id": "si", "label": "Sí"}, {"id": "no", "label": "No"}]}'
```

- Va por contacto: el `ctc_…` en la ruta y en `contact_id`, más el `phone` sin `+`.
- El encabezado, el pie y las descripciones de las filas van dentro de `text`.
- Usa los límites de Meta: hasta 3 botones de 20 caracteres, o 10 filas de 24. La referencia no describe cómo se ven: pruébalo con un número tuyo.
- Al elegir, llega `message.received` sin el `id` de la opción: compara `data.message.text` con tus `label`.

### Responder a un mensaje

**Kapso:**

```bash
curl -X POST "https://api.kapso.ai/meta/whatsapp/v24.0/110987654321/messages" \
  -H "X-API-Key: $KAPSO_API_KEY" -H "Content-Type: application/json" \
  -d '{"messaging_product": "whatsapp", "to": "5491122334455", "type": "text",
       "context": {"message_id": "wamid.HBgN…"}, "text": {"body": "Ya lo reviso."}}'
```

**Funnelchat**, con `data.device_id` y `data.contact.id` de `message.received`:

```bash
curl -X POST https://api.funnelchat.com/api/v1/message/send-message \
  -H "Authorization: Bearer $FUNNELCHAT_API_KEY" -H "Content-Type: application/json" \
  -d '{"device_id": "dev_AFHtaOVjNBTEWzCuDrmxMPP", "contact_id": "ctc_ABViuUDF93I2VL1tInstRDG",
       "text": "Ya lo reviso."}'
```

- No hay cita: `context.message_id` no tiene par.
- Leído: `POST /api/v1/contacts/{contact}/messages/{message}/read`, con el `msg_…` en `{message}`.
- «Escribiendo…», solo en números oficiales: `POST /api/v1/contacts/{contact}/typing` con `{"device_id": "dev_AFHtaOVjNBTEWzCuDrmxMPP"}`.
- Reacción: `PUT /api/v1/contacts/{contact}/messages/{message}/reaction` con `emoji`.

- **La respuesta es el mensaje en cola:** `message.id` (`msg_…`) y `status: "queued"`, sin `wamid`. El resultado llega con `message.status_changed`. No reenvíes un `queued`.
- **El antibloqueo:** no salen el mismo contenido por tercera vez en 24 horas (`422 antiblock_duplicate_content`) ni un sexto mensaje seguido sin respuesta (`422 antiblock_unanswered_limit`). Se reinicia cuando el contacto responde. Junta los mensajes de tu bot.

| En Kapso | En Funnelchat |
|---|---|
| `location`, `cta_url` | Un texto con el link |
| `location_request_message`, catálogo, productos | No hay |
| `interactive` `flow` | `POST /api/v1/contacts/{contact}/message/form` ([Formularios](https://developers-portal.funnelchat.app/docs/desde-kapso/#formularios)) |
| `contacts` (vCard) | `POST /api/v1/contacts/{contact}/message/contact-card`, con contactos de tu cuenta |
| A un grupo | `POST /api/v1/groups/{group}/messages` |
| `GET /{phone_number_id}/messages` | `GET /api/v1/contacts/{contactId}/messages`, por contacto |
| Un mensaje por su id | `GET /api/v1/contacts/{contact}/messages/{message}`, por `msg_…` |

### Con el SDK de Node.js

| `@kapso/whatsapp-cloud-api` | `@funnelchat-hq/sdk` |
|---|---|
| `sendText`, `sendImage`, `sendDocument`… | `funnelchat.messages.sendDirect({ device_id, phone, text, file, file_name })` |
| `sendInteractiveButtons`, `sendInteractiveList` | `funnelchat.messages.send(contactId, { contact_id, device_id, phone, text, options })` |
| `sendTemplate` | `funnelchat.templates.send(deviceId, templateId, { phone, template_variables })` |
| `sendReaction` | `funnelchat.messages.react(contactId, messageId, { emoji })` |
| `verifySignature` | `Funnelchat.webhooks.constructEvent(cuerpoCrudo, cabecera, secreto)` |
| Lo demás | `funnelchat.request(método, ruta, { path, query, body })` |

`new Funnelchat()` lee `FUNNELCHAT_API_KEY`.

## Paso 4: Cambia los webhooks

Crea una sola suscripción para todo el workspace. Guarda el `id` y el `secret` de la respuesta: el secreto llega solo esa vez.

**Kapso:**

```bash
curl -X POST https://api.kapso.ai/platform/v1/whatsapp/phone_numbers/110987654321/webhooks \
  -H "X-API-Key: $KAPSO_API_KEY" -H "Content-Type: application/json" \
  -d '{"whatsapp_webhook": {"url": "https://tu-servidor.example/kapso", "secret_key": "…",
       "events": ["whatsapp.message.received", "whatsapp.message.read"]}}'
```

**Funnelchat:**

```bash
curl -X POST https://api.funnelchat.com/api/v1/webhooks \
  -H "Authorization: Bearer $FUNNELCHAT_API_KEY" -H "Content-Type: application/json" \
  -d '{"url": "https://tu-servidor.example/funnelchat",
       "events": ["message.received", "message.status_changed", "device.connected", "device.disconnected"]}'
```

- Llegan los eventos de todos los números del workspace: filtra por `data.device_id` (en los `device.*`, por `data.device.id`).
- Repetir el alta crea otra suscripción, con otro secreto. Si no respondió, búscala en `GET /api/v1/webhooks`.
- `kind: "meta"`, `buffer_*`, `inactivity_minutes`, `headers` y el `GET` con `hub.challenge` no existen.
- Pide **Avisos (webhooks) → Administrar** y, por cada evento, ver su área.
- Para editarla, `PUT /api/v1/webhooks/{id}` con todo. Para probarla, `POST /api/v1/webhooks/{id}/test`.

| En Kapso | En Funnelchat |
|---|---|
| `whatsapp.message.received` | `message.received` |
| `whatsapp.message.sent`, `.delivered`, `.read`, `.failed` | `message.status_changed`, con `data.status`. No llega por difusiones. |
| `whatsapp.conversation.created` | `contact.created`, solo con contactos nuevos |
| `whatsapp.conversation.ended` | `conversation.closed`. La referencia no dice que se cierre sola. |
| `whatsapp.phone_number.created`, `.deleted` | `device.connected`, `device.deleted` |
| Los demás `whatsapp.phone_number.*` y `whatsapp.account.*` | Sin par. Lo más cercano: `device.disconnected` y `device.health_changed`. |
| `workflow.execution.failed`, `.handoff` | `flow.failed`, `conversation.assigned` |
| Respuesta de un WhatsApp Flow | `whatsapp_form.completed` |
| Reacción de un contacto | No llega. |

### `message.received`, campo a campo

| En Kapso | En Funnelchat |
|---|---|
| `message.id` | `data.message.id` (`msg_…`) |
| `message.from` | `data.contact.phone`, con `+` |
| `conversation.id` | `data.contact.id` (`ctc_…`) |
| `conversation.contact_name` | `data.contact.name` |
| `phone_number_id` | `data.device_id` |
| `message.type` | `data.message.type`. Acepta valores nuevos. |
| `message.text.body` | `data.message.text` |
| `message.timestamp` | `occurred_at`, en ISO 8601 |
| `message.kapso.media_url` | No hay: la forma de `data.message.media` no está descrita. |
| `message.context`, `is_new_conversation` | No vienen. |

`message.status_changed` trae `data.message_id`, `data.client_reference`, `data.status` y, con `failed`, `data.error` (`code` y `title`). Si Funnelchat no lo dejó salir, `data.error.reason` dice por qué.

### Verifica la firma

Funnelchat firma con `X-Funnelchat-Signature: t=…,v1=…`. `v1` es el HMAC-SHA256 de `t`, un punto y el cuerpo crudo, con el `secret` completo como clave (con su `whsec_`). Rechaza si `t` está a más de 300 segundos. Usa estas funciones probadas.

**Node.js** (`snippets/verificar-firma.js`):

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

**Python** (`snippets/verificar_firma.py`):

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

**PHP** (`snippets/verificar-firma.php`):

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

Verifica sobre el cuerpo tal como llegó (`express.raw`), nunca sobre `JSON.stringify(req.body)`. En un proyecto ESM, guarda la de Node.js como `verificar-firma.cjs`. En Cloudflare Workers, activa `nodejs_compat`.

### Cómo llega cada entrega

| | Kapso | Funnelchat |
|---|---|---|
| Cuerpo | Un evento o un lote | Un evento: `{id, type, version, occurred_at, data}` |
| Tipo | `X-Webhook-Event` | `type` del cuerpo |
| Repetidos | `X-Idempotency-Key` | `id` del cuerpo (`evt_…`) |
| Respuesta | `200` | `2xx` en 10 segundos, sin redirecciones |
| Reintentos | Ante lo que no sea `200` | Ante un error de red, un `5xx` o un `429`: 4 intentos, con esperas de 60 s, 5 min y 30 min |
| Tras fallar | Pausa por tasa de fallos | `disabled` tras 5 fallos seguidos. Lo de ese tiempo no llega. |
| Orden | Por conversación | No está publicado: ordena por `occurred_at` |

## Paso 5: Plantillas

Trae las plantillas del WABA, con el número ya conectado:

```bash
curl -X POST https://api.funnelchat.com/api/v1/devices/dev_Ac7Ku7iIZDXJTjdCu0UB1mX/templates \
  -H "Authorization: Bearer $FUNNELCHAT_API_KEY"
```

Busca el `tpl_…` de cada una y guárdalo: `GET /api/v1/templates?name=pedido_listo&language_code=es&status=APPROVED&deviceId=dev_Ac7Ku7iIZDXJTjdCu0UB1mX`. Quédate con la fila de `name` exacto y el `waba_id` del número.

Para crear una, **Kapso:**

```bash
curl -X POST "https://api.kapso.ai/meta/whatsapp/v24.0/98765432109/message_templates" \
  -H "X-API-Key: $KAPSO_API_KEY" -H "Content-Type: application/json" \
  -d '{"name": "pedido_enviado", "category": "UTILITY", "language": "es",
       "components": [{"type": "BODY", "text": "Tu pedido salió. Te escribimos cuando llegue."}]}'
```

**Funnelchat:**

```bash
curl -X POST https://api.funnelchat.com/api/v1/templates \
  -H "Authorization: Bearer $FUNNELCHAT_API_KEY" -H "Content-Type: application/json" \
  -d '{"device_id": "dev_Ac7Ku7iIZDXJTjdCu0UB1mX", "name": "pedido_enviado", "language_code": "es",
       "category": "UTILITY", "type": "text", "body": "Tu pedido salió. Te escribimos cuando llegue."}'
```

Queda en el WABA del número de `device_id`, en `PENDING`. Lo que decide Meta llega con `template.status_changed`.

| En Kapso | En Funnelchat |
|---|---|
| Crear con variables o con encabezado de archivo | En el Administrador de WhatsApp de Meta, y tráela. Por la API, solo `type: "text"` sin variables. |
| Variables con nombre | Solo numeradas: rehaz la plantilla. |
| Completar `header` o `button` al mandar | No hay campo: rehaz la plantilla con eso fijo, o pásalo al cuerpo. |
| `AUTHENTICATION` con botón de código | No hay: ese envío queda fuera de Funnelchat. |
| Editar y borrar | `PUT /api/v1/templates/{template}` y `DELETE /api/v1/devices/{device}/templates/{template}` |

## Varios clientes

Pon tu id de cliente en `external_reference` del link de alta. Pasa al número y viaja en los eventos `device.*`. No hay customers.

**Kapso:**

```bash
curl -X POST https://api.kapso.ai/platform/v1/customers/$CUSTOMER_ID/setup_links \
  -H "X-API-Key: $KAPSO_API_KEY" -H "Content-Type: application/json" \
  -d '{"setup_link": {"success_redirect_url": "https://tu-sistema.com/wa/ok"}}'
```

**Funnelchat:**

```bash
curl -X POST https://api.funnelchat.com/api/v1/connect-links \
  -H "Authorization: Bearer $FUNNELCHAT_API_KEY" -H "Content-Type: application/json" \
  -H "Idempotency-Key: alta-cliente-81" \
  -d '{"type": "qr", "country": "mx", "external_reference": "cliente-81",
       "return_url": "https://tu-sistema.com/wa/vuelta"}'
```

Mándale a tu cliente `data.url`. Sale solo en esta respuesta y es un secreto. Cuando conecta, llega `device.connected` con `data.device.external_reference`.

| En Kapso | En Funnelchat |
|---|---|
| Los números de un customer | `GET /api/v1/devices?external_reference=cliente-81` |
| `success_redirect_url`, `failure_redirect_url` | Una sola `return_url`, que vuelve con `status` (`completed` o `failed`) |
| `expires_at` | `expires_in_minutes`, de 30 a 10 080. No se edita: anúlalo con `DELETE /api/v1/connect-links/{link}`. |
| Un link activo por customer | Varios a la vez: anula tú los viejos |
| `reconnect_phone_number` | `device_id` en el cuerpo |
| Alta oficial y `meta_billing_mode` | En el panel. Tu cliente le paga a Meta. |

Un workspace junta contactos, etiquetas, plan y webhooks. Para separar a tus clientes, crea un workspace por cliente en el panel, cada uno con su clave ([Workspaces](https://developers-portal.funnelchat.app/docs/workspaces/)).

## Envíos masivos

Arma la difusión en el panel, con una etiqueta como audiencia. Por la API, prepara esa audiencia:

1. Crea la etiqueta: `POST /api/v1/tags`.
2. Crea un campo por variable del cuerpo: `POST /api/v1/custom-fields`, con `type: 0` (texto).
3. Pasa cada teléfono a contacto, con sus valores: `POST /api/v1/contacts/update-or-create`, con `phone` y `custom_fields`. Son 30 escrituras por minuto.
4. Etiquétalos: `POST /api/v1/contacts/add-tags?bulk=true`, hasta 200 por llamada.
5. En el panel, crea la difusión con el número, la plantilla y la etiqueta.

Los campos son del contacto: dos difusiones a la vez para los mismos contactos se pisan. Síguela con `GET /api/v1/broadcasts/{broadcast}/statistics` y los eventos `broadcast.finished` y `broadcast.paused`. Ver [Difusiones](https://developers-portal.funnelchat.app/docs/mas-funciones/funnelchat/#difusiones).

## Workflows y agentes

Arma el flujo en el panel, con el disparador «Tag agregado». Para arrancarlo desde tu sistema, guarda las variables en campos del contacto y ponle la etiqueta.

**Kapso:**

```bash
curl -X POST "https://api.kapso.ai/platform/v1/workflows/2f6c1d3e-8a4b-4c5d-9e7f-1a2b3c4d5e6f/executions" \
  -H "X-API-Key: $KAPSO_API_KEY" -H "Content-Type: application/json" \
  -d '{"workflow_execution": {"phone_number": "+5491122334455", "phone_number_id": "110987654321",
       "variables": {"pedido": "8841"}}}'
```

**Funnelchat:**

```bash
curl -X POST https://api.funnelchat.com/api/v1/contacts/update-or-create \
  -H "Authorization: Bearer $FUNNELCHAT_API_KEY" -H "Content-Type: application/json" \
  -d '{"phone": "5491122334455", "custom_fields": [{"id": "fld_AGxYus0ZuS8ViUElnapfBA0", "value": "8841"}]}'

curl -X POST https://api.funnelchat.com/api/v1/contacts/add-tags \
  -H "Authorization: Bearer $FUNNELCHAT_API_KEY" -H "Content-Type: application/json" \
  -d '[{"contactId": "ctc_ABViuUDF93I2VL1tInstRDG", "tag": {"id": "tag_AIJEDzSFQ6oDXbab3DubTEG"}}]'
```

- Un contacto por llamada y sin `bulk`: si no, no arranca. Si ya tenía la etiqueta, quítasela antes con `POST /api/v1/contacts/remove-tags`.
- Responde `200` sin cuerpo. Confírmalo con `GET /api/v1/contacts/{contact}/flows`.
- Para frenarlo, `PUT /api/v1/contact-flows/{contactFlowId}/cancel` con el `run_…` de `GET /api/v1/contact-flows/{contactId}`.

| En Kapso | En el panel de Funnelchat |
|---|---|
| Trigger `inbound_message` | «Mensaje recibido» |
| Send text, template, interactive | «Enviar mensaje», «Plantillas», «Múltiple» |
| Wait for response, decide | «Simple», «Condición» |
| Function node, webhook node | «Petición HTTP» a tu servidor |
| Agent node | «Asignar Super Agente IA»: el flujo termina ahí |
| Call workflow | «Iniciar automatización»: no vuelve |
| Handoff | «Asignar conversación» |
| Set variable | «Realizar acción» |

No hay decisión con IA ni `…/resume`. El superagente se arma en el panel, no por la API.

### Tu código, en tu servidor

Si tu workflow o tu agente era código, córrelo en tu servidor:

1. Escucha `message.received` y responde `2xx` enseguida. Corre el modelo aparte.
2. Guarda el estado y la memoria de cada contacto (`ctc_…`) en tu base.
3. Contesta con `send-message` ([Paso 3](https://developers-portal.funnelchat.app/docs/desde-kapso/#paso-3)). Pasadas 24 horas, en un número oficial, manda una plantilla.
4. Para pasarle la conversación a una persona, `PUT /api/v1/contacts/{contact}` con `adviser_id` (un `usr_…` de `GET /api/v1/agents`) y deja de contestar.
5. Con `conversation.assigned`, deja de contestar. Con `conversation.closed`, empieza de nuevo.

No dejes un flujo ni un superagente del panel en el mismo número: contestarían los dos.

## Conversaciones y contactos

La conversación es el contacto (`ctc_…`).

| En Kapso | En Funnelchat |
|---|---|
| `GET /whatsapp/conversations` | `GET /api/v1/conversations`, con `deviceId`, `activeConversation` y `advisorId` |
| Cerrar una conversación | `PUT /api/v1/contacts/{contact}` con `{"active_conversation": false}` |
| Asignarla | `PUT /api/v1/contacts/{contact}` con `adviser_id` |
| `GET /whatsapp/contacts` | `GET /api/v1/contacts`, con `phone` (sin `+`) o `name` |
| `POST /whatsapp/contacts` | `POST /api/v1/contacts/update-or-create` |
| `metadata` | Campos personalizados (`custom_fields`, con su `fld_…`) |
| Borrar un contacto | `POST /api/v1/contacts/delete`, con `contactIds` |
| `last_inbound_at` | `GET /api/v1/contacts/{contact}/meta-window?device_id=…` |
| Bandeja embebible, `thread_control` | No hay |

## Formularios

Reescribe cada WhatsApp Flow en el formato de Funnelchat: no acepta el Flow JSON de Meta.

1. Créalo con `POST /api/v1/forms` (`template_key: "blank"` y `device_id`). Escribe sus pantallas (hasta 5) con `PUT /api/v1/forms/{id}`, con la forma de un modelo de `GET /api/v1/forms/templates`.
2. Publícalo con `POST /api/v1/forms/{id}/publish` y súmalo a cada número con `POST /api/v1/forms/{id}/numbers`.
3. Mándalo con `POST /api/v1/contacts/{contact}/message/form`. `form_id` es el `family_id` (`frm_…`), no el `id` de la versión (`frv_…`).
4. La respuesta llega en `whatsapp_form.completed`: `data.answers`, con `key` y `value`.

Los ids de pantallas, preguntas y opciones van sin dígitos. No hay data endpoint: haz ese paso en tu servidor, al recibir la respuesta. Ver [Formularios de WhatsApp](https://developers-portal.funnelchat.app/docs/mas-funciones/whatsapp/#formularios).

## Mapa de funciones

| En Kapso | En Funnelchat |
|---|---|
| Proxy de la API de Meta | Una llamada por tipo de mensaje |
| Customers y setup links | `external_reference` y links de alta por QR |
| Workflows y Kapso Agent | Flujos y superagente del panel, o tu servidor |
| Difusiones por API | Difusiones del panel |
| Inbox | El panel de Funnelchat |
| Funciones en Cloudflare | Tu servidor |
| Sandbox con número real | Sandbox local |
| `@kapso/whatsapp-cloud-api` | `@funnelchat-hq/sdk`, y SDK de PHP y Python |
| `@kapso/cli` | `@funnelchat-hq/cli` |
| `@kapso/n8n-nodes-kapso` | `@funnelchat-hq/n8n-nodes-funnelchat` |
| `agent-skills` | La skill `funnelchat` |
| `@kapso/chat-adapter` | Tu receptor ([ejemplo](https://developers-portal.funnelchat.app/docs/desde-kapso/#ejemplo)) |
| Notificaciones | [Alertas](https://developers-portal.funnelchat.app/docs/mas-funciones/funnelchat/#alertas) |

## Lo que no existe en Funnelchat

- Alta oficial por link, credenciales propias de Meta y una página de alta con tu marca.
- Ubicación, nota de voz, botón con URL, catálogo, carrusel, pagos, llamadas y citar un mensaje.
- Subir archivos y bajar los que te mandan.
- Variables con nombre, y completar encabezado o botones al mandar una plantilla.
- Webhooks por número, con la forma de Meta o en lotes.
- Crear flujos, difusiones o superagentes por la API, y reanudar una ejecución.
- Funciones alojadas, su base de datos, el registro de llamadas y un MCP con tu clave.

Si algo de tu código no está en esta página ni en la [referencia](https://developers-portal.funnelchat.app/docs/referencia/), la API no lo tiene. Que la API responda `2xx` no quiere decir que use un campo de más.

## El corte

Pasa un número a la vez.

| Fase | Qué hacer |
|---|---|
| Preparar | Anota el `phone_number_id`, el `business_account_id` y si es de coexistencia. Exporta de Kapso plantillas, contactos, mensajes, bajas y bloqueados. Mira en `GET /api/v1/me` que tu plan tenga lugar. |
| Piloto | Pasa un número con poco tráfico ([Paso 1](https://developers-portal.funnelchat.app/docs/desde-kapso/#paso-1)). Cuenta el tiempo sin mandar y la revisión de plantillas de Meta. |
| Reconstruir | Pon su `external_reference`. Trae o recrea las plantillas. Carga los contactos con `POST /api/v1/contacts/update-or-create`. |
| Probar | Su `phone_number_id` puede cambiar: actualiza tu tabla. Manda una plantilla a tu teléfono, respóndela y mira los eventos. |
| Apagar Kapso | Borra sus webhooks y quita su acceso al WABA en Meta. Borra el número en Kapso cuando Funnelchat ya manda y recibe. |

> [!WARNING] El historial no se pasa
> Exporta de Kapso lo que necesites antes de cerrar la cuenta. Lo que guarda Meta (nombre visible, calidad, bajas y bloqueos) sigue en Meta.

## Problemas comunes

| Síntoma | Qué hacer |
|---|---|
| `401 unauthenticated` | Manda `Authorization: Bearer`, no `X-API-Key`. |
| `403 permission_denied` | A la clave le falta ese permiso: crea una con esa casilla. |
| `404 not_found` | El id es de otro workspace, o es un id de Kapso. |
| Meta responde `2655093` | El WABA sigue atado a Kapso, por ejemplo por su crédito. |
| Meta responde `2655122` | El número sigue registrado en la Cloud API. |
| Error `131070` | El número sigue en los dos proveedores. |
| `422 window_closed` | Pasaron 24 horas: manda una plantilla. |
| `422 antiblock_duplicate_content` o `antiblock_unanswered_limit` | Junta tus mensajes y espera a que el contacto responda. |
| `422 template_waba_mismatch` | La plantilla es de otro WABA que el número. |
| `415` al mandar un archivo | Manda `file_type`. |
| La firma no coincide | Usa el `secret` completo, con `whsec_`, y el cuerpo crudo. |
| El webhook quedó en `disabled` | Arregla tu servidor y reactívalo con `PUT` y `status: "active"`. |
| El flujo no arrancó | El contacto ya tenía la etiqueta, o usaste `bulk`. |
| `429` | Espera `Retry-After`. |

## Ejemplo completo en Node.js

Un receptor que contesta cada texto. Guarda la función de Node.js de [la firma](https://developers-portal.funnelchat.app/docs/desde-kapso/#firma) como `verificar-firma.js`.

```js
const express = require("express");
const { verificarFirma } = require("./verificar-firma");

const API = "https://api.funnelchat.com/api/v1";
const headers = {
  Authorization: `Bearer ${process.env.FUNNELCHAT_API_KEY}`,
  Accept: "application/json",
  "Content-Type": "application/json",
};

// Kapso: sendTemplate con components. Funnelchat: el tpl_… y las variables del cuerpo.
async function mandarPlantilla({ deviceId, templateId, phone, variables, ref }) {
  const res = await fetch(`${API}/devices/${deviceId}/templates/${templateId}/send-template`, {
    method: "POST",
    headers,
    body: JSON.stringify({ phone, template_variables: { body: variables }, client_reference: ref }),
  });
  const cuerpo = await res.json();
  if (!res.ok) throw new Error(cuerpo.error);
  return cuerpo.message.id; // msg_…, en cola
}

// Kapso: sendText con to = message.from. Funnelchat: el contacto y el número del evento.
async function contestar({ deviceId, contactId, text }) {
  const res = await fetch(`${API}/message/send-message`, {
    method: "POST",
    headers,
    body: JSON.stringify({ device_id: deviceId, contact_id: contactId, text }),
  });
  if (!res.ok) console.error("no salió", res.status, (await res.json()).error);
}

const app = express();
const vistos = new Set(); // en producción, en tu base

// express.raw, no express.json: la firma es de los bytes que llegaron.
app.post("/funnelchat", express.raw({ type: "application/json" }), (req, res) => {
  const firma = req.get("X-Funnelchat-Signature");
  if (!verificarFirma(req.body, firma, process.env.FUNNELCHAT_WEBHOOK_SECRET)) {
    return res.sendStatus(400);
  }
  const evento = JSON.parse(req.body.toString("utf8"));
  res.sendStatus(200);
  if (vistos.has(evento.id)) return;
  vistos.add(evento.id);

  const d = evento.data;
  if (evento.type === "message.received" && d.device_id === process.env.FUNNELCHAT_DEVICE_ID) {
    if (d.message.type === "text") {
      contestar({ deviceId: d.device_id, contactId: d.contact.id, text: `Recibido: ${d.message.text}` });
    }
  }
  if (evento.type === "message.status_changed" && d.status === "failed") {
    console.error("falló", d.message_id, d.client_reference, d.error);
  }
});

app.listen(3000);
```

## ¿Necesitas ayuda?

- [Mandar mensajes](https://developers-portal.funnelchat.app/docs/mandar-mensajes/) y [webhooks](https://developers-portal.funnelchat.app/docs/webhooks/)
- [Referencia de la API](https://developers-portal.funnelchat.app/docs/referencia/)
- [Construir con IA](https://developers-portal.funnelchat.app/docs/herramientas/): los SDK, el CLI, el sandbox y la skill `funnelchat` para tu asistente de IA

## Índice de temas: lo que viene después del primer uso

Lo que la API hace además del primer uso, en dos partes. Cada tema tiene su propio texto, con sus llamadas (permiso, campos, respuestas y errores) y sus eventos con su ejemplo: lee solo el del tema que la persona necesita, no todos.

### Funciones de WhatsApp

La página, con lo que dice cada tema y sin el detalle de cada llamada: [Funciones de WhatsApp](https://developers-portal.funnelchat.app/ia/mas-funciones/whatsapp.md).

- [Administrar tus números](https://developers-portal.funnelchat.app/ia/mas-funciones/whatsapp/administrar-tus-numeros.md): Mira, edita, desconecta o borra tus números, conéctalos por QR desde tu sistema, revisa su salud, su historial de conexión y su cola de mensajes, y entérate cuando algo cambia.
- [Atender una conversación](https://developers-portal.funnelchat.app/ia/mas-funciones/whatsapp/atender-una-conversacion.md): Respóndele a un contacto por su id, marca como leído lo que te escribió, muestra «escribiendo…», reacciona a sus mensajes, reenvía un mensaje y compártele una tarjeta de contacto.
- [Grupos y sus acciones](https://developers-portal.funnelchat.app/ia/mas-funciones/whatsapp/grupos-y-acciones.md): Ve los grupos de tu workspace y sus participantes, crea grupos, suma y saca personas, cambia sus datos y su link, responde a las solicitudes para unirse y entérate de lo que pasa adentro.
- [Plantillas de Meta](https://developers-portal.funnelchat.app/ia/mas-funciones/whatsapp/plantillas.md): Crea, revisa y edita tus plantillas de WhatsApp, mira sus métricas, bórrala de un número y entérate cuando Meta cambia su estado.
- [Formularios de WhatsApp](https://developers-portal.funnelchat.app/ia/mas-funciones/whatsapp/formularios.md): Arma tus formularios de WhatsApp, publícalos en tus números oficiales, mándaselos a tus contactos, cámbialos con versiones nuevas y lee sus respuestas y sus métricas.
- [Conversions API](https://developers-portal.funnelchat.app/ia/mas-funciones/whatsapp/conversions-api.md): Prepara y prueba la conexión de tus números oficiales con la Conversions API de Meta: el dataset de cada cuenta de WhatsApp Business y su estado.
- [Costos de WhatsApp y cuentas de Meta](https://developers-portal.funnelchat.app/ia/mas-funciones/whatsapp/costos-y-cuentas-de-meta.md): Mira cuánto te cuesta WhatsApp en un mes y las cuentas de WhatsApp Business de tus números oficiales, con su límite de mensajes por día.

### Funciones de Funnelchat

La página, con lo que dice cada tema y sin el detalle de cada llamada: [Funciones de Funnelchat](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat.md).

- [Contactos y conversaciones](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/contactos-y-conversaciones.md): Busca tus contactos y los de cada número, créalos o actualízalos por su teléfono, edítalos o bórralos, mira su ventana de 24 horas, lee y cuenta tus conversaciones, márcalas todas como leídas o no leídas y entérate cuando algo cambia.
- [Etiquetas y campos personalizados](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/etiquetas-y-campos.md): Ve, arma y borra tus etiquetas y tus campos personalizados, agrégales o quítales etiquetas a tus contactos, guárdales tus propios datos y entérate cuando un contacto recibe o pierde una etiqueta.
- [Notas de un contacto](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/notas.md): Lee las notas que tu equipo dejó sobre un contacto, agrega una nueva o borra la que ya no sirve.
- [Tableros](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/tableros.md): Arma tus tableros y sus etapas, mira qué contactos hay en cada etapa, muévelos o sácalos, y entérate cada vez que un contacto cambia de etapa.
- [Tickets](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/tickets.md): Abre tickets sobre tus contactos, dáselos a alguien de tu equipo, edítalos, ciérralos y vuelve a abrirlos.
- [Respuestas rápidas](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/respuestas-rapidas.md): Mira las respuestas rápidas de tu equipo, crea nuevas, edítalas o bórralas.
- [Automatizaciones y carpetas de flujos](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/automatizaciones.md): Mira tus flujos y sus pasos, qué automatizaciones se corrieron sobre un contacto y quiénes están en curso o pausados en cada flujo, cancela una ejecución, pausa las automatizaciones de un contacto, ordena tus flujos en carpetas y entérate cuando una termina o falla.
- [Difusiones](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/difusiones.md): Mira tus difusiones, a quién llegan, sus estadísticas, su costo y el resultado con cada contacto, cancela una que quedó pausada, borra una que todavía no salió y ordénalas en carpetas.
- [Campañas de grupos](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/campanas.md): Mira tus campañas de grupos, sus grupos, quién entra y quién sale, y cómo van sus pipelines y planes de operación.
- [Envíos programados](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/envios-programados.md): Mira tus envíos programados a grupos, sus grupos, cómo salió cada uno en cada grupo, cada vez que salió uno que se repite, cuántos lo leyeron y qué respondieron, y entérate cuando termina o falla.
- [Estadísticas de tus grupos](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/estadisticas.md): Mira cuántas personas entran y salen de tus grupos y campañas, cuántas están activas, tus grupos por estado, los clics en tus links y de qué países son.
- [Puntaje de tus contactos](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/puntaje.md): Mira el puntaje de tus contactos y cómo se reparte, ajusta el de uno y configura cómo se calcula.
- [Ventas](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/ventas.md): Mira las ventas que registran tus plataformas de pagos, sus métricas, el embudo de conversaciones a compras, las ventas por plataforma y los productos de cada una.
- [Dominios propios](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/dominios-propios.md): Usa un dominio tuyo, como `go.mimarca.com`, para el servicio de redirección de Funnelchat: lo registras, creas en tu DNS los registros que te indica, lo verificas y lo borras cuando ya no lo usas.
- [Tu cuenta y tu equipo](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/cuenta-y-equipo.md): Mira tu cuenta y su plan, tu consumo de contactos activos y las personas de tu equipo, y entérate de tus cobros, tu suscripción y tu límite de contactos activos.
- [Alertas](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/alertas.md): Mira las alertas de tu operación y los teléfonos y webhooks que las reciben, elige qué alerta le llega a cada uno, y configura el horario de silencio y el reporte diario.
- [Más sobre tus webhooks](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/mas-webhooks.md): Mira uno de tus webhooks y sus entregas, edítalo o páusalo y consulta los tipos de evento que hay.
