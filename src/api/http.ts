import axios from 'axios';
import { limpiarSesion, obtenerToken } from '../utils/authUtils';

const baseURL = `${import.meta.env.VITE_API_URL}/api`;

export const http = axios.create({
  baseURL,
});

function estaEnRutaPublica() {
  const path = window.location.pathname;

  return path === '/' || path.startsWith('/cliente') || path === '/login';
}

http.interceptors.request.use((config) => {
  const token = obtenerToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if ((status === 401 || status === 403) && !estaEnRutaPublica()) {
      limpiarSesion();

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  },
);