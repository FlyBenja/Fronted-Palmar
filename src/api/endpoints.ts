export const endpoints = {
  login: '/auth/login',

  habitaciones: '/habitaciones',
  habitacionPorId: (id: number | string) => `/habitaciones/${id}`,

  estadosHabitacion: '/estados-habitacion',

  imagenesHabitacion: (id: number | string) => `/habitaciones/${id}/imagenes`,
  eliminarImagenHabitacion: (id: number | string) => `/habitaciones/imagenes/${id}`,

  tarifas: '/tarifas',
  tarifaPorId: (id: number | string) => `/tarifas/${id}`,

  reservaciones: '/reservaciones',
  facturaReservacion: (id: number | string) => `/reservaciones/${id}/factura`,
  pagarReservacion: (id: number | string) => `/reservaciones/${id}/pagar`,
  salidaAnticipadaReservacion: (id: number | string) => `/reservaciones/${id}/salida-anticipada`,

  inventarioCategorias: '/inventario/categorias',
  inventarioCategoriaPorId: (id: number | string) => `/inventario/categorias/${id}`,
  inventarioProductos: '/inventario/productos',
  inventarioProductoPorId: (id: number | string) => `/inventario/productos/${id}`,
  inventarioMovimientos: '/inventario/movimientos',

  menuCategorias: '/menu/categorias',
  menuCategoriaPorId: (id: number | string) => `/menu/categorias/${id}`,
  menuCategoriasOrden: '/menu/categorias/orden',
  menuItems: '/menu/items',
  menuItemPorId: (id: number | string) => `/menu/items/${id}`,

  ordenes: '/ordenes',
  ordenesCocinaHoy: '/ordenes/cocina/hoy',
  mesasPendientesPago: '/ordenes/mesas/pendientes',
  facturaMesa: (numeroMesa: number | string) => `/ordenes/mesas/${numeroMesa}/factura`,
  pagarFacturaMesa: (numeroMesa: number | string) => `/ordenes/mesas/${numeroMesa}/pagar`,
  facturasPendientesPago: '/ordenes/facturas/pendientes',
  facturaRestaurantePendiente: (clave: number | string) => `/ordenes/facturas/${encodeURIComponent(String(clave))}`,
  pagarFacturaRestaurantePendiente: (clave: number | string) => `/ordenes/facturas/${encodeURIComponent(String(clave))}/pagar`,
  facturasRestaurante: '/ordenes/facturas',
  actualizarEstadoOrden: (id: number | string) => `/ordenes/${id}/estado`,
  cancelarOrden: (id: number | string) => `/ordenes/${id}/cancelar`,
  actualizarEstadoDetalleCocina: (id: number | string) => `/ordenes/detalles/${id}/estado-cocina`,

  eventos: '/eventos',
  eventoFactura: (id: number | string) => `/eventos/${id}/factura`,
  cerrarEvento: (id: number | string) => `/eventos/${id}/cerrar`,

  creditos: '/creditos',
  creditoCargo: (id: number | string) => `/creditos/${id}/cargos`,
  creditoFactura: (id: number | string) => `/creditos/${id}/factura`,
  pagarCredito: (id: number | string) => `/creditos/${id}/pagar`,

  reporteFinancieroDia: '/reportes/financiero/dia',
  reporteFinancieroSemana: '/reportes/financiero/semana',
  reporteFinancieroMes: '/reportes/financiero/mes',
};
