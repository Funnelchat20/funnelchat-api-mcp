# Configurar el dataset de un número — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/conversions-api/configurar-el-dataset-de-un-numero/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Configurar el dataset de un número

`POST /api/v1/devices/{device}/capi/dataset` · permiso **Números de WhatsApp → Editar** · área accounts · `operationId` `capiConnection.dataset`

**Para qué sirve:** Sirve para dejar listo el dataset de Meta Conversions API del WABA de un número, creándolo o recuperándolo si ya existía. Solo lo puede hacer el titular de la cuenta.

Crea en Meta el dataset de la Conversions API (CAPI) de la cuenta de WhatsApp Business
(WABA) del número, o recupera el que ya tiene: llamarlo otra vez no crea otro. Solo para
números oficiales, y solo el titular de la cuenta.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí | The device ID |

**Respuestas**

- `200` — El dataset de la WABA del número.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `waba_id` | string |  |
  | `dataset_id` | string \| null |  |
  | `scope_ok` | boolean |  |
  | `consented_at` | string \| null |  |
  | `last_verified_at` | string \| null |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `402` — El pago de la cuenta o del workspace está vencido (`payment_required`). Regularízalo en el panel de Funnelchat para seguir usando esta ruta.
- `403` — La Conversions API no está habilitada para la cuenta (`capi_feature_disabled`), o quien llama no es el titular.
- `404` — Not found (`AccountsModelNotFoundException`)
- `422` — El número no está listo (`device_not_ready`) o la cuenta llegó al tope de conexiones del plan (`capi_connection_cap_reached`).
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`
- `502` — Meta no respondió bien (`meta_http_error`, `unparseable_response`). Vuelve a intentarlo.

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
