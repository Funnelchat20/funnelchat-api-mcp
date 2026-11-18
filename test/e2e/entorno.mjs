// Lo común de las pruebas contra el sandbox local de Funnelchat (@funnelchat-hq/sandbox).
// Nunca apuntan a producción ni a staging: SANDBOX_URL tiene que ser local, y la clave es inventada.

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { crearServidor } from '../../src/servidor.mjs';

export const SANDBOX = (process.env.SANDBOX_URL || '').replace(/\/+$/, '');
export const CLAVE = '1|fc_live_prueba';
export const SIN_SANDBOX = SANDBOX ? false : 'falta SANDBOX_URL (por ejemplo http://127.0.0.1:4010): npx @funnelchat-hq/sandbox';
if (SANDBOX && !/^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(SANDBOX)) {
  throw new Error(`SANDBOX_URL tiene que ser un sandbox local, no ${SANDBOX}`);
}

// Los ids que el sandbox trae al empezar (su README, «What is inside»).
export const SEMILLA = {
  qr: 'dev_Sandbox0QR0000000000000',
  oficial: 'dev_Sandbox0Oficial00000000',
  contacto: 'ctc_Sandbox0Contacto0000000',
  telefono: '5491100000000',
  etiqueta: 'tag_Sandbox0Cliente00000000',
  plantilla: 'tpl_Sandbox0Bienvenida00000',
  grupo: 'grp_Sandbox0Grupo0000000000',
  grupoUid: '120363000000000000@g.us',
  grupoVip: '120363000000000001@g.us',
};

export async function sandbox(ruta, { method = 'GET', body } = {}) {
  const r = await fetch(`${SANDBOX}${ruta}`, {
    method,
    headers: { Authorization: `Bearer ${CLAVE}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const t = await r.text();
  return { status: r.status, body: t ? JSON.parse(t) : null };
}

export const reiniciar = () => sandbox('/_sandbox/reset', { method: 'POST' });

// Un cliente MCP real (el del SDK) conectado en memoria a un servidor que apunta al sandbox.
export async function clienteEnMemoria(opciones = {}) {
  const server = crearServidor({ apiKey: CLAVE, baseUrl: SANDBOX, ...opciones });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  const client = new Client({ name: 'prueba', version: '0' });
  await client.connect(b);
  return client;
}

export async function llamar(client, name, args) {
  const r = await client.callTool({ name, arguments: args });
  const txt = r.content?.[0]?.text ?? '';
  let datos;
  try {
    datos = JSON.parse(txt);
  } catch {
    datos = txt;
  }
  return { isError: !!r.isError, datos, txt };
}

export const espera = (ms) => new Promise((r) => setTimeout(r, ms));
