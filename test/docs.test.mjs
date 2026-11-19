// search_docs busca en el índice del portal, y docs/ no ofrece lo que no existe.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { revisarContenido } from '../scripts/docs.mjs';
import { buscar } from '../src/docs.mjs';

const raiz = new URL('..', import.meta.url).pathname;

test('docs:check pasa: el índice es el anotado y sale del mismo portal que la spec', () => {
  const salida = execFileSync(process.execPath, ['scripts/docs.mjs', '--check'], { cwd: raiz, encoding: 'utf8' });
  assert.match(salida, /al día/);
});

test('el índice no ofrece SDK de PHP ni de Python, ni la base /v1', () => {
  assert.deepEqual(revisarContenido(readFileSync(new URL('../docs/indice.json', import.meta.url), 'utf8')), []);
  assert.equal(revisarContenido('Instala el SDK de PHP con composer require funnelchat/sdk').length, 2);
  assert.equal(revisarContenido('La base es https://api.funnelchat.com/v1').length, 1);
  assert.equal(revisarContenido('Verifica la firma (funciones en Node.js, Python y PHP)').length, 0);
});

test('search_docs encuentra la ventana de 24 horas y el sandbox, con enlaces al portal', () => {
  const v = buscar('ventana de 24 horas plantilla', 3);
  assert.equal(v.results.length, 3);
  assert.ok(v.results.every((r) => r.url.startsWith('https://developers-portal.funnelchat.app/')));
  assert.ok(v.results.some((r) => /24 horas/i.test(r.snippet)));
  const s = buscar('sandbox local');
  assert.ok(s.results.length > 0);
  assert.deepEqual(buscar('de la el').results, []);
});
