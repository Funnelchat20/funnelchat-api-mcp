#!/usr/bin/env node
// Escribe ../defs-api.json: las definiciones de tools tal como las ve un cliente MCP
// ({name, description, inputSchema}), y mide tools, acciones y tokens (caracteres / 4).

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { definiciones, INSTRUCCIONES, tabla } from '../src/servidor.mjs';

const salida = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'defs-api.json');
const defs = definiciones();
const texto = JSON.stringify(defs);
writeFileSync(salida, `${JSON.stringify(defs, null, 2)}\n`);

const acciones = tabla.tools.reduce((n, t) => n + Object.keys(t.actions).length, 0);
const medida = {
  tools: defs.length,
  acciones: acciones,
  operaciones_api: tabla.generado.operaciones,
  caracteres: texto.length,
  tokens_aprox: Math.round(texto.length / 4),
  instrucciones_tokens_aprox: Math.round(INSTRUCCIONES.length / 4),
  mayor_tool: defs
    .map((d) => [d.name, JSON.stringify(d).length])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([n, c]) => `${n} ${Math.round(c / 4)} tokens`),
};
console.log(JSON.stringify(medida, null, 2));
console.log(`escrito ${salida}`);
