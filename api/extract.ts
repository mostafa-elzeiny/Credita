import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { FINANCIAL_DATA_SCHEMA, SYSTEM_PROMPT, reconcileFinancialData } from "../src/services/extractionPrompt.mjs";

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: "100mb",
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

  if (req.method === "GET") {
    return res.status(200).json({ status: "ok", message: "Credita Financial Extraction API (Vercel Serverless)" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { base64Data, mimeType, highPrecision } = body;
    if (!base64Data) {
      return res.status(400).json({ error: "Missing base64Data in request payload" });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is missing on Vercel. Please add GEMINI_API_KEY in Vercel Project Settings > Environment Variables."
      });
    }

    const cleanBase64 = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
    const cleanMimeType = mimeType || "application/pdf";

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { "User-Agent": "aistudio-build" },
      },
    });

    // On Vercel (60s hard serverless ceiling), prioritize completing before gateway timeout:
    // 1) Try gemini-4-hydrogen with ThinkingLevel.LOW and a 38s race timeout
    // 2) Fall back to high-speed gemini-3.1-flash-lite if hydrogen approaches Vercel's 60s limit
    const attempts = [
      { model: "gemini-4-hydrogen", timeoutMs: 38000 },
      { model: "gemini-3.1-flash-lite", timeoutMs: 20000 },
    ];

    let extractedData = null;
    let lastErr: any = null;

    for (let i = 0; i < attempts.length; i++) {
      const { model, timeoutMs } = attempts[i];
      try {
        const reqConfig: any = {
          responseMimeType: "application/json",
          responseSchema: FINANCIAL_DATA_SCHEMA,
        };
        if (model === "gemini-4-hydrogen") {
          reqConfig.thinkingConfig = {
            thinkingLevel: ThinkingLevel.LOW,
          };
        } else {
          reqConfig.temperature = highPrecision ? 0.0 : 0.05;
        }

        const response = await Promise.race([
          ai.models.generateContent({
            model,
            contents: {
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
            config: reqConfig,
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`${model} exceeded ${timeoutMs}ms budget`)), timeoutMs)
          ),
        ]) as any;

        const text = response?.text || "{}";
        extractedData = JSON.parse(text);
        if (extractedData) break;
      } catch (err: any) {
        lastErr = err;
        console.warn(`Vercel function model ${model} failed:`, err?.message || err);
      }
    }

    if (!extractedData) {
      throw lastErr || new Error("Extraction failed with all models");
    }

    const reconciled = reconcileFinancialData(extractedData);
    return res.status(200).json({ success: true, data: reconciled });
  } catch (error: any) {
    console.error("Vercel extraction function error:", error);
    return res.status(500).json({ error: error?.message || "Server extraction error" });
  }
}
