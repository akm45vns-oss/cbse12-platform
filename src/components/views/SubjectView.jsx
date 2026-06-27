import { memo, useState, useEffect } from "react";
import { CURRICULUM } from "../../constants/curriculum";
import { addBookmark, removeBookmark, isBookmarked } from "../../utils/bookmarks";
import { recordChapterAccess } from "../../utils/recentChapters";

// Status check icon
const CheckIcon = ({ filled, color = "#10b981" }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="6.5" stroke={filled ? color : "#cbd5e1"} fill={filled ? color : "none"} strokeWidth="1.5"/>
    {filled && <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>}
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>
);

export const SubjectView = memo(function SubjectView({
  subject, stats, progress, onSelectChapter, onGeneratePaper, curriculum, username, selectedClass
}) {
  const S = curriculum[subject];
  const [bookmarks, setBookmarks] = useState({});
  const subjectStats = stats.bySubject[subject];
  const totalChaps = subjectStats?.t || 0;
  const completedNotes = subjectStats?.n || 0;
  const completedQuiz = subjectStats?.q || 0;
  const doneChapters = Math.min(completedNotes, completedQuiz);
  const completedPct = totalChaps > 0 ? Math.round(((completedNotes + completedQuiz) / (totalChaps * 2)) * 100) : 0;
  const D = CURRICULUM[subject];

  useEffect(() => {
    const nb = {};
    S.units.forEach(unit => unit.chapters.forEach(ch => { nb[ch] = isBookmarked(subject, ch); }));
    setBookmarks(nb);
  }, [subject]);

  const handleSelectChapter = (chapter) => {
    recordChapterAccess(username, subject, chapter);
    onSelectChapter(chapter);
  };
  const handleNotesClick = (e, chapter) => {
    e.stopPropagation();
    recordChapterAccess(username, subject, chapter);
    onSelectChapter(chapter, "notes");
  };
  const handleQuizClick = (e, chapter) => {
    e.stopPropagation();
    recordChapterAccess(username, subject, chapter);
    onSelectChapter(chapter, "quiz");
  };
  const handleBookmark = (e, chapter) => {
    e.stopPropagation();
    if (bookmarks[chapter]) { removeBookmark(subject, chapter); setBookmarks(p => ({ ...p, [chapter]: false })); }
    else { addBookmark(subject, chapter); setBookmarks(p => ({ ...p, [chapter]: true })); }
  };

  // Flatten all chapters for sequential numbering
  const allChapters = S.units.flatMap(u => u.chapters);

  return (
    <div style={{ animation: "fadeInUp 0.4s cubic-bezier(0.4,0,0.2,1)" }}>

      {/* ── Mastery Progress Card ── */}
      <div className="mastery-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 2 }}>Mastery Progress</div>
            <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>Class {selectedClass || "12"} · {S.units.length > 3 ? "Science" : "Commerce"} Stream</div>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "#ede9fe", color: "#4f46e5",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
          }}>
            📚
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-track" style={{ height: 8, marginBottom: 10 }}>
          <div className="progress-fill" style={{ width: `${completedPct}%` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#4f46e5" }}>{completedPct}% Completed</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>{doneChapters} / {totalChaps} Chapters</span>
        </div>
      </div>

      {/* ── Curriculum ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: 0 }}>Curriculum</h2>
        <button
          onClick={onGeneratePaper}
          style={{ background: "none", border: "none", color: "#4f46e5", fontSize: 13, fontWeight: 700, cursor: "pointer", padding: 0 }}
        >
          Sample Paper →
        </button>
      </div>

      <div className="subj-ch-grid" style={{ gap: 10 }}>
        {allChapters.map((ch, ci) => {
          const nk = `${subject}||${ch}||notes`;
          const qk = `${subject}||${ch}||quiz`;
          const nRead = progress[nk]?.read;
          const qData = progress[qk];
          const best = qData?.best;
          const isActive = ci === doneChapters; // current chapter

          return (
            <button
              key={ci}
              className={`curriculum-row${isActive ? " active-chapter" : ""}`}
              onClick={() => handleSelectChapter(ch)}
              style={{
                cursor: "pointer",
                border: "none",
              }}
            >
              {/* Icon */}
              <div
                className="chapter-icon-box"
                style={{
                  background: nRead && best !== undefined ? "#ede9fe" : "#f8f8ff",
                  color: nRead && best !== undefined ? "#4f46e5" : "#94a3b8",
                }}
              >
                <span style={{ fontSize: 18 }}>{D.emoji}</span>
              </div>

              {/* Text content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 15, fontWeight: 700, color: "#0f172a",
                  marginBottom: 4, textAlign: "left",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {ch}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    onClick={(e) => handleNotesClick(e, ch)}
                    style={{
                      background: "none", border: "none", padding: 0, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 4,
                    }}
                  >
                    <CheckIcon filled={!!nRead} color="#10b981" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: nRead ? "#10b981" : "#94a3b8" }}>Read</span>
                  </button>
                  <button
                    onClick={(e) => handleQuizClick(e, ch)}
                    style={{
                      background: "none", border: "none", padding: 0, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 4,
                    }}
                  >
                    <CheckIcon filled={best !== undefined} color="#10b981" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: best !== undefined ? "#10b981" : "#94a3b8" }}>Practice</span>
                  </button>
                </div>
              </div>

              {/* Right: arrow */}
              <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </button>
          );
        })}
      </div>

    </div>
  );
});
