import { useState, useEffect } from "react";

const TABS = {
  TODAY: "today",
  SCHEDULE: "schedule",
  APPLY: "apply",
  LEETCODE: "leetcode",
  LINKEDIN: "linkedin",
  RESUME: "resume",
};

const STORAGE_KEY = "jobhunter_state_v1";

const defaultTodayTasks = [
  {
    id: 1,
    label: "Apply to 3 jobs",
    target: 3,
    completedCount: 0,
    frequency: "daily",
  },
  {
    id: 2,
    label: "Solve 1 LeetCode / interview problem",
    target: 1,
    completedCount: 0,
    frequency: "daily",
  },
  {
    id: 3,
    label: "Send 2 networking messages on LinkedIn",
    target: 2,
    completedCount: 0,
    frequency: "daily",
  },
  {
    id: 4,
    label: "Spend 15 minutes improving resume/portfolio",
    target: 1,
    completedCount: 0,
    frequency: "weekly",
  },
];

// "YYYY-MM-DD"
function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

// streak of consecutive goalMet days up to today
function computeStreak(history = {}) {
  let streak = 0;
  const d = new Date();

  while (true) {
    const key = d.toISOString().slice(0, 10);
    const entry = history[key];
    if (entry && entry.goalMet) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// helper to build a fresh empty state (used at start + on reset)
function createEmptyState() {
  const todayKey = getTodayKey();
  const resetTasks = defaultTodayTasks.map((t) => ({
    ...t,
    completedCount: 0,
  }));

  return {
    tasks: resetTasks,
    history: {},
    lastDate: todayKey,
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState(TABS.TODAY);

  // ---------- SHARED STATE FOR TASKS + HISTORY ----------
  const [state, setState] = useState(() => {
    const todayKey = getTodayKey();

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return createEmptyState();
      }

      const parsed = JSON.parse(raw);

      // New day → reset completion but keep tasks/history
      if (parsed.lastDate !== todayKey) {
        const resetTasks = (parsed.tasks || defaultTodayTasks).map((t) => ({
          ...t,
          completedCount: 0,
        }));
        return {
          tasks: resetTasks,
          history: parsed.history || {},
          lastDate: todayKey,
        };
      }

      return {
        tasks: parsed.tasks || defaultTodayTasks,
        history: parsed.history || {},
        lastDate: parsed.lastDate || todayKey,
      };
    } catch {
      return createEmptyState();
    }
  });

  // Save everything whenever state changes
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // ---------- Reset all data ----------
  const handleReset = () => {
    const sure = window.confirm(
      "Reset all Job Hunter data? This will clear tasks, streaks, and history."
    );
    if (!sure) return;

    window.localStorage.removeItem(STORAGE_KEY);
    setState(createEmptyState());
  };

  return (
    <div className="app">
      {/* Header + reset */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <h1 style={{ margin: 0 }}>Job Hunter</h1>
        <button
          onClick={handleReset}
          style={{
            padding: "6px 10px",
            borderRadius: "999px",
            border: "1px solid #4b5563",
            background: "#020617",
            color: "#e5e7eb",
            fontSize: "0.8rem",
            cursor: "pointer",
          }}
        >
          Reset data
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginTop: "20px",
          flexWrap: "wrap",
        }}
      >
        <TabButton
          label="Today"
          active={activeTab === TABS.TODAY}
          onClick={() => setActiveTab(TABS.TODAY)}
        />
        <TabButton
          label="Schedule"
          active={activeTab === TABS.SCHEDULE}
          onClick={() => setActiveTab(TABS.SCHEDULE)}
        />
        <TabButton
          label="Apply"
          active={activeTab === TABS.APPLY}
          onClick={() => setActiveTab(TABS.APPLY)}
        />
        <TabButton
          label="LeetCode"
          active={activeTab === TABS.LEETCODE}
          onClick={() => setActiveTab(TABS.LEETCODE)}
        />
        <TabButton
          label="LinkedIn"
          active={activeTab === TABS.LINKEDIN}
          onClick={() => setActiveTab(TABS.LINKEDIN)}
        />
        <TabButton
          label="Resume"
          active={activeTab === TABS.RESUME}
          onClick={() => setActiveTab(TABS.RESUME)}
        />
      </div>

      {/* Content */}
      <div style={{ marginTop: "30px" }}>
        {activeTab === TABS.TODAY && (
          <TodayTab state={state} setState={setState} />
        )}
        {activeTab === TABS.SCHEDULE && (
          <ScheduleTab tasks={state.tasks} setState={setState} />
        )}
        {activeTab === TABS.APPLY && <ApplyTab />}
        {activeTab === TABS.LEETCODE && <LeetCodeTab />}
        {activeTab === TABS.LINKEDIN && <LinkedInTab />}
        {activeTab === TABS.RESUME && <ResumeTab />}
      </div>
    </div>
  );
}

