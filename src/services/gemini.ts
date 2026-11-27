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

export interface StageTimings {
  prepareMs: number;
  compressMs: number;
  scanMs: number;
  extractMs: number;
  validateMs: number;
  repairMs: number;
  totalMs: number;
  totalSeconds: number;
  scannedPdfCompressed?: boolean;
}

export interface ExtractionMeta {
  mode?: string;
  modelUsed?: string;
  attemptsMade?: number;
  chunked?: boolean;
  pass2Attempted?: boolean;
  pass2Improved?: boolean;
  totalPages?: number;
  timings?: StageTimings;
}

export interface ExtractionProgress {
  stage: 'preparing' | 'compressing' | 'scanning' | 'extracting' | 'verifying' | 'repairing' | 'done';
  percent: number;
  messageEn: string;
  messageAr: string;
  elapsedSeconds?: number;
  timings?: StageTimings;
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

const MAX_CONCURRENT_REQUESTS = 6;
let activeRequestCount = 0;
const requestWaitQueue: Array<() => void> = [];

async function acquireRequestSlot(): Promise<void> {
  if (activeRequestCount < MAX_CONCURRENT_REQUESTS) {
    activeRequestCount++;
    return;
  }
  await new Promise<void>((resolve) => {
    requestWaitQueue.push(() => {
      activeRequestCount++;
      resolve();
    });
  });
}

function releaseRequestSlot(): void {
  activeRequestCount = Math.max(0, activeRequestCount - 1);
  const next = requestWaitQueue.shift();
  if (next) next();
}

async function withApiSlot<T>(fn: () => Promise<T>): Promise<T> {
  await acquireRequestSlot();
  try {
    return await fn();
  } finally {
    releaseRequestSlot();
  }
}

async function runWithConcurrencyPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];
  const limit = Math.max(1, Math.min(concurrency, MAX_CONCURRENT_REQUESTS, items.length));
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const runners = Array.from({ length: limit }, async () => {
    while (true) {
      const currentIndex = nextIndex++;
      if (currentIndex >= items.length) break;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  });

  await Promise.all(runners);
  return results;
}

