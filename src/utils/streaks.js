/**
 * Daily Quiz Streak Tracking
 * Tracks consecutive days of quiz attempts
 * Syncs with database when available
 */

import { saveStreakToDB } from "./gamificationDB";

const STORAGE_KEY = "akmedu_quiz_streak";

/**
 * Get current streak data
 * @returns { streak: number, lastQuizDate: string, startDate: string }
 */
export function getStreakData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { streak: 0, lastQuizDate: null, startDate: null };
  } catch {
    return { streak: 0, lastQuizDate: null, startDate: null };
  }
}

/**
 * Record a quiz attempt and update streak
 * @param {string} date - ISO date string (e.g., '2024-03-30')
 * @param {string} username - Optional: sync with database if provided
 * @returns { streak: number, isNewDay: boolean }
 */
export function recordQuizAttempt(date = new Date().toISOString().split('T')[0], username = null) {
  try {
    const streakData = getStreakData();
    const today = date;

    // If no previous quiz, start new streak
    if (!streakData.lastQuizDate) {
      const newData = { streak: 1, lastQuizDate: today, startDate: today };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return { streak: 1, isNewDay: true };
    }

    // Parse dates
    const lastDate = new Date(streakData.lastQuizDate);
    const currentDate = new Date(today);
    const daysDiff = Math.floor(
      (currentDate - lastDate) / (1000 * 60 * 60 * 24)
    );

    // Same day - no change
    if (daysDiff === 0) {
      return { streak: streakData.streak, isNewDay: false };
    }
    
    // First quiz - start new streak
    if (streakData.streak === 0) {
      const newData = { streak: 1, lastQuizDate: today, startDate: today };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      
      if (username) {
        saveStreakToDB(username, 1, 1, today, today)
          .then(() => console.log(`[STREAK] Started streak for ${username}`))
          .catch(err => console.error("Failed to sync new streak to DB:", err));
      }
      
      return { streak: 1, isNewDay: true };
    }

    // Consecutive day - increment streak
    if (daysDiff === 1) {
      const newData = {
        streak: streakData.streak + 1,
        lastQuizDate: today,
        startDate: streakData.startDate || today
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      
      // Sync to database if username provided
      if (username) {
        saveStreakToDB(username, newData.streak, newData.streak, today, newData.startDate)
          .then(() => console.log(`[STREAK] Updated streak to ${newData.streak} days for ${username}`))
          .catch(err => console.error("Failed to sync streak to DB:", err));
      }
      
      return { streak: streakData.streak + 1, isNewDay: true };
    }

    // More than 1 day gap - reset streak
    if (daysDiff > 1) {
      const newData = { streak: 1, lastQuizDate: today, startDate: today };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      
      // Sync reset to database if username provided
      if (username) {
        saveStreakToDB(username, 1, streakData.streak, today, today)
          .then(() => console.log(`[STREAK] Reset streak for ${username}, best: ${streakData.streak}`))
          .catch(err => console.error("Failed to sync streak reset to DB:", err));
      }
      
      return { streak: 1, isNewDay: true, reset: true };
    }
  } catch (e) {
    console.error("Error recording quiz attempt:", e);
    return { streak: 1, isNewDay: true };
  }
}

/**
 * Get formatted streak message
 * @param {number} streak
 * @returns {string}
 */
export function getStreakMessage(streak) {
  if (streak === 0) return "🔥 Start your streak! Attempt a quiz today.";
  if (streak === 1) return "🔥 1-day streak! Keep it up!";
  if (streak < 7) return `🔥 ${streak}-day streak! Almost there!`;
  if (streak < 30) return `🔥 ${streak}-day streak! You're on fire!`;
  return `🔥 ${streak}-day streak! 🏆 You're legendary!`;
}

/**
 * Get streak milestone rewards
 * @param {number} streak
 * @returns { milestone: number, reward: string, icon: string }[]
 */
export function getStreakMilestones(streak) {
  const milestones = [
    { milestone: 3, reward: "Achieved 3-day streak!", icon: "🥉" },
    { milestone: 7, reward: "Achieved 7-day streak!", icon: "🥈" },
    { milestone: 14, reward: "Achieved 2-week streak!", icon: "👑" },
    { milestone: 30, reward: "Achieved 1-month streak!", icon: "💎" },
  ];

  return milestones.filter(m => streak >= m.milestone);
}

/**
 * Reset streak (for testing or when user wants to)
 */
export function resetStreak() {
  localStorage.removeItem(STORAGE_KEY);
  return { streak: 0, lastQuizDate: null, startDate: null };
}

/**
 * Get progress to next milestone
 * @param {number} streak
 * @returns { current: number, next: number, progress: number }
 */
export function getStreakProgress(streak) {
  const milestones = [3, 7, 14, 30, 60, 100];
  const nextMilestone = milestones.find(m => m > streak) || 100;
  const prevMilestone = milestones.filter(m => m <= streak).pop() || 0;

  const progress = Math.round(
    ((streak - prevMilestone) / (nextMilestone - prevMilestone)) * 100
  );

  return {
    current: streak,
    next: nextMilestone,
    remaining: nextMilestone - streak,
    progress: Math.min(progress, 100)
  };
}
