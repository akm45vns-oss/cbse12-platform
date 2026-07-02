import { memo, useState, useEffect, useRef } from "react";
import { getChapterNotes } from "../../utils/supabase";
import { getCachedNotes, cacheNotes } from "../../utils/cacheManager";

// ─── Inline markdown helpers (same as ChapterView) ────────────────────────────
function inlineParse(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code style=\"background:rgba(79,70,229,0.06);padding:2px 6px;border-radius:5px;font-size:0.88em;font-family:monospace;color:#4f46e5\">$1</code>")
    .replace(/\\\((.+?)\\\)/g, "<span style=\"font-family:monospace;background:#f0fdf4;padding:1px 6px;border-radius:4px;color:#15803d;font-size:0.9em\">$1</span>");
}

function parseTable(lines, startIdx) {
  const rows = [];
  let i = startIdx;
  while (i < lines.length && lines[i].trim().startsWith("|")) {
    const row = lines[i].trim().split("|").map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
    rows.push(row);
    i++;
    if (i < lines.length && /^\|[\s\-:|]+\|/.test(lines[i])) i++;
  }
  return { rows, nextIdx: i };
}

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
    if (line.startsWith("# ")) {
      elements.push(<div key={i} style={{ marginBottom: 16 }}><h1 style={{ margin: "0 0 10px", fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.3 }}>{line.slice(2)}</h1><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><span style={{ background: "#ede9fe", color: "#4f46e5", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>Class {selectedClass || "12"}</span><span style={{ background: "#dbeafe", color: "#2563eb", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>{subject}</span></div></div>);
      i++; continue;
    }
    if (line.startsWith("## ")) { elements.push(<h2 key={i} style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1e1b4b", margin: "26px 0 10px", paddingBottom: 6, borderBottom: "2px solid #ede9fe" }}>{line.slice(3)}</h2>); i++; continue; }
    if (line.startsWith("### ")) { elements.push(<h3 key={i} style={{ fontSize: "0.97rem", fontWeight: 700, color: "#4f46e5", margin: "16px 0 6px" }}>{line.slice(4)}</h3>); i++; continue; }
    if (trimmed === "---" || trimmed === "***") { elements.push(<hr key={i} style={{ border: "none", borderTop: "1.5px solid #f1f5f9", margin: "18px 0" }} />); i++; continue; }
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const { rows, nextIdx } = parseTable(lines, i);
      if (rows.length > 0) {
        const [header, ...body] = rows;
        elements.push(<div key={i} style={{ overflowX: "auto", margin: "14px 0", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}><table style={{ borderCollapse: "collapse", width: "100%", minWidth: 340, fontSize: 13 }}><thead><tr style={{ background: "linear-gradient(90deg,#4f46e5,#818cf8)", color: "white" }}>{header.map((cell, ci) => <th key={ci} style={{ padding: "9px 14px", textAlign: "left", fontWeight: 700, fontSize: 12, letterSpacing: "0.04em" }} dangerouslySetInnerHTML={{ __html: inlineParse(cell) }} />)}</tr></thead><tbody>{body.map((row, ri) => (<tr key={ri} style={{ background: ri % 2 === 0 ? "white" : "#f8f9ff" }}>{row.map((cell, ci) => <td key={ci} style={{ padding: "8px 14px", borderBottom: "1px solid #f1f5f9", color: "#374151" }} dangerouslySetInnerHTML={{ __html: inlineParse(cell) }} />)}</tr>))}</tbody></table></div>);
        i = nextIdx; continue;
      }
    }
    if (line.startsWith("> ")) { elements.push(<div key={i} style={{ borderLeft: "3px solid #06b6d4", background: "#ecfeff", borderRadius: "0 12px 12px 0", padding: "11px 16px", margin: "12px 0" }}><span style={{ fontSize: 10, fontWeight: 800, color: "#0891b2", letterSpacing: "0.09em", textTransform: "uppercase" }}>💡 Concept: </span><span style={{ fontStyle: "italic", fontSize: 14, fontWeight: 500, color: "#164e63" }} dangerouslySetInnerHTML={{ __html: inlineParse(line.slice(2)) }} /></div>); i++; continue; }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const items = [];
      while (i < lines.length && (lines[i].trimStart().startsWith("- ") || lines[i].trimStart().startsWith("* "))) {
        const indent = lines[i].length - lines[i].trimStart().length;
        items.push({ text: lines[i].trimStart().slice(2), indent });
        i++;
      }
      elements.push(<ul key={`ul-${i}`} style={{ margin: "6px 0 10px", paddingLeft: 4, listStyleType: "none" }}>{items.map((it, idx) => (<li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 5, paddingLeft: it.indent > 0 ? 16 : 0 }}><span style={{ color: "#4f46e5", fontWeight: 900, fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>•</span><span style={{ fontSize: 14, color: "#374151", lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: inlineParse(it.text) }} /></li>))}</ul>);
      continue;
    }
    if (/^\d+\.\s/.test(trimmed)) {
      const items = [];
      let num = 1;
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push({ num, text: lines[i].trim().replace(/^\d+\.\s/, "") });
        num++; i++;
      }
      elements.push(<ol key={`ol-${i}`} style={{ margin: "6px 0 10px", paddingLeft: 4, listStyleType: "none" }}>{items.map((it, idx) => (<li key={idx} style={{ display: "flex", gap: 10, marginBottom: 6, alignItems: "flex-start" }}><span style={{ background: "#4f46e5", color: "white", borderRadius: "50%", width: 22, height: 22, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, marginTop: 2 }}>{it.num}</span><span style={{ fontSize: 14, color: "#374151", lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: inlineParse(it.text) }} /></li>))}</ol>);
      continue;
    }
    if (trimmed === "") { elements.push(<div key={i} style={{ height: 6 }} />); i++; continue; }
    if (trimmed.startsWith("💡") || /^(note:|study tip:|tip:|remember:|important:)/i.test(trimmed)) {
      elements.push(<div key={i} style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 12, padding: "11px 16px", margin: "10px 0", display: "flex", gap: 10, alignItems: "flex-start" }}><span style={{ fontSize: 18, flexShrink: 0 }}>💡</span><span style={{ fontSize: 14, color: "#92400e", fontWeight: 500, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: inlineParse(trimmed.replace(/^💡\s*/, "").replace(/^(Note:|Study Tip:|Tip:|Remember:|Important:)\s*/i, "")) }} /></div>);
      i++; continue;
    }
    elements.push(<p key={i} style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, margin: "0 0 10px" }} dangerouslySetInnerHTML={{ __html: inlineParse(trimmed) }} />);
    i++;
  }
  return elements;
}

