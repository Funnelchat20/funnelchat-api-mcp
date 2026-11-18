# Grupos y sus acciones — API de Funnelchat: contexto para tu IA

> Copiado de /docs/mas-funciones/whatsapp/#grupos-y-acciones. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Grupos de tu cuenta: leer

- **Dos listas distintas:** «Ver tus grupos» (`GET /api/v1/devices/{device}/groups`) lee de WhatsApp los grupos de un
  número, también los que todavía no están en el workspace de la clave (ver «Grupos»). «Ver los grupos de tu cuenta»
  (`GET /api/v1/groups`) lista los que ya están en Funnelchat: filtra por `name`, `deviceId` (un número), `noCampaign`
  (los que no son de una campaña), `status` y `type` (la especificación no dice qué es cada valor de estos dos). Orden:
  `orderBy` (`created_at`, `id`, `name`, `updated_at`) y `orderByMethod` (`asc` o `desc`). Por páginas: `perPage` de
  1 a 100 (25 si no lo mandas); pide la URL de `links.next` tal cual, hasta que sea `null`.
- **`{group}` es el `uid` del grupo** (por ejemplo `120363000000000001@g.us`), no su `id`. Lo traen las dos listas.
- **Ver un grupo:** `GET /api/v1/groups/{group}`: lo que Funnelchat tiene guardado (`admins`, `participants_count`,
  `isFull`, `link`, `owner_connected`, `adminOnlyMessage`, `lastSyncAt`, entre otros). `404` si no está en el workspace de la clave.
- **Lo que dice WhatsApp ahora:** `GET /api/v1/groups/{groupUid}/metadata`, con el `uid` en la ruta y también en
  `group_uid`, más `device_id` (los dos obligatorios); `type` es `groups`, `ad-groups` o `channels`. Trae `name`,
  `description`, `image`, `link`, `admins_numbers`, `participants_numbers`, `verified_admin` y `owner`, entre otros.
  `502`: no se pudo consultar a WhatsApp; reintenta más tarde. `404`: el grupo no existe o el número no tiene acceso.
- **Los envíos programados que incluyen un grupo:** `GET /api/v1/groups/{group}/scheduled-messages`, por páginas;
  filtra por `name`. Lo demás de los envíos, en «Envíos programados».
- **Canales y grupos de anuncios de un número:** `GET /api/v1/devices/{device}/channels` y
  `GET /api/v1/devices/{device}/ad-groups`, con `page` y `pageSize` (25 por defecto, hasta 100) y `name`. No piden una
  campaña: «Ver los grupos que puedes sumar a una campaña» (`GET /api/v1/campaigns/{campaign}/available-groups`) sí.
  Cada grupo de anuncios trae `communityUid` (su comunidad); cada canal, `subscribers_count` e `invite_link`, entre
  otros. `404` (`Device not found`): no encuentra el número. La especificación no dice cómo se marca uno que ya está en
  tu cuenta: no lo afirmes.

## Participantes de un grupo

- **Los participantes:** `GET /api/v1/groups/participants?groupUid=<uid>` (el `uid` va como parámetro, no en la ruta).
  Filtra por `phone`, `isAdmin` y `eligibleForAdmin` (si se lo puede hacer administrador). Orden: `orderBy`
  (`created_at`, `id`, `updated_at`) con **`orderDirection`** (no `orderByMethod`). Cada uno trae `phone`, `isAdmin`,
  `action` y `created_at`.
- **Quién entró y salió:** `GET /api/v1/groups/{group}/participant-events`: `event_type` (`all`, `join` o `leave`),
  `start_date` y `end_date` (fecha y hora), `timezone`, `search` (hasta 50 caracteres), `page` y `perPage` (hasta 100).
  Cada uno trae `phone`, `whatsapp_id`, `event_type`, `event_at`, `group_name`, `country_code` y `country_name`.
- Para enterarte en el momento, los webhooks `group_participant.joined` y `group_participant.left` (ver «Grupos»).

## Pedir una acción de grupo: es asíncrona

- Son acciones: crear un grupo, sumar o sacar participantes, hacer o quitar administradores, cambiar el nombre, la
  descripción, la foto o quién escribe, renovar el link y aprobar o rechazar solicitudes (y mandar un mensaje, en
  «Grupos»). Piden **Grupos y campañas → Administrar grupos**; ver cómo salieron pide **Grupos y campañas → Ver**, que
  esa casilla no incluye.
- Todas llevan `device_id`: el número que la hace. **Tiene que ser administrador del grupo** según WhatsApp (es el
  `is_admin` de «Seguir un grupo»); si no, `422 device_not_group_admin`, y reintentar no sirve.
- **Antes, mira qué permite el número:** `capabilities.groups` de `GET /api/v1/devices/{device}` trae `create`,
  `add_participants` (`direct` o `invite`), `remove_participants`, `admins`, `photo`, `settings`, `invite_link`,
  `send` y `join_requests` (`list` o `list_and_decide`). Si el número no lo permite, o es oficial y la cuenta no tiene
  habilitados los grupos de la API oficial: `422 provider_unsupported`, con `provider` y, si a la cuenta le falta una
  habilitación, `requires` (lo que hace falta).
