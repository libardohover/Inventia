import { Producto, Proveedor, InventarioItem, VentaDiaria } from '../src/types/inventory.js';
import { leerEstado, guardarEstado, borrarEstado, type StockGuardado } from './persistence.js';

// Pre-seeded suppliers for grocery retail with Colombian Peso (COP) economics
export const PROVEEDORES_INICIALES: Proveedor[] = [
  {
    id: 'PROV-001',
    nombre: 'Distribuidora Lácteos del Centro (Grupo Lala / Colanta)',
    contacto: 'Arturo Méndez',
    telefono: '310-412-8890',
    plazo_entrega_dias: 2,
    desv_plazo_entrega: 0.5,
    costo_fijo_pedido: 22000, // COP
    pedido_minimo_monto: 200000, // COP
    confiabilidad_pct: 96,
  },
  {
    id: 'PROV-002',
    nombre: 'Abarrotes Mayorista La Central (Corabastos Granos y Semillas)',
    contacto: 'Guillermo Morales',
    telefono: '315-778-1122',
    plazo_entrega_dias: 1,
    desv_plazo_entrega: 0.2,
    costo_fijo_pedido: 30000, // COP
    pedido_minimo_monto: 350000, // COP
    confiabilidad_pct: 98,
  },
  {
    id: 'PROV-003',
    nombre: 'Bebidas Embotelladora Nacional (Refrescos y Gaseosas)',
    contacto: 'Laura Salgado',
    telefono: '312-334-9988',
    plazo_entrega_dias: 3,
    desv_plazo_entrega: 0.8,
    costo_fijo_pedido: 35000, // COP
    pedido_minimo_monto: 300000, // COP
    confiabilidad_pct: 92,
  },
  {
    id: 'PROV-004',
    nombre: 'Distribuidora Panificadora Tradicional (Bimbo Colombia)',
    contacto: 'Carlos Ortiz',
    telefono: '318-667-4433',
    plazo_entrega_dias: 1,
    desv_plazo_entrega: 0.1,
    costo_fijo_pedido: 16000, // COP
    pedido_minimo_monto: 150000, // COP
    confiabilidad_pct: 99,
  },
  {
    id: 'PROV-005',
    nombre: 'Consorcio Químicos y Limpieza Hogar',
    contacto: 'Patricia Vega',
    telefono: '320-889-2211',
    plazo_entrega_dias: 4,
    desv_plazo_entrega: 1.0,
    costo_fijo_pedido: 25000, // COP
    pedido_minimo_monto: 220000, // COP
    confiabilidad_pct: 90,
  },
  {
    id: 'PROV-006',
    nombre: 'Avícola San Juan / Santa Anita',
    contacto: 'Héctor Jiménez',
    telefono: '311-223-5566',
    plazo_entrega_dias: 2,
    desv_plazo_entrega: 0.3,
    costo_fijo_pedido: 24000, // COP
    pedido_minimo_monto: 250000, // COP
    confiabilidad_pct: 95,
  }
];

