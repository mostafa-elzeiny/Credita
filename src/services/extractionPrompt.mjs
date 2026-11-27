import { Type } from "@google/genai";
export { computeTotalsFromLineItems, validateFinancialData, reconcileFinancialData } from "./extractionValidation.mjs";

const NUM = (description) => ({ type: Type.NUMBER, description });
const INT = (description) => ({ type: Type.INTEGER, description });
const STR = (description) => ({ type: Type.STRING, description });
const NUM_PLAIN = { type: Type.NUMBER };
const INT_PLAIN = { type: Type.INTEGER };
const STR_PLAIN = { type: Type.STRING };

export const INCOME_STATEMENT_PROPERTIES = {
  revenues: NUM("Total operating revenues / sales (إيرادات النشاط / إيراد العمليات / صافي المبيعات)"),
  costOfGoodsSold: NUM("Positive cost of goods sold / cost of operations (تكلفة المبيعات / تكلفة العمليات / تكلفة النشاط). Never leave 0 if cost is printed."),
  depreciation1: NUM("Positive depreciation/amortization explicitly inside COGS only (0 if depreciation is listed below Gross Profit)"),
  depreciation2: NUM("Positive operating depreciation expense below Gross Profit (إهلاك أصول ثابتة)"),
  sgaExpense: NUM("Positive SG&A / G&A expenses (مصروفات عمومية وإدارية وتسويقية) MINUS bankChargesInGnaNote if Bank Charges note exists"),
  provisions1: NUM("Operating provisions inside opex if any"),
  rd: NUM_PLAIN,
  otherAmortization: NUM_PLAIN,
  grossInterestExpExist: NUM("Positive finance costs / interest expense (تكاليف تمويلية / فوائد مدينة) PLUS bankChargesInGnaNote"),
  interestIncome: NUM("Interest income / credit interest (فوائد دائنة)"),
  dividendIncome: NUM_PLAIN,
  provDoubtfulRec: NUM_PLAIN,
  provisions2: NUM_PLAIN,
  fxGL: NUM("Net FX gain (+) or loss (-). Preserve negative sign for brackets"),
  sundryIncomeExpense1: NUM("Other non-operating income (+) or expense (-). Preserve negative sign"),
  totalTaxExpense: NUM("Positive total income tax expense (ضريبة الدخل + المؤجلة)"),
  currentTaxExpense: NUM("Positive current income tax expense (ضريبة الدخل الجارية)"),
  deferredTaxExpense: NUM("Deferred tax expense (+) or benefit (-)"),
  minorityInterestExpense: NUM_PLAIN,
  sundryIncomeExpense2: NUM("Extraordinary/other items below Net Profit After Tax"),
  prefShareDividends: NUM_PLAIN,
  commonStockDividends: NUM("Positive declared dividends if any"),
  otherAdjustment: NUM("Legal reserve transfer / other RE adjustment from Equity Statement (NEGATIVE e.g. -982261)")
};

