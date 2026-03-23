import { useState } from "react";
import { hashPassword, validateUsername, validatePassword } from "../utils/auth";
import { loginUser, registerUser } from "../utils/supabase";

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authTab, setAuthTab] = useState("login");
  const [credentials, setCredentials] = useState({ username: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");

  const doLogin = async () => {
    setError("");
    const u = credentials.username.trim().toLowerCase();
    const usernameErr = validateUsername(u);
    if (usernameErr) return setError(usernameErr);
    
    const passwordErr = validatePassword(credentials.password);
    if (passwordErr) return setError(passwordErr);
    
    const hashed = await hashPassword(credentials.password);
    const loginErr = await loginUser(u, hashed);
    
    if (loginErr) return setError("❌ " + loginErr);
    
    setCurrentUser(u);
    setCredentials({ username: "", password: "", confirmPassword: "" });
  };

  const doRegister = async () => {
    setError("");
    const u = credentials.username.trim().toLowerCase();
    
    const usernameErr = validateUsername(u);
    if (usernameErr) return setError(usernameErr);
    
    const passwordErr = validatePassword(credentials.password, credentials.confirmPassword);
    if (passwordErr) return setError(passwordErr);
    
    const hashed = await hashPassword(credentials.password);
    const registerErr = await registerUser(u, hashed);
    
    if (registerErr) return setError("⚠️ " + registerErr);
    
    setCurrentUser(u);
    setCredentials({ username: "", password: "", confirmPassword: "" });
  };

  const doLogout = () => {
    setCurrentUser(null);
    setCredentials({ username: "", password: "", confirmPassword: "" });
    setError("");
    setAuthTab("login");
  };

  return {
    currentUser,
    authTab,
    credentials,
    error,
    setAuthTab,
    setCredentials,
    doLogin,
    doRegister,
    doLogout,
  };
}
