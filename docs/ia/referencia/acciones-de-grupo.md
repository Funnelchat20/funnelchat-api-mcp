# Acciones de grupo — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/acciones-de-grupo/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

### Crear un grupo

`POST /api/v1/groups` · permiso **Grupos y campañas → Administrar grupos** · área communities · `operationId` `apiGroupAction.create`

**Para qué sirve:** Sirve para crear un grupo de WhatsApp desde uno de tus números, con su nombre, su descripción y hasta 20 participantes. Se hace después, al ritmo del número: con el `action_id` ves cómo salió y su link de invitación.

**Nota:** Asíncrona: responde 202 con `action_id`; consulta el resultado en `GET /groups/actions/{action}`. Hasta 20 participantes iniciales, sin contar al propio número. Con un número QR la descripción se pone justo después de crear el grupo, y las creaciones respetan la espera entre creaciones del número. El resultado trae el grupo y su link de invitación. Con un número oficial, `join_approval_required: true` crea el grupo pidiendo aprobación para entrar (no se puede cambiar después); con un número QR responde `422 provider_unsupported`.

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `name` | string | sí |  |
| `description` | string \| null | no |  |
| `join_approval_required` | boolean | no |  |
| `participants` | array<string> | sí |  |

**Respuestas**

- `202` — `ApiGroupActionAcceptedResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `action_id` | string |  |
  | `status` | "queued" |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `402` — Se alcanzó el tope de grupos oficiales del plan: el del workspace si tiene plan propio, o el de la cuenta si no. No se registra ninguna acción.
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Sumar participantes a un grupo

`POST /api/v1/groups/{group}/participants` · permiso **Grupos y campañas → Administrar grupos** · área communities · `operationId` `apiGroupAction.addParticipants`

**Para qué sirve:** Úsalo para sumar a un grupo hasta 20 personas por su teléfono. Con un número por QR entran directo; con uno oficial, cada una recibe una invitación. El resultado dice cómo salió cada una.

**Nota:** Asíncrona: responde 202 con `action_id`; consulta el resultado en `GET /groups/actions/{action}`. Hasta 20 teléfonos por pedido. Con un número QR cada teléfono se agrega por separado, uno tras otro, al ritmo de las campañas. El resultado informa cada persona como `added` o `failed`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `phones` | array<string> | sí |  |

**Respuestas**

- `202` — `ApiGroupActionAcceptedResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `action_id` | string |  |
  | `status` | "queued" |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Sacar participantes de un grupo

`POST /api/v1/groups/{group}/participants/remove` · permiso **Grupos y campañas → Administrar grupos** · área communities · `operationId` `apiGroupAction.removeParticipants`

**Para qué sirve:** Sirve para sacar de un grupo hasta 20 personas por su teléfono, en una sola operación de WhatsApp. El resultado dice, persona por persona, si salió.

**Nota:** Asíncrona: responde 202 con `action_id`; consulta el resultado en `GET /groups/actions/{action}`. Hasta 20 teléfonos por pedido, sacados en una sola operación de WhatsApp. No admite el teléfono del propio número que ejecuta.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `phones` | array<string> | sí |  |

**Respuestas**

- `202` — `ApiGroupActionAcceptedResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `action_id` | string |  |
  | `status` | "queued" |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Hacer administradores

`POST /api/v1/groups/{group}/admins` · permiso **Grupos y campañas → Administrar grupos** · área communities · `operationId` `apiGroupAction.promoteAdmins`

**Para qué sirve:** Úsalo para hacer administradores de un grupo a hasta 20 teléfonos; si alguno no estaba en el grupo, primero se suma. Solo con números conectados por QR.

**Nota:** Asíncrona: responde 202 con `action_id`; consulta el resultado en `GET /groups/actions/{action}`. Hasta 20 teléfonos por pedido, en una sola operación de WhatsApp. Un teléfono que no está en el grupo se agrega primero. Solo con números QR. Se ejecuta al ritmo de las campañas del número.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `phones` | array<string> | sí |  |

**Respuestas**

- `202` — `ApiGroupActionAcceptedResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `action_id` | string |  |
  | `status` | "queued" |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Quitar administradores

