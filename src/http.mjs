// Modo HTTP: el MCP en POST /mcp, sin sesión (un servidor por pedido), para hospedarlo o para clientes
// que solo hablan HTTP. La clave llega en cada pedido (Authorization: Bearer o X-API-Key): sin clave
// responde 401 y nunca usa FUNNELCHAT_API_KEY del entorno. Por defecto escucha solo en 127.0.0.1, y
// valida Host y Origin (protección contra DNS rebinding) con allowedHosts y allowedOrigins.

import { createServer } from 'node:http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { crearServidor, VERSION } from './servidor.mjs';

const MAX_CUERPO = 1024 * 1024;
const LOCALES = new Set(['127.0.0.1', 'localhost', '::1', '[::1]']);
export const esLocal = (host) => LOCALES.has(host);

const json = (res, status, cuerpo, extra = {}) => res.writeHead(status, { 'Content-Type': 'application/json', ...extra }).end(JSON.stringify(cuerpo));

// Los Host que valen por defecto: los nombres locales con el puerto en que escucha.
export function hostsPorDefecto(host, puerto) {
  const nombres = esLocal(host) ? ['127.0.0.1', 'localhost', '[::1]'] : [host];
  return nombres.map((h) => `${h}:${puerto}`);
}

export function claveDelPedido(req) {
  const auth = req.headers.authorization || '';
  const bearer = auth.match(/^Bearer\s+(\S.*)$/i)?.[1]?.trim();
  const xkey = typeof req.headers['x-api-key'] === 'string' ? req.headers['x-api-key'].trim() : '';
  return bearer || xkey || null;
}

// Arranca el servidor HTTP. Devuelve { server, url, allowedHosts, allowedOrigins } cuando ya escucha.
export function iniciarHttp({ host = '127.0.0.1', port = 3333, baseUrl, readOnly = false, allowedHosts, allowedOrigins, fetch } = {}) {
  if (!esLocal(host) && !allowedHosts?.length) {
    throw new Error(
      `Escuchar en ${host} necesita --allowed-hosts con el nombre con que te llegan los pedidos (por ejemplo mcp.tu-dominio.com): ` +
        'sin esa lista, cualquier página podría usar el servidor por DNS rebinding.',
    );
  }
  const opciones = { hosts: allowedHosts?.length ? allowedHosts : null, origins: allowedOrigins?.length ? allowedOrigins : null };

  const server = createServer(async (req, res) => {
    const ruta = new URL(req.url, 'http://x').pathname;
    if (ruta === '/health' && req.method === 'GET') return json(res, 200, { ok: true, version: VERSION, read_only: readOnly });
    if (ruta !== '/mcp') return json(res, 404, { error: 'not_found', message: 'El MCP está en POST /mcp.' });
    if (req.method !== 'POST') return json(res, 405, { error: 'method_not_allowed', message: 'Sin sesión: solo POST /mcp.' }, { Allow: 'POST' });

    const apiKey = claveDelPedido(req);
    if (!apiKey) {
      return json(
        res,
        401,
        { error: 'unauthenticated', message: 'Falta la clave de la API de Funnelchat: mándala en Authorization: Bearer <clave>.' },
        { 'WWW-Authenticate': 'Bearer realm="funnelchat"' },
      );
    }

    let cuerpo = '';
    let tam = 0;
    for await (const trozo of req) {
      tam += trozo.length;
      if (tam > MAX_CUERPO) return json(res, 413, { error: 'payload_too_large', message: 'El pedido pasa de 1 MB.' });
      cuerpo += trozo;
    }
    let mensaje;
    try {
      mensaje = JSON.parse(cuerpo);
    } catch {
      return json(res, 400, { jsonrpc: '2.0', error: { code: -32700, message: 'El cuerpo no es JSON.' }, id: null });
    }

    const mcp = crearServidor({ apiKey, baseUrl, readOnly, http: true, fetch });
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
      enableDnsRebindingProtection: true,
      allowedHosts: opciones.hosts,
      allowedOrigins: opciones.origins,
    });
    res.on('close', () => {
      transport.close();
      mcp.close();
    });
    await mcp.connect(transport);
    await transport.handleRequest(req, res, mensaje);
  });

  return new Promise((resolver, rechazar) => {
    server.once('error', rechazar);
    server.listen(port, host, () => {
      const puerto = server.address().port;
      if (!opciones.hosts) opciones.hosts = hostsPorDefecto(host, puerto);
      if (!opciones.origins) opciones.origins = opciones.hosts.map((h) => `${esLocal(h.replace(/:\d+$/, '')) ? 'http' : 'https'}://${h}`);
      const h = host.includes(':') && !host.startsWith('[') ? `[${host}]` : host;
      resolver({ server, url: `http://${h}:${puerto}/mcp`, allowedHosts: opciones.hosts, allowedOrigins: opciones.origins });
    });
  });
}
