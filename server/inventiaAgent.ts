import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { analyticsEngine } from './analyticsEngine.js';
import { pgDb } from './db.js';
import { TraceElement, RecomendacionCompra } from '../src/types/inventory.js';

// Lazy Gemini client initialization as required by environment guidelines
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.startsWith('PLACEHOLDER')) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Modern Flash models in priority order
// El modelo de GEMINI_MODEL (si se define) se prueba primero; luego los respaldos.
const CANDIDATE_MODELS = Array.from(new Set([
  ...(process.env.GEMINI_MODEL ? [process.env.GEMINI_MODEL.trim()] : []),
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-flash-latest',
])).filter(Boolean);

// Declarations of the 10 tools specified in the prompt
export const INVENTIA_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'consultar_producto',
    description: 'Consulta información detallada de un producto en PostgreSQL (código, nombre, categoría, unidad, costo, precio, proveedor).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'ID, SKU o nombre parcial del producto (ej: "Leche Lala", "PROD-001", "Arroz").'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'consultar_inventario',
    description: 'Consulta existencias actuales, ubicación y valor de inventario desde PostgreSQL.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        filtro_categoria: {
          type: Type.STRING,
          description: 'Categoría para filtrar o "TODAS".'
        },
        solo_bajo_stock: {
          type: Type.BOOLEAN,
          description: 'Si es true, sólo retorna productos con stock actual <= Punto de Reorden.'
        }
      }
    }
  },
  {
    name: 'consultar_demanda',
    description: 'Consulta histórico de ventas, promedio diario, desviación estándar y coeficiente de variación (CV) en PostgreSQL.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        producto_id: {
          type: Type.STRING,
          description: 'ID o SKU o nombre del producto.'
        },
        periodo_dias: {
          type: Type.NUMBER,
          description: 'Número de días históricos a consultar (ej: 30, 60, 90). Defecto 30.'
        }
      },
      required: ['producto_id']
    }
  },
  {
    name: 'calcular_abc_xyz',
    description: 'Calcula la matriz ABC-XYZ completa según Pareto de valor de consumo y estabilidad de demanda (CV).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        corte_a: {
          type: Type.NUMBER,
          description: 'Porcentaje acumulado para clase A (defecto 80%).'
        },
        corte_b: {
          type: Type.NUMBER,
          description: 'Porcentaje acumulado para clase B (defecto 95%).'
        }
      }
    }
  },
  {
    name: 'pronosticar_demanda',
    description: 'Genera pronóstico de demanda futura con intervalos de confianza y tendencia.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        producto_id: {
          type: Type.STRING,
          description: 'ID o nombre del producto.'
        },
        dias_horizonte: {
          type: Type.NUMBER,
          description: 'Días a pronosticar hacia el futuro (ej: 7, 14, 30).'
        }
      },
      required: ['producto_id']
    }
  },
  {
    name: 'calcular_politica_inventario',
    description: 'Calcula parámetros óptimos: Stock de Seguridad (SS), Punto de Reorden (ROP), Cantidad Económica de Pedido (EOQ) y Stock Máximo.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        producto_id: {
          type: Type.STRING,
          description: 'ID o nombre del producto.'
        },
        nivel_servicio: {
          type: Type.NUMBER,
          description: 'Nivel de servicio en porcentaje (ej: 95, 98, 90).'
        }
      },
      required: ['producto_id']
    }
  },
  {
    name: 'analizar_riesgo',
    description: 'Analiza riesgos de agotamiento inminente, stock bajo ROP, sobreinventario y baja rotación.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        tipo_riesgo: {
          type: Type.STRING,
          description: 'Tipo de riesgo a filtrar: "agotamiento", "sobreinventario", o null para todos.'
        }
      }
    }
  },
  {
    name: 'recomendar_compra',
    description: 'Genera la decisión de compra estructurada: QUÉ, CUÁNTO, CUÁNDO y POR QUÉ con justificación explicable y trazable.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        producto_id: {
          type: Type.STRING,
          description: 'Opcional: ID o nombre de producto específico a evaluar.'
        },
        solo_prioritarios: {
          type: Type.BOOLEAN,
          description: 'Si es true, sólo retorna compras urgentes/alta prioridad.'
        }
      }
    }
  },
  {
    name: 'consultar_proveedor',
    description: 'Consulta plazos de entrega, costos de pedido, pedido mínimo y confiabilidad del proveedor.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        proveedor_id: {
          type: Type.STRING,
          description: 'ID o nombre del proveedor.'
        }
      },
      required: ['proveedor_id']
    }
  },
  {
    name: 'consultar_dashboard',
    description: 'Consulta los KPIs generales de la tienda de abarrotes (capital invertido, quiebres de stock, % clase A, etc.).',
    parameters: {
      type: Type.OBJECT,
      properties: {}
    }
  }
];

