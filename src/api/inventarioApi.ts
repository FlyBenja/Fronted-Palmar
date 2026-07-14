import { http } from './http';
import { endpoints } from './endpoints';
import type {
  CategoriaInventario,
  CrearCategoriaInventarioPayload,
  CrearMovimientoInventarioPayload,
  CrearProductoInventarioPayload,
  InventarioMovimiento,
  ProductoInventario,
} from '../types';

interface CategoriasInventarioResponse {
  mensaje: string;
  categorias: CategoriaInventario[];
}

interface CategoriaInventarioResponse {
  mensaje: string;
  categoria: CategoriaInventario;
}

interface ProductosInventarioResponse {
  mensaje: string;
  productos: ProductoInventario[];
}

interface ProductoInventarioResponse {
  mensaje: string;
  producto: ProductoInventario;
}

interface MovimientosInventarioResponse {
  mensaje: string;
  movimientos: InventarioMovimiento[];
}

interface MovimientoInventarioResponse {
  mensaje: string;
  movimiento: InventarioMovimiento;
  producto: ProductoInventario;
}

export async function obtenerCategoriasInventario(): Promise<CategoriaInventario[]> {
  const response = await http.get<CategoriasInventarioResponse>(
    endpoints.inventarioCategorias,
  );

  return response.data.categorias;
}

export async function crearCategoriaInventario(
  payload: CrearCategoriaInventarioPayload,
): Promise<CategoriaInventario> {
  const response = await http.post<CategoriaInventarioResponse>(
    endpoints.inventarioCategorias,
    payload,
  );

  return response.data.categoria;
}

export async function actualizarCategoriaInventario(
  id: number | string,
  payload: Partial<CrearCategoriaInventarioPayload> & { estado?: boolean },
): Promise<CategoriaInventario> {
  const response = await http.patch<CategoriaInventarioResponse>(
    endpoints.inventarioCategoriaPorId(id),
    payload,
  );

  return response.data.categoria;
}

export async function obtenerProductosInventario(): Promise<ProductoInventario[]> {
  const response = await http.get<ProductosInventarioResponse>(
    endpoints.inventarioProductos,
  );

  return response.data.productos;
}

export async function crearProductoInventario(
  payload: CrearProductoInventarioPayload,
): Promise<ProductoInventario> {
  const response = await http.post<ProductoInventarioResponse>(
    endpoints.inventarioProductos,
    payload,
  );

  return response.data.producto;
}

export async function actualizarProductoInventario(
  id: number | string,
  payload: Partial<CrearProductoInventarioPayload> & { estado?: boolean },
): Promise<ProductoInventario> {
  const response = await http.patch<ProductoInventarioResponse>(
    endpoints.inventarioProductoPorId(id),
    payload,
  );

  return response.data.producto;
}

export async function obtenerMovimientosInventario(): Promise<InventarioMovimiento[]> {
  const response = await http.get<MovimientosInventarioResponse>(
    endpoints.inventarioMovimientos,
  );

  return response.data.movimientos;
}

export async function crearMovimientoInventario(
  payload: CrearMovimientoInventarioPayload,
): Promise<MovimientoInventarioResponse> {
  const response = await http.post<MovimientoInventarioResponse>(
    endpoints.inventarioMovimientos,
    payload,
  );

  return response.data;
}
