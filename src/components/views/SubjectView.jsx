import { ProgressBar } from "../common";
import { CURRICULUM } from "../../constants/curriculum";
import { useState, useEffect } from "react";
import { addBookmark, removeBookmark, isBookmarked } from "../../utils/bookmarks";
import { recordChapterAccess } from "../../utils/recentChapters";

export function SubjectView({ subject, stats, progress, onSelectChapter, onGeneratePaper, curriculum, username }) {
  const S = curriculum[subject];
  const [bookmarks, setBookmarks] = useState({});

  useEffect(() => {
    const newBookmarks = {};
    S.units.forEach(unit => {
      unit.chapters.forEach(ch => {
        newBookmarks[ch] = isBookmarked(subject, ch);
      });
    });
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

  // Navigate to Notes view directly
  const handleNotesClick = (e, chapter) => {
    e.stopPropagation();
    recordChapterAccess(username, subject, chapter);
    onSelectChapter(chapter, 'notes');
  };

  // Navigate to Quiz view directly
  const handleQuizClick = (e, chapter) => {
    e.stopPropagation();
    recordChapterAccess(username, subject, chapter);
    onSelectChapter(chapter, 'quiz');
  };
  
  return (
    <div>
      {/* Subject Hero Banner */}
      <div style={{
        background: S.gradient,
        borderRadius: 28,
        padding: "clamp(24px, 5vw, 40px)",
        marginBottom: 36,
        color: "white",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        border: "1px solid rgba(255,255,255,0.15)"
      }}>
        <div style={{ position: "absolute", right: -60, top: -60, width: 200, height: 200, background: "rgba(255,255,255,0.07)", borderRadius: "50%", filter: "blur(30px)" }} />
        <div style={{ position: "absolute", left: "30%", bottom: -40, width: 160, height: 160, background: "rgba(255,255,255,0.05)", borderRadius: "50%", filter: "blur(40px)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: "clamp(44px,6vw,56px)", marginBottom: 12, filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.3))" }}>{S.emoji}</div>
          <h1 style={{ fontSize: "clamp(26px,5vw,36px)", fontWeight: 900, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2 }}>{subject}</h1>
          <p style={{ opacity: 0.85, marginTop: 10, fontSize: "clamp(13px,2vw,15px)", fontWeight: 500 }}>
            AkmEdu45 · {S.units.length} Units · {stats.bySubject[subject].t} Chapters
          </p>
          <button onClick={onGeneratePaper}
            style={{
              marginTop: 20,
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(12px)",
              border: "1.5px solid rgba(255,255,255,0.3)",
              borderRadius: 12,
              padding: "11px 22px",
              color: "white",
              fontWeight: 700,
              fontSize: 14,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              cursor: "pointer"
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.25)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "translateY(0)"; }}>
            📄 Generate Sample Board Paper →
          </button>
        </div>
      </div>

      {/* Units & Chapters */}
      {S.units.map((unit, ui) => (
        <div key={ui} style={{ marginBottom: 36 }}>
          <h3 style={{
            fontSize: "clamp(11px,2vw,13px)",
            fontWeight: 900,
            color: "#3b82f6",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 12
          }}>
            <span style={{
              background: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.25)",
              borderRadius: 8,
              padding: "5px 16px",
              fontWeight: 800
            }}>{unit.name}</span>
            <span style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
          </h3>
          <div className="subj-ch-grid">
            {unit.chapters.map((ch, ci) => {
              const nk = `${subject}||${ch}||notes`;
              const qk = `${subject}||${ch}||quiz`;
              const nRead = progress[nk]?.read;
              const qData = progress[qk];
              const best = qData?.best;
              const isDone = nRead && best !== undefined;
              return (
                <button key={ci} onClick={() => handleSelectChapter(ch)}
                  style={{
                    background: "rgba(255, 255, 255, 0.75)",
                    backdropFilter: "blur(20px)",
                    border: `1px solid ${isDone ? "rgba(59, 130, 246, 0.35)" : "rgba(0, 0, 0, 0.05)"}`,
                    borderRadius: 18,
                    padding: "18px 20px",
                    textAlign: "left",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                    boxShadow: isDone ? "0 8px 24px rgba(59, 130, 246, 0.15)" : "0 4px 16px rgba(148,163,184,0.1)",
                    position: "relative"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.4)";
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 16px 40px rgba(148,163,184,0.3)";
                    e.currentTarget.style.background = "rgba(255, 255, 255, 1)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = isDone ? "rgba(59, 130, 246, 0.35)" : "rgba(0, 0, 0, 0.05)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = isDone ? "0 8px 24px rgba(59, 130, 246, 0.15)" : "0 4px 16px rgba(148,163,184,0.1)";
                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.75)";
                  }}>
                  
                  {/* Bookmark */}
                  <button
                    onClick={(e) => handleBookmarkClick(e, ch)}
                    style={{
                      position: "absolute", top: 14, right: 14,
                      background: "none", border: "none",
                      fontSize: 16, cursor: "pointer",
                      padding: 4, transition: "transform 0.2s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.3)")}
                    onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                  >
                    {bookmarks[ch] ? "❤️" : "🤍"}
                  </button>

                  <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 14, lineHeight: 1.5, marginBottom: 12, paddingRight: 28 }}>{ch}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    {/* Clickable Notes Button */}
                    <button onClick={(e) => handleNotesClick(e, ch)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: nRead ? "rgba(59, 130, 246, 0.1)" : "transparent",
                        border: "1px solid " + (nRead ? "rgba(59, 130, 246, 0.3)" : "transparent"),
                        borderRadius: 8,
                        padding: "6px 12px",
                        cursor: "pointer",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = "rgba(59, 130, 246, 0.15)";
                        e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.4)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = nRead ? "rgba(59, 130, 246, 0.1)" : "transparent";
                        e.currentTarget.style.borderColor = nRead ? "rgba(59, 130, 246, 0.3)" : "transparent";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}>
                      <span style={{ fontSize: 13 }}>{nRead ? "📖" : "📄"}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: nRead ? "#3b82f6" : "#64748b" }}>{nRead ? "Read" : "Notes"}</span>
                    </button>

                    {/* Clickable Quiz Button */}
                    <button onClick={(e) => handleQuizClick(e, ch)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: best !== undefined ? "rgba(16, 185, 129, 0.1)" : "transparent",
                        border: "1px solid " + (best !== undefined ? "rgba(16, 185, 129, 0.3)" : "transparent"),
                        borderRadius: 8,
                        padding: "6px 12px",
                        cursor: "pointer",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = "rgba(16, 185, 129, 0.15)";
                        e.currentTarget.style.borderColor = "rgba(16, 185, 129, 0.4)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = best !== undefined ? "rgba(16, 185, 129, 0.1)" : "transparent";
                        e.currentTarget.style.borderColor = best !== undefined ? "rgba(16, 185, 129, 0.3)" : "transparent";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}>
                      <span style={{ fontSize: 13 }}>{best !== undefined ? "✅" : "❓"}</span>
                      {best !== undefined ? (
                        <span style={{ fontSize: 12, fontWeight: 800, color: "#059669" }}>{best}/30</span>
                      ) : (
                        <span style={{ fontSize: 12, color: "#64748b" }}>Quiz</span>
                      )}
                    </button>
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