export const PRODUCTOS_INICIALES: Producto[] = [
  {
    id: 'PROD-001',
    sku: 'LAC-LALA-1L',
    nombre: 'Leche Lala / Colanta Entera 1 Litro (Tetra Pak)',
    categoria: 'Lácteos',
    unidad: 'Pieza',
    precio_venta: 4800, // COP
    costo_unitario: 3800, // COP
    proveedor_id: 'PROV-001',
    lote_minimo: 12, // Caja con 12
    presentacion: 'Caja 12 piezas',
    descripcion: 'Leche entera ultrapasteurizada adicionada con vitaminas A y D.'
  },
  {
    id: 'PROD-002',
    sku: 'HUE-SJUAN-12',
    nombre: 'Huevo Blanco Tipo AA Paquete 12 Piezas',
    categoria: 'Abarrotes Básicos',
    unidad: 'Paquete',
    precio_venta: 9400, // COP
    costo_unitario: 7600, // COP
    proveedor_id: 'PROV-006',
    lote_minimo: 10,
    presentacion: 'Caja con 10 paquetes',
    descripcion: 'Huevo fresco de gallina seleccionado calidad superior.'
  },
  {
    id: 'PROD-003',
    sku: 'GRA-ARROZ-1KG',
    nombre: 'Arroz Blanco Grano Seleccionado 1 Kg',
    categoria: 'Granos y Semillas',
    unidad: 'Bolsa',
    precio_venta: 4900, // COP
    costo_unitario: 3900, // COP
    proveedor_id: 'PROV-002',
    lote_minimo: 20,
    presentacion: 'Fardo de 20 bolsas',
    descripcion: 'Arroz grano largo grado superior libre de impurezas.'
  },
  {
    id: 'PROD-004',
    sku: 'GRA-FRIJOL-1KG',
    nombre: 'Frijol Bola Roja Seleccionado 1 Kg',
    categoria: 'Granos y Semillas',
    unidad: 'Bolsa',
    precio_venta: 10900, // COP
    costo_unitario: 8600, // COP
    proveedor_id: 'PROV-002',
    lote_minimo: 20,
    presentacion: 'Fardo de 20 bolsas',
    descripcion: 'Frijol rojo de rápida cocción cosechado y seleccionado.'
  },
  {
    id: 'PROD-005',
    sku: 'ACE-123-1L',
    nombre: 'Aceite Comestible Vegetal 1-2-3 1 Litro',
    categoria: 'Aceites y Grasas',
    unidad: 'Botella',
    precio_venta: 11400, // COP
    costo_unitario: 8900, // COP
    proveedor_id: 'PROV-002',
    lote_minimo: 12,
    presentacion: 'Caja de 12 botellas',
    descripcion: 'Aceite vegetal comestible puro mezcla soya y girasol.'
  },
  {
    id: 'PROD-006',
    sku: 'BEB-COCA-600',
    nombre: 'Gaseosa Coca-Cola Regular 600 ml Pet',
    categoria: 'Bebidas',
    unidad: 'Botella',
    precio_venta: 3800, // COP
    costo_unitario: 2900, // COP
    proveedor_id: 'PROV-003',
    lote_minimo: 24,
    presentacion: 'Paquete de 24 botellas',
    descripcion: 'Bebida gaseosa refrescante presentación individual.'
  },
  {
    id: 'PROD-007',
    sku: 'BEB-COCA-2L',
    nombre: 'Gaseosa Coca-Cola Regular 2.5 Litros Pet',
    categoria: 'Bebidas',
    unidad: 'Botella',
    precio_venta: 9900, // COP
    costo_unitario: 7800, // COP
    proveedor_id: 'PROV-003',
    lote_minimo: 8,
    presentacion: 'Paquete de 8 botellas',
    descripcion: 'Gaseosa familiar de cola no retornable.'
  },
  {
    id: 'PROD-008',
    sku: 'PAN-BIMBO-BLA',
    nombre: 'Pan Blanco Bimbo Tajado Grande 680g',
    categoria: 'Panadería',
    unidad: 'Bolsa',
    precio_venta: 10200, // COP
    costo_unitario: 8200, // COP
    proveedor_id: 'PROV-004',
    lote_minimo: 10,
    presentacion: 'Charola de 10 paquetes',
    descripcion: 'Pan tajado enriquecido con vitaminas y minerales.'
  },
  {
    id: 'PROD-009',
    sku: 'AZU-ESTAN-1KG',
    nombre: 'Azúcar Blanca Especial de Caña 1 Kg',
    categoria: 'Abarrotes Básicos',
    unidad: 'Bolsa',
    precio_venta: 5600, // COP
    costo_unitario: 4500, // COP
    proveedor_id: 'PROV-002',
    lote_minimo: 25,
    presentacion: 'Costal con 25 bolsas de 1kg',
    descripcion: 'Azúcar estándar refinada de caña nacional.'
  },
  {
    id: 'PROD-010',
    sku: 'CAF-NESC-200G',
    nombre: 'Café Soluble Nescafé Clásico Frasco 200g',
    categoria: 'Café y Té',
    unidad: 'Frasco',
    precio_venta: 28500, // COP
    costo_unitario: 22800, // COP
    proveedor_id: 'PROV-002',
    lote_minimo: 6,
    presentacion: 'Caja con 6 frascos',
    descripcion: 'Café 100% puro soluble granulado con tostado medio.'
  },
  {
    id: 'PROD-011',
    sku: 'ATU-DOLOR-AGUA',
    nombre: 'Atún en Agua Lomitos Lata 140g',
    categoria: 'Enlatados',
    unidad: 'Lata',
    precio_venta: 7400, // COP
    costo_unitario: 5800, // COP
    proveedor_id: 'PROV-002',
    lote_minimo: 24,
    presentacion: 'Charola con 24 latas',
    descripcion: 'Lomo de atún aleta amarilla en agua sin conservantes.'
  },
  {
    id: 'PROD-012',
    sku: 'MAY-MCCORM-390',
    nombre: 'Mayonesa con Limón Frasco 390g',
    categoria: 'Enlatados y Condimentos',
    unidad: 'Frasco',
    precio_venta: 10600, // COP
    costo_unitario: 8400, // COP
    proveedor_id: 'PROV-002',
    lote_minimo: 12,
    presentacion: 'Caja con 12 frascos',
    descripcion: 'Mayonesa clásica emulsionada con toque de limón.'
  },
  {
    id: 'PROD-013',
    sku: 'HAR-MASECA-1KG',
    nombre: 'Harina de Maíz Precocida Harina PAN 1 Kg',
    categoria: 'Abarrotes Básicos',
    unidad: 'Paquete',
    precio_venta: 5200, // COP
    costo_unitario: 4100, // COP
    proveedor_id: 'PROV-002',
    lote_minimo: 10,
    presentacion: 'Fardo con 10 paquetes',
    descripcion: 'Harina de maíz blanco precocida para arepas y recetas.'
  },
  {
    id: 'PROD-014',
    sku: 'PAS-MODER-ESP',
    nombre: 'Pasta Espagueti Tradicional 250g',
    categoria: 'Pastas',
    unidad: 'Paquete',
    precio_venta: 2900, // COP
    costo_unitario: 2200, // COP
    proveedor_id: 'PROV-002',
    lote_minimo: 20,
    presentacion: 'Caja con 20 paquetes',
    descripcion: 'Pasta de sémola de trigo fortificada.'
  },
  {
    id: 'PROD-015',
    sku: 'LIM-CLORO-1L',
    nombre: 'Cloro / Límpido Desinfectante 1 Litro',
    categoria: 'Limpieza',
    unidad: 'Botella',
    precio_venta: 4600, // COP
    costo_unitario: 3500, // COP
    proveedor_id: 'PROV-005',
    lote_minimo: 12,
    presentacion: 'Caja con 12 botellas',
    descripcion: 'Hipoclorito de sodio al 5.25% desinfectante y blanqueador.'
  },
  {
    id: 'PROD-016',
    sku: 'LIM-ZOTE-400G',
    nombre: 'Jabón de Lavandería en Barra 400g',
    categoria: 'Limpieza',
    unidad: 'Barra',
    precio_venta: 5100, // COP
    costo_unitario: 3800, // COP
    proveedor_id: 'PROV-005',
    lote_minimo: 25,
    presentacion: 'Caja con 25 barras',
    descripcion: 'Jabón tradicional de lavandería para ropa y remoción de grasa.'
  },
  {
    id: 'PROD-017',
    sku: 'PAP-REGIO-4R',
    nombre: 'Papel Higiénico Doble Hoja Paquete 4 Rollos',
    categoria: 'Higiene Personal',
    unidad: 'Paquete',
    precio_venta: 8900, // COP
    costo_unitario: 6900, // COP
    proveedor_id: 'PROV-005',
    lote_minimo: 12,
    presentacion: 'Bulto con 12 paquetes',
    descripcion: 'Papel higiénico doble hoja suave y resistente.'
  },
  {
    id: 'PROD-018',
    sku: 'GAL-MARIA-170G',
    nombre: 'Galletas Tradicionales Paquete 170g',
    categoria: 'Galletas y Dulces',
    unidad: 'Paquete',
    precio_venta: 4100, // COP
    costo_unitario: 3100, // COP
    proveedor_id: 'PROV-004',
    lote_minimo: 16,
    presentacion: 'Caja con 16 rollos',
    descripcion: 'Galletas tradicionales sabor vainilla adicionadas con vitaminas.'
  },
  {
    id: 'PROD-019',
    sku: 'SAL-FINA-1KG',
    nombre: 'Sal de Mesa Refinada Yodada 1 Kg',
    categoria: 'Abarrotes Básicos',
    unidad: 'Bote',
    precio_venta: 3200, // COP
    costo_unitario: 2300, // COP
    proveedor_id: 'PROV-002',
    lote_minimo: 12,
    presentacion: 'Charola con 12 botes',
    descripcion: 'Sal marina refinada con yodo y flúor.'
  },
  {
    id: 'PROD-020',
    sku: 'SOP-KNORR-8CUB',
    nombre: 'Caldo de Gallina / Pollo Caja 8 Cubos',
    categoria: 'Enlatados y Condimentos',
    unidad: 'Caja',
    precio_venta: 3700, // COP
    costo_unitario: 2700, // COP
    proveedor_id: 'PROV-002',
    lote_minimo: 24,
    presentacion: 'Tira con 24 cajitas',
    descripcion: 'Sazonador concentrado de gallina con hierbas y especias.'
  }
];

