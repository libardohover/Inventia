import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ChatView } from './components/ChatView';
import { AbcXyzMatrixView } from './components/AbcXyzMatrixView';
import { RecommendationsView } from './components/RecommendationsView';
import { RisksView } from './components/RisksView';
import { DatabaseAndToolsView } from './components/DatabaseAndToolsView';
import { DashboardView } from './components/DashboardView';
import { PolicyConfigModal } from './components/PolicyConfigModal';
import { DeployModal } from './components/DeployModal';
import { ExternalLink, Copy, Check, Maximize2, Minimize2, Globe } from 'lucide-react';
import {
  Producto,
  Proveedor,
  PoliticaInventario,
  RecomendacionCompra,
  DashboardKPIs,
  ChatMessage,
  ClasificacionABCXYZ,
  HistorialKpiItem,
  PronosticoSemanalResponse
} from './types/inventory';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedFooter, setCopiedFooter] = useState<boolean>(false);
  const [currentUrl, setCurrentUrl] = useState<string>('');

  // Core operational data
  const [products, setProducts] = useState<(Producto & { stock_actual: number; ubicacion: string; proveedor_nombre: string; plazo_entrega_dias: number })[]>([]);
  const [suppliers, setSuppliers] = useState<Proveedor[]>([]);
  const [policies, setPolicies] = useState<PoliticaInventario[]>([]);
  const [abcXyzSummary, setAbcXyzSummary] = useState<Record<ClasificacionABCXYZ, { count: number; productos: string[]; valor_total: number }>>();
  const [recommendations, setRecommendations] = useState<RecomendacionCompra[]>([]);
  const [risksData, setRisksData] = useState<any>(null);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [kpiHistory, setKpiHistory] = useState<HistorialKpiItem[]>([]);
  const [demandForecast, setDemandForecast] = useState<PronosticoSemanalResponse | null>(null);
  const [config, setConfig] = useState({ nivel_servicio_pct: 95, tasa_mantenimiento_anual: 0.20 });

  // Initial welcome message from INVENTIA
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'inventia',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `Hola, soy **INVENTIA**, tu agente de optimización de inventarios para tiendas de abarrotes.
He sincronizado la base de datos de PostgreSQL y calculado las políticas analíticas de reabastecimiento:

### 🏪 Resumen Ejecutivo Inicial de la Tienda

| Indicador Operativo | Valor Actual | Estado / Interpretación |
| :--- | :--- | :--- |
| **Catálogo Operativo** | **20 productos** | Abarrotes de alta y media rotación |
| **Proveedores Activos** | **6 distribuidores** | Con plazos de entrega de 1 a 4 días |
| **Nivel de Servicio Objetivo** | **95.0%** | Factor $Z = 1.645$ para Stock de Seguridad |
| **Productos Bajo ROP** | **6 SKUs** | Requieren orden de compra |
| **Riesgo Crítico de Agotamiento** | **5 SKUs** | Cobertura menor al plazo del proveedor |

### 🎯 Plan de Acción Inmediato
- **QUÉ Revisar:** Compras urgentes para Leche, Huevos, Aceite y Gaseosas.
- **CUÁNDO Pedir:** Hoy mismo antes de las 2:00 PM para evitar quiebres de stock.
- **POR QUÉ:** Las existencias cayeron por debajo del Punto de Reorden (ROP).

*Haz clic en cualquiera de las consultas sugeridas o pregúntame lo que necesites.*`,
      herramientas_utilizadas: ['consultar_dashboard', 'analizar_riesgo'],
      trazabilidad: [
        {
          tipo: 'DATO',
          fuente: 'PostgreSQL',
          descripcion: 'Carga de catálogo operativo (20 productos de abarrotes, 6 proveedores activos).'
        },
        {
          tipo: 'CALCULO',
          fuente: 'Motor Analítico',
          descripcion: 'Políticas estocásticas calculadas a nivel de servicio del 95%.'
        }
      ]
    }
  ]);

  // Load all operational data from backend
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [prodsRes, supsRes, polsRes, abcRes, risksRes, recomsRes, dashRes, historyRes, forecastRes, cfgRes] = await Promise.all([
        fetch('/api/database/products').then(r => r.json()),
        fetch('/api/database/suppliers').then(r => r.json()),
        fetch('/api/analytics/policies').then(r => r.json()),
        fetch('/api/analytics/abc-xyz').then(r => r.json()),
        fetch('/api/analytics/risks').then(r => r.json()),
        fetch('/api/analytics/recommendations').then(r => r.json()),
        fetch('/api/analytics/dashboard').then(r => r.json()),
        fetch('/api/analytics/kpi-history?days=7').then(r => r.json()).catch(() => []),
        fetch('/api/analytics/demand-forecast?factor=1.0').then(r => r.json()).catch(() => null),
        fetch('/api/analytics/config').then(r => r.json()).catch(() => ({ nivel_servicio_pct: 95, tasa_mantenimiento_anual: 0.20 }))
      ]);

      setProducts(prodsRes);
      setSuppliers(supsRes);
      setPolicies(polsRes);
      setAbcXyzSummary(abcRes.matriz_resumen);
      setRisksData(risksRes);
      setRecommendations(recomsRes);
      setKpis(dashRes);
      if (Array.isArray(historyRes)) setKpiHistory(historyRes);
      if (forecastRes) setDemandForecast(forecastRes);
      if (cfgRes) setConfig(cfgRes);
    } catch (err) {
      console.error('Error cargando datos operativos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForecastScenarioChange = async (factor: number) => {
    try {
      const res = await fetch(`/api/analytics/demand-forecast?factor=${factor}`);
      if (res.ok) {
        const data = await res.json();
        setDemandForecast(data);
      }
    } catch (err) {
      console.error('Error actualizando escenario de pronóstico:', err);
    }
  };

  useEffect(() => {
    loadAllData();
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }

    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(err => {
          console.warn('Error al activar pantalla completa:', err);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
          console.warn('Error al salir de pantalla completa:', err);
        });
      }
    }
  };

  const handleCopyFooterUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl || window.location.href);
      setCopiedFooter(true);
      setTimeout(() => setCopiedFooter(false), 2500);
    } catch (e) {
      console.warn('Error copiando link:', e);
    }
  };

  // Send message to INVENTIA
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();

      const assistantMsg: ChatMessage = {
        id: `inventia-${Date.now()}`,
        sender: 'inventia',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: data.text,
        herramientas_utilizadas: data.herramientas_utilizadas,
        trazabilidad: data.trazabilidad,
        recomendaciones_estructuradas: data.recomendaciones_estructuradas
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Error conversando con INVENTIA:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'inventia',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: 'No pude completar la consulta en este momento debido a un problema de conexión con el motor analítico.',
          error: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Stock mutation (restock or sale)
  const handleUpdateStock = async (productoId: string, setStock?: number, deltaStock?: number) => {
    setIsLoading(true);
    try {
      await fetch('/api/database/update-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ producto_id: productoId, setStock, deltaStock })
      });
      await loadAllData();
    } catch (err) {
      console.error('Error actualizando stock:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Restock from Chat / Recommendations
  const handleQuickRestock = async (productoId: string, cantidad: number, nombre: string) => {
    await handleUpdateStock(productoId, undefined, cantidad);

    // Notify in chat
    const systemNotice: ChatMessage = {
      id: `sys-${Date.now()}`,
      sender: 'system',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `📦 **Reabastecimiento registrado en PostgreSQL:** Se añadieron **+${cantidad} piezas** al inventario de **${nombre}**. Los puntos de reorden y alertas han sido recalculados en tiempo real.`
    };
    setMessages(prev => [...prev, systemNotice]);
  };

  // Simulate sale to test replenishment triggers
  const handleSimulateSale = async (productoId: string, cantidad: number, nombre: string) => {
    await handleUpdateStock(productoId, undefined, -cantidad);
  };

  // Update policy configuration
  const handleSaveConfig = async (newConfig: { nivel_servicio_pct: number; tasa_mantenimiento_anual: number }) => {
    setIsLoading(true);
    try {
      await fetch('/api/analytics/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      await loadAllData();
    } catch (err) {
      console.error('Error guardando configuración:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        kpis={kpis}
        onOpenConfig={() => setIsConfigOpen(true)}
        onRefreshAll={loadAllData}
        isLoading={isLoading}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onOpenDeployModal={() => setIsDeployModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4">
        {activeTab === 'dashboard' && (
          <DashboardView
            kpis={kpis}
            kpiHistory={kpiHistory}
            forecastData={demandForecast}
            onScenarioChange={handleForecastScenarioChange}
            onNavigateTab={setActiveTab}
            onRefresh={loadAllData}
            isLoading={isLoading}
            targetServiceLevel={config.nivel_servicio_pct}
          />
        )}

        {activeTab === 'chat' && (
          <ChatView
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            onQuickRestock={handleQuickRestock}
          />
        )}

        {activeTab === 'matrix' && (
          <AbcXyzMatrixView
            policies={policies}
            abcXyzSummary={abcXyzSummary}
          />
        )}

        {activeTab === 'recommendations' && (
          <RecommendationsView
            recommendations={recommendations}
            onRestock={handleQuickRestock}
            onSimulateSale={handleSimulateSale}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'risks' && (
          <RisksView
            risksData={risksData}
            onRestock={handleQuickRestock}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'database' && (
          <DatabaseAndToolsView
            products={products}
            suppliers={suppliers}
            onUpdateStock={handleUpdateStock}
            isLoading={isLoading}
          />
        )}
      </main>

      {/* Quick Deploy & Fullscreen Bottom Bar */}
      <footer className="border-t border-slate-800/90 bg-slate-900/95 backdrop-blur py-2.5 px-4 sm:px-6 lg:px-8 mt-auto sticky bottom-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center space-x-2 text-slate-400 overflow-hidden w-full sm:w-auto">
            <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-slate-200 shrink-0">Link Pantalla Completa:</span>
            <span className="font-mono text-emerald-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px] truncate select-all max-w-[220px] sm:max-w-xs md:max-w-md">
              {currentUrl || 'https://...'}
            </span>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleCopyFooterUrl}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs transition-colors"
              title="Copiar link directo al portapapeles"
            >
              {copiedFooter ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copiar Link</span>
                </>
              )}
            </button>

            <a
              href={currentUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-sm shadow-emerald-950 transition-all hover:scale-105"
              title="Desplegar aplicación en ventana completa independiente sin marco"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir en Pantalla Completa ↗</span>
            </a>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
              title={isFullscreen ? "Salir de pantalla completa" : "Modo pantalla completa (F11)"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </button>
          </div>
        </div>
      </footer>

      {/* Policy Configuration Modal */}
      <PolicyConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSave={handleSaveConfig}
        currentNivelServicio={config.nivel_servicio_pct}
        currentTasaMantenimiento={config.tasa_mantenimiento_anual}
      />

      {/* Fullscreen & Deploy Modal */}
      <DeployModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />
    </div>
  );
}