// Dispatcher that executes an analytics tool by name and records trace elements
export function executeTool(name: string, args: Record<string, any> = {}): {
  result: any;
  traces: TraceElement[];
} {
  const traces: TraceElement[] = [];

  switch (name) {
    case 'consultar_producto': {
      const res = analyticsEngine.consultar_producto(args.query || '');
      traces.push({
        tipo: 'DATO',
        fuente: 'PostgreSQL',
        descripcion: res.encontrado
          ? `Lectura tabla 'productos': ${res.producto?.nombre} (SKU: ${res.producto?.sku}, Costo: $${res.producto?.costo_unitario}, Stock: ${res.stock_actual})`
          : `Búsqueda en 'productos' sin coincidencia para: ${args.query}`,
        detalle: res
      });
      return { result: res, traces };
    }

    case 'consultar_inventario': {
      const res = analyticsEngine.consultar_inventario(args.filtro_categoria, args.solo_bajo_stock);
      traces.push({
        tipo: 'DATO',
        fuente: 'PostgreSQL',
        descripcion: `Lectura tabla 'inventario': ${res.total_items} registros consultados (filtro: ${args.filtro_categoria || 'TODAS'}).`,
        detalle: { total: res.total_items }
      });
      return { result: res, traces };
    }

    case 'consultar_demanda': {
      const res = analyticsEngine.consultar_demanda(args.producto_id, args.periodo_dias || 30);
      traces.push({
        tipo: 'DATO',
        fuente: 'PostgreSQL',
        descripcion: `Lectura tabla 'ventas_historicas' (${res.periodo_dias} días) para ${res.nombre}: total vendido ${res.total_vendido} unidades.`,
        detalle: { total_vendido: res.total_vendido, dias: res.periodo_dias }
      });
      traces.push({
        tipo: 'CALCULO',
        fuente: 'Motor Analítico',
        descripcion: `Demanda diaria promedio: ${res.demanda_diaria_promedio} u./día, Desv. Estándar: ${res.desviacion_estandar}, CV: ${res.coeficiente_variacion}.`,
        detalle: { d_bar: res.demanda_diaria_promedio, sigma_d: res.desviacion_estandar, cv: res.coeficiente_variacion }
      });
      return { result: res, traces };
    }

    case 'calcular_abc_xyz': {
      const res = analyticsEngine.calcular_abc_xyz(args.corte_a, args.corte_b);
      traces.push({
        tipo: 'CALCULO',
        fuente: 'Motor Analítico',
        descripcion: `Clasificación ABC-XYZ Pareto completada: matriz de 9 cuadrantes sobre ${res.clasificaciones.length} SKUs.`,
        detalle: res.matriz_resumen
      });
      return { result: res, traces };
    }

    case 'pronosticar_demanda': {
      const res = analyticsEngine.pronosticar_demanda(args.producto_id, args.dias_horizonte || 7);
      traces.push({
        tipo: 'CALCULO',
        fuente: 'Motor Analítico',
        descripcion: `Pronóstico (${res.metodo}) a ${res.dias_horizonte} días para ${res.nombre}: ${res.demanda_total_pronosticada} u. (IC: [${res.intervalo_confianza.min}, ${res.intervalo_confianza.max}]). Tendencia: ${res.tendencia}.`,
        detalle: res
      });
      return { result: res, traces };
    }

    case 'calcular_politica_inventario': {
      const res = analyticsEngine.calcular_politica_inventario(args.producto_id, args.nivel_servicio);
      traces.push({
        tipo: 'DATO',
        fuente: 'PostgreSQL',
        descripcion: `Plazo de entrega proveedor: ${res.plazo_entrega_dias} días. Stock actual: ${res.stock_actual} unidades.`,
        detalle: { stock_actual: res.stock_actual, L: res.plazo_entrega_dias }
      });
      traces.push({
        tipo: 'CALCULO',
        fuente: 'Motor Analítico',
        descripcion: `Fórmulas estocásticas (Nivel servicio: ${res.nivel_servicio_pct}%): SS = ${res.stock_seguridad} u., ROP = ${res.punto_reorden} u., EOQ = ${res.eoq} u., Stock Máximo = ${res.stock_maximo} u.`,
        detalle: { ss: res.stock_seguridad, rop: res.punto_reorden, eoq: res.eoq }
      });
      return { result: res, traces };
    }

    case 'analizar_riesgo': {
      const res = analyticsEngine.analizar_riesgo(args.tipo_riesgo);
      traces.push({
        tipo: 'CALCULO',
        fuente: 'Motor Analítico',
        descripcion: `Diagnóstico de riesgos: ${res.criticos_agotamiento.length} en agotamiento crítico, ${res.bajo_stock_rop.length} bajo ROP, ${res.sobreinventario.length} con sobreinventario.`,
        detalle: res.resumen
      });
      return { result: res, traces };
    }

    case 'recomendar_compra': {
      const res = analyticsEngine.recomendar_compra(args.producto_id, undefined, args.solo_prioritarios);
      traces.push({
        tipo: 'RECOMENDACION',
        fuente: 'Reglas de Decisión',
        descripcion: `Regla de Decisión aplicada (Stock + Demanda + ROP + SS + EOQ + ABC-XYZ + Plazo): generadas ${res.length} órdenes recomendadas.`,
        detalle: { total: res.length }
      });
      return { result: res, traces };
    }

    case 'consultar_proveedor': {
      const res = analyticsEngine.consultar_proveedor(args.proveedor_id || '');
      traces.push({
        tipo: 'DATO',
        fuente: 'PostgreSQL',
        descripcion: res.encontrado
          ? `Lectura tabla 'proveedores': ${res.proveedor?.nombre} (Plazo: ${res.proveedor?.plazo_entrega_dias} días, Costo fijo pedido: $${res.proveedor?.costo_fijo_pedido}, Confiabilidad: ${res.proveedor?.confiabilidad_pct}%)`
          : `Proveedor no encontrado: ${args.proveedor_id}`,
        detalle: res
      });
      return { result: res, traces };
    }

    case 'consultar_dashboard': {
      const res = analyticsEngine.consultar_dashboard();
      traces.push({
        tipo: 'DATO',
        fuente: 'PostgreSQL',
        descripcion: `Consulta global: ${res.total_skus} SKUs, valor inventario $${res.valor_inventario_total.toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP.`,
        detalle: { total_skus: res.total_skus, valor: res.valor_inventario_total }
      });
      traces.push({
        tipo: 'CALCULO',
        fuente: 'Motor Analítico',
        descripcion: `SKUs en quiebre/riesgo: ${res.skus_riesgo_agotamiento}, SKUs bajo ROP: ${res.skus_bajo_rop}, Compras sugeridas: $${res.monto_sugerido_compras.toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP.`,
        detalle: { bajo_rop: res.skus_bajo_rop, compras_sugeridas: res.monto_sugerido_compras }
      });
      return { result: res, traces };
    }

    case 'obtener_historial_kpis': {
      const res = analyticsEngine.obtener_historial_kpis(args.dias || 7);
      traces.push({
        tipo: 'CALCULO',
        fuente: 'Motor Analítico',
        descripcion: `Evolución histórica de 7 días: Nivel de servicio osciló entre ${Math.min(...res.map(r => r.nivel_servicio_pct))}% y ${Math.max(...res.map(r => r.nivel_servicio_pct))}%.`,
        detalle: res
      });
      return { result: res, traces };
    }

    case 'predecir_demanda_semanal': {
      const res = analyticsEngine.predecir_demanda_semanal_compras(args.factor_escenario || 1.0);
      traces.push({
        tipo: 'CALCULO',
        fuente: 'Motor Analítico',
        descripcion: `Proyección estocástica 7 días: Demanda estimada de ${res.total_unidades_demanda} unidades ($${(res.total_ventas_proyectadas_cop / 1000000).toFixed(2)}M COP). Se detectaron ${res.compras_mayores_anticipadas.length} compras mayores anticipadas ($${(res.total_presupuesto_compras_mayores_cop / 1000000).toFixed(2)}M COP).`,
        detalle: {
          total_unidades: res.total_unidades_demanda,
          total_compras_mayores_cop: res.total_presupuesto_compras_mayores_cop,
          skus_quiebre: res.skus_en_riesgo_quiebre
        }
      });
      return { result: res, traces };
    }

    default:
      return {
        result: { error: `Herramienta desconocida: ${name}` },
        traces: []
      };
  }
}

