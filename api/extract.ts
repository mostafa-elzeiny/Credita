import { runGeminiExtraction } from "../src/services/serverExtractor.mjs";

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: "100mb",
    },
  },
};

function sendJson(res: any, status: number, payload: Record<string, any>) {
  try {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(status).json(payload);
  } catch (_) {
    try {
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(payload));
    } catch (_) {}
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    return sendJson(res, 200, {
      status: "ok",
      message: "Credita Financial Extraction API (Vercel Serverless)",
    });
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, {
      success: false,
      code: "METHOD_NOT_ALLOWED",
      error: "Method not allowed",
      errorAr: "طريقة الطلب غير مدعومة.",
    });
  }

  try {
    let body: any = {};
    try {
      body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    } catch (_) {
      return sendJson(res, 400, {
        success: false,
        code: "INVALID_JSON_BODY",
        error: "Invalid JSON payload received by /api/extract.",
        errorAr: "صيغة الطلب المرسل غير صالحة (JSON غير صحيح).",
      });
    }

    const {
      base64Data,
      mimeType,
      highPrecision,
      mode,
      targetSection,
      failingChecks,
      currentData,
      targetPagesHint,
    } = body;

    if (!base64Data || typeof base64Data !== "string") {
      return sendJson(res, 400, {
        success: false,
        code: "MISSING_FILE_DATA",
        error: "Missing base64Data in request payload.",
        errorAr: "بيانات الملف مفقودة في الطلب.",
      });
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      process.env.API_KEY;

    const result = await runGeminiExtraction({
      apiKey,
      base64Data,
      mimeType: mimeType || "application/pdf",
      highPrecision: Boolean(highPrecision),
      mode: mode || "full",
      targetSection: targetSection || null,
      failingChecks: Array.isArray(failingChecks) ? failingChecks : [],
      currentData: currentData || null,
      targetPagesHint: Array.isArray(targetPagesHint) ? targetPagesHint : [],
      isVercel: true,
    });

    return sendJson(res, 200, {
      success: true,
      mode: result.mode,
      modelUsed: result.modelUsed,
      attemptsMade: result.attemptsMade,
      data: result.data,
    });
  } catch (error: any) {
    console.error("Vercel extraction function error:", error);
    const status = error?.httpStatus || 500;
    if (error?.retryAfterSeconds) {
      try {
        res.setHeader("Retry-After", String(error.retryAfterSeconds));
      } catch (_) {}
    }
    return sendJson(res, status, {
      success: false,
      code: error?.code || "EXTRACTION_FAILED",
      retryAfterSeconds: error?.retryAfterSeconds ?? null,
      error: error?.userMessageEn || error?.message || "Server extraction error",
      errorAr: error?.userMessageAr || "حدث خطأ أثناء معالجة المستند على الخادم. يرجى إعادة المحاولة.",
    });
  }
}