- **Responde `202` con `{"action_id": "…", "status": "queued"}` (así, sin `data` alrededor): aceptada, no hecha.** Se hace después, al ritmo de
  las campañas del número (sumar participantes, de a uno; entre creaciones de grupos, una espera); no se puede
  acelerar.
- **Cómo salió:** `GET /api/v1/groups/actions/{action}`, con `{action}` el `action_id`. Responde `data` con
  `action_id`, `type`, `status` (`queued`, `running`, `completed` o `failed`), `device_id`, `group` (`uid` y `name`;
  `null` mientras una creación no terminó), `result`, `reason`, `created_at`, `started_at`, `completed_at` y
  `failed_at`. `device_id` y `group` vienen en `null` si son de otro workspace que el de la clave. `404 action_not_found`
  si no existe o no es de la cuenta. Mejor que consultar en un bucle: el webhook `group_action.completed` (terminó,
  con el mismo `result`) o `group_action.failed` (falló entera; solo `reason`, sin `result`), con `data.action.uuid`
  igual al `action_id` y `data.action.type`.
- **`result` solo tiene valor con `completed`:** mientras está `queued` o `running`, `result` y `reason` son `null`;
  con `failed`, `result` es `null` y `reason` dice por qué. Su forma depende de `type`: `{"participants": [...]}` en
  las acciones con teléfonos, `{"group": {"uid", "name"}, "invite_link"}` al crear un grupo, `{"invite_link"}` al
  renovar el link, `{"message": {"uid"}}` al mandar un mensaje y `{}` en las demás.
- **`reason` es un vocabulario cerrado** (el de la acción `failed`, el de cada persona `failed` y el de
  `group_action.failed`), por ejemplo `device_not_connected`, `device_not_group_admin`, `group_not_found`,
  `phone_not_exists`, `window_closed`, `capacity_full`, `creation_unconfirmed`, `plan_cap_reached`, `provider_error` o
  `provider_unsupported`; lo que no tiene un motivo propio sale `internal_error`, nunca con el texto de WhatsApp.
  Muéstraselo a la persona tal cual.
- **`completed` no quiere decir que cada persona salió bien.** En las acciones con teléfonos, `result.participants`
  es una lista, en el orden del pedido, con una entrada por teléfono: `{"identity": "…", "identity_type": "phone",
  "status": "…", "reason": null}`, con `status` `added`, `invited`, `removed`, `promoted`, `demoted`, `approved`,
  `rejected` o `failed`, y `reason` solo cuando falló. Revisa cada una y dile a la persona cuáles no salieron. `added` es
  que WhatsApp aceptó la operación, no que la persona siga en el grupo.
- **Teléfonos:** `phones` (o `participants` al crear), hasta 20 por pedido una vez normalizados y sin repetidos; si
  hay más, `422 max_phones`.
- **Sin clave de idempotencia:** no repitas un pedido que respondió `202`. Después de un `5xx` o sin respuesta,
  reintentar puede hacer la acción dos veces: mira antes cómo quedó el grupo.
- **Topes:** hasta 50 acciones abiertas (`queued` o `running`) por número (`429 too_many_pending_actions`: espera a
  que terminen); hasta 30 pedidos de acciones por minuto y 30 lecturas en el momento por minuto (link y solicitudes).
- **Otros errores** (cuerpo `{"error": "…", "message": "…"}`): `404 group_not_found` (el grupo no está en el workspace de la clave:
  con un número por QR, síguelo con «Seguir un grupo» y vuelve a pedir), `404 device_not_found`,
  `422 device_not_connected`, `422 device_not_group_number` (el número no es el del grupo),
  `422 unsupported_group_type` (ese tipo de grupo no admite la acción), `402 plan_cap_reached` (el plan no incluye la
  acción o llegó a su tope: el plan del workspace si tiene uno propio, o el de la cuenta si no), `502 provider_error` (falló WhatsApp) y `403 route_not_available` (las
  acciones de grupo por la API no están habilitadas).

## Crear un grupo

- `POST /api/v1/groups` con `device_id`, `name` (1 a 100 caracteres) y `participants` (de 1 a 20 teléfonos distintos,
  sin contar el del propio número, que nunca va en la lista) y, si quieres, `description` (hasta 2048). Crea un grupo
  real en WhatsApp y suma a esas personas: antes, confírmale a la persona el nombre, el número y los participantes.
- `join_approval_required: true`, solo con un número oficial, crea el grupo pidiendo aprobación para entrar; después no
  se puede cambiar. Con un número por QR, `422 provider_unsupported`.
- `402 plan_cap_reached`: se llegó al tope de grupos oficiales del plan (el del workspace si tiene uno propio, o el de la cuenta si no). Trae `feature`, `parameter`, `cap`
  (el tope) y `used` (lo usado); no se registra ninguna acción. Reintentar no sirve: díselo a la persona.
