/**
 * Advanced Analytics Engine
 * Computes deeper insights from existing data sources:
 * - localStorage: session history, quiz submissions, login streaks
 * - useProgress hook: chapter progress
 * - weakTopics utility: topic analysis
 */

/**
 * Get subject-wise quiz performance
 * Returns: { subject: { avgScore, attempts, accuracy%, bestScore } }
 */
export function getSubjectPerformance() {
  try {
    const submissions = JSON.parse(
      localStorage.getItem("akmedu_quiz_submissions") || "[]"
    );

    const bySubject = {};

    submissions.forEach((sub) => {
      if (!bySubject[sub.subject]) {
        bySubject[sub.subject] = {
          scores: [],
          attempts: 0,
          correctCount: 0,
        };
      }
      bySubject[sub.subject].scores.push(sub.score || 0);
      bySubject[sub.subject].attempts++;
      bySubject[sub.subject].correctCount += sub.score || 0;
    });

    const result = {};
    Object.entries(bySubject).forEach(([subject, data]) => {
      const avgScore = (
        data.scores.reduce((a, b) => a + b, 0) / data.scores.length
      ).toFixed(1);
      const accuracy = ((data.correctCount / (data.attempts * 30)) * 100).toFixed(
        1
      );
      result[subject] = {
        avgScore: parseFloat(avgScore),
        attempts: data.attempts,
        accuracy: parseFloat(accuracy),
        bestScore: Math.max(...data.scores),
      };
    });

    return result;
  } catch (e) {
    console.error("Error in getSubjectPerformance:", e);
    return {};
  }
}

/**
 * Get top weak and strong topics
 * Returns: { weakTopics: [...], strongTopics: [...] }
 */
export function getTopicMastery() {
  try {
    const submissions = JSON.parse(
      localStorage.getItem("akmedu_quiz_submissions") || "[]"
    );

    const topicStats = {};

    submissions.forEach((sub) => {
      if (sub.wrongTopics) {
        sub.wrongTopics.forEach((topic) => {
          if (!topicStats[topic]) {
            topicStats[topic] = { correct: 0, wrong: 0 };
          }
          topicStats[topic].wrong++;
        });
      }
      // Infer correct topics (done answers)
      if (sub.score && sub.wrongTopics) {
        const correctCount = sub.score;
        if (correctCount > 0) {
          topicStats[`correct_${sub.subject}`] = {
            correct: (topicStats[`correct_${sub.subject}`]?.correct || 0) + 1,
            wrong: 0,
          };
        }
      }
    });

    // Calculate accuracy per topic
    const topicAccuracy = Object.entries(topicStats).map(([topic, stats]) => {
      const total = stats.correct + stats.wrong;
      return {
        topic: topic.replace("correct_", ""),
        accuracy: total > 0 ? ((stats.correct / total) * 100).toFixed(1) : 0,
        mistakeCount: stats.wrong,
        correctCount: stats.correct,
      };
    });

    const sorted = topicAccuracy.sort(
      (a, b) => b.mistakeCount - a.mistakeCount
    );

    return {
      weakTopics: sorted.slice(0, 5),
      strongTopics: sorted
        .filter((t) => parseFloat(t.accuracy) >= 70)
        .slice(0, 5),
    };
  } catch (e) {
    console.error("Error in getTopicMastery:", e);
    return { weakTopics: [], strongTopics: [] };
  }
}

/**
 * Get study time trends by subject and time patterns
 * Returns: { bySubject: {...}, peakHours: [...], dailyActivity: [...] }
 */
export function getStudyTrends(progressData) {
  try {
    const sessions = JSON.parse(
      localStorage.getItem("akmedu_sessions_history") || "[]"
    );

    // 1. Time by subject
    const timeBySubject = {};
    sessions.forEach((session) => {
      if (!timeBySubject[session.subject]) {
        timeBySubject[session.subject] = 0;
      }
      timeBySubject[session.subject] += session.duration || 0;
    });

    // 2. Peak hours (which hours user studies most)
    const hourlyStats = Array(24).fill(0);
    sessions.forEach((session) => {
      if (session.startTime) {
        const hour = new Date(session.startTime).getHours();
        hourlyStats[hour]++;
      }
    });

    const peakHours = hourlyStats.map((count, hour) => ({
      hour,
      sessions: count,
      time: `${hour}:00`,
    }));

    // 3. Daily activity (Mon-Sun)
    const dailyStats = Array(7).fill(0);
    sessions.forEach((session) => {
      if (session.startTime) {
        const day = new Date(session.startTime).getDay();
        dailyStats[day]++;
      }
    });

    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dailyActivity = dailyStats.map((count, day) => ({
      day: dayNames[day],
      dayNum: day,
      sessions: count,
    }));

    return {
      bySubject: timeBySubject,
      peakHours,
      dailyActivity,
    };
  } catch (e) {
    console.error("Error in getStudyTrends:", e);
    return { bySubject: {}, peakHours: [], dailyActivity: [] };
  }
}

