import React, { useState, useEffect } from "react";
import { getLocalWeeklyToppers, getWeekDateRange } from "../../utils/weeklyRanking";

const WeeklyToppers = () => {
  const [toppers, setToppers] = useState([]);
  const [dateRange, setDateRange] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadToppers = async () => {
      setLoading(true);
      try {
        // Try to get from Supabase first, fall back to local
        const weeklyToppers = await getLocalWeeklyToppers(5);
        setToppers(weeklyToppers);
        setDateRange(getWeekDateRange());
      } catch (error) {
        console.error("Error loading weekly toppers:", error);
      }
      setLoading(false);
    };

    loadToppers();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          background: "linear-gradient(135deg, #667eea, #764ba2)",
          borderRadius: 16,
          padding: "20px",
          marginBottom: "16px",
          color: "white",
          textAlign: "center",
        }}
      >
        <div>Loading Weekly Rankings...</div>
      </div>
    );
  }

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        borderRadius: 16,
        padding: "20px",
        marginBottom: "16px",
        color: "white",
        boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
      }}
    >
      <div style={{ marginBottom: "16px" }}>
        <div style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "4px" }}>🏆 Topper of the Week</div>
        {dateRange && (
          <div style={{ fontSize: "12px", opacity: 0.8 }}>Week of {dateRange.displayText}</div>
        )}
      </div>

      {toppers.length === 0 ? (
        <div style={{ textAlign: "center", opacity: 0.8, padding: "20px 0" }}>
          <div style={{ marginBottom: "8px" }}>No quiz attempts this week yet.</div>
          <div style={{ fontSize: "12px" }}>Complete a quiz to appear on the leaderboard! 📚</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {toppers.map((user, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(255, 255, 255, 0.1)",
                padding: "12px 14px",
                borderRadius: "10px",
                backdropFilter: "blur(10px)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                <div style={{ fontSize: "24px", minWidth: "30px", textAlign: "center" }}>
                  {idx < 3 ? medals[idx] : `#${idx + 1}`}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px" }}>{user.username}</div>
                  <div style={{ fontSize: "12px", opacity: 0.8 }}>
                    {user.attempts} quiz{user.attempts !== 1 ? "zes" : ""} • {user.badge}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: "bold", fontSize: "16px" }}>{user.totalScore}</div>
                <div style={{ fontSize: "12px", opacity: 0.8 }}>pts</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: "12px", fontSize: "12px", textAlign: "center", opacity: 0.8 }}>
        💡 Complete more quizzes to climb the rankings!
      </div>
    </div>
  );
};

export default WeeklyToppers;
