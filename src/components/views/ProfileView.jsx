import { useState, useEffect, memo } from "react";
import { getUserProfile, updateUserPassword, updateUserName } from "../../utils/supabase";
import { validatePasswordStrength } from "../../utils/passwordValidation";

const AVATARS = [
  "🎓", "💻", "🚀", "🤖", "🦸‍♂️", "🦊", "🦁", "🌟", 
  "💡", "📚", "🎨", "🔬", "🌎", "🎵", "🏆", "🦖"
];

export const ProfileView = memo(function ProfileView({ 
  currentUser, 
  onLogout,
  progress,
  theme
}) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // States for name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState(false);

  // States for password change
  const [passData, setPassData] = useState({ current: "", new: "", confirm: "" });
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Active tab in settings
  const [activeTab, setActiveTab] = useState("password"); // "password" or "security"

  // Load avatar from progress or default
  const avatarKey = `SYSTEM||PROFILE||avatar`;
  const currentAvatar = progress.data?.[avatarKey]?.icon || "🎓";

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      if (currentUser) {
        const data = await getUserProfile(currentUser);
        if (data) {
          setProfile(data);
          setEditNameValue(data.name || "");
          progress.save("SYSTEM||PROFILE||name", { value: data.name, updatedAt: Date.now() });
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, [currentUser]);

  const handleSelectAvatar = (emoji) => {
    progress.save(avatarKey, { icon: emoji, updatedAt: Date.now() });
  };

  const handleSaveName = async () => {
    setNameError("");
    setNameSuccess(false);
    
    const newName = editNameValue.trim();
    if (!newName || newName.length < 2) {
      setNameError("Name must be at least 2 characters");
      return;
    }

    const { success, error } = await updateUserName(currentUser, newName);
    if (success) {
      setProfile(prev => ({ ...prev, name: newName }));
      progress.save("SYSTEM||PROFILE||name", { value: newName, updatedAt: Date.now() });
      setIsEditingName(false);
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 3000);
    } else {
      setNameError(error);
    }
  };

  const handleSavePassword = async () => {
    setPassError("");
    setPassSuccess(false);

    if (!passData.current || !passData.new || !passData.confirm) {
        return setPassError("All fields are required");
    }

    if (passData.new !== passData.confirm) {
        return setPassError("New passwords do not match");
    }

    const strength = validatePasswordStrength(passData.new);
    if (!strength.isValid) {
        return setPassError(strength.errors[0]);
    }

    setIsChangingPass(true);
    try {
        const { success, error } = await updateUserPassword(currentUser, passData.current, passData.new);
        
        if (success) {
            setPassSuccess(true);
            setPassData({ current: "", new: "", confirm: "" });
            setTimeout(() => setPassSuccess(false), 3000);
        } else {
            setPassError(error);
        }
    } catch (err) {
        setPassError("An error occurred during password change.");
    }
    setIsChangingPass(false);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #ede9fe", borderTop: "3px solid #4f46e5", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
          <div style={{ color: "#64748b", fontSize: 14, fontWeight: 600 }}>Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ textAlign: "center", padding: "48px 20px" }}>
        <h2>Profile not found</h2>
        <p>There was an error loading your profile data.</p>
      </div>
    );
  }

  // Formatting connection date
  const joinedDate = profile.joined_at ? new Date(profile.joined_at).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric'
  }) : "Unknown";

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", animation: "fadeInUp 0.4s ease" }}>
      
      {/* ── Main Profile Card ── */}
      <div style={{
        background: "rgba(248, 250, 252, 0.85)", // very light slate/blue hint
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        borderRadius: 20,
        boxShadow: "0 8px 32px rgba(0,0,0,0.04)",
        padding: "40px 24px 24px",
        marginTop: 60, // Space for overlapping avatar
        position: "relative",
      }}>
        
        {/* Overlapping Avatar */}
        <div style={{
          position: "absolute",
          top: -65,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}>
          {/* Glowing rings */}
          <div style={{
            position: "absolute",
            width: 140, height: 140,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.7)",
            background: "linear-gradient(135deg, rgba(219,234,254,0.4) 0%, rgba(237,233,254,0.4) 100%)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <div style={{
              width: 110, height: 110,
              borderRadius: "50%",
              background: "white",
              border: "3px solid #bfdbfe", // subtle blue ring
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 50,
              boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
              position: "relative",
              overflow: "hidden"
            }}>
               <div style={{ zIndex: 2 }}>{currentAvatar}</div>
               <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle, #f8fafc 0%, #f1f5f9 100%)", zIndex: 1 }} />
            </div>
          </div>
        </div>

        {/* Space for the absolute avatar */}
        <div style={{ height: 60 }}></div>

        {/* User Details */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          {!isEditingName ? (
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "0 0 4px", letterSpacing: "-0.01em" }}>
              {profile.name}
              <button 
                onClick={() => setIsEditingName(true)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, marginLeft: 6, color: "#94a3b8" }}
              >✏️</button>
            </h1>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <input
                    type="text"
                    value={editNameValue}
                    onChange={e => setEditNameValue(e.target.value)}
                    style={{
                        padding: "8px 16px", borderRadius: 12, border: "1px solid #cbd5e1",
                        fontSize: 16, textAlign: "center", fontWeight: 700, color: "#0f172a",
                        width: "100%", maxWidth: 260, outline: "none"
                    }}
                />
                {nameError && <div style={{ color: "#ef4444", fontSize: 13 }}>{nameError}</div>}
                <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleSaveName} style={{ background: "#4f46e5", color: "white", border: "none", padding: "6px 16px", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Save</button>
                    <button onClick={() => { setIsEditingName(false); setEditNameValue(profile.name); setNameError(""); }} style={{ background: "rgba(0,0,0,0.05)", color: "#64748b", border: "none", padding: "6px 16px", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                </div>
            </div>
          )}

          <div style={{ fontSize: 15, fontWeight: 500, color: "#60a5fa", marginBottom: 16 }}>
            @{profile.username}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, color: "#334155", fontSize: 14, fontWeight: 500 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  {profile.email}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  Joined {joinedDate}
              </div>
          </div>
        </div>

        {/* ── Avatar Gallery ── */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Avatar Gallery</h2>
          <div style={{ 
            display: "flex", 
            gap: 12,
            overflowX: "auto",
            paddingBottom: 8,
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
          className="hide-scrollbar"
          >
            {AVATARS.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleSelectAvatar(emoji)}
                style={{
                  fontSize: 24,
                  background: "white",
                  border: `2px solid ${currentAvatar === emoji ? "#4f46e5" : "transparent"}`,
                  borderRadius: "50%",
                  minWidth: 48, height: 48,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: currentAvatar === emoji ? "0 4px 12px rgba(79,70,229,0.3)" : "0 2px 8px rgba(0,0,0,0.06)",
                  transition: "all 0.2s",
                  flexShrink: 0
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
          <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        </div>

        {/* ── Security Settings ── */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Security Settings</h2>
          
          <div style={{
            background: "white",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.06)",
            overflow: "hidden"
          }}>
            <div style={{ display: "flex", background: "#cbd5e1" }}>
              <button 
                onClick={() => setActiveTab("password")}
                style={{
                  flex: 1, padding: "10px 0", border: "none", fontSize: 14, fontWeight: 600,
                  background: activeTab === "password" ? "white" : "transparent",
                  color: activeTab === "password" ? "#0f172a" : "#475569",
                  borderRadius: activeTab === "password" ? "12px 12px 0 0" : "0",
                  cursor: "pointer", transition: "background 0.2s"
                }}
              >
                Change Password
              </button>
              <button 
                onClick={() => setActiveTab("security")}
                style={{
                  flex: 1, padding: "10px 0", border: "none", fontSize: 14, fontWeight: 600,
                  background: activeTab === "security" ? "white" : "transparent",
                  color: activeTab === "security" ? "#0f172a" : "#475569",
                  borderRadius: activeTab === "security" ? "12px 12px 0 0" : "0",
                  cursor: "pointer", transition: "background 0.2s"
                }}
              >
                Account Security
              </button>
            </div>

            <div style={{ padding: "16px" }}>
              {activeTab === "password" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <input 
                      type="password" 
                      placeholder="Current Password"
                      value={passData.current}
                      onChange={e => setPassData(p => ({ ...p, current: e.target.value }))}
                      style={{ width: "100%", background: "white", padding: "12px 16px", borderRadius: 20, border: "1.5px solid #cbd5e1", fontSize: 14, outline: "none", transition: "border-color 0.2s" }}
                      onFocus={e => e.currentTarget.style.borderColor = "#94a3b8"}
                      onBlur={e => e.currentTarget.style.borderColor = "#cbd5e1"}
                  />
                  <input 
                      type="password" 
                      placeholder="New Password"
                      value={passData.new}
                      onChange={e => setPassData(p => ({ ...p, new: e.target.value }))}
                      style={{ width: "100%", background: "white", padding: "12px 16px", borderRadius: 20, border: "1.5px solid #cbd5e1", fontSize: 14, outline: "none", transition: "border-color 0.2s" }}
                      onFocus={e => e.currentTarget.style.borderColor = "#94a3b8"}
                      onBlur={e => e.currentTarget.style.borderColor = "#cbd5e1"}
                  />
                  <input 
                      type="password" 
                      placeholder="Confirm New Password"
                      value={passData.confirm}
                      onChange={e => setPassData(p => ({ ...p, confirm: e.target.value }))}
                      style={{ width: "100%", background: "white", padding: "12px 16px", borderRadius: 20, border: "1.5px solid #cbd5e1", fontSize: 14, outline: "none", transition: "border-color 0.2s" }}
                      onFocus={e => e.currentTarget.style.borderColor = "#94a3b8"}
                      onBlur={e => e.currentTarget.style.borderColor = "#cbd5e1"}
                  />

                  {passError && <div style={{ color: "#ef4444", fontSize: 13, background: "rgba(239,68,68,0.1)", padding: "10px", borderRadius: 8 }}>{passError}</div>}
                  {passSuccess && <div style={{ color: "#10b981", fontSize: 14, fontWeight: 600, background: "rgba(16,185,129,0.1)", padding: "10px", borderRadius: 8 }}>✅ Password successfully updated!</div>}

                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                    <button
                        onClick={handleSavePassword}
                        disabled={isChangingPass}
                        style={{
                            background: isChangingPass ? "#cbd5e1" : "#4ade80", // lighter green to match screenshot
                            color: "white",
                            border: "none",
                            padding: "10px 16px",
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: isChangingPass ? "not-allowed" : "pointer",
                            transition: "background 0.2s"
                        }}
                        onMouseEnter={e => !isChangingPass && (e.currentTarget.style.background = "#22c55e")}
                        onMouseLeave={e => !isChangingPass && (e.currentTarget.style.background = "#4ade80")}
                    >
                        {isChangingPass ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: "20px 0", textAlign: "center", color: "#64748b", fontSize: 14 }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🛡️</div>
                  Advanced security settings<br/>will appear here.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Logout Button ── */}
        <button
            onClick={onLogout}
            style={{
                width: "100%",
                background: "transparent",
                color: "#ef4444",
                border: "1.5px solid #ef4444",
                padding: "12px",
                borderRadius: 20,
                fontWeight: 600,
                fontSize: 15,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "all 0.2s"
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
        >
            Logout Securely 
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        </button>

      </div>
    </div>
  );
});
