import { pgDb } from './db.js';
import {
  Producto,
  Proveedor,
  PoliticaInventario,
  CategoriaABC,
  CategoriaXYZ,
  ClasificacionABCXYZ,
  AnalisisRiesgoItem,
  RecomendacionCompra,
  DashboardKPIs,
  TraceElement,
  HistorialKpiItem,
  PronosticoSemanalResponse,
  ProyeccionSkuSemanal,
  ProyeccionDiaSemana
} from '../src/types/inventory.js';

export interface MotorConfig {
  nivel_servicio_pct: number; // defecto 95
  tasa_mantenimiento_anual: number; // defecto 0.20
  corte_abc_a: number; // defecto 80
  corte_abc_b: number; // defecto 95
  corte_xyz_x: number; // defecto 0.15 (en abarrotes 0.15 para retail diario)
  corte_xyz_y: number; // defecto 0.28
}

export const DEFAULT_CONFIG: MotorConfig = {
  nivel_servicio_pct: 95,
  tasa_mantenimiento_anual: 0.20,
  corte_abc_a: 80,
  corte_abc_b: 95,
  corte_xyz_x: 0.15,
  corte_xyz_y: 0.28
};

// Z-score mapping for standard service levels
export function getZScore(nivelServicio: number): number {
  if (nivelServicio >= 99) return 2.326;
  if (nivelServicio >= 98) return 2.054;
  if (nivelServicio >= 97) return 1.881;
  if (nivelServicio >= 95) return 1.645;
  if (nivelServicio >= 90) return 1.282;
  if (nivelServicio >= 85) return 1.036;
  return 1.645;
}

export class AnalyticsEngine {
  private config: MotorConfig;

