import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ===== SUPABASE CONFIG — Replace with your own keys =====
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== CURRICULUM DATA =====
const CURRICULUM = {
  Physics: {
    emoji: "⚛️", code: "PHY",
    gradient: "linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)",
    accent: "#3b82f6", light: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe",
    units: [
      { name: "Unit I — Electrostatics", chapters: ["Electric Charges and Fields", "Electrostatic Potential and Capacitance"] },
      { name: "Unit II — Current Electricity", chapters: ["Current Electricity"] },
      { name: "Unit III — Magnetic Effects of Current", chapters: ["Moving Charges and Magnetism", "Magnetism and Matter"] },
      { name: "Unit IV — Electromagnetic Induction & AC", chapters: ["Electromagnetic Induction", "Alternating Current"] },
      { name: "Unit V — Electromagnetic Waves", chapters: ["Electromagnetic Waves"] },
      { name: "Unit VI — Optics", chapters: ["Ray Optics and Optical Instruments", "Wave Optics"] },
      { name: "Unit VII — Dual Nature of Radiation", chapters: ["Dual Nature of Radiation and Matter"] },
      { name: "Unit VIII — Atoms & Nuclei", chapters: ["Atoms", "Nuclei"] },
      { name: "Unit IX — Electronic Devices", chapters: ["Semiconductor Electronics: Materials, Devices and Simple Circuits"] },
    ]
  },
  Chemistry: {
    emoji: "🧪", code: "CHE",
    gradient: "linear-gradient(135deg, #065f46 0%, #10b981 50%, #6ee7b7 100%)",
    accent: "#10b981", light: "#ecfdf5", text: "#065f46", border: "#a7f3d0",
    units: [
      { name: "Unit I — Solid State & Solutions", chapters: ["The Solid State", "Solutions"] },
      { name: "Unit II — Electrochemistry & Kinetics", chapters: ["Electrochemistry", "Chemical Kinetics"] },
      { name: "Unit III — Surface Chemistry", chapters: ["Surface Chemistry"] },
      { name: "Unit IV — Metallurgy & p-Block", chapters: ["General Principles and Processes of Isolation of Elements", "The p-Block Elements (Groups 15–18)"] },
      { name: "Unit V — d,f-Block & Coordination", chapters: ["The d and f Block Elements", "Coordination Compounds"] },
      { name: "Unit VI — Organic: Haloalkanes & Alcohols", chapters: ["Haloalkanes and Haloarenes", "Alcohols, Phenols and Ethers"] },
      { name: "Unit VII — Organic: Carbonyl & Amines", chapters: ["Aldehydes, Ketones and Carboxylic Acids", "Amines"] },
      { name: "Unit VIII — Biomolecules, Polymers & Everyday Chemistry", chapters: ["Biomolecules", "Polymers", "Chemistry in Everyday Life"] },
    ]
  },
  Biology: {
    emoji: "🌿", code: "BIO",
    gradient: "linear-gradient(135deg, #14532d 0%, #16a34a 50%, #86efac 100%)",
    accent: "#16a34a", light: "#f0fdf4", text: "#15803d", border: "#bbf7d0",
    units: [
      { name: "Unit I — Reproduction", chapters: ["Reproduction in Organisms", "Sexual Reproduction in Flowering Plants", "Human Reproduction", "Reproductive Health"] },
      { name: "Unit II — Genetics & Evolution", chapters: ["Principles of Inheritance and Variation", "Molecular Basis of Inheritance", "Evolution"] },
      { name: "Unit III — Biology in Human Welfare", chapters: ["Human Health and Disease", "Strategies for Enhancement in Food Production", "Microbes in Human Welfare"] },
      { name: "Unit IV — Biotechnology", chapters: ["Biotechnology: Principles and Processes", "Biotechnology and its Applications"] },
      { name: "Unit V — Ecology", chapters: ["Organisms and Populations", "Ecosystem", "Biodiversity and Conservation", "Environmental Issues"] },
    ]
  },
  English: {
    emoji: "📖", code: "ENG",
    gradient: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #c4b5fd 100%)",
    accent: "#7c3aed", light: "#f5f3ff", text: "#6d28d9", border: "#ddd6fe",
    units: [
      { name: "Flamingo — Prose", chapters: ["The Last Lesson", "Lost Spring", "Deep Water", "The Rattrap", "Indigo", "Poets and Pancakes", "The Interview", "Going Places"] },
      { name: "Flamingo — Poetry", chapters: ["My Mother at Sixty-Six", "An Elementary School Classroom in a Slum", "Keeping Quiet", "A Thing of Beauty", "A Roadside Stand", "Aunt Jennifer's Tigers"] },
      { name: "Vistas (Supplementary)", chapters: ["The Third Level", "The Tiger King", "Journey to the End of the Earth", "The Enemy", "Should Wizard Hit Mommy", "On the Face of It", "Evans Tries an O-Level", "Memories of Childhood"] },
      { name: "Writing Skills", chapters: ["Notice Writing", "Formal Letter Writing", "Article Writing", "Report Writing", "Speech Writing"] },
    ]
  }
};

const totalChapters = Object.values(CURRICULUM).reduce((a, s) => a + s.units.reduce((b, u) => b + u.chapters.length, 0), 0);

