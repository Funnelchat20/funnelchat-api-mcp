# Ver las conversaciones abiertas y el historial de un contacto — receta de la API de Funnelchat

> https://developers-portal.funnelchat.app/ia/recetas/historial-y-conversaciones-abiertas.md. Lista las conversaciones abiertas y cuéntalas, lee bien cada fila (el contacto y su último mensaje) y trae el historial de un contacto por páginas.

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

## Las conversaciones abiertas

1. **Cuántas hay.** `GET /api/v1/conversations/count/open` (**Contactos y conversaciones → Ver**).
2. **Cuáles son.** `GET /api/v1/conversations?activeConversation=1&perPage=100`.
   - **Un booleano de la query va como `1` o `0`.** `activeConversation=true` responde `422`. Lo mismo con
     `unreadMessages`, `favorites` y los demás filtros de sí o no.
   - `activeConversation=1` trae las mismas que cuenta el paso 1. Con `deviceId=dev_…`, solo las de los contactos
     cuyo último número es ese.
   - Van de la más reciente a la más vieja, por cursor: pide la URL de `links.next` tal cual hasta que sea `null`
     (también sirve `meta.next_cursor` en `cursor`). No hay número de página ni `total`: el total es el paso 1.
3. **Cada fila es un contacto con su último mensaje.** El contacto es `contact_id` (`ctc_…`), con `contact_name` y
   `contact_phone`. **`id` es el del último mensaje (`msg_…`), no el del contacto**: para seguir con el contacto, usa
   `contact_id`. La especificación todavía no describe la fila: lee los campos que llegan antes de depender de otro.

## El historial de un contacto

1. `GET /api/v1/contacts/{contactId}/messages?perPage=100`, con el `contact_id` de la fila. Van **del más nuevo al más
   viejo**, por cursor: sigue `links.next` hasta `null`. Cada mensaje trae `id`, `text`, `time`, `file`,
   `client_reference` y `own`, `type` y `status`, que en esta llamada son números que la especificación todavía no
   describe.
2. **Para un mensaje con nombres**, `GET /api/v1/contacts/{contact}/messages/{message}`: `direction` (`inbound`, lo
   recibiste; `outbound`, lo mandaste), `type` (`text`, `image`, `interactive`…) y `status` (`queued`, `sent`,
   `delivered`, `read`, `failed`, o `null` en uno recibido).

- Leer conversaciones y mensajes no tiene tope por minuto; aun así, no pidas páginas en paralelo.
- Para enterarte de lo nuevo sin recorrer todo, usa los webhooks `message.received` y `message.status_changed`
  (recetas «Un bot que contesta cada mensaje» y «Mandar un texto y saber si lo leyeron»).

## En código (Node.js 18 o más nuevo)

```js
const BASE = 'https://api.funnelchat.com';
const H = { Authorization: `Bearer ${process.env.FUNNELCHAT_API_KEY}`, Accept: 'application/json' };
async function* paginas(url) {
  while (url) {
    const r = await fetch(url, { headers: H });
    if (!r.ok) throw new Error(`${r.status} ${(await r.json()).error}`);
    const p = await r.json();
    yield* p.data;
    url = p.links?.next ?? null; // tal cual: ya trae el cursor y los filtros
  }
}

for await (const fila of paginas(`${BASE}/api/v1/conversations?activeConversation=1&perPage=100`)) {
  console.log(fila.contact_id, fila.contact_name, 'último mensaje', fila.id);
}
for await (const m of paginas(`${BASE}/api/v1/contacts/ctc_ABsza6Ialu1BCUyPFZ8WJvV/messages?perPage=100`)) {
  console.log(m.time, m.text);
}
```

## El detalle de cada llamada y cada evento

- `GET /api/v1/conversations` (Ver tus conversaciones): https://developers-portal.funnelchat.app/ia/referencia/conversaciones/ver-tus-conversaciones.md
- `GET /api/v1/conversations/count/open` (Contar las conversaciones abiertas): https://developers-portal.funnelchat.app/ia/referencia/conversaciones/contar-las-conversaciones-abiertas.md
- `GET /api/v1/contacts/{contactId}/messages` (Ver los mensajes con un contacto): https://developers-portal.funnelchat.app/ia/referencia/conversaciones/ver-los-mensajes-con-un-contacto.md
- `GET /api/v1/contacts/{contact}/messages/{message}` (Ver un mensaje): https://developers-portal.funnelchat.app/ia/referencia/mensajes/ver-un-mensaje.md
- `message.received`: https://developers-portal.funnelchat.app/ia/webhooks.md
- `message.status_changed`: https://developers-portal.funnelchat.app/ia/webhooks.md

## Las demás recetas y temas

El índice está en https://developers-portal.funnelchat.app/llms.txt: lee solo lo que necesitas.
