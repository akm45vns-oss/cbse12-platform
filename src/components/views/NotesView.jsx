import { LoadingScreen } from "../common";
import { useEffect, memo, useState } from "react";
import { startSession, endSession } from "../../utils/sessionTracking";

// ─── Inline markdown parser (bold, code, italic) ────────────────────────────
function inlineParse(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code style=\"background:#f1f5f9;padding:2px 6px;border-radius:5px;font-size:0.88em;font-family:monospace;color:#7c3aed\">$1</code>")
    .replace(/\\\((.+?)\\\)/g, "<span style=\"font-family:monospace;background:#f0fdf4;padding:1px 6px;border-radius:4px;color:#15803d;font-size:0.9em\">$1</span>");
}

// ─── Table renderer ──────────────────────────────────────────────────────────
function parseTable(lines, startIdx) {
  const rows = [];
  let i = startIdx;
  while (i < lines.length && lines[i].trim().startsWith("|")) {
    const row = lines[i].trim().split("|").map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
    rows.push(row);
    i++;
    // skip separator row (| --- | --- |)
    if (i < lines.length && /^\|[\s\-:|]+\|/.test(lines[i])) i++;
  }
  return { rows, nextIdx: i };
}

// ─── Main markdown renderer ──────────────────────────────────────────────────
function renderMarkdown(raw, subject, selectedClass) {
  if (!raw) return null;
  if (typeof raw === "object" && raw.markdown) raw = raw.markdown;
  if (typeof raw !== "string") return null;

  const elements = [];
  const lines = raw.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // ── H1 with subject tags ──
    if (line.startsWith("# ")) {
      elements.push(
        <div key={i} style={{ marginBottom: 20 }}>
          <h1 style={{ margin: "0 0 10px", fontSize: "1.45rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.3 }}>
            {line.slice(2)}
          </h1>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              background: "#ede9fe", color: "#4f46e5",
              fontSize: 11, fontWeight: 700, padding: "4px 12px",
              borderRadius: 999, letterSpacing: "0.05em",
            }}>Class {selectedClass || "12"}</span>
            <span style={{
              background: "#dbeafe", color: "#2563eb",
              fontSize: 11, fontWeight: 700, padding: "4px 12px",
              borderRadius: 999, letterSpacing: "0.05em",
            }}>{subject}</span>
          </div>
        </div>
      );
      i++; continue;
    }

    // ── H2 ──
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} style={{
          fontSize: "1.12rem", fontWeight: 800, color: "#1e1b4b",
          margin: "28px 0 10px", paddingBottom: 6,
          borderBottom: "2px solid #ede9fe",
        }}>
          {line.slice(3)}
        </h2>
      );
      i++; continue;
    }

    // ── H3 ──
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} style={{
          fontSize: "0.97rem", fontWeight: 700, color: "#4f46e5",
          margin: "18px 0 6px",
        }}>
          {line.slice(4)}
        </h3>
      );
      i++; continue;
    }

    // ── Horizontal rule ──
    if (trimmed === "---" || trimmed === "***") {
      elements.push(<hr key={i} style={{ border: "none", borderTop: "1.5px solid #f1f5f9", margin: "20px 0" }} />);
      i++; continue;
    }

    // ── Table ──
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const { rows, nextIdx } = parseTable(lines, i);
      if (rows.length > 0) {
        const [header, ...body] = rows;
        elements.push(
          <div key={i} style={{ overflowX: "auto", margin: "16px 0", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 380, fontSize: 13 }}>
              <thead>
                <tr style={{ background: "linear-gradient(90deg,#4f46e5,#818cf8)", color: "white" }}>
                  {header.map((cell, ci) => (
                    <th key={ci} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, fontSize: 12, letterSpacing: "0.04em" }}
                      dangerouslySetInnerHTML={{ __html: inlineParse(cell) }} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => (
                  <tr key={ri} style={{ background: ri % 2 === 0 ? "white" : "#f8f9ff" }}>
                    {row.map((cell, ci) => (
                      <td key={ci} style={{ padding: "9px 14px", borderBottom: "1px solid #f1f5f9", color: "#374151", fontSize: 13 }}
                        dangerouslySetInnerHTML={{ __html: inlineParse(cell) }} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        i = nextIdx; continue;
      }
    }

    // ── Blockquote → Concept box ──
    if (line.startsWith("> ")) {
      elements.push(
        <div key={i} style={{
          borderLeft: "3px solid #06b6d4", background: "#ecfeff",
          borderRadius: "0 12px 12px 0", padding: "12px 16px", margin: "12px 0",
        }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#0891b2", letterSpacing: "0.09em", textTransform: "uppercase" }}>
            💡 Concept:{" "}
          </span>
          <span style={{ fontStyle: "italic", fontSize: 14, fontWeight: 500, color: "#164e63" }}
            dangerouslySetInnerHTML={{ __html: inlineParse(line.slice(2)) }} />
        </div>
      );
      i++; continue;
    }

    // ── Bullet list group ──
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const items = [];
      while (i < lines.length && (lines[i].trimStart().startsWith("- ") || lines[i].trimStart().startsWith("* "))) {
        const indent = lines[i].length - lines[i].trimStart().length;
        const text = lines[i].trimStart().slice(2);
        items.push({ text, indent });
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ margin: "6px 0 10px", paddingLeft: 20, listStyleType: "none" }}>
          {items.map((it, idx) => (
            <li key={idx} style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              marginBottom: 5, paddingLeft: it.indent > 0 ? 16 : 0,
            }}>
              <span style={{ color: "#4f46e5", fontWeight: 900, fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>•</span>
              <span style={{ fontSize: 14, color: "#374151", lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{ __html: inlineParse(it.text) }} />
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // ── Ordered list group ──
    if (/^\d+\.\s/.test(trimmed)) {
      const items = [];
      let num = 1;
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push({ num, text: lines[i].trim().replace(/^\d+\.\s/, "") });
        num++; i++;
      }
      elements.push(
        <ol key={`ol-${i}`} style={{ margin: "6px 0 10px", paddingLeft: 4, listStyleType: "none" }}>
          {items.map((it, idx) => (
            <li key={idx} style={{ display: "flex", gap: 10, marginBottom: 6, alignItems: "flex-start" }}>
              <span style={{
                background: "#4f46e5", color: "white", borderRadius: "50%",
                width: 22, height: 22, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800, marginTop: 2,
              }}>{it.num}</span>
              <span style={{ fontSize: 14, color: "#374151", lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{ __html: inlineParse(it.text) }} />
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // ── Empty line ──
    if (trimmed === "") {
      elements.push(<div key={i} style={{ height: 6 }} />);
      i++; continue;
    }

    // ── Study tip / note callout ──
    if (
      trimmed.startsWith("💡") ||
      /^(note:|study tip:|tip:|remember:|important:)/i.test(trimmed)
    ) {
      elements.push(
        <div key={i} style={{
          background: "#fffbeb", border: "1.5px solid #fde68a",
          borderRadius: 12, padding: "12px 16px", margin: "12px 0",
          display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
          <span style={{ fontSize: 14, color: "#92400e", fontWeight: 500, lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: inlineParse(trimmed.replace(/^💡\s*/, "").replace(/^(Note:|Study Tip:|Tip:|Remember:|Important:)\s*/i, "")) }} />
        </div>
      );
      i++; continue;
    }

    // ── ⚠️ warning callout ──
    if (trimmed.startsWith("⚠️") || /^(warning:|caution:)/i.test(trimmed)) {
      elements.push(
        <div key={i} style={{
          background: "#fff7ed", border: "1.5px solid #fed7aa",
          borderRadius: 12, padding: "12px 16px", margin: "12px 0",
          display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
          <span style={{ fontSize: 14, color: "#7c2d12", fontWeight: 500, lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: inlineParse(trimmed.replace(/^⚠️\s*/, "").replace(/^(Warning:|Caution:)\s*/i, "")) }} />
        </div>
      );
      i++; continue;
    }

    // ── Plain paragraph ──
    elements.push(
      <p key={i} style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, margin: "0 0 10px" }}
        dangerouslySetInnerHTML={{ __html: inlineParse(trimmed) }} />
    );
    i++;
  }

  return elements;
}

// ─── Definitions renderer ────────────────────────────────────────────────────
function renderDefinitions(defData) {
  if (!defData?.definitions?.length) return <p style={{ color: "#94a3b8" }}>No definitions available.</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {defData.definitions.map((def, idx) => (
        <div key={idx} style={{
          background: "white", borderRadius: 14, border: "1px solid #e2e8f0",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden",
        }}>
          <div style={{
            background: "linear-gradient(90deg,#4f46e5,#818cf8)",
            padding: "8px 16px", display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ color: "white", fontWeight: 800, fontSize: 14 }}>📖</span>
            <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{def.term}</span>
          </div>
          <div style={{ padding: "12px 16px" }}>
            <p style={{ margin: "0 0 8px", color: "#374151", fontSize: 14, lineHeight: 1.7 }}>{def.definition}</p>
            {def.example && (
              <div style={{
                background: "#f8fafc", padding: "8px 12px", borderRadius: 8,
                fontSize: 13, color: "#64748b", borderLeft: "3px solid #818cf8",
              }}>
                <strong>Example: </strong>{def.example}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Formula renderer ────────────────────────────────────────────────────────
function renderFormulas(formulaData) {
  if (!formulaData?.formulas?.length) return <p style={{ color: "#94a3b8" }}>No formulas available.</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {formulaData.formulas.map((f, idx) => (
        <div key={idx} style={{
          background: "#f0fdf4", borderRadius: 14, border: "1.5px solid #bbf7d0",
          overflow: "hidden",
        }}>
          <div style={{ padding: "10px 16px", borderBottom: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 800, color: "#15803d", fontSize: 14 }}>⚗️ {f.name}</span>
            <span style={{ fontSize: 10, background: "#dcfce7", color: "#16a34a", padding: "3px 8px", borderRadius: 99, fontWeight: 700 }}>Formula</span>
          </div>
          <div style={{ padding: "12px 16px" }}>
            <div style={{
              background: "white", padding: "12px 16px", borderRadius: 10,
              fontFamily: "monospace", fontSize: 15, color: "#15803d",
              marginBottom: 10, border: "1px dashed #86efac", textAlign: "center",
              letterSpacing: "0.03em", fontWeight: 700,
            }}>
              {f.formula}
            </div>
            {f.variables && <p style={{ margin: "0 0 4px", color: "#475569", fontSize: 13 }}><strong>Variables: </strong>{f.variables}</p>}
            {f.units && <p style={{ margin: "0 0 4px", color: "#475569", fontSize: 13 }}><strong>Units: </strong>{f.units}</p>}
            {f.notes && <p style={{ margin: 0, color: "#64748b", fontSize: 13, fontStyle: "italic" }}>{f.notes}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── NCERT Summary renderer (may be markdown or structured) ──────────────────
function renderNcertSummary(data, subject, selectedClass) {
  if (!data) return <p style={{ color: "#94a3b8" }}>No NCERT summary available.</p>;
  // if it has markdown key render as markdown
  if (data.markdown || typeof data === "string") return renderMarkdown(data, subject, selectedClass);
  // if it has points array
  if (data.points?.length) {
    return (
      <ul style={{ margin: 0, paddingLeft: 0, listStyleType: "none", display: "flex", flexDirection: "column", gap: 10 }}>
        {data.points.map((pt, idx) => (
          <li key={idx} style={{
            background: "white", borderRadius: 12, padding: "10px 16px",
            border: "1px solid #e2e8f0", display: "flex", gap: 10, alignItems: "flex-start",
          }}>
            <span style={{
              background: "#4f46e5", color: "white", borderRadius: "50%",
              width: 22, height: 22, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 800,
            }}>{idx + 1}</span>
            <span style={{ fontSize: 14, color: "#374151", lineHeight: 1.7 }}
              dangerouslySetInnerHTML={{ __html: inlineParse(pt) }} />
          </li>
        ))}
      </ul>
    );
  }
  return renderMarkdown(JSON.stringify(data), subject, selectedClass);
}

// ─────────────────────────────────────────────────────────────────────────────

export const NotesView = memo(function NotesView({
  subject, chapter, notes, loading, loadMsg, loadEmoji,
  onStartQuiz, curriculumData, onRegenerateNotes, selectedClass,
}) {
  const [activeTab, setActiveTab] = useState("detailed");

  useEffect(() => {
    startSession(subject, chapter, "notes");
    return () => { endSession(true); };
  }, [subject, chapter]);

  if (loading) {
    return (
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        <LoadingScreen message={loadMsg} emoji={loadEmoji} />
      </div>
    );
  }

  const isModular = notes && typeof notes === "object" && notes.isModular;

  const tabs = [
    { id: "detailed",    label: "Study Guide",    icon: "📚", available: isModular && !!notes.detailed_notes },
    { id: "short",       label: "Quick Notes",    icon: "⚡", available: isModular && !!notes.short_notes },
    { id: "definitions", label: "Definitions",    icon: "📖", available: isModular && !!notes.key_definitions },
    { id: "formulas",    label: "Formulas",       icon: "🧮", available: isModular && !!notes.formula_sheet },
    { id: "ncert",       label: "NCERT Summary",  icon: "📝", available: isModular && !!notes.ncert_summary },
  ].filter(t => t.available);

  const currentTabId = tabs.find(t => t.id === activeTab)
    ? activeTab
    : tabs.length > 0 ? tabs[0].id : "detailed";

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", fontFamily: "'Outfit', 'Inter', sans-serif" }}>

      {/* ── Action bar ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 10 }}>
        <button
          onClick={() => window.print()}
          style={{
            background: "white", border: "1.5px solid rgba(0,0,0,0.08)",
            borderRadius: 10, padding: "8px 16px", color: "#64748b",
            fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
            cursor: "pointer", transition: "all 0.2s",
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
            border: "none", borderRadius: 10, padding: "10px 22px", color: "white",
            fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
            boxShadow: "0 4px 14px rgba(79,70,229,0.3)", cursor: "pointer", transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(79,70,229,0.4)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(79,70,229,0.3)"; }}
        >
          Take Quiz →
        </button>
      </div>

      {isModular ? (
        <div>
          {/* ── Tab Navigation ── */}
          <div style={{
            display: "flex", overflowX: "auto", gap: 8,
            paddingBottom: 14, marginBottom: 18,
            scrollbarWidth: "none", msOverflowStyle: "none",
          }}>
            {tabs.map(tab => {
              const isActive = currentTabId === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: "9px 18px", borderRadius: 12, border: "none",
                    background: isActive ? "#4f46e5" : "white",
                    color: isActive ? "white" : "#64748b",
                    fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap",
                    boxShadow: isActive
                      ? "0 4px 14px rgba(79,70,229,0.25)"
                      : "0 1px 3px rgba(0,0,0,0.06)",
                    transition: "all 0.2s",
                    transform: isActive ? "translateY(-1px)" : "translateY(0)",
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── Tab Content Card ── */}
          <div
            id="printable-content"
            style={{
              background: "white",
              borderRadius: 18,
              border: "1px solid #f1f5f9",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              padding: "28px 32px",
              minHeight: "60vh",
            }}
          >
            {currentTabId === "detailed" && renderMarkdown(notes.detailed_notes, subject, selectedClass)}
            {currentTabId === "short"    && renderMarkdown(notes.short_notes, subject, selectedClass)}
            {currentTabId === "ncert"    && renderNcertSummary(notes.ncert_summary, subject, selectedClass)}
            {currentTabId === "definitions" && renderDefinitions(notes.key_definitions)}
            {currentTabId === "formulas"    && renderFormulas(notes.formula_sheet)}
          </div>
        </div>
      ) : (
        /* Legacy plain markdown */
        <div
          id="printable-content"
          style={{
            background: "white", borderRadius: 18,
            border: "1px solid #f1f5f9",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            padding: "28px 32px", minHeight: "60vh",
          }}
        >
          {renderMarkdown(notes, subject, selectedClass)}
        </div>
      )}

      {/* ── Bottom CTA ── */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 28, paddingBottom: 20 }}>
        <button
          onClick={onStartQuiz}
          style={{
            background: "linear-gradient(135deg, #4f46e5, #818cf8)",
            border: "none", borderRadius: 14, padding: "14px 40px",
            color: "white", fontSize: 15, fontWeight: 800,
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
