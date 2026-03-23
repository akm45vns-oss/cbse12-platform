import { useState } from "react";

export function useNavigation() {
  const [view, setView] = useState("auth");
  const [subject, setSubject] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [viewStack, setViewStack] = useState(["auth"]);

  const nav = (v) => {
    setView(v);
    setViewStack(s => [...s, v]);
  };

  const goBack = () => {
    if (viewStack.length <= 1) return;
    const newStack = viewStack.slice(0, -1);
    setViewStack(newStack);
    setView(newStack[newStack.length - 1]);
  };

  const resetNav = () => {
    setView("auth");
    setViewStack(["auth"]);
    setSubject(null);
    setChapter(null);
  };

  const goToDashboard = () => {
    setView("dashboard");
    setViewStack(["auth", "dashboard"]);
    setSubject(null);
    setChapter(null);
  };

  return {
    view,
    setView,
    subject,
    setSubject,
    chapter,
    setChapter,
    viewStack,
    nav,
    goBack,
    resetNav,
    goToDashboard,
    canGoBack: viewStack.length > 2,
  };
}
