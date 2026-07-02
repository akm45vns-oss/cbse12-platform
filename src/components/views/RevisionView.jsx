import { memo, useState, useEffect } from "react";
import { getChapterNotes } from "../../utils/supabase";
import { getCachedNotes, cacheNotes } from "../../utils/cacheManager";

function inlineParse(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

const CONCEPT_COLORS = {
  "Most Important Fact": { bg: "#fef3c7", border: "#fde68a", color: "#92400e", icon: "⭐" },
  "NCERT Line": { bg: "#ede9fe", border: "#c4b5fd", color: "#4f46e5", icon: "📖" },
  "Board Favourite": { bg: "#dcfce7", border: "#86efac", color: "#15803d", icon: "🏆" },
  "Memory Trick": { bg: "#e0f2fe", border: "#7dd3fc", color: "#0369a1", icon: "🧠" },
  "Common Mistake": { bg: "#fee2e2", border: "#fca5a5", color: "#dc2626", icon: "⚠️" },
};

function SectionBlock({ title, icon, children, accent = "#4f46e5" }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: `${accent}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{icon}</div>
        <span style={{ fontSize: 14, fontWeight: 900, color: "#0f172a" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function SkeletonBlock() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {[1,2,3].map(i => (
        <div key={i} style={{ height: 72, borderRadius: 14, background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
      ))}
    </div>
  );
}

export const RevisionView = memo(function RevisionView({
  chapter, subject, selectedClass, theme, onGoToPractice,
}) {
  const [notesData, setNotesData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      try {
        const local = getCachedNotes(selectedClass, subject, chapter);
        if (local) { if (active) { setNotesData(local); setLoading(false); } return; }
        const dbNotes = await getChapterNotes(selectedClass, subject, chapter);
        if (dbNotes && active) { setNotesData(dbNotes); cacheNotes(selectedClass, subject, chapter, dbNotes, 1440); }
      } catch (err) { console.error("RevisionView: error loading:", err); }
      finally { if (active) setLoading(false); }
    }
    loadData();
    return () => { active = false; };
  }, [selectedClass, subject, chapter]);

  const n = notesData || {};
  const diffTags = n.difficulty_tags || {};

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", fontFamily: "'Outfit','Inter',sans-serif" }}>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>

      {/* Banner */}
      <div style={{
        background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
        borderRadius: 20, padding: "16px", marginBottom: 20,
        color: "white", boxShadow: "0 4px 20px rgba(217,119,6,0.25)", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.8, marginBottom: 4 }}>
          ⚡ Quick Revision · {subject}
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 900, margin: "0 0 10px", lineHeight: 1.25 }}>{chapter}</h1>
        <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 99, padding: "2px 8px", fontSize: 10, fontWeight: 700, display: "inline-block" }}>
          Last-minute revision mode
        </div>
      </div>

      {loading ? <SkeletonBlock /> : (
        <>
          {/* Quick Notes */}
          {n.short_notes && (
            <SectionBlock title="1-Page Cheat Sheet" icon="⚡" accent="#d97706">
              <div style={{ background: "white", borderRadius: 16, border: "1.5px solid #fde68a", padding: "18px 18px", boxShadow: "0 2px 10px rgba(217,119,6,0.06)" }}>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.85 }} dangerouslySetInnerHTML={{ __html: typeof n.short_notes === "string" ? inlineParse(n.short_notes) : inlineParse(n.short_notes?.markdown || JSON.stringify(n.short_notes)) }} />
              </div>
            </SectionBlock>
          )}

          {/* Formulas */}
          {n.formula_sheet?.formulas?.length > 0 && (
            <SectionBlock title="Formula Quick-Reference" icon="⚗️" accent="#059669">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {n.formula_sheet.formulas.map((f, i) => (
                  <div key={i} style={{ background: "#f0fdf4", borderRadius: 12, border: "1.5px solid #bbf7d0", padding: "10px 14px", display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ background: "white", borderRadius: 8, padding: "6px 12px", fontFamily: "monospace", fontSize: 14, color: "#15803d", fontWeight: 800, flexShrink: 0 }}>{f.formula}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{f.name}</div>
                      {f.units && <div style={{ fontSize: 11, color: "#64748b" }}>{f.units}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </SectionBlock>
          )}

          {/* Important Concepts */}
          {n.important_concepts?.concepts?.length > 0 && (
            <SectionBlock title="Key Concepts to Remember" icon="💡" accent="#7c3aed">
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {n.important_concepts.concepts.map((c, i) => {
                  const style = CONCEPT_COLORS[c.category] || { bg: "#f8fafc", border: "#e2e8f0", color: "#374151", icon: "📌" };
                  return (
                    <div key={i} style={{ background: style.bg, borderRadius: 12, border: `1.5px solid ${style.border}`, padding: "12px 14px" }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                        <span>{style.icon}</span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: style.color, textTransform: "uppercase", letterSpacing: "0.07em" }}>{c.category}</span>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: "#0f172a", marginBottom: 3 }}>{c.title}</div>
                      <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: inlineParse(c.description) }} />
                    </div>
                  );
                })}
              </div>
            </SectionBlock>
          )}

          {/* Key Definitions */}
          {n.key_definitions?.definitions?.length > 0 && (
            <SectionBlock title="Must-Know Definitions" icon="📖" accent="#0891b2">
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {n.key_definitions.definitions.map((def, i) => (
                  <div key={i} style={{ background: "white", borderRadius: 12, border: "1px solid #e2e8f0", padding: "12px 14px" }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: "#4f46e5", marginBottom: 4 }}>📖 {def.term}</div>
                    <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{def.definition}</div>
                    {def.example && <div style={{ marginTop: 6, fontSize: 12, color: "#64748b", borderLeft: "2px solid #818cf8", paddingLeft: 10 }}>eg. {def.example}</div>}
                  </div>
                ))}
              </div>
            </SectionBlock>
          )}

          {/* Common Mistakes */}
          {diffTags.common_errors?.length > 0 && (
            <SectionBlock title="Common Board Exam Mistakes" icon="⚠️" accent="#dc2626">
              <div style={{ background: "#fef2f2", borderRadius: 14, border: "1.5px solid #fecdd3", padding: "14px 16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {diffTags.common_errors.map((err, i) => (
                    <div key={i} style={{ fontSize: 13, color: "#991b1b", display: "flex", gap: 8 }}>
                      <span style={{ fontWeight: 900, flexShrink: 0 }}>✗</span>
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              </div>
            </SectionBlock>
          )}
        </>
      )}

      {/* Bottom CTA */}
      {onGoToPractice && (
        <button
          onClick={onGoToPractice}
          style={{
            width: "100%", background: "linear-gradient(135deg,#4f46e5,#818cf8)",
            border: "none", borderRadius: 16, padding: "14px", color: "white",
            fontSize: 14, fontWeight: 800, boxShadow: "0 4px 14px rgba(79,70,229,0.3)",
          }}
        >
          📝 Go to Practice Questions →
        </button>
      )}

      <div style={{ height: 24 }} />
    </div>
  );
});
