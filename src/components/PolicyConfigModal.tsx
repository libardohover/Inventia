import React, { useState } from 'react';
import { X, Sliders, CheckCircle2, ShieldCheck } from 'lucide-react';

interface PolicyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: { nivel_servicio_pct: number; tasa_mantenimiento_anual: number }) => void;
  currentNivelServicio: number;
  currentTasaMantenimiento: number;
}

export const PolicyConfigModal: React.FC<PolicyConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentNivelServicio,
  currentTasaMantenimiento
}) => {
  const [nivelServicio, setNivelServicio] = useState<number>(currentNivelServicio);
  const [tasaMantenimiento, setTasaMantenimiento] = useState<number>(currentTasaMantenimiento * 100);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      nivel_servicio_pct: Number(nivelServicio),
      tasa_mantenimiento_anual: Number(tasaMantenimiento) / 100
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Configuración de Políticas de Inventario</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Service level selector */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold block">
              Nivel de Servicio Deseado (Probabilidad de no rotura de stock):
            </label>
            <p className="text-slate-400 text-[11px]">
              Determina el factor de seguridad Z en el cálculo del Stock de Seguridad ($SS$).
            </p>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[90, 95, 98, 99].map(pct => (
                <button
                  type="button"
                  key={pct}
                  onClick={() => setNivelServicio(pct)}
                  className={`py-2 rounded-xl font-bold border transition-all text-center ${
                    nivelServicio === pct
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {pct}%
                  <span className="block text-[9px] font-normal text-slate-400 mt-0.5">
                    Z = {pct === 90 ? '1.28' : pct === 95 ? '1.65' : pct === 98 ? '2.05' : '2.33'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Holding cost rate */}
          <div className="space-y-1.5 pt-2">
            <label className="text-slate-300 font-bold block">
              Tasa de Costo de Posesión Anual (H = Costo × i):
            </label>
            <p className="text-slate-400 text-[11px]">
              Costo de capital inmovilizado, merma y refrigeración anual (por defecto 20%).
            </p>
            <div className="flex items-center space-x-3 pt-1">
              <input
                type="range"
                min="10"
                max="40"
                step="2"
                value={tasaMantenimiento}
                onChange={e => setTasaMantenimiento(Number(e.target.value))}
                className="flex-1 accent-emerald-500 cursor-pointer"
              />
              <span className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono font-bold text-emerald-400 text-sm">
                {tasaMantenimiento}%
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Impacto en la regla de cálculo:</span>
            </div>
            <p>
              Aumentar el nivel de servicio a 98% o 99% eleva el Stock de Seguridad y Punto de Reorden (ROP), blindando los abarrotes clase A contra quiebres.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-950/40"
            >
              Guardar y Recalcular
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
