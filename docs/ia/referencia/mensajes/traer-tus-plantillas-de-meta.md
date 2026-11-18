# Traer tus plantillas de Meta — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/mensajes/traer-tus-plantillas-de-meta/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Traer tus plantillas de Meta

`POST /api/v1/devices/{device}/templates` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `messageTemplate.sync`

**Para qué sirve:** Úsalo si creaste o cambiaste una plantilla directamente en Meta y todavía no aparece en tu lista (llegan solas una vez por día): la trae en el momento. Solo con números oficiales de WhatsApp. Si responde `in_progress`, vuelve a listar en unos segundos.

Sincroniza con Meta las plantillas de un número de la API oficial de WhatsApp: trae las que se crearon o cambiaron directamente en Meta y quita las de una cuenta de WhatsApp Business que el número ya no usa. `{device}` es el `id` del número.

- **Asíncrona:** la primera página (hasta 100 plantillas) se lee en el momento y las siguientes en segundo plano. Responde 202 con `status`: `completed` si ya terminó, `in_progress` si sigue. Las plantillas sincronizadas se listan con `GET /templates`.
- **Una a la vez:** mientras hay una sincronización de ese número en curso, otra llamada responde 409 y no lanza una nueva.
- **Errores de Meta:** si Meta rechaza la lectura (por ejemplo, porque el token del número venció o la cuenta de WhatsApp Business no existe), responde 422 `meta_rejected` con el código de error de Meta en `meta_code` y no sincroniza nada.

| HTTP | `error` | Cuándo |
|---|---|---|
| 404 | — | El número no existe en tu cuenta o está fuera del workspace de tu clave. |
| 409 | `template_sync_in_progress` | Ya hay una sincronización de ese número en curso. |
| 422 | `number_not_connected_to_meta` | El número está conectado por QR o no tiene una cuenta de WhatsApp Business o credenciales en Meta. |
| 422 | `meta_rejected` | Meta rechazó la lectura de las plantillas (`meta_code` trae su código de error). |
| 429 | — | Demasiadas solicitudes por minuto (ver `Retry-After`). |
| 502 | `meta_unavailable` | Meta no respondió. |

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí |  |

**Respuestas**

- `202` — Accepted

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `status` | string ∈ {"in_progress", "completed"} |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found
- `409` — Conflict
- `422` — Unprocessable Content
- `502` — Bad Gateway

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