async function splitPdfIntoCompactChunks(
  srcDoc: PDFDocument,
  maxBase64Bytes = 2_700_000,
  maxPagesPerChunk = 16
): Promise<Array<{ pages: number[]; base64Data: string; pageMap: Map<number, number> }>> {
  const totalPages = srcDoc.getPageCount();
  const chunks: Array<{ pages: number[]; base64Data: string; pageMap: Map<number, number> }> = [];
  if (totalPages === 0) return chunks;

  // Estimate average bytes per page from first page to avoid O(N^2) PDF rebuilds on 48-page docs
  const sampleFirst = await buildSubPdfBase64(srcDoc, [1]);
  const estBytesPerPage = Math.max(40_000, sampleFirst.base64Data.length);
  let start = 1;

  while (start <= totalPages) {
    const remaining = totalPages - start + 1;
    let guessCount = Math.max(
      1,
      Math.min(
        remaining,
        maxPagesPerChunk,
        Math.floor((maxBase64Bytes * 0.9) / estBytesPerPage) || 1
      )
    );

    const makePages = (s: number, c: number) => Array.from({ length: c }, (_, idx) => s + idx);

    let bestPages = makePages(start, guessCount);
    let bestBuilt = start === 1 && guessCount === 1
      ? sampleFirst
      : await buildSubPdfBase64(srcDoc, bestPages);

    // Grow greedily if comfortably below limit
    while (
      bestBuilt.base64Data.length <= maxBase64Bytes &&
      bestPages.length < Math.min(remaining, maxPagesPerChunk)
    ) {
      const nextCount = Math.min(
        remaining,
        maxPagesPerChunk,
        bestPages.length + Math.max(1, Math.floor((maxBase64Bytes - bestBuilt.base64Data.length) / estBytesPerPage))
      );
      if (nextCount <= bestPages.length) break;
      const candidatePages = makePages(start, nextCount);
      const candidateBuilt = await buildSubPdfBase64(srcDoc, candidatePages);
      if (candidateBuilt.base64Data.length <= maxBase64Bytes) {
        bestPages = candidatePages;
        bestBuilt = candidateBuilt;
      } else {
        // Binary search between bestPages.length and nextCount - 1
        let lo = bestPages.length;
        let hi = nextCount - 1;
        while (lo < hi) {
          const mid = Math.ceil((lo + hi) / 2);
          const midPages = makePages(start, mid);
          const midBuilt = await buildSubPdfBase64(srcDoc, midPages);
          if (midBuilt.base64Data.length <= maxBase64Bytes) {
            bestPages = midPages;
            bestBuilt = midBuilt;
            lo = mid;
          } else {
            hi = mid - 1;
          }
        }
        break;
      }
    }

    // Shrink via binary search if initial guess exceeded ceiling
    if (bestBuilt.base64Data.length > maxBase64Bytes && bestPages.length > 1) {
      let lo = 1;
      let hi = bestPages.length - 1;
      let found: { pages: number[]; base64Data: string; pageMap: Map<number, number> } | null = null;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        const midPages = makePages(start, mid);
        const midBuilt = await buildSubPdfBase64(srcDoc, midPages);
        if (midBuilt.base64Data.length <= maxBase64Bytes) {
          found = { pages: midPages, ...midBuilt };
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      if (found) {
        bestPages = found.pages;
        bestBuilt = { base64Data: found.base64Data, pageMap: found.pageMap };
      } else {
        bestPages = [start];
        bestBuilt = await buildSubPdfBase64(srcDoc, [start]);
      }
    }

    chunks.push({ pages: bestPages, ...bestBuilt });
    start += bestPages.length;
  }

  return chunks;
}

function extractRetrySeconds(rawText: string, response?: Response, result?: any): number | null {
  if (typeof result?.retryAfterSeconds === 'number' && result.retryAfterSeconds > 0) {
    return Math.min(60, Math.ceil(result.retryAfterSeconds));
  }
  const headerVal = response?.headers?.get('Retry-After');
  if (headerVal) {
    const num = parseFloat(headerVal);
    if (isFinite(num) && num > 0) return Math.min(60, Math.ceil(num));
  }
  const m = String(rawText || '').match(/retrying?\s+(?:again\s+)?(?:in|after)\s+([0-9]+(?:\.[0-9]+)?)\s*(?:s|sec|secs|seconds)?/i);
  if (m) {
    const num = parseFloat(m[1]);
    if (isFinite(num) && num > 0) return Math.min(60, Math.ceil(num));
  }
  return null;
}

async function callExtractApi(
  payload: Record<string, any>,
  isVercelHost: boolean,
  onRetryWait?: (waitSeconds: number) => void
): Promise<{ data: any; modelUsed?: string; attemptsMade?: number }> {
  const maxAttempts = 3; // initial attempt + max 2 retries
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { response, rawText } = await withApiSlot(async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), isVercelHost ? 65000 : 140000);
        try {
          const targetEndpoint = attempt === 2 ? '/api/extract-financials' : '/api/extract';
          const resp = await fetch(targetEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
          const text = await resp.text();
          return { response: resp, rawText: text };
        } finally {
          clearTimeout(timeoutId);
        }
      });

      let result: any = null;
      try {
        result = JSON.parse(rawText);
      } catch (_) {
        const isHtml = rawText.trim().startsWith('<') || rawText.toLowerCase().includes('<!doctype');
        const isTransientStatus =
          (response.status >= 500 && response.status <= 504) || response.status === 404 || response.status === 429;

        if ((isHtml || isTransientStatus) && attempt < maxAttempts) {
          const waitSec = attempt * 2;
          onRetryWait?.(waitSec);
          const jitter = 150 + Math.floor(Math.random() * 350);
          await new Promise((r) => setTimeout(r, waitSec * 1000 + jitter));
          continue;
        }

        const upperRaw = rawText.toUpperCase();
        if (response.status === 413 || upperRaw.includes('PAYLOAD_TOO_LARGE') || upperRaw.includes('ENTITY TOO LARGE')) {
          throw new Error(
            'حجم الجزء المرسل يتجاوز الحد الأقصى للخادم (4.5 MB على Vercel). سيتم تقليل حجم الصفحات / PDF chunk exceeded Vercel 4.5 MB limit.'
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
          String(serverError).includes('429') ||
          String(serverError).toUpperCase().includes('HIGH DEMAND') ||
          String(serverError).toUpperCase().includes('BUSY');

        if (isTransient && attempt < maxAttempts) {
          const parsedSec = extractRetrySeconds(serverError, response, result);
          const waitSec = parsedSec ?? Math.min(15, attempt * 3);
          onRetryWait?.(waitSec);
          const jitter = 150 + Math.floor(Math.random() * 400);
          await new Promise((r) => setTimeout(r, waitSec * 1000 + jitter));
          continue;
        }
        const errObj = new Error(serverError) as Error & { retryAfterSeconds?: number | null };
        errObj.retryAfterSeconds = extractRetrySeconds(serverError, response, result);
        throw errObj;
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
        const waitSec = attempt * 2;
        onRetryWait?.(waitSec);
        const jitter = 150 + Math.floor(Math.random() * 350);
        await new Promise((r) => setTimeout(r, waitSec * 1000 + jitter));
        continue;
      }
      break;
    }
  }

  let friendly = lastError?.message || 'Extraction failed';
  const retrySec = lastError?.retryAfterSeconds ?? extractRetrySeconds(friendly) ?? 8;
  if (lastError?.name === 'AbortError' || friendly.includes('Failed to fetch')) {
    friendly =
      'انقطع الاتصال المؤقت بالخادم أثناء تحليل الملف. يرجى الضغط على إعادة المحاولة / Temporary connection interruption while analyzing the document. Please retry.';
  } else if (
    friendly.includes('503') ||
    friendly.includes('429') ||
    friendly.toUpperCase().includes('HIGH DEMAND') ||
    friendly.toUpperCase().includes('UNAVAILABLE') ||
    friendly.toUpperCase().includes('QUOTA') ||
    friendly.toUpperCase().includes('BUSY')
  ) {
    friendly = `Service busy, retrying in ${retrySec} seconds / الخدمة مشغولة، يرجى إعادة المحاولة خلال ${retrySec} ثوانٍ.`;
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

function collectRepairPagesForChecks(
  data: FinancialData,
  checks: any[],
  totalPages: number
): number[] {
  const citations = data.pageCitations || {};
  const pages = new Set<number>();

  for (const chk of checks) {
    if (typeof chk.pageNumber === 'number' && chk.pageNumber >= 1 && chk.pageNumber <= totalPages) {
      pages.add(chk.pageNumber);
    }
    if (chk.section === 'income_statement' || chk.id === 'income_statement_flow') {
      if (citations.incomeStatementPage) pages.add(citations.incomeStatementPage);
      if (citations.gnaNotePage) pages.add(citations.gnaNotePage);
    }
    if (chk.section === 'assets' || chk.section === 'balance_sheet' || chk.id === 'balance_equation') {
      if (citations.balanceSheetPage) pages.add(citations.balanceSheetPage);
      if (citations.debtorsNotePage) pages.add(citations.debtorsNotePage);
      if (citations.fixedAssetsNotePage) pages.add(citations.fixedAssetsNotePage);
    }
    if (chk.section === 'liabilities_equity' || chk.section === 'balance_sheet' || chk.section === 'equity_movement' || chk.id === 'balance_equation') {
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

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

async function compressScannedPdfIfNeeded(
  originalBytes: Uint8Array,
  pdfDoc: PDFDocument,
  onProgress?: (donePages: number, totalPages: number) => void
): Promise<{ pdfDoc: PDFDocument; base64Data: string; compressed: boolean; reason: string }> {
  // Only run in browser DOM environments with pdf.js + canvas
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      pdfDoc,
      base64Data: uint8ToBase64(originalBytes),
      compressed: false,
      reason: 'non-browser',
    };
  }

  const pageCount = pdfDoc.getPageCount();
  if (pageCount === 0) {
    return {
      pdfDoc,
      base64Data: uint8ToBase64(originalBytes),
      compressed: false,
      reason: 'empty',
    };
  }

  try {
    const pdfjsLib: any = await import('pdfjs-dist');
    const workerMod: any = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
    if (pdfjsLib.GlobalWorkerOptions && workerMod?.default) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerMod.default;
    }

    const loadingTask = pdfjsLib.getDocument({
      data: originalBytes.slice(),
      verbosity: 0,
    });
    const pdfJsDoc = await loadingTask.promise;

    try {
      // Sample up to 5 pages across the document to distinguish text PDFs from scanned PDFs
      const sampleCount = Math.min(5, pdfJsDoc.numPages);
      const sampleIndices: number[] = [];
      for (let i = 0; i < sampleCount; i++) {
        const pNum = sampleCount === 1 ? 1 : Math.min(pdfJsDoc.numPages, Math.max(1, Math.round(1 + (i * (pdfJsDoc.numPages - 1)) / (sampleCount - 1))));
        if (!sampleIndices.includes(pNum)) sampleIndices.push(pNum);
      }

      let totalChars = 0;
      for (const pNum of sampleIndices) {
        const page = await pdfJsDoc.getPage(pNum);
        const textContent = await page.getTextContent();
        const pageText = (textContent?.items || [])
          .map((it: any) => String(it?.str || ''))
          .join('')
          .replace(/\s+/g, '');
        totalChars += pageText.length;
        page.cleanup?.();
      }

      const avgCharsPerPage = totalChars / Math.max(1, sampleIndices.length);
      if (avgCharsPerPage >= 80) {
        return {
          pdfDoc,
          base64Data: uint8ToBase64(originalBytes),
          compressed: false,
          reason: `text-pdf (avg ${Math.round(avgCharsPerPage)} chars/page)`,
        };
      }

      // Scanned/image-based PDF: re-render each page at ~150 DPI grayscale JPEG (quality 0.70)
      const outDoc = await PDFDocument.create();
      const targetDpiScale = 150 / 72; // ~2.083x (150 DPI)
      const renderedJpegs: Array<{ jpegBytes: Uint8Array; ptWidth: number; ptHeight: number }> = new Array(pdfJsDoc.numPages);
      let completed = 0;

      const pageNumbers = Array.from({ length: pdfJsDoc.numPages }, (_, idx) => idx + 1);
      // Render 4 pages concurrently on canvas to stay responsive without blowing browser RAM
      for (let i = 0; i < pageNumbers.length; i += 4) {
        const batch = pageNumbers.slice(i, i + 4);
        await Promise.all(
          batch.map(async (pNum) => {
            const page = await pdfJsDoc.getPage(pNum);
            const baseViewport = page.getViewport({ scale: 1 });
            const maxDim = Math.max(baseViewport.width * targetDpiScale, baseViewport.height * targetDpiScale);
            const clampedScale = maxDim > 2400 ? (2400 / Math.max(baseViewport.width, baseViewport.height)) : targetDpiScale;
            const viewport = page.getViewport({ scale: clampedScale });

            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, Math.round(viewport.width));
            canvas.height = Math.max(1, Math.round(viewport.height));
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            if (!ctx) {
              throw new Error('Canvas 2D context unavailable');
            }

            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

            // True luminance grayscale + mild contrast boost to preserve crisp financial numerals
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const pixels = imgData.data;
            for (let k = 0; k < pixels.length; k += 4) {
              const lum = 0.299 * pixels[k] + 0.587 * pixels[k + 1] + 0.114 * pixels[k + 2];
              // Mild contrast around midpoint so small scanned digits stay razor sharp
              const contrasted = Math.max(0, Math.min(255, (lum - 128) * 1.12 + 128));
              pixels[k] = contrasted;
              pixels[k + 1] = contrasted;
              pixels[k + 2] = contrasted;
            }
            ctx.putImageData(imgData, 0, 0);

            const jpgUrl = canvas.toDataURL('image/jpeg', 0.7);
            renderedJpegs[pNum - 1] = {
              jpegBytes: dataUrlToUint8Array(jpgUrl),
              ptWidth: baseViewport.width,
              ptHeight: baseViewport.height,
            };

            canvas.width = 0;
            canvas.height = 0;
            page.cleanup?.();
            completed++;
            onProgress?.(completed, pdfJsDoc.numPages);
          })
        );
      }

      for (const item of renderedJpegs) {
        const jpgImage = await outDoc.embedJpg(item.jpegBytes);
        const pdfPage = outDoc.addPage([item.ptWidth, item.ptHeight]);
        pdfPage.drawImage(jpgImage, {
          x: 0,
          y: 0,
          width: item.ptWidth,
          height: item.ptHeight,
        });
      }

      const compressedBytes = await outDoc.save();
      if (compressedBytes.length < originalBytes.length * 0.95) {
        return {
          pdfDoc: outDoc,
          base64Data: uint8ToBase64(compressedBytes),
          compressed: true,
          reason: `compressed ${Math.round(originalBytes.length / 1024)}KB -> ${Math.round(compressedBytes.length / 1024)}KB`,
        };
      }

      return {
        pdfDoc,
        base64Data: uint8ToBase64(originalBytes),
        compressed: false,
        reason: 'already-compact',
      };
    } finally {
      await loadingTask.destroy?.();
    }
  } catch (err) {
    console.warn('Scanned PDF compression skipped cleanly, using original PDF:', err);
    return {
      pdfDoc,
      base64Data: uint8ToBase64(originalBytes),
      compressed: false,
      reason: 'fallback-original',
    };
  }
}

