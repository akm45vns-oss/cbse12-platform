import { useState, useEffect } from "react";

export function useTheme() {
  const [isDarkMode, setIsDarkModeState] = useState(() => {
    try {
      const saved = localStorage.getItem("akmedu_theme");
      if (saved) return saved === "dark";
      // Check system preference
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  const setIsDarkMode = (value) => {
    try {
      const isDark = typeof value === "function" ? value(isDarkMode) : value;
      localStorage.setItem("akmedu_theme", isDark ? "dark" : "light");
      setIsDarkModeState(isDark);
      // Update document class
      if (isDark) {
        document.documentElement.classList.add("dark-mode");
      } else {
        document.documentElement.classList.remove("dark-mode");
      }
    } catch (e) {
      console.warn("Failed to persist theme:", e);
    }
  };

  // Apply theme on mount
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-mode");
    }
  }, [isDarkMode]);

  return {
    isDarkMode,
    setIsDarkMode,
    toggleTheme: () => setIsDarkMode(!isDarkMode),
  };
}