// Current stock situation calibrated to test:
// 1. Stockout risk (Leche Lala, Huevos San Juan) -> Stock <= ROP, imminent depletion
// 2. Approaching reorder (Aceite 1-2-3, Pan Bimbo)
// 3. Normal / optimal (Arroz, Frijol, Refresco Coca-Cola)
// 4. Overstock (Sal La Fina, Jabón Zote) -> days of inventory >> 60
export const INVENTARIO_INICIAL: InventarioItem[] = [
  {
    producto_id: 'PROD-001', // Leche Lala: demanda ~28 u/dia, ROP ~75, stock actual 14 -> CRITICO
    stock_actual: 14,
    stock_reservado: 0,
    ubicacion: 'Pasillo 1 - Refrigerador',
    ultimo_reabastecimiento: '2026-09-02',
    costo_almacenamiento_anual_pct: 0.22
  },
  {
    producto_id: 'PROD-002', // Huevo San Juan: demanda ~18 u/dia, ROP ~48, stock actual 8 -> CRITICO
    stock_actual: 8,
    stock_reservado: 0,
    ubicacion: 'Mostrador Central',
    ultimo_reabastecimiento: '2026-09-01',
    costo_almacenamiento_anual_pct: 0.20
  },
  {
    producto_id: 'PROD-003', // Arroz Morelos: demanda ~12 u/dia, ROP ~20, stock actual 38 -> OPTIMO
    stock_actual: 38,
    stock_reservado: 0,
    ubicacion: 'Pasillo 2 - Estante A',
    ultimo_reabastecimiento: '2026-09-04',
    costo_almacenamiento_anual_pct: 0.18
  },
  {
    producto_id: 'PROD-004', // Frijol Negro: demanda ~10 u/dia, ROP ~18, stock actual 16 -> BAJO_STOCK_ROP
    stock_actual: 16,
    stock_reservado: 0,
    ubicacion: 'Pasillo 2 - Estante A',
    ultimo_reabastecimiento: '2026-09-03',
    costo_almacenamiento_anual_pct: 0.18
  },
  {
    producto_id: 'PROD-005', // Aceite 1-2-3: demanda ~15 u/dia, ROP ~26, stock actual 22 -> BAJO_STOCK_ROP
    stock_actual: 22,
    stock_reservado: 0,
    ubicacion: 'Pasillo 2 - Estante B',
    ultimo_reabastecimiento: '2026-09-02',
    costo_almacenamiento_anual_pct: 0.18
  },
  {
    producto_id: 'PROD-006', // Coca-Cola 600ml: demanda ~45 u/dia, ROP ~165, stock actual 68 -> CRITICO
    stock_actual: 68,
    stock_reservado: 0,
    ubicacion: 'Refrigerador Bebidas 1',
    ultimo_reabastecimiento: '2026-09-03',
    costo_almacenamiento_anual_pct: 0.24
  },
  {
    producto_id: 'PROD-007', // Coca-Cola 2.5L: demanda ~16 u/dia, ROP ~60, stock actual 74 -> OPTIMO
    stock_actual: 74,
    stock_reservado: 0,
    ubicacion: 'Refrigerador Bebidas 2',
    ultimo_reabastecimiento: '2026-09-05',
    costo_almacenamiento_anual_pct: 0.24
  },
  {
    producto_id: 'PROD-008', // Pan Bimbo: demanda ~22 u/dia, ROP ~32, stock actual 26 -> BAJO_STOCK_ROP
    stock_actual: 26,
    stock_reservado: 0,
    ubicacion: 'Anaquel Panadería Bimbo',
    ultimo_reabastecimiento: '2026-09-06',
    costo_almacenamiento_anual_pct: 0.25
  },
  {
    producto_id: 'PROD-009', // Azúcar Estándar: demanda ~14 u/dia, ROP ~24, stock actual 45 -> OPTIMO
    stock_actual: 45,
    stock_reservado: 0,
    ubicacion: 'Pasillo 2 - Estante C',
    ultimo_reabastecimiento: '2026-09-03',
    costo_almacenamiento_anual_pct: 0.18
  },
  {
    producto_id: 'PROD-010', // Café Nescafé: demanda ~4 u/dia, ROP ~9, stock actual 6 -> BAJO_STOCK_ROP
    stock_actual: 6,
    stock_reservado: 0,
    ubicacion: 'Vitrina Mostrador',
    ultimo_reabastecimiento: '2026-08-30',
    costo_almacenamiento_anual_pct: 0.20
  },
  {
    producto_id: 'PROD-011', // Atún Dolores: demanda ~11 u/dia, ROP ~19, stock actual 42 -> OPTIMO
    stock_actual: 42,
    stock_reservado: 0,
    ubicacion: 'Pasillo 3 - Estante A',
    ultimo_reabastecimiento: '2026-09-01',
    costo_almacenamiento_anual_pct: 0.18
  },
  {
    producto_id: 'PROD-012', // Mayonesa: demanda ~5 u/dia, ROP ~10, stock actual 18 -> OPTIMO
    stock_actual: 18,
    stock_reservado: 0,
    ubicacion: 'Pasillo 3 - Estante B',
    ultimo_reabastecimiento: '2026-08-28',
    costo_almacenamiento_anual_pct: 0.18
  },
  {
    producto_id: 'PROD-013', // Harina Maseca: demanda ~13 u/dia, ROP ~22, stock actual 35 -> OPTIMO
    stock_actual: 35,
    stock_reservado: 0,
    ubicacion: 'Pasillo 2 - Tarima',
    ultimo_reabastecimiento: '2026-09-04',
    costo_almacenamiento_anual_pct: 0.18
  },
  {
    producto_id: 'PROD-014', // Espagueti: demanda ~8 u/dia, ROP ~14, stock actual 28 -> OPTIMO
    stock_actual: 28,
    stock_reservado: 0,
    ubicacion: 'Pasillo 3 - Estante C',
    ultimo_reabastecimiento: '2026-09-01',
    costo_almacenamiento_anual_pct: 0.18
  },
  {
    producto_id: 'PROD-015', // Cloro: demanda ~6 u/dia, ROP ~32, stock actual 19 -> CRITICO (L=4 días)
    stock_actual: 19,
    stock_reservado: 0,
    ubicacion: 'Pasillo 4 - Limpieza',
    ultimo_reabastecimiento: '2026-08-25',
    costo_almacenamiento_anual_pct: 0.20
  },
  {
    producto_id: 'PROD-016', // Jabón Zote: demanda ~5 u/dia, ROP ~28, stock actual 165 -> SOBREINVENTARIO
    stock_actual: 165,
    stock_reservado: 0,
    ubicacion: 'Bodega posterior',
    ultimo_reabastecimiento: '2026-08-15',
    costo_almacenamiento_anual_pct: 0.20
  },
  {
    producto_id: 'PROD-017', // Papel Regio: demanda ~9 u/dia, ROP ~46, stock actual 30 -> BAJO_STOCK_ROP
    stock_actual: 30,
    stock_reservado: 0,
    ubicacion: 'Pasillo 4 - Anaquel alto',
    ultimo_reabastecimiento: '2026-08-28',
    costo_almacenamiento_anual_pct: 0.22
  },
  {
    producto_id: 'PROD-018', // Galletas Marías: demanda ~10 u/dia, ROP ~16, stock actual 32 -> OPTIMO
    stock_actual: 32,
    stock_reservado: 0,
    ubicacion: 'Pasillo 1 - Botanas',
    ultimo_reabastecimiento: '2026-09-03',
    costo_almacenamiento_anual_pct: 0.20
  },
  {
    producto_id: 'PROD-019', // Sal La Fina: demanda ~2.5 u/dia, ROP ~5, stock actual 92 -> SOBREINVENTARIO (36+ días)
    stock_actual: 92,
    stock_reservado: 0,
    ubicacion: 'Pasillo 2 - Estante bajo',
    ultimo_reabastecimiento: '2026-07-20',
    costo_almacenamiento_anual_pct: 0.18
  },
  {
    producto_id: 'PROD-020', // Knorr Suiza: demanda ~7 u/dia, ROP ~12, stock actual 26 -> OPTIMO
    stock_actual: 26,
    stock_reservado: 0,
    ubicacion: 'Mostrador Condimentos',
    ultimo_reabastecimiento: '2026-09-02',
    costo_almacenamiento_anual_pct: 0.18
  }
];

