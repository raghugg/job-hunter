/** Browser-only Gemini call for job description keywords */
export async function extractKeywordsFromJobDescriptionBrowser(jobText, apiKey) {
  if (!apiKey || !apiKey.trim()) {
    console.warn("No Gemini API key set; skipping AI keyword extraction.");
    return [];
  }

  const modelName = "gemini-2.5-flash-lite";
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    modelName +
    ":generateContent?key=" +
    encodeURIComponent(apiKey.trim());

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

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error("Gemini API error: HTTP " + res.status);
  }

  const data = await res.json();
  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || "")
      .join("\n") || "";

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    const cleaned = text.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(cleaned);
  }

  const rawKeywords = parsed.keywords;
  if (!rawKeywords) return [];

  let keywords = [];
  if (typeof rawKeywords === "string") {
    keywords = rawKeywords.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
  } else if (Array.isArray(rawKeywords)) {
    keywords = rawKeywords.flatMap((item) => {
      if (typeof item !== "string") return [];
      return item.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean);
    });
  }

  const unique = Array.from(new Set(keywords));
  return unique.slice(0, 40);
}

/** Browser-only Gemini call for job title suggestions */
export async function suggestJobTitleImprovementsBrowser(resumeText, apiKey) {
  if (!apiKey || !apiKey.trim()) {
    console.warn("No Gemini API key set; skipping job title AI suggestions.");
    return [];
  }

  const modelName = "gemini-2.5-flash-lite";
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    modelName +
    ":generateContent?key=" +
    encodeURIComponent(apiKey.trim());

  const prompt = `
  Extract job titles from the resume text below.
  
  Identify any titles that:
  - are overly internal (e.g., "DOE-SULI Intern", "Research Aide II")
  - are unclear to a typical tech recruiter
  - do not use standard industry phrasing
  
  For each unclear title, suggest a clearer, more standard job title.
  
  Return ONLY valid JSON in this exact format:
  
  {
    "titles": [
      {
        "original": "Original title exactly as written",
        "suggested": "Clearer, more standard title"
      }
    ]
  }
  
  If all titles are fine, return:
  
  { "titles": [] }
  
  Resume:
  ---
  ${resumeText}
  ---
  `;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error("Gemini job title API error: HTTP " + res.status);
  }

  const data = await res.json();
  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || "")
      .join("\n") || "";

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const cleaned = text.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(cleaned);
  }

  if (!parsed.titles || !Array.isArray(parsed.titles)) return [];

  return parsed.titles
    .map((t) => ({
      original: String(t.original || "").trim(),
      suggested: String(t.suggested || "").trim(),
    }))
    .filter((t) => t.original && t.suggested);
}