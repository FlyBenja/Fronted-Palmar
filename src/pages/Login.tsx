import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/authApi';
import {
  guardarSesion,
  limpiarSesion,
  obtenerRutaPorRol,
  obtenerUsuarioActual,
  tokenEsValido,
} from '../utils/authUtils';

function Login() {
  const navigate = useNavigate();

  const [correo, setCorreo] = useState('admin@palmar.com');
  const [contrasenia, setContrasenia] = useState('umg123');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tokenEsValido()) {
      const usuario = obtenerUsuarioActual();

      if (usuario) {
        navigate(obtenerRutaPorRol(usuario.rol_id), {
          replace: true,
        });

        return;
      }
    }

    limpiarSesion();
  }, [navigate]);

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError('');
    setCargando(true);

    try {
      const response = await login({
        correo,
        contrasenia,
      });

      guardarSesion(response.token, response.usuario);

      navigate(obtenerRutaPorRol(response.usuario.rol_id), {
        replace: true,
      });
    } catch (err) {
      console.error(err);
      limpiarSesion();
      setError('No se pudo iniciar sesión. Revisa el correo, contraseña o backend.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card shadow-lg">
        <div className="text-center mb-4">
          <h1 className="login-title">Hotel Palmar</h1>
          <p className="text-muted mb-0">Administración de reservaciones</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={enviar}>
          <div className="mb-3">
            <label className="form-label">Correo electrónico</label>
            <input
              type="email"
              className="form-control"
              value={correo}
              onChange={(event) => setCorreo(event.target.value)}
              placeholder="admin@palmar.com"
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-control"
              value={contrasenia}
              onChange={(event) => setContrasenia(event.target.value)}
              placeholder="********"
              required
            />
          </div>

          <button className="btn btn-palmar w-100" type="submit" disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;