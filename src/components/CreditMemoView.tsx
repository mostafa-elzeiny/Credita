import React, { useState } from 'react';
import { 
  FileText, 
  Copy, 
  Printer, 
  Check, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Plus, 
  Trash2,
  Download,
  Building2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { ModelSummary, CalculatedYearData } from '../services/financialModel';
import { CustomVisualWidget } from '../services/dashboardAiService';
import EditableChartWidget from './EditableChartWidget';

interface CreditMemoViewProps {
  model: ModelSummary;
  customVisuals: CustomVisualWidget[];
  isDark?: boolean;
}

export default function CreditMemoView({
  model,
  customVisuals,
  isDark = false
}: CreditMemoViewProps) {
  const latestYearData = model.yearlyData[model.yearlyData.length - 1] || {} as CalculatedYearData;
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [analystNotes, setAnalystNotes] = useState<string[]>([
    `أظهرت الشركة نمواً في الإيرادات لعام ${latestYearData.year} بمعدل ${(latestYearData.revenueGrowthPct || 0).toFixed(1)}% مع استقرار هامش مجمل الربح عند ${(latestYearData.grossMarginPct || 0).toFixed(1)}%.`,
    `نسبة التداول الحالية ${latestYearData.currentRatio?.toFixed(2)}x مع رأس مال عامل موجب يبلغ ${Math.round((latestYearData.workingCapital || 0) / 1000)} ألف جنيه مما يوفر مصدات سيولة كافية.`,
    `مستوى الرافعة المالية (الدين إلى حقوق الملكية) عند ${latestYearData.debtToEquity?.toFixed(2)}x يقع ضمن الحدود الائتمانية المقبولة للقطاع.`,
    `يوصى بالموافقة على التسهيل الائتماني المطلوب مع اشتراط الحفاظ على نسبة تداول لا تقل عن 1.20x ومتابعة دورية للمركز المالي.`
  ]);
  const [newNote, setNewNote] = useState('');

  const formatNum = (val: number | null | undefined, prefix = '') => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    const scaled = Math.round(val / 1000);
    const formatted = new Intl.NumberFormat('en-US').format(Math.abs(scaled));
    return scaled < 0 ? `(${formatted}k)` : `${formatted}k`;
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    setAnalystNotes(prev => [...prev, newNote.trim()]);
    setNewNote('');
  };

  const handleRemoveNote = (idx: number) => {
    setAnalystNotes(prev => prev.filter((_, i) => i !== idx));
  };

  const generateMemoMarkdown = () => {
    return `
# مذكرة لجنة الائتمان (CREDIT COMMITTEE MEMORANDUM)
===================================================
اسم العميل / الشركة: ${model.companyName}
تاريخ التحليل: ${new Date().toLocaleDateString('ar-EG')}
الفترة المالية المغطاة: ${model.reportingPeriod}
درجة الجدارة الائتمانية: ${latestYearData.creditRiskTier} (${latestYearData.creditHealthScore}/100)

1. المؤشرات المالية الرئيسية (FY ${latestYearData.year}):
- الإيرادات: ${formatNum(latestYearData.revenues)} ألف ${model.currency}
- مجمل الربح: ${formatNum(latestYearData.grossProfit)} (هامش ${latestYearData.grossMarginPct}%)
- أرباح EBITDA: ${formatNum(latestYearData.ebitda)} (هامش ${latestYearData.ebitdaMarginPct}%)
- صافي الربح: ${formatNum(latestYearData.netProfitAfterTax)} (هامش ${latestYearData.netMarginPct}%)
- إجمالي الأصول: ${formatNum(latestYearData.totalAssets)} ألف ${model.currency}
- إجمالي الخصوم: ${formatNum(latestYearData.totalLiabilities)} ألف ${model.currency}
- إجمالي حقوق الملكية: ${formatNum(latestYearData.totalEquity)} ألف ${model.currency}
- رأس المال العامل: ${formatNum(latestYearData.workingCapital)} ألف ${model.currency}

2. نسب السيولة والملاءة المالية:
- نسبة التداول الحالية (Current Ratio): ${latestYearData.currentRatio?.toFixed(2)}x
- نسبة السيولة السريعة (Quick Ratio): ${latestYearData.quickRatio?.toFixed(2)}x
- نسبة الدين إلى حقوق الملكية (Debt/Equity): ${latestYearData.debtToEquity?.toFixed(2)}x
- العائد على الأصول (ROA): ${latestYearData.roaPct}%
- العائد على حقوق الملكية (ROE): ${latestYearData.roePct}%

3. ملاحظات وتوصيات المحلل الائتماني:
${analystNotes.map(n => `- ${n}`).join('\n')}

قرار وتوصية المحلل:
- التصنيف: ${latestYearData.creditRiskTier}
- التوصية: الموافقة مع تطبيق الشروط الائتمانية المعيارية.
    `.trim();
  };

  const handleCopyMemo = () => {
    navigator.clipboard.writeText(generateMemoMarkdown());
    setCopiedMemo(true);
    setTimeout(() => setCopiedMemo(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Memo Action Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-credita/10 text-credita dark:text-neon-blue border border-credita/20 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Executive Credit Memorandum
            </span>
            <span className="text-xs text-slate-400">جاهز للعرض على لجنة الائتمان</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            مذكرة التحليل والقرار الائتماني • {model.companyName}
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyMemo}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-700"
            title="نسخ نص المذكرة للاستخدام في Word أو البريد"
          >
            {copiedMemo ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copiedMemo ? 'تم نسخ المذكرة ✓' : 'نسخ نص المذكرة'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-credita dark:bg-neon-blue text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm hover:opacity-90"
            title="طباعة المذكرة الائتمانية أو حفظها كـ PDF"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة / حفظ PDF</span>
          </button>
        </div>
      </div>

      {/* Main Printable Credit Memorandum Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-md space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Memo Header */}
        <div className="border-b-2 border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">
                CREDIT UNDERWRITING MEMORANDUM • بنك / مؤسسة تمويل
              </div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {model.companyName}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  الفترة: {model.reportingPeriod}
                </span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  العملة: {model.currency} (بالألف)
                </span>
                <span>تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}</span>
              </div>
            </div>

            {/* Credit Score & Recommendation Badge */}
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="text-center border-l border-slate-200 dark:border-slate-700 pl-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Credit Health Score</div>
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {latestYearData.creditHealthScore}
                  <span className="text-xs font-normal text-slate-400">/100</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase">Underwriting Tier</div>
                <div className="text-base font-extrabold text-slate-900 dark:text-white">
                  {latestYearData.creditRiskTier}
                </div>
                <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  موصى بالموافقة مع الضمانات
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 1. Executive Summary Financial Highlights */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <span>1. ملخص الأداء المالي والربحية (Executive Summary)</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-400">إيرادات المبيعات (Revenues)</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {formatNum(latestYearData.revenues)} {model.currency}
              </div>
              <div className="text-xs text-emerald-600 font-semibold mt-1">
                +{(latestYearData.revenueGrowthPct || 0).toFixed(1)}% YoY
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-400">أرباح EBITDA</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {formatNum(latestYearData.ebitda)} {model.currency}
              </div>
              <div className="text-xs text-sky-600 font-semibold mt-1">
                هامش {(latestYearData.ebitdaMarginPct || 0).toFixed(1)}%
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-400">صافي الربح بعد الضريبة</div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatNum(latestYearData.netProfitAfterTax)} {model.currency}
              </div>
              <div className="text-xs text-slate-500 font-semibold mt-1">
                هامش صافي {(latestYearData.netMarginPct || 0).toFixed(1)}%
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-400">رأس المال العامل الصافي</div>
              <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                {formatNum(latestYearData.workingCapital)} {model.currency}
              </div>
              <div className="text-xs text-slate-500 font-semibold mt-1">
                نسبة تداول {latestYearData.currentRatio?.toFixed(2)}x
              </div>
            </div>
          </div>
        </div>

        {/* 2. Key Underwriting Ratios Matrix */}
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
            2. جدول نسب السيولة والملاءة المالية المعيارية
          </h3>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase">
                  <th className="py-3 px-4">المؤشر المالي</th>
                  <th className="py-3 px-4">المعيار المستهدف (Benchmark)</th>
                  <th className="py-3 px-4 text-center">التقييم الحالي</th>
                  {model.years.map(y => (
                    <th key={y} className="py-3 px-4 text-right">FY {y}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">نسبة التداول (Current Ratio)</td>
                  <td className="py-3 px-4 text-slate-400">&gt; 1.50x</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600">
                    {(latestYearData.currentRatio || 0) >= 1.5 ? 'ممتاز' : 'مقبول'}
                  </td>
                  {model.yearlyData.map(d => (
                    <td key={d.year} className="py-3 px-4 text-right font-mono font-bold">
                      {d.currentRatio?.toFixed(2)}x
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">نسبة السيولة السريعة (Quick Ratio)</td>
                  <td className="py-3 px-4 text-slate-400">&gt; 1.00x</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600">
                    {(latestYearData.quickRatio || 0) >= 1.0 ? 'كافي' : 'مضغوط'}
                  </td>
                  {model.yearlyData.map(d => (
                    <td key={d.year} className="py-3 px-4 text-right font-mono font-bold">
                      {d.quickRatio?.toFixed(2)}x
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">الرافعة المالية (Debt / Equity)</td>
                  <td className="py-3 px-4 text-slate-400">&lt; 2.00x</td>
                  <td className="py-3 px-4 text-center font-bold text-indigo-600">
                    {(latestYearData.debtToEquity || 0) <= 2.0 ? 'آمن ومحافظ' : 'مرتفع'}
                  </td>
                  {model.yearlyData.map(d => (
                    <td key={d.year} className="py-3 px-4 text-right font-mono font-bold">
                      {d.debtToEquity?.toFixed(2)}x
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">العائد على حقوق الملكية (ROE)</td>
                  <td className="py-3 px-4 text-slate-400">&gt; 15%</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-600">
                    {(latestYearData.roePct || 0) >= 15 ? 'قوي' : 'معتدل'}
                  </td>
                  {model.yearlyData.map(d => (
                    <td key={d.year} className="py-3 px-4 text-right font-mono font-bold">
                      {d.roePct ? `${d.roePct}%` : '—'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Analyst Notes & Underwriting Observations */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              3. ملاحظات وتوصيات المحلل الائتماني (Analyst Takeaways)
            </h3>
            <span className="text-xs text-slate-400">قابلة للإضافة والتعديل المباشر</span>
          </div>

          <div className="space-y-2.5">
            {analystNotes.map((note, idx) => (
              <div 
                key={idx} 
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-start justify-between gap-3 text-sm text-slate-800 dark:text-slate-200 leading-relaxed"
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-credita/10 text-credita dark:text-neon-blue font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{note}</span>
                </div>
                <button
                  onClick={() => handleRemoveNote(idx)}
                  className="text-slate-400 hover:text-rose-500 transition-colors p-1 shrink-0"
                  title="حذف الملاحظة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Add note input */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                placeholder="أضف ملاحظة أو اشتراط ائتماني جديد..."
                className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-credita"
              />
              <button
                onClick={handleAddNote}
                className="px-4 py-2.5 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة ملاحظة</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4. Embedded Visual Charts in Credit Memo */}
        {customVisuals.length > 0 && (
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
              4. الرسومات والتحليلات البيانية المرفقة بالمذكرة
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {customVisuals.slice(0, 4).map(widget => (
                <EditableChartWidget
                  key={widget.id}
                  widget={widget}
                  yearlyData={model.yearlyData}
                  currency={model.currency}
                  isDark={isDark}
                />
              ))}
            </div>
          </div>
        )}

        {/* Committee Signature Block */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-8 mt-12 grid grid-cols-3 gap-6 text-center text-xs text-slate-500">
          <div>
            <div className="font-bold text-slate-900 dark:text-white mb-8">محلل الائتمان (Credit Analyst)</div>
            <div className="border-t border-slate-300 dark:border-slate-700 w-32 mx-auto pt-1">التوقيع والتاريخ</div>
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white mb-8">مدير إدارة الائتمان (Credit Manager)</div>
            <div className="border-t border-slate-300 dark:border-slate-700 w-32 mx-auto pt-1">التوقيع والتاريخ</div>
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-white mb-8">رئيس لجنة الائتمان (Head of Committee)</div>
            <div className="border-t border-slate-300 dark:border-slate-700 w-32 mx-auto pt-1">التوقيع والقرار النهائي</div>
          </div>
        </div>
      </div>
    </div>
  );
}
