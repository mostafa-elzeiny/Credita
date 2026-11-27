import { PDFDocument } from 'pdf-lib';
import {
  reconcileFinancialData,
  ValidationSummary,
} from './extractionValidation';

export interface UnitMetadata {
  currency: string;
  originalScale: 'units' | 'thousands' | 'millions' | string;
  scaleMultiplierApplied: number;
  scaleConsistentAcrossPages: boolean;
  evidenceText?: string;
}

export interface PrintedTotals {
  grossProfit?: number | null;
  operatingProfit?: number | null;
  netProfitBeforeTax?: number | null;
  netProfitAfterTax?: number | null;
  totalCurrentAssets?: number | null;
  netPpe?: number | null;
  totalAssets?: number | null;
  totCurrentLiabilities?: number | null;
  totalLongTermDebt?: number | null;
  totalLiabilities?: number | null;
  totalEquity?: number | null;
  totalLiabsAndEquity?: number | null;
  retainedEarningsClosing?: number | null;
  cashFlowOperating?: number | null;
  cashFlowInvesting?: number | null;
  cashFlowFinancing?: number | null;
  cashFlowNetChange?: number | null;
  cashFlowBeginningCash?: number | null;
  cashFlowClosingCash?: number | null;
}

export interface PageCitationItem {
  field: string;
  pageNumber: number | null;
  printedLabel?: string | null;
}

export interface PageCitations {
  incomeStatementPage?: number | null;
  balanceSheetPage?: number | null;
  equityStatementPage?: number | null;
  cashFlowPage?: number | null;
  gnaNotePage?: number | null;
  debtorsNotePage?: number | null;
  creditorsNotePage?: number | null;
  fixedAssetsNotePage?: number | null;
  linePages?: PageCitationItem[];
}

export interface LowConfidenceField {
  field: string;
  statement: string;
  pageNumber?: number | null;
  reason: string;
  extractedValue?: number | null;
}

export interface ExtractionMeta {
  mode?: string;
  modelUsed?: string;
  attemptsMade?: number;
  chunked?: boolean;
  pass2Attempted?: boolean;
  pass2Improved?: boolean;
  totalPages?: number;
}

export interface ExtractionProgress {
  stage: 'preparing' | 'scanning' | 'extracting' | 'verifying' | 'repairing' | 'done';
  percent: number;
  messageEn: string;
  messageAr: string;
}

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
  unitMetadata?: UnitMetadata;
  printedTotals?: PrintedTotals;
  pageCitations?: PageCitations;
  lowConfidenceFields?: LowConfidenceField[];
  nullFields?: string[];
  verificationWorksheet?: Record<string, number | null>;
  validation?: ValidationSummary;
  extractionMeta?: ExtractionMeta;
}

const INCOME_STATEMENT_NUM_KEYS = [
  'revenues', 'costOfGoodsSold', 'depreciation1', 'grossProfit', 'depreciation2',
  'sgaExpense', 'provisions1', 'rd', 'goodwillAmortization', 'otherAmortization',
  'netOperatingProfit', 'grossInterestExpExist', 'interestExpNew', 'capitalizedInterest',
  'interestIncome', 'dividendIncome', 'provDoubtfulRec', 'provisions2', 'fxGL',
  'sundryIncomeExpense1', 'netProfitBeforeTax', 'totalTaxExpense', 'currentTaxExpense',
  'deferredTaxExpense', 'itc', 'netProfitAfterTax', 'minorityInterestExpense', 'saleOfPlant',
  'sundryIncomeExpense2', 'npaui', 'prefShareDividends', 'commonStockDividends',
  'otherAdjustment', 'totalChange',
];

const ASSET_KEYS = [
  'cash', 'marketableSecurities', 'marketableSecExcess', 'accountsReceivable',
  'lessAllowances', 'netReceivables', 'rawMaterials', 'workInProgress',
  'finishedGoods', 'goodsInTransit', 'totalInventory', 'advancePayments',
  'nonTradeRec', 'otherCurrentAssets', 'dueFromSisterCo1', 'totalCurrentAssets',
  'land', 'buildingImprovement', 'machineryEquipment', 'constInProgress',
  'grossPlant', 'lessAccumulatedDep', 'netPpe', 'accountsReceivablesLt',
  'dueFromSisterCo2', 'otherTangibleAsset', 'deferredTaxAsset', 'prepaids',
  'goodwill', 'otherIntangibleAsset', 'lessAccumAmortization', 'netIntangibles',
  'totalAssets',
];

