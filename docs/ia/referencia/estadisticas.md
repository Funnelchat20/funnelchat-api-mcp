# Estadísticas — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/estadisticas/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver los participantes por período

`GET /api/v1/stats/participants` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `stats.participantStats`

**Para qué sirve:** Sirve para graficar entradas y salidas de participantes por hora, día o mes en tus grupos o campañas, en un rango de hasta 366 días.

**Con API key:** `start_date` y `end_date` son obligatorios, con formato `AAAA-MM-DD`, y el rango entre los dos, ambos incluidos, admite como máximo 366 días (un año completo, bisiesto incluido). Si falta una de las dos fechas, si una es inválida, si `end_date` es anterior a `start_date` o si el rango es mayor, responde `422`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `start_date` | query | string (date-time) | no |  |
| `end_date` | query | string (date-time) | no |  |
| `unit` | query | string ∈ {"day", "month", "hour"} | no |  |
| `type` | query | string ∈ {"in", "out"} | no |  |
| `target` | query | string ∈ {"groups", "campaigns"} | no |  |
| `ids[]` | query | array<string> | no |  |
| `fill_missing` | query | boolean | no |  |

**Respuestas**

- `200`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `in` | object |  |
  | `in.data` | array<string> |  |
  | `in.total_participants` | string |  |
  | `out` | object |  |
  | `out.data` | array<string> |  |
  | `out.total_participants` | string |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Ver los participantes activos

`GET /api/v1/stats/active-participants` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `stats.activeParticipants`

**Para qué sirve:** Úsalo para ver cómo evolucionan los participantes activos e inactivos por período en tus grupos o campañas, por ejemplo para seguir el nivel de actividad de tu comunidad.

**Con API key:** `start_date` y `end_date` son obligatorios, con formato `AAAA-MM-DD`, y el rango entre los dos, ambos incluidos, admite como máximo 366 días (un año completo, bisiesto incluido). Si falta una de las dos fechas, si una es inválida, si `end_date` es anterior a `start_date` o si el rango es mayor, responde `422`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `start_date` | query | string (date-time) | no |  |
| `end_date` | query | string (date-time) | no |  |
| `unit` | query | string ∈ {"day", "month", "hour"} | no |  |
| `target` | query | string ∈ {"groups", "campaigns"} | no |  |
| `ids[]` | query | array<string> | no |  |
| `status` | query | string ∈ {"active", "inactive"} | no |  |

**Respuestas**

- `200`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `active` | object |  |
  | `active.data` | array<object> |  |
  | `active.total_participants` | string |  |
  | `inactive` | object |  |
  | `inactive.data` | array<object> |  |
  | `inactive.total_participants` | string |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Ver tus grupos por estado

`GET /api/v1/stats/groups` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `stats.groupStats`

**Para qué sirve:** Sirve para seguir cuántos grupos tienes en cada estado a lo largo del tiempo, por hora, día o mes.

**Con API key:** `start_date` y `end_date` son obligatorios, con formato `AAAA-MM-DD`, y el rango entre los dos, ambos incluidos, admite como máximo 366 días (un año completo, bisiesto incluido). Si falta una de las dos fechas, si una es inválida, si `end_date` es anterior a `start_date` o si el rango es mayor, responde `422`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `start_date` | query | string (date-time) | no |  |
| `end_date` | query | string (date-time) | no |  |
| `unit` | query | string ∈ {"day", "month", "hour"} | sí |  |
| `fill_missing` | query | boolean | no |  |

**Respuestas**

- `200`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<string> |  |
  | `total_groups` | string |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Ver los clics en tus links

`GET /api/v1/stats/clicks` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `stats.clickStats`

**Para qué sirve:** Úsalo para medir los clics en los links de tus grupos o campañas por período y comparar cuáles atraen más tráfico.

**Con API key:** `start_date` y `end_date` son obligatorios, con formato `AAAA-MM-DD`, y el rango entre los dos, ambos incluidos, admite como máximo 366 días (un año completo, bisiesto incluido). Si falta una de las dos fechas, si una es inválida, si `end_date` es anterior a `start_date` o si el rango es mayor, responde `422`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `start_date` | query | string (date-time) | no |  |
| `end_date` | query | string (date-time) | no |  |
| `unit` | query | string ∈ {"day", "month", "hour"} | no |  |
| `target` | query | string ∈ {"groups", "campaigns"} | no |  |
| `ids[]` | query | array<string> | no |  |
| `fill_missing` | query | boolean | no |  |

**Respuestas**

- `200`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<string> |  |
  | `total_clicks` | string |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Ver el registro de clics

`GET /api/v1/stats/records` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `stats.statsRecords`

**Para qué sirve:** Sirve para bajar los registros individuales de tus grupos o campañas (país, dispositivo, navegador, referencia, grupo y datos de contacto si los hay), filtrando por fecha, país o dispositivo.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `per_page` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`).

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `start_date` | query | string (date-time) | no |  |
| `end_date` | query | string (date-time) | no |  |
| `target` | query | string ∈ {"groups", "campaigns"} | no |  |
| `ids[]` | query | array<string> | no |  |
| `page` | query | integer | no |  |
| `per_page` | query | integer | no |  |
| `devices[]` | query | array<string> | no |  |
| `countries[]` | query | array<string> | no |  |
| `search` | query | string | no |  |

**Respuestas**

- `200`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<object> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `clk_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].address` | string |  |
  | `data[].browser` | string |  |
  | `data[].country` | string |  |
  | `data[].device` | string |  |
  | `data[].language` | string |  |
  | `data[].platform` | string |  |
  | `data[].referrer` | string |  |
  | `data[].group` | object |  |
  | `data[].phone` | string |  |
  | `data[].email` | string |  |
  | `data[].name` | string |  |
  | `data[].metadata` |  |  |
  | `data[].created_at` | string |  |
  | `data[].updated_at` | string |  |
  | `total` | integer |  |
  | `per_page` | string \| integer ∈ {50} |  |
  | `current_page` | string \| integer ∈ {1} |  |
  | `last_page` | number |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Ver las métricas por país

`GET /api/v1/stats/country-metrics` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `stats.countryMetrics`

**Para qué sirve:** Úsalo para analizar tu audiencia por país: contactos, clics, entradas, tasa de entrada y salidas en tus grupos o campañas.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `start_date` | query | string (date-time) | no |  |
| `end_date` | query | string (date-time) | no |  |
| `target` | query | string ∈ {"groups", "campaigns"} | no |  |
| `ids[]` | query | array<string> | no |  |
| `countries[]` | query | array<string> | no |  |

**Respuestas**

- `200`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | object |  |
  | `data.summary` | object |  |
  | `data.countries` | array<object> |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
