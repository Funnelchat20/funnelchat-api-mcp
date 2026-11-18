#!/usr/bin/env node
// Arma docs/indice.json, lo que busca search_docs, desde los textos para IA que publica el portal
// (llms.txt, llms-full.txt y /ia/), y anota de dónde salió en docs/procedencia.json.
//
//   node scripts/docs.mjs --portal <carpeta>   la carpeta del portal ya construido: su public/ o su out/
//                                              (o un checkout del portal: se usa su public/)
//   node scripts/docs.mjs --check              revisa docs/ sin el portal: que el índice sea el que anotó
//                                              procedencia.json, que no ofrezca lo que ya no existe y que
//                                              salga de la misma versión del portal que la spec
//
// Cada archivo se parte en secciones por título; una sección repetida (el mismo texto en la página del
// tema, en la de referencia y en llms-full.txt) queda una sola vez, la de la página más específica.

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const INDICE = join(RAIZ, 'docs/indice.json');
const PROCEDENCIA = join(RAIZ, 'docs/procedencia.json');
const PROC_SPEC = join(RAIZ, 'spec/procedencia.json');

// Lo que la doc ya no ofrece o todavía no existe: si aparece, docs/ salió de un portal viejo o adelantado.
export const PROHIBIDO = [
  [/SDK (de|para) (PHP|Python)/i, 'ofrece un SDK de PHP o de Python, que no existen'],
  [/composer require funnelchat|pip install funnelchat|funnelchat-php|funnelchat-python/i, 'instala un SDK de PHP o de Python'],
  [/api\.funnelchat\.com\/v1\b/, 'usa la base /v1, que producción todavía no sirve'],
  [/api-staging\.funnelchat\.com|[a-z]-api\.funnelchat\.app|instabox/i, 'apunta a una API que no es la pública'],
];

const sha256 = (b) => createHash('sha256').update(b).digest('hex');
const normal = (t) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

function archivos(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? archivos(p) : /\.(md|txt)$/.test(p) ? [p] : [];
  });
}

// Primero lo más específico: recetas, temas, más funciones, referencia por llamada, y al final los
// textos que juntan a otros (index.md, instrucciones.md, llamadas*.md, llms-full.txt…).
function prioridad(rel) {
  if (/^(llms(-full)?\.txt|ia\/(index|instrucciones|llamadas[^/]*|referencia[^/]*|mas-funciones|plataforma)\.md|ia\/mas-funciones\/[^/]+\.md)$/.test(rel)) return 4;
  if (rel.startsWith('ia/recetas/')) return 0;
  if (/^ia\/[^/]+\.md$/.test(rel)) return 1;
  if (rel.startsWith('ia/mas-funciones/')) return 2;
  return 3;
}

