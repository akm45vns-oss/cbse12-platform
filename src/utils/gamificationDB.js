/**
 * Database Functions for Gamification Features
 * PRODUCTION-SAFE: Error handling, retry logic, non-blocking syncs
 * 
 * Syncs streak, badge, and ranking data between localStorage and Supabase
 * All operations are non-blocking and fail gracefully
 */

import { supabase } from "./supabase";

// Production logging utility
const log = (level, msg, data = null) => {
  const prefix = `[GAMIFICATION-DB ${new Date().toISOString()}]`;
  if (level === 'error') console.error(`${prefix} ❌`, msg, data);
  else if (level === 'warn') console.warn(`${prefix} ⚠️`, msg, data);
  else if (level === 'info') console.info(`${prefix} ✓`, msg, data);
  else console.log(`${prefix}`, msg, data);
};

// Retry logic for transient failures
const withRetry = async (fn, maxRetries = 3, delayMs = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      log('warn', `Retry ${i + 1}/${maxRetries} after ${delayMs}ms`, error.message);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
};

// ===== STREAK DATABASE OPERATIONS =====

/**
 * Get streak data from database
 * @param {string} username
 * @returns { currentStreak: number, bestStreak: number, lastQuizDate: string, startDate: string }
 */
export async function getStreakFromDB(username) {
  try {
    if (!username) {
      log('warn', 'getStreakFromDB: username is empty');
      return { currentStreak: 0, bestStreak: 0, lastQuizDate: null, startDate: null };
    }

    const { data, error } = await withRetry(() =>
      supabase
        .from("user_streaks")
        .select("current_streak, best_streak, last_quiz_date, start_date")
        .eq("username", username)
        .single()
    );

    if (error) {
      // Not found is ok (new user)
      if (error.code !== 'PGRST116') {
        log('warn', `getStreakFromDB error for ${username}`, error.message);
      }
      return { currentStreak: 0, bestStreak: 0, lastQuizDate: null, startDate: null };
    }

    if (!data) {
      return { currentStreak: 0, bestStreak: 0, lastQuizDate: null, startDate: null };
    }

    return {
      currentStreak: data.current_streak || 0,
      bestStreak: data.best_streak || 0,
      lastQuizDate: data.last_quiz_date,
      startDate: data.start_date,
    };
  } catch (error) {
    log('error', 'getStreakFromDB critical error', error.message);
    return { currentStreak: 0, bestStreak: 0, lastQuizDate: null, startDate: null };
  }
}

/**
 * Save/update streak data in database
 * @param {string} username
 * @param {number} currentStreak
 * @param {number} bestStreak
 * @param {string} lastQuizDate
 * @param {string} startDate
 */
export async function saveStreakToDB(username, currentStreak, bestStreak, lastQuizDate, startDate) {
  try {
    if (!username) {
      log('warn', 'saveStreakToDB: username is empty');
      return false;
    }

    const success = await withRetry(async () => {
      const { error } = await supabase.from("user_streaks").upsert(
        {
          username,
          current_streak: currentStreak,
          best_streak: bestStreak,
          last_quiz_date: lastQuizDate,
          start_date: startDate,
        },
        { onConflict: "username" }
      );

      if (error) {
        throw new Error(`Upsert failed: ${error.message}`);
      }
      return true;
    }, 2);

    if (success) {
      log('info', `Streak saved for ${username}: ${currentStreak} days (best: ${bestStreak})`);
    }
    return success;
  } catch (error) {
    log('error', `saveStreakToDB failed for ${username}`, error.message);
    return false;
  }
}

// ===== BADGE DATABASE OPERATIONS =====

/**
 * Get all badges earned by user from database
 * @param {string} username
 * @returns {string[]} - Array of badge tiers earned
 */
export async function getBadgesFromDB(username) {
  try {
    const { data, error } = await supabase
      .from("user_badges")
      .select("badge_tier")
      .eq("username", username);

    if (error || !data) {
      return [];
    }

    return data.map(b => b.badge_tier);
  } catch (error) {
    console.error("Error fetching badges from DB:", error);
    return [];
  }
}

