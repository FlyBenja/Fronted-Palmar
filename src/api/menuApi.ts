import { http } from './http';
import { endpoints } from './endpoints';
import type {
  CategoriaMenu,
  CrearMenuItemPayload,
  MenuItem,
} from '../types';

interface CategoriasMenuResponse {
  mensaje: string;
  categorias: CategoriaMenu[];
}

interface MenuItemsResponse {
  mensaje: string;
  items: MenuItem[];
}

interface CategoriaMenuResponse {
  mensaje: string;
  categoria: CategoriaMenu;
}

interface MenuItemResponse {
  mensaje: string;
  item: MenuItem;
}

function crearFormDataMenu(payload: CrearMenuItemPayload) {
  const formData = new FormData();

  formData.append('categoria_menu_id', String(payload.categoria_menu_id));
  formData.append('nombre', payload.nombre);
  formData.append('descripcion', payload.descripcion || '');
  formData.append('precio', String(payload.precio));
  formData.append('tipo', payload.tipo);
  formData.append('disponible', String(payload.disponible));
  formData.append('ingredientes', JSON.stringify(payload.ingredientes || []));

  if (payload.imagen) {
    formData.append('imagen', payload.imagen);
  }

  return formData;
}

export async function obtenerCategoriasMenu(): Promise<CategoriaMenu[]> {
  const response = await http.get<CategoriasMenuResponse>(endpoints.menuCategorias);
  return response.data.categorias;
}

export async function obtenerMenuItems(incluirIngredientes = false): Promise<MenuItem[]> {
  const response = await http.get<MenuItemsResponse>(endpoints.menuItems, {
    params: {
      disponible: true,
      incluir_ingredientes: incluirIngredientes,
    },
  });

  return response.data.items;
}

export async function obtenerMenuItemsManager(): Promise<MenuItem[]> {
  const response = await http.get<MenuItemsResponse>(endpoints.menuItems, {
    params: {
      incluir_ingredientes: true,
    },
  });

  return response.data.items;
}

export async function crearCategoriaMenu(payload: {
  nombre: string;
  descripcion: string;
}): Promise<CategoriaMenu> {
  const response = await http.post<CategoriaMenuResponse>(
    endpoints.menuCategorias,
    payload,
  );

  return response.data.categoria;
}

export async function crearMenuItem(payload: CrearMenuItemPayload): Promise<MenuItem> {
  const response = await http.post<MenuItemResponse>(
    endpoints.menuItems,
    crearFormDataMenu(payload),
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data.item;
}

export async function actualizarMenuItem(
  id: number | string,
  payload: CrearMenuItemPayload,
): Promise<MenuItem> {
  const response = await http.patch<MenuItemResponse>(
    endpoints.menuItemPorId(id),
    crearFormDataMenu(payload),
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data.item;
}


export async function actualizarCategoriaMenu(
  id: number | string,
  payload: { nombre?: string; descripcion?: string; estado?: boolean; orden?: number },
): Promise<CategoriaMenu> {
  const response = await http.patch<CategoriaMenuResponse>(
    endpoints.menuCategoriaPorId(id),
    payload,
  );

  return response.data.categoria;
}

export async function eliminarCategoriaMenu(id: number | string): Promise<CategoriaMenu> {
  const response = await http.delete<CategoriaMenuResponse>(
    endpoints.menuCategoriaPorId(id),
  );

  return response.data.categoria;
}

export async function reordenarCategoriasMenu(
  categorias: Array<{ id: number; orden: number }>,
): Promise<CategoriaMenu[]> {
  const response = await http.patch<CategoriasMenuResponse>(
    endpoints.menuCategoriasOrden,
    { categorias },
  );

  return response.data.categorias;
}
