import React, { useState } from 'react';
import { RecomendacionCompra } from '../types/inventory';
import { ShoppingCart, AlertCircle, CheckCircle, PackagePlus, DollarSign, Clock, FileText, ArrowRight, Truck } from 'lucide-react';

interface RecommendationsViewProps {
  recommendations: RecomendacionCompra[];
  onRestock: (productoId: string, cantidad: number, nombre: string) => void;
  onSimulateSale: (productoId: string, cantidad: number, nombre: string) => void;
  isLoading: boolean;
}

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  recommendations,
  onRestock,
  onSimulateSale,
  isLoading
}) => {
  const [filterPriority, setFilterPriority] = useState<string>('TODAS');
  const [filterSupplier, setFilterSupplier] = useState<string>('TODOS');

  // Supplier list for filter
  const suppliers = Array.from(new Set(recommendations.map(r => r.proveedor_nombre)));

  const filtered = recommendations.filter(r => {
    if (filterPriority === 'COMPRA_REQUERIDA' && r.prioridad === 'NO_REQUERIDA') return false;
    if (filterPriority !== 'TODAS' && filterPriority !== 'COMPRA_REQUERIDA' && r.prioridad !== filterPriority) return false;
    if (filterSupplier !== 'TODOS' && r.proveedor_nombre !== filterSupplier) return false;
    return true;
  });

  const urgentes = recommendations.filter(r => r.prioridad === 'URGENTE_ALTA');
  const medias = recommendations.filter(r => r.prioridad === 'MEDIA');
  const totalInversion = recommendations
    .filter(r => r.prioridad === 'URGENTE_ALTA' || r.prioridad === 'MEDIA')
    .reduce((sum, r) => sum + r.costo_estimado_compra, 0);

  const totalUnidades = recommendations
    .filter(r => r.prioridad === 'URGENTE_ALTA' || r.prioridad === 'MEDIA')
    .reduce((sum, r) => sum + r.cantidad_recomendada, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-10">
      {/* Top Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Inversión Sugerida</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-black text-white font-mono">
              ${totalInversion.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
            </span>
            <span className="ml-1.5 text-xs text-slate-400 font-bold">COP</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Calculado por lotes económicos (EOQ)</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Compras Críticas (Hoy)</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-black text-rose-400 font-mono">
              {urgentes.length}
            </span>
            <span className="ml-1.5 text-xs text-slate-400">productos</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Riesgo inminente o stock ≤ 50% ROP</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Compras Regulares (ROP)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-black text-amber-400 font-mono">
              {medias.length}
            </span>
            <span className="ml-1.5 text-xs text-slate-400">productos</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Alcanzaron Punto de Reorden</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase">Unidades a Surtir</span>
            <PackagePlus className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2 flex items-baseline">
            <span className="text-2xl font-black text-teal-400 font-mono">
              {totalUnidades}
            </span>
            <span className="ml-1.5 text-xs text-slate-400">piezas</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Ajustado al múltiplo de lote mínimo</p>
        </div>
      </div>

      {/* Decision Engine Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-emerald-400" />
            Decisiones de Abastecimiento (QUÉ + CUÁNTO + CUÁNDO + POR QUÉ)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Priorizado por regla: <em>Riesgo Agotamiento → Stock ≤ ROP → Importancia Económica (A) → Plazo Proveedor</em>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="TODAS">Prioridad: Todas</option>
            <option value="COMPRA_REQUERIDA">Requieren Compra (Urgente + Media)</option>
            <option value="URGENTE_ALTA">🚨 Urgente Alta (Hoy)</option>
            <option value="MEDIA">⚠️ Media (48 hrs)</option>
            <option value="NO_REQUERIDA">✓ No requerida (Óptimo)</option>
          </select>

          <select
            value={filterSupplier}
            onChange={e => setFilterSupplier(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 max-w-[200px] truncate"
          >
            <option value="TODOS">Todos los Proveedores</option>
            {suppliers.map((s, idx) => (
              <option key={idx} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      <div className="space-y-4">
        {filtered.map((recom) => {
          const esUrgente = recom.prioridad === 'URGENTE_ALTA';
          const esMedia = recom.prioridad === 'MEDIA';
          const esNoReq = recom.prioridad === 'NO_REQUERIDA';

          return (
            <div
              key={recom.producto_id}
              className={`p-5 rounded-2xl border transition-all ${
                esUrgente
                  ? 'bg-slate-900/95 border-rose-500/40 shadow-md shadow-rose-950/20'
                  : esMedia
                  ? 'bg-slate-900/90 border-amber-500/30'
                  : 'bg-slate-900/50 border-slate-800/80 opacity-75 hover:opacity-100'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Product & Priority Title */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      {recom.producto_nombre}
                    </h3>
                    <span className="font-mono text-xs text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                      {recom.sku}
                    </span>
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      {recom.clasificacion}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        esUrgente
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : esMedia
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {recom.prioridad}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-slate-500" />
                      Proveedor: <strong className="text-slate-200">{recom.proveedor_nombre}</strong>
                    </span>
                    <span>•</span>
                    <span>Plazo entrega: <strong className="text-slate-200">{recom.plazo_entrega_dias} días</strong></span>
                    <span>•</span>
                    <span>Momento sugerido: <strong className={esUrgente ? 'text-rose-400' : 'text-slate-200'}>{recom.momento_compra}</strong></span>
                  </div>
                </div>

                {/* Quantitative Decision Metric Blocks */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">Stock Actual</span>
                    <span className={`text-base font-extrabold font-mono ${esUrgente ? 'text-rose-400' : 'text-white'}`}>
                      {recom.stock_actual} u.
                    </span>
                  </div>

                  <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">Punto Reorden</span>
                    <span className="text-base font-extrabold font-mono text-amber-400">
                      {recom.punto_reorden} u.
                    </span>
                  </div>

                  <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">Sugerido (EOQ)</span>
                    <span className="text-base font-extrabold font-mono text-emerald-400">
                      {recom.cantidad_recomendada} u.
                    </span>
                  </div>

                  <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block uppercase">Costo Estimado</span>
                    <span className="text-base font-extrabold font-mono text-white">
                      ${recom.costo_estimado_compra.toLocaleString('es-CO', { maximumFractionDigits: 0 })} <span className="text-[10px] text-slate-400 font-normal">COP</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Explicability (¿Qué ocurre? → ¿Por qué ocurre? → ¿Qué acción recomiendo?) */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex items-start space-x-2">
                  <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold shrink-0 mt-0.5">
                    ¿QUÉ OCURRE?
                  </span>
                  <p className="text-slate-300">{recom.justificacion.que_ocurre}</p>
                </div>

                <div className="flex items-start space-x-2">
                  <span className="px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 font-mono text-[10px] font-bold shrink-0 mt-0.5">
                    ¿POR QUÉ OCURRE?
                  </span>
                  <p className="text-slate-300">{recom.justificacion.por_que_ocurre}</p>
                </div>

                <div className="flex items-start space-x-2">
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold shrink-0 mt-0.5">
                    ¿QUÉ ACCIÓN RECOMIENDO?
                  </span>
                  <p className="text-emerald-300 font-medium">{recom.justificacion.que_accion_recomiendo}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <span>Demanda pronosticada: <strong>{recom.demanda_diaria_promedio} u./día</strong></span>
                  <span>•</span>
                  <span>Stock Seguridad: <strong>{recom.stock_seguridad} u.</strong></span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Simulate Sale to drop stock */}
                  <button
                    onClick={() => onSimulateSale(recom.producto_id, 10, recom.producto_nombre)}
                    disabled={isLoading}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                    title="Simular una venta de 10 unidades para ver cómo reacciona INVENTIA"
                  >
                    -10 Venta
                  </button>

                  {/* Restock Button */}
                  {recom.cantidad_recomendada > 0 ? (
                    <button
                      onClick={() => onRestock(recom.producto_id, recom.cantidad_recomendada, recom.producto_nombre)}
                      disabled={isLoading}
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950/40"
                    >
                      <PackagePlus className="w-3.5 h-3.5" />
                      <span>Reabastecer (+{recom.cantidad_recomendada} u.)</span>
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Stock Suficiente
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 bg-slate-900 rounded-2xl border border-slate-800 text-slate-400">
            <p className="text-sm">No se encontraron recomendaciones con los filtros seleccionados.</p>
          </div>
        )}
      </div>
    </div>
  );
};
