import { useState } from "react";
import { getTodayKey, computeStreak } from "../utils/helpers";
import { VIEWS, defaultTodayTasks } from "../utils/constants";

export default function TodayTab({ state, setState, onNavigate }) {
  const { tasks, history } = state;
  const [editMode, setEditMode] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [newTask, setNewTask] = useState({
    label: "",
    target: 1,
    frequency: "daily",
    linkedView: null,
    externalUrl: "",
  });

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

  const incrementTask = (id) => {
    setState((prev) => {
      const updatedTasks = prev.tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              completedCount: Math.min(task.completedCount + 1, task.target),
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

  const decrementTask = (id) => {
    setState((prev) => {
      const updatedTasks = prev.tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              completedCount: Math.max(task.completedCount - 1, 0),
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

  const startEdit = (task) => {
    setEditingTask({ ...task });
  };

  const saveEdit = () => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === editingTask.id ? editingTask : t
      ),
    }));
    setEditingTask(null);
  };

  const cancelEdit = () => {
    setEditingTask(null);
  };

  const deleteTask = (task) => {
    if (task.isDefault) {
      const sure = window.confirm(
        `"${task.label}" is a default task. Are you sure you want to remove it?`
      );
      if (!sure) return;
    }

    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== task.id),
    }));
  };

  const moveTaskUp = (index) => {
    if (index === 0) return;
    setState((prev) => {
      const newTasks = [...prev.tasks];
      [newTasks[index - 1], newTasks[index]] = [newTasks[index], newTasks[index - 1]];
      return { ...prev, tasks: newTasks };
    });
  };

  const moveTaskDown = (index) => {
    setState((prev) => {
      if (index === prev.tasks.length - 1) return prev;
      const newTasks = [...prev.tasks];
      [newTasks[index], newTasks[index + 1]] = [newTasks[index + 1], newTasks[index]];
      return { ...prev, tasks: newTasks };
    });
  };

  // Get display label for a task (updates number in default task labels)
  const getTaskDisplayLabel = (task) => {
    if (!task.isDefault) return task.label;

    // For default tasks, update the number in the label
    const baseLabels = {
      1: "Apply to {n} job{s}",
      2: "Solve {n} LeetCode / interview problem{s}",
      3: "Send {n} networking message{s} on LinkedIn",
      4: "Spend 15 minutes improving resume/portfolio",
    };

    const baseLabel = baseLabels[task.id];
    if (!baseLabel) return task.label;

    const pluralSuffix = task.target === 1 ? "" : "s";
    return baseLabel.replace("{n}", task.target).replace("{s}", pluralSuffix);
  };

  const addNewTask = () => {
    if (!newTask.label.trim()) {
      alert("Please enter a task label");
      return;
    }

    const task = {
      ...newTask,
      id: Date.now(),
      completedCount: 0,
      isDefault: false,
    };

    setState((prev) => ({
      ...prev,
      tasks: [...prev.tasks, task],
    }));

    setNewTask({
      label: "",
      target: 1,
      frequency: "daily",
      linkedView: null,
      externalUrl: "",
    });
    setShowAddForm(false);
  };

  const handleAddMissingDefaults = () => {
    const existingIds = new Set(tasks.map(t => t.id));
    const missingDefaults = defaultTodayTasks
      .filter(defaultTask => !existingIds.has(defaultTask.id))
      .map(task => ({ ...task, completedCount: 0 }));

    setState((prev) => ({
      ...prev,
      tasks: [...prev.tasks, ...missingDefaults],
    }));
    setShowRestoreModal(false);
  };

  const handleReplaceAll = () => {
    setShowRestoreModal(false);

    const confirmed = window.confirm(
      "⚠️ WARNING: This will DELETE all custom tasks.\n\nContinue?"
    );

    if (confirmed) {
      const resetDefaults = defaultTodayTasks.map(task => ({
        ...task,
        completedCount: 0
      }));

      setState((prev) => ({
        ...prev,
        tasks: resetDefaults,
      }));
    }
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

  // Separate tasks by frequency
  const dailyTasks = tasks.filter(t => t.frequency === "daily");
  const weeklyTasks = tasks.filter(t => t.frequency === "weekly");

  const renderTask = (task, index) => {
    const done = task.completedCount >= task.target;
    const isEditing = editingTask && editingTask.id === task.id;

    if (isEditing) {
      return (
        <div key={task.id} style={{ padding: "10px", marginBottom: "8px", borderRadius: "6px", background: "#0f172a", border: "1px solid #3b82f6" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {!task.isDefault && (
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "4px" }}>Task Label</label>
                <input
                  type="text"
                  value={editingTask.label}
                  onChange={(e) => setEditingTask({ ...editingTask, label: e.target.value })}
                  style={{ width: "100%", padding: "6px 8px", borderRadius: "4px", border: "1px solid #4b5563", background: "#020617", color: "#e5e7eb", fontSize: "0.85rem" }}
                />
              </div>
            )}
            {task.isDefault && (
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "4px" }}>Task Label (locked for default tasks)</label>
                <div style={{ padding: "6px 8px", borderRadius: "4px", background: "#1f2937", color: "#9ca3af", fontSize: "0.85rem" }}>
                  {getTaskDisplayLabel(editingTask)}
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: "8px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "4px" }}>Target</label>
                <input
                  type="number"
                  min={1}
                  value={editingTask.target}
                  onChange={(e) => setEditingTask({ ...editingTask, target: Number(e.target.value) || 1 })}
                  style={{ width: "100%", padding: "6px 8px", borderRadius: "4px", border: "1px solid #4b5563", background: "#020617", color: "#e5e7eb", fontSize: "0.85rem" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "4px" }}>Frequency</label>
                <select
                  value={editingTask.frequency}
                  onChange={(e) => setEditingTask({ ...editingTask, frequency: e.target.value })}
                  style={{ width: "100%", padding: "6px 8px", borderRadius: "4px", border: "1px solid #4b5563", background: "#020617", color: "#e5e7eb", fontSize: "0.85rem" }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>
            {!task.isDefault && (
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "4px" }}>Link to Internal View (optional)</label>
                <select
                  value={editingTask.linkedView || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, linkedView: e.target.value || null, externalUrl: "" })}
                  style={{ width: "100%", padding: "6px 8px", borderRadius: "4px", border: "1px solid #4b5563", background: "#020617", color: "#e5e7eb", fontSize: "0.85rem" }}
                >
                  <option value="">None</option>
                  <option value={VIEWS.APPLY}>Applications & Networking</option>
                  <option value={VIEWS.LEETCODE}>LeetCode</option>
                  <option value={VIEWS.RESUME}>Resume</option>
                </select>
              </div>
            )}
            {!task.isDefault && (
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "4px" }}>External URL (optional, overrides internal view)</label>
                <input
                  type="url"
                  value={editingTask.externalUrl || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, externalUrl: e.target.value })}
                  placeholder="https://example.com"
                  style={{ width: "100%", padding: "6px 8px", borderRadius: "4px", border: "1px solid #4b5563", background: "#020617", color: "#e5e7eb", fontSize: "0.85rem" }}
                />
              </div>
            )}
            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
              <button
                onClick={saveEdit}
                style={{ flex: 1, padding: "6px 12px", borderRadius: "4px", border: "1px solid #22c55e", background: "#22c55e", color: "#000", fontSize: "0.85rem", cursor: "pointer", fontWeight: "500" }}
              >
                Save
              </button>
              <button
                onClick={cancelEdit}
                style={{ flex: 1, padding: "6px 12px", borderRadius: "4px", border: "1px solid #4b5563", background: "#1f2937", color: "#e5e7eb", fontSize: "0.85rem", cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={task.id} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "6px 0" }}>
        {!editMode && (
          <input
            type="checkbox"
            checked={done}
            onChange={() => toggleTask(task.id)}
            style={{ marginTop: "3px", cursor: "pointer" }}
          />
        )}
        {!editMode && (
          <div style={{ display: "flex", gap: "4px", marginTop: "3px" }}>
            <button
              onClick={() => decrementTask(task.id)}
              disabled={task.completedCount === 0}
              style={{
                padding: "0px 6px",
                borderRadius: "3px",
                border: "1px solid #4b5563",
                background: task.completedCount === 0 ? "#1f2937" : "#374151",
                color: task.completedCount === 0 ? "#6b7280" : "#e5e7eb",
                fontSize: "0.8rem",
                cursor: task.completedCount === 0 ? "not-allowed" : "pointer",
                lineHeight: "1.2",
              }}
            >
              −
            </button>
            <div style={{ fontSize: "0.8rem", color: "#9ca3af", minWidth: "30px", textAlign: "center", lineHeight: "1.5" }}>
              {task.completedCount}/{task.target}
            </div>
            <button
              onClick={() => incrementTask(task.id)}
              disabled={task.completedCount >= task.target}
              style={{
                padding: "0px 6px",
                borderRadius: "3px",
                border: "1px solid #4b5563",
                background: task.completedCount >= task.target ? "#1f2937" : "#374151",
                color: task.completedCount >= task.target ? "#6b7280" : "#e5e7eb",
                fontSize: "0.8rem",
                cursor: task.completedCount >= task.target ? "not-allowed" : "pointer",
                lineHeight: "1.2",
              }}
            >
              +
            </button>
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ color: "#e5e7eb" }}>
            {!editMode && task.externalUrl ? (
              <a
                href={task.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  color: "#e5e7eb",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                {getTaskDisplayLabel(task)}
              </a>
            ) : !editMode && task.linkedView ? (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate(task.linkedView);
                }}
                style={{
                  color: "#e5e7eb",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                {getTaskDisplayLabel(task)}
              </span>
            ) : (
              getTaskDisplayLabel(task)
            )}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "2px" }}>
            Target: {task.target} • Frequency: {task.frequency}
          </div>
        </div>
        {editMode && (
          <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <button
                onClick={() => moveTaskUp(index)}
                disabled={index === 0}
                style={{
                  padding: "2px 6px",
                  borderRadius: "3px",
                  border: "1px solid #4b5563",
                  background: index === 0 ? "#1f2937" : "#374151",
                  color: index === 0 ? "#6b7280" : "#e5e7eb",
                  fontSize: "0.7rem",
                  cursor: index === 0 ? "not-allowed" : "pointer",
                  lineHeight: "1",
                }}
                title="Move up"
              >
                ▲
              </button>
              <button
                onClick={() => moveTaskDown(index)}
                disabled={index === tasks.length - 1}
                style={{
                  padding: "2px 6px",
                  borderRadius: "3px",
                  border: "1px solid #4b5563",
                  background: index === tasks.length - 1 ? "#1f2937" : "#374151",
                  color: index === tasks.length - 1 ? "#6b7280" : "#e5e7eb",
                  fontSize: "0.7rem",
                  cursor: index === tasks.length - 1 ? "not-allowed" : "pointer",
                  lineHeight: "1",
                }}
                title="Move down"
              >
                ▼
              </button>
            </div>
            <button
              onClick={() => startEdit(task)}
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid #3b82f6",
                background: "#1e3a8a22",
                color: "#93c5fd",
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
              Edit
            </button>
            <button
              onClick={() => deleteTask(task)}
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid #dc2626",
                background: "#7f1d1d22",
                color: "#fca5a5",
                fontSize: "0.75rem",
                cursor: "pointer",
              }}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <button
        onClick={() => onNavigate(VIEWS.RESUME)}
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
        Resume Checker →
      </button>

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <h2 style={{ marginTop: 0, marginBottom: 0, fontSize: "1.1rem" }}>
            Checklist <span style={{ fontWeight: "400", fontSize: "0.75rem", color: "#9ca3af" }}>(click underlined items to open)</span>
          </h2>
          <button
            onClick={() => {
              setEditMode(!editMode);
              setEditingTask(null);
              setShowAddForm(false);
            }}
            style={{
              padding: "4px 10px",
              borderRadius: "4px",
              border: "1px solid #4b5563",
              background: editMode ? "#3b82f622" : "#1f2937",
              color: "#e5e7eb",
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            {editMode ? "Done Editing" : "Edit"}
          </button>
        </div>

        {editMode && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              width: "100%",
              padding: "8px 12px",
              marginBottom: "12px",
              borderRadius: "6px",
              border: "1px solid #22c55e",
              background: "#22c55e22",
              color: "#e5e7eb",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            + Add Task
          </button>
        )}

        {showAddForm && (
          <div style={{ padding: "12px", marginBottom: "12px", borderRadius: "6px", background: "#0f172a", border: "1px solid #1f2937" }}>
            <h3 style={{ marginTop: 0, fontSize: "0.95rem" }}>Add New Task</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "4px" }}>Task Label</label>
                <input
                  type="text"
                  value={newTask.label}
                  onChange={(e) => setNewTask({ ...newTask, label: e.target.value })}
                  placeholder="e.g. Read 30 minutes"
                  style={{ width: "100%", padding: "6px 8px", borderRadius: "4px", border: "1px solid #4b5563", background: "#020617", color: "#e5e7eb", fontSize: "0.85rem" }}
                />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "4px" }}>Target</label>
                  <input
                    type="number"
                    min={1}
                    value={newTask.target}
                    onChange={(e) => setNewTask({ ...newTask, target: Number(e.target.value) || 1 })}
                    style={{ width: "100%", padding: "6px 8px", borderRadius: "4px", border: "1px solid #4b5563", background: "#020617", color: "#e5e7eb", fontSize: "0.85rem" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "4px" }}>Frequency</label>
                  <select
                    value={newTask.frequency}
                    onChange={(e) => setNewTask({ ...newTask, frequency: e.target.value })}
                    style={{ width: "100%", padding: "6px 8px", borderRadius: "4px", border: "1px solid #4b5563", background: "#020617", color: "#e5e7eb", fontSize: "0.85rem" }}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "4px" }}>Link to Internal View (optional)</label>
                <select
                  value={newTask.linkedView || ""}
                  onChange={(e) => setNewTask({ ...newTask, linkedView: e.target.value || null, externalUrl: "" })}
                  style={{ width: "100%", padding: "6px 8px", borderRadius: "4px", border: "1px solid #4b5563", background: "#020617", color: "#e5e7eb", fontSize: "0.85rem" }}
                >
                  <option value="">None</option>
                  <option value={VIEWS.APPLY}>Applications & Networking</option>
                  <option value={VIEWS.LEETCODE}>LeetCode</option>
                  <option value={VIEWS.RESUME}>Resume</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "4px" }}>External URL (optional, overrides internal view)</label>
                <input
                  type="url"
                  value={newTask.externalUrl}
                  onChange={(e) => setNewTask({ ...newTask, externalUrl: e.target.value })}
                  placeholder="https://example.com"
                  style={{ width: "100%", padding: "6px 8px", borderRadius: "4px", border: "1px solid #4b5563", background: "#020617", color: "#e5e7eb", fontSize: "0.85rem" }}
                />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={addNewTask}
                  style={{ flex: 1, padding: "8px 12px", borderRadius: "4px", border: "1px solid #22c55e", background: "#22c55e", color: "#000", fontSize: "0.85rem", cursor: "pointer", fontWeight: "500" }}
                >
                  Add Task
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  style={{ flex: 1, padding: "8px 12px", borderRadius: "4px", border: "1px solid #4b5563", background: "#1f2937", color: "#e5e7eb", fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Daily Tasks */}
        {dailyTasks.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ fontSize: "0.85rem", color: "#9ca3af", marginTop: "0", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "600" }}>
              Daily Tasks
            </h3>
            {dailyTasks.map((task) => renderTask(task, tasks.indexOf(task)))}
          </div>
        )}

        {/* Weekly Tasks */}
        {weeklyTasks.length > 0 && (
          <div>
            <h3 style={{ fontSize: "0.85rem", color: "#9ca3af", marginTop: "0", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "600" }}>
              Weekly Tasks
            </h3>
            {weeklyTasks.map((task) => renderTask(task, tasks.indexOf(task)))}
          </div>
        )}

        {editMode && (
          <button
            onClick={() => setShowRestoreModal(true)}
            style={{
              width: "100%",
              padding: "8px 12px",
              marginTop: "12px",
              borderRadius: "6px",
              border: "1px solid #4b5563",
              background: "#1f2937",
              color: "#9ca3af",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Restore Default Tasks
          </button>
        )}
      </div>

      {/* Restore Defaults Modal */}
      {showRestoreModal && (
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
          onClick={() => setShowRestoreModal(false)}
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
            <h2 style={{ margin: "0 0 16px 0", fontSize: "1.3rem" }}>Restore Default Tasks</h2>
            <p style={{ fontSize: "0.9rem", color: "#9ca3af", marginBottom: "24px" }}>
              Choose how you want to restore the default tasks:
            </p>

            <button
              onClick={handleAddMissingDefaults}
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "12px",
                borderRadius: "6px",
                border: "1px solid #22c55e",
                background: "#22c55e22",
                color: "#e5e7eb",
                fontSize: "0.9rem",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Add Missing Defaults
              <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "4px", fontWeight: "normal" }}>
                Keep your custom tasks and add back any missing default tasks
              </div>
            </button>

            <button
              onClick={handleReplaceAll}
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "12px",
                borderRadius: "6px",
                border: "1px solid #dc2626",
                background: "#7f1d1d22",
                color: "#fca5a5",
                fontSize: "0.9rem",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Replace All Tasks
              <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "4px", fontWeight: "normal" }}>
                Delete all current tasks and restore only the 4 defaults
              </div>
            </button>

            <button
              onClick={() => setShowRestoreModal(false)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #4b5563",
                background: "#1f2937",
                color: "#9ca3af",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
              <div key={day.key} style={{ padding: "6px 8px", borderRadius: "6px", border: "1px solid #1f2937", background: bg, flex: "1 1 auto", minWidth: "100px", maxWidth: "140px" }}>
                <div style={{ color: "#e5e7eb", fontSize: "0.85rem" }}>{day.label}</div>
                <div style={{ marginTop: "2px", color: statusColor, fontSize: "0.85rem" }}>{statusLabel}</div>
                {day.total > 0 && (
                  <div style={{ marginTop: "2px", color: "#9ca3af", fontSize: "0.75rem" }}>
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
