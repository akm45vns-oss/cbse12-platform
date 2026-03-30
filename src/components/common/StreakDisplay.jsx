import React, { useState, useEffect } from "react";
import { getStreakData, getStreakMessage, getStreakMilestones, getStreakProgress } from "../../utils/streaks";

const StreakDisplay = () => {
  const [streak, setStreak] = useState({ streak: 0, lastQuizDate: null, startDate: null });
  const [milestones, setMilestones] = useState([]);
  const [progress, setProgress] = useState({ current: 0, next: 3, remaining: 3, progress: 0 });

  useEffect(() => {
    const streakData = getStreakData();
    setStreak(streakData);
    setMilestones(getStreakMilestones(streakData.streak));
    setProgress(getStreakProgress(streakData.streak));
  }, []);

  const message = getStreakMessage(streak.streak);

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #ff6b6b, #ee5a6f)",
        borderRadius: 16,
        padding: "20px",
        marginBottom: "16px",
        color: "white",
        boxShadow: "0 4px 15px rgba(255, 107, 107, 0.3)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <div>
          <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "4px" }}>Daily Quiz Streak</div>
          <div style={{ fontSize: "32px", fontWeight: "bold" }}>{streak.streak} 🔥</div>
        </div>
        <div style={{ textAlign: "right", fontSize: "14px" }}>
          <div>{message}</div>
          {streak.lastQuizDate && (
            <div style={{ opacity: 0.8, marginTop: "4px", fontSize: "12px" }}>
              Last: {new Date(streak.lastQuizDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar to next milestone */}
      <div style={{ marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
          <span>Progress to {progress.next} day streak</span>
          <span>{progress.remaining} days to go</span>
        </div>
        <div
          style={{
            width: "100%",
            height: "8px",
            background: "rgba(255,255,255,0.2)",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress.progress}%`,
              height: "100%",
              background: "rgba(255,255,255,0.9)",
              borderRadius: "4px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Milestones achieved */}
      {milestones.length > 0 && (
        <div>
          <div style={{ fontSize: "12px", marginBottom: "8px", fontWeight: 500 }}>Milestones Achieved</div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {milestones.map((m, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                {m.icon} {m.reward}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StreakDisplay;
