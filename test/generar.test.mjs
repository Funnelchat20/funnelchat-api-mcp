// El generador: corta(), los parches, lo que no se deshace, los nombres estables y que todo esté al día.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { corta, generar, motivoDeLaSpec } from '../scripts/generar.mjs';

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

test('motivoDeLaSpec() lee el aviso «No se puede deshacer» hasta el párrafo siguiente', () => {
  assert.equal(motivoDeLaSpec({ description: '> ⚠️ **No se puede deshacer:** la nota se borra.\n\n**Permiso requerido:** x' }), 'La nota se borra.');
  assert.equal(motivoDeLaSpec({ description: '**Permiso requerido:** x\n\nBorra un borrador.' }), null);
  assert.equal(motivoDeLaSpec({}), null);
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
// El parche que llevó diseno.json mientras la spec publicada no traía device_id ni params {body, samples}.
const PARCHE_PLANTILLAS = {
  motivo: 'Producción exige device_id y params es {body, samples}.',
  obligatorios: ['device_id'],
  params: {
    device_id: { in: 'body', type: 'string', schema: { t: ['string'] }, desc: 'Id dev_… del número oficial donde se crea' },
    params: {
      in: 'body',
      type: '{body: object, samples: {body: object}}',
      schema: { t: ['object', 'null'], p: { body: { t: ['object'], libre: true }, samples: { t: ['object'], p: { body: { t: ['object'], libre: true } } } } },
    },
  },
};
const disenoMini = (extra = {}) => ({
  tools: [{ name: 'templates', title: 'Plantillas', description: 'x', grupos: ['Plantillas'], quitar: ['templates'] }],
  parches: { 'POST /api/v1/templates': PARCHE_PLANTILLAS },
  ...extra,
});

test('un parche se aplica mientras la spec no trae lo que corrige, y el generador avisa cuando sobra', () => {
  const { tools, avisos } = generar(specVieja(), disenoMini());
  const a = tools[0].actions.create;
  assert.ok(a.required.includes('device_id'));
  assert.equal(a.params.params.type, '{body: object, samples: {body: object}}');
  assert.equal(avisos.length, 0);
  // La spec del portal ya trae templates.create con device_id y params {body, samples}: el parche sobra.
  const actual = JSON.parse(readFileSync(new URL('../spec/funnelchat.json', import.meta.url), 'utf8'));
  const { avisos: a2 } = generar(actual, { ...diseno, parches: { ...diseno.parches, 'POST /api/v1/templates': PARCHE_PLANTILLAS } });
  assert.ok(a2.some((x) => x.includes('parche obsoleto') && x.includes('POST /api/v1/templates')));
});

test('con la spec del portal, diseno.json no tiene nada que sobre y templates.create sale de la spec', () => {
  const actual = JSON.parse(readFileSync(new URL('../spec/funnelchat.json', import.meta.url), 'utf8'));
  const { tools, avisos } = generar(actual, diseno);
  assert.deepEqual(avisos, []);
  const crear = tools.find((t) => t.name === 'templates').actions.create;
  assert.ok(crear.required.includes('device_id'));
  assert.deepEqual(Object.keys(crear.params.params.schema.p), ['body', 'samples']);
  // Lo que no se deshace lo dice la spec, con su motivo; diseno.json solo suma lo que la spec marca false.
  const destructivas = tools.flatMap((t) => Object.entries(t.actions).filter(([, a]) => a.destructive).map(([n, a]) => [`${t.name}.${n}`, a]));
  const marcadas = Object.values(actual.paths).flatMap((it) => Object.values(it).filter((op) => op?.['x-fc-destructive'] === true));
  assert.equal(destructivas.length, marcadas.length + Object.keys(diseno.destructivas).filter((k) => !k.startsWith('_')).length);
  const borrar = destructivas.find(([n]) => n === 'contacts.delete')[1];
  assert.match(borrar.destructive_reason, /^Los contactos se borran para siempre/);
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
  // Marcada sin decir qué se pierde: avisa y usa el nombre de la acción.
  const { tools, avisos } = generar(specVieja(borrar(true)), disenoMini());
  assert.equal(tools[0].actions.delete.destructive, true);
  assert.equal(tools[0].actions.delete.destructive_reason, 'Borrar una plantilla.');
  assert.ok(avisos.some((x) => x.includes('no dice qué se pierde')));
  // Marcada con su aviso: el motivo es el de la spec.
  const conAviso = specVieja(borrar(true));
  conAviso.paths['/api/v1/templates/{template}'].delete.description =
    '> ⚠️ **No se puede deshacer:** la plantilla se borra en `Meta`.\n> Hay que **crearla** de nuevo.\n\n**Permiso requerido:** **Editar**';
  assert.equal(generar(conAviso, disenoMini()).tools[0].actions.delete.destructive_reason, 'La plantilla se borra en Meta. Hay que crearla de nuevo.');
  // Marcada false y en no_destructivas: avisa que sobra.
  const noD = generar(specVieja(borrar(false)), disenoMini({ no_destructivas: { 'DELETE /api/v1/templates/{template}': 'x' } }));
  assert.equal(noD.tools[0].actions.delete.destructive, false);
  assert.ok(noD.avisos.some((x) => x.startsWith('no_destructivas') && x.includes('false')));
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
