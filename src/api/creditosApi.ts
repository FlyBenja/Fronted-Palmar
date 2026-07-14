import { http } from './http';
import { endpoints } from './endpoints';
import type { CreditoCargo, CreditoCuenta, FacturaCredito } from '../types';

interface CreditosResponse { mensaje: string; creditos: CreditoCuenta[]; }
interface CreditoResponse { mensaje: string; credito: CreditoCuenta; }
interface CargoResponse { mensaje: string; cargo: CreditoCargo; credito: CreditoCuenta; }
interface FacturaCreditoResponse { mensaje: string; factura: FacturaCredito; }

export async function obtenerCreditos(params?: { estado?: string; fecha_inicio?: string; fecha_fin?: string }): Promise<CreditoCuenta[]> {
  const response = await http.get<CreditosResponse>(endpoints.creditos, { params });
  return response.data.creditos;
}

export async function crearCredito(payload: {
  cliente_nombre: string;
  nit?: string;
  telefono?: string;
  empresa?: string;
  descripcion?: string;
}): Promise<CreditoCuenta> {
  const response = await http.post<CreditoResponse>(endpoints.creditos, payload);
  return response.data.credito;
}

export async function agregarCargoCredito(
  id: number | string,
  payload: { tipo_cargo: 'HABITACION' | 'RESTAURANTE' | 'MANUAL'; descripcion: string; monto: number; reservacion_id?: number; habitacion_id?: number },
): Promise<CreditoCargo> {
  const response = await http.post<CargoResponse>(endpoints.creditoCargo(id), payload);
  return response.data.cargo;
}

export async function obtenerFacturaCredito(id: number | string): Promise<FacturaCredito> {
  const response = await http.get<FacturaCreditoResponse>(endpoints.creditoFactura(id));
  return response.data.factura;
}

export async function pagarCredito(id: number | string, tipo_pago_id: number): Promise<FacturaCredito> {
  const response = await http.patch<FacturaCreditoResponse>(endpoints.pagarCredito(id), { tipo_pago_id });
  return response.data.factura;
}
