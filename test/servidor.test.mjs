// Lo que no se deshace, el modo de solo lectura, las annotations, status y las respuestas largas.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizarBase, baseDelEntorno } from '../src/base.mjs';
import { definiciones, recortar, tabla, VERSION } from '../src/servidor.mjs';
import { apiFalsa, conectar } from './ayuda.mjs';

const acciones = tabla.tools.flatMap((t) => Object.entries(t.actions).map(([n, a]) => ({ tool: t, nombre: n, a })));

test('lo que no se deshace no sale sin confirm, y el error pide preguntarle a la persona', async () => {
  const { llamar, api } = await conectar({ api: apiFalsa(() => ({ status: 200, body: { deleted: 1 } })) });
  const r = await llamar('contacts', { action: 'delete', params: { contactIds: ['ctc_AAOzYSKDiqHT4hM8LdPB8Ut'] } });
  assert.equal(r.datos.error, 'confirmation_required');
  assert.match(r.datos.message, /pregúntale si quiere seguir/);
  assert.match(r.datos.message, /se borran todos los de la cuenta/);
  assert.doesNotMatch(r.datos.message, /[Rr]epite la llamada/);
  assert.equal(api.pedidos.length, 0);
  // confirm dentro de params no vale: es un parámetro que delete no tiene.
  const dentro = await llamar('contacts', { action: 'delete', params: { contactIds: ['ctc_AAOzYSKDiqHT4hM8LdPB8Ut'], confirm: true } });
  assert.equal(dentro.datos.error, 'unknown_params');
  const ok = await llamar('contacts', { action: 'delete', params: { contactIds: ['ctc_AAOzYSKDiqHT4hM8LdPB8Ut'] }, confirm: true });
  assert.equal(ok.isError, false, ok.txt);
  assert.deepEqual(api.pedidos.map((p) => `${p.method} ${p.path}`), ['POST /api/v1/contacts/delete']);
});

test('cada acción que no se deshace tiene su motivo, y ningún ejemplo trae confirm', () => {
  const destructivas = acciones.filter((x) => x.a.destructive);
  assert.ok(destructivas.length >= 25, `solo ${destructivas.length}`);
  for (const { tool, nombre, a } of destructivas) assert.ok(a.destructive_reason?.length > 10, `${tool.name}.${nombre}`);
  for (const { tool, nombre, a } of acciones) assert.equal('confirm' in a.example, false, `${tool.name}.${nombre}`);
  // Los borrados por POST de la validación piden confirmación.
  const clave = (t, n) => tabla.tools.find((x) => x.name === t).actions[n];
  for (const [t, n] of [['contacts', 'delete'], ['tags', 'delete'], ['custom_fields', 'delete'], ['broadcasts', 'cancel'], ['numbers', 'disconnect'], ['webhooks', 'delete']]) {
    assert.equal(clave(t, n).destructive, true, `${t}.${n}`);
  }
  assert.equal(clave('messages', 'remove_reaction').destructive, false);
});

test('help de una acción que no se deshace lo dice, sin confirm en el ejemplo', async () => {
  const { llamar } = await conectar();
  const r = await llamar('webhooks', { action: 'help', params: { action: 'delete' } });
  assert.match(r.datos.confirm, /No se puede deshacer\. El webhook se borra con su historial/);
  assert.deepEqual(Object.keys(r.datos.example), ['action', 'params']);
  const lista = await llamar('webhooks', { action: 'help' });
  assert.match(lista.datos.actions.delete, /\[no se deshace\]/);
});

test('annotations honestas: readOnlyHint solo en tools de lecturas, destructiveHint donde algo no se deshace', () => {
  const defs = definiciones();
  assert.equal(defs.length, 20);
  for (const d of defs) {
    const t = tabla.tools.find((x) => x.name === d.name);
    if (!t) {
      assert.equal(d.annotations.readOnlyHint, true, d.name);
      continue;
    }
    const as = Object.values(t.actions);
    if (as.every((a) => a.read_only)) assert.deepEqual(d.annotations, { title: t.title, readOnlyHint: true });
    else {
      assert.equal(d.annotations.readOnlyHint, undefined, d.name);
      assert.equal(d.annotations.destructiveHint, as.some((a) => a.destructive), d.name);
    }
    assert.equal('confirm' in d.inputSchema.properties, as.some((a) => a.destructive), d.name);
  }
  assert.equal(defs.find((d) => d.name === 'search_docs').annotations.openWorldHint, false);
});

test('--read-only: solo lecturas en la lista, y una escritura no llega a la API', async () => {
  const defs = definiciones({ readOnly: true });
  for (const d of defs) {
    assert.equal(d.annotations.readOnlyHint, true, d.name);
    assert.equal('confirm' in (d.inputSchema.properties || {}), false, d.name);
    const t = tabla.tools.find((x) => x.name === d.name);
    for (const n of d.inputSchema.properties?.action?.enum?.slice(1) || []) assert.equal(t.actions[n].read_only, true, `${d.name}.${n}`);
  }
  const { llamar, api, client } = await conectar({ readOnly: true });
  assert.match(client.getInstructions(), /solo lectura/);
  const r = await llamar('messages', { action: 'send', params: { device_id: 'dev_Ac7Ku7iIZDXJTjdCu0UB1mX', phone: '5491122334455', text: 'Hola' } });
  assert.equal(r.datos.error, 'read_only');
  const b = await llamar('contacts', { action: 'delete', params: { all: true }, confirm: true });
  assert.equal(b.datos.error, 'read_only');
  const l = await llamar('broadcasts', { action: 'search_contacts', params: {} });
  assert.notEqual(l.datos.error, 'read_only', 'un POST que solo lee sigue');
  assert.ok(api.pedidos.every((p) => p.method === 'GET' || p.path === '/api/v1/broadcasts/contacts'));
});

