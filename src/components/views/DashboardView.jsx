import { ProgressBar, Badge } from "../common";
import { CURRICULUM, totalChapters } from "../../constants/curriculum";

export function DashboardView({ stats, overallPct, subject, setSubject, nav, currentUser }) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "clamp(20px,4vw,26px)", fontWeight: 800, color: "#831843", margin: 0 }}>Welcome back, {currentUser}! 👋</h1>
        <p style={{ color: "#be185d", marginTop: 4, fontSize: "clamp(13px,2vw,15px)" }}>CBSE Class 12 Board Exam Preparation — All Subjects</p>
      </div>

      {/* Overall Progress */}
      <div className="dash-overall">
        <div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 4 }}>Overall Progress</div>
          <div style={{ fontSize: 40, fontWeight: 900 }}>{overallPct}%</div>
          <div style={{ fontSize: 13, color: "#6366f1", marginTop: 2 }}>Towards Board Exam Readiness</div>
        </div>
        <div className="dash-overall-stats">
          {[
            { v: stats.notesRead, t: "Notes Read", emoji: "📝", c: "#818cf8" },
            { v: stats.quizDone, t: "Quizzes Done", emoji: "✅", c: "#34d399" },
            { v: totalChapters, t: "Total Chapters", emoji: "📚", c: "#f59e0b" }
          ].map(({ v, t, emoji, c }) => (
            <div key={t} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 14, padding: "14px 20px", textAlign: "center", minWidth: 90 }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{emoji}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: c }}>{v}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{t}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Subject Cards */}
      <h2 style={{ fontSize: 16, fontWeight: 700, color: "#475569", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>📚 Select a Subject</h2>
      <div className="dash-grid">
        {Object.entries(CURRICULUM).map(([s, d]) => {
          const st = stats.bySubject[s];
          const pct = Math.round((st.n + st.q) / (st.t * 2) * 100);
          return (
            <button key={s} className="card hover-lift" onClick={() => { setSubject(s); nav("subject"); }}
              style={{ textAlign: "left", border: "none", width: "100%", padding: 0, overflow: "hidden" }}>
              <div style={{ background: d.gradient, padding: "20px 20px 16px", color: "white" }}>
                <div style={{ fontSize: 32, marginBottom: 6 }}>{d.emoji}</div>
                <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>{s}</div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{d.units.length} Units · {st.t} Chapters · NCERT Class 12</div>
              </div>
              <div style={{ padding: "14px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                  <span>Progress</span><span style={{ fontWeight: 700, color: d.accent }}>{pct}%</span>
                </div>
                <ProgressBar value={st.n + st.q} max={st.t * 2} color={d.accent} height={6} />
                <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 12, color: "#64748b" }}>
                  <span>📖 {st.n} notes read</span>
                  <span>✅ {st.q} quizzes done</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
