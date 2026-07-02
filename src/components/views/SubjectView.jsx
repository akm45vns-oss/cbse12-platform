import { memo, useState, useEffect, useCallback, useMemo } from "react";
import { CURRICULUM } from "../../constants/curriculum";
import { addBookmark, removeBookmark, isBookmarked } from "../../utils/bookmarks";
import { recordChapterAccess } from "../../utils/recentChapters";

const CheckIcon = ({ filled, color = "#10b981" }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="6.5" stroke={filled ? color : "#cbd5e1"} fill={filled ? color : "none"} strokeWidth="1.5"/>
    {filled && <path d="M4 7l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>}
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
    style={{ transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)", transform: open ? "rotate(180deg)" : "rotate(0deg)", color: "var(--text-tertiary)" }}>
    <path d="M6 9l6 6 6-6"/>
  </svg>
);

// ── Single Unit Accordion ──────────────────────────────────
function UnitGroup({ unit, unitIndex, subject, curriculum, progress, stats, isDefaultOpen, onChapterClick, onNotesClick, onQuizClick }) {
  const [open, setOpen] = useState(isDefaultOpen);
  const D = curriculum[subject];
  const subjectStats = stats.bySubject[subject];
  const allChapterCount = D?.units.flatMap(u => u.chapters).length || 1;
  // Count done chapters in this unit
  const donePairs = unit.chapters.filter(ch => {
    const nk = `${subject}||${ch}||notes`; const qk = `${subject}||${ch}||quiz`;
    return progress[nk]?.read && progress[qk]?.best !== undefined;
  });
  const unitPct = Math.round((donePairs.length / unit.chapters.length) * 100);

  // Sequential chapter number base (chapters before this unit)
  const prevCount = D?.units.slice(0, unitIndex).reduce((a, u) => a + u.chapters.length, 0) || 0;

  return (
    <div className="unit-group" style={{ marginBottom: 10 }}>
      {/* Header */}
      <button className="unit-group-header" onClick={() => setOpen(o => !o)}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {unit.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
            <div style={{ flex: 1, maxWidth: 80, height: 4, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${unitPct}%`, background: D?.accent || "#4f46e5", borderRadius: 99, transition: "width 0.4s" }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: unitPct === 100 ? "#10b981" : "var(--text-tertiary)" }}>
              {donePairs.length}/{unit.chapters.length}
            </span>
          </div>
        </div>
        <ChevronIcon open={open} />
      </button>

      {/* Body */}
      {open && (
        <div>
          {unit.chapters.map((ch, ci) => {
            const nk = `${subject}||${ch}||notes`;
            const qk = `${subject}||${ch}||quiz`;
            const nRead = progress[nk]?.read;
            const qBest = progress[qk]?.best;
            const chNum = prevCount + ci + 1;
            const fullyDone = nRead && qBest !== undefined;
            return (
              <button
                key={ci}
                className="chapter-row-item"
                onClick={() => onChapterClick(ch)}
              >
                {/* Number circle */}
                <div style={{
                  width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                  background: fullyDone ? "#10b981" : nRead ? "#ede9fe" : "var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800,
                  color: fullyDone ? "white" : nRead ? "#4f46e5" : "var(--text-tertiary)",
                }}>
                  {fullyDone ? "✓" : chNum}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {ch}
                  </div>
                  {/* Quick action pills */}
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <button
                      onClick={e => { e.stopPropagation(); onNotesClick(e, ch); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 3,
                        background: nRead ? "#ecfdf5" : "transparent",
                        border: `1px solid ${nRead ? "#10b981" : "var(--border)"}`,
                        borderRadius: 99, padding: "2px 8px",
                        fontSize: 10, fontWeight: 700,
                        color: nRead ? "#059669" : "var(--text-tertiary)",
                        cursor: "pointer",
                      }}>
                      <CheckIcon filled={!!nRead} color="#10b981" />
                      Notes
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); onQuizClick(e, ch); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 3,
                        background: qBest !== undefined ? "#eff6ff" : "transparent",
                        border: `1px solid ${qBest !== undefined ? "#3b82f6" : "var(--border)"}`,
                        borderRadius: 99, padding: "2px 8px",
                        fontSize: 10, fontWeight: 700,
                        color: qBest !== undefined ? "#2563eb" : "var(--text-tertiary)",
                        cursor: "pointer",
                      }}>
                      <CheckIcon filled={qBest !== undefined} color="#3b82f6" />
                      {qBest !== undefined ? `${qBest}/30` : "Quiz"}
                    </button>
                  </div>
                </div>

                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────
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

  // Find index of the first in-progress unit (has ≥1 note read but not fully done)
  const defaultOpenUnit = useMemo(() => {
    let found = 0;
    for (let i = 0; i < S.units.length; i++) {
      const unit = S.units[i];
      const anyStarted = unit.chapters.some(ch => progress[`${subject}||${ch}||notes`]?.read);
      const allDone = unit.chapters.every(ch => progress[`${subject}||${ch}||notes`]?.read && progress[`${subject}||${ch}||quiz`]?.best !== undefined);
      if (anyStarted && !allDone) { found = i; break; }
      // If no progress yet, open first unit
    }
    return found;
  }, [S, subject, progress]);

  const handleSelectChapter = useCallback((chapter) => {
    recordChapterAccess(username, subject, chapter);
    onSelectChapter(chapter);
  }, [username, subject, onSelectChapter]);

  const handleNotesClick = useCallback((e, chapter) => {
    e.stopPropagation();
    recordChapterAccess(username, subject, chapter);
    onSelectChapter(chapter, "notes");
  }, [username, subject, onSelectChapter]);

  const handleQuizClick = useCallback((e, chapter) => {
    e.stopPropagation();
    recordChapterAccess(username, subject, chapter);
    onSelectChapter(chapter, "quiz");
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
          Curriculum · {S.units.length} units
        </div>
        <button onClick={onGeneratePaper}
          style={{ background: "none", border: "none", color: "var(--primary)", fontSize: 12, fontWeight: 800, cursor: "pointer", padding: 0 }}>
          Sample Paper →
        </button>
      </div>

      {/* ── Collapsible Unit Groups ── */}
      {S.units.map((unit, ui) => (
        <UnitGroup
          key={ui}
          unit={unit}
          unitIndex={ui}
          subject={subject}
          curriculum={curriculum}
          progress={progress}
          stats={stats}
          isDefaultOpen={ui === defaultOpenUnit}
          onChapterClick={handleSelectChapter}
          onNotesClick={handleNotesClick}
          onQuizClick={handleQuizClick}
        />
      ))}

    </div>
  );
});
