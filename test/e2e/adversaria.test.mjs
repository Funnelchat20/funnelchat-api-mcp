// Prueba adversaria contra el sandbox: intenta que el MCP haga algo que la persona no pidió, con el CLI
// como lo corre un cliente (stdio y HTTP). Cada caso tiene que fallar con un error que diga qué pasó, y
// el sandbox no tiene que recibir ningún pedido (lo dice /_sandbox/requests).

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { request } from 'node:http';
import { after, before, test } from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { CLAVE, reiniciar, SANDBOX, sandbox, SEMILLA, SIN_SANDBOX } from './entorno.mjs';

const CLI = new URL('../../src/cli.mjs', import.meta.url).pathname;
const entorno = { ...process.env, FUNNELCHAT_BASE_URL: SANDBOX, FUNNELCHAT_API_URL: '', FUNNELCHAT_API_KEY: CLAVE };
const opciones = { skip: SIN_SANDBOX };

let stdio;
let soloLectura;
let procesoHttp;
let puertoHttp;

async function clienteStdio(args = []) {
  const c = new Client({ name: 'adversaria', version: '0' });
  await c.connect(new StdioClientTransport({ command: process.execPath, args: [CLI, ...args], env: entorno, stderr: 'pipe' }));
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

const ultimoPedido = async () => Math.max(0, ...((await sandbox('/_sandbox/requests')).body?.data || []).map((p) => p.id));

// Corre los casos y comprueba que ninguno llegó al sandbox.
async function sinTocarElSandbox(fn) {
  const antes = await ultimoPedido();
  await fn();
  assert.equal(await ultimoPedido(), antes, 'el sandbox recibió un pedido');
}

// POST /mcp con las cabeceras que se quieran (fetch no deja cambiar Host).
function postMcp(cabeceras, cuerpo = { jsonrpc: '2.0', id: 1, method: 'tools/list' }, ruta = '/mcp') {
  return new Promise((resolver, rechazar) => {
    const datos = JSON.stringify(cuerpo);
    const req = request(
      { host: '127.0.0.1', port: puertoHttp, path: ruta, method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'Content-Length': Buffer.byteLength(datos), ...cabeceras } },
      (res) => {
        let b = '';
        res.on('data', (d) => (b += d));
        res.on('end', () => resolver({ status: res.statusCode, headers: res.headers, body: b }));
      },
    );
    req.on('error', rechazar);
    req.end(datos);
  });
}

function arrancarHttp(args, env = entorno) {
  const p = spawn(process.execPath, [CLI, '--http', ...args], { env, stdio: ['ignore', 'ignore', 'pipe'] });
  const listo = new Promise((resolver) => {
    let err = '';
    p.stderr.on('data', (d) => {
      err += d;
      const m = err.match(/en http:\/\/127\.0\.0\.1:(\d+)\/mcp/);
      if (m) resolver({ puerto: Number(m[1]), err });
    });
    p.on('exit', (codigo) => resolver({ codigo, err }));
  });
  return { p, listo };
}

before(async () => {
  if (SIN_SANDBOX) return;
  await reiniciar();
  stdio = await clienteStdio();
  soloLectura = await clienteStdio(['--read-only']);
  // HTTP con una clave en el entorno, que nunca se tiene que usar.
  const h = arrancarHttp(['--port', '0'], { ...entorno, FUNNELCHAT_API_KEY: CLAVE });
  procesoHttp = h.p;
  puertoHttp = (await h.listo).puerto;
  assert.ok(puertoHttp, 'el MCP HTTP no arrancó');
});

after(async () => {
  if (SIN_SANDBOX) return;
  await Promise.allSettled([stdio?.close(), soloLectura?.close()]);
  procesoHttp?.kill();
  await reiniciar();
});

