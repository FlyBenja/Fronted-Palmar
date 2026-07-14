import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  limpiarSesion,
  obtenerRutaPorRol,
  obtenerUsuarioActual,
  tokenEsValido,
} from '../utils/authUtils';

interface RutaProtegidaProps {
  rolesPermitidos: number[];
  children: ReactNode;
}

function RutaProtegida({ rolesPermitidos, children }: RutaProtegidaProps) {
  const location = useLocation();

  const tokenValido = tokenEsValido();
  const usuario = obtenerUsuarioActual();

  if (!tokenValido || !usuario) {
    limpiarSesion();

    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  if (!rolesPermitidos.includes(usuario.rol_id)) {
    return <Navigate to={obtenerRutaPorRol(usuario.rol_id)} replace />;
  }

  return <>{children}</>;
}

export default RutaProtegida;