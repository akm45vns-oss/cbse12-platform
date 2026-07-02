import { memo } from "react";

export const Breadcrumb = memo(function Breadcrumb({ items }) {
  if (!items || items.length <= 1) return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#64748b", overflow: "hidden", whiteSpace: "nowrap" }}>
      {items.map((item, idx) => (
        <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {idx > 0 && <span style={{ color: "#cbd5e1", fontSize: 10 }}>▶</span>}
          {item.onClick ? (
            <button
              onClick={item.onClick}
              style={{
                background: "none", border: "none", padding: 0, margin: 0,
                color: idx === items.length - 1 ? "#0f172a" : "#64748b",
                fontWeight: idx === items.length - 1 ? 800 : 600,
                cursor: "pointer", transition: "color 0.2s",
                maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#4f46e5"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = idx === items.length - 1 ? "#0f172a" : "#64748b"; }}
            >
              {item.label}
            </button>
          ) : (
            <span style={{
              color: idx === items.length - 1 ? "#0f172a" : "#64748b",
              fontWeight: idx === items.length - 1 ? 800 : 600,
              maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
});