function renderNcertSummary(data, subject, selectedClass) {
  if (!data) return <p style={{ color: "#94a3b8" }}>No NCERT summary available.</p>;
  if (data.markdown || typeof data === "string") return renderMarkdown(data, subject, selectedClass);
  if (data.points?.length) {
    return (<ul style={{ margin: 0, paddingLeft: 0, listStyleType: "none", display: "flex", flexDirection: "column", gap: 10 }}>{data.points.map((pt, idx) => (<li key={idx} style={{ background: "white", borderRadius: 12, padding: "10px 16px", border: "1px solid #e2e8f0", display: "flex", gap: 10 }}><span style={{ background: "#4f46e5", color: "white", borderRadius: "50%", width: 22, height: 22, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{idx + 1}</span><span style={{ fontSize: 14, color: "#374151", lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: inlineParse(pt) }} /></li>))}</ul>);
  }
  return renderMarkdown(JSON.stringify(data), subject, selectedClass);
}

const CONCEPT_COLORS = {
  "Most Important Fact": { bg: "#fef3c7", border: "#fde68a", color: "#92400e", icon: "⭐" },
  "NCERT Line": { bg: "#ede9fe", border: "#c4b5fd", color: "#4f46e5", icon: "📖" },
  "Board Favourite": { bg: "#dcfce7", border: "#86efac", color: "#15803d", icon: "🏆" },
  "Memory Trick": { bg: "#e0f2fe", border: "#7dd3fc", color: "#0369a1", icon: "🧠" },
  "Common Mistake": { bg: "#fee2e2", border: "#fca5a5", color: "#dc2626", icon: "⚠️" },
};

function renderImportantConcepts(data) {
  if (!data?.concepts?.length) return <p style={{ color: "#94a3b8" }}>No important concepts available.</p>;
  return (<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{data.concepts.map((c, idx) => { const style = CONCEPT_COLORS[c.category] || { bg: "#f8fafc", border: "#e2e8f0", color: "#374151", icon: "📌" }; return (<div key={idx} style={{ background: style.bg, borderRadius: 12, border: `1.5px solid ${style.border}`, padding: "12px 16px" }}><div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}><span style={{ fontSize: 16 }}>{style.icon}</span><span style={{ fontSize: 10, fontWeight: 800, color: style.color, textTransform: "uppercase", letterSpacing: "0.07em" }}>{c.category}</span></div><div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>{c.title}</div><div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{c.description}</div></div>); })}</div>);
}

function renderDefinitions(data) {
  if (!data?.definitions?.length) return <p style={{ color: "#94a3b8" }}>No definitions available.</p>;
  return (<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{data.definitions.map((def, idx) => (<div key={idx} style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}><div style={{ background: "linear-gradient(90deg,#4f46e5,#818cf8)", padding: "8px 16px" }}><span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>📖 {def.term}</span></div><div style={{ padding: "10px 16px" }}><p style={{ margin: "0 0 8px", color: "#374151", fontSize: 14, lineHeight: 1.7 }}>{def.definition}</p>{def.example && <div style={{ background: "#f8fafc", padding: "7px 12px", borderRadius: 8, fontSize: 13, color: "#64748b", borderLeft: "3px solid #818cf8" }}><strong>Example:</strong> {def.example}</div>}</div></div>))}</div>);
}

