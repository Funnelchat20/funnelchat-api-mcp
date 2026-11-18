// Los params se validan contra la tabla antes de llamar a la API: nombres, obligatorios, tipos y enums.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { apiFalsa, conectar } from './ayuda.mjs';

test('contacts delete con un filtro que delete no tiene no borra nada', async () => {
  const { llamar, api } = await conectar();
  const r = await llamar('contacts', { action: 'delete', params: { all: true, name: 'Ana' }, confirm: true });
  assert.equal(r.isError, true);
  assert.equal(r.datos.error, 'unknown_params');
  assert.deepEqual(r.datos.unknown, ['name']);
  assert.ok(r.datos.help?.required, 'trae el help de la acción');
  assert.equal(api.pedidos.length, 0, 'no se llamó a la API');
});

test('un filtro mal escrito no devuelve la lista entera: unknown_params con la sugerencia', async () => {
  const { llamar, api } = await conectar();
  const r = await llamar('contacts', { action: 'list', params: { country: 'CL' } });
  assert.equal(r.datos.error, 'unknown_params');
  assert.equal(r.datos.did_you_mean.country, 'country_codes');
  const r2 = await llamar('messages', { action: 'send', params: { number_id: 'dev_Ac7Ku7iIZDXJTjdCu0UB1mX', to: '5491122334455', text: 'Hola' } });
  assert.deepEqual(r2.datos.unknown.sort(), ['number_id', 'to']);
  assert.equal(api.pedidos.length, 0);
});

test('falta un obligatorio: invalid_params con missing, sin llamar', async () => {
  const { llamar, api } = await conectar();
  const r = await llamar('messages', { action: 'send', params: { phone: '5491122334455', text: 'Hola' } });
  assert.equal(r.datos.error, 'invalid_params');
  assert.deepEqual(r.datos.missing, ['device_id']);
  assert.equal(api.pedidos.length, 0);
});

test('tipos y enums, también dentro de listas y objetos', async () => {
  const { llamar, api } = await conectar();
  let r = await llamar('custom_fields', { action: 'create', params: { name: 'Ciudad', type: 'fecha' } });
  assert.equal(r.datos.error, 'invalid_params');
  assert.match(r.datos.errors[0], /^type: tiene que ser entero/);
  r = await llamar('templates', { action: 'list', params: { status: 'APROBADA' } });
  assert.match(r.datos.errors[0], /^status: tiene que ser "PENDING", "APPROVED"/);
  r = await llamar('tags', { action: 'add_tags', params: { items: [{ contactId: 'ctc_AAOzYSKDiqHT4hM8LdPB8Ut', tag: { id: 'tag_AIJEDzSFQ6oDXbab3DubTEG', nombre: 'x' } }] } });
  assert.match(r.datos.errors[0], /^items\[0\]\.tag\.nombre: no existe/);
  r = await llamar('tags', { action: 'add_tags', params: { items: [{ tag: { id: 'tag_AIJEDzSFQ6oDXbab3DubTEG' } }] } });
  assert.match(r.datos.errors[0], /^items\[0\]\.contactId: falta/);
  assert.equal(api.pedidos.length, 0);
});

test('en la query, "20" vale como entero y true viaja como 1', async () => {
  const { llamar, api } = await conectar();
  const r = await llamar('conversations', { action: 'list', params: { unreadMessages: true, deviceId: 'dev_Ac7Ku7iIZDXJTjdCu0UB1mX' } });
  assert.equal(r.isError, false);
  assert.deepEqual(api.pedidos[0].query, [['unreadMessages', '1'], ['deviceId', 'dev_Ac7Ku7iIZDXJTjdCu0UB1mX']]);
  await llamar('numbers', { action: 'list', params: { perPage: '20' } });
  assert.deepEqual(api.pedidos[1].query, [['perPage', '20']]);
  const mal = await llamar('numbers', { action: 'list', params: { perPage: 'veinte' } });
  assert.equal(mal.datos.error, 'invalid_params');
});

test('las listas de la query van como nombre[]', async () => {
  const { llamar, api } = await conectar();
  await llamar('contacts', { action: 'list', params: { country_codes: ['CL', 'AR'] } });
  assert.deepEqual(api.pedidos[0].query, [['country_codes[]', 'CL'], ['country_codes[]', 'AR']]);
});

test('variantes de un cuerpo: boards.create acepta mode stages y tags', async () => {
  const { llamar } = await conectar({ api: apiFalsa(() => ({ status: 201, body: { id: 'knb_x' } })) });
  for (const mode of ['stages', 'tags']) {
    const r = await llamar('boards', { action: 'create', params: { name: 'Ventas', mode } });
    assert.equal(r.isError, false, `${mode}: ${r.txt}`);
  }
  const r = await llamar('boards', { action: 'create', params: { name: 'Ventas', mode: 'kanban' } });
  assert.equal(r.datos.error, 'invalid_params');
});

test('params como texto JSON se lee; como texto que no es JSON, error (nunca {})', async () => {
  const { llamar, api } = await conectar();
  const r = await llamar('messages', { action: 'send', params: '{"device_id": "dev_Ac7Ku7iIZDXJTjdCu0UB1mX", "phone": "5491122334455", "text": "Hola"}' });
  assert.equal(r.isError, false, r.txt);
  assert.equal(api.pedidos[0].body.device_id, 'dev_Ac7Ku7iIZDXJTjdCu0UB1mX');
  const mal = await llamar('messages', { action: 'send', params: 'device_id=dev_x' });
  assert.equal(mal.datos.error, 'invalid_params');
  const lista = await llamar('messages', { action: 'send', params: ['x'] });
  assert.equal(lista.datos.error, 'invalid_params');
  assert.equal(api.pedidos.length, 1);
});

test('params fuera de params, sin action o con una acción que no existe: errores que dicen qué hacer', async () => {
  const { llamar } = await conectar();
  let r = await llamar('messages', { action: 'send', device_id: 'dev_x', text: 'Hola' });
  assert.equal(r.datos.error, 'invalid_arguments');
  assert.deepEqual(r.datos.example.params, { device_id: 'dev_x', text: 'Hola' });
  r = await llamar('messages', {});
  assert.equal(r.datos.error, 'missing_action');
  assert.match(r.datos.message, /send/);
  r = await llamar('messages', { action: 'send_text' });
  assert.equal(r.datos.error, 'unknown_action');
  assert.equal(r.datos.did_you_mean, 'send');
});

test('connect_links ya no ofrece type meta ni el número de EE. UU.', async () => {
  const { llamar, api } = await conectar();
  let r = await llamar('connect_links', { action: 'create', params: { type: 'meta' } });
  assert.equal(r.datos.error, 'invalid_params');
  assert.match(r.datos.errors[0], /meta_connect_disabled/);
  r = await llamar('connect_links', { action: 'create', params: { type: 'qr', provision_us_number: true } });
  assert.match(r.datos.errors[0], /^provision_us_number: no está disponible/);
  const h = await llamar('connect_links', { action: 'help', params: { action: 'create' } });
  assert.doesNotMatch(JSON.stringify(h.datos.required) + JSON.stringify(h.datos.optional) + JSON.stringify(h.datos.example), /meta|provision_us_number|allowed_connection_types/);
  assert.ok(h.datos.unavailable['type=meta']);
  assert.equal(api.pedidos.length, 0);
});

test('templates.create pide device_id y params {body, samples}', async () => {
  const { llamar, api } = await conectar({ api: apiFalsa(() => ({ status: 201, body: { id: 'tpl_x' } })) });
  const base = { name: 'pedido_listo', language_code: 'es', category: 'UTILITY', type: 'text', body: 'Hola {{1}}' };
  let r = await llamar('templates', { action: 'create', params: base });
  assert.deepEqual(r.datos.missing, ['device_id']);
  r = await llamar('templates', { action: 'create', params: { ...base, device_id: 'dev_Ac7Ku7iIZDXJTjdCu0UB1mX', params: ['{name}'] } });
  assert.match(r.datos.errors[0], /^params: tiene que ser objeto/);
  r = await llamar('templates', {
    action: 'create',
    params: { ...base, device_id: 'dev_Ac7Ku7iIZDXJTjdCu0UB1mX', params: { body: { 1: '{name}' }, samples: { body: { 1: 'Lucía' } } } },
  });
  assert.equal(r.isError, false, r.txt);
  assert.equal(api.pedidos.length, 1);
});

test('un id «.» o «..» no cambia la ruta: forms.delete_number no llega a borrar el formulario', async () => {
  const { llamar, api } = await conectar({ api: apiFalsa(() => ({ status: 204 })) });
  for (const deviceId of ['..', '.', ' .. ']) {
    const r = await llamar('forms', { action: 'delete_number', params: { id: 'frv_Ath9bJ3RpAYPhnX0EfcLtHJ', deviceId } });
    assert.equal(r.datos.error, 'invalid_params', JSON.stringify(deviceId));
    assert.match(r.datos.message, /no es un id/);
  }
  const t = await llamar('tags', { action: 'get', params: { tag: '..' } });
  assert.equal(t.datos.error, 'invalid_params');
  assert.equal(api.pedidos.length, 0, 'no se llamó a la API');
  // Un id con «/» o «?» viaja codificado y no sale de su tramo.
  await llamar('tags', { action: 'get', params: { tag: '../contacts/delete?x=' } });
  assert.deepEqual(api.pedidos.map((p) => p.path), ['/api/v1/tags/..%2Fcontacts%2Fdelete%3Fx%3D']);
});