/**
 * Award a badge to user
 * @param {string} username
 * @param {string} badgeTier - 'bronze', 'silver', 'gold'
 */
export async function awardBadgeToDB(username, badgeTier) {
  try {
    const { error } = await supabase.from("user_badges").insert({
      username,
      badge_tier: badgeTier,
    });

    if (error) {
      // Badge might already be earned - that's ok
      if (error.code === "23505") {
        console.log(`${badgeTier} badge already awarded to ${username}`);
        return true;
      }
      console.error("Error awarding badge:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in awardBadgeToDB:", error);
    return false;
  }
}

/**
 * Get current badge tier from database
 * @param {string} username
 * @returns {string} - 'none', 'bronze', 'silver', 'gold'
 */
export async function getCurrentBadgeTierFromDB(username) {
  try {
    const { data, error } = await supabase
      .from("user_performance_metrics")
      .select("current_badge_tier")
      .eq("username", username)
      .single();

    if (error || !data) {
      return "none";
    }

    return data.current_badge_tier || "none";
  } catch (error) {
    console.error("Error fetching current badge tier:", error);
    return "none";
  }
}

// ===== PERFORMANCE METRICS DATABASE OPERATIONS =====

/**
 * Get or create performance metrics record
 * @param {string} username
 */
export async function getPerformanceMetricsFromDB(username) {
  try {
    const { data, error } = await supabase
      .from("user_performance_metrics")
      .select("*")
      .eq("username", username)
      .single();

    if (error && error.code === "PGRST116") {
      // No record found - create one
      const { error: insertError } = await supabase.from("user_performance_metrics").insert({
        username,
        total_quizzes_attempted: 0,
        total_score: 0,
        avg_score: 0,
        current_badge_tier: "none",
        badge_progress_percentage: 0,
      });

      if (insertError) {
        console.error("Error creating metrics record:", insertError);
        return null;
      }

      // Fetch the newly created record
      const { data: newData } = await supabase
        .from("user_performance_metrics")
        .select("*")
        .eq("username", username)
        .single();
      return newData;
    }

    if (error) {
      console.error("Error fetching metrics:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in getPerformanceMetricsFromDB:", error);
    return null;
  }
}

/**
 * Update performance metrics after quiz submission
 * @param {string} username
 * @param {number} quizScore - Score from current quiz
 */
export async function updatePerformanceMetricsDB(username, quizScore) {
  try {
    if (!username || quizScore === undefined) {
      log('warn', 'updatePerformanceMetricsDB: missing username or score');
      return false;
    }

    // Get current metrics
    const metrics = await getPerformanceMetricsFromDB(username);
    if (!metrics) {
      log('warn', `updatePerformanceMetricsDB: no metrics found for ${username}`);
      return false;
    }

    // Calculate new metrics
    const newTotal = metrics.total_quizzes_attempted + 1;
    const newScore = metrics.total_score + (quizScore || 0);
    const newAvg = parseFloat((newScore / newTotal).toFixed(2));

    const success = await withRetry(async () => {
      const { error } = await supabase
        .from("user_performance_metrics")
        .update({
          total_quizzes_attempted: newTotal,
          total_score: newScore,
          avg_score: newAvg,
        })
        .eq("username", username);

      if (error) {
        throw new Error(`Update failed: ${error.message}`);
      }
      return true;
    }, 2);

    if (success) {
      log('info', `Metrics updated for ${username}: ${newTotal} quizzes, avg ${newAvg}/30`);
    }
    return success;
  } catch (error) {
    log('error', `updatePerformanceMetricsDB failed for ${username}`, error.message);
    return false;
  }
}

/**
 * Update badge tier and progress in performance metrics
 * @param {string} username
 * @param {string} badgeTier - 'none', 'bronze', 'silver', 'gold'
 * @param {number} progress - 0-100
 */
export async function updateBadgeMemberDB(username, badgeTier, progress) {
  try {
    const { error } = await supabase
      .from("user_performance_metrics")
      .update({
        current_badge_tier: badgeTier,
        badge_progress_percentage: progress,
      })
      .eq("username", username);

    if (error) {
      console.error("Error updating badge in metrics:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in updateBadgeMemberDB:", error);
    return false;
  }
}

// ===== WEEKLY RANKINGS DATABASE OPERATIONS =====

/**
 * Save weekly ranking snapshot
 * @param {object[]} rankings - Array of topped users with scores
 * @param {string} weekStartDate - ISO date
 * @param {string} weekEndDate - ISO date
 */
export async function saveWeeklyRankingSnapshot(rankings, weekStartDate, weekEndDate) {
  try {
    const snapshots = rankings.map((user, idx) => ({
      rank: idx + 1,
      username: user.username,
      week_start_date: weekStartDate,
      week_end_date: weekEndDate,
      total_score: user.totalScore,
      total_attempts: user.attempts,
      avg_score: user.avgScore,
      badge_tier: user.badge?.split(" ")[1]?.toLowerCase() || "none",
    }));

    const { error } = await supabase.from("weekly_rankings").upsert(snapshots, {
      onConflict: "username,week_start_date",
    });

    if (error) {
      console.error("Error saving weekly ranking:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in saveWeeklyRankingSnapshot:", error);
    return false;
  }
}

/**
 * Get weekly ranking snapshot for a specific week
 * @param {string} weekStartDate
 * @param {string} weekEndDate
 * @param {number} limit
 */
export async function getWeeklyRankingSnapshot(weekStartDate, weekEndDate, limit = 5) {
  try {
    const { data, error } = await supabase
      .from("weekly_rankings")
      .select("*")
      .eq("week_start_date", weekStartDate)
      .order("rank", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("Error fetching weekly ranking snapshot:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getWeeklyRankingSnapshot:", error);
    return [];
  }
}

/**
 * Get user's ranking in a specific week
 * @param {string} username
 * @param {string} weekStartDate
 */
export async function getUserWeeklyRankSnapshot(username, weekStartDate) {
  try {
    const { data, error } = await supabase
      .from("weekly_rankings")
      .select("*")
      .eq("username", username)
      .eq("week_start_date", weekStartDate)
      .single();

    if (error) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching user weekly rank:", error);
    return null;
  }
}

// ===== SYNC OPERATIONS =====

/**
 * Sync all gamification data from localStorage to database
 * Call this when user logs in with saved data
 * @param {string} username
 */
export async function syncGamificationDataToDB(username) {
  try {
    if (!username) {
      log('warn', 'syncGamificationDataToDB: username is empty, skipping sync');
      return false;
    }

    log('info', `Starting gamification sync for ${username}`);

    // Get streak from localStorage
    const streakData = localStorage.getItem("akmedu_quiz_streak");
    if (streakData) {
      try {
        const streak = JSON.parse(streakData);
        const success = await saveStreakToDB(
          username,
          streak.streak || 0,
          streak.streak || 0,
          streak.lastQuizDate,
          streak.startDate
        );
        if (success) log('info', `Streak synced: ${streak.streak} days`);
      } catch (e) {
        log('error', 'Failed to sync streak', e.message);
      }
    }

    // Get quiz submissions for performance metrics
    const submissionsData = localStorage.getItem("akmedu_quiz_submissions");
    if (submissionsData) {
      try {
        const submissions = JSON.parse(submissionsData);
        if (submissions.length > 0) {
          const totalScore = submissions.reduce((sum, s) => sum + (s.score || 0), 0);
          const avgScore = (totalScore / submissions.length).toFixed(2);
          
          const metrics = await getPerformanceMetricsFromDB(username);
          if (metrics) {
            const success = await withRetry(async () => {
              const { error } = await supabase
                .from("user_performance_metrics")
                .update({
                  total_quizzes_attempted: submissions.length,
                  total_score: totalScore,
                  avg_score: parseFloat(avgScore),
                })
                .eq("username", username);
              
              if (error) throw error;
              return true;
            }, 2);

            if (success) {
              log('info', `Metrics synced: ${submissions.length} quizzes, avg ${avgScore}/30`);
            }
          }
        }
      } catch (e) {
        log('error', 'Failed to sync performance metrics', e.message);
      }
    }

    log('info', `Sync completed for ${username}`);
    return true;
  } catch (error) {
    log('error', `Critical error in syncGamificationDataToDB`, error.message);
    return false;
  }
}