const LIABILITY_EQUITY_KEYS = [
  'shortTermBorrowingExisting', 'shortTermBorrowingNew', 'cpSeniorDebtExisting',
  'cpSeniorDebtNew', 'cpCapLease', 'cpSubDebtExisting', 'cpSalesTax',
  'accountsPayable', 'taxesPayable', 'accruedExpenses', 'interestPayable',
  'dividendsPayable', 'downPayments', 'dueToSisterCo3', 'otherCurrentLiability',
  'totCurrentLiabilities', 'ltLeaseObligation', 'ltSeniorDebtExisting',
  'ltSeniorDebtNew', 'ltTaxes', 'ltSharholderLoan', 'totalLongTermDebt',
  'otherNonCurrentLiab', 'totalLiabilities', 'deferredTaxes', 'minorityInterest',
  'provisions3', 'totalGreyArea', 'preferredStock', 'commonStock',
  'additionalPaidInCapital', 'retainedEarningsOpening', 'plusNetIncome',
  'lessDividends', 'otherAdjustments', 'retainedEarningsClosing',
  'ownersAccount', 'fxAdjustment', 'legalReserve', 'totalEquity',
  'totalLiabsAndEquity',
];

function uint8ToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, sub as unknown as number[]);
  }
  return btoa(binary);
}

async function buildSubPdfBase64(srcDoc: PDFDocument, oneIndexedPages: number[]): Promise<{ base64Data: string; pageMap: Map<number, number> }> {
  const total = srcDoc.getPageCount();
  const validUnique = Array.from(
    new Set(oneIndexedPages.filter((p) => Number.isInteger(p) && p >= 1 && p <= total))
  ).sort((a, b) => a - b);

  const subDoc = await PDFDocument.create();
  const copied = await subDoc.copyPages(srcDoc, validUnique.map((p) => p - 1));
  const pageMap = new Map<number, number>();
  copied.forEach((page, idx) => {
    subDoc.addPage(page);
    pageMap.set(idx + 1, validUnique[idx]);
  });

  const savedBytes = await subDoc.save();
  return {
    base64Data: uint8ToBase64(savedBytes),
    pageMap,
  };
}

function remapPageCitations(citations: any, pageMap: Map<number, number> | null) {
  if (!citations || !pageMap) return citations;
  const remap = (p: any) => (typeof p === 'number' && pageMap.has(p) ? pageMap.get(p)! : p);
  const out = { ...citations };
  for (const key of [
    'incomeStatementPage',
    'balanceSheetPage',
    'equityStatementPage',
    'cashFlowPage',
    'gnaNotePage',
    'debtorsNotePage',
    'creditorsNotePage',
    'fixedAssetsNotePage',
  ]) {
    if (typeof out[key] === 'number') out[key] = remap(out[key]);
  }
  if (Array.isArray(out.linePages)) {
    out.linePages = out.linePages.map((lp: any) => ({
      ...lp,
      pageNumber: remap(lp?.pageNumber),
    }));
  }
  return out;
}

function remapLowConfidencePages(items: any[] | undefined, pageMap: Map<number, number> | null): LowConfidenceField[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    ...item,
    pageNumber:
      pageMap && typeof item?.pageNumber === 'number' && pageMap.has(item.pageNumber)
        ? pageMap.get(item.pageNumber)!
        : item?.pageNumber ?? null,
  }));
}

async function splitPdfIntoCompactChunks(
  srcDoc: PDFDocument,
  maxBase64Bytes = 2_700_000,
  maxPagesPerChunk = 4
): Promise<Array<{ pages: number[]; base64Data: string; pageMap: Map<number, number> }>> {
  const totalPages = srcDoc.getPageCount();
  const chunks: Array<{ pages: number[]; base64Data: string; pageMap: Map<number, number> }> = [];
  let currentPages: number[] = [];
  let lastGood: { pages: number[]; base64Data: string; pageMap: Map<number, number> } | null = null;

  for (let p = 1; p <= totalPages; p++) {
    const candidatePages = [...currentPages, p];
    const built = await buildSubPdfBase64(srcDoc, candidatePages);

    if (
      currentPages.length > 0 &&
      (built.base64Data.length > maxBase64Bytes || candidatePages.length > maxPagesPerChunk)
    ) {
      if (lastGood) chunks.push(lastGood);
      const single = await buildSubPdfBase64(srcDoc, [p]);
      currentPages = [p];
      lastGood = { pages: [p], ...single };
    } else {
      currentPages = candidatePages;
      lastGood = { pages: candidatePages, ...built };
    }
  }

  if (lastGood) {
    chunks.push(lastGood);
  }
  return chunks;
}

