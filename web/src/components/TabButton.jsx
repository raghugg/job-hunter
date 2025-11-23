export default function TabButton({ label, active, onClick }) {
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