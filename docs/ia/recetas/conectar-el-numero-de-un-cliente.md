# Darle a un cliente un link para conectar su número — receta de la API de Funnelchat

> https://developers-portal.funnelchat.app/ia/recetas/conectar-el-numero-de-un-cliente.md. Mira si tu cliente ya tiene un número, anula el link que le quedó pendiente, crea uno nuevo que puedes reintentar sin duplicarlo y entérate por webhook cuando se conecta.

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

Con tu propia referencia del cliente (en el ejemplo, `cliente-42`) en `external_reference`, cada paso sabe qué es de quién.

1. **Una sola vez, el webhook.** `POST /api/v1/webhooks` con
   `{"url": "https://tu-sistema.example/funnelchat", "events": ["device.connected", "device.disconnected"]}`. Pide
   **Avisos (webhooks) → Administrar** y, por ser eventos de números, **Números de WhatsApp → Ver**. Guarda el `secret`
   de la respuesta (`201`): aparece solo esa vez. Si ya tienes un webhook, agrégale los eventos en vez de crear otro.
2. **¿Ya tiene un número?** `GET /api/v1/devices?external_reference=cliente-42` (**Números de WhatsApp → Ver**;
   `external_reference` filtra por igualdad exacta). Si trae uno con `connected` en `1`, ya está conectado: guarda su
   `id` (el `device_id` de las demás llamadas) y no crees un link. Si trae uno con `connected` en `0`, reconéctalo (paso
   4, con `device_id`): no sumes otro.
3. **¿Le quedó un link pendiente?** `GET /api/v1/connect-links?external_reference=cliente-42&status=pending`. Anula
   cada uno con `DELETE /api/v1/connect-links/{link}` (**Números de WhatsApp → Crear, conectar y borrar**): un link
   pendiente sigue sirviendo para conectar un número a tu cuenta, cada workspace puede tener hasta 20
   (`429 too_many_open_links`) y, si la página ya había creado un número sin conectar, la anulación lo borra.
4. **El link nuevo.** `POST /api/v1/connect-links` (**Números de WhatsApp → Crear, conectar y borrar**) con la cabecera
   `Idempotency-Key` y uno de estos cuerpos:
   - su número por QR: `{"type": "qr", "external_reference": "cliente-42", "return_url": "https://tu-sistema.example/conectado"}`;
   - reconectar el que ya tiene: `{"type": "qr", "device_id": "dev_Ac7Ku7iIZDXJTjdCu0UB1mX"}` (no ocupa otro lugar
     del plan y anula los links de reconexión anteriores de ese número).

   La respuesta `201` trae en `data` el `id` del link y su `url`: **la única vez que aparece la URL**. Dásela solo a tu
   cliente. Si la llamada falla por la red o con un `5xx`, repítela con la misma `Idempotency-Key` y el mismo cuerpo:
   dentro de las 24 horas devuelve el mismo link en vez de crear otro.

5. **Tu cliente abre la URL** en una pantalla que no sea la del celular que va a conectar y toca el botón: desde ahí
   tiene 10 minutos para escanear el QR en WhatsApp › **Dispositivos vinculados** (si no, el link queda `failed` con
   `qr_timeout` y hay que pedir otro).
6. **Te enteras** por `device.connected`: `data.device.id` es el número, `data.device.external_reference` es tu
   referencia y `data.connect_link_id`, el link. La `return_url` recibe el resultado en la query string, pero úsala
   solo para la pantalla: confirma con el webhook o con el paso 2. Si después se cae, llega `device.disconnected`
   (receta «Enterarte de que un número se cayó y reconectarlo»).

## En código (Node.js 18 o más nuevo)

```js
const BASE = 'https://api.funnelchat.com';
const H = { Authorization: `Bearer ${process.env.FUNNELCHAT_API_KEY}`, Accept: 'application/json', 'Content-Type': 'application/json' };
const filas = (x) => (Array.isArray(x) ? x : x.data); // un listado viene por páginas, en `data`
async function api(metodo, ruta, cuerpo, extra = {}) {
  const r = await fetch(BASE + ruta, { method: metodo, headers: { ...H, ...extra }, body: cuerpo && JSON.stringify(cuerpo) });
  const datos = r.status === 204 ? null : await r.json();
  if (!r.ok) throw Object.assign(new Error(datos?.error ?? String(r.status)), { status: r.status, datos });
  return datos;
}

async function linkParaConectar(cliente, intento) {
  const ref = encodeURIComponent(cliente);
  const numeros = filas(await api('GET', `/api/v1/devices?external_reference=${ref}`));
  const conectado = numeros.find((n) => n.connected === 1);
  if (conectado) return { yaConectado: conectado.id };
  for (const link of filas(await api('GET', `/api/v1/connect-links?external_reference=${ref}&status=pending`))) {
    await api('DELETE', `/api/v1/connect-links/${link.id}`);
  }
  const cuerpo = numeros[0] ? { type: 'qr', device_id: numeros[0].id } : { type: 'qr', external_reference: cliente };
  const { data } = await api('POST', '/api/v1/connect-links', cuerpo, { 'Idempotency-Key': `alta-${cliente}-${intento}` });
  return { linkId: data.id, url: data.url }; // la url, solo para tu cliente
}
```

`intento` es tuyo: el mismo al reintentar la misma alta, otro para una alta nueva.

## Lo que puede responder

- `403 numbers_not_included` (el plan no incluye números), `403 number_limit_reached` (no queda lugar),
  `403 connect_not_allowed` (quien llama no es el titular de la cuenta) y `402 payment_required` (pago vencido):
  reintentar no sirve, díselo a la persona.
- `422 invalid_reference_device` (el `device_id` no es de la cuenta) y `422 connection_type_mismatch` (el `type` no es
  el del número: `qr` para uno por QR).
- `503 meta_connect_disabled` con `type: "meta"`: el alta de números oficiales por link (también el número de EE. UU.)
  no está habilitada en este momento. Por QR sí se puede.

## El detalle de cada llamada y cada evento

- `POST /api/v1/webhooks` (Crear un webhook): https://developers-portal.funnelchat.app/ia/webhooks/crear-un-webhook.md
- `GET /api/v1/devices` (Ver tus números): https://developers-portal.funnelchat.app/ia/referencia/numeros/ver-tus-numeros.md
- `GET /api/v1/connect-links` (Ver tus links de alta): https://developers-portal.funnelchat.app/ia/referencia/numeros/ver-tus-links-de-alta.md
- `DELETE /api/v1/connect-links/{link}` (Anular un link de alta): https://developers-portal.funnelchat.app/ia/referencia/numeros/anular-un-link-de-alta.md
- `POST /api/v1/connect-links` (Conectar un número): https://developers-portal.funnelchat.app/ia/referencia/numeros/conectar-un-numero.md
- `device.connected`: https://developers-portal.funnelchat.app/ia/webhooks.md
- `device.disconnected`: https://developers-portal.funnelchat.app/ia/webhooks.md

## Las demás recetas y temas

El índice está en https://developers-portal.funnelchat.app/llms.txt: lee solo lo que necesitas.
