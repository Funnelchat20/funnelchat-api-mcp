# Reiniciar la sesión de un número — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/numeros/reiniciar-la-sesion-de-un-numero/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Reiniciar la sesión de un número

`PUT /api/v1/devices/{device}/reset` · permiso **Números de WhatsApp → Crear, conectar y borrar** · área accounts · `operationId` `device.reset`

> **No se puede deshacer.** Pide confirmación explícita antes de llamarla (`references/shared/limites-de-ejecucion.md`).

**Para qué sirve:** Sirve para borrar los datos del número conectado en un lugar de tu plan, por QR u oficial, y conectar ahí un número distinto: es «Borrar datos» en el panel. El lugar sigue ocupado y se conserva el alias. No se puede deshacer. Requiere **Números de WhatsApp → Crear, conectar y borrar**.

> ⚠️ **No se puede deshacer:** borra la información del número conectado en ese lugar (por QR u oficial), igual que «Borrar datos» en el panel, para conectar ahí un número distinto. El lugar en el plan sigue ocupado y se conserva el alias; para conectar el número nuevo hay que pedir un QR o hacer el alta oficial.

Lo mismo que «Borrar datos» en el panel: borra la información del número conectado en
este lugar, por QR u oficial, para conectar ahí un número **distinto**. El lugar en el plan
sigue ocupado y se conserva el alias (y el color; en un número oficial, también la imagen).
Para conectar el número nuevo, pide un QR (`GET devices/{device}/qr`) o usa el alta
oficial.

Si era un número oficial conectado, llega el webhook `device.disconnected` con
`reason: disconnected_by_user`, y si el mismo teléfono también está en la cuenta por QR, ese
número vuelve a recibir los chats uno a uno.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí | The device ID |

**Respuestas**

- `200` — El número, ya sin sus datos, en `data`, y en `numbers_capacity` el uso de los lugares del plan (no aparece si no se pudo calcular).

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<any> |  |
  | `numbers_capacity` | string \| null |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `402` — El pago de la cuenta o del workspace está vencido (`payment_required`). Regularízalo en el panel de Funnelchat para seguir usando esta ruta.
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `404` — Not found (`AccountsModelNotFoundException`)
- `409` — El número fue dado de baja (`device_retired`) o hay otra operación en curso sobre los números de la cuenta (`operation_in_progress`). No se borró nada.
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
