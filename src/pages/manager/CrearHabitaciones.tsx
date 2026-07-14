import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  actualizarHabitacion,
  crearHabitacion,
  obtenerEstadosHabitacion,
  obtenerHabitaciones,
} from '../../api/habitacionesApi';
import ModalCrearHabitacion from '../../components/manager/ModalCrearHabitacion';
import { alertaError, alertaExito } from '../../components/SweetAlert';
import type {
  ActualizarHabitacionPayload,
  CrearHabitacionPayload,
  EstadoHabitacion,
  Habitacion,
  ImagenHabitacion,
} from '../../types';
import '../../styles/crearhabitaciones.css';

const apiUrl = import.meta.env.VITE_API_URL;

function obtenerImagenPrincipal(imagenes: ImagenHabitacion[] | undefined | null) {
  if (!imagenes || imagenes.length === 0) {
    return null;
  }

  const imagenPrincipal = imagenes.find((imagen) => imagen.principal);

  return imagenPrincipal || imagenes[0];
}

function construirUrlImagen(imagenUrl: string) {
  if (!imagenUrl) {
    return '';
  }

  if (imagenUrl.startsWith('http')) {
    return imagenUrl;
  }

  return `${apiUrl}${imagenUrl}`;
}

function obtenerClaseEstado(estado: string) {
  const estadoNormalizado = estado.toLowerCase();

  if (estadoNormalizado === 'disponible') {
    return 'badge text-bg-success';
  }

  if (estadoNormalizado === 'ocupada' || estadoNormalizado === 'ocupado') {
    return 'badge text-bg-danger';
  }

  if (estadoNormalizado === 'reservada' || estadoNormalizado === 'reservado') {
    return 'badge text-bg-warning';
  }

  if (estadoNormalizado === 'limpieza') {
    return 'badge text-bg-info';
  }

  if (estadoNormalizado === 'mantenimiento') {
    return 'badge text-bg-secondary';
  }

  if (estadoNormalizado === 'inactiva' || estadoNormalizado === 'inactivo') {
    return 'badge text-bg-dark';
  }

  return 'badge text-bg-secondary';
}

function CrearHabitaciones() {
  const navigate = useNavigate();

  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [estadosHabitacion, setEstadosHabitacion] = useState<EstadoHabitacion[]>([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [cargandoEstados, setCargandoEstados] = useState(false);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [habitacionEditar, setHabitacionEditar] = useState<Habitacion | null>(null);

  const cargarHabitaciones = async () => {
    setCargando(true);

    try {
      const data = await obtenerHabitaciones();
      setHabitaciones(data);
    } catch (err) {
      console.error(err);

      await alertaError(
        'Error',
        'No se pudieron cargar las habitaciones.',
      );
    } finally {
      setCargando(false);
    }
  };

  const cargarEstadosHabitacion = async () => {
    setCargandoEstados(true);

    try {
      const data = await obtenerEstadosHabitacion();
      setEstadosHabitacion(data);
    } catch (err) {
      console.error(err);

      await alertaError(
        'Error',
        'No se pudieron cargar los estados de habitación.',
      );
    } finally {
      setCargandoEstados(false);
    }
  };

  useEffect(() => {
    cargarHabitaciones();
  }, []);

  const abrirModalCrear = async () => {
    setHabitacionEditar(null);
    setMostrarModal(true);

    await cargarEstadosHabitacion();
  };

  const abrirModalEditar = async (habitacion: Habitacion) => {
    setHabitacionEditar(habitacion);
    setMostrarModal(true);

    await cargarEstadosHabitacion();
  };

  const cerrarModal = () => {
    if (guardando) {
      return;
    }

    setMostrarModal(false);
    setHabitacionEditar(null);
  };

const irDetalleHabitacion = (habitacion: Habitacion) => {
  navigate(`/manager/habitaciones/${habitacion.id}`, {
    state: {
      habitacion,
    },
  });
};

  const guardarHabitacion = async (
    payload: CrearHabitacionPayload | ActualizarHabitacionPayload,
  ) => {
    setGuardando(true);

    try {
      if (habitacionEditar) {
        await actualizarHabitacion(habitacionEditar.id, payload);

        setMostrarModal(false);
        setHabitacionEditar(null);

        await cargarHabitaciones();

        await alertaExito(
          '¡Habitación actualizada!',
          'La habitación fue actualizada correctamente.',
        );

        return;
      }

      await crearHabitacion(payload);

      setMostrarModal(false);

      await cargarHabitaciones();

      await alertaExito(
        '¡Habitación creada!',
        'La habitación fue registrada correctamente.',
      );
    } catch (err) {
      console.error(err);

      await alertaError(
        'Error',
        habitacionEditar
          ? 'No se pudo actualizar la habitación. Revisa los datos o el backend.'
          : 'No se pudo crear la habitación. Revisa los datos o el backend.',
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Habitaciones</h1>
          <p>Visualización de todas las habitaciones registradas.</p>
        </div>

        <button
          className="btn btn-palmar"
          type="button"
          onClick={abrirModalCrear}
        >
          Nueva habitación
        </button>
      </div>

      {cargando ? (
        <div className="alert alert-info">Cargando habitaciones...</div>
      ) : (
        <div className="row g-4">
          {habitaciones.map((habitacion) => {
            const imagen = obtenerImagenPrincipal(habitacion.imagenes);

            return (
              <div className="col-12 col-md-6 col-xl-4" key={habitacion.id}>
                <div
                  className="card hotel-card h-100 shadow-sm clickable-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => irDetalleHabitacion(habitacion)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      irDetalleHabitacion(habitacion);
                    }
                  }}
                >
                  {imagen ? (
                    <img
                      src={construirUrlImagen(imagen.imagen_url)}
                      className="card-img-top room-image"
                      alt={`Habitación ${habitacion.numero}`}
                    />
                  ) : (
                    <div className="room-image-placeholder">
                      Sin imagen
                    </div>
                  )}

                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title mb-0">
                        Habitación {habitacion.numero}
                      </h5>

                      <span className={obtenerClaseEstado(habitacion.estado)}>
                        {habitacion.estado}
                      </span>
                    </div>

                    <p className="card-text text-muted">
                      {habitacion.descripcion}
                    </p>

                    <div className="d-flex justify-content-between align-items-center">
                      <span className="badge text-bg-dark">
                        {habitacion.tipo}
                      </span>
                    </div>

                    <div className="mt-3 small text-muted">
                      Capacidad: {habitacion.capacidad_personas} persona(s)
                    </div>

                    <div className="d-flex justify-content-end mt-3">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={(event) => {
                          event.stopPropagation();
                          abrirModalEditar(habitacion);
                        }}
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {habitaciones.length === 0 && (
            <div className="col-12">
              <div className="alert alert-warning">
                No hay habitaciones registradas.
              </div>
            </div>
          )}
        </div>
      )}

      <ModalCrearHabitacion
        mostrar={mostrarModal}
        guardando={guardando}
        cargandoEstados={cargandoEstados}
        habitacionEditar={habitacionEditar}
        estadosHabitacion={estadosHabitacion}
        onCerrar={cerrarModal}
        onGuardar={guardarHabitacion}
      />
    </div>
  );
}

export default CrearHabitaciones;