import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Copy, Check, Maximize2, Minimize2, Globe, Monitor, Smartphone, ShieldCheck, Sparkles } from 'lucide-react';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export const DeployModal: React.FC<DeployModalProps> = ({
  isOpen,
  onClose,
  isFullscreen,
  onToggleFullscreen
}) => {
  const [copied, setCopied] = useState(false);
  const [appUrl, setAppUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppUrl(window.location.href);
    }
  }, []);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(appUrl || window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Error al copiar al portapapeles:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl shadow-emerald-950/50">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-900/40">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base leading-tight">
                Despliegue y Enlace de Pantalla Completa
              </h3>
              <p className="text-[11px] text-slate-400">
                Acceso independiente para tienda, mostrador o pantalla gerencial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* URL Box */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Link directo de la aplicación para desplegar:</span>
            <span className="text-[11px] text-emerald-400 font-normal flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Listo para producción
            </span>
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-emerald-300 truncate select-all focus:outline-none focus:ring-1 focus:ring-emerald-500">
              {appUrl || 'Cargando enlace...'}
            </div>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title="Copiar enlace al portapapeles"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200 animate-in zoom-in" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-300" />
                  <span>Copiar Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Open in full tab */}
          <a
            href={appUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-950/40 border border-emerald-400/30 transition-all hover:scale-[1.02] text-center"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Abrir en Pantalla Completa</span>
          </a>

          {/* Native F11 Fullscreen */}
          <button
            onClick={() => {
              onToggleFullscreen();
            }}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-white font-semibold text-xs transition-all hover:border-slate-600"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4 text-amber-400" />
                <span>Salir de Pantalla Completa</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 text-emerald-400" />
                <span>Modo Pantalla Completa (F11)</span>
              </>
            )}
          </button>
        </div>

        {/* Features / Deployment Tips */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5 text-xs text-slate-300">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Ventajas del Modo Pantalla Completa Desplegado:</span>
          </div>
          <ul className="space-y-1.5 text-[11px] text-slate-400">
            <li className="flex items-start gap-2">
              <Monitor className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-200">Experiencia Standalone:</strong> Elimina las barras y bordes del entorno de desarrollo para operar con la máxima superficie de visualización de gráficos y tablas.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Smartphone className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-slate-200">Mostrador y Tablets:</strong> Puedes abrir este link en la tablet del almacén o la terminal de ventas para registrar reabastecimientos al instante.
              </span>
            </li>
          </ul>
        </div>

        {/* Close */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
