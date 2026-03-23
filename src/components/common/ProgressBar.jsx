export function ProgressBar({ value, max, color = "#6366f1", height = 6 }) {
  const pct = max > 0 ? Math.min(100, Math.round(value / max * 100)) : 0;
  return (
    <div style={{ background: "#fce7f3", borderRadius: 99, height, overflow: "hidden" }}>
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          borderRadius: 99,
          transition: "width 0.6s cubic-bezier(.4,0,.2,1)"
        }}
      />
    </div>
  );
}
