# Grupos — API de Funnelchat: contexto para tu IA

> Copiado de /docs/grupos/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Grupos: empieza por los grupos del número

- **Los grupos de un número están en `GET /api/v1/devices/{device}/groups`**: los lee de WhatsApp, también los que
  todavía no están en el workspace de tu clave. `{device}` es el `id` del número en `GET /api/v1/devices`. La clave necesita
  **Grupos y campañas → Ver**.
- Viene por páginas: `page` y `pageSize` (25 por defecto, hasta 100); pide `page` 1, 2, … hasta `meta.last_page`. Cada
  grupo trae `uid` (su identificador en WhatsApp, por ejemplo `120363000000000001@g.us`) y `name`; si ya está en el
  workspace, trae además `device_id`. La lista se reutiliza durante un minuto por número: un grupo recién creado en
  WhatsApp puede tardar hasta un minuto en aparecer.
- **Para encontrar un grupo por su nombre**, compara el `name` de cada grupo de todas las páginas. La especificación
  declara también un parámetro `name`, sin descripción todavía en la especificación. Si ningún grupo coincide, o
  coincide más de uno, muéstrale a la persona los nombres parecidos y pregúntale cuál es; no elijas por ella.
- **El número que manda** es aquel en cuya lista aparece el grupo. Si la persona tiene un solo número conectado, es
  ese. Con varios, busca en la lista de cada número conectado.

## Mandar un mensaje a un grupo, paso a paso

1. Toma el `uid` del grupo y el `id` del número de la lista de arriba.
2. `POST /api/v1/groups/{group}/messages`, con `{group}` el `uid` del grupo, y
   `{"device_id": "dev_Ac7Ku7iIZDXJTjdCu0UB1mX", "type": "text", "text": "¡Hola a todos!"}`. `type` es `text`, `image`, `video`, `audio` o
   `document`; para un archivo, `media_url` (hasta 255 caracteres) y, si quieres, `caption` y `file_name`.
   **No lo sigas antes:** si el grupo todavía no está en el workspace y el número es por QR, este envío lo importa (lo
   empieza a seguir) y sigue con el envío. La clave necesita **Grupos y campañas → Enviar** y, si el grupo todavía no
   estaba en el workspace, además **Grupos y campañas → Administrar grupos**. Esa importación cuenta en el tope de 5 por
   minuto del número.
3. **No sale dentro de la llamada.** La respuesta es `202` con `action_id` y `"status": "queued"`: el pedido quedó
   en cola y el mensaje sale después, al ritmo del número. Para saber cómo salió, consulta
   `GET /api/v1/groups/actions/{action}` con ese `action_id`, o espera el webhook `group_action.completed` (salió) o
   `group_action.failed` (falló). **`queued` no es enviado**, y no reenvíes el pedido: lo mandarías dos veces.
4. La consulta responde `data` con `status` (`queued`, `running`, `completed` o `failed`), `result` y `reason`.
   Con `completed`, `result.message.uid` es el id del mensaje en WhatsApp; mientras está `queued` o `running`,
   `result` y `reason` son `null`; con `failed`, `result` es `null` y `reason` dice por qué (un código, por ejemplo
   `device_not_connected` o `window_closed`; lo que no tiene un motivo propio sale `internal_error`).

## Seguir un grupo: enterarte de quién entra y quién sale

- Para qué: que el grupo quede en el workspace y que desde entonces lleguen los eventos de quién entra y quién sale. Para
  escribirle no hace falta: el envío lo sigue solo.
- `POST /api/v1/groups/{group}/import`, con `{group}` el `uid` del grupo y `{"device_id": "dev_Ac7Ku7iIZDXJTjdCu0UB1mX"}`. La clave necesita
  **Grupos y campañas → Administrar grupos**.
