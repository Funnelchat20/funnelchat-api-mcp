// search_docs: busca en una copia local de llms.txt y de los textos /ia/ del portal.
// Parte cada archivo en secciones por título, quita las repetidas y puntúa por términos.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs');
const PORTAL = 'https://developers-portal.funnelchat.app';
const VACIAS = new Set(
  'que con para por los las del una uno como cuando donde esta este eso sus tus the and api funnelchat'.split(' '),
);

const normal = (t) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

function archivos(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? archivos(p) : p.endsWith('.md') || p.endsWith('.txt') ? [p] : [];
  });
}

let indice;
function cargar() {
  if (indice) return indice;
  indice = [];
  const vistas = new Set();
  // llms-full.txt repite lo de /ia/: va al final para que gane la sección del tema.
  const lista = archivos(raiz).sort((a, b) => (a.endsWith('llms-full.txt') ? 1 : 0) - (b.endsWith('llms-full.txt') ? 1 : 0));
  for (const f of lista) {
    const rel = relative(raiz, f).replace(/\\/g, '/');
    const url = `${PORTAL}/${rel}`;
    const lineas = readFileSync(f, 'utf8').split('\n');
    const titulo = (lineas.find((l) => l.startsWith('# ')) || rel).replace(/^# /, '').replace(/ — API de Funnelchat.*$/, '');
    let sec = { titulo: '', cuerpo: [] };
    const cerrar = () => {
      const cuerpo = sec.cuerpo.join('\n').trim();
      if (cuerpo.length < 40) return;
      const clave = normal(cuerpo.slice(0, 300));
      if (vistas.has(clave)) return;
      vistas.add(clave);
      indice.push({ url, doc: titulo, seccion: sec.titulo, cuerpo, n: normal(`${sec.titulo}\n${cuerpo}`), t: normal(`${titulo} ${sec.titulo}`) });
    };
    for (const l of lineas) {
      const m = l.match(/^#{2,4} (.+)/);
      if (m) {
        cerrar();
        sec = { titulo: m[1].trim(), cuerpo: [] };
      } else sec.cuerpo.push(l);
    }
    cerrar();
  }
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
    // Las secciones cortas y al grano pesan un poco más que los volcados largos.
    puntos /= Math.log10(s.cuerpo.length + 100);
    res.push([puntos, s]);
  }
  res.sort((a, b) => b[0] - a[0]);
  return {
    query: consulta,
    results: res.slice(0, limite).map(([, s]) => ({
      title: s.seccion ? `${s.doc} › ${s.seccion}` : s.doc,
      url: s.url,
      snippet: fragmento(s.cuerpo, terminos),
    })),
  };
}
