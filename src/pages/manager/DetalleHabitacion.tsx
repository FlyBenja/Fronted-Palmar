import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  eliminarImagenHabitacion,
  obtenerHabitaciones,
  obtenerImagenesHabitacion,
  subirImagenHabitacion,
} from '../../api/habitacionesApi';
import GaleriaHabitacion from '../../components/manager/GaleriaHabitacion';
import {
  alertaConfirmacionEliminar,
  alertaError,
  alertaExito,
} from '../../components/SweetAlert';
import type { Habitacion, ImagenHabitacion } from '../../types';
import '../../styles/detalleHabitacion.css';

interface LocationState {
  habitacion?: Habitacion;
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

function DetalleHabitacion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as LocationState | null;

  const [habitacion, setHabitacion] = useState<Habitacion | null>(
    state?.habitacion || null,
  );

  const [imagenes, setImagenes] = useState<ImagenHabitacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [agregandoImagen, setAgregandoImagen] = useState(false);
  const [eliminandoImagenId, setEliminandoImagenId] = useState<number | null>(null);

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

  const agregarImagenes = async (archivos: FileList) => {
    if (!id) {
      return;
    }

    setAgregandoImagen(true);

    try {
      const archivosArray = Array.from(archivos);

      for (const archivo of archivosArray) {
        await subirImagenHabitacion(id, archivo);
      }

      await cargarImagenes(id);

      await alertaExito(
        '¡Imagen agregada!',
        archivosArray.length === 1
          ? 'La imagen fue subida correctamente.'
          : 'Las imágenes fueron subidas correctamente.',
      );
    } catch (err) {
      console.error(err);

      await alertaError(
        'Error',
        'No se pudo subir la imagen. Revisa el archivo o el backend.',
      );
    } finally {
      setAgregandoImagen(false);
    }
  };

  const eliminarImagen = async (imagen: ImagenHabitacion) => {
    if (!id) {
      return;
    }

    const confirmado = await alertaConfirmacionEliminar(
      '¿Eliminar imagen?',
      'Esta acción eliminará la imagen de la habitación.',
    );

    if (!confirmado) {
      return;
    }

    setEliminandoImagenId(imagen.id);

    try {
      await eliminarImagenHabitacion(imagen.id);
      await cargarImagenes(id);

      await alertaExito(
        '¡Imagen eliminada!',
        'La imagen fue eliminada correctamente.',
      );
    } catch (err) {
      console.error(err);

      await alertaError(
        'Error',
        'No se pudo eliminar la imagen.',
      );
    } finally {
      setEliminandoImagenId(null);
    }
  };

  if (cargando) {
    return (
      <div>
        <button
          className="btn btn-outline-secondary mb-3"
          onClick={() => navigate('/manager/habitaciones')}
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
          onClick={() => navigate('/manager/habitaciones')}
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
          <p>Información completa de la habitación seleccionada.</p>

          <button
            className="btn btn-outline-secondary mt-2"
            onClick={() => navigate('/manager/habitaciones')}
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

        <GaleriaHabitacion
          imagenes={imagenes}
          agregando={agregandoImagen}
          eliminandoImagenId={eliminandoImagenId}
          onAgregarImagenes={agregarImagenes}
          onEliminarImagen={eliminarImagen}
        />
      </section>
    </div>
  );
}

export default DetalleHabitacion;