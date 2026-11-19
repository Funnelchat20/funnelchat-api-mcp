// Corre el ejemplo de cada acción (el que muestra help) contra el sandbox, con un cliente MCP real.
// Los ids de los ejemplos se cambian por ids que existen en el sandbox: los de su semilla y los que
// van saliendo de las respuestas (lo que crea un ejemplo lo usan los que siguen). Lo que no se deshace
// va al final, con confirm: true, porque el sandbox se reinicia antes y después.
//
// Pasa si cada ejemplo pasa la validación del MCP y la API lo acepta (2xx), salvo las excepciones de
// CONOCIDOS, cada una con su motivo. EJEMPLOS_INFORME=1 imprime el resultado de cada acción.

import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { readFileSync } from 'node:fs';
import { tabla } from '../../src/servidor.mjs';
import { clienteEnMemoria, llamar, reiniciar, sandbox, SEMILLA, SIN_SANDBOX } from './entorno.mjs';

// tool.acción → [status, error] que se espera, y por qué no puede dar 2xx en el sandbox.
export const CONOCIDOS = {
  // El ejemplo quita el número con el que se creó el formulario, y el sandbox no tiene otro número oficial.
  'forms.delete_number': [422, 'PRIMARY_NUMBER'],
  // En esta corrida el formulario del ejemplo ya se publicó (forms.publish), y uno publicado no se borra.
  'forms.delete': [409, 'PUBLISHED'],
};

// Acciones que necesitan lo que deja otra: si esa no pasó, no hay con qué probarlas.
const DEPENDE = { 'forms.get_family_response': 'messages.send_form' };

// El contrato de una operación (parámetros y cuerpo, sin textos ni ejemplos) en una spec. Si el sandbox
// habla otra spec que la del MCP para una operación, su respuesta no dice si el ejemplo está bien.
const TEXTOS = new Set(['description', 'examples', 'example', 'title', 'summary', 'externalDocs', 'deprecated']);
function canonico(spec, x, prof = 0) {
  if (prof > 30 || x === null || typeof x !== 'object') return x;
  if (Array.isArray(x)) return x.map((v) => canonico(spec, v, prof + 1));
  if (x.$ref) return canonico(spec, x.$ref.split('/').slice(1).reduce((o, k) => o?.[k], spec), prof + 1);
  const out = {};
  for (const k of Object.keys(x).sort()) if (!TEXTOS.has(k) && !k.startsWith('x-')) out[k] = canonico(spec, x[k], prof + 1);
  return out;
}
const contrato = (spec, metodo, ruta) => {
  const item = spec?.paths?.[ruta];
  const op = item?.[metodo.toLowerCase()];
  if (!op) return null;
  return JSON.stringify(canonico(spec, { p: [...(item.parameters || []), ...(op.parameters || [])], b: op.requestBody ?? null }));
};

// Las acciones que solo sirven con el número oficial (plantillas, formularios, salud, Meta).
const OFICIAL = /^(templates|forms)\.|^numbers\.(get_health|refresh_health|get_username|get_username_suggestions|reserve_username|set_capi_dataset|test_capi)$|^messages\.(send_template|send_form|typing)$|^contacts\.get_meta_window$/;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ID = /^([a-z]{3})_[A-Za-z0-9]{23}$/;
// Solo los recursos que el sandbox guarda: los demás responden por forma con cualquier id bien formado.
const CON_ESTADO = new Set(['dev', 'ctc', 'tag', 'fld', 'tpl', 'msg', 'lnk', 'frm', 'frv', 'frs', 'grp']);
const ids = { prefijo: {}, uuid: {} };

function anotarIds(tool, valor, prof = 0) {
  if (prof > 6 || valor === null || valor === undefined) return;
  if (typeof valor === 'string') {
    const m = valor.match(ID);
    if (m && !ids.prefijo[m[1]]) ids.prefijo[m[1]] = valor;
    return;
  }
  if (Array.isArray(valor)) return valor.slice(0, 3).forEach((v) => anotarIds(tool, v, prof + 1));
  if (typeof valor === 'object') {
    for (const [k, v] of Object.entries(valor)) {
      if (k === 'action_id' && typeof v === 'string' && UUID.test(v) && !ids.uuid.accion) ids.uuid.accion = v;
      if (k === 'id' && typeof v === 'string' && UUID.test(v) && !ids.uuid[tool]) ids.uuid[tool] = v;
      anotarIds(tool, v, prof + 1);
    }
  }
}

function conIds(clave, tool, valor) {
  if (typeof valor === 'string') {
    const m = valor.match(ID);
    if (m && CON_ESTADO.has(m[1]) && !valor.includes('Sandbox0')) {
      if (m[1] === 'dev') return OFICIAL.test(clave) ? SEMILLA.oficial : SEMILLA.qr;
      const semilla = { ctc: SEMILLA.contacto, tag: SEMILLA.etiqueta, tpl: SEMILLA.plantilla, grp: SEMILLA.grupo }[m[1]];
      // Mandar a un contacto con su teléfono: el que creó contacts.create, que tiene el del ejemplo.
      if (m[1] === 'ctc' && clave === 'messages.send_to_contact') return ids.prefijo.ctc ?? semilla;
      return semilla ?? ids.prefijo[m[1]] ?? valor;
    }
    if (UUID.test(valor)) return (tool === 'group_actions' ? ids.uuid.accion : ids.uuid[tool]) ?? valor;
    if (/^120363\d{6,}(@g\.us)?$/.test(valor)) return SEMILLA.grupoUid;
    return valor;
  }
  if (Array.isArray(valor)) return valor.map((v) => conIds(clave, tool, v));
  if (valor && typeof valor === 'object') return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, conIds(clave, tool, v)]));
  return valor;
}

