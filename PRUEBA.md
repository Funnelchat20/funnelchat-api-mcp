# Prueba del MCP de la API contra el sandbox

- Fecha: 2026-11-18T01:17:09.176Z
- Sandbox: `http://localhost:4010` (@funnelchat-hq/sandbox), clave de prueba del sandbox
- Transportes: stdio y HTTP (`/mcp`, sin sesión, la clave en `Authorization: Bearer`)
- Resultado: **21 de 21** pasos como se esperaba
- Entregas que recibió el receptor local: webhook.test, message.status_changed, message.status_changed, message.status_changed

| # | Paso | Vía | Tool | isError | ¿Como se esperaba? |
|---|---|---|---|---|---|
| 1 | Listar tools | stdio y HTTP | `tools/list` | no | sí |
| 2 | status al empezar | stdio | `status` | no | sí |
| 3 | help de messages (lista de acciones) | stdio | `messages` | no | sí |
| 4 | help de contacts → create | stdio | `contacts` | no | sí |
| 5 | help de webhooks → create | stdio | `webhooks` | no | sí |
| 6 | Mandar un texto | stdio | `messages` | no | sí |
| 7 | Ver ese mensaje (estado) | stdio | `messages` | no | sí |
| 8 | Crear un contacto | stdio | `contacts` | no | sí |
| 9 | Ver tus contactos (perPage 2, filtro por teléfono) | stdio | `contacts` | no | sí |
| 10 | Crear un webhook | stdio | `webhooks` | no | sí |
| 11 | Probar el webhook | stdio | `webhooks` | no | sí |
| 12 | Ver sus entregas | stdio | `webhooks` | no | sí |
| 13 | Mandar otro texto (con el webhook) | stdio | `messages` | no | sí |
| 14 | El receptor recibió message.status_changed | webhook | `(receptor local)` | no | sí |
| 15 | Error de validación (sin device_id) | stdio | `messages` | sí | sí |
| 16 | Error de permiso (seguir un grupo sin «Administrar grupos») | HTTP (clave limitada) | `groups` | sí | sí |
| 17 | Seguir el grupo con la clave completa | HTTP | `groups` | no | sí |
| 18 | Borrar el webhook sin confirm | stdio | `webhooks` | sí | sí |
| 19 | Borrar el webhook con confirm | stdio | `webhooks` | no | sí |
| 20 | search_docs | stdio | `search_docs` | no | sí |
| 21 | status al terminar | HTTP | `status` | no | sí |

## Detalle

### 1. Listar tools

Llamada (stdio y HTTP): `tools/list` `{}`

Resultado:

```json
{
  "tools": 20,
  "tools_http": 20,
  "nombres": [
    "status (-)",
    "search_docs (-)",
    "numbers (22)",
    "connect_links (4)",
    "messages (11)",
    "conversations (13)",
    "contacts (16)",
    "tags (9)",
    "custom_fields (8)",
    "templates (7)",
    "groups (11)",
    "group_actions (16)",
    "campaigns (28)",
    "broadcasts (16)",
    "automations (16)",
    "forms (18)",
    "boards (16)",
    "tickets (7)",
    "webhooks (8)",
    "account (27)"
  ],
  "caracteres": 11374,
  "tokens_aprox": 2844,
  "instrucciones": "Opera la API de Funnelchat con tu clave. Empieza con status. En cada tool, action=help lista las acciones; con params.action da sus parámetros y un ejemplo. Lo que no se deshace pide confirm: true."
}
```

### 2. status al empezar

Llamada (stdio): `status` `{}`

Resultado:

```json
{
  "account": {},
  "numbers": {
    "total": 2,
    "connected": 2,
    "list": [
      {
        "id": "dev_Sandbox0Oficial00000000",
        "alias": "Número oficial de ejemplo",
        "number": "5491100000001",
        "connection": "dedicated",
        "connected": true
      },
      {
        "id": "dev_Sandbox0QR0000000000000",
        "alias": "Número QR de ejemplo",
        "number": "5491100000002",
        "connection": "qr",
        "connected": true
      }
    ]
  },
  "webhooks": {
    "total": 0,
    "active": 0,
    "events": []
  },
  "next_step": "Crea un webhook para saber qué pasa con tus mensajes: webhooks action=create con events message.received y message.status_changed."
}
```

