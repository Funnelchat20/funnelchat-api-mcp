# Borrar un número — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/numeros/borrar-un-numero/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Llamadas

### Borrar un número

`DELETE /api/v1/devices/{device}` · permiso **Números de WhatsApp → Crear, conectar y borrar** · área accounts · `operationId` `device.destroy`

> **No se puede deshacer.** Pide confirmación explícita antes de llamarla (`references/shared/limites-de-ejecucion.md`).

**Para qué sirve:** Úsalo para dar de baja un número de la cuenta de forma definitiva. No se puede deshacer. Requiere **Números de WhatsApp → Crear, conectar y borrar**.

> ⚠️ **No se puede deshacer:** el número se borra de la cuenta y libera su lugar en el plan. Para volver a usar ese teléfono hay que crear un número nuevo y conectarlo otra vez.

Borra el número de la cuenta y deja libre su lugar en el plan. No se puede deshacer: para
volver a usar ese teléfono hay que crear un número nuevo y conectarlo otra vez. Si la cuenta
tenía números suspendidos por el plan, el lugar libre puede reactivar uno.

También borra un número conectado. Si es por QR, se cierra su sesión de WhatsApp. Si es
oficial, el número sigue registrado en Meta y Funnelchat deja de recibir sus mensajes. Borra
solo ese número: si borras el oficial y el mismo teléfono también está en la cuenta por QR
(`same_number_as`), el número por QR sigue y vuelve a recibir los chats uno a uno.

Si el proveedor de WhatsApp no responde al cerrar la sesión, el número se borra igual y
Funnelchat reintenta el cierre.

Al borrarlo llega el webhook `device.deleted`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí | The device ID |

**Respuestas**

- `200` — Borrado. El cuerpo viene vacío.
- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `402` — El pago de la cuenta o del workspace está vencido (`payment_required`). Regularízalo en el panel de Funnelchat para seguir usando esta ruta.
- `403` — El pago de la cuenta o del workspace está vencido, o quien llama no puede borrar ese número.
- `404` — Not found (`AccountsModelNotFoundException`)
- `409` — Hay otra operación en curso sobre los números de la cuenta (`operation_in_progress`), por ejemplo el alta oficial de ese mismo número. No se borró nada: vuelve a intentarlo.
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
