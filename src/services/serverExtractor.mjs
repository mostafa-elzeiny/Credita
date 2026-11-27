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

function parseRetryAfterSeconds(err) {
  const rawParts = [
    err?.retryAfterSeconds,
    err?.retryAfter,
    err?.response?.headers?.get?.("retry-after"),
    err?.headers?.get?.("retry-after"),
    err?.message,
    String(err || ""),
  ]
    .filter((v) => v !== undefined && v !== null)
    .map(String)
    .join(" ");

  const retryInMatch = rawParts.match(/retry(?:\s+again)?\s+(?:in|after)\s+([0-9]+(?:\.[0-9]+)?)\s*(?:s|sec|secs|seconds)?/i);
  if (retryInMatch) {
    const val = parseFloat(retryInMatch[1]);
    if (isFinite(val) && val > 0) return Math.min(60, Math.ceil(val));
  }

  const retryDelayMatch = rawParts.match(/"retryDelay"\s*:\s*"([0-9]+(?:\.[0-9]+)?)s"/i);
  if (retryDelayMatch) {
    const val = parseFloat(retryDelayMatch[1]);
    if (isFinite(val) && val > 0) return Math.min(60, Math.ceil(val));
  }

  return null;
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
  const hardBudgetMs = isVercel ? 55000 : 120000;

  // Execution plan:
  // - chunk_scan: fast model only (gemini-3.1-flash-lite, temperature 0, low thinking), max 2 retries
  // - section/full/repair: strong model (gemini-4-hydrogen) with low thinking (high on explicit highPrecision repair),
  //   falling back immediately on 429/503 to gemini-3.1-flash-lite (temperature 0, low thinking), max 2 retries
  const primarySectionThinking =
    normalizedMode === "repair" && highPrecision && !isVercel
      ? ThinkingLevel.HIGH
      : ThinkingLevel.LOW;

  const executionPlan =
    normalizedMode === "chunk_scan"
      ? [
          {
            model: "gemini-3.1-flash-lite",
            temperature: 0.0,
            thinkingLevel: ThinkingLevel.LOW,
            defaultBackoffMs: 0,
            callTimeoutMs: isVercel ? 18000 : 35000,
          },
          {
            model: "gemini-3.1-flash-lite",
            temperature: 0.0,
            thinkingLevel: ThinkingLevel.LOW,
            defaultBackoffMs: 1200,
            callTimeoutMs: isVercel ? 16000 : 30000,
          },
          {
            model: "gemini-3.1-flash-lite",
            temperature: 0.0,
            thinkingLevel: ThinkingLevel.LOW,
            defaultBackoffMs: 2500,
            callTimeoutMs: isVercel ? 14000 : 25000,
          },
        ]
      : [
          {
            model: "gemini-4-hydrogen",
            thinkingLevel: primarySectionThinking,
            defaultBackoffMs: 0,
            callTimeoutMs: isVercel ? 28000 : 50000,
          },
          {
            model: "gemini-3.1-flash-lite",
            temperature: 0.0,
            thinkingLevel: ThinkingLevel.LOW,
            defaultBackoffMs: 800,
            callTimeoutMs: isVercel ? 18000 : 35000,
          },
          {
            model: "gemini-3.1-flash-lite",
            temperature: 0.0,
            thinkingLevel: ThinkingLevel.LOW,
            defaultBackoffMs: 2200,
            callTimeoutMs: isVercel ? 15000 : 30000,
          },
        ];

  let lastError = null;
  let lastRetryAfterSeconds = null;
  let attemptsMade = 0;
  const attemptErrors = [];

  for (let i = 0; i < executionPlan.length; i++) {
    const step = executionPlan[i];
    const elapsed = Date.now() - startedAt;
    const remaining = hardBudgetMs - elapsed;

    if (remaining < 5500) {
      break;
    }

    if (i > 0) {
      // Honor retry-after from previous error if provided, plus random jitter (150-550ms)
      const jitterMs = 150 + Math.floor(Math.random() * 400);
      const requestedWaitMs =
        lastRetryAfterSeconds !== null
          ? lastRetryAfterSeconds * 1000 + jitterMs
          : step.defaultBackoffMs + jitterMs;
      const waitMs = Math.min(requestedWaitMs, Math.max(0, remaining - 6000));
      if (waitMs > 0) {
        await new Promise((r) => setTimeout(r, waitMs));
      }
    }

    const effectiveTimeout = Math.min(
      step.callTimeoutMs,
      Math.max(5000, hardBudgetMs - (Date.now() - startedAt))
    );
    attemptsMade++;

    try {
      const config = {
        responseMimeType: "application/json",
        responseSchema: schema,
        thinkingConfig: {
          thinkingLevel: step.thinkingLevel,
        },
      };

      if (step.model !== "gemini-4-hydrogen") {
        // Strictly omit temperature/topP/topK on gemini-4-hydrogen; use temperature 0 on flash-lite
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
          durationMs: Date.now() - startedAt,
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
        durationMs: Date.now() - startedAt,
        data: reconciled,
      };
    } catch (err) {
      lastError = err;
      lastRetryAfterSeconds = parseRetryAfterSeconds(err);
      const errMsg = err?.message || String(err);
      attemptErrors.push(`${step.model}: ${errMsg.slice(0, 180)}`);
      console.warn(
        `Extraction attempt ${attemptsMade} failed on ${step.model} (mode=${normalizedMode}):`,
        errMsg.slice(0, 240)
      );

      const upper = errMsg.toUpperCase();
      if (upper.includes("API_KEY_INVALID") || upper.includes("PERMISSION_DENIED")) {
        break;
      }
      if (!isTransientError(err) && i >= 1) {
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

  const finalRetrySec = lastRetryAfterSeconds ?? parseRetryAfterSeconds(lastError) ?? 5;
  const wrappedErr = new Error(cleanMsg);
  if (isHighDemandError(cleanMsg)) {
    wrappedErr.httpStatus = cleanMsg.includes("429") || cleanMsg.toUpperCase().includes("RESOURCE_EXHAUSTED") ? 429 : 503;
    wrappedErr.code = "MODEL_HIGH_DEMAND";
    wrappedErr.retryAfterSeconds = finalRetrySec;
    wrappedErr.userMessageEn = `Service busy, retrying in ${finalRetrySec} seconds.`;
    wrappedErr.userMessageAr = `الخدمة مشغولة، إعادة المحاولة خلال ${finalRetrySec} ثوانٍ.`;
  } else if (String(cleanMsg).toUpperCase().includes("TIMED OUT") || String(cleanMsg).toUpperCase().includes("TIMEOUT")) {
    wrappedErr.httpStatus = 504;
    wrappedErr.code = "EXTRACTION_TIMEOUT";
    wrappedErr.retryAfterSeconds = 3;
    wrappedErr.userMessageEn =
      "Extraction timed out on this PDF chunk. Retrying automatically...";
    wrappedErr.userMessageAr =
      "انتهت مهلة معالجة هذا الجزء من الملف. جاري إعادة المحاولة تلقائياً...";
  } else {
    wrappedErr.httpStatus = 500;
    wrappedErr.code = "EXTRACTION_FAILED";
    wrappedErr.userMessageEn = `Extraction failed: ${cleanMsg}`;
    wrappedErr.userMessageAr = `تعذر استخراج البيانات المالية من المستند: ${cleanMsg}`;
  }

  throw wrappedErr;
}