### 3. help de messages (lista de acciones)

Llamada (stdio): `messages` `{"action":"help"}`

Resultado:

```json
{
  "tool": "messages",
  "actions": {
    "send": "Mandar un mensaje (device_id)",
    "send_template": "Mandar una plantilla (device, template)",
    "get": "Ver un mensaje (contact, message)",
    "send_to_contact": "Mandar un mensaje a un contacto (contact, device_id, contact_id)",
    "mark_read": "Marcar un mensaje como leído (contact, message)",
    "typing": "Mostrar «escribiendo…» (contact)",
    "react": "Reaccionar a un mensaje (contact, message, emoji)",
    "remove_reaction": "Quitar una reacción (contact, message)",
    "send_form": "Mandar un formulario (contact, form_id, device_id)",
    "forward": "Reenviar un mensaje (contact, message, targets)",
    "send_contact_card": "Mandar una tarjeta de contacto (contact, device_id, contact_card_ids)"
  },
  "next": "help con params.action da los parámetros y un ejemplo."
}
```

### 4. help de contacts → create

Llamada (stdio): `contacts` `{"action":"help","params":{"action":"create"}}`

Resultado:

```json
{
  "action": "create",
  "summary": "Crear un contacto",
  "call": "POST /api/v1/contacts",
  "purpose": "Sirve para dar de alta un contacto nuevo (teléfono o WhatsApp ID, nombre, email y, si quieres, sus campos personalizados)",
  "permission": "conversations:write",
  "required": {},
  "optional": {
    "phone": "string",
    "whatsapp_id": "string",
    "name": "string",
    "email": "string",
    "image": "string",
    "deviceId": "string — Id dev_…",
    "custom_fields": "array<{id*: string, value*: string}> — Opcional"
  },
  "example": {
    "action": "create",
    "params": {
      "phone": "5491122334455",
      "name": "Ana"
    }
  }
}
```

### 5. help de webhooks → create

Llamada (stdio): `webhooks` `{"action":"help","params":{"action":"create"}}`

Resultado:

```json
{
  "action": "create",
  "summary": "Crear un webhook",
  "call": "POST /api/v1/webhooks",
  "purpose": "Sirve para empezar a recibir eventos en tu sistema",
  "permission": "webhooks:write",
  "required": {
    "url": "string",
    "events": "array<string> ∈ device.disconnected|device.connected|device.deleted|device.health_changed|device.quality_changed|device.messaging_limit_changed|device.display_name_reviewed|billing.payment_failed|billing.upcoming_charge|subscription.trial_ending|subscription.reactivated|subscription.cancellation_confirmed|subscription.dormant_ending|mac.usage_80|mac.usage_100|mac.expiring|account.blocked|message.received|flow.completed|broadcast.finished|contact.stage_changed|message.status_changed|conversation.closed|conversation.assigned|contact.tag_added|broadcast.paused|contact.tag_removed|contact.created|template.status_changed|flow.failed|whatsapp_form.completed|contact.updated|message.reaction_failed|group.created|group.invite_link_down|group.invite_link_renewed|group_participant.joined|group_participant.left|scheduled_message.group_delivery_failed|scheduled_message.response_received|poll.voted|pipeline.finished|group.blocked|group.recovered|campaign.status_changed|scheduled_message.finished|group_action.failed|daily_report.generated|campaign.no_groups_available|group.full|group_action.completed|group.message_received|group.reaction_added|group_join_request.created|group_join_request.revoked"
  },
  "optional": {
    "description": "string",
    "filters": "{campaign_ids: array<string>}"
  },
  "example": {
    "action": "create",
    "params": {
      "url": "https://example.com/webhooks/funnelchat",
      "events": [
        "device.disconnected"
      ]
    }
  }
}
```

### 6. Mandar un texto

