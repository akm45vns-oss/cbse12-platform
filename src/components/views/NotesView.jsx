import { LoadingScreen } from "../common";
import { useEffect, memo } from "react";
import { startSession, endSession } from "../../utils/sessionTracking";

export const NotesView = memo(function NotesView({
  subject, chapter, notes, loading, loadMsg, loadEmoji, onStartQuiz, curriculumData, onRegenerateNotes
}) {
  useEffect(() => {
    startSession(subject, chapter, "notes");
    return () => { endSession(true); };
  }, [subject, chapter]);

  // Enhanced markdown renderer matching new design (callout boxes, formula boxes, etc.)
  const renderNotes = (raw) => {
    if (!raw) return null;
    const elements = [];
    const lines = raw.split('\n');
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      if (line.startsWith('# ')) {
        elements.push(
          <div key={i} style={{ marginBottom: 4 }}>
            <h1>{line.slice(2)}</h1>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
              <span style={{
                display: "inline-block", background: "#ede9fe", color: "#4f46e5",
                fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 999, letterSpacing: "0.06em",
              }}>Class 12</span>
              <span style={{
                display: "inline-block", background: "#dbeafe", color: "#2563eb",
                fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 999, letterSpacing: "0.06em",
              }}>{subject}</span>
            </div>
          </div>
        );
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={i}>{line.slice(3)}</h2>);
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={i}>{line.slice(4)}</h3>);
      } else if (line.startsWith('---')) {
        elements.push(<hr key={i} />);
      } else if (line.startsWith('> ')) {
        // Blockquote → styled concept box
        elements.push(
          <div key={i} style={{
            borderLeft: "3px solid #06b6d4",
            background: "#ecfeff",
            borderRadius: "0 12px 12px 0",
            padding: "12px 16px",
            margin: "12px 0",
            color: "#164e63",
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#0891b2", letterSpacing: "0.08em", textTransform: "uppercase" }}>Concept: </span>
            <span style={{ fontStyle: "italic", fontSize: 14, fontWeight: 500 }}>{line.slice(2)}</span>
          </div>
        );
      } else if (line.toLowerCase().includes('formula') && (line.startsWith('##') || line.startsWith('**'))) {
        // Formula section → styled box
        elements.push(
          <div key={i} style={{
            background: "#f0fdf4", border: "1.5px solid #bbf7d0",
            borderRadius: 12, padding: "14px 16px", margin: "12px 0",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#16a34a" }}>
                {line.startsWith('#') ? line.replace(/^#+\s/, '') : line.replace(/\*\*/g, '')}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 16 }}>⭐</span>
            </div>
          </div>
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        const text = line.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>');
        elements.push(
          <ul key={i} style={{ margin: "0 0 4px", paddingLeft: 22 }}>
            <li dangerouslySetInnerHTML={{ __html: text }} />
          </ul>
        );
      } else if (/^\d+\.\s/.test(line)) {
        const listItems = [];
        let j = i;
        while (j < lines.length && /^\d+\.\s/.test(lines[j])) {
          const text = lines[j].replace(/^\d+\.\s/, '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
          listItems.push(<li key={j} dangerouslySetInnerHTML={{ __html: text }} />);
          j++;
        }
        elements.push(<ol key={i} style={{ margin: "0 0 8px", paddingLeft: 22 }}>{listItems}</ol>);
        i = j - 1;
      } else if (line.trim() === '') {
        elements.push(<div key={i} style={{ height: 8 }} />);
      } else {
        // Detect study tips
        if (line.toLowerCase().startsWith('💡') || line.toLowerCase().includes('study tip') || line.toLowerCase().includes('note:')) {
          elements.push(
            <div key={i} style={{
              background: "#fffbeb", border: "1.5px solid #fde68a",
              borderRadius: 12, padding: "12px 16px", margin: "10px 0",
              display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
              <span style={{ fontSize: 14, color: "#92400e", fontWeight: 500, lineHeight: 1.6 }}>
                {line.replace(/^💡\s*/, '').replace(/^(Study Tip:|Note:)\s*/i, '')}
              </span>
            </div>
          );
        } else {
          const formatted = line
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/`(.+?)`/g, '<code>$1</code>');
          elements.push(<p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />);
        }
      }
      i++;
    }
    return elements;
  };

  return (
    <div style={{ maxWidth: 780, margin: "0 auto" }}>
      {loading ? (
        <LoadingScreen message={loadMsg} emoji={loadEmoji} />
      ) : (
        <div>
          {/* Action bar */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 16, gap: 10,
          }}>
            <button
              onClick={() => window.print()}
              style={{
                background: "white", border: "1.5px solid rgba(0,0,0,0.08)",
                borderRadius: 10, padding: "8px 16px", color: "#64748b",
                fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
                cursor: "pointer",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#4f46e5"; e.currentTarget.style.color = "#4f46e5"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; e.currentTarget.style.color = "#64748b"; }}
            >
              📥 PDF
            </button>
            <button
              onClick={onStartQuiz}
              style={{
                background: "linear-gradient(135deg, #4f46e5, #818cf8)",
                border: "none", borderRadius: 10, padding: "10px 20px", color: "white",
                fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
                boxShadow: "0 4px 12px rgba(79,70,229,0.3)", cursor: "pointer",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
            >
              Take Quiz →
            </button>
          </div>

          {/* Notes Content */}
          <div id="printable-content" className="prose-notes-block">
            <div className="notes-content-pad prose-notes">
              {renderNotes(notes)}
            </div>
          </div>

          {/* Bottom CTA */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 24, paddingBottom: 16 }}>
            <button
              onClick={onStartQuiz}
              style={{
                background: "linear-gradient(135deg, #4f46e5, #818cf8)",
                border: "none", borderRadius: 14, padding: "14px 36px", color: "white",
                fontSize: 15, fontWeight: 800,
                boxShadow: "0 6px 20px rgba(79,70,229,0.3)", cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(79,70,229,0.4)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(79,70,229,0.3)"; }}
            >
              🧠 Start Quiz →
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
