#!/usr/bin/env node
// El único script de generación del MCP (`npm run generate`).
//
//   node scripts/generar.mjs                  regenera generated/tabla.json y el bloque del README desde
//                                             spec/funnelchat.json y diseno.json
//   node scripts/generar.mjs --spec <archivo> copia una spec nueva a spec/, anota de dónde salió en
//                                             spec/procedencia.json y regenera
//   node scripts/generar.mjs --check          regenera en memoria y falla si generated/tabla.json o el
//                                             bloque del README no están al día
//
// Con --spec, si el archivo no está en un checkout de su repositorio (una descarga o una copia), di de
// dónde salió con `--source clave=valor` (url, portal_version, repository, path, branch, commit,
// commit_date, file_tracked_in_git) y, si quieres, `--expect-sha256 <hex>` para rechazar otro archivo.
//
// La spec es la que publica el portal de desarrolladores: cada operación lleva su grupo del portal en
// `tags[0]` y su nombre en `summary`. Lo único escrito a mano es diseno.json: qué grupos van a cada tool,
// los nombres de acción que el algoritmo no saca bien, qué acciones no se deshacen, los ejemplos de las
// acciones principales y los parches a la spec mientras la spec no los traiga.
//
// Falla si un grupo queda sin tool, si una llamada queda fuera, si dos acciones de un tool chocan, si un
// nombre o un ejemplo de diseno.json no corresponde a ninguna llamada, si un borrado no está decidido
// (destructivas o no_destructivas) o si una acción publicada cambia de nombre o desaparece sin
// --permitir-cambios.

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SPEC = join(RAIZ, 'spec/funnelchat.json');
const PROCEDENCIA = join(RAIZ, 'spec/procedencia.json');
const TABLA = join(RAIZ, 'generated/tabla.json');
const README = join(RAIZ, 'README.md');
const METODOS = ['get', 'post', 'put', 'patch', 'delete'];

// ---------- argumentos ----------

function leerArgs(argv) {
  const a = { spec: null, check: false, source: {}, expectSha256: null, permitirCambios: false, diseno: join(RAIZ, 'diseno.json') };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === '--check') a.check = true;
    else if (x === '--spec') a.spec = argv[++i];
    else if (x.startsWith('--spec=')) a.spec = x.slice(7);
    else if (x === '--source') {
      const par = argv[++i] ?? '';
      const k = par.slice(0, par.indexOf('='));
      if (!['url', 'portal_version', 'repository', 'path', 'branch', 'commit', 'commit_date', 'file_tracked_in_git'].includes(k)) {
        throw new Error('--source lleva clave=valor (url, portal_version, repository, path, branch, commit, commit_date, file_tracked_in_git)');
      }
      const v = par.slice(k.length + 1);
      a.source[k] = k === 'file_tracked_in_git' ? v === 'true' : v;
    } else if (x === '--expect-sha256') a.expectSha256 = argv[++i]?.toLowerCase();
    else if (x === '--permitir-cambios') a.permitirCambios = true;
    else throw new Error(`Argumento desconocido: ${x}`);
  }
  if (a.spec === undefined) throw new Error('--spec lleva la ruta del archivo');
  if (a.check && a.spec) throw new Error('--check y --spec no van juntos');
  return a;
}