function renderFormulas(data) {
  if (!data?.formulas?.length) return <p style={{ color: "#94a3b8" }}>No formulas available.</p>;
  return (<div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{data.formulas.map((f, idx) => (<div key={idx} style={{ background: "#f0fdf4", borderRadius: 14, border: "1.5px solid #bbf7d0", overflow: "hidden" }}><div style={{ padding: "9px 16px", borderBottom: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "space-between" }}><span style={{ fontWeight: 800, color: "#15803d", fontSize: 14 }}>⚗️ {f.name}</span><span style={{ fontSize: 10, background: "#dcfce7", color: "#16a34a", padding: "3px 8px", borderRadius: 99, fontWeight: 700 }}>Formula</span></div><div style={{ padding: "12px 16px" }}><div style={{ background: "white", padding: "11px 16px", borderRadius: 10, fontFamily: "monospace", fontSize: 15, color: "#15803d", marginBottom: 10, border: "1px dashed #86efac", textAlign: "center", fontWeight: 700 }}>{f.formula}</div>{f.variables && <p style={{ margin: "0 0 4px", color: "#475569", fontSize: 13 }}><strong>Variables: </strong>{f.variables}</p>}{f.units && <p style={{ margin: "0 0 4px", color: "#475569", fontSize: 13 }}><strong>Units: </strong>{f.units}</p>}{f.notes && <p style={{ margin: 0, color: "#64748b", fontSize: 13, fontStyle: "italic" }}>{f.notes}</p>}</div></div>))}</div>);
}

// ─── Section skeleton ─────────────────────────────────────────────────────────
function SectionSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ height: 80, borderRadius: 14, background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
      ))}
    </div>
  );
}

