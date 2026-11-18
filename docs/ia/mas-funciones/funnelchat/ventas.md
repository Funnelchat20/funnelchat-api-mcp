# Ventas — API de Funnelchat: contexto para tu IA

> Copiado de /docs/mas-funciones/funnelchat/#ventas. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Ventas

- Las cinco llamadas solo leen. No hay llamada para conectar una plataforma de pagos ni para registrar una venta, y no
  hay eventos de ventas: no prometas enterarte en el momento; consulta cuando la persona lo pide, no en un bucle.
- **`window`** son días: `7`, `30` o `90` (30 si no lo mandas; otro valor, `422`), contados en la zona horaria de la
  cuenta (UTC si no tiene una) e incluyendo hoy. `event_type[]`: `approved`, `pending`, `rejected`, `cancelled`, `refunded`, `chargeback`,
  `abandoned_cart`.
- **Ver tus ventas** (`GET /api/v1/sales`) es la única lista: por páginas, con `perPage` y `links.next`. Cada venta trae
  `id`, `occurred_at`, `platform`, `product_name`, `kind` y `attribution` (sin describir), `event_type`,
  `amount_minor`, `currency` y `buyer` (`contact_id`, `name`, `phone`, o `null`). Con `buyer.contact_id` lees el
  contacto en `GET /api/v1/contacts/{contact}`.
- **Métricas, embudo y por plataforma** aceptan `page` y `per_page`, sin descripción todavía en la especificación,
  aunque no son listas. Métricas: `window`, `currencies`, `distinct_buyers` y `repeat_purchase_rate`, declarados como
  texto sin forma: muéstralos tal cual llegan. Embudo: `conversations`, `qualified` (puede ser `null`) y `purchases`
  (`buyers` y `amounts`, sin forma descrita). Por plataforma: `platforms`, cada una con `platform`, `connected` y
  `totals` (`currency`, `total_minor`).
- **Montos:** `amount_minor`, `total_minor` y `average_ticket_minor` son enteros en la unidad menor de la moneda:
  centavos en las monedas con dos decimales (divide por 100 para mostrarlos); en `CLP`, `COP`, `JPY` y `PYG`, que no
  tienen decimales, son unidades enteras. Cada monto trae su `currency` (código ISO 4217) y los totales vienen
  agrupados por moneda, sin convertir: no sumes montos de monedas distintas. Un reembolso es una fila aparte, con monto
  negativo.
- **Productos** (`GET /api/v1/payments/products/{platform}`): la especificación no enumera los valores de `{platform}`;
  el candidato es el `platform` de «Ver las ventas por plataforma», sin confirmar. Si responde `404`, díselo a la
  persona. Cada producto trae `external_product_id` y `name`.

## Llamadas

### Ver tus ventas

`GET /api/v1/sales` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `salesDashboard.index`

**Para qué sirve:** Úsalo para traer el detalle de ventas (producto, monto en la unidad menor de su moneda, plataforma, estado, comprador y atribución) de los últimos 7, 30 o 90 días, por ejemplo para conciliar con tu sistema.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `window` | query | integer ∈ {"7", "30", "90"} | no |  |
| `page` | query | integer | no |  |
| `event_type[]` | query | array<string ∈ {"approved", "pending", "rejected", "cancelled", "refunded", "chargeback", "abandoned_cart"}> | no |  |
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<SaleResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `sal_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].occurred_at` | string |  |
  | `data[].platform` | string |  |
  | `data[].product_name` | string \| null |  |
  | `data[].kind` | string |  |
  | `data[].event_type` | string \| null |  |
  | `data[].amount_minor` | integer |  |
  | `data[].currency` | string |  |
  | `data[].attribution` | string |  |
  | `data[].buyer` | object \| null |  |
  | `links` | object |  |
  | `links.first` | string \| null |  |
  | `links.last` | string \| null |  |
  | `links.prev` | string \| null |  |
  | `links.next` | string \| null |  |
  | `meta` | object |  |
  | `meta.current_page` | integer |  |
  | `meta.from` | integer \| null |  |
  | `meta.last_page` | integer |  |
  | `meta.links` | array<object> |  |
  | `meta.path` | string |  |
  | `meta.per_page` | integer |  |
  | `meta.to` | integer \| null |  |
  | `meta.total` | integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver las métricas de ventas

`GET /api/v1/sales/metrics` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `salesDashboard.metrics`

**Para qué sirve:** Sirve para obtener métricas de ventas de los últimos 7, 30 o 90 días: totales por moneda, compradores distintos y tasa de recompra. Ideal para un tablero comercial.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `window` | query | integer ∈ {"7", "30", "90"} | no |  |
| `page` | query | integer | no |  |
| `per_page` | query | integer | no |  |
| `event_type[]` | query | array<string ∈ {"approved", "pending", "rejected", "cancelled", "refunded", "chargeback", "abandoned_cart"}> | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `window` | string |  |
  | `currencies` | string |  |
  | `distinct_buyers` | string |  |
  | `repeat_purchase_rate` | string |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver el embudo de ventas

`GET /api/v1/sales/funnel` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `salesDashboard.funnel`

**Para qué sirve:** Úsalo para ver el embudo de conversaciones a leads calificados y a compras en una ventana de 7, 30 o 90 días, y medir cuánto convierte tu atención por WhatsApp.

**Parámetros**

La misma tabla que en «Ver las métricas de ventas», más arriba en este texto.

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `conversations` | integer |  |
  | `qualified` | integer \| null |  |
  | `purchases` | object |  |
  | `purchases.buyers` | integer |  |
  | `purchases.amounts` | array<any> |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver las ventas por plataforma

`GET /api/v1/sales/by-platform` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `salesDashboard.byPlatform`

**Para qué sirve:** Sirve para comparar las ventas por plataforma de pagos en la ventana elegida y ver cuáles están conectadas.

**Parámetros**

La misma tabla que en «Ver las métricas de ventas», más arriba en este texto.

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `platforms` | array<object> |  |
  | `platforms[].platform` | string |  |
  | `platforms[].connected` | boolean |  |
  | `platforms[].totals` | array<object> |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver los productos de una plataforma de pagos

`GET /api/v1/payments/products/{platform}` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `paymentProduct.index`

**Para qué sirve:** Sirve para listar los productos de una plataforma de pagos con su ID externo y nombre, por ejemplo para relacionarlos con las ventas que reporta Funnelchat.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `platform` | path | string | sí |  |
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<PaymentProductResource> |  |
  | `data[].external_product_id` | string |  |
  | `data[].name` | string \| null |  |
  | `links` | object |  |
  | `links.first` | string \| null |  |
  | `links.last` | string \| null |  |
  | `links.prev` | string \| null |  |
  | `links.next` | string \| null |  |
  | `meta` | object |  |
  | `meta.current_page` | integer |  |
  | `meta.from` | integer \| null |  |
  | `meta.last_page` | integer |  |
  | `meta.links` | array<object> |  |
  | `meta.path` | string |  |
  | `meta.per_page` | integer |  |
  | `meta.to` | integer \| null |  |
  | `meta.total` | integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
