import { memo, useState, useEffect } from "react";
import { getChapterNotes } from "../../utils/supabase";
import { getCachedNotes, cacheNotes } from "../../utils/cacheManager";

// ─── Inline markdown (bold, italic, code, LaTeX) ──────────────────────────────
function inlineParse(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code style=\"background:rgba(79,70,229,0.06);padding:2px 6px;border-radius:5px;font-size:0.88em;font-family:monospace;color:#4f46e5\">$1</code>")
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

// ─── Mocks & Helpers ──────────────────────────────────────────────────────────
const FALLBACK_STUDY_TIME = {
  total_minutes: 120,
  first_reading_minutes: 45,
  notes_making_minutes: 30,
  revision_minutes: 20,
  practice_questions_minutes: 25,
  sessions_recommended: 3,
  tips: [
    "Focus on primary textbook definitions before numerical solving.",
    "Practice deriving laws step-by-step to lock in formula memories.",
    "Allocate 15 minutes at the end of each session for active recall.",
  ]
};

const FALLBACK_DIFFICULTY = {
  overall_difficulty: "Medium",
  difficulty_score: 6,
  topics: [
    { name: "Core Concepts & Intro", difficulty: "Easy", weight_percentage: 25 },
    { name: "Derivations & Laws", difficulty: "Medium", weight_percentage: 45 },
    { name: "Applications & Problems", difficulty: "Hard", weight_percentage: 30 },
  ],
  common_errors: [
    "Confusing base formulas in numerical applications.",
    "Skipping the qualitative explanation of key derivations.",
    "Writing incorrect SI units in final answers."
  ]
};

const CONCEPT_COLORS = {
  "Most Important Fact": { bg: "#fef3c7", border: "#fde68a", color: "#92400e", icon: "⭐" },
  "NCERT Line": { bg: "#ede9fe", border: "#c4b5fd", color: "#4f46e5", icon: "📖" },
  "Board Favourite": { bg: "#dcfce7", border: "#86efac", color: "#15803d", icon: "🏆" },
  "Memory Trick": { bg: "#e0f2fe", border: "#7dd3fc", color: "#0369a1", icon: "🧠" },
  "Common Mistake": { bg: "#fee2e2", border: "#fca5a5", color: "#dc2626", icon: "⚠️" },
};

