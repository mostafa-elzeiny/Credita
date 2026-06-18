import { GoogleGenAI, GenerateContentResponse, Type, ThinkingLevel } from "@google/genai";

export interface FinancialData {
  companyName?: string;
  year: number;
  incomeStatement: {
    revenues: number;
    costOfGoodsSold: number;
    depreciation1: number;
    grossProfit: number;
    depreciation2: number;
    sgaExpense: number;
    provisions1: number;
    rd: number;
    goodwillAmortization: number;
    otherAmortization: number;
    netOperatingProfit: number;
    grossInterestExpExist: number;
    interestExpNew: number;
    capitalizedInterest: number;
    interestIncome: number;
    dividendIncome: number;
    provDoubtfulRec: number;
    provisions2: number;
    fxGL: number;
    sundryIncomeExpense1: number;
    netProfitBeforeTax: number;
    totalTaxExpense: number;
    currentTaxExpense: number;
    deferredTaxExpense: number;
    itc: number;
    netProfitAfterTax: number;
    minorityInterestExpense: number;
    saleOfPlant: number;
    sundryIncomeExpense2: number;
    npaui: number;
    prefShareDividends: number;
    commonStockDividends: number;
    otherAdjustment: number;
    totalChange: number;
  };
  balanceSheet: {
    cash: number;
    marketableSecurities: number;
    marketableSecExcess: number;
    accountsReceivable: number;
    lessAllowances: number;
    netReceivables: number;
    rawMaterials: number;
    workInProgress: number;
    finishedGoods: number;
    goodsInTransit: number;
    totalInventory: number;
    advancePayments: number;
    nonTradeRec: number;
    otherCurrentAssets: number;
    dueFromSisterCo1: number;
    totalCurrentAssets: number;
    land: number;
    buildingImprovement: number;
    machineryEquipment: number;
    constInProgress: number;
    grossPlant: number;
    lessAccumulatedDep: number;
    netPpe: number;
    accountsReceivablesLt: number;
    dueFromSisterCo2: number;
    otherTangibleAsset: number;
    deferredTaxAsset: number;
    prepaids: number;
    goodwill: number;
    otherIntangibleAsset: number;
    lessAccumAmortization: number;
    netIntangibles: number;
    totalAssets: number;
    shortTermBorrowingExisting: number;
    shortTermBorrowingNew: number;
    cpSeniorDebtExisting: number;
    cpSeniorDebtNew: number;
    cpCapLease: number;
    cpSubDebtExisting: number;
    cpSalesTax: number;
    accountsPayable: number;
    taxesPayable: number;
    accruedExpenses: number;
    interestPayable: number;
    dividendsPayable: number;
    downPayments: number;
    dueToSisterCo3: number;
    otherCurrentLiability: number;
    totCurrentLiabilities: number;
    ltLeaseObligation: number;
    ltSeniorDebtExisting: number;
    ltSeniorDebtNew: number;
    ltTaxes: number;
    ltSharholderLoan: number;
    totalLongTermDebt: number;
    otherNonCurrentLiab: number;
    totalLiabilities: number;
    deferredTaxes: number;
    minorityInterest: number;
    provisions3: number;
    totalGreyArea: number;
    preferredStock: number;
    commonStock: number;
    additionalPaidInCapital: number;
    retainedEarningsOpening: number;
    plusNetIncome: number;
    lessDividends: number;
    otherAdjustments: number;
    retainedEarningsClosing: number;
    ownersAccount: number;
    fxAdjustment: number;
    legalReserve: number;
    totalEquity: number;
    totalLiabsAndEquity: number;
  };
  notes: {
    [key: string]: string;
  };
}

const FINANCIAL_DATA_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    companyName: { type: Type.STRING, description: "The name of the company (e.g., EPIC Free zone)" },
    year: { type: Type.NUMBER, description: "The fiscal year of the document (e.g., 2024)" },
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
      required: ["revenues", "costOfGoodsSold", "grossProfit", "netProfitAfterTax"]
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
      required: ["totalAssets", "totalLiabilities", "totalEquity"]
    },
    notes: {
      type: Type.OBJECT,
      description: "Extract the 'Note' or 'Breakdown' reference numbers found next to line items (e.g., if 'Cash' has a '1' next to it, notes.cash = '1')",
      properties: {
        revenues: { type: Type.STRING },
        costOfGoodsSold: { type: Type.STRING },
        grossProfit: { type: Type.STRING },
        netOperatingProfit: { type: Type.STRING },
        totalAssets: { type: Type.STRING },
        totalLiabilities: { type: Type.STRING },
        totalEquity: { type: Type.STRING },
      },
      additionalProperties: { type: Type.STRING }
    }
  },
  required: ["year", "incomeStatement", "balanceSheet", "notes"]
};

