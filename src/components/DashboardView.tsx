import React from 'react';
import {
  DollarSign,
  AlertTriangle,
  ShoppingCart,
  ShieldCheck,
  Package,
  Layers,
  Bot,
  RefreshCw,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { DashboardKPIs, HistorialKpiItem, PronosticoSemanalResponse } from '../types/inventory';
import { KpiEvolutionChart } from './KpiEvolutionChart';
import { WeeklyDemandForecast } from './WeeklyDemandForecast';

interface DashboardViewProps {
  kpis: DashboardKPIs | null;
  kpiHistory: HistorialKpiItem[];
  forecastData: PronosticoSemanalResponse | null;
  onScenarioChange: (factor: number) => void;
  onNavigateTab: (tab: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  targetServiceLevel?: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  kpis,
  kpiHistory,
  forecastData,
  onScenarioChange,
  onNavigateTab,
  onRefresh,
  isLoading,
  targetServiceLevel = 95
}) => {
  return (
    <div id="dashboard-view-main" className="space-y-6 pb-8">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Dashboard de Inventarios y KPIs Operativos
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Abarrotes Don Pepe
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Monitoreo en tiempo real de capital de trabajo, nivel de servicio y abastecimiento con modelos ROP y ABC-XYZ.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            id="dashboard-refresh-btn"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Actualizar</span>
          </button>

          <button
            id="dashboard-ask-agent-btn"
            onClick={() => onNavigateTab('chat')}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-900/30 transition-colors"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Consultar con INVENTIA</span>
          </button>
        </div>
      </div>

      {/* Top Level Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Inventory Value */}
        <div id="kpi-card-valor-inventario" className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Valor Total en Inventario</span>
            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-white font-mono tracking-tight">
              ${kpis?.valor_inventario_total?.toLocaleString('es-CO', { maximumFractionDigits: 0 }) || '0'}
            </span>
            <span className="text-xs text-sky-400 font-mono ml-1 font-bold">COP</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center">
            <Package className="w-3.5 h-3.5 mr-1 text-slate-400" />
            {kpis?.total_skus || 0} SKUs activos en PostgreSQL
          </p>
        </div>

        {/* KPI 2: Service Level (Target vs Effective) */}
        <div id="kpi-card-nivel-servicio" className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Nivel de Servicio Objetivo</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
              {targetServiceLevel}%
            </span>
            <span className="text-xs text-slate-400 font-mono">
              (Z = 1.645)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center">
            <TrendingUp className="w-3.5 h-3.5 mr-1 text-emerald-400" />
            Protege contra variabilidad de demanda
          </p>
        </div>

        {/* KPI 3: SKUs Bajo ROP & Critical Risks */}
        <div
          id="kpi-card-alertas-rop"
          onClick={() => onNavigateTab('risks')}
          className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-rose-500/40 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Alertas de Abastecimiento</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-rose-400 font-mono tracking-tight">
              {kpis?.skus_riesgo_agotamiento || 0}
            </span>
            <span className="text-xs text-slate-400">quiebres críticos</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center group-hover:text-slate-300">
            <span className="text-amber-400 font-medium mr-1">{kpis?.skus_bajo_rop || 0}</span> bajo Punto de Reorden (ROP)
            <ArrowRight className="w-3 h-3 ml-auto text-slate-400 group-hover:text-rose-400" />
          </p>
        </div>

        {/* KPI 4: Suggested Purchase Budget */}
        <div
          id="kpi-card-presupuesto-compra"
          onClick={() => onNavigateTab('recommendations')}
          className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-emerald-500/40 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Presupuesto Sugerido (EOQ)</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
              ${kpis?.monto_sugerido_compras?.toLocaleString('es-CO', { maximumFractionDigits: 0 }) || '0'}
            </span>
            <span className="text-xs text-emerald-400 font-mono ml-1 font-bold">COP</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center group-hover:text-slate-300">
            Reabastecimiento prioritario sugerido
            <ArrowRight className="w-3 h-3 ml-auto text-slate-400 group-hover:text-emerald-400" />
          </p>
        </div>
      </div>

      {/* Historical Evolution of Inventory KPIs (Service Level vs Inventory Value) */}
      <KpiEvolutionChart
        data={kpiHistory}
        isLoading={isLoading}
        targetServiceLevel={targetServiceLevel}
      />

      {/* CORE REQUEST: Weekly Demand Projection & Major Purchases Anticipation */}
      <WeeklyDemandForecast
        forecastData={forecastData}
        isLoading={isLoading}
        onScenarioChange={onScenarioChange}
        onNavigateTab={onNavigateTab}
      />

      {/* Secondary Strategic Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pareto ABC Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-bold text-white">Concentración Pareto ABC</h4>
            </div>
            <button
              onClick={() => onNavigateTab('matrix')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center"
            >
              Ver matriz <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>

          <p className="text-xs text-slate-400 mb-3">
            Participación económica en ventas anuales según regla de Pareto 80/15/5:
          </p>

          <div className="space-y-2.5 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span><strong className="text-emerald-400">Clase A:</strong> Alto Valor ({kpis?.distribucion_abc?.A?.count || 5} SKUs)</span>
                <span className="font-mono font-bold text-emerald-400">{kpis?.distribucion_abc?.A?.valor_pct || 77.9}% del valor</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${kpis?.distribucion_abc?.A?.valor_pct || 77.9}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span><strong className="text-sky-400">Clase B:</strong> Valor Medio ({kpis?.distribucion_abc?.B?.count || 6} SKUs)</span>
                <span className="font-mono font-bold text-sky-400">{kpis?.distribucion_abc?.B?.valor_pct || 16.4}% del valor</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-sky-500 rounded-full" style={{ width: `${kpis?.distribucion_abc?.B?.valor_pct || 16.4}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span><strong className="text-slate-400">Clase C:</strong> Baja Rotación ({kpis?.distribucion_abc?.C?.count || 9} SKUs)</span>
                <span className="font-mono font-bold text-slate-400">{kpis?.distribucion_abc?.C?.valor_pct || 5.7}% del valor</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-slate-600 rounded-full" style={{ width: `${kpis?.distribucion_abc?.C?.valor_pct || 5.7}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Variabilidad XYZ */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <h4 className="text-sm font-bold text-white">Estabilidad de Demanda (XYZ)</h4>
            </div>
            <span className="text-[11px] font-mono text-slate-400">CV = σ / μ</span>
          </div>

          <p className="text-xs text-slate-400 mb-3">
            Comportamiento y predictibilidad del consumo diario:
          </p>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Clase X</div>
              <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">
                {kpis?.distribucion_xyz?.X || 12}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Estable (CV&lt;0.15)</div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Clase Y</div>
              <div className="text-lg font-black text-amber-400 font-mono mt-0.5">
                {kpis?.distribucion_xyz?.Y || 8}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Moderada</div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Clase Z</div>
              <div className="text-lg font-black text-rose-400 font-mono mt-0.5">
                {kpis?.distribucion_xyz?.Z || 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Errática</div>
            </div>
          </div>

          <div className="mt-3 p-2 rounded bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300">
            <strong className="text-emerald-400">Recomendación:</strong> 12 productos tienen demanda constante, permitiendo aplicar modelos de reabastecimiento continuo sin exceso de inventario de seguridad.
          </div>
        </div>

        {/* Quick Action Decision Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Bot className="w-4 h-4" />
              <span>Decisión Asistida INVENTIA</span>
            </div>
            <h4 className="text-base font-bold text-white">¿Qué comprar hoy?</h4>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              El agente ha identificado que los ítems <strong className="text-white">Leche Lala/Colanta</strong>, <strong className="text-white">Huevo San Juan</strong> y <strong className="text-white">Aceite 1-2-3</strong> están por debajo de su punto de reorden con plazos de entrega que comprometen las ventas de esta semana.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-mono">
              Inversión: <strong className="text-emerald-400">${kpis?.monto_sugerido_compras?.toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP</strong>
            </span>
            <button
              onClick={() => onNavigateTab('recommendations')}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors flex items-center space-x-1"
            >
              <span>Ejecutar Compras</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
