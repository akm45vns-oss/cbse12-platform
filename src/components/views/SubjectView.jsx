import { ProgressBar } from "../common";
import { CURRICULUM } from "../../constants/curriculum";
import { useState, useEffect } from "react";
import { addBookmark, removeBookmark, isBookmarked } from "../../utils/bookmarks";
import { recordChapterAccess } from "../../utils/recentChapters";

export function SubjectView({ subject, stats, progress, onSelectChapter, onGeneratePaper, curriculum, username }) {
  const S = curriculum[subject];
  const [bookmarks, setBookmarks] = useState({});

  // Load bookmark states
  useEffect(() => {
    const newBookmarks = {};
    S.units.forEach(unit => {
      unit.chapters.forEach(ch => {
        newBookmarks[ch] = isBookmarked(subject, ch);
      });
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBookmarks(newBookmarks);
  }, [subject]);

  const handleBookmarkClick = (e, chapter) => {
    e.stopPropagation();
    if (bookmarks[chapter]) {
      removeBookmark(subject, chapter);
      setBookmarks(prev => ({ ...prev, [chapter]: false }));
    } else {
      addBookmark(subject, chapter);
      setBookmarks(prev => ({ ...prev, [chapter]: true }));
    }
  };

  const handleSelectChapter = (chapter) => {
    recordChapterAccess(username, subject, chapter);
    onSelectChapter(chapter);
  };
  
  return (
    <div>
      <div style={{ background: S.gradient, borderRadius: 24, padding: "clamp(20px, 5vw, 32px)", marginBottom: 32, color: "white", position: "relative", overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ position: "absolute", right: -40, top: -40, width: 140, height: 140, background: "rgba(255,255,255,0.1)", borderRadius: "50%", zIndex: 0 }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: "clamp(40px, 6vw, 48px)", marginBottom: 10 }}>{S.emoji}</div>
          <h1 style={{ fontSize: "clamp(26px, 5vw, 32px)", fontWeight: 900, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2 }}>{subject}</h1>
          <p style={{ opacity: 0.85, marginTop: 8, fontSize: "clamp(13px, 2vw, 15px)", fontWeight: 500 }}>AkmEdu • {S.units.length} Units • {stats.bySubject[subject].t} Chapters</p>
          <button onClick={onGeneratePaper}
            style={{ marginTop: 18, background: "linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.15))", border: "1.5px solid rgba(255,255,255,0.3)", borderRadius: 12, padding: "11px 22px", color: "white", fontWeight: 700, fontSize: 14, transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", backdropFilter: "blur(10px)", cursor: "pointer" }}
            onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0.25))"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.15))"; e.currentTarget.style.transform = "translateY(0)"; }}>
            📄 Generate Sample Board Paper →
          </button>
        </div>
      </div>

      {S.units.map((unit, ui) => (
        <div key={ui} style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: "clamp(12px, 2vw, 14px)", fontWeight: 900, color: S.text, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ background: "linear-gradient(135deg, " + S.light + ", " + S.light + "cc)", border: `1.5px solid ${S.border}`, borderRadius: 8, padding: "4px 14px", fontWeight: 800 }}>{unit.name}</span>
            <span style={{ flex: 1, height: 1, background: S.border, opacity: 0.3 }} />
          </h3>
          <div className="subj-ch-grid">
            {unit.chapters.map((ch, ci) => {
              const nk = `${subject}||${ch}||notes`;
              const qk = `${subject}||${ch}||quiz`;
              const nRead = progress[nk]?.read;
              const qData = progress[qk];
              const best = qData?.best;
              return (
                <button key={ci} onClick={() => handleSelectChapter(ch)}
                  style={{ background: "white", border: `1.5px solid ${nRead && best !== undefined ? S.accent : "#dbeafe"}`, borderRadius: 16, padding: "16px 18px", textAlign: "left", transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)", cursor: "pointer", boxShadow: nRead && best !== undefined ? `0 4px 16px ${S.accent}20` : "0 2px 8px rgba(8,145,178,0.08)", position: "relative" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = S.accent; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${S.accent}30`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = nRead && best !== undefined ? S.accent : "#dbeafe"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = nRead && best !== undefined ? `0 4px 16px ${S.accent}20` : "0 2px 8px rgba(8,145,178,0.08)"; }}>
                  
                  {/* Bookmark Button */}
                  <button
                    onClick={(e) => handleBookmarkClick(e, ch)}
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      background: "none",
                      border: "none",
                      fontSize: 18,
                      cursor: "pointer",
                      padding: 4,
                      transition: "transform 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  >
                    {bookmarks[ch] ? "❤️" : "🤍"}
                  </button>

                  <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 14, lineHeight: 1.5, marginBottom: 10, paddingRight: 24 }}>{ch}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14 }}>{nRead ? "📖" : "📄"}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: nRead ? S.accent : "#94a3b8" }}>{nRead ? "Read" : "Notes"}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14 }}>{best !== undefined ? "✅" : "❓"}</span>
                      {best !== undefined ? (
                        <span style={{ fontSize: 12, fontWeight: 700, color: S.text }}>{best}/50</span>
                      ) : (
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>Quiz</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
