# Construir con IA — API de Funnelchat: contexto para tu IA

> Copiado de /docs/herramientas/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Herramientas

- **Instrucciones para el agente:** las de esta API, en dos formas con el mismo contenido. La skill `funnelchat`, en
  `https://developers-portal.funnelchat.app/skill/funnelchat.zip` (la carpeta `funnelchat/` en la raíz): se descomprime en `~/.claude/skills/` para
  todos los proyectos o en `.claude/skills/` de uno. Y un solo Markdown, `https://developers-portal.funnelchat.app/ia/instrucciones.md`, para guardar en
  el proyecto como `FUNNELCHAT.md` y nombrar desde `AGENTS.md` (o `CLAUDE.md`); sirve para cualquier agente. Los pasos
  para que un agente configure Funnelchat en la compu de la persona, hasta su primer mensaje: `https://developers-portal.funnelchat.app/ia/`.
- **SDK de Node.js:** `npm install @funnelchat-hq/sdk` (Node 18 o más nuevo). Si no le pasas la clave, el cliente la lee
  de `FUNNELCHAT_API_KEY`.
- **SDK de PHP:** `composer require funnelchat/funnelchat-php`.
- **SDK de Python:** `pip install funnelchat` (Python 3.9 o más nuevo). `Funnelchat()` lee la clave de
  `FUNNELCHAT_API_KEY`; el primer mensaje es
  `client.messages.send_direct(device_id=<id del número>, phone="<teléfono con código de país>", text="<texto>")`.
- **CLI:** `npx @funnelchat-hq/cli <comando>` (Node 18 o más nuevo), o `npm install -g @funnelchat-hq/cli` y el comando
  `funnelchat`. Lee la clave de `FUNNELCHAT_API_KEY` (o de `login`, que la guarda sin mostrarla). El primer uso:
  `numbers list` (primero: si la cuenta ya tiene un número conectado, no hace falta conectar otro), `connect` (con
  `--no-wait`, imprime el link con el QR y termina; con `--us-number`, el link pide un número de EE. UU. de
  Funnelchat; con `--device <id>`, reconecta un número de la cuenta) y `send <teléfono> "<texto>"` (sigue el mensaje
  hasta `read` y muestra cada estado). Con `--json`, cada comando devuelve un solo JSON en la salida estándar; un error
  es un JSON en la salida de errores con `code`, `exit_code`, `hint` y `request_id`. **Toda la API desde la terminal:**
  `api list <palabras> --json` lista las funciones (nombre, método, ruta, para qué sirve, permiso y si pide
  confirmación), `api <función> --help` dice qué recibe una, con un ejemplo, y `--json api <función> --<parámetro>
  <valor> --field <campo>=<valor>` la llama (o el cuerpo entero con `--body @archivo.json`). Una escritura se manda una
  sola vez y nunca se reintenta sola. Lo que no se puede deshacer, sin una terminal, solo sale con `--yes`: agrégalo
  solo después de que la persona lo confirme.
- **Nodo de n8n:** el paquete de nodos de comunidad `@funnelchat-hq/n8n-nodes-funnelchat` (en n8n: Settings › Community
  Nodes › Install).
- **Sandbox:** `npx @funnelchat-hq/sandbox` (Node 20.11 o más nuevo) levanta en `http://127.0.0.1:4010` una imitación de
  la API: las mismas rutas bajo `/api/v1`, sin cuenta real y sin mandar nada a WhatsApp. Acepta cualquier clave bien
  formada, por ejemplo `1|fc_live_sandbox`. Para probar, usa `http://127.0.0.1:4010` como URL base. Simula lo que hace
  otro: `POST /_sandbox/inbound/message` (un contacto te escribe), `POST /_sandbox/devices/{id}/disconnect` (con
  `{"reason": …}`), `POST /_sandbox/templates/{id}/status` (Meta aprueba o rechaza) y `POST /_sandbox/events/{type}`
  (cualquier evento, con su ejemplo). **No valida todo lo que valida la API**: que el sandbox acepte un cuerpo no prueba
  que la API lo acepte. `GET /_sandbox/operations` dice qué llamadas solo devuelven la forma (`shape-only`).
- **Lo que lee el agente:** `https://developers-portal.funnelchat.app/llms.txt` (empieza por las recetas por tarea), `https://developers-portal.funnelchat.app/ia/lo-basico.md` (lo
  que vale para toda la API, una sola vez), `https://developers-portal.funnelchat.app/ia/llamadas.md` (cada llamada, con el enlace a su texto) y la
  especificación `https://developers-portal.funnelchat.app/specs/funnelchat.json`.

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
