// search_docs: busca en docs/indice.json, las secciones de los textos para IA del portal
// (llms.txt, llms-full.txt y /ia/), que arma scripts/docs.mjs. Puntúa por términos, con más peso
// en el título y en las secciones cortas.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ARCHIVO = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'indice.json');
const VACIAS = new Set('que con para por los las del una uno como cuando donde esta este eso sus tus the and api funnelchat'.split(' '));

const normal = (t) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

let indice;
function cargar() {
  if (indice) return indice;
  const { portal, secciones } = JSON.parse(readFileSync(ARCHIVO, 'utf8'));
  indice = secciones.map((s) => ({ ...s, url: `${portal}${s.u}`, n: normal(`${s.s}\n${s.c}`), t: normal(`${s.d} ${s.s}`) }));
  return indice;
}

function fragmento(cuerpo, terminos) {
  const n = normal(cuerpo);
  let i = -1;
  for (const t of terminos) {
    i = n.indexOf(t);
    if (i > -1) break;
  }
  const desde = Math.max(0, i - 150);
  const s = cuerpo.slice(desde, desde + 600).replace(/\s+/g, ' ').trim();
  return (desde > 0 ? '…' : '') + s + (desde + 600 < cuerpo.length ? '…' : '');
}

export function buscar(consulta, limite = 5) {
  const terminos = [...new Set(normal(consulta).split(/[^a-z0-9_./-]+/).filter((t) => t.length > 2 && !VACIAS.has(t)))];
  if (!terminos.length) return { query: consulta, results: [] };
  const res = [];
  for (const s of cargar()) {
    let puntos = 0;
    let presentes = 0;
    for (const t of terminos) {
      const enTitulo = s.t.split(t).length - 1;
      const enCuerpo = Math.min(s.n.split(t).length - 1, 8);
      if (enTitulo || enCuerpo) presentes++;
      puntos += enTitulo * 6 + enCuerpo;
    }
    if (!presentes) continue;
    puntos *= presentes / terminos.length;
    puntos /= Math.log10(s.c.length + 100);
    res.push([puntos, s]);
  }
  res.sort((a, b) => b[0] - a[0]);
  return {
    query: consulta,
    results: res.slice(0, limite).map(([, s]) => ({ title: s.s ? `${s.d} › ${s.s}` : s.d, url: s.url, snippet: fragmento(s.c, terminos) })),
  };
}
