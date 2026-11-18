# Tu cuenta y tu equipo — API de Funnelchat: contexto para tu IA

> Copiado de /docs/mas-funciones/funnelchat/#cuenta-y-equipo. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Tu cuenta, tus contactos activos y tu equipo

- `GET /api/v1/me` (**Números de WhatsApp → Ver**): la cuenta dueña de la clave, según su descripción: su nombre, su
  plan y sus límites; los conteos de números y de agentes son los del workspace de la clave, y `numbers_capacity` es el
  cupo que se aplica cuando esa clave crea un número. Si el workspace paga su propio plan, el plan, sus límites y el
  saldo de contactos activos son los de ese workspace; si no, los de la cuenta. Con una clave no trae el email, el
  teléfono ni las fechas de inicio de sesión del dueño, ni datos de cobro, ni datos de otros workspaces. **La especificación no describe
  los campos de esa respuesta:** lee los que llegan antes de depender de uno, y no le prometas a la persona un dato que
  no venga.
- `GET /api/v1/mac/status` (**Contactos y conversaciones → Ver**) responde una de dos formas, que la especificación
  declara sin decir cuándo llega cada una: `current_count`, `limit`, `remaining`, `usage_percentage`, `state`,
  `grace` y `period_start` (los dos en `null`), `enforcement_enabled` y `unlimited`; o `mac_count`, `mac_limit`,
  `cycle_capacity`, `accumulated_available`, `total_available`, `usage_percentage`, `enforcement_enabled`,
  `alert_level`, `expiring_buckets` (`amount`, `expires_in_days`), `buckets` (`source`, `macs_remaining`,
  `expires_at`), `state`, `grace` (`grace_period_id`, `started_at`, `expires_at`, `seconds_remaining`, `end_reason`, o
  `null`), `unlimited` y, a veces, `workspace_id` e `inactive_contacts_count`. Mira qué campos llegan antes de leer
  uno. La especificación no enumera los valores de `state` ni de `alert_level`: no deduzcas un tope que no venga.
- `GET /api/v1/mac/contacts` y `GET /api/v1/mac/contacts/history`: por páginas (`perPage` de 1 a 100,
  `links.next`). La especificación no describe los campos de cada elemento ni qué guarda el historial: lee lo que
  llega antes de depender de un campo.
- **Al llegar al límite** (según los eventos): `mac.usage_100` abre una gracia de 24 horas (`data.grace_expires_at`);
  si no se regulariza, llega `account.blocked` (`data.reason` `mac_grace_expired`). En el bloqueo, los envíos con
  clave responden `429` con `mac_lockout_24h` (ver «Mandar mensajes»). Antes de un envío grande, mira
  `GET /api/v1/mac/status`.
- **Tu equipo:** `GET /api/v1/agents` (filtro `name`; orden `orderBy` `name` o `created_at` y `orderByMethod` `asc` o
  `desc`; por páginas) y `GET /api/v1/agents/{user}`, que trae `id` y `name` (`404` si no está). La especificación no
  describe los campos de cada elemento de la lista: usa el `id` que traiga cada uno como `{user}` y, si no viene, no
  lo adivines.
- **Facturación:** la API no tiene llamadas para pagar ni cambiar el plan (una ruta que no está publicada responde
  `403 route_not_available`). Si la persona pregunta por un cobro, díselo; la API solo informa con los eventos.

## Enterarte de tus contactos activos y tu suscripción

- Crea un webhook con `POST /api/v1/webhooks` y los eventos que la persona quiera. La clave necesita 
  **Avisos (webhooks) → Administrar** y, por estos eventos, **Números de WhatsApp → Ver**.
- **Contactos activos:** `mac.usage_80` (llegó al 80 % del ciclo: `used`, `limit`, `percentage`, `cycle_started_at`),
  `mac.usage_100` (los agotó: lo mismo más `grace_expires_at`), `mac.expiring` (hay contactos activos que vencen en
  los próximos 7 días: `contacts_expiring`, `expires_at`) y `account.blocked` (`reason`, `grace_started_at`,
  `grace_expired_at`).
- **Suscripción:** `billing.upcoming_charge` (unos días antes del cobro: `charge_date`, `amount_cents`, `currency`),
  `billing.payment_failed` (un cobro no se pudo procesar: una vez por factura, en el primer intento fallido; no se
  repite en los reintentos), `subscription.trial_ending` (entre 1 y 3 días antes del fin de la prueba:
  `trial_ends_at`), `subscription.dormant_ending` (unos 7 días antes de que termine la pausa de la cuenta, cuando se
  intenta el cobro: `charge_date`, `amount_cents`, `currency`), `subscription.cancellation_confirmed` (se conserva el
  acceso hasta `access_until`) y `subscription.reactivated` (se revirtió una cancelación programada; se renueva en
  `renews_at`).