async function callExtractApi(payload: Record<string, any>, isVercelHost: boolean): Promise<{ data: any; modelUsed?: string; attemptsMade?: number }> {
  const maxAttempts = 3;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), isVercelHost ? 65000 : 210000);

      const endpointsToTry = ['/api/extract', '/api/extract-financials'];
      const targetEndpoint = endpointsToTry[(attempt - 1) % endpointsToTry.length];

      const response = await fetch(targetEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const rawText = await response.text();
      let result: any = null;
      try {
        result = JSON.parse(rawText);
      } catch (_) {
        const isHtml = rawText.trim().startsWith('<') || rawText.toLowerCase().includes('<!doctype');
        const isTransientStatus =
          (response.status >= 500 && response.status <= 504) || response.status === 404;

        if ((isHtml || isTransientStatus) && attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, attempt * 1800));
          continue;
        }

        const upperRaw = rawText.toUpperCase();
        if (response.status === 413 || upperRaw.includes('PAYLOAD_TOO_LARGE') || upperRaw.includes('ENTITY TOO LARGE')) {
          throw new Error(
            'حجم الجزء المرسل يتجاوز الحد الأقصى للخادم (4.5 MB على Vercel). سيتم تقليل حجم الصفحات أو يرجى ضغط الملف / PDF chunk exceeded Vercel 4.5 MB limit.'
          );
        }
        if (upperRaw.includes('FUNCTION_INVOCATION_TIMEOUT') || response.status === 504) {
          throw new Error(
            'استغرقت معالجة المستند وقتاً أطول من مهلة الخادم. يرجى إعادة المحاولة / Server processing timed out, please retry.'
          );
        }
        if (upperRaw.includes('FUNCTION_INVOCATION_FAILED')) {
          throw new Error(
            'تعذر تشغيل خدمة التحليل على الخادم (FUNCTION_INVOCATION_FAILED). تأكد من إعداد GEMINI_API_KEY / Server function failed.'
          );
        }

        throw new Error(
          isHtml
            ? 'الخدمة قيد التحديث أو تواجه ضغطاً مؤقتاً. يرجى إعادة المحاولة / Service temporarily busy, please retry.'
            : 'تلقى المتصفح استجابة غير صالحة من الخادم. يرجى إعادة المحاولة / Invalid response received from server, please retry.'
        );
      }

      if (!response.ok || !result?.success || !result?.data) {
        const serverError =
          result?.error && result?.errorAr && result.error !== result.errorAr
            ? `${result.error} / ${result.errorAr}`
            : result?.errorAr || result?.error || `Extraction failed (HTTP ${response.status})`;
        const code = result?.code || '';
        const isTransient =
          response.status === 503 ||
          response.status === 429 ||
          response.status === 502 ||
          response.status === 504 ||
          code === 'MODEL_HIGH_DEMAND' ||
          code === 'EXTRACTION_TIMEOUT' ||
          String(serverError).includes('503') ||
          String(serverError).toUpperCase().includes('HIGH DEMAND');

        if (isTransient && attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, attempt * 2000));
          continue;
        }
        throw new Error(serverError);
      }

      return {
        data: result.data,
        modelUsed: result.modelUsed,
        attemptsMade: result.attemptsMade,
      };
    } catch (err: any) {
      lastError = err;
      const isAbort = err?.name === 'AbortError';
      const isNetwork = err?.message?.includes('Failed to fetch') || err?.name === 'TypeError';
      if ((isAbort || isNetwork) && attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, attempt * 1800));
        continue;
      }
      break;
    }
  }

  let friendly = lastError?.message || 'Extraction failed';
  if (lastError?.name === 'AbortError' || friendly.includes('Failed to fetch')) {
    friendly =
      'انقطع الاتصال المؤقت بالخادم أثناء تحليل الملف. يرجى الضغط على إعادة المحاولة / Temporary connection interruption while analyzing the document. Please retry.';
  } else if (
    friendly.includes('503') ||
    friendly.toUpperCase().includes('HIGH DEMAND') ||
    friendly.toUpperCase().includes('UNAVAILABLE')
  ) {
    friendly =
      'نموذج الذكاء الاصطناعي يواجه ضغطاً مؤقتاً في الطلبات (503). يرجى الضغط على إعادة المحاولة / AI model high demand (503). Please click Retry.';
  }
  throw new Error(friendly);
}

