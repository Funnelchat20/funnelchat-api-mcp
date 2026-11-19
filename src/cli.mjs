#!/usr/bin/env node
// funnelchat-mcp: el MCP de la API pública de Funnelchat.
//
//   funnelchat-mcp                 stdio, con la clave de FUNNELCHAT_API_KEY
//   funnelchat-mcp --http          HTTP en POST /mcp; la clave llega en cada pedido
//   funnelchat-mcp --read-only     solo las lecturas, en cualquiera de los dos

import { parseArgs } from 'node:util';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { baseDelEntorno } from './base.mjs';
import { iniciarHttp } from './http.mjs';
import { crearServidor, VERSION } from './servidor.mjs';

const AYUDA = `funnelchat-mcp ${VERSION}: el MCP de la API de Funnelchat

Uso:
  funnelchat-mcp [opciones]           por stdio (Claude Code, Cursor y otros clientes MCP)
  funnelchat-mcp --http [opciones]    por HTTP, en POST /mcp

Opciones:
  --read-only               Solo lecturas: no crea, no cambia ni borra nada.
  --base-url <url>          El host de la API (por defecto https://api.funnelchat.com;
                            el sandbox: http://127.0.0.1:4010). También FUNNELCHAT_BASE_URL.
  --http                    Por HTTP en vez de stdio.
  --host <host>             Dónde escucha en HTTP (por defecto 127.0.0.1).
  --port <n>                El puerto en HTTP (por defecto 3333, o PORT).
  --allowed-hosts <a,b>     Los Host que acepta en HTTP (por defecto, los locales con el puerto).
                            Obligatorio si --host no es local. También MCP_ALLOWED_HOSTS.
  --allowed-origins <a,b>   Los Origin que acepta en HTTP (por defecto, los de esos hosts).
                            También MCP_ALLOWED_ORIGINS.
  -v, --version             La versión.
  -h, --help                Esta ayuda.

La clave:
  stdio: FUNNELCHAT_API_KEY.
  HTTP:  Authorization: Bearer <clave> (o X-API-Key) en cada pedido; sin clave responde 401.
`;

const lista = (x) =>
  (x || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

let op;
try {
  op = parseArgs({
    options: {
      http: { type: 'boolean' },
      'read-only': { type: 'boolean' },
      'base-url': { type: 'string' },
      host: { type: 'string' },
      port: { type: 'string' },
      'allowed-hosts': { type: 'string' },
      'allowed-origins': { type: 'string' },
      version: { type: 'boolean', short: 'v' },
      help: { type: 'boolean', short: 'h' },
    },
  }).values;
} catch (e) {
  console.error(`${e.message}\n\n${AYUDA}`);
  process.exit(2);
}

if (op.help) {
  process.stdout.write(AYUDA);
  process.exit(0);
}
if (op.version) {
  process.stdout.write(`${VERSION}\n`);
  process.exit(0);
}

let baseUrl;
try {
  baseUrl = baseDelEntorno(process.env, op['base-url']);
} catch (e) {
  console.error(e.message);
  process.exit(2);
}
const readOnly = !!op['read-only'];

if (!op.http) {
  const server = crearServidor({ apiKey: process.env.FUNNELCHAT_API_KEY?.trim() || undefined, baseUrl, readOnly });
  await server.connect(new StdioServerTransport());
} else {
  if (process.env.FUNNELCHAT_API_KEY) {
    console.error('Aviso: en modo HTTP no se usa FUNNELCHAT_API_KEY; cada pedido trae su clave en Authorization.');
  }
  const port = Number(op.port ?? process.env.PORT ?? 3333);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    console.error(`--port no es un puerto: ${op.port ?? process.env.PORT}`);
    process.exit(2);
  }
  try {
    const { url, allowedHosts, allowedOrigins } = await iniciarHttp({
      host: op.host || '127.0.0.1',
      port,
      baseUrl,
      readOnly,
      allowedHosts: lista(op['allowed-hosts'] ?? process.env.MCP_ALLOWED_HOSTS),
      allowedOrigins: lista(op['allowed-origins'] ?? process.env.MCP_ALLOWED_ORIGINS),
    });
    console.error(`funnelchat-mcp ${VERSION} en ${url} → ${baseUrl}${readOnly ? ' (solo lectura)' : ''}`);
    console.error(`  Host aceptados: ${allowedHosts.join(', ')}; Origin aceptados: ${allowedOrigins.join(', ')}`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