// ─── Inline Accordion List for Subjective Practice ────────────────────────────
function SubjectivePractice({ data, title, type }) {
  const [openIdx, setOpenIdx] = useState(null);
  if (!data?.questions?.length) return <p style={{ color: "#94a3b8", fontSize: 13 }}>No practice questions loaded yet.</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1e1b4b", marginBottom: 4 }}>{title}</h3>
      {data.questions.map((q, idx) => (
        <div key={idx} style={{ background: "white", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.02)" }}>
          <button
            onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
            style={{
              width: "100%", textAlign: "left", background: "none", border: "none",
              padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", lineHeight: 1.5 }}>
              Q{idx + 1}. {q.q}
            </span>
            <span style={{ fontSize: 12, background: "#ede9fe", color: "#4f46e5", padding: "2px 8px", borderRadius: 99, fontWeight: 700, flexShrink: 0 }}>
              {openIdx === idx ? "Hide Answer" : "Reveal Answer"}
            </span>
          </button>
          {openIdx === idx && (
            <div style={{ padding: "0 16px 16px", borderTop: "1px solid #f1f5f9", background: "#f8fafc" }}>
              <div style={{ height: 12 }} />
              <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Model Answer</span>
              <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.7, margin: 0 }}>{q.answer}</p>
              {q.key_points?.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <span style={{ display: "block", fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Key Evaluation Points</span>
                  <ul style={{ paddingLeft: 16, margin: 0 }}>
                    {q.key_points.map((pt, pi) => <li key={pi} style={{ fontSize: 13, color: "#475569", marginBottom: 3 }}>{pt}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const ChapterView = memo(function ChapterView({
  chapter, subject, selectedClass, curriculumData, notesRead, quizBest, availableSets = [], onStartQuiz, theme
}) {
  const [notesData, setNotesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("learn");
  const [activeReader, setActiveReader] = useState(null); // { title: string, render: () => JSX }
  const [activePracticeSub, setActivePracticeSub] = useState(null); // { title: string, comp: JSX }
  const [streakCount] = useState(() => {
    try {
      const streak = JSON.parse(localStorage.getItem("loginStreak") || "{}");
      return streak.current || 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      try {
        const local = getCachedNotes(selectedClass, subject, chapter);
        if (local) {
          if (active) {
            setNotesData(local);
            setLoading(false);
          }
          return;
        }
        const dbNotes = await getChapterNotes(selectedClass, subject, chapter);
        if (dbNotes && active) {
          setNotesData(dbNotes);
          cacheNotes(selectedClass, subject, chapter, dbNotes, 1440);
        }
      } catch (err) {
        console.error("Error loading chapter data:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, [selectedClass, subject, chapter]);

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
        {/* Hero Skeleton */}
        <div className="skeleton-pulse" style={{ height: 160, borderRadius: 20, background: "#e2e8f0", marginBottom: 24 }} />
        {/* Tab strip Skeleton */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-pulse" style={{ height: 42, width: 100, borderRadius: 99, background: "#e2e8f0" }} />
          ))}
        </div>
        {/* Cards Skeleton */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-pulse" style={{ height: 90, borderRadius: 16, background: "#e2e8f0" }} />
          ))}
        </div>
      </div>
    );
  }

  const n = notesData || {};
  const studyTime = n.estimated_study_time || FALLBACK_STUDY_TIME;
  const diffTags = n.difficulty_tags || FALLBACK_DIFFICULTY;
  const quizSetCount = availableSets.length;
  
  // Calculate completion percentage
  const readProgress = notesRead ? 50 : 0;
  const quizProgress = quizBest !== undefined ? Math.round((quizBest / 30) * 50) : 0;
  const totalCompletion = readProgress + quizProgress;

  // Board Exam Weightage Estimation
  const boardWeightage = subject === "Physics" || subject === "Chemistry" || subject === "Biology" || subject === "Mathematics"
    ? "8-10% of Board Exam"
    : "5-7% of Board Exam";

  // Tab Definitions
  const tabs = [
    { id: "learn", label: "Learn", icon: "📖" },
    { id: "practice", label: "Practice", icon: "📝" },
    { id: "revision", label: "Quick Revision", icon: "⚡" },
    { id: "planner", label: "Study Planner", icon: "📅" },
  ];

  // Helper to open light box reader
  const openReader = (title, renderFn) => {
    setActiveReader({ title, render: renderFn });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 10px", fontFamily: "'Outfit','Inter',sans-serif" }}>
      
      {/* ─── Styles injection ─── */}
      <style dangerouslySetInnerHTML={{ __html: `
        .skeleton-pulse {
          animation: pulse 1.5s infinite ease-in-out;
        }
        .concept-pill {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 99px;
          margin-bottom: 6px;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* ─── Lightbox / Document Reader View ─── */}
      {activeReader && (
        <div style={{ background: "white", borderRadius: 20, border: "1px solid #f1f5f9", boxShadow: "0 4px 30px rgba(0,0,0,0.06)", padding: "24px 20px", marginBottom: 30, animation: "fadeIn 0.3s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1.5px solid #f1f5f9", paddingBottom: 14, marginBottom: 20 }}>
            <button
              onClick={() => setActiveReader(null)}
              style={{ background: "rgba(79,70,229,0.08)", border: "none", borderRadius: 10, padding: "8px 16px", color: "#4f46e5", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
            >
              ← Back to Overview
            </button>
            <button
              onClick={() => window.print()}
              style={{ background: "white", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: "8px 14px", color: "#64748b", fontWeight: 700, fontSize: 13 }}
            >
              📥 PDF / Print
            </button>
          </div>
          <div id="printable-content" className="prose-notes">
            {activeReader.render()}
          </div>
        </div>
      )}

      {/* ─── Sub-Practice subjective Q&A view ─── */}
      {activePracticeSub && !activeReader && (
        <div style={{ background: "white", borderRadius: 20, border: "1px solid #f1f5f9", boxShadow: "0 4px 30px rgba(0,0,0,0.06)", padding: "24px 20px", marginBottom: 30, animation: "fadeIn 0.3s" }}>
          <div style={{ marginBottom: 18 }}>
            <button
              onClick={() => setActivePracticeSub(null)}
              style={{ background: "rgba(79,70,229,0.08)", border: "none", borderRadius: 10, padding: "8px 16px", color: "#4f46e5", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
            >
              ← Back to Practice
            </button>
          </div>
          {activePracticeSub.comp}
        </div>
      )}

      {/* ─── Main chapter view (when reader is closed) ─── */}
      {!activeReader && !activePracticeSub && (
        <div>
          {/* ── 1. Chapter Overview Hero ── */}
          <div style={{
            background: "white", borderRadius: 24, border: "1px solid rgba(79,70,229,0.06)",
            padding: "24px 20px", boxShadow: "0 4px 20px rgba(79,70,229,0.05)",
            marginBottom: 20, position: "relative", overflow: "hidden"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <span style={{ fontSize: 11, background: "#ede9fe", color: "#4f46e5", fontWeight: 800, padding: "3px 10px", borderRadius: 99, textTransform: "uppercase" }}>{subject}</span>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: "6px 0 2px" }}>{chapter}</h1>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Class {selectedClass} CBSE Syllabus</span>
              </div>
              {streakCount > 0 && (
                <div style={{ background: "#fff7ed", padding: "6px 12px", borderRadius: 14, border: "1px solid #ffedd5", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: "#ea580c" }}>{streakCount} Days</span>
                  <span>🔥</span>
                </div>
              )}
            </div>

            {/* Quick stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, margin: "16px 0", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9", padding: "12px 0" }}>
              <div style={{ textAlign: "center" }}>
                <span style={{ display: "block", fontSize: 18, marginBottom: 2 }}>⏱️</span>
                <span style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{studyTime.total_minutes} mins</span>
                <span style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>Study Time</span>
              </div>
              <div style={{ textAlign: "center", borderLeft: "1px solid #f1f5f9", borderRight: "1px solid #f1f5f9" }}>
                <span style={{ display: "block", fontSize: 18, marginBottom: 2 }}>📊</span>
                <span style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#d97706" }}>{diffTags.overall_difficulty}</span>
                <span style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>Difficulty</span>
              </div>
              <div style={{ textAlign: "center" }}>
                <span style={{ display: "block", fontSize: 18, marginBottom: 2 }}>🏆</span>
                <span style={{ display: "block", fontSize: 13, fontWeight: 800, color: "#16a34a" }}>{boardWeightage}</span>
                <span style={{ fontSize: 10, color: "#64748b", fontWeight: 600 }}>Weightage</span>
              </div>
            </div>

            {/* Readiness progress bar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#4f46e5" }}>PREPARATION READINESS INDEX</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: "#4f46e5" }}>{totalCompletion}%</span>
              </div>
              <div style={{ height: 8, background: "#ede9fe", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${totalCompletion}%`, background: "linear-gradient(90deg, #4f46e5, #818cf8)", borderRadius: 99, transition: "width 0.4s ease" }} />
              </div>
            </div>

            {/* Continue/Start learning button */}
            <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
              <button
                onClick={() => {
                  if (totalCompletion < 50) {
                    setActiveTab("learn");
                    openReader("Detailed Study Guide", () => renderMarkdown(n.detailed_notes, subject, selectedClass));
                  } else {
                    setActiveTab("practice");
                  }
                }}
                style={{
                  flex: 1, background: "linear-gradient(135deg, #4f46e5, #818cf8)", border: "none", borderRadius: 12,
                  padding: "12px", color: "white", fontSize: 14, fontWeight: 800, cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(79,70,229,0.3)"
                }}
              >
                {totalCompletion === 0 ? "🚀 Start Learning" : totalCompletion >= 100 ? "🔄 Revise Chapter" : "⚡ Continue Learning"}
              </button>
            </div>
          </div>

          {/* ─── Tab Bar Navigation ─── */}
          <div className="hide-scrollbar" style={{ overflowX: "auto", display: "flex", gap: 6, marginBottom: 18, paddingBottom: 6 }}>
            {tabs.map(t => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    padding: "10px 18px", borderRadius: 99, border: "none", fontSize: 13, fontWeight: 800, cursor: "pointer",
                    background: active ? "#4f46e5" : "white", color: active ? "white" : "#64748b",
                    boxShadow: active ? "0 4px 12px rgba(79,70,229,0.2)" : "0 1px 3px rgba(0,0,0,0.05)",
                    transition: "all 0.2s", whiteSpace: "nowrap"
                  }}
                >
                  {t.icon} {t.label}
                </button>
              );
            })}
          </div>

          {/* ─── 2. LEARN Tab Content ─── */}
          {activeTab === "learn" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "fadeIn 0.2s" }}>
              
              {/* Introduction card */}
              {n.ncert_summary && (
                <div style={{ background: "#eff6ff", borderRadius: 16, border: "1px solid #bfdbfe", padding: 16 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 16 }}>📝</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#1d4ed8", letterSpacing: "0.06em", textTransform: "uppercase" }}>NCERT Introduction Summary</span>
                  </div>
                  <p style={{ fontSize: 13.5, color: "#1e40af", lineHeight: 1.6, margin: 0 }}>
                    {typeof n.ncert_summary === "string" ? n.ncert_summary.split("\n")[0] : n.ncert_summary.markdown?.split("\n")[0] || "Get a fast foundation with this condensed NCERT overview."}
                  </p>
                </div>
              )}

              {/* Study Timeline checklist */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                
                <button
                  onClick={() => openReader("Chapter Objectives", () => renderMarkdown(JSON.stringify(n.learning_objectives || {}), subject, selectedClass))}
                  style={{ width: "100%", border: "none", background: "white", borderRadius: 16, padding: 16, display: "flex", gap: 12, alignItems: "center", textAlign: "left", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}
                >
                  <div style={{ width: 40, height: 40, background: "#ecfdf5", color: "#10b981", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🎯</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Step 1: Learning Objectives</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Why study this chapter & CBSE board expectations.</div>
                  </div>
                  <span style={{ color: "#94a3b8" }}>→</span>
                </button>

                <button
                  onClick={() => openReader("Detailed Study Guide", () => renderMarkdown(n.detailed_notes, subject, selectedClass))}
                  style={{ width: "100%", border: "none", background: "white", borderRadius: 16, padding: 16, display: "flex", gap: 12, alignItems: "center", textAlign: "left", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}
                >
                  <div style={{ width: 40, height: 40, background: "#f5f3ff", color: "#7c3aed", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>📚</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Step 2: Detailed Study Guide</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>The core notes, derivations, and comprehensive topics.</div>
                  </div>
                  {notesRead && <span style={{ color: "#16a34a", fontSize: 14, fontWeight: 800 }}>✓</span>}
                  <span style={{ color: "#94a3b8", marginLeft: 4 }}>→</span>
                </button>

                <button
                  onClick={() => openReader("Important Board Concepts", () => renderMarkdown(JSON.stringify(n.important_concepts || {}), subject, selectedClass))}
                  style={{ width: "100%", border: "none", background: "white", borderRadius: 16, padding: 16, display: "flex", gap: 12, alignItems: "center", textAlign: "left", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}
                >
                  <div style={{ width: 40, height: 40, background: "#fffbeb", color: "#f59e0b", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>💡</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Step 3: Important Concepts</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Gauss's law, superposition principles, high-weightage rules.</div>
                  </div>
                  <span style={{ color: "#94a3b8" }}>→</span>
                </button>

                <button
                  onClick={() => openReader("Formula Sheet & Units", () => renderMarkdown(JSON.stringify(n.formula_sheet || {}), subject, selectedClass))}
                  style={{ width: "100%", border: "none", background: "white", borderRadius: 16, padding: 16, display: "flex", gap: 12, alignItems: "center", textAlign: "left", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}
                >
                  <div style={{ width: 40, height: 40, background: "#eff6ff", color: "#3b82f6", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🧮</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Step 4: Formulas & Derivations</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Quick equations sheet, variables dictionary, and SI units.</div>
                  </div>
                  <span style={{ color: "#94a3b8" }}>→</span>
                </button>

                <button
                  onClick={() => openReader("Key Glossary Definitions", () => renderMarkdown(JSON.stringify(n.key_definitions || {}), subject, selectedClass))}
                  style={{ width: "100%", border: "none", background: "white", borderRadius: 16, padding: 16, display: "flex", gap: 12, alignItems: "center", textAlign: "left", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}
                >
                  <div style={{ width: 40, height: 40, background: "#fdf2f8", color: "#ec4899", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>📖</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Step 5: Glossary & Definitions</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Must-remember definitions and examples for boards.</div>
                  </div>
                  <span style={{ color: "#94a3b8" }}>→</span>
                </button>

              </div>
            </div>
          )}

          {/* ─── 3. PRACTICE Tab Content ─── */}
          {activeTab === "practice" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "fadeIn 0.2s" }}>
              
              {/* Group A: Interactive assessments */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <button
                  onClick={onStartQuiz}
                  style={{ border: "none", background: "white", borderRadius: 16, padding: 16, textAlign: "left", display: "flex", flexDirection: "column", gap: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}
                >
                  <div style={{ fontSize: 22 }}>✅</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>MCQs Practice</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{quizSetCount || 15} Interactive MCQ Sets</div>
                  {quizBest !== undefined && <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>Best Score: {quizBest}/30</div>}
                </button>
                <button
                  onClick={() => setActivePracticeSub({ title: "Case Study Practice", comp: renderCaseBased(n.case_based) })}
                  style={{ border: "none", background: "white", borderRadius: 16, padding: 16, textAlign: "left", display: "flex", flexDirection: "column", gap: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}
                >
                  <div style={{ fontSize: 22 }}>📑</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Case-Based Passage</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>CBSE pattern read and solve questions</div>
                </button>
              </div>

              {/* Group B: Subjective board questions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                
                <button
                  onClick={() => setActivePracticeSub({ title: "Short Answer Bank", comp: <SubjectivePractice data={n.short_answer} title="Short Answers" type="short" /> })}
                  style={{ width: "100%", border: "none", background: "white", borderRadius: 16, padding: 16, display: "flex", gap: 12, alignItems: "center", textAlign: "left", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}
                >
                  <div style={{ width: 36, height: 36, background: "#ecfeff", color: "#0891b2", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📋</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Short Answers (1-3 Marks)</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Interactive tap-to-reveal subjective answers</div>
                  </div>
                  <span style={{ color: "#94a3b8" }}>→</span>
                </button>

                <button
                  onClick={() => setActivePracticeSub({ title: "Long Answer Bank", comp: <SubjectivePractice data={n.long_answer} title="Long Answers" type="long" /> })}
                  style={{ width: "100%", border: "none", background: "white", borderRadius: 16, padding: 16, display: "flex", gap: 12, alignItems: "center", textAlign: "left", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}
                >
                  <div style={{ width: 36, height: 36, background: "#f5f3ff", color: "#7c3aed", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📄</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Long Answers (5 Marks)</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Step-by-step model board solutions</div>
                  </div>
                  <span style={{ color: "#94a3b8" }}>→</span>
                </button>

                <button
                  onClick={() => setActivePracticeSub({ title: "Past Year Style Bank", comp: renderPYQ(n.pyq_style) })}
                  style={{ width: "100%", border: "none", background: "white", borderRadius: 16, padding: 16, display: "flex", gap: 12, alignItems: "center", textAlign: "left", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}
                >
                  <div style={{ width: 36, height: 36, background: "#fff1f2", color: "#dc2626", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📜</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>PYQ Style Questions</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Actual board-based past year papers format</div>
                  </div>
                  <span style={{ color: "#94a3b8" }}>→</span>
                </button>

                <button
                  onClick={() => setActivePracticeSub({ title: "Assertion & Reason Bank", comp: renderAssertionReason(n.assertion_reason) })}
                  style={{ width: "100%", border: "none", background: "white", borderRadius: 16, padding: 16, display: "flex", gap: 12, alignItems: "center", textAlign: "left", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}
                >
                  <div style={{ width: 36, height: 36, background: "#e0f2fe", color: "#0284c7", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>⚖️</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Assertion & Reason</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Test logical analysis skills</div>
                  </div>
                  <span style={{ color: "#94a3b8" }}>→</span>
                </button>

              </div>
            </div>
          )}

          {/* ─── 4. REVISION Tab Content ─── */}
          {activeTab === "revision" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "fadeIn 0.2s" }}>
              
              {/* Short revision notes box */}
              <button
                onClick={() => openReader("Quick Revision Notes", () => renderMarkdown(n.short_notes, subject, selectedClass))}
                style={{ width: "100%", border: "none", background: "white", borderRadius: 16, padding: 16, display: "flex", gap: 12, alignItems: "center", textAlign: "left", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}
              >
                <div style={{ width: 36, height: 36, background: "#fef3c7", color: "#d97706", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>⚡</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Short Notes (1 Page Cheat Sheet)</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>High impact revision notes for last-minute recall.</div>
                </div>
                <span style={{ color: "#94a3b8" }}>→</span>
              </button>

              {/* Mnemonic / Mind trick cards */}
              {n.important_concepts?.concepts?.filter(c => c.category === "Memory Trick" || c.category === "Board Favourite").slice(0, 2).map((c, idx) => {
                const style = CONCEPT_COLORS[c.category] || CONCEPT_COLORS["Memory Trick"];
                return (
                  <div key={idx} style={{ background: style.bg, borderRadius: 14, border: `1.5px solid ${style.border}`, padding: 16 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 14 }}>{style.icon}</span>
                      <span style={{ fontSize: 10, fontWeight: 800, color: style.color, letterSpacing: "0.06em", textTransform: "uppercase" }}>{c.category}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: "#0f172a", marginBottom: 4 }}>{c.title}</div>
                    <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: inlineParse(c.description) }} />
                  </div>
                );
              })}

              {/* Common mistakes section */}
              {diffTags.common_errors?.length > 0 && (
                <div style={{ background: "#fef2f2", borderRadius: 16, border: "1.5px solid #fecdd3", padding: 16 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 18 }}>⚠️</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#b91c1c", letterSpacing: "0.06em", textTransform: "uppercase" }}>Common Mistakes in Board Exams</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {diffTags.common_errors.map((err, idx) => (
                      <div key={idx} style={{ fontSize: 13, color: "#991b1b", display: "flex", gap: 6 }}>
                        <span style={{ fontWeight: 800 }}>•</span>
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ─── 5. STUDY PLANNER Tab Content ─── */}
          {activeTab === "planner" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "fadeIn 0.2s" }}>
              
              {/* Study time split rings */}
              <div style={{ background: "white", borderRadius: 16, border: "1px solid #f1f5f9", padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1e1b4b", marginBottom: 12 }}>Time Budget Allocation</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                      <span>📖 Learning Concept Time</span>
                      <span style={{ color: "#4f46e5" }}>{studyTime.first_reading_minutes} mins</span>
                    </div>
                    <div style={{ height: 6, background: "#f1f5f9", borderRadius: 99 }}>
                      <div style={{ height: "100%", width: `${(studyTime.first_reading_minutes/studyTime.total_minutes)*100}%`, background: "#4f46e5", borderRadius: 99 }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                      <span>📝 Practice Questions</span>
                      <span style={{ color: "#0891b2" }}>{studyTime.practice_questions_minutes} mins</span>
                    </div>
                    <div style={{ height: 6, background: "#f1f5f9", borderRadius: 99 }}>
                      <div style={{ height: "100%", width: `${(studyTime.practice_questions_minutes/studyTime.total_minutes)*100}%`, background: "#0891b2", borderRadius: 99 }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>
                      <span>⚡ Revision & Recall</span>
                      <span style={{ color: "#d97706" }}>{studyTime.revision_minutes} mins</span>
                    </div>
                    <div style={{ height: 6, background: "#f1f5f9", borderRadius: 99 }}>
                      <div style={{ height: "100%", width: `${(studyTime.revision_minutes/studyTime.total_minutes)*100}%`, background: "#d97706", borderRadius: 99 }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommended timeline map */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1e1b4b", marginBottom: 2 }}>Suggested Sessions Timeline</h3>
                
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#4f46e5", color: "white", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>1</div>
                    <div style={{ width: 2, flex: 1, background: "#cbd5e1" }} />
                  </div>
                  <div style={{ paddingBottom: 14 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>Session 1: Concept Builder</div>
                    <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 2 }}>Read Detailed Notes & objectives. Define glossary keywords.</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#0891b2", color: "white", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>2</div>
                    <div style={{ width: 2, flex: 1, background: "#cbd5e1" }} />
                  </div>
                  <div style={{ paddingBottom: 14 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>Session 2: Active Practice</div>
                    <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 2 }}>Take MCQs quiz, read Case Study, solve Short Answer accordions.</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#d97706", color: "white", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>3</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: "#0f172a" }}>Session 3: Board Drill & Revision</div>
                    <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 2 }}>Examine long answer model answers, memorize formulas, and read common mistake guides.</div>
                  </div>
                </div>

              </div>

              {/* Planner tips */}
              {studyTime.tips?.length > 0 && (
                <div style={{ background: "#f0fdf4", border: "1.5px solid #bbf7d0", borderRadius: 16, padding: 16 }}>
                  <div style={{ fontWeight: 800, color: "#166534", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>💡 Study Strategy Tips</div>
                  {studyTime.tips.map((tip, idx) => (
                    <div key={idx} style={{ fontSize: 13, color: "#15803d", marginBottom: 6, display: "flex", gap: 6 }}>
                      <span style={{ fontWeight: 800 }}>•</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>
      )}

      <div style={{ height: 24 }} />
    </div>
  );
});