function mergeSectionOutputs(
  sectionResults: Array<{ section: string; data: any; pageMap: Map<number, number> }>
): any {
  const merged: any = {
    companyName: '',
    year: 0,
    unitMetadata: undefined,
    printedTotals: {},
    pageCitations: { linePages: [] },
    lowConfidenceFields: [],
    verificationWorksheet: {},
    incomeStatement: {},
    balanceSheet: {},
    notes: {},
    extractionMeta: { chunked: true, mode: 'section' },
  };

  const modelsUsed = new Set<string>();
  const lowConfSeen = new Set<string>();
  const linePageSeen = new Set<string>();

  for (const { section, data, pageMap } of sectionResults) {
    if (!data) continue;
    if (!merged.companyName && data.companyName) merged.companyName = data.companyName;
    if (!merged.year && data.year) merged.year = data.year;
    if (data.unitMetadata?.currency) {
      if (!merged.unitMetadata) {
        merged.unitMetadata = { ...data.unitMetadata };
      } else {
        const sameCurrency =
          String(merged.unitMetadata.currency || '').toUpperCase() ===
          String(data.unitMetadata.currency || '').toUpperCase();
        const sameScale =
          (merged.unitMetadata.scaleMultiplierApplied || 1) ===
          (data.unitMetadata.scaleMultiplierApplied || 1);
        if (!sameCurrency || !sameScale || data.unitMetadata.scaleConsistentAcrossPages === false) {
          merged.unitMetadata.scaleConsistentAcrossPages = false;
        }
      }
    }
    if (data.extractionMeta?.modelUsed) modelsUsed.add(data.extractionMeta.modelUsed);

    const remappedCitations = remapPageCitations(data.pageCitations, pageMap) || {};
    for (const k of [
      'incomeStatementPage',
      'balanceSheetPage',
      'equityStatementPage',
      'cashFlowPage',
      'gnaNotePage',
      'debtorsNotePage',
      'creditorsNotePage',
      'fixedAssetsNotePage',
    ]) {
      if (merged.pageCitations[keyOr(k)] == null && typeof remappedCitations[k] === 'number') {
        merged.pageCitations[k] = remappedCitations[k];
      }
    }
    if (Array.isArray(remappedCitations.linePages)) {
      for (const lp of remappedCitations.linePages) {
        const sig = `${lp.field}:${lp.pageNumber}`;
        if (!linePageSeen.has(sig)) {
          linePageSeen.add(sig);
          merged.pageCitations.linePages.push(lp);
        }
      }
    }

    for (const lc of remapLowConfidencePages(data.lowConfidenceFields, pageMap)) {
      const sig = `${lc.statement}:${lc.field}:${lc.pageNumber}`;
      if (!lowConfSeen.has(sig)) {
        lowConfSeen.add(sig);
        merged.lowConfidenceFields.push(lc);
      }
    }

    if (data.verificationWorksheet) {
      for (const [k, v] of Object.entries(data.verificationWorksheet)) {
        if (typeof v === 'number' && !isNaN(v)) {
          if (merged.verificationWorksheet[k] == null || merged.verificationWorksheet[k] === 0) {
            merged.verificationWorksheet[k] = v;
          }
        }
      }
    }

    if (data.notes) {
      for (const [k, v] of Object.entries(data.notes)) {
        if (typeof v === 'string' && v.trim() && !merged.notes[k]) {
          merged.notes[k] = v;
        }
      }
    }

    if (data.printedTotals) {
      const sectionAllowedPrinted: Record<string, string[]> = {
        income_statement: ['grossProfit', 'operatingProfit', 'netProfitBeforeTax', 'netProfitAfterTax'],
        balance_sheet_assets: ['totalCurrentAssets', 'netPpe', 'totalAssets'],
        balance_sheet_liabilities_equity: [
          'totCurrentLiabilities',
          'totalLongTermDebt',
          'totalLiabilities',
          'totalEquity',
          'totalLiabsAndEquity',
          'retainedEarningsClosing',
        ],
        cash_flow: [
          'cashFlowOperating',
          'cashFlowInvesting',
          'cashFlowFinancing',
          'cashFlowNetChange',
          'cashFlowBeginningCash',
          'cashFlowClosingCash',
        ],
      };
      const allowList = sectionAllowedPrinted[section] || Object.keys(data.printedTotals);
      for (const k of allowList) {
        if (typeof data.printedTotals[k] === 'number' && !isNaN(data.printedTotals[k])) {
          merged.printedTotals[k] = data.printedTotals[k];
        }
      }
    }

    if (section === 'income_statement' && data.incomeStatement) {
      for (const k of INCOME_STATEMENT_NUM_KEYS) {
        if (data.incomeStatement[k] !== undefined) {
          merged.incomeStatement[k] = data.incomeStatement[k];
        }
      }
    } else if (section === 'balance_sheet_assets' && data.balanceSheet) {
      for (const k of ASSET_KEYS) {
        if (data.balanceSheet[k] !== undefined) {
          merged.balanceSheet[k] = data.balanceSheet[k];
        }
      }
    } else if (section === 'balance_sheet_liabilities_equity' && data.balanceSheet) {
      for (const k of LIABILITY_EQUITY_KEYS) {
        if (data.balanceSheet[k] !== undefined) {
          merged.balanceSheet[k] = data.balanceSheet[k];
        }
      }
    }
  }

  merged.extractionMeta.modelUsed = Array.from(modelsUsed).join(', ') || undefined;
  return reconcileFinancialData(merged);
}

function keyOr(k: string) {
  return k;
}

function isCandidateBetter(candidate: FinancialData, baseline: FinancialData): boolean {
  const cVal = candidate.validation;
  const bVal = baseline.validation;
  if (!cVal) return false;
  if (!bVal) return true;
  if (cVal.failedCount < bVal.failedCount) return true;
  if (cVal.failedCount > bVal.failedCount) return false;
  return cVal.totalDifference < bVal.totalDifference - 10;
}

