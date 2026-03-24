import { useState, useEffect } from "react";

export function LoadingScreen({ message, emoji = "🔄" }) {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 400);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 360,
        gap: 16
      }}
    >
      <div style={{ fontSize: 52, animation: "pulse 1.5s infinite" }}>{emoji}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>
        {message}
        {dots}
      </div>
      <div style={{ fontSize: 13, color: "#94a3b8" }}>This may take 15–30 seconds</div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#0891b2",
              animation: `bounce 1.2s ${i * 0.2}s infinite`
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
        @keyframes bounce { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-8px);opacity:1} }
      `}</style>
    </div>
  );
}
