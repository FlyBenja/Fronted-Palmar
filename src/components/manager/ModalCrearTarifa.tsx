import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type {
  ActualizarTarifaPayload,
  CrearTarifaPayload,
  TarifaHabitacion,
} from '../../types';

type PayloadTarifa = CrearTarifaPayload | ActualizarTarifaPayload;

interface ModalCrearTarifaProps {
  mostrar: boolean;
  guardando: boolean;
  tarifaEditar: TarifaHabitacion | null;
  onCerrar: () => void;
  onGuardar: (payload: PayloadTarifa) => Promise<void>;
}

function ModalCrearTarifa({
  mostrar,
  guardando,
  tarifaEditar,
  onCerrar,
  onGuardar,
}: ModalCrearTarifaProps) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [precioAdultoExtra, setPrecioAdultoExtra] = useState('100');
  const [precioNinoExtra, setPrecioNinoExtra] = useState('50');
  const [desayunosIncluidos, setDesayunosIncluidos] = useState('0');
  const [almuerzosIncluidos, setAlmuerzosIncluidos] = useState('0');
  const [cenasIncluidas, setCenasIncluidas] = useState('0');

  const esEdicion = Boolean(tarifaEditar);

  const limpiarFormulario = () => {
    setNombre('');
    setDescripcion('');
    setPrecio('');
    setPrecioAdultoExtra('100');
    setPrecioNinoExtra('50');
    setDesayunosIncluidos('0');
    setAlmuerzosIncluidos('0');
    setCenasIncluidas('0');
  };

  useEffect(() => {
    if (!mostrar) {
      return;
    }

    if (tarifaEditar) {
      setNombre(tarifaEditar.nombre);
      setDescripcion(tarifaEditar.descripcion || '');
      setPrecio(String(tarifaEditar.precio));
      setPrecioAdultoExtra(String(tarifaEditar.precio_adulto_extra ?? 100));
      setPrecioNinoExtra(String(tarifaEditar.precio_nino_extra ?? 50));
      setDesayunosIncluidos(String(tarifaEditar.desayunos_incluidos ?? 0));
      setAlmuerzosIncluidos(String(tarifaEditar.almuerzos_incluidos ?? 0));
      setCenasIncluidas(String(tarifaEditar.cenas_incluidas ?? 0));
      return;
    }

    limpiarFormulario();
  }, [mostrar, tarifaEditar]);

  const enviarFormulario = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onGuardar({
      nombre,
      descripcion,
      precio: Number(precio),
      precio_adulto_extra: Number(precioAdultoExtra),
      precio_nino_extra: Number(precioNinoExtra),
      desayunos_incluidos: Number(desayunosIncluidos),
      almuerzos_incluidos: Number(almuerzosIncluidos),
      cenas_incluidas: Number(cenasIncluidas),
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
                  {esEdicion ? 'Editar tarifa' : 'Nueva tarifa'}
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
                  <div className="col-md-8">
                    <label className="form-label">Nombre de la tarifa</label>
                    <input
                      type="text"
                      className="form-control"
                      value={nombre}
                      onChange={(event) => setNombre(event.target.value)}
                      placeholder="Habitación doble con desayuno"
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Precio base</label>
                    <input
                      type="number"
                      className="form-control"
                      value={precio}
                      onChange={(event) => setPrecio(event.target.value)}
                      placeholder="350"
                      min="1"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Descripción</label>
                    <textarea
                      className="form-control"
                      value={descripcion}
                      onChange={(event) => setDescripcion(event.target.value)}
                      placeholder="Tarifa normal, viajero, con desayuno incluido..."
                      rows={3}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Adulto extra por día</label>
                    <input
                      type="number"
                      className="form-control"
                      value={precioAdultoExtra}
                      onChange={(event) => setPrecioAdultoExtra(event.target.value)}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Niño extra por día</label>
                    <input
                      type="number"
                      className="form-control"
                      value={precioNinoExtra}
                      onChange={(event) => setPrecioNinoExtra(event.target.value)}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Desayunos incluidos</label>
                    <input
                      type="number"
                      className="form-control"
                      value={desayunosIncluidos}
                      onChange={(event) => setDesayunosIncluidos(event.target.value)}
                      min="0"
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Almuerzos incluidos</label>
                    <input
                      type="number"
                      className="form-control"
                      value={almuerzosIncluidos}
                      onChange={(event) => setAlmuerzosIncluidos(event.target.value)}
                      min="0"
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label">Cenas incluidas</label>
                    <input
                      type="number"
                      className="form-control"
                      value={cenasIncluidas}
                      onChange={(event) => setCenasIncluidas(event.target.value)}
                      min="0"
                    />
                  </div>
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
                  disabled={guardando}
                >
                  {guardando
                    ? esEdicion
                      ? 'Actualizando...'
                      : 'Guardando...'
                    : esEdicion
                      ? 'Actualizar tarifa'
                      : 'Guardar tarifa'}
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

export default ModalCrearTarifa;