export async function extractFinancialData(
  file: File,
  highPrecision = false,
  onProgress?: (progress: ExtractionProgress) => void
): Promise<FinancialData> {
  const pipelineStart = performance.now();
  const timings: StageTimings = {
    prepareMs: 0,
    compressMs: 0,
    scanMs: 0,
    extractMs: 0,
    validateMs: 0,
    repairMs: 0,
    totalMs: 0,
    totalSeconds: 0,
    scannedPdfCompressed: false,
  };

  const elapsedSec = () => Math.round(((performance.now() - pipelineStart) / 1000) * 10) / 10;

  const emit = (
    stage: ExtractionProgress['stage'],
    percent: number,
    messageEn: string,
    messageAr: string,
    extraTimings?: StageTimings
  ) => {
    onProgress?.({
      stage,
      percent,
      messageEn,
      messageAr,
      elapsedSeconds: Math.floor((performance.now() - pipelineStart) / 1000),
      timings: extraTimings,
    });
  };

  const isVercelHost =
    typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');

  emit('preparing', 5, 'Preparing document...', 'جاري تجهيز المستند...');
  const prepStart = performance.now();
  const prepared = await prepareFileForUpload(file);
  let { base64Data, mimeType, pdfDoc, rawBytes } = prepared;
  timings.prepareMs = Math.round(performance.now() - prepStart);

  // Step 3: Compress scanned PDFs client-side (~150 DPI grayscale JPEG 0.7), skip text PDFs
  if (pdfDoc && rawBytes) {
    const compStart = performance.now();
    const pageTotal = pdfDoc.getPageCount();
    emit(
      'compressing',
      8,
      `Checking PDF compression (${pageTotal} pages)...`,
      `فحص وضغط الصفحات الممسوحة (${pageTotal} صفحة)...`
    );
    const compRes = await compressScannedPdfIfNeeded(rawBytes, pdfDoc, (doneP, totalP) => {
      const pct = 8 + Math.round((doneP / Math.max(1, totalP)) * 10);
      emit(
        'compressing',
        pct,
        `Compressing scanned pages ${doneP}/${totalP}...`,
        `ضغط الصفحات الممسوحة ${doneP}/${totalP}...`
      );
    });
    pdfDoc = compRes.pdfDoc;
    base64Data = compRes.base64Data;
    timings.scannedPdfCompressed = compRes.compressed;
    timings.compressMs = Math.round(performance.now() - compStart);
    console.info(`[Credita Timing] Prepare: ${timings.prepareMs}ms | Compress (${compRes.reason}): ${timings.compressMs}ms`);
  }

  const rawBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  const pageCount = pdfDoc ? pdfDoc.getPageCount() : 1;

  // Thresholds respecting Vercel's 4.5 MB request payload ceiling & 60s timeout
  const shouldChunkPdf =
    Boolean(pdfDoc) &&
    pageCount > 1 &&
    (rawBase64.length > (isVercelHost ? 2_600_000 : 3_400_000) ||
      pageCount > 10);

  let pass1Result: FinancialData;

  const notifyRetry = (waitSec: number, currentStage: ExtractionProgress['stage'], currentPct: number) => {
    emit(
      currentStage,
      currentPct,
      `Service busy, retrying in ${waitSec} seconds...`,
      `الخدمة مشغولة، إعادة المحاولة خلال ${waitSec} ثوانٍ...`
    );
  };

  if (shouldChunkPdf && pdfDoc) {
    const scanStart = performance.now();
    // Large chunks close to 2.7 MB so 48 pages -> ~5-6 scan calls
    const chunks = await splitPdfIntoCompactChunks(pdfDoc, 2_650_000, 14);
    let scannedDone = 0;

    emit(
      'scanning',
      20,
      `Scanning 0/${chunks.length} chunks (${pageCount} pages)...`,
      `مسح الصفحات 0/${chunks.length} (${pageCount} صفحة)...`
    );

    const scanResponses = await runWithConcurrencyPool(chunks, 6, async (ch) => {
      const scanRes = await callExtractApi(
        {
          base64Data: ch.base64Data,
          mimeType: 'application/pdf',
          mode: 'chunk_scan',
        },
        isVercelHost,
        (wSec) => notifyRetry(wSec, 'scanning', 20 + Math.round((scannedDone / chunks.length) * 25))
      );
      scannedDone++;
      const pct = 20 + Math.round((scannedDone / chunks.length) * 25);
      emit(
        'scanning',
        pct,
        `Scanning ${scannedDone}/${chunks.length}...`,
        `مسح الصفحات ${scannedDone}/${chunks.length}...`
      );
      return { ch, scanData: scanRes.data };
    });

    timings.scanMs = Math.round(performance.now() - scanStart);
    console.info(`[Credita Timing] Scanning (${chunks.length} chunks, concurrency=6): ${timings.scanMs}ms`);

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

    for (const { ch, scanData } of scanResponses) {
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
        labelEn: 'Income Statement & Notes',
        labelAr: 'قائمة الدخل والإيضاحات',
        pages: pickPages((p) => p.hasIncomeStatement || p.hasGnaNote || p.hasEquityStatement, 4),
      },
      {
        section: 'balance_sheet_assets',
        labelEn: 'Balance Sheet Assets',
        labelAr: 'أصول الميزانية',
        pages: pickPages((p) => p.hasBalanceSheet || p.hasDebtorsNote || p.hasFixedAssetsNote, 5),
      },
      {
        section: 'balance_sheet_liabilities_equity',
        labelEn: 'Liabilities & Equity',
        labelAr: 'الالتزامات وحقوق الملكية',
        pages: pickPages((p) => p.hasBalanceSheet || p.hasCreditorsNote || p.hasEquityStatement, 5),
      },
    ];

    const cfPages = pageIndex.filter((p) => p.hasCashFlow).map((p) => p.globalPage);
    if (cfPages.length > 0) {
      sectionSpecs.push({
        section: 'cash_flow',
        labelEn: 'Cash Flow Statement',
        labelAr: 'التدفقات النقدية',
        pages: Array.from(new Set([...cfPages, ...pickPages((p) => p.hasBalanceSheet, 2)])).sort((a, b) => a - b),
      });
    }

    const extractStart = performance.now();
    const totalSections = sectionSpecs.length;
    let sectionsDone = 0;

    emit(
      'extracting',
      48,
      `Extracting 0/${totalSections}...`,
      `استخراج البيانات 0/${totalSections}...`
    );

    const sectionResults = await runWithConcurrencyPool(sectionSpecs, 6, async (spec) => {
      let pagesToSend = spec.pages;
      let built = await buildSubPdfBase64(pdfDoc!, pagesToSend);
      while (built.base64Data.length > 3_100_000 && pagesToSend.length > 1) {
        pagesToSend = pagesToSend.slice(0, pagesToSend.length - 1);
        built = await buildSubPdfBase64(pdfDoc!, pagesToSend);
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
        isVercelHost,
        (wSec) => notifyRetry(wSec, 'extracting', 48 + Math.round((sectionsDone / totalSections) * 32))
      );

      sectionsDone++;
      const pct = 48 + Math.round((sectionsDone / totalSections) * 32);
      emit(
        'extracting',
        pct,
        `Extracting ${sectionsDone}/${totalSections} (${spec.labelEn})...`,
        `استخراج ${sectionsDone}/${totalSections} (${spec.labelAr})...`
      );

      return {
        section: spec.section,
        data: res.data,
        pageMap: built.pageMap,
      };
    });

    timings.extractMs = Math.round(performance.now() - extractStart);
    console.info(`[Credita Timing] Section extraction (${totalSections} parallel calls): ${timings.extractMs}ms`);

    const valStart = performance.now();
    emit('verifying', 82, 'Validating extracted figures...', 'جاري التحقق المحاسبي...');
    const merged = mergeSectionOutputs(sectionResults);
    if (!merged.companyName && detectedCompany) merged.companyName = detectedCompany;
    if (!merged.year && detectedYear) merged.year = detectedYear;
    merged.extractionMeta = {
      ...(merged.extractionMeta || {}),
      totalPages: pageCount,
      chunked: true,
    };
    pass1Result = sanitizeFinancialData(merged);
    timings.validateMs = Math.round(performance.now() - valStart);
  } else {
    if (isVercelHost && rawBase64.length > 4_300_000) {
      throw new Error(
        `حجم الملف (${(rawBase64.length / (1024 * 1024)).toFixed(1)} MB) يتجاوز الحد الأقصى لخادم Vercel (4.5 MB). يرجى تقليل دقة الصورة أو ضغط الملف.`
      );
    }

    const extractStart = performance.now();
    emit(
      'extracting',
      35,
      'Extracting 1/1 (Statements & Notes)...',
      'استخراج البيانات 1/1 (القوائم والإيضاحات)...'
    );

    const singleRes = await callExtractApi(
      {
        base64Data,
        mimeType,
        highPrecision,
        mode: 'full',
      },
      isVercelHost,
      (wSec) => notifyRetry(wSec, 'extracting', 50)
    );
    timings.extractMs = Math.round(performance.now() - extractStart);

    const valStart = performance.now();
    emit('verifying', 82, 'Validating extracted figures...', 'جاري التحقق المحاسبي...');
    const reconciled = reconcileFinancialData(singleRes.data);
    reconciled.extractionMeta = {
      ...(reconciled.extractionMeta || {}),
      modelUsed: singleRes.modelUsed,
      attemptsMade: singleRes.attemptsMade,
      chunked: false,
      totalPages: pageCount,
    };
    pass1Result = sanitizeFinancialData(reconciled);
    timings.validateMs = Math.round(performance.now() - valStart);
  }

  // -------------------------------------------------------------------------
  // Step 4: Pass 2 Targeted Repair — ONLY when validation fails, ONLY failing sections, IN PARALLEL
  // -------------------------------------------------------------------------
  if (pass1Result.validation && !pass1Result.validation.allPassed) {
    const repairStart = performance.now();
    const failedChecks = pass1Result.validation.checks.filter((c) => !c.passed);

    const isChecks = failedChecks.filter((c) => c.section === 'income_statement' || c.id === 'equity_movement_agreement');
    const assetChecks = failedChecks.filter((c) => c.section === 'assets' || c.id === 'balance_equation' || c.id === 'cash_flow_agreement');
    const leChecks = failedChecks.filter((c) => c.section === 'liabilities_equity' || c.id === 'balance_equation' || c.id === 'equity_movement_agreement');
    const cfChecks = failedChecks.filter((c) => c.section === 'cash_flow');

    const repairJobs: Array<{ section: string; checks: any[] }> = [];
    if (isChecks.length > 0) repairJobs.push({ section: 'income_statement', checks: isChecks });
    if (assetChecks.length > 0) repairJobs.push({ section: 'balance_sheet_assets', checks: assetChecks });
    if (leChecks.length > 0) repairJobs.push({ section: 'balance_sheet_liabilities_equity', checks: leChecks });
    if (cfChecks.length > 0) repairJobs.push({ section: 'cash_flow', checks: cfChecks });

    if (repairJobs.length > 0) {
      emit(
        'repairing',
        86,
        `Repairing ${repairJobs.length} failing section(s)...`,
        `إعادة فحص ${repairJobs.length} أقسام غير متطابقة (Pass 2)...`
      );

      try {
        const repairOutputs = await runWithConcurrencyPool(repairJobs, 6, async (job) => {
          const targetPages = pdfDoc ? collectRepairPagesForChecks(pass1Result, job.checks, pageCount) : [];
          let repairBase64 = base64Data;
          let repairPageMap: Map<number, number> | null = null;

          if (pdfDoc && targetPages.length > 0) {
            const sub = await buildSubPdfBase64(pdfDoc, targetPages);
            if (sub.base64Data.length <= 3_400_000) {
              repairBase64 = sub.base64Data;
              repairPageMap = sub.pageMap;
            }
          }

          if (isVercelHost && repairBase64.length > 4_300_000) {
            return null;
          }

          const repairRes = await callExtractApi(
            {
              base64Data: repairBase64,
              mimeType: pdfDoc ? 'application/pdf' : mimeType,
              highPrecision: true,
              mode: 'repair',
              targetSection: job.section,
              failingChecks: job.checks,
              targetPagesHint: targetPages,
              currentData: {
                unitMetadata: pass1Result.unitMetadata,
                printedTotals: pass1Result.printedTotals,
                verificationWorksheet: pass1Result.verificationWorksheet,
                incomeStatement: pass1Result.incomeStatement,
                balanceSheet: pass1Result.balanceSheet,
              },
            },
            isVercelHost,
            (wSec) => notifyRetry(wSec, 'repairing', 90)
          );

          return {
            section: job.section,
            data: repairRes.data,
            modelUsed: repairRes.modelUsed,
            pageMap: repairPageMap,
          };
        });

        const validRepairs = repairOutputs.filter(Boolean) as Array<{
          section: string;
          data: any;
          modelUsed?: string;
          pageMap: Map<number, number> | null;
        }>;

        if (validRepairs.length > 0) {
          const mergedPass2: any = {
            companyName: pass1Result.companyName,
            year: pass1Result.year,
            unitMetadata: pass1Result.unitMetadata,
            printedTotals: { ...(pass1Result.printedTotals || {}) },
            pageCitations: { ...(pass1Result.pageCitations || {}) },
            lowConfidenceFields: [...(pass1Result.lowConfidenceFields || [])],
            verificationWorksheet: { ...(pass1Result.verificationWorksheet || {}) },
            notes: { ...(pass1Result.notes || {}) },
            incomeStatement: { ...pass1Result.incomeStatement },
            balanceSheet: { ...pass1Result.balanceSheet },
          };

          for (const rep of validRepairs) {
            const rawPass2 = rep.data;
            if (!rawPass2) continue;

            if (rep.pageMap) {
              rawPass2.pageCitations = remapPageCitations(rawPass2.pageCitations, rep.pageMap);
              rawPass2.lowConfidenceFields = remapLowConfidencePages(rawPass2.lowConfidenceFields, rep.pageMap);
            }

            if (rawPass2.companyName && !mergedPass2.companyName) mergedPass2.companyName = rawPass2.companyName;
            if (rawPass2.year && !mergedPass2.year) mergedPass2.year = rawPass2.year;
            if (rawPass2.printedTotals) {
              for (const [k, v] of Object.entries(rawPass2.printedTotals)) {
                if (typeof v === 'number' && !isNaN(v)) mergedPass2.printedTotals[k] = v;
              }
            }
            if (rawPass2.pageCitations) {
              Object.assign(mergedPass2.pageCitations, rawPass2.pageCitations);
            }
            if (Array.isArray(rawPass2.lowConfidenceFields) && rawPass2.lowConfidenceFields.length > 0) {
              mergedPass2.lowConfidenceFields = rawPass2.lowConfidenceFields;
            }
            if (rawPass2.verificationWorksheet) {
              for (const [k, v] of Object.entries(rawPass2.verificationWorksheet)) {
                if (typeof v === 'number' && !isNaN(v) && v !== 0) {
                  mergedPass2.verificationWorksheet[k] = v;
                }
              }
            }
            if (rawPass2.notes) {
              Object.assign(mergedPass2.notes, rawPass2.notes);
            }

            if (rep.section === 'income_statement' && rawPass2.incomeStatement) {
              for (const k of INCOME_STATEMENT_NUM_KEYS) {
                if (rawPass2.incomeStatement[k] !== undefined && rawPass2.incomeStatement[k] !== null) {
                  mergedPass2.incomeStatement[k] = rawPass2.incomeStatement[k];
                }
              }
            } else if (rep.section === 'balance_sheet_assets' && rawPass2.balanceSheet) {
              for (const k of ASSET_KEYS) {
                if (rawPass2.balanceSheet[k] !== undefined && rawPass2.balanceSheet[k] !== null) {
                  mergedPass2.balanceSheet[k] = rawPass2.balanceSheet[k];
                }
              }
            } else if (rep.section === 'balance_sheet_liabilities_equity' && rawPass2.balanceSheet) {
              for (const k of LIABILITY_EQUITY_KEYS) {
                if (rawPass2.balanceSheet[k] !== undefined && rawPass2.balanceSheet[k] !== null) {
                  mergedPass2.balanceSheet[k] = rawPass2.balanceSheet[k];
                }
              }
            }
          }

          const pass2Sanitized = sanitizeFinancialData(reconcileFinancialData(mergedPass2));
          const improved = isCandidateBetter(pass2Sanitized, pass1Result);

          timings.repairMs = Math.round(performance.now() - repairStart);
          timings.totalMs = Math.round(performance.now() - pipelineStart);
          timings.totalSeconds = elapsedSec();
          console.info('[Credita Extraction Timings]', timings);

          if (improved) {
            pass2Sanitized.extractionMeta = {
              ...(pass1Result.extractionMeta || {}),
              ...(pass2Sanitized.extractionMeta || {}),
              pass2Attempted: true,
              pass2Improved: true,
              modelUsed: validRepairs[0]?.modelUsed || pass1Result.extractionMeta?.modelUsed,
              totalPages: pageCount,
              timings,
            };
            if (pass2Sanitized.validation) {
              pass2Sanitized.validation.pass2Attempted = true;
              pass2Sanitized.validation.pass2Improved = true;
            }
            emit('done', 100, `Done (${timings.totalSeconds}s)`, `اكتمل (${timings.totalSeconds} ث)`, timings);
            return pass2Sanitized;
          }
        }
      } catch (repairErr) {
        console.warn('Pass 2 targeted repair skipped/failed gracefully, retaining Pass 1:', repairErr);
      }
    }

    timings.repairMs = Math.round(performance.now() - repairStart);
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

  timings.totalMs = Math.round(performance.now() - pipelineStart);
  timings.totalSeconds = elapsedSec();
  pass1Result.extractionMeta = {
    ...(pass1Result.extractionMeta || {}),
    timings,
  };

  console.info('[Credita Extraction Timings]', timings);
  emit('done', 100, `Done (${timings.totalSeconds}s)`, `اكتمل (${timings.totalSeconds} ث)`, timings);
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
  rawBytes?: Uint8Array;
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
  let rawBytes: Uint8Array | undefined;
  if (mimeType === 'application/pdf' || nameLower.endsWith('.pdf')) {
    try {
      rawBytes = new Uint8Array(await file.arrayBuffer());
      pdfDoc = await PDFDocument.load(rawBytes, { ignoreEncryption: true });
      return {
        base64Data: uint8ToBase64(rawBytes),
        mimeType,
        pdfDoc,
        rawBytes,
      };
    } catch (pdfErr) {
      console.warn('pdf-lib could not parse PDF locally, using direct upload:', pdfErr);
    }
  }

  const base64Data = await fileToBase64(file);
  return { base64Data, mimeType, pdfDoc, rawBytes };
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
