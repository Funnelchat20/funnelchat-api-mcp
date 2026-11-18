# Límites y errores — API de Funnelchat: contexto para tu IA

> Copiado de /docs/limites-y-errores/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Límites

Todo límite responde `429` con su código en `error`. Nunca repitas una llamada que respondió `429` sin esperar lo que
indica `Retry-After`; si no trae `Retry-After`, no la repitas.

- **Por día:** cada clave hace hasta 10 000 llamadas por día en accounts y otras 10 000 en communities, y
  cada área cuenta aparte. conversations no tiene tope diario. El área de cada llamada es su `x-fc-domain` en la
  especificación publicada (`/specs/funnelchat.json`). El tope se reinicia a las 00:00 UTC. Al pasarlo,
  `429 daily_cap_exceeded` con `Retry-After`: los segundos que faltan para las 00:00 UTC. Hasta entonces, no repitas
  llamadas de esa área; las de las otras áreas siguen funcionando. Si el código hace muchas llamadas por día a
  accounts o a communities (una sincronización, un proceso que recorre listados), cuéntalas y repártelas.
- **Por minuto:** cada área limita las llamadas por minuto, por grupo de llamadas, y cada grupo cuenta aparte. Según la
  llamada, el cupo es por usuario (lo comparten todas las claves del usuario de Funnelchat dueño de la clave y su uso
  del panel, así que el panel u otra integración de la misma persona pueden gastarlo), por workspace (lo comparten las
  claves y el panel de ese workspace; cada workspace de la cuenta tiene el suyo), por clave o por número. Si la cuenta
  usa workspaces separados, el cupo por usuario también se cuenta en cada workspace. Al pasarlo, `429 rate_limited` con `Retry-After`: espera esos segundos y reintenta. No dispares muchas
  llamadas en paralelo: repártelas en el tiempo.
  - accounts: la mayoría, 200 por workspace. Crear un número, reiniciar su sesión, anular un link de alta y crear o
    probar un webhook, 10 por clave entre todas; crear un link de alta, otros 10 por clave; ver, editar y borrar
    webhooks y ver sus entregas, 60 por clave; `POST /api/v1/devices/{device}/health/refresh`, 6 por número;
    `GET /api/v1/me` y las alertas, sin límite por minuto propio. El `429` de cada llamada de accounts en la
    especificación publicada dice el suyo.
  - communities: todo por usuario, hasta 600 entre todas las llamadas. Además, 30 entre crear un grupo, sus acciones
    y mandarle un mensaje; 30 para importar un grupo; 30 para leer en el momento el link de invitación o las
    solicitudes; 60 para `GET /api/v1/groups/actions/{action}`.
  - conversations: escrituras, 30 por usuario (las más delicadas, como borrar contactos o campos o cancelar una
    difusión, 10); varias lecturas, 120 por usuario; listar contactos, conversaciones y mensajes, sin límite por
    minuto; formularios de WhatsApp, 120 lecturas y 60 cambios por clave, y 30 por workspace en lo que pasa por Meta;
    marcar todas las conversaciones, 5 por workspace.
  - Los envíos de mensajes no tienen límite por minuto: los limita el ritmo por número, con el mismo
    `429 rate_limited` y `Retry-After` (ver «Mandar mensajes»).
    Con una clave, estas no cuentan en el tope de escrituras por minuto (solo el ritmo del número):
    `POST /api/v1/message/send-message`, `POST /api/v1/contacts/{contact}/message`,
    `POST /api/v1/devices/{device}/templates/{template}/send-template`, `POST /api/v1/contacts/{contact}/message/contact-card`,
    `POST /api/v1/contacts/{contact}/messages/{message}/forward`, `POST /api/v1/contacts/{contact}/message/form` y poner o
    quitar una reacción (`PUT` y `DELETE /api/v1/contacts/{contact}/messages/{message}/reaction`). Una nota interna
    (`note: true`) no es un envío y sí cuenta.
- **Contactos activos:** un envío puede responder `429` con `mac_lockout_24h` o `mac_limit_reached` cuando la cuenta
  (o, si usa workspaces separados, el workspace del número, que tiene su propio plan) llegó a su límite de contactos
  activos. No trae `Retry-After` y reintentar no sirve hasta que cambie el límite (al
  sumar capacidad o al empezar un ciclo nuevo con cupo): díselo a la persona. Antes de un envío grande, mira
  `GET /api/v1/mac/status`.
- **Contactos activos, sin rastro:** un envío frenado por `mac_lockout_24h` o `mac_limit_reached` no guarda ningún
  mensaje ni el `client_reference`: no lo busques en el historial del contacto.
- **Workspace archivado:** `403` en toda llamada de conversations (`error` `WORKSPACE_ARCHIVED`); en accounts, en las
  rutas que cortan por pago, `403` con `error` `WORKSPACE_INACTIVE` e `inactive_reason` `archived`, no `402`; en
  communities, `403 workspace_archived` en las operaciones que necesitan el plan activo. Reintentar no sirve hasta que
  la persona lo reactive desde el panel.
- **Pago vencido:** `402 payment_required` (el pago de la cuenta o del workspace) solo en las llamadas que lo documentan en la especificación publicada; las
  demás siguen respondiendo aunque el pago esté vencido. En las acciones de grupo, `402 plan_cap_reached` es el plan, no
  el pago; al crear un grupo (`POST /api/v1/groups`) es el tope de grupos oficiales del plan y trae `cap` y `used`.
  Reintentar no sirve en ninguno de los dos: díselo a la persona.
- **Otra cuenta:** con un número de otra cuenta o de otro workspace de la cuenta, la API responde `404 not_found` antes
  que cualquier otro error (aunque el pago esté vencido o a la clave le falte un permiso). Un `404` no dice que el número no exista: puede ser de otra cuenta o de otro
  workspace.
- **`500`:** `internal_error`; en los envíos de mensajes, también puede llegar `gate_misconfigured`. Reintenta más tarde, y en un envío busca antes el mensaje por su `client_reference`.

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
