// Pure deterministic financial statement arithmetic & validation engine
// Shared across Node/Vercel serverless functions and browser React UI.

const toNum = (v) => (typeof v === 'number' && !isNaN(v) && isFinite(v) ? v : 0);
const hasNum = (v) => typeof v === 'number' && !isNaN(v) && isFinite(v);

/**
 * Computes every financial subtotal & total strictly from extracted line items.
 * Never reads or trusts pre-printed model totals for computed fields.
 */
export function computeTotalsFromLineItems(data) {
  const is = data?.incomeStatement || {};
  const bs = data?.balanceSheet || {};

  // Income Statement line-by-line flow
  const revenues = toNum(is.revenues);
  const costOfGoodsSold = Math.abs(toNum(is.costOfGoodsSold));
  const depreciation1 = Math.abs(toNum(is.depreciation1));
  const grossProfit = revenues - costOfGoodsSold - depreciation1;

  const depreciation2 = Math.abs(toNum(is.depreciation2));
  const sgaExpense = Math.abs(toNum(is.sgaExpense));
  const provisions1 = Math.abs(toNum(is.provisions1));
  const rd = Math.abs(toNum(is.rd));
  const goodwillAmortization = Math.abs(toNum(is.goodwillAmortization));
  const otherAmortization = Math.abs(toNum(is.otherAmortization));
  const netOperatingProfit =
    grossProfit - (depreciation2 + sgaExpense + provisions1 + rd + goodwillAmortization + otherAmortization);

  const interestExpense =
    Math.abs(toNum(is.grossInterestExpExist)) +
    Math.abs(toNum(is.interestExpNew)) +
    Math.abs(toNum(is.capitalizedInterest));
  const netProfitBeforeTax =
    netOperatingProfit -
    interestExpense +
    toNum(is.interestIncome) +
    toNum(is.dividendIncome) +
    toNum(is.provDoubtfulRec) +
    toNum(is.provisions2) +
    toNum(is.fxGL) +
    toNum(is.sundryIncomeExpense1);

  const totalTaxExpense = Math.abs(toNum(is.totalTaxExpense) || toNum(is.currentTaxExpense));
  const netProfitAfterTax = netProfitBeforeTax - totalTaxExpense;
  const npaui =
    netProfitAfterTax -
    Math.abs(toNum(is.minorityInterestExpense)) +
    toNum(is.saleOfPlant) +
    toNum(is.sundryIncomeExpense2);
  const totalChange =
    npaui -
    Math.abs(toNum(is.prefShareDividends)) -
    Math.abs(toNum(is.commonStockDividends)) +
    toNum(is.otherAdjustment);

  // Balance Sheet Assets line-by-line
  const netReceivables = toNum(bs.accountsReceivable) - Math.abs(toNum(bs.lessAllowances));
  const totalInventory =
    toNum(bs.rawMaterials) + toNum(bs.workInProgress) + toNum(bs.finishedGoods) + toNum(bs.goodsInTransit);
  const totalCurrentAssets =
    toNum(bs.cash) +
    toNum(bs.marketableSecurities) +
    toNum(bs.marketableSecExcess) +
    netReceivables +
    totalInventory +
    toNum(bs.advancePayments) +
    toNum(bs.nonTradeRec) +
    toNum(bs.otherCurrentAssets) +
    toNum(bs.dueFromSisterCo1);

  const grossPlant =
    toNum(bs.land) + toNum(bs.buildingImprovement) + toNum(bs.machineryEquipment) + toNum(bs.constInProgress);
  const netPpe = grossPlant - Math.abs(toNum(bs.lessAccumulatedDep));
  const netIntangibles =
    toNum(bs.goodwill) + toNum(bs.otherIntangibleAsset) - Math.abs(toNum(bs.lessAccumAmortization));

  const totalAssets =
    totalCurrentAssets +
    netPpe +
    toNum(bs.accountsReceivablesLt) +
    toNum(bs.dueFromSisterCo2) +
    toNum(bs.otherTangibleAsset) +
    toNum(bs.deferredTaxAsset) +
    toNum(bs.prepaids) +
    netIntangibles;

  // Balance Sheet Liabilities & Equity line-by-line
  const totCurrentLiabilities =
    toNum(bs.shortTermBorrowingExisting) +
    toNum(bs.shortTermBorrowingNew) +
    toNum(bs.cpSeniorDebtExisting) +
    toNum(bs.cpSeniorDebtNew) +
    toNum(bs.cpCapLease) +
    toNum(bs.cpSubDebtExisting) +
    toNum(bs.cpSalesTax) +
    toNum(bs.accountsPayable) +
    toNum(bs.taxesPayable) +
    toNum(bs.accruedExpenses) +
    toNum(bs.interestPayable) +
    toNum(bs.dividendsPayable) +
    toNum(bs.downPayments) +
    toNum(bs.dueToSisterCo3) +
    toNum(bs.otherCurrentLiability);

  const totalLongTermDebt =
    toNum(bs.ltLeaseObligation) +
    toNum(bs.ltSeniorDebtExisting) +
    toNum(bs.ltSeniorDebtNew) +
    toNum(bs.ltTaxes) +
    toNum(bs.ltSharholderLoan);

  const totalLiabilities = totCurrentLiabilities + totalLongTermDebt + toNum(bs.otherNonCurrentLiab);
  const totalGreyArea = toNum(bs.deferredTaxes) + toNum(bs.minorityInterest) + toNum(bs.provisions3);

  const retainedEarningsClosing =
    toNum(bs.retainedEarningsOpening) +
    toNum(bs.plusNetIncome) -
    Math.abs(toNum(bs.lessDividends)) +
    toNum(bs.otherAdjustments);

  const totalEquity =
    toNum(bs.preferredStock) +
    toNum(bs.commonStock) +
    toNum(bs.additionalPaidInCapital) +
    retainedEarningsClosing +
    toNum(bs.ownersAccount) +
    toNum(bs.fxAdjustment) +
    toNum(bs.legalReserve);

  const totalLiabsAndEquity = totalLiabilities + totalGreyArea + totalEquity;

  return {
    incomeStatement: {
      revenues,
      grossProfit,
      netOperatingProfit,
      netProfitBeforeTax,
      netProfitAfterTax,
      npaui,
      totalChange,
    },
    balanceSheet: {
      netReceivables,
      totalInventory,
      totalCurrentAssets,
      grossPlant,
      netPpe,
      netIntangibles,
      totalAssets,
      totCurrentLiabilities,
      totalLongTermDebt,
      totalLiabilities,
      totalGreyArea,
      retainedEarningsClosing,
      totalEquity,
      totalLiabsAndEquity,
    },
  };
}

