#!/usr/bin/env node
// Arma generated/tabla.json (tool → acción → operación) desde la spec publicada del portal,
// la agrupación de config/alcance.json y diseno.json. También copia los textos para search_docs.
//
//   node scripts/generar.mjs [--portal <carpeta del developers-portal>]
//
// Falla si una llamada de alcance.json queda sin tool, si dos acciones de un tool chocan
// o si un nombre de diseno.json no corresponde a ninguna llamada.

import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => {
  const i = process.argv.indexOf(n);
  return i > -1 ? process.argv[i + 1] : d;
};
const portal = resolve(arg('--portal', '/home/juan/Programacion/FunnelChat/developers-portal'));

const specTexto = readFileSync(join(portal, 'public/specs/funnelchat.json'), 'utf8');
const spec = JSON.parse(specTexto);
const alcance = JSON.parse(readFileSync(join(portal, 'config/alcance.json'), 'utf8'));
const diseno = JSON.parse(readFileSync(join(raiz, 'diseno.json'), 'utf8'));

// ---------- esquemas ----------

const ref = (s) => {
  let x = s;
  const vistos = new Set();
  while (x && x.$ref) {
    if (vistos.has(x.$ref)) break;
    vistos.add(x.$ref);
    x = x.$ref.split('/').slice(1).reduce((o, k) => o[k], spec);
  }
  return x || {};
};

// Junta allOf/anyOf/oneOf de objetos en un solo objeto (requeridos: los de allOf y los comunes a todas las variantes).
function aplanar(s) {
  s = ref(s);
  if (s.allOf) {
    const partes = s.allOf.map(aplanar);
    return {
      ...s,
      type: 'object',
      properties: Object.assign({}, ...partes.map((p) => p.properties || {}), s.properties || {}),
      required: [...new Set(partes.flatMap((p) => p.required || []).concat(s.required || []))],
    };
  }
  const variantes = s.anyOf || s.oneOf;
  if (variantes && !s.properties) {
    const objs = variantes.map(aplanar).filter((v) => v.properties);
    if (objs.length) {
      const req = objs.map((o) => new Set(o.required || []));
      return {
        type: 'object',
        properties: Object.assign({}, ...objs.map((o) => o.properties)),
        required: [...req[0]].filter((r) => req.every((x) => x.has(r))),
      };
    }
  }
  return s;
}

const tipos = (s) => {
  s = ref(s);
  if (s.anyOf || s.oneOf) return [...new Set((s.anyOf || s.oneOf).flatMap(tipos))];
  const t = Array.isArray(s.type) ? s.type : s.type ? [s.type] : s.properties ? ['object'] : [];
  return t.filter((x) => x !== 'null');
};

// Tipo compacto: "string", "array<string>", "{id*: string, name: string}" (* = obligatorio).
function forma(s, prof = 0) {
  s = ref(s);
  const t = tipos(s);
  if (t.includes('array')) {
    const it = ref(s.items || {});
    return `array<${forma(it, prof)}>`;
  }
  if (t.includes('object') || s.properties) {
    const o = aplanar(s);
    if (!o.properties || prof >= 2) return 'object';
    const req = new Set(o.required || []);
    const campos = Object.entries(o.properties).map(([k, v]) => `${k}${req.has(k) ? '*' : ''}: ${forma(v, prof + 1)}`);
    return `{${campos.join(', ')}}`;
  }
  return t.join(' | ') || 'any';
}

const enumDe = (s) => {
  s = ref(s);
  if (s.enum) return s.enum.filter((v) => v !== null);
  if (s.items) return enumDe(s.items);
  for (const v of s.anyOf || s.oneOf || []) {
    const e = enumDe(v);
    if (e) return e;
  }
  return null;
};

