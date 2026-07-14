import { http } from './http';
import { endpoints } from './endpoints';
import type { EventoRestaurante, FacturaEvento } from '../types';

interface EventosResponse { mensaje: string; eventos: EventoRestaurante[]; }
interface EventoResponse { mensaje: string; evento: EventoRestaurante; }
interface FacturaEventoResponse { mensaje: string; factura: FacturaEvento; }

export async function obtenerEventos(params?: { estado?: string; fecha_inicio?: string; fecha_fin?: string }): Promise<EventoRestaurante[]> {
  const response = await http.get<EventosResponse>(endpoints.eventos, { params });
  return response.data.eventos;
}

export async function crearEvento(payload: {
  cliente_nombre: string;
  nit?: string;
  telefono?: string;
  empresa?: string;
  descripcion?: string;
  fecha_evento?: string;
  cantidad_personas?: number;
  monto_cobrado?: number;
}): Promise<EventoRestaurante> {
  const response = await http.post<EventoResponse>(endpoints.eventos, payload);
  return response.data.evento;
}

export async function obtenerFacturaEvento(id: number | string): Promise<FacturaEvento> {
  const response = await http.get<FacturaEventoResponse>(endpoints.eventoFactura(id));
  return response.data.factura;
}

export async function cerrarEvento(id: number | string, tipo_pago_id: number): Promise<FacturaEvento> {
  const response = await http.patch<FacturaEventoResponse>(endpoints.cerrarEvento(id), { tipo_pago_id });
  return response.data.factura;
}
