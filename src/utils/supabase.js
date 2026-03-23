import { createClient } from "@supabase/supabase-js";

// ===== SUPABASE CONFIG =====
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== SUPABASE OPERATIONS =====
export async function loginUser(username, passwordHash) {
  const { data, error } = await supabase
    .from("users")
    .select("username")
    .eq("username", username)
    .eq("password_hash", passwordHash)
    .single();
  
  if (error || !data) return { error: "Invalid username or password" };
  
  // Update last login
  await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("username", username);
  
  return { data };
}

export async function registerUser(username, passwordHash) {
  // Check if username exists
  const { data: existing } = await supabase
    .from("users")
    .select("username")
    .eq("username", username)
    .single();
  
  if (existing) return { error: "Username already taken" };
  
  const { error } = await supabase.from("users").insert({
    username,
    password_hash: passwordHash,
    joined_at: new Date().toISOString(),
    last_login: new Date().toISOString()
  });
  
  if (error) return { error: "Registration failed" };
  
  return { success: true };
}

export async function loadProgress(username) {
  const { data, error } = await supabase
    .from("progress")
    .select("*")
    .eq("username", username);
  
  if (error) {
    console.error("Load progress error:", error);
    return {};
  }
  
  const progress = {};
  (data || []).forEach(row => {
    const key = `${row.subject}||${row.chapter}||${row.type}`;
    progress[key] = row.data;
  });
  
  return progress;
}

export async function saveProgressItem(username, subject, chapter, type, data) {
  return await supabase.from("progress").upsert(
    {
      username,
      subject,
      chapter,
      type,
      data,
      updated_at: new Date().toISOString()
    },
    { onConflict: "username,subject,chapter,type" }
  );
}
