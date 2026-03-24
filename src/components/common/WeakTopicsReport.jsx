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
          background: "linear-gradient(135deg, #f0fdf4, #f9fce4)",
          border: "1.5px solid #86efac",
          borderRadius: 16,
          padding: 20,
          textAlign: "center",
          color: "#15803d",
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
        <div style={{ fontWeight: 700, fontSize: 14 }}>No weak topics detected!</div>
        <div style={{ fontSize: 12, marginTop: 4, color: "#16a34a" }}>
          Keep taking quizzes to track your progress
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "white",
        border: "1.5px solid #dbeafe",
        borderRadius: 20,
        padding: 20,
        boxShadow: "0 4px 16px rgba(236, 72, 153, 0.08)",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 900, color: "#064e78", marginBottom: 16, letterSpacing: "-0.01em" }}>
        📊 Weak Topics Report
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: "1px solid #dbeafe", paddingBottom: 12 }}>
        <button
          onClick={() => setActiveTab("topics")}
          style={{
            padding: "8px 12px",
            background: activeTab === "topics" ? "#dbeafe" : "transparent",
            border: "none",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            color: activeTab === "topics" ? "#0369a1" : "#94a3b8",
            cursor: "pointer",
          }}
        >
          Topics ({weakTopics.length})
        </button>
        <button
          onClick={() => setActiveTab("chapters")}
          style={{
            padding: "8px 12px",
            background: activeTab === "chapters" ? "#dbeafe" : "transparent",
            border: "none",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            color: activeTab === "chapters" ? "#0369a1" : "#94a3b8",
            cursor: "pointer",
          }}
        >
          Chapters ({weakChapters.length})
        </button>
        <button
          onClick={() => setActiveTab("recent")}
          style={{
            padding: "8px 12px",
            background: activeTab === "recent" ? "#dbeafe" : "transparent",
            border: "none",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            color: activeTab === "recent" ? "#0369a1" : "#94a3b8",
            cursor: "pointer",
          }}
        >
          Recent ({recentWrongQuestions.length})
        </button>
      </div>

      {/* Topics Tab */}
      {activeTab === "topics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {weakTopics.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: "linear-gradient(135deg, #fee5e5, #fef2f2)",
                border: "1.5px solid #fca5a5",
                borderRadius: 12,
                padding: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: "#991b1b", fontSize: 14 }}>
                  {item.topic}
                </div>
                <div style={{ fontSize: 12, color: "#dc2626", marginTop: 2 }}>
                  Struggled in {item.mistakeCount} question{item.mistakeCount !== 1 ? "s" : ""}
                </div>
              </div>
              <span style={{ background: "#dc2626", color: "white", padding: "4px 10px", borderRadius: 6, fontWeight: 700, fontSize: 12 }}>
                {item.mistakeCount}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Chapters Tab */}
      {activeTab === "chapters" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {weakChapters.map((ch, idx) => (
            <div
              key={idx}
              style={{
                background: "linear-gradient(135deg, #fee5e5, #fef2f2)",
                border: "1.5px solid #fca5a5",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#991b1b" }}>
                    {ch.chapter}
                  </div>
                  <div style={{ fontSize: 12, color: "#dc2626", marginTop: 2 }}>
                    {ch.subject} • {ch.attempts} attempt{ch.attempts !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
              <div style={{ background: "white", height: 6, borderRadius: 3, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    background: ch.avgAccuracy >= 60 ? "#16a34a" : ch.avgAccuracy >= 40 ? "#f59e0b" : "#dc2626",
                    width: `${ch.avgAccuracy}%`,
                  }}
                />
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#991b1b", marginTop: 6 }}>
                Avg Accuracy: {ch.avgAccuracy}%
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Tab */}
      {activeTab === "recent" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recentWrongQuestions.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, padding: 16 }}>
              No recent mistakes
            </div>
          ) : (
            recentWrongQuestions.map((q, idx) => (
              <div
                key={idx}
                style={{
                  background: "#f8fafc",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>
                  {q.subject} • {q.chapter} • Q{q.qIdx}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", marginBottom: 8 }}>
                  {q.question}
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
                  <span style={{ color: "#dc2626", fontWeight: 600 }}>
                    ✗ You chose: {q.userAns !== undefined ? `Option ${q.userAns + 1}` : "Not answered"}
                  </span>
                  <span style={{ color: "#16a34a", fontWeight: 600 }}>
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