test('parámetros mal escritos: unknown_params con la sugerencia, nunca una llamada a medias', opciones, async () => {
  await sinTocarElSandbox(async () => {
    const s = await llamar(stdio, 'messages', { action: 'send', params: { device: SEMILLA.qr, to: '5491155550000', message: 'Hola' } });
    assert.equal(s.datos.error, 'unknown_params');
    assert.equal(s.datos.did_you_mean.device, 'device_id');
    assert.ok(s.datos.help.required.device_id, 'trae el help');
    const b = await llamar(stdio, 'contacts', { action: 'delete', params: { all: true, name: 'Ana' }, confirm: true });
    assert.equal(b.datos.error, 'unknown_params', 'un borrado no se queda sin su filtro');
    const l = await llamar(stdio, 'contacts', { action: 'list', params: { country: 'AR' } });
    assert.equal(l.datos.error, 'unknown_params', 'un filtro mal escrito no devuelve la lista entera');
    const t = await llamar(stdio, 'messages', { action: 'send', params: { device_id: SEMILLA.qr, phone: 5491155550000, text: 'Hola' } });
    assert.equal(t.datos.error, 'invalid_params');
    assert.match(t.datos.message, /phone: tiene que ser texto/);
    const m = await llamar(stdio, 'connect_links', { action: 'create', params: { type: 'meta' } });
    assert.equal(m.datos.error, 'invalid_params');
    assert.match(m.datos.message, /meta_connect_disabled/);
    const r = await llamar(stdio, 'forms', { action: 'delete_number', params: { id: 'frv_Ath9bJ3RpAYPhnX0EfcLtHJ', deviceId: '..' } });
    assert.equal(r.datos.error, 'invalid_params', '«..» no salta a otra ruta');
    const a = await llamar(stdio, 'contacts', { action: 'borrar', params: {} });
    assert.equal(a.datos.error, 'unknown_action');
  });
});

test('params como texto: el JSON se lee tal cual; lo demás es invalid_params, nunca {}', opciones, async () => {
  await sinTocarElSandbox(async () => {
    for (const params of ['device_id=dev_Sandbox0QR0000000000000&phone=5491155550000', '[]', 'null', '"Hola"', '{"device_id": ']) {
      const r = await llamar(stdio, 'messages', { action: 'send', params });
      assert.equal(r.datos.error, 'invalid_params', params);
    }
    // confirm dentro del texto no vale: no es un parámetro de delete.
    const d = await llamar(stdio, 'contacts', { action: 'delete', params: JSON.stringify({ contactIds: [SEMILLA.contacto], confirm: true }) });
    assert.equal(d.datos.error, 'unknown_params');
  });
  const antes = await ultimoPedido();
  const ok = await llamar(stdio, 'messages', { action: 'send', params: JSON.stringify({ device_id: SEMILLA.qr, phone: '5491155550000', text: 'Hola' }) });
  assert.equal(ok.isError, false, ok.txt);
  const pedidos = ((await sandbox('/_sandbox/requests')).body?.data || []).filter((p) => p.id > antes);
  assert.deepEqual(pedidos.map((p) => `${p.method} ${p.path}`), ['POST /api/v1/message/send-message'], 'un solo envío, el pedido');
});

