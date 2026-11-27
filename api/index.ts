import express from "express";
import path from "path";
import fs from "fs";

const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", runtime: "vercel-express" });
});

app.post("/api/download-file", (req, res) => {
  try {
    const { base64Data, fileName, mimeType } = req.body || {};
    if (!base64Data || !fileName) {
      return res.status(400).json({ error: "Missing base64Data or fileName" });
    }
    const buffer = Buffer.from(base64Data, "base64");
    const safeName = String(fileName).replace(/[\r\n\0]/g, "").trim();
    const contentType =
      mimeType ||
      (safeName.endsWith(".pbix")
        ? "application/vnd.ms-powerbi.desktop"
        : safeName.endsWith(".pbit")
        ? "application/vnd.ms-powerbi.template"
        : safeName.endsWith(".html")
        ? "text/html; charset=utf-8"
        : "application/octet-stream");

    res.setHeader("Content-Type", contentType);
    const asciiFallback = safeName.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(safeName)}`
    );
    res.setHeader("Content-Length", buffer.length.toString());
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    return res.end(buffer);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Download error" });
  }
});

const getPbixTemplate = (): Buffer | null => {
  const candidates = [
    path.join(process.cwd(), "templates", "Financial_Report_Working.pbix"),
    path.join(process.cwd(), "templates", "Financial_Analysis_Custom.pbix"),
    path.join(process.cwd(), "templates", "Financial_Analysis_Master.pbix"),
    path.join(process.cwd(), "downloaded.pbix"),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return fs.readFileSync(p);
    } catch (_) {}
  }
  return null;
};

const handlePbix = (req: express.Request, res: express.Response) => {
  try {
    const body = req.body || {};
    const companyRaw = String(req.query.company || body.companyName || body.summary?.companyName || "Financial");
    const cName =
      companyRaw
        .replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, "_")
        .replace(/_+/g, "_")
        .trim() || "Financial";
    const safeName = `${cName}_Financial_Dashboard.pbix`;
    const tpl = getPbixTemplate();
    if (!tpl) {
      return res.status(404).json({ error: "Power BI template not found on server" });
    }
    res.setHeader("Content-Type", "application/vnd.ms-powerbi.desktop");
    res.setHeader("Content-Length", tpl.length.toString());
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`
    );
    return res.end(tpl);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "PBIX generation failed" });
  }
};

app.post("/api/generate-pbix", handlePbix);
app.post("/api/download-official-pbix", handlePbix);
app.get("/api/download-pbix", handlePbix);
app.get("/api/download-official-pbix", handlePbix);

app.post("/api/contact", async (req, res) => {
  res.json({ success: true });
});

app.use("/api", (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) return next(err);
  return res.status(err?.status || 500).json({
    error: err?.message || "API processing error",
  });
});

app.all("/api/*", (req, res) => {
  return res.status(404).json({ error: `API endpoint ${req.method} ${req.originalUrl} not found` });
});

export default app;