export function armarIndice(publico) {
  const lista = [join(publico, 'llms.txt'), join(publico, 'llms-full.txt'), ...archivos(join(publico, 'ia'))]
    .map((f) => [f, relative(publico, f).replace(/\\/g, '/')])
    .sort((a, b) => prioridad(a[1]) - prioridad(b[1]) || a[1].localeCompare(b[1]));
  const secciones = [];
  const vistas = new Set();
  for (const [f, rel] of lista) {
    const lineas = readFileSync(f, 'utf8').split('\n');
    const doc = (lineas.find((l) => l.startsWith('# ')) || rel).replace(/^# /, '').replace(/ — API de Funnelchat.*$/, '');
    let sec = { titulo: '', cuerpo: [] };
    let enCodigo = false;
    const cerrar = () => {
      const cuerpo = sec.cuerpo.join('\n').trim();
      if (cuerpo.length < 40) return;
      const clave = normal(cuerpo.slice(0, 300)).replace(/\s+/g, ' ');
      if (vistas.has(clave)) return;
      vistas.add(clave);
      secciones.push({ u: `/${rel}`, d: doc, s: sec.titulo, c: cuerpo });
    };
    for (const l of lineas) {
      if (/^\s*```/.test(l)) enCodigo = !enCodigo;
      const m = !enCodigo && l.match(/^#{2,4} (.+)/);
      if (m) {
        cerrar();
        sec = { titulo: m[1].trim(), cuerpo: [] };
      } else sec.cuerpo.push(l);
    }
    cerrar();
  }
  return { archivos: lista.length, secciones };
}

export function revisarContenido(texto) {
  return PROHIBIDO.filter(([re]) => re.test(texto)).map(([re, que]) => `${que} (${texto.match(re)[0]})`);
}

const git = (cwd, ...args) => {
  try {
    return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
};

function importar(portal) {
  let publico = resolve(portal);
  if (!existsSync(join(publico, 'llms-full.txt')) && existsSync(join(publico, 'public/llms-full.txt'))) publico = join(publico, 'public');
  for (const f of ['llms.txt', 'llms-full.txt', 'ia']) {
    if (!existsSync(join(publico, f))) throw new Error(`${publico} no tiene ${f}: pasa la carpeta del portal ya construido (npm run ia en el portal).`);
  }
  const { archivos: n, secciones } = armarIndice(publico);
  const texto = `${JSON.stringify({ portal: 'https://developers-portal.funnelchat.app', secciones })}\n`;
  const malos = revisarContenido(texto);
  if (malos.length) throw new Error(`Los textos del portal no sirven:\n- ${malos.join('\n- ')}`);
  const top = git(publico, 'rev-parse', '--show-toplevel');
  const procedencia = {
    description: 'De dónde salió docs/indice.json. Lo escribe `npm run docs -- --portal <carpeta>`; no se edita a mano.',
    file: 'docs/indice.json',
    sha256: sha256(texto),
    source: {
      portal_version: top ? git(top, 'describe', '--tags') : null,
      repository: top ? git(top, 'remote', 'get-url', 'origin') : null,
      branch: top ? git(top, 'branch', '--show-current') : null,
      commit: top ? git(top, 'rev-parse', 'HEAD') : null,
      folder: top ? relative(top, publico) || '.' : null,
      files: n,
    },
    sections: secciones.length,
    imported_at: new Date().toISOString(),
  };
  mkdirSync(dirname(INDICE), { recursive: true });
  writeFileSync(INDICE, texto);
  writeFileSync(PROCEDENCIA, `${JSON.stringify(procedencia, null, 2)}\n`);
  console.log(`docs: ${secciones.length} secciones de ${n} archivos (${(texto.length / 1024).toFixed(0)} KB), del portal ${procedencia.source.portal_version ?? '?'}`);
}

function revisar() {
  const malos = [];
  if (!existsSync(INDICE) || !existsSync(PROCEDENCIA)) {
    console.error('Falta docs/indice.json o docs/procedencia.json: corre npm run docs -- --portal <carpeta>.');
    process.exit(1);
  }
  const texto = readFileSync(INDICE, 'utf8');
  const proc = JSON.parse(readFileSync(PROCEDENCIA, 'utf8'));
  if (sha256(texto) !== proc.sha256) malos.push('docs/indice.json no es el que anotó docs/procedencia.json: se editó a mano. Vuelve a correr npm run docs.');
  const { secciones } = JSON.parse(texto);
  if (!Array.isArray(secciones) || secciones.length < 100) malos.push(`docs/indice.json tiene ${secciones?.length ?? 0} secciones: ¿salió de un portal sin construir?`);
  for (const m of revisarContenido(texto)) malos.push(`docs/indice.json ${m}`);
  if (existsSync(PROC_SPEC)) {
    const spec = JSON.parse(readFileSync(PROC_SPEC, 'utf8')).source || {};
    const a = proc.source?.commit;
    const b = spec.commit;
    if (a && b && a !== b) {
      malos.push(`docs/ salió del portal ${proc.source.portal_version} (${a.slice(0, 7)}) y la spec de ${spec.portal_version} (${b.slice(0, 7)}): regenera los dos del mismo portal.`);
    }
  }
  if (malos.length) {
    console.error(`docs/ no sirve:\n- ${malos.join('\n- ')}`);
    process.exit(1);
  }
  console.log(`docs/ al día: ${secciones.length} secciones del portal ${proc.source?.portal_version ?? '?'}`);
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--check')) return revisar();
  const i = argv.indexOf('--portal');
  if (i < 0 || !argv[i + 1]) throw new Error('Uso: npm run docs -- --portal <carpeta del portal construido>  |  npm run docs:check');
  importar(argv[i + 1]);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
