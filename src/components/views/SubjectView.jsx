import { memo, useState, useEffect, useCallback, useMemo } from "react";
import { CURRICULUM } from "../../constants/curriculum";
import { addBookmark, removeBookmark, isBookmarked } from "../../utils/bookmarks";
import { recordChapterAccess } from "../../utils/recentChapters";

export const SubjectView = memo(function SubjectView({
  subject, stats, progress, onSelectChapter, onGeneratePaper, curriculum, username, selectedClass
}) {
  const S = curriculum[subject];
  const D = CURRICULUM[subject] || S;
  const subjectStats = stats.bySubject[subject];
  const totalChaps = subjectStats?.t || 0;
  const completedNotes = subjectStats?.n || 0;
  const completedQuiz = subjectStats?.q || 0;
  const doneChapters = Math.min(completedNotes, completedQuiz);
  const completedPct = totalChaps > 0 ? Math.round(((completedNotes + completedQuiz) / (totalChaps * 2)) * 100) : 0;

  const allChapters = useMemo(() => S.units.flatMap(u => u.chapters), [S]);

  const handleSelectChapter = useCallback((chapter) => {
    recordChapterAccess(username, subject, chapter);
    onSelectChapter(chapter);
  }, [username, subject, onSelectChapter]);

  return (
    <div style={{ animation: "fadeInUp 0.35s cubic-bezier(0.4,0,0.2,1)" }}>

      {/* ── Mastery Progress Card ── */}
      <div className="mastery-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: "var(--text-primary)", marginBottom: 2 }}>{subject}</div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600 }}>Class {selectedClass || "12"} · CBSE</div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
            {D?.emoji || "📚"}
          </div>
        </div>
        <div className="progress-track" style={{ height: 7, marginBottom: 8 }}>
          <div className="progress-fill" style={{ width: `${completedPct}%`, background: D?.accent || "#4f46e5" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: D?.accent || "#4f46e5" }}>{completedPct}% Completed</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)" }}>{doneChapters} / {totalChaps} chapters</span>
        </div>
      </div>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Chapters · {allChapters.length} total
        </div>
        <button onClick={onGeneratePaper}
          style={{ background: "none", border: "none", color: "var(--primary)", fontSize: 12, fontWeight: 800, cursor: "pointer", padding: 0 }}>
          Sample Paper →
        </button>
      </div>

      {/* ── Flat list of Chapters ── */}
      <div className="subj-ch-grid" style={{ gap: 10 }}>
        {allChapters.map((ch, ci) => {
          const nk = `${subject}||${ch}||notes`;
          const qk = `${subject}||${ch}||quiz`;
          const nRead = progress[nk]?.read;
          const qBest = progress[qk]?.best;
          const chNum = ci + 1;
          const fullyDone = nRead && qBest !== undefined;
          const isActive = ci === doneChapters;

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
              {/* Number circle or checkmark */}
              <div
                style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  background: fullyDone ? "#10b981" : nRead ? "#ede9fe" : "var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 800,
                  color: fullyDone ? "white" : nRead ? "#4f46e5" : "var(--text-tertiary)",
                }}
              >
                {fullyDone ? "✓" : chNum}
              </div>

              {/* Text content */}
              <div style={{ flex: 1, minWidth: 0, paddingLeft: 10 }}>
                <div style={{
                  fontSize: 14, fontWeight: 700, color: "var(--text-primary)",
                  textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {ch}
                </div>
              </div>

              {/* Right arrow */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          );
        })}
      </div>

    </div>
  );
});