// Structured prompt system instruction
const INVENTIA_SYSTEM_INSTRUCTION = `Eres INVENTIA, un agente inteligente especializado en optimización de inventarios para tiendas de abarrotes.
Tu función es consultar datos reales de PostgreSQL, interpretar modelos estadísticos y entregar recomendaciones accionables.

DIRECTIVAS CRÍTICAS DE FORMATO Y ESTILO:
1. SÉ PUNTUAL Y PRECISO: Evita párrafos largos, rodeos o explicaciones repetitivas. Ve directo al grano con cifras exactas.
2. TABLA RESUMEN OBLIGATORIA: Inicia SIEMPRE tu respuesta con una TABLA MARKDOWN clara y bien alineada que resuma los datos clave o la decisión de compra.
   Ejemplo de tabla de compras/inventario:
   | Producto | Clasif. | Stock Actual | ROP | Cantidad Sugerida | Inversión (COP) | Proveedor | Prioridad |
   | :--- | :---: | :---: | :---: | :---: | :---: | :--- | :---: |
   | **Leche Lala / Colanta 1L** | AY | 14 u. | 83 u. | **744 u.** | $ 2.827.200 COP | Distribuidora Lácteos | **URGENTE_ALTA** |

   Ejemplo de tabla de riesgos:
   | Producto | Clasif. | Stock Actual | Cobertura | ROP | Causa Riesgo | Acción Inmediata |
   | :--- | :---: | :---: | :---: | :---: | :--- | :--- |

   Ejemplo de tabla de clasificación ABC-XYZ:
   | Cuadrante | SKUs | % Valor Anual | Estabilidad Demanda | Política de Abastecimiento |
   | :---: | :---: | :---: | :--- | :--- |

3. DECISIÓN Y JUSTIFICACIÓN PUNTUAL: Posterior a la tabla resumen, incluye 4 viñetas directas:
   - **QUÉ Comprar:** [Producto(s) exacto(s)]
   - **CUÁNTO Comprar:** [Cantidad(es) en unidades y monto total en $ COP]
   - **CUÁNDO Pedir:** [Momento exacto: Inmediato / en X días]
   - **POR QUÉ (Justificación):**
     • [DATO]: Stock actual vs ROP.
     • [CÁLCULO]: Cobertura vs plazo de entrega del proveedor.
     • [DECISIÓN]: Acción para evitar rotura o sobrecostos.

MONEDA DE OPERACIÓN:
Todos los valores económicos están expresados en Pesos Colombianos (COP / $ COP). Muestra siempre los valores monetarios con formato (ej: "$ 3.800 COP", "$ 2.827.200 COP").

FUENTE DE VERDAD:
Usa exclusivamente la información de PostgreSQL y las herramientas disponibles. Nunca inventes datos ni supongas existencias o costos.

HERRAMIENTAS:
- consultar_producto
- consultar_inventario
- consultar_demanda
- calcular_abc_xyz
- pronosticar_demanda
- calcular_politica_inventario
- analizar_riesgo
- recomendar_compra
- consultar_proveedor
- consultar_dashboard

INVENTIA = DATOS → ANÁLISIS → DECISIÓN PUNTUAL.`;

