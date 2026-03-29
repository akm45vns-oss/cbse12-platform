import { Badge, LoadingScreen } from "../common";
import { CURRICULUM } from "../../constants/curriculum";
import { useEffect } from "react";
import { startSession, endSession } from "../../utils/sessionTracking";

export function NotesView({ subject, chapter, notes, loading, loadMsg, loadEmoji, onStartQuiz, curriculumData }) {
  const S = curriculumData;

  useEffect(() => {
    startSession(subject, chapter, "notes");
    return () => {
      endSession(true);
    };
  }, [subject, chapter]);
  
  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      {loading ? <LoadingScreen message={loadMsg} emoji={loadEmoji} /> : (
        <div>
          {/* Notes Header Card */}
          <div className="no-print" style={{
            background: "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(28px)",
            WebkitBackdropFilter: "blur(28px)",
            border: "1px solid rgba(0,0,0,0.05)",
            borderRadius: 20,
            padding: "clamp(14px,3vw,22px) clamp(16px,4vw,28px)",
            boxShadow: "0 12px 32px rgba(148,163,184,0.15), inset 0 1px 0 rgba(255,255,255,0.8)",
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 14
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{subject}</div>
              <h2 style={{ fontSize: "clamp(18px,3vw,24px)", fontWeight: 900, color: "#1e293b", margin: "0 0 4px", letterSpacing: "-0.02em" }}>{chapter}</h2>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>AkmEdu45 · Study Notes</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => window.print()}
                style={{
                  background: "rgba(0,0,0,0.03)",
                  border: "1px solid rgba(0,0,0,0.05)",
                  borderRadius: 10,
                  padding: "9px 16px",
                  color: "#475569",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.06)"; e.currentTarget.style.color = "#1e293b"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0.03)"; e.currentTarget.style.color = "#475569"; }}
              >
                📥 PDF
              </button>
              <button onClick={onStartQuiz}
                style={{
                  background: "linear-gradient(135deg, rgba(59,130,246,0.9), rgba(139,92,246,0.9))",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.5)",
                  borderRadius: 10,
                  padding: "9px 20px",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 4px 12px rgba(59,130,246,0.2)",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(59,130,246,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(59,130,246,0.2)"; }}
              >
                🧠 Take Quiz →
              </button>
            </div>
          </div>

          {/* Notes Content */}
          <div id="printable-content" className="prose-notes-block">
            <div className="prose-notes">
              {(() => {
                const elements = [];
                const lines = notes.split('\n');
                let i = 0;
                while (i < lines.length) {
                  const line = lines[i];
                  if (line.startsWith('# ')) {
                    elements.push(<h1 key={i}>{line.slice(2)}</h1>);
                  } else if (line.startsWith('## ')) {
                    elements.push(<h2 key={i}>{line.slice(3)}</h2>);
                  } else if (line.startsWith('### ')) {
                    elements.push(<h3 key={i}>{line.slice(4)}</h3>);
                  } else if (line.startsWith('---')) {
                    elements.push(<hr key={i} />);
                  } else if (line.startsWith('> ')) {
                    elements.push(<blockquote key={i}>{line.slice(2)}</blockquote>);
                  } else if (line.startsWith('- ') || line.startsWith('* ')) {
                    const text = line.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                    elements.push(<ul key={i} style={{margin:0,paddingLeft:22}}><li dangerouslySetInnerHTML={{ __html: text }} /></ul>);
                  } else if (/^\d+\.\s/.test(line)) {
                    const listItems = [];
                    let j = i;
                    while (j < lines.length && /^\d+\.\s/.test(lines[j])) {
                      const text = lines[j].replace(/^\d+\.\s/, '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                      listItems.push(<li key={j} dangerouslySetInnerHTML={{ __html: text }} />);
                      j++;
                    }
                    elements.push(<ol key={i} style={{margin:0,paddingLeft:22}}>{listItems}</ol>);
                    i = j - 1;
                  } else if (line.trim() === '') {
                    elements.push(<div key={i} style={{height:6}} />);
                  } else {
                    const formatted = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>');
                    elements.push(<p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />);
                  }
                  i++;
                }
                return elements;
              })()}
            </div>
          </div>

          {/* Bottom action bar */}
          <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 32, paddingBottom: 40 }}>
            <button onClick={onStartQuiz}
              style={{
                background: "linear-gradient(135deg, rgba(59,130,246,0.9), rgba(139,92,246,0.9))",
                border: "1px solid rgba(255,255,255,0.5)",
                backdropFilter: "blur(10px)",
                borderRadius: 14,
                padding: "13px 32px",
                color: "white",
                fontSize: 15,
                fontWeight: 800,
                boxShadow: "0 6px 20px rgba(59,130,246,0.2)",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 30px rgba(59,130,246,0.3)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(59,130,246,0.2)"; }}
            >
              🧠 Start Quiz →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
