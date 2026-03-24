import { Badge, LoadingScreen } from "../common";
import { CURRICULUM } from "../../constants/curriculum";

export function NotesView({ subject, chapter, notes, loading, loadMsg, loadEmoji, onRegenerateNotes, onStartQuiz, curriculumData }) {
  const S = curriculumData;
  
  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      {loading ? <LoadingScreen message={loadMsg} emoji={loadEmoji} /> : (
        <div>
          {/* Notes Header Card */}
          <div className="no-print" style={{ background: "white", borderRadius: 20, border: "1px solid #fce7f3", padding: "clamp(14px,3vw,22px) clamp(16px,4vw,32px)", boxShadow: "0 2px 12px rgba(236,72,153,0.07)", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <Badge color={S?.accent || "#ec4899"}>{subject}</Badge>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#831843", margin: "6px 0 2px", letterSpacing: "-0.02em" }}>{chapter}</h2>
              <div style={{ fontSize: 12, color: "#f472b4", fontWeight: 600 }}>AkMEdu · Study Notes</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => window.print()} style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 10, padding: "9px 16px", color: "#334155", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>📥 PDF</button>
              <button onClick={onStartQuiz}
                style={{ background: "linear-gradient(135deg,#ec4899,#db2777)", border: "none", borderRadius: 10, padding: "9px 20px", color: "white", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 14px rgba(236,72,153,0.35)" }}>🧠 Take Quiz →</button>
            </div>
          </div>
          {/* Notes Content */}
          <div id="printable-content" className="prose-notes-block">
            <div className="prose-notes">
              {notes.split('\n').map((line, i) => {
                if (line.startsWith('# ')) return <h1 key={i}>{line.slice(2)}</h1>;
                if (line.startsWith('## ')) return <h2 key={i}>{line.slice(3)}</h2>;
                if (line.startsWith('### ')) return <h3 key={i}>{line.slice(4)}</h3>;
                if (line.startsWith('---')) return <hr key={i} />;
                if (line.startsWith('> ')) return <blockquote key={i}>{line.slice(2)}</blockquote>;
                if (line.startsWith('- ') || line.startsWith('* ')) {
                  const text = line.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                  return <ul key={i} style={{margin:0,paddingLeft:22}}><li dangerouslySetInnerHTML={{ __html: text }} /></ul>;
                }
                if (/^\d+\.\s/.test(line)) {
                  const text = line.replace(/^\d+\.\s/, '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                  return <ol key={i} style={{margin:0,paddingLeft:22}}><li dangerouslySetInnerHTML={{ __html: text }} /></ol>;
                }
                if (line.trim() === '') return <div key={i} style={{height:6}} />;
                const formatted = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>');
                return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />;
              })}
            </div>
          </div>
          {/* Bottom action bar */}
          <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 24, paddingBottom: 32 }}>
            <button onClick={onStartQuiz}
              style={{ background: "linear-gradient(135deg,#ec4899,#db2777)", border: "none", borderRadius: 12, padding: "11px 28px", color: "white", fontSize: 14, fontWeight: 700, boxShadow: "0 4px 14px rgba(236,72,153,0.35)" }}>🧠 Start Quiz →</button>
          </div>
        </div>
      )}
    </div>
  );
}
