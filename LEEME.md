# funnelchat-api-mcp (prototipo)

MCP de la API pública de Funnelchat: 20 tools, cada uno con `action` y `params`, generados desde la spec del portal.

## Usarlo

```bash
npm ci
export FUNNELCHAT_API_KEY='…'                 # tu clave; contra el sandbox: '1|fc_live_sandbox'
export FUNNELCHAT_API_URL=http://localhost:4010   # opcional: el sandbox (por defecto, https://api.funnelchat.com)
node src/cli.mjs                               # stdio
node src/cli.mjs --http --port 3333            # HTTP en /mcp; la clave en Authorization: Bearer
```

```bash
claude mcp add funnelchat-api -e FUNNELCHAT_API_KEY=$FUNNELCHAT_API_KEY -- node /ruta/a/prototipo/src/cli.mjs
```

## Tools

| Tool                                                                                                                                                                                                                                | Qué hace                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `status`                                                                                                                                                                                                                            | Números conectados, webhooks y el siguiente paso             |
| `search_docs`                                                                                                                                                                                                                       | Busca en llms.txt y los textos /ia/ (copia local en `docs/`) |
| `numbers`, `connect_links`, `messages`, `conversations`, `contacts`, `tags`, `custom_fields`, `templates`, `groups`, `group_actions`, `campaigns`, `broadcasts`, `automations`, `forms`, `boards`, `tickets`, `webhooks`, `account` | Las 253 llamadas publicadas, agrupadas por recurso           |

```json
{ "action": "help" }
{ "action": "help", "params": { "action": "send" } }
{ "action": "send", "params": { "device_id": "dev_…", "phone": "5491122334455", "text": "Hola" } }
{ "action": "delete", "params": { "id": "…" }, "confirm": true }
```

Cada acción llama a la API con la clave del usuario: mismos permisos, límites y errores. Un error vuelve con `isError` y el cuerpo de la API (`status`, `error`, `message`, `errors`, `retry_after`).

## Regenerar

```bash
node scripts/generar.mjs --portal ../../../developers-portal # generated/tabla.json y docs/
node scripts/exportar-defs.mjs                              # ../defs-api.json y la medida
SANDBOX_URL=http://localhost:4010 node scripts/prueba.mjs   # prueba de punta a punta → PRUEBA.md
```

Lo único escrito a mano es `diseno.json`: qué grupos de `config/alcance.json` van a cada tool, la descripción de cada tool y 29 nombres de acción.