`POST /api/v1/groups/{group}/admins/remove` · permiso **Grupos y campañas → Administrar grupos** · área communities · `operationId` `apiGroupAction.demoteAdmins`

**Para qué sirve:** Sirve para quitarles el rol de administrador de un grupo a hasta 20 teléfonos. Solo con números conectados por QR.

**Nota:** Asíncrona: responde 202 con `action_id`; consulta el resultado en `GET /groups/actions/{action}`. Hasta 20 teléfonos por pedido, en una sola operación de WhatsApp. No admite el teléfono del propio número que ejecuta. Solo con números QR. Se ejecuta al ritmo de las campañas del número.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `phones` | array<string> | sí |  |

**Respuestas**

- `202` — `ApiGroupActionAcceptedResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `action_id` | string |  |
  | `status` | "queued" |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Cambiar el nombre de un grupo

`PUT /api/v1/groups/{group}/name` · permiso **Grupos y campañas → Administrar grupos** · área communities · `operationId` `apiGroupAction.updateName`

**Para qué sirve:** Úsalo para cambiarle el nombre a un grupo, de hasta 100 caracteres. Se manda a WhatsApp tal cual, sin la numeración de la campaña.

**Nota:** Asíncrona: responde 202 con `action_id`; consulta el resultado en `GET /groups/actions/{action}`. El nombre se envía tal cual, sin numeración de campaña. Hasta 100 caracteres. Se ejecuta al ritmo de las campañas del número.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `name` | string | sí |  |

**Respuestas**

- `202` — `ApiGroupActionAcceptedResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `action_id` | string |  |
  | `status` | "queued" |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Cambiar la descripción de un grupo

`PUT /api/v1/groups/{group}/description` · permiso **Grupos y campañas → Administrar grupos** · área communities · `operationId` `apiGroupAction.updateDescription`

**Para qué sirve:** Sirve para cambiar la descripción de un grupo, de hasta 2048 caracteres, o borrarla dejándola vacía (con un número oficial no se puede borrar).

**Nota:** Asíncrona: responde 202 con `action_id`; consulta el resultado en `GET /groups/actions/{action}`. Hasta 2048 caracteres. Con un número QR, una descripción vacía la borra; con un número oficial responde `422 validation_failed`, porque WhatsApp no permite borrar la descripción de un grupo oficial. Se ejecuta al ritmo de las campañas del número.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `description` | string \| null | sí |  |

**Respuestas**

- `202` — `ApiGroupActionAcceptedResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `action_id` | string |  |
  | `status` | "queued" |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Cambiar la foto de un grupo

`PUT /api/v1/groups/{group}/photo` · permiso **Grupos y campañas → Administrar grupos** · área communities · `operationId` `apiGroupAction.updatePhoto`

**Para qué sirve:** Úsalo para cambiar la foto de un grupo con la dirección `https` de una imagen jpg, jpeg o png. Solo con números conectados por QR.

**Nota:** Asíncrona: responde 202 con `action_id`; consulta el resultado en `GET /groups/actions/{action}`. `photo_url` debe ser una URL `https` de una imagen jpg, jpeg o png. Solo con números QR. Se ejecuta al ritmo de las campañas del número.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `photo_url` | string | sí |  |

**Respuestas**

- `202` — `ApiGroupActionAcceptedResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `action_id` | string |  |
  | `status` | "queued" |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Elegir quién escribe en un grupo

`PUT /api/v1/groups/{group}/settings` · permiso **Grupos y campañas → Administrar grupos** · área communities · `operationId` `apiGroupAction.updateSettings`

**Para qué sirve:** Sirve para elegir si en un grupo escriben todos o solo los administradores; si escriben solo ellos, también son los únicos que editan los datos del grupo. Solo con números conectados por QR.

**Nota:** Asíncrona: responde 202 con `action_id`; consulta el resultado en `GET /groups/actions/{action}`. `members_can_send_messages`; bloquear la escritura también deja a solo los administradores editando la información del grupo. Solo con números QR. Se ejecuta al ritmo de las campañas del número.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `members_can_send_messages` | boolean | sí |  |

