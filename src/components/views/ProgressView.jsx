import { ProgressBar } from "../common";
import { CURRICULUM, totalChapters } from "../../constants/curriculum";

export function ProgressView({ stats, overallPct, totalChapters, curriculum, progressData }) {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>📊 My Progress</h1>
      <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>Tracking your preparation across all subjects</p>

      {/* Summary */}
      <div className="prog-summary-grid">
        {[
          { v: overallPct + "%", label: "Overall Completion", c: "linear-gradient(135deg,#ec4899,#db2777)", emoji: "🎯" },
          { v: stats.notesRead, label: "Notes Read", c: "linear-gradient(135deg,#0ea5e9,#3b82f6)", emoji: "📝" },
          { v: stats.quizDone, label: "Quizzes Completed", c: "linear-gradient(135deg,#10b981,#16a34a)", emoji: "✅" },
          { v: totalChapters, label: "Total Chapters", c: "linear-gradient(135deg,#f59e0b,#d97706)", emoji: "📚" },
        ].map(({ v, label, c, emoji }) => (
          <div key={label} style={{ background: c, borderRadius: 16, padding: "18px 20px", color: "white" }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{emoji}</div>
            <div style={{ fontSize: 32, fontWeight: 900 }}>{v}</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Per Subject */}
      {Object.entries(curriculum).map(([s, d]) => {
        const st = stats.bySubject[s];
        const pct = Math.round((st.n + st.q) / (st.t * 2) * 100);
        return (
          <div key={s} className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
              <div style={{ width: 50, height: 50, borderRadius: 14, background: d.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{d.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 17 }}>{s}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{st.n} notes read · {st.q} quizzes done · {st.t} chapters total</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: d.accent }}>{pct}%</div>
            </div>
            <ProgressBar value={st.n + st.q} max={st.t * 2} color={d.accent} height={8} />

            {/* Chapter breakdown */}
            <div style={{ marginTop: 18 }}>
              {d.units.map((unit, ui) => (
                <div key={ui} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: d.text, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, background: d.light, display: "inline-block", padding: "2px 10px", borderRadius: 6 }}>
                    {unit.name}
                  </div>
                  <div className="prog-ch-grid">
                    {unit.chapters.map((ch, ci) => {
                      const nk = `${s}||${ch}||notes`;
                      const qk = `${s}||${ch}||quiz`;
                      const nRead = progress[nk]?.read;
                      const qData = progress[qk];
                      const best = qData?.best;
                      const attempts = qData?.attempts?.length || 0;
                      return (
                        <div key={ci} style={{ background: "#fff0f5", borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ fontSize: 12, color: "#334155", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch}</span>
                          <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                            <span title="Notes">{nRead ? "📖" : "◻️"}</span>
                            <span title="Quiz">{attempts > 0 ? "✅" : "◻️"}</span>
                            {best !== undefined && <span style={{ fontSize: 11, fontWeight: 700, color: d.text }}>{best}/50</span>}
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
