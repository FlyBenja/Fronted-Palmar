import Swal from 'sweetalert2';
import type { SweetAlertIcon } from 'sweetalert2';

interface AlertaBasicaParams {
  titulo: string;
  texto: string;
  icono: SweetAlertIcon;
}

const clasesBotones = {
  actions: 'd-flex gap-3 justify-content-center',
  confirmButton: 'btn btn-palmar px-4',
  cancelButton: 'btn btn-outline-secondary px-4',
};

export async function mostrarAlerta({
  titulo,
  texto,
  icono,
}: AlertaBasicaParams) {
  await Swal.fire({
    icon: icono,
    title: titulo,
    text: texto,
    confirmButtonText: 'Aceptar',
    buttonsStyling: false,
    customClass: clasesBotones,
  });
}

export async function alertaExito(titulo: string, texto: string) {
  await mostrarAlerta({
    icono: 'success',
    titulo,
    texto,
  });
}

export async function alertaError(titulo: string, texto: string) {
  await mostrarAlerta({
    icono: 'error',
    titulo,
    texto,
  });
}

export async function alertaAdvertencia(titulo: string, texto: string) {
  await mostrarAlerta({
    icono: 'warning',
    titulo,
    texto,
  });
}

export async function alertaInformacion(titulo: string, texto: string) {
  await mostrarAlerta({
    icono: 'info',
    titulo,
    texto,
  });
}

export async function alertaConfirmacionEliminar(
  titulo: string,
  texto: string,
): Promise<boolean> {
  const resultado = await Swal.fire({
    icon: 'warning',
    title: titulo,
    text: texto,
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    buttonsStyling: false,
    customClass: clasesBotones,
  });

  return resultado.isConfirmed;
}