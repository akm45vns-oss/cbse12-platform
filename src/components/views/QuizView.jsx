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
  qIdx, 
  setQIdx, 
  answers, 
  setAnswers, 
  submitted, 
  score,
  curriculumData,
  onSubmit,
  onRetry,
  onReviewNotes
}) {
  const S = curriculumData;
  
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", width: "100%" }}>
      {loading ? <LoadingScreen message={loadMsg} emoji={loadEmoji} /> : quiz.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div style={{ color: "#475569", fontSize: 16, marginBottom: 20 }}>{quizErr || "Failed to load quiz. Please try again."}</div>
          <button onClick={onRetry} style={{ background: "#ec4899", border: "none", borderRadius: 10, padding: "12px 28px", color: "white", fontWeight: 700, fontSize: 15 }}>🔄 Try Again</button>
        </div>
      ) : submitted ? (
        /* RESULTS */
        <div>
          <div style={{ background: score >= 40 ? "linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)" : score >= 25 ? "linear-gradient(135deg, #fef9c3 0%, #fefce8 100%)" : "linear-gradient(135deg, #fee5e5 0%, #fef2f2 100%)", border: `2px solid ${score >= 40 ? "#16a34a" : score >= 25 ? "#eab308" : "#dc2626"}`, borderRadius: 24, padding: 40, textAlign: "center", marginBottom: 28, boxShadow: `0 12px 40px ${score >= 40 ? "#16a34a20" : score >= 25 ? "#eab30820" : "#dc262620"}` }}>
            <div style={{ fontSize: 56, marginBottom: 16, display: "inline-block" }}>{score >= 40 ? "🏆" : score >= 25 ? "👍" : "📚"}</div>
            <div style={{ fontSize: 56, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em" }}>{score}<span style={{ fontSize: 26, color: "#94a3b8", fontWeight: 400, marginLeft: 4 }}>/{quiz.length}</span></div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8, color: score >= 40 ? "#15803d" : score >= 25 ? "#854d0e" : "#991b1b", letterSpacing: "-0.01em" }}>
              {Math.round(score / quiz.length * 100)}% Accuracy
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6, color: score >= 40 ? "#16a34a" : score >= 25 ? "#b45309" : "#dc2626" }}>
              {score >= 40 ? "Excellent! Board Ready! 🎉" : score >= 25 ? "Good! Keep Practicing! 💪" : "Needs More Study. Review Notes! 📖"}
            </div>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 24 }}>
              <button onClick={onRetry}
                style={{ background: "linear-gradient(135deg, #ec4899, #db2777)", border: "none", borderRadius: 12, padding: "13px 28px", color: "white", fontWeight: 800, fontSize: 15, boxShadow: "0 8px 20px rgba(236, 72, 153, 0.3)", transition: "all 0.3s", cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 28px rgba(236, 72, 153, 0.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 20px rgba(236, 72, 153, 0.3)"; }}>
                🔄 Retry Quiz
              </button>
              <button onClick={onReviewNotes}
                style={{ background: "linear-gradient(135deg, " + (S?.accent || "#6366f1") + ", " + (S?.accent || "#6366f1") + "cc)", border: "none", borderRadius: 12, padding: "13px 28px", color: "white", fontWeight: 800, fontSize: 15, boxShadow: "0 8px 20px " + (S?.accent || "#6366f1") + "30", transition: "all 0.3s", cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 28px " + (S?.accent || "#6366f1") + "40"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 20px " + (S?.accent || "#6366f1") + "30"; }}>
                📝 Review Notes
              </button>
            </div>
          </div>
          <h3 style={{ fontWeight: 900, color: "#831843", marginBottom: 18, fontSize: 18, letterSpacing: "-0.01em" }}>📊 Answer Review</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {quiz.map((q, i) => {
              const ua = answers[i]; const ca = q.ans; const ok = ua === ca;
              return (
                <div key={i} style={{ background: "white", border: `1.5px solid ${ok ? "#86efac" : "#fca5a5"}`, borderRadius: 16, padding: 18, boxShadow: ok ? "0 4px 12px rgba(22, 163, 74, 0.1)" : "0 4px 12px rgba(220, 38, 38, 0.1)" }}>
                  <div style={{ display: "flex", gap: 12, marginBottom: ok ? 8 : 10 }}>
                    <span style={{ background: ok ? "linear-gradient(135deg, #16a34a, #15803d)" : "linear-gradient(135deg, #dc2626, #991b1b)", color: "white", fontSize: 12, fontWeight: 800, padding: "4px 10px", borderRadius: 8, flexShrink: 0, alignSelf: "flex-start" }}>Q{i + 1} {ok ? "✓" : "✗"}</span>
                    <span style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.6, fontWeight: 600 }}>{q.q}</span>
                  </div>
                  {!ok && (
                    <div style={{ marginLeft: 60, fontSize: 13, marginBottom: 8 }}>
                      <div style={{ color: "#dc2626", fontWeight: 600 }}>Your answer: {q.opts[ua] || "Not answered"}</div>
                      <div style={{ color: "#16a34a", fontWeight: 700, marginTop: 4 }}>Correct: {q.opts[ca]}</div>
                    </div>
                  )}
                  <div style={{ marginLeft: 60, marginTop: 10, fontSize: 13, color: "#4f46e5", fontWeight: 500, lineHeight: 1.6 }}>💡 {q.exp}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* QUIZ IN PROGRESS */
        <div>
          {/* Header */}
          <div className="no-print" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,240,245,0.95))", borderRadius: 18, border: "1.5px solid #fce7f3", padding: "16px 22px", marginBottom: 20, backdropFilter: "blur(10px)", boxShadow: "0 4px 16px rgba(236, 72, 153, 0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#831843", letterSpacing: "-0.01em" }}>Question {qIdx + 1} of {quiz.length}</span>
                <span style={{ fontSize: 12, color: "#9d174d", marginLeft: 14, fontWeight: 600 }}>{Object.keys(answers).length} answered</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <ExamTimer initialSeconds={1500} onExpire={onSubmit} />
                <Badge color={S?.accent || "#6366f1"}>{subject}</Badge>
              </div>
            </div>
            <ProgressBar value={qIdx + 1} max={quiz.length} color={S?.accent || "#6366f1"} height={6} />
          </div>

          {/* Question */}
          {quiz[qIdx] && (
            <div style={{ background: "white", borderRadius: 20, border: "1.5px solid #fce7f3", padding: "28px 28px", marginBottom: 18, boxShadow: "0 8px 32px rgba(236, 72, 153, 0.1)", transition: "all 0.3s" }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#9d174d", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Question {qIdx + 1}</div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", lineHeight: 1.7, marginBottom: 24, letterSpacing: "-0.01em" }}>{quiz[qIdx].q}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {quiz[qIdx].opts.map((opt, oi) => (
                  <button key={oi} className={`opt-btn ${answers[qIdx] === oi ? "opt-selected" : ""}`} onClick={() => setAnswers(a => ({ ...a, [qIdx]: oi }))}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <button onClick={() => setQIdx(q => Math.max(0, q - 1))} disabled={qIdx === 0}
              style={{ padding: "12px 24px", background: "linear-gradient(135deg, rgba(236,72,153,0.1), rgba(252,231,243,0.1))", border: "1.5px solid #fce7f3", borderRadius: 12, color: "#be185d", fontWeight: 700, fontSize: 15, opacity: qIdx === 0 ? 0.4 : 1, transition: "all 0.3s", cursor: qIdx === 0 ? "not-allowed" : "pointer" }}>
              ← Prev
            </button>
            {qIdx < quiz.length - 1 ? (
              <button onClick={() => setQIdx(q => q + 1)} style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg, #ec4899, #db2777)", border: "none", borderRadius: 12, color: "white", fontWeight: 800, fontSize: 15, transition: "all 0.3s", cursor: "pointer", boxShadow: "0 8px 20px rgba(236, 72, 153, 0.3)" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 28px rgba(236, 72, 153, 0.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 20px rgba(236, 72, 153, 0.3)"; }}>
                Next →
              </button>
            ) : (
              <button onClick={onSubmit} style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg, #16a34a, #15803d)", border: "none", borderRadius: 12, color: "white", fontWeight: 800, fontSize: 15, transition: "all 0.3s", cursor: "pointer", boxShadow: "0 8px 20px rgba(22, 163, 74, 0.3)" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 28px rgba(22, 163, 74, 0.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 20px rgba(22, 163, 74, 0.3)"; }}>
                Submit Quiz ({Object.keys(answers).length}/{quiz.length}) ✓
              </button>
            )}
          </div>

          {/* Question Palette */}
          <div style={{ background: "white", borderRadius: 18, border: "1.5px solid #fce7f3", padding: "18px 20px", boxShadow: "0 4px 16px rgba(236, 72, 153, 0.08)" }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#831843", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>🧭 Question Navigator</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {quiz.map((_, i) => (
                <button key={i} className="qnum" onClick={() => setQIdx(i)}
                  style={{ background: i === qIdx ? (S?.accent || "#6366f1") : answers[i] !== undefined ? "linear-gradient(135deg, #dcfce7, #f0fdf4)" : "linear-gradient(135deg, #fce7f3, #fff0f5)", color: i === qIdx ? "white" : answers[i] !== undefined ? "#15803d" : "#be185d", border: i === qIdx ? "none" : answers[i] !== undefined ? "1.5px solid #86efac" : "1.5px solid #fce7f3", boxShadow: i === qIdx ? "0 4px 12px " + (S?.accent || "#6366f1") + "30" : "none" }}>
                  {i + 1}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 12, fontSize: 12, color: "#64748b", fontWeight: 600, flexWrap: "wrap" }}>
              <span style={{display: "flex", alignItems: "center", gap: 6}}><span style={{width: 12, height: 12, borderRadius: 3, background: S?.accent || "#6366f1"}}></span>Current</span>
              <span style={{ color: "#16a34a", display: "flex", alignItems: "center", gap: 6}}><span style={{width: 12, height: 12, borderRadius: 3, background: "#16a34a"}}></span>Answered ({Object.keys(answers).length})</span>
              <span style={{display: "flex", alignItems: "center", gap: 6}}><span style={{width: 12, height: 12, borderRadius: 3, background: "#fce7f3"}}></span>Unanswered ({quiz.length - Object.keys(answers).length})</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
