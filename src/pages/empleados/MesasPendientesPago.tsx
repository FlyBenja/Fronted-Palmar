import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  obtenerFacturaRestaurantePendiente,
  obtenerFacturasPendientesPago,
  pagarFacturaRestaurantePendiente,
} from '../../api/ordenesApi';
import { alertaError, alertaExito } from '../../components/SweetAlert';
import type { FacturaPendientePago, FacturaRestaurantePendiente } from '../../types';
import '../../styles/restaurante.css';
import '../../styles/reciboReservacion.css';

function numero(valor: string | number | undefined | null) {
  return Number(valor || 0);
}

function dinero(valor: string | number | undefined | null) {
  return `Q${numero(valor).toFixed(2)}`;
}

function formatearFechaHora(fecha: string | undefined | null) {
  if (!fecha) return 'Sin fecha';
  return new Date(fecha).toLocaleString('es-GT');
}

function obtenerTextoTipoRecibo(recibo: FacturaPendientePago | FacturaRestaurantePendiente) {
  if (recibo.tipo_orden === 'MESA') return 'Mesa';
  if (recibo.tipo_orden === 'LLEVAR') return 'Para llevar';
  return 'Restaurante';
}

function RecibosPendientesPago() {
  const [recibos, setRecibos] = useState<FacturaPendientePago[]>([]);
  const [recibo, setRecibo] = useState<FacturaRestaurantePendiente | null>(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoRecibo, setCargandoRecibo] = useState(false);
  const [pagando, setPagando] = useState(false);
  const [mostrarRecibo, setMostrarRecibo] = useState(false);
  const [mostrarPago, setMostrarPago] = useState(false);
  const [tipoPagoId, setTipoPagoId] = useState('2');

  const cargarRecibos = async (mostrarCarga = true) => {
    if (mostrarCarga) {
      setCargando(true);
    }

    try {
      const data = await obtenerFacturasPendientesPago();
      setRecibos(data);
    } catch (err) {
      console.error(err);

      if (mostrarCarga) {
        await alertaError('Error', 'No se pudieron cargar las recibos pendientes de pago.');
      }
    } finally {
      if (mostrarCarga) {
        setCargando(false);
      }
    }
  };

  useEffect(() => {
    cargarRecibos();
  }, []);

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      if (!mostrarRecibo && !pagando) {
        cargarRecibos(false);
      }
    }, 5000);

    return () => window.clearInterval(intervalo);
  }, [mostrarRecibo, pagando]);

  const abrirRecibo = async (clave: string) => {
    setCargandoRecibo(true);
    setMostrarRecibo(true);

    try {
      const data = await obtenerFacturaRestaurantePendiente(clave);
      setRecibo(data);
    } catch (err) {
      console.error(err);
      await alertaError('Error', 'No se pudo cargar la recibo.');
      setMostrarRecibo(false);
    } finally {
      setCargandoRecibo(false);
    }
  };

  const cerrarRecibo = () => {
    if (pagando) return;
    setMostrarRecibo(false);
    setMostrarPago(false);
    setRecibo(null);
    setTipoPagoId('2');
  };

  const abrirPago = () => {
    setTipoPagoId('2');
    setMostrarPago(true);
  };

  const cerrarPago = () => {
    if (pagando) return;
    setMostrarPago(false);
    setTipoPagoId('2');
  };

  const confirmarPago = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!recibo) return;

    setPagando(true);

    try {
      await pagarFacturaRestaurantePendiente(recibo.clave, {
        tipo_pago_id: Number(tipoPagoId),
      });

      await alertaExito('¡Recibo pagada!', 'La recibo fue pagada correctamente.');

      setMostrarPago(false);
      setMostrarRecibo(false);
      setRecibo(null);
      await cargarRecibos(false);
    } catch (err) {
      console.error(err);
      await alertaError('Error', 'No se pudo pagar la recibo.');
    } finally {
      setPagando(false);
    }
  };

  return (
    <div className="restaurante-page">
      <div className="page-header">
        <div>
          <h1>Recibos pendientes de pago</h1>
          <p>Recibos de mesas y órdenes para llevar que cocina ya marcó como realizadas.</p>
        </div>
      </div>

      {cargando ? (
        <div className="alert alert-info">Cargando recibos pendientes...</div>
      ) : recibos.length === 0 ? (
        <div className="alert alert-success">No hay recibos pendientes de pago.</div>
      ) : (
        <div className="restaurante-mesas-grid">
          {recibos.map((item) => (
            <article className="restaurante-mesa-card shadow-sm" key={item.clave}>
              <span className="restaurante-label">{obtenerTextoTipoRecibo(item)}</span>
              <h3>{item.titulo}</h3>
              <p>{item.cantidad_ordenes} orden(es) listas para cobrar.</p>

              <div className="restaurante-mesa-total">
                <span>Total a pagar</span>
                <strong>{dinero(item.total_a_pagar)}</strong>
              </div>

              <small>Última orden: {formatearFechaHora(item.ultima_orden)}</small>

              <button type="button" className="btn btn-palmar w-100 mt-3" onClick={() => abrirRecibo(item.clave)}>
                Ver recibo
              </button>
            </article>
          ))}
        </div>
      )}

      {mostrarRecibo && (
        <>
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header modal-palmar">
                  <h5 className="modal-title">Recibo restaurante</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={cerrarRecibo} disabled={pagando} />
                </div>

                <div className="modal-body">
                  {cargandoRecibo || !recibo ? (
                    <div className="alert alert-info mb-0">Cargando recibo...</div>
                  ) : (
                    <section className="recibo-card shadow-sm">
                      <div className="recibo-header">
                        <div>
                          <span className="recibo-label">Recibo restaurante</span>
                          <h2>{recibo.titulo}</h2>
                          <p>Órdenes listas pendientes de pago.</p>
                        </div>

                        <div className="recibo-status-box">
                          <span className="badge text-bg-warning">Pendiente</span>
                          <strong>{recibo.ordenes.length} orden(es)</strong>
                        </div>
                      </div>

                      <div className="recibo-section-title">
                        <h3>Detalle de consumo</h3>
                        <span>{obtenerTextoTipoRecibo(recibo)}</span>
                      </div>

                      <div className="table-responsive">
                        <table className="table align-middle recibo-table">
                          <thead>
                            <tr>
                              <th>Productos</th>
                              <th>Fecha</th>
                              <th className="text-end">Total</th>
                            </tr>
                          </thead>

                          <tbody>
                            {recibo.ordenes.map((orden) => (
                              <tr key={orden.id}>
                                <td>
                                  <div className="recibo-order-details">
                                    {orden.detalles.map((detalle) => (
                                      <span key={detalle.id}>
                                        {detalle.cantidad} x {detalle.menu_item?.nombre || 'Producto'} — {dinero(detalle.subtotal)}
                                        {detalle.exclusiones && detalle.exclusiones.length > 0 && (
                                          <small className="d-block text-warning">
                                            Sin {detalle.exclusiones.map((item) => item.nombre).join(', ')}
                                          </small>
                                        )}
                                        {detalle.observaciones && (
                                          <small className="d-block text-muted">Obs: {detalle.observaciones}</small>
                                        )}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td>{formatearFechaHora(orden.fecha_creacion)}</td>
                                <td className="text-end">{dinero(orden.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="recibo-totals">
                        <div>
                          <span>Subtotal</span>
                          <strong>{dinero(recibo.subtotal)}</strong>
                        </div>

                        <div className="total">
                          <span>Total a pagar</span>
                          <strong>{dinero(recibo.total_a_pagar)}</strong>
                        </div>
                      </div>
                    </section>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={cerrarRecibo} disabled={pagando}>
                    Cerrar
                  </button>

                  {recibo && recibo.ordenes.length > 0 && (
                    <button type="button" className="btn btn-palmar" onClick={abrirPago} disabled={pagando}>
                      Pagar recibo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" />
        </>
      )}

      {mostrarPago && recibo && (
        <>
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-md modal-dialog-centered">
              <div className="modal-content">
                <form onSubmit={confirmarPago}>
                  <div className="modal-header modal-palmar">
                    <h5 className="modal-title">Pagar {recibo.titulo}</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={cerrarPago} disabled={pagando} />
                  </div>

                  <div className="modal-body">
                    <div className="recibo-payment-summary">
                      <span>Total a pagar</span>
                      <strong>{dinero(recibo.total_a_pagar)}</strong>
                    </div>

                    <label className="form-label mt-3">Tipo de pago</label>
                    <select className="form-select" value={tipoPagoId} onChange={(event) => setTipoPagoId(event.target.value)} required>
                      <option value="1">Efectivo</option>
                      <option value="2">POS</option>
                      <option value="3">Cheque</option>
                    </select>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={cerrarPago} disabled={pagando}>
                      Cancelar
                    </button>

                    <button type="submit" className="btn btn-palmar" disabled={pagando}>
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

export default RecibosPendientesPago;
