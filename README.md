# @funnelchat-hq/mcp

El servidor MCP de la API pública de Funnelchat. Con él, tu asistente (Claude Code, Cursor u otro cliente MCP) usa tus números de WhatsApp, tus mensajes, contactos, plantillas, grupos y webhooks con tu clave de API: los mismos permisos, límites y errores que la API.

Cubre todas las llamadas que publica el [portal de desarrolladores](https://developers-portal.funnelchat.app/docs/) con 20 tools, unos 3.100 tokens en total.

## Antes de empezar

- Node 20.11 o más.
- Una clave de API: en el panel, **Desarrolladores → Crear clave**. Dale solo los permisos que necesitas. La clave va en la configuración del servidor MCP, nunca en el chat.

## Instalarlo

### Claude Code

```bash
claude mcp add funnelchat -e FUNNELCHAT_API_KEY=tu_clave -- npx -y @funnelchat-hq/mcp
```

Para que solo pueda leer, agrega `--read-only` al final:

```bash
claude mcp add funnelchat -e FUNNELCHAT_API_KEY=tu_clave -- npx -y @funnelchat-hq/mcp --read-only
```

### Cursor

En `.cursor/mcp.json` (de tu proyecto) o en `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "funnelchat": {
      "command": "npx",
      "args": ["-y", "@funnelchat-hq/mcp"],
      "env": { "FUNNELCHAT_API_KEY": "tu_clave" }
    }
  }
}
```

### Otros clientes MCP

Todos piden lo mismo: el comando `npx -y @funnelchat-hq/mcp` y la variable `FUNNELCHAT_API_KEY`.

- **Claude Desktop**: el mismo bloque `mcpServers` de Cursor, en `claude_desktop_config.json`.
- **VS Code**: en `.vscode/mcp.json`, dentro de `"servers"`, con `"type": "stdio"` y los mismos `command`, `args` y `env`.
- **Codex**: en `~/.codex/config.toml`:

  ```toml
  [mcp_servers.funnelchat]
  command = "npx"
  args = ["-y", "@funnelchat-hq/mcp"]
  env = { FUNNELCHAT_API_KEY = "tu_clave" }
  ```

Si tu cliente solo se conecta por HTTP, mira [Modo HTTP](#modo-http).

## Probarlo con el sandbox

El [sandbox](https://www.npmjs.com/package/@funnelchat-hq/sandbox) imita la API en tu máquina, sin cuenta y sin mandar nada a WhatsApp. Arráncalo en una terminal y déjalo corriendo:

```bash
npx @funnelchat-hq/sandbox
```

Y apunta el MCP a él con `FUNNELCHAT_BASE_URL`. Contra el sandbox sirve cualquier clave bien formada:

```bash
claude mcp add funnelchat-sandbox -e 'FUNNELCHAT_API_KEY=1|fc_live_sandbox' -e FUNNELCHAT_BASE_URL=http://127.0.0.1:4010 -- npx -y @funnelchat-hq/mcp
```

Sin `FUNNELCHAT_BASE_URL`, el MCP va a la API real (`https://api.funnelchat.com`). El tool `status` dice siempre a qué URL está apuntando.

## Cómo se usa

Le pides a tu asistente lo que quieres («manda un WhatsApp a…», «¿cuántas conversaciones sin leer tengo?») y él elige el tool. Empieza por `status`: dice qué números tienes conectados, si tienes webhooks y cuál es el siguiente paso.

Cada tool agrupa las llamadas de un recurso y recibe `action`, `params` y, en lo que no se deshace, `confirm`:

```json
{ "action": "help" }
{ "action": "help", "params": { "action": "send" } }
{ "action": "send", "params": { "device_id": "dev_…", "phone": "5491122334455", "text": "Hola, Ana" } }
```

`help` lista las acciones del tool; con `params.action` da los parámetros de una, con su ejemplo.

<!-- TOOLS:INICIO (lo escribe npm run generate) -->

Generado desde la spec del portal v0.7.0-49-g31766eb (sha256 `766230d4a8ce…`): 253 llamadas en 18 tools por recurso, más `status` y `search_docs`.

| Tool | Qué hace | Acciones | Lecturas | No se deshacen |
| --- | --- | ---: | ---: | ---: |
| `numbers` | Números de WhatsApp: ver, crear por QR, editar, desconectar, salud, cola de mensajes y Conversions API. | 22 | 12 | 5 |
| `connect_links` | Links para conectar un número por QR, tuyo o de un cliente, o para reconectarlo. | 4 | 2 | 1 |
| `messages` | Mandar mensajes y plantillas, ver un mensaje, marcarlo leído, reaccionar, reenviar y mandar formularios. | 11 | 1 | 0 |
| `conversations` | Conversaciones: mensajes con un contacto, listar, contar, marcar leídas y respuestas rápidas. | 13 | 8 | 1 |
| `contacts` | Contactos: ver, crear, editar y borrar, su ventana de 24 h, sus notas y su puntaje. | 16 | 8 | 2 |
| `tags` | Etiquetas: crearlas, editarlas y ponerlas o quitarlas a contactos. | 9 | 4 | 1 |
| `custom_fields` | Campos personalizados y sus valores en cada contacto. | 8 | 3 | 1 |
| `templates` | Plantillas de WhatsApp: ver, crear, editar, traer de Meta, métricas y borrar. | 7 | 3 | 1 |
| `groups` | Grupos de WhatsApp: ver, seguir, mandarles un mensaje, participantes y canales. | 11 | 9 | 0 |
| `group_actions` | Cambiar un grupo: crearlo, participantes, admins, nombre, foto, link y solicitudes. | 16 | 4 | 3 |
| `campaigns` | Campañas de grupos, envíos programados y estadísticas, solo lectura. | 28 | 28 | 0 |
| `broadcasts` | Difusiones: ver, buscar contactos, costo, estadísticas, cancelar y carpetas. | 16 | 10 | 3 |
| `automations` | Flujos: verlos, sus contactos, cancelar una ejecución, pausar a un contacto y carpetas. | 16 | 11 | 2 |
| `forms` | Formularios de WhatsApp: ver, crear, publicar, números, versiones y respuestas. | 18 | 9 | 1 |
| `boards` | Tableros: etapas y mover contactos entre ellas. | 16 | 5 | 2 |
| `tickets` | Tickets: ver, crear, editar, asignar, cerrar y reabrir. | 7 | 2 | 0 |
| `webhooks` | Webhooks: crear, ver, editar, probar y borrar, sus entregas y los tipos de evento. | 8 | 4 | 1 |
| `account` | Tu cuenta: datos, equipo, contactos activos, costos de Meta, ventas, dominios y alertas. | 27 | 20 | 1 |

<!-- TOOLS:FIN -->

`status` y `search_docs` completan los 20: `search_docs` busca en los textos del portal, que van dentro del paquete.

### Antes de llamar a la API

- **Los parámetros se revisan contra la spec**: nombres, obligatorios, tipos y valores permitidos. Si sobra o falta algo, la llamada no sale y el error dice qué corregir, con el `help` de la acción. Un filtro mal escrito nunca devuelve la lista entera.
- **Lo que no se deshace pide `confirm: true`**: borrar contactos, etiquetas o campos, cancelar una difusión, desconectar o borrar un número, sacar personas de un grupo… Sin `confirm`, el MCP no llama a la API y le pide al asistente que te pregunte primero. `help` marca esas acciones con «no se deshace».
- **`--read-only`** deja solo las lecturas: no crea, no cambia ni borra nada, y tampoco da el QR de un número, porque con él se toma el control del número.

### Errores

Un error vuelve marcado como error y con el cuerpo de la API: `status`, `error` (un código estable), `message`, y según el caso `errors` por campo o `retry_after` en segundos. Los errores del propio MCP, antes de llamar, son `unknown_params`, `invalid_params`, `confirmation_required`, `read_only` y `missing_api_key`.

## Modo HTTP

Para hospedarlo o para clientes que solo hablan HTTP:

```bash
npx -y @funnelchat-hq/mcp --http --port 3333
```

- Escucha en `POST http://127.0.0.1:3333/mcp`, sin sesión.
- Cada pedido trae su clave en `Authorization: Bearer <clave>` (o `X-API-Key`). Sin clave responde `401`: en este modo `FUNNELCHAT_API_KEY` no se usa.
- Revisa `Host` y `Origin` de cada pedido, para que una página web no pueda usarlo (DNS rebinding). Por defecto acepta `127.0.0.1`, `localhost` y `[::1]` con su puerto.
- Para escuchar fuera de tu máquina tienes que decir con qué nombre te llegan los pedidos:

  ```bash
  npx -y @funnelchat-hq/mcp --http --host 0.0.0.0 --port 3333 \
    --allowed-hosts mcp.tu-dominio.com --allowed-origins https://app.tu-dominio.com
  ```

  Ponlo detrás de un proxy con HTTPS: la clave viaja en cada pedido.

- `GET /health` responde `{"ok": true}`.

## Opciones

| Opción                    | Variable              | Qué hace                                                                                                                                                                                |
| ------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|                           | `FUNNELCHAT_API_KEY`  | La clave, en stdio.                                                                                                                                                                     |
| `--base-url <url>`        | `FUNNELCHAT_BASE_URL` | El host de la API. Por defecto `https://api.funnelchat.com`; el sandbox, `http://127.0.0.1:4010`. Si termina en `/api/v1`, `/api` o `/v1`, se quita. `FUNNELCHAT_API_URL` también vale. |
| `--read-only`             |                       | Solo lecturas.                                                                                                                                                                          |
| `--http`                  |                       | HTTP en vez de stdio.                                                                                                                                                                   |
| `--host <host>`           |                       | Dónde escucha en HTTP. Por defecto `127.0.0.1`.                                                                                                                                         |
| `--port <n>`              | `PORT`                | El puerto en HTTP. Por defecto `3333`.                                                                                                                                                  |
| `--allowed-hosts <a,b>`   | `MCP_ALLOWED_HOSTS`   | Los `Host` que acepta en HTTP.                                                                                                                                                          |
| `--allowed-origins <a,b>` | `MCP_ALLOWED_ORIGINS` | Los `Origin` que acepta en HTTP.                                                                                                                                                        |
| `--version`, `--help`     |                       | La versión y la ayuda.                                                                                                                                                                  |

## La spec y las versiones

Los tools salen de la spec que publica el portal (`spec/funnelchat.json`). De dónde salió, con su versión del portal y su `sha256`, está en `spec/procedencia.json`, que va dentro del paquete; `status` también la dice. Qué no se deshace, y qué se pierde, lo dice la spec con `x-fc-destructive`. Lo único escrito a mano es `diseno.json`: qué grupos del portal van a cada tool, algunos nombres de acción, lo poco que pide confirmación aunque la spec no lo marque y los ejemplos de las acciones principales.

Una versión nueva de la spec es una versión nueva del paquete. Las acciones no cambian de nombre entre versiones: si una tuviera que cambiar, sale en una versión mayor.

## Desarrollo

```bash
npm ci
npm test                                         # pruebas unitarias, sin red
npx @funnelchat-hq/sandbox --port 4010           # en otra terminal
SANDBOX_URL=http://127.0.0.1:4010 npm run test:e2e   # contra el sandbox: stdio, HTTP, el ejemplo de cada acción y la prueba adversaria
npm run test:pack                                # npm pack, instalarlo en un proyecto vacío y correrlo con npx
npm run measure                                  # cuántos tokens cargan los tools
```

Con una spec nueva del portal:

```bash
npm run generate -- --spec <ruta>/funnelchat.json   # la copia a spec/, anota su procedencia y regenera generated/tabla.json
npm run docs -- --portal <carpeta del portal construido>   # regenera docs/indice.json, lo que busca search_docs
```

Si el archivo no viene de un checkout del portal, di de dónde salió con `--source url=… --source portal_version=…`. `npm run generate:check` y `npm run docs:check` fallan si algo no está al día, si `docs/` ofrece lo que no existe o si la spec y la doc salieron de portales distintos; el CI corre los dos.

Para publicar, sube un tag `vX.Y.Z` igual a la versión de `package.json` sobre un commit de `main`: `publish.yml` corre el CI y publica en npm con provenance.

## Licencia

MIT
