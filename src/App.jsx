import { useState, useEffect, Suspense, lazy } from "react";
import { useAuth, useNavigation, useProgress, useTheme } from "./hooks";
import { callClaude, extractJSON } from "./utils/api";
import { getChapterNotes } from "./utils/supabase";
import { CURRICULUM, totalChapters } from "./constants/curriculum";
import { SearchBar } from "./components/common/SearchBar";
import { recordDailyActivity } from "./utils/loginStreak";
import { recordQuizSubmission } from "./utils/weakTopics";
// Eager load critical views, lazy load others
import { AuthView, DashboardView } from "./components/views";
const SubjectView = lazy(() => import("./components/views/SubjectView").then(m => ({ default: m.SubjectView })));
const ChapterView = lazy(() => import("./components/views/ChapterView").then(m => ({ default: m.ChapterView })));
const NotesView = lazy(() => import("./components/views/NotesView").then(m => ({ default: m.NotesView })));
const QuizView = lazy(() => import("./components/views/QuizView").then(m => ({ default: m.QuizView })));
const PaperView = lazy(() => import("./components/views/PaperView").then(m => ({ default: m.PaperView })));
const ProgressView = lazy(() => import("./components/views/ProgressView").then(m => ({ default: m.ProgressView })));
const StatsView = lazy(() => import("./components/views/StatsView").then(m => ({ default: m.StatsView })));
import { FloatingForumButton } from "./components/common";
import { globalStyles } from "./styles/shared";

