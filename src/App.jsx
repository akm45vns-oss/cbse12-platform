import { useState, useEffect, Suspense, lazy, useRef, useCallback } from "react";
import { useAuth, useNavigation, useProgress, useTheme, useScrollDirection } from "./hooks";
import { callClaude } from "./utils/api";
import { getChapterNotes, getQuizSet, getQuizSetStatus, getQuizSetSummaries, saveQuizSubmission } from "./utils/supabase";
import { CURRICULUM, totalChapters, CURRICULUM_11, totalChapters11, getCurriculumSync } from "./constants/curriculum";
import { SearchBar } from "./components/common/SearchBar";
import { recordDailyActivity } from "./utils/loginStreak";
import { recordQuizSubmission } from "./utils/weakTopics";
import { getCachedNotes, cacheNotes } from "./utils/cacheManager";
import { usePerformanceMetrics } from "./utils/performanceMonitoring";
import { validateQuestion } from "./utils/quizUtils";
// Eager load critical views, lazy load others
import { AuthView, DashboardView, QuizSetsView, LeaderboardView } from "./components/views";
const SubjectView = lazy(() => import("./components/views/SubjectView").then(m => ({ default: m.SubjectView })));
const ChapterView = lazy(() => import("./components/views/ChapterView").then(m => ({ default: m.ChapterView })));
const NotesView = lazy(() => import("./components/views/NotesView").then(m => ({ default: m.NotesView })));
const QuizView = lazy(() => import("./components/views/QuizView").then(m => ({ default: m.QuizView })));
const PaperView = lazy(() => import("./components/views/PaperView").then(m => ({ default: m.PaperView })));
const PapersListView = lazy(() => import("./components/views/PapersListView").then(m => ({ default: m.PapersListView })));
const ProgressView = lazy(() => import("./components/views/ProgressView").then(m => ({ default: m.ProgressView })));
const StatsView = lazy(() => import("./components/views/StatsView").then(m => ({ default: m.StatsView })));
const ProfileView = lazy(() => import("./components/views/ProfileView").then(m => ({ default: m.ProfileView })));
const PipelineDashboardView = lazy(() => import("./components/views/PipelineDashboardView").then(m => ({ default: m.PipelineDashboardView })));
import { FloatingForumButton } from "./components/common";
import { globalStyles } from "./styles/shared";

// ── Class Switcher Pill ──────────────────────────────────────────
const ClassSwitcher = ({ selectedClass, onChange }) => (
  <div style={{
    display: "flex", background: "rgba(0,0,0,0.06)", borderRadius: 999,
    padding: 3, gap: 0, flexShrink: 0,
  }}>
    {["11", "12"].map(cls => (
      <button
        key={cls}
        onClick={() => onChange(cls)}
        style={{
          padding: "5px 14px", borderRadius: 999, border: "none",
          fontSize: 13, fontWeight: 800, cursor: "pointer",
          transition: "all 0.2s",
          background: selectedClass === cls
            ? "linear-gradient(135deg, #4f46e5, #818cf8)"
            : "transparent",
          color: selectedClass === cls ? "#fff" : "#64748b",
          boxShadow: selectedClass === cls ? "0 2px 8px rgba(79,70,229,0.3)" : "none",
        }}
        aria-label={`Switch to Class ${cls}`}
      >
        Class {cls}
      </button>
    ))}
  </div>
);

