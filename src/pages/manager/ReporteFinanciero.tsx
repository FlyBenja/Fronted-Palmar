import { useEffect, useMemo, useState } from 'react';
import { obtenerCreditos } from '../../api/creditosApi';
import { obtenerEventos } from '../../api/eventosApi';
import {
  obtenerReporteFinancieroDia,
  obtenerReporteFinancieroMes,
  obtenerReporteFinancieroSemana,
} from '../../api/reportesApi';
import Paginacion from '../../components/common/Paginacion';
import { alertaError } from '../../components/SweetAlert';
import type {
  CreditoCuenta,
  EventoRestaurante,
  ReporteFinanciero as ReporteFinancieroData,
} from '../../types';
import '../../styles/restaurante.css';

const POR_PAGINA = 10;

function fechaInputLocal(fecha: Date) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');

  return `${anio}-${mes}-${dia}`;
}

function fechaHoyInput() {
  return fechaInputLocal(new Date());
}

function numero(valor: string | number | undefined | null) {
  return Number(valor || 0);
}

function dinero(valor: string | number | undefined | null) {
  return `Q${numero(valor).toFixed(2)}`;
}

function formatearFecha(fecha: string | undefined | null) {
  if (!fecha) return 'Sin fecha';
  return new Date(fecha).toLocaleString('es-GT');
}

function obtenerRangoConsulta(tipo: 'DIA' | 'SEMANA' | 'MES', fecha: string, anio: string, mes: string) {
  if (tipo === 'DIA') {
    return {
      fecha_inicio: fecha,
      fecha_fin: fecha,
    };
  }

  if (tipo === 'SEMANA') {
    const fechaBase = new Date(`${fecha}T00:00:00`);
    const diaSemana = fechaBase.getDay();
    const diferenciaLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
    const inicio = new Date(fechaBase);
    inicio.setDate(fechaBase.getDate() + diferenciaLunes);

    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 6);

    return {
      fecha_inicio: fechaInputLocal(inicio),
      fecha_fin: fechaInputLocal(fin),
    };
  }

  const anioNumero = Number(anio);
  const mesNumero = Number(mes);
  const inicio = new Date(anioNumero, mesNumero - 1, 1);
  const fin = new Date(anioNumero, mesNumero, 0);

  return {
    fecha_inicio: fechaInputLocal(inicio),
    fecha_fin: fechaInputLocal(fin),
  };
}

type OrdenReporte = ReporteFinancieroData['ordenes'][number];

interface ConsumoRestauranteAgrupado {
  clave: string;
  tipo: string;
  cliente: string;
  tipoPago: string;
  cantidadOrdenes: number;
  total: number;
  fecha: string;
}

function obtenerClienteOrden(orden: OrdenReporte) {
  if (orden.numero_mesa) {
    return `Mesa ${orden.numero_mesa}`;
  }

  if (orden.tipo_orden === 'LLEVAR') {
    return orden.referencia || 'Para llevar';
  }

  if (orden.tipo_orden === 'HABITACION' && orden.habitacion_id) {
    return `Habitación ${orden.habitacion_id}`;
  }

  return orden.referencia || 'Consumo';
}

function agruparConsumosRestaurante(ordenes: OrdenReporte[]): ConsumoRestauranteAgrupado[] {
  const mapa = new Map<string, ConsumoRestauranteAgrupado>();

  ordenes.forEach((orden) => {
    const fechaPago = orden.fecha_pago || orden.fecha_creacion;
    const cliente = obtenerClienteOrden(orden);
    const clave = orden.referencia || `${orden.tipo_orden}-${cliente}-${fechaPago}-${orden.tipo_pago_id || 'SIN_TIPO'}`;

    const actual = mapa.get(clave);

    if (actual) {
      actual.cantidadOrdenes += 1;
      actual.total += numero(orden.total);
      return;
    }

    mapa.set(clave, {
      clave,
      tipo: orden.tipo_orden || 'RESTAURANTE',
      cliente,
      tipoPago: orden.tipo_pago?.nombre || 'Sin tipo',
      cantidadOrdenes: 1,
      total: numero(orden.total),
      fecha: fechaPago,
    });
  });

  return Array.from(mapa.values()).sort((a, b) => {
    return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
  });
}

function obtenerTotalEvento(evento: EventoRestaurante) {
  return numero(evento.monto_cobrado ?? evento.total);
}

function obtenerFechaEvento(evento: EventoRestaurante) {
  return evento.fecha_cierre || evento.fecha_evento || evento.fecha_creacion;
}

