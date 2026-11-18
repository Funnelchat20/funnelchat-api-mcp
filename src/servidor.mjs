// MCP de la API pública de Funnelchat: un tool por recurso, cada uno con `action` y `params`.
// Cada acción es una llamada a la API con la clave de quien lo usa: los permisos, los límites y los
// errores son los de la API. Antes de llamar, los params se validan contra la tabla; lo que no se
// deshace pide confirm, y el modo de solo lectura deja solo las lecturas.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { BASE_POR_DEFECTO } from './base.mjs';
import { buscar } from './docs.mjs';
import { parecido, validarParams } from './validar.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
export const tabla = JSON.parse(readFileSync(join(raiz, 'generated/tabla.json'), 'utf8'));
export const VERSION = JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8')).version;
const MAX_RESPUESTA = 30000;
const ESPERA_API_MS = 60000;

export function instrucciones({ readOnly = false } = {}) {
  return (
    'Opera la API de Funnelchat con la clave de la persona. Empieza con status. ' +
    'En cada tool, action=help lista las acciones; con params.action da sus parámetros y un ejemplo. ' +
    (readOnly
      ? 'Este servidor es de solo lectura: no crea, no cambia y no borra nada.'
      : 'Lo que no se deshace pide confirm: true, y solo va después de que la persona dijo que sí.')
  );
}

// ---------- definiciones ----------

const accionesVisibles = (tool, readOnly) =>
  Object.fromEntries(Object.entries(tool.actions).filter(([, a]) => !readOnly || a.read_only));

export function definiciones({ readOnly = false } = {}) {
  const recursos = [];
  for (const t of tabla.tools) {
    const acciones = Object.values(accionesVisibles(t, readOnly));
    if (!acciones.length) continue;
    const soloLectura = acciones.every((a) => a.read_only);
    const destructiva = acciones.some((a) => a.destructive);
    const properties = {
      action: { type: 'string', enum: ['help', ...Object.keys(accionesVisibles(t, readOnly))] },
      params: { type: 'object', description: 'Parámetros de la acción (ver help).' },
    };
    if (destructiva) properties.confirm = { type: 'boolean', description: 'true solo con el sí de la persona.' };
    // Lo que no se dice vale lo que dice el protocolo: readOnlyHint false, destructiveHint true y
    // openWorldHint true. Un tool de solo lecturas lo dice; uno que escribe dice si algo no se deshace.
    recursos.push({
      name: t.name,
      description: t.description,
      inputSchema: { type: 'object', properties, required: ['action'] },
      annotations: soloLectura ? { title: t.title, readOnlyHint: true } : { title: t.title, destructiveHint: destructiva },
    });
  }
  return [
    {
      name: 'status',
      description: 'Qué tiene la cuenta: números conectados, webhooks y el siguiente paso.',
      inputSchema: { type: 'object', properties: {} },
      annotations: { title: 'Estado', readOnlyHint: true },
    },
    {
      name: 'search_docs',
      description: 'Busca en la documentación de la API (los textos para IA del portal).',
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string' }, limit: { type: 'integer', minimum: 1, maximum: 10 } },
        required: ['query'],
      },
      annotations: { title: 'Buscar en la doc', readOnlyHint: true, openWorldHint: false },
    },
    ...recursos,
  ];
}

// ---------- resultados ----------

const texto = (obj) => (typeof obj === 'string' ? obj : JSON.stringify(obj));
const ok = (obj) => ({ content: [{ type: 'text', text: texto(obj) }] });
const error = (obj) => ({ isError: true, content: [{ type: 'text', text: texto(obj) }] });

// ---------- help ----------

const PREGUNTA = 'Antes de llamarla, cuéntale a la persona qué se va a perder y pregúntale si quiere seguir; confirm: true va solo con su sí.';
const pedirConfirmacion = (a) => `No se puede deshacer. ${a.destructive_reason} ${PREGUNTA}`;

export function ayuda(tool, cual, { readOnly = false } = {}) {
  const acciones = accionesVisibles(tool, readOnly);
  if (!cual) {
    return {
      tool: tool.name,
      actions: Object.fromEntries(
        Object.entries(acciones).map(([n, a]) => [n, `${a.summary}${a.required.length ? ` (${a.required.join(', ')})` : ''}${a.destructive ? ' [no se deshace]' : ''}`]),
      ),
      next: 'help con params.action da los parámetros y un ejemplo.',
    };
  }
  const a = acciones[cual];
  if (!a) return null;
  const linea = (n) => {
    const p = a.params[n];
    let s = p.type;
    if (p.enum) s += ` ∈ ${p.enum.join('|')}`;
    if (p.desc) s += ` — ${p.desc}`;
    return [n, s];
  };
  const out = { action: cual, summary: a.summary, call: `${a.method} ${a.path}` };
  if (a.purpose) out.purpose = a.purpose;
  if (a.permission) out.permission = a.permission;
  out.required = Object.fromEntries(a.required.map(linea));
  out.optional = Object.fromEntries(Object.keys(a.params).filter((n) => !a.required.includes(n)).map(linea));
  if (a.unavailable) out.unavailable = Object.fromEntries(Object.entries(a.unavailable).map(([k, q]) => [q.valores ? `${k}=${q.valores.join('|')}` : k, q.motivo]));
  out.example = { action: cual, params: a.example };
  if (a.destructive) out.confirm = pedirConfirmacion(a);
  return out;
}