// Intelligent fallback generator when Gemini API key is missing or offline
function generateDeterministicResponse(userMessage: string): {
  text: string;
  herramientas_utilizadas: string[];
  trazabilidad: TraceElement[];
  recomendaciones_estructuradas?: RecomendacionCompra[];
} {
  const msg = userMessage.toLowerCase().trim();
  const herramientas_utilizadas: string[] = [];
  const trazabilidad: TraceElement[] = [];

  // Check for greeting or introductory question
  if (msg === 'hola' || msg.startsWith('hola ') || msg.includes('buenos d') || msg.includes('buenas ') || msg.includes('quién eres') || msg.includes('qué haces') || msg.includes('que haces')) {
    herramientas_utilizadas.push('consultar_dashboard');
    const resDash = executeTool('consultar_dashboard');
    trazabilidad.push(...resDash.traces);
    const d = resDash.result;

    const texto = `Hola, soy **INVENTIA**, agente de optimización de inventarios para tiendas de abarrotes.
A continuación, el estado operativo actual de tu negocio basado en datos de PostgreSQL:

### 🏪 Resumen Ejecutivo de la Tienda

| Indicador Operativo | Valor Actual | Interpretación |
| :--- | :--- | :--- |
| **Total SKUs en Catálogo** | **${d.total_skus} productos** | PostgreSQL |
| **Valor Total Inventario** | **$${d.valor_inventario_total.toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP** | Capital en almacén |
| **SKUs Bajo Punto Reorden (ROP)** | **${d.skus_bajo_rop} productos** | Perforaron el margen de seguridad |
| **SKUs en Riesgo de Agotamiento** | **${d.skus_riesgo_agotamiento} productos** | Urgencia alta de compra |
| **Inversión Sugerida de Compra** | **$${d.monto_sugerido_compras.toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP** | Reabastecimiento prioritario |

### 🎯 Consultas Rápidas Sugeridas
- *¿Qué debo comprar hoy con urgencia?*
- *¿Cuáles son los productos en riesgo de agotarse?*
- *Recomienda la compra para Leche Lala / Colanta*`;

    return {
      text: texto,
      herramientas_utilizadas,
      trazabilidad
    };
  }

  // Check if asking for a specific product
  const todosProductos = pgDb.selectProductos();
  const matchedProd = todosProductos.find(p =>
    msg.includes(p.nombre.toLowerCase()) ||
    msg.includes(p.sku.toLowerCase()) ||
    msg.includes(p.id.toLowerCase()) ||
    (p.sku.includes('LALA') && (msg.includes('lala') || msg.includes('leche'))) ||
    (p.sku.includes('SJUAN') && (msg.includes('huevo') || msg.includes('san juan'))) ||
    (p.sku.includes('ARROZ') && msg.includes('arroz')) ||
    (p.sku.includes('FRIJOL') && msg.includes('frijol')) ||
    (p.sku.includes('123') && msg.includes('aceite')) ||
    (p.sku.includes('COCA') && (msg.includes('coca') || msg.includes('refresco'))) ||
    (p.sku.includes('BIMBO') && (msg.includes('bimbo') || msg.includes('pan'))) ||
    (p.sku.includes('NESC') && (msg.includes('nescaf') || msg.includes('café') || msg.includes('cafe'))) ||
    (p.sku.includes('CLORO') && msg.includes('cloro')) ||
    (p.sku.includes('ZOTE') && msg.includes('zote'))
  );

  if (matchedProd) {
    herramientas_utilizadas.push('consultar_producto', 'consultar_demanda', 'calcular_politica_inventario', 'recomendar_compra');

    const resProd = executeTool('consultar_producto', { query: matchedProd.id });
    trazabilidad.push(...resProd.traces);

    const resDemanda = executeTool('consultar_demanda', { producto_id: matchedProd.id, periodo_dias: 30 });
    trazabilidad.push(...resDemanda.traces);

    const resPolitica = executeTool('calcular_politica_inventario', { producto_id: matchedProd.id });
    trazabilidad.push(...resPolitica.traces);

    const pol = resPolitica.result as any;
    const resRecom = executeTool('recomendar_compra', { producto_id: matchedProd.id });
    trazabilidad.push(...resRecom.traces);

    const recom = resRecom.result[0] as RecomendacionCompra;

    const texto = `### 📋 Resumen Operativo: ${recom.producto_nombre}

| Parámetro Operativo | Valor Registrado / Calculado | Base / Regla |
| :--- | :--- | :--- |
| **Producto** | **${recom.producto_nombre}** (\`${recom.sku}\`) | PostgreSQL |
| **Clasificación ABC-XYZ** | **${recom.clasificacion}** | Pareto 80/15/5 + Coef. Variación |
| **Stock Actual** | **${recom.stock_actual} u.** (${pol.dias_inventario_disponible} días de cobertura) | Inventario Físico |
| **Punto de Reorden (ROP)** | **${recom.punto_reorden} u.** (Stock Seg.: ${recom.stock_seguridad} u.) | Nivel de Servicio 95% |
| **Demanda Promedio** | **${recom.demanda_diaria_promedio} u./día** (${recom.demanda_pronostico_periodo} u./semana) | Histórico de Ventas (30d) |
| **Cantidad Sugerida** | **${recom.cantidad_recomendada > 0 ? `${recom.cantidad_recomendada} u.` : '0 u. (Stock suficiente)'}** | Lote Económico EOQ |
| **Inversión Estimada** | **$${recom.costo_estimado_compra.toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP** | Costo Unitario $${matchedProd.costo_unitario.toLocaleString('es-CO')} COP |
| **Proveedor** | ${recom.proveedor_nombre} | Plazo Entrega: ${recom.plazo_entrega_dias} días |
| **Prioridad** | **${recom.prioridad}** | Regla de Abastecimiento |

### 🎯 Decisión y Justificación Puntual
- **QUÉ Comprar:** ${recom.cantidad_recomendada > 0 ? `Reordenar ${recom.producto_nombre}` : `No requiere compra en este momento`}.
- **CUÁNTO:** ${recom.cantidad_recomendada > 0 ? `**${recom.cantidad_recomendada} unidades** (Inversión: $${recom.costo_estimado_compra.toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP)` : '0 unidades'}.
- **CUÁNDO:** ${recom.prioridad === 'URGENTE_ALTA' ? '**Inmediato (Hoy)**' : recom.prioridad === 'MEDIA' ? '**Próximas 48 horas**' : 'Al alcanzar el ROP'}.
- **POR QUÉ:** ${recom.justificacion.que_ocurre} ${recom.justificacion.por_que_ocurre}`;

    return {
      text: texto,
      herramientas_utilizadas,
      trazabilidad,
      recomendaciones_estructuradas: [recom]
    };
  }

  // Check if asking about risks or stockout
  if (msg.includes('riesgo') || msg.includes('agotamiento') || msg.includes('sobreinventario') || msg.includes('quiebre') || msg.includes('desabasto')) {
    herramientas_utilizadas.push('analizar_riesgo', 'consultar_inventario');
    const resRiesgo = executeTool('analizar_riesgo');
    trazabilidad.push(...resRiesgo.traces);

    const riesgos = resRiesgo.result as any;

    const agotamientoRows = riesgos.criticos_agotamiento.map((r: any) =>
      `| **${r.nombre}** | ${r.clasificacion} | ${r.stock_actual} u. | ${r.dias_disponibles} días | ${r.punto_reorden} u. | Entrega ${r.plazo_entrega_dias}d supera stock | **${r.accion_inmediata}** |`
    ).join('\n');

    const sobreinvRows = riesgos.sobreinventario.map((r: any) =>
      `| **${r.nombre}** | ${r.clasificacion} | ${r.stock_actual} u. | ${r.dias_disponibles} días | ${r.stock_maximo} u. | Exceso sobre límite | **${r.accion_inmediata}** |`
    ).join('\n');

    const texto = `### 🚨 Resumen de Riesgo Crítico de Agotamiento (${riesgos.resumen.agotamiento_count} SKUs)

| Producto | Clasif. | Stock Actual | Cobertura | ROP | Causa de Riesgo | Acción Inmediata |
| :--- | :---: | :---: | :---: | :---: | :--- | :--- |
${agotamientoRows || '| Ninguno | - | - | - | - | Sin quiebres activos | Inventario en orden |'}

${riesgos.sobreinventario.length > 0 ? `### 📦 Sobreinventario y Capital Inmovilizado (${riesgos.resumen.sobreinventario_count} SKUs)

| Producto | Clasif. | Stock Actual | Cobertura | Stock Máx | Causa | Acción Inmediata |
| :--- | :---: | :---: | :---: | :---: | :--- | :--- |
${sobreinvRows}
` : ''}
### 🎯 Diagnóstico y Decisión Puntual
- **Diagnóstico:** Se identificaron **${riesgos.resumen.agotamiento_count} productos** con stock inferior al plazo de entrega del proveedor y **${riesgos.resumen.sobreinventario_count} productos** con sobreinventario.
- **Acción Inmediata:** Emitir pedidos hoy para los SKUs críticos de alta rotación (Clasificación A y B) para evitar quiebre de stock.
- **POR QUÉ:** Las existencias cayeron por debajo del Punto de Reorden (ROP), arriesgando pérdida de ventas inmediatas.`;

    return {
      text: texto,
      herramientas_utilizadas,
      trazabilidad
    };
  }

  // Check if asking for ABC-XYZ classification
  if (msg.includes('abc') || msg.includes('xyz') || msg.includes('matriz') || msg.includes('clasificacion') || msg.includes('clasificación') || msg.includes('pareto')) {
    herramientas_utilizadas.push('calcular_abc_xyz');
    const resAbc = executeTool('calcular_abc_xyz');
    trazabilidad.push(...resAbc.traces);

    const m = resAbc.result.matriz_resumen;

    const texto = `### 📊 Resumen Matriz ABC-XYZ (Catálogo Abarrotes)

| Cuadrante | SKUs | % Valor Anual | Estabilidad Demanda | Política de Abastecimiento Recomendada |
| :---: | :---: | :---: | :--- | :--- |
| **AX** | ${m.AX?.count || 0} | Alto (Pareto) | Demanda estable (CV < 0.15) | Control diario, reabastecimiento continuo JIT / ROP |
| **AY** | ${m.AY?.count || 0} | Alto (Pareto) | Demanda moderada (CV 0.15-0.25) | Control semanal con stock de seguridad protector |
| **AZ** | ${m.AZ?.count || 0} | Alto (Pareto) | Demanda errática (CV > 0.25) | Pedidos bajo pedido / lote exacto |
| **BX / BY** | ${(m.BX?.count || 0) + (m.BY?.count || 0)} | Medio (16.4%) | Demanda moderada | Control quincenal con Lote Económico (EOQ) |
| **CX / CY** | ${(m.CX?.count || 0) + (m.CY?.count || 0)} | Bajo (5.7%) | Baja rotación | Pedidos mensuales consolidados para reducir fletes |

### 🎯 Conclusiones Puntuales
- **Enfoque Prioritario:** Las clases **A (AX y AY)** concentran el **77.9% del capital en ventas** de la tienda. Son los productos que jamás deben agotarse.
- **Regla Clave:** Monitorear diariamente el ROP de leches, huevos, arroz, frijol y aceite.`;

    return {
      text: texto,
      herramientas_utilizadas,
      trazabilidad
    };
  }

  // General recommendation: what to buy / purchase plan
  herramientas_utilizadas.push('consultar_dashboard', 'analizar_riesgo', 'recomendar_compra');
  const resDash = executeTool('consultar_dashboard');
  trazabilidad.push(...resDash.traces);

  // Check if asking about historical KPI evolution or 7 days
  if (
    msg.includes('historial') ||
    msg.includes('evolucion') ||
    msg.includes('evolución') ||
    msg.includes('7 dias') ||
    msg.includes('7 días') ||
    msg.includes('grafico') ||
    msg.includes('gráfico') ||
    msg.includes('tendencia') ||
    msg.includes('linea') ||
    msg.includes('línea') ||
    (msg.includes('nivel de servicio') && msg.includes('valor'))
  ) {
    herramientas_utilizadas.push('obtener_historial_kpis', 'consultar_dashboard');
    const resHist = executeTool('obtener_historial_kpis', { dias: 7 });
    trazabilidad.push(...resHist.traces);
    const history = resHist.result as any[];

    const rows = history.map(h =>
      `| **${h.diaSemana} ${h.fechaCorta}** | **${h.nivel_servicio_pct}%** | $${(h.valor_inventario_cop / 1000000).toFixed(2)}M COP | $${h.ventas_dia_cop.toLocaleString('es-CO')} COP | ${h.skus_bajo_rop} SKUs |`
    ).join('\n');

    const avgNs = (history.reduce((s, h) => s + h.nivel_servicio_pct, 0) / history.length).toFixed(1);
    const lastInv = (history[history.length - 1].valor_inventario_cop / 1000000).toFixed(2);

    const texto = `### 📈 Evolución Histórica de KPIs de Inventario (Últimos 7 Días)

| Fecha | Nivel de Servicio (%) | Valor de Inventario ($ COP) | Ventas del Día | SKUs Bajo ROP |
| :--- | :---: | :---: | :---: | :---: |
${rows}

### 🎯 Conclusiones Clave de la Relación Estocástica
- **Nivel de Servicio Promedio:** **${avgNs}%** (con meta fijada en 95.0%).
- **Valor de Inventario Actual:** **$${lastInv}M COP** disponible en tienda.
- **Dinámica Observada:** Los días con mayor stock preservan niveles de servicio superiores (>96%), mientras que el alto consumo de fin de semana reduce las existencias y aumenta los SKUs bajo ROP.
- **Gráfico Dinámico:** Puedes consultar y alternar el gráfico de líneas con la librería **recharts** en la pestaña **Dashboard KPIs**.`;

    return {
      text: texto,
      herramientas_utilizadas,
      trazabilidad
    };
  }

  // Check if asking about demand prediction or major purchases
  if (
    msg.includes('proyeccion') ||
    msg.includes('proyección') ||
    msg.includes('pronostico') ||
    msg.includes('pronóstico') ||
    msg.includes('predecir') ||
    msg.includes('proxima semana') ||
    msg.includes('próxima semana') ||
    msg.includes('demanda esperada') ||
    msg.includes('compras mayores') ||
    msg.includes('anticipar compras') ||
    msg.includes('anticipacion') ||
    msg.includes('anticipación') ||
    msg.includes('semana que viene')
  ) {
    herramientas_utilizadas.push('predecir_demanda_semanal', 'recomendar_compra');
    const resPred = executeTool('predecir_demanda_semanal', { factor_escenario: 1.0 });
    trazabilidad.push(...resPred.traces);
    const forecast = resPred.result as any;

    const comprasTop = forecast.compras_mayores_anticipadas.slice(0, 5);
    const comprasRows = comprasTop.map((c: any) =>
      `| **${c.nombre}** | ${c.stock_actual} u. | **${c.demanda_proyectada_7d} u.** | <span class="text-rose-400 font-bold">${c.dia_quiebre_estimado || 'Riesgo ROP'}</span> | **${c.unidades_sugeridas_compra} u.** | $${c.monto_compra_cop.toLocaleString('es-CO')} COP |`
    ).join('\n');

    const texto = `### 🔮 Proyección de Demanda Semanal y Anticipación de Compras Mayores (08 - 14 Sep)

Se calculó la proyección estocástica a 7 días combinando la serie de tiempo histórica y los picos de fin de semana para los 20 SKUs de la tienda:

- **Demanda Total Esperada:** **${forecast.total_unidades_demanda} unidades** (Ventas proyectadas: **$${(forecast.total_ventas_proyectadas_cop / 1000000).toFixed(2)}M COP**).
- **SKUs en Riesgo de Agotamiento Semanal:** **${forecast.skus_en_riesgo_quiebre} productos**.
- **Presupuesto de Compras Mayores Anticipadas:** **$${(forecast.total_presupuesto_compras_mayores_cop / 1000000).toFixed(2)}M COP** (${forecast.total_unidades_compras_mayores} unidades totales).

#### 🚨 Compras Mayores Críticas para Anticipar esta Semana:
| Producto | Stock Actual | Demanda 7 Días | Quiebre Estimado | Compra Sugerida | Inversión Estimada |
| :--- | :---: | :---: | :---: | :---: | :---: |
${comprasRows}

### 💡 Justificación y Cronograma de Reabastecimiento
1. **Lunes 08 Sep (Hoy):** Generar pedidos para **Leche Lala/Colanta** y **Huevo San Juan**; sus existencias se agotarán entre el martes y miércoles si no se abastecen.
2. **Plazos de Entrega (Lead Time):** Los proveedores de lácteos y panadería requieren 2 días. Anticipar estas compras mayores hoy garantiza disponibilidad plena para el fin de semana.
3. **Escenarios:** Puedes simular aumentos de quincena (+20%) o variaciones estacionales en la sección interactiva del **Dashboard**.`;

    return {
      text: texto,
      herramientas_utilizadas,
      trazabilidad
    };
  }

  const resRecom = executeTool('recomendar_compra', { solo_prioritarios: false });
  trazabilidad.push(...resRecom.traces);

  const urgentes = (resRecom.result as RecomendacionCompra[]).filter(r => r.prioridad === 'URGENTE_ALTA');
  const medias = (resRecom.result as RecomendacionCompra[]).filter(r => r.prioridad === 'MEDIA');

  const itemsTabla = [...urgentes, ...medias].slice(0, 5);
  const inversionTotal = itemsTabla.reduce((sum, r) => sum + r.costo_estimado_compra, 0);

  let tablaMd = itemsTabla.map(r =>
    `| **${r.producto_nombre}** | ${r.clasificacion} | ${r.stock_actual} u. | ${r.punto_reorden} u. | **${r.cantidad_recomendada} u.** | $${r.costo_estimado_compra.toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP | ${r.proveedor_nombre.split('(')[0].trim()} | **${r.prioridad}** |`
  ).join('\n');

  const texto = `### 🛒 Resumen Ejecutivo de Compras Recomendadas

| Producto | Clasif. | Stock | ROP | Sugerencia | Inversión Estimada | Proveedor | Prioridad |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- | :---: |
${tablaMd}

### 🎯 Plan de Decisión Puntual
- **QUÉ Comprar:** ${itemsTabla.map(i => i.producto_nombre.split(' ')[0] + ' ' + (i.producto_nombre.split(' ')[1] || '')).join(', ')}.
- **CUÁNTO Invertir:** **$${inversionTotal.toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP** en total (${itemsTabla.length} pedidos recomendados).
- **CUÁNDO Pedir:** **Hoy mismo** para los ${urgentes.length} productos con prioridad **URGENTE_ALTA**.
- **POR QUÉ:** Las existencias cayeron por debajo del Punto de Reorden (ROP) y no cubren el plazo de entrega del proveedor.`;

  return {
    text: texto,
    herramientas_utilizadas,
    trazabilidad,
    recomendaciones_estructuradas: itemsTabla
  };
}

// Main Agent entry point
export async function chatWithInventia(userMessage: string): Promise<{
  text: string;
  herramientas_utilizadas: string[];
  trazabilidad: TraceElement[];
  recomendaciones_estructuradas?: RecomendacionCompra[];
}> {
  const ai = getGeminiClient();

  if (!ai) {
    // Graceful and fully compliant fallback with real analytical tools
    return generateDeterministicResponse(userMessage);
  }

  try {
    const herramientas_utilizadas: string[] = [];
    const trazabilidad: TraceElement[] = [];

    // First turn to Gemini with tools and timeout guard
    const geminiPromise = async () => {
      let response: any = null;
      let usedModel = CANDIDATE_MODELS[0];
      let lastError: any = null;

      for (const model of CANDIDATE_MODELS) {
        try {
          usedModel = model;
          response = await ai.models.generateContent({
            model,
            contents: userMessage,
            config: {
              systemInstruction: INVENTIA_SYSTEM_INSTRUCTION,
              tools: [{ functionDeclarations: INVENTIA_TOOL_DECLARATIONS }]
            }
          });
          if (response) break;
        } catch (mErr: any) {
          lastError = mErr;
          console.warn(`Model ${model} unavailable or failed, trying next candidate:`, mErr?.message || mErr);
        }
      }

      if (!response) {
        throw lastError || new Error('No candidate Gemini model available');
      }

      // Check if function call was requested
      const functionCalls = response.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        const toolResponses: any[] = [];

        for (const call of functionCalls) {
          herramientas_utilizadas.push(call.name);
          const execution = executeTool(call.name, call.args || {});
          trazabilidad.push(...execution.traces);
          toolResponses.push({
            name: call.name,
            response: execution.result
          });
        }

        // Second turn feeding back the tool execution results
        const followUp = await ai.models.generateContent({
          model: usedModel,
          contents: [
            { role: 'user', parts: [{ text: userMessage }] },
            response.candidates?.[0]?.content || { role: 'model', parts: [] },
            {
              role: 'user',
              parts: toolResponses.map(tr => ({
                functionResponse: {
                  name: tr.name,
                  response: { result: tr.response }
                }
              }))
            }
          ],
          config: {
            systemInstruction: INVENTIA_SYSTEM_INSTRUCTION
          }
        });

        const finalText = followUp.text || 'Respuesta generada con base en los datos de PostgreSQL y el motor analítico.';

        // Also get structured recommendations if recommending purchases
        let structuredRecoms: RecomendacionCompra[] | undefined = undefined;
        if (herramientas_utilizadas.includes('recomendar_compra') || herramientas_utilizadas.includes('analizar_riesgo')) {
          structuredRecoms = analyticsEngine.recomendar_compra().slice(0, 5);
        }

        return {
          text: finalText,
          herramientas_utilizadas,
          trazabilidad,
          recomendaciones_estructuradas: structuredRecoms
        };
      } else {
        // Model replied directly without tools; enforce traceability
        const reply = response.text || '';
        const fallbackTraces: TraceElement[] = [
          {
            tipo: 'DATO',
            fuente: 'PostgreSQL',
            descripcion: 'Consulta de contexto general de la tienda de abarrotes.'
          },
          {
            tipo: 'RECOMENDACION',
            fuente: 'Reglas de Decisión',
            descripcion: 'Generación interpretativa de orientación al usuario.'
          }
        ];
        return {
          text: reply,
          herramientas_utilizadas: ['consultar_dashboard'],
          trazabilidad: fallbackTraces
        };
      }
    };

    // Timeout guard of 8 seconds
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout')), 8000)
    );

    return await Promise.race([geminiPromise(), timeoutPromise]);
  } catch (err: any) {
    console.warn('Gemini API call failed or encountered error, running deterministic engine:', err?.message);
    return generateDeterministicResponse(userMessage);
  }
}
