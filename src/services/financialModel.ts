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

  // Working Capital & Efficiency / Cash Conversion Cycle
  workingCapital: number;
  workingCapitalFundingGap: number;
  dso: number | null;
  dio: number | null;
  dpo: number | null;
  cashConversionCycle: number | null;

  // Profitability Margins (0-100%)
  grossMarginPct: number | null;
  ebitdaMarginPct: number | null;
  operatingMarginPct: number | null;
  netMarginPct: number | null;

  // Liquidity Ratios
  currentRatio: number | null;
  quickRatio: number | null;
  cashRatio: number | null;

  // Leverage, Coverage & Solvency Ratios
  debtToEquity: number | null;
  totalLiabilitiesToEquity: number | null;
  gearingRatioPct: number | null;
  debtToAssets: number | null;
  financialLeverage: number | null;
  interestCoverage: number | null;
  ebitdaToInterest: number | null;
  netDebtToEbitda: number | null;
  dscr: number | null;

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

export interface CreditAnalystAssessment {
  overallRating: 'Prime / Investment Grade' | 'Acceptable Bankable' | 'Watchlist / Caution' | 'High Credit Risk';
  executiveSummary: string;
  strengths: string[];
  risksAndRedFlags: string[];
  workingCapitalComment: string;
  facilityRecommendation: string;
}

