import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type {
  ActualizarHabitacionPayload,
  CrearHabitacionPayload,
  EstadoHabitacion,
  Habitacion,
} from '../../types';

type PayloadHabitacion = CrearHabitacionPayload | ActualizarHabitacionPayload;

interface ModalCrearHabitacionProps {
  mostrar: boolean;
  guardando: boolean;
  cargandoEstados: boolean;
  habitacionEditar: Habitacion | null;
  estadosHabitacion: EstadoHabitacion[];
  onCerrar: () => void;
  onGuardar: (payload: PayloadHabitacion) => Promise<void>;
}

function obtenerEstadoIdDesdeCatalogo(
  habitacionEditar: Habitacion,
  estadosHabitacion: EstadoHabitacion[],
) {
  const estadoHabitacion = habitacionEditar.estado.toLowerCase();

  const estadoEncontrado = estadosHabitacion.find((estado) => {
    return (
      estado.nombre.toLowerCase() === estadoHabitacion ||
      estado.codigo.toLowerCase() === estadoHabitacion
    );
  });

  return estadoEncontrado?.id || 1;
}

function ModalCrearHabitacion({
  mostrar,
  guardando,
  cargandoEstados,
  habitacionEditar,
  estadosHabitacion,
  onCerrar,
  onGuardar,
}: ModalCrearHabitacionProps) {
  const [numero, setNumero] = useState('');
  const [tipo, setTipo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [capacidadPersonas, setCapacidadPersonas] = useState('');
  const [estadoId, setEstadoId] = useState('1');

  const esEdicion = Boolean(habitacionEditar);

  const limpiarFormulario = () => {
    setNumero('');
    setTipo('');
    setDescripcion('');
    setCapacidadPersonas('');
    setEstadoId('1');
  };

  useEffect(() => {
    if (!mostrar) {
      return;
    }

    if (habitacionEditar) {
      setNumero(habitacionEditar.numero);
      setTipo(habitacionEditar.tipo);
      setDescripcion(habitacionEditar.descripcion);
      setCapacidadPersonas(String(habitacionEditar.capacidad_personas));

      const estadoEncontradoId = obtenerEstadoIdDesdeCatalogo(
        habitacionEditar,
        estadosHabitacion,
      );

      setEstadoId(String(estadoEncontradoId));
      return;
    }

    limpiarFormulario();
  }, [mostrar, habitacionEditar, estadosHabitacion]);

  const enviarFormulario = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onGuardar({
      numero,
      tipo,
      descripcion,
      capacidad_personas: Number(capacidadPersonas),
      estado_id: esEdicion ? Number(estadoId) : 1,
    });
  };

  if (!mostrar) {
    return null;
  }

  return (
    <>
      <div className="modal fade show d-block" tabIndex={-1}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={enviarFormulario}>
              <div className="modal-header modal-palmar">
                <h5 className="modal-title">
                  {esEdicion ? 'Editar habitación' : 'Nueva habitación'}
                </h5>

                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={onCerrar}
                  disabled={guardando}
                />
              </div>

              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Número de habitación</label>
                    <input
                      type="text"
                      className="form-control"
                      value={numero}
                      onChange={(event) => setNumero(event.target.value)}
                      placeholder="Ejemplo: 2"
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Tipo</label>
                    <input
                      type="text"
                      className="form-control"
                      value={tipo}
                      onChange={(event) => setTipo(event.target.value)}
                      placeholder="Simple, Doble, Suite..."
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Descripción</label>
                    <textarea
                      className="form-control"
                      value={descripcion}
                      onChange={(event) => setDescripcion(event.target.value)}
                      placeholder="Suite con baño privado y aire acondicionado"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Capacidad de personas</label>
                    <input
                      type="number"
                      className="form-control"
                      value={capacidadPersonas}
                      onChange={(event) => setCapacidadPersonas(event.target.value)}
                      placeholder="4"
                      min="1"
                      required
                    />
                  </div>

                  {esEdicion ? (
                    <div className="col-md-6">
                      <label className="form-label">Estado</label>

                      <select
                        className="form-select"
                        value={estadoId}
                        onChange={(event) => setEstadoId(event.target.value)}
                        disabled={cargandoEstados}
                        required
                      >
                        {cargandoEstados ? (
                          <option value="">Cargando estados...</option>
                        ) : (
                          estadosHabitacion.map((estado) => (
                            <option key={estado.id} value={estado.id}>
                              {estado.nombre}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  ) : (
                    <div className="col-12">
                      <div className="alert alert-info mb-0">
                        La habitación se creará automáticamente con estado Disponible.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onCerrar}
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn btn-palmar"
                  disabled={guardando || (esEdicion && cargandoEstados)}
                >
                  {guardando
                    ? esEdicion
                      ? 'Actualizando...'
                      : 'Guardando...'
                    : esEdicion
                      ? 'Actualizar habitación'
                      : 'Guardar habitación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show" />
    </>
  );
}

export default ModalCrearHabitacion;