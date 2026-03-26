export function ChapterView({ subject, chapter, curriculumData, notesRead, quizBest, onStartNotes, onStartQuiz, onStartPaper }) {
  const S = curriculumData;
  
  const modes = [
    {
      mode: "notes",
      emoji: "📝",
      title: "Detailed Notes",
      desc: "Comprehensive NCERT notes for quick study",
      accentColor: "#3b82f6",
      glowColor: "rgba(59, 130, 246, 0.2)",
      borderActive: "rgba(59, 130, 246, 0.4)",
      done: notesRead,
      doneLabel: "Notes read ✓"
    },
    {
      mode: "quiz",
      emoji: "🧠",
      title: "Practice Quizzes",
      desc: "15 sets × 30 board-level MCQs with explanations",
      accentColor: "#10b981",
      glowColor: "rgba(16, 185, 129, 0.2)",
      borderActive: "rgba(16, 185, 129, 0.4)",
      done: quizBest !== undefined,
      doneLabel: `Best: ${quizBest ?? "—"}/30`
    },
    {
      mode: "paper",
      emoji: "📄",
      title: "Sample Paper",
      desc: `Full ${subject} CBSE board exam paper`,
      accentColor: "#8b5cf6",
      glowColor: "rgba(139, 92, 246, 0.2)",
      borderActive: "rgba(139, 92, 246, 0.4)",
      done: false,
      doneLabel: "Full subject paper"
    }
  ];

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      {/* Header */}
      <div style={{
        background: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 28,
        padding: "clamp(24px,4vw,36px)",
        marginBottom: 36,
        boxShadow: "0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(40px)", pointerEvents: "none" }} />
        <div style={{ fontSize: 11, fontWeight: 900, color: "#22d3ee", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 10 }}>{subject}</div>
        <h1 style={{ fontSize: "clamp(22px,4vw,30px)", fontWeight: 900, color: "#f8fafc", margin: "0 0 10px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>{chapter}</h1>
        <p style={{ color: "#94a3b8", fontSize: 14, margin: 0, fontWeight: 500 }}>NCERT Class 12 CBSE — Select what to study</p>
      </div>

      {/* Mode Cards */}
      <div className="chapter-hub-grid">
        {modes.map(({ mode, emoji, title, desc, accentColor, glowColor, borderActive, done, doneLabel }) => (
          <button key={mode} onClick={() => {
            if (mode === "paper") onStartPaper();
            else if (mode === "notes") onStartNotes();
            else onStartQuiz();
          }}
            style={{
              background: done ? `${glowColor}` : "rgba(255,255,255,0.03)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: `1px solid ${done ? borderActive : "rgba(255,255,255,0.08)"}`,
              borderRadius: 24,
              padding: "clamp(20px,3vw,28px)",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              cursor: "pointer",
              boxShadow: done ? `0 12px 32px ${glowColor}` : "0 4px 16px rgba(0,0,0,0.3)"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = borderActive;
              e.currentTarget.style.background = glowColor;
              e.currentTarget.style.transform = "translateY(-6px)";
              e.currentTarget.style.boxShadow = `0 20px 50px ${glowColor}`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = done ? borderActive : "rgba(255,255,255,0.08)";
              e.currentTarget.style.background = done ? glowColor : "rgba(255,255,255,0.03)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = done ? `0 12px 32px ${glowColor}` : "0 4px 16px rgba(0,0,0,0.3)";
            }}>
            <div style={{ fontSize: 44, filter: `drop-shadow(0 4px 12px ${glowColor})` }}>{emoji}</div>
            <div style={{ fontWeight: 900, color: "#f8fafc", fontSize: 17, letterSpacing: "-0.01em" }}>{title}</div>
            <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5, fontWeight: 500 }}>{desc}</div>
            {done && (
              <div style={{
                fontSize: 12,
                color: "white",
                fontWeight: 800,
                background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor})`,
                padding: "7px 16px",
                borderRadius: 20,
                boxShadow: `0 4px 12px ${glowColor}`
              }}>
                ✓ {doneLabel}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
