import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import RutaProtegida from './components/RutaProtegida';
import AppLayoutManager from './components/manager/AppLayoutManager';
import AppLayoutEmpleado from './components/empleados/AppLayoutEmpleados';
import AppLayoutCocina from './components/cocina/AppLayoutCocina';

import Login from './pages/Login';

import CrearHabitaciones from './pages/manager/CrearHabitaciones';
import DetalleHabitacion from './pages/manager/DetalleHabitacion';
import CrearTarifas from './pages/manager/CrearTarifas';
import ReservacionesPagadas from './pages/manager/ReservacionesPagadas';
import InventarioManager from './pages/manager/InventarioManager';
import ReporteFinanciero from './pages/manager/ReporteFinanciero';
import FacturasRestaurante from './pages/manager/FacturasRestaurante';
import MenuManager from './pages/manager/MenuManager';
import EventosManager from './pages/manager/EventosManager';
import CreditosManager from './pages/manager/CreditosManager';

import HabitacionesEmpleado from './pages/empleados/HabitacionesEmpleado';
import DetalleHabitacionEmpleado from './pages/empleados/DetalleHabitacionEmpleado';
import MenuEmpleado from './pages/empleados/MenuEmpleado';
import MesasPendientesPago from './pages/empleados/MesasPendientesPago';

import CocinaOrdenes from './pages/cocina/CocinaOrdenes';

import CrearReservacion from './pages/CrearReservacion';
import DetalleFacturaReservacion from './pages/DetalleFacturaReservacion';
import ReservacionesConfirmadas from './pages/ReservacionesConfirmadas';
import ClienteHabitaciones from './pages/cliente/ClienteHabitaciones';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/cliente" replace />} />

        <Route path="/cliente" element={<ClienteHabitaciones />} />

        <Route path="/login" element={<Login />} />

        <Route
          path="/manager"
          element={
            <RutaProtegida rolesPermitidos={[1]}>
              <AppLayoutManager />
            </RutaProtegida>
          }
        >
          <Route index element={<Navigate to="/manager/habitaciones" replace />} />

          <Route path="habitaciones" element={<CrearHabitaciones />} />
          <Route path="habitaciones/:id" element={<DetalleHabitacion />} />
          <Route path="tarifas" element={<CrearTarifas />} />
          <Route path="inventario" element={<InventarioManager />} />
          <Route path="menu" element={<MenuManager />} />
          <Route path="reportes/financiero" element={<ReporteFinanciero />} />
          <Route path="recibos/restaurante" element={<FacturasRestaurante />} />
          <Route path="facturas/restaurante" element={<Navigate to="/manager/recibos/restaurante" replace />} />
          <Route path="eventos" element={<EventosManager />} />
          <Route path="creditos" element={<CreditosManager />} />

          <Route path="reservaciones/crear" element={<CrearReservacion />} />

          <Route
            path="reservaciones/confirmadas"
            element={<ReservacionesConfirmadas />}
          />

          <Route
            path="reservaciones/pagadas"
            element={<ReservacionesPagadas />}
          />

          <Route
            path="reservaciones/:id/detalle"
            element={<DetalleFacturaReservacion />}
          />
        </Route>

        <Route
          path="/empleado"
          element={
            <RutaProtegida rolesPermitidos={[2]}>
              <AppLayoutEmpleado />
            </RutaProtegida>
          }
        >
          <Route index element={<Navigate to="/empleado/habitaciones" replace />} />

          <Route path="habitaciones" element={<HabitacionesEmpleado />} />
          <Route path="habitaciones/:id" element={<DetalleHabitacionEmpleado />} />
          <Route path="menu" element={<MenuEmpleado />} />
          <Route path="facturas-pendientes" element={<MesasPendientesPago />} />
          <Route path="mesas-pendientes" element={<Navigate to="/empleado/facturas-pendientes" replace />} />
          <Route path="creditos" element={<CreditosManager />} />
          <Route path="reservaciones/crear" element={<CrearReservacion />} />
          <Route path="confirmadas" element={<ReservacionesConfirmadas />} />
          <Route
            path="reservaciones/:id/detalle"
            element={<DetalleFacturaReservacion />}
          />
        </Route>

        <Route
          path="/cocina"
          element={
            <RutaProtegida rolesPermitidos={[3]}>
              <AppLayoutCocina />
            </RutaProtegida>
          }
        >
          <Route index element={<Navigate to="/cocina/ordenes" replace />} />
          <Route path="ordenes" element={<CocinaOrdenes />} />
        </Route>

        <Route path="*" element={<Navigate to="/cliente" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
