import { http } from './http';
import { endpoints } from './endpoints';
import type {
  ActualizarTarifaPayload,
  CrearTarifaPayload,
  TarifaHabitacion,
} from '../types';

interface TarifasResponse {
  mensaje: string;
  tarifas: TarifaHabitacion[];
}

interface CrearTarifaResponse {
  mensaje: string;
  tarifa: TarifaHabitacion;
}

interface ActualizarTarifaResponse {
  mensaje: string;
  tarifa: TarifaHabitacion;
}

export async function obtenerTarifas(): Promise<TarifaHabitacion[]> {
  const response = await http.get<TarifasResponse>(endpoints.tarifas);
  return response.data.tarifas;
}

export async function crearTarifa(
  payload: CrearTarifaPayload,
): Promise<TarifaHabitacion> {
  const response = await http.post<CrearTarifaResponse>(
    endpoints.tarifas,
    payload,
  );

  return response.data.tarifa;
}

export async function actualizarTarifa(
  tarifaId: number | string,
  payload: ActualizarTarifaPayload,
): Promise<TarifaHabitacion> {
  const response = await http.patch<ActualizarTarifaResponse>(
    endpoints.tarifaPorId(tarifaId),
    payload,
  );

  return response.data.tarifa;
}