- **El `uid` del grupo nuevo no viene en la respuesta** (`202` con `action_id` y `status`): llega cuando la acción
  termina. En `GET /api/v1/groups/actions/{action}` viene en `group` (`uid` y `name`) y en `result` (`group` con
  `uid` y `name`, e `invite_link`); en el webhook `group_action.completed`, en `data.group` (`uid` y `name`), con
  `data.action` (`uuid`, el `action_id`, y `type`) y `data.result.invite_link`. Vale igual para un número por QR y
  para uno oficial (en uno oficial, cuando WhatsApp confirma la creación).
- Con un número oficial, si WhatsApp no lo confirma, termina `failed` con `creation_unconfirmed` aunque el grupo pueda
  existir: busca en `GET /api/v1/groups` antes de crearlo otra vez.
- `group.created` llega solo por los grupos que se crean o se importan dentro de una campaña: no lo esperes para un
  grupo sin campaña.

## Nombre, descripción, foto y quién escribe

- **Nombre:** `PUT /api/v1/groups/{group}/name` con `name` (1 a 100); va a WhatsApp tal cual, sin la numeración de la
  campaña.
- **Descripción:** `PUT /api/v1/groups/{group}/description` con `description` (hasta 2048). Vacía, con un número por
  QR la borra; con un número oficial responde `422 validation_failed` (con `errors.description`): WhatsApp no permite
  borrar la descripción de un grupo oficial. **Borrarla: hazlo solo si la persona lo pide de forma explícita para eso;
  confírmale qué grupo (nombre y `uid`) antes de llamar.**
- **Foto:** `PUT /api/v1/groups/{group}/photo` con `photo_url`: una dirección `https` de una imagen jpg, jpeg o png.
  Solo números por QR.
- **Quién escribe:** `PUT /api/v1/groups/{group}/settings` con `members_can_send_messages` (`true`, escriben todos;
  `false`, solo los administradores, que pasan a ser también los únicos que editan los datos del grupo). Solo números
  por QR.
- En estas cuatro, `result` llega vacío (`{}`): para ver cómo quedó, «Ver los datos de un grupo en WhatsApp».

## Sumar, sacar y administradores

- **Sumar:** `POST /api/v1/groups/{group}/participants` con `device_id` y `phones`. Por QR, entran directo. Oficial,
  por invitación: cada persona recibe la plantilla de invitación que eligió la cuenta y queda `invited`; sin plantilla
  elegida, `422 invite_template_not_configured`. En un grupo de un número oficial hay un tope de 8 participantes: caben
  solo los lugares libres menos las invitaciones activas (`422 capacity_full` o `422 invite_capacity_full`);
  `422 duplicate_invite` si alguien ya tiene una invitación activa.
- **Sacar:** `POST /api/v1/groups/{group}/participants/remove` con `phones`, en una sola operación de WhatsApp. **Hazlo
  solo si la persona lo pide de forma explícita para eso; confírmale qué vas a sacar (nombre y `uid` del grupo, y los
  teléfonos) antes de llamar.** No admite el teléfono del propio número (`422 cannot_target_executing_device`).
- **Hacer administradores:** `POST /api/v1/groups/{group}/admins` con `phones`; un teléfono que no está en el grupo se
  suma primero. Solo números por QR.
- **Quitar administradores:** `POST /api/v1/groups/{group}/admins/remove` con `phones`. **Mismo cuidado: solo si la
  persona lo pide de forma explícita para eso; confírmale el grupo (nombre y `uid`) y los teléfonos antes de llamar.**
  No admite el propio número; `422 not_a_participant` si el teléfono no es un miembro conocido del grupo. Solo números
  por QR.
- `422 cannot_target_account_device`: no se puede apuntar a otro número de la cuenta.

## Link de invitación

- **Ver:** `GET /api/v1/groups/{group}/invite-link/live?device_id=dev_Ac7Ku7iIZDXJTjdCu0UB1mX`: lo lee en el momento de WhatsApp y responde
  `data.invite_link`. Una lectura que salió bien se reutiliza unos segundos.
- **Renovar:** `POST /api/v1/groups/{group}/invite-link/renew` con `{"device_id": "dev_Ac7Ku7iIZDXJTjdCu0UB1mX"}`; el link queda en
  `result.invite_link`. Por QR **no lo cambia**: vuelve a leer el vigente. Oficial: revoca el anterior, que deja de
  servir, y WhatsApp genera uno nuevo; **hazlo solo si la persona lo pide de forma explícita para eso; confírmale el
  grupo (nombre y `uid`) antes de llamar.**
- `group.invite_link_renewed`: el link cambió por una renovación (automática, al detectarse inválido, o pedida), con
  `invite_link`, `previous_invite_link` y `trigger`; no llega por los cambios que detecta la sincronización ni por el
  link inicial al crear el grupo. `group.invite_link_down`: el link quedó confirmado caído y la renovación no consiguió
  otro; una sola vez por episodio, con `reason` y `renewal_attempted`.

## Solicitudes para unirse (solo números oficiales)