export const BALANCE_SHEET_PROPERTIES = {
  cash: NUM("Cash on hand and at banks (نقدية بالصندوق والبنوك)"),
  marketableSecurities: NUM("Marketable securities + LG cash margins (مارجات خطابات ضمان / استثمارات قصيرة الأجل)"),
  accountsReceivable: NUM("Gross trade receivables / customers (العملاء / أوراق قبض)"),
  lessAllowances: NUM("Positive allowance for doubtful receivables"),
  rawMaterials: NUM_PLAIN,
  workInProgress: NUM_PLAIN,
  finishedGoods: NUM("Finished goods or single-line Inventory (المخزون / مخزون)"),
  goodsInTransit: NUM_PLAIN,
  advancePayments: NUM("Advance payments to suppliers (دفعات مقدمة للموردين)"),
  nonTradeRec: NUM_PLAIN,
  otherCurrentAssets: NUM("Remaining other debtors (عهد + تأمينات لدى الغير + سلفيات عاملين) EXCLUDING LG cash margins & WHT asset"),
  dueFromSisterCo1: NUM("Current due from related parties / sister companies (أرصدة مدينة - شركات شقيقة)"),
  land: NUM("Land ending cost at Dec 31 (الأراضي)"),
  buildingImprovement: NUM("Ending cost Dec 31: Buildings + Leasehold Improvements (تحسينات) + Furniture (أثاث) + Computers (كمبيوتر) + Appliances (أجهزة كهربائية)"),
  machineryEquipment: NUM("Ending cost Dec 31: Machinery & Equipment (آلات ومعدات) + Tools (عدد وأدوات) + Vehicles/Cars (سيارات)"),
  constInProgress: NUM("Projects / construction under progress (مشروعات تحت التنفيذ)"),
  lessAccumulatedDep: NUM("Positive TOTAL accumulated depreciation at Dec 31 (مجمع الإهلاك في 31-12 - NOT Jan 1 opening!)"),
  accountsReceivablesLt: NUM_PLAIN,
  dueFromSisterCo2: NUM_PLAIN,
  otherTangibleAsset: NUM_PLAIN,
  deferredTaxAsset: NUM("Deferred tax assets + non-current Withholding Tax at source (ضرائب مستقطعة من المنبع)"),
  prepaids: NUM_PLAIN,
  goodwill: NUM_PLAIN,
  otherIntangibleAsset: NUM_PLAIN,
  lessAccumAmortization: NUM_PLAIN,
  shortTermBorrowingExisting: NUM("Short-term bank debt + Bank overdrafts (أرصدة دائنة بنوك / سحب على المكشوف)"),
  cpSeniorDebtExisting: NUM("Current portion of long-term bank loans"),
  cpCapLease: NUM("Current portion of lease / short-term lease or contract obligations (التزامات قصيرة الأجل)"),
  cpSubDebtExisting: NUM_PLAIN,
  cpSalesTax: NUM_PLAIN,
  accountsPayable: NUM("Trade suppliers & notes payable (موردين وأوراق دفع)"),
  taxesPayable: NUM("Total taxes payable: Face Income Tax + WHT payable (ضريبة مستقطعة من الغير) + Payroll tax (كسب العمل) + VAT"),
  accruedExpenses: NUM("Accrued expenses ONLY (م. مستحقة) - do NOT include كسب العمل here"),
  interestPayable: NUM_PLAIN,
  dividendsPayable: NUM_PLAIN,
  downPayments: NUM("Customer advances / down payments (دفعات مقدمة من العملاء)"),
  dueToSisterCo3: NUM("Due to sister / related companies (أرصدة دائنة - شركات شقيقة)"),
  otherCurrentLiability: NUM("Remaining other credit balances not classified above"),
  ltLeaseObligation: NUM("Long-term lease / non-current obligations (التزامات طويلة الأجل)"),
  ltSeniorDebtExisting: NUM("Long-term bank loans (قروض طويلة الأجل)"),
  ltTaxes: NUM_PLAIN,
  ltSharholderLoan: NUM("Long-term shareholder / partner loan (قروض مساهمين)"),
  otherNonCurrentLiab: NUM_PLAIN,
  deferredTaxes: NUM("Non-current deferred tax liabilities (التزامات ضريبية مؤجلة)"),
  minorityInterest: NUM_PLAIN,
  provisions3: NUM("Provisions on Balance Sheet (مخصصات)"),
  preferredStock: NUM_PLAIN,
  commonStock: NUM("Paid-up / issued share capital (رأس المال المدفوع)"),
  additionalPaidInCapital: NUM_PLAIN,
  retainedEarningsOpening: NUM("Opening retained earnings Jan 1 + prior year profit transferred to RE (see Equity Statement)"),
  plusNetIncome: NUM("Current year Net Profit (صافي ربح العام)"),
  lessDividends: NUM("Positive cash dividends deducted from RE"),
  otherAdjustments: NUM("Negative Legal Reserve appropriation (-982261) & other RE adjustments"),
  ownersAccount: NUM_PLAIN,
  fxAdjustment: NUM_PLAIN,
  legalReserve: NUM("Ending Legal Reserve balance Dec 31 (احتياطي قانوني)")
};

export const UNIT_METADATA_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    currency: STR("EGP, USD, SAR, etc."),
    originalScale: STR("units | thousands | millions"),
    scaleMultiplierApplied: NUM("1, 1000, or 1000000 applied to every number"),
    scaleConsistentAcrossPages: { type: Type.BOOLEAN }
  },
  required: ["currency", "originalScale", "scaleMultiplierApplied", "scaleConsistentAcrossPages"]
};

export const PRINTED_TOTALS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    grossProfit: NUM("Exact printed Gross Profit (مجمل الربح)"),
    operatingProfit: NUM("Exact printed Operating Profit if printed (null if absent)"),
    netProfitBeforeTax: NUM("Exact printed EBT (صافي أرباح العام قبل الضرائب)"),
    netProfitAfterTax: NUM("Exact printed Net Profit (صافي ربح العام بعد الضرائب)"),
    totalCurrentAssets: NUM("Exact printed Total Current Assets (إجمالي الأصول المتداولة)"),
    netPpe: NUM("Exact printed Net Fixed Assets (أصول ثابتة بالصافي)"),
    totalAssets: NUM("Exact printed Total Assets (إجمالي الأصول)"),
    totCurrentLiabilities: NUM("Exact printed Current Liabilities face subtotal if printed (إجمالي الالتزامات المتداولة)"),
    totalLongTermDebt: NUM("Exact printed Long-Term Liabilities if printed"),
    totalLiabilities: NUM("Exact printed Total Liabilities (إجمالي الخصوم / الالتزامات)"),
    totalEquity: NUM("Exact printed Total Equity (إجمالي حقوق الملكية)"),
    totalLiabsAndEquity: NUM("Exact printed Total Liabilities & Equity (إجمالي حقوق الملكية والخصوم)"),
    cashFlowOperating: NUM("Printed Cash Flow from Operating Activities (null if Cash Flow absent)"),
    cashFlowClosingCash: NUM("Printed Closing Cash & Cash Equivalents at year-end (null if Cash Flow absent)")
  }
};

