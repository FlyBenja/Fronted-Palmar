import { useEffect, useState } from 'react';
import { obtenerHabitaciones, obtenerImagenesHabitacion } from '../../api/habitacionesApi';
import { obtenerTarifas } from '../../api/tarifasApi';
import { alertaAdvertencia, alertaError } from '../SweetAlert';
import type { Habitacion, ImagenHabitacion, TarifaHabitacion } from '../../types';

const apiUrl = import.meta.env.VITE_API_URL;

interface ModalDetalleHabitacionClienteProps {
  habitacion: Habitacion | null;
  mostrar: boolean;
  onCerrar: () => void;
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

function obtenerPrecioTarifa(tarifa: TarifaHabitacion) {
  return Number(tarifa.precio || 0);
}

function ModalDetalleHabitacionCliente({
  habitacion,
  mostrar,
  onCerrar,
}: ModalDetalleHabitacionClienteProps) {
  const [imagenes, setImagenes] = useState<ImagenHabitacion[]>([]);
  const [tarifas, setTarifas] = useState<TarifaHabitacion[]>([]);
  const [indiceImagen, setIndiceImagen] = useState(0);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  useEffect(() => {
    const cargarDetalle = async () => {
      if (!mostrar || !habitacion) {
        return;
      }

      setCargandoDetalle(true);
      setIndiceImagen(0);

      try {
        const [imagenesData, tarifasData] = await Promise.all([
          obtenerImagenesHabitacion(habitacion.id),
          obtenerTarifas(),
        ]);

        setImagenes(ordenarImagenesAlReves(imagenesData));
        setTarifas(tarifasData);
      } catch (err) {
        console.error(err);

        await alertaError(
          'Error',
          'No se pudo cargar el detalle de la habitación.',
        );
      } finally {
        setCargandoDetalle(false);
      }
    };

    cargarDetalle();
  }, [mostrar, habitacion]);

  if (!mostrar || !habitacion) {
    return null;
  }

  const imagenSeleccionada = imagenes[indiceImagen];

  const irAnterior = () => {
    setIndiceImagen((indiceActual) =>
      indiceActual === 0 ? imagenes.length - 1 : indiceActual - 1,
    );
  };

  const irSiguiente = () => {
    setIndiceImagen((indiceActual) =>
      indiceActual === imagenes.length - 1 ? 0 : indiceActual + 1,
    );
  };

  const abrirWhatsApp = async () => {
    try {
      const habitacionesActuales = await obtenerHabitaciones();
      const habitacionActual = habitacionesActuales.find((item) => item.id === habitacion.id);

      if (!habitacionActual || habitacionActual.estado.toLowerCase() !== 'disponible') {
        await alertaAdvertencia(
          'Habitación ocupada',
          'Esta habitación acaba de ser ocupada. Actualizaremos la lista de habitaciones disponibles.',
        );
        window.location.reload();
        return;
      }

      const telefonoHotel = '50236249655';

      const mensaje = `Hola, me gustaría reservar la Habitación ${habitacion.numero}. Tipo: ${habitacion.tipo}. Capacidad: ${habitacion.capacidad_personas} persona(s).`;

      const url = `https://wa.me/${telefonoHotel}?text=${encodeURIComponent(mensaje)}`;

      window.open(url, '_blank');
    } catch (err) {
      console.error(err);
      await alertaError('Error', 'No se pudo validar la disponibilidad de la habitación.');
    }
  };

  return (
    <>
      <div className="modal fade show d-block cliente-room-modal" tabIndex={-1}>
        <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content cliente-room-modal-content">
            <div className="modal-header cliente-room-modal-header">
              <div>
                <span>Detalle de habitación</span>
                <h5 className="modal-title">Habitación {habitacion.numero}</h5>
              </div>

              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={onCerrar}
              />
            </div>

            <div className="modal-body">
              {cargandoDetalle ? (
                <div className="alert alert-info mb-0">
                  Cargando información de la habitación...
                </div>
              ) : (
                <div className="cliente-room-detail">
                  <section className="cliente-room-info">
                    <div>
                      <span className="cliente-section-label">
                        Información
                      </span>

                      <h3>Habitación {habitacion.numero}</h3>

                      <p>{habitacion.descripcion}</p>
                    </div>

                    <div className="cliente-room-info-grid">
                      <div>
                        <span>Tipo</span>
                        <strong>{habitacion.tipo}</strong>
                      </div>

                      <div>
                        <span>Capacidad</span>
                        <strong>{habitacion.capacidad_personas} persona(s)</strong>
                      </div>

                      <div>
                        <span>Estado</span>
                        <strong>{habitacion.estado}</strong>
                      </div>
                    </div>
                  </section>

                  <section className="cliente-gallery-section">
                    <div className="cliente-section-title">
                      <div>
                        <span className="cliente-section-label">
                          Galería
                        </span>
                        <h4>Fotos de la habitación</h4>
                      </div>

                      {imagenes.length > 0 && (
                        <small>
                          Imagen {indiceImagen + 1} de {imagenes.length}
                        </small>
                      )}
                    </div>

                    {imagenes.length === 0 || !imagenSeleccionada ? (
                      <div className="cliente-gallery-empty">
                        Esta habitación todavía no tiene imágenes disponibles.
                      </div>
                    ) : (
                      <div className="cliente-gallery">
                        <div className="cliente-gallery-main">
                          <img
                            src={construirUrlImagen(imagenSeleccionada.imagen_url)}
                            alt={imagenSeleccionada.descripcion}
                          />

                          {imagenes.length > 1 && (
                            <>
                              <button
                                type="button"
                                className="cliente-gallery-arrow cliente-gallery-arrow-left"
                                onClick={irAnterior}
                              >
                                ‹
                              </button>

                              <button
                                type="button"
                                className="cliente-gallery-arrow cliente-gallery-arrow-right"
                                onClick={irSiguiente}
                              >
                                ›
                              </button>
                            </>
                          )}
                        </div>

                        <div className="cliente-gallery-caption">
                          <div>
                            <strong>{imagenSeleccionada.descripcion}</strong>

                            {imagenSeleccionada.principal && (
                              <span className="badge text-bg-success ms-2">
                                Principal
                              </span>
                            )}
                          </div>

                          <span>
                            Imagen {indiceImagen + 1} de {imagenes.length}
                          </span>
                        </div>

                        <div className="cliente-gallery-thumbnails">
                          {imagenes.map((imagen, index) => (
                            <button
                              type="button"
                              key={imagen.id}
                              className={
                                index === indiceImagen
                                  ? 'cliente-gallery-thumb active'
                                  : 'cliente-gallery-thumb'
                              }
                              onClick={() => setIndiceImagen(index)}
                            >
                              <img
                                src={construirUrlImagen(imagen.imagen_url)}
                                alt={imagen.descripcion}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>

                  <section className="cliente-tarifas-section">
                    <div className="cliente-section-title">
                      <div>
                        <h4>Tarifas disponibles</h4>
                      </div>
                    </div>

                    {tarifas.length === 0 ? (
                      <div className="cliente-tarifas-empty">
                        No hay tarifas registradas.
                      </div>
                    ) : (
                      <div className="cliente-tarifas-grid">
                        {tarifas.map((tarifa) => (
                          <div className="cliente-tarifa-card" key={tarifa.id}>
                            <div>
                              <h5>{tarifa.nombre}</h5>
                              <p>{tarifa.descripcion}</p>
                            </div>

                            <strong>
                              Q{obtenerPrecioTarifa(tarifa).toFixed(2)}
                            </strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              )}
            </div>

            <div className="modal-footer justify-content-between">
              <button
                type="button"
                className="btn btn-success d-flex align-items-center gap-2"
                onClick={abrirWhatsApp}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 32 32"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M16.04 2.67c-7.33 0-13.29 5.96-13.29 13.29 0 2.34.61 4.62 1.78 6.63L2.67 29.33l6.91-1.81a13.2 13.2 0 0 0 6.46 1.65h.01c7.33 0 13.29-5.96 13.29-13.29S23.38 2.67 16.04 2.67Zm0 24.25h-.01c-1.94 0-3.84-.52-5.5-1.51l-.39-.23-4.1 1.08 1.09-4-.26-.41a10.96 10.96 0 0 1-1.68-5.89c0-6.09 4.96-11.05 11.06-11.05 2.95 0 5.72 1.15 7.8 3.24a10.98 10.98 0 0 1 3.24 7.81c0 6.09-4.96 11.04-11.05 11.04Zm6.06-8.27c-.33-.17-1.96-.97-2.26-1.08-.3-.11-.52-.17-.74.17-.22.33-.85 1.08-1.04 1.3-.19.22-.38.25-.71.08-.33-.17-1.4-.52-2.67-1.65-.99-.88-1.65-1.97-1.85-2.3-.19-.33-.02-.51.15-.68.15-.15.33-.38.5-.57.17-.19.22-.33.33-.55.11-.22.06-.41-.03-.58-.08-.17-.74-1.79-1.02-2.45-.27-.64-.54-.55-.74-.56h-.63c-.22 0-.58.08-.88.41-.3.33-1.16 1.13-1.16 2.76s1.19 3.2 1.35 3.42c.17.22 2.34 3.57 5.67 5.01.79.34 1.41.54 1.89.69.79.25 1.51.22 2.08.13.64-.1 1.96-.8 2.24-1.57.28-.77.28-1.43.19-1.57-.08-.14-.3-.22-.63-.39Z" />
                </svg>

                Reservar
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onCerrar}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show" />
    </>
  );
}

export default ModalDetalleHabitacionCliente;