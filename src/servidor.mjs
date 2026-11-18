// MCP de la API pública de Funnelchat: un tool por recurso, cada uno con `action` y `params`.
// Cada acción es una llamada a la API con la clave del usuario: los permisos, los límites y los
// errores son los de la API.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { buscar } from './docs.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
export const tabla = JSON.parse(readFileSync(join(raiz, 'generated/tabla.json'), 'utf8'));
export const VERSION = '0.1.0';
const MAX_RESPUESTA = 30000;

export const INSTRUCCIONES =
  'Opera la API de Funnelchat con tu clave. Empieza con status. ' +
  'En cada tool, action=help lista las acciones; con params.action da sus parámetros y un ejemplo. ' +
  'Lo que no se deshace pide confirm: true.';

// ---------- definiciones ----------

export function definiciones() {
  const recursos = tabla.tools.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['help', ...Object.keys(t.actions)] },
        params: { type: 'object', description: 'Parámetros de la acción (ver help).' },
        confirm: { type: 'boolean', description: 'true para lo que no se deshace.' },
      },
      required: ['action'],
    },
  }));
  return [
    {
      name: 'status',
      description: 'Qué tiene la cuenta: números conectados, webhooks y el siguiente paso.',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'search_docs',
      description: 'Busca en la documentación de la API (llms.txt y textos /ia/).',
      inputSchema: {
        type: 'object',
        properties: { query: { type: 'string' }, limit: { type: 'integer', minimum: 1, maximum: 10 } },
        required: ['query'],
      },
    },
    ...recursos,
  ];
}

// ---------- resultados ----------

const texto = (obj) => (typeof obj === 'string' ? obj : JSON.stringify(obj));
const ok = (obj) => ({ content: [{ type: 'text', text: texto(obj) }] });
const error = (obj) => ({ isError: true, content: [{ type: 'text', text: texto(obj) }] });

// ---------- help ----------

function ayuda(tool, cual) {
  if (!cual) {
    return {
      tool: tool.name,
      actions: Object.fromEntries(
        Object.entries(tool.actions).map(([n, a]) => [
          n,
          `${a.summary}${a.required.length ? ` (${a.required.join(', ')})` : ''}${a.confirm ? ' [confirm]' : ''}`,
        ]),
      ),
      next: 'help con params.action da los parámetros y un ejemplo.',
    };
  }
  const a = tool.actions[cual];
  if (!a) return null;
  const linea = (n) => {
    const p = a.params[n];
    let s = p.type;
    if (p.enum) s += ` ∈ ${p.enum.join('|')}`;
    if (p.desc) s += ` — ${p.desc}`;
    return [n, s];
  };
  const opcionales = Object.keys(a.params).filter((n) => !a.required.includes(n));
  const out = {
    action: cual,
    summary: a.summary,
    call: `${a.method} ${a.path}`,
  };
  if (a.purpose) out.purpose = a.purpose;
  if (a.permission) out.permission = a.permission;
  out.required = Object.fromEntries(a.required.map(linea));
  out.optional = Object.fromEntries(opcionales.map(linea));
  out.example = { action: cual, params: a.example, ...(a.confirm ? { confirm: true } : {}) };
  if (a.confirm) out.confirm = 'No se deshace: pide confirm: true.';
  return out;
}

// ---------- llamada a la API ----------

