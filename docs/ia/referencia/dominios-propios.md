# Dominios propios — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/dominios-propios/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver tus dominios propios

`GET /api/v1/custom-domains` · permiso **Números de WhatsApp → Ver** · área accounts · `operationId` `customDomain.index`

**Para qué sirve:** Úsalo para ver tus dominios propios con su estado, el SSL y los registros DNS que tienes que cargar.

**Listado** · `perPage` de 1 a 100 (por defecto 25) · orden fijo: id ascendente · no acepta parámetros de orden.

**Respuestas**

- `200` — Los dominios del workspace.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `[].id` | string | Id opaco: un texto que empieza con `dom_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `[].hostname` | string |  |
  | `[].status` | string |  |
  | `[].ssl` | object |  |
  | `[].ssl.validation_method` | string |  |
  | `[].ssl.validation_string` | string \| null |  |
  | `[].dns_records` | array<object> |  |
  | `[].dns_records[].type` | "ALIAS" |  |
  | `[].dns_records[].host` | "@" |  |
  | `[].dns_records[].value` | string |  |
  | `[].dns_records[].purpose` | string |  |
  | `[].detected_provider` | string \| null | El proveedor de DNS que se detectó para el dominio, como pista para saber dónde crear los registros. `null` si no se pudo detectar. |
  | `[].created_at` | string \| null |  |
  | `[].updated_at` | string \| null |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `402` — El pago de la cuenta o del workspace está vencido (`payment_required`). Regularízalo en el panel de Funnelchat para seguir usando esta ruta.
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe.
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Registrar un dominio propio

`POST /api/v1/custom-domains` · permiso **Números de WhatsApp → Editar** · área accounts · `operationId` `customDomain.store`

**Para qué sirve:** Sirve para registrar un dominio tuyo, como `go.mimarca.com`, para el servicio de redirección de Funnelchat. Después tienes que crear en tu DNS los registros que indica para que se valide.

`hostname` es el dominio, por ejemplo `go.mimarca.com` (si llega con `https://` o con una
ruta, se toma solo el dominio). El dominio nace `PENDING_DNS`: `dns_records` trae el
registro que hay que crear en el DNS del dominio. Después, `POST
custom-domains/{customDomain}/verify` comprueba si ya está y actualiza `status`.

La validación del certificado es `HTTP` por defecto. Si el registro no puede apuntar
todavía, `POST custom-domains/{customDomain}/switch-validation` la cambia a `TXT`.
`detected_provider` es el proveedor de DNS que se detectó para el dominio, o `null`.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `hostname` | string | sí |  |

**Respuestas**

- `201` — El dominio registrado, con los registros DNS que hay que crear.

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
- `422` — El dominio no es válido o ya está registrado.
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`
- `502` — No se pudo registrar el dominio en este momento; no se guardó nada. Vuelve a intentarlo.

### Verificar un dominio propio

`POST /api/v1/custom-domains/{customDomain}/verify` · permiso **Números de WhatsApp → Editar** · área accounts · `operationId` `customDomain.verify`

**Para qué sirve:** Úsalo después de publicar los registros DNS para forzar ya la validación del dominio, en lugar de esperar al chequeo automático.

Vuelve a comprobar los registros DNS y el certificado del dominio, sin esperar a la
próxima comprobación automática, y devuelve el dominio con su `status`: `PENDING_DNS`,
`PENDING_SSL`, `ACTIVE` o `FAILED`. El resultado puede tardar unos minutos: si todavía no
es `ACTIVE`, vuelve a verificarlo más tarde.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `customDomain` | path | string | sí |  |

**Respuestas**

- `200` — El dominio, con su estado actualizado.

  La misma tabla que en «Registrar un dominio propio», más arriba en este texto.

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `402` — El pago de la cuenta o del workspace está vencido (`payment_required`). Regularízalo en el panel de Funnelchat para seguir usando esta ruta.
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe.
- `404` — El dominio no existe o no es de la cuenta.
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`
- `502` — No se pudo verificar el dominio en este momento; su estado no cambió. Vuelve a intentarlo.

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

  La misma tabla que en «Registrar un dominio propio», más arriba en este texto.

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `402` — El pago de la cuenta o del workspace está vencido (`payment_required`). Regularízalo en el panel de Funnelchat para seguir usando esta ruta.
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe.
- `404` — El dominio no existe o no es de la cuenta.
- `422` — Validation error (`AccountsValidationException`)
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`
- `502` — No se pudo cambiar el método en este momento; no cambió nada. Vuelve a intentarlo.

### Borrar un dominio propio

`DELETE /api/v1/custom-domains/{customDomain}` · permiso **Números de WhatsApp → Crear, conectar y borrar** · área accounts · `operationId` `customDomain.destroy`

> **No se puede deshacer.** Pide confirmación explícita antes de llamarla (`references/shared/limites-de-ejecucion.md`).

**Para qué sirve:** Úsalo para dar de baja un dominio propio: deja de usarse de inmediato. No se puede deshacer. Requiere **Números de WhatsApp → Crear, conectar y borrar**.

> ⚠️ **No se puede deshacer:** el dominio propio se borra y deja de usarse de inmediato.

El dominio deja de funcionar en el momento. No se puede deshacer: para volver a usarlo hay
que registrarlo otra vez.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `customDomain` | path | string | sí |  |

**Respuestas**

- `204` — Borrado.
- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `402` — El pago de la cuenta o del workspace está vencido (`payment_required`). Regularízalo en el panel de Funnelchat para seguir usando esta ruta.
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe.
- `404` — El dominio no existe o no es de la cuenta.
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
