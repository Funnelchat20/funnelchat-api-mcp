# Ver las métricas de una plantilla — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/plantillas/ver-las-metricas-de-una-plantilla/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver las métricas de una plantilla

`GET /api/v1/templates/{template}/metrics` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `message.templateMetrics`

**Para qué sirve:** Úsalo para medir una plantilla de un número oficial con lo que informa Meta: enviados, entregados, leídos y clics por botón, día por día y en total, hasta 90 días.

Devuelve lo que Meta informa de una plantilla de un número de la API oficial de WhatsApp, día por día (UTC) y en total: mensajes enviados, entregados y leídos, clics por botón y, cuando Meta lo informa, el costo.

- **Rango:** `from` y `to` (AAAA-MM-DD, UTC, ambos inclusive), los dos o ninguno. Sin ellos: los últimos 7 días, hoy incluido. El rango llega hasta 90 días contando hoy; `to` no puede ser una fecha futura. Un rango inválido responde 422 con el detalle por campo.
- **Días sin datos:** aparecen con los conteos en cero y `cost` en `null`.
- **Lecturas y clics:** Meta los registra sólo durante los 7 días posteriores al envío; después puede informarlos en cero.
- **Clics:** sólo en plantillas de categoría MARKETING o UTILITY.
- **Costo:** `null` cuando Meta no lo informa (por ejemplo, si la cuenta de WhatsApp Business usa la línea de crédito de un socio).
- **Activación:** las métricas de plantillas tienen que estar activadas en el Administrador de WhatsApp de la cuenta. Funnelchat no las activa por ti: Meta no permite desactivarlas después.
- **Frescura:** las respuestas exitosas de Meta se guardan 15 minutos; los errores no se guardan, así que reintentar después de un error vuelve a consultar a Meta (y cuenta en el límite). `fetched_at` dice cuándo se leyó.
- **Límite:** hasta 60 consultas a Meta por hora por cuenta, en una ventana de una hora que arranca con la primera consulta y se reinicia al cumplirse (`Retry-After` indica cuántos segundos faltan); las respuestas guardadas no cuentan y una lectura puede usar hasta 3 consultas si Meta la entrega en varias páginas.

| HTTP | `error` | Cuándo |
|---|---|---|
| 404 | — | La plantilla no existe en tu cuenta. |
| 422 | `template_metrics_not_available_for_qr` | El número de la plantilla está conectado por QR. |
| 422 | `template_not_in_meta` | La plantilla todavía no tiene identificador en Meta. |
| 422 | `number_not_connected_to_meta` | El número no tiene cuenta de WhatsApp Business o credenciales válidas. |
| 422 | `template_waba_mismatch` | La plantilla es de otra cuenta de WhatsApp Business que la actual del número. |
| 422 | `template_analytics_not_enabled` | Las métricas de plantillas no están activadas en la cuenta. |
| 422 | `template_analytics_not_available_yet` | Meta todavía no tiene métricas para la cuenta. |
| 429 | `template_metrics_rate_limited` | Se agotaron las consultas a Meta de la hora (ver `Retry-After`). |
| 429 | — | Demasiadas solicitudes por minuto (ver `Retry-After`). |
| 503 | `meta_rate_limited` | Meta está limitando las consultas (ver `Retry-After`). |
| 502 | `meta_unavailable` | Meta no respondió correctamente. |

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `template` | path | string | sí |  |
| `from` | query | string (date) \| null | no |  |
| `to` | query | string (date) \| null | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | TemplateMetricsResource |  |
  | `data.template_id` | string | Id opaco: un texto que empieza con `tpl_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.from` | string |  |
  | `data.to` | string |  |
  | `data.timezone` | "UTC" |  |
  | `data.granularity` | "day" |  |
  | `data.fetched_at` | string |  |
  | `data.totals` | object |  |
  | `data.days` | array<object> |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