Llamada (stdio): `messages` `{"action":"send","params":{"device_id":"dev_Sandbox0QR0000000000000","phone":"5491155550000","text":"Hola desde el MCP","client_reference":"mcp-prueba-1"}}`

Resultado:

```json
{
  "message": {
    "id": "msg_R3ekqvKTwgQw5ywwQNbZKqG",
    "contact_id": "ctc_6xXbFwZ5o6kkSmOIILtKpBM",
    "device_id": "dev_Sandbox0QR0000000000000",
    "direction": "outbound",
    "type": "text",
    "status": "queued",
    "error": null,
    "client_reference": "mcp-prueba-1",
    "created_at": "2026-11-18T01:17:09Z",
    "updated_at": "2026-11-18T01:17:09Z"
  }
}
```

### 7. Ver ese mensaje (estado)

Llamada (stdio): `messages` `{"action":"get","params":{"contact":"ctc_6xXbFwZ5o6kkSmOIILtKpBM","message":"msg_R3ekqvKTwgQw5ywwQNbZKqG"}}`

Resultado:

```json
{
  "id": "msg_R3ekqvKTwgQw5ywwQNbZKqG",
  "contact_id": "ctc_6xXbFwZ5o6kkSmOIILtKpBM",
  "device_id": "dev_Sandbox0QR0000000000000",
  "direction": "outbound",
  "type": "text",
  "status": "read",
  "error": null,
  "client_reference": "mcp-prueba-1",
  "created_at": "2026-11-18T01:17:09Z",
  "updated_at": "2026-11-18T01:17:12Z"
}
```

### 8. Crear un contacto

Llamada (stdio): `contacts` `{"action":"create","params":{"phone":"5491166667777","name":"Ana MCP"}}`

Resultado:

```json
{
  "id": "ctc_KSurl1QmNEZm9G1fksWVOte",
  "name": "Ana MCP",
  "email": null,
  "phone": "5491166667777",
  "whatsapp_id": null,
  "whatsapp_username": null,
  "has_phone": true,
  "country_code": "",
  "status": 0,
  "image": null,
  "notes": null,
  "custom_fields": [],
  "created_at": "2026-11-18T01:17:13.717000Z",
  "active_conversation": 0,
  "favorite": 0,
  "unread_messages": 0,
  "manually_unread": false,
  "last_message": null,
  "device_id": null,
  "adviser_id": null,
  "paused_at": null,
  "mac_date": null,
  "ai_assistant_name": null,
  "stage_since": null,
  "is_stagnant": false,
  "lead_score": {
    "score": 0,
    "signals_count": 0,
    "category": "insufficient_data",
    "confidence": "low",
    "disqualified": false,
    "disqualified_at": null,
    "updated_at": null
  }
}
```

### 9. Ver tus contactos (perPage 2, filtro por teléfono)

Llamada (stdio): `contacts` `{"action":"list","params":{"perPage":2,"phone":"5491166667777"}}`

Resultado:

```json
{
  "data": [
    {
      "id": "ctc_KSurl1QmNEZm9G1fksWVOte",
      "name": "Ana MCP",
      "email": null,
      "phone": "5491166667777",
      "whatsapp_id": null,
      "whatsapp_username": null,
      "has_phone": true,
      "country_code": "",
      "status": 0,
      "image": null,
      "notes": null,
      "custom_fields": [],
      "created_at": "2026-11-18T01:17:13.717000Z",
      "active_conversation": 0,
      "favorite": 0,
      "unread_messages": 0,
      "manually_unread": false,
      "last_message": null,
      "device_id": null,
      "adviser_id": null,
      "paused_at": null,
      "mac_date": null,
      "ai_assistant_name": null,
      "stage_since": null,
      "is_stagnant": false,
      "lead_score": {
        "score": 0,
        "signals_count": 0,
        "category": "insufficient_data",
        "confidence": "low",
        "disqualified": false,
        "disqualified_at": null,
        "updated_at": null
      }
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 2,
    "total": 1
  }
}
```

### 10. Crear un webhook

