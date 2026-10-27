import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  Activity, 
  ShieldAlert, 
  ShieldCheck, 
  Download, 
  FileSpreadsheet, 
  Copy, 
  Check, 
  Info, 
  Sparkles, 
  ArrowLeft, 
  Layers, 
  CheckCircle2, 
  ExternalLink,
  Play,
  ChevronRight,
  FileCode,
  Gauge,
  Percent,
  SlidersHorizontal,
  Building2,
  Calendar,
  AlertTriangle,
  Globe,
  Plus,
  Trash2,
  FileText,
  Sliders,
  Maximize2,
  Printer,
  Loader2,
  Pencil,
  RotateCcw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  AreaChart, 
  Area, 
  ComposedChart
} from 'recharts';
import { FinancialData } from '../services/gemini';
import { computeFinancialModel, CalculatedYearData } from '../services/financialModel';
import { buildCompletePowerBiSolution, PowerBiGenerationResult, generatePowerBiExcelWorkbook } from '../services/powerBiGenerator';
import { 
  CustomVisualWidget, 
  ChartVisualType, 
  AVAILABLE_METRICS 
} from '../services/dashboardAiService';
import EditableChartWidget from './EditableChartWidget';
import DashboardAICopilot from './DashboardAICopilot';
import { exportDashboardToPdf, downloadBlobReliably } from '../services/pdfExportService';

interface PowerBIDashboardProps {
  data: FinancialData[];
  onBack: () => void;
  isDark?: boolean;
  initialCompactMode?: boolean;
  onDataChange?: (updatedData: FinancialData[]) => void;
}

type ActivePage = 'overview' | 'income_statement' | 'balance_sheet' | 'ratios' | 'credit_analysis';

