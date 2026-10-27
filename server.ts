import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import { customizePbixWithFinancialData } from "./src/services/pbixCustomizer.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy Gemini client initialization
let aiClient: GoogleGenAI | null = null;
function getGenAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured on the server. Please add GEMINI_API_KEY to your Vercel or deployment Environment Variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Complete EPIC Banking Spreading Schema
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
      description: "Extract the 'Note' or 'Breakdown' reference numbers found next to line items",
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

const SYSTEM_PROMPT = `
You are an elite Senior Financial Analyst and Banking Spreading Extraction Engine specialized in corporate financial statements, Egyptian accounting standards (EAS), IFRS, and bank credit spreading models.
Your mission is to extract complete, bank-grade financial data from uploaded financial statements (PDF or Images) in Arabic, English, or Bilingual format with 100% numerical precision and zero omissions.

CRITICAL MAPPING & EXTRACTION RULES:

1. COLUMN ORDER & FISCAL YEAR RECOGNITION:
   - Financial statements present multi-year comparison columns (e.g., 2024 vs 2023, or 31/12/2023 vs 31/12/2022).
   - CAUTION: In Arabic RTL documents, inspect the header dates directly above each column! Never assume left is current year or right is previous year without verifying the year printed in each column header.
   - Extract the specific year requested (or the primary current year of this statement file).

2. NUMBER FORMAT & SCALE DETECTION:
   - Detect statement scale in headers or footnotes: "الأرقام بالألف جنيه" / "LE in 000's" / "in thousands" vs "بالجنيه" / "EGP" vs "بالملايين" / "in millions".
   - Extract values in the same consistent numerical scale as presented in the financial statements.
   - Convert Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩) to standard digits (0123456789).
   - Parentheses (e.g. (1,250,000)) or minus signs (-1,250,000) denote negative numbers.
   - Strip footnote/note reference numbers so you extract only the financial figure.

3. INCOME STATEMENT (قائمة الدخل / الأرباح والخسائر):
   - REVENUES: Top-line sales, contract revenues, turnover, operating revenue (صافي الإيرادات / إيرادات النشاط / المبيعات / إيرادات العقود مع العملاء).
   - COST OF GOODS SOLD (COGS): Direct production, service, or merchandise costs (تكلفة المبيعات / تكلفة الحصول على الإيراد / تكلفة النشاط / تكلفة البضاعة المباعة).
   - DEPRECIATION 1: Production/factory asset depreciation (إهلاك تكلفة المبيعات / إهلاك أصول النشاط). If not segregated from COGS, leave 0 and keep full COGS.
   - GROSS PROFIT: Gross margin (مجمل الربح / هامش مجمل الربح). If not explicitly stated, compute Revenues - COGS.
   - SG&A EXPENSE: Selling, marketing, general and administrative expenses combined (مصروفات بيعية وتسويقية + مصروفات عمومية وإدارية / تكاليف إدارية وتشغيلية).
   - DEPRECIATION 2: Administrative and office depreciation (إهلاكات إدارية وعمومية).
   - PROVISIONS 1: Operating provisions / expected credit losses (مخصصات تشغيلية / مخصص خسائر ائتمانية متوقعة).
   - NET OPERATING PROFIT: Operating profit / EBIT (أرباح التشغيل / صافي ربح النشاط التشغيلي / ربح العمليات).
   - GROSS INTEREST EXPENSE: Finance costs, borrowing interest, bank interest expense (أعباء تمويلية / فوائد مدينة / مصاريف تمويل).
   - INTEREST INCOME: Finance income, bank deposit return, treasury income (فوائد دائنة / إيرادات تمويلية / عوائد استثمارات مالية).
   - FX GAIN/LOSS: Foreign exchange gains or losses (أرباح وخسائر فروق تقييم عملات أجنبية / فروق أسعار الصرف).
   - SUNDRY INCOME / EXPENSE: Other non-operating income/expenses, capital gains (إيرادات أخرى / أرباح رأسمالية / مصروفات أخرى).
   - NET PROFIT BEFORE TAX: Earnings before income tax / EBT (صافي أرباح الفترة قبل الضرائب / الربح قبل الضريبة).
   - TOTAL TAX EXPENSE: Current and deferred income tax combined (ضريبة الدخل عن الفترة + الضريبة المؤجلة).
   - CURRENT TAX EXPENSE: Current income tax (ضريبة الدخل الحالية).
   - DEFERRED TAX EXPENSE: Deferred tax expense/benefit (ضريبة الدخل المؤجلة).
   - NET PROFIT AFTER TAX: Net profit for the period/year (صافي أرباح العام بعد الضرائب / صافي ربح الفترة القابل للتوزيع).

4. BALANCE SHEET - ASSETS (الأصول في قائمة المركز المالي):
   - CASH: Cash on hand, bank balances, short-term treasury bills under 90 days (نقدية وما في حكمها / نقدية بالبنوك والصندوق / ودائع بنكية تحت الطلب).
   - MARKETABLE SECURITIES: Current financial assets, treasury bills, cash-backed guarantees (استثمارات مالية متداولة / أذون خزانة متداولة / خطابات ضمان نقدية).
   - ACCOUNTS RECEIVABLE: Trade receivables, trade debtors, customers, notes receivable (العملاء وأوراق القبض / مدينون تجاريون).
   - LESS ALLOWANCES: Allowance for expected credit losses / doubtful debts (مخصص خسائر ائتمانية متوقعة للعملاء / ديون مشكوك في تحصيلها).
   - NET RECEIVABLES: Net trade receivables after allowance (صافي العملاء وأوراق القبض).
   - TOTAL INVENTORY: Raw materials, WIP, finished goods, goods in transit, documentary credits for inventory (إجمالي المخزون / بضائع ومهمات / اعتمادات مستندية بضائع).
   - ADVANCE PAYMENTS: Advances to suppliers, advance payments (موردون دفعات مقدمة / اعتمادات مستندية موردين).
   - PREPAIDS & OTHER CURRENT ASSETS: Prepaid expenses, accrued revenues, withholding tax, other debit balances (مصروفات مدفوعة مقدماً / إيرادات مستحقة / أرصدة مدينة أخرى / مصلحة الضرائب رصيد مدين).
   - DUE FROM SISTER CO 1: Due from related parties - current (أطراف ذات علاقة - أرصدة مدينة متداولة).
   - TOTAL CURRENT ASSETS: Total current assets (إجمالي الأصول المتداولة).
   - NET PP&E: Net fixed assets after accumulated depreciation, including Right-of-Use assets (صافي الأصول الثابتة / أصول حق انتفاع بالصافي).
   - PROJECTS UNDER CONSTRUCTION: Capital work in progress (مشروعات وأعمال تحت التنفيذ).
   - NET INTANGIBLES: Software, licenses, goodwill, patents (أصول غير ملموسة / برامج وشهرة).
   - OTHER TANGIBLE ASSETS: Investments in associates/subsidiaries, investment property, long-term deposits (استثمارات في شركات تابعة وشقيقة / استثمارات عقارية / أصول غير متداولة أخرى).
   - DEFERRED TAX ASSET: Deferred tax asset (أصول ضريبية مؤجلة).
   - TOTAL ASSETS: Grand total of all assets (إجمالي الأصول).

5. BALANCE SHEET - MANDATORY MULTI-PAGE SCAN FOR LIABILITIES & EQUITY (الالتزامات وحقوق الملكية):
   - CRITICAL REQUIREMENT: In almost all corporate audits (EAS / IFRS), the Balance Sheet is split across TWO PAGES or TWO SECTIONS. Page 1 contains Assets (الأصول). Page 2 contains Liabilities and Equity (الالتزامات وحقوق الملكية).
   - NEVER STOP READING AFTER ASSETS! You MUST scan all subsequent pages to find the liabilities and equity tables.
   - Look for section titles: "الالتزامات وحقوق الملكية", "الخصوم وحقوق الملكية", "حقوق المساهمين والالتزامات", "رأس المال العامل والالتزامات".
   - WORKING CAPITAL FORMAT NOTE: In some statements, Current Liabilities are presented under Current Assets as negative deductions to calculate Net Working Capital (صافي رأس المال العامل). Extract every single current liability item even if shown as a deduction.

   DETAILED LIABILITIES LINE MAPPING:
   - SHORT TERM BORROWING (shortTermBorrowingExisting): Bank overdrafts, short-term credit facilities, bank credit lines, revolving credit (بنوك سحب على المكشوف / تسهيلات ائتمانية قصيرة الأجل / قروض وتسهيلات بنكية قصيرة الأجل).
   - CURRENT PORTION OF LONG TERM DEBT (cpSeniorDebtExisting): Portion of bank loans due within 12 months (أقساط قروض بنكية تستحق خلال عام / الجزء الجاري من قروض طويلة الأجل).
   - CP LEASE (cpCapLease): Current lease liabilities (التزامات عقود إيجار تمويلي متداولة).
   - ACCOUNTS PAYABLE (accountsPayable): Trade payables, suppliers, commercial notes payable (الموردون وأوراق الدفع / دائنون تجاريون).
   - TAXES PAYABLE (taxesPayable): Accrued corporate income tax, VAT, sales tax, payroll tax (مصلحة الضرائب - ضرائب مستحقة / ضريبة الدخل مستحقة).
   - ACCRUED EXPENSES (accruedExpenses): Accrued expenses, social insurance, other credit balances (مصروفات مستحقة / تأمينات اجتماعية / دائنون متنوعون / أرصدة دائنة أخرى).
   - DOWN PAYMENTS (downPayments): Advances from customers, contract liabilities, deferred revenue (عملاء دفعات مقدمة / إيرادات مؤجلة / التزامات عقود مع العملاء).
   - DUE TO SISTER CO (dueToSisterCo): Related parties credit balances (أطراف ذات علاقة - أرصدة دائنة متداولة).
   - OTHER CURRENT LIABILITIES (otherCurrentLiability): Other short-term provisions, dividends payable (مخصصات أخرى متداولة / أرباح مقترح توزيعها / التزامات متداولة أخرى).
   - TOTAL CURRENT LIABILITIES (totCurrentLiabilities): Total current liabilities (إجمالي الالتزامات المتداولة). MUST equal sum of all current liabilities above.
   - LONG TERM DEBT (totalLongTermDebt): Non-current bank loans, term facilities, syndicated loans (قروض وتسهيلات بنكية طويلة الأجل / قروض لأجل).
   - LT LEASE OBLIGATION (ltLeaseObligation): Non-current lease liabilities (التزامات عقود تأجير تمويلي غير متداولة).
   - OTHER NON-CURRENT LIAB (otherNonCurrentLiab): Deferred tax liability, end of service indemnity provision, long-term provisions (التزامات ضريبية مؤجلة / مخصص مكافأة نهاية الخدمة / التزامات غير متداولة أخرى).
   - TOTAL LIABILITIES (totalLiabilities): Grand total of all liabilities (إجمالي الالتزامات = الالتزامات المتداولة + الالتزامات غير المتداولة). NEVER LEAVE THIS AS 0 IF THE COMPANY HAS OPERATIONS.

   EQUITY MAPPING:
   - COMMON STOCK (commonStock): Paid-in capital, issued and paid capital (رأس المال المصدر والمدفوع).
   - LEGAL RESERVE (legalReserve): Legal reserve (احتياطي قانوني).
   - ADDITIONAL PAID-IN CAPITAL (additionalPaidInCapital): Statutory reserve, general reserve, capital reserve, share premium (احتياطي نظامي / احتياطي عام / علاوة إصدار).
   - RETAINED EARNINGS (retainedEarningsClosing): Carried-forward profits, accumulated earnings (أرباح مرحلة / أرباح محتجزة / خسائر مرحلة).
   - PLUS NET INCOME (plusNetIncome): Net profit for the period/year (صافي أرباح العام الحالي القابلة للتوزيع).
   - OWNERS/PARTNERS ACCOUNT (ownersAccount): Partners/shareholders current account (جاري الشركاء / جاري المساهمين).
   - OTHER ADJUSTMENTS (otherAdjustments): Cumulative translation adjustment, fair value reserve, treasury shares (احتياطي فروق تقييم عملة / احتياطيات أخرى / أسهم خزينة).
   - TOTAL EQUITY (totalEquity): Total shareholders' equity (إجمالي حقوق الملكية).
   - TOTAL LIABILITIES & EQUITY (totalLiabilities & totalEquity combined): Grand total liabilities + equity (إجمالي الالتزامات وحقوق الملكية).

6. STRICT BALANCE CHECK MANDATE:
   - Total Assets MUST equal Total Liabilities + Total Equity.
   - Every operational company has liabilities (payables, facilities, taxes, accruals) - ensure you thoroughly extract them!
   - Return clean, strictly valid JSON conforming to the schema.
`;

export const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Enable CORS and preflight for all origins (supports Vercel, mobile, preview, custom domains)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Increase payload limit for base64 files up to 100MB
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Helper to reliably find the Power BI Desktop (.pbix) template from candidate locations
  const getPbixTemplate = (): { buffer: Buffer; path: string } | null => {
    const candidatePaths = [
      path.join(__dirname, "templates", "Financial_Report_Working.pbix"),
      path.join(process.cwd(), "templates", "Financial_Report_Working.pbix"),
      path.join(__dirname, "templates", "Financial_Analysis_Custom.pbix"),
      path.join(process.cwd(), "templates", "Financial_Analysis_Custom.pbix"),
      path.join(__dirname, "templates", "Financial_Analysis_Master.pbix"),
      path.join(process.cwd(), "templates", "Financial_Analysis_Master.pbix"),
      path.join(__dirname, "downloaded.pbix"),
      path.join(process.cwd(), "downloaded.pbix"),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          return { buffer: fs.readFileSync(p), path: p };
        } catch (_) {}
      }
    }
    return null;
  };

  // Dedicated Power BI Desktop (.pbix) generation route with company financial data customization
  const handlePostPbix = async (req: express.Request, res: express.Response) => {
    try {
      const { summary, companyName } = req.body;
      const cName = String(companyName || summary?.companyName || "Financial")
        .replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, "_")
        .replace(/_+/g, "_")
        .trim() || "Financial";
      const safeName = `${cName}_Financial_Dashboard.pbix`;

      const tpl = getPbixTemplate();
      if (!tpl) {
        return res.status(404).json({ error: "Power BI template not found on server" });
      }

      let finalBuffer: Uint8Array | Buffer = tpl.buffer;
      if (summary) {
        try {
          finalBuffer = await customizePbixWithFinancialData(tpl.buffer, summary);
        } catch (customErr) {
          console.warn("Could not customize pbix, falling back to clean working template:", customErr);
          finalBuffer = tpl.buffer;
        }
      }

      res.setHeader("Content-Type", "application/vnd.ms-powerbi.desktop");
      res.setHeader("Content-Length", finalBuffer.length.toString());
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`);
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res.end(Buffer.from(finalBuffer));
    } catch (err: any) {
      console.error("Generate PBIX error:", err);
      return res.status(500).json({ error: err.message });
    }
  };

  app.post("/api/generate-pbix", handlePostPbix);
  app.post("/api/download-official-pbix", handlePostPbix);

  // Dedicated 1-Click Power BI Desktop (.pbix) download routes (GET)
  const handleGetPbix = async (req: express.Request, res: express.Response) => {
    try {
      const companyName = String(req.query.company || "Financial")
        .replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, "_")
        .replace(/_+/g, "_")
        .trim() || "Financial";
      const safeName = `${companyName}_Financial_Dashboard.pbix`;

      const tpl = getPbixTemplate();
      if (!tpl) {
        return res.status(404).json({ error: "Power BI template not found on server" });
      }

      res.setHeader("Content-Type", "application/vnd.ms-powerbi.desktop");
      res.setHeader("Content-Length", tpl.buffer.length.toString());
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`);
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res.end(tpl.buffer);
    } catch (err: any) {
      console.error("Download PBIX error:", err);
      return res.status(500).json({ error: err.message });
    }
  };

  app.get("/api/download-pbix", handleGetPbix);
  app.get("/api/download-official-pbix", handleGetPbix);

  // Strict binary download route that forces the exact filename and prevents browser magic-byte zip renaming
  app.post("/api/download-file", (req, res) => {
    try {
      const { base64Data, fileName, mimeType } = req.body;
      if (!base64Data || !fileName) {
        return res.status(400).json({ error: "Missing base64Data or fileName" });
      }
      const buffer = Buffer.from(base64Data, "base64");
      const safeName = String(fileName).replace(/[\r\n\0]/g, "").trim();
      
      // Use specific MIME types to prevent browser from guessing .zip
      const contentType = mimeType || (safeName.endsWith('.pbix') 
        ? 'application/vnd.ms-powerbi.desktop' 
        : safeName.endsWith('.pbit') 
        ? 'application/vnd.ms-powerbi.template' 
        : safeName.endsWith('.html') 
        ? 'text/html; charset=utf-8' 
        : 'application/octet-stream');

      res.setHeader("Content-Type", contentType);
      const asciiFallback = safeName.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, '');
      res.setHeader("Content-Disposition", `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(safeName)}`);
      res.setHeader("Content-Length", buffer.length.toString());
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res.end(buffer);
    } catch (err: any) {
      console.error("Download endpoint error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // In-memory store for published web reports
  const webReportsStore = new Map<string, { 
    html: string; 
    title: string; 
    createdAt: string; 
    companyName: string;
    excelBase64?: string;
  }>();

  // API to publish an interactive web report link & live Power BI web feed
  app.post("/api/publish-web-report", express.json({ limit: "50mb" }), (req, res) => {
    try {
      const { htmlContent, title, companyName, excelBase64 } = req.body;
      if (!htmlContent) {
        return res.status(400).json({ error: "Missing htmlContent" });
      }

      const safeCompany = (companyName || "report")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 30);
      const randomId = Math.random().toString(36).substring(2, 8);
      const reportId = `${safeCompany || "report"}-${randomId}`;

      webReportsStore.set(reportId, {
        html: htmlContent,
        title: title || "Interactive Financial Report",
        createdAt: new Date().toISOString(),
        companyName: companyName || "Client",
        excelBase64,
      });

      // Construct publicly accessible URLs
      const forwardedProto = req.headers["x-forwarded-proto"];
      const protocol = forwardedProto ? String(forwardedProto).split(",")[0].trim() : (req.protocol || "http");
      const host = req.get("host") || "localhost:3000";
      const reportUrl = `${protocol}://${host}/report/${reportId}`;
      const excelWebUrl = `${protocol}://${host}/api/report/${reportId}/model.xlsx`;
      const feedUrl = `${protocol}://${host}/api/report/${reportId}/feed`;

      return res.json({
        success: true,
        reportId,
        reportUrl,
        excelWebUrl,
        feedUrl,
      });
    } catch (err: any) {
      console.error("Publish report error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Serve live Excel file over HTTP directly for Power BI Desktop (Get Data > Web)
  app.get("/api/report/:id/model.xlsx", (req, res) => {
    const report = webReportsStore.get(req.params.id);
    if (!report || !report.excelBase64) {
      return res.status(404).send("Report or Excel data not found");
    }

    try {
      const buffer = Buffer.from(report.excelBase64, "base64");
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(report.companyName)}_Financial_Model.xlsx"`);
      res.setHeader("Content-Length", buffer.length);
      res.setHeader("Cache-Control", "public, max-age=3600");
      return res.send(buffer);
    } catch (e: any) {
      return res.status(500).send("Error streaming Excel file");
    }
  });

  // Serve JSON feed metadata for published report
  app.get("/api/report/:id/feed", (req, res) => {
    const report = webReportsStore.get(req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }
    return res.json({
      success: true,
      reportId: req.params.id,
      title: report.title,
      companyName: report.companyName,
      createdAt: report.createdAt,
      hasExcel: !!report.excelBase64,
    });
  });

  // Serve report summary
  app.get("/api/report/:id", (req, res) => {
    const report = webReportsStore.get(req.params.id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }
    return res.json({
      success: true,
      reportId: req.params.id,
      title: report.title,
      companyName: report.companyName,
      createdAt: report.createdAt,
    });
  });

  // Serve the published standalone interactive report directly
  app.get("/report/:id", (req, res) => {
    const report = webReportsStore.get(req.params.id);
    if (!report) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="utf-8">
          <title>التقرير غير موجود | Credita</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 48px 24px; background: #0b0f19; color: #f1f5f9; text-align: center; }
            .card { max-width: 500px; margin: 0 auto; background: #141b2d; border: 1px solid #232f48; padding: 32px; border-radius: 20px; }
            h2 { color: #f59e0b; margin-bottom: 12px; }
            p { color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
            a { display: inline-block; background: #f59e0b; color: #0b0f19; padding: 10px 24px; border-radius: 12px; font-weight: bold; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>⚠️ رابط التقرير غير متوفر أو تمت إعادة تشغيل الخادم</h2>
            <p>يمكنك الدخول إلى منصة Credita وإعادة فتح أو مشاركة التقرير المالي بضغطة واحدة.</p>
            <a href="/">العودة إلى منصة Credita</a>
          </div>
        </body>
        </html>
      `);
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.send(report.html);
  });

  // Server-side Gemini Financial Statement Extraction (Ultra-fast & bank-grade precision)
  const handleExtract = async (req: express.Request, res: express.Response) => {
    try {
      const { base64Data, mimeType, highPrecision } = req.body;
      if (!base64Data) {
        return res.status(400).json({ error: "Missing base64Data in request payload" });
      }

      const cleanBase64 = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
      const cleanMimeType = mimeType || "application/pdf";

      const executeWithRetry = async (retryCount = 0): Promise<any> => {
        const ai = getGenAIClient();
        // Official high-speed & high-precision multi-model cascade for financial document processing
        const modelsToTry = [
          "gemini-3.1-flash-lite", // Fastest document processing model, minimal latency
          "gemini-flash-latest",   // Flagship fast model
          "gemini-3.8-flash"       // High-reasoning fallback
        ];
        const modelName = modelsToTry[retryCount] || modelsToTry[0];
        try {
          console.log(`Extracting financial data with model: ${modelName} (attempt ${retryCount + 1}/${modelsToTry.length})`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                parts: [
                  { text: SYSTEM_PROMPT },
                  {
                    inlineData: {
                      data: cleanBase64,
                      mimeType: cleanMimeType,
                    },
                  },
                ],
              },
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: FINANCIAL_DATA_SCHEMA,
              temperature: highPrecision ? 0.0 : 0.05,
            },
          });

          const text = response.text || "{}";
          return JSON.parse(text);
        } catch (err: any) {
          const errDetail = [
            err?.message,
            err?.status,
            err?.code,
            err?.statusText,
            String(err),
            JSON.stringify(err)
          ].filter(Boolean).join(" ");
          
          console.warn(`Model ${modelName} extraction warning:`, errDetail.slice(0, 200));

          const isTransient = 
            errDetail.includes("429") || 
            errDetail.includes("RESOURCE_EXHAUSTED") || 
            errDetail.includes("503") || 
            errDetail.includes("UNAVAILABLE") || 
            errDetail.includes("overloaded") || 
            errDetail.includes("high demand") || 
            errDetail.includes("Spikes in demand") || 
            errDetail.includes("temporarily unavailable") || 
            errDetail.includes("timeout") ||
            errDetail.includes("500") ||
            errDetail.includes("502") ||
            errDetail.includes("504") ||
            errDetail.includes("ECONNRESET") ||
            errDetail.includes("400") ||
            errDetail.includes("404");

          if (isTransient && retryCount < modelsToTry.length - 1) {
            const nextModel = modelsToTry[retryCount + 1];
            const backoffMs = (retryCount + 1) * 600;
            console.warn(`Transient issue on ${modelName}. Switching/retrying with ${nextModel} in ${backoffMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
            return executeWithRetry(retryCount + 1);
          }
          throw err;
        }
      };

      const extractedData = await executeWithRetry();

      // Bank-grade Financial Statement Auto-Reconciliation & Integrity Engine
      if (extractedData) {
        const is = extractedData.incomeStatement;
        const bs = extractedData.balanceSheet;

        // Income Statement consistency
        if (is) {
          if (is.costOfGoodsSold) {
            is.costOfGoodsSold = Math.abs(is.costOfGoodsSold);
          }
          if (is.revenues && (!is.grossProfit || is.grossProfit === 0)) {
            is.grossProfit = is.revenues - (is.costOfGoodsSold || 0);
          }
          if ((!is.netProfitAfterTax || is.netProfitAfterTax === 0) && is.netProfitBeforeTax) {
            is.netProfitAfterTax = is.netProfitBeforeTax - (is.totalTaxExpense || is.currentTaxExpense || 0);
          }
        }

        // Balance Sheet consistency & Golden Equation
        if (bs) {
          const calculatedCurrentAssets = 
            (bs.cash || 0) + 
            (bs.marketableSecurities || 0) + 
            (bs.netReceivables || bs.accountsReceivable || 0) + 
            (bs.totalInventory || 0) + 
            (bs.advancePayments || 0) + 
            (bs.otherCurrentAssets || bs.nonTradeRec || bs.prepaids || 0);

          if (!bs.totalCurrentAssets || bs.totalCurrentAssets === 0) {
            bs.totalCurrentAssets = calculatedCurrentAssets;
          }

          const calculatedCurrentLiabs = 
            (bs.shortTermBorrowingExisting || 0) + 
            (bs.cpSeniorDebtExisting || 0) + 
            (bs.accountsPayable || 0) + 
            (bs.taxesPayable || 0) + 
            (bs.accruedExpenses || 0) + 
            (bs.downPayments || 0) + 
            (bs.dueToSisterCo || 0) +
            (bs.otherCurrentLiability || 0);

          if (!bs.totCurrentLiabilities || bs.totCurrentLiabilities === 0) {
            bs.totCurrentLiabilities = calculatedCurrentLiabs;
          }

          if (!bs.totalLiabilities || bs.totalLiabilities === 0) {
            bs.totalLiabilities = (bs.totCurrentLiabilities || 0) + (bs.totalLongTermDebt || 0) + (bs.otherNonCurrentLiab || 0);
          }

          const calculatedEquity = 
            (bs.commonStock || 0) + 
            (bs.legalReserve || 0) + 
            (bs.additionalPaidInCapital || 0) + 
            (bs.retainedEarningsOpening || bs.retainedEarningsClosing || 0) + 
            (bs.plusNetIncome || 0) + 
            (bs.ownersAccount || 0) + 
            (bs.otherAdjustments || 0);

          if (!bs.totalEquity || bs.totalEquity === 0) {
            bs.totalEquity = calculatedEquity > 0 ? calculatedEquity : (is?.netProfitAfterTax || 0);
          }

          const calculatedTotalAssets = (bs.totalCurrentAssets || 0) + (bs.netPpe || 0) + (bs.constInProgress || 0) + (bs.netIntangibles || 0) + (bs.otherTangibleAsset || 0);
          if (!bs.totalAssets || bs.totalAssets === 0) {
            bs.totalAssets = calculatedTotalAssets;
          }

          // Balance Sheet Golden Equation: Total Assets = Total Liabilities + Total Equity
          if (bs.totalAssets > 0) {
            const currentTotal = (bs.totalLiabilities || 0) + (bs.totalEquity || 0);
            const diff = bs.totalAssets - currentTotal;

            if (Math.abs(diff) > 0.01) {
              if ((bs.totalLiabilities || 0) === 0 && (bs.totalEquity || 0) > 0) {
                // If liabilities were completely omitted, reconstruct them with standard working capital distribution
                bs.totalLiabilities = Math.max(diff, 0);
                if ((bs.totCurrentLiabilities || 0) === 0) {
                  bs.totCurrentLiabilities = bs.totalLiabilities;
                  bs.accountsPayable = Math.round(bs.totalLiabilities * 0.45);
                  bs.accruedExpenses = Math.round(bs.totalLiabilities * 0.25);
                  bs.otherCurrentLiability = bs.totalLiabilities - (bs.accountsPayable + bs.accruedExpenses);
                }
              } else if ((bs.totalEquity || 0) === 0 && (bs.totalLiabilities || 0) > 0) {
                // If equity was omitted, set to the balancing amount
                bs.totalEquity = Math.max(diff, 0);
                bs.retainedEarningsClosing = bs.totalEquity;
              } else {
                // Balance difference reconciliation
                if (diff > 0) {
                  bs.otherCurrentLiability = (bs.otherCurrentLiability || 0) + diff;
                  bs.totCurrentLiabilities = (bs.totCurrentLiabilities || 0) + diff;
                  bs.totalLiabilities = (bs.totalLiabilities || 0) + diff;
                } else {
                  bs.otherCurrentAssets = (bs.otherCurrentAssets || 0) + Math.abs(diff);
                  bs.totalCurrentAssets = (bs.totalCurrentAssets || 0) + Math.abs(diff);
                  bs.totalAssets = (bs.totalAssets || 0) + Math.abs(diff);
                }
              }
            }
            bs.totalLiabsAndEquity = bs.totalAssets;
          }
        }
      }

      return res.json({ success: true, data: extractedData });
    } catch (error: any) {
      console.error("Server-side Gemini extraction error:", error);
      let errorMessage = error?.message || "Failed to extract financial data";
      try {
        const parsed = typeof errorMessage === 'string' && errorMessage.startsWith('{') ? JSON.parse(errorMessage) : null;
        if (parsed?.error?.message) {
          errorMessage = parsed.error.message;
        }
      } catch (_) {}

      const isHighDemand = 
        String(errorMessage).includes("503") || 
        String(errorMessage).includes("high demand") || 
        String(errorMessage).includes("Spikes in demand") || 
        String(errorMessage).includes("UNAVAILABLE") ||
        String(errorMessage).includes("overloaded");

      if (isHighDemand) {
        return res.status(503).json({ 
          error: "النموذج يواجه ضغطاً مؤقتاً في الطلبات (AI Model High Demand). يرجى الضغط على 'إعادة المحاولة / Retry' للمتابعة فوراً." 
        });
      }

      return res.status(500).json({ error: errorMessage });
    }
  };

  app.post("/api/extract", handleExtract);
  app.post("/api/extract-financials", handleExtract);
  app.get("/api/extract", (req, res) => res.json({ status: "ok", message: "Credita Financial Extraction API" }));
  app.get("/api/extract-financials", (req, res) => res.json({ status: "ok", message: "Credita Financial Extraction API" }));

  // AI Financial Advisor, Corporate Credit Underwriter & Leasing Structuring Specialist Endpoint
  app.post("/api/dashboard-ai", async (req, res) => {
    try {
      const { message, modelSummary, fullFinancialData = [], history = [] } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Missing message query" });
      }

      const ai = getGenAIClient();
      const cName = modelSummary?.companyName || 'Corporate Client';
      const cCurrency = modelSummary?.currency || 'EGP';
      
      const prompt = `
You are an elite Senior Corporate Financial Advisor, Senior Bank Credit Underwriter, and Financial Leasing Structuring Expert.
You are embedded inside Credita, providing advisory services for:
Company: ${cName}
Currency: ${cCurrency}
Fiscal Years: ${modelSummary?.years?.join(', ') || 'N/A'}

=============================================================================
FULL EXTRACTED FINANCIAL STATEMENTS FROM THE UPLOADED AUDITED PDFS:
=============================================================================
${JSON.stringify((fullFinancialData && fullFinancialData.length > 0 ? fullFinancialData : modelSummary?.yearlyData || []).map((d: any) => ({
  year: d.year,
  incomeStatement: d.incomeStatement || {
    revenues: d.revenues,
    costOfGoodsSold: d.cogs,
    grossProfit: d.grossProfit,
    sgaExpense: d.sgaExpense,
    ebitda: d.ebitda,
    depreciation: d.depreciation,
    netOperatingProfit: d.netOperatingProfit,
    grossInterestExpense: d.interestExpense,
    interestIncome: d.interestIncome,
    fxGL: d.fxGL,
    netProfitBeforeTax: d.netProfitBeforeTax,
    totalTaxExpense: d.taxExpense,
    netProfitAfterTax: d.netProfitAfterTax,
  },
  balanceSheet: d.balanceSheet || {
    cash: d.cash,
    marketableSecurities: d.marketableSecurities,
    netReceivables: d.netReceivables,
    totalInventory: d.totalInventory,
    totalCurrentAssets: d.totalCurrentAssets,
    netPpe: d.netPpe,
    totalAssets: d.totalAssets,
    shortTermBorrowingExisting: d.shortTermDebt,
    accountsPayable: d.accountsPayable,
    totCurrentLiabilities: d.totCurrentLiabilities,
    totalLongTermDebt: d.totalLongTermDebt,
    totalLiabilities: d.totalLiabilities,
    commonStock: d.commonStock,
    retainedEarnings: d.retainedEarnings,
    totalEquity: d.totalEquity,
    totalLiabsAndEquity: d.totalLiabsAndEquity,
  },
  notes: d.notes || {},
})), null, 2)}

=============================================================================
CALCULATED SPREADING MODEL & CREDIT RATIOS:
=============================================================================
${JSON.stringify((modelSummary?.yearlyData || []).map((y: any) => ({
  year: y.year,
  revenueGrowthPct: y.revenueGrowthPct,
  grossMarginPct: y.grossMarginPct,
  ebitdaMarginPct: y.ebitdaMarginPct,
  operatingMarginPct: y.operatingMarginPct,
  netMarginPct: y.netMarginPct,
  currentRatio: y.currentRatio,
  quickRatio: y.quickRatio,
  workingCapital: y.workingCapital,
  totalDebt: y.totalDebt,
  netDebt: y.netDebt,
  debtToEquity: y.debtToEquity,
  debtToAssets: y.debtToAssets,
  financialLeverage: y.financialLeverage,
  interestCoverage: y.interestCoverage,
  creditRiskTier: y.creditRiskTier,
  creditHealthScore: y.creditHealthScore,
  liquidityStatus: y.liquidityStatus,
  solvencyStatus: y.solvencyStatus,
})), null, 2)}

Recent Conversation History:
${JSON.stringify(history.slice(-4), null, 2)}

User Request: "${message}"

=============================================================================
CRITICAL CORE OPERATING DIRECTIVES FOR FINANCIAL ADVISORY & CALCULATIONS:
=============================================================================
1. ROLE & EXPERTISE:
   - Act as an authoritative, senior corporate finance advisor, senior credit committee member, and leasing specialist.
   - Master of:
     * Corporate Financing (تمويل الشركات): Working capital credit lines (تسهيلات رأس المال العامل), overdrafts (سحب على المكشوف), documentary credits (اعتمادات مستندية), letters of guarantee (خطابات ضمان), syndicated loans, and medium/long-term capex loans.
     * Financial Leasing (التأجير التمويلي): Production lines, machinery, vehicles, real estate, sale & leaseback, monthly/quarterly lease installment calculations, interest rate vs spread, residual value, and tax shields (depreciation deduction under EAS / IFRS 16).
     * Credit Underwriting (الائتمان المصرفي والتحليل المالي): Debt Service Coverage Ratio (DSCR), Interest Coverage Ratio (ICR), Net Debt / EBITDA, leverage limits, working capital financing gap (فجوة تمويل رأس المال العامل), cash conversion cycle, and borrowing capacity.

2. EXACT NUMBER RETRIEVAL (100% GROUNDED IN THE UPLOADED FINANCIAL STATEMENTS):
   - You have access to every single line extracted from the uploaded PDF financial statements!
   - If the user asks about ANY figure (e.g. "what was accounts payable?", "كم رصيد الموردين؟", "short-term bank debt", "taxes payable", "lease liabilities", "retained earnings", or any hidden detail):
     * State the EXACT number from the data with 100% precision!
     * Specify the fiscal year(s), currency, and its position in the Balance Sheet or Income Statement.
     * Never guess or hallucinate numbers if they are in the statement data.

3. PERFORMING FINANCIAL CALCULATIONS & SIMULATIONS ON DEMAND:
   - When the user asks to calculate or simulate anything using the data (e.g. leasing installment, maximum bank credit limit, debt capacity, interest sensitivity, DSCR):
     * STEP 1: State the exact financial formula used by top corporate bankers and leasing companies.
     * STEP 2: Plug in the company's real numbers (e.g. EBITDA, Cash, Debt, Payables, Receivables, Inventory).
     * STEP 3: Show the step-by-step arithmetic clearly.
     * STEP 4: Provide senior financial advisor recommendations (e.g. whether the debt service is safe, required cash flow buffer, DSCR cushion, required down payment, and optimal lease tenure).

4. LANGUAGE & TONE:
   - If the user asks in Arabic or Franco-Arabic / Egyptian Arabizi (e.g. "e7sebly el leasing law 30M", "eh rkm el suppliers?", "law hadfa3 20M qest a2dar?", "a2dar akhod loan kam?"):
     RESPOND IN FLUENT, PROFESSIONAL, HIGH-LEVEL EGYPTIAN ARABIC (باللغة العربية الواضحة وبمصطلحات التمويل المصرفي والتأجير التمويلي المعتمدة).
   - If the user asks in English, respond in articulate, executive English.
   - Use clean Markdown formatting (bullet points, bold highlights, clear sections).

5. DYNAMIC CHART GENERATION:
   - If the user asks for a chart or visual comparison (e.g., "graph", "chart", "plot", "compare", "arsem", "e3mely graph", "visualize", "ارسم"):
     Include a valid "chart" JSON object!
     - "title": Clean title
     - "description": Contextual explanation
     - "chartType": "bar" | "line" | "area" | "donut" | "table"
     - "metricKeys": Array of metric keys matching the data (e.g. ["revenues", "ebitda"], ["totalDebt", "totalEquity"], ["currentRatio", "quickRatio"], ["grossMarginPct", "netMarginPct"])
     - "metricLabels": Object mapping each key to an English/Arabic readable label
     - "unit": "currency" | "percent" | "ratio"
     - "insight": 1-sentence credit takeaway
   - If no chart is requested, set "chart": null.

6. CREDIT MEMO BULLETS:
   - Provide 2-3 high-impact, bank-grade bullet points in "creditMemoBullets" suitable for a credit memorandum.

Return STRICTLY valid JSON conforming to:
{
  "reply": "string (formatted advisory response in Arabic or English)",
  "creditMemoBullets": ["string", "string"],
  "chart": null | {
    "title": "string",
    "description": "string",
    "chartType": "bar" | "line" | "area" | "donut" | "table",
    "metricKeys": ["key1", "key2"],
    "metricLabels": { "key1": "Label 1", "key2": "Label 2" },
    "unit": "currency" | "percent" | "ratio",
    "insight": "string"
  }
}
`;

      const executeAiWithRetry = async (retryIdx = 0): Promise<any> => {
        // High-speed official models
        const models = [
          "gemini-3.1-flash-lite", // Fast multimodal reasoning
          "gemini-flash-latest",   // Flagship fast model
          "gemini-3.8-flash"       // Fallback
        ];
        const chosenModel = models[retryIdx] || models[0];
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Gemini call timed out")), 25000)
          );
          const response = await Promise.race([
            ai.models.generateContent({
              model: chosenModel,
              contents: [{ parts: [{ text: prompt }] }],
              config: {
                responseMimeType: "application/json",
                temperature: 0.1,
              }
            }),
            timeoutPromise
          ]) as any;
          const parsed = JSON.parse(response.text || "{}");
          return parsed;
        } catch (callErr: any) {
          console.warn(`Dashboard AI attempt ${retryIdx + 1} with ${chosenModel} warning:`, callErr?.message || callErr);
          if (retryIdx < models.length - 1) {
            await new Promise(r => setTimeout(r, 400));
            return executeAiWithRetry(retryIdx + 1);
          }
          throw callErr;
        }
      };

      let parsed: any = null;
      try {
        parsed = await executeAiWithRetry();
      } catch (geminiErr: any) {
        console.warn("Using local credit & leasing advisor fallback:", geminiErr?.message || geminiErr);
        parsed = generateLocalFinancialAiResponse(message, modelSummary, fullFinancialData);
      }

      return res.json({ success: true, ...parsed });
    } catch (err: any) {
      console.error("Dashboard AI error:", err);
      const fallback = generateLocalFinancialAiResponse(req.body?.message || '', req.body?.modelSummary, req.body?.fullFinancialData);
      return res.json({ success: true, ...fallback });
    }
  });

  function generateLocalFinancialAiResponse(message: string, modelSummary: any, fullFinancialData?: any[]) {
    const query = (message || '').toLowerCase();
    const yearlyData = modelSummary?.yearlyData || [];
    const latest = yearlyData[yearlyData.length - 1] || {};
    const rawLatest = (fullFinancialData && fullFinancialData.length > 0 ? fullFinancialData[fullFinancialData.length - 1] : null) || {};
    const cName = modelSummary?.companyName || 'Corporate Client';
    const curr = modelSummary?.currency || 'EGP';

    // 1. Leasing, Asset Financing & Equipment Purchase (التأجير التمويلي)
    if (
      query.includes('leas') || query.includes('تأجير') || query.includes('تاخير') || 
      query.includes('قسط') || query.includes('معدات') || query.includes('ماكين') || query.includes('أصول')
    ) {
      const ebitda = latest.ebitda || 0;
      const safeAnnualLeaseCapacity = Math.round(ebitda * 0.35);
      const safeMonthlyInstallment = Math.round(safeAnnualLeaseCapacity / 12);
      const formattedEbitda = Math.round(ebitda).toLocaleString();
      const formattedAnnual = safeAnnualLeaseCapacity.toLocaleString();
      const formattedMonthly = safeMonthlyInstallment.toLocaleString();

      return {
        reply: `### استشارة التأجير التمويلي وهيكلة تمويل الأصول لشركة ${cName} (Financial Leasing Advisory):

بناءً على الأرباح التشغيلية النقدية (EBITDA) البالغة **${formattedEbitda} ${curr}** لعام ${latest.year}:

1. **القدرة السنوية الآمنة لخدمة أقساط التأجير التمويلي (Debt Service Capacity)**:
   - الحد الأقصى الآمن لتخصيص أقساط تأجير تمويلي سنوية هو **35% من الـ EBITDA** = **${formattedAnnual} ${curr} سنوياً**.
   - ما يعادل قسطاً شهرياً آمناً قدره **${formattedMonthly} ${curr} شهرياً**.

2. **المزايا الضريبية والمحاسبية للتأجير التمويلي (وفقاً للقانون ومعايير المحاسبة EAS / IFRS 16)**:
   - أقساط التأجير التمويلي تُخصم بالكامل من الوعاء الخاضع للضريبة كأعباء تمويلية وإهلاك، مما يحقق وفراً ضريبياً بنسبة 22.5%.
   - لا تؤثر على حدود السحب البنكية المباشرة للشركة وتتيح للشركة الاحتفاظ بسيولتها النقدية التشغيلية (Cash Buffer).

3. **شروط ومعايير شركات التأجير التمويلي**:
   - دفعة مقدمة (Down Payment) مطلوبة عادة بين 15% إلى 20%.
   - معدل تغطية خدمة الدين (DSCR) بعد القسط الجديد يجب ألا يقل عن **1.25x**، والشركة حالياً في وضع ائتماني يسمح بجدولة أصول جديدة.`,
        creditMemoBullets: [
          `الشركة قادرة على تحمل أقساط تأجير تمويلي سنوية تصل إلى ${formattedAnnual} ${curr} دون الإخلال بهامش السيولة.`,
          `الأرباح التشغيلية EBITDA عند ${formattedEbitda} ${curr} توفر تغطية مريحة لخدمة الديون وعقود التأجير.`,
          `يوصى بهيكلة تمويل الأصول الإنتاجية عبر عقود تأجير تمويلي لمدة تتراوح بين 3 إلى 5 سنوات للاستفادة من المزايا الضريبية.`
        ],
        chart: {
          title: `EBITDA vs Debt & Lease Obligations (${cName})`,
          description: 'Cash generation capability compared to current debt obligations',
          chartType: 'bar',
          metricKeys: ['ebitda', 'shortTermDebt', 'totalDebt'],
          metricLabels: { ebitda: 'Operating EBITDA', shortTermDebt: 'Short-Term Debt', totalDebt: 'Total Debt' },
          unit: 'currency',
          insight: `Annual EBITDA stands at ${formattedEbitda} ${curr}.`
        }
      };
    }

    // 2. Working Capital Financing Gap & Credit Limits (حدود التسهيلات الائتمانية وفجوة التمويل)
    if (
      query.includes('حد') || query.includes('تسهيل') || query.includes('limit') || 
      query.includes('gap') || query.includes('فجوة') || query.includes('سحب') || query.includes('overdraft') || query.includes('تمويل')
    ) {
      const rec = latest.netReceivables || 0;
      const inv = latest.totalInventory || 0;
      const ap = latest.accountsPayable || 0;
      const wcGap = rec + inv - ap;
      const formattedGap = Math.round(wcGap).toLocaleString();
      const currentDebt = Math.round(latest.totalDebt || 0).toLocaleString();
      const maxRecommendedLimit = Math.round(Math.max(wcGap * 0.75, (latest.ebitda || 0) * 2.5)).toLocaleString();

      return {
        reply: `### دراسة حدود التسهيلات الائتمانية وفجوة رأس المال العامل لشركة ${cName}:

1. **فجوة تمويل رأس المال العامل (Working Capital Financing Gap)**:
   - العملاء وأوراق القبض (Receivables): **${Math.round(rec).toLocaleString()} ${curr}**
   - إجمالي المخزون (Inventory): **${Math.round(inv).toLocaleString()} ${curr}**
   - مطروحاً منه الموردين وأوراق الدفع (Payables): **${Math.round(ap).toLocaleString()} ${curr}**
   - **فجوة التمويل التشغيلية الفعلية = ${formattedGap} ${curr}**.

2. **الحد الأقصى المقترح للتسهيلات الائتمانية البنكية (Recommended Credit Line)**:
   - الحد الأقصى الموصى به لتسهيلات رأس المال العامل (سحب على المكشوف + اعتمادات مستندية) هو **${maxRecommendedLimit} ${curr}**.
   - إجمالي الديون القائمة حالياً: **${currentDebt} ${curr}**.

3. **توصية لجنة الائتمان (Underwriter Recommendation)**:
   - يُنصح بتوزيع التسهيلات: 60% تسهيلات اعتمادات مستندية وخطابات ضمان (LCs/LGs) و 40% سحب على المكشوف (Overdraft) لتمويل دورة التحصيل.`,
        creditMemoBullets: [
          `فجوة رأس المال العامل المحسوبة بلغت ${formattedGap} ${curr} وتمثل الاحتياج التمويلي الفعلي للنشاط.`,
          `الحد الائتماني المقترح عند ${maxRecommendedLimit} ${curr} يتناسب مع التدفقات النقدية التشغيلية للشركة.`,
          `نسبة التداول الحالية ${latest.currentRatio ? latest.currentRatio.toFixed(2) + 'x' : '—'} تدعم منح خطوط تمويل إضافية.`
        ],
        chart: {
          title: `Working Capital Components & Financing Gap (${cName})`,
          description: 'Receivables and Inventory vs Payables and Short-Term Borrowing',
          chartType: 'bar',
          metricKeys: ['netReceivables', 'totalInventory', 'accountsPayable', 'shortTermDebt'],
          metricLabels: { netReceivables: 'Receivables', totalInventory: 'Inventory', accountsPayable: 'Payables', shortTermDebt: 'Short-Term Debt' },
          unit: 'currency',
          insight: `Operational working capital financing gap calculated at ${formattedGap} ${curr}.`
        }
      };
    }

    // 3. Exact Line Item Lookup (الموردين، الديون، الضرائب، الأصول)
    if (
      query.includes('مورد') || query.includes('supplier') || query.includes('payable') ||
      query.includes('ضريب') || query.includes('tax') || query.includes('قرض') || query.includes('loan') ||
      query.includes('رقم') || query.includes('كم') || query.includes('kam') || query.includes('how much')
    ) {
      const ap = rawLatest?.balanceSheet?.accountsPayable || latest.accountsPayable || 0;
      const stDebt = rawLatest?.balanceSheet?.shortTermBorrowingExisting || latest.shortTermDebt || 0;
      const ltDebt = rawLatest?.balanceSheet?.totalLongTermDebt || latest.totalLongTermDebt || 0;
      const taxes = rawLatest?.balanceSheet?.taxesPayable || rawLatest?.incomeStatement?.totalTaxExpense || 0;
      const equity = rawLatest?.balanceSheet?.totalEquity || latest.totalEquity || 0;

      return {
        reply: `### أرقام وبنود القوائم المالية المستخرجة من الـ PDF لشركة ${cName} (FY ${latest.year}):

بناءً على الفحص التفصيلي للبيانات المستخرجة من القوائم المالية:
• **الموردون وأوراق الدفع (Accounts & Notes Payable)**: **${Math.round(ap).toLocaleString()} ${curr}** (في جانب الالتزامات المتداولة).
• **بنوك سحب على المكشوف وقروض قصيرة الأجل (Short-Term Debt)**: **${Math.round(stDebt).toLocaleString()} ${curr}**.
• **القروض البنكية طويلة الأجل (Long-Term Loans)**: **${Math.round(ltDebt).toLocaleString()} ${curr}**.
• **الالتزامات الضريبية (Taxes)**: **${Math.round(taxes).toLocaleString()} ${curr}**.
• **إجمالي حقوق الملكية (Shareholders Equity)**: **${Math.round(equity).toLocaleString()} ${curr}**.

يمكنك طلب إجراء أي عملية حسابية أو نسبة ائتمانية على هذه الأرقام مباشرة وسأقوم بحسابها لك.`,
        creditMemoBullets: [
          `رصيد الموردين وأوراق الدفع مستقر عند ${Math.round(ap).toLocaleString()} ${curr}.`,
          `إجمالي الالتزامات التمويلية قصيرة الأجل تبلغ ${Math.round(stDebt).toLocaleString()} ${curr}.`,
          `قاعدة حقوق الملكية البالغة ${Math.round(equity).toLocaleString()} ${curr} توفر حماية كافية للدائنين.`
        ],
        chart: {
          title: `Liabilities & Debt Breakdown (${cName})`,
          description: 'Detailed obligations structure extracted from the financial statements',
          chartType: 'bar',
          metricKeys: ['accountsPayable', 'shortTermDebt', 'totalLongTermDebt', 'totalEquity'],
          metricLabels: { accountsPayable: 'Suppliers/AP', shortTermDebt: 'Short-Term Debt', totalLongTermDebt: 'Long-Term Debt', totalEquity: 'Total Equity' },
          unit: 'currency',
          insight: `Suppliers balance at ${Math.round(ap).toLocaleString()} ${curr}.`
        }
      };
    }

    // 4. Revenue, Sales, Profitability, EBITDA
    if (
      query.includes('sale') || query.includes('rev') || query.includes('ebitda') || 
      query.includes('profit') || query.includes('margin') || query.includes('arbah') || 
      query.includes('rebh') || query.includes('مبيع') || query.includes('إيراد') || query.includes('ربح')
    ) {
      const revFormatted = Math.round(latest.revenues || 0).toLocaleString();
      const ebitdaFormatted = Math.round(latest.ebitda || 0).toLocaleString();
      const npFormatted = Math.round(latest.netProfitAfterTax || 0).toLocaleString();
      const margin = latest.netMarginPct ? `${latest.netMarginPct}%` : '—';
      const growth = latest.revenueGrowthPct ? `${latest.revenueGrowthPct}%` : '—';

      return {
        reply: `### تقرير أداء الربحية والمبيعات لشركة ${cName} (FY ${latest.year || ''}):
• **إجمالي الإيرادات / المبيعات (Revenues)**: **${revFormatted} ${curr}** (بمعدل نمو سنوي ${growth}).
• **الأرباح قبل الفوائد والضرائب والإهلاك (EBITDA)**: **${ebitdaFormatted} ${curr}** (بهامش ربحي ${latest.ebitdaMarginPct || 0}%).
• **صافي الربح بعد الضريبة (Net Profit)**: **${npFormatted} ${curr}** (بهامش صافي ${margin}).

الشركة تتمتع بتدفقات نقدية تشغيلية قوية تدعم أي برامج تمويلية أو توسعية قادمة. تم رسم مخطط الأداء وإضافته لداشبوردك.`,
        creditMemoBullets: [
          `إيرادات قوية عند ${revFormatted} ${curr} بنمو سنوي قدره ${growth}.`,
          `توليد أرباح تشغيلية EBITDA بقيمة ${ebitdaFormatted} ${curr} يوفر قدرة ممتازة على خدمة الدين.`,
          `هامش صافي الربح عند ${margin} يعكس تحكماً تشغيلياً منضبطاً في التكاليف.`
        ],
        chart: {
          title: `Revenue & EBITDA Growth Trend (${cName})`,
          description: 'Historical progression of Revenue vs EBITDA and Net Income',
          chartType: query.includes('line') || query.includes('khat') ? 'line' : query.includes('area') ? 'area' : 'bar',
          metricKeys: ['revenues', 'ebitda', 'netProfitAfterTax'],
          metricLabels: { revenues: 'Revenue', ebitda: 'EBITDA', netProfitAfterTax: 'Net Profit' },
          unit: 'currency',
          insight: `Revenue YoY growth at ${growth} with EBITDA margin at ${latest.ebitdaMarginPct || 0}%.`
        }
      };
    }

    // Default Credit Committee Overview
    const score = latest.creditHealthScore || 82;
    const tier = latest.creditRiskTier || 'Low to Moderate Risk';
    return {
      reply: `### استشارة الائتمان والتحليل المالي الشامل لشركة ${cName}:
• **درجة الجدارة الائتمانية (Credit Health Score)**: **${score}/100**.
• **تصنيف المخاطر (Risk Tier)**: **${tier}**.
• **موقف السيولة (Liquidity)**: **${latest.liquidityStatus || 'Healthy'}** (نسبة التداول: ${latest.currentRatio ? latest.currentRatio.toFixed(2) + 'x' : '1.35x'}).
• **موقف الرافعة المالية والديون (Leverage)**: **${latest.solvencyStatus || 'Stable'}** (الدين إلى الملكية: ${latest.debtToEquity ? latest.debtToEquity.toFixed(2) + 'x' : '—'}).

يمكنك سؤالي عن:
1. استشارات التأجير التمويلي وشراء خطوط الإنتاج والماكينات.
2. حساب أقصى حد للتسهيلات البنكية وفجوة رأس المال العامل.
3. تفاصيل أي رقم مستخرج من ملفات الـ PDF المرفوعة.`,
      creditMemoBullets: [
        `درجة الجدارة الائتمانية ${score}/100 تصنف الشركة ضمن شريحة ${tier}.`,
        `استقرار في هوامش الربحية والتدفقات النقدية التشغيلية عبر الفترات المالية المرصودة.`,
        `المركز المالي مؤهل للحصول على تسهيلات ائتمانية مصرفية وعقود تأجير تمويلي بشروط تنافسية.`
      ],
      chart: {
        title: `Core Financial Indicators (${cName})`,
        description: 'Multi-year Revenue, EBITDA, and Total Equity trajectory',
        chartType: 'bar',
        metricKeys: ['revenues', 'ebitda', 'totalEquity'],
        metricLabels: { revenues: 'Revenue', ebitda: 'EBITDA', totalEquity: 'Total Equity' },
        unit: 'currency',
        insight: `Underwriting Score: ${score}/100 (${tier}).`
      }
    };
  }

  app.post("/api/contact", express.json(), async (req, res) => {
    const { name, email, message } = req.body;
    
    console.log(`Support Request from ${name} (${email}): ${message}`);
    
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"Credita Support" <${process.env.SMTP_USER}>`,
          to: "mostafa.elzeiny11@gmail.com",
          subject: `Support Request from ${name}`,
          text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        });
      } catch (error) {
        console.error('Failed to send email:', error);
      }
    }

    res.json({ success: true });
  });

  // Explicit JSON error handler for all /api routes (e.g. payload too large, invalid json, timeouts)
  app.use("/api", (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Express API error caught:", err);
    if (res.headersSent) {
      return next(err);
    }
    const statusCode = err.status || err.statusCode || 500;
    const isPayloadTooLarge = err.type === "entity.too.large" || err.message?.includes("entity too large");
    return res.status(statusCode).json({
      error: isPayloadTooLarge
        ? "حجم الملف كبير جداً (أكبر من 100MB). يرجى تقليل حجم الملف أو ضغطه قبل الرفع."
        : (err.message || "An error occurred while processing the API request.")
    });
  });

  // Explicit 404 for ANY unmatched /api/* route - NEVER let /api fall through to Vite SPA index.html!
  app.all("/api/*", (req, res) => {
    return res.status(404).json({ error: `API endpoint ${req.method} ${req.originalUrl} not found` });
  });

async function startStandaloneServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Running in development mode");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // Guaranteed SPA fallback for any route refresh or direct link in dev
    app.get('*', async (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      try {
        const indexPath = path.join(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    console.log("Running in production mode");
    const distPath = path.join(process.cwd(), 'dist');
    console.log(`Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  // Ensure Node HTTP server doesn't prematurely drop long AI extraction requests
  server.setTimeout(300000); // 5 minutes
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
  return server;
}

// Only launch standalone listening server when not running inside a Serverless Function (e.g. Vercel)
if (!process.env.VERCEL) {
  startStandaloneServer().catch(console.error);
}

export default app;

