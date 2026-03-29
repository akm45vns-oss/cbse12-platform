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
  showResetPassword,
  setShowResetPassword,
  otpState,
  setOtpState,
  resetPasswordData,
  setResetPasswordData,
  doLogin,
  doRegister,
  doVerifyOTP,
  doForgotPasswordRequest,
  doForgotPasswordVerifyOTP,
  doForgotPasswordReset,
  cancelForgotPassword,
}) {
  // If OTP verification is needed, show OTP screen
  if (otpState.show) {
    return (
      <div style={{ minHeight: "100vh", width: "100%", background: "transparent", position: "relative", overflow: "hidden", fontFamily: "'Inter', system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        {/* Animated Orbs */}
        <div style={{ position: "absolute", top: "10%", left: "20%", width: "40vw", height: "40vw", background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 60%)", filter: "blur(100px)", borderRadius: "50%", animation: "float 12s infinite ease-in-out" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "20%", width: "50vw", height: "50vw", background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 60%)", filter: "blur(120px)", borderRadius: "50%", animation: "float 15s infinite reverse ease-in-out" }} />
        
        <div style={{ position: "relative", zIndex: 10, maxWidth: "420px", width: "100%", background: "rgba(255, 255, 255, 0.75)", backdropFilter: "blur(32px)", WebkitBackdropFilter: "blur(32px)", borderRadius: "24px", padding: "48px", boxShadow: "0 24px 64px rgba(148, 163, 184, 0.25)", border: "1px solid rgba(255, 255, 255, 0.8)" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📧</div>
            <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#1e293b", margin: "0 0 8px", letterSpacing: "-0.02em" }}>Verify Your Email</h2>
            <p style={{ fontSize: "14px", color: "#64748b", margin: 0, fontWeight: 500 }}>We sent a 6-digit code to {otpState.email}</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ color: "#64748b", fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.1em" }}>Verification Code</label>
              <input
                type="text"
                maxLength="6"
                value={otpState.otp}
                onChange={(e) => setOtpState({ ...otpState, otp: e.target.value.replace(/\D/g, "") })}
                placeholder="000000"
                style={{
                  width: "100%", padding: "14px 16px",
                  border: "1px solid rgba(0, 0, 0, 0.08)", borderRadius: "12px",
                  background: "rgba(0, 0, 0, 0.02)", color: "#1e293b",
                  fontSize: "20px", fontWeight: 700, letterSpacing: "8px", textAlign: "center",
                  outline: "none", transition: "all 0.3s ease"
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.5)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.15)"; e.currentTarget.style.background = "rgba(0, 0, 0, 0.04)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.08)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.background = "rgba(0, 0, 0, 0.02)"; }}
                onKeyDown={(e) => e.key === "Enter" && doVerifyOTP()}
              />
              <p style={{ fontSize: "12px", color: "#3b82f6", marginTop: "12px", textAlign: "center", fontWeight: 500 }}>💡 Check your spam folder if you don't see the email</p>
            </div>

            {authErr && (
              <div style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#ef4444", padding: "12px 16px", borderRadius: "12px", fontSize: "13px", fontWeight: 500 }}>{authErr}</div>
            )}

            <button
              onClick={doVerifyOTP}
              disabled={otpState.loading}
              style={{
                width: "100%", padding: "14px", border: "none", borderRadius: "12px",
                background: otpState.loading ? "rgba(255, 255, 255, 0.1)" : "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)",
                color: otpState.loading ? "#94a3b8" : "white",
                fontSize: "15px", fontWeight: 600, letterSpacing: "0.02em",
                boxShadow: otpState.loading ? "none" : "0 8px 20px rgba(6, 182, 212, 0.25)",
                transition: "all 0.3s ease", cursor: otpState.loading ? "not-allowed" : "pointer", marginTop: "8px"
              }}
              onMouseEnter={(e) => !otpState.loading && (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => !otpState.loading && (e.currentTarget.style.transform = "translateY(0)")}
            >
              {otpState.loading ? "⏳ Verifying..." : "✓ Verify Code"}
            </button>

            <button
              onClick={() => { setOtpState({ show: false, email: "", otp: "", loading: false }); setAuthTab("register"); }}
              style={{
                width: "100%", padding: "14px", border: "1px solid rgba(0, 0, 0, 0.08)", borderRadius: "12px",
                background: "transparent", color: "#64748b", fontSize: "14px", fontWeight: 500,
                cursor: "pointer", transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0, 0, 0, 0.03)"; e.currentTarget.style.color = "#1e293b"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; }}
            >
              Back to Registration
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MAIN AUTH VIEW
  return (
    <div style={{ minHeight: "100vh", width: "100%", background: "transparent", position: "relative", overflow: "hidden", fontFamily: "'Inter', system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      {/* Dynamic Background Orbs */}
      <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "60vw", height: "60vw", background: "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 60%)", filter: "blur(90px)", animation: "float 18s infinite ease-in-out" }} />
      <div style={{ position: "absolute", bottom: "-20%", right: "-10%", width: "70vw", height: "70vw", background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 60%)", filter: "blur(110px)", animation: "float 20s infinite reverse ease-in-out" }} />
      <div style={{ position: "absolute", top: "30%", left: "50%", width: "40vw", height: "40vw", background: "radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 60%)", filter: "blur(80px)", animation: "pulse 12s infinite alternate" }} />

      <style>{`
        * { box-sizing: border-box; }
        input, button { font-family: inherit; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
        
        .auth-modal {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 1080px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
          border: 1px solid rgba(255, 255, 255, 0.8);
          border-radius: 32px;
          box-shadow: 0 24px 64px rgba(148, 163, 184, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.9);
          display: flex;
          overflow: hidden;
        }

        .auth-left {
          flex: 1.1;
          padding: 64px 56px;
          position: relative;
          border-right: 1px solid rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: linear-gradient(135deg, rgba(248, 250, 252, 0.4) 0%, rgba(255, 255, 255, 0.1) 100%);
        }

        .auth-right {
          flex: 0.9;
          padding: 64px 48px;
          background: rgba(255, 255, 255, 0.85);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .auth-input { 
          width: 100%; padding: 14px 16px; 
          border: 1px solid rgba(0, 0, 0, 0.08); 
          border-radius: 12px; 
          background: rgba(0, 0, 0, 0.02); 
          color: #1e293b; 
          font-size: 14px; 
          outline: none; 
          transition: all 0.3s ease;
        }
        .auth-input:focus { 
          border-color: rgba(59, 130, 246, 0.5);
          background: rgba(0, 0, 0, 0.04);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }
        .auth-input::placeholder { color: #94a3b8; }

        .auth-btn { 
          width: 100%; padding: 14px; border: none; border-radius: 12px; 
          background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); 
          color: white; font-size: 15px; font-weight: 600; letter-spacing: 0.02em;
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.25);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer;
        }
        .auth-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(59, 130, 246, 0.4); }
        .auth-btn:active { transform: translateY(1px); }
        .auth-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

        .tab-btn { 
          flex: 1; padding: 10px 14px; border: 1px solid transparent; border-radius: 10px; 
          font-size: 13px; font-weight: 600; letter-spacing: 0.02em; transition: all 0.3s ease;
          background: transparent; color: #64748b; cursor: pointer;
        }
        .tab-btn.active {
          background: rgba(255, 255, 255, 0.9); color: #1e293b;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border-color: rgba(0, 0, 0, 0.05);
        }
        .tab-btn:hover:not(.active) { color: #334155; background: rgba(0,0,0, 0.02); }

        .subj-chip {
          background: rgba(255, 255, 255, 0.5); border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 12px; padding: 14px 8px; text-align: center;
          transition: all 0.3s ease; cursor: default;
        }
        .subj-chip:hover {
          background: rgba(255, 255, 255, 0.9); border-color: rgba(59, 130, 246, 0.3);
          transform: translateY(-3px); box-shadow: 0 8px 20px rgba(148, 163, 184, 0.25);
        }

        .auth-link-btn {
          background: none; border: none; color: #3b82f6; font-weight: 600; cursor: pointer; font-size: inherit; transition: color 0.2s;
        }
        .auth-link-btn:hover { color: #60a5fa; }

        .label-text {
          color: #64748b; font-size: 12px; font-weight: 600; display: block; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.1em;
        }

        @keyframes float { 
          0%, 100% { transform: translate(0, 0) scale(1); } 
          33% { transform: translate(30px, -50px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }

        @media (max-width: 960px) {
          .auth-modal { flex-direction: column; max-width: 560px; border-radius: 24px; }
          .auth-left { border-right: none; border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding: 48px 32px 36px; }
          .auth-right { padding: 36px 32px 48px; }
        }
        @media (max-width: 480px) {
          .auth-modal { border-radius: 20px; }
          .auth-left { padding: 32px 20px 24px; }
          .auth-right { padding: 24px 20px 32px; }
          .subj-chip { padding: 10px 4px; }
        }
      `}</style>

      <div className="auth-modal">
        {/* ===== LEFT PANEL ===== */}
        <div className="auth-left">
          {/* Developer Tag */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: 99, padding: "6px 16px", marginBottom: 16 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", display: "inline-block", boxShadow: "0 0 10px #3b82f6, 0 0 20px rgba(59, 130, 246, 0.6)" }} />
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Creator</span>
              <span style={{ color: "rgba(0,0,0,0.1)" }}>|</span>
              <span style={{ fontSize: 12, color: "#1e293b", fontWeight: 700, letterSpacing: "0.02em" }}>Ayush Kumar Maurya</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { href: "https://www.linkedin.com/in/ayush-kumar-maurya-326071384/", label: "LinkedIn" },
                { href: "https://github.com/akm45vns-oss", label: "GitHub" },
                { href: "https://www.instagram.com/ayush.maurya45/", label: "Instagram" },
              ].map(({ href, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  style={{ display: "inline-block", background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 99, padding: "6px 14px", color: "#64748b", fontSize: 12, fontWeight: 500, textDecoration: "none", transition: "all 0.3s ease" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,0,0,0.06)";  e.currentTarget.style.color = "#1e293b"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0.03)";  e.currentTarget.style.color = "#64748b"; }}>
                  {label} ↗
                </a>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: 56, display: "inline-block", filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.3))" }}>🎓</span>
          </div>
          <h1 style={{ color: "#1e293b", fontWeight: 800, fontSize: 40, margin: "0 0 12px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            AkmEdu45<br/>
            <span style={{ background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Smart Study Platform</span>
          </h1>
          <p style={{ color: "#475569", fontSize: 15, lineHeight: 1.7, marginBottom: 40, maxWidth: 440, fontWeight: 400 }}>
            Master your CBSE Class 12 exams. Access comprehensive AI-generated notes, vast MCQ practice sets, sample papers, and deep performance analytics.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "32px", maxWidth: "440px" }}>
            {[
              { emoji: "⚛️", name: "Physics" }, { emoji: "🧪", name: "Chemistry" },
              { emoji: "🌿", name: "Biology" }, { emoji: "📖", name: "English" },
              { emoji: "📐", name: "Maths" }, { emoji: "💻", name: "CS" },
              { emoji: "📈", name: "Economics" }, { emoji: "🧾", name: "Accounts" },
              { emoji: "🏢", name: "Business" }, { emoji: "🏛️", name: "History" },
              { emoji: "🗳️", name: "Pol. Sc." }, { emoji: "🏃", name: "Phy. Ed." },
            ].map(({ emoji, name }) => (
              <div key={name} className="subj-chip">
                <div style={{ fontSize: 18, marginBottom: 6, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}>{emoji}</div>
                <div style={{ color: "#475569", fontWeight: 600, fontSize: 11, letterSpacing: "0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== RIGHT PANEL — LOGIN FORM ===== */}
        <div className="auth-right">
          <div style={{ width: "100%", maxWidth: 360, margin: "0 auto" }}>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ color: "#1e293b", fontSize: 26, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
                {authTab === "login" ? "Welcome back 👋" : authTab === "register" ? "Create Account ✨" : "Reset Password 🔑"}
              </h2>
              <p style={{ color: "#64748b", fontSize: 14, margin: 0, fontWeight: 400 }}>
                {authTab === "login" ? "Sign in to continue your preparation" : authTab === "register" ? "Join thousands of Class 12 students" : "Recover access to your account"}
              </p>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", background: "rgba(0, 0, 0, 0.04)", border: "1px solid rgba(0, 0, 0, 0.05)", borderRadius: 12, padding: 4, marginBottom: 32 }}>
              {[["login", "Sign In"], ["register", "Register"], ["forgot", "Forgot"]].map(([t, label]) => (
                <button key={t} className={`tab-btn ${authTab === t ? "active" : ""}`} onClick={() => { setAuthTab(t); setResetPasswordData({ email: "", otp: "", newPassword: "", confirmPassword: "", loading: false, step: "email" }); setShowResetPassword(false); }}>
                  {label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {authTab === "register" && (
                <>
                  <div>
                    <label className="label-text">Full Name</label>
                    <input className="auth-input" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" onKeyDown={e => e.key === "Enter" && doRegister()} />
                  </div>
                  <div>
                    <label className="label-text">Email</label>
                    <input className="auth-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email address" onKeyDown={e => e.key === "Enter" && doRegister()} />
                  </div>
                </>
              )}

              {authTab === "forgot" ? (
                <>
                  {resetPasswordData.step === "email" && (
                    <>
                      <div>
                        <label className="label-text">Email or Username</label>
                        <input className="auth-input" type="text" value={resetPasswordData.email} onChange={e => setResetPasswordData({ ...resetPasswordData, email: e.target.value })} placeholder="Enter your email or username" onKeyDown={e => e.key === "Enter" && doForgotPasswordRequest()} />
                      </div>
                    </>
                  )}

                  {resetPasswordData.step === "otp" && (
                    <>
                      <p style={{ color: "#64748b", fontSize: 13, marginBottom: 8 }}>We sent a 6-digit reset code to your email</p>
                      <div>
                        <label className="label-text">Reset Code</label>
                        <input className="auth-input" type="text" maxLength="6" value={resetPasswordData.otp} onChange={e => setResetPasswordData({ ...resetPasswordData, otp: e.target.value.replace(/\D/g, "") })} placeholder="000000" style={{ letterSpacing: "8px", fontSize: "18px", fontWeight: 700, textAlign: "center" }} onKeyDown={e => e.key === "Enter" && doForgotPasswordVerifyOTP()} />
                      </div>
                    </>
                  )}

                  {resetPasswordData.step === "newPassword" && (
                    <>
                      <div>
                        <label className="label-text">New Password</label>
                        <div style={{ position: "relative" }}>
                          <input className="auth-input" type={showResetPassword ? "text" : "password"} value={resetPasswordData.newPassword} onChange={e => setResetPasswordData({ ...resetPasswordData, newPassword: e.target.value })} placeholder="Min 8 chars, mixed case, symbols" style={{ paddingRight: 40 }} />
                          <button onClick={() => setShowResetPassword(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", fontSize: 16, cursor: "pointer" }}>{showResetPassword ? "🙈" : "👁️"}</button>
                        </div>
                      </div>
                      <div>
                        <label className="label-text">Confirm Password</label>
                        <div style={{ position: "relative" }}>
                          <input className="auth-input" type={showResetPassword ? "text" : "password"} value={resetPasswordData.confirmPassword} onChange={e => setResetPasswordData({ ...resetPasswordData, confirmPassword: e.target.value })} placeholder="Re-enter password" style={{ paddingRight: 40 }} onKeyDown={e => e.key === "Enter" && doForgotPasswordReset()} />
                          <button onClick={() => setShowResetPassword(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", fontSize: 16, cursor: "pointer" }}>{showResetPassword ? "🙈" : "👁️"}</button>
                        </div>
                      </div>
                    </>
                  )}
                  {authErr && <div style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#ef4444", padding: "12px", borderRadius: 10, fontSize: 13, fontWeight: 500 }}>{authErr}</div>}
                  <button className="auth-btn" onClick={resetPasswordData.step === "email" ? doForgotPasswordRequest : resetPasswordData.step === "otp" ? doForgotPasswordVerifyOTP : doForgotPasswordReset} style={{ marginTop: 8 }} disabled={resetPasswordData.loading}>
                    {resetPasswordData.loading ? "⏳ Processing..." : resetPasswordData.step === "email" ? "Send Reset Code →" : resetPasswordData.step === "otp" ? "Verify Code →" : "Reset Password ✓"}
                  </button>
                  <button onClick={cancelForgotPassword} style={{ width: "100%", padding: "14px", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, background: "rgba(0,0,0,0.03)", color: "#475569", fontSize: 14, fontWeight: 500, cursor: "pointer", marginTop: 4 }}>Back</button>
                </>
              ) : (
                <>
                  {authTab !== "forgot" && (
                    <div>
                      <label className="label-text">{authTab === "register" ? "Username" : "Email or Username"}</label>
                      <input className="auth-input" value={uname} onChange={e => setUname(e.target.value)} placeholder={authTab === "register" ? "Choose a unique username" : "Enter email or username"} onKeyDown={e => e.key === "Enter" && authTab === "login" && doLogin()} />
                    </div>
                  )}
                  <div>
                    <label className="label-text">Password</label>
                    <div style={{ position: "relative" }}>
                      <input className="auth-input" type={showPass ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} placeholder={authTab === "register" ? "Min 8 chars, mixed, symbols" : "Enter your password"} style={{ paddingRight: 40 }} onKeyDown={e => e.key === "Enter" && authTab === "login" && doLogin()} />
                      <button onClick={() => setShowPass(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", fontSize: 16, cursor: "pointer" }}>{showPass ? "🙈" : "👁️"}</button>
                    </div>
                    {authTab === "register" && pass && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{display: "flex", alignItems: "center", gap: 8}}>
                          <div style={{flex: 1, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 99, overflow: "hidden"}}>
                            <div style={{width: `${validatePasswordStrength(pass).strength.percent}%`, height: "100%", background: validatePasswordStrength(pass).strength.color, transition: "width 0.3s ease"}} />
                          </div>
                          <span style={{fontSize: 11, fontWeight: 600, color: validatePasswordStrength(pass).strength.color, minWidth: 60}}>{validatePasswordStrength(pass).strength.level}</span>
                        </div>
                        {!validatePasswordStrength(pass).isValid && (
                          <div style={{marginTop: 8}}>
                            {validatePasswordStrength(pass).errors.map((err, i) => (
                              <div key={i} style={{fontSize: 11, color: "#fca5a5", marginBottom: 3}}>{err}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {authTab === "register" && (
                    <div>
                      <label className="label-text">Confirm Password</label>
                      <input className="auth-input" type="password" value={pass2} onChange={e => setPass2(e.target.value)} placeholder="Re-enter password" onKeyDown={e => e.key === "Enter" && doRegister()} />
                    </div>
                  )}
                  {authErr && <div style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#ef4444", padding: "12px", borderRadius: 10, fontSize: 13, fontWeight: 500 }}>{authErr}</div>}
                  <button className="auth-btn" onClick={authTab === "login" ? doLogin : doRegister} style={{ marginTop: 8 }}>
                    {authTab === "login" ? "Sign In →" : "Create Account ✨"}
                  </button>
                </>
              )}
            </div>

            {authTab === "login" && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}>
                <button className="auth-link-btn" onClick={() => setAuthTab("forgot")} style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Forgot password?</button>
                <button className="auth-link-btn" onClick={() => setAuthTab("register")} style={{ fontSize: 13 }}>Create account</button>
              </div>
            )}
            <p style={{ textAlign: "center", color: "#64748b", fontSize: 11, marginTop: 40, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>AkmEdu45 • Smart Study Platform</p>
          </div>
        </div>
      </div>
    </div>
  );
}