// Generate consistent daily historical sales (90 days) for each product
function generarVentasHistoricas(productos: Producto[]): Record<string, VentaDiaria[]> {
  const ventas: Record<string, VentaDiaria[]> = {};

  // Base daily rates and variability signatures:
  const configs: Record<string, { base: number; weekend_boost: number; variance: number }> = {
    'PROD-001': { base: 26, weekend_boost: 8, variance: 3.5 }, // Leche Lala: X (muy estable)
    'PROD-002': { base: 17, weekend_boost: 6, variance: 2.8 }, // Huevo: X
    'PROD-003': { base: 11, weekend_boost: 4, variance: 2.0 }, // Arroz: X
    'PROD-004': { base: 9, weekend_boost: 3, variance: 1.8 }, // Frijol: X
    'PROD-005': { base: 14, weekend_boost: 4, variance: 2.5 }, // Aceite: X
    'PROD-006': { base: 42, weekend_boost: 16, variance: 6.2 }, // Coca 600: Y (moderado)
    'PROD-007': { base: 14, weekend_boost: 9, variance: 3.5 }, // Coca 2.5L: Y
    'PROD-008': { base: 21, weekend_boost: 5, variance: 3.0 }, // Pan Bimbo: X
    'PROD-009': { base: 13, weekend_boost: 3, variance: 2.2 }, // Azúcar: X
    'PROD-010': { base: 3.8, weekend_boost: 1.5, variance: 1.6 }, // Nescafé: Y (más variable)
    'PROD-011': { base: 10.5, weekend_boost: 2.5, variance: 2.2 }, // Atún: X
    'PROD-012': { base: 4.8, weekend_boost: 1.8, variance: 1.5 }, // Mayonesa: Y
    'PROD-013': { base: 12.5, weekend_boost: 3.5, variance: 2.4 }, // Maseca: X
    'PROD-014': { base: 7.6, weekend_boost: 2.0, variance: 1.6 }, // Espagueti: X
    'PROD-015': { base: 5.5, weekend_boost: 1.2, variance: 1.4 }, // Cloro: Y
    'PROD-016': { base: 4.8, weekend_boost: 1.0, variance: 1.3 }, // Jabón Zote: X
    'PROD-017': { base: 8.8, weekend_boost: 2.2, variance: 2.0 }, // Papel Regio: X
    'PROD-018': { base: 9.5, weekend_boost: 3.0, variance: 2.1 }, // Marías: Y
    'PROD-019': { base: 2.4, weekend_boost: 0.6, variance: 0.8 }, // Sal: X
    'PROD-020': { base: 6.8, weekend_boost: 1.5, variance: 1.4 }  // Knorr: X
  };

  const hoy = new Date('2026-09-07');

  for (const prod of productos) {
    const hist: VentaDiaria[] = [];
    const cfg = configs[prod.id] || { base: 5, weekend_boost: 1, variance: 1.2 };

    for (let d = 89; d >= 0; d--) {
      const fecha = new Date(hoy);
      fecha.setDate(hoy.getDate() - d);
      const diaSemana = fecha.getDay(); // 0 = Domingo, 6 = Sábado
      const esFinSemana = diaSemana === 0 || diaSemana === 6;

      // Deterministic pseudo-random based on date and product id for reproducible stats
      const seed = (d * 37 + prod.id.charCodeAt(5) * 19) % 100;
      const normalRand = (seed - 50) / 50; // -1 to +1

      let cant = cfg.base + (esFinSemana ? cfg.weekend_boost : 0) + normalRand * cfg.variance;
      cant = Math.max(0, Math.round(cant));

      hist.push({
        fecha: fecha.toISOString().split('T')[0],
        cantidad: cant
      });
    }
    ventas[prod.id] = hist;
  }

  return ventas;
}

