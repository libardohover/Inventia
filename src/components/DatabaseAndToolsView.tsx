import React, { useState } from 'react';
import { Database, Wrench, Play, Plus, Minus, Check, RefreshCw, Terminal, Truck, Box } from 'lucide-react';
import { Producto, Proveedor } from '../types/inventory';

interface DatabaseAndToolsViewProps {
  products: (Producto & { stock_actual: number; ubicacion: string; proveedor_nombre: string; plazo_entrega_dias: number })[];
  suppliers: Proveedor[];
  onUpdateStock: (productoId: string, setStock?: number, deltaStock?: number) => void;
  isLoading: boolean;
}

export const DatabaseAndToolsView: React.FC<DatabaseAndToolsViewProps> = ({
  products,
  suppliers,
  onUpdateStock,
  isLoading
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'tables' | 'tools'>('tables');
  const [selectedTool, setSelectedTool] = useState<string>('consultar_producto');
  const [toolParams, setToolParams] = useState<Record<string, any>>({ query: 'Leche Lala' });
  const [toolOutput, setToolOutput] = useState<any>(null);
  const [isExecutingTool, setIsExecutingTool] = useState(false);
  const [stockEditInputs, setStockEditInputs] = useState<Record<string, string>>({});

  const toolsList = [
    { id: 'consultar_producto', name: 'consultar_producto', desc: 'Información y existencia de un producto específico' },
    { id: 'consultar_inventario', name: 'consultar_inventario', desc: 'Listado y valuación de existencias en almacén' },
    { id: 'consultar_demanda', name: 'consultar_demanda', desc: 'Historial de ventas, promedio, desviación y CV' },
    { id: 'calcular_abc_xyz', name: 'calcular_abc_xyz', desc: 'Matriz ABC-XYZ combinada (Pareto y variabilidad)' },
    { id: 'pronosticar_demanda', name: 'pronosticar_demanda', desc: 'Demanda futura con intervalos de confianza' },
    { id: 'calcular_politica_inventario', name: 'calcular_politica_inventario', desc: 'Stock de Seguridad, ROP, EOQ y Stock Máximo' },
    { id: 'analizar_riesgo', name: 'analizar_riesgo', desc: 'Diagnóstico de agotamiento, sobreinventario y baja rotación' },
    { id: 'recomendar_compra', name: 'recomendar_compra', desc: 'Decisión de compra estructurada y explicable' },
    { id: 'consultar_proveedor', name: 'consultar_proveedor', desc: 'Plazos de entrega, costos de pedido y confiabilidad' },
    { id: 'consultar_dashboard', name: 'consultar_dashboard', desc: 'KPIs agregados de inventario de abarrotes' }
  ];

  const handleToolSelect = (toolId: string) => {
    setSelectedTool(toolId);
    setToolOutput(null);
    switch (toolId) {
      case 'consultar_producto':
        setToolParams({ query: 'PROD-001' });
        break;
      case 'consultar_inventario':
        setToolParams({ filtro_categoria: 'TODAS', solo_bajo_stock: false });
        break;
      case 'consultar_demanda':
        setToolParams({ producto_id: 'PROD-001', periodo_dias: 30 });
        break;
      case 'calcular_abc_xyz':
        setToolParams({ corte_a: 80, corte_b: 95 });
        break;
      case 'pronosticar_demanda':
        setToolParams({ producto_id: 'PROD-001', dias_horizonte: 7 });
        break;
      case 'calcular_politica_inventario':
        setToolParams({ producto_id: 'PROD-001', nivel_servicio: 95 });
        break;
      case 'analizar_riesgo':
        setToolParams({ tipo_riesgo: 'todos' });
        break;
      case 'recomendar_compra':
        setToolParams({ producto_id: 'PROD-001', solo_prioritarios: false });
        break;
      case 'consultar_proveedor':
        setToolParams({ proveedor_id: 'PROV-001' });
        break;
      case 'consultar_dashboard':
        setToolParams({});
        break;
      default:
        setToolParams({});
    }
  };

  const handleExecuteTool = async () => {
    setIsExecutingTool(true);
    try {
      const res = await fetch('/api/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool_name: selectedTool,
          parameters: toolParams
        })
      });
      const data = await res.json();
      setToolOutput(data);
    } catch (err) {
      console.error(err);
      setToolOutput({ error: 'Error invocando herramienta' });
    } finally {
      setIsExecutingTool(false);
    }
  };

  const handleStockDirectSave = (prodId: string) => {
    const val = parseInt(stockEditInputs[prodId]);
    if (!isNaN(val) && val >= 0) {
      onUpdateStock(prodId, val, undefined);
      const copy = { ...stockEditInputs };
      delete copy[prodId];
      setStockEditInputs(copy);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-10">
      {/* Sub tabs navigation */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">PostgreSQL & Banco de Herramientas Analíticas</h2>
        </div>

        <div className="flex space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab('tables')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeSubTab === 'tables' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Tablas Operativas (PostgreSQL)
          </button>
          <button
            onClick={() => setActiveSubTab('tools')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeSubTab === 'tools' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Banco de Pruebas (10 Herramientas)
          </button>
        </div>
      </div>

      {activeSubTab === 'tables' ? (
        <div className="space-y-6">
          {/* Products & Inventory Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Box className="w-4 h-4 text-emerald-400" />
                  Tabla: `productos` + `inventario` (Fuente de Verdad)
                </h3>
                <p className="text-xs text-slate-400">
                  Modifica las existencias en tiempo real para verificar la reactividad inmediata del agente INVENTIA.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] font-mono border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">SKU / ID</th>
                    <th className="py-3 px-4">Nombre Producto</th>
                    <th className="py-3 px-2">Categoría</th>
                    <th className="py-3 px-2 text-right">Costo</th>
                    <th className="py-3 px-2 text-right">Precio</th>
                    <th className="py-3 px-2">Proveedor</th>
                    <th className="py-3 px-2 text-center">Plazo (L)</th>
                    <th className="py-3 px-4 text-center font-bold text-white">Stock Actual</th>
                    <th className="py-3 px-4 text-right">Modificar Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {p.sku}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-100">
                        {p.nombre}
                      </td>
                      <td className="py-3 px-2 text-slate-400">{p.categoria}</td>
                      <td className="py-3 px-2 text-right font-mono">${p.costo_unitario.toLocaleString('es-CO')}</td>
                      <td className="py-3 px-2 text-right font-mono text-emerald-400">${p.precio_venta.toLocaleString('es-CO')}</td>
                      <td className="py-3 px-2 text-slate-300 truncate max-w-[150px]">{p.proveedor_nombre}</td>
                      <td className="py-3 px-2 text-center font-mono">{p.plazo_entrega_dias}d</td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-extrabold font-mono text-white text-sm bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                          {p.stock_actual}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => onUpdateStock(p.id, undefined, -5)}
                            disabled={isLoading}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs"
                            title="Restar 5 unidades (Venta)"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <input
                            type="number"
                            min="0"
                            placeholder={p.stock_actual.toString()}
                            value={stockEditInputs[p.id] ?? ''}
                            onChange={e => setStockEditInputs({ ...stockEditInputs, [p.id]: e.target.value })}
                            className="w-14 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-center font-mono text-xs text-white"
                          />

                          {stockEditInputs[p.id] !== undefined && (
                            <button
                              onClick={() => handleStockDirectSave(p.id)}
                              className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                              title="Guardar nuevo stock"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}

                          <button
                            onClick={() => onUpdateStock(p.id, undefined, 10)}
                            disabled={isLoading}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs"
                            title="Sumar 10 unidades (Surtido)"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Suppliers Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-400" />
                Tabla: `proveedores` (Parámetros de Reabastecimiento)
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] font-mono border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Nombre Proveedor</th>
                    <th className="py-3 px-3">Contacto</th>
                    <th className="py-3 px-2 text-center">Plazo Entrega (L)</th>
                    <th className="py-3 px-2 text-right">Costo Orden (S)</th>
                    <th className="py-3 px-2 text-right">Pedido Mínimo</th>
                    <th className="py-3 px-4 text-center">Confiabilidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {suppliers.map(s => (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400">{s.id}</td>
                      <td className="py-3 px-4 font-semibold text-white">{s.nombre}</td>
                      <td className="py-3 px-3 text-slate-400">{s.contacto} ({s.telefono})</td>
                      <td className="py-3 px-2 text-center font-mono font-bold text-emerald-400">{s.plazo_entrega_dias} días</td>
                      <td className="py-3 px-2 text-right font-mono">${s.costo_fijo_pedido.toLocaleString('es-CO')} COP</td>
                      <td className="py-3 px-2 text-right font-mono">${s.pedido_minimo_monto.toLocaleString('es-CO')} COP</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono font-bold text-[10px]">
                          {s.confiabilidad_pct}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Tool execution workbench */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tool selector & parameters */}
          <div className="lg:col-span-1 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <label className="text-xs font-bold text-slate-300 block uppercase">
                Selecciona la Herramienta a Ejecutar:
              </label>
              <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                {toolsList.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleToolSelect(t.id)}
                    className={`w-full text-left p-2 rounded-xl text-xs transition-all ${
                      selectedTool === t.id
                        ? 'bg-emerald-600 text-white font-bold shadow-sm'
                        : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800 border border-slate-800/80'
                    }`}
                  >
                    <div className="font-mono">{t.name}</div>
                    <div className={`text-[10px] mt-0.5 ${selectedTool === t.id ? 'text-emerald-100' : 'text-slate-500'}`}>
                      {t.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Parameters form */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase">
                Parámetros de Entrada (JSON / Formulario)
              </h4>

              <div className="space-y-2 text-xs">
                {Object.entries(toolParams).map(([key, val]) => (
                  <div key={key}>
                    <label className="text-slate-400 font-mono text-[11px] block mb-1">{key}:</label>
                    <input
                      type="text"
                      value={val?.toString() || ''}
                      onChange={e => setToolParams({ ...toolParams, [key]: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                ))}
                {Object.keys(toolParams).length === 0 && (
                  <p className="text-slate-500 text-xs italic">Esta herramienta no requiere parámetros obligatorios.</p>
                )}
              </div>

              <button
                onClick={handleExecuteTool}
                disabled={isExecutingTool}
                className="w-full mt-3 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-950/40"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isExecutingTool ? 'Ejecutando...' : `Ejecutar \`${selectedTool}\``}</span>
              </button>
            </div>
          </div>

          {/* Tool Result Console */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2 font-mono text-xs text-emerald-400">
                  <Terminal className="w-4 h-4" />
                  <span>Salida JSON del Motor de Cálculo</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  Herramienta: {selectedTool}
                </span>
              </div>

              {toolOutput ? (
                <div className="mt-3 space-y-3">
                  {/* Traces if present */}
                  {toolOutput.traces && toolOutput.traces.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                        Trazabilidad generada:
                      </span>
                      {toolOutput.traces.map((tr: any, i: number) => (
                        <div
                          key={i}
                          className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono"
                        >
                          <span className="text-emerald-400 font-bold">[{tr.tipo}]</span>{' '}
                          <span className="text-slate-400">({tr.fuente}):</span>{' '}
                          <span className="text-slate-200">{tr.descripcion}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Raw JSON */}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block mb-1">
                      Payload de Retorno:
                    </span>
                    <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto max-h-96">
                      {JSON.stringify(toolOutput.result, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 text-slate-500 text-xs font-mono">
                  Presiona "Ejecutar `{selectedTool}`" para visualizar la respuesta exacta de la herramienta.
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
              INVENTIA Tool Protocol • Sin alucinaciones • Cálculos matemáticos auditables
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