// ---------- llamada a la API ----------

export async function llamarApi(ctx, metodo, ruta, { query, body } = {}) {
  if (!ctx.apiKey) {
    return {
      status: 0,
      body: {
        error: 'missing_api_key',
        message: ctx.http
          ? 'Falta la clave: manda Authorization: Bearer <clave> en cada pedido.'
          : 'Falta la clave: define FUNNELCHAT_API_KEY en la configuración del servidor MCP.',
      },
    };
  }
  const url = new URL(ctx.baseUrl + ruta);
  for (const [k, v] of query || []) url.searchParams.append(k, v);
  const headers = { Authorization: `Bearer ${ctx.apiKey}`, Accept: 'application/json', 'User-Agent': `funnelchat-mcp/${VERSION}` };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await ctx.fetch(url, {
      method: metodo,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(ESPERA_API_MS),
    });
  } catch (e) {
    const tiempo = e.name === 'TimeoutError';
    return {
      status: 0,
      body: {
        error: tiempo ? 'timeout' : 'network_error',
        message: tiempo
          ? `La API no respondió en ${ESPERA_API_MS / 1000} s. Si era un envío, busca su client_reference antes de repetirlo.`
          : `No se pudo llegar a ${ctx.baseUrl}: ${e.cause?.message || e.message}`,
      },
    };
  }
  const crudo = await res.text();
  let datos;
  try {
    datos = crudo ? JSON.parse(crudo) : null;
  } catch {
    datos = crudo;
  }
  const out = { status: res.status, ok: res.ok, body: datos, retryAfter: res.headers.get('retry-after') };
  const dep = res.headers.get('deprecation');
  const sunset = res.headers.get('sunset');
  if (dep || sunset) out.deprecation = { deprecation: dep, sunset, link: res.headers.get('link') };
  return out;
}

// Listas como nombre[] (Laravel) y booleanos como 1/0, que es lo que acepta la regla boolean.
function aQuery(nombre, valor, def) {
  const n = def?.brackets || Array.isArray(valor) ? `${nombre}[]` : nombre;
  if (Array.isArray(valor)) return valor.map((v) => [n, typeof v === 'boolean' ? (v ? '1' : '0') : typeof v === 'object' ? JSON.stringify(v) : String(v)]);
  if (typeof valor === 'boolean') return [[n, valor ? '1' : '0']];
  if (valor !== null && typeof valor === 'object') return [[n, JSON.stringify(valor)]];
  return [[n, String(valor)]];
}

// Los listados de Laravel traen links y meta.links que el modelo no usa: quedan la página y el total.
function compactar(b) {
  if (!b || typeof b !== 'object' || !Array.isArray(b.data) || !b.meta || typeof b.meta !== 'object') return b;
  const { links, meta, ...resto } = b;
  const pagina = {};
  for (const k of ['current_page', 'last_page', 'per_page', 'total', 'next_cursor']) if (meta[k] !== undefined) pagina[k] = meta[k];
  if (links?.next || meta.next_cursor) pagina.next = true;
  return { ...resto, meta: pagina };
}

// Una respuesta que no entra se recorta sin romper el JSON: de una lista quedan los primeros elementos.
export function recortar(cuerpo, max = MAX_RESPUESTA) {
  const t = texto(cuerpo);
  if (t.length <= max) return t;
  const lista = Array.isArray(cuerpo) ? cuerpo : Array.isArray(cuerpo?.data) ? cuerpo.data : null;
  if (lista) {
    const arma = (n) => {
      const parte = lista.slice(0, n);
      const aviso = { shown: n, of: lista.length, hint: 'Respuesta recortada: pide menos con perPage o con filtros.' };
      return Array.isArray(cuerpo) ? { data: parte, truncated: aviso } : { ...cuerpo, data: parte, truncated: aviso };
    };
    let n = lista.length;
    while (n > 0 && texto(arma(n)).length > max) n = Math.floor(n * 0.8);
    if (n > 0) return texto(arma(n));
  }
  return texto({
    truncated: { characters: t.length, hint: 'Respuesta recortada: pide menos con perPage o con filtros.' },
    preview: t.slice(0, max - 200),
  });
}

