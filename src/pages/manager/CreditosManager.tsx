import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { crearCredito, agregarCargoCredito, obtenerCreditos, obtenerFacturaCredito, pagarCredito } from '../../api/creditosApi';
import { obtenerHabitaciones } from '../../api/habitacionesApi';
import { obtenerMenuItems } from '../../api/menuApi';
import { crearOrden } from '../../api/ordenesApi';
import { obtenerTarifas } from '../../api/tarifasApi';
import Paginacion from '../../components/common/Paginacion';
import { alertaError, alertaExito } from '../../components/SweetAlert';
import type { CreditoCuenta, FacturaCredito, Habitacion, MenuItem, TarifaHabitacion } from '../../types';
import '../../styles/restaurante.css';
import '../../styles/facturaReservacion.css';

type TipoCargoCredito = 'HABITACION' | 'RESTAURANTE' | 'MANUAL';

interface ItemCreditoCarrito {
  lineaId: string;
  menu_item_id: number;
  cantidad: number;
  observaciones: string;
  exclusiones_productos: number[];
}

const POR_PAGINA = 10;

function numero(valor: string | number | undefined | null) { return Number(valor || 0); }
function dinero(valor: string | number | undefined | null) { return `Q${numero(valor).toFixed(2)}`; }
function fechaHora(fecha: string | undefined | null) { return fecha ? new Date(fecha).toLocaleString('es-GT') : 'Sin fecha'; }
function fechaActualLocal() {
  const fecha = new Date();
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}
function obtenerMensajeError(err: unknown, defecto: string) {
  if (typeof err === 'object' && err && 'response' in err) {
    const response = (err as { response?: { data?: { mensaje?: string } } }).response;
    return response?.data?.mensaje || defecto;
  }
  return defecto;
}

