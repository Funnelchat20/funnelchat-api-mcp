#!/usr/bin/env node
// Prueba de punta a punta contra el sandbox local de Funnelchat (@funnelchat-hq/sandbox).
// Levanta el MCP por stdio y por HTTP, recorre los casos y escribe PRUEBA.md.
//
//   SANDBOX_URL=http://localhost:4010 node scripts/prueba.mjs
//
// Nunca apunta a producción ni a staging: se niega si SANDBOX_URL no es local.

import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const SANDBOX = process.env.SANDBOX_URL || 'http://localhost:4010';
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(SANDBOX)) throw new Error(`SANDBOX_URL no es local: ${SANDBOX}`);
const CLAVE = '1|fc_live_sandbox';
const PUERTO_MCP = 3333;
const PUERTO_HOOK = 4011;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// Un receptor de webhooks mínimo, para ver llegar las entregas.
const recibidos = [];
const receptor = createServer(async (req, res) => {
  let b = '';
  for await (const t of req) b += t;
  try {
    recibidos.push(JSON.parse(b).type);
  } catch {
    recibidos.push('?');
  }
  res.writeHead(200).end('ok');
}).listen(PUERTO_HOOK, '127.0.0.1');

const env = { ...process.env, FUNNELCHAT_API_URL: SANDBOX, FUNNELCHAT_API_KEY: CLAVE };
const stdio = new Client({ name: 'prueba-stdio', version: '0' });
await stdio.connect(new StdioClientTransport({ command: process.execPath, args: [join(raiz, 'src/cli.mjs')], env, stderr: 'inherit' }));

const httpProc = spawn(process.execPath, [join(raiz, 'src/cli.mjs'), '--http', '--port', String(PUERTO_MCP)], {
  env: { ...env, FUNNELCHAT_API_KEY: '' },
  stdio: ['ignore', 'inherit', 'inherit'],
});
for (let i = 0; i < 50; i++) {
  try {
    if ((await fetch(`http://127.0.0.1:${PUERTO_MCP}/health`)).ok) break;
  } catch {}
  await espera(100);
}
const clienteHttp = async (clave) => {
  const c = new Client({ name: 'prueba-http', version: '0' });
  await c.connect(
    new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${PUERTO_MCP}/mcp`), {
      requestInit: { headers: { Authorization: `Bearer ${clave}` } },
    }),
  );
  return c;
};
const http = await clienteHttp(CLAVE);

// ---------- registro ----------

const pasos = [];
const recorta = (t, n = 1800) => (t.length > n ? `${t.slice(0, n)}… (${t.length} caracteres)` : t);
const bonito = (t) => {
  try {
    return JSON.stringify(JSON.parse(t), null, 2);
  } catch {
    return t;
  }
};
async function paso(titulo, cliente, nombre, args, espera = { error: false }, via = 'stdio') {
  const r = await cliente.callTool({ name: nombre, arguments: args });
  const txt = r.content?.[0]?.text ?? '';
  let datos;
  try {
    datos = JSON.parse(txt);
  } catch {
    datos = txt;
  }
  const esError = !!r.isError;
  let bien = esError === espera.error;
  if (bien && espera.check) bien = !!espera.check(datos);
  pasos.push({ titulo, via, nombre, args, esError, txt, bien });
  console.error(`${bien ? 'OK ' : 'MAL'} ${titulo}`);
  return datos;
}

// ---------- casos ----------

const inicio = new Date().toISOString();

// 1. Listar tools (por los dos transportes).
const lista = await stdio.listTools();
const listaHttp = await http.listTools();
const defsTxt = JSON.stringify(lista.tools);
pasos.push({
  titulo: 'Listar tools',
  via: 'stdio y HTTP',
  nombre: 'tools/list',
  args: {},
  esError: false,
  bien: lista.tools.length === listaHttp.tools.length && lista.tools.length > 0,
  txt: JSON.stringify({
    tools: lista.tools.length,
    tools_http: listaHttp.tools.length,
    nombres: lista.tools.map((t) => `${t.name} (${(t.inputSchema.properties?.action?.enum?.length || 1) - 1 || '-'})`),
    caracteres: defsTxt.length,
    tokens_aprox: Math.round(defsTxt.length / 4),
    instrucciones: stdio.getInstructions(),
  }),
});

// 2. Estado inicial.
const st = await paso('status al empezar', stdio, 'status', {}, { error: false, check: (d) => d.numbers });
const conectado = st.numbers?.list?.find((d) => d.connected && d.connection === 'qr') || st.numbers?.list?.find((d) => d.connected);

// 3. Help de tres recursos.
await paso('help de messages (lista de acciones)', stdio, 'messages', { action: 'help' }, { error: false, check: (d) => d.actions?.send });
await paso('help de contacts → create', stdio, 'contacts', { action: 'help', params: { action: 'create' } }, { error: false, check: (d) => d.example });
await paso('help de webhooks → create', stdio, 'webhooks', { action: 'help', params: { action: 'create' } }, { error: false, check: (d) => d.required?.url });

// 4. Mandar un texto.
const envio = await paso(
  'Mandar un texto',
  stdio,
  'messages',
  { action: 'send', params: { device_id: conectado?.id, phone: '5491155550000', text: 'Hola desde el MCP', client_reference: 'mcp-prueba-1' } },
  { error: false, check: (d) => d.message?.id },
);
await espera(4500);
if (envio?.message?.id) {
  await paso(
    'Ver ese mensaje (estado)',
    stdio,
    'messages',
    { action: 'get', params: { contact: envio.message.contact_id, message: envio.message.id } },
    { error: false, check: (d) => d.id || d.data?.id },
  );
}

// 5. Crear un contacto.
const contacto = await paso(
  'Crear un contacto',
  stdio,
  'contacts',
  { action: 'create', params: { phone: '5491166667777', name: 'Ana MCP' } },
  { error: false },
);

await paso(
  'Ver tus contactos (perPage 2, filtro por teléfono)',
  stdio,
  'contacts',
  { action: 'list', params: { perPage: 2, phone: '5491166667777' } },
  { error: false, check: (d) => Array.isArray(d.data) && !d.links },
);

// 6. Crear un webhook, probarlo y ver sus entregas.
const hook = await paso(
  'Crear un webhook',
  stdio,
  'webhooks',
  {
    action: 'create',
    params: { url: `http://127.0.0.1:${PUERTO_HOOK}/hook`, events: ['message.received', 'message.status_changed'], description: 'Prueba del MCP' },
  },
  { error: false, check: (d) => (d.data || d).id },
);
const idHook = (hook?.data || hook)?.id;
if (idHook) {
  await paso('Probar el webhook', stdio, 'webhooks', { action: 'test', params: { id: idHook } }, { error: false });
  await espera(1500);
  await paso('Ver sus entregas', stdio, 'webhooks', { action: 'list_deliveries', params: { id: idHook } }, { error: false });
  // Con el webhook puesto, otro texto: el receptor tiene que ver sus cambios de estado.
  await paso(
    'Mandar otro texto (con el webhook)',
    stdio,
    'messages',
    { action: 'send', params: { device_id: conectado?.id, phone: '5491155550000', text: 'Segundo mensaje', client_reference: 'mcp-prueba-2' } },
    { error: false, check: (d) => d.message?.id },
  );
  await espera(4500);
  pasos.push({
    titulo: 'El receptor recibió message.status_changed',
    via: 'webhook',
    nombre: '(receptor local)',
    args: {},
    esError: false,
    bien: recibidos.includes('message.status_changed'),
    txt: JSON.stringify({ recibidos }),
  });
}

