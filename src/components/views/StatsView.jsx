import { ProgressBar } from "../common";
import { getOverallStats, formatDuration, getStudyRecommendations } from "../../utils/sessionTracking";
import { useState, useEffect } from "react";

export function StatsView() {
  const [stats, setStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [timeRange, setTimeRange] = useState("all"); // all, week, month

  useEffect(() => {
    const overallStats = getOverallStats();
    setStats(overallStats);
    setRecommendations(getStudyRecommendations(overallStats));
  }, []);

  if (!stats) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <div style={{ color: "#94a3b8", fontSize: 16 }}>No study sessions yet</div>
        <div style={{ color: "#cbd5e1", fontSize: 14, marginTop: 8 }}>Start studying to see your statistics!</div>
      </div>
    );
  }

  const subjectsArray = Object.entries(stats.bySubject).sort((a, b) => b[1].total - a[1].total);
  const totalTimeFormatted = formatDuration(stats.totalTime);
  const avgTimeFormatted = formatDuration(stats.avgSessionTime);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 900, color: "#064e78", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
          📊 Your Study Statistics
        </h1>
        <p style={{ color: "#9d174d", marginTop: 8, fontSize: "clamp(13px, 2vw, 15px)", fontWeight: 500 }}>
          Track your progress and study habits
        </p>
      </div>

      {/* Key Metrics */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16,
        marginBottom: 32,
      }}>
        {[
          { emoji: "⏱️", label: "Total Study Time", value: totalTimeFormatted, color: "#3b82f6" },
          { emoji: "🔥", label: "Study Streak", value: `${stats.studyStreak} days`, color: "#f59e0b" },
          { emoji: "📚", label: "Sessions Completed", value: stats.completedSessions, color: "#0891b2" },
          { emoji: "📈", label: "Avg Session Time", value: avgTimeFormatted, color: "#16a34a" },
        ].map(({ emoji, label, value, color }) => (
          <div key={label} style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(240,249,252,0.95))",
            border: "1.5px solid #dbeafe",
            borderRadius: 18,
            padding: 20,
            textAlign: "center",
            boxShadow: "0 4px 16px rgba(236, 72, 153, 0.1)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(236, 72, 153, 0.15)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(236, 72, 153, 0.1)";
            }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{emoji}</div>
            <div style={{ fontSize: 12, color: "#9d174d", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              {label}
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: color, letterSpacing: "-0.01em" }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Session Summary */}
      <div style={{
        background: "linear-gradient(135deg, rgba(255,248,251,0.95), rgba(240,249,252,0.95))",
        border: "1.5px solid #dbeafe",
        borderRadius: 20,
        padding: 24,
        marginBottom: 32,
        boxShadow: "0 4px 16px rgba(236, 72, 153, 0.1)",
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#064e78", margin: "0 0 16px", letterSpacing: "-0.01em" }}>
          📋 Session Summary
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: "#9d174d", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Total Sessions
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#0891b2" }}>{stats.totalSessions}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#9d174d", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Completed
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#16a34a" }}>{stats.completedSessions}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#9d174d", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Abandoned
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#dc2626" }}>{stats.abandonedSessions}</div>
          </div>
        </div>
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #dbeafe" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#064e78" }}>Completion Rate</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: "#0891b2" }}>
              {stats.totalSessions > 0 ? Math.round((stats.completedSessions / stats.totalSessions) * 100) : 0}%
            </span>
          </div>
          <ProgressBar
            value={stats.completedSessions}
            max={stats.totalSessions}
            color="#0891b2"
            height={7}
          />
        </div>
      </div>

      {/* Study by Subject */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#064e78", margin: "0 0 16px", letterSpacing: "-0.01em" }}>
          📚 Time Spent by Subject
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {subjectsArray.length === 0 ? (
            <div style={{ textAlign: "center", padding: 20, color: "#94a3b8" }}>
              No subject data yet
            </div>
          ) : (
            subjectsArray.map(([subject, data]) => (
              <div key={subject} style={{
                background: "white",
                border: "1.5px solid #dbeafe",
                borderRadius: 16,
                padding: 16,
                boxShadow: "0 2px 8px rgba(236, 72, 153, 0.08)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1e293b" }}>{subject}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                      {data.count} session{data.count !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#0891b2" }}>
                    {formatDuration(data.total)}
                  </div>
                </div>
                <ProgressBar
                  value={data.total}
                  max={stats.totalTime}
                  color="#0891b2"
                  height={6}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Study Mode Distribution */}
      <div style={{
        background: "linear-gradient(135deg, rgba(255,248,251,0.95), rgba(240,249,252,0.95))",
        border: "1.5px solid #dbeafe",
        borderRadius: 20,
        padding: 24,
        marginBottom: 32,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#064e78", margin: "0 0 16px", letterSpacing: "-0.01em" }}>
          🎯 Study Mode Distribution
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
            <div style={{ fontSize: 12, color: "#9d174d", fontWeight: 700, marginBottom: 4 }}>Notes</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#3b82f6" }}>
              {stats.modeDistribution.notes}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🧠</div>
            <div style={{ fontSize: 12, color: "#9d174d", fontWeight: 700, marginBottom: 4 }}>Quizzes</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#16a34a" }}>
              {stats.modeDistribution.quiz}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
            <div style={{ fontSize: 12, color: "#9d174d", fontWeight: 700, marginBottom: 4 }}>Papers</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#7c3aed" }}>
              {stats.modeDistribution.paper}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "#064e78", margin: "0 0 16px", letterSpacing: "-0.01em" }}>
            💡 Recommendations
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recommendations.map((rec, i) => (
              <div key={i} style={{
                background: rec.priority === "high"
                  ? "linear-gradient(135deg, #fef5f5, #fee2e2)"
                  : rec.priority === "medium"
                    ? "linear-gradient(135deg, #fef9c3, #fefce8)"
                    : "linear-gradient(135deg, #f0fdf4, #f9fce4)",
                border: `1.5px solid ${rec.priority === "high" ? "#fca5a5" : rec.priority === "medium" ? "#fde047" : "#86efac"}`,
                borderRadius: 14,
                padding: 14,
                fontSize: 14,
                fontWeight: 600,
                color: rec.priority === "high" ? "#991b1b" : rec.priority === "medium" ? "#854d0e" : "#15803d",
              }}>
                {rec.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Session */}
      {stats.lastSession && (
        <div style={{
          background: "white",
          border: "1.5px solid #dbeafe",
          borderRadius: 16,
          padding: 16,
          textAlign: "center",
          color: "#94a3b8",
          fontSize: 13,
          fontWeight: 500,
        }}>
          Last studied: <strong style={{ color: "#064e78" }}>{stats.lastSession.subject} - {stats.lastSession.chapter}</strong> ({formatDuration(stats.lastSession.duration)})
        </div>
      )}
    </div>
  );
}
