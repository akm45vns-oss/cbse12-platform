import { LoadingScreen } from "../common";
import { useEffect, memo, useState } from "react";
import { startSession, endSession } from "../../utils/sessionTracking";

// ─── Inline markdown (bold, italic, code, LaTeX) ──────────────────────────────
function inlineParse(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code style=\"background:#f1f5f9;padding:2px 6px;border-radius:5px;font-size:0.88em;font-family:monospace;color:#7c3aed\">$1</code>")
    .replace(/\\\((.+?)\\\)/g, "<span style=\"font-family:monospace;background:#f0fdf4;padding:1px 6px;border-radius:4px;color:#15803d;font-size:0.9em\">$1</span>");
}

// ─── Table parser ─────────────────────────────────────────────────────────────
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

// ─── Markdown renderer ────────────────────────────────────────────────────────
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
      elements.push(
        <div key={i} style={{ marginBottom: 20 }}>
          <h1 style={{ margin: "0 0 10px", fontSize: "1.45rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.3 }}>{line.slice(2)}</h1>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ background: "#ede9fe", color: "#4f46e5", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 999 }}>Class {selectedClass || "12"}</span>
            <span style={{ background: "#dbeafe", color: "#2563eb", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 999 }}>{subject}</span>
          </div>
        </div>
      );
      i++; continue;
    }
    if (line.startsWith("## ")) {
      elements.push(<h2 key={i} style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1e1b4b", margin: "26px 0 10px", paddingBottom: 6, borderBottom: "2px solid #ede9fe" }}>{line.slice(3)}</h2>);
      i++; continue;
    }
    if (line.startsWith("### ")) {
      elements.push(<h3 key={i} style={{ fontSize: "0.97rem", fontWeight: 700, color: "#4f46e5", margin: "16px 0 6px" }}>{line.slice(4)}</h3>);
      i++; continue;
    }
    if (trimmed === "---" || trimmed === "***") {
      elements.push(<hr key={i} style={{ border: "none", borderTop: "1.5px solid #f1f5f9", margin: "18px 0" }} />);
      i++; continue;
    }
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const { rows, nextIdx } = parseTable(lines, i);
      if (rows.length > 0) {
        const [header, ...body] = rows;
        elements.push(
          <div key={i} style={{ overflowX: "auto", margin: "14px 0", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 340, fontSize: 13 }}>
              <thead>
                <tr style={{ background: "linear-gradient(90deg,#4f46e5,#818cf8)", color: "white" }}>
                  {header.map((cell, ci) => <th key={ci} style={{ padding: "9px 14px", textAlign: "left", fontWeight: 700, fontSize: 12, letterSpacing: "0.04em" }} dangerouslySetInnerHTML={{ __html: inlineParse(cell) }} />)}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => (
                  <tr key={ri} style={{ background: ri % 2 === 0 ? "white" : "#f8f9ff" }}>
                    {row.map((cell, ci) => <td key={ci} style={{ padding: "8px 14px", borderBottom: "1px solid #f1f5f9", color: "#374151" }} dangerouslySetInnerHTML={{ __html: inlineParse(cell) }} />)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        i = nextIdx; continue;
      }
    }
    if (line.startsWith("> ")) {
      elements.push(
        <div key={i} style={{ borderLeft: "3px solid #06b6d4", background: "#ecfeff", borderRadius: "0 12px 12px 0", padding: "11px 16px", margin: "12px 0" }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: "#0891b2", letterSpacing: "0.09em", textTransform: "uppercase" }}>💡 Concept: </span>
          <span style={{ fontStyle: "italic", fontSize: 14, fontWeight: 500, color: "#164e63" }} dangerouslySetInnerHTML={{ __html: inlineParse(line.slice(2)) }} />
        </div>
      );
      i++; continue;
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const items = [];
      while (i < lines.length && (lines[i].trimStart().startsWith("- ") || lines[i].trimStart().startsWith("* "))) {
        const indent = lines[i].length - lines[i].trimStart().length;
        items.push({ text: lines[i].trimStart().slice(2), indent });
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ margin: "6px 0 10px", paddingLeft: 4, listStyleType: "none" }}>
          {items.map((it, idx) => (
            <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 5, paddingLeft: it.indent > 0 ? 16 : 0 }}>
              <span style={{ color: "#4f46e5", fontWeight: 900, fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>•</span>
              <span style={{ fontSize: 14, color: "#374151", lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: inlineParse(it.text) }} />
            </li>
          ))}
        </ul>
      );
      continue;
    }
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
              <span style={{ background: "#4f46e5", color: "white", borderRadius: "50%", width: 22, height: 22, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, marginTop: 2 }}>{it.num}</span>
              <span style={{ fontSize: 14, color: "#374151", lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: inlineParse(it.text) }} />
            </li>
          ))}
        </ol>
      );
      continue;
    }
    if (trimmed === "") { elements.push(<div key={i} style={{ height: 6 }} />); i++; continue; }
    if (trimmed.startsWith("💡") || /^(note:|study tip:|tip:|remember:|important:)/i.test(trimmed)) {
      elements.push(
        <div key={i} style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 12, padding: "11px 16px", margin: "10px 0", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
          <span style={{ fontSize: 14, color: "#92400e", fontWeight: 500, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: inlineParse(trimmed.replace(/^💡\s*/, "").replace(/^(Note:|Study Tip:|Tip:|Remember:|Important:)\s*/i, "")) }} />
        </div>
      );
      i++; continue;
    }
    elements.push(<p key={i} style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, margin: "0 0 10px" }} dangerouslySetInnerHTML={{ __html: inlineParse(trimmed) }} />);
    i++;
  }
  return elements;
}

