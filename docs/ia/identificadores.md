# Identificadores — API de Funnelchat: contexto para tu IA

> Copiado de /docs/identificadores/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Identificadores

- Todo id de la API (los que devuelve y los que acepta) es un id opaco: un texto con un prefijo de tres letras, un
  guion bajo y 23 caracteres letras y números, por ejemplo `ctc_ABsza6Ialu1BCUyPFZ8WJvV`. El prefijo dice el tipo:
  `dev_` número de WhatsApp, `ctc_` contacto, `msg_` mensaje, `tag_` etiqueta, `stg_` etapa, `knb_` tablero,
  `flw_` flujo, `cmp_` campaña, `tpl_` plantilla, `lnk_` link de alta, `dlv_` entrega de webhook, `usr_` usuario
  del equipo (la tabla entera está en la página «Identificadores»).
- Úsalos tal como llegan: como texto, en la ruta, en la query y en el cuerpo. No los interpretes, no los armes, no los
  conviertas a números.
- Siguen como estaban: el `uid` de un grupo, el `uuid` de una campaña, el `uid` de un mensaje, el `uid` o `uuid` de una
  acción de grupo, los ids de las cuentas de WhatsApp Business y `workspace_id`.
- No hay período de transición: un entero en una ruta o en un cuerpo responde `404 not_found` (en un cuerpo, lo mismo
  que un id que no existe en esa ruta). Un id mal formado o de otro tipo responde igual. Si la persona tiene ids
  enteros guardados, pídelos de nuevo a la API (listando); no se pueden convertir.
- Si la persona necesita un id y no está a mano, el panel de Funnelchat lo muestra como «ID para la API», con un botón
  de copiar, en sus números de WhatsApp, en Desarrolladores y en las suscripciones de webhooks.

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
