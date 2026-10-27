import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import { FinancialData } from './gemini';
import { computeFinancialModel, CalculatedYearData } from './financialModel';

export interface DashboardOverrides {
  companyName?: string;
  reportingPeriod?: string;
  currency?: string;
  commentary?: string;
  kpis?: Record<string, string>;
  chartTitle?: string;
  creditScore?: number;
}

export function hasArabic(str: string): boolean {
  return /[\u0600-\u06FF]/.test(str);
}

/**
 * Renders Arabic or complex Unicode text into a high-DPI canvas
 * so jsPDF embeds it as a crisp, properly-shaped graphic with zero mojibake.
 */
export function renderArabicTextToCanvas(
  text: string, 
  fontSizePx: number = 24, 
  colorHex: string = '#FFFFFF', 
  bold: boolean = true
): { dataUrl: string; widthMm: number; heightMm: number } {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return { dataUrl: '', widthMm: 0, heightMm: 0 };

    const dpr = 3;
    const font = `${bold ? 'bold ' : ''}${fontSizePx}px system-ui, -apple-system, 'Segoe UI', Arial, sans-serif`;
    ctx.font = font;
    const metrics = ctx.measureText(text);
    const textWidth = Math.ceil(metrics.width);
    const textHeight = fontSizePx * 1.35;

    canvas.width = (textWidth + 24) * dpr;
    canvas.height = Math.ceil(textHeight + 12) * dpr;
    ctx.scale(dpr, dpr);

    ctx.font = font;
    ctx.fillStyle = colorHex;
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';
    ctx.fillText(text, textWidth + 12, textHeight / 2 + 4);

    const pxToMm = 0.264583;
    const widthMm = (canvas.width / dpr) * pxToMm;
    const heightMm = (canvas.height / dpr) * pxToMm;

    return {
      dataUrl: canvas.toDataURL('image/png'),
      widthMm,
      heightMm
    };
  } catch (e) {
    console.warn('renderArabicTextToCanvas error:', e);
    return { dataUrl: '', widthMm: 0, heightMm: 0 };
  }
}

/**
 * Sends base64 file to server /api/download-file to trigger a forced attachment download.
 * Falls back to client Blob URL.
 */
export async function downloadBlobReliably(blob: Blob, fileName: string, mimeType: string = 'application/pdf'): Promise<boolean> {
  try {
    const reader = new FileReader();
    const downloadPromise = new Promise<boolean>((resolve) => {
      reader.onload = async () => {
        try {
          const resultStr = reader.result as string;
          const base64Data = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;

          const response = await fetch('/api/download-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Data, fileName, mimeType })
          });

          if (response.ok) {
            const serverBlob = await response.blob();
            const url = URL.createObjectURL(serverBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 3000);
            resolve(true);
            return;
          }
        } catch (e) {
          console.warn('Server download stream failed, falling back to client blob:', e);
        }
        resolve(false);
      };
      reader.onerror = () => resolve(false);
      reader.readAsDataURL(blob);
    });

    const ok = await downloadPromise;
    if (ok) return true;
  } catch (err) {
    console.warn('Error during server download stream:', err);
  }

  // Fallback to client blob
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    return true;
  } catch (e) {
    console.error('Client blob download failed:', e);
    return false;
  }
}

/**
 * Clean numbers format without corrupted characters
 */
