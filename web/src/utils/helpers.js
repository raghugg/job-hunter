import { defaultTodayTasks } from "./constants";

// "YYYY-MM-DD"
export function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

// Get the start of the current calendar week (Sunday)
export function getWeekKey() {
  const today = new Date();
  const day = today.getDay(); // 0 (Sunday) to 6 (Saturday)
  const diff = today.getDate() - day; // Calculate Sunday of current week
  const sunday = new Date(today.setDate(diff));
  return sunday.toISOString().slice(0, 10);
}

// streak of consecutive goalMet days up to today
export function computeStreak(history = {}) {
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

// helper to build a fresh empty state
export function createEmptyState() {
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

export const ensureHttps = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return "https://" + url;
};