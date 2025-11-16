// server.js (Gemini 2.5 Flash-Lite version)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Use Gemini 2.5 Flash-Lite (cheap + supported)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
});

// ---------- API ROUTE ----------
app.post("/api/extract-keywords", async (req, res) => {
  try {
    const { jobText } = req.body;
    if (!jobText || typeof jobText !== "string") {
      return res.status(400).json({ error: "jobText (string) required" });
    }

    const prompt = `
Read the following software job description and extract 10 to 30 of the most
important SKILLS or KEYWORDS.

Return ONLY valid JSON in this exact shape:

{
  "keywords": ["keyword1", "keyword2", "keyword3", ...]
}

Rules:
- Each keyword must be short (1–3 words).
- DO NOT group multiple keywords into one string.
- DO NOT add any explanation text, only JSON.

Job description:
---
${jobText}
---
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    console.log("Gemini raw text:", text);

    // Parse JSON from Gemini output
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      // Sometimes Gemini wraps JSON in ```json fences
      const cleaned = text.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(cleaned);
    }

    let rawKeywords = parsed.keywords;

    if (!rawKeywords) {
      return res.status(500).json({
        error: "Gemini response did not contain keywords",
        raw: text,
      });
    }

    // ---------- NORMALIZE TO A CLEAN STRING ARRAY ----------
    let keywords = [];

    if (typeof rawKeywords === "string") {
      // One big string → split by comma/newline/semicolon
      keywords = rawKeywords
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (Array.isArray(rawKeywords)) {
      // Array → flatten & split any items that contain commas/newlines
      keywords = rawKeywords.flatMap((item) => {
        if (typeof item !== "string") return [];
        return item
          .split(/[,;\n]/)
          .map((s) => s.trim())
          .filter(Boolean);
      });
    } else {
      return res.status(500).json({
        error: "Gemini keywords field had unexpected type",
        raw: rawKeywords,
      });
    }

    // Deduplicate and keep it reasonable
    const unique = Array.from(new Set(keywords));
    const trimmedKeywords = unique.slice(0, 40);

    console.log("Final keyword list:", trimmedKeywords);

    if (trimmedKeywords.length === 0) {
      return res.status(500).json({
        error: "No usable keywords extracted",
        raw: text,
      });
    }

    return res.json({ keywords: trimmedKeywords });
  } catch (err) {
    console.error("Gemini API error:", err);
    return res
      .status(500)
      .json({ error: "Failed to extract keywords using Gemini" });
  }
});

// ---------- START SERVER ----------
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Gemini Keyword API running at http://localhost:${PORT}`);
});
