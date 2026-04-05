import { supabase } from './supabase';

// ===== LEADERBOARD CACHING =====
// Cache configuration: 5 minutes TTL to balance freshness and performance
const LEADERBOARD_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const leaderboardCache = new Map();

/**
 * Get cache key for a leaderboard query
 * @private
 */
function getCacheKey(subject, chapter, limit) {
  return `${subject}:${chapter || 'all'}:${limit}`;
}

/**
 * Get cached data if available and not expired
 * @private
 */
function getCachedData(cacheKey) {
  const cached = leaderboardCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < LEADERBOARD_CACHE_TTL) {
    console.log(`[leaderboard] Cache hit for ${cacheKey}`);
    return cached.data;
  }
  return null;
}

/**
 * Store data in cache with timestamp
 * @private
 */
function setCachedData(cacheKey, data) {
  leaderboardCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Clear leaderboard cache (useful for manual refresh)
 */
export function clearLeaderboardCache() {
  leaderboardCache.clear();
  console.log('[leaderboard] Cache cleared');
}

/**
 * Get leaderboard data ranked by average percentage score
 * @param {string} subject - The subject to get leaderboard for
 * @param {string|null} chapter - Optional chapter filter (null for subject-wide)
 * @param {number} limit - Number of top users to return (default: 25)
 * @returns {Promise<Array>} Array of leaderboard entries with rank, username, avgPercentage, attempts, bestScore
 */
export async function getLeaderboardData(subject, chapter = null, limit = 25) {
  const cacheKey = getCacheKey(subject, chapter, limit);
  
  // Check cache first
  const cachedData = getCachedData(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    let query = supabase
      .from('quiz_submissions')
      .select('username, score')
      .eq('subject', subject);

    if (chapter) {
      query = query.eq('chapter', chapter);
    }

    const { data: submissions, error } = await query;

    if (error) {
      console.error('[getLeaderboardData] Error fetching submissions:', error);
      return [];
    }

    if (!submissions || submissions.length === 0) {
      return [];
    }

    // Group by username and calculate statistics
    const userStats = {};
    submissions.forEach(submission => {
      if (!userStats[submission.username]) {
        userStats[submission.username] = {
          username: submission.username,
          scores: [],
          attempts: 0
        };
      }
      userStats[submission.username].scores.push(submission.score);
      userStats[submission.username].attempts += 1;
    });

    // Convert to array and calculate aggregate metrics
    const leaderboard = Object.values(userStats)
      .map(stat => ({
        username: stat.username,
        avgPercentage: ((stat.scores.reduce((a, b) => a + b, 0) / (stat.scores.length * 30)) * 100).toFixed(2),
        bestScore: Math.max(...stat.scores),
        worstScore: Math.min(...stat.scores),
        totalAttempts: stat.attempts,
        totalScore: stat.scores.reduce((a, b) => a + b, 0)
      }))
      .sort((a, b) => {
        // Sort by average percentage (descending)
        if (b.avgPercentage !== a.avgPercentage) {
          return parseFloat(b.avgPercentage) - parseFloat(a.avgPercentage);
        }
        // Tie-breaker: best score
        return b.bestScore - a.bestScore;
      })
      .slice(0, limit)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry
      }));

    // Cache the result
    setCachedData(cacheKey, leaderboard);
    return leaderboard;
  } catch (error) {
    console.error('[getLeaderboardData] Unexpected error:', error);
    return [];
  }
}

/**
 * Get current user's rank in a subject leaderboard
 * @param {string} username - Username to find rank for
 * @param {string} subject - Subject to check rank in
 * @param {string|null} chapter - Optional chapter filter
 * @returns {Promise<object|null>} User's rank data or null if not found
 */
export async function getUserRank(username, subject, chapter = null) {
  try {
    // Get full leaderboard (which is cached), then find user in it
    const leaderboard = await getLeaderboardData(subject, chapter, 1000); // Get more to find user
    
    const userEntry = leaderboard.find(entry => entry.username === username);
    
    if (!userEntry) {
      return null; // User has no submissions
    }

    return {
      rank: userEntry.rank,
      username: userEntry.username,
      avgPercentage: userEntry.avgPercentage,
      bestScore: userEntry.bestScore,
      totalUsers: leaderboard.length
    };
  } catch (error) {
    console.error('[getUserRank] Unexpected error:', error);
    return null;
  }
}

