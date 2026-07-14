import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  crearCategoriaInventario,
  crearMovimientoInventario,
  crearProductoInventario,
  obtenerCategoriasInventario,
  obtenerMovimientosInventario,
  obtenerProductosInventario,
} from '../../api/inventarioApi';
import Paginacion from '../../components/common/Paginacion';
import { alertaError, alertaExito } from '../../components/SweetAlert';
import type {
  CategoriaInventario,
  InventarioMovimiento,
  ProductoInventario,
} from '../../types';
import '../../styles/restaurante.css';

const POR_PAGINA = 10;

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

function calcularTotalMovimiento(movimiento: InventarioMovimiento) {
  return numero(movimiento.total) ||
    numero(movimiento.cantidad) * numero(movimiento.costo_unitario);
}

function InventarioManager() {
  const [categorias, setCategorias] = useState<CategoriaInventario[]>([]);
  const [productos, setProductos] = useState<ProductoInventario[]>([]);
  const [movimientos, setMovimientos] = useState<InventarioMovimiento[]>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [paginaProductos, setPaginaProductos] = useState(1);

  const [modalCategoria, setModalCategoria] = useState(false);
  const [modalProducto, setModalProducto] = useState(false);
  const [modalMovimiento, setModalMovimiento] = useState(false);

  const [categoriaNombre, setCategoriaNombre] = useState('');
  const [categoriaDescripcion, setCategoriaDescripcion] = useState('');

  const [productoCategoriaId, setProductoCategoriaId] = useState('');
  const [productoNombre, setProductoNombre] = useState('');
  const [productoStockInicial, setProductoStockInicial] = useState('0');
  const [productoStockMinimo, setProductoStockMinimo] = useState('0');
  const [productoCosto, setProductoCosto] = useState('0');
  const [productoTipoPagoId, setProductoTipoPagoId] = useState('1');

  const [movimientoProductoId, setMovimientoProductoId] = useState('');
  const [movimientoTipo, setMovimientoTipo] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA');
  const [movimientoCantidad, setMovimientoCantidad] = useState('1');
  const [movimientoCosto, setMovimientoCosto] = useState('0');
  const [movimientoTipoPagoId, setMovimientoTipoPagoId] = useState('1');
  const [movimientoObservacion, setMovimientoObservacion] = useState('');

  const cargarDatos = async () => {
    setCargando(true);

    try {
      const [categoriasData, productosData, movimientosData] = await Promise.all([
        obtenerCategoriasInventario(),
        obtenerProductosInventario(),
        obtenerMovimientosInventario(),
      ]);

      setCategorias(categoriasData);
      setProductos(productosData);
      setMovimientos(movimientosData);
      setPaginaProductos(1);
    } catch (err) {
      console.error(err);
      await alertaError('Error', 'No se pudo cargar el inventario.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const productosBajoStock = useMemo(() => {
    return productos.filter((producto) => {
      return numero(producto.stock_actual) <= numero(producto.stock_minimo);
    });
  }, [productos]);

  const productosPagina = useMemo(() => {
    const inicio = (paginaProductos - 1) * POR_PAGINA;
    return productos.slice(inicio, inicio + POR_PAGINA);
  }, [productos, paginaProductos]);

  const productosPorId = useMemo(() => {
    return productos.reduce<Record<number, ProductoInventario>>((acumulado, producto) => {
      acumulado[producto.id] = producto;
      return acumulado;
    }, {});
  }, [productos]);

  const totalGastoProductoInicial = numero(productoStockInicial) * numero(productoCosto);
  const totalGastoMovimiento = numero(movimientoCantidad) * numero(movimientoCosto);

  const limpiarProducto = () => {
    setProductoCategoriaId('');
    setProductoNombre('');
    setProductoStockInicial('0');
    setProductoStockMinimo('0');
    setProductoCosto('0');
    setProductoTipoPagoId('1');
  };

  const abrirModalProducto = () => {
    limpiarProducto();
    setModalProducto(true);
  };

  const seleccionarProductoMovimiento = (productoId: string) => {
    setMovimientoProductoId(productoId);

    const producto = productosPorId[Number(productoId)];

    if (producto) {
      setMovimientoCosto(String(producto.costo_unitario || 0));
    }
  };

  const guardarCategoria = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGuardando(true);

    try {
      await crearCategoriaInventario({
        nombre: categoriaNombre,
        descripcion: categoriaDescripcion,
      });

      setCategoriaNombre('');
      setCategoriaDescripcion('');
      setModalCategoria(false);

      await cargarDatos();
      await alertaExito('¡Categoría creada!', 'La categoría fue registrada correctamente.');
    } catch (err) {
      console.error(err);
      await alertaError('Error', 'No se pudo crear la categoría.');
    } finally {
      setGuardando(false);
    }
  };

  const guardarProducto = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGuardando(true);

    try {
      await crearProductoInventario({
        categoria_id: Number(productoCategoriaId),
        nombre: productoNombre,
        unidad_medida: 'UNIDADES',
        stock_actual: Number(productoStockInicial),
        stock_minimo: Number(productoStockMinimo),
        costo_unitario: Number(productoCosto),
        tipo_pago_id: Number(productoTipoPagoId),
      });

      limpiarProducto();
      setModalProducto(false);

      await cargarDatos();
      await alertaExito('¡Producto creado!', 'El producto fue registrado correctamente.');
    } catch (err) {
      console.error(err);
      await alertaError('Error', 'No se pudo crear el producto de inventario.');
    } finally {
      setGuardando(false);
    }
  };

  const guardarMovimiento = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGuardando(true);

    try {
      await crearMovimientoInventario({
        producto_inventario_id: Number(movimientoProductoId),
        tipo_movimiento: movimientoTipo,
        cantidad: Number(movimientoCantidad),
        costo_unitario: Number(movimientoCosto),
        tipo_pago_id: Number(movimientoTipoPagoId),
        observacion: movimientoObservacion,
      });

      setMovimientoProductoId('');
      setMovimientoTipo('ENTRADA');
      setMovimientoCantidad('1');
      setMovimientoCosto('0');
      setMovimientoTipoPagoId('1');
      setMovimientoObservacion('');
      setModalMovimiento(false);

      await cargarDatos();
      await alertaExito('¡Movimiento registrado!', 'El stock fue actualizado correctamente.');
    } catch (err) {
      console.error(err);
      await alertaError('Error', 'No se pudo registrar el movimiento.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="restaurante-page">
      <div className="page-header">
        <div>
          <h1>Inventario</h1>
          <p>Control de productos, stock y movimientos del restaurante.</p>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <button className="btn btn-outline-secondary" onClick={() => setModalCategoria(true)}>
            Nueva categoría
          </button>

          <button className="btn btn-outline-secondary" onClick={abrirModalProducto}>
            Nuevo producto
          </button>

          <button className="btn btn-palmar" onClick={() => setModalMovimiento(true)}>
            Movimiento
          </button>
        </div>
      </div>

      <div className="restaurante-stats-grid">
        <div className="restaurante-stat-card">
          <span>Categorías</span>
          <strong>{categorias.length}</strong>
        </div>

        <div className="restaurante-stat-card">
          <span>Productos</span>
          <strong>{productos.length}</strong>
        </div>

        <div className="restaurante-stat-card danger">
          <span>Bajo stock</span>
          <strong>{productosBajoStock.length}</strong>
        </div>
      </div>

      {cargando ? (
        <div className="alert alert-info">Cargando inventario...</div>
      ) : (
        <div className="row g-4">
          <div className="col-12 col-xl-8">
            <div className="card shadow-sm">
              <div className="card-body">
                <h4 className="restaurante-card-title">Productos de inventario</h4>

                <div className="table-responsive">
                  <table className="table align-middle">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Categoría</th>
                        <th>Stock</th>
                        <th>Mínimo</th>
                        <th>Costo</th>
                        <th>Estado</th>
                      </tr>
                    </thead>

                    <tbody>
                      {productosPagina.map((producto) => {
                        const bajoStock = numero(producto.stock_actual) <= numero(producto.stock_minimo);

                        return (
                          <tr key={producto.id}>
                            <td><strong>{producto.nombre}</strong></td>
                            <td>{producto.categoria?.nombre || 'Sin categoría'}</td>
                            <td>{numero(producto.stock_actual).toFixed(2)}</td>
                            <td>{numero(producto.stock_minimo).toFixed(2)}</td>
                            <td>{dinero(producto.costo_unitario)}</td>
                            <td>
                              <span className={bajoStock ? 'badge text-bg-danger' : 'badge text-bg-success'}>
                                {bajoStock ? 'Bajo stock' : 'Normal'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}

                      {productos.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center text-muted py-4">
                            No hay productos registrados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <Paginacion
                  total={productos.length}
                  pagina={paginaProductos}
                  porPagina={POR_PAGINA}
                  onCambiarPagina={setPaginaProductos}
                />
              </div>
            </div>
          </div>

          <div className="col-12 col-xl-4">
            <div className="card shadow-sm">
              <div className="card-body">
                <h4 className="restaurante-card-title">Últimos movimientos</h4>

                <div className="restaurante-timeline restaurante-timeline-scroll">
                  {movimientos.slice(0, 8).map((movimiento) => (
                    <div className="restaurante-timeline-item" key={movimiento.id}>
                      <div>
                        <strong>{movimiento.producto?.nombre || 'Producto'}</strong>
                        <p>
                          {movimiento.tipo_movimiento} · {numero(movimiento.cantidad).toFixed(2)}
                        </p>
                        <small>
                          Stock nuevo: {numero(movimiento.stock_nuevo).toFixed(2)} ·{' '}
                          {movimiento.tipo_pago ? `${movimiento.tipo_pago.nombre} · ` : ''}
                          {formatearFecha(movimiento.fecha_movimiento)}
                        </small>
                      </div>

                      <span>{dinero(calcularTotalMovimiento(movimiento))}</span>
                    </div>
                  ))}

                  {movimientos.length === 0 && (
                    <div className="text-muted">No hay movimientos registrados.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalCategoria && (
        <>
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <form onSubmit={guardarCategoria}>
                  <div className="modal-header modal-palmar">
                    <h5 className="modal-title">Nueva categoría de inventario</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={() => setModalCategoria(false)} />
                  </div>

                  <div className="modal-body">
                    <label className="form-label">Nombre</label>
                    <input className="form-control mb-3" value={categoriaNombre} onChange={(event) => setCategoriaNombre(event.target.value)} required />

                    <label className="form-label">Descripción</label>
                    <textarea className="form-control" value={categoriaDescripcion} onChange={(event) => setCategoriaDescripcion(event.target.value)} rows={3} />
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setModalCategoria(false)}>Cancelar</button>
                    <button className="btn btn-palmar" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}

      {modalProducto && (
        <>
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <form onSubmit={guardarProducto}>
                  <div className="modal-header modal-palmar">
                    <h5 className="modal-title">Nuevo producto de inventario</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={() => setModalProducto(false)} />
                  </div>

                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Categoría</label>
                        <select className="form-select" value={productoCategoriaId} onChange={(event) => setProductoCategoriaId(event.target.value)} required>
                          <option value="">Seleccione...</option>
                          {categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>)}
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Nombre</label>
                        <input className="form-control" value={productoNombre} onChange={(event) => setProductoNombre(event.target.value)} required />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Stock inicial</label>
                        <input type="number" className="form-control" value={productoStockInicial} onChange={(event) => setProductoStockInicial(event.target.value)} min="0" step="0.01" required />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Stock mínimo</label>
                        <input type="number" className="form-control" value={productoStockMinimo} onChange={(event) => setProductoStockMinimo(event.target.value)} min="0" step="0.01" required />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Costo unitario</label>
                        <input type="number" className="form-control" value={productoCosto} onChange={(event) => setProductoCosto(event.target.value)} min="0" step="0.01" required />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Tipo de pago</label>
                        <select className="form-select" value={productoTipoPagoId} onChange={(event) => setProductoTipoPagoId(event.target.value)} required>
                          <option value="1">Efectivo</option>
                          <option value="2">POS</option>
                          <option value="3">Cheque</option>
                        </select>
                      </div>

                      <div className="col-12">
                        <div className="alert alert-info mb-0">
                          Gasto inicial estimado: <strong>{dinero(totalGastoProductoInicial)}</strong>
                          {' '}({numero(productoStockInicial).toFixed(2)} x {dinero(productoCosto)})
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setModalProducto(false)}>Cancelar</button>
                    <button className="btn btn-palmar" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}

      {modalMovimiento && (
        <>
          <div className="modal fade show d-block" tabIndex={-1}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <form onSubmit={guardarMovimiento}>
                  <div className="modal-header modal-palmar">
                    <h5 className="modal-title">Registrar movimiento</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={() => setModalMovimiento(false)} />
                  </div>

                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">Producto</label>
                        <select className="form-select" value={movimientoProductoId} onChange={(event) => seleccionarProductoMovimiento(event.target.value)} required>
                          <option value="">Seleccione...</option>
                          {productos.map((producto) => <option key={producto.id} value={producto.id}>{producto.nombre}</option>)}
                        </select>
                      </div>

                      <div className="col-md-3">
                        <label className="form-label">Tipo</label>
                        <select className="form-select" value={movimientoTipo} onChange={(event) => setMovimientoTipo(event.target.value as 'ENTRADA' | 'SALIDA')} required>
                          <option value="ENTRADA">Entrada</option>
                          <option value="SALIDA">Salida</option>
                        </select>
                      </div>

                      <div className="col-md-3">
                        <label className="form-label">Cantidad</label>
                        <input type="number" className="form-control" value={movimientoCantidad} onChange={(event) => setMovimientoCantidad(event.target.value)} min="0" step="0.01" required />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Costo unitario</label>
                        <input type="number" className="form-control" value={movimientoCosto} onChange={(event) => setMovimientoCosto(event.target.value)} min="0" step="0.01" />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Tipo de pago</label>
                        <select
                          className="form-select"
                          value={movimientoTipoPagoId}
                          onChange={(event) => setMovimientoTipoPagoId(event.target.value)}
                          required
                        >
                          <option value="1">Efectivo</option>
                          <option value="2">POS</option>
                          <option value="3">Cheque</option>
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Observación</label>
                        <input className="form-control" value={movimientoObservacion} onChange={(event) => setMovimientoObservacion(event.target.value)} />
                      </div>

                      <div className="col-12">
                        <div className="alert alert-info mb-0">
                          Total del movimiento: <strong>{dinero(totalGastoMovimiento)}</strong>
                          {' '}({numero(movimientoCantidad).toFixed(2)} x {dinero(movimientoCosto)})
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setModalMovimiento(false)}>Cancelar</button>
                    <button className="btn btn-palmar" disabled={guardando}>{guardando ? 'Guardando...' : 'Registrar'}</button>
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

export default InventarioManager;
