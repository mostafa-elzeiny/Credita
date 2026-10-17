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

  const maxAttempts = 3;
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes timeout

      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Data,
          mimeType,
          highPrecision,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const serverError = errData.error || `Server extraction failed with status ${response.status}`;
        
        // Transient server statuses (500, 502, 503, 504) can be retried
        if (response.status >= 500 && response.status <= 504 && attempt < maxAttempts) {
          console.warn(`Extraction attempt ${attempt} returned status ${response.status}, retrying in ${attempt * 1500}ms...`);
          await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
          continue;
        }
        throw new Error(serverError);
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to extract structured data from statement.");
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

  console.error("Extraction error:", lastError);
  let friendlyMessage = lastError?.message || "Extraction failed";
  if (friendlyMessage.includes("Failed to fetch") || lastError?.name === 'AbortError') {
    friendlyMessage = "تعذر الاتصال بالخادم مؤقتاً أثناء تحليل المستند. يرجى الضغط على زر إعادة المحاولة (Re-extract).";
  }
  throw new Error(friendlyMessage);
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
  const mimeType = file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
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
