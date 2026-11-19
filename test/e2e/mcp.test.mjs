// De punta a punta contra el sandbox, con el cliente MCP del SDK por stdio y por HTTP: el MCP corre como
// lo corre un cliente (node src/cli.mjs), con la URL base del sandbox y una clave inventada.

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { after, before, test } from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { CLAVE, espera, reiniciar, SANDBOX, sandbox, SEMILLA, SIN_SANDBOX } from './entorno.mjs';

const CLI = new URL('../../src/cli.mjs', import.meta.url).pathname;
const entorno = { ...process.env, FUNNELCHAT_BASE_URL: SANDBOX, FUNNELCHAT_API_URL: '', FUNNELCHAT_API_KEY: CLAVE };

let stdio;
let soloLectura;
let http;
let urlHttp;
let procesoHttp;
let receptor;
let urlReceptor;
const recibidos = [];

async function clienteStdio(args = []) {
  const c = new Client({ name: 'e2e-stdio', version: '0' });
  await c.connect(new StdioClientTransport({ command: process.execPath, args: [CLI, ...args], env: entorno, stderr: 'pipe' }));
  return c;
}

async function clienteHttp(clave) {
  const c = new Client({ name: 'e2e-http', version: '0' });
  await c.connect(new StreamableHTTPClientTransport(new URL(urlHttp), { requestInit: { headers: { Authorization: `Bearer ${clave}` } } }));
  return c;
}

async function llamar(c, name, args = {}) {
  const r = await c.callTool({ name, arguments: args });
  const txt = r.content?.[0]?.text ?? '';
  let datos;
  try {
    datos = JSON.parse(txt);
  } catch {
    datos = txt;
  }
  return { isError: !!r.isError, datos, txt };
}

// El último pedido que anotó el sandbox (sus ids crecen): si no cambia, no le llegó nada.
const pedidosAlSandbox = async () => Math.max(0, ...((await sandbox('/_sandbox/requests')).body?.data || []).map((p) => p.id));

before(async () => {
  if (SIN_SANDBOX) return;
  await reiniciar();
  receptor = createServer(async (req, res) => {
    let b = '';
    for await (const t of req) b += t;
    try {
      recibidos.push(JSON.parse(b).type);
    } catch {
      recibidos.push('?');
    }
    res.writeHead(200).end('ok');
  });
  await new Promise((r) => receptor.listen(0, '127.0.0.1', r));
  urlReceptor = `http://127.0.0.1:${receptor.address().port}/webhooks/funnelchat`;

  stdio = await clienteStdio();
  soloLectura = await clienteStdio(['--read-only']);
  // El modo HTTP con el puerto que elija el sistema; el CLI dice en stderr dónde escucha.
  procesoHttp = spawn(process.execPath, [CLI, '--http', '--port', '0'], { env: { ...entorno, FUNNELCHAT_API_KEY: '1|fc_live_no_se_usa' }, stdio: ['ignore', 'ignore', 'pipe'] });
  urlHttp = await new Promise((resolver, rechazar) => {
    let err = '';
    procesoHttp.stderr.on('data', (d) => {
      err += d;
      const m = err.match(/en (http:\/\/127\.0\.0\.1:\d+\/mcp)/);
      if (m) resolver(m[1]);
    });
    procesoHttp.on('exit', (c) => rechazar(new Error(`el MCP HTTP salió con ${c}: ${err}`)));
  });
  http = await clienteHttp(CLAVE);
});

after(async () => {
  if (SIN_SANDBOX) return;
  await Promise.allSettled([stdio?.close(), soloLectura?.close(), http?.close()]);
  procesoHttp?.kill();
  receptor?.close();
  await reiniciar();
});

const opciones = { skip: SIN_SANDBOX };

test('los dos transportes listan los mismos 20 tools, con annotations', opciones, async () => {
  const a = await stdio.listTools();
  const b = await http.listTools();
  assert.equal(a.tools.length, 20);
  assert.deepEqual(a.tools.map((t) => t.name), b.tools.map((t) => t.name));
  assert.equal(a.tools.find((t) => t.name === 'campaigns').annotations.readOnlyHint, true);
  assert.equal(a.tools.find((t) => t.name === 'contacts').annotations.destructiveHint, true);
  assert.match(stdio.getInstructions(), /status/);
});

test('status, help, mandar un texto y verlo leído', opciones, async () => {
  const st = await llamar(stdio, 'status');
  assert.equal(st.isError, false, st.txt);
  assert.equal(st.datos.server.base_url, SANDBOX);
  assert.equal(st.datos.numbers.connected, 2);
  const h = await llamar(stdio, 'messages', { action: 'help', params: { action: 'send' } });
  assert.ok(h.datos.required.device_id);
  const envio = await llamar(stdio, 'messages', {
    action: 'send',
    params: { device_id: SEMILLA.qr, phone: '5491155550000', text: 'Hola desde el MCP', client_reference: 'mcp-e2e-1' },
  });
  assert.equal(envio.isError, false, envio.txt);
  assert.equal(envio.datos.message.status, 'queued');
  let estado;
  for (let i = 0; i < 30 && estado !== 'read'; i++) {
    await espera(500);
    const r = await llamar(stdio, 'messages', { action: 'get', params: { contact: envio.datos.message.contact_id, message: envio.datos.message.id } });
    estado = (r.datos.data || r.datos).status;
  }
  assert.equal(estado, 'read');
});