// ===== API HELPERS =====
async function callClaude(prompt, maxTokens = 2000) {
  const GROQ_KEY = import.meta.env.VITE_GROQ_KEY;
  if (!GROQ_KEY) throw new Error("GROQ API KEY MISSING — Add VITE_GROQ_KEY to .env and Vercel");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_KEY}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: maxTokens,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }]
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Groq API Error ${res.status}: ${err?.error?.message || res.statusText}`);
  }
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  const text = data.choices?.[0]?.message?.content || "";
  if (!text) throw new Error("Empty response from Groq");
  return text;
}

// ===== SUPABASE HELPERS =====
// Hash password (simple SHA-256 via Web Crypto)
async function hashPassword(password) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(password));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}

// ===== COMPONENTS =====

function ProgressBar({ value, max, color = "#6366f1", height = 6 }) {
  const pct = max > 0 ? Math.min(100, Math.round(value / max * 100)) : 0;
  return (
    <div style={{ background: "#fce7f3", borderRadius: 99, height, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.6s cubic-bezier(.4,0,.2,1)" }} />
    </div>
  );
}

function Badge({ children, color }) {
  return (
    <span style={{ background: color + "22", color, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, letterSpacing: "0.04em", textTransform: "uppercase" }}>
      {children}
    </span>
  );
}

function LoadingScreen({ message, emoji = "🔄" }) {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? "." : d + "."), 400);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 360, gap: 16 }}>
      <div style={{ fontSize: 52, animation: "pulse 1.5s infinite" }}>{emoji}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{message}{dots}</div>
      <div style={{ fontSize: 13, color: "#94a3b8" }}>This may take 15–30 seconds</div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#ec4899", animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
        ))}
      </div>
      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
        @keyframes bounce { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-8px);opacity:1} }
      `}</style>
    </div>
  );
}

