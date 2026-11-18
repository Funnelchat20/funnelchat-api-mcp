# Referencia — API de Funnelchat: contexto para tu IA

> Copiado de /docs/referencia/. Pégalo en tu asistente de IA (Claude, Cursor, ChatGPT…) y pídele que escriba el código de lo que quieras armar.

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

## Los grupos de llamadas

Cada grupo tiene su propio texto, con cada una de sus llamadas: permiso, parámetros, cuerpo, respuestas y errores. Lee solo el del grupo que necesitas.

- [Números](/ia/referencia/numeros.md): Conectar un número de WhatsApp a tu cuenta y ver, editar, reiniciar, desconectar y borrar los tuyos; sus links de alta, su QR, su nombre de usuario, su historial de conexión y la salud de uno oficial. (19 llamadas)
- [Mensajes](/ia/referencia/mensajes.md): Mandar un mensaje o una plantilla a un teléfono, ver tus plantillas, traer las que creaste en Meta y ver en qué quedó un mensaje. (5 llamadas)
- [Grupos](/ia/referencia/grupos.md): Ver los grupos de tu número y los de tu cuenta, mandarles un mensaje, seguir uno, sus datos, sus participantes, quién entra y quién sale, sus envíos programados, y los canales y grupos de anuncios de un número. (11 llamadas)
- [Contactos](/ia/referencia/contactos.md): Buscar tus contactos y los de un número, ver uno, crearlo, crearlo o actualizarlo por su teléfono, editarlo, su ventana de 24 horas y borrar contactos. (8 llamadas)
- [Conversaciones](/ia/referencia/conversaciones.md): Leer los mensajes con un contacto, ver y contar tus conversaciones y marcarlas todas como leídas o no leídas. (8 llamadas)
- [Atender una conversación](/ia/referencia/atender-una-conversacion.md): Responderle a un contacto por su id, marcar como leído un mensaje que te mandaron, mostrar «escribiendo…», reaccionar a un mensaje, reenviar un mensaje, mandar una tarjeta de contacto, y ver tus formularios de WhatsApp y mandar uno. (9 llamadas)
- [Etiquetas](/ia/referencia/etiquetas.md): Ver, crear, editar y borrar tus etiquetas, agregarlas a tus contactos y quitárselas, y ver los contactos que tienen una y las etiquetas de un contacto. (9 llamadas)
- [Campos personalizados](/ia/referencia/campos-personalizados.md): Ver, crear, editar y borrar tus campos personalizados, y leer, poner y quitar sus valores en un contacto. (8 llamadas)
- [Automatizaciones](/ia/referencia/automatizaciones.md): Ver qué automatizaciones se corrieron sobre un contacto y en qué flujos está, tus flujos, sus pasos y sus contactos y cuántos tiene en curso o pausados, cancelar una ejecución y pausar las automatizaciones de un contacto. (11 llamadas)
- [Cola de mensajes de un número](/ia/referencia/cola-de-mensajes-de-un-numero.md): Ver la cola de mensajes de un número y cuántos esperan, sacar algunos o vaciarla. (4 llamadas)
- [Acciones de grupo](/ia/referencia/acciones-de-grupo.md): Crear un grupo, sumar y sacar participantes y administradores, cambiar su nombre, descripción, foto y ajustes, su link de invitación y las solicitudes para unirse, y ver cómo salió cada acción. (16 llamadas)
- [Campañas](/ia/referencia/campanas.md): Ver tus campañas de grupos, sus condiciones, sus grupos, quién entró y salió, sus pipelines y planes de operación, y las acciones que corrieron. (13 llamadas)
- [Envíos programados](/ia/referencia/envios-programados.md): Ver tus envíos programados a grupos, sus grupos, cómo salió cada uno en cada grupo, cada vez que salió uno recurrente, sus lecturas, sus respuestas y sus carpetas. (9 llamadas)
- [Estadísticas](/ia/referencia/estadisticas.md): Ver cuántos participantes entran y salen de tus grupos, cuántos están activos, tus grupos por estado, los clics en tus links y las métricas por país. (6 llamadas)
- [Plantillas](/ia/referencia/plantillas.md): Crear, ver y editar tus plantillas de WhatsApp, ver sus métricas y borrar una de un número. (5 llamadas)
- [Formularios](/ia/referencia/formularios.md): Armar, editar, publicar y borrar tus formularios de WhatsApp, sus versiones y sus números, y leer sus respuestas y métricas. (17 llamadas)
- [Difusiones](/ia/referencia/difusiones.md): Ver tus difusiones, su audiencia, sus estadísticas, su costo, sus contactos y sus mensajes, cancelarlas y borrarlas, y ordenarlas en carpetas. (16 llamadas)
- [Tableros](/ia/referencia/tableros.md): Ver, crear, editar y borrar tus tableros y sus etapas, y mover y sacar contactos de etapa. (16 llamadas)
- [Tickets](/ia/referencia/tickets.md): Ver, crear, editar, asignar, cerrar y reabrir tickets de soporte. (7 llamadas)
- [Notas](/ia/referencia/notas.md): Ver, agregar y borrar las notas de un contacto. (3 llamadas)
- [Respuestas rápidas](/ia/referencia/respuestas-rapidas.md): Ver, crear, editar y borrar las respuestas rápidas de tu equipo. (5 llamadas)
- [Carpetas de flujos](/ia/referencia/carpetas-de-flujos.md): Ver, crear, editar y borrar las carpetas en las que ordenas tus flujos. (5 llamadas)
- [Puntaje](/ia/referencia/puntaje.md): Ver y configurar el puntaje de tus contactos, ver cómo se reparte y el de un contacto, y ajustarlo. (5 llamadas)
- [Ventas](/ia/referencia/ventas.md): Ver tus ventas, sus métricas, el embudo y las ventas por plataforma, y los productos de una plataforma de pagos. (5 llamadas)
- [Dominios propios](/ia/referencia/dominios-propios.md): Usar tu propio dominio: registrarlo, verificarlo, cambiar cómo se valida su certificado y borrarlo. (5 llamadas)
- [Conversions API](/ia/referencia/conversions-api.md): Conectar un número oficial con la Conversions API de Meta: sus datasets y la prueba de la conexión. (3 llamadas)
- [Costos y cuentas de Meta](/ia/referencia/costos-y-cuentas-de-meta.md): Ver lo que te cuesta WhatsApp y las cuentas de WhatsApp Business de tus números oficiales. (3 llamadas)
- [Tu cuenta y tu equipo](/ia/referencia/tu-cuenta-y-tu-equipo.md): Ver tu cuenta, tu consumo de contactos activos y las personas de tu equipo. (6 llamadas)
- [Alertas](/ia/referencia/alertas.md): Ver las alertas que hay y los destinos de tus alertas, elegir qué alerta le llega a cada destino, y el horario de silencio y el reporte diario de tu cuenta. (8 llamadas)

## Los demás temas

Cada tema y cada receta por tarea tiene su propio texto: el índice está en https://developers-portal.funnelchat.app/llms.txt y al final de https://developers-portal.funnelchat.app/ia/lo-basico.md. Lee solo el que necesitas.
