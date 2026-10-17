import JSZip from 'jszip';
import { ModelSummary, CalculatedYearData } from './financialModel';

function formatNumber(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0';
  return Math.round(val).toLocaleString('en-US');
}

/**
 * Customizes the working Microsoft Power BI Desktop (.pbix) template
 * with the company's real financial statements, balance sheet numbers,
 * key credit ratios, and Power Query queries.
 *
 * Removes SecurityBindings so Power BI Desktop opens cleanly without corruption errors.
 */
export async function customizePbixWithFinancialData(
  templateBuffer: ArrayBuffer | Buffer,
  summary: ModelSummary
): Promise<Uint8Array> {
  const zip = await JSZip.loadAsync(templateBuffer);

  // 1. Crucial: Remove machine-specific SecurityBindings signature to prevent corruption errors
  zip.remove('SecurityBindings');

  const companyName = summary.companyName || 'Credita Corporate Client';
  const yearlyData: CalculatedYearData[] = summary.yearlyData || [];
  const latest: CalculatedYearData | undefined = yearlyData[yearlyData.length - 1];
  const yearsList = (summary.years || []).join(', ');

  // 2. Customize Report/Layout (UTF-16LE JSON)
  const layoutFile = zip.file('Report/Layout');
  if (layoutFile) {
    try {
      const layoutBuf = await layoutFile.async('uint8array');
      const decoder = new TextDecoder('utf-16le');
      const layoutStr = decoder.decode(layoutBuf);
      const layout = JSON.parse(layoutStr);

      // Section 0: Executive Financial Dashboard
      if (layout.sections && layout.sections[0]) {
        layout.sections[0].displayName = 'Executive Financial Analysis';
        
        // Find or customize title textbox (VC 3)
        const vcs = layout.sections[0].visualContainers || [];
        for (const vc of vcs) {
          try {
            const cfg = JSON.parse(vc.config || '{}');
            if (cfg.singleVisual?.visualType === 'textbox') {
              cfg.singleVisual.objects = cfg.singleVisual.objects || {};
              cfg.singleVisual.objects.general = [
                {
                  properties: {
                    paragraphs: [
                      {
                        textRuns: [
                          {
                            value: `CREDITA - ${companyName.toUpperCase()}`,
                            textStyle: { fontWeight: 'bold', fontSize: '18pt', color: '#1e3a8a' }
                          }
                        ],
                        horizontalTextAlignment: 'center'
                      },
                      {
                        textRuns: [
                          {
                            value: `Executive Financial & Credit Dashboard | Period: ${yearsList} | Currency: EGP (000's)`,
                            textStyle: { fontSize: '10pt', color: '#64748b' }
                          }
                        ],
                        horizontalTextAlignment: 'center'
                      },
                      {
                        textRuns: [
                          {
                            value: `Assets: ${formatNumber(latest?.totalAssets)} | Equity: ${formatNumber(latest?.totalEquity)} | Revenue: ${formatNumber(latest?.revenues)} | Net Profit: ${formatNumber(latest?.netProfitAfterTax)}`,
                            textStyle: { fontWeight: 'bold', fontSize: '9pt', color: '#047857' }
                          }
                        ],
                        horizontalTextAlignment: 'center'
                      }
                    ]
                  }
                }
              ];
              vc.config = JSON.stringify(cfg);
              break;
            }
          } catch {
            // continue
          }
        }
      }

      // Section 1: Balance Sheet Structure & Financial Spreading
      if (layout.sections && layout.sections[1]) {
        layout.sections[1].displayName = 'Balance Sheet & Credit Metrics';
        
        const vcs1 = layout.sections[1].visualContainers || [];
        for (const vc of vcs1) {
          try {
            const cfg = JSON.parse(vc.config || '{}');
            if (cfg.singleVisual?.visualType === 'textbox') {
              cfg.singleVisual.objects = cfg.singleVisual.objects || {};
              cfg.singleVisual.objects.general = [
                {
                  properties: {
                    paragraphs: [
                      {
                        textRuns: [
                          {
                            value: `${companyName} - BALANCE SHEET & FINANCIAL SPREADING`,
                            textStyle: { fontWeight: 'bold', fontSize: '16pt', color: '#0f172a' }
                          }
                        ],
                        horizontalTextAlignment: 'left'
                      },
                      {
                        textRuns: [
                          {
                            value: `ASSETS: Total Assets: ${formatNumber(latest?.totalAssets)} | Current Assets: ${formatNumber(latest?.totalCurrentAssets)} | Cash: ${formatNumber(latest?.cash)} | Receivables: ${formatNumber(latest?.netReceivables)} | Inventory: ${formatNumber(latest?.totalInventory)}`,
                            textStyle: { fontSize: '9.5pt', color: '#334155' }
                          }
                        ],
                        horizontalTextAlignment: 'left'
                      },
                      {
                        textRuns: [
                          {
                            value: `CAPITAL STRUCTURE: Total Liabilities: ${formatNumber(latest?.totalLiabilities)} | Current Liabs: ${formatNumber(latest?.totCurrentLiabilities)} | Debt: ${formatNumber(latest?.totalDebt)} | Equity: ${formatNumber(latest?.totalEquity)}`,
                            textStyle: { fontSize: '9.5pt', color: '#334155' }
                          }
                        ],
                        horizontalTextAlignment: 'left'
                      },
                      {
                        textRuns: [
                          {
                            value: `CREDIT RATIOS: Current Ratio: ${latest?.currentRatio?.toFixed(2) ?? 'N/A'}x | Quick Ratio: ${latest?.quickRatio?.toFixed(2) ?? 'N/A'}x | Debt/Equity: ${latest?.debtToEquity?.toFixed(2) ?? 'N/A'}x | Working Capital: ${formatNumber(latest?.workingCapital)}`,
                            textStyle: { fontWeight: 'bold', fontSize: '9.5pt', color: '#1d4ed8' }
                          }
                        ],
                        horizontalTextAlignment: 'left'
                      }
                    ]
                  }
                }
              ];
              vc.config = JSON.stringify(cfg);
              break;
            }
          } catch {
            // continue
          }
        }
      }

      // Encode UTF-16LE without BOM
      const newLayoutJson = JSON.stringify(layout);
      const utf16leBuf = new Uint8Array(newLayoutJson.length * 2);
      for (let i = 0; i < newLayoutJson.length; i++) {
        const code = newLayoutJson.charCodeAt(i);
        utf16leBuf[i * 2] = code & 0xff;
        utf16leBuf[i * 2 + 1] = (code >> 8) & 0xff;
      }
      zip.file('Report/Layout', utf16leBuf);
    } catch (err) {
      console.warn('Failed to customize Report/Layout, preserving original:', err);
    }
  }

  // 3. Customize DataMashup with real company data queries
  const dmFile = zip.file('DataMashup');
  if (dmFile) {
    try {
      const dmBuf = await dmFile.async('uint8array');
      const view = new DataView(dmBuf.buffer, dmBuf.byteOffset, dmBuf.byteLength);
      const version = view.getUint32(0, true);
      const pkgLen = view.getUint32(4, true);

      if (8 + pkgLen <= dmBuf.byteLength) {
        const innerZipBuf = dmBuf.slice(8, 8 + pkgLen);
        const rest = dmBuf.slice(8 + pkgLen);

        const innerZip = await JSZip.loadAsync(innerZipBuf);
        const sec1File = innerZip.file('Formulas/Section1.m');
        if (sec1File) {
          // Generate inline Power Query M rows for user's real financial data
          const rowsM: string[] = [];
          for (const y of yearlyData) {
            const yr = y.year;
            const rev = Math.round(y.revenues || 0);
            const cogs = Math.round(y.cogs || 0);
            const gp = Math.round(y.grossProfit || 0);
            const np = Math.round(y.netProfitAfterTax || 0);
            const ta = Math.round(y.totalAssets || 0);
            const ca = Math.round(y.totalCurrentAssets || 0);
            const cash = Math.round(y.cash || 0);
            const tl = Math.round(y.totalLiabilities || 0);
            const te = Math.round(y.totalEquity || 0);

            // Map into financials table schema:
            // Segment, Country, Product, Discount Band, Units Sold, Manufacturing Price, Sale Price, Discounts on Purchase, COGS, Profit, Date, Month Number, Month Name, Year
            rowsM.push(`{"Revenues", "Egypt", "${companyName} - Turnover", "None", 1, 0, ${rev}, 0, ${cogs}, ${rev - cogs}, #date(${yr}, 12, 31), 12, "December", ${yr}, ${yr}, 12, 12}`);
            rowsM.push(`{"Gross Profit", "Egypt", "${companyName} - Gross Margin", "None", 1, 0, ${gp}, 0, 0, ${gp}, #date(${yr}, 12, 31), 12, "December", ${yr}, ${yr}, 12, 12}`);
            rowsM.push(`{"Net Profit", "Egypt", "${companyName} - Bottom Line", "None", 1, 0, ${np}, 0, 0, ${np}, #date(${yr}, 12, 31), 12, "December", ${yr}, ${yr}, 12, 12}`);
            rowsM.push(`{"Total Assets", "Egypt", "${companyName} - Balance Sheet", "None", 1, 0, ${ta}, 0, 0, ${ta}, #date(${yr}, 12, 31), 12, "December", ${yr}, ${yr}, 12, 12}`);
            rowsM.push(`{"Current Assets", "Egypt", "${companyName} - Working Capital", "None", 1, 0, ${ca}, 0, 0, ${ca}, #date(${yr}, 12, 31), 12, "December", ${yr}, ${yr}, 12, 12}`);
            rowsM.push(`{"Cash & Banks", "Egypt", "${companyName} - Liquidity", "None", 1, 0, ${cash}, 0, 0, ${cash}, #date(${yr}, 12, 31), 12, "December", ${yr}, ${yr}, 12, 12}`);
            rowsM.push(`{"Total Equity", "Egypt", "${companyName} - Net Worth", "None", 1, 0, ${te}, 0, 0, ${te}, #date(${yr}, 12, 31), 12, "December", ${yr}, ${yr}, 12, 12}`);
            rowsM.push(`{"Total Liabilities", "Egypt", "${companyName} - Obligations", "None", 1, 0, ${tl}, 0, ${tl}, -${tl}, #date(${yr}, 12, 31), 12, "December", ${yr}, ${yr}, 12, 12}`);
          }

          const mScript = `section Section1;

shared financials = let
    // 1. Try to load companion Excel file if available in folder
    SourceFile = try Excel.Workbook(File.Contents("Financial Sample.xlsx"), null, true) otherwise null,
    
    // 2. Fallback to pre-compiled company financial data table
    FallbackTable = #table(
        type table [
            Segment = text,
            Country = text,
            Product = text,
            #"Discount Band" = text,
            #"Units Sold" = number,
            #"Manufacturing Price" = number,
            #"Sale Price" = number,
            #"Discounts on Purchase" = number,
            COGS = number,
            Profit = number,
            Date = date,
            #"Month Number" = number,
            #"Month Name" = text,
            Year = number,
            #"Date -Year" = number,
            #"Date - Month" = number,
            #"Date - Month number" = number
        ],
        {
            ${rowsM.join(',\n            ')}
        }
    ),
    
    Result = if SourceFile <> null and try SourceFile{[Item="financials",Kind="Table"]}[Data] <> null then
        SourceFile{[Item="financials",Kind="Table"]}[Data]
    else
        FallbackTable
in
    Result;
`;
          innerZip.file('Formulas/Section1.m', mScript);
          const newInnerZipBuf = await innerZip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });

          const newDmBuf = new Uint8Array(8 + newInnerZipBuf.byteLength + rest.byteLength);
          const newView = new DataView(newDmBuf.buffer);
          newView.setUint32(0, version, true);
          newView.setUint32(4, newInnerZipBuf.byteLength, true);
          newDmBuf.set(newInnerZipBuf, 8);
          newDmBuf.set(rest, 8 + newInnerZipBuf.byteLength);

          zip.file('DataMashup', newDmBuf);
        }
      }
    } catch (err) {
      console.warn('Failed to update DataMashup, preserving original:', err);
    }
  }

  // Generate output .pbix package
  const finalPbix = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  return finalPbix;
}