- **Ver:** `GET /api/v1/groups/{group}/join-requests?device_id=dev_Ac7Ku7iIZDXJTjdCu0UB1mX` (con un número por QR,
  `422 provider_unsupported`). Responde `data`, una entrada por solicitud pendiente con `participant` (`identity`,
  `identity_type`, `name`) y `requested_at` (puede ser `null`): hasta 100, en el orden de WhatsApp, solo su primera
  página. Las que no traen teléfono no aparecen.
- **Aprobar o rechazar:** `POST /api/v1/groups/{group}/join-requests/approve` o `.../reject`, con `device_id` y
  `phones` (el teléfono de cada persona). Solo cuando `capabilities.groups.join_requests` del número es
  `list_and_decide`; si no, `422 provider_unsupported`. Aprobar verifica que entren en los lugares libres
  (`422 capacity_full`); rechazar no lo verifica.
- **Rechazar:** hazlo solo si la persona lo pide de forma explícita para eso; confírmale el grupo y los teléfonos
  antes de llamar.
- `result.participants` trae una entrada por teléfono, en el orden del pedido: `approved`, `rejected` o `failed`, con
  `reason` `join_request_not_found` (no tiene una solicitud pendiente, o está más allá de la primera página),
  `capacity_full`, `provider_error` o `provider_unsupported`.
- Aprobar no suma a la persona a la lista de participantes en el momento: el alta llega cuando WhatsApp la informa,
  con `group_participant.joined`.
- `group_join_request.created` (alguien pidió unirse) y `group_join_request.revoked` (retiró el pedido) traen `group`
  y `participant`. `identity_type` es `whatsapp_user` cuando la persona no se identifica por teléfono: como se aprueba
  y rechaza por teléfono, esa solicitud no se puede decidir por la API.

## Lo que pasa en tus grupos: eventos

- Crea un webhook con `POST /api/v1/webhooks` y los eventos que necesites. La clave necesita **Avisos (webhooks) →
  Administrar** y, por estos eventos, **Grupos y campañas → Ver**. Llegan solo si hay una suscripción a ese tipo; el
  mismo evento puede llegar más de una vez: descarta los repetidos por el `id` del sobre.
- `group.message_received` (alguien escribió: `participant` y `message` con `uid`, `type`, `text`, `caption`,
  `media_url`, `mime_type`, `file_name` y `quoted_uid`; las que no aplican vienen en `null`, como las de multimedia y
  `quoted_uid` en un texto) y `group.reaction_added` (`message.uid`, el mensaje al que reaccionaron, y `reaction`)
  reflejan lo que informó WhatsApp: la autoría no se verifica por separado. El mensaje se identifica con `uid`, no con
  `id`: el `id` es el del sobre. En `group.message_received`, `media_url` puede venir `null` en un grupo de un número
  por QR, o ser una URL temporal.
- `poll.voted`: alguien votó, o cambió su voto, en una encuesta mandada a un grupo (`poll.uid`, `options`,
  `participant`, `scheduled_message.uuid`). Un voto en una encuesta de un envío programado también es una respuesta de
  `scheduled_message.response_received` (ver «Envíos programados»); la especificación no dice si llegan los dos por el
  mismo voto: si te suscribes a ambos, no lo cuentes dos veces.
- `group.full`: el grupo pasó de no estar lleno a estarlo (`trigger`, `participants`). `group.blocked`: un grupo de
  una campaña quedó inoperable, con `reason` `admin_access_lost` (sin un administrador conectado),
  `invite_link_invalid` (el link dejó de funcionar y renovarlo no consiguió otro) o `suspended` (WhatsApp lo
  suspendió); `group.recovered`: volvió a operar, con `reason` `access_restored` o `invite_link_renewed`. Un grupo que
  no es de una campaña no genera ninguno de los dos.
- `group.created`: se creó o se importó un grupo dentro de una campaña de la cuenta (`source`).

## Las acciones que se corrieron sobre un grupo

- `GET /api/v1/groups/{group}/actions`, por páginas (`page`, `perPage` hasta 100; orden `status`, `created_at`,
  `updated_at` o `completed_at`): cada una con `action_name`, `action_label`, `status`, `info`, `executed_at` y
  `executed_by`. La especificación las llama «acciones de sesión» y no dice si incluye las que pediste por la API: para
  una tuya, usa su `action_id`.

## Llamadas

### Ver los grupos de tu cuenta

`GET /api/v1/groups` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `group.index`

