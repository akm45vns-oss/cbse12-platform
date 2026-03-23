import { Badge, ProgressBar } from "../common";
import { CURRICULUM } from "../../constants/curriculum";

export function AuthView({
  authTab,
  setAuthTab,
  uname,
  setUname,
  pass,
  setPass,
  pass2,
  setPass2,
  authErr,
  showPass,
  setShowPass,
  doLogin,
  doRegister,
}) {
  return (
    <div style={{ minHeight: "100vh", width: "100%", background: "#fff0f5", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        input { font-family: inherit; }
        button { cursor: pointer; font-family: inherit; }
        .auth-input { width: 100%; padding: 11px 14px; border: 1.5px solid #fbcfe8; border-radius: 10px; background: #fff0f5; color: #831843; font-size: 14px; outline: none; transition: border-color 0.2s; }
        .auth-input:focus { border-color: #ec4899; }
        .auth-input::placeholder { color: #f9a8d4; }
        .auth-btn { width: 100%; padding: 12px; border: none; border-radius: 10px; background: linear-gradient(135deg, #ec4899, #db2777); color: white; font-size: 15px; font-weight: 700; letter-spacing: 0.02em; transition: opacity 0.2s, transform 0.1s; }
        .auth-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .auth-btn:active { transform: translateY(0); }
        .tab-btn { flex: 1; padding: 9px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; transition: all 0.2s; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes glow { 0%,100%{opacity:0.4} 50%{opacity:0.9} }
        .auth-wrap { display: flex; flex-direction: row; min-height: 100vh; }
        .auth-left { flex: 1; background: linear-gradient(140deg, #fce4ec 0%, #fdf2f8 55%, #fce4ec 100%); display: flex; flex-direction: column; justify-content: center; padding: 56px 60px; position: relative; overflow: hidden; min-width: 0; }
        .auth-right { width: 440px; flex-shrink: 0; background: #fce4ec; display: flex; flex-direction: column; justify-content: center; padding: 48px 40px; border-left: 1px solid #fbcfe8; overflow-y: auto; }
        .auth-title { font-size: 44px; }
        .auth-desc { display: block; }
        .auth-subjects { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 32px; max-width: 480px; }
        .auth-features { display: flex; flex-direction: column; gap: 10px; }
        @media (max-width: 860px) {
          .auth-wrap { flex-direction: column; }
          .auth-left { padding: 36px 24px 24px; justify-content: flex-start; }
          .auth-right { width: 100%; border-left: none; border-top: 1px solid #fbcfe8; padding: 28px 24px 40px; }
          .auth-title { font-size: 30px; }
          .auth-subjects { margin-bottom: 20px; }
          .auth-features { display: none; }
        }
        @media (max-width: 480px) {
          .auth-left { padding: 24px 16px 16px; }
          .auth-right { padding: 20px 16px 32px; }
          .auth-title { font-size: 24px; }
          .auth-subjects { grid-template-columns: 1fr 1fr; gap: 8px; max-width: 100%; }
        }
      `}</style>
      <div className="auth-wrap">
        {/* ===== LEFT PANEL ===== */}
        <div className="auth-left">
          <div style={{ pointerEvents: "none", position: "absolute", top: -100, left: -100, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.18) 0%, transparent 70%)", animation: "glow 4s ease-in-out infinite" }} />
          <div style={{ pointerEvents: "none", position: "absolute", bottom: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(244,114,182,0.14) 0%, transparent 70%)", animation: "glow 5s ease-in-out infinite 1s" }} />
          <div style={{ marginBottom: 44 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(236,72,153,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 99, padding: "7px 18px", marginBottom: 10 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ec4899", display: "inline-block", boxShadow: "0 0 8px #ec4899" }} />
              <span style={{ fontSize: 10, color: "#be185d", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Developer</span>
              <span style={{ color: "rgba(190,24,93,0.3)" }}>·</span>
              <span style={{ fontSize: 12, color: "#831843", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase" }}>Ayush Kumar Maurya</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { href: "https://www.linkedin.com/in/ayush-kumar-maurya-326071384/", label: "LinkedIn" },
                { href: "https://github.com/akm45vns-oss", label: "GitHub" },
                { href: "https://www.instagram.com/ayush.maurya45/", label: "Instagram" },
              ].map(({ href, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(236,72,153,0.06)", border: "1px solid rgba(236,72,153,0.2)", borderRadius: 99, padding: "5px 14px", color: "#be185d", fontSize: 11, fontWeight: 600, textDecoration: "none", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(236,72,153,0.15)"; e.currentTarget.style.color = "#831843"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(236,72,153,0.05)"; e.currentTarget.style.color = "#be185d"; }}>
                  {label}
                </a>
              ))}
            </div>
          </div>

          <div style={{ animation: "float 6s ease-in-out infinite", marginBottom: 10 }}>
            <span style={{ fontSize: 60 }}>🎓</span>
          </div>
          <h1 className="auth-title" style={{ color: "#831843", fontWeight: 900, margin: "0 0 14px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            CBSE Class 12<br/>
            <span style={{ background: "linear-gradient(135deg, #ec4899, #f472b4, #f9a8d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI Study Platform</span>
          </h1>
          <p style={{ color: "#be185d", fontSize: 15, lineHeight: 1.7, marginBottom: 36, maxWidth: 440 }}>
            Complete NCERT-based preparation for Board Exams 2025–26. AI-generated notes, 50 MCQs per chapter, sample papers and progress tracking.
          </p>

          <div className="auth-subjects">
            {[
              { emoji: "⚛️", name: "Physics" }, { emoji: "🧪", name: "Chemistry" },
              { emoji: "🌿", name: "Biology" }, { emoji: "📖", name: "English" },
              { emoji: "📐", name: "Maths" }, { emoji: "💻", name: "CS" },
              { emoji: "📈", name: "Economics" }, { emoji: "🧾", name: "Accountancy" },
              { emoji: "🏢", name: "Business" }, { emoji: "🏛️", name: "History" },
              { emoji: "🗳️", name: "Pol. Science" }, { emoji: "🏃", name: "Phy. Ed." },
            ].map(({ emoji, name }) => (
              <div key={name} style={{ background: "rgba(236,72,153,0.06)", border: "1px solid rgba(236,72,153,0.2)", borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 18, marginBottom: 3 }}>{emoji}</div>
                <div style={{ color: "#831843", fontWeight: 700, fontSize: 11 }}>{name}</div>
              </div>
            ))}
          </div>

          <div className="auth-features">
            {[
              { icon: "📝", text: "AI-Generated Detailed Notes per Chapter" },
              { icon: "🧠", text: "50 Board-Level MCQs with Explanations" },
              { icon: "📄", text: "Full CBSE Sample Papers with Answer Keys" },
              { icon: "📊", text: "Individual Progress Tracking per Subject" },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(236,72,153,0.08)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{icon}</div>
                <span style={{ color: "#9d174d", fontSize: 13 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ===== RIGHT PANEL — LOGIN FORM ===== */}
        <div className="auth-right">
          <div style={{ width: "100%" }}>
            <h2 style={{ color: "#831843", fontSize: 22, fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.02em" }}>
              {authTab === "login" ? "Welcome back 👋" : "Create Account ✨"}
            </h2>
            <p style={{ color: "#be185d", fontSize: 13, marginBottom: 28 }}>
              {authTab === "login" ? "Sign in to continue your preparation" : "Join thousands of Class 12 students"}
            </p>

            {/* Tabs */}
            <div style={{ display: "flex", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 4, marginBottom: 24 }}>
              {[["login", "🔑 Sign In"], ["register", "✨ Register"]].map(([t, label]) => (
                <button key={t} className="tab-btn" onClick={() => { setAuthTab(t); }}
                  style={{ background: authTab === t ? "linear-gradient(135deg,#ec4899,#db2777)" : "transparent", color: authTab === t ? "white" : "#be185d" }}>
                  {label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ color: "#be185d", fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Username</label>
                <input className="auth-input" value={uname} onChange={e => setUname(e.target.value)}
                  placeholder={authTab === "register" ? "Choose a unique username" : "Enter your username"}
                  onKeyDown={e => e.key === "Enter" && authTab === "login" && doLogin()} />
              </div>
              <div>
                <label style={{ color: "#be185d", fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input className="auth-input" type={showPass ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)}
                    placeholder={authTab === "register" ? "Min 6 characters" : "Enter your password"}
                    style={{ paddingRight: 44 }} onKeyDown={e => e.key === "Enter" && authTab === "login" && doLogin()} />
                  <button onClick={() => setShowPass(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#475569", fontSize: 16 }}>
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
              {authTab === "register" && (
                <div>
                  <label style={{ color: "#be185d", fontSize: 11, fontWeight: 700, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Confirm Password</label>
                  <input className="auth-input" type="password" value={pass2} onChange={e => setPass2(e.target.value)}
                    placeholder="Re-enter password" onKeyDown={e => e.key === "Enter" && doRegister()} />
                </div>
              )}
              {authErr && (
                <div style={{ background: "#fff0f5", border: "1px solid #fbcfe8", color: "#be185d", padding: "10px 14px", borderRadius: 10, fontSize: 13 }}>{authErr}</div>
              )}
              <button className="auth-btn" onClick={authTab === "login" ? doLogin : doRegister} style={{ marginTop: 4 }}>
                {authTab === "login" ? "Sign In →" : "Create Account ✨"}
              </button>
            </div>

            {authTab === "login" && (
              <p style={{ textAlign: "center", color: "#be185d", fontSize: 13, marginTop: 18, marginBottom: 0 }}>
                New here? <button onClick={() => setAuthTab("register")} style={{ background: "none", border: "none", color: "#ec4899", fontWeight: 600, cursor: "pointer" }}>Create an account</button>
              </p>
            )}
            <p style={{ textAlign: "center", color: "#1e293b", fontSize: 11, marginTop: 28 }}>NCERT • CBSE Board 2025–26 • Class XII • All Subjects</p>
          </div>
        </div>
      </div>
    </div>
  );
}
