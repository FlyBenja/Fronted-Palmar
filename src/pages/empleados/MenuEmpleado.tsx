import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { obtenerHabitaciones } from '../../api/habitacionesApi';
import { obtenerCategoriasMenu, obtenerMenuItems } from '../../api/menuApi';
import { crearOrden, obtenerFacturasPendientesPago } from '../../api/ordenesApi';
import { obtenerReservaciones } from '../../api/reservacionesApi';
import {
  alertaAdvertencia,
  alertaError,
  alertaExito,
} from '../../components/SweetAlert';
import type {
  CategoriaMenu,
  CrearOrdenPayload,
  Habitacion,
  MenuItem,
  Reservacion,
  FacturaPendientePago,
} from '../../types';
import '../../styles/restaurante.css';

const apiUrl = import.meta.env.VITE_API_URL;

interface CarritoItem {
  lineaId: string;
  item: MenuItem;
  cantidad: number;
  observaciones: string;
  exclusiones_productos: number[];
}

function numero(valor: string | number | undefined | null) {
  return Number(valor || 0);
}

function dinero(valor: string | number | undefined | null) {
  return `Q${numero(valor).toFixed(2)}`;
}

function construirUrlImagen(imagenUrl: string | null) {
  if (!imagenUrl) {
    return '';
  }

  if (imagenUrl.startsWith('http')) {
    return imagenUrl;
  }

  return `${apiUrl}${imagenUrl}`;
}

function esHabitacionOcupada(habitacion: Habitacion) {
  return habitacion.estado.toLowerCase() === 'ocupada' ||
    habitacion.estado.toLowerCase() === 'ocupado';
}

function esReservacionConfirmada(reservacion: Reservacion) {
  return reservacion.estado.toUpperCase() === 'CONFIRMADA';
}

