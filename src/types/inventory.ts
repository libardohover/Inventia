export interface Producto {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  unidad: string;
  precio_venta: number;
  costo_unitario: number;
  proveedor_id: string;
  lote_minimo: number;
  presentacion: string;
  descripcion?: string;
}

export interface Proveedor {
  id: string;
  nombre: string;
  contacto: string;
  telefono: string;
  plazo_entrega_dias: number; // Lead time (L)
  desv_plazo_entrega: number; // sigma_L
  costo_fijo_pedido: number; // S en EOQ (costo por ordenar)
  pedido_minimo_monto: number;
  confiabilidad_pct: number;
}

export interface InventarioItem {
  producto_id: string;
  stock_actual: number;
  stock_reservado: number;
  ubicacion: string;
  ultimo_reabastecimiento: string;
  costo_almacenamiento_anual_pct: number; // i (ej. 0.20 = 20% anual)
}

export interface VentaDiaria {
  fecha: string;
  cantidad: number;
}

export type CategoriaABC = 'A' | 'B' | 'C';
export type CategoriaXYZ = 'X' | 'Y' | 'Z';
export type ClasificacionABCXYZ = 'AX' | 'AY' | 'AZ' | 'BX' | 'BY' | 'BZ' | 'CX' | 'CY' | 'CZ';

export interface PoliticaInventario {
  producto_id: string;
  nombre: string;
  demanda_diaria_promedio: number;
  desviacion_demanda_diaria: number;
  cv: number; // Coeficiente de variación
  demanda_anual_proyectada: number;
  valor_consumo_anual: number;
  clasificacion_abc: CategoriaABC;
  clasificacion_xyz: CategoriaXYZ;
  clasificacion_abc_xyz: ClasificacionABCXYZ;
  nivel_servicio_pct: number; // ej: 95%
  z_score: number;
  plazo_entrega_dias: number;
  stock_seguridad: number; // SS
  punto_reorden: number; // ROP
  eoq: number; // Cantidad Económica de Pedido
  stock_maximo: number;
  stock_actual: number;
  dias_inventario_disponible: number;
  costo_unitario: number;
  costo_ordenar: number;
  tasa_posesion_anual: number;
}

export type NivelRiesgo = 'CRITICO_AGOTAMIENTO' | 'BAJO_STOCK_ROP' | 'OPTIMO' | 'SOBREINVENTARIO' | 'BAJA_ROTACION';

export interface AnalisisRiesgoItem {
  producto_id: string;
  nombre: string;
  sku: string;
  clasificacion?: ClasificacionABCXYZ;
  stock_actual: number;
  punto_reorden: number;
  stock_seguridad: number;
  stock_maximo: number;
  dias_disponibles: number;
  plazo_entrega_dias: number;
  nivel_riesgo: NivelRiesgo;
  mensaje_riesgo: string;
  accion_inmediata: string;
}

export type PrioridadCompra = 'URGENTE_ALTA' | 'MEDIA' | 'BAJA' | 'NO_REQUERIDA';

export interface RecomendacionCompra {
  producto_id: string;
  producto_nombre: string;
  sku: string;
  clasificacion: ClasificacionABCXYZ;
  stock_actual: number;
  demanda_diaria_promedio: number;
  demanda_pronostico_periodo: number;
  punto_reorden: number;
  stock_seguridad: number;
  eoq: number;
  cantidad_recomendada: number;
  costo_estimado_compra: number;
  proveedor_id: string;
  proveedor_nombre: string;
  plazo_entrega_dias: number;
  momento_compra: string; // 'Inmediato (Hoy)', 'En 3 días', etc.
  prioridad: PrioridadCompra;
  justificacion: {
    que_ocurre: string; // [DATO]
    por_que_ocurre: string; // [CÁLCULO]
    que_accion_recomiendo: string; // [RECOMENDACIÓN]
  };
}

export interface TraceElement {
  tipo: 'DATO' | 'CALCULO' | 'RECOMENDACION';
  fuente: 'PostgreSQL' | 'Motor Analítico' | 'Reglas de Decisión';
  descripcion: string;
  detalle?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'inventia' | 'system';
  timestamp: string;
  text: string;
  herramientas_utilizadas?: string[];
  trazabilidad?: TraceElement[];
  recomendaciones_estructuradas?: RecomendacionCompra[];
  error?: boolean;
}

export interface DashboardKPIs {
  total_skus: number;
  valor_inventario_total: number;
  skus_bajo_rop: number;
  skus_riesgo_agotamiento: number;
  skus_sobreinventario: number;
  distribucion_abc: {
    A: { count: number; valor_pct: number; items_pct: number };
    B: { count: number; valor_pct: number; items_pct: number };
    C: { count: number; valor_pct: number; items_pct: number };
  };
  distribucion_xyz: {
    X: number;
    Y: number;
    Z: number;
  };
  monto_sugerido_compras: number;
}

export interface HistorialKpiItem {
  fecha: string;
  fechaCorta: string;
  diaSemana: string;
  nivel_servicio_pct: number;
  valor_inventario_cop: number;
  skus_bajo_rop: number;
  roturas_stock: number;
  ventas_dia_cop: number;
}

export interface ProyeccionDiaSemana {
  fecha: string;
  diaSemana: string;
  diaCorta: string;
  unidades_totales: number;
  ventas_proyectadas_cop: number;
  costo_proyectado_cop: number;
}

export interface ProyeccionSkuSemanal {
  producto_id: string;
  sku: string;
  nombre: string;
  categoria: string;
  proveedor_nombre: string;
  plazo_entrega_dias: number;
  stock_actual: number;
  punto_reorden: number;
  eoq: number;
  demanda_diaria_promedio: number;
  demanda_proyectada_7d: number;
  intervalo_min_7d: number;
  intervalo_max_7d: number;
  tendencia: 'creciente' | 'estable' | 'decreciente';
  balance_proyectado_7d: number; // stock_actual - demanda_proyectada_7d (negativo = déficit)
  dias_cobertura_actual: number; // stock_actual / demanda_diaria
  dia_quiebre_estimado: string | null; // e.g., 'Mié 10 Sep' o 'Sin quiebre'
  riesgo_desabastecimiento: 'CRITICO' | 'ALTO' | 'MODERADO' | 'SEGURO';
  requiere_compra_mayor: boolean;
  unidades_sugeridas_compra: number;
  monto_compra_cop: number;
  justificacion: string;
}

export interface PronosticoSemanalResponse {
  horizonte_dias: number;
  fecha_inicio: string;
  fecha_fin: string;
  factor_escenario: number;
  total_unidades_demanda: number;
  total_ventas_proyectadas_cop: number;
  total_costo_demanda_cop: number;
  total_presupuesto_compras_mayores_cop: number;
  total_unidades_compras_mayores: number;
  skus_en_riesgo_quiebre: number;
  desglose_dias: ProyeccionDiaSemana[];
  productos: ProyeccionSkuSemanal[];
  compras_mayores_anticipadas: ProyeccionSkuSemanal[];
}
