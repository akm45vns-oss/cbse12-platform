/**
 * Rank Badge System
 * Gold, Silver, Bronze badges based on performance metrics
 * Syncs with database when available
 */

import { awardBadgeToDB, updateBadgeMemberDB } from "./gamificationDB";

/**
 * Calculate user's badge tier based on performance
 * @param {number} avgScore - Average quiz score (0-30)
 * @param {number} streak - Current quiz streak (days)
 * @param {number} totalAttempts - Total quizzes attempted
 * @param {string} username - Optional: for database sync
 * @returns { tier: string, icon: string, description: string, color: string }
 */
export function calculateBadgeTier(avgScore = 0, streak = 0, totalAttempts = 0, username = null) {
  // Score weights (out of 30)
  const scorePercentage = (avgScore / 30) * 100;
  
  // Calculate tier based on multiple factors
  let tier, icon, description, color;

  // Gold tier requirements: 90+ average score OR 14+ day streak OR 30+ attempts with 80+ avg
  if (scorePercentage >= 90 || streak >= 14 || (totalAttempts >= 30 && scorePercentage >= 80)) {
    tier = "gold";
    icon = "🥇";
    description = "Elite Performer - Consistent Excellence";
    color = "#FFD700";
    
    // Award badge if username provided
    if (username) {
      awardBadgeToDB(username, "gold")
        .catch(err => console.error("Failed to award gold badge:", err));
    }
  }
  // Silver tier requirements: 75-89 average score OR 7-13 day streak OR 15+ attempts with 70+ avg
  else if (scorePercentage >= 75 || streak >= 7 || (totalAttempts >= 15 && scorePercentage >= 70)) {
    tier = "silver";
    icon = "🥈";
    description = "Advanced Learner - Strong Performance";
    color = "#C0C0C0";
    
    // Award badge if username provided
    if (username) {
      awardBadgeToDB(username, "silver")
        .catch(err => console.error("Failed to award silver badge:", err));
    }
  }
  // Bronze tier requirements: 50+ average score OR 3+ day streak OR 5+ attempts
  else if (scorePercentage >= 50 || streak >= 3 || totalAttempts >= 5) {
    tier = "bronze";
    icon = "🥉";
    description = "Rising Star - Good Effort";
    color = "#CD7F32";
    
    // Award badge if username provided
    if (username) {
      awardBadgeToDB(username, "bronze")
        .catch(err => console.error("Failed to award bronze badge:", err));
    }
  }
  // None tier
  else {
    tier = "none";
    icon = "⭐";
    description = "Keep Learning - Start Your Journey";
    color = "#A9A9A9";
  }

  return { tier, icon, description, color };
}

/**
 * Get detailed badge info with requirements
 * @param {number} avgScore
 * @param {number} streak
 * @param {number} totalAttempts
 * @returns { current: object, nextTier: object, requirements: object[] }
 */
export function getBadgeInfo(avgScore = 0, streak = 0, totalAttempts = 0) {
  const current = calculateBadgeTier(avgScore, streak, totalAttempts);
  
  const scorePercentage = (avgScore / 30) * 100;

  const requirements = {
    gold: [
      { metric: "Average Score", current: scorePercentage.toFixed(1), required: 90, type: "percentage", met: scorePercentage >= 90 },
      { metric: "Streak Days", current: streak, required: 14, type: "number", met: streak >= 14 },
      { metric: "Attempts (with 80%+)", current: totalAttempts, required: 30, type: "number", met: totalAttempts >= 30 && scorePercentage >= 80 }
    ],
    silver: [
      { metric: "Average Score", current: scorePercentage.toFixed(1), required: 75, type: "percentage", met: scorePercentage >= 75 },
      { metric: "Streak Days", current: streak, required: 7, type: "number", met: streak >= 7 },
      { metric: "Attempts (with 70%+)", current: totalAttempts, required: 15, type: "number", met: totalAttempts >= 15 && scorePercentage >= 70 }
    ],
    bronze: [
      { metric: "Average Score", current: scorePercentage.toFixed(1), required: 50, type: "percentage", met: scorePercentage >= 50 },
      { metric: "Streak Days", current: streak, required: 3, type: "number", met: streak >= 3 },
      { metric: "Attempts", current: totalAttempts, required: 5, type: "number", met: totalAttempts >= 5 }
    ]
  };

  // Determine next tier
  let nextTier = null;
  if (current.tier === "none" || current.tier === "bronze") {
    nextTier = "bronze";
  } else if (current.tier === "bronze") {
    nextTier = "silver";
  } else if (current.tier === "silver") {
    nextTier = "gold";
  }

  return {
    current,
    nextTier: nextTier ? {
      ...calculateBadgeTier(30, 14, 30), // Placeholder gold
      tier: nextTier
    } : null,
    requirements: requirements[current.tier] || [],
    nextRequirements: nextTier ? requirements[nextTier] : null
  };
}

/**
 * Get badge progress percentage (0-100)
 * @param {number} avgScore
 * @param {number} streak
 * @param {number} totalAttempts
 * @returns {number}
 */
export function getBadgeProgress(avgScore = 0, streak = 0, totalAttempts = 0) {
  const scorePercentage = (avgScore / 30) * 100;
  
  // Calculate progress based on: 40% score, 40% streak, 20% attempts
  const scoreProgress = Math.min(scorePercentage, 100) / 100;
  const streakProgress = Math.min(streak / 14, 1);
  const attemptsProgress = Math.min(totalAttempts / 30, 1);
  
  const overall = (scoreProgress * 0.4 + streakProgress * 0.4 + attemptsProgress * 0.2) * 100;
  return Math.round(overall);
}

/**
 * Get all badge tiers
 * @returns { tier: string, icon: string, description: string, color: string }[]
 */
export function getAllBadgeTiers() {
  return [
    {
      tier: "gold",
      icon: "🥇",
      description: "Elite Performer - Consistent Excellence",
      color: "#FFD700",
      requirements: "90+ avg score OR 14+ day streak"
    },
    {
      tier: "silver",
      icon: "🥈",
      description: "Advanced Learner - Strong Performance",
      color: "#C0C0C0",
      requirements: "75+ avg score OR 7+ day streak"
    },
    {
      tier: "bronze",
      icon: "🥉",
      description: "Rising Star - Good Effort",
      color: "#CD7F32",
      requirements: "50+ avg score OR 3+ day streak"
    },
    {
      tier: "none",
      icon: "⭐",
      description: "Keep Learning - Start Your Journey",
      color: "#A9A9A9",
      requirements: "Keep practicing!"
    }
  ];
}
