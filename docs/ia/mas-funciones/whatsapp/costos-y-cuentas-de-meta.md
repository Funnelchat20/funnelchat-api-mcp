# Costos de WhatsApp y cuentas de Meta — API de Funnelchat: contexto para tu IA

> Copiado de /docs/mas-funciones/whatsapp/#costos-y-cuentas-de-meta. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Costos de WhatsApp y cuentas de WhatsApp Business (WABA)

- `GET /api/v1/me/whatsapp-costs?month=AAAA-MM`: el resumen de costos de ese mes, de los números del workspace de la
  clave (no de toda la cuenta). Sin `month`, o con uno que no es un mes válido, responde el del mes en curso **sin
  error**: revisa que mandaste `AAAA-MM` antes de decir de qué mes es.
  La especificación no describe los campos del resumen: lee los que llegan y no calcules un total que no venga.
- `GET /api/v1/me/whatsapp-business-accounts`: por páginas (`links.next`), por `id` de menor a mayor. Cada WABA trae
  `id` (el de Meta, como texto), `messaging_limit` y `devices` (`device_id` y `number`, ordenados por `device_id`).
  Una cuenta que solo tiene números por QR recibe una lista vacía: no es un error.
- `messaging_limit`: `tier`, `per_day` (`null` para `TIER_UNLIMITED` o un tier que todavía no se conoce) y
  `checked_at` (cuándo Meta lo confirmó; `null` si la última consulta no pudo reconfirmarlo). Es `null` entero si
  todavía no hay ninguna lectura. El límite es de la **cartera comercial** de Meta dueña de la WABA, no de cada
  número: dos WABA de la misma cartera tienen el mismo límite. Para enterarte cuando cambia,
  `device.messaging_limit_changed` (ver «Administrar tus números»).
- `GET /api/v1/me/whatsapp-business-accounts/{wabaId}`: lo mismo para una, con `{wabaId}` el id numérico de Meta.
  El mismo `404` si no existe, es de otra cuenta, la cuenta no tiene números de WhatsApp Cloud en ella o el id no es
  numérico.
- No traen el nombre de la WABA, su estado de revisión en Meta, la moneda ni la zona horaria (la especificación dice
  que se van a sumar como campos nuevos): no los inventes.

## Llamadas

### Ver tus costos de WhatsApp

`GET /api/v1/me/whatsapp-costs` · permiso **Números de WhatsApp → Ver** · área accounts · `operationId` `whatsappCost.index`

**Para qué sirve:** Sirve para consultar cuánto gastaste en WhatsApp en un mes (el actual o el que indiques con `month`) con los números del workspace de tu clave, por ejemplo para controlar costos o conciliar tu facturación.

`month` es el mes en `YYYY-MM`; sin `month`, o con un valor que no es un mes válido,
devuelve el mes en curso. El resumen es el de los números del workspace activo (con una clave,
el workspace de la clave).

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `month` | query | string | no |  |

**Respuestas**

- `200` — El resumen de costos del mes.
- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `402` — El pago de la cuenta o del workspace está vencido (`payment_required`). Regularízalo en el panel de Funnelchat para seguir usando esta ruta.
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe.
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Ver tus cuentas de WhatsApp Business

`GET /api/v1/me/whatsapp-business-accounts` · permiso **Números de WhatsApp → Ver** · área accounts · `operationId` `whatsAppBusinessAccount.index`

**Para qué sirve:** Úsalo para ver las cuentas de WhatsApp Business de tus números oficiales, cada una con sus números y el límite de mensajes por día que Meta le da a su cartera comercial. Los números por QR no aparecen.

**Listado** · `perPage` de 1 a 100 (por defecto 25) · orden fijo: id ascendente, como número · no acepta parámetros de orden.

Las WABA a las que pertenecen los números de WhatsApp Cloud (la API oficial de Meta) de la cuenta, cada una
con sus números (`devices`, ordenados por `device_id`).

Los números conectados por código QR no tienen WABA y **no aparecen**: una cuenta que sólo tiene números QR
recibe una lista vacía.

`messaging_limit` es el límite de mensajes que Meta le asigna a la **cartera comercial** (business portfolio)
dueña de la WABA, no a cada número: lo comparten todos los números de la cartera, y dos WABA de la misma
cartera tienen el mismo límite. Es el último valor que Funnelchat leyó de Meta: `checked_at` dice cuándo Meta lo
confirmó y es `null` si la última consulta no pudo reconfirmarlo. `per_day` es `null` para `TIER_UNLIMITED`.
`messaging_limit` es `null` si todavía no hay ninguna lectura para los números de la WABA.

Todavía no incluye el nombre de la WABA, su estado de revisión en Meta, la moneda ni la zona horaria: se van a
sumar como campos nuevos, sin cambiar los actuales.

**Respuestas**

- `200` — Las WABA de la cuenta, con sus números y su límite de mensajes.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `[].id` | string |  |
  | `[].messaging_limit` | object \| null |  |
  | `[].messaging_limit.tier` | string |  |
  | `[].messaging_limit.per_day` | integer \| null | Mensajes por día del tier; `null` para `TIER_UNLIMITED` o un tier que todavía no se conoce. |
  | `[].messaging_limit.checked_at` | string \| null |  |
  | `[].devices` | array<object> |  |
  | `[].devices[].device_id` | string | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `[].devices[].number` | string |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Ver una cuenta de WhatsApp Business

`GET /api/v1/me/whatsapp-business-accounts/{wabaId}` · permiso **Números de WhatsApp → Ver** · área accounts · `operationId` `whatsAppBusinessAccount.show`

**Para qué sirve:** Sirve para ver una de las cuentas de WhatsApp Business de tus números oficiales, por su id de Meta: sus números y el límite de mensajes por día que comparten.

Lo mismo que el listado, para una sola WABA. Responde `404` si la cuenta no tiene números de WhatsApp Cloud en
esa WABA: el mismo `404` para una WABA que no existe, que es de otra cuenta o cuyo id no es numérico.

Los números conectados por código QR no tienen WABA y **no aparecen**.

`messaging_limit` es el límite de mensajes que Meta le asigna a la **cartera comercial** (business portfolio)
dueña de la WABA, no a cada número: lo comparten todos los números de la cartera, y dos WABA de la misma
cartera tienen el mismo límite. Es el último valor que Funnelchat leyó de Meta: `checked_at` dice cuándo Meta lo
confirmó y es `null` si la última consulta no pudo reconfirmarlo. `per_day` es `null` para `TIER_UNLIMITED`.
`messaging_limit` es `null` si todavía no hay ninguna lectura para los números de la WABA.

Todavía no incluye el nombre de la WABA, su estado de revisión en Meta, la moneda ni la zona horaria: se van a
sumar como campos nuevos, sin cambiar los actuales.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `wabaId` | path | string | sí | El id de la WABA, tal como lo da Meta (numérico). |

**Respuestas**

- `200` — La WABA, con sus números y su límite de mensajes.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string |  |
  | `messaging_limit` | object \| null |  |
  | `messaging_limit.tier` | string |  |
  | `messaging_limit.per_day` | integer \| null | Mensajes por día del tier; `null` para `TIER_UNLIMITED` o un tier que todavía no se conoce. |
  | `messaging_limit.checked_at` | string \| null |  |
  | `devices` | array<object> |  |
  | `devices[].device_id` | string | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `devices[].number` | string |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `404` — La cuenta no tiene números de WhatsApp Cloud en esa WABA.
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
