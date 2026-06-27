import { memo } from "react";
import { SearchBar } from "../common";
import { getRecentChapters } from "../../utils/recentChapters";
import { getLoginStreak } from "../../utils/loginStreak";

// Subject icon bg colors matching design
const SUBJECT_ICON_COLORS = {
  Physics:            { bg: "#ede9fe", color: "#4f46e5" },
  Chemistry:          { bg: "#d1fae5", color: "#059669" },
  Biology:            { bg: "#d1fae5", color: "#16a34a" },
  Mathematics:        { bg: "#fef3c7", color: "#d97706" },
  English:            { bg: "#ede9fe", color: "#7c3aed" },
  "Computer Science": { bg: "#dbeafe", color: "#2563eb" },
  Economics:          { bg: "#ccfbf1", color: "#0d9488" },
  Accountancy:        { bg: "#dbeafe", color: "#1d4ed8" },
  "Business Studies": { bg: "#fae8ff", color: "#a21caf" },
  History:            { bg: "#fef3c7", color: "#b45309" },
  "Political Science":{ bg: "#fee2e2", color: "#dc2626" },
  "Physical Education":{ bg: "#dcfce7", color: "#16a34a" },
};

const DAILY_TIPS = [
  "Use Active Recall for Organic Chemistry formulas today.",
  "Try the Feynman Technique — explain concepts in simple words.",
  "Review your weak topics before sleeping for better retention.",
  "Space your revision: revisit notes after 1 day, 3 days, 7 days.",
  "Practice one past board paper this weekend to build exam stamina.",
];

export const DashboardView = memo(function DashboardView({
  stats, overallPct, currentUser, displayName, onSelectSubject, onSelectChapter,
  selectedClass = "12", curriculum,
}) {
  // Use prop curriculum if provided, otherwise fall back to empty object
  const CURR = curriculum || {};
  const recentChapters = getRecentChapters(currentUser, 1);
  const mostRecent = recentChapters[0] || null;
  const todayTip = DAILY_TIPS[new Date().getDay() % DAILY_TIPS.length];

  // Progress comes from App.jsx pre-computed against activeCurriculum's chapter names,
  // so it is already class-specific — no bleed between Class 11 and Class 12.
  const getSubjectPct = (s) => {
    const st = stats.bySubject[s];
    if (!st) return 0;
    return Math.round((st.n + st.q) / (st.t * 2) * 100);
  };

  // All subjects in one unified grid
  const allSubjectKeys = Object.keys(CURR);

  return (
    <div style={{ animation: "fadeInUp 0.4s cubic-bezier(0.4,0,0.2,1)" }}>

      {/* Search Bar */}
      <div style={{ marginBottom: 24, position: "relative" }}>
        <SearchBar
          onSelectChapter={(chapter) => {
            const foundSubject = Object.keys(CURR).find(subj =>
              CURR[subj].units?.some(unit => unit.chapters?.includes(chapter))
            );
            if (foundSubject) {
              onSelectSubject(foundSubject);
              setTimeout(() => onSelectChapter(chapter), 100);
            }
          }}
          onSelectSubject={onSelectSubject}
          curriculum={CURR}
        />
      </div>

      {/* ── Class Badge ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: selectedClass === "11" ? "#ede9fe" : "#dbeafe",
          color: selectedClass === "11" ? "#4f46e5" : "#1d4ed8",
          padding: "5px 14px", borderRadius: 999, fontSize: 13, fontWeight: 800,
        }}>
          <span>{selectedClass === "11" ? "🎓" : "🏆"}</span>
          Class {selectedClass} CBSE
        </div>
        <span style={{ fontSize: 13, color: "#94a3b8" }}>
          {Object.keys(CURR).length} subjects
        </span>
      </div>

      {/* ── Continue Learning ── */}
      {mostRecent && (() => {
        const S = CURR[mostRecent.subject];
        const pct = getSubjectPct(mostRecent.subject);
        return (
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>
              Continue Learning
            </h2>
            <button
              className="continue-card"
              style={{ width: "100%", textAlign: "left", border: "none", padding: 0 }}
              onClick={() => {
                onSelectSubject(mostRecent.subject);
                setTimeout(() => onSelectChapter(mostRecent.chapter), 100);
              }}
            >
              <div style={{ padding: "20px 20px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <span style={{
                    display: "inline-block",
                    background: "#ede9fe",
                    color: "#4f46e5",
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "3px 10px",
                    borderRadius: 999,
                  }}>
                    {mostRecent.subject}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>{pct}% Done</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", lineHeight: 1.3, marginBottom: 4 }}>
                  {mostRecent.chapter}
                </div>
                <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500, marginBottom: 20 }}>
                  {S?.units?.[0]?.name || `Class ${selectedClass} CBSE`}
                </div>
              </div>
              {/* Progress bar flush to bottom */}
              <div style={{ height: 6, background: "#f1f0ff", borderRadius: "0 0 20px 20px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #4f46e5, #818cf8)", borderRadius: "0 0 20px 20px", transition: "width 0.6s ease" }} />
              </div>
            </button>
          </div>
        );
      })()}

      {/* ── Your Subjects — unified 2-column grid ── */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 12, margin: "0 0 12px" }}>
          Your Subjects
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {allSubjectKeys.map((s) => {
            const d = CURR[s];
            const pct = getSubjectPct(s);
            const colors = SUBJECT_ICON_COLORS[s] || { bg: "#ede9fe", color: "#4f46e5" };
            const accentColor = d.accent || "#4f46e5";
            return (
              <button
                key={s}
                className="subject-mini-card"
                onClick={() => onSelectSubject(s)}
                style={{ border: "none", width: "100%", textAlign: "left" }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div
                      className="subject-icon-box"
                      style={{ background: colors.bg, color: colors.color }}
                    >
                      <span style={{ fontSize: 22 }}>{d.emoji}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: accentColor }}>{pct}%</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>{s}</div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: accentColor }} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Daily Study Tip ── */}
      <div className="tip-banner" style={{ marginBottom: 8 }}>
        <div className="tip-icon-circle">💡</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.7, marginBottom: 4 }}>
            Daily Study Tip
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5 }}>
            {todayTip}
          </div>
        </div>
      </div>

    </div>
  );
});
