// ===== BOOKMARKS MANAGEMENT =====
export function addBookmark(subject, chapter) {
  try {
    const bookmarks = getBookmarks();
    const id = `${subject}||${chapter}`;
    if (!bookmarks.find(b => b.id === id)) {
      bookmarks.push({ id, subject, chapter, dateAdded: Date.now() });
      localStorage.setItem("akmedu_bookmarks", JSON.stringify(bookmarks));
    }
    return bookmarks;
  } catch (e) {
    console.warn("Failed to add bookmark:", e);
    return [];
  }
}

export function removeBookmark(subject, chapter) {
  try {
    const bookmarks = getBookmarks();
    const filtered = bookmarks.filter(b => !(b.subject === subject && b.chapter === chapter));
    localStorage.setItem("akmedu_bookmarks", JSON.stringify(filtered));
    return filtered;
  } catch (e) {
    console.warn("Failed to remove bookmark:", e);
    return [];
  }
}

export function getBookmarks() {
  try {
    const saved = localStorage.getItem("akmedu_bookmarks");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function isBookmarked(subject, chapter) {
  const bookmarks = getBookmarks();
  return bookmarks.some(b => b.subject === subject && b.chapter === chapter);
}

export function clearAllBookmarks() {
  try {
    localStorage.removeItem("akmedu_bookmarks");
  } catch (e) {
    console.warn("Failed to clear bookmarks:", e);
  }
}
