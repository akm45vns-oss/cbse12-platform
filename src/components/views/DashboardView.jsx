import { memo, useMemo } from "react";
import { SearchBar } from "../common";
import { getRecentChapters } from "../../utils/recentChapters";
import { getLoginStreak } from "../../utils/loginStreak";
import { getWeakTopics } from "../../utils/weakTopics";

const SUBJECT_COLORS = {
  Physics:             { bg: "#ede9fe", color: "#4f46e5", accent: "#4f46e5" },
  Chemistry:           { bg: "#d1fae5", color: "#059669", accent: "#10b981" },
  Biology:             { bg: "#d1fae5", color: "#16a34a", accent: "#16a34a" },
  Mathematics:         { bg: "#fef3c7", color: "#d97706", accent: "#f59e0b" },
  English:             { bg: "#ede9fe", color: "#7c3aed", accent: "#7c3aed" },
  "Computer Science":  { bg: "#dbeafe", color: "#2563eb", accent: "#3b82f6" },
  Economics:           { bg: "#ccfbf1", color: "#0d9488", accent: "#14b8a6" },
  Accountancy:         { bg: "#dbeafe", color: "#1d4ed8", accent: "#2563eb" },
  "Business Studies":  { bg: "#fae8ff", color: "#a21caf", accent: "#a21caf" },
  History:             { bg: "#fef3c7", color: "#b45309", accent: "#b45309" },
  "Political Science": { bg: "#fee2e2", color: "#dc2626", accent: "#dc2626" },
  "Physical Education":{ bg: "#dcfce7", color: "#16a34a", accent: "#22c55e" },
  Geography:           { bg: "#d1fae5", color: "#064e3b", accent: "#059669" },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good morning", emoji: "🌤️" };
  if (h < 17) return { text: "Good afternoon", emoji: "☀️" };
  if (h < 20) return { text: "Good evening",   emoji: "🌆" };
  return           { text: "Study time",        emoji: "🌙" };
}

