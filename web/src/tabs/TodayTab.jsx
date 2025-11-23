import { getTodayKey, computeStreak } from "../utils/helpers";

export default function TodayTab({ state, setState }) {
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
  }).reverse();

  return (
    <div>
      <div style={{
          padding: "12px 16px", marginBottom: "16px", borderRadius: "8px",
          background: "#020617", border: "1px solid #1f2937",
        }}>
        <h2 style={{ margin: 0, marginBottom: "4px", fontSize: "1.1rem" }}>Today&apos;s Progress</h2>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "#9ca3af" }}>
          {completedTasks} / {tasks.length} tasks completed
        </p>
        <p style={{ margin: 0, marginTop: "4px", fontSize: "0.9rem", color: "#9ca3af" }}>
          Streak: {streak} day{streak === 1 ? "" : "s"} with all goals met
        </p>
      </div>

      <div style={{
          padding: "12px 16px", borderRadius: "8px", background: "#020617",
          border: "1px solid #1f2937", marginBottom: "16px",
        }}>
        <h2 style={{ marginTop: 0, marginBottom: "8px", fontSize: "1.1rem" }}>Checklist</h2>
        {tasks.map((task) => {
          const done = task.completedCount >= task.target;
          return (
            <label key={task.id} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "6px 0", cursor: "pointer" }}>
              <input type="checkbox" checked={done} onChange={() => toggleTask(task.id)} style={{ marginTop: "3px" }} />
              <div>
                <div>{task.label}</div>
                <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "2px" }}>
                  Target: {task.target} &bull; Frequency: {task.frequency}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      <div style={{
          padding: "12px 16px", borderRadius: "8px", background: "#020617",
          border: "1px solid #1f2937",
        }}>
        <h2 style={{ marginTop: 0, marginBottom: "8px", fontSize: "1.1rem" }}>History (last 7 days)</h2>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", fontSize: "0.85rem" }}>
          {last7Days.map((day) => {
            let statusLabel = "0% done";
            let statusColor = "#9ca3af";
            let bg = "#111827";

            if (day.percent === 100) {
              statusLabel = "100% done";
              statusColor = "#4ade80";
              bg = "#16a34a22";
            } else if (day.percent > 0) {
              statusLabel = `${day.percent}% done`;
              statusColor = "#facc15";
              bg = "#43380f";
            }

            return (
              <div key={day.key} style={{ padding: "6px 8px", borderRadius: "6px", border: "1px solid #1f2937", background: bg, minWidth: "110px" }}>
                <div style={{ color: "#e5e7eb" }}>{day.label}</div>
                <div style={{ marginTop: "2px", color: statusColor }}>{statusLabel}</div>
                {day.total > 0 && (
                  <div style={{ marginTop: "2px", color: "#9ca3af", fontSize: "0.8rem" }}>
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