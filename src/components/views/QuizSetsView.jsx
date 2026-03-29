/**
 * QuizSetsView - Display all 15 quiz sets for a chapter
 * Users can select which set to attempt and see their progress
 */

export function QuizSetsView({ subject, chapter, curriculumData, quizSetStatus, availableSets = [], onSelectSet, loading }) {
  const S = curriculumData;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 16, filter: "drop-shadow(0 0 20px rgba(6,182,212,0.5))", animation: "spin 1s linear infinite" }}>⚡</div>
          <div style={{ color: "#94a3b8", fontSize: 15, fontWeight: 600 }}>Loading quiz sets...</div>
        </div>
      </div>
    );
  }

  const totalSets = availableSets.length;
  const completedCount = Object.values(quizSetStatus).filter(s => s !== undefined).length;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{
        background: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 28,
        padding: "clamp(24px, 4vw, 36px)",
        marginBottom: 36,
        boxShadow: "0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "absolute", top: -60, right: -40, width: 200, height: 200, background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(40px)", pointerEvents: "none" }} />
        <div style={{ fontSize: 11, fontWeight: 900, color: "#22d3ee", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 10 }}>{subject}</div>
        <h1 style={{ fontSize: "clamp(22px,4vw,30px)", fontWeight: 900, color: "#f8fafc", margin: "0 0 10px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>{chapter}</h1>
        <p style={{ color: "#94a3b8", fontSize: 14, margin: 0, fontWeight: 500 }}>📚 Practice Quiz Sets · {totalSets} set{totalSets !== 1 ? "s" : ""} × 30 questions each</p>
        
        {/* Progress indicator */}
        {completedCount > 0 && (
          <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: totalSets > 0 ? `${(completedCount / totalSets) * 100}%` : "0%", background: "linear-gradient(90deg, #06b6d4, #818cf8)", borderRadius: 3, boxShadow: "0 0 8px rgba(6,182,212,0.5)", transition: "width 0.5s ease" }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#22d3ee", whiteSpace: "nowrap" }}>{completedCount}/{totalSets} done</span>
          </div>
        )}
      </div>

      {/* Empty State */}
      {availableSets.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: "48px 24px",
          background: "rgba(239,68,68,0.06)",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 20,
          marginBottom: 36
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <div style={{ color: "#fca5a5", fontSize: 16, fontWeight: 700, marginBottom: 8 }}>No quiz sets found in database</div>
          <div style={{ color: "#94a3b8", fontSize: 13 }}>
            The quiz sets for this chapter could not be loaded.<br />
            Check the browser console (F12) for details.
          </div>
        </div>
      )}

      {/* Quiz Sets Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 36 }}>
        {availableSets.map((setNum) => {
          const bestScore = quizSetStatus[setNum];
          const isCompleted = bestScore !== undefined;
          const pct = isCompleted ? Math.round((bestScore / 30) * 100) : 0;

          return (
            <button
              key={setNum}
              onClick={() => onSelectSet(setNum)}
              style={{
                background: isCompleted ? "rgba(6, 182, 212, 0.08)" : "rgba(255,255,255,0.02)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: `1px solid ${isCompleted ? "rgba(6, 182, 212, 0.3)" : "rgba(255,255,255,0.07)"}`,
                borderRadius: 20,
                padding: 20,
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: isCompleted ? "0 8px 24px rgba(6,182,212,0.15)" : "0 4px 16px rgba(0,0,0,0.3)",
                position: "relative"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.5)";
                e.currentTarget.style.transform = "translateY(-5px)";
                e.currentTarget.style.boxShadow = "0 20px 50px rgba(6,182,212,0.2)";
                e.currentTarget.style.background = "rgba(6,182,212,0.12)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = isCompleted ? "rgba(6, 182, 212, 0.3)" : "rgba(255,255,255,0.07)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = isCompleted ? "0 8px 24px rgba(6,182,212,0.15)" : "0 4px 16px rgba(0,0,0,0.3)";
                e.currentTarget.style.background = isCompleted ? "rgba(6,182,212,0.08)" : "rgba(255,255,255,0.02)";
              }}
            >
              {/* Set Number */}
              <div style={{ fontSize: 26, fontWeight: 900, color: isCompleted ? "#22d3ee" : "#f8fafc", marginBottom: 10, letterSpacing: "-0.02em" }}>
                Set {setNum}
              </div>

              {/* Status */}
              {isCompleted ? (
                <div style={{ marginBottom: 12 }}>
                  <div style={{
                    background: "rgba(6, 182, 212, 0.15)",
                    border: "1px solid rgba(6, 182, 212, 0.3)",
                    color: "#22d3ee",
                    padding: "6px 12px",
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 800,
                    display: "inline-block"
                  }}>
                    ✓ Completed
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>Not Started →</div>
                </div>
              )}

              {/* Score Display */}
              {isCompleted && (
                <div style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  padding: "8px 12px",
                  marginBottom: 12,
                  fontSize: 16,
                  fontWeight: 900,
                  color: pct >= 80 ? "#34d399" : pct >= 60 ? "#fbbf24" : "#f87171"
                }}>
                  Best: {bestScore}/30 · {pct}%
                </div>
              )}

              {/* Questions Count */}
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                📝 30 Questions
              </div>

              {/* Difficulty Info */}
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 8, fontWeight: 500, display: "flex", gap: 6, justifyContent: "center" }}>
                <span>5 Easy</span><span>·</span><span>5 Med</span><span>·</span><span>5 Hard</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Info Section */}
      <div style={{
        background: "rgba(99, 102, 241, 0.05)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(99,102,241,0.15)",
        borderRadius: 20,
        padding: 24,
        textAlign: "center"
      }}>
        <p style={{ fontSize: 14, color: "#a5b4fc", fontWeight: 600, margin: 0, lineHeight: 1.7 }}>
          💡 Each set contains 30 board-level questions with different difficulty levels.
          <br />
          Practice multiple sets to master this chapter!
        </p>
      </div>
    </div>
  );
}
