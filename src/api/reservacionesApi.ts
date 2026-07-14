import { http } from './http';
import { endpoints } from './endpoints';
import type {
  CrearReservacionPayload,
  FacturaReservacionResponse,
  PagarReservacionPayload,
  SalidaAnticipadaPayload,
  Reservacion,
} from '../types';

interface CrearReservacionResponse {
  mensaje: string;
  reservacion: Reservacion;
}

interface ReservacionesResponse {
  mensaje?: string;
  reservaciones?: Reservacion[];
}

interface PagarReservacionResponse {
  mensaje: string;
  reservacion: Reservacion;
  factura?: FacturaReservacionResponse['factura'];
}


interface SalidaAnticipadaResponse {
  mensaje: string;
  reservacion: Reservacion;
  factura?: FacturaReservacionResponse['factura'];
}

interface ObtenerFacturaReservacionResponse {
  mensaje: string;
  reservacion: Reservacion;
  factura: FacturaReservacionResponse['factura'];
}

export async function obtenerReservaciones(): Promise<Reservacion[]> {
  const response = await http.get<ReservacionesResponse | Reservacion[]>(
    endpoints.reservaciones,
  );

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return response.data.reservaciones || [];
}

export async function crearReservacion(
  payload: CrearReservacionPayload,
): Promise<Reservacion> {
  const response = await http.post<CrearReservacionResponse>(
    endpoints.reservaciones,
    payload,
  );

  return response.data.reservacion;
}

export async function obtenerFacturaReservacion(
  id: number | string,
): Promise<FacturaReservacionResponse> {
  const response = await http.get<ObtenerFacturaReservacionResponse>(
    endpoints.facturaReservacion(id),
  );

  return {
    reservacion: response.data.reservacion,
    factura: response.data.factura,
  };
}


export async function registrarSalidaAnticipada(
  id: number | string,
  payload: SalidaAnticipadaPayload,
): Promise<Reservacion> {
  const response = await http.patch<SalidaAnticipadaResponse>(
    endpoints.salidaAnticipadaReservacion(id),
    payload,
  );

  return response.data.reservacion;
}

export async function pagarReservacion(
  id: number | string,
  payload: PagarReservacionPayload,
): Promise<Reservacion> {
  const response = await http.patch<PagarReservacionResponse>(
    endpoints.pagarReservacion(id),
    payload,
  );

  return response.data.reservacion;
}