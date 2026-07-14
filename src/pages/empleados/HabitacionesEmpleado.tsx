import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerHabitaciones } from '../../api/habitacionesApi';
import { alertaError } from '../../components/SweetAlert';
import type { Habitacion, ImagenHabitacion } from '../../types';
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

function HabitacionesEmpleado() {
  const navigate = useNavigate();

  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [cargando, setCargando] = useState(true);

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

  useEffect(() => {
    cargarHabitaciones();
  }, []);

  const irDetalleHabitacion = (habitacion: Habitacion) => {
    navigate(`/empleado/habitaciones/${habitacion.id}`, {
      state: {
        habitacion,
      },
    });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Habitaciones</h1>
          <p>Visualización de habitaciones disponibles en el hotel.</p>
        </div>
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
    </div>
  );
}

export default HabitacionesEmpleado;