import React, { useState, useEffect } from 'react';
import {
  Bot,
  Database,
  Cpu,
  ShieldCheck,
  Sliders,
  RefreshCw,
  ShoppingCart,
  AlertTriangle,
  Coins,
  LayoutDashboard,
  ExternalLink,
  Maximize2,
  Minimize2,
  Rocket
} from 'lucide-react';
import { DashboardKPIs } from '../types/inventory';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  kpis: DashboardKPIs | null;
  onOpenConfig: () => void;
  onRefreshAll: () => void;
  isLoading: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenDeployModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  kpis,
  onOpenConfig,
  onRefreshAll,
  isLoading,
  isFullscreen,
  onToggleFullscreen,
  onOpenDeployModal
}) => {
  const [appUrl, setAppUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppUrl(window.location.href);
    }
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard KPIs', icon: LayoutDashboard },
    { id: 'chat', label: 'Agente INVENTIA', icon: Bot },
    { id: 'matrix', label: 'Matriz ABC-XYZ', icon: Cpu },
    { id: 'recommendations', label: 'Recomendaciones', icon: ShoppingCart, badge: kpis?.skus_bajo_rop },
    { id: 'risks', label: 'Monitor de Riesgos', icon: AlertTriangle, badge: kpis?.skus_riesgo_agotamiento, badgeColor: 'bg-rose-500' },
    { id: 'database', label: 'PostgreSQL & Herramientas', icon: Database }
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30">
              <span className="font-extrabold text-lg tracking-tight">IN</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight text-white">INVENTIA</h1>
                <span className="hidden sm:inline px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Abarrotes AI
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                QUÉ + CUÁNTO + CUÁNDO comprar + POR QUÉ
              </p>
            </div>
          </div>

          {/* Actions & Fullscreen Link */}
          <div className="flex items-center space-x-2 sm:space-x-2.5 text-xs">
            {/* Currency Pill */}
            <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Moneda: <strong className="text-amber-400 font-mono">COP ($)</strong></span>
            </div>

            {/* DB status */}
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Database className="w-3.5 h-3.5 text-slate-400" />
              <span>PostgreSQL <strong className="text-white">Conectado</strong></span>
            </div>

            {/* CORE REQUEST: Fullscreen Link for Deployment (opens standalone window / tab) */}
            <a
              href={appUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-950/40 border border-emerald-400/30 transition-all hover:scale-105"
              title="Abrir aplicación en link de pantalla completa sin marco de AI Studio"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Pantalla Completa</span>
            </a>

            {/* Fullscreen F11 Toggle */}
            <button
              onClick={onToggleFullscreen}
              className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white transition-colors"
              title={isFullscreen ? "Salir de pantalla completa" : "Modo pantalla completa (F11)"}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden md:inline">Restaurar</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden md:inline">Maximizar</span>
                </>
              )}
            </button>

            {/* Deploy / Share Details Modal Trigger */}
            <button
              onClick={onOpenDeployModal}
              className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Ver enlace y opciones de despliegue"
            >
              <Rocket className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Desplegar</span>
            </button>

            {/* Policy config */}
            <button
              onClick={onOpenConfig}
              className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
              title="Configurar Políticas de Inventario (Nivel de Servicio, Tasa de Posesión)"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Políticas</span>
            </button>

            {/* Refresh */}
            <button
              onClick={onRefreshAll}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Recargar datos operativos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none border-t border-slate-800/60 pt-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold text-white ${
                      tab.badgeColor || 'bg-amber-500'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
