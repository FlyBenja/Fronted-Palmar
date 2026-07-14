import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { limpiarSesion } from '../../utils/authUtils';

function AppLayoutEmpleados() {
  const navigate = useNavigate();

  const cerrarSesion = () => {
    limpiarSesion();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-box">
          <h4>Hotel Palmar</h4>
          <small>Panel de empleado</small>
        </div>

        <nav className="nav flex-column gap-2 mt-4">
          <NavLink className="nav-link-custom" to="/empleado/habitaciones">
            Habitaciones
          </NavLink>

          <NavLink className="nav-link-custom" to="/empleado/menu">
            Menú
          </NavLink>

          <NavLink className="nav-link-custom" to="/empleado/facturas-pendientes">
            Recibos pendientes
          </NavLink>

          <NavLink className="nav-link-custom" to="/empleado/creditos">
            Créditos
          </NavLink>

          <NavLink className="nav-link-custom" to="/empleado/reservaciones/crear">
            Crear reservaciones
          </NavLink>

          <NavLink className="nav-link-custom" to="/empleado/confirmadas">
            Reservaciones confirmadas
          </NavLink>
        </nav>

        <button className="btn btn-outline-light sidebar-logout" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayoutEmpleados;
