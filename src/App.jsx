import { useState, useEffect, Suspense, lazy } from "react";
import { useAuth, useNavigation, useProgress, useTheme } from "./hooks";
import { callClaude, extractJSON } from "./utils/api";
import { getChapterNotes, getQuizSet, getQuizSetStatus, getQuizSetSummaries, saveQuizSubmission, getSamplePaper } from "./utils/supabase";
import { CURRICULUM, totalChapters } from "./constants/curriculum";
import { SearchBar } from "./components/common/SearchBar";
import { recordDailyActivity } from "./utils/loginStreak";
import { recordQuizSubmission } from "./utils/weakTopics";
import { getCachedNotes, cacheNotes } from "./utils/cacheManager";
import { createDebouncedQuery } from "./utils/queryOptimization";
import { validateQuestion } from "./components/views/QuizView";
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
import { FloatingForumButton } from "./components/common";
import { globalStyles } from "./styles/shared";

// Loading fallback component
const LoadingFallback = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 36, marginBottom: 16, animation: "pulse 1.5s ease infinite" }}>⚡</div>
      <div style={{ color: "#64748b", fontSize: 14, fontWeight: 600 }}>Loading...</div>
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
      // 1. Check localStorage cache first (fastest)
      const localCached = getCachedNotes(subj, chap);
      if (localCached) {
        setNotes(localCached);
        progress.save(`${subj}||${chap}||notes`, { read: true, date: Date.now() });
        setLoading(false);
        return;
      }

      // 2. Try to load from database (database cache)
      const dbNotes = await getChapterNotes(subj, chap);
      if (dbNotes) {
        setNotes(dbNotes);
        cacheNotes(subj, chap, dbNotes, 1440); // Cache for 24 hours
        progress.save(`${subj}||${chap}||notes`, { read: true, date: Date.now() });
        setLoading(false);
        return;
      }

      // 3. If not in database, generate with API (fallback)
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
      cacheNotes(subj, chap, text, 1440); // Cache generated notes for 24 hours
      progress.save(`${subj}||${chap}||notes`, { read: true, date: Date.now() });
    } catch (e) {
      setNotes("❌ Error: " + e.message);
    }
    setLoading(false);
  };

  const startQuiz = async (subj, chap) => {
    setLoading(true);
    setLoadMsg(`Loading quiz sets for "${chap}"`);
    setLoadEmoji("📚");
    setQuiz([]);
    setAnswers({});
    setSubmitted(false);
    setQIdx(0);
    setQuizErr("");
    setSelectedQuizSet(null);

    try {
      // Load quiz set status AND available sets from database in parallel
      const [status, sets] = await Promise.all([
        getQuizSetStatus(auth.currentUser, subj, chap),
        getQuizSetSummaries(subj, chap)
      ]);
      setQuizSetStatus(status || {});
      setAvailableSets(sets || []);
    } catch (e) {
      console.error("Error loading quiz set status:", e);
      setQuizSetStatus({});
      setAvailableSets([]);
    }

    setLoading(false);
  };

  const loadQuizSet = async (setNumber) => {
    setLoading(true);
    setLoadMsg(`Loading Quiz Set ${setNumber}`);
    setLoadEmoji("🧠");
    setQuiz([]);
    setAnswers({});
    setSubmitted(false);
    setQIdx(0);
    setQuizErr("");

    try {
      const questions = await getQuizSet(nav.subject, nav.chapter, setNumber);
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
  };

  const genPaper = async (subj, setNum) => {
    setLoading(true);
    setLoadMsg(`Generating Sample Paper Set ${setNum} for ${subj}`);
    setLoadEmoji("📄");
    setPaper("");
    try {
      const prompt = `Generate a realistic, full-length Class 12 CBSE Board Examination Sample Paper for ${subj} (Set ${setNum}).
Format the output with appropriate sections (Section A, B, C, D, etc.), marks distribution, and general instructions.
Include a variety of question types (MCQ, Short Answer, Long Answer, Case-based) as per the latest CBSE pattern.
Use professional formatting with clear headings. Only provide the question paper, DO NOT provide answers.
Respond with the paper content directly.`;
      
      const text = await callClaude(prompt, 4000);
      setPaper(text);
    } catch (err) {
      setPaper("❌ Error generating sample paper. Please try again.");
    }
    setLoading(false);
  };

  const submitQuiz = async () => {
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
      await saveQuizSubmission(auth.currentUser, nav.subject, nav.chapter, selectedQuizSet, answers, sc);
    }

    const key = `${nav.subject}||${nav.chapter}||quiz`;
    const prev = progress.data[key] || { attempts: [] };
    progress.save(key, {
      attempts: [...(prev.attempts || []), { score: sc, total: quiz.length, date: Date.now(), setNumber: selectedQuizSet }],
      best: Math.max(sc, ...(prev.attempts || []).map((a) => a.score), 0),
    });
  };

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

  const S = nav.subject ? CURRICULUM[nav.subject] : null;

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "linear-gradient(-45deg, #fdfbfb, #ebedee, #e0c3fc, #8ec5fc, #fbc2eb)",
        backgroundSize: "400% 400%",
        animation: "globalBackgroundGradient 20s ease infinite",
        position: "relative",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ position: "fixed", top: "-10%", left: "-10%", width: "50vw", height: "50vw", background: "radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 60%)", filter: "blur(100px)", zIndex: 0, pointerEvents: "none", animation: "orbPulse1 12s infinite alternate" }} />
      <div style={{ position: "fixed", bottom: "-20%", right: "-10%", width: "60vw", height: "60vw", background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 60%)", filter: "blur(120px)", zIndex: 0, pointerEvents: "none", animation: "orbPulse2 15s infinite alternate-reverse" }} />
      
      <style>{globalStyles}</style>

      {/* Top Navigation */}
      <nav
        style={{
          background: "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="nav-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
            {nav.canGoBack && (
              <button
                onClick={nav.goBack}
                style={{
                  background: "rgba(0, 0, 0, 0.03)",
                  border: "1px solid rgba(0, 0, 0, 0.06)",
                  borderRadius: 8,
                  padding: "8px 10px",
                  color: "#475569",
                  fontWeight: 600,
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  minHeight: "40px",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.background="rgba(0,0,0,0.06)"; e.currentTarget.style.color="#1e293b"; }}
                onMouseLeave={e => { e.currentTarget.style.background="rgba(0,0,0,0.03)"; e.currentTarget.style.color="#475569"; }}
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
                  color: "#1e293b",
                  fontWeight: 800,
                  fontSize: 18,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                🎓 <span style={{ background: "linear-gradient(135deg, #22d3ee 0%, #818cf8 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AkmEdu45</span>
              </button>
            {nav.subject && (
              <span
                style={{
                  color: "#64748b",
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
                  color: "#64748b",
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
                background: "rgba(0, 0, 0, 0.03)",
                border: "1px solid rgba(0, 0, 0, 0.06)",
                borderRadius: 8,
                padding: "8px 12px",
                color: "#475569",
                fontWeight: 600,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 6,
                minHeight: "40px",
                whiteSpace: "nowrap",
                transition: "all 0.2s"
              }}
              onMouseEnter={e => { e.currentTarget.style.background="rgba(0,0,0,0.06)"; e.currentTarget.style.color="#1e293b"; }}
              onMouseLeave={e => { e.currentTarget.style.background="rgba(0,0,0,0.03)"; e.currentTarget.style.color="#475569"; }}
              title="Statistics"
            >
              <span style={{ fontSize: 16 }}>📊</span>
              <span style={{ display: "none" }} className="nav-btn-text">Stats</span>
            </button>
            <button
              onClick={() => nav.navigate("progress")}
              style={{
                background: "rgba(0, 0, 0, 0.03)",
                border: "1px solid rgba(0, 0, 0, 0.06)",
                borderRadius: 8,
                padding: "8px 12px",
                color: "#475569",
                fontWeight: 600,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 6,
                minHeight: "40px",
                whiteSpace: "nowrap",
                transition: "all 0.2s"
              }}
              onMouseEnter={e => { e.currentTarget.style.background="rgba(0,0,0,0.06)"; e.currentTarget.style.color="#1e293b"; }}
              onMouseLeave={e => { e.currentTarget.style.background="rgba(0,0,0,0.03)"; e.currentTarget.style.color="#475569"; }}
              title="Progress"
            >
              <span style={{ fontSize: 16 }}>📈</span>
              <span style={{ display: "none" }} className="nav-btn-text">Progress</span>
            </button>
            <button
              onClick={() => nav.navigate("leaderboard")}
              style={{
                background: "rgba(0, 0, 0, 0.03)",
                border: "1px solid rgba(0, 0, 0, 0.06)",
                borderRadius: 8,
                padding: "8px 12px",
                color: "#475569",
                fontWeight: 600,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 6,
                minHeight: "40px",
                whiteSpace: "nowrap",
                transition: "all 0.2s"
              }}
              onMouseEnter={e => { e.currentTarget.style.background="rgba(0,0,0,0.06)"; e.currentTarget.style.color="#1e293b"; }}
              onMouseLeave={e => { e.currentTarget.style.background="rgba(0,0,0,0.03)"; e.currentTarget.style.color="#475569"; }}
              title="Leaderboard"
            >
              <span style={{ fontSize: 16 }}>🏆</span>
              <span style={{ display: "none" }} className="nav-btn-text">Leaderboard</span>
            </button>
            <button
              onClick={() => nav.navigate("profile")}
              style={{
                display: "flex", alignItems: "center", gap: 8, minHeight: "40px",
                background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 12, padding: "4px 12px 4px 4px", cursor: "pointer", transition: "all 0.2s"
              }}
              onMouseEnter={e => { e.currentTarget.style.background="rgba(59,130,246,0.05)"; e.currentTarget.style.borderColor="rgba(59,130,246,0.2)"; }}
              onMouseLeave={e => { e.currentTarget.style.background="rgba(0,0,0,0.02)"; e.currentTarget.style.borderColor="rgba(0,0,0,0.05)"; }}
              title="View Profile"
            >
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
                  fontSize: 18,
                  flexShrink: 0,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                }}
              >
                {progress.data?.["SYSTEM||PROFILE||avatar"]?.icon || auth.currentUser?.[0]?.toUpperCase()}
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1e293b",
                  display: "block",
                  maxWidth: 120,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                className="nav-username"
              >
                {progress.data?.["SYSTEM||PROFILE||name"]?.value || auth.currentUser}
              </span>
            </button>
          </div>
        </div>
      </nav>

      <div className="main-content">
        {nav.view === "dashboard" && (
          <DashboardView
            currentUser={auth.currentUser}
            displayName={progress.data?.["SYSTEM||PROFILE||name"]?.value || auth.currentUser}
            stats={progress.getStats()}
            overallPct={progress.getOverallPercentage()}
            totalChapters={totalChapters}
            theme={theme}
            onSelectSubject={(subject) => {
              nav.navigateToSubject(subject);
            }}
            onSelectChapter={(chapter) => {
              nav.navigateToChapter(chapter);
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
              curriculumData={S}
              notesRead={progress.data[`${nav.subject}||${nav.chapter}||notes`]?.read}
              quizBest={progress.data[`${nav.subject}||${nav.chapter}||quiz`]?.best}
              availableSets={availableSets}
              theme={theme}
              onStartNotes={() => {
                nav.navigate("notes");
                if (!notes) genNotes(nav.subject, nav.chapter);
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
                  if (!notes) genNotes(nav.subject, nav.chapter);
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
              totalChapters={totalChapters}
              curriculum={CURRICULUM}
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
            <StatsView theme={theme} />
          </Suspense>
        )}

        {nav.view === "leaderboard" && (
          <Suspense fallback={<LoadingFallback />}>
            <LeaderboardView />
          </Suspense>
        )}
      </div>

      {/* Footer */}
      <footer
        style={{
          marginTop: 24,
          background: "rgba(255, 255, 255, 0.6)",
          backdropFilter: "blur(28px)",
          borderTop: "1px solid rgba(0, 0, 0, 0.05)",
          padding: "12px 16px",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
          zIndex: 10
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
              color: "#64748b",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Built by
          </span>
          <span style={{ color: "#1e293b", fontWeight: 700, fontSize: 12 }}>
            Ayush Kumar Maurya
          </span>
          <span style={{ color: "#cbd5e1", fontSize: 14 }}>|</span>
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
                color: "#64748b",
                fontSize: 11,
                fontWeight: 600,
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#3b82f6")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
            >
              {label}
            </a>
          ))}
          <span style={{ fontSize: 10, color: "#94a3b8", opacity: 0.8 }}>
            © 2026 · AkmEdu45 · Smart Study Platform
          </span>
        </div>
      </footer>

      {/* Floating Forum Button - Always visible */}
      <FloatingForumButton 
        currentSubject={nav.subject} 
        currentChapter={nav.chapter}
        currentUser={auth.currentUser}
      />
    </div>
  );
}