test('status: un 404 de ruta culpa a la URL base, no a la clave', async () => {
  const api = apiFalsa(() => ({ status: 404, body: { error: 'route_not_found', message: 'La ruta no existe en la API.' } }));
  const { llamar } = await conectar({ api });
  const r = await llamar('status');
  assert.equal(r.isError, true);
  assert.match(r.datos.next_step, /URL base/);
  assert.doesNotMatch(r.datos.next_step, /clave|permiso/i);
  assert.equal(r.datos.server.version, VERSION);
});

test('status: 401 dice que la clave no vale; 403 en números habla de permisos', async () => {
  let r = await (await conectar({ api: apiFalsa(() => ({ status: 401, body: { error: 'unauthenticated', message: 'Falta la API key o no es válida.' } })) })).llamar('status');
  assert.equal(r.isError, true);
  assert.match(r.datos.next_step, /clave no es válida/);
  const api = apiFalsa((p) => (p.path === '/api/v1/devices' ? { status: 403, body: { error: 'forbidden' } } : { status: 200, body: { data: [] } }));
  r = await (await conectar({ api })).llamar('status');
  assert.equal(r.isError, false);
  assert.match(r.datos.next_step, /permiso/);
});

test('status con números conectados y sin webhooks sugiere crear uno', async () => {
  const api = apiFalsa((p) =>
    p.path === '/api/v1/devices' ? { body: { data: [{ id: 'dev_Ac7Ku7iIZDXJTjdCu0UB1mX', connected: 1, connection: 'qr' }], meta: { total: 1 } } } : { body: { data: [] } },
  );
  const { llamar } = await conectar({ api });
  const r = await llamar('status');
  assert.equal(r.datos.numbers.connected, 1);
  assert.match(r.datos.next_step, /webhooks action=create/);
});

test('una respuesta larga se recorta sin romper el JSON', () => {
  const grande = { data: Array.from({ length: 500 }, (_, i) => ({ id: `evt_${i}`, texto: 'x'.repeat(200) })), meta: { total: 500 } };
  const t = recortar(grande, 30000);
  const j = JSON.parse(t);
  assert.ok(t.length <= 30000);
  assert.ok(j.data.length > 0 && j.data.length < 500);
  assert.equal(j.truncated.of, 500);
  const obj = JSON.parse(recortar({ texto: 'y'.repeat(50000) }, 30000));
  assert.equal(obj.truncated.characters > 30000, true);
});

test('los listados llegan sin links ni meta.links', async () => {
  const api = apiFalsa(() => ({ body: { data: [{ id: 1 }], links: { next: 'http://x?page=2' }, meta: { current_page: 1, last_page: 3, total: 41, links: [1, 2] } } }));
  const { llamar } = await conectar({ api });
  const r = await llamar('contacts', { action: 'list', params: {} });
  assert.deepEqual(r.datos, { data: [{ id: 1 }], meta: { current_page: 1, last_page: 3, total: 41, next: true } });
});

test('cada pedido lleva la clave y el User-Agent con la versión; un error trae status y el cuerpo de la API', async () => {
  const api = apiFalsa(() => ({ status: 429, body: { error: 'rate_limited', message: 'Espera.' }, headers: { 'Retry-After': '7' } }));
  const { llamar } = await conectar({ api });
  const r = await llamar('messages', { action: 'send', params: { device_id: 'dev_Ac7Ku7iIZDXJTjdCu0UB1mX', phone: '5491122334455', text: 'Hola' } });
  assert.deepEqual(r.datos, { status: 429, error: 'rate_limited', message: 'Espera.', retry_after: 7 });
  assert.equal(api.pedidos[0].headers.Authorization, 'Bearer 1|fc_live_prueba');
  assert.equal(api.pedidos[0].headers['User-Agent'], `funnelchat-mcp/${VERSION}`);
});

test('sin clave en stdio, el error dice dónde ponerla', async () => {
  const { llamar } = await conectar({ apiKey: undefined });
  const r = await llamar('contacts', { action: 'list', params: {} });
  assert.equal(r.datos.error, 'missing_api_key');
  assert.match(r.datos.message, /FUNNELCHAT_API_KEY/);
});

test('la URL base se normaliza al host', () => {
  assert.equal(normalizarBase(''), 'https://api.funnelchat.com');
  assert.equal(normalizarBase('https://api.funnelchat.com/'), 'https://api.funnelchat.com');
  assert.equal(normalizarBase('https://api.funnelchat.com/api/v1/'), 'https://api.funnelchat.com');
  assert.equal(normalizarBase('https://api.funnelchat.com/v1'), 'https://api.funnelchat.com');
  assert.equal(normalizarBase('http://127.0.0.1:4010/api'), 'http://127.0.0.1:4010');
  assert.equal(normalizarBase('https://proxy.example.com/funnelchat/api/v1'), 'https://proxy.example.com/funnelchat');
  assert.throws(() => normalizarBase('api.funnelchat.com'), /no es una URL/);
  assert.throws(() => normalizarBase('ftp://x.com'), /http o https/);
  assert.equal(baseDelEntorno({ FUNNELCHAT_API_URL: 'http://127.0.0.1:4010/api/v1' }), 'http://127.0.0.1:4010');
  assert.equal(baseDelEntorno({ FUNNELCHAT_BASE_URL: 'http://127.0.0.1:4300', FUNNELCHAT_API_URL: 'http://otro' }), 'http://127.0.0.1:4300');
  assert.equal(baseDelEntorno({ FUNNELCHAT_BASE_URL: 'http://127.0.0.1:4300' }, 'http://127.0.0.1:4301/v1'), 'http://127.0.0.1:4301');
});