test('contactos: crear y buscar con filtro; un filtro mal escrito no llega al sandbox', opciones, async () => {
  const c = await llamar(stdio, 'contacts', { action: 'create', params: { phone: '5491166667777', name: 'Ana MCP' } });
  assert.equal(c.isError, false, c.txt);
  const l = await llamar(stdio, 'contacts', { action: 'list', params: { phone: '5491166667777', perPage: 2 } });
  assert.equal(l.datos.data.length, 1);
  assert.equal(l.datos.links, undefined);
  const antes = await pedidosAlSandbox();
  const mal = await llamar(stdio, 'contacts', { action: 'delete', params: { all: true, name: 'Ana MCP' }, confirm: true });
  assert.equal(mal.datos.error, 'unknown_params');
  assert.equal(await pedidosAlSandbox(), antes, 'el sandbox no recibió nada');
  const todos = await llamar(stdio, 'contacts', { action: 'list', params: {} });
  assert.ok(todos.datos.data.length >= 2, 'no se borró ningún contacto');
});

test('webhook: crear, probar, ver sus entregas y recibir los cambios de estado; borrar pide confirm', opciones, async (t) => {
  const crear = (url) => llamar(stdio, 'webhooks', { action: 'create', params: { url, events: ['message.received', 'message.status_changed'], description: 'Prueba del MCP' } });
  let w = await crear(urlReceptor);
  // Un sandbox que, como producción, solo acepta https no puede entregar a un receptor local.
  const soloHttps = w.isError && w.datos.status === 422 && w.datos.errors?.url;
  if (soloHttps) {
    t.diagnostic('el sandbox solo acepta webhooks https: se prueba sin receptor local');
    w = await crear('https://tu-sistema.com/webhooks/funnelchat');
  }
  assert.equal(w.isError, false, w.txt);
  const id = (w.datos.data || w.datos).id;
  assert.equal((await llamar(stdio, 'webhooks', { action: 'test', params: { id } })).isError, false);
  await espera(1000);
  const d = await llamar(stdio, 'webhooks', { action: 'list_deliveries', params: { id } });
  assert.equal(d.isError, false, d.txt);
  if (!soloHttps) {
    await llamar(stdio, 'messages', { action: 'send', params: { device_id: SEMILLA.qr, phone: '5491155550000', text: 'Segundo', client_reference: 'mcp-e2e-2' } });
    for (let i = 0; i < 30 && !recibidos.includes('message.status_changed'); i++) await espera(300);
    assert.ok(recibidos.includes('message.status_changed'), `recibidos: ${recibidos.join(', ')}`);
  }
  const sin = await llamar(stdio, 'webhooks', { action: 'delete', params: { id } });
  assert.equal(sin.datos.error, 'confirmation_required');
  const con = await llamar(stdio, 'webhooks', { action: 'delete', params: { id }, confirm: true });
  assert.equal(con.isError, false, con.txt);
});

test('un error de la API vuelve tal cual, con su status', opciones, async () => {
  const r = await llamar(stdio, 'messages', { action: 'send', params: { device_id: SEMILLA.qr, phone: '5491155550000', text: 'Hola', client_reference: 'con espacios' } });
  assert.equal(r.isError, true);
  assert.equal(r.datos.status, 422);
  assert.ok(r.datos.errors?.client_reference);
});

test('HTTP: cada pedido usa su clave; una clave sin permiso recibe el 403 de la API', opciones, async () => {
  const llave = (await sandbox('/_sandbox/keys', { method: 'POST', body: { permissions: ['communities:send'] } })).body.key;
  const limitado = await clienteHttp(llave);
  const r = await llamar(limitado, 'groups', { action: 'import', params: { group: SEMILLA.grupoVip, device_id: SEMILLA.qr } });
  assert.equal(r.isError, true);
  assert.equal(r.datos.status, 403);
  await limitado.close();
  const ok = await llamar(http, 'groups', { action: 'import', params: { group: SEMILLA.grupoVip, device_id: SEMILLA.qr } });
  assert.equal(ok.isError, false, ok.txt);
});

test('HTTP sin clave: 401, aunque el proceso tenga FUNNELCHAT_API_KEY', opciones, async () => {
  const r = await fetch(urlHttp, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
  });
  assert.equal(r.status, 401);
});

test('--read-only: sin escrituras en la lista y sin llegar al sandbox', opciones, async () => {
  const { tools } = await soloLectura.listTools();
  const mensajes = tools.find((t) => t.name === 'messages');
  assert.ok(!mensajes || !mensajes.inputSchema.properties.action.enum.includes('send'));
  const antes = await pedidosAlSandbox();
  const r = await llamar(soloLectura, 'contacts', { action: 'delete', params: { all: true }, confirm: true });
  assert.equal(r.datos.error, 'read_only');
  assert.equal(await pedidosAlSandbox(), antes);
  const l = await llamar(soloLectura, 'contacts', { action: 'list', params: { perPage: 1 } });
  assert.equal(l.isError, false, l.txt);
});

test('search_docs y status por HTTP', opciones, async () => {
  const d = await llamar(stdio, 'search_docs', { query: 'ventana de 24 horas plantilla', limit: 3 });
  assert.equal(d.datos.results.length, 3);
  const st = await llamar(http, 'status');
  assert.equal(st.isError, false, st.txt);
});