- Según la descripción de cada uno, `billing.upcoming_charge`, `billing.payment_failed`,
  `subscription.cancellation_confirmed` y `subscription.reactivated` llegan solo con suscripciones de Stripe: con otra
  forma de pago pueden no llegar nunca. No le prometas a la persona que le van a llegar.
- Todos traen `data.workspace_id`. El mismo evento puede llegar más de una vez: descarta los repetidos por el `id` del
  sobre.

## Llamadas

### Ver tu cuenta

`GET /api/v1/me` · permiso **Números de WhatsApp → Ver** · área accounts

**Para qué sirve:** Úsalo para identificar la cuenta detrás de tu clave y conocer su nombre, su plan y sus límites, y cuántos números y agentes tiene el workspace de tu clave, por ejemplo al conectar tu integración.

La cuenta dueña de la clave: su nombre, su plan y sus límites. Los conteos (números,
agentes) son los del workspace de la clave, y `numbers_capacity` es el cupo que se aplica
cuando esa clave crea un número. Si el workspace paga su propio plan, el plan, sus límites y
el saldo de contactos activos son los de ese workspace; si no, los de la cuenta. No trae el
email, el teléfono ni las fechas de login del dueño, ni datos de cobro, ni datos de otros
workspaces.

**Respuestas**

- `200` — Los datos de la cuenta.
- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe.
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

### Ver tu consumo de contactos activos

`GET /api/v1/mac/status` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `mac.status`

**Para qué sirve:** Úsalo para saber cuántos contactos activos lleva tu cuenta en el ciclo, su límite, cuántos le quedan y el porcentaje usado, y anticiparte antes de que la cuenta se bloquee.

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `enforcement_enabled` | boolean |  |
  | `unlimited` | boolean |  |
  | `current_count` | integer |  |
  | `limit` | integer \| null |  |
  | `remaining` | integer \| null |  |
  | `usage_percentage` | integer |  |
  | `state` | string |  |
  | `grace` | null |  |
  | `period_start` | null |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)

### Ver tus contactos activos

`GET /api/v1/mac/contacts` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `mac.contacts`

**Para qué sirve:** Sirve para ver qué contactos están contando como MAC, útil para entender qué está consumiendo tu cupo.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<object> |  |
  | `links` | object |  |
  | `links.first` | string \| null |  |
  | `links.last` | string \| null |  |
  | `links.prev` | string \| null |  |
  | `links.next` | string \| null |  |
  | `meta` | object |  |
  | `meta.current_page` | integer |  |
  | `meta.from` | integer \| null |  |
  | `meta.last_page` | integer |  |
  | `meta.links` | array<object> |  |
  | `meta.path` | string |  |
  | `meta.per_page` | integer |  |
  | `meta.to` | integer \| null |  |
  | `meta.total` | integer |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)

### Ver el historial de tus contactos activos

`GET /api/v1/mac/contacts/history` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `mac.contactsHistory`

**Para qué sirve:** Úsalo para consultar el historial de MACs y analizar cómo evolucionó el consumo a lo largo del tiempo.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — OK

  La misma tabla que en «Ver tus contactos activos», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)

### Ver tu equipo

`GET /api/v1/agents` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `user.index`

**Para qué sirve:** Sirve para listar los agentes de la cuenta y obtener sus IDs, que necesitas para asignar conversaciones o tickets y filtrar por asesor.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `name` | query | string | no |  |
| `perPage` | query | integer | no |  |
| `orderBy` | query | string ∈ {"name", "created_at"} | no |  |
| `orderByMethod` | query | string ∈ {"asc", "desc"} | no |  |

**Respuestas**

- `200` — OK

  La misma tabla que en «Ver tus contactos activos», más arriba en este texto.

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `422` — Unprocessable Content (`ConversationsValidationException`)

### Ver a una persona de tu equipo

`GET /api/v1/agents/{user}` · permiso **Contactos y conversaciones → Ver** · área conversations · `operationId` `user.show`

**Para qué sirve:** Úsalo para ver los datos de una persona de tu equipo, por ejemplo su nombre para mostrar quién atiende una conversación.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `user` | path | string | sí |  |

**Respuestas**

- `200` — OK

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string |  |
  | `name` | string |  |

- `401` — Unauthorized (`ConversationsAuthenticationException`)
- `402` — Payment Required
- `403` — Forbidden (`ConversationsAuthorizationException`)
- `404` — Not Found (`ConversationsModelNotFoundException`)

## Los eventos

Llegan por webhook. Cómo crear uno, cómo llega cada entrega, los reintentos, el permiso que pide cada evento y cómo verificar la firma (con funciones probadas en Node.js, Python y PHP): https://developers-portal.funnelchat.app/ia/lo-basico.md.

### `account.blocked`

