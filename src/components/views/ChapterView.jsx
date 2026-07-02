import { memo, useState, useEffect } from "react";
import { getChapterNotes } from "../../utils/supabase";
import { getCachedNotes, cacheNotes } from "../../utils/cacheManager";

// ─── Fallback data ─────────────────────────────────────────────────────────────
const FALLBACK_STUDY_TIME = { total_minutes: 120, sessions_recommended: 3 };
const FALLBACK_DIFFICULTY = { overall_difficulty: "Medium", difficulty_score: 6, common_errors: [] };

// ─── Board exam weightage helper ──────────────────────────────────────────────
function getBoardWeightage(subject) {
  if (["Physics", "Chemistry", "Biology", "Mathematics"].includes(subject)) return "8–10%";
  return "5–7%";
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function HubSkeleton() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 4px" }}>
      {/* Hero skeleton */}
      <div style={{ height: 180, borderRadius: 24, background: "linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)", backgroundSize: "200% 100%", animation: "hubShimmer 1.5s infinite", marginBottom: 24 }} />
      {/* Grid skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ height: 130, borderRadius: 20, background: "linear-gradient(90deg,#e2e8f0 25%,#f1f5f9 50%,#e2e8f0 75%)", backgroundSize: "200% 100%", animation: "hubShimmer 1.5s infinite" }} />
        ))}
      </div>
    </div>
  );
}

// ─── Hub Card ─────────────────────────────────────────────────────────────────
function HubCard({ icon, title, subtitle, badge, badgeColor, accent, gradientFrom, gradientTo, onClick, locked }) {
  return (
    <button
      onClick={locked ? undefined : onClick}
      style={{
        border: "none",
        background: locked ? "#f8fafc" : "white",
        borderRadius: 16,
        padding: 14,
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        boxShadow: locked ? "none" : "0 2px 12px rgba(0,0,0,0.06)",
        cursor: locked ? "default" : "pointer",
        transition: "all 0.2s",
        position: "relative",
        overflow: "hidden",
        border: locked ? "1.5px dashed #e2e8f0" : `1px solid rgba(0,0,0,0.04)`,
        minHeight: 110,
        opacity: locked ? 0.75 : 1,
      }}
    >
      {/* Gradient top accent bar */}
      {!locked && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 4,
          background: `linear-gradient(90deg, ${gradientFrom || accent}, ${gradientTo || accent})`,
          borderRadius: "20px 20px 0 0",
        }} />
      )}

      {/* Icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: locked ? "#e2e8f0" : `${accent}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18, marginBottom: 8, marginTop: 2,
      }}>
        {icon}
      </div>

      {/* Title */}
      <div style={{ fontSize: 13.5, fontWeight: 900, color: locked ? "#94a3b8" : "#0f172a", marginBottom: 3, lineHeight: 1.2 }}>
        {title}
      </div>

      {/* Subtitle */}
      <div style={{ fontSize: 10.5, color: locked ? "#cbd5e1" : "#64748b", lineHeight: 1.4, flex: 1 }}>
        {locked ? "Coming Soon" : subtitle}
      </div>

      {/* Badge */}
      {badge && !locked && (
        <div style={{
          marginTop: 6,
          fontSize: 10, fontWeight: 800,
          color: badgeColor || "#16a34a",
          background: `${badgeColor || "#16a34a"}18`,
          padding: "2px 8px", borderRadius: 99,
          alignSelf: "flex-start",
        }}>
          {badge}
        </div>
      )}

      {locked && (
        <div style={{ marginTop: 6, fontSize: 10, fontWeight: 800, color: "#94a3b8", background: "#f1f5f9", padding: "2px 8px", borderRadius: 99, alignSelf: "flex-start" }}>
          🔒 Coming Soon
        </div>
      )}

      {/* Arrow */}
      {!locked && (
        <div style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", color: `${accent}60`, fontSize: 20, fontWeight: 900 }}>›</div>
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export const ChapterView = memo(function ChapterView({
  chapter, subject, selectedClass, curriculumData, notesRead, quizBest, availableSets = [],
  theme, onStartLearn, onStartPractice, onStartRevision,
}) {
  const [notesData, setNotesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streakCount] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem("loginStreak") || "{}"); return s.current || 0; }
    catch { return 0; }
  });

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      try {
        const local = getCachedNotes(selectedClass, subject, chapter);
        if (local) { if (active) { setNotesData(local); setLoading(false); } return; }
        const dbNotes = await getChapterNotes(selectedClass, subject, chapter);
        if (dbNotes && active) { setNotesData(dbNotes); cacheNotes(selectedClass, subject, chapter, dbNotes, 1440); }
      } catch (err) { console.error("ChapterView: error loading data:", err); }
      finally { if (active) setLoading(false); }
    }
    loadData();
    return () => { active = false; };
  }, [selectedClass, subject, chapter]);

  if (loading) {
    return (
      <>
        <style>{`@keyframes hubShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
        <HubSkeleton />
      </>
    );
  }

  const n = notesData || {};
  const studyTime = n.estimated_study_time || FALLBACK_STUDY_TIME;
  const diffTags = n.difficulty_tags || FALLBACK_DIFFICULTY;

  const readProgress = notesRead ? 50 : 0;
  const quizProgress = quizBest !== undefined ? Math.round((quizBest / 30) * 50) : 0;
  const totalCompletion = readProgress + quizProgress;

  const difficultyColor = {
    "Easy": "#16a34a", "Medium": "#d97706", "Hard": "#dc2626",
  }[diffTags.overall_difficulty] || "#d97706";

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", fontFamily: "'Outfit','Inter',sans-serif" }}>
      <style>{`
        @keyframes hubShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .hub-card-btn:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.1) !important; }
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* ── Hero Card ── */}
      <div style={{
        background: "white",
        borderRadius: 20,
        border: "1px solid rgba(79,70,229,0.07)",
        padding: "16px",
        boxShadow: "0 4px 20px rgba(79,70,229,0.06)",
        marginBottom: 16,
        position: "relative",
        overflow: "hidden",
        animation: "fadeIn 0.3s",
      }}>
        {/* Decorative orb */}
        <div style={{ position: "absolute", right: -30, top: -30, width: 140, height: 140, borderRadius: "50%", background: "linear-gradient(135deg, rgba(79,70,229,0.06), rgba(129,140,248,0.04))" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
              <span style={{ fontSize: 11, background: "#ede9fe", color: "#4f46e5", fontWeight: 800, padding: "3px 10px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {subject}
              </span>
              <span style={{ fontSize: 10, background: `${difficultyColor}18`, color: difficultyColor, fontWeight: 800, padding: "2px 8px", borderRadius: 99 }}>
                {diffTags.overall_difficulty || "Medium"}
              </span>
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", margin: 0, lineHeight: 1.25 }}>{chapter}</h1>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, marginTop: 4 }}>Class {selectedClass} · CBSE</div>
          </div>
          {streakCount > 0 && (
            <div style={{ background: "#fff7ed", padding: "6px 12px", borderRadius: 12, border: "1px solid #ffedd5", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: "#ea580c" }}>{streakCount}</span>
              <span style={{ fontSize: 16 }}>🔥</span>
            </div>
          )}
        </div>

        {/* Stats strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 0, borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9", padding: "10px 0", margin: "12px 0" }}>
          {[
            { icon: "⏱️", value: `${studyTime.total_minutes} min`, label: "Study Time" },
            { icon: "📅", value: `${studyTime.sessions_recommended || 3} sessions`, label: "Suggested" },
            { icon: "🏆", value: getBoardWeightage(subject), label: "Weightage" },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: "center", borderRight: i < 2 ? "1px solid #f1f5f9" : "none" }}>
              <span style={{ display: "block", fontSize: 16, marginBottom: 2 }}>{stat.icon}</span>
              <span style={{ display: "block", fontSize: 11, fontWeight: 900, color: "#0f172a" }}>{stat.value}</span>
              <span style={{ fontSize: 9, color: "#94a3b8", fontWeight: 600 }}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Readiness bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Preparation Index
            </span>
            <span style={{ fontSize: 14, fontWeight: 900, color: "#4f46e5" }}>{totalCompletion}%</span>
          </div>
          <div style={{ height: 7, background: "#ede9fe", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${totalCompletion}%`, background: "linear-gradient(90deg, #4f46e5, #818cf8)", borderRadius: 99, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)" }} />
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
            <span>{notesRead ? "✓ Notes read" : "○ Notes unread"}</span>
            <span>{quizBest !== undefined ? `✓ Best quiz: ${quizBest}/30` : "○ Quiz not attempted"}</span>
          </div>
        </div>
      </div>

      {/* ── Hub Grid ── */}
      <div style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
        What would you like to do?
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8, animation: "fadeIn 0.35s" }}>
        <HubCard
          icon="📖"
          title="Learn"
          subtitle="NCERT summary, detailed notes, concepts & formulas"
          badge={notesRead ? "✓ Notes Read" : undefined}
          badgeColor="#16a34a"
          accent="#4f46e5"
          gradientFrom="#4f46e5"
          gradientTo="#818cf8"
          onClick={onStartLearn}
        />
        <HubCard
          icon="📝"
          title="Practice"
          subtitle="MCQs, case study, short & long answers, PYQ"
          badge={quizBest !== undefined ? `Best: ${quizBest}/30` : undefined}
          badgeColor="#0891b2"
          accent="#0891b2"
          gradientFrom="#0891b2"
          gradientTo="#06b6d4"
          onClick={onStartPractice}
        />
        <HubCard
          icon="⚡"
          title="Quick Revision"
          subtitle="Cheat sheet, formulas, key concepts & common mistakes"
          accent="#d97706"
          gradientFrom="#d97706"
          gradientTo="#f59e0b"
          onClick={onStartRevision}
        />
        <HubCard
          icon="📅"
          title="Study Planner"
          subtitle="Personalised study schedule for this chapter"
          accent="#7c3aed"
          gradientFrom="#7c3aed"
          gradientTo="#a78bfa"
          locked={true}
        />
      </div>

      {/* ── Primary Action Button ── */}
      <button
        onClick={totalCompletion < 50 ? onStartLearn : onStartPractice}
        style={{
          width: "100%",
          background: "linear-gradient(135deg, #4f46e5, #818cf8)",
          border: "none",
          borderRadius: 16,
          padding: "14px",
          color: "white",
          fontSize: 15,
          fontWeight: 800,
          boxShadow: "0 6px 20px rgba(79,70,229,0.3)",
          marginTop: 8,
          transition: "all 0.2s",
        }}
      >
        {totalCompletion === 0 ? "🚀 Start Learning →" : totalCompletion >= 100 ? "🔄 Revise Chapter →" : "⚡ Continue Learning →"}
      </button>

      <div style={{ height: 24 }} />
    </div>
  );
});