// In-memory PostgreSQL database simulation class
export class PostgreSQLStore {
  private productos: Map<string, Producto> = new Map();
  private proveedores: Map<string, Proveedor> = new Map();
  private inventario: Map<string, InventarioItem> = new Map();
  private ventasHistoricas: Map<string, VentaDiaria[]> = new Map();

  constructor() {
    this.seed();
    this.cargarCambiosGuardados();
  }

  /** Aplica sobre los datos iniciales el stock guardado en disco (si existe). */
  private cargarCambiosGuardados(): void {
    const estado = leerEstado();
    if (!estado) return;
    let aplicados = 0;
    for (const [productoId, guardado] of Object.entries(estado.inventario)) {
      const item = this.inventario.get(productoId);
      if (item && typeof guardado.stock_actual === 'number') {
        item.stock_actual = Math.max(0, guardado.stock_actual);
        if (guardado.ultimo_reabastecimiento) item.ultimo_reabastecimiento = guardado.ultimo_reabastecimiento;
        aplicados++;
      }
    }
    if (aplicados > 0) console.log(`[INVENTIA] Stock restaurado desde disco para ${aplicados} productos.`);
  }

  private persistirInventario(): void {
    const inventario: Record<string, StockGuardado> = {};
    for (const [id, item] of this.inventario) {
      inventario[id] = { stock_actual: item.stock_actual, ultimo_reabastecimiento: item.ultimo_reabastecimiento };
    }
    guardarEstado({ inventario });
  }

