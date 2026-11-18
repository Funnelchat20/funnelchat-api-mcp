# Mandar un texto y saber si lo leyeron — receta de la API de Funnelchat

> https://developers-portal.funnelchat.app/ia/recetas/saber-si-leyeron-un-texto.md. Manda un texto a un teléfono con tu referencia, entérate por webhook de cada cambio de estado hasta «leído» y sabe cuándo dejar de esperar.

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

1. **Una sola vez, el webhook.** `POST /api/v1/webhooks` con
   `{"url": "https://tu-sistema.example/funnelchat", "events": ["message.status_changed"]}`. Pide
   **Avisos (webhooks) → Administrar** y, por ser un evento de mensajes, **Contactos y conversaciones → Ver**. `events`
   no tiene comodín: nombra cada evento. Guarda el `secret` de la respuesta (`201`): aparece solo esa vez.
2. **Pruébalo.** `POST /api/v1/webhooks/{id}/test` manda una entrega `webhook.test`, firmada igual que una real, y
   responde si tu servidor contestó `2xx`.
3. **Manda el texto.** `POST /api/v1/message/send-message` (**Contactos y conversaciones → Enviar**) con
   `{"device_id": "dev_Ac7Ku7iIZDXJTjdCu0UB1mX", "phone": "5491122334455", "text": "Tu pedido salió", "client_reference": "pedido-8841"}`.
   `phone` va con código de país y no hace falta crear el contacto antes. `client_reference` es tuyo: de 1 a 64
   caracteres visibles, sin espacios ni datos personales. La respuesta `200` trae `message.id`, `message.contact_id` y
   `status: "queued"`: **en cola no es enviado**. Guarda los dos ids con tu referencia.
4. **Cada cambio llega** como `message.status_changed`: `data.message_id`, `data.contact_id`, `data.status`,
   `data.previous_status` y tu `data.client_reference`. Verifica la firma antes de leerlo y responde `2xx` enseguida.
5. **Sin webhook** (o para confirmar): `GET /api/v1/contacts/{contact}/messages/{message}` con los dos ids del paso 3
   devuelve el mensaje con su `status` (**Contactos y conversaciones → Ver**). Si consultas así, espera unos segundos
   entre consulta y consulta.

## Qué significa cada estado

| `status` | Qué significa | ¿Puede cambiar? | ¿Llega `message.status_changed`? |
|---|---|---|---|
| `queued` | En cola: todavía no se envió. Es el de la respuesta del envío. | Sí: a `sent` o `failed`. Si su envío no empieza dentro de la hora, ya no sale. | No |
| `sent` | Enviado. | Sí: a `delivered`, `read` o `failed`. | Sí |
| `delivered` | Entregado en el teléfono. | Sí: a `read`. | Sí |
| `read` | Leído. Es el más avanzado. | No. | Sí |
| `failed` | No salió o el proveedor lo rechazó. `error.code` y `error.title` son del proveedor; si lo decidió Funnelchat, `error.reason` dice por qué (`window_closed`, `insufficient_balance`, `device_unavailable`, `recipient_unreachable`, `template_not_found`, `template_unresolved_placeholder`, `not_queued` o `not_sent`). | No. | Sí |
| `null` (en la consulta) | Resultado desconocido: el proveedor no confirmó ni rechazó, el envío se cortó o pasó más de una hora en cola. Puede haber llegado. | No (salvo `failed` con `not_sent` si el envío llega tarde). | No |

- **Deja de esperar** con `read`, `failed` o `null`. Cada estado llega una sola vez por mensaje; si cambian varios
  juntos, llega el más avanzado.
- **No reenvíes un mensaje `queued`**: lo duplicarías. Reintentar es un envío nuevo.
- **Si el envío responde `500` o se corta la red**, no lo repitas enseguida: si salió, su `message.status_changed`
  llega con tu `client_reference`. Hoy no hay una búsqueda de mensajes por `client_reference`.

## El receptor (Node.js 18 o más nuevo, con Express)

```js
const express = require('express');
const { verificarFirma } = require('./verificar-firma'); // la función de abajo, en su propio archivo
const app = express();

app.post('/funnelchat', express.raw({ type: 'application/json' }), (req, res) => {
  if (!verificarFirma(req.body, req.get('X-Funnelchat-Signature'), process.env.FUNNELCHAT_WEBHOOK_SECRET)) {
    return res.sendStatus(400);
  }
  const evento = JSON.parse(req.body.toString('utf8'));
  res.sendStatus(200); // responde enseguida; procesa después
  if (evento.type === 'message.status_changed') {
    const { message_id, status, client_reference, error } = evento.data;
    guardarEstado(message_id, client_reference, status, error); // descarta repetidos por evento.id
  }
});
app.listen(3000);
```

`verificar-firma.js`, probada contra la fórmula de la firma:

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

## El detalle de cada llamada y cada evento

- `POST /api/v1/webhooks` (Crear un webhook): https://developers-portal.funnelchat.app/ia/webhooks/crear-un-webhook.md
- `POST /api/v1/webhooks/{id}/test` (Probar un webhook): https://developers-portal.funnelchat.app/ia/webhooks/probar-un-webhook.md
- `POST /api/v1/message/send-message` (Mandar un mensaje): https://developers-portal.funnelchat.app/ia/referencia/mensajes/mandar-un-mensaje.md
- `GET /api/v1/contacts/{contact}/messages/{message}` (Ver un mensaje): https://developers-portal.funnelchat.app/ia/referencia/mensajes/ver-un-mensaje.md
- `message.status_changed`: https://developers-portal.funnelchat.app/ia/webhooks.md
- `webhook.test`: https://developers-portal.funnelchat.app/ia/webhooks.md

## Las demás recetas y temas

El índice está en https://developers-portal.funnelchat.app/llms.txt: lee solo lo que necesitas.