const sha256 = (b) => createHash('sha256').update(b).digest('hex');
const git = (cwd, ...args) => {
  try {
    return execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
};

// ---------- 1. copiar la spec y anotar de dónde salió ----------

function importarSpec(origen, declarado, esperado) {
  const ruta = resolve(origen);
  const bytes = readFileSync(ruta);
  if (esperado && sha256(bytes) !== esperado) throw new Error(`${origen}: su sha256 es ${sha256(bytes)}, no ${esperado}`);
  const spec = JSON.parse(bytes.toString('utf8'));
  const top = git(dirname(ruta), 'rev-parse', '--show-toplevel');
  const rel = top ? relative(top, ruta) : null;
  const sucio = top ? git(top, 'status', '--porcelain', '--untracked-files=no') : null;
  const procedencia = {
    description: 'De dónde salió spec/funnelchat.json. Lo escribe `npm run generate -- --spec <archivo>`; no se edita a mano.',
    file: 'spec/funnelchat.json',
    sha256: sha256(bytes),
    bytes: bytes.length,
    source: {
      url: null,
      portal_version: top ? git(top, 'describe', '--tags') : null,
      repository: top ? git(top, 'remote', 'get-url', 'origin') : null,
      path: rel,
      branch: top ? git(top, 'branch', '--show-current') : null,
      commit: top ? git(top, 'rev-parse', 'HEAD') : null,
      commit_date: top ? git(top, 'log', '-1', '--format=%cI') : null,
      file_tracked_in_git: top ? git(top, 'ls-files', '--error-unmatch', rel) !== null : null,
      tracked_files_clean: sucio === null ? null : sucio === '',
      file_modified_at: statSync(ruta).mtime.toISOString(),
    },
    imported_at: new Date().toISOString(),
    spec: {
      openapi: spec.openapi ?? null,
      title: spec.info?.title ?? null,
      version: spec.info?.version ?? null,
      paths: Object.keys(spec.paths ?? {}).length,
      operations: Object.values(spec.paths ?? {}).reduce((n, it) => n + METODOS.filter((m) => it[m]).length, 0),
    },
  };
  const claves = Object.keys(declarado);
  if (claves.length) {
    Object.assign(procedencia.source, declarado);
    procedencia.source.declared = claves;
    procedencia.source.declared_note = 'Los campos de `declared` se dieron con `--source`, no se leyeron de git.';
  }
  if (procedencia.source.file_tracked_in_git === false) {
    procedencia.source.note =
      'El archivo es una salida del build del portal (no está en git): `commit` y `portal_version` dicen de qué código salió.';
  }
  mkdirSync(dirname(SPEC), { recursive: true });
  writeFileSync(SPEC, bytes);
  writeFileSync(PROCEDENCIA, `${JSON.stringify(procedencia, null, 2)}\n`);
  console.log(`spec: copiada de ${procedencia.source.url ?? rel ?? ruta} (${procedencia.source.portal_version ?? '?'}, sha256 ${procedencia.sha256.slice(0, 16)}…)`);
}

// ---------- esquemas ----------

let spec;
const ref = (s) => {
  let x = s;
  const vistos = new Set();
  while (x && x.$ref) {
    if (vistos.has(x.$ref)) break;
    vistos.add(x.$ref);
    x = x.$ref.split('/').slice(1).reduce((o, k) => o?.[k.replace(/~1/g, '/').replace(/~0/g, '~')], spec);
  }
  return x || {};
};

// Junta allOf/anyOf/oneOf de objetos en un solo objeto (obligatorios: los de allOf y los comunes a todas las variantes).
export function aplanar(s) {
  s = ref(s);
  if (s.allOf) {
    const partes = s.allOf.map(aplanar);
    return {
      ...s,
      allOf: undefined,
      type: 'object',
      properties: Object.assign({}, ...partes.map((p) => p.properties || {}), s.properties || {}),
      required: [...new Set(partes.flatMap((p) => p.required || []).concat(s.required || []))],
    };
  }
  const variantes = s.anyOf || s.oneOf;
  if (variantes && !s.properties) {
    const objs = variantes.map(aplanar).filter((v) => v.properties);
    if (objs.length && objs.length === variantes.filter((v) => !tipos(v).every((t) => t === 'null')).length) {
      const req = objs.map((o) => new Set(o.required || []));
      return {
        type: 'object',
        description: s.description,
        properties: Object.assign({}, ...objs.map((o) => o.properties)),
        required: [...req[0]].filter((r) => req.every((x) => x.has(r))),
      };
    }
  }
  return s;
}

function tipos(s) {
  s = ref(s);
  if (s.anyOf || s.oneOf) return [...new Set((s.anyOf || s.oneOf).flatMap(tipos))];
  if (s.allOf) return ['object'];
  const t = Array.isArray(s.type) ? s.type : s.type ? [s.type] : s.properties ? ['object'] : s.const !== undefined ? [typeof s.const] : [];
  return s.nullable ? [...t, 'null'] : t;
}

// Tipo compacto para el help: "string", "array<string>", "{id*: string, name: string}" (* = obligatorio).
function forma(s, prof = 0) {
  s = ref(s);
  const t = tipos(s).filter((x) => x !== 'null');
  if (t.includes('array')) return `array<${forma(ref(s.items || {}), prof)}>`;
  if (t.includes('object') || s.properties || s.allOf) {
    const o = aplanar(s);
    if (!o.properties || prof >= 2) return 'object';
    const req = new Set(o.required || []);
    return `{${Object.entries(o.properties)
      .map(([k, v]) => `${k}${req.has(k) ? '*' : ''}: ${forma(v, prof + 1)}`)
      .join(', ')}}`;
  }
  return t.join(' | ') || 'any';
}

function enumDe(s) {
  s = ref(s);
  if (s.enum) return s.enum.filter((v) => v !== null);
  for (const v of s.anyOf || s.oneOf || []) {
    const e = enumDe(v);
    if (e) return e;
  }
  return null;
}

// Esquema reducido para validar: t (tipos), e (enum), i (items), p (propiedades), r (obligatorias),
// libre (acepta propiedades que no lista), o (variantes que no son objetos).
export function esquema(s, prof = 0) {
  s = ref(s);
  const variantes = s.anyOf || s.oneOf;
  if (variantes && !s.properties) {
    const o = aplanar(s);
    if (o !== s) return esquema(o, prof);
    return { o: variantes.map((v) => esquema(v, prof)) };
  }
  if (s.allOf) return esquema(aplanar(s), prof);
  const out = {};
  const t = tipos(s);
  if (t.length) out.t = t;
  if (s.enum) out.e = s.enum;
  else if (s.const !== undefined) out.e = [s.const];
  if (t.includes('array') && s.items && prof < 8) out.i = esquema(s.items, prof + 1);
  if ((t.includes('object') || s.properties) && prof < 8) {
    if (s.properties) {
      out.p = Object.fromEntries(Object.entries(s.properties).map(([k, v]) => [k, esquema(v, prof + 1)]));
      if (s.required?.length) out.r = s.required;
      if (s.additionalProperties) out.libre = true;
    } else out.libre = true;
  }
  return out;
}

// Primera oración, sin markdown, de hasta `max` caracteres. Corta en el punto final de una oración, nunca
// en «:» ni en «;» (ahí empieza lo que importa: «`qr` (código QR) o `meta`…», «Encabezado: `text`…»).
export function corta(txt, max = 110) {
  if (!txt) return '';
  let t = String(txt)
    .replace(/\*\*Permiso requerido:\*\*[^\n]*\n?/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const id = t.match(/^Id opaco[^(]*\(([a-z]+_)…\)/) || t.match(/^Id opaco: un texto que empieza con ([a-z]+_)/);
  if (id) return `Id ${id[1]}…`;
  if (/^The .* (ID|uid)$/i.test(t)) return '';
  // Fin de la primera oración: un punto seguido de espacio y mayúscula, o el final.
  const m = t.match(/^(.+?[^.\s]{2}\.)(?=\s+[A-ZÁÉÍÓÚÑ¿¡(]|$)/);
  if (m) t = m[1];
  t = t.replace(/\.$/, '');
  if (t.length <= max) return t;
  const cortado = t.slice(0, max - 1);
  return `${cortado.slice(0, Math.max(cortado.lastIndexOf(' '), max * 0.6)).replace(/[\s,;:(]+$/, '')}…`;
}

// ---------- ejemplos que se arman solos ----------

const POR_NOMBRE = {
  phone: '5491122334455',
  text: 'Hola, Ana',
  name: 'Ana',
  first_name: 'Ana',
  last_name: 'Pérez',
  email: 'ana@example.com',
  url: 'https://example.com/webhooks/funnelchat',
  description: 'Clientes de la tienda',
  title: 'Pedido sin entregar',
  client_reference: 'pedido-8841',
  group: '120363000000000000@g.us',
  groupUid: '120363000000000000@g.us',
  uid: '120363000000000000@g.us',
};

function ejemplo(s, nombre = '', prof = 0) {
  s = ref(s);
  if (s.examples?.length) return s.examples[0];
  if (s.example !== undefined) return s.example;
  if (s.default !== undefined && s.default !== null) return s.default;
  if (s.const !== undefined) return s.const;
  const t = tipos(s);
  if (t.includes('array')) return [ejemplo(ref(s.items || {}), nombre.replace(/s$/, ''), prof + 1)];
  const e = enumDe(s);
  if (e?.length) return e[0];
  if (POR_NOMBRE[nombre] !== undefined && t.includes('string')) return POR_NOMBRE[nombre];
  const pat = s.pattern?.match(/^\^([a-z]+_)\[A-Za-z0-9\]\{23\}\$$/);
  if (pat) return `${pat[1]}Ac7Ku7iIZDXJTjdCu0UB1mX`;
  if (t.includes('object') || s.properties) {
    const o = aplanar(s);
    const out = {};
    if (prof < 3) for (const r of o.required || []) out[r] = ejemplo(o.properties?.[r] || {}, r, prof + 1);
    return out;
  }
  if (t.includes('integer') || t.includes('number')) return s.minimum ?? 1;
  if (t.includes('boolean')) return true;
  if (s.format === 'date-time') return '2026-11-17T12:00:00Z';
  if (s.format === 'date') return '2026-11-17';
  if (s.format === 'uri') return 'https://example.com';
  return null; // sin un valor creíble: la acción necesita un ejemplo a mano en diseno.json
}

// ---------- lista o uno ----------

function esListado(op) {
  if (op['x-fc-listing']) return true;
  const r = ref(op.responses?.['200'] || op.responses?.['201'] || {});
  const s = ref(r.content?.['application/json']?.schema || {});
  if (tipos(s).includes('array')) return true;
  const data = aplanar(s).properties?.data;
  return !!data && tipos(data).includes('array');
}

// ---------- nombre de la acción ----------

const VERBOS = new Set([
  'clean', 'refresh', 'import', 'publish', 'sync', 'retry', 'cancel', 'close', 'reopen', 'verify', 'assign',
  'approve', 'reject', 'renew', 'test', 'reorder', 'pause', 'delete', 'read', 'forward', 'typing', 'remove', 'reset',
  'switch-validation', 'move-to-folder', 'mark-all-read', 'mark-all-unread', 'update-or-create', 'send-message',
  'send-template', 'add-tags', 'remove-tags', 'attach-custom-field', 'detach-custom-field', 'move-contact',
  'bulk-move', 'remove-contact', 'bulk-remove',
]);
const snake = (x) => x.replace(/-/g, '_');
const singular = (x) => (x.endsWith('ies') ? `${x.slice(0, -3)}y` : x.endsWith('ss') ? x : x.replace(/s$/, ''));

function nombreAccion(metodo, ruta, quitar, op) {
  const segs = ruta.replace(/^\/api\/v1\//, '').split('/');
  const terminaEnParam = segs.at(-1).startsWith('{');
  const resto = [];
  segs.forEach((s, i) => {
    if (s.startsWith('{') || s === 'live' || quitar.includes(s)) return;
    resto.push(segs[i + 1]?.startsWith('{') ? singular(s) : s);
  });
  const conteo = resto.findIndex((s) => s === 'count' || s.endsWith('-count'));
  if (conteo > -1) {
    const otros = resto.filter((_, i) => i !== conteo).concat(resto[conteo] === 'count' ? [] : [resto[conteo].replace(/-count$/, '')]);
    return ['count', ...otros].map(snake).join('_');
  }
  const ultimo = resto.at(-1);
  if (ultimo && VERBOS.has(ultimo) && metodo !== 'GET') {
    if (ultimo.includes('-')) return snake(ultimo);
    return [ultimo, ...resto.slice(0, -1)].map(snake).join('_');
  }
  if (ultimo === 'test') return ['test', ...resto.slice(0, -1)].map(snake).join('_');
  const sufijo = resto.map(snake).join('_');
  const base = { GET: terminaEnParam || !esListado(op) ? 'get' : 'list', POST: 'create', PUT: 'update', PATCH: 'update', DELETE: 'delete' }[metodo];
  if (!sufijo) return base;
  const suf = metodo === 'POST' && !terminaEnParam ? resto.slice(0, -1).concat(singular(ultimo)).map(snake).join('_') : sufijo;
  return `${base}_${suf}`;
}

// ---------- armado ----------

const sinComentarios = (o) => Object.fromEntries(Object.entries(o || {}).filter(([k]) => !k.startsWith('_')));
// Lo que puede parecer un borrado y hay que decidir a mano: todo DELETE y los POST/PUT con verbo de quitar.
const PARECE_BORRADO = /\/(delete|cancel|clean|reset|remove|bulk-remove|renew|reject|detach-custom-field|remove-tags|remove-contact)$/;

export function generar(specObj, diseno, { anterior = null, permitirCambios = false } = {}) {
  spec = specObj;
  const avisos = [];
  const nombres = sinComentarios(diseno.nombres);
  const destructivas = sinComentarios(diseno.destructivas);
  const noDestructivas = sinComentarios(diseno.no_destructivas);
  const lecturasPost = sinComentarios(diseno.lecturas_por_post);
  const parches = sinComentarios(diseno.parches);
  const ejemplos = sinComentarios(diseno.ejemplos);
  const usados = { nombres: new Set(), destructivas: new Set(), noDestructivas: new Set(), lecturas: new Set(), parches: new Set(), ejemplos: new Set() };

  // Las operaciones de la spec, por grupo del portal (tags[0]).
  const porGrupo = new Map();
  for (const [ruta, item] of Object.entries(spec.paths || {})) {
    for (const m of METODOS) {
      const op = item[m];
      if (!op) continue;
      const g = op.tags?.[0];
      if (!g) throw new Error(`${m.toUpperCase()} ${ruta}: sin grupo (tags[0]) en la spec`);
      if (!porGrupo.has(g)) porGrupo.set(g, []);
      porGrupo.get(g).push([`${m.toUpperCase()} ${ruta}`, op, item]);
    }
  }
  const ultimoEstatico = (ruta) => ruta.split('/').filter((s) => s && !s.startsWith('{')).at(-1);
  const asignadas = new Map();
  const tools = [];

  for (const t of diseno.tools) {
    const llamadas = [];
    for (const g of t.grupos) {
      if (!porGrupo.has(g)) throw new Error(`diseno.json: el grupo «${g}» no está en la spec`);
      for (const x of porGrupo.get(g)) if (!(t.excluir || []).includes(ultimoEstatico(x[0].split(' ')[1]))) llamadas.push(x);
    }
    for (const [g, sust] of Object.entries(t.desde || {})) {
      for (const x of porGrupo.get(g) || []) if (ultimoEstatico(x[0].split(' ')[1]) === sust) llamadas.push(x);
    }
    const acciones = {};
    for (const [clave, op, item] of llamadas) {
      if (asignadas.has(clave)) throw new Error(`${clave} está en ${asignadas.get(clave)} y en ${t.name}`);
      asignadas.set(clave, t.name);
      const [metodo, ruta] = clave.split(' ');
      let nombre = nombres[clave];
      if (nombre) usados.nombres.add(clave);
      else nombre = nombreAccion(metodo, ruta, t.quitar || [], op);
      if (acciones[nombre]) throw new Error(`${t.name}: «${nombre}» choca entre ${acciones[nombre].method} ${acciones[nombre].path} y ${clave}`);

      // Parámetros: los de la ruta y la query, y los campos del cuerpo.
      const params = {};
      const obligatorios = [];
      const props = {};
      for (const p of [...(item.parameters || []), ...(op.parameters || [])].map(ref)) {
        if (p.in === 'header' || p.in === 'cookie') continue;
        const nom = p.name.replace(/\[\]$/, '');
        const s = p.schema || {};
        params[nom] = { in: p.in, type: forma(s), schema: esquema(s) };
        const e = enumDe(s);
        if (e?.length) params[nom].enum = e;
        const d = corta(p.description || ref(s).description);
        if (d) params[nom].desc = d;
        if (p.name.endsWith('[]')) params[nom].brackets = true;
        props[nom] = s;
        if ((p.required || p.in === 'path') && !obligatorios.includes(nom)) obligatorios.push(nom);
      }
      let cuerpo = null;
      const cont = op.requestBody?.content?.['application/json'];
      if (cont?.schema) {
        const s = ref(cont.schema);
        if (tipos(s).includes('array')) {
          cuerpo = 'array';
          params.items = { in: 'body', type: forma(s), schema: esquema(s), desc: corta(s.description) || 'La lista que va en el cuerpo.' };
          props.items = s;
          obligatorios.push('items');
        } else {
          cuerpo = 'object';
          const o = aplanar(s);
          const req = new Set(o.required || []);
          for (const [k, v] of Object.entries(o.properties || {})) {
            if (params[k]) throw new Error(`${clave}: el campo «${k}» del cuerpo choca con un parámetro`);
            params[k] = { in: 'body', type: forma(v), schema: esquema(v) };
            const e = enumDe(v);
            if (e?.length) params[k].enum = e;
            const d = corta(ref(v).description);
            if (d) params[k].desc = d;
            props[k] = v;
            if (req.has(k)) obligatorios.push(k);
          }
        }
      } else if (op.requestBody?.content && !cont) {
        avisos.push(`${clave}: el cuerpo no es JSON (${Object.keys(op.requestBody.content).join(', ')}); el MCP manda JSON`);
      }

      // Parches de diseno.json: correcciones a la spec mientras no las traiga, y lo que se deja de ofrecer.
      const parche = parches[clave];
      const quitados = {};
      if (parche) {
        usados.parches.add(clave);
        let aplicado = false;
        for (const [k, sch] of Object.entries(parche.params || {})) {
          const nuevo = { in: sch.in || 'body', type: sch.type, schema: sch.schema, desc: sch.desc };
          if (sch.enum) nuevo.enum = sch.enum;
          if (params[k]?.type === nuevo.type) continue;
          params[k] = nuevo;
          aplicado = true;
        }
        for (const k of parche.obligatorios || []) {
          if (obligatorios.includes(k)) continue;
          if (!params[k]) throw new Error(`diseno.json parches ${clave}: «${k}» obligatorio no es un parámetro`);
          obligatorios.push(k);
          aplicado = true;
        }
        for (const [k, valores] of Object.entries(parche.quitar_valores || {})) {
          const p = params[k];
          if (!p?.enum) throw new Error(`diseno.json parches ${clave}: «${k}» no tiene enum`);
          const quedan = p.enum.filter((v) => !valores.includes(v));
          if (quedan.length === p.enum.length) continue;
          p.enum = quedan;
          p.schema = { ...p.schema, e: quedan };
          p.desc = corta(parche.desc?.[k] || p.desc);
          quitados[k] = { valores, motivo: parche.motivo };
          aplicado = true;
        }
        for (const k of parche.quitar_params || []) {
          if (!params[k]) continue;
          delete params[k];
          quitados[k] = { motivo: parche.motivo };
          const i = obligatorios.indexOf(k);
          if (i > -1) obligatorios.splice(i, 1);
          aplicado = true;
        }
        for (const [k, d] of Object.entries(parche.desc || {})) if (params[k] && !quitados[k]) params[k].desc = d;
        if ((parche.params || parche.obligatorios) && !aplicado) {
          avisos.push(`parche obsoleto: la spec ya trae lo que corrige diseno.json parches «${clave}»; bórralo`);
        }
      }

      // ¿Se deshace? La spec lo dice con x-fc-destructive; mientras no lo marque en todo, decide diseno.json.
      const marca = op['x-fc-destructive'];
      let destructiva = marca === true;
      let motivo = null;
      if (destructivas[clave]) {
        usados.destructivas.add(clave);
        motivo = destructivas[clave];
        if (marca === true) avisos.push(`destructivas: la spec ya marca «${clave}» con x-fc-destructive; se puede borrar de diseno.json (el motivo sigue sirviendo)`);
        destructiva = true;
      }
      if (noDestructivas[clave]) {
        usados.noDestructivas.add(clave);
        if (marca === true) throw new Error(`diseno.json no_destructivas: la spec marca «${clave}» como destructiva`);
      }
      if (destructiva && !motivo) motivo = `${op.summary}: no se puede deshacer.`;
      if (!destructiva && marca === undefined && !noDestructivas[clave] && (metodo === 'DELETE' || PARECE_BORRADO.test(ruta))) {
        throw new Error(`${clave} («${op.summary}») parece un borrado y nadie lo decidió: agrégalo a destructivas o a no_destructivas de diseno.json`);
      }

      let lectura = metodo === 'GET';
      if (lecturasPost[clave]) {
        usados.lecturas.add(clave);
        lectura = true;
      }

      // Ejemplo: el de diseno.json; si no, el primero de la spec; si no, uno armado con los obligatorios.
      const claveAccion = `${t.name}.${nombre}`;
      let ej = ejemplos[claveAccion];
      let origenEj = 'diseno';
      if (ej) usados.ejemplos.add(claveAccion);
      else {
        origenEj = 'spec';
        ej = {};
        const exCuerpo = cont?.examples ? Object.values(cont.examples).map(ref)[0]?.value : cont?.example;
        for (const p of [...(item.parameters || []), ...(op.parameters || [])].map(ref)) {
          const nom = p.name.replace(/\[\]$/, '');
          if (!obligatorios.includes(nom)) continue;
          ej[nom] = p.example ?? p.schema?.examples?.[0] ?? p.schema?.example ?? ejemplo(p.schema || {}, nom);
        }
        if (exCuerpo !== undefined && cuerpo === 'array') ej.items = exCuerpo;
        else if (exCuerpo && typeof exCuerpo === 'object') Object.assign(ej, exCuerpo);
        else {
          origenEj = 'armado';
          for (const n of obligatorios) if (!(n in ej)) ej[n] = n === 'items' ? ejemplo(props.items, 'items') : ejemplo(props[n] || {}, n);
          for (const n of ['phone', 'text', 'name', 'url', 'client_reference']) {
            if (params[n]?.in === 'body' && !(n in ej) && Object.keys(ej).length < 5) ej[n] = ejemplo(props[n] || {}, n);
          }
        }
        // Lo que se dejó de ofrecer no sale en el ejemplo.
        for (const k of Object.keys(quitados)) if (!quitados[k].valores) delete ej[k];
        for (const [k, q] of Object.entries(quitados)) if (q.valores && q.valores.includes(ej[k])) delete ej[k];
        for (const [k, v] of Object.entries(ej)) if (v === null && obligatorios.includes(k)) delete ej[k];
      }

      const accion = {
        summary: op.summary,
        method: metodo,
        path: ruta,
        grupo: op.tags[0],
        permission: op['x-fc-permission'] || null,
        purpose: corta(op['x-fc-proposito'], 220) || null,
        read_only: lectura,
        destructive: destructiva,
        body: cuerpo,
        required: obligatorios,
        params,
        example: ej,
        example_from: origenEj,
      };
      if (destructiva) accion.destructive_reason = motivo;
      if (Object.keys(quitados).length) accion.unavailable = quitados;
      acciones[nombre] = accion;
    }
    tools.push({ name: t.name, title: t.title, description: t.description, actions: acciones });
  }

  // Todo lo publicado tiene tool; todo lo de diseno.json se usó.
  const todas = [...porGrupo.values()].flat().map((x) => x[0]);
  const faltan = todas.filter((k) => !asignadas.has(k));
  if (faltan.length) throw new Error(`Llamadas sin tool (agrega su grupo a un tool de diseno.json):\n${faltan.join('\n')}`);
  const sobran = (obj, set, que) => {
    const s = Object.keys(obj).filter((k) => !set.has(k));
    if (s.length) throw new Error(`diseno.json ${que} sin llamada:\n${s.join('\n')}`);
  };
  sobran(nombres, usados.nombres, 'nombres');
  sobran(destructivas, usados.destructivas, 'destructivas');
  sobran(noDestructivas, usados.noDestructivas, 'no_destructivas');
  sobran(lecturasPost, usados.lecturas, 'lecturas_por_post');
  sobran(parches, usados.parches, 'parches');
  sobran(ejemplos, usados.ejemplos, 'ejemplos');

  // Las acciones publicadas no cambian de nombre ni desaparecen sin decirlo.
  if (anterior) {
    const cambios = [];
    for (const ta of anterior.tools || []) {
      const tn = tools.find((x) => x.name === ta.name);
      for (const [n, a] of Object.entries(ta.actions)) {
        const b = tn?.actions[n];
        if (!b) cambios.push(`${ta.name}.${n} (${a.method} ${a.path}) desaparece`);
        else if (`${a.method} ${a.path}` !== `${b.method} ${b.path}`) cambios.push(`${ta.name}.${n} pasa de ${a.method} ${a.path} a ${b.method} ${b.path}`);
      }
    }
    if (cambios.length && !permitirCambios) {
      throw new Error(`Cambian acciones que ya se publicaron (rompe a quien las usa; si es a propósito, --permitir-cambios):\n${cambios.join('\n')}`);
    }
    if (cambios.length) avisos.push(...cambios.map((c) => `cambio permitido: ${c}`));
  }

  return { tools, avisos, operaciones: asignadas.size };
}

// ---------- README ----------

const INICIO = '<!-- TOOLS:INICIO (lo escribe npm run generate) -->';
const FIN = '<!-- TOOLS:FIN -->';

function bloqueReadme(tabla) {
  const filas = tabla.tools.map((t) => {
    const n = Object.keys(t.actions).length;
    const lect = Object.values(t.actions).filter((a) => a.read_only).length;
    const dest = Object.values(t.actions).filter((a) => a.destructive).length;
    return `| \`${t.name}\` | ${t.description} | ${n} | ${lect} | ${dest} |`;
  });
  const g = tabla.generado;
  return [
    INICIO,
    `Generado desde la spec del portal ${g.spec_version ?? ''} (sha256 \`${g.spec_sha256.slice(0, 12)}…\`): ${g.operaciones} llamadas en ${tabla.tools.length} tools por recurso, más \`status\` y \`search_docs\`.`,
    '',
    '| Tool | Qué hace | Acciones | Lecturas | No se deshacen |',
    '| --- | --- | ---: | ---: | ---: |',
    ...filas,
    FIN,
  ].join('\n');
}

function conBloque(readme, bloque) {
  const i = readme.indexOf(INICIO);
  const f = readme.indexOf(FIN);
  if (i < 0 || f < 0) return null;
  return readme.slice(0, i) + bloque + readme.slice(f + FIN.length);
}

// ---------- main ----------

async function main() {
  const args = leerArgs(process.argv.slice(2));
  if (args.spec) importarSpec(args.spec, args.source, args.expectSha256);
  if (!existsSync(SPEC)) throw new Error('Falta spec/funnelchat.json: corre `npm run generate -- --spec <archivo>`.');
  const bytes = readFileSync(SPEC);
  const procedencia = existsSync(PROCEDENCIA) ? JSON.parse(readFileSync(PROCEDENCIA, 'utf8')) : null;
  if (procedencia && procedencia.sha256 !== sha256(bytes)) {
    throw new Error('spec/funnelchat.json no coincide con el sha256 de spec/procedencia.json: ¿se editó a mano? Impórtala con --spec.');
  }
  const diseno = JSON.parse(readFileSync(args.diseno, 'utf8'));
  const anterior = existsSync(TABLA) ? JSON.parse(readFileSync(TABLA, 'utf8')) : null;
  const { tools, avisos, operaciones } = generar(JSON.parse(bytes.toString('utf8')), diseno, { anterior, permitirCambios: args.permitirCambios });

  const tabla = {
    _comment: 'Generado por scripts/generar.mjs desde spec/funnelchat.json y diseno.json: no se edita a mano.',
    generado: {
      spec: 'spec/funnelchat.json',
      spec_sha256: sha256(bytes),
      spec_version: procedencia?.source?.portal_version ?? null,
      operaciones,
      tools: tools.length,
      nombres_a_mano: Object.keys(sinComentarios(diseno.nombres)).length,
      ejemplos_a_mano: Object.keys(sinComentarios(diseno.ejemplos)).length,
    },
    tools,
  };
  const textoTabla = `${JSON.stringify(tabla, null, 1)}\n`;
  const readme = existsSync(README) ? readFileSync(README, 'utf8') : null;
  const nuevoReadme = readme ? conBloque(readme, bloqueReadme(tabla)) : null;

  for (const a of avisos) console.warn(`aviso: ${a}`);
  if (args.check) {
    const malos = [];
    if (!anterior || readFileSync(TABLA, 'utf8') !== textoTabla) malos.push('generated/tabla.json');
    if (readme && nuevoReadme !== null && nuevoReadme !== readme) malos.push('README.md (bloque de tools)');
    if (malos.length) {
      console.error(`No está al día: ${malos.join(', ')}. Corre npm run generate y súbelo.`);
      process.exit(1);
    }
    console.log('generated/tabla.json y el README están al día con la spec y diseno.json');
    return;
  }
  mkdirSync(dirname(TABLA), { recursive: true });
  writeFileSync(TABLA, textoTabla);
  if (nuevoReadme !== null) writeFileSync(README, nuevoReadme);
  const porTool = tools.map((t) => `${t.name} ${Object.keys(t.actions).length}`).join(', ');
  console.log(`tabla: ${operaciones} llamadas en ${tools.length} tools (${porTool})`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