**Para qué sirve:** Úsalo para listar los grupos de tu cuenta con filtros por tipo, estado, número o sin campaña asignada, por ejemplo para sincronizarlos con tu sistema.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `perPage` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`). Orden: `orderBy` acepta `created_at`, `id`, `name`, `updated_at`; dirección `orderByMethod`: `asc` o `desc`. Otro valor responde `422`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `name` | query | string | no |  |
| `orderBy` | query | string | no |  |
| `orderByMethod` | query | string | no |  |
| `type` | query | string ∈ {"1", "2", "3", "4"} | no |  |
| `perPage` | query | integer | no |  |
| `status` | query | string ∈ {"0", "1", "2", "3", "4", "5", "6", "7", "8"} | no |  |
| `deviceId` | query | string | no |  |
| `noCampaign` | query | boolean | no |  |

**Respuestas**

- `200` — Paginated set of `GroupResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<GroupResource> |  |
  | `data[].id` | string \| null | `orNull`: a resource of an unsaved group (an event, a test) has no id, and keeps its `null`. Id opaco: un texto que empieza con `grp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].admins_numbers` | string |  |
  | `data[].admins` | array<any> |  |
  | `data[].admins_count` | string |  |
  | `data[].owner` | string |  |
  | `data[].owner_display_phone` | string |  |
  | `data[].owner_connected` | boolean |  |
  | `data[].clicks` | string |  |
  | `data[].communityUid` | string |  |
  | `data[].newsletterUid` | string |  |
  | `data[].description` | string \| string ∈ {""} |  |
  | `data[].deviceId` | string \| null | Id del número del grupo, o `null` si no tiene o si el número no es del workspace de la clave. Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].image` | string |  |
  | `data[].isFull` | string \| boolean |  |
  | `data[].isApi` | boolean |  |
  | `data[].link` | string \| string ∈ {""} |  |
  | `data[].campaign_link` | string \| string ∈ {""} |  |
  | `data[].campaign_custom_domain` | string \| null | Dominio propio de la campaña del grupo para su link público, o `null` si no tiene. |
  | `data[].name` | string |  |
  | `data[].order` | string |  |
  | `data[].participants_numbers` | string |  |
  | `data[].participants_count` | string |  |
  | `data[].status` | string |  |
  | `data[].uid` | string |  |
  | `data[].updatedAt` | string |  |
  | `data[].createdAt` | string |  |
  | `data[].scheduled_message_count` | string \| integer ∈ {0} |  |
  | `data[].type` | string |  |
  | `data[].manual_import` | boolean |  |
  | `data[].participantMode` | boolean | Participant mode (additive): true iff the group is marked. False when the column is absent from the row (e.g. an explicit `select`). |
  | `data[].ownNumbers` | string \| null | The user's own connected numbers in the group (additive). `null` means "not computed on this path / not applicable" (show, broadcast events, channels, groups without a resolved connection). |
  | `data[].adminOnlyMessage` | boolean \| null | Stored write permission (additive): true = only admins can send, false = anyone can, null = never observed (or the column is absent from the row). Informational: sending decisions also need the cached confirmation. |
  | `data[].origin` | integer ∈ {1, 0} |  |
  | `data[].lastSyncAt` | string \| null |  |
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
  | `meta.cloud_api_groups_enabled` | string \| boolean |  |
  | `meta.device_groups_sync_enabled` | boolean |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `422` — Validation error (`CommunitiesValidationException`)

### Ver un grupo

`GET /api/v1/groups/{group}` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `group.show`

**Para qué sirve:** Sirve para ver el detalle de un grupo: administradores, si el dueño está conectado, clics, link de invitación y de campaña, y si está lleno.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí | The group uid |

**Respuestas**

- `200` — `GroupResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `id` | string \| null | `orNull`: a resource of an unsaved group (an event, a test) has no id, and keeps its `null`. Id opaco: un texto que empieza con `grp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `admins_numbers` | string |  |
  | `admins` | array<any> |  |
  | `admins_count` | string |  |
  | `owner` | string |  |
  | `owner_display_phone` | string |  |
  | `owner_connected` | boolean |  |
  | `clicks` | string |  |
  | `communityUid` | string |  |
  | `newsletterUid` | string |  |
  | `description` | string \| string ∈ {""} |  |
  | `deviceId` | string \| null | Id del número del grupo, o `null` si no tiene o si el número no es del workspace de la clave. Id opaco: un texto que empieza con `dev_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `image` | string |  |
  | `isFull` | string \| boolean |  |
  | `isApi` | boolean |  |
  | `link` | string \| string ∈ {""} |  |
  | `campaign_link` | string \| string ∈ {""} |  |
  | `campaign_custom_domain` | string \| null | Dominio propio de la campaña del grupo para su link público, o `null` si no tiene. |
  | `name` | string |  |
  | `order` | string |  |
  | `participants_numbers` | string |  |
  | `participants_count` | string |  |
  | `status` | string |  |
  | `uid` | string |  |
  | `updatedAt` | string |  |
  | `createdAt` | string |  |
  | `scheduled_message_count` | string \| integer ∈ {0} |  |
  | `type` | string |  |
  | `manual_import` | boolean |  |
  | `participantMode` | boolean | Participant mode (additive): true iff the group is marked. False when the column is absent from the row (e.g. an explicit `select`). |
  | `ownNumbers` | string \| null | The user's own connected numbers in the group (additive). `null` means "not computed on this path / not applicable" (show, broadcast events, channels, groups without a resolved connection). |
  | `adminOnlyMessage` | boolean \| null | Stored write permission (additive): true = only admins can send, false = anyone can, null = never observed (or the column is absent from the row). Informational: sending decisions also need the cached confirmation. |
  | `origin` | integer ∈ {1, 0} |  |
  | `lastSyncAt` | string \| null |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404` — Not found (`CommunitiesModelNotFoundException`)

### Ver los datos de un grupo en WhatsApp

`GET /api/v1/groups/{groupUid}/metadata` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `groupMetadata.show`

**Para qué sirve:** Úsalo para leer en vivo desde WhatsApp el nombre, la foto, la descripción, el link y los administradores actuales de un grupo o canal, por ejemplo para verificar que coincidan con lo esperado.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `groupUid` | path | string | sí | Identificador del grupo o del canal en WhatsApp. |
| `device_id` | query | string | sí |  |
| `group_uid` | query | string | sí |  |
| `type` | query | string ∈ {"groups", "ad-groups", "channels"} | no |  |

**Respuestas**

- `200` — `GroupMetadataResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `name` | string \| string ∈ {""} |  |
  | `description` | string \| null |  |
  | `image` | string \| null |  |
  | `link` | string \| null |  |
  | `admins_numbers` | array<string> |  |
  | `participants_numbers` | array<string> |  |
  | `verified_admin` | boolean |  |
  | `membership` | string |  |
  | `subscribers_count` | integer |  |
  | `participants` | array<any> |  |
  | `owner` | string \| null |  |

