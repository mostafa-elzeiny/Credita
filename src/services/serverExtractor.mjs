import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import {
  getSchemaForExtraction,
  CHUNK_SCAN_PROMPT,
  SYSTEM_PROMPT,
  buildSectionOrRepairPrompt,
} from "./extractionPrompt.mjs";
import { reconcileFinancialData } from "./extractionValidation.mjs";

const TRANSIENT_PATTERNS = [
  "503",
  "429",
  "500",
  "502",
  "504",
  "RESOURCE_EXHAUSTED",
  "UNAVAILABLE",
  "OVERLOADED",
  "HIGH DEMAND",
  "SPIKES IN DEMAND",
  "TEMPORARILY UNAVAILABLE",
  "TIMEOUT",
  "TIMED OUT",
  "ECONNRESET",
  "ETIMEDOUT",
  "FETCH FAILED",
  "NETWORK",
];

function isTransientError(err) {
  const detail = [
    err?.message,
    err?.status,
    err?.code,
    err?.statusText,
    String(err),
  ]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();

  return TRANSIENT_PATTERNS.some((p) => detail.includes(p));
}

function isHighDemandError(msg) {
  const u = String(msg || "").toUpperCase();
  return (
    u.includes("503") ||
    u.includes("HIGH DEMAND") ||
    u.includes("SPIKES IN DEMAND") ||
    u.includes("UNAVAILABLE") ||
    u.includes("OVERLOADED") ||
    u.includes("RESOURCE_EXHAUSTED") ||
    u.includes("429")
  );
}

function cleanAndParseJson(text) {
  const raw = String(text || "").trim();
  if (!raw) {
    throw new Error("Empty response from extraction model");
  }
  const stripped = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(stripped || "{}");
}

function withTimeout(promise, ms, label) {
  let timer;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`${label} timed out after ${ms}ms`));
      }, ms);
    }),
  ]);
}

