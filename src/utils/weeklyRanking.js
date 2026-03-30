/**
 * Weekly Ranking - "Topper of the Week"
 * Calculates rankings based on quiz performance in the past 7 days
 */

import { supabase } from "./supabase";

/**
 * Get weekly rankings (Topper of the Week)
 * @param {number} limit - Number of top performers to return (default: 5)
 * @returns { username: string, totalScore: number, attempts: number, avgScore: number, badge: string }[]
 */
export async function getWeeklyToppers(limit = 5) {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    // Query quiz submissions from the past 7 days
    const { data, error } = await supabase
      .from("quiz_submissions")
      .select("username, score")
      .gte("submitted_at", sevenDaysAgoISO)
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Error fetching weekly toppers:", error);
      return [];
    }

    // Aggregate by username
    const aggregated = {};
    (data || []).forEach(submission => {
      if (!aggregated[submission.username]) {
        aggregated[submission.username] = {
          username: submission.username,
          totalScore: 0,
          attempts: 0,
          scores: []
        };
      }
      aggregated[submission.username].totalScore += submission.score || 0;
      aggregated[submission.username].attempts += 1;
      aggregated[submission.username].scores.push(submission.score || 0);
    });

    // Convert to array and sort by total score
    const rankings = Object.values(aggregated)
      .map(user => ({
        username: user.username,
        totalScore: user.totalScore,
        attempts: user.attempts,
        avgScore: parseFloat((user.totalScore / user.attempts).toFixed(2)),
        badge: getBadgeForScore(user.totalScore / user.attempts)
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit);

    return rankings;
  } catch (error) {
    console.error("Error in getWeeklyToppers:", error);
    return [];
  }
}

/**
 * Get local weekly toppers (from localStorage for development/offline)
 * @param {number} limit
 * @returns { username: string, totalScore: number, attempts: number, avgScore: number, badge: string }[]
 */
export function getLocalWeeklyToppers(limit = 5) {
  try {
    const submissions = JSON.parse(
      localStorage.getItem("akmedu_quiz_submissions") || "[]"
    );

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Filter submissions from past 7 days
    const recentSubmissions = submissions.filter(sub => {
      const subDate = new Date(sub.date);
      return subDate >= sevenDaysAgo;
    });

    // Aggregate by username (use from currentUser or default)
    const aggregated = {};
    const currentUser = localStorage.getItem("akmedu_username") || "You";

    recentSubmissions.forEach(submission => {
      if (!aggregated[currentUser]) {
        aggregated[currentUser] = {
          username: currentUser,
          totalScore: 0,
          attempts: 0,
          scores: []
        };
      }
      aggregated[currentUser].totalScore += submission.score || 0;
      aggregated[currentUser].attempts += 1;
      aggregated[currentUser].scores.push(submission.score || 0);
    });

    // Convert to array, sort, and return
    const rankings = Object.values(aggregated)
      .map(user => ({
        username: user.username,
        totalScore: user.totalScore,
        attempts: user.attempts,
        avgScore: parseFloat((user.totalScore / user.attempts).toFixed(2)),
        badge: getBadgeForScore(user.totalScore / user.attempts)
      }))
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit);

    return rankings;
  } catch (error) {
    console.error("Error in getLocalWeeklyToppers:", error);
    return [];
  }
}

/**
 * Get badge for a score (0-30)
 * @param {number} score
 * @returns {string}
 */
function getBadgeForScore(avgScore) {
  const percentage = (avgScore / 30) * 100;
  if (percentage >= 90) return "🥇 Gold";
  if (percentage >= 75) return "🥈 Silver";
  if (percentage >= 50) return "🥉 Bronze";
  return "⭐ Rising";
}

/**
 * Get user's weekly rank
 * @param {string} username
 * @returns { rank: number, totalScore: number, percentile: number }
 */
export async function getUserWeeklyRank(username) {
  try {
    const toppers = await getWeeklyToppers(100); // Get top 100 for percentile
    const userRank = toppers.findIndex(u => u.username === username);

    if (userRank === -1) {
      return { rank: null, totalScore: 0, percentile: 0 };
    }

    const percentile = Math.round(((100 - userRank) / 100) * 100);

    return {
      rank: userRank + 1,
      totalScore: toppers[userRank].totalScore,
      percentile
    };
  } catch (error) {
    console.error("Error getting user weekly rank:", error);
    return { rank: null, totalScore: 0, percentile: 0 };
  }
}

/**
 * Get this week's date range
 * @returns { startDate: Date, endDate: Date, displayText: string }
 */
export function getWeekDateRange() {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 7);

  const displayText = `${startDate.toLocaleDateString()} - ${today.toLocaleDateString()}`;

  return { startDate, endDate: today, displayText };
}

/**
 * Check if user made it to top 3 this week
 * @param {string} username
 * @returns {boolean}
 */
export async function isTopperThisWeek(username) {
  try {
    const toppers = await getWeeklyToppers(3);
    return toppers.some(t => t.username === username);
  } catch (error) {
    console.error("Error in isTopperThisWeek:", error);
    return false;
  }
}

/**
 * Format ranking for display
 * @param { rank: number, username: string, totalScore: number, avgScore: number, badge: string }
 * @returns {string}
 */
export function formatRankingForDisplay(user) {
  const medals = ["🥇", "🥈", "🥉"];
  const medal = user.rank <= 3 ? medals[user.rank - 1] : `#${user.rank}`;

  return `${medal} ${user.username} - ${user.totalScore} pts (${user.avgScore}/30 avg)`;
}
