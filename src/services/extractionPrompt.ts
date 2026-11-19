import { Type } from "@google/genai";

export const FINANCIAL_DATA_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    companyName: { type: Type.STRING, description: "The name of the company (e.g., FM PLUS)" },
    year: { type: Type.NUMBER, description: "The primary fiscal year of the document (e.g., 2025)" },
    incomeStatement: {
      type: Type.OBJECT,
      properties: {
        revenues: { type: Type.NUMBER },
        costOfGoodsSold: { type: Type.NUMBER },
        depreciation1: { type: Type.NUMBER },
        grossProfit: { type: Type.NUMBER },
        depreciation2: { type: Type.NUMBER },
        sgaExpense: { type: Type.NUMBER },
        provisions1: { type: Type.NUMBER },
        rd: { type: Type.NUMBER },
        goodwillAmortization: { type: Type.NUMBER },
        otherAmortization: { type: Type.NUMBER },
        netOperatingProfit: { type: Type.NUMBER },
        grossInterestExpExist: { type: Type.NUMBER },
        interestExpNew: { type: Type.NUMBER },
        capitalizedInterest: { type: Type.NUMBER },
        interestIncome: { type: Type.NUMBER },
        dividendIncome: { type: Type.NUMBER },
        provDoubtfulRec: { type: Type.NUMBER },
        provisions2: { type: Type.NUMBER },
        fxGL: { type: Type.NUMBER },
        sundryIncomeExpense1: { type: Type.NUMBER },
        netProfitBeforeTax: { type: Type.NUMBER },
        totalTaxExpense: { type: Type.NUMBER },
        currentTaxExpense: { type: Type.NUMBER },
        deferredTaxExpense: { type: Type.NUMBER },
        itc: { type: Type.NUMBER },
        netProfitAfterTax: { type: Type.NUMBER },
        minorityInterestExpense: { type: Type.NUMBER },
        saleOfPlant: { type: Type.NUMBER },
        sundryIncomeExpense2: { type: Type.NUMBER },
        npaui: { type: Type.NUMBER },
        prefShareDividends: { type: Type.NUMBER },
        commonStockDividends: { type: Type.NUMBER },
        otherAdjustment: { type: Type.NUMBER },
        totalChange: { type: Type.NUMBER }
      },
      required: [
        "revenues",
        "costOfGoodsSold",
        "grossProfit",
        "depreciation2",
        "sgaExpense",
        "netOperatingProfit",
        "grossInterestExpExist",
        "netProfitBeforeTax",
        "totalTaxExpense",
        "netProfitAfterTax",
        "npaui",
        "otherAdjustment",
        "totalChange"
      ]
    },
    balanceSheet: {
      type: Type.OBJECT,
      properties: {
        cash: { type: Type.NUMBER },
        marketableSecurities: { type: Type.NUMBER },
        marketableSecExcess: { type: Type.NUMBER },
        accountsReceivable: { type: Type.NUMBER },
        lessAllowances: { type: Type.NUMBER },
        netReceivables: { type: Type.NUMBER },
        rawMaterials: { type: Type.NUMBER },
        workInProgress: { type: Type.NUMBER },
        finishedGoods: { type: Type.NUMBER },
        goodsInTransit: { type: Type.NUMBER },
        totalInventory: { type: Type.NUMBER },
        advancePayments: { type: Type.NUMBER },
        nonTradeRec: { type: Type.NUMBER },
        otherCurrentAssets: { type: Type.NUMBER },
        dueFromSisterCo1: { type: Type.NUMBER },
        totalCurrentAssets: { type: Type.NUMBER },
        land: { type: Type.NUMBER },
        buildingImprovement: { type: Type.NUMBER },
        machineryEquipment: { type: Type.NUMBER },
        constInProgress: { type: Type.NUMBER },
        grossPlant: { type: Type.NUMBER },
        lessAccumulatedDep: { type: Type.NUMBER },
        netPpe: { type: Type.NUMBER },
        accountsReceivablesLt: { type: Type.NUMBER },
        dueFromSisterCo2: { type: Type.NUMBER },
        otherTangibleAsset: { type: Type.NUMBER },
        deferredTaxAsset: { type: Type.NUMBER },
        prepaids: { type: Type.NUMBER },
        goodwill: { type: Type.NUMBER },
        otherIntangibleAsset: { type: Type.NUMBER },
        lessAccumAmortization: { type: Type.NUMBER },
        netIntangibles: { type: Type.NUMBER },
        totalAssets: { type: Type.NUMBER },
        shortTermBorrowingExisting: { type: Type.NUMBER },
        shortTermBorrowingNew: { type: Type.NUMBER },
        cpSeniorDebtExisting: { type: Type.NUMBER },
        cpSeniorDebtNew: { type: Type.NUMBER },
        cpCapLease: { type: Type.NUMBER },
        cpSubDebtExisting: { type: Type.NUMBER },
        cpSalesTax: { type: Type.NUMBER },
        accountsPayable: { type: Type.NUMBER },
        taxesPayable: { type: Type.NUMBER },
        accruedExpenses: { type: Type.NUMBER },
        interestPayable: { type: Type.NUMBER },
        dividendsPayable: { type: Type.NUMBER },
        downPayments: { type: Type.NUMBER },
        dueToSisterCo3: { type: Type.NUMBER },
        otherCurrentLiability: { type: Type.NUMBER },
        totCurrentLiabilities: { type: Type.NUMBER },
        ltLeaseObligation: { type: Type.NUMBER },
        ltSeniorDebtExisting: { type: Type.NUMBER },
        ltSeniorDebtNew: { type: Type.NUMBER },
        ltTaxes: { type: Type.NUMBER },
        ltSharholderLoan: { type: Type.NUMBER },
        totalLongTermDebt: { type: Type.NUMBER },
        otherNonCurrentLiab: { type: Type.NUMBER },
        totalLiabilities: { type: Type.NUMBER },
        deferredTaxes: { type: Type.NUMBER },
        minorityInterest: { type: Type.NUMBER },
        provisions3: { type: Type.NUMBER },
        totalGreyArea: { type: Type.NUMBER },
        preferredStock: { type: Type.NUMBER },
        commonStock: { type: Type.NUMBER },
        additionalPaidInCapital: { type: Type.NUMBER },
        retainedEarningsOpening: { type: Type.NUMBER },
        plusNetIncome: { type: Type.NUMBER },
        lessDividends: { type: Type.NUMBER },
        otherAdjustments: { type: Type.NUMBER },
        retainedEarningsClosing: { type: Type.NUMBER },
        ownersAccount: { type: Type.NUMBER },
        fxAdjustment: { type: Type.NUMBER },
        legalReserve: { type: Type.NUMBER },
        totalEquity: { type: Type.NUMBER },
        totalLiabsAndEquity: { type: Type.NUMBER }
      },
      required: [
        "cash",
        "marketableSecurities",
        "accountsReceivable",
        "netReceivables",
        "finishedGoods",
        "totalInventory",
        "otherCurrentAssets",
        "totalCurrentAssets",
        "buildingImprovement",
        "machineryEquipment",
        "grossPlant",
        "lessAccumulatedDep",
        "netPpe",
        "deferredTaxAsset",
        "totalAssets",
        "shortTermBorrowingExisting",
        "cpSeniorDebtExisting",
        "cpCapLease",
        "accountsPayable",
        "taxesPayable",
        "accruedExpenses",
        "dueToSisterCo3",
        "otherCurrentLiability",
        "totCurrentLiabilities",
        "ltLeaseObligation",
        "ltSeniorDebtExisting",
        "totalLongTermDebt",
        "otherNonCurrentLiab",
        "totalLiabilities",
        "commonStock",
        "retainedEarningsOpening",
        "plusNetIncome",
        "otherAdjustments",
        "retainedEarningsClosing",
        "legalReserve",
        "totalEquity",
        "totalLiabsAndEquity"
      ]
    },
    notes: {
      type: Type.OBJECT,
      description: "Audit trail explaining any breakdowns or credit analyst reclassifications performed from the Notes/Supplementary Disclosures",
      properties: {
        revenues: { type: Type.STRING },
        costOfGoodsSold: { type: Type.STRING },
        grossProfit: { type: Type.STRING },
        sgaExpense: { type: Type.STRING },
        grossInterestExpExist: { type: Type.STRING },
        netOperatingProfit: { type: Type.STRING },
        marketableSecurities: { type: Type.STRING },
        otherCurrentAssets: { type: Type.STRING },
        deferredTaxAsset: { type: Type.STRING },
        buildingImprovement: { type: Type.STRING },
        machineryEquipment: { type: Type.STRING },
        totalAssets: { type: Type.STRING },
        shortTermBorrowingExisting: { type: Type.STRING },
        taxesPayable: { type: Type.STRING },
        accruedExpenses: { type: Type.STRING },
        totalLiabilities: { type: Type.STRING },
        retainedEarningsClosing: { type: Type.STRING },
        totalEquity: { type: Type.STRING },
      }
    },
    verificationWorksheet: {
      type: Type.OBJECT,
      description: "Mandatory raw transcription checkpoint from Face Financial Statements and Notes before final mapping",
      properties: {
        faceGnaExpense: { type: Type.NUMBER, description: "Raw General & Admin Expenses (مصروفات عمومية وإدارية) from Income Statement face" },
        faceFinanceCosts: { type: Type.NUMBER, description: "Raw Finance Costs (تكاليف تمويلية) from Income Statement face" },
        faceTotalCurrentAssets: { type: Type.NUMBER, description: "Raw Total Current Assets (اجمالي الاصول المتداولة) from Balance Sheet face" },
        faceOtherDebtorsTotal: { type: Type.NUMBER, description: "Raw Debtors & Other Debit Balances (مدينون وارصدة مدينة اخرى) from Balance Sheet face" },
        faceNetPpe: { type: Type.NUMBER, description: "Raw Net Fixed Assets (اصول ثابتة بالصافي) from Balance Sheet face" },
        faceTotalAssets: { type: Type.NUMBER, description: "Raw Total Assets (اجمالي الاصول) from Balance Sheet face" },
        faceTotalCurrentLiabilities: { type: Type.NUMBER, description: "Raw Total Current Liabilities (اجمالي الخصوم المتداولة) from Balance Sheet face" },
        faceTotalEquity: { type: Type.NUMBER, description: "Raw Total Equity (اجمالي حقوق الملكية) from Balance Sheet face" },
        faceTotalLiabsAndEquity: { type: Type.NUMBER, description: "Raw Total Equity & Liabilities (اجمالي حقوق الملكية والخصوم) from Balance Sheet face" },
        faceRetainedEarningsCarriedForwardOnly: { type: Type.NUMBER, description: "Raw Retained Earnings Carried Forward line ONLY (ارباح مرحلة) on Equity face" },
        faceCurrentYearNetIncomeLine: { type: Type.NUMBER, description: "Raw Net Profit for the Year line (صافي ربح العام) inside Equity section on Balance Sheet face" },
        priorYearProfitTransferredToRE: { type: Type.NUMBER, description: "Prior year net profit transferred to Retained Earnings (المحول الى ارباح مرحلة) in Statement of Changes in Equity" },
        legalReserveAppropriationAmount: { type: Type.NUMBER, description: "Positive amount transferred to Legal Reserve (احتياطي قانوني) in Statement of Changes in Equity" },
        bankChargesInGnaNote: { type: Type.NUMBER, description: "Exact Bank Charges (م. بنكية) inside G&A Note" },
        lgCashMarginInDebtorsNote: { type: Type.NUMBER, description: "LG Cash Margins (مارجات خطابات ضمان) inside Debtors Note" },
        withholdingTaxAssetInDebtorsNote: { type: Type.NUMBER, description: "Withholding Tax Receivable (ضرائب مستقطعة من المنبع) inside Debtors Note" },
        bankOverdraftInCreditorsNote: { type: Type.NUMBER, description: "Bank Overdraft / Credit Balances (ارصدة دائنة بنوك) inside Creditors Note" },
        whtPayableInCreditorsNote: { type: Type.NUMBER, description: "Withholding Tax Payable (ضريبة مستقطعة من الغير) inside Creditors Note" },
        payrollTaxInCreditorsNote: { type: Type.NUMBER, description: "Payroll / Salary Tax (كسب العمل) inside Creditors Note" },
        accruedExpensesInCreditorsNote: { type: Type.NUMBER, description: "Accrued Expenses (م. مستحقة) inside Creditors Note" },
        fixedAssetsTotalCostEndingDec31: { type: Type.NUMBER, description: "Total Gross Cost Ending Dec 31 (الاجمالي - التكلفة في 31-12) from Fixed Assets Schedule" },
        fixedAssetsTotalAccumDepEndingDec31: { type: Type.NUMBER, description: "Total Accum Dep Ending Dec 31 (الاجمالي - مجمع الاهلاك في 31-12) from Fixed Assets Schedule" },
        carsGrossCostEndingDec31: { type: Type.NUMBER, description: "Vehicles gross cost ending Dec 31 (سيارات) from Fixed Assets Schedule" },
        computersGrossCostEndingDec31: { type: Type.NUMBER, description: "Computers & software gross cost ending Dec 31 (كمبيوتر وبرامج) from Fixed Assets Schedule" },
        leaseholdImprovementsGrossCostEndingDec31: { type: Type.NUMBER, description: "Leasehold improvements gross cost ending Dec 31 (تحسينات في اصول مستأجرة)" },
        toolsGrossCostEndingDec31: { type: Type.NUMBER, description: "Tools gross cost ending Dec 31 (عدد وادوات)" },
        appliancesGrossCostEndingDec31: { type: Type.NUMBER, description: "Electrical appliances gross cost ending Dec 31 (اجهزة كهربائية)" }
      },
      required: [
        "faceGnaExpense",
        "faceFinanceCosts",
        "faceTotalCurrentAssets",
        "faceOtherDebtorsTotal",
        "faceNetPpe",
        "faceTotalAssets",
        "faceTotalEquity",
        "faceTotalLiabsAndEquity",
        "faceRetainedEarningsCarriedForwardOnly",
        "faceCurrentYearNetIncomeLine",
        "legalReserveAppropriationAmount",
        "bankChargesInGnaNote",
        "lgCashMarginInDebtorsNote",
        "withholdingTaxAssetInDebtorsNote",
        "bankOverdraftInCreditorsNote",
        "whtPayableInCreditorsNote",
        "payrollTaxInCreditorsNote",
        "accruedExpensesInCreditorsNote",
        "fixedAssetsTotalCostEndingDec31",
        "fixedAssetsTotalAccumDepEndingDec31"
      ]
    }
  },
  required: ["companyName", "year", "verificationWorksheet", "incomeStatement", "balanceSheet", "notes"]
};

