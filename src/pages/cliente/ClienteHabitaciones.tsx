import { useEffect, useMemo, useState } from 'react';
import { obtenerHabitaciones } from '../../api/habitacionesApi';
import ModalDetalleHabitacionCliente from '../../components/cliente/ModalDetalleHabitacionCliente';
import { alertaError } from '../../components/SweetAlert';
import type { Habitacion, ImagenHabitacion } from '../../types';
import '../../styles/clienteHabitaciones.css';

const apiUrl = import.meta.env.VITE_API_URL;

function esDisponible(habitacion: Habitacion) {
  return habitacion.estado.toLowerCase() === 'disponible';
}

function obtenerImagenPrincipal(imagenes: ImagenHabitacion[] | undefined | null) {
  if (!imagenes || imagenes.length === 0) {
    return null;
  }

  const principal = imagenes.find((imagen) => imagen.principal);

  return principal || imagenes[0];
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

function ClienteHabitaciones() {
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [habitacionSeleccionada, setHabitacionSeleccionada] =
    useState<Habitacion | null>(null);

  const habitacionesDisponibles = useMemo(() => {
    return habitaciones.filter(esDisponible);
  }, [habitaciones]);

  const cargarHabitaciones = async () => {
    setCargando(true);

    try {
      const data = await obtenerHabitaciones();
      setHabitaciones(data);
    } catch (err) {
      console.error(err);

      await alertaError(
        'Error',
        'No se pudieron cargar las habitaciones disponibles.',
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHabitaciones();
  }, []);

  return (
    <div className="cliente-page">
      <header className="cliente-hero">
        <div className="cliente-hero-overlay">
          <nav className="cliente-navbar">
            <div>
              <strong>Hotel Palmar</strong>
              <span>Habitaciones disponibles</span>
            </div>
          </nav>

          <div className="cliente-hero-content">
            <span>Bienvenido</span>
            <h1>Encuentra una habitación cómoda para tu estadía</h1>
            <p>
              Explora nuestras habitaciones disponibles, revisa sus detalles,
              galería de fotos y tarifas registradas.
            </p>
          </div>
        </div>
      </header>

      <main className="cliente-content">
        <div className="cliente-section-heading">
          <div>
            <span>Disponibles</span>
            <h2>Habitaciones para reservar</h2>
          </div>

          <strong>{habitacionesDisponibles.length} disponibles</strong>
        </div>

        {cargando ? (
          <div className="alert alert-info">
            Cargando habitaciones disponibles...
          </div>
        ) : (
          <div className="cliente-room-grid">
            {habitacionesDisponibles.map((habitacion) => {
              const imagen = obtenerImagenPrincipal(habitacion.imagenes);

              return (
                <article className="cliente-room-card shadow-sm" key={habitacion.id}>
                  {imagen ? (
                    <img
                      src={construirUrlImagen(imagen.imagen_url)}
                      alt={`Habitación ${habitacion.numero}`}
                      className="cliente-room-card-image"
                    />
                  ) : (
                    <div className="cliente-room-card-placeholder">
                      Sin imagen
                    </div>
                  )}

                  <div className="cliente-room-card-body">
                    <div className="cliente-room-card-title">
                      <div>
                        <span>{habitacion.tipo}</span>
                        <h3>Habitación {habitacion.numero}</h3>
                      </div>

                      <span className="badge text-bg-success">
                        {habitacion.estado}
                      </span>
                    </div>

                    <p>{habitacion.descripcion}</p>

                    <div className="cliente-room-card-footer">
                      <span>
                        Capacidad: <strong>{habitacion.capacidad_personas}</strong>
                      </span>

                      <button
                        type="button"
                        className="btn btn-palmar"
                        onClick={() => setHabitacionSeleccionada(habitacion)}
                      >
                        Ver detalle
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}

            {habitacionesDisponibles.length === 0 && (
              <div className="cliente-empty">
                No hay habitaciones disponibles en este momento.
              </div>
            )}
          </div>
        )}
      </main>

      <ModalDetalleHabitacionCliente
        mostrar={Boolean(habitacionSeleccionada)}
        habitacion={habitacionSeleccionada}
        onCerrar={() => setHabitacionSeleccionada(null)}
      />
    </div>
  );
}

export default ClienteHabitaciones;