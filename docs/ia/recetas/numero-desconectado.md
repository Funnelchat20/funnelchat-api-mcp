# Enterarte de que un número se cayó y reconectarlo — receta de la API de Funnelchat

> https://developers-portal.funnelchat.app/ia/recetas/numero-desconectado.md. Recibe por webhook cuándo un número se desconecta y por qué, decide según el motivo si se reconecta, pide el link de reconexión y entérate cuando vuelve.

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

## Las llamadas, en orden

1. **Una sola vez, el webhook** con `device.disconnected` y `device.connected` (`POST /api/v1/webhooks`; pide
   **Avisos (webhooks) → Administrar** y **Números de WhatsApp → Ver**).
2. **Cuando se cae**, llega `device.disconnected` con `data.device` (`id`, `name`, `number`, `connection` —`qr`,
   `coexistence` o `dedicated`— y tu `external_reference`), `data.disconnected_at`, `data.reason` y
   `data.connect_link_id`. Decide con la tabla de abajo.
3. **Antes de reconectar, confírmalo.** `GET /api/v1/devices/{device}` (**Números de WhatsApp → Ver**): si `connected`
   ya volvió a `1`, no hagas nada.
4. **Reconectar** es un link de alta con el `device_id`: `POST /api/v1/connect-links` con
   `{"type": "qr", "device_id": "dev_Ac7Ku7iIZDXJTjdCu0UB1mX"}` (**Números de WhatsApp → Crear, conectar y borrar**). No
   ocupa otro lugar del plan y anula los links de reconexión anteriores de ese número. Dale la `url` (aparece solo en
   esa respuesta) a quien tiene el celular: la abre en otra pantalla, toca el botón y escanea el QR en 10 minutos.
5. **Cuando vuelve**, llega `device.connected` con el mismo `data.device.id`.

## Qué hacer según el motivo

| `reason` | Qué pasó | Qué hacer |
|---|---|---|
| `qr_logged_out` | Se cerró la sesión de un número por QR: desde el celular, por WhatsApp, o alguien lo desconectó a propósito desde el panel o con `POST /api/v1/devices/{device}/clean`. | Pregúntale a la persona antes de reconectar: puede haber sido a propósito. Si quiere, paso 4. |
| `shadow_ban_protection` | Funnelchat lo desconectó para protegerlo de un posible bloqueo de WhatsApp. | **No lo reconectes solo.** Cuéntaselo a la persona y que decida ella. |
| `disconnected_by_user` | Alguien de la cuenta desconectó o borró los datos de un número oficial. | Fue a propósito: no lo reconectes. |
| `meta_account_not_registered` | Un número oficial dejó de estar registrado en Meta y no se pudo volver a registrar solo. | Reconectar uno oficial pide un link `"type": "meta"` con su `allowed_connection_types`, y el alta oficial por link hoy responde `503 meta_connect_disabled`: dile a la persona que lo revise desde el panel de Funnelchat. |
| `unknown` | No se sabe por qué. | Confírmalo (paso 3) y pregúntale a la persona antes de reconectar. |

- **Nunca reconectes en un bucle**: un link por desconexión, y solo con un motivo que lo permita.
- `POST /api/v1/devices/{device}/clean` desconecta un número a propósito y **no se puede deshacer**: no lo uses para
  «probar» la reconexión.
- **Para probar tu receptor sin tirar un número**, el sandbox (`npx @funnelchat-hq/sandbox`) dispara el evento con
  `POST /_sandbox/devices/{id}/disconnect` y `{"reason": "shadow_ban_protection"}`. `POST /api/v1/webhooks/{id}/test`
  solo manda `webhook.test`.

## En código (Node.js 18 o más nuevo; en tu receptor, con la firma ya verificada)

```js
const SIN_RECONECTAR = new Set(['shadow_ban_protection', 'disconnected_by_user', 'meta_account_not_registered']);

async function alDesconectarse(evento, preguntarALaPersona) {
  const { device, reason } = evento.data;
  const r = await fetch(`https://api.funnelchat.com/api/v1/devices/${device.id}`, {
    headers: { Authorization: `Bearer ${process.env.FUNNELCHAT_API_KEY}`, Accept: 'application/json' },
  });
  const actual = await r.json();
  if ((actual.data ?? actual).connected === 1) return; // ya volvió
  if (SIN_RECONECTAR.has(reason)) return preguntarALaPersona(device, reason, false);
  if (device.connection !== 'qr') return preguntarALaPersona(device, reason, false);
  if (!(await preguntarALaPersona(device, reason, true))) return; // qr_logged_out o unknown: ¿lo reconecto?
  const link = await fetch('https://api.funnelchat.com/api/v1/connect-links', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.FUNNELCHAT_API_KEY}`, Accept: 'application/json', 'Content-Type': 'application/json',
               'Idempotency-Key': `reconectar-${device.id}-${evento.id}` },
    body: JSON.stringify({ type: 'qr', device_id: device.id }),
  });
  return (await link.json()).data.url; // dásela solo a quien tiene el celular
}
```

## El detalle de cada llamada y cada evento

- `POST /api/v1/webhooks` (Crear un webhook): https://developers-portal.funnelchat.app/ia/webhooks/crear-un-webhook.md
- `GET /api/v1/devices/{device}` (Ver un número): https://developers-portal.funnelchat.app/ia/referencia/numeros/ver-un-numero.md
- `POST /api/v1/connect-links` (Conectar un número): https://developers-portal.funnelchat.app/ia/referencia/numeros/conectar-un-numero.md
- `POST /api/v1/devices/{device}/clean` (Desconectar un número): https://developers-portal.funnelchat.app/ia/referencia/numeros/desconectar-un-numero.md
- `POST /api/v1/webhooks/{id}/test` (Probar un webhook): https://developers-portal.funnelchat.app/ia/webhooks/probar-un-webhook.md
- `device.disconnected`: https://developers-portal.funnelchat.app/ia/webhooks.md
- `device.connected`: https://developers-portal.funnelchat.app/ia/webhooks.md
- `webhook.test`: https://developers-portal.funnelchat.app/ia/webhooks.md

## Las demás recetas y temas

El índice está en https://developers-portal.funnelchat.app/llms.txt: lee solo lo que necesitas.
