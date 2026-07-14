import { http } from './http';
import { endpoints } from './endpoints';
import type {
  ActualizarHabitacionPayload,
  CrearHabitacionPayload,
  EstadoHabitacion,
  Habitacion,
  ImagenHabitacion,
} from '../types';

interface HabitacionesResponse {
  mensaje: string;
  habitaciones: Habitacion[];
}

interface CrearHabitacionResponse {
  mensaje: string;
  habitacion: Habitacion;
}

interface ActualizarHabitacionResponse {
  mensaje: string;
  habitacion: Habitacion;
}

interface EstadosHabitacionResponse {
  mensaje: string;
  estados: EstadoHabitacion[];
}

interface ImagenesHabitacionResponse {
  mensaje: string;
  imagenes: ImagenHabitacion[];
}

interface SubirImagenResponse {
  mensaje: string;
  imagen: ImagenHabitacion;
}

interface EliminarImagenResponse {
  mensaje: string;
}

export async function obtenerHabitaciones(): Promise<Habitacion[]> {
  const response = await http.get<HabitacionesResponse>(endpoints.habitaciones);
  return response.data.habitaciones;
}

export async function crearHabitacion(payload: CrearHabitacionPayload): Promise<Habitacion> {
  const response = await http.post<CrearHabitacionResponse>(
    endpoints.habitaciones,
    payload,
  );

  return response.data.habitacion;
}

export async function actualizarHabitacion(
  habitacionId: number | string,
  payload: ActualizarHabitacionPayload,
): Promise<Habitacion> {
  const response = await http.patch<ActualizarHabitacionResponse>(
    endpoints.habitacionPorId(habitacionId),
    payload,
  );

  return response.data.habitacion;
}

export async function obtenerEstadosHabitacion(): Promise<EstadoHabitacion[]> {
  const response = await http.get<EstadosHabitacionResponse>(
    endpoints.estadosHabitacion,
  );

  return response.data.estados;
}

export async function obtenerImagenesHabitacion(
  habitacionId: number | string,
): Promise<ImagenHabitacion[]> {
  const response = await http.get<ImagenesHabitacionResponse>(
    endpoints.imagenesHabitacion(habitacionId),
  );

  return response.data.imagenes;
}

export async function subirImagenHabitacion(
  habitacionId: number | string,
  archivo: File,
): Promise<ImagenHabitacion> {
  const formData = new FormData();

  formData.append('imagen', archivo);
  formData.append('descripcion', 'Vista principal de la habitación');
  formData.append('principal', 'false');

  const response = await http.post<SubirImagenResponse>(
    endpoints.imagenesHabitacion(habitacionId),
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data.imagen;
}

export async function eliminarImagenHabitacion(
  imagenId: number | string,
): Promise<string> {
  const response = await http.delete<EliminarImagenResponse>(
    endpoints.eliminarImagenHabitacion(imagenId),
  );

  return response.data.mensaje;
}