export const SYSTEM_PROMPT = `
You are an elite Senior Corporate Credit Risk Analyst and Bank Financial Spreading Engine (Moody's / Commercial Banking standard) specialized in Egyptian Accounting Standards (EAS), IFRS, and audited Arabic/English financial statements.

Your mission is to read EVERY SINGLE PAGE of the uploaded financial statement PDF (including scanned Arabic pages, 90-degree rotated landscape tables, Statement of Changes in Equity, and Supplementary Notes / الإيضاحات المتممة) and produce a 100% accurate, bank-spread financial model for the primary fiscal year.

=============================================================================
1. SCALE, DIGITS & PAGE ORIENTATION RULES (CRITICAL)
=============================================================================
- UNIT NORMALIZATION: Always return ALL monetary values in FULL BASE CURRENCY UNITS (e.g., exact EGP, such as 384378051 — NOT pre-divided by 1,000!).
  * If the statement is already printed in "LE 000's" / "in thousands" / "بالألف جنيه", MULTIPLY every extracted figure by 1,000 so the JSON holds full units.
  * If the statement is in full EGP ("بالجنيه المصري"), inspect EVERY digit carefully! Never drop leading digits (e.g. read 57109212 completely, NOT 7109212!). Verify vertically that sub-items sum to the column subtotal printed below the line!
- ROTATED / LANDSCAPE PAGES: Scan ALL pages carefully, mentally rotating 90-degree rotated schedules:
  * Example rotated G&A page ("المصروفات العمومية"): read EVERY row down to "الاجمالي".
  * Example landscape Fixed Assets Register ("إيضاح سجل الأصول الثابتة"): read ALL columns across (تحسينات، أثاث، كمبيوتر، أجهزة كهربائية، عدد وأدوات، آلات ومعدات، سيارات) AND read the rightmost/summary "الاجمالي" column for BOTH:
    - "التكلفة في 31-12-YYYY" (Ending Gross Cost — NOT Jan 1 opening!)
    - "مجمع الإهلاك في 31-12-YYYY" (Ending Accum Dep — NOT Jan 1 opening! Verify that Ending Cost - Ending Accum Dep == Net PP&E on Balance Sheet face!).
- ARABIC COLUMN ORDER & YEAR: Check the column date header directly above each column (e.g. ٢٠٢٥/١٢/٣١ vs ٢٠٢٤/١٢/٣١). Extract ONLY the PRIMARY / LATEST year into incomeStatement/balanceSheet (never mix 2024 figures into 2025!).

=============================================================================
2. MANDATORY CREDIT ANALYST RECLASSIFICATION RULES (APPLY STRICTLY!)
=============================================================================
NEVER skip a reclassification! Even if Bank Charges or Tax lines seem small (< 1M EGP), ALWAYS perform these banking reclassifications verbatim:

A. INCOME STATEMENT & G&A NOTE ("المصروفات العمومية"):
   1. BANK CHARGES ("م. بنكية" / "عمولات ومصاريف بنكية"):
      - Find exact "م. بنكية" in the G&A Note -> put in verificationWorksheet.bankChargesInGnaNote.
      - ALWAYS subtract ANY non-zero Bank Charges from "sgaExpense" and ADD to "grossInterestExpExist"!
      - Never call bank charges immaterial — ALWAYS reclassify them!
   2. LEGAL RESERVE APPROPRIATION ("قائمة التغير في حقوق الملكية"):
      - Extract the transfer to Legal Reserve ("احتياطي قانوني", e.g. 982261) -> put negative value (-982261) in incomeStatement.otherAdjustment AND balanceSheet.otherAdjustments!

B. BALANCE SHEET ASSETS & DEBTORS NOTE ("مدينون وأرصدة مدينة أخرى"):
   1. LG CASH MARGINS ("مارجات خطابات ضمان"): ALWAYS reclassify from Debtors into **"marketableSecurities"**!
   2. WITHHOLDING TAX AT SOURCE ("ضرائب مستقطعة من المنبع"): ALWAYS reclassify OUT of Current Assets into **"deferredTaxAsset"** (Non-Current) so Current Ratio is conservative!
   3. REMAINING OTHER CURRENT ASSETS ("عهد" + "تأمينات لدى الغير" + "سلفيات عاملين"): Put exact sum into **"otherCurrentAssets"**! Double check: marketableSecurities + deferredTaxAsset + otherCurrentAssets == Debtors & Other Debit Balances total on Balance Sheet face!
   4. INVENTORY SINGLE LINE: Put full inventory into BOTH "finishedGoods" AND "totalInventory".
   5. FIXED ASSETS BREAKDOWN (all 7 asset classes ending Dec 31):
      - "buildingImprovement" = Buildings + Leasehold Improvements (تحسينات) + Furniture (أثاث) + Computers & Software (كمبيوتر) + Electrical Appliances (أجهزة كهربائية).
      - "machineryEquipment" = Machinery & Equipment (آلات ومعدات) + Tools (عدد وأدوات) + Vehicles (سيارات).
      - "lessAccumulatedDep" = Ending Accum Dep at Dec 31 ("مجمع الإهلاك في 31-12"), NOT Opening Jan 1!
      - Check: grossPlant - lessAccumulatedDep MUST equal Face BS "اصول ثابتة بالصافي" (verificationWorksheet.faceNetPpe)!

C. BALANCE SHEET LIABILITIES & CREDITORS NOTE ("دائنون وأرصدة دائنة أخرى"):
   1. BANK OVERDRAFTS / CREDIT BALANCES ("ارصدة دائنة بنوك"): Extract from Creditors Note -> **"shortTermBorrowingExisting"**.
   2. TAXES PAYABLE ("taxesPayable"): ALWAYS sum Face Income Tax ("ضريبة الدخل") + Withholding Tax Payable ("ضريبة مستقطعة من الغير") + Payroll/Salary Tax ("كسب العمل") + VAT!
      - Do NOT put "كسب العمل" (Payroll Tax) in "accruedExpenses"! Payroll Tax is a statutory tax -> goes in **"taxesPayable"**!
   3. ACCRUED EXPENSES ("accruedExpenses"): Put ONLY "م. مستحقة" (Accrued Expenses) from the Creditors Note here!
   4. SHORT-TERM & LONG-TERM LEASES / OBLIGATIONS: Map "التزامات قصيرة الأجل" -> **"cpCapLease"** and "التزامات طويلة الأجل" -> **"ltLeaseObligation"** (unless disclosed as bank loans).
   5. RELATED PARTIES: Map "ارصدة دائنة - شركات شقيقة" -> **"dueToSisterCo3"**.

D. EQUITY & RETAINED EARNINGS (EAS MAPPING — CRITICAL!):
   In Egyptian Balance Sheets, Equity displays "ارباح مرحلة" (prior RE carried forward) AND "صافي ربح العام" (current year net profit) on TWO separate rows inside Equity!
   In our Moody's bank spreading template:
   - **"plusNetIncome"** = Current Year Net Profit ("صافي ربح العام", e.g. 34333464).
   - **"otherAdjustments"** = Negative Legal Reserve transfer from Statement of Changes in Equity (e.g. -982261).
   - **"retainedEarningsClosing"** = "ارباح مرحلة" PLUS "صافي ربح العام" (i.e. Total Ending Retained Earnings + Current Year Unappropriated Profit! e.g. 39192496 + 34333464 = 73525960)!
   - **"retainedEarningsOpening"** = Prior Year Closing Retained Earnings + Prior Year Net Profit transferred to RE (e.g. 20529529 + 19645228 = 40174757), so that:
     retainedEarningsOpening + plusNetIncome - lessDividends + otherAdjustments == retainedEarningsClosing!
   - **"totalEquity"** = commonStock + additionalPaidInCapital + legalReserve + retainedEarningsClosing + other equity == Face Total Equity (e.g. 93588728)!

Verify Final Balance Check: totalAssets MUST equal totalLiabilities + totalEquity (0 variance)!
`;

