import { http } from './http';
import { endpoints } from './endpoints';
import type {
  CancelarOrdenPayload,
  CrearOrdenPayload,
  FacturaMesa,
  FacturaPendientePago,
  FacturaRestaurantePendiente,
  FacturasRestauranteReporte,
  MesaPendientePago,
  Orden,
  OrdenDetalle,
  PagarFacturaMesaPayload,
} from '../types';

interface OrdenesResponse {
  mensaje: string;
  ordenes: Orden[];
}

interface OrdenResponse {
  mensaje: string;
  orden: Orden;
}

interface DetalleCocinaResponse {
  mensaje: string;
  detalle: OrdenDetalle;
  orden: Orden;
}

interface MesasPendientesResponse {
  mensaje: string;
  mesas: MesaPendientePago[];
}

interface FacturasPendientesResponse {
  mensaje: string;
  facturas: FacturaPendientePago[];
}

interface FacturaMesaResponse {
  mensaje: string;
  factura: FacturaMesa;
}

interface FacturaRestaurantePendienteResponse {
  mensaje: string;
  factura: FacturaRestaurantePendiente;
}

interface PagarFacturaMesaResponse {
  mensaje: string;
  factura: FacturaMesa;
  pago: {
    referencia: string;
    total_pagado: string | number;
    fecha_pago: string;
    tipo_pago: {
      id: number;
      codigo: string;
      nombre: string;
    };
  };
}

interface FacturasRestauranteResponse {
  mensaje: string;
  reporte: FacturasRestauranteReporte;
}

export async function crearOrden(payload: CrearOrdenPayload): Promise<Orden> {
  const response = await http.post<OrdenResponse>(endpoints.ordenes, payload);
  return response.data.orden;
}

export async function obtenerOrdenes(): Promise<Orden[]> {
  const response = await http.get<OrdenesResponse>(endpoints.ordenes);
  return response.data.ordenes;
}

export async function obtenerOrdenesCocinaHoy(): Promise<Orden[]> {
  const response = await http.get<OrdenesResponse>(endpoints.ordenesCocinaHoy);
  return response.data.ordenes;
}

export async function obtenerMesasPendientesPago(): Promise<MesaPendientePago[]> {
  const response = await http.get<MesasPendientesResponse>(endpoints.mesasPendientesPago);
  return response.data.mesas;
}

export async function obtenerFacturaMesa(
  numeroMesa: number | string,
): Promise<FacturaMesa> {
  const response = await http.get<FacturaMesaResponse>(endpoints.facturaMesa(numeroMesa));
  return response.data.factura;
}

export async function pagarFacturaMesa(
  numeroMesa: number | string,
  payload: PagarFacturaMesaPayload,
): Promise<FacturaMesa> {
  const response = await http.patch<PagarFacturaMesaResponse>(
    endpoints.pagarFacturaMesa(numeroMesa),
    payload,
  );

  return response.data.factura;
}

export async function obtenerFacturasPendientesPago(): Promise<FacturaPendientePago[]> {
  const response = await http.get<FacturasPendientesResponse>(endpoints.facturasPendientesPago);
  return response.data.facturas;
}

export async function obtenerFacturaRestaurantePendiente(
  clave: number | string,
): Promise<FacturaRestaurantePendiente> {
  const response = await http.get<FacturaRestaurantePendienteResponse>(
    endpoints.facturaRestaurantePendiente(clave),
  );

  return response.data.factura;
}

export async function pagarFacturaRestaurantePendiente(
  clave: number | string,
  payload: PagarFacturaMesaPayload,
): Promise<FacturaRestaurantePendiente> {
  const response = await http.patch<PagarFacturaMesaResponse>(
    endpoints.pagarFacturaRestaurantePendiente(clave),
    payload,
  );

  return response.data.factura;
}

export async function obtenerFacturasRestaurante(params: {
  tipo: 'DIA' | 'SEMANA' | 'MES';
  fecha?: string;
  anio?: string;
  mes?: string;
}): Promise<FacturasRestauranteReporte> {
  const response = await http.get<FacturasRestauranteResponse>(
    endpoints.facturasRestaurante,
    { params },
  );

  return response.data.reporte;
}

export async function cancelarOrden(
  id: number | string,
  payload: CancelarOrdenPayload,
): Promise<Orden> {
  const response = await http.patch<OrdenResponse>(
    endpoints.cancelarOrden(id),
    payload,
  );

  return response.data.orden;
}

export async function actualizarEstadoOrden(
  id: number | string,
  estado: Orden['estado'],
): Promise<Orden> {
  const response = await http.patch<OrdenResponse>(
    endpoints.actualizarEstadoOrden(id),
    { estado },
  );

  return response.data.orden;
}

export async function actualizarEstadoDetalleCocina(
  id: number | string,
  estado_cocina: OrdenDetalle['estado_cocina'],
): Promise<DetalleCocinaResponse> {
  const response = await http.patch<DetalleCocinaResponse>(
    endpoints.actualizarEstadoDetalleCocina(id),
    { estado_cocina },
  );

  return response.data;
}