function collectRepairPages(data: FinancialData, totalPages: number): number[] {
  const failing = data.validation?.checks?.filter((c) => !c.passed) || [];
  const citations = data.pageCitations || {};
  const pages = new Set<number>();

  for (const chk of failing) {
    if (typeof chk.pageNumber === 'number' && chk.pageNumber >= 1 && chk.pageNumber <= totalPages) {
      pages.add(chk.pageNumber);
    }
    if (chk.section === 'income_statement' || chk.id === 'income_statement_flow') {
      if (citations.incomeStatementPage) pages.add(citations.incomeStatementPage);
      if (citations.gnaNotePage) pages.add(citations.gnaNotePage);
    }
    if (chk.section === 'assets' || chk.section === 'balance_sheet') {
      if (citations.balanceSheetPage) pages.add(citations.balanceSheetPage);
      if (citations.debtorsNotePage) pages.add(citations.debtorsNotePage);
      if (citations.fixedAssetsNotePage) pages.add(citations.fixedAssetsNotePage);
    }
    if (chk.section === 'liabilities_equity' || chk.section === 'balance_sheet' || chk.section === 'equity_movement') {
      if (citations.balanceSheetPage) pages.add(citations.balanceSheetPage);
      if (citations.creditorsNotePage) pages.add(citations.creditorsNotePage);
      if (citations.equityStatementPage) pages.add(citations.equityStatementPage);
    }
    if (chk.section === 'cash_flow') {
      if (citations.cashFlowPage) pages.add(citations.cashFlowPage);
      if (citations.balanceSheetPage) pages.add(citations.balanceSheetPage);
    }
  }

  return Array.from(pages).filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
}

