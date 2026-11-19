import { GoogleGenAI } from "@google/genai";

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, modelSummary, fullFinancialData = [] } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: "Missing message query" });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured on Vercel."
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { "User-Agent": "aistudio-build" },
      },
    });

    const cName = modelSummary?.companyName || "Corporate Client";
    const cCurrency = modelSummary?.currency || "EGP";

    const prompt = `
You are an elite Senior Corporate Financial Advisor, Senior Bank Credit Underwriter, and Financial Leasing Structuring Expert embedded inside Credita for:
Company: ${cName} (${cCurrency})
Years: ${modelSummary?.years?.join(', ') || 'N/A'}

EXTRACTED FINANCIAL STATEMENTS:
${JSON.stringify((fullFinancialData && fullFinancialData.length > 0 ? fullFinancialData : modelSummary?.yearlyData || []).slice(0, 5), null, 2)}

KEY RATIOS & CREDIT RISK ASSESSMENT:
${JSON.stringify({ yearlyData: (modelSummary?.yearlyData || []).slice(0, 5), creditAnalystAssessment: modelSummary?.creditAnalystAssessment || null }, null, 2)}

User Question: "${message}"

DIRECTIVES:
- Provide authoritative banking, working capital financing (Overdraft, LCs/LGs), and financial leasing advice.
- State EXACT numbers from the extracted financial statements & notes (with year & currency) and show step-by-step arithmetic for any requested calculation or simulation.
- If asked in Arabic or Franco-Arabic / Arabizi, respond in fluent, professional Egyptian Arabic.
- If the user asks for a chart/graph/comparison, return a "chart" object with chartType ("bar"|"line"|"area"|"donut"|"table"), metricKeys strictly from ["revenues","cogs","grossProfit","sgaExpense","ebitda","netOperatingProfit","netProfitAfterTax","cash","netReceivables","totalInventory","totalCurrentAssets","netPpe","totalAssets","shortTermDebt","accountsPayable","totCurrentLiabilities","totalLongTermDebt","totalDebt","netDebt","totalLiabilities","totalEquity","workingCapital","workingCapitalFundingGap","currentRatio","quickRatio","debtToEquity","netDebtToEbitda","dscr","interestCoverage","dso","dio","dpo","cashConversionCycle","grossMarginPct","ebitdaMarginPct","netMarginPct","roePct","roaPct","creditHealthScore"], metricLabels, unit ("currency"|"percent"|"ratio"), title, description, insight; otherwise set "chart": null.

Return strictly valid JSON:
{
  "reply": "detailed markdown response",
  "creditMemoBullets": ["bullet 1", "bullet 2"],
  "chart": null
}
`;

    const models = ["gemini-4-hydrogen", "gemini-3.1-flash-lite"];
    let parsed: any = null;
    let lastErr: any = null;

    for (const model of models) {
      try {
        const cfg: any = { responseMimeType: "application/json" };
        if (model !== "gemini-4-hydrogen") cfg.temperature = 0.1;
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: cfg,
        });
        parsed = JSON.parse(response.text || "{}");
        if (parsed) break;
      } catch (err: any) {
        lastErr = err;
        console.warn(`Vercel dashboard-ai ${model} failed:`, err?.message || err);
      }
    }

    if (!parsed) {
      throw lastErr || new Error("AI consultation failed");
    }
    return res.status(200).json({ success: true, ...parsed });
  } catch (err: any) {
    console.error("Dashboard AI error:", err);
    return res.status(500).json({ error: err?.message || "AI consultation failed" });
  }
}