La cuenta, o un workspace con facturación propia, quedó bloqueada por consumo: terminó la gracia de 24 horas tras agotar los contactos activos mensuales sin que se regularizara. El bloqueo de la cuenta llega al workspace por defecto; el de un workspace con facturación propia, a ese workspace.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "account.blocked",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "reason": "mac_grace_expired",
    "grace_started_at": "2026-10-01T12:00:00Z",
    "grace_expired_at": "2026-10-02T12:00:00Z",
    "workspace_id": 37
  }
}
```

### `billing.payment_failed`

Un cobro de la suscripción no pudo procesarse (solo suscripciones de Stripe). Se emite una vez por factura (el primer intento fallido); no se repite en los reintentos de cobro. No incluye las recargas de IA. Llega al workspace que paga esa factura: el workspace con facturación propia, o el workspace por defecto si la factura es de la cuenta.

`data` trae `amount_cents` (el monto del cobro, en centavos), `currency` (el código de su moneda) y `workspace_id`. Esta documentación no muestra su ejemplo porque lleva un monto de la suscripción.

### `billing.upcoming_charge`

Se acerca el próximo cobro de la suscripción (solo suscripciones de Stripe); el evento llega unos días antes de la fecha de cobro. Llega al workspace que paga esa suscripción: el workspace con facturación propia, o el workspace por defecto si es la de la cuenta.

`data` trae `charge_date` (la fecha del cobro), `amount_cents` (el monto, en centavos), `currency` (el código de su moneda) y `workspace_id`. Esta documentación no muestra su ejemplo porque lleva un monto de la suscripción.

### `subscription.cancellation_confirmed`

Quedó confirmada la cancelación de la suscripción (solo suscripciones de Stripe): se conserva el acceso hasta la fecha indicada. Llega al workspace de esa suscripción: el workspace con facturación propia, o el workspace por defecto si es la de la cuenta.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "subscription.cancellation_confirmed",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "access_until": "2026-11-05T00:00:00Z",
    "workspace_id": 37
  }
}
```

### `subscription.dormant_ending`

El período de cuenta en reposo está por terminar (el evento llega unos 7 días antes); en esa fecha se intenta el cobro indicado. Llega al workspace por defecto, salvo que el período sea de un workspace con facturación propia.

`data` trae `charge_date` (la fecha en que se intenta el cobro), `amount_cents` (el monto, en centavos), `currency` (el código de su moneda) y `workspace_id`. Esta documentación no muestra su ejemplo porque lleva un monto de la suscripción.

### `subscription.reactivated`

Se revirtió la cancelación programada de la suscripción (solo suscripciones de Stripe): sigue vigente y se renueva en la fecha indicada. Llega al workspace de esa suscripción: el workspace con facturación propia, o el workspace por defecto si es la de la cuenta.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "subscription.reactivated",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "renews_at": "2026-11-05T00:00:00Z",
    "workspace_id": 37
  }
}
```

### `subscription.trial_ending`

El período de prueba está por terminar; el evento llega entre 1 y 3 días antes del final, según cómo se contrató (en las suscripciones de Stripe, el evento de Stripe). Llega al workspace de esa suscripción: el workspace con facturación propia, o el workspace por defecto si es la de la cuenta.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "subscription.trial_ending",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "trial_ends_at": "2026-10-04T00:00:00Z",
    "workspace_id": 37
  }
}
```

### `mac.usage_80`

La cuenta alcanzó el 80% de sus contactos activos mensuales del ciclo. `workspace_id` es el workspace al que se rutea el evento, como en todos los eventos: el workspace con facturación propia cuyo pool alcanzó el umbral, o el workspace por defecto cuando el pool es el de la cuenta.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "mac.usage_80",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "used": 8000,
    "limit": 10000,
    "percentage": 80,
    "cycle_started_at": "2026-10-01T00:00:00Z",
    "workspace_id": 37
  }
}
```

### `mac.usage_100`

La cuenta agotó sus contactos activos mensuales del ciclo; se abre una gracia de 24 horas cuyo vencimiento viaja en `grace_expires_at`. `workspace_id` es el workspace al que se rutea el evento, como en todos los eventos: el workspace con facturación propia cuyo pool se agotó, o el workspace por defecto cuando el pool es el de la cuenta.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "mac.usage_100",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "used": 10000,
    "limit": 10000,
    "percentage": 100,
    "cycle_started_at": "2026-10-01T00:00:00Z",
    "grace_expires_at": "2026-10-02T12:00:00Z",
    "workspace_id": 37
  }
}
```

### `mac.expiring`

Hay contactos activos mensuales que vencen en los próximos 7 días. Llega un evento por pool: el de la cuenta al workspace por defecto, y el de cada workspace con facturación propia a ese workspace, con sus contactos.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "mac.expiring",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "contacts_expiring": 1200,
    "expires_at": "2026-10-08T03:00:00Z",
    "workspace_id": 37
  }
}
```

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
