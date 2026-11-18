# Ver las alertas que hay — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/alertas/ver-las-alertas-que-hay/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver las alertas que hay

`GET /api/v1/alerts/catalog` · permiso **Números de WhatsApp → Ver** · área accounts · `operationId` `alertCatalog.index`

**Para qué sirve:** Úsalo para conocer qué alertas existen (números desconectados, consumo de MACs, cobros, campañas, grupos y más), cuáles son críticas y qué significan, antes de activarlas en un destino.

Las alertas que la cuenta puede activar en un destino, con su `module` y su `action`. Las
que dependen de cómo paga la cuenta (por ejemplo, la reactivación de la suscripción) solo
aparecen si aplican a la cuenta.

**Respuestas**

- `200` — Las alertas del catálogo.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `[].module` | string |  |
  | `[].action` | string |  |
  | `[].category` | string |  |
  | `[].is_critical` | string |  |
  | `[].label` | string |  |
  | `[].tooltip` | string |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe.
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
