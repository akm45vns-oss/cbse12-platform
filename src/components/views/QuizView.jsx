import { Badge, LoadingScreen, ExamTimer, ProgressBar } from "../common";
import { CURRICULUM } from "../../constants/curriculum";
import { useEffect, useState, memo } from "react";
import { useKeyboardShortcuts } from "../../hooks";
import { startSession, endSession } from "../../utils/sessionTracking";
import { validateQuestion } from "../../utils/quizUtils";

const OPTION_LETTERS = ["A", "B", "C", "D"];

export const QuizView = memo(function QuizView({ subject, chapter, loading, loadMsg, loadEmoji, quiz, quizErr, qIdx, setQIdx, answers, setAnswers, submitted, score, curriculumData, onSubmit, onRetry, onReviewNotes }) {
  const S = curriculumData;
  const accent = S?.accent || "#4f46e5";
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => { setShowExplanation(false); }, [qIdx]);
  useEffect(() => { if (quiz.length > 0 && !loading) startSession(subject, chapter, "quiz"); }, [quiz.length, loading, subject, chapter]);
  useEffect(() => { if (submitted) endSession(true); }, [submitted]);

  const shortcuts = !submitted && quiz.length > 0 ? [
    { key: "ArrowRight", action: () => { if (qIdx < quiz.length - 1) setQIdx(qIdx + 1); }, label: "→ Next Question" },
    { key: "ArrowLeft",  action: () => { if (qIdx > 0) setQIdx(qIdx - 1); }, label: "← Previous Question" },
    { key: "Enter", action: onSubmit, label: "↵ Submit Quiz" },
  ] : [];
  useKeyboardShortcuts(shortcuts);

  const progressPct = quiz.length > 0 ? Math.round(((qIdx + 1) / quiz.length) * 100) : 0;
  const answeredCount = Object.keys(answers).length;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", width: "100%", animation: "cvFadeIn 0.4s ease" }}>
      {loading ? (
        <LoadingScreen message={loadMsg} emoji={loadEmoji} />
      ) : quiz.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, background: "var(--bg-card)", borderRadius: 24, border: "1px solid var(--border-card)" }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>⚠️</div>
          <div style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 18 }}>{quizErr || "Failed to load quiz. Please try again."}</div>
          <button onClick={onRetry} style={{ background: "linear-gradient(135deg, #0891b2, #0284c7)", border: "none", borderRadius: 10, padding: "12px 28px", color: "white", fontWeight: 700, fontSize: 14 }}>🔄 Try Again</button>
        </div>
      ) : submitted ? (
        /* ── Results ── */
        <div>
          <div style={{ background: "var(--bg-card)", border: `2px solid ${score >= 40 ? "rgba(22,163,74,0.3)" : score >= 25 ? "rgba(234,179,8,0.3)" : "rgba(220,38,38,0.3)"}`, borderRadius: 24, padding: "32px 24px", textAlign: "center", marginBottom: 20, boxShadow: "var(--shadow-md)" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>{score >= 40 ? "🏆" : score >= 25 ? "👍" : "📚"}</div>
            <div style={{ fontSize: 52, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              {score}<span style={{ fontSize: 22, color: "var(--text-tertiary)", fontWeight: 400, marginLeft: 4 }}>/{quiz.length}</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 6, color: score >= 40 ? "#16a34a" : score >= 25 ? "#ca8a04" : "#dc2626" }}>
              {Math.round(score / quiz.length * 100)}% Accuracy
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4, color: score >= 40 ? "#22c55e" : score >= 25 ? "#eab308" : "#ef4444" }}>
              {score >= 40 ? "Excellent! Board Ready! 🎉" : score >= 25 ? "Good! Keep Practicing! 💪" : "Needs More Study. Review Notes! 📖"}
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
              <button onClick={onRetry} style={{ background: "linear-gradient(135deg, #0891b2, #0284c7)", border: "none", borderRadius: 12, padding: "12px 24px", color: "white", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
                🔄 Retry
              </button>
              <button onClick={onReviewNotes} style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, border: "none", borderRadius: 12, padding: "12px 24px", color: "white", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
                📝 Review Notes
              </button>
            </div>
          </div>

          {/* Answer Review */}
          <div style={{ fontSize: 14, fontWeight: 900, color: "var(--primary)", marginBottom: 14 }}>📊 Answer Review</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {quiz.map((q, i) => {
              const vq = validateQuestion(q) || {};
              const ua = answers[i]; const ca = vq.ans; const ok = ua === ca;
              return (
                <div key={i} style={{ background: "var(--bg-card)", border: `1.5px solid ${ok ? "rgba(74,222,128,0.4)" : "rgba(248,113,113,0.4)"}`, borderRadius: 14, padding: 16 }}>
                  <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                    <span style={{ background: ok ? "rgba(22,163,74,0.12)" : "rgba(220,38,38,0.12)", color: ok ? "#15803d" : "#ef4444", fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 7, flexShrink: 0, alignSelf: "flex-start", border: `1px solid ${ok ? "#16a34a" : "#dc2626"}` }}>
                      Q{i + 1} {ok ? "✓" : "✗"}
                    </span>
                    <span style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6, fontWeight: 600 }}>{vq.q}</span>
                  </div>
                  {!ok && (
                    <div style={{ fontSize: 12, marginBottom: 6, background: "var(--border)", padding: "8px 10px", borderRadius: 8 }}>
                      <div style={{ color: "#dc2626", fontWeight: 600 }}>Your answer: {vq.opts?.[ua] || "Not answered"}</div>
                      <div style={{ color: "#059669", fontWeight: 700, marginTop: 3 }}>Correct: {vq.opts?.[ca]}</div>
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: "var(--primary)", fontWeight: 500, lineHeight: 1.6 }}>💡 {vq.exp}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── Active Quiz ── */
        <div>
          {/* Progress header */}
          <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-card)", padding: "12px 16px", marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 900, color: accent }}>Q{qIdx + 1}</span>
                <span style={{ fontSize: 12, color: "var(--text-tertiary)", fontWeight: 600 }}> / {quiz.length}</span>
                <span style={{ fontSize: 11, color: "var(--text-tertiary)", marginLeft: 10, fontWeight: 600 }}>{answeredCount} answered</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <ExamTimer initialSeconds={1500} onExpire={onSubmit} />
                <Badge color={accent}>{subject}</Badge>
              </div>
            </div>
            {/* Clean horizontal progress bar */}
            <div className="quiz-progress-bar">
              <div className="quiz-progress-fill" style={{ width: `${progressPct}%`, background: accent }} />
            </div>
          </div>

          {/* Question card */}
          {quiz[qIdx] && (() => {
            const vq = validateQuestion(quiz[qIdx]);
            const isAnswered = answers[qIdx] !== undefined;
            return (
              <div style={{ background: "var(--bg-card)", borderRadius: 18, border: "1px solid var(--border-card)", padding: "18px 16px", marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: accent, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Question {qIdx + 1}</div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.7, marginBottom: 18 }}>{vq?.q}</p>

                {/* Options with A/B/C/D letters */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {vq?.opts?.map((opt, oi) => {
                    const isSelected = answers[qIdx] === oi;
                    return (
                      <button key={oi}
                        onClick={() => { setAnswers(a => ({ ...a, [qIdx]: oi })); setShowExplanation(false); }}
                        style={{
                          padding: "13px 14px", borderRadius: 13,
                          border: `1.5px solid ${isSelected ? accent : "var(--border-card)"}`,
                          background: isSelected ? `${accent}12` : "var(--bg-card)",
                          color: isSelected ? accent : "var(--text-secondary)",
                          fontWeight: isSelected ? 800 : 500,
                          textAlign: "left", cursor: "pointer", transition: "all 0.18s",
                          display: "flex", alignItems: "center", gap: 12,
                          fontSize: 14, lineHeight: 1.5,
                          boxShadow: isSelected ? `0 0 0 3px ${accent}20` : "var(--shadow-sm)",
                        }}>
                        {/* Letter circle */}
                        <span style={{
                          width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 900,
                          border: `1.5px solid ${isSelected ? accent : "var(--border)"}`,
                          color: isSelected ? accent : "var(--text-tertiary)",
                          background: isSelected ? `${accent}10` : "transparent",
                        }}>
                          {OPTION_LETTERS[oi]}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Show explanation after answering */}
                {isAnswered && vq?.exp && (
                  <div style={{ marginTop: 14 }}>
                    <button onClick={() => setShowExplanation(s => !s)}
                      style={{ background: "var(--primary-light)", border: "none", borderRadius: 10, padding: "7px 12px", color: "var(--primary)", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                      {showExplanation ? "▲ Hide" : "💡 Show Explanation"}
                    </button>
                    {showExplanation && (
                      <div style={{ marginTop: 10, background: "var(--primary-muted)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "var(--primary)", lineHeight: 1.6, fontWeight: 500 }}>
                        {vq.exp}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Navigation buttons */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <button onClick={() => setQIdx(q => Math.max(0, q - 1))} disabled={qIdx === 0}
              style={{ padding: "12px 20px", background: "var(--bg-card)", border: "1.5px solid var(--border-card)", borderRadius: 12, color: "var(--text-secondary)", fontWeight: 700, fontSize: 14, opacity: qIdx === 0 ? 0.4 : 1, cursor: qIdx === 0 ? "not-allowed" : "pointer" }}>
              ← Prev
            </button>
            {qIdx < quiz.length - 1 ? (
              <button onClick={() => setQIdx(q => q + 1)}
                style={{ flex: 1, padding: "12px", background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, border: "none", borderRadius: 12, color: "white", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
                Next →
              </button>
            ) : (
              <button onClick={onSubmit}
                style={{ flex: 1, padding: "12px", background: "linear-gradient(135deg, #16a34a, #15803d)", border: "none", borderRadius: 12, color: "white", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
                Submit Quiz ({answeredCount}/{quiz.length}) ✓
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