async function ejecutar(ctx, a, valores) {
  let ruta = a.path;
  const query = [];
  let body = a.body === 'object' ? {} : undefined;
  for (const [k, v] of Object.entries(valores)) {
    const def = a.params[k];
    if (def.in === 'path') ruta = ruta.replace(`{${k}}`, encodeURIComponent(String(v)));
    else if (def.in === 'query') query.push(...aQuery(k, v, def));
    else if (a.body === 'array' && k === 'items') body = v;
    else if (a.body === 'object') body[k] = v;
  }
  const r = await llamarApi(ctx, a.method, ruta, { query, body });
  if (!r.ok) {
    const det = r.body && typeof r.body === 'object' && !Array.isArray(r.body) ? r.body : { message: r.body };
    const out = { status: r.status, ...det };
    if (r.retryAfter) out.retry_after = Number(r.retryAfter);
    if (r.deprecation) out.deprecation = r.deprecation;
    return error(out);
  }
  let cuerpo = r.body === null || r.body === '' ? { status: r.status, ok: true } : compactar(r.body);
  if (r.deprecation) cuerpo = { ...(typeof cuerpo === 'object' && !Array.isArray(cuerpo) ? cuerpo : { data: cuerpo }), deprecation: r.deprecation };
  return ok(recortar(cuerpo));
}

// ---------- status ----------

const lista = (b) => (Array.isArray(b) ? b : Array.isArray(b?.data) ? b.data : []);
const cuerpoError = (r) => (r.body && typeof r.body === 'object' ? r.body : { message: r.body });

async function estado(ctx) {
  const servidor = { version: VERSION, spec: tabla.generado.spec_version, base_url: ctx.baseUrl, read_only: ctx.readOnly };
  const [me, dev, wh] = await Promise.all([
    llamarApi(ctx, 'GET', '/api/v1/me'),
    llamarApi(ctx, 'GET', '/api/v1/devices', { query: [['perPage', '100']] }),
    llamarApi(ctx, 'GET', '/api/v1/webhooks'),
  ]);
  const todas = [me, dev, wh];
  const sinApi = todas.find((r) => r.status === 0);
  if (sinApi) return error({ server: servidor, status: 0, ...cuerpoError(sinApi) });
  // Un 404 de ruta no es la clave: la URL base no apunta a la API.
  if (todas.every((r) => r.status === 404)) {
    return error({
      server: servidor,
      status: 404,
      ...cuerpoError(dev),
      next_step: `${ctx.baseUrl} no sirve la API (404 en /api/v1/devices). La URL base es solo el host, por ejemplo ${BASE_POR_DEFECTO} o http://127.0.0.1:4010 para el sandbox: revisa FUNNELCHAT_BASE_URL.`,
    });
  }
  const no401 = todas.find((r) => r.status === 401);
  if (no401) {
    return error({ server: servidor, status: 401, ...cuerpoError(no401), next_step: 'La clave no es válida o se revocó: crea otra en el panel (Desarrolladores).' });
  }

  const out = { server: servidor };
  if (me.ok) {
    const b = me.body && typeof me.body === 'object' ? me.body : {};
    const datos = b.data && typeof b.data === 'object' ? b.data : b;
    out.account = Object.fromEntries(
      Object.entries(datos)
        .filter(([, v]) => v === null || typeof v !== 'object')
        .slice(0, 8),
    );
  } else out.account = { status: me.status, error: me.body?.error };

  const numeros = lista(dev.body);
  const conectados = numeros.filter((d) => d.connected === 1 || d.connected === true);
  out.numbers = dev.ok
    ? {
        total: numeros.length,
        connected: conectados.length,
        list: numeros.slice(0, 10).map((d) => ({ id: d.id, alias: d.alias ?? null, number: d.number || null, connection: d.connection ?? null, connected: !!d.connected })),
      }
    : { status: dev.status, error: dev.body?.error };

  const subs = lista(wh.body);
  out.webhooks = wh.ok
    ? { total: subs.length, active: subs.filter((s) => s.status === 'active').length, events: [...new Set(subs.flatMap((s) => s.events || []))] }
    : { status: wh.status, error: wh.body?.error };

  if (dev.status === 403) out.next_step = 'La clave no tiene permiso para ver los números (Números de WhatsApp → Ver): revisa sus permisos en el panel.';
  else if (!dev.ok) out.next_step = `La API respondió ${dev.status} al pedir los números: ${dev.body?.message || dev.body?.error || 'sin detalle'}.`;
  else if (!numeros.length)
    out.next_step = ctx.readOnly
      ? 'La cuenta no tiene números: conéctalos desde el panel o con este MCP sin --read-only.'
      : 'Conecta un número: connect_links action=create con type qr (un link para ti o para tu cliente) o numbers action=create y su QR.';
  else if (!conectados.length) out.next_step = `Ningún número conectado: numbers action=get_qr params.device=${numeros[0].id} y escanéalo.`;
  else if (ctx.readOnly) out.next_step = 'Solo lectura: mira mensajes, contactos y conversaciones; para mandar, usa el MCP sin --read-only.';
  else if (wh.ok && !subs.length)
    out.next_step = 'Crea un webhook para saber qué pasa con tus mensajes: webhooks action=create con events message.received y message.status_changed.';
  else out.next_step = `Listo para mandar: messages action=send params.device_id=${conectados[0].id}, phone y text.`;
  return ok(out);
}

