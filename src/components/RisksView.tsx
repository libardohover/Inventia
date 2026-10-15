import React from 'react';
import { AnalisisRiesgoItem } from '../types/inventory';
import { AlertTriangle, AlertOctagon, TrendingDown, ArrowUpRight, ShieldAlert, PackageCheck, Ban } from 'lucide-react';

interface RisksViewProps {
  risksData: {
    criticos_agotamiento: AnalisisRiesgoItem[];
    bajo_stock_rop: AnalisisRiesgoItem[];
    sobreinventario: AnalisisRiesgoItem[];
    resumen: {
      agotamiento_count: number;
      sobreinventario_count: number;
      baja_rotacion_count: number;
    };
  } | null;
  onRestock: (productoId: string, cantidad: number, nombre: string) => void;
  isLoading: boolean;
}

export const RisksView: React.FC<RisksViewProps> = ({
  risksData,
  onRestock,
  isLoading
}) => {
  if (!risksData) {
    return (
      <div className="text-center py-12 text-slate-400">
        Cargando matriz de riesgos de inventario...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-10">
      {/* Overview Banner */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          Monitor Diagnóstico de Riesgos de Inventario
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Detecta automáticamente desbalances operativos: roturas de stock inminentes por tiempo de reabastecimiento vs. capital inmovilizado en sobreinventario.
        </p>
      </div>

      {/* 3 Critical Risk Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Riesgo Crítico de Agotamiento */}
        <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Riesgo Crítico de Agotamiento</h3>
                <span className="text-[11px] text-rose-400 font-medium">
                  Cobertura ≤ Plazo de entrega o Stock ≤ 55% ROP
                </span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono font-bold text-xs">
              {risksData.criticos_agotamiento.length} SKUs
            </span>
          </div>

          <div className="space-y-3">
            {risksData.criticos_agotamiento.map(item => (
              <div
                key={item.producto_id}
                className="p-3.5 rounded-xl bg-slate-950 border border-rose-500/30 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{item.nombre}</span>
                  <span className="text-xs font-mono font-bold text-rose-400">
                    {item.stock_actual} u. / ROP {item.punto_reorden} u.
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs py-1 text-slate-300">
                  <div className="bg-slate-900 p-1.5 rounded text-center">
                    <span className="text-[10px] text-slate-400 block">Días Cobertura</span>
                    <strong className="text-rose-400">{item.dias_disponibles} días</strong>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded text-center">
                    <span className="text-[10px] text-slate-400 block">Plazo Proveedor</span>
                    <strong>{item.plazo_entrega_dias} días</strong>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded text-center">
                    <span className="text-[10px] text-slate-400 block">Stock Seguridad</span>
                    <strong>{item.stock_seguridad} u.</strong>
                  </div>
                </div>

                <p className="text-xs text-rose-300/90 leading-relaxed">
                  {item.mensaje_riesgo}
                </p>

                <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-400">
                    Acción: {item.accion_inmediata}
                  </span>
                  <button
                    onClick={() => onRestock(item.producto_id, item.punto_reorden * 2, item.nombre)}
                    disabled={isLoading}
                    className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all"
                  >
                    Emitir Pedido Urgente
                  </button>
                </div>
              </div>
            ))}

            {risksData.criticos_agotamiento.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-400 bg-slate-950/50 rounded-xl">
                ✓ No hay productos en riesgo crítico de agotamiento.
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Sobreinventario y Capital Congelado */}
        <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Sobreinventario y Capital Inmovilizado</h3>
                <span className="text-[11px] text-purple-400 font-medium">
                  Existencias &gt; Stock Máximo o Cobertura &gt; 45 días
                </span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold text-xs">
              {risksData.sobreinventario.length} SKUs
            </span>
          </div>

          <div className="space-y-3">
            {risksData.sobreinventario.map(item => (
              <div
                key={item.producto_id}
                className="p-3.5 rounded-xl bg-slate-950 border border-purple-500/30 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{item.nombre}</span>
                  <span className="text-xs font-mono font-bold text-purple-400">
                    Stock {item.stock_actual} u. / Máx {item.stock_maximo} u.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-1 text-slate-300">
                  <div className="bg-slate-900 p-1.5 rounded text-center">
                    <span className="text-[10px] text-slate-400 block">Días de Inventario</span>
                    <strong className="text-purple-400">{item.dias_disponibles} días</strong>
                  </div>
                  <div className="bg-slate-900 p-1.5 rounded text-center">
                    <span className="text-[10px] text-slate-400 block">Punto Reorden</span>
                    <strong>{item.punto_reorden} u.</strong>
                  </div>
                </div>

                <p className="text-xs text-purple-300/90 leading-relaxed">
                  {item.mensaje_riesgo}
                </p>

                <div className="pt-2 border-t border-slate-900 text-xs text-slate-300">
                  <strong className="text-slate-100">Estrategia recomendada:</strong> {item.accion_inmediata}
                </div>
              </div>
            ))}

            {risksData.sobreinventario.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-400 bg-slate-950/50 rounded-xl">
                ✓ No se detecta sobreinventario perjudicial.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Productos en Punto de Reorden (Alerta Amarilla) */}
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">
              Productos Bajo Punto de Reorden (ROP) - Alerta Preventiva ({risksData.bajo_stock_rop.length} SKUs)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Deben programarse en la orden regular de esta semana
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {risksData.bajo_stock_rop.map(item => (
            <div key={item.producto_id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
              <div className="font-bold text-slate-200">{item.nombre}</div>
              <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                <span>Stock: <strong className="text-amber-400">{item.stock_actual} u.</strong></span>
                <span>ROP: {item.punto_reorden} u.</span>
                <span>Plazo: {item.plazo_entrega_dias}d</span>
              </div>
              <p className="text-[11px] text-slate-400">{item.mensaje_riesgo}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
