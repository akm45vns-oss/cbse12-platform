import { ProgressBar, Badge, SearchBar, WeakTopicsReport } from "../common";
import { CURRICULUM, totalChapters } from "../../constants/curriculum";
import { getRecentChapters } from "../../utils/recentChapters";
import { getLoginStreak } from "../../utils/loginStreak";

export function DashboardView({ stats, overallPct, currentUser, onSelectSubject, onSelectChapter }) {
  const recentChapters = getRecentChapters(currentUser, 5);
  const streak = getLoginStreak(currentUser);
  
  return (
    <div>
      <div style={{ marginBottom: 36, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}>
        <div>
          <h1 style={{ fontSize: "clamp(28px,5vw,38px)", fontWeight: 900, color: "#f8fafc", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            Welcome back, <span style={{background: "linear-gradient(135deg, #22d3ee 0%, #818cf8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 20px rgba(34,211,238,0.3))"}}>{currentUser}</span>! 👋
          </h1>
          <p style={{ color: "#94a3b8", marginTop: 8, fontSize: "clamp(14px,2.5vw,16px)", fontWeight: 500 }}>
            AkmEdu45 - Comprehensive Study Preparation · All Subjects
          </p>
        </div>
        
        {/* Search Bar aligned to the right or bottom */}
        <div style={{ width: "100%", maxWidth: 320 }}>
          <SearchBar 
            onSelectChapter={(chapter) => {
              const foundSubject = Object.keys(CURRICULUM).find(subj => {
                return CURRICULUM[subj].units?.some(unit =>
                  unit.chapters?.includes(chapter)
                );
              });
              if (foundSubject) {
                onSelectSubject(foundSubject);
                setTimeout(() => onSelectChapter(chapter), 100);
              }
            }}
            onSelectSubject={onSelectSubject}
          />
        </div>
      </div>

      {/* Login Streak */}
      {streak.current > 0 && (
        <div
          style={{
            background: "rgba(245, 158, 11, 0.08)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            borderRadius: 20,
            padding: 24,
            marginBottom: 28,
            display: "flex",
            alignItems: "center",
            gap: 24,
            boxShadow: "0 12px 32px rgba(245, 158, 11, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <div style={{ fontSize: 44, filter: "drop-shadow(0 4px 12px rgba(245,158,11,0.5))" }}>🔥</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, color: "#fcd34d", fontSize: 18, letterSpacing: "-0.01em" }}>
              {streak.current} Day{streak.current > 1 ? "s" : ""} On Fire! 🎉
            </div>
            <div style={{ fontSize: 13, color: "#fef3c7", opacity: 0.8, marginTop: 4, fontWeight: 500 }}>
              Keep it up! Your best streak is <strong style={{color:"#fde68a", fontWeight: 800}}>{streak.best}</strong> days.
            </div>
          </div>
        </div>
      )}

      {/* Recent Chapters */}
      {recentChapters.length > 0 && (
        <div style={{ marginBottom: 36 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: "#06b6d4", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            📚 Recently Studied
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
            {recentChapters.map((ch, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onSelectSubject(ch.subject);
                  setTimeout(() => onSelectChapter(ch.chapter), 100);
                }}
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 16,
                  padding: "16px 20px",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(6, 182, 212, 0.1)";
                  e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.3)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 24px rgba(0, 0, 0, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ fontSize: 11, color: "#22d3ee", fontWeight: 800, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {ch.subject}
                </div>
                <div style={{ color: "#f8fafc", fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}>
                  {ch.chapter}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Weak Topics Report */}
      <div style={{ marginBottom: 36 }}>
        <WeakTopicsReport />
      </div>

      <div className="dash-overall">
        {/* Glow behind */}
        <div style={{ position: "absolute", top: "50%", left: "20%", transform: "translate(-50%, -50%)", width: 400, height: 400, background: "radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%)", filter: "blur(60px)", borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "50%", right: "10%", transform: "translate(50%, -50%)", width: 400, height: 400, background: "radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)", filter: "blur(60px)", borderRadius: "50%", pointerEvents: "none" }} />
        
        <div style={{ position: "relative", zIndex: 10 }}>
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Overall Progress</div>
          <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1, background: "linear-gradient(135deg, #22d3ee 0%, #818cf8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }}>{overallPct}%</div>
          <div style={{ fontSize: 15, color: "#cbd5e1", marginTop: 12, fontWeight: 500 }}>Towards Board Exam Readiness</div>
        </div>
        <div className="dash-overall-stats">
          {[
            { v: stats.notesRead, t: "Notes Read", emoji: "📝", c: "#fbd38d" },
            { v: stats.quizDone, t: "Quizzes", emoji: "✅", c: "#6ee7b7" },
            { v: totalChapters, t: "Chapters", emoji: "📚", c: "#93c5fd" }
          ].map(({ v, t, emoji, c }) => (
            <div key={t} style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(30px)", borderRadius: 24, border: "1px solid rgba(255,255,255,0.1)", padding: "24px", textAlign: "center", minWidth: 140, boxShadow: "0 10px 30px rgba(0,0,0,0.3)", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.4)";  }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.3)"; }}>
              <div style={{ fontSize: 28, marginBottom: 12, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}>{emoji}</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: c }}>{v}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>{t}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Subject Cards */}
      <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#06b6d4", marginBottom: 20, marginTop: 48, textTransform: "uppercase", letterSpacing: "0.08em" }}>📚 All Subjects</h2>
      <div className="dash-grid">
        {Object.entries(CURRICULUM).map(([s, d]) => {
          const st = stats.bySubject[s];
          const pct = Math.round((st.n + st.q) / (st.t * 2) * 100);
          return (
            <button key={s} className="card hover-lift" onClick={() => onSelectSubject(s)}
              style={{ textAlign: "left", width: "100%", padding: 0, overflow: "hidden", cursor: "pointer", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(15, 23, 42, 0.5)", borderRadius: 24 }}>
              <div style={{ padding: "32px 24px 24px", position: "relative", overflow: "hidden", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                {/* Glowing orb color tint for each subject card */}
                <div style={{ position: "absolute", right: -40, top: -40, width: 200, height: 200, background: d.gradient, opacity: 0.18, borderRadius: "50%", filter: "blur(50px)", pointerEvents: "none" }} />
                
                <div style={{ fontSize: 44, marginBottom: 16, position: "relative", zIndex: 1, filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.4))" }}>{d.emoji}</div>
                <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em", color: "#f8fafc", lineHeight: 1.2, position: "relative", zIndex: 1 }}>{s}</div>
                <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 8, fontWeight: 500, position: "relative", zIndex: 1 }}>{d.units.length} Units · {st.t} Chapters</div>
              </div>
              <div style={{ padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8", marginBottom: 14, alignItems: "center" }}>
                  <span style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Progress</span>
                  <span style={{ fontWeight: 900, color: d.accent || "#22d3ee", fontSize: 16 }}>{pct}%</span>
                </div>
                <ProgressBar value={st.n + st.q} max={st.t * 2} color={d.accent || "#22d3ee"} height={8} />
                <div style={{ display: "flex", gap: 20, marginTop: 18, fontSize: 13, color: "#cbd5e1", fontWeight: 600 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ opacity: 0.8 }}>📖</span>
                    <span>{st.n}/{st.t} notes</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ opacity: 0.8 }}>✅</span>
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