function withinTolerance(computed, printed, tolerancePct = 0.005) {
  const diff = computed - printed;
  const base = Math.max(Math.abs(printed), Math.abs(computed), 1);
  const maxAllowed = Math.max(50, base * tolerancePct);
  const pctDiff = base > 0 ? Math.abs(diff) / base : 0;
  return {
    passed: Math.abs(diff) <= maxAllowed,
    diff,
    pctDiff: Math.round(pctDiff * 10000) / 100, // e.g., 0.12%
  };
}

/**
 * Runs comprehensive banking-grade validation checks comparing computed line-item sums
 * against printed totals without silently mutating printed totals.
 */
export function validateFinancialData(data) {
  const computed = computeTotalsFromLineItems(data);
  const pt = data?.printedTotals || {};
  const ws = data?.verificationWorksheet || {};
  const bs = data?.balanceSheet || {};
  const is = data?.incomeStatement || {};
  const unitMeta = data?.unitMetadata || {};
  const pages = data?.pageCitations || {};

  const checks = [];
  const failingSections = new Set();

  // Helper to resolve printed total cleanly (never invents missing values)
  const getPrinted = (primary, fallback) => {
    if (hasNum(primary)) return primary;
    if (hasNum(fallback)) return fallback;
    return null;
  };

  // 1. Balance Sheet Accounting Equation: Computed Assets = Computed L + E (0.5% tolerance)
  {
    const a = computed.balanceSheet.totalAssets;
    const le = computed.balanceSheet.totalLiabsAndEquity;
    const { passed, diff, pctDiff } = withinTolerance(a, le, 0.005);
    if (!passed) {
      failingSections.add('balance_sheet_assets');
      failingSections.add('balance_sheet_liabilities_equity');
    }
    checks.push({
      id: 'balance_equation',
      section: 'balance_sheet',
      labelEn: 'Assets = Liabilities + Equity',
      labelAr: 'توازن الميزانية (الأصول = الخصوم + حقوق الملكية)',
      passed,
      status: passed ? 'passed' : 'mismatch',
      computedValue: a,
      printedValue: le,
      difference: diff,
      pctDiff,
      toleranceDescription: '0.5%',
      pageNumber: pages.balanceSheetPage ?? null,
      detail: passed
        ? `Balanced within ${pctDiff.toFixed(2)}% tolerance`
        : `Imbalance of ${Math.round(diff).toLocaleString('en-US')} (${pctDiff.toFixed(2)}%)`,
    });
  }

  // 2. Current Assets Sum vs Printed Total Current Assets
  // Note: account transparently for non-current Withholding Tax reclassified from Debtors
  {
    const printedCA = getPrinted(pt.totalCurrentAssets, ws.faceTotalCurrentAssets);
    const whtReclassified = Math.abs(toNum(ws.withholdingTaxAssetInDebtorsNote));
    const directCA = computed.balanceSheet.totalCurrentAssets;
    const preReclassCA = directCA + (toNum(bs.deferredTaxAsset) >= whtReclassified ? whtReclassified : 0);

    if (printedCA !== null) {
      const checkDirect = withinTolerance(directCA, printedCA, 0.005);
      const checkWithWht = withinTolerance(preReclassCA, printedCA, 0.005);
      const best = checkDirect.passed ? checkDirect : checkWithWht;
      const usedVal = checkDirect.passed ? directCA : preReclassCA;
      if (!best.passed) failingSections.add('balance_sheet_assets');
      checks.push({
        id: 'current_assets_sum',
        section: 'assets',
        labelEn: 'Current Assets Sum vs Printed',
        labelAr: 'تطابق مجموع الأصول المتداولة',
        passed: best.passed,
        status: best.passed ? 'passed' : 'mismatch',
        computedValue: usedVal,
        printedValue: printedCA,
        difference: best.diff,
        pctDiff: best.pctDiff,
        toleranceDescription: '0.5%',
        pageNumber: pages.balanceSheetPage ?? null,
        detail: best.passed
          ? checkDirect.passed
            ? 'Line items match printed Current Assets'
            : 'Matches printed Current Assets before non-current WHT reclassification'
          : `Difference of ${Math.round(best.diff).toLocaleString('en-US')} vs printed`,
      });
    }
  }

  // 3. Net PP&E vs Printed Net PP&E
  {
    const printedPpe = getPrinted(pt.netPpe, ws.faceNetPpe);
    if (printedPpe !== null) {
      const compPpe = computed.balanceSheet.netPpe;
      const { passed, diff, pctDiff } = withinTolerance(compPpe, printedPpe, 0.005);
      if (!passed) failingSections.add('balance_sheet_assets');
      checks.push({
        id: 'net_ppe_sum',
        section: 'assets',
        labelEn: 'Net PP&E vs Schedule & Printed',
        labelAr: 'تطابق صافي الأصول الثابتة',
        passed,
        status: passed ? 'passed' : 'mismatch',
        computedValue: compPpe,
        printedValue: printedPpe,
        difference: diff,
        pctDiff,
        toleranceDescription: '0.5%',
        pageNumber: pages.fixedAssetsNotePage ?? pages.balanceSheetPage ?? null,
        detail: passed
          ? 'Fixed Assets cost less accumulated depreciation matches printed Net PP&E'
          : `Net PP&E differs from printed by ${Math.round(diff).toLocaleString('en-US')}`,
      });
    }
  }

  // 4. Total Assets Sum vs Printed Total Assets
  {
    const printedAssets = getPrinted(pt.totalAssets, ws.faceTotalAssets);
    if (printedAssets !== null) {
      const compAssets = computed.balanceSheet.totalAssets;
      const { passed, diff, pctDiff } = withinTolerance(compAssets, printedAssets, 0.005);
      if (!passed) failingSections.add('balance_sheet_assets');
      checks.push({
        id: 'total_assets_sum',
        section: 'assets',
        labelEn: 'Total Assets vs Printed',
        labelAr: 'تطابق إجمالي الأصول',
        passed,
        status: passed ? 'passed' : 'mismatch',
        computedValue: compAssets,
        printedValue: printedAssets,
        difference: diff,
        pctDiff,
        toleranceDescription: '0.5%',
        pageNumber: pages.balanceSheetPage ?? null,
        detail: passed
          ? 'All asset line items sum to printed Total Assets'
          : `Computed Assets differ from printed by ${Math.round(diff).toLocaleString('en-US')}`,
      });
    }
  }

  // 5. Current Liabilities Sum vs Printed Current Liabilities
  {
    const printedCL = getPrinted(pt.totCurrentLiabilities, ws.faceTotalCurrentLiabilities);
    if (printedCL !== null) {
      const compCL = computed.balanceSheet.totCurrentLiabilities;
      const { passed, diff, pctDiff } = withinTolerance(compCL, printedCL, 0.005);
      if (!passed) failingSections.add('balance_sheet_liabilities_equity');
      checks.push({
        id: 'current_liabilities_sum',
        section: 'liabilities_equity',
        labelEn: 'Current Liabilities Sum vs Printed',
        labelAr: 'تطابق مجموع الالتزامات المتداولة',
        passed,
        status: passed ? 'passed' : 'mismatch',
        computedValue: compCL,
        printedValue: printedCL,
        difference: diff,
        pctDiff,
        toleranceDescription: '0.5%',
        pageNumber: pages.balanceSheetPage ?? null,
        detail: passed
          ? 'Current liability lines sum to printed total'
          : `Computed Current Liabilities differ from printed by ${Math.round(diff).toLocaleString('en-US')}`,
      });
    }
  }

  // 5b. Total Liabilities vs Printed Total Liabilities
  {
    const printedTL = getPrinted(pt.totalLiabilities, ws.faceTotalLiabilities);
    if (printedTL !== null) {
      const compTL = computed.balanceSheet.totalLiabilities;
      const { passed, diff, pctDiff } = withinTolerance(compTL, printedTL, 0.005);
      if (!passed) failingSections.add('balance_sheet_liabilities_equity');
      checks.push({
        id: 'total_liabilities_sum',
        section: 'liabilities_equity',
        labelEn: 'Total Liabilities vs Printed',
        labelAr: 'تطابق إجمالي الالتزامات',
        passed,
        status: passed ? 'passed' : 'mismatch',
        computedValue: compTL,
        printedValue: printedTL,
        difference: diff,
        pctDiff,
        toleranceDescription: '0.5%',
        pageNumber: pages.balanceSheetPage ?? null,
        detail: passed
          ? 'Total Liabilities sum to printed total'
          : `Computed Total Liabilities differ from printed by ${Math.round(diff).toLocaleString('en-US')}`,
      });
    }
  }

  // 6. Total Liabilities & Equity vs Printed Total L&E + Total Equity check
  {
    const printedEquity = getPrinted(pt.totalEquity, ws.faceTotalEquity);
    if (printedEquity !== null) {
      const compEquity = computed.balanceSheet.totalEquity;
      const { passed, diff, pctDiff } = withinTolerance(compEquity, printedEquity, 0.005);
      if (!passed) failingSections.add('balance_sheet_liabilities_equity');
      checks.push({
        id: 'total_equity_sum',
        section: 'liabilities_equity',
        labelEn: 'Total Equity vs Printed',
        labelAr: 'تطابق إجمالي حقوق الملكية',
        passed,
        status: passed ? 'passed' : 'mismatch',
        computedValue: compEquity,
        printedValue: printedEquity,
        difference: diff,
        pctDiff,
        toleranceDescription: '0.5%',
        pageNumber: pages.equityStatementPage ?? pages.balanceSheetPage ?? null,
        detail: passed
          ? 'Equity components sum to printed Total Equity'
          : `Computed Equity differs from printed by ${Math.round(diff).toLocaleString('en-US')}`,
      });
    }

    const printedLE = getPrinted(pt.totalLiabsAndEquity, ws.faceTotalLiabsAndEquity);
    if (printedLE !== null) {
      const compLE = computed.balanceSheet.totalLiabsAndEquity;
      const { passed, diff, pctDiff } = withinTolerance(compLE, printedLE, 0.005);
      if (!passed) failingSections.add('balance_sheet_liabilities_equity');
      checks.push({
        id: 'total_le_sum',
        section: 'liabilities_equity',
        labelEn: 'Total Liabilities & Equity vs Printed',
        labelAr: 'تطابق إجمالي الخصوم وحقوق الملكية',
        passed,
        status: passed ? 'passed' : 'mismatch',
        computedValue: compLE,
        printedValue: printedLE,
        difference: diff,
        pctDiff,
        toleranceDescription: '0.5%',
        pageNumber: pages.balanceSheetPage ?? null,
        detail: passed
          ? 'Total Liabilities & Equity matches printed statement'
          : `Computed Total L&E differs from printed by ${Math.round(diff).toLocaleString('en-US')}`,
      });
    }
  }

  // 7. Income Statement Flow Check (Revenue -> Gross Profit -> EBIT -> EBT -> Net Income)
  {
    const bankChargesReclass = Math.abs(toNum(ws.bankChargesInGnaNote));
    const printedOpProfit = getPrinted(pt.operatingProfit, null);
    const ebitDirect = printedOpProfit !== null ? withinTolerance(computed.incomeStatement.netOperatingProfit, printedOpProfit, 0.005) : null;
    const ebitPreReclass = printedOpProfit !== null && bankChargesReclass > 0
      ? withinTolerance(computed.incomeStatement.netOperatingProfit - bankChargesReclass, printedOpProfit, 0.005)
      : null;
    const effectiveEbitComp = ebitDirect && !ebitDirect.passed && ebitPreReclass?.passed
      ? computed.incomeStatement.netOperatingProfit - bankChargesReclass
      : computed.incomeStatement.netOperatingProfit;

    const isPairs = [
      { name: 'Gross Profit', comp: computed.incomeStatement.grossProfit, prn: getPrinted(pt.grossProfit, null) },
      { name: 'Operating Profit (EBIT)', comp: effectiveEbitComp, prn: printedOpProfit },
      { name: 'Net Profit Before Tax', comp: computed.incomeStatement.netProfitBeforeTax, prn: getPrinted(pt.netProfitBeforeTax, null) },
      { name: 'Net Profit After Tax', comp: computed.incomeStatement.netProfitAfterTax, prn: getPrinted(pt.netProfitAfterTax, ws.faceCurrentYearNetIncomeLine) },
    ].filter((p) => p.prn !== null);

    let worst = { name: '', passed: true, diff: 0, pctDiff: 0, comp: computed.incomeStatement.netProfitAfterTax, prn: computed.incomeStatement.netProfitAfterTax };
    for (const pair of isPairs) {
      const res = withinTolerance(pair.comp, pair.prn, 0.005);
      if (!res.passed && Math.abs(res.diff) >= Math.abs(worst.diff)) {
        worst = { name: pair.name, passed: false, diff: res.diff, pctDiff: res.pctDiff, comp: pair.comp, prn: pair.prn };
      }
    }
    if (!worst.passed) failingSections.add('income_statement');
    checks.push({
      id: 'income_statement_flow',
      section: 'income_statement',
      labelEn: 'Income Statement Flow to Net Income',
      labelAr: 'تطابق تسلسل قائمة الدخل حتى صافي الربح',
      passed: worst.passed,
      status: worst.passed ? 'passed' : 'mismatch',
      computedValue: worst.comp,
      printedValue: worst.prn,
      difference: worst.diff,
      pctDiff: worst.pctDiff,
      toleranceDescription: '0.5%',
      pageNumber: pages.incomeStatementPage ?? null,
      detail: worst.passed
        ? 'Revenues, Gross Profit, EBIT, EBT, and Net Income reconcile cleanly'
        : `${worst.name} mismatch: computed ${Math.round(worst.comp).toLocaleString('en-US')} vs printed ${Math.round(worst.prn).toLocaleString('en-US')}`,
    });
  }

  // 8. Net Income Agrees with Equity Movement
  {
    const isNetInc = computed.incomeStatement.npaui;
    const eqNetInc = toNum(bs.plusNetIncome);
    const niCheck = withinTolerance(eqNetInc, isNetInc, 0.005);
    const reClosingCheck =
      hasNum(ws.faceRetainedEarningsCarriedForwardOnly) && hasNum(ws.faceCurrentYearNetIncomeLine)
        ? withinTolerance(
            computed.balanceSheet.retainedEarningsClosing,
            ws.faceRetainedEarningsCarriedForwardOnly + ws.faceCurrentYearNetIncomeLine,
            0.005
          )
        : { passed: true, diff: 0, pctDiff: 0 };

    const passed = niCheck.passed && reClosingCheck.passed;
    const diff = !niCheck.passed ? niCheck.diff : reClosingCheck.diff;
    const pctDiff = !niCheck.passed ? niCheck.pctDiff : reClosingCheck.pctDiff;
    if (!passed) failingSections.add('equity_movement');
    checks.push({
      id: 'equity_movement_agreement',
      section: 'equity_movement',
      labelEn: 'Net Income Agrees with Equity Movement',
      labelAr: 'تطابق صافي الربح مع حركة حقوق الملكية',
      passed,
      status: passed ? 'passed' : 'mismatch',
      computedValue: !niCheck.passed ? eqNetInc : computed.balanceSheet.retainedEarningsClosing,
      printedValue: !niCheck.passed
        ? isNetInc
        : (ws.faceRetainedEarningsCarriedForwardOnly || 0) + (ws.faceCurrentYearNetIncomeLine || 0),
      difference: diff,
      pctDiff,
      toleranceDescription: '0.5%',
      pageNumber: pages.equityStatementPage ?? null,
      detail: passed
        ? 'Income statement Net Income ties to Retained Earnings movement'
        : `Equity movement mismatch of ${Math.round(diff).toLocaleString('en-US')}`,
    });
  }

  // 9. Cash Flow Closing Cash Agrees with Balance Sheet Cash
  {
    const cfClosing = hasNum(pt.cashFlowClosingCash) ? pt.cashFlowClosingCash : null;
    if (cfClosing === null) {
      checks.push({
        id: 'cash_flow_agreement',
        section: 'cash_flow',
        labelEn: 'Cash Flow Closing Cash vs Balance Sheet',
        labelAr: 'تطابق نقدية آخر المدة بالتدفقات النقدية',
        passed: true,
        status: 'skipped',
        computedValue: toNum(bs.cash),
        printedValue: null,
        difference: null,
        pctDiff: null,
        toleranceDescription: '0.5%',
        pageNumber: pages.cashFlowPage ?? null,
        detail: 'Cash Flow statement not included / no closing cash printed in upload',
      });
    } else {
      const bsCash = toNum(bs.cash);
      // Standard match vs Cash & Cash Equivalents (or net of bank overdraft if EAS cash-eq definition applies)
      const directMatch = withinTolerance(bsCash, cfClosing, 0.005);
      const netOfOverdraft = bsCash - Math.abs(toNum(bs.shortTermBorrowingExisting));
      const overdraftMatch = toNum(bs.shortTermBorrowingExisting) > 0 && withinTolerance(netOfOverdraft, cfClosing, 0.005).passed;
      const passed = directMatch.passed || overdraftMatch;
      if (!passed) failingSections.add('cash_flow');
      checks.push({
        id: 'cash_flow_agreement',
        section: 'cash_flow',
        labelEn: 'Cash Flow Closing Cash vs Balance Sheet',
        labelAr: 'تطابق نقدية آخر المدة بالتدفقات النقدية',
        passed,
        status: passed ? 'passed' : 'mismatch',
        computedValue: overdraftMatch ? netOfOverdraft : bsCash,
        printedValue: cfClosing,
        difference: overdraftMatch ? 0 : directMatch.diff,
        pctDiff: overdraftMatch ? 0 : directMatch.pctDiff,
        toleranceDescription: '0.5%',
        pageNumber: pages.cashFlowPage ?? null,
        detail: directMatch.passed
          ? 'Cash Flow closing cash matches Balance Sheet cash'
          : overdraftMatch
          ? 'Matches Balance Sheet Cash net of Bank Overdraft (EAS Cash Equivalents basis)'
          : `Cash Flow closing cash differs from BS cash by ${Math.round(directMatch.diff).toLocaleString('en-US')}`,
      });
    }
  }

  // 10. Unit, Currency & Thousands Scale Consistency
  {
    const scaleReportedConsistent = unitMeta.scaleConsistentAcrossPages !== false;
    const rev = Math.abs(computed.incomeStatement.revenues);
    const assets = Math.abs(computed.balanceSheet.totalAssets);
    // Catch egregious 1,000x mixed-unit bugs (e.g. Revenue in thousands while Assets in units -> 500x ratio)
    const extremeRatio =
      rev > 0 && assets > 0 && (assets / rev > 200 || rev / assets > 200);
    const passed = scaleReportedConsistent && !extremeRatio;
    if (!passed) failingSections.add('scale_unit');
    checks.push({
      id: 'scale_unit_consistency',
      section: 'scale_unit',
      labelEn: 'Currency & Scale Consistency',
      labelAr: 'توحيد العملة ووحدة القياس (ألف / جنيه)',
      passed,
      status: passed ? 'passed' : 'mismatch',
      computedValue: unitMeta.scaleMultiplierApplied || 1,
      printedValue: unitMeta.scaleMultiplierApplied || 1,
      difference: 0,
      pctDiff: 0,
      toleranceDescription: 'Uniform',
      pageNumber: pages.balanceSheetPage ?? 1,
      detail: passed
        ? `${unitMeta.currency || 'EGP'} (${unitMeta.originalScale || 'units'} × ${unitMeta.scaleMultiplierApplied || 1}) applied uniformly`
        : 'Suspected unit/scale mismatch between statement sections (check thousands vs full units)',
    });
  }

  const evaluated = checks.filter((c) => c.status !== 'skipped');
  const passedCount = evaluated.filter((c) => c.passed).length;
  const failedCount = evaluated.filter((c) => !c.passed).length;
  const totalDifference = evaluated.reduce((acc, c) => acc + Math.abs(toNum(c.difference)), 0);

  return {
    allPassed: failedCount === 0,
    passedCount,
    failedCount,
    skippedCount: checks.length - evaluated.length,
    totalDifference,
    failingSections: Array.from(failingSections),
    checks,
    computedTotals: computed,
  };
}

