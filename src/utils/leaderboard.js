import { supabase } from './supabase';

/**
 * Get leaderboard data ranked by average percentage score
 * @param {string} subject - The subject to get leaderboard for
 * @param {string|null} chapter - Optional chapter filter (null for subject-wide)
 * @param {number} limit - Number of top users to return (default: 25)
 * @returns {Promise<Array>} Array of leaderboard entries with rank, username, avgPercentage, attempts, bestScore
 */
export async function getLeaderboardData(subject, chapter = null, limit = 25) {
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
        avgPercentage: (stat.scores.reduce((a, b) => a + b, 0) / stat.scores.length).toFixed(2),
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
    let query = supabase
      .from('quiz_submissions')
      .select('username, score')
      .eq('subject', subject);

    if (chapter) {
      query = query.eq('chapter', chapter);
    }

    const { data: submissions, error } = await query;

    if (error) {
      console.error('[getUserRank] Error fetching submissions:', error);
      return null;
    }

    if (!submissions || submissions.length === 0) {
      return null;
    }

    // Group by username and calculate statistics
    const userStats = {};
    submissions.forEach(submission => {
      if (!userStats[submission.username]) {
        userStats[submission.username] = {
          username: submission.username,
          scores: []
        };
      }
      userStats[submission.username].scores.push(submission.score);
    });

    // Convert to array and calculate aggregate metrics
    const allUsers = Object.values(userStats)
      .map(stat => ({
        username: stat.username,
        avgPercentage: (stat.scores.reduce((a, b) => a + b, 0) / stat.scores.length).toFixed(2),
        bestScore: Math.max(...stat.scores)
      }))
      .sort((a, b) => {
        // Sort by average percentage (descending)
        if (b.avgPercentage !== a.avgPercentage) {
          return parseFloat(b.avgPercentage) - parseFloat(a.avgPercentage);
        }
        // Tie-breaker: best score
        return b.bestScore - a.bestScore;
      });

    // Find user's rank
    const userIndex = allUsers.findIndex(u => u.username === username);

    if (userIndex === -1) {
      return null; // User has no submissions
    }

    return {
      rank: userIndex + 1,
      username: allUsers[userIndex].username,
      avgPercentage: allUsers[userIndex].avgPercentage,
      bestScore: allUsers[userIndex].bestScore,
      totalUsers: allUsers.length
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
