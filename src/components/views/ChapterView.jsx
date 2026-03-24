import { CURRICULUM } from "../../constants/curriculum";

export function ChapterView({ subject, chapter, curriculumData, notesRead, quizBest, onStartNotes, onStartQuiz, onStartPaper }) {
  const S = curriculumData;
  
  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ background: "linear-gradient(135deg, #fff8fb, #f9f0f6)", border: "1.5px solid #dbeafe", borderRadius: 22, padding: 28, marginBottom: 32, boxShadow: "0 8px 24px rgba(236, 72, 153, 0.1)" }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: S.text, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>{subject}</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#064e78", margin: "0 0 10px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>{chapter}</h1>
        <p style={{ color: "#9d174d", fontSize: 14, margin: 0, fontWeight: 500 }}>NCERT Class 12 CBSE — Select what to study</p>
      </div>
      <div className="chapter-hub-grid">
        {[
          { mode: "notes", emoji: "📝", title: "Detailed Notes", desc: "Comprehensive NCERT notes for quick study", color: "#3b82f6", bg: "#eff6ff", gradient: "linear-gradient(135deg, #3b82f6, #2563eb)", done: notesRead, extra: "Notes read ✓" },
          { mode: "quiz", emoji: "🧠", title: "50 MCQ Quiz", desc: "Board-level practice questions + explanations", color: "#16a34a", bg: "#f0fdf4", gradient: "linear-gradient(135deg, #16a34a, #15803d)", done: quizBest !== undefined, extra: `Best: ${quizBest ?? "—"}/50` },
          { mode: "paper", emoji: "📄", title: "Sample Paper", desc: `Full ${subject} CBSE board exam paper`, color: "#7c3aed", bg: "#f5f3ff", gradient: "linear-gradient(135deg, #7c3aed, #6d28d9)", done: false, extra: "Full subject paper" }
        ].map(({ mode, emoji, title, desc, color, bg, gradient, done, extra }) => (
          <button key={mode} onClick={() => {
            if (mode === "paper") onStartPaper();
            else if (mode === "notes") onStartNotes();
            else onStartQuiz();
          }}
            style={{ background: "white", border: `2px solid ${done ? color : "#dbeafe"}`, borderRadius: 20, padding: 24, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", cursor: "pointer", boxShadow: done ? `0 8px 20px ${color}20` : "0 4px 12px rgba(236, 72, 153, 0.1)" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = bg; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 16px 40px ${color}30`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = done ? color : "#dbeafe"; e.currentTarget.style.background = "white"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = done ? `0 8px 20px ${color}20` : "0 4px 12px rgba(236, 72, 153, 0.1)"; }}>
            <div style={{ fontSize: 40, display: "inline-block", transition: "transform 0.3s" }}>
              {emoji}
            </div>
            <div style={{ fontWeight: 900, color: "#1e293b", fontSize: 18, letterSpacing: "-0.01em" }}>{title}</div>
            <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5, fontWeight: 500 }}>{desc}</div>
            {done && (
              <div style={{ fontSize: 12, color: "white", fontWeight: 800, background: gradient, padding: "6px 14px", borderRadius: 20, marginTop: 4 }}>
                ✓ {extra}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