/**
 * Get personalized insights and recommendations
 * Returns: { focusAreas, strengths, bestStudyTime, nextGoal }
 */
export function getPersonalizedInsights(progressData, weakTopics, performance) {
  try {
    const trends = getStudyTrends(progressData);

    // Find peak study hour
    const bestHour = trends.peakHours.reduce((prev, curr) =>
      curr.sessions > prev.sessions ? curr : prev
    );
    const bestTime = bestHour.hour ? `${bestHour.hour}:00 - ${bestHour.hour + 1}:00` : "N/A";

    // Best and worst subjects
    const subjects = Object.entries(performance)
      .sort(([, a], [, b]) => b.accuracy - a.accuracy);
    const bestSubject = subjects[0]?.[0] || "N/A";
    const worstSubject = subjects[subjects.length - 1]?.[0] || "N/A";

    // Calculate overall completion
    const totalChapters = Object.keys(progressData).length;
    const completedChapters = Object.keys(progressData).filter(
      (k) => progressData[k]?.read || false
    ).length;
    const overallCompletion = totalChapters
      ? ((completedChapters / totalChapters) * 100).toFixed(0)
      : 0;

    return {
      focusAreas: weakTopics.weakTopics.slice(0, 3),
      strengths: weakTopics.strongTopics.slice(0, 3),
      bestStudyTime: bestTime,
      bestSubject,
      worstSubject,
      overallCompletion: parseInt(overallCompletion),
      nextGoal:
        overallCompletion < 100
          ? `Complete all chapters (${completedChapters}/${totalChapters})`
          : "Master all weak topics",
    };
  } catch (e) {
    console.error("Error in getPersonalizedInsights:", e);
    return {
      focusAreas: [],
      strengths: [],
      bestStudyTime: "N/A",
      bestSubject: "N/A",
      worstSubject: "N/A",
      overallCompletion: 0,
      nextGoal: "Start studying",
    };
  }
}

/**
 * Get detailed quiz performance metrics
 */
export function getQuizPerformanceMetrics() {
  try {
    const submissions = JSON.parse(
      localStorage.getItem("akmedu_quiz_submissions") || "[]"
    );

    if (submissions.length === 0) {
      return {
        totalAttempts: 0,
        avgScore: 0,
        bestScore: 0,
        worstScore: 0,
        totalCorrect: 0,
        overallAccuracy: 0,
      };
    }

    const scores = submissions.map((s) => s.score || 0);
    const totalCorrect = scores.reduce((a, b) => a + b, 0);

    return {
      totalAttempts: submissions.length,
      avgScore: (totalCorrect / submissions.length).toFixed(1),
      bestScore: Math.max(...scores),
      worstScore: Math.min(...scores),
      totalCorrect,
      overallAccuracy: (
        (totalCorrect / (submissions.length * 30)) *
        100
      ).toFixed(1),
    };
  } catch (e) {
    console.error("Error in getQuizPerformanceMetrics:", e);
    return {
      totalAttempts: 0,
      avgScore: 0,
      bestScore: 0,
      worstScore: 0,
      totalCorrect: 0,
      overallAccuracy: 0,
    };
  }
}

/**
 * Get study session duration distribution
 */
export function getSessionMetrics() {
  try {
    const sessions = JSON.parse(
      localStorage.getItem("akmedu_sessions_history") || "[]"
    );

    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        avgSessionDuration: 0,
        totalTime: 0,
        shortestSession: 0,
        longestSession: 0,
      };
    }

    const durations = sessions.map((s) => s.duration || 0);
    const totalTime = durations.reduce((a, b) => a + b, 0);

    return {
      totalSessions: sessions.length,
      avgSessionDuration: (totalTime / sessions.length / 60000).toFixed(1), // minutes
      totalTime: (totalTime / 3600000).toFixed(1), // hours
      shortestSession: (Math.min(...durations) / 60000).toFixed(1) || 0,
      longestSession: (Math.max(...durations) / 60000).toFixed(1) || 0,
    };
  } catch (e) {
    console.error("Error in getSessionMetrics:", e);
    return {
      totalSessions: 0,
      avgSessionDuration: 0,
      totalTime: 0,
      shortestSession: 0,
      longestSession: 0,
    };
  }
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/**
 * Get performance categories for color-coding
 */
export function getPerformanceColor(accuracy) {
  const acc = parseFloat(accuracy);
  if (acc >= 80) return "#15803d"; // Green
  if (acc >= 60) return "#eab308"; // Yellow
  if (acc >= 40) return "#f97316"; // Orange
  return "#dc2626"; // Red
}

export function getPerformanceLabel(accuracy) {
  const acc = parseFloat(accuracy);
  if (acc >= 80) return "Mastered";
  if (acc >= 60) return "Strong";
  if (acc >= 40) return "In Progress";
  return "Needs Focus";
}
