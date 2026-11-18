# Preguntar con botones y saber cuál tocó — receta de la API de Funnelchat

> https://developers-portal.funnelchat.app/ia/recetas/pregunta-con-botones.md. Manda una pregunta con hasta 3 botones (o una lista de hasta 10 opciones) por un número oficial o por QR, y reconoce en el webhook cuál tocó el contacto.

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

1. **Una sola vez, el webhook** con `message.received` (`POST /api/v1/webhooks`; pide
   **Avisos (webhooks) → Administrar** y **Contactos y conversaciones → Ver**).
2. **El contacto.** La pregunta va por la ruta del contacto, así que necesitas su `id` (`ctc_…`). Si te escribió, es
   `data.contact.id` de su `message.received`; si solo tienes el teléfono,
   `POST /api/v1/contacts/update-or-create` con `{"phone": "5491122334455"}` (**Contactos y conversaciones → Editar**)
   responde el contacto (`201` si lo creó, `200` si ya existía, sin cambiarle nada más).
3. **La pregunta.** `POST /api/v1/contacts/{contact}/message` (**Contactos y conversaciones → Enviar**) con
   ```json
   {
     "device_id": "dev_Ac7Ku7iIZDXJTjdCu0UB1mX",
     "contact_id": "ctc_ABsza6Ialu1BCUyPFZ8WJvV",
     "text": "¿Confirmas tu turno del martes a las 10?",
     "options": [
       {"id": "si", "label": "Sí, confirmo"},
       {"id": "no", "label": "No puedo"},
       {"id": "humano", "label": "Hablar con alguien"}
     ]
   }
   ```
   - `text` es la pregunta. `options` lleva de 1 a 10 opciones `{id, label}`: **de 1 a 3 salen como botones; de 4 a
     10, como una lista** para elegir.
   - La etiqueta se recorta a 20 caracteres en un botón y a 24 en una lista: escríbelas cortas y distintas entre sí.
   - Funciona por un número oficial y por uno conectado por QR. Por uno oficial, fuera de las 24 horas desde el último
     mensaje del contacto responde `422 window_closed`: ahí solo sale una plantilla aprobada (con sus propios botones,
     creados en la plantilla).
   - `contact_id` del cuerpo tiene que ser el de la ruta. `POST /api/v1/message/send-message` no acepta `options`.
4. **El toque.** Llega un `message.received` del mismo contacto con **la etiqueta tocada en `data.message.text`** (tal
   como salió, recortada si era larga). El `id` de la opción no viene: guarda, por pregunta, qué `id` es cada etiqueta.

## Qué `data.message.type` llega

Según el número y cómo respondió el contacto, uno de estos:

| `type` | Cuándo |
|---|---|
| `interactive` | Tocó un botón o eligió una opción de la lista de una pregunta con `options`. |
| `template_button_reply` | Tocó un botón de una plantilla. |
| `button` | Un botón con el formato anterior de WhatsApp. |
| `text` | Escribió en vez de tocar: compara el texto igual, sin distinguir mayúsculas. |

Decide por `data.message.text`, no por `type`: así reconoces también a quien escribe la opción a mano.

## En código (Node.js 18 o más nuevo)

```js
const opciones = [{ id: 'si', label: 'Sí, confirmo' }, { id: 'no', label: 'No puedo' }, { id: 'humano', label: 'Hablar con alguien' }];
const recorte = opciones.length <= 3 ? 20 : 24;
const porEtiqueta = new Map(opciones.map((o) => [o.label.slice(0, recorte).toLowerCase(), o.id]));

// En tu receptor de message.received (con la firma ya verificada):
function opcionTocada(evento) {
  const texto = (evento.data.message.text ?? '').trim().toLowerCase();
  return porEtiqueta.get(texto) ?? null; // 'si', 'no', 'humano' o null (escribió otra cosa)
}
```

## El detalle de cada llamada y cada evento

- `POST /api/v1/webhooks` (Crear un webhook): https://developers-portal.funnelchat.app/ia/webhooks/crear-un-webhook.md
- `POST /api/v1/contacts/update-or-create` (Crear o actualizar un contacto): https://developers-portal.funnelchat.app/ia/referencia/contactos/crear-o-actualizar-un-contacto.md
- `POST /api/v1/contacts/{contact}/message` (Mandar un mensaje a un contacto): https://developers-portal.funnelchat.app/ia/referencia/atender-una-conversacion/mandar-un-mensaje-a-un-contacto.md
- `POST /api/v1/message/send-message` (Mandar un mensaje): https://developers-portal.funnelchat.app/ia/referencia/mensajes/mandar-un-mensaje.md
- `message.received`: https://developers-portal.funnelchat.app/ia/webhooks.md

## Las demás recetas y temas

El índice está en https://developers-portal.funnelchat.app/llms.txt: lee solo lo que necesitas.
