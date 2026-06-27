import { useState, useCallback } from "react";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const ALLOWED_VIEWS = new Set([
  "auth",
  "dashboard",
  "subject",
  "chapter",
  "notes",
  "quiz",
  "paper",
  "progress",
  "profile",
  "stats",
  "leaderboard",
  "pipeline",
]);

// Views that are considered "root-level" — back from these triggers exit confirm
const ROOT_VIEWS = new Set(["dashboard", "auth"]);

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function sanitizeView(view) {
  if (ALLOWED_VIEWS.has(view)) return view;
  return "auth";
}

/**
 * Encode the current navigation state into a URL path so that
 * a browser refresh restores the correct screen.
 *
 * Examples:
 *   dashboard             → /
 *   subject (Physics)     → /subject/Physics
 *   chapter (Gravitation) → /subject/Physics/chapter/Gravitation
 *   notes                 → /subject/Physics/chapter/Gravitation/notes
 *   quiz                  → /subject/Physics/chapter/Gravitation/quiz
 *   progress              → /progress
 */
function buildPath(view, subject, chapter) {
  if (!view || view === "auth") return "/";
  if (view === "dashboard") return "/";
  if (view === "subject" && subject)
    return `/subject/${encodeURIComponent(subject)}`;
  if ((view === "chapter") && subject && chapter)
    return `/subject/${encodeURIComponent(subject)}/chapter/${encodeURIComponent(chapter)}`;
  if (["notes", "quiz"].includes(view) && subject && chapter)
    return `/subject/${encodeURIComponent(subject)}/chapter/${encodeURIComponent(chapter)}/${view}`;
  // Flat views: progress, stats, profile, leaderboard, pipeline, paper
  return `/${view}`;
}

/**
 * Parse a URL pathname back into { view, subject, chapter }.
 * Returns null for unknown / auth paths.
 */
function parsePath(pathname) {
  const parts = pathname.replace(/^\//, "").split("/");
  if (!parts[0] || parts[0] === "") return { view: "dashboard", subject: null, chapter: null };

  // /subject/:subj/chapter/:chap/:view
  if (parts[0] === "subject" && parts[2] === "chapter" && parts[4]) {
    const subj = decodeURIComponent(parts[1] || "");
    const chap = decodeURIComponent(parts[3] || "");
    const v = sanitizeView(parts[4]);
    return { view: v, subject: subj, chapter: chap };
  }
  // /subject/:subj/chapter/:chap
  if (parts[0] === "subject" && parts[2] === "chapter") {
    const subj = decodeURIComponent(parts[1] || "");
    const chap = decodeURIComponent(parts[3] || "");
    return { view: "chapter", subject: subj, chapter: chap };
  }
  // /subject/:subj
  if (parts[0] === "subject") {
    const subj = decodeURIComponent(parts[1] || "");
    return { view: "subject", subject: subj, chapter: null };
  }
  // /progress, /stats, /profile, /leaderboard, /pipeline, /paper
  const v = sanitizeView(parts[0]);
  return { view: v, subject: null, chapter: null };
}

/**
 * Build the state object stored with each history entry.
 */
function buildHistoryState(view, subject, chapter, stackIndex) {
  return { view, subject, chapter, stackIndex, __akmedu: true };
}

/**
 * Check whether the top of the internal stack matches the given state,
 * to avoid duplicate pushes.
 */
function isDuplicate(stack, view, subject, chapter) {
  if (!stack.length) return false;
  const top = stack[stack.length - 1];
  return top.view === view && top.subject === subject && top.chapter === chapter;
}

// ─────────────────────────────────────────────
// Persistence helpers (localStorage)
// ─────────────────────────────────────────────
const LS_KEYS = {
  view: "akmedu_nav_view",
  subject: "akmedu_nav_subject",
  chapter: "akmedu_nav_chapter",
  stack: "akmedu_nav_stack",
};

function lsGet(key, fallback = null) {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? v : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key, value) {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
    }
  } catch (e) {
    console.warn("[Nav] localStorage write failed:", e);
  }
}

