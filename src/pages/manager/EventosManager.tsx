import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { crearEvento, cerrarEvento, obtenerEventos, obtenerFacturaEvento } from '../../api/eventosApi';
import Paginacion from '../../components/common/Paginacion';
import { alertaError, alertaExito } from '../../components/SweetAlert';
import type { EventoRestaurante, FacturaEvento } from '../../types';
import '../../styles/restaurante.css';
import '../../styles/facturaReservacion.css';

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

function EventosManager() {
  const fechaActual = fechaActualLocal();
  const [eventos, setEventos] = useState<EventoRestaurante[]>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [fechaInicio, setFechaInicio] = useState(fechaActual);
  const [fechaFin, setFechaFin] = useState(fechaActual);

  const [modalNuevo, setModalNuevo] = useState(false);
  const [clienteNombre, setClienteNombre] = useState('');
  const [nit, setNit] = useState('');
  const [telefono, setTelefono] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [fechaEvento, setFechaEvento] = useState(fechaActual);
  const [descripcion, setDescripcion] = useState('');
  const [cantidadPersonas, setCantidadPersonas] = useState('0');
  const [montoCobrado, setMontoCobrado] = useState('0');

  const [modalCuenta, setModalCuenta] = useState(false);
  const [factura, setFactura] = useState<FacturaEvento | null>(null);
  const [tipoPagoId, setTipoPagoId] = useState('1');

  const eventosPagina = useMemo(() => {
    const inicio = (pagina - 1) * POR_PAGINA;
    return eventos.slice(inicio, inicio + POR_PAGINA);
  }, [eventos, pagina]);

  const cargar = async () => {
    setCargando(true);
    try {
      const eventosData = await obtenerEventos({ fecha_inicio: fechaInicio || undefined, fecha_fin: fechaFin || undefined });
      setEventos(eventosData);
      setPagina(1);
    } catch (err) {
      console.error(err); await alertaError('Error', 'No se pudieron cargar los eventos.');
    } finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const limpiarNuevo = () => {
    setClienteNombre(''); setNit(''); setTelefono(''); setEmpresa(''); setFechaEvento(fechaActualLocal()); setDescripcion(''); setCantidadPersonas('0'); setMontoCobrado('0');
  };

  const guardarEvento = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setGuardando(true);
    try {
      await crearEvento({
        cliente_nombre: clienteNombre,
        nit,
        telefono,
        empresa,
        fecha_evento: fechaEvento,
        descripcion,
        cantidad_personas: Number(cantidadPersonas),
        monto_cobrado: Number(montoCobrado),
      });
      setModalNuevo(false); limpiarNuevo(); await cargar();
      await alertaExito('¡Evento creado!', 'El evento fue registrado correctamente.');
    } catch (err) { console.error(err); await alertaError('Error', obtenerMensajeError(err, 'No se pudo crear el evento.')); }
    finally { setGuardando(false); }
  };

  const abrirCuenta = async (evento: EventoRestaurante) => {
    setModalCuenta(true);
    try {
      const data = await obtenerFacturaEvento(evento.id);
      setFactura(data);
    } catch (err) { console.error(err); await alertaError('Error', 'No se pudo cargar el recibo del evento.'); setModalCuenta(false); }
  };

  const cerrarYPagar = async () => {
    if (!factura) return;
    setGuardando(true);
    try {
      const data = await cerrarEvento(factura.evento.id, Number(tipoPagoId));
      setFactura(data); await cargar();
      await alertaExito('¡Evento cobrado!', 'El evento fue cobrado correctamente.');
    } catch (err) { console.error(err); await alertaError('Error', obtenerMensajeError(err, 'No se pudo cobrar el evento.')); }
    finally { setGuardando(false); }
  };

  return (
    <div className="restaurante-page">
      <div className="page-header">
        <div><h1>Eventos</h1><p>Registro de eventos con descripción, asistentes y monto cobrado.</p></div>
        <button className="btn btn-palmar" type="button" onClick={() => setModalNuevo(true)}>Nuevo evento</button>
      </div>

      <div className="card shadow-sm mb-4"><div className="card-body"><div className="row g-3 align-items-end">
        <div className="col-md-4"><label className="form-label">Desde</label><input type="date" className="form-control" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} /></div>
        <div className="col-md-4"><label className="form-label">Hasta</label><input type="date" className="form-control" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} /></div>
        <div className="col-md-4"><button className="btn btn-palmar w-100" type="button" onClick={cargar}>Consultar</button></div>
      </div></div></div>

      {cargando ? <div className="alert alert-info">Cargando eventos...</div> : (
        <>
          <div className="restaurante-mesas-grid">
            {eventosPagina.map((evento) => (
              <article className="restaurante-mesa-card shadow-sm" key={evento.id}>
                <span className="restaurante-label">{evento.estado}</span>
                <h3>{evento.cliente_nombre}</h3>
                <p>{evento.descripcion || 'Sin descripción'}</p>
                <div className="restaurante-mesa-total"><span>Total</span><strong>{dinero(evento.total)}</strong></div>
                <small>{Number(evento.cantidad_personas || 0)} persona(s) · Creado: {fechaHora(evento.fecha_creacion)}</small>
                <button className="btn btn-palmar w-100 mt-3" type="button" onClick={() => abrirCuenta(evento)}>Abrir recibo</button>
              </article>
            ))}
            {eventos.length === 0 && <div className="alert alert-warning">No hay eventos registrados.</div>}
          </div>
          <Paginacion total={eventos.length} pagina={pagina} porPagina={POR_PAGINA} onCambiarPagina={setPagina} />
        </>
      )}

      {modalNuevo && (
        <><div className="modal fade show d-block" tabIndex={-1}><div className="modal-dialog modal-lg modal-dialog-centered"><div className="modal-content"><form onSubmit={guardarEvento}>
          <div className="modal-header modal-palmar"><h5 className="modal-title">Nuevo evento</h5><button type="button" className="btn-close btn-close-white" onClick={() => setModalNuevo(false)} disabled={guardando} /></div>
          <div className="modal-body"><div className="row g-3">
            <div className="col-md-6"><label className="form-label">Cliente</label><input className="form-control" value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} required /></div>
            <div className="col-md-3"><label className="form-label">NIT</label><input className="form-control" value={nit} onChange={(e) => setNit(e.target.value)} /></div>
            <div className="col-md-3"><label className="form-label">Teléfono</label><input className="form-control" value={telefono} onChange={(e) => setTelefono(e.target.value)} /></div>
            <div className="col-md-6"><label className="form-label">Empresa</label><input className="form-control" value={empresa} onChange={(e) => setEmpresa(e.target.value)} /></div>
            <div className="col-md-6"><label className="form-label">Fecha del evento</label><input type="date" className="form-control" value={fechaEvento} onChange={(e) => setFechaEvento(e.target.value)} /></div>
            <div className="col-12"><label className="form-label">Descripción de lo vendido</label><textarea className="form-control" rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required /></div>
            <div className="col-md-6"><label className="form-label">Número de personas que asistieron</label><input type="number" className="form-control" value={cantidadPersonas} onChange={(e) => setCantidadPersonas(e.target.value)} min="0" required /></div>
            <div className="col-md-6"><label className="form-label">Cantidad cobrada</label><input type="number" className="form-control" value={montoCobrado} onChange={(e) => setMontoCobrado(e.target.value)} min="0" step="0.01" required /></div>
          </div></div>
          <div className="modal-footer"><button type="button" className="btn btn-outline-secondary" onClick={() => setModalNuevo(false)} disabled={guardando}>Cancelar</button><button className="btn btn-palmar" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar evento'}</button></div>
        </form></div></div></div><div className="modal-backdrop fade show" /></>
      )}

      {modalCuenta && factura && (
        <><div className="modal fade show d-block" tabIndex={-1}><div className="modal-dialog modal-lg modal-dialog-centered"><div className="modal-content">
          <div className="modal-header modal-palmar"><h5 className="modal-title">Recibo de evento</h5><button type="button" className="btn-close btn-close-white" onClick={() => setModalCuenta(false)} disabled={guardando} /></div>
          <div className="modal-body">
            <section className="factura-card shadow-sm">
              <div className="factura-header"><div><span className="factura-label">Recibo de evento</span><h2>{factura.evento.cliente_nombre}</h2><p>{factura.evento.descripcion || 'Evento'}</p></div><div className="factura-status-box"><span className={factura.evento.estado === 'ABIERTO' ? 'badge text-bg-warning' : 'badge text-bg-success'}>{factura.evento.estado}</span><strong>{dinero(factura.total_a_pagar)}</strong></div></div>
              <div className="row g-3 mt-2">
                <div className="col-md-6"><div className="restaurante-report-box"><span>Personas</span><strong>{factura.evento.cantidad_personas || 0}</strong></div></div>
                <div className="col-md-6"><div className="restaurante-report-box"><span>Monto cobrado</span><strong>{dinero(factura.total_a_pagar)}</strong></div></div>
              </div>
              {factura.evento.estado === 'ABIERTO' && <div className="row g-2 align-items-end mt-3"><div className="col-md-6"><label className="form-label">Tipo de pago</label><select className="form-select" value={tipoPagoId} onChange={(e) => setTipoPagoId(e.target.value)}><option value="1">Efectivo</option><option value="2">POS</option><option value="3">Cheque</option></select></div><div className="col-md-6"><button type="button" className="btn btn-palmar w-100" onClick={cerrarYPagar} disabled={guardando || Number(factura.total_a_pagar) <= 0}>Cobrar evento</button></div></div>}
              {factura.evento.estado !== 'ABIERTO' && <div className="alert alert-success mt-3 mb-0">Evento cobrado con {factura.tipo_pago?.nombre || 'tipo de pago registrado'}.</div>}
            </section>
          </div><div className="modal-footer"><button type="button" className="btn btn-outline-secondary" onClick={() => setModalCuenta(false)}>Cerrar</button></div>
        </div></div></div><div className="modal-backdrop fade show" /></>
      )}
    </div>
  );
}

export default EventosManager;