  /** Vuelve a los datos iniciales de demostración y borra los cambios guardados. */
  public resetToInitial(): void {
    borrarEstado();
    this.seed();
  }

  public seed(): void {
    this.productos.clear();
    this.proveedores.clear();
    this.inventario.clear();
    this.ventasHistoricas.clear();

    for (const p of PRODUCTOS_INICIALES) {
      this.productos.set(p.id, { ...p });
    }
    for (const prov of PROVEEDORES_INICIALES) {
      this.proveedores.set(prov.id, { ...prov });
    }
    for (const inv of INVENTARIO_INICIAL) {
      this.inventario.set(inv.producto_id, { ...inv });
    }

    const ventas = generarVentasHistoricas(PRODUCTOS_INICIALES);
    for (const [prodId, hist] of Object.entries(ventas)) {
      this.ventasHistoricas.set(prodId, hist);
    }
  }

  // Query methods (mimicking SQL select)
  public selectProductos(): Producto[] {
    return Array.from(this.productos.values());
  }

  public selectProductoById(id: string): Producto | undefined {
    return this.productos.get(id);
  }

  public selectProductoBySkuOrName(query: string): Producto | undefined {
    const q = query.trim().toLowerCase();
    return Array.from(this.productos.values()).find(
      p => p.id.toLowerCase() === q ||
           p.sku.toLowerCase() === q ||
           p.nombre.toLowerCase().includes(q)
    );
  }

