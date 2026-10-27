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
    const { message, modelSummary, fullFinancialData = [], history = [] } = req.body || {};
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
${JSON.stringify((fullFinancialData && fullFinancialData.length > 0 ? fullFinancialData : modelSummary?.yearlyData || []).slice(0, 4), null, 2)}

KEY RATIOS:
${JSON.stringify((modelSummary?.yearlyData || []).slice(0, 4), null, 2)}

User Question: "${message}"

Respond with authoritative financial advice, exact figures from the data, and step-by-step arithmetic when asked to compute or simulate. If asked in Arabic or Franco-Arabic, respond in professional Egyptian Arabic.
Return clean JSON with schema:
{
  "reply": "detailed markdown response",
  "creditMemoBullets": ["bullet 1", "bullet 2"],
  "chart": null
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);
    return res.status(200).json({ success: true, data });
  } catch (err: any) {
    console.error("Dashboard AI error:", err);
    return res.status(500).json({ error: err?.message || "AI consultation failed" });
  }
}