- `401` — Unauthenticated (`CommunitiesAuthenticationException`)
- `403` — Authorization error (`CommunitiesAuthorizationException`)
- `404` — El grupo o el canal no existe, o el número no tiene acceso a él.
- `422` — Validation error (`CommunitiesValidationException`)
- `502` — No se pudo consultar a WhatsApp. Reintenta más tarde.

### Ver los envíos programados de un grupo

`GET /api/v1/groups/{group}/scheduled-messages` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `group.scheduledMessages`

**Para qué sirve:** Úsalo para saber qué envíos programados incluyen a un grupo, por ejemplo antes de hacerle cambios.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `perPage` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`). Orden: `orderBy` acepta `send_at`, `name`, `status`, `id`, `created_at`, `updated_at`; dirección `orderByMethod`: `asc` o `desc`. Otro valor responde `422`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí | The group uid |
| `name` | query | string | no |  |
| `orderBy` | query | string ∈ {"send_at", "name", "status", "id", "created_at", "updated_at"} | no |  |
| `orderByMethod` | query | string ∈ {"ASC", "DESC"} | no |  |
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — Paginated set of `ScheduledMessageResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<ScheduledMessageResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `smg_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].uuid` | string | Identificador estable del envío: es el `scheduled_message.uuid` de los eventos `scheduled_message.*`. `null` solo en un envío creado antes del 30-09-2026 que todavía no generó ningún evento: se completa con el primero. |
  | `data[].name` | string |  |
  | `data[].send_at` | string |  |
  | `data[].status` | string |  |
  | `data[].type` | string |  |
  | `data[].audience` | string |  |
  | `data[].total_readed` | string |  |
  | `data[].total_played` | string |  |
  | `data[].campaigns` | array<object> |  |
  | `data[].groups` | array<object> |  |
  | `data[].total_groups` | string |  |
  | `data[].messages` | array<MessageTemplateResource> |  |
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

### Ver los participantes de un grupo

`GET /api/v1/groups/participants` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `group.participants`

**Para qué sirve:** Úsalo para listar los participantes de un grupo, filtrando por teléfono, si son administradores o si se los puede promover a administrador.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `perPage` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`). Orden: `orderBy` acepta `created_at`, `id`, `updated_at`; dirección `orderDirection`: `asc` o `desc`. Otro valor responde `422`.

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `groupUid` | query | string | sí |  |
| `phone` | query | string | no |  |
| `isAdmin` | query | string ∈ {"true", "false", "1", "0"} | no |  |
| `eligibleForAdmin` | query | string ∈ {"true", "false", "1", "0"} | no |  |
| `orderBy` | query | string | no |  |
| `orderDirection` | query | string ∈ {"asc", "desc"} | no |  |
| `perPage` | query | integer | no |  |

**Respuestas**

- `200` — Paginated set of `ParticipantResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<ParticipantResource> |  |
  | `data[].id` | string | Id opaco: un texto que empieza con `prt_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].phone` | string |  |
  | `data[].action` | string |  |
  | `data[].isAdmin` | string |  |
  | `data[].created_at` | string \| string ∈ {""} |  |
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
- `422` — Validation error (`CommunitiesValidationException`)

### Ver quién entró y salió de un grupo

`GET /api/v1/groups/{group}/participant-events` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `group.participantEvents`

