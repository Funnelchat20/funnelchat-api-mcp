# Lo básico — API de Funnelchat: contexto para tu IA

> https://developers-portal.funnelchat.app/ia/lo-basico.md. Lo que vale para toda la API, una sola vez: cada texto de un tema, cada receta y cada llamada lo nombra en vez de repetirlo.

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

| Evento | Cuándo llega | Permiso para recibirlo |
|---|---|---|
| `message.received` | Alguien le escribe a uno de tus números. | **Contactos y conversaciones → Ver** |
| `message.status_changed` | Un mensaje que mandaste cambia de estado: enviado, entregado, leído o falló. | **Contactos y conversaciones → Ver** |
| `message.reaction_failed` | Una reacción que pediste no se pudo aplicar. | **Contactos y conversaciones → Ver** |
| `template.status_changed` | Cambia el estado de aprobación de una de tus plantillas en Meta: por ejemplo, la aprueba o la rechaza. | **Contactos y conversaciones → Ver** |
| `broadcast.finished` | Una de tus difusiones termina: enviada, fallida o con fallos parciales. | **Contactos y conversaciones → Ver** |
| `broadcast.paused` | Una de tus difusiones se pausa sola, por ejemplo porque bajó la calidad del número. | **Contactos y conversaciones → Ver** |
| `device.connected` | Uno de tus números queda conectado. | **Números de WhatsApp → Ver** |
| `device.disconnected` | Uno de tus números pierde la conexión. | **Números de WhatsApp → Ver** |
| `device.deleted` | Se borra uno de tus números y libera su lugar en tu plan. | **Números de WhatsApp → Ver** |
| `device.health_changed` | Cambia el estado de envío de uno de tus números oficiales, según Meta. | **Números de WhatsApp → Ver** |
| `device.quality_changed` | Meta cambia la calidad de uno de tus números oficiales. | **Números de WhatsApp → Ver** |
| `device.messaging_limit_changed` | Meta cambia el límite de mensajes por día de uno de tus números oficiales. | **Números de WhatsApp → Ver** |
| `device.display_name_reviewed` | Meta aprueba o rechaza el nombre visible de uno de tus números oficiales. | **Números de WhatsApp → Ver** |
| `group_participant.joined` | Alguien entra a un grupo que sigues. | **Grupos y campañas → Ver** |
| `group_participant.left` | Alguien sale de un grupo que sigues. | **Grupos y campañas → Ver** |
| `group.message_received` | Alguien escribe en un grupo que sigues. | **Grupos y campañas → Ver** |
| `group.reaction_added` | Alguien reacciona a un mensaje en un grupo que sigues. | **Grupos y campañas → Ver** |
| `poll.voted` | Alguien vota en una encuesta de un grupo, o cambia su voto. | **Grupos y campañas → Ver** |
| `group_join_request.created` | Alguien pide entrar a un grupo oficial que pide aprobación. | **Grupos y campañas → Ver** |
| `group_join_request.revoked` | Alguien retira su pedido para entrar a un grupo antes de que lo aprueben o lo rechacen. | **Grupos y campañas → Ver** |
| `group.created` | Se crea un grupo en una de tus campañas, o se importa a una. | **Grupos y campañas → Ver** |
| `group.full` | Un grupo se llena. | **Grupos y campañas → Ver** |
| `group.blocked` | Un grupo deja de poder operar: sin administrador conectado, con el link de invitación inválido o suspendido por WhatsApp. | **Grupos y campañas → Ver** |
| `group.recovered` | Un grupo que estaba bloqueado vuelve a operar. | **Grupos y campañas → Ver** |
| `group.invite_link_down` | El link de invitación de un grupo se cae y no se pudo renovar. | **Grupos y campañas → Ver** |
| `group.invite_link_renewed` | Se renueva el link de invitación de un grupo, solo o porque lo pediste. | **Grupos y campañas → Ver** |
| `group_action.completed` | Termina una acción sobre un grupo, como sumar participantes o cambiarle el nombre. | **Grupos y campañas → Ver** |
| `group_action.failed` | Falla entera una acción sobre un grupo. | **Grupos y campañas → Ver** |
| `campaign.status_changed` | Una de tus campañas de grupos se activa o se pausa. | **Grupos y campañas → Ver** |
| `campaign.no_groups_available` | Una de tus campañas no tiene grupos a los que llevar a quien entra por su link. | **Grupos y campañas → Ver** |
| `pipeline.finished` | Termina un pipeline de operaciones sobre grupos. | **Grupos y campañas → Ver** |
| `scheduled_message.finished` | Termina un envío programado a grupos, con su resultado. | **Grupos y campañas → Ver** |
| `scheduled_message.group_delivery_failed` | Un envío programado falla en un grupo. | **Grupos y campañas → Ver** |
| `scheduled_message.response_received` | Alguien responde a un envío programado: vota en una encuesta o responde a un evento de WhatsApp. | **Grupos y campañas → Ver** |
| `daily_report.generated` | Se genera el reporte diario de tu cuenta: clics, entradas y salidas. | **Grupos y campañas → Ver** |
| `contact.created` | Se crea un contacto nuevo. | **Contactos y conversaciones → Ver** |
| `contact.updated` | Cambian el nombre, el email, el teléfono o un campo personalizado de un contacto. | **Contactos y conversaciones → Ver** |
| `contact.tag_added` | Un contacto recibe una etiqueta. | **Contactos y conversaciones → Ver** |
| `contact.tag_removed` | Un contacto pierde una etiqueta. | **Contactos y conversaciones → Ver** |
| `conversation.assigned` | Una conversación queda asignada a una persona de tu equipo o a un agente de IA. | **Contactos y conversaciones → Ver** |
| `conversation.closed` | Una conversación se cierra. | **Contactos y conversaciones → Ver** |
| `contact.stage_changed` | Un contacto entra a un tablero, cambia de etapa o sale. | **Contactos y conversaciones → Ver** |
| `whatsapp_form.completed` | Un contacto completa un formulario de WhatsApp. | **Contactos y conversaciones → Ver** |
| `flow.completed` | Una automatización termina bien para un contacto. | **Contactos y conversaciones → Ver** |
| `flow.failed` | Una automatización termina por un error para un contacto. | **Contactos y conversaciones → Ver** |
| `mac.usage_80` | Llegas al 80 % de tus contactos activos del mes. | **Números de WhatsApp → Ver** |
| `mac.usage_100` | Agotas tus contactos activos del mes: empiezan 24 horas de gracia. | **Números de WhatsApp → Ver** |
| `account.blocked` | Tu cuenta queda bloqueada: pasaron las 24 horas de gracia después de agotar tus contactos activos. | **Números de WhatsApp → Ver** |
| `mac.expiring` | Tienes contactos activos que vencen en los próximos 7 días. | **Números de WhatsApp → Ver** |
| `billing.upcoming_charge` | Faltan unos días para el próximo cobro de tu suscripción. | **Números de WhatsApp → Ver** |
| `billing.payment_failed` | No se pudo cobrar tu suscripción. | **Números de WhatsApp → Ver** |
| `subscription.trial_ending` | Tu prueba termina en 1 a 3 días. | **Números de WhatsApp → Ver** |
| `subscription.cancellation_confirmed` | Se confirma la cancelación de tu suscripción. | **Números de WhatsApp → Ver** |
| `subscription.reactivated` | Se revierte la cancelación que tenías programada: tu suscripción sigue. | **Números de WhatsApp → Ver** |
| `subscription.dormant_ending` | Faltan unos 7 días para que termine el reposo de tu cuenta. | **Números de WhatsApp → Ver** |

Además del permiso para crear el webhook, la clave necesita, por cada evento de `events`, la casilla de su columna; si le falta, crear o editar el webhook responde `422`.

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
