#!/usr/bin/env node
// funnelchat-api-mcp            → stdio, con la clave de FUNNELCHAT_API_KEY
// funnelchat-api-mcp --http     → HTTP en /mcp (puerto 3333 o --port); la clave llega en
//                                 Authorization: Bearer o X-API-Key de cada pedido
// FUNNELCHAT_API_URL cambia la URL base (por ejemplo, el sandbox: http://localhost:4010).

import { createServer } from 'node:http';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { crearServidor } from './servidor.mjs';

const arg = (n, d) => {
  const i = process.argv.indexOf(n);
  return i > -1 ? process.argv[i + 1] : d;
};
const baseUrl = process.env.FUNNELCHAT_API_URL || 'https://api.funnelchat.com';

if (!process.argv.includes('--http')) {
  const server = crearServidor({ apiKey: process.env.FUNNELCHAT_API_KEY, baseUrl });
  await server.connect(new StdioServerTransport());
} else {
  const puerto = Number(arg('--port', process.env.PORT || 3333));
  const host = arg('--host', '127.0.0.1');
  const http = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' }).end('{"ok":true}');
      return;
    }
    if (url.pathname !== '/mcp') {
      res.writeHead(404).end();
      return;
    }
    if (req.method !== 'POST') {
      res.writeHead(405, { Allow: 'POST' }).end();
      return;
    }
    const auth = req.headers.authorization || '';
    const apiKey = auth.match(/^Bearer\s+(.+)$/i)?.[1] || req.headers['x-api-key'] || process.env.FUNNELCHAT_API_KEY;
    let cuerpo = '';
    for await (const trozo of req) cuerpo += trozo;
    let json;
    try {
      json = JSON.parse(cuerpo);
    } catch {
      res.writeHead(400, { 'Content-Type': 'application/json' }).end('{"error":"invalid_json"}');
      return;
    }
    // Sin sesión: un servidor por pedido, con la clave de ese pedido.
    const server = crearServidor({ apiKey, baseUrl });
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on('close', () => {
      transport.close();
      server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, json);
  });
  http.listen(puerto, host, () => console.error(`funnelchat-api-mcp en http://${host}:${puerto}/mcp → ${baseUrl}`));
}
