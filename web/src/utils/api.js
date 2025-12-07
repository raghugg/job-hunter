/** Helper function to call Cloudflare Worker proxy */
async function callWorker(apiKey, model, prompt) {
  const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:8787';

  const response = await fetch(WORKER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey,
      model,
      prompt,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Worker API call failed: ${response.status} ${text}`);
  }

  return response.json();
}

/** Browser-only Gemini call for job description keywords */
export async function extractKeywordsFromJobDescriptionBrowser(jobText, apiKey) {
  if (!apiKey || !apiKey.trim()) {
    console.warn("No Gemini API key set; skipping AI keyword extraction.");
    return [];
  }

  const modelName = "gemini-2.5-flash-lite";

  const promptText = `
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

  const prompt = {
    contents: [{ parts: [{ text: promptText }] }],
  };

  const data = await callWorker(apiKey.trim(), modelName, prompt);

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

  const promptText = `
  Extract ONLY job titles from the Work Experience or Employment sections of the resume below.

  IMPORTANT: Ignore project names, school projects, personal projects, and portfolio items.
  Only look at actual job positions held at companies or organizations.

  Identify any job titles that:
  - are overly internal (e.g., "DOE-SULI Intern", "Research Aide II")
  - are unclear to a typical tech recruiter
  - do not use standard industry phrasing

  For each unclear job title, suggest a clearer, more standard title.

  Return ONLY valid JSON in this exact format:

  {
    "titles": [
      {
        "original": "Original job title exactly as written",
        "suggested": "Clearer, more standard job title"
      }
    ]
  }

  If all job titles are clear and standard, return:

  { "titles": [] }

  Resume:
  ---
  ${resumeText}
  ---
  `;

  const prompt = {
    contents: [{ parts: [{ text: promptText }] }],
  };

  const data = await callWorker(apiKey.trim(), modelName, prompt);

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

/** Helper function to build explicit change instructions from analysis results */
function buildExplicitChangeInstructions(analysisResults, enabledSuggestions = { jobTitles: true, actionVerbs: true, keywords: true }) {
  const instructions = [];

  // 1. Job title changes - EXACT replacements
  if (enabledSuggestions.jobTitles && analysisResults.jobTitleSuggestions?.length > 0) {
    instructions.push("JOB TITLE REPLACEMENTS (apply these exact changes):");
    analysisResults.jobTitleSuggestions.forEach(({original, suggested}) => {
      instructions.push(`  - Replace "${original}" with "${suggested}"`);
    });
  }

  // 2. Weak action verbs - list the specific bullets
  if (enabledSuggestions.actionVerbs && analysisResults.bulletsNeedingStrongerVerb?.length > 0) {
    instructions.push("\nBULLETS NEEDING STRONGER ACTION VERBS:");
    instructions.push("  The following bullets start with weak verbs. Replace ONLY the first word with a stronger action verb from this list:");
    instructions.push("  [led, built, created, implemented, designed, developed, improved, optimized, managed, organized, increased, reduced, launched, owned, collaborated, automated]");
    analysisResults.bulletsNeedingStrongerVerb.slice(0, 10).forEach(bullet => {
      instructions.push(`  - "${bullet}"`);
    });
  }

  // 3. Missing keywords - WHERE to add them (if applicable)
  if (enabledSuggestions.keywords && analysisResults.keywordCoverage?.missing?.length > 0) {
    const keywords = analysisResults.keywordCoverage.missing.slice(0, 10).join(', ');
    instructions.push("\nMISSING KEYWORDS TO INCORPORATE:");
    instructions.push(`  These keywords are missing: ${keywords}`);
    instructions.push("  ONLY add these keywords to existing bullets or sections where they are FACTUALLY ACCURATE and relevant.");
    instructions.push("  DO NOT create new bullets or sections just to include keywords.");
    instructions.push("  If a keyword doesn't fit anywhere truthfully, SKIP IT.");
  }

  return instructions.join('\n');
}

/** Browser-only Gemini call to generate improved LaTeX resume */
export async function generateImprovedLatexResumeBrowser(resumeText, analysisResults, apiKey, enabledSuggestions) {
  if (!apiKey?.trim()) {
    console.warn("No Gemini API key set; skipping LaTeX generation.");
    return { error: "No API key provided" };
  }

  const modelName = "gemini-2.5-flash-lite";
  const changeInstructions = buildExplicitChangeInstructions(analysisResults, enabledSuggestions);

  const promptText = `
You are a LaTeX resume formatter. You will receive a LaTeX resume and a list of SPECIFIC changes to make.

CRITICAL RULES - VIOLATION WILL RESULT IN REJECTION:
1. ONLY make the changes explicitly listed below
2. NEVER invent metrics, numbers, dates, or accomplishments
3. NEVER add information not in the original resume
4. NEVER make improvements not specifically requested
5. If unsure about a change, DON'T make it
6. Preserve ALL original formatting, structure, and factual content

ORIGINAL LATEX RESUME:
---
${resumeText}
---

CHANGES TO APPLY:
${changeInstructions}

${changeInstructions.length === 0 ? 'NO CHANGES REQUESTED - Return the original resume with only minor LaTeX formatting improvements (line breaks, spacing).' : ''}

INSTRUCTIONS:
1. Make ONLY the changes listed above
2. Preserve all LaTeX structure and formatting
3. Keep all dates, companies, schools, and technologies EXACTLY as written
4. Return complete, compilable LaTeX code

Return ONLY the complete LaTeX code, starting with \\documentclass.
DO NOT add explanations or comments.
`;

  const prompt = {
    contents: [{ parts: [{ text: promptText }] }],
  };

  try {
    const data = await callWorker(apiKey.trim(), modelName, prompt);

    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || "")
        .join("\n") || "";

    // Clean markdown fences if present
    let cleanedLatex = text.replace(/```latex\n?/g, "").replace(/```\n?/g, "").trim();

    // Validate LaTeX structure
    if (!cleanedLatex.includes("\\documentclass") && !cleanedLatex.includes("\\begin")) {
      return { error: "Invalid LaTeX output - missing document structure" };
    }

    return { latex: cleanedLatex };
  } catch (err) {
    console.error("LaTeX generation error:", err);
    return { error: err?.message || "LaTeX generation failed" };
  }
}
