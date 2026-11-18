# Ver un link de alta — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/numeros/ver-un-link-de-alta/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver un link de alta

`GET /api/v1/connect-links/{link}` · permiso **Números de WhatsApp → Ver** · área accounts · `operationId` `connectLink.show`

**Para qué sirve:** Sirve para consultar en qué quedó un link de alta: si sigue pendiente, se completó o falló, qué número conectó y, si no se completó, por qué (`error_code`).

El estado actual del link, sin la URL. `error_code` explica por qué no se completó:
`link_expired`, `already_used`, `revoked`, `quota_exceeded`, `trial_number_blocked`,
`facebook_auth_failed`, `meta_error`, `number_not_owned`, `qr_timeout` o `provider_error`.
Un link `meta` sigue `pending` (sin `error_code`) después de un intento fallido de Facebook
o de Meta, y pasa a `failed` al quinto.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `link` | path | string | sí |  |

**Respuestas**

- `200`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | ConnectLinkResource |  |
  | `data.id` | string | Id opaco: un texto que empieza con `lnk_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.type` | string |  |
  | `data.status` | string |  |
  | `data.url` | string |  |
  | `data.expires_at` | string |  |
  | `data.allowed_connection_types` | array<string> \| null |  |
  | `data.provision_us_number` | boolean |  |
  | `data.country` | string \| null |  |
  | `data.device_id` | string \| null | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.external_reference` | string \| null |  |
  | `data.return_url` | string \| null |  |
  | `data.error_code` | string \| null |  |
  | `data.created_at` | string \| null |  |
  | `data.completed_at` | string \| null |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_permission_denied`: el usuario de la clave no tiene ese permiso en su workspace (su rol no lo incluye).
- `404` — El link no existe o no es de la cuenta.
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