**Para qué sirve:** Sirve para ver quién entró y salió de un grupo puntual y cuándo, con país y filtros por fecha o tipo de evento.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `perPage` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`).

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `group` | path | string | sí | The group uid |
| `search` | query | string \| null | no |  |
| `event_type` | query | string \| null ∈ {"all", "join", "leave", null} | no |  |
| `page` | query | integer \| null | no |  |
| `perPage` | query | integer \| null | no |  |
| `start_date` | query | string (date-time) \| null | no |  |
| `end_date` | query | string (date-time) \| null | no |  |
| `timezone` | query | string \| null | no |  |
| `date_mode` | query | string \| null ∈ {"both", "joins_only", "leaves_only", null} | no |  |
| `selection_type` | query | string \| null ∈ {"all", "none", null} | no |  |
| `groups_uids[]` | query | array<string> | no |  |
| `participant_filter` | query | string \| null ∈ {"all", "active", null} | no |  |

**Respuestas**

- `200` — Paginated set of `ParticipantEventResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<ParticipantEventResource> |  |
  | `data[].phone` | string |  |
  | `data[].whatsapp_id` | string |  |
  | `data[].event_type` | string ∈ {"join", "leave"} |  |
  | `data[].event_at` | string \| null |  |
  | `data[].group_id` | string | Id opaco: un texto que empieza con `grp_`. Se usa tal como llega; no se arma ni se interpreta. |
  | `data[].group_name` | string |  |
  | `data[].country_code` | string |  |
  | `data[].country_name` | string |  |
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

### Ver los canales de un número

`GET /api/v1/devices/{device}/channels` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `group.channels`

**Para qué sirve:** Sirve para ver los canales de WhatsApp de un número sin pasar por una campaña, con sus identificadores.

**Con API key:** la respuesta siempre viene paginada. Tamaño de página: `pageSize` (por defecto 25, máximo 100; un valor mayor, menor que 1 o no entero responde `422`).

**Parámetros**

| Nombre | En | Tipo | Obligatorio | Descripción |
|---|---|---|---|---|
| `device` | path | string | sí |  |
| `name` | query | string \| null | no |  |
| `page` | query | integer | no |  |
| `pageSize` | query | integer | no |  |

**Respuestas**

- `200` — Array of `ChannelMinResource`

  | Campo | Tipo | Descripción |
  |---|---|---|
  | `data` | array<ChannelMinResource> |  |
  | `data[].id` | string \| null |  |
  | `data[].uid` | string \| null |  |
  | `data[].name` | string \| string ∈ {""} |  |
  | `data[].description` | string \| string ∈ {""} |  |
  | `data[].state` | string \| null |  |
  | `data[].subscribers_count` | integer |  |
  | `data[].invite_link` | string \| null |  |
  | `data[].verification` | string \| null |  |
  | `data[].picture` | string \| null |  |
  | `data[].preview` | string \| null |  |
  | `data[].creation_time` | integer \| null |  |
  | `data[].mute` | string \| null |  |
  | `data[].role` | string \| null |  |
  | `data[].group_id` | string \| null | Id opaco: un texto que empieza con `grp_`. Se usa tal como llega; no se arma ni se interpreta. |
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

### Ver los grupos de anuncios de un número

`GET /api/v1/devices/{device}/ad-groups` · permiso **Grupos y campañas → Ver** · área communities · `operationId` `group.adGroups`

**Para qué sirve:** Úsalo para ver los grupos de anuncios de un número sin pasar por una campaña; cada uno trae la comunidad a la que pertenece (`communityUid`).

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

## Los eventos

Llegan por webhook. Cómo crear uno, cómo llega cada entrega, los reintentos, el permiso que pide cada evento y cómo verificar la firma (con funciones probadas en Node.js, Python y PHP): https://developers-portal.funnelchat.app/ia/lo-basico.md.

### `group.created`

Se creó o se importó un grupo dentro de una campaña del workspace; `source` vale `imported` si el grupo ya existía en WhatsApp y entró por una importación o una sincronización, y `created` en cualquier otro caso.

Ejemplo:

```json
{
  "id": "evt_00000000000000000000000000000001",
  "type": "group.created",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "group": {
      "uid": "120363000000000001@g.us",
      "name": "Grupo de ejemplo",
      "type": "group"
    },
    "campaign": {
      "uuid": "xK9mQz",
      "name": "Campaña de ejemplo"
    },
    "source": "created",
    "workspace_id": 37
  }
}
```

### `group.blocked`

Un grupo de una campaña quedó inoperable: sin administrador conectado, con el link de invitación inválido o suspendido por WhatsApp; un grupo que no es de una campaña no lo genera.

Ejemplo:

```json
{
  "id": "evt_00000000000000000000000000000005",
  "type": "group.blocked",
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
    "reason": "admin_access_lost",
    "workspace_id": 37
  }
}
```

### `group.recovered`

Un grupo de una campaña que estaba bloqueado volvió a operar; un grupo que no es de una campaña no lo genera.

Ejemplo:

```json
{
  "id": "evt_00000000000000000000000000000006",
  "type": "group.recovered",
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
    "reason": "access_restored",
    "workspace_id": 37
  }
}
```

### `group.full`

