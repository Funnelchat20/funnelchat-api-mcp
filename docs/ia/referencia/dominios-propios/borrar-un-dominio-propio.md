# Borrar un dominio propio — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/dominios-propios/borrar-un-dominio-propio/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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