- Responde `201` si lo importó y `200` si ya estaba en el workspace, los dos con `data`: `uid`, `name`, `imported`
  (`true` si lo importó esta llamada) e `is_admin` (si el número es administrador del grupo, según WhatsApp, leído en la
  misma llamada). Con `is_admin: false` el grupo queda en el workspace, pero ese número no puede escribirle.
- Solo con números conectados por QR, hasta 5 grupos por minuto por número. Dos pedidos a la vez por el mismo grupo lo
  importan una sola vez. Si cada workspace de la cuenta tiene sus propios grupos, se importa la copia de este workspace sin tocar la del otro; si no, el grupo es uno solo para toda la cuenta y responde `404 group_not_found`.

## Quién entra y quién sale: el webhook

- Llegan por los eventos `group_participant.joined` y `group_participant.left`, de los grupos que están en el workspace:
  un grupo los genera desde que se sigue (con «Seguir un grupo», con el primer envío o desde el panel).
- Crea un webhook con `POST /api/v1/webhooks` y `"events": ["group_participant.joined", "group_participant.left"]`;
  la clave necesita además **Grupos y campañas → Ver**. Cada evento trae `data.group` (`uid`, `name`),
  `data.participant` (`identity`, `identity_type`, `name`) y `data.campaign` (`null` si el grupo no es de una campaña).
- Llega como mucho uno por persona, grupo y día UTC: si la misma persona vuelve a entrar al mismo grupo ese día, o
  vuelve a salir, no llega otro. No los uses para contar entradas y salidas.

## Errores al seguir un grupo y al mandarle

El cuerpo de un rechazo trae `error` (el código) y `message`.

- `403 import_permission_required`: el grupo no estaba en el workspace y a la clave le falta **Grupos y campañas →
  Administrar grupos** para seguirlo. La persona tiene que crear una clave con esa casilla marcada.
- `422 device_not_group_admin`: el número no es administrador del grupo; no se siguió nada. Reintentar no sirve.
- `422 provider_unsupported`: el número no permite eso; trae `provider` y, si a la cuenta le falta una habilitación,
  `requires` con lo que hace falta. Seguir un grupo con un número oficial responde esto: los grupos se siguen solo con números por
  QR. Mandarle un mensaje con un número oficial también, cuando el chat de grupos de la API oficial no está disponible
  para ese grupo, sea cual sea el tipo de mensaje.
- `404 group_not_found`: el grupo no es de ese número o no existe en el workspace de tu clave. `404 device_not_found`: el número no
  existe en el workspace de tu clave.
- `422 device_not_connected`: el número no está conectado. `422 device_not_group_number`: el número no es el del grupo.
- Con un número oficial de WhatsApp se verifican, antes de aceptar, la ventana de 24 horas (`422 window_closed`) y la
  calidad del número (`422 number_restricted`).
- `429 import_rate_limited`: el número ya siguió 5 grupos en el último minuto; trae `retry_after` en segundos: espera
  ese tiempo y reintenta. `429 too_many_pending_actions`: el número ya tiene 50 pedidos en cola sin terminar; espera a
  que salgan.
- `409 import_in_progress`: otro pedido está siguiendo ese mismo grupo en este momento. Reintenta en unos segundos: si
  ya quedó en la cuenta, responde `200`.
- Un `5xx` (por ejemplo `502 provider_error`) o una llamada sin respuesta: no hay clave de idempotencia, así que
  reintentar un envío puede mandar el mensaje dos veces.

## Llamadas

### Ver tus grupos

`GET /api/v1/devices/{device}/groups` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `group.groups`

**Para qué sirve:** Sirve para ver los grupos de un número tal como están en WhatsApp, también los que todavía no importaste a tu cuenta: de acá sale el `uid` para escribirle a un grupo o seguirlo.