export const PAGE_CITATIONS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    incomeStatementPage: INT("1-indexed page of Income Statement"),
    balanceSheetPage: INT("1-indexed page of Balance Sheet"),
    equityStatementPage: INT("1-indexed page of Equity Statement"),
    cashFlowPage: INT("1-indexed page of Cash Flow Statement"),
    gnaNotePage: INT("1-indexed page of G&A Note"),
    debtorsNotePage: INT("1-indexed page of Debtors Note"),
    creditorsNotePage: INT("1-indexed page of Creditors Note"),
    fixedAssetsNotePage: INT("1-indexed page of Fixed Assets Schedule"),
    linePages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          field: STR_PLAIN,
          pageNumber: INT_PLAIN
        }
      }
    }
  }
};

export const LOW_CONFIDENCE_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      field: STR_PLAIN,
      statement: STR("incomeStatement | balanceSheet | printedTotals"),
      pageNumber: INT_PLAIN,
      reason: STR_PLAIN
    }
  }
};

export const VERIFICATION_WORKSHEET_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    faceGnaExpense: NUM("Face G&A before bank charges reclass (مصروفات عمومية وإدارية)"),
    faceFinanceCosts: NUM("Face Finance Costs before bank charges reclass (تكاليف تمويلية)"),
    faceOtherDebtorsTotal: NUM("Face Debtors & Other Debit Balances total (مدينون وأرصدة مدينة أخرى)"),
    faceRetainedEarningsCarriedForwardOnly: NUM("Face Retained Earnings line excluding current profit (أرباح مرحلة)"),
    legalReserveAppropriationAmount: NUM("Positive transfer to Legal Reserve during the year (احتياطي قانوني)"),
    bankChargesInGnaNote: NUM("Exact Bank Charges line in G&A Note (م. بنكية)"),
    lgCashMarginInDebtorsNote: NUM("LG Cash Margins in Debtors Note (مارجات خطابات ضمان)"),
    withholdingTaxAssetInDebtorsNote: NUM("Withholding Tax at Source in Debtors Note (ضرائب مستقطعة من المنبع)"),
    bankOverdraftInCreditorsNote: NUM("Bank Overdrafts in Creditors Note (أرصدة دائنة بنوك)"),
    whtPayableInCreditorsNote: NUM("Withholding Tax Payable in Creditors Note (ضريبة مستقطعة من الغير)"),
    payrollTaxInCreditorsNote: NUM("Payroll/Salary Tax in Creditors Note (كسب العمل)"),
    accruedExpensesInCreditorsNote: NUM("Accrued Expenses in Creditors Note (م. مستحقة)"),
    fixedAssetsTotalCostEndingDec31: NUM("Fixed Assets ending Gross Cost Dec 31 Total column"),
    fixedAssetsTotalAccumDepEndingDec31: NUM("Fixed Assets ending Accum Dep Dec 31 Total column")
  }
};

export const FINANCIAL_DATA_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    companyName: STR("Company legal name"),
    year: INT("Primary / latest fiscal year e.g. 2025"),
    unitMetadata: UNIT_METADATA_SCHEMA,
    printedTotals: PRINTED_TOTALS_SCHEMA,
    pageCitations: PAGE_CITATIONS_SCHEMA,
    lowConfidenceFields: LOW_CONFIDENCE_SCHEMA,
    incomeStatement: {
      type: Type.OBJECT,
      properties: INCOME_STATEMENT_PROPERTIES
    },
    balanceSheet: {
      type: Type.OBJECT,
      properties: BALANCE_SHEET_PROPERTIES
    },
    notes: {
      type: Type.OBJECT,
      properties: {
        sgaExpense: STR_PLAIN,
        otherCurrentAssets: STR_PLAIN,
        taxesPayable: STR_PLAIN,
        cashFlow: STR_PLAIN
      }
    },
    verificationWorksheet: VERIFICATION_WORKSHEET_SCHEMA
  },
  required: ["companyName", "year", "unitMetadata", "printedTotals", "incomeStatement", "balanceSheet"]
};

