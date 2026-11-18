# Funnelchat para tu asistente de IA

> https://developers-portal.funnelchat.app/ia/

Esta página está escrita para tu asistente de IA, sea cual sea. Si llegaste por tu cuenta, cópiale la línea de la [guía rápida](https://developers-portal.funnelchat.app/) y él la lee.

> [!NOTE] Para el asistente
> La persona te pidió que configures Funnelchat. Sigue estos pasos en orden y detente donde dice. Los comandos son de una terminal de macOS o Linux: en Windows, usa sus equivalentes.

### 1. Explícale en una línea qué vas a hacer

Que vas a guardar las instrucciones de la API de Funnelchat en su proyecto y acompañarla hasta su primer mensaje de WhatsApp, en su compu y con su clave.

### 2. Detente: la clave

Pídele que cree una clave en el panel de Funnelchat, en **Desarrolladores → Crear clave** (se muestra una sola vez), y que la guarde en el archivo `.env` de la carpeta del proyecto o en la variable de entorno `FUNNELCHAT_API_KEY`. **Que no la pegue en el chat.** Si no ve Desarrolladores en el panel, tiene que pedirle a Funnelchat que lo active en su cuenta.

```bash
# Lo escribe la persona en el .env del proyecto. Va entre comillas simples porque la clave lleva un |
FUNNELCHAT_API_KEY='…'
```

Si la define como variable de entorno en otra terminal, tu sesión no la ve: tiene que definirla antes de abrirte. Espera a que te diga que está lista y comprueba que existe, sin mostrarla:

```bash
test -n "$FUNNELCHAT_API_KEY" && echo "FUNNELCHAT_API_KEY: ok"
grep -qs '^FUNNELCHAT_API_KEY=' .env && echo ".env: ok"
```

Si está en el `.env`, comprueba que `.env` esté en `.gitignore`: la clave nunca se sube a un repositorio.

### 3. Guarda las instrucciones de la API en el proyecto

Para escribir código con la API más adelante, sin inventar nada. Desde la carpeta del proyecto:

```bash
curl -fsSL https://developers-portal.funnelchat.app/ia/instrucciones.md -o FUNNELCHAT.md
```

Y suma esta línea en el `AGENTS.md` del proyecto, o en el archivo de instrucciones que lees tú (por ejemplo, `CLAUDE.md`); si no existe, créalo:

```text
Para la API de Funnelchat (WhatsApp), lee FUNNELCHAT.md antes de escribir código.
```

### 4. Lleva a la persona hasta su primer mensaje

Con el CLI de Funnelchat (Node 18 o más nuevo), que lee la clave de `FUNNELCHAT_API_KEY`. Si la clave está en el `.env`, cárgala en el entorno del comando sin mostrarla: `set -a; . ./.env; set +a; npx @funnelchat-hq/cli …`. Con `--json`, cada comando devuelve un solo JSON para leer.

**Primero, mira los números de su cuenta** y cuéntale lo que encontraste. Muchas cuentas ya tienen uno conectado.

```bash
npx @funnelchat-hq/cli numbers list
```

Un número es oficial de WhatsApp si su `connection` es `coexistence` o `dedicated`; por QR, `qr`. Según lo que encuentres, pregúntale qué prefiere, y no conectes nada sin su respuesta:

- **Ya tiene un número conectado:** díselo, por ejemplo «Tu cuenta ya tiene conectado *Ventas* (+54 9 11 …). ¿Lo usamos?». Si tiene varios, pregúntale cuál. Usarlo no conecta nada ni ocupa otro lugar de su plan.
- **Tiene un número, pero desconectado:** ofrécele reconectar ese mismo número antes que conectar otro; tampoco ocupa otro lugar de su plan. `npx @funnelchat-hq/cli connect --device <id> --no-wait` imprime el link para reconectarlo.
- **No tiene ninguno y quiere usar el suyo:** por QR. `npx @funnelchat-hq/cli connect --no-wait` imprime el link: muéstraselo. Lo abre en otra pantalla, toca el botón y tiene 10 minutos para escanear el QR con WhatsApp, en **Dispositivos vinculados**.
- **No tiene ninguno y prefiere un número de EE. UU. de Funnelchat** (oficial): antes, cuéntale que va a iniciar sesión con Facebook y seguir los pasos de Meta con su cuenta de WhatsApp Business; que necesita un medio de pago cargado en Meta, porque Meta le cobra los mensajes; que ocupa un lugar de su plan y cuenta en el tope de números de EE. UU. (hasta 3 por cuenta, menos si su plan tiene menos lugares), y que con un número oficial no se siguen grupos: eso es solo por QR. Si está de acuerdo, `npx @funnelchat-hq/cli connect --us-number --no-wait` imprime el link: muéstraselo. En la página elige el número de EE. UU. y sigue los pasos.

Cada link funciona una sola vez y quien lo tiene puede conectar un número a su cuenta: no se lo muestres a nadie más. Cuando te diga que terminó, vuelve a correr `numbers list`: el número tiene que aparecer conectado. Si pedir el link falla con `meta_connect_disabled`, el número de EE. UU. no se puede pedir en este momento: díselo y ofrécele conectar el suyo por QR. Si quiere conectar su propio número como oficial de WhatsApp, eso se hace desde el panel de Funnelchat: indícaselo.

**El primer mensaje.** El teléfono va con código de país (por ejemplo, `5491122334455`). Si la cuenta tiene más de un número, `send` pide `--device <id>`: usa el que eligió.

```bash
npx @funnelchat-hq/cli send <teléfono> "<texto>"  # muestra queued → sent → delivered → read
```

- **Por un número por QR**, el texto sale a cualquier teléfono. El suyo sirve para probar.
- **Por un número oficial** (el de EE. UU., o el que ya tenía si es oficial), el primer mensaje a un teléfono que no le escribió en las últimas 24 horas tiene que ser una plantilla aprobada: un texto no sale (`window_closed`). Para probar, lo simple es que la persona le escriba «hola» a ese número desde su WhatsApp; durante las 24 horas siguientes, a ese teléfono le puedes contestar con texto libre. Para escribirle a alguien nuevo, una plantilla: ver [Mandar mensajes](https://developers-portal.funnelchat.app/docs/mandar-mensajes/).

Siempre:

- Antes de mandar un mensaje, confirma con la persona a quién y qué texto.
- Escríbele solo a quien aceptó recibir mensajes de su negocio.
- Nunca pidas ni muestres la clave en el chat.
- Si el envío falla o se corta, no lo repitas sin preguntarle: el mensaje pudo haber salido.

### 5. Proponle lo que sigue

- **Seguir un grupo**, para enterarse de quién entra y quién sale: `npx @funnelchat-hq/cli groups` muestra los grupos de su número y `npx @funnelchat-hq/cli groups follow <uid>` sigue uno. Ver [Grupos](https://developers-portal.funnelchat.app/docs/grupos/).
- **Recibir los webhooks en su servidor**: cuándo leen sus mensajes, quién le escribe y quién entra a sus grupos. Ver [Webhooks](https://developers-portal.funnelchat.app/docs/webhooks/).
- **Integrarlo en su código**, con el SDK de Node.js, de PHP o de Python, o con llamadas directas: `FUNNELCHAT.md` tiene cada llamada y cada evento. El de Python se instala con `pip install funnelchat`. Ver [Construir con IA](https://developers-portal.funnelchat.app/docs/herramientas/).

## Si tu asistente no puede correr comandos

Los chats en la web, como Claude o ChatGPT, no tienen tu clave ni pueden llamar a la API desde ahí. Pídele que escriba el código y córrelo tú: [«Que tu IA escriba el código»](https://developers-portal.funnelchat.app/#que-tu-ia-escriba-el-codigo).

## Índice de temas: lo que viene después del primer uso

Lo que la API hace además del primer uso, en dos partes. Cada tema tiene su propio texto, con sus llamadas (permiso, campos, respuestas y errores) y sus eventos con su ejemplo: lee solo el del tema que la persona necesita, no todos.

### Funciones de WhatsApp

La página, con lo que dice cada tema y sin el detalle de cada llamada: [Funciones de WhatsApp](https://developers-portal.funnelchat.app/ia/mas-funciones/whatsapp.md).

- [Administrar tus números](https://developers-portal.funnelchat.app/ia/mas-funciones/whatsapp/administrar-tus-numeros.md): Mira, edita, desconecta o borra tus números, conéctalos por QR desde tu sistema, revisa su salud, su historial de conexión y su cola de mensajes, y entérate cuando algo cambia.
- [Atender una conversación](https://developers-portal.funnelchat.app/ia/mas-funciones/whatsapp/atender-una-conversacion.md): Respóndele a un contacto por su id, marca como leído lo que te escribió, muestra «escribiendo…», reacciona a sus mensajes, reenvía un mensaje y compártele una tarjeta de contacto.
- [Grupos y sus acciones](https://developers-portal.funnelchat.app/ia/mas-funciones/whatsapp/grupos-y-acciones.md): Ve los grupos de tu workspace y sus participantes, crea grupos, suma y saca personas, cambia sus datos y su link, responde a las solicitudes para unirse y entérate de lo que pasa adentro.
- [Plantillas de Meta](https://developers-portal.funnelchat.app/ia/mas-funciones/whatsapp/plantillas.md): Crea, revisa y edita tus plantillas de WhatsApp, mira sus métricas, bórrala de un número y entérate cuando Meta cambia su estado.
- [Formularios de WhatsApp](https://developers-portal.funnelchat.app/ia/mas-funciones/whatsapp/formularios.md): Arma tus formularios de WhatsApp, publícalos en tus números oficiales, mándaselos a tus contactos, cámbialos con versiones nuevas y lee sus respuestas y sus métricas.
- [Conversions API](https://developers-portal.funnelchat.app/ia/mas-funciones/whatsapp/conversions-api.md): Prepara y prueba la conexión de tus números oficiales con la Conversions API de Meta: el dataset de cada cuenta de WhatsApp Business y su estado.
- [Costos de WhatsApp y cuentas de Meta](https://developers-portal.funnelchat.app/ia/mas-funciones/whatsapp/costos-y-cuentas-de-meta.md): Mira cuánto te cuesta WhatsApp en un mes y las cuentas de WhatsApp Business de tus números oficiales, con su límite de mensajes por día.

### Funciones de Funnelchat

La página, con lo que dice cada tema y sin el detalle de cada llamada: [Funciones de Funnelchat](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat.md).

- [Contactos y conversaciones](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/contactos-y-conversaciones.md): Busca tus contactos y los de cada número, créalos o actualízalos por su teléfono, edítalos o bórralos, mira su ventana de 24 horas, lee y cuenta tus conversaciones, márcalas todas como leídas o no leídas y entérate cuando algo cambia.
- [Etiquetas y campos personalizados](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/etiquetas-y-campos.md): Ve, arma y borra tus etiquetas y tus campos personalizados, agrégales o quítales etiquetas a tus contactos, guárdales tus propios datos y entérate cuando un contacto recibe o pierde una etiqueta.
- [Notas de un contacto](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/notas.md): Lee las notas que tu equipo dejó sobre un contacto, agrega una nueva o borra la que ya no sirve.
- [Tableros](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/tableros.md): Arma tus tableros y sus etapas, mira qué contactos hay en cada etapa, muévelos o sácalos, y entérate cada vez que un contacto cambia de etapa.
- [Tickets](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/tickets.md): Abre tickets sobre tus contactos, dáselos a alguien de tu equipo, edítalos, ciérralos y vuelve a abrirlos.
- [Respuestas rápidas](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/respuestas-rapidas.md): Mira las respuestas rápidas de tu equipo, crea nuevas, edítalas o bórralas.
- [Automatizaciones y carpetas de flujos](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/automatizaciones.md): Mira tus flujos y sus pasos, qué automatizaciones se corrieron sobre un contacto y quiénes están en curso o pausados en cada flujo, cancela una ejecución, pausa las automatizaciones de un contacto, ordena tus flujos en carpetas y entérate cuando una termina o falla.
- [Difusiones](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/difusiones.md): Mira tus difusiones, a quién llegan, sus estadísticas, su costo y el resultado con cada contacto, cancela una que quedó pausada, borra una que todavía no salió y ordénalas en carpetas.
- [Campañas de grupos](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/campanas.md): Mira tus campañas de grupos, sus grupos, quién entra y quién sale, y cómo van sus pipelines y planes de operación.
- [Envíos programados](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/envios-programados.md): Mira tus envíos programados a grupos, sus grupos, cómo salió cada uno en cada grupo, cada vez que salió uno que se repite, cuántos lo leyeron y qué respondieron, y entérate cuando termina o falla.
- [Estadísticas de tus grupos](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/estadisticas.md): Mira cuántas personas entran y salen de tus grupos y campañas, cuántas están activas, tus grupos por estado, los clics en tus links y de qué países son.
- [Puntaje de tus contactos](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/puntaje.md): Mira el puntaje de tus contactos y cómo se reparte, ajusta el de uno y configura cómo se calcula.
- [Ventas](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/ventas.md): Mira las ventas que registran tus plataformas de pagos, sus métricas, el embudo de conversaciones a compras, las ventas por plataforma y los productos de cada una.
- [Dominios propios](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/dominios-propios.md): Usa un dominio tuyo, como `go.mimarca.com`, para el servicio de redirección de Funnelchat: lo registras, creas en tu DNS los registros que te indica, lo verificas y lo borras cuando ya no lo usas.
- [Tu cuenta y tu equipo](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/cuenta-y-equipo.md): Mira tu cuenta y su plan, tu consumo de contactos activos y las personas de tu equipo, y entérate de tus cobros, tu suscripción y tu límite de contactos activos.
- [Alertas](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/alertas.md): Mira las alertas de tu operación y los teléfonos y webhooks que las reciben, elige qué alerta le llega a cada uno, y configura el horario de silencio y el reporte diario.
- [Más sobre tus webhooks](https://developers-portal.funnelchat.app/ia/mas-funciones/funnelchat/mas-webhooks.md): Mira uno de tus webhooks y sus entregas, edítalo o páusalo y consulta los tipos de evento que hay.
