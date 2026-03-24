// ===== LOGIN STREAK TRACKING =====

export function recordDailyActivity() {
  try {
    const streak = getLoginStreak();
    const today = new Date().toDateString();
    
    if (streak.lastDate === today) {
      // Already recorded today
      return streak;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    // Check if last activity was yesterday (consecutive)
    if (streak.lastDate === yesterdayStr) {
      // Continue the streak
      const newStreak = {
        current: streak.current + 1,
        best: Math.max(streak.best, streak.current + 1),
        lastDate: today,
        dates: [...streak.dates, today],
      };
      localStorage.setItem("akmedu_login_streak", JSON.stringify(newStreak));
      return newStreak;
    } else {
      // Start new streak
      const newStreak = {
        current: 1,
        best: Math.max(streak.best, 1),
        lastDate: today,
        dates: [today],
      };
      localStorage.setItem("akmedu_login_streak", JSON.stringify(newStreak));
      return newStreak;
    }
  } catch (e) {
    console.warn("Failed to record daily activity:", e);
    return { current: 0, best: 0, lastDate: null, dates: [] };
  }
}

export function getLoginStreak() {
  try {
    const saved = localStorage.getItem("akmedu_login_streak");
    return saved ? JSON.parse(saved) : { current: 0, best: 0, lastDate: null, dates: [] };
  } catch {
    return { current: 0, best: 0, lastDate: null, dates: [] };
  }
}

export function isStreakAlive() {
  const streak = getLoginStreak();
  if (!streak.lastDate) return false;

  const lastDate = new Date(streak.lastDate);
  const today = new Date();
  const diffTime = today - lastDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Streak is alive if last activity was today or yesterday
  return diffDays <= 1;
}

export function getStreakStatus() {
  const streak = getLoginStreak();
  const alive = isStreakAlive();

  if (!alive && streak.current > 0) {
    // Streak lost
    return {
      status: "lost",
      message: `Streak lost! Your best was ${streak.best} days 🔥`,
      current: 0,
      best: streak.best,
    };
  }

  return {
    status: "active",
    message: streak.current > 0 ? null : "Start your first streak today! 🔥",
    current: streak.current,
    best: streak.best,
  };
}

export function resetStreak() {
  try {
    localStorage.setItem("akmedu_login_streak", JSON.stringify({ current: 0, best: 0, lastDate: null, dates: [] }));
  } catch (e) {
    console.warn("Failed to reset streak:", e);
  }
}

export function getStreakDates(days = 30) {
  const streak = getLoginStreak();
  const today = new Date();
  const dates = {};

  // Create 30-day calendar
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toDateString();
    dates[dateStr] = streak.dates.includes(dateStr);
  }

  return dates;
}
