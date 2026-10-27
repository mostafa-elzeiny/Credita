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

export async function extractFinancialData(file: File, highPrecision = false): Promise<FinancialData> {
  const { base64Data, mimeType } = await prepareFileForUpload(file);

  const maxAttempts = 4;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes timeout

      const endpointsToTry = ['/api/extract', '/api/extract-financials'];
      const targetEndpoint = endpointsToTry[(attempt - 1) % endpointsToTry.length];

      const response = await fetch(targetEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          base64Data,
          mimeType,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Read response as text first to safely guard against HTML error pages or non-JSON responses
      const rawText = await response.text();
      let result: any = null;
      try {
        result = JSON.parse(rawText);
      } catch (parseErr) {
        console.warn(`Extraction attempt ${attempt} received non-JSON payload (${response.status}):`, rawText.slice(0, 200));
        
        const isHtml = rawText.trim().startsWith('<') || rawText.toLowerCase().includes('<!doctype');
        const isTransientStatus = (response.status >= 500 && response.status <= 504) || response.status === 404 || response.status === 502;

        if ((isHtml || isTransientStatus) && attempt < maxAttempts) {
          const waitTime = attempt * 2000;
          console.warn(`Transient HTML/Gateway response on attempt ${attempt} (${response.status}), retrying in ${waitTime}ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }

        const isVercelHost = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
        throw new Error(
          isHtml
            ? "الخادم قيد التحديث أو يواجه ضغطاً مؤقتاً. يرجى الضغط على زر 'إعادة المحاولة / Retry'."
            : isVercelHost && response.status === 404
            ? "مسار الخادم غير مفعل على Vercel (Status 404). يرجى التأكد من رفع ملفات vercel.json و api/ المحدثة وإضافة متغير GEMINI_API_KEY في إعدادات المشروع على Vercel."
            : `استجابة غير متوقعة من الخادم (Status ${response.status}). يرجى إعادة المحاولة.`
        );
      }

      if (!response.ok) {
        let serverError = result?.error || `Server extraction failed with status ${response.status}`;
        
        // Clean up if serverError is a raw JSON string
        try {
          if (typeof serverError === 'string' && serverError.startsWith('{')) {
            const parsed = JSON.parse(serverError);
            if (parsed?.error?.message) {
              serverError = parsed.error.message;
            }
          }
        } catch (_) {}

        const isTransient = 
          (response.status >= 500 && response.status <= 504) || 
          response.status === 404 ||
          response.status === 502 ||
          serverError.includes("503") || 
          serverError.includes("high demand") || 
          serverError.includes("Spikes in demand") || 
          serverError.includes("UNAVAILABLE") ||
          serverError.includes("overloaded");

        // Transient server statuses or model spikes can be retried
        if (isTransient && attempt < maxAttempts) {
          const waitTime = attempt * 2000;
          console.warn(`Extraction attempt ${attempt} returned transient issue (${response.status}), retrying in ${waitTime}ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
        throw new Error(serverError);
      }

      if (!result?.success || !result?.data) {
        throw new Error(result?.error || "Failed to extract structured data from statement.");
      }

      return sanitizeFinancialData(result.data);
    } catch (error: any) {
      lastError = error;
      const isAbort = error?.name === 'AbortError';
      const isNetwork = error?.message?.includes('Failed to fetch') || error?.name === 'TypeError';

      console.warn(`Extraction attempt ${attempt} error:`, error?.message || error);

      if ((isNetwork || isAbort) && attempt < maxAttempts) {
        console.warn(`Temporary network issue on attempt ${attempt}, retrying in ${attempt * 2000}ms...`);
        await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
        continue;
      }
      break;
    }
  }

  // If server extraction failed (e.g. Vercel serverless 404/500 issue), seamlessly attempt direct client-side extraction!
  try {
    const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (apiKey) {
      console.info("Server API unavailable, executing seamless direct Gemini extraction...");
      return await extractClientSide(base64Data, mimeType, highPrecision);
    }
  } catch (clientErr: any) {
    console.warn("Client fallback extraction error:", clientErr);
    lastError = clientErr;
  }

  console.error("Extraction error:", lastError);
  let friendlyMessage = lastError?.message || "Extraction failed";
  if (friendlyMessage.includes("Failed to fetch") || lastError?.name === 'AbortError') {
    friendlyMessage = "تعذر الاتصال بالخادم مؤقتاً أثناء تحليل المستند. يرجى الضغط على زر إعادة المحاولة (Re-extract).";
  } else if (
    friendlyMessage.includes("503") || 
    friendlyMessage.includes("high demand") || 
    friendlyMessage.includes("Spikes in demand") || 
    friendlyMessage.includes("UNAVAILABLE")
  ) {
    friendlyMessage = "نموذج الذكاء الاصطناعي يواجه ضغطاً مؤقتاً في الطلبات (AI Model High Demand). يرجى الضغط على زر إعادة المحاولة (Retry) للمتابعة.";
  }
  throw new Error(friendlyMessage);
}

async function extractClientSide(base64Data: string, mimeType: string, highPrecision = false): Promise<FinancialData> {
  const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const { GoogleGenAI } = await import('@google/genai');
  const { FINANCIAL_DATA_SCHEMA, SYSTEM_PROMPT, reconcileFinancialData } = await import('./extractionPrompt.ts');

  const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
  const cleanMimeType = mimeType || 'application/pdf';

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: { 'User-Agent': 'aistudio-build' },
    },
  });

  const models = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
  let lastErr: any = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model,
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
          responseMimeType: 'application/json',
          responseSchema: FINANCIAL_DATA_SCHEMA,
          temperature: highPrecision ? 0.0 : 0.05,
        },
      });

      const text = response.text || '{}';
      const parsed = JSON.parse(text);
      if (parsed) {
        return sanitizeFinancialData(reconcileFinancialData(parsed));
      }
    } catch (e: any) {
      lastErr = e;
      console.warn(`Direct model ${model} failed:`, e?.message || e);
    }
  }

  throw lastErr || new Error("Direct extraction failed");
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

async function prepareFileForUpload(file: File): Promise<{ base64Data: string; mimeType: string }> {
  // If image, downscale if needed (smart compression for high-res camera photos or scans)
  if (file.type.startsWith('image/')) {
    try {
      const compressed = await compressImageFile(file);
      return {
        base64Data: compressed,
        mimeType: 'image/jpeg',
      };
    } catch (e) {
      console.warn("Image compression failed, using original file:", e);
    }
  }

  const base64Data = await fileToBase64(file);
  let mimeType = file.type;
  if (!mimeType) {
    const nameLower = (file.name || '').toLowerCase();
    if (nameLower.endsWith('.pdf')) {
      mimeType = 'application/pdf';
    } else if (nameLower.endsWith('.png')) {
      mimeType = 'image/png';
    } else if (nameLower.endsWith('.webp')) {
      mimeType = 'image/webp';
    } else {
      mimeType = 'application/pdf';
    }
  }
  return { base64Data, mimeType };
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
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
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
