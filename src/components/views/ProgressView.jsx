import { ProgressBar } from "../common";
import { CURRICULUM } from "../../constants/curriculum";

export function ProgressView({ stats, overallPct, totalChapters, curriculum, progressData }) {
  return (
    <div style={{ animation: "cvFadeIn 0.5s ease-out" }}>
      <style>{`
        @keyframes cvFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <h1 style={{ fontSize: "clamp(28px, 5vw, 36px)", fontWeight: 900, color: "#1e293b", marginBottom: 8, letterSpacing: "-0.02em" }}>
        📊 My Progress
      </h1>
      <p style={{ color: "#475569", fontSize: "clamp(14px, 2.5vw, 16px)", marginBottom: 32, fontWeight: 500 }}>
        Tracking your preparation across all subjects
      </p>

      {/* Summary Stats Grid */}
      <div className="prog-summary-grid">
        {[
          { v: overallPct + "%", label: "Overall Completion", c: "#3b82f6", emoji: "🎯" },
          { v: stats.notesRead, label: "Notes Read", c: "#22c55e", emoji: "📝" },
          { v: stats.quizDone, label: "Quizzes Completed", c: "#10b981", emoji: "✅" },
          { v: totalChapters, label: "Total Chapters", c: "#f59e0b", emoji: "📚" },
        ].map(({ v, label, c, emoji }) => (
          <div key={label} style={{ 
            background: "rgba(255, 255, 255, 0.85)", 
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(0,0,0,0.05)",
            borderRadius: 24, 
            padding: "24px", 
            color: "#1e293b",
            boxShadow: "0 12px 32px rgba(148, 163, 184, 0.15), inset 0 1px 0 rgba(255,255,255,0.9)",
            position: "relative",
            overflow: "hidden"
          }}>
            <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, background: c, opacity: 0.15, borderRadius: "50%", filter: "blur(30px)", pointerEvents: "none" }} />
            <div style={{ fontSize: 28, marginBottom: 12, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))" }}>{emoji}</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: c, lineHeight: 1 }}>{v}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Per Subject Breakdown */}
      {Object.entries(curriculum).map(([s, d]) => {
        const st = stats.bySubject[s];
        const pct = Math.round((st.n + st.q) / (st.t * 2) * 100);
        return (
          <div key={s} className="card" style={{ 
            marginBottom: 24, 
            background: "rgba(255, 255, 255, 0.7)", 
            backdropFilter: "blur(32px)", 
            border: "1px solid rgba(0,0,0,0.05)", 
            borderRadius: 28, 
            padding: "clamp(24px, 4vw, 32px)",
            boxShadow: "0 20px 50px rgba(148, 163, 184, 0.15), inset 0 1px 0 rgba(255,255,255,0.9)"
          }}>
            {/* Subject Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
              <div style={{ width: 60, height: 60, borderRadius: 20, background: d.gradient || "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0, boxShadow: "0 8px 16px rgba(59, 130, 246, 0.2)" }}>
                <span style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}>{d.emoji}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 900, color: "#1e293b", fontSize: 22, letterSpacing: "-0.01em" }}>{s}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 4, fontWeight: 500 }}>{st.n} notes read · {st.q} quizzes done · {st.t} chapters total</div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: d.accent || "#3b82f6", filter: "drop-shadow(0 2px 4px rgba(59, 130, 246, 0.2))" }}>{pct}%</div>
            </div>
            
            <ProgressBar value={st.n + st.q} max={st.t * 2} color={d.accent || "#3b82f6"} height={10} />

            {/* Chapter breakdown */}
            <div style={{ marginTop: 28 }}>
              {d.units.map((unit, ui) => (
                <div key={ui} style={{ marginBottom: 20 }}>
                  <div style={{ 
                    fontSize: 11, fontWeight: 800, color: d.accent || "#3b82f6", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12, 
                    background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.05)", display: "inline-block", padding: "6px 14px", borderRadius: 100 
                  }}>
                    {unit.name}
                  </div>
                  <div className="prog-ch-grid">
                    {unit.chapters.map((ch, ci) => {
                      const nk = `${s}||${ch}||notes`;
                      const qk = `${s}||${ch}||quiz`;
                      const nRead = progressData[nk]?.read;
                      const qData = progressData[qk];
                      const best = qData?.best;
                      const attempts = qData?.attempts?.length || 0;
                      return (
                        <div key={ci} style={{ 
                          background: "rgba(255,255,255,0.4)", 
                          border: "1px solid rgba(0,0,0,0.04)",
                          borderRadius: 14, 
                          padding: "12px 16px", 
                          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.9)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.4)"; }}>
                          <span style={{ fontSize: 13, color: "#1e293b", fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch}</span>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                            <span title="Notes" style={{ opacity: nRead ? 1 : 0.3, filter: nRead ? "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" : "none" }}>{nRead ? "📖" : "◻️"}</span>
                            <span title="Quiz" style={{ opacity: attempts > 0 ? 1 : 0.3, filter: attempts > 0 ? "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" : "none" }}>{attempts > 0 ? "✅" : "◻️"}</span>
                            {best !== undefined && <span style={{ fontSize: 12, fontWeight: 800, color: d.accent || "#3b82f6", marginLeft: 4 }}>{best}/30</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