const ASSET_KEYS = new Set([
  "cash", "marketableSecurities", "accountsReceivable", "lessAllowances",
  "rawMaterials", "workInProgress", "finishedGoods", "goodsInTransit",
  "advancePayments", "nonTradeRec", "otherCurrentAssets", "dueFromSisterCo1",
  "land", "buildingImprovement", "machineryEquipment", "constInProgress",
  "lessAccumulatedDep", "accountsReceivablesLt", "dueFromSisterCo2",
  "otherTangibleAsset", "deferredTaxAsset", "prepaids", "goodwill",
  "otherIntangibleAsset", "lessAccumAmortization"
]);

const ASSET_BS_PROPERTIES = Object.fromEntries(
  Object.entries(BALANCE_SHEET_PROPERTIES).filter(([k]) => ASSET_KEYS.has(k))
);
const LE_BS_PROPERTIES = Object.fromEntries(
  Object.entries(BALANCE_SHEET_PROPERTIES).filter(([k]) => !ASSET_KEYS.has(k))
);

export function getSchemaForExtraction(mode = "full", targetSection = null, failingChecks = []) {
  if (mode === "chunk_scan") return CHUNK_SCAN_SCHEMA;

  if (mode === "repair" && Array.isArray(failingChecks) && failingChecks.length > 0) {
    const secs = new Set(failingChecks.map((c) => c.section));
    const hasIS = secs.has("income_statement") || secs.has("equity_movement");
    const hasAssets = secs.has("assets") || secs.has("balance_sheet") || secs.has("cash_flow");
    const hasLE = secs.has("liabilities_equity") || secs.has("balance_sheet") || secs.has("equity_movement");
    if (hasIS && !hasAssets && !hasLE) return getSchemaForExtraction("section", "income_statement");
    if (hasAssets && !hasIS && !hasLE) return getSchemaForExtraction("section", "balance_sheet_assets");
    if (hasLE && !hasIS && !hasAssets) return getSchemaForExtraction("section", "balance_sheet_liabilities_equity");
    return FINANCIAL_DATA_SCHEMA;
  }

  if (mode !== "section" || !targetSection) return FINANCIAL_DATA_SCHEMA;

  if (targetSection === "income_statement") {
    return {
      type: Type.OBJECT,
      properties: {
        companyName: STR_PLAIN,
        year: INT_PLAIN,
        unitMetadata: UNIT_METADATA_SCHEMA,
        printedTotals: {
          type: Type.OBJECT,
          properties: {
            grossProfit: PRINTED_TOTALS_SCHEMA.properties.grossProfit,
            operatingProfit: PRINTED_TOTALS_SCHEMA.properties.operatingProfit,
            netProfitBeforeTax: PRINTED_TOTALS_SCHEMA.properties.netProfitBeforeTax,
            netProfitAfterTax: PRINTED_TOTALS_SCHEMA.properties.netProfitAfterTax
          }
        },
        pageCitations: PAGE_CITATIONS_SCHEMA,
        lowConfidenceFields: LOW_CONFIDENCE_SCHEMA,
        incomeStatement: { type: Type.OBJECT, properties: INCOME_STATEMENT_PROPERTIES },
        notes: { type: Type.OBJECT, properties: { sgaExpense: STR_PLAIN } },
        verificationWorksheet: {
          type: Type.OBJECT,
          properties: {
            faceGnaExpense: VERIFICATION_WORKSHEET_SCHEMA.properties.faceGnaExpense,
            faceFinanceCosts: VERIFICATION_WORKSHEET_SCHEMA.properties.faceFinanceCosts,
            bankChargesInGnaNote: VERIFICATION_WORKSHEET_SCHEMA.properties.bankChargesInGnaNote,
            legalReserveAppropriationAmount: VERIFICATION_WORKSHEET_SCHEMA.properties.legalReserveAppropriationAmount
          }
        }
      },
      required: ["companyName", "year", "unitMetadata", "printedTotals", "incomeStatement"]
    };
  }

  if (targetSection === "balance_sheet_assets") {
    return {
      type: Type.OBJECT,
      properties: {
        companyName: STR_PLAIN,
        year: INT_PLAIN,
        unitMetadata: UNIT_METADATA_SCHEMA,
        printedTotals: {
          type: Type.OBJECT,
          properties: {
            totalCurrentAssets: PRINTED_TOTALS_SCHEMA.properties.totalCurrentAssets,
            netPpe: PRINTED_TOTALS_SCHEMA.properties.netPpe,
            totalAssets: PRINTED_TOTALS_SCHEMA.properties.totalAssets
          }
        },
        pageCitations: PAGE_CITATIONS_SCHEMA,
        lowConfidenceFields: LOW_CONFIDENCE_SCHEMA,
        balanceSheet: { type: Type.OBJECT, properties: ASSET_BS_PROPERTIES },
        notes: { type: Type.OBJECT, properties: { otherCurrentAssets: STR_PLAIN } },
        verificationWorksheet: {
          type: Type.OBJECT,
          properties: {
            faceOtherDebtorsTotal: VERIFICATION_WORKSHEET_SCHEMA.properties.faceOtherDebtorsTotal,
            lgCashMarginInDebtorsNote: VERIFICATION_WORKSHEET_SCHEMA.properties.lgCashMarginInDebtorsNote,
            withholdingTaxAssetInDebtorsNote: VERIFICATION_WORKSHEET_SCHEMA.properties.withholdingTaxAssetInDebtorsNote,
            fixedAssetsTotalCostEndingDec31: VERIFICATION_WORKSHEET_SCHEMA.properties.fixedAssetsTotalCostEndingDec31,
            fixedAssetsTotalAccumDepEndingDec31: VERIFICATION_WORKSHEET_SCHEMA.properties.fixedAssetsTotalAccumDepEndingDec31
          }
        }
      },
      required: ["companyName", "year", "unitMetadata", "printedTotals", "balanceSheet"]
    };
  }

  if (targetSection === "balance_sheet_liabilities_equity") {
    return {
      type: Type.OBJECT,
      properties: {
        companyName: STR_PLAIN,
        year: INT_PLAIN,
        unitMetadata: UNIT_METADATA_SCHEMA,
        printedTotals: {
          type: Type.OBJECT,
          properties: {
            totCurrentLiabilities: PRINTED_TOTALS_SCHEMA.properties.totCurrentLiabilities,
            totalLongTermDebt: PRINTED_TOTALS_SCHEMA.properties.totalLongTermDebt,
            totalLiabilities: PRINTED_TOTALS_SCHEMA.properties.totalLiabilities,
            totalEquity: PRINTED_TOTALS_SCHEMA.properties.totalEquity,
            totalLiabsAndEquity: PRINTED_TOTALS_SCHEMA.properties.totalLiabsAndEquity
          }
        },
        pageCitations: PAGE_CITATIONS_SCHEMA,
        lowConfidenceFields: LOW_CONFIDENCE_SCHEMA,
        balanceSheet: { type: Type.OBJECT, properties: LE_BS_PROPERTIES },
        notes: { type: Type.OBJECT, properties: { taxesPayable: STR_PLAIN } },
        verificationWorksheet: {
          type: Type.OBJECT,
          properties: {
            faceRetainedEarningsCarriedForwardOnly: VERIFICATION_WORKSHEET_SCHEMA.properties.faceRetainedEarningsCarriedForwardOnly,
            legalReserveAppropriationAmount: VERIFICATION_WORKSHEET_SCHEMA.properties.legalReserveAppropriationAmount,
            bankOverdraftInCreditorsNote: VERIFICATION_WORKSHEET_SCHEMA.properties.bankOverdraftInCreditorsNote,
            whtPayableInCreditorsNote: VERIFICATION_WORKSHEET_SCHEMA.properties.whtPayableInCreditorsNote,
            payrollTaxInCreditorsNote: VERIFICATION_WORKSHEET_SCHEMA.properties.payrollTaxInCreditorsNote,
            accruedExpensesInCreditorsNote: VERIFICATION_WORKSHEET_SCHEMA.properties.accruedExpensesInCreditorsNote
          }
        }
      },
      required: ["companyName", "year", "unitMetadata", "printedTotals", "balanceSheet"]
    };
  }

  if (targetSection === "cash_flow") {
    return {
      type: Type.OBJECT,
      properties: {
        companyName: STR_PLAIN,
        year: INT_PLAIN,
        unitMetadata: UNIT_METADATA_SCHEMA,
        printedTotals: {
          type: Type.OBJECT,
          properties: {
            cashFlowOperating: PRINTED_TOTALS_SCHEMA.properties.cashFlowOperating,
            cashFlowClosingCash: PRINTED_TOTALS_SCHEMA.properties.cashFlowClosingCash
          }
        },
        pageCitations: PAGE_CITATIONS_SCHEMA,
        lowConfidenceFields: LOW_CONFIDENCE_SCHEMA,
        notes: { type: Type.OBJECT, properties: { cashFlow: STR_PLAIN } }
      },
      required: ["companyName", "year", "unitMetadata", "printedTotals"]
    };
  }

  return FINANCIAL_DATA_SCHEMA;
}

