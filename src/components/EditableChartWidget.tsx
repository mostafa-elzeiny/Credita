import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  PieChart as PieIcon, 
  Table as TableIcon, 
  Sparkles, 
  Trash2, 
  Plus, 
  SlidersHorizontal,
  FileText
} from 'lucide-react';
import { CalculatedYearData } from '../services/financialModel';
import { AVAILABLE_METRICS, ChartVisualType, CustomVisualWidget } from '../services/dashboardAiService';

interface EditableChartWidgetProps {
  widget: CustomVisualWidget;
  yearlyData: CalculatedYearData[];
  currency?: string;
  isDark?: boolean;
  compact?: boolean;
  onUpdateWidget?: (updated: CustomVisualWidget) => void;
  onRemoveWidget?: (id: string) => void;
  onAddToMemo?: (title: string, insight?: string) => void;
}

const PIE_COLORS = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f43f5e'];

export default function EditableChartWidget({
  widget,
  yearlyData,
  currency = 'LE',
  isDark = false,
  compact = false,
  onUpdateWidget,
  onRemoveWidget,
  onAddToMemo
}: EditableChartWidgetProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [copiedInsight, setCopiedInsight] = useState(false);

  const formatVal = (val: number | null | undefined, unit = widget.unit) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    if (unit === 'percent') return `${val.toFixed(1)}%`;
    if (unit === 'ratio') return `${val.toFixed(2)}x`;
    const scaled = Math.round(val / 1000);
    const formatted = new Intl.NumberFormat('en-US').format(Math.abs(scaled));
    return scaled < 0 ? `(${formatted}k)` : `${formatted}k`;
  };

  const chartData = yearlyData.map(y => {
    const row: any = { year: y.year, label: `FY ${y.year}` };
    widget.metricKeys.forEach(key => {
      const metricDef = AVAILABLE_METRICS.find(m => m.key === key);
      const val = metricDef ? metricDef.getter(y) : (y as any)[key];
      row[key] = val ?? 0;
    });
    return row;
  });

  // Latest year pie data if donut
  const latestYear = yearlyData[yearlyData.length - 1];
  const pieData = widget.metricKeys.map((key, i) => {
    const metricDef = AVAILABLE_METRICS.find(m => m.key === key);
    const val = latestYear && metricDef ? metricDef.getter(latestYear) : 0;
    const label = widget.metricLabels?.[key] || metricDef?.label.split('(')[0].trim() || key;
    return {
      name: label,
      value: Math.max(0, Number(val) || 0),
      color: PIE_COLORS[i % PIE_COLORS.length]
    };
  });

  const handleTypeChange = (newType: ChartVisualType) => {
    if (onUpdateWidget) {
      onUpdateWidget({ ...widget, chartType: newType });
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl ${compact ? 'p-3' : 'p-4 sm:p-5 print:p-2.5'} shadow-xs transition-all hover:shadow-md flex flex-col justify-between print:break-inside-avoid`}>
      {/* Header with Visual Type Switcher & Controls */}
      <div>
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${compact ? 'mb-2 pb-2' : 'mb-3 pb-3 print:mb-1.5 print:pb-1.5'} border-b border-slate-100 dark:border-slate-800`}>
          <div>
            <div className="flex items-center gap-2">
              {widget.isAiGenerated && (
                <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  AI Visual
                </span>
              )}
              <h3 className={`font-bold text-slate-900 dark:text-white ${compact ? 'text-xs' : 'text-sm sm:text-base print:text-xs'}`}>
                {widget.title}
              </h3>
            </div>
            {widget.description && (
              <p className={`text-slate-500 dark:text-slate-400 mt-0.5 ${compact ? 'text-[10px]' : 'text-xs print:text-[9px]'}`}>
                {widget.description} ({currency} 000's)
              </p>
            )}
          </div>

          {/* Quick Visual Type Switcher (Hidden in Print) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 self-start sm:self-auto print:hidden">
            <button
              onClick={() => handleTypeChange('bar')}
              title="Bar Chart (عمود بياني)"
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                widget.chartType === 'bar'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleTypeChange('line')}
              title="Line Chart (خط بياني)"
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                widget.chartType === 'line'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleTypeChange('area')}
              title="Area Chart (مساحة ممتلئة)"
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                widget.chartType === 'area'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="w-3.5 h-3.5 flex items-center justify-center font-bold text-[10px]">⊿</div>
            </button>
            <button
              onClick={() => handleTypeChange('donut')}
              title="Donut / Pie Chart (دائري)"
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                widget.chartType === 'donut'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleTypeChange('table')}
              title="Data Table (جدول أرقام)"
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                widget.chartType === 'table'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            
            {onRemoveWidget && (
              <button
                onClick={() => onRemoveWidget(widget.id)}
                title="Remove Visual (حذف الرسم)"
                className="p-1.5 rounded-lg text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Chart Body */}
        <div className={`${compact ? 'h-40' : 'h-60 sm:h-64 print:h-36'} w-full my-1.5`}>
          {widget.chartType === 'bar' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.6} />
                <XAxis dataKey="label" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={v => formatVal(v, widget.unit)} />
                <Tooltip 
                  formatter={(val: any, name: any) => {
                    const label = widget.metricLabels?.[name] || name;
                    return [formatVal(Number(val), widget.unit), label];
                  }}
                  contentStyle={{ 
                    backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                    borderColor: isDark ? '#334155' : '#cbd5e1', 
                    borderRadius: '12px' 
                  }}
                />
                <Legend formatter={(value) => widget.metricLabels?.[value] || value} />
                {widget.metricKeys.map((key, idx) => (
                  <Bar 
                    key={key} 
                    dataKey={key} 
                    fill={PIE_COLORS[idx % PIE_COLORS.length]} 
                    radius={[4, 4, 0, 0]} 
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}

          {widget.chartType === 'line' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.6} />
                <XAxis dataKey="label" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={v => formatVal(v, widget.unit)} />
                <Tooltip 
                  formatter={(val: any, name: any) => {
                    const label = widget.metricLabels?.[name] || name;
                    return [formatVal(Number(val), widget.unit), label];
                  }}
                  contentStyle={{ 
                    backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                    borderColor: isDark ? '#334155' : '#cbd5e1', 
                    borderRadius: '12px' 
                  }}
                />
                <Legend formatter={(value) => widget.metricLabels?.[value] || value} />
                {widget.metricKeys.map((key, idx) => (
                  <Line 
                    key={key} 
                    type="monotone" 
                    dataKey={key} 
                    stroke={PIE_COLORS[idx % PIE_COLORS.length]} 
                    strokeWidth={3} 
                    dot={{ r: 4 }} 
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}

          {widget.chartType === 'area' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.6} />
                <XAxis dataKey="label" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={v => formatVal(v, widget.unit)} />
                <Tooltip 
                  formatter={(val: any, name: any) => {
                    const label = widget.metricLabels?.[name] || name;
                    return [formatVal(Number(val), widget.unit), label];
                  }}
                  contentStyle={{ 
                    backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                    borderColor: isDark ? '#334155' : '#cbd5e1', 
                    borderRadius: '12px' 
                  }}
                />
                <Legend formatter={(value) => widget.metricLabels?.[value] || value} />
                {widget.metricKeys.map((key, idx) => (
                  <Area 
                    key={key} 
                    type="monotone" 
                    dataKey={key} 
                    stroke={PIE_COLORS[idx % PIE_COLORS.length]} 
                    fill={PIE_COLORS[idx % PIE_COLORS.length]} 
                    fillOpacity={0.2} 
                    strokeWidth={2.5} 
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          )}

          {widget.chartType === 'donut' && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip 
                  formatter={(val: any, name: any) => [formatVal(Number(val), widget.unit), name]}
                  contentStyle={{ 
                    backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                    borderColor: isDark ? '#334155' : '#cbd5e1', 
                    borderRadius: '12px' 
                  }}
                />
                <Legend />
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}

          {widget.chartType === 'table' && (
            <div className="h-full overflow-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase">
                    <th className="py-2.5 px-3">Metric / المؤشر</th>
                    {yearlyData.map(y => (
                      <th key={y.year} className="py-2.5 px-3 text-right">FY {y.year}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {widget.metricKeys.map(key => {
                    const metricDef = AVAILABLE_METRICS.find(m => m.key === key);
                    const label = widget.metricLabels?.[key] || metricDef?.label.split('(')[0].trim() || key;
                    return (
                      <tr key={key} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                          {label}
                        </td>
                        {yearlyData.map(y => {
                          const val = metricDef ? metricDef.getter(y) : (y as any)[key];
                          return (
                            <td key={y.year} className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                              {formatVal(val, widget.unit)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Footer Insight & Memo Integration */}
      {widget.insight && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs bg-slate-50/60 dark:bg-slate-800/40 p-2.5 rounded-xl">
          <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
            <span className="font-bold text-amber-500 shrink-0">💡 ملاحظة:</span>
            <span>{widget.insight}</span>
          </div>
          {onAddToMemo && (
            <button
              onClick={() => {
                onAddToMemo(widget.title, widget.insight);
                setCopiedInsight(true);
                setTimeout(() => setCopiedInsight(false), 2000);
              }}
              className="text-[11px] font-bold text-credita dark:text-neon-blue hover:underline shrink-0 flex items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              {copiedInsight ? 'تمت الإضافة للمذكرة ✓' : 'إضافة للمذكرة'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