**Nota:** La lista se lee de WhatsApp y, para una API key, se reutiliza durante un minuto por número: un grupo recién creado en WhatsApp puede tardar hasta un minuto en aparecer. Si un grupo ya está en el workspace de la llamada, trae `device_id`. Para importar uno: `POST /groups/{group}/import`.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `pageSize` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`).

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí |  |
| `page` | query | integer | no |  |
| `pageSize` | query | integer | no |  |
| `name` | query | string \| null | no |  |

**Respuestas**

- `200` — Array of `GroupMinResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<GroupMinResource> |  |
  | `data[].uid` | string \| string ∈ {""} |  |
  | `data[].name` | string \| string ∈ {""} |  |
  | `data[].description` | string \| string ∈ {""} |  |
  | `data[].device_id` | string | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].alias` | string \| string ∈ {""} |  |
  | `data[].number` | string \| string ∈ {""} |  |
  | `data[].communityUid` | string \| string ∈ {""} |  |
  | `meta` | object |  |
  | `meta.current_page` |  |  |
  | `meta.last_page` |  |  |
  | `meta.per_page` |  |  |
  | `meta.total` | integer |  |

- `400`
- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404`
- `422` — Validation error (`CommunitiesValidationException`)

### Mandar un mensaje a un grupo

`POST /api/v1/groups/{group}/messages` · permiso **Grupos y campañas → Enviar** · área communities · `operationId` `apiGroupAction.sendMessage`

**Para qué sirve:** Úsalo para mandarle a un grupo un texto, o una imagen, un video, un audio o un documento, desde uno de tus números. El pedido se acepta enseguida, queda en cola y el mensaje sale después, al ritmo del número.

**Nota:** Asíncrona: responde 202 con `action_id`; consulta el resultado en `GET /groups/actions/{action}` (`result.message.uid` es el id del mensaje en WhatsApp). `type`: `text`, `image`, `video`, `audio` o `document`. Con un número QR sale al ritmo de los mensajes programados de velocidad Low, que el integrador no puede cambiar. Con un número oficial se verifican, antes de aceptar, la ventana de servicio de 24 horas y la calidad del número. No tiene tope de volumen del plan. Si el grupo todavía no está en la cuenta y el número es QR, primero se importa como en `POST /groups/{group}/import` (pide además **Grupos y campañas → Administrar grupos**, `403 import_permission_required` sin él) y el envío sigue con las mismas reglas: si el número no es administrador del grupo no se importa nada y responde `422 device_not_group_admin`. Esa importación cuenta en el tope de 5 por minuto del número.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `type` | string ∈ {"text", "image", "video", "audio", "document"} | sí |  |
| `text` | string | no |  |
| `media_url` | string | no |  |
| `caption` | string | no |  |
| `file_name` | string | no |  |

**Respuestas**

- `202` — `ApiGroupActionAcceptedResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `action_id` | string |  |
  | `status` | "queued" |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Seguir un grupo

`POST /api/v1/groups/{group}/import` · permiso **Grupos y campañas → Administrar grupos** · área communities · `operationId` `v2.apiGroupImport`

**Para qué sirve:** Úsalo para seguir un grupo de tu número sin escribirle: lo importa a tu cuenta y desde entonces te enteras de quién entra y quién sale. Si ya estaba en tu cuenta, no lo importa de nuevo.

**Nota:** Importa al workspace de la API key un grupo del número indicado en `device_id`, igual que importarlo desde el panel: queda visible en el panel, se sincronizan sus participantes y desde entonces genera los eventos `group_participant.joined` y `group_participant.left`. Los datos del grupo y si el número es administrador se leen de WhatsApp en la misma llamada. Responde `201` si lo importó y `200` si ya estaba en el workspace, con `is_admin`. Solo números QR: con un número oficial responde `422 provider_unsupported`. Si el grupo no es del número responde `404 group_not_found`. Cada número importa hasta 5 grupos por minuto (`429 import_rate_limited`, con `retry_after` en segundos). Dos pedidos a la vez por el mismo grupo en el mismo workspace lo importan una sola vez. Si el grupo ya está en otro workspace de la cuenta: cuando cada workspace de la cuenta tiene sus propios grupos, se importa la copia de este workspace sin tocar la del otro; si no, el grupo es uno solo para toda la cuenta y responde `404 group_not_found`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí | Identificador del grupo en WhatsApp, como lo lista `GET /v1/devices/{device}/groups`. |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |

**Respuestas**

- `200` — El grupo ya estaba en el workspace: no se importó de nuevo.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | ApiGroupImportResource |  |
  | `data.uid` | string | Identificador del grupo en WhatsApp. |
  | `data.name` | string \| null | Nombre del grupo. |
  | `data.imported` | boolean | `true` si esta llamada lo importó; `false` si ya estaba en el workspace. |
  | `data.is_admin` | boolean | Si el número indicado es administrador del grupo, según WhatsApp. Sin serlo no puede enviarle mensajes ni hacer acciones de grupo. |

- `201` — El grupo se importó en esta llamada.

  La misma tabla que en «Seguir un grupo», más arriba en este texto.

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Ver cómo salió una acción de grupo

`GET /api/v1/groups/actions/{action}` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `apiGroupAction.show`

**Para qué sirve:** Sirve para saber cómo terminó lo que le pediste a un grupo, como mandarle un mensaje: si sigue en cola, se está haciendo, terminó o falló, y su resultado.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `action` | path | string | sí |  |

**Respuestas**

- `200` — El estado de la acción y, si terminó `completed`, su resultado.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | ApiGroupActionResource |  |
  | `data.action_id` | string | Id de la acción: el `action_id` del `202`. |
  | `data.type` | string ∈ {"create_group", "add_participants", "remove_participants", "promote_admins", "demote_admins", "update_name", "update_description", "update_photo", "update_settings", "renew_invite_link", "send_message", "approve_join_requests", "reject_join_requests"} | Tipo de acción. |
  | `data.status` | string ∈ {"queued", "running", "completed", "failed"} | Estado de la acción. |
  | `data.device_id` | string \| null | Número que ejecuta la acción; `null` si es de otro workspace que el de la key. Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data.group` | object \| null | Grupo de la acción; `null` si todavía no existe (una creación sin terminar) o es de otro workspace que el de la key. |
  | `data.result` | object \| null | Resultado de una acción `completed`; `null` mientras está `queued` o `running` y cuando termina `failed`. Su forma depende de `type`: `{"participants": [...]}` (una lista, en el orden del pedido) para las acciones con lista de teléfonos; `{"group": {"uid", "name"}, "invite_link"}` para `create_group`; `{"invite_link"}` para `renew_invite_link`; `{"message": {"uid"}}` para `send_message`; `{}` para las demás. Es el mismo `result` del evento `group_action.completed`. |
  | `data.reason` | string \| null | Motivo de una acción `failed`; `null` en los demás estados. Vocabulario cerrado: la sección «Motivos» de «Acciones de grupo». |
  | `data.created_at` | string \| null |  |
  | `data.started_at` | string \| null |  |
  | `data.completed_at` | string \| null |  |
  | `data.failed_at` | string \| null |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)

### Crear un webhook

`POST /api/v1/webhooks` · permiso **Avisos (webhooks) → Administrar** · área accounts · `operationId` `webhookSubscription.store`

**Para qué sirve:** Sirve para empezar a recibir eventos en tu sistema: eliges la URL y los eventos de cualquiera de las tres áreas, y guardas el secreto de firma, que se muestra solo esta vez.

Con una clave de API, cada tipo de `events` exige además el permiso
**Números de WhatsApp → Ver**, **Contactos y conversaciones → Ver** o
**Grupos y campañas → Ver**, según su área; si falta, 422.

Hay un tope de 50 suscripciones por workspace (por cuenta, si no usas workspaces), sea
cual sea su estado: con 50, crear otra responde `422` con `error`
`webhooks_limit_reached`.

