import { Badge, LoadingScreen, ExamTimer, ProgressBar } from "../common";
import { CURRICULUM } from "../../constants/curriculum";

export function QuizView({ 
  subject, 
  chapter, 
  loading, 
  loadMsg, 
  loadEmoji, 
  quiz, 
  quizErr, 
  genQuiz, 
  qIdx, 
  setQIdx, 
  answers, 
  setAnswers, 
  submitted, 
  submitQuiz, 
  score,
  setView,
  genNotes,
  notes,
  setQuiz,
  setSubmitted
}) {
  const S = CURRICULUM[subject];
  
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", width: "100%" }}>
      {loading ? <LoadingScreen message={loadMsg} emoji={loadEmoji} /> : quiz.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div style={{ color: "#475569", fontSize: 16, marginBottom: 20 }}>{quizErr || "Failed to load quiz. Please try again."}</div>
          <button onClick={() => { setQuiz([]); genQuiz(subject, chapter); }} style={{ background: "#ec4899", border: "none", borderRadius: 10, padding: "12px 28px", color: "white", fontWeight: 700, fontSize: 15 }}>🔄 Try Again</button>
        </div>
      ) : submitted ? (
        /* RESULTS */
        <div>
          <div style={{ background: score >= 40 ? "#f0fdf4" : score >= 25 ? "#fefce8" : "#fef2f2", border: `2px solid ${score >= 40 ? "#86efac" : score >= 25 ? "#fde047" : "#fca5a5"}`, borderRadius: 20, padding: 32, textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>{score >= 40 ? "🏆" : score >= 25 ? "👍" : "📚"}</div>
            <div style={{ fontSize: 52, fontWeight: 900, color: "#0f172a" }}>{score}<span style={{ fontSize: 24, color: "#94a3b8", fontWeight: 400 }}>/{quiz.length}</span></div>
            <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: score >= 40 ? "#15803d" : score >= 25 ? "#854d0e" : "#b91c1c" }}>
              {Math.round(score / quiz.length * 100)}% — {score >= 40 ? "Excellent! Board Ready! 🎉" : score >= 25 ? "Good! Keep Practicing! 💪" : "Needs More Study. Review Notes! 📖"}
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20 }}>
              <button onClick={() => { setQuiz([]); setAnswers({}); setSubmitted(false); setQIdx(0); genQuiz(subject, chapter); }}
                style={{ background: "#ec4899", border: "none", borderRadius: 10, padding: "11px 24px", color: "white", fontWeight: 700, fontSize: 14 }}>🔄 Retry Quiz</button>
              <button onClick={() => { setView("notes"); if (!notes) genNotes(subject, chapter); }}
                style={{ background: S?.accent || "#6366f1", border: "none", borderRadius: 10, padding: "11px 24px", color: "white", fontWeight: 700, fontSize: 14 }}>📝 Review Notes</button>
            </div>
          </div>
          <h3 style={{ fontWeight: 700, color: "#334155", marginBottom: 14 }}>Answer Review</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {quiz.map((q, i) => {
              const ua = answers[i]; const ca = q.ans; const ok = ua === ca;
              return (
                <div key={i} style={{ background: "white", border: `1.5px solid ${ok ? "#86efac" : "#fca5a5"}`, borderRadius: 14, padding: 16 }}>
                  <div style={{ display: "flex", gap: 10, marginBottom: ok ? 0 : 8 }}>
                    <span style={{ background: ok ? "#dcfce7" : "#fee2e2", color: ok ? "#15803d" : "#dc2626", fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 99, flexShrink: 0, alignSelf: "flex-start", marginTop: 1 }}>Q{i + 1} {ok ? "✓" : "✗"}</span>
                    <span style={{ fontSize: 13, color: "#334155", lineHeight: 1.5 }}>{q.q}</span>
                  </div>
                  {!ok && (
                    <div style={{ marginLeft: 48, fontSize: 12 }}>
                      <div style={{ color: "#dc2626" }}>Your answer: {q.opts[ua] || "Not answered"}</div>
                      <div style={{ color: "#16a34a", fontWeight: 600 }}>Correct: {q.opts[ca]}</div>
                    </div>
                  )}
                  <div style={{ marginLeft: 48, marginTop: 6, fontSize: 12, color: "#4f46e5", fontStyle: "italic" }}>💡 {q.exp}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* QUIZ IN PROGRESS */
        <div>
          {/* Header */}
          <div className="no-print" style={{ background: "white", borderRadius: 16, border: "1px solid #fce7f3", padding: "14px 20px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Question {qIdx + 1} / {quiz.length}</span>
                <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 12 }}>{Object.keys(answers).length} answered</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <ExamTimer initialSeconds={1500} onExpire={() => {
                  alert("⏱️ Time is up! Auto-submitting your quiz.");
                  submitQuiz();
                }} />
                <Badge color={S?.accent || "#6366f1"}>{subject}</Badge>
              </div>
            </div>
            <ProgressBar value={qIdx + 1} max={quiz.length} color={S?.accent || "#6366f1"} height={5} />
          </div>

          {/* Question */}
          {quiz[qIdx] && (
            <div style={{ background: "white", borderRadius: 18, border: "1px solid #fce7f3", padding: "24px 24px", marginBottom: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Question {qIdx + 1}</div>
              <p style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", lineHeight: 1.6, marginBottom: 20 }}>{quiz[qIdx].q}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {quiz[qIdx].opts.map((opt, oi) => (
                  <button key={oi} className={`opt-btn ${answers[qIdx] === oi ? "opt-selected" : ""}`} onClick={() => setAnswers(a => ({ ...a, [qIdx]: oi }))}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <button onClick={() => setQIdx(q => Math.max(0, q - 1))} disabled={qIdx === 0}
              style={{ padding: "11px 20px", background: "#fce7f3", border: "none", borderRadius: 10, color: "#be185d", fontWeight: 600, fontSize: 14, opacity: qIdx === 0 ? 0.4 : 1 }}>
              ← Prev
            </button>
            {qIdx < quiz.length - 1 ? (
              <button onClick={() => setQIdx(q => q + 1)} style={{ flex: 1, padding: "11px", background: "#ec4899", border: "none", borderRadius: 10, color: "white", fontWeight: 700, fontSize: 14 }}>
                Next →
              </button>
            ) : (
              <button onClick={submitQuiz} style={{ flex: 1, padding: "11px", background: "#16a34a", border: "none", borderRadius: 10, color: "white", fontWeight: 700, fontSize: 14 }}>
                Submit Quiz ({Object.keys(answers).length}/{quiz.length}) ✓
              </button>
            )}
          </div>

          {/* Question Palette */}
          <div style={{ background: "white", borderRadius: 14, border: "1px solid #fce7f3", padding: "14px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Question Navigator</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {quiz.map((_, i) => (
                <button key={i} className="qnum" onClick={() => setQIdx(i)}
                  style={{ background: i === qIdx ? (S?.accent || "#6366f1") : answers[i] !== undefined ? "#dcfce7" : "#fce7f3", color: i === qIdx ? "white" : answers[i] !== undefined ? "#15803d" : "#64748b", border: i === qIdx ? "none" : answers[i] !== undefined ? "1px solid #86efac" : "1px solid #fce7f3" }}>
                  {i + 1}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11, color: "#94a3b8" }}>
              <span>🟦 Current</span>
              <span style={{ color: "#16a34a" }}>✅ Answered ({Object.keys(answers).length})</span>
              <span>⬜ Unanswered ({quiz.length - Object.keys(answers).length})</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
