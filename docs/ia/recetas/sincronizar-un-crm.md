# Sincronizar los contactos de tu CRM — receta de la API de Funnelchat

> https://developers-portal.funnelchat.app/ia/recetas/sincronizar-un-crm.md. Crea una vez el campo y la etiqueta, crea o actualiza cada contacto por su teléfono con sus campos, y ponles la etiqueta en lotes de 200 sin disparar flujos, al ritmo de 30 escrituras por minuto.

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

1. **Una vez por campo: el campo.** `POST /api/v1/custom-fields` con `{"name": "Plan", "type": 0}`
   (**Contactos y conversaciones → Editar**). Si ya hay uno con ese nombre, responde ese y no crea otro: llámalo
   directo, sin buscarlo antes. Guarda su `id` (`fld_…`). `type`: `0` texto, `1` numérico, `2` fecha (`AAAA-MM-DD`),
   `3` URL, `4` alfanumérico; no se cambia después.
2. **Una vez por etiqueta: la etiqueta.** `POST /api/v1/tags` con `{"name": "Cliente CRM"}`: igual, si ya existe con
   ese nombre, responde esa. Guarda su `id` (`tag_…`).
3. **Por contacto.** `POST /api/v1/contacts/update-or-create` (**Contactos y conversaciones → Editar**) con
   `{"phone": "5491122334455", "name": "Lucía Pérez", "email": "lucia@example.com", "custom_fields": [{"id": "fld_…", "value": "Pro"}]}`.
   - Responde `201` si lo creó y `200` si ya existía. Guarda el `id` (`ctc_…`) con tu id del CRM.
   - De un contacto que ya existe cambia solo el `name` y el `email` que mandes: si no mandas uno, queda como estaba.
     No hace falta leerlo antes.
   - En `custom_fields`, cada valor es **texto** en el formato de su tipo (`"1500"`, no `1500`); el que ya tenía ese
     campo se reemplaza y los campos que no mandas no cambian. Un valor con mal formato responde `422` y no guarda nada.
4. **La etiqueta, en lotes.** `POST /api/v1/contacts/add-tags?bulk=true` con hasta 200 elementos
   `[{"contactId": "ctc_…", "tag": {"id": "tag_…"}}, …]`, uno por contacto y etiqueta. Pide
   **Contactos y conversaciones → Enviar**. Con `bulk=true` (o con dos elementos o más) no arranca ningún flujo «Tag
   agregado»; con un solo elemento sin `bulk`, sí, y ese flujo puede escribirle al contacto.
   - Responde `200` sin cuerpo aunque un elemento no haga nada (un contacto que ya tenía la etiqueta, o un id que no
     es de tu workspace). Para confirmar un contacto, `GET /api/v1/contacts/{contact}/tags`.

## El ritmo

- Crear o actualizar contactos, campos y etiquetas cuenta en el tope de **30 escrituras por minuto por usuario** (lo
  comparten todas sus claves y su uso del panel): una cada 2 segundos. `add-tags` con 200 elementos es una sola
  escritura.
- Con `429 rate_limited`, espera los segundos de `Retry-After` y repite la misma llamada.
- Para 1000 contactos: unas 1000 llamadas de `update-or-create` (cerca de 34 minutos a ese ritmo) y 5 de `add-tags`.
  Anota el último contacto hecho para reanudar si se corta.

## En código (Node.js 18 o más nuevo)

```js
const BASE = 'https://api.funnelchat.com';
const H = { Authorization: `Bearer ${process.env.FUNNELCHAT_API_KEY}`, Accept: 'application/json', 'Content-Type': 'application/json' };
const espera = (s) => new Promise((r) => setTimeout(r, s * 1000));

async function escribir(ruta, cuerpo) {
  for (;;) {
    const r = await fetch(BASE + ruta, { method: 'POST', headers: H, body: JSON.stringify(cuerpo) });
    if (r.status === 429) { await espera(Number(r.headers.get('Retry-After') || 2)); continue; }
    const datos = await r.json().catch(() => null); // add-tags responde 200 sin cuerpo
    if (!r.ok) throw Object.assign(new Error(datos?.error ?? String(r.status)), { status: r.status, datos });
    await espera(2); // 30 escrituras por minuto
    return datos;
  }
}

async function sincronizar(filasDelCrm) {
  const campo = await escribir('/api/v1/custom-fields', { name: 'Plan', type: 0 }); // el campo, en la raíz
  const etiqueta = await escribir('/api/v1/tags', { name: 'Cliente CRM' });
  const ids = [];
  for (const f of filasDelCrm) {
    const c = await escribir('/api/v1/contacts/update-or-create',
      { phone: f.telefono, name: f.nombre, email: f.email, custom_fields: [{ id: campo.id, value: String(f.plan) }] });
    ids.push(c.id); // el contacto, en la raíz
  }
  for (let i = 0; i < ids.length; i += 200) {
    await escribir('/api/v1/contacts/add-tags?bulk=true', ids.slice(i, i + 200).map((id) => ({ contactId: id, tag: { id: etiqueta.id } })));
  }
}
```

## El detalle de cada llamada y cada evento

- `POST /api/v1/custom-fields` (Crear un campo): https://developers-portal.funnelchat.app/ia/referencia/campos-personalizados/crear-un-campo.md
- `POST /api/v1/tags` (Crear una etiqueta): https://developers-portal.funnelchat.app/ia/referencia/etiquetas/crear-una-etiqueta.md
- `POST /api/v1/contacts/update-or-create` (Crear o actualizar un contacto): https://developers-portal.funnelchat.app/ia/referencia/contactos/crear-o-actualizar-un-contacto.md
- `POST /api/v1/contacts/add-tags` (Agregar etiquetas a contactos): https://developers-portal.funnelchat.app/ia/referencia/etiquetas/agregar-etiquetas-a-contactos.md
- `GET /api/v1/contacts/{contact}/tags` (Ver las etiquetas de un contacto): https://developers-portal.funnelchat.app/ia/referencia/etiquetas/ver-las-etiquetas-de-un-contacto.md

## Las demás recetas y temas

El índice está en https://developers-portal.funnelchat.app/llms.txt: lee solo lo que necesitas.
