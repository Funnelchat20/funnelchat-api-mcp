# Cambios

## 0.2.0 (27-11-2026)

Generado desde la spec del portal v0.7.0-54-g5c9ed62 (27-11): 260 llamadas (253 antes). Las campañas y los envíos programados a grupos ya se escriben con una API key.

- **`campaigns` deja de ser solo lectura:** `create`, `update`, `set_status` (activar o pausar) y `delete` de una campaña; `create_scheduled_message`, `update_scheduled_message` y `cancel_scheduled_message` de un envío a grupos. Con `--read-only` no aparecen.
- **Borrar una campaña y cancelar un envío programado piden `confirm: true`** (27 acciones en total), con lo que se pierde según la spec.
- **`photo`, `input_tag` y `output_tag` no se ofrecen** al crear o editar una campaña: con una API key la API responde 422; se configuran desde el panel.
- **Ejemplos escritos a mano** para crear y editar una campaña, pausarla, y programar y editar un envío (`send_at` como lo toma la API: `2026-12-07 13:00:00`, en UTC).
- `search_docs` busca en los textos del portal del mismo commit (875 secciones).

## 0.1.0 (18-11-2026)

Primera versión publicada.

- **20 tools para toda la API pública:** uno por recurso (números, mensajes, contactos, plantillas, grupos, webhooks y los demás), más `status` y `search_docs`. Cubren las 253 llamadas de la spec del portal v0.7.0-49-g31766eb, en unos 3.100 tokens. En cada tool, `action: "help"` da las acciones, sus parámetros y un ejemplo.
- **Los parámetros se revisan antes de llamar:** un nombre que la acción no tiene es `unknown_params`, con el nombre parecido si lo hay, y un tipo o un valor que no corresponde es `invalid_params`. En los dos casos no se llama a la API, así que un filtro mal escrito no devuelve la lista entera ni deja un borrado sin su filtro. `params` puede llegar como texto JSON.
- **Lo que no se deshace pide confirmación:** 25 acciones necesitan `confirm: true` y, sin eso, el error dice qué se pierde y pide preguntarle a la persona antes de seguir. Cuáles son y qué se pierde lo dice la spec (`x-fc-destructive`).
- **`--read-only`:** deja solo las lecturas. Tampoco ofrece el QR de un número, porque da el control del número.
- **Modo HTTP (`--http`):** sirve `POST /mcp` y usa la clave de cada pedido (`Authorization: Bearer` o `X-API-Key`). Sin clave responde 401 y no usa la del entorno. Revisa `Host` y `Origin`, escucha en 127.0.0.1 por defecto y, para escuchar en otra interfaz, pide `--allowed-hosts`.
- **`search_docs`:** busca en los textos para IA del portal (`/ia`, `llms.txt` y `llms-full.txt`), del mismo commit que la spec.
- **La URL base es el host:** `FUNNELCHAT_BASE_URL` o `--base-url`, por defecto `https://api.funnelchat.com`. Si termina en `/api/v1`, `/api` o `/v1`, se quita. Para el sandbox: `http://127.0.0.1:4010`.
- **Sin alta oficial por link:** `connect_links` conecta números por QR. El alta oficial por link, que incluye el número de EE. UU., está apagada en la API (503 `meta_connect_disabled`), así que un número oficial se conecta desde el panel.
- Necesita Node 20.11 o más nuevo.