function MenuEmpleado() {
  const [categorias, setCategorias] = useState<CategoriaMenu[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [reservaciones, setReservaciones] = useState<Reservacion[]>([]);
  const [recibosPendientes, setRecibosPendientes] = useState<FacturaPendientePago[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('TODAS');
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [tipoOrden, setTipoOrden] = useState<'MESA' | 'LLEVAR' | 'HABITACION' | 'EMPLEADO'>('MESA');
  const [numeroMesa, setNumeroMesa] = useState('');
  const [habitacionId, setHabitacionId] = useState('');
  const [reservacionId, setReservacionId] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const cargarMenu = async () => {
    setCargando(true);

    try {
      const [categoriasData, itemsData, habitacionesData, reservacionesData, recibosPendientesData] = await Promise.all([
        obtenerCategoriasMenu(),
        obtenerMenuItems(true),
        obtenerHabitaciones(),
        obtenerReservaciones(),
        obtenerFacturasPendientesPago(),
      ]);

      setCategorias(categoriasData);
      setItems(itemsData);
      setHabitaciones(habitacionesData);
      setReservaciones(reservacionesData);
      setRecibosPendientes(recibosPendientesData);
    } catch (err) {
      console.error(err);
      await alertaError('Error', 'No se pudo cargar el menú.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMenu();
  }, []);

  const itemsFiltrados = useMemo(() => {
    if (categoriaSeleccionada === 'TODAS') {
      return items;
    }

    return items.filter((item) => item.categoria_menu_id === Number(categoriaSeleccionada));
  }, [items, categoriaSeleccionada]);

  const reservacionesHabitacionOcupada = useMemo(() => {
    const habitacionesOcupadasIds = new Set(
      habitaciones.filter(esHabitacionOcupada).map((habitacion) => habitacion.id),
    );

    return reservaciones.filter((reservacion) => {
      return (
        esReservacionConfirmada(reservacion) &&
        reservacion.habitacion &&
        habitacionesOcupadasIds.has(reservacion.habitacion.id)
      );
    });
  }, [habitaciones, reservaciones]);

  const total = useMemo(() => {
    if (tipoOrden === 'EMPLEADO') {
      return 0;
    }

    return carrito.reduce((acumulado, carritoItem) => {
      return acumulado + numero(carritoItem.item.precio) * carritoItem.cantidad;
    }, 0);
  }, [carrito, tipoOrden]);

  const esBebida = (item: MenuItem) => {
    return String(item.tipo || '').toUpperCase() === 'BEBIDA';
  };

  const existeReciboPendienteMesaActual = useMemo(() => {
    if (tipoOrden !== 'MESA' || !numeroMesa.trim()) {
      return false;
    }

    const mesaNormalizada = numeroMesa.trim().toLowerCase().replace(/^mesa\s*/i, '');

    return recibosPendientes.some((factura) => {
      if (factura.tipo_orden !== 'MESA') {
        return false;
      }

      const mesaFactura = String(factura.numero_mesa || '')
        .trim()
        .toLowerCase()
        .replace(/^mesa\s*/i, '');

      return mesaFactura === mesaNormalizada;
    });
  }, [numeroMesa, recibosPendientes, tipoOrden]);

  const enviarDirectoAlRecibo = useMemo(() => {
    return (
      tipoOrden === 'MESA' &&
      existeReciboPendienteMesaActual &&
      carrito.length > 0 &&
      carrito.every((carritoItem) => esBebida(carritoItem.item))
    );
  }, [carrito, existeReciboPendienteMesaActual, tipoOrden]);

  const agregarAlCarrito = (item: MenuItem) => {
    setCarrito((actual) => [
      ...actual,
      {
        lineaId: `${item.id}-${Date.now()}-${Math.random()}`,
        item,
        cantidad: 1,
        observaciones: '',
        exclusiones_productos: [],
      },
    ]);
  };

  const cambiarCantidad = (lineaId: string, cantidad: number) => {
    if (cantidad <= 0) {
      setCarrito((actual) => actual.filter((carritoItem) => carritoItem.lineaId !== lineaId));
      return;
    }

    setCarrito((actual) => actual.map((carritoItem) => {
      if (carritoItem.lineaId !== lineaId) {
        return carritoItem;
      }

      return {
        ...carritoItem,
        cantidad,
      };
    }));
  };

  const cambiarObservacionesDetalle = (lineaId: string, valor: string) => {
    setCarrito((actual) => actual.map((carritoItem) => {
      if (carritoItem.lineaId !== lineaId) {
        return carritoItem;
      }

      return {
        ...carritoItem,
        observaciones: valor,
      };
    }));
  };


  const alternarExclusionProducto = (lineaId: string, productoId: number) => {
    setCarrito((actual) => actual.map((carritoItem) => {
      if (carritoItem.lineaId !== lineaId) {
        return carritoItem;
      }

      const yaExcluido = carritoItem.exclusiones_productos.includes(productoId);

      return {
        ...carritoItem,
        exclusiones_productos: yaExcluido
          ? carritoItem.exclusiones_productos.filter((id) => id !== productoId)
          : [...carritoItem.exclusiones_productos, productoId],
      };
    }));
  };

  const cambiarTipoOrden = (valor: 'MESA' | 'LLEVAR' | 'HABITACION' | 'EMPLEADO') => {
    setTipoOrden(valor);
    setNumeroMesa('');
    setHabitacionId('');
    setReservacionId('');
  };

  const seleccionarReservacionHabitacion = (valor: string) => {
    setReservacionId(valor);

    const reservacionSeleccionada = reservacionesHabitacionOcupada.find((reservacion) => {
      return reservacion.id === Number(valor);
    });

    setHabitacionId(
      reservacionSeleccionada?.habitacion
        ? String(reservacionSeleccionada.habitacion.id)
        : '',
    );
  };

  const enviarOrden = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (carrito.length === 0) {
      await alertaError('Orden vacía', 'Agrega al menos un producto del menú.');
      return;
    }

    if (tipoOrden === 'MESA' && !numeroMesa.trim()) {
      await alertaAdvertencia(
        'Mesa requerida',
        'Debes escribir el número de mesa para crear la orden.',
      );
      return;
    }

    if (tipoOrden === 'HABITACION' && (!habitacionId || !reservacionId)) {
      await alertaAdvertencia(
        'Habitación requerida',
        'Debes seleccionar una habitación ocupada para cargar la orden a la reservación.',
      );
      return;
    }

    setGuardando(true);

    try {
      const payload: CrearOrdenPayload = {
        tipo_orden: tipoOrden,
        observaciones,
        directo_recibo: enviarDirectoAlRecibo,
        detalles: carrito.map((carritoItem) => ({
          menu_item_id: carritoItem.item.id,
          cantidad: carritoItem.cantidad,
          observaciones: carritoItem.observaciones,
          exclusiones_productos: carritoItem.exclusiones_productos,
        })),
      };

      if (tipoOrden === 'MESA') {
        payload.numero_mesa = numeroMesa.trim();
      }

      if (tipoOrden === 'HABITACION') {
        payload.habitacion_id = Number(habitacionId);
        payload.reservacion_id = Number(reservacionId);
      }

      await crearOrden(payload);

      setCarrito([]);
      setTipoOrden('MESA');
      setNumeroMesa('');
      setHabitacionId('');
      setReservacionId('');
      setObservaciones('');

      await cargarMenu();

      await alertaExito(
        enviarDirectoAlRecibo ? '¡Recibo actualizado!' : '¡Orden enviada!',
        enviarDirectoAlRecibo
          ? 'Las bebidas fueron agregadas directamente al recibo pendiente.'
          : 'La orden fue enviada a cocina correctamente.',
      );
    } catch (err) {
      console.error(err);
      await alertaError('Error', 'No se pudo crear la orden.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="restaurante-page">
      <div className="page-header">
        <div>
          <h1>Menú</h1>
          <p>Selecciona productos y envía órdenes a cocina.</p>
        </div>
      </div>

      <div className="restaurante-menu-layout">
        <section>
          <div className="restaurante-tabs">
            <button
              type="button"
              className={categoriaSeleccionada === 'TODAS' ? 'active' : ''}
              onClick={() => setCategoriaSeleccionada('TODAS')}
            >
              Todas
            </button>

            {categorias.map((categoria) => (
              <button
                type="button"
                key={categoria.id}
                className={categoriaSeleccionada === String(categoria.id) ? 'active' : ''}
                onClick={() => setCategoriaSeleccionada(String(categoria.id))}
              >
                {categoria.nombre}
              </button>
            ))}
          </div>

          {cargando ? (
            <div className="alert alert-info">Cargando menú...</div>
          ) : (
            <div className="restaurante-menu-grid">
              {itemsFiltrados.map((item) => (
                <article className="restaurante-menu-card" key={item.id}>
                  {item.imagen_url ? (
                    <img
                      className="restaurante-menu-card-image"
                      src={construirUrlImagen(item.imagen_url)}
                      alt={item.nombre}
                    />
                  ) : (
                    <div className="restaurante-menu-card-image empty">
                      Sin imagen
                    </div>
                  )}

                  <div className="restaurante-menu-card-body">
                    <span className="badge text-bg-light">{item.tipo}</span>
                    <h4>{item.nombre}</h4>
                    <p>{item.descripcion || 'Sin descripción'}</p>
                  </div>

                  <div className="restaurante-menu-card-footer">
                    <strong>{dinero(item.precio)}</strong>
                    <button
                      type="button"
                      className="btn btn-sm btn-palmar"
                      onClick={() => agregarAlCarrito(item)}
                    >
                      Agregar
                    </button>
                  </div>
                </article>
              ))}

              {itemsFiltrados.length === 0 && (
                <div className="alert alert-warning">No hay productos disponibles en esta categoría.</div>
              )}
            </div>
          )}
        </section>

        <aside className="restaurante-order-card shadow-sm">
          <form onSubmit={enviarOrden}>
            <h3>Orden actual</h3>

            <div className="row g-2 mb-3">
              <div className="col-12">
                <label className="form-label">Tipo de orden</label>
                <select
                  className="form-select"
                  value={tipoOrden}
                  onChange={(event) =>
                    cambiarTipoOrden(event.target.value as 'MESA' | 'LLEVAR' | 'HABITACION' | 'EMPLEADO')
                  }
                >
                  <option value="MESA">Mesa</option>
                  <option value="LLEVAR">Para llevar</option>
                    <option value="EMPLEADO">Empleado / comida interna</option>
                  <option value="HABITACION">Habitación</option>
                </select>
              </div>

              {tipoOrden === 'MESA' && (
                <div className="col-12">
                  <label className="form-label">Número de mesa</label>
                  <input
                    className="form-control"
                    value={numeroMesa}
                    onChange={(event) => setNumeroMesa(event.target.value)}
                    placeholder="Mesa 1"
                    required
                  />
                </div>
              )}

              {tipoOrden === 'EMPLEADO' && (
                  <div className="alert alert-info">
                    Esta orden es consumo interno de empleado: se descuenta inventario, pasa a cocina y queda con total Q0.00.
                  </div>
                )}

                {tipoOrden === 'HABITACION' && (
                <div className="col-12">
                  <label className="form-label">Habitación ocupada</label>
                  <select
                    className="form-select"
                    value={reservacionId}
                    onChange={(event) => seleccionarReservacionHabitacion(event.target.value)}
                    required
                  >
                    <option value="">Seleccione una habitación ocupada</option>
                    {reservacionesHabitacionOcupada.map((reservacion) => (
                      <option key={reservacion.id} value={reservacion.id}>
                        Habitación {reservacion.habitacion?.numero} - {reservacion.nombre_cliente}
                      </option>
                    ))}
                  </select>

                  {reservacionesHabitacionOcupada.length === 0 && (
                    <small className="text-danger d-block mt-2">
                      No hay habitaciones ocupadas con reservación confirmada.
                    </small>
                  )}
                </div>
              )}
            </div>

            <div className="restaurante-cart-list">
              {carrito.map((carritoItem) => (
                <div className="restaurante-cart-item" key={carritoItem.lineaId}>
                  <div>
                    <strong>{carritoItem.item.nombre}</strong>
                    <span>{dinero(carritoItem.item.precio)} c/u</span>
                  </div>

                  <div className="d-flex gap-2 align-items-center">
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={carritoItem.cantidad}
                      min="0"
                      onChange={(event) => cambiarCantidad(carritoItem.lineaId, Number(event.target.value))}
                    />
                    <strong>{dinero(numero(carritoItem.item.precio) * carritoItem.cantidad)}</strong>
                  </div>

                  <input
                    className="form-control form-control-sm mt-2"
                    placeholder="Observaciones del plato"
                    value={carritoItem.observaciones}
                    onChange={(event) => cambiarObservacionesDetalle(carritoItem.lineaId, event.target.value)}
                  />

                  {(carritoItem.item.ingredientes || []).length > 0 && (
                    <div className="restaurante-exclusion-box mt-2">
                      <small>Quitar del plato:</small>

                      {(carritoItem.item.ingredientes || []).map((ingrediente) => {
                        const producto = ingrediente.producto;

                        if (!producto) {
                          return null;
                        }

                        return (
                          <label key={producto.id} className="form-check restaurante-exclusion-check">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={carritoItem.exclusiones_productos.includes(producto.id)}
                              onChange={() => alternarExclusionProducto(carritoItem.lineaId, producto.id)}
                            />
                            <span className="form-check-label">Sin {producto.nombre}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {carrito.length === 0 && (
                <div className="restaurante-empty-cart">Agrega productos del menú.</div>
              )}
            </div>

            <label className="form-label mt-3">Observaciones generales</label>
            <textarea className="form-control" rows={2} value={observaciones} onChange={(event) => setObservaciones(event.target.value)} />

            {enviarDirectoAlRecibo && (
              <div className="alert alert-info mt-3 mb-0">
                Esta mesa ya tiene un recibo pendiente. Las bebidas se sumarán directo al recibo y no irán a cocina.
              </div>
            )}

            <div className="restaurante-order-total">
              <span>Total</span>
              <strong>{dinero(total)}</strong>
            </div>

            <button className="btn btn-palmar w-100" disabled={guardando || carrito.length === 0}>
              {guardando ? 'Enviando...' : 'Enviar a cocina'}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}

export default MenuEmpleado;
