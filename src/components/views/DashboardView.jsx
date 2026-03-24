import { ProgressBar, Badge, SearchBar, WeakTopicsReport } from "../common";
import { CURRICULUM, totalChapters } from "../../constants/curriculum";
import { getRecentChapters } from "../../utils/recentChapters";
import { getLoginStreak } from "../../utils/loginStreak";

export function DashboardView({ stats, overallPct, currentUser, onSelectSubject, onSelectChapter, theme = { isDarkMode: false } }) {
  const recentChapters = getRecentChapters(5);
  const streak = getLoginStreak();
  const isDark = theme?.isDarkMode;
  
  return (
    <div>
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: "clamp(22px,5vw,28px)", fontWeight: 900, color: isDark ? "#22d3ee" : "#064e78", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2 }}>Welcome back, <span style={{color: "#0891b2"}}>{currentUser}</span>! 👋</h1>
        <p style={{ color: isDark ? "#cbd5e1" : "#9d174d", marginTop: 8, fontSize: "clamp(14px,2.5vw,16px)", fontWeight: 500 }}>AkmEdu - Comprehensive Study Preparation · All Subjects</p>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: 24 }}>
        <SearchBar 
          onSelectChapter={(chapter) => {
            const foundSubject = Object.keys(CURRICULUM).find(subj => {
              const chapters = CURRICULUM[subj].chapters || [];
              return chapters.includes(chapter);
            });
            if (foundSubject) {
              onSelectSubject(foundSubject);
              setTimeout(() => onSelectChapter(chapter), 100);
            }
          }}
          onSelectSubject={onSelectSubject}
        />
      </div>

      {/* Login Streak */}
      {streak.current > 0 && (
        <div
          style={{
            background: isDark ? `linear-gradient(135deg, #1e293b, #334155)` : `linear-gradient(135deg, #fef5f5, #fee5e5)`,
            border: `1.5px solid ${isDark ? "#475569" : "#feca5a"}`,
            borderRadius: 16,
            padding: 18,
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 16,
            boxShadow: `0 4px 12px ${isDark ? "rgba(6, 182, 212, 0.2)" : "rgba(254, 202, 90, 0.2)"}`,
          }}
        >
          <div style={{ fontSize: 40 }}>🔥</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, color: isDark ? "#fbbf24" : "#b45309", fontSize: 16 }}>
              {streak.current} Day{streak.current > 1 ? "s" : ""} On Fire! 🎉
            </div>
            <div style={{ fontSize: 13, color: isDark ? "#fcdab7" : "#92400e", marginTop: 2 }}>
              Keep it up! Your best streak is {streak.best} days.
            </div>
          </div>
        </div>
      )}

      {/* Recent Chapters */}
      {recentChapters.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 14, fontWeight: 900, color: isDark ? "#22d3ee" : "#064e78", marginBottom: 12, letterSpacing: "-0.01em" }}>
            📚 Recently Studied
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
            {recentChapters.map((ch, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onSelectSubject(ch.subject);
                  setTimeout(() => onSelectChapter(ch.chapter), 100);
                }}
                style={{
                  background: isDark ? "linear-gradient(135deg, #334155, #475569)" : "linear-gradient(135deg, #f0f9fc, #dbeafe)",
                  border: isDark ? "1.5px solid #475569" : "1.5px solid #f9a8d4",
                  borderRadius: 12,
                  padding: 12,
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  fontSize: 12,
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = isDark ? "0 6px 16px rgba(6, 182, 212, 0.2)" : "0 6px 16px rgba(236, 72, 153, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ fontSize: 11, color: isDark ? "#06b6d4" : "#0369a1", fontWeight: 700, marginBottom: 4 }}>
                  {ch.subject}
                </div>
                <div style={{ color: isDark ? "#cbd5e1" : "#1e293b", fontWeight: 700, fontSize: 12 }}>
                  {ch.chapter}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Weak Topics Report */}
      <div style={{ marginBottom: 28 }}>
        <WeakTopicsReport />
      </div>
      <div className="dash-overall">
        <div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Overall Progress</div>
          <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1 }}>{overallPct}%</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 6, fontWeight: 500 }}>Towards Board Exam Readiness</div>
        </div>
        <div className="dash-overall-stats">
          {[
            { v: stats.notesRead, t: "Notes Read", emoji: "📝", c: "#fbbf24" },
            { v: stats.quizDone, t: "Quizzes Done", emoji: "✅", c: "#34d399" },
            { v: totalChapters, t: "Total Chapters", emoji: "📚", c: "#60a5fa" }
          ].map(({ v, t, emoji, c }) => (
            <div key={t} style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(20px)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.2)", padding: "16px 22px", textAlign: "center", minWidth: 100, transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; e.currentTarget.style.transform = "translateY(-4px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{emoji}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: c }}>{v}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4, fontWeight: 600 }}>{t}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Subject Cards */}
      <h2 style={{ fontSize: "clamp(14px, 3vw, 16px)", fontWeight: 800, color: isDark ? "#22d3ee" : "#064e78", marginBottom: 20, marginTop: 40, textTransform: "uppercase", letterSpacing: "0.08em" }}>📚 All Subjects</h2>
      <div className="dash-grid">
        {Object.entries(CURRICULUM).map(([s, d]) => {
          const st = stats.bySubject[s];
          const pct = Math.round((st.n + st.q) / (st.t * 2) * 100);
          return (
            <button key={s} className="card hover-lift" onClick={() => onSelectSubject(s)}
              style={{ textAlign: "left", border: "none", width: "100%", padding: 0, overflow: "hidden", cursor: "pointer", background: isDark ? "#1e293b" : "white", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}>
              <div style={{ background: d.gradient, padding: "24px 20px 20px", color: "white", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", right: -20, top: -20, width: 80, height: 80, background: "rgba(255,255,255,0.1)", borderRadius: "50%", blur: "30px" }} />
                <div style={{ fontSize: 36, marginBottom: 8, position: "relative", zIndex: 1 }}>{d.emoji}</div>
                <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.2, position: "relative", zIndex: 1 }}>{s}</div>
                <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4, fontWeight: 500, position: "relative", zIndex: 1 }}>{d.units.length} Units · {st.t} Chapters</div>
              </div>
              <div style={{ padding: "18px 20px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: isDark ? "#cbd5e1" : "#64748b", marginBottom: 10, alignItems: "center" }}>
                  <span style={{ fontWeight: 600 }}>Progress</span>
                  <span style={{ fontWeight: 800, color: d.accent, fontSize: 16 }}>{pct}%</span>
                </div>
                <ProgressBar value={st.n + st.q} max={st.t * 2} color={d.accent} height={7} />
                <div style={{ display: "flex", gap: 16, marginTop: 14, fontSize: 13, color: isDark ? "#cbd5e1" : "#64748b", fontWeight: 600 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span>📖</span>
                    <span>{st.n}/{st.t} notes</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span>✅</span>
                    <span>{st.q}/{st.t} quiz</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
