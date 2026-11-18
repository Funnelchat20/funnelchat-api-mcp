# Probar la conexión con Conversions API — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/conversions-api/probar-la-conexion-con-conversions-api/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Probar la conexión con Conversions API

`GET /api/v1/devices/{device}/capi/test` · permiso **Números de WhatsApp → Ver** · área accounts · `operationId` `capiConnection.test`

**Para qué sirve:** Úsalo para verificar la conexión con Conversions API: chequea los permisos del token y que el WABA tenga dataset, sin enviar eventos de prueba, y te da el link al Events Manager.

Comprueba que el número tenga el permiso de Meta para enviar eventos
(`whatsapp_business_manage_events`) y que su WABA tenga un dataset, guarda el resultado y
devuelve el estado con un enlace al Administrador de eventos de Meta. No envía ningún
evento: una compra de prueba quedaría registrada como una venta real. Solo el titular de
la cuenta.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí | The device ID |

**Respuestas**

- `200` — El estado de la conexión.
- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `402` — El pago de la cuenta o del workspace está vencido (`payment_required`). Regularízalo en el panel de Funnelchat para seguir usando esta ruta.
- `403` — La Conversions API no está habilitada para la cuenta (`capi_feature_disabled`), o quien llama no es el titular.
- `404` — Not found (`AccountsModelNotFoundException`)
- `422` — El número no está listo (`device_not_ready`) o la cuenta llegó al tope de conexiones del plan (`capi_connection_cap_reached`).
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`
- `502` — Meta no respondió bien (`meta_http_error`, `unparseable_response`). Vuelve a intentarlo.

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
