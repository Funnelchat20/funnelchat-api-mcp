# Crear una plantilla — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/plantillas/crear-una-plantilla/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Crear una plantilla

`POST /api/v1/templates` · permiso **Contactos y conversaciones → Editar** · área conversations · `operationId` `messageTemplate.store`

**Para qué sirve:** Sirve para crear una plantilla de WhatsApp (encabezado, cuerpo con variables, pie y botones) desde tu sistema, sin pasar por el panel: queda en la cuenta de WhatsApp Business del número oficial que eliges (`device_id`) y Meta la revisa.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `name` | string | sí |  |
| `language_code` | string ∈ {"af", "sq", "ar", "ar_EG", "ar_AE", "ar_LB", "ar_MA", "ar_QA", "az", "be_BY", "bn", "bn_IN", "bg", "ca", "zh_CN", "zh_HK", "zh_TW", "hr", "cs", "da", "prs_AF", "nl", "nl_BE", "en", "en_GB", "en_US", "en_AE", "en_AU", "en_CA", "en_GH", "en_IE", "en_IN", "en_JM", "en_MY", "en_NZ", "en_QA", "en_SG", "en_UG", "en_ZA", "et", "fil", "fi", "fr", "fr_BE", "fr_CA", "fr_CH", "fr_CI", "fr_MA", "ka", "de", "de_AT", "de_CH", "el", "gu", "ha", "he", "hi", "hu", "id", "ga", "it", "ja", "kn", "kk", "rw_RW", "ko", "ky_KG", "lo", "lv", "lt", "mk", "ms", "ml", "mr", "nb", "ps_AF", "fa", "pl", "pt_BR", "pt_PT", "pa", "ro", "ru", "sr", "si_LK", "sk", "sl", "es", "es_AR", "es_CL", "es_CO", "es_CR", "es_DO", "es_EC", "es_HN", "es_MX", "es_PA", "es_PE", "es_ES", "es_UY", "sw", "sv", "ta", "te", "th", "tr", "uk", "ur", "uz", "vi", "zu"} | sí |  |
| `category` | string ∈ {"UTILITY", "MARKETING", "AUTHENTICATION"} | sí |  |
| `type` | string ∈ {"text", "image", "document", "video", "location", "default"} | sí |  |
| `header` | string \| null | no |  |
| `file` | string | no |  |
| `body` | string | sí |  |
| `params` | array<string> \| null | no |  |
| `footer` | string \| null | no |  |
| `buttons` | array<object> \| null | no |  |
| `buttons[].text` | string | no |  |
| `buttons[].type` | string ∈ {"QUICK_REPLY", "URL", "PHONE_NUMBER"} | no |  |
| `buttons[].url` | string (uri) | no |  |
| `buttons[].phone_number` | string | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string | Id opaco: un texto que empieza con `tpl_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `name` | string |  |
  | `text` | string |  |
  | `header` | string |  |
  | `footer` | string |  |
  | `observation` | string |  |
  | `uid` | string |  |
  | `category` | string |  |
  | `type` | string ∈ {"text", "image", "document", "video", "location", "default"} \| string ∈ {""} |  |
  | `status` | string ∈ {"PENDING", "APPROVED", "REJECTED", "PENDING_DELETION", "PAUSED", "DISABLED", "ARCHIVED"} \| string ∈ {""} |  |
  | `language_code` | string |  |
  | `upload_session_id` | string |  |
  | `header_handle` | string |  |
  | `file` | string |  |
  | `params` | array<any> \| string ∈ {""} |  |
  | `buttons` | array<any> \| string ∈ {""} |  |
  | `user_id` | string | Id opaco: un texto que empieza con `usr_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `device_id` | string | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `created_at` | string (date-time) \| null |  |
  | `recategorized_at` | string (date-time) \| null |  |
  | `quick_reply_buttons` | array<any> |  |
  | `waba_id` | string \| null |  |
  | `belongs_to_current_device` | boolean |  |
  | `quality_score` | string |  |
  | `quality_updated_at` | string |  |
  | `quality` | string |  |
  | `available` | boolean |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
