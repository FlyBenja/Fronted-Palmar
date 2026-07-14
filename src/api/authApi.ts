import { http } from './http';
import { endpoints } from './endpoints';

export interface LoginPayload {
  correo: string;
  contrasenia: string;
}

export interface UsuarioLogin {
  id: number;
  rol_id: number;
  nombre: string;
  correo: string;
  telefono: string;
}

export interface LoginResponse {
  mensaje: string;
  token: string;
  usuario: UsuarioLogin;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await http.post<LoginResponse>(endpoints.login, payload);
  return response.data;
}