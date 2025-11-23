export default function ScheduleTab({ tasks, setState }) {
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
        <div key={task.id} style={{ padding: "10px 12px", marginBottom: "10px", borderRadius: "8px", background: "#020617", border: "1px solid #1f2937" }}>
          <div style={{ marginBottom: "6px" }}>
            <label style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Task label</label>
            <input
              type="text"
              value={task.label}
              onChange={(e) => handleChange(task.id, "label", e.target.value)}
              style={{ width: "100%", marginTop: "4px", padding: "6px 8px", borderRadius: "4px", border: "1px solid #4b5563", background: "#020617", color: "#e5e7eb" }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "4px" }}>
            <div style={{ flex: "0 0 120px" }}>
              <label style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Target</label>
              <input
                type="number"
                min={1}
                value={task.target}
                onChange={(e) => handleChange(task.id, "target", Number(e.target.value) || 1)}
                style={{ width: "100%", marginTop: "4px", padding: "6px 8px", borderRadius: "4px", border: "1px solid #4b5563", background: "#020617", color: "#e5e7eb" }}
              />
            </div>

            <div style={{ flex: "0 0 160px" }}>
              <label style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Frequency</label>
              <select
                value={task.frequency}
                onChange={(e) => handleChange(task.id, "frequency", e.target.value)}
                style={{ width: "100%", marginTop: "4px", padding: "6px 8px", borderRadius: "4px", border: "1px solid #4b5563", background: "#020617", color: "#e5e7eb" }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}