test('lo que no se deshace no sale sin el sí de la persona, con ningún truco', opciones, async () => {
  await sinTocarElSandbox(async () => {
    const intentos = [
      ['contacts', { action: 'delete', params: { contactIds: [SEMILLA.contacto] } }],
      ['contacts', { action: 'delete', params: { contactIds: [SEMILLA.contacto] }, confirm: 'true' }],
      ['contacts', { action: 'delete', params: { contactIds: [SEMILLA.contacto] }, confirm: 1 }],
      ['contacts', { action: 'delete', params: { all: true } }],
      ['numbers', { action: 'disconnect', params: { device: SEMILLA.qr } }],
      ['numbers', { action: 'clear_message_queue', params: { device: SEMILLA.qr } }],
      ['tags', { action: 'delete', params: { tagIds: [SEMILLA.etiqueta] } }],
      ['webhooks', { action: 'delete', params: { id: '0b7a3f2e-4f1d-4c1a-9a7e-1d2c3b4a5f60' } }],
    ];
    for (const [tool, args] of intentos) {
      const r = await llamar(stdio, tool, args);
      assert.equal(r.datos.error, 'confirmation_required', `${tool} ${JSON.stringify(args)}: ${r.txt.slice(0, 200)}`);
      assert.match(r.datos.message, /no se puede deshacer\..+pregúntale si quiere seguir/);
      assert.doesNotMatch(r.datos.message, /[Rr]epite la llamada/);
    }
    // Un argumento de más, como force, no pasa.
    const f = await llamar(stdio, 'contacts', { action: 'delete', params: { contactIds: [SEMILLA.contacto] }, force: true });
    assert.equal(f.datos.error, 'invalid_arguments');
  });
  const c = await sandbox(`/api/v1/contacts/${SEMILLA.contacto}`);
  assert.equal(c.status, 200, 'el contacto sigue');
});

test('--read-only: ninguna escritura en la lista ni en la llamada, tampoco el QR', opciones, async () => {
  const { tools } = await soloLectura.listTools();
  for (const t of tools) {
    assert.equal(t.annotations.readOnlyHint, true, t.name);
    assert.equal('confirm' in (t.inputSchema.properties || {}), false, t.name);
  }
  const numeros = tools.find((t) => t.name === 'numbers').inputSchema.properties.action.enum;
  assert.equal(numeros.includes('get_qr'), false);
  await sinTocarElSandbox(async () => {
    for (const [tool, args] of [
      ['messages', { action: 'send', params: { device_id: SEMILLA.qr, phone: '5491155550000', text: 'Hola' } }],
      ['contacts', { action: 'delete', params: { all: true }, confirm: true }],
      ['numbers', { action: 'get_qr', params: { device: SEMILLA.qr } }],
      ['webhooks', { action: 'create', params: { url: 'https://example.com/hook', events: ['message.received'] } }],
    ]) {
      const r = await llamar(soloLectura, tool, args);
      assert.equal(r.datos.error, 'read_only', `${tool}.${args.action}`);
    }
    const h = await llamar(soloLectura, 'messages', { action: 'help', params: { action: 'send' } });
    assert.equal(h.datos.error, 'unknown_action');
  });
});

test('HTTP sin clave, con la clave vacía o en la URL: 401; con un Host u Origin ajeno: 403', opciones, async () => {
  await sinTocarElSandbox(async () => {
    for (const cab of [{}, { Authorization: 'Bearer ' }, { Authorization: 'Basic eDp5' }, { 'X-API-Key': '' }]) {
      const r = await postMcp(cab);
      assert.equal(r.status, 401, JSON.stringify(cab));
      assert.match(r.headers['www-authenticate'] || '', /Bearer/);
    }
    assert.equal((await postMcp({}, undefined, `/mcp?api_key=${encodeURIComponent(CLAVE)}`)).status, 401);
    const host = await postMcp({ Authorization: `Bearer ${CLAVE}`, Host: 'evil.example' });
    assert.equal(host.status, 403);
    assert.match(host.body, /Host/);
    const origen = await postMcp({ Authorization: `Bearer ${CLAVE}`, Origin: 'https://evil.example' });
    assert.equal(origen.status, 403);
    assert.match(origen.body, /Origin/);
    // Con un Host nuestro y la clave en el pedido, el mismo pedido sí pasa.
    const bien = await postMcp(
      { Authorization: `Bearer ${CLAVE}`, Host: `localhost:${puertoHttp}` },
      { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'x', version: '0' } } },
    );
    assert.equal(bien.status, 200, bien.body);
  });
  // Escuchar fuera de la máquina sin --allowed-hosts no arranca.
  const fuera = arrancarHttp(['--host', '0.0.0.0', '--port', '0']);
  const r = await fuera.listo;
  assert.notEqual(r.codigo, 0);
  assert.match(r.err, /--allowed-hosts/);
});
