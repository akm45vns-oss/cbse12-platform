import { Badge, LoadingScreen, ExamTimer, ProgressBar } from "../common";
import { CURRICULUM } from "../../constants/curriculum";
import { useEffect, useState } from "react";
import { useKeyboardShortcuts } from "../../hooks";
import { startSession, endSession } from "../../utils/sessionTracking";

export function validateQuestion(q) {
  if (!q || !q.q) return null;
  let opts = q.opts || [];
  if (!Array.isArray(opts)) opts = [opts];
  while (opts.length < 4) { opts.push(`Option ${opts.length + 1}`); }
  return { q: q.q, opts: opts.slice(0, 4), ans: typeof q.ans === 'number' && q.ans >= 0 && q.ans < 4 ? q.ans : 0, exp: q.exp || "No explanation available" };
}

export function QuizView({ subject, chapter, loading, loadMsg, loadEmoji, quiz, quizErr, qIdx, setQIdx, answers, setAnswers, submitted, score, curriculumData, onSubmit, onRetry, onReviewNotes }) {
  const S = curriculumData;
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);

  useEffect(() => { if (quiz.length > 0 && !loading) startSession(subject, chapter, "quiz"); }, [quiz.length, loading, subject, chapter]);
  useEffect(() => { if (submitted) endSession(true); }, [submitted]);

  const shortcuts = !submitted && quiz.length > 0 ? [
    { key: "ArrowRight", action: () => { if (qIdx < quiz.length - 1) setQIdx(qIdx + 1); }, label: "→ Next Question" },
    { key: "ArrowLeft", action: () => { if (qIdx > 0) setQIdx(qIdx - 1); }, label: "← Previous Question" },
    { key: "Enter", action: onSubmit, label: "↵ Submit Quiz" },
    { key: "?", action: () => setShowShortcutHelp(!showShortcutHelp), label: "? Show Shortcuts" },
  ] : [];

  useKeyboardShortcuts(shortcuts);
  
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", width: "100%", animation: "cvFadeIn 0.5s ease" }}>
      {loading ? <LoadingScreen message={loadMsg} emoji={loadEmoji} /> : quiz.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(20px)", borderRadius: 24, border: "1px solid rgba(0,0,0,0.05)" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div style={{ color: "#475569", fontSize: 16, marginBottom: 20 }}>{quizErr || "Failed to load quiz. Please try again."}</div>
          <button onClick={onRetry} style={{ background: "linear-gradient(135deg, #0891b2, #0284c7)", border: "none", borderRadius: 10, padding: "12px 28px", color: "white", fontWeight: 700, fontSize: 15 }}>🔄 Try Again</button>
        </div>
      ) : submitted ? (
        <div>
          <div style={{ background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(30px)", border: `2px solid ${score >= 40 ? "rgba(22,163,74,0.3)" : score >= 25 ? "rgba(234,179,8,0.3)" : "rgba(220,38,38,0.3)"}`, borderRadius: 24, padding: 40, textAlign: "center", marginBottom: 28, boxShadow: "0 12px 40px rgba(148,163,184,0.15)" }}>
            <div style={{ fontSize: 56, marginBottom: 16, display: "inline-block" }}>{score >= 40 ? "🏆" : score >= 25 ? "👍" : "📚"}</div>
            <div style={{ fontSize: 56, fontWeight: 900, color: "#1e293b", letterSpacing: "-0.02em" }}>{score}<span style={{ fontSize: 26, color: "#64748b", fontWeight: 400, marginLeft: 4 }}>/{quiz.length}</span></div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8, color: score >= 40 ? "#16a34a" : score >= 25 ? "#ca8a04" : "#dc2626", letterSpacing: "-0.01em" }}>
              {Math.round(score / quiz.length * 100)}% Accuracy
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6, color: score >= 40 ? "#22c55e" : score >= 25 ? "#eab308" : "#ef4444" }}>
              {score >= 40 ? "Excellent! Board Ready! 🎉" : score >= 25 ? "Good! Keep Practicing! 💪" : "Needs More Study. Review Notes! 📖"}
            </div>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 24 }}>
              <button onClick={onRetry}
                style={{ background: "linear-gradient(135deg, #0891b2, #0284c7)", border: "none", borderRadius: 12, padding: "13px 28px", color: "white", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                🔄 Retry Quiz
              </button>
              <button onClick={onReviewNotes}
                style={{ background: "linear-gradient(135deg, " + (S?.accent || "#6366f1") + ", " + (S?.accent || "#6366f1") + "cc)", border: "none", borderRadius: 12, padding: "13px 28px", color: "white", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                📝 Review Notes
              </button>
            </div>
          </div>
          <h3 style={{ fontWeight: 900, color: "#3b82f6", marginBottom: 18, fontSize: 18, letterSpacing: "-0.01em" }}>📊 Answer Review</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {quiz.map((q, i) => {
              const ua = answers[i]; const ca = q.ans; const ok = ua === ca;
              return (
                <div key={i} style={{ background: "rgba(255, 255, 255, 0.7)", backdropFilter: "blur(20px)", border: `1.5px solid ${ok ? "rgba(74,222,128,0.4)" : "rgba(248,113,113,0.4)"}`, borderRadius: 16, padding: 18 }}>
                  <div style={{ display: "flex", gap: 12, marginBottom: ok ? 8 : 10 }}>
                    <span style={{ background: ok ? "rgba(22,163,74,0.15)" : "rgba(220,38,38,0.15)", color: ok ? "#15803d" : "#ef4444", fontSize: 12, fontWeight: 800, padding: "4px 10px", borderRadius: 8, flexShrink: 0, alignSelf: "flex-start", border: `1px solid ${ok ? "#16a34a" : "#dc2626"}` }}>Q{i + 1} {ok ? "✓" : "✗"}</span>
                    <span style={{ fontSize: 14, color: "#1e293b", lineHeight: 1.6, fontWeight: 600 }}>{q.q}</span>
                  </div>
                  {!ok && (
                    <div style={{ marginLeft: 60, fontSize: 13, marginBottom: 8, background: "rgba(0,0,0,0.03)", padding: 10, borderRadius: 8 }}>
                      <div style={{ color: "#dc2626", fontWeight: 600 }}>Your answer: {q.opts[ua] || "Not answered"}</div>
                      <div style={{ color: "#059669", fontWeight: 700, marginTop: 4 }}>Correct: {q.opts[ca]}</div>
                    </div>
                  )}
                  <div style={{ marginLeft: 60, marginTop: 10, fontSize: 13, color: "#4f46e5", fontWeight: 500, lineHeight: 1.6 }}>💡 {q.exp}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div>
          <div className="no-print" style={{ background: "rgba(255, 255, 255, 0.8)", borderRadius: 18, border: "1.5px solid rgba(0,0,0,0.05)", padding: "16px 22px", marginBottom: 20, backdropFilter: "blur(20px)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#3b82f6", letterSpacing: "-0.01em" }}>Question {qIdx + 1} of {quiz.length}</span>
                <span style={{ fontSize: 12, color: "#475569", marginLeft: 14, fontWeight: 600 }}>{Object.keys(answers).length} answered</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <ExamTimer initialSeconds={1500} onExpire={onSubmit} />
                <Badge color={S?.accent || "#6366f1"}>{subject}</Badge>
              </div>
            </div>
            <ProgressBar value={qIdx + 1} max={quiz.length} color={S?.accent || "#6366f1"} height={6} />
          </div>

          {quiz[qIdx] && (
            <div style={{ background: "rgba(255, 255, 255, 0.8)", borderRadius: 20, border: "1.5px solid rgba(0,0,0,0.05)", padding: "28px 28px", marginBottom: 18, backdropFilter: "blur(20px)" }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: S?.accent || "#818cf8", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Question {qIdx + 1}</div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", lineHeight: 1.7, marginBottom: 24, letterSpacing: "-0.01em" }}>{quiz[qIdx].q}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {validateQuestion(quiz[qIdx])?.opts?.map((opt, oi) => {
                  const isSelected = answers[qIdx] === oi;
                  return (
                    <button key={oi} onClick={() => setAnswers(a => ({ ...a, [qIdx]: oi }))}
                      style={{
                        padding: "16px", borderRadius: 14, border: `1.5px solid ${isSelected ? (S?.accent || "#6366f1") : "rgba(0,0,0,0.05)"}`,
                        background: isSelected ? "rgba(59, 130, 246, 0.1)" : "rgba(255, 255, 255, 0.7)", color: isSelected ? "#1e293b" : "#475569",
                        fontWeight: isSelected ? 800 : 500, textAlign: "left", cursor: "pointer", transition: "all 0.2s"
                      }}
                      onMouseEnter={e => { if(!isSelected) e.currentTarget.style.background = "rgba(255, 255, 255, 1)"; }}
                      onMouseLeave={e => { if(!isSelected) e.currentTarget.style.background = "rgba(255, 255, 255, 0.7)"; }}>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <button onClick={() => setQIdx(q => Math.max(0, q - 1))} disabled={qIdx === 0}
              style={{ padding: "12px 24px", background: "rgba(255, 255, 255, 0.8)", border: "1.5px solid rgba(0,0,0,0.05)", borderRadius: 12, color: "#475569", fontWeight: 700, fontSize: 15, opacity: qIdx === 0 ? 0.4 : 1, cursor: qIdx === 0 ? "not-allowed" : "pointer" }}>
              ← Prev
            </button>
            {qIdx < quiz.length - 1 ? (
              <button onClick={() => setQIdx(q => q + 1)} style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg, #0891b2, #0284c7)", border: "none", borderRadius: 12, color: "white", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                Next →
              </button>
            ) : (
              <button onClick={onSubmit} style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg, #16a34a, #15803d)", border: "none", borderRadius: 12, color: "white", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                Submit Quiz ({Object.keys(answers).length}/{quiz.length}) ✓
              </button>
            )}
          </div>

          <div style={{ background: "rgba(255, 255, 255, 0.8)", borderRadius: 18, border: "1.5px solid rgba(0,0,0,0.05)", padding: "18px 20px", backdropFilter: "blur(20px)" }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>🧭 Navigator</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {quiz.map((_, i) => (
                <button key={i} onClick={() => setQIdx(i)}
                  style={{
                    width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, fontWeight: 700, cursor: "pointer", border: "none",
                    background: i === qIdx ? (S?.accent || "#6366f1") : answers[i] !== undefined ? "rgba(34,197,94,0.2)" : "rgba(0,0,0,0.05)",
                    color: i === qIdx ? "white" : answers[i] !== undefined ? "#059669" : "#64748b",
                    border: answers[i] !== undefined && i !== qIdx ? "1px solid rgba(34,197,94,0.4)" : "1px solid transparent"
                  }}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
