import { memo, useState, useEffect } from "react";
import { getChapterNotes } from "../../utils/supabase";
import { getCachedNotes, cacheNotes } from "../../utils/cacheManager";

const FALLBACK_STUDY_TIME = { total_minutes: 120, sessions_recommended: 3 };
const FALLBACK_DIFFICULTY = { overall_difficulty: "Medium", difficulty_score: 6, common_errors: [] };

function getBoardWeightage(subject) {
  if (["Physics", "Chemistry", "Biology", "Mathematics"].includes(subject)) return "8–10%";
  return "5–7%";
}

function HubSkeleton() {
  return (
    <div>
      <div className="skeleton" style={{ height: 140, borderRadius: 20, marginBottom: 16 }} />
      <div className="skeleton" style={{ height: 80, borderRadius: 16, marginBottom: 10 }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="skeleton" style={{ height: 100, borderRadius: 16 }} />
        <div className="skeleton" style={{ height: 100, borderRadius: 16 }} />
      </div>
    </div>
  );
}

// ── Action Card ──────────────────────────────────────────────────────────────
function ActionCard({ icon, title, subtitle, badge, badgeColor, accent, gradient, onClick, locked, compact }) {
  if (locked) {
    return (
      <div style={{
        background: "var(--bg-card)", borderRadius: 14, border: "1.5px dashed var(--border-card)",
        padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, opacity: 0.6,
      }}>
        <span style={{ fontSize: 16 }}>🔒</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-tertiary)" }}>{title}</div>
          <div style={{ fontSize: 10, color: "var(--text-tertiary)" }}>Coming Soon</div>
        </div>
      </div>
    );
  }
  return (
    <button onClick={onClick} style={{
      border: "none", background: "var(--bg-card)", borderRadius: compact ? 14 : 18,
      padding: compact ? "12px 14px" : "16px", textAlign: "left",
      display: "flex", flexDirection: compact ? "row" : "column", alignItems: compact ? "center" : "flex-start",
      gap: compact ? 10 : 0,
      boxShadow: "var(--shadow-card)", cursor: "pointer", transition: "all 0.18s",
      position: "relative", overflow: "hidden", width: "100%",
      borderTop: `3px solid ${accent}`,
      minHeight: compact ? 56 : 90,
    }}>
      {/* Icon */}
      <div style={{
        width: compact ? 34 : 38, height: compact ? 34 : 38, borderRadius: 10,
        background: `${accent}18`, display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: compact ? 16 : 18, flexShrink: 0,
        marginBottom: compact ? 0 : 8,
      }}>{icon}</div>
      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text-primary)", lineHeight: 1.2, marginBottom: 2 }}>{title}</div>
        {!compact && <div style={{ fontSize: 10, color: "var(--text-tertiary)", lineHeight: 1.4 }}>{subtitle}</div>}
        {badge && (
          <div style={{ marginTop: compact ? 0 : 6, fontSize: 10, fontWeight: 800, color: badgeColor || "#16a34a", background: `${badgeColor || "#16a34a"}15`, padding: "2px 7px", borderRadius: 99, display: "inline-block" }}>
            {badge}
          </div>
        )}
      </div>
      {/* Arrow */}
      <div style={{ position: compact ? "relative" : "absolute", right: compact ? 0 : 14, top: compact ? 0 : "50%", transform: compact ? "none" : "translateY(-50%)", color: `${accent}70`, fontSize: 18, fontWeight: 900, flexShrink: 0 }}>›</div>
    </button>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
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
      } catch (err) { console.error("ChapterView:", err); }
      finally { if (active) setLoading(false); }
    }
    loadData();
    return () => { active = false; };
  }, [selectedClass, subject, chapter]);

  if (loading) return <HubSkeleton />;

  const n = notesData || {};
  const studyTime = n.estimated_study_time || FALLBACK_STUDY_TIME;
  const diffTags = n.difficulty_tags || FALLBACK_DIFFICULTY;
  const readProgress = notesRead ? 50 : 0;
  const quizProgress = quizBest !== undefined ? Math.round((quizBest / 30) * 50) : 0;
  const totalCompletion = readProgress + quizProgress;
  const difficultyColor = { "Easy": "#16a34a", "Medium": "#d97706", "Hard": "#dc2626" }[diffTags.overall_difficulty] || "#d97706";

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", fontFamily: "'Outfit','Inter',sans-serif", animation: "fadeIn 0.3s" }}>

      {/* ── Hero Card ── */}
      <div style={{
        background: "var(--bg-card)", borderRadius: 20, border: "1px solid var(--border-card)",
        padding: "14px 16px", boxShadow: "var(--shadow-card)", marginBottom: 12,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 120, height: 120, borderRadius: "50%", background: "linear-gradient(135deg, rgba(79,70,229,0.05), rgba(129,140,248,0.03))", pointerEvents: "none" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 5 }}>
              <span style={{ fontSize: 10, background: "var(--primary-light)", color: "var(--primary)", fontWeight: 800, padding: "2px 9px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.04em" }}>{subject}</span>
              <span style={{ fontSize: 10, background: `${difficultyColor}18`, color: difficultyColor, fontWeight: 800, padding: "2px 8px", borderRadius: 99 }}>{diffTags.overall_difficulty || "Medium"}</span>
            </div>
            <h1 style={{ fontSize: 17, fontWeight: 900, color: "var(--text-primary)", margin: 0, lineHeight: 1.25 }}>{chapter}</h1>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, marginTop: 3 }}>Class {selectedClass} · CBSE</div>
          </div>
          {streakCount > 0 && (
            <div style={{ background: "var(--orange-light)", padding: "5px 10px", borderRadius: 10, display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: "var(--orange)" }}>{streakCount}</span>
              <span style={{ fontSize: 14 }}>🔥</span>
            </div>
          )}
        </div>

        {/* Stats strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 0, borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "8px 0", margin: "10px 0" }}>
          {[
            { icon: "⏱️", value: `${studyTime.total_minutes}m`, label: "Study Time" },
            { icon: "📅", value: `${studyTime.sessions_recommended || 3} sessions`, label: "Suggested" },
            { icon: "🏆", value: getBoardWeightage(subject), label: "Weightage" },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: "center", borderRight: i < 2 ? "1px solid var(--border)" : "none" }}>
              <span style={{ display: "block", fontSize: 14, marginBottom: 1 }}>{stat.icon}</span>
              <span style={{ display: "block", fontSize: 11, fontWeight: 900, color: "var(--text-primary)" }}>{stat.value}</span>
              <span style={{ fontSize: 9, color: "var(--text-tertiary)", fontWeight: 600 }}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Prep bar */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Preparation Index</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: "var(--primary)" }}>{totalCompletion}%</span>
          </div>
          <div style={{ height: 6, background: "var(--primary-light)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${totalCompletion}%`, background: "linear-gradient(90deg, #4f46e5, #818cf8)", borderRadius: 99, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)" }} />
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 10, color: "var(--text-tertiary)", fontWeight: 600 }}>
            <span>{notesRead ? "✓ Notes read" : "○ Notes unread"}</span>
            <span>{quizBest !== undefined ? `✓ Best: ${quizBest}/30` : "○ Quiz not attempted"}</span>
          </div>
        </div>
      </div>

      {/* ── Learn Card (full width, primary action) ── */}
      <button onClick={onStartLearn} style={{
        width: "100%", border: "none", background: "linear-gradient(135deg, #4f46e5, #818cf8)",
        borderRadius: 18, padding: "16px 20px", color: "white", textAlign: "left",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 6px 20px rgba(79,70,229,0.3)", marginBottom: 10, cursor: "pointer",
        transition: "all 0.18s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📖</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900 }}>Learn</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>NCERT summary, notes, concepts & formulas</div>
            {notesRead && <div style={{ marginTop: 4, fontSize: 10, fontWeight: 800, background: "rgba(255,255,255,0.2)", borderRadius: 99, padding: "2px 8px", display: "inline-block" }}>✓ Notes Read</div>}
          </div>
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, opacity: 0.8 }}>›</div>
      </button>

      {/* ── Practice + Revision (side by side) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <ActionCard
          icon="📝" title="Practice"
          subtitle="MCQs, case study & PYQs"
          badge={quizBest !== undefined ? `Best: ${quizBest}/30` : undefined}
          badgeColor="#0891b2" accent="#0891b2"
          onClick={onStartPractice} compact={false}
        />
        <ActionCard
          icon="⚡" title="Revision"
          subtitle="Cheat sheet & key concepts"
          accent="#d97706"
          onClick={onStartRevision} compact={false}
        />
      </div>

      {/* ── Study Planner locked chip ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, background: "var(--bg-card)",
        border: "1.5px dashed var(--border-card)", borderRadius: 12, padding: "10px 14px", opacity: 0.55,
      }}>
        <span style={{ fontSize: 16 }}>🔒</span>
        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-tertiary)" }}>📅 Study Planner — Coming Soon</div>
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
});