// Primera frase, sin markdown, corta.
function corta(txt, max = 90) {
  if (!txt) return '';
  let t = String(txt)
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (/^Id opaco: un texto que empieza con ([a-z]+_)/.test(t)) return `Id ${t.match(/empieza con ([a-z]+_)/)[1]}…`;
  if (/^The .* ID$/i.test(t)) return '';
  const m = t.match(/^(.+?[.:;])(\s|$)/);
  if (m) t = m[1].replace(/[.:;]$/, '');
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

// Ejemplo de un valor: el de la spec y, si no hay, uno por nombre o por tipo.
const POR_NOMBRE = {
  phone: '5491122334455',
  text: 'Hola, Ana',
  name: 'Ana',
  url: 'https://example.com/webhooks/funnelchat',
  email: 'ana@example.com',
  description: 'Descripción',
  title: 'Título',
  client_reference: 'pedido-8841',
};
function ejemplo(s, nombre = '', prof = 0) {
  s = ref(s);
  if (s.examples?.length) return s.examples[0];
  if (s.example !== undefined) return s.example;
  if (s.default !== undefined && s.default !== null) return s.default;
  const e = enumDe(s);
  const t = tipos(s);
  if (t.includes('array')) {
    const it = ref(s.items || {});
    return [ejemplo(it, nombre.replace(/s$/, ''), prof + 1)];
  }
  if (e?.length) return e[0];
  if (POR_NOMBRE[nombre] !== undefined && t.includes('string')) return POR_NOMBRE[nombre];
  const pat = s.pattern?.match(/^\^([a-z]+_)\[A-Za-z0-9\]\{23\}\$$/);
  if (pat) return `${pat[1]}${'A'.repeat(23)}`;
  if (t.includes('object') || s.properties) {
    const o = aplanar(s);
    const out = {};
    if (prof < 3) for (const r of o.required || []) out[r] = ejemplo(o.properties?.[r] || {}, r, prof + 1);
    return out;
  }
  if (t.includes('integer')) return 1;
  if (t.includes('number')) return 1;
  if (t.includes('boolean')) return true;
  if (s.format === 'date-time') return '2026-11-17T12:00:00Z';
  if (s.format === 'date') return '2026-11-17';
  if (s.format === 'uri') return 'https://example.com';
  return 'texto';
}

function infoParam(s, extra = {}) {
  const sch = ref(s);
  const i = { type: forma(sch) };
  const e = enumDe(sch);
  if (e?.length) i.enum = e;
  const d = corta(extra.description || sch.description);
  if (d) i.desc = d;
  return i;
}

// ---------- lista o uno ----------

function esListado(op) {
  if (op['x-fc-listing']) return true;
  const r = op.responses?.['200'] || op.responses?.['201'];
  const s = ref(ref(r || {}).content?.['application/json']?.schema || {});
  const t = tipos(s);
  if (t.includes('array')) return true;
  const o = aplanar(s);
  const data = o.properties?.data;
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
const IGNORAR = new Set(['live']);
const snake = (x) => x.replace(/-/g, '_');
const singular = (x) => (x.endsWith('ies') ? `${x.slice(0, -3)}y` : x.endsWith('ss') ? x : x.replace(/s$/, ''));

function nombreAccion(metodo, ruta, quitar, op) {
  const segs = ruta.replace(/^\/api\/v1\//, '').split('/');
  const terminaEnParam = segs.at(-1).startsWith('{');
  // Cada sustantivo seguido de un parámetro pasa a singular (scheduled-messages/{id}/groups → scheduled_message_groups).
  const resto = [];
  segs.forEach((s, i) => {
    if (s.startsWith('{') || IGNORAR.has(s) || quitar.includes(s)) return;
    const sigueParam = segs[i + 1]?.startsWith('{');
    resto.push(sigueParam ? singular(s) : s);
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
  const base = {
    GET: terminaEnParam || !esListado(op) ? 'get' : 'list',
    POST: 'create',
    PUT: 'update',
    PATCH: 'update',
    DELETE: 'delete',
  }[metodo];
  if (!sufijo) return base;
  // POST a una colección crea uno: create_note, create_stage.
  const suf = metodo === 'POST' && !terminaEnParam ? resto.slice(0, -1).concat(singular(ultimo)).map(snake).join('_') : sufijo;
  return `${base}_${suf}`;
}

// ---------- confirmación ----------

const sinConfirmar = diseno.sin_confirmar || {};
function pideConfirmar(metodo, ruta, op) {
  if (sinConfirmar[`${metodo} ${ruta}`]) return false;
  if (op['x-fc-destructive'] === true) return true;
  if (metodo === 'DELETE') return true;
  return /\/(delete|cancel|clean|reset)$/.test(ruta);
}

// ---------- armado ----------

const ultimoEstatico = (ruta) => ruta.split('/').filter((s) => s && !s.startsWith('{')).at(-1);
const grupos = Object.fromEntries(alcance.operaciones.map((g) => [g.grupo, g]));
const nombres = Object.fromEntries(Object.entries(diseno.nombres).filter(([k]) => !k.startsWith('_')));
const usados = new Set();
const asignadas = new Map(); // "MÉTODO ruta" → tool
const tools = [];

for (const t of diseno.tools) {
  const llamadas = [];
  for (const g of t.grupos) {
    if (!grupos[g]) throw new Error(`diseno.json: el grupo «${g}» no está en alcance.json`);
    for (const k of Object.keys(grupos[g].llamadas)) {
      const [, ruta] = k.split(' ');
      if ((t.excluir || []).includes(ultimoEstatico(ruta))) continue;
      llamadas.push([k, grupos[g].llamadas[k], g]);
    }
  }
  for (const [g, sust] of Object.entries(t.desde || {})) {
    for (const k of Object.keys(grupos[g].llamadas)) {
      if (ultimoEstatico(k.split(' ')[1]) === sust) llamadas.push([k, grupos[g].llamadas[k], g]);
    }
  }
  const acciones = {};
  for (const [clave, resumen, grupo] of llamadas) {
    if (asignadas.has(clave)) throw new Error(`${clave} está en ${asignadas.get(clave)} y en ${t.name}`);
    asignadas.set(clave, t.name);
    const [metodo, ruta] = clave.split(' ');
    const op = spec.paths[ruta]?.[metodo.toLowerCase()];
    if (!op) throw new Error(`${clave} no está en la spec`);
    let nombre = nombres[clave];
    if (nombre) usados.add(clave);
    else nombre = nombreAccion(metodo, ruta, t.quitar || [], op);
    if (acciones[nombre]) throw new Error(`${t.name}: «${nombre}» choca entre ${acciones[nombre].method} ${acciones[nombre].path} y ${clave}`);

    const params = {};
    const obligatorios = [];
    for (const p of op.parameters || []) {
      const pp = ref(p);
      if (pp.in === 'header' || pp.in === 'cookie') continue;
      const nom = pp.name.replace(/\[\]$/, '');
      params[nom] = { in: pp.in, ...infoParam(pp.schema || {}, { description: pp.description }) };
      if (pp.name.endsWith('[]')) params[nom].brackets = true;
      if (pp.required || pp.in === 'path') obligatorios.push(nom);
    }
    let cuerpo = null;
    const sch = op.requestBody?.content?.['application/json']?.schema;
    if (sch) {
      const s = ref(sch);
      if (tipos(s).includes('array')) {
        cuerpo = 'array';
        params.items = { in: 'body', ...infoParam(s) };
        obligatorios.push('items');
      } else {
        cuerpo = 'object';
        const o = aplanar(s);
        const req = new Set(o.required || []);
        for (const [k, v] of Object.entries(o.properties || {})) {
          if (params[k]) throw new Error(`${clave}: el campo «${k}» del cuerpo choca con un parámetro`);
          params[k] = { in: 'body', ...infoParam(v) };
          if (req.has(k)) obligatorios.push(k);
        }
      }
    }
    // Ejemplo: los obligatorios y, si hay, los campos principales del cuerpo.
    const ej = {};
    const props = cuerpo === 'object' ? aplanar(ref(sch)).properties : {};
    for (const n of obligatorios) {
      if (n === 'items') ej.items = ejemplo(ref(sch), 'items');
      else if (params[n].in === 'body') ej[n] = ejemplo(props[n], n);
      else {
        const p = (op.parameters || []).map(ref).find((x) => x.name.replace(/\[\]$/, '') === n);
        ej[n] = ejemplo(p?.schema || {}, n);
      }
    }
    for (const n of ['phone', 'text', 'name', 'url', 'client_reference']) {
      if (params[n]?.in === 'body' && !(n in ej) && Object.keys(ej).length < 5) ej[n] = ejemplo(props[n], n);
    }

    acciones[nombre] = {
      summary: resumen,
      method: metodo,
      path: ruta,
      grupo,
      permission: op['x-fc-permission'] || null,
      purpose: corta(op['x-fc-proposito'], 200) || null,
      confirm: pideConfirmar(metodo, ruta, op),
      body: cuerpo,
      required: obligatorios,
      params,
      example: ej,
    };
  }
  tools.push({ name: t.name, description: t.description, actions: acciones });
}

// Todo lo publicado tiene tool; todo nombre de diseno.json se usó.
const faltan = alcance.operaciones.flatMap((g) => Object.keys(g.llamadas)).filter((k) => !asignadas.has(k));
if (faltan.length) throw new Error(`Llamadas sin tool:\n${faltan.join('\n')}`);
const sobran = Object.keys(nombres).filter((k) => !usados.has(k));
if (sobran.length) throw new Error(`Nombres de diseno.json sin llamada:\n${sobran.join('\n')}`);

const tabla = {
  _comment: 'Generado por scripts/generar.mjs: no se edita a mano.',
  generado: {
    spec: 'developers-portal/public/specs/funnelchat.json',
    spec_sha256: createHash('sha256').update(specTexto).digest('hex'),
    operaciones: asignadas.size,
    tools: tools.length,
    nombres_a_mano: Object.keys(nombres).length,
  },
  tools,
};
mkdirSync(join(raiz, 'generated'), { recursive: true });
writeFileSync(join(raiz, 'generated/tabla.json'), `${JSON.stringify(tabla, null, 1)}\n`);

// Copia local de los textos para search_docs: llms.txt, llms-full.txt y /ia/.
const docs = join(raiz, 'docs');
if (existsSync(docs)) rmSync(docs, { recursive: true });
mkdirSync(docs, { recursive: true });
cpSync(join(portal, 'public/llms.txt'), join(docs, 'llms.txt'));
cpSync(join(portal, 'public/llms-full.txt'), join(docs, 'llms-full.txt'));
cpSync(join(portal, 'public/ia'), join(docs, 'ia'), { recursive: true });

const porTool = tools.map((t) => `${t.name} ${Object.keys(t.actions).length}`).join(', ');
console.log(`tabla: ${asignadas.size} llamadas en ${tools.length} tools (${porTool}); ${Object.keys(nombres).length} nombres a mano`);
