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

/** ---------- RESUME TAB (still placeholder) ---------- **/

function ResumeTab() {
  return (
    <div>
      <h2>Resume Checker (coming soon)</h2>
      <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
        You’ll be able to upload a resume here and get feedback on links, action
        verbs, metrics, whitespace, and job-description keyword matches.
      </p>
    </div>
  );
}