export async function extractFinancialData(
  file: File,
  highPrecision = false,
  onProgress?: (progress: ExtractionProgress) => void
): Promise<FinancialData> {
  const emit = (
    stage: ExtractionProgress['stage'],
    percent: number,
    messageEn: string,
    messageAr: string
  ) => {
    onProgress?.({ stage, percent, messageEn, messageAr });
  };

  const isVercelHost =
    typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');

  emit('preparing', 8, 'Preparing document for analysis...', 'جاري تجهيز المستند للتحليل...');

  const { base64Data, mimeType, pdfDoc } = await prepareFileForUpload(file);
  const rawBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  const pageCount = pdfDoc ? pdfDoc.getPageCount() : 1;

  // Thresholds respecting Vercel's 4.5 MB request payload ceiling & 60s timeout
  const shouldChunkPdf =
    Boolean(pdfDoc) &&
    pageCount > 1 &&
    (rawBase64.length > (isVercelHost ? 2_800_000 : 3_800_000) ||
      (isVercelHost && pageCount > 10));

  let pass1Result: FinancialData;

  if (shouldChunkPdf && pdfDoc) {
    emit(
      'scanning',
      15,
      `Large PDF (${pageCount} pages): scanning & splitting into compact chunks...`,
      `ملف كبير (${pageCount} صفحة): جاري مسح وتقسيم الصفحات لتحسين الدقة...`
    );

    const chunks = await splitPdfIntoCompactChunks(pdfDoc, 2_700_000, 4);
    const pageIndex: Array<{
      globalPage: number;
      hasIncomeStatement: boolean;
      hasBalanceSheet: boolean;
      hasEquityStatement: boolean;
      hasCashFlow: boolean;
      hasGnaNote: boolean;
      hasDebtorsNote: boolean;
      hasCreditorsNote: boolean;
      hasFixedAssetsNote: boolean;
    }> = [];

    let detectedCompany = '';
    let detectedYear = 0;

    for (let i = 0; i < chunks.length; i++) {
      const ch = chunks[i];
      const pct = 18 + Math.round(((i + 1) / chunks.length) * 18);
      emit(
        'scanning',
        pct,
        `Indexing pages ${ch.pages[0]}–${ch.pages[ch.pages.length - 1]} of ${pageCount}...`,
        `فهرسة الصفحات ${ch.pages[0]}–${ch.pages[ch.pages.length - 1]} من ${pageCount}...`
      );

      const scanRes = await callExtractApi(
        {
          base64Data: ch.base64Data,
          mimeType: 'application/pdf',
          mode: 'chunk_scan',
        },
        isVercelHost
      );

      const scanData = scanRes.data;
      if (!detectedCompany && scanData?.companyName) detectedCompany = scanData.companyName;
      if (!detectedYear && scanData?.year) detectedYear = scanData.year;

      const scannedPages = Array.isArray(scanData?.pages) ? scanData.pages : [];
      for (const sp of scannedPages) {
        const globalPage = ch.pageMap.get(sp.localPageNumber) || ch.pages[0];
        pageIndex.push({
          globalPage,
          hasIncomeStatement: Boolean(sp.hasIncomeStatement),
          hasBalanceSheet: Boolean(sp.hasBalanceSheet),
          hasEquityStatement: Boolean(sp.hasEquityStatement),
          hasCashFlow: Boolean(sp.hasCashFlow),
          hasGnaNote: Boolean(sp.hasGnaNote),
          hasDebtorsNote: Boolean(sp.hasDebtorsNote),
          hasCreditorsNote: Boolean(sp.hasCreditorsNote),
          hasFixedAssetsNote: Boolean(sp.hasFixedAssetsNote),
        });
      }
    }

    const pickPages = (pred: (p: typeof pageIndex[number]) => boolean, fallbackFirstN = 3) => {
      const matched = pageIndex.filter(pred).map((p) => p.globalPage);
      if (matched.length > 0) return Array.from(new Set(matched)).sort((a, b) => a - b);
      return Array.from({ length: Math.min(fallbackFirstN, pageCount) }, (_, idx) => idx + 1);
    };

    const sectionSpecs: Array<{
      section: string;
      labelEn: string;
      labelAr: string;
      pages: number[];
    }> = [
      {
        section: 'income_statement',
        labelEn: 'Extracting Income Statement & G&A Notes...',
        labelAr: 'استخراج قائمة الدخل وإيضاح المصروفات العمومية...',
        pages: pickPages((p) => p.hasIncomeStatement || p.hasGnaNote || p.hasEquityStatement, 4),
      },
      {
        section: 'balance_sheet_assets',
        labelEn: 'Extracting Balance Sheet Assets & Fixed Assets Schedule...',
        labelAr: 'استخراج الأصول وجدول الأصول الثابتة والمدينين...',
        pages: pickPages((p) => p.hasBalanceSheet || p.hasDebtorsNote || p.hasFixedAssetsNote, 5),
      },
      {
        section: 'balance_sheet_liabilities_equity',
        labelEn: 'Extracting Liabilities, Creditors & Equity Movement...',
        labelAr: 'استخراج الالتزامات والدائنين وحقوق الملكية...',
        pages: pickPages((p) => p.hasBalanceSheet || p.hasCreditorsNote || p.hasEquityStatement, 5),
      },
    ];

    const cfPages = pageIndex.filter((p) => p.hasCashFlow).map((p) => p.globalPage);
    if (cfPages.length > 0) {
      sectionSpecs.push({
        section: 'cash_flow',
        labelEn: 'Extracting Cash Flow Statement...',
        labelAr: 'استخراج قائمة التدفقات النقدية...',
        pages: Array.from(new Set([...cfPages, ...pickPages((p) => p.hasBalanceSheet, 2)])).sort((a, b) => a - b),
      });
    }

    const sectionResults: Array<{ section: string; data: any; pageMap: Map<number, number> }> = [];
    for (let i = 0; i < sectionSpecs.length; i++) {
      const spec = sectionSpecs[i];
      const pct = 40 + Math.round(((i + 1) / sectionSpecs.length) * 35);
      emit('extracting', pct, spec.labelEn, spec.labelAr);

      let pagesToSend = spec.pages;
      let built = await buildSubPdfBase64(pdfDoc, pagesToSend);
      // Trim trailing non-essential pages if chunk still exceeds safe size ceiling
      while (built.base64Data.length > 3_100_000 && pagesToSend.length > 1) {
        pagesToSend = pagesToSend.slice(0, pagesToSend.length - 1);
        built = await buildSubPdfBase64(pdfDoc, pagesToSend);
      }

      if (isVercelHost && built.base64Data.length > 4_300_000) {
        throw new Error(
          'إحدى صفحات المستند الممسوحة ضوئياً كبيرة جداً (أكبر من 4.5 MB بمفردها). يرجى تقليل دقة المسح الضوئي / A single scanned page exceeds Vercel 4.5 MB limit.'
        );
      }

      const res = await callExtractApi(
        {
          base64Data: built.base64Data,
          mimeType: 'application/pdf',
          highPrecision,
          mode: 'section',
          targetSection: spec.section,
        },
        isVercelHost
      );

      sectionResults.push({
        section: spec.section,
        data: res.data,
        pageMap: built.pageMap,
      });

      if (i < sectionSpecs.length - 1) {
        await new Promise((r) => setTimeout(r, 350));
      }
    }

    const merged = mergeSectionOutputs(sectionResults);
    if (!merged.companyName && detectedCompany) merged.companyName = detectedCompany;
    if (!merged.year && detectedYear) merged.year = detectedYear;
    merged.extractionMeta = {
      ...(merged.extractionMeta || {}),
      totalPages: pageCount,
      chunked: true,
    };
    pass1Result = sanitizeFinancialData(merged);
  } else {
    if (isVercelHost && rawBase64.length > 4_300_000) {
      throw new Error(
        `حجم الملف (${(rawBase64.length / (1024 * 1024)).toFixed(1)} MB) يتجاوز الحد الأقصى لخادم Vercel (4.5 MB). يرجى تقليل دقة الصورة أو ضغط الملف.`
      );
    }

    emit(
      'extracting',
      35,
      'Extracting financial statements & notes...',
      'جاري استخراج القوائم المالية والإيضاحات المتممة...'
    );

    const singleRes = await callExtractApi(
      {
        base64Data,
        mimeType,
        highPrecision,
        mode: 'full',
      },
      isVercelHost
    );

    const reconciled = reconcileFinancialData(singleRes.data);
    reconciled.extractionMeta = {
      ...(reconciled.extractionMeta || {}),
      modelUsed: singleRes.modelUsed,
      attemptsMade: singleRes.attemptsMade,
      chunked: false,
      totalPages: pageCount,
    };
    pass1Result = sanitizeFinancialData(reconciled);
  }

  // -------------------------------------------------------------------------
  // Pass 2 Automatic Verification & Targeted Repair (Requirement 3)
  // -------------------------------------------------------------------------
  if (pass1Result.validation && !pass1Result.validation.allPassed) {
    const failedChecks = pass1Result.validation.checks.filter((c) => !c.passed);
    emit(
      'repairing',
      82,
      `Found ${failedChecks.length} check mismatch(es) — running targeted Pass 2 re-read...`,
      `تم رصد ${failedChecks.length} فروقات — جاري إعادة فحص الصفحات المعنية (Pass 2)...`
    );

    try {
      const targetPages = pdfDoc ? collectRepairPages(pass1Result, pageCount) : [];
      let repairBase64 = base64Data;
      let repairPageMap: Map<number, number> | null = null;

      if (pdfDoc && targetPages.length > 0) {
        const sub = await buildSubPdfBase64(pdfDoc, targetPages);
        if (sub.base64Data.length <= 3_400_000) {
          repairBase64 = sub.base64Data;
          repairPageMap = sub.pageMap;
        }
      }

      if (!(isVercelHost && repairBase64.length > 4_300_000)) {
        const repairRes = await callExtractApi(
          {
            base64Data: repairBase64,
            mimeType: pdfDoc ? 'application/pdf' : mimeType,
            highPrecision: true,
            mode: 'repair',
            failingChecks: failedChecks,
            targetPagesHint: targetPages,
            currentData: {
              unitMetadata: pass1Result.unitMetadata,
              printedTotals: pass1Result.printedTotals,
              verificationWorksheet: pass1Result.verificationWorksheet,
              incomeStatement: pass1Result.incomeStatement,
              balanceSheet: pass1Result.balanceSheet,
            },
          },
          isVercelHost
        );

        const rawPass2 = repairRes.data;
        if (rawPass2) {
          if (repairPageMap) {
            rawPass2.pageCitations = remapPageCitations(rawPass2.pageCitations, repairPageMap);
            rawPass2.lowConfidenceFields = remapLowConfidencePages(
              rawPass2.lowConfidenceFields,
              repairPageMap
            );
          }

          const failingSectionsSet = new Set(failedChecks.map((c) => c.section));
          const repairIS =
            failingSectionsSet.has('income_statement') || failingSectionsSet.has('equity_movement');
          const repairAssets =
            failingSectionsSet.has('assets') || failingSectionsSet.has('balance_sheet') || failingSectionsSet.has('cash_flow');
          const repairLE =
            failingSectionsSet.has('liabilities_equity') || failingSectionsSet.has('balance_sheet') || failingSectionsSet.has('equity_movement');

          const mergedPass2: any = {
            companyName: rawPass2.companyName || pass1Result.companyName,
            year: rawPass2.year || pass1Result.year,
            unitMetadata: rawPass2.unitMetadata || pass1Result.unitMetadata,
            printedTotals: {
              ...(pass1Result.printedTotals || {}),
              ...(Object.fromEntries(
                Object.entries(rawPass2.printedTotals || {}).filter(
                  ([, v]) => typeof v === 'number' && !isNaN(v)
                )
              )),
            },
            pageCitations: {
              ...(pass1Result.pageCitations || {}),
              ...(rawPass2.pageCitations || {}),
            },
            lowConfidenceFields:
              Array.isArray(rawPass2.lowConfidenceFields) && rawPass2.lowConfidenceFields.length > 0
                ? rawPass2.lowConfidenceFields
                : pass1Result.lowConfidenceFields,
            verificationWorksheet: {
              ...(pass1Result.verificationWorksheet || {}),
              ...(Object.fromEntries(
                Object.entries(rawPass2.verificationWorksheet || {}).filter(
                  ([, v]) => typeof v === 'number' && !isNaN(v) && v !== 0
                )
              )),
            },
            notes: {
              ...(pass1Result.notes || {}),
              ...(rawPass2.notes || {}),
            },
            incomeStatement: repairIS
              ? {
                  ...pass1Result.incomeStatement,
                  ...(Object.fromEntries(
                    Object.entries(rawPass2.incomeStatement || {}).filter(([, v]) => v !== undefined && v !== null)
                  )),
                }
              : { ...pass1Result.incomeStatement },
            balanceSheet: {
              ...pass1Result.balanceSheet,
              ...(repairAssets
                ? Object.fromEntries(
                    ASSET_KEYS.filter((k) => rawPass2.balanceSheet?.[k] !== undefined && rawPass2.balanceSheet?.[k] !== null)
                      .map((k) => [k, rawPass2.balanceSheet[k]])
                  )
                : {}),
              ...(repairLE
                ? Object.fromEntries(
                    LIABILITY_EQUITY_KEYS.filter((k) => rawPass2.balanceSheet?.[k] !== undefined && rawPass2.balanceSheet?.[k] !== null)
                      .map((k) => [k, rawPass2.balanceSheet[k]])
                  )
                : {}),
            },
          };

          const pass2Sanitized = sanitizeFinancialData(reconcileFinancialData(mergedPass2));
          const improved = isCandidateBetter(pass2Sanitized, pass1Result);

          if (improved) {
            pass2Sanitized.extractionMeta = {
              ...(pass1Result.extractionMeta || {}),
              ...(pass2Sanitized.extractionMeta || {}),
              pass2Attempted: true,
              pass2Improved: true,
              modelUsed: repairRes.modelUsed || pass1Result.extractionMeta?.modelUsed,
              totalPages: pageCount,
            };
            if (pass2Sanitized.validation) {
              pass2Sanitized.validation.pass2Attempted = true;
              pass2Sanitized.validation.pass2Improved = true;
            }
            emit('done', 100, 'Pass 2 improved reconciliation accuracy.', 'تم تحسين التطابق في الفحص الثاني بنجاح.');
            return pass2Sanitized;
          }
        }
      }
    } catch (repairErr) {
      console.warn('Pass 2 targeted repair skipped/failed gracefully, retaining Pass 1:', repairErr);
    }

    pass1Result.extractionMeta = {
      ...(pass1Result.extractionMeta || {}),
      pass2Attempted: true,
      pass2Improved: false,
    };
    if (pass1Result.validation) {
      pass1Result.validation.pass2Attempted = true;
      pass1Result.validation.pass2Improved = false;
    }
  }

  emit('done', 100, 'Extraction & verification complete.', 'اكتمل الاستخراج والتحقق المحاسبي بنجاح.');
  return pass1Result;
}

