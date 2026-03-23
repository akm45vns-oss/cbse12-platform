import { ProgressBar } from "../common";
import { CURRICULUM } from "../../constants/curriculum";

export function SubjectView({ subject, nav, genPaper, progress, stats }) {
  const S = CURRICULUM[subject];
  
  return (
    <div>
      <div style={{ background: S.gradient, borderRadius: 20, padding: "clamp(16px,4vw,28px)", marginBottom: 24, color: "white" }}>
        <div style={{ fontSize: 44, marginBottom: 8 }}>{S.emoji}</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>{subject}</h1>
        <p style={{ opacity: 0.8, marginTop: 6, fontSize: 14 }}>NCERT Class 12 CBSE · {S.units.length} Units · {stats.bySubject[subject].t} Chapters</p>
        <button onClick={() => { genPaper(subject); nav("paper"); }}
          style={{ marginTop: 16, background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, padding: "10px 20px", color: "white", fontWeight: 700, fontSize: 14 }}>
          📄 Generate Sample Board Paper →
        </button>
      </div>

      {S.units.map((unit, ui) => (
        <div key={ui} style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: S.text, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ background: S.light, border: `1px solid ${S.border}`, borderRadius: 6, padding: "2px 10px" }}>{unit.name}</span>
          </h3>
          <div className="subj-ch-grid">
            {unit.chapters.map((ch, ci) => {
              const nk = `${subject}||${ch}||notes`;
              const qk = `${subject}||${ch}||quiz`;
              const nRead = progress[nk]?.read;
              const qData = progress[qk];
              const best = qData?.best;
              return (
                <button key={ci} onClick={() => { nav("chapter"); }}
                  style={{ background: "white", border: `1.5px solid ${nRead && qData ? S.border : "#fce7f3"}`, borderRadius: 14, padding: "14px 16px", textAlign: "left", transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = S.accent; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 4px 12px ${S.accent}22`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = nRead && qData ? S.border : "#fce7f3"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
                  <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 14, lineHeight: 1.4, marginBottom: 8 }}>{ch}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13 }}>{nRead ? "📖" : "◻️"}</span>
                    <span style={{ fontSize: 11, color: nRead ? "#16a34a" : "#94a3b8" }}>{nRead ? "Notes read" : "Notes"}</span>
                    <span style={{ fontSize: 13, marginLeft: 4 }}>{qData ? "✅" : "◻️"}</span>
                    {best !== undefined ? (
                      <span style={{ fontSize: 11, color: S.text, fontWeight: 700 }}>{best}/50</span>
                    ) : (
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>Quiz</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
