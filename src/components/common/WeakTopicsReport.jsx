import { getWeakTopics, getWeakChapters, getRecentWeakQuestions } from "../../utils/weakTopics";
import { useState } from "react";

export function WeakTopicsReport() {
  const [activeTab, setActiveTab] = useState("topics");

  const weakTopics = getWeakTopics(5);
  const weakChapters = getWeakChapters(5);
  const recentWrongQuestions = getRecentWeakQuestions(5);

  if (weakTopics.length === 0 && weakChapters.length === 0) {
    return (
      <div
        style={{
          background: "rgba(16, 185, 129, 0.05)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(16, 185, 129, 0.2)",
          borderRadius: 24,
          padding: 32,
          textAlign: "center",
          color: "#34d399",
          boxShadow: "0 12px 32px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div style={{ fontSize: 44, marginBottom: 12, filter: "drop-shadow(0 4px 12px rgba(16,185,129,0.3))" }}>🎉</div>
        <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.01em" }}>No weak topics detected!</div>
        <div style={{ fontSize: 14, marginTop: 6, color: "#6ee7b7", opacity: 0.8, fontWeight: 500 }}>
          Keep taking quizzes to track your progress
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "rgba(15, 23, 42, 0.4)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 24,
        padding: 24,
        boxShadow: "0 16px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 900, color: "#f8fafc", marginBottom: 20, letterSpacing: "0.05em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>📊</span> 
        <span style={{ background: "linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Weak Topics Report</span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: 16, overflowX: "auto" }}>
        {["topics", "chapters", "recent"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 16px",
              background: activeTab === tab ? "rgba(6, 182, 212, 0.15)" : "rgba(255, 255, 255, 0.02)",
              border: activeTab === tab ? "1px solid rgba(6, 182, 212, 0.3)" : "1px solid rgba(255, 255, 255, 0.05)",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: activeTab === tab ? "#22d3ee" : "#94a3b8",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => { if(activeTab !== tab) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
            onMouseLeave={e => { if(activeTab !== tab) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} (
              {tab === "topics" ? weakTopics.length : tab === "chapters" ? weakChapters.length : recentWrongQuestions.length}
            )
          </button>
        ))}
      </div>

      {/* Topics Tab */}
      {activeTab === "topics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {weakTopics.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(239, 68, 68, 0.05)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: 14,
                padding: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.05)",
              }}
            >
              <div>
                <div style={{ fontWeight: 800, color: "#fca5a5", fontSize: 14 }}>
                  {item.topic}
                </div>
                <div style={{ fontSize: 12, color: "#f87171", marginTop: 4, opacity: 0.9 }}>
                  Struggled in {item.mistakeCount} question{item.mistakeCount !== 1 ? "s" : ""}
                </div>
              </div>
              <span style={{ background: "rgba(239, 68, 68, 0.2)", color: "#fecaca", padding: "6px 14px", borderRadius: 8, fontWeight: 900, fontSize: 13, border: "1px solid rgba(239, 68, 68, 0.3)" }}>
                {item.mistakeCount} x
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Chapters Tab */}
      {activeTab === "chapters" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {weakChapters.map((ch, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(239, 68, 68, 0.05)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: 14,
                padding: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 800, color: "#fca5a5", fontSize: 14 }}>
                    {ch.chapter}
                  </div>
                  <div style={{ fontSize: 12, color: "#f87171", marginTop: 4, opacity: 0.9 }}>
                    {ch.subject} • {ch.attempts} attempt{ch.attempts !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.1)", height: 6, borderRadius: 3, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    background: ch.avgAccuracy >= 60 ? "#10b981" : ch.avgAccuracy >= 40 ? "#f59e0b" : "#ef4444",
                    width: `${ch.avgAccuracy}%`,
                    boxShadow: "0 0 8px rgba(239,68,68,0.5)"
                  }}
                />
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#fca5a5", marginTop: 8 }}>
                Avg Accuracy: {ch.avgAccuracy}%
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Tab */}
      {activeTab === "recent" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {recentWrongQuestions.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, padding: 16 }}>
              No recent mistakes
            </div>
          ) : (
            recentWrongQuestions.map((q, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 14,
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {q.subject} • {q.chapter} • Q{q.qIdx}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#f8fafc", marginBottom: 12, lineHeight: 1.4 }}>
                  {q.question}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
                  <span style={{ color: "#fca5a5", fontWeight: 600, background: "rgba(239, 68, 68, 0.1)", padding: "4px 8px", borderRadius: 6, display: "inline-block" }}>
                    ✗ You chose: {q.userAns !== undefined ? `Option ${q.userAns + 1}` : "Not answered"}
                  </span>
                  <span style={{ color: "#6ee7b7", fontWeight: 600, background: "rgba(16, 185, 129, 0.1)", padding: "4px 8px", borderRadius: 6, display: "inline-block" }}>
                    ✓ Correct: Option {q.correctAns + 1}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
