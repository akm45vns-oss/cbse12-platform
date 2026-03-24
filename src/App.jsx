import { useState, useEffect } from "react";
import { useAuth, useNavigation, useProgress, useTheme, useKeyboardShortcuts } from "./hooks";
import { callClaude, extractJSON } from "./utils/api";
import { supabase, getChapterNotes } from "./utils/supabase";
import { CURRICULUM, totalChapters } from "./constants/curriculum";
import { SearchBar } from "./components/common/SearchBar";
import { recordDailyActivity } from "./utils/loginStreak";
import { recordChapterAccess } from "./utils/recentChapters";
import { recordQuizSubmission } from "./utils/weakTopics";
import {
  AuthView,
  DashboardView,
  SubjectView,
  ChapterView,
  NotesView,
  QuizView,
  PaperView,
  ProgressView,
  StatsView,
} from "./components/views";
import { FloatingForumButton } from "./components/common";
import { globalStyles } from "./styles/shared";






// ===== MAIN APP =====
export default function App() {
  // Import custom hooks for state management
  const auth = useAuth();
  const nav = useNavigation();
  const progress = useProgress();
  const theme = useTheme();

  // Content generation state
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

  // Load progress on user login
  useEffect(() => {
    if (auth.currentUser) {
      progress.load(auth.currentUser);
      recordDailyActivity(); // Track daily login streak
      nav.goToDashboard();
    } else {
      nav.navigate("auth");
    }
  }, [auth.currentUser]);

  // Content generation functions
  const genNotes = async (subj, chap) => {
    setLoading(true);
    setLoadMsg(`Loading notes for "${chap}"`);
    setLoadEmoji("📝");
    setNotes("");
    try {
      // Try to load from database first
      const cachedNotes = await getChapterNotes(subj, chap);
      if (cachedNotes) {
        setNotes(cachedNotes);
        progress.save(`${subj}||${chap}||notes`, { read: true, date: Date.now() });
        setLoading(false);
        return;
      }
      
      // If not in database, generate with API (fallback)
      setLoadMsg(`Generating notes for "${chap}"...`);
      const text = await callClaude(
        `Create comprehensive CBSE Class 12 NCERT study notes for the chapter "${chap}" from ${subj}.
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
Be thorough, use clear formatting, and cover ALL NCERT content for this chapter. Make it board-exam focused.`,
        3500
      );
      setNotes(text);
      progress.save(`${subj}||${chap}||notes`, { read: true, date: Date.now() });
    } catch (e) {
      setNotes("❌ Error: " + e.message);
    }
    setLoading(false);
  };

  const genQuiz = async (subj, chap) => {
    setLoading(true);
    setLoadMsg(`Generating Quiz for "${chap}"`);
    setLoadEmoji("🧠");
    setQuiz([]);
    setAnswers({});
    setSubmitted(false);
    setQIdx(0);
    setQuizErr("");

    const generateBatch = async (batch) => {
      const prompt = `Generate exactly 25 CBSE Class 12 board-level MCQ questions for "${chap}" from ${subj}. This is batch ${batch} of 2 — generate questions ${
        batch === 1 ? "1–25" : "26–50"
      }, covering ${batch === 1 ? "the first half" : "the second half"} of the chapter topics.
CRITICAL: Return ONLY a valid JSON array. No markdown, no backticks, no explanation. Start with [ and end with ].
Format: [{"q":"Question text?","opts":["A. option","B. option","C. option","D. option"],"ans":0,"exp":"Brief explanation"}]
Rules:
- "ans" is 0-based index (0=A,1=B,2=C,3=D)
- NCERT Class 12 content only
- Difficulty: 30% easy, 50% medium, 20% hard
- Include formula/numerical questions where applicable
- Generate all 25 questions, no placeholders`;
      return await callClaude(prompt, 4000);
    };

    try {
      setLoadMsg("Generating Part 1 of 2...");
      const text1 = await generateBatch(1);
      const batch1 = extractJSON(text1);
      
      setLoadMsg("Generating Part 2 of 2...");
      const text2 = await generateBatch(2);
      const batch2 = extractJSON(text2);
      
      setQuiz([...batch1, ...batch2]);
    } catch (e) {
      setQuizErr("Failed to generate quiz: " + e.message);
    }
    setLoading(false);
  };

  const genPaper = async (subj) => {
    setLoading(true);
    setLoadMsg(`Generating Sample Paper for ${subj}`);
    setLoadEmoji("📄");
    setPaper("");
    try {
      const marks = subj === "English" ? 80 : subj === "Physical Education" ? 70 : 80;
      const text = await callClaude(
        `Create a complete, realistic CBSE Class 12 Board Exam Sample Paper for ${subj}.
Follow the LATEST official CBSE pattern:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CENTRAL BOARD OF SECONDARY EDUCATION
SAMPLE QUESTION PAPER — CLASS XII
Subject: ${subj}
Time Allowed: 3 Hours | Maximum Marks: ${marks}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Include:
- General Instructions (5-6 points)
- Section A: 1-mark MCQs and Assertion-Reasoning (16-20 marks)
- Section B: 2-mark short answer (10 marks)
- Section C: 3-mark short answer (12-15 marks)
- Section D: 5-mark long answer (15-20 marks)
- Section E: Case-study / Source-based (if applicable for ${subj})
Cover ALL chapters/units proportionally.
End with complete ANSWER KEY / MARKING SCHEME.
Make it exam-quality with real questions.`,
        4000
      );
      setPaper(text);
    } catch (e) {
      setPaper("❌ Error generating sample paper. Please try again.");
    }
    setLoading(false);
  };

  const submitQuiz = async () => {
    let sc = 0;
    quiz.forEach((q, i) => {
      if (answers[i] === q.ans) sc++;
    });
    setScore(sc);
    setSubmitted(true);
    
    // Record quiz submission for weak topics analysis
    recordQuizSubmission(nav.subject, nav.chapter, answers, quiz);
    
    const key = `${nav.subject}||${nav.chapter}||quiz`;
    const prev = progress.data[key] || { attempts: [] };
    progress.save(key, {
      attempts: [...(prev.attempts || []), { score: sc, total: quiz.length, date: Date.now() }],
      best: Math.max(sc, ...(prev.attempts || []).map((a) => a.score), 0),
    });
  };

  // Not authenticated
  if (nav.view === "auth") {
    return (
      <AuthView
        authTab={auth.authTab}
        uname={auth.credentials.username}
        pass={auth.credentials.password}
        pass2={auth.credentials.confirmPassword}
        authErr={auth.error}
        setAuthTab={auth.setAuthTab}
        setUname={(u) => auth.setCredentials({ ...auth.credentials, username: u })}
        setPass={(p) => auth.setCredentials({ ...auth.credentials, password: p })}
        setPass2={(p) => auth.setCredentials({ ...auth.credentials, confirmPassword: p })}
        doLogin={auth.doLogin}
        doRegister={auth.doRegister}
      />
    );
  }

  const S = nav.subject ? CURRICULUM[nav.subject] : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "#f0f9fc",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      <style>{globalStyles}</style>

      {/* Top Navigation */}
      <nav
        style={{
          background: theme.isDarkMode ? "#1e293b" : "white",
          borderBottom: theme.isDarkMode ? "1px solid #334155" : "1px solid #dbeafe",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: theme.isDarkMode ? "0 1px 8px rgba(0,0,0,0.3)" : "0 1px 8px rgba(0,0,0,0.06)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="nav-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {nav.canGoBack && (
              <button
                onClick={nav.goBack}
                style={{
                  background: theme.isDarkMode ? "#334155" : "#dbeafe",
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 12px",
                  color: theme.isDarkMode ? "#06b6d4" : "#0369a1",
                  fontWeight: 600,
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                ← Back
              </button>
            )}
            <button
              onClick={nav.goToDashboard}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "none",
                border: "none",
                color: "#0891b2",
                fontWeight: 800,
                fontSize: 18,
              }}
            >
              🎓 <span style={{ letterSpacing: "-0.02em" }}>AkmEdu</span>
            </button>
            {nav.subject && (
              <span style={{ color: theme.isDarkMode ? "#cbd5e1" : "#94a3b8", fontSize: 13 }}>
                / {S.emoji} {nav.subject}
              </span>
            )}
            {nav.chapter && (
              <span
                style={{
                  color: "#94a3b8",
                  fontSize: 12,
                  maxWidth: 140,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "none",
                }}
                className="breadcrumb-chapter"
              >
                / {nav.chapter}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => nav.navigate("stats")}
              style={{
                background: theme.isDarkMode ? "#334155" : "#dbeafe",
                border: "none",
                borderRadius: 8,
                padding: "6px 14px",
                color: theme.isDarkMode ? "#06b6d4" : "#0369a1",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              📊 Stats
            </button>
            <button
              onClick={() => nav.navigate("progress")}
              style={{
                background: theme.isDarkMode ? "#334155" : "#dbeafe",
                border: "none",
                borderRadius: 8,
                padding: "6px 14px",
                color: theme.isDarkMode ? "#06b6d4" : "#0369a1",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              📊 Progress
            </button>
            <button
              onClick={theme.toggleTheme}
              title="Toggle dark mode (Ctrl+D)"
              style={{
                background: theme.isDarkMode ? "#334155" : "#dbeafe",
                border: "none",
                borderRadius: 8,
                padding: "6px 12px",
                color: theme.isDarkMode ? "#06b6d4" : "#0369a1",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {theme.isDarkMode ? "☀️" : "🌙"}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#0891b2,#0284c7)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 15,
                }}
              >
                {auth.currentUser?.[0]?.toUpperCase()}
              </div>
              <span
                className="nav-username"
                style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}
              >
                {auth.currentUser}
              </span>
            </div>
            <button
              onClick={auth.doLogout}
              style={{
                background: "none",
                border: "1px solid #dbeafe",
                borderRadius: 8,
                padding: "6px 12px",
                color: "#06b6d4",
                fontSize: 13,
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="main-content">
        {nav.view === "dashboard" && (
          <DashboardView
            currentUser={auth.currentUser}
            stats={progress.getStats()}
            overallPct={progress.getOverallPercentage()}
            totalChapters={totalChapters}
            onSelectSubject={(subject) => {
              nav.navigateToSubject(subject);
            }}
          />
        )}

        {nav.view === "subject" && nav.subject && (
          <SubjectView
            subject={nav.subject}
            curriculum={CURRICULUM}
            stats={progress.getStats()}
            progress={progress.data}
            onSelectChapter={(chapter) => {
              nav.navigateToChapter(chapter);
            }}
            onGeneratePaper={() => {
              setPaper("");
              nav.navigate("paper");
              genPaper(nav.subject);
            }}
          />
        )}

        {nav.view === "chapter" && nav.chapter && (
          <ChapterView
            chapter={nav.chapter}
            subject={nav.subject}
            curriculumData={S}
            notesRead={progress.data[`${nav.subject}||${nav.chapter}||notes`]?.read}
            quizBest={progress.data[`${nav.subject}||${nav.chapter}||quiz`]?.best}
            onStartNotes={() => {
              nav.navigate("notes");
              if (!notes) genNotes(nav.subject, nav.chapter);
            }}
            onStartQuiz={() => {
              setQuiz([]);
              setAnswers({});
              setSubmitted(false);
              setQIdx(0);
              nav.navigate("quiz");
              genQuiz(nav.subject, nav.chapter);
            }}
            onStartPaper={() => {
              setPaper("");
              nav.navigate("paper");
              genPaper(nav.subject);
            }}
          />
        )}

        {nav.view === "notes" && (
          <NotesView
            loading={loading}
            loadMsg={loadMsg}
            loadEmoji={loadEmoji}
            notes={notes}
            subject={nav.subject}
            chapter={nav.chapter}
            curriculumData={S}
            onRegenerateNotes={() => genNotes(nav.subject, nav.chapter)}
            onStartQuiz={() => {
              setQuiz([]);
              setAnswers({});
              setSubmitted(false);
              setQIdx(0);
              nav.navigate("quiz");
              genQuiz(nav.subject, nav.chapter);
            }}
          />
        )}

        {nav.view === "quiz" && (
          <QuizView
            loading={loading}
            loadMsg={loadMsg}
            loadEmoji={loadEmoji}
            quiz={quiz}
            quizErr={quizErr}
            qIdx={qIdx}
            setQIdx={setQIdx}
            answers={answers}
            setAnswers={setAnswers}
            submitted={submitted}
            score={score}
            subject={nav.subject}
            chapter={nav.chapter}
            curriculumData={S}
            onSubmit={submitQuiz}
            onRetry={() => {
              setQuiz([]);
              setAnswers({});
              setSubmitted(false);
              setQIdx(0);
              genQuiz(nav.subject, nav.chapter);
            }}
            onReviewNotes={() => {
              nav.navigate("notes");
              if (!notes) genNotes(nav.subject, nav.chapter);
            }}
          />
        )}

        {nav.view === "paper" && (
          <PaperView
            loading={loading}
            loadMsg={loadMsg}
            loadEmoji={loadEmoji}
            paper={paper}
            subject={nav.subject}
            curriculumData={S}
            onRegenerate={() => genPaper(nav.subject)}
          />
        )}

        {nav.view === "progress" && (
          <ProgressView
            overallPct={progress.getOverallPercentage()}
            stats={progress.getStats()}
            totalChapters={totalChapters}
            curriculum={CURRICULUM}
            progressData={progress.data}
          />
        )}

        {nav.view === "stats" && (
          <StatsView />
        )}
      </div>

      {/* Footer */}
      <footer
        style={{
          marginTop: 24,
          background: theme.isDarkMode ? "#1e293b" : "#064e78",
          borderTop: theme.isDarkMode ? "1px solid #334155" : "1px solid #9d174d",
          padding: "12px 16px",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 9,
              color: "#dbeafe",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Built by
          </span>
          <span style={{ color: "white", fontWeight: 700, fontSize: 12 }}>
            Ayush Kumar Maurya
          </span>
          <span style={{ color: "#1e293b", fontSize: 14 }}>|</span>
          {[
            { href: "https://github.com/akm45vns-oss", label: "GitHub" },
            {
              href: "https://www.linkedin.com/in/ayush-kumar-maurya-326071384/",
              label: "LinkedIn",
            },
            { href: "https://www.instagram.com/ayush.maurya45/", label: "Instagram" },
          ].map(({ href, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#475569",
                fontSize: 11,
                fontWeight: 600,
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#fda4af")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#dbeafe")}
            >
              {label}
            </a>
          ))}
          <span style={{ fontSize: 10, color: "#dbeafe", opacity: 0.7 }}>
            © 2026 · AkmEdu · Smart Study Platform
          </span>
        </div>
      </footer>

      {/* Floating Forum Button - Always visible */}
      <FloatingForumButton currentSubject={nav.subject} currentChapter={nav.chapter} />
    </div>
  );
}