export async function runGeminiExtraction({
  apiKey,
  base64Data,
  mimeType = "application/pdf",
  highPrecision = false,
  mode = "full",
  targetSection = null,
  failingChecks = [],
  currentData = null,
  targetPagesHint = [],
  isVercel = false,
}) {
  if (!apiKey) {
    const err = new Error(
      "GEMINI_API_KEY environment variable is not configured on the server."
    );
    err.httpStatus = 500;
    err.code = "MISSING_API_KEY";
    err.userMessageEn =
      "Server AI key is not configured. Please add GEMINI_API_KEY in deployment environment variables.";
    err.userMessageAr =
      "مفتاح الذكاء الاصطناعي (GEMINI_API_KEY) غير مضاف في إعدادات الخادم. يرجى إضافته في Environment Variables.";
    throw err;
  }

  const cleanBase64 = base64Data.includes(",")
    ? base64Data.split(",")[1]
    : base64Data;

  const normalizedMode = ["full", "chunk_scan", "section", "repair"].includes(mode)
    ? mode
    : "full";

  const schema = getSchemaForExtraction(normalizedMode, targetSection, failingChecks);

  const promptText =
    normalizedMode === "chunk_scan"
      ? CHUNK_SCAN_PROMPT
      : normalizedMode === "section" || normalizedMode === "repair"
      ? `${SYSTEM_PROMPT}\n\n${buildSectionOrRepairPrompt({
          mode: normalizedMode,
          targetSection,
          failingChecks,
          currentData,
          targetPagesHint,
        })}`
      : SYSTEM_PROMPT;

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: { "User-Agent": "aistudio-build" },
    },
  });

  const startedAt = Date.now();
  const hardBudgetMs = isVercel ? 53000 : 180000;

  // Attempt cascade:
  // 1-2: gemini-4-hydrogen with exponential backoff on 503/high-demand/transient
  // 3-4: fallback to gemini-3.1-flash-lite (temperature: 0.0) with backoff
  const primaryThinking =
    normalizedMode === "chunk_scan"
      ? ThinkingLevel.LOW
      : isVercel
      ? ThinkingLevel.LOW
      : normalizedMode === "repair" && highPrecision
      ? ThinkingLevel.HIGH
      : ThinkingLevel.MEDIUM;

  const executionPlan = [
    {
      model: "gemini-4-hydrogen",
      thinkingLevel: primaryThinking,
      backoffBeforeMs: 0,
      callTimeoutMs: isVercel ? 26000 : 75000,
    },
    {
      model: "gemini-4-hydrogen",
      thinkingLevel: ThinkingLevel.LOW,
      backoffBeforeMs: 1400,
      callTimeoutMs: isVercel ? 18000 : 50000,
    },
    {
      model: "gemini-3.1-flash-lite",
      temperature: 0.0,
      backoffBeforeMs: 1200,
      callTimeoutMs: isVercel ? 16000 : 45000,
    },
    {
      model: "gemini-3.1-flash-lite",
      temperature: 0.0,
      backoffBeforeMs: 1800,
      callTimeoutMs: isVercel ? 14000 : 35000,
    },
  ];

  let lastError = null;
  let attemptsMade = 0;
  const attemptErrors = [];

  for (let i = 0; i < executionPlan.length; i++) {
    const step = executionPlan[i];
    const elapsed = Date.now() - startedAt;
    const remaining = hardBudgetMs - elapsed;

    // On Vercel 60s limit, if remaining budget is tight, skip second hydrogen attempt and go straight to fast fallback
    if (
      isVercel &&
      i === 1 &&
      remaining < 24000
    ) {
      continue;
    }

    if (remaining < 6000) {
      break;
    }

    if (step.backoffBeforeMs > 0) {
      const waitMs = Math.min(step.backoffBeforeMs, Math.max(0, remaining - 5000));
      if (waitMs > 0) {
        await new Promise((r) => setTimeout(r, waitMs));
      }
    }

    const effectiveTimeout = Math.min(step.callTimeoutMs, Math.max(5000, hardBudgetMs - (Date.now() - startedAt)));
    attemptsMade++;

    try {
      const config = {
        responseMimeType: "application/json",
        responseSchema: schema,
      };

      if (step.model === "gemini-4-hydrogen") {
        // Strictly omit temperature/topP/topK for gemini-4-hydrogen
        config.thinkingConfig = {
          thinkingLevel: step.thinkingLevel,
        };
      } else {
        config.temperature = step.temperature ?? 0.0;
      }

      const response = await withTimeout(
        ai.models.generateContent({
          model: step.model,
          contents: {
            parts: [
              { text: promptText },
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType,
                },
              },
            ],
          },
          config,
        }),
        effectiveTimeout,
        `${step.model} (${normalizedMode})`
      );

      const parsed = cleanAndParseJson(response?.text);

      if (normalizedMode === "chunk_scan") {
        return {
          mode: normalizedMode,
          modelUsed: step.model,
          attemptsMade,
          attemptErrors,
          data: parsed,
        };
      }

      const reconciled = reconcileFinancialData(parsed);
      reconciled.extractionMeta = {
        ...(reconciled.extractionMeta || {}),
        mode: normalizedMode,
        modelUsed: step.model,
        attemptsMade,
        chunked: normalizedMode === "section",
        pass2Attempted: normalizedMode === "repair" ? true : Boolean(reconciled.extractionMeta?.pass2Attempted),
      };

      return {
        mode: normalizedMode,
        modelUsed: step.model,
        attemptsMade,
        attemptErrors,
        data: reconciled,
      };
    } catch (err) {
      lastError = err;
      const errMsg = err?.message || String(err);
      attemptErrors.push(`${step.model}: ${errMsg.slice(0, 180)}`);
      console.warn(
        `Extraction attempt ${attemptsMade} failed on ${step.model} (mode=${normalizedMode}):`,
        errMsg.slice(0, 240)
      );

      // Only stop immediately on hard auth/invalid-key errors
      const upper = errMsg.toUpperCase();
      if (upper.includes("API_KEY_INVALID") || upper.includes("PERMISSION_DENIED")) {
        break;
      }
      if (!isTransientError(err) && i >= 2) {
        // Still try fallback model even if primary gave a parse/schema quirk!
        break;
      }
    }
  }

  let cleanMsg = lastError?.message || "Failed to extract financial data";
  try {
    if (typeof cleanMsg === "string" && cleanMsg.trim().startsWith("{")) {
      const parsedErr = JSON.parse(cleanMsg);
      if (parsedErr?.error?.message) {
        cleanMsg = parsedErr.error.message;
      }
    }
  } catch (_) {}

  const wrappedErr = new Error(cleanMsg);
  if (isHighDemandError(cleanMsg)) {
    wrappedErr.httpStatus = 503;
    wrappedErr.code = "MODEL_HIGH_DEMAND";
    wrappedErr.userMessageEn =
      "The AI model is experiencing temporary high demand (503). Please click Retry in a moment.";
    wrappedErr.userMessageAr =
      "نموذج الذكاء الاصطناعي يواجه ضغطاً مؤقتاً في الطلبات (503). يرجى الضغط على 'إعادة المحاولة / Retry' للمتابعة.";
  } else if (String(cleanMsg).toUpperCase().includes("TIMED OUT") || String(cleanMsg).toUpperCase().includes("TIMEOUT")) {
    wrappedErr.httpStatus = 504;
    wrappedErr.code = "EXTRACTION_TIMEOUT";
    wrappedErr.userMessageEn =
      "Extraction timed out on this PDF chunk. Retrying with smaller sections is recommended.";
    wrappedErr.userMessageAr =
      "انتهت مهلة معالجة هذا الجزء من الملف. سيتم إعادة المحاولة أو يمكنك المحاولة مجدداً.";
  } else {
    wrappedErr.httpStatus = 500;
    wrappedErr.code = "EXTRACTION_FAILED";
    wrappedErr.userMessageEn = `Extraction failed: ${cleanMsg}`;
    wrappedErr.userMessageAr = `تعذر استخراج البيانات المالية من المستند: ${cleanMsg}`;
  }

  throw wrappedErr;
}
