import { useState, useEffect } from "react";
import TabButton from "./components/TabButton";
import TodayTab from "./tabs/TodayTab";
import ScheduleTab from "./tabs/ScheduleTab";
import ApplyTab from "./tabs/ApplyTab";
import LeetCodeTab from "./tabs/LeetCodeTab";
import ResumeTab from "./tabs/ResumeTab";
import { TABS, STORAGE_KEY, defaultTodayTasks } from "./utils/constants";
import { getTodayKey, createEmptyState } from "./utils/helpers";

export default function App() {
  const [activeTab, setActiveTab] = useState(TABS.TODAY);

  // ---------- SHARED STATE FOR TASKS + HISTORY ----------
  const [state, setState] = useState(() => {
    const todayKey = getTodayKey();

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return createEmptyState();

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <h1 style={{ margin: 0 }}>Job Hunter</h1>
        <button onClick={handleReset} style={{ padding: "6px 10px", borderRadius: "999px", border: "1px solid #4b5563", background: "#020617", color: "#e5e7eb", fontSize: "0.8rem", cursor: "pointer" }}>
          Reset data
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginTop: "20px", flexWrap: "wrap" }}>
        <TabButton label="Today" active={activeTab === TABS.TODAY} onClick={() => setActiveTab(TABS.TODAY)} />
        <TabButton label="Schedule" active={activeTab === TABS.SCHEDULE} onClick={() => setActiveTab(TABS.SCHEDULE)} />
        <TabButton label="Networking" active={activeTab === TABS.APPLY} onClick={() => setActiveTab(TABS.APPLY)} />
        <TabButton label="LeetCode" active={activeTab === TABS.LEETCODE} onClick={() => setActiveTab(TABS.LEETCODE)} />
        <TabButton label="Resume" active={activeTab === TABS.RESUME} onClick={() => setActiveTab(TABS.RESUME)} />
      </div>

      {/* Content */}
      <div style={{ marginTop: "30px" }}>
        {activeTab === TABS.TODAY && <TodayTab state={state} setState={setState} />}
        {activeTab === TABS.SCHEDULE && <ScheduleTab tasks={state.tasks} setState={setState} />}
        {activeTab === TABS.APPLY && <ApplyTab />}
        {activeTab === TABS.LEETCODE && <LeetCodeTab />}
        {activeTab === TABS.RESUME && <ResumeTab />}
      </div>
    </div>
  );
}