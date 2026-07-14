import { useCallback, useEffect, useRef, useState } from 'react';
import { actualizarEstadoOrden, cancelarOrden, obtenerOrdenesCocinaHoy } from '../../api/ordenesApi';
import { alertaError, alertaExito } from '../../components/SweetAlert';
import type { Orden, OrdenDetalle } from '../../types';
import '../../styles/restaurante.css';

function formatearFecha(fecha: string | undefined | null) {
  if (!fecha) return 'Sin fecha';
  return new Date(fecha).toLocaleString('es-GT');
}

function obtenerBadgeOrden(estado: Orden['estado']) {
  if (estado === 'LISTA') return 'badge text-bg-success';
  if (estado === 'EN_COCINA') return 'badge text-bg-warning';
  if (estado === 'CANCELADA') return 'badge text-bg-danger';
  if (estado === 'ENTREGADA') return 'badge text-bg-primary';
  return 'badge text-bg-secondary';
}

function obtenerTituloOrden(orden: Orden) {
  if (orden.tipo_orden === 'MESA') return `Mesa ${orden.numero_mesa || ''}`;
  if (orden.tipo_orden === 'LLEVAR') return 'Para llevar';
  if (orden.tipo_orden === 'HABITACION') return `Habitación ${orden.habitacion?.numero || orden.habitacion_id || ''}`;
  if (orden.tipo_orden === 'EMPLEADO') return 'Empleado / comida interna';
  if (orden.tipo_orden === 'EVENTO') return 'Evento';
  if (orden.tipo_orden === 'CREDITO') return 'Crédito';
  return 'Orden';
}

function obtenerBadgeDetalle(estado: OrdenDetalle['estado_cocina']) {
  if (estado === 'LISTO') return 'badge text-bg-success';
  if (estado === 'EN_PREPARACION') return 'badge text-bg-warning';
  if (estado === 'ENTREGADO') return 'badge text-bg-primary';
  return 'badge text-bg-secondary';
}

