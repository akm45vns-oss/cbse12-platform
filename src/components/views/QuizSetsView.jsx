/**
 * QuizSetsView - Display all 15 quiz sets for a chapter
 * Users can select which set to attempt and see their progress
 */

export function QuizSetsView({ subject, chapter, curriculumData, quizSetStatus, onSelectSet, loading }) {
  const S = curriculumData;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
          <div style={{ color: "#64748b", fontSize: 14 }}>Loading quiz sets...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #fff8fb, #f9f0f6)", border: "1.5px solid #dbeafe", borderRadius: 22, padding: 28, marginBottom: 32, boxShadow: "0 8px 24px rgba(236, 72, 153, 0.1)" }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: S.text, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>{subject}</div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#064e78", margin: "0 0 10px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>{chapter}</h1>
        <p style={{ color: "#9d174d", fontSize: 14, margin: 0, fontWeight: 500 }}>📚 Practice Quiz Sets (15 sets × 30 questions each)</p>
      </div>

      {/* Quiz Sets Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 32 }}>
        {Array.from({ length: 15 }, (_, i) => {
          const setNum = i + 1;
          const bestScore = quizSetStatus[setNum];
          const isCompleted = bestScore !== undefined;

          return (
            <button
              key={setNum}
              onClick={() => onSelectSet(setNum)}
              style={{
                background: "white",
                border: `2px solid ${isCompleted ? S.accent : "#dbeafe"}`,
                borderRadius: 16,
                padding: 20,
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: isCompleted ? `0 8px 20px ${S.accent}20` : "0 4px 12px rgba(236, 72, 153, 0.1)",
                position: "relative"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = S.accent;
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = `0 16px 40px ${S.accent}30`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isCompleted ? S.accent : "#dbeafe";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = isCompleted ? `0 8px 20px ${S.accent}20` : "0 4px 12px rgba(236, 72, 153, 0.1)";
              }}
            >
              {/* Set Number */}
              <div style={{ fontSize: 28, fontWeight: 900, color: "#064e78", marginBottom: 8 }}>
                Set {setNum}
              </div>

              {/* Status */}
              {isCompleted ? (
                <div style={{ marginBottom: 12 }}>
                  <div style={{
                    background: `linear-gradient(135deg, ${S.accent}, ${S.accent}cc)`,
                    color: "white",
                    padding: "6px 12px",
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 800,
                    display: "inline-block"
                  }}>
                    ✓ Completed
                  </div>
                </div>
              ) : (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ color: "#9d174d", fontSize: 12, fontWeight: 600 }}>Not Started →</div>
                </div>
              )}

              {/* Score Display */}
              {isCompleted && (
                <div style={{
                  background: "#f8fafc",
                  border: "1.5px solid #dbeafe",
                  borderRadius: 10,
                  padding: "8px 12px",
                  marginBottom: 12,
                  fontSize: 14,
                  fontWeight: 800,
                  color: S.accent
                }}>
                  Best: {bestScore}/30
                </div>
              )}

              {/* Questions Count */}
              <div style={{
                fontSize: 12,
                color: "#64748b",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4
              }}>
                <span>📝 30 Questions</span>
              </div>

              {/* Difficulty Info */}
              <div style={{
                fontSize: 11,
                color: "#9d174d",
                marginTop: 8,
                fontWeight: 500,
                display: "flex",
                gap: 8,
                justifyContent: "center"
              }}>
                <span>5 Easy</span>
                <span>•</span>
                <span>5 Medium</span>
                <span>•</span>
                <span>5 Hard</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Info Section */}
      <div style={{
        background: "linear-gradient(135deg, rgba(8,145,178,0.08), rgba(244,114,182,0.08))",
        border: "1.5px solid rgba(8,145,178,0.15)",
        borderRadius: 16,
        padding: 20,
        textAlign: "center"
      }}>
        <p style={{ fontSize: 13, color: "#064e78", fontWeight: 600, margin: 0, lineHeight: 1.6 }}>
          💡 Each set contains 30 board-level questions with different difficulty levels.
          <br />
          Practice multiple sets to master this chapter!
        </p>
      </div>
    </div>
  );
}
