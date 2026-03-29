export function ChapterView({ subject, chapter, curriculumData, notesRead, quizBest, availableSets = [], onStartNotes, onStartQuiz }) {
  const S = curriculumData;
  const quizSetCount = availableSets.length;

  const modes = [
    {
      mode: "notes",
      emoji: "📝",
      title: "Detailed Notes",
      desc: "Comprehensive NCERT notes for quick study",
      accentColor: "#3b82f6",
      glowColor: "rgba(59, 130, 246, 0.3)",
      glowIntense: "rgba(59, 130, 246, 0.6)",
      borderActive: "rgba(59, 130, 246, 0.6)",
      done: notesRead,
      doneLabel: "Notes read"
    },
    {
      mode: "quiz",
      emoji: "🧠",
      title: "Practice Quizzes",
      desc: `${quizSetCount} set${quizSetCount !== 1 ? 's' : ''} × 30 board-level MCQs with explanations`,
      accentColor: "#10b981",
      glowColor: "rgba(16, 185, 129, 0.3)",
      glowIntense: "rgba(16, 185, 129, 0.6)",
      borderActive: "rgba(16, 185, 129, 0.6)",
      done: quizBest !== undefined,
      doneLabel: `Best: ${quizBest ?? "—"}/30`
    }
  ];

  return (
    <div style={{ maxWidth: 840, margin: "0 auto", animation: "cvFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)" }}>
      <style>{`
        @keyframes cvFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes cvFloat {
          0%, 100% { transform: translateY(0) scale(1) rotate(0deg); }
          25% { transform: translateY(-4px) scale(1.02) rotate(-2deg); }
          75% { transform: translateY(4px) scale(0.98) rotate(2deg); }
        }
        @keyframes cvPulseBg {
          0%, 100% { opacity: 0.4; transform: scale(1) translate(0, 0); }
          50% { opacity: 0.8; transform: scale(1.2) translate(10px, -10px); }
        }
        @keyframes cvSlideRight {
          from { background-position: 0% 50%; }
          to { background-position: 200% 50%; }
        }
      `}</style>

      {/* Hero Banner Redesign */}
      <div style={{
        background: "linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        border: "1px solid rgba(0, 0, 0, 0.05)",
        borderRadius: 32,
        padding: "clamp(32px, 5vw, 56px)",
        marginBottom: 48,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 20px 50px rgba(148,163,184,0.15), inset 0 1px 0 rgba(255,255,255,0.9)",
        textAlign: "center"
      }}>
        {/* Animated Background Orbs */}
        <div style={{ position: "absolute", top: -100, left: -50, width: 300, height: 300, background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(40px)", animation: "cvPulseBg 12s infinite alternate", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, right: -60, width: 350, height: 350, background: "radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(50px)", animation: "cvPulseBg 15s infinite alternate-reverse", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "100%", height: "100%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)", backgroundSize: "200% 100%", animation: "cvSlideRight 10s linear infinite", pointerEvents: "none" }} />
        
        <div style={{ position: "relative", zIndex: 10 }}>
          <div style={{ 
            display: "inline-flex", 
            alignItems: "center",
            padding: "8px 20px", 
            borderRadius: 100, 
            background: "rgba(59, 130, 246, 0.1)", 
            border: "1px solid rgba(59, 130, 246, 0.2)",
            fontSize: 12, 
            fontWeight: 800, 
            color: "#059669", 
            textTransform: "uppercase", 
            letterSpacing: "0.25em", 
            marginBottom: 24,
            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255,255,255,0.8)"
          }}>
            <span style={{ marginRight: 8, fontSize: 14 }}>{S?.emoji || "📘"}</span>
            {subject}
          </div>
          <h1 style={{ 
            fontSize: "clamp(32px, 5vw, 48px)", 
            fontWeight: 900, 
            margin: "0 0 16px", 
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            background: "linear-gradient(to right, #1e293b, #475569)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))"
          }}>
            {chapter}
          </h1>
          <p style={{ color: "#64748b", fontSize: "clamp(14px, 2vw, 16px)", margin: 0, fontWeight: 500, letterSpacing: "-0.01em" }}>
            NCERT Class 12 CBSE — Select a learning module to begin
          </p>
        </div>
      </div>

      {/* Mode Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32 }}>
        {modes.map(({ mode, emoji, title, desc, accentColor, glowColor, glowIntense, borderActive, done, doneLabel }) => (
          <button key={mode} onClick={() => {
            if (mode === "notes") onStartNotes();
            else onStartQuiz();
          }}
            style={{
              background: done ? `linear-gradient(145deg, rgba(255,255,255,0.95) 0%, ${glowColor} 200%)` : "rgba(255, 255, 255, 0.75)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              border: `1px solid ${done ? borderActive : "rgba(0,0,0,0.05)"}`,
              borderRadius: 36,
              padding: "40px 32px",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: 24,
              transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
              cursor: "pointer",
              boxShadow: done ? `0 20px 50px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.8)` : "0 12px 32px rgba(148,163,184,0.15), inset 0 1px 0 rgba(255,255,255,0.9)",
              position: "relative",
              overflow: "hidden"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = borderActive;
              e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
              e.currentTarget.style.boxShadow = `0 30px 70px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.8)`;
              if(!done) e.currentTarget.style.background = `linear-gradient(145deg, rgba(255,255,255,1) 0%, rgba(248, 250, 252, 0.9) 100%)`;
              const iconBox = e.currentTarget.querySelector('.cv-icon-box');
              if(iconBox) {
                iconBox.style.transform = "scale(1.15) rotate(5deg)";
                iconBox.style.boxShadow = `0 12px 30px ${glowIntense}, inset 0 1px 0 rgba(255,255,255,0.9)`;
                iconBox.style.border = `1px solid rgba(0,0,0,0.05)`;
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = done ? borderActive : "rgba(0,0,0,0.05)";
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = done ? `0 20px 50px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.8)` : "0 12px 32px rgba(148,163,184,0.15), inset 0 1px 0 rgba(255,255,255,0.9)";
              e.currentTarget.style.background = done ? `linear-gradient(145deg, rgba(255,255,255,0.95) 0%, ${glowColor} 200%)` : "rgba(255, 255, 255, 0.75)";
              const iconBox = e.currentTarget.querySelector('.cv-icon-box');
              if(iconBox) {
                iconBox.style.transform = "scale(1) rotate(0deg)";
                iconBox.style.boxShadow = `0 8px 16px rgba(148,163,184,0.15), inset 0 1px 0 rgba(255,255,255,0.8)`;
                iconBox.style.border = `1px solid rgba(0,0,0,0.05)`;
              }
            }}>
            
            {/* Ambient Background Glow inside Card */}
            <div style={{ position: "absolute", top: -80, right: -80, width: 250, height: 250, background: glowColor, borderRadius: "50%", filter: "blur(60px)", zIndex: 0, pointerEvents: "none" }} />

            <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
              {/* 3D Floating Icon Box */}
              <div className="cv-icon-box" style={{ 
                width: 72, height: 72, 
                borderRadius: 24, 
                background: "rgba(255, 255, 255, 0.9)", 
                border: "1px solid rgba(0,0,0,0.05)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 36,
                boxShadow: "0 8px 16px rgba(148,163,184,0.15), inset 0 1px 0 rgba(255,255,255,0.8)",
                transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)"
              }}>
                <span style={{ filter: `drop-shadow(0 4px 12px ${glowColor})`, animation: "cvFloat 6s ease-in-out infinite" }}>{emoji}</span>
              </div>

              {done && (
                <div style={{
                  fontSize: 13,
                  color: "#1e293b",
                  fontWeight: 800,
                  background: `linear-gradient(135deg, ${glowColor}, rgba(255,255,255,0.8))`,
                  padding: "8px 16px",
                  borderRadius: 100,
                  boxShadow: `0 4px 12px ${glowColor}`,
                  border: `1px solid ${borderActive}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  letterSpacing: "0.02em"
                }}>
                  <div style={{ background: "white", color: accentColor, borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}>✓</div>
                  {doneLabel}
                </div>
              )}
            </div>
            
            <div style={{ position: "relative", zIndex: 1, marginTop: 12 }}>
              <div style={{ fontWeight: 800, color: "#1e293b", fontSize: 24, letterSpacing: "-0.02em", marginBottom: 10 }}>{title}</div>
              <div style={{ fontSize: 15, color: "#475569", lineHeight: 1.6, fontWeight: 500 }}>{desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