Llamada (stdio): `webhooks` `{"action":"create","params":{"url":"http://127.0.0.1:4011/hook","events":["message.received","message.status_changed"],"description":"Prueba del MCP"}}`

Resultado:

```json
{
  "id": "44d4be12-d4bc-4ea3-9ddb-aac0a1161793",
  "url": "http://127.0.0.1:4011/hook",
  "description": "Prueba del MCP",
  "events": [
    "message.received",
    "message.status_changed"
  ],
  "filters": {},
  "status": "active",
  "disabled_reason": null,
  "last_delivery_at": null,
  "last_success_at": null,
  "secret_rotated_at": "2026-11-18T01:17:13+00:00",
  "created_at": "2026-11-18T01:17:13+00:00",
  "updated_at": "2026-11-18T01:17:13+00:00",
  "migration": null,
  "secret": "whsec_7A4CUBBdK6wTY4WTIuhWalAQIDvYoaefu7f4yrrscafdb0b0",
  "secret_notice": "Guarda este secreto ahora: es la única vez que se muestra. Con él validas la firma del header de cada entrega."
}
```

### 11. Probar el webhook

Llamada (stdio): `webhooks` `{"action":"test","params":{"id":"44d4be12-d4bc-4ea3-9ddb-aac0a1161793"}}`

Resultado:

```json
{
  "succeeded": true,
  "response_status": 200,
  "error": null,
  "duration_ms": 3,
  "delivery_id": "dlv_gtFC5asvs0hTTAcQmx53EI2"
}
```

### 12. Ver sus entregas

Llamada (stdio): `webhooks` `{"action":"list_deliveries","params":{"id":"44d4be12-d4bc-4ea3-9ddb-aac0a1161793"}}`

Resultado:

```json
{
  "data": [
    {
      "id": "dlv_gtFC5asvs0hTTAcQmx53EI2",
      "event_id": "evt_95cd0f0861037cfdf0f2194c",
      "event_type": "webhook.test",
      "attempt": 1,
      "url": "http://127.0.0.1:4011/hook",
      "response_status": 200,
      "succeeded": true,
      "error": null,
      "duration_ms": 3,
      "attempted_at": "2026-11-18T01:17:13+00:00"
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 25,
    "total": 1
  }
}
```

### 13. Mandar otro texto (con el webhook)

Llamada (stdio): `messages` `{"action":"send","params":{"device_id":"dev_Sandbox0QR0000000000000","phone":"5491155550000","text":"Segundo mensaje","client_reference":"mcp-prueba-2"}}`

Resultado:

```json
{
  "message": {
    "id": "msg_n6Aqy8uKzOG5pEg4V5n9SoB",
    "contact_id": "ctc_6xXbFwZ5o6kkSmOIILtKpBM",
    "device_id": "dev_Sandbox0QR0000000000000",
    "direction": "outbound",
    "type": "text",
    "status": "queued",
    "error": null,
    "client_reference": "mcp-prueba-2",
    "created_at": "2026-11-18T01:17:15Z",
    "updated_at": "2026-11-18T01:17:15Z"
  }
}
```

### 14. El receptor recibió message.status_changed

Llamada (webhook): `(receptor local)` `{}`

Resultado:

```json
{
  "recibidos": [
    "webhook.test",
    "message.status_changed",
    "message.status_changed",
    "message.status_changed"
  ]
}
```

### 15. Error de validación (sin device_id)

Llamada (stdio): `messages` `{"action":"send","params":{"phone":"5491155550000","text":"Hola"}}`

Resultado (isError):

```json
{
  "status": 422,
  "error": "validation_failed",
  "message": "El campo device_id es obligatorio.",
  "errors": {
    "device_id": [
      "El campo device_id es obligatorio."
    ]
  }
}
```

### 16. Error de permiso (seguir un grupo sin «Administrar grupos»)

Llamada (HTTP (clave limitada)): `groups` `{"action":"import","params":{"group":"120363000000000001@g.us","device_id":"dev_Sandbox0QR0000000000000"}}`

Resultado (isError):

