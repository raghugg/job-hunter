import { useState } from "react";
import { suggestJobTitleImprovementsBrowser, extractKeywordsFromJobDescriptionBrowser } from "../utils/api";

export default function ResumeTab({ onBack, hasNavigated }) {
  const [resumeText, setResumeText] = useState("");
  const [jobText, setJobText] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [userGeminiKey, setUserGeminiKey] = useState("");

  const actionVerbs = [
    "led", "built", "created", "implemented", "designed", "developed", "improved",
    "optimized", "managed", "organized", "increased", "reduced", "launched",
    "owned", "collaborated", "automated",
  ];


  const analyze = async () => {
    const text = resumeText || "";
    const lower = text.toLowerCase();
    setErrorMsg("");
    setLoading(true);

    try {
      // --- AI job title suggestions ---
      let jobTitleSuggestions = [];
      let jobTitleAIMessage = "";

      if (!text.trim()) {
        jobTitleAIMessage = "Paste your resume above to run job title checks.";
      } else if (!userGeminiKey || !userGeminiKey.trim()) {
        jobTitleAIMessage =
          "Add a Gemini API key above to get AI-based suggestions for clearer job titles.";
      } else {
        try {
          const suggestions = await suggestJobTitleImprovementsBrowser(text, userGeminiKey);
          if (!suggestions || suggestions.length === 0) {
            jobTitleAIMessage = "No obviously confusing or overly internal job titles were detected.";
          } else {
            jobTitleSuggestions = suggestions;
          }
        } catch (titleErr) {
          console.error("Job title AI error:", titleErr);
          jobTitleAIMessage = "Job title AI check failed. Other checks still ran.";
        }
      }

      // --- Links / GitHub / portfolio ---
      const urlRegex = /https?:\/\/[^\s)]+/gi;
      const allLinks = text.match(urlRegex) || [];
      const hasGithub = /github\.com/i.test(text);
      const hasPortfolio = allLinks.some(
        (link) => !/github\.com/i.test(link) && !/linkedin\.com/i.test(link) && !/leetcode\.com/i.test(link)
      );

      // --- Bullets & metrics ---
      const lines = text.split(/\r?\n/);
      const bulletLines = lines.filter((line) => /^[\s]*[-*•]/.test(line));

      const bulletsWithMetrics = bulletLines.filter((line) =>
        /(\d|\bpercent\b|%|increase|decrease|improved|reduced|saved|grew|boosted)/i.test(line)
      );

      // --- Action verb at start of bullet ---
      const bulletsNeedingStrongerVerb = [];
      for (const line of bulletLines) {
        const withoutBullet = line.replace(/^[\s]*[-*•]\s*/, "");
        const firstWordMatch = withoutBullet.match(/^([A-Za-z']+)/);
        if (!firstWordMatch) continue;

        const firstWord = firstWordMatch[1].toLowerCase();
        if (!actionVerbs.includes(firstWord)) {
          bulletsNeedingStrongerVerb.push(line.trim());
        }
      }

      // --- Job description keyword coverage (AI) ---
      let keywordCoverage = null;
      let aiMessage = "";

      if (jobText.trim().length > 0) {
        if (!userGeminiKey || !userGeminiKey.trim()) {
          aiMessage = "Add a Gemini API key above to see AI keyword coverage for this job description.";
        } else {
          try {
            const keywords = await extractKeywordsFromJobDescriptionBrowser(jobText, userGeminiKey);
            if (!keywords || keywords.length === 0) {
              aiMessage = "AI keyword extraction returned no keywords. Check your key and Gemini quota.";
            } else {
              const matched = [];
              const missing = [];
              for (const kw of keywords) {
                if (lower.includes(kw.toLowerCase())) matched.push(kw);
                else missing.push(kw);
              }
              const total = keywords.length || 1;
              const percent = Math.round((matched.length / total) * 100);
              keywordCoverage = { matched, missing, percent, total };
            }
          } catch (aiErr) {
            console.error("AI keyword extraction failed:", aiErr);
            aiMessage = "AI keyword extraction failed. Other checks still ran.";
          }
        }
      }

      setResults({
        jobTitleSuggestions, jobTitleAIMessage, allLinks, hasGithub, hasPortfolio,
        bulletCount: bulletLines.length, bulletsWithMetricsCount: bulletsWithMetrics.length,
        bulletsWithMetrics, bulletsNeedingStrongerVerb, keywordCoverage, aiMessage,
      });
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.message || "Something went wrong running the checks.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          padding: '8px 16px',
          borderRadius: '6px',
          border: '1px solid #4b5563',
          background: '#1f2937',
          color: '#e5e7eb',
          fontSize: '0.9rem',
          cursor: 'pointer',
          marginBottom: '20px',
        }}
      >
        {hasNavigated ? '← Back to Checklist' : 'View Checklist'}
      </button>

      <h2>Resume Checker</h2>
      <div style={{ marginBottom: "16px", padding: "10px 12px", borderRadius: "8px", background: "#020617", border: "1px solid #1f2937" }}>
        <label style={{ fontSize: "0.85rem", color: "#9ca3af", display: "block", marginBottom: "4px" }}>Gemini API key</label>
        <input type="password" value={userGeminiKey} onChange={(e) => setUserGeminiKey(e.target.value)} style={{ width: "100%", borderRadius: "6px", border: "1px solid #4b5563", background: "#020617", color: "#e5e7eb", padding: "6px 8px", fontSize: "0.85rem", marginBottom: "6px" }} />
        <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: 0 }}>
          Get a free API key at <a href="https://aistudio.google.com/app/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6", textDecoration: "none" }}>aistudio.google.com</a> - Your key stays private and is never saved
        </p>
      </div>

      <div style={{ marginBottom: "16px", padding: "10px 12px", borderRadius: "8px", background: "#020617", border: "1px solid #1f2937" }}>
        <label style={{ fontSize: "0.85rem", color: "#9ca3af", display: "block", marginBottom: "4px" }}>Resume text</label>
        <textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)} rows={10} placeholder="Paste resume..." style={{ width: "100%", borderRadius: "6px", border: "1px solid #4b5563", background: "#020617", color: "#e5e7eb", padding: "8px", fontFamily: "monospace", fontSize: "0.85rem", resize: "none" }} />
      </div>

      <div style={{ marginBottom: "16px", padding: "10px 12px", borderRadius: "8px", background: "#020617", border: "1px solid #1f2937" }}>
        <label style={{ fontSize: "0.85rem", color: "#9ca3af", display: "block", marginBottom: "4px" }}>Job description (optional)</label>
        <textarea value={jobText} onChange={(e) => setJobText(e.target.value)} rows={6} placeholder="Paste job description..." style={{ width: "100%", borderRadius: "6px", border: "1px solid #4b5563", background: "#020617", color: "#e5e7eb", padding: "8px", fontFamily: "monospace", fontSize: "0.85rem", resize: "none" }} />
      </div>

      {errorMsg && <p style={{ fontSize: "0.85rem", color: "#f97316", marginTop: 0, marginBottom: "8px" }}>{errorMsg}</p>}

      <button onClick={analyze} disabled={!resumeText.trim() || loading} style={{ padding: "8px 14px", borderRadius: "999px", border: "1px solid #22c55e", background: !resumeText.trim() || loading ? "#111827" : "#22c55e22", color: "#e5e7eb", fontSize: "0.9rem", cursor: !resumeText.trim() || loading ? "not-allowed" : "pointer", marginBottom: "16px" }}>
        {loading ? "Running checks..." : "Run checks"}
      </button>

      {results && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
           {/* Results Sections */}
           <div style={{ padding: "10px 12px", borderRadius: "8px", background: "#020617", border: "1px solid #1f2937" }}>
            <h3>Job titles</h3>
            {results.jobTitleSuggestions.length > 0 ? (
              <ul>{results.jobTitleSuggestions.map((t, i) => (
                // Fixed: Using curly braces for text arrow or &rarr; entity
                <li key={i}>{t.original} {"->"} <strong>{t.suggested}</strong></li>
              ))}</ul>
            ) : <p>{results.jobTitleAIMessage}</p>}
           </div>

           <div style={{ padding: "10px 12px", borderRadius: "8px", background: "#020617", border: "1px solid #1f2937" }}>
            <h3>Links</h3>
            <p>GitHub: {results.hasGithub ? "Found" : "Not detected"}</p>
            <p>Portfolio: {results.hasPortfolio ? "Found" : "Not detected"}</p>
            <p>Total links: {results.allLinks.length}</p>
           </div>
           
           <div style={{ padding: "10px 12px", borderRadius: "8px", background: "#020617", border: "1px solid #1f2937" }}>
             <h3>Metrics</h3>
             <p>Bullets with metrics: {results.bulletsWithMetricsCount} / {results.bulletCount}</p>
           </div>

           {results.keywordCoverage && (
             <div style={{ padding: "10px 12px", borderRadius: "8px", background: "#020617", border: "1px solid #1f2937" }}>
               <h3>Keywords</h3>
               <p>Match: {results.keywordCoverage.percent}%</p>
               <p>Missing: {results.keywordCoverage.missing.slice(0, 10).join(", ")}</p>
             </div>
           )}
        </div>
      )}
    </div>
  );
}