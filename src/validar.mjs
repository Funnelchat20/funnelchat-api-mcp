// Valida los params de una acción contra la tabla: nombres, obligatorios, tipos y enums.
// Un parámetro que la acción no tiene nunca se ignora: la llamada no sale y el error dice cuál sobra.
// Así un filtro mal escrito no devuelve la lista entera, y un borrado no se queda sin su filtro.

const MAX_ERRORES = 10;

const tipoDe = (v) => {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (typeof v === 'number') return Number.isInteger(v) ? 'integer' : 'number';
  return typeof v; // string, boolean, object
};

const NOMBRE_TIPO = { string: 'texto', integer: 'entero', number: 'número', boolean: 'true o false', array: 'lista', object: 'objeto', null: 'null' };
const nombreTipos = (t) => t.map((x) => NOMBRE_TIPO[x] || x).join(' o ');

// En la ruta y en la query todo viaja como texto: "5" vale como entero y "true" como booleano.
function convertirTexto(v, t) {
  if (typeof v !== 'string') return undefined;
  if ((t.includes('integer') && /^-?\d+$/.test(v)) || (t.includes('number') && v.trim() !== '' && !Number.isNaN(Number(v)))) return Number(v);
  if (t.includes('boolean') && /^(true|false|1|0)$/.test(v)) return v === 'true' || v === '1';
  return undefined;
}

function revisar(valor, sch, ruta, errores, enTexto) {
  if (errores.length >= MAX_ERRORES || !sch) return valor;
  if (sch.o) {
    // Vale si encaja en alguna variante; si no, los errores de la que estuvo más cerca.
    let mejor = null;
    for (const variante of sch.o) {
      const prueba = [];
      const v = revisar(valor, variante, ruta, prueba, enTexto);
      if (!prueba.length) return v;
      if (!mejor || prueba.length < mejor.length) mejor = prueba;
    }
    errores.push(...mejor.slice(0, MAX_ERRORES - errores.length));
    return valor;
  }
  const t = sch.t || [];
  let v = valor;
  let real = tipoDe(v);
  const encaja = (r) => !t.length || t.includes(r) || (r === 'integer' && t.includes('number'));
  if (!encaja(real) && enTexto) {
    const c = convertirTexto(v, t);
    if (c !== undefined) {
      v = c;
      real = tipoDe(v);
    }
  }
  if (!encaja(real)) {
    errores.push(`${ruta}: tiene que ser ${nombreTipos(t)}, no ${NOMBRE_TIPO[real] || real}`);
    return v;
  }
  if (v === null) return v;
  if (sch.e && !sch.e.includes(v)) {
    errores.push(`${ruta}: tiene que ser ${sch.e.filter((x) => x !== null).map((x) => JSON.stringify(x)).join(', ')}`);
    return v;
  }
  if (real === 'array' && sch.i) return v.map((x, i) => revisar(x, sch.i, `${ruta}[${i}]`, errores, false));
  if (real === 'object' && sch.p) {
    for (const r of sch.r || []) if (v[r] === undefined) errores.push(`${ruta}.${r}: falta (es obligatorio)`);
    const out = {};
    for (const [k, x] of Object.entries(v)) {
      if (sch.p[k]) out[k] = revisar(x, sch.p[k], `${ruta}.${k}`, errores, false);
      else if (sch.libre) out[k] = x;
      else errores.push(`${ruta}.${k}: no existe; los campos son ${Object.keys(sch.p).join(', ')}`);
    }
    return out;
  }
  return v;
}

// Distancia de edición, para sugerir el nombre que se quiso escribir.
function distancia(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[a.length][b.length];
}

const normal = (s) => s.toLowerCase().replace(/[_-]/g, '');

export function parecido(nombre, opciones) {
  const n = normal(nombre);
  let mejor = null;
  let min = Infinity;
  for (const o of opciones) {
    const m = normal(o);
    // device_id ~ device, contact_id ~ contactId, number_id ~ device_id no.
    const prefijo = Math.min(n.length, m.length) >= 4 && (m.startsWith(n) || n.startsWith(m));
    const d = m === n || prefijo || n.replace(/id$/, '') === m.replace(/id$/, '') ? 0 : distancia(n, m);
    if (d < min) {
      min = d;
      mejor = o;
    }
  }
  return min <= Math.max(2, Math.floor(n.length / 3)) ? mejor : null;
}

// Devuelve { valores } (con lo que viaja como texto ya convertido) o { error } listo para el modelo.
export function validarParams(accion, params) {
  const nombres = Object.keys(accion.params);
  const quitados = accion.unavailable || {};
  const desconocidos = [];
  const errores = [];

  for (const k of Object.keys(params)) {
    if (quitados[k] && !quitados[k].valores) errores.push(`${k}: no está disponible por ahora. ${quitados[k].motivo}`);
    else if (!accion.params[k]) desconocidos.push(k);
  }
  if (desconocidos.length) {
    const sugerencias = {};
    for (const k of desconocidos) {
      const p = parecido(k, nombres);
      if (p) sugerencias[k] = p;
    }
    return {
      error: {
        error: 'unknown_params',
        message:
          `La acción no tiene ${desconocidos.length === 1 ? 'el parámetro' : 'los parámetros'} ${desconocidos.join(', ')}: ` +
          'no se llamó a la API. Usa solo los parámetros de help.',
        unknown: desconocidos,
        ...(Object.keys(sugerencias).length ? { did_you_mean: sugerencias } : {}),
      },
    };
  }

  const faltan = accion.required.filter((k) => params[k] === undefined || params[k] === null || params[k] === '');
  for (const k of faltan) errores.push(`${k}: falta (es obligatorio)`);

  const valores = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || errores.length >= MAX_ERRORES) continue;
    const def = accion.params[k];
    if (!def) continue;
    const q = quitados[k];
    if (q?.valores && q.valores.includes(v)) {
      errores.push(`${k}: ${JSON.stringify(v)} no está disponible por ahora. ${q.motivo}`);
      continue;
    }
    if (v === null && !accion.required.includes(k) && (def.in === 'query' || def.in === 'path')) continue; // un filtro en null es no filtrar
    // Un tramo de ruta «.» o «..» cambia la ruta al armar la URL: DELETE …/forms/{id}/numbers/.. llega
    // a DELETE …/forms/{id}, otra acción, que además pide confirm.
    if (def.in === 'path' && v !== '' && /^\s*\.{0,2}\s*$/.test(String(v))) {
      errores.push(`${k}: ${JSON.stringify(v)} no es un id`);
      continue;
    }
    valores[k] = revisar(v, def.schema, k, errores, def.in === 'query' || def.in === 'path');
  }
  if (errores.length) {
    return {
      error: {
        error: 'invalid_params',
        message: `Los parámetros no pasan: no se llamó a la API. ${errores.slice(0, 3).join('; ')}${errores.length > 3 ? '…' : ''}`,
        errors: errores,
        ...(faltan.length ? { missing: faltan } : {}),
      },
    };
  }
  return { valores };
}
