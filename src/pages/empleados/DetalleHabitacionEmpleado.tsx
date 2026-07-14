import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  obtenerHabitaciones,
  obtenerImagenesHabitacion,
} from '../../api/habitacionesApi';
import { alertaError } from '../../components/SweetAlert';
import type { Habitacion, ImagenHabitacion } from '../../types';
import '../../styles/detalleHabitacion.css';

const apiUrl = import.meta.env.VITE_API_URL;

interface LocationState {
  habitacion?: Habitacion;
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

function ordenarImagenesAlReves(imagenes: ImagenHabitacion[]) {
  return [...imagenes].reverse();
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

function DetalleHabitacionEmpleado() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as LocationState | null;

  const [habitacion, setHabitacion] = useState<Habitacion | null>(
    state?.habitacion || null,
  );

  const [imagenes, setImagenes] = useState<ImagenHabitacion[]>([]);
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(0);
  const [cargando, setCargando] = useState(true);

  const cargarImagenes = async (habitacionId: string) => {
    const imagenesData = await obtenerImagenesHabitacion(habitacionId);
    const imagenesOrdenadas = ordenarImagenesAlReves(imagenesData);

    setImagenes(imagenesOrdenadas);
  };

  useEffect(() => {
    const cargarDetalle = async () => {
      if (!id) {
        return;
      }

      setCargando(true);

      try {
        await cargarImagenes(id);

        if (!state?.habitacion) {
          const habitaciones = await obtenerHabitaciones();
          const habitacionEncontrada = habitaciones.find(
            (item) => item.id === Number(id),
          );

          if (habitacionEncontrada) {
            setHabitacion(habitacionEncontrada);
          }
        }
      } catch (err) {
        console.error(err);

        await alertaError(
          'Error',
          'No se pudo cargar el detalle de la habitación.',
        );
      } finally {
        setCargando(false);
      }
    };

    cargarDetalle();
  }, [id, state?.habitacion]);

  useEffect(() => {
    if (imagenes.length === 0) {
      setIndiceSeleccionado(0);
      return;
    }

    setIndiceSeleccionado((indiceActual) => {
      if (indiceActual >= imagenes.length) {
        return imagenes.length - 1;
      }

      if (indiceActual < 0) {
        return 0;
      }

      return indiceActual;
    });
  }, [imagenes]);

  const indiceSeguro =
    imagenes.length === 0
      ? 0
      : Math.min(indiceSeleccionado, imagenes.length - 1);

  const imagenSeleccionada = imagenes[indiceSeguro];

  const irAnterior = () => {
    setIndiceSeleccionado((indiceActual) =>
      indiceActual === 0 ? imagenes.length - 1 : indiceActual - 1,
    );
  };

  const irSiguiente = () => {
    setIndiceSeleccionado((indiceActual) =>
      indiceActual === imagenes.length - 1 ? 0 : indiceActual + 1,
    );
  };

  if (cargando) {
    return (
      <div>
        <button
          className="btn btn-outline-secondary mb-3"
          onClick={() => navigate('/empleado/habitaciones')}
        >
          &lt;-- Volver
        </button>

        <div className="alert alert-info">
          Cargando detalle de la habitación...
        </div>
      </div>
    );
  }

  if (!habitacion) {
    return (
      <div>
        <button
          className="btn btn-outline-secondary mb-3"
          onClick={() => navigate('/empleado/habitaciones')}
        >
          &lt;-- Volver
        </button>

        <div className="alert alert-warning">
          No se encontró la información de la habitación.
        </div>
      </div>
    );
  }

  return (
    <div className="detalle-habitacion-page">
      <div className="page-header mb-2">
        <div>
          <h1>Habitación {habitacion.numero}</h1>
          <p>Información de la habitación seleccionada.</p>

          <button
            className="btn btn-outline-secondary mt-2"
            onClick={() => navigate('/empleado/habitaciones')}
          >
            &lt;-- Volver
          </button>
        </div>
      </div>

      <section className="detalle-hero-card shadow-sm">
        <div className="detalle-hero-main">
          <div>
            <span className="detalle-label">Detalle de habitación</span>

            <h2>Habitación {habitacion.numero}</h2>

            <p>{habitacion.descripcion}</p>
          </div>

          <span className={`${obtenerClaseEstado(habitacion.estado)} detalle-status`}>
            {habitacion.estado}
          </span>
        </div>

        <div className="detalle-info-grid">
          <div className="detalle-info-box">
            <span>Tipo</span>
            <strong>{habitacion.tipo}</strong>
          </div>

          <div className="detalle-info-box">
            <span>Capacidad</span>
            <strong>{habitacion.capacidad_personas} persona(s)</strong>
          </div>

          <div className="detalle-info-box">
            <span>Imágenes</span>
            <strong>{imagenes.length}</strong>
          </div>

          <div className="detalle-info-box">
            <span>Fecha de creación</span>
            <strong>
              {new Date(habitacion.fecha_creacion).toLocaleString()}
            </strong>
          </div>

          <div className="detalle-info-box">
            <span>Última actualización</span>
            <strong>
              {habitacion.fecha_actualizacion
                ? new Date(habitacion.fecha_actualizacion).toLocaleString()
                : 'Sin actualización'}
            </strong>
          </div>
        </div>
      </section>

      <section className="detalle-section">
        <div className="detalle-section-header">
          <div>
            <h3>Galería de imágenes</h3>
            <p>Usa los botones laterales para desplazarte entre las fotos.</p>
          </div>
        </div>

        {imagenes.length === 0 || !imagenSeleccionada ? (
          <div className="detalle-gallery-empty">
            Esta habitación todavía no tiene imágenes registradas.
          </div>
        ) : (
          <div className="detalle-gallery">
            <div className="detalle-gallery-main">
              <img
                src={construirUrlImagen(imagenSeleccionada.imagen_url)}
                alt={imagenSeleccionada.descripcion || `Imagen ${imagenSeleccionada.id}`}
                className="detalle-gallery-image"
              />

              {imagenes.length > 1 && (
                <>
                  <button
                    type="button"
                    className="detalle-gallery-arrow detalle-gallery-arrow-left"
                    onClick={irAnterior}
                  >
                    ‹
                  </button>

                  <button
                    type="button"
                    className="detalle-gallery-arrow detalle-gallery-arrow-right"
                    onClick={irSiguiente}
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            <div className="detalle-gallery-caption">
              <div>
                <strong>
                  {imagenSeleccionada.descripcion || 'Sin descripción'}
                </strong>

                {imagenSeleccionada.principal && (
                  <span className="badge text-bg-success ms-2">
                    Principal
                  </span>
                )}
              </div>

              <span>
                Imagen {indiceSeguro + 1} de {imagenes.length}
              </span>
            </div>

            <div className="detalle-gallery-thumbnails">
              {imagenes.map((imagen, index) => (
                <button
                  type="button"
                  key={imagen.id}
                  className={
                    index === indiceSeguro
                      ? 'detalle-gallery-thumbnail active'
                      : 'detalle-gallery-thumbnail'
                  }
                  onClick={() => setIndiceSeleccionado(index)}
                >
                  <img
                    src={construirUrlImagen(imagen.imagen_url)}
                    alt={imagen.descripcion || `Imagen ${imagen.id}`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default DetalleHabitacionEmpleado;