import React, { useState } from 'react';
import { PoliticaInventario, ClasificacionABCXYZ, CategoriaABC, CategoriaXYZ } from '../types/inventory';
import { Search, Filter, Layers, ArrowUpDown, Info } from 'lucide-react';

interface AbcXyzMatrixViewProps {
  policies: PoliticaInventario[];
  abcXyzSummary?: Record<ClasificacionABCXYZ, { count: number; productos: string[]; valor_total: number }>;
}

export const AbcXyzMatrixView: React.FC<AbcXyzMatrixViewProps> = ({
  policies,
  abcXyzSummary
}) => {
  const [selectedCell, setSelectedCell] = useState<ClasificacionABCXYZ | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAbc, setFilterAbc] = useState<string>('TODOS');
  const [filterXyz, setFilterXyz] = useState<string>('TODOS');

  const cellDescriptions: Record<ClasificacionABCXYZ, { name: string; strategy: string; bg: string; border: string; text: string }> = {
    AX: {
      name: 'AX - Estratégico Estable',
      strategy: 'Alta rotación y valor. Demanda predecible. Control diario estricto, entregas JIT y mínimo stock de seguridad.',
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-700/60',
      text: 'text-emerald-300'
    },
    AY: {
      name: 'AY - Estratégico Variable',
      strategy: 'Alto valor con fluctuaciones estacionales. Requiere stock de seguridad prudente y pronósticos continuos.',
      bg: 'bg-teal-950/40',
      border: 'border-teal-700/60',
      text: 'text-teal-300'
    },
    AZ: {
      name: 'AZ - Estratégico Errático',
      strategy: 'Alto valor con alta incertidumbre. Riesgo elevado de capital inmovilizado o desabasto. Pedidos sobre pedido.',
      bg: 'bg-amber-950/40',
      border: 'border-amber-700/60',
      text: 'text-amber-300'
    },
    BX: {
      name: 'BX - Táctico Estable',
      strategy: 'Valor medio y demanda regular. Gestión por Punto de Reorden (ROP) y Cantidad Económica de Pedido (EOQ).',
      bg: 'bg-blue-950/40',
      border: 'border-blue-700/60',
      text: 'text-blue-300'
    },
    BY: {
      name: 'BY - Táctico Variable',
      strategy: 'Valor intermedio con variabilidad moderada. Revisión periódica quincenal con amortiguador de seguridad.',
      bg: 'bg-indigo-950/40',
      border: 'border-indigo-700/60',
      text: 'text-indigo-300'
    },
    BZ: {
      name: 'BZ - Táctico Errático',
      strategy: 'Valor medio con demanda irregular. Evaluar si conviene mantener stock o surtir por encargo.',
      bg: 'bg-slate-900/60',
      border: 'border-slate-700/60',
      text: 'text-slate-300'
    },
    CX: {
      name: 'CX - Operativo Estable',
      strategy: 'Bajo valor y demanda constante. Pedidos en bultos grandes para reducir costos administrativos de pedido.',
      bg: 'bg-slate-900/40',
      border: 'border-slate-800',
      text: 'text-slate-400'
    },
    CY: {
      name: 'CY - Operativo Variable',
      strategy: 'Bajo valor con demanda variable. Control simplificado de dos recipientes (two-bin) o revisión mensual.',
      bg: 'bg-slate-900/40',
      border: 'border-slate-800',
      text: 'text-slate-400'
    },
    CZ: {
      name: 'CZ - Marginal Errático',
      strategy: 'Bajo valor y demanda errática. Candidato a eliminación de catálogo o stock mínimo simbólico.',
      bg: 'bg-slate-950/50',
      border: 'border-slate-800/80',
      text: 'text-slate-500'
    }
  };

  // Filter policies based on selections
  const filteredPolicies = policies.filter(p => {
    if (selectedCell && p.clasificacion_abc_xyz !== selectedCell) return false;
    if (filterAbc !== 'TODOS' && p.clasificacion_abc !== filterAbc) return false;
    if (filterXyz !== 'TODOS' && p.clasificacion_xyz !== filterXyz) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.nombre.toLowerCase().includes(q) || p.producto_id.toLowerCase().includes(q);
    }
    return true;
  });

  const matrixRows: CategoriaABC[] = ['A', 'B', 'C'];
  const matrixCols: CategoriaXYZ[] = ['X', 'Y', 'Z'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-10">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            Matriz de Segmentación ABC-XYZ & Políticas de Inventario
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Combina el impacto económico anual (Pareto ABC) con la predictibilidad de la demanda (CV Coeficiente de Variación).
          </p>
        </div>

        {selectedCell && (
          <button
            onClick={() => setSelectedCell(null)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium self-start sm:self-auto transition-colors"
          >
            Quitar filtro de celda [{selectedCell}]
          </button>
        )}
      </div>

      {/* 3x3 Visual Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* The Matrix */}
        <div className="lg:col-span-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 text-xs font-semibold text-slate-400">
            <span>Matriz 9 Cuadrantes (Haz clic en un cuadrante para filtrar)</span>
            <span className="text-[11px] font-mono text-emerald-400">Eje Y: Valor Económico | Eje X: Variabilidad Demanda</span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              {/* Column Headers */}
              <div className="grid grid-cols-4 gap-2 mb-2 text-center text-xs font-bold">
                <div className="p-2 text-slate-500 font-mono">ABC \ XYZ</div>
                <div className="p-2 rounded-lg bg-slate-800/60 text-slate-300">
                  X (Estable, CV ≤ 0.15)
                </div>
                <div className="p-2 rounded-lg bg-slate-800/60 text-slate-300">
                  Y (Variable, CV ≤ 0.28)
                </div>
                <div className="p-2 rounded-lg bg-slate-800/60 text-slate-300">
                  Z (Errática, CV &gt; 0.28)
                </div>
              </div>

              {/* Rows */}
              {matrixRows.map(row => (
                <div key={row} className="grid grid-cols-4 gap-2 mb-2">
                  {/* Row Header */}
                  <div className="p-3 rounded-xl bg-slate-800/60 flex flex-col justify-center items-center text-center">
                    <span className="text-base font-extrabold text-white">Clase {row}</span>
                    <span className="text-[10px] text-slate-400">
                      {row === 'A' ? 'Alto Valor (80%)' : row === 'B' ? 'Medio Valor (15%)' : 'Bajo Valor (5%)'}
                    </span>
                  </div>

                  {/* 3 Cells for this row */}
                  {matrixCols.map(col => {
                    const cellKey = `${row}${col}` as ClasificacionABCXYZ;
                    const cellData = abcXyzSummary?.[cellKey] || { count: 0, productos: [], valor_total: 0 };
                    const desc = cellDescriptions[cellKey];
                    const isSelected = selectedCell === cellKey;

                    return (
                      <button
                        key={cellKey}
                        onClick={() => setSelectedCell(isSelected ? null : cellKey)}
                        className={`p-3 rounded-xl border text-left transition-all ${desc.bg} ${
                          isSelected
                            ? 'ring-2 ring-emerald-400 border-emerald-400 scale-[1.02] shadow-lg'
                            : `${desc.border} hover:border-slate-500`
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-black tracking-tight ${desc.text}`}>
                            {cellKey}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-slate-900/80 text-white border border-slate-700">
                            {cellData.count} SKUs
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 truncate">
                          ${cellData.valor_total.toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP/año
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-tight">
                          {desc.strategy}
                        </p>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Cell Detail Panel */}
        <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-400" />
              <span>Estrategia de Gestión</span>
            </div>

            {selectedCell ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <h3 className="font-extrabold text-sm text-emerald-400">
                    {cellDescriptions[selectedCell].name}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                    {cellDescriptions[selectedCell].strategy}
                  </p>
                </div>

                <div className="text-xs space-y-1.5 text-slate-300">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">SKUs clasificados:</span>
                    <strong className="text-white">{abcXyzSummary?.[selectedCell]?.count || 0}</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Consumo anual:</span>
                    <strong className="text-emerald-400 font-mono">
                      ${abcXyzSummary?.[selectedCell]?.valor_total.toLocaleString('es-CO', { maximumFractionDigits: 0 }) || 0} COP
                    </strong>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] text-slate-400 block mb-1 font-medium">Productos en esta celda:</span>
                  <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto">
                    {abcXyzSummary?.[selectedCell]?.productos.map((prod, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[10px]">
                        {prod}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 space-y-2 mt-4 text-center py-8">
                <p>Haz clic en cualquier cuadrante para inspeccionar su política y ver sus productos filtrados.</p>
                <div className="text-[11px] text-slate-500">
                  Abarrotes: <span className="text-emerald-400">AX/AY</span> merecen el 80% de tu tiempo de compras.
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            <strong>Fórmulas activas:</strong>
            <div className="font-mono text-[10px] text-slate-500 mt-1 space-y-0.5">
              <div>• ROP = (d̄ × L) + SS</div>
              <div>• SS = Z × √(L·σ_d² + d̄²·σ_L²)</div>
              <div>• EOQ = √(2·D·S / H)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Policies Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-sm text-white">Parámetros Matemáticos por Producto</h3>
            <span className="text-xs text-slate-400 font-mono">({filteredPolicies.length} productos)</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar producto o SKU..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-48 sm:w-60"
              />
            </div>

            {/* ABC Filter */}
            <select
              value={filterAbc}
              onChange={e => setFilterAbc(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="TODOS">ABC: Todos</option>
              <option value="A">Clase A</option>
              <option value="B">Clase B</option>
              <option value="C">Clase C</option>
            </select>

            {/* XYZ Filter */}
            <select
              value={filterXyz}
              onChange={e => setFilterXyz(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="TODOS">XYZ: Todos</option>
              <option value="X">Clase X</option>
              <option value="Y">Clase Y</option>
              <option value="Z">Clase Z</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-2 text-center">Clasif.</th>
                <th className="py-3 px-2 text-right">Costo Unit.</th>
                <th className="py-3 px-2 text-right">Demanda (d̄)</th>
                <th className="py-3 px-2 text-right">CV</th>
                <th className="py-3 px-2 text-right">Stock Seg. (SS)</th>
                <th className="py-3 px-2 text-right font-bold text-amber-400">Punto Reorden (ROP)</th>
                <th className="py-3 px-2 text-right font-bold text-emerald-400">EOQ (Lote)</th>
                <th className="py-3 px-2 text-right">Stock Máx</th>
                <th className="py-3 px-2 text-right font-bold text-white">Stock Actual</th>
                <th className="py-3 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredPolicies.map(p => {
                const esBajoRop = p.stock_actual <= p.punto_reorden;
                const esCritico = p.stock_actual <= p.punto_reorden * 0.55 || p.dias_inventario_disponible <= p.plazo_entrega_dias;
                const esSobreinv = p.stock_actual > p.stock_maximo * 1.15 || p.dias_inventario_disponible > 45;

                return (
                  <tr key={p.producto_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-100">
                      <div>{p.nombre}</div>
                      <span className="text-[10px] font-mono text-slate-500">{p.producto_id}</span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                          p.clasificacion_abc === 'A'
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : p.clasificacion_abc === 'B'
                            ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {p.clasificacion_abc_xyz}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right font-mono">${p.costo_unitario.toLocaleString('es-CO')}</td>
                    <td className="py-3 px-2 text-right font-mono">{p.demanda_diaria_promedio} u./d</td>
                    <td className="py-3 px-2 text-right font-mono text-slate-400">{p.cv.toFixed(2)}</td>
                    <td className="py-3 px-2 text-right font-mono text-slate-300">{p.stock_seguridad} u.</td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-amber-400">{p.punto_reorden} u.</td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-emerald-400">{p.eoq} u.</td>
                    <td className="py-3 px-2 text-right font-mono text-slate-400">{p.stock_maximo} u.</td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-white text-sm">{p.stock_actual} u.</td>
                    <td className="py-3 px-4 text-center">
                      {esCritico ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          🚨 Agotamiento
                        </span>
                      ) : esBajoRop ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          ⚠️ Comprar (≤ ROP)
                        </span>
                      ) : esSobreinv ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          📦 Sobreinventario
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          ✓ Óptimo ({p.dias_inventario_disponible} d)
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