  public selectProveedores(): Proveedor[] {
    return Array.from(this.proveedores.values());
  }

  public selectProveedorById(id: string): Proveedor | undefined {
    return this.proveedores.get(id);
  }

  public selectInventario(): InventarioItem[] {
    return Array.from(this.inventario.values());
  }

  public selectInventarioByProductoId(productoId: string): InventarioItem | undefined {
    return this.inventario.get(productoId);
  }

  public selectVentasHistoricas(productoId: string, dias: number = 90): VentaDiaria[] {
    const all = this.ventasHistoricas.get(productoId) || [];
    return all.slice(-dias);
  }

  // Mutation methods (mimicking SQL update/insert)
  public updateStock(productoId: string, deltaStock: number): { success: boolean; nuevoStock?: number; error?: string } {
    const item = this.inventario.get(productoId);
    if (!item) return { success: false, error: `Producto ${productoId} no encontrado en inventario.` };

    const nuevoStock = Math.max(0, item.stock_actual + deltaStock);
    item.stock_actual = nuevoStock;
    if (deltaStock > 0) {
      item.ultimo_reabastecimiento = new Date().toISOString().split('T')[0];
    }
    this.persistirInventario();
    return { success: true, nuevoStock };
  }

  public setStock(productoId: string, stock: number): { success: boolean; nuevoStock?: number; error?: string } {
    const item = this.inventario.get(productoId);
    if (!item) return { success: false, error: `Producto ${productoId} no encontrado en inventario.` };

    item.stock_actual = Math.max(0, stock);
    this.persistirInventario();
    return { success: true, nuevoStock: item.stock_actual };
  }
}

// Global Singleton Database Instance
export const pgDb = new PostgreSQLStore();