```json
{
  "status": 403,
  "error": "import_permission_required",
  "message": "Ese grupo no está en tu cuenta. Para importarlo, la API key necesita el permiso «Grupos y campañas → Administrar grupos»."
}
```

### 17. Seguir el grupo con la clave completa

Llamada (HTTP): `groups` `{"action":"import","params":{"group":"120363000000000001@g.us","device_id":"dev_Sandbox0QR0000000000000"}}`

Resultado:

```json
{
  "data": {
    "uid": "120363000000000001@g.us",
    "name": "Clientes VIP",
    "imported": true,
    "is_admin": true
  }
}
```

### 18. Borrar el webhook sin confirm

Llamada (stdio): `webhooks` `{"action":"delete","params":{"id":"44d4be12-d4bc-4ea3-9ddb-aac0a1161793"}}`

Resultado (isError):

```json
{
  "error": "confirmation_required",
  "message": "«Borrar un webhook» no se deshace. Repite la llamada con confirm: true."
}
```

### 19. Borrar el webhook con confirm

Llamada (stdio): `webhooks` `{"action":"delete","params":{"id":"44d4be12-d4bc-4ea3-9ddb-aac0a1161793"},"confirm":true}`

Resultado:

```json
{
  "status": 204,
  "ok": true
}
```

### 20. search_docs

Llamada (stdio): `search_docs` `{"query":"ventana de 24 horas plantilla","limit":3}`

Resultado:

```json
{
  "query": "ventana de 24 horas plantilla",
  "results": [
    {
      "title": "Lo que puedes hacer › Fuera de las 24 horas: plantillas",
      "url": "https://developers-portal.funnelchat.app/ia/index.md",
      "snippet": "…Meta no respondió. - `404`: el número no existe o es de otra cuenta o de otro workspace: responde igual. Un número conectado por QR no tiene esta ventana: a un teléfono nuevo le mandas el texto directamente."
    },
    {
      "title": "Contactos y conversaciones › Los contactos de un número, la ventana de 24 horas y borrar contactos",
      "url": "https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/contactos-y-conversaciones.md",
      "snippet": "…. No acepta los filtros de `GET /api/v1/contacts`: para buscar, usa esa. La especificación no dice qué contactos cuenta como «de un número». - **La ventana de 24 horas:** `GET /api/v1/contacts/{contact}/meta-window?device_id=dev_Ac7Ku7iIZDXJTjdCu0UB1mX` (`device_id` es obligatorio: el número por el que vas a escribir). Responde `is_open`, `expires_at` y `meta_device_id`, que la especificación no describe uno por uno: por el nombre, `is_open` en `true` es ventana abierta y `expires_at` cuándo vence (puede ser `null`). Úsala antes de mandar un mensaje libre por un número oficial: con la…"
    },
    {
      "title": "Contactos y conversaciones › Ver la ventana de 24 horas de un contacto",
      "url": "https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/contactos-y-conversaciones.md",
      "snippet": "…iones → Ver** · área conversations · `operationId` `contact.metaWindow` **Para qué sirve:** Úsalo antes de escribirle a un contacto para saber si su ventana de 24 horas de Meta está abierta en un número, y así decidir si puedes mandar un mensaje libre o necesitas una … (2126 caracteres)
```

### 21. status al terminar

Llamada (HTTP): `status` `{}`

Resultado:

```json
{
  "account": {},
  "numbers": {
    "total": 2,
    "connected": 2,
    "list": [
      {
        "id": "dev_Sandbox0Oficial00000000",
        "alias": "Número oficial de ejemplo",
        "number": "5491100000001",
        "connection": "dedicated",
        "connected": true
      },
      {
        "id": "dev_Sandbox0QR0000000000000",
        "alias": "Número QR de ejemplo",
        "number": "5491100000002",
        "connection": "qr",
        "connected": true
      }
    ]
  },
  "webhooks": {
    "total": 0,
    "active": 0,
    "events": []
  },
  "next_step": "Crea un webhook para saber qué pasa con tus mensajes: webhooks action=create con events message.received y message.status_changed."
}
```
