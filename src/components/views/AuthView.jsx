import { memo } from "react";
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
  doGoogleLogin,
  doForgotPasswordRequest,
  doForgotPasswordVerifyOTP,
  doForgotPasswordReset,
  cancelForgotPassword,
}) {

  // If OTP verification is needed, show OTP screen
  if (otpState.show) {
    return (
      <div style={{ minHeight: "100vh", width: "100%", background: "linear-gradient(135deg, #f0f4ff 0%, #e6eeff 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'Outfit', sans-serif" }}>
        <div style={{ maxWidth: 420, width: "100%", background: "white", borderRadius: 24, padding: "40px 32px", boxShadow: "0 10px 40px rgba(0,0,0,0.04)" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📧</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>Verify Your Email</h2>
            <p style={{ fontSize: 14, color: "#64748b", margin: 0, fontWeight: 500 }}>We sent a 6-digit code to {otpState.email}</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ color: "#0f172a", fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Verification Code</label>
              <input
                type="text"
                maxLength="6"
                value={otpState.otp}
                onChange={(e) => setOtpState({ ...otpState, otp: e.target.value.replace(/\D/g, "") })}
                placeholder="000000"
                style={{
                  width: "100%", padding: "14px 16px", border: "1px solid #e2e8f0", borderRadius: 12,
                  background: "white", color: "#0f172a", fontSize: 24, fontWeight: 700, letterSpacing: 8,
                  textAlign: "center", outline: "none", transition: "all 0.2s"
                }}
                onFocus={e => e.currentTarget.style.borderColor = "#4f46e5"}
                onBlur={e => e.currentTarget.style.borderColor = "#e2e8f0"}
                onKeyDown={(e) => e.key === "Enter" && doVerifyOTP()}
              />
            </div>

            {authErr && <div style={{ color: "#ef4444", fontSize: 13, fontWeight: 500 }}>{authErr}</div>}

            <button
              onClick={doVerifyOTP}
              disabled={otpState.loading}
              style={{
                width: "100%", padding: 14, border: "none", borderRadius: 12,
                background: otpState.loading ? "#cbd5e1" : "#0f172a",
                color: "white", fontSize: 15, fontWeight: 600,
                cursor: otpState.loading ? "not-allowed" : "pointer", transition: "all 0.2s"
              }}
            >
              {otpState.loading ? "Verifying..." : "Verify Code"}
            </button>

            <button
              onClick={() => { setOtpState({ show: false, email: "", otp: "", loading: false }); setAuthTab("register"); }}
              style={{
                width: "100%", padding: 14, border: "none", background: "transparent",
                color: "#64748b", fontSize: 14, fontWeight: 500, cursor: "pointer"
              }}
            >
              Back to Registration
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", width: "100%", 
      background: "linear-gradient(135deg, #f3f6ff 0%, #eaefff 100%)", 
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", 
      padding: "24px", fontFamily: "'Outfit', sans-serif"
    }}>
      
      <style>{`
        .auth-input-minimal {
          width: 100%;
          padding: 14px 16px;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          color: #0f172a;
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s;
          font-family: inherit;
        }
        .auth-input-minimal:focus { border-color: #0f172a; }
        .auth-input-minimal::placeholder { color: #94a3b8; }
        
        .auth-label-mono {
          color: #0f172a;
          font-size: 13px;
          font-weight: 600;
          display: block;
          margin-bottom: 8px;
        }

        .tab-switcher {
          display: flex;
          background: #eef2ff;
          border-radius: 8px;
          padding: 4px;
          margin-bottom: 32px;
        }
        .tab-minimal {
          flex: 1;
          padding: 12px;
          border: none;
          background: transparent;
          color: #475569;
          font-size: 14px;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tab-minimal.active {
          background: white;
          color: #0f172a;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .bottom-link {
          background: none;
          border: none;
          color: #334155;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
        }
        .bottom-link:hover { color: #0f172a; text-decoration: underline; }

        .social-auth-btn {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          background: #f8fafc;
          color: #0f172a;
          font-size: 15px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
          margin-top: 10px;
        }
        .social-auth-btn:hover {
          background: #f1f5f9;
          border-color: #94a3b8;
        }
        .social-auth-btn:active {
          background: #e2e8f0;
        }
      `}</style>

      {/* Main Card */}
      <div style={{
        maxWidth: 400, width: "100%", background: "white", 
        borderRadius: 16, padding: "48px 32px", 
        boxShadow: "0 10px 40px rgba(0,0,0,0.04)",
        position: "relative", zIndex: 10
      }}>
        
        {/* Icon & Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ 
            width: 48, height: 48, background: "#0f172a", borderRadius: 12,
            display: "flex", alignItems: "center", justifyContent: "center", 
            margin: "0 auto 24px", color: "white"
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>
            {authTab === "login" ? "Sign In" : authTab === "register" ? "Register" : "Reset Password"}
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>
            {authTab === "login" ? "Sign in to continue your preparation" : 
             authTab === "register" ? "Create an account to start learning" : 
             "Recover access to your account"}
          </p>
        </div>

        {/* Tab Switcher */}
        {authTab !== "forgot" && (
          <div className="tab-switcher">
            <button className={`tab-minimal ${authTab === "login" ? "active" : ""}`} onClick={() => setAuthTab("login")}>Sign In</button>
            <button className={`tab-minimal ${authTab === "register" ? "active" : ""}`} onClick={() => setAuthTab("register")}>Register</button>
          </div>
        )}

        {/* Form Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          {authTab === "register" && (
            <>
              <div>
                <label className="auth-label-mono">Full Name</label>
                <input className="auth-input-minimal" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />
              </div>
              <div>
                <label className="auth-label-mono">Email</label>
                <input className="auth-input-minimal" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" />
              </div>
            </>
          )}

          {authTab === "forgot" ? (
            <>
              {resetPasswordData.step === "email" && (
                <div>
                  <label className="auth-label-mono">Email or Username</label>
                  <input className="auth-input-minimal" type="text" value={resetPasswordData.email} onChange={e => setResetPasswordData({ ...resetPasswordData, email: e.target.value })} placeholder="Enter email or username" />
                </div>
              )}

              {resetPasswordData.step === "otp" && (
                <div>
                  <label className="auth-label-mono">Reset Code</label>
                  <input className="auth-input-minimal" type="text" maxLength="6" value={resetPasswordData.otp} onChange={e => setResetPasswordData({ ...resetPasswordData, otp: e.target.value.replace(/\D/g, "") })} placeholder="000000" style={{ letterSpacing: 8, textAlign: "center", fontWeight: 700 }} />
                </div>
              )}

              {resetPasswordData.step === "newPassword" && (
                <>
                  <div>
                    <label className="auth-label-mono">New Password</label>
                    <div style={{ position: "relative" }}>
                      <input className="auth-input-minimal" type={showResetPassword ? "text" : "password"} value={resetPasswordData.newPassword} onChange={e => setResetPasswordData({ ...resetPasswordData, newPassword: e.target.value })} placeholder="New password" />
                      <button onClick={() => setShowResetPassword(!showResetPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                        {showResetPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="auth-label-mono">Confirm Password</label>
                    <input className="auth-input-minimal" type={showResetPassword ? "text" : "password"} value={resetPasswordData.confirmPassword} onChange={e => setResetPasswordData({ ...resetPasswordData, confirmPassword: e.target.value })} placeholder="Confirm password" />
                  </div>
                </>
              )}

              {authErr && <div style={{ color: "#ef4444", fontSize: 13, fontWeight: 500 }}>{authErr}</div>}
              
              <button 
                onClick={resetPasswordData.step === "email" ? doForgotPasswordRequest : resetPasswordData.step === "otp" ? doForgotPasswordVerifyOTP : doForgotPasswordReset} 
                disabled={resetPasswordData.loading}
                style={{ width: "100%", padding: 14, background: "#0f172a", color: "white", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", marginTop: 8 }}
              >
                {resetPasswordData.loading ? "Processing..." : resetPasswordData.step === "email" ? "Send Reset Code" : resetPasswordData.step === "otp" ? "Verify Code" : "Reset Password"}
              </button>
              
              <button onClick={cancelForgotPassword} style={{ width: "100%", padding: 14, background: "transparent", color: "#64748b", border: "none", fontWeight: 600, cursor: "pointer" }}>Back to Login</button>
            </>
          ) : (
            <>
              {authTab !== "forgot" && (
                <div>
                  <label className="auth-label-mono">{authTab === "register" ? "Username" : "Email or Username"}</label>
                  <input className="auth-input-minimal" value={uname} onChange={e => setUname(e.target.value)} placeholder={authTab === "register" ? "johndoe" : "Enter email or username"} onKeyDown={e => e.key === "Enter" && authTab === "login" && doLogin()} />
                </div>
              )}
              
              <div>
                <label className="auth-label-mono">Password</label>
                <div style={{ position: "relative" }}>
                  <input className="auth-input-minimal" type={showPass ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} placeholder="Enter your password" onKeyDown={e => e.key === "Enter" && authTab === "login" && doLogin()} style={{ paddingRight: 40 }} />
                  <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center" }}>
                    {showPass ? (
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    ) : (
                       <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    )}
                  </button>
                </div>
              </div>

              {authTab === "register" && (
                <div>
                  <label className="auth-label-mono">Confirm Password</label>
                  <input className="auth-input-minimal" type="password" value={pass2} onChange={e => setPass2(e.target.value)} placeholder="Re-enter password" onKeyDown={e => e.key === "Enter" && doRegister()} />
                </div>
              )}

              {authErr && <div style={{ color: "#ef4444", fontSize: 13, fontWeight: 500 }}>{authErr}</div>}
              
              <button 
                onClick={authTab === "login" ? doLogin : doRegister} 
                style={{ 
                  width: "100%", padding: 14, background: "#0f172a", color: "white", 
                  border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, 
                  cursor: "pointer", marginTop: 8, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 
                }}
              >
                {authTab === "login" ? "Sign In" : "Register"} 
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </button>

              <div style={{ display: "flex", alignItems: "center", margin: "12px 0", color: "#94a3b8" }}>
                <div style={{ flex: 1, height: 1, background: "#cbd5e1", opacity: 0.5 }}></div>
                <span style={{ padding: "0 12px", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>or</span>
                <div style={{ flex: 1, height: 1, background: "#cbd5e1", opacity: 0.5 }}></div>
              </div>

              <button 
                onClick={doGoogleLogin}
                className="social-auth-btn"
                style={{ marginTop: 0 }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" style={{ flexShrink: 0 }}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.62-.62-1.09-1.34-1.34-2.11z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Continue with Google
              </button>
            </>
          )}
        </div>

        {/* Bottom Links */}
        {authTab === "login" && (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
            <button className="bottom-link" onClick={() => setAuthTab("forgot")}>Forgot password?</button>
            <button className="bottom-link" onClick={() => setAuthTab("register")}>Create account</button>
          </div>
        )}
      </div>

      {/* Footer text outside card */}
      <div style={{ textAlign: "center", marginTop: 40, color: "#475569" }}>
        <p style={{ margin: "0 0 8px", fontSize: 13 }}>Created by Ayush Kumar Maurya</p>
        <p style={{ margin: "0 0 16px", fontSize: 11, letterSpacing: "0.1em", fontWeight: 600 }}>AKMEDU45 • SMART STUDY PLATFORM</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
          <a href="https://www.linkedin.com/in/ayush-kumar-maurya-326071384/" target="_blank" rel="noopener noreferrer" style={{ color: "#94a3b8" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
          </a>
          <a href="https://www.instagram.com/ayush.maurya45/" target="_blank" rel="noopener noreferrer" style={{ color: "#94a3b8" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
          </a>
        </div>
      </div>

    </div>
  );
}
