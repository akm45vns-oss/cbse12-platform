import { getWeakTopics, getWeakChapters, getRecentWeakQuestions } from "../../utils/weakTopics";
import { useState } from "react";
import { useNavigation } from "../../hooks/useNavigation";

export function WeakTopicsReport() {
  const [activeTab, setActiveTab] = useState("topics");
  const nav = useNavigation();

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
          color: "#059669",
          boxShadow: "0 12px 32px rgba(16, 185, 129, 0.1)",
        }}
      >
        <div style={{ fontSize: 44, marginBottom: 12, filter: "drop-shadow(0 4px 12px rgba(16,185,129,0.3))" }}>🎉</div>
        <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.01em" }}>No weak topics detected!</div>
        <div style={{ fontSize: 14, marginTop: 6, color: "#10b981", opacity: 0.8, fontWeight: 500 }}>
          Keep taking quizzes to track your progress
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        border: "1px solid rgba(0, 0, 0, 0.05)",
        borderRadius: 24,
        padding: 24,
        boxShadow: "0 16px 40px rgba(148,163,184,0.15)",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 900, color: "#1e293b", marginBottom: 20, letterSpacing: "0.05em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ filter: "drop-shadow(0 2px 4px rgba(148,163,184,0.3))" }}>📊</span> 
        <span style={{ background: "linear-gradient(135deg, #1e293b 0%, #475569 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Weak Topics Report</span>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid rgba(0,0,0,0.05)", paddingBottom: 16, overflowX: "auto" }}>
        {["topics", "chapters", "recent"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "8px 16px",
              background: activeTab === tab ? "rgba(59, 130, 246, 0.1)" : "rgba(0,0,0,0.03)",
              border: activeTab === tab ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid rgba(0,0,0,0.05)",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: activeTab === tab ? "#3b82f6" : "#64748b",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => { if(activeTab !== tab) e.currentTarget.style.background = "rgba(0,0,0,0.06)"; }}
            onMouseLeave={e => { if(activeTab !== tab) e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
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
              onClick={() => nav.navigate("quiz", { chapter: item.topic })}
              style={{
                background: "rgba(239, 68, 68, 0.05)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: 14,
                padding: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                boxShadow: "0 4px 12px rgba(239, 68, 68, 0.05)",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)";
                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(239, 68, 68, 0.15), inset 0 0 0 1px rgba(239, 68, 68, 0.1)";
                e.currentTarget.style.transform = "translateX(4px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.05)";
                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.05)";
                e.currentTarget.style.transform = "translateX(0)";
              }}
            >
              <div>
                <div style={{ fontWeight: 800, color: "#dc2626", fontSize: 14 }}>
                  {item.topic}
                </div>
                <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 4, opacity: 0.9 }}>
                  Struggled in {item.mistakeCount} question{item.mistakeCount !== 1 ? "s" : ""} • Click to practice
                </div>
              </div>
              <span style={{ background: "rgba(239, 68, 68, 0.15)", color: "#dc2626", padding: "6px 14px", borderRadius: 8, fontWeight: 900, fontSize: 13, border: "1px solid rgba(239, 68, 68, 0.3)" }}>
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
              onClick={() => nav.navigate("quiz", { chapter: ch.chapter, subject: ch.subject })}
              style={{
                background: "rgba(239, 68, 68, 0.05)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: 14,
                padding: 16,
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)";
                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(239, 68, 68, 0.15), inset 0 0 0 1px rgba(239, 68, 68, 0.1)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.05)";
                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.05)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 800, color: "#dc2626", fontSize: 14 }}>
                    {ch.chapter}
                  </div>
                  <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 4, opacity: 0.9 }}>
                    {ch.subject} • {ch.attempts} attempt{ch.attempts !== 1 ? "s" : ""} • Click to practice
                  </div>
                </div>
              </div>
              <div style={{ background: "rgba(0,0,0,0.05)", height: 6, borderRadius: 3, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    background: ch.avgAccuracy >= 60 ? "#10b981" : ch.avgAccuracy >= 40 ? "#f59e0b" : "#ef4444",
                    width: `${ch.avgAccuracy}%`,
                    boxShadow: "0 0 8px rgba(239,68,68,0.5)"
                  }}
                />
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#dc2626", marginTop: 8 }}>
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
                  background: "rgba(255,255,255,0.8)",
                  border: "1px solid rgba(0,0,0,0.05)",
                  borderRadius: 14,
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {q.subject} • {q.chapter} • Q{q.qIdx}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 12, lineHeight: 1.4 }}>
                  {q.question}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12 }}>
                  <span style={{ color: "#dc2626", fontWeight: 600, background: "rgba(239, 68, 68, 0.1)", padding: "4px 8px", borderRadius: 6, display: "inline-block" }}>
                    ✗ You chose: {q.userAns !== undefined ? `Option ${q.userAns + 1}` : "Not answered"}
                  </span>
                  <span style={{ color: "#059669", fontWeight: 600, background: "rgba(16, 185, 129, 0.1)", padding: "4px 8px", borderRadius: 6, display: "inline-block" }}>
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