// ─── MCQs renderer ────────────────────────────────────────────────────────────
function renderMCQs(data) {
  if (!data?.questions?.length) return <p style={{ color: "#94a3b8" }}>No MCQs available.</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {data.questions.map((q, idx) => (
        <div key={idx} style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ background: "linear-gradient(90deg,#4f46e5,#818cf8)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ background: "rgba(255,255,255,0.25)", color: "white", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>Q{idx + 1}</span>
            <span style={{ color: "white", fontWeight: 600, fontSize: 14, lineHeight: 1.5 }}>{q.q}</span>
          </div>
          <div style={{ padding: "12px 16px" }}>
            {q.opts && q.opts.map((opt, oi) => {
              const isCorrect = q.answer && opt.startsWith(q.answer.split(")")[0] + ")");
              return (
                <div key={oi} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 6, padding: "7px 12px", borderRadius: 8, background: isCorrect ? "#f0fdf4" : "#f8fafc", border: `1px solid ${isCorrect ? "#bbf7d0" : "#f1f5f9"}` }}>
                  {isCorrect && <span style={{ color: "#16a34a", fontWeight: 800, flexShrink: 0 }}>✓</span>}
                  <span style={{ fontSize: 13, color: isCorrect ? "#15803d" : "#374151", fontWeight: isCorrect ? 600 : 400 }}>{opt}</span>
                </div>
              );
            })}
            {q.explanation && <div style={{ marginTop: 8, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#92400e" }}><strong>Explanation:</strong> {q.explanation}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Short / Long Answer renderer ────────────────────────────────────────────
function renderAnswers(data, type) {
  if (!data?.questions?.length) return <p style={{ color: "#94a3b8" }}>No {type} available.</p>;
  const color = type === "long" ? "#7c3aed" : "#0891b2";
  const bg = type === "long" ? "#f5f3ff" : "#ecfeff";
  const border = type === "long" ? "#ddd6fe" : "#a5f3fc";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {data.questions.map((q, idx) => (
        <div key={idx} style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ background: `linear-gradient(90deg,${color},${color}cc)`, padding: "10px 16px", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ background: "rgba(255,255,255,0.25)", color: "white", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>Q{idx + 1}</span>
            <div style={{ flex: 1 }}>
              <span style={{ color: "white", fontWeight: 600, fontSize: 14, lineHeight: 1.5 }}>{q.q}</span>
              {q.marks && <span style={{ display: "inline-block", background: "rgba(255,255,255,0.2)", color: "white", fontSize: 10, padding: "2px 8px", borderRadius: 99, fontWeight: 700, marginLeft: 8 }}>{q.marks} marks</span>}
            </div>
          </div>
          <div style={{ padding: "12px 16px" }}>
            <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "#374151", lineHeight: 1.7 }}>
              <span style={{ fontWeight: 700, color, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>📝 Answer</span>
              {q.answer}
            </div>
            {q.key_points && q.key_points.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>Key Points</span>
                <ul style={{ margin: "6px 0 0", paddingLeft: 0, listStyleType: "none" }}>
                  {q.key_points.map((pt, pi) => (
                    <li key={pi} style={{ display: "flex", gap: 8, marginBottom: 4, alignItems: "flex-start" }}>
                      <span style={{ color, fontWeight: 800, fontSize: 14, flexShrink: 0 }}>•</span>
                      <span style={{ fontSize: 13, color: "#475569" }}>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Assertion Reason renderer ────────────────────────────────────────────────
function renderAssertionReason(data) {
  if (!data?.questions?.length) return <p style={{ color: "#94a3b8" }}>No assertion-reason questions available.</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {data.questions.map((q, idx) => (
        <div key={idx} style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ background: "linear-gradient(90deg,#0891b2,#06b6d4)", padding: "8px 16px" }}>
            <span style={{ color: "white", fontWeight: 800, fontSize: 12 }}>Assertion-Reason #{idx + 1}</span>
          </div>
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: "#ede9fe", borderRadius: 10, padding: "10px 14px" }}>
              <span style={{ fontWeight: 700, color: "#4f46e5", fontSize: 12, display: "block", marginBottom: 4 }}>Assertion (A)</span>
              <span style={{ fontSize: 14, color: "#1e1b4b" }}>{q.assertion?.replace(/^Assertion \(A\):\s*/i, "")}</span>
            </div>
            <div style={{ background: "#e0f2fe", borderRadius: 10, padding: "10px 14px" }}>
              <span style={{ fontWeight: 700, color: "#0369a1", fontSize: 12, display: "block", marginBottom: 4 }}>Reason (R)</span>
              <span style={{ fontSize: 14, color: "#0c4a6e" }}>{q.reason?.replace(/^Reason \(R\):\s*/i, "")}</span>
            </div>
            {q.opts && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {q.opts.map((opt, oi) => {
                  const isCorrect = q.answer && opt.toLowerCase().startsWith(q.answer.toLowerCase().charAt(0));
                  return (
                    <div key={oi} style={{ padding: "6px 12px", borderRadius: 8, background: isCorrect ? "#f0fdf4" : "#f8fafc", border: `1px solid ${isCorrect ? "#bbf7d0" : "#f1f5f9"}`, display: "flex", gap: 8, alignItems: "center" }}>
                      {isCorrect && <span style={{ color: "#16a34a", fontWeight: 800 }}>✓</span>}
                      <span style={{ fontSize: 13, color: isCorrect ? "#15803d" : "#374151", fontWeight: isCorrect ? 600 : 400 }}>{opt}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {q.explanation && <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#92400e" }}><strong>Explanation:</strong> {q.explanation}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Case Based renderer ──────────────────────────────────────────────────────
function renderCaseBased(data) {
  if (!data?.cases?.length) return <p style={{ color: "#94a3b8" }}>No case-based questions available.</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {data.cases.map((c, idx) => (
        <div key={idx} style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ background: "linear-gradient(90deg,#d97706,#f59e0b)", padding: "10px 16px" }}>
            <span style={{ color: "white", fontWeight: 800, fontSize: 13 }}>📄 Case Study #{idx + 1}</span>
          </div>
          <div style={{ padding: "14px 16px" }}>
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 14px", fontSize: 14, color: "#374151", lineHeight: 1.7, marginBottom: 14 }}>{c.passage}</div>
            {c.questions && c.questions.map((q, qi) => (
              <div key={qi} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#1e1b4b", marginBottom: 6 }}>Q{qi + 1}. {q.q}</div>
                {q.opts && q.opts.map((opt, oi) => {
                  const isCorrect = q.answer && opt.startsWith(q.answer.charAt(0));
                  return (
                    <div key={oi} style={{ display: "flex", gap: 8, marginBottom: 4, padding: "5px 10px", borderRadius: 7, background: isCorrect ? "#f0fdf4" : "#f8fafc", border: `1px solid ${isCorrect ? "#bbf7d0" : "#f1f5f9"}` }}>
                      {isCorrect && <span style={{ color: "#16a34a", fontWeight: 800 }}>✓</span>}
                      <span style={{ fontSize: 13, color: isCorrect ? "#15803d" : "#374151", fontWeight: isCorrect ? 600 : 400 }}>{opt}</span>
                    </div>
                  );
                })}
                {q.explanation && <div style={{ marginTop: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "6px 10px", fontSize: 12, color: "#166534" }}><strong>Explanation:</strong> {q.explanation}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── PYQ Style renderer ───────────────────────────────────────────────────────
function renderPYQ(data) {
  if (!data?.questions?.length) return <p style={{ color: "#94a3b8" }}>No PYQ-style questions available.</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {data.questions.map((q, idx) => (
        <div key={idx} style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ background: "linear-gradient(90deg,#dc2626,#f87171)", padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "white", fontWeight: 800, fontSize: 12 }}>📜 PYQ Style</span>
            {q.type && <span style={{ background: "rgba(255,255,255,0.2)", color: "white", fontSize: 10, padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>{q.type}</span>}
          </div>
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontWeight: 600, fontSize: 14, color: "#1e1b4b", margin: "0 0 10px", lineHeight: 1.6 }}>{q.q}{q.marks && <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 700, marginLeft: 8 }}>({q.marks} marks)</span>}</p>
            {q.answer && (
              <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 10, padding: "10px 14px", fontSize: 14, color: "#374151", lineHeight: 1.7 }}>
                <span style={{ fontWeight: 700, color: "#dc2626", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 4 }}>✏️ Model Answer</span>
                {q.answer}
              </div>
            )}
            {q.hint && <div style={{ marginTop: 8, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "6px 12px", fontSize: 13, color: "#92400e" }}><strong>Hint:</strong> {q.hint}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Important Concepts renderer ──────────────────────────────────────────────
const CONCEPT_COLORS = {
  "Most Important Fact": { bg: "#fef3c7", border: "#fde68a", color: "#92400e", icon: "⭐" },
  "NCERT Line": { bg: "#ede9fe", border: "#c4b5fd", color: "#4f46e5", icon: "📖" },
  "Board Favourite": { bg: "#dcfce7", border: "#86efac", color: "#15803d", icon: "🏆" },
  "Memory Trick": { bg: "#e0f2fe", border: "#7dd3fc", color: "#0369a1", icon: "🧠" },
  "Common Mistake": { bg: "#fee2e2", border: "#fca5a5", color: "#dc2626", icon: "⚠️" },
  "Units to remember": { bg: "#f3e8ff", border: "#d8b4fe", color: "#7c3aed", icon: "📏" },
};
function renderImportantConcepts(data) {
  if (!data?.concepts?.length) return <p style={{ color: "#94a3b8" }}>No important concepts available.</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {data.concepts.map((c, idx) => {
        const style = CONCEPT_COLORS[c.category] || { bg: "#f8fafc", border: "#e2e8f0", color: "#374151", icon: "📌" };
        return (
          <div key={idx} style={{ background: style.bg, borderRadius: 12, border: `1.5px solid ${style.border}`, padding: "12px 16px" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 16 }}>{style.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: style.color, textTransform: "uppercase", letterSpacing: "0.07em" }}>{c.category}</span>
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>{c.title}</div>
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>{c.description}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Definitions renderer ─────────────────────────────────────────────────────
function renderDefinitions(data) {
  if (!data?.definitions?.length) return <p style={{ color: "#94a3b8" }}>No definitions available.</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {data.definitions.map((def, idx) => (
        <div key={idx} style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
          <div style={{ background: "linear-gradient(90deg,#4f46e5,#818cf8)", padding: "8px 16px" }}>
            <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>📖 {def.term}</span>
          </div>
          <div style={{ padding: "10px 16px" }}>
            <p style={{ margin: "0 0 8px", color: "#374151", fontSize: 14, lineHeight: 1.7 }}>{def.definition}</p>
            {def.example && <div style={{ background: "#f8fafc", padding: "7px 12px", borderRadius: 8, fontSize: 13, color: "#64748b", borderLeft: "3px solid #818cf8" }}><strong>Example:</strong> {def.example}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Formula renderer ─────────────────────────────────────────────────────────
function renderFormulas(data) {
  if (!data?.formulas?.length) return <p style={{ color: "#94a3b8" }}>No formulas available.</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {data.formulas.map((f, idx) => (
        <div key={idx} style={{ background: "#f0fdf4", borderRadius: 14, border: "1.5px solid #bbf7d0", overflow: "hidden" }}>
          <div style={{ padding: "9px 16px", borderBottom: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 800, color: "#15803d", fontSize: 14 }}>⚗️ {f.name}</span>
            <span style={{ fontSize: 10, background: "#dcfce7", color: "#16a34a", padding: "3px 8px", borderRadius: 99, fontWeight: 700 }}>Formula</span>
          </div>
          <div style={{ padding: "12px 16px" }}>
            <div style={{ background: "white", padding: "11px 16px", borderRadius: 10, fontFamily: "monospace", fontSize: 15, color: "#15803d", marginBottom: 10, border: "1px dashed #86efac", textAlign: "center", fontWeight: 700 }}>{f.formula}</div>
            {f.variables && <p style={{ margin: "0 0 4px", color: "#475569", fontSize: 13 }}><strong>Variables: </strong>{f.variables}</p>}
            {f.units && <p style={{ margin: "0 0 4px", color: "#475569", fontSize: 13 }}><strong>Units: </strong>{f.units}</p>}
            {f.notes && <p style={{ margin: 0, color: "#64748b", fontSize: 13, fontStyle: "italic" }}>{f.notes}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Difficulty Tags renderer ─────────────────────────────────────────────────
function renderDifficultyTags(data) {
  if (!data) return <p style={{ color: "#94a3b8" }}>No difficulty info available.</p>;
  const diffColor = { easy: "#16a34a", medium: "#d97706", hard: "#dc2626" };
  const diffBg = { easy: "#dcfce7", medium: "#fef3c7", hard: "#fee2e2" };
  const diff = (data.overall_difficulty || "medium").toLowerCase();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Overall */}
      <div style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Overall Difficulty</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: diffColor[diff] || "#374151", textTransform: "capitalize" }}>{data.overall_difficulty}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 4 }}>Difficulty Score</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: diffColor[diff] || "#374151" }}>{data.difficulty_score}<span style={{ fontSize: 16, color: "#94a3b8" }}>/10</span></div>
        </div>
      </div>
      {/* Topics */}
      {data.topics?.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Topic Breakdown</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.topics.map((t, idx) => {
              const tc = (t.difficulty || "medium").toLowerCase();
              return (
                <div key={idx} style={{ background: "white", borderRadius: 10, border: "1px solid #f1f5f9", padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 14, color: "#374151", fontWeight: 500 }}>{t.name}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {t.weight_percentage && <span style={{ fontSize: 11, color: "#64748b" }}>{t.weight_percentage}% weight</span>}
                    <span style={{ background: diffBg[tc] || "#f1f5f9", color: diffColor[tc] || "#374151", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99 }}>{t.difficulty}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Common errors */}
      {data.common_errors?.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>⚠️ Common Mistakes</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.common_errors.map((e, idx) => (
              <div key={idx} style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#7f1d1d" }}>• {e}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Study Time renderer ──────────────────────────────────────────────────────
function renderStudyTime(data) {
  if (!data) return <p style={{ color: "#94a3b8" }}>No study time info available.</p>;
  const items = [
    { label: "First Reading", minutes: data.first_reading_minutes, icon: "📖", color: "#4f46e5" },
    { label: "Note Making", minutes: data.notes_making_minutes, icon: "✏️", color: "#0891b2" },
    { label: "Revision", minutes: data.revision_minutes, icon: "🔄", color: "#16a34a" },
    { label: "Practice", minutes: data.practice_questions_minutes, icon: "🎯", color: "#d97706" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "linear-gradient(135deg,#4f46e5,#818cf8)", borderRadius: 16, padding: "20px 24px", color: "white", textAlign: "center" }}>
        <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1 }}>{data.total_minutes}</div>
        <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.9, marginTop: 4 }}>Total Minutes Needed</div>
        {data.sessions_recommended && <div style={{ marginTop: 8, background: "rgba(255,255,255,0.2)", borderRadius: 8, padding: "5px 14px", display: "inline-block", fontSize: 12, fontWeight: 700 }}>Recommended: {data.sessions_recommended} sessions</div>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ background: "white", borderRadius: 12, border: "1px solid #f1f5f9", padding: "14px", textAlign: "center", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: item.color }}>{item.minutes}<span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>m</span></div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginTop: 2 }}>{item.label}</div>
          </div>
        ))}
      </div>
      {data.tips?.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>💡 Study Tips</div>
          {data.tips.map((tip, idx) => (
            <div key={idx} style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "9px 14px", fontSize: 13, color: "#92400e", marginBottom: 8 }}>• {tip}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Learning Objectives renderer ─────────────────────────────────────────────
function renderLearningObjectives(data) {
  if (!data) return <p style={{ color: "#94a3b8" }}>No objectives available.</p>;
  const bloom = data.bloom_levels || {};
  const levels = [
    { key: "remember", label: "Remember", icon: "🧠", color: "#4f46e5", bg: "#ede9fe" },
    { key: "understand", label: "Understand", icon: "💡", color: "#0891b2", bg: "#e0f2fe" },
    { key: "apply", label: "Apply", icon: "🔧", color: "#16a34a", bg: "#dcfce7" },
    { key: "analyze", label: "Analyze", icon: "🔍", color: "#d97706", bg: "#fef3c7" },
  ].filter(l => bloom[l.key]?.length);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {levels.map((lvl, idx) => (
        <div key={idx} style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ background: lvl.bg, padding: "8px 16px", borderBottom: `2px solid ${lvl.color}22` }}>
            <span style={{ fontWeight: 800, color: lvl.color, fontSize: 13 }}>{lvl.icon} Bloom's: {lvl.label}</span>
          </div>
          <div style={{ padding: "10px 16px" }}>
            {bloom[lvl.key].map((obj, oi) => (
              <div key={oi} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <span style={{ color: lvl.color, fontWeight: 800, flexShrink: 0 }}>→</span>
                <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{obj}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      {data.board_exam_objectives?.length > 0 && (
        <div style={{ background: "#fef3c7", borderRadius: 14, border: "1.5px solid #fde68a", padding: "12px 16px" }}>
          <div style={{ fontWeight: 800, color: "#92400e", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>🏆 Board Exam Focus</div>
          {data.board_exam_objectives.map((obj, oi) => (
            <div key={oi} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
              <span style={{ color: "#d97706", fontWeight: 800 }}>✦</span>
              <span style={{ fontSize: 13, color: "#374151" }}>{obj}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── NCERT Summary ────────────────────────────────────────────────────────────
function renderNcertSummary(data, subject, selectedClass) {
  if (!data) return <p style={{ color: "#94a3b8" }}>No NCERT summary available.</p>;
  if (data.markdown || typeof data === "string") return renderMarkdown(data, subject, selectedClass);
  if (data.points?.length) {
    return (
      <ul style={{ margin: 0, paddingLeft: 0, listStyleType: "none", display: "flex", flexDirection: "column", gap: 10 }}>
        {data.points.map((pt, idx) => (
          <li key={idx} style={{ background: "white", borderRadius: 12, padding: "10px 16px", border: "1px solid #e2e8f0", display: "flex", gap: 10 }}>
            <span style={{ background: "#4f46e5", color: "white", borderRadius: "50%", width: 22, height: 22, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{idx + 1}</span>
            <span style={{ fontSize: 14, color: "#374151", lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: inlineParse(pt) }} />
          </li>
        ))}
      </ul>
    );
  }
  return renderMarkdown(JSON.stringify(data), subject, selectedClass);
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab definitions
// ─────────────────────────────────────────────────────────────────────────────
const ALL_TABS = [
  { id: "detailed",    label: "Study Guide",     icon: "📚", key: "detailed_notes" },
  { id: "short",       label: "Quick Notes",     icon: "⚡", key: "short_notes" },
  { id: "ncert",       label: "NCERT Summary",   icon: "📝", key: "ncert_summary" },
  { id: "definitions", label: "Definitions",     icon: "📖", key: "key_definitions" },
  { id: "formulas",    label: "Formulas",        icon: "🧮", key: "formula_sheet" },
  { id: "concepts",    label: "Key Concepts",    icon: "💡", key: "important_concepts" },
  { id: "objectives",  label: "Objectives",      icon: "🎯", key: "learning_objectives" },
  { id: "mcqs",        label: "MCQs",            icon: "✅", key: "mcqs" },
  { id: "short_ans",   label: "Short Answers",   icon: "📋", key: "short_answer" },
  { id: "long_ans",    label: "Long Answers",    icon: "📄", key: "long_answer" },
  { id: "assertion",   label: "Assertion-Reason",icon: "⚖️", key: "assertion_reason" },
  { id: "case",        label: "Case Study",      icon: "📑", key: "case_based" },
  { id: "pyq",         label: "PYQ Style",       icon: "📜", key: "pyq_style" },
  { id: "difficulty",  label: "Difficulty",      icon: "📊", key: "difficulty_tags" },
  { id: "studytime",   label: "Study Plan",      icon: "⏱️", key: "estimated_study_time" },
];

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
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <LoadingScreen message={loadMsg} emoji={loadEmoji} />
      </div>
    );
  }

  const isModular = notes && typeof notes === "object" && notes.isModular;
  const tabs = isModular
    ? ALL_TABS.filter(t => !!notes[t.key])
    : [];

  const currentTabId = tabs.find(t => t.id === activeTab)
    ? activeTab
    : tabs.length > 0 ? tabs[0].id : "detailed";

  function renderTabContent() {
    if (!isModular) return renderMarkdown(notes, subject, selectedClass);
    const n = notes;
    switch (currentTabId) {
      case "detailed":    return renderMarkdown(n.detailed_notes, subject, selectedClass);
      case "short":       return renderMarkdown(n.short_notes, subject, selectedClass);
      case "ncert":       return renderNcertSummary(n.ncert_summary, subject, selectedClass);
      case "definitions": return renderDefinitions(n.key_definitions);
      case "formulas":    return renderFormulas(n.formula_sheet);
      case "concepts":    return renderImportantConcepts(n.important_concepts);
      case "objectives":  return renderLearningObjectives(n.learning_objectives);
      case "mcqs":        return renderMCQs(n.mcqs);
      case "short_ans":   return renderAnswers(n.short_answer, "short");
      case "long_ans":    return renderAnswers(n.long_answer, "long");
      case "assertion":   return renderAssertionReason(n.assertion_reason);
      case "case":        return renderCaseBased(n.case_based);
      case "pyq":         return renderPYQ(n.pyq_style);
      case "difficulty":  return renderDifficultyTags(n.difficulty_tags);
      case "studytime":   return renderStudyTime(n.estimated_study_time);
      default:            return null;
    }
  }

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", fontFamily: "'Outfit','Inter',sans-serif" }}>

      {/* ── Action bar ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, gap: 10 }}>
        <button
          onClick={() => window.print()}
          style={{ background: "white", border: "1.5px solid rgba(0,0,0,0.08)", borderRadius: 10, padding: "8px 16px", color: "#64748b", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#4f46e5"; e.currentTarget.style.color = "#4f46e5"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)"; e.currentTarget.style.color = "#64748b"; }}
        >📥 PDF</button>
        <button
          onClick={onStartQuiz}
          style={{ background: "linear-gradient(135deg,#4f46e5,#818cf8)", border: "none", borderRadius: 10, padding: "10px 22px", color: "white", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 14px rgba(79,70,229,0.3)", cursor: "pointer", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
        >Take Quiz →</button>
      </div>

      {/* ── Tab strip ── */}
      {isModular && tabs.length > 0 && (
        <div style={{ overflowX: "auto", marginBottom: 18, scrollbarWidth: "none", msOverflowStyle: "none" }}>
          <div style={{ display: "flex", gap: 7, paddingBottom: 10, minWidth: "max-content" }}>
            {tabs.map(tab => {
              const isActive = currentTabId === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: "8px 15px", borderRadius: 11, border: "none",
                    background: isActive ? "#4f46e5" : "white",
                    color: isActive ? "white" : "#64748b",
                    fontWeight: 700, fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap",
                    boxShadow: isActive ? "0 4px 14px rgba(79,70,229,0.25)" : "0 1px 3px rgba(0,0,0,0.06)",
                    transition: "all 0.18s",
                    transform: isActive ? "translateY(-1px)" : "translateY(0)",
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Content card ── */}
      <div
        id="printable-content"
        style={{ background: "white", borderRadius: 18, border: "1px solid #f1f5f9", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", padding: "28px 30px", minHeight: "60vh" }}
      >
        {renderTabContent()}
      </div>

      {/* ── Bottom CTA ── */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 28, paddingBottom: 20 }}>
        <button
          onClick={onStartQuiz}
          style={{ background: "linear-gradient(135deg,#4f46e5,#818cf8)", border: "none", borderRadius: 14, padding: "14px 40px", color: "white", fontSize: 15, fontWeight: 800, boxShadow: "0 6px 20px rgba(79,70,229,0.3)", cursor: "pointer", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(79,70,229,0.4)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(79,70,229,0.3)"; }}
        >🧠 Start Quiz →</button>
      </div>
    </div>
  );
});
