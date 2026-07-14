import { http } from './http';
import { endpoints } from './endpoints';
import type { ReporteFinanciero } from '../types';

interface ReporteFinancieroResponse {
  mensaje: string;
  reporte: ReporteFinanciero;
}

export async function obtenerReporteFinancieroDia(
  fecha: string,
): Promise<ReporteFinanciero> {
  const response = await http.get<ReporteFinancieroResponse>(
    endpoints.reporteFinancieroDia,
    {
      params: {
        fecha,
      },
    },
  );

  return response.data.reporte;
}


export async function obtenerReporteFinancieroSemana(
  fecha: string,
): Promise<ReporteFinanciero> {
  const response = await http.get<ReporteFinancieroResponse>(
    endpoints.reporteFinancieroSemana,
    {
      params: {
        fecha,
      },
    },
  );

  return response.data.reporte;
}

export async function obtenerReporteFinancieroMes(
  anio: number,
  mes: number,
): Promise<ReporteFinanciero> {
  const response = await http.get<ReporteFinancieroResponse>(
    endpoints.reporteFinancieroMes,
    {
      params: {
        anio,
        mes,
      },
    },
  );

  return response.data.reporte;
}