// Loading fallback component
const LoadingFallback = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
      <div style={{ color: "#64748b", fontSize: 14 }}>Loading...</div>
    </div>
  </div>
);






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
        `Create comprehensive, ORIGINAL study material for the topic "${chap}" in ${subj}.
You are creating INDEPENDENT educational content, not copying from any textbook.
Format the notes as follows:
# ${chap}
## Subject: ${subj} | Class 12 Study Materials
---
## 📌 Topic Overview
[2-3 sentence explanation in YOUR OWN words]
## 🔑 Key Concepts & Definitions
[Create clear definitions using your own explanations]
## 📐 Important Laws, Theories & Principles
[Explain fundamental principles with original examples]
## 🧮 Formulas & Equations
[Include relevant mathematical/scientific formulas if applicable]
## 🔬 Mechanisms & Processes (Step-by-Step)
[Explain processes using your own logical flow]
## 🖼️ Visual Aids & Diagrams
[Describe visual representations and what they should show]
## ⭐ Most Important Concepts
[Mark key concepts with ★ that students should focus on]
## ❌ Common Misconceptions
[Explain typical mistakes students make on this topic]
## 💡 Real-World Applications
[Give practical examples of how this topic applies in real life]
## 🔁 Quick Summary
[10-15 bullet point quick reference for revision]
IMPORTANT: Write ORIGINAL content. Use your own explanations, examples, and structure. Do not copy or closely paraphrase from any textbooks. Ensure content is accurate and educationally sound.`,
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
      const prompt = `Generate exactly 25 ORIGINAL multiple-choice questions about "${chap}" in ${subj}. This is batch ${batch} of 2 — generate questions ${
        batch === 1 ? "1–25" : "26–50"
      }, covering ${batch === 1 ? "the first half" : "the second half"} of the topic.
CRITICAL: Return ONLY a valid JSON array. No markdown, no backticks, no explanation. Start with [ and end with ].
Format: [{"q":"Question text?","opts":["A. option","B. option","C. option","D. option"],"ans":0,"exp":"Brief explanation"}]
Rules:
- "ans" is 0-based index (0=A,1=B,2=C,3=D)
- Create ORIGINAL questions testing understanding (not copied from any source)
- Difficulty: 30% basic, 50% intermediate, 20% advanced
- Include calculation/analytical questions where appropriate
- Provide clear explanations for answers
- Generate all 25 questions, no placeholders
- Questions should be thought-provoking and educational`;
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
        `Create an ORIGINAL, comprehensive sample assessment paper for ${subj} Class 12.
Design it as a complete practice test following standard examination structure:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPREHENSIVE ASSESSMENT PAPER
Subject: ${subj}
Time Allowed: 3 Hours | Total Marks: ${marks}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Include:
- Instructions for Students (5-6 points about format and rules)
- Section A: Multiple Choice & Objective Type (16-20 marks)
- Section B: Short Answer Questions (10 marks, 2-3 marks each)
- Section C: Medium Answer Questions (12-15 marks, 3-4 marks each)
- Section D: Long Answer Questions (15-20 marks, 5-6 marks each)
- Section E: Case Studies, Practical Applications (if applicable for ${subj})
Ensure:
- Content covers major topics of the subject comprehensively
- Questions test understanding, analysis, and application (not just recall)
- Variety of question types
- Appropriate difficulty distribution (30% basic, 50% intermediate, 20% advanced)
End with:
- Complete ANSWER KEY with marking points
- Model answers showing expected responses
- Marking rubric for subjective questions
IMPORTANT: Create ORIGINAL questions. These should be unique practice material, not copied from any exam board or textbook.`,
        4000
      );
      setPaper(text);
    } catch {
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
        showPass={auth.showPass}
        setAuthTab={auth.setAuthTab}
        setUname={(u) => auth.setCredentials({ ...auth.credentials, username: u })}
        setPass={(p) => auth.setCredentials({ ...auth.credentials, password: p })}
        setPass2={(p) => auth.setCredentials({ ...auth.credentials, confirmPassword: p })}
        setShowPass={auth.setShowPass}
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
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
            {nav.canGoBack && (
              <button
                onClick={nav.goBack}
                style={{
                  background: theme.isDarkMode ? "#334155" : "#dbeafe",
                  border: "none",
                  borderRadius: 8,
                  padding: "8px 10px",
                  color: theme.isDarkMode ? "#06b6d4" : "#0369a1",
                  fontWeight: 600,
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  minHeight: "40px",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                ← <span style={{ display: "none" }}>Back</span>
              </button>
            )}
            <button
              onClick={nav.goToDashboard}
              className="nav-brand"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: "none",
                color: "#0891b2",
                fontWeight: 800,
                fontSize: 18,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              🎓 <span style={{ letterSpacing: "-0.02em" }}>AkmEdu</span>
            </button>
            {nav.subject && (
              <span
                style={{
                  color: theme.isDarkMode ? "#cbd5e1" : "#94a3b8",
                  fontSize: 13,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                / {S.emoji} <span style={{ display: "none" }}>{nav.subject}</span>
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
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => nav.navigate("stats")}
              style={{
                background: theme.isDarkMode ? "#334155" : "#dbeafe",
                border: "none",
                borderRadius: 8,
                padding: "8px 12px",
                color: theme.isDarkMode ? "#06b6d4" : "#0369a1",
                fontWeight: 600,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 6,
                minHeight: "40px",
                whiteSpace: "nowrap",
              }}
              title="Statistics"
            >
              <span style={{ fontSize: 16 }}>📊</span>
              <span style={{ display: "none" }} className="nav-btn-text">Stats</span>
            </button>
            <button
              onClick={() => nav.navigate("progress")}
              style={{
                background: theme.isDarkMode ? "#334155" : "#dbeafe",
                border: "none",
                borderRadius: 8,
                padding: "8px 12px",
                color: theme.isDarkMode ? "#06b6d4" : "#0369a1",
                fontWeight: 600,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 6,
                minHeight: "40px",
                whiteSpace: "nowrap",
              }}
              title="Progress"
            >
              <span style={{ fontSize: 16 }}>📈</span>
              <span style={{ display: "none" }} className="nav-btn-text">Progress</span>
            </button>
            <button
              onClick={theme.toggleTheme}
              title="Toggle dark mode (Ctrl+D)"
              style={{
                background: theme.isDarkMode ? "#334155" : "#dbeafe",
                border: "none",
                borderRadius: 8,
                padding: "8px 12px",
                color: theme.isDarkMode ? "#06b6d4" : "#0369a1",
                fontWeight: 600,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "40px",
                minWidth: "40px",
              }}
            >
              {theme.isDarkMode ? "☀️" : "🌙"}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: "40px" }}>
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
                  flexShrink: 0,
                }}
              >
                {auth.currentUser?.[0]?.toUpperCase()}
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#334155",
                  display: "block",
                  maxWidth: 120,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                className="nav-username"
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
                padding: "8px 12px",
                color: "#06b6d4",
                fontSize: 13,
                fontWeight: 600,
                minHeight: "40px",
                cursor: "pointer",
              }}
              title="Logout"
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
            theme={theme}
            onSelectSubject={(subject) => {
              nav.navigateToSubject(subject);
            }}
          />
        )}

        {nav.view === "subject" && nav.subject && (
          <Suspense fallback={<LoadingFallback />}>
            <SubjectView
              subject={nav.subject}
              curriculum={CURRICULUM}
              stats={progress.getStats()}
              progress={progress.data}
              theme={theme}
              onSelectChapter={(chapter) => {
                nav.navigateToChapter(chapter);
              }}
              onGeneratePaper={() => {
                setPaper("");
                nav.navigate("paper");
                genPaper(nav.subject);
              }}
            />
          </Suspense>
        )}

        {nav.view === "chapter" && nav.chapter && (
          <Suspense fallback={<LoadingFallback />}>
            <ChapterView
              chapter={nav.chapter}
              subject={nav.subject}
              curriculumData={S}
              notesRead={progress.data[`${nav.subject}||${nav.chapter}||notes`]?.read}
              quizBest={progress.data[`${nav.subject}||${nav.chapter}||quiz`]?.best}
              theme={theme}
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
          </Suspense>
        )}

        {nav.view === "notes" && (
          <Suspense fallback={<LoadingFallback />}>
            <NotesView
              loading={loading}
              loadMsg={loadMsg}
              loadEmoji={loadEmoji}
              notes={notes}
              subject={nav.subject}
              chapter={nav.chapter}
              curriculumData={S}
              theme={theme}
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
          </Suspense>
        )}

        {nav.view === "quiz" && (
          <Suspense fallback={<LoadingFallback />}>
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
              theme={theme}
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
          </Suspense>
        )}

        {nav.view === "paper" && (
          <Suspense fallback={<LoadingFallback />}>
            <PaperView
              loading={loading}
              loadMsg={loadMsg}
              loadEmoji={loadEmoji}
              paper={paper}
              subject={nav.subject}
              curriculumData={S}
              theme={theme}
              onRegenerate={() => genPaper(nav.subject)}
            />
          </Suspense>
        )}

        {nav.view === "progress" && (
          <Suspense fallback={<LoadingFallback />}>
            <ProgressView
              overallPct={progress.getOverallPercentage()}
              stats={progress.getStats()}
              totalChapters={totalChapters}
              curriculum={CURRICULUM}
              progressData={progress.data}
              theme={theme}
            />
          </Suspense>
        )}

        {nav.view === "stats" && (
          <Suspense fallback={<LoadingFallback />}>
            <StatsView theme={theme} />
          </Suspense>
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