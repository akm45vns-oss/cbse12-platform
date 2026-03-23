import { CURRICULUM } from "../../constants/curriculum";

export function ChapterView({ subject, chapter, nav, progress, genNotes, genQuiz, genPaper }) {
  const S = CURRICULUM[subject];
  
  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 20, padding: 24, marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: S.text, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{subject}</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>{chapter}</h1>
        <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>NCERT Class 12 CBSE — Select what to study</p>
      </div>
      <div className="chapter-hub-grid">
        {[
          { mode: "notes", emoji: "📝", title: "Detailed Notes", desc: "AI-generated comprehensive NCERT notes", color: "#3b82f6", bg: "#eff6ff", done: progress[`${subject}||${chapter}||notes`]?.read, extra: "Notes read ✓" },
          { mode: "quiz", emoji: "🧠", title: "50 MCQ Quiz", desc: "Board-level practice questions + explanations", color: "#16a34a", bg: "#f0fdf4", done: (progress[`${subject}||${chapter}||quiz`]?.attempts?.length || 0) > 0, extra: `Best: ${progress[`${subject}||${chapter}||quiz`]?.best ?? "—"}/50` },
          { mode: "paper", emoji: "📄", title: "Sample Paper", desc: `Full ${subject} CBSE board exam paper`, color: "#7c3aed", bg: "#f5f3ff", done: false, extra: "Full subject paper" }
        ].map(({ mode, emoji, title, desc, color, bg, done, extra }) => (
          <button key={mode} onClick={() => {
            if (mode === "paper") { genPaper(subject); nav("paper"); }
            else if (mode === "notes") { nav("notes"); genNotes(subject, chapter); }
            else { nav("quiz"); genQuiz(subject, chapter); }
          }}
            style={{ background: "white", border: `2px solid ${done ? color + "44" : "#fce7f3"}`, borderRadius: 18, padding: 22, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = bg; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 25px ${color}25`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = done ? color + "44" : "#fce7f3"; e.currentTarget.style.background = "white"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
            <div style={{ fontSize: 36 }}>{emoji}</div>
            <div style={{ fontWeight: 800, color: "#1e293b", fontSize: 16 }}>{title}</div>
            <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>{desc}</div>
            {done && <div style={{ fontSize: 11, color, fontWeight: 700, background: color + "15", padding: "3px 10px", borderRadius: 99 }}>{extra}</div>}
          </button>
        ))}
      </div>
    </div>
  );
}