async function llamarApi(ctx, metodo, ruta, { query, body } = {}) {
  if (!ctx.apiKey) {
    return {
      status: 0,
      body: { error: 'missing_api_key', message: 'Define FUNNELCHAT_API_KEY (o manda Authorization: Bearer en HTTP).' },
    };
  }
  const url = new URL(ctx.baseUrl.replace(/\/$/, '') + ruta);
  for (const [k, v] of query || []) url.searchParams.append(k, v);
  const headers = {
    Authorization: `Bearer ${ctx.apiKey}`,
    Accept: 'application/json',
    'User-Agent': `funnelchat-api-mcp/${VERSION}`,
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(url, { method: metodo, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch (e) {
    return { status: 0, body: { error: 'network_error', message: String(e.cause?.message || e.message) } };
  }
  const crudo = await res.text();
  let datos;
  try {
    datos = crudo ? JSON.parse(crudo) : null;
  } catch {
    datos = crudo;
  }
  const retry = res.headers.get('retry-after');
  return { status: res.status, ok: res.ok, body: datos, retryAfter: retry };
}

// Listas como nombre[] (Laravel) y booleanos como 1/0, que es lo que acepta la regla boolean.
function aQuery(nombre, valor) {
  if (Array.isArray(valor)) return valor.map((v) => [`${nombre}[]`, String(v)]);
  if (typeof valor === 'boolean') return [[nombre, valor ? '1' : '0']];
  if (valor !== null && typeof valor === 'object') return [[nombre, JSON.stringify(valor)]];
  return [[nombre, String(valor)]];
}

async function ejecutar(ctx, tool, nombre, params) {
  const a = tool.actions[nombre];
  let ruta = a.path;
  const faltan = [];
  for (const m of a.path.matchAll(/\{([^}]+)\}/g)) {
    const v = params[m[1]];
    if (v === undefined || v === null || v === '') faltan.push(m[1]);
    else ruta = ruta.replace(m[0], encodeURIComponent(String(v)));
  }
  if (faltan.length) {
    return error({
      error: 'missing_params',
      message: `Falta ${faltan.join(', ')}.`,
      next: `${tool.name} action=help params.action=${nombre}`,
    });
  }
  const query = [];
  let body;
  const conCuerpo = a.body !== null;
  if (a.body === 'array') body = params.items;
  else if (a.body === 'object') body = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    const def = a.params[k];
    if (def?.in === 'path') continue;
    if (a.body === 'array' && k === 'items') continue;
    if (def?.in === 'query' || (!def && !conCuerpo)) query.push(...aQuery(k, v));
    else if (a.body === 'object') body[k] = v;
  }
  const r = await llamarApi(ctx, a.method, ruta, { query, body });
  if (!r.ok) {
    const det = r.body && typeof r.body === 'object' ? r.body : { message: r.body };
    const out = { status: r.status, ...det };
    if (r.retryAfter) out.retry_after = Number(r.retryAfter);
    return error(out);
  }
  if (r.body === null || r.body === '') return ok({ status: r.status, ok: true });
  let t = texto(compactar(r.body));
  if (t.length > MAX_RESPUESTA) {
    t = `${t.slice(0, MAX_RESPUESTA)}… [recortado: ${t.length} caracteres; pide menos con perPage o filtros]`;
  }
  return ok(t);
}

// Los listados de Laravel traen links y meta.links que el modelo no usa: quedan la página y el total.
function compactar(b) {
  if (!b || typeof b !== 'object' || !Array.isArray(b.data) || !b.meta || typeof b.meta !== 'object') return b;
  const { links, meta, ...resto } = b;
  const m = meta;
  const pagina = {};
  for (const k of ['current_page', 'last_page', 'per_page', 'total', 'next_cursor']) if (m[k] !== undefined) pagina[k] = m[k];
  if (links?.next || m.next_cursor) pagina.next = true;
  return { ...resto, meta: pagina };
}

// ---------- status ----------

const lista = (b) => (Array.isArray(b) ? b : Array.isArray(b?.data) ? b.data : []);

async function estado(ctx) {
  const [me, dev, wh] = await Promise.all([
    llamarApi(ctx, 'GET', '/api/v1/me'),
    llamarApi(ctx, 'GET', '/api/v1/devices', { query: [['perPage', '100']] }),
    llamarApi(ctx, 'GET', '/api/v1/webhooks'),
  ]);
  const fallo = [me, dev, wh].find((r) => r.status === 401 || r.status === 0);
  if (fallo) return error({ status: fallo.status, ...(typeof fallo.body === 'object' ? fallo.body : { message: fallo.body }) });

  const out = {};
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
        list: numeros.slice(0, 10).map((d) => ({
          id: d.id,
          alias: d.alias ?? null,
          number: d.number || null,
          connection: d.connection ?? null,
          connected: !!d.connected,
        })),
      }
    : { status: dev.status, error: dev.body?.error };

  const subs = lista(wh.body);
  out.webhooks = wh.ok
    ? {
        total: subs.length,
        active: subs.filter((s) => s.status === 'active').length,
        events: [...new Set(subs.flatMap((s) => s.events || []))],
      }
    : { status: wh.status, error: wh.body?.error };

  if (!dev.ok) out.next_step = 'Tu clave no puede ver los números: revisa sus permisos en el panel.';
  else if (!numeros.length)
    out.next_step = 'Conecta un número: connect_links action=create (link para tu cliente) o numbers action=create (QR).';
  else if (!conectados.length)
    out.next_step = `Ningún número conectado: numbers action=get_qr params.device=${numeros[0].id} y escanéalo.`;
  else if (wh.ok && !subs.length)
    out.next_step =
      'Crea un webhook para saber qué pasa con tus mensajes: webhooks action=create con events message.received y message.status_changed.';
  else out.next_step = `Listo para mandar: messages action=send params.device_id=${conectados[0].id}, phone y text.`;
  return ok(out);
}

// ---------- servidor ----------

export function crearServidor({ apiKey, baseUrl }) {
  const ctx = { apiKey, baseUrl: baseUrl || 'https://api.funnelchat.com' };
  const porNombre = Object.fromEntries(tabla.tools.map((t) => [t.name, t]));
  const server = new Server(
    { name: 'funnelchat-api', version: VERSION },
    { capabilities: { tools: {} }, instructions: INSTRUCCIONES },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: definiciones() }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args = {} } = req.params;
    if (name === 'status') return estado(ctx);
    if (name === 'search_docs') {
      if (!args.query) return error({ error: 'missing_params', message: 'Falta query.' });
      return ok(buscar(String(args.query), Math.min(Number(args.limit) || 5, 10)));
    }
    const tool = porNombre[name];
    if (!tool) return error({ error: 'unknown_tool', message: `No existe el tool ${name}.` });
    const accion = args.action;
    const params = args.params && typeof args.params === 'object' ? { ...args.params } : {};
    const confirmado = args.confirm === true || params.confirm === true;
    delete params.confirm;
    if (accion === 'help') {
      const h = ayuda(tool, params.action);
      return h ? ok(h) : error({ error: 'unknown_action', message: `${name} no tiene ${params.action}.`, actions: Object.keys(tool.actions) });
    }
    const a = tool.actions[accion];
    if (!a) {
      return error({ error: 'unknown_action', message: `${name} no tiene ${accion}.`, actions: ['help', ...Object.keys(tool.actions)] });
    }
    if (a.confirm && !confirmado) {
      return error({
        error: 'confirmation_required',
        message: `«${a.summary}» no se deshace. Repite la llamada con confirm: true.`,
      });
    }
    return ejecutar(ctx, tool, accion, params);
  });

  return server;
}