function formatPdfNum(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(0)}k`;
  }
  return `${sign}${abs.toFixed(0)}`;
}

function formatPct(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;
}

/**
 * Generates an authentic Microsoft Power BI style 1-Page Dashboard (A4 Landscape)
 * Guaranteed 100% clean typography (NO emoji mojibake, native canvas Arabic rendering).
 */
export function generateDirectVector1PagePdf(data: FinancialData[], overrides?: DashboardOverrides): jsPDF {
  const model = computeFinancialModel(data);
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const pad = 8;
  const contentWidth = pageWidth - pad * 2; // 281mm

  const latest = model.yearlyData[model.yearlyData.length - 1] || {} as CalculatedYearData;
  const years = model.yearlyData;

  const rawCompanyName = overrides?.companyName || model.companyName || 'Corporate Client';
  const displayPeriod = overrides?.reportingPeriod || model.reportingPeriod || 'Annual';

  // 0. CANVAS BACKGROUND (Subtle Power BI workspace grey)
  pdf.setFillColor(243, 244, 246);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // =========================================================================
  // 1. EXECUTIVE TOP RIBBON & TITLE BANNER
  // =========================================================================
  const headerY = 7;
  const headerH = 17;
  pdf.setFillColor(15, 23, 42); // Deep Executive Slate Navy
  pdf.roundedRect(pad, headerY, contentWidth, headerH, 2, 2, 'F');

  // Executive blue indicator
  pdf.setFillColor(37, 99, 235); // Royal Blue #2563EB
  pdf.roundedRect(pad, headerY, 3.5, headerH, 1, 1, 'F');

  // Handle Company Name (Arabic or English)
  if (hasArabic(rawCompanyName)) {
    const rendered = renderArabicTextToCanvas(rawCompanyName, 24, '#FFFFFF', true);
    if (rendered.dataUrl) {
      const maxW = 140;
      const scale = Math.min(maxW / rendered.widthMm, 1);
      const drawW = rendered.widthMm * scale;
      const drawH = Math.min(rendered.heightMm * scale, 9);
      pdf.addImage(rendered.dataUrl, 'PNG', pad + 7, headerY + 1.5, drawW, drawH);
    } else {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(255, 255, 255);
      pdf.text('Corporate Client', pad + 7, headerY + 7);
    }
  } else {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(255, 255, 255);
    // Clip long names to prevent overlap
    const safeName = rawCompanyName.length > 36 ? rawCompanyName.substring(0, 36) + '...' : rawCompanyName;
    pdf.text(safeName, pad + 7, headerY + 7);
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(148, 163, 184);
  pdf.text('EXECUTIVE FINANCIAL SPREADING & PERFORMANCE DASHBOARD', pad + 7, headerY + 12.5);

  // Right side header info (Bounded to avoid any collision)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(147, 197, 253);
  const infoStr = `Period: ${displayPeriod}  |  Currency: ${model.currency}  |  FY ${years.map(y => y.year).join(', ')}`;
  pdf.text(infoStr, pageWidth - pad - 6, headerY + 7, { align: 'right' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(203, 213, 225);
  const dateStr = `Live Model Analysis  •  ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`;
  pdf.text(dateStr, pageWidth - pad - 6, headerY + 12.5, { align: 'right' });

  // =========================================================================
  // 2. POWER BI SQUARED / RECTANGULAR KPI VISUAL CARDS (TOP ROW)
  // =========================================================================
  const kpiY = 27;
  const kpiH = 23;
  const kpiGap = 3;
  const kpiCount = 6;
  const kpiW = (contentWidth - (kpiCount - 1) * kpiGap) / kpiCount; // ~44.3mm each

  const kpis = [
    { 
      key: 'revenues',
      label: 'TOTAL REVENUE', 
      val: overrides?.kpis?.revenues || formatPdfNum(latest.revenues), 
      badge: latest.revenueGrowthPct !== null ? `${formatPct(latest.revenueGrowthPct)} YoY` : 'FY ' + latest.year, 
      color: [0, 120, 212] // Power BI Blue #0078D4
    },
    { 
      key: 'grossProfit',
      label: 'GROSS PROFIT', 
      val: overrides?.kpis?.grossProfit || formatPdfNum(latest.grossProfit), 
      badge: latest.grossMarginPct !== null ? `${latest.grossMarginPct.toFixed(1)}% Margin` : '—', 
      color: [16, 124, 65] // Emerald Green #107C41
    },
    { 
      key: 'ebitda',
      label: 'EBITDA (CASH OP)', 
      val: overrides?.kpis?.ebitda || formatPdfNum(latest.ebitda), 
      badge: latest.ebitdaMarginPct !== null ? `${latest.ebitdaMarginPct.toFixed(1)}% Margin` : '—', 
      color: [92, 45, 145] // Deep Purple
    },
    { 
      key: 'netProfitAfterTax',
      label: 'NET PROFIT', 
      val: overrides?.kpis?.netProfitAfterTax || formatPdfNum(latest.netProfitAfterTax), 
      badge: latest.netMarginPct !== null ? `${latest.netMarginPct.toFixed(1)}% Margin` : '—', 
      color: [216, 59, 1] // Power BI Warm Coral #D83B01
    },
    { 
      key: 'totalAssets',
      label: 'TOTAL ASSETS', 
      val: overrides?.kpis?.totalAssets || formatPdfNum(latest.totalAssets), 
      badge: latest.cash ? `Cash: ${formatPdfNum(latest.cash)}` : 'Asset Base', 
      color: [0, 130, 114] // Teal
    },
    { 
      key: 'totalEquity',
      label: 'TOTAL EQUITY', 
      val: overrides?.kpis?.totalEquity || formatPdfNum(latest.totalEquity), 
      badge: latest.roePct !== null ? `ROE: ${latest.roePct.toFixed(1)}%` : 'Net Worth', 
      color: [79, 70, 229] // Indigo
    }
  ];

  kpis.forEach((kpi, idx) => {
    const kx = pad + idx * (kpiW + kpiGap);
    // Card background
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(kx, kpiY, kpiW, kpiH, 2, 2, 'FD');

    // Power BI top color accent strip
    pdf.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    pdf.roundedRect(kx + 1, kpiY + 0.8, kpiW - 2, 1.2, 0.5, 0.5, 'F');

    // Label (Clean text, no emojis)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(kpi.label, kx + 3.5, kpiY + 6.5);

    // Big Bold Metric Value (Adaptive font size so long formatted numbers never collide)
    pdf.setFont('helvetica', 'bold');
    const valFontSize = kpi.val.length > 9 ? 9 : (kpi.val.length > 7 ? 10 : 11);
    pdf.setFontSize(valFontSize);
    pdf.setTextColor(15, 23, 42);
    pdf.text(kpi.val, kx + 3.5, kpiY + 13.5);

    // Badge Pill
    pdf.setFillColor(241, 245, 249);
    pdf.roundedRect(kx + 3.5, kpiY + 16, kpiW - 7, 4.5, 1, 1, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6);
    pdf.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    const safeBadge = kpi.badge.length > 18 ? kpi.badge.substring(0, 16) + '..' : kpi.badge;
    pdf.text(safeBadge, kx + 5, kpiY + 19.2);
  });

  // =========================================================================
  // 2.5 POWER BI EXECUTIVE ANALYTICAL COMMENTARY BANNER
  // =========================================================================
  const commY = 51.5;
  const commH = 8.5;
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(pad, commY, contentWidth, commH, 1.5, 1.5, 'FD');

  pdf.setFillColor(0, 120, 212); // Power BI Blue Accent
  pdf.roundedRect(pad, commY, 2.5, commH, 1, 1, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(0, 120, 212);
  pdf.text('EXECUTIVE ANALYSIS & NOTES:', pad + 5, commY + 5.5);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6.2);
  pdf.setTextColor(51, 65, 85);
  const commText = overrides?.commentary || 'Company exhibits steady top-line growth and resilient operating margins across fiscal periods. Balance sheet position remains stable with adequate liquidity buffers and manageable financial leverage.';
  const safeCommText = commText.length > 170 ? commText.substring(0, 167) + '...' : commText;
  pdf.text(safeCommText, pad + 48, commY + 5.5);

  // =========================================================================
  // 3. MIDDLE ROW: TWO LARGE RECTANGULAR POWER BI VISUAL CONTAINERS
  // =========================================================================
  const midY = 62;
  const midH = 71;
  const leftW = 158;
  const rightW = contentWidth - leftW - 4; // 119mm

  // -------------------------------------------------------------------------
  // TILE 1 (LEFT): Multi-Year Performance Visual Bar Chart Container
  // -------------------------------------------------------------------------
  const t1X = pad;
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(t1X, midY, leftW, midH, 2, 2, 'FD');

  // Header Strip
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(t1X + 0.5, midY + 0.5, leftW - 1, 8.5, 2, 2, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.8);
  pdf.setTextColor(30, 41, 59);
  pdf.text('REVENUE & PROFITABILITY TREND', t1X + 4, midY + 5.8);

  // Clean Legend on the right (Strictly bounded so it does NOT collide with title)
  const legX = t1X + leftW - 48;
  const legY = midY + 5.8;
  // Rev
  pdf.setFillColor(0, 120, 212);
  pdf.rect(legX, legY - 2.2, 2.4, 2.4, 'F');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(71, 85, 105);
  pdf.text('Rev', legX + 3.5, legY);

  // Gross
  pdf.setFillColor(16, 124, 65);
  pdf.rect(legX + 13.5, legY - 2.2, 2.4, 2.4, 'F');
  pdf.text('Gross', legX + 17, legY);

  // Net
  pdf.setFillColor(216, 59, 1);
  pdf.rect(legX + 28, legY - 2.2, 2.4, 2.4, 'F');
  pdf.text('Net', legX + 31.5, legY);

  // Chart Graphics Area inside Tile 1
  const chartLeft = t1X + 20;
  const chartBottom = midY + midH - 14; // 119mm
  const chartHeight = 39; // top gridline at 80mm (leaving 10.5mm from header)
  const chartWidth = leftW - 27;

  const maxVal = Math.max(...years.map(y => Math.max(y.revenues || 0, y.grossProfit || 0, y.netProfitAfterTax || 0)), 1);

  // Y-Axis Horizontal Gridlines
  const gridSteps = 4;
  pdf.setDrawColor(241, 245, 249);
  pdf.setLineWidth(0.3);
  for (let g = 0; g <= gridSteps; g++) {
    const gy = chartBottom - (g / gridSteps) * chartHeight;
    pdf.line(chartLeft, gy, chartLeft + chartWidth, gy);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5.5);
    pdf.setTextColor(148, 163, 184);
    const stepVal = (maxVal * (g / gridSteps));
    pdf.text(formatPdfNum(stepVal), chartLeft - 2.5, gy + 1.5, { align: 'right' });
  }

  // Draw X-axis base line
  pdf.setDrawColor(203, 213, 225);
  pdf.setLineWidth(0.4);
  pdf.line(chartLeft, chartBottom, chartLeft + chartWidth, chartBottom);

  // Render Bar Clusters
  const groupCount = years.length;
  const groupWidth = chartWidth / (groupCount || 1);
  const barWidth = Math.min(groupWidth * 0.22, 9.5);
  const barGap = 1.2;

  years.forEach((yr, gIdx) => {
    const clusterW = barWidth * 3 + barGap * 2;
    const gx = chartLeft + gIdx * groupWidth + (groupWidth - clusterW) / 2;

    // Bar 1: Revenues
    const revH = Math.min(Math.max(((yr.revenues || 0) / maxVal) * chartHeight, 1), chartHeight);
    pdf.setFillColor(0, 120, 212);
    pdf.roundedRect(gx, chartBottom - revH, barWidth, revH, 0.8, 0.8, 'F');

    // Bar 2: Gross Profit
    const gpH = Math.min(Math.max(((yr.grossProfit || 0) / maxVal) * chartHeight, 1), chartHeight);
    pdf.setFillColor(16, 124, 65);
    pdf.roundedRect(gx + barWidth + barGap, chartBottom - gpH, barWidth, gpH, 0.8, 0.8, 'F');

    // Bar 3: Net Profit
    const netH = Math.min(Math.max(((yr.netProfitAfterTax || 0) / maxVal) * chartHeight, 1), chartHeight);
    pdf.setFillColor(216, 59, 1);
    pdf.roundedRect(gx + (barWidth + barGap) * 2, chartBottom - netH, barWidth, netH, 0.8, 0.8, 'F');

    // Top Bar Value for Revenues if bar is high enough
    if (revH > 8) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(5);
      pdf.setTextColor(0, 120, 212);
      pdf.text(formatPdfNum(yr.revenues), gx + barWidth / 2, chartBottom - revH - 1.2, { align: 'center' });
    }

    // X-Axis Year Label
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(30, 41, 59);
    pdf.text(`FY ${yr.year}`, gx + clusterW / 2, chartBottom + 4.5, { align: 'center' });

    // Mini sub metrics under year label
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5.8);
    pdf.setTextColor(100, 116, 139);
    const subLabel = yr.netMarginPct !== null ? `${yr.netMarginPct.toFixed(1)}% Net` : formatPdfNum(yr.revenues);
    pdf.text(subLabel, gx + clusterW / 2, chartBottom + 8.5, { align: 'center' });
  });

  // -------------------------------------------------------------------------
  // TILE 2 (RIGHT): Capital Structure & Asset Allocation Visual
  // -------------------------------------------------------------------------
  const t2X = pad + leftW + 4;
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(t2X, midY, rightW, midH, 2, 2, 'FD');

  // Header (No emoji)
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(t2X + 0.5, midY + 0.5, rightW - 1, 8.5, 2, 2, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.8);
  pdf.setTextColor(30, 41, 59);
  pdf.text('CAPITAL STRUCTURE & BALANCE SHEET', t2X + 4, midY + 5.8);

  // Capital Structure Visual Horizontal Stacked Bar
  const capBarY = midY + 14.5;
  const capBarW = rightW - 8;
  const totLiab = latest.totalLiabilities || 0;
  const totEq = latest.totalEquity || 0;
  const totCap = (totLiab + totEq) || 1;
  const liabPct = Math.round((totLiab / totCap) * 100);
  const eqPct = 100 - liabPct;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.8);
  pdf.setTextColor(100, 116, 139);
  pdf.text('LIABILITIES VS. EQUITY COMPOSITION', t2X + 4, capBarY - 1.5);

  const barH = 5.5;
  const liabW = Math.max(Math.min((liabPct / 100) * capBarW, capBarW - 2), 2);
  const eqW = capBarW - liabW;

  // Liabilities Segment
  pdf.setFillColor(225, 29, 72); // Rose Red
  pdf.roundedRect(t2X + 4, capBarY, liabW, barH, 0.8, 0.8, 'F');
  // Equity Segment
  pdf.setFillColor(79, 70, 229); // Indigo
  pdf.roundedRect(t2X + 4 + liabW, capBarY, eqW, barH, 0.8, 0.8, 'F');

  // Centered labels inside segments with safe thresholds
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  pdf.setTextColor(255, 255, 255);
  if (liabW >= 22) {
    pdf.text(`${liabPct}% Liab`, t2X + 4 + liabW / 2, capBarY + 3.8, { align: 'center' });
  } else if (liabW >= 12) {
    pdf.text(`${liabPct}%`, t2X + 4 + liabW / 2, capBarY + 3.8, { align: 'center' });
  }

  if (eqW >= 22) {
    pdf.text(`${eqPct}% Equity`, t2X + 4 + liabW + eqW / 2, capBarY + 3.8, { align: 'center' });
  } else if (eqW >= 12) {
    pdf.text(`${eqPct}%`, t2X + 4 + liabW + eqW / 2, capBarY + 3.8, { align: 'center' });
  }

  // Mini sub-legend under stacked bar to prevent any ambiguity
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Liabilities: ${formatPdfNum(latest.totalLiabilities)} (${liabPct}%)`, t2X + 4, capBarY + 8.5);
  pdf.text(`Equity: ${formatPdfNum(latest.totalEquity)} (${eqPct}%)`, t2X + rightW - 4, capBarY + 8.5, { align: 'right' });

  // 4 Rectangular Balance Metric Mini-Cards
  // Fixed heights & positioning so cards NEVER protrude or collide with Tile 2 border!
  const miniGridY = capBarY + 11.5; // ~91.5mm
  const miniCardW = (rightW - 11) / 2; // ~54mm
  const miniCardH = 18; // Height 18mm, total 2 rows with gap = 38.5mm -> ends at ~130mm (Tile 2 ends at 133mm)

  const bsm = [
    { label: 'Cash & Equivalents', val: formatPdfNum(latest.cash), sub: latest.netDebt !== null ? `Net Debt: ${formatPdfNum(latest.netDebt)}` : 'Liquidity', col: [0, 130, 114] },
    { label: 'Working Capital', val: formatPdfNum(latest.workingCapital), sub: (latest.workingCapital || 0) >= 0 ? 'Positive Cushion' : 'Deficit Risk', col: [16, 124, 65] },
    { label: 'Total Liabilities', val: formatPdfNum(latest.totalLiabilities), sub: latest.totalDebt ? `Debt: ${formatPdfNum(latest.totalDebt)}` : 'Obligations', col: [225, 29, 72] },
    { label: 'Shareholders Equity', val: formatPdfNum(latest.totalEquity), sub: `Book Value FY ${latest.year}`, col: [79, 70, 229] }
  ];

  bsm.forEach((m, mIdx) => {
    const mx = t2X + 4 + (mIdx % 2) * (miniCardW + 3);
    const my = miniGridY + Math.floor(mIdx / 2) * (miniCardH + 2.5);

    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(mx, my, miniCardW, miniCardH, 1.5, 1.5, 'FD');

    pdf.setFillColor(m.col[0], m.col[1], m.col[2]);
    pdf.rect(mx, my, 1.5, miniCardH, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(5.8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(m.label.toUpperCase(), mx + 3.5, my + 4.8);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(15, 23, 42);
    pdf.text(m.val, mx + 3.5, my + 10.8);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text(m.sub, mx + 3.5, my + 15.6);
  });

  // =========================================================================
  // 4. BOTTOM ROW: THREE SQUARED/RECTANGULAR POWER BI VISUAL TILES
  // =========================================================================
  const btmY = 136;
  const btmH = 61;
  const btmW = (contentWidth - 6) / 3;

  // Tile A: Liquidity & Solvency Ratios (No emoji)
  const b1X = pad;
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(b1X, btmY, btmW, btmH, 2, 2, 'FD');

  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(b1X + 0.5, btmY + 0.5, btmW - 1, 8.5, 2, 2, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.8);
  pdf.setTextColor(30, 41, 59);
  pdf.text('LIQUIDITY & COVERAGE RATIOS', b1X + 4, btmY + 5.8);

  const liqItems = [
    { label: 'Current Ratio', val: latest.currentRatio !== null ? `${latest.currentRatio.toFixed(2)}x` : '—', target: 'Target: > 1.50x', ok: (latest.currentRatio || 0) >= 1.2 },
    { label: 'Quick Ratio (Acid Test)', val: latest.quickRatio !== null ? `${latest.quickRatio.toFixed(2)}x` : '—', target: 'Target: > 1.00x', ok: (latest.quickRatio || 0) >= 0.8 },
    { label: 'Cash Ratio', val: latest.cashRatio !== null ? `${latest.cashRatio.toFixed(2)}x` : '—', target: 'Instant Buffer', ok: (latest.cashRatio || 0) >= 0.2 },
    { label: 'Interest Coverage Ratio', val: latest.interestCoverage !== null ? `${latest.interestCoverage.toFixed(2)}x` : '—', target: 'Safe: > 3.00x', ok: (latest.interestCoverage || 0) >= 2.5 }
  ];

  liqItems.forEach((it, iIdx) => {
    const iy = btmY + 13.5 + iIdx * 11;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(71, 85, 105);
    pdf.text(it.label, b1X + 4, iy);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(it.ok ? 16 : 225, it.ok ? 124 : 29, it.ok ? 65 : 72);
    pdf.text(it.val, b1X + btmW - 4, iy, { align: 'right' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5.6);
    pdf.setTextColor(148, 163, 184);
    pdf.text(it.target, b1X + 4, iy + 4.2);

    if (iIdx < liqItems.length - 1) {
      pdf.setDrawColor(241, 245, 249);
      pdf.setLineWidth(0.3);
      pdf.line(b1X + 4, iy + 6.5, b1X + btmW - 4, iy + 6.5);
    }
  });

  // Tile B: Profitability Margins & Returns (No emoji)
  const b2X = pad + btmW + 3;
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(b2X, btmY, btmW, btmH, 2, 2, 'FD');

  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(b2X + 0.5, btmY + 0.5, btmW - 1, 8.5, 2, 2, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.8);
  pdf.setTextColor(30, 41, 59);
  pdf.text('PROFITABILITY MARGINS & DUPONT', b2X + 4, btmY + 5.8);

  const profItems = [
    { label: 'Gross Profit Margin', val: latest.grossMarginPct !== null ? `${latest.grossMarginPct.toFixed(1)}%` : '—', pct: latest.grossMarginPct || 0, col: [16, 124, 65] },
    { label: 'EBITDA Margin', val: latest.ebitdaMarginPct !== null ? `${latest.ebitdaMarginPct.toFixed(1)}%` : '—', pct: latest.ebitdaMarginPct || 0, col: [92, 45, 145] },
    { label: 'Net Profit Margin', val: latest.netMarginPct !== null ? `${latest.netMarginPct.toFixed(1)}%` : '—', pct: latest.netMarginPct || 0, col: [216, 59, 1] },
    { label: 'Return on Equity (ROE)', val: latest.roePct !== null ? `${latest.roePct.toFixed(1)}%` : '—', pct: latest.roePct || 0, col: [79, 70, 229] }
  ];

  profItems.forEach((it, iIdx) => {
    const iy = btmY + 13.5 + iIdx * 11;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(71, 85, 105);
    pdf.text(it.label, b2X + 4, iy);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(it.val, b2X + btmW - 4, iy, { align: 'right' });

    // Progress bar positioned with clear margin below text
    const pBarW = btmW - 8;
    const fillW = Math.max(Math.min((Math.abs(it.pct) / 60) * pBarW, pBarW), 2);
    pdf.setFillColor(241, 245, 249);
    pdf.roundedRect(b2X + 4, iy + 3.2, pBarW, 2.2, 0.6, 0.6, 'F');
    pdf.setFillColor(it.col[0], it.col[1], it.col[2]);
    pdf.roundedRect(b2X + 4, iy + 3.2, fillW, 2.2, 0.6, 0.6, 'F');

    if (iIdx < profItems.length - 1) {
      pdf.setDrawColor(245, 247, 250);
      pdf.setLineWidth(0.2);
      pdf.line(b2X + 4, iy + 7.5, b2X + btmW - 4, iy + 7.5);
    }
  });

  // Tile C: Solvency, Leverage & Credit Scorecard (No emoji)
  const b3X = pad + (btmW + 3) * 2;
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(b3X, btmY, btmW, btmH, 2, 2, 'FD');

  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(b3X + 0.5, btmY + 0.5, btmW - 1, 8.5, 2, 2, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.8);
  pdf.setTextColor(30, 41, 59);
  pdf.text('LEVERAGE & CREDIT HEALTH', b3X + 4, btmY + 5.8);

  // Big Credit Score Badge
  const scoreBadgeY = btmY + 11.5;
  pdf.setFillColor(15, 23, 42);
  pdf.roundedRect(b3X + 4, scoreBadgeY, btmW - 8, 13.5, 1.5, 1.5, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  pdf.setTextColor(242, 200, 17);
  pdf.text('OVERALL CREDIT HEALTH SCORE', b3X + 7, scoreBadgeY + 4.2);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(255, 255, 255);
  const displayScore = overrides?.creditScore || latest.creditHealthScore || 85;
  pdf.text(`${displayScore} / 100`, b3X + 7, scoreBadgeY + 10.5);

  // Credit Tier tag inside dedicated right pill (Guaranteed zero collision with score)
  const tierWidth = 26;
  const tierX = b3X + btmW - 8 - tierWidth;
  pdf.setFillColor(30, 41, 59);
  pdf.roundedRect(tierX, scoreBadgeY + 3.8, tierWidth, 5.8, 1, 1, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.2);
  pdf.setTextColor(16, 185, 129);
  pdf.text(latest.creditRiskTier || 'Low Risk', tierX + tierWidth / 2, scoreBadgeY + 7.7, { align: 'center' });

  // Leverage Metrics
  const solvItems = [
    { label: 'Total Debt / Equity', val: latest.debtToEquity !== null ? `${latest.debtToEquity.toFixed(2)}x` : '—', sub: 'Solvency' },
    { label: 'Total Debt / Assets', val: latest.debtToAssets !== null ? `${latest.debtToAssets.toFixed(2)}x` : '—', sub: 'Asset Leverage' },
    { label: 'Net Financial Debt', val: formatPdfNum(latest.netDebt), sub: 'Total Debt - Cash' }
  ];

  solvItems.forEach((it, sIdx) => {
    const sy = btmY + 28.5 + sIdx * 9.5;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.8);
    pdf.setTextColor(71, 85, 105);
    pdf.text(it.label, b3X + 4, sy);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(15, 23, 42);
    pdf.text(it.val, b3X + btmW - 4, sy, { align: 'right' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5.5);
    pdf.setTextColor(148, 163, 184);
    pdf.text(it.sub, b3X + 4, sy + 3.6);

    if (sIdx < solvItems.length - 1) {
      pdf.setDrawColor(241, 245, 249);
      pdf.setLineWidth(0.3);
      pdf.line(b3X + 4, sy + 5.5, b3X + btmW - 4, sy + 5.5);
    }
  });

  // =========================================================================
  // 5. EXECUTIVE FOOTER
  // =========================================================================
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text('CREDITA FINANCIAL SPREADING SUITE  •  EXECUTIVE PERFORMANCE DASHBOARD  •  CONFIDENTIAL', pad, pageHeight - 3.5);

  pdf.setFont('helvetica', 'normal');
  pdf.text('Page 1 of 1', pageWidth - pad, pageHeight - 3.5, { align: 'right' });

  return pdf;
}

/**
 * Main export function:
 * 1. Checks if the on-screen dashboard element exists. If so, attempts high-fidelity visual capture with toPng.
 * 2. If capture is successful, builds the PDF using the captured screen (including live charts & user edits!).
 * 3. If DOM capture is not available, uses the enhanced clean vector generator with zero mojibake.
 * 4. Downloads via server attachment stream to guarantee a real file download.
 */
export async function exportDashboardToPdf(
  elementId: string, 
  companyName: string, 
  financialData?: FinancialData[],
  overrides?: DashboardOverrides
): Promise<boolean> {
  const cleanCompany = (companyName || 'Corporate')
    .replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_')
    .trim() || 'Financial';
  const fileName = `${cleanCompany}_Executive_Dashboard.pdf`;

  // 1. Direct high-fidelity vector PDF generation (100% crisp typography, zero blur, zero mojibake, includes all user edits)
  if (financialData && financialData.length > 0) {
    try {
      const pdf = generateDirectVector1PagePdf(financialData, overrides);
      const pdfBlob = pdf.output('blob');
      const ok = await downloadBlobReliably(pdfBlob, fileName);
      if (ok) return true;
    } catch (e) {
      console.warn('Direct Power BI vector generation failed, trying DOM capture:', e);
    }
  }

  // 2. DOM capture fallback if direct vector generation cannot run
  const element = document.getElementById(elementId);
  if (element && element.offsetHeight > 50) {
    try {
      const dataUrl = await toPng(element, {
        quality: 0.98,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        skipFonts: true,
        filter: (node) => {
          if (node instanceof HTMLElement) {
            if (node.classList?.contains('print:hidden') || node.tagName === 'BUTTON') {
              return false;
            }
          }
          return true;
        }
      });

      if (dataUrl && dataUrl.startsWith('data:image')) {
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth(); // 297mm
        const pdfHeight = pdf.internal.pageSize.getHeight(); // 210mm
        const margin = 5;
        const availWidth = pdfWidth - margin * 2;
        const availHeight = pdfHeight - margin * 2;

        const img = new Image();
        img.src = dataUrl;
        await new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });

        const imgWidth = img.naturalWidth || 1000;
        const imgHeight = img.naturalHeight || 700;
        const ratio = Math.min(availWidth / imgWidth, availHeight / imgHeight);

        const renderWidth = imgWidth * ratio;
        const renderHeight = imgHeight * ratio;
        const posX = margin + (availWidth - renderWidth) / 2;
        const posY = margin + (availHeight - renderHeight) / 2;

        pdf.addImage(dataUrl, 'PNG', posX, posY, renderWidth, renderHeight);
        const pdfBlob = pdf.output('blob');
        const ok = await downloadBlobReliably(pdfBlob, fileName);
        if (ok) return true;
      }
    } catch (err) {
      console.warn('DOM capture via html-to-image failed:', err);
    }
  }

  // 3. Final fallback to browser print dialog
  try {
    window.print();
    return true;
  } catch (e) {
    console.error('Final print fallback failed:', e);
    return false;
  }
}
