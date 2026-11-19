// La URL base de la API: el host, y las rutas de la tabla llevan /api/v1/… completas.
// Se acepta que alguien la escriba con /api/v1, /api o /v1 al final (como en la doc o en el panel)
// y se deja solo el host, con el prefijo que tenga delante si la API está detrás de un proxy.

export const BASE_POR_DEFECTO = 'https://api.funnelchat.com';

export function normalizarBase(cruda) {
  const texto = String(cruda ?? '').trim();
  if (!texto) return BASE_POR_DEFECTO;
  let url;
  try {
    url = new URL(texto);
  } catch {
    throw new Error(`La URL base no es una URL: «${texto}». Usa el host, por ejemplo ${BASE_POR_DEFECTO} o http://127.0.0.1:4010.`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error(`La URL base tiene que ser http o https: «${texto}».`);
  }
  if (url.username || url.password) throw new Error('La URL base no lleva usuario ni contraseña: la clave va en FUNNELCHAT_API_KEY.');
  const ruta = url.pathname.replace(/\/+$/, '').replace(/\/(api\/v1|api|v1)$/, '');
  return `${url.origin}${ruta}`;
}

// FUNNELCHAT_BASE_URL manda; FUNNELCHAT_API_URL queda como alias (el nombre del prototipo).
export function baseDelEntorno(env = process.env, flag) {
  return normalizarBase(flag || env.FUNNELCHAT_BASE_URL || env.FUNNELCHAT_API_URL || '');
}