function CreditosManager() {
  const fechaActual = fechaActualLocal();
  const [creditos, setCreditos] = useState<CreditoCuenta[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [tarifas, setTarifas] = useState<TarifaHabitacion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [paginaCreditos, setPaginaCreditos] = useState(1);
  const [paginaCargos, setPaginaCargos] = useState(1);

  const [fechaInicio, setFechaInicio] = useState(fechaActual);
  const [fechaFin, setFechaFin] = useState(fechaActual);

  const [modalNuevo, setModalNuevo] = useState(false);
  const [clienteNombre, setClienteNombre] = useState('');
  const [nit, setNit] = useState('');
  const [telefono, setTelefono] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const [modalCuenta, setModalCuenta] = useState(false);
  const [factura, setFactura] = useState<FacturaCredito | null>(null);
  const [tipoPagoId, setTipoPagoId] = useState('1');

  const [cargoTipo, setCargoTipo] = useState<TipoCargoCredito>('HABITACION');
  const [cargoDescripcion, setCargoDescripcion] = useState('');
  const [cargoMonto, setCargoMonto] = useState('0');

  const [habitacionId, setHabitacionId] = useState('');
  const [tarifaId, setTarifaId] = useState('');
  const [fechaEntrada, setFechaEntrada] = useState(fechaActual);
  const [dias, setDias] = useState('1');
  const [adultosExtra, setAdultosExtra] = useState('0');
  const [ninosExtra, setNinosExtra] = useState('0');

  const [itemId, setItemId] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [observaciones, setObservaciones] = useState('');
  const [carrito, setCarrito] = useState<ItemCreditoCarrito[]>([]);

  const cargar = async () => {
    setCargando(true);
    try {
      const [creditosData, itemsData, habitacionesData, tarifasData] = await Promise.all([
        obtenerCreditos({ fecha_inicio: fechaInicio || undefined, fecha_fin: fechaFin || undefined }),
        obtenerMenuItems(true),
        obtenerHabitaciones(),
        obtenerTarifas(),
      ]);
      setCreditos(creditosData);
      setItems(itemsData);
      setHabitaciones(habitacionesData);
      setTarifas(tarifasData);
      setPaginaCreditos(1);
    } catch (err) {
      console.error(err); await alertaError('Error', 'No se pudieron cargar los créditos.');
    } finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const itemsPorId = useMemo(() => items.reduce<Record<number, MenuItem>>((mapa, item) => { mapa[item.id] = item; return mapa; }, {}), [items]);
  const habitacionesPorId = useMemo(() => habitaciones.reduce<Record<number, Habitacion>>((mapa, habitacion) => { mapa[habitacion.id] = habitacion; return mapa; }, {}), [habitaciones]);
  const tarifasPorId = useMemo(() => tarifas.reduce<Record<number, TarifaHabitacion>>((mapa, tarifa) => { mapa[tarifa.id] = tarifa; return mapa; }, {}), [tarifas]);

  const creditosPagina = useMemo(() => {
    const inicio = (paginaCreditos - 1) * POR_PAGINA;
    return creditos.slice(inicio, inicio + POR_PAGINA);
  }, [creditos, paginaCreditos]);

  const tarifaSeleccionada = tarifaId ? tarifasPorId[Number(tarifaId)] : undefined;
  const habitacionSeleccionada = habitacionId ? habitacionesPorId[Number(habitacionId)] : undefined;
  const itemSeleccionado = itemId ? itemsPorId[Number(itemId)] : undefined;

  const totalHabitacion = useMemo(() => {
    if (!tarifaSeleccionada) return 0;
    const cantidadDias = Math.max(Number(dias || 0), 0);
    const adulto = Number(tarifaSeleccionada.precio_adulto_extra ?? 100);
    const nino = Number(tarifaSeleccionada.precio_nino_extra ?? 50);
    return (Number(tarifaSeleccionada.precio || 0) * cantidadDias) +
      (Number(adultosExtra || 0) * adulto * cantidadDias) +
      (Number(ninosExtra || 0) * nino * cantidadDias);
  }, [tarifaSeleccionada, dias, adultosExtra, ninosExtra]);

  const totalCarrito = useMemo(() => carrito.reduce((total, item) => {
    return total + numero(itemsPorId[item.menu_item_id]?.precio) * item.cantidad;
  }, 0), [carrito, itemsPorId]);

  const limpiarNuevo = () => {
    setClienteNombre(''); setNit(''); setTelefono(''); setEmpresa(''); setDescripcion('');
  };

  const limpiarCreditoForm = () => {
    setCargoDescripcion(''); setCargoMonto('0');
    setHabitacionId(''); setTarifaId(''); setFechaEntrada(fechaActualLocal()); setDias('1'); setAdultosExtra('0'); setNinosExtra('0');
    setItemId(''); setCantidad('1'); setObservaciones(''); setCarrito([]);
    setPaginaCargos(1);
  };

  const guardarCredito = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setGuardando(true);
    try {
      await crearCredito({ cliente_nombre: clienteNombre, nit, telefono, empresa, descripcion });
      setModalNuevo(false); limpiarNuevo(); await cargar();
      await alertaExito('¡Crédito creado!', 'La cuenta de crédito fue creada correctamente.');
    } catch (err) { console.error(err); await alertaError('Error', obtenerMensajeError(err, 'No se pudo crear el crédito.')); }
    finally { setGuardando(false); }
  };

  const abrirCuenta = async (credito: CreditoCuenta) => {
    setModalCuenta(true);
    limpiarCreditoForm();
    try { setFactura(await obtenerFacturaCredito(credito.id)); }
    catch (err) { console.error(err); await alertaError('Error', 'No se pudo cargar la cuenta de crédito.'); setModalCuenta(false); }
  };

  const recargarFactura = async () => {
    if (!factura) return;
    setFactura(await obtenerFacturaCredito(factura.credito.id));
  };

  const agregarCargoHabitacion = async () => {
    if (!factura || !habitacionSeleccionada || !tarifaSeleccionada || Number(dias) <= 0) return;
    setGuardando(true);
    try {
      const descripcionCargo = `Habitación ${habitacionSeleccionada.numero} - ${tarifaSeleccionada.nombre} - entrada ${fechaEntrada} - ${dias} día(s) - adultos extra ${adultosExtra} - niños extra ${ninosExtra}`;
      await agregarCargoCredito(factura.credito.id, {
        tipo_cargo: 'HABITACION',
        descripcion: descripcionCargo,
        monto: totalHabitacion,
        habitacion_id: Number(habitacionId),
      });
      limpiarCreditoForm(); await recargarFactura(); await cargar();
      await alertaExito('¡Cargo agregado!', 'El cargo de habitación fue agregado al crédito y la habitación quedó ocupada.');
    } catch (err) { console.error(err); await alertaError('Error', obtenerMensajeError(err, 'No se pudo agregar el cargo de habitación.')); }
    finally { setGuardando(false); }
  };

  const agregarCargoManual = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!factura) return;
    setGuardando(true);
    try {
      await agregarCargoCredito(factura.credito.id, { tipo_cargo: 'MANUAL', descripcion: cargoDescripcion, monto: Number(cargoMonto) });
      setCargoDescripcion(''); setCargoMonto('0'); await recargarFactura(); await cargar();
      await alertaExito('¡Cargo agregado!', 'El cargo fue agregado al crédito.');
    } catch (err) { console.error(err); await alertaError('Error', obtenerMensajeError(err, 'No se pudo agregar el cargo.')); }
    finally { setGuardando(false); }
  };

  const agregarItemCarrito = () => {
    if (!itemSeleccionado || Number(cantidad) <= 0) return;
    setCarrito((actual) => [
      ...actual,
      {
        lineaId: `${itemSeleccionado.id}-${Date.now()}-${Math.random()}`,
        menu_item_id: itemSeleccionado.id,
        cantidad: Number(cantidad),
        observaciones,
        exclusiones_productos: [],
      },
    ]);
    setItemId(''); setCantidad('1'); setObservaciones('');
  };

  const quitarItemCarrito = (lineaId: string) => {
    setCarrito((actual) => actual.filter((item) => item.lineaId !== lineaId));
  };

  const alternarExclusion = (lineaId: string, productoId: number) => {
    setCarrito((actual) => actual.map((item) => {
      if (item.lineaId !== lineaId) return item;
      const existe = item.exclusiones_productos.includes(productoId);
      return {
        ...item,
        exclusiones_productos: existe
          ? item.exclusiones_productos.filter((id) => id !== productoId)
          : [...item.exclusiones_productos, productoId],
      };
    }));
  };

  const enviarOrdenRestaurante = async () => {
    if (!factura || carrito.length === 0) return;
    setGuardando(true);
    try {
      await crearOrden({
        tipo_orden: 'CREDITO',
        credito_id: factura.credito.id,
        observaciones: `Consumo cargado a crédito ${factura.credito.cliente_nombre}`,
        detalles: carrito.map((item) => ({
          menu_item_id: item.menu_item_id,
          cantidad: item.cantidad,
          observaciones: item.observaciones,
          exclusiones_productos: item.exclusiones_productos,
        })),
      });
      limpiarCreditoForm(); await recargarFactura(); await cargar();
      await alertaExito('¡Orden agregada!', 'La orden fue cargada al crédito y enviada a cocina.');
    } catch (err) { console.error(err); await alertaError('Error', obtenerMensajeError(err, 'No se pudo cargar la orden al crédito.')); }
    finally { setGuardando(false); }
  };

  const pagarCuenta = async () => {
    if (!factura) return; setGuardando(true);
    try { setFactura(await pagarCredito(factura.credito.id, Number(tipoPagoId))); await cargar(); await alertaExito('¡Crédito pagado!', 'La cuenta de crédito fue pagada correctamente.'); }
    catch (err) { console.error(err); await alertaError('Error', obtenerMensajeError(err, 'No se pudo pagar el crédito.')); }
    finally { setGuardando(false); }
  };

  const cargosPagina = factura ? factura.cargos.slice((paginaCargos - 1) * POR_PAGINA, paginaCargos * POR_PAGINA) : [];

  return (
    <div className="restaurante-page">
      <div className="page-header">
        <div><h1>Créditos</h1><p>Cuentas pendientes para empresas, municipalidades o clientes frecuentes.</p></div>
        <button className="btn btn-palmar" type="button" onClick={() => setModalNuevo(true)}>Nuevo crédito</button>
      </div>

      <div className="card shadow-sm mb-4"><div className="card-body"><div className="row g-3 align-items-end">
        <div className="col-md-4"><label className="form-label">Desde</label><input type="date" className="form-control" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} /></div>
        <div className="col-md-4"><label className="form-label">Hasta</label><input type="date" className="form-control" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} /></div>
        <div className="col-md-4"><button className="btn btn-palmar w-100" type="button" onClick={cargar}>Consultar</button></div>
      </div></div></div>

      {cargando ? <div className="alert alert-info">Cargando créditos...</div> : (
        <>
          <div className="restaurante-mesas-grid">
            {creditosPagina.map((credito) => (
              <article className="restaurante-mesa-card shadow-sm" key={credito.id}>
                <span className="restaurante-label">{credito.estado}</span>
                <h3>{credito.cliente_nombre}</h3>
                <p>{credito.empresa || 'Sin empresa'} · {credito.telefono || 'Sin teléfono'}</p>
                <div className="restaurante-mesa-total"><span>Total pendiente</span><strong>{dinero(credito.total)}</strong></div>
                <small>Creado: {fechaHora(credito.fecha_creacion)}</small>
                <button className="btn btn-palmar w-100 mt-3" type="button" onClick={() => abrirCuenta(credito)}>Abrir crédito</button>
              </article>
            ))}
            {creditos.length === 0 && <div className="alert alert-warning">No hay créditos registrados.</div>}
          </div>
          <Paginacion total={creditos.length} pagina={paginaCreditos} porPagina={POR_PAGINA} onCambiarPagina={setPaginaCreditos} />
        </>
      )}

      {modalNuevo && (
        <><div className="modal fade show d-block" tabIndex={-1}><div className="modal-dialog modal-lg modal-dialog-centered"><div className="modal-content"><form onSubmit={guardarCredito}>
          <div className="modal-header modal-palmar"><h5 className="modal-title">Nuevo crédito</h5><button type="button" className="btn-close btn-close-white" onClick={() => setModalNuevo(false)} disabled={guardando} /></div>
          <div className="modal-body"><div className="row g-3">
            <div className="col-md-6"><label className="form-label">Cliente / entidad</label><input className="form-control" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} required /></div>
            <div className="col-md-3"><label className="form-label">NIT</label><input className="form-control" value={nit} onChange={(e) => setNit(e.target.value)} /></div>
            <div className="col-md-3"><label className="form-label">Teléfono</label><input className="form-control" value={telefono} onChange={(e) => setTelefono(e.target.value)} /></div>
            <div className="col-md-6"><label className="form-label">Empresa / institución</label><input className="form-control" value={empresa} onChange={(e) => setEmpresa(e.target.value)} /></div>
            <div className="col-12"><label className="form-label">Descripción</label><textarea className="form-control" rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} /></div>
          </div></div>
          <div className="modal-footer"><button type="button" className="btn btn-outline-secondary" onClick={() => setModalNuevo(false)} disabled={guardando}>Cancelar</button><button className="btn btn-palmar" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar crédito'}</button></div>
        </form></div></div></div><div className="modal-backdrop fade show" /></>
      )}

      {modalCuenta && factura && (
        <><div className="modal fade show d-block" tabIndex={-1}><div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"><div className="modal-content">
          <div className="modal-header modal-palmar"><h5 className="modal-title">Cuenta de crédito</h5><button type="button" className="btn-close btn-close-white" onClick={() => setModalCuenta(false)} disabled={guardando} /></div>
          <div className="modal-body"><section className="factura-card shadow-sm">
            <div className="factura-header"><div><span className="factura-label">Cuenta de crédito</span><h2>{factura.credito.cliente_nombre}</h2><p>{factura.credito.empresa || factura.credito.descripcion || 'Crédito pendiente'}</p></div><div className="factura-status-box"><span className={factura.credito.estado === 'PENDIENTE' ? 'badge text-bg-warning' : 'badge text-bg-success'}>{factura.credito.estado}</span><strong>{dinero(factura.total_a_pagar)}</strong></div></div>

            {factura.credito.estado === 'PENDIENTE' && (
              <div className="card p-3 mb-3">
                <div className="row g-3"><div className="col-md-4"><label className="form-label">Tipo de cargo</label><select className="form-select" value={cargoTipo} onChange={(e) => { setCargoTipo(e.target.value as TipoCargoCredito); limpiarCreditoForm(); }}><option value="HABITACION">Habitación</option><option value="RESTAURANTE">Restaurante</option><option value="MANUAL">Manual</option></select></div></div>

                {cargoTipo === 'HABITACION' && (
                  <div className="row g-3 mt-1 align-items-end">
                    <div className="col-md-4"><label className="form-label">Habitación</label><select className="form-select" value={habitacionId} onChange={(e) => setHabitacionId(e.target.value)}><option value="">Seleccione...</option>{habitaciones.map((habitacion) => <option key={habitacion.id} value={habitacion.id}>Habitación {habitacion.numero} - {habitacion.tipo} - {habitacion.estado}</option>)}</select></div>
                    <div className="col-md-4"><label className="form-label">Tarifa</label><select className="form-select" value={tarifaId} onChange={(e) => setTarifaId(e.target.value)}><option value="">Seleccione...</option>{tarifas.map((tarifa) => <option key={tarifa.id} value={tarifa.id}>{tarifa.nombre} - {dinero(tarifa.precio)}</option>)}</select></div>
                    <div className="col-md-4"><label className="form-label">Fecha de entrada</label><input type="date" className="form-control" value={fechaEntrada} onChange={(e) => setFechaEntrada(e.target.value)} /></div>
                    <div className="col-md-3"><label className="form-label">Días</label><input type="number" className="form-control" value={dias} min="1" onChange={(e) => setDias(e.target.value)} /></div>
                    <div className="col-md-3"><label className="form-label">Adultos extra</label><input type="number" className="form-control" value={adultosExtra} min="0" onChange={(e) => setAdultosExtra(e.target.value)} /></div>
                    <div className="col-md-3"><label className="form-label">Niños extra</label><input type="number" className="form-control" value={ninosExtra} min="0" onChange={(e) => setNinosExtra(e.target.value)} /></div>
                    <div className="col-md-3"><button type="button" className="btn btn-palmar w-100" onClick={agregarCargoHabitacion} disabled={guardando || !habitacionSeleccionada || !tarifaSeleccionada}>Agregar habitación</button></div>
                    <div className="col-12"><div className="alert alert-info mb-0">Total cargo habitación: <strong>{dinero(totalHabitacion)}</strong></div></div>
                  </div>
                )}

                {cargoTipo === 'RESTAURANTE' && (
                  <div className="mt-3">
                    <div className="row g-2 align-items-end">
                      <div className="col-md-5"><label className="form-label">Producto</label><select className="form-select" value={itemId} onChange={(e) => setItemId(e.target.value)}><option value="">Seleccione...</option>{items.map((item) => <option key={item.id} value={item.id}>{item.nombre} - {dinero(item.precio)}</option>)}</select></div>
                      <div className="col-md-2"><label className="form-label">Cant.</label><input type="number" className="form-control" value={cantidad} min="1" onChange={(e) => setCantidad(e.target.value)} /></div>
                      <div className="col-md-3"><label className="form-label">Obs.</label><input className="form-control" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} /></div>
                      <div className="col-md-2"><button type="button" className="btn btn-outline-secondary w-100" onClick={agregarItemCarrito}>Agregar</button></div>
                    </div>

                    {itemSeleccionado && (itemSeleccionado.ingredientes || []).length > 0 && <small className="text-muted d-block mt-2">Después de agregar puedes marcar ingredientes que no lleva cada plato.</small>}

                    <div className="mt-3 d-flex flex-column gap-2 restaurante-mini-cart-list">
                      {carrito.map((item) => {
                        const menuItem = itemsPorId[item.menu_item_id];
                        return (
                          <div className="restaurante-ingredient-pill flex-column align-items-stretch" key={item.lineaId}>
                            <div className="d-flex justify-content-between gap-2">
                              <span>{menuItem?.nombre || 'Producto'} x {item.cantidad} - {dinero(numero(menuItem?.precio) * item.cantidad)} {item.observaciones ? `(${item.observaciones})` : ''}</span>
                              <button type="button" onClick={() => quitarItemCarrito(item.lineaId)}>×</button>
                            </div>

                            {(menuItem?.ingredientes || []).length > 0 && (
                              <div className="restaurante-exclusion-box mt-2">
                                <small>Quitar del plato:</small>
                                {(menuItem?.ingredientes || []).map((ingrediente) => ingrediente.producto ? (
                                  <label className="form-check restaurante-exclusion-check" key={`${item.lineaId}-${ingrediente.producto.id}`}>
                                    <input
                                      type="checkbox"
                                      className="form-check-input"
                                      checked={item.exclusiones_productos.includes(ingrediente.producto.id)}
                                      onChange={() => alternarExclusion(item.lineaId, ingrediente.producto!.id)}
                                    />
                                    <span className="form-check-label">Sin {ingrediente.producto.nombre}</span>
                                  </label>
                                ) : null)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {carrito.length === 0 && <div className="alert alert-warning mb-0">Agrega uno o varios productos para enviarlos a cocina.</div>}
                    </div>

                    <div className="row g-2 align-items-end mt-2"><div className="col-md-4"><strong>Total restaurante: {dinero(totalCarrito)}</strong></div><div className="col-md-4"><button type="button" className="btn btn-palmar w-100" onClick={enviarOrdenRestaurante} disabled={guardando || carrito.length === 0}>Enviar a cocina y cargar</button></div></div>
                  </div>
                )}

                {cargoTipo === 'MANUAL' && (
                  <form onSubmit={agregarCargoManual} className="row g-2 align-items-end mt-2">
                    <div className="col-md-6"><label className="form-label">Descripción</label><input className="form-control" value={cargoDescripcion} onChange={(e) => setCargoDescripcion(e.target.value)} required /></div>
                    <div className="col-md-3"><label className="form-label">Monto</label><input type="number" className="form-control" value={cargoMonto} onChange={(e) => setCargoMonto(e.target.value)} min="0" step="0.01" required /></div>
                    <div className="col-md-3"><button className="btn btn-palmar w-100" disabled={guardando}>Agregar cargo</button></div>
                  </form>
                )}
              </div>
            )}

            <div className="factura-section-title"><h3>Cargos</h3><span>{factura.cargos.length} registro(s)</span></div>
            <div className="table-responsive"><table className="table factura-table"><thead><tr><th>Tipo</th><th>Descripción</th><th>Fecha</th><th className="text-end">Monto</th></tr></thead><tbody>{cargosPagina.map((cargo) => <tr key={cargo.id}><td>{cargo.tipo_cargo}</td><td>{cargo.descripcion}</td><td>{fechaHora(cargo.fecha_cargo)}</td><td className="text-end">{dinero(cargo.monto)}</td></tr>)}{factura.cargos.length === 0 && <tr><td colSpan={4} className="text-center text-muted">Sin cargos.</td></tr>}</tbody></table></div>
            <Paginacion total={factura.cargos.length} pagina={paginaCargos} porPagina={POR_PAGINA} onCambiarPagina={setPaginaCargos} />
            <div className="factura-totals"><div className="total"><span>Total pendiente</span><strong>{dinero(factura.total_a_pagar)}</strong></div></div>
            {factura.credito.estado === 'PENDIENTE' && <div className="row g-2 align-items-end mt-3"><div className="col-md-4"><label className="form-label">Tipo de pago</label><select className="form-select" value={tipoPagoId} onChange={(e) => setTipoPagoId(e.target.value)}><option value="1">Efectivo</option><option value="2">POS</option><option value="3">Cheque</option></select></div><div className="col-md-3"><button type="button" className="btn btn-palmar w-100" onClick={pagarCuenta} disabled={guardando || numero(factura.total_a_pagar) <= 0}>Pagar crédito</button></div></div>}
          </section></div><div className="modal-footer"><button type="button" className="btn btn-outline-secondary" onClick={() => setModalCuenta(false)}>Cerrar</button></div>
        </div></div></div><div className="modal-backdrop fade show" /></>
      )}
    </div>
  );
}

export default CreditosManager;
