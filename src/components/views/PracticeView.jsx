import { memo, useState, useEffect } from "react";
import { getChapterNotes } from "../../utils/supabase";
import { getCachedNotes, cacheNotes } from "../../utils/cacheManager";

// ─── Inline markdown ──────────────────────────────────────────────────────────
function inlineParse(text) {
  if (!text) return "";
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {[1,2,3,4,5,6].map(i => (
        <div key={i} style={{ height: 110, borderRadius: 16, background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
      ))}
    </div>
  );
}

// ─── Sub-view: Subjective Q&A accordion ──────────────────────────────────────
function SubjectiveQA({ data, onBack, title }) {
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <div>
      <button
        onClick={onBack}
        style={{ background: "rgba(79,70,229,0.08)", border: "none", borderRadius: 10, padding: "10px 18px", color: "#4f46e5", fontWeight: 800, fontSize: 14, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}
      >
        ← Back to Practice
      </button>
      <div style={{ fontWeight: 900, fontSize: 18, color: "#0f172a", marginBottom: 16 }}>{title}</div>
      {!data?.questions?.length ? (
        <div style={{ background: "#f8fafc", borderRadius: 14, padding: 24, textAlign: "center", color: "#94a3b8" }}>No questions available for this section yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.questions.map((q, idx) => (
            <div key={idx} style={{ background: "white", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.03)" }}>
              <button
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", lineHeight: 1.5 }}>Q{idx + 1}. {q.q}</span>
                <span style={{ fontSize: 11, background: openIdx === idx ? "#dcfce7" : "#ede9fe", color: openIdx === idx ? "#16a34a" : "#4f46e5", padding: "3px 10px", borderRadius: 99, fontWeight: 800, flexShrink: 0 }}>
                  {openIdx === idx ? "✓ Revealed" : "Reveal"}
                </span>
              </button>
              {openIdx === idx && (
                <div style={{ padding: "0 16px 16px", borderTop: "1px solid #f1f5f9", background: "#f8fafc" }}>
                  <div style={{ height: 12 }} />
                  <span style={{ display: "block", fontSize: 11, fontWeight: 800, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Model Answer</span>
                  <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.7, margin: 0 }}>{q.answer}</p>
                  {q.key_points?.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <span style={{ display: "block", fontSize: 10, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Key Points</span>
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
      )}
    </div>
  );
}

// ─── Sub-view: Case Based ─────────────────────────────────────────────────────
function CaseBasedView({ data, onBack }) {
  return (
    <div>
      <button
        onClick={onBack}
        style={{ background: "rgba(79,70,229,0.08)", border: "none", borderRadius: 10, padding: "10px 18px", color: "#4f46e5", fontWeight: 800, fontSize: 14, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}
      >
        ← Back to Practice
      </button>
      <div style={{ fontWeight: 900, fontSize: 18, color: "#0f172a", marginBottom: 16 }}>Case-Based Passage</div>
      {!data?.cases?.length ? (
        <div style={{ background: "#f8fafc", borderRadius: 14, padding: 24, textAlign: "center", color: "#94a3b8" }}>No case studies available yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {data.cases.map((c, idx) => (
            <div key={idx} style={{ background: "white", borderRadius: 16, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ background: "linear-gradient(90deg,#d97706,#f59e0b)", padding: "10px 16px" }}>
                <span style={{ color: "white", fontWeight: 800, fontSize: 13 }}>📄 Case Study #{idx + 1}</span>
              </div>
              <div style={{ padding: "14px 16px" }}>
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 14px", fontSize: 14, color: "#374151", lineHeight: 1.7, marginBottom: 14 }}>{c.passage}</div>
                {c.questions?.map((q, qi) => (
                  <div key={qi} style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#1e1b4b", marginBottom: 6 }}>Q{qi + 1}. {q.q}</div>
                    {q.opts?.map((opt, oi) => {
                      const isCorrect = q.answer && opt.startsWith(q.answer.charAt(0));
                      return (
                        <div key={oi} style={{ display: "flex", gap: 8, marginBottom: 4, padding: "5px 10px", borderRadius: 7, background: isCorrect ? "#f0fdf4" : "#f8fafc", border: `1px solid ${isCorrect ? "#bbf7d0" : "#f1f5f9"}` }}>
                          {isCorrect && <span style={{ color: "#16a34a", fontWeight: 800 }}>✓</span>}
                          <span style={{ fontSize: 13, color: isCorrect ? "#15803d" : "#374151", fontWeight: isCorrect ? 600 : 400 }}>{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sub-view: Assertion & Reason ─────────────────────────────────────────────
function AssertionReasonView({ data, onBack }) {
  return (
    <div>
      <button
        onClick={onBack}
        style={{ background: "rgba(79,70,229,0.08)", border: "none", borderRadius: 10, padding: "10px 18px", color: "#4f46e5", fontWeight: 800, fontSize: 14, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}
      >
        ← Back to Practice
      </button>
      <div style={{ fontWeight: 900, fontSize: 18, color: "#0f172a", marginBottom: 16 }}>Assertion & Reason</div>
      {!data?.questions?.length ? (
        <div style={{ background: "#f8fafc", borderRadius: 14, padding: 24, textAlign: "center", color: "#94a3b8" }}>No A&R questions available yet.</div>
      ) : (
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
                {q.opts && (<div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{q.opts.map((opt, oi) => { const isCorrect = q.answer && opt.toLowerCase().startsWith(q.answer.toLowerCase().charAt(0)); return (<div key={oi} style={{ padding: "6px 12px", borderRadius: 8, background: isCorrect ? "#f0fdf4" : "#f8fafc", border: `1px solid ${isCorrect ? "#bbf7d0" : "#f1f5f9"}`, display: "flex", gap: 8, alignItems: "center" }}>{isCorrect && <span style={{ color: "#16a34a", fontWeight: 800 }}>✓</span>}<span style={{ fontSize: 13, color: isCorrect ? "#15803d" : "#374151", fontWeight: isCorrect ? 600 : 400 }}>{opt}</span></div>); })}</div>)}
                {q.explanation && <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#92400e" }}><strong>Explanation:</strong> {q.explanation}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Practice Card ─────────────────────────────────────────────────────────────
function PracticeCard({ icon, title, description, badge, badgeColor, onClick, accent }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none", background: "white", borderRadius: 18,
        padding: 18, textAlign: "left", display: "flex", flexDirection: "column", gap: 10,
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)", cursor: "pointer",
        transition: "all 0.2s", position: "relative", overflow: "hidden",
        borderTop: `3px solid ${accent || "#4f46e5"}`,
      }}
    >
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 900, color: "#0f172a", lineHeight: 1.3 }}>{title}</div>
      <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>{description}</div>
      {badge && (
        <div style={{ fontSize: 11, fontWeight: 800, color: badgeColor || "#16a34a", background: `${badgeColor || "#16a34a"}18`, padding: "3px 10px", borderRadius: 99, alignSelf: "flex-start" }}>
          {badge}
        </div>
      )}
      <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", color: "#cbd5e1", fontSize: 16 }}>›</div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const PracticeView = memo(function PracticeView({
  chapter, subject, selectedClass, quizBest, availableSets = [], onStartMCQ, onGoToRevision,
}) {
  const [notesData, setNotesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subView, setSubView] = useState(null); // { type: string }

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      try {
        const local = getCachedNotes(selectedClass, subject, chapter);
        if (local) { if (active) { setNotesData(local); setLoading(false); } return; }
        const dbNotes = await getChapterNotes(selectedClass, subject, chapter);
        if (dbNotes && active) { setNotesData(dbNotes); cacheNotes(selectedClass, subject, chapter, dbNotes, 1440); }
      } catch (err) { console.error("PracticeView: error loading:", err); }
      finally { if (active) setLoading(false); }
    }
    loadData();
    return () => { active = false; };
  }, [selectedClass, subject, chapter]);

  const n = notesData || {};

  // Sub-view renderer
  if (subView === "short-answer") {
    return <SubjectiveQA data={n.short_answer} title="Short Answers (1–3 Marks)" onBack={() => setSubView(null)} />;
  }
  if (subView === "long-answer") {
    return <SubjectiveQA data={n.long_answer} title="Long Answers (5 Marks)" onBack={() => setSubView(null)} />;
  }
  if (subView === "pyq") {
    return <SubjectiveQA data={n.pyq_style} title="PYQ Style Questions" onBack={() => setSubView(null)} />;
  }
  if (subView === "case-based") {
    return <CaseBasedView data={n.case_based} onBack={() => setSubView(null)} />;
  }
  if (subView === "assertion-reason") {
    return <AssertionReasonView data={n.assertion_reason} onBack={() => setSubView(null)} />;
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", fontFamily: "'Outfit','Inter',sans-serif" }}>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>

      {/* Banner */}
      <div style={{
        background: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)",
        borderRadius: 20, padding: "20px 20px 16px", marginBottom: 20,
        color: "white", boxShadow: "0 8px 32px rgba(8,145,178,0.25)", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.8, marginBottom: 6 }}>
          📝 Practice · {subject}
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 12px", lineHeight: 1.2 }}>{chapter}</h1>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {quizBest !== undefined && (
            <span style={{ background: "rgba(255,255,255,0.2)", borderRadius: 99, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
              🏆 Best MCQ Score: {quizBest}/30
            </span>
          )}
          <span style={{ background: "rgba(255,255,255,0.15)", borderRadius: 99, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
            {(availableSets.length || 3) + 5} Practice Types
          </span>
        </div>
      </div>

      {/* Section: Interactive */}
      <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
        🎯 Interactive Assessments
      </div>

      {loading ? <CardSkeleton /> : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <PracticeCard
              icon="✅"
              title="MCQ Practice"
              description={`${availableSets.length || 15} interactive sets`}
              badge={quizBest !== undefined ? `Best: ${quizBest}/30` : undefined}
              badgeColor="#16a34a"
              accent="#4f46e5"
              onClick={onStartMCQ}
            />
            <PracticeCard
              icon="📑"
              title="Case-Based"
              description="CBSE passage-style read & solve"
              accent="#d97706"
              onClick={() => setSubView("case-based")}
            />
          </div>

          {/* Section: Board Questions */}
          <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
            📋 Board-Style Questions
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {[
              { type: "assertion-reason", icon: "⚖️", title: "Assertion & Reason", desc: "Test logical analysis skills", accent: "#0891b2" },
              { type: "short-answer",    icon: "📋", title: "Short Answers (1–3 Marks)", desc: "Tap-to-reveal subjective answers", accent: "#7c3aed" },
              { type: "long-answer",     icon: "📄", title: "Long Answers (5 Marks)", desc: "Step-by-step model board solutions", accent: "#059669" },
              { type: "pyq",             icon: "📜", title: "PYQ Style Questions", desc: "Past board paper question format", accent: "#dc2626" },
            ].map(item => (
              <button
                key={item.type}
                onClick={() => setSubView(item.type)}
                style={{
                  width: "100%", border: "none", background: "white", borderRadius: 16,
                  padding: "14px 18px", display: "flex", gap: 14, alignItems: "center",
                  textAlign: "left", boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  borderLeft: `3px solid ${item.accent}`,
                }}
              >
                <div style={{ width: 38, height: 38, background: `${item.accent}15`, color: item.accent, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{item.title}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{item.desc}</div>
                </div>
                <span style={{ color: "#cbd5e1", fontSize: 18 }}>›</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Bottom CTA */}
      {onGoToRevision && (
        <button
          onClick={onGoToRevision}
          style={{
            width: "100%", background: "linear-gradient(135deg,#d97706,#f59e0b)",
            border: "none", borderRadius: 16, padding: "14px", color: "white",
            fontSize: 14, fontWeight: 800, boxShadow: "0 4px 14px rgba(217,119,6,0.3)",
          }}
        >
          ⚡ Next: Quick Revision →
        </button>
      )}

      <div style={{ height: 24 }} />
    </div>
  );
});