// ─────────────────────────────────────────────
// Debug logger
// ─────────────────────────────────────────────
function navDebug(action, currentView, stack, previousView) {
  if (typeof window !== "undefined" && window.__NAV_DEBUG !== false) {
    console.log(
      `%c[Nav] ${action}`,
      "color:#4f46e5;font-weight:bold",
      {
        currentView,
        stackLength: stack.length,
        previousView: previousView || (stack.length > 1 ? stack[stack.length - 2]?.view : "—"),
        stack: stack.map((s) => s.view),
      }
    );
  }
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────
export function useNavigation() {
  // ── Initial state: try to restore from URL path first, then localStorage ──
  const [navState, setNavState] = useState(() => {
    try {
      // 1. Try URL-based restore (handles refresh)
      const parsed = parsePath(window.location.pathname);
      const urlView = parsed.view;

      if (urlView && urlView !== "auth") {
        // Restore stack from localStorage as well so depth is preserved
        let savedStack;
        try {
          savedStack = JSON.parse(lsGet(LS_KEYS.stack, "null"));
        } catch {
          savedStack = null;
        }

        // Build a minimal stack: [dashboard, <restored frames…>]
        const restoredStack = savedStack && Array.isArray(savedStack) && savedStack.length > 0
          ? savedStack
          : [{ view: "dashboard", subject: null, chapter: null, scrollY: 0 }];

        // Ensure the top of the stack matches the URL
        const topFrame = restoredStack[restoredStack.length - 1];
        if (
          topFrame.view !== urlView ||
          topFrame.subject !== parsed.subject ||
          topFrame.chapter !== parsed.chapter
        ) {
          restoredStack.push({
            view: urlView,
            subject: parsed.subject,
            chapter: parsed.chapter,
            scrollY: 0,
          });
        }

        return {
          view: urlView,
          subject: parsed.subject,
          chapter: parsed.chapter,
          stack: restoredStack,
        };
      }
    } catch {
      // fall through
    }

    // 2. Fallback: localStorage
    const view = sanitizeView(lsGet(LS_KEYS.view, "auth"));
    const subject = lsGet(LS_KEYS.subject);
    const chapter = lsGet(LS_KEYS.chapter);
    let stack;
    try {
      stack = JSON.parse(lsGet(LS_KEYS.stack, "null")) || [{ view, subject, chapter, scrollY: 0 }];
    } catch {
      stack = [{ view, subject, chapter, scrollY: 0 }];
    }
    return { view, subject, chapter, stack };
  });

  const { view, subject, chapter, stack } = navState;

  // ── Internal state updater ──
  const applyState = useCallback((nextView, nextSubject, nextChapter, nextStack) => {
    // Persist to localStorage
    lsSet(LS_KEYS.view, nextView);
    lsSet(LS_KEYS.subject, nextSubject || null);
    lsSet(LS_KEYS.chapter, nextChapter || null);
    lsSet(LS_KEYS.stack, nextStack);

    setNavState({
      view: nextView,
      subject: nextSubject || null,
      chapter: nextChapter || null,
      stack: nextStack,
    });
  }, []);

  // ─────────────────────────────────────────────
  // navigate(view, options)
  //   options: { subject, chapter }
  // ─────────────────────────────────────────────
  const navigate = useCallback(
    (nextView, options = {}) => {
      const v = sanitizeView(nextView);
      const subj = options.subject !== undefined ? options.subject : subject;
      const chap = options.chapter !== undefined ? options.chapter : chapter;

      // Save scroll position for the current frame before leaving
      const scrollY = window.scrollY || 0;
      const updatedStack = stack.map((frame, i) =>
        i === stack.length - 1 ? { ...frame, scrollY } : frame
      );

      // Prevent duplicate pushes
      if (isDuplicate(updatedStack, v, subj, chap)) {
        navDebug("navigate (duplicate, skipped)", v, updatedStack, null);
        return;
      }

      const newFrame = { view: v, subject: subj, chapter: chap, scrollY: 0 };
      const newStack = [...updatedStack, newFrame];

      // Sync browser history — pushState adds an entry the browser can pop
      const path = buildPath(v, subj, chap);
      const histState = buildHistoryState(v, subj, chap, newStack.length - 1);
      window.history.pushState(histState, "", path);

      navDebug("navigate", v, newStack, stack[stack.length - 1]?.view);
      applyState(v, subj, chap, newStack);
    },
    [view, subject, chapter, stack, applyState]
  );

  // ─────────────────────────────────────────────
  // navigateToSubject / navigateToChapter
  // ─────────────────────────────────────────────
  const navigateToSubject = useCallback(
    (subj) => navigate("subject", { subject: subj, chapter: null }),
    [navigate]
  );

  const navigateToChapter = useCallback(
    (chap) => navigate("chapter", { chapter: chap }),
    [navigate]
  );

  // ─────────────────────────────────────────────
  // goBack() — internal stack pop
  // ─────────────────────────────────────────────
  const goBack = useCallback(() => {
    if (stack.length <= 1) {
      // Already at root — stay on dashboard
      navDebug("goBack (at root, staying)", view, stack, null);
      return false; // caller can use this to show exit confirm
    }

    const newStack = stack.slice(0, -1);
    const prevFrame = newStack[newStack.length - 1];
    const { view: prevView, subject: prevSubj, chapter: prevChap, scrollY } = prevFrame;

    // Sync browser history — replace current entry so popstate doesn't re-fire
    const path = buildPath(prevView, prevSubj, prevChap);
    const histState = buildHistoryState(prevView, prevSubj, prevChap, newStack.length - 1);
    window.history.replaceState(histState, "", path);

    navDebug("goBack", prevView, newStack, view);
    applyState(prevView, prevSubj, prevChap, newStack);

    // Restore scroll position
    if (typeof scrollY === "number") {
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, left: 0, behavior: "auto" });
      });
    }

    return true; // navigation happened
  }, [view, stack, applyState]);

  // ─────────────────────────────────────────────
  // canGoBack — true when there's a non-root frame to pop to
  // ─────────────────────────────────────────────
  const canGoBack = stack.length > 1 && !ROOT_VIEWS.has(view);

  // ─────────────────────────────────────────────
  // goToDashboard — reset to dashboard
  // ─────────────────────────────────────────────
  const goToDashboard = useCallback(() => {
    const newStack = [{ view: "dashboard", subject: null, chapter: null, scrollY: 0 }];
    window.history.replaceState(
      buildHistoryState("dashboard", null, null, 0),
      "",
      "/"
    );
    navDebug("goToDashboard", "dashboard", newStack, view);
    applyState("dashboard", null, null, newStack);
  }, [view, applyState]);

  // ─────────────────────────────────────────────
  // isAtRoot — true if current view is root-level
  // ─────────────────────────────────────────────
  const isAtRoot = ROOT_VIEWS.has(view) || stack.length <= 1;

  return {
    view,
    subject,
    chapter,
    viewStack: stack,           // kept for backwards compat with App.jsx
    navigate,
    navigateToSubject,
    navigateToChapter,
    goBack,
    goToDashboard,
    canGoBack,
    isAtRoot,
  };
}
