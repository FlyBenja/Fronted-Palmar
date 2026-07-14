export interface UsuarioAuth {
  id: number;
  rol_id: number;
  nombre: string;
  correo: string;
  telefono?: string;
}

const TOKEN_KEY = 'hotel_token';
const USUARIO_KEY = 'hotel_usuario';

export function guardarSesion(token: string, usuario: UsuarioAuth) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
}

export function limpiarSesion() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USUARIO_KEY);
}

export function obtenerToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function obtenerUsuarioActual(): UsuarioAuth | null {
  const usuarioStorage = localStorage.getItem(USUARIO_KEY);

  if (!usuarioStorage) {
    return null;
  }

  try {
    return JSON.parse(usuarioStorage) as UsuarioAuth;
  } catch (err) {
    console.error(err);
    limpiarSesion();
    return null;
  }
}

function decodificarPayloadJwt(token: string) {
  const partes = token.split('.');

  if (partes.length !== 3) {
    return null;
  }

  try {
    const payloadBase64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const payloadJson = atob(payloadBase64);

    return JSON.parse(payloadJson);
  } catch (err) {
    console.error(err);
    return null;
  }
}

export function tokenEsValido() {
  const token = obtenerToken();

  if (!token) {
    return false;
  }

  const payload = decodificarPayloadJwt(token);

  if (!payload) {
    limpiarSesion();
    return false;
  }

  if (payload.exp) {
    const fechaExpiracion = payload.exp * 1000;
    const fechaActual = Date.now();

    if (fechaActual >= fechaExpiracion) {
      limpiarSesion();
      return false;
    }
  }

  return true;
}

export function obtenerRutaPorRol(rolId?: number | null) {
  if (rolId === 1) {
    return '/manager/habitaciones';
  }

  if (rolId === 2) {
    return '/empleado/habitaciones';
  }

  if (rolId === 3) {
    return '/cocina/ordenes';
  }

  return '/login';
}