/** ---------- SMALL TAB BUTTON COMPONENT ---------- **/

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px",
        borderRadius: "999px",
        border: active ? "1px solid #22c55e" : "1px solid #4b5563",
        background: active ? "#22c55e22" : "#020617",
        color: "#e5e7eb",
        fontSize: "0.85rem",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

/** ---------- TODAY TAB ---------- **/

function TodayTab({ state, setState }) {
  const { tasks, history } = state;

  const toggleTask = (id) => {
    setState((prev) => {
      const updatedTasks = prev.tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              completedCount:
                task.completedCount >= task.target ? 0 : task.target,
            }
          : task
      );

      const todayKey = getTodayKey();
      const completedCount = updatedTasks.filter(
        (t) => t.completedCount >= t.target
      ).length;
      const total = updatedTasks.length;
      const allDone = completedCount === total && total > 0;

      const updatedHistory = {
        ...prev.history,
        [todayKey]: {
          goalMet: allDone,
          completedCount,
          total,
        },
      };

      return {
        tasks: updatedTasks,
        history: updatedHistory,
        lastDate: todayKey,
      };
    });
  };

  const completedTasks = tasks.filter(
    (t) => t.completedCount >= t.target
  ).length;
  const streak = computeStreak(history);

  const today = new Date();
  const last7Days = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(today.getDate() - idx);
    const key = d.toISOString().slice(0, 10);
    const entry = history[key];

    // Backwards-compatible if older entries only had goalMet
    let completed = 0;
    let total = 0;
    if (entry) {
      if (
        typeof entry.completedCount === "number" &&
        typeof entry.total === "number"
      ) {
        completed = entry.completedCount;
        total = entry.total;
      } else {
        completed = entry.goalMet ? 1 : 0;
        total = 1;
      }
    }

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const label = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "numeric",
      day: "numeric",
    });

    return { key, label, completed, total, percent };
  }).reverse(); // oldest first, today last

  return (
    <div>
      {/* Summary */}
      <div
        style={{
          padding: "12px 16px",
          marginBottom: "16px",
          borderRadius: "8px",
          background: "#020617",
          border: "1px solid #1f2937",
        }}
      >
        <h2 style={{ margin: 0, marginBottom: "4px", fontSize: "1.1rem" }}>
          Today&apos;s Progress
        </h2>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "#9ca3af" }}>
          {completedTasks} / {tasks.length} tasks completed
        </p>
        <p
          style={{
            margin: 0,
            marginTop: "4px",
            fontSize: "0.9rem",
            color: "#9ca3af",
          }}
        >
          Streak: {streak} day{streak === 1 ? "" : "s"} with all goals met
        </p>
      </div>

      {/* Checklist */}
      <div
        style={{
          padding: "12px 16px",
          borderRadius: "8px",
          background: "#020617",
          border: "1px solid #1f2937",
          marginBottom: "16px",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "8px", fontSize: "1.1rem" }}>
          Checklist
        </h2>

        {tasks.map((task) => {
          const done = task.completedCount >= task.target;
          return (
            <label
              key={task.id}
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                padding: "6px 0",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={done}
                onChange={() => toggleTask(task.id)}
                style={{ marginTop: "3px" }}
              />
              <div>
                <div>{task.label}</div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    color: "#9ca3af",
                    marginTop: "2px",
                  }}
                >
                  Target: {task.target} &bull; Frequency: {task.frequency}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {/* History with partial credit */}
      <div
        style={{
          padding: "12px 16px",
          borderRadius: "8px",
          background: "#020617",
          border: "1px solid #1f2937",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "8px", fontSize: "1.1rem" }}>
          History (last 7 days)
        </h2>
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            fontSize: "0.85rem",
          }}
        >
          {last7Days.map((day) => {
            let statusLabel = "⬜ 0% done";
            let statusColor = "#9ca3af";
            let bg = "#111827";

            if (day.percent === 100) {
              statusLabel = "✅ 100% done";
              statusColor = "#4ade80";
              bg = "#16a34a22";
            } else if (day.percent > 0) {
              statusLabel = `🟡 ${day.percent}% done`;
              statusColor = "#facc15";
              bg = "#43380f";
            }

            return (
              <div
                key={day.key}
                style={{
                  padding: "6px 8px",
                  borderRadius: "6px",
                  border: "1px solid #1f2937",
                  background: bg,
                  minWidth: "110px",
                }}
              >
                <div style={{ color: "#e5e7eb" }}>{day.label}</div>
                <div
                  style={{
                    marginTop: "2px",
                    color: statusColor,
                  }}
                >
                  {statusLabel}
                </div>
                {day.total > 0 && (
                  <div
                    style={{
                      marginTop: "2px",
                      color: "#9ca3af",
                      fontSize: "0.8rem",
                    }}
                  >
                    {day.completed} / {day.total} tasks
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** ---------- SCHEDULE TAB (EDIT TASKS) ---------- **/

function ScheduleTab({ tasks, setState }) {
  const handleChange = (id, field, value) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === id ? { ...t, [field]: value } : t
      ),
    }));
  };

  return (
    <div>
      <h2>Schedule</h2>
      <p style={{ fontSize: "0.9rem", color: "#9ca3af", marginBottom: "12px" }}>
        Adjust how many of each task you aim to do and how often you want to do
        it. These changes will affect your Today checklist.
      </p>

      {tasks.map((task) => (
        <div
          key={task.id}
          style={{
            padding: "10px 12px",
            marginBottom: "10px",
            borderRadius: "8px",
            background: "#020617",
            border: "1px solid #1f2937",
          }}
        >
          <div style={{ marginBottom: "6px" }}>
            <label style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
              Task label
            </label>
            <input
              type="text"
              value={task.label}
              onChange={(e) =>
                handleChange(task.id, "label", e.target.value)
              }
              style={{
                width: "100%",
                marginTop: "4px",
                padding: "6px 8px",
                borderRadius: "4px",
                border: "1px solid #4b5563",
                background: "#020617",
                color: "#e5e7eb",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              marginTop: "4px",
            }}
          >
            <div style={{ flex: "0 0 120px" }}>
              <label style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                Target
              </label>
              <input
                type="number"
                min={1}
                value={task.target}
                onChange={(e) =>
                  handleChange(task.id, "target", Number(e.target.value) || 1)
                }
                style={{
                  width: "100%",
                  marginTop: "4px",
                  padding: "6px 8px",
                  borderRadius: "4px",
                  border: "1px solid #4b5563",
                  background: "#020617",
                  color: "#e5e7eb",
                }}
              />
            </div>

            <div style={{ flex: "0 0 160px" }}>
              <label style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                Frequency
              </label>
              <select
                value={task.frequency}
                onChange={(e) =>
                  handleChange(task.id, "frequency", e.target.value)
                }
                style={{
                  width: "100%",
                  marginTop: "4px",
                  padding: "6px 8px",
                  borderRadius: "4px",
                  border: "1px solid #4b5563",
                  background: "#020617",
                  color: "#e5e7eb",
                }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                {/* Custom disabled for now */}
                <option value="custom" disabled>
                  Custom (coming soon)
                </option>
              </select>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** ---------- APPLY TAB ---------- **/

function ApplyTab() {
  return (
    <div>
      <h2>Apply to Jobs</h2>
      <p style={{ fontSize: "0.9rem", color: "#9ca3af", marginBottom: "8px" }}>
        This tab will eventually help you track applications, keep a list of
        target companies, and maybe even suggest roles based on your profile.
      </p>
      <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
        For now, it&apos;s just a placeholder tied to your &quot;Apply to 3
        jobs&quot; task on the Today tab.
      </p>
    </div>
  );
}

/** ---------- LEETCODE TAB ---------- **/
function LeetCodeTab() {
  const [randomProblems, setRandomProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allProblems, setAllProblems] = useState([]);

  // Helper function to convert problem name to URL slug
  const titleToSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')           // Replace spaces with hyphens
      .replace(/-+/g, '-')            // Replace multiple hyphens with single hyphen
      .trim();
  };

  // Normalize difficulty to standard format
  const normalizeDifficulty = (diff) => {
    if (diff.toLowerCase().includes('easy')) return 'Easy';
    if (diff.toLowerCase().includes('med')) return 'Medium';
    if (diff.toLowerCase().includes('hard')) return 'Hard';
    return diff;
  };

  // Load problems from JSON file on component mount
  useEffect(() => {
    const loadProblems = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/leetcode-problems.json'); // Adjust path as needed
        if (!response.ok) {
          throw new Error('Failed to load problems file');
        }
        const data = await response.json();
        
        // Transform the data to include URLs
        const problemsWithUrls = data.map(problem => ({
          id: problem.number,
          title: problem.name,
          difficulty: normalizeDifficulty(problem.difficulty),
          url: `https://leetcode.com/problems/${titleToSlug(problem.name)}/`
        }));
        
        setAllProblems(problemsWithUrls);
      } catch (err) {
        setError(err.message);
        console.error('Error loading problems:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProblems();
  }, []);

  const getRandomProblems = () => {
    if (allProblems.length === 0) {
      setError('No problems loaded yet');
      return;
    }

    const shuffled = [...allProblems].sort(() => Math.random() - 0.5);
    setRandomProblems(shuffled.slice(0, 3));
  };

  const difficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Easy":
        return "#4ade80";
      case "Medium":
        return "#facc15";
      case "Hard":
        return "#f87171";
      default:
        return "#9ca3af";
    }
  };

  return (
    <div>
      <h2>LeetCode / Interview Practice</h2>
      <p style={{ fontSize: "0.9rem", color: "#9ca3af", marginBottom: "16px" }}>
        {allProblems.length > 0 
          ? `Get 3 random LeetCode problems to practice. Database includes ${allProblems.length} problems!`
          : "Loading problems..."}
      </p>

      <button
        onClick={getRandomProblems}
        disabled={loading || allProblems.length === 0}
        style={{
          padding: "10px 20px",
          borderRadius: "8px",
          border: "1px solid #22c55e",
          background: (loading || allProblems.length === 0) ? "#1f2937" : "#22c55e22",
          color: (loading || allProblems.length === 0) ? "#9ca3af" : "#e5e7eb",
          fontSize: "0.9rem",
          cursor: (loading || allProblems.length === 0) ? "not-allowed" : "pointer",
          marginBottom: "20px",
        }}
      >
        {loading ? "⏳ Loading problems..." : "🎲 Get 3 Random Problems"}
      </button>

      {error && (
        <div
          style={{
            padding: "12px",
            borderRadius: "8px",
            background: "#7f1d1d22",
            border: "1px solid #dc2626",
            color: "#fca5a5",
            marginBottom: "16px",
            fontSize: "0.9rem",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {randomProblems.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {randomProblems.map((problem) => (
            <a
              key={problem.id}
              href={problem.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "16px",
                borderRadius: "8px",
                background: "#020617",
                border: "1px solid #1f2937",
                textDecoration: "none",
                color: "#e5e7eb",
                display: "block",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#22c55e";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#1f2937";
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "1rem", marginBottom: "4px" }}>
                    {problem.title}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                    Problem #{problem.id}
                  </div>
                </div>
                <div
                  style={{
                    padding: "4px 12px",
                    borderRadius: "999px",
                    fontSize: "0.8rem",
                    fontWeight: "500",
                    background: `${difficultyColor(problem.difficulty)}22`,
                    color: difficultyColor(problem.difficulty),
                    border: `1px solid ${difficultyColor(problem.difficulty)}`,
                  }}
                >
                  {problem.difficulty}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
/** ---------- LINKEDIN TAB ---------- **/

function LinkedInTab() {
  return (
    <div>
      <h2>LinkedIn Networking</h2>
      <p style={{ fontSize: "0.9rem", color: "#9ca3af", marginBottom: "8px" }}>
        This tab is for anything around outreach: tracking who you messaged,
        templates for cold messages, and follow-up reminders.
      </p>
      <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
        It ties to your &quot;Send 2 networking messages on LinkedIn&quot;
        daily task.
      </p>
    </div>
  );
}

// Make sure this is at the top of the file:
// import { useState } from "react";

/** ---------- RESUME TAB (AI titles + AI keywords + key management) ---------- **/

function ResumeTab() {
  const [resumeText, setResumeText] = useState("");
  const [jobText, setJobText] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // store API key in localStorage so user only pastes once
  const [userGeminiKey, setUserGeminiKey] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("jobhunter_gemini_key") || "";
  });

  const actionVerbs = [
    "led",
    "built",
    "created",
    "implemented",
    "designed",
    "developed",
    "improved",
    "optimized",
    "managed",
    "organized",
    "increased",
    "reduced",
    "launched",
    "owned",
    "collaborated",
    "automated",
  ];

  const handleSaveKey = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("jobhunter_gemini_key", userGeminiKey.trim());
    }
    setErrorMsg("");
    alert("Saved API key locally in this browser.");
  };

  const handleDeleteKey = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("jobhunter_gemini_key");
    }
    setUserGeminiKey("");
    setErrorMsg("");
    alert("API key deleted from this browser.");
  };

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
          const suggestions = await suggestJobTitleImprovementsBrowser(
            text,
            userGeminiKey
          );
          if (!suggestions || suggestions.length === 0) {
            jobTitleAIMessage =
              "No obviously confusing or overly internal job titles were detected.";
          } else {
            jobTitleSuggestions = suggestions;
          }
        } catch (titleErr) {
          console.error("Job title AI error:", titleErr);
          jobTitleAIMessage =
            "Job title AI check failed. Other checks still ran. Double-check your API key and quota.";
        }
      }

      // --- Links / GitHub / portfolio ---
      const urlRegex = /https?:\/\/[^\s)]+/gi;
      const allLinks = text.match(urlRegex) || [];
      const hasGithub = /github\.com/i.test(text);
      const hasPortfolio = allLinks.some(
        (link) =>
          !/github\.com/i.test(link) &&
          !/linkedin\.com/i.test(link) &&
          !/leetcode\.com/i.test(link)
      );

      // --- Bullets & metrics ---
      const lines = text.split(/\r?\n/);
      const bulletLines = lines.filter((line) =>
        /^[\s]*[-*•]/.test(line)
      );

      const bulletsWithMetrics = bulletLines.filter((line) =>
        /(\d|\bpercent\b|%|increase|decrease|improved|reduced|saved|grew|boosted)/i.test(
          line
        )
      );

      // --- Action verb at start of bullet ---
      const bulletsNeedingStrongerVerb = [];
      for (const line of bulletLines) {
        const withoutBullet = line.replace(/^[\s]*[-*•]\s*/, "");
        const firstWordMatch = withoutBullet.match(/^([A-Za-z']+)/);
        if (!firstWordMatch) continue;

        const firstWord = firstWordMatch[1].toLowerCase();
        const isActionVerb = actionVerbs.includes(firstWord);
        if (!isActionVerb) {
          bulletsNeedingStrongerVerb.push(line.trim());
        }
      }

      // --- Job description keyword coverage (AI, browser-only) ---
      let keywordCoverage = null;
      let aiMessage = ""; // message specifically for keyword AI

      if (jobText.trim().length > 0) {
        if (!userGeminiKey || !userGeminiKey.trim()) {
          aiMessage =
            "Add a Gemini API key above to see AI keyword coverage for this job description.";
        } else {
          try {
            const keywords = await extractKeywordsFromJobDescriptionBrowser(
              jobText,
              userGeminiKey
            );

            if (!keywords || keywords.length === 0) {
              console.warn(
                "AI keyword extraction returned no keywords. Skipping coverage section."
              );
              aiMessage =
                "AI keyword extraction returned no keywords. Check your key and Gemini quota.";
            } else {
              const resumeLower = lower;
              const matched = [];
              const missing = [];

              for (const kw of keywords) {
                if (resumeLower.includes(kw.toLowerCase())) {
                  matched.push(kw);
                } else {
                  missing.push(kw);
                }
              }

              const total = keywords.length || 1;
              const percent = Math.round((matched.length / total) * 100);

              keywordCoverage = {
                matched,
                missing,
                percent,
                total,
              };
            }
          } catch (aiErr) {
            console.error("AI keyword extraction failed:", aiErr);
            aiMessage =
              "AI keyword extraction failed. Other checks still ran. Double-check your API key and quota.";
          }
        }
      }

      setResults({
        jobTitleSuggestions,
        jobTitleAIMessage,
        allLinks,
        hasGithub,
        hasPortfolio,
        bulletCount: bulletLines.length,
        bulletsWithMetricsCount: bulletsWithMetrics.length,
        bulletsWithMetrics,
        bulletsNeedingStrongerVerb,
        keywordCoverage,
        aiMessage,
      });
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err?.message || "Something went wrong running the checks."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Resume Checker</h2>
      <p style={{ fontSize: "0.9rem", color: "#9ca3af", marginBottom: "12px" }}>
        Paste your resume text below. Optionally paste a job description and a
        Gemini API key to compare keywords (AI in browser).
      </p>

      {/* Gemini API key input */}
      <div
        style={{
          marginBottom: "16px",
          padding: "10px 12px",
          borderRadius: "8px",
          background: "#020617",
          border: "1px solid #1f2937",
        }}
      >
        <label
          style={{
            fontSize: "0.85rem",
            color: "#9ca3af",
            display: "block",
            marginBottom: "4px",
          }}
        >
          Gemini API key (stored only in this browser)
        </label>
        <input
          type="password"
          value={userGeminiKey}
          onChange={(e) => setUserGeminiKey(e.target.value)}
          placeholder="AIzaSyD-..."
          style={{
            width: "100%",
            borderRadius: "6px",
            border: "1px solid #4b5563",
            background: "#020617",
            color: "#e5e7eb",
            padding: "6px 8px",
            fontSize: "0.85rem",
            marginBottom: "6px",
          }}
        />
        <button
          onClick={handleSaveKey}
          style={{
            padding: "6px 10px",
            borderRadius: "999px",
            border: "1px solid #22c55e",
            background: "#22c55e22",
            color: "#e5e7eb",
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          Save key locally
        </button>
        <button
          onClick={handleDeleteKey}
          style={{
            padding: "6px 10px",
            borderRadius: "999px",
            border: "1px solid #ef4444",
            background: "#ef444433",
            color: "#e5e7eb",
            fontSize: "0.85rem",
            cursor: "pointer",
            marginLeft: "8px",
          }}
        >
          Delete key
        </button>
        <p
          style={{
            fontSize: "0.75rem",
            color: "#9ca3af",
            marginTop: "4px",
          }}
        >
          Your key is stored only in this browser’s localStorage and is never
          sent to any server you control.
        </p>
      </div>

      {/* Resume input */}
      <div
        style={{
          marginBottom: "16px",
          padding: "10px 12px",
          borderRadius: "8px",
          background: "#020617",
          border: "1px solid #1f2937",
        }}
      >
        <label
          style={{
            fontSize: "0.85rem",
            color: "#9ca3af",
            display: "block",
            marginBottom: "4px",
          }}
        >
          Resume text
        </label>
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          rows={10}
          placeholder="Paste your resume content here..."
          style={{
            width: "100%",
            borderRadius: "6px",
            border: "1px solid #4b5563",
            background: "#020617",
            color: "#e5e7eb",
            padding: "8px",
            fontFamily: "monospace",
            fontSize: "0.85rem",
          }}
        />
      </div>

      {/* Job description input */}
      <div
        style={{
          marginBottom: "16px",
          padding: "10px 12px",
          borderRadius: "8px",
          background: "#020617",
          border: "1px solid #1f2937",
        }}
      >
        <label
          style={{
            fontSize: "0.85rem",
            color: "#9ca3af",
            display: "block",
            marginBottom: "4px",
          }}
        >
          Job description (optional, used for AI keywords)
        </label>
        <textarea
          value={jobText}
          onChange={(e) => setJobText(e.target.value)}
          rows={6}
          placeholder="Paste a job description here..."
          style={{
            width: "100%",
            borderRadius: "6px",
            border: "1px solid #4b5563",
            background: "#020617",
            color: "#e5e7eb",
            padding: "8px",
            fontFamily: "monospace",
            fontSize: "0.85rem",
          }}
        />
      </div>

      {errorMsg && (
        <p
          style={{
            fontSize: "0.85rem",
            color: "#f97316",
            marginTop: 0,
            marginBottom: "8px",
          }}
        >
          {errorMsg}
        </p>
      )}

      <button
        onClick={analyze}
        disabled={!resumeText.trim() || loading}
        style={{
          padding: "8px 14px",
          borderRadius: "999px",
          border: "1px solid #22c55e",
          background:
            !resumeText.trim() || loading ? "#111827" : "#22c55e22",
          color: "#e5e7eb",
          fontSize: "0.9rem",
          cursor:
            !resumeText.trim() || loading ? "not-allowed" : "pointer",
          marginBottom: "16px",
        }}
      >
        {loading ? "Running checks..." : "Run checks"}
      </button>

      {results && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {/* Job title section (AI suggestions) */}
          <div
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              background: "#020617",
              border: "1px solid #1f2937",
            }}
          >
            <h3 style={{ marginTop: 0, fontSize: "1rem" }}>
              Job titles (AI suggestions)
            </h3>

            {results.jobTitleSuggestions &&
            results.jobTitleSuggestions.length > 0 ? (
              <>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "#9ca3af",
                    marginBottom: 6,
                  }}
                >
                  These titles might be confusing or overly internal. Consider
                  using the suggested version on your resume:
                </p>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "1.2rem",
                    fontSize: "0.85rem",
                    color: "#e5e7eb",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {results.jobTitleSuggestions.map((t, i) => (
                    <li key={i}>
                      <div>
                        <span style={{ color: "#9ca3af" }}>Original:</span>{" "}
                        {t.original}
                      </div>
                      <div>
                        <span style={{ color: "#9ca3af" }}>Suggested:</span>{" "}
                        <strong>{t.suggested}</strong>
                      </div>
                      {t.reason && (
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "#9ca3af",
                            marginTop: 2,
                          }}
                        >
                          {t.reason}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#9ca3af",
                  margin: 0,
                }}
              >
                {results.jobTitleAIMessage ||
                  "No obviously confusing or overly internal job titles were detected."}
              </p>
            )}
          </div>

          {/* Links section */}
          <div
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              background: "#020617",
              border: "1px solid #1f2937",
            }}
          >
            <h3 style={{ marginTop: 0, fontSize: "1rem" }}>Links</h3>
            <p style={{ fontSize: "0.9rem", color: "#9ca3af", margin: 0 }}>
              GitHub link:{" "}
              {results.hasGithub ? "✅ Found" : "⚠️ Not detected"}
              <br />
              Portfolio / personal site:{" "}
              {results.hasPortfolio
                ? "✅ Found"
                : "⚠️ Not clearly detected"}
              <br />
              Total links: {results.allLinks.length}
            </p>
          </div>

          {/* Metrics section */}
          <div
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              background: "#020617",
              border: "1px solid #1f2937",
            }}
          >
            <h3 style={{ marginTop: 0, fontSize: "1rem" }}>
              Metrics in bullets
            </h3>
            <p
              style={{
                fontSize: "0.9rem",
                color: "#9ca3af",
                marginBottom: 8,
              }}
            >
              Bullets with numbers/metrics:{" "}
              {results.bulletsWithMetricsCount} / {results.bulletCount}
            </p>
            {results.bulletsWithMetricsCount === 0 && (
              <p
                style={{ fontSize: "0.85rem", color: "#facc15", margin: 0 }}
              >
                Try adding numbers like &quot;increased X by 20%&quot;,
                &quot;reduced latency by 50ms&quot;, etc.
              </p>
            )}
          </div>

          {/* Action verb section */}
          <div
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              background: "#020617",
              border: "1px solid #1f2937",
            }}
          >
            <h3 style={{ marginTop: 0, fontSize: "1rem" }}>
              Bullet action verbs
            </h3>
            {results.bulletsNeedingStrongerVerb.length === 0 ? (
              <p
                style={{ fontSize: "0.9rem", color: "#9ca3af", margin: 0 }}
              >
                ✅ All detected bullets start with a strong verb (based on the
                current list).
              </p>
            ) : (
              <>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "#facc15",
                    marginBottom: 6,
                  }}
                >
                  These bullets might benefit from a stronger starting verb:
                </p>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "1.2rem",
                    fontSize: "0.85rem",
                    color: "#e5e7eb",
                  }}
                >
                  {results.bulletsNeedingStrongerVerb.map((line, idx) => (
                    <li key={idx}>{line}</li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Keyword coverage section (if job description given) */}
          {results.keywordCoverage && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                background: "#020617",
                border: "1px solid #1f2937",
              }}
            >
              <h3 style={{ marginTop: 0, fontSize: "1rem" }}>
                Job description keywords (AI, in browser)
              </h3>
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "#9ca3af",
                  marginBottom: 6,
                }}
              >
                Coverage: {results.keywordCoverage.percent}% (
                {results.keywordCoverage.matched.length} /{" "}
                {results.keywordCoverage.total} keywords)
              </p>
              {results.keywordCoverage.missing.length > 0 && (
                <>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "#facc15",
                      marginBottom: 4,
                    }}
                  >
                    Some keywords not found in your resume (you might weave
                    these in if they truly apply to you):
                  </p>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#e5e7eb",
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                    }}
                  >
                    {results.keywordCoverage.missing
                      .slice(0, 20)
                      .map((kw, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: "2px 6px",
                            borderRadius: "999px",
                            border: "1px solid #4b5563",
                          }}
                        >
                          {kw}
                        </span>
                      ))}
                    {results.keywordCoverage.missing.length > 20 && (
                      <span style={{ color: "#9ca3af" }}>…</span>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* If user provided job description but AI coverage is unavailable, show a helpful message */}
          {!results.keywordCoverage && jobText.trim().length > 0 && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                background: "#020617",
                border: "1px solid #1f2937",
              }}
            >
              <h3 style={{ marginTop: 0, fontSize: "1rem" }}>
                Job description keywords (AI)
              </h3>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#facc15",
                  marginBottom: 6,
                }}
              >
                {results.aiMessage ||
                  "Add a Gemini API key above to unlock AI keyword comparison for this job description."}
              </p>
              {!userGeminiKey && (
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "#9ca3af",
                    margin: 0,
                  }}
                >
                  Your resume checks (titles, links, metrics, action verbs)
                  still ran normally. The AI keyword comparison is optional.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Browser-only Gemini call for job description keywords */