export function reconcileFinancialData(extractedData: any) {
  if (!extractedData) return extractedData;
  const n = (v: any) => (typeof v === 'number' && !isNaN(v) && isFinite(v) ? v : 0);

  const is = extractedData.incomeStatement || (extractedData.incomeStatement = {});
  const bs = extractedData.balanceSheet || (extractedData.balanceSheet = {});
  const ws = extractedData.verificationWorksheet || {};
  const notes = extractedData.notes || (extractedData.notes = {});

  // -------------------------------------------------------------------------
  // 1. Income Statement normalization & Bank Charges / Legal Reserve cross-check
  // -------------------------------------------------------------------------
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

  if (n(is.revenues) > 0 && n(is.grossProfit) === 0) {
    is.grossProfit = is.revenues - is.costOfGoodsSold - is.depreciation1;
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

  // Always recompute Operating Profit & Profit Chain consistently
  is.netOperatingProfit =
    n(is.grossProfit) -
    (is.depreciation2 + is.sgaExpense + is.provisions1 + is.rd + is.goodwillAmortization + is.otherAmortization);

  is.netProfitBeforeTax =
    n(is.netOperatingProfit) -
    (is.grossInterestExpExist + is.interestExpNew + is.capitalizedInterest) +
    n(is.interestIncome) +
    n(is.dividendIncome) +
    n(is.provDoubtfulRec) +
    n(is.provisions2) +
    n(is.fxGL) +
    n(is.sundryIncomeExpense1);

  if (n(is.netProfitAfterTax) === 0 && n(is.netProfitBeforeTax) !== 0) {
    is.netProfitAfterTax = n(is.netProfitBeforeTax) - is.totalTaxExpense;
  } else if (n(is.netProfitBeforeTax) !== 0) {
    is.netProfitAfterTax = n(is.netProfitBeforeTax) - is.totalTaxExpense;
  }

  is.npaui = n(is.netProfitAfterTax) - Math.abs(n(is.minorityInterestExpense)) + n(is.saleOfPlant) + n(is.sundryIncomeExpense2);

  // Legal Reserve appropriation check from Equity Statement
  const legalResApp = Math.abs(n(ws.legalReserveAppropriationAmount));
  if (n(is.otherAdjustment) === 0 && n(bs.otherAdjustments) !== 0) {
    is.otherAdjustment = n(bs.otherAdjustments);
  } else if (n(is.otherAdjustment) === 0 && legalResApp > 0) {
    is.otherAdjustment = -legalResApp;
    notes.otherAdjustment = `Legal reserve appropriation (-${Math.round(legalResApp / 1000).toLocaleString()}k) per Statement of Changes in Equity.`;
  }
  is.totalChange = n(is.npaui) - Math.abs(n(is.prefShareDividends)) - Math.abs(n(is.commonStockDividends)) + n(is.otherAdjustment);

  // -------------------------------------------------------------------------
  // 2. Balance Sheet Assets Cross-Checks (Debtors Note + Fixed Assets Schedule)
  // -------------------------------------------------------------------------
  // Receivables
  if (n(bs.accountsReceivable) === 0 && n(bs.netReceivables) > 0) {
    bs.accountsReceivable = n(bs.netReceivables) + Math.abs(n(bs.lessAllowances));
  }
  bs.lessAllowances = Math.abs(n(bs.lessAllowances));
  bs.netReceivables = n(bs.accountsReceivable) - bs.lessAllowances;

  // Inventory
  const invSum = n(bs.rawMaterials) + n(bs.workInProgress) + n(bs.finishedGoods) + n(bs.goodsInTransit);
  if (invSum === 0 && n(bs.totalInventory) > 0) {
    bs.finishedGoods = n(bs.totalInventory);
  }
  bs.totalInventory = n(bs.rawMaterials) + n(bs.workInProgress) + n(bs.finishedGoods) + n(bs.goodsInTransit);

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
  // Auto-correct Other Current Assets if Face Debtors Total was captured and residual proves an OCR miss on sub-items
  if (faceDebtors > 0) {
    const expectedOtherCA = faceDebtors - n(bs.marketableSecurities) - n(bs.deferredTaxAsset);
    if (expectedOtherCA >= 0 && Math.abs(n(bs.otherCurrentAssets) - expectedOtherCA) > 5000) {
      bs.otherCurrentAssets = expectedOtherCA;
      notes.otherCurrentAssets = `Other Debtors (${Math.round(faceDebtors / 1000).toLocaleString()}k) net of LG Cash Margins & Non-Current Withholding Taxes.`;
    }
  }

  // Current Assets total
  const calcCurrentAssets =
    n(bs.cash) +
    n(bs.marketableSecurities) +
    n(bs.marketableSecExcess) +
    n(bs.netReceivables) +
    n(bs.totalInventory) +
    n(bs.advancePayments) +
    n(bs.nonTradeRec) +
    n(bs.otherCurrentAssets) +
    n(bs.dueFromSisterCo1);
  bs.totalCurrentAssets = calcCurrentAssets > 0 ? calcCurrentAssets : n(bs.totalCurrentAssets);

  // Fixed Assets / PP&E Reconciliation against Fixed Assets Schedule & Face Net PP&E
  const faceNetPpe = n(ws.faceNetPpe);
  const schedCostEnd = n(ws.fixedAssetsTotalCostEndingDec31);
  const schedAccDepEnd = Math.abs(n(ws.fixedAssetsTotalAccumDepEndingDec31));

  // Supplement missing gross components if schedule columns were transcribed in worksheet
  if (n(ws.leaseholdImprovementsGrossCostEndingDec31) + n(ws.computersGrossCostEndingDec31) + n(ws.appliancesGrossCostEndingDec31) > 0) {
    const wsBldgSum = n(ws.leaseholdImprovementsGrossCostEndingDec31) + n(ws.computersGrossCostEndingDec31) + n(ws.appliancesGrossCostEndingDec31);
    if (n(bs.buildingImprovement) > 0 && n(bs.buildingImprovement) < wsBldgSum) {
      // Furniture + wsBldgSum
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
    // Prefer Dec 31 Ending Accumulated Depreciation if faceNetPpe confirms it
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

  // If schedule Gross Cost Ending - Ending Accum Dep matches Face Net PP&E, reconcile any omitted asset column difference into machineryEquipment
  if (schedCostEnd > 0 && Math.abs(ppeComponentsSum - schedCostEnd) > 100 && faceNetPpe > 0 && Math.abs((schedCostEnd - bs.lessAccumulatedDep) - faceNetPpe) <= 100) {
    const missingGross = schedCostEnd - ppeComponentsSum;
    if (missingGross > 0) {
      bs.machineryEquipment = n(bs.machineryEquipment) + missingGross;
      ppeComponentsSum = schedCostEnd;
      notes.machineryEquipment = `Reconciled to Fixed Assets Ending Gross Cost schedule (${Math.round(schedCostEnd / 1000).toLocaleString()}k).`;
    }
  } else if (faceNetPpe > 0 && Math.abs((ppeComponentsSum - bs.lessAccumulatedDep) - faceNetPpe) > 100) {
    // Reconcile Net PP&E to Face BS Net PP&E if Fixed Assets sub-columns were incomplete
    if (schedCostEnd > 0 && schedAccDepEnd > 0 && Math.abs((schedCostEnd - schedAccDepEnd) - faceNetPpe) <= 100) {
      bs.lessAccumulatedDep = schedAccDepEnd;
      bs.machineryEquipment = Math.max(0, schedCostEnd - n(bs.land) - n(bs.buildingImprovement) - n(bs.constInProgress));
      ppeComponentsSum = n(bs.land) + n(bs.buildingImprovement) + n(bs.machineryEquipment) + n(bs.constInProgress);
    }
  }

  bs.grossPlant = ppeComponentsSum;
  if (bs.grossPlant > 0) {
    bs.netPpe = bs.grossPlant - bs.lessAccumulatedDep;
  } else if (faceNetPpe > 0) {
    bs.netPpe = faceNetPpe;
  }

  // Intangibles
  bs.lessAccumAmortization = Math.abs(n(bs.lessAccumAmortization));
  const intangGross = n(bs.goodwill) + n(bs.otherIntangibleAsset);
  if (intangGross === 0 && n(bs.netIntangibles) > 0) {
    bs.otherIntangibleAsset = n(bs.netIntangibles) + bs.lessAccumAmortization;
  }
  bs.netIntangibles = n(bs.goodwill) + n(bs.otherIntangibleAsset) - bs.lessAccumAmortization;

  const calcTotalAssets =
    n(bs.totalCurrentAssets) +
    n(bs.netPpe) +
    n(bs.accountsReceivablesLt) +
    n(bs.dueFromSisterCo2) +
    n(bs.otherTangibleAsset) +
    n(bs.deferredTaxAsset) +
    n(bs.prepaids) +
    n(bs.netIntangibles);
  if (calcTotalAssets > 0) {
    bs.totalAssets = calcTotalAssets;
  }

  // -------------------------------------------------------------------------
  // 3. Liabilities & Creditors Note Reconciliation
  // -------------------------------------------------------------------------
  if (n(bs.dueToSisterCo3) === 0 && n((bs as any).dueToSisterCo) > 0) {
    bs.dueToSisterCo3 = n((bs as any).dueToSisterCo);
  }

  // Enforce Creditors Note tax & accrued separation if payrollTaxInCreditorsNote got placed into accruedExpenses
  const wsOverdraft = Math.abs(n(ws.bankOverdraftInCreditorsNote));
  const wsWhtPay = Math.abs(n(ws.whtPayableInCreditorsNote));
  const wsPayrollTax = Math.abs(n(ws.payrollTaxInCreditorsNote));
  const wsAccrued = Math.abs(n(ws.accruedExpensesInCreditorsNote));
  if (wsOverdraft > 0 && n(bs.shortTermBorrowingExisting) === 0) {
    bs.shortTermBorrowingExisting = wsOverdraft;
    notes.shortTermBorrowingExisting = `Extracted Bank Overdrafts (${Math.round(wsOverdraft / 1000).toLocaleString()}k) from Creditors Note.`;
  }
  if (wsPayrollTax > 0 && wsAccrued > 0 && n(bs.accruedExpenses) === wsPayrollTax) {
    // AI placed Payroll Tax in Accrued Expenses instead of Taxes Payable -> swap & add!
    const faceIncTax = Math.abs(n(is.currentTaxExpense) || n(is.totalTaxExpense));
    const expectedTaxesPayable = faceIncTax + wsWhtPay + wsPayrollTax;
    bs.taxesPayable = expectedTaxesPayable;
    bs.accruedExpenses = wsAccrued;
    notes.taxesPayable = `Income Tax (${Math.round(faceIncTax / 1000).toLocaleString()}k) + WHT (${Math.round(wsWhtPay / 1000).toLocaleString()}k) + Payroll Tax (${Math.round(wsPayrollTax / 1000).toLocaleString()}k).`;
    notes.accruedExpenses = `Accrued Expenses (م. مستحقة) from Creditors Note.`;
  } else if (wsWhtPay > 0 || wsPayrollTax > 0) {
    const faceIncTax = Math.abs(n(is.currentTaxExpense) || n(is.totalTaxExpense));
    const expectedTaxesPayable = faceIncTax + wsWhtPay + wsPayrollTax;
    if (expectedTaxesPayable > n(bs.taxesPayable) && Math.abs(n(bs.taxesPayable) - (faceIncTax + wsWhtPay + wsPayrollTax)) > 100) {
      // Only adjust if accruedExpenses matches wsAccrued + wsPayrollTax or similar, or taxesPayable clearly missed payroll/WHT
      if (Math.abs(n(bs.accruedExpenses) - (wsAccrued + wsPayrollTax)) <= 100) {
        bs.accruedExpenses = wsAccrued;
        bs.taxesPayable = expectedTaxesPayable;
      } else if (n(bs.taxesPayable) <= faceIncTax + 1000) {
        bs.taxesPayable = expectedTaxesPayable;
      }
      notes.taxesPayable = `Income Tax + Withholding Tax + Payroll Tax combined from Balance Sheet & Creditors Note.`;
    }
  }

  const calcCurrentLiabs =
    n(bs.shortTermBorrowingExisting) +
    n(bs.shortTermBorrowingNew) +
    n(bs.cpSeniorDebtExisting) +
    n(bs.cpSeniorDebtNew) +
    n(bs.cpCapLease) +
    n(bs.cpSubDebtExisting) +
    n(bs.cpSalesTax) +
    n(bs.accountsPayable) +
    n(bs.taxesPayable) +
    n(bs.accruedExpenses) +
    n(bs.interestPayable) +
    n(bs.dividendsPayable) +
    n(bs.downPayments) +
    n(bs.dueToSisterCo3) +
    n(bs.otherCurrentLiability);

  if (calcCurrentLiabs > 0) {
    bs.totCurrentLiabilities = calcCurrentLiabs;
  } else if (n(bs.totCurrentLiabilities) > 0) {
    bs.otherCurrentLiability = n(bs.totCurrentLiabilities);
  }

  const calcLongTermDebt =
    n(bs.ltLeaseObligation) +
    n(bs.ltSeniorDebtExisting) +
    n(bs.ltSeniorDebtNew) +
    n(bs.ltTaxes) +
    n(bs.ltSharholderLoan);
  if (calcLongTermDebt > 0) {
    bs.totalLongTermDebt = calcLongTermDebt;
  } else if (n(bs.totalLongTermDebt) > 0) {
    bs.ltSeniorDebtExisting = n(bs.totalLongTermDebt);
  }

  bs.totalLiabilities = n(bs.totCurrentLiabilities) + n(bs.totalLongTermDebt) + n(bs.otherNonCurrentLiab);

  // Grey Area
  bs.totalGreyArea = n(bs.deferredTaxes) + n(bs.minorityInterest) + n(bs.provisions3);

  // -------------------------------------------------------------------------
  // 4. Equity & EAS Retained Earnings Continuity Reconciliation
  // -------------------------------------------------------------------------
  bs.plusNetIncome = n(bs.plusNetIncome) || n(is.npaui);
  bs.lessDividends = Math.abs(n(bs.lessDividends) || (Math.abs(n(is.prefShareDividends)) + Math.abs(n(is.commonStockDividends))));
  if (n(bs.otherAdjustments) === 0 && n(is.otherAdjustment) !== 0) {
    bs.otherAdjustments = n(is.otherAdjustment);
  }

  // EAS Equity Check: In Egyptian FS, Equity shows "ارباح مرحلة" and "صافي ربح العام" separately!
  // Detect if retainedEarningsClosing contains ONLY "ارباح مرحلة" (missing plusNetIncome)
  const faceEquity = n(ws.faceTotalEquity);
  const reCarriedOnly = n(ws.faceRetainedEarningsCarriedForwardOnly);
  const faceNetIncLine = n(ws.faceCurrentYearNetIncomeLine) || bs.plusNetIncome;

  if (
    reCarriedOnly > 0 &&
    faceNetIncLine > 0 &&
    Math.abs(n(bs.retainedEarningsClosing) - reCarriedOnly) <= 500
  ) {
    // Model forgot to combine Current Year Profit into Ending Retained Earnings!
    bs.retainedEarningsClosing = reCarriedOnly + faceNetIncLine;
  } else if (
    faceEquity > 0 &&
    Math.abs(
      (n(bs.commonStock) + n(bs.legalReserve) + n(bs.additionalPaidInCapital) + n(bs.retainedEarningsClosing) + bs.plusNetIncome) - faceEquity
    ) <= 500 &&
    Math.abs(n(bs.retainedEarningsClosing) + n(bs.commonStock) + n(bs.legalReserve) - faceEquity) > 1000
  ) {
    bs.retainedEarningsClosing = n(bs.retainedEarningsClosing) + bs.plusNetIncome;
  }

  // Reconcile Opening RE consistently against Retained Earnings Closing
  if (n(bs.retainedEarningsClosing) !== 0) {
    const impliedOpening = n(bs.retainedEarningsClosing) - n(bs.plusNetIncome) + n(bs.lessDividends) - n(bs.otherAdjustments);
    if (n(bs.retainedEarningsOpening) === 0 || Math.abs(n(bs.retainedEarningsOpening) - impliedOpening) > 500) {
      bs.retainedEarningsOpening = impliedOpening;
    }
  } else if (n(bs.retainedEarningsOpening) !== 0 || n(bs.plusNetIncome) !== 0) {
    bs.retainedEarningsClosing =
      n(bs.retainedEarningsOpening) + n(bs.plusNetIncome) - n(bs.lessDividends) + n(bs.otherAdjustments);
  }

  const calcEquity =
    n(bs.preferredStock) +
    n(bs.commonStock) +
    n(bs.additionalPaidInCapital) +
    n(bs.retainedEarningsClosing) +
    n(bs.ownersAccount) +
    n(bs.fxAdjustment) +
    n(bs.legalReserve);

  if (calcEquity > 0) {
    bs.totalEquity = calcEquity;
  }

  bs.totalLiabsAndEquity = n(bs.totalLiabilities) + n(bs.totalGreyArea) + n(bs.totalEquity);

  // Golden Equation small rounding reconciliation (within 5000 currency units -> adjust minor rounding item without distorting major accounts)
  if (n(bs.totalAssets) > 0 && n(bs.totalLiabsAndEquity) > 0) {
    const diff = n(bs.totalAssets) - n(bs.totalLiabsAndEquity);
    if (Math.abs(diff) > 0 && Math.abs(diff) <= 5000) {
      bs.otherCurrentLiability = Math.max(0, n(bs.otherCurrentLiability) + diff);
      bs.totCurrentLiabilities = Math.max(0, n(bs.totCurrentLiabilities) + diff);
      bs.totalLiabilities = Math.max(0, n(bs.totalLiabilities) + diff);
      bs.totalLiabsAndEquity = n(bs.totalLiabilities) + n(bs.totalGreyArea) + n(bs.totalEquity);
    }
  }

  return extractedData;
}
