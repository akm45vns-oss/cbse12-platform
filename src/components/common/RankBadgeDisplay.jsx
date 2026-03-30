import React, { useState, useEffect } from "react";
import { calculateBadgeTier, getBadgeInfo, getBadgeProgress } from "../../utils/badges";
import { getQuizSubmissions } from "../../utils/weakTopics";

const RankBadgeDisplay = () => {
  const [badgeInfo, setBadgeInfo] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Calculate metrics from quiz submissions
    const submissions = getQuizSubmissions();
    
    let totalScore = 0;
    let totalAttempts = submissions.length;
    let streak = 0;

    submissions.forEach(sub => {
      totalScore += sub.score || 0;
      if (sub.streak) streak = Math.max(streak, sub.streak);
    });

    const avgScore = totalAttempts > 0 ? totalScore / totalAttempts : 0;
    
    const info = getBadgeInfo(avgScore, streak, totalAttempts);
    setBadgeInfo(info);
    
    const badgeProgress = getBadgeProgress(avgScore, streak, totalAttempts);
    setProgress(badgeProgress);
  }, []);

  if (!badgeInfo) return null;

  const { current, nextTier, nextRequirements } = badgeInfo;
  const tiers = ["none", "bronze", "silver", "gold"];
  const tierIndex = tiers.indexOf(current.tier);
  const nextTierIndex = tierIndex + 1;

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${current.color}, ${adjustBrightness(current.color, -30)})`,
        borderRadius: 16,
        padding: "20px",
        marginBottom: "16px",
        color: "white",
        boxShadow: `0 4px 15px ${current.color}40`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div>
          <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "4px" }}>Current Badge</div>
          <div style={{ fontSize: "36px", marginBottom: "4px" }}>{current.icon}</div>
          <div style={{ fontSize: "16px", fontWeight: "bold" }}>{current.tier.toUpperCase()}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "4px" }}>Overall Progress</div>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{progress}%</div>
        </div>
      </div>

      <div style={{ margin: "12px 0" }}>
        <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>{current.description}</div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            width: "100%",
            height: "6px",
            background: "rgba(255,255,255,0.2)",
            borderRadius: "3px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "rgba(255,255,255,0.9)",
              borderRadius: "3px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Next tier info */}
      {nextTier && nextTierIndex <= 3 && (
        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px" }}>
          <div style={{ fontSize: "12px", marginBottom: "8px", fontWeight: 500, opacity: 0.9 }}>
            Next: {nextTier.tier.toUpperCase()} {nextTier.icon}
          </div>
          <div style={{ fontSize: "12px", lineHeight: "1.6" }}>
            {nextRequirements?.map((req, idx) => (
              <div key={idx} style={{ opacity: req.met ? 1 : 0.6 }}>
                {req.met ? "✓" : "○"} {req.metric}: {req.current}/{req.required}
              </div>
            ))}
          </div>
        </div>
      )}

      {current.tier === "gold" && (
        <div style={{ marginTop: "12px", fontSize: "13px", textAlign: "center", fontWeight: 500 }}>
          ⭐ You've reached the highest rank! Keep the momentum! ⭐
        </div>
      )}
    </div>
  );
};

// Helper function to adjust brightness
function adjustBrightness(color, percent) {
  const num = parseInt(color.replace(/^#/, ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255))
    .toString(16).slice(1);
}

export default RankBadgeDisplay;
