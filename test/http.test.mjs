// Modo HTTP: sin clave responde 401 (nunca usa la del entorno), y valida Host y Origin.

import assert from 'node:assert/strict';
import { request } from 'node:http';
import { after, test } from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { iniciarHttp } from '../src/http.mjs';
import { apiFalsa, BASE, CLAVE } from './ayuda.mjs';

const servidores = [];
after(() => servidores.forEach((s) => s.close()));

async function arrancar(opciones = {}) {
  const api = apiFalsa(() => ({ body: { data: [] } }));
  const r = await iniciarHttp({ port: 0, baseUrl: BASE, fetch: api.fetch, ...opciones });
  servidores.push(r.server);
  return { ...r, api };
}

const INICIO = { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'x', version: '0' } } };

// Un pedido crudo, para poder mandar el Host y el Origin que se quiera.
function pedir(url, { method = 'POST', headers = {}, body } = {}) {
  const u = new URL(url);
  return new Promise((resolver, rechazar) => {
    const req = request(
      { host: u.hostname, port: u.port, path: u.pathname, method, headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...headers } },
      (res) => {
        let t = '';
        res.on('data', (d) => (t += d));
        res.on('end', () => resolver({ status: res.statusCode, headers: res.headers, body: t }));
      },
    );
    req.on('error', rechazar);
    if (body !== undefined) req.write(JSON.stringify(body));
    req.end();
  });
}

test('sin Authorization responde 401 aunque FUNNELCHAT_API_KEY esté en el entorno', async () => {
  process.env.FUNNELCHAT_API_KEY = '1|fc_live_del_entorno';
  try {
    const { url, api } = await arrancar();
    const r = await pedir(url, { body: INICIO });
    assert.equal(r.status, 401);
    assert.equal(JSON.parse(r.body).error, 'unauthenticated');
    assert.match(r.headers['www-authenticate'], /Bearer/);
    const vacio = await pedir(url, { body: INICIO, headers: { Authorization: 'Bearer   ' } });
    assert.equal(vacio.status, 401);
    assert.equal(api.pedidos.length, 0);
  } finally {
    delete process.env.FUNNELCHAT_API_KEY;
  }
});

test('con la clave del pedido, un cliente MCP real opera, y la API recibe esa clave', async () => {
  const { url, api } = await arrancar();
  const client = new Client({ name: 'prueba-http', version: '0' });
  await client.connect(new StreamableHTTPClientTransport(new URL(url), { requestInit: { headers: { Authorization: `Bearer ${CLAVE}` } } }));
  const lista = await client.listTools();
  assert.equal(lista.tools.length, 20);
  const r = await client.callTool({ name: 'contacts', arguments: { action: 'list', params: {} } });
  assert.equal(r.isError, undefined);
  assert.equal(api.pedidos.at(-1).headers.Authorization, `Bearer ${CLAVE}`);
  await client.close();
  // X-API-Key también vale.
  const x = await pedir(url, { body: INICIO, headers: { 'X-API-Key': CLAVE } });
  assert.equal(x.status, 200);
});

test('un Host o un Origin que no están en la lista responden 403 (DNS rebinding)', async () => {
  const { url, allowedHosts, allowedOrigins } = await arrancar();
  const puerto = new URL(url).port;
  assert.deepEqual(allowedHosts, [`127.0.0.1:${puerto}`, `localhost:${puerto}`, `[::1]:${puerto}`]);
  assert.ok(allowedOrigins.includes(`http://localhost:${puerto}`));
  const auth = { Authorization: `Bearer ${CLAVE}` };
  let r = await pedir(url, { body: INICIO, headers: { ...auth, Host: `ataque.example:${puerto}` } });
  assert.equal(r.status, 403);
  r = await pedir(url, { body: INICIO, headers: { ...auth, Origin: 'http://ataque.example' } });
  assert.equal(r.status, 403);
  r = await pedir(url, { body: INICIO, headers: { ...auth, Origin: `http://localhost:${puerto}`, Host: `localhost:${puerto}` } });
  assert.equal(r.status, 200);
});

test('allowedHosts y allowedOrigins se configuran', async () => {
  const { url } = await arrancar({ allowedHosts: ['mcp.ejemplo.com'], allowedOrigins: ['https://app.ejemplo.com'] });
  const auth = { Authorization: `Bearer ${CLAVE}` };
  let r = await pedir(url, { body: INICIO, headers: { ...auth, Host: 'mcp.ejemplo.com' } });
  assert.equal(r.status, 200);
  r = await pedir(url, { body: INICIO, headers: { ...auth, Host: 'mcp.ejemplo.com', Origin: 'https://otra.ejemplo.com' } });
  assert.equal(r.status, 403);
  r = await pedir(url, { body: INICIO, headers: auth });
  assert.equal(r.status, 403, 'el Host local ya no está en la lista');
});

test('escuchar fuera de la máquina exige --allowed-hosts; por defecto escucha en 127.0.0.1', async () => {
  assert.throws(() => iniciarHttp({ host: '0.0.0.0', port: 0, baseUrl: BASE }), /allowed-hosts/);
  const { url } = await arrancar();
  assert.match(url, /^http:\/\/127\.0\.0\.1:\d+\/mcp$/);
});

test('GET y DELETE en /mcp responden 405; otra ruta, 404; un cuerpo que no es JSON, 400', async () => {
  const { url } = await arrancar();
  const auth = { Authorization: `Bearer ${CLAVE}` };
  assert.equal((await pedir(url, { method: 'GET', headers: auth })).status, 405);
  assert.equal((await pedir(url, { method: 'DELETE', headers: auth })).status, 405);
  assert.equal((await pedir(url.replace('/mcp', '/otra'), { headers: auth, body: {} })).status, 404);
  const u = new URL(url);
  const crudo = await new Promise((resolver) => {
    const req = request({ host: u.hostname, port: u.port, path: '/mcp', method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' } }, (res) => resolver(res.statusCode));
    req.end('{no es json');
  });
  assert.equal(crudo, 400);
});
