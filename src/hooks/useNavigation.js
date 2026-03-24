import { useState } from "react";

export function useNavigation() {
  // Initialize state from localStorage
  const [view, setViewState] = useState(() => {
    try {
      return localStorage.getItem("akmedu_nav_view") || "auth";
    } catch {
      return "auth";
    }
  });

  const [subject, setSubjectState] = useState(() => {
    try {
      return localStorage.getItem("akmedu_nav_subject") || null;
    } catch {
      return null;
    }
  });

  const [chapter, setChapterState] = useState(() => {
    try {
      return localStorage.getItem("akmedu_nav_chapter") || null;
    } catch {
      return null;
    }
  });

  const [viewStack, setViewStackState] = useState(() => {
    try {
      const saved = localStorage.getItem("akmedu_nav_stack");
      return saved ? JSON.parse(saved) : ["auth"];
    } catch {
      return ["auth"];
    }
  });

  // Persist view changes
  const setView = (v) => {
    try {
      localStorage.setItem("akmedu_nav_view", v);
    } catch (e) {
      console.warn("Failed to persist view:", e);
    }
    setViewState(v);
  };

  // Persist subject changes
  const setSubject = (s) => {
    try {
      if (s) {
        localStorage.setItem("akmedu_nav_subject", s);
      } else {
        localStorage.removeItem("akmedu_nav_subject");
      }
    } catch (e) {
      console.warn("Failed to persist subject:", e);
    }
    setSubjectState(s);
  };

  // Persist chapter changes
  const setChapter = (c) => {
    try {
      if (c) {
        localStorage.setItem("akmedu_nav_chapter", c);
      } else {
        localStorage.removeItem("akmedu_nav_chapter");
      }
    } catch (e) {
      console.warn("Failed to persist chapter:", e);
    }
    setChapterState(c);
  };

  // Persist stack changes
  const setViewStack = (updater) => {
    const newStack = typeof updater === "function" ? updater(viewStack) : updater;
    try {
      localStorage.setItem("akmedu_nav_stack", JSON.stringify(newStack));
    } catch (e) {
      console.warn("Failed to persist view stack:", e);
    }
    setViewStackState(newStack);
  };

  const navigate = (v) => {
    setView(v);
    setViewStack(s => [...s, v]);
  };

  const navigateToSubject = (subj) => {
    setSubject(subj);
    setChapter(null);
    navigate("subject");
  };

  const navigateToChapter = (chap) => {
    setChapter(chap);
    navigate("chapter");
  };

  const goBack = () => {
    if (viewStack.length <= 1) return;
    const newStack = viewStack.slice(0, -1);
    setViewStack(newStack);
    setView(newStack[newStack.length - 1]);
  };

  const goToDashboard = () => {
    setView("dashboard");
    setViewStack(["auth", "dashboard"]);
    setSubject(null);
    setChapter(null);
  };

  return {
    view,
    subject,
    chapter,
    viewStack,
    navigate,
    navigateToSubject,
    navigateToChapter,
    goBack,
    goToDashboard,
    canGoBack: viewStack.length > 2,
  };
}
