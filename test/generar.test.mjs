// El generador: corta(), los parches, lo que no se deshace, los nombres estables y que todo esté al día.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { corta, generar } from '../scripts/generar.mjs';

const raiz = new URL('..', import.meta.url).pathname;
const diseno = JSON.parse(readFileSync(new URL('../diseno.json', import.meta.url), 'utf8'));
const node = (...args) => execFileSync(process.execPath, args, { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

test('corta() deja la primera oración y no corta en «:» ni en «;»', () => {
  assert.equal(corta('`qr` (código QR) o `meta` (número oficial)'), 'qr (código QR) o meta (número oficial)');
  assert.equal(corta('Encabezado: `text`, `image`, `video` o `document`'), 'Encabezado: text, image, video o document');
  assert.equal(corta('Con `meta`: ofrece un número de EE. UU.; exige `dedicated`'), 'Con meta: ofrece un número de EE. UU.; exige dedicated');
  assert.equal(corta('Nombre del tablero. Hasta 10 por cuenta.'), 'Nombre del tablero');
  assert.equal(corta('**Permiso requerido:** **Números → Ver**\n\nComprueba el permiso de Meta.'), 'Comprueba el permiso de Meta');
  const largo = corta('palabra '.repeat(40));
  assert.ok(largo.length <= 110 && largo.endsWith('palabra…'), largo);
});

test('generated/tabla.json está al día con la spec y diseno.json', () => {
  assert.match(node('scripts/generar.mjs', '--check'), /al día/);
});

// Una spec mínima con la forma de la publicada hasta v0.7.0 para crear plantillas.
const specVieja = (extra = {}) => ({
  openapi: '3.1.0',
  paths: {
    '/api/v1/templates': {
      post: {
        tags: ['Plantillas'],
        summary: 'Crear una plantilla',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { name: { type: 'string' }, body: { type: 'string' }, params: { type: ['array', 'null'], items: { type: 'string' } } },
                required: ['name', 'body'],
              },
            },
          },
        },
      },
    },
    ...extra,
  },
});
const disenoMini = (extra = {}) => ({
  tools: [{ name: 'templates', title: 'Plantillas', description: 'x', grupos: ['Plantillas'], quitar: ['templates'] }],
  parches: { 'POST /api/v1/templates': diseno.parches['POST /api/v1/templates'] },
  ...extra,
});

test('el parche de templates.create se aplica mientras la spec no trae device_id ni params {body, samples}', () => {
  const { tools, avisos } = generar(specVieja(), disenoMini());
  const a = tools[0].actions.create;
  assert.ok(a.required.includes('device_id'));
  assert.equal(a.params.params.type, '{body: object, samples: {body: object}}');
  assert.equal(avisos.length, 0);
  // Con la spec de ahora, que ya lo trae, el generador avisa que sobra.
  const actual = JSON.parse(readFileSync(new URL('../spec/funnelchat.json', import.meta.url), 'utf8'));
  const { avisos: a2 } = generar(actual, diseno);
  assert.ok(a2.some((x) => x.includes('parche obsoleto') && x.includes('POST /api/v1/templates')));
});

test('un borrado que nadie decidió frena la generación; x-fc-destructive lo decide la spec', () => {
  const borrar = (marca) => ({
    '/api/v1/templates/{template}': {
      delete: {
        tags: ['Plantillas'],
        summary: 'Borrar una plantilla',
        ...(marca === undefined ? {} : { 'x-fc-destructive': marca }),
        parameters: [{ name: 'template', in: 'path', required: true, schema: { type: 'string' } }],
      },
    },
  });
  assert.throws(() => generar(specVieja(borrar()), disenoMini()), /parece un borrado y nadie lo decidió/);
  const { tools } = generar(specVieja(borrar(true)), disenoMini());
  assert.equal(tools[0].actions.delete.destructive, true);
  assert.match(tools[0].actions.delete.destructive_reason, /no se puede deshacer/);
  const conLista = generar(specVieja(borrar()), disenoMini({ destructivas: { 'DELETE /api/v1/templates/{template}': 'Borra la plantilla.' } }));
  assert.equal(conLista.tools[0].actions.delete.destructive_reason, 'Borra la plantilla.');
  const marcada = generar(specVieja(borrar(true)), disenoMini({ destructivas: { 'DELETE /api/v1/templates/{template}': 'Borra la plantilla.' } }));
  assert.ok(marcada.avisos.some((x) => x.includes('ya marca')));
});

test('una acción publicada no cambia de nombre ni desaparece sin --permitir-cambios', () => {
  const { tools } = generar(specVieja(), disenoMini());
  const anterior = { tools: [{ name: 'templates', actions: { ...tools[0].actions, crear: tools[0].actions.create } }] };
  assert.throws(() => generar(specVieja(), disenoMini(), { anterior }), /templates\.crear .* desaparece/);
  const ok = generar(specVieja(), disenoMini(), { anterior, permitirCambios: true });
  assert.ok(ok.avisos.some((x) => x.startsWith('cambio permitido')));
});

test('una entrada de diseno.json que no corresponde a ninguna llamada frena la generación', () => {
  assert.throws(() => generar(specVieja(), disenoMini({ ejemplos: { 'templates.no_existe': {} } })), /ejemplos sin llamada/);
  assert.throws(() => generar(specVieja(), disenoMini({ nombres: { 'GET /api/v1/otra': 'x' } })), /nombres sin llamada/);
});
