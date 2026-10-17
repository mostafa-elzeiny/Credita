import { FinancialData } from './gemini';

export interface CalculatedYearData {
  year: number;
  companyName: string;
  // Income Statement Core
  revenues: number;
  cogs: number;
  grossProfit: number;
  sgaExpense: number;
  depreciation: number;
  ebitda: number;
  netOperatingProfit: number;
  interestExpense: number;
  interestIncome: number;
  fxGL: number;
  netProfitBeforeTax: number;
  taxExpense: number;
  netProfitAfterTax: number;
  npaui: number;
  dividends: number;

  // Balance Sheet Core
  cash: number;
  marketableSecurities: number;
  netReceivables: number;
  totalInventory: number;
  totalCurrentAssets: number;
  netPpe: number;
  netIntangibles: number;
  totalAssets: number;

  // Liabilities
  shortTermDebt: number;
  accountsPayable: number;
  totCurrentLiabilities: number;
  longTermDebt: number;
  totalLongTermDebt: number;
  totalLiabilities: number;
  totalDebt: number;
  netDebt: number;

  // Equity
  commonStock: number;
  retainedEarnings: number;
  totalEquity: number;
  totalLiabsAndEquity: number;

  // Working Capital
  workingCapital: number;

  // Profitability Margins (0-100%)
  grossMarginPct: number | null;
  ebitdaMarginPct: number | null;
  operatingMarginPct: number | null;
  netMarginPct: number | null;

  // Liquidity Ratios
  currentRatio: number | null;
  quickRatio: number | null;
  cashRatio: number | null;

  // Leverage & Solvency Ratios
  debtToEquity: number | null;
  debtToAssets: number | null;
  financialLeverage: number | null;
  interestCoverage: number | null;

  // Returns
  roaPct: number | null;
  roePct: number | null;
  assetTurnover: number | null;

  // Growth YoY (compared to previous year in dataset)
  revenueGrowthPct: number | null;
  grossProfitGrowthPct: number | null;
  ebitdaGrowthPct: number | null;
  netProfitGrowthPct: number | null;
  totalAssetsGrowthPct: number | null;
  debtGrowthPct: number | null;

  // Credit Risk Indicators
  creditHealthScore: number;
  creditRiskTier: 'Low Risk' | 'Moderate Risk' | 'High Risk';
  liquidityStatus: 'Healthy' | 'Adequate' | 'Constrained';
  solvencyStatus: 'Strong' | 'Moderate' | 'Stressed';
  flaggedVariances: string[];
}

export interface ModelSummary {
  companyName: string;
  currency: string;
  reportingPeriod: string;
  years: number[];
  latestYear: number;
  yearsCount: number;
  yearlyData: CalculatedYearData[];
}

const safeDivide = (numerator: number, denominator: number): number | null => {
  if (!denominator || isNaN(denominator) || denominator === 0) return null;
  const result = numerator / denominator;
  if (isNaN(result) || !isFinite(result)) return null;
  return result;
};

const safePct = (numerator: number, denominator: number): number | null => {
  const res = safeDivide(numerator, denominator);
  return res !== null ? Math.round(res * 10000) / 100 : null;
};

