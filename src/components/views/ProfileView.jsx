import { useState, useEffect } from "react";
import { getUserProfile, updateUserPassword, updateUsername, updateUserName } from "../../utils/supabase";
import { validatePasswordStrength } from "../../utils/passwordValidation";

const AVATARS = [
  "🎓", "💻", "🚀", "🤖", "🦸‍♂️", "🦊", "🦁", "🌟", 
  "💡", "📚", "🎨", "🔬", "🌎", "🎵", "🏆", "🦖"
];

export function ProfileView({ 
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

  // States for username editing
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editUsernameValue, setEditUsernameValue] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState(false);

  // States for password change
  const [passData, setPassData] = useState({ current: "", new: "", confirm: "" });
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

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
          setEditUsernameValue(data.username || "");
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

  const handleSaveUsername = async () => {
    setUsernameError("");
    setUsernameSuccess(false);
    
    const newUsername = editUsernameValue.trim();
    if (!newUsername || newUsername.length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return;
    }

    if (newUsername === profile.username) {
      setUsernameError("New username is the same as current");
      return;
    }

    const { success, error } = await updateUsername(currentUser, newUsername);
    if (success) {
      setProfile(prev => ({ ...prev, username: newUsername }));
      progress.save("SYSTEM||PROFILE||username", { value: newUsername, updatedAt: Date.now() });
      setIsEditingUsername(false);
      setUsernameSuccess(true);
      setTimeout(() => setUsernameSuccess(false), 3000);
    } else {
      setUsernameError(error);
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
        // Pass plain text passwords to updateUserPassword (it handles hashing internally)
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
          <div style={{ fontSize: 36, marginBottom: 16, animation: "pulse 1.5s ease infinite" }}>⚡</div>
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

  // Common glass panel style
  const panelStyle = {
    background: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(28px)",
    WebkitBackdropFilter: "blur(28px)",
    border: "1px solid rgba(0, 0, 0, 0.05)",
    borderRadius: 24,
    boxShadow: "0 10px 30px rgba(148,163,184,0.1) inset 0 1px 0 rgba(255,255,255,0.9)",
    padding: "clamp(20px, 4vw, 32px)",
    marginBottom: 24
  };

  // Helper formatting connection date
  const joinedDate = profile.joined_at ? new Date(profile.joined_at).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric'
  }) : "Unknown";

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px" }}>
      
      {/* Header / Main Details */}
      <div style={{
          ...panelStyle,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center"
      }}>
          <div style={{
            fontSize: 72, 
            background: "rgba(255,255,255,0.5)",
            border: "2px solid rgba(0,0,0,0.05)",
            boxShadow: "0 8px 24px rgba(148,163,184,0.15)",
            width: 120, height: 120, 
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 20
          }}>
              {currentAvatar}
          </div>

          {!isEditingName ? (
              <div style={{ marginBottom: 16 }}>
                  <h1 style={{ fontSize: 28, fontWeight: 800, color: "#1e293b", margin: "0 0 8px" }}>
                      {profile.name}
                      <button 
                          onClick={() => setIsEditingName(true)}
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, marginLeft: 8, color: "#94a3b8" }}
                          title="Edit Name"
                      >
                          ✏️
                      </button>
                  </h1>
              </div>
          ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <input
                      type="text"
                      value={editNameValue}
                      onChange={e => setEditNameValue(e.target.value)}
                      style={{
                          padding: "10px 16px",
                          borderRadius: 12,
                          border: "1px solid #cbd5e1",
                          fontSize: 18,
                          textAlign: "center",
                          fontWeight: 700,
                          color: "#1e293b",
                          background: "#fff",
                          width: "100%", maxWidth: 300
                      }}
                  />
                  {nameError && <div style={{ color: "#ef4444", fontSize: 13 }}>{nameError}</div>}
                  <div style={{ display: "flex", gap: 8 }}>
                      <button 
                          onClick={handleSaveName}
                          style={{
                              background: "#3b82f6", color: "white",
                              border: "none", padding: "6px 16px", borderRadius: 8,
                              fontWeight: 600, cursor: "pointer"
                          }}
                      >Save</button>
                      <button 
                          onClick={() => { setIsEditingName(false); setEditNameValue(profile.name); setNameError(""); }}
                          style={{
                              background: "rgba(0,0,0,0.05)", color: "#64748b",
                              border: "none", padding: "6px 16px", borderRadius: 8,
                              fontWeight: 600, cursor: "pointer"
                          }}
                      >Cancel</button>
                  </div>
              </div>
          )}

          {nameSuccess && <div style={{ color: "#10b981", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Name updated successfully!</div>}

          {isEditingUsername ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 16 }}>
                  <input
                      type="text"
                      value={editUsernameValue}
                      onChange={e => setEditUsernameValue(e.target.value)}
                      placeholder="Enter new username"
                      style={{
                          padding: "10px 16px",
                          borderRadius: 12,
                          border: "1px solid #cbd5e1",
                          fontSize: 16,
                          textAlign: "center",
                          fontWeight: 700,
                          color: "#1e293b",
                          background: "#fff",
                          width: "100%", maxWidth: 300
                      }}
                  />
                  {usernameError && <div style={{ color: "#ef4444", fontSize: 13 }}>{usernameError}</div>}
                  <div style={{ fontSize: 12, color: "#64748b" }}>3-20 characters, letters/numbers/underscore only</div>
                  <div style={{ display: "flex", gap: 8 }}>
                      <button 
                          onClick={handleSaveUsername}
                          style={{
                              background: "#10b981", color: "white",
                              border: "none", padding: "6px 16px", borderRadius: 8,
                              fontWeight: 600, cursor: "pointer"
                          }}
                      >Save</button>
                      <button 
                          onClick={() => { setIsEditingUsername(false); setEditUsernameValue(profile.username); setUsernameError(""); }}
                          style={{
                              background: "rgba(0,0,0,0.05)", color: "#64748b",
                              border: "none", padding: "6px 16px", borderRadius: 8,
                              fontWeight: 600, cursor: "pointer"
                          }}
                      >Cancel</button>
                  </div>
              </div>
          ) : (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16 }}>
                  <div style={{ background: "rgba(99,102,241,0.1)", color: "#4f46e5", padding: "6px 12px", borderRadius: 20, fontWeight: 700, fontSize: 14 }}>
                      @{profile.username}
                  </div>
                  <button 
                      onClick={() => setIsEditingUsername(true)}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#94a3b8" }}
                      title="Edit Username"
                  >
                      ✏️
                  </button>
              </div>
          )}

          {usernameSuccess && <div style={{ color: "#10b981", fontSize: 14, fontWeight: 600, marginBottom: 12 }}>✅ Username updated! Leaderboard will reflect changes on next quiz. 🎉</div>}

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16, color: "#64748b", fontSize: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span title="Email">✉️</span> <strong>{profile.email}</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                 <span title="Joined Date">🗓️</span> Joined {joinedDate}
              </div>
          </div>
      </div>

      {/* Avatar Selection */}
      <div style={panelStyle}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: "0 0 16px" }}>Choose Avatar</h2>
          <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))", 
              gap: 12 
          }}>
              {AVATARS.map(emoji => (
                  <button
                      key={emoji}
                      onClick={() => handleSelectAvatar(emoji)}
                      style={{
                          fontSize: 32,
                          background: currentAvatar === emoji ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.5)",
                          border: `2px solid ${currentAvatar === emoji ? "#3b82f6" : "rgba(0,0,0,0.05)"}`,
                          borderRadius: 16,
                          width: "100%",
                          aspectRatio: "1/1",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer",
                          transform: currentAvatar === emoji ? "scale(1.05)" : "scale(1)",
                          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                          boxShadow: currentAvatar === emoji ? "0 4px 12px rgba(59,130,246,0.2)" : "none"
                      }}
                      onMouseEnter={(e) => {
                          if (currentAvatar !== emoji) e.currentTarget.style.transform = "scale(1.1)";
                      }}
                      onMouseLeave={(e) => {
                          if (currentAvatar !== emoji) e.currentTarget.style.transform = "scale(1)";
                      }}
                  >
                      {emoji}
                  </button>
              ))}
          </div>
      </div>

      {/* Password Management */}
      <div style={panelStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 }}>Change Password</h2>
              <button
                  onClick={onLogout}
                  style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                  title="Logs you out so you can utilize the 'Forgot Password' link from the login screen"
              >
                  Forgot Current Password?
              </button>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 400 }}>
              <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Current Password</label>
                  <input 
                      type="password" 
                      className="auth-input"
                      value={passData.current}
                      onChange={e => setPassData(p => ({ ...p, current: e.target.value }))}
                      style={{ width: "100%", background: "#fff", padding: "10px 16px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 16 }}
                  />
              </div>
              <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>New Password</label>
                  <input 
                      type="password" 
                      className="auth-input"
                      value={passData.new}
                      onChange={e => setPassData(p => ({ ...p, new: e.target.value }))}
                      style={{ width: "100%", background: "#fff", padding: "10px 16px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 16 }}
                  />
              </div>
              <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>Confirm New Password</label>
                  <input 
                      type="password" 
                      className="auth-input"
                      value={passData.confirm}
                      onChange={e => setPassData(p => ({ ...p, confirm: e.target.value }))}
                      style={{ width: "100%", background: "#fff", padding: "10px 16px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 16 }}
                  />
              </div>

              {passError && <div style={{ color: "#ef4444", fontSize: 13, background: "rgba(239,68,68,0.1)", padding: "10px", borderRadius: 8 }}>{passError}</div>}
              {passSuccess && <div style={{ color: "#10b981", fontSize: 14, fontWeight: 600, background: "rgba(16,185,129,0.1)", padding: "10px", borderRadius: 8 }}>✅ Password successfully updated!</div>}

              <button
                  onClick={handleSavePassword}
                  disabled={isChangingPass}
                  style={{
                      background: isChangingPass ? "#cbd5e1" : "linear-gradient(135deg, #10b981, #059669)",
                      color: "white",
                      border: "none",
                      padding: "12px",
                      borderRadius: 12,
                      fontWeight: 700,
                      cursor: isChangingPass ? "not-allowed" : "pointer",
                      marginTop: 8,
                      transition: "opacity 0.2s"
                  }}
                  onMouseEnter={e => !isChangingPass && (e.currentTarget.style.opacity = 0.9)}
                  onMouseLeave={e => !isChangingPass && (e.currentTarget.style.opacity = 1)}
              >
                  {isChangingPass ? "Updating..." : "Update Password"}
              </button>
          </div>
      </div>

      {/* Danger Zone */}
      <div style={{ ...panelStyle, background: "rgba(254, 242, 242, 0.8)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#dc2626", margin: "0 0 16px" }}>Danger Zone</h2>
          <p style={{ color: "#7f1d1d", fontSize: 14, margin: "0 0 20px" }}>Logging out will end your current session securely.</p>
          <button
              onClick={onLogout}
              style={{
                  background: "#ef4444",
                  color: "white",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                  transition: "all 0.2s"
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#dc2626"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#ef4444"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
              <span style={{ fontSize: 18 }}>🚪</span> Logout Securely
          </button>
      </div>

    </div>
  );
}