export interface ModelSummary {
  companyName: string;
  currency: string;
  reportingPeriod: string;
  years: number[];
  latestYear: number;
  yearsCount: number;
  yearlyData: CalculatedYearData[];
  creditAnalystAssessment?: CreditAnalystAssessment;
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

const fmtK = (val: number): string => {
  const k = Math.round(val / 1000);
  return `${k.toLocaleString('en-US')}k`;
};

function buildCreditAnalystAssessment(
  latest: CalculatedYearData,
  latestRaw: FinancialData,
  companyName: string
): CreditAnalystAssessment {
  const strengths: string[] = [];
  const risksAndRedFlags: string[] = [];
  const bs = latestRaw.balanceSheet || ({} as any);

  // Strengths evaluation
  if (latest.dscr !== null && latest.dscr >= 1.5) {
    strengths.push(`Strong debt service capacity with DSCR at ${latest.dscr.toFixed(2)}x (EBITDA ${fmtK(latest.ebitda)} LE vs contractual debt service).`);
  }
  if (latest.netDebtToEbitda !== null && latest.netDebtToEbitda <= 2.0) {
    strengths.push(`Conservative net leverage at ${latest.netDebtToEbitda.toFixed(2)}x Net Debt/EBITDA (Net Debt ${fmtK(latest.netDebt)} LE).`);
  }
  if (latest.interestCoverage !== null && latest.interestCoverage >= 3.0) {
    strengths.push(`Comfortable EBIT interest coverage of ${latest.interestCoverage.toFixed(2)}x (${latest.ebitdaToInterest?.toFixed(2)}x on EBITDA basis).`);
  }
  if (latest.currentRatio !== null && latest.currentRatio >= 1.25 && latest.workingCapital > 0) {
    strengths.push(`Healthy short-term liquidity with Current Ratio of ${latest.currentRatio.toFixed(2)}x and positive NWC of ${fmtK(latest.workingCapital)} LE.`);
  }
  if (latest.ebitdaMarginPct !== null && latest.ebitdaMarginPct >= 10) {
    strengths.push(`Solid operating profitability with EBITDA margin of ${latest.ebitdaMarginPct.toFixed(1)}% and Net Margin of ${(latest.netMarginPct ?? 0).toFixed(1)}%.`);
  }
  if ((latest.roePct ?? 0) >= 18) {
    strengths.push(`Strong return on equity (ROE) of ${latest.roePct?.toFixed(1)}%, supporting internal capital accretion.`);
  }
  if (latest.marketableSecurities > 0) {
    strengths.push(`Liquid security buffer / LG cash margins of ${fmtK(latest.marketableSecurities)} LE on balance sheet.`);
  }

  // Risks & Red Flags evaluation
  if (latest.dso !== null && latest.dso > 65) {
    risksAndRedFlags.push(`Extended receivables collection cycle (DSO of ${Math.round(latest.dso)} days; A/R at ${fmtK(latest.netReceivables)} LE) creates working capital funding strain.`);
  }
  if (latest.workingCapitalFundingGap > 0 && latest.revenues > 0 && latest.workingCapitalFundingGap / latest.revenues > 0.15) {
    risksAndRedFlags.push(`Core Working Capital Funding Gap (A/R + Inv - A/P) stands at ${fmtK(latest.workingCapitalFundingGap)} LE, driven by ${latest.dpo !== null ? `short supplier terms (DPO ${Math.round(latest.dpo)}d)` : 'low trade payable support'}.`);
  }
  if ((bs.shortTermBorrowingExisting || 0) > latest.cash) {
    risksAndRedFlags.push(`Reliance on short-term bank overdrafts/facilities (${fmtK(bs.shortTermBorrowingExisting || 0)} LE) exceeds unencumbered cash (${fmtK(latest.cash)} LE).`);
  }
  if ((bs.taxesPayable || 0) > latest.totalEquity * 0.15) {
    risksAndRedFlags.push(`Sizable statutory Taxes Payable (${fmtK(bs.taxesPayable || 0)} LE) — requires verification of tax settlement compliance & absence of overdue assessments.`);
  }
  if ((bs.otherCurrentAssets || 0) > latest.totalCurrentAssets * 0.2) {
    risksAndRedFlags.push(`Other Current Assets / third-party deposits represent a notable share (${fmtK(bs.otherCurrentAssets || 0)} LE) of current assets; verify recoverability & cash conversion.`);
  }
  if ((bs.dueToSisterCo3 || 0) > 0 || (bs.dueFromSisterCo1 || 0) > 0 || (bs.dueFromSisterCo2 || 0) > 0) {
    risksAndRedFlags.push(`Related-party / Sister Co. balances present (${fmtK((bs.dueToSisterCo3 || 0) + (bs.dueFromSisterCo1 || 0) + (bs.dueFromSisterCo2 || 0))} LE) — assess intercompany subordination & transfer pricing.`);
  }
  if (latest.currentRatio !== null && latest.currentRatio < 1.0) {
    risksAndRedFlags.push(`Current ratio below 1.0x (${latest.currentRatio.toFixed(2)}x) exposes short-term refinancing risk.`);
  }
  if (latest.dscr !== null && latest.dscr < 1.2) {
    risksAndRedFlags.push(`Tight Debt Service Coverage Ratio (DSCR ${latest.dscr.toFixed(2)}x < 1.20x bank covenant floor).`);
  }
  if (latest.debtToEquity !== null && latest.debtToEquity > 2.0) {
    risksAndRedFlags.push(`Elevated Total Debt / Equity of ${latest.debtToEquity.toFixed(2)}x (Total Liabilities/Equity ${latest.totalLiabilitiesToEquity?.toFixed(2)}x).`);
  }
  if (risksAndRedFlags.length === 0) {
    risksAndRedFlags.push('No severe structural covenant breaches detected; maintain routine quarterly A/R aging and tax clearance monitoring.');
  }
  if (strengths.length === 0) {
    strengths.push(`Operating revenue base of ${fmtK(latest.revenues)} LE in FY ${latest.year}.`);
  }

  // Rating assignment
  let overallRating: CreditAnalystAssessment['overallRating'] = 'Acceptable Bankable';
  if (latest.creditHealthScore >= 78 && (latest.dscr === null || latest.dscr >= 1.5)) {
    overallRating = 'Prime / Investment Grade';
  } else if (latest.creditHealthScore >= 60) {
    overallRating = 'Acceptable Bankable';
  } else if (latest.creditHealthScore >= 42) {
    overallRating = 'Watchlist / Caution';
  } else {
    overallRating = 'High Credit Risk';
  }

  const wcCommentParts: string[] = [];
  if (latest.dso !== null) wcCommentParts.push(`DSO ${Math.round(latest.dso)}d`);
  if (latest.dio !== null) wcCommentParts.push(`DIO ${Math.round(latest.dio)}d`);
  if (latest.dpo !== null) wcCommentParts.push(`DPO ${Math.round(latest.dpo)}d`);
  if (latest.cashConversionCycle !== null) wcCommentParts.push(`Cash Conversion Cycle (CCC) = ${Math.round(latest.cashConversionCycle)} days`);
  const workingCapitalComment =
    wcCommentParts.length > 0
      ? `${wcCommentParts.join(' • ')}. Core W/C Funding Gap: ${fmtK(latest.workingCapitalFundingGap)} LE.`
      : `Net Working Capital stands at ${fmtK(latest.workingCapital)} LE (Current Ratio ${latest.currentRatio?.toFixed(2) ?? 'N/A'}x).`;

  // Facility Structuring Recommendation
  let facilityRecommendation = '';
  if (overallRating === 'Prime / Investment Grade' || overallRating === 'Acceptable Bankable') {
    const wcNeed = Math.max(0, Math.round(latest.workingCapitalFundingGap * 0.65));
    facilityRecommendation =
      `Creditworthy profile for structured corporate banking facilities. Recommended structure: ` +
      `(1) Revolving Working Capital / Overdraft Line capped around ${fmtK(wcNeed)} LE (against assigned A/R invoices & cash collection routing to bridge the ${latest.cashConversionCycle !== null ? Math.round(latest.cashConversionCycle) + '-day' : 'operating'} cash cycle); ` +
      `(2) Medium-Term Lease / Capex Line aligned to remaining PP&E life with minimum DSCR covenant >= 1.25x & Net Debt/EBITDA <= 2.50x; ` +
      `(3) LG Issuance Facility backed by cash margins / corporate guarantees. Standard CP: Tax clearance certificate & quarterly A/R aging.`;
  } else if (overallRating === 'Watchlist / Caution') {
    facilityRecommendation =
      `Selective credit appetite only with enhanced collateralization: prioritize self-liquidating invoice/contract-backed working capital lines, partial cash cover on LGs, subordination of sister-company payables, and strict DSCR (>= 1.20x) + leverage caps.`;
  } else {
    facilityRecommendation =
      `Decline unsecured term expansion; restrict exposure to 100% cash-covered LGs or confirmed sovereign/blue-chip contract assignments pending equity injection and liquidity restoration.`;
  }

  const executiveSummary =
    `${companyName} (FY ${latest.year}) recorded Revenues of ${fmtK(latest.revenues)} LE, EBITDA of ${fmtK(latest.ebitda)} LE (${latest.ebitdaMarginPct?.toFixed(1) ?? 'N/A'}%), ` +
    `and Net Profit of ${fmtK(latest.netProfitAfterTax)} LE. Total Financial Debt is ${fmtK(latest.totalDebt)} LE (${latest.debtToEquity?.toFixed(2) ?? 'N/A'}x Equity; ` +
    `${latest.netDebtToEbitda?.toFixed(2) ?? 'N/A'}x Net Debt/EBITDA) with DSCR at ${latest.dscr?.toFixed(2) ?? 'N/A'}x — overall risk assessed as ${overallRating}.`;

  return {
    overallRating,
    executiveSummary,
    strengths,
    risksAndRedFlags,
    workingCapitalComment,
    facilityRecommendation
  };
}

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
    const depr1 = is.depreciation1 || 0;
    const depr2 = is.depreciation2 || 0;
    const totalDepreciation = Math.abs(depr1) + Math.abs(depr2);
    const grossProfit = is.grossProfit || (revenues - Math.abs(cogs) - Math.abs(depr1));
    const sgaExpense = is.sgaExpense || 0;

