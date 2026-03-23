export function Badge({ children, color }) {
  return (
    <span
      style={{
        background: color + "22",
        color,
        fontSize: 11,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: 99,
        letterSpacing: "0.04em",
        textTransform: "uppercase"
      }}
    >
      {children}
    </span>
  );
}
