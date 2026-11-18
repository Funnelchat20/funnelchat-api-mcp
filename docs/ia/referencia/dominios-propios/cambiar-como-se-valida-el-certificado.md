# Cambiar cómo se valida el certificado — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/dominios-propios/cambiar-como-se-valida-el-certificado/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Cambiar cómo se valida el certificado

`POST /api/v1/custom-domains/{customDomain}/switch-validation` · permiso **Números de WhatsApp → Editar** · área accounts · `operationId` `customDomain.switchValidationMethod`

**Para qué sirve:** Sirve para cambiar el método de validación SSL entre HTTP y TXT; usa TXT cuando el CNAME todavía no apunta y la validación por HTTP no puede completarse.

`method` es `HTTP` (por defecto: el certificado se emite cuando el registro DNS del
dominio ya apunta) o `TXT` (se valida con un registro TXT, para un dominio que todavía no
puede apuntar). Con `TXT`, `dns_records` trae también el registro TXT; si todavía no
aparece, lo trae la próxima verificación (`POST custom-domains/{customDomain}/verify`).

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `customDomain` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `method` | string ∈ {"TXT", "HTTP"} | sí | Cómo se valida el certificado de un dominio propio. `HTTP` (por defecto): el certificado se emite cuando el registro DNS del dominio ya apunta, sin registro TXT. `TXT`: se valida con un registro TXT, para un dominio que todavía no puede apuntar; se elige con `POST custom-domains/{customDomain}/switch-validation`. |

**Respuestas**

- `200` — El dominio, con el método de validación nuevo.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string | Id opaco: un texto que empieza con `dom_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `hostname` | string |  |
  | `status` | string |  |
  | `ssl` | object |  |
  | `ssl.validation_method` | string |  |
  | `ssl.validation_string` | string \| null |  |
  | `dns_records` | array<object> |  |
  | `dns_records[].type` | "ALIAS" |  |
  | `dns_records[].host` | "@" |  |
  | `dns_records[].value` | string |  |
  | `dns_records[].purpose` | string |  |
  | `detected_provider` | string \| null | El proveedor de DNS que se detectó para el dominio, como pista para saber dónde crear los registros. `null` si no se pudo detectar. |
  | `created_at` | string \| null |  |
  | `updated_at` | string \| null |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `402` — El pago de la cuenta o del workspace está vencido (`payment_required`). Regularízalo en el panel de Funnelchat para seguir usando esta ruta.
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe.
- `404` — El dominio no existe o no es de la cuenta.
- `422` — Validation error (`AccountsValidationException`)
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`
- `502` — No se pudo cambiar el método en este momento; no cambió nada. Vuelve a intentarlo.

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
