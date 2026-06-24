import { memo } from "react";

export const ChapterView = memo(function ChapterView({
  subject, chapter, curriculumData, notesRead, quizBest, availableSets = [], onStartNotes, onStartQuiz
}) {
  const S = curriculumData;
  const quizSetCount = availableSets.length;

  // Compute a rough done percentage from read + quiz
  const donePct = notesRead && quizBest !== undefined ? 100
    : notesRead ? 50
    : quizBest !== undefined ? 50
    : 0;

  return (
    <div style={{ animation: "cvFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}>

      {/* ── Hero ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", margin: 0, lineHeight: 1.2, letterSpacing: "-0.02em", flex: 1, paddingRight: 12 }}>
            Study Hub
          </h1>
          {donePct > 0 && (
            <span style={{
              display: "inline-flex", alignItems: "center",
              background: "#ede9fe", color: "#4f46e5",
              fontSize: 11, fontWeight: 800, letterSpacing: "0.08em",
              padding: "5px 12px", borderRadius: 999, flexShrink: 0,
              textTransform: "uppercase",
            }}>
              {donePct}% DONE
            </span>
          )}
        </div>
        <p style={{ fontSize: 14, color: "#64748b", fontWeight: 500, margin: 0, lineHeight: 1.6 }}>
          Master {chapter} with AI-curated sessions.
        </p>
      </div>

      {/* ── Read Notes Card ── */}
      <button
        className="hub-card"
        onClick={onStartNotes}
        style={{ marginBottom: 14, border: "none" }}
      >
        {/* Watermark */}
        <div className="hub-card-watermark" style={{ fontSize: 70, opacity: 0.04, right: 0, bottom: -8 }}>
          📄
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="hub-card-icon" style={{ background: notesRead ? "#4f46e5" : "#ede9fe", marginBottom: 14 }}>
            <span style={{ fontSize: 22 }}>{notesRead ? "📖" : "📄"}</span>
          </div>

          <div style={{ fontSize: 19, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
            Read Notes
          </div>
          <div style={{ fontSize: 14, color: "#64748b", fontWeight: 500, marginBottom: 12, lineHeight: 1.5 }}>
            Simplified AI-summarized concepts and derivations.
          </div>

          {notesRead ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                background: "#dcfce7", color: "#16a34a",
                fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 999,
              }}>
                ✓ COMPLETED
              </span>
            </div>
          ) : (
            <div className="hub-cta">
              START READING
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          )}
        </div>
      </button>

      {/* ── Take Quiz Card ── */}
      <button
        className="hub-card"
        onClick={onStartQuiz}
        style={{ marginBottom: 24, border: "none" }}
      >
        {/* Watermark */}
        <div className="hub-card-watermark" style={{ fontSize: 70, opacity: 0.04, right: 0, bottom: -8 }}>
          🏆
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="hub-card-icon" style={{ background: quizBest !== undefined ? "#4f46e5" : "#ede9fe", marginBottom: 14 }}>
            <span style={{ fontSize: 22 }}>{quizBest !== undefined ? "✅" : "🏆"}</span>
          </div>

          <div style={{ fontSize: 19, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>
            Take Quiz
          </div>
          <div style={{ fontSize: 14, color: "#64748b", fontWeight: 500, marginBottom: 12, lineHeight: 1.5 }}>
            Challenge yourself with interactive Class 12 MCQs.
            {quizSetCount > 0 && <span style={{ color: "#94a3b8" }}> · {quizSetCount} set{quizSetCount !== 1 ? "s" : ""} available</span>}
          </div>

          {quizBest !== undefined ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                background: "#dcfce7", color: "#16a34a",
                fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 999,
              }}>
                ✓ BEST: {quizBest}/30
              </span>
            </div>
          ) : (
            <div className="hub-cta">
              PRACTICE NOW
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          )}
        </div>
      </button>

      {/* ── Quick Concept Banner ── */}
      <div style={{
        borderRadius: 20,
        overflow: "hidden",
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)",
        padding: "32px 24px",
        position: "relative",
        boxShadow: "0 8px 32px rgba(79, 70, 229, 0.25)",
      }}>
        {/* Glow orb */}
        <div style={{
          position: "absolute", top: "40%", left: "50%", transform: "translate(-50%, -50%)",
          width: 120, height: 120,
          background: "radial-gradient(circle, rgba(129, 140, 248, 0.35) 0%, transparent 70%)",
          filter: "blur(20px)", pointerEvents: "none",
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.5)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
            Quick Concept
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "white", lineHeight: 1.3 }}>
            Visualizing {chapter.split(" ").slice(0, 3).join(" ")}
          </div>
        </div>
      </div>

    </div>
  );
});
