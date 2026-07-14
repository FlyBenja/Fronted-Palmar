import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerReservaciones } from '../../api/reservacionesApi';
import Paginacion from '../../components/common/Paginacion';
import { alertaError } from '../../components/SweetAlert';
const POR_PAGINA = 10;

import type { Reservacion } from '../../types';

function getReservacionId(reservacion: Reservacion) {
  return reservacion.id;
}

function getEstado(reservacion: Reservacion) {
  return reservacion.estado.toUpperCase();
}

function esPagada(reservacion: Reservacion) {
  const estado = getEstado(reservacion);

  return estado === 'PAGADA' || estado === 'PAGADO' || estado === 'PAGADAS';
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

function ReservacionesPagadas() {
  const navigate = useNavigate();

  const [reservaciones, setReservaciones] = useState<Reservacion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [paginaReservaciones, setPaginaReservaciones] = useState(1);

  const cargarReservaciones = async () => {
    setCargando(true);

    try {
      const data = await obtenerReservaciones();

      const reservacionesPagadas = data.filter(esPagada);
      const reservacionesOrdenadas = ordenarReservacionesMasViejasPrimero(
        reservacionesPagadas,
      );

      setReservaciones(reservacionesOrdenadas);
      setPaginaReservaciones(1);
    } catch (err) {
      console.error(err);

      await alertaError(
        'Error',
        'No se pudieron cargar las reservaciones pagadas.',
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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reservaciones pagadas</h1>
          <p>
            Historial de reservaciones pagadas, ordenadas de la más antigua a la más reciente.
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
                    <th>Total recibo</th>
                    <th>Pagado</th>
                    <th>Tipo de pago</th>
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
                          Q{Number(
                            reservacion.total_a_pagar || reservacion.total_reservacion || 0,
                          ).toFixed(2)}
                        </td>

                        <td>
                          <strong>
                            Q{Number(reservacion.precio_pagado || 0).toFixed(2)}
                          </strong>
                        </td>

                        <td>
                          {reservacion.tipo_pago
                            ? reservacion.tipo_pago.nombre
                            : 'Sin tipo de pago'}
                        </td>

                        <td>
                          <span className="badge text-bg-success">
                            {reservacion.estado}
                          </span>
                        </td>

                        <td>{formatearFechaHora(reservacion.fecha_creacion)}</td>

                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() =>
                              navigate(`/manager/reservaciones/${reservacionId}/detalle`)
                            }
                          >
                            Ver recibo
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {reservaciones.length === 0 && (
                    <tr>
                      <td colSpan={12} className="text-center text-muted py-4">
                        No hay reservaciones pagadas.
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

export default ReservacionesPagadas;
