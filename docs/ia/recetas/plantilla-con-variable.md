# Crear una plantilla con variables y enterarte de su aprobación — receta de la API de Funnelchat

> https://developers-portal.funnelchat.app/ia/recetas/plantilla-con-variable.md. Crea una plantilla de WhatsApp con una variable y su ejemplo (el cuerpo que la API acepta), entérate por webhook cuando Meta la aprueba o la rechaza y mándala.

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

1. **El número oficial.** `GET /api/v1/devices`: la plantilla es de un número oficial (`connection` `coexistence` o
   `dedicated`); por uno conectado por QR no hay plantillas. Su `id` es el `device_id`.
2. **Una sola vez, el webhook** con `template.status_changed` (`POST /api/v1/webhooks`; pide
   **Avisos (webhooks) → Administrar** y **Contactos y conversaciones → Ver**).
3. **La plantilla.** `POST /api/v1/templates` (**Contactos y conversaciones → Editar**) con este cuerpo:

   ```json
   {
     "device_id": "dev_Ac7Ku7iIZDXJTjdCu0UB1mX",
     "name": "pedido_listo",
     "language_code": "es",
     "category": "UTILITY",
     "type": "text",
     "body": "Hola {{1}}, tu pedido ya está listo para retirar.",
     "params": {
       "body": { "1": "{name}" },
       "samples": { "body": { "1": "Lucía" } }
     }
   }
   ```

   - **`device_id` es obligatorio** aunque la especificación publicada todavía no lo nombra.
   - **Si `body` tiene variables (`{{1}}`, `{{2}}`…), `params` es obligatorio y es un objeto**, no una lista: en
     `params.body`, el campo del contacto que llena cada variable (`{name}` es su nombre), y en `params.samples.body`, un
     ejemplo de cada una, que Meta usa para revisarla. Sin `params`, o con una lista, responde `422` («Falta elegir el
     campo de {{1}}» o «Falta el valor de ejemplo de {{1}}»). La especificación publicada todavía lo declara como lista:
     manda este cuerpo aunque no pase su validación.
   - `type: "text"` es el único que no lleva `file`; con otro tipo, `file` es obligatorio.
   - `name` en minúsculas y con guiones bajos. La respuesta trae la plantilla con su `id` (`tpl_…`) y su estado,
     `PENDING` hasta que Meta la revisa.
4. **La aprobación** llega como `template.status_changed`: `data.template.id`, `data.status` (`APPROVED` o
   `REJECTED`, entre otros) y `data.previous_status`. `data.reason` puede venir `null` también en un rechazo: el motivo
   no siempre llega. Sin webhook, `GET /api/v1/templates/{template}` devuelve su `status`: consulta cada pocos minutos,
   no en un bucle.
5. **Mándala** cuando está `APPROVED`:
   `POST /api/v1/devices/{device}/templates/{template}/send-template` con
   `{"phone": "5491122334455", "template_variables": {"body": ["Lucía"]}}`. Sin `template_variables`, cada variable se
   llena con el campo elegido en `params.body` (el nombre del contacto, en el ejemplo); con `template_variables.body`,
   con tus textos, en el orden de `{{1}}`, `{{2}}`…

## En código (Node.js 18 o más nuevo)

```js
const H = { Authorization: `Bearer ${process.env.FUNNELCHAT_API_KEY}`, Accept: 'application/json', 'Content-Type': 'application/json' };

async function crearPlantilla(device) {
  const r = await fetch('https://api.funnelchat.com/api/v1/templates', {
    method: 'POST', headers: H,
    body: JSON.stringify({
      device_id: device, name: 'pedido_listo', language_code: 'es', category: 'UTILITY', type: 'text',
      body: 'Hola {{1}}, tu pedido ya está listo para retirar.',
      params: { body: { 1: '{name}' }, samples: { body: { 1: 'Lucía' } } },
    }),
  });
  const datos = await r.json();
  if (!r.ok) throw Object.assign(new Error(datos.error ?? String(r.status)), { errores: datos.errors });
  return datos; // la plantilla, con su id y status PENDING
}

// En tu receptor (con la firma ya verificada):
function alCambiarDeEstado(evento) {
  const { template, status, reason } = evento.data;
  if (status === 'APPROVED') marcarLista(template.id);
  if (status === 'REJECTED') avisarRechazo(template.name, reason ?? 'Meta no dio el motivo');
}
```

## El detalle de cada llamada y cada evento

- `GET /api/v1/devices` (Ver tus números): https://developers-portal.funnelchat.app/ia/referencia/numeros/ver-tus-numeros.md
- `POST /api/v1/webhooks` (Crear un webhook): https://developers-portal.funnelchat.app/ia/webhooks/crear-un-webhook.md
- `POST /api/v1/templates` (Crear una plantilla): https://developers-portal.funnelchat.app/ia/referencia/plantillas/crear-una-plantilla.md
- `GET /api/v1/templates/{template}` (Ver una plantilla): https://developers-portal.funnelchat.app/ia/referencia/plantillas/ver-una-plantilla.md
- `POST /api/v1/devices/{device}/templates/{template}/send-template` (Mandar una plantilla): https://developers-portal.funnelchat.app/ia/referencia/mensajes/mandar-una-plantilla.md
- `template.status_changed`: https://developers-portal.funnelchat.app/ia/webhooks.md

## Las demás recetas y temas

El índice está en https://developers-portal.funnelchat.app/llms.txt: lee solo lo que necesitas.
