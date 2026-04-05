import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Gemini Configuration for Server-side
const FINANCIAL_DATA_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    year: { type: Type.INTEGER, description: "The fiscal year of the statement" },
    incomeStatement: {
      type: Type.OBJECT,
      properties: {
        revenues: { type: Type.NUMBER },
        costOfGoodsSold: { type: Type.NUMBER },
        grossProfit: { type: Type.NUMBER },
        sellingGeneralAdminExpenses: { type: Type.NUMBER },
        operatingProfitEBIT: { type: Type.NUMBER },
        interestExpense: { type: Type.NUMBER },
        otherIncomeExpenses: { type: Type.NUMBER },
        profitBeforeTax: { type: Type.NUMBER },
        incomeTaxExpense: { type: Type.NUMBER },
        netProfitAfterTax: { type: Type.NUMBER },
        ebitda: { type: Type.NUMBER },
      },
      required: ["revenues", "netProfitAfterTax"]
    },
    balanceSheet: {
      type: Type.OBJECT,
      properties: {
        cashAndEquivalents: { type: Type.NUMBER },
        accountsReceivable: { type: Type.NUMBER },
        inventory: { type: Type.NUMBER },
        totalCurrentAssets: { type: Type.NUMBER },
        propertyPlantEquipment: { type: Type.NUMBER },
        totalAssets: { type: Type.NUMBER },
        accountsPayable: { type: Type.NUMBER },
        shortTermDebt: { type: Type.NUMBER },
        totalCurrentLiabilities: { type: Type.NUMBER },
        longTermDebt: { type: Type.NUMBER },
        totalLiabilities: { type: Type.NUMBER },
        totalEquity: { type: Type.NUMBER },
      },
      required: ["totalAssets", "totalEquity"]
    },
    cashFlow: {
      type: Type.OBJECT,
      properties: {
        operatingCashFlow: { type: Type.NUMBER },
        investingCashFlow: { type: Type.NUMBER },
        financingCashFlow: { type: Type.NUMBER },
        netChangeInCash: { type: Type.NUMBER },
      }
    }
  },
  required: ["year", "incomeStatement", "balanceSheet"]
};

const SYSTEM_PROMPT = `You are an expert financial analyst. Extract data from the provided financial statement (PDF or Image).
Return ONLY valid JSON. Use 0 for missing values. Ensure all numbers are extracted correctly.
The statement may be in Arabic or English. Interpret Arabic financial terms correctly.`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 files
  app.use(express.json({ limit: '50mb' }));

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/contact", express.json(), async (req, res) => {
    const { name, email, message } = req.body;
    
    // For now, we'll log it and simulate success. 
    // In a real app, you'd use nodemailer with actual credentials.
    console.log(`Support Request from ${name} (${email}): ${message}`);
    
    // If SMTP credentials are provided, we could send a real email
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: `"Credita Support" <${process.env.SMTP_USER}>`,
          to: "mostafa.elzeiny11@gmail.com",
          subject: `Support Request from ${name}`,
          text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        });
      } catch (error) {
        console.error('Failed to send email:', error);
      }
    }

    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Running in development mode");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Running in production mode");
    // Production: Serve static files from dist
    const distPath = path.join(process.cwd(), 'dist');
    console.log(`Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
