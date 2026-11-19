#!/usr/bin/env node
// Mide lo que el modelo carga al conectar: las definiciones de los tools (tools/list) y las instrucciones,
// en caracteres y en tokens aproximados (caracteres / 4), con todo y en el modo --read-only.
//
//   node scripts/medir.mjs            la medida
//   node scripts/medir.mjs --json     lo mismo en JSON

import { definiciones, instrucciones, tabla } from '../src/servidor.mjs';

const medir = (readOnly) => {
  const defs = definiciones({ readOnly });
  const texto = JSON.stringify(defs);
  return {
    tools: defs.length,
    acciones: defs.reduce((n, d) => n + Math.max((d.inputSchema.properties?.action?.enum?.length ?? 1) - 1, 0), 0),
    caracteres: texto.length,
    tokens_aprox: Math.round(texto.length / 4),
    instrucciones_tokens_aprox: Math.round(instrucciones({ readOnly }).length / 4),
    mayores: defs
      .map((d) => [d.name, JSON.stringify(d).length])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([n, c]) => `${n} ~${Math.round(c / 4)}`),
  };
};

const medida = { operaciones_api: tabla.generado.operaciones, todo: medir(false), solo_lectura: medir(true) };
if (process.argv.includes('--json')) console.log(JSON.stringify(medida, null, 2));
else {
  for (const [k, m] of Object.entries({ todo: medida.todo, 'solo lectura': medida.solo_lectura })) {
    console.log(`${k}: ${m.tools} tools, ${m.acciones} acciones, ~${m.tokens_aprox} tokens (+${m.instrucciones_tokens_aprox} de instrucciones); los mayores: ${m.mayores.join(', ')}`);
  }
}
