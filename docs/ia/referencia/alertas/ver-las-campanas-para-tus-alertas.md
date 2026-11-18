# Ver las campañas para tus alertas — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/alertas/ver-las-campanas-para-tus-alertas/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver las campañas para tus alertas

`GET /api/v1/alerts/campaigns` · permiso **Números de WhatsApp → Ver** · área accounts · `operationId` `alertCampaign.index`

**Para qué sirve:** Sirve para listar, con búsqueda por nombre, las campañas de grupos que puedes elegir al configurar alertas como el reporte diario.

**Listado** · `perPage` de 1 a 100 (por defecto 25); también `per_page` · orden fijo: id ascendente · no acepta parámetros de orden.

Las campañas del workspace por defecto, para elegir cuáles entran en el reporte diario. El
reporte es de toda la cuenta: con una clave, esta ruta solo la puede usar una clave del
workspace por defecto. `search` filtra por nombre.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `page` | query | integer \| null | no |  |
| `per_page` | query | integer \| null | no |  |
| `search` | query | string \| null | no |  |

**Respuestas**

- `200` — Las campañas, paginadas.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<AlertCampaignResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `cmp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].uuid` | string |  |
  | `data[].name` | string |  |
  | `data[].is_active` | boolean |  |
  | `data[].groups_count` | integer |  |
  | `data[].type` | integer \| null |  |
  | `links` | object |  |
  | `links.first` | string \| null |  |
  | `links.last` | string \| null |  |
  | `links.prev` | string \| null |  |
  | `links.next` | string \| null |  |
  | `meta` | object |  |
  | `meta.current_page` | integer |  |
  | `meta.from` | integer \| null |  |
  | `meta.last_page` | integer |  |
  | `meta.links` | array<object> | Generated paginator links. |
  | `meta.path` | string \| null | Base path for paginator generated URLs. |
  | `meta.per_page` | integer | Number of items shown per page. |
  | `meta.to` | integer \| null | Number of the last item in the slice. |
  | `meta.total` | integer | Total number of items being paginated. |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_account_level`: es de la cuenta entera y solo la usa una clave del workspace por defecto; `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `422` — Validation error (`AccountsValidationException`)
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`
- `503` — Las campañas no se pueden leer en este momento (`groups_unavailable`). Vuelve a intentarlo.

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