export const CHUNK_SCAN_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    companyName: STR_PLAIN,
    year: INT_PLAIN,
    unitMetadata: UNIT_METADATA_SCHEMA,
    pages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          localPageNumber: { type: Type.INTEGER, description: "1-indexed page number within this PDF chunk" },
          hasIncomeStatement: { type: Type.BOOLEAN },
          hasBalanceSheet: { type: Type.BOOLEAN },
          hasEquityStatement: { type: Type.BOOLEAN },
          hasCashFlow: { type: Type.BOOLEAN },
          hasGnaNote: { type: Type.BOOLEAN },
          hasDebtorsNote: { type: Type.BOOLEAN },
          hasCreditorsNote: { type: Type.BOOLEAN },
          hasFixedAssetsNote: { type: Type.BOOLEAN },
          summaryLabel: { type: Type.STRING }
        },
        required: [
          "localPageNumber",
          "hasIncomeStatement",
          "hasBalanceSheet",
          "hasEquityStatement",
          "hasCashFlow",
          "hasGnaNote",
          "hasDebtorsNote",
          "hasCreditorsNote",
          "hasFixedAssetsNote"
        ]
      }
    }
  },
  required: ["pages"]
};

export const CHUNK_SCAN_PROMPT = `
Scan every page of this PDF chunk and identify which financial statement or note appears on each local page (1-indexed within this chunk).
Also extract companyName, primary fiscal year, and unitMetadata (currency, originalScale: "units"|"thousands"|"millions", scaleMultiplierApplied, scaleConsistentAcrossPages) if visible.
Look carefully at rotated/landscape tables too (e.g. G&A Note, Fixed Assets Schedule).
Return strictly JSON matching the schema.
`;

