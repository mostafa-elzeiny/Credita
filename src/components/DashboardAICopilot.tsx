import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Send, 
  X, 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Plus, 
  Check, 
  Loader2, 
  Maximize2, 
  Minimize2,
  LineChart,
  BrainCircuit,
  PieChart
} from 'lucide-react';
import { ModelSummary } from '../services/financialModel';
import { 
  askDashboardAI, 
  AIChatMessage, 
  CustomVisualWidget 
} from '../services/dashboardAiService';

interface DashboardAICopilotProps {
  modelSummary: ModelSummary;
  isDark?: boolean;
  onAddCustomChart: (chart: CustomVisualWidget) => void;
  onAddMemoObservation?: (bullet: string) => void;
}

const QUICK_PROMPTS = [
  { label: '📊 Revenue vs EBITDA', query: 'Plot Revenue vs EBITDA and Net Income across all fiscal years in a bar chart' },
  { label: '📈 Debt & Capital Structure', query: 'Show Capital Structure: compare Short-Term Debt, Long-Term Debt, and Total Equity' },
  { label: '📉 Profitability Margins %', query: 'Create a line chart showing Gross Margin %, EBITDA Margin %, and Net Margin %' },
  { label: '💧 Liquidity & Working Capital', query: 'Analyze liquidity and generate a chart comparing Cash, Receivables, and Short-Term Debt' },
  { label: '🎯 Executive Summary Insights', query: 'Summarize the key financial strengths, solvency trends, and performance takeaways' },
];

export default function DashboardAICopilot({
  modelSummary,
  isDark = false,
  onAddCustomChart,
  onAddMemoObservation,
}: DashboardAICopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [addedChartIds, setAddedChartIds] = useState<Record<string, boolean>>({});
  const [addedMemoBullets, setAddedMemoBullets] = useState<Record<string, boolean>>({});

  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am your Senior Financial & Credit Analyst Copilot for **${modelSummary.companyName || 'Corporate Client'}**.\n\nYou can ask me questions or request charts in **English**, **العربية**, or **Franco-Arabic** (e.g. *"e3mely graph lel sales vs ebitda"*, *"what is the net margin trend?"*, *"احسبلي نسبة السيولة السريعة"*).\n\nWhenever you ask for a graph or comparison, I will instantly construct and add an interactive visual widget to your dashboard!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: AIChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await askDashboardAI(textToSend, modelSummary, messages);

      const assistantMsg: AIChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: response.reply,
        chart: response.chart || null,
        creditMemoBullets: response.creditMemoBullets || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Automatically add generated chart to dashboard
      if (response.chart) {
        onAddCustomChart(response.chart);
        setAddedChartIds(prev => ({ ...prev, [response.chart!.id]: true }));
      }
    } catch (err: any) {
      console.error('AI chat error:', err);
      const errorMsg: AIChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: `Error processing query: ${err.message || 'Please try again'}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Copilot Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 px-5 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 hover:from-blue-700 hover:to-slate-950 text-white font-bold rounded-2xl shadow-2xl shadow-indigo-500/30 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 border border-indigo-400/30 ring-4 ring-indigo-500/20"
          title="Open AI Financial Copilot (English, Arabic, Franco)"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full" />
          </div>
          <div className="text-left">
            <div className="text-xs font-black tracking-wide uppercase flex items-center gap-1.5">
              <span>Financial Copilot</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">AI</span>
            </div>
            <div className="text-[11px] font-normal text-indigo-100">Ask questions & generate charts</div>
          </div>
        </button>
      )}

      {/* Dockable / Floating Copilot Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
              isExpanded 
                ? 'inset-4 md:inset-12' 
                : 'bottom-6 right-6 w-[95vw] sm:w-[480px] h-[640px] max-h-[88vh]'
            }`}
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 text-white flex items-center justify-between border-b border-indigo-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-bold shadow-md">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">Credita Financial Copilot</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-indigo-200/80">
                    {modelSummary.companyName || 'Corporate Client'} • Charts & Credit Analysis
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsExpanded(prev => !prev)}
                  className="p-2 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-colors"
                  title={isExpanded ? 'Minimize' : 'Expand window'}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Prompts Carousel */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 overflow-x-auto flex items-center gap-2 scrollbar-none text-xs">
              <span className="text-[11px] font-bold text-slate-400 shrink-0">Quick Prompts:</span>
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(qp.query)}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap transition-colors shrink-0 flex items-center gap-1"
                >
                  {qp.label}
                </button>
              ))}
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl p-4 text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700 shadow-xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {/* If AI Generated a Chart Widget */}
                    {msg.chart && (
                      <div className="mt-4 p-3.5 bg-white dark:bg-slate-900 rounded-xl border-2 border-indigo-400/40 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            Chart Created & Added to Dashboard
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 font-bold">
                            Added to View ✓
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 dark:text-white text-xs">
                          {msg.chart.title}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Chart Type: <span className="font-semibold uppercase">{msg.chart.chartType}</span> • You can edit its style anytime directly from the dashboard.
                        </p>
                      </div>
                    )}

                    {/* If Key Takeaways Bullets are provided */}
                    {msg.creditMemoBullets && msg.creditMemoBullets.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Key Financial Takeaways:</span>
                        </div>
                        <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                          {msg.creditMemoBullets.map((bullet, bIdx) => (
                            <li key={bIdx} className="flex items-start justify-between gap-2 p-1.5 rounded-lg bg-white/60 dark:bg-slate-900/40">
                              <span className="flex-1">• {bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 p-3 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-2xl w-fit">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  <span>Financial copilot is reviewing numbers & preparing response...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask in English, Arabic, or Franco (e.g. 'e3mely graph lel sales vs ebitda')..."
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputQuery.trim() || isLoading}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold transition-all shrink-0"
                title="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
