import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { limpiarSesion } from '../../utils/authUtils';

function AppLayoutCocina() {
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
          <small>Panel de cocina</small>
        </div>

        <nav className="nav flex-column gap-2 mt-4">
          <NavLink className="nav-link-custom" to="/cocina/ordenes">
            Órdenes de cocina
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

export default AppLayoutCocina;