function CocinaOrdenes() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [cargando, setCargando] = useState(false);
  const [actualizandoId, setActualizandoId] = useState<number | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string>('');
  const [ordenCancelar, setOrdenCancelar] = useState<Orden | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [cancelandoId, setCancelandoId] = useState<number | null>(null);
  const yaMostroErrorRef = useRef(false);

  const cargarOrdenes = useCallback(async (mostrarCarga = false) => {
    if (mostrarCarga) {
      setCargando(true);
    }

    try {
      const data = await obtenerOrdenesCocinaHoy();
      setOrdenes(data.filter((orden) => orden.estado !== 'ENTREGADA'));
      setUltimaActualizacion(new Date().toLocaleTimeString('es-GT'));
      yaMostroErrorRef.current = false;
    } catch (err) {
      console.error(err);

      if (!yaMostroErrorRef.current) {
        yaMostroErrorRef.current = true;
        await alertaError('Error', 'No se pudieron cargar las órdenes de cocina.');
      }
    } finally {
      if (mostrarCarga) {
        setCargando(false);
      }
    }
  }, []);

  useEffect(() => {
    cargarOrdenes(true);

    const intervalo = window.setInterval(() => {
      cargarOrdenes(false);
    }, 5000);

    return () => {
      window.clearInterval(intervalo);
    };
  }, [cargarOrdenes]);


  const abrirCancelacion = (orden: Orden) => {
    setOrdenCancelar(orden);
    setMotivoCancelacion('');
  };

  const cerrarCancelacion = () => {
    if (cancelandoId) {
      return;
    }

    setOrdenCancelar(null);
    setMotivoCancelacion('');
  };

  const confirmarCancelacion = async () => {
    if (!ordenCancelar) {
      return;
    }

    setCancelandoId(ordenCancelar.id);

    try {
      await cancelarOrden(ordenCancelar.id, {
        motivo: motivoCancelacion || 'Cancelación desde cocina',
      });

      setOrdenes((actual) => actual.filter((item) => item.id !== ordenCancelar.id));
      setOrdenCancelar(null);
      setMotivoCancelacion('');

      await alertaExito(
        '¡Orden cancelada!',
        'La orden fue cancelada y el inventario fue revertido.',
      );

      await cargarOrdenes(false);
    } catch (err) {
      console.error(err);
      await alertaError('Error', 'No se pudo cancelar la orden.');
    } finally {
      setCancelandoId(null);
    }
  };

  const marcarRealizada = async (orden: Orden) => {
    setActualizandoId(orden.id);

    try {
      await actualizarEstadoOrden(orden.id, 'ENTREGADA');

      setOrdenes((actual) => actual.filter((item) => item.id !== orden.id));

      await alertaExito(
        '¡Orden realizada!',
        'La orden fue marcada como realizada y salió de la pantalla de cocina.',
      );

      await cargarOrdenes(false);
    } catch (err) {
      console.error(err);
      await alertaError('Error', 'No se pudo marcar la orden como realizada.');
    } finally {
      setActualizandoId(null);
    }
  };

  return (
    <div className="restaurante-page">
      <div className="page-header">
        <div>
          <h1>Cocina</h1>
          <p>Las órdenes del día se actualizan automáticamente cada 5 segundos.</p>
          {ultimaActualizacion && (
            <small className="text-muted">
              Última actualización: {ultimaActualizacion}
            </small>
          )}
        </div>
      </div>

      {cargando ? (
        <div className="alert alert-info">Cargando órdenes...</div>
      ) : (
        <div className="restaurante-kitchen-grid">
          {ordenes.map((orden) => (
            <article className="restaurante-kitchen-card shadow-sm" key={orden.id}>
              <header>
                <div>
                  <span className="restaurante-label">Orden de cocina</span>
                  <h3>{obtenerTituloOrden(orden)}</h3>
                  <small>{formatearFecha(orden.fecha_creacion)}</small>
                </div>

                <span className={obtenerBadgeOrden(orden.estado)}>{orden.estado}</span>
              </header>

              {orden.observaciones && (
                <div className="alert alert-light py-2 mb-3">
                  {orden.observaciones}
                </div>
              )}

              <div className="restaurante-kitchen-details">
                {orden.detalles.map((detalle) => (
                  <div className="restaurante-kitchen-detail" key={detalle.id}>
                    <div className="w-100">
                      <div className="restaurante-kitchen-detail-title">
                        <strong>{detalle.cantidad} x {detalle.menu_item?.nombre || 'Producto'}</strong>
                        {detalle.observaciones && <p className="mb-0">{detalle.observaciones}</p>}
                      </div>

                      {(detalle.ingredientes || []).length > 0 && (
                        <div className="restaurante-kitchen-ingredients">
                          {(detalle.ingredientes || []).map((ingrediente) => (
                            <div
                              key={`${detalle.id}-${ingrediente.producto_inventario_id}`}
                              className={
                                ingrediente.excluido
                                  ? 'restaurante-kitchen-ingredient removed'
                                  : 'restaurante-kitchen-ingredient keep'
                              }
                            >
                              <span>
                                {ingrediente.excluido ? 'No lleva' : 'Lleva'} {ingrediente.producto?.nombre || 'Ingrediente'}
                              </span>
                              <strong>
                                {Number(ingrediente.cantidad_total || 0).toFixed(2)} {ingrediente.producto?.unidad_medida || ''}
                              </strong>
                            </div>
                          ))}
                        </div>
                      )}

                      {(detalle.exclusiones || []).length > 0 && (
                        <div className="restaurante-kitchen-exclusions mt-2">
                          Sin {(detalle.exclusiones || []).map((producto) => producto.nombre).join(', ')}
                        </div>
                      )}
                    </div>

                    <span className={obtenerBadgeDetalle(detalle.estado_cocina)}>
                      {detalle.estado_cocina}
                    </span>
                  </div>
                ))}
              </div>

              <div className="d-flex gap-2 mt-3">
                <button
                  type="button"
                  className="btn btn-outline-danger w-50"
                  disabled={actualizandoId === orden.id || cancelandoId === orden.id}
                  onClick={() => abrirCancelacion(orden)}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="btn btn-success w-50"
                  disabled={actualizandoId === orden.id || cancelandoId === orden.id}
                  onClick={() => marcarRealizada(orden)}
                >
                  {actualizandoId === orden.id ? 'Marcando...' : 'Realizada'}
                </button>
              </div>
            </article>
          ))}

          {ordenes.length === 0 && (
            <div className="alert alert-info">No hay órdenes de cocina para hoy.</div>
          )}
        </div>
      )}

      {ordenCancelar && (
        <>
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-md modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header modal-palmar">
                  <h5 className="modal-title">Cancelar orden</h5>

                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={cerrarCancelacion}
                    disabled={cancelandoId === ordenCancelar.id}
                  />
                </div>

                <div className="modal-body">
                  <p className="text-muted">
                    Al cancelar la orden, los productos consumidos se regresarán al inventario.
                  </p>

                  <label className="form-label">Motivo</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={motivoCancelacion}
                    onChange={(event) => setMotivoCancelacion(event.target.value)}
                    placeholder="Ejemplo: cliente canceló el pedido"
                  />
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={cerrarCancelacion}
                    disabled={cancelandoId === ordenCancelar.id}
                  >
                    Cerrar
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={confirmarCancelacion}
                    disabled={cancelandoId === ordenCancelar.id}
                  >
                    {cancelandoId === ordenCancelar.id ? 'Cancelando...' : 'Confirmar cancelación'}
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

export default CocinaOrdenes;