/**
 * Reconciles raw extracted data, computes all subtotals/totals strictly in code,
 * preserves verbatim printedTotals, records nullFields, and attaches validation checks.
 */
export function reconcileFinancialData(extractedData) {
  if (!extractedData) return extractedData;
  const n = (v) => (typeof v === 'number' && !isNaN(v) && isFinite(v) ? v : 0);
  const hasVal = (v) => typeof v === 'number' && !isNaN(v) && isFinite(v);

  const is = extractedData.incomeStatement || (extractedData.incomeStatement = {});
  const bs = extractedData.balanceSheet || (extractedData.balanceSheet = {});
  const ws = extractedData.verificationWorksheet || {};
  const notes = extractedData.notes || (extractedData.notes = {});

  // Preserve model's original verbatim printedTotals untouched!
  const printedTotals = extractedData.printedTotals
    ? { ...extractedData.printedTotals }
    : {};
  extractedData.printedTotals = printedTotals;

  // Record which core line items the model returned as null before normalizing numeric inputs
  const nullFields = [];
  for (const [k, v] of Object.entries(is)) {
    if (v === null) nullFields.push(`incomeStatement.${k}`);
  }
  for (const [k, v] of Object.entries(bs)) {
    if (v === null) nullFields.push(`balanceSheet.${k}`);
  }
  extractedData.nullFields = nullFields;

  // -------------------------------------------------------------------------
  // 1. Income Statement normalization & Bank Charges / Legal Reserve reclass
  // -------------------------------------------------------------------------
  is.revenues = n(is.revenues);
  is.costOfGoodsSold = Math.abs(n(is.costOfGoodsSold));
  is.depreciation1 = Math.abs(n(is.depreciation1));
  is.depreciation2 = Math.abs(n(is.depreciation2));
  is.sgaExpense = Math.abs(n(is.sgaExpense));
  is.provisions1 = Math.abs(n(is.provisions1));
  is.rd = Math.abs(n(is.rd));
  is.goodwillAmortization = Math.abs(n(is.goodwillAmortization));
  is.otherAmortization = Math.abs(n(is.otherAmortization));
  is.grossInterestExpExist = Math.abs(n(is.grossInterestExpExist));
  is.interestExpNew = Math.abs(n(is.interestExpNew));
  is.capitalizedInterest = Math.abs(n(is.capitalizedInterest));
  is.totalTaxExpense = Math.abs(n(is.totalTaxExpense) || n(is.currentTaxExpense));
  if (n(is.currentTaxExpense) === 0 && n(is.totalTaxExpense) > 0) {
    is.currentTaxExpense = is.totalTaxExpense;
  }

  // Enforce Bank Charges reclassification deterministically using Face Income Statement figures
  const bankCharges = Math.abs(n(ws.bankChargesInGnaNote));
  const faceGna = Math.abs(n(ws.faceGnaExpense));
  const faceFin = Math.abs(n(ws.faceFinanceCosts));
  if (bankCharges > 0 && faceGna > bankCharges) {
    if (Math.abs(is.sgaExpense - faceGna) <= 100 || (faceFin > 0 && Math.abs(is.grossInterestExpExist - faceFin) <= 100)) {
      is.sgaExpense = Math.round(faceGna - bankCharges);
      is.grossInterestExpExist = Math.round((faceFin > 0 ? faceFin : is.grossInterestExpExist) + bankCharges);
      notes.sgaExpense = `Face G&A (${Math.round(faceGna / 1000).toLocaleString()}k) net of bank charges (${Math.round(bankCharges / 1000).toLocaleString()}k) reclassified to Finance Costs.`;
      notes.grossInterestExpExist = `Face Finance Costs (${Math.round((faceFin > 0 ? faceFin : is.grossInterestExpExist) / 1000).toLocaleString()}k) + bank charges (${Math.round(bankCharges / 1000).toLocaleString()}k).`;
    }
  }

  // Legal Reserve appropriation check from Equity Statement
  const legalResApp = Math.abs(n(ws.legalReserveAppropriationAmount));
  if (n(is.otherAdjustment) === 0 && n(bs.otherAdjustments) !== 0) {
    is.otherAdjustment = n(bs.otherAdjustments);
  } else if (n(is.otherAdjustment) === 0 && legalResApp > 0) {
    is.otherAdjustment = -legalResApp;
    notes.otherAdjustment = `Legal reserve appropriation (-${Math.round(legalResApp / 1000).toLocaleString()}k) per Statement of Changes in Equity.`;
  }

  // -------------------------------------------------------------------------
  // 2. Balance Sheet Assets Notes Reclassification & Line Normalization
  // -------------------------------------------------------------------------
  if (n(bs.accountsReceivable) === 0 && n(bs.netReceivables) > 0) {
    bs.accountsReceivable = n(bs.netReceivables) + Math.abs(n(bs.lessAllowances));
  }
  bs.lessAllowances = Math.abs(n(bs.lessAllowances));

  const invSum = n(bs.rawMaterials) + n(bs.workInProgress) + n(bs.finishedGoods) + n(bs.goodsInTransit);
  if (invSum === 0 && n(bs.totalInventory) > 0) {
    bs.finishedGoods = n(bs.totalInventory);
  }

  // Debtors & Other Debit Balances Reclassification Audit
  const lgMargin = Math.abs(n(ws.lgCashMarginInDebtorsNote));
  const whtAsset = Math.abs(n(ws.withholdingTaxAssetInDebtorsNote));
  const faceDebtors = Math.abs(n(ws.faceOtherDebtorsTotal));

  if (lgMargin > 0 && n(bs.marketableSecurities) === 0) {
    bs.marketableSecurities = lgMargin;
    notes.marketableSecurities = `Reclassified LG Cash Margins (${Math.round(lgMargin / 1000).toLocaleString()}k) from Other Debtors.`;
  }
  if (whtAsset > 0 && n(bs.deferredTaxAsset) === 0) {
    bs.deferredTaxAsset = whtAsset;
    notes.deferredTaxAsset = `Reclassified Withholding Taxes at Source (${Math.round(whtAsset / 1000).toLocaleString()}k) from Other Debtors to Non-Current.`;
  }
  if (faceDebtors > 0) {
    const expectedOtherCA = faceDebtors - n(bs.marketableSecurities) - n(bs.deferredTaxAsset);
    if (expectedOtherCA >= 0 && Math.abs(n(bs.otherCurrentAssets) - expectedOtherCA) > 5000 && n(bs.otherCurrentAssets) === 0) {
      bs.otherCurrentAssets = expectedOtherCA;
      notes.otherCurrentAssets = `Other Debtors (${Math.round(faceDebtors / 1000).toLocaleString()}k) net of LG Cash Margins & Non-Current Withholding Taxes.`;
    }
  }

  // Fixed Assets Schedule Reconciliation against 7-column Ending Dec 31 figures
  const faceNetPpe = n(printedTotals.netPpe) || n(ws.faceNetPpe);
  const schedCostEnd = n(ws.fixedAssetsTotalCostEndingDec31);
  const schedAccDepEnd = Math.abs(n(ws.fixedAssetsTotalAccumDepEndingDec31));

  if (n(ws.leaseholdImprovementsGrossCostEndingDec31) + n(ws.computersGrossCostEndingDec31) + n(ws.appliancesGrossCostEndingDec31) > 0) {
    const wsBldgSum = n(ws.leaseholdImprovementsGrossCostEndingDec31) + n(ws.computersGrossCostEndingDec31) + n(ws.appliancesGrossCostEndingDec31);
    if (n(bs.buildingImprovement) > 0 && n(bs.buildingImprovement) < wsBldgSum) {
      bs.buildingImprovement = n(bs.buildingImprovement) + wsBldgSum;
    }
  }
  if (n(ws.toolsGrossCostEndingDec31) + n(ws.carsGrossCostEndingDec31) > 0) {
    const wsMachSum = n(ws.toolsGrossCostEndingDec31) + n(ws.carsGrossCostEndingDec31);
    if (n(bs.machineryEquipment) > 0 && n(bs.machineryEquipment) < wsMachSum) {
      bs.machineryEquipment = n(bs.machineryEquipment) + wsMachSum;
    }
  }

  bs.lessAccumulatedDep = Math.abs(n(bs.lessAccumulatedDep));
  if (schedAccDepEnd > 0 && bs.lessAccumulatedDep !== schedAccDepEnd) {
    if (faceNetPpe > 0 && schedCostEnd > 0 && Math.abs((schedCostEnd - schedAccDepEnd) - faceNetPpe) <= 50) {
      bs.lessAccumulatedDep = schedAccDepEnd;
    }
  }

  let ppeComponentsSum = n(bs.land) + n(bs.buildingImprovement) + n(bs.machineryEquipment) + n(bs.constInProgress);
  if (ppeComponentsSum === 0) {
    if (schedCostEnd > 0) {
      bs.machineryEquipment = schedCostEnd;
    } else if (n(bs.grossPlant) > 0) {
      bs.machineryEquipment = n(bs.grossPlant);
    } else if (faceNetPpe > 0 || n(bs.netPpe) > 0) {
      const targetNet = faceNetPpe > 0 ? faceNetPpe : n(bs.netPpe);
      bs.machineryEquipment = targetNet + bs.lessAccumulatedDep;
    }
    ppeComponentsSum = n(bs.land) + n(bs.buildingImprovement) + n(bs.machineryEquipment) + n(bs.constInProgress);
  }

  if (schedCostEnd > 0 && Math.abs(ppeComponentsSum - schedCostEnd) > 100 && faceNetPpe > 0 && Math.abs((schedCostEnd - bs.lessAccumulatedDep) - faceNetPpe) <= 100) {
    const missingGross = schedCostEnd - ppeComponentsSum;
    if (missingGross > 0) {
      bs.machineryEquipment = n(bs.machineryEquipment) + missingGross;
      notes.machineryEquipment = `Reconciled to Fixed Assets Ending Gross Cost schedule (${Math.round(schedCostEnd / 1000).toLocaleString()}k).`;
    }
  } else if (faceNetPpe > 0 && Math.abs((ppeComponentsSum - bs.lessAccumulatedDep) - faceNetPpe) > 100) {
    if (schedCostEnd > 0 && schedAccDepEnd > 0 && Math.abs((schedCostEnd - schedAccDepEnd) - faceNetPpe) <= 100) {
      bs.lessAccumulatedDep = schedAccDepEnd;
      bs.machineryEquipment = Math.max(0, schedCostEnd - n(bs.land) - n(bs.buildingImprovement) - n(bs.constInProgress));
    }
  }

  bs.lessAccumAmortization = Math.abs(n(bs.lessAccumAmortization));
  const intangGross = n(bs.goodwill) + n(bs.otherIntangibleAsset);
  if (intangGross === 0 && n(bs.netIntangibles) > 0) {
    bs.otherIntangibleAsset = n(bs.netIntangibles) + bs.lessAccumAmortization;
  }

  // -------------------------------------------------------------------------
  // 3. Liabilities & Creditors Note Reconciliation
  // -------------------------------------------------------------------------
  if (n(bs.dueToSisterCo3) === 0 && n(bs.dueToSisterCo) > 0) {
    bs.dueToSisterCo3 = n(bs.dueToSisterCo);
  }

  const wsOverdraft = Math.abs(n(ws.bankOverdraftInCreditorsNote));
  const wsWhtPay = Math.abs(n(ws.whtPayableInCreditorsNote));
  const wsPayrollTax = Math.abs(n(ws.payrollTaxInCreditorsNote));
  const wsAccrued = Math.abs(n(ws.accruedExpensesInCreditorsNote));

  if (wsOverdraft > 0 && n(bs.shortTermBorrowingExisting) === 0) {
    bs.shortTermBorrowingExisting = wsOverdraft;
    notes.shortTermBorrowingExisting = `Extracted Bank Overdrafts (${Math.round(wsOverdraft / 1000).toLocaleString()}k) from Creditors Note.`;
  }
  if (wsPayrollTax > 0 && wsAccrued > 0 && n(bs.accruedExpenses) === wsPayrollTax) {
    const faceIncTax = Math.abs(n(is.currentTaxExpense) || n(is.totalTaxExpense));
    bs.taxesPayable = faceIncTax + wsWhtPay + wsPayrollTax;
    bs.accruedExpenses = wsAccrued;
    notes.taxesPayable = `Income Tax (${Math.round(faceIncTax / 1000).toLocaleString()}k) + WHT (${Math.round(wsWhtPay / 1000).toLocaleString()}k) + Payroll Tax (${Math.round(wsPayrollTax / 1000).toLocaleString()}k).`;
    notes.accruedExpenses = `Accrued Expenses (م. مستحقة) from Creditors Note.`;
  } else if (wsWhtPay > 0 || wsPayrollTax > 0) {
    const faceIncTax = Math.abs(n(is.currentTaxExpense) || n(is.totalTaxExpense));
    const expectedTaxesPayable = faceIncTax + wsWhtPay + wsPayrollTax;
    if (expectedTaxesPayable > n(bs.taxesPayable) && Math.abs(n(bs.taxesPayable) - expectedTaxesPayable) > 100) {
      if (Math.abs(n(bs.accruedExpenses) - (wsAccrued + wsPayrollTax)) <= 100) {
        bs.accruedExpenses = wsAccrued;
        bs.taxesPayable = expectedTaxesPayable;
      } else if (n(bs.taxesPayable) <= faceIncTax + 1000) {
        bs.taxesPayable = expectedTaxesPayable;
      }
      notes.taxesPayable = `Income Tax + Withholding Tax + Payroll Tax combined from Balance Sheet & Creditors Note.`;
    }
  }

  // Only backfill single-line summary if zero sub-components were extracted
  const sumCL =
    n(bs.shortTermBorrowingExisting) + n(bs.shortTermBorrowingNew) +
    n(bs.cpSeniorDebtExisting) + n(bs.cpSeniorDebtNew) + n(bs.cpCapLease) +
    n(bs.cpSubDebtExisting) + n(bs.cpSalesTax) + n(bs.accountsPayable) +
    n(bs.taxesPayable) + n(bs.accruedExpenses) + n(bs.interestPayable) +
    n(bs.dividendsPayable) + n(bs.downPayments) + n(bs.dueToSisterCo3) +
    n(bs.otherCurrentLiability);
  if (sumCL === 0 && n(bs.totCurrentLiabilities) > 0) {
    bs.otherCurrentLiability = n(bs.totCurrentLiabilities);
  }

  const sumLTD =
    n(bs.ltLeaseObligation) + n(bs.ltSeniorDebtExisting) + n(bs.ltSeniorDebtNew) +
    n(bs.ltTaxes) + n(bs.ltSharholderLoan);
  if (sumLTD === 0 && n(bs.totalLongTermDebt) > 0) {
    bs.ltSeniorDebtExisting = n(bs.totalLongTermDebt);
  }

  // -------------------------------------------------------------------------
  // 4. Equity & EAS Retained Earnings Continuity Reconciliation
  // -------------------------------------------------------------------------
  const preEqComputed = computeTotalsFromLineItems(extractedData);
  is.grossProfit = preEqComputed.incomeStatement.grossProfit;
  is.netOperatingProfit = preEqComputed.incomeStatement.netOperatingProfit;
  is.netProfitBeforeTax = preEqComputed.incomeStatement.netProfitBeforeTax;
  is.netProfitAfterTax = preEqComputed.incomeStatement.netProfitAfterTax;
  is.npaui = preEqComputed.incomeStatement.npaui;
  is.totalChange = preEqComputed.incomeStatement.totalChange;

  if (!hasVal(bs.plusNetIncome) || n(bs.plusNetIncome) === 0) {
    bs.plusNetIncome = is.npaui;
  }
  bs.lessDividends = Math.abs(n(bs.lessDividends) || (Math.abs(n(is.prefShareDividends)) + Math.abs(n(is.commonStockDividends))));
  if (n(bs.otherAdjustments) === 0 && n(is.otherAdjustment) !== 0) {
    bs.otherAdjustments = n(is.otherAdjustment);
  }

  const reCarriedOnly = n(ws.faceRetainedEarningsCarriedForwardOnly);
  const faceNetIncLine = n(ws.faceCurrentYearNetIncomeLine) || bs.plusNetIncome;
  const faceEquity = n(printedTotals.totalEquity) || n(ws.faceTotalEquity);

  if (n(bs.retainedEarningsOpening) === 0) {
    let targetClosingRE = n(bs.retainedEarningsClosing);
    if (reCarriedOnly > 0 && faceNetIncLine !== 0 && (targetClosingRE === 0 || Math.abs(targetClosingRE - reCarriedOnly) <= 500)) {
      targetClosingRE = reCarriedOnly + faceNetIncLine;
    } else if (
      faceEquity > 0 &&
      Math.abs((n(bs.commonStock) + n(bs.legalReserve) + n(bs.additionalPaidInCapital) + targetClosingRE + bs.plusNetIncome) - faceEquity) <= 500 &&
      Math.abs(targetClosingRE + n(bs.commonStock) + n(bs.legalReserve) - faceEquity) > 1000
    ) {
      targetClosingRE = targetClosingRE + bs.plusNetIncome;
    }

    if (targetClosingRE !== 0) {
      bs.retainedEarningsOpening = targetClosingRE - n(bs.plusNetIncome) + n(bs.lessDividends) - n(bs.otherAdjustments);
    }
  }

  // -------------------------------------------------------------------------
  // 5. Compute ALL Subtotals & Totals strictly in code (Never trust model math!)
  // -------------------------------------------------------------------------
  const finalComputed = computeTotalsFromLineItems(extractedData);

  bs.netReceivables = finalComputed.balanceSheet.netReceivables;
  bs.totalInventory = finalComputed.balanceSheet.totalInventory;
  bs.totalCurrentAssets = finalComputed.balanceSheet.totalCurrentAssets;
  bs.grossPlant = finalComputed.balanceSheet.grossPlant;
  bs.netPpe = finalComputed.balanceSheet.netPpe;
  bs.netIntangibles = finalComputed.balanceSheet.netIntangibles;
  bs.totalAssets = finalComputed.balanceSheet.totalAssets;

  bs.totCurrentLiabilities = finalComputed.balanceSheet.totCurrentLiabilities;
  bs.totalLongTermDebt = finalComputed.balanceSheet.totalLongTermDebt;
  bs.totalLiabilities = finalComputed.balanceSheet.totalLiabilities;
  bs.totalGreyArea = finalComputed.balanceSheet.totalGreyArea;
  bs.retainedEarningsClosing = finalComputed.balanceSheet.retainedEarningsClosing;
  bs.totalEquity = finalComputed.balanceSheet.totalEquity;
  bs.totalLiabsAndEquity = finalComputed.balanceSheet.totalLiabsAndEquity;

  // Backfill printedTotals fallbacks from verificationWorksheet ONLY if printedTotals field is null
  if (!hasVal(printedTotals.totalCurrentAssets) && hasVal(ws.faceTotalCurrentAssets)) {
    printedTotals.totalCurrentAssets = ws.faceTotalCurrentAssets;
  }
  if (!hasVal(printedTotals.netPpe) && hasVal(ws.faceNetPpe)) {
    printedTotals.netPpe = ws.faceNetPpe;
  }
  if (!hasVal(printedTotals.totalAssets) && hasVal(ws.faceTotalAssets)) {
    printedTotals.totalAssets = ws.faceTotalAssets;
  }
  if (!hasVal(printedTotals.totCurrentLiabilities) && hasVal(ws.faceTotalCurrentLiabilities)) {
    printedTotals.totCurrentLiabilities = ws.faceTotalCurrentLiabilities;
  }
  if (!hasVal(printedTotals.totalLiabilities) && hasVal(ws.faceTotalLiabilities)) {
    printedTotals.totalLiabilities = ws.faceTotalLiabilities;
  }
  if (!hasVal(printedTotals.totalEquity) && hasVal(ws.faceTotalEquity)) {
    printedTotals.totalEquity = ws.faceTotalEquity;
  }
  if (!hasVal(printedTotals.totalLiabsAndEquity) && hasVal(ws.faceTotalLiabsAndEquity)) {
    printedTotals.totalLiabsAndEquity = ws.faceTotalLiabsAndEquity;
  }

  // Run full deterministic validation checks (0.5% tolerance, never alters printedTotals)
  extractedData.validation = validateFinancialData(extractedData);

  return extractedData;
}