// ---------- servidor ----------

const esObjeto = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);

export function crearServidor({ apiKey, baseUrl = BASE_POR_DEFECTO, readOnly = false, http = false, fetch: f = globalThis.fetch } = {}) {
  const ctx = { apiKey, baseUrl, readOnly, http, fetch: f };
  const porNombre = Object.fromEntries(tabla.tools.map((t) => [t.name, t]));
  const defs = definiciones({ readOnly });
  const visibles = new Set(defs.map((d) => d.name));
  const server = new Server({ name: 'funnelchat', title: 'Funnelchat API', version: VERSION }, { capabilities: { tools: {} }, instructions: instrucciones({ readOnly }) });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: defs }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name } = req.params;
    const args = req.params.arguments ?? {};
    if (!visibles.has(name)) {
      return error({ error: 'unknown_tool', message: `No existe el tool ${name}${readOnly && porNombre[name] ? ' en el modo de solo lectura' : ''}.` });
    }
    if (name === 'status') return estado(ctx);
    if (name === 'search_docs') {
      if (typeof args.query !== 'string' || !args.query.trim()) return error({ error: 'invalid_params', message: 'Falta query (un texto).' });
      return ok(buscar(args.query, Math.min(Math.max(Number(args.limit) || 5, 1), 10)));
    }
    const tool = porNombre[name];
    const acciones = accionesVisibles(tool, readOnly);
    const listaAcciones = ['help', ...Object.keys(acciones)];

    const sobran = Object.keys(args).filter((k) => !['action', 'params', 'confirm'].includes(k));
    if (sobran.length) {
      return error({
        error: 'invalid_arguments',
        message: `${name} recibe solo action, params${tool && Object.values(acciones).some((a) => a.destructive) ? ' y confirm' : ''}: ${sobran.join(', ')} va dentro de params.`,
        example: { action: args.action ?? 'help', params: Object.fromEntries(sobran.map((k) => [k, args[k]])) },
      });
    }
    const accion = args.action;
    if (typeof accion !== 'string' || !accion) {
      return error({ error: 'missing_action', message: `Falta action. ${name} tiene: ${listaAcciones.join(', ')}.` });
    }

    let params = args.params ?? {};
    if (typeof params === 'string') {
      try {
        params = JSON.parse(params);
      } catch {
        return error({ error: 'invalid_params', message: 'params tiene que ser un objeto JSON, como {"device_id": "dev_…"}; llegó un texto que no es JSON.' });
      }
    }
    if (!esObjeto(params)) return error({ error: 'invalid_params', message: 'params tiene que ser un objeto, como {"device_id": "dev_…"}.' });

    if (accion === 'help') {
      const cual = params.action;
      if (cual === undefined) return ok(ayuda(tool, null, { readOnly }));
      const h = ayuda(tool, cual, { readOnly });
      if (h) return ok(h);
      const p = parecido(String(cual), Object.keys(acciones));
      return error({ error: 'unknown_action', message: `${name} no tiene la acción ${cual}.`, ...(p ? { did_you_mean: p } : {}), actions: Object.keys(acciones) });
    }
    const a = acciones[accion];
    if (!a) {
      const p = parecido(accion, Object.keys(acciones));
      const soloLectura = readOnly && tool.actions[accion];
      return error({
        error: soloLectura ? 'read_only' : 'unknown_action',
        message: soloLectura ? `${name}.${accion} cambia datos y este servidor es de solo lectura.` : `${name} no tiene la acción ${accion}.`,
        ...(p && !soloLectura ? { did_you_mean: p } : {}),
        actions: listaAcciones,
      });
    }

    const v = validarParams(a, params);
    if (v.error) return error({ ...v.error, help: ayuda(tool, accion, { readOnly }) });

    if (a.destructive && args.confirm !== true) {
      return error({
        error: 'confirmation_required',
        message: `No se llamó a ${name}.${accion} porque no se puede deshacer. ${a.destructive_reason} ${PREGUNTA}`,
        action: `${name}.${accion}`,
        params,
      });
    }
    return ejecutar(ctx, a, v.valores);
  });

  return server;
}
