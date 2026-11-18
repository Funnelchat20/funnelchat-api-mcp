# Pausar las automatizaciones de un contacto — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/automatizaciones/pausar-las-automatizaciones-de-un-contacto/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Pausar las automatizaciones de un contacto

`POST /api/v1/contacts/{contact}/pause` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `contactAutomation.pause`

**Para qué sirve:** Úsalo para pausar a un contacto en las automatizaciones de la cuenta; las conversaciones y las difusiones permiten filtrar a los contactos pausados. La pausa no vence ni se levanta sola.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `contact` | path | string | sí |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string | Id opaco: un texto que empieza con `ctc_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `name` | string |  |
  | `email` | string |  |
  | `phone` | string |  |
  | `whatsapp_id` | string |  |
  | `whatsapp_username` | string \| null |  |
  | `has_phone` | boolean |  |
  | `country_code` | string |  |
  | `status` | integer |  |
  | `image` | string |  |
  | `notes` | string \| null |  |
  | `custom_fields` | array<ContactCustomFieldResource> |  |
  | `custom_fields[].id` | string | Id opaco: un texto que empieza con `fld_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `custom_fields[].name` | string |  |
  | `custom_fields[].description` | string |  |
  | `custom_fields[].type` | integer ∈ {0, 1, 2, 3, 4} | Tipo del campo. Se elige al crearlo y no se puede cambiar después. Indica cómo escribir su valor: (columnas: `type`, Tipo, Cómo escribir `value`, Ejemplo) 0, Texto, Cualquier texto., `"Cliente mayorista"`; 1, Numérico, Un número, con punto decimal y sin separador de miles; puede llevar `-` adelante., `"1500"`, `"99.90"`; 2, Fecha, `AAAA-MM-DD`, una fecha que exista., `"2026-11-30"`; 3, URL, La dirección completa, con `https://` o `http://`., `"https://ejemplo.com/pedido/123"`; 4, Alfanumérico, Pensado para códigos con letras y números; acepta cualquier texto., `"AB1234"`. |
  | `custom_fields[].value` | string | Valor del campo para el contacto. Siempre es un texto (`"1500"`, no `1500`). Al ponerlo con tu clave se valida contra el tipo del campo (numérico, fecha o URL) y, si no cumple su formato, la API responde 422: el formato de cada tipo está en la descripción de `type` de `GET /custom-fields`. |
  | `custom_fields[].created_at` | string |  |
  | `custom_fields[].updated_at` | string |  |
  | `custom_fields[].contact_count` | string |  |
  | `created_at` | string (date-time) \| null |  |
  | `active_conversation` | integer |  |
  | `favorite` | integer |  |
  | `unread_messages` | integer |  |
  | `manually_unread` | boolean |  |
  | `last_message` | object |  |
  | `last_message.text` | string |  |
  | `last_message.file` | string |  |
  | `last_message.date` | string |  |
  | `last_message.type` | string |  |
  | `last_message.own` | string |  |
  | `last_message.deleted_at` | string |  |
  | `last_message.deleted_scope` | string |  |
  | `device_id` | string \| null | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `adviser_id` | string \| null | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `paused_at` | string \| null |  |
  | `paused_by` |  |  |
  | `mac_date` | string \| null |  |
  | `is_mac_inactive` | boolean |  |
  | `ai_assistant_name` | string \| null |  |
  | `opted_out` | boolean |  |
  | `stage_since` | string |  |
  | `is_stagnant` | boolean |  |
  | `follow_up_date` | string \| null |  |
  | `lead_score` | object |  |
  | `lead_score.score` | integer |  |
  | `lead_score.signals_count` | integer |  |
  | `lead_score.category` | string |  |
  | `lead_score.confidence` | string |  |
  | `lead_score.disqualified` | boolean |  |
  | `lead_score.disqualified_at` | string \| null |  |
  | `lead_score.updated_at` | string \| null |  |
  | `name_mismatch` | array<any> \| null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