export function computeFinancialModel(dataList: FinancialData[]): ModelSummary {
  if (!dataList || dataList.length === 0) {
    return {
      companyName: 'Company Name',
      currency: 'EGP',
      reportingPeriod: 'N/A',
      years: [],
      latestYear: new Date().getFullYear(),
      yearsCount: 0,
      yearlyData: []
    };
  }

  // Sort chronologically (oldest to newest)
  const sorted = [...dataList].sort((a, b) => a.year - b.year);
  const companyName = sorted[0]?.companyName || sorted[sorted.length - 1]?.companyName || 'Credita Corporate Client';
  const years = sorted.map(d => d.year);
  const latestYear = years[years.length - 1];
  const reportingPeriod = years.length === 1 ? `FY ${years[0]}` : `FY ${years[0]} – FY ${latestYear}`;

  const yearlyData: CalculatedYearData[] = sorted.map((d, index) => {
    const is = d.incomeStatement || ({} as any);
    const bs = d.balanceSheet || ({} as any);

    const revenues = is.revenues || 0;
    const cogs = is.costOfGoodsSold || 0;
    const grossProfit = is.grossProfit || (revenues - Math.abs(cogs));
    const sgaExpense = is.sgaExpense || 0;
    const depr1 = is.depreciation1 || 0;
    const depr2 = is.depreciation2 || 0;
    const totalDepreciation = Math.abs(depr1) + Math.abs(depr2);
    
    // Operating profit
    const netOperatingProfit = is.netOperatingProfit || (grossProfit - Math.abs(sgaExpense) - totalDepreciation);
    // EBITDA = Operating Profit + Total Depreciation
    const ebitda = netOperatingProfit + totalDepreciation;

    const interestExpense = Math.abs(is.grossInterestExpExist || 0) + Math.abs(is.interestExpNew || 0) + Math.abs(is.capitalizedInterest || 0);
    const interestIncome = is.interestIncome || 0;
    const fxGL = is.fxGL || 0;
    const netProfitBeforeTax = is.netProfitBeforeTax || (netOperatingProfit - interestExpense + interestIncome + fxGL);
    const taxExpense = Math.abs(is.totalTaxExpense || 0);
    const netProfitAfterTax = is.netProfitAfterTax || (netProfitBeforeTax - taxExpense);
    const npaui = is.npaui || netProfitAfterTax;
    const dividends = Math.abs(is.prefShareDividends || 0) + Math.abs(is.commonStockDividends || 0);

    // Balance Sheet
    const cash = bs.cash || 0;
    const marketableSecurities = bs.marketableSecurities || 0;
    const netReceivables = bs.netReceivables || (bs.accountsReceivable - (bs.lessAllowances || 0));
    const totalInventory = bs.totalInventory || 0;
    const totalCurrentAssets = bs.totalCurrentAssets || 0;
    const netPpe = bs.netPpe || (bs.grossPlant - (bs.lessAccumulatedDep || 0));
    const netIntangibles = bs.netIntangibles || 0;
    const totalAssets = bs.totalAssets || 0;

    // Debt & Liabilities
    const shortTermDebt = (bs.shortTermBorrowingExisting || 0) + 
                          (bs.shortTermBorrowingNew || 0) + 
                          (bs.cpSeniorDebtExisting || 0) + 
                          (bs.cpSeniorDebtNew || 0) + 
                          (bs.cpCapLease || 0);
    const accountsPayable = bs.accountsPayable || 0;
    const totCurrentLiabilities = bs.totCurrentLiabilities || 0;
    const longTermDebt = (bs.ltSeniorDebtExisting || 0) + (bs.ltSeniorDebtNew || 0) + (bs.ltLeaseObligation || 0);
    const totalLongTermDebt = bs.totalLongTermDebt || longTermDebt;
    const totalLiabilities = bs.totalLiabilities || (totCurrentLiabilities + totalLongTermDebt);
    const totalDebt = shortTermDebt + totalLongTermDebt;
    const netDebt = Math.max(0, totalDebt - (cash + marketableSecurities));

    // Equity
    const commonStock = bs.commonStock || 0;
    const retainedEarnings = bs.retainedEarningsClosing || 0;
    const totalEquity = bs.totalEquity || (totalAssets - totalLiabilities);
    const totalLiabsAndEquity = bs.totalLiabsAndEquity || (totalLiabilities + totalEquity);

    // Working Capital
    const workingCapital = totalCurrentAssets - totCurrentLiabilities;

    // Margins
    const grossMarginPct = safePct(grossProfit, revenues);
    const ebitdaMarginPct = safePct(ebitda, revenues);
    const operatingMarginPct = safePct(netOperatingProfit, revenues);
    const netMarginPct = safePct(netProfitAfterTax, revenues);

    // Ratios
    const currentRatio = safeDivide(totalCurrentAssets, totCurrentLiabilities);
    const quickAssets = cash + marketableSecurities + netReceivables;
    const quickRatio = safeDivide(quickAssets, totCurrentLiabilities);
    const cashRatio = safeDivide(cash, totCurrentLiabilities);

    const debtToEquity = safeDivide(totalDebt, totalEquity);
    const debtToAssets = safeDivide(totalDebt, totalAssets);
    const financialLeverage = safeDivide(totalAssets, totalEquity);
    const interestCoverage = interestExpense > 0 ? safeDivide(netOperatingProfit, interestExpense) : null;

    const roaPct = safePct(netProfitAfterTax, totalAssets);
    const roePct = safePct(netProfitAfterTax, totalEquity);
    const assetTurnover = safeDivide(revenues, totalAssets);

    // Year-over-Year Growth (vs prior index)
    const prev = index > 0 ? sorted[index - 1] : null;
    let revenueGrowthPct: number | null = null;
    let grossProfitGrowthPct: number | null = null;
    let ebitdaGrowthPct: number | null = null;
    let netProfitGrowthPct: number | null = null;
    let totalAssetsGrowthPct: number | null = null;
    let debtGrowthPct: number | null = null;

    if (prev) {
      const prevRev = prev.incomeStatement?.revenues || 0;
      if (prevRev !== 0) revenueGrowthPct = safePct(revenues - prevRev, Math.abs(prevRev));

      const prevGp = prev.incomeStatement?.grossProfit || 0;
      if (prevGp !== 0) grossProfitGrowthPct = safePct(grossProfit - prevGp, Math.abs(prevGp));

      const prevEbitda = (prev.incomeStatement?.netOperatingProfit || 0) + (prev.incomeStatement?.depreciation1 || 0) + (prev.incomeStatement?.depreciation2 || 0);
      if (prevEbitda !== 0) ebitdaGrowthPct = safePct(ebitda - prevEbitda, Math.abs(prevEbitda));

      const prevNp = prev.incomeStatement?.netProfitAfterTax || 0;
      if (prevNp !== 0) netProfitGrowthPct = safePct(netProfitAfterTax - prevNp, Math.abs(prevNp));

      const prevAssets = prev.balanceSheet?.totalAssets || 0;
      if (prevAssets !== 0) totalAssetsGrowthPct = safePct(totalAssets - prevAssets, Math.abs(prevAssets));

      const prevDebt = (prev.balanceSheet?.shortTermBorrowingExisting || 0) + (prev.balanceSheet?.totalLongTermDebt || 0);
      if (prevDebt !== 0) debtGrowthPct = safePct(totalDebt - prevDebt, Math.abs(prevDebt));
    }

    // Flagged movements
    const flaggedVariances: string[] = [];
    if (revenueGrowthPct !== null) {
      if (revenueGrowthPct > 15) flaggedVariances.push(`Revenue expanded significantly by +${revenueGrowthPct}% YoY`);
      else if (revenueGrowthPct < -10) flaggedVariances.push(`Revenue contracted by ${revenueGrowthPct}% YoY`);
    }
    if (netMarginPct !== null && netMarginPct < 2) {
      flaggedVariances.push(`Thin net profit margin of ${netMarginPct}% indicates cost pressure`);
    }
    if (currentRatio !== null) {
      if (currentRatio < 1.0) flaggedVariances.push(`Current ratio is below 1.0x (${currentRatio.toFixed(2)}x) - negative working capital`);
      else if (currentRatio >= 1.5) flaggedVariances.push(`Strong working capital coverage with current ratio of ${currentRatio.toFixed(2)}x`);
    }
    if (debtToEquity !== null && debtToEquity > 2.5) {
      flaggedVariances.push(`Elevated financial leverage with Debt-to-Equity of ${debtToEquity.toFixed(2)}x`);
    }
    if (workingCapital < 0) {
      flaggedVariances.push(`Deficit in net working capital (${Math.round(workingCapital / 1000)}k LE)`);
    }

    // Credit Health Score Calculation (0 - 100 scale)
    let score = 50; // baseline
    if (netMarginPct !== null) {
      if (netMarginPct > 12) score += 15;
      else if (netMarginPct > 5) score += 8;
      else if (netMarginPct < 0) score -= 15;
    }
    if (currentRatio !== null) {
      if (currentRatio >= 1.5) score += 15;
      else if (currentRatio >= 1.1) score += 8;
      else if (currentRatio < 0.9) score -= 15;
    }
    if (debtToEquity !== null) {
      if (debtToEquity <= 1.0) score += 15;
      else if (debtToEquity <= 2.0) score += 5;
      else if (debtToEquity > 3.0) score -= 15;
    }
    if (interestCoverage !== null) {
      if (interestCoverage >= 3.0) score += 10;
      else if (interestCoverage >= 1.5) score += 5;
      else if (interestCoverage < 1.0) score -= 10;
    }
    if (workingCapital > 0) score += 5;
    else score -= 8;

    score = Math.max(10, Math.min(98, score));

    const creditRiskTier = score >= 75 ? 'Low Risk' : score >= 50 ? 'Moderate Risk' : 'High Risk';
    const liquidityStatus = currentRatio && currentRatio >= 1.4 ? 'Healthy' : currentRatio && currentRatio >= 1.0 ? 'Adequate' : 'Constrained';
    const solvencyStatus = debtToEquity && debtToEquity <= 1.5 ? 'Strong' : debtToEquity && debtToEquity <= 2.5 ? 'Moderate' : 'Stressed';

    return {
      year: d.year,
      companyName: d.companyName || companyName,
      revenues,
      cogs,
      grossProfit,
      sgaExpense,
      depreciation: totalDepreciation,
      ebitda,
      netOperatingProfit,
      interestExpense,
      interestIncome,
      fxGL,
      netProfitBeforeTax,
      taxExpense,
      netProfitAfterTax,
      npaui,
      dividends,
      cash,
      marketableSecurities,
      netReceivables,
      totalInventory,
      totalCurrentAssets,
      netPpe,
      netIntangibles,
      totalAssets,
      shortTermDebt,
      accountsPayable,
      totCurrentLiabilities,
      longTermDebt,
      totalLongTermDebt,
      totalLiabilities,
      totalDebt,
      netDebt,
      commonStock,
      retainedEarnings,
      totalEquity,
      totalLiabsAndEquity,
      workingCapital,
      grossMarginPct,
      ebitdaMarginPct,
      operatingMarginPct,
      netMarginPct,
      currentRatio,
      quickRatio,
      cashRatio,
      debtToEquity,
      debtToAssets,
      financialLeverage,
      interestCoverage,
      roaPct,
      roePct,
      assetTurnover,
      revenueGrowthPct,
      grossProfitGrowthPct,
      ebitdaGrowthPct,
      netProfitGrowthPct,
      totalAssetsGrowthPct,
      debtGrowthPct,
      creditHealthScore: Math.round(score),
      creditRiskTier,
      liquidityStatus,
      solvencyStatus,
      flaggedVariances
    };
  });

  return {
    companyName,
    currency: 'EGP',
    reportingPeriod,
    years,
    latestYear,
    yearsCount: years.length,
    yearlyData
  };
}