export default function PowerBIDashboard({ 
  data, 
  onBack, 
  isDark = false, 
  initialCompactMode = false,
  onDataChange 
}: PowerBIDashboardProps) {
  const [activePage, setActivePage] = useState<ActivePage>('overview');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [bundleResult, setBundleResult] = useState<PowerBiGenerationResult | null>(null);
  const [showDaxModal, setShowDaxModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [copiedDax, setCopiedDax] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // Web report link sharing states
  const [webReportUrl, setWebReportUrl] = useState<string | null>(null);
  const [excelWebUrl, setExcelWebUrl] = useState<string | null>(null);
  const [isPublishingWeb, setIsPublishingWeb] = useState(false);
  const [showWebModal, setShowWebModal] = useState(false);
  const [copiedWebLink, setCopiedWebLink] = useState(false);
  const [copiedExcelWebLink, setCopiedExcelWebLink] = useState(false);
  const [showMScriptModal, setShowMScriptModal] = useState(false);
  const [copiedMScript, setCopiedMScript] = useState(false);

  // Local Editable Data State
  const [editableData, setEditableData] = useState<FinancialData[]>(data);

  useEffect(() => {
    setEditableData(prev => {
      if (prev.length === data.length && JSON.stringify(prev) === JSON.stringify(data)) {
        return prev;
      }
      return data;
    });
  }, [data]);

  // Custom Editable Visuals State (Power BI Style with clean titles)
  const [customVisuals, setCustomVisuals] = useState<CustomVisualWidget[]>([
    {
      id: 'vis_sales_ebitda',
      title: 'Sales & EBITDA Earnings (المبيعات والأرباح التشغيلية)',
      description: 'Multi-year growth comparison of top-line revenues and operating cash generation',
      chartType: 'bar',
      metricKeys: ['revenues', 'ebitda'],
      metricLabels: { revenues: 'Revenues / المبيعات', ebitda: 'Operating EBITDA' },
      unit: 'currency',
      insight: 'Reflects core business capability to generate robust operational cash flow.',
      createdAt: 1,
    },
    {
      id: 'vis_capital_structure',
      title: 'Capital Structure & Funding Mix (هيكل التمويل والديون)',
      description: 'Breakdown of liabilities versus shareholders equity financing total asset base',
      chartType: 'area',
      metricKeys: ['totalLiabilities', 'totalEquity'],
      metricLabels: { totalLiabilities: 'Total Liabilities', totalEquity: 'Total Equity' },
      unit: 'currency',
      insight: 'Assesses financial leverage, capital adequacy, and balance sheet protection.',
      createdAt: 2,
    },
    {
      id: 'vis_margins',
      title: 'Profit Margins Trend (هوامش الربحية %)',
      description: 'Gross Margin, EBITDA Margin, and Net Profit Margin trajectory across fiscal years',
      chartType: 'line',
      metricKeys: ['grossMarginPct', 'ebitdaMarginPct', 'netMarginPct'],
      metricLabels: { grossMarginPct: 'Gross Margin %', ebitdaMarginPct: 'EBITDA Margin %', netMarginPct: 'Net Margin %' },
      unit: 'percent',
      insight: 'Indicates pricing power, operational efficiency, and cost absorption.',
      createdAt: 3,
    },
    {
      id: 'vis_liquidity_wc',
      title: 'Working Capital & Liquidity Cushion (رأس المال العامل والسيولة)',
      description: 'Cash and accounts receivable compared against short-term bank debt obligations',
      chartType: 'bar',
      metricKeys: ['cash', 'netReceivables', 'shortTermDebt'],
      metricLabels: { cash: 'Cash & Equivalents', netReceivables: 'Receivables', shortTermDebt: 'Short-Term Debt' },
      unit: 'currency',
      insight: 'Working capital cushion ensures immediate debt service capability without strain.',
      createdAt: 4,
    }
  ]);

  // Modal for Adding Custom Visual
  const [showAddVisualModal, setShowAddVisualModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<ChartVisualType>('bar');
  const [newMetric1, setNewMetric1] = useState('revenues');
  const [newMetric2, setNewMetric2] = useState('netProfitAfterTax');
  const [newUnit, setNewUnit] = useState<'currency' | 'percent' | 'ratio'>('currency');

  const handleAddCustomChart = (chart: CustomVisualWidget) => {
    setCustomVisuals(prev => [chart, ...prev]);
    setDownloadNotice(`✨ تمت إضافة الرسم البياني "${chart.title}" إلى الداشبورد بنجاح!`);
  };

  const handleUpdateWidget = (updated: CustomVisualWidget) => {
    setCustomVisuals(prev => prev.map(w => w.id === updated.id ? updated : w));
  };

  const handleRemoveWidget = (id: string) => {
    setCustomVisuals(prev => prev.filter(w => w.id !== id));
  };

  const handleSaveNewVisual = () => {
    if (!newTitle.trim()) return;
    const m1Def = AVAILABLE_METRICS.find(m => m.key === newMetric1);
    const m2Def = newMetric2 ? AVAILABLE_METRICS.find(m => m.key === newMetric2) : null;

    const metricKeys = [newMetric1];
    const metricLabels: Record<string, string> = {
      [newMetric1]: m1Def?.label.split('(')[0].trim() || newMetric1
    };

    if (newMetric2 && newMetric2 !== 'none' && newMetric2 !== newMetric1) {
      metricKeys.push(newMetric2);
      metricLabels[newMetric2] = m2Def?.label.split('(')[0].trim() || newMetric2;
    }

    const created: CustomVisualWidget = {
      id: `custom_${Date.now()}`,
      title: newTitle.trim(),
      chartType: newType,
      metricKeys,
      metricLabels,
      unit: newUnit,
      createdAt: Date.now()
    };

    setCustomVisuals(prev => [created, ...prev]);
    setShowAddVisualModal(false);
    setNewTitle('');
    setDownloadNotice(`✨ تمت إضافة الرسم البياني المخصص "${created.title}" إلى لوحة المؤشرات!`);
  };

  // Compute multi-year financial model from editableData
  const model = useMemo(() => computeFinancialModel(editableData), [editableData]);

  // Generation sequence using editableData
  const startPowerBiGeneration = async () => {
    setIsGenerating(true);
    setGenerationStep(1);

    try {
      await new Promise(r => setTimeout(r, 600));
      setGenerationStep(2);
      await new Promise(r => setTimeout(r, 700));
      setGenerationStep(3);
      await new Promise(r => setTimeout(r, 600));
      setGenerationStep(4);
      
      const result = await buildCompletePowerBiSolution(editableData);
      setBundleResult(result);
      
      await new Promise(r => setTimeout(r, 500));
      setGenerationStep(5);
      setGenerationComplete(true);
    } catch (err) {
      console.error('Failed to generate Power BI files:', err);
      alert('Error generating Power BI report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Run generation initially on mount to have files ready
  useEffect(() => {
    if (!bundleResult && editableData.length > 0) {
      buildCompletePowerBiSolution(editableData).then(res => {
        setBundleResult(res);
        setGenerationComplete(true);
      }).catch(console.error);
    }
  }, [editableData]);

  // Filtered year data
  const displayedYears = useMemo(() => {
    if (selectedYear === 'all') return model.yearlyData;
    return model.yearlyData.filter(d => d.year === selectedYear);
  }, [model.yearlyData, selectedYear]);

  const latestYearData = model.yearlyData[model.yearlyData.length - 1] || {} as CalculatedYearData;

  // Formatters with clean scaling, proper currency and zero mojibake
  const formatNum = (val: number | null | undefined, cur = model.currency || 'EGP') => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    let numStr = '';
    if (abs >= 1_000_000_000) {
      numStr = `${(abs / 1_000_000_000).toFixed(2)}B`;
    } else if (abs >= 1_000_000) {
      numStr = `${(abs / 1_000_000).toFixed(2)}M`;
    } else if (abs >= 1_000) {
      numStr = `${Math.round(abs / 1_000).toLocaleString('en-US')}k`;
    } else {
      numStr = `${Math.round(abs).toLocaleString('en-US')}`;
    }
    return `${cur} ${sign}${numStr}`;
  };

  // Ultra-clean Y-Axis tick formatter for charts (No overlapping, no cutoffs)
  const formatAxisNum = (v: number) => {
    if (v === 0) return '0';
    const abs = Math.abs(v);
    const sign = v < 0 ? '-' : '';
    if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)}k`;
    return `${sign}${abs}`;
  };

  const formatPct = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return `${val > 0 ? '+' : ''}${val.toFixed(1)}%`;
  };

  const formatRatio = (val: number | null | undefined) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return `${val.toFixed(2)}x`;
  };

  // Robust trigger download helper that streams via server to prevent browser magic-byte zip renaming
  const triggerDownload = (blob: Blob, filename: string, mimeType?: string) => {
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const resultStr = reader.result as string;
          const base64Data = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;
          
          const response = await fetch('/api/download-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Data, fileName: filename, mimeType })
          });

          if (response.ok) {
            const serverBlob = await response.blob();
            const url = URL.createObjectURL(serverBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 2000);
            return;
          }
        } catch (e) {
          console.warn('Server download stream failed, falling back to local blob:', e);
        }

        // Local blob fallback
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Trigger download failed:', err);
    }
  };

  const copyDaxToClipboard = () => {
    if (!bundleResult) return;
    navigator.clipboard.writeText(bundleResult.daxText);
    setCopiedDax(true);
    setTimeout(() => setCopiedDax(false), 2500);
  };

  const copyMScriptToClipboard = () => {
    if (!bundleResult) return;
    navigator.clipboard.writeText(bundleResult.mScriptText);
    setCopiedMScript(true);
    setTimeout(() => setCopiedMScript(false), 2500);
  };

  const handlePublishWebReport = async () => {
    if (!bundleResult) return;
    setIsPublishingWeb(true);
    try {
      const res = await fetch('/api/publish-web-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          htmlContent: bundleResult.htmlText,
          title: `${model.companyName} - تقرير التحليل المالي والائتماني`,
          companyName: model.companyName,
          excelBase64: bundleResult.xlsxBase64
        })
      });
      let resData: any = null;
      try {
        const text = await res.text();
        resData = JSON.parse(text);
      } catch (_) {
        throw new Error('Non-JSON response received from server');
      }

      if (resData?.success && resData?.reportUrl) {
        setWebReportUrl(resData.reportUrl);
        setExcelWebUrl(resData.excelWebUrl || null);
        setShowWebModal(true);
      } else {
        throw new Error(resData?.error || 'Failed to publish');
      }
    } catch (e) {
      console.warn('Publish web report error:', e);
      const blobUrl = URL.createObjectURL(bundleResult.htmlBlob);
      setWebReportUrl(blobUrl);
      setShowWebModal(true);
    } finally {
      setIsPublishingWeb(false);
    }
  };

  const [isCompactMode, setIsCompactMode] = useState(initialCompactMode);

  useEffect(() => {
    if (initialCompactMode !== undefined) {
      setIsCompactMode(prev => prev === initialCompactMode ? prev : initialCompactMode);
    }
  }, [initialCompactMode]);

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedCompanyName, setEditedCompanyName] = useState<string>('');
  const [editedReportingPeriod, setEditedReportingPeriod] = useState<string>('');
  const [editedCurrency, setEditedCurrency] = useState<string>('');
  const defaultCommentary = `Company exhibits steady top-line growth and resilient operating margins across fiscal periods. Balance sheet position remains stable with adequate liquidity buffers and manageable financial leverage.`;
  const [executiveCommentary, setExecutiveCommentary] = useState<string>(defaultCommentary);
  const [editedKpis, setEditedKpis] = useState<{ [key: string]: string }>({});

  const handleUpdateYearMetric = (year: number, field: string, val: number) => {
    const updated = editableData.map(item => {
      if (item.year !== year) return item;
      const copy = JSON.parse(JSON.stringify(item));
      if (field === 'revenues') {
        copy.incomeStatement.revenues = val;
        const cogs = copy.incomeStatement.costOfGoodsSold || 0;
        copy.incomeStatement.grossProfit = val - cogs;
      } else if (field === 'cogs') {
        copy.incomeStatement.costOfGoodsSold = val;
        copy.incomeStatement.grossProfit = (copy.incomeStatement.revenues || 0) - val;
      } else if (field === 'grossProfit') {
        copy.incomeStatement.grossProfit = val;
      } else if (field === 'sgaExpense') {
        copy.incomeStatement.sgaExpense = val;
      } else if (field === 'ebitda') {
        copy.incomeStatement.netOperatingProfit = val;
      } else if (field === 'netProfitAfterTax') {
        copy.incomeStatement.netProfitAfterTax = val;
      } else if (field === 'cash') {
        copy.balanceSheet.cash = val;
      } else if (field === 'totalAssets') {
        copy.balanceSheet.totalAssets = val;
      } else if (field === 'totalLiabilities') {
        copy.balanceSheet.totalLiabilities = val;
      } else if (field === 'totalEquity') {
        copy.balanceSheet.totalEquity = val;
      } else if (field === 'totalDebt') {
        copy.balanceSheet.shortTermDebt = val;
      }
      return copy;
    });
    setEditableData(updated);
    if (onDataChange) {
      onDataChange(updated);
    }
  };

  const handleResetToOriginal = () => {
    setEditableData(JSON.parse(JSON.stringify(data)));
    setEditedCompanyName('');
    setEditedReportingPeriod('');
    setEditedCurrency('');
    setExecutiveCommentary(defaultCommentary);
    setEditedKpis({});
    if (onDataChange) {
      onDataChange(data);
    }
    setDownloadNotice('تمت استعادة البيانات الأصلية للداشبورد بنجاح! ↺');
  };

  const handleDownloadDashboardExcel = async () => {
    try {
      const cleanCompany = (editedCompanyName || model.companyName || 'Corporate')
        .replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_').trim() || 'Financial';
      const fileName = `${cleanCompany}_Financial_Model.xlsx`;

      if (bundleResult?.xlsxBlob) {
        const ok = await downloadBlobReliably(bundleResult.xlsxBlob, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        if (ok) {
          setDownloadNotice('تم تنزيل شيت الإكسيل المالي الكامل بنجاح! 📊');
          return;
        }
      }

      const excelBlob = generatePowerBiExcelWorkbook(model, editableData);
      const ok = await downloadBlobReliably(excelBlob, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      if (ok) {
        setDownloadNotice('تم تنزيل شيت الإكسيل المالي الكامل بنجاح! 📊');
      }
    } catch (err) {
      console.error('Download excel failed:', err);
      alert('Failed to generate Excel file.');
    }
  };

  const handlePrintOnePage = async () => {
    setIsCompactMode(true);
    setIsExportingPdf(true);
    if (activePage !== 'overview') {
      setActivePage('overview');
    }
    // Allow React state to apply compact mode and switch to overview
    await new Promise(resolve => setTimeout(resolve, 350));
    try {
      const overrides = {
        companyName: editedCompanyName || model.companyName,
        reportingPeriod: editedReportingPeriod || model.reportingPeriod,
        currency: editedCurrency || model.currency,
        commentary: executiveCommentary,
        kpis: editedKpis
      };
      const success = await exportDashboardToPdf(
        'executive-1page-dashboard', 
        overrides.companyName || 'Corporate', 
        editableData, 
        overrides
      );
      if (success) {
        setDownloadNotice('تم تنزيل تقرير الـ PDF (صفحة واحدة A4 Fit) بنجاح مع كافة التعديلات! 📄');
      }
    } catch (err) {
      console.warn('PDF export error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Generation steps descriptions
  const stepsList = [
    { title: 'Normalizing Financial Statements', desc: 'Structuring Income Statement and Balance Sheet multi-year rows' },
    { title: 'Constructing Relational Financial Model', desc: 'Calculating Margins, DuPont, Solvency, and YoY metrics' },
    { title: 'Compiling Institutional Financial Measures', desc: 'Calibrating Liquidity, Coverage, and Credit scores' },
    { title: 'Finalizing Interactive Analytics Canvas', desc: 'Configuring charts, slicers, cards, and theme layout' },
    { title: 'Finalizing Excel Model', desc: 'Ready for presentation & export' }
  ];

  return (
    <div className={`space-y-6 ${isCompactMode ? 'print-compact-active' : ''} pb-16`}>
      {/* Top Navigation & Status Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <button 
              id="btn-back-to-spreading"
              onClick={onBack}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Return to Spreading Table"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Executive BI & Analytics
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Interactive Mode
                </span>
                {isCompactMode && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    1-Page Fit Active
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                {isEditMode ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={editedCompanyName || model.companyName}
                      onChange={e => setEditedCompanyName(e.target.value)}
                      placeholder="Company Name"
                      className="px-2.5 py-1 bg-amber-500/10 border-2 border-amber-500 rounded-lg text-slate-900 dark:text-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <input
                      type="text"
                      value={editedReportingPeriod || model.reportingPeriod}
                      onChange={e => setEditedReportingPeriod(e.target.value)}
                      placeholder="Period (e.g. FY 2022)"
                      className="w-32 px-2 py-1 bg-amber-500/10 border-2 border-amber-500 rounded-lg text-slate-900 dark:text-white font-normal text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <input
                      type="text"
                      value={editedCurrency || model.currency}
                      onChange={e => setEditedCurrency(e.target.value)}
                      placeholder="Currency (e.g. EGP, USD)"
                      className="w-24 px-2 py-1 bg-amber-500/10 border-2 border-amber-500 rounded-lg text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                ) : (
                  <>
                    <span>{editedCompanyName || model.companyName}</span>
                    <span className="text-sm font-normal text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700 pl-3">
                      {editedReportingPeriod || model.reportingPeriod} ({editedCurrency || model.currency})
                    </span>
                  </>
                )}
              </h1>
            </div>
          </div>

          {/* Clean Executive Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Download Excel Sheet */}
            <button
              id="btn-download-dashboard-excel"
              onClick={handleDownloadDashboardExcel}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all flex items-center gap-2 text-xs sm:text-sm shadow-md active:scale-95 border border-emerald-500 cursor-pointer"
              title="تنزيل نموذج التحليل المالي الكامل كملف Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
              <span>Download Excel</span>
            </button>

            {/* 2. Download 1-Page PDF */}
            <button
              id="btn-print-one-page"
              onClick={handlePrintOnePage}
              disabled={isExportingPdf}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 rounded-xl font-bold transition-all flex items-center gap-2 text-xs sm:text-sm shadow-md active:scale-95 border border-slate-700 dark:border-slate-200 disabled:opacity-75 cursor-pointer"
              title="تنزيل التقرير كملف PDF في صفحة واحدة A4 Fit"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4 text-amber-400 dark:text-amber-500" />
                  <span>📄 Download 1-Page PDF</span>
                </>
              )}
            </button>

            {/* 2. 1-Page Compact View Toggle */}
            <button
              id="btn-toggle-compact"
              onClick={() => setIsCompactMode(prev => !prev)}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 text-xs sm:text-sm border ${
                isCompactMode 
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="تصغير الأشكال لتناسب صفحة واحدة"
            >
              <Sliders className="w-4 h-4" />
              <span>{isCompactMode ? 'Standard View' : '📐 1-Page View'}</span>
            </button>

            {/* 3. Edit Mode Toggle */}
            <button
              id="btn-toggle-edit-mode"
              onClick={() => setIsEditMode(prev => !prev)}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 text-xs sm:text-sm border shadow-md active:scale-95 ${
                isEditMode
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-600 ring-2 ring-amber-400/50'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
              }`}
              title="تعديل الأرقام والنصوص في الداشبورد قبل التنزيل"
            >
              <Pencil className="w-4 h-4 text-amber-500" />
              <span>{isEditMode ? '✓ Done Editing' : '✏️ Edit Dashboard'}</span>
            </button>

            {/* 4. Reset Button (Visible in Edit Mode) */}
            {isEditMode && (
              <button
                id="btn-reset-data"
                onClick={handleResetToOriginal}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 rounded-xl font-bold transition-all flex items-center gap-1.5 text-xs sm:text-sm border border-rose-200 dark:border-rose-800/60"
                title="استعادة القيم والأرقام الأصلية"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>↺ Reset Original</span>
              </button>
            )}

            {/* 5. Add Visual */}
            <button
              id="btn-add-custom-visual"
              onClick={() => setShowAddVisualModal(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors flex items-center gap-1.5 text-xs sm:text-sm shadow-md"
              title="إضافة رسم بياني مخصص جديد"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Visual</span>
            </button>
          </div>
        </div>

        {/* Temporary Feedback Notification */}
        {downloadNotice && (
          <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-950 dark:text-emerald-200 flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-xs shrink-0">✓</span>
              <p className="font-semibold">{downloadNotice}</p>
            </div>
            <button 
              onClick={() => setDownloadNotice(null)}
              className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 text-xs font-bold shrink-0"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Generation Progress Modal (when user clicks rebuild/generate) */}
      <AnimatePresence>
        {isGenerating && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/70 dark:bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center mb-3">
                  <BarChart3 className="w-7 h-7 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Preparing Executive Financial Analytics</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Calculating KPIs, margins, and spreading models...</p>
              </div>

              <div className="space-y-4 mb-6">
                {stepsList.map((step, idx) => {
                  const isDone = generationStep > idx + 1 || generationComplete;
                  const isCurrent = generationStep === idx + 1 && !generationComplete;
                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="pt-0.5">
                        {isDone ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : isCurrent ? (
                          <div className="w-5 h-5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800" />
                        )}
                      </div>
                      <div>
                        <div className={`text-sm font-semibold ${isDone ? 'text-emerald-700 dark:text-emerald-400' : isCurrent ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                          {step.title}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{step.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dashboard Sub-Header: Page Tabs & Year Slicer (Hidden during print) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 print:hidden">
        {/* Navigation Tabs (6 Pages) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            id="tab-overview"
            onClick={() => setActivePage('overview')}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activePage === 'overview'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>1. Executive Overview</span>
          </button>

          <button
            id="tab-income"
            onClick={() => setActivePage('income_statement')}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activePage === 'income_statement'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>2. Income Statement</span>
          </button>

          <button
            id="tab-balance"
            onClick={() => setActivePage('balance_sheet')}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activePage === 'balance_sheet'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>3. Balance Sheet</span>
          </button>

          <button
            id="tab-ratios"
            onClick={() => setActivePage('ratios')}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activePage === 'ratios'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>4. Financial Ratios</span>
          </button>

          <button
            id="tab-credit"
            onClick={() => setActivePage('credit_analysis')}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
              activePage === 'credit_analysis'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>5. Credit Analysis</span>
          </button>

        </div>

        {/* Year Filter Slicer */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Year Filter:</span>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setSelectedYear('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedYear === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Years
            </button>
            {model.years.map(yr => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedYear === yr
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                FY {yr}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PAGE 1: FINANCIAL OVERVIEW                                                */}
      {/* ========================================================================= */}
      {activePage === 'overview' && (
        <motion.div 
          id="executive-1page-dashboard"
          key="overview"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`space-y-6 ${isExportingPdf ? 'bg-white text-slate-900 p-4 rounded-xl' : ''}`}
        >
          {/* Institutional Header for 1-Page PDF */}
          <div className={`${isExportingPdf ? 'flex' : 'hidden print:flex'} items-center justify-between border-b-2 border-slate-900 pb-2 mb-2 bg-white text-slate-900`}>
            <div>
              <div className="text-[10px] uppercase font-black tracking-widest text-indigo-600">
                CR FINANCIAL SPREADING & CREDIT ANALYTICS
              </div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">
                {editedCompanyName || model.companyName || 'Corporate Client'} — Executive Financial Dashboard
              </h1>
              <p className="text-[10px] text-slate-600">
                Reporting Period: <span className="font-bold">{editedReportingPeriod || model.reportingPeriod}</span> | Currency: <span className="font-bold">{editedCurrency || model.currency}</span> | FY {displayedYears.map(y => y.year).join(', ')}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-slate-900 text-white">
                Institutional 1-Page Summary
              </span>
              <div className="text-[9px] text-slate-500 mt-0.5">
                Printed: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Executive Commentary & Analysis Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Executive Financial Analysis & Commentary (التحليل والتعليق المالي)
                </h3>
              </div>
              <button
                onClick={() => setIsEditMode(prev => !prev)}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 print:hidden cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>{isEditMode ? 'Close Editor' : 'Edit Analysis'}</span>
              </button>
            </div>

            {isEditMode ? (
              <div className="space-y-2">
                <textarea
                  value={executiveCommentary}
                  onChange={e => setExecutiveCommentary(e.target.value)}
                  rows={2}
                  placeholder="Enter executive commentary, credit notes, or key findings..."
                  className="w-full p-3 rounded-xl border-2 border-indigo-500/50 bg-indigo-50/20 dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>💡 This commentary updates live and appears on the printed 1-Page PDF report.</span>
                  <button 
                    onClick={() => setExecutiveCommentary(defaultCommentary)}
                    className="hover:text-indigo-600 underline cursor-pointer"
                  >
                    Reset default note
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                "{executiveCommentary}"
              </p>
            )}
          </div>

          {/* Quick Financial Numbers & Chart Data Editor (Visible in Edit Mode) */}
          {isEditMode && (
            <div className="bg-amber-500/5 dark:bg-amber-950/20 border-2 border-amber-500/30 rounded-2xl p-4 sm:p-5 space-y-3 print:hidden">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-amber-500 text-slate-950">
                      Live Data Editor
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Quick Financial Data & Chart Metrics (تعديل أرقام القوائم والرسوم)
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Modifying any number immediately recalculates margins, KPIs, and updates the charts below in real-time.
                  </p>
                </div>
                <button
                  onClick={handleResetToOriginal}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded-lg text-xs font-bold border border-rose-200 dark:border-rose-800/60 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to Original</span>
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-amber-500/20 bg-white dark:bg-slate-900">
                <table className="w-full text-xs text-left">
                  <thead className="bg-amber-500/10 text-slate-700 dark:text-slate-200 font-bold border-b border-amber-500/20">
                    <tr>
                      <th className="py-2.5 px-3">FY / Year</th>
                      <th className="py-2.5 px-3">Revenues (المبيعات)</th>
                      <th className="py-2.5 px-3">Cost of Goods (التكلفة)</th>
                      <th className="py-2.5 px-3">Gross Profit (مجمل الربح)</th>
                      <th className="py-2.5 px-3">Operating EBITDA</th>
                      <th className="py-2.5 px-3">Net Profit (صافي الربح)</th>
                      <th className="py-2.5 px-3">Cash & Equivalents</th>
                      <th className="py-2.5 px-3">Total Assets (الأصول)</th>
                      <th className="py-2.5 px-3">Total Liabilities (الخصوم)</th>
                      <th className="py-2.5 px-3">Total Equity (الملكية)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {editableData.map((d) => (
                      <tr key={d.year} className="hover:bg-amber-500/5">
                        <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                          FY {d.year}
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={d.incomeStatement.revenues || 0}
                            onChange={e => handleUpdateYearMetric(d.year, 'revenues', Number(e.target.value))}
                            className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-bold text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-amber-500"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={d.incomeStatement.costOfGoodsSold || 0}
                            onChange={e => handleUpdateYearMetric(d.year, 'cogs', Number(e.target.value))}
                            className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-bold text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-amber-500"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={d.incomeStatement.grossProfit || 0}
                            onChange={e => handleUpdateYearMetric(d.year, 'grossProfit', Number(e.target.value))}
                            className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-bold text-emerald-600 dark:text-emerald-400 text-xs focus:ring-1 focus:ring-amber-500"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={d.incomeStatement.netOperatingProfit || 0}
                            onChange={e => handleUpdateYearMetric(d.year, 'ebitda', Number(e.target.value))}
                            className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-bold text-indigo-600 dark:text-indigo-400 text-xs focus:ring-1 focus:ring-amber-500"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={d.incomeStatement.netProfitAfterTax || 0}
                            onChange={e => handleUpdateYearMetric(d.year, 'netProfitAfterTax', Number(e.target.value))}
                            className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-bold text-amber-600 dark:text-amber-400 text-xs focus:ring-1 focus:ring-amber-500"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={d.balanceSheet.cash || 0}
                            onChange={e => handleUpdateYearMetric(d.year, 'cash', Number(e.target.value))}
                            className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-bold text-teal-600 dark:text-teal-400 text-xs focus:ring-1 focus:ring-amber-500"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={d.balanceSheet.totalAssets || 0}
                            onChange={e => handleUpdateYearMetric(d.year, 'totalAssets', Number(e.target.value))}
                            className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-bold text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-amber-500"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={d.balanceSheet.totalLiabilities || 0}
                            onChange={e => handleUpdateYearMetric(d.year, 'totalLiabilities', Number(e.target.value))}
                            className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-bold text-rose-600 dark:text-rose-400 text-xs focus:ring-1 focus:ring-amber-500"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={d.balanceSheet.totalEquity || 0}
                            onChange={e => handleUpdateYearMetric(d.year, 'totalEquity', Number(e.target.value))}
                            className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-bold text-indigo-600 dark:text-indigo-400 text-xs focus:ring-1 focus:ring-amber-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 8 Executive KPI Cards */}
          <div className={`grid ${isCompactMode ? 'grid-cols-4 lg:grid-cols-8 gap-2 print:grid-cols-8 print:gap-1.5' : 'grid-cols-2 md:grid-cols-4 gap-4'}`}>
            {/* 1. Revenue */}
            <div className={`bg-white dark:bg-slate-900 border ${isEditMode ? 'border-amber-400 dark:border-amber-600' : 'border-slate-200 dark:border-slate-800'} ${isCompactMode ? 'p-2.5 print:p-1.5 rounded-xl' : 'p-5 rounded-2xl'} shadow-xs transition-colors`}>
              <div className={`${isCompactMode ? 'text-[10px] print:text-[8px] mb-0.5' : 'text-xs mb-1'} font-bold text-slate-500 uppercase tracking-wider`}>Revenue</div>
              <div className={`${isCompactMode ? 'text-base sm:text-lg print:text-sm' : 'text-2xl'} font-extrabold text-slate-900 dark:text-white`}>
                {formatNum(latestYearData.revenues)}
              </div>
              <div className={`flex items-center gap-1 ${isCompactMode ? 'mt-1' : 'mt-2'}`}>
                <span className={`${isCompactMode ? 'text-[9px] print:text-[7.5px] px-1 py-0' : 'text-xs px-2 py-0.5'} font-bold rounded-md ${
                  (latestYearData.revenueGrowthPct || 0) >= 0 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                }`}>
                  {formatPct(latestYearData.revenueGrowthPct)} YoY
                </span>
                <span className={`${isCompactMode ? 'text-[9px] print:text-[7.5px]' : 'text-[11px]'} text-slate-400`}>FY {latestYearData.year}</span>
              </div>
            </div>

            {/* 2. Gross Profit */}
            <div className={`bg-white dark:bg-slate-900 border ${isEditMode ? 'border-amber-400 dark:border-amber-600' : 'border-slate-200 dark:border-slate-800'} ${isCompactMode ? 'p-2.5 print:p-1.5 rounded-xl' : 'p-5 rounded-2xl'} shadow-xs transition-colors`}>
              <div className={`${isCompactMode ? 'text-[10px] print:text-[8px] mb-0.5' : 'text-xs mb-1'} font-bold text-slate-500 uppercase tracking-wider`}>Gross Profit</div>
              <div className={`${isCompactMode ? 'text-base sm:text-lg print:text-sm' : 'text-2xl'} font-extrabold text-slate-900 dark:text-white`}>
                {formatNum(latestYearData.grossProfit)}
              </div>
              <div className={`flex items-center gap-1 ${isCompactMode ? 'mt-1' : 'mt-2'}`}>
                <span className={`${isCompactMode ? 'text-[9px] print:text-[7.5px] px-1 py-0' : 'text-xs px-2 py-0.5'} font-bold rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400`}>
                  {latestYearData.grossMarginPct ? `${latestYearData.grossMarginPct}%` : '—'}
                </span>
                <span className={`${isCompactMode ? 'text-[9px] print:text-[7.5px]' : 'text-[11px]'} text-slate-400`}>FY {latestYearData.year}</span>
              </div>
            </div>

            {/* 3. EBITDA */}
            <div className={`bg-white dark:bg-slate-900 border ${isEditMode ? 'border-amber-400 dark:border-amber-600' : 'border-slate-200 dark:border-slate-800'} ${isCompactMode ? 'p-2.5 print:p-1.5 rounded-xl' : 'p-5 rounded-2xl'} shadow-xs transition-colors`}>
              <div className={`${isCompactMode ? 'text-[10px] print:text-[8px] mb-0.5' : 'text-xs mb-1'} font-bold text-slate-500 uppercase tracking-wider`}>EBITDA</div>
              <div className={`${isCompactMode ? 'text-base sm:text-lg print:text-sm' : 'text-2xl'} font-extrabold text-slate-900 dark:text-white`}>
                {formatNum(latestYearData.ebitda)}
              </div>
              <div className={`flex items-center gap-1 ${isCompactMode ? 'mt-1' : 'mt-2'}`}>
                <span className={`${isCompactMode ? 'text-[9px] print:text-[7.5px] px-1 py-0' : 'text-xs px-2 py-0.5'} font-bold rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400`}>
                  {latestYearData.ebitdaMarginPct ? `${latestYearData.ebitdaMarginPct}%` : '—'}
                </span>
                <span className={`${isCompactMode ? 'text-[9px] print:text-[7.5px]' : 'text-[11px]'} text-slate-400`}>FY {latestYearData.year}</span>
              </div>
            </div>

            {/* 4. Net Profit */}
            <div className={`bg-white dark:bg-slate-900 border ${isEditMode ? 'border-amber-400 dark:border-amber-600' : 'border-slate-200 dark:border-slate-800'} ${isCompactMode ? 'p-2.5 print:p-1.5 rounded-xl' : 'p-5 rounded-2xl'} shadow-xs transition-colors`}>
              <div className={`${isCompactMode ? 'text-[10px] print:text-[8px] mb-0.5' : 'text-xs mb-1'} font-bold text-slate-500 uppercase tracking-wider`}>Net Profit</div>
              <div className={`${isCompactMode ? 'text-base sm:text-lg print:text-sm' : 'text-2xl'} font-extrabold ${latestYearData.netProfitAfterTax >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                {formatNum(latestYearData.netProfitAfterTax)}
              </div>
              <div className={`flex items-center gap-1 ${isCompactMode ? 'mt-1' : 'mt-2'}`}>
                <span className={`${isCompactMode ? 'text-[9px] print:text-[7.5px] px-1 py-0' : 'text-xs px-2 py-0.5'} font-bold rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400`}>
                  {latestYearData.netMarginPct ? `${latestYearData.netMarginPct}%` : '—'}
                </span>
                <span className={`${isCompactMode ? 'text-[9px] print:text-[7.5px]' : 'text-[11px]'} text-slate-400`}>FY {latestYearData.year}</span>
              </div>
            </div>

            {/* 5. Total Assets */}
            <div className={`bg-white dark:bg-slate-900 border ${isEditMode ? 'border-amber-400 dark:border-amber-600' : 'border-slate-200 dark:border-slate-800'} ${isCompactMode ? 'p-2.5 print:p-1.5 rounded-xl' : 'p-5 rounded-2xl'} shadow-xs transition-colors`}>
              <div className={`${isCompactMode ? 'text-[10px] print:text-[8px] mb-0.5' : 'text-xs mb-1'} font-bold text-slate-500 uppercase tracking-wider`}>Total Assets</div>
              <div className={`${isCompactMode ? 'text-base sm:text-lg print:text-sm' : 'text-2xl'} font-extrabold text-slate-900 dark:text-white`}>
                {formatNum(latestYearData.totalAssets)}
              </div>
              <div className={`flex items-center gap-1 ${isCompactMode ? 'mt-1' : 'mt-2'}`}>
                <span className={`${isCompactMode ? 'text-[9px] print:text-[7.5px] px-1 py-0' : 'text-xs px-2 py-0.5'} font-bold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300`}>
                  ROA: {latestYearData.roaPct ? `${latestYearData.roaPct}%` : '—'}
                </span>
                <span className={`${isCompactMode ? 'text-[9px] print:text-[7.5px]' : 'text-[11px]'} text-slate-400`}>FY {latestYearData.year}</span>
              </div>
            </div>

            {/* 6. Total Liabilities */}
            <div className={`bg-white dark:bg-slate-900 border ${isEditMode ? 'border-amber-400 dark:border-amber-600' : 'border-slate-200 dark:border-slate-800'} ${isCompactMode ? 'p-2.5 print:p-1.5 rounded-xl' : 'p-5 rounded-2xl'} shadow-xs transition-colors`}>
              <div className={`${isCompactMode ? 'text-[10px] print:text-[8px] mb-0.5' : 'text-xs mb-1'} font-bold text-slate-500 uppercase tracking-wider`}>Total Liabilities</div>
              <div className={`${isCompactMode ? 'text-base sm:text-lg print:text-sm' : 'text-2xl'} font-extrabold text-slate-900 dark:text-white`}>
                {formatNum(latestYearData.totalLiabilities)}
              </div>
              <div className={`flex items-center gap-1 ${isCompactMode ? 'mt-1' : 'mt-2'}`}>
                <span className={`${isCompactMode ? 'text-[9px] print:text-[7.5px] px-1 py-0' : 'text-xs px-2 py-0.5'} font-bold rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400`}>
                  Debt: {formatNum(latestYearData.totalDebt)}
                </span>
                <span className={`${isCompactMode ? 'text-[9px] print:text-[7.5px]' : 'text-[11px]'} text-slate-400`}>FY {latestYearData.year}</span>
              </div>
            </div>

            {/* 7. Equity */}
            <div className={`bg-white dark:bg-slate-900 border ${isEditMode ? 'border-amber-400 dark:border-amber-600' : 'border-slate-200 dark:border-slate-800'} ${isCompactMode ? 'p-2.5 print:p-1.5 rounded-xl' : 'p-5 rounded-2xl'} shadow-xs transition-colors`}>
              <div className={`${isCompactMode ? 'text-[10px] print:text-[8px] mb-0.5' : 'text-xs mb-1'} font-bold text-slate-500 uppercase tracking-wider`}>Total Equity</div>
              <div className={`${isCompactMode ? 'text-base sm:text-lg print:text-sm' : 'text-2xl'} font-extrabold text-slate-900 dark:text-white`}>
                {formatNum(latestYearData.totalEquity)}
              </div>
              <div className={`flex items-center gap-1 ${isCompactMode ? 'mt-1' : 'mt-2'}`}>
                <span className={`${isCompactMode ? 'text-[9px] print:text-[7.5px] px-1 py-0' : 'text-xs px-2 py-0.5'} font-bold rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400`}>
                  ROE: {latestYearData.roePct ? `${latestYearData.roePct}%` : '—'}
                </span>
                <span className={`${isCompactMode ? 'text-[9px] print:text-[7.5px]' : 'text-[11px]'} text-slate-400`}>FY {latestYearData.year}</span>
              </div>
            </div>

            {/* 8. Cash */}
            <div className={`bg-white dark:bg-slate-900 border ${isEditMode ? 'border-amber-400 dark:border-amber-600' : 'border-slate-200 dark:border-slate-800'} ${isCompactMode ? 'p-2.5 print:p-1.5 rounded-xl' : 'p-5 rounded-2xl'} shadow-xs transition-colors`}>
              <div className={`${isCompactMode ? 'text-[10px] print:text-[8px] mb-0.5' : 'text-xs mb-1'} font-bold text-slate-500 uppercase tracking-wider`}>Cash & Equivalents</div>
              <div className={`${isCompactMode ? 'text-base sm:text-lg print:text-sm' : 'text-2xl'} font-extrabold text-slate-900 dark:text-white`}>
                {formatNum(latestYearData.cash)}
              </div>
              <div className={`flex items-center gap-1 ${isCompactMode ? 'mt-1' : 'mt-2'}`}>
                <span className={`${isCompactMode ? 'text-[9px] print:text-[7.5px] px-1 py-0' : 'text-xs px-2 py-0.5'} font-bold rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400`}>
                  Net: {formatNum(latestYearData.netDebt)}
                </span>
                <span className={`${isCompactMode ? 'text-[9px] print:text-[7.5px]' : 'text-[11px]'} text-slate-400`}>FY {latestYearData.year}</span>
              </div>
            </div>
          </div>

          {/* Charts Row with Clear Layout and Full Visibility */}
          <div className={`grid grid-cols-1 lg:grid-cols-3 ${isCompactMode ? 'gap-3 print:gap-2' : 'gap-6'}`}>
            {/* Revenue & Profit Multi-Year Bar/Line */}
            <div className={`lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${isCompactMode ? 'p-3.5 print:p-2 rounded-xl' : 'p-6 rounded-2xl'} shadow-xs`}>
              <div className={`flex items-center justify-between ${isCompactMode ? 'mb-2' : 'mb-4'}`}>
                <div>
                  <h3 className={`font-bold text-slate-900 dark:text-white ${isCompactMode ? 'text-xs sm:text-sm' : 'text-base'}`}>Revenue vs. Gross Profit vs. Net Profit</h3>
                  <p className="text-[10px] text-slate-500">Multi-year trend analysis ({editedCurrency || model.currency})</p>
                </div>
              </div>
              <div className={`${isCompactMode ? 'h-44 print:h-36' : 'h-72'} w-full`}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={displayedYears} margin={{ top: 12, right: 25, left: 15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.6} />
                    <XAxis dataKey="year" tickFormatter={y => `FY ${y}`} stroke="#94a3b8" tick={{ fontSize: isCompactMode ? 10 : 12, fontWeight: 600 }} />
                    <YAxis tickFormatter={formatAxisNum} stroke="#94a3b8" tick={{ fontSize: isCompactMode ? 10 : 12 }} />
                    <Tooltip 
                      formatter={(val: any) => [formatNum(Number(val)), '']}
                      labelFormatter={label => `Fiscal Year ${label}`}
                      contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#334155' : '#cbd5e1', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ fontSize: isCompactMode ? '10px' : '12px', fontWeight: 600 }} />
                    <Bar dataKey="revenues" name="Revenue" fill="#0078D4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="grossProfit" name="Gross Profit" fill="#107C41" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="netProfitAfterTax" name="Net Profit" stroke="#D83B01" strokeWidth={isCompactMode ? 2.5 : 3.5} dot={{ r: isCompactMode ? 3.5 : 5, fill: '#D83B01' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Balance Sheet Capital Structure */}
            <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${isCompactMode ? 'p-3.5 print:p-2 rounded-xl' : 'p-6 rounded-2xl'} shadow-xs`}>
              <div className={`flex items-center justify-between ${isCompactMode ? 'mb-2' : 'mb-4'}`}>
                <div>
                  <h3 className={`font-bold text-slate-900 dark:text-white ${isCompactMode ? 'text-xs sm:text-sm' : 'text-base'}`}>Capital Structure</h3>
                  <p className="text-[10px] text-slate-500">Liabilities vs. Equity composition ({editedCurrency || model.currency})</p>
                </div>
              </div>
              <div className={`${isCompactMode ? 'h-44 print:h-36' : 'h-72'} w-full`}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={displayedYears} margin={{ top: 12, right: 20, left: 15, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.6} />
                    <XAxis dataKey="year" tickFormatter={y => `FY ${y}`} stroke="#94a3b8" tick={{ fontSize: isCompactMode ? 10 : 12, fontWeight: 600 }} />
                    <YAxis tickFormatter={formatAxisNum} stroke="#94a3b8" tick={{ fontSize: isCompactMode ? 10 : 12 }} />
                    <Tooltip 
                      formatter={(val: any) => [formatNum(Number(val)), '']}
                      contentStyle={{ backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#334155' : '#cbd5e1', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ fontSize: isCompactMode ? '10px' : '12px', fontWeight: 600 }} />
                    <Bar dataKey="totalLiabilities" name="Liabilities" stackId="a" fill="#E11D48" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="totalEquity" name="Equity" stackId="a" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* EDITABLE VISUALS CANVAS (استوديو الرسوم البيانية التفاعلي)                */}
          {/* ========================================================================= */}
          <div className={`pt-4 border-t border-slate-200 dark:border-slate-800 ${isCompactMode ? 'space-y-3' : 'space-y-6'} ${isExportingPdf ? 'hidden' : ''} print:hidden`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-indigo-500/10 via-slate-50 to-slate-100 dark:from-indigo-500/10 dark:via-slate-900 dark:to-slate-900/90 ${isCompactMode ? 'p-3 rounded-xl' : 'p-5 rounded-2xl'} border border-indigo-500/20 print:hidden`}>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-600 text-white uppercase tracking-wide">
                    Visual Studio
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Interactive Dynamic Charts
                  </span>
                </div>
                <h3 className={`${isCompactMode ? 'text-base' : 'text-lg'} font-bold text-slate-900 dark:text-white`}>
                  استوديو الرسوم البيانية المالي التفاعلي (Interactive Visual Studio)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  يمكنك تخصيص وتعديل أي رسم بياني فوراً أو إضافة مؤشرات جديدة لمذكرتك الائتمانية عبر مساعد التحليل الذكي.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  onClick={() => setShowAddVisualModal(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-amber-400 dark:text-amber-500" />
                  <span>+ إضافة رسم مخصص</span>
                </button>
              </div>
            </div>

            {/* Grid of Editable Visuals */}
            <div className={`grid grid-cols-1 ${isCompactMode ? 'lg:grid-cols-3 gap-3 print:grid-cols-2 print:gap-2' : 'lg:grid-cols-2 gap-6'}`}>
              {customVisuals.map(widget => (
                <EditableChartWidget
                  key={widget.id}
                  widget={widget}
                  yearlyData={displayedYears}
                  currency={model.currency}
                  isDark={isDark}
                  compact={isCompactMode}
                  onUpdateWidget={handleUpdateWidget}
                  onRemoveWidget={handleRemoveWidget}
                  onAddToMemo={(title) => {
                    setDownloadNotice(`تمت إضافة "${title}" مع ملاحظتها إلى مسودة المذكرة الائتمانية!`);
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 2: INCOME STATEMENT ANALYSIS                                         */}
      {/* ========================================================================= */}
      {activePage === 'income_statement' && (
        <motion.div 
          key="income"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trend of Revenues, Gross Profit, EBITDA, Net Profit */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs">
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">Earnings & Operating Trends</h3>
              <p className="text-xs text-slate-500 mb-4">Evolution of top-line through bottom-line performance</p>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={displayedYears} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.6} />
                    <XAxis dataKey="year" tickFormatter={y => `FY ${y}`} stroke="#94a3b8" />
                    <YAxis tickFormatter={v => `${Math.round(v / 1000)}k`} stroke="#94a3b8" />
                    <Tooltip formatter={(v: any) => [formatNum(Number(v)), '']} />
                    <Legend />
                    <Line type="monotone" dataKey="revenues" name="Revenue" stroke="#0284c7" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="grossProfit" name="Gross Profit" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="ebitda" name="EBITDA" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="netProfitAfterTax" name="Net Profit" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Profit Margin Trends (%) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs">
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">Profit Margins Evolution (%)</h3>
              <p className="text-xs text-slate-500 mb-4">Gross Margin vs. EBITDA Margin vs. Net Profit Margin</p>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={displayedYears} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.6} />
                    <XAxis dataKey="year" tickFormatter={y => `FY ${y}`} stroke="#94a3b8" />
                    <YAxis tickFormatter={v => `${v}%`} domain={[0, 'auto']} stroke="#94a3b8" />
                    <Tooltip formatter={(v: any) => [`${Number(v).toFixed(1)}%`, '']} />
                    <Legend />
                    <Line type="monotone" dataKey="grossMarginPct" name="Gross Margin %" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="ebitdaMarginPct" name="EBITDA Margin %" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="netMarginPct" name="Net Margin %" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* YoY Growth Rates */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">Year-over-Year Growth Rates (%)</h3>
            <p className="text-xs text-slate-500 mb-4">Growth acceleration or slowdown across reporting periods</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayedYears} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.6} />
                  <XAxis dataKey="year" tickFormatter={y => `FY ${y}`} stroke="#94a3b8" />
                  <YAxis tickFormatter={v => `${v}%`} stroke="#94a3b8" />
                  <Tooltip formatter={(v: any) => [`${Number(v).toFixed(1)}%`, '']} />
                  <Legend />
                  <Bar dataKey="revenueGrowthPct" name="Revenue Growth %" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="grossProfitGrowthPct" name="Gross Profit Growth %" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="netProfitGrowthPct" name="Net Profit Growth %" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 3: BALANCE SHEET ANALYSIS                                            */}
      {/* ========================================================================= */}
      {activePage === 'balance_sheet' && (
        <motion.div 
          key="balance"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assets Composition */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs">
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">Assets Composition</h3>
              <p className="text-xs text-slate-500 mb-4">Breakdown between Current Assets (Cash, Receivables, Inventory) and PP&E</p>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={displayedYears} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.6} />
                    <XAxis dataKey="year" tickFormatter={y => `FY ${y}`} stroke="#94a3b8" />
                    <YAxis tickFormatter={v => `${Math.round(v / 1000)}k`} stroke="#94a3b8" />
                    <Tooltip formatter={(v: any) => [formatNum(Number(v)), '']} />
                    <Legend />
                    <Bar dataKey="cash" name="Cash" stackId="assets" fill="#10b981" />
                    <Bar dataKey="netReceivables" name="Receivables" stackId="assets" fill="#0284c7" />
                    <Bar dataKey="totalInventory" name="Inventory" stackId="assets" fill="#f59e0b" />
                    <Bar dataKey="netPpe" name="Net PP&E" stackId="assets" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Liabilities & Equity Mix */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs">
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">Liabilities & Equity Funding</h3>
              <p className="text-xs text-slate-500 mb-4">Short-term vs. Long-term debt obligations vs. Equity</p>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={displayedYears} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.6} />
                    <XAxis dataKey="year" tickFormatter={y => `FY ${y}`} stroke="#94a3b8" />
                    <YAxis tickFormatter={v => `${Math.round(v / 1000)}k`} stroke="#94a3b8" />
                    <Tooltip formatter={(v: any) => [formatNum(Number(v)), '']} />
                    <Legend />
                    <Bar dataKey="shortTermDebt" name="Short-Term Debt" stackId="liab" fill="#f43f5e" />
                    <Bar dataKey="totalLongTermDebt" name="Long-Term Debt" stackId="liab" fill="#fb923c" />
                    <Bar dataKey="totalEquity" name="Total Equity" stackId="liab" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Working Capital & Debt Evolution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Working Capital Trend */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs">
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">Working Capital Evolution</h3>
              <p className="text-xs text-slate-500 mb-4">Current Assets minus Current Liabilities buffer</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={displayedYears} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.6} />
                    <XAxis dataKey="year" tickFormatter={y => `FY ${y}`} stroke="#94a3b8" />
                    <YAxis tickFormatter={v => `${Math.round(v / 1000)}k`} stroke="#94a3b8" />
                    <Tooltip formatter={(v: any) => [formatNum(Number(v)), '']} />
                    <Area type="monotone" dataKey="workingCapital" name="Net Working Capital" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Total Debt vs Net Debt */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs">
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">Debt Burden Evolution</h3>
              <p className="text-xs text-slate-500 mb-4">Total Financial Debt vs. Net Debt (after Cash deduction)</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={displayedYears} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} opacity={0.6} />
                    <XAxis dataKey="year" tickFormatter={y => `FY ${y}`} stroke="#94a3b8" />
                    <YAxis tickFormatter={v => `${Math.round(v / 1000)}k`} stroke="#94a3b8" />
                    <Tooltip formatter={(v: any) => [formatNum(Number(v)), '']} />
                    <Legend />
                    <Line type="monotone" dataKey="totalDebt" name="Total Debt" stroke="#e11d48" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="netDebt" name="Net Debt" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 4: FINANCIAL RATIOS                                                  */}
      {/* ========================================================================= */}
      {activePage === 'ratios' && (
        <motion.div 
          key="ratios"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Key Ratio Cards with Benchmarks */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Current Ratio */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-500 uppercase">Current Ratio</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">Benchmark &gt; 1.5x</span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {formatRatio(latestYearData.currentRatio)}
              </div>
              <div className="mt-2 text-xs">
                {(latestYearData.currentRatio || 0) >= 1.5 ? (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Healthy Liquidity
                  </span>
                ) : (latestYearData.currentRatio || 0) >= 1.0 ? (
                  <span className="text-amber-500 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Adequate Buffer
                  </span>
                ) : (
                  <span className="text-rose-500 font-semibold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Liquidity Deficit
                  </span>
                )}
              </div>
            </div>

            {/* Quick Ratio */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-500 uppercase">Quick Ratio</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">Benchmark &gt; 1.0x</span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {formatRatio(latestYearData.quickRatio)}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Cash + Receivables to Current Liab
              </div>
            </div>

            {/* Debt to Equity */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-500 uppercase">Debt-to-Equity</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">Target &lt; 2.0x</span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {formatRatio(latestYearData.debtToEquity)}
              </div>
              <div className="mt-2 text-xs">
                {(latestYearData.debtToEquity || 0) <= 1.5 ? (
                  <span className="text-emerald-600 font-semibold">Conservative Solvency</span>
                ) : (latestYearData.debtToEquity || 0) <= 2.5 ? (
                  <span className="text-amber-500 font-semibold">Moderate Leverage</span>
                ) : (
                  <span className="text-rose-500 font-semibold">High Leverage</span>
                )}
              </div>
            </div>

            {/* ROE */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-500 uppercase">Return on Equity</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">Target &gt; 15%</span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {latestYearData.roePct !== null ? `${latestYearData.roePct}%` : '—'}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                ROA: {latestYearData.roaPct !== null ? `${latestYearData.roaPct}%` : '—'}
              </div>
            </div>
          </div>

          {/* Ratio Comparison Matrix Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white">Financial Ratio Summary Matrix</h3>
              <p className="text-xs text-slate-500">Multi-year comparison with standard banking underwriting benchmarks</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4 font-bold">Category</th>
                    <th className="py-3 px-4 font-bold">Ratio</th>
                    <th className="py-3 px-4 font-bold">Benchmark</th>
                    {model.years.map(y => (
                      <th key={y} className="py-3 px-4 font-bold text-right">FY {y}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {/* Liquidity */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white" rowSpan={3}>Liquidity</td>
                    <td className="py-3 px-4 font-medium">Current Ratio</td>
                    <td className="py-3 px-4 text-xs text-slate-400">&gt; 1.50x</td>
                    {model.yearlyData.map(d => (
                      <td key={d.year} className="py-3 px-4 text-right font-mono font-semibold">
                        {formatRatio(d.currentRatio)}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-medium">Quick Ratio</td>
                    <td className="py-3 px-4 text-xs text-slate-400">&gt; 1.00x</td>
                    {model.yearlyData.map(d => (
                      <td key={d.year} className="py-3 px-4 text-right font-mono font-semibold">
                        {formatRatio(d.quickRatio)}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-medium">Cash Ratio</td>
                    <td className="py-3 px-4 text-xs text-slate-400">&gt; 0.20x</td>
                    {model.yearlyData.map(d => (
                      <td key={d.year} className="py-3 px-4 text-right font-mono font-semibold">
                        {formatRatio(d.cashRatio)}
                      </td>
                    ))}
                  </tr>

                  {/* Solvency */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white" rowSpan={3}>Leverage & Solvency</td>
                    <td className="py-3 px-4 font-medium">Debt-to-Equity</td>
                    <td className="py-3 px-4 text-xs text-slate-400">&lt; 2.00x</td>
                    {model.yearlyData.map(d => (
                      <td key={d.year} className="py-3 px-4 text-right font-mono font-semibold">
                        {formatRatio(d.debtToEquity)}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-medium">Debt-to-Assets</td>
                    <td className="py-3 px-4 text-xs text-slate-400">&lt; 50%</td>
                    {model.yearlyData.map(d => (
                      <td key={d.year} className="py-3 px-4 text-right font-mono font-semibold">
                        {d.debtToAssets ? `${(d.debtToAssets * 100).toFixed(1)}%` : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-medium">Financial Leverage (Assets/Equity)</td>
                    <td className="py-3 px-4 text-xs text-slate-400">&lt; 3.00x</td>
                    {model.yearlyData.map(d => (
                      <td key={d.year} className="py-3 px-4 text-right font-mono font-semibold">
                        {formatRatio(d.financialLeverage)}
                      </td>
                    ))}
                  </tr>

                  {/* Profitability */}
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white" rowSpan={4}>Profitability & Returns</td>
                    <td className="py-3 px-4 font-medium">Gross Profit Margin</td>
                    <td className="py-3 px-4 text-xs text-slate-400">&gt; 25%</td>
                    {model.yearlyData.map(d => (
                      <td key={d.year} className="py-3 px-4 text-right font-mono font-semibold">
                        {d.grossMarginPct ? `${d.grossMarginPct}%` : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-medium">EBITDA Margin</td>
                    <td className="py-3 px-4 text-xs text-slate-400">&gt; 15%</td>
                    {model.yearlyData.map(d => (
                      <td key={d.year} className="py-3 px-4 text-right font-mono font-semibold">
                        {d.ebitdaMarginPct ? `${d.ebitdaMarginPct}%` : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-medium">Net Profit Margin</td>
                    <td className="py-3 px-4 text-xs text-slate-400">&gt; 8%</td>
                    {model.yearlyData.map(d => (
                      <td key={d.year} className="py-3 px-4 text-right font-mono font-semibold">
                        {d.netMarginPct ? `${d.netMarginPct}%` : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-medium">Return on Equity (ROE)</td>
                    <td className="py-3 px-4 text-xs text-slate-400">&gt; 15%</td>
                    {model.yearlyData.map(d => (
                      <td key={d.year} className="py-3 px-4 text-right font-mono font-semibold">
                        {d.roePct ? `${d.roePct}%` : '—'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* PAGE 5: CREDIT ANALYSIS                                                   */}
      {/* ========================================================================= */}
      {activePage === 'credit_analysis' && (
        <motion.div 
          key="credit"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Credit Overview Gauge & Key Pillars */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Credit Health Scorecard */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs text-center">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Credita Financial Health Score</div>
              <div className="relative inline-flex items-center justify-center my-4">
                <div className={`w-32 h-32 rounded-full border-8 flex flex-col items-center justify-center ${
                  latestYearData.creditHealthScore >= 75 
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' 
                    : latestYearData.creditHealthScore >= 50 
                    ? 'border-amber-500 text-amber-500' 
                    : 'border-rose-500 text-rose-500'
                }`}>
                  <span className="text-4xl font-black">{latestYearData.creditHealthScore}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-400">/ 100</span>
                </div>
              </div>
              <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                {latestYearData.creditRiskTier}
              </div>
              <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto">
                Underwriting assessment based on working capital, liquidity ratios, debt service, and operating profitability.
              </p>
            </div>

            {/* Credit Underwriting Indicators */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs">
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">Credit Risk Indicators Matrix</h3>
              <p className="text-xs text-slate-500 mb-6">Evaluation across liquidity, leverage, debt servicing, and capital sufficiency</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Liquidity Indicator */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                  <div className="text-xs font-bold text-slate-500 uppercase mb-1">1. Liquidity Indicator</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{latestYearData.liquidityStatus} Liquidity</span>
                    <span className="font-mono text-sm">{formatRatio(latestYearData.currentRatio)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Net Working Capital: {formatNum(latestYearData.workingCapital)}
                  </p>
                </div>

                {/* 2. Leverage Indicator */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                  <div className="text-xs font-bold text-slate-500 uppercase mb-1">2. Leverage Indicator</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{latestYearData.solvencyStatus} Solvency</span>
                    <span className="font-mono text-sm">{formatRatio(latestYearData.debtToEquity)} D/E</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Total Debt: {formatNum(latestYearData.totalDebt)} vs Equity {formatNum(latestYearData.totalEquity)}
                  </p>
                </div>

                {/* 3. Profitability Resilience */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                  <div className="text-xs font-bold text-slate-500 uppercase mb-1">3. Profitability Resilience</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>Operating Profit (EBIT)</span>
                    <span className="font-mono text-sm">{formatNum(latestYearData.netOperatingProfit)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    EBITDA: {formatNum(latestYearData.ebitda)} ({latestYearData.ebitdaMarginPct}% margin)
                  </p>
                </div>

                {/* 4. Debt Servicing Buffer */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
                  <div className="text-xs font-bold text-slate-500 uppercase mb-1">4. Net Debt Burden</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>Net Debt</span>
                    <span className="font-mono text-sm">{formatNum(latestYearData.netDebt)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Cash buffer covers {latestYearData.cash && latestYearData.shortTermDebt ? `${((latestYearData.cash / latestYearData.shortTermDebt) * 100).toFixed(0)}%` : '—'} of short-term debt
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Automated Significant Year-over-Year Movements */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-credita dark:text-neon-blue" />
              <span>Automated Credit Analyst Observations & Significant YoY Movements</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">Underwriting red flags and positive credit drivers identified by the Credita engine</p>

            <div className="space-y-3">
              {latestYearData.flaggedVariances && latestYearData.flaggedVariances.length > 0 ? (
                latestYearData.flaggedVariances.map((item, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-credita dark:text-neon-blue shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{item}</span>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-sm">
                  Financial figures are consistent across reporting periods with stable liquidity and leverage profiles.
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}



      {/* DAX Formulas Modal */}
      <AnimatePresence>
        {showDaxModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-credita/10 dark:bg-neon-blue/10 flex items-center justify-center">
                    <FileCode className="w-5 h-5 text-credita dark:text-neon-blue" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Enterprise Financial Measures Library</h3>
                    <p className="text-xs text-slate-500">Formulas embedded for financial calculations, credit metrics, and spreading</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={copyDaxToClipboard}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 flex items-center gap-1.5"
                  >
                    {copiedDax ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedDax ? 'Copied!' : 'Copy All DAX'}</span>
                  </button>
                  <button 
                    onClick={() => setShowDaxModal(false)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto mt-4 p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed">
                <pre>{bundleResult?.daxText || 'Loading DAX...'}</pre>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Custom Visual Modal (Interactive Visual Builder) */}
      <AnimatePresence>
        {showAddVisualModal && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      تصميم رسم بياني مالي مخصص (Visual Designer)
                    </h3>
                    <p className="text-xs text-slate-500">اختر المؤشرات المالية ونوع الرسم البياني المطلوب</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddVisualModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              {/* Form */}
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان الرسم البياني (Visual Title):
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="مثال: تطور المبيعات وصافي الأرباح..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                  />
                </div>

                {/* Chart Type Selection */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    نوع الرسم البياني (Visualization Type):
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { type: 'bar' as ChartVisualType, label: 'أعمدة (Bar)', icon: <BarChart3 className="w-4 h-4" /> },
                      { type: 'line' as ChartVisualType, label: 'خط (Line)', icon: <TrendingUp className="w-4 h-4" /> },
                      { type: 'area' as ChartVisualType, label: 'مساحي (Area)', icon: <span className="font-bold text-sm">⊿</span> },
                      { type: 'donut' as ChartVisualType, label: 'دائري (Donut)', icon: <PieChart className="w-4 h-4" /> },
                      { type: 'table' as ChartVisualType, label: 'جدول (Table)', icon: <Sliders className="w-4 h-4" /> },
                    ].map(item => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setNewType(item.type)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                          newType === item.type
                            ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        {item.icon}
                        <span className="text-[10px]">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Metric 1 */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المؤشر الأول (Primary Metric):
                  </label>
                  <select
                    value={newMetric1}
                    onChange={(e) => setNewMetric1(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  >
                    {AVAILABLE_METRICS.map(m => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Metric 2 (Optional) */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المؤشر الثاني (Secondary Metric - اختياري للمقارنة):
                  </label>
                  <select
                    value={newMetric2}
                    onChange={(e) => setNewMetric2(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  >
                    <option value="none">-- بدون مؤشر ثانٍ --</option>
                    {AVAILABLE_METRICS.map(m => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Unit */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    وحدة العرض (Data Format):
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="unit"
                        checked={newUnit === 'currency'}
                        onChange={() => setNewUnit('currency')}
                        className="text-amber-500"
                      />
                      <span>عملة بالآلاف (Currency k)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="unit"
                        checked={newUnit === 'percent'}
                        onChange={() => setNewUnit('percent')}
                        className="text-amber-500"
                      />
                      <span>نسبة مئوية (%)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="unit"
                        checked={newUnit === 'ratio'}
                        onChange={() => setNewUnit('ratio')}
                        className="text-amber-500"
                      />
                      <span>معدل أو مضاعف (x)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowAddVisualModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveNewVisual}
                  disabled={!newTitle.trim()}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة الرسم إلى الداشبورد</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating AI Financial Analyst & Copilot */}
      <DashboardAICopilot
        modelSummary={model}
        fullFinancialData={editableData}
        isDark={isDark}
        onAddCustomChart={handleAddCustomChart}
        onAddMemoObservation={(bullet) => {
          setDownloadNotice(`تمت إضافة الملاحظة الائتمانية: "${bullet.slice(0, 35)}..."`);
        }}
      />
    </div>
  );
}
