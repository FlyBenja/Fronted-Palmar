import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  obtenerFacturaReservacion,
  pagarReservacion,
  registrarSalidaAnticipada,
} from '../api/reservacionesApi';
import { alertaError, alertaExito } from '../components/SweetAlert';
import type { FacturaReservacion, Reservacion } from '../types';
import '../styles/facturaReservacion.css';

function numero(valor: string | number | undefined | null) {
  return Number(valor || 0);
}

function dinero(valor: string | number | undefined | null) {
  return `Q${numero(valor).toFixed(2)}`;
}

function formatearFecha(fecha: string | undefined | null) {
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

function estaPagada(reservacion: Reservacion | null) {
  return reservacion?.estado?.toUpperCase() === 'PAGADA';
}

function DetalleFacturaReservacion() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [reservacion, setReservacion] = useState<Reservacion | null>(null);
  const [factura, setFactura] = useState<FacturaReservacion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [pagando, setPagando] = useState(false);
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [tipoPagoId, setTipoPagoId] = useState('2');
  const [mostrarModalSalida, setMostrarModalSalida] = useState(false);
  const [fechaSalidaAnticipada, setFechaSalidaAnticipada] = useState('');
  const [motivoSalida, setMotivoSalida] = useState('');
  const [guardandoSalida, setGuardandoSalida] = useState(false);

  const facturaPagada = useMemo(() => estaPagada(reservacion), [reservacion]);

  const cargarFactura = async () => {
    if (!id) {
      return;
    }

    setCargando(true);

    try {
      const data = await obtenerFacturaReservacion(id);
      setReservacion(data.reservacion);
      setFactura(data.factura);
    } catch (err) {
      console.error(err);

      await alertaError(
        'Error',
        'No se pudo cargar el detalle de la recibo de la reservación.',
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarFactura();
  }, [id]);

  const abrirModalPago = () => {
    setTipoPagoId('2');
    setMostrarModalPago(true);
  };

  const cerrarModalPago = () => {
    if (pagando) {
      return;
    }

    setMostrarModalPago(false);
    setTipoPagoId('2');
  };


  const abrirModalSalida = () => {
    setFechaSalidaAnticipada(factura?.reserva.fecha_salida ? new Date(factura.reserva.fecha_salida).toISOString().slice(0, 10) : '');
    setMotivoSalida('');
    setMostrarModalSalida(true);
  };

  const cerrarModalSalida = () => {
    if (guardandoSalida) {
      return;
    }

    setMostrarModalSalida(false);
    setFechaSalidaAnticipada('');
    setMotivoSalida('');
  };

  const confirmarSalidaAnticipada = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!id) {
      return;
    }

    if (!fechaSalidaAnticipada || !motivoSalida.trim()) {
      await alertaError('Datos requeridos', 'Debes ingresar fecha de salida y motivo.');
      return;
    }

    setGuardandoSalida(true);

    try {
      await registrarSalidaAnticipada(id, {
        fecha_salida: fechaSalidaAnticipada,
        motivo: motivoSalida.trim(),
      });

      setMostrarModalSalida(false);

      await alertaExito(
        '¡Salida actualizada!',
        'La fecha de salida y el total de la recibo fueron recalculados.',
      );

      await cargarFactura();
    } catch (err) {
      console.error(err);
      await alertaError('Error', 'No se pudo registrar la salida anticipada.');
    } finally {
      setGuardandoSalida(false);
    }
  };

  const confirmarPago = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!id) {
      return;
    }

    setPagando(true);

    try {
      await pagarReservacion(id, {
        tipo_pago_id: Number(tipoPagoId),
      });

      setMostrarModalPago(false);

      await alertaExito(
        '¡Reservación pagada!',
        'La recibo fue pagada correctamente.',
      );

      await cargarFactura();
    } catch (err) {
      console.error(err);

      await alertaError(
        'Error',
        'No se pudo pagar la recibo de la reservación.',
      );
    } finally {
      setPagando(false);
    }
  };

  if (cargando) {
    return (
      <div>
        <button
          type="button"
          className="btn btn-outline-secondary mb-3"
          onClick={() => navigate(-1)}
        >
          &lt;-- Volver
        </button>

        <div className="alert alert-info">Cargando factura...</div>
      </div>
    );
  }

  if (!reservacion || !factura) {
    return (
      <div>
        <button
          type="button"
          className="btn btn-outline-secondary mb-3"
          onClick={() => navigate(-1)}
        >
          &lt;-- Volver
        </button>

        <div className="alert alert-warning">
          No se encontró la recibo de la reservación.
        </div>
      </div>
    );
  }

  return (
    <div className="factura-page">
      <div className="page-header">
        <div>
          <h1>Recibo de reservación</h1>
          <p>Detalle de reserva, consumos y total a pagar.</p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => navigate(-1)}
        >
          &lt;-- Volver
        </button>
      </div>

      <section className="factura-card shadow-sm">
        <div className="factura-header">
          <div>
            <span className="factura-label">{factura.numero}</span>
            <h2>{factura.cliente.nombre}</h2>
            <p>NIT: {factura.cliente.nit || 'CF'}</p>
          </div>

          <div className="factura-status-box">
            <span
              className={
                facturaPagada
                  ? 'badge text-bg-success'
                  : 'badge text-bg-warning'
              }
            >
              {reservacion.estado}
            </span>

            {factura.tipo_pago && (
              <strong>Pago: {factura.tipo_pago.nombre}</strong>
            )}
          </div>
        </div>

        <div className="factura-info-grid">
          <div>
            <span>Habitación</span>
            <strong>
              {factura.habitacion
                ? `Habitación ${factura.habitacion.numero} - ${factura.habitacion.tipo}`
                : 'Sin habitación'}
            </strong>
          </div>

          <div>
            <span>Entrada</span>
            <strong>{formatearFecha(factura.reserva.fecha_entrada)}</strong>
          </div>

          <div>
            <span>Salida</span>
            <strong>{formatearFecha(factura.reserva.fecha_salida)}</strong>
          </div>

          <div>
            <span>Personas extras</span>
            <strong>{factura.reserva.cantidad_personas_extra || 0}</strong>
          </div>

          <div>
            <span>Creación</span>
            <strong>{formatearFechaHora(factura.fecha_creacion)}</strong>
          </div>
        </div>

        <div className="factura-section-title">
          <h3>Detalle de cargos</h3>
          <span>Total reserva + consumos</span>
        </div>

        <div className="table-responsive">
          <table className="table align-middle factura-table">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Fecha</th>
                <th className="text-end">Monto</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>
                  <strong>{factura.reserva.descripcion}</strong>
                  <p className="mb-0 text-muted">
                    {factura.tarifa?.nombre || 'Tarifa'} - {factura.reserva.dias} día(s)
                  </p>
                  {(factura.reserva.adultos_extra || 0) > 0 && (
                    <p className="mb-0 text-muted">
                      Adultos extra: {factura.reserva.adultos_extra} x {dinero(factura.reserva.tarifa_adulto_extra)} x día
                    </p>
                  )}
                  {(factura.reserva.ninos_extra || 0) > 0 && (
                    <p className="mb-0 text-muted">
                      Niños extra: {factura.reserva.ninos_extra} x {dinero(factura.reserva.tarifa_nino_extra)} x día
                    </p>
                  )}
                  {factura.reserva.motivo_salida_anticipada && (
                    <p className="mb-0 text-danger">
                      Salida anticipada: {factura.reserva.motivo_salida_anticipada}
                    </p>
                  )}
                </td>
                <td>{formatearFecha(factura.reserva.fecha_entrada)}</td>
                <td className="text-end">{dinero(factura.reserva.monto)}</td>
              </tr>

              {factura.cargos.map((cargo) => (
                <tr key={cargo.id}>
                  <td>
                    <strong>{cargo.descripcion}</strong>
                    {cargo.orden && cargo.orden.detalles.length > 0 && (
                      <div className="factura-order-details">
                        {cargo.orden.detalles.map((detalle) => (
                          <span key={detalle.id}>
                            {detalle.cantidad} x {detalle.nombre} — {dinero(detalle.subtotal)}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>{formatearFechaHora(cargo.fecha_cargo)}</td>
                  <td className="text-end">{dinero(cargo.monto)}</td>
                </tr>
              ))}

              {factura.cargos.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center text-muted py-4">
                    No hay consumos adicionales registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="factura-totals">
          <div>
            <span>Subtotal reservación</span>
            <strong>{dinero(factura.subtotal_reservacion)}</strong>
          </div>

          <div>
            <span>Consumos adicionales</span>
            <strong>{dinero(factura.total_cargos)}</strong>
          </div>

          <div className="total">
            <span>Total a pagar</span>
            <strong>{dinero(factura.total_a_pagar)}</strong>
          </div>

          <div>
            <span>Total pagado</span>
            <strong>{dinero(factura.total_pagado)}</strong>
          </div>

          <div>
            <span>Saldo</span>
            <strong>{dinero(factura.saldo)}</strong>
          </div>
        </div>

        <div className="factura-actions gap-2">
          {!facturaPagada ? (
            <>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={abrirModalSalida}
              >
                Salida anticipada
              </button>

              <button
                type="button"
                className="btn btn-palmar"
                onClick={abrirModalPago}
              >
                Pagar recibo
              </button>
            </>
          ) : (
            <div className="alert alert-success mb-0">
              Recibo pagado con {factura.tipo_pago?.nombre || 'tipo de pago registrado'}.
            </div>
          )}
        </div>
      </section>


      {mostrarModalSalida && (
        <>
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-md modal-dialog-centered">
              <div className="modal-content">
                <form onSubmit={confirmarSalidaAnticipada}>
                  <div className="modal-header modal-palmar">
                    <h5 className="modal-title">Registrar salida anticipada</h5>

                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={cerrarModalSalida}
                      disabled={guardandoSalida}
                    />
                  </div>

                  <div className="modal-body">
                    <label className="form-label">Nueva fecha de salida</label>
                    <input
                      type="date"
                      className="form-control"
                      value={fechaSalidaAnticipada}
                      onChange={(event) => setFechaSalidaAnticipada(event.target.value)}
                      required
                    />

                    <label className="form-label mt-3">Motivo</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={motivoSalida}
                      onChange={(event) => setMotivoSalida(event.target.value)}
                      placeholder="Ejemplo: el huésped se retiró antes de la fecha acordada"
                      required
                    />
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={cerrarModalSalida}
                      disabled={guardandoSalida}
                    >
                      Cancelar
                    </button>

                    <button type="submit" className="btn btn-palmar" disabled={guardandoSalida}>
                      {guardandoSalida ? 'Guardando...' : 'Recalcular recibo'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" />
        </>
      )}

      {mostrarModalPago && (
        <>
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-md modal-dialog-centered">
              <div className="modal-content">
                <form onSubmit={confirmarPago}>
                  <div className="modal-header modal-palmar">
                    <h5 className="modal-title">Pagar recibo</h5>

                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={cerrarModalPago}
                      disabled={pagando}
                    />
                  </div>

                  <div className="modal-body">
                    <div className="factura-payment-summary">
                      <span>Total a pagar</span>
                      <strong>{dinero(factura.total_a_pagar)}</strong>
                    </div>

                    <label className="form-label mt-3">Tipo de pago</label>
                    <select
                      className="form-select"
                      value={tipoPagoId}
                      onChange={(event) => setTipoPagoId(event.target.value)}
                      required
                    >
                      <option value="2">POS</option>
                      <option value="1">Efectivo</option>
                      <option value="3">Cheque</option>
                    </select>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={cerrarModalPago}
                      disabled={pagando}
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      className="btn btn-palmar"
                      disabled={pagando}
                    >
                      {pagando ? 'Pagando...' : 'Confirmar pago'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" />
        </>
      )}
    </div>
  );
}

export default DetalleFacturaReservacion;