export const DashboardView = memo(function DashboardView({
  stats, overallPct, currentUser, displayName, onSelectSubject, onSelectChapter,
  selectedClass = "12", curriculum, progressData = {},
}) {
  const CURR = curriculum || {};
  const recentChapters = getRecentChapters(currentUser, 1);
  const mostRecent = recentChapters[0] || null;
  const { text: greetText, emoji: greetEmoji } = getGreeting();
  const firstName = (displayName || currentUser || "Student").split(" ")[0];

  const streak = (() => {
    try { return JSON.parse(localStorage.getItem("loginStreak") || "{}"); } catch { return {}; }
  })();
  const streakCount = streak.current || 0;

  const getSubjectPct = (s) => {
    const st = stats.bySubject[s];
    if (!st) return 0;
    return Math.round((st.n + st.q) / (st.t * 2) * 100);
  };

  // Build "Today's Plan" from unread chapters (max 3 tasks)
  const todayPlan = useMemo(() => {
    const tasks = [];
    const allSubjects = Object.keys(CURR);
    for (const subj of allSubjects) {
      if (tasks.length >= 3) break;
      const data = CURR[subj];
      if (!data?.units) continue;
      for (const unit of data.units) {
        for (const ch of unit.chapters) {
          if (tasks.length >= 3) break;
          const nRead = progressData[`${subj}||${ch}||notes`]?.read;
          const qDone = progressData[`${subj}||${ch}||quiz`]?.best !== undefined;
          if (!nRead) {
            tasks.push({ label: `Read ${ch}`, subject: subj, chapter: ch, icon: "📖", color: SUBJECT_COLORS[subj]?.accent || "#4f46e5" });
          } else if (!qDone) {
            tasks.push({ label: `Practice ${ch}`, subject: subj, chapter: ch, icon: "📝", color: "#0891b2" });
          }
        }
      }
    }
    return tasks;
  }, [CURR, progressData]);

  const allSubjectKeys = Object.keys(CURR);
  const isNewUser = !mostRecent;

  return (
    <div style={{ animation: "fadeInUp 0.35s cubic-bezier(0.4,0,0.2,1)" }}>

      {/* ── Hero: Greeting + Streak ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div className="dash-greeting">{greetText}, {firstName}! {greetEmoji}</div>
          <div className="dash-subline">
            {streakCount > 0
              ? `${streakCount}-day streak 🔥 · Class ${selectedClass} CBSE`
              : `Class ${selectedClass} CBSE · ${allSubjectKeys.length} subjects`}
          </div>
        </div>
        {overallPct > 0 && (
          <div style={{
            width: 52, height: 52, flexShrink: 0,
            position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="52" height="52" style={{ position: "absolute", transform: "rotate(-90deg)" }}>
              <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(79,70,229,0.1)" strokeWidth="4" />
              <circle cx="26" cy="26" r="22" fill="none" stroke="#4f46e5" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 22}`}
                strokeDashoffset={`${2 * Math.PI * 22 * (1 - overallPct / 100)}`}
                strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 10, fontWeight: 900, color: "#4f46e5", zIndex: 1 }}>{overallPct}%</span>
          </div>
        )}
      </div>

      {/* ── Search Bar ── */}
      <div style={{ marginBottom: 16 }}>
        <SearchBar
          onSelectChapter={(chapter) => {
            const foundSubject = Object.keys(CURR).find(subj =>
              CURR[subj].units?.some(unit => unit.chapters?.includes(chapter))
            );
            if (foundSubject) { onSelectSubject(foundSubject); setTimeout(() => onSelectChapter(chapter), 100); }
          }}
          onSelectSubject={onSelectSubject}
          curriculum={CURR}
        />
      </div>

      {/* ── Continue Learning / Empty State ── */}
      {isNewUser ? (
        <div style={{
          background: "linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)",
          borderRadius: 20, padding: "20px", marginBottom: 16, color: "white",
          boxShadow: "0 8px 24px rgba(79,70,229,0.28)",
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎓</div>
          <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 4 }}>Ready to ace your boards?</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 14 }}>Pick a subject below to start your first chapter!</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {allSubjectKeys.slice(0, 3).map(s => (
              <button key={s} onClick={() => onSelectSubject(s)}
                style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 99, padding: "6px 14px", color: "white", fontSize: 12, fontWeight: 700 }}>
                {CURR[s].emoji} {s}
              </button>
            ))}
          </div>
        </div>
      ) : (() => {
        const S = CURR[mostRecent.subject];
        const pct = getSubjectPct(mostRecent.subject);
        const colors = SUBJECT_COLORS[mostRecent.subject] || { bg: "#ede9fe", color: "#4f46e5", accent: "#4f46e5" };
        return (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
              Continue Learning
            </div>
            <button className="continue-card" onClick={() => { onSelectSubject(mostRecent.subject); setTimeout(() => onSelectChapter(mostRecent.chapter), 100); }}>
              <div style={{ background: "var(--bg-card)", borderRadius: 20, border: "1px solid var(--border-card)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
                <div style={{ padding: "16px 16px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: colors.bg, color: colors.color, fontSize: 10, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 999 }}>
                      <span>{S?.emoji}</span>{mostRecent.subject}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: colors.accent }}>{pct}%</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.3, marginBottom: 14 }}>{mostRecent.chapter}</div>
                </div>
                <div style={{ height: 5, background: "rgba(0,0,0,0.06)" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${colors.accent}, ${colors.accent}cc)`, transition: "width 0.6s ease" }} />
                </div>
              </div>
            </button>
          </div>
        );
      })()}

      {/* ── Today's Plan ── */}
      {todayPlan.length > 0 && (
        <div style={{ background: "var(--bg-card)", borderRadius: 20, border: "1px solid var(--border-card)", padding: "14px 16px", marginBottom: 16, boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: "var(--text-primary)" }}>📅 Today's Plan</span>
            <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600 }}>{todayPlan.length} tasks</span>
          </div>
          {todayPlan.map((task, i) => (
            <div key={i} className="today-plan-item" onClick={() => { onSelectSubject(task.subject); setTimeout(() => onSelectChapter(task.chapter), 100); }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${task.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>{task.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.label}</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600 }}>{task.subject}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2.5" strokeLinecap="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          ))}
        </div>
      )}

      {/* ── Your Subjects — horizontal chip scroll ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>Your Subjects</div>
        <div className="subject-chips-scroll">
          {allSubjectKeys.map(s => {
            const d = CURR[s];
            const pct = getSubjectPct(s);
            const colors = SUBJECT_COLORS[s] || { bg: "#ede9fe", color: "#4f46e5", accent: "#4f46e5" };
            return (
              <button key={s} className="subject-chip" onClick={() => onSelectSubject(s)}
                style={{ borderColor: pct > 0 ? `${colors.accent}40` : undefined }}>
                <span style={{ fontSize: 16 }}>{d.emoji}</span>
                <span style={{ color: "var(--text-primary)" }}>{s}</span>
                {pct > 0 && (
                  <span style={{ background: colors.bg, color: colors.color, borderRadius: 99, padding: "1px 7px", fontSize: 10, fontWeight: 800 }}>{pct}%</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Subject Mini Grid (compact 2-col) ── */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {allSubjectKeys.map(s => {
            const d = CURR[s];
            const pct = getSubjectPct(s);
            const colors = SUBJECT_COLORS[s] || { bg: "#ede9fe", color: "#4f46e5", accent: "#4f46e5" };
            return (
              <button key={s} className="subject-mini-card" onClick={() => onSelectSubject(s)} style={{ border: "none" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div className="subject-icon-box" style={{ background: colors.bg, color: colors.color }}>
                      <span style={{ fontSize: 20 }}>{d.emoji}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: colors.accent }}>{pct}%</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6, lineHeight: 1.2 }}>{s}</div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: colors.accent }} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Daily Tip (compact strip) ── */}
      <div className="tip-banner" style={{ marginBottom: 8 }}>
        <div className="tip-icon-circle">💡</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.75, marginBottom: 2 }}>Daily Tip</div>
          <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.5 }}>
            {["Use Active Recall for Organic Chemistry formulas today.",
              "Try the Feynman Technique — explain concepts in simple words.",
              "Review your weak topics before sleeping for better retention.",
              "Space your revision: revisit notes after 1 day, 3 days, 7 days.",
              "Practice one past board paper this weekend to build exam stamina.",
            ][new Date().getDay() % 5]}
          </div>
        </div>
      </div>

    </div>
  );
});
