import { useEffect, useState } from 'react';
import {
  actualizarTarifa,
  crearTarifa,
  obtenerTarifas,
} from '../../api/tarifasApi';
import ModalCrearTarifa from '../../components/manager/ModalCrearTarifa';
import { alertaError, alertaExito } from '../../components/SweetAlert';
import type {
  ActualizarTarifaPayload,
  CrearTarifaPayload,
  TarifaHabitacion,
} from '../../types';
import '../../styles/crearTarifas.css';

function formatearFecha(fecha: string | null | undefined) {
  if (!fecha) {
    return 'Sin fecha';
  }

  return new Date(fecha).toLocaleString('es-GT');
}

function ordenarTarifasMasViejasPrimero(tarifas: TarifaHabitacion[]) {
  return [...tarifas].sort((a, b) => {
    const fechaA = new Date(a.fecha_creacion).getTime();
    const fechaB = new Date(b.fecha_creacion).getTime();

    return fechaA - fechaB;
  });
}

function CrearTarifas() {
  const [tarifas, setTarifas] = useState<TarifaHabitacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [tarifaEditar, setTarifaEditar] = useState<TarifaHabitacion | null>(null);

  const cargarTarifas = async () => {
    setCargando(true);

    try {
      const data = await obtenerTarifas();
      const tarifasOrdenadas = ordenarTarifasMasViejasPrimero(data);

      setTarifas(tarifasOrdenadas);
    } catch (err) {
      console.error(err);

      await alertaError(
        'Error',
        'No se pudieron cargar las tarifas.',
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTarifas();
  }, []);

  const abrirModalCrear = () => {
    setTarifaEditar(null);
    setMostrarModal(true);
  };

  const abrirModalEditar = (tarifa: TarifaHabitacion) => {
    setTarifaEditar(tarifa);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    if (guardando) {
      return;
    }

    setMostrarModal(false);
    setTarifaEditar(null);
  };

  const guardarTarifa = async (
    payload: CrearTarifaPayload | ActualizarTarifaPayload,
  ) => {
    setGuardando(true);

    try {
      if (tarifaEditar) {
        await actualizarTarifa(tarifaEditar.id, payload);

        setMostrarModal(false);
        setTarifaEditar(null);

        await cargarTarifas();

        await alertaExito(
          '¡Tarifa actualizada!',
          'La tarifa fue actualizada correctamente.',
        );

        return;
      }

      await crearTarifa(payload);

      setMostrarModal(false);

      await cargarTarifas();

      await alertaExito(
        '¡Tarifa creada!',
        'La tarifa fue registrada correctamente.',
      );
    } catch (err) {
      console.error(err);

      await alertaError(
        'Error',
        tarifaEditar
          ? 'No se pudo actualizar la tarifa. Revisa los datos o el backend.'
          : 'No se pudo crear la tarifa. Revisa los datos o el backend.',
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="crear-tarifas-page">
      <div className="page-header">
        <div>
          <h1>Tarifas</h1>
          <p>Administración de tarifas disponibles para reservaciones.</p>
        </div>

        <button
          className="btn btn-palmar"
          type="button"
          onClick={abrirModalCrear}
        >
          Nueva tarifa
        </button>
      </div>

      <div className="crear-tarifas-card shadow-sm">
        {cargando ? (
          <div className="alert alert-info mb-0">Cargando tarifas...</div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Precio</th>
                  <th>Extras</th>
                  <th>Comidas incluidas</th>
                  <th>Fecha de creación</th>
                  <th>Última actualización</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {tarifas.map((tarifa) => (
                  <tr key={tarifa.id}>

                    <td>
                      <strong>{tarifa.nombre}</strong>
                    </td>

                    <td>{tarifa.descripcion}</td>

                    <td>
                      <span className="tarifa-precio">
                        Q{Number(tarifa.precio || 0).toFixed(2)}
                      </span>
                    </td>

                    <td>
                      Adulto Q{Number(tarifa.precio_adulto_extra ?? 100).toFixed(2)} · Niño Q{Number(tarifa.precio_nino_extra ?? 50).toFixed(2)}
                    </td>

                    <td>
                      D:{tarifa.desayunos_incluidos ?? 0} · A:{tarifa.almuerzos_incluidos ?? 0} · C:{tarifa.cenas_incluidas ?? 0}
                    </td>

                    <td>{formatearFecha(tarifa.fecha_creacion)}</td>

                    <td>{formatearFecha(tarifa.fecha_actualizacion)}</td>

                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => abrirModalEditar(tarifa)}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}

                {tarifas.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      No hay tarifas registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ModalCrearTarifa
        mostrar={mostrarModal}
        guardando={guardando}
        tarifaEditar={tarifaEditar}
        onCerrar={cerrarModal}
        onGuardar={guardarTarifa}
      />
    </div>
  );
}

export default CrearTarifas;