    // Operating profit
    const netOperatingProfit = is.netOperatingProfit || (grossProfit - Math.abs(sgaExpense) - Math.abs(depr2));
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
    const netReceivables = bs.netReceivables || ((bs.accountsReceivable || 0) - (bs.lessAllowances || 0));
    const totalInventory = bs.totalInventory || 0;
    const totalCurrentAssets = bs.totalCurrentAssets || 0;
    const netPpe = bs.netPpe || ((bs.grossPlant || 0) - Math.abs(bs.lessAccumulatedDep || 0));
    const netIntangibles = bs.netIntangibles || 0;
    const totalAssets = bs.totalAssets || 0;

    // Debt & Liabilities
    const cpSeniorAndLease =
      (bs.cpSeniorDebtExisting || 0) +
      (bs.cpSeniorDebtNew || 0) +
      (bs.cpCapLease || 0) +
      (bs.cpSubDebtExisting || 0);
    const shortTermDebt =
      (bs.shortTermBorrowingExisting || 0) +
      (bs.shortTermBorrowingNew || 0) +
      cpSeniorAndLease;
    const accountsPayable = bs.accountsPayable || 0;
    const totCurrentLiabilities = bs.totCurrentLiabilities || 0;
    const longTermDebt = (bs.ltSeniorDebtExisting || 0) + (bs.ltSeniorDebtNew || 0) + (bs.ltLeaseObligation || 0);
    const totalLongTermDebt = bs.totalLongTermDebt || longTermDebt;
    const totalLiabilities = bs.totalLiabilities || (totCurrentLiabilities + totalLongTermDebt + (bs.otherNonCurrentLiab || 0));
    const totalDebt = shortTermDebt + totalLongTermDebt;
    const netDebt = Math.max(0, totalDebt - (cash + marketableSecurities));

