import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ComposedChart,
  Line,
  Cell
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  Calendar,
  Layers,
  Search,
  ArrowRight,
  Clock,
  Sparkles,
  ChevronRight,
  Building,
  CheckCircle2
} from 'lucide-react';
import { PronosticoSemanalResponse, ProyeccionSkuSemanal } from '../types/inventory';

interface WeeklyDemandForecastProps {
  forecastData: PronosticoSemanalResponse | null;
  isLoading: boolean;
  onScenarioChange: (factor: number) => void;
  onNavigateTab: (tab: string) => void;
}

export const WeeklyDemandForecast: React.FC<WeeklyDemandForecastProps> = ({
  forecastData,
  isLoading,
  onScenarioChange,
  onNavigateTab
}) => {
  const [activeScenario, setActiveScenario] = useState<number>(1.0);
  const [chartMode, setChartMode] = useState<'daily' | 'topSkus'>('daily');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyMajorPurchases, setOnlyMajorPurchases] = useState<boolean>(true);

  const handleScenarioClick = (factor: number) => {
    setActiveScenario(factor);
    onScenarioChange(factor);
  };

  if (isLoading || !forecastData) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[340px] animate-pulse">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin mb-3" />
        <p className="text-sm text-slate-400">Calculando proyección de demanda semanal para compras mayores...</p>
      </div>
    );
  }

  // Categories list
  const categories = ['all', ...Array.from(new Set(forecastData.productos.map(p => p.categoria)))];

  // Filtered SKUs for the table
  const filteredProducts = forecastData.productos.filter(p => {
    const matchesSearch =
      p.nombre.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.proveedor_nombre.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.categoria === selectedCategory;
    const matchesMajor = onlyMajorPurchases ? p.requiere_compra_mayor : true;
    return matchesSearch && matchesCategory && matchesMajor;
  });

  // Top SKUs sorted by monetary purchase need for the chart comparison
  const topSkusChartData = forecastData.productos
    .filter(p => p.requiere_compra_mayor)
    .slice(0, 8)
    .map(p => ({
      name: p.nombre.length > 14 ? p.nombre.substring(0, 13) + '…' : p.nombre,
      fullName: p.nombre,
      stockActual: p.stock_actual,
      demanda7d: p.demanda_proyectada_7d,
      compraSugerida: p.unidades_sugeridas_compra,
      deficit: Math.max(0, p.demanda_proyectada_7d - p.stock_actual),
      montoCop: p.monto_compra_cop,
      diaQuiebre: p.dia_quiebre_estimado || 'Sin quiebre'
    }));

  // Custom Tooltip for Daily Chart
  const CustomDailyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700 rounded-lg p-3 text-xs shadow-xl backdrop-blur-md min-w-[210px]">
          <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1.5 mb-2 flex justify-between">
            <span>{d.diaSemana}</span>
            <span className="text-slate-400 font-mono text-[11px]">{d.diaCorta}</span>
          </div>
          <div className="space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Demanda esperada:</span>
              <span className="text-emerald-400 font-bold">{d.unidades_totales} u.</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Ventas estimadas:</span>
              <span className="text-sky-300 font-bold">${d.ventas_proyectadas_cop.toLocaleString('es-CO')} COP</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
              <span>Costo estimado:</span>
              <span>${d.costo_proyectado_cop.toLocaleString('es-CO')} COP</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for Top SKUs Chart
  const CustomSkuTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700 rounded-lg p-3 text-xs shadow-xl backdrop-blur-md min-w-[230px]">
          <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1.5 mb-2">
            {d.fullName}
          </div>
          <div className="space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Stock Actual:</span>
              <span className="text-slate-200 font-bold">{d.stockActual} u.</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Demanda Próx. Semana:</span>
              <span className="text-amber-400 font-bold">{d.demanda7d} u.</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Compra Sugerida (EOQ):</span>
              <span className="text-emerald-400 font-bold">{d.compraSugerida} u.</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
              <span>Inversión Requerida:</span>
              <span className="text-emerald-300 font-bold">${d.montoCop.toLocaleString('es-CO')} COP</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="weekly-demand-forecast-section" className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-md space-y-6">
      {/* Header & Scenario Simulation Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Proyección de Demanda Semanal y Anticipación de Compras Mayores
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Horizonte de 7 días ({forecastData.fecha_inicio} al {forecastData.fecha_fin}) calculado a partir del histórico de ventas y estacionalidad de fin de semana. Identifica compras por volumen requeridas con antelación para proteger el nivel de servicio.
          </p>
        </div>

        {/* Scenario Controls */}
        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">Escenario:</span>
          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              id="forecast-scenario-conservative"
              onClick={() => handleScenarioClick(0.9)}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                activeScenario === 0.9 ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Moderado (-10%)
            </button>
            <button
              id="forecast-scenario-normal"
              onClick={() => handleScenarioClick(1.0)}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                activeScenario === 1.0 ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Base Normal (1.0x)
            </button>
            <button
              id="forecast-scenario-high"
              onClick={() => handleScenarioClick(1.2)}
              className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap ${
                activeScenario === 1.2 ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Quincena / Alta (+20%)
            </button>
          </div>
        </div>
      </div>

      {/* 4 Summary Highlight Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Demanda Total Proyectada</span>
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline space-x-1.5">
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {forecastData.total_unidades_demanda.toLocaleString('es-CO')}
            </span>
            <span className="text-xs text-slate-400 font-mono">u. (7 días)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Ventas esperadas: <strong className="text-sky-300">${(forecastData.total_ventas_proyectadas_cop / 1000000).toFixed(2)}M COP</strong>
          </p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Presupuesto Compras Mayores</span>
            <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-1 flex items-baseline space-x-1.5">
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
              ${(forecastData.total_presupuesto_compras_mayores_cop / 1000000).toFixed(2)}M
            </span>
            <span className="text-xs text-emerald-400 font-mono font-bold">COP</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {forecastData.total_unidades_compras_mayores.toLocaleString('es-CO')} unidades a reabastecer
          </p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Riesgo de Quiebre Semanal</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="mt-1 flex items-baseline space-x-1.5">
            <span className="text-xl sm:text-2xl font-black text-rose-400 font-mono">
              {forecastData.skus_en_riesgo_quiebre}
            </span>
            <span className="text-xs text-slate-400">SKUs críticos</span>
          </div>
          <p className="text-[11px] text-rose-300/80 mt-1">
            Se agotarán antes de terminar la semana
          </p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Compras Mayores Requeridas</span>
            <Layers className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="mt-1 flex items-baseline space-x-1.5">
            <span className="text-xl sm:text-2xl font-black text-sky-300 font-mono">
              {forecastData.compras_mayores_anticipadas.length}
            </span>
            <span className="text-xs text-slate-400">órdenes clave</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Reabastecimiento anticipado por lead time
          </p>
        </div>
      </div>

      {/* Critical Purchases Urgent Banner */}
      {forecastData.compras_mayores_anticipadas.length > 0 && (
        <div className="bg-gradient-to-r from-rose-950/40 via-amber-950/30 to-slate-900 border border-rose-500/30 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center space-x-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 animate-bounce" />
              <span>Acción Inmediata: Compras Mayores que Deben Ordenarse Hoy Lunes</span>
            </div>
            <button
              onClick={() => onNavigateTab('recommendations')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center self-start sm:self-auto"
            >
              <span>Ir a módulo de recomendaciones</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {forecastData.compras_mayores_anticipadas.slice(0, 4).map(item => (
              <div
                key={item.producto_id}
                className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 hover:border-rose-500/50 transition-colors"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-white truncate max-w-[150px]">{item.nombre}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${item.riesgo_desabastecimiento === 'CRITICO' ? 'bg-rose-500/20 text-rose-300' : 'bg-amber-500/20 text-amber-300'}`}>
                    {item.dia_quiebre_estimado ? `Quiebre: ${item.dia_quiebre_estimado.split(' ')[0]}` : 'Bajo ROP'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 space-y-1 mt-2">
                  <div className="flex justify-between">
                    <span>Stock actual:</span>
                    <span className="font-mono text-slate-200 font-semibold">{item.stock_actual} u.</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Demanda 7d:</span>
                    <span className="font-mono text-amber-400 font-bold">{item.demanda_proyectada_7d} u.</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-semibold pt-1 border-t border-slate-800/80">
                    <span>Pedido sugerido:</span>
                    <span className="font-mono">{item.unidades_sugeridas_compra} u. (${item.monto_compra_cop.toLocaleString('es-CO')})</span>
                  </div>
                  <div className="flex items-center text-[10px] text-slate-400 mt-1">
                    <Clock className="w-3 h-3 mr-1 text-slate-400" />
                    <span>Lead time: {item.plazo_entrega_dias} días ({item.proveedor_nombre.split(' ')[0]})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart Section with Dual Mode Toggle */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h4 className="text-sm font-bold text-white">
              {chartMode === 'daily'
                ? 'Curva Diaria de Demanda y Ventas Proyectadas (Próxima Semana)'
                : 'Top SKUs con Mayor Requerimiento de Compra vs. Stock Actual'}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {chartMode === 'daily'
                ? 'Distribución estocástica de lunes a domingo. Observa el pico de consumo de fin de semana (viernes a domingo).'
                : 'Comparación del inventario disponible en tienda contra el volumen proyectado a 7 días.'}
            </p>
          </div>

          <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-800 text-xs shrink-0">
            <button
              onClick={() => setChartMode('daily')}
              className={`px-3 py-1 rounded-md transition-colors ${
                chartMode === 'daily' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Demanda Diaria (7D)
            </button>
            <button
              onClick={() => setChartMode('topSkus')}
              className={`px-3 py-1 rounded-md transition-colors ${
                chartMode === 'topSkus' ? 'bg-sky-500/20 text-sky-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Top SKUs en Déficit
            </button>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'daily' ? (
              <ComposedChart data={forecastData.desglose_dias} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                <XAxis
                  dataKey="diaCorta"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#475569' }}
                />
                <YAxis
                  yAxisId="units"
                  orientation="left"
                  stroke="#10b981"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#059669' }}
                  tickFormatter={(val) => `${val} u`}
                />
                <YAxis
                  yAxisId="sales"
                  orientation="right"
                  stroke="#38bdf8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#0284c7' }}
                  tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`}
                />
                <Tooltip content={<CustomDailyTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={32}
                  wrapperStyle={{ fontSize: '12px' }}
                  formatter={(value) => <span className="text-slate-300 font-medium">{value}</span>}
                />
                <Bar
                  yAxisId="units"
                  dataKey="unidades_totales"
                  name="Unidades Demandadas"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={48}
                >
                  {forecastData.desglose_dias.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.diaSemana === 'Viernes' || entry.diaSemana === 'Sábado' || entry.diaSemana === 'Domingo' ? '#059669' : '#10b981'}
                    />
                  ))}
                </Bar>
                <Line
                  yAxisId="sales"
                  type="monotone"
                  dataKey="ventas_proyectadas_cop"
                  name="Venta Proyectada ($ COP)"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#38bdf8' }}
                />
              </ComposedChart>
            ) : (
              <BarChart data={topSkusChartData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  angle={-20}
                  textAnchor="end"
                  axisLine={{ stroke: '#475569' }}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#475569' }}
                  tickFormatter={(val) => `${val} u`}
                />
                <Tooltip content={<CustomSkuTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={32}
                  wrapperStyle={{ fontSize: '12px' }}
                  formatter={(value) => <span className="text-slate-300 font-medium">{value}</span>}
                />
                <Bar
                  dataKey="stockActual"
                  name="Stock Actual"
                  fill="#64748b"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="demanda7d"
                  name="Demanda Proyectada 7D"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="compraSugerida"
                  name="Compra Mayor Sugerida"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive Table of Projected Demand and Anticipated Purchases */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Building className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">
              Planificación Detallada de Reabastecimiento por SKU
            </h4>
            <span className="text-xs text-slate-400">({filteredProducts.length} productos)</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                id="forecast-search-input"
                type="text"
                placeholder="Buscar SKU o nombre..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500 w-40 sm:w-48"
              />
            </div>

            {/* Category Select */}
            <select
              id="forecast-category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              {categories.map(c => (
                <option key={c} value={c}>
                  {c === 'all' ? 'Todas las Categorías' : c}
                </option>
              ))}
            </select>

            {/* Only Major Toggle */}
            <button
              id="forecast-toggle-major-only"
              onClick={() => setOnlyMajorPurchases(!onlyMajorPurchases)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center space-x-1 ${
                onlyMajorPurchases
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Solo Compras Mayores</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/40">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950">
                <th className="py-2.5 px-3 font-semibold">Producto / Proveedor</th>
                <th className="py-2.5 px-3 font-semibold text-right">Stock Actual</th>
                <th className="py-2.5 px-3 font-semibold text-right">Demanda 7D (IC 95%)</th>
                <th className="py-2.5 px-3 font-semibold text-center">Día Quiebre</th>
                <th className="py-2.5 px-3 font-semibold text-center">Lead Time</th>
                <th className="py-2.5 px-3 font-semibold text-right">Compra Sugerida</th>
                <th className="py-2.5 px-3 font-semibold text-right">Inversión (COP)</th>
                <th className="py-2.5 px-3 font-semibold text-center">Riesgo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400 font-sans">
                    No se encontraron productos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(sku => (
                  <tr key={sku.producto_id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-sans">
                      <div className="font-bold text-white">{sku.nombre}</div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center space-x-1.5">
                        <span>{sku.sku}</span>
                        <span>•</span>
                        <span className="text-slate-400">{sku.proveedor_nombre}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-right text-slate-200">
                      {sku.stock_actual} u.
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <div className="font-bold text-amber-400">{sku.demanda_proyectada_7d} u.</div>
                      <div className="text-[10px] text-slate-400 font-mono">[{sku.intervalo_min_7d} - {sku.intervalo_max_7d}]</div>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {sku.dia_quiebre_estimado ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {sku.dia_quiebre_estimado}
                        </span>
                      ) : (
                        <span className="text-emerald-400 text-[11px]">
                          Sin quiebre ({sku.dias_cobertura_actual}d)
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-center font-sans text-slate-400">
                      {sku.plazo_entrega_dias} días
                    </td>

                    <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                      {sku.unidades_sugeridas_compra > 0 ? `${sku.unidades_sugeridas_compra} u.` : '-'}
                    </td>

                    <td className="py-2.5 px-3 text-right text-sky-300 font-bold">
                      {sku.monto_compra_cop > 0 ? `$${sku.monto_compra_cop.toLocaleString('es-CO')}` : '-'}
                    </td>

                    <td className="py-2.5 px-3 text-center font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sku.riesgo_desabastecimiento === 'CRITICO'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : sku.riesgo_desabastecimiento === 'ALTO'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : sku.riesgo_desabastecimiento === 'MODERADO'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : 'bg-emerald-500/15 text-emerald-400'
                        }`}
                      >
                        {sku.riesgo_desabastecimiento}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Guidance Note */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              <strong>Estrategia de Abastecimiento:</strong> Al realizar compras consolidadas con proveedores clave (ej. Grupo Lala/Colanta y Bimbo) hoy lunes, se optimiza el costo fijo de ordenar ($S) y se evitan faltantes durante el fin de semana.
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('recommendations')}
            className="text-emerald-400 hover:text-emerald-300 font-semibold whitespace-nowrap flex items-center shrink-0 self-end sm:self-auto"
          >
            <span>Generar órdenes de compra</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
