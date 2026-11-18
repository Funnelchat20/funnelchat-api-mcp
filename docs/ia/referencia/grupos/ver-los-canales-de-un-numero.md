# Ver los canales de un número — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/grupos/ver-los-canales-de-un-numero/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver los canales de un número

`GET /api/v1/devices/{device}/channels` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `group.channels`

**Para qué sirve:** Sirve para ver los canales de WhatsApp de un número sin pasar por una campaña, con sus identificadores.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `pageSize` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`).

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí |  |
| `name` | query | string \| null | no |  |
| `page` | query | integer | no |  |
| `pageSize` | query | integer | no |  |

**Respuestas**

- `200` — Array of `ChannelMinResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<ChannelMinResource> |  |
  | `data[].id` | string \| null |  |
  | `data[].uid` | string \| null |  |
  | `data[].name` | string \| string ∈ {""} |  |
  | `data[].description` | string \| string ∈ {""} |  |
  | `data[].state` | string \| null |  |
  | `data[].subscribers_count` | integer |  |
  | `data[].invite_link` | string \| null |  |
  | `data[].verification` | string \| null |  |
  | `data[].picture` | string \| null |  |
  | `data[].preview` | string \| null |  |
  | `data[].creation_time` | integer \| null |  |
  | `data[].mute` | string \| null |  |
  | `data[].role` | string \| null |  |
  | `data[].group_id` | string \| null | Id opaco: un texto que empieza con `grp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `meta` | object |  |
  | `meta.current_page` |  |  |
  | `meta.last_page` |  |  |
  | `meta.per_page` |  |  |
  | `meta.total` | integer |  |

- `400`
- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404`
- `422` — Validation error (`CommunitiesValidationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