    // Equity
    const commonStock = bs.commonStock || 0;
    const retainedEarnings = bs.retainedEarningsClosing || 0;
    const totalEquity = bs.totalEquity || (totalAssets - totalLiabilities);
    const totalLiabsAndEquity = bs.totalLiabsAndEquity || (totalLiabilities + totalEquity);

    // Working Capital & Cash Conversion Cycle
    const workingCapital = totalCurrentAssets - totCurrentLiabilities;
    const workingCapitalFundingGap = netReceivables + totalInventory - accountsPayable;
    const dso = revenues > 0 ? Math.round((netReceivables / revenues) * 365 * 10) / 10 : null;
    const absCogs = Math.abs(cogs);
    const dio = absCogs > 0 ? Math.round((totalInventory / absCogs) * 365 * 10) / 10 : null;
    const dpo = absCogs > 0 ? Math.round((accountsPayable / absCogs) * 365 * 10) / 10 : null;
    const cashConversionCycle =
      dso !== null || dio !== null
        ? Math.round(((dso ?? 0) + (dio ?? 0) - (dpo ?? 0)) * 10) / 10
        : null;

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
    const totalLiabilitiesToEquity = safeDivide(totalLiabilities, totalEquity);
    const gearingRatioPct = safePct(totalDebt, totalDebt + totalEquity);
    const debtToAssets = safeDivide(totalDebt, totalAssets);
    const financialLeverage = safeDivide(totalAssets, totalEquity);
    const interestCoverage = interestExpense > 0 ? safeDivide(netOperatingProfit, interestExpense) : null;
    const ebitdaToInterest = interestExpense > 0 ? safeDivide(ebitda, interestExpense) : null;
    const netDebtToEbitda = ebitda > 0 ? safeDivide(netDebt, ebitda) : null;
    const contractualDebtService = interestExpense + cpSeniorAndLease;
    const dscr = contractualDebtService > 0 ? safeDivide(ebitda, contractualDebtService) : null;

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

