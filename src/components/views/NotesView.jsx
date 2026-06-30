import { LoadingScreen } from "../common";
import { useEffect, memo, useState } from "react";
import { startSession, endSession } from "../../utils/sessionTracking";

export const NotesView = memo(function NotesView({
  subject, chapter, notes, loading, loadMsg, loadEmoji, onStartQuiz, curriculumData, onRegenerateNotes, selectedClass
}) {
  const [activeTab, setActiveTab] = useState("detailed");

  useEffect(() => {
    startSession(subject, chapter, "notes");
    return () => { endSession(true); };
  }, [subject, chapter]);

  // Enhanced markdown renderer matching new design (callout boxes, formula boxes, etc.)
  const renderMarkdown = (raw) => {
    if (!raw) return null;
    // Extract markdown from object if passed
    if (typeof raw === 'object' && raw.markdown) raw = raw.markdown;
    
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
              }}>Class {selectedClass || "12"}</span>
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

  const renderDefinitions = (definitionsData) => {
    if (!definitionsData || !definitionsData.definitions) return <p>No definitions available.</p>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {definitionsData.definitions.map((def, idx) => (
          <div key={idx} style={{ background: "white", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <h3 style={{ margin: "0 0 8px 0", color: "#0f172a", fontSize: 16 }}>{def.term}</h3>
            <p style={{ margin: "0 0 8px 0", color: "#475569", fontSize: 14, lineHeight: 1.6 }}>{def.definition}</p>
            {def.example && (
              <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: 8, fontSize: 13, color: "#64748b", borderLeft: "3px solid #cbd5e1" }}>
                <strong>Example:</strong> {def.example}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderFormulas = (formulaData) => {
    if (!formulaData || !formulaData.formulas) return <p>No formulas available.</p>;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {formulaData.formulas.map((f, idx) => (
          <div key={idx} style={{ background: "#f0fdf4", padding: 16, borderRadius: 12, border: "1px solid #bbf7d0" }}>
            <h3 style={{ margin: "0 0 8px 0", color: "#16a34a", fontSize: 16 }}>{f.name}</h3>
            <div style={{ background: "white", padding: "12px 16px", borderRadius: 8, fontFamily: "monospace", fontSize: 15, color: "#15803d", marginBottom: 8, border: "1px dashed #86efac", textAlign: "center" }}>
              {f.formula}
            </div>
            <p style={{ margin: "0 0 4px 0", color: "#475569", fontSize: 13 }}><strong>Variables:</strong> {f.variables}</p>
            {f.units && <p style={{ margin: "0 0 4px 0", color: "#475569", fontSize: 13 }}><strong>Units:</strong> {f.units}</p>}
            {f.notes && <p style={{ margin: "0", color: "#64748b", fontSize: 13, fontStyle: "italic" }}>{f.notes}</p>}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        <LoadingScreen message={loadMsg} emoji={loadEmoji} />
      </div>
    );
  }

  const isModular = notes && typeof notes === 'object' && notes.isModular;
  
  const tabs = [
    { id: "detailed", label: "Study Guide", icon: "📚", content: isModular ? notes.detailed_notes : null },
    { id: "short", label: "Quick Notes", icon: "⚡", content: isModular ? notes.short_notes : null },
    { id: "definitions", label: "Definitions", icon: "📖", content: isModular ? notes.key_definitions : null },
    { id: "formulas", label: "Formulas", icon: "🧮", content: isModular ? notes.formula_sheet : null },
    { id: "ncert", label: "NCERT Summary", icon: "📝", content: isModular ? notes.ncert_summary : null },
  ].filter(t => t.content);

  return (
    <div style={{ maxWidth: 780, margin: "0 auto" }}>
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

      {isModular ? (
        <div>
          {/* Tab Navigation */}
          <div style={{ 
            display: "flex", overflowX: "auto", gap: 8, paddingBottom: 12, marginBottom: 16,
            scrollbarWidth: "none", msOverflowStyle: "none"
          }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "10px 16px", borderRadius: 12, border: "none",
                  background: activeTab === tab.id ? "#4f46e5" : "white",
                  color: activeTab === tab.id ? "white" : "#64748b",
                  fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap",
                  boxShadow: activeTab === tab.id ? "0 4px 12px rgba(79,70,229,0.2)" : "0 1px 3px rgba(0,0,0,0.05)",
                  transition: "all 0.2s"
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div id="printable-content" className="prose-notes-block" style={{ minHeight: "60vh" }}>
            <div className="notes-content-pad prose-notes">
              {activeTab === "detailed" && renderMarkdown(notes.detailed_notes)}
              {activeTab === "short" && renderMarkdown(notes.short_notes)}
              {activeTab === "ncert" && renderMarkdown(notes.ncert_summary)}
              {activeTab === "definitions" && renderDefinitions(notes.key_definitions)}
              {activeTab === "formulas" && renderFormulas(notes.formula_sheet)}
            </div>
          </div>
        </div>
      ) : (
        /* Legacy Old Notes Renderer */
        <div id="printable-content" className="prose-notes-block">
          <div className="notes-content-pad prose-notes">
            {renderMarkdown(notes)}
          </div>
        </div>
      )}

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
  );
});