async function extractKeywordsFromJobDescriptionBrowser(jobText, apiKey) {
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
    console.error("Gemini HTTP error:", res.status, txt);
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
  if (!rawKeywords) {
    return [];
  }

  let keywords = [];
  if (typeof rawKeywords === "string") {
    keywords = rawKeywords
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  } else if (Array.isArray(rawKeywords)) {
    keywords = rawKeywords.flatMap((item) => {
      if (typeof item !== "string") return [];
      return item
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
    });
  }

  const unique = Array.from(new Set(keywords));
  return unique.slice(0, 40);
}

/** Browser-only Gemini call for job title suggestions */
async function suggestJobTitleImprovementsBrowser(resumeText, apiKey) {
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
You are helping someone make their resume more understandable to typical tech recruiters.

Given the full resume text below, identify job titles used in the resume (including any top-of-resume headline AND the role titles in each experience section).

For each job title that is:
- overly internal (e.g. "DOE-SULI Intern", "Research Aide II"), OR
- unclear to a typical software / tech recruiter, OR
- missing a standard "Software Engineer / Intern / Developer / Data Scientist / etc." phrase,

suggest a clearer, more standard job title that could be used on the resume instead.

If a job title is already clear and standard (like "Software Engineering Intern", "Software Engineer", "Backend Engineer"), you may omit it from the list.

Return ONLY valid JSON of this shape:

{
  "titles": [
    {
      "original": "original job title exactly as written",
      "suggested": "clearer, more standard title that still reflects the role",
      "reason": "short explanation (one sentence) for why this is a better title"
    }
  ]
}

If there are no titles that you think need improvement, use:

{
  "titles": []
}

Resume text:
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
    console.error("Gemini HTTP error (job titles):", res.status, txt);
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
  } catch (e) {
    const cleaned = text.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(cleaned);
  }

  if (!parsed.titles || !Array.isArray(parsed.titles)) {
    return [];
  }

  const suggestions = parsed.titles
    .map((t) => ({
      original: String(t.original || "").trim(),
      suggested: String(t.suggested || "").trim(),
      reason: String(t.reason || "").trim(),
    }))
    .filter((t) => t.original && t.suggested);

  return suggestions;
}