// ===== MAIN APP =====
export default function App() {
  // Navigation
  const [view, setView] = useState("auth");
  const [subject, setSubject] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [viewStack, setViewStack] = useState(["auth"]);

  // Auth
  const [authTab, setAuthTab] = useState("login");
  const [uname, setUname] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [authErr, setAuthErr] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [showPass, setShowPass] = useState(false);

  // Content
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("");
  const [loadEmoji, setLoadEmoji] = useState("🔄");
  const [notes, setNotes] = useState("");
  const [paper, setPaper] = useState("");
  const [quiz, setQuiz] = useState([]);
  const [quizErr, setQuizErr] = useState("");
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Progress
  const [progress, setProgress] = useState({});

  const nav = (v) => { setView(v); setViewStack(s => [...s, v]); };
  const goBack = () => {
    if (viewStack.length <= 1) return;
    const newStack = viewStack.slice(0, -1);
    setViewStack(newStack);
    setView(newStack[newStack.length - 1]);
  };

  useEffect(() => {
    if (currentUser) loadProgress();
  }, [currentUser]);

  const loadProgress = async () => {
    if (!currentUser) return;
    const { data, error } = await supabase
      .from("progress")
      .select("*")
      .eq("username", currentUser);
    if (error) { console.error("Load progress error:", error); return; }
    const p = {};
    (data || []).forEach(row => {
      const key = `${row.subject}||${row.chapter}||${row.type}`;
      p[key] = row.data;
    });
    setProgress(p);
  };

  const saveProgress = async (key, val) => {
    const newP = { ...progress, [key]: val };
    setProgress(newP);
    const [subject, chapter, type] = key.split("||");
    await supabase.from("progress").upsert({
      username: currentUser,
      subject,
      chapter,
      type,
      data: val,
      updated_at: new Date().toISOString()
    }, { onConflict: "username,subject,chapter,type" });
  };

  // ---- AUTH ----
  const doLogin = async () => {
    setAuthErr("");
    if (!uname.trim() || !pass.trim()) return setAuthErr("Please fill in all fields.");
    const u = uname.trim().toLowerCase();
    const hashed = await hashPassword(pass);
    const { data, error } = await supabase
      .from("users")
      .select("username")
      .eq("username", u)
      .eq("password_hash", hashed)
      .single();
    if (error || !data) return setAuthErr("❌ Invalid username or password. Try again.");
    // Update last login
    await supabase.from("users").update({ last_login: new Date().toISOString() }).eq("username", u);
    setCurrentUser(u);
    setUname(""); setPass(""); setPass2("");
    nav("dashboard");
  };

  const doRegister = async () => {
    setAuthErr("");
    const u = uname.trim().toLowerCase();
    if (!u || !pass.trim() || !pass2.trim()) return setAuthErr("All fields are required.");
    if (u.length < 3) return setAuthErr("Username must be at least 3 characters.");
    if (!/^[a-z0-9_]+$/.test(u)) return setAuthErr("Username: only letters, numbers, underscores.");
    if (pass.length < 6) return setAuthErr("Password must be at least 6 characters.");
    if (pass !== pass2) return setAuthErr("Passwords do not match.");
    // Check if username exists
    const { data: existing } = await supabase
      .from("users")
      .select("username")
      .eq("username", u)
      .single();
    if (existing) return setAuthErr("⚠️ Username already taken. Choose a different one.");
    const hashed = await hashPassword(pass);
    const { error } = await supabase.from("users").insert({
      username: u,
      password_hash: hashed,
      joined_at: new Date().toISOString(),
      last_login: new Date().toISOString()
    });
    if (error) return setAuthErr("❌ Registration failed. Please try again.");
    setCurrentUser(u);
    setUname(""); setPass(""); setPass2("");
    nav("dashboard");
  };

  const doLogout = () => {
    setCurrentUser(null); setProgress({});
    setSubject(null); setChapter(null);
    setNotes(""); setPaper(""); setQuiz([]);
    setView("auth"); setViewStack(["auth"]);
  };

  // ---- CONTENT GENERATION ----
  const genNotes = async (subj, chap) => {
    setLoading(true); setLoadMsg(`Generating notes for "${chap}"`); setLoadEmoji("📝"); setNotes("");
    try {
      const text = await callClaude(`Create comprehensive CBSE Class 12 NCERT study notes for the chapter "${chap}" from ${subj}.

Format the notes as follows:

# ${chap}
## Subject: ${subj} | Class 12 CBSE NCERT

---

## 📌 Chapter Overview
[2-3 sentence overview]

## 🔑 Key Concepts & Definitions
[List all important terms with definitions]

## 📐 Important Laws, Theories & Principles
[All important laws/theories with statements]

## 🧮 Formulas & Equations
[All important formulas (if applicable)]

## 🔬 Mechanisms & Processes (Step-by-Step)
[Important processes explained step by step]

## 🖼️ Important Diagrams & Structures
[Describe key diagrams, what to label, what to show]

## ⭐ Most Important Points for Board Exam
[Bullet points of must-know items, mark most critical with ★]

## ❌ Common Mistakes to Avoid
[List common errors students make]

## 📅 Previous Year Questions (Topics)
[Topics commonly asked in board exams]

## 🔁 Quick Revision Summary
[10-15 bullet point summary for last-minute revision]

Be thorough, use clear formatting, and cover ALL NCERT content for this chapter. Make it board-exam focused.`, 2000);
      setNotes(text);
      await saveProgress(`${subj}||${chap}||notes`, { read: true, date: Date.now() });
    } catch(e) { setNotes("❌ Error: " + e.message); }
    setLoading(false);
  };

  const genQuiz = async (subj, chap) => {
    setLoading(true); setLoadMsg(`Generating 50 MCQs for "${chap}"`); setLoadEmoji("🧠");
    setQuiz([]); setAnswers({}); setSubmitted(false); setQIdx(0); setQuizErr("");
    try {
      const text = await callClaude(`Generate exactly 50 CBSE Class 12 board-level MCQ questions for the chapter "${chap}" from ${subj}.

CRITICAL: Return ONLY a valid JSON array. No markdown, no backticks, no explanation. Just the raw JSON array.

Format:
[{"q":"Full question text?","opts":["A. option one","B. option two","C. option three","D. option four"],"ans":0,"exp":"Explanation of why this answer is correct"}]

Rules:
- "ans" is 0-based index (0=A, 1=B, 2=C, 3=D)
- Cover ALL subtopics of this chapter proportionally
- Difficulty: 30% easy, 50% medium, 20% hard
- Base strictly on NCERT Class 12 textbook content
- Include numerical/formula-based questions where applicable
- Make distractors plausible and educational
- Generate ALL 50 questions

Start your response with [ and end with ]`, 7000);

      let cleaned = text.trim();
      cleaned = cleaned.replace(/```json\n?|```\n?/g, "").trim();
      const start = cleaned.indexOf("[");
      const end = cleaned.lastIndexOf("]");
      if (start === -1 || end === -1) throw new Error("No JSON array found");
      cleaned = cleaned.slice(start, end + 1);
      const parsed = JSON.parse(cleaned);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Empty quiz");
      setQuiz(parsed);
    } catch (e) {
      setQuizErr("Failed to generate quiz: " + e.message);
    }
    setLoading(false);
  };

  const genPaper = async (subj) => {
    setLoading(true); setLoadMsg(`Generating Sample Paper for ${subj}`); setLoadEmoji("📄"); setPaper("");
    try {
      const marks = subj === "English" ? 80 : 70;
      const text = await callClaude(`Create a complete, realistic CBSE Class 12 Board Exam Sample Paper for ${subj}.

Follow the LATEST official CBSE pattern:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CENTRAL BOARD OF SECONDARY EDUCATION
SAMPLE QUESTION PAPER — CLASS XII
Subject: ${subj} (${subj === "Physics" ? "042" : subj === "Chemistry" ? "043" : subj === "Biology" ? "044" : "301"})
Time Allowed: 3 Hours                Maximum Marks: ${marks}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Include:
- General Instructions (5-6 points)
- Section A: 1-mark MCQs and Assertion-Reasoning (16-20 marks)
- Section B: 2-mark short answer (10 marks)  
- Section C: 3-mark short answer (12-15 marks)
- Section D: 5-mark long answer (15-20 marks)
- Section E: Case-study / Source-based (if applicable for ${subj})

Cover ALL chapters/units proportionally.
End with a complete ANSWER KEY / MARKING SCHEME.
Make it exam-quality, with real questions (not just placeholders).`, 4000);
      setPaper(text);
    } catch { setPaper("❌ Error generating sample paper. Please try again."); }
    setLoading(false);
  };

  const submitQuiz = async () => {
    let sc = 0;
    quiz.forEach((q, i) => { if (answers[i] === q.ans) sc++; });
    setScore(sc);
    setSubmitted(true);
    const key = `${subject}||${chapter}||quiz`;
    const prev = progress[key] || { attempts: [] };
    await saveProgress(key, {
      attempts: [...(prev.attempts || []), { score: sc, total: quiz.length, date: Date.now() }],
      best: Math.max(sc, ...(prev.attempts || []).map(a => a.score), 0)
    });
  };

  // ---- PROGRESS STATS ----
  const getStats = () => {
    let notesRead = 0, quizDone = 0;
    const bySubject = {};
    Object.entries(CURRICULUM).forEach(([s, d]) => {
      let sN = 0, sQ = 0, sT = 0;
      d.units.forEach(u => u.chapters.forEach(ch => {
        sT++;
        if (progress[`${s}||${ch}||notes`]?.read) { notesRead++; sN++; }
        if ((progress[`${s}||${ch}||quiz`]?.attempts?.length || 0) > 0) { quizDone++; sQ++; }
      }));
      bySubject[s] = { n: sN, q: sQ, t: sT };
    });
    return { notesRead, quizDone, bySubject };
  };

  const stats = getStats();
  const overallPct = Math.round((stats.notesRead + stats.quizDone) / (totalChapters * 2) * 100);

  // ====================
  // RENDER
  // ====================

  const S = subject ? CURRICULUM[subject] : null;

  // ---- AUTH VIEW ----
  if (view === "auth") return (
    <div style={{ minHeight: "100vh", width: "100%", background: "#fff0f5", display: "flex", fontFamily: "'Segoe UI', system-ui, sans-serif", overflow: "hidden" }}>
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
      `}</style>

      {/* ===== LEFT PANEL ===== */}
      <div style={{ flex: 1, background: "linear-gradient(140deg, #fce4ec 0%, #fdf2f8 55%, #fce4ec 100%)", display: "flex", flexDirection: "column", justifyContent: "center", padding: "56px 60px", position: "relative", overflow: "hidden", minWidth: 0 }}>
        <div style={{ position: "absolute", top: -100, left: -100, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.18) 0%, transparent 70%)", animation: "glow 4s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(244,114,182,0.14) 0%, transparent 70%)", animation: "glow 5s ease-in-out infinite 1s" }} />

        {/* Developer pill */}
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
        <h1 style={{ color: "#831843", fontSize: 44, fontWeight: 900, margin: "0 0 14px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
          CBSE Class 12<br/>
          <span style={{ background: "linear-gradient(135deg, #ec4899, #f472b4, #f9a8d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI Study Platform</span>
        </h1>
        <p style={{ color: "#be185d", fontSize: 15, lineHeight: 1.7, marginBottom: 36, maxWidth: 440 }}>
          Complete NCERT-based preparation for Board Exams 2025–26. AI-generated notes, 50 MCQs per chapter, sample papers and progress tracking.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 40, maxWidth: 460 }}>
          {[
            { emoji: "⚛️", name: "Physics", units: "9 Units · 15 Chapters", bg: "rgba(236,72,153,0.07)", border: "rgba(236,72,153,0.25)" },
            { emoji: "🧪", name: "Chemistry", units: "8 Units · 16 Chapters", bg: "rgba(244,114,182,0.07)", border: "rgba(244,114,182,0.25)" },
            { emoji: "🌿", name: "Biology", units: "5 Units · 14 Chapters", bg: "rgba(251,191,36,0.07)", border: "rgba(251,191,36,0.2)" },
            { emoji: "📖", name: "English", units: "4 Units · 27 Topics", bg: "rgba(168,85,247,0.07)", border: "rgba(168,85,247,0.2)" },
          ].map(({ emoji, name, units, bg, border }) => (
            <div key={name} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{emoji}</div>
              <div style={{ color: "#831843", fontWeight: 700, fontSize: 14 }}>{name}</div>
              <div style={{ color: "#be185d", fontSize: 11, marginTop: 2 }}>{units}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
      <div style={{ width: 440, flexShrink: 0, background: "#fce4ec", display: "flex", flexDirection: "column", justifyContent: "center", padding: "48px 40px", borderLeft: "1px solid #fbcfe8", overflowY: "auto" }}>
        <div style={{ width: "100%" }}>

          <h2 style={{ color: "#831843", fontSize: 22, fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            {authTab === "login" ? "Welcome back 👋" : "Create Account ✨"}
          </h2>
          <p style={{ color: "#be185d", fontSize: 13, marginBottom: 28 }}>
            {authTab === "login" ? "Sign in to continue your preparation" : "Join thousands of Class 12 students"}
          </p>

          {/* Tabs */}
          <div style={{ display: "flex", background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 4, marginBottom: 24 }}>
            {[["login","🔑 Sign In"],["register","✨ Register"]].map(([t, label]) => (
              <button key={t} className="tab-btn" onClick={() => { setAuthTab(t); setAuthErr(""); }}
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
  );

    // ---- MAIN LAYOUT ----
  const canGoBack = viewStack.length > 2;

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: "#fff0f5", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { width: 100%; min-height: 100vh; background: #fff0f5; }
        button { cursor: pointer; font-family: inherit; }
        .card { background: white; border-radius: 16px; border: 1px solid #fce7f3; padding: 20px; transition: box-shadow 0.2s, transform 0.2s; }
        .card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
        .opt-btn { width: 100%; text-align: left; padding: 14px 18px; border-radius: 12px; border: 2px solid #fce7f3; background: white; color: #1e293b; fontSize: 14px; lineHeight: 1.5; transition: all 0.15s; }
        .opt-btn:hover { border-color: #f472b4; background: #fff0f5; }
        .opt-selected { border-color: #ec4899 !important; background: #fdf2f8 !important; color: #be185d !important; font-weight: 600; }
        .opt-correct { border-color: #16a34a !important; background: #f0fdf4 !important; color: #15803d !important; }
        .opt-wrong { border-color: #dc2626 !important; background: #fef2f2 !important; color: #dc2626 !important; }
        .qnum { width: 30px; height: 30px; border-radius: 8px; border: none; font-size: 11px; font-weight: 700; cursor: pointer; transition: all 0.1s; }
        .qnum:hover { transform: scale(1.1); }
        .prose-notes { font-family: 'Georgia', 'Times New Roman', serif; line-height: 1.85; color: #2d1832; font-size: 15px; }
        .prose-notes-block { background: linear-gradient(135deg, #fff8fb 0%, #fff0f5 100%); border-radius: 18px; border: 1px solid #fce7f3; padding: 40px 48px; box-shadow: 0 4px 32px rgba(236,72,153,0.07), 0 1px 4px rgba(0,0,0,0.04); }
        .prose-notes h1 { font-family: 'Georgia', serif; font-size: 26px; font-weight: 900; color: #831843; margin: 0 0 4px; letter-spacing: -0.02em; line-height: 1.2; }
        .prose-notes h2 { font-family: 'Segoe UI', system-ui, sans-serif; font-size: 15px; font-weight: 800; color: #be185d; margin: 32px 0 12px; padding: 10px 16px; background: linear-gradient(90deg, #fce7f3, #fff0f5); border-left: 4px solid #ec4899; border-radius: 0 10px 10px 0; text-transform: uppercase; letter-spacing: 0.06em; }
        .prose-notes h3 { font-family: 'Segoe UI', system-ui, sans-serif; font-size: 14px; font-weight: 700; color: #9d174d; margin: 20px 0 6px; }
        .prose-notes p { margin: 0 0 12px; }
        .prose-notes hr { border: none; border-top: 2px dashed #fce7f3; margin: 20px 0; }
        .prose-notes strong { color: #831843; font-weight: 700; }
        .prose-notes li { margin-bottom: 6px; padding-left: 4px; }
        .prose-notes ul, .prose-notes ol { padding-left: 22px; margin: 8px 0 14px; }
        .prose-notes code { background: #fdf2f8; color: #be185d; padding: 1px 6px; border-radius: 5px; font-size: 13px; font-family: 'Courier New', monospace; }
        .prose-notes blockquote { border-left: 4px solid #f9a8d4; background: #fff0f5; padding: 10px 16px; border-radius: 0 10px 10px 0; margin: 14px 0; color: #9d174d; font-style: italic; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #fff0f5; } ::-webkit-scrollbar-thumb { background: #f9a8d4; border-radius: 3px; }
      `}</style>

      {/* TOP NAV */}
      <nav style={{ background: "white", borderBottom: "1px solid #fce7f3", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 8px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {canGoBack && (
              <button onClick={goBack} style={{ background: "#fce7f3", border: "none", borderRadius: 8, padding: "6px 12px", color: "#be185d", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                ← Back
              </button>
            )}
            <button onClick={() => { setView("dashboard"); setViewStack(["auth","dashboard"]); setSubject(null); setChapter(null); }} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", color: "#ec4899", fontWeight: 800, fontSize: 18 }}>
              🎓 <span style={{ letterSpacing: "-0.02em" }}>CBSE12</span>
            </button>
            {subject && <span style={{ color: "#94a3b8", fontSize: 13 }}>/ {S.emoji} {subject}</span>}
            {chapter && <span style={{ color: "#94a3b8", fontSize: 12, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>/ {chapter}</span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => { setView("progress"); setViewStack(s => [...s, "progress"]); }}
              style={{ background: "#fce7f3", border: "none", borderRadius: 8, padding: "6px 14px", color: "#be185d", fontWeight: 600, fontSize: 13 }}>
              📊 Progress
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#ec4899,#db2777)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15 }}>
                {currentUser?.[0]?.toUpperCase()}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#334155", display: window.innerWidth > 600 ? "block" : "none" }}>{currentUser}</span>
            </div>
            <button onClick={doLogout} style={{ background: "none", border: "1px solid #fce7f3", borderRadius: 8, padding: "6px 12px", color: "#f472b4", fontSize: 13 }}>Logout</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>

        {/* ===== DASHBOARD ===== */}
        {view === "dashboard" && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "#831843", margin: 0 }}>Welcome back, {currentUser}! 👋</h1>
              <p style={{ color: "#be185d", marginTop: 4, fontSize: 15 }}>CBSE Class 12 Board Exam Preparation — All Subjects</p>
            </div>

            {/* Overall Progress */}
            <div style={{ background: "linear-gradient(135deg, #831843 0%, #9d174d 100%)", borderRadius: 20, padding: 24, marginBottom: 24, color: "white", display: "flex", flexWrap: "wrap", gap: 20, alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 4 }}>Overall Progress</div>
                <div style={{ fontSize: 40, fontWeight: 900 }}>{overallPct}%</div>
                <div style={{ fontSize: 13, color: "#6366f1", marginTop: 2 }}>Towards Board Exam Readiness</div>
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {[
                  { v: stats.notesRead, t: "Notes Read", emoji: "📝", c: "#818cf8" },
                  { v: stats.quizDone, t: "Quizzes Done", emoji: "✅", c: "#34d399" },
                  { v: totalChapters, t: "Total Chapters", emoji: "📚", c: "#f59e0b" }
                ].map(({ v, t, emoji, c }) => (
                  <div key={t} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 14, padding: "14px 20px", textAlign: "center", minWidth: 90 }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{emoji}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: c }}>{v}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{t}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Subject Cards */}
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#475569", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>📚 Select a Subject</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))", gap: 16 }}>
              {Object.entries(CURRICULUM).map(([s, d]) => {
                const st = stats.bySubject[s];
                const pct = Math.round((st.n + st.q) / (st.t * 2) * 100);
                return (
                  <button key={s} className="card hover-lift" onClick={() => { setSubject(s); setChapter(null); nav("subject"); }}
                    style={{ textAlign: "left", border: "none", width: "100%", padding: 0, overflow: "hidden" }}>
                    <div style={{ background: d.gradient, padding: "20px 20px 16px", color: "white" }}>
                      <div style={{ fontSize: 32, marginBottom: 6 }}>{d.emoji}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>{s}</div>
                      <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{d.units.length} Units · {st.t} Chapters · NCERT Class 12</div>
                    </div>
                    <div style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                        <span>Progress</span><span style={{ fontWeight: 700, color: d.accent }}>{pct}%</span>
                      </div>
                      <ProgressBar value={st.n + st.q} max={st.t * 2} color={d.accent} height={6} />
                      <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 12, color: "#64748b" }}>
                        <span>📖 {st.n} notes read</span>
                        <span>✅ {st.q} quizzes done</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ===== SUBJECT VIEW ===== */}
        {view === "subject" && subject && (
          <div>
            <div style={{ background: S.gradient, borderRadius: 20, padding: 28, marginBottom: 24, color: "white" }}>
              <div style={{ fontSize: 44, marginBottom: 8 }}>{S.emoji}</div>
              <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: "-0.02em" }}>{subject}</h1>
              <p style={{ opacity: 0.8, marginTop: 6, fontSize: 14 }}>NCERT Class 12 CBSE · {S.units.length} Units · {stats.bySubject[subject].t} Chapters</p>
              <button onClick={() => { setPaper(""); nav("paper"); genPaper(subject); }}
                style={{ marginTop: 16, background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, padding: "10px 20px", color: "white", fontWeight: 700, fontSize: 14 }}>
                📄 Generate Sample Board Paper →
              </button>
            </div>

            {S.units.map((unit, ui) => (
              <div key={ui} style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: S.text, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ background: S.light, border: `1px solid ${S.border}`, borderRadius: 6, padding: "2px 10px" }}>{unit.name}</span>
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: 10 }}>
                  {unit.chapters.map((ch, ci) => {
                    const nk = `${subject}||${ch}||notes`;
                    const qk = `${subject}||${ch}||quiz`;
                    const nRead = progress[nk]?.read;
                    const qData = progress[qk];
                    const best = qData?.best;
                    return (
                      <button key={ci} onClick={() => { setChapter(ch); setNotes(""); setQuiz([]); nav("chapter"); }}
                        style={{ background: "white", border: `1.5px solid ${nRead && qData ? S.border : "#fce7f3"}`, borderRadius: 14, padding: "14px 16px", textAlign: "left", transition: "all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = S.accent; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 4px 12px ${S.accent}22`; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = nRead && qData ? S.border : "#fce7f3"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
                        <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 14, lineHeight: 1.4, marginBottom: 8 }}>{ch}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 13 }}>{nRead ? "📖" : "◻️"}</span>
                          <span style={{ fontSize: 11, color: nRead ? "#16a34a" : "#94a3b8" }}>{nRead ? "Notes read" : "Notes"}</span>
                          <span style={{ fontSize: 13, marginLeft: 4 }}>{qData ? "✅" : "◻️"}</span>
                          {best !== undefined ? (
                            <span style={{ fontSize: 11, color: S.text, fontWeight: 700 }}>{best}/50</span>
                          ) : (
                            <span style={{ fontSize: 11, color: "#94a3b8" }}>Quiz</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== CHAPTER HUB ===== */}
        {view === "chapter" && chapter && (
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 20, padding: 24, marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: S.text, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{subject}</div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>{chapter}</h1>
              <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>NCERT Class 12 CBSE — Select what to study</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14 }}>
              {[
                { mode: "notes", emoji: "📝", title: "Detailed Notes", desc: "AI-generated comprehensive NCERT notes", color: "#3b82f6", bg: "#eff6ff", done: progress[`${subject}||${chapter}||notes`]?.read, extra: "Notes read ✓" },
                { mode: "quiz", emoji: "🧠", title: "50 MCQ Quiz", desc: "Board-level practice questions + explanations", color: "#16a34a", bg: "#f0fdf4", done: (progress[`${subject}||${chapter}||quiz`]?.attempts?.length || 0) > 0, extra: `Best: ${progress[`${subject}||${chapter}||quiz`]?.best ?? "—"}/50` },
                { mode: "paper", emoji: "📄", title: "Sample Paper", desc: `Full ${subject} CBSE board exam paper`, color: "#7c3aed", bg: "#f5f3ff", done: false, extra: "Full subject paper" }
              ].map(({ mode, emoji, title, desc, color, bg, done, extra }) => (
                <button key={mode} onClick={() => {
                  if (mode === "paper") { setPaper(""); nav("paper"); genPaper(subject); }
                  else if (mode === "notes") { nav("notes"); if (!notes) genNotes(subject, chapter); }
                  else { setQuiz([]); setAnswers({}); setSubmitted(false); setQIdx(0); nav("quiz"); genQuiz(subject, chapter); }
                }}
                  style={{ background: "white", border: `2px solid ${done ? color + "44" : "#fce7f3"}`, borderRadius: 18, padding: 22, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = bg; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 25px ${color}25`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = done ? color + "44" : "#fce7f3"; e.currentTarget.style.background = "white"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
                  <div style={{ fontSize: 36 }}>{emoji}</div>
                  <div style={{ fontWeight: 800, color: "#1e293b", fontSize: 16 }}>{title}</div>
                  <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.4 }}>{desc}</div>
                  {done && <div style={{ fontSize: 11, color, fontWeight: 700, background: color + "15", padding: "3px 10px", borderRadius: 99 }}>{extra}</div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===== NOTES VIEW ===== */}
        {view === "notes" && (
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            {loading ? <LoadingScreen message={loadMsg} emoji={loadEmoji} /> : (
              <div>
                {/* Notes Header Card */}
                <div style={{ background: "white", borderRadius: 20, border: "1px solid #fce7f3", padding: "22px 32px", boxShadow: "0 2px 12px rgba(236,72,153,0.07)", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <Badge color={S?.accent || "#ec4899"}>{subject}</Badge>
                    <h2 style={{ fontSize: 22, fontWeight: 900, color: "#831843", margin: "6px 0 2px", letterSpacing: "-0.02em" }}>{chapter}</h2>
                    <div style={{ fontSize: 12, color: "#f472b4", fontWeight: 600 }}>NCERT Class 12 CBSE · Study Notes</div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => genNotes(subject, chapter)} style={{ background: "#fce7f3", border: "1px solid #fbcfe8", borderRadius: 10, padding: "9px 18px", color: "#be185d", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>🔄 Regenerate</button>
                    <button onClick={() => { setQuiz([]); setAnswers({}); setSubmitted(false); setQIdx(0); setView("quiz"); genQuiz(subject, chapter); }}
                      style={{ background: "linear-gradient(135deg,#ec4899,#db2777)", border: "none", borderRadius: 10, padding: "9px 20px", color: "white", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 14px rgba(236,72,153,0.35)" }}>🧠 Take Quiz →</button>
                  </div>
                </div>
                {/* Notes Content */}
                <div className="prose-notes-block">
                  <div className="prose-notes">
                    {notes.split('\n').map((line, i) => {
                      if (line.startsWith('# ')) return <h1 key={i}>{line.slice(2)}</h1>;
                      if (line.startsWith('## ')) return <h2 key={i}>{line.slice(3)}</h2>;
                      if (line.startsWith('### ')) return <h3 key={i}>{line.slice(4)}</h3>;
                      if (line.startsWith('---')) return <hr key={i} />;
                      if (line.startsWith('> ')) return <blockquote key={i}>{line.slice(2)}</blockquote>;
                      if (line.startsWith('- ') || line.startsWith('* ')) {
                        const text = line.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                        return <ul key={i} style={{margin:0,paddingLeft:22}}><li dangerouslySetInnerHTML={{ __html: text }} /></ul>;
                      }
                      if (/^\d+\.\s/.test(line)) {
                        const text = line.replace(/^\d+\.\s/, '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                        return <ol key={i} style={{margin:0,paddingLeft:22}}><li dangerouslySetInnerHTML={{ __html: text }} /></ol>;
                      }
                      if (line.trim() === '') return <div key={i} style={{height:6}} />;
                      const formatted = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`(.+?)`/g, '<code>$1</code>');
                      return <p key={i} dangerouslySetInnerHTML={{ __html: formatted }} />;
                    })}
                  </div>
                </div>
                {/* Bottom action bar */}
                <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 24, paddingBottom: 32 }}>
                  <button onClick={() => genNotes(subject, chapter)} style={{ background: "white", border: "1px solid #fce7f3", borderRadius: 12, padding: "11px 24px", color: "#be185d", fontSize: 14, fontWeight: 700 }}>🔄 Regenerate Notes</button>
                  <button onClick={() => { setQuiz([]); setAnswers({}); setSubmitted(false); setQIdx(0); setView("quiz"); genQuiz(subject, chapter); }}
                    style={{ background: "linear-gradient(135deg,#ec4899,#db2777)", border: "none", borderRadius: 12, padding: "11px 28px", color: "white", fontSize: 14, fontWeight: 700, boxShadow: "0 4px 14px rgba(236,72,153,0.35)" }}>🧠 Start Quiz →</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== QUIZ VIEW ===== */}
        {view === "quiz" && (
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            {loading ? <LoadingScreen message={loadMsg} emoji={loadEmoji} /> : quiz.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
                <div style={{ color: "#475569", fontSize: 16, marginBottom: 20 }}>{quizErr || "Failed to load quiz. Please try again."}</div>
                <button onClick={() => { setQuiz([]); genQuiz(subject, chapter); }} style={{ background: "#ec4899", border: "none", borderRadius: 10, padding: "12px 28px", color: "white", fontWeight: 700, fontSize: 15 }}>🔄 Try Again</button>
              </div>
            ) : submitted ? (
              /* RESULTS */
              <div>
                <div style={{ background: score >= 40 ? "#f0fdf4" : score >= 25 ? "#fefce8" : "#fef2f2", border: `2px solid ${score >= 40 ? "#86efac" : score >= 25 ? "#fde047" : "#fca5a5"}`, borderRadius: 20, padding: 32, textAlign: "center", marginBottom: 20 }}>
                  <div style={{ fontSize: 52, marginBottom: 12 }}>{score >= 40 ? "🏆" : score >= 25 ? "👍" : "📚"}</div>
                  <div style={{ fontSize: 52, fontWeight: 900, color: "#0f172a" }}>{score}<span style={{ fontSize: 24, color: "#94a3b8", fontWeight: 400 }}>/{quiz.length}</span></div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: score >= 40 ? "#15803d" : score >= 25 ? "#854d0e" : "#b91c1c" }}>
                    {Math.round(score / quiz.length * 100)}% — {score >= 40 ? "Excellent! Board Ready! 🎉" : score >= 25 ? "Good! Keep Practicing! 💪" : "Needs More Study. Review Notes! 📖"}
                  </div>
                  <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20 }}>
                    <button onClick={() => { setQuiz([]); setAnswers({}); setSubmitted(false); setQIdx(0); genQuiz(subject, chapter); }}
                      style={{ background: "#ec4899", border: "none", borderRadius: 10, padding: "11px 24px", color: "white", fontWeight: 700, fontSize: 14 }}>🔄 Retry Quiz</button>
                    <button onClick={() => { setView("notes"); if (!notes) genNotes(subject, chapter); }}
                      style={{ background: S?.accent || "#6366f1", border: "none", borderRadius: 10, padding: "11px 24px", color: "white", fontWeight: 700, fontSize: 14 }}>📝 Review Notes</button>
                  </div>
                </div>
                <h3 style={{ fontWeight: 700, color: "#334155", marginBottom: 14 }}>Answer Review</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {quiz.map((q, i) => {
                    const ua = answers[i]; const ca = q.ans; const ok = ua === ca;
                    return (
                      <div key={i} style={{ background: "white", border: `1.5px solid ${ok ? "#86efac" : "#fca5a5"}`, borderRadius: 14, padding: 16 }}>
                        <div style={{ display: "flex", gap: 10, marginBottom: ok ? 0 : 8 }}>
                          <span style={{ background: ok ? "#dcfce7" : "#fee2e2", color: ok ? "#15803d" : "#dc2626", fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 99, flexShrink: 0, alignSelf: "flex-start", marginTop: 1 }}>Q{i + 1} {ok ? "✓" : "✗"}</span>
                          <span style={{ fontSize: 13, color: "#334155", lineHeight: 1.5 }}>{q.q}</span>
                        </div>
                        {!ok && (
                          <div style={{ marginLeft: 48, fontSize: 12 }}>
                            <div style={{ color: "#dc2626" }}>Your answer: {q.opts[ua] || "Not answered"}</div>
                            <div style={{ color: "#16a34a", fontWeight: 600 }}>Correct: {q.opts[ca]}</div>
                          </div>
                        )}
                        <div style={{ marginLeft: 48, marginTop: 6, fontSize: 12, color: "#4f46e5", fontStyle: "italic" }}>💡 {q.exp}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* QUIZ IN PROGRESS */
              <div>
                {/* Header */}
                <div style={{ background: "white", borderRadius: 16, border: "1px solid #fce7f3", padding: "14px 20px", marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Question {qIdx + 1} / {quiz.length}</span>
                      <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: 12 }}>{Object.keys(answers).length} answered</span>
                    </div>
                    <Badge color={S?.accent || "#6366f1"}>{subject}</Badge>
                  </div>
                  <ProgressBar value={qIdx + 1} max={quiz.length} color={S?.accent || "#6366f1"} height={5} />
                </div>

                {/* Question */}
                {quiz[qIdx] && (
                  <div style={{ background: "white", borderRadius: 18, border: "1px solid #fce7f3", padding: "24px 24px", marginBottom: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Question {qIdx + 1}</div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", lineHeight: 1.6, marginBottom: 20 }}>{quiz[qIdx].q}</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {quiz[qIdx].opts.map((opt, oi) => (
                        <button key={oi} className={`opt-btn ${answers[qIdx] === oi ? "opt-selected" : ""}`} onClick={() => setAnswers(a => ({ ...a, [qIdx]: oi }))}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  <button onClick={() => setQIdx(q => Math.max(0, q - 1))} disabled={qIdx === 0}
                    style={{ padding: "11px 20px", background: "#fce7f3", border: "none", borderRadius: 10, color: "#be185d", fontWeight: 600, fontSize: 14, opacity: qIdx === 0 ? 0.4 : 1 }}>
                    ← Prev
                  </button>
                  {qIdx < quiz.length - 1 ? (
                    <button onClick={() => setQIdx(q => q + 1)} style={{ flex: 1, padding: "11px", background: "#ec4899", border: "none", borderRadius: 10, color: "white", fontWeight: 700, fontSize: 14 }}>
                      Next →
                    </button>
                  ) : (
                    <button onClick={submitQuiz} style={{ flex: 1, padding: "11px", background: "#16a34a", border: "none", borderRadius: 10, color: "white", fontWeight: 700, fontSize: 14 }}>
                      Submit Quiz ({Object.keys(answers).length}/{quiz.length}) ✓
                    </button>
                  )}
                </div>

                {/* Question Palette */}
                <div style={{ background: "white", borderRadius: 14, border: "1px solid #fce7f3", padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Question Navigator</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {quiz.map((_, i) => (
                      <button key={i} className="qnum" onClick={() => setQIdx(i)}
                        style={{ background: i === qIdx ? (S?.accent || "#6366f1") : answers[i] !== undefined ? "#dcfce7" : "#fce7f3", color: i === qIdx ? "white" : answers[i] !== undefined ? "#15803d" : "#64748b", border: i === qIdx ? "none" : answers[i] !== undefined ? "1px solid #86efac" : "1px solid #fce7f3" }}>
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 11, color: "#94a3b8" }}>
                    <span>🟦 Current</span>
                    <span style={{ color: "#16a34a" }}>✅ Answered ({Object.keys(answers).length})</span>
                    <span>⬜ Unanswered ({quiz.length - Object.keys(answers).length})</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== SAMPLE PAPER ===== */}
        {view === "paper" && (
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            {loading ? <LoadingScreen message={loadMsg} emoji={loadEmoji} /> : (
              <div style={{ background: "white", borderRadius: 20, border: "1px solid #fce7f3", padding: "28px 32px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #fce7f3", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <Badge color={S?.accent || "#6366f1"}>{subject}</Badge>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", margin: "8px 0 0" }}>Sample Board Exam Paper</h2>
                  </div>
                  <button onClick={() => genPaper(subject)} style={{ background: "#fce7f3", border: "none", borderRadius: 9, padding: "8px 16px", color: "#be185d", fontSize: 13, fontWeight: 600 }}>🔄 Regenerate</button>
                </div>
                <pre style={{ whiteSpace: "pre-wrap", fontFamily: "'Courier New', monospace", fontSize: 13, color: "#334155", lineHeight: 1.8, margin: 0 }}>{paper}</pre>
              </div>
            )}
          </div>
        )}

        {/* ===== PROGRESS VIEW ===== */}
        {view === "progress" && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>📊 My Progress</h1>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>Tracking your preparation across all subjects</p>

            {/* Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 14, marginBottom: 28 }}>
              {[
                { v: overallPct + "%", label: "Overall Completion", c: "linear-gradient(135deg,#ec4899,#db2777)", emoji: "🎯" },
                { v: stats.notesRead, label: "Notes Read", c: "linear-gradient(135deg,#0ea5e9,#3b82f6)", emoji: "📝" },
                { v: stats.quizDone, label: "Quizzes Completed", c: "linear-gradient(135deg,#10b981,#16a34a)", emoji: "✅" },
                { v: totalChapters, label: "Total Chapters", c: "linear-gradient(135deg,#f59e0b,#d97706)", emoji: "📚" },
              ].map(({ v, label, c, emoji }) => (
                <div key={label} style={{ background: c, borderRadius: 16, padding: "18px 20px", color: "white" }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{emoji}</div>
                  <div style={{ fontSize: 32, fontWeight: 900 }}>{v}</div>
                  <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Per Subject */}
            {Object.entries(CURRICULUM).map(([s, d]) => {
              const st = stats.bySubject[s];
              const pct = Math.round((st.n + st.q) / (st.t * 2) * 100);
              return (
                <div key={s} className="card" style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
                    <div style={{ width: 50, height: 50, borderRadius: 14, background: d.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{d.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, color: "#0f172a", fontSize: 17 }}>{s}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{st.n} notes read · {st.q} quizzes done · {st.t} chapters total</div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: d.accent }}>{pct}%</div>
                  </div>
                  <ProgressBar value={st.n + st.q} max={st.t * 2} color={d.accent} height={8} />

                  {/* Chapter breakdown */}
                  <div style={{ marginTop: 18 }}>
                    {d.units.map((unit, ui) => (
                      <div key={ui} style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: d.text, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, background: d.light, display: "inline-block", padding: "2px 10px", borderRadius: 6 }}>
                          {unit.name}
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 6 }}>
                          {unit.chapters.map((ch, ci) => {
                            const nk = `${s}||${ch}||notes`;
                            const qk = `${s}||${ch}||quiz`;
                            const nRead = progress[nk]?.read;
                            const qData = progress[qk];
                            const best = qData?.best;
                            const attempts = qData?.attempts?.length || 0;
                            return (
                              <div key={ci} style={{ background: "#fff0f5", borderRadius: 10, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                                <span style={{ fontSize: 12, color: "#334155", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch}</span>
                                <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                                  <span title="Notes">{nRead ? "📖" : "◻️"}</span>
                                  <span title="Quiz">{attempts > 0 ? "✅" : "◻️"}</span>
                                  {best !== undefined && <span style={{ fontSize: 11, fontWeight: 700, color: d.text }}>{best}/50</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ===== DEVELOPER FOOTER ===== */}
      <footer style={{ marginTop: 24, background: "#831843", borderTop: "1px solid #9d174d", padding: "10px 20px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <span style={{ fontSize: 9, color: "#fce7f3", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Built by</span>
          <span style={{ color: "white", fontWeight: 700, fontSize: 12 }}>Ayush Kumar Maurya</span>
          <span style={{ color: "#1e293b", fontSize: 14 }}>|</span>
          {[
            { href: "https://github.com/akm45vns-oss", label: "GitHub" },
            { href: "https://www.linkedin.com/in/ayush-kumar-maurya-326071384/", label: "LinkedIn" },
            { href: "https://www.instagram.com/ayush.maurya45/", label: "Instagram" },
          ].map(({ href, label }) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer"
              style={{ color: "#475569", fontSize: 11, fontWeight: 600, textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#fda4af"}
              onMouseLeave={e => e.currentTarget.style.color = "#fce7f3"}>
              {label}
            </a>
          ))}
          <span style={{ marginLeft: "auto", fontSize: 10, color: "#334155" }}>© 2025 · CBSE Class 12 AI Platform</span>
        </div>
      </footer>
    </div>
  );
}