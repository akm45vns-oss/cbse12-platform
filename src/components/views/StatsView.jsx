import { ProgressBar } from "../common";
import { getOverallStats, formatDuration, getStudyRecommendations } from "../../utils/sessionTracking";
import { useState, useEffect } from "react";
import { useTheme, useProgress } from "../../hooks";
import {
  getSubjectPerformance,
  getTopicMastery,
  getStudyTrends,
  getPersonalizedInsights,
  getQuizPerformanceMetrics,
  getPerformanceColor,
  getPerformanceLabel,
} from "../../utils/analyticsEngine";
import { CURRICULUM } from "../../constants/curriculum";

export function StatsView() {
  const theme = useTheme();
  const progress = useProgress();
  const [stats, setStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [subjectPerf, setSubjectPerf] = useState({});
  const [topicData, setTopicData] = useState({ weakTopics: [], strongTopics: [] });
  const [trends, setTrends] = useState({ bySubject: {}, peakHours: [], dailyActivity: [] });
  const [insights, setInsights] = useState(null);
  const [quizMetrics, setQuizMetrics] = useState(null);
  const [sortBy, setSortBy] = useState("performance");
  const [trendTab, setTrendTab] = useState("hourly");

  useEffect(() => {
    const overallStats = getOverallStats();
    setStats(overallStats);
    setRecommendations(getStudyRecommendations(overallStats));

    const perfData = getSubjectPerformance();
    setSubjectPerf(perfData);

    const topicMast = getTopicMastery();
    setTopicData(topicMast);

    const trendData = getStudyTrends(progress.data);
    setTrends(trendData);

    const quizMetricsData = getQuizPerformanceMetrics();
    setQuizMetrics(quizMetricsData);

    const insightsData = getPersonalizedInsights(progress.data, topicMast, perfData);
    setInsights(insightsData);
  }, [progress.data]);

  if (!stats) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <div style={{ color: theme.isDarkMode ? "#cbd5e1" : "#94a3b8", fontSize: 16 }}>No study sessions yet</div>
        <div style={{ color: theme.isDarkMode ? "#94a3b8" : "#cbd5e1", fontSize: 14, marginTop: 8 }}>Start studying to see your statistics!</div>
      </div>
    );
  }

  const subjectsArray = Object.entries(stats.bySubject).sort((a, b) => b[1].total - a[1].total);
  const totalTimeFormatted = formatDuration(stats.totalTime);
  const avgTimeFormatted = formatDuration(stats.avgSessionTime);

  const subjectsPerfArray = Object.entries(subjectPerf);
  const subjectsOrderedByPerf = [...subjectsPerfArray].sort((a, b) => b[1].accuracy - a[1].accuracy);
  const subjectsCurriculumOrder = [...subjectsPerfArray].sort((a, b) => {
    const aOrder = Object.keys(CURRICULUM).indexOf(a[0]);
    const bOrder = Object.keys(CURRICULUM).indexOf(b[0]);
    return aOrder - bOrder;
  });
  const displayedSubjects = sortBy === "performance" ? subjectsOrderedByPerf : subjectsCurriculumOrder;

  const peakHour = trends.peakHours.reduce((prev, curr) =>
    curr.sessions > prev.sessions ? curr : prev
  );
  const peakHourText = peakHour?.hour ? `${peakHour.hour}:00 - ${peakHour.hour + 1}:00` : "N/A";

  const bestDay = trends.dailyActivity.reduce((prev, curr) =>
    curr.sessions > prev.sessions ? curr : prev
  );
  const bestDayText = bestDay?.day || "N/A";

  const cardBg = theme.isDarkMode
    ? "linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.8))"
    : "rgba(255, 255, 255, 0.8)";
  const cardBorder = theme.isDarkMode ? "#475569" : "rgba(0,0,0,0.05)";
  const cardTextColor = theme.isDarkMode ? "#cbd5e1" : "#1e293b";
  const labelColor = theme.isDarkMode ? "#94a3b8" : "#64748b";

  return (
    <div style={{ color: cardTextColor }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 900, color: theme.isDarkMode ? "#22d3ee" : "#1e293b", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
          📊 Your Study Statistics
        </h1>
        <p style={{ color: labelColor, marginTop: 8, fontSize: "clamp(13px, 2vw, 15px)", fontWeight: 500 }}>
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
            background: cardBg,
            border: `1.5px solid ${cardBorder}`,
            borderRadius: 18,
            padding: 20,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            textAlign: "center",
            boxShadow: theme.isDarkMode ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 12px rgba(148,163,184,0.15)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = theme.isDarkMode ? "0 8px 20px rgba(0,0,0,0.4)" : "0 8px 24px rgba(148,163,184,0.2)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = theme.isDarkMode ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 12px rgba(148,163,184,0.15)";
            }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{emoji}</div>
            <div style={{ fontSize: 12, color: labelColor, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
              {label}
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: color, letterSpacing: "-0.01em" }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Quiz Performance Panel */}
      {quizMetrics && quizMetrics.totalAttempts > 0 && (
        <div style={{
          background: cardBg,
          border: `1.5px solid ${cardBorder}`,
          borderRadius: 20,
          padding: 24,
          marginBottom: 32,
          boxShadow: theme.isDarkMode ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 16px rgba(148,163,184,0.15)",
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: theme.isDarkMode ? "#22d3ee" : "#1e293b", margin: "0 0 16px", letterSpacing: "-0.01em" }}>
            🧠 Quiz Performance
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: labelColor, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Avg Score
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#0891b2" }}>{quizMetrics.avgScore}/30</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: labelColor, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Accuracy
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#16a34a" }}>{quizMetrics.overallAccuracy}%</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: labelColor, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Best Score
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#3b82f6" }}>{quizMetrics.bestScore}/30</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: labelColor, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Total Attempts
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#f59e0b" }}>{quizMetrics.totalAttempts}</div>
            </div>
          </div>
        </div>
      )}

      {/* Subject Performance Comparison */}
      {displayedSubjects.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: theme.isDarkMode ? "#22d3ee" : "#1e293b", margin: 0, letterSpacing: "-0.01em" }}>
              📊 Subject Performance
            </h3>
            <div style={{ display: "flex", gap: 8 }}>
              {["performance", "curriculum"].map(opt => (
                <button
                  key={opt}
                  onClick={() => setSortBy(opt)}
                  style={{
                    background: sortBy === opt
                      ? "#0891b2"
                      : theme.isDarkMode ? "#334155" : "#dbeafe",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 12px",
                    color: sortBy === opt ? "white" : theme.isDarkMode ? "#cbd5e1" : "#0369a1",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {opt === "performance" ? "By Performance" : "By Curriculum"}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {displayedSubjects.map(([subject, data]) => {
              const S = CURRICULUM[subject];
              return (
                <div key={subject} style={{
                  background: S?.light || "#f0f9fc",
                  border: `2px solid ${S?.border || "#dbeafe"}`,
                  borderRadius: 14,
                  padding: 14,
                  textAlign: "center",
                  boxShadow: theme.isDarkMode ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(148,163,184,0.1)",
                  transition: "all 0.2s",
                }}>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>{S?.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: S?.text || "#1e293b", textTransform: "uppercase", marginBottom: 4, letterSpacing: "0.05em" }}>
                    {subject}
                  </div>
                  <div style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: getPerformanceColor(data.accuracy),
                    marginBottom: 4,
                  }}>
                    {data.accuracy}%
                  </div>
                  <div style={{ fontSize: 10, color: "#9d174d", marginBottom: 8 }}>
                    {data.attempts} attempt{data.attempts !== 1 ? "s" : ""}
                  </div>
                  <div style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: getPerformanceColor(data.accuracy),
                    textTransform: "uppercase",
                  }}>
                    {getPerformanceLabel(data.accuracy)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Study Trends with Tabs */}
      <div style={{
        background: cardBg,
        border: `1.5px solid ${cardBorder}`,
        borderRadius: 20,
        padding: 24,
        marginBottom: 32,
        boxShadow: theme.isDarkMode ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 16px rgba(148,163,184,0.15)",
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: theme.isDarkMode ? "#22d3ee" : "#1e293b", margin: "0 0 16px", letterSpacing: "-0.01em" }}>
          📈 Study Patterns
        </h3>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {["hourly", "daily"].map(tab => (
            <button
              key={tab}
              onClick={() => setTrendTab(tab)}
              style={{
                background: trendTab === tab
                  ? "#0891b2"
                  : theme.isDarkMode ? "#334155" : "#dbeafe",
                border: "none",
                borderRadius: 8,
                padding: "8px 12px",
                color: trendTab === tab ? "white" : theme.isDarkMode ? "#cbd5e1" : "#0369a1",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {tab === "hourly" ? "⏰ Hourly" : "📅 Daily"}
            </button>
          ))}
        </div>

        {/* Hourly Heatmap */}
        {trendTab === "hourly" && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: labelColor, marginBottom: 12 }}>
              Peak Study Hour: {peakHourText}
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(25px, 1fr))",
              gap: 4,
            }}>
              {trends.peakHours.map(h => {
                const intensity = h.sessions / (Math.max(...trends.peakHours.map(x => x.sessions)) || 1);
                const opacity = Math.max(0.2, intensity);
                return (
                  <div
                    key={h.hour}
                    title={`${h.hour}:00 - ${h.sessions} sessions`}
                    style={{
                      background: `rgba(8, 145, 178, ${opacity})`,
                      borderRadius: 4,
                      padding: 6,
                      textAlign: "center",
                      fontSize: 10,
                      fontWeight: 600,
                      color: intensity > 0.5 ? "white" : "#0891b2",
                      cursor: "pointer",
                    }}
                  >
                    {h.hour}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Daily Heatmap */}
        {trendTab === "daily" && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: labelColor, marginBottom: 12 }}>
              Most Active Day: {bestDayText}
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 8,
            }}>
              {trends.dailyActivity.map(d => {
                const intensity = d.sessions / (Math.max(...trends.dailyActivity.map(x => x.sessions)) || 1);
                const opacity = Math.max(0.2, intensity);
                return (
                  <div
                    key={d.dayNum}
                    style={{
                      textAlign: "center",
                    }}
                  >
                    <div
                      title={`${d.day}: ${d.sessions} sessions`}
                      style={{
                        background: `rgba(8, 145, 178, ${opacity})`,
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 8,
                        cursor: "pointer",
                        minHeight: 40,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div style={{ fontSize: 18, fontWeight: 700, color: intensity > 0.5 ? "white" : "#0891b2" }}>
                        {d.sessions}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: labelColor }}>
                      {d.day.substring(0, 3)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Topic Mastery */}
      {(topicData.weakTopics.length > 0 || topicData.strongTopics.length > 0) && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: theme.isDarkMode ? "#22d3ee" : "#1e293b", margin: "0 0 16px", letterSpacing: "-0.01em" }}>
            🎯 Topic Mastery
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
            {/* Weak Topics */}
            {topicData.weakTopics.length > 0 && (
              <div style={{
                background: cardBg,
                border: `1.5px solid ${cardBorder}`,
                borderRadius: 14,
                padding: 16,
                boxShadow: theme.isDarkMode ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(148,163,184,0.1)",
              }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#dc2626", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  ⚠️ Needs Focus
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {topicData.weakTopics.slice(0, 3).map((t, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: cardTextColor, marginBottom: 4 }}>
                        {t.topic}
                      </div>
                      <div style={{ fontSize: 11, color: labelColor, marginBottom: 4 }}>
                        {t.mistakeCount} mistakes · {t.accuracy}% accuracy
                      </div>
                      <ProgressBar value={t.accuracy} max={100} color="#dc2626" height={5} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strong Topics */}
            {topicData.strongTopics.length > 0 && (
              <div style={{
                background: cardBg,
                border: `1.5px solid ${cardBorder}`,
                borderRadius: 14,
                padding: 16,
                boxShadow: theme.isDarkMode ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(148,163,184,0.1)",
              }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#16a34a", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  ⭐ Mastered
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {topicData.strongTopics.slice(0, 3).map((t, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: cardTextColor, marginBottom: 4 }}>
                        {t.topic}
                      </div>
                      <div style={{ fontSize: 11, color: labelColor, marginBottom: 4 }}>
                        {t.correctCount} correct · {t.accuracy}% accuracy
                      </div>
                      <ProgressBar value={t.accuracy} max={100} color="#16a34a" height={5} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Personalized Insights */}
      {insights && (
        <div style={{
          background: theme.isDarkMode 
            ? "linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.9))"
            : "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.9))",
          backdropFilter: "blur(20px)",
          border: theme.isDarkMode ? "1.5px solid #0891b2" : "1.5px solid rgba(59,130,246,0.3)",
          borderRadius: 20,
          padding: 24,
          marginBottom: 32,
          boxShadow: theme.isDarkMode ? "0 8px 32px rgba(8, 145, 178, 0.2)" : "0 8px 24px rgba(59,130,246,0.15)",
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: theme.isDarkMode ? "#22d3ee" : "#3b82f6", margin: "0 0 16px", letterSpacing: "-0.01em" }}>
            💡 Personalized Insights
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                📊 Overall Completion
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#22d3ee", marginBottom: 8 }}>
                {insights.overallCompletion}%
              </div>
              <ProgressBar value={insights.overallCompletion} max={100} color="#22d3ee" height={6} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                ⏰ Peak Study Time
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fbbf24" }}>
                {insights.bestStudyTime}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                🏆 Best Subject
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#4ade80" }}>
                {insights.bestSubject}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                🎯 Next Goal
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#cbd5e1" }}>
                {insights.nextGoal}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Summary */}
      <div style={{
        background: cardBg,
        border: `1.5px solid ${cardBorder}`,
        borderRadius: 20,
        padding: 24,
        marginBottom: 32,
        boxShadow: theme.isDarkMode ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 16px rgba(148,163,184,0.15)",
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: theme.isDarkMode ? "#22d3ee" : "#1e293b", margin: "0 0 16px", letterSpacing: "-0.01em" }}>
          📋 Session Summary
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: labelColor, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Total Sessions
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#0891b2" }}>{stats.totalSessions}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: labelColor, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Completed
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#16a34a" }}>{stats.completedSessions}</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: labelColor, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Abandoned
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#dc2626" }}>{stats.abandonedSessions}</div>
          </div>
        </div>
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${cardBorder}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: theme.isDarkMode ? "#cbd5e1" : "#064e78" }}>Completion Rate</span>
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

      {/* Time by Subject */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: theme.isDarkMode ? "#22d3ee" : "#1e293b", margin: "0 0 16px", letterSpacing: "-0.01em" }}>
          📚 Time Spent by Subject
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {subjectsArray.length === 0 ? (
            <div style={{ textAlign: "center", padding: 20, color: labelColor }}>
              No subject data yet
            </div>
          ) : (
            subjectsArray.map(([subject, data]) => (
              <div key={subject} style={{
                background: cardBg,
                border: `1.5px solid ${cardBorder}`,
                borderRadius: 16,
                padding: 16,
                boxShadow: theme.isDarkMode ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(148,163,184,0.1)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: cardTextColor }}>{subject}</div>
                    <div style={{ fontSize: 12, color: labelColor, marginTop: 2 }}>
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
        background: cardBg,
        border: `1.5px solid ${cardBorder}`,
        borderRadius: 20,
        padding: 24,
        marginBottom: 32,
        boxShadow: theme.isDarkMode ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 16px rgba(148,163,184,0.15)",
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: theme.isDarkMode ? "#22d3ee" : "#1e293b", margin: "0 0 16px", letterSpacing: "-0.01em" }}>
          🎯 Study Mode Distribution
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
            <div style={{ fontSize: 12, color: labelColor, fontWeight: 700, marginBottom: 4 }}>Notes</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#3b82f6" }}>
              {stats.modeDistribution.notes}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🧠</div>
            <div style={{ fontSize: 12, color: labelColor, fontWeight: 700, marginBottom: 4 }}>Quizzes</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#16a34a" }}>
              {stats.modeDistribution.quiz}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
            <div style={{ fontSize: 12, color: labelColor, fontWeight: 700, marginBottom: 4 }}>Papers</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#7c3aed" }}>
              {stats.modeDistribution.paper}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: theme.isDarkMode ? "#22d3ee" : "#1e293b", margin: "0 0 16px", letterSpacing: "-0.01em" }}>
            💡 Smart Recommendations
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recommendations.map((rec, i) => (
              <div key={i} style={{
                background: rec.priority === "high"
                  ? theme.isDarkMode ? "rgba(220, 38, 38, 0.1)" : "linear-gradient(135deg, #fef5f5, #fee2e2)"
                  : rec.priority === "medium"
                    ? theme.isDarkMode ? "rgba(245, 158, 11, 0.1)" : "linear-gradient(135deg, #fef9c3, #fefce8)"
                    : theme.isDarkMode ? "rgba(34, 197, 94, 0.1)" : "linear-gradient(135deg, #f0fdf4, #f9fce4)",
                border: `1.5px solid ${rec.priority === "high" ? theme.isDarkMode ? "#7c2d12" : "#fca5a5" : rec.priority === "medium" ? theme.isDarkMode ? "#78350f" : "#fde047" : theme.isDarkMode ? "#15803d" : "#86efac"}`,
                borderRadius: 14,
                padding: 14,
                fontSize: 14,
                fontWeight: 600,
                color: rec.priority === "high" ? theme.isDarkMode ? "#fca5a5" : "#991b1b" : rec.priority === "medium" ? theme.isDarkMode ? "#fde047" : "#854d0e" : theme.isDarkMode ? "#86efac" : "#15803d",
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
          background: cardBg,
          border: `1.5px solid ${cardBorder}`,
          borderRadius: 16,
          padding: 16,
          textAlign: "center",
          color: labelColor,
          fontSize: 13,
          fontWeight: 500,
        }}>
          Last studied: <strong style={{ color: theme.isDarkMode ? "#22d3ee" : "#3b82f6" }}>{stats.lastSession.subject} - {stats.lastSession.chapter}</strong> ({formatDuration(stats.lastSession.duration)})
        </div>
      )}
    </div>
  );
}
