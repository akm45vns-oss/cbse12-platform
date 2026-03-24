import { useEffect } from "react";

export function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      
      // Don't trigger shortcuts if user is typing in an input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        if (key === "escape") {
          e.target.blur();
        }
        return;
      }

      // Check for matching shortcuts
      for (const shortcut of shortcuts) {
        const matches = 
          key === shortcut.key.toLowerCase() &&
          shortcut.ctrlKey === isCtrlOrCmd &&
          (shortcut.shift === undefined || shortcut.shift === e.shiftKey) &&
          (shortcut.alt === undefined || shortcut.alt === e.altKey);

        if (matches) {
          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}

export const QUIZ_SHORTCUTS = [
  { key: "ArrowRight", action: "nextQuestion", label: "→ Next Question" },
  { key: "ArrowLeft", action: "prevQuestion", label: "← Previous Question" },
  { key: "Enter", action: "submit", label: "↵ Submit Quiz" },
  { key: "?", action: "showHelp", label: "? Show Shortcuts" },
];

export const GLOBAL_SHORTCUTS = [
  { key: "/", action: "search", label: "/ Search (future)" },
  { key: "d", ctrlKey: true, action: "toggleDarkMode", label: "Ctrl+D Toggle Dark Mode" },
];
