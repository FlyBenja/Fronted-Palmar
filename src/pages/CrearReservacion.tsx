import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { obtenerHabitaciones } from '../api/habitacionesApi';
import { crearReservacion } from '../api/reservacionesApi';
import { obtenerTarifas } from '../api/tarifasApi';
import {
  alertaAdvertencia,
  alertaError,
  alertaExito,
} from '../components/SweetAlert';
import type { Habitacion, TarifaHabitacion } from '../types';
import '../styles/crearReservacion.css';

function esHabitacionDisponible(habitacion: Habitacion) {
  return habitacion.estado.toLowerCase() === 'disponible';
}

function obtenerFechaActual() {
  const fecha = new Date();
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');

  return `${anio}-${mes}-${dia}`;
}

function obtenerPrecioTarifa(tarifa: TarifaHabitacion | undefined) {
  if (!tarifa) {
    return 0;
  }

  return Number(tarifa.precio || 0);
}

function CrearReservacion() {
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [tarifas, setTarifas] = useState<TarifaHabitacion[]>([]);

  const [habitacionId, setHabitacionId] = useState('');
  const [tarifaId, setTarifaId] = useState('');
  const [nombreCliente, setNombreCliente] = useState('');
  const [nit, setNit] = useState('');
  const [fechaEntrada, setFechaEntrada] = useState('');
  const [dias, setDias] = useState('1');
  const [adultosExtra, setAdultosExtra] = useState('0');
  const [ninosExtra, setNinosExtra] = useState('0');

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const habitacionesDisponibles = useMemo(() => {
    return habitaciones.filter(esHabitacionDisponible);
  }, [habitaciones]);

  const habitacionSeleccionada = useMemo(() => {
    return habitacionesDisponibles.find(
      (habitacion) => habitacion.id === Number(habitacionId),
    );
  }, [habitacionesDisponibles, habitacionId]);

  const tarifaSeleccionada = useMemo(() => {
    return tarifas.find((tarifa) => tarifa.id === Number(tarifaId));
  }, [tarifas, tarifaId]);

  const precioAdultoExtra = Number(tarifaSeleccionada?.precio_adulto_extra ?? 100);
  const precioNinoExtra = Number(tarifaSeleccionada?.precio_nino_extra ?? 50);

  const totalEstimado = useMemo(() => {
    const cantidadAdultosExtra = Math.max(Number(adultosExtra || 0), 0);
    const cantidadNinosExtra = Math.max(Number(ninosExtra || 0), 0);
    const cantidadDias = Number(dias || 0);

    return (obtenerPrecioTarifa(tarifaSeleccionada) * cantidadDias) +
      (cantidadAdultosExtra * precioAdultoExtra * cantidadDias) +
      (cantidadNinosExtra * precioNinoExtra * cantidadDias);
  }, [tarifaSeleccionada, dias, adultosExtra, ninosExtra, precioAdultoExtra, precioNinoExtra]);

  const cargarDatos = async () => {
    setCargando(true);

    try {
      const [habitacionesData, tarifasData] = await Promise.all([
        obtenerHabitaciones(),
        obtenerTarifas(),
      ]);

      setHabitaciones(habitacionesData);
      setTarifas(tarifasData);
    } catch (err) {
      console.error(err);

      await alertaError(
        'Error',
        'No se pudieron cargar las habitaciones o tarifas.',
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const limpiarFormulario = () => {
    setHabitacionId('');
    setTarifaId('');
    setNombreCliente('');
    setNit('');
    setFechaEntrada('');
    setDias('1');
    setAdultosExtra('0');
    setNinosExtra('0');
  };

  const validarFormulario = async () => {
    if (!habitacionSeleccionada) {
      await alertaAdvertencia(
        'Habitación requerida',
        'Debes seleccionar una habitación disponible.',
      );

      return false;
    }

    if (!tarifaSeleccionada) {
      await alertaAdvertencia(
        'Tarifa requerida',
        'Debes seleccionar una tarifa para la reservación.',
      );

      return false;
    }

    if (Number(adultosExtra) < 0 || Number(ninosExtra) < 0) {
      await alertaAdvertencia(
        'Cantidad inválida',
        'La cantidad de personas extras no puede ser negativa.',
      );

      return false;
    }

    if (Number(dias) <= 0) {
      await alertaAdvertencia(
        'Días inválidos',
        'La cantidad de días debe ser mayor a cero.',
      );

      return false;
    }

    if (!fechaEntrada) {
      await alertaAdvertencia(
        'Fecha requerida',
        'Debes seleccionar la fecha de entrada.',
      );

      return false;
    }

    return true;
  };

  const enviarFormulario = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formularioValido = await validarFormulario();

    if (!formularioValido) {
      return;
    }

    setGuardando(true);

    try {
      const reservacion = await crearReservacion({
        habitacion_id: Number(habitacionId),
        tarifa_id: Number(tarifaId),
        nombre_cliente: nombreCliente,
        nit,
        fecha_entrada: fechaEntrada,
        dias: Number(dias),
        adultos_extra: Number(adultosExtra),
        ninos_extra: Number(ninosExtra),
      });

      await alertaExito(
        '¡Reservación creada!',
        `Reservación creada correctamente. Total: Q${Number(
          reservacion.total_reservacion,
        ).toFixed(2)}.`,
      );

      limpiarFormulario();
      await cargarDatos();
    } catch (err) {
      console.error(err);

      await alertaError(
        'Error',
        'No se pudo crear la reservación. Revisa los datos o el backend.',
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="crear-reservacion-page">
      <div className="page-header">
        <div>
          <h1>Crear reservación</h1>
          <p>
            Registra una nueva reservación seleccionando habitación disponible y tarifa.
          </p>
        </div>
      </div>

      {cargando ? (
        <div className="alert alert-info">
          Cargando habitaciones y tarifas...
        </div>
      ) : (
        <div className="crear-reservacion-layout">
          <section className="crear-reservacion-card shadow-sm">
            <div className="crear-reservacion-card-header">
              <div>
                <span className="crear-reservacion-label">Formulario</span>
                <h2>Datos de la reservación</h2>
              </div>
            </div>

            <form onSubmit={enviarFormulario}>
              <div className="row g-4">
                <div className="col-md-6">
                  <label className="form-label">Habitación disponible</label>

                  <select
                    className="form-select"
                    value={habitacionId}
                    onChange={(event) => setHabitacionId(event.target.value)}
                    required
                  >
                    <option value="">Seleccione una habitación</option>

                    {habitacionesDisponibles.map((habitacion) => (
                      <option key={habitacion.id} value={habitacion.id}>
                        Habitación {habitacion.numero} - {habitacion.tipo} - Capacidad{' '}
                        {habitacion.capacidad_personas}
                      </option>
                    ))}
                  </select>

                  {habitacionesDisponibles.length === 0 && (
                    <small className="text-danger d-block mt-2">
                      No hay habitaciones disponibles.
                    </small>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label">Tarifa</label>

                  <select
                    className="form-select"
                    value={tarifaId}
                    onChange={(event) => setTarifaId(event.target.value)}
                    required
                  >
                    <option value="">Seleccione una tarifa</option>

                    {tarifas.map((tarifa) => (
                      <option key={tarifa.id} value={tarifa.id}>
                        {tarifa.nombre} - Q{Number(tarifa.precio).toFixed(2)}
                      </option>
                    ))}
                  </select>

                  {tarifas.length === 0 && (
                    <small className="text-danger d-block mt-2">
                      No hay tarifas registradas.
                    </small>
                  )}
                </div>

                <div className="col-md-8">
                  <label className="form-label">Nombre del cliente</label>

                  <input
                    type="text"
                    className="form-control"
                    value={nombreCliente}
                    onChange={(event) => setNombreCliente(event.target.value)}
                    placeholder="Juan Pérez"
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">NIT</label>

                  <input
                    type="text"
                    className="form-control"
                    value={nit}
                    onChange={(event) => setNit(event.target.value)}
                    placeholder="1234567-8"
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Fecha de entrada</label>

                  <input
                    type="date"
                    className="form-control"
                    value={fechaEntrada}
                    min={obtenerFechaActual()}
                    onChange={(event) => setFechaEntrada(event.target.value)}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Días</label>

                  <input
                    type="number"
                    className="form-control"
                    value={dias}
                    min="1"
                    onChange={(event) => setDias(event.target.value)}
                    required
                  />
                </div>

                <div className="col-md-2">
                  <label className="form-label">Adultos extra</label>

                  <input
                    type="number"
                    className="form-control"
                    value={adultosExtra}
                    min="0"
                    onChange={(event) => setAdultosExtra(event.target.value)}
                    required
                  />
                </div>

                <div className="col-md-2">
                  <label className="form-label">Niños extra</label>

                  <input
                    type="number"
                    className="form-control"
                    value={ninosExtra}
                    min="0"
                    onChange={(event) => setNinosExtra(event.target.value)}
                    required
                  />
                </div>

                <div className="col-12 d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={limpiarFormulario}
                    disabled={guardando}
                  >
                    Limpiar
                  </button>

                  <button
                    type="submit"
                    className="btn btn-palmar"
                    disabled={
                      guardando ||
                      habitacionesDisponibles.length === 0 ||
                      tarifas.length === 0
                    }
                  >
                    {guardando ? 'Creando...' : 'Crear reservación'}
                  </button>
                </div>
              </div>
            </form>
          </section>

          <aside className="crear-reservacion-resumen shadow-sm">
            <span className="crear-reservacion-label">Resumen</span>
            <h3>Detalle seleccionado</h3>

            {habitacionSeleccionada || tarifaSeleccionada ? (
              <div className="resumen-info-list">
                <div className="resumen-info-item">
                  <span>Habitación</span>
                  <strong>
                    {habitacionSeleccionada
                      ? `Habitación ${habitacionSeleccionada.numero}`
                      : 'Sin seleccionar'}
                  </strong>
                </div>

                <div className="resumen-info-item">
                  <span>Tipo</span>
                  <strong>{habitacionSeleccionada?.tipo || 'Sin seleccionar'}</strong>
                </div>

                <div className="resumen-info-item">
                  <span>Capacidad</span>
                  <strong>
                    {habitacionSeleccionada
                      ? `${habitacionSeleccionada.capacidad_personas} persona(s)`
                      : 'Sin seleccionar'}
                  </strong>
                </div>

                <div className="resumen-info-item">
                  <span>Tarifa</span>
                  <strong>{tarifaSeleccionada?.nombre || 'Sin seleccionar'}</strong>
                </div>

                <div className="resumen-info-item">
                  <span>Precio por noche</span>
                  <strong>
                    {tarifaSeleccionada
                      ? `Q${obtenerPrecioTarifa(tarifaSeleccionada).toFixed(2)}`
                      : 'Sin seleccionar'}
                  </strong>
                </div>

                <div className="resumen-info-item">
                  <span>Comidas incluidas</span>
                  <strong>
                    D:{tarifaSeleccionada?.desayunos_incluidos ?? 0} · A:{tarifaSeleccionada?.almuerzos_incluidos ?? 0} · C:{tarifaSeleccionada?.cenas_incluidas ?? 0}
                  </strong>
                </div>

                <div className="resumen-info-item">
                  <span>Días</span>
                  <strong>{dias || 0}</strong>
                </div>

                <div className="resumen-info-item">
                  <span>Adultos extra</span>
                  <strong>{adultosExtra || 0} x Q{precioAdultoExtra.toFixed(2)} por día</strong>
                </div>

                <div className="resumen-info-item">
                  <span>Niños extra</span>
                  <strong>{ninosExtra || 0} x Q{precioNinoExtra.toFixed(2)} por día</strong>
                </div>

                <div className="resumen-info-item total">
                  <span>Total estimado</span>
                  <strong>Q{totalEstimado.toFixed(2)}</strong>
                </div>
              </div>
            ) : (
              <div className="resumen-empty">
                Selecciona una habitación y una tarifa para ver el resumen.
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

export default CrearReservacion;
