export interface ImagenHabitacion {
  id: number;
  habitacion_id: number;
  imagen_url: string;
  descripcion: string;
  principal: boolean;
  fecha_creacion: string;
}

export interface Habitacion {
  id: number;
  numero: string;
  tipo: string;
  descripcion: string;
  capacidad_personas: number;
  estado: string;
  imagenes: ImagenHabitacion[];
  fecha_creacion: string;
  fecha_actualizacion: string | null;
}

export interface CrearHabitacionPayload {
  numero: string;
  tipo: string;
  descripcion: string;
  capacidad_personas: number;
  estado_id: number;
}

export interface ActualizarHabitacionPayload {
  numero: string;
  tipo: string;
  descripcion: string;
  capacidad_personas: number;
  estado_id: number;
}

export interface EstadoHabitacion {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  color: string;
  permite_reservar: boolean;
  estado: boolean;
  orden?: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface EstadoReservacion {
  id?: number;
  codigo?: string;
  nombre?: string;
}

export interface CrearReservacionPayload {
  habitacion_id: number;
  tarifa_id: number;
  nombre_cliente: string;
  nit: string;
  fecha_entrada: string;
  dias: number;
  cantidad_personas_extra?: number;
  adultos_extra?: number;
  ninos_extra?: number;
}

export interface TarifaHabitacion {
  id: number;
  nombre: string;
  descripcion: string;
  precio: string | number;
  precio_adulto_extra?: string | number;
  precio_nino_extra?: string | number;
  desayunos_incluidos?: number;
  almuerzos_incluidos?: number;
  cenas_incluidas?: number;
  fecha_creacion: string;
  fecha_actualizacion: string | null;
}

export interface CrearTarifaPayload {
  nombre: string;
  descripcion: string;
  precio: number;
  precio_adulto_extra?: number;
  precio_nino_extra?: number;
  desayunos_incluidos?: number;
  almuerzos_incluidos?: number;
  cenas_incluidas?: number;
}

export interface ActualizarTarifaPayload {
  nombre: string;
  descripcion: string;
  precio: number;
  precio_adulto_extra?: number;
  precio_nino_extra?: number;
  desayunos_incluidos?: number;
  almuerzos_incluidos?: number;
  cenas_incluidas?: number;
}

export interface ReservacionTarifa {
  id: number;
  nombre: string;
  descripcion: string;
  precio: string;
}

export interface ReservacionHabitacion {
  id: number;
  numero: string;
  tipo: string;
  estado: string;
}

export interface ReservacionTipoPago {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
}

export interface Reservacion {
  id: number;
  nombre_cliente: string;
  nit: string;
  fecha_entrada: string;
  fecha_salida: string;
  dias: number;
  cantidad_personas: number;
  cantidad_personas_extra?: number;
  adultos_extra?: number;
  ninos_extra?: number;
  monto_personas_extra?: string | number;
  monto_adultos_extra?: string | number;
  monto_ninos_extra?: string | number;
  motivo_salida_anticipada?: string | null;
  total_reservacion: string;
  total_cargos?: string;
  total_a_pagar?: string;
  precio_pagado: string;
  total_pagado?: string;
  saldo?: string;
  estado: string;
  tarifa: ReservacionTarifa;
  tipo_pago: ReservacionTipoPago | null;
  habitacion: ReservacionHabitacion;
  fecha_creacion: string;
  fecha_actualizacion?: string | null;
}

export interface PagarReservacionPayload {
  tipo_pago_id: number;
  precio_pagado?: number;
}

export interface SalidaAnticipadaPayload {
  fecha_salida: string;
  motivo: string;
}

export interface FacturaReservacionCargo {
  id: number;
  reservacion_id: number;
  orden_id: number | null;
  tipo_cargo: 'ORDEN' | 'MANUAL' | 'EXTRA';
  descripcion: string;
  monto: string | number;
  estado: 'PENDIENTE' | 'PAGADO' | 'ANULADO';
  fecha_cargo: string;
  fecha_creacion: string;
  orden: {
    id: number;
    tipo_orden: string;
    numero_mesa: string | null;
    habitacion_id: number | null;
    subtotal: string | number;
    total: string | number;
    estado: string;
    observaciones: string | null;
    fecha_creacion: string;
    detalles: Array<{
      id: number;
      menu_item_id: number;
      nombre: string;
      descripcion: string | null;
      cantidad: number;
      precio_unitario: string | number;
      subtotal: string | number;
      observaciones: string | null;
      estado_cocina: string;
      exclusiones?: Array<{
        producto_inventario_id: number;
        nombre: string;
        unidad_medida?: string;
      }>;
    }>;
  } | null;
}

export interface FacturaReservacion {
  numero: string;
  estado: string;
  cliente: {
    nombre: string;
    nit: string | null;
  };
  habitacion: ReservacionHabitacion | null;
  tarifa: ReservacionTarifa | null;
  reserva: {
    descripcion: string;
    fecha_entrada: string;
    fecha_salida: string;
    dias: number;
    monto: string | number;
    cantidad_personas_extra?: number;
    adultos_extra?: number;
    ninos_extra?: number;
    tarifa_adulto_extra?: string | number;
    tarifa_nino_extra?: string | number;
    monto_personas_extra?: string | number;
    monto_adultos_extra?: string | number;
    monto_ninos_extra?: string | number;
    motivo_salida_anticipada?: string | null;
  };
  cargos: FacturaReservacionCargo[];
  subtotal_reservacion: string | number;
  total_cargos: string | number;
  total_a_pagar: string | number;
  total_pagado: string | number;
  saldo: string | number;
  tipo_pago: ReservacionTipoPago | null;
  fecha_creacion: string;
}

export interface FacturaReservacionResponse {
  reservacion: Reservacion;
  factura: FacturaReservacion;
}
export interface CategoriaInventario {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string | null;
}

export interface ProductoInventario {
  id: number;
  categoria_id: number;
  categoria: CategoriaInventario | null;
  nombre: string;
  unidad_medida: string;
  stock_actual: string | number;
  stock_minimo: string | number;
  costo_unitario: string | number;
  estado: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string | null;
}

export interface InventarioMovimiento {
  id: number;
  producto_inventario_id: number;
  producto: ProductoInventario | null;
  tipo_movimiento: 'ENTRADA' | 'SALIDA';
  cantidad: string | number;
  stock_anterior: string | number;
  stock_nuevo: string | number;
  costo_unitario: string | number;
  tipo_pago_id?: number | null;
  tipo_pago?: {
    id: number;
    codigo: string;
    nombre: string;
  } | null;
  total?: string | number;
  referencia_tipo: string | null;
  referencia_id: number | null;
  observacion: string | null;
  usuario_id: number | null;
  fecha_movimiento: string;
}

export interface CrearCategoriaInventarioPayload {
  nombre: string;
  descripcion: string;
}

export interface CrearProductoInventarioPayload {
  categoria_id: number;
  nombre: string;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
  costo_unitario: number;
  tipo_pago_id?: number;
}

export interface CrearMovimientoInventarioPayload {
  producto_inventario_id: number;
  tipo_movimiento: 'ENTRADA' | 'SALIDA';
  cantidad: number;
  costo_unitario?: number;
  tipo_pago_id?: number;
  observacion?: string;
}

export interface CategoriaMenu {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string | null;
  orden?: number;
}

export interface MenuItemIngrediente {
  id: number;
  menu_item_id: number;
  producto_inventario_id: number;
  producto: ProductoInventario | null;
  cantidad_requerida: string | number;
  cantidad_total?: string | number;
  excluido?: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string | null;
}

export interface MenuItem {
  id: number;
  categoria_menu_id: number;
  categoria: CategoriaMenu | null;
  nombre: string;
  descripcion: string | null;
  precio: string | number;
  tipo: 'COMIDA' | 'BEBIDA' | 'POSTRE' | 'EXTRA' | 'OTRO';
  disponible: boolean;
  imagen_url: string | null;
  estado: boolean;
  ingredientes?: MenuItemIngrediente[];
  fecha_creacion: string;
  fecha_actualizacion: string | null;
}

export interface CrearMenuItemIngredientePayload {
  producto_inventario_id: number;
  cantidad_requerida: number;
}

export interface CrearMenuItemPayload {
  categoria_menu_id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  tipo: 'COMIDA' | 'BEBIDA' | 'POSTRE' | 'EXTRA' | 'OTRO';
  disponible: boolean;
  ingredientes: CrearMenuItemIngredientePayload[];
  imagen?: File | null;
}

export interface OrdenDetalle {
  id: number;
  orden_id: number;
  menu_item_id: number;
  menu_item: MenuItem | null;
  cantidad: number;
  precio_unitario: string | number;
  subtotal: string | number;
  observaciones: string | null;
  exclusiones?: Array<{
    producto_inventario_id: number;
    nombre: string;
    unidad_medida?: string;
  }>;
  ingredientes?: Array<{
    id: number;
    menu_item_id: number;
    producto_inventario_id: number;
    cantidad_requerida: string | number;
    cantidad_total: string | number;
    excluido: boolean;
    producto: {
      id: number;
      nombre: string;
      unidad_medida?: string;
    } | null;
  }>;
  estado_cocina: 'PENDIENTE' | 'EN_PREPARACION' | 'LISTO' | 'ENTREGADO';
  fecha_creacion: string;
  fecha_actualizacion: string | null;
}

export interface Orden {
  id: number;
  usuario_id: number | null;
  reservacion_id: number | null;
  reservacion: {
    id: number;
    nombre_cliente: string;
    nit: string | null;
  } | null;
  tipo_orden: 'MESA' | 'LLEVAR' | 'HABITACION' | 'EMPLEADO' | 'EVENTO' | 'CREDITO';
  numero_mesa: string | null;
  habitacion_id: number | null;
  evento_id?: number | null;
  credito_id?: number | null;
  habitacion: {
    id: number;
    numero: string;
    tipo: string;
  } | null;
  subtotal: string | number;
  total: string | number;
  estado: 'PENDIENTE' | 'EN_COCINA' | 'LISTA' | 'ENTREGADA' | 'CANCELADA';
  observaciones: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string | null;
  detalles: OrdenDetalle[];
}

export interface CrearOrdenDetallePayload {
  menu_item_id: number;
  cantidad: number;
  observaciones?: string;
  exclusiones_productos?: number[];
}

export interface CrearOrdenPayload {
  tipo_orden: 'MESA' | 'LLEVAR' | 'HABITACION' | 'EMPLEADO' | 'EVENTO' | 'CREDITO';
  numero_mesa?: string;
  habitacion_id?: number;
  reservacion_id?: number;
  evento_id?: number;
  credito_id?: number;
  observaciones?: string;
  directo_recibo?: boolean;
  detalles: CrearOrdenDetallePayload[];
}

export interface ReporteFinancieroResumen {
  total_reservaciones: number;
  total_ordenes: number;
  total_restaurante?: number;
  total_ingresos?: number;
  total_gastos_inventario?: number;
  ganancia_total?: number;
  total_general: number;
  cantidad_reservaciones: number;
  cantidad_ordenes: number;
  cantidad_movimientos_inventario?: number;
  totales_por_tipo_pago: Array<{
    id: number;
    codigo: string;
    nombre: string;
    total: number;
  }>;
  gastos_por_tipo_pago?: Array<{
    id: number;
    codigo: string;
    nombre: string;
    total: number;
  }>;
}

export interface ReporteFinanciero {
  rango: {
    inicio: string;
    fin: string;
  };
  anio?: number;
  mes?: number;
  resumen: ReporteFinancieroResumen;
  reservaciones: Array<{
    id: number;
    nombre_cliente: string;
    nit: string | null;
    total_reservacion: string | number;
    precio_pagado: string | number;
    tipo_pago_id: number | null;
    tipo_pago?: {
      id: number;
      codigo: string;
      nombre: string;
    } | null;
    fecha_pago?: string;
    fecha_creacion: string;
  }>;
  ordenes: Array<{
    id: number;
    tipo_orden: string;
    numero_mesa: string | null;
    habitacion_id: number | null;
    total: string | number;
    estado: string;
    referencia?: string | null;
    detalles?: Array<{
      id: number;
      nombre: string;
      cantidad: string | number;
      precio_unitario: string | number;
      subtotal: string | number;
      observaciones?: string | null;
    }>;
    tipo_pago_id?: number | null;
    tipo_pago?: {
      id: number;
      codigo: string;
      nombre: string;
    } | null;
    fecha_pago?: string;
    fecha_creacion: string;
  }>;
  movimientos_inventario?: Array<{
    id: number;
    producto_inventario_id: number;
    tipo_movimiento: string;
    cantidad: string | number;
    costo_unitario: string | number;
    total: string | number;
    tipo_pago_id?: number | null;
    tipo_pago?: {
      id: number;
      codigo: string;
      nombre: string;
    } | null;
    observacion: string | null;
    referencia_tipo: string | null;
    referencia_id: number | null;
    fecha_movimiento: string;
  }>;
}


export interface CancelarOrdenPayload {
  motivo: string;
}

export interface FacturaPendientePago {
  clave: string;
  tipo_orden: 'MESA' | 'LLEVAR' | 'EMPLEADO' | 'EVENTO' | 'CREDITO';
  titulo: string;
  numero_mesa: string | null;
  orden_id: number | null;
  cantidad_ordenes: number;
  total_a_pagar: string | number;
  primera_orden: string;
  ultima_orden: string;
}

export interface MesaPendientePago {
  numero_mesa: string;
  cantidad_ordenes: number;
  total_a_pagar: string | number;
  primera_orden: string;
  ultima_orden: string;
}

export interface FacturaRestaurantePendiente {
  numero: string;
  clave: string;
  tipo_orden: 'MESA' | 'LLEVAR' | 'EMPLEADO' | 'EVENTO' | 'CREDITO' | null;
  titulo: string;
  numero_mesa: string | null;
  orden_id: number | null;
  estado: 'PENDIENTE' | 'PAGADA' | 'SIN_PENDIENTES';
  ordenes: Orden[];
  subtotal: string | number;
  total_a_pagar: string | number;
  total_pagado: string | number;
  saldo: string | number;
  tipo_pago?: {
    id: number;
    codigo: string;
    nombre: string;
  } | null;
  fecha_creacion?: string | null;
  fecha_actualizacion?: string | null;
  fecha_pago?: string | null;
}

export type FacturaMesa = FacturaRestaurantePendiente;

export interface PagarFacturaMesaPayload {
  tipo_pago_id: number;
}

export interface FacturaRestauranteReporteItem {
  referencia: string;
  tipo_factura: 'RESTAURANTE';
  tipo_pago: {
    id: number;
    codigo: string;
    nombre: string;
  } | null;
  cliente: string;
  tipo_orden?: string | null;
  numero_mesa: string | null;
  cantidad_ordenes: number;
  total: string | number;
  fecha_pago: string;
  ordenes: Orden[];
}

export interface FacturasRestauranteReporte {
  tipo: 'DIA' | 'SEMANA' | 'MES';
  rango: {
    inicio: string;
    fin: string;
  };
  anio?: number;
  mes?: number;
  resumen: {
    total_facturado: string | number;
    cantidad_facturas: number;
  };
  facturas: FacturaRestauranteReporteItem[];
}


export interface EventoRestaurante {
  id: number;
  cliente_nombre: string;
  nit: string | null;
  telefono: string | null;
  empresa: string | null;
  descripcion: string | null;
  cantidad_personas?: number;
  monto_cobrado?: string | number;
  fecha_evento: string | null;
  estado: 'ABIERTO' | 'CERRADO' | 'CANCELADO';
  total: string | number;
  tipo_pago_id?: number | null;
  fecha_cierre?: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string | null;
}

export interface FacturaEvento {
  numero: string;
  evento: EventoRestaurante;
  ordenes: Orden[];
  subtotal: string | number;
  total_a_pagar: string | number;
  total_pagado: string | number;
  saldo: string | number;
  tipo_pago: { id: number; codigo: string; nombre: string } | null;
}

export interface CreditoCuenta {
  id: number;
  cliente_nombre: string;
  nit: string | null;
  telefono: string | null;
  empresa: string | null;
  descripcion: string | null;
  estado: 'PENDIENTE' | 'PAGADO' | 'CANCELADO';
  total: string | number;
  tipo_pago_id?: number | null;
  fecha_pago?: string | null;
  fecha_creacion: string;
  fecha_actualizacion: string | null;
}

export interface CreditoCargo {
  id: number;
  credito_id: number;
  orden_id: number | null;
  reservacion_id: number | null;
  tipo_cargo: 'HABITACION' | 'RESTAURANTE' | 'MANUAL';
  descripcion: string;
  monto: string | number;
  estado: 'PENDIENTE' | 'PAGADO' | 'ANULADO';
  fecha_cargo: string;
  fecha_creacion: string;
}

export interface FacturaCredito {
  numero: string;
  credito: CreditoCuenta;
  cargos: CreditoCargo[];
  ordenes: Orden[];
  subtotal: string | number;
  total_a_pagar: string | number;
  total_pagado: string | number;
  saldo: string | number;
  tipo_pago: { id: number; codigo: string; nombre: string } | null;
}
