# Un bot que contesta cada mensaje — receta de la API de Funnelchat

> https://developers-portal.funnelchat.app/ia/recetas/bot-que-contesta.md. Recibe cada mensaje que te escriben por webhook, verifica la firma y contesta por el mismo número al mismo contacto, sin contestarte a ti mismo.

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
   `{"url": "https://tu-sistema.example/funnelchat", "events": ["message.received"]}`. Pide
   **Avisos (webhooks) → Administrar** y **Contactos y conversaciones → Ver**. Guarda el `secret` (aparece solo esa
   vez) en `FUNNELCHAT_WEBHOOK_SECRET`.
2. **Cada mensaje que te escriben** llega como `message.received`: `data.message` (`id`, `type`, `text`, `media`),
   `data.contact` (`id`, `name`, `phone`) y `data.device_id`, el número que lo recibió. Solo llega por lo que escribe un
   contacto: **tus propios envíos no lo disparan**, así que el bot no se contesta solo.
3. **Contesta** con `POST /api/v1/message/send-message` (**Contactos y conversaciones → Enviar**) y
   `{"device_id": <data.device_id>, "contact_id": <data.contact.id>, "text": "…"}`: sale por el mismo número al mismo
   contacto. Si `data.device_id` viene `null`, no sabes por qué número contestar: no contestes.
4. **Responde `2xx` enseguida** y contesta después: si tu servidor tarda o falla, la entrega se reintenta. Descarta
   repetidos por el `id` del evento.

- Por un número oficial, contestar dentro de las 24 horas desde que el contacto escribió no necesita plantilla (fuera
  de esa ventana, `422 window_closed`). Por QR no hay ventana.
- `data.message.text` es `null` en un archivo sin texto (mira `data.message.type` y `data.message.media`).

## En código (Node.js 18 o más nuevo, con Express)

```js
const express = require('express');
const { verificarFirma } = require('./verificar-firma'); // la función de abajo
const app = express();
const vistos = new Set();

app.post('/funnelchat', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!verificarFirma(req.body, req.get('X-Funnelchat-Signature'), process.env.FUNNELCHAT_WEBHOOK_SECRET)) {
    return res.sendStatus(400);
  }
  const evento = JSON.parse(req.body.toString('utf8'));
  res.sendStatus(200);
  if (evento.type !== 'message.received' || vistos.has(evento.id)) return;
  vistos.add(evento.id);
  const { message, contact, device_id } = evento.data;
  if (!device_id || !message.text) return;
  const r = await fetch('https://api.funnelchat.com/api/v1/message/send-message', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.FUNNELCHAT_API_KEY}`, Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_id, contact_id: contact.id, text: `Recibido: ${message.text}`, client_reference: `eco-${message.id}` }),
  });
  if (!r.ok) console.error('no se pudo contestar', r.status, (await r.json()).error);
});
app.listen(3000);
```

`vistos` vive en memoria: en producción guarda los `id` de evento en tu base. `verificar-firma.js`:

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
- `POST /api/v1/message/send-message` (Mandar un mensaje): https://developers-portal.funnelchat.app/ia/referencia/mensajes/mandar-un-mensaje.md
- `message.received`: https://developers-portal.funnelchat.app/ia/webhooks.md

## Las demás recetas y temas

El índice está en https://developers-portal.funnelchat.app/llms.txt: lee solo lo que necesitas.