No acepta `Idempotency-Key`: reintentar una creación que sí llegó crea otra suscripción,
con otro secreto.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `url` | string (uri) | sí |  |
| `description` | string \| null | no |  |
| `events` | array<string>: uno o más de los 55 eventos (la lista entera, con el permiso de cada uno: https://developers-portal.funnelchat.app/ia/lo-basico.md); los de este tema: `group_participant.joined`, `group_participant.left`, `group_action.completed`, `group_action.failed` | sí |  |
| `filters` | object | no |  |
| `filters.campaign_ids` | array<string> \| null | no |  |

**Respuestas**

- `201` — La suscripción creada, con su secreto de firma (`secret`). Es la única vez que aparece.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string |  |
  | `url` | string |  |
  | `description` | string \| null |  |
  | `events` | array<string> |  |
  | `filters` | object \| null | Siempre un objeto: `{}` si no hay filtro. |
  | `status` | string |  |
  | `disabled_reason` | string \| null |  |
  | `last_delivery_at` | string \| null |  |
  | `last_success_at` | string \| null |  |
  | `secret_rotated_at` | string \| null |  |
  | `created_at` | string \| null |  |
  | `updated_at` | string \| null |  |
  | `migration` | object \| null |  |
  | `migration.origin` | string |  |
  | `migration.status` | string |  |
  | `migration.activated_via` | string \| null |  |
  | `migration.activated_at` | string \| null |  |
  | `migration.last_result` | string \| null |  |
  | `secret` | string |  |
  | `secret_notice` | "Guarda este secreto ahora: es la única vez que se muestra. Con él validas la firma del header de cada entrega." |  |

- `401` — Unauthenticated (`AccountsAuthenticationException`)
- `403` — Quien llama no puede usar esta ruta (`forbidden`). Los códigos de workspace que puede traer `error` con una clave: `workspace_deleted`: el workspace de la clave ya no existe; `workspace_foreign_account`: solo la usa una clave de un workspace de la propia cuenta.
- `422` — Validation error (`AccountsValidationException`)
- `429` — Superaste un límite de llamadas. Espera los segundos que indica `Retry-After` antes de volver a llamar. Cabeceras: `Retry-After`

## Los eventos

Llegan por webhook. Cómo crear uno, cómo llega cada entrega, los reintentos, el permiso que pide cada evento y cómo verificar la firma (con funciones probadas en Node.js, Python y PHP): https://developers-portal.funnelchat.app/ia/lo-basico.md.

### `group_participant.joined`

Una persona entró a un grupo del workspace; `campaign` es null si el grupo no es de una campaña, y sale como mucho uno por persona, grupo y día UTC en cada workspace (si la misma persona vuelve a entrar ese día, no sale otro).

Ejemplo:

```json
{
  "id": "evt_00000000000000000000000000000002",
  "type": "group_participant.joined",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "group": {
      "uid": "120363000000000001@g.us",
      "name": "Grupo de ejemplo"
    },
    "campaign": {
      "uuid": "xK9mQz"
    },
    "participant": {
      "identity": "5491100000000",
      "identity_type": "phone",
      "name": "Ana Pérez"
    },
    "workspace_id": 37
  }
}
```

### `group_participant.left`

Una persona salió de un grupo del workspace; `campaign` es null si el grupo no es de una campaña, y sale como mucho uno por persona, grupo y día UTC en cada workspace (si la misma persona vuelve a salir ese día, no sale otro).

Ejemplo:

```json
{
  "id": "evt_00000000000000000000000000000003",
  "type": "group_participant.left",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "group": {
      "uid": "120363000000000001@g.us",
      "name": "Grupo de ejemplo"
    },
    "campaign": {
      "uuid": "xK9mQz"
    },
    "participant": {
      "identity": "5491100000000",
      "identity_type": "phone",
      "name": "Ana Pérez"
    },
    "workspace_id": 37
  }
}
```

### `group_action.completed`

Terminó una acción sobre un grupo. `action.uuid` es el mismo `action_id` que devolvió la API al pedirla, y `action.type` dice qué acción fue. `result` depende del tipo de acción: en las que reciben una lista de teléfonos (agregar o quitar participantes, nombrar o quitar administradores) trae `participants`, con el resultado por persona: `identity`, `identity_type`, `status` (`added`, `removed`, `promoted` o `demoted` según la acción, o `failed`) y `reason`, que es `null` salvo cuando `status` es `failed`; al crear un grupo o renovar su link de invitación trae `invite_link`; al enviar un mensaje trae `message.uid`; en las demás (cambiar el nombre, la descripción, la foto o los ajustes) viene como objeto vacío (`{}`). `group` y `campaign` pueden venir `null`.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "group_action.completed",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "action": {
      "uuid": "00000000-0000-4000-8000-000000000001",
      "type": "add_participants"
    },
    "group": {
      "uid": "120363000000000000@g.us",
      "name": "Grupo de ejemplo"
    },
    "campaign": {
      "uuid": "xK9mQz",
      "name": "Campaña de ejemplo"
    },
    "result": {
      "participants": [
        {
          "identity": "5491100000000",
          "identity_type": "phone",
          "status": "added",
          "reason": null
        }
      ]
    },
    "workspace_id": 37
  }
}
```

### `group_action.failed`

Una acción sobre un grupo falló entera (si terminó con resultados por persona, llega `group_action.completed`). Si la pidió la API, `action.uuid` es el mismo `action_id` que devolvió al pedirla y `pipeline` viene `null`. Si la ejecutó una campaña o un pipeline, `action.uuid` viene `null`, y `pipeline` trae ese pipeline (`uuid` y `name`) o viene `null` fuera de un pipeline. `reason` es el motivo de la falla. `group` y `campaign` pueden venir `null`.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "group_action.failed",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "campaign": {
      "uuid": "xK9mQz",
      "name": "Campaña de ejemplo"
    },
    "pipeline": null,
    "group": {
      "uid": "120363000000000000@g.us",
      "name": "Grupo de ejemplo"
    },
    "action": {
      "uuid": "00000000-0000-4000-8000-000000000001",
      "type": "add_participants"
    },
    "reason": "motivo_de_ejemplo",
    "workspace_id": 37
  }
}
```

