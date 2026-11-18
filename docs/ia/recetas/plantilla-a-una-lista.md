# Mandar una plantilla a una lista de teléfonos — receta de la API de Funnelchat

> https://developers-portal.funnelchat.app/ia/recetas/plantilla-a-una-lista.md. Manda una plantilla aprobada a una lista, una llamada por teléfono con tu referencia por fila, al ritmo que pide cada número, y corta a tiempo si se acaban los contactos activos.

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

1. **La plantilla.** `GET /api/v1/templates?status=APPROVED&deviceId=dev_Ac7Ku7iIZDXJTjdCu0UB1mX`
   (**Contactos y conversaciones → Ver**): solo sale una aprobada, del mismo número oficial que va a mandar. Guarda su
   `id` y cuenta las variables de su cuerpo (`{{1}}`, `{{2}}`…). Si la persona la acaba de crear en Meta y no aparece,
   tráela de Meta (tema «Mensajes») antes de concluir que no existe.
2. **¿Alcanzan los contactos activos?** `GET /api/v1/mac/status`: `remaining` es cuántos contactos nuevos puedes
   alcanzar en el ciclo (`null` si no hay límite). Si la lista tiene más teléfonos nuevos que eso, díselo a la persona
   antes de empezar.
3. **Para saber cómo salió cada uno**, un webhook con `message.status_changed` (`POST /api/v1/webhooks`, receta «Mandar
   un texto y saber si lo leyeron»).
4. **Una llamada por fila.** `POST /api/v1/devices/{device}/templates/{template}/send-template`
   (**Contactos y conversaciones → Enviar**) con
   `{"phone": "5491122334455", "template_variables": {"body": ["Lucía", "8841"]}, "client_reference": "campana-12-fila-7"}`.
   - `template_variables.body` es una lista de textos en el orden de `{{1}}`, `{{2}}`…: **una por variable**. La API no
     cuenta las variables al recibir el envío: si falta una, te enteras después, cuando el mensaje termina `failed`.
     Un valor con llaves (`{…}`) se lee como un campo del contacto; uno que no existe responde
     `422 template_unresolved_placeholder`.
   - `phone` va siempre, con código de país; si todavía no es contacto, se crea.
   - `client_reference` distinto por fila: vuelve en `message.status_changed`.
   - La respuesta `200` trae el mensaje en `queued` (en cola no es enviado), con su `id` y su `contact_id`. Anota la
     fila como aceptada: si el proceso se corta, al reanudar sigue desde la primera fila sin aceptar.

## El ritmo y cuándo parar

- **Con una clave, mandar plantillas no tiene tope por minuto**: lo marca el ritmo del número. Si responde
  `429 rate_limited`, espera los segundos de `Retry-After` y repite **esa misma fila**.
- **`429 mac_lockout_24h` o `mac_limit_reached`** (contactos activos): no hay `Retry-After`, no se guardó nada y
  reintentar no sirve. Para la lista entera y díselo a la persona.
- **`404 template_not_found`**, `422 template_waba_mismatch` (la plantilla es de otra cuenta de WhatsApp Business que
  la del número) o `402 payment_required`: para la lista; no es de una fila.
- **`422` de una fila** (un teléfono no válido, por ejemplo): anótala como rechazada y sigue.
- **`500` o un corte de red**: no repitas esa fila enseguida; si salió, llega su `message.status_changed` con tu
  `client_reference`. Hoy no hay una búsqueda de mensajes por `client_reference`.

## En código (Node.js 18 o más nuevo)

```js
const BASE = 'https://api.funnelchat.com';
const H = { Authorization: `Bearer ${process.env.FUNNELCHAT_API_KEY}`, Accept: 'application/json', 'Content-Type': 'application/json' };
const espera = (s) => new Promise((r) => setTimeout(r, s * 1000));

async function mandarLista(device, template, filas, aceptadas /* Set de client_reference ya aceptadas */) {
  for (const fila of filas) {
    const ref = `campana-12-fila-${fila.n}`;
    if (aceptadas.has(ref)) continue;
    for (;;) {
      const r = await fetch(`${BASE}/api/v1/devices/${device}/templates/${template}/send-template`, {
        method: 'POST', headers: H,
        body: JSON.stringify({ phone: fila.telefono, template_variables: { body: fila.variables }, client_reference: ref }),
      });
      const datos = await r.json().catch(() => ({}));
      if (r.ok) { aceptadas.add(ref); break; }
      if (r.status === 429 && datos.error === 'rate_limited') { await espera(Number(r.headers.get('Retry-After') || 1)); continue; }
      if (['mac_lockout_24h', 'mac_limit_reached', 'template_not_found', 'template_waba_mismatch', 'payment_required'].includes(datos.error)) {
        throw new Error(`Paro la lista: ${datos.error}`);
      }
      console.error(ref, r.status, datos.error); // 422 de esta fila, o 5xx: no la repitas a ciegas
      break;
    }
  }
}
```

## El detalle de cada llamada y cada evento

- `GET /api/v1/templates` (Ver tus plantillas): https://developers-portal.funnelchat.app/ia/referencia/mensajes/ver-tus-plantillas.md
- `GET /api/v1/mac/status` (Ver tu consumo de contactos activos): https://developers-portal.funnelchat.app/ia/referencia/tu-cuenta-y-tu-equipo/ver-tu-consumo-de-contactos-activos.md
- `POST /api/v1/devices/{device}/templates/{template}/send-template` (Mandar una plantilla): https://developers-portal.funnelchat.app/ia/referencia/mensajes/mandar-una-plantilla.md
- `POST /api/v1/webhooks` (Crear un webhook): https://developers-portal.funnelchat.app/ia/webhooks/crear-un-webhook.md
- `message.status_changed`: https://developers-portal.funnelchat.app/ia/webhooks.md

## Las demás recetas y temas

El índice está en https://developers-portal.funnelchat.app/llms.txt: lee solo lo que necesitas.
