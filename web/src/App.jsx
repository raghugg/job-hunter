import { useState, useEffect } from "react";
import TodayTab from "./tabs/TodayTab";
import ApplyTab from "./tabs/ApplyTab";
import LeetCodeTab from "./tabs/LeetCodeTab";
import ResumeTab from "./tabs/ResumeTab";
import { VIEWS, STORAGE_KEY, defaultTodayTasks } from "./utils/constants";
import { getTodayKey, getWeekKey, createEmptyState } from "./utils/helpers";

const SETTINGS_KEY = "jobhunter_settings";

export default function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(() => {
    try {
      const saved = window.localStorage.getItem(SETTINGS_KEY);
      return saved ? JSON.parse(saved) : { defaultView: VIEWS.RESUME };
    } catch {
      return { defaultView: VIEWS.RESUME };
    }
  });
  const [currentView, setCurrentView] = useState(settings.defaultView);

  // ---------- SHARED STATE FOR TASKS + HISTORY ----------
  const [state, setState] = useState(() => {
    const todayKey = getTodayKey();
    const weekKey = getWeekKey();

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return createEmptyState();

      const parsed = JSON.parse(raw);

      // Merge old tasks with new default structure to add linkedView property
      const mergeTasks = (oldTasks) => {
        // Start with all existing tasks
        const merged = [...(oldTasks || [])];

        // Add any missing default tasks
        defaultTodayTasks.forEach((defaultTask) => {
          if (!merged.find((t) => t.id === defaultTask.id)) {
            merged.push({ ...defaultTask });
          }
        });

        // Update properties from defaults (like linkedView, isDefault)
        return merged.map((task) => {
          const defaultTask = defaultTodayTasks.find((t) => t.id === task.id);
          if (defaultTask) {
            return { ...task, linkedView: defaultTask.linkedView, isDefault: defaultTask.isDefault };
          }
          return task;
        });
      };

      // Check if we need to reset tasks
      const dayChanged = parsed.lastDate !== todayKey;
      const weekChanged = parsed.lastWeek !== weekKey;

      if (dayChanged || weekChanged) {
        const resetTasks = mergeTasks(parsed.tasks || defaultTodayTasks).map((t) => {
          // Reset daily tasks if day changed
          if (t.frequency === "daily" && dayChanged) {
            return { ...t, completedCount: 0 };
          }
          // Reset weekly tasks if week changed
          if (t.frequency === "weekly" && weekChanged) {
            return { ...t, completedCount: 0 };
          }
          return t;
        });

        return {
          tasks: resetTasks,
          history: parsed.history || {},
          lastDate: todayKey,
          lastWeek: weekKey,
        };
      }

      return {
        tasks: mergeTasks(parsed.tasks || defaultTodayTasks),
        history: parsed.history || {},
        lastDate: parsed.lastDate || todayKey,
        lastWeek: parsed.lastWeek || weekKey,
      };
    } catch {
      return createEmptyState();
    }
  });

  // Save everything whenever state changes
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Save settings whenever they change
  useEffect(() => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateDefaultView = (view) => {
    setSettings({ ...settings, defaultView: view });
  };

  const resetAllData = () => {
    const confirmMessage = "⚠️ WARNING: This will DELETE ALL your data including:\n\n• All tasks (custom and default)\n• All history and streaks\n• All settings\n\nThis action CANNOT be undone!\n\nType 'DELETE' to confirm:";
    const userInput = window.prompt(confirmMessage);

    if (userInput === "DELETE") {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(SETTINGS_KEY);
      window.location.reload();
    } else if (userInput !== null) {
      alert("Reset cancelled. You must type 'DELETE' exactly to confirm.");
    }
  };

  // Sync currentView with settings.defaultView on mount and when settings change
  useEffect(() => {
    setCurrentView(settings.defaultView);
  }, [settings.defaultView]);

  return (
    <div className="app">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <h1 style={{ margin: 0 }}>Job Hunter</h1>
        <button
          onClick={() => setShowSettings(true)}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            border: "1px solid #4b5563",
            background: "#1f2937",
            color: "#e5e7eb",
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowSettings(false)}
        >
          <div
            style={{
              background: "#020617",
              border: "1px solid #1f2937",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "500px",
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "1.3rem" }}>Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  border: "1px solid #4b5563",
                  background: "#1f2937",
                  color: "#e5e7eb",
                  fontSize: "1rem",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1rem", marginTop: 0, marginBottom: "12px" }}>Default Landing View</h3>
              <p style={{ fontSize: "0.85rem", color: "#9ca3af", marginBottom: "12px" }}>
                Choose which page opens when you first visit Job Hunter
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px",
                    borderRadius: "6px",
                    border: `2px solid ${settings.defaultView === VIEWS.CHECKLIST ? "#22c55e" : "#1f2937"}`,
                    background: settings.defaultView === VIEWS.CHECKLIST ? "#22c55e11" : "#0f172a",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="defaultView"
                    checked={settings.defaultView === VIEWS.CHECKLIST}
                    onChange={() => updateDefaultView(VIEWS.CHECKLIST)}
                    style={{ cursor: "pointer" }}
                  />
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: "500", color: "#e5e7eb" }}>
                      Checklist & Progress Tracker
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "2px" }}>
                      Daily/weekly tasks, streaks, and history
                    </div>
                  </div>
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px",
                    borderRadius: "6px",
                    border: `2px solid ${settings.defaultView === VIEWS.RESUME ? "#22c55e" : "#1f2937"}`,
                    background: settings.defaultView === VIEWS.RESUME ? "#22c55e11" : "#0f172a",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="defaultView"
                    checked={settings.defaultView === VIEWS.RESUME}
                    onChange={() => updateDefaultView(VIEWS.RESUME)}
                    style={{ cursor: "pointer" }}
                  />
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: "500", color: "#e5e7eb" }}>
                      Resume Checker
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "2px" }}>
                      AI-powered resume analysis and optimization
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #22c55e",
                background: "#22c55e",
                color: "#000",
                fontSize: "0.9rem",
                cursor: "pointer",
                fontWeight: "500",
                marginBottom: "12px",
              }}
            >
              Save & Close
            </button>

            <div style={{ borderTop: "1px solid #1f2937", paddingTop: "12px" }}>
              <h3 style={{ fontSize: "0.9rem", marginTop: 0, marginBottom: "8px", color: "#9ca3af" }}>Debug Tools</h3>
              <button
                onClick={resetAllData}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #dc2626",
                  background: "#7f1d1d22",
                  color: "#fca5a5",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                🗑️ Reset All Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ marginTop: "30px" }}>
        {currentView === VIEWS.CHECKLIST && (
          <TodayTab
            state={state}
            setState={setState}
            onNavigate={(view) => setCurrentView(view)}
          />
        )}
        {currentView === VIEWS.APPLY && (
          <ApplyTab onBack={() => setCurrentView(VIEWS.CHECKLIST)} />
        )}
        {currentView === VIEWS.LEETCODE && (
          <LeetCodeTab onBack={() => setCurrentView(VIEWS.CHECKLIST)} />
        )}
        {currentView === VIEWS.RESUME && (
          <ResumeTab onBack={() => setCurrentView(VIEWS.CHECKLIST)} />
        )}
      </div>
    </div>
  );
}