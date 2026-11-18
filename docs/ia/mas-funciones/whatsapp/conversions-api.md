# Conversions API — API de Funnelchat: contexto para tu IA

> Copiado de /docs/mas-funciones/whatsapp/#conversions-api. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Conversions API: el dataset y la prueba de un número oficial

- Solo números oficiales (`connection` `coexistence` o `dedicated` en `GET /api/v1/devices/{device}`) y solo la clave
  del titular de la cuenta (si no, `403`). `403 capi_feature_disabled`: la Conversions API no está habilitada para la
  cuenta; díselo a la persona y no reintentes.
- **En este orden:** `POST /api/v1/devices/{device}/capi/dataset` crea o recupera el dataset de la WABA del número
  (`waba_id`, `dataset_id`, `scope_ok`, `consented_at`, `last_verified_at`); repetirlo no crea otro. Después,
  `GET /api/v1/devices/{device}/capi/test`: comprueba el permiso `whatsapp_business_manage_events` y el dataset,
  guarda el resultado y devuelve el estado con el enlace al Administrador de eventos de Meta. La especificación no
  describe los campos de la prueba: lee los que llegan.
- `422 device_not_ready`: el número no está listo (la especificación no dice qué le falta). `422
  capi_connection_cap_reached`: la cuenta llegó al tope de conexiones de su plan. `502` (`meta_http_error`,
  `unparseable_response`): Meta no respondió bien; reintenta más tarde.
- `GET /api/v1/devices/capi/datasets`: uno por cada WABA de los números del workspace que ya tiene dataset, con el último estado
  guardado, sin consultar a Meta; por páginas. Para el estado de ahora de un número, la prueba.
- La API no tiene una llamada para mandar eventos de conversión: no le digas a la persona que puede mandar una compra
  por acá.

## Llamadas

### Ver tus datasets de Conversions API

`GET /api/v1/devices/capi/datasets` · permiso **Números de WhatsApp → Ver** · área accounts · `operationId` `capiConnection.datasets`

**Para qué sirve:** Sirve para ver, sin consultar a Meta, el último estado guardado de la Conversions API de cada cuenta de WhatsApp Business de tu cuenta que ya tiene dataset.

**Listado** · `perPage` de 1 a 100 (por defecto 25) · orden fijo: id ascendente · no acepta parámetros de orden.

Uno por cada WABA de los números del workspace que ya tiene dataset, con el último estado guardado. No
consulta a Meta: para actualizar el estado de un número, usa
`GET devices/{device}/capi/test`.

**Respuestas**

- `200` — Los datasets del workspace.
- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `402` — El pago de la cuenta o del workspace está vencido (`payment_required`). Regularízalo en el panel de Funnelchat para seguir usando esta ruta.
- `403` — La Conversions API no está habilitada para la cuenta (`capi_feature_disabled`).
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

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
