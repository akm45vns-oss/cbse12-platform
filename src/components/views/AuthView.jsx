import { Badge, ProgressBar } from "../common";
import { CURRICULUM } from "../../constants/curriculum";
import { validatePasswordStrength } from "../../utils/passwordValidation";

export function AuthView({
  authTab,
  setAuthTab,
  uname,
  setUname,
  email,
  setEmail,
  name,
  setName,
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
  const passwordValidation = authTab === "register" ? validatePasswordStrength(pass) : null;
  return (
    <div style={{ minHeight: "100vh", width: "100%", background: "#f0f9fc", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        input { font-family: inherit; }
        button { cursor: pointer; font-family: inherit; }
        .auth-input { 
          width: 100%; padding: 13px 16px; 
          border: 1.5px solid rgba(236, 72, 153, 0.2); 
          border-radius: 12px; 
          background: rgba(255, 255, 255, 0.8); 
          color: #064e78; 
          font-size: 14px; 
          outline: none; 
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(10px);
        }
        .auth-input:focus { 
          border-color: #0891b2;
          background: rgba(255, 255, 255, 1);
          box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1);
        }
        .auth-input::placeholder { color: #f9a8d4; }
        .auth-btn { 
          width: 100%; 
          padding: 13px 18px; 
          border: none; 
          border-radius: 12px; 
          background: linear-gradient(135deg, #0891b2 0%, #0284c7 100%); 
          color: white; 
          font-size: 15px; 
          font-weight: 700; 
          letter-spacing: 0.02em;
          box-shadow: 0 8px 24px rgba(236, 72, 153, 0.3);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .auth-btn:hover { 
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(236, 72, 153, 0.4);
        }
        .auth-btn:active { 
          transform: translateY(-1px);
        }
        .tab-btn { 
          flex: 1; 
          padding: 11px 14px; 
          border: none; 
          border-radius: 10px; 
          font-size: 14px; 
          font-weight: 700;
          letter-spacing: 0.03em;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes float { 
          0%,100%{transform:translateY(0)} 
          50%{transform:translateY(-16px)} 
        }
        @keyframes glow { 
          0%,100%{opacity:0.3} 
          50%{opacity:0.8} 
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .auth-wrap { display: flex; flex-direction: row; min-height: 100vh; }
        .auth-left { 
          flex: 1; 
          background: linear-gradient(135deg, #fce4ec 0%, #fdf2f8 40%, #f0f9fc 100%); 
          display: flex; 
          flex-direction: column; 
          justify-content: center; 
          padding: 60px 64px; 
          position: relative; 
          overflow: hidden; 
          min-width: 0;
          border-right: 1px solid rgba(236, 72, 153, 0.1);
        }
        .auth-right { 
          width: 460px; 
          flex-shrink: 0; 
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          display: flex; 
          flex-direction: column; 
          justify-content: center; 
          padding: 56px 48px; 
          overflow-y: auto;
          border-left: 1px solid rgba(236, 72, 153, 0.1);
          box-shadow: -8px 0 32px rgba(236, 72, 153, 0.08);
        }
        .auth-title { font-size: 48px; }
        .auth-desc { display: block; }
        .auth-subjects { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 40px; max-width: 500px; }
        .auth-features { display: flex; flex-direction: column; gap: 14px; }
        @media (max-width: 860px) {
          .auth-wrap { flex-direction: column; }
          .auth-left { padding: 40px 32px 32px; justify-content: flex-start; border-right: none; border-bottom: 1px solid rgba(236, 72, 153, 0.1); }
          .auth-right { width: 100%; padding: 36px 28px 48px; border-left: none; border-top: none; box-shadow: none; }
          .auth-title { font-size: 34px; }
          .auth-subjects { margin-bottom: 28px; }
          .auth-features { display: none; }
        }
        @media (max-width: 480px) {
          .auth-left { padding: 28px 18px 20px; }
          .auth-right { padding: 24px 18px 36px; }
          .auth-title { font-size: 26px; }
          .auth-subjects { grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 24px; max-width: 100%; }
        }
      `}</style>
      <div className="auth-wrap">
        {/* ===== LEFT PANEL ===== */}
        <div className="auth-left">
          <div style={{ pointerEvents: "none", position: "absolute", top: -100, left: -100, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(8,145,178,0.18) 0%, transparent 70%)", animation: "glow 4s ease-in-out infinite" }} />
          <div style={{ pointerEvents: "none", position: "absolute", bottom: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(244,114,182,0.14) 0%, transparent 70%)", animation: "glow 5s ease-in-out infinite 1s" }} />
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(8,145,178,0.12)", border: "1.5px solid rgba(8,145,178,0.25)", borderRadius: 99, padding: "9px 20px", marginBottom: 12, boxShadow: "0 4px 16px rgba(8,145,178,0.12)" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0891b2", display: "inline-block", boxShadow: "0 0 10px #0891b2, 0 0 20px rgba(8,145,178,0.4)" }} />
              <span style={{ fontSize: 11, color: "#0369a1", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>Developer</span>
              <span style={{ color: "rgba(190,24,93,0.3)" }}>·</span>
              <span style={{ fontSize: 13, color: "#064e78", fontWeight: 900, letterSpacing: "0.02em", textTransform: "uppercase" }}>Ayush Kumar Maurya</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { href: "https://www.linkedin.com/in/ayush-kumar-maurya-326071384/", label: "LinkedIn", emoji: "🔗" },
                { href: "https://github.com/akm45vns-oss", label: "GitHub", emoji: "💻" },
                { href: "https://www.instagram.com/ayush.maurya45/", label: "Instagram", emoji: "📸" },
              ].map(({ href, label, emoji }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(8,145,178,0.08)", border: "1.5px solid rgba(8,145,178,0.2)", borderRadius: 99, padding: "7px 16px", color: "#0369a1", fontSize: 12, fontWeight: 700, textDecoration: "none", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", cursor: "pointer" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(8,145,178,0.16)"; e.currentTarget.style.borderColor = "rgba(8,145,178,0.4)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(8,145,178,0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(8,145,178,0.08)"; e.currentTarget.style.borderColor = "rgba(8,145,178,0.2)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                  <span>{emoji}</span>
                  {label}
                </a>
              ))}
            </div>
          </div>

          <div style={{ animation: "float 6s ease-in-out infinite", marginBottom: 14 }}>
            <span style={{ fontSize: 64 }}>🎓</span>
          </div>
          <h1 className="auth-title" style={{ color: "#064e78", fontWeight: 900, margin: "0 0 12px", letterSpacing: "-0.03em", lineHeight: 1.15 }}>
            AkmEdu<br/>
            <span style={{ background: "linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #f9a8d4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Smart Study Platform</span>
          </h1>
          <p style={{ color: "#9d174d", fontSize: 16, lineHeight: 1.8, marginBottom: 44, maxWidth: 500, fontWeight: 500 }}>
            Complete study preparation for all exams. Comprehensive notes, 50 practice questions per chapter, sample papers and progress tracking.
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
              <div key={name} style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.4), rgba(240,249,252,0.4))", border: "1.5px solid rgba(8,145,178,0.2)", borderRadius: 12, padding: "10px 8px", textAlign: "center", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", cursor: "pointer" }}
                onMouseEnter={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,255,255,0.6), rgba(240,249,252,0.6))"; e.currentTarget.style.borderColor = "rgba(8,145,178,0.4)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 20px rgba(8,145,178,0.15)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,255,255,0.4), rgba(240,249,252,0.4))"; e.currentTarget.style.borderColor = "rgba(8,145,178,0.2)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{emoji}</div>
                <div style={{ color: "#064e78", fontWeight: 800, fontSize: 12, letterSpacing: "0.02em" }}>{name}</div>
              </div>
            ))}
          </div>

          <div className="auth-features">
            {[
              { icon: "📝", text: "Comprehensive Detailed Notes per Chapter" },
              { icon: "🧠", text: "50 Board-Level MCQs with Explanations" },
              { icon: "📄", text: "Full CBSE Sample Papers with Answer Keys" },
              { icon: "📊", text: "Individual Progress Tracking per Subject" },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, rgba(8,145,178,0.12), rgba(244,114,182,0.08))", border: "1.5px solid rgba(8,145,178,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, transition: "all 0.3s" }}>
                  {icon}
                </div>
                <span style={{ color: "#9d174d", fontSize: 14, fontWeight: 600, lineHeight: 1.6 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ===== RIGHT PANEL — LOGIN FORM ===== */}
        <div className="auth-right">
          <div style={{ width: "100%" }}>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ color: "#064e78", fontSize: 24, fontWeight: 900, margin: "0 0 5px", letterSpacing: "-0.02em" }}>
                {authTab === "login" ? "Welcome back 👋" : "Create Account ✨"}
              </h2>
              <p style={{ color: "#9d174d", fontSize: 14, margin: 0, fontWeight: 500 }}>
                {authTab === "login" ? "Sign in to continue your preparation" : "Join thousands of Class 12 students"}
              </p>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", background: "rgba(15, 23, 42, 0.05)", border: "1.5px solid rgba(236, 72, 153, 0.15)", borderRadius: 14, padding: 5, marginBottom: 32, backdropFilter: "blur(10px)" }}>
              {[["login", "🔑 Sign In"], ["register", "✨ Register"]].map(([t, label]) => (
                <button key={t} className="tab-btn" onClick={() => { setAuthTab(t); }}
                  style={{ background: authTab === t ? "linear-gradient(135deg, #0891b2, #0284c7)" : "transparent", color: authTab === t ? "white" : "#9d174d", boxShadow: authTab === t ? "0 4px 12px rgba(236, 72, 153, 0.2)" : "none" }}>
                  {label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {authTab === "register" && (
                <>
                  <div>
                    <label style={{ color: "#0369a1", fontSize: 12, fontWeight: 800, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Full Name</label>
                    <input className="auth-input" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Enter your full name"
                      onKeyDown={e => e.key === "Enter" && doRegister()} />
                  </div>
                  <div>
                    <label style={{ color: "#0369a1", fontSize: 12, fontWeight: 800, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Email</label>
                    <input className="auth-input" type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      onKeyDown={e => e.key === "Enter" && doRegister()} />
                  </div>
                </>
              )}
              <div>
                <label style={{ color: "#0369a1", fontSize: 12, fontWeight: 800, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {authTab === "register" ? "Username" : "Username or Email"}
                </label>
                <input className="auth-input" value={uname} onChange={e => setUname(e.target.value)}
                  placeholder={authTab === "register" ? "Choose a unique username" : "Enter username or email"}
                  onKeyDown={e => e.key === "Enter" && authTab === "login" && doLogin()} />
              </div>
              <div>
                <label style={{ color: "#0369a1", fontSize: 12, fontWeight: 800, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input className="auth-input" type={showPass ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)}
                    placeholder={authTab === "register" ? "Min 8 chars, mixed case, numbers, symbols" : "Enter your password"}
                    style={{ paddingRight: 48 }} onKeyDown={e => e.key === "Enter" && authTab === "login" && doLogin()} />
                  <button onClick={() => setShowPass(s => !s)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#0369a1", fontSize: 18, cursor: "pointer", padding: "4px 8px" }}>
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
                {authTab === "register" && pass && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{display: "flex", alignItems: "center", gap: 10}}>
                      <div style={{flex: 1, height: 6, background: "#e2e8f0", borderRadius: 99, overflow: "hidden"}}>
                        <div style={{width: `${passwordValidation.strength.percent}%`, height: "100%", background: passwordValidation.strength.color, transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)"}} />
                      </div>
                      <span style={{fontSize: 12, fontWeight: 700, color: passwordValidation.strength.color, minWidth: 80}}>{passwordValidation.strength.level}</span>
                    </div>
                    {!passwordValidation.isValid && (
                      <div style={{marginTop: 10}}>
                        {passwordValidation.errors.map((err, i) => (
                          <div key={i} style={{fontSize: 12, color: "#ef4444", marginBottom: 5, fontWeight: 500}}>❌ {err}</div>
                        ))}
                      </div>
                    )}
                    {passwordValidation.isValid && (
                      <div style={{marginTop: 10, fontSize: 12, color: "#16a34a", fontWeight: 600}}>✅ Password is strong!</div>
                    )}
                  </div>
                )}
              </div>
              {authTab === "register" && (
                <div>
                  <label style={{ color: "#0369a1", fontSize: 12, fontWeight: 800, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Confirm Password</label>
                  <input className="auth-input" type="password" value={pass2} onChange={e => setPass2(e.target.value)}
                    placeholder="Re-enter password" onKeyDown={e => e.key === "Enter" && doRegister()} />
                </div>
              )}
              {authErr && (
                <div style={{ background: "linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(220, 38, 38, 0.08))", border: "1.5px solid rgba(239, 68, 68, 0.25)", color: "#991b1b", padding: "12px 16px", borderRadius: 12, fontSize: 13, fontWeight: 600 }}>{authErr}</div>
              )}
              <button className="auth-btn" onClick={authTab === "login" ? doLogin : doRegister} style={{ marginTop: 8 }}>
                {authTab === "login" ? "Sign In →" : "Create Account ✨"}
              </button>
            </div>

            {authTab === "login" && (
              <p style={{ textAlign: "center", color: "#9d174d", fontSize: 14, marginTop: 22, marginBottom: 0, fontWeight: 500 }}>
                New here? <button onClick={() => setAuthTab("register")} style={{ background: "none", border: "none", color: "#0891b2", fontWeight: 700, cursor: "pointer", fontSize: "inherit" }}>Create an account</button>
              </p>
            )}
            <p style={{ textAlign: "center", color: "#cbd5e1", fontSize: 12, marginTop: 32, fontWeight: 500, letterSpacing: "0.04em" }}>AkmEdu • Smart Study Platform • 12 Subjects • All Chapters</p>
          </div>
        </div>
      </div>
    </div>
  );
}
