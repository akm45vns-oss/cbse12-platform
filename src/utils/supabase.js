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
  
  if (error || !data) return "Invalid username or password";
  
  // Update last login
  await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("username", username);
  
  return null;
}

export async function registerUser(username, passwordHash) {
  // Check if username exists
  const { data: existing } = await supabase
    .from("users")
    .select("username")
    .eq("username", username)
    .single();
  
  if (existing) return "Username already taken";
  
  const { error } = await supabase.from("users").insert({
    username,
    password_hash: passwordHash,
    joined_at: new Date().toISOString(),
    last_login: new Date().toISOString()
  });
  
  if (error) return "Registration failed";
  
  return null;
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

// ===== CHAPTER NOTES CACHING =====
export async function saveChapterNotes(subject, chapter, notes) {
  const { error } = await supabase.from("chapter_notes").upsert(
    {
      subject,
      chapter,
      notes,
      created_at: new Date().toISOString()
    },
    { onConflict: "subject,chapter" }
  );
  
  if (error) {
    console.error("Save notes error:", error);
    return false;
  }
  return true;
}

export async function getChapterNotes(subject, chapter) {
  const { data, error } = await supabase
    .from("chapter_notes")
    .select("notes")
    .eq("subject", subject)
    .eq("chapter", chapter)
    .single();
  
  if (error || !data) return null;
  return data.notes;
}
