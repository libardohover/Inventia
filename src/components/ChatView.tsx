import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  Bot,
  User,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Database,
  Cpu,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  PackageCheck,
  RotateCcw,
  Wrench,
  Table as TableIcon
} from 'lucide-react';
import { ChatMessage, RecomendacionCompra } from '../types/inventory';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isLoading: boolean;
  onQuickRestock: (productoId: string, cantidad: number, nombre: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onQuickRestock
}) => {
  const [inputText, setInputText] = useState('');
  const [expandedTraces, setExpandedTraces] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const toggleTrace = (id: string) => {
    setExpandedTraces(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const quickPrompts = [
    '¿Qué productos debo comprar hoy con urgencia y por qué?',
    'Proyección de demanda para la próxima semana y compras mayores',
    'Recomienda la compra para Leche Lala Entera 1L',
    '¿Cuál es la evolución histórica de KPIs de los últimos 7 días?',
    '¿Cuál es la clasificación ABC-XYZ de nuestra tienda?'
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-5xl mx-auto w-full">
      {/* System Framework Banner */}
      <div className="mb-3 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2 text-slate-300">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>INVENTIA</strong> opera con el ciclo:{' '}
            <span className="text-emerald-400 font-semibold">DATOS (PostgreSQL)</span> →{' '}
            <span className="text-teal-400 font-semibold">ANÁLISIS (Motor Matemático)</span> →{' '}
            <span className="text-amber-400 font-semibold">DECISIÓN (Reglas de Abastecimiento)</span>
          </span>
        </div>
        <span className="hidden sm:inline-block text-[11px] text-slate-500 font-mono">
          Abarrotes Don Pepe
        </span>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-1 space-y-4 pr-1">
        {messages.map((message) => {
          const isUser = message.sender === 'user';
          const isExpanded = !!expandedTraces[message.id];

          return (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  isUser
                    ? 'bg-slate-700 text-slate-200'
                    : 'bg-gradient-to-br from-emerald-600 to-teal-800 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Content */}
              <div className={`min-w-0 max-w-3xl space-y-3 ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
                  }`}
                >
                  {isUser ? (
                    <div className="whitespace-pre-wrap font-sans">{message.text}</div>
                  ) : (
                    <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed">
                      <Markdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-3.5 rounded-xl border border-slate-700/80 bg-slate-950/90 shadow-md">
                              <table className="min-w-full text-xs text-left divide-y divide-slate-800">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({ children }) => (
                            <thead className="bg-slate-800/90 text-slate-200 uppercase text-[11px] font-bold tracking-wider font-mono">
                              {children}
                            </thead>
                          ),
                          th: ({ children }) => (
                            <th className="px-3.5 py-2.5 whitespace-nowrap text-slate-200 border-b border-slate-700/80 font-bold text-left">
                              {children}
                            </th>
                          ),
                          tbody: ({ children }) => (
                            <tbody className="divide-y divide-slate-800/80 text-slate-300">
                              {children}
                            </tbody>
                          ),
                          tr: ({ children }) => (
                            <tr className="hover:bg-slate-900/80 transition-colors">
                              {children}
                            </tr>
                          ),
                          td: ({ children }) => (
                            <td className="px-3.5 py-2 text-xs whitespace-nowrap align-middle">
                              {children}
                            </td>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-sm font-bold text-emerald-400 mt-3.5 mb-2 flex items-center gap-1.5 pb-1 border-b border-slate-800">
                              <TableIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{children}</span>
                            </h3>
                          ),
                          h4: ({ children }) => (
                            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide mt-3 mb-1.5">
                              {children}
                            </h4>
                          ),
                          p: ({ children }) => (
                            <p className="mb-2.5 text-slate-200 leading-relaxed text-sm last:mb-0">
                              {children}
                            </p>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc pl-5 space-y-1 mb-2.5 text-slate-300 text-sm">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal pl-5 space-y-1 mb-2.5 text-slate-300 text-sm">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="leading-snug">{children}</li>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold text-white">{children}</strong>
                          ),
                          code: ({ children }) => (
                            <code className="bg-slate-800 text-emerald-300 px-1.5 py-0.5 rounded text-[11px] font-mono border border-slate-700">
                              {children}
                            </code>
                          ),
                          hr: () => <hr className="border-slate-800 my-3" />
                        }}
                      >
                        {message.text}
                      </Markdown>
                    </div>
                  )}

                  {/* Structured Recommendation Card if present */}
                  {message.recomendaciones_estructuradas && message.recomendaciones_estructuradas.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800 space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        <span>Recomendación Operativa</span>
                        <span className="text-emerald-400 font-mono">Decisión Accionable</span>
                      </div>

                      {message.recomendaciones_estructuradas.map((recom, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                                {recom.producto_nombre}
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                                  {recom.sku}
                                </span>
                              </h4>
                              <p className="text-xs text-slate-400">
                                Proveedor: {recom.proveedor_nombre} (Plazo: {recom.plazo_entrega_dias} días)
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-bold ${
                                  recom.prioridad === 'URGENTE_ALTA'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                    : recom.prioridad === 'MEDIA'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {recom.prioridad}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-mono font-bold">
                                {recom.clasificacion}
                              </span>
                            </div>
                          </div>

                          {/* Metric Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs py-1">
                            <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                              <span className="text-slate-400 block text-[10px]">Stock Actual</span>
                              <span className="font-bold text-slate-100 text-sm">{recom.stock_actual} u.</span>
                            </div>
                            <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                              <span className="text-slate-400 block text-[10px]">Punto Reorden (ROP)</span>
                              <span className="font-bold text-amber-400 text-sm">{recom.punto_reorden} u.</span>
                            </div>
                            <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                              <span className="text-slate-400 block text-[10px]">Demanda Promedio</span>
                              <span className="font-bold text-slate-100 text-sm">{recom.demanda_diaria_promedio} u./día</span>
                            </div>
                            <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                              <span className="text-slate-400 block text-[10px]">Sugerencia Compra</span>
                              <span className="font-bold text-emerald-400 text-sm">{recom.cantidad_recomendada} u.</span>
                            </div>
                          </div>

                          {/* Action Button */}
                          {recom.cantidad_recomendada > 0 && (
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-xs text-slate-400">
                                Inversión: <strong className="text-slate-200">${recom.costo_estimado_compra.toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP</strong>
                              </span>
                              <button
                                onClick={() => onQuickRestock(recom.producto_id, recom.cantidad_recomendada, recom.producto_nombre)}
                                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all"
                              >
                                <PackageCheck className="w-3.5 h-3.5" />
                                <span>Simular Reabastecimiento (+{recom.cantidad_recomendada})</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tool execution pills and Traceability toggle */}
                  {!isUser && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                      {message.herramientas_utilizadas && message.herramientas_utilizadas.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-slate-500 text-[11px] flex items-center gap-1">
                            <Wrench className="w-3 h-3" /> Herramientas:
                          </span>
                          {message.herramientas_utilizadas.map((tool, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono text-[10px] border border-slate-700"
                            >
                              {tool}
                            </span>
                          ))}
                        </div>
                      )}

                      {message.trazabilidad && message.trazabilidad.length > 0 && (
                        <button
                          onClick={() => toggleTrace(message.id)}
                          className="flex items-center space-x-1 text-slate-400 hover:text-emerald-400 font-mono text-[11px] transition-colors ml-auto"
                        >
                          <span>{isExpanded ? 'Ocultar Trazabilidad' : 'Ver Trazabilidad [DATO → CÁLCULO → RECOMENDACIÓN]'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Collapsible Trazabilidad Panel */}
                {!isUser && isExpanded && message.trazabilidad && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2 font-mono">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Trazabilidad Operativa de la Respuesta</span>
                    </div>

                    <div className="space-y-2">
                      {message.trazabilidad.map((t, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg border ${
                            t.tipo === 'DATO'
                              ? 'bg-blue-950/20 border-blue-800/40 text-blue-200'
                              : t.tipo === 'CALCULO'
                              ? 'bg-teal-950/20 border-teal-800/40 text-teal-200'
                              : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold mb-0.5">
                            <span
                              className={`px-1.5 py-0.2 rounded uppercase ${
                                t.tipo === 'DATO'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : t.tipo === 'CALCULO'
                                  ? 'bg-teal-500/20 text-teal-300'
                                  : 'bg-emerald-500/20 text-emerald-300'
                              }`}
                            >
                              [{t.tipo}] Fuente: {t.fuente}
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed">{t.descripcion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-none bg-slate-900 border border-slate-800 text-sm text-slate-400 flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs font-mono ml-2">Consultando PostgreSQL y ejecutando modelos de inventario...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Chips */}
      <div className="pt-2 pb-1 overflow-x-auto scrollbar-none flex items-center space-x-2">
        <span className="text-[11px] text-slate-500 shrink-0 font-medium">Sugerencias:</span>
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onSendMessage(prompt)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white text-xs border border-slate-700 whitespace-nowrap transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="pt-2 flex items-center space-x-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Pregunta a INVENTIA qué comprar, existencias, análisis de riesgo o políticas..."
            disabled={isLoading}
            className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all pr-10"
          />
        </div>
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-950/40 flex items-center justify-center shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