## Secciones citadas

Las secciones de la descripción general de cada área que citan las llamadas y los eventos de este texto, tal como las escribe el área.

### Acciones de grupo

#### Motivos

El `reason` de una acción `failed`, el de cada persona `failed` en `result.participants` y el de `group_action.failed` usan un único vocabulario cerrado; cualquier otro caso sale como `internal_error`, nunca con el texto del proveedor. Los valores posibles son: `max_pending_days_exceeded`, `max_retries_exceeded`, `owner_not_connected`, `no_creator_available_suspended`, `parent_group_creation_failed`, `permanent_condition_unmet`, `unexpected_job_failure`, `device_not_found`, `device_not_configured`, `disconnected_device`, `not_connected`, `not_respond`, `not_initialize`, `group_forbidden`, `phone_not_exists`, `creation_unconfirmed`, `creation_rejected`, `expired`, `window_closed`, `number_restricted`, `capacity_full`, `invite_capacity_full`, `duplicate_invite`, `template_params_missing`, `template_mismatch`, `participant_not_found`, `cannot_remove_business_number`, `pending_subscription`, `provider_error`, `provider_unsupported`, `not_permitted`, `group_not_found`, `orphan_standalone_action`, `standalone_context_mismatch`, `disabled`, `plan_cap_reached`, `device_not_group_number`, `device_not_connected`, `device_not_group_admin`, `unsupported_group_type`, `join_request_not_found`, `internal_error`.

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