export async function extractFinancialDataBatch(
  files: File[],
  highPrecision = false
): Promise<FinancialData[]> {
  return Promise.all(files.map((f) => extractFinancialData(f, highPrecision)));
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
    companyName: data.companyName || '',
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
    unitMetadata: data.unitMetadata,
    printedTotals: data.printedTotals || {},
    pageCitations: data.pageCitations || {},
    lowConfidenceFields: Array.isArray(data.lowConfidenceFields) ? data.lowConfidenceFields : [],
    nullFields: Array.isArray(data.nullFields) ? data.nullFields : [],
    verificationWorksheet: data.verificationWorksheet || {},
    validation: data.validation,
    extractionMeta: data.extractionMeta || {},
  };
}

async function prepareFileForUpload(file: File): Promise<{
  base64Data: string;
  mimeType: string;
  pdfDoc: PDFDocument | null;
}> {
  if (file.type.startsWith('image/')) {
    try {
      const compressed = await compressImageFile(file);
      return {
        base64Data: compressed,
        mimeType: 'image/jpeg',
        pdfDoc: null,
      };
    } catch (e) {
      console.warn('Image compression failed, using original file:', e);
    }
  }

  let mimeType = file.type;
  const nameLower = (file.name || '').toLowerCase();
  if (!mimeType) {
    if (nameLower.endsWith('.pdf')) mimeType = 'application/pdf';
    else if (nameLower.endsWith('.png')) mimeType = 'image/png';
    else if (nameLower.endsWith('.webp')) mimeType = 'image/webp';
    else mimeType = 'application/pdf';
  }

  let pdfDoc: PDFDocument | null = null;
  if (mimeType === 'application/pdf' || nameLower.endsWith('.pdf')) {
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    } catch (pdfErr) {
      console.warn('pdf-lib could not parse PDF locally, using direct upload:', pdfErr);
    }
  }

  const base64Data = await fileToBase64(file);
  return { base64Data, mimeType, pdfDoc };
}

function compressImageFile(file: File, maxDim = 2048, quality = 0.88): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(event.target?.result as string);
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Failed to load image for optimization'));
    };
    reader.onerror = (err) => reject(err);
  });
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
