# Ver el QR de un número — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/numeros/ver-el-qr-de-un-numero/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Ver el QR de un número

`GET /api/v1/devices/{device}/qr` · permiso **Números de WhatsApp → Crear, conectar y borrar** · área accounts · `operationId` `deviceProvisioning.qr`

**Para qué sirve:** Úsalo para mostrar en tu sistema el código QR de un número por QR y saber cuándo quedó conectado: devuelve la imagen, si ya está conectado y en cuántos segundos volver a pedirlo.

> 🔑 **Da el control de un WhatsApp.** Por eso pide **Números de WhatsApp → Crear, conectar y borrar**: crear un número ocupa un lugar del plan, y quien escanee su QR o use un link de alta conecta un teléfono a esta cuenta. Trata el QR y la URL del link como un secreto.

El código QR para conectar un número por QR: se escanea con la app de WhatsApp
(Dispositivos vinculados). Si el número todavía no tiene sesión con el proveedor, la crea.
Cada llamada trae el código de ese momento: WhatsApp lo cambia cada pocos segundos hasta
que se escanea, y uno viejo no vincula («no se puede vincular el dispositivo ahora»).
Pídelo de nuevo cada `expires_in` segundos (hoy **5**, la misma cadencia del panel) y
reemplaza la imagen con la última; no guardes ni reenvíes un QR. Con el número conectado,
`connected` es `true` y `qr_code` es `null`; también llega el webhook `device.connected`.

`qr_code` es una imagen PNG en data URI (`data:image/png;base64,...`), o `null` mientras la
sesión arranca: en ese caso deja de mostrar el QR anterior y vuelve a pedirlo después de
`expires_in` segundos.

Solo para números por QR: un número oficial responde `422 provider_unsupported`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí | The device ID |

**Respuestas**

- `200`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | object |  |
  | `data.connected` | boolean |  |
  | `data.qr_code` | string \| null |  |
  | `data.expires_in` | integer |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `402` — El pago de la cuenta o del workspace está vencido (`payment_required`). Regularízalo en el panel de Funnelchat para seguir usando esta ruta.
- `403` — No queda lugar en el plan (`number_limit_reached`) o quien llama no es el titular (`connect_not_allowed`).
- `404` — Not found (`AccountsModelNotFoundException`)
- `409` — El número escaneado ya tuvo una prueba gratis (`trial_number_blocked`), es oficial sin coexistencia (`qr_requires_coexistence`), está suspendido por el plan (`number_suspended_by_plan`), desactivado (`device_inactive`) o se generaron demasiados QR hoy (`provisioning_quota_exceeded`).
- `422` — El número es oficial: no tiene QR (`provider_unsupported`).
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`
- `502` — El proveedor de WhatsApp no respondió (`provider_error`). Vuelve a intentarlo.

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
