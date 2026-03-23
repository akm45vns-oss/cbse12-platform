import { useState } from "react";
import { hashPassword, validateUsername, validatePassword } from "../utils/auth";
import { loginUser, registerUser } from "../utils/supabase";

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authTab, setAuthTab] = useState("login");
  const [uname, setUname] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [authErr, setAuthErr] = useState("");
  const [showPass, setShowPass] = useState(false);

  const doLogin = async () => {
    setAuthErr("");
    
    const usernameErr = validateUsername(uname);
    if (usernameErr) return setAuthErr(usernameErr);
    
    const passwordErr = validatePassword(pass);
    if (passwordErr) return setAuthErr(passwordErr);
    
    const u = uname.trim().toLowerCase();
    const hashed = await hashPassword(pass);
    const { error } = await loginUser(u, hashed);
    
    if (error) return setAuthErr("❌ " + error);
    
    setCurrentUser(u);
    setUname("");
    setPass("");
    setPass2("");
  };

  const doRegister = async () => {
    setAuthErr("");
    
    const usernameErr = validateUsername(uname);
    if (usernameErr) return setAuthErr(usernameErr);
    
    const passwordErr = validatePassword(pass, pass2);
    if (passwordErr) return setAuthErr(passwordErr);
    
    const u = uname.trim().toLowerCase();
    const hashed = await hashPassword(pass);
    const { error } = await registerUser(u, hashed);
    
    if (error) return setAuthErr("⚠️ " + error);
    
    setCurrentUser(u);
    setUname("");
    setPass("");
    setPass2("");
  };

  const doLogout = () => {
    setCurrentUser(null);
    setUname("");
    setPass("");
    setPass2("");
    setAuthErr("");
    setAuthTab("login");
  };

  return {
    currentUser,
    setCurrentUser,
    authTab,
    setAuthTab,
    uname,
    setUname,
    pass,
    setPass,
    pass2,
    setPass2,
    authErr,
    setAuthErr,
    showPass,
    setShowPass,
    doLogin,
    doRegister,
    doLogout,
  };
}
