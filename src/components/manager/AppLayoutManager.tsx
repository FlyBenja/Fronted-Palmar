import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { limpiarSesion } from '../../utils/authUtils';

function AppLayoutManager() {
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
          <small>Panel administrativo</small>
        </div>

        <nav className="nav flex-column gap-2 mt-4">
          <NavLink className="nav-link-custom" to="/manager/habitaciones">
            Habitaciones
          </NavLink>

          <NavLink className="nav-link-custom" to="/manager/tarifas">
            Tarifas
          </NavLink>

          <NavLink className="nav-link-custom" to="/manager/inventario">
            Inventario
          </NavLink>

          <NavLink className="nav-link-custom" to="/manager/menu">
            Menú
          </NavLink>

          <NavLink className="nav-link-custom" to="/manager/reportes/financiero">
            Reporte financiero
          </NavLink>

          <NavLink className="nav-link-custom" to="/manager/eventos">
            Eventos
          </NavLink>

          <NavLink className="nav-link-custom" to="/manager/creditos">
            Créditos
          </NavLink>

          <NavLink className="nav-link-custom" to="/manager/recibos/restaurante">
            Recibos restaurante
          </NavLink>

          <NavLink className="nav-link-custom" to="/manager/reservaciones/crear">
            Crear reservaciones
          </NavLink>

          <NavLink className="nav-link-custom" to="/manager/reservaciones/confirmadas">
            Reservaciones confirmadas
          </NavLink>

          <NavLink className="nav-link-custom" to="/manager/reservaciones/pagadas">
            Reservaciones pagadas
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

export default AppLayoutManager;
