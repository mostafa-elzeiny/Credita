import { ModelSummary } from './financialModel';

export function generateStandaloneHtmlReport(summary: ModelSummary, excelBase64?: string): string {
  const currency = summary.currency || 'EGP';
  const cName = summary.companyName || 'Corporate Client';
  const years = summary.years;
  const latest = summary.yearlyData[summary.yearlyData.length - 1];

  // Clean formatting for table numbers without repeating currency or 'thousand' on every cell
  const formatNum = (val: number | null | undefined): string => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    const abs = Math.abs(val);
    const formatted = abs.toLocaleString('en-US', { maximumFractionDigits: 0 });
    return val < 0 ? `(${formatted})` : formatted;
  };

  const safePct = (val: number | null | undefined): string => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    const sign = val > 0 ? '+' : '';
    return `${sign}${val.toFixed(1)}%`;
  };

  const safeRatio = (val: number | null | undefined): string => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return `${val.toFixed(2)}x`;
  };

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cName} - تقرير التحليل المالي والائتماني</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: #141b2d;
      --card-border: #232f48;
      --card-hover: #1a233a;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --primary: #f59e0b;
      --primary-hover: #d97706;
      --primary-light: rgba(245, 158, 11, 0.12);
      --accent-blue: #38bdf8;
      --accent-green: #10b981;
      --accent-red: #f43f5e;
      --border-light: rgba(255, 255, 255, 0.06);
    }
    .light {
      --bg: #f8fafc;
      --card-bg: #ffffff;
      --card-border: #e2e8f0;
      --card-hover: #f1f5f9;
      --text-main: #0f172a;
      --text-muted: #64748b;
      --text-dim: #94a3b8;
      --primary: #d97706;
      --primary-hover: #b45309;
      --primary-light: rgba(217, 119, 6, 0.1);
      --accent-blue: #0284c7;
      --accent-green: #059669;
      --accent-red: #e11d48;
      --border-light: rgba(0, 0, 0, 0.06);
    }
    * { 
      box-sizing: border-box; 
      margin: 0; 
      padding: 0; 
    }
    body { 
      background-color: var(--bg); 
      color: var(--text-main); 
      font-family: 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6; 
      padding: 24px; 
      transition: background-color 0.2s, color 0.2s; 
      direction: rtl;
      text-align: right;
    }
    .container { 
      max-width: 1320px; 
      margin: 0 auto; 
    }
    
    /* Numeric isolation to prevent Arabic/English BiDi overlap */
    .num {
      font-family: 'Inter', -apple-system, sans-serif;
      direction: ltr;
      display: inline-block;
      unicode-bidi: isolate;
      font-variant-numeric: tabular-nums;
    }
    .unit {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      margin-inline-start: 4px;
      font-family: 'Cairo', sans-serif;
    }

    /* Header */
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      padding-bottom: 22px; 
      border-bottom: 1px solid var(--card-border); 
      margin-bottom: 24px; 
      flex-wrap: wrap; 
      gap: 16px; 
    }
    .title-area h1 { 
      font-size: 28px; 
      font-weight: 800; 
      color: var(--text-main); 
      margin-bottom: 6px; 
      letter-spacing: -0.5px;
    }
    .meta-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 14px;
      color: var(--text-muted);
    }
    .meta-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: 8px;
      background: var(--primary-light);
      color: var(--primary);
      font-weight: 700;
      font-size: 12px;
      border: 1px solid rgba(245, 158, 11, 0.25);
    }
    .unit-badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 8px;
      background: rgba(56, 189, 248, 0.12);
      color: var(--accent-blue);
      font-weight: 700;
      font-size: 12px;
      border: 1px solid rgba(56, 189, 248, 0.25);
    }
    .controls { 
      display: flex; 
      gap: 10px; 
      align-items: center;
    }
    .btn { 
      padding: 9px 18px; 
      border-radius: 12px; 
      font-weight: 700; 
      font-size: 13px; 
      cursor: pointer; 
      border: 1px solid var(--card-border); 
      background: var(--card-bg); 
      color: var(--text-main); 
      transition: all 0.2s; 
      display: inline-flex; 
      align-items: center; 
      gap: 8px; 
    }
    .btn:hover { 
      border-color: var(--primary); 
      background: var(--card-hover);
    }
    .btn-primary { 
      background: var(--primary); 
      color: #0b0f19; 
      border: none; 
      box-shadow: 0 2px 8px rgba(245, 158, 11, 0.25);
    }
    .btn-primary:hover { 
      background: var(--primary-hover); 
      color: #0b0f19; 
    }
    .btn-excel {
      background: linear-gradient(135deg, #107c41, #15803d);
      color: #ffffff;
      border: 1px solid #16a34a;
      box-shadow: 0 2px 6px rgba(16, 124, 65, 0.25);
    }
    .btn-excel:hover {
      background: #15803d;
      color: #ffffff;
    }
    .btn-pbi {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #0b0f19;
      border: 1px solid #f59e0b;
      font-weight: 800;
    }
    .btn-pbi:hover {
      background: #b45309;
      color: #ffffff;
    }

    /* Power BI Modal */
    #pbi-guide-modal {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    #pbi-guide-modal.show {
      display: flex;
    }
    .modal-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      max-width: 640px;
      width: 100%;
      padding: 28px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      animation: modalFade 0.2s ease-out;
    }
    @keyframes modalFade {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }

    /* Navigation Tabs */
    .nav-tabs { 
      display: flex; 
      gap: 8px; 
      margin-bottom: 24px; 
      border-bottom: 2px solid var(--card-border); 
      overflow-x: auto; 
      padding-bottom: 2px; 
      -webkit-overflow-scrolling: touch;
    }
    .tab-btn { 
      padding: 12px 20px; 
      border-radius: 10px 10px 0 0; 
      font-weight: 700; 
      font-size: 14px; 
      cursor: pointer; 
      background: transparent; 
      border: none; 
      color: var(--text-muted); 
      transition: all 0.15s; 
      white-space: nowrap; 
      font-family: inherit;
    }
    .tab-btn:hover { 
      color: var(--text-main); 
      background: var(--card-hover);
    }
    .tab-btn.active { 
      color: var(--primary); 
      border-bottom: 3px solid var(--primary); 
      margin-bottom: -2px; 
      background: var(--primary-light); 
    }

    /* Cards & Grids */
    .kpi-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); 
      gap: 16px; 
      margin-bottom: 24px; 
    }
    .card { 
      background: var(--card-bg); 
      border: 1px solid var(--card-border); 
      border-radius: 16px; 
      padding: 20px; 
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08); 
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 130px;
      transition: transform 0.15s, border-color 0.15s;
    }
    .card:hover {
      border-color: rgba(245, 158, 11, 0.4);
      transform: translateY(-2px);
    }
    .card-title { 
      font-size: 13px; 
      font-weight: 700; 
      color: var(--text-muted); 
      margin-bottom: 8px; 
      line-height: 1.4;
    }
    .card-value { 
      font-size: 26px; 
      font-weight: 800; 
      color: var(--text-main); 
      display: flex;
      align-items: baseline;
      gap: 6px;
      line-height: 1.2;
    }
    .card-sub { 
      font-size: 12px; 
      margin-top: 10px; 
      font-weight: 700; 
      display: inline-flex; 
      align-items: center; 
      gap: 6px; 
      padding: 3px 8px;
      border-radius: 6px;
      width: fit-content;
    }
    .sub-pos { 
      color: var(--accent-green); 
      background: rgba(16, 185, 129, 0.1); 
    }
    .sub-neg { 
      color: var(--accent-red); 
      background: rgba(244, 63, 94, 0.1); 
    }
    .sub-neutral {
      color: var(--text-muted);
      background: var(--card-hover);
    }

    /* Tables */
    .table-container { 
      overflow-x: auto; 
      background: var(--card-bg); 
      border: 1px solid var(--card-border); 
      border-radius: 16px; 
      margin-bottom: 24px; 
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      -webkit-overflow-scrolling: touch;
    }
    .table-header-note {
      padding: 12px 20px;
      border-bottom: 1px solid var(--card-border);
      font-size: 12px;
      color: var(--text-dim);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(0, 0, 0, 0.04);
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      min-width: 800px;
    }
    th { 
      background: rgba(0, 0, 0, 0.18); 
      padding: 14px 20px; 
      font-weight: 700; 
      font-size: 13px;
      border-bottom: 2px solid var(--card-border); 
      color: var(--text-muted); 
      white-space: nowrap;
    }
    th.col-item {
      text-align: right;
      min-width: 260px;
    }
    th.col-val {
      text-align: left;
      direction: ltr;
      font-family: 'Inter', sans-serif;
      min-width: 110px;
    }
    td { 
      padding: 13px 20px; 
      border-bottom: 1px solid var(--card-border); 
      font-size: 13.5px;
      white-space: nowrap;
      line-height: 1.5;
    }
    td.col-item {
      text-align: right;
      font-weight: 600;
      color: var(--text-main);
    }
    td.col-val {
      text-align: left;
      direction: ltr;
      font-family: 'Inter', monospace;
      font-variant-numeric: tabular-nums;
      color: var(--text-main);
    }
    tr:hover td { 
      background: var(--card-hover); 
    }
    .bold-row td { 
      font-weight: 800; 
      background: var(--primary-light); 
      color: var(--primary); 
    }
    .section-header td {
      font-weight: 800;
      background: rgba(0, 0, 0, 0.25);
      color: var(--text-muted);
      font-size: 12.5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Scorecard Meter */
    .score-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
    }
    .score-circle {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: var(--primary-light);
      border: 3px solid var(--primary);
      flex-shrink: 0;
    }
    .score-circle-num {
      font-size: 36px;
      font-weight: 900;
      font-family: 'Inter', sans-serif;
      color: var(--primary);
      line-height: 1;
    }
    .score-circle-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-muted);
      margin-top: 2px;
    }
    .score-details {
      flex: 1;
      min-width: 280px;
    }
    .score-details h3 {
      font-size: 20px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    .score-bar-outer { 
      height: 14px; 
      background: var(--card-border); 
      border-radius: 9999px; 
      overflow: hidden; 
      margin-top: 12px;
    }
    .score-bar-inner { 
      height: 100%; 
      background: linear-gradient(90deg, #ef4444, #f59e0b, #10b981); 
      border-radius: 9999px; 
      transition: width 0.6s ease-out;
    }

    /* Chart Containers */
    .charts-grid {
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); 
      gap: 20px; 
      margin-bottom: 24px;
    }
    .chart-box { 
      background: var(--card-bg); 
      border: 1px solid var(--card-border); 
      border-radius: 16px; 
      padding: 24px; 
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.06);
    }
    .chart-header { 
      font-size: 15px; 
      font-weight: 800; 
      margin-bottom: 18px; 
      color: var(--text-main); 
      display: flex; 
      justify-content: space-between; 
      align-items: center;
    }

    /* Tab switching */
    .tab-content { display: none; }
    .tab-content.active { display: block; animation: fadeIn 0.25s ease-out; }
    @keyframes fadeIn { 
      from { opacity: 0; transform: translateY(6px); } 
      to { opacity: 1; transform: translateY(0); } 
    }

    @media print {
      body { background: #fff !important; color: #000 !important; padding: 0; }
      .controls, .nav-tabs, .table-header-note { display: none !important; }
      .tab-content { display: block !important; margin-bottom: 30px; page-break-after: always; }
      .card, .table-container, .chart-box { border: 1px solid #ccc !important; box-shadow: none !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <header class="header">
      <div class="title-area">
        <h1>${cName}</h1>
        <div class="meta-row">
          <span>الفترة المالية: <strong>${summary.reportingPeriod || 'سنوي'}</strong></span>
          <span>•</span>
          <span>العملة: <strong>${currency}</strong></span>
          <span class="unit-badge">جميع القيم المالية بآلاف الجنيهات (${currency} in thousands)</span>
          <span class="meta-pill">محرك التحليل المالي والائتماني</span>
        </div>
      </div>
      <div class="controls">
        <button class="btn btn-excel" onclick="downloadExcelModel()" title="تنزيل شيت Excel الشامل لتعديل الأرقام والبيانات">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          تنزيل شيت Excel لتعديل الأرقام
        </button>
        <button class="btn btn-pbi" onclick="openPbiGuideModal()" title="طريقة فتح وتعديل التقرير في برنامج Power BI Desktop">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="9" y2="15"></line><line x1="15" y1="9" x2="15" y2="15"></line></svg>
          طريقة التعديل في Power BI Desktop
        </button>
        <button class="btn btn-primary" onclick="window.print()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          طباعة / حفظ PDF
        </button>
        <button class="btn" onclick="toggleTheme()">
          🌓 تغيير المظهر
        </button>
      </div>
    </header>

    <!-- Navigation Tabs -->
    <nav class="nav-tabs">
      <button class="tab-btn active" onclick="switchTab(event, 'tab-overview')">1. نظرة عامة (Overview)</button>
      <button class="tab-btn" onclick="switchTab(event, 'tab-income')">2. قائمة الدخل (Income Statement)</button>
      <button class="tab-btn" onclick="switchTab(event, 'tab-balance')">3. المركز المالي (Balance Sheet)</button>
      <button class="tab-btn" onclick="switchTab(event, 'tab-ratios')">4. النسب المالية (Financial Ratios)</button>
      <button class="tab-btn" onclick="switchTab(event, 'tab-credit')">5. الجدارة الائتمانية (Credit Health)</button>
    </nav>

    <!-- Tab 1: Overview -->
    <section id="tab-overview" class="tab-content active">
      <div class="kpi-grid">
        <div class="card">
          <div class="card-title">إجمالي الإيرادات (Revenues)</div>
          <div class="card-value">
            <span class="num">${formatNum(latest.revenues)}</span>
            <span class="unit">${currency}</span>
          </div>
          <div class="card-sub ${latest.revenueGrowthPct && latest.revenueGrowthPct >= 0 ? 'sub-pos' : 'sub-neg'}">
            نمو سنوي: ${safePct(latest.revenueGrowthPct)}
          </div>
        </div>

        <div class="card">
          <div class="card-title">مجمل الربح (Gross Profit)</div>
          <div class="card-value">
            <span class="num">${formatNum(latest.grossProfit)}</span>
            <span class="unit">${currency}</span>
          </div>
          <div class="card-sub sub-pos">هامش: ${safePct(latest.grossMarginPct)}</div>
        </div>

        <div class="card">
          <div class="card-title">الأرباح التشغيلية قبل الإهلاك (EBITDA)</div>
          <div class="card-value">
            <span class="num">${formatNum(latest.ebitda)}</span>
            <span class="unit">${currency}</span>
          </div>
          <div class="card-sub sub-pos">هامش: ${safePct(latest.ebitdaMarginPct)}</div>
        </div>

        <div class="card">
          <div class="card-title">صافي الربح بعد الضريبة (Net Profit)</div>
          <div class="card-value">
            <span class="num">${formatNum(latest.netProfitAfterTax)}</span>
            <span class="unit">${currency}</span>
          </div>
          <div class="card-sub sub-pos">هامش: ${safePct(latest.netMarginPct)}</div>
        </div>

        <div class="card">
          <div class="card-title">إجمالي الأصول (Total Assets)</div>
          <div class="card-value">
            <span class="num">${formatNum(latest.totalAssets)}</span>
            <span class="unit">${currency}</span>
          </div>
          <div class="card-sub sub-neutral">عائد الأصول ROA: ${safePct(latest.roaPct)}</div>
        </div>

        <div class="card">
          <div class="card-title">إجمالي الالتزامات (Liabilities)</div>
          <div class="card-value">
            <span class="num">${formatNum(latest.totalLiabilities)}</span>
            <span class="unit">${currency}</span>
          </div>
          <div class="card-sub sub-neutral">الرافعة المالية: ${safeRatio(latest.debtToEquity)}</div>
        </div>

        <div class="card">
          <div class="card-title">حقوق الملكية (Equity)</div>
          <div class="card-value">
            <span class="num">${formatNum(latest.totalEquity)}</span>
            <span class="unit">${currency}</span>
          </div>
          <div class="card-sub sub-pos">عائد الملكية ROE: ${safePct(latest.roePct)}</div>
        </div>

        <div class="card">
          <div class="card-title">رأس المال العامل (Working Capital)</div>
          <div class="card-value">
            <span class="num">${formatNum(latest.workingCapital)}</span>
            <span class="unit">${currency}</span>
          </div>
          <div class="card-sub sub-pos">نسبة التداول: ${safeRatio(latest.currentRatio)}</div>
        </div>
      </div>

      <!-- Overview Charts -->
      <div class="charts-grid">
        <div class="chart-box">
          <div class="chart-header">
            <span>تطور الإيرادات وصافي الأرباح (${years.join(' - ')})</span>
            <span style="font-size: 12px; color: var(--text-dim); font-weight: normal;">القيم بآلاف ${currency}</span>
          </div>
          <svg viewBox="0 0 540 250" style="width: 100%; height: auto; overflow: visible;">
            ${generateRevenueSvgChart(summary.yearlyData)}
          </svg>
        </div>
        <div class="chart-box">
          <div class="chart-header">
            <span>تطور هوامش الربحية (%)</span>
            <span style="font-size: 12px; color: var(--text-dim); font-weight: normal;">نسب مئوية</span>
          </div>
          <svg viewBox="0 0 540 250" style="width: 100%; height: auto; overflow: visible;">
            ${generateMarginsSvgChart(summary.yearlyData)}
          </svg>
        </div>
      </div>
    </section>

    <!-- Tab 2: Income Statement -->
    <section id="tab-income" class="tab-content">
      <div class="table-container">
        <div class="table-header-note">
          <span>قائمة الدخل الشاملة المقارنة</span>
          <span>جميع القيم بالآلاف (${currency} in thousands)</span>
        </div>
        <table>
          <thead>
            <tr>
              <th class="col-item">البند المالي (Financial Line Item)</th>
              ${years.map(y => `<th class="col-val">FY ${y}</th>`).join('')}
              <th class="col-val">المتوسط</th>
            </tr>
          </thead>
          <tbody>
            <tr class="bold-row">
              <td class="col-item">إجمالي الإيرادات (Revenues)</td>
              ${summary.yearlyData.map(d => `<td class="col-val">${formatNum(d.revenues)}</td>`).join('')}
              <td class="col-val">${formatNum(avg(summary.yearlyData.map(d => d.revenues)))}</td>
            </tr>
            <tr>
              <td class="col-item">تكلفة البضاعة المباعة (COGS)</td>
              ${summary.yearlyData.map(d => `<td class="col-val">(${formatNum(d.cogs)})</td>`).join('')}
              <td class="col-val">(${formatNum(avg(summary.yearlyData.map(d => d.cogs)))})</td>
            </tr>
            <tr class="bold-row">
              <td class="col-item">مجمل الربح (Gross Profit)</td>
              ${summary.yearlyData.map(d => `<td class="col-val">${formatNum(d.grossProfit)}</td>`).join('')}
              <td class="col-val">${formatNum(avg(summary.yearlyData.map(d => d.grossProfit)))}</td>
            </tr>
            <tr>
              <td class="col-item">هامش مجمل الربح (%)</td>
              ${summary.yearlyData.map(d => `<td class="col-val">${safePct(d.grossMarginPct)}</td>`).join('')}
              <td class="col-val">${safePct(avg(summary.yearlyData.map(d => d.grossMarginPct || 0)))}</td>
            </tr>
            <tr>
              <td class="col-item">المصروفات البيعية والعمومية (SG&A)</td>
              ${summary.yearlyData.map(d => `<td class="col-val">(${formatNum(d.sgaExpense)})</td>`).join('')}
              <td class="col-val">(${formatNum(avg(summary.yearlyData.map(d => d.sgaExpense)))})</td>
            </tr>
            <tr>
              <td class="col-item">الإهلاك والاستهلاك (Depreciation)</td>
              ${summary.yearlyData.map(d => `<td class="col-val">(${formatNum(d.depreciation)})</td>`).join('')}
              <td class="col-val">(${formatNum(avg(summary.yearlyData.map(d => d.depreciation)))})</td>
            </tr>
            <tr class="bold-row">
              <td class="col-item">الأرباح قبل الفوائد والضرائب (EBITDA)</td>
              ${summary.yearlyData.map(d => `<td class="col-val">${formatNum(d.ebitda)}</td>`).join('')}
              <td class="col-val">${formatNum(avg(summary.yearlyData.map(d => d.ebitda)))}</td>
            </tr>
            <tr>
              <td class="col-item">هامش EBITDA (%)</td>
              ${summary.yearlyData.map(d => `<td class="col-val">${safePct(d.ebitdaMarginPct)}</td>`).join('')}
              <td class="col-val">${safePct(avg(summary.yearlyData.map(d => d.ebitdaMarginPct || 0)))}</td>
            </tr>
            <tr>
              <td class="col-item">مصروفات الفوائد والتمويل (Interest Exp)</td>
              ${summary.yearlyData.map(d => `<td class="col-val">(${formatNum(d.interestExpense)})</td>`).join('')}
              <td class="col-val">(${formatNum(avg(summary.yearlyData.map(d => d.interestExpense)))})</td>
            </tr>
            <tr class="bold-row">
              <td class="col-item">صافي الربح قبل الضرائب (EBT)</td>
              ${summary.yearlyData.map(d => `<td class="col-val">${formatNum(d.netProfitBeforeTax)}</td>`).join('')}
              <td class="col-val">${formatNum(avg(summary.yearlyData.map(d => d.netProfitBeforeTax)))}</td>
            </tr>
            <tr>
              <td class="col-item">ضرائب الدخل (Tax Expense)</td>
              ${summary.yearlyData.map(d => `<td class="col-val">(${formatNum(d.taxExpense)})</td>`).join('')}
              <td class="col-val">(${formatNum(avg(summary.yearlyData.map(d => d.taxExpense)))})</td>
            </tr>
            <tr class="bold-row" style="background: rgba(16, 185, 129, 0.12); color: var(--accent-green);">
              <td class="col-item">صافي الربح بعد الضريبة (Net Profit)</td>
              ${summary.yearlyData.map(d => `<td class="col-val" style="color: var(--accent-green); font-weight: 800;">${formatNum(d.netProfitAfterTax)}</td>`).join('')}
              <td class="col-val" style="color: var(--accent-green); font-weight: 800;">${formatNum(avg(summary.yearlyData.map(d => d.netProfitAfterTax)))}</td>
            </tr>
            <tr>
              <td class="col-item">هامش صافي الربح (%)</td>
              ${summary.yearlyData.map(d => `<td class="col-val">${safePct(d.netMarginPct)}</td>`).join('')}
              <td class="col-val">${safePct(avg(summary.yearlyData.map(d => d.netMarginPct || 0)))}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Tab 3: Balance Sheet -->
    <section id="tab-balance" class="tab-content">
      <div class="table-container">
        <div class="table-header-note">
          <span>قائمة المركز المالي والميزانية المقارنة</span>
          <span>جميع القيم بالآلاف (${currency} in thousands)</span>
        </div>
        <table>
          <thead>
            <tr>
              <th class="col-item">عناصر الميزانية العمومية</th>
              ${years.map(y => `<th class="col-val">FY ${y}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr class="section-header"><td class="col-item" colspan="${years.length + 1}">الأصول المتداولة (Current Assets)</td></tr>
            <tr><td class="col-item">النقد وما في حكمه (Cash & Equivalents)</td>${summary.yearlyData.map(d => `<td class="col-val">${formatNum(d.cash)}</td>`).join('')}</tr>
            <tr><td class="col-item">أوراق مالية قابلة للتداول</td>${summary.yearlyData.map(d => `<td class="col-val">${formatNum(d.marketableSecurities)}</td>`).join('')}</tr>
            <tr><td class="col-item">العملاء والمدينون (Net Receivables)</td>${summary.yearlyData.map(d => `<td class="col-val">${formatNum(d.netReceivables)}</td>`).join('')}</tr>
            <tr><td class="col-item">إجمالي المخزون (Total Inventory)</td>${summary.yearlyData.map(d => `<td class="col-val">${formatNum(d.totalInventory)}</td>`).join('')}</tr>
            <tr class="bold-row"><td class="col-item">إجمالي الأصول المتداولة</td>${summary.yearlyData.map(d => `<td class="col-val">${formatNum(d.totalCurrentAssets)}</td>`).join('')}</tr>
            
            <tr class="section-header"><td class="col-item" colspan="${years.length + 1}">الأصول غير المتداولة (Non-Current Assets)</td></tr>
            <tr><td class="col-item">صافي الأصول الثابتة (Net PP&E)</td>${summary.yearlyData.map(d => `<td class="col-val">${formatNum(d.netPpe)}</td>`).join('')}</tr>
            <tr><td class="col-item">الأصول غير الملموسة والشهرة</td>${summary.yearlyData.map(d => `<td class="col-val">${formatNum(d.netIntangibles)}</td>`).join('')}</tr>
            <tr class="bold-row" style="background: rgba(56, 189, 248, 0.12); color: var(--accent-blue);"><td class="col-item">إجمالي الأصول (Total Assets)</td>${summary.yearlyData.map(d => `<td class="col-val" style="color: var(--accent-blue); font-weight: 800;">${formatNum(d.totalAssets)}</td>`).join('')}</tr>
            
            <tr class="section-header"><td class="col-item" colspan="${years.length + 1}">الالتزامات (Liabilities)</td></tr>
            <tr><td class="col-item">الالتزامات المتداولة (Current Liabilities)</td>${summary.yearlyData.map(d => `<td class="col-val">${formatNum(d.totCurrentLiabilities)}</td>`).join('')}</tr>
            <tr><td class="col-item">ديون قصيرة الأجل (Short Term Debt)</td>${summary.yearlyData.map(d => `<td class="col-val">${formatNum(d.shortTermDebt)}</td>`).join('')}</tr>
            <tr><td class="col-item">ديون طويلة الأجل (Long Term Debt)</td>${summary.yearlyData.map(d => `<td class="col-val">${formatNum(d.totalLongTermDebt)}</td>`).join('')}</tr>
            <tr class="bold-row"><td class="col-item">إجمالي الالتزامات (Total Liabilities)</td>${summary.yearlyData.map(d => `<td class="col-val">${formatNum(d.totalLiabilities)}</td>`).join('')}</tr>
            
            <tr class="section-header"><td class="col-item" colspan="${years.length + 1}">حقوق الملكية (Shareholders' Equity)</td></tr>
            <tr><td class="col-item">رأس المال المدفوع (Common Stock)</td>${summary.yearlyData.map(d => `<td class="col-val">${formatNum(d.commonStock)}</td>`).join('')}</tr>
            <tr><td class="col-item">الأرباح المبقاة (Retained Earnings)</td>${summary.yearlyData.map(d => `<td class="col-val">${formatNum(d.retainedEarnings)}</td>`).join('')}</tr>
            <tr class="bold-row" style="background: rgba(245, 158, 11, 0.12); color: var(--primary);"><td class="col-item">إجمالي حقوق الملكية (Total Equity)</td>${summary.yearlyData.map(d => `<td class="col-val" style="color: var(--primary); font-weight: 800;">${formatNum(d.totalEquity)}</td>`).join('')}</tr>
            <tr class="bold-row"><td class="col-item">إجمالي الالتزامات وحقوق الملكية</td>${summary.yearlyData.map(d => `<td class="col-val">${formatNum(d.totalLiabsAndEquity)}</td>`).join('')}</tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Tab 4: Financial Ratios -->
    <section id="tab-ratios" class="tab-content">
      <div class="table-container">
        <div class="table-header-note">
          <span>النسب والمؤشرات المالية والمقارنة بالمعايير العالمية</span>
          <span>معايير بازل والتحليل الائتماني</span>
        </div>
        <table>
          <thead>
            <tr>
              <th class="col-item">المؤشر المالي</th>
              <th class="col-val" style="text-align: center;">المعيار المستهدف</th>
              ${years.map(y => `<th class="col-val">FY ${y}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr class="section-header"><td class="col-item" colspan="${years.length + 2}">مؤشرات السيولة (Liquidity Ratios)</td></tr>
            <tr><td class="col-item">نسبة التداول (Current Ratio)</td><td class="col-val" style="text-align: center;">&ge; 1.50x</td>${summary.yearlyData.map(d => `<td class="col-val">${safeRatio(d.currentRatio)}</td>`).join('')}</tr>
            <tr><td class="col-item">نسبة السيولة السريعة (Quick Ratio)</td><td class="col-val" style="text-align: center;">&ge; 1.00x</td>${summary.yearlyData.map(d => `<td class="col-val">${safeRatio(d.quickRatio)}</td>`).join('')}</tr>
            <tr><td class="col-item">نسبة النقدية (Cash Ratio)</td><td class="col-val" style="text-align: center;">&ge; 0.20x</td>${summary.yearlyData.map(d => `<td class="col-val">${safeRatio(d.cashRatio)}</td>`).join('')}</tr>

            <tr class="section-header"><td class="col-item" colspan="${years.length + 2}">مؤشرات الملاءة المالية والديون (Solvency & Leverage)</td></tr>
            <tr><td class="col-item">نسبة الدين إلى حقوق الملكية (Debt / Equity)</td><td class="col-val" style="text-align: center;">&le; 1.50x</td>${summary.yearlyData.map(d => `<td class="col-val">${safeRatio(d.debtToEquity)}</td>`).join('')}</tr>
            <tr><td class="col-item">نسبة الدين إلى الأصول (Debt / Assets)</td><td class="col-val" style="text-align: center;">&le; 50%</td>${summary.yearlyData.map(d => `<td class="col-val">${safePct(d.debtToAssets)}</td>`).join('')}</tr>
            <tr><td class="col-item">معدل تغطية الفوائد (Interest Coverage)</td><td class="col-val" style="text-align: center;">&ge; 3.00x</td>${summary.yearlyData.map(d => `<td class="col-val">${safeRatio(d.interestCoverage)}</td>`).join('')}</tr>

            <tr class="section-header"><td class="col-item" colspan="${years.length + 2}">مؤشرات الربحية والعوائد (Profitability & Returns)</td></tr>
            <tr><td class="col-item">العائد على الأصول (ROA)</td><td class="col-val" style="text-align: center;">&ge; 8.0%</td>${summary.yearlyData.map(d => `<td class="col-val">${safePct(d.roaPct)}</td>`).join('')}</tr>
            <tr><td class="col-item">العائد على حقوق الملكية (ROE)</td><td class="col-val" style="text-align: center;">&ge; 15.0%</td>${summary.yearlyData.map(d => `<td class="col-val">${safePct(d.roePct)}</td>`).join('')}</tr>
            <tr><td class="col-item">معدل دوران الأصول (Asset Turnover)</td><td class="col-val" style="text-align: center;">&ge; 1.00x</td>${summary.yearlyData.map(d => `<td class="col-val">${safeRatio(d.assetTurnover)}</td>`).join('')}</tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Tab 5: Credit Health -->
    <section id="tab-credit" class="tab-content">
      <div class="score-card">
        <div class="score-circle">
          <div class="score-circle-num">${latest.creditHealthScore}</div>
          <div class="score-circle-label">من 100</div>
        </div>
        <div class="score-details">
          <h3>
            درجة الجدارة الائتمانية: 
            <span style="color: ${latest.creditRiskTier === 'Low Risk' ? 'var(--accent-green)' : latest.creditRiskTier === 'Moderate Risk' ? 'var(--primary)' : 'var(--accent-red)'};">
              ${latest.creditRiskTier === 'Low Risk' ? 'منخفض المخاطر (Low Risk)' : latest.creditRiskTier === 'Moderate Risk' ? 'مخاطر معتدلة (Moderate Risk)' : 'مرتفع المخاطر (High Risk)'}
            </span>
          </h3>
          <p style="color: var(--text-muted); font-size: 14px;">
            حالة السيولة: <strong style="color: var(--text-main);">${latest.liquidityStatus}</strong> • الملاءة والمديونية: <strong style="color: var(--text-main);">${latest.solvencyStatus}</strong> • رأس المال العامل: <strong style="color: var(--text-main);">${formatNum(latest.workingCapital)} ${currency}</strong>
          </p>
          <div class="score-bar-outer">
            <div class="score-bar-inner" style="width: ${latest.creditHealthScore}%;"></div>
          </div>
        </div>
      </div>

      <div class="table-container">
        <div class="table-header-note">
          <span>سجل تقييم الجدارة والتعثر الائتماني متعدد السنوات</span>
          <span>القيم المالية بآلاف ${currency}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th class="col-item">السنة المالية</th>
              <th class="col-val" style="text-align: center;">درجة الائتمان</th>
              <th class="col-val" style="text-align: center;">تصنيف المخاطر</th>
              <th class="col-item">وضع السيولة</th>
              <th class="col-item">وضع الملاءة المالية</th>
              <th class="col-val">صافي الدين (${currency})</th>
              <th class="col-val">رأس المال العامل (${currency})</th>
            </tr>
          </thead>
          <tbody>
            ${summary.yearlyData.map(d => `
              <tr>
                <td class="col-item"><strong>FY ${d.year}</strong></td>
                <td class="col-val" style="text-align: center;"><strong style="color: var(--primary);">${d.creditHealthScore}/100</strong></td>
                <td class="col-val" style="text-align: center;"><span class="meta-pill" style="font-size: 11px;">${d.creditRiskTier}</span></td>
                <td class="col-item">${d.liquidityStatus}</td>
                <td class="col-item">${d.solvencyStatus}</td>
                <td class="col-val">${formatNum(d.netDebt)}</td>
                <td class="col-val">${formatNum(d.workingCapital)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  </div>

  <!-- Power BI Desktop Guide Modal -->
  <div id="pbi-guide-modal" onclick="if(event.target===this) closePbiGuideModal()">
    <div class="modal-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--card-border); padding-bottom: 14px;">
        <h3 style="font-size: 18px; font-weight: 800; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
          <span>📊</span>
          <span>كيفية فتح وتعديل التقرير في برنامج Power BI Desktop</span>
        </h3>
        <button onclick="closePbiGuideModal()" style="background: none; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer; padding: 4px 8px;">✕</button>
      </div>

      <div style="color: var(--text-main); font-size: 13.5px; line-height: 1.8; space-y: 14px;">
        <p style="margin-bottom: 12px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 12px; color: var(--primary);">
          <strong>💡 الطريقة المعتمدة والمضمونة 100% للتعديل على أي جهاز:</strong>
        </p>

        <ol style="padding-inline-start: 20px; margin-bottom: 18px; list-style-type: decimal;">
          <li style="margin-bottom: 10px;">
            <strong>تنزيل ملف البيانات:</strong> انقر على زر <em>«تنزيل شيت Excel لتعديل الأرقام»</em> في أعلى الصفحة، وسينزل ملف <code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">.xlsx</code> المنظم.
          </li>
          <li style="margin-bottom: 10px;">
            <strong>الفتح في Power BI Desktop:</strong> شغّل البرنامج على جهازك، ثم اضغط:
            <br>
            <span style="direction: ltr; display: inline-block; font-weight: bold; color: var(--accent-blue);">Home &gt; Get Data &gt; Excel Workbook</span>
            <br>
            واختر الملف الذي قمت بتنزيله.
          </li>
          <li style="margin-bottom: 10px;">
            <strong>تحديد الجداول:</strong> حدد الجداول (<code style="font-size: 12px;">Fact_Financials</code>, <code style="font-size: 12px;">Financial_Ratios</code>, <code style="font-size: 12px;">Credit_Analysis</code>, <code style="font-size: 12px;">Dim_Periods</code>) واضغط <strong>Load (تحميل)</strong>.
          </li>
          <li style="margin-bottom: 10px;">
            <strong>التعديل الفوري:</strong> متى ما أردت تعديل أو إضافة أي أرقام، عدّلها في شيت الـ Excel واحفظ الملف. ثم اضغط <strong>Refresh (تحديث)</strong> داخل Power BI، وستتحدّث كل المؤشرات والرسوم فوراً!
          </li>
        </ol>

        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; border-top: 1px solid var(--card-border); padding-top: 16px;">
          <button class="btn btn-excel" onclick="downloadExcelModel(); closePbiGuideModal();">
            📥 تنزيل شيت Excel الآن
          </button>
          <button class="btn" onclick="closePbiGuideModal()">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  </div>

  <script>
    window.__EXCEL_DATA__ = "${excelBase64 || ''}";
    window.__COMPANY_NAME__ = "${cName.replace(/[\\/:*?"<>|]/g, '_')}";

    function switchTab(e, tabId) {
      document.querySelectorAll('.tab-content').forEach(function(el) { el.classList.remove('active'); });
      document.querySelectorAll('.tab-btn').forEach(function(el) { el.classList.remove('active'); });
      document.getElementById(tabId).classList.add('active');
      if (e && e.currentTarget) {
        e.currentTarget.classList.add('active');
      }
    }

    function toggleTheme() {
      var html = document.documentElement;
      if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        html.classList.add('light');
      } else {
        html.classList.remove('light');
        html.classList.add('dark');
      }
    }

    function openPbiGuideModal() {
      var m = document.getElementById('pbi-guide-modal');
      if (m) m.classList.add('show');
    }

    function closePbiGuideModal() {
      var m = document.getElementById('pbi-guide-modal');
      if (m) m.classList.remove('show');
    }

    function downloadExcelModel() {
      if (!window.__EXCEL_DATA__) {
        alert("يرجى تنزيل ملف الإكسل من منصة Credita.");
        return;
      }
      try {
        var byteCharacters = atob(window.__EXCEL_DATA__);
        var byteNumbers = new Array(byteCharacters.length);
        for (var i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        var byteArray = new Uint8Array(byteNumbers);
        var blob = new Blob([byteArray], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = (window.__COMPANY_NAME__ || "Financial") + "_Model.xlsx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(url); }, 2500);
      } catch (err) {
        console.error("Excel download error:", err);
      }
    }
  </script>
</body>
</html>`;
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function generateRevenueSvgChart(data: any[]): string {
  if (!data.length) return '';
  const maxRev = Math.max(...data.map(d => Math.max(d.revenues || 0, d.grossProfit || 0, d.netProfitAfterTax || 0)), 1);
  const w = 540;
  const h = 200;
  const paddingLeft = 30;
  const paddingRight = 30;
  const chartWidth = w - paddingLeft - paddingRight;
  const groupWidth = chartWidth / data.length;
  const barWidth = Math.min(26, groupWidth / 3.8);

  const bars = data.map((d, i) => {
    const xBase = paddingLeft + i * groupWidth + (groupWidth - (barWidth * 3 + 8)) / 2;
    const hRev = Math.max(4, ((d.revenues || 0) / maxRev) * 140);
    const hGross = Math.max(4, ((d.grossProfit || 0) / maxRev) * 140);
    const hNet = Math.max(2, (Math.max(0, d.netProfitAfterTax || 0) / maxRev) * 140);

    const yRev = h - hRev;
    const yGross = h - hGross;
    const yNet = h - hNet;

    return `
      <g>
        <!-- Revenue Bar -->
        <rect x="${xBase}" y="${yRev}" width="${barWidth}" height="${hRev}" fill="#38bdf8" rx="4" />
        <!-- Gross Profit Bar -->
        <rect x="${xBase + barWidth + 4}" y="${yGross}" width="${barWidth}" height="${hGross}" fill="#f59e0b" rx="4" />
        <!-- Net Profit Bar -->
        <rect x="${xBase + (barWidth + 4) * 2}" y="${yNet}" width="${barWidth}" height="${hNet}" fill="#10b981" rx="4" />
        <!-- Year Label -->
        <text x="${xBase + barWidth * 1.5 + 4}" y="${h + 24}" font-size="12" font-family="'Inter', sans-serif" font-weight="600" fill="#94a3b8" text-anchor="middle">FY ${d.year}</text>
      </g>
    `;
  }).join('');

  const legend = `
    <g transform="translate(30, 14)">
      <rect x="0" y="0" width="12" height="12" rx="3" fill="#38bdf8" />
      <text x="18" y="10" font-size="11" font-family="'Cairo', sans-serif" fill="#94a3b8">الإيرادات</text>

      <rect x="100" y="0" width="12" height="12" rx="3" fill="#f59e0b" />
      <text x="118" y="10" font-size="11" font-family="'Cairo', sans-serif" fill="#94a3b8">مجمل الربح</text>

      <rect x="200" y="0" width="12" height="12" rx="3" fill="#10b981" />
      <text x="218" y="10" font-size="11" font-family="'Cairo', sans-serif" fill="#94a3b8">صافي الربح</text>
    </g>
  `;

  return bars + legend;
}

function generateMarginsSvgChart(data: any[]): string {
  if (!data.length) return '';
  const w = 540;
  const h = 200;
  const paddingLeft = 50;
  const paddingRight = 50;
  const chartWidth = w - paddingLeft - paddingRight;
  const step = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth / 2;

  const ptsGross = data.map((d, i) => `${paddingLeft + i * step},${h - ((d.grossMarginPct || 0) / 100) * 140}`).join(' ');
  const ptsNet = data.map((d, i) => `${paddingLeft + i * step},${h - ((d.netMarginPct || 0) / 100) * 140}`).join(' ');

  const pointsAndLabels = data.map((d, i) => {
    const x = paddingLeft + i * step;
    const yG = h - ((d.grossMarginPct || 0) / 100) * 140;
    const yN = h - ((d.netMarginPct || 0) / 100) * 140;

    // Gross label strictly ABOVE the dot (yG - 14)
    // Net label strictly BELOW the dot (yN + 18)
    // This completely eliminates any text overlap!
    return `
      <!-- Gross Margin Point -->
      <circle cx="${x}" cy="${yG}" r="5" fill="#f59e0b" />
      <rect x="${x - 18}" y="${yG - 26}" width="36" height="18" rx="4" fill="rgba(245, 158, 11, 0.2)" />
      <text x="${x}" y="${yG - 13}" font-size="11" font-family="'Inter', sans-serif" font-weight="700" fill="#f59e0b" text-anchor="middle">${(d.grossMarginPct || 0).toFixed(0)}%</text>

      <!-- Net Margin Point -->
      <circle cx="${x}" cy="${yN}" r="5" fill="#10b981" />
      <rect x="${x - 18}" y="${yN + 8}" width="36" height="18" rx="4" fill="rgba(16, 185, 129, 0.2)" />
      <text x="${x}" y="${yN + 21}" font-size="11" font-family="'Inter', sans-serif" font-weight="700" fill="#10b981" text-anchor="middle">${(d.netMarginPct || 0).toFixed(0)}%</text>

      <!-- Year Label -->
      <text x="${x}" y="${h + 24}" font-size="12" font-family="'Inter', sans-serif" font-weight="600" fill="#94a3b8" text-anchor="middle">FY ${d.year}</text>
    `;
  }).join('');

  const legend = `
    <g transform="translate(30, 14)">
      <line x1="0" y1="6" x2="20" y2="6" stroke="#f59e0b" stroke-width="3" />
      <text x="26" y="10" font-size="11" font-family="'Cairo', sans-serif" fill="#94a3b8">هامش مجمل الربح % (الأعلى)</text>

      <line x1="190" y1="6" x2="210" y2="6" stroke="#10b981" stroke-width="3" />
      <text x="216" y="10" font-size="11" font-family="'Cairo', sans-serif" fill="#94a3b8">هامش صافي الربح % (الأسفل)</text>
    </g>
  `;

  return `
    <polyline fill="none" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${ptsGross}" />
    <polyline fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${ptsNet}" />
    ${pointsAndLabels}
    ${legend}
  `;
}
