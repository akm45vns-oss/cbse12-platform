import { useState } from "react";

export function useNavigation() {
  const [view, setView] = useState("auth");
  const [subject, setSubject] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [viewStack, setViewStack] = useState(["auth"]);

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
