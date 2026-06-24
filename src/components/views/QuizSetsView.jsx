/**
 * QuizSetsView — Display all quiz sets for a chapter
 */
import { memo } from "react";

export const QuizSetsView = memo(function QuizSetsView({
  subject, chapter, curriculumData, quizSetStatus, availableSets = [], onSelectSet, loading
}) {
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #ede9fe", borderTop: "3px solid #4f46e5", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <div style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>Loading quiz sets...</div>
        </div>
      </div>
    );
  }

  const totalSets = availableSets.length;
  const completedCount = Object.values(quizSetStatus).filter(s => s !== undefined).length;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", width: "100%", animation: "fadeInUp 0.4s ease" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            Practice Quiz
          </h1>
          {completedCount > 0 && (
            <span style={{
              background: "#ede9fe", color: "#4f46e5",
              fontSize: 12, fontWeight: 800, padding: "5px 12px",
              borderRadius: 999, flexShrink: 0,
            }}>
              {completedCount}/{totalSets} done
            </span>
          )}
        </div>
        <p style={{ fontSize: 14, color: "#64748b", fontWeight: 500, margin: 0 }}>
          {chapter} · {totalSets} set{totalSets !== 1 ? "s" : ""} × 30 questions each
        </p>

        {/* Progress Bar */}
        {totalSets > 0 && (
          <div style={{ marginTop: 14 }}>
            <div className="progress-track" style={{ height: 6 }}>
              <div className="progress-fill" style={{ width: `${(completedCount / totalSets) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Empty State ── */}
      {availableSets.length === 0 && (
        <div style={{
          textAlign: "center", padding: "48px 24px",
          background: "white", border: "1px solid #fee2e2",
          borderRadius: 20,
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <div style={{ color: "#dc2626", fontSize: 15, fontWeight: 700, marginBottom: 6 }}>No quiz sets found</div>
          <div style={{ color: "#94a3b8", fontSize: 13 }}>
            The quiz sets for this chapter could not be loaded.<br />Check the browser console for details.
          </div>
        </div>
      )}

      {/* ── Quiz Set Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        {availableSets.map((setNum) => {
          const bestScore = quizSetStatus[setNum];
          const isCompleted = bestScore !== undefined;
          const pct = isCompleted ? Math.round((bestScore / 30) * 100) : 0;
          const scoreColor = pct >= 80 ? "#059669" : pct >= 60 ? "#d97706" : "#dc2626";

          return (
            <button
              key={setNum}
              onClick={() => onSelectSet(setNum)}
              style={{
                background: isCompleted ? "#f5f3ff" : "white",
                border: `1.5px solid ${isCompleted ? "rgba(79,70,229,0.25)" : "rgba(0,0,0,0.07)"}`,
                borderRadius: 16,
                padding: "18px 16px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
                boxShadow: isCompleted ? "0 4px 12px rgba(79,70,229,0.12)" : "0 2px 8px rgba(0,0,0,0.05)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "rgba(79,70,229,0.5)";
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 10px 28px rgba(79,70,229,0.18)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = isCompleted ? "rgba(79,70,229,0.25)" : "rgba(0,0,0,0.07)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = isCompleted ? "0 4px 12px rgba(79,70,229,0.12)" : "0 2px 8px rgba(0,0,0,0.05)";
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 900, color: isCompleted ? "#4f46e5" : "#0f172a", marginBottom: 8, letterSpacing: "-0.02em" }}>
                Set {setNum}
              </div>

              {isCompleted ? (
                <>
                  <div style={{
                    display: "inline-block",
                    background: "#ede9fe", color: "#4f46e5",
                    fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 999, marginBottom: 8,
                  }}>
                    ✓ Done
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: scoreColor, marginBottom: 4 }}>
                    {bestScore}/30
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>{pct}%</div>
                </>
              ) : (
                <>
                  <div style={{ color: "#94a3b8", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Not started</div>
                  <div style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 600 }}>30 Qs</div>
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Info ── */}
      <div style={{
        background: "#f5f3ff", border: "1px solid rgba(79,70,229,0.12)",
        borderRadius: 14, padding: "16px 20px",
      }}>
        <p style={{ fontSize: 13, color: "#4f46e5", fontWeight: 600, margin: 0, lineHeight: 1.7, textAlign: "center" }}>
          💡 Each set has 30 board-level MCQs · 10 Easy · 10 Medium · 10 Hard
        </p>
      </div>
    </div>
  );
});
