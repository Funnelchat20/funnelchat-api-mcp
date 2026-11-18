# Mandar una imagen o un archivo con texto al pie — receta de la API de Funnelchat

> https://developers-portal.funnelchat.app/ia/recetas/imagen-con-texto-al-pie.md. Manda una imagen, un video o un documento por su URL, con el texto al pie en `text`, a un teléfono o a un contacto, y sabe si llegó.

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

## La llamada

`POST /api/v1/message/send-message` (**Contactos y conversaciones → Enviar**) con

```json
{
  "device_id": "dev_Ac7Ku7iIZDXJTjdCu0UB1mX",
  "phone": "5491122334455",
  "file": "https://cdn.example.com/catalogo/modelo-12.jpg",
  "text": "Este es el modelo que pediste",
  "client_reference": "catalogo-12-lucia"
}
```

- **`text` es el texto al pie** de una imagen, un video o un documento. Estas rutas no tienen `caption`: si lo mandas,
  se descarta sin error y el archivo sale sin pie.
- **`file` es la URL del archivo** (hasta 4096 caracteres; mejor `https://`), que WhatsApp descarga desde ahí:
  tiene que poder bajarse sin credenciales (puede ser una URL firmada) y seguir válida al menos una hora, porque un
  envío puede esperar en cola. No pongas secretos en la ruta.
- **El tipo sale de la extensión de la ruta:** `.jpg`, `.jpeg` y `.png` son `image`; `.mp4` y `.gif`, `video`;
  `.pdf`, `.doc` y `.docx`, `document`; `.mp3`, `.ogg`, `.m4a`, `.aac`, `.opus`, `.oga` y `.wav`, `audio`; `.webp`,
  `sticker`. Si la URL no termina en una de esas (una URL firmada sin extensión, por ejemplo), manda `file_type`
  (`image`, `video`, `audio`, `document` o `sticker`); si no, responde `422` en `file_type`. Un documento sin una
  extensión de la lista necesita además `file_name` (`"factura.xlsx"`).
- **Al contacto que ya tienes**, la misma idea por su ruta: `POST /api/v1/contacts/{contact}/message` con `device_id`,
  `contact_id` (el de la ruta), `file` y `text`.
- Por un número oficial, fuera de las 24 horas desde el último mensaje del contacto responde `422 window_closed` y no
  manda nada.

## Saber si llegó

La respuesta `200` trae el mensaje en `queued`: en cola no es enviado. Funnelchat no abre la URL al recibir la
llamada, así que un archivo que no se puede bajar se conoce después: el mensaje termina `failed` con el error del
proveedor. Entérate por el webhook `message.status_changed` (con tu `client_reference`), como en la receta «Mandar un
texto y saber si lo leyeron».

## En código (Node.js 18 o más nuevo)

```js
async function mandarImagen({ device, telefono, url, pie, referencia }) {
  const r = await fetch('https://api.funnelchat.com/api/v1/message/send-message', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.FUNNELCHAT_API_KEY}`, Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_id: device, phone: telefono, file: url, text: pie, client_reference: referencia }),
  });
  const datos = await r.json();
  if (!r.ok) throw Object.assign(new Error(datos.error), { status: r.status, errores: datos.errors });
  return datos.message; // { id, contact_id, status: 'queued', … }
}
```

## El detalle de cada llamada y cada evento

- `POST /api/v1/message/send-message` (Mandar un mensaje): https://developers-portal.funnelchat.app/ia/referencia/mensajes/mandar-un-mensaje.md
- `POST /api/v1/contacts/{contact}/message` (Mandar un mensaje a un contacto): https://developers-portal.funnelchat.app/ia/referencia/atender-una-conversacion/mandar-un-mensaje-a-un-contacto.md
- `message.status_changed`: https://developers-portal.funnelchat.app/ia/webhooks.md

## Las demás recetas y temas

El índice está en https://developers-portal.funnelchat.app/llms.txt: lee solo lo que necesitas.
