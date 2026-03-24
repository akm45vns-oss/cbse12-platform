// ===== RECENT CHAPTERS TRACKING =====

export function recordChapterAccess(subject, chapter) {
  try {
    const recent = getRecentChapters();
    const id = `${subject}||${chapter}`;
    
    // Remove if already exists (to move it to top)
    const filtered = recent.filter(r => r.id !== id);
    
    // Add to beginning with timestamp
    const newRecent = [
      { id, subject, chapter, lastAccessed: Date.now() },
      ...filtered,
    ];
    
    // Keep only last 20
    localStorage.setItem("akmedu_recent_chapters", JSON.stringify(newRecent.slice(0, 20)));
    return newRecent.slice(0, 20);
  } catch (e) {
    console.warn("Failed to record chapter access:", e);
    return [];
  }
}

export function getRecentChapters(limit = 5) {
  try {
    const saved = localStorage.getItem("akmedu_recent_chapters");
    const all = saved ? JSON.parse(saved) : [];
    return all.slice(0, limit);
  } catch {
    return [];
  }
}

export function clearRecentChapters() {
  try {
    localStorage.removeItem("akmedu_recent_chapters");
  } catch (e) {
    console.warn("Failed to clear recent chapters:", e);
  }
}