const BATCH_FINANCIAL_DATA_SCHEMA = {
  type: Type.ARRAY,
  items: FINANCIAL_DATA_SCHEMA,
  description: "An array of financial data objects, one for each provided document, in the same order as the documents were provided."
};

const SYSTEM_PROMPT = `
You are a world-class Financial Data Extraction Engine.
Extract financial data from the document with 100% accuracy, following "EPIC" mapping rules.

CRITICAL MAPPING RULES (FOLLOW STRICTLY):

1. INCOME STATEMENT:
   - REVENUES: Capture top-line sales/revenue. Sum all revenue lines if multiple exist.
   - DEPRECIATION1: Extract depreciation related to production/COGS. Look in the notes for "مصروف إهلاك آلات و معدات" or similar within the cost breakdown.
   - COGS: This MUST be the "Total Cost of Sales" MINUS "Depreciation1". If the document shows a total cost line, subtract the depreciation found in the notes from it.
   - DEPRECIATION2: Extract depreciation related to SG&A or admin (إهلاكات إدارية).
   - SG&A EXPENSE: Extract general and administrative expenses (مصروفات عمومية و إدارية).
   - INTEREST EXPENSE (NEW): Map "Interest Expense" (فوائد بنكية مدينة / مصروفات تمويلية).
   - NET PROFIT AFTER TAX: Map "Net Profit" (صافي ربح العام).

2. BALANCE SHEET - ASSETS:
   - CASH: Map "Cash and Bank Balances" (النقدية و ما في حكمها).
   - MARKETABLE SECURITIES: Map "Letters of Guarantee" (خطابات ضمان).
   - ACCOUNTS RECEIVABLE: Map "Clients/Trade Receivables" (العملاء).
   - INVENTORY: Map "Total Inventory" (مخزون أخر المدة).
   - PROPERTY, PLANT & EQUIP BREAKDOWN:
     - LAND: Map "Land" (أراضي).
     - BUILDING & IMPROVEMENT: Map "Buildings" (مباني) + "Furniture/Fixtures" (أثاث و تجهيزات).
     - MACHINERY & EQUIPMENT: Map "Machinery" (آلات ومعدات) + "Right of Use Assets" (أصول بحق الانتفاع) + "Computers" (أجهزة كمبيوتر).
   - GROSS PLANT: Sum of all PPE items before depreciation. MUST include "Right of Use Assets".
   - LESS ACCUMULATED DEP: Map "Accumulated Depreciation" (مجمع الإهلاك).
   - NET PP&E: Map "Net Fixed Assets" (صافي الأصول الثابتة). MUST match Gross Plant - Accumulated Dep.

3. BALANCE SHEET - LIABILITIES & EQUITY:
   - SHORT TERM BORROWING--EXISTING: Map "Bank Credit Balances" (بنوك أرصدة دائنة).
   - CP SENIOR DEBT--EXISTING: Map "Current Loan Installments" (أقساط قروض متداولة).
   - CP CAP LEASE: Map "Current Lease Installments" (أقساط تأجير تمويلي متداولة).
   - ACCOUNTS PAYABLE: Map "Suppliers" (الموردون).
   - ACCRUED EXPENSES: Map "Accrued Expenses" (مصروفات مستحقه).
   - LT LEASE OBLIGATION: Map "Long Term Lease Installments" (أقساط تأجير تمويلي طويلة الاجل).
   - LT SENIOR DEBT--EXISTING: Map "Long Term Loan Installments" (أقساط قروض طويلة الاجل).
   - OWNERS ACCOUNT: Map "Partners Current" (جاري الشركاء).
   - COMMON STOCK: Map "Capital" (رأس المال).
   - RETAINED EARNINGS OPENING: Map "Retained Earnings" from the previous year.

GENERAL:
- Parentheses (1,234) mean negative.
- Convert Arabic numerals to English digits.
- Extract numbers EXACTLY as shown.
- Detect Fiscal Year.

CONSISTENCY (MANDATORY):
- Total Assets = Total Liabilities + Total Equity.
- Gross Profit = Revenues - COGS - Depreciation1.
- Net Profit After Tax must match the document.

Return ONLY a valid JSON object.
`;

export async function extractFinancialData(file: File, highPrecision = false): Promise<FinancialData> {
  const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : null);
  
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. If you are using Vercel, make sure to add VITE_GEMINI_API_KEY to Environment Variables and REDEPLOY your app.");
  }

  const base64Data = await fileToBase64(file);
  const mimeType = file.type;

  const prompt = SYSTEM_PROMPT;

  const executeExtraction = async (retryCount = 0): Promise<FinancialData> => {
    const ai = new GoogleGenAI({ apiKey });
    const modelName = "gemini-3-flash-preview";
    
    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: base64Data.split(",")[1],
                  mimeType: mimeType,
                },
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: FINANCIAL_DATA_SCHEMA,
          temperature: 0.1,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        }
      });

      const text = response.text || "{}";
      const rawData = JSON.parse(text);
      return sanitizeFinancialData(rawData);
    } catch (error: any) {
      const errorString = JSON.stringify(error);
      console.error(`Gemini Extraction Error:`, errorString);
      
      const isQuotaError = errorString.includes("429") || errorString.includes("RESOURCE_EXHAUSTED");

      if (isQuotaError && retryCount < 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return executeExtraction(retryCount + 1);
      }

      throw new Error(error?.message || "Extraction failed");
    }
  };

  return executeExtraction();
}

// Keep for compatibility but use parallel single extractions for better speed
export async function extractFinancialDataBatch(files: File[], highPrecision = false): Promise<FinancialData[]> {
  return Promise.all(files.map(f => extractFinancialData(f, highPrecision)));
}

function sanitizeFinancialData(data: any): FinancialData {
  const defaultIncomeStatement: FinancialData['incomeStatement'] = {
    revenues: 0,
    costOfGoodsSold: 0,
    depreciation1: 0,
    grossProfit: 0,
    depreciation2: 0,
    sgaExpense: 0,
    provisions1: 0,
    rd: 0,
    goodwillAmortization: 0,
    otherAmortization: 0,
    netOperatingProfit: 0,
    grossInterestExpExist: 0,
    interestExpNew: 0,
    capitalizedInterest: 0,
    interestIncome: 0,
    dividendIncome: 0,
    provDoubtfulRec: 0,
    provisions2: 0,
    fxGL: 0,
    sundryIncomeExpense1: 0,
    netProfitBeforeTax: 0,
    totalTaxExpense: 0,
    currentTaxExpense: 0,
    deferredTaxExpense: 0,
    itc: 0,
    netProfitAfterTax: 0,
    minorityInterestExpense: 0,
    saleOfPlant: 0,
    sundryIncomeExpense2: 0,
    npaui: 0,
    prefShareDividends: 0,
    commonStockDividends: 0,
    otherAdjustment: 0,
    totalChange: 0,
  };

  const defaultBalanceSheet: FinancialData['balanceSheet'] = {
    cash: 0,
    marketableSecurities: 0,
    marketableSecExcess: 0,
    accountsReceivable: 0,
    lessAllowances: 0,
    netReceivables: 0,
    rawMaterials: 0,
    workInProgress: 0,
    finishedGoods: 0,
    goodsInTransit: 0,
    totalInventory: 0,
    advancePayments: 0,
    nonTradeRec: 0,
    otherCurrentAssets: 0,
    dueFromSisterCo1: 0,
    totalCurrentAssets: 0,
    land: 0,
    buildingImprovement: 0,
    machineryEquipment: 0,
    constInProgress: 0,
    grossPlant: 0,
    lessAccumulatedDep: 0,
    netPpe: 0,
    accountsReceivablesLt: 0,
    dueFromSisterCo2: 0,
    otherTangibleAsset: 0,
    deferredTaxAsset: 0,
    prepaids: 0,
    goodwill: 0,
    otherIntangibleAsset: 0,
    lessAccumAmortization: 0,
    netIntangibles: 0,
    totalAssets: 0,
    shortTermBorrowingExisting: 0,
    shortTermBorrowingNew: 0,
    cpSeniorDebtExisting: 0,
    cpSeniorDebtNew: 0,
    cpCapLease: 0,
    cpSubDebtExisting: 0,
    cpSalesTax: 0,
    accountsPayable: 0,
    taxesPayable: 0,
    accruedExpenses: 0,
    interestPayable: 0,
    dividendsPayable: 0,
    downPayments: 0,
    dueToSisterCo3: 0,
    otherCurrentLiability: 0,
    totCurrentLiabilities: 0,
    ltLeaseObligation: 0,
    ltSeniorDebtExisting: 0,
    ltSeniorDebtNew: 0,
    ltTaxes: 0,
    ltSharholderLoan: 0,
    totalLongTermDebt: 0,
    otherNonCurrentLiab: 0,
    totalLiabilities: 0,
    deferredTaxes: 0,
    minorityInterest: 0,
    provisions3: 0,
    totalGreyArea: 0,
    preferredStock: 0,
    commonStock: 0,
    additionalPaidInCapital: 0,
    retainedEarningsOpening: 0,
    plusNetIncome: 0,
    lessDividends: 0,
    otherAdjustments: 0,
    retainedEarningsClosing: 0,
    ownersAccount: 0,
    fxAdjustment: 0,
    legalReserve: 0,
    totalEquity: 0,
    totalLiabsAndEquity: 0,
  };

  return {
    companyName: data.companyName || "",
    year: data.year || 0,
    incomeStatement: {
      ...defaultIncomeStatement,
      ...(data.incomeStatement || {}),
    },
    balanceSheet: {
      ...defaultBalanceSheet,
      ...(data.balanceSheet || {}),
    },
    notes: data.notes || {},
  };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