Un grupo pasó de no estar lleno a estarlo.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "group.full",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "group": {
      "uid": "120363000000000000@g.us",
      "name": "Grupo de ejemplo",
      "type": "tipo_de_ejemplo"
    },
    "campaign": {
      "uuid": "xK9mQz",
      "name": "Campaña de ejemplo"
    },
    "trigger": "participants_limit",
    "participants": 1024,
    "workspace_id": 37
  }
}
```

### `group.invite_link_down`

El enlace de invitación de un grupo quedó confirmado caído (WhatsApp respondió que no existe y la renovación no consiguió otro); no se publica por errores transitorios ni por grupos prohibidos o suspendidos, y se publica una sola vez por episodio de bloqueo.

Ejemplo:

```json
{
  "id": "evt_0000000000000000000000000000000d",
  "type": "group.invite_link_down",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "group": {
      "uid": "120363000000000001@g.us",
      "name": "Grupo de ejemplo",
      "type": "group"
    },
    "campaign": {
      "uuid": "xK9mQz",
      "name": "Campaña de ejemplo"
    },
    "reason": "http_404",
    "renewal_attempted": true,
    "workspace_id": 37
  }
}
```

### `group.invite_link_renewed`

El enlace de invitación de un grupo cambió por una renovación, automática al detectarse inválido o pedida por el usuario; no se publican los cambios que detecta la sincronización ni el enlace inicial al crear el grupo.

Ejemplo:

```json
{
  "id": "evt_0000000000000000000000000000000c",
  "type": "group.invite_link_renewed",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "group": {
      "uid": "120363000000000001@g.us",
      "name": "Grupo de ejemplo",
      "type": "group"
    },
    "campaign": {
      "uuid": "xK9mQz",
      "name": "Campaña de ejemplo"
    },
    "invite_link": "https://chat.whatsapp.com/EjemploNuevo0000000000001",
    "previous_invite_link": "https://chat.whatsapp.com/EjemploAnterior000000000001",
    "trigger": "automatic",
    "recovered": false,
    "workspace_id": 37
  }
}
```

### `group.message_received`

Una persona escribió un mensaje en un grupo.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "group.message_received",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "group": {
      "uid": "120363000000000000@g.us",
      "name": "Grupo de ejemplo"
    },
    "participant": {
      "identity": "5491100000000",
      "identity_type": "phone",
      "name": "Ana Ejemplo"
    },
    "message": {
      "uid": "msg-ejemplo-01",
      "type": "text",
      "text": "Hola a todos",
      "caption": null,
      "media_url": null,
      "mime_type": null,
      "file_name": null,
      "quoted_uid": null
    },
    "workspace_id": 37
  }
}
```

### `group.reaction_added`

Una persona reaccionó a un mensaje de un grupo.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "group.reaction_added",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "group": {
      "uid": "120363000000000000@g.us",
      "name": "Grupo de ejemplo"
    },
    "participant": {
      "identity": "5491100000000",
      "identity_type": "phone",
      "name": "Ana Ejemplo"
    },
    "message": {
      "uid": "msg-ejemplo-01"
    },
    "reaction": "👍",
    "workspace_id": 37
  }
}
```

### `group_join_request.created`

Una persona pidió unirse a un grupo oficial que pide aprobación para entrar, y su solicitud quedó pendiente. Si el grupo es de una campaña, también llega a las suscripciones filtradas por esa campaña. Se aprueba o rechaza por API con el teléfono de la persona, cuando el número anuncia `groups.join_requests` en `"list_and_decide"`; el resultado por persona llega en `group_action.completed`.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "group_join_request.created",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "group": {
      "uid": "120363000000000000@g.us",
      "name": "Grupo de ejemplo"
    },
    "participant": {
      "identity": "5491100000000",
      "identity_type": "phone",
      "name": "Ana Ejemplo"
    },
    "workspace_id": 37
  }
}
```

### `group_join_request.revoked`

Una persona retiró su solicitud pendiente para unirse a un grupo antes de que se aprobara o rechazara. Trae los mismos campos que `group_join_request.created`.

Ejemplo:

```json
{
  "id": "evt_0f8e4b526c1d4c7a9a3e2b5d",
  "type": "group_join_request.revoked",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "group": {
      "uid": "120363000000000000@g.us",
      "name": "Grupo de ejemplo"
    },
    "participant": {
      "identity": "5491100000000",
      "identity_type": "phone",
      "name": "Ana Ejemplo"
    },
    "workspace_id": 37
  }
}
```

### `poll.voted`

Un participante votó en una encuesta enviada a un grupo, o cambió su voto.

Ejemplo:

```json
{
  "id": "evt_0000000000000000000000000000000b",
  "type": "poll.voted",
  "version": 1,
  "occurred_at": "2026-10-01T12:00:00Z",
  "data": {
    "poll": {
      "uid": "3EB0000000000000000001"
    },
    "group": {
      "uid": "120363000000000001@g.us"
    },
    "scheduled_message": {
      "uuid": "00000000-0000-4000-8000-000000000004"
    },
    "participant": {
      "identity": "5491100000000",
      "identity_type": "phone",
      "name": null
    },
    "options": [
      "Opción A"
    ],
    "workspace_id": 37
  }
}
```

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