export const SYSTEM_PROMPT = `
You are an elite Senior Corporate Credit Risk Analyst and Bank Financial Spreading Engine (Moody's / Commercial Banking standard) specialized in Egyptian Accounting Standards (EAS), IFRS, and audited Arabic/English financial statements.

Your mission is to read EVERY SINGLE PAGE of the uploaded financial statement PDF (including scanned Arabic pages, 90-degree rotated landscape tables, Statement of Changes in Equity, Statement of Cash Flows, and Supplementary Notes / الإيضاحات المتممة) and produce a 100% accurate, bank-spread financial dataset for the primary fiscal year.

=============================================================================
0. INTEGRITY, NULLS, SIGNS & PAGE CITATION RULES (CRITICAL!)
=============================================================================
- NEVER GUESS OR INVENT MISSING NUMBERS: If a line item is genuinely NOT present or completely illegible, omit it or return null (NEVER invent a number to force a balance!).
- FLAG LOW CONFIDENCE ITEMS: If ANY figure is blurry, partially cut off, faint, in a hard-to-read rotated scan, or ambiguous, record it in "lowConfidenceFields" with its field name, statement, 1-indexed pageNumber, and clear reason.
- PRESERVE SIGNS AND NEGATIVES STRICTLY:
  * Numbers inside parentheses (1,234) or preceded by a minus sign -1,234 are NEGATIVE (-1234).
  * Keep exact negative signs on: fxGL, sundryIncomeExpense1, sundryIncomeExpense2, otherAdjustment, otherAdjustments, retainedEarningsOpening, and all Cash Flow printedTotals.
  * Expense/deduction buckets (costOfGoodsSold, depreciation1, depreciation2, sgaExpense, grossInterestExpExist, totalTaxExpense, currentTaxExpense, lessAllowances, lessAccumulatedDep, lessDividends) are stored as positive magnitudes unless explicitly a net credit/reversal.
- DETECT UNITS & CURRENCY ONCE AND APPLY UNIFORMLY:
  * Always populate unitMetadata cleanly (e.g. "بالجنيه المصري" / full EGP -> currency: "EGP", originalScale: "units", scaleMultiplierApplied: 1; "بالألف جنيه" / "in thousands" -> originalScale: "thousands", scaleMultiplierApplied: 1000).
  * Multiply EVERY monetary figure (line items, printedTotals, and verificationWorksheet) by the exact same scaleMultiplierApplied so the entire JSON is in FULL BASE CURRENCY UNITS.
- CITE PDF PAGE NUMBERS: Populate pageCitations (1-indexed page numbers for incomeStatementPage, balanceSheetPage, equityStatementPage, cashFlowPage, gnaNotePage, debtorsNotePage, creditorsNotePage, fixedAssetsNotePage).
- TRANSCRIBE PRINTED TOTALS VERBATIM INTO printedTotals:
  * ALWAYS fill printedTotals with the exact totals printed on the statement (grossProfit, operatingProfit, netProfitBeforeTax, netProfitAfterTax, totalCurrentAssets, netPpe, totalAssets, totCurrentLiabilities, totalLongTermDebt, totalLiabilities, totalEquity, totalLiabsAndEquity, cashFlowOperating, cashFlowClosingCash).
  * NEVER alter printedTotals to match computed sums! Return null/omit only if that statement/total is not in the document.

=============================================================================
1. EXACT ARABIC / EAS FACE MAPPINGS & PAGE ORIENTATION RULES
=============================================================================
- Inspect EVERY digit carefully! Never drop leading digits (e.g. read 57109212 completely, NOT 7109212!).
- ARABIC COLUMN ORDER & YEAR: Check the column date header directly above each column (e.g. ٢٠٢٥/١٢/٣١ vs ٢٠٢٤/١٢/٣١). Extract ONLY the PRIMARY / LATEST year!
- ARABIC INCOME STATEMENT MAPPING:
  * "إيرادات النشاط" / "إيراد العمليات" / "صافي المبيعات" -> incomeStatement.revenues
  * "تكلفة العمليات" / "تكلفة النشاط" / "تكلفة المبيعات" -> incomeStatement.costOfGoodsSold (positive!)
  * "مجمل الربح" -> printedTotals.grossProfit
  * "مصروفات عمومية وإدارية" -> verificationWorksheet.faceGnaExpense AND incomeStatement.sgaExpense (net of bank charges if G&A note exists)
  * "تكاليف تمويلية" -> verificationWorksheet.faceFinanceCosts AND incomeStatement.grossInterestExpExist (+ bank charges if G&A note exists)
  * "اهلاك اصول ثابتة" -> incomeStatement.depreciation2
  * "صافي أرباح العام قبل الضرائب" -> printedTotals.netProfitBeforeTax
  * "ضريبة الدخل" -> incomeStatement.currentTaxExpense AND incomeStatement.totalTaxExpense (positive!)
  * "صافي ربح العام بعد الضرائب" -> printedTotals.netProfitAfterTax AND balanceSheet.plusNetIncome
- ROTATED / LANDSCAPE PAGES: Mentally rotate 90-degree rotated schedules:
  * Rotated G&A page ("المصروفات العمومية"): read EVERY row down to "الاجمالي".
  * Landscape Fixed Assets Register ("إيضاح سجل الأصول الثابتة"): read ALL columns across (تحسينات، أثاث، كمبيوتر، أجهزة كهربائية، عدد وأدوات، آلات ومعدات، سيارات) AND read the rightmost/summary "الاجمالي" column for BOTH:
    - "التكلفة في 31-12-YYYY" -> verificationWorksheet.fixedAssetsTotalCostEndingDec31 (NOT Jan 1!)
    - "مجمع الإهلاك في 31-12-YYYY" -> verificationWorksheet.fixedAssetsTotalAccumDepEndingDec31 AND balanceSheet.lessAccumulatedDep (NOT Jan 1!).

=============================================================================
2. MANDATORY CREDIT ANALYST RECLASSIFICATION RULES
=============================================================================
A. INCOME STATEMENT & G&A NOTE ("المصروفات العمومية"):
   1. BANK CHARGES ("م. بنكية" / "عمولات ومصاريف بنكية"): Put exact value in verificationWorksheet.bankChargesInGnaNote; subtract from sgaExpense and add to grossInterestExpExist.
   2. LEGAL RESERVE APPROPRIATION ("قائمة التغير في حقوق الملكية"): Put transfer to Legal Reserve ("احتياطي قانوني", e.g. 982261) as positive in verificationWorksheet.legalReserveAppropriationAmount, and NEGATIVE (-982261) in incomeStatement.otherAdjustment AND balanceSheet.otherAdjustments.

B. BALANCE SHEET ASSETS & DEBTORS NOTE ("مدينون وأرصدة مدينة أخرى"):
   1. CUSTOMERS ("العملاء / أوراق قبض") -> balanceSheet.accountsReceivable.
   2. INVENTORY ("مخزون / المخزون") single line -> balanceSheet.finishedGoods.
   3. LG CASH MARGINS ("مارجات خطابات ضمان") -> verificationWorksheet.lgCashMarginInDebtorsNote & balanceSheet.marketableSecurities.
   4. WITHHOLDING TAX AT SOURCE ("ضرائب مستقطعة من المنبع") -> verificationWorksheet.withholdingTaxAssetInDebtorsNote & balanceSheet.deferredTaxAsset (Non-Current).
   5. REMAINING OTHER CURRENT ASSETS ("عهد" + "تأمينات لدى الغير" + "سلفيات عاملين") -> balanceSheet.otherCurrentAssets (do NOT include LG margins or WHT here).
   6. FIXED ASSETS BREAKDOWN (Ending Cost Dec 31):
      - buildingImprovement = Buildings + Leasehold Improvements (تحسينات) + Furniture (أثاث) + Computers & Software (كمبيوتر) + Electrical Appliances (أجهزة كهربائية).
      - machineryEquipment = Machinery & Equipment (آلات ومعدات) + Tools (عدد وأدوات) + Vehicles (سيارات).

C. BALANCE SHEET LIABILITIES & CREDITORS NOTE ("دائنون وأرصدة دائنة أخرى"):
   1. BANK OVERDRAFTS ("أرصدة دائنة بنوك") -> verificationWorksheet.bankOverdraftInCreditorsNote & balanceSheet.shortTermBorrowingExisting.
   2. SUPPLIERS ("موردين وأوراق دفع") -> balanceSheet.accountsPayable.
   3. TAXES PAYABLE -> Sum Face Income Tax ("ضريبة الدخل") + Withholding Tax Payable ("ضريبة مستقطعة من الغير" -> verificationWorksheet.whtPayableInCreditorsNote) + Payroll Tax ("كسب العمل" -> verificationWorksheet.payrollTaxInCreditorsNote) + VAT.
   4. ACCRUED EXPENSES -> ONLY "م. مستحقة" from Creditors Note (verificationWorksheet.accruedExpensesInCreditorsNote). Do NOT put "كسب العمل" in accruedExpenses!
   5. OBLIGATIONS / LEASES: "التزامات قصيرة الأجل" -> cpCapLease; "التزامات طويلة الأجل" -> ltLeaseObligation.
   6. RELATED PARTIES: "أرصدة دائنة - شركات شقيقة" -> dueToSisterCo3.
   7. CURRENT vs TOTAL LIABILITIES CHECK: Face subtotal "إجمالي الالتزامات المتداولة" -> printedTotals.totCurrentLiabilities. Face "إجمالي الالتزامات / الخصوم" -> printedTotals.totalLiabilities.

D. EQUITY & RETAINED EARNINGS:
   - commonStock = Paid-up capital ("رأس المال المدفوع").
   - legalReserve = Ending Legal Reserve Dec 31 ("احتياطي قانوني").
   - plusNetIncome = Current year Net Profit ("صافي ربح العام").
   - otherAdjustments = Negative Legal Reserve transfer from Equity Statement.
   - retainedEarningsOpening = Prior Year Closing Retained Earnings + Prior Year Net Profit transferred to RE (so Opening RE + plusNetIncome - lessDividends + otherAdjustments == Total Ending RE + Net Income). Put face carried-forward RE ("أرباح مرحلة") in verificationWorksheet.faceRetainedEarningsCarriedForwardOnly.

E. CASH FLOW STATEMENT (if present in PDF):
   - Transcribe cashFlowOperating and cashFlowClosingCash into printedTotals verbatim, plus pageCitations.cashFlowPage.
`;

