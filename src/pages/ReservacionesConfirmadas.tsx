import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { obtenerReservaciones } from '../api/reservacionesApi';
import Paginacion from '../components/common/Paginacion';
import { alertaError } from '../components/SweetAlert';
const POR_PAGINA = 10;

import type { Reservacion } from '../types';

function getReservacionId(reservacion: Reservacion) {
  return reservacion.id;
}

function getEstado(reservacion: Reservacion) {
  return reservacion.estado.toUpperCase();
}

function esConfirmada(reservacion: Reservacion) {
  return getEstado(reservacion) === 'CONFIRMADA';
}

function formatearSoloFecha(fecha: string | undefined | null) {
  if (!fecha) {
    return 'Sin fecha';
  }

  return new Date(fecha).toLocaleDateString('es-GT');
}

function formatearFechaHora(fecha: string | undefined | null) {
  if (!fecha) {
    return 'Sin fecha';
  }

  return new Date(fecha).toLocaleString('es-GT');
}

function ordenarReservacionesMasViejasPrimero(reservaciones: Reservacion[]) {
  return [...reservaciones].sort((a, b) => {
    const fechaA = new Date(a.fecha_creacion).getTime();
    const fechaB = new Date(b.fecha_creacion).getTime();

    return fechaA - fechaB;
  });
}

function obtenerRutaDetalle(pathActual: string, reservacionId: number) {
  if (pathActual.startsWith('/empleado')) {
    return `/empleado/reservaciones/${reservacionId}/detalle`;
  }

  return `/manager/reservaciones/${reservacionId}/detalle`;
}

function ReservacionesConfirmadas() {
  const navigate = useNavigate();
  const location = useLocation();

  const [reservaciones, setReservaciones] = useState<Reservacion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [paginaReservaciones, setPaginaReservaciones] = useState(1);

  const cargarReservaciones = async () => {
    setCargando(true);

    try {
      const data = await obtenerReservaciones();

      const reservacionesConfirmadas = data.filter(esConfirmada);
      const reservacionesOrdenadas = ordenarReservacionesMasViejasPrimero(
        reservacionesConfirmadas,
      );

      setReservaciones(reservacionesOrdenadas);
      setPaginaReservaciones(1);
    } catch (err) {
      console.error(err);

      await alertaError(
        'Error',
        'No se pudieron cargar las reservaciones confirmadas.',
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarReservaciones();
  }, []);

  const reservacionesPagina = reservaciones.slice(
    (paginaReservaciones - 1) * POR_PAGINA,
    paginaReservaciones * POR_PAGINA,
  );

  const verDetalle = (reservacion: Reservacion) => {
    navigate(obtenerRutaDetalle(location.pathname, reservacion.id));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reservaciones confirmadas</h1>
          <p>
            Reservaciones pendientes de pago, ordenadas de la más antigua a la más reciente.
          </p>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          {cargando ? (
            <div className="alert alert-info">Cargando reservaciones...</div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>NIT</th>
                    <th>Habitación</th>
                    <th>Tarifa</th>
                    <th>Entrada</th>
                    <th>Salida</th>
                    <th>Total reserva</th>
                    <th>Total a pagar</th>
                    <th>Estado</th>
                    <th>Creación</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {reservacionesPagina.map((reservacion) => {
                    const reservacionId = getReservacionId(reservacion);

                    return (
                      <tr key={reservacionId}>
                        <td>{reservacion.nombre_cliente}</td>

                        <td>{reservacion.nit}</td>

                        <td>
                          {reservacion.habitacion
                            ? `Habitación ${reservacion.habitacion.numero} - ${reservacion.habitacion.tipo}`
                            : 'Sin habitación'}
                        </td>

                        <td>
                          {reservacion.tarifa
                            ? `${reservacion.tarifa.nombre} - Q${Number(
                                reservacion.tarifa.precio,
                              ).toFixed(2)}`
                            : 'Sin tarifa'}
                        </td>

                        <td>{formatearSoloFecha(reservacion.fecha_entrada)}</td>

                        <td>{formatearSoloFecha(reservacion.fecha_salida)}</td>

                        <td>
                          Q{Number(reservacion.total_reservacion || 0).toFixed(2)}
                        </td>

                        <td>
                          <strong>
                            Q{Number(
                              reservacion.total_a_pagar || reservacion.total_reservacion || 0,
                            ).toFixed(2)}
                          </strong>
                        </td>

                        <td>
                          <span className="badge text-bg-warning">
                            {reservacion.estado}
                          </span>
                        </td>

                        <td>{formatearFechaHora(reservacion.fecha_creacion)}</td>

                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-palmar"
                            type="button"
                            onClick={() => verDetalle(reservacion)}
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {reservaciones.length === 0 && (
                    <tr>
                      <td colSpan={11} className="text-center text-muted py-4">
                        No hay reservaciones confirmadas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              <Paginacion
                total={reservaciones.length}
                pagina={paginaReservaciones}
                porPagina={POR_PAGINA}
                onCambiarPagina={setPaginaReservaciones}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReservacionesConfirmadas;