// Lo que crea lo que otros necesitan va primero y en este orden: el formulario se arma y se publica
// antes de mandarlo, y el envío a un grupo deja la acción que lee group_actions.get_action.
const PRIMERO = [
  'contacts.create', 'tags.create', 'custom_fields.create', 'forms.create', 'forms.update', 'forms.publish',
  'connect_links.create', 'webhooks.create', 'groups.import', 'groups.send_message', 'messages.send', 'messages.send_form',
];
// Después, lo demás que crea; luego lo que lee y lo que cambia, y al final lo que no se deshace.
function orden({ clave, a }) {
  const i = PRIMERO.indexOf(clave);
  if (i > -1) return i - PRIMERO.length;
  if (a.destructive) return 3;
  if (a.method === 'POST' && !a.read_only) return 0;
  if (a.read_only) return 1;
  return 2;
}

const acciones = tabla.tools
  .flatMap((t) => Object.entries(t.actions).map(([n, a]) => ({ tool: t.name, nombre: n, clave: `${t.name}.${n}`, a })))
  .sort((x, y) => orden(x) - orden(y));

let client;
let specSandbox = null;
const specMcp = JSON.parse(readFileSync(new URL('../../spec/funnelchat.json', import.meta.url), 'utf8'));
const resultados = [];

before(async () => {
  if (SIN_SANDBOX) return;
  await reiniciar();
  client = await clienteEnMemoria();
  specSandbox = (await sandbox('/_sandbox/openapi.json')).body;
  // Un mensaje que el contacto de la semilla manda al número QR: lo que se marca leído, se reacciona y
  // se reenvía, y lo que habilita «escribiendo…».
  for (const device_id of [SEMILLA.oficial, SEMILLA.qr]) {
    await sandbox('/_sandbox/inbound/message', { method: 'POST', body: { phone: SEMILLA.telefono, device_id, text: '¿Tienen stock?' } });
  }
  const historial = await sandbox(`/api/v1/contacts/${SEMILLA.contacto}/messages?perPage=5`);
  const entrante = (historial.body?.data || []).find((m) => m.own === 0 && m.device_id === SEMILLA.qr);
  assert.ok(entrante?.id, `el sandbox no dejó el mensaje entrante: ${JSON.stringify(historial.body).slice(0, 300)}`);
  ids.prefijo.msg = entrante.id;
});

after(async () => {
  if (SIN_SANDBOX) return;
  await reiniciar();
  await client?.close();
  if (process.env.EJEMPLOS_INFORME) {
    for (const r of resultados) console.log(`${r.bien ? 'ok ' : 'MAL'} ${r.clave.padEnd(48)} ${r.resumen}`);
  }
});

test('cada ejemplo del help pasa la validación y la API lo acepta', { skip: SIN_SANDBOX }, async (t) => {
  const malos = [];
  const otraSpec = [];
  for (const { tool, nombre, clave, a } of acciones) {
    const params = conIds(clave, tool, a.example);
    const r = await llamar(client, tool, { action: nombre, params, ...(a.destructive ? { confirm: true } : {}) });
    const status = r.isError ? (r.datos?.status ?? 0) : 200;
    const codigo = r.isError ? r.datos?.error : null;
    if (!r.isError) anotarIds(tool, r.datos);
    // El contacto completa el formulario: deja la respuesta que leen las acciones de forms.
    if (clave === 'messages.send_form' && !r.isError) {
      await sandbox('/_sandbox/forms/complete', { method: 'POST', body: { contact_id: params.contact } });
    }
    const esperado = CONOCIDOS[clave];
    let bien = esperado ? status === esperado[0] && codigo === esperado[1] : !r.isError;
    let resumen = r.isError ? `${status} ${codigo}: ${String(r.datos?.message ?? r.txt).slice(0, 140)}` : 'ok';
    // La validación del MCP siempre cuenta; la respuesta de la API, solo si el sandbox habla la misma spec.
    const delMcp = r.isError && !r.datos?.status;
    if (!bien && !delMcp && contrato(specSandbox, a.method, a.path) !== contrato(specMcp, a.method, a.path)) {
      bien = true;
      resumen = `sin comparar (el sandbox tiene otro contrato para ${a.method} ${a.path}): ${resumen}`;
      otraSpec.push(clave);
    } else if (!bien && !delMcp && DEPENDE[clave] && !resultados.find((x) => x.clave === DEPENDE[clave])?.ok) {
      bien = true;
      resumen = `sin comparar (depende de ${DEPENDE[clave]}, que no pasó): ${resumen}`;
      otraSpec.push(clave);
    }
    resultados.push({ clave, bien, ok: !r.isError, resumen });
    if (!bien) malos.push(`${clave} ${JSON.stringify(params)} → ${resumen}`);
  }
  t.diagnostic(`${resultados.filter((r) => r.bien).length - otraSpec.length} de ${resultados.length} ejemplos como se esperaba`);
  if (otraSpec.length) {
    t.diagnostic(`${otraSpec.length} sin comparar (el sandbox habla otra spec para esas operaciones, o falló aquello de lo que dependen): ${otraSpec.join(', ')}`);
  }
  assert.deepEqual(malos, [], `Ejemplos que fallan:\n${malos.join('\n')}`);
});
