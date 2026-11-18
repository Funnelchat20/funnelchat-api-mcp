#!/usr/bin/env node
// Prueba el paquete como lo recibe quien lo instala: npm pack, revisa qué lleva, lo instala en un
// proyecto vacío y lo corre con npx, por stdio, con un cliente MCP real. No llama a la API: lista los
// tools, pide un help y busca en la doc, con una URL base local y una clave inventada.
//
//   node scripts/probar-paquete.mjs [--dejar]     --dejar no borra las carpetas de la prueba

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const RAIZ = resolve(fileURLToPath(import.meta.url), '../..');
const pkg = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf8'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const correr = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const carpetas = [];
const nueva = (nombre) => {
  const d = mkdtempSync(join(tmpdir(), `fc-mcp-${nombre}-`));
  carpetas.push(d);
  return d;
};
const fallar = (m) => {
  console.error(`MAL: ${m}`);
  process.exitCode = 1;
};

// 1. npm pack: qué lleva y cuánto pesa.
const destino = nueva('pack');
const [info] = JSON.parse(correr(npm, ['pack', '--json', '--pack-destination', destino], RAIZ));
const tarball = join(destino, info.filename);
const archivos = info.files.map((f) => f.path);
console.log(`npm pack: ${info.filename}, ${archivos.length} archivos, ${(info.size / 1024).toFixed(0)} KB (${(info.unpackedSize / 1024).toFixed(0)} KB sin comprimir)`);
const sobran = archivos.filter((f) => /^(test|scripts|spec\/funnelchat\.json|diseno\.json|\.github)/.test(f));
if (sobran.length) fallar(`el paquete lleva lo que no hace falta: ${sobran.join(', ')}`);
for (const f of ['package.json', 'README.md', 'LICENSE', 'src/cli.mjs', 'generated/tabla.json', 'docs/indice.json']) {
  if (!archivos.includes(f)) fallar(`al paquete le falta ${f}`);
}

// 2. Instalarlo en un proyecto vacío.
const proyecto = nueva('proyecto');
writeFileSync(join(proyecto, 'package.json'), JSON.stringify({ name: 'prueba-mcp', private: true }));
correr(npm, ['install', '--no-audit', '--no-fund', tarball], proyecto);
const version = correr(npx, ['--no-install', 'funnelchat-mcp', '--version'], proyecto).trim();
if (version !== pkg.version) fallar(`npx funnelchat-mcp --version dice ${version}, no ${pkg.version}`);
else console.log(`npx funnelchat-mcp --version: ${version}`);
console.log(`npm audit del proyecto: ${correr(npm, ['audit', '--omit=dev'], proyecto).trim().split('\n').at(-1)}`);

// 3. Correrlo con npx por stdio, como lo corre Claude Code, y también con npx -y <tarball> en otra carpeta.
async function probar(args, cwd, como) {
  const client = new Client({ name: 'probar-paquete', version: '0' });
  const env = { ...process.env, FUNNELCHAT_BASE_URL: 'http://127.0.0.1:9', FUNNELCHAT_API_KEY: '1|fc_live_prueba' };
  await client.connect(new StdioClientTransport({ command: npx, args, cwd, env, stderr: 'pipe' }));
  const { tools } = await client.listTools();
  const help = await client.callTool({ name: 'messages', arguments: { action: 'help', params: { action: 'send' } } });
  const docs = await client.callTool({ name: 'search_docs', arguments: { query: 'mandar un texto' } });
  await client.close();
  const okHelp = !help.isError && JSON.parse(help.content[0].text).required?.device_id;
  const okDocs = JSON.parse(docs.content[0].text).results?.length > 0;
  if (tools.length !== 20 || !okHelp || !okDocs) fallar(`${como}: ${tools.length} tools, help ${!!okHelp}, docs ${okDocs}`);
  else console.log(`${como}: 20 tools, help y search_docs responden`);
}
await probar(['--no-install', 'funnelchat-mcp'], proyecto, 'npx funnelchat-mcp (instalado)');
await probar(['-y', `--package=${tarball}`, 'funnelchat-mcp'], nueva('vacia'), 'npx -y --package=<tarball> funnelchat-mcp (carpeta vacía)');

if (!process.argv.includes('--dejar')) for (const d of carpetas) rmSync(d, { recursive: true, force: true });
else console.log(`carpetas: ${carpetas.join(' ')}`);
if (!process.exitCode) console.log('el paquete se instala y corre con npx');