/**
 * Get leaderboards for all subjects (top N users per subject)
 * @param {number} limit - Number of top users per subject
 * @returns {Promise<object>} Object with subject names as keys and leaderboard arrays as values
 */
export async function getAllSubjectLeaderboards(limit = 25) {
  try {
    const { data: submissions, error } = await supabase
      .from('quiz_submissions')
      .select('username, subject, score');

    if (error) {
      console.error('[getAllSubjectLeaderboards] Error fetching submissions:', error);
      return {};
    }

    if (!submissions || submissions.length === 0) {
      return {};
    }

    // Group by subject
    const subjectData = {};
    submissions.forEach(submission => {
      if (!subjectData[submission.subject]) {
        subjectData[submission.subject] = [];
      }
      subjectData[submission.subject].push(submission);
    });

    // Build leaderboard for each subject
    const leaderboards = {};
    Object.keys(subjectData).forEach(subject => {
      const userStats = {};
      subjectData[subject].forEach(submission => {
        if (!userStats[submission.username]) {
          userStats[submission.username] = {
            username: submission.username,
            scores: [],
            attempts: 0
          };
        }
        userStats[submission.username].scores.push(submission.score);
        userStats[submission.username].attempts += 1;
      });

      leaderboards[subject] = Object.values(userStats)
        .map(stat => ({
          username: stat.username,
          avgPercentage: (stat.scores.reduce((a, b) => a + b, 0) / stat.scores.length).toFixed(2),
          bestScore: Math.max(...stat.scores),
          totalAttempts: stat.attempts
        }))
        .sort((a, b) => {
          if (b.avgPercentage !== a.avgPercentage) {
            return parseFloat(b.avgPercentage) - parseFloat(a.avgPercentage);
          }
          return b.bestScore - a.bestScore;
        })
        .slice(0, limit)
        .map((entry, index) => ({
          rank: index + 1,
          ...entry
        }));
    });

    return leaderboards;
  } catch (error) {
    console.error('[getAllSubjectLeaderboards] Unexpected error:', error);
    return {};
  }
}

/**
 * Get chapter-wise leaderboard for a subject
 * @param {string} subject - The subject to get chapter leaderboards for
 * @param {number} limit - Number of top users per chapter
 * @returns {Promise<object>} Object with chapter names as keys and leaderboard arrays as values
 */
export async function getChapterLeaderboards(subject, limit = 25) {
  try {
    const { data: submissions, error } = await supabase
      .from('quiz_submissions')
      .select('username, chapter, score')
      .eq('subject', subject);

    if (error) {
      console.error('[getChapterLeaderboards] Error fetching submissions:', error);
      return {};
    }

    if (!submissions || submissions.length === 0) {
      return {};
    }

    // Group by chapter
    const chapterData = {};
    submissions.forEach(submission => {
      if (!chapterData[submission.chapter]) {
        chapterData[submission.chapter] = [];
      }
      chapterData[submission.chapter].push(submission);
    });

    // Build leaderboard for each chapter
    const leaderboards = {};
    Object.keys(chapterData).forEach(chapter => {
      const userStats = {};
      chapterData[chapter].forEach(submission => {
        if (!userStats[submission.username]) {
          userStats[submission.username] = {
            username: submission.username,
            scores: [],
            attempts: 0
          };
        }
        userStats[submission.username].scores.push(submission.score);
        userStats[submission.username].attempts += 1;
      });

      leaderboards[chapter] = Object.values(userStats)
        .map(stat => ({
          username: stat.username,
          avgPercentage: (stat.scores.reduce((a, b) => a + b, 0) / stat.scores.length).toFixed(2),
          bestScore: Math.max(...stat.scores),
          totalAttempts: stat.attempts
        }))
        .sort((a, b) => {
          if (b.avgPercentage !== a.avgPercentage) {
            return parseFloat(b.avgPercentage) - parseFloat(a.avgPercentage);
          }
          return b.bestScore - a.bestScore;
        })
        .slice(0, limit)
        .map((entry, index) => ({
          rank: index + 1,
          ...entry
        }));
    });

    return leaderboards;
  } catch (error) {
    console.error('[getChapterLeaderboards] Unexpected error:', error);
    return {};
  }
}
