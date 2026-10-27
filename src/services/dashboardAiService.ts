import { ModelSummary, CalculatedYearData } from './financialModel';
import { FinancialData } from './gemini';

export type ChartVisualType = 'bar' | 'line' | 'area' | 'donut' | 'table';

export interface CustomVisualWidget {
  id: string;
  title: string;
  description?: string;
  chartType: ChartVisualType;
  metricKeys: string[];
  metricLabels?: Record<string, string>;
  unit?: 'currency' | 'percent' | 'ratio';
  insight?: string;
  isAiGenerated?: boolean;
  createdAt: number;
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  chart?: CustomVisualWidget | null;
  creditMemoBullets?: string[];
  timestamp: string;
}

export interface AvailableMetric {
  key: string;
  label: string;
  category: 'income' | 'balance' | 'ratios' | 'cash_debt';
  unit: 'currency' | 'percent' | 'ratio';
  getter: (year: CalculatedYearData) => number | null;
}

export const AVAILABLE_METRICS: AvailableMetric[] = [
  // Income Statement
  { key: 'revenues', label: 'المبيعات / الإيرادات (Revenues)', category: 'income', unit: 'currency', getter: y => y.revenues },
  { key: 'cogs', label: 'تكلفة المبيعات (COGS)', category: 'income', unit: 'currency', getter: y => y.cogs },
  { key: 'grossProfit', label: 'مجمل الربح (Gross Profit)', category: 'income', unit: 'currency', getter: y => y.grossProfit },
  { key: 'sgaExpense', label: 'مصروفات عمومية وإدارية (SG&A)', category: 'income', unit: 'currency', getter: y => y.sgaExpense },
  { key: 'ebitda', label: 'الأرباح قبل الفوائد والضرائب والإهلاك (EBITDA)', category: 'income', unit: 'currency', getter: y => y.ebitda },
  { key: 'netOperatingProfit', label: 'أرباح التشغيل (Operating Profit / EBIT)', category: 'income', unit: 'currency', getter: y => y.netOperatingProfit },
  { key: 'netProfitAfterTax', label: 'صافي الربح بعد الضريبة (Net Profit)', category: 'income', unit: 'currency', getter: y => y.netProfitAfterTax },
  { key: 'grossMarginPct', label: 'هامش مجمل الربح (Gross Margin %)', category: 'income', unit: 'percent', getter: y => y.grossMarginPct },
  { key: 'ebitdaMarginPct', label: 'هامش الـ EBITDA %', category: 'income', unit: 'percent', getter: y => y.ebitdaMarginPct },
  { key: 'netMarginPct', label: 'هامش صافي الربح % (Net Margin %)', category: 'income', unit: 'percent', getter: y => y.netMarginPct },
  { key: 'revenueGrowthPct', label: 'معدل نمو المبيعات السنوي (YoY Revenue Growth %)', category: 'income', unit: 'percent', getter: y => y.revenueGrowthPct },

  // Balance Sheet
  { key: 'cash', label: 'النقدية وما في حكمها (Cash & Equivalents)', category: 'balance', unit: 'currency', getter: y => y.cash },
  { key: 'netReceivables', label: 'العملاء وأوراق القبض (Accounts Receivable)', category: 'balance', unit: 'currency', getter: y => y.netReceivables },
  { key: 'totalInventory', label: 'المخزون (Total Inventory)', category: 'balance', unit: 'currency', getter: y => y.totalInventory },
  { key: 'totalCurrentAssets', label: 'إجمالي الأصول المتداولة (Total Current Assets)', category: 'balance', unit: 'currency', getter: y => y.totalCurrentAssets },
  { key: 'netPpe', label: 'صافي الأصول الثابتة (Net PP&E)', category: 'balance', unit: 'currency', getter: y => y.netPpe },
  { key: 'totalAssets', label: 'إجمالي الأصول (Total Assets)', category: 'balance', unit: 'currency', getter: y => y.totalAssets },
  
  // Liabilities & Debt
  { key: 'shortTermDebt', label: 'الديون قصيرة الأجل / سحب مكشوف (Short-Term Debt)', category: 'cash_debt', unit: 'currency', getter: y => y.shortTermDebt },
  { key: 'accountsPayable', label: 'الموردون وأوراق الدفع (Accounts Payable)', category: 'cash_debt', unit: 'currency', getter: y => y.accountsPayable },
  { key: 'totCurrentLiabilities', label: 'إجمالي الالتزامات المتداولة (Current Liabilities)', category: 'cash_debt', unit: 'currency', getter: y => y.totCurrentLiabilities },
  { key: 'totalLongTermDebt', label: 'الديون طويلة الأجل (Long-Term Debt)', category: 'cash_debt', unit: 'currency', getter: y => y.totalLongTermDebt },
  { key: 'totalDebt', label: 'إجمالي الديون التمويلية (Total Debt)', category: 'cash_debt', unit: 'currency', getter: y => y.totalDebt },
  { key: 'netDebt', label: 'صافي الدين بعد خصم النقدية (Net Debt)', category: 'cash_debt', unit: 'currency', getter: y => y.netDebt },
  { key: 'totalLiabilities', label: 'إجمالي الخصوم (Total Liabilities)', category: 'cash_debt', unit: 'currency', getter: y => y.totalLiabilities },
  { key: 'totalEquity', label: 'إجمالي حقوق الملكية (Total Equity)', category: 'balance', unit: 'currency', getter: y => y.totalEquity },
  { key: 'workingCapital', label: 'رأس المال العامل الصافي (Net Working Capital)', category: 'balance', unit: 'currency', getter: y => y.workingCapital },

  // Ratios & Credit
  { key: 'currentRatio', label: 'نسبة التداول الحالية (Current Ratio)', category: 'ratios', unit: 'ratio', getter: y => y.currentRatio },
  { key: 'quickRatio', label: 'نسبة السيولة السريعة (Quick Ratio)', category: 'ratios', unit: 'ratio', getter: y => y.quickRatio },
  { key: 'debtToEquity', label: 'نسبة الدين إلى حقوق الملكية (Debt-to-Equity)', category: 'ratios', unit: 'ratio', getter: y => y.debtToEquity },
  { key: 'financialLeverage', label: 'الرافعة المالية - أصول/حقوق ملكية (Financial Leverage)', category: 'ratios', unit: 'ratio', getter: y => y.financialLeverage },
  { key: 'interestCoverage', label: 'معدل تغطية الفوائد (Interest Coverage Ratio)', category: 'ratios', unit: 'ratio', getter: y => y.interestCoverage },
  { key: 'roaPct', label: 'العائد على الأصول % (ROA %)', category: 'ratios', unit: 'percent', getter: y => y.roaPct },
  { key: 'roePct', label: 'العائد على حقوق الملكية % (ROE %)', category: 'ratios', unit: 'percent', getter: y => y.roePct },
  { key: 'creditHealthScore', label: 'درجة الجدارة الائتمانية (Credit Score /100)', category: 'ratios', unit: 'ratio', getter: y => y.creditHealthScore },
];

export async function askDashboardAI(
  message: string,
  modelSummary: ModelSummary,
  history: AIChatMessage[] = [],
  fullFinancialData?: FinancialData[]
): Promise<{
  reply: string;
  chart?: CustomVisualWidget | null;
  creditMemoBullets?: string[];
}> {
  const response = await fetch('/api/dashboard-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      modelSummary,
      fullFinancialData,
      history: history.slice(-6).map(h => ({
        role: h.sender === 'user' ? 'user' : 'model',
        text: h.text,
      })),
    }),
  });

  const rawText = await response.text();
  let data: any = null;
  try {
    data = JSON.parse(rawText);
  } catch (_) {
    throw new Error(`AI assistant temporary error (status ${response.status}). Please try again.`);
  }

  if (!response.ok) {
    throw new Error(data?.error || `AI assistant request failed (${response.status})`);
  }
  if (data.chart) {
    data.chart.id = `chart_ai_${Date.now()}`;
    data.chart.isAiGenerated = true;
    data.chart.createdAt = Date.now();
  }
  return data;
}
