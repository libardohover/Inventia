import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, ShieldCheck, Calendar, Info, Eye } from 'lucide-react';
import { HistorialKpiItem } from '../types/inventory';

interface KpiEvolutionChartProps {
  data: HistorialKpiItem[];
  isLoading?: boolean;
  targetServiceLevel?: number;
}

export const KpiEvolutionChart: React.FC<KpiEvolutionChartProps> = ({
  data,
  isLoading = false,
  targetServiceLevel = 95
}) => {
  const [activeMetric, setActiveMetric] = useState<'both' | 'service' | 'inventory'>('both');
  const [showTable, setShowTable] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[360px] animate-pulse">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mb-3" />
        <p className="text-sm text-slate-400">Cargando evolución histórica de KPIs (7 días)...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center text-slate-400">
        No hay datos históricos disponibles para el periodo de 7 días.
      </div>
    );
  }

  // Calculate summary metrics for the 7-day window
  const latestItem = data[data.length - 1];
  const firstItem = data[0];
  const avgServiceLevel = (data.reduce((sum, d) => sum + d.nivel_servicio_pct, 0) / data.length).toFixed(1);
  const avgInventory = Math.round(data.reduce((sum, d) => sum + d.valor_inventario_cop, 0) / data.length);
  const deltaInventory = latestItem.valor_inventario_cop - firstItem.valor_inventario_cop;
  const deltaService = (latestItem.nivel_servicio_pct - firstItem.nivel_servicio_pct).toFixed(1);

  // Custom tooltip for dual-axis values
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item: HistorialKpiItem = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700 rounded-lg p-3.5 shadow-xl text-xs backdrop-blur-md min-w-[240px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400">
            <span className="font-semibold text-slate-200">
              {item.diaSemana}, {item.fechaCorta}
            </span>
            <span className="text-[11px] font-mono text-slate-400">{item.fecha}</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-slate-300">Nivel de Servicio:</span>
              </div>
              <span className="font-bold font-mono text-emerald-400 text-sm">
                {item.nivel_servicio_pct}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span className="text-slate-300">Valor Inventario:</span>
              </div>
              <span className="font-bold font-mono text-sky-300 text-sm">
                ${item.valor_inventario_cop.toLocaleString('es-CO')} COP
              </span>
            </div>

            {item.ventas_dia_cop > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                <span className="text-slate-400">Ventas Registradas:</span>
                <span className="font-mono text-slate-200">
                  ${item.ventas_dia_cop.toLocaleString('es-CO')} COP
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">SKUs Bajo ROP:</span>
              <span className={`font-mono font-semibold ${item.skus_bajo_rop > 3 ? 'text-amber-400' : 'text-slate-300'}`}>
                {item.skus_bajo_rop} productos
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="kpi-evolution-chart-container" className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-md">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Evolución Histórica de KPIs (Últimos 7 Días)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Relación estocástica entre el <span className="text-emerald-400 font-medium">Nivel de Servicio (%)</span> y el <span className="text-sky-400 font-medium">Valor de Inventario ($ COP)</span>.
          </p>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center space-x-2">
          <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs">
            <button
              id="kpi-toggle-both"
              onClick={() => setActiveMetric('both')}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                activeMetric === 'both' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ambos
            </button>
            <button
              id="kpi-toggle-service"
              onClick={() => setActiveMetric('service')}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                activeMetric === 'service' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Nivel Servicio
            </button>
            <button
              id="kpi-toggle-inventory"
              onClick={() => setActiveMetric('inventory')}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                activeMetric === 'inventory' ? 'bg-sky-500/20 text-sky-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Valor Inventario
            </button>
          </div>

          <button
            id="kpi-toggle-table-btn"
            onClick={() => setShowTable(!showTable)}
            className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center space-x-1 ${
              showTable
                ? 'bg-slate-800 border-slate-700 text-emerald-400'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Alternar vista de tabla con datos detallados"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tabla</span>
          </button>
        </div>
      </div>

      {/* Mini KPI Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Nivel Servicio Actual</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline space-x-1.5">
            <span className="text-lg sm:text-xl font-extrabold text-emerald-400 font-mono">
              {latestItem.nivel_servicio_pct}%
            </span>
            <span className="text-[11px] text-slate-400">
              (Obj: {targetServiceLevel}%)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-1">
            {Number(deltaService) >= 0 ? (
              <span className="text-emerald-400 flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" />+{deltaService}% vs día 1
              </span>
            ) : (
              <span className="text-rose-400 flex items-center">
                <TrendingDown className="w-3 h-3 mr-0.5" />{deltaService}% vs día 1
              </span>
            )}
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Valor Inventario Actual</span>
            <DollarSign className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="mt-1">
            <span className="text-lg sm:text-xl font-extrabold text-sky-300 font-mono">
              ${(latestItem.valor_inventario_cop / 1000000).toFixed(2)}M
            </span>
            <span className="text-[11px] text-slate-400 ml-1 font-mono">COP</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {deltaInventory >= 0 ? (
              <span className="text-sky-400">+${(deltaInventory / 1000000).toFixed(2)}M en semana</span>
            ) : (
              <span className="text-amber-400">-${(Math.abs(deltaInventory) / 1000000).toFixed(2)}M (consumo)</span>
            )}
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
          <div className="text-slate-400 text-xs">Promedio Semanal (NS)</div>
          <div className="mt-1">
            <span className="text-lg sm:text-xl font-extrabold text-white font-mono">
              {avgServiceLevel}%
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Estabilidad en 7 días
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
          <div className="text-slate-400 text-xs">Inventario Promedio</div>
          <div className="mt-1">
            <span className="text-lg sm:text-xl font-extrabold text-white font-mono">
              ${(avgInventory / 1000000).toFixed(2)}M
            </span>
            <span className="text-[11px] text-slate-400 ml-1 font-mono">COP</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Capital de trabajo medio
          </div>
        </div>
      </div>

      {/* Main Recharts Line Chart */}
      <div className="h-72 sm:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
            <XAxis
              dataKey="fechaCorta"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#475569' }}
            />

            {/* Left Axis: Nivel de Servicio (%) */}
            {(activeMetric === 'both' || activeMetric === 'service') && (
              <YAxis
                yAxisId="left"
                orientation="left"
                domain={[90, 100]}
                stroke="#10b981"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#059669' }}
                tickFormatter={(val) => `${val}%`}
              />
            )}

            {/* Right Axis: Valor de Inventario ($ COP) */}
            {(activeMetric === 'both' || activeMetric === 'inventory') && (
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={['auto', 'auto']}
                stroke="#38bdf8"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#0284c7' }}
                tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`}
              />
            )}

            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }}
              formatter={(value) => <span className="text-slate-300 font-medium">{value}</span>}
            />

            {/* Target Service Level Reference Line */}
            {(activeMetric === 'both' || activeMetric === 'service') && (
              <ReferenceLine
                yAxisId="left"
                y={targetServiceLevel}
                stroke="#059669"
                strokeDasharray="4 4"
                label={{
                  value: `Meta NS: ${targetServiceLevel}%`,
                  fill: '#34d399',
                  fontSize: 10,
                  position: 'insideTopRight'
                }}
              />
            )}

            {/* Line: Nivel de Servicio */}
            {(activeMetric === 'both' || activeMetric === 'service') && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="nivel_servicio_pct"
                name="Nivel de Servicio (%)"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: '#10b981', stroke: '#0f172a', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#34d399', stroke: '#064e3b', strokeWidth: 2 }}
              />
            )}

            {/* Line: Valor de Inventario */}
            {(activeMetric === 'both' || activeMetric === 'inventory') && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="valor_inventario_cop"
                name="Valor de Inventario ($ COP)"
                stroke="#38bdf8"
                strokeWidth={3}
                dot={{ r: 4, fill: '#38bdf8', stroke: '#0f172a', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#7dd3fc', stroke: '#0c4a6e', strokeWidth: 2 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Analytical Trade-off Insight Note */}
      <div className="mt-4 p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex items-start space-x-2.5 text-xs text-slate-300">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-white">Dinámica de Abastecimiento Abarrotes:</strong>{' '}
          Existe una correlación directa entre el stock disponible y el nivel de servicio. Los días de recepción de mercancía (ej. viernes) elevan el valor de inventario a ~${(Math.max(...data.map(d => d.valor_inventario_cop)) / 1000000).toFixed(1)}M COP y aseguran un NS superior al 96%. Durante los picos de venta de fin de semana, el inventario desciende y varios SKUs tocan su Punto de Reorden (ROP), requiriendo órdenes inmediatas para evitar quiebres.
        </div>
      </div>

      {/* Detailed Data Table (Collapsible) */}
      {showTable && (
        <div className="mt-4 border-t border-slate-800 pt-4 overflow-x-auto">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Registro Diario de KPIs (7 Días)
          </h4>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/80">
                <th className="py-2 px-3 font-semibold">Día / Fecha</th>
                <th className="py-2 px-3 font-semibold text-right">Nivel Servicio</th>
                <th className="py-2 px-3 font-semibold text-right">Valor Inventario (COP)</th>
                <th className="py-2 px-3 font-semibold text-right">Ventas del Día</th>
                <th className="py-2 px-3 font-semibold text-center">SKUs Bajo ROP</th>
                <th className="py-2 px-3 font-semibold text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {data.map((row) => (
                <tr key={row.fecha} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2 px-3 text-slate-200 font-sans font-medium">
                    {row.diaSemana} {row.fechaCorta} <span className="text-slate-400 text-[11px]">({row.fecha})</span>
                  </td>
                  <td className="py-2 px-3 text-right text-emerald-400 font-bold">
                    {row.nivel_servicio_pct}%
                  </td>
                  <td className="py-2 px-3 text-right text-sky-300">
                    ${row.valor_inventario_cop.toLocaleString('es-CO')} COP
                  </td>
                  <td className="py-2 px-3 text-right text-slate-300">
                    ${row.ventas_dia_cop.toLocaleString('es-CO')} COP
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${row.skus_bajo_rop > 3 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-300'}`}>
                      {row.skus_bajo_rop} SKUs
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center font-sans">
                    {row.nivel_servicio_pct >= targetServiceLevel ? (
                      <span className="text-emerald-400 text-[11px] font-medium">Cumple Meta</span>
                    ) : (
                      <span className="text-amber-400 text-[11px] font-medium">Bajo Meta ({targetServiceLevel}%)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