      const prevDebt =
        (prev.balanceSheet?.shortTermBorrowingExisting || 0) +
        (prev.balanceSheet?.cpSeniorDebtExisting || 0) +
        (prev.balanceSheet?.cpCapLease || 0) +
        (prev.balanceSheet?.totalLongTermDebt || 0);
      if (prevDebt !== 0) debtGrowthPct = safePct(totalDebt - prevDebt, Math.abs(prevDebt));
    }

    // Flagged movements & Credit Risk Warnings
    const flaggedVariances: string[] = [];
    if (revenueGrowthPct !== null) {
      if (revenueGrowthPct > 15) flaggedVariances.push(`Revenue expanded significantly by +${revenueGrowthPct}% YoY`);
      else if (revenueGrowthPct < -10) flaggedVariances.push(`Revenue contracted by ${revenueGrowthPct}% YoY`);
    }
    if (netMarginPct !== null && netMarginPct < 2) {
      flaggedVariances.push(`Thin net profit margin of ${netMarginPct}% indicates cost or pricing pressure`);
    }
    if (currentRatio !== null) {
      if (currentRatio < 1.0) flaggedVariances.push(`Current ratio is below 1.0x (${currentRatio.toFixed(2)}x) — short-term liquidity deficit`);
      else if (currentRatio >= 1.5) flaggedVariances.push(`Strong working capital coverage with current ratio of ${currentRatio.toFixed(2)}x`);
    }
    if (dscr !== null && dscr < 1.2) {
      flaggedVariances.push(`Tight DSCR of ${dscr.toFixed(2)}x below typical 1.20x bank debt service covenant`);
    } else if (dscr !== null && dscr >= 2.0) {
      flaggedVariances.push(`Robust debt service coverage (DSCR ${dscr.toFixed(2)}x) comfortably covers principal & interest`);
    }
    if (dso !== null && dso > 70) {
      flaggedVariances.push(`High Receivables collection period (DSO ${Math.round(dso)} days) ties up operating liquidity`);
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
      if (netMarginPct > 12) score += 12;
      else if (netMarginPct > 5) score += 7;
      else if (netMarginPct < 0) score -= 15;
    }
    if (currentRatio !== null) {
      if (currentRatio >= 1.5) score += 12;
      else if (currentRatio >= 1.1) score += 6;
      else if (currentRatio < 0.9) score -= 14;
    }
    if (debtToEquity !== null) {
      if (debtToEquity <= 1.0) score += 12;
      else if (debtToEquity <= 2.0) score += 5;
      else if (debtToEquity > 3.0) score -= 14;
    }
    if (interestCoverage !== null) {
      if (interestCoverage >= 3.0) score += 8;
      else if (interestCoverage >= 1.5) score += 4;
      else if (interestCoverage < 1.0) score -= 10;
    }
    if (dscr !== null) {
      if (dscr >= 2.0) score += 8;
      else if (dscr >= 1.25) score += 4;
      else if (dscr < 1.0) score -= 10;
    }
    if (netDebtToEbitda !== null) {
      if (netDebtToEbitda <= 1.5) score += 5;
      else if (netDebtToEbitda > 4.0) score -= 8;
    }
    if (workingCapital > 0) score += 4;
    else score -= 8;

    score = Math.max(10, Math.min(98, score));

    const creditRiskTier = score >= 75 ? 'Low Risk' : score >= 50 ? 'Moderate Risk' : 'High Risk';
    const liquidityStatus =
      currentRatio !== null && currentRatio >= 1.4
        ? 'Healthy'
        : currentRatio !== null && currentRatio >= 1.0
        ? 'Adequate'
        : 'Constrained';
    const solvencyStatus =
      debtToEquity !== null && debtToEquity <= 1.5
        ? 'Strong'
        : debtToEquity !== null && debtToEquity <= 2.5
        ? 'Moderate'
        : 'Stressed';

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
      workingCapitalFundingGap,
      dso,
      dio,
      dpo,
      cashConversionCycle,
      grossMarginPct,
      ebitdaMarginPct,
      operatingMarginPct,
      netMarginPct,
      currentRatio,
      quickRatio,
      cashRatio,
      debtToEquity,
      totalLiabilitiesToEquity,
      gearingRatioPct,
      debtToAssets,
      financialLeverage,
      interestCoverage,
      ebitdaToInterest,
      netDebtToEbitda,
      dscr,
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

  const latestCalculated = yearlyData[yearlyData.length - 1];
  const latestRaw = sorted[sorted.length - 1];
  const creditAnalystAssessment = buildCreditAnalystAssessment(latestCalculated, latestRaw, companyName);

  return {
    companyName,
    currency: 'EGP',
    reportingPeriod,
    years,
    latestYear,
    yearsCount: years.length,
    yearlyData,
    creditAnalystAssessment
  };
}