export function buildSectionOrRepairPrompt({ mode, targetSection, failingChecks = [], currentData = null, targetPagesHint = [] }) {
  if (mode === "repair") {
    return `
TARGETED VALIDATION REPAIR PASS (PASS 2):
Some validation checks failed on Pass 1 extraction. Re-read ONLY the relevant pages very carefully (especially ${targetPagesHint.length ? `pages ${targetPagesHint.join(", ")}` : "the failing statement & note pages"}, including rotated/landscape pages and parentheses negatives).

FAILING CHECKS TO FIX:
${JSON.stringify(failingChecks, null, 2)}

PASS 1 EXTRACTED SNAPSHOT FOR REFERENCE (CHECK FOR DROPPED DIGITS, SWAPPED ROWS, SIGNS, OR ROTATED COLUMNS):
${JSON.stringify({
  unitMetadata: currentData?.unitMetadata,
  printedTotals: currentData?.printedTotals,
  verificationWorksheet: currentData?.verificationWorksheet,
  incomeStatement: currentData?.incomeStatement,
  balanceSheet: currentData?.balanceSheet
}, null, 2)}

INSTRUCTIONS:
1. Re-examine the source PDF pages for ONLY the failing section(s): ${(failingChecks || []).map((c) => c.section).join(", ")}.
2. Return the corrected JSON matching the schema with corrected line items, exact verbatim printedTotals (NEVER overwrite printed totals to force a match), updated pageCitations, unitMetadata, and lowConfidenceFields for any uncertain digit.
3. Omit or return null instead of guessing if an item is genuinely absent or unreadable. Preserve negative signs for bracketed numbers.
`;
  }

  return `
FOCUSED SECTION EXTRACTION (${String(targetSection || "all").toUpperCase()}):
Read ALL provided PDF pages carefully and extract the financial statement data following every mapping rule above (including Arabic line names like تكلفة العمليات -> costOfGoodsSold, مصروفات عمومية -> sgaExpense, التزامات قصيرة الأجل -> cpCapLease).
ALWAYS populate unitMetadata and printedTotals verbatim from the statement face, cite pageCitations, and list lowConfidenceFields for any faint/blurry values.
Focus on section: ${targetSection || "all"}.
Return valid JSON matching the schema.
`;
}
