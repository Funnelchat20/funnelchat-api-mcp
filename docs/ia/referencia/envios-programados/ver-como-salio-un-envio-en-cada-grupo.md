# Ver cómo salió un envío en cada grupo — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/envios-programados/ver-como-salio-un-envio-en-cada-grupo/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver cómo salió un envío en cada grupo

`GET /api/v1/scheduled-messages/{scheduledMessage}/group-messages` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `scheduledMessage.groupMessages`

**Para qué sirve:** Sirve para ver el resultado del envío en cada grupo: estado, error, lecturas, reproducciones, reacciones y clics, opcionalmente para una ocurrencia puntual de un envío recurrente.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `perPage` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`). Orden: `orderBy` acepta `group_message_template.id`, `group_message_template.status`, `groups.name`, `group_message_template.created_at`; dirección `orderByMethod`: `asc` o `desc`. Otro valor responde `422`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `scheduledMessage` | path | string (uuid) | sí | The scheduled message ID |
| `name` | query | string | no |  |
| `orderBy` | query | string ∈ {"group_message_template.id", "group_message_template.status", "groups.name", "group_message_template.created_at"} | no |  |
| `orderByMethod` | query | string ∈ {"asc", "desc"} | no |  |
| `perPage` | query | integer | no |  |
| `status` | query | integer | no |  |
| `edit_status` | query | integer ∈ {1, 2, 3, 4} | no | Filtra por el resultado de la última edición del texto ya enviado. Es distinto de `status`, que es el estado de la entrega. \| \| \|---\| \| `1` <br/> El mensaje se había entregado y la edición se aplicó dentro del plazo. \| \| `2` <br/> El mensaje se había entregado, pero ya habían pasado 15 minutos desde el envío a ese grupo. \| \| `3` <br/> El mensaje salió con un número oficial, a un canal o con un número que no permite editar. \| \| `4` <br/> WhatsApp devolvió un error, o el mensaje nunca llegó al grupo. \| |
| `run` | query | string (date) | no | Fecha (`AAAA-MM-DD`, en la zona horaria de la cuenta) de una ocurrencia del envío: devuelve el resultado de cada grupo en esa ocurrencia. Sin este parámetro, devuelve el último resultado de cada grupo. |

**Respuestas**

- `200` — Resultado del envío en cada grupo, paginado.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<object> |  |
  | `data[].template_id` | string | Id opaco: un texto que empieza con `snd_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].group_id` | string | Id opaco: un texto que empieza con `grp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].group_name` | string |  |
  | `data[].campaign_name` | string |  |
  | `data[].audience` | string \| integer ∈ {0} |  |
  | `data[].schedule_message_status` | string |  |
  | `data[].error_info` | string |  |
  | `data[].totaL_readed` |  |  |
  | `data[].total_played` |  |  |
  | `data[].reactions_count` |  |  |
  | `data[].clicks` | string \| integer ∈ {0} |  |
  | `data[].sent_by` | array<string> |  |
  | `data[].attempts` | integer |  |
  | `data[].last_attempt_at` | string |  |
  | `data[].edit_status` | string \| null | Resultado de la última edición del texto enviado a este grupo (`1` editado, `2` fuera de plazo, `3` no se puede editar, `4` falló), o `null` si no se editó. El motivo viene en `edit_reason`. |
  | `data[].edit_reason` | string \| null |  |
  | `links` | object |  |
  | `links.first` | string |  |
  | `links.last` | string |  |
  | `links.prev` | string \| null |  |
  | `links.next` | string |  |
  | `meta` | object |  |
  | `meta.current_page` | integer |  |
  | `meta.from` | integer \| null |  |
  | `meta.last_page` | string |  |
  | `meta.per_page` | integer |  |
  | `meta.to` | integer \| null |  |
  | `meta.total` | string |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404` — Not found (`CommunitiesModelNotFoundException`)
- `422` — Validation error (`CommunitiesValidationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
