import { useEffect, useState } from 'react';
import { obtenerFacturasRestaurante } from '../../api/ordenesApi';
import Paginacion from '../../components/common/Paginacion';
import { alertaError } from '../../components/SweetAlert';
import type { FacturaRestauranteReporteItem, FacturasRestauranteReporte } from '../../types';
import '../../styles/restaurante.css';
import '../../styles/reciboReservacion.css';

const POR_PAGINA = 10;

function fechaHoyInput() {
  const fecha = new Date();
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');

  return `${anio}-${mes}-${dia}`;
}

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

function obtenerDetalleOrdenes(recibo: FacturaRestauranteReporteItem) {
  return recibo.ordenes || [];
}

function RecibosRestaurante() {
  const fechaActual = new Date();
  const [tipo, setTipo] = useState<'DIA' | 'SEMANA' | 'MES'>('DIA');
  const [fecha, setFecha] = useState(fechaHoyInput());
  const [anio, setAnio] = useState(String(fechaActual.getFullYear()));
  const [mes, setMes] = useState(String(fechaActual.getMonth() + 1));
  const [reporte, setReporte] = useState<FacturasRestauranteReporte | null>(null);
  const [reciboDetalle, setReciboDetalle] = useState<FacturaRestauranteReporteItem | null>(null);
  const [cargando, setCargando] = useState(false);
  const [pagina, setPagina] = useState(1);

  const cargarReporte = async () => {
    setCargando(true);

    try {
      const params = tipo === 'MES'
        ? { tipo, anio, mes }
        : { tipo, fecha };

      const data = await obtenerFacturasRestaurante(params);
      setReporte(data);
      setPagina(1);
    } catch (err) {
      console.error(err);
      await alertaError('Error', 'No se pudieron cargar los recibos del restaurante.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarReporte();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recibosPagina = reporte
    ? reporte.facturas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
    : [];

  return (
    <div className="restaurante-page">
      <div className="page-header">
        <div>
          <h1>Recibos de restaurante</h1>
          <p>Consulta recibos pagados por día, semana o mes.</p>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label">Tipo de reporte</label>
              <select className="form-select" value={tipo} onChange={(event) => setTipo(event.target.value as 'DIA' | 'SEMANA' | 'MES')}>
                <option value="DIA">Día</option>
                <option value="SEMANA">Semana</option>
                <option value="MES">Mes</option>
              </select>
            </div>

            {tipo === 'MES' ? (
              <>
                <div className="col-md-3">
                  <label className="form-label">Año</label>
                  <input className="form-control" value={anio} onChange={(event) => setAnio(event.target.value)} />
                </div>

                <div className="col-md-3">
                  <label className="form-label">Mes</label>
                  <select className="form-select" value={mes} onChange={(event) => setMes(event.target.value)}>
                    <option value="1">Enero</option>
                    <option value="2">Febrero</option>
                    <option value="3">Marzo</option>
                    <option value="4">Abril</option>
                    <option value="5">Mayo</option>
                    <option value="6">Junio</option>
                    <option value="7">Julio</option>
                    <option value="8">Agosto</option>
                    <option value="9">Septiembre</option>
                    <option value="10">Octubre</option>
                    <option value="11">Noviembre</option>
                    <option value="12">Diciembre</option>
                  </select>
                </div>
              </>
            ) : (
              <div className="col-md-4">
                <label className="form-label">Fecha</label>
                <input type="date" className="form-control" value={fecha} onChange={(event) => setFecha(event.target.value)} />
              </div>
            )}

            <div className="col-md-2">
              <button type="button" className="btn btn-palmar w-100" onClick={cargarReporte} disabled={cargando}>
                {cargando ? 'Cargando...' : 'Consultar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {reporte ? (
        <>
          <div className="restaurante-stats-grid">
            <div className="restaurante-stat-card success">
              <span>Total recibido</span>
              <strong>{dinero(reporte.resumen.total_facturado)}</strong>
            </div>

            <div className="restaurante-stat-card">
              <span>Recibos</span>
              <strong>{reporte.resumen.cantidad_facturas}</strong>
            </div>

            <div className="restaurante-stat-card">
              <span>Rango</span>
              <strong>{formatearFechaHora(reporte.rango.inicio).split(',')[0]}</strong>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              <h4 className="restaurante-card-title">Recibos pagados</h4>

              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Cliente/Mesa</th>
                      <th>Tipo de pago</th>
                      <th>Órdenes</th>
                      <th>Total</th>
                      <th>Fecha</th>
                      <th className="text-end">Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recibosPagina.map((recibo) => (
                      <tr key={recibo.referencia}>
                        <td>{recibo.cliente}</td>
                        <td>{recibo.tipo_pago?.nombre || 'Sin tipo'}</td>
                        <td>{recibo.cantidad_ordenes}</td>
                        <td><strong>{dinero(recibo.total)}</strong></td>
                        <td>{formatearFechaHora(recibo.fecha_pago)}</td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setReciboDetalle(recibo)}
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    ))}

                    {reporte.facturas.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center text-muted py-4">
                          No hay recibos pagados en este rango.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Paginacion
                total={reporte.facturas.length}
                pagina={pagina}
                porPagina={POR_PAGINA}
                onCambiarPagina={setPagina}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="alert alert-warning">No hay reporte cargado.</div>
      )}

      {reciboDetalle && (
        <>
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header modal-palmar">
                  <div>
                    <h5 className="modal-title">Detalle del recibo</h5>
                    <small>{reciboDetalle.cliente}</small>
                  </div>

                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setReciboDetalle(null)}
                  />
                </div>

                <div className="modal-body">
                  <div className="recibo-card shadow-sm">
                    <div className="recibo-header">
                      <div>
                        <span className="recibo-label">Recibo restaurante</span>
                        <h2>{reciboDetalle.cliente}</h2>
                        <p>{formatearFechaHora(reciboDetalle.fecha_pago)}</p>
                      </div>

                      <div className="recibo-status-box">
                        <span className="badge text-bg-success">Pagado</span>
                        <strong>{dinero(reciboDetalle.total)}</strong>
                        <small>{reciboDetalle.tipo_pago?.nombre || 'Sin tipo de pago'}</small>
                      </div>
                    </div>

                    <div className="recibo-section-title">
                      <h3>Detalle de consumo</h3>
                      <span>{reciboDetalle.cantidad_ordenes} orden(es)</span>
                    </div>

                    <div className="table-responsive">
                      <table className="table recibo-table align-middle">
                        <thead>
                          <tr>
                            <th>Orden</th>
                            <th>Productos</th>
                            <th>Total</th>
                          </tr>
                        </thead>

                        <tbody>
                          {obtenerDetalleOrdenes(reciboDetalle).map((orden, index) => (
                            <tr key={orden.id || index}>
                              <td>{orden.tipo_orden || 'Restaurante'}</td>
                              <td>
                                {(orden.detalles || []).length === 0 ? (
                                  <span className="text-muted">Sin detalle</span>
                                ) : (
                                  <div className="recibo-order-details">
                                    {(orden.detalles || []).map((detalle) => (
                                      <span key={detalle.id}>
                                        {detalle.cantidad} x {detalle.menu_item?.nombre || `Producto ${detalle.menu_item_id}`} - {dinero(detalle.subtotal)}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td><strong>{dinero(orden.total)}</strong></td>
                            </tr>
                          ))}

                          {obtenerDetalleOrdenes(reciboDetalle).length === 0 && (
                            <tr>
                              <td colSpan={3} className="text-center text-muted py-4">
                                Este recibo no tiene detalle de órdenes.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="recibo-totals">
                      <div className="total">
                        <span>Total pagado</span>
                        <strong>{dinero(reciboDetalle.total)}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setReciboDetalle(null)}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" />
        </>
      )}
    </div>
  );
}

export default RecibosRestaurante;