// 7. Error de validación: falta device_id. Es el 422 de la API, tal cual.
await paso(
  'Error de validación (sin device_id)',
  stdio,
  'messages',
  { action: 'send', params: { phone: '5491155550000', text: 'Hola' } },
  { error: true, check: (d) => d.status === 422 },
);

// 8. Error de permiso: una clave sin «Administrar grupos», por HTTP con su propia clave.
const llave = await (
  await fetch(`${SANDBOX}/_sandbox/keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ permissions: ['communities:send'] }),
  })
).json();
const sinPermiso = await clienteHttp(llave.key);
await paso(
  'Error de permiso (seguir un grupo sin «Administrar grupos»)',
  sinPermiso,
  'groups',
  { action: 'import', params: { group: '120363000000000001@g.us', device_id: 'dev_Sandbox0QR0000000000000' } },
  { error: true, check: (d) => d.status === 403 },
  'HTTP (clave limitada)',
);
// La misma llamada con la clave completa sí pasa.
await paso(
  'Seguir el grupo con la clave completa',
  http,
  'groups',
  { action: 'import', params: { group: '120363000000000001@g.us', device_id: 'dev_Sandbox0QR0000000000000' } },
  { error: false },
  'HTTP',
);

// 9. Confirmación: borrar sin confirm se frena en el MCP; con confirm, se borra.
if (idHook) {
  await paso('Borrar el webhook sin confirm', stdio, 'webhooks', { action: 'delete', params: { id: idHook } }, {
    error: true,
    check: (d) => d.error === 'confirmation_required',
  });
  await paso('Borrar el webhook con confirm', stdio, 'webhooks', { action: 'delete', params: { id: idHook }, confirm: true }, { error: false });
}

// 10. Buscar en la documentación y estado final.
await paso('search_docs', stdio, 'search_docs', { query: 'ventana de 24 horas plantilla', limit: 3 }, { error: false, check: (d) => d.results?.length });
await paso('status al terminar', http, 'status', {}, { error: false }, 'HTTP');

// ---------- PRUEBA.md ----------

const bien = pasos.filter((p) => p.bien).length;
let md = `# Prueba del MCP de la API contra el sandbox\n\n`;
md += `- Fecha: ${inicio}\n- Sandbox: \`${SANDBOX}\` (@funnelchat-hq/sandbox), clave de prueba del sandbox\n`;
md += `- Transportes: stdio y HTTP (\`/mcp\`, sin sesión, la clave en \`Authorization: Bearer\`)\n`;
md += `- Resultado: **${bien} de ${pasos.length}** pasos como se esperaba\n`;
md += `- Entregas que recibió el receptor local: ${recibidos.length ? recibidos.join(', ') : 'ninguna'}\n\n`;
md += `| # | Paso | Vía | Tool | isError | ¿Como se esperaba? |\n|---|---|---|---|---|---|\n`;
pasos.forEach((p, i) => {
  md += `| ${i + 1} | ${p.titulo} | ${p.via} | \`${p.nombre}\` | ${p.esError ? 'sí' : 'no'} | ${p.bien ? 'sí' : '**no**'} |\n`;
});
md += `\n## Detalle\n`;
pasos.forEach((p, i) => {
  md += `\n### ${i + 1}. ${p.titulo}\n\n`;
  md += `Llamada (${p.via}): \`${p.nombre}\` \`${JSON.stringify(p.args)}\`\n\n`;
  md += `Resultado${p.esError ? ' (isError)' : ''}:\n\n\`\`\`json\n${recorta(bonito(p.txt))}\n\`\`\`\n`;
});
writeFileSync(join(raiz, 'PRUEBA.md'), md);
console.error(`${bien}/${pasos.length} → PRUEBA.md`);

await stdio.close();
await http.close();
await sinPermiso.close();
httpProc.kill();
receptor.close();
process.exit(bien === pasos.length ? 0 : 1);