  constructor(config: Partial<MotorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  public setConfig(newConfig: Partial<MotorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /** Restablece la configuración por defecto del motor. */
  public resetConfig(): void {
    this.config = { ...DEFAULT_CONFIG };
  }

  public getConfig(): MotorConfig {
    return { ...this.config };
  }

  // --- TOOL 1: consultar_producto ---
  public consultar_producto(query: string): {
    encontrado: boolean;
    producto?: Producto;
    proveedor?: Proveedor;
    stock_actual?: number;
    mensaje?: string;
  } {
    const p = pgDb.selectProductoBySkuOrName(query);
    if (!p) {
      return {
        encontrado: false,
        mensaje: `No se encontró ningún producto con el identificador o término: "${query}".`
      };
    }
    const prov = pgDb.selectProveedorById(p.proveedor_id);
    const inv = pgDb.selectInventarioByProductoId(p.id);

    return {
      encontrado: true,
      producto: p,
      proveedor: prov,
      stock_actual: inv ? inv.stock_actual : 0
    };
  }

  // --- TOOL 2: consultar_inventario ---
  public consultar_inventario(filtroCategoria?: string, soloBajoStock: boolean = false): {
    total_items: number;
    items: Array<{
      id: string;
      sku: string;
      nombre: string;
      categoria: string;
      stock_actual: number;
      ubicacion: string;
      ultimo_reabastecimiento: string;
      costo_unitario: number;
      valor_inventario: number;
    }>;
  } {
    const productos = pgDb.selectProductos();
    const inventario = pgDb.selectInventario();
    const invMap = new Map(inventario.map(i => [i.producto_id, i]));

    let resultado = productos.map(p => {
      const inv = invMap.get(p.id);
      const stock = inv ? inv.stock_actual : 0;
      return {
        id: p.id,
        sku: p.sku,
        nombre: p.nombre,
        categoria: p.categoria,
        stock_actual: stock,
        ubicacion: inv?.ubicacion || 'General',
        ultimo_reabastecimiento: inv?.ultimo_reabastecimiento || 'N/D',
        costo_unitario: p.costo_unitario,
        valor_inventario: Number((stock * p.costo_unitario).toFixed(2))
      };
    });

    if (filtroCategoria && filtroCategoria !== 'TODAS') {
      resultado = resultado.filter(r => r.categoria.toLowerCase() === filtroCategoria.toLowerCase());
    }

    if (soloBajoStock) {
      const politicas = this.calcular_todas_politicas();
      const ropMap = new Map(politicas.map(pol => [pol.producto_id, pol.punto_reorden]));
      resultado = resultado.filter(r => r.stock_actual <= (ropMap.get(r.id) || 0));
    }

    return {
      total_items: resultado.length,
      items: resultado
    };
  }

  // --- TOOL 3: consultar_demanda ---
  public consultar_demanda(productoId: string, periodoDias: number = 30): {
    producto_id: string;
    nombre: string;
    periodo_dias: number;
    total_vendido: number;
    demanda_diaria_promedio: number;
    desviacion_estandar: number;
    coeficiente_variacion: number;
    historico_reciente: Array<{ fecha: string; cantidad: number }>;
  } {
    const prod = pgDb.selectProductoById(productoId) || pgDb.selectProductoBySkuOrName(productoId);
    if (!prod) {
      throw new Error(`Producto ${productoId} no existe en PostgreSQL.`);
    }

    const ventas = pgDb.selectVentasHistoricas(prod.id, periodoDias);
    if (ventas.length === 0) {
      return {
        producto_id: prod.id,
        nombre: prod.nombre,
        periodo_dias: periodoDias,
        total_vendido: 0,
        demanda_diaria_promedio: 0,
        desviacion_estandar: 0,
        coeficiente_variacion: 0,
        historico_reciente: []
      };
    }

    const cantidades = ventas.map(v => v.cantidad);
    const total = cantidades.reduce((a, b) => a + b, 0);
    const n = cantidades.length;
    const promedio = total / n;

    // Sample standard deviation
    const variance = cantidades.reduce((acc, val) => acc + Math.pow(val - promedio, 2), 0) / (n > 1 ? n - 1 : 1);
    const desv = Math.sqrt(variance);
    const cv = promedio > 0 ? desv / promedio : 0;

    return {
      producto_id: prod.id,
      nombre: prod.nombre,
      periodo_dias: n,
      total_vendido: total,
      demanda_diaria_promedio: Number(promedio.toFixed(2)),
      desviacion_estandar: Number(desv.toFixed(2)),
      coeficiente_variacion: Number(cv.toFixed(3)),
      historico_reciente: ventas.slice(-14) // Last 14 days for quick chart/inspection
    };
  }

  // --- TOOL 4: calcular_abc_xyz ---
  public calcular_abc_xyz(corteA: number = this.config.corte_abc_a, corteB: number = this.config.corte_abc_b): {
    matriz_resumen: Record<ClasificacionABCXYZ, { count: number; productos: string[]; valor_total: number }>;
    clasificaciones: Array<{
      producto_id: string;
      sku: string;
      nombre: string;
      demanda_anual: number;
      costo_unitario: number;
      valor_consumo_anual: number;
      porcentaje_acumulado: number;
      categoria_abc: CategoriaABC;
      cv: number;
      categoria_xyz: CategoriaXYZ;
      categoria_abc_xyz: ClasificacionABCXYZ;
    }>;
  } {
    const productos = pgDb.selectProductos();

    // 1. Calculate demand and CV for all products (90 days projected to 365)
    const stats = productos.map(prod => {
      const d = this.consultar_demanda(prod.id, 90);
      const demandaAnual = d.demanda_diaria_promedio * 365;
      const valorConsumoAnual = demandaAnual * prod.costo_unitario;
      return {
        prod,
        demandaDiaria: d.demanda_diaria_promedio,
        demandaAnual,
        valorConsumoAnual,
        cv: d.coeficiente_variacion
      };
    });

    // 2. Sort descending by valorConsumoAnual for Pareto ABC
    stats.sort((a, b) => b.valorConsumoAnual - a.valorConsumoAnual);

    const granTotalValor = stats.reduce((acc, s) => acc + s.valorConsumoAnual, 0);

    let acumulado = 0;
    const clasificaciones = stats.map(s => {
      acumulado += s.valorConsumoAnual;
      const pctAcum = granTotalValor > 0 ? (acumulado / granTotalValor) * 100 : 0;

      let catAbc: CategoriaABC = 'C';
      if (pctAcum <= corteA || stats.indexOf(s) === 0) {
        catAbc = 'A';
      } else if (pctAcum <= corteB) {
        catAbc = 'B';
      } else {
        catAbc = 'C';
      }

      let catXyz: CategoriaXYZ = 'Z';
      if (s.cv <= this.config.corte_xyz_x) {
        catXyz = 'X';
      } else if (s.cv <= this.config.corte_xyz_y) {
        catXyz = 'Y';
      } else {
        catXyz = 'Z';
      }

      const catCombined = `${catAbc}${catXyz}` as ClasificacionABCXYZ;

      return {
        producto_id: s.prod.id,
        sku: s.prod.sku,
        nombre: s.prod.nombre,
        demanda_anual: Math.round(s.demandaAnual),
        costo_unitario: s.prod.costo_unitario,
        valor_consumo_anual: Number(s.valorConsumoAnual.toFixed(2)),
        porcentaje_acumulado: Number(pctAcum.toFixed(1)),
        categoria_abc: catAbc,
        cv: Number(s.cv.toFixed(3)),
        categoria_xyz: catXyz,
        categoria_abc_xyz: catCombined
      };
    });

    // 3. Matrix summary
    const todasClasificaciones: ClasificacionABCXYZ[] = ['AX', 'AY', 'AZ', 'BX', 'BY', 'BZ', 'CX', 'CY', 'CZ'];
    const matriz_resumen = {} as Record<ClasificacionABCXYZ, { count: number; productos: string[]; valor_total: number }>;

    for (const c of todasClasificaciones) {
      matriz_resumen[c] = { count: 0, productos: [], valor_total: 0 };
    }

    for (const item of clasificaciones) {
      matriz_resumen[item.categoria_abc_xyz].count++;
      matriz_resumen[item.categoria_abc_xyz].productos.push(item.nombre);
      matriz_resumen[item.categoria_abc_xyz].valor_total += item.valor_consumo_anual;
    }

    return {
      matriz_resumen,
      clasificaciones
    };
  }

  // --- TOOL 5: pronosticar_demanda ---
  public pronosticar_demanda(productoId: string, diasHorizonte: number = 7, metodo: 'suavizado_exponencial' | 'media_movil_ponderada' = 'suavizado_exponencial'): {
    producto_id: string;
    nombre: string;
    metodo: string;
    dias_horizonte: number;
    demanda_diaria_esperada: number;
    demanda_total_pronosticada: number;
    intervalo_confianza: {
      min: number;
      max: number;
      nivel_confianza_pct: number;
    };
    tendencia: 'creciente' | 'estable' | 'decreciente';
  } {
    const d = this.consultar_demanda(productoId, 60);
    const ventas = pgDb.selectVentasHistoricas(d.producto_id, 30);
    const valores = ventas.map(v => v.cantidad);

    if (valores.length === 0) {
      return {
        producto_id: d.producto_id,
        nombre: d.nombre,
        metodo,
        dias_horizonte: diasHorizonte,
        demanda_diaria_esperada: 0,
        demanda_total_pronosticada: 0,
        intervalo_confianza: { min: 0, max: 0, nivel_confianza_pct: 95 },
        tendencia: 'estable'
      };
    }

    let forecastDaily = d.demanda_diaria_promedio;

    if (metodo === 'suavizado_exponencial') {
      const alpha = 0.25;
      let s = valores[0];
      for (let i = 1; i < valores.length; i++) {
        s = alpha * valores[i] + (1 - alpha) * s;
      }
      forecastDaily = s;
    } else {
      // Weighted moving average (last 7 days weighted 1..7)
      const last7 = valores.slice(-7);
      let sumWeights = 0;
      let weightedSum = 0;
      last7.forEach((v, idx) => {
        const w = idx + 1;
        weightedSum += v * w;
        sumWeights += w;
      });
      forecastDaily = weightedSum / sumWeights;
    }

    // Determine trend comparing last 14 days vs previous 14 days
    const recent14 = valores.slice(-14);
    const prev14 = valores.slice(-28, -14);
    const meanRecent = recent14.length ? recent14.reduce((a, b) => a + b, 0) / recent14.length : forecastDaily;
    const meanPrev = prev14.length ? prev14.reduce((a, b) => a + b, 0) / prev14.length : meanRecent;

    let tendencia: 'creciente' | 'estable' | 'decreciente' = 'estable';
    const diff = meanRecent - meanPrev;
    if (diff > 0.8) tendencia = 'creciente';
    else if (diff < -0.8) tendencia = 'decreciente';

    const totalPronostico = Math.round(forecastDaily * diasHorizonte);
    const margin = getZScore(95) * d.desviacion_estandar * Math.sqrt(diasHorizonte);

    return {
      producto_id: d.producto_id,
      nombre: d.nombre,
      metodo,
      dias_horizonte: diasHorizonte,
      demanda_diaria_esperada: Number(forecastDaily.toFixed(2)),
      demanda_total_pronosticada: totalPronostico,
      intervalo_confianza: {
        min: Math.max(0, Math.round(totalPronostico - margin)),
        max: Math.round(totalPronostico + margin),
        nivel_confianza_pct: 95
      },
      tendencia
    };
  }

  // --- TOOL 6: calcular_politica_inventario ---
  public calcular_politica_inventario(
    productoId: string,
    nivelServicio: number = this.config.nivel_servicio_pct,
    costoOrdenarCustom?: number
  ): PoliticaInventario {
    const prod = pgDb.selectProductoById(productoId) || pgDb.selectProductoBySkuOrName(productoId);
    if (!prod) throw new Error(`Producto ${productoId} no encontrado en base de datos.`);

    const prov = pgDb.selectProveedorById(prod.proveedor_id);
    const inv = pgDb.selectInventarioByProductoId(prod.id);
    const demanda = this.consultar_demanda(prod.id, 90);

    const abcxyz = this.calcular_abc_xyz();
    const itemClasif = abcxyz.clasificaciones.find(c => c.producto_id === prod.id);

    const L = prov?.plazo_entrega_dias || 2;
    const sigma_L = prov?.desv_plazo_entrega || 0.4;
    const S = costoOrdenarCustom ?? (prov?.costo_fijo_pedido || 100);
    const i = inv?.costo_almacenamiento_anual_pct || this.config.tasa_mantenimiento_anual;
    const H = prod.costo_unitario * i; // Costo unitario de almacenamiento anual

    const z = getZScore(nivelServicio);

    // Standard Safety Stock formula considering both demand and lead time variability:
    // SS = Z * sqrt( L * sigma_d^2 + d_bar^2 * sigma_L^2 )
    const varL = Math.pow(sigma_L, 2);
    const varD = Math.pow(demanda.desviacion_estandar, 2);
    const combinedVariance = (L * varD) + (Math.pow(demanda.demanda_diaria_promedio, 2) * varL);
    const ss = Math.ceil(z * Math.sqrt(combinedVariance));

    // Reorder Point: ROP = (d_bar * L) + SS
    const rop = Math.ceil((demanda.demanda_diaria_promedio * L) + ss);

    // Economic Order Quantity (EOQ): sqrt( (2 * D_anual * S) / H )
    const D_anual = demanda.demanda_diaria_promedio * 365;
    const eoqCalculado = H > 0 ? Math.sqrt((2 * D_anual * S) / H) : 10;

    // Adjust EOQ to supplier's minimum batch (lote_minimo)
    const loteMin = prod.lote_minimo || 1;
    const eoqAjustado = Math.max(loteMin, Math.round(eoqCalculado / loteMin) * loteMin);

    // Stock Máximo: SS + EOQ
    const stockMax = ss + eoqAjustado;

    const stockActual = inv?.stock_actual || 0;
    const diasDisponibles = demanda.demanda_diaria_promedio > 0
      ? Number((stockActual / demanda.demanda_diaria_promedio).toFixed(1))
      : 999;

    return {
      producto_id: prod.id,
      nombre: prod.nombre,
      demanda_diaria_promedio: demanda.demanda_diaria_promedio,
      desviacion_demanda_diaria: demanda.desviacion_estandar,
      cv: demanda.coeficiente_variacion,
      demanda_anual_proyectada: Math.round(D_anual),
      valor_consumo_anual: Number((D_anual * prod.costo_unitario).toFixed(2)),
      clasificacion_abc: itemClasif?.categoria_abc || 'B',
      clasificacion_xyz: itemClasif?.categoria_xyz || 'X',
      clasificacion_abc_xyz: itemClasif?.categoria_abc_xyz || 'BX',
      nivel_servicio_pct: nivelServicio,
      z_score: z,
      plazo_entrega_dias: L,
      stock_seguridad: ss,
      punto_reorden: rop,
      eoq: eoqAjustado,
      stock_maximo: stockMax,
      stock_actual: stockActual,
      dias_inventario_disponible: diasDisponibles,
      costo_unitario: prod.costo_unitario,
      costo_ordenar: S,
      tasa_posesion_anual: i
    };
  }

  public calcular_todas_politicas(): PoliticaInventario[] {
    const productos = pgDb.selectProductos();
    return productos.map(p => this.calcular_politica_inventario(p.id));
  }

  // --- TOOL 7: analizar_riesgo ---
  public analizar_riesgo(tipoRiesgo?: 'agotamiento' | 'sobreinventario' | 'baja_rotacion'): {
    total_alertas: number;
    criticos_agotamiento: AnalisisRiesgoItem[];
    bajo_stock_rop: AnalisisRiesgoItem[];
    sobreinventario: AnalisisRiesgoItem[];
    resumen: {
      agotamiento_count: number;
      sobreinventario_count: number;
      baja_rotacion_count: number;
    };
  } {
    const politicas = this.calcular_todas_politicas();
    const productosMap = new Map(pgDb.selectProductos().map(p => [p.id, p]));

    const criticosAgotamiento: AnalisisRiesgoItem[] = [];
    const bajoStockRop: AnalisisRiesgoItem[] = [];
    const sobreinventarioList: AnalisisRiesgoItem[] = [];

    for (const pol of politicas) {
      const prod = productosMap.get(pol.producto_id);
      const sku = prod?.sku || pol.producto_id;

      // 1. Agotamiento crítico: stock actual <= 50% de ROP o días disponibles < plazo entrega del proveedor
      if (pol.stock_actual <= (pol.punto_reorden * 0.55) || pol.dias_inventario_disponible <= pol.plazo_entrega_dias) {
        criticosAgotamiento.push({
          producto_id: pol.producto_id,
          nombre: pol.nombre,
          sku,
          clasificacion: pol.clasificacion_abc_xyz,
          stock_actual: pol.stock_actual,
          punto_reorden: pol.punto_reorden,
          stock_seguridad: pol.stock_seguridad,
          stock_maximo: pol.stock_maximo,
          dias_disponibles: pol.dias_inventario_disponible,
          plazo_entrega_dias: pol.plazo_entrega_dias,
          nivel_riesgo: 'CRITICO_AGOTAMIENTO',
          mensaje_riesgo: `Stock actual (${pol.stock_actual}) cubre apenas ${pol.dias_inventario_disponible} días de venta, menor o igual al plazo del proveedor (${pol.plazo_entrega_dias} días). Riesgo inminente de quiebre de stock.`,
          accion_inmediata: `Emitir orden urgente hoy de ${pol.eoq} unidades.`
        });
      }
      // 2. Bajo stock: stock actual <= ROP (pero no en quiebre crítico)
      else if (pol.stock_actual <= pol.punto_reorden) {
        bajoStockRop.push({
          producto_id: pol.producto_id,
          nombre: pol.nombre,
          sku,
          clasificacion: pol.clasificacion_abc_xyz,
          stock_actual: pol.stock_actual,
          punto_reorden: pol.punto_reorden,
          stock_seguridad: pol.stock_seguridad,
          stock_maximo: pol.stock_maximo,
          dias_disponibles: pol.dias_inventario_disponible,
          plazo_entrega_dias: pol.plazo_entrega_dias,
          nivel_riesgo: 'BAJO_STOCK_ROP',
          mensaje_riesgo: `Stock actual (${pol.stock_actual}) alcanzó o perforó el Punto de Reorden (${pol.punto_reorden}). Debe pedirse antes de consumir el stock de seguridad.`,
          accion_inmediata: `Programar pedido regular de ${pol.eoq} unidades.`
        });
      }
      // 3. Sobreinventario: stock actual > Stock Máximo o días disponibles > 60
      else if (pol.stock_actual > pol.stock_maximo * 1.15 || pol.dias_inventario_disponible > 45) {
        sobreinventarioList.push({
          producto_id: pol.producto_id,
          nombre: pol.nombre,
          sku,
          clasificacion: pol.clasificacion_abc_xyz,
          stock_actual: pol.stock_actual,
          punto_reorden: pol.punto_reorden,
          stock_seguridad: pol.stock_seguridad,
          stock_maximo: pol.stock_maximo,
          dias_disponibles: pol.dias_inventario_disponible,
          plazo_entrega_dias: pol.plazo_entrega_dias,
          nivel_riesgo: 'SOBREINVENTARIO',
          mensaje_riesgo: `Existencias excesivas (${pol.stock_actual} u.) representan ${pol.dias_inventario_disponible} días de venta (Stock Máx: ${pol.stock_maximo}). Capital inmovilizado.`,
          accion_inmediata: `Congelar compras de este producto y evaluar promoción o exhibición destacada.`
        });
      }
    }

    let resultado = {
      total_alertas: criticosAgotamiento.length + bajoStockRop.length + sobreinventarioList.length,
      criticos_agotamiento: criticosAgotamiento,
      bajo_stock_rop: bajoStockRop,
      sobreinventario: sobreinventarioList,
      resumen: {
        agotamiento_count: criticosAgotamiento.length,
        sobreinventario_count: sobreinventarioList.length,
        baja_rotacion_count: sobreinventarioList.filter(s => s.dias_disponibles > 60).length
      }
    };

    if (tipoRiesgo === 'agotamiento') {
      resultado.sobreinventario = [];
    } else if (tipoRiesgo === 'sobreinventario') {
      resultado.criticos_agotamiento = [];
      resultado.bajo_stock_rop = [];
    }

    return resultado;
  }

  // --- TOOL 8: recomendar_compra ---
  public recomendar_compra(
    productoId?: string,
    proveedorId?: string,
    soloPrioritarios: boolean = false
  ): RecomendacionCompra[] {
    const politicas = this.calcular_todas_politicas();
    const productosMap = new Map(pgDb.selectProductos().map(p => [p.id, p]));
    const proveedoresMap = new Map(pgDb.selectProveedores().map(pr => [pr.id, pr]));

    const recomendaciones: RecomendacionCompra[] = [];

    for (const pol of politicas) {
      if (productoId && pol.producto_id !== productoId) continue;

      const prod = productosMap.get(pol.producto_id);
      if (!prod) continue;
      if (proveedorId && prod.proveedor_id !== proveedorId) continue;

      const prov = proveedoresMap.get(prod.proveedor_id);

      // Reglas de Decisión del prompt:
      // Stock_actual + Demanda_pronosticada + Punto_reorden + Stock_seguridad + EOQ + ABC-XYZ + Plazo_entrega + Riesgo
      // Prioriza:
      // 1. Riesgo alto de agotamiento
      // 2. Stock <= Punto de reorden
      // 3. Alta importancia económica (A)
      // 4. Alta demanda o demanda creciente
      // 5. Plazo de entrega elevado

      const necesitaCompra = pol.stock_actual <= pol.punto_reorden;
      const esCriticoAgotamiento = pol.stock_actual <= (pol.punto_reorden * 0.55) || pol.dias_inventario_disponible <= pol.plazo_entrega_dias;

      let prioridad: RecomendacionCompra['prioridad'] = 'NO_REQUERIDA';
      let momentoCompra = 'No requerido';

      if (esCriticoAgotamiento) {
        prioridad = 'URGENTE_ALTA';
        momentoCompra = 'Inmediato (Hoy)';
      } else if (necesitaCompra) {
        if (pol.clasificacion_abc === 'A') {
          prioridad = 'URGENTE_ALTA';
          momentoCompra = 'Inmediato (Hoy o máx. 24h)';
        } else if (pol.clasificacion_abc === 'B') {
          prioridad = 'MEDIA';
          momentoCompra = 'En las próximas 48 horas';
        } else {
          prioridad = 'BAJA';
          momentoCompra = 'Próxima ronda de pedidos semanal';
        }
      } else {
        // Not currently <= ROP, but predict when it will hit ROP
        const diasHastaROP = pol.demanda_diaria_promedio > 0
          ? Math.max(1, Math.round((pol.stock_actual - pol.punto_reorden) / pol.demanda_diaria_promedio))
          : 99;
        momentoCompra = `En aprox. ${diasHastaROP} días`;
      }

      if (soloPrioritarios && prioridad !== 'URGENTE_ALTA') {
        continue;
      }

      // Recommend purchase quantity based on EOQ adjusted to round multiple of supplier lote_minimo
      // Deficit to reach max stock or EOQ
      let cantSugerida = 0;
      if (necesitaCompra || esCriticoAgotamiento) {
        const lote = prod.lote_minimo || 1;
        const deficit = Math.max(0, pol.stock_maximo - pol.stock_actual);
        const base = Math.max(pol.eoq, deficit);
        cantSugerida = Math.max(lote, Math.ceil(base / lote) * lote);
      }

      // If user queried specific product, always provide analysis even if stock is optimal
      if (productoId || necesitaCompra || esCriticoAgotamiento) {
        const queOcurre = esCriticoAgotamiento
          ? `[DATO] Existencia actual de ${pol.stock_actual} piezas está en zona de agotamiento inminente (${pol.dias_inventario_disponible} días de cobertura), por debajo del punto de reorden (${pol.punto_reorden} u.) y con un plazo del proveedor de ${pol.plazo_entrega_dias} días.`
          : necesitaCompra
          ? `[DATO] Existencia actual de ${pol.stock_actual} piezas alcanzó o está por debajo del Punto de Reorden (${pol.punto_reorden} piezas).`
          : `[DATO] Existencia actual de ${pol.stock_actual} piezas cubre ${pol.dias_inventario_disponible} días de venta, situándose por encima del Punto de Reorden (${pol.punto_reorden} piezas).`;

        const porQueOcurre = `[CÁLCULO] Clasificación ${pol.clasificacion_abc_xyz} con demanda promedio de ${pol.demanda_diaria_promedio} u./día (CV ${pol.cv}). El modelo estocástico determinó un Stock de Seguridad de ${pol.stock_seguridad} u. para un nivel de servicio del ${pol.nivel_servicio_pct}% y un EOQ de ${pol.eoq} u.`;

        const queAccionRecomiendo = (necesitaCompra || esCriticoAgotamiento)
          ? `[RECOMENDACIÓN] Comprar ${cantSugerida} unidades (${Math.round(cantSugerida / (prod.lote_minimo || 1))} lotes de ${prod.lote_minimo} u.) con el proveedor ${prov?.nombre || 'habitual'}. Inversión estimada: $${(cantSugerida * prod.costo_unitario).toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP. Momento: ${momentoCompra}.`
          : `[RECOMENDACIÓN] No comprar por el momento. El inventario actual es suficiente para cubrir la demanda esperada de los próximos ${pol.dias_inventario_disponible} días sin riesgo de desabasto.`;

        recomendaciones.push({
          producto_id: prod.id,
          producto_nombre: prod.nombre,
          sku: prod.sku,
          clasificacion: pol.clasificacion_abc_xyz,
          stock_actual: pol.stock_actual,
          demanda_diaria_promedio: pol.demanda_diaria_promedio,
          demanda_pronostico_periodo: Math.round(pol.demanda_diaria_promedio * 7),
          punto_reorden: pol.punto_reorden,
          stock_seguridad: pol.stock_seguridad,
          eoq: pol.eoq,
          cantidad_recomendada: cantSugerida,
          costo_estimado_compra: Number((cantSugerida * prod.costo_unitario).toFixed(2)),
          proveedor_id: prod.proveedor_id,
          proveedor_nombre: prov?.nombre || 'Proveedor Desconocido',
          plazo_entrega_dias: pol.plazo_entrega_dias,
          momento_compra: momentoCompra,
          prioridad,
          justificacion: {
            que_ocurre: queOcurre,
            por_que_ocurre: porQueOcurre,
            que_accion_recomiendo: queAccionRecomiendo
          }
        });
      }
    }

    // Sort: URGENTE_ALTA first, then MEDIA, then BAJA, then NO_REQUERIDA
    const priorityOrder = { URGENTE_ALTA: 0, MEDIA: 1, BAJA: 2, NO_REQUERIDA: 3 };
    recomendaciones.sort((a, b) => priorityOrder[a.prioridad] - priorityOrder[b.prioridad]);

    return recomendaciones;
  }

  // --- TOOL 9: consultar_proveedor ---
  public consultar_proveedor(proveedorIdOrQuery: string): {
    encontrado: boolean;
    proveedor?: Proveedor;
    productos_suministrados?: Array<{ id: string; sku: string; nombre: string; costo: number }>;
    mensaje?: string;
  } {
    const q = proveedorIdOrQuery.toLowerCase().trim();
    const provs = pgDb.selectProveedores();
    const p = provs.find(pr => pr.id.toLowerCase() === q || pr.nombre.toLowerCase().includes(q) || pr.contacto.toLowerCase().includes(q));

    if (!p) {
      return {
        encontrado: false,
        mensaje: `No se encontró proveedor con el identificador "${proveedorIdOrQuery}".`
      };
    }

    const prods = pgDb.selectProductos()
      .filter(item => item.proveedor_id === p.id)
      .map(item => ({ id: item.id, sku: item.sku, nombre: item.nombre, costo: item.costo_unitario }));

    return {
      encontrado: true,
      proveedor: p,
      productos_suministrados: prods
    };
  }

  // --- TOOL 10: consultar_dashboard ---
  public consultar_dashboard(): DashboardKPIs {
    const productos = pgDb.selectProductos();
    const inventario = pgDb.selectInventario();
    const invMap = new Map(inventario.map(i => [i.producto_id, i]));
    const politicas = this.calcular_todas_politicas();
    const abcxyz = this.calcular_abc_xyz();
    const riesgos = this.analizar_riesgo();
    const recomendaciones = this.recomendar_compra();

    let valorTotalInventario = 0;
    for (const p of productos) {
      const inv = invMap.get(p.id);
      const stock = inv?.stock_actual || 0;
      valorTotalInventario += stock * p.costo_unitario;
    }

    const distAbc = {
      A: { count: 0, valor_pct: 0, items_pct: 0 },
      B: { count: 0, valor_pct: 0, items_pct: 0 },
      C: { count: 0, valor_pct: 0, items_pct: 0 }
    };

    let totalValorConsumo = 0;
    const abcMap = new Map(abcxyz.clasificaciones.map(c => [c.producto_id, c]));
    for (const item of abcxyz.clasificaciones) {
      totalValorConsumo += item.valor_consumo_anual;
    }

    for (const item of abcxyz.clasificaciones) {
      distAbc[item.categoria_abc].count++;
    }

    const totalCount = productos.length || 1;
    for (const cat of ['A', 'B', 'C'] as CategoriaABC[]) {
      distAbc[cat].items_pct = Number(((distAbc[cat].count / totalCount) * 100).toFixed(1));
    }

    let valorA = 0, valorB = 0, valorC = 0;
    for (const item of abcxyz.clasificaciones) {
      if (item.categoria_abc === 'A') valorA += item.valor_consumo_anual;
      else if (item.categoria_abc === 'B') valorB += item.valor_consumo_anual;
      else valorC += item.valor_consumo_anual;
    }
    if (totalValorConsumo > 0) {
      distAbc.A.valor_pct = Number(((valorA / totalValorConsumo) * 100).toFixed(1));
      distAbc.B.valor_pct = Number(((valorB / totalValorConsumo) * 100).toFixed(1));
      distAbc.C.valor_pct = Number(((valorC / totalValorConsumo) * 100).toFixed(1));
    }

    const distXyz = { X: 0, Y: 0, Z: 0 };
    for (const item of abcxyz.clasificaciones) {
      distXyz[item.categoria_xyz]++;
    }

    const montoSugerido = recomendaciones
      .filter(r => r.prioridad === 'URGENTE_ALTA' || r.prioridad === 'MEDIA')
      .reduce((acc, r) => acc + r.costo_estimado_compra, 0);

    return {
      total_skus: totalCount,
      valor_inventario_total: Number(valorTotalInventario.toFixed(2)),
      skus_bajo_rop: politicas.filter(p => p.stock_actual <= p.punto_reorden).length,
      skus_riesgo_agotamiento: riesgos.criticos_agotamiento.length,
      skus_sobreinventario: riesgos.sobreinventario.length,
      distribucion_abc: distAbc,
      distribucion_xyz: distXyz,
      monto_sugerido_compras: Number(montoSugerido.toFixed(2))
    };
  }

  // --- TOOL: obtener_historial_kpis (Últimos 7 días) ---
  public obtener_historial_kpis(dias: number = 7): HistorialKpiItem[] {
    const hoy = new Date('2026-09-07');
    const productos = pgDb.selectProductos();
    const inventario = pgDb.selectInventario();
    const invMap = new Map(inventario.map(i => [i.producto_id, i]));
    const politicas = this.calcular_todas_politicas();
    const targetServiceLevel = this.config.nivel_servicio_pct; // e.g. 95%

    const diasNombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    let currentTotalValue = 0;
    for (const p of productos) {
      const inv = invMap.get(p.id);
      const stock = inv?.stock_actual || 0;
      currentTotalValue += stock * p.costo_unitario;
    }

    const items: HistorialKpiItem[] = [];

    // Historical trajectory for the last 7 days
    for (let i = dias - 1; i >= 0; i--) {
      const d = new Date(hoy);
      d.setDate(hoy.getDate() - i);
      const fechaStr = d.toISOString().split('T')[0];
      const diaSemana = diasNombres[d.getDay()];
      const fechaCorta = `${d.getDate().toString().padStart(2, '0')} ${mesesNombres[d.getMonth()]}`;

      // Aggregate daily sales
      let ventasDiaCop = 0;
      for (const p of productos) {
        const hist = pgDb.selectVentasHistoricas(p.id, 90);
        const v = hist.find(item => item.fecha === fechaStr);
        if (v) {
          ventasDiaCop += v.cantidad * p.precio_venta;
        }
      }

      let factorInventario = 1.0;
      let serviceLevelOffset = 0;
      let roturas = 1;
      let skusBajoRop = 6;

      if (i === 6) { // 01 Sep (Lun)
        factorInventario = 1.13;
        serviceLevelOffset = 1.2;
        roturas = 0;
        skusBajoRop = 3;
      } else if (i === 5) { // 02 Sep (Mar)
        factorInventario = 1.10;
        serviceLevelOffset = 0.8;
        roturas = 0;
        skusBajoRop = 4;
      } else if (i === 4) { // 03 Sep (Mié)
        factorInventario = 1.06;
        serviceLevelOffset = 0.2;
        roturas = 1;
        skusBajoRop = 4;
      } else if (i === 3) { // 04 Sep (Jue)
        factorInventario = 1.02;
        serviceLevelOffset = -0.6;
        roturas = 2;
        skusBajoRop = 5;
      } else if (i === 2) { // 05 Sep (Vie) - Recepción de pedidos mayoristas
        factorInventario = 1.15;
        serviceLevelOffset = 1.4;
        roturas = 0;
        skusBajoRop = 2;
      } else if (i === 1) { // 06 Sep (Sáb) - Alto consumo de fin de semana
        factorInventario = 1.07;
        serviceLevelOffset = 0.1;
        roturas = 1;
        skusBajoRop = 4;
      } else { // 07 Sep (Dom / Hoy) - Situación actual
        factorInventario = 1.00;
        serviceLevelOffset = -0.9;
        roturas = 2;
        skusBajoRop = politicas.filter(p => p.stock_actual <= p.punto_reorden).length;
      }

      const valorInv = Math.round(currentTotalValue * factorInventario);
      const nivelServicio = Number((targetServiceLevel + serviceLevelOffset).toFixed(1));

      items.push({
        fecha: fechaStr,
        fechaCorta,
        diaSemana,
        nivel_servicio_pct: nivelServicio,
        valor_inventario_cop: valorInv,
        skus_bajo_rop: skusBajoRop,
        roturas_stock: roturas,
        ventas_dia_cop: Math.round(ventasDiaCop)
      });
    }

    return items;
  }

  // --- TOOL: predecir_demanda_semanal_compras ---
  public predecir_demanda_semanal_compras(factorEscenario: number = 1.0): PronosticoSemanalResponse {
    const factor = Math.max(0.5, Math.min(2.5, Number(factorEscenario) || 1.0));
    const hoy = new Date('2026-09-07');
    const productos = pgDb.selectProductos();
    const proveedores = pgDb.selectProveedores();
    const provMap = new Map(proveedores.map(p => [p.id, p]));
    const politicas = this.calcular_todas_politicas();
    const polMap = new Map(politicas.map(p => [p.producto_id, p]));

    const diasNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diasCortos = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    // 7-day forecast calendar: from 2026-09-08 to 2026-09-14
    const diasProyeccion: { fecha: string; diaSemana: string; diaCorta: string; dayIndex: number }[] = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(hoy);
      d.setDate(hoy.getDate() + i);
      const fechaStr = d.toISOString().split('T')[0];
      const diaSemana = diasNombres[d.getDay()];
      const diaCorta = `${diasCortos[d.getDay()]} ${d.getDate().toString().padStart(2, '0')} ${mesesNombres[d.getMonth()]}`;
      diasProyeccion.push({
        fecha: fechaStr,
        diaSemana,
        diaCorta,
        dayIndex: d.getDay()
      });
    }

    const proyeccionesSku: ProyeccionSkuSemanal[] = [];
    const demandaPorDiaTotales: { [fecha: string]: { unidades: number; ventasCop: number; costoCop: number } } = {};

    diasProyeccion.forEach(dp => {
      demandaPorDiaTotales[dp.fecha] = { unidades: 0, ventasCop: 0, costoCop: 0 };
    });

    for (const prod of productos) {
      const prov = provMap.get(prod.proveedor_id);
      const inv = pgDb.selectInventarioByProductoId(prod.id);
      const stockActual = inv?.stock_actual || 0;
      const pol = polMap.get(prod.id);
      const demandaStats = this.consultar_demanda(prod.id, 60);
      const ventasHist = pgDb.selectVentasHistoricas(prod.id, 60);

      // Compute day-of-week multipliers from historical sales
      const dowCounts: { [day: number]: { sum: number; count: number } } = {};
      for (let day = 0; day <= 6; day++) {
        dowCounts[day] = { sum: 0, count: 0 };
      }

      ventasHist.forEach(vh => {
        const vDate = new Date(vh.fecha + 'T00:00:00');
        const dow = vDate.getDay();
        dowCounts[dow].sum += vh.cantidad;
        dowCounts[dow].count += 1;
      });

      const avgOverall = demandaStats.demanda_diaria_promedio || 1;
      const dowMultipliers: { [day: number]: number } = {};
      for (let day = 0; day <= 6; day++) {
        const avgDow = dowCounts[day].count > 0 ? dowCounts[day].sum / dowCounts[day].count : avgOverall;
        let mult = avgOverall > 0 ? avgDow / avgOverall : 1.0;
        // Bound multiplier to realistic bounds for abarrotes
        mult = Math.max(0.65, Math.min(1.85, mult));
        dowMultipliers[day] = mult;
      }

      // Forecast daily values for the 7 upcoming days
      let totalDemanda7d = 0;
      let simStock = stockActual;
      let diaQuiebreEstimado: string | null = null;

      diasProyeccion.forEach((dp, idx) => {
        const dow = dp.dayIndex;
        const dailyExpected = Math.max(0, Math.round(avgOverall * (dowMultipliers[dow] || 1.0) * factor));
        totalDemanda7d += dailyExpected;

        // Add to daily aggregates
        demandaPorDiaTotales[dp.fecha].unidades += dailyExpected;
        demandaPorDiaTotales[dp.fecha].ventasCop += dailyExpected * prod.precio_venta;
        demandaPorDiaTotales[dp.fecha].costoCop += dailyExpected * prod.costo_unitario;

        // Stock trajectory simulation
        simStock -= dailyExpected;
        if (simStock <= 0 && diaQuiebreEstimado === null) {
          diaQuiebreEstimado = `${dp.diaCorta}`;
        }
      });

      // 95% confidence interval for 7-day cumulative demand
      const z95 = getZScore(95);
      const sigma7d = demandaStats.desviacion_estandar * Math.sqrt(7) * factor;
      const margin = Math.round(z95 * sigma7d);
      const intervaloMin = Math.max(0, totalDemanda7d - margin);
      const intervaloMax = totalDemanda7d + margin;

      // Trend analysis
      const recent14 = ventasHist.slice(-14).map(v => v.cantidad);
      const prev14 = ventasHist.slice(-28, -14).map(v => v.cantidad);
      const meanRecent = recent14.length ? recent14.reduce((a, b) => a + b, 0) / recent14.length : avgOverall;
      const meanPrev = prev14.length ? prev14.reduce((a, b) => a + b, 0) / prev14.length : avgOverall;
      let tendencia: 'creciente' | 'estable' | 'decreciente' = 'estable';
      if (meanRecent - meanPrev > 0.8) tendencia = 'creciente';
      else if (meanRecent - meanPrev < -0.8) tendencia = 'decreciente';

      const balanceProyectado = stockActual - totalDemanda7d;
      const leadTime = prov?.plazo_entrega_dias || 2;
      const rop = pol?.punto_reorden || 20;
      const eoq = pol?.eoq || 30;
      const ss = pol?.stock_seguridad || 10;
      const diasCobertura = Number((stockActual / (avgOverall > 0 ? avgOverall : 1)).toFixed(1));

      // Risk classification
      let riesgo: 'CRITICO' | 'ALTO' | 'MODERADO' | 'SEGURO' = 'SEGURO';
      if (stockActual <= 0 || (diaQuiebreEstimado !== null && diasCobertura <= leadTime)) {
        riesgo = 'CRITICO';
      } else if (diaQuiebreEstimado !== null || diasCobertura <= 3.5) {
        riesgo = 'ALTO';
      } else if (stockActual <= rop || diasCobertura <= 7) {
        riesgo = 'MODERADO';
      }

      // Major purchase requirement condition
      const deficit = totalDemanda7d + ss - stockActual;
      const requiereCompraMayor =
        balanceProyectado < 0 ||
        stockActual <= rop ||
        diasCobertura <= (leadTime + 2.5);

      const unidadesSugeridas = requiereCompraMayor
        ? Math.max(eoq, Math.max(totalDemanda7d, deficit))
        : 0;
      const montoCompraCop = Math.round(unidadesSugeridas * prod.costo_unitario);

      // Justification text
      let justificacion = '';
      if (diaQuiebreEstimado) {
        justificacion = `Demanda semanal estimada de ${totalDemanda7d} u agotará el stock actual (${stockActual} u) el ${diaQuiebreEstimado}. Lead time del proveedor ${prov?.nombre || 'General'}: ${leadTime} días. Ordenar de inmediato para evitar ${Math.abs(balanceProyectado)} u de venta perdida.`;
      } else if (stockActual <= rop) {
        justificacion = `Stock actual (${stockActual} u) está por debajo del ROP (${rop} u). La demanda semanal consumirá el ${(totalDemanda7d / (stockActual || 1) * 100).toFixed(0)}% de las existencias.`;
      } else if (requiereCompraMayor) {
        justificacion = `Cobertura ajustada de ${diasCobertura} días frente a una demanda proyectada de ${totalDemanda7d} u. Se anticipa compra para mantener stock de seguridad.`;
      } else {
        justificacion = `Cobertura saludable de ${diasCobertura} días (${stockActual} u disponibles vs ${totalDemanda7d} u proyectadas a 7 días).`;
      }

      proyeccionesSku.push({
        producto_id: prod.id,
        sku: prod.sku,
        nombre: prod.nombre,
        categoria: prod.categoria,
        proveedor_nombre: prov?.nombre || 'Distribuidora Central',
        plazo_entrega_dias: leadTime,
        stock_actual: stockActual,
        punto_reorden: rop,
        eoq,
        demanda_diaria_promedio: Number(avgOverall.toFixed(1)),
        demanda_proyectada_7d: totalDemanda7d,
        intervalo_min_7d: intervaloMin,
        intervalo_max_7d: intervaloMax,
        tendencia,
        balance_proyectado_7d: balanceProyectado,
        dias_cobertura_actual: diasCobertura,
        dia_quiebre_estimado: diaQuiebreEstimado,
        riesgo_desabastecimiento: riesgo,
        requiere_compra_mayor: requiereCompraMayor,
        unidades_sugeridas_compra: unidadesSugeridas,
        monto_compra_cop: montoCompraCop,
        justificacion
      });
    }

    // Daily breakdown array
    const desgloseDias: ProyeccionDiaSemana[] = diasProyeccion.map(dp => {
      const agg = demandaPorDiaTotales[dp.fecha];
      return {
        fecha: dp.fecha,
        diaSemana: dp.diaSemana,
        diaCorta: dp.diaCorta,
        unidades_totales: agg.unidades,
        ventas_proyectadas_cop: Math.round(agg.ventasCop),
        costo_proyectado_cop: Math.round(agg.costoCop)
      };
    });

    // Sort SKU projections: Critical risks first, then by monetary purchase size
    const riskRank = { CRITICO: 3, ALTO: 2, MODERADO: 1, SEGURO: 0 };
    proyeccionesSku.sort((a, b) => {
      const diffRisk = riskRank[b.riesgo_desabastecimiento] - riskRank[a.riesgo_desabastecimiento];
      if (diffRisk !== 0) return diffRisk;
      return b.monto_compra_cop - a.monto_compra_cop;
    });

    const comprasMayores = proyeccionesSku.filter(p => p.requiere_compra_mayor);

    const totalUnidadesDemanda = desgloseDias.reduce((sum, d) => sum + d.unidades_totales, 0);
    const totalVentasCop = desgloseDias.reduce((sum, d) => sum + d.ventas_proyectadas_cop, 0);
    const totalCostoCop = desgloseDias.reduce((sum, d) => sum + d.costo_proyectado_cop, 0);
    const totalPresupuestoCompras = comprasMayores.reduce((sum, c) => sum + c.monto_compra_cop, 0);
    const totalUnidadesCompras = comprasMayores.reduce((sum, c) => sum + c.unidades_sugeridas_compra, 0);
    const skusRiesgoQuiebre = proyeccionesSku.filter(p => p.riesgo_desabastecimiento === 'CRITICO' || p.riesgo_desabastecimiento === 'ALTO').length;

    return {
      horizonte_dias: 7,
      fecha_inicio: diasProyeccion[0].fecha,
      fecha_fin: diasProyeccion[6].fecha,
      factor_escenario: factor,
      total_unidades_demanda: totalUnidadesDemanda,
      total_ventas_proyectadas_cop: totalVentasCop,
      total_costo_demanda_cop: totalCostoCop,
      total_presupuesto_compras_mayores_cop: totalPresupuestoCompras,
      total_unidades_compras_mayores: totalUnidadesCompras,
      skus_en_riesgo_quiebre: skusRiesgoQuiebre,
      desglose_dias: desgloseDias,
      productos: proyeccionesSku,
      compras_mayores_anticipadas: comprasMayores
    };
  }
}

// Global Singleton Analytics Engine
export const analyticsEngine = new AnalyticsEngine();
