import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { ImagenHabitacion } from '../../types';

const apiUrl = import.meta.env.VITE_API_URL;

interface GaleriaHabitacionProps {
  imagenes: ImagenHabitacion[];
  agregando: boolean;
  eliminandoImagenId: number | null;
  onAgregarImagenes: (archivos: FileList) => Promise<void>;
  onEliminarImagen: (imagen: ImagenHabitacion) => Promise<void>;
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

function GaleriaHabitacion({
  imagenes,
  agregando,
  eliminandoImagenId,
  onAgregarImagenes,
  onEliminarImagen,
}: GaleriaHabitacionProps) {
  const inputFileRef = useRef<HTMLInputElement | null>(null);
  const [indiceSeleccionado, setIndiceSeleccionado] = useState(0);
  const [modoEliminar, setModoEliminar] = useState(false);

  useEffect(() => {
    if (imagenes.length === 0) {
      setIndiceSeleccionado(0);
      setModoEliminar(false);
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

  const abrirSelectorImagenes = () => {
    inputFileRef.current?.click();
  };

  const cambiarArchivos = async (event: ChangeEvent<HTMLInputElement>) => {
    const archivos = event.target.files;

    if (!archivos || archivos.length === 0) {
      return;
    }

    await onAgregarImagenes(archivos);

    event.target.value = '';
  };

  return (
    <div className="detalle-gallery-wrapper">
      <div className="detalle-gallery-actions">
        <input
          ref={inputFileRef}
          type="file"
          accept="image/*"
          multiple
          className="d-none"
          onChange={cambiarArchivos}
        />

        <button
          type="button"
          className="btn btn-palmar"
          onClick={abrirSelectorImagenes}
          disabled={agregando}
        >
          {agregando ? 'Agregando...' : '+ Agregar'}
        </button>

        <button
          type="button"
          className={modoEliminar ? 'btn btn-dark' : 'btn btn-outline-danger'}
          onClick={() => setModoEliminar((valorActual) => !valorActual)}
          disabled={imagenes.length === 0}
        >
          {modoEliminar ? 'Cancelar eliminación' : 'Eliminar'}
        </button>
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
              alt={imagenSeleccionada.descripcion}
              className="detalle-gallery-image"
            />

            {modoEliminar && (
              <button
                type="button"
                className="detalle-gallery-delete-main"
                onClick={() => onEliminarImagen(imagenSeleccionada)}
                disabled={eliminandoImagenId === imagenSeleccionada.id}
                title="Eliminar imagen"
              >
                {eliminandoImagenId === imagenSeleccionada.id ? '...' : '−'}
              </button>
            )}

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
              <strong>{imagenSeleccionada.descripcion}</strong>

              {imagenSeleccionada.principal && (
                <span className="badge text-bg-success ms-2">Principal</span>
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
                  alt={imagen.descripcion}
                />

                {modoEliminar && (
                  <span
                    className="detalle-gallery-delete-thumb"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEliminarImagen(imagen);
                    }}
                  >
                    {eliminandoImagenId === imagen.id ? '...' : '−'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default GaleriaHabitacion;