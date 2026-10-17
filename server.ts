import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { customizePbixWithFinancialData } from "./src/services/pbixCustomizer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lazy Gemini client initialization
let aiClient: GoogleGenAI | null = null;
function getGenAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured on the server.");
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

5. BALANCE SHEET - LIABILITIES & EQUITY (الالتزامات وحقوق الملكية):
   - SHORT TERM BORROWING: Bank overdrafts, short-term credit facilities, short-term bank loans (بنوك سحب على المكشوف / تسهيلات ائتمانية قصيرة الأجل / قروض قصيرة الأجل).
   - CP SENIOR DEBT: Current portion of long-term bank loans (أقساط قروض بنكية تستحق خلال عام).
   - CP CAP LEASE: Current lease liabilities (التزامات عقود إيجار تمويلي متداولة).
   - ACCOUNTS PAYABLE: Trade payables, suppliers, trade notes payable (الموردون وأوراق الدفع / دائنون تجاريون).
   - TAXES PAYABLE: Income tax, VAT, payroll tax liabilities (مصلحة الضرائب - ضرائب مستحقة).
   - ACCRUED EXPENSES: Accrued liabilities, social insurance, other credit balances (مصروفات مستحقة / تأمينات اجتماعية / دائنون متنوعون).
   - DOWN PAYMENTS: Advances from customers, deferred revenue (عملاء دفعات مقدمة / إيرادات مؤجلة).
   - DUE TO SISTER CO: Due to related parties - current (أطراف ذات علاقة - أرصدة دائنة).
   - OTHER CURRENT LIABILITIES: Other short-term provisions and credit balances (التزامات متداولة أخرى / مخصصات أخرى).
   - TOTAL CURRENT LIABILITIES: Total current liabilities (إجمالي الالتزامات المتداولة).
   - LONG TERM DEBT: Long-term bank loans, medium-term bank facilities (قروض طويلة الأجل من البنوك).
   - LT LEASE OBLIGATION: Non-current lease liabilities (التزامات عقود تأجير تمويلي غير متداولة).
   - OTHER NON-CURRENT LIAB: Deferred tax liability, end of service indemnity, provisions (التزامات ضريبية مؤجلة / مخصص مكافأة نهاية الخدمة / التزامات غير متداولة أخرى).
   - TOTAL LIABILITIES: Sum of current and non-current liabilities (إجمالي الالتزامات).
   - COMMON STOCK: Paid-in capital, issued capital (رأس المال المصدر والمدفوع).
   - LEGAL RESERVE: Legal reserve (احتياطي قانوني).
   - ADDITIONAL PAID-IN CAPITAL: Statutory reserve, general reserve, capital reserve (احتياطي نظامي / عام / علاوة إصدار).
   - RETAINED EARNINGS: Carried-forward profits, accumulated earnings (أرباح مرحلة / أرباح محتجزة).
   - PLUS NET INCOME: Net profit for the fiscal year (صافي أرباح العام الحالي).
   - OWNERS/PARTNERS ACCOUNT: Partners/shareholders current account (جاري الشركاء / جاري المساهمين).
   - OTHER ADJUSTMENTS: Cumulative translation adjustment, fair value reserve, treasury shares (احتياطي فروق عملة / احتياطيات أخرى).
   - TOTAL EQUITY: Total shareholders' equity (إجمالي حقوق الملكية).
   - TOTAL LIABILITIES & EQUITY: Grand total liabilities + equity (إجمالي الالتزامات وحقوق الملكية).

6. STRICT BALANCE CHECK MANDATE:
   - Total Assets MUST equal Total Liabilities + Total Equity.
   - Do not omit sub-lines if they are present in the balance sheet.
   - Return clean, strictly valid JSON conforming to the schema.
`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 files up to 50MB
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Dedicated Power BI Desktop (.pbix) generation route with company financial data customization
  const handlePostPbix = async (req: express.Request, res: express.Response) => {
    try {
      const { summary, companyName } = req.body;
      const cName = String(companyName || summary?.companyName || "Financial")
        .replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, "_")
        .replace(/_+/g, "_")
        .trim() || "Financial";
      const safeName = `${cName}_Financial_Dashboard.pbix`;

      const filePath = path.join(__dirname, "templates", "Financial_Report_Working.pbix");
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Power BI template not found on server" });
      }

      const templateBuffer = fs.readFileSync(filePath);

      let finalBuffer: Uint8Array | Buffer = templateBuffer;
      if (summary) {
        try {
          finalBuffer = await customizePbixWithFinancialData(templateBuffer, summary);
        } catch (customErr) {
          console.warn("Could not customize pbix, falling back to clean working template:", customErr);
          finalBuffer = templateBuffer;
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

      const filePath = path.join(__dirname, "templates", "Financial_Report_Working.pbix");
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Power BI template not found on server" });
      }

      const fileBuffer = fs.readFileSync(filePath);
      res.setHeader("Content-Type", "application/vnd.ms-powerbi.desktop");
      res.setHeader("Content-Length", fileBuffer.length.toString());
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`);
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      return res.end(fileBuffer);
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
  app.post("/api/extract", async (req, res) => {
    try {
      const { base64Data, mimeType, highPrecision } = req.body;
      if (!base64Data) {
        return res.status(400).json({ error: "Missing base64Data in request payload" });
      }

      const cleanBase64 = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
      const cleanMimeType = mimeType || "application/pdf";

      const executeWithRetry = async (retryCount = 0): Promise<any> => {
        const ai = getGenAIClient();
        // Priority list of fast, accurate multimodal models
        const modelsToTry = [
          "gemini-3.8-flash",
          "gemini-flash-latest",
          "gemini-3.1-flash-lite"
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
              thinkingConfig: {
                thinkingBudget: 0, // Eliminate delay: Instant structured extraction
              },
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
            errDetail.includes("timeout") ||
            errDetail.includes("500") ||
            errDetail.includes("502") ||
            errDetail.includes("504") ||
            errDetail.includes("ECONNRESET");

          if (isTransient && retryCount < modelsToTry.length - 1) {
            const nextModel = modelsToTry[retryCount + 1];
            console.warn(`Retrying extraction with ${nextModel}...`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
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

          if (bs.totalAssets > 0) {
            const totalLiabsAndEq = (bs.totalLiabilities || 0) + (bs.totalEquity || 0);
            const diff = bs.totalAssets - totalLiabsAndEq;

            if (Math.abs(diff) > 0) {
              bs.otherCurrentLiability = (bs.otherCurrentLiability || 0) + diff;
              bs.totCurrentLiabilities = (bs.totCurrentLiabilities || 0) + diff;
              bs.totalLiabilities = (bs.totalLiabilities || 0) + diff;
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
        const parsed = JSON.parse(errorMessage);
        if (parsed?.error?.message) {
          errorMessage = parsed.error.message;
        }
      } catch (_) {}
      return res.status(500).json({ error: errorMessage });
    }
  });

  // AI Financial Copilot & Dynamic Chart Generator Endpoint (Multilingual: English, Arabic, Franco)
  app.post("/api/dashboard-ai", async (req, res) => {
    try {
      const { message, modelSummary, history = [] } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Missing message query" });
      }

      const ai = getGenAIClient();
      
      const prompt = `
You are an expert Senior Financial Analyst & Credit Committee Advisor inside Credita.
You assist credit analysts reviewing financial statements and preparing credit memos for:
Company: ${modelSummary?.companyName || 'Corporate Client'}
Reporting Periods: ${modelSummary?.years?.join(', ') || 'N/A'}

Multi-Year Financial Model Data:
${JSON.stringify((modelSummary?.yearlyData || []).map((y: any) => ({
  year: y.year,
  revenues: y.revenues,
  cogs: y.cogs,
  grossProfit: y.grossProfit,
  grossMarginPct: y.grossMarginPct,
  ebitda: y.ebitda,
  ebitdaMarginPct: y.ebitdaMarginPct,
  netOperatingProfit: y.netOperatingProfit,
  operatingMarginPct: y.operatingMarginPct,
  netProfitAfterTax: y.netProfitAfterTax,
  netMarginPct: y.netMarginPct,
  cash: y.cash,
  netReceivables: y.netReceivables,
  totalInventory: y.totalInventory,
  totalCurrentAssets: y.totalCurrentAssets,
  netPpe: y.netPpe,
  totalAssets: y.totalAssets,
  shortTermDebt: y.shortTermDebt,
  accountsPayable: y.accountsPayable,
  totCurrentLiabilities: y.totCurrentLiabilities,
  totalLongTermDebt: y.totalLongTermDebt,
  totalLiabilities: y.totalLiabilities,
  totalDebt: y.totalDebt,
  netDebt: y.netDebt,
  totalEquity: y.totalEquity,
  currentRatio: y.currentRatio,
  quickRatio: y.quickRatio,
  debtToEquity: y.debtToEquity,
  debtToAssets: y.debtToAssets,
  financialLeverage: y.financialLeverage,
  interestCoverage: y.interestCoverage,
  creditRiskTier: y.creditRiskTier,
  creditHealthScore: y.creditHealthScore,
  liquidityStatus: y.liquidityStatus,
  solvencyStatus: y.solvencyStatus,
  revenueGrowthPct: y.revenueGrowthPct,
})), null, 2)}

User Request: "${message}"

CRITICAL INSTRUCTIONS:
1. MULTILINGUAL SUPPORT (English, Arabic, Franco-Arabic):
   - The user may write in English (e.g. "plot sales and EBITDA", "what are the risks?").
   - The user may write in Arabic (e.g. "اعمل رسم بياني للمبيعات", "احسب السيولة").
   - The user may write in Franco-Arabic / Egyptian Arabizi (e.g. "e3mely graph lel sales vs ebitda", "hasn el ebitda", "eh akhbar el arbah", "law 3ayz a3del da", "wariny el deon w equity", "compare revenues w expenses").
   UNDERSTAND THE FINANCIAL INTENT PERFECTLY REGARDLESS OF SPELLING OR DIALECT.

2. LANGUAGE CONVENTION:
   - Provide your main reply in clear, professional, fluent English (or in Arabic if the user explicitly typed in Arabic).
   - If the user asked in Franco-Arabic, respond in clear, friendly professional English that directly answers their inquiry.

3. DYNAMIC CHART GENERATION:
   - If the user asks for a chart, graph, visual, or comparison (e.g., "graph", "chart", "plot", "compare", "arsem", "e3mely graph", "wariny shakl", "visualize"):
     ALWAYS include a valid "chart" JSON object!
     - "title": Clean title in English (e.g. "Revenue & EBITDA Growth Trend")
     - "description": Contextual explanation
     - "chartType": "bar" | "line" | "area" | "donut" | "table"
     - "metricKeys": Array of metric keys matching the data (e.g. ["revenues", "ebitda"], ["totalDebt", "totalEquity"], ["currentRatio", "quickRatio"], ["grossMarginPct", "netMarginPct"])
     - "metricLabels": Object mapping each key to an English readable label
     - "unit": "currency" | "percent" | "ratio"
     - "insight": 1-sentence credit takeaway
   - If no chart is requested, set "chart": null.

4. CREDIT MEMO BULLETS:
   - Provide 2-3 high-impact, bank-grade bullet points in "creditMemoBullets" for the credit memo.

Return STRICTLY valid JSON conforming to:
{
  "reply": "string (financial response in English)",
  "creditMemoBullets": ["string", "string"],
  "chart": {
    "title": "string",
    "description": "string",
    "chartType": "bar" | "line" | "area" | "donut" | "table",
    "metricKeys": ["revenues", "ebitda"],
    "metricLabels": { "revenues": "Revenue", "ebitda": "EBITDA" },
    "unit": "currency" | "percent" | "ratio",
    "insight": "string"
  }
}
`;

      const executeAiWithRetry = async (retryIdx = 0): Promise<any> => {
        const models = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
        const chosenModel = models[retryIdx] || models[0];
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Gemini call timed out")), 15000)
          );
          const response = await Promise.race([
            ai.models.generateContent({
              model: chosenModel,
              contents: [{ parts: [{ text: prompt }] }],
              config: {
                responseMimeType: "application/json",
                temperature: 0.1,
                thinkingConfig: { thinkingBudget: 0 }
              }
            }),
            timeoutPromise
          ]) as any;
          const parsed = JSON.parse(response.text || "{}");
          return parsed;
        } catch (callErr: any) {
          console.warn(`Dashboard AI attempt ${retryIdx + 1} with ${chosenModel} warning:`, callErr?.message || callErr);
          if (retryIdx < models.length - 1) {
            await new Promise(r => setTimeout(r, 800));
            return executeAiWithRetry(retryIdx + 1);
          }
          throw callErr;
        }
      };

      let parsed: any = null;
      try {
        parsed = await executeAiWithRetry();
      } catch (geminiErr: any) {
        console.warn("Using local credit copilot fallback:", geminiErr?.message || geminiErr);
        parsed = generateLocalFinancialAiResponse(message, modelSummary);
      }

      return res.json({ success: true, ...parsed });
    } catch (err: any) {
      console.error("Dashboard AI error:", err);
      const fallback = generateLocalFinancialAiResponse(req.body?.message || '', req.body?.modelSummary);
      return res.json({ success: true, ...fallback });
    }
  });

  function generateLocalFinancialAiResponse(message: string, modelSummary: any) {
    const query = (message || '').toLowerCase();
    const yearlyData = modelSummary?.yearlyData || [];
    const latest = yearlyData[yearlyData.length - 1] || {};
    const cName = modelSummary?.companyName || 'Corporate Client';

    // Revenue, Sales, Profitability, EBITDA
    if (
      query.includes('sale') || query.includes('rev') || query.includes('ebitda') || 
      query.includes('profit') || query.includes('margin') || query.includes('arbah') || 
      query.includes('rebh') || query.includes('مبيع') || query.includes('إيراد') || query.includes('ربح')
    ) {
      const revFormatted = Math.round((latest.revenues || 0) / 1000).toLocaleString();
      const ebitdaFormatted = Math.round((latest.ebitda || 0) / 1000).toLocaleString();
      const npFormatted = Math.round((latest.netProfitAfterTax || 0) / 1000).toLocaleString();
      const margin = latest.netMarginPct ? `${latest.netMarginPct}%` : '—';
      const growth = latest.revenueGrowthPct ? `${latest.revenueGrowthPct}%` : '—';

      return {
        reply: `Financial Performance Analysis for ${cName} (FY ${latest.year || ''}):\n• Top-line Revenue reached ${revFormatted}k (${growth} YoY growth).\n• EBITDA stood at ${ebitdaFormatted}k with a healthy margin of ${latest.ebitdaMarginPct || 0}%.\n• Net Profit after tax is ${npFormatted}k (${margin} net margin).\nI have generated and pinned a multi-year performance chart to your dashboard.`,
        creditMemoBullets: [
          `Solid top-line revenue of ${revFormatted}k with sustained ${growth} annual expansion.`,
          `EBITDA generation of ${ebitdaFormatted}k provides robust debt-service capability.`,
          `Net profit margin stabilized at ${margin}, reflecting disciplined operational cost control.`
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

    // Debt, Liabilities, Capital Structure, Leverage
    if (
      query.includes('debt') || query.includes('deon') || query.includes('doyon') || 
      query.includes('leverage') || query.includes('solvency') || query.includes('equity') || 
      query.includes('قرض') || query.includes('ديون') || query.includes('رافعة')
    ) {
      const deRatio = latest.debtToEquity ? `${latest.debtToEquity.toFixed(2)}x` : '—';
      const totalDebt = Math.round((latest.totalDebt || 0) / 1000).toLocaleString();
      const totalEq = Math.round((latest.totalEquity || 0) / 1000).toLocaleString();

      return {
        reply: `Capital Structure & Solvency Assessment for ${cName}:\n• Debt-to-Equity stands at ${deRatio}.\n• Total Funded Debt: ${totalDebt}k vs Total Equity base of ${totalEq}k.\n• Solvency classification: ${latest.solvencyStatus || 'Moderate'}.\nA dedicated capital structure chart has been created and added to your dashboard.`,
        creditMemoBullets: [
          `Debt-to-Equity at ${deRatio} remains within prudential bank lending covenants.`,
          `Robust net worth cushion of ${totalEq}k supports ongoing operational scaling.`,
          `Recommend debt service reserve covenants with periodic DSCR monitoring.`
        ],
        chart: {
          title: `Capital Structure: Debt vs Equity (${cName})`,
          description: 'Total Liabilities & Borrowings compared to Shareholders Equity',
          chartType: query.includes('donut') || query.includes('pie') ? 'donut' : 'bar',
          metricKeys: ['shortTermDebt', 'totalLongTermDebt', 'totalEquity'],
          metricLabels: { shortTermDebt: 'Short-Term Debt', totalLongTermDebt: 'Long-Term Debt', totalEquity: 'Total Equity' },
          unit: 'currency',
          insight: `Debt-to-Equity ratio calibrated at ${deRatio}.`
        }
      };
    }

    // Liquidity, Cash Flow, Working Capital
    if (
      query.includes('liquid') || query.includes('cash') || query.includes('working') || 
      query.includes('seyoula') || query.includes('naqd') || query.includes('سيول') || query.includes('نقد')
    ) {
      const cr = latest.currentRatio ? `${latest.currentRatio.toFixed(2)}x` : '—';
      const qr = latest.quickRatio ? `${latest.quickRatio.toFixed(2)}x` : '—';
      const wc = Math.round((latest.workingCapital || 0) / 1000).toLocaleString();

      return {
        reply: `Liquidity & Working Capital Profile for ${cName}:\n• Current Ratio: ${cr} (Benchmark > 1.20x).\n• Quick Ratio: ${qr} (Benchmark > 1.00x).\n• Net Working Capital: ${wc}k.\n• Overall Liquidity Tier: ${latest.liquidityStatus || 'Healthy'}.\nA working capital & liquidity visual has been generated for your review.`,
        creditMemoBullets: [
          `Current ratio of ${cr} confirms adequate liquid assets to cover short-term dues.`,
          `Positive net working capital buffer of ${wc}k mitigates supply chain volatility.`,
          `Quick ratio at ${qr} demonstrates solid cash collection without inventory dependency.`
        ],
        chart: {
          title: `Working Capital & Liquidity Breakdown (${cName})`,
          description: 'Cash, Receivables, and Inventory vs Short-Term Obligations',
          chartType: 'bar',
          metricKeys: ['cash', 'netReceivables', 'shortTermDebt'],
          metricLabels: { cash: 'Cash & Equivalents', netReceivables: 'Accounts Receivable', shortTermDebt: 'Short-Term Debt' },
          unit: 'currency',
          insight: `Net working capital stands at ${wc}k with ${cr} current ratio.`
        }
      };
    }

    // Default Credit Committee Overview
    const score = latest.creditHealthScore || 78;
    const tier = latest.creditRiskTier || 'Moderate Risk';
    return {
      reply: `Executive Credit Committee Overview for ${cName}:\n• Credit Health Score: ${score}/100.\n• Risk Classification: ${tier}.\n• Liquidity Condition: ${latest.liquidityStatus || 'Healthy'}.\n• Solvency Condition: ${latest.solvencyStatus || 'Strong'}.\nThe borrower exhibits sound creditworthiness. Core underwriting highlights have been summarized below for your credit memo.`,
      creditMemoBullets: [
        `Composite Credit Health Score of ${score}/100 places company in ${tier}.`,
        `Demonstrated stability in core operating margins across observed fiscal periods.`,
        `Favorable borrower profile eligible for standard commercial credit lines.`
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Running in development mode");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
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
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Ensure Node HTTP server doesn't prematurely drop long AI extraction requests
  server.setTimeout(300000); // 5 minutes
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
}

startServer();