function obtenerTotalCredito(credito: CreditoCuenta) {
  return numero(credito.total);
}

function obtenerFechaCredito(credito: CreditoCuenta) {
  return credito.fecha_pago || credito.fecha_creacion;
}

function ReporteFinanciero() {
  const fechaActual = new Date();

  const [tipoReporte, setTipoReporte] = useState<'DIA' | 'SEMANA' | 'MES'>('DIA');
  const [fecha, setFecha] = useState(fechaHoyInput());
  const [anio, setAnio] = useState(String(fechaActual.getFullYear()));
  const [mes, setMes] = useState(String(fechaActual.getMonth() + 1));
  const [reporte, setReporte] = useState<ReporteFinancieroData | null>(null);
  const [eventos, setEventos] = useState<EventoRestaurante[]>([]);
  const [creditos, setCreditos] = useState<CreditoCuenta[]>([]);
  const [cargando, setCargando] = useState(false);
  const [paginaReservaciones, setPaginaReservaciones] = useState(1);
  const [paginaConsumos, setPaginaConsumos] = useState(1);
  const [paginaInventario, setPaginaInventario] = useState(1);
  const [paginaEventos, setPaginaEventos] = useState(1);
  const [paginaCreditos, setPaginaCreditos] = useState(1);

  const cargarReporte = async () => {
    setCargando(true);

    try {
      let data: ReporteFinancieroData;

      if (tipoReporte === 'DIA') {
        data = await obtenerReporteFinancieroDia(fecha);
      } else if (tipoReporte === 'SEMANA') {
        data = await obtenerReporteFinancieroSemana(fecha);
      } else {
        data = await obtenerReporteFinancieroMes(Number(anio), Number(mes));
      }

      const rango = obtenerRangoConsulta(tipoReporte, fecha, anio, mes);
      const [eventosData, creditosData] = await Promise.all([
        obtenerEventos(rango),
        obtenerCreditos(rango),
      ]);

      setReporte(data);
      setEventos(eventosData);
      setCreditos(creditosData);
      setPaginaReservaciones(1);
      setPaginaConsumos(1);
      setPaginaInventario(1);
      setPaginaEventos(1);
      setPaginaCreditos(1);
    } catch (err) {
      console.error(err);
      await alertaError('Error', 'No se pudo cargar el reporte financiero.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarReporte();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const consumosRestaurante = useMemo(() => {
    return reporte ? agruparConsumosRestaurante(reporte.ordenes) : [];
  }, [reporte]);

  const reservacionesPagina = reporte
    ? reporte.reservaciones.slice((paginaReservaciones - 1) * POR_PAGINA, paginaReservaciones * POR_PAGINA)
    : [];

  const consumosPagina = consumosRestaurante.slice((paginaConsumos - 1) * POR_PAGINA, paginaConsumos * POR_PAGINA);

  const inventarioPagina = reporte
    ? (reporte.movimientos_inventario || []).slice((paginaInventario - 1) * POR_PAGINA, paginaInventario * POR_PAGINA)
    : [];

  const eventosPagina = eventos.slice((paginaEventos - 1) * POR_PAGINA, paginaEventos * POR_PAGINA);
  const creditosPagina = creditos.slice((paginaCreditos - 1) * POR_PAGINA, paginaCreditos * POR_PAGINA);

  return (
    <div className="restaurante-page">
      <div className="page-header">
        <div>
          <h1>Reporte financiero</h1>
          <p>Ingresos, gastos de inventario y ganancia por día, semana o mes.</p>
        </div>
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label">Tipo de reporte</label>
              <select
                className="form-select"
                value={tipoReporte}
                onChange={(event) => setTipoReporte(event.target.value as 'DIA' | 'SEMANA' | 'MES')}
              >
                <option value="DIA">Día</option>
                <option value="SEMANA">Semana</option>
                <option value="MES">Mes</option>
              </select>
            </div>

            {tipoReporte === 'DIA' || tipoReporte === 'SEMANA' ? (
              <div className="col-md-3">
                <label className="form-label">
                  {tipoReporte === 'DIA' ? 'Fecha' : 'Fecha dentro de la semana'}
                </label>
                <input
                  type="date"
                  className="form-control"
                  value={fecha}
                  onChange={(event) => setFecha(event.target.value)}
                />
              </div>
            ) : (
              <>
                <div className="col-md-3">
                  <label className="form-label">Año</label>
                  <input
                    type="number"
                    className="form-control"
                    value={anio}
                    onChange={(event) => setAnio(event.target.value)}
                  />
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
            )}

            <div className="col-md-3">
              <button className="btn btn-palmar w-100" onClick={cargarReporte} disabled={cargando}>
                {cargando ? 'Consultando...' : 'Consultar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {cargando ? (
        <div className="alert alert-info">Cargando reporte...</div>
      ) : reporte ? (
        <>
          <div className="restaurante-stats-grid restaurante-stats-grid-wide">
            <div className="restaurante-stat-card">
              <span>Reservaciones cobradas</span>
              <strong>{dinero(reporte.resumen.total_reservaciones)}</strong>
            </div>

            <div className="restaurante-stat-card">
              <span>Restaurante directo</span>
              <strong>{dinero(reporte.resumen.total_restaurante ?? reporte.resumen.total_ordenes)}</strong>
            </div>

            <div className="restaurante-stat-card success">
              <span>Total ingresos</span>
              <strong>{dinero(reporte.resumen.total_ingresos ?? reporte.resumen.total_general)}</strong>
            </div>

            <div className="restaurante-stat-card danger">
              <span>Gastos inventario</span>
              <strong>{dinero(reporte.resumen.total_gastos_inventario)}</strong>
            </div>

            <div className="restaurante-stat-card success">
              <span>Ganancia total</span>
              <strong>{dinero(reporte.resumen.ganancia_total)}</strong>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-12 col-xl-4">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h4 className="restaurante-card-title">Ingresos por tipo de pago</h4>

                  {reporte.resumen.totales_por_tipo_pago.map((tipoPago) => (
                    <div className="restaurante-report-row" key={tipoPago.id}>
                      <span>{tipoPago.nombre}</span>
                      <strong>{dinero(tipoPago.total)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-12 col-xl-4">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h4 className="restaurante-card-title">Gastos por tipo de pago</h4>

                  {(reporte.resumen.gastos_por_tipo_pago || []).map((tipoPago) => (
                    <div className="restaurante-report-row" key={tipoPago.id}>
                      <span>{tipoPago.nombre}</span>
                      <strong>{dinero(tipoPago.total)}</strong>
                    </div>
                  ))}

                  {(!reporte.resumen.gastos_por_tipo_pago || reporte.resumen.gastos_por_tipo_pago.length === 0) && (
                    <div className="text-muted">No hay gastos agrupados por tipo de pago.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-12 col-xl-4">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h4 className="restaurante-card-title">Resumen de movimientos</h4>

                  <div className="row g-3">
                    <div className="col-md-4">
                      <div className="restaurante-report-box">
                        <span>Reservaciones pagadas</span>
                        <strong>{reporte.resumen.cantidad_reservaciones}</strong>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="restaurante-report-box">
                        <span>Recibos restaurante</span>
                        <strong>{consumosRestaurante.length}</strong>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="restaurante-report-box">
                        <span>Movimientos inventario</span>
                        <strong>{reporte.resumen.cantidad_movimientos_inventario || 0}</strong>
                      </div>
                    </div>
                  </div>

                  <small className="text-muted d-block mt-3">
                    Rango consultado: {formatearFecha(reporte.rango.inicio)} - {formatearFecha(reporte.rango.fin)}
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm mt-4">
            <div className="card-body">
              <h4 className="restaurante-card-title">Reservaciones pagadas</h4>

              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>NIT</th>
                      <th>Tipo de pago</th>
                      <th>Pagado</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>

                  <tbody>
                    {reservacionesPagina.map((reservacion) => (
                      <tr key={reservacion.id}>
                        <td>{reservacion.nombre_cliente}</td>
                        <td>{reservacion.nit || 'CF'}</td>
                        <td>{reservacion.tipo_pago?.nombre || 'Sin tipo'}</td>
                        <td>{dinero(reservacion.precio_pagado)}</td>
                        <td>{formatearFecha(reservacion.fecha_pago || reservacion.fecha_creacion)}</td>
                      </tr>
                    ))}

                    {reporte.reservaciones.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">
                          No hay reservaciones pagadas en este rango.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Paginacion
                total={reporte.reservaciones.length}
                pagina={paginaReservaciones}
                porPagina={POR_PAGINA}
                onCambiarPagina={setPaginaReservaciones}
              />
            </div>
          </div>

          <div className="card shadow-sm mt-4">
            <div className="card-body">
              <h4 className="restaurante-card-title">Consumos de restaurante</h4>

              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Cliente / referencia</th>
                      <th>Tipo de pago</th>
                      <th>Órdenes</th>
                      <th>Total</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>

                  <tbody>
                    {consumosPagina.map((consumo) => (
                      <tr key={consumo.clave}>
                        <td>{consumo.tipo}</td>
                        <td>{consumo.cliente}</td>
                        <td>{consumo.tipoPago}</td>
                        <td>{consumo.cantidadOrdenes}</td>
                        <td><strong>{dinero(consumo.total)}</strong></td>
                        <td>{formatearFecha(consumo.fecha)}</td>
                      </tr>
                    ))}

                    {consumosRestaurante.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center text-muted py-4">
                          No hay consumos de restaurante en este rango.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Paginacion
                total={consumosRestaurante.length}
                pagina={paginaConsumos}
                porPagina={POR_PAGINA}
                onCambiarPagina={setPaginaConsumos}
              />
            </div>
          </div>

          <div className="card shadow-sm mt-4">
            <div className="card-body">
              <h4 className="restaurante-card-title">Eventos</h4>

              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Empresa</th>
                      <th>Descripción</th>
                      <th>Personas</th>
                      <th>Estado</th>
                      <th>Total</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>

                  <tbody>
                    {eventosPagina.map((evento) => (
                      <tr key={evento.id}>
                        <td>{evento.cliente_nombre}</td>
                        <td>{evento.empresa || '-'}</td>
                        <td>{evento.descripcion || '-'}</td>
                        <td>{evento.cantidad_personas || 0}</td>
                        <td>
                          <span className={evento.estado === 'CERRADO' ? 'badge text-bg-success' : 'badge text-bg-warning'}>
                            {evento.estado}
                          </span>
                        </td>
                        <td><strong>{dinero(obtenerTotalEvento(evento))}</strong></td>
                        <td>{formatearFecha(obtenerFechaEvento(evento))}</td>
                      </tr>
                    ))}

                    {eventos.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center text-muted py-4">
                          No hay eventos en este rango.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Paginacion
                total={eventos.length}
                pagina={paginaEventos}
                porPagina={POR_PAGINA}
                onCambiarPagina={setPaginaEventos}
              />
            </div>
          </div>

          <div className="card shadow-sm mt-4">
            <div className="card-body">
              <h4 className="restaurante-card-title">Créditos</h4>

              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Empresa</th>
                      <th>NIT</th>
                      <th>Estado</th>
                      <th>Total</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>

                  <tbody>
                    {creditosPagina.map((credito) => (
                      <tr key={credito.id}>
                        <td>{credito.cliente_nombre}</td>
                        <td>{credito.empresa || '-'}</td>
                        <td>{credito.nit || 'CF'}</td>
                        <td>
                          <span className={credito.estado === 'PAGADO' ? 'badge text-bg-success' : 'badge text-bg-warning'}>
                            {credito.estado}
                          </span>
                        </td>
                        <td><strong>{dinero(obtenerTotalCredito(credito))}</strong></td>
                        <td>{formatearFecha(obtenerFechaCredito(credito))}</td>
                      </tr>
                    ))}

                    {creditos.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center text-muted py-4">
                          No hay créditos en este rango.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Paginacion
                total={creditos.length}
                pagina={paginaCreditos}
                porPagina={POR_PAGINA}
                onCambiarPagina={setPaginaCreditos}
              />
            </div>
          </div>

          <div className="card shadow-sm mt-4">
            <div className="card-body">
              <h4 className="restaurante-card-title">Gastos de inventario</h4>

              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>Cantidad</th>
                      <th>Costo unitario</th>
                      <th>Total</th>
                      <th>Tipo de pago</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>

                  <tbody>
                    {inventarioPagina.map((movimiento) => (
                      <tr key={movimiento.id}>
                        <td>{Number(movimiento.cantidad).toFixed(2)}</td>
                        <td>{dinero(movimiento.costo_unitario)}</td>
                        <td>{dinero(movimiento.total)}</td>
                        <td>{movimiento.tipo_pago?.nombre || 'Sin tipo'}</td>
                        <td>{formatearFecha(movimiento.fecha_movimiento)}</td>
                      </tr>
                    ))}

                    {(reporte.movimientos_inventario || []).length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">
                          No hay gastos de inventario en este rango.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Paginacion
                total={(reporte.movimientos_inventario || []).length}
                pagina={paginaInventario}
                porPagina={POR_PAGINA}
                onCambiarPagina={setPaginaInventario}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="alert alert-warning">No hay reporte cargado.</div>
      )}
    </div>
  );
}

export default ReporteFinanciero;