// Loading fallback component
const LoadingFallback = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "300px" }}>
    <div style={{ textAlign: "center" }}>
      <div style={{ width: 40, height: 40, border: "3px solid #ede9fe", borderTop: "3px solid #4f46e5", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
      <div style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>Loading...</div>
    </div>
  </div>
);

// SVG Icons for bottom nav
const HomeIcon = () => (<svg className="bottom-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const StatsIcon = () => (<svg className="bottom-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 16l4-5 4 3 4-6" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const ProgressIcon = () => (<svg className="bottom-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" strokeLinecap="round"/><path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const RankIcon = () => (<svg className="bottom-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="12" width="4" height="9" rx="1" strokeLinecap="round"/><rect x="10" y="7" width="4" height="14" rx="1" strokeLinecap="round"/><rect x="17" y="3" width="4" height="18" rx="1" strokeLinecap="round"/></svg>);
const ProfileIcon = () => (<svg className="bottom-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="4" strokeLinecap="round"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" strokeLinejoin="round"/></svg>);






// ===== MAIN APP =====
export default function App() {
  // Import custom hooks for state management
  const auth = useAuth();
  const nav = useNavigation();
  const progress = useProgress();
  const theme = useTheme();
  const { isScrollingUp, isAtTop } = useScrollDirection();

  // Call performance tracking in dev environment
  usePerformanceMetrics();

  // ── Class selection (11 or 12) — persisted to localStorage ──
  const [selectedClass, setSelectedClass] = useState(() => {
    return localStorage.getItem("akmedu_selected_class") || "12";
  });

  // Derived: curriculum and chapter count for active class
  const activeCurriculum = getCurriculumSync(selectedClass, CURRICULUM_11);
  const activeTotalChapters = selectedClass === "11" ? totalChapters11 : totalChapters;

  const handleClassChange = useCallback((cls) => {
    setSelectedClass(cls);
    localStorage.setItem("akmedu_selected_class", cls);
    // Navigate to dashboard only if on a subject-specific view to prevent errors
    const subjectSpecificViews = ["subject", "chapter", "notes", "quiz", "paper", "papers-list"];
    if (subjectSpecificViews.includes(nav.view)) {
      nav.goToDashboard();
    }
    // Clear content state to avoid showing stale content
    setNotes("");
    setQuiz([]);
    setAnswers({});
    setSubmitted(false);
  }, [nav]);

  // Exit confirmation state — shown when user presses back at root (dashboard)
  const [exitConfirm, setExitConfirm] = useState(false);
  const exitConfirmTimerRef = useRef(null);

  // Content generation state
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("");
  const [loadEmoji, setLoadEmoji] = useState("🔄");
  const [notes, setNotes] = useState("");
  const [paper, setPaper] = useState("");
  const [selectedPaperSet, setSelectedPaperSet] = useState(null); // Track selected paper set (1-5)
  const [quiz, setQuiz] = useState([]);
  const [quizErr, setQuizErr] = useState("");
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [selectedQuizSet, setSelectedQuizSet] = useState(null); // Track selected set (1-15)
  const [quizSetStatus, setQuizSetStatus] = useState({}); // Track best scores per set
  const [availableSets, setAvailableSets] = useState([]); // Actual set numbers in DB

  // Refs for cancellation tokens
  const abortControllerRef = useRef(null);
  const prevChapterRef = useRef(null);
  const prevStackLengthRef = useRef(nav.viewStack ? nav.viewStack.length : 0);

  // Scroll to top on forward navigation (goBack restores scroll via useNavigation)
  useEffect(() => {
    const prevLength = prevStackLengthRef.current;
    const currentLength = nav.viewStack ? nav.viewStack.length : 0;
    prevStackLengthRef.current = currentLength;

    if (currentLength < prevLength) {
      // Navigated back — useNavigation handles scroll restore via requestAnimationFrame
      return;
    }

    // Forward navigation — reset to top
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [nav.view, nav.subject, nav.chapter]);

  // ── popstate: intercept browser/Android hardware back button ──────────────
  useEffect(() => {
    const handlePopState = (e) => {
      // Always prevent the browser from actually navigating
      // We manage navigation ourselves via our internal stack.

      const wentBack = nav.goBack();

      if (!wentBack) {
        // Already at root (dashboard) — push a dummy state so the back button
        // doesn't immediately exit on the next press, giving us control.
        window.history.pushState({ __akmedu_root: true }, "", "/");

        if (exitConfirm) {
          // Second press within the confirm window — allow exit by going back
          // in browser history (one real step we allowed above)
          window.history.go(-1);
        } else {
          // First press at root — show confirmation overlay
          setExitConfirm(true);
          // Auto-dismiss after 3 seconds
          clearTimeout(exitConfirmTimerRef.current);
          exitConfirmTimerRef.current = setTimeout(() => {
            setExitConfirm(false);
          }, 3000);
        }
      } else {
        // We navigated back internally — dismiss any open exit confirm
        setExitConfirm(false);
        clearTimeout(exitConfirmTimerRef.current);
      }
    };

    window.addEventListener("popstate", handlePopState);

    // Ensure there's always at least one history entry above the "exit" entry
    // so the first back press hits our handler instead of exiting directly.
    if (window.history.state === null || !window.history.state?.__akmedu) {
      window.history.replaceState({ __akmedu: true, view: nav.view }, "", window.location.pathname);
      window.history.pushState({ __akmedu_sentinel: true }, "", window.location.pathname);
    }

    return () => {
      window.removeEventListener("popstate", handlePopState);
      clearTimeout(exitConfirmTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav.goBack, exitConfirm]);

  // Load progress on user login
  useEffect(() => {
    if (auth.currentUser) {
      progress.load(auth.currentUser);
      recordDailyActivity(); // Track daily login streak
      // Only force redirect if they are currently on the login screen.
      // This prevents deep links (like /quiz) from being hijacked on page refresh.
      if (nav.view === "auth") {
        nav.goToDashboard();
      }
    } else {
      nav.navigate("auth");
    }
  }, [auth.currentUser]);

  // Clear notes and quiz when chapter changes (prevents race condition)
  useEffect(() => {
    const key = `${nav.subject}||${nav.chapter}`;
    const prevKey = prevChapterRef.current;
    
    if (prevKey && prevKey !== key) {
      // Chapter has changed, cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      // Clear stale content
      setNotes("");
      setQuiz([]);
      setAnswers({});
      setSubmitted(false);
      setQIdx(0);
    }
    prevChapterRef.current = key;
  }, [nav.subject, nav.chapter]);

  // Handle direct navigation (refresh/bookmark) for data fetching
  const initialFetchRef = useRef(false);
  useEffect(() => {
    if (initialFetchRef.current) return;

    // If we land directly on notes and notes are empty
    if (nav.view === "notes" && nav.subject && nav.chapter && !notes) {
      initialFetchRef.current = true;
      genNotes(nav.subject, nav.chapter);
    }
    // If we land directly on quiz and availableSets is empty
    else if (nav.view === "quiz" && nav.subject && nav.chapter && availableSets.length === 0) {
      initialFetchRef.current = true;
      startQuiz(nav.subject, nav.chapter);
    }
    // If we land directly on paper list and no paper is loaded
    else if (nav.view === "paper" && nav.subject && selectedPaperSet === null) {
      initialFetchRef.current = true;
      // It will just show the papers list component, no fetch needed.
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav.view, nav.subject, nav.chapter]);

  // Content generation functions
  const genNotes = useCallback(async (subj, chap) => {
    setLoading(true);
    setLoadMsg(`Loading notes for "${chap}"`);
    setLoadEmoji("📝");
    setNotes("");

    // Cancel previous request and create new controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // 1. Check localStorage cache first (fastest)
      if (controller.signal.aborted) return;
      const localCached = getCachedNotes(selectedClass, subj, chap);
      if (localCached) {
        if (controller.signal.aborted) return;
        setNotes(localCached);
        progress.save(`${subj}||${chap}||notes`, { read: true, date: Date.now() });
        setLoading(false);
        return;
      }

      // 2. Try to load from database (database cache)
      if (controller.signal.aborted) return;
      const dbNotes = await getChapterNotes(selectedClass, subj, chap);
      if (controller.signal.aborted) return;
      if (dbNotes) {
        setNotes(dbNotes);
        cacheNotes(selectedClass, subj, chap, dbNotes, 1440); // Cache for 24 hours
        progress.save(`${subj}||${chap}||notes`, { read: true, date: Date.now() });
        setLoading(false);
        return;
      }

      // 3. If not in database, generate with API (fallback)
      if (controller.signal.aborted) return;
      setLoadMsg(`Generating notes for "${chap}"...`);
      const text = await callClaude(
        `Create comprehensive, ORIGINAL study material for the topic "${chap}" in ${subj}.
You are creating INDEPENDENT educational content, not copying from any textbook.
Format the notes as follows:
# ${chap}
## Subject: ${subj} | Class ${selectedClass} Study Materials
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
      if (controller.signal.aborted) return;
      setNotes(text);
      cacheNotes(selectedClass, subj, chap, text, 1440); // Cache generated notes for 24 hours
      progress.save(`${subj}||${chap}||notes`, { read: true, date: Date.now() });
    } catch (e) {
      if (e.name !== 'AbortError') {
        setNotes("❌ Error: " + e.message);
      }
    }
    setLoading(false);
  }, [progress, selectedClass]);

  const startQuiz = useCallback(async (subj, chap) => {
    setLoading(true);
    setLoadMsg(`Loading quiz sets for "${chap}"`);
    setLoadEmoji("📚");
    setQuiz([]);
    setAnswers({});
    setSubmitted(false);
    setQIdx(0);
    setQuizErr("");
    setSelectedQuizSet(null);

    // Cancel previous request and create new controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      if (controller.signal.aborted) return;
      // Load quiz set status AND available sets from database in parallel
      const [status, sets] = await Promise.all([
        getQuizSetStatus(selectedClass, auth.currentUser, subj, chap),
        getQuizSetSummaries(selectedClass, subj, chap)
      ]);
      if (controller.signal.aborted) return;
      setQuizSetStatus(status || {});
      setAvailableSets(sets || []);
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error("Error loading quiz set status:", e);
        setQuizSetStatus({});
        setAvailableSets([]);
      }
    }

    setLoading(false);
  }, [auth.currentUser, selectedClass]);

  const loadQuizSet = useCallback(async (setNumber) => {
    setLoading(true);
    setLoadMsg(`Loading Quiz Set ${setNumber}`);
    setLoadEmoji("🧠");
    setQuiz([]);
    setAnswers({});
    setSubmitted(false);
    setQIdx(0);
    setQuizErr("");

    try {
      const questions = await getQuizSet(selectedClass, nav.subject, nav.chapter, setNumber);
      if (!questions || questions.length === 0) {
        setQuizErr("Quiz set not found. Please try another set or refresh.");
        setLoading(false);
        return;
      }

      setQuiz(questions);
      setSelectedQuizSet(setNumber);
    } catch (e) {
      setQuizErr("Error loading quiz set: " + e.message);
    }
    setLoading(false);
  }, [nav.subject, nav.chapter, selectedClass]);

  const genPaper = useCallback(async (subj, setNum) => {
    setLoading(true);
    setLoadMsg(`Generating Sample Paper Set ${setNum} for ${subj}`);
    setLoadEmoji("📄");
    setPaper("");

    // Cancel previous request and create new controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      if (controller.signal.aborted) return;
      const subjCurriculum = activeCurriculum[subj];
      const syllabusInfo = subjCurriculum
        ? subjCurriculum.units.map(unit => `- ${unit.name}: ${unit.chapters.join(", ")}`).join("\n")
        : "";

      const prompt = `Generate a realistic, full-length, and professionally formatted Class ${selectedClass} CBSE Board Examination Sample Paper for ${subj} (Set ${setNum}).
      
Here is the official CBSE Class ${selectedClass} syllabus for ${subj} that you MUST follow:
${syllabusInfo}

Format Guidelines:
1. Include Section Headers (e.g., SECTION A, SECTION B) and General Instructions at the start of the paper.
2. For multiple-choice questions (MCQs), you MUST list each option on its own individual line. Never place options inline or on the same line as the question. For example:
   21. What is the derivative of x^2?
   (A) x
   (B) 2x
   (C) x^2
   (D) 2
3. Keep the markup simple and clean using standard double asterisks for bolding (e.g. **Section A**).
4. Use standard CBSE marks distribution (e.g., 1 mark for MCQs, 2-3 marks for Short Answers, 5 marks for Long Answers).
5. Only provide the question paper. Do NOT provide answers or answer keys.
6. Return the paper content directly without any introductory or concluding chat remarks.`;
      
      const text = await callClaude(prompt, 4000);
      if (controller.signal.aborted) return;
      setPaper(text);
    } catch (e) {
      if (e.name !== 'AbortError') {
        setPaper("❌ Error generating sample paper. Please try again.");
      }
    }
    setLoading(false);
  }, [selectedClass, activeCurriculum]);

  const submitQuiz = useCallback(async () => {
    let sc = 0;
    quiz.forEach((q, i) => {
      const validatedQ = validateQuestion(q);
      if (validatedQ && answers[i] === validatedQ.ans) sc++;
    });
    setScore(sc);
    setSubmitted(true);

    // Record quiz submission for weak topics analysis and gamification
    recordQuizSubmission(nav.subject, nav.chapter, answers, quiz, auth.currentUser);

    // Save quiz submission to database with set number
    if (selectedQuizSet && auth.currentUser) {
      await saveQuizSubmission(selectedClass, auth.currentUser, nav.subject, nav.chapter, selectedQuizSet, answers, sc);
    }

    const key = `${nav.subject}||${nav.chapter}||quiz`;
    const prev = progress.data[key] || { attempts: [] };
    progress.save(key, {
      attempts: [...(prev.attempts || []), { score: sc, total: quiz.length, date: Date.now(), setNumber: selectedQuizSet }],
      best: Math.max(sc, ...(prev.attempts || []).map((a) => a.score), 0),
    });
  }, [quiz, answers, selectedQuizSet, auth.currentUser, nav.subject, nav.chapter, progress, selectedClass]);

  // Not authenticated
  if (nav.view === "auth") {
    return (
      <AuthView
        authTab={auth.authTab}
        uname={auth.credentials.username}
        email={auth.credentials.email}
        name={auth.credentials.name}
        pass={auth.credentials.password}
        pass2={auth.credentials.confirmPassword}
        authErr={auth.error}
        showPass={auth.showPass}
        showResetPassword={auth.showResetPassword}
        otpState={auth.otpState}
        resetPasswordData={auth.resetPasswordData}
        setAuthTab={auth.setAuthTab}
        setUname={(u) => auth.setCredentials({ ...auth.credentials, username: u })}
        setEmail={(e) => auth.setCredentials({ ...auth.credentials, email: e })}
        setName={(n) => auth.setCredentials({ ...auth.credentials, name: n })}
        setPass={(p) => auth.setCredentials({ ...auth.credentials, password: p })}
        setPass2={(p) => auth.setCredentials({ ...auth.credentials, confirmPassword: p })}
        setShowPass={auth.setShowPass}
        setShowResetPassword={auth.setShowResetPassword}
        setOtpState={auth.setOtpState}
        setResetPasswordData={auth.setResetPasswordData}
        doLogin={auth.doLogin}
        doRegister={auth.doRegister}
        doVerifyOTP={auth.doVerifyOTP}
        doForgotPasswordRequest={auth.doForgotPasswordRequest}
        doForgotPasswordVerifyOTP={auth.doForgotPasswordVerifyOTP}
        doForgotPasswordReset={auth.doForgotPasswordReset}
        cancelForgotPassword={auth.cancelForgotPassword}
      />
    );
  }

  const S = nav.subject ? activeCurriculum[nav.subject] : null;

  // Determine page title from nav state
  const getPageTitle = () => {
    if (nav.view === "dashboard") return "AkmEdu45";
    if (nav.view === "subject") return nav.subject || "Subject";
    if (nav.view === "chapter") return nav.chapter || "Chapter";
    if (nav.view === "notes") return "Notes";
    if (nav.view === "quiz") return "Quiz";
    if (nav.view === "paper" || nav.view === "papers-list") return "Sample Paper";
    if (nav.view === "stats") return "Stats";
    if (nav.view === "progress") return "Progress";
    if (nav.view === "leaderboard") return "Rank";
    if (nav.view === "profile") return "Profile";
    if (nav.view === "pipeline") return "Pipeline";
    return "AkmEdu45";
  };

  const streak = (() => {
    try { return JSON.parse(localStorage.getItem('loginStreak') || '{}')} catch { return {}; }
  })();
  const streakCount = streak.current || 0;

  return (
    <div
      style={{
        minHeight: "100dvh",
        width: "100%",
        background: "linear-gradient(160deg, #f0f0ff 0%, #e8e8ff 100%)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
      }}
    >
      {/* ===== EXIT CONFIRM OVERLAY ===== */}
      {exitConfirm && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label="Exit app confirmation"
          style={{
            position: "fixed",
            bottom: 90,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            background: "rgba(17,17,34,0.92)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            borderRadius: 16,
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
            border: "1px solid rgba(255,255,255,0.12)",
            animation: "exitConfirmSlideUp 0.25s cubic-bezier(0.34,1.56,0.64,1) both",
            maxWidth: "calc(100vw - 40px)",
          }}
        >
          <span style={{ fontSize: 22 }}>🚪</span>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>
              Press back again to exit
            </div>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 2 }}>
              You are at the home screen
            </div>
          </div>
          <button
            onClick={() => setExitConfirm(false)}
            style={{
              marginLeft: "auto",
              background: "rgba(255,255,255,0.12)",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Stay
          </button>
        </div>
      )}
      <style>{globalStyles}</style>

      {/* ===== NEW TOP HEADER ===== */}
      <nav
        className="top-header"
        style={{
          transform: isScrollingUp || isAtTop ? "translateY(0)" : "translateY(-100%)",
          opacity: isScrollingUp || isAtTop ? 1 : 0,
          pointerEvents: isScrollingUp || isAtTop ? "auto" : "none",
        }}
      >
        <div className="top-header-inner">
          {/* Left: back button or spacer */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
            {nav.canGoBack ? (
              <button className="top-header-back" onClick={nav.goBack} title="Go back" aria-label="Go back">
                ←
              </button>
            ) : null}
            <span className="top-header-title">
              {getPageTitle()}
            </span>
          </div>

          {/* Centre: Class Switcher — only show on dashboard and root-level views */}
          {["dashboard", "subject", "progress", "stats", "leaderboard", "profile"].includes(nav.view) && (
            <ClassSwitcher selectedClass={selectedClass} onChange={handleClassChange} />
          )}

          {/* Right: streak + avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {streakCount > 0 && (
              <div className="streak-pill">
                <span style={{ fontWeight: 800, fontSize: 15 }}>{streakCount}</span>
                <span style={{ fontSize: 18 }}>🔥</span>
              </div>
            )}
            <button
              className="avatar-circle"
              onClick={() => nav.navigate("profile")}
              title="View Profile"
              aria-label="Profile"
            >
              {progress.data?.["SYSTEM||PROFILE||avatar"]?.icon || (auth.currentUser?.[0]?.toUpperCase()) || "U"}
            </button>
          </div>

          {/* Desktop links (hidden on mobile) */}
          <div className="nav-desktop-links" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {[
              { id: "stats", label: "Stats" },
              { id: "progress", label: "Progress" },
              { id: "leaderboard", label: "Rank" },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => nav.navigate(item.id)}
                style={{
                  background: nav.view === item.id ? "rgba(79,70,229,0.1)" : "transparent",
                  border: "1.5px solid",
                  borderColor: nav.view === item.id ? "rgba(79,70,229,0.3)" : "rgba(0,0,0,0.08)",
                  borderRadius: 10,
                  padding: "7px 14px",
                  color: nav.view === item.id ? "#4f46e5" : "#64748b",
                  fontWeight: 700,
                  fontSize: 13,
                  transition: "all 0.2s",
                  minHeight: 36,
                }}
                onMouseEnter={e => { e.currentTarget.style.background="rgba(79,70,229,0.08)"; e.currentTarget.style.color="#4f46e5"; }}
                onMouseLeave={e => { e.currentTarget.style.background=nav.view===item.id?"rgba(79,70,229,0.1)":"transparent"; e.currentTarget.style.color=nav.view===item.id?"#4f46e5":"#64748b"; }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>





      <div className="main-content">
        {nav.view === "dashboard" && (
          <DashboardView
            currentUser={auth.currentUser}
            displayName={progress.data?.["SYSTEM||PROFILE||name"]?.value || auth.currentUser}
            stats={progress.getStats(activeCurriculum)}
            overallPct={progress.getOverallPercentage(activeCurriculum, activeTotalChapters)}
            totalChapters={activeTotalChapters}
            selectedClass={selectedClass}
            curriculum={activeCurriculum}
            theme={theme}
            onSelectSubject={(subject) => {
              nav.navigateToSubject(subject);
            }}
            onSelectChapter={(chapter) => {
              nav.navigateToChapter(chapter);
            }}
          />
        )}

        {nav.view === "pipeline" && (
          <Suspense fallback={<LoadingFallback />}>
            <PipelineDashboardView />
          </Suspense>
        )}

        {nav.view === "subject" && nav.subject && (
          <Suspense fallback={<LoadingFallback />}>
            <SubjectView
              subject={nav.subject}
              curriculum={activeCurriculum}
              selectedClass={selectedClass}
              stats={progress.getStats()}
              progress={progress.data}
              theme={theme}
              onSelectChapter={(chapter, viewType) => {
                // If viewType is specified (notes or quiz), navigate directly to that view
                if (viewType === 'notes') {
                  nav.navigate("notes", { chapter });
                  if (!notes) genNotes(nav.subject, chapter);
                } else if (viewType === 'quiz') {
                  setSelectedQuizSet(null);
                  setQuiz([]);
                  setAnswers({});
                  setSubmitted(false);
                  setQIdx(0);
                  nav.navigate("quiz", { chapter });
                  startQuiz(nav.subject, chapter);
                } else {
                  // Default behavior: navigate to chapter overview
                  nav.navigateToChapter(chapter);
                }
              }}
              onGeneratePaper={() => {
                setSelectedPaperSet(1);
                setPaper("");
                nav.navigate("paper");
                genPaper(nav.subject, 1);
              }}
            />
          </Suspense>
        )}

        {nav.view === "chapter" && nav.chapter && (
          <Suspense fallback={<LoadingFallback />}>
            <ChapterView
              chapter={nav.chapter}
              subject={nav.subject}
              selectedClass={selectedClass}
              curriculumData={S}
              notesRead={progress.data[`${nav.subject}||${nav.chapter}||notes`]?.read}
              quizBest={progress.data[`${nav.subject}||${nav.chapter}||quiz`]?.best}
              availableSets={availableSets}
              theme={theme}
              onStartNotes={() => {
                nav.navigate("notes");
                genNotes(nav.subject, nav.chapter);
              }}
              onStartQuiz={() => {
                setSelectedQuizSet(null);
                setQuiz([]);
                setAnswers({});
                setSubmitted(false);
                setQIdx(0);
                nav.navigate("quiz");
                startQuiz(nav.subject, nav.chapter);
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
              selectedClass={selectedClass}
              onRegenerateNotes={() => genNotes(nav.subject, nav.chapter)}
              onStartQuiz={() => {
                setSelectedQuizSet(null);
                setQuiz([]);
                setAnswers({});
                setSubmitted(false);
                setQIdx(0);
                nav.navigate("quiz");
                startQuiz(nav.subject, nav.chapter);
              }}
            />
          </Suspense>
        )}

        {nav.view === "quiz" && (
          <Suspense fallback={<LoadingFallback />}>
            {!selectedQuizSet ? (
              <QuizSetsView
                subject={nav.subject}
                chapter={nav.chapter}
                curriculumData={S}
                quizSetStatus={quizSetStatus}
                availableSets={availableSets}
                loading={loading}
                onSelectSet={loadQuizSet}
              />
            ) : (
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
                  setSelectedQuizSet(null);
                  setQuiz([]);
                  setAnswers({});
                  setSubmitted(false);
                  setQIdx(0);
                }}
                onReviewNotes={() => {
                  nav.navigate("notes");
                  genNotes(nav.subject, nav.chapter);
                }}
              />
            )}
          </Suspense>
        )}

        {nav.view === "paper" && (
          <Suspense fallback={<LoadingFallback />}>
            {selectedPaperSet === null ? (
              <PapersListView
                subject={nav.subject}
                curriculumData={S}
                loading={loading}
                loadMsg={loadMsg}
                loadEmoji={loadEmoji}
                onSelectPaper={(setNum) => {
                  setSelectedPaperSet(setNum);
                  genPaper(nav.subject, setNum);
                }}
              />
            ) : (
              <PaperView
                loading={loading}
                loadMsg={loadMsg}
                loadEmoji={loadEmoji}
                paper={paper}
                subject={nav.subject}
                curriculumData={S}
                theme={theme}
                onRegenerate={() => {
                  setSelectedPaperSet(null);
                  nav.navigate("subject");
                }}
              />
            )}
          </Suspense>
        )}

        {nav.view === "progress" && (
          <Suspense fallback={<LoadingFallback />}>
            <ProgressView
              overallPct={progress.getOverallPercentage()}
              stats={progress.getStats()}
              totalChapters={activeTotalChapters}
              curriculum={activeCurriculum}
              progressData={progress.data}
              theme={theme}
            />
          </Suspense>
        )}

        {nav.view === "profile" && (
          <Suspense fallback={<LoadingFallback />}>
            <ProfileView
              currentUser={auth.currentUser}
              onLogout={auth.doLogout}
              progress={progress}
              theme={theme}
            />
          </Suspense>
        )}

        {nav.view === "stats" && (
          <Suspense fallback={<LoadingFallback />}>
            <StatsView theme={theme} curriculumData={activeCurriculum} />
          </Suspense>
        )}

        {nav.view === "leaderboard" && (
          <Suspense fallback={<LoadingFallback />}>
            <LeaderboardView selectedClass={selectedClass} curriculumData={activeCurriculum} />
          </Suspense>
        )}

      </div>



      {/* Floating Forum Button - Always visible */}
      <FloatingForumButton 
        currentSubject={nav.subject} 
        currentChapter={nav.chapter}
        currentUser={auth.currentUser}
      />

      {/* ===== NEW BOTTOM NAVIGATION ===== */}
      <nav className="mobile-bottom-nav" aria-label="Main navigation">
        {[
          { id: "dashboard", Icon: HomeIcon, label: "Home" },
          { id: "stats", Icon: StatsIcon, label: "Stats" },
          { id: "progress", Icon: ProgressIcon, label: "Progress" },
          { id: "leaderboard", Icon: RankIcon, label: "Rank" },
          { id: "profile", Icon: ProfileIcon, label: "Profile" },
        ].map(({ id, Icon, label }) => {
          const isActive = nav.view === id || (id === "dashboard" && ["subject", "chapter", "notes", "quiz", "paper", "papers-list"].includes(nav.view));
          return (
            <button
              key={id}
              onClick={() => nav.navigate(id)}
              className={`bottom-nav-item${isActive ? " active" : ""}`}
              aria-label={label}
            >
              <Icon />
              <span className="bottom-nav-label">{label}</span>
            </button>
          );
        })}
        {/* Pipeline button — shown as desktop-only shortcut */}
        <button
          onClick={() => nav.navigate("pipeline")}
          className={`bottom-nav-item${nav.view === "pipeline" ? " active" : ""}`}
          aria-label="Pipeline"
          style={{ display: "none" }}
        >
          <span style={{ fontSize: 20 }}>🔬</span>
          <span className="bottom-nav-label">Pipeline</span>
        </button>
      </nav>
    </div>
  );
}