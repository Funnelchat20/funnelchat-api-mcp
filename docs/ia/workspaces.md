# Workspaces — API de Funnelchat: contexto para tu IA

> Copiado de /docs/workspaces/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Workspaces

- Cada clave trabaja en un solo workspace: el de la cuenta donde la persona la creó, en el panel. Lo que la clave ve y
  hace queda dentro de ese workspace. Para trabajar en otro workspace, la persona crea otra clave desde ese workspace,
  en el panel.
- Al mandar por `phone` (o `whatsapp_id`), el teléfono se busca y, si todavía no es contacto, se crea en el workspace de
  la clave. Si en la cuenta cada workspace tiene sus propios contactos, se busca solo en el workspace de la clave: que
  otro workspace tenga un contacto con ese teléfono no cambia la respuesta. Si los workspaces comparten los contactos y
  el teléfono es contacto de otro workspace de la cuenta, el envío responde `404 not_found`, igual que un contacto que
  no existe y sin datos de ese contacto; para escribirle, la persona usa una clave creada en ese workspace.
- Los webhooks son del workspace: cada suscripción recibe solo los eventos de su workspace.
- Una cuenta puede usar workspaces separados (cada uno con sus propios contactos, grupos, plan, pago y topes por
  minuto) o compartir lo suyo; cada texto de la referencia dice cuál de los dos casos describe.
- Todos los eventos de los webhooks traen `data.workspace_id`, el id del workspace del número (un entero; por ejemplo,
  `37`).
- **De toda la cuenta, no del workspace:** el horario de silencio y el reporte diario de las alertas
  (`/api/v1/alerts/quiet-hours` y `/api/v1/alerts/daily-report`) son uno solo por cuenta: cambiarlos cambia los de
  toda la cuenta. Confírmalo con la persona antes.

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