// ─── LEARN TABS CONFIG ────────────────────────────────────────────────────────
const LEARN_TABS = [
  { id: "overview",   label: "Overview",   icon: "📝", description: "NCERT textbook foundation" },
  { id: "notes",      label: "Full Notes", icon: "📚", description: "Detailed study guide" },
  { id: "concepts",  label: "Concepts",   icon: "💡", description: "Board-favourite concepts" },
  { id: "formulas",  label: "Formulas",   icon: "⚗️", description: "Quick equation sheet" },
  { id: "glossary",  label: "Glossary",   icon: "📖", description: "Key definitions" },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export const LearnView = memo(function LearnView({
  chapter, subject, selectedClass, notesRead, theme, onMarkRead, onGoToPractice,
}) {
  const [notesData, setNotesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const tabBarRef = useRef(null);

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      try {
        const local = getCachedNotes(selectedClass, subject, chapter);
        if (local) { if (active) { setNotesData(local); setLoading(false); } return; }
        const dbNotes = await getChapterNotes(selectedClass, subject, chapter);
        if (dbNotes && active) { setNotesData(dbNotes); cacheNotes(selectedClass, subject, chapter, dbNotes, 1440); }
      } catch (err) { console.error("LearnView: error loading notes:", err); }
      finally { if (active) setLoading(false); }
    }
    loadData();
    return () => { active = false; };
  }, [selectedClass, subject, chapter]);

  // Scroll active tab into view on mobile
  useEffect(() => {
    if (tabBarRef.current) {
      const active = tabBarRef.current.querySelector(".learn-tab-active");
      if (active) active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeTab]);

  const n = notesData || {};

  const renderTabContent = () => {
    if (loading) return <SectionSkeleton />;
    switch (activeTab) {
      case "overview":  return renderNcertSummary(n.ncert_summary, subject, selectedClass) || <SectionSkeleton />;
      case "notes":     return renderMarkdown(n.detailed_notes, subject, selectedClass) || <p style={{ color: "#94a3b8" }}>Detailed notes not available for this chapter yet.</p>;
      case "concepts":  return renderImportantConcepts(n.important_concepts);
      case "formulas":  return renderFormulas(n.formula_sheet);
      case "glossary":  return renderDefinitions(n.key_definitions);
      default:          return null;
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", fontFamily: "'Outfit','Inter',sans-serif" }}>
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>

      {/* ── Chapter Info Banner ── */}
      <div style={{
        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
        borderRadius: 20, padding: "16px", marginBottom: 16,
        color: "white", position: "relative", overflow: "hidden",
        boxShadow: "0 4px 20px rgba(79,70,229,0.25)",
      }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", right: 40, bottom: -30, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.8, marginBottom: 4 }}>
          📖 Learn · Class {selectedClass} · {subject}
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 10px", lineHeight: 1.25 }}>{chapter}</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {notesRead && (
            <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 99, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>
              ✓ Notes Read
            </span>
          )}
          <span style={{ background: "rgba(255,255,255,0.15)", borderRadius: 99, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>
            {LEARN_TABS.length} Sections
          </span>
        </div>
      </div>

      {/* ── Grid Tab Bar (3-col grid, no flex-wrap ragging) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
          marginBottom: 16,
        }}
      >
        {LEARN_TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={isActive ? "learn-tab-active" : ""}
              style={{
                padding: "9px 6px", borderRadius: 12,
                border: isActive ? `2px solid var(--primary)` : `1.5px solid var(--border-card)`,
                background: isActive ? "linear-gradient(135deg,#4f46e5,#818cf8)" : "var(--bg-card)",
                color: isActive ? "white" : "var(--text-label)",
                fontSize: 11, fontWeight: 800,
                boxShadow: isActive ? "0 4px 14px rgba(79,70,229,0.25)" : "var(--shadow-sm)",
                transition: "all 0.2s",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
              }}
            >
              <span style={{ fontSize: 16 }}>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Section Header ── */}
      {(() => {
        const tab = LEARN_TABS.find(t => t.id === activeTab);
        return tab ? (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {tab.icon} {tab.label}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{tab.description}</div>
          </div>
        ) : null;
      })()}

      {/* ── Tab Content ── */}
      <div style={{ animation: "fadeIn 0.2s" }}>
        {renderTabContent()}
      </div>

      {/* ── Bottom CTA Bar ── */}
      <div style={{
        marginTop: 28, background: "var(--bg-card)", borderRadius: 20,
        border: "1px solid var(--border-card)", padding: "14px 16px",
        boxShadow: "var(--shadow-card)",
        display: "flex", gap: 10, alignItems: "center",
      }}>
        {!notesRead && onMarkRead && (
          <button
            onClick={onMarkRead}
            style={{
              flex: 1, background: "var(--bg-card)", border: "1.5px solid var(--primary)",
              borderRadius: 14, padding: "12px 14px", color: "var(--primary)",
              fontSize: 13, fontWeight: 800, transition: "all 0.2s",
            }}
          >
            ✓ Mark as Read
          </button>
        )}
        {onGoToPractice && (
          <button
            onClick={onGoToPractice}
            style={{
              flex: 2, background: "linear-gradient(135deg,#4f46e5,#818cf8)",
              border: "none", borderRadius: 14, padding: "12px 14px",
              color: "white", fontSize: 13, fontWeight: 800,
              boxShadow: "0 4px 14px rgba(79,70,229,0.3)", transition: "all 0.2s",
            }}
          >
            Next: Practice →
          </button>
        )}
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
});
