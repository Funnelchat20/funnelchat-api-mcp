// Lo común de las pruebas unitarias: una API falsa (un fetch que anota cada pedido) y un cliente MCP real
// del SDK conectado en memoria. Nada sale de la máquina.

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { crearServidor } from '../src/servidor.mjs';

export const BASE = 'http://api.prueba.invalid';
export const CLAVE = '1|fc_live_prueba';

// responder(pedido) → { status, body, headers }; por defecto 200 con {data: []}.
export function apiFalsa(responder = () => ({ status: 200, body: { data: [] } })) {
  const pedidos = [];
  const fetch = async (url, init = {}) => {
    const u = new URL(url);
    const pedido = {
      method: init.method || 'GET',
      path: u.pathname,
      query: [...u.searchParams.entries()],
      headers: init.headers || {},
      body: init.body === undefined ? undefined : JSON.parse(init.body),
    };
    pedidos.push(pedido);
    const r = responder(pedido) || {};
    const status = r.status ?? 200;
    const cuerpo = r.body === undefined ? '' : typeof r.body === 'string' ? r.body : JSON.stringify(r.body);
    return new Response(status === 204 ? null : cuerpo, { status, headers: { 'Content-Type': 'application/json', ...(r.headers || {}) } });
  };
  return { fetch, pedidos };
}

export async function conectar(opciones = {}) {
  const api = opciones.api || apiFalsa();
  const server = crearServidor({ apiKey: CLAVE, baseUrl: BASE, fetch: api.fetch, ...opciones });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  const client = new Client({ name: 'prueba', version: '0' });
  await client.connect(b);
  const llamar = async (name, args = {}) => {
    const r = await client.callTool({ name, arguments: args });
    const txt = r.content?.[0]?.text ?? '';
    let datos;
    try {
      datos = JSON.parse(txt);
    } catch {
      datos = txt;
    }
    return { isError: !!r.isError, datos, txt };
  };
  return { client, llamar, api };
}