**Respuestas**

- `202` — `ApiGroupActionAcceptedResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `action_id` | string |  |
  | `status` | "queued" |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Ver el link de invitación de un grupo

`GET /api/v1/groups/{group}/invite-link/live` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `apiGroupAction.inviteLink`

**Para qué sirve:** Sirve para leer en el momento, desde WhatsApp, el link de invitación vigente de un grupo, por ejemplo para compartirlo o comprobar que no cambió.

**Nota:** Se lee en vivo del proveedor con el número indicado en `device_id`. Límite: 30 pedidos por minuto.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí |  |
| `device_id` | query | string | sí |  |

**Respuestas**

- `200` — El link de invitación vigente del grupo. Una lectura exitosa se reutiliza durante unos segundos.

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | object |  |
  | `data.invite_link` | string |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Renovar el link de invitación de un grupo

`POST /api/v1/groups/{group}/invite-link/renew` · permiso **Grupos y campañas → Administrar grupos** · área communities · `operationId` `apiGroupAction.renewInviteLink`

**Para qué sirve:** Úsalo para renovar el link de invitación de un grupo. Con un número oficial, el anterior deja de servir y WhatsApp genera uno nuevo; con uno por QR, vuelve a leer el vigente sin cambiarlo.

**Nota:** Asíncrona: responde 202 con `action_id`; consulta el resultado en `GET /groups/actions/{action}`. Con un número QR relee el link vigente y NO lo revoca (los proveedores QR de WhatsApp no exponen revocación acá); con un número oficial revoca el link y WhatsApp genera uno nuevo. El resultado trae `invite_link`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |

**Respuestas**

- `202` — `ApiGroupActionAcceptedResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `action_id` | string |  |
  | `status` | "queued" |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Ver las solicitudes para unirse

`GET /api/v1/groups/{group}/join-requests` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `apiGroupAction.joinRequests`

**Para qué sirve:** Úsalo para ver quién pidió unirse a un grupo de un número oficial que pide aprobación para entrar, antes de aprobar o rechazar. Trae hasta 100 solicitudes, leídas en el momento.

**Nota:** Solo números oficiales con la versión preliminar de grupos de la API oficial; un número QR recibe `422 provider_unsupported`. Se lee en vivo del proveedor con el número indicado en `device_id`; devuelve hasta 100 solicitudes, en el orden del proveedor, y omite las que no traen teléfono (no hay BSUID). Límite: 30 pedidos por minuto.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí |  |
| `device_id` | query | string | sí |  |

**Respuestas**

- `200`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<any> |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Aprobar solicitudes para unirse

`POST /api/v1/groups/{group}/join-requests/approve` · permiso **Grupos y campañas → Administrar grupos** · área communities · `operationId` `apiGroupAction.approveJoinRequests`

**Para qué sirve:** Sirve para aprobar, por el teléfono de cada persona, las solicitudes para unirse a un grupo de un número oficial, si caben en los lugares libres. El resultado dice cómo salió cada una.

**Nota:** Asíncrona: responde 202 con `action_id`; consulta el resultado en `GET /groups/actions/{action}`. Solo números oficiales con la versión preliminar de grupos de la API oficial y con la habilitación de decisiones; si no, `422 provider_unsupported`. Verifica que los teléfonos entren en los lugares libres del grupo (`capacity_full`). El resultado es por persona.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `phones` | array<string> | sí |  |

**Respuestas**

- `202` — `ApiGroupActionAcceptedResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `action_id` | string |  |
  | `status` | "queued" |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Rechazar solicitudes para unirse

`POST /api/v1/groups/{group}/join-requests/reject` · permiso **Grupos y campañas → Administrar grupos** · área communities · `operationId` `apiGroupAction.rejectJoinRequests`

**Para qué sirve:** Úsalo para rechazar, por el teléfono de cada persona, las solicitudes para unirse a un grupo de un número oficial. El resultado dice cómo salió cada una.

**Nota:** Asíncrona: responde 202 con `action_id`; consulta el resultado en `GET /groups/actions/{action}`. Solo números oficiales con la versión preliminar de grupos de la API oficial y con la habilitación de decisiones; si no, `422 provider_unsupported`. El resultado es por persona.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí |  |

**Cuerpo** (`application/json`, obligatorio)

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `device_id` | string | sí | Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
| `phones` | array<string> | sí |  |

**Respuestas**

- `202` — `ApiGroupActionAcceptedResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `action_id` | string |  |
  | `status` | "queued" |  |

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

### Ver las acciones sobre un grupo

`GET /api/v1/groups/{group}/actions` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `group.actions`

**Para qué sirve:** Úsalo para ver el historial de acciones ejecutadas sobre un grupo puntual y su resultado, por ejemplo para entender por qué cambió su nombre o sus administradores.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `perPage` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`). Orden: `orderBy` acepta `status`, `created_at`, `updated_at`, `completed_at`; dirección `orderByMethod`: `asc` o `desc`. Otro valor responde `422`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí | The group uid |
| `orderBy` | query | string ∈ {"status", "created_at", "updated_at", "completed_at"} | no |  |
| `orderByMethod` | query | string ∈ {"asc", "desc"} | no |  |
| `page` | query | integer | no |  |
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — Paginated set of `ActionGroupResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<object> |  |
  | `data[].id` | string \| null | Id opaco: un texto que empieza con `acg_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].name` | string |  |
  | `data[].status` | string |  |
  | `data[].info` |  |  |
  | `data[].action_name` | string |  |
  | `data[].action_label` | string \| null |  |
  | `data[].executed_at` | string \| null |  |
  | `data[].executed_by` | string \| null |  |
  | `data[].groups` | string \| array<string> |  |
  | `links` | object |  |
  | `links.first` | string \| null |  |
  | `links.last` | string \| null |  |
  | `links.prev` | string \| null |  |
  | `links.next` | string \| null |  |
  | `meta` | object |  |
  | `meta.current_page` | integer |  |
  | `meta.from` | integer \| null |  |
  | `meta.last_page` | integer |  |
  | `meta.links` | array<object> | Generated paginator links. |
  | `meta.path` | string \| null | Base path for paginator generated URLs. |
  | `meta.per_page` | integer | Number of items shown per page. |
  | `meta.to` | integer \| null | Number of the last item in the slice. |
  | `meta.total` | integer | Total number of items being paginated. |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404` — Not found (`CommunitiesModelNotFoundException`)
- `422` — Validation error (`CommunitiesValidationException`)

## Secciones citadas

Las secciones de la descripción general de cada área que citan las llamadas y los eventos de este texto, tal como las escribe el área.

### Acciones de grupo

#### Motivos

El `reason` de una acción `failed`, el de cada persona `failed` en `result.participants` y el de `group_action.failed` usan un único vocabulario cerrado; cualquier otro caso sale como `internal_error`, nunca con el texto del proveedor. Los valores posibles son: `max_pending_days_exceeded`, `max_retries_exceeded`, `owner_not_connected`, `no_creator_available_suspended`, `parent_group_creation_failed`, `permanent_condition_unmet`, `unexpected_job_failure`, `device_not_found`, `device_not_configured`, `disconnected_device`, `not_connected`, `not_respond`, `not_initialize`, `group_forbidden`, `phone_not_exists`, `creation_unconfirmed`, `creation_rejected`, `expired`, `window_closed`, `number_restricted`, `capacity_full`, `invite_capacity_full`, `duplicate_invite`, `template_params_missing`, `template_mismatch`, `participant_not_found`, `cannot_remove_business_number`, `pending_subscription`, `provider_error`, `provider_unsupported`, `not_permitted`, `group_not_found`, `orphan_standalone_action`, `standalone_context_mismatch`, `disabled`, `plan_cap_reached`, `device_not_group_number`, `device_not_connected`, `device_not_group_admin`, `unsupported_group_type`, `join_request_not_found`, `internal